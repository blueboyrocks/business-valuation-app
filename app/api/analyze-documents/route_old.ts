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
  console.log('🔬 [ANALYZE] Starting analysis request');
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.log('❌ [ANALYZE] Missing auth header');
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    console.log('🔑 [ANALYZE] Auth header present');
    const token = authHeader.replace('Bearer ', '');

    const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    console.log('🔍 [ANALYZE] Getting user from token...');
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();

    if (authError || !user) {
      console.log('❌ [ANALYZE] Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(`✓ [ANALYZE] User authenticated: ${user.id}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await request.json() as AnalysisRequest;
    const { reportId } = body;

    console.log(`📋 [ANALYZE] Report ID: ${reportId}`);

    if (!reportId) {
      console.log('❌ [ANALYZE] Missing report ID');
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    console.log('🔍 [ANALYZE] Fetching report from database...');
    console.log('   Looking for reportId:', reportId);
    console.log('   For user_id:', user.id);

    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .maybeSingle();

    console.log('   Query result:', { hasReport: !!report, reportError });

    if (reportError) {
      console.log('❌ [ANALYZE] Database error:', reportError);
      return NextResponse.json(
        { error: 'Database error', details: reportError.message },
        { status: 500 }
      );
    }

    if (!report) {
      console.log('❌ [ANALYZE] Report not found - checking if report exists at all...');
      const { data: anyReport } = await supabase
        .from('reports')
        .select('id, user_id')
        .eq('id', reportId)
        .maybeSingle();

      console.log('   Report with any user:', anyReport);

      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    console.log(`✓ [ANALYZE] Report found: ${report.company_name}`);

    const typedReport = report as Report;

    console.log('🔍 [ANALYZE] Fetching documents for report...');
    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select('*')
      .eq('report_id', reportId)
      .eq('user_id', user.id);

    if (documentsError || !documents || documents.length === 0) {
      console.log('❌ [ANALYZE] No documents found:', documentsError);
      return NextResponse.json(
        { error: 'No documents found for this report' },
        { status: 404 }
      );
    }

    console.log(`✓ [ANALYZE] Found ${documents.length} documents`);

    console.log('📝 [ANALYZE] Updating report status to processing...');
    const { error: updateError } = await supabase
      .from('reports')
      .update({
        report_status: 'processing',
        processing_started_at: new Date().toISOString(),
      } as any)
      .eq('id', reportId);

    if (updateError) {
      console.error('❌ [ANALYZE] Error updating report status:', updateError);
    } else {
      console.log(`✓ [ANALYZE] Report ${reportId} status updated to processing`);
    }

    console.log('🚀 [ANALYZE] Starting async processing...');
    processAnalysisAsync(reportId, documents, typedReport.company_name, user.id);

    console.log('✅ [ANALYZE] Returning success response');
    return NextResponse.json({
      success: true,
      message: 'Analysis started',
      reportId,
    });
  } catch (error) {
    console.error('Error in analyze-documents route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processAnalysisAsync(
  reportId: string,
  documents: Document[],
  companyName: string,
  userId: string
) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log(`Starting analysis for report ${reportId}, company: ${companyName}`);
    console.log(`Processing ${documents.length} documents`);

    const openai = getOpenAIClient();
    const assistantId = getAssistantId();
    console.log(`Using OpenAI Assistant: ${assistantId}`);

    const fileIds: string[] = [];

    for (const doc of documents) {
      const { data: fileData } = await supabase.storage
        .from('documents')
        .download(doc.file_path);

      if (!fileData) {
        throw new Error(`Failed to download file: ${doc.file_name}`);
      }

      const fileBlob = fileData;
      console.log(`  Uploading ${doc.file_name} via fetch...`);
      
      // Convert Blob to Buffer
      const buffer = Buffer.from(await fileBlob.arrayBuffer());
      
      // Use raw fetch API (same as curl which works)
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
        console.error(`File upload failed: ${response.status} - ${errorText}`);
        throw new Error(`File upload failed: ${response.status} - ${errorText}`);
      }
      
      const uploadedFile = await response.json();
      console.log(`✅ Uploaded file to OpenAI: ${doc.file_name} (ID: ${uploadedFile.id})`);
      fileIds.push(uploadedFile.id);
    }

    console.log(`All ${fileIds.length} files uploaded to OpenAI`);

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

    if (fileIds.length > maxAttachmentsPerMessage) {
      console.log(`Uploading remaining ${fileIds.length - maxAttachmentsPerMessage} files in additional message...`);
      await openai.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: 'Additional documents for analysis:',
        attachments: fileIds.slice(maxAttachmentsPerMessage).map(id => ({
          file_id: id,
          tools: [{ type: 'file_search' }],
        })),
      });
    }

    console.log(`Created thread: ${thread.id}`);

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
    });

    console.log(`Started run: ${run.id}, initial status: ${run.status}`);

    let runStatus = await openai.beta.threads.runs.retrieve(run.id, { thread_id: thread.id });
    let attempts = 0;
    const maxAttempts = 120;

    console.log('Polling for run completion...');

    while (
      runStatus.status === 'queued' ||
      runStatus.status === 'in_progress' ||
      runStatus.status === 'requires_action'
    ) {
      if (attempts >= maxAttempts) {
        throw new Error('Analysis timeout: exceeded maximum wait time');
      }

      if (runStatus.status === 'requires_action' && runStatus.required_action?.type === 'submit_tool_outputs') {
        const toolCalls = runStatus.required_action.submit_tool_outputs.tool_calls;

        const toolOutputs = toolCalls.map(toolCall => {
          if (
            toolCall.function.name === 'generate_comprehensive_valuation_analysis' ||
            toolCall.function.name === 'generate_enhanced_valuation_analysis'
          ) {
            return {
              tool_call_id: toolCall.id,
              output: JSON.stringify({ success: true }),
            };
          }
          return {
            tool_call_id: toolCall.id,
            output: JSON.stringify({ error: 'Unknown function' }),
          };
        });

        await openai.beta.threads.runs.submitToolOutputs(run.id, {
          thread_id: thread.id,
          tool_outputs: toolOutputs,
        });
      }

      await new Promise(resolve => setTimeout(resolve, 10000));
      runStatus = await openai.beta.threads.runs.retrieve(run.id, { thread_id: thread.id });
      attempts++;

      if (attempts % 6 === 0) {
        console.log(`Still processing... Status: ${runStatus.status}, Attempt ${attempts}/${maxAttempts}`);
      }
    }

    console.log(`Run completed with status: ${runStatus.status}`);

    if (runStatus.status === 'failed') {
      throw new Error(`Analysis failed: ${runStatus.last_error?.message || 'Unknown error'}`);
    }

    const messages = await openai.beta.threads.messages.list(thread.id);
    const assistantMessages = messages.data.filter(msg => msg.role === 'assistant');

    let analysisData: any = null;
    let executiveSummary = '';
    let valuationAmount: number | null = null;
    let valuationMethod: string | null = null;

    if (assistantMessages.length > 0) {
      const lastMessage = assistantMessages[0];

      for (const content of lastMessage.content) {
        if (content.type === 'text') {
          const textContent = content.text.value;

          const jsonMatch = textContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              analysisData = JSON.parse(jsonMatch[0]);

              if (analysisData.executive_summary) {
                executiveSummary = analysisData.executive_summary;
              }
              if (analysisData.valuation_summary?.estimated_value) {
                valuationAmount = analysisData.valuation_summary.estimated_value;
              }
              if (analysisData.valuation_summary?.primary_method) {
                valuationMethod = analysisData.valuation_summary.primary_method;
              }
            } catch (parseError) {
              console.error('Error parsing JSON from assistant message:', parseError);
            }
          }

          if (!executiveSummary && textContent.length > 50) {
            executiveSummary = textContent.substring(0, 500);
          }
        }
      }
    }

    console.log(`Saving report results for ${reportId}`);
    console.log(`Valuation amount: ${valuationAmount}, Method: ${valuationMethod}`);

    const { error: saveError } = await supabase
      .from('reports')
      .update({
        report_status: 'completed',
        report_data: analysisData,
        executive_summary: executiveSummary || 'Analysis completed successfully.',
        valuation_amount: valuationAmount,
        valuation_method: valuationMethod || 'Comprehensive Analysis',
        processing_completed_at: new Date().toISOString(),
      } as any)
      .eq('id', reportId);

    if (saveError) {
      console.error('Error saving report results:', saveError);
      throw saveError;
    }

    console.log(`Report ${reportId} completed successfully!`);

    for (const fileId of fileIds) {
      try {
        await openai.files.delete(fileId);
      } catch (deleteError) {
        console.error(`Error deleting file ${fileId}:`, deleteError);
      }
    }
  } catch (error) {
    console.error('❌ Error processing analysis:', error);
    console.error('Error details:', error instanceof Error ? error.stack : error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.log(`Marking report ${reportId} as failed with message: ${errorMessage}`);

    await supabase
      .from('reports')
      .update({
        report_status: 'failed',
        error_message: errorMessage,
        processing_completed_at: new Date().toISOString(),
      } as any)
      .eq('id', reportId);
  }
}
