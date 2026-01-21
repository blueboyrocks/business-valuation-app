// Vercel config - must be at top before imports
export const maxDuration = 800; // Vercel Pro max - each pass gets its own timeout
export const dynamic = 'force-dynamic';

/**
 * Single-Pass Execution API Route
 *
 * This endpoint executes a single pass of the 12-pass valuation pipeline.
 * Designed for the chained API calls pattern where each pass is called separately
 * with its own timeout window.
 *
 * Usage:
 * - POST /api/reports/[id]/process-pass?pass=1  - Execute pass 1
 * - POST /api/reports/[id]/process-pass?pass=2  - Execute pass 2
 * - GET  /api/reports/[id]/process-pass         - Get current processing state
 *
 * Each pass:
 * - Loads previous pass outputs from database
 * - Executes the requested pass
 * - Saves output to database
 * - Returns result with next pass number
 */

import { NextRequest, NextResponse } from 'next/server';
import { executeSinglePass, getProcessingState, SinglePassResult } from '@/lib/claude/orchestrator-v2';
import { generateAndStorePDF } from '@/lib/pdf/auto-generate';
import { createClient } from '@supabase/supabase-js';

// Lazy-initialize Supabase client
let supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
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
  1: 'Document Classification',
  2: 'Income Statement Extraction',
  3: 'Balance Sheet Extraction',
  4: 'Industry Analysis',
  5: 'Earnings Normalization',
  6: 'Risk Assessment',
  7: 'Asset Approach',
  8: 'Income Approach',
  9: 'Market Approach',
  10: 'Value Synthesis',
  11: 'Narrative Generation',
  12: 'Quality Review',
};

/**
 * POST handler - Execute a single pass
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reportId } = await params;
  const { searchParams } = new URL(request.url);
  const passParam = searchParams.get('pass');
  const forceParam = searchParams.get('force') === 'true';

  // Validate pass parameter
  if (!passParam) {
    return NextResponse.json(
      { success: false, error: 'Missing pass parameter. Use ?pass=1 through ?pass=12' },
      { status: 400 }
    );
  }

  const passNumber = parseInt(passParam, 10);
  if (isNaN(passNumber) || passNumber < 1 || passNumber > 12) {
    return NextResponse.json(
      { success: false, error: 'Invalid pass number. Must be 1-12.' },
      { status: 400 }
    );
  }

  console.log(`[PROCESS-PASS] Starting Pass ${passNumber} for report ${reportId}${forceParam ? ' (force mode)' : ''}`);

  try {
    // Verify report exists (use maybeSingle to avoid "cannot coerce" errors)
    const { data: report, error: reportError } = await getSupabaseClient()
      .from('reports')
      .select('id, report_status, company_name')
      .eq('id', reportId)
      .maybeSingle();

    if (reportError) {
      console.error(`[PROCESS-PASS] Database error: ${reportError.message}`);
      return NextResponse.json(
        { success: false, error: `Database error: ${reportError.message}` },
        { status: 500 }
      );
    }

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    const reportData = report as { id: string; report_status: string; company_name: string };

    // Check if already completed
    if (reportData.report_status === 'completed') {
      return NextResponse.json({
        success: true,
        status: 'completed',
        message: 'Report already completed',
        passNumber: 12,
        isComplete: true,
        nextPass: null,
      });
    }

    // Execute the single pass
    const result: SinglePassResult = await executeSinglePass(reportId, passNumber, undefined, { force: forceParam });

    // If this was the final pass and it succeeded, generate PDF
    if (result.success && result.isComplete && result.finalReport) {
      console.log(`[PROCESS-PASS] Final pass complete, generating PDF...`);

      try {
        const pdfResult = await generateAndStorePDF(
          reportId,
          reportData.company_name,
          result.finalReport as unknown as Record<string, unknown>
        );

        if (pdfResult.success) {
          console.log(`[PROCESS-PASS] PDF generated: ${pdfResult.pdfPath}`);
        } else {
          console.warn(`[PROCESS-PASS] PDF generation failed (non-blocking): ${pdfResult.error}`);
        }
      } catch (pdfError) {
        console.warn(`[PROCESS-PASS] PDF generation error (non-blocking):`, pdfError);
      }
    }

    // Return the result
    return NextResponse.json({
      success: result.success,
      passNumber: result.passNumber,
      passName: result.passName,
      passDescription: PASS_DESCRIPTIONS[result.passNumber],
      isComplete: result.isComplete,
      nextPass: result.nextPass,
      error: result.error,
      metrics: {
        processingTimeMs: result.processingTimeMs,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        costUsd: result.costUsd,
      },
      // Include valuation summary if complete
      ...(result.isComplete && result.finalReport ? {
        valuationSummary: {
          concludedValue: result.finalReport.valuation_conclusion?.concluded_value,
          valueRangeLow: result.finalReport.valuation_conclusion?.value_range_low,
          valueRangeHigh: result.finalReport.valuation_conclusion?.value_range_high,
          qualityGrade: result.finalReport.quality_grade,
          qualityScore: result.finalReport.quality_score,
        },
      } : {}),
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[PROCESS-PASS] Error executing pass ${passNumber}:`, errorMessage);

    return NextResponse.json({
      success: false,
      error: errorMessage,
      passNumber,
      passName: PASS_DESCRIPTIONS[passNumber],
      isComplete: false,
      nextPass: passNumber, // Can retry this pass
    }, { status: 500 });
  }
}

/**
 * GET handler - Get current processing state
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reportId } = await params;

  try {
    const state = await getProcessingState(reportId);

    return NextResponse.json({
      success: true,
      reportId,
      ...state,
      passDescriptions: PASS_DESCRIPTIONS,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[PROCESS-PASS] Error getting state:`, errorMessage);

    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}
