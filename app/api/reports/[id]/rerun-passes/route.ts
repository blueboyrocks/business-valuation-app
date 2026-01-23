/**
 * Pass Re-Run API Endpoint
 *
 * Allows selective re-running of specific passes without reprocessing the entire report.
 * Supports web search integration for passes 4, 12, and 13.
 * Supports individual narrative passes (11a-11k) with expert personas.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { executePass, executeNarrativePass, executeAllNarrativePasses } from '@/lib/claude/pass-executor';
import { aggregatePassOutputsToReportData } from '@/lib/report-aggregator';
import { NARRATIVE_EXECUTION_ORDER } from '@/lib/claude/prompts-v2';

export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';

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

interface RerunRequest {
  passes: number[]; // Array of numeric pass numbers (1-13)
  narrativePasses?: string[]; // Array of narrative pass IDs (11a-11k)
  options?: {
    useWebSearch?: boolean;
    forceRegenerate?: boolean;
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reportId } = await params;

  console.log(`[RERUN] Starting pass re-run for report ${reportId}`);

  try {
    const body: RerunRequest = await request.json();
    const { passes = [], narrativePasses = [], options = {} } = body;

    // Validate that at least one pass is selected
    if (passes.length === 0 && narrativePasses.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one pass to re-run' },
        { status: 400 }
      );
    }

    // Validate numeric pass numbers (1-13)
    const validPasses = passes.filter(p => p >= 1 && p <= 13);
    if (validPasses.length !== passes.length) {
      return NextResponse.json(
        { error: 'Invalid pass numbers. Valid range is 1-13.' },
        { status: 400 }
      );
    }

    // Validate narrative pass IDs (11a-11k)
    const validNarrativeIds = ['11a', '11b', '11c', '11d', '11e', '11f', '11g', '11h', '11i', '11j', '11k'];
    const validNarrativePasses = narrativePasses.filter(p => validNarrativeIds.includes(p));
    if (validNarrativePasses.length !== narrativePasses.length) {
      return NextResponse.json(
        { error: 'Invalid narrative pass IDs. Valid range is 11a-11k.' },
        { status: 400 }
      );
    }

    // Get current report with all data
    const { data: reportData, error: fetchError } = await getSupabaseClient()
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (fetchError || !reportData) {
      console.error(`[RERUN] Report not found:`, fetchError);
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    const report = reportData as {
      id: string;
      company_name: string;
      report_status: string;
      report_data: Record<string, unknown> | null;
      pass_outputs: Record<string, unknown> | null;
      document_text?: string;
    };

    // Update status to processing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (getSupabaseClient().from('reports') as any).update({
      report_status: 'processing',
    }).eq('id', reportId);

    const results: Record<number, unknown> = {};
    const errors: Record<number, string> = {};
    const narrativeResults: Record<string, unknown> = {};
    const narrativeErrors: Record<string, string> = {};

    // Sort passes to run in order (dependencies matter)
    const sortedPasses = [...passes].sort((a, b) => a - b);

    // Get existing pass outputs for context
    const existingPassOutputs: Record<string, unknown> = report.pass_outputs || {};

    console.log(`[RERUN] Will execute numeric passes: ${sortedPasses.join(', ') || 'none'}`);
    console.log(`[RERUN] Will execute narrative passes: ${validNarrativePasses.join(', ') || 'none'}`);
    console.log(`[RERUN] Web search enabled: ${options.useWebSearch}`);

    // Execute numeric passes first
    for (const passNumber of sortedPasses) {
      console.log(`[RERUN] Starting Pass ${passNumber} for report ${reportId}`);

      try {
        const passResult = await executePass(
          passNumber,
          reportId,
          report,
          existingPassOutputs,
          {
            useWebSearch: options.useWebSearch && [4, 12, 13].includes(passNumber),
            forceRegenerate: options.forceRegenerate,
          }
        );

        results[passNumber] = passResult;

        // Update pass outputs with new result (use string key)
        existingPassOutputs[String(passNumber)] = passResult;

        // Save intermediate result
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (getSupabaseClient().from('reports') as any).update({
          pass_outputs: existingPassOutputs,
        }).eq('id', reportId);

        console.log(`[RERUN] Completed Pass ${passNumber}`);

      } catch (passError: unknown) {
        const errorMessage = passError instanceof Error ? passError.message : 'Unknown error';
        console.error(`[RERUN] Error in Pass ${passNumber}:`, errorMessage);
        errors[passNumber] = errorMessage;
      }
    }

    // Execute narrative passes (11a-11k)
    if (validNarrativePasses.length > 0) {
      console.log(`[RERUN] Starting narrative passes...`);

      // Check if all narrative passes are selected
      const allNarrativesSelected = validNarrativePasses.length === 11;

      if (allNarrativesSelected) {
        // Run all narratives in the correct order
        console.log(`[RERUN] Running all narratives in execution order...`);
        try {
          const combinedNarratives = await executeAllNarrativePasses(
            reportId,
            report,
            existingPassOutputs
          );

          // Store combined results
          existingPassOutputs['narratives'] = combinedNarratives;

          // Mark all as completed
          const passResults = (combinedNarratives.pass_results || {}) as Record<string, unknown>;
          for (const passId of validNarrativePasses) {
            narrativeResults[passId] = passResults[passId] || { success: true };
          }

          // Save
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (getSupabaseClient().from('reports') as any).update({
            pass_outputs: existingPassOutputs,
          }).eq('id', reportId);

          console.log(`[RERUN] Completed all narratives`);
        } catch (narrativeError: unknown) {
          const errorMessage = narrativeError instanceof Error ? narrativeError.message : 'Unknown error';
          console.error(`[RERUN] Error running all narratives:`, errorMessage);
          for (const passId of validNarrativePasses) {
            narrativeErrors[passId] = errorMessage;
          }
        }
      } else {
        // Run selected narratives individually, respecting execution order
        const orderedPasses = NARRATIVE_EXECUTION_ORDER.filter(p => validNarrativePasses.includes(p));
        const priorNarratives: Record<string, unknown> = (existingPassOutputs['narratives'] as Record<string, unknown>) || {};

        for (const passId of orderedPasses) {
          console.log(`[RERUN] Starting Narrative Pass ${passId}`);

          try {
            const narrativeResult = await executeNarrativePass(
              passId,
              reportId,
              report,
              existingPassOutputs,
              priorNarratives
            );

            narrativeResults[passId] = narrativeResult;
            priorNarratives[passId] = narrativeResult;

            // Update narratives in pass outputs
            existingPassOutputs['narratives'] = {
              ...(existingPassOutputs['narratives'] as Record<string, unknown> || {}),
              pass_results: {
                ...((existingPassOutputs['narratives'] as Record<string, unknown>)?.pass_results as Record<string, unknown> || {}),
                [passId]: narrativeResult,
              },
            };

            // Save intermediate
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (getSupabaseClient().from('reports') as any).update({
              pass_outputs: existingPassOutputs,
            }).eq('id', reportId);

            console.log(`[RERUN] Completed Narrative Pass ${passId}`);

          } catch (narrativeError: unknown) {
            const errorMessage = narrativeError instanceof Error ? narrativeError.message : 'Unknown error';
            console.error(`[RERUN] Error in Narrative Pass ${passId}:`, errorMessage);
            narrativeErrors[passId] = errorMessage;
          }
        }
      }
    }

    // After all passes complete, aggregate data to report_data
    console.log(`[RERUN] Aggregating pass outputs to report data...`);

    const aggregatedData = aggregatePassOutputsToReportData(
      existingPassOutputs,
      report.report_data || {}
    );

    // Count all errors
    const totalErrors = Object.keys(errors).length + Object.keys(narrativeErrors).length;
    const totalCompleted = Object.keys(results).length + Object.keys(narrativeResults).length;

    // Update final report data
    const finalStatus = totalErrors > 0 ? 'partial_error' : 'completed';
    const allErrorKeys = [...Object.keys(errors), ...Object.keys(narrativeErrors)];
    const finalMessage = totalErrors > 0
      ? `Completed with errors in passes: ${allErrorKeys.join(', ')}`
      : 'Re-run completed successfully';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (getSupabaseClient().from('reports') as any).update({
      report_data: aggregatedData,
      pass_outputs: existingPassOutputs,
      report_status: finalStatus,
      valuation_amount: aggregatedData.valuation_amount || null,
      updated_at: new Date().toISOString(),
    }).eq('id', reportId);

    console.log(`[RERUN] Complete. Status: ${finalStatus}`);

    return NextResponse.json({
      success: true,
      results,
      narrativeResults: Object.keys(narrativeResults).length > 0 ? narrativeResults : undefined,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
      narrativeErrors: Object.keys(narrativeErrors).length > 0 ? narrativeErrors : undefined,
      message: `Re-ran ${totalCompleted} passes`,
      passesCompleted: Object.keys(results).map(Number),
      passesFailed: Object.keys(errors).map(Number),
      narrativePassesCompleted: Object.keys(narrativeResults),
      narrativePassesFailed: Object.keys(narrativeErrors),
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[RERUN] Fatal error:', errorMessage);

    // Reset status on error
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (getSupabaseClient().from('reports') as any).update({
      report_status: 'error',
    }).eq('id', reportId);

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * GET handler - Get pass re-run eligibility and status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reportId } = await params;

  try {
    const { data: reportData, error } = await getSupabaseClient()
      .from('reports')
      .select('id, pass_outputs, report_status')
      .eq('id', reportId)
      .single();

    if (error || !reportData) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    const report = reportData as {
      id: string;
      pass_outputs: Record<string, unknown> | null;
      report_status: string;
    };

    const passOutputs = report.pass_outputs || {};
    const availablePasses = Object.keys(passOutputs)
      .map(k => parseInt(k))
      .filter(n => !isNaN(n))
      .sort((a, b) => a - b);

    return NextResponse.json({
      success: true,
      reportId,
      reportStatus: report.report_status,
      availablePasses,
      canRerun: availablePasses.length > 0,
      webSearchPasses: [4, 12, 13],
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
