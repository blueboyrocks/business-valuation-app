/**
 * Run Single Pass API Route
 *
 * Executes ONE pass per request for client-side orchestration.
 * Prevents Vercel timeout by keeping each request under 120 seconds.
 *
 * Usage:
 * - POST /api/reports/[id]/run-single-pass
 *   Body: { passNumber: 5 }                         — numeric pass
 *   Body: { narrativePassId: "11c" }                 — narrative pass
 *   Body: { passNumber: 4, useWebSearch: true }      — with web search
 */

export const maxDuration = 800; // Vercel Pro max — single pass shouldn't need this much, but avoid timeout errors
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { executePass, executeNarrativePass, convertToCalcResultsForNarrative } from '@/lib/claude/pass-executor';

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

interface SinglePassRequest {
  passNumber?: number;
  narrativePassId?: string;
  useWebSearch?: boolean;
  forceRegenerate?: boolean;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reportId } = await params;
  const body: SinglePassRequest = await request.json();
  const { passNumber, narrativePassId, useWebSearch, forceRegenerate } = body;

  // Validate: exactly one of passNumber or narrativePassId
  if (!passNumber && !narrativePassId) {
    return NextResponse.json(
      { success: false, error: 'Provide either passNumber (1-13) or narrativePassId (11a-11k)' },
      { status: 400 }
    );
  }

  const isNarrative = !!narrativePassId;
  const passLabel = isNarrative ? `Narrative ${narrativePassId}` : `Pass ${passNumber}`;
  console.log(`[SINGLE-PASS] Starting ${passLabel} for report ${reportId}`);

  try {
    // Load report + pass outputs + calculation_results
    const { data: reportData, error: fetchError } = await getSupabaseClient()
      .from('reports')
      .select('id, company_name, report_data, pass_outputs, calculation_results')
      .eq('id', reportId)
      .maybeSingle();

    if (fetchError || !reportData) {
      const errMsg = fetchError?.message || 'Report not found';
      console.error(`[SINGLE-PASS] Supabase error for ${passLabel}: ${errMsg}`);
      return NextResponse.json(
        { success: false, error: errMsg },
        { status: fetchError ? 500 : 404 }
      );
    }

    const report = reportData as {
      id: string;
      company_name: string;
      report_data: Record<string, unknown> | null;
      pass_outputs: Record<string, unknown> | null;
      calculation_results: Record<string, unknown> | null;
    };

    const existingPassOutputs: Record<string, unknown> = report.pass_outputs || {};

    // Update progress
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (getSupabaseClient().from('reports') as any).update({
      processing_message: `Running ${passLabel}...`,
    }).eq('id', reportId);

    const startTime = Date.now();
    let result: unknown;

    if (isNarrative) {
      // Execute narrative pass
      const validIds = ['11a', '11b', '11c', '11d', '11e', '11f', '11g', '11h', '11i', '11j', '11k'];
      if (!validIds.includes(narrativePassId!)) {
        return NextResponse.json(
          { success: false, error: `Invalid narrative pass ID: ${narrativePassId}. Valid: ${validIds.join(', ')}` },
          { status: 400 }
        );
      }

      // Gather prior narrative results for context (needed by 11a especially)
      const existingNarratives = (existingPassOutputs['narratives'] as Record<string, unknown>) || {};
      const priorNarratives = (existingNarratives.pass_results as Record<string, unknown>) || {};

      // Convert calculation results to the format needed for narrative generation
      const calcResultsForNarrative = convertToCalcResultsForNarrative(report.calculation_results);
      if (calcResultsForNarrative) {
        console.log(`[SINGLE-PASS] Injecting authoritative values into ${narrativePassId} prompt (concluded: $${calcResultsForNarrative.concluded_value.toLocaleString()})`);
      } else {
        console.log(`[SINGLE-PASS] No calculation results available for ${narrativePassId} - values block will not be injected`);
      }

      result = await executeNarrativePass(
        narrativePassId!,
        reportId,
        report,
        existingPassOutputs,
        priorNarratives,
        calcResultsForNarrative
      );

      // Save narrative result into pass_outputs.narratives.pass_results[passId]
      const updatedNarratives = {
        ...(existingPassOutputs['narratives'] as Record<string, unknown> || {}),
        pass_results: {
          ...priorNarratives,
          [narrativePassId!]: result,
        },
      };
      existingPassOutputs['narratives'] = updatedNarratives;

    } else {
      // Execute numeric pass
      if (passNumber! < 1 || passNumber! > 13) {
        return NextResponse.json(
          { success: false, error: `Invalid pass number: ${passNumber}. Valid: 1-13.` },
          { status: 400 }
        );
      }

      result = await executePass(
        passNumber!,
        reportId,
        report,
        existingPassOutputs,
        {
          useWebSearch: useWebSearch && [4, 12, 13].includes(passNumber!),
          forceRegenerate,
        }
      );

      // Save numeric result into pass_outputs[passNumber]
      existingPassOutputs[String(passNumber)] = result;
    }

    const durationMs = Date.now() - startTime;

    // Persist updated pass outputs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (getSupabaseClient().from('reports') as any).update({
      pass_outputs: existingPassOutputs,
      processing_message: `Completed ${passLabel} (${Math.round(durationMs / 1000)}s)`,
    }).eq('id', reportId);

    console.log(`[SINGLE-PASS] Completed ${passLabel} in ${durationMs}ms`);

    // Check for parse errors in result
    const hasParseError = typeof result === 'object' && result !== null && 'parse_error' in result;

    return NextResponse.json({
      success: !hasParseError,
      passLabel,
      passNumber: passNumber || null,
      narrativePassId: narrativePassId || null,
      durationMs,
      hasParseError,
      result: hasParseError ? undefined : result,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[SINGLE-PASS] Error in ${passLabel}:`, errorMessage);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (getSupabaseClient().from('reports') as any).update({
      processing_message: `Error in ${passLabel}: ${errorMessage}`,
    }).eq('id', reportId);

    return NextResponse.json({
      success: false,
      error: errorMessage,
      passLabel,
    }, { status: 500 });
  }
}
