import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase credentials missing',
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
      });
    }

    console.log('Testing Supabase connection...');
    console.log('URL:', supabaseUrl);

    const supabase = createClient(supabaseUrl, supabaseKey);

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout after 10 seconds')), 10000)
    );

    const query = supabase
      .from('reports')
      .select('id')
      .limit(1);

    const { data, error } = await Promise.race([
      query,
      timeout
    ]) as any;

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Database query failed',
        details: error.message,
        code: error.code,
        hint: error.hint,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase connection working',
      recordsFound: data?.length || 0,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Connection test failed',
      stack: error.stack,
    });
  }
}
