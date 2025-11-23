const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('🔍 Checking database schema...\n');

  // Get all reports to see what columns exist
  const { data: reports, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching reports:', error);
    return;
  }

  if (reports && reports.length > 0) {
    console.log('📊 Reports table columns:');
    console.log(Object.keys(reports[0]));
    console.log('\n📄 Sample report:');
    console.log(JSON.stringify(reports[0], null, 2));
  } else {
    console.log('No reports found in database.');
  }
}

checkSchema().catch(console.error);
