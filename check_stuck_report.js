const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStuckReport() {
  console.log('🔍 Checking for stuck reports...\n');

  // Get the most recent processing report
  const { data: reports, error } = await supabase
    .from('reports')
    .select('*')
    .eq('status', 'processing')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching reports:', error);
    return;
  }

  if (!reports || reports.length === 0) {
    console.log('No stuck reports found.');
    return;
  }

  const report = reports[0];
  console.log('📊 Found stuck report:');
  console.log('  ID:', report.id);
  console.log('  Name:', report.report_name);
  console.log('  Status:', report.status);
  console.log('  Created:', report.created_at);
  console.log('  Updated:', report.updated_at);
  console.log('  Error:', report.error_message || 'None');
  console.log('  OpenAI Thread ID:', report.openai_thread_id || 'None');
  console.log('  OpenAI Run ID:', report.openai_run_id || 'None');
  console.log('\n');

  // Check if there's an OpenAI run to investigate
  if (report.openai_thread_id && report.openai_run_id) {
    console.log('🤖 Checking OpenAI run status...\n');
    
    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: 'https://api.openai.com/v1',
    });

    try {
      const run = await openai.beta.threads.runs.retrieve(
        report.openai_run_id,
        { thread_id: report.openai_thread_id }
      );

      console.log('  Run Status:', run.status);
      console.log('  Created:', new Date(run.created_at * 1000).toISOString());
      console.log('  Started:', run.started_at ? new Date(run.started_at * 1000).toISOString() : 'Not started');
      console.log('  Completed:', run.completed_at ? new Date(run.completed_at * 1000).toISOString() : 'Not completed');
      console.log('  Failed:', run.failed_at ? new Date(run.failed_at * 1000).toISOString() : 'Not failed');
      console.log('  Cancelled:', run.cancelled_at ? new Date(run.cancelled_at * 1000).toISOString() : 'Not cancelled');
      console.log('  Expired:', run.expired_at ? new Date(run.expired_at * 1000).toISOString() : 'Not expired');
      console.log('  Last Error:', run.last_error || 'None');
      console.log('  Required Action:', run.required_action ? JSON.stringify(run.required_action, null, 2) : 'None');
      console.log('\n');

      // If the run requires action, show what's needed
      if (run.status === 'requires_action' && run.required_action) {
        console.log('⚠️  Run requires action!');
        console.log('  Type:', run.required_action.type);
        if (run.required_action.submit_tool_outputs) {
          console.log('  Tool Calls:', run.required_action.submit_tool_outputs.tool_calls.length);
          run.required_action.submit_tool_outputs.tool_calls.forEach((call, i) => {
            console.log(`\n  Tool Call ${i + 1}:`);
            console.log('    ID:', call.id);
            console.log('    Function:', call.function.name);
            console.log('    Arguments:', call.function.arguments);
          });
        }
      }
    } catch (error) {
      console.error('Error checking OpenAI run:', error.message);
    }
  }

  // Get associated documents
  const { data: docs } = await supabase
    .from('documents')
    .select('*')
    .eq('report_id', report.id);

  if (docs && docs.length > 0) {
    console.log(`\n📄 Associated documents (${docs.length}):`);
    docs.forEach((doc, i) => {
      console.log(`  ${i + 1}. ${doc.file_name} (${doc.file_size} bytes)`);
    });
  }
}

checkStuckReport().catch(console.error);
