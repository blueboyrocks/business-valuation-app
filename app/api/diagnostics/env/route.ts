import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    openai_key_exists: !!process.env.OPENAI_API_KEY,
    openai_key_length: process.env.OPENAI_API_KEY?.length || 0,
    openai_key_prefix: process.env.OPENAI_API_KEY?.substring(0, 20) || 'missing',
    assistant_id_exists: !!process.env.OPENAI_ASSISTANT_ID,
    assistant_id: process.env.OPENAI_ASSISTANT_ID || 'missing',
    supabase_url_exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabase_key_exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    node_env: process.env.NODE_ENV,
  });
}
