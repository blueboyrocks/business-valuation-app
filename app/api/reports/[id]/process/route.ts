import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getOpenAIClient } from '@/lib/openai/client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * This endpoint checks the OpenAI run status and processes tool calls if needed.
 * It should be called repeatedly by the frontend until the report is completed.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const reportId = params.id;
  console.log(`[PROCESS] Checking report ${reportId}`);

  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the report
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // If already completed or failed, return status
    if (report.report_status === 'completed' || report.report_status === 'failed') {
      return NextResponse.json({
        status: report.report_status,
        message: report.report_status === 'completed' ? 'Analysis complete' : 'Analysis failed',
        error: report.error_message,
      });
    }

    // Check if we have OpenAI IDs
    const reportData = report.report_data as any;
    if (!reportData?.openai_thread_id || !reportData?.openai_run_id) {
      console.log(`[PROCESS] No OpenAI IDs found, starting initialization for report ${reportId}`);
      
      // Start the OpenAI processing
      try {
        await startOpenAIProcessing(reportId, report.company_name, user.id, supabase);
        return NextResponse.json({
          status: 'processing',
          message: 'OpenAI processing started',
          progress: 10,
        });
      } catch (error: any) {
        console.error(`[PROCESS] Failed to start OpenAI processing:`, error);
        await supabase
          .from('reports')
          .update({
            report_status: 'failed',
            error_message: `Failed to start OpenAI processing: ${error.message}`,
          } as any)
          .eq('id', reportId);
        return NextResponse.json({
          status: 'failed',
          error: error.message,
        });
      }
    }

    const threadId = reportData.openai_thread_id;
    const runId = reportData.openai_run_id;

    console.log(`[PROCESS] Checking OpenAI run ${runId} in thread ${threadId}`);

    try {
      const openai = getOpenAIClient();
      const run = await openai.beta.threads.runs.retrieve(runId, { thread_id: threadId });

      console.log(`[PROCESS] Run status: ${run.status}`);

      // Handle different run statuses
    if (run.status === 'completed') {
      // Get the messages from the thread
      const messages = await openai.beta.threads.messages.list(threadId);
      const assistantMessages = messages.data.filter(m => m.role === 'assistant');
      
      let analysisText = '';
      if (assistantMessages.length > 0) {
        const lastMessage = assistantMessages[0];
        const textContent = lastMessage.content.find(c => c.type === 'text');
        if (textContent && 'text' in textContent) {
          analysisText = textContent.text.value;
        }
      }

      // Update report as completed
      // Preserve existing report_data if it exists (from tool calls)
      const updatePayload: any = {
        report_status: 'completed',
        processing_completed_at: new Date().toISOString(),
      };
      
      // Only update report_data if it doesn't already have valuation data
      if (!reportData.report_data || !reportData.report_data.valuation_summary) {
        updatePayload.report_data = {
          ...reportData,
          full_analysis: analysisText,
          completed_at: new Date().toISOString(),
        };
        updatePayload.executive_summary = analysisText.substring(0, 5000);
      }
      
      console.log(`[PROCESS] Marking report as completed`);
      await supabase
        .from('reports')
        .update(updatePayload)
        .eq('id', reportId);

      // Clean up OpenAI files
      if (reportData.openai_file_ids) {
        for (const fileId of reportData.openai_file_ids) {
          try {
            await openai.files.delete(fileId);
          } catch (e) {
            console.log(`[PROCESS] Could not delete file ${fileId}`);
          }
        }
      }

      return NextResponse.json({
        status: 'completed',
        message: 'Analysis complete!',
        progress: 100,
      });
    }

    if (run.status === 'requires_action') {
      console.log(`[PROCESS] Run requires action`);
      
      if (run.required_action?.type === 'submit_tool_outputs') {
        const toolCalls = run.required_action.submit_tool_outputs.tool_calls;
        console.log(`[PROCESS] Submitting outputs for ${toolCalls.length} tool calls`);

        // Process each tool call and extract valuation data
        const toolOutputs = [];
        for (const toolCall of toolCalls) {
          console.log(`[PROCESS] Tool call: ${toolCall.function.name}`);
          console.log(`[PROCESS] Tool arguments length: ${toolCall.function.arguments.length} characters`);
          
          // Log first and last 500 characters to identify malformation
          const args = toolCall.function.arguments;
          console.log(`[PROCESS] Arguments start: ${args.substring(0, 500)}`);
          console.log(`[PROCESS] Arguments end: ${args.substring(args.length - 500)}`);
          
          // Check for common JSON issues
          const braceCount = (args.match(/{/g) || []).length;
          const closeBraceCount = (args.match(/}/g) || []).length;
          console.log(`[PROCESS] Brace count: ${braceCount} open, ${closeBraceCount} close`);
          
          try {
            // Clean and parse JSON - handle cases where there's extra text after the JSON
            let jsonString = toolCall.function.arguments.trim();
            
            // Try to find the last closing brace and extract only the JSON part
            const lastBraceIndex = jsonString.lastIndexOf('}');
            if (lastBraceIndex !== -1 && lastBraceIndex < jsonString.length - 1) {
              console.log(`[PROCESS] Detected extra content after JSON, truncating...`);
              jsonString = jsonString.substring(0, lastBraceIndex + 1);
            }
            
            const args = JSON.parse(jsonString);
            
            // Save the complete valuation report data to the database
            console.log(`[PROCESS] Saving complete valuation data...`);
            
            // Extract key fields from the new simplified schema
            const valuationAmount = args.valuation_amount || null;
            const valuationMethod = args.valuation_method || 'Not specified';         
            // Update the report with extracted data
            // Only update fields that exist in the database schema
            const { data: updateData, error: updateError } = await supabase
              .from('reports')
              .update({
                valuation_amount: valuationAmount,
                valuation_method: valuationMethod,
                report_data: args,  // Store the complete report structure in JSONB
                executive_summary: args.executive_summary || null,
                report_status: 'processing',  // Keep as processing until run completes
              })
              .eq('id', reportId)
              .select();
            
            if (updateError) {
              console.error(`[PROCESS] Database update error:`, updateError);
              throw new Error(`Database update failed: ${updateError.message}`);
            }
            
            console.log(`[PROCESS] Database update successful:`, updateData);
            
            console.log(`[PROCESS] Complete valuation data saved successfully`);
            console.log(`[PROCESS] Valuation amount: ${valuationAmount}`);
            console.log(`[PROCESS] Valuation method: ${valuationMethod}`);
            
            
            toolOutputs.push({
              tool_call_id: toolCall.id,
              output: JSON.stringify({ success: true, message: 'Data saved successfully' }),
            });
          } catch (e) {
            console.error(`[PROCESS] Error processing tool call:`, e);
            toolOutputs.push({
              tool_call_id: toolCall.id,
              output: JSON.stringify({ success: false, error: String(e) }),
            });
          }
        }

        // Re-fetch the run to check if it's still in requires_action status
        const currentRun = await openai.beta.threads.runs.retrieve(threadId, runId);
        
        if (currentRun.status === 'requires_action') {
          await openai.beta.threads.runs.submitToolOutputs(runId, {
            thread_id: threadId,
            tool_outputs: toolOutputs,
          });
          console.log(`[PROCESS] Tool outputs submitted successfully`);
        } else {
          console.log(`[PROCESS] Run status changed to ${currentRun.status}, skipping tool output submission`);
        }

        return NextResponse.json({
          status: 'processing',
          message: 'Processing tool outputs...',
          progress: 90,
        });
      }
    }

    if (run.status === 'failed' || run.status === 'expired' || run.status === 'cancelled') {
      await supabase
        .from('reports')
        .update({
          report_status: 'failed',
          error_message: run.last_error?.message || `Run ${run.status}`,
        } as any)
        .eq('id', reportId);

      return NextResponse.json({
        status: 'failed',
        message: run.last_error?.message || `Analysis ${run.status}`,
        error: run.last_error,
      });
    }

    // Still in progress
    const progress = run.status === 'queued' ? 10 : 50;
    return NextResponse.json({
      status: 'processing',
      message: `Analysis ${run.status}...`,
      progress,
    });

    } catch (openaiError) {
      console.error(`[PROCESS] Error calling OpenAI API:`, openaiError);
      return NextResponse.json({
        status: 'processing',
        message: 'Temporary error checking status, will retry...',
        progress: report.report_status === 'processing' ? 50 : 5,
      });
    }

  } catch (error) {
    console.error('[PROCESS] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

async function startOpenAIProcessing(
  reportId: string,
  companyName: string,
  userId: string,
  supabase: any
) {
  console.log(`[START_PROCESSING] Initializing OpenAI for report ${reportId}`);
  
  // Get documents for this report
  const { data: documents, error: docsError } = await supabase
    .from('documents')
    .select('*')
    .eq('report_id', reportId);
  
  if (docsError || !documents || documents.length === 0) {
    throw new Error('No documents found for this report');
  }
  
  console.log(`[START_PROCESSING] Found ${documents.length} documents`);
  
  // Import necessary modules
  const { getOpenAIClient } = require('@/lib/openai/client');
  const { getAssistantId } = require('@/lib/openai/client');
  
  const openai = getOpenAIClient();
  const assistantId = getAssistantId();
  
  // Upload files to OpenAI using SDK
  const fileIds: string[] = [];
  for (const doc of documents) {
    const { data: fileData } = await supabase.storage
      .from('documents')
      .download(doc.file_path);
    
    if (!fileData) {
      throw new Error(`Failed to download file: ${doc.file_name}`);
    }
    
    const buffer = Buffer.from(await fileData.arrayBuffer());
    
    console.log(`[START_PROCESSING] Uploading ${doc.file_name} (${buffer.length} bytes)...`);
    
    // Create a Blob with the correct type
    const blob = new Blob([buffer], { type: doc.mime_type || 'application/pdf' });
    
    // Create a File-like object that OpenAI SDK expects
    const fileToUpload = Object.assign(blob, {
      name: doc.file_name,
      lastModified: Date.now()
    });
    
    const uploadedFile = await openai.files.create({
      file: fileToUpload as any,
      purpose: 'assistants'
    });
    
    console.log(`[START_PROCESSING] Uploaded: ${doc.file_name} -> ${uploadedFile.id}`);
    fileIds.push(uploadedFile.id);
  }
  
  console.log(`[START_PROCESSING] All ${fileIds.length} files uploaded successfully`);
  
  // Create thread with files
  const maxAttachmentsPerMessage = 10;
  const thread = await openai.beta.threads.create({
    messages: [
      {
        role: 'user',
        content: `Please analyze the uploaded financial documents using the generate_comprehensive_valuation_report function. Company: ${companyName}`,
        attachments: fileIds.slice(0, maxAttachmentsPerMessage).map((id: string) => ({
          file_id: id,
          tools: [{ type: 'file_search' }],
        })),
      },
    ],
  });
  
  if (fileIds.length > maxAttachmentsPerMessage) {
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: 'Additional documents for analysis:',
      attachments: fileIds.slice(maxAttachmentsPerMessage).map((id: string) => ({
        file_id: id,
        tools: [{ type: 'file_search' }],
      })),
    });
  }
  
  console.log(`[START_PROCESSING] Created thread: ${thread.id}`);
  
  // Start the run
  const run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id: assistantId,
  });
  
  console.log(`[START_PROCESSING] Started run: ${run.id}`);
  
  // Store the thread and run IDs
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
  
  console.log(`[START_PROCESSING] Stored OpenAI IDs in database`);
}
