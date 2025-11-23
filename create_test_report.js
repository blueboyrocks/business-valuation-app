const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestReport() {
  // Get test user
  const { data: users } = await supabase.from('profiles').select('*').limit(1);
  const testUserId = users[0].id;

  // Create test PDFs and upload
  const testDocs = [];
  for (let i = 1; i <= 3; i++) {
    const fileName = `automated_test_${Date.now()}_${i}.pdf`;
    const pdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj
4 0 obj<</Length 50>>stream
BT /F1 12 Tf 100 700 Td (Automated Test Doc ${i}) Tj ET
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
312
%%EOF`;
    
    const fileBuffer = Buffer.from(pdfContent);
    const storagePath = `${testUserId}/${fileName}`;
    
    await supabase.storage.from('documents').upload(storagePath, fileBuffer, {
      contentType: 'application/pdf'
    });
    
    testDocs.push({ name: fileName, path: storagePath, size: fileBuffer.length });
  }

  // Create report
  const { data: report } = await supabase
    .from('reports')
    .insert({
      user_id: testUserId,
      company_name: 'Automated Test Company',
      report_status: 'processing',
      processing_started_at: new Date().toISOString()
    })
    .select()
    .single();

  // Create document records
  const documentRecords = testDocs.map(doc => ({
    report_id: report.id,
    user_id: testUserId,
    file_name: doc.name,
    file_path: doc.path,
    file_size: doc.size,
    mime_type: 'application/pdf',
    upload_status: 'completed'
  }));

  await supabase.from('documents').insert(documentRecords);

  console.log('Report ID:', report.id);
  console.log('URL: https://business-valuation-app.vercel.app/dashboard/reports/' + report.id);
  
  return report.id;
}

createTestReport().catch(console.error);
