/**
 * Claude 6-Pass Business Valuation Processing Route
 *
 * This API route processes uploaded tax returns/financial statements using
 * the 6-pass orchestrated valuation pipeline with knowledge injection.
 *
 * Pipeline:
 * 1. Document Extraction - Extract financial data from PDF
 * 2. Industry Analysis - Analyze industry context and multiples
 * 3. Earnings Normalization - Calculate SDE and EBITDA
 * 4. Risk Assessment - Score risk factors and determine multiple adjustment
 * 5. Valuation Calculation - Apply Asset, Income, and Market approaches
 * 6. Final Synthesis - Generate complete report with narratives
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { runValuationPipeline } from '@/lib/claude/orchestrator';
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

// Vercel Pro allows up to 5 minutes for serverless functions
export const maxDuration = 300;

// Status mapping for each pass
const PASS_STATUSES = {
  1: { processing: 'pass_1_processing', complete: 'pass_1_complete', message: 'Extracting financial data...' },
  2: { processing: 'pass_2_processing', complete: 'pass_2_complete', message: 'Analyzing industry context...' },
  3: { processing: 'pass_3_processing', complete: 'pass_3_complete', message: 'Normalizing earnings...' },
  4: { processing: 'pass_4_processing', complete: 'pass_4_complete', message: 'Assessing risk factors...' },
  5: { processing: 'pass_5_processing', complete: 'pass_5_complete', message: 'Calculating valuation...' },
  6: { processing: 'pass_6_processing', complete: 'pass_6_complete', message: 'Generating final report...' },
} as const;

/**
 * POST handler - Process valuation using 6-pass pipeline
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reportId } = await params;
  console.log(`[6-PASS] Starting valuation pipeline for report ${reportId}`);

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
      console.error('[6-PASS] Report not found:', reportError);
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    // Check if already completed
    if (report.report_status === 'completed') {
      console.log(`[6-PASS] Report ${reportId} already completed`);
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
      processing_message: 'Initializing 6-pass valuation pipeline...',
      error_message: null,
    });

    // ========================================================================
    // 3. Get and download documents
    // ========================================================================
    const documents = await getDocuments(reportId, report);

    if (documents.length === 0) {
      throw new Error('No documents found for this report. Please upload a tax return or financial statement.');
    }

    await updateReportStatus(reportId, 'processing', {
      processing_progress: 5,
      processing_message: 'Loading documents...',
    });

    // Download primary document (first PDF)
    const primaryDocument = documents[0];
    console.log(`[6-PASS] Downloading document: ${primaryDocument.filename || primaryDocument.file_path}`);

    const pdfBuffer = await downloadDocument(primaryDocument.file_path);
    const pdfBase64 = pdfBuffer.toString('base64');

    console.log(`[6-PASS] Document loaded: ${pdfBuffer.length} bytes`);

    // ========================================================================
    // 4. Run the 6-pass valuation pipeline
    // ========================================================================
    let currentPass = 0;

    const result = await runValuationPipeline(
      pdfBase64,
      reportId,
      async (pass, statusMessage, percentage) => {
        // Update database status as each pass progresses
        if (pass !== currentPass) {
          // Mark previous pass as complete
          if (currentPass > 0 && currentPass <= 6) {
            await updateReportStatus(reportId, PASS_STATUSES[currentPass as keyof typeof PASS_STATUSES].complete, {
              processing_progress: percentage,
              processing_message: `Pass ${currentPass} complete`,
            });
          }

          // Mark new pass as processing
          currentPass = pass;
          if (pass <= 6) {
            const passStatus = PASS_STATUSES[pass as keyof typeof PASS_STATUSES];
            await updateReportStatus(reportId, passStatus.processing, {
              processing_progress: percentage,
              processing_message: passStatus.message,
            });
          }
        } else {
          // Update progress within same pass
          await getSupabaseClient()
            .from('reports')
            .update({
              processing_progress: percentage,
              processing_message: statusMessage,
            })
            .eq('id', reportId);
        }

        console.log(`[6-PASS] Pass ${pass}: ${statusMessage} (${percentage}%)`);
      }
    );

    // ========================================================================
    // 5. Handle result
    // ========================================================================
    if (!result.success) {
      console.error(`[6-PASS] Pipeline failed: ${result.error}`);

      await updateReportStatus(reportId, 'error', {
        processing_progress: 0,
        processing_message: 'Processing failed',
        error_message: result.error || 'Unknown error occurred during valuation',
        tokens_used: result.totalTokensUsed,
        processing_cost: result.totalCost,
        processing_time_ms: result.processingTime,
      });

      return NextResponse.json({
        success: false,
        error: result.error,
        passOutputs: result.passOutputs,
        tokensUsed: result.totalTokensUsed,
        cost: result.totalCost,
      }, { status: 500 });
    }

    // ========================================================================
    // 6. Save successful result to database
    // ========================================================================
    console.log(`[6-PASS] Pipeline completed successfully`);

    const valuationData = result.finalOutput;
    const valuationSummary = extractValuationSummary(valuationData);

    await updateReportStatus(reportId, 'completed', {
      processing_progress: 100,
      processing_message: 'Valuation complete',
      report_data: valuationData,
      tokens_used: result.totalTokensUsed,
      processing_cost: result.totalCost,
      processing_time_ms: result.processingTime,
      completed_at: new Date().toISOString(),
    });

    console.log(`[6-PASS] Report ${reportId} completed: FMV = $${valuationSummary.concluded_value?.toLocaleString() || 'N/A'}`);

    // ========================================================================
    // 7. Generate PDF automatically
    // ========================================================================
    console.log(`[6-PASS] Starting automatic PDF generation...`);
    const pdfResult = await generateAndStorePDF(
      reportId,
      report.company_name,
      (valuationData as unknown) as Record<string, unknown>
    );

    if (pdfResult.success) {
      console.log(`[6-PASS] PDF generated and stored: ${pdfResult.pdfPath}`);
    } else {
      console.warn(`[6-PASS] PDF generation failed (non-blocking): ${pdfResult.error}`);
    }

    // ========================================================================
    // 8. Return success response
    // ========================================================================
    return NextResponse.json({
      success: true,
      status: 'completed',
      message: 'Valuation completed successfully',
      valuation_summary: valuationSummary,
      pdf: pdfResult.success ? {
        path: pdfResult.pdfPath,
        size: pdfResult.pdfSize,
      } : null,
      metrics: {
        tokens_used: result.totalTokensUsed,
        cost: result.totalCost,
        processing_time_ms: result.processingTime,
        passes_completed: result.passOutputs.length,
        pdf_generation_ms: pdfResult.generationTimeMs,
      },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[6-PASS] Unexpected error: ${errorMessage}`);

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
      processing_time_ms
    `)
    .eq('id', reportId)
    .single();

  if (error || !report) {
    return NextResponse.json(
      { success: false, error: 'Report not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    status: report.report_status,
    progress: report.processing_progress || 0,
    message: report.processing_message || '',
    error: report.error_message,
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
 */
async function updateReportStatus(
  reportId: string,
  status: string,
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
    console.error(`[6-PASS] Failed to update status: ${error.message}`);
  }
}

/**
 * Extract valuation summary from full valuation data
 */
function extractValuationSummary(valuationData: unknown): {
  concluded_value: number | null;
  value_range_low: number | null;
  value_range_high: number | null;
  confidence_level: string | null;
  company_name: string | null;
  industry: string | null;
  weighted_sde: number | null;
} {
  if (!valuationData || typeof valuationData !== 'object') {
    return {
      concluded_value: null,
      value_range_low: null,
      value_range_high: null,
      confidence_level: null,
      company_name: null,
      industry: null,
      weighted_sde: null,
    };
  }

  const data = valuationData as Record<string, unknown>;

  // Extract from valuation_synthesis
  const synthesis = data.valuation_synthesis as Record<string, unknown> | undefined;
  const finalValuation = synthesis?.final_valuation as Record<string, unknown> | undefined;

  // Extract from company_profile
  const profile = data.company_profile as Record<string, unknown> | undefined;
  const industry = profile?.industry as Record<string, unknown> | undefined;

  // Extract from normalized_earnings
  const normalizedEarnings = data.normalized_earnings as Record<string, unknown> | undefined;
  const sdeCalc = normalizedEarnings?.sde_calculation as Record<string, unknown> | undefined;

  return {
    concluded_value: (finalValuation?.concluded_value as number) || null,
    value_range_low: (finalValuation?.valuation_range_low as number) || null,
    value_range_high: (finalValuation?.valuation_range_high as number) || null,
    confidence_level: (finalValuation?.confidence_level as string) || null,
    company_name: (profile?.legal_name as string) || null,
    industry: (industry?.industry_sector as string) || (industry?.naics_description as string) || null,
    weighted_sde: (sdeCalc?.weighted_average_sde as number) || null,
  };
}
