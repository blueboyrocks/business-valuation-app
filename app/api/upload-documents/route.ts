import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;


export async function POST(request: NextRequest) {
  console.log('📥 Upload request received');

  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.error('❌ Missing authorization header');
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔑 Using user auth token for upload');

    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    let userId: string;
    try {
      const jwt = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      userId = jwt.sub;
      console.log(`✓ Authenticated user: ${userId}`);
    } catch (e) {
      console.error('❌ Invalid token');
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const companyName = formData.get('companyName') as string;
    const files = formData.getAll('files') as File[];

    if (!companyName || !companyName.trim()) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'At least one file is required' },
        { status: 400 }
      );
    }

    if (files.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 files allowed per upload' },
        { status: 400 }
      );
    }

    for (const file of files) {
      if (file.type !== 'application/pdf') {
        return NextResponse.json(
          { error: 'Only PDF files are allowed' },
          { status: 400 }
        );
      }

      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds 10MB size limit` },
          { status: 400 }
        );
      }
    }

    console.log(`📤 Starting upload of ${files.length} files for company: ${companyName}`);
    const uploadedDocuments: any[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`📄 Processing file ${i + 1}/${files.length}: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const fileName = `${timestamp}-${randomString}-${file.name}`;
      const filePath = `${userId}/${fileName}`;

      console.log(`   Uploading to Supabase Storage...`);
      const uploadStartTime = Date.now();

      const arrayBuffer = await file.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);

      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

      const uploadPromise = supabaseAdmin.storage
        .from('documents')
        .upload(filePath, fileBuffer, {
          contentType: file.type,
          upsert: false,
        });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Upload timeout after 30s')), 30000)
      );

      const { data: uploadData, error: uploadError } = await Promise.race([uploadPromise, timeoutPromise]);
      const uploadDuration = ((Date.now() - uploadStartTime) / 1000).toFixed(2);

      if (uploadError) {
        console.error('❌ Error uploading file:', uploadError);
        console.error('   Error details:', JSON.stringify(uploadError, null, 2));
        return NextResponse.json(
          { error: `Failed to upload file ${file.name}: ${uploadError.message}` },
          { status: 500 }
        );
      }

      console.log(`   ✓ File uploaded successfully in ${uploadDuration}s`);

      console.log(`   Creating database record...`);
      const { data: documentData, error: documentError } = await supabase
        .from('documents')
        .insert({
          user_id: userId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          company_name: companyName,
          upload_status: 'completed',
        } as any)
        .select()
        .single();

      if (documentError) {
        console.error('❌ Error creating document record:', documentError);
        return NextResponse.json(
          { error: 'Failed to create document record' },
          { status: 500 }
        );
      }

      console.log(`   ✓ Database record created`);
      uploadedDocuments.push(documentData);
    }

    console.log(`✅ All ${files.length} files uploaded successfully`);

    console.log(`Creating report with user_id: ${userId}, company: ${companyName}`);

    const { data: reportData, error: reportError } = await supabase
      .from('reports')
      .insert({
        user_id: userId,
        company_name: companyName,
        report_status: 'pending',
        document_id: uploadedDocuments[0]?.id || null,
      } as any)
      .select()
      .single();

    if (reportError) {
      console.error('❌ Error creating report:', reportError);
      return NextResponse.json(
        { error: 'Failed to create report record' },
        { status: 500 }
      );
    }

    console.log(`✅ Report created with ID: ${(reportData as any).id}, user_id: ${(reportData as any).user_id}`);

    console.log(`Linking ${uploadedDocuments.length} documents to report...`);
    const reportId = (reportData as any).id;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    for (const doc of uploadedDocuments) {
      const { error: linkError } = await supabaseAdmin
        .from('documents')
        .update({ report_id: reportId } as any)
        .eq('id', doc.id);

      if (linkError) {
        console.error(`❌ Error linking document ${doc.id}:`, linkError);
      } else {
        console.log(`   ✓ Linked document ${doc.file_name}`);
      }
    }

    console.log(`✅ All documents linked to report ${reportId}`);

    return NextResponse.json({
      success: true,
      reportId: reportId,
      documents: uploadedDocuments,
    });
  } catch (error) {
    console.error('Error in upload-documents route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
