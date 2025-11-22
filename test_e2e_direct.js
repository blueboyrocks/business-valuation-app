/**
 * End-to-End Test for OpenAI Business Valuation Workflow
 * This test bypasses authentication by using the service role key directly
 */

const { createClient } = require('@supabase/supabase-js');
const FormData = require('form-data');
const fetch = require('node-fetch');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Override system env vars
process.env.OPENAI_API_KEY = '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';
process.env.OPENAI_ASSISTANT_ID = 'asst_w0cJU4Srw8bRJPYKhLs2tWJk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_USER_ID = 'a3fe66e5-ede6-4e2c-a0af-ef91bd81e2d8'; // From previous session

async function createTestPDF(filename) {
  // Create a simple but valid PDF
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(${filename}) Tj
ET
endstream
endobj
5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000270 00000 n
0000000363 00000 n
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
444
%%EOF`;
  
  return Buffer.from(pdfContent);
}

async function runE2ETest() {
  console.log('🧪 End-to-End OpenAI Workflow Test');
  console.log('━'.repeat(70));
  console.log('');
  
  try {
    // Step 1: Create test documents
    console.log('📄 Step 1: Creating test PDF documents...');
    const doc1 = await createTestPDF('Financial Statement Q1 2024');
    const doc2 = await createTestPDF('Financial Statement Q2 2024');
    const doc3 = await createTestPDF('Financial Statement Q3 2024');
    console.log(`   ✅ Created 3 test PDFs (${doc1.length} bytes each)\n`);
    
    // Step 2: Upload to Supabase Storage
    console.log('📤 Step 2: Uploading documents to Supabase storage...');
    const timestamp = Date.now();
    const uploadedFiles = [];
    
    for (let i = 1; i <= 3; i++) {
      const filename = `test_doc_${timestamp}_${i}.pdf`;
      const filepath = `${TEST_USER_ID}/${filename}`;
      const doc = i === 1 ? doc1 : i === 2 ? doc2 : doc3;
      
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(filepath, doc, {
          contentType: 'application/pdf',
          upsert: false
        });
      
      if (error) {
        console.log(`   ❌ Failed to upload ${filename}: ${error.message}`);
        throw error;
      }
      
      uploadedFiles.push({
        filename,
        filepath: data.path,
        size: doc.length
      });
      
      console.log(`   ✅ Uploaded: ${filename}`);
    }
    console.log('');
    
    // Step 3: Create report in database
    console.log('📋 Step 3: Creating report record...');
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        user_id: TEST_USER_ID,
        company_name: 'Test Company Inc.',
        report_status: 'pending'
      })
      .select()
      .single();
    
    if (reportError) {
      console.log(`   ❌ Failed to create report: ${reportError.message}`);
      throw reportError;
    }
    
    console.log(`   ✅ Report created: ${report.id}`);
    console.log(`   Company: ${report.company_name}\n`);
    
    // Step 4: Link documents to report
    console.log('🔗 Step 4: Linking documents to report...');
    for (const file of uploadedFiles) {
      const { error: docError } = await supabase
        .from('documents')
        .insert({
          user_id: TEST_USER_ID,
          report_id: report.id,
          file_name: file.filename,
          file_path: file.filepath,
          file_size: file.size,
          mime_type: 'application/pdf',
          upload_status: 'completed'
        });
      
      if (docError) {
        console.log(`   ❌ Failed to link ${file.filename}: ${docError.message}`);
        throw docError;
      }
      
      console.log(`   ✅ Linked: ${file.filename}`);
    }
    console.log('');
    
    // Step 5: Trigger OpenAI analysis
    console.log('🤖 Step 5: Triggering OpenAI analysis...');
    console.log('   This will test the complete workflow:');
    console.log('   - Download files from Supabase');
    console.log('   - Upload to OpenAI using fetch + FormData');
    console.log('   - Create thread and run with Assistant');
    console.log('   - Poll for completion');
    console.log('   - Save results to database\n');
    
    // Import and run the analysis function
    const { processAnalysis } = await import('./test_analysis_function.js');
    await processAnalysis(report.id);
    
    console.log('━'.repeat(70));
    console.log('✅ Test setup complete!');
    console.log('');
    console.log('📊 Monitor the analysis:');
    console.log(`   Report ID: ${report.id}`);
    console.log(`   Server logs: tail -f /tmp/nextjs_all_fixes.log`);
    console.log(`   Check status: node check_report.js ${report.id}`);
    console.log('');
    console.log('⏱️  Expected completion time: 10-15 minutes');
    
  } catch (error) {
    console.log('');
    console.log('━'.repeat(70));
    console.log('❌ Test failed with error:');
    console.log(error.message);
    console.log(error.stack);
  }
}

runE2ETest();
