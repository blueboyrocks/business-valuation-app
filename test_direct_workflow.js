const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDirectWorkflow() {
  console.log('🧪 Testing Direct Workflow (bypassing auth)\n');

  try {
    // Get test user
    const { data: users } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    const testUserId = users[0].id;
    console.log(`✅ Using user: ${testUserId}\n`);

    // Create test PDFs and upload
    console.log('📄 Creating and uploading test PDFs...');
    const testDocs = [];
    for (let i = 1; i <= 3; i++) {
      const fileName = `direct_test_${Date.now()}_${i}.pdf`;
      const pdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj
4 0 obj<</Length 44>>stream
BT /F1 12 Tf 100 700 Td (Direct Test ${i}) Tj ET
endstream endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000056 00000 n
0000000115 00000 n
0000000214 00000 n
trailer<</Size 5/Root 1 0 R>>
startxref
306
%%EOF`;
      
      const fileBuffer = Buffer.from(pdfContent);
      const storagePath = `${testUserId}/${fileName}`;
      
      const { error } = await supabase.storage
        .from('documents')
        .upload(storagePath, fileBuffer, {
          contentType: 'application/pdf'
        });
      
      if (error) throw error;
      
      testDocs.push({
        name: fileName,
        path: storagePath,
        size: fileBuffer.length
      });
      console.log(`  ✅ ${fileName}`);
    }

    // Create report
    console.log('\n📊 Creating report...');
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        user_id: testUserId,
        company_name: 'Direct Test Company',
        report_status: 'processing',
        processing_started_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (reportError) throw reportError;
    console.log(`✅ Report: ${report.id}\n`);

    // Create document records
    console.log('📝 Creating document records...');
    const documentRecords = testDocs.map(doc => ({
      report_id: report.id,
      user_id: testUserId,
      file_name: doc.name,
      file_path: doc.path,
      file_size: doc.size,
      mime_type: 'application/pdf',
      upload_status: 'completed'
    }));

    const { error: docsError } = await supabase
      .from('documents')
      .insert(documentRecords);
    
    if (docsError) throw docsError;
    console.log(`✅ Created ${documentRecords.length} documents\n`);

    // Now manually trigger the OpenAI processing by calling the production endpoint
    // using curl since we need to test the actual deployed code
    console.log('🚀 Triggering analysis on production...');
    console.log('   Report ID:', report.id);
    console.log('   View at: https://business-valuation-app.vercel.app/dashboard/reports/' + report.id);
    console.log('\n⏳ Monitoring progress...\n');

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 40;
    
    while (attempts < maxAttempts) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 30000));

      const { data: currentReport } = await supabase
        .from('reports')
        .select('*')
        .eq('id', report.id)
        .single();

      const timestamp = new Date().toLocaleTimeString();
      console.log(`[${timestamp}] Attempt ${attempts}/${maxAttempts}:`);
      console.log(`  Status: ${currentReport.report_status}`);
      
      if (currentReport.report_data) {
        const data = currentReport.report_data;
        if (data.openai_thread_id) {
          console.log(`  Thread: ${data.openai_thread_id}`);
          console.log(`  Run: ${data.openai_run_id}`);
        }
        if (data.error) {
          console.log(`  Error: ${data.error}`);
        }
      }

      if (currentReport.error_message) {
        console.log(`  Error Message: ${currentReport.error_message}`);
      }

      console.log('');

      if (currentReport.report_status === 'completed') {
        console.log('🎉 SUCCESS! Report completed!\n');
        console.log('Report Details:');
        console.log('  Valuation:', currentReport.valuation_amount || 'N/A');
        console.log('  Method:', currentReport.valuation_method || 'N/A');
        console.log('  Summary:', currentReport.executive_summary?.substring(0, 200) || 'N/A');
        
        return {
          success: true,
          reportId: report.id
        };
      }

      if (currentReport.report_status === 'failed') {
        console.log('❌ Report failed!');
        console.log('Error:', currentReport.error_message);
        throw new Error('Report processing failed');
      }
    }

    throw new Error('Timeout after 20 minutes');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    throw error;
  }
}

// Instructions
console.log('═══════════════════════════════════════════════════════════════');
console.log('MANUAL TEST INSTRUCTIONS');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log('This script will:');
console.log('1. Create a report with test documents');
console.log('2. Print the report URL');
console.log('3. YOU MUST manually visit the URL and click "Analyze Documents"');
console.log('4. The script will then monitor progress until completion');
console.log('');
console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
console.log('');

setTimeout(() => {
  testDirectWorkflow()
    .then(result => {
      console.log('\n✅ Test PASSED!');
      console.log('Report ID:', result.reportId);
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Test FAILED');
      process.exit(1);
    });
}, 5000);
