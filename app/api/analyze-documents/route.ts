import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getOpenAIClient, getAssistantId } from '@/lib/openai/client';
import { Database } from '@/lib/supabase/types';
import FormData from 'form-data';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Report = Database['public']['Tables']['reports']['Row'];
type Document = Database['public']['Tables']['documents']['Row'];

interface AnalysisRequest {
  reportId: string;
}

export async function POST(request: NextRequest) {
  console.log('🔬 [ANALYZE-V2] Starting analysis request');
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const { data: { user }, error: authError } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json() as AnalysisRequest;
    const { reportId } = body;

    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (reportError || !report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select('*')
      .eq('report_id', reportId)
      .eq('user_id', user.id);

    if (documentsError || !documents || documents.length === 0) {
      return NextResponse.json(
        { error: 'No documents found for this report' },
        { status: 404 }
      );
    }

    console.log(`✓ [ANALYZE-V2] Found ${documents.length} documents`);

    // Update report status to processing
    await supabase
      .from('reports')
      .update({
        report_status: 'processing',
        processing_started_at: new Date().toISOString(),
      } as any)
      .eq('id', reportId);

    // NOTE: OpenAI processing is now triggered by the frontend calling /api/reports/[id]/process
    // This avoids Vercel serverless timeout issues with long-running background tasks

    return NextResponse.json({
      success: true,
      message: 'Analysis started. Use /api/reports/[id]/status to check progress.',
      reportId,
    });
  } catch (error) {
    console.error('Error in analyze-documents-v2 route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function startOpenAIProcessing(
  reportId: string,
  documents: Document[],
  companyName: string,
  userId: string
) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Immediately write to database to confirm function is called
  await supabase
    .from('reports')
    .update({
      report_data: { debug: 'startOpenAIProcessing called', timestamp: new Date().toISOString() } as any,
    } as any)
    .eq('id', reportId);

  try {
    console.log(`[ASYNC] Starting OpenAI processing for report ${reportId}`);
    console.log(`[ASYNC] Company: ${companyName}, Documents: ${documents.length}`);
    
    // Check environment variables
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    if (!process.env.OPENAI_ASSISTANT_ID) {
      throw new Error('OPENAI_ASSISTANT_ID environment variable is not set');
    }
    
    console.log(`[ASYNC] API Key length: ${process.env.OPENAI_API_KEY.length}`);
    console.log(`[ASYNC] Assistant ID: ${process.env.OPENAI_ASSISTANT_ID}`);
    
    const openai = getOpenAIClient();
    const assistantId = getAssistantId();

    // Upload files to OpenAI
    await supabase.from('reports').update({ report_data: { debug: 'Starting file uploads', documentCount: documents.length, timestamp: new Date().toISOString() } as any } as any).eq('id', reportId);
    const fileIds: string[] = [];
    for (const doc of documents) {
      const { data: fileData } = await supabase.storage
        .from('documents')
        .download(doc.file_path);

      if (!fileData) {
        throw new Error(`Failed to download file: ${doc.file_name}`);
      }

      const buffer = Buffer.from(await fileData.arrayBuffer());
      const formData = new FormData();
      formData.append('file', buffer, {
        filename: doc.file_name,
        contentType: doc.mime_type || 'application/pdf'
      });
      formData.append('purpose', 'assistants');
      
      const response = await fetch('https://api.openai.com/v1/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2',
          ...formData.getHeaders()
        },
        body: formData as any
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ASYNC] ❌ File upload failed (${response.status}):`, errorText);
        throw new Error(`File upload failed: ${response.status} - ${errorText}`);
      }
      
      const uploadedFile = await response.json();
      console.log(`[ASYNC] ✅ Uploaded: ${doc.file_name} -> ${uploadedFile.id}`);
      fileIds.push(uploadedFile.id);
    }

    // Create thread with files
    await supabase.from('reports').update({ report_data: { debug: 'Files uploaded successfully', fileCount: fileIds.length, timestamp: new Date().toISOString() } as any } as any).eq('id', reportId);
    const maxAttachmentsPerMessage = 10;
    const thread = await openai.beta.threads.create({
      messages: [
        {
          role: 'user',
          content: `Please analyze the uploaded financial documents using the generate_enhanced_valuation_analysis function. Company: ${companyName}`,
          attachments: fileIds.slice(0, maxAttachmentsPerMessage).map(id => ({
            file_id: id,
            tools: [{ type: 'file_search' }],
          })),
        },
      ],
    });

    await supabase.from('reports').update({ report_data: { debug: 'Thread created', threadId: thread.id, timestamp: new Date().toISOString() } as any } as any).eq('id', reportId);

    if (fileIds.length > maxAttachmentsPerMessage) {
      await openai.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: 'Additional documents for analysis:',
        attachments: fileIds.slice(maxAttachmentsPerMessage).map(id => ({
          file_id: id,
          tools: [{ type: 'file_search' }],
        })),
      });
    }

    console.log(`[ASYNC] Created thread: ${thread.id}`);

    // Start the run
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
    });

    console.log(`[ASYNC] Started run: ${run.id}`);

    // CRITICAL: Store the thread and run IDs immediately
    await supabase
      .from('reports')
      .update({
        report_data: {
          openai_thread_id: thread.id,
          openai_run_id: run.id,
          openai_file_ids: fileIds,
          processing_started: new Date().toISOString(),
        }
      } as any)
      .eq('id', reportId);

    console.log(`[ASYNC] Stored OpenAI IDs in database. Processing will continue via polling endpoint.`);

  } catch (error) {
    console.error(`[ASYNC] ❌ CRITICAL ERROR in OpenAI processing:`, error);
    console.error(`[ASYNC] Error stack:`, error instanceof Error ? error.stack : 'No stack');
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    await supabase
      .from('reports')
      .update({
        report_status: 'failed',
        error_message: `Processing failed: ${errorMessage}`,
        report_data: {
          error: errorMessage,
          error_stack: error instanceof Error ? error.stack : undefined,
          failed_at: new Date().toISOString(),
        }
      } as any)
      .eq('id', reportId);
    
    console.log(`[ASYNC] Report ${reportId} marked as failed in database`);
  }
}
