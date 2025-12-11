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

    // Get report
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Get all pass data
    const { data: passData, error: passError } = await supabase
      .from('report_pass_data')
      .select('*')
      .eq('report_id', reportId)
      .order('pass_number', { ascending: true });

    // Get OpenAI run status if available
    let openaiRunStatus = null;
    if (report.openai_thread_id && report.openai_run_id) {
      try {
        const run = await openai.beta.threads.runs.retrieve(
          report.openai_thread_id,
          report.openai_run_id
        );
        openaiRunStatus = {
          id: run.id,
          status: run.status,
          created_at: run.created_at,
          started_at: run.started_at,
          completed_at: run.completed_at,
          failed_at: run.failed_at,
          expired_at: run.expired_at,
          last_error: run.last_error,
          required_action: run.required_action,
          model: run.model,
          instructions: run.instructions?.substring(0, 200) + '...',
        };
      } catch (error: any) {
        openaiRunStatus = { error: error.message };
      }
    }

    // Build diagnostic response
    const diagnostic = {
      report: {
        id: report.id,
        company_name: report.company_name,
        report_status: report.report_status,
        current_pass: report.current_pass,
        openai_thread_id: report.openai_thread_id,
        openai_run_id: report.openai_run_id,
        file_ids: report.file_ids,
        created_at: report.created_at,
        updated_at: report.updated_at,
        error_message: report.error_message,
      },
      passes_completed: passData?.length || 0,
      pass_details: passData?.map(p => ({
        pass_number: p.pass_number,
        data_keys: Object.keys(p.data || {}),
        created_at: p.created_at,
      })) || [],
      openai_run: openaiRunStatus,
      diagnosis: generateDiagnosis(report, passData, openaiRunStatus),
    };

    return NextResponse.json(diagnostic, { status: 200 });

  } catch (error: any) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function generateDiagnosis(report: any, passData: any[], openaiRunStatus: any): string[] {
  const diagnosis: string[] = [];

  // Check current state
  diagnosis.push(`Report status: ${report.report_status}`);
  diagnosis.push(`Current pass: ${report.current_pass !== null ? report.current_pass : 'Not started'}`);
  diagnosis.push(`Passes completed: ${passData?.length || 0}/18`);

  // Check for stuck state
  if (report.report_status === 'processing') {
    if (report.openai_thread_id && report.openai_run_id) {
      diagnosis.push(`✓ OpenAI run is active`);
      
      if (openaiRunStatus) {
        diagnosis.push(`OpenAI run status: ${openaiRunStatus.status || openaiRunStatus.error}`);
        
        if (openaiRunStatus.status === 'requires_action') {
          diagnosis.push(`⚠️ Run is waiting for tool outputs`);
          if (openaiRunStatus.required_action) {
            diagnosis.push(`Tool calls pending: ${openaiRunStatus.required_action.submit_tool_outputs?.tool_calls?.length || 0}`);
          }
        } else if (openaiRunStatus.status === 'failed') {
          diagnosis.push(`❌ Run failed: ${openaiRunStatus.last_error?.message || 'Unknown error'}`);
        } else if (openaiRunStatus.status === 'expired') {
          diagnosis.push(`❌ Run expired (timeout)`);
        } else if (openaiRunStatus.status === 'in_progress' || openaiRunStatus.status === 'queued') {
          diagnosis.push(`⏳ Run is still in progress`);
        }
      }
    } else {
      diagnosis.push(`⚠️ No active OpenAI run (thread_id or run_id missing)`);
    }
  }

  // Check for missing data
  if (passData && passData.length > 0) {
    const lastPass = passData[passData.length - 1];
    diagnosis.push(`Last completed pass: ${lastPass.pass_number}`);
    
    // Check if we're stuck between passes
    if (report.current_pass !== null && report.current_pass > lastPass.pass_number + 1) {
      diagnosis.push(`⚠️ Gap detected: current_pass=${report.current_pass} but last stored pass=${lastPass.pass_number}`);
    }
  }

  // Check for 95% hang specifically
  if (report.current_pass === 16 || report.current_pass === 17) {
    diagnosis.push(`⚠️ System is at pass ${report.current_pass} (94-98% progress) - this is where hangs typically occur`);
  }

  // Check file_ids
  if (!report.file_ids || report.file_ids.length === 0) {
    diagnosis.push(`⚠️ No file_ids found - AI may not have access to documents`);
  } else {
    diagnosis.push(`✓ File IDs present: ${report.file_ids.length} file(s)`);
  }

  return diagnosis;
}
