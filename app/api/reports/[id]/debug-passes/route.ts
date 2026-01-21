// Debug endpoint to inspect pass_outputs
// DELETE THIS AFTER DEBUGGING

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reportId } = await params;
  const { searchParams } = new URL(request.url);
  const passParam = searchParams.get('pass');

  try {
    const { data, error } = await getSupabaseClient()
      .from('reports')
      .select('id, company_name, report_status, current_pass, pass_outputs')
      .eq('id', reportId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const reportData = data as {
      id: string;
      company_name: string;
      report_status: string;
      current_pass: number;
      pass_outputs: Record<string, unknown> | null;
    };

    const passOutputs = reportData.pass_outputs || {};
    const passKeys = Object.keys(passOutputs);

    // If specific pass requested, show just that pass
    if (passParam) {
      const passData = passOutputs[passParam];
      return NextResponse.json({
        reportId,
        companyName: reportData.company_name,
        status: reportData.report_status,
        currentPass: reportData.current_pass,
        requestedPass: passParam,
        passExists: !!passData,
        passKeys: passData ? Object.keys(passData) : [],
        passData: passData || null,
      });
    }

    // Show summary of all passes
    const passSummaries: Record<string, { exists: boolean; keys: string[] }> = {};
    for (const [pass, output] of Object.entries(passOutputs)) {
      passSummaries[pass] = {
        exists: !!output,
        keys: output ? Object.keys(output as object) : [],
      };
    }

    return NextResponse.json({
      reportId,
      companyName: reportData.company_name,
      status: reportData.report_status,
      currentPass: reportData.current_pass,
      totalPasses: passKeys.length,
      passKeys,
      passSummaries,
    });

  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
