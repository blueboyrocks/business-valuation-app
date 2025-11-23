const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkLatestReport() {
  console.log('🔍 Checking latest report...\n');

  // Get the most recent report
  const { data: reports, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!reports || reports.length === 0) {
    console.log('No reports found.');
    return;
  }

  const report = reports[0];
  console.log('📊 Latest Report:');
  console.log('  ID:', report.id);
  console.log('  Company:', report.company_name);
  console.log('  Status:', report.report_status);
  console.log('  Created:', report.created_at);
  console.log('  Processing Started:', report.processing_started_at);
  console.log('  Error:', report.error_message || 'None');
  console.log('\n📦 Report Data:');
  console.log(JSON.stringify(report.report_data, null, 2));
  
  // Get documents for this report
  const { data: documents, error: docError } = await supabase
    .from('documents')
    .select('*')
    .eq('report_id', report.id);
  
  if (!docError && documents) {
    console.log('\n📄 Documents:');
    documents.forEach(doc => {
      console.log(`  - ${doc.file_name} (${doc.upload_status})`);
    });
  }
  
  // Check if OpenAI IDs exist
  if (report.report_data?.openai_thread_id) {
    console.log('\n✅ OpenAI Thread ID found:', report.report_data.openai_thread_id);
    console.log('✅ OpenAI Run ID found:', report.report_data.openai_run_id);
  } else {
    console.log('\n❌ No OpenAI IDs found - the analyze-documents endpoint likely failed');
  }
}

checkLatestReport().catch(console.error);
