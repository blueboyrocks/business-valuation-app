import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getOpenAIClient } from '@/lib/openai/client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * This endpoint checks the OpenAI run status and processes tool calls if needed.
 * It should be called repeatedly by the frontend until the report is completed.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const reportId = params.id;
  console.log(`[PROCESS] Checking report ${reportId}`);

  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the report
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // If already completed or failed, return status
    if (report.report_status === 'completed' || report.report_status === 'failed') {
      return NextResponse.json({
        status: report.report_status,
        message: report.report_status === 'completed' ? 'Analysis complete' : 'Analysis failed',
        error: report.error_message,
      });
    }

    // Check if we have OpenAI IDs
    const reportData = report.report_data as any;
    if (!reportData?.openai_thread_id || !reportData?.openai_run_id) {
      return NextResponse.json({
        status: 'processing',
        message: 'Waiting for OpenAI initialization...',
        progress: 5,
      });
    }

    const threadId = reportData.openai_thread_id;
    const runId = reportData.openai_run_id;

    console.log(`[PROCESS] Checking OpenAI run ${runId}`);

    const openai = getOpenAIClient();
    const run = await openai.beta.threads.runs.retrieve(runId, { thread_id: threadId });

    console.log(`[PROCESS] Run status: ${run.status}`);

    // Handle different run statuses
    if (run.status === 'completed') {
      // Get the messages from the thread
      const messages = await openai.beta.threads.messages.list(threadId);
      const assistantMessages = messages.data.filter(m => m.role === 'assistant');
      
      let analysisText = '';
      if (assistantMessages.length > 0) {
        const lastMessage = assistantMessages[0];
        const textContent = lastMessage.content.find(c => c.type === 'text');
        if (textContent && 'text' in textContent) {
          analysisText = textContent.text.value;
        }
      }

      // Update report as completed
      await supabase
        .from('reports')
        .update({
          report_status: 'completed',
          processing_completed_at: new Date().toISOString(),
          executive_summary: analysisText.substring(0, 5000), // Store first 5000 chars
          report_data: {
            ...reportData,
            full_analysis: analysisText,
            completed_at: new Date().toISOString(),
          }
        } as any)
        .eq('id', reportId);

      // Clean up OpenAI files
      if (reportData.openai_file_ids) {
        for (const fileId of reportData.openai_file_ids) {
          try {
            await openai.files.del(fileId);
          } catch (e) {
            console.log(`[PROCESS] Could not delete file ${fileId}`);
          }
        }
      }

      return NextResponse.json({
        status: 'completed',
        message: 'Analysis complete!',
        progress: 100,
      });
    }

    if (run.status === 'requires_action') {
      console.log(`[PROCESS] Run requires action`);
      
      if (run.required_action?.type === 'submit_tool_outputs') {
        const toolCalls = run.required_action.submit_tool_outputs.tool_calls;
        console.log(`[PROCESS] Submitting outputs for ${toolCalls.length} tool calls`);

        const toolOutputs = toolCalls.map(toolCall => ({
          tool_call_id: toolCall.id,
          output: JSON.stringify({ success: true }),
        }));

        await openai.beta.threads.runs.submitToolOutputs(runId, {
          thread_id: threadId,
          tool_outputs: toolOutputs,
        });

        return NextResponse.json({
          status: 'processing',
          message: 'Processing tool outputs...',
          progress: 90,
        });
      }
    }

    if (run.status === 'failed' || run.status === 'expired' || run.status === 'cancelled') {
      await supabase
        .from('reports')
        .update({
          report_status: 'failed',
          error_message: run.last_error?.message || `Run ${run.status}`,
        } as any)
        .eq('id', reportId);

      return NextResponse.json({
        status: 'failed',
        message: run.last_error?.message || `Analysis ${run.status}`,
        error: run.last_error,
      });
    }

    // Still in progress
    const progress = run.status === 'queued' ? 10 : 50;
    return NextResponse.json({
      status: 'processing',
      message: `Analysis ${run.status}...`,
      progress,
    });

  } catch (error) {
    console.error('[PROCESS] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
