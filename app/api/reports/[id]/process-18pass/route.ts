import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';
import OpenAI from 'openai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID!;

// 18-Pass Architecture (Pass 0 + 17 passes)
// Pass 0: Company Research
// Phase 1: Data Extraction (Passes 1-5)
// Phase 2: Narrative Generation (Passes 6-17)

const PASS_CONFIG = [
  // Pass 0: Research
  { pass: 0, name: 'research_company_background', description: 'Researching company background...', progress: 3 },
  
  // Phase 1: Data Extraction
  { pass: 1, name: 'extract_core_company_data', description: 'Extracting core company data...', progress: 8 },
  { pass: 2, name: 'extract_income_statement_details', description: 'Extracting income statement...', progress: 13 },
  { pass: 3, name: 'extract_balance_sheet_details', description: 'Extracting balance sheet...', progress: 18 },
  { pass: 4, name: 'extract_special_items', description: 'Extracting special items...', progress: 23 },
  { pass: 5, name: 'extract_business_metrics', description: 'Extracting business metrics...', progress: 28 },
  
  // Phase 2: Narrative Generation
  { pass: 6, name: 'write_executive_summary', description: 'Writing executive summary...', progress: 34 },
  { pass: 7, name: 'write_company_profile', description: 'Writing company profile...', progress: 40 },
  { pass: 8, name: 'write_industry_analysis', description: 'Writing industry analysis...', progress: 46 },
  { pass: 9, name: 'write_financial_analysis', description: 'Writing financial analysis...', progress: 52 },
  { pass: 10, name: 'write_asset_approach_analysis', description: 'Writing asset approach analysis...', progress: 58 },
  { pass: 11, name: 'write_income_approach_analysis', description: 'Writing income approach analysis...', progress: 64 },
  { pass: 12, name: 'write_market_approach_analysis', description: 'Writing market approach analysis...', progress: 70 },
  { pass: 13, name: 'write_risk_assessment', description: 'Writing risk assessment...', progress: 76 },
  { pass: 14, name: 'write_strategic_insights', description: 'Writing strategic insights...', progress: 82 },
  { pass: 15, name: 'write_valuation_reconciliation', description: 'Writing valuation reconciliation...', progress: 88 },
  { pass: 16, name: 'write_discounts_and_premiums', description: 'Writing discounts and premiums...', progress: 94 },
  { pass: 17, name: 'write_assumptions_and_limiting_conditions', description: 'Writing assumptions...', progress: 98 },
];

// Health check endpoint
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json({ 
    endpoint: 'process-18pass',
    reportId: params.id,
    status: 'ready',
    timestamp: new Date().toISOString()
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const reportId = params.id;
  console.log(`[18-PASS] ========================================`);
  console.log(`[18-PASS] POST request received for report: ${reportId}`);
  console.log(`[18-PASS] Timestamp: ${new Date().toISOString()}`);
  console.log(`[18-PASS] ========================================`);
  
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    console.log(`[18-PASS] Auth header present: ${!!authHeader}`);
    
    if (!authHeader) {
      console.log(`[18-PASS] ✗ Missing authorization header`);
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create Supabase client with service role
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);
    console.log(`[18-PASS] Supabase client created`);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    console.log(`[18-PASS] Auth check: user=${user?.id}, error=${authError?.message}`);

    if (authError || !user) {
      console.log(`[18-PASS] ✗ Unauthorized: ${authError?.message}`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log(`[18-PASS] ✓ Authenticated as user: ${user.id}`);


    // Get current report state
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Determine current pass (starts at -1, so first pass is 0)
    const currentPass = (report as any).current_pass !== null ? (report as any).current_pass : -1;
    
    console.log(`Report ${reportId}: current_pass=${currentPass}, status=${(report as any).report_status}`);

    // Check if current pass is running
    if (currentPass >= 0 && currentPass <= 17 && (report as any).openai_thread_id && (report as any).openai_run_id) {
      // A pass is currently running - check its status
      const passConfig = PASS_CONFIG[currentPass];
      console.log(`[18-PASS] Checking status of pass ${currentPass}: ${passConfig.name}`);
      
      const threadId = (report as any).openai_thread_id;
      const runId = (report as any).openai_run_id;
      
      console.log(`DEBUG: threadId type=${typeof threadId}, value=${JSON.stringify(threadId)}`);
      console.log(`DEBUG: runId type=${typeof runId}, value=${JSON.stringify(runId)}`);
      console.log(`DEBUG: threadId is null? ${threadId === null}`);
      console.log(`DEBUG: runId is null? ${runId === null}`);
      console.log(`DEBUG: threadId is undefined? ${threadId === undefined}`);
      console.log(`DEBUG: runId is undefined? ${runId === undefined}`);
      
      if (!threadId || threadId === null || threadId === undefined) {
        throw new Error(`Invalid thread_id: type=${typeof threadId}, value=${JSON.stringify(threadId)}`);
      }
      
      if (!runId || runId === null || runId === undefined) {
        throw new Error(`Invalid run_id: type=${typeof runId}, value=${JSON.stringify(runId)}`);
      }
      
      console.log(`Checking run ${runId} in thread ${threadId}...`);
      
      // OpenAI SDK v6+ requires: retrieve(runId, { thread_id: threadId })
      const run = await openai.beta.threads.runs.retrieve(
        runId,
        { thread_id: threadId }
      );
      
      console.log(`Run status: ${run.status}`);

      if (run.status === 'completed') {
        console.log(`Pass ${currentPass} completed!`);
        // Extract results and move to next pass
        await processPassResults(supabase, reportId, currentPass, run);
        
        const nextPass = currentPass + 1;
        
        if (nextPass > 17) {
          // All passes complete
          console.log(`All 18 passes complete for report ${reportId}, calculating final valuation...`);
          return await calculateFinalValuation(supabase, reportId);
        }
        
        // Clear thread/run IDs but keep current_pass as the last completed pass
        // Next poll will start the next pass
        await (supabase.from('reports') as any).update({
            current_pass: currentPass,  // Keep as last completed pass
            openai_thread_id: null,
            openai_run_id: null,
          } as any)
          .eq('id', reportId);

        return NextResponse.json({
          status: 'processing',
          pass: nextPass,  // Tell frontend next pass will start
          totalPasses: 18,
          progress: PASS_CONFIG[nextPass]?.progress || 100,
          message: `Pass ${currentPass}/17 complete. ${PASS_CONFIG[nextPass]?.description || 'Finalizing...'}`,
        });
      } else if (run.status === 'failed' || run.status === 'cancelled' || run.status === 'expired') {
        // Pass failed - mark report as failed
        await (supabase.from('reports') as any).update({
            report_status: 'failed',
            error_message: `Pass ${currentPass} failed: ${run.last_error?.message || 'Unknown error'}`,
          } as any)
          .eq('id', reportId);

        return NextResponse.json({
          status: 'failed',
          error: `Pass ${currentPass} failed`,
        }, { status: 500 });
      } else if (run.status === 'requires_action') {
        // Handle tool calls
        console.log(`Run requires action for pass ${currentPass}`);
        
        if (run.required_action?.type === 'submit_tool_outputs') {
          const toolCalls = run.required_action.submit_tool_outputs.tool_calls;
          console.log(`Processing ${toolCalls.length} tool calls for pass ${currentPass}`);
          const toolOutputs = [];

          for (const toolCall of toolCalls) {
            if (toolCall.type === 'function') {
              const functionName = toolCall.function.name;
              
              // Parse function arguments with error handling
              let functionArgs;
              try {
                functionArgs = JSON.parse(toolCall.function.arguments);
              } catch (parseError: any) {
                console.error(`✗ JSON parse error for ${functionName}:`, parseError.message);
                console.error(`Raw arguments (first 2000 chars):`, toolCall.function.arguments.substring(0, 2000));
                console.error(`Raw arguments (around error position 1958):`, toolCall.function.arguments.substring(1900, 2100));
                
                // Try to fix common JSON issues
                try {
                  // Remove trailing commas
                  let fixedJson = toolCall.function.arguments.replace(/,\s*([}\]])/g, '$1');
                  // Remove comments
                  fixedJson = fixedJson.replace(/\/\/.*$/gm, '');
                  fixedJson = fixedJson.replace(/\/\*[\s\S]*?\*\//g, '');
                  
                  functionArgs = JSON.parse(fixedJson);
                  console.log(`✓ JSON fixed and parsed successfully`);
                } catch (fixError: any) {
                  console.error(`✗ Could not fix JSON:`, fixError.message);
                  // Return error and skip this tool call
                  toolOutputs.push({
                    tool_call_id: toolCall.id,
                    output: JSON.stringify({ 
                      success: false, 
                      error: 'Invalid JSON in function arguments',
                      details: parseError.message 
                    }),
                  });
                  continue;
                }
              }
              
              console.log(`Tool call: ${functionName} with ${Object.keys(functionArgs).length} fields`);
              console.log(`Function arguments:`, JSON.stringify(functionArgs, null, 2));

              // Store the extracted data
              try {
                await storePassData(supabase, reportId, currentPass, functionArgs);
                console.log(`✓ Data stored for pass ${currentPass}`);
              } catch (error: any) {
                console.error(`✗ Failed to store data for pass ${currentPass}:`, error.message);
                // Continue anyway to submit tool output
              }

              toolOutputs.push({
                tool_call_id: toolCall.id,
                output: JSON.stringify({ success: true, message: 'Data stored successfully' }),
              });
            }
          }

          // Submit tool outputs with retry mechanism (race condition prevention)
          const maxRetries = 3;
          let submitSuccess = false;
          
          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            console.log(`Attempt ${attempt}/${maxRetries}: Checking run status before submitting tool outputs...`);
            
            // Re-check run status
            let freshRun;
            try {
              freshRun = await openai.beta.threads.runs.retrieve(
                (report as any).openai_run_id,
                { thread_id: (report as any).openai_thread_id }
              );
              console.log(`Run status: ${freshRun.status}`);
            } catch (error: any) {
              console.error(`Failed to check run status:`, error.message);
              throw error;
            }
            
            // If status is not requires_action, wait and retry
            if (freshRun.status !== 'requires_action') {
              console.log(`⚠️ Run status is "${freshRun.status}" (not requires_action)`);
              
              if (attempt < maxRetries) {
                const waitTime = 500 * attempt; // Exponential backoff: 500ms, 1000ms, 1500ms
                console.log(`Waiting ${waitTime}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
              } else {
                console.log('Max retries reached. Returning to let next poll handle it.');
                return NextResponse.json({
                  status: 'processing',
                  pass: currentPass,
                  message: `Run status is ${freshRun.status}, waiting for completion`
                });
              }
            }
            
            // Status is requires_action, try to submit
            console.log(`Submitting ${toolOutputs.length} tool outputs for pass ${currentPass}...`);
            
            try {
              // OpenAI SDK v6+ requires: submitToolOutputs(runId, { thread_id, tool_outputs })
              await openai.beta.threads.runs.submitToolOutputs(
                (report as any).openai_run_id,
                {
                  thread_id: (report as any).openai_thread_id,
                  tool_outputs: toolOutputs
                } as any
              );
              console.log(`✓ Tool outputs submitted successfully for pass ${currentPass}`);
              submitSuccess = true;
              break; // Success! Exit retry loop
            } catch (error: any) {
              // Check if it's the race condition error
              if (error.message && error.message.includes('do not accept tool outputs')) {
                console.error(`✗ Race condition detected: ${error.message}`);
                
                if (attempt < maxRetries) {
                  const waitTime = 500 * attempt;
                  console.log(`Waiting ${waitTime}ms before retry...`);
                  await new Promise(resolve => setTimeout(resolve, waitTime));
                  continue;
                } else {
                  console.log('Max retries reached. Returning to let next poll handle it.');
                  return NextResponse.json({
                    status: 'processing',
                    pass: currentPass,
                    message: 'Tool output submission failed due to race condition, will retry on next poll'
                  });
                }
              } else {
                // Different error, throw it
                console.error(`✗ Failed to submit tool outputs:`, error.message);
                throw error;
              }
            }
          }
          
          if (!submitSuccess) {
            console.log('Tool output submission did not succeed after retries.');
            return NextResponse.json({
              status: 'processing',
              pass: currentPass,
              message: 'Waiting for next poll to retry tool output submission'
            });
          }
          
          console.log(`Checking if run completed immediately...`);
          
          // Wait a moment for the run to potentially complete
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Check if run completed immediately after tool submission
          let updatedRun;
          try {
            const checkThreadId = (report as any).openai_thread_id;
            const checkRunId = (report as any).openai_run_id;
            console.log(`DEBUG: About to retrieve run - threadId=${checkThreadId}, runId=${checkRunId}`);
            
            updatedRun = await openai.beta.threads.runs.retrieve(
              checkRunId,
              { thread_id: checkThreadId }
            );
            console.log(`Updated run status after tool submission: ${updatedRun.status}`);
          } catch (error: any) {
            console.error(`Failed to retrieve run status after tool submission:`, error.message);
            // Return processing status and let next poll handle it
            return NextResponse.json({
              status: 'processing',
              pass: currentPass,
              totalPasses: 18,
              progress: passConfig.progress,
              message: passConfig.description,
            });
          }
          
          if (updatedRun.status === 'completed') {
            console.log(`Pass ${currentPass} completed immediately after tool submission`);
            
            const nextPass = currentPass + 1;
            
            if (nextPass > 17) {
              console.log(`All 18 passes complete for report ${reportId}, calculating final valuation...`);
              return await calculateFinalValuation(supabase, reportId);
            }
            
            // Clear thread/run IDs but keep current_pass as the last completed pass
            await (supabase.from('reports') as any).update({
                current_pass: currentPass,  // Keep as last completed pass
                openai_thread_id: null,
                openai_run_id: null,
              } as any)
              .eq('id', reportId);

            return NextResponse.json({
              status: 'processing',
              pass: nextPass,  // Tell frontend next pass will start
              totalPasses: 18,
              progress: PASS_CONFIG[nextPass]?.progress || 100,
              message: `Pass ${currentPass}/17 complete. ${PASS_CONFIG[nextPass]?.description || 'Finalizing...'}`,
            });
          }
        }

        return NextResponse.json({
          status: 'processing',
          pass: currentPass,
          totalPasses: 18,
          progress: passConfig.progress,
          message: passConfig.description,
        });
      } else {
        // Still running
        return NextResponse.json({
          status: 'processing',
          pass: currentPass,
          totalPasses: 18,
          progress: passConfig.progress,
          message: passConfig.description,
        });
      }
    }

    // Start new pass
    const nextPass = currentPass + 1;
    
    if (nextPass > 17) {
      // All passes complete
      console.log(`All 18 passes complete for report ${reportId}, calculating final valuation...`);
      return await calculateFinalValuation(supabase, reportId);
    }
    
    const passConfig = PASS_CONFIG[nextPass];
    console.log(`Starting pass ${nextPass} for report ${reportId}...`);
    
    try {
      await startPass(supabase, reportId, nextPass, report);
      console.log(`✓ Pass ${nextPass} started successfully`);
    } catch (error: any) {
      console.error(`✗ Failed to start pass ${nextPass}:`, error.message);
      
      // Mark report as failed
      await (supabase.from('reports') as any).update({
          report_status: 'failed',
          error_message: `Failed to start pass ${nextPass}: ${error.message}`,
        } as any)
        .eq('id', reportId);
      
      return NextResponse.json({
        status: 'failed',
        error: `Failed to start pass ${nextPass}`,
        details: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'processing',
      pass: nextPass,
      totalPasses: 18,
      progress: passConfig.progress,
      message: passConfig.description,
    });

  } catch (error: any) {
    console.error('Process error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function startPass(
  supabase: any,
  reportId: string,
  passNumber: number,
  report: any
) {
  const passConfig = PASS_CONFIG[passNumber];
  
  // Get accumulated data from previous passes
  const accumulatedData = await getAccumulatedData(supabase, reportId, passNumber);
  
  // Build context message with accumulated data
  let contextMessage = '';
  
  if (passNumber === 0) {
    // Pass 0: Company research
    contextMessage = `You are analyzing financial documents for ${report.company_name}.

Your task: Extract comprehensive company background information from the documents and call the "${passConfig.name}" function with ALL the data you extract.

IMPORTANT: You MUST call the function with the extracted data. Do not leave any fields empty - extract ALL available information from the documents.`;
  } else if (passNumber >= 1 && passNumber <= 5) {
    // Data extraction passes - include Pass 0 data
    contextMessage = `You are extracting financial data for ${report.company_name}.\n\n`;
    if (accumulatedData.pass_0) {
      contextMessage += `COMPANY BACKGROUND:\n${JSON.stringify(accumulatedData.pass_0, null, 2)}\n\n`;
    }
    contextMessage += `Your task: Extract ALL financial data from the documents and call the "${passConfig.name}" function with the complete data.\n\nIMPORTANT: You MUST call the function with ALL extracted financial data. Follow the system instructions for which specific fields to extract. Do not leave fields empty if data is available in the documents.`;
  } else {
    // Narrative passes - include all previous data
    contextMessage = `You are writing a professional business valuation report for ${report.company_name}.\n\n`;
    
    if (accumulatedData.pass_0) {
      contextMessage += `COMPANY BACKGROUND:\n${JSON.stringify(accumulatedData.pass_0, null, 2)}\n\n`;
    }
    
    const financialData = {
      ...accumulatedData.pass_1,
      ...accumulatedData.pass_2,
      ...accumulatedData.pass_3,
      ...accumulatedData.pass_4,
      ...accumulatedData.pass_5,
    };
    
    if (Object.keys(financialData).length > 0) {
      contextMessage += `FINANCIAL DATA:\n${JSON.stringify(financialData, null, 2)}\n\n`;
    }
    
    contextMessage += `Your task: Write a comprehensive, professional ${passConfig.description.replace('Writing ', '').replace('...', '')} section and call the "${passConfig.name}" function with your written content.\n\nIMPORTANT: You MUST call the function with your complete written narrative. Reference specific numbers from the financial data and company background provided above. Write 800-3000 words depending on the section complexity.`;
  }

  // Upload documents to OpenAI if not already uploaded
  let fileIds = report.file_ids || [];
  if (fileIds.length === 0) {
    console.log(`[18-PASS] No file_ids found, uploading documents to OpenAI...`);
    
    // Get documents from database
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .eq('report_id', reportId);
    
    if (docsError || !documents || documents.length === 0) {
      console.error(`[18-PASS] Failed to fetch documents:`, docsError);
      throw new Error('No documents found for this report');
    }
    
    console.log(`[18-PASS] Found ${documents.length} documents to upload`);
    
    // Upload each document to OpenAI
    for (const doc of documents) {
      try {
        console.log(`[18-PASS] Downloading ${doc.file_name} from Supabase storage...`);
        
        // Download file from Supabase storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('documents')
          .download(doc.file_path);
        
        if (downloadError || !fileData) {
          console.error(`[18-PASS] Failed to download ${doc.file_name}:`, downloadError);
          continue;
        }
        
        console.log(`[18-PASS] Uploading ${doc.file_name} to OpenAI...`);
        
        // Upload to OpenAI
        const file = await openai.files.create({
          file: new File([fileData], doc.file_name, { type: doc.mime_type }),
          purpose: 'assistants',
        });
        
        fileIds.push(file.id);
        console.log(`[18-PASS] ✓ Uploaded ${doc.file_name} to OpenAI (file_id: ${file.id})`);
      } catch (error: any) {
        console.error(`[18-PASS] Error uploading ${doc.file_name}:`, error.message);
        // Continue with other files
      }
    }
    
    // Store file IDs in database
    if (fileIds.length > 0) {
      await supabase
        .from('reports')
        .update({ file_ids: fileIds })
        .eq('id', reportId);
      
      console.log(`[18-PASS] ✓ Stored ${fileIds.length} file IDs in database`);
    } else {
      throw new Error('Failed to upload any documents to OpenAI');
    }
  } else {
    console.log(`[18-PASS] Using existing ${fileIds.length} file IDs`);
  }

  // Create thread with context
  const thread = await openai.beta.threads.create({
    messages: [
      {
        role: 'user',
        content: contextMessage,
        attachments: fileIds.map((fileId: string) => ({
          file_id: fileId,
          tools: [{ type: 'file_search' as const }],
        })),
      },
    ],
  });

  // Start run with specific function
  const run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id: ASSISTANT_ID,
    tools: [
      { type: 'file_search' },
      {
        type: 'function',
        function: {
          name: passConfig.name,
        },
      },
    ],
  });

  // Store thread and run IDs, and update current_pass
  const { data: updateData, error: updateError } = await (supabase.from('reports') as any).update({
      current_pass: passNumber,
      openai_thread_id: thread.id,
      openai_run_id: run.id,
    } as any)
    .eq('id', reportId)
    .select();
  
  if (updateError) {
    console.error(`Failed to update current_pass to ${passNumber}:`, updateError);
    throw new Error(`Failed to update database: ${updateError.message}`);
  }
  
  console.log(`✓ Updated current_pass to ${passNumber} for report ${reportId}`);
  console.log(`Database update result:`, JSON.stringify(updateData));

}

async function getAccumulatedData(supabase: any, reportId: string, currentPass: number) {
  const data: any = {};
  
  // Get data from all previous passes
  for (let i = 0; i < currentPass; i++) {
    const { data: passData, error } = await supabase
      .from('report_pass_data')
      .select('data')
      .eq('report_id', reportId)
      .eq('pass_number', i)
      .single();
    
    if (error) {
      console.warn(`No data found for pass ${i} (this is normal for the first pass):`, error.message);
      continue;
    }
    
    if (passData) {
      data[`pass_${i}`] = passData.data;
      console.log(`Retrieved data for pass ${i}`);
    }
  }
  
  console.log(`Accumulated data from ${Object.keys(data).length} previous passes`);
  return data;
}

async function storePassData(supabase: any, reportId: string, passNumber: number, data: any) {
  const { error } = await supabase
    .from('report_pass_data')
    .upsert({
      report_id: reportId,
      pass_number: passNumber,
      data: data,
    }, {
      onConflict: 'report_id,pass_number',
      ignoreDuplicates: false
    });
  
  if (error) {
    console.error(`Failed to store pass ${passNumber} data:`, error);
    throw new Error(`Failed to store pass ${passNumber} data: ${error.message}`);
  }
  
  console.log(`Successfully stored pass ${passNumber} data for report ${reportId}`);
}

async function processPassResults(supabase: any, reportId: string, passNumber: number, run: any) {
  // Results are already stored via tool calls
  // This function can be used for additional processing if needed
}

async function calculateFinalValuation(supabase: any, reportId: string) {
  // Import valuation engine
  const { calculateValuation } = await import('@/lib/valuation/engine');
  
  // Get all accumulated data
  const accumulatedData = await getAccumulatedData(supabase, reportId, 18);
  
  // Merge all financial data
  const rawData = {
    ...accumulatedData.pass_1,
    ...accumulatedData.pass_2,
    ...accumulatedData.pass_3,
    ...accumulatedData.pass_4,
    ...accumulatedData.pass_5,
  };
  
  console.log('[FINAL] Raw extracted data fields:', Object.keys(rawData));
  
  // Map extracted field names to engine interface
  // The extraction functions use different field names than the engine expects
  const financialData = {
    // Core financial metrics (required by engine)
    revenue: rawData.annual_revenue || 0,
    pretax_income: rawData.pretax_income || rawData.net_income || 0,
    owner_compensation: rawData.officer_compensation || 0,
    interest_expense: rawData.interest_expense || 0,
    depreciation_amortization: rawData.depreciation || 0,
    total_assets: rawData.total_assets || 0,
    total_liabilities: rawData.total_liabilities || 0,
    
    // Optional additional data
    cash: rawData.cash,
    accounts_receivable: rawData.accounts_receivable,
    inventory: rawData.inventory,
    fixed_assets: rawData.fixed_assets,
    intangible_assets: rawData.intangible_assets,
    accounts_payable: rawData.accounts_payable,
    current_liabilities: rawData.current_liabilities,
    long_term_debt: rawData.long_term_debt,
  };
  
  // Get industry data from Pass 0 or Pass 1
  const industryData = {
    naics_code: rawData.industry_naics_code || rawData.naics_code || '000000',
    industry_name: rawData.industry_name || 'General Business',
  };
  
  console.log('[FINAL] Mapped financial data for engine:', financialData);
  console.log('[FINAL] Industry data:', industryData);
  
  // Calculate valuation
  const result = calculateValuation(financialData, industryData);
  
  // Merge all narrative data
  const narrativeData = {
    ...accumulatedData.pass_0,
    ...accumulatedData.pass_6,
    ...accumulatedData.pass_7,
    ...accumulatedData.pass_8,
    ...accumulatedData.pass_9,
    ...accumulatedData.pass_10,
    ...accumulatedData.pass_11,
    ...accumulatedData.pass_12,
    ...accumulatedData.pass_13,
    ...accumulatedData.pass_14,
    ...accumulatedData.pass_15,
    ...accumulatedData.pass_16,
    ...accumulatedData.pass_17,
  };
  
  // Update report with final data
  await (supabase.from('reports') as any).update({
      report_status: 'completed',
      report_data: {
        ...rawData,           // Original extracted data with original field names
        ...narrativeData,     // Narrative sections from passes 6-17
        ...result,            // Calculated valuation results
      },
      current_pass: null,
      openai_thread_id: null,
      openai_run_id: null,
    })
    .eq('id', reportId);
  
  return NextResponse.json({
    status: 'completed',
    progress: 100,
    message: 'Valuation complete!',
  });
}
