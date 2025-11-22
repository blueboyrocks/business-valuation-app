/**
 * Direct OpenAI Workflow Test
 * This simulates the exact workflow without going through HTTP endpoints
 */

const { createClient } = require('@supabase/supabase-js');
const FormData = require('form-data');
const fetch = require('node-fetch');
const OpenAI = require('openai').default;

// Load and override environment
require('dotenv').config({ path: '.env.local' });
process.env.OPENAI_API_KEY = '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';
process.env.OPENAI_ASSISTANT_ID = 'asst_w0cJU4Srw8bRJPYKhLs2tWJk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.openai.com/v1',
  defaultHeaders: {
    'OpenAI-Beta': 'assistants=v2'
  }
});

const TEST_USER_ID = 'a3fe66e5-ede6-4e2c-a0af-ef91bd81e2d8';

function createTestPDF(title) {
  const content = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 50>>stream
BT /F1 12 Tf 50 700 Td (${title}) Tj ET
endstream endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000258 00000 n 
0000000357 00000 n 
trailer<</Size 6/Root 1 0 R>>
startxref
437
%%EOF`;
  return Buffer.from(content);
}

async function testCompleteWorkflow() {
  console.log('\n🧪 Direct OpenAI Workflow Test');
  console.log('━'.repeat(70));
  
  let reportId;
  
  try {
    // Step 1: Create test data
    console.log('\n📄 Creating test documents and report...');
    const timestamp = Date.now();
    const docs = [
      { name: `test_${timestamp}_1.pdf`, content: createTestPDF('Financial Statement Q1') },
      { name: `test_${timestamp}_2.pdf`, content: createTestPDF('Financial Statement Q2') },
      { name: `test_${timestamp}_3.pdf`, content: createTestPDF('Financial Statement Q3') }
    ];
    
    // Upload to Supabase
    const uploadedDocs = [];
    for (const doc of docs) {
      const filepath = `${TEST_USER_ID}/${doc.name}`;
      const { error } = await supabase.storage
        .from('documents')
        .upload(filepath, doc.content, { contentType: 'application/pdf' });
      
      if (error) throw error;
      uploadedDocs.push({ name: doc.name, path: filepath, size: doc.content.length });
      console.log(`   ✅ Uploaded: ${doc.name}`);
    }
    
    // Create report
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        user_id: TEST_USER_ID,
        company_name: 'Test Company Inc.',
        report_status: 'processing',
        processing_started_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (reportError) throw reportError;
    reportId = report.id;
    console.log(`   ✅ Report created: ${reportId}\n`);
    
    // Link documents
    for (const doc of uploadedDocs) {
      const { error } = await supabase.from('documents').insert({
        user_id: TEST_USER_ID,
        report_id: reportId,
        file_name: doc.name,
        file_path: doc.path,
        file_size: doc.size,
        mime_type: 'application/pdf',
        upload_status: 'completed'
      });
      if (error) throw error;
    }
    
    // Step 2: Upload files to OpenAI
    console.log('📤 Uploading files to OpenAI...');
    const fileIds = [];
    
    for (const doc of uploadedDocs) {
      const { data: fileData } = await supabase.storage
        .from('documents')
        .download(doc.path);
      
      if (!fileData) throw new Error(`Failed to download ${doc.name}`);
      
      const buffer = Buffer.from(await fileData.arrayBuffer());
      
      // Use fetch + FormData (the working approach)
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
        throw new Error(`File upload failed: ${response.status} - ${errorText}`);
      }
      
      const uploadedFile = await response.json();
      fileIds.push(uploadedFile.id);
      console.log(`   ✅ Uploaded to OpenAI: ${doc.name} (${uploadedFile.id})`);
    }
    
    // Step 3: Create thread and run
    console.log(`\n🧵 Creating OpenAI thread with ${fileIds.length} files...`);
    const thread = await openai.beta.threads.create({
      messages: [{
        role: 'user',
        content: `Please analyze the uploaded financial documents using the generate_enhanced_valuation_analysis function. Company: Test Company Inc.`,
        attachments: fileIds.map(id => ({
          file_id: id,
          tools: [{ type: 'file_search' }]
        }))
      }]
    });
    console.log(`   ✅ Thread created: ${thread.id}`);
    
    console.log('\n🚀 Starting Assistant run...');
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID
    });
    console.log(`   ✅ Run started: ${run.id}`);
    console.log(`   Status: ${run.status}`);
    
    // Step 4: Poll for completion
    console.log('\n⏳ Polling for completion (this will take 10-15 minutes)...');
    let currentRun = run;
    let pollCount = 0;
    const maxPolls = 60; // 30 minutes max
    
    while (pollCount < maxPolls) {
      await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
      pollCount++;
      
      currentRun = await openai.beta.threads.runs.retrieve(run.id, { thread_id: thread.id });
      console.log(`   [${pollCount}] Status: ${currentRun.status}`);
      
      if (currentRun.status === 'completed') {
        console.log('\n🎉 Run completed successfully!');
        
        // Get messages
        const messages = await openai.beta.threads.messages.list(thread.id);
        const assistantMessage = messages.data.find(m => m.role === 'assistant');
        
        if (assistantMessage) {
          console.log('\n📝 Assistant Response:');
          console.log(JSON.stringify(assistantMessage.content, null, 2));
        }
        
        // Update database
        await supabase.from('reports').update({
          report_status: 'completed',
          processing_completed_at: new Date().toISOString()
        }).eq('id', reportId);
        
        console.log(`\n✅ Report ${reportId} marked as completed`);
        break;
      } else if (currentRun.status === 'failed' || currentRun.status === 'cancelled' || currentRun.status === 'expired') {
        throw new Error(`Run ${currentRun.status}: ${currentRun.last_error?.message || 'Unknown error'}`);
      } else if (currentRun.status === 'requires_action') {
        console.log(`   ⚙️  Run requires action - submitting tool outputs...`);
        
        if (currentRun.required_action?.type === 'submit_tool_outputs') {
          const toolCalls = currentRun.required_action.submit_tool_outputs.tool_calls;
          
          const toolOutputs = toolCalls.map(toolCall => {
            console.log(`      Function called: ${toolCall.function.name}`);
            return {
              tool_call_id: toolCall.id,
              output: JSON.stringify({ success: true })
            };
          });
          
          await openai.beta.threads.runs.submitToolOutputs(currentRun.id, {
            thread_id: thread.id,
            tool_outputs: toolOutputs
          });
          
          console.log(`   ✅ Tool outputs submitted`);
        }
      }
    }
    
    if (pollCount >= maxPolls) {
      throw new Error('Polling timeout - run did not complete in 30 minutes');
    }
    
    console.log('\n━'.repeat(70));
    console.log('✅ Complete workflow test PASSED!');
    console.log(`   Report ID: ${reportId}`);
    console.log(`   Check with: node check_report.js ${reportId}`);
    
  } catch (error) {
    console.log('\n━'.repeat(70));
    console.log('❌ Test FAILED:');
    console.log(`   ${error.message}`);
    console.log(error.stack);
    
    if (reportId) {
      await supabase.from('reports').update({
        report_status: 'failed',
        error_message: error.message,
        processing_completed_at: new Date().toISOString()
      }).eq('id', reportId);
    }
  }
}

testCompleteWorkflow();
