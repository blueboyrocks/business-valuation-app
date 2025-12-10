import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID!;

// 16-Pass Architecture (Pass 0 + 15 passes)
// Pass 0: Company Research
// Phase 1: Data Extraction (Passes 1-5)
// Phase 2: Narrative Generation (Passes 6-15)

const PASS_CONFIG = [
  // Pass 0: Research
  { pass: 0, name: 'research_company_background', description: 'Researching company background...', progress: 3 },
  
  // Phase 1: Data Extraction
  { pass: 1, name: 'extract_core_company_data', description: 'Extracting core company data...', progress: 9 },
  { pass: 2, name: 'extract_income_statement_details', description: 'Extracting income statement...', progress: 15 },
  { pass: 3, name: 'extract_balance_sheet_details', description: 'Extracting balance sheet...', progress: 21 },
  { pass: 4, name: 'extract_special_items', description: 'Extracting special items...', progress: 27 },
  { pass: 5, name: 'extract_business_metrics', description: 'Extracting business metrics...', progress: 33 },
  
  // Phase 2: Narrative Generation
  { pass: 6, name: 'write_executive_summary', description: 'Writing executive summary...', progress: 40 },
  { pass: 7, name: 'write_company_profile', description: 'Writing company profile...', progress: 47 },
  { pass: 8, name: 'write_industry_analysis', description: 'Writing industry analysis...', progress: 53 },
  { pass: 9, name: 'write_financial_analysis', description: 'Writing financial analysis...', progress: 60 },
  { pass: 10, name: 'write_asset_approach_analysis', description: 'Writing asset approach analysis...', progress: 67 },
  { pass: 11, name: 'write_income_approach_analysis', description: 'Writing income approach analysis...', progress: 73 },
  { pass: 12, name: 'write_market_approach_analysis', description: 'Writing market approach analysis...', progress: 80 },
  { pass: 13, name: 'write_risk_assessment', description: 'Writing risk assessment...', progress: 87 },
  { pass: 14, name: 'write_strategic_insights', description: 'Writing strategic insights...', progress: 93 },
  { pass: 15, name: 'write_valuation_reconciliation', description: 'Writing valuation reconciliation...', progress: 97 },
];

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reportId = params.id;

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
    const currentPass = report.current_pass !== null ? report.current_pass : -1;
    const nextPass = currentPass + 1;

    if (nextPass > 15) {
      // All passes complete - calculate final valuation
      return await calculateFinalValuation(supabase, reportId);
    }

    const passConfig = PASS_CONFIG[nextPass];

    // Check if this pass is already running
    if (report.openai_thread_id && report.openai_run_id) {
      // Check run status
      const run = await openai.beta.threads.runs.retrieve(
        report.openai_thread_id,
        report.openai_run_id
      );

      if (run.status === 'completed') {
        // Extract results and move to next pass
        await processPassResults(supabase, reportId, nextPass, run);
        
        // Update to next pass
        await supabase
          .from('reports')
          .update({
            current_pass: nextPass,
            openai_thread_id: null,
            openai_run_id: null,
          })
          .eq('id', reportId);

        return NextResponse.json({
          status: 'processing',
          pass: nextPass + 1,
          totalPasses: 16,
          progress: passConfig.progress,
          message: `Pass ${nextPass}/15 complete. ${PASS_CONFIG[nextPass + 1]?.description || 'Finalizing...'}`,
        });
      } else if (run.status === 'failed' || run.status === 'cancelled' || run.status === 'expired') {
        // Pass failed - mark report as failed
        await supabase
          .from('reports')
          .update({
            report_status: 'failed',
            error_message: `Pass ${nextPass} failed: ${run.last_error?.message || 'Unknown error'}`,
          })
          .eq('id', reportId);

        return NextResponse.json({
          status: 'failed',
          error: `Pass ${nextPass} failed`,
        }, { status: 500 });
      } else if (run.status === 'requires_action') {
        // Handle tool calls
        if (run.required_action?.type === 'submit_tool_outputs') {
          const toolCalls = run.required_action.submit_tool_outputs.tool_calls;
          const toolOutputs = [];

          for (const toolCall of toolCalls) {
            if (toolCall.type === 'function') {
              const functionName = toolCall.function.name;
              const functionArgs = JSON.parse(toolCall.function.arguments);

              // Store the extracted data
              await storePassData(supabase, reportId, nextPass, functionArgs);

              toolOutputs.push({
                tool_call_id: toolCall.id,
                output: JSON.stringify({ success: true, message: 'Data stored successfully' }),
              });
            }
          }

          // Submit tool outputs
          await openai.beta.threads.runs.submitToolOutputs(
            report.openai_thread_id,
            report.openai_run_id,
            { tool_outputs: toolOutputs } as any
          );
        }

        return NextResponse.json({
          status: 'processing',
          pass: nextPass,
          totalPasses: 16,
          progress: passConfig.progress,
          message: passConfig.description,
        });
      } else {
        // Still running
        return NextResponse.json({
          status: 'processing',
          pass: nextPass,
          totalPasses: 16,
          progress: passConfig.progress,
          message: passConfig.description,
        });
      }
    }

    // Start new pass
    await startPass(supabase, reportId, nextPass, report);

    return NextResponse.json({
      status: 'processing',
      pass: nextPass,
      totalPasses: 16,
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
    contextMessage = `You are analyzing business valuation documents. Extract company background information from the documents and use web search if needed for additional context about the company, its industry, and market position.`;
  } else if (passNumber >= 1 && passNumber <= 5) {
    // Data extraction passes
    if (accumulatedData.pass_0) {
      contextMessage = `Company Background:\n${JSON.stringify(accumulatedData.pass_0, null, 2)}\n\nExtract financial data from the documents.`;
    } else {
      contextMessage = `Extract financial data from the documents.`;
    }
  } else {
    // Narrative passes - include all accumulated data
    contextMessage = `You are writing a comprehensive business valuation report.\n\n`;
    
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
      contextMessage += `FINANCIAL DATA EXTRACTED:\n${JSON.stringify(financialData, null, 2)}\n\n`;
    }
    
    contextMessage += `Write the ${passConfig.name.replace('write_', '').replace(/_/g, ' ')} section. Use the data provided above and reference specific numbers from the financial data. Be comprehensive and detailed.`;
  }

  // Upload documents if not already uploaded
  let fileIds = report.openai_file_ids || [];
  if (fileIds.length === 0 && report.document_paths) {
    const paths = JSON.parse(report.document_paths);
    for (const path of paths) {
      try {
        const file = await openai.files.create({
          file: await fetch(path).then(r => r.blob()),
          purpose: 'assistants',
        });
        fileIds.push(file.id);
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }
    
    await supabase
      .from('reports')
      .update({ openai_file_ids: fileIds })
      .eq('id', reportId);
  }

  // Create thread with context
  const thread = await openai.beta.threads.create({
    messages: [
      {
        role: 'user',
        content: contextMessage,
        attachments: fileIds.map((id: string) => ({
          file_id: id,
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
          description: passConfig.description,
        },
      },
    ],
  });

  // Store thread and run IDs
  await supabase
    .from('reports')
    .update({
      openai_thread_id: thread.id,
      openai_run_id: run.id,
      report_status: 'processing',
    })
    .eq('id', reportId);
}

async function getAccumulatedData(supabase: any, reportId: string, currentPass: number) {
  const { data: report } = await supabase
    .from('reports')
    .select('report_data')
    .eq('id', reportId)
    .single();

  const reportData = report?.report_data || {};
  const accumulated: any = {};

  // Collect data from all previous passes
  for (let i = 0; i < currentPass; i++) {
    const passKey = `pass_${i}`;
    if (reportData[passKey]) {
      accumulated[passKey] = reportData[passKey];
    }
  }

  return accumulated;
}

async function storePassData(supabase: any, reportId: string, passNumber: number, data: any) {
  const { data: report } = await supabase
    .from('reports')
    .select('report_data')
    .eq('id', reportId)
    .single();

  const reportData = report?.report_data || {};
  reportData[`pass_${passNumber}`] = data;

  await supabase
    .from('reports')
    .update({ report_data: reportData })
    .eq('id', reportId);
}

async function processPassResults(supabase: any, reportId: string, passNumber: number, run: any) {
  // Results are already stored via storePassData during requires_action
  // This function can be used for additional processing if needed
}

async function calculateFinalValuation(supabase: any, reportId: string) {
  // Get all accumulated data
  const { data: report } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single();

  const reportData = report.report_data || {};

  // Extract financial data from passes 1-5
  const financialData = {
    ...reportData.pass_1,
    ...reportData.pass_2,
    ...reportData.pass_3,
    ...reportData.pass_4,
    ...reportData.pass_5,
  };

  // Call valuation engine
  const valuationResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/calculate-valuation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reportId,
      financialData,
    }),
  });

  if (!valuationResponse.ok) {
    throw new Error('Valuation calculation failed');
  }

  const valuationResult = await valuationResponse.json();

  // Update report with final status
  await supabase
    .from('reports')
    .update({
      report_status: 'completed',
      valuation_amount: valuationResult.valuation_amount,
      valuation_method: valuationResult.valuation_method,
    })
    .eq('id', reportId);

  return NextResponse.json({
    status: 'completed',
    valuation_amount: valuationResult.valuation_amount,
    progress: 100,
  });
}
