const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function investigate() {
  console.log('🔍 Investigating stuck report...\n');

  // Get the processing report
  const { data: reports, error } = await supabase
    .from('reports')
    .select('*')
    .eq('report_status', 'processing')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!reports || reports.length === 0) {
    console.log('No processing reports found.');
    return;
  }

  const report = reports[0];
  console.log('📊 Report Details:');
  console.log('  ID:', report.id);
  console.log('  Company:', report.company_name);
  console.log('  Status:', report.report_status);
  console.log('  Started:', report.processing_started_at);
  console.log('  Created:', report.created_at);
  console.log('  Error:', report.error_message || 'None');
  console.log('\n');

  // Check documents table for this report
  const { data: docs } = await supabase
    .from('documents')
    .select('*')
    .eq('report_id', report.id);

  console.log(`📄 Documents (${docs?.length || 0}):`);
  if (docs && docs.length > 0) {
    docs.forEach((doc, i) => {
      console.log(`  ${i + 1}. ${doc.file_name}`);
      console.log(`     Status: ${doc.status || 'N/A'}`);
      console.log(`     OpenAI File ID: ${doc.openai_file_id || 'N/A'}`);
    });
  }
  console.log('\n');

  // Check if there's a document_id reference
  if (report.document_id) {
    const { data: mainDoc } = await supabase
      .from('documents')
      .select('*')
      .eq('id', report.document_id)
      .single();

    if (mainDoc) {
      console.log('📑 Main Document:');
      console.log('  Name:', mainDoc.file_name);
      console.log('  Status:', mainDoc.status || 'N/A');
      console.log('  OpenAI Thread ID:', mainDoc.openai_thread_id || 'N/A');
      console.log('  OpenAI Run ID:', mainDoc.openai_run_id || 'N/A');
      console.log('\n');

      // If we have OpenAI IDs, check the run status
      if (mainDoc.openai_thread_id && mainDoc.openai_run_id) {
        console.log('🤖 Checking OpenAI run status...\n');
        
        const OpenAI = require('openai');
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
          baseURL: 'https://api.openai.com/v1',
        });

        try {
          const run = await openai.beta.threads.runs.retrieve(
            mainDoc.openai_run_id,
            { thread_id: mainDoc.openai_thread_id }
          );

          console.log('  Status:', run.status);
          console.log('  Model:', run.model);
          console.log('  Created:', new Date(run.created_at * 1000).toISOString());
          
          if (run.started_at) {
            const elapsed = Date.now() / 1000 - run.started_at;
            console.log('  Running for:', Math.floor(elapsed / 60), 'minutes');
          }
          
          if (run.last_error) {
            console.log('  Last Error:', run.last_error);
          }
          
          if (run.status === 'requires_action') {
            console.log('\n⚠️  Run requires action!');
            if (run.required_action?.submit_tool_outputs) {
              const calls = run.required_action.submit_tool_outputs.tool_calls;
              console.log(`  ${calls.length} tool call(s) pending:`);
              calls.forEach((call, i) => {
                console.log(`\n  Call ${i + 1}:`);
                console.log('    Function:', call.function.name);
                console.log('    Arguments:', call.function.arguments.substring(0, 200) + '...');
              });
            }
          }
          
          if (run.status === 'failed' || run.status === 'expired' || run.status === 'cancelled') {
            console.log('\n❌ Run is in terminal state:', run.status);
            console.log('  This report needs to be marked as failed in the database.');
          }
        } catch (error) {
          console.error('Error checking OpenAI run:', error.message);
        }
      }
    }
  }
}

investigate().catch(console.error);
