import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: {},
    supabase: {},
    storage: {},
  };

  try {
    diagnostics.environment.supabaseUrl = supabaseUrl ? '✓ Set' : '✗ Missing';
    diagnostics.environment.supabaseAnonKey = supabaseAnonKey ? '✓ Set' : '✗ Missing';

    const authHeader = request.headers.get('authorization');
    diagnostics.auth = {
      headerPresent: !!authHeader,
    };

    if (!authHeader) {
      return NextResponse.json({
        ...diagnostics,
        error: 'Missing authorization header. Please login first.',
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      diagnostics.supabase.authError = authError?.message || 'No user';
      return NextResponse.json({
        ...diagnostics,
        error: 'Authentication failed',
      });
    }

    diagnostics.supabase.user = {
      id: user.id,
      email: user.email,
    };

    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    diagnostics.storage.listBuckets = {
      success: !bucketsError,
      error: bucketsError?.message,
      buckets: buckets?.map(b => ({ id: b.id, name: b.name, public: b.public })),
    };

    const testFileName = `test-${Date.now()}.txt`;
    const testFilePath = `${user.id}/${testFileName}`;
    const testContent = new Blob(['Test upload content'], { type: 'text/plain' });

    console.log(`Testing upload: ${testFilePath}`);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(testFilePath, testContent, {
        contentType: 'text/plain',
        upsert: false,
      });

    diagnostics.storage.testUpload = {
      success: !uploadError,
      error: uploadError?.message,
      errorDetails: uploadError,
      path: testFilePath,
      uploadData: uploadData,
    };

    if (!uploadError && uploadData) {
      console.log('Test upload successful, cleaning up...');
      await supabase.storage.from('documents').remove([testFilePath]);
      diagnostics.storage.cleanup = 'Success';
    }

    return NextResponse.json({
      ...diagnostics,
      status: uploadError ? 'FAILED' : 'SUCCESS',
    });
  } catch (error: any) {
    return NextResponse.json({
      ...diagnostics,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
