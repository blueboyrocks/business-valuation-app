const FormData = require('form-data');
const fetch = require('node-fetch');
const fs = require('fs');

async function testOpenAIUpload() {
  console.log('🧪 Testing OpenAI File Upload with Fetch (same as curl)\n');
  console.log('━'.repeat(60));
  
  // Create a simple test PDF content
  const testContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n190\n%%EOF');
  
  console.log('📄 Created test PDF buffer');
  console.log(`   Size: ${testContent.length} bytes\n`);
  
  // Use the exact same approach as in the fixed code
  const formData = new FormData();
  formData.append('file', testContent, {
    filename: 'test_document.pdf',
    contentType: 'application/pdf'
  });
  formData.append('purpose', 'assistants');
  
  console.log('📤 Uploading to OpenAI using fetch + FormData...\n');
  
  try {
    const response = await fetch('https://api.openai.com/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2',
        ...formData.getHeaders()
      },
      body: formData
    });
    
    console.log(`Response status: ${response.status} ${response.statusText}\n`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Upload failed!');
      console.log(`   Error: ${errorText}\n`);
      return;
    }
    
    const result = await response.json();
    console.log('🎉 SUCCESS! File uploaded successfully!\n');
    console.log('━'.repeat(60));
    console.log('Response:');
    console.log(JSON.stringify(result, null, 2));
    console.log('━'.repeat(60));
    console.log('\n✅ The fetch-based upload approach works perfectly!');
    console.log('   This confirms the fix will work in the application.\n');
    
    // Clean up the uploaded file
    console.log(`🧹 Cleaning up test file (${result.id})...`);
    const deleteResponse = await fetch(`https://api.openai.com/v1/files/${result.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });
    
    if (deleteResponse.ok) {
      console.log('✅ Test file deleted successfully\n');
    }
    
  } catch (error) {
    console.log('❌ Error during upload:');
    console.log(error.message);
    console.log(error.stack);
  }
}

// Load environment variables from .env.local (takes precedence)
require('dotenv').config({ path: '.env.local' });

// Explicitly override system env vars
process.env.OPENAI_API_KEY = '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';
process.env.OPENAI_BASE_URL = '';
process.env.OPENAI_API_BASE = '';

console.log(`Using API key: ${process.env.OPENAI_API_KEY.substring(0, 20)}... (length: ${process.env.OPENAI_API_KEY.length})\n`);

testOpenAIUpload().catch(console.error);
