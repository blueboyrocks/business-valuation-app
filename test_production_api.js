const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const PRODUCTION_URL = 'https://business-valuation-app.vercel.app';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testProductionAPI() {
  console.log('🧪 Testing Production API\n');
  console.log(`Target: ${PRODUCTION_URL}\n`);

  try {
    // Step 1: Create a test user session
    console.log('👤 Step 1: Getting test user...');
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email: 'ben@emberbyte.io',
      password: 'test123' // This will fail, but that's OK - we'll use service role
    });

    // Use service role to get the user
    const { data: users } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (!users || users.length === 0) {
      throw new Error('No users found in database');
    }

    const testUserId = users[0].id;
    console.log(`✅ Using user ID: ${testUserId}\n`);

    // Step 2: Create test PDFs
    console.log('📄 Step 2: Creating test PDFs...');
    const testDocs = [];
    for (let i = 1; i <= 3; i++) {
      const fileName = `production_test_${i}.pdf`;
      const filePath = `/tmp/${fileName}`;
      
      // Create a simple PDF
      const pdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj
4 0 obj<</Length 44>>stream
BT /F1 12 Tf 100 700 Td (Production Test ${i}) Tj ET
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
      
      fs.writeFileSync(filePath, pdfContent);
      testDocs.push({ name: fileName, path: filePath });
    }
    console.log(`✅ Created ${testDocs.length} test PDFs\n`);

    // Step 3: Upload to Supabase
    console.log('☁️  Step 3: Uploading to Supabase...');
    const uploadedDocs = [];
    for (const doc of testDocs) {
      const fileBuffer = fs.readFileSync(doc.path);
      const storagePath = `${testUserId}/${Date.now()}_${doc.name}`;
      
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(storagePath, fileBuffer, {
          contentType: 'application/pdf',
          upsert: false
        });
      
      if (error) throw error;
      
      uploadedDocs.push({
        name: doc.name,
        path: storagePath,
        size: fileBuffer.length
      });
      console.log(`  ✅ ${doc.name}`);
    }
    console.log(`✅ Uploaded ${uploadedDocs.length} files\n`);

    // Step 4: Create report
    console.log('📊 Step 4: Creating report...');
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        user_id: testUserId,
        company_name: 'Production Test Company',
        report_status: 'processing'
      })
      .select()
      .single();
    
    if (reportError) throw reportError;
    console.log(`✅ Report created: ${report.id}\n`);

    // Step 5: Create document records
    console.log('📝 Step 5: Creating document records...');
    const documentRecords = uploadedDocs.map(doc => ({
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
    console.log(`✅ Created ${documentRecords.length} document records\n`);

    // Step 6: Trigger analysis via production API
    console.log('🚀 Step 6: Triggering analysis via production API...');
    console.log('   This will test the real OpenAI integration\n');
    
    // We need a valid JWT token - let's create one
    const { data: { session }, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: 'ben@emberbyte.io'
    });

    // Actually, let's just call the API with service role directly
    const analyzeResponse = await fetch(`${PRODUCTION_URL}/api/analyze-documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ reportId: report.id })
    });

    if (!analyzeResponse.ok) {
      const errorText = await analyzeResponse.text();
      console.error(`❌ Analysis request failed (${analyzeResponse.status}):`, errorText);
      throw new Error(`Analysis API returned ${analyzeResponse.status}`);
    }

    const analyzeResult = await analyzeResponse.json();
    console.log('✅ Analysis started:', analyzeResult);
    console.log('');

    // Step 7: Poll for completion
    console.log('⏳ Step 7: Polling for completion...');
    console.log('   This will take 10-15 minutes. Checking every 30 seconds...\n');

    let attempts = 0;
    const maxAttempts = 40; // 20 minutes max
    
    while (attempts < maxAttempts) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds

      // Check report status
      const { data: currentReport } = await supabase
        .from('reports')
        .select('*')
        .eq('id', report.id)
        .single();

      console.log(`[${new Date().toLocaleTimeString()}] Attempt ${attempts}/${maxAttempts}: Status = ${currentReport.report_status}`);
      
      if (currentReport.report_data) {
        console.log(`   OpenAI Thread: ${currentReport.report_data.openai_thread_id || 'N/A'}`);
        console.log(`   OpenAI Run: ${currentReport.report_data.openai_run_id || 'N/A'}`);
      }

      if (currentReport.report_status === 'completed') {
        console.log('\n🎉 SUCCESS! Report completed!');
        console.log('\nReport Details:');
        console.log('  ID:', currentReport.id);
        console.log('  Company:', currentReport.company_name);
        console.log('  Status:', currentReport.report_status);
        console.log('  Valuation:', currentReport.valuation_amount || 'N/A');
        console.log('  Method:', currentReport.valuation_method || 'N/A');
        console.log('  Summary:', currentReport.executive_summary?.substring(0, 200) || 'N/A');
        
        return {
          success: true,
          reportId: report.id,
          url: `${PRODUCTION_URL}/dashboard/reports/${report.id}`
        };
      }

      if (currentReport.report_status === 'failed') {
        console.log('\n❌ Report failed!');
        console.log('Error:', currentReport.error_message);
        if (currentReport.report_data?.error) {
          console.log('Details:', currentReport.report_data.error);
        }
        throw new Error('Report processing failed');
      }
    }

    throw new Error('Timeout: Report did not complete within 20 minutes');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testProductionAPI()
  .then(result => {
    console.log('\n✅ Production API test PASSED!');
    console.log('View report at:', result.url);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Production API test FAILED');
    process.exit(1);
  });
