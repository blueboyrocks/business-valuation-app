const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function resetStuckReport() {
  console.log('🔄 Resetting stuck report...\n');

  // Get the stuck report
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
    console.log('No stuck reports found.');
    return;
  }

  const report = reports[0];
  console.log('📊 Found stuck report:');
  console.log('  ID:', report.id);
  console.log('  Company:', report.company_name);
  console.log('  Started:', report.processing_started_at);
  console.log('\n');

  // Mark it as failed with explanation
  const { error: updateError } = await supabase
    .from('reports')
    .update({
      report_status: 'failed',
      error_message: 'Report processing was interrupted due to serverless timeout. This has been fixed - please try uploading again.',
    })
    .eq('id', report.id);

  if (updateError) {
    console.error('Error updating report:', updateError);
  } else {
    console.log('✅ Report marked as failed with explanation');
    console.log('\nThe user can now create a new report and it will work correctly.');
  }
}

resetStuckReport().catch(console.error);
