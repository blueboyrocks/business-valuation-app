import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const assistantId = process.env.OPENAI_ASSISTANT_ID;

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'OPENAI_API_KEY not configured',
        details: 'The OpenAI API key is missing from environment variables',
      }, { status: 500 });
    }

    if (!assistantId) {
      return NextResponse.json({
        success: false,
        error: 'OPENAI_ASSISTANT_ID not configured',
        details: 'The OpenAI Assistant ID is missing from environment variables',
      }, { status: 500 });
    }

    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey });

    try {
      const assistant = await openai.beta.assistants.retrieve(assistantId);

      return NextResponse.json({
        success: true,
        message: 'OpenAI connection successful',
        assistant: {
          id: assistant.id,
          name: assistant.name,
          model: assistant.model,
          created_at: assistant.created_at,
        },
      });
    } catch (error: any) {
      if (error.status === 404) {
        return NextResponse.json({
          success: false,
          error: 'Assistant not found',
          details: `Assistant ID ${assistantId} does not exist or you don't have access to it`,
          assistantId,
        }, { status: 404 });
      }

      if (error.status === 401) {
        return NextResponse.json({
          success: false,
          error: 'Invalid API key',
          details: 'The OpenAI API key is invalid or has been revoked',
        }, { status: 401 });
      }

      throw error;
    }
  } catch (error: any) {
    console.error('OpenAI test error:', error);
    return NextResponse.json({
      success: false,
      error: 'OpenAI connection failed',
      details: error.message || 'Unknown error',
      stack: error.stack,
    }, { status: 500 });
  }
}
