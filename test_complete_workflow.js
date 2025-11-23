const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Use the test user ID from the database
const TEST_USER_ID = 'c6ed8176-6185-4b6d-b5d8-616600bf032b';

async function testCompleteWorkflow() {
  console.log('🧪 Testing Complete Workflow\n');
  console.log('This test will:');
  console.log('1. Create test PDFs');
  console.log('2. Upload them to Supabase storage');
  console.log('3. Create a report');
  console.log('4. Trigger analysis');
  console.log('5. Poll until completion\n');

  try {
    // Step 1: Create test PDFs
    console.log('📄 Step 1: Creating test PDFs...');
    const testFiles = [];
    for (let i = 1; i <= 3; i++) {
      const fileName = `test_financial_doc_${i}.pdf`;
      const filePath = `/tmp/${fileName}`;
      const content = `%PDF-1.4
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
/Length 100
>>
stream
BT
/F1 12 Tf
50 700 Td
(Test Financial Document ${i}) Tj
0 -20 Td
(Revenue: $${i * 1000000}) Tj
0 -20 Td
(Expenses: $${i * 500000}) Tj
0 -20 Td
(Net Income: $${i * 500000}) Tj
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
0000000274 00000 n
0000000424 00000 n
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
521
%%EOF`;
      
      fs.writeFileSync(filePath, content);
      testFiles.push({ name: fileName, path: filePath });
    }
    console.log(`✅ Created ${testFiles.length} test PDFs\n`);

    // Step 2: Upload to Supabase storage
    console.log('☁️  Step 2: Uploading to Supabase storage...');
    const uploadedDocs = [];
    
    for (const file of testFiles) {
      const fileBuffer = fs.readFileSync(file.path);
      const storagePath = `${TEST_USER_ID}/${Date.now()}_${file.name}`;
      
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(storagePath, fileBuffer, {
          contentType: 'application/pdf',
          upsert: false
        });

      if (error) {
        console.error(`Error uploading ${file.name}:`, error);
        continue;
      }

      uploadedDocs.push({
        name: file.name,
        path: data.path,
        size: fileBuffer.length
      });
      
      console.log(`  ✅ Uploaded: ${file.name}`);
    }
    console.log(`\n✅ Uploaded ${uploadedDocs.length} files to storage\n`);

    // Step 3: Create report
    console.log('📊 Step 3: Creating report...');
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        user_id: TEST_USER_ID,
        company_name: 'Test Company (Automated)',
        report_status: 'pending',
      })
      .select()
      .single();

    if (reportError) {
      console.error('Error creating report:', reportError);
      return;
    }

    console.log(`✅ Created report: ${report.id}\n`);

    // Step 4: Create document records
    console.log('📝 Step 4: Creating document records...');
    for (const doc of uploadedDocs) {
      const { error: docError } = await supabase
        .from('documents')
        .insert({
          user_id: TEST_USER_ID,
          report_id: report.id,
          file_name: doc.name,
          file_path: doc.path,
          file_size: doc.size,
          mime_type: 'application/pdf',
          upload_status: 'completed',
        });

      if (docError) {
        console.error(`Error creating document record for ${doc.name}:`, docError);
      }
    }
    console.log(`✅ Created ${uploadedDocs.length} document records\n`);

    // Step 5: Trigger analysis using the new API
    console.log('🚀 Step 5: Triggering analysis...');
    console.log('Note: This will use the new analyze-documents endpoint that avoids timeout issues\n');
    
    const OpenAI = require('openai');
    const FormData = require('form-data');
    
    // Simulate what the new analyze-documents route does
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: 'https://api.openai.com/v1',
    });
    
    const assistantId = process.env.OPENAI_ASSISTANT_ID;
    
    // Update report to processing
    await supabase
      .from('reports')
      .update({
        report_status: 'processing',
        processing_started_at: new Date().toISOString(),
      })
      .eq('id', report.id);
    
    console.log('  Uploading files to OpenAI...');
    const fileIds = [];
    
    for (const doc of uploadedDocs) {
      const { data: fileData } = await supabase.storage
        .from('documents')
        .download(doc.path);
      
      const buffer = Buffer.from(await fileData.arrayBuffer());
      const formData = new FormData();
      formData.append('file', buffer, {
        filename: doc.name,
        contentType: 'application/pdf'
      });
      formData.append('purpose', 'assistants');
      
      const response = await fetch('https://api.openai.com/v1/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2',
          ...formData.getHeaders()
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`    ❌ Upload failed (${response.status}):`, errorText);
        throw new Error(`File upload failed: ${response.status}`);
      }
      
      const uploadedFile = await response.json();
      fileIds.push(uploadedFile.id);
      console.log(`    ✅ ${doc.name} -> ${uploadedFile.id}`);
    }
    
    console.log('\n  Creating OpenAI thread...');
    const thread = await openai.beta.threads.create({
      messages: [{
        role: 'user',
        content: `Please analyze the uploaded financial documents using the generate_enhanced_valuation_analysis function. Company: Test Company (Automated)`,
        attachments: fileIds.map(id => ({
          file_id: id,
          tools: [{ type: 'file_search' }],
        })),
      }],
    });
    
    console.log(`  ✅ Thread created: ${thread.id}`);
    
    console.log('\n  Starting OpenAI run...');
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
    });
    
    console.log(`  ✅ Run started: ${run.id}`);
    console.log(`  Initial status: ${run.status}\n`);
    
    // Store the IDs in the database
    await supabase
      .from('reports')
      .update({
        report_data: {
          openai_thread_id: thread.id,
          openai_run_id: run.id,
          openai_file_ids: fileIds,
          processing_started: new Date().toISOString(),
        }
      })
      .eq('id', report.id);
    
    console.log('✅ Stored OpenAI IDs in database\n');
    
    // Step 6: Poll for completion
    console.log('⏳ Step 6: Polling for completion...');
    console.log('This will check every 30 seconds. OpenAI typically takes 10-15 minutes.\n');
    
    let attempts = 0;
    const maxAttempts = 40; // 20 minutes max
    
    while (attempts < maxAttempts) {
      attempts++;
      
      await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
      
      const runStatus = await openai.beta.threads.runs.retrieve(run.id, { thread_id: thread.id });
      
      const elapsed = Math.floor(attempts * 30 / 60);
      console.log(`  [${elapsed}m] Status: ${runStatus.status}`);
      
      if (runStatus.status === 'requires_action') {
        console.log('    → Submitting tool outputs...');
        const toolCalls = runStatus.required_action.submit_tool_outputs.tool_calls;
        const toolOutputs = toolCalls.map(call => ({
          tool_call_id: call.id,
          output: JSON.stringify({ success: true }),
        }));
        
        await openai.beta.threads.runs.submitToolOutputs(run.id, {
          thread_id: thread.id,
          tool_outputs: toolOutputs,
        });
      }
      
      if (runStatus.status === 'completed') {
        console.log('\n🎉 Analysis completed successfully!\n');
        
        // Get the messages
        const messages = await openai.beta.threads.messages.list(thread.id);
        const assistantMessages = messages.data.filter(m => m.role === 'assistant');
        
        if (assistantMessages.length > 0) {
          const lastMessage = assistantMessages[0];
          const textContent = lastMessage.content.find(c => c.type === 'text');
          if (textContent && 'text' in textContent) {
            const analysisText = textContent.text.value;
            console.log('📄 Analysis preview:');
            console.log(analysisText.substring(0, 500) + '...\n');
            
            // Update the report
            await supabase
              .from('reports')
              .update({
                report_status: 'completed',
                processing_completed_at: new Date().toISOString(),
                executive_summary: analysisText.substring(0, 5000),
                report_data: {
                  openai_thread_id: thread.id,
                  openai_run_id: run.id,
                  openai_file_ids: fileIds,
                  full_analysis: analysisText,
                  completed_at: new Date().toISOString(),
                }
              })
              .eq('id', report.id);
            
            console.log('✅ Report updated in database');
          }
        }
        
        // Clean up files
        console.log('\n🧹 Cleaning up OpenAI files...');
        for (const fileId of fileIds) {
          try {
            await openai.files.delete(fileId);
            console.log(`  ✅ Deleted: ${fileId}`);
          } catch (e) {
            console.log(`  ⚠️  Could not delete: ${fileId}`);
          }
        }
        
        console.log('\n✅ TEST COMPLETED SUCCESSFULLY!');
        console.log(`\nReport ID: ${report.id}`);
        console.log(`View at: https://business-valuation-app.vercel.app/dashboard/reports/${report.id}`);
        break;
      }
      
      if (runStatus.status === 'failed' || runStatus.status === 'expired' || runStatus.status === 'cancelled') {
        console.log(`\n❌ Run ${runStatus.status}`);
        console.log('Error:', runStatus.last_error);
        
        await supabase
          .from('reports')
          .update({
            report_status: 'failed',
            error_message: runStatus.last_error?.message || `Run ${runStatus.status}`,
          })
          .eq('id', report.id);
        
        break;
      }
    }
    
    if (attempts >= maxAttempts) {
      console.log('\n⏰ Test timed out after 20 minutes');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

testCompleteWorkflow().catch(console.error);
