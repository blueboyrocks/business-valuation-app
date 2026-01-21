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
    // PASS 1: Document Classification & Company Profile
    // =========================================================================
    const pass1Result = await executePassWithLogging<Pass1Output>(
      client, supabase, context, 1,
      () => buildPass1Request(pdfBase64),
      'Document Classification'
    );
    if (!pass1Result.success) throw createPassError(1, pass1Result.error);
    updateMetrics(pass1Result, passMetrics, totalInputTokens, totalOutputTokens, totalRetries);
    totalInputTokens += pass1Result.inputTokens;
    totalOutputTokens += pass1Result.outputTokens;
    totalRetries += pass1Result.retryCount;
    passOutputs.set(1, pass1Result.output!);

    // =========================================================================
    // PASS 2: Income Statement Extraction
    // =========================================================================
    const pass2Result = await executePassWithLogging<Pass2Output>(
      client, supabase, context, 2,
      () => buildPass2Request(pdfBase64, pass1Result.output!),
      'Income Statement Extraction'
    );
    if (!pass2Result.success) throw createPassError(2, pass2Result.error);
    updateMetrics(pass2Result, passMetrics, totalInputTokens, totalOutputTokens, totalRetries);
    totalInputTokens += pass2Result.inputTokens;
    totalOutputTokens += pass2Result.outputTokens;
    totalRetries += pass2Result.retryCount;
    passOutputs.set(2, pass2Result.output!);

    // =========================================================================
    // PASS 3: Balance Sheet & Working Capital
    // =========================================================================
    const pass3Result = await executePassWithLogging<Pass3Output>(
      client, supabase, context, 3,
      () => buildPass3Request(pdfBase64, pass1Result.output!, pass2Result.output!),
      'Balance Sheet Extraction'
    );
    if (!pass3Result.success) throw createPassError(3, pass3Result.error);
    updateMetrics(pass3Result, passMetrics, totalInputTokens, totalOutputTokens, totalRetries);
    totalInputTokens += pass3Result.inputTokens;
    totalOutputTokens += pass3Result.outputTokens;
    totalRetries += pass3Result.retryCount;
    passOutputs.set(3, pass3Result.output!);

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

    // Save pass output to database
    await saveToDatabase(supabase, context.reportId, {
      report_status: `pass_${passNumber}_complete`,
      processing_progress: progress,
      processing_message: `Pass ${passNumber} complete: ${shortDescription}`,
      [`pass_${passNumber}_output`]: result.output,
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

  // Inject industry knowledge
  const naicsCode = pass1.industry_classification?.naics_code || '';
  const sectorMultiples = findSectorMultiples(pass1);

  const priorContext = `
## PRIOR PASS DATA

### Pass 1 Output (Company Profile)
Company: ${pass1.company_profile?.legal_name || 'Unknown'}
Years in Business: ${pass1.company_profile?.years_in_business || 'Unknown'}
NAICS Code: ${naicsCode}
Industry: ${pass1.industry_classification?.naics_description || 'Unknown'}
Business Description: ${pass1.company_profile?.business_description || 'Not provided'}

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
Owners: ${JSON.stringify(pass1.ownership_info?.owners?.map(o => ({ name: o.name, ownership: o.ownership_percentage, active: o.active_in_business, comp: o.compensation })) || [])}

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
Ownership Being Valued: ${pass1.ownership_info?.owners?.[0]?.ownership_percentage || 100}%
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
 * Parse JSON from Claude response, handling markdown code blocks
 */
function parsePassOutput<T>(response: string): T | null {
  try {
    // Try to extract JSON from markdown code block
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }

    // Try to find JSON object directly
    const jsonStart = response.indexOf('{');
    const jsonEnd = response.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      const jsonStr = response.substring(jsonStart, jsonEnd + 1);
      return JSON.parse(jsonStr);
    }

    // Try parsing the entire response
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
  const naicsCode = pass1.industry_classification?.naics_code || '';
  const keywords = pass1.company_profile?.products_services || [];

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
