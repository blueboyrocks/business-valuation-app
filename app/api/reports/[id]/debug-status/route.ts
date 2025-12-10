import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reportId = params.id;

    // Get report from database
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    let openaiStatus = null;
    if (report.openai_thread_id && report.openai_run_id) {
      try {
        const run = await openai.beta.threads.runs.retrieve(
          report.openai_thread_id,
          report.openai_run_id
        );
        openaiStatus = {
          status: run.status,
          created_at: run.created_at,
          started_at: run.started_at,
          completed_at: run.completed_at,
          failed_at: run.failed_at,
          expired_at: run.expired_at,
          last_error: run.last_error,
          required_action: run.required_action?.type || null,
        };
      } catch (error: any) {
        openaiStatus = { error: error.message };
      }
    }

    return NextResponse.json({
      report: {
        id: report.id,
        company_name: report.company_name,
        report_status: report.report_status,
        current_pass: report.current_pass,
        created_at: report.created_at,
        updated_at: report.updated_at,
        openai_thread_id: report.openai_thread_id,
        openai_run_id: report.openai_run_id,
        error_message: report.error_message,
      },
      openai_run: openaiStatus,
    });
  } catch (error: any) {
    console.error('Debug status error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
