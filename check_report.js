/**
 * Check the status of a report
 * Usage: node check_report.js <report_id>
 */

const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkReport(reportId) {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single();
  
  if (error) {
    console.log('❌ Error fetching report:', error.message);
    return;
  }
  
  console.log('\n📊 Report Status');
  console.log('━'.repeat(70));
  console.log(`Report ID:       ${data.id}`);
  console.log(`Company:         ${data.company_name}`);
  console.log(`Status:          ${data.report_status}`);
  console.log(`Created:         ${data.created_at}`);
  console.log(`Started:         ${data.processing_started_at || 'N/A'}`);
  console.log(`Completed:       ${data.processing_completed_at || 'N/A'}`);
  console.log('━'.repeat(70));
  
  if (data.error_message) {
    console.log(`\n❌ Error: ${data.error_message}\n`);
  } else if (data.report_status === 'completed') {
    console.log('\n🎉 Analysis completed successfully!\n');
    console.log('Results:');
    console.log(`  Valuation Amount: $${data.valuation_amount?.toLocaleString() || 'N/A'}`);
    console.log(`  Valuation Method: ${data.valuation_method || 'N/A'}`);
    console.log(`  Executive Summary: ${data.executive_summary?.substring(0, 200)}...`);
    console.log('');
  } else if (data.report_status === 'processing') {
    console.log('\n⏳ Analysis is still processing...');
    console.log('   This typically takes 10-15 minutes.');
    console.log('   Run this script again to check progress.\n');
  } else if (data.report_status === 'pending') {
    console.log('\n⏸️  Analysis has not started yet.\n');
  }
}

const reportId = process.argv[2];
if (!reportId) {
  console.log('Usage: node check_report.js <report_id>');
  process.exit(1);
}

checkReport(reportId);
