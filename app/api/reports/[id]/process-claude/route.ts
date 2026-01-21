// Vercel config - must be at top before imports
export const maxDuration = 800; // Vercel Pro max
export const dynamic = 'force-dynamic';

/**
 * Claude 12-Pass Business Valuation Processing Route
 *
 * This API route processes uploaded tax returns/financial statements using
 * the 12-pass orchestrated valuation pipeline with knowledge injection.
 *
 * Pipeline Phases:
 * - Passes 1-3: Data Extraction (Document Classification, Income Statement, Balance Sheet)
 * - Passes 4-6: Analysis (Industry, Earnings Normalization, Risk Assessment)
 * - Passes 7-9: Valuation Approaches (Asset, Income, Market)
 * - Passes 10-12: Synthesis & Review (Value Synthesis, Narratives, Quality Review)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { runTwelvePassValuation } from '@/lib/claude/orchestrator-v2';
import { generateAndStorePDF } from '@/lib/pdf/auto-generate';

// Lazy-initialize Supabase client to avoid build-time errors
let supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return supabase;
}

// Pass descriptions for progress messages
const PASS_DESCRIPTIONS: Record<number, string> = {
  1: 'Classifying documents and extracting company profile...',
  2: 'Extracting income statement data...',
  3: 'Extracting balance sheet and working capital...',
  4: 'Analyzing industry context and benchmarks...',
  5: 'Normalizing earnings (SDE/EBITDA)...',
  6: 'Assessing risk factors...',
  7: 'Calculating asset approach valuation...',
  8: 'Calculating income approach valuation...',
  9: 'Calculating market approach valuation...',
  10: 'Synthesizing value and applying discounts...',
  11: 'Generating narratives and executive summary...',
  12: 'Performing quality review and corrections...',
};

/**
 * POST handler - Process valuation using 12-pass pipeline
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reportId } = await params;
  console.log(`[12-PASS] Starting valuation pipeline for report ${reportId}`);

  try {
    // ========================================================================
    // 1. Fetch report from database
    // ========================================================================
    const { data: report, error: reportError } = await getSupabaseClient()
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      console.error('[12-PASS] Report not found:', reportError);
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    // Check if already completed
    if (report.report_status === 'completed') {
      console.log(`[12-PASS] Report ${reportId} already completed`);
      return NextResponse.json({
        success: true,
        status: 'completed',
        message: 'Report already completed',
        valuation_summary: extractValuationSummary(report.report_data),
      });
    }

    // ========================================================================
    // 2. Update status to processing
    // ========================================================================
    await updateReportStatus(reportId, 'processing', {
      processing_progress: 0,
      processing_message: 'Initializing 12-pass valuation pipeline...',
      error_message: null,
    });

    // ========================================================================
    // 3. Get and download all documents
    // ========================================================================
    const documents = await getDocuments(reportId, report);

    if (documents.length === 0) {
      throw new Error('No documents found for this report. Please upload a tax return or financial statement.');
    }

    await updateReportStatus(reportId, 'processing', {
      processing_progress: 2,
      processing_message: `Loading ${documents.length} document(s)...`,
    });

    // Download all PDF documents
    const pdfDocuments: string[] = [];
    for (const doc of documents) {
      console.log(`[12-PASS] Downloading document: ${doc.filename || doc.file_path}`);
      const pdfBuffer = await downloadDocument(doc.file_path);
      pdfDocuments.push(pdfBuffer.toString('base64'));
      console.log(`[12-PASS] Document loaded: ${pdfBuffer.length} bytes`);
    }

    console.log(`[12-PASS] All ${pdfDocuments.length} document(s) loaded`);

    // ========================================================================
    // 4. Run the 12-pass valuation pipeline
    // ========================================================================
    const result = await runTwelvePassValuation(
      reportId,
      pdfDocuments,
      async (pass, message, percentage) => {
        // Update progress in database
        // Note: Only use allowed status values for report_status
        // Use processing_message for detailed pass information
        const passDescription = PASS_DESCRIPTIONS[pass] || message;

        await getSupabaseClient()
          .from('reports')
          .update({
            processing_progress: percentage,
            processing_message: `Pass ${pass}/12: ${passDescription}`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', reportId);

        console.log(`[12-PASS] Pass ${pass}: ${passDescription} (${percentage}%)`);
      }
    );

    // ========================================================================
    // 5. Handle result
    // ========================================================================
    if (!result.success) {
      console.error(`[12-PASS] Pipeline failed: ${result.error}`);
      console.error(`[12-PASS] Failed at pass ${result.error_details?.pass_number}: ${result.error_details?.pass_name}`);

      await updateReportStatus(reportId, 'error', {
        processing_progress: result.metrics.pass_metrics.length > 0
          ? Math.floor((result.completed_passes / 12) * 100)
          : 0,
        processing_message: `Failed at Pass ${result.error_details?.pass_number || 'Unknown'}: ${result.error_details?.pass_name || 'Unknown'}`,
        error_message: result.error || 'Unknown error occurred during valuation',
        tokens_used: result.metrics.total_tokens_used,
        processing_cost: result.metrics.total_cost_usd,
        processing_time_ms: result.metrics.total_duration_ms,
      });

      return NextResponse.json({
        success: false,
        error: result.error,
        error_details: result.error_details,
        completed_passes: result.completed_passes,
        total_passes: result.total_passes,
        metrics: {
          tokens_used: result.metrics.total_tokens_used,
          cost: result.metrics.total_cost_usd,
          processing_time_ms: result.metrics.total_duration_ms,
        },
      }, { status: 500 });
    }

    // ========================================================================
    // 6. Save successful result to database
    // ========================================================================
    console.log(`[12-PASS] Pipeline completed successfully`);

    // Use the final report from Pass 12's quality review
    const finalReport = result.final_report;
    const valuationSummary = extractValuationSummary(finalReport);

    await updateReportStatus(reportId, 'completed', {
      processing_progress: 100,
      processing_message: 'Valuation complete',
      report_data: finalReport,
      tokens_used: result.metrics.total_tokens_used,
      processing_cost: result.metrics.total_cost_usd,
      processing_time_ms: result.metrics.total_duration_ms,
      processing_completed_at: new Date().toISOString(),
    });

    console.log(`[12-PASS] Report ${reportId} completed: FMV = $${valuationSummary.concluded_value?.toLocaleString() || 'N/A'}`);
    console.log(`[12-PASS] Quality Grade: ${finalReport?.quality_grade || 'N/A'}`);
    console.log(`[12-PASS] Total Cost: $${result.metrics.total_cost_usd.toFixed(4)}`);

    // ========================================================================
    // 7. Generate PDF automatically
    // ========================================================================
    console.log(`[12-PASS] Starting automatic PDF generation...`);
    const pdfResult = await generateAndStorePDF(
      reportId,
      report.company_name,
      (finalReport as unknown) as Record<string, unknown>
    );

    if (pdfResult.success) {
      console.log(`[12-PASS] PDF generated and stored: ${pdfResult.pdfPath}`);
    } else {
      console.warn(`[12-PASS] PDF generation failed (non-blocking): ${pdfResult.error}`);
    }

    // ========================================================================
    // 8. Return success response
    // ========================================================================
    return NextResponse.json({
      success: true,
      status: 'completed',
      message: 'Valuation completed successfully',
      valuation_summary: valuationSummary,
      quality: {
        grade: finalReport?.quality_grade,
        score: finalReport?.quality_score,
      },
      pdf: pdfResult.success ? {
        path: pdfResult.pdfPath,
        size: pdfResult.pdfSize,
      } : null,
      metrics: {
        tokens_used: result.metrics.total_tokens_used,
        cost: result.metrics.total_cost_usd,
        processing_time_ms: result.metrics.total_duration_ms,
        passes_completed: result.completed_passes,
        average_pass_duration_ms: result.metrics.average_pass_duration_ms,
        slowest_pass: result.metrics.slowest_pass,
        most_expensive_pass: result.metrics.most_expensive_pass,
        pdf_generation_ms: pdfResult.generationTimeMs,
      },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[12-PASS] Unexpected error: ${errorMessage}`);

    // Update database with error status
    await updateReportStatus(reportId, 'error', {
      processing_progress: 0,
      processing_message: 'Processing failed',
      error_message: errorMessage,
    });

    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}

/**
 * GET handler - Check processing status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reportId } = await params;

  const { data: report, error } = await getSupabaseClient()
    .from('reports')
    .select(`
      report_status,
      processing_progress,
      processing_message,
      error_message,
      tokens_used,
      processing_cost,
      processing_time_ms,
      processing_completed_at
    `)
    .eq('id', reportId)
    .single();

  if (error || !report) {
    return NextResponse.json(
      { success: false, error: 'Report not found' },
      { status: 404 }
    );
  }

  // Calculate current pass from progress
  const progress = report.processing_progress || 0;
  let currentPass = 1;
  if (progress >= 5) currentPass = 1;
  if (progress >= 12) currentPass = 2;
  if (progress >= 18) currentPass = 3;
  if (progress >= 28) currentPass = 4;
  if (progress >= 38) currentPass = 5;
  if (progress >= 48) currentPass = 6;
  if (progress >= 55) currentPass = 7;
  if (progress >= 62) currentPass = 8;
  if (progress >= 69) currentPass = 9;
  if (progress >= 78) currentPass = 10;
  if (progress >= 88) currentPass = 11;
  if (progress >= 100) currentPass = 12;

  return NextResponse.json({
    success: true,
    status: report.report_status,
    progress: progress,
    current_pass: report.report_status === 'processing' ? currentPass : null,
    total_passes: 12,
    message: report.processing_message || '',
    error: report.error_message,
    completed_at: report.processing_completed_at,
    metrics: {
      tokens_used: report.tokens_used,
      cost: report.processing_cost,
      processing_time_ms: report.processing_time_ms,
    },
  });
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get documents for a report from database or document_paths field
 */
async function getDocuments(
  reportId: string,
  report: Record<string, unknown>
): Promise<Array<{ file_path: string; filename?: string }>> {
  // First try to get from documents table
  const { data: documents, error } = await getSupabaseClient()
    .from('documents')
    .select('*')
    .eq('report_id', reportId);

  if (!error && documents && documents.length > 0) {
    return documents.map(doc => ({
      file_path: doc.file_path,
      filename: doc.file_name || doc.filename,
    }));
  }

  // Fall back to document_paths field on report
  if (report.document_paths) {
    const paths = typeof report.document_paths === 'string'
      ? JSON.parse(report.document_paths)
      : report.document_paths;

    return (paths as string[]).map((path: string) => ({
      file_path: path,
      filename: path.split('/').pop(),
    }));
  }

  return [];
}

/**
 * Download a document from Supabase Storage
 */
async function downloadDocument(filePath: string): Promise<Buffer> {
  // Try with cleaned path first (remove 'documents/' prefix if present)
  const cleanPath = filePath.replace(/^documents\//, '');

  const { data, error } = await getSupabaseClient().storage
    .from('documents')
    .download(cleanPath);

  if (error) {
    // Try with original path
    const { data: data2, error: error2 } = await getSupabaseClient().storage
      .from('documents')
      .download(filePath);

    if (error2) {
      throw new Error(`Failed to download document "${filePath}": ${error.message}`);
    }

    const arrayBuffer = await data2.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Update report status in database
 * Note: Only uses allowed status values ('pending', 'processing', 'completed', 'error')
 */
async function updateReportStatus(
  reportId: string,
  status: 'pending' | 'processing' | 'completed' | 'error',
  additionalFields: Record<string, unknown> = {}
) {
  const updateData = {
    report_status: status,
    updated_at: new Date().toISOString(),
    ...additionalFields,
  };

  const { error } = await getSupabaseClient()
    .from('reports')
    .update(updateData)
    .eq('id', reportId);

  if (error) {
    console.error(`[12-PASS] Failed to update status: ${error.message}`);
  }
}

/**
 * Extract valuation summary from the final report
 */
function extractValuationSummary(finalReport: unknown): {
  concluded_value: number | null;
  value_range_low: number | null;
  value_range_high: number | null;
  confidence_level: string | null;
  company_name: string | null;
  industry: string | null;
  weighted_sde: number | null;
  quality_grade: string | null;
} {
  if (!finalReport || typeof finalReport !== 'object') {
    return {
      concluded_value: null,
      value_range_low: null,
      value_range_high: null,
      confidence_level: null,
      company_name: null,
      industry: null,
      weighted_sde: null,
      quality_grade: null,
    };
  }

  const data = finalReport as Record<string, unknown>;

  // Extract from TwelvePassFinalReport structure
  const valuationConclusion = data.valuation_conclusion as Record<string, unknown> | undefined;
  const companyProfile = data.company_profile as Record<string, unknown> | undefined;
  const financialSummary = data.financial_summary as Record<string, unknown> | undefined;

  // Also try legacy 6-pass structure for backwards compatibility
  const synthesis = data.valuation_synthesis as Record<string, unknown> | undefined;
  const finalValuation = synthesis?.final_valuation as Record<string, unknown> | undefined;
  const legacyProfile = data.company_profile as Record<string, unknown> | undefined;
  const legacyIndustry = legacyProfile?.industry as Record<string, unknown> | undefined;
  const normalizedEarnings = data.normalized_earnings as Record<string, unknown> | undefined;
  const sdeCalc = normalizedEarnings?.sde_calculation as Record<string, unknown> | undefined;

  // Try new 12-pass structure first, fall back to legacy
  return {
    concluded_value:
      (valuationConclusion?.concluded_value as number) ||
      (finalValuation?.concluded_value as number) ||
      null,
    value_range_low:
      (valuationConclusion?.value_range_low as number) ||
      (finalValuation?.valuation_range_low as number) ||
      null,
    value_range_high:
      (valuationConclusion?.value_range_high as number) ||
      (finalValuation?.valuation_range_high as number) ||
      null,
    confidence_level:
      (valuationConclusion?.confidence_level as string) ||
      (finalValuation?.confidence_level as string) ||
      null,
    company_name:
      (companyProfile?.legal_name as string) ||
      (legacyProfile?.legal_name as string) ||
      null,
    industry:
      (data.pass_outputs as Record<string, unknown>)?.pass_1
        ? ((data.pass_outputs as Record<string, Record<string, unknown>>).pass_1?.industry_classification as Record<string, unknown>)?.naics_description as string
        : (legacyIndustry?.industry_sector as string) || (legacyIndustry?.naics_description as string) ||
      null,
    weighted_sde:
      (financialSummary?.sde as number) ||
      (sdeCalc?.weighted_average_sde as number) ||
      null,
    quality_grade: (data.quality_grade as string) || null,
  };
}
