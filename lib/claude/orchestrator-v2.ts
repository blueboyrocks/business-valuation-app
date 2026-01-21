/**
 * 12-Pass Valuation Pipeline Orchestrator (v2)
 *
 * Chains all 12 passes together with:
 * - Sequential execution with dependency management
 * - Dynamic knowledge injection for each pass
 * - Database persistence after each pass
 * - Retry logic with exponential backoff
 * - Comprehensive token and cost tracking
 * - Progress callbacks for UI updates
 *
 * Passes:
 * 1-3:  Data Extraction (uses PDF documents)
 * 4-6:  Analysis (uses prior pass outputs)
 * 7-9:  Valuation Approaches (uses prior pass outputs)
 * 10-12: Synthesis & Review (uses all prior pass outputs)
 */

import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '../supabase/server';
import {
  TwelvePassOrchestrationResult,
  TwelvePassFinalReport,
  PassMetrics,
  PassOutput,
  Pass1Output,
  Pass2Output,
  Pass3Output,
  Pass4Output,
  Pass5Output,
  Pass6Output,
  Pass7Output,
  Pass8Output,
  Pass9Output,
  Pass10Output,
  Pass11Output,
  Pass12Output,
  CompanyProfile,
  ExecutiveSummary,
  ReportNarratives,
} from './types-v2';

import { getPromptConfig, PASS_METADATA } from './prompts-v2';

import {
  CAPITALIZATION_RATE_DATA,
  DLOM_STUDIES,
  VALUATION_STANDARDS,
  COMMON_ADDBACKS_DETAILED,
  WORKING_CAPITAL_BENCHMARKS,
  SECTOR_MULTIPLES,
  DETAILED_INDUSTRY_MULTIPLES,
  RISK_ASSESSMENT_FRAMEWORK,
  TAX_FORM_EXTRACTION_GUIDE,
  getSizePremium,
  getIndustryRiskPremium,
  getSuggestedDLOM,
  getWorkingCapitalBenchmark,
} from './embedded-knowledge';

import {
  transformToFinalReport,
  validateFinalReport,
  PassOutputs,
} from './transform-to-final-report';

import { FinalValuationReport } from './final-report-schema';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Claude Sonnet pricing (as of 2024) */
const PRICING = {
  inputTokensPer1M: 3.00,   // $3 per 1M input tokens
  outputTokensPer1M: 15.00, // $15 per 1M output tokens
};

/** Maximum retry attempts per pass */
const MAX_RETRIES = 2;

/** Model to use for all passes */
const MODEL = 'claude-sonnet-4-20250514';

/** Orchestrator version for tracking */
const ORCHESTRATOR_VERSION = '2.0.0';

/** Progress percentages for each pass */
const PASS_PROGRESS: Record<number, number> = {
  1: 5,
  2: 12,
  3: 18,
  4: 28,
  5: 38,
  6: 48,
  7: 55,
  8: 62,
  9: 69,
  10: 78,
  11: 88,
  12: 100,
};

// =============================================================================
// TYPES
// =============================================================================

interface PassResult<T> {
  success: boolean;
  output: T | null;
  rawResponse: string;
  inputTokens: number;
  outputTokens: number;
  processingTime: number;
  error?: string;
  retryCount: number;
}

interface PassContext {
  reportId: string;
  pdfBase64: string[];
  passOutputs: Map<number, PassOutput>;
  onProgress?: (pass: number, message: string, percent: number) => void;
}

// =============================================================================
// MAIN ORCHESTRATION FUNCTION
// =============================================================================

/**
 * Run the complete 12-pass valuation pipeline
 *
 * @param reportId - Unique identifier for this valuation report
 * @param pdfBase64 - Array of base64 encoded PDF documents
 * @param onProgress - Optional callback for progress updates
 * @returns TwelvePassOrchestrationResult with final valuation or partial results on failure
 */
export async function runTwelvePassValuation(
  reportId: string,
  pdfBase64: string[],
  onProgress?: (pass: number, message: string, percent: number) => void
): Promise<TwelvePassOrchestrationResult> {
  const pipelineStartTime = Date.now();
  const startedAt = new Date().toISOString();
  const client = new Anthropic();
  const supabase = createServerClient();

  // Track pass outputs
  const passOutputs = new Map<number, PassOutput>();
  const passMetrics: PassMetrics[] = [];

  // Track total tokens
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalRetries = 0;

  // Context for passes
  const context: PassContext = {
    reportId,
    pdfBase64,
    passOutputs,
    onProgress,
  };

  console.log(`[12-PASS] ========================================`);
  console.log(`[12-PASS] Starting 12-Pass Valuation Pipeline`);
  console.log(`[12-PASS] Report ID: ${reportId}`);
  console.log(`[12-PASS] Documents: ${pdfBase64.length} PDF(s)`);
  console.log(`[12-PASS] ========================================`);

  try {
    // =========================================================================
    // PASS 1-3: Data Extraction (per-document processing to avoid 100-page limit)
    // =========================================================================
    const extractionResults = await runExtractionPassesWithPerDocumentProcessing(
      client, supabase, context
    );

    // Validate Pass 1
    const pass1Result = extractionResults.pass1;
    if (!pass1Result.success) throw createPassError(1, pass1Result.error);
    updateMetrics(pass1Result, passMetrics, 0, 0, 0);

    // Validate Pass 2
    const pass2Result = extractionResults.pass2;
    if (!pass2Result.success) throw createPassError(2, pass2Result.error);
    updateMetrics(pass2Result, passMetrics, pass1Result.inputTokens, pass1Result.outputTokens, pass1Result.retryCount);

    // Validate Pass 3
    const pass3Result = extractionResults.pass3;
    if (!pass3Result.success) throw createPassError(3, pass3Result.error);
    updateMetrics(pass3Result, passMetrics, pass1Result.inputTokens + pass2Result.inputTokens, pass1Result.outputTokens + pass2Result.outputTokens, pass1Result.retryCount + pass2Result.retryCount);

    // Update total tokens
    totalInputTokens = extractionResults.totalInputTokens;
    totalOutputTokens = extractionResults.totalOutputTokens;
    totalRetries = extractionResults.totalRetries;

    // =========================================================================
    // PASS 4: Industry Analysis
    // =========================================================================
    const pass4Result = await executePassWithLogging<Pass4Output>(
      client, supabase, context, 4,
      () => buildPass4Request(pass1Result.output!, pass2Result.output!, pass3Result.output!),
      'Industry Analysis'
    );
    if (!pass4Result.success) throw createPassError(4, pass4Result.error);
    updateMetrics(pass4Result, passMetrics, totalInputTokens, totalOutputTokens, totalRetries);
    totalInputTokens += pass4Result.inputTokens;
    totalOutputTokens += pass4Result.outputTokens;
    totalRetries += pass4Result.retryCount;
    passOutputs.set(4, pass4Result.output!);

    // =========================================================================
    // PASS 5: Earnings Normalization
    // =========================================================================
    const pass5Result = await executePassWithLogging<Pass5Output>(
      client, supabase, context, 5,
      () => buildPass5Request(pass1Result.output!, pass2Result.output!, pass3Result.output!, pass4Result.output!),
      'Earnings Normalization'
    );
    if (!pass5Result.success) throw createPassError(5, pass5Result.error);
    updateMetrics(pass5Result, passMetrics, totalInputTokens, totalOutputTokens, totalRetries);
    totalInputTokens += pass5Result.inputTokens;
    totalOutputTokens += pass5Result.outputTokens;
    totalRetries += pass5Result.retryCount;
    passOutputs.set(5, pass5Result.output!);

    // =========================================================================
    // PASS 6: Risk Assessment
    // =========================================================================
    const pass6Result = await executePassWithLogging<Pass6Output>(
      client, supabase, context, 6,
      () => buildPass6Request(pass1Result.output!, pass2Result.output!, pass3Result.output!, pass4Result.output!, pass5Result.output!),
      'Risk Assessment'
    );
    if (!pass6Result.success) throw createPassError(6, pass6Result.error);
    updateMetrics(pass6Result, passMetrics, totalInputTokens, totalOutputTokens, totalRetries);
    totalInputTokens += pass6Result.inputTokens;
    totalOutputTokens += pass6Result.outputTokens;
    totalRetries += pass6Result.retryCount;
    passOutputs.set(6, pass6Result.output!);

    // =========================================================================
    // PASS 7: Asset Approach Valuation
    // =========================================================================
    const pass7Result = await executePassWithLogging<Pass7Output>(
      client, supabase, context, 7,
      () => buildPass7Request(pass3Result.output!, pass4Result.output!, pass6Result.output!),
      'Asset Approach'
    );
    if (!pass7Result.success) throw createPassError(7, pass7Result.error);
    updateMetrics(pass7Result, passMetrics, totalInputTokens, totalOutputTokens, totalRetries);
    totalInputTokens += pass7Result.inputTokens;
    totalOutputTokens += pass7Result.outputTokens;
    totalRetries += pass7Result.retryCount;
    passOutputs.set(7, pass7Result.output!);

    // =========================================================================
    // PASS 8: Income Approach Valuation
    // =========================================================================
    const pass8Result = await executePassWithLogging<Pass8Output>(
      client, supabase, context, 8,
      () => buildPass8Request(pass3Result.output!, pass4Result.output!, pass5Result.output!, pass6Result.output!),
      'Income Approach'
    );
    if (!pass8Result.success) throw createPassError(8, pass8Result.error);
    updateMetrics(pass8Result, passMetrics, totalInputTokens, totalOutputTokens, totalRetries);
    totalInputTokens += pass8Result.inputTokens;
    totalOutputTokens += pass8Result.outputTokens;
    totalRetries += pass8Result.retryCount;
    passOutputs.set(8, pass8Result.output!);

    // =========================================================================
    // PASS 9: Market Approach Valuation
    // =========================================================================
    const pass9Result = await executePassWithLogging<Pass9Output>(
      client, supabase, context, 9,
      () => buildPass9Request(pass1Result.output!, pass4Result.output!, pass5Result.output!, pass6Result.output!),
      'Market Approach'
    );
    if (!pass9Result.success) throw createPassError(9, pass9Result.error);
    updateMetrics(pass9Result, passMetrics, totalInputTokens, totalOutputTokens, totalRetries);
    totalInputTokens += pass9Result.inputTokens;
    totalOutputTokens += pass9Result.outputTokens;
    totalRetries += pass9Result.retryCount;
    passOutputs.set(9, pass9Result.output!);

    // =========================================================================
    // PASS 10: Value Synthesis & Reconciliation
    // =========================================================================
    const pass10Result = await executePassWithLogging<Pass10Output>(
      client, supabase, context, 10,
      () => buildPass10Request(
        pass1Result.output!, pass3Result.output!, pass4Result.output!, pass5Result.output!, pass6Result.output!,
        pass7Result.output!, pass8Result.output!, pass9Result.output!
      ),
      'Value Synthesis'
    );
    if (!pass10Result.success) throw createPassError(10, pass10Result.error);
    updateMetrics(pass10Result, passMetrics, totalInputTokens, totalOutputTokens, totalRetries);
    totalInputTokens += pass10Result.inputTokens;
    totalOutputTokens += pass10Result.outputTokens;
    totalRetries += pass10Result.retryCount;
    passOutputs.set(10, pass10Result.output!);

    // =========================================================================
    // PASS 11: Executive Summary & Narratives
    // =========================================================================
    const pass11Result = await executePassWithLogging<Pass11Output>(
      client, supabase, context, 11,
      () => buildPass11Request(
        pass1Result.output!, pass2Result.output!, pass3Result.output!, pass4Result.output!,
        pass5Result.output!, pass6Result.output!, pass7Result.output!, pass8Result.output!,
        pass9Result.output!, pass10Result.output!
      ),
      'Narratives Generation'
    );
    if (!pass11Result.success) throw createPassError(11, pass11Result.error);
    updateMetrics(pass11Result, passMetrics, totalInputTokens, totalOutputTokens, totalRetries);
    totalInputTokens += pass11Result.inputTokens;
    totalOutputTokens += pass11Result.outputTokens;
    totalRetries += pass11Result.retryCount;
    passOutputs.set(11, pass11Result.output!);

    // =========================================================================
    // PASS 12: Quality Review & Error Correction
    // =========================================================================
    const pass12Result = await executePassWithLogging<Pass12Output>(
      client, supabase, context, 12,
      () => buildPass12Request(
        pass1Result.output!, pass2Result.output!, pass3Result.output!, pass4Result.output!,
        pass5Result.output!, pass6Result.output!, pass7Result.output!, pass8Result.output!,
        pass9Result.output!, pass10Result.output!, pass11Result.output!
      ),
      'Quality Review'
    );
    if (!pass12Result.success) throw createPassError(12, pass12Result.error);
    updateMetrics(pass12Result, passMetrics, totalInputTokens, totalOutputTokens, totalRetries);
    totalInputTokens += pass12Result.inputTokens;
    totalOutputTokens += pass12Result.outputTokens;
    totalRetries += pass12Result.retryCount;
    passOutputs.set(12, pass12Result.output!);

    // =========================================================================
    // BUILD FINAL REPORT
    // =========================================================================
    const completedAt = new Date().toISOString();
    const totalDuration = Date.now() - pipelineStartTime;
    const totalCost = calculateCost(totalInputTokens, totalOutputTokens);

    console.log(`[12-PASS] ========================================`);
    console.log(`[12-PASS] Pipeline Complete!`);
    console.log(`[12-PASS] Duration: ${(totalDuration / 1000).toFixed(1)}s`);
    console.log(`[12-PASS] Total Cost: $${totalCost.toFixed(4)}`);
    console.log(`[12-PASS] ========================================`);

    // Build PassOutputs for transformation
    const allPassOutputs: PassOutputs = {
      pass1: pass1Result.output!,
      pass2: pass2Result.output!,
      pass3: pass3Result.output!,
      pass4: pass4Result.output!,
      pass5: pass5Result.output!,
      pass6: pass6Result.output!,
      pass7: pass7Result.output!,
      pass8: pass8Result.output!,
      pass9: pass9Result.output!,
      pass10: pass10Result.output!,
      pass11: pass11Result.output!,
      pass12: pass12Result.output!,
    };

    // Transform to FinalValuationReport schema (matches OUTPUT_SCHEMA.md)
    const valuationDate = pass10Result.output!.conclusion?.valuation_date ||
                          new Date().toISOString().split('T')[0];
    const finalValuationReport = transformToFinalReport(allPassOutputs, valuationDate);

    // Validate the final report
    const validation = validateFinalReport(finalValuationReport);
    if (!validation.valid) {
      console.warn(`[12-PASS] Final report validation errors:`, validation.errors);
    }
    if (validation.warnings.length > 0) {
      console.warn(`[12-PASS] Final report validation warnings:`, validation.warnings);
    }

    console.log(`[12-PASS] Final report validated: ${validation.valid ? 'PASSED' : 'FAILED'}`);
    console.log(`[12-PASS] Errors: ${validation.errors.length}, Warnings: ${validation.warnings.length}`);

    // Build legacy report format for backwards compatibility
    const legacyReport = buildFinalReport(
      reportId,
      pass1Result.output!,
      pass2Result.output!,
      pass3Result.output!,
      pass4Result.output!,
      pass5Result.output!,
      pass6Result.output!,
      pass7Result.output!,
      pass8Result.output!,
      pass9Result.output!,
      pass10Result.output!,
      pass11Result.output!,
      pass12Result.output!
    );

    // Save final report to database (using new schema format)
    await saveToDatabase(supabase, reportId, {
      report_status: 'completed',
      processing_progress: 100,
      processing_message: 'Valuation complete',
      report_data: finalValuationReport,
      // Also store legacy format for backwards compatibility
      legacy_report_data: legacyReport,
      validation_errors: validation.errors,
      validation_warnings: validation.warnings,
    });

    // Calculate metrics
    const avgDuration = passMetrics.reduce((sum, m) => sum + m.duration_ms, 0) / passMetrics.length;
    const slowestPass = passMetrics.reduce((prev, curr) => curr.duration_ms > prev.duration_ms ? curr : prev);
    const mostExpensive = passMetrics.reduce((prev, curr) => curr.cost_usd > prev.cost_usd ? curr : prev);

    return {
      success: true,
      pass_outputs: Array.from(passOutputs.values()),
      completed_passes: 12,
      total_passes: 12,
      final_report: legacyReport,
      final_valuation_report: finalValuationReport,
      validation_result: validation,
      metrics: {
        total_duration_ms: totalDuration,
        total_tokens_used: totalInputTokens + totalOutputTokens,
        total_cost_usd: totalCost,
        pass_metrics: passMetrics,
        average_pass_duration_ms: avgDuration,
        slowest_pass: {
          number: slowestPass.pass_number,
          name: slowestPass.pass_name,
          duration_ms: slowestPass.duration_ms,
        },
        most_expensive_pass: {
          number: mostExpensive.pass_number,
          name: mostExpensive.pass_name,
          cost_usd: mostExpensive.cost_usd,
        },
      },
      processing_info: {
        started_at: startedAt,
        completed_at: completedAt,
        model_version: MODEL,
        orchestrator_version: ORCHESTRATOR_VERSION,
        document_pages_processed: pdfBase64.length,
        retry_count: totalRetries,
      },
    };

  } catch (error) {
    // Handle pipeline failure
    const completedAt = new Date().toISOString();
    const totalDuration = Date.now() - pipelineStartTime;
    const totalCost = calculateCost(totalInputTokens, totalOutputTokens);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Extract pass number from error if available
    let failedPassNumber = passOutputs.size + 1;
    let failedPassName = PASS_METADATA[failedPassNumber as keyof typeof PASS_METADATA]?.name || 'Unknown';

    if (error instanceof PassError) {
      failedPassNumber = error.passNumber;
      failedPassName = PASS_METADATA[failedPassNumber as keyof typeof PASS_METADATA]?.name || 'Unknown';
    }

    console.error(`[12-PASS] Pipeline failed at Pass ${failedPassNumber}: ${errorMessage}`);

    // Save error state to database
    await saveToDatabase(supabase, reportId, {
      report_status: 'error',
      processing_progress: PASS_PROGRESS[failedPassNumber - 1] || 0,
      processing_message: `Failed at Pass ${failedPassNumber}: ${failedPassName}`,
      error_message: errorMessage,
    });

    const avgDuration = passMetrics.length > 0
      ? passMetrics.reduce((sum, m) => sum + m.duration_ms, 0) / passMetrics.length
      : 0;
    const slowestPass = passMetrics.length > 0
      ? passMetrics.reduce((prev, curr) => curr.duration_ms > prev.duration_ms ? curr : prev)
      : { pass_number: 0, pass_name: 'None', duration_ms: 0, cost_usd: 0 };
    const mostExpensive = passMetrics.length > 0
      ? passMetrics.reduce((prev, curr) => curr.cost_usd > prev.cost_usd ? curr : prev)
      : { pass_number: 0, pass_name: 'None', duration_ms: 0, cost_usd: 0 };

    return {
      success: false,
      error: errorMessage,
      error_details: {
        pass_number: failedPassNumber,
        pass_name: failedPassName,
        error_type: error instanceof PassError ? 'pass_failure' : 'unknown',
        error_message: errorMessage,
        stack_trace: error instanceof Error ? error.stack : undefined,
      },
      pass_outputs: Array.from(passOutputs.values()),
      completed_passes: passOutputs.size,
      total_passes: 12,
      metrics: {
        total_duration_ms: totalDuration,
        total_tokens_used: totalInputTokens + totalOutputTokens,
        total_cost_usd: totalCost,
        pass_metrics: passMetrics,
        average_pass_duration_ms: avgDuration,
        slowest_pass: {
          number: slowestPass.pass_number,
          name: slowestPass.pass_name,
          duration_ms: slowestPass.duration_ms,
        },
        most_expensive_pass: {
          number: mostExpensive.pass_number,
          name: mostExpensive.pass_name,
          cost_usd: mostExpensive.cost_usd,
        },
      },
      processing_info: {
        started_at: startedAt,
        completed_at: completedAt,
        model_version: MODEL,
        orchestrator_version: ORCHESTRATOR_VERSION,
        document_pages_processed: pdfBase64.length,
        retry_count: totalRetries,
      },
    };
  }
}

// =============================================================================
// SINGLE-PASS EXECUTION (for chained API calls pattern)
// =============================================================================

/**
 * Result type for single-pass execution
 */
export interface SinglePassResult {
  success: boolean;
  passNumber: number;
  passName: string;
  output: PassOutput | null;
  error?: string;
  inputTokens: number;
  outputTokens: number;
  processingTimeMs: number;
  costUsd: number;
  isComplete: boolean; // True if this was the final pass (12)
  nextPass: number | null; // Next pass to execute, or null if done
  finalReport?: TwelvePassFinalReport; // Only present when isComplete is true
}

/**
 * Load pass outputs from database
 */
async function loadPassOutputsFromDatabase(
  supabase: ReturnType<typeof createServerClient>,
  reportId: string
): Promise<Record<string, PassOutput>> {
  console.log(`[SINGLE-PASS] Loading pass outputs from database for report ${reportId}`);

  // Use maybeSingle() instead of single() to handle case where report doesn't exist
  const { data, error } = await supabase
    .from('reports')
    .select('pass_outputs')
    .eq('id', reportId)
    .maybeSingle();

  if (error) {
    console.error(`[SINGLE-PASS] Failed to load pass outputs: ${error.message}`);
    console.error(`[SINGLE-PASS] Error code: ${error.code}, details: ${error.details}`);
    return {};
  }

  if (!data) {
    console.warn(`[SINGLE-PASS] No report found with id ${reportId}`);
    return {};
  }

  const passOutputs = (data as { pass_outputs: Record<string, PassOutput> | null }).pass_outputs;
  console.log(`[SINGLE-PASS] Loaded pass_outputs: ${passOutputs ? Object.keys(passOutputs).join(', ') : 'null/empty'}`);

  return passOutputs || {};
}

/**
 * Save pass output to database
 */
async function savePassOutputToDatabase(
  supabase: ReturnType<typeof createServerClient>,
  reportId: string,
  passNumber: number,
  output: PassOutput,
  additionalFields: Record<string, unknown> = {}
): Promise<void> {
  console.log(`[SINGLE-PASS] >>> savePassOutputToDatabase called for Pass ${passNumber}, report ${reportId}`);

  // Load existing outputs
  const existingOutputs = await loadPassOutputsFromDatabase(supabase, reportId);
  console.log(`[SINGLE-PASS] Existing outputs keys: ${Object.keys(existingOutputs).join(', ') || 'none'}`);

  // Add new output
  const updatedOutputs = {
    ...existingOutputs,
    [passNumber.toString()]: output,
  };
  console.log(`[SINGLE-PASS] Updated outputs keys: ${Object.keys(updatedOutputs).join(', ')}`);
  console.log(`[SINGLE-PASS] Pass ${passNumber} output keys: ${Object.keys(output || {}).join(', ')}`);

  // Save to database
  const updatePayload = {
    pass_outputs: updatedOutputs,
    current_pass: passNumber,
    updated_at: new Date().toISOString(),
    ...additionalFields,
  };
  console.log(`[SINGLE-PASS] Saving to database with keys: ${Object.keys(updatePayload).join(', ')}`);

  const { data, error } = await supabase
    .from('reports')
    .update(updatePayload)
    .eq('id', reportId)
    .select('id, current_pass');

  if (error) {
    console.error(`[SINGLE-PASS] !!! Database save FAILED: ${error.message}`);
    console.error(`[SINGLE-PASS] Error details:`, JSON.stringify(error));
    throw new Error(`Failed to save pass output: ${error.message}`);
  }

  console.log(`[SINGLE-PASS] Database save SUCCESS. Result:`, JSON.stringify(data));
}

/**
 * Download documents for a report from Supabase storage
 */
async function downloadReportDocuments(
  supabase: ReturnType<typeof createServerClient>,
  reportId: string
): Promise<string[]> {
  console.log(`[SINGLE-PASS] Downloading documents for report ${reportId}`);

  // Get documents for this report from documents table
  const { data: documents, error: docsError } = await supabase
    .from('documents')
    .select('file_path, file_name, id')
    .eq('report_id', reportId);

  console.log(`[SINGLE-PASS] Documents query result: found=${documents?.length || 0}, error=${docsError?.message || 'none'}`);

  if (docsError) {
    console.error(`[SINGLE-PASS] Error querying documents table: ${docsError.message}`);
  }

  if (!documents || documents.length === 0) {
    console.log(`[SINGLE-PASS] No documents found via report_id, trying document_paths field...`);

    // Try document_id field on report (document_paths column may not exist)
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('document_id')
      .eq('id', reportId)
      .maybeSingle();

    console.log(`[SINGLE-PASS] Report query: document_id=${report?.document_id || 'null'}, error=${reportError?.message || 'none'}`);

    // If we have a document_id, try to get that specific document
    if (report?.document_id) {
      console.log(`[SINGLE-PASS] Trying to fetch document by document_id: ${report.document_id}`);
      const { data: singleDoc, error: singleDocError } = await supabase
        .from('documents')
        .select('file_path, file_name, id')
        .eq('id', report.document_id)
        .maybeSingle();

      if (singleDoc) {
        console.log(`[SINGLE-PASS] Found document via document_id: ${singleDoc.file_name}`);
        // Also check for other documents with same report_id or user
        // Fall through to use this document
        const pdfDocuments: string[] = [];
        const cleanPath = singleDoc.file_path.replace(/^documents\//, '');
        console.log(`[SINGLE-PASS] Downloading from storage: ${cleanPath}`);

        const { data, error } = await supabase.storage
          .from('documents')
          .download(cleanPath);

        if (error) {
          console.log(`[SINGLE-PASS] First download attempt failed, trying original path: ${singleDoc.file_path}`);
          const { data: data2, error: error2 } = await supabase.storage
            .from('documents')
            .download(singleDoc.file_path);

          if (error2) {
            throw new Error(`Failed to download document "${singleDoc.file_name}": ${error.message}, ${error2.message}`);
          }
          const buffer = await data2.arrayBuffer();
          pdfDocuments.push(Buffer.from(buffer).toString('base64'));
        } else {
          const buffer = await data.arrayBuffer();
          pdfDocuments.push(Buffer.from(buffer).toString('base64'));
        }
        console.log(`[SINGLE-PASS] Successfully downloaded ${pdfDocuments.length} document(s)`);
        return pdfDocuments;
      } else {
        console.error(`[SINGLE-PASS] Could not find document with id ${report.document_id}: ${singleDocError?.message || 'not found'}`);
      }
    }

    // No documents found through any method
    throw new Error(`No documents found for report ${reportId}. Documents table returned 0 rows for report_id, and document_id lookup failed.`);
  }

  // Download each document
  const pdfDocuments: string[] = [];
  for (const doc of documents) {
    const cleanPath = doc.file_path.replace(/^documents\//, '');
    const { data, error } = await supabase.storage
      .from('documents')
      .download(cleanPath);

    if (error) {
      const { data: data2, error: error2 } = await supabase.storage
        .from('documents')
        .download(doc.file_path);

      if (error2) {
        throw new Error(`Failed to download document "${doc.file_name}": ${error.message}`);
      }
      const buffer = await data2.arrayBuffer();
      pdfDocuments.push(Buffer.from(buffer).toString('base64'));
    } else {
      const buffer = await data.arrayBuffer();
      pdfDocuments.push(Buffer.from(buffer).toString('base64'));
    }
  }

  return pdfDocuments;
}

/**
 * Execute a single pass of the valuation pipeline
 *
 * This function is designed for the chained API calls pattern where each pass
 * is executed as a separate API call with its own timeout window.
 *
 * @param reportId - Report ID to process
 * @param passNumber - Pass number to execute (1-12)
 * @param onProgress - Optional progress callback
 * @returns SinglePassResult with output and metadata
 */
export async function executeSinglePass(
  reportId: string,
  passNumber: number,
  onProgress?: (message: string, percent: number) => void,
  options?: { force?: boolean }
): Promise<SinglePassResult> {
  const startTime = Date.now();
  const client = new Anthropic();
  const supabase = createServerClient();
  const passName = PASS_METADATA[passNumber as keyof typeof PASS_METADATA]?.name || `Pass ${passNumber}`;
  const progress = PASS_PROGRESS[passNumber];

  console.log(`[SINGLE-PASS] ========================================`);
  console.log(`[SINGLE-PASS] Executing Pass ${passNumber}: ${passName}`);
  console.log(`[SINGLE-PASS] Report ID: ${reportId}`);
  console.log(`[SINGLE-PASS] ========================================`);

  try {
    // Validate pass number
    if (passNumber < 1 || passNumber > 12) {
      throw new Error(`Invalid pass number: ${passNumber}. Must be 1-12.`);
    }

    // Load previous pass outputs from database
    const passOutputs = await loadPassOutputsFromDatabase(supabase, reportId);

    // Validate that required previous passes are complete (unless force mode)
    if (!options?.force) {
      for (let i = 1; i < passNumber; i++) {
        if (!passOutputs[i.toString()]) {
          throw new Error(`Pass ${i} must be completed before Pass ${passNumber}. Use force=true to skip this check.`);
        }
      }
    } else {
      console.log(`[SINGLE-PASS] Force mode enabled - skipping prerequisite check`);
    }

    // Update status to processing
    await saveToDatabase(supabase, reportId, {
      report_status: `pass_${passNumber}_processing`,
      current_pass: passNumber,
      processing_progress: progress,
      processing_message: `Pass ${passNumber}/12: ${passName}...`,
    });

    onProgress?.(`Pass ${passNumber}/12: ${passName}...`, progress);

    let result: PassResult<PassOutput>;

    // Handle passes 1-3 differently (need PDF documents)
    if (passNumber <= 3) {
      // Download documents
      console.log(`[SINGLE-PASS] Downloading documents for extraction pass...`);
      const pdfBase64 = await downloadReportDocuments(supabase, reportId);
      console.log(`[SINGLE-PASS] Downloaded ${pdfBase64.length} document(s)`);

      // Create context for per-document extraction
      const context: PassContext = {
        reportId,
        pdfBase64,
        passOutputs: new Map(Object.entries(passOutputs).map(([k, v]) => [parseInt(k), v])),
        onProgress: (pass, msg, pct) => onProgress?.(msg, pct),
      };

      if (passNumber === 1) {
        // Pass 1: Document Classification - process each document individually
        const pass1Config = getPromptConfig(1)!;
        const pass1Outputs: Pass1Output[] = [];

        for (let i = 0; i < pdfBase64.length; i++) {
          console.log(`[SINGLE-PASS] Processing document ${i + 1}/${pdfBase64.length} for Pass 1`);
          const docResult = await executeSingleDocumentExtraction<Pass1Output>(
            client, 1, pdfBase64[i],
            pass1Config.systemPrompt, pass1Config.userPrompt,
            pass1Config.maxTokens || 8192, pass1Config.temperature || 0.2,
            i, pdfBase64.length
          );

          if (!docResult.success || !docResult.output) {
            throw new Error(`Pass 1 failed for document ${i + 1}: ${docResult.error}`);
          }
          pass1Outputs.push(docResult.output);
        }

        const mergedOutput = mergePass1Outputs(pass1Outputs);
        result = {
          success: true,
          output: mergedOutput,
          rawResponse: '',
          inputTokens: pass1Outputs.length * 5000, // Estimate
          outputTokens: pass1Outputs.length * 2000,
          processingTime: Date.now() - startTime,
          retryCount: 0,
        };
      } else if (passNumber === 2) {
        // Pass 2: Income Statement - process each document individually
        const pass1Output = passOutputs['1'] as Pass1Output;
        const pass2Config = getPromptConfig(2)!;
        const pass2Outputs: Pass2Output[] = [];

        const pass2PriorContext = `
## PRIOR PASS DATA
### Pass 1 Output (Document Classification)
Company: ${pass1Output.company_profile?.legal_name || 'Unknown'}
Industry: ${pass1Output.industry_classification?.naics_description || 'Unknown'}
`;

        for (let i = 0; i < pdfBase64.length; i++) {
          console.log(`[SINGLE-PASS] Processing document ${i + 1}/${pdfBase64.length} for Pass 2`);
          const docResult = await executeSingleDocumentExtraction<Pass2Output>(
            client, 2, pdfBase64[i],
            pass2Config.systemPrompt, pass2PriorContext + '\n\n' + pass2Config.userPrompt,
            pass2Config.maxTokens || 8192, pass2Config.temperature || 0.2,
            i, pdfBase64.length
          );

          if (!docResult.success || !docResult.output) {
            throw new Error(`Pass 2 failed for document ${i + 1}: ${docResult.error}`);
          }
          pass2Outputs.push(docResult.output);
        }

        const mergedOutput = mergePass2Outputs(pass2Outputs);
        result = {
          success: true,
          output: mergedOutput,
          rawResponse: '',
          inputTokens: pass2Outputs.length * 5000,
          outputTokens: pass2Outputs.length * 2000,
          processingTime: Date.now() - startTime,
          retryCount: 0,
        };
      } else {
        // Pass 3: Balance Sheet - process each document individually
        const pass1Output = passOutputs['1'] as Pass1Output;
        const pass2Output = passOutputs['2'] as Pass2Output;
        const pass3Config = getPromptConfig(3)!;
        const pass3Outputs: Pass3Output[] = [];

        const naicsCode = pass1Output.industry_classification?.naics_code || '';
        const wcBenchmark = getWorkingCapitalBenchmark(naicsCode.substring(0, 2));

        const pass3PriorContext = `
## PRIOR PASS DATA
### Pass 1 Output (Document Classification)
Company: ${pass1Output.company_profile?.legal_name || 'Unknown'}
Industry: ${pass1Output.industry_classification?.naics_description || 'Unknown'}

### Pass 2 Output (Income Statement)
Most Recent Revenue: $${(pass2Output.income_statements?.[0]?.revenue?.total_revenue || 0).toLocaleString()}

### Working Capital Benchmarks
${wcBenchmark ? `Industry: ${wcBenchmark.industry}` : 'No specific benchmarks available.'}
`;

        for (let i = 0; i < pdfBase64.length; i++) {
          console.log(`[SINGLE-PASS] Processing document ${i + 1}/${pdfBase64.length} for Pass 3`);
          const docResult = await executeSingleDocumentExtraction<Pass3Output>(
            client, 3, pdfBase64[i],
            pass3Config.systemPrompt, pass3PriorContext + '\n\n' + pass3Config.userPrompt,
            pass3Config.maxTokens || 8192, pass3Config.temperature || 0.2,
            i, pdfBase64.length
          );

          if (!docResult.success || !docResult.output) {
            throw new Error(`Pass 3 failed for document ${i + 1}: ${docResult.error}`);
          }
          pass3Outputs.push(docResult.output);
        }

        const mergedOutput = mergePass3Outputs(pass3Outputs);
        result = {
          success: true,
          output: mergedOutput,
          rawResponse: '',
          inputTokens: pass3Outputs.length * 5000,
          outputTokens: pass3Outputs.length * 2000,
          processingTime: Date.now() - startTime,
          retryCount: 0,
        };
      }
    } else {
      // Passes 4-12: Analysis passes (no PDF needed)
      console.log(`[SINGLE-PASS] Available pass outputs: ${Object.keys(passOutputs).join(', ')}`);

      // Debug: show what's in pass 1
      const rawPass1 = passOutputs['1'];
      if (!rawPass1) {
        console.error(`[SINGLE-PASS] Pass 1 output is missing! Available keys: ${Object.keys(passOutputs).join(', ')}`);
        throw new Error(`Pass 1 output not found in database. Available passes: ${Object.keys(passOutputs).join(', ')}`);
      }
      console.log(`[SINGLE-PASS] Pass 1 keys: ${Object.keys(rawPass1).join(', ')}`);

      const pass1 = rawPass1 as Pass1Output;
      const pass2 = passOutputs['2'] as Pass2Output;
      const pass3 = passOutputs['3'] as Pass3Output;
      const pass4 = passOutputs['4'] as Pass4Output;
      const pass5 = passOutputs['5'] as Pass5Output;
      const pass6 = passOutputs['6'] as Pass6Output;
      const pass7 = passOutputs['7'] as Pass7Output;
      const pass8 = passOutputs['8'] as Pass8Output;
      const pass9 = passOutputs['9'] as Pass9Output;
      const pass10 = passOutputs['10'] as Pass10Output;
      const pass11 = passOutputs['11'] as Pass11Output;

      // Build the request based on pass number
      let buildRequest: () => { system: string; prompt: string };

      switch (passNumber) {
        case 4:
          buildRequest = () => buildPass4Request(pass1, pass2, pass3);
          break;
        case 5:
          buildRequest = () => buildPass5Request(pass1, pass2, pass3, pass4);
          break;
        case 6:
          buildRequest = () => buildPass6Request(pass1, pass2, pass3, pass4, pass5);
          break;
        case 7:
          buildRequest = () => buildPass7Request(pass3, pass4, pass6);
          break;
        case 8:
          buildRequest = () => buildPass8Request(pass3, pass4, pass5, pass6);
          break;
        case 9:
          buildRequest = () => buildPass9Request(pass1, pass4, pass5, pass6);
          break;
        case 10:
          buildRequest = () => buildPass10Request(pass1, pass3, pass4, pass5, pass6, pass7, pass8, pass9);
          break;
        case 11:
          buildRequest = () => buildPass11Request(pass1, pass2, pass3, pass4, pass5, pass6, pass7, pass8, pass9, pass10);
          break;
        case 12:
          buildRequest = () => buildPass12Request(pass1, pass2, pass3, pass4, pass5, pass6, pass7, pass8, pass9, pass10, pass11);
          break;
        default:
          throw new Error(`Invalid pass number: ${passNumber}`);
      }

      const passConfig = getPromptConfig(passNumber);
      result = await executePassWithRetry<PassOutput>(
        client,
        passNumber,
        buildRequest,
        passConfig?.maxTokens || 8192,
        passConfig?.temperature || 0.2
      );
    }

    if (!result.success || !result.output) {
      throw new Error(result.error || `Pass ${passNumber} failed`);
    }

    // Save pass output to database
    const processingTime = Date.now() - startTime;
    const cost = calculateCost(result.inputTokens, result.outputTokens);

    console.log(`[SINGLE-PASS] About to save Pass ${passNumber} output to database...`);
    console.log(`[SINGLE-PASS] result.output exists: ${!!result.output}, keys: ${result.output ? Object.keys(result.output).join(', ') : 'none'}`);

    await savePassOutputToDatabase(supabase, reportId, passNumber, result.output, {
      processing_progress: progress,
      processing_message: `Pass ${passNumber}/12: ${passName} complete`,
      report_status: `pass_${passNumber}_complete`,
    });

    console.log(`[SINGLE-PASS] Pass ${passNumber} complete in ${processingTime}ms`);

    // Check if this is the final pass
    const isComplete = passNumber === 12;
    let finalReport: TwelvePassFinalReport | undefined;

    if (isComplete) {
      // Build final report
      console.log(`[SINGLE-PASS] Building final report...`);

      // Reload all pass outputs including the one we just saved
      const allOutputs = await loadPassOutputsFromDatabase(supabase, reportId);

      // Assemble final report
      finalReport = await assembleFinalReport(allOutputs, reportId, supabase);

      // Save final report to database
      await saveToDatabase(supabase, reportId, {
        report_status: 'completed',
        processing_progress: 100,
        processing_message: 'Valuation complete',
        report_data: finalReport,
      });

      console.log(`[SINGLE-PASS] Final report saved. FMV: $${finalReport.valuation_conclusion?.concluded_value?.toLocaleString() || 'N/A'}`);
    }

    return {
      success: true,
      passNumber,
      passName,
      output: result.output,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      processingTimeMs: processingTime,
      costUsd: cost,
      isComplete,
      nextPass: isComplete ? null : passNumber + 1,
      finalReport,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const processingTime = Date.now() - startTime;

    console.error(`[SINGLE-PASS] Pass ${passNumber} failed: ${errorMessage}`);

    // Save error state
    await saveToDatabase(supabase, reportId, {
      report_status: 'error',
      processing_message: `Pass ${passNumber} failed: ${errorMessage}`,
      error_message: errorMessage,
    });

    return {
      success: false,
      passNumber,
      passName,
      output: null,
      error: errorMessage,
      inputTokens: 0,
      outputTokens: 0,
      processingTimeMs: processingTime,
      costUsd: 0,
      isComplete: false,
      nextPass: passNumber, // Retry from this pass
    };
  }
}

/**
 * Assemble the final report from all pass outputs
 */
async function assembleFinalReport(
  passOutputs: Record<string, PassOutput>,
  reportId: string,
  supabase: ReturnType<typeof createServerClient>
): Promise<TwelvePassFinalReport> {
  const pass1 = passOutputs['1'] as Pass1Output;
  const pass2 = passOutputs['2'] as Pass2Output;
  const pass3 = passOutputs['3'] as Pass3Output;
  const pass4 = passOutputs['4'] as Pass4Output;
  const pass5 = passOutputs['5'] as Pass5Output;
  const pass6 = passOutputs['6'] as Pass6Output;
  const pass7 = passOutputs['7'] as Pass7Output;
  const pass8 = passOutputs['8'] as Pass8Output;
  const pass9 = passOutputs['9'] as Pass9Output;
  const pass10 = passOutputs['10'] as Pass10Output;
  const pass11 = passOutputs['11'] as Pass11Output;
  const pass12 = passOutputs['12'] as Pass12Output;

  // Use current date as valuation date
  const valuationDate = new Date().toISOString().split('T')[0];

  // Try to use the transform function
  try {
    const passOutputsForTransform: PassOutputs = {
      pass1, pass2, pass3, pass4, pass5, pass6,
      pass7, pass8, pass9, pass10, pass11, pass12,
    };

    const transformedReport = transformToFinalReport(passOutputsForTransform, valuationDate);
    const validation = validateFinalReport(transformedReport);

    if (validation.valid) {
      console.log('[SINGLE-PASS] Using transformed FinalValuationReport');
      return transformedReport as unknown as TwelvePassFinalReport;
    } else {
      console.warn('[SINGLE-PASS] Transform validation failed, using legacy assembly:', validation.errors);
    }
  } catch (transformError) {
    console.warn('[SINGLE-PASS] Transform failed, using legacy assembly:', transformError);
  }

  // Legacy assembly as fallback - use double type assertions to access properties
  // that may have different names in different versions of the types
  const p1 = pass1 as unknown as Record<string, unknown>;
  const p2 = pass2 as unknown as Record<string, unknown>;
  const p3 = pass3 as unknown as Record<string, unknown>;
  const p5 = pass5 as unknown as Record<string, unknown>;
  const p6 = pass6 as unknown as Record<string, unknown>;
  const p7 = pass7 as unknown as Record<string, unknown>;
  const p8 = pass8 as unknown as Record<string, unknown>;
  const p9 = pass9 as unknown as Record<string, unknown>;
  const p10 = pass10 as unknown as Record<string, unknown>;
  const p11 = pass11 as unknown as Record<string, unknown>;
  const p12 = pass12 as unknown as Record<string, unknown>;

  // Extract concluded value from pass 10
  const conclusion = (p10.conclusion || p10.final_value_conclusion) as Record<string, unknown> | undefined;
  const concludedValue = (conclusion?.concluded_value || conclusion?.concluded_fair_market_value || 0) as number;
  const valueRange = conclusion?.value_range as Record<string, number> | undefined;
  const valuationRangeLow = valueRange?.low || (conclusion?.valuation_range_low as number) || concludedValue * 0.85;
  const valuationRangeHigh = valueRange?.high || (conclusion?.valuation_range_high as number) || concludedValue * 1.15;

  // Build report object
  const report: Record<string, unknown> = {
    report_metadata: {
      report_id: reportId,
      generated_at: new Date().toISOString(),
      valuation_date: valuationDate,
      report_version: ORCHESTRATOR_VERSION,
    },
    company_profile: p1.company_profile,
    valuation_conclusion: {
      concluded_value: concludedValue,
      value_range_low: valuationRangeLow,
      value_range_high: valuationRangeHigh,
      effective_date: valuationDate,
      standard_of_value: 'Fair Market Value',
      premise_of_value: 'Going Concern',
      confidence_level: conclusion?.confidence_level || 'medium',
    },
    financial_summary: {
      revenue: ((p2.income_statements as Array<Record<string, unknown>>)?.[0]?.revenue as Record<string, number>)?.total_revenue || 0,
      gross_profit: (p2.income_statements as Array<Record<string, unknown>>)?.[0]?.gross_profit || 0,
      sde: ((p5.normalized_earnings || p5.sde_calculation) as Record<string, number>)?.weighted_average_sde || 0,
      ebitda: ((p5.normalized_earnings || p5.ebitda_calculation) as Record<string, number>)?.weighted_average_ebitda || 0,
      total_assets: (p3.balance_sheets as Array<Record<string, number>>)?.[0]?.total_assets || 0,
      total_liabilities: (p3.balance_sheets as Array<Record<string, number>>)?.[0]?.total_liabilities || 0,
      net_working_capital: (p3.working_capital_analysis as Array<Record<string, number>>)?.[0]?.net_working_capital || 0,
    },
    valuation_approaches: {
      asset: p7.value_indication || p7.asset_approach_indication,
      income: p8.value_indication || p8.income_approach_indication,
      market: p9.value_indication || p9.market_approach_indication,
    },
    risk_assessment: p6.overall_risk_assessment,
    narratives: p11.narratives,
    quality_review: {
      grade: p12.quality_grade || 'B',
      score: p12.quality_score || 75,
      issues_found: (p12.issues_identified as unknown[])?.length || 0,
      corrections_made: (p12.corrections_applied as unknown[])?.length || 0,
    },
    pass_outputs: passOutputs,
    quality_grade: p12.quality_grade || 'B',
    quality_score: p12.quality_score || 75,
  };

  return report as unknown as TwelvePassFinalReport;
}

/**
 * Get the current processing state for a report
 */
export async function getProcessingState(reportId: string): Promise<{
  currentPass: number;
  completedPasses: number[];
  status: string;
  progress: number;
  message: string;
  canResume: boolean;
  nextPass: number | null;
}> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('reports')
    .select('current_pass, pass_outputs, report_status, processing_progress, processing_message')
    .eq('id', reportId)
    .maybeSingle();

  if (error) {
    console.error(`[getProcessingState] Error: ${error.message}`);
    return {
      currentPass: 0,
      completedPasses: [],
      status: 'error',
      progress: 0,
      message: `Failed to load report state: ${error.message}`,
      canResume: false,
      nextPass: null,
    };
  }

  if (!data) {
    return {
      currentPass: 0,
      completedPasses: [],
      status: 'not_found',
      progress: 0,
      message: 'Report not found',
      canResume: false,
      nextPass: 1, // Start from pass 1 if report exists but no data
    };
  }

  const passOutputs = (data.pass_outputs as Record<string, unknown>) || {};
  const completedPasses = Object.keys(passOutputs).map(k => parseInt(k)).filter(n => !isNaN(n)).sort((a, b) => a - b);
  const currentPass = data.current_pass || completedPasses[completedPasses.length - 1] || 0;
  const nextPass = completedPasses.length < 12 ? (completedPasses[completedPasses.length - 1] || 0) + 1 : null;
  const canResume = data.report_status !== 'completed' && nextPass !== null;

  return {
    currentPass,
    completedPasses,
    status: data.report_status || 'pending',
    progress: data.processing_progress || 0,
    message: data.processing_message || '',
    canResume,
    nextPass,
  };
}

// =============================================================================
// PASS EXECUTION
// =============================================================================

/**
 * Execute a pass with logging, progress updates, and database persistence
 */
async function executePassWithLogging<T extends PassOutput>(
  client: Anthropic,
  supabase: ReturnType<typeof createServerClient>,
  context: PassContext,
  passNumber: number,
  buildRequest: () => { system: string; prompt: string; pdfBase64?: string[] },
  shortDescription: string
): Promise<PassResult<T>> {
  const passConfig = getPromptConfig(passNumber);
  const passName = PASS_METADATA[passNumber as keyof typeof PASS_METADATA]?.name || `Pass ${passNumber}`;
  const progress = PASS_PROGRESS[passNumber];

  // Log start
  console.log(`[12-PASS] Starting Pass ${passNumber}: ${passName} (${progress}%)`);
  context.onProgress?.(passNumber, `${shortDescription}...`, progress);

  // Update database with processing status
  await saveToDatabase(supabase, context.reportId, {
    report_status: `pass_${passNumber}_processing`,
    processing_progress: progress,
    processing_message: `Pass ${passNumber}: ${shortDescription}...`,
  });

  const startTime = Date.now();

  // Execute with retries
  const result = await executePassWithRetry<T>(
    client,
    passNumber,
    buildRequest,
    passConfig?.maxTokens || 8192,
    passConfig?.temperature || 0.2
  );

  const duration = Date.now() - startTime;

  if (result.success && result.output) {
    // Log completion
    const summary = getPassCompletionSummary(passNumber, result.output);
    console.log(`[12-PASS] Pass ${passNumber} complete: ${summary}`);

    // Save progress to database (pass outputs saved only in final report)
    await saveToDatabase(supabase, context.reportId, {
      report_status: `pass_${passNumber}_complete`,
      processing_progress: progress,
      processing_message: `Pass ${passNumber} complete: ${shortDescription}`,
    });
  } else {
    console.error(`[12-PASS] Pass ${passNumber} failed: ${result.error}`);
  }

  return result;
}

/**
 * Execute a single pass with retry logic
 */
async function executePassWithRetry<T extends PassOutput>(
  client: Anthropic,
  passNumber: number,
  buildRequest: () => { system: string; prompt: string; pdfBase64?: string[] },
  maxTokens: number,
  temperature: number
): Promise<PassResult<T>> {
  const startTime = Date.now();
  let retryCount = 0;
  let lastError = '';

  while (retryCount <= MAX_RETRIES) {
    try {
      const request = buildRequest();

      // Build messages based on whether we have PDFs
      const messages: Anthropic.MessageParam[] = request.pdfBase64 && request.pdfBase64.length > 0
        ? [
            {
              role: 'user',
              content: [
                // Include all PDF documents
                ...request.pdfBase64.map(pdf => ({
                  type: 'document' as const,
                  source: {
                    type: 'base64' as const,
                    media_type: 'application/pdf' as const,
                    data: pdf,
                  },
                })),
                {
                  type: 'text' as const,
                  text: request.prompt,
                },
              ],
            },
          ]
        : [
            {
              role: 'user',
              content: request.prompt,
            },
          ];

      // Call Claude API
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: maxTokens,
        temperature,
        system: request.system,
        messages,
      });

      // Extract response text
      const responseText = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map(block => block.text)
        .join('\n');

      // Parse JSON from response
      const parsed = parsePassOutput<T>(responseText);

      if (!parsed) {
        throw new Error(`Failed to parse JSON from Pass ${passNumber} response`);
      }

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        output: parsed as T,
        rawResponse: responseText,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        processingTime,
        retryCount,
      };

    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`[12-PASS] Pass ${passNumber} attempt ${retryCount + 1}/${MAX_RETRIES + 1} failed: ${lastError}`);
      retryCount++;

      if (retryCount <= MAX_RETRIES) {
        // Exponential backoff
        const delay = 1000 * Math.pow(2, retryCount);
        console.log(`[12-PASS] Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  return {
    success: false,
    output: null,
    rawResponse: '',
    inputTokens: 0,
    outputTokens: 0,
    processingTime: Date.now() - startTime,
    error: lastError,
    retryCount,
  };
}

// =============================================================================
// REQUEST BUILDERS
// =============================================================================

/**
 * Build Pass 1 request - Document Classification (uses PDFs)
 */
function buildPass1Request(pdfBase64: string[]): { system: string; prompt: string; pdfBase64: string[] } {
  const config = getPromptConfig(1)!;
  return {
    system: config.systemPrompt,
    prompt: config.userPrompt,
    pdfBase64,
  };
}

/**
 * Build Pass 2 request - Income Statement (uses PDFs + Pass 1)
 */
function buildPass2Request(pdfBase64: string[], pass1: Pass1Output): { system: string; prompt: string; pdfBase64: string[] } {
  const config = getPromptConfig(2)!;
  const priorContext = `
## PRIOR PASS DATA

### Pass 1 Output (Document Classification)
Company: ${pass1.company_profile?.legal_name || 'Unknown'}
Industry: ${pass1.industry_classification?.naics_description || 'Unknown'}
Document Type: ${pass1.document_info?.document_type || 'Unknown'}
`;

  return {
    system: config.systemPrompt,
    prompt: priorContext + '\n\n' + config.userPrompt,
    pdfBase64,
  };
}

/**
 * Build Pass 3 request - Balance Sheet (uses PDFs + Pass 1-2)
 */
function buildPass3Request(pdfBase64: string[], pass1: Pass1Output, pass2: Pass2Output): { system: string; prompt: string; pdfBase64: string[] } {
  const config = getPromptConfig(3)!;

  // Inject working capital benchmarks
  const naicsCode = pass1.industry_classification?.naics_code || '';
  const wcBenchmark = getWorkingCapitalBenchmark(naicsCode.substring(0, 2));

  const priorContext = `
## PRIOR PASS DATA

### Pass 1 Output (Document Classification)
Company: ${pass1.company_profile?.legal_name || 'Unknown'}
Industry: ${pass1.industry_classification?.naics_description || 'Unknown'}

### Pass 2 Output (Income Statement)
Most Recent Revenue: $${(pass2.income_statements?.[0]?.revenue || 0).toLocaleString()}
Most Recent Net Income: $${(pass2.income_statements?.[0]?.net_income || 0).toLocaleString()}

### Working Capital Benchmarks
${wcBenchmark ? `
Industry: ${wcBenchmark.industry}
DSO Range: ${wcBenchmark.daysSalesOutstanding.min}-${wcBenchmark.daysSalesOutstanding.max} days
DIO Range: ${wcBenchmark.daysInventoryOutstanding.min}-${wcBenchmark.daysInventoryOutstanding.max} days
DPO Range: ${wcBenchmark.daysPayableOutstanding.min}-${wcBenchmark.daysPayableOutstanding.max} days
WC % Revenue: ${(wcBenchmark.workingCapitalAsPercentOfRevenue.min * 100).toFixed(0)}%-${(wcBenchmark.workingCapitalAsPercentOfRevenue.max * 100).toFixed(0)}%
` : 'No specific benchmarks available for this industry.'}
`;

  return {
    system: config.systemPrompt,
    prompt: priorContext + '\n\n' + config.userPrompt,
    pdfBase64,
  };
}

/**
 * Build Pass 4 request - Industry Analysis (no PDFs, uses Pass 1-3)
 */
function buildPass4Request(pass1: Pass1Output, pass2: Pass2Output, pass3: Pass3Output): { system: string; prompt: string } {
  const config = getPromptConfig(4)!;

  // Safely access pass1 fields with fallbacks
  if (!pass1) {
    throw new Error('Pass 1 output is required for Pass 4');
  }

  // Inject industry knowledge - handle both old and new field structures
  const industryClass = pass1.industry_classification || (pass1 as unknown as Record<string, unknown>).industryClassification as typeof pass1.industry_classification;
  const companyProf = pass1.company_profile || (pass1 as unknown as Record<string, unknown>).companyProfile as typeof pass1.company_profile;

  const naicsCode = industryClass?.naics_code || '';
  const sectorMultiples = findSectorMultiples(pass1);

  const priorContext = `
## PRIOR PASS DATA

### Pass 1 Output (Company Profile)
Company: ${companyProf?.legal_name || 'Unknown'}
Years in Business: ${companyProf?.years_in_business || 'Unknown'}
NAICS Code: ${naicsCode}
Industry: ${industryClass?.naics_description || 'Unknown'}
Business Description: ${companyProf?.business_description || 'Not provided'}

### Pass 2 Output (Financial Performance)
${JSON.stringify(pass2.income_statements?.slice(0, 3).map(is => ({
  year: is.fiscal_year,
  revenue: is.revenue,
  gross_profit: is.gross_profit,
  operating_income: is.operating_income,
  net_income: is.net_income,
})) || [], null, 2)}

### Pass 3 Output (Balance Sheet Summary)
Total Assets: $${(pass3.balance_sheets?.[0]?.total_assets || 0).toLocaleString()}
Total Liabilities: $${(pass3.balance_sheets?.[0]?.total_liabilities || 0).toLocaleString()}
Working Capital: $${(pass3.key_metrics?.most_recent_working_capital || 0).toLocaleString()}

### Embedded Industry Knowledge
${sectorMultiples ? `
Sector: ${sectorMultiples.sector}
SDE Multiple Range: ${sectorMultiples.sdeMultipleLow}x - ${sectorMultiples.sdeMultipleHigh}x (Median: ${sectorMultiples.sdeMultipleMedian}x)
Revenue Multiple Range: ${sectorMultiples.revenueMultipleLow}x - ${sectorMultiples.revenueMultipleHigh}x
Typical Gross Margin: ${(sectorMultiples.typicalMargins.gross.low * 100).toFixed(0)}%-${(sectorMultiples.typicalMargins.gross.high * 100).toFixed(0)}%
Key Considerations: ${sectorMultiples.keyConsiderations.join(', ')}
` : 'No specific sector data available.'}
`;

  return {
    system: config.systemPrompt,
    prompt: priorContext + '\n\n' + config.userPrompt,
  };
}

/**
 * Build Pass 5 request - Earnings Normalization (no PDFs, uses Pass 1-4)
 */
function buildPass5Request(pass1: Pass1Output, pass2: Pass2Output, pass3: Pass3Output, pass4: Pass4Output): { system: string; prompt: string } {
  const config = getPromptConfig(5)!;

  // Inject add-backs knowledge
  const addbacksKnowledge = COMMON_ADDBACKS_DETAILED.slice(0, 15).map(ab => {
    const range = ab.typicalPercentageOfRevenue
      ? `${(ab.typicalPercentageOfRevenue.min * 100).toFixed(0)}-${(ab.typicalPercentageOfRevenue.max * 100).toFixed(0)}% of revenue`
      : 'varies';
    return `- ${ab.itemName}: ${range} (${ab.category})`;
  }).join('\n');

  const priorContext = `
## PRIOR PASS DATA

### Pass 1 Output (Company Profile)
Company: ${pass1.company_profile?.legal_name || 'Unknown'}
Entity Type: ${pass1.ownership_info?.ownership_type || 'Unknown'}
Owners: ${JSON.stringify(Array.isArray(pass1.ownership_info?.owners) ? pass1.ownership_info.owners.map(o => ({ name: o.name, ownership: o.ownership_percentage, active: o.active_in_business, comp: o.compensation })) : [])}

### Pass 2 Output (Income Statements)
${JSON.stringify(pass2.income_statements?.slice(0, 3) || [], null, 2)}

### Pass 3 Output (Balance Sheet)
Working Capital: $${(pass3.key_metrics?.most_recent_working_capital || 0).toLocaleString()}
Required Working Capital: $${(pass3.working_capital_analysis?.[0]?.operating_working_capital || 0).toLocaleString()}

### Pass 4 Output (Industry Benchmarks)
Industry Median SDE Margin: ${((pass4.industry_benchmarks?.profitability_benchmarks?.sde_margin?.median || 0) * 100).toFixed(1)}%
Industry Median Gross Margin: ${((pass4.industry_benchmarks?.profitability_benchmarks?.gross_margin?.median || 0) * 100).toFixed(1)}%
Typical SDE Multiple: ${pass4.valuation_multiples?.transaction_multiples?.sde_multiple?.median || 'N/A'}x

### Common Add-Backs Reference
${addbacksKnowledge}
`;

  return {
    system: config.systemPrompt,
    prompt: priorContext + '\n\n' + config.userPrompt,
  };
}

/**
 * Build Pass 6 request - Risk Assessment (no PDFs, uses Pass 1-5)
 */
function buildPass6Request(pass1: Pass1Output, pass2: Pass2Output, pass3: Pass3Output, pass4: Pass4Output, pass5: Pass5Output): { system: string; prompt: string } {
  const config = getPromptConfig(6)!;

  // Inject capitalization rate data
  const treasuryRate = CAPITALIZATION_RATE_DATA.riskFreeRates.rates.find(r => r.maturity === '20-Year Treasury')?.rate || 0.045;
  const capRateKnowledge = `
## Capitalization Rate Build-Up Reference

### Current Market Data
- Risk-Free Rate (20-Year Treasury): ${(treasuryRate * 100).toFixed(2)}%
- Equity Risk Premium: ${(CAPITALIZATION_RATE_DATA.equityRiskPremium.duffPhelps.rate * 100).toFixed(2)}%

### Size Premium Guidelines
${CAPITALIZATION_RATE_DATA.smallBusinessPremiums.tiers.map(sp =>
  `- ${sp.revenueRange.description}: ${(sp.totalSizePremium * 100).toFixed(1)}%`
).join('\n')}

### Risk Assessment Framework
${RISK_ASSESSMENT_FRAMEWORK.slice(0, 8).map(rf =>
  `- ${rf.name} (Weight: ${(rf.weight * 100).toFixed(0)}%): ${rf.impactOnMultiple}`
).join('\n')}
`;

  const priorContext = `
## PRIOR PASS DATA

### Pass 1 Output (Company Profile)
Company: ${pass1.company_profile?.legal_name || 'Unknown'}
Years in Business: ${pass1.company_profile?.years_in_business || 'Unknown'}
Customer Concentration: Top customer ${pass1.company_profile?.customer_concentration?.top_customer_percentage || 'Unknown'}%

### Pass 2 Output (Financial Trends)
Revenue Trend: ${JSON.stringify(pass2.income_statements?.slice(0, 3).map(is => ({ year: is.fiscal_year, revenue: is.revenue })) || [])}

### Pass 3 Output (Financial Position)
Current Ratio: ${pass3.key_metrics?.average_current_ratio?.toFixed(2) || 'N/A'}
Debt to Equity: ${pass3.debt_analysis?.debt_to_equity_ratio?.toFixed(2) || 'N/A'}

### Pass 4 Output (Industry Position)
Industry Growth Rate: ${((pass4.industry_overview?.market_growth?.projected_growth_rate || 0) * 100).toFixed(1)}%
Competitive Position: ${pass4.competitive_landscape?.company_market_position || 'Unknown'}

### Pass 5 Output (Normalized Earnings)
Normalized SDE: $${(pass5.summary?.weighted_average_sde || 0).toLocaleString()}
SDE Trend: ${pass5.summary?.sde_trend || 'Unknown'}

${capRateKnowledge}
`;

  return {
    system: config.systemPrompt,
    prompt: priorContext + '\n\n' + config.userPrompt,
  };
}

/**
 * Build Pass 7 request - Asset Approach (no PDFs, uses Pass 3, 4, 6)
 */
function buildPass7Request(pass3: Pass3Output, pass4: Pass4Output, pass6: Pass6Output): { system: string; prompt: string } {
  const config = getPromptConfig(7)!;

  const priorContext = `
## PRIOR PASS DATA

### Pass 3 Output (Balance Sheet)
${JSON.stringify(pass3.balance_sheets?.[0] || {}, null, 2)}

### Working Capital Analysis
${JSON.stringify(pass3.working_capital_analysis || {}, null, 2)}

### Pass 4 Output (Industry Benchmarks)
Industry median asset turnover: ${pass4.industry_benchmarks?.efficiency_benchmarks?.asset_turnover?.median?.toFixed(2) || 'N/A'}
Industry SDE Multiple: ${pass4.valuation_multiples?.transaction_multiples?.sde_multiple?.median || 'N/A'}x

### Pass 6 Output (Risk Factors)
Overall Risk Score: ${pass6.risk_summary?.overall_risk_score?.toFixed(2) || 'N/A'}
`;

  return {
    system: config.systemPrompt,
    prompt: priorContext + '\n\n' + config.userPrompt,
  };
}

/**
 * Build Pass 8 request - Income Approach (no PDFs, uses Pass 3-6)
 */
function buildPass8Request(pass3: Pass3Output, pass4: Pass4Output, pass5: Pass5Output, pass6: Pass6Output): { system: string; prompt: string } {
  const config = getPromptConfig(8)!;

  // Inject detailed cap rate knowledge
  const treasuryRate8 = CAPITALIZATION_RATE_DATA.riskFreeRates.rates.find(r => r.maturity === '20-Year Treasury')?.rate || 0.045;
  const capRateKnowledge = `
## Capitalization Rate Build-Up Data

### Risk-Free Rate
- 20-Year Treasury: ${(treasuryRate8 * 100).toFixed(2)}%

### Equity Risk Premium
- Duff & Phelps Supply-Side: ${(CAPITALIZATION_RATE_DATA.equityRiskPremium.duffPhelps.rate * 100).toFixed(2)}%

### Size Premiums
${CAPITALIZATION_RATE_DATA.smallBusinessPremiums.tiers.map(sp =>
  `- ${sp.revenueRange.description}: ${(sp.totalSizePremium * 100).toFixed(1)}%`
).join('\n')}

### Industry Risk Premiums
${CAPITALIZATION_RATE_DATA.industryRiskPremiums.slice(0, 10).map(irp =>
  `- ${irp.sector}: ${(irp.industryRiskPremium * 100).toFixed(1)}%`
).join('\n')}
`;

  const priorContext = `
## PRIOR PASS DATA

### Pass 3 Output (Working Capital)
Excess Working Capital: $${(pass3.working_capital_analysis?.[0]?.net_working_capital || 0).toLocaleString()}
Working Capital % Revenue: N/A

### Pass 4 Output (Industry Multiples)
Industry SDE Multiple: ${pass4.valuation_multiples?.transaction_multiples?.sde_multiple?.median || 'N/A'}x
Industry EBITDA Multiple: ${pass4.valuation_multiples?.transaction_multiples?.ebitda_multiple?.median || 'N/A'}x
Industry Growth Rate: ${((pass4.industry_overview?.market_growth?.projected_growth_rate || 0) * 100).toFixed(1)}%

### Pass 5 Output (Normalized Earnings)
Normalized SDE: $${(pass5.summary?.most_recent_sde || 0).toLocaleString()}
Weighted Average SDE: $${(pass5.summary?.weighted_average_sde || 0).toLocaleString()}
Normalized EBITDA: $${(pass5.summary?.most_recent_ebitda || 0).toLocaleString()}

### Pass 6 Output (Risk Assessment & Cap Rate Components)
Recommended Cap Rate: ${((pass6.risk_premium_calculation?.capitalization_rate || 0) * 100).toFixed(1)}%
Company-Specific Risk Premium: ${((pass6.risk_premium_calculation?.company_specific_risk_premium?.total_company_specific || 0) * 100).toFixed(1)}%
Risk Score: ${pass6.risk_summary?.overall_risk_score?.toFixed(2) || 'N/A'}

${capRateKnowledge}
`;

  return {
    system: config.systemPrompt,
    prompt: priorContext + '\n\n' + config.userPrompt,
  };
}

/**
 * Build Pass 9 request - Market Approach (no PDFs, uses Pass 1, 4, 5, 6)
 */
function buildPass9Request(pass1: Pass1Output, pass4: Pass4Output, pass5: Pass5Output, pass6: Pass6Output): { system: string; prompt: string } {
  const config = getPromptConfig(9)!;

  const priorContext = `
## PRIOR PASS DATA

### Pass 1 Output (Company Profile)
Company: ${pass1.company_profile?.legal_name || 'Unknown'}
Revenue: $${(pass1.company_profile?.primary_revenue_sources?.[0]?.percentage_of_revenue || 0).toLocaleString()}
Years in Business: ${pass1.company_profile?.years_in_business || 'Unknown'}

### Pass 4 Output (Industry Multiples - BASE MULTIPLES)
SDE Multiple Range: ${pass4.valuation_multiples?.transaction_multiples?.sde_multiple?.low || 'N/A'}x - ${pass4.valuation_multiples?.transaction_multiples?.sde_multiple?.high || 'N/A'}x
SDE Multiple Median: ${pass4.valuation_multiples?.transaction_multiples?.sde_multiple?.median || 'N/A'}x
Revenue Multiple Range: ${pass4.valuation_multiples?.transaction_multiples?.revenue_multiple?.low || 'N/A'}x - ${pass4.valuation_multiples?.transaction_multiples?.revenue_multiple?.high || 'N/A'}x
Multiple Source: ${pass4.valuation_multiples?.transaction_multiples?.source || 'Industry data'}

### Pass 5 Output (Normalized Earnings)
Normalized SDE: $${(pass5.summary?.most_recent_sde || 0).toLocaleString()}
Weighted Average SDE: $${(pass5.summary?.weighted_average_sde || 0).toLocaleString()}
SDE Trend: ${pass5.summary?.sde_trend || 'Unknown'}

### Pass 6 Output (Risk Factors for Multiple Adjustments)
Overall Risk Score: ${pass6.risk_summary?.overall_risk_score?.toFixed(2) || 'N/A'}/10
Risk Rating: ${pass6.risk_summary?.overall_risk_level || 'N/A'}
Recommended Multiple Adjustment: ${pass6.multiple_adjustment?.risk_adjustment_factor || 1}x
Key Risk Factors: ${pass6.risk_summary?.top_risk_factors?.slice(0, 5).map(rf => rf.factor).join(', ') || 'N/A'}
`;

  return {
    system: config.systemPrompt,
    prompt: priorContext + '\n\n' + config.userPrompt,
  };
}

/**
 * Build Pass 10 request - Value Synthesis (uses Pass 1, 3, 4, 5, 6, 7, 8, 9)
 */
function buildPass10Request(
  pass1: Pass1Output, pass3: Pass3Output, pass4: Pass4Output, pass5: Pass5Output,
  pass6: Pass6Output, pass7: Pass7Output, pass8: Pass8Output, pass9: Pass9Output
): { system: string; prompt: string } {
  const config = getPromptConfig(10)!;

  // Inject DLOM studies
  const dlomKnowledge = `
## DLOM Reference Data

### Restricted Stock Studies
${DLOM_STUDIES.restrictedStockStudies.slice(0, 5).map(s =>
  `- ${s.studyName}: ${(s.averageDiscount * 100).toFixed(1)}% average (${s.sampleSize} transactions)`
).join('\n')}

### Factors Affecting DLOM
${DLOM_STUDIES.factorsAffectingDLOM.slice(0, 6).map(f =>
  `- ${f.factor}: ${f.impact === 'increases_dlom' ? 'Increases' : 'Decreases'} DLOM`
).join('\n')}
`;

  const priorContext = `
## PRIOR PASS DATA

### Pass 1 Output (Ownership)
Ownership Being Valued: ${Array.isArray(pass1.ownership_info?.owners) && pass1.ownership_info.owners[0]?.ownership_percentage || 100}%
Entity Type: ${pass1.ownership_info?.ownership_type || 'Unknown'}

### Pass 3 Output (Working Capital Adjustment)
Working Capital: $${(pass3.key_metrics?.most_recent_working_capital || 0).toLocaleString()}

### Pass 4 Output (Industry Benchmarks)
Industry Median SDE Multiple: ${pass4.valuation_multiples?.transaction_multiples?.sde_multiple?.median || 'N/A'}x

### Pass 5 Output (Normalized Earnings)
Normalized SDE: $${(pass5.summary?.most_recent_sde || 0).toLocaleString()}
Normalized EBITDA: $${(pass5.summary?.most_recent_ebitda || 0).toLocaleString()}

### Pass 6 Output (Risk Assessment)
Overall Risk Score: ${pass6.risk_summary?.overall_risk_score?.toFixed(2) || 'N/A'}

### VALUATION APPROACH RESULTS

### Pass 7 Output (Asset Approach)
Adjusted Book Value: $${(pass7.asset_approach?.adjusted_book_value || 0).toLocaleString()}
Suggested Weight: ${pass7.weighting_recommendation?.suggested_weight || 15}%

### Pass 8 Output (Income Approach)
Indicated Value: $${(pass8.income_approach?.single_period_capitalization?.adjusted_indicated_value || 0).toLocaleString()}
Capitalization Rate: ${((pass8.income_approach?.capitalization_rate_buildup?.capitalization_rate || 0) * 100).toFixed(1)}%
Suggested Weight: ${pass8.weighting_recommendation?.suggested_weight || 45}%

### Pass 9 Output (Market Approach)
Indicated Value: $${(pass9.market_approach?.indicated_value_point || 0).toLocaleString()}
Selected SDE Multiple: ${pass9.market_approach?.guideline_transaction_method?.selected_multiple || 'N/A'}x
Suggested Weight: ${pass9.weighting_recommendation?.suggested_weight || 40}%

${dlomKnowledge}
`;

  return {
    system: config.systemPrompt,
    prompt: priorContext + '\n\n' + config.userPrompt,
  };
}

/**
 * Build Pass 11 request - Narratives (uses all prior passes)
 */
function buildPass11Request(
  pass1: Pass1Output, pass2: Pass2Output, pass3: Pass3Output, pass4: Pass4Output,
  pass5: Pass5Output, pass6: Pass6Output, pass7: Pass7Output, pass8: Pass8Output,
  pass9: Pass9Output, pass10: Pass10Output
): { system: string; prompt: string } {
  const config = getPromptConfig(11)!;

  const priorContext = `
## COMPLETE PRIOR PASS DATA

### Pass 1: Company Profile
${JSON.stringify({
  company: pass1.company_profile?.legal_name,
  years_in_business: pass1.company_profile?.years_in_business,
  employees: pass1.company_profile?.number_of_employees,
  industry: pass1.industry_classification?.naics_description,
  ownership: pass1.ownership_info,
}, null, 2)}

### Pass 2: Income Statements
${JSON.stringify(pass2.income_statements?.slice(0, 3) || [], null, 2)}

### Pass 3: Balance Sheet & Working Capital
${JSON.stringify({
  balance_sheet: pass3.balance_sheets?.[0],
  working_capital: pass3.working_capital_analysis,
  key_metrics: pass3.key_metrics,
}, null, 2)}

### Pass 4: Industry Analysis
${JSON.stringify({
  industry: pass4.industry_overview,
  benchmarks: pass4.industry_benchmarks,
  multiples: pass4.valuation_multiples,
  competitive: pass4.competitive_landscape,
}, null, 2)}

### Pass 5: Normalized Earnings
${JSON.stringify({
  summary: pass5.summary,
  sde_calculations: pass5.sde_calculations?.slice(0, 3),
  earnings_quality: pass5.earnings_quality,
}, null, 2)}

### Pass 6: Risk Assessment
${JSON.stringify({
  risk_summary: pass6.risk_summary,
  risk_premium: pass6.risk_premium_calculation,
  multiple_adjustment: pass6.multiple_adjustment,
}, null, 2)}

### Pass 7: Asset Approach
${JSON.stringify({
  adjusted_book_value: pass7.asset_approach?.adjusted_book_value,
  weight: pass7.weighting_recommendation?.suggested_weight,
}, null, 2)}

### Pass 8: Income Approach
${JSON.stringify({
  indicated_value: pass8.income_approach?.single_period_capitalization?.adjusted_indicated_value,
  cap_rate: pass8.income_approach?.capitalization_rate_buildup?.capitalization_rate,
  weight: pass8.weighting_recommendation?.suggested_weight,
}, null, 2)}

### Pass 9: Market Approach
${JSON.stringify({
  indicated_value: pass9.market_approach?.indicated_value_point,
  selected_multiple: pass9.market_approach?.guideline_transaction_method?.selected_multiple,
  weight: pass9.weighting_recommendation?.suggested_weight,
}, null, 2)}

### Pass 10: Value Synthesis
${JSON.stringify({
  preliminary_value: pass10.value_synthesis?.preliminary_value_point,
  discounts: pass10.value_synthesis?.discounts_premiums,
  final_value: pass10.value_synthesis?.final_value_point,
  range: { low: pass10.value_synthesis?.final_value_low, high: pass10.value_synthesis?.final_value_high },
  conclusion: pass10.conclusion,
}, null, 2)}
`;

  return {
    system: config.systemPrompt,
    prompt: priorContext + '\n\n' + config.userPrompt,
  };
}

/**
 * Build Pass 12 request - Quality Review (uses all prior passes)
 */
function buildPass12Request(
  pass1: Pass1Output, pass2: Pass2Output, pass3: Pass3Output, pass4: Pass4Output,
  pass5: Pass5Output, pass6: Pass6Output, pass7: Pass7Output, pass8: Pass8Output,
  pass9: Pass9Output, pass10: Pass10Output, pass11: Pass11Output
): { system: string; prompt: string } {
  const config = getPromptConfig(12)!;

  // Provide all pass outputs for comprehensive review
  const allPassData = `
## ALL PASS OUTPUTS FOR QUALITY REVIEW

### Pass 1: Document Classification & Company Profile
${JSON.stringify(pass1, null, 2)}

### Pass 2: Income Statement Extraction
${JSON.stringify(pass2, null, 2)}

### Pass 3: Balance Sheet & Working Capital
${JSON.stringify(pass3, null, 2)}

### Pass 4: Industry Research & Analysis
${JSON.stringify(pass4, null, 2)}

### Pass 5: Earnings Normalization
${JSON.stringify(pass5, null, 2)}

### Pass 6: Risk Assessment
${JSON.stringify(pass6, null, 2)}

### Pass 7: Asset Approach Valuation
${JSON.stringify(pass7, null, 2)}

### Pass 8: Income Approach Valuation
${JSON.stringify(pass8, null, 2)}

### Pass 9: Market Approach Valuation
${JSON.stringify(pass9, null, 2)}

### Pass 10: Value Synthesis & Reconciliation
${JSON.stringify(pass10, null, 2)}

### Pass 11: Executive Summary & Narratives
${JSON.stringify(pass11, null, 2)}
`;

  return {
    system: config.systemPrompt,
    prompt: allPassData + '\n\n' + config.userPrompt,
  };
}

// =============================================================================
// FINAL REPORT BUILDER
// =============================================================================

/**
 * Build the final report from all pass outputs
 */
function buildFinalReport(
  reportId: string,
  pass1: Pass1Output,
  pass2: Pass2Output,
  pass3: Pass3Output,
  pass4: Pass4Output,
  pass5: Pass5Output,
  pass6: Pass6Output,
  pass7: Pass7Output,
  pass8: Pass8Output,
  pass9: Pass9Output,
  pass10: Pass10Output,
  pass11: Pass11Output,
  pass12: Pass12Output
): TwelvePassFinalReport {
  return {
    report_id: reportId,
    report_version: '2.0.0',
    generated_at: new Date().toISOString(),

    company_profile: pass1.company_profile as CompanyProfile,
    valuation_date: pass10.conclusion?.valuation_date || new Date().toISOString().split('T')[0],
    standard_of_value: pass10.conclusion?.standard_of_value || 'fair_market_value',
    premise_of_value: pass10.conclusion?.premise_of_value || 'going_concern',

    financial_summary: {
      years_analyzed: pass2.income_statements?.length || 0,
      most_recent_year: pass2.income_statements?.[0]?.fiscal_year || new Date().getFullYear(),
      revenue: pass2.income_statements?.[0]?.revenue?.total_revenue || 0,
      gross_profit: pass2.income_statements?.[0]?.gross_profit || 0,
      operating_income: pass2.income_statements?.[0]?.operating_income || 0,
      net_income: pass2.income_statements?.[0]?.net_income || 0,
      sde: pass5.summary?.most_recent_sde || 0,
      ebitda: pass5.summary?.most_recent_ebitda || 0,
      total_assets: pass3.balance_sheets?.[0]?.total_assets || 0,
      total_liabilities: pass3.balance_sheets?.[0]?.total_liabilities || 0,
      equity: (pass3.balance_sheets?.[0]?.total_assets || 0) - (pass3.balance_sheets?.[0]?.total_liabilities || 0),
    },

    valuation_conclusion: {
      concluded_value: pass10.value_synthesis?.final_value_point || pass10.conclusion?.concluded_value || 0,
      value_range_low: pass10.value_synthesis?.final_value_low || pass10.conclusion?.value_range?.low || 0,
      value_range_high: pass10.value_synthesis?.final_value_high || pass10.conclusion?.value_range?.high || 0,
      confidence_level: pass10.conclusion?.confidence_level || 'medium',

      approaches_used: [
        {
          approach: 'Asset',
          indicated_value: pass7.asset_approach?.adjusted_book_value || 0,
          weight: pass7.weighting_recommendation?.suggested_weight || 15,
        },
        {
          approach: 'Income',
          indicated_value: pass8.income_approach?.single_period_capitalization?.adjusted_indicated_value || 0,
          weight: pass8.weighting_recommendation?.suggested_weight || 45,
        },
        {
          approach: 'Market',
          indicated_value: pass9.market_approach?.indicated_value_point || 0,
          weight: pass9.weighting_recommendation?.suggested_weight || 40,
        },
      ],

      discounts_applied: pass10.value_synthesis?.discounts_premiums?.map(dp => ({
        type: dp.name,
        rate: dp.rate,
        amount: dp.amount,
      })) || [],
    },

    pass_outputs: {
      pass_1: pass1,
      pass_2: pass2,
      pass_3: pass3,
      pass_4: pass4,
      pass_5: pass5,
      pass_6: pass6,
      pass_7: pass7,
      pass_8: pass8,
      pass_9: pass9,
      pass_10: pass10,
      pass_11: pass11,
      pass_12: pass12,
    },

    executive_summary: pass11.executive_summary as ExecutiveSummary,
    report_narratives: pass11.report_narratives as ReportNarratives,

    quality_score: pass12.quality_summary?.overall_quality_score || 0,
    quality_grade: pass12.quality_summary?.quality_grade || 'C',
    data_limitations: pass12.report_status?.warnings || [],
    key_assumptions: pass10.key_value_drivers?.map(d => d.description) || [],
  };
}

// =============================================================================
// DATABASE HELPERS
// =============================================================================

/**
 * Save data to database
 */
async function saveToDatabase(
  supabase: ReturnType<typeof createServerClient>,
  reportId: string,
  data: Record<string, any>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('reports')
      .update(data)
      .eq('id', reportId);

    if (error) {
      console.error(`[12-PASS] Database update failed:`, error);
    }
  } catch (err) {
    console.error(`[12-PASS] Database error:`, err);
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Clean JSON response by stripping markdown code fences
 * Claude sometimes wraps JSON in ```json ... ``` even when told not to
 */
function cleanJsonResponse(response: string): string {
  let cleaned = response.trim();

  // Remove markdown code fences
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }

  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }

  return cleaned.trim();
}

/**
 * Parse JSON from Claude response, handling markdown code blocks
 */
function parsePassOutput<T>(response: string): T | null {
  try {
    // First, try to clean and parse directly (most common case)
    const cleaned = cleanJsonResponse(response);
    try {
      return JSON.parse(cleaned);
    } catch {
      // Continue to fallback methods
    }

    // Fallback: Try to extract JSON from markdown code block with regex
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }

    // Fallback: Try to find JSON object directly by finding { and }
    const jsonStart = response.indexOf('{');
    const jsonEnd = response.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      const jsonStr = response.substring(jsonStart, jsonEnd + 1);
      return JSON.parse(jsonStr);
    }

    // Final fallback: Try parsing the entire response
    return JSON.parse(response);
  } catch (error) {
    console.error('[12-PASS] Failed to parse JSON from response:', error);
    console.error('[12-PASS] Response preview:', response.substring(0, 500));
    return null;
  }
}

/**
 * Calculate cost from token usage
 */
function calculateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * PRICING.inputTokensPer1M;
  const outputCost = (outputTokens / 1_000_000) * PRICING.outputTokensPer1M;
  return Math.round((inputCost + outputCost) * 10000) / 10000;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get a summary of what was found in a pass for logging
 */
function getPassCompletionSummary(passNumber: number, output: PassOutput): string {
  switch (passNumber) {
    case 1:
      const p1 = output as Pass1Output;
      return `${p1.company_profile?.legal_name || 'Company'} identified`;
    case 2:
      const p2 = output as Pass2Output;
      return `${p2.income_statements?.length || 0} years extracted`;
    case 3:
      const p3 = output as Pass3Output;
      return `WC: $${(p3.key_metrics?.most_recent_working_capital || 0).toLocaleString()}`;
    case 4:
      const p4 = output as Pass4Output;
      return `Industry: ${p4.industry_overview?.industry_name || 'Analyzed'}`;
    case 5:
      const p5 = output as Pass5Output;
      return `SDE: $${(p5.summary?.most_recent_sde || 0).toLocaleString()}`;
    case 6:
      const p6 = output as Pass6Output;
      return `Risk Score: ${p6.risk_summary?.overall_risk_score?.toFixed(1) || 'N/A'}`;
    case 7:
      const p7 = output as Pass7Output;
      return `NAV: $${(p7.asset_approach?.adjusted_book_value || 0).toLocaleString()}`;
    case 8:
      const p8 = output as Pass8Output;
      return `Value: $${(p8.income_approach?.single_period_capitalization?.adjusted_indicated_value || 0).toLocaleString()}`;
    case 9:
      const p9 = output as Pass9Output;
      return `Value: $${(p9.market_approach?.indicated_value_point || 0).toLocaleString()}`;
    case 10:
      const p10 = output as Pass10Output;
      return `Concluded: $${(p10.value_synthesis?.final_value_point || 0).toLocaleString()}`;
    case 11:
      const p11 = output as Pass11Output;
      return `${p11.report_metadata?.total_word_count || 0} words generated`;
    case 12:
      const p12 = output as Pass12Output;
      return `Quality: ${p12.quality_summary?.quality_grade || 'N/A'}`;
    default:
      return 'Complete';
  }
}

/**
 * Update pass metrics tracking
 */
function updateMetrics(
  result: PassResult<any>,
  passMetrics: PassMetrics[],
  totalInput: number,
  totalOutput: number,
  totalRetries: number
): void {
  const passNumber = passMetrics.length + 1;
  const passName = PASS_METADATA[passNumber as keyof typeof PASS_METADATA]?.name || `Pass ${passNumber}`;

  passMetrics.push({
    pass_number: passNumber,
    pass_name: passName,
    start_time: new Date(Date.now() - result.processingTime).toISOString(),
    end_time: new Date().toISOString(),
    duration_ms: result.processingTime,
    tokens_input: result.inputTokens,
    tokens_output: result.outputTokens,
    tokens_total: result.inputTokens + result.outputTokens,
    cost_usd: calculateCost(result.inputTokens, result.outputTokens),
    retry_count: result.retryCount,
    success: result.success,
    error_message: result.error,
  });
}

/**
 * Find sector multiples based on Pass 1 output
 */
function findSectorMultiples(pass1: Pass1Output) {
  // Handle both snake_case and camelCase field names
  const industryClass = pass1.industry_classification || (pass1 as unknown as Record<string, unknown>).industryClassification as typeof pass1.industry_classification;
  const companyProf = pass1.company_profile || (pass1 as unknown as Record<string, unknown>).companyProfile as typeof pass1.company_profile;

  const naicsCode = industryClass?.naics_code || '';
  const keywords = companyProf?.products_services || [];

  // Map NAICS prefixes to sectors
  const naicsSectorMap: Record<string, string> = {
    '23': 'Construction',
    '31': 'Manufacturing',
    '32': 'Manufacturing',
    '33': 'Manufacturing',
    '44': 'Retail',
    '45': 'Retail',
    '51': 'Technology/Software',
    '54': 'Professional Services',
    '62': 'Healthcare Services',
    '72': 'Food & Beverage',
  };

  let sector = 'General Business';
  if (naicsCode && naicsCode.length >= 2) {
    const prefix = naicsCode.substring(0, 2);
    sector = naicsSectorMap[prefix] || sector;
  }

  return SECTOR_MULTIPLES.find(sm => sm.sector === sector) || SECTOR_MULTIPLES[0];
}

// =============================================================================
// PER-DOCUMENT EXTRACTION HELPERS (Pass 1-3)
// =============================================================================

/**
 * Execute a single-document extraction pass
 * Used for Pass 1-3 to avoid exceeding the 100-page limit
 */
async function executeSingleDocumentExtraction<T extends PassOutput>(
  client: Anthropic,
  passNumber: number,
  singlePdfBase64: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  temperature: number,
  documentIndex: number,
  totalDocuments: number
): Promise<PassResult<T>> {
  const startTime = Date.now();
  let retryCount = 0;
  let lastError = '';

  console.log(`[12-PASS] Processing document ${documentIndex + 1}/${totalDocuments} for Pass ${passNumber}`);

  while (retryCount <= MAX_RETRIES) {
    try {
      const messages: Anthropic.MessageParam[] = [
        {
          role: 'user',
          content: [
            {
              type: 'document' as const,
              source: {
                type: 'base64' as const,
                media_type: 'application/pdf' as const,
                data: singlePdfBase64,
              },
            },
            {
              type: 'text' as const,
              text: userPrompt,
            },
          ],
        },
      ];

      const response = await client.messages.create({
        model: MODEL,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages,
      });

      const responseText = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map(block => block.text)
        .join('\n');

      const parsed = parsePassOutput<T>(responseText);

      if (!parsed) {
        throw new Error(`Failed to parse JSON from Pass ${passNumber} response for document ${documentIndex + 1}`);
      }

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        output: parsed as T,
        rawResponse: responseText,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        processingTime,
        retryCount,
      };

    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`[12-PASS] Pass ${passNumber} document ${documentIndex + 1} attempt ${retryCount + 1}/${MAX_RETRIES + 1} failed: ${lastError}`);
      retryCount++;

      if (retryCount <= MAX_RETRIES) {
        const delay = 1000 * Math.pow(2, retryCount);
        console.log(`[12-PASS] Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  return {
    success: false,
    output: null,
    rawResponse: '',
    inputTokens: 0,
    outputTokens: 0,
    processingTime: Date.now() - startTime,
    error: lastError,
    retryCount,
  };
}

// =============================================================================
// MERGE FUNCTIONS FOR MULTI-DOCUMENT EXTRACTION
// =============================================================================

/**
 * Merge multiple Pass1Output results from individual documents
 * Uses the first document's company profile as primary and enhances with others
 */
function mergePass1Outputs(outputs: Pass1Output[]): Pass1Output {
  if (outputs.length === 0) {
    throw new Error('No Pass 1 outputs to merge');
  }
  if (outputs.length === 1) {
    return outputs[0];
  }

  // Use the first document's output as the base
  const base = { ...outputs[0] };

  // Merge document info - combine quality notes and schedules
  const allQualityNotes = new Set<string>();
  const allSchedulesPresent = new Set<string>();
  const allMissingSchedules = new Set<string>();
  let totalPagesAnalyzed = 0;

  outputs.forEach(output => {
    totalPagesAnalyzed += output.document_info?.pages_analyzed || 0;
    output.document_info?.quality_notes?.forEach(note => allQualityNotes.add(note));
    output.document_info?.schedules_present?.forEach(schedule => allSchedulesPresent.add(schedule));
    output.document_info?.missing_schedules?.forEach(schedule => allMissingSchedules.add(schedule));
  });

  base.document_info = {
    ...base.document_info,
    pages_analyzed: totalPagesAnalyzed,
    quality_notes: Array.from(allQualityNotes),
    schedules_present: Array.from(allSchedulesPresent),
    missing_schedules: Array.from(allMissingSchedules).filter(s => !allSchedulesPresent.has(s)),
  };

  // Merge data quality assessment
  const allMissingCritical = new Set<string>();
  const allDataLimitations = new Set<string>();
  const allAssumptions = new Set<string>();
  let avgCompleteness = 0;
  let avgReliability = 0;

  outputs.forEach(output => {
    avgCompleteness += output.data_quality_assessment?.completeness_score || 0;
    avgReliability += output.data_quality_assessment?.reliability_score || 0;
    output.data_quality_assessment?.missing_critical_data?.forEach(d => allMissingCritical.add(d));
    output.data_quality_assessment?.data_limitations?.forEach(d => allDataLimitations.add(d));
    output.data_quality_assessment?.assumptions_required?.forEach(a => allAssumptions.add(a));
  });

  base.data_quality_assessment = {
    ...base.data_quality_assessment,
    completeness_score: Math.round(avgCompleteness / outputs.length),
    reliability_score: Math.round(avgReliability / outputs.length),
    missing_critical_data: Array.from(allMissingCritical),
    data_limitations: Array.from(allDataLimitations),
    assumptions_required: Array.from(allAssumptions),
  };

  console.log(`[12-PASS] Merged ${outputs.length} Pass 1 outputs (${totalPagesAnalyzed} total pages)`);
  return base;
}

/**
 * Merge multiple Pass2Output results from individual documents
 * Combines income statements from all years, deduplicating by fiscal year
 */
function mergePass2Outputs(outputs: Pass2Output[]): Pass2Output {
  if (outputs.length === 0) {
    throw new Error('No Pass 2 outputs to merge');
  }
  if (outputs.length === 1) {
    return outputs[0];
  }

  // Collect all income statements, keyed by fiscal year
  const incomeStatementsByYear = new Map<number, Pass2Output['income_statements'][0]>();

  outputs.forEach(output => {
    output.income_statements?.forEach(is => {
      if (is.fiscal_year) {
        // Keep the more complete version if duplicate year
        const existing = incomeStatementsByYear.get(is.fiscal_year);
        if (!existing || (is.revenue?.total_revenue || 0) > (existing.revenue?.total_revenue || 0)) {
          incomeStatementsByYear.set(is.fiscal_year, is);
        }
      }
    });
  });

  // Sort by year descending (most recent first)
  const mergedStatements = Array.from(incomeStatementsByYear.values())
    .sort((a, b) => b.fiscal_year - a.fiscal_year);

  // Use the first output as base and update with merged data
  const base: Pass2Output = {
    ...outputs[0],
    income_statements: mergedStatements,
    years_analyzed: mergedStatements.length,
  };

  // Recalculate trend analysis
  if (mergedStatements.length >= 2) {
    const revenues = mergedStatements.map(is => is.revenue?.total_revenue || 0).reverse();
    const grossProfits = mergedStatements.map(is => is.gross_profit || 0).reverse();
    const netIncomes = mergedStatements.map(is => is.net_income || 0).reverse();

    const years = mergedStatements.length;
    const revenueCAGR = revenues.length >= 2 && revenues[0] > 0
      ? Math.pow(revenues[revenues.length - 1] / revenues[0], 1 / (years - 1)) - 1
      : 0;
    const grossProfitCAGR = grossProfits.length >= 2 && grossProfits[0] > 0
      ? Math.pow(grossProfits[grossProfits.length - 1] / grossProfits[0], 1 / (years - 1)) - 1
      : 0;

    base.trend_analysis = {
      ...base.trend_analysis,
      revenue_cagr: revenueCAGR,
      gross_profit_cagr: grossProfitCAGR,
      revenue_trend: revenueCAGR > 0.05 ? 'growing' : revenueCAGR < -0.05 ? 'declining' : 'stable',
    };
  }

  // Recalculate key metrics
  if (mergedStatements.length > 0) {
    const avgRevenue = mergedStatements.reduce((sum, is) => sum + (is.revenue?.total_revenue || 0), 0) / mergedStatements.length;
    const avgGrossMargin = mergedStatements.reduce((sum, is) => sum + (is.gross_margin_percentage || 0), 0) / mergedStatements.length;
    const avgOperatingMargin = mergedStatements.reduce((sum, is) => sum + (is.operating_margin_percentage || 0), 0) / mergedStatements.length;
    const avgNetMargin = mergedStatements.reduce((sum, is) => sum + (is.net_margin_percentage || 0), 0) / mergedStatements.length;

    base.key_metrics = {
      ...base.key_metrics,
      average_revenue: avgRevenue,
      average_gross_margin: avgGrossMargin,
      average_operating_margin: avgOperatingMargin,
      average_net_margin: avgNetMargin,
      most_recent_revenue: mergedStatements[0]?.revenue?.total_revenue || 0,
      most_recent_net_income: mergedStatements[0]?.net_income || 0,
    };
  }

  // Merge extraction confidence notes
  const allConfidenceNotes = new Set<string>();
  outputs.forEach(output => {
    output.extraction_confidence?.notes?.forEach(note => allConfidenceNotes.add(note));
  });
  base.extraction_confidence = {
    ...base.extraction_confidence,
    notes: Array.from(allConfidenceNotes),
  };

  console.log(`[12-PASS] Merged ${outputs.length} Pass 2 outputs (${mergedStatements.length} unique years)`);
  return base;
}

/**
 * Merge multiple Pass3Output results from individual documents
 * Combines balance sheets from all years, deduplicating by fiscal year
 */
function mergePass3Outputs(outputs: Pass3Output[]): Pass3Output {
  if (outputs.length === 0) {
    throw new Error('No Pass 3 outputs to merge');
  }
  if (outputs.length === 1) {
    return outputs[0];
  }

  // Collect all balance sheets, keyed by fiscal year
  const balanceSheetsByYear = new Map<number, Pass3Output['balance_sheets'][0]>();

  outputs.forEach(output => {
    output.balance_sheets?.forEach(bs => {
      if (bs.fiscal_year) {
        const existing = balanceSheetsByYear.get(bs.fiscal_year);
        if (!existing || (bs.total_assets || 0) > (existing.total_assets || 0)) {
          balanceSheetsByYear.set(bs.fiscal_year, bs);
        }
      }
    });
  });

  // Sort by year descending
  const mergedBalanceSheets = Array.from(balanceSheetsByYear.values())
    .sort((a, b) => b.fiscal_year - a.fiscal_year);

  // Collect all working capital analyses, keyed by fiscal year
  const wcByYear = new Map<number, Pass3Output['working_capital_analysis'][0]>();

  outputs.forEach(output => {
    output.working_capital_analysis?.forEach(wc => {
      if (wc.fiscal_year) {
        const existing = wcByYear.get(wc.fiscal_year);
        if (!existing) {
          wcByYear.set(wc.fiscal_year, wc);
        }
      }
    });
  });

  const mergedWC = Array.from(wcByYear.values())
    .sort((a, b) => b.fiscal_year - a.fiscal_year);

  // Use the first output as base
  const base: Pass3Output = {
    ...outputs[0],
    balance_sheets: mergedBalanceSheets,
    working_capital_analysis: mergedWC,
  };

  // Recalculate key metrics
  if (mergedBalanceSheets.length > 0) {
    const mostRecent = mergedBalanceSheets[0];
    const avgCurrentRatio = mergedWC.reduce((sum, wc) => sum + (wc.current_ratio || 0), 0) / Math.max(mergedWC.length, 1);
    const totalDebt = (mostRecent.current_liabilities?.line_of_credit || 0) +
                      (mostRecent.current_liabilities?.notes_payable_short_term || 0) +
                      (mostRecent.long_term_liabilities?.notes_payable_long_term || 0) +
                      (mostRecent.long_term_liabilities?.mortgage_payable || 0);
    const equity = mostRecent.equity?.total_equity || 0;

    base.key_metrics = {
      most_recent_total_assets: mostRecent.total_assets || 0,
      most_recent_total_liabilities: mostRecent.total_liabilities || 0,
      most_recent_equity: equity,
      most_recent_working_capital: mergedWC[0]?.net_working_capital || 0,
      average_current_ratio: avgCurrentRatio,
      average_debt_to_equity: equity > 0 ? totalDebt / equity : 0,
      tangible_book_value: (mostRecent.total_assets || 0) - (mostRecent.other_assets?.goodwill || 0) - (mostRecent.other_assets?.net_intangibles || 0) - (mostRecent.total_liabilities || 0),
    };
  }

  // Merge off-balance sheet items
  const offBSItems = new Map<string, Pass3Output['off_balance_sheet_items'][0]>();
  outputs.forEach(output => {
    output.off_balance_sheet_items?.forEach(item => {
      if (item.description && !offBSItems.has(item.description)) {
        offBSItems.set(item.description, item);
      }
    });
  });
  base.off_balance_sheet_items = Array.from(offBSItems.values());

  console.log(`[12-PASS] Merged ${outputs.length} Pass 3 outputs (${mergedBalanceSheets.length} unique years)`);
  return base;
}

/**
 * Run Pass 1-3 extractions for all documents individually, then merge
 */
async function runExtractionPassesWithPerDocumentProcessing(
  client: Anthropic,
  supabase: ReturnType<typeof createServerClient>,
  context: PassContext
): Promise<{
  pass1: PassResult<Pass1Output>;
  pass2: PassResult<Pass2Output>;
  pass3: PassResult<Pass3Output>;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalRetries: number;
}> {
  const pdfBase64 = context.pdfBase64;
  const numDocs = pdfBase64.length;

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalRetries = 0;

  console.log(`[12-PASS] Starting per-document extraction for ${numDocs} document(s)`);

  // =========================================================================
  // PASS 1: Document Classification - Process each document separately
  // =========================================================================
  const pass1Config = getPromptConfig(1)!;
  const pass1Outputs: Pass1Output[] = [];
  let pass1TotalTime = 0;
  let pass1InputTokens = 0;
  let pass1OutputTokens = 0;
  let pass1Retries = 0;

  context.onProgress?.(1, 'Document Classification...', PASS_PROGRESS[1]);
  await saveToDatabase(supabase, context.reportId, {
    report_status: 'pass_1_processing',
    processing_progress: PASS_PROGRESS[1],
    processing_message: `Pass 1: Processing ${numDocs} document(s) individually...`,
  });

  const pass1StartTime = Date.now();
  for (let i = 0; i < numDocs; i++) {
    const result = await executeSingleDocumentExtraction<Pass1Output>(
      client,
      1,
      pdfBase64[i],
      pass1Config.systemPrompt,
      pass1Config.userPrompt,
      pass1Config.maxTokens || 8192,
      pass1Config.temperature || 0.2,
      i,
      numDocs
    );

    if (!result.success || !result.output) {
      console.error(`[12-PASS] Pass 1 failed for document ${i + 1}: ${result.error}`);
      return {
        pass1: result as PassResult<Pass1Output>,
        pass2: { success: false, output: null, rawResponse: '', inputTokens: 0, outputTokens: 0, processingTime: 0, retryCount: 0, error: 'Pass 1 failed' },
        pass3: { success: false, output: null, rawResponse: '', inputTokens: 0, outputTokens: 0, processingTime: 0, retryCount: 0, error: 'Pass 1 failed' },
        totalInputTokens: pass1InputTokens,
        totalOutputTokens: pass1OutputTokens,
        totalRetries: pass1Retries,
      };
    }

    pass1Outputs.push(result.output);
    pass1InputTokens += result.inputTokens;
    pass1OutputTokens += result.outputTokens;
    pass1Retries += result.retryCount;
  }
  pass1TotalTime = Date.now() - pass1StartTime;

  // Merge Pass 1 outputs
  const mergedPass1 = mergePass1Outputs(pass1Outputs);
  const pass1Result: PassResult<Pass1Output> = {
    success: true,
    output: mergedPass1,
    rawResponse: '',
    inputTokens: pass1InputTokens,
    outputTokens: pass1OutputTokens,
    processingTime: pass1TotalTime,
    retryCount: pass1Retries,
  };

  totalInputTokens += pass1InputTokens;
  totalOutputTokens += pass1OutputTokens;
  totalRetries += pass1Retries;

  console.log(`[12-PASS] Pass 1 complete: ${mergedPass1.company_profile?.legal_name || 'Company'} identified`);
  context.passOutputs.set(1, mergedPass1);

  await saveToDatabase(supabase, context.reportId, {
    report_status: 'pass_1_complete',
    processing_progress: PASS_PROGRESS[1],
    processing_message: 'Pass 1 complete: Document Classification',
  });

  // =========================================================================
  // PASS 2: Income Statement - Process each document separately
  // =========================================================================
  const pass2Config = getPromptConfig(2)!;
  const pass2Outputs: Pass2Output[] = [];
  let pass2TotalTime = 0;
  let pass2InputTokens = 0;
  let pass2OutputTokens = 0;
  let pass2Retries = 0;

  context.onProgress?.(2, 'Income Statement Extraction...', PASS_PROGRESS[2]);
  await saveToDatabase(supabase, context.reportId, {
    report_status: 'pass_2_processing',
    processing_progress: PASS_PROGRESS[2],
    processing_message: `Pass 2: Processing ${numDocs} document(s) individually...`,
  });

  // Build prior context for Pass 2
  const pass2PriorContext = `
## PRIOR PASS DATA

### Pass 1 Output (Document Classification)
Company: ${mergedPass1.company_profile?.legal_name || 'Unknown'}
Industry: ${mergedPass1.industry_classification?.naics_description || 'Unknown'}
Document Type: ${mergedPass1.document_info?.document_type || 'Unknown'}
`;

  const pass2StartTime = Date.now();
  for (let i = 0; i < numDocs; i++) {
    const result = await executeSingleDocumentExtraction<Pass2Output>(
      client,
      2,
      pdfBase64[i],
      pass2Config.systemPrompt,
      pass2PriorContext + '\n\n' + pass2Config.userPrompt,
      pass2Config.maxTokens || 8192,
      pass2Config.temperature || 0.2,
      i,
      numDocs
    );

    if (!result.success || !result.output) {
      console.error(`[12-PASS] Pass 2 failed for document ${i + 1}: ${result.error}`);
      return {
        pass1: pass1Result,
        pass2: result as PassResult<Pass2Output>,
        pass3: { success: false, output: null, rawResponse: '', inputTokens: 0, outputTokens: 0, processingTime: 0, retryCount: 0, error: 'Pass 2 failed' },
        totalInputTokens: totalInputTokens + pass2InputTokens,
        totalOutputTokens: totalOutputTokens + pass2OutputTokens,
        totalRetries: totalRetries + pass2Retries,
      };
    }

    pass2Outputs.push(result.output);
    pass2InputTokens += result.inputTokens;
    pass2OutputTokens += result.outputTokens;
    pass2Retries += result.retryCount;
  }
  pass2TotalTime = Date.now() - pass2StartTime;

  // Merge Pass 2 outputs
  const mergedPass2 = mergePass2Outputs(pass2Outputs);
  const pass2Result: PassResult<Pass2Output> = {
    success: true,
    output: mergedPass2,
    rawResponse: '',
    inputTokens: pass2InputTokens,
    outputTokens: pass2OutputTokens,
    processingTime: pass2TotalTime,
    retryCount: pass2Retries,
  };

  totalInputTokens += pass2InputTokens;
  totalOutputTokens += pass2OutputTokens;
  totalRetries += pass2Retries;

  console.log(`[12-PASS] Pass 2 complete: ${mergedPass2.income_statements?.length || 0} years extracted`);
  context.passOutputs.set(2, mergedPass2);

  await saveToDatabase(supabase, context.reportId, {
    report_status: 'pass_2_complete',
    processing_progress: PASS_PROGRESS[2],
    processing_message: 'Pass 2 complete: Income Statement Extraction',
  });

  // =========================================================================
  // PASS 3: Balance Sheet - Process each document separately
  // =========================================================================
  const pass3Config = getPromptConfig(3)!;
  const pass3Outputs: Pass3Output[] = [];
  let pass3TotalTime = 0;
  let pass3InputTokens = 0;
  let pass3OutputTokens = 0;
  let pass3Retries = 0;

  context.onProgress?.(3, 'Balance Sheet Extraction...', PASS_PROGRESS[3]);
  await saveToDatabase(supabase, context.reportId, {
    report_status: 'pass_3_processing',
    processing_progress: PASS_PROGRESS[3],
    processing_message: `Pass 3: Processing ${numDocs} document(s) individually...`,
  });

  // Inject working capital benchmarks
  const naicsCode = mergedPass1.industry_classification?.naics_code || '';
  const wcBenchmark = getWorkingCapitalBenchmark(naicsCode.substring(0, 2));

  const pass3PriorContext = `
## PRIOR PASS DATA

### Pass 1 Output (Document Classification)
Company: ${mergedPass1.company_profile?.legal_name || 'Unknown'}
Industry: ${mergedPass1.industry_classification?.naics_description || 'Unknown'}

### Pass 2 Output (Income Statement)
Most Recent Revenue: $${(mergedPass2.income_statements?.[0]?.revenue || 0).toLocaleString()}
Most Recent Net Income: $${(mergedPass2.income_statements?.[0]?.net_income || 0).toLocaleString()}

### Working Capital Benchmarks
${wcBenchmark ? `
Industry: ${wcBenchmark.industry}
DSO Range: ${wcBenchmark.daysSalesOutstanding.min}-${wcBenchmark.daysSalesOutstanding.max} days
DIO Range: ${wcBenchmark.daysInventoryOutstanding.min}-${wcBenchmark.daysInventoryOutstanding.max} days
DPO Range: ${wcBenchmark.daysPayableOutstanding.min}-${wcBenchmark.daysPayableOutstanding.max} days
WC % Revenue: ${(wcBenchmark.workingCapitalAsPercentOfRevenue.min * 100).toFixed(0)}%-${(wcBenchmark.workingCapitalAsPercentOfRevenue.max * 100).toFixed(0)}%
` : 'No specific benchmarks available for this industry.'}
`;

  const pass3StartTime = Date.now();
  for (let i = 0; i < numDocs; i++) {
    const result = await executeSingleDocumentExtraction<Pass3Output>(
      client,
      3,
      pdfBase64[i],
      pass3Config.systemPrompt,
      pass3PriorContext + '\n\n' + pass3Config.userPrompt,
      pass3Config.maxTokens || 8192,
      pass3Config.temperature || 0.2,
      i,
      numDocs
    );

    if (!result.success || !result.output) {
      console.error(`[12-PASS] Pass 3 failed for document ${i + 1}: ${result.error}`);
      return {
        pass1: pass1Result,
        pass2: pass2Result,
        pass3: result as PassResult<Pass3Output>,
        totalInputTokens: totalInputTokens + pass3InputTokens,
        totalOutputTokens: totalOutputTokens + pass3OutputTokens,
        totalRetries: totalRetries + pass3Retries,
      };
    }

    pass3Outputs.push(result.output);
    pass3InputTokens += result.inputTokens;
    pass3OutputTokens += result.outputTokens;
    pass3Retries += result.retryCount;
  }
  pass3TotalTime = Date.now() - pass3StartTime;

  // Merge Pass 3 outputs
  const mergedPass3 = mergePass3Outputs(pass3Outputs);
  const pass3Result: PassResult<Pass3Output> = {
    success: true,
    output: mergedPass3,
    rawResponse: '',
    inputTokens: pass3InputTokens,
    outputTokens: pass3OutputTokens,
    processingTime: pass3TotalTime,
    retryCount: pass3Retries,
  };

  totalInputTokens += pass3InputTokens;
  totalOutputTokens += pass3OutputTokens;
  totalRetries += pass3Retries;

  console.log(`[12-PASS] Pass 3 complete: WC: $${(mergedPass3.key_metrics?.most_recent_working_capital || 0).toLocaleString()}`);
  context.passOutputs.set(3, mergedPass3);

  await saveToDatabase(supabase, context.reportId, {
    report_status: 'pass_3_complete',
    processing_progress: PASS_PROGRESS[3],
    processing_message: 'Pass 3 complete: Balance Sheet Extraction',
  });

  return {
    pass1: pass1Result,
    pass2: pass2Result,
    pass3: pass3Result,
    totalInputTokens,
    totalOutputTokens,
    totalRetries,
  };
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

class PassError extends Error {
  passNumber: number;

  constructor(passNumber: number, message: string) {
    super(`Pass ${passNumber} failed: ${message}`);
    this.passNumber = passNumber;
    this.name = 'PassError';
  }
}

function createPassError(passNumber: number, error?: string): PassError {
  return new PassError(passNumber, error || 'Unknown error');
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  PRICING,
  MODEL,
  MAX_RETRIES,
  ORCHESTRATOR_VERSION,
  parsePassOutput,
  calculateCost,
};

export default {
  runTwelvePassValuation,
  parsePassOutput,
  calculateCost,
};
