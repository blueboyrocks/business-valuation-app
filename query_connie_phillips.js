const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/home/ubuntu/business-valuation-app/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function queryConniePhillips() {
  const { data: reports, error } = await supabase
    .from('reports')
    .select('*')
    .ilike('company_name', '%Connie Phillips%')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (reports && reports.length > 0) {
    const report = reports[0];
    console.log('\n=== CONNIE PHILLIPS REPORT ===\n');
    console.log('Company Name:', report.company_name);
    console.log('Status:', report.status);
    console.log('Created:', report.created_at);
    console.log('\n=== VALUATION RESULTS ===\n');
    console.log('Estimated Value:', report.estimated_value);
    console.log('Value Range Low:', report.value_range_low);
    console.log('Value Range High:', report.value_range_high);
    console.log('\n=== REPORT DATA ===\n');
    console.log(JSON.stringify(report.report_data, null, 2));
  } else {
    console.log('No Connie Phillips report found');
  }
}

queryConniePhillips();
