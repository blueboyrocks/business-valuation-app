const fetch = require('node-fetch');

const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsImtpZCI6IjV3dE1sRjVod0tISC9vUU4iLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2xpZ3V6ZXZpeWZheXV0Znd2bnNxLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJhM2ZlNjZlNS1lZGU2LTRlMmMtYTBhZi1lZjkxYmQ4MWUyZDgiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYzODQ0NjA4LCJpYXQiOjE3NjM4NDEwMDgsImVtYWlsIjoidGVzdEB2YWx1YXRpb25wcm8uY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6InRlc3RAdmFsdWF0aW9ucHJvLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmdWxsX25hbWUiOiJUZXN0IFVzZXIiLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInN1YiI6ImEzZmU2NmU1LWVkZTYtNGUyYy1hMGFmLWVmOTFiZDgxZTJkOCJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzYzODM3NTExfV0sInNlc3Npb25faWQiOiJkZmFhYzgxYi05M2Y0LTRhODItOTM5Yy1iNDRkZjcwNTAzNzQiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.9zep9PbhaXBAVuskd4E4_NB_52CeLu2ENFgo8i8oFSU';

async function testAnalysis() {
  console.log('🧪 Testing OpenAI Analysis with Fetch-based File Upload\n');
  console.log('━'.repeat(60));
  
  // First, get an existing report with documents
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    'https://liguzeviyfayutfwvnsq.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpZ3V6ZXZpeWZheXV0Znd2bnNxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDA0MjI1NywiZXhwIjoyMDc1NjE4MjU3fQ.jkPwKTVkVKXnJxsLj_4lImMsnIVhSYKEQ6q4gmQUCFY'
  );
  
  // Get the latest report
  const { data: reports } = await supabase
    .from('reports')
    .select('id, company_name, created_at')
    .order('created_at', { ascending: false })
    .limit(1);
  
  if (!reports || reports.length === 0) {
    console.log('❌ No existing reports found. Please upload documents first.');
    return;
  }
  
  const reportId = reports[0].id;
  console.log(`📋 Using existing report: ${reportId}`);
  console.log(`   Company: ${reports[0].company_name}`);
  console.log(`   Created: ${reports[0].created_at}\n`);
  
  // Trigger analysis
  console.log('🤖 Triggering OpenAI analysis...\n');
  
  const response = await fetch('http://localhost:3000/api/analyze-documents', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ACCESS_TOKEN}`
    },
    body: JSON.stringify({ reportId })
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.log(`❌ Analysis request failed: ${response.status}`);
    console.log(error);
    return;
  }
  
  const result = await response.json();
  console.log('✅ Analysis started successfully!');
  console.log(`   Message: ${result.message}\n`);
  console.log('━'.repeat(60));
  console.log('\n⏳ Processing will take 10-15 minutes.');
  console.log('   Check server logs at /tmp/nextjs_final_fix.log for progress.');
  console.log(`   Monitor status with: node check_report_status.js ${reportId}`);
}

testAnalysis().catch(console.error);
