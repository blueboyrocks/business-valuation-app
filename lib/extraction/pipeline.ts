/**
 * Unified Extraction Pipeline Orchestrator
 * PRD-H: Robust PDF Extraction Pipeline
 *
 * Orchestrates all extraction stages:
 * - Stage 1: Modal/pdfplumber deterministic extraction
 * - Stage 2: Haiku classification and schema mapping
 * - Stage 3: Sonnet/Opus validation and enrichment
 *
 * Handles:
 * - Progress events via callback
 * - Partial failures (continue with successful stages)
 * - Retry logic with exponential backoff
 * - Scanned PDF detection and Claude Vision fallback flag
 */

import {
  Stage1Output,
  Stage2Output,
  FinalExtractionOutput,
  PipelineProgressEvent,
  PipelineProgressCallback,
  ModalExtractionResponse,
} from './types';
import { extractPdfWithRetry } from './modal-client';
import { classifyDocument } from './classifier';
import { mapToSchema } from './schema-mapper';
import { validateExtraction } from './validator';
import { validateWithAI } from './ai-validator';
import { calculateConfidence, ESCALATION_THRESHOLDS } from './confidence-scorer';

/**
 * Pipeline configuration
 */
export interface PipelineConfig {
  /** Maximum retries for each stage (default: 3) */
  maxRetries?: number;

  /** Skip AI validation (Stage 3) for faster processing */
  skipAiValidation?: boolean;

  /** Force Opus model for AI validation */
  forceOpus?: boolean;

  /** Progress callback for UI updates */
  onProgress?: PipelineProgressCallback;

  /** Modal extraction URL override */
  modalEndpointUrl?: string;
}

/**
 * Pipeline result
 */
export interface PipelineResult {
  success: boolean;
  stage1Output: Stage1Output | null;
  stage2Output: Stage2Output | null;
  finalOutput: FinalExtractionOutput | null;
  error: string | null;
  isScanned: boolean;
  needsClaudeVision: boolean;
  processingTimeMs: number;
  retryCount: number;
}

/**
 * Default pipeline configuration
 */
const DEFAULT_CONFIG: Required<Omit<PipelineConfig, 'onProgress' | 'modalEndpointUrl'>> = {
  maxRetries: 3,
  skipAiValidation: false,
  forceOpus: false,
};

/**
 * Generate a simple UUID
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Emit progress event
 */
function emitProgress(
  callback: PipelineProgressCallback | undefined,
  event: PipelineProgressEvent
): void {
  if (callback) {
    try {
      callback(event);
    } catch (error) {
      console.error('[Pipeline] Progress callback error:', error);
    }
  }
}

/**
 * Run Stage 1: Modal/pdfplumber extraction
 */
async function runStage1(
  pdfBuffer: Buffer,
  documentId: string,
  filename: string,
  config: PipelineConfig
): Promise<{
  success: boolean;
  data: Stage1Output | null;
  error: string | null;
  isScanned: boolean;
  needsClaudeVision: boolean;
  timeMs: number;
  retryCount: number;
}> {
  const startTime = Date.now();

  console.log(`[Pipeline] Stage 1 starting for document ${documentId}`);

  const result = await extractPdfWithRetry(
    pdfBuffer,
    documentId,
    filename,
    config.maxRetries ?? DEFAULT_CONFIG.maxRetries,
    config.modalEndpointUrl ? { endpointUrl: config.modalEndpointUrl } : undefined
  );

  const timeMs = Date.now() - startTime;
  console.log(`[Pipeline] Stage 1 completed in ${timeMs}ms`);

  if (result.success && result.data) {
    const isScanned = result.data.metadata.is_scanned ?? false;
    const needsClaudeVision = isScanned && (!result.data.raw_text || result.data.raw_text.length < 100);

    return {
      success: true,
      data: result.data,
      error: null,
      isScanned,
      needsClaudeVision,
      timeMs,
      retryCount: result.retryCount,
    };
  }

  return {
    success: false,
    data: null,
    error: result.error || 'Unknown Stage 1 error',
    isScanned: result.is_scanned ?? false,
    needsClaudeVision: result.is_scanned ?? false,
    timeMs,
    retryCount: result.retryCount,
  };
}

/**
 * Run Stage 2: Classification and schema mapping
 */
async function runStage2(
  stage1Output: Stage1Output,
  documentId: string
): Promise<{
  success: boolean;
  data: Stage2Output | null;
  error: string | null;
  timeMs: number;
}> {
  const startTime = Date.now();

  console.log(`[Pipeline] Stage 2 starting for document ${documentId}`);

  try {
    // Classify the document
    const classification = await classifyDocument(stage1Output);
    console.log(`[Pipeline] Classification: ${classification.document_type} (${classification.confidence})`);

    // Map to schema
    const stage2Output = await mapToSchema(stage1Output, classification);

    const timeMs = Date.now() - startTime;
    console.log(`[Pipeline] Stage 2 completed in ${timeMs}ms`);

    return {
      success: true,
      data: stage2Output,
      error: null,
      timeMs,
    };
  } catch (error) {
    const timeMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown Stage 2 error';
    console.error(`[Pipeline] Stage 2 error: ${errorMessage}`);

    return {
      success: false,
      data: null,
      error: errorMessage,
      timeMs,
    };
  }
}

/**
 * Run Stage 3: AI validation and enrichment
 */
async function runStage3(
  stage2Output: Stage2Output,
  documentId: string,
  stage1TimeMs: number,
  stage2TimeMs: number
): Promise<{
  success: boolean;
  data: FinalExtractionOutput | null;
  error: string | null;
  timeMs: number;
}> {
  const startTime = Date.now();

  console.log(`[Pipeline] Stage 3 starting for document ${documentId}`);

  try {
    // Run validation rules
    const validationResults = validateExtraction(stage2Output);
    console.log(`[Pipeline] Validation: ${validationResults.errorCount} errors, ${validationResults.warningCount} warnings`);

    // Run AI validation
    const finalOutput = await validateWithAI(
      stage2Output,
      validationResults.results,
      stage1TimeMs,
      stage2TimeMs
    );

    const timeMs = Date.now() - startTime;
    console.log(`[Pipeline] Stage 3 completed in ${timeMs}ms`);

    return {
      success: true,
      data: finalOutput,
      error: null,
      timeMs,
    };
  } catch (error) {
    const timeMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown Stage 3 error';
    console.error(`[Pipeline] Stage 3 error: ${errorMessage}`);

    return {
      success: false,
      data: null,
      error: errorMessage,
      timeMs,
    };
  }
}

/**
 * Create basic FinalExtractionOutput from Stage2Output (without AI validation)
 */
function createBasicFinalOutput(
  stage2Output: Stage2Output,
  stage1TimeMs: number,
  stage2TimeMs: number
): FinalExtractionOutput {
  const validationResults = validateExtraction(stage2Output);
  const confidenceScore = calculateConfidence(stage2Output, validationResults.results);

  const taxYear = stage2Output.classification.tax_year || 'Unknown';
  const errorCount = validationResults.errorCount;
  const warningCount = validationResults.warningCount;

  return {
    extraction_id: generateUUID(),
    created_at: new Date().toISOString(),
    documents: [
      {
        document_id: stage2Output.document_id,
        filename: 'extracted_document',
        document_type: stage2Output.classification.document_type,
        tax_year: taxYear,
        pages: 0,
      },
    ],
    company_info: {
      name: stage2Output.classification.entity_name || 'Unknown Entity',
      entity_type: 'LLC',
      ein: null,
      address: { street: null, city: null, state: null, zip: null },
      fiscal_year_end: '12/31',
    },
    financial_data: {
      [taxYear]: {
        revenue: stage2Output.structured_data?.income_statement?.gross_receipts ?? 0,
        returns_allowances: stage2Output.structured_data?.income_statement?.returns_allowances ?? 0,
        net_revenue: (stage2Output.structured_data?.income_statement?.gross_receipts ?? 0) -
          (stage2Output.structured_data?.income_statement?.returns_allowances ?? 0),
        cost_of_goods_sold: stage2Output.structured_data?.income_statement?.cost_of_goods_sold ?? 0,
        gross_profit: stage2Output.structured_data?.income_statement?.gross_profit ?? 0,
        other_income: stage2Output.structured_data?.income_statement?.other_income ?? 0,
        net_gain_form_4797: 0,
        total_income: stage2Output.structured_data?.income_statement?.total_income ?? 0,
        total_operating_expenses: stage2Output.structured_data?.expenses?.total_deductions ?? 0,
        operating_income: 0,
        net_income: stage2Output.structured_data?.income_statement?.total_income ?? 0,
        cogs_detail: stage2Output.structured_data?.cogs_detail ?? null,
        expenses: stage2Output.structured_data?.expenses ?? {
          officer_compensation: 0, salaries_wages: 0, rent: 0, taxes_licenses: 0,
          interest: 0, depreciation: 0, amortization: 0, insurance: 0,
          repairs_maintenance: 0, bad_debts: 0, advertising: 0, employee_benefits: 0,
          pension_plans: 0, legal_professional: 0, office_expense: 0, travel: 0,
          meals_entertainment: 0, utilities: 0, other_deductions: 0, total_deductions: 0,
        },
        balance_sheet: stage2Output.structured_data?.balance_sheet ?? {
          boy_cash: 0, boy_accounts_receivable: 0, boy_inventory: 0, boy_loans_to_shareholders: 0,
          boy_other_current_assets: 0, boy_total_current_assets: 0, boy_land: 0, boy_buildings: 0,
          boy_machinery_equipment: 0, boy_accumulated_depreciation: 0, boy_total_fixed_assets: 0,
          boy_other_assets: 0, boy_total_assets: 0, boy_accounts_payable: 0, boy_short_term_debt: 0,
          boy_other_current_liabilities: 0, boy_total_current_liabilities: 0, boy_long_term_debt: 0,
          boy_loans_from_shareholders: 0, boy_other_liabilities: 0, boy_total_liabilities: 0,
          boy_common_stock: 0, boy_additional_paid_in_capital: 0, boy_retained_earnings: 0,
          boy_total_equity: 0, eoy_cash: 0, eoy_accounts_receivable: 0, eoy_inventory: 0,
          eoy_loans_to_shareholders: 0, eoy_other_current_assets: 0, eoy_total_current_assets: 0,
          eoy_land: 0, eoy_buildings: 0, eoy_machinery_equipment: 0, eoy_accumulated_depreciation: 0,
          eoy_total_fixed_assets: 0, eoy_other_assets: 0, eoy_total_assets: 0, eoy_accounts_payable: 0,
          eoy_short_term_debt: 0, eoy_other_current_liabilities: 0, eoy_total_current_liabilities: 0,
          eoy_long_term_debt: 0, eoy_loans_from_shareholders: 0, eoy_other_liabilities: 0,
          eoy_total_liabilities: 0, eoy_common_stock: 0, eoy_additional_paid_in_capital: 0,
          eoy_retained_earnings: 0, eoy_total_equity: 0,
        },
        schedule_k: stage2Output.structured_data?.schedule_k ?? null,
        schedule_m1: stage2Output.structured_data?.schedule_m1 ?? null,
        guaranteed_payments: stage2Output.structured_data?.guaranteed_payments ?? null,
        covid_adjustments: stage2Output.structured_data?.covid_adjustments ?? null,
        red_flags: stage2Output.structured_data?.red_flags ?? {
          has_loans_to_shareholders: false, loans_to_shareholders_amount: 0,
          negative_retained_earnings: false, other_income_percent: 0,
          other_deductions_percent: 0, distributions_exceed_net_income: false,
          distributions_vs_net_income_ratio: 0, revenue_yoy_change_percent: null,
          revenue_decline_flag: false,
        },
        source_document: 'extraction',
        extraction_confidence: confidenceScore.overall,
      },
    },
    trend_analysis: null,
    validation: {
      status: errorCount > 0 ? 'errors' : warningCount > 0 ? 'warnings' : 'passed',
      error_count: errorCount,
      warning_count: warningCount,
      info_count: validationResults.infoCount,
      issues: validationResults.results,
      corrections_applied: [],
      red_flags_detected: [],
    },
    processing: {
      total_time_ms: stage1TimeMs + stage2TimeMs,
      stage1_time_ms: stage1TimeMs,
      stage2_time_ms: stage2TimeMs,
      stage3_time_ms: 0,
      model_used: 'haiku',
      escalated_to_opus: false,
      escalation_reason: null,
      retry_count: 0,
    },
    ready_for_valuation: errorCount === 0,
    blocking_issues: validationResults.blockers.map((b) => b.message),
    suggested_sde_addbacks: {
      officer_compensation: stage2Output.structured_data?.expenses?.officer_compensation ?? 0,
      guaranteed_payments: stage2Output.structured_data?.guaranteed_payments?.total ?? 0,
      depreciation: stage2Output.structured_data?.expenses?.depreciation ?? 0,
      amortization: stage2Output.structured_data?.expenses?.amortization ?? 0,
      interest: stage2Output.structured_data?.expenses?.interest ?? 0,
      section_179_deduction: stage2Output.structured_data?.schedule_k?.section_179_deduction ?? 0,
      non_recurring_gains_excluded: 0,
      owner_benefits: 0,
      total_suggested_addbacks: 0,
      notes: ['Basic SDE calculation (no AI enrichment)'],
    },
  };
}

/**
 * Main extraction pipeline function
 *
 * Orchestrates all extraction stages for a single document.
 *
 * @param pdfBuffer - PDF file as Buffer
 * @param documentId - Unique document identifier
 * @param filename - Original filename
 * @param config - Pipeline configuration
 * @returns PipelineResult with all outputs
 */
export async function extractDocumentPipeline(
  pdfBuffer: Buffer,
  documentId: string,
  filename: string,
  config: PipelineConfig = {}
): Promise<PipelineResult> {
  const totalStartTime = Date.now();
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  console.log(`[Pipeline] Starting extraction for ${filename} (${documentId})`);

  // Stage 1: Modal extraction
  emitProgress(config.onProgress, { stage: 'stage1', status: 'starting', document_id: documentId });

  const stage1Result = await runStage1(pdfBuffer, documentId, filename, config);

  emitProgress(config.onProgress, { stage: 'stage1', status: 'complete', document_id: documentId });

  if (!stage1Result.success || !stage1Result.data) {
    emitProgress(config.onProgress, {
      stage: 'error',
      error: stage1Result.error || 'Stage 1 failed',
      document_id: documentId,
    });

    return {
      success: false,
      stage1Output: null,
      stage2Output: null,
      finalOutput: null,
      error: stage1Result.error,
      isScanned: stage1Result.isScanned,
      needsClaudeVision: stage1Result.needsClaudeVision,
      processingTimeMs: Date.now() - totalStartTime,
      retryCount: stage1Result.retryCount,
    };
  }

  // Check if we need Claude Vision fallback
  if (stage1Result.needsClaudeVision) {
    console.log('[Pipeline] Scanned PDF detected, OCR failed. Claude Vision fallback recommended.');
    // Return early with flag - caller can decide to use Claude Vision
    return {
      success: false,
      stage1Output: stage1Result.data,
      stage2Output: null,
      finalOutput: null,
      error: 'Scanned PDF with insufficient OCR text - Claude Vision fallback recommended',
      isScanned: true,
      needsClaudeVision: true,
      processingTimeMs: Date.now() - totalStartTime,
      retryCount: stage1Result.retryCount,
    };
  }

  // Stage 2: Classification and mapping
  emitProgress(config.onProgress, { stage: 'stage2', status: 'starting', document_id: documentId });

  const stage2Result = await runStage2(stage1Result.data, documentId);

  emitProgress(config.onProgress, { stage: 'stage2', status: 'complete', document_id: documentId });

  if (!stage2Result.success || !stage2Result.data) {
    emitProgress(config.onProgress, {
      stage: 'error',
      error: stage2Result.error || 'Stage 2 failed',
      document_id: documentId,
    });

    return {
      success: false,
      stage1Output: stage1Result.data,
      stage2Output: null,
      finalOutput: null,
      error: stage2Result.error,
      isScanned: stage1Result.isScanned,
      needsClaudeVision: false,
      processingTimeMs: Date.now() - totalStartTime,
      retryCount: stage1Result.retryCount,
    };
  }

  // Stage 3: AI validation (optional)
  if (mergedConfig.skipAiValidation) {
    console.log('[Pipeline] Skipping AI validation per config');

    const basicOutput = createBasicFinalOutput(
      stage2Result.data,
      stage1Result.timeMs,
      stage2Result.timeMs
    );

    emitProgress(config.onProgress, { stage: 'complete', extraction_id: basicOutput.extraction_id });

    return {
      success: true,
      stage1Output: stage1Result.data,
      stage2Output: stage2Result.data,
      finalOutput: basicOutput,
      error: null,
      isScanned: stage1Result.isScanned,
      needsClaudeVision: false,
      processingTimeMs: Date.now() - totalStartTime,
      retryCount: stage1Result.retryCount,
    };
  }

  emitProgress(config.onProgress, { stage: 'stage3', status: 'starting', document_id: documentId });

  const stage3Result = await runStage3(
    stage2Result.data,
    documentId,
    stage1Result.timeMs,
    stage2Result.timeMs
  );

  emitProgress(config.onProgress, { stage: 'stage3', status: 'complete', document_id: documentId });

  if (!stage3Result.success || !stage3Result.data) {
    // Stage 3 failed but we have Stage 2 data - create basic output
    console.log('[Pipeline] Stage 3 failed, using basic output');

    const basicOutput = createBasicFinalOutput(
      stage2Result.data,
      stage1Result.timeMs,
      stage2Result.timeMs
    );

    emitProgress(config.onProgress, { stage: 'complete', extraction_id: basicOutput.extraction_id });

    return {
      success: true, // Partial success
      stage1Output: stage1Result.data,
      stage2Output: stage2Result.data,
      finalOutput: basicOutput,
      error: `Stage 3 warning: ${stage3Result.error}`,
      isScanned: stage1Result.isScanned,
      needsClaudeVision: false,
      processingTimeMs: Date.now() - totalStartTime,
      retryCount: stage1Result.retryCount,
    };
  }

  emitProgress(config.onProgress, { stage: 'complete', extraction_id: stage3Result.data.extraction_id });

  console.log(`[Pipeline] Extraction complete. Total time: ${Date.now() - totalStartTime}ms`);

  return {
    success: true,
    stage1Output: stage1Result.data,
    stage2Output: stage2Result.data,
    finalOutput: stage3Result.data,
    error: null,
    isScanned: stage1Result.isScanned,
    needsClaudeVision: false,
    processingTimeMs: Date.now() - totalStartTime,
    retryCount: stage1Result.retryCount,
  };
}

/**
 * Extract multiple documents in sequence
 */
export async function extractMultipleDocuments(
  documents: Array<{ pdfBuffer: Buffer; documentId: string; filename: string }>,
  config: PipelineConfig = {}
): Promise<PipelineResult[]> {
  const results: PipelineResult[] = [];

  for (const doc of documents) {
    const result = await extractDocumentPipeline(
      doc.pdfBuffer,
      doc.documentId,
      doc.filename,
      config
    );
    results.push(result);
  }

  return results;
}
