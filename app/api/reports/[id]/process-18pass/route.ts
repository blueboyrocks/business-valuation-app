import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

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

    if (nextPass > 17) {
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
          totalPasses: 18,
          progress: passConfig.progress,
          message: `Pass ${nextPass}/17 complete. ${PASS_CONFIG[nextPass + 1]?.description || 'Finalizing...'}`,
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
          totalPasses: 18,
          progress: passConfig.progress,
          message: passConfig.description,
        });
      } else {
        // Still running
        return NextResponse.json({
          status: 'processing',
          pass: nextPass,
          totalPasses: 18,
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
    contextMessage = `You are analyzing financial documents for ${report.company_name}. Extract comprehensive company background information from the documents.`;
  } else if (passNumber >= 1 && passNumber <= 5) {
    // Data extraction passes - include Pass 0 data
    contextMessage = `You are extracting financial data for ${report.company_name}.\n\n`;
    if (accumulatedData.pass_0) {
      contextMessage += `COMPANY BACKGROUND:\n${JSON.stringify(accumulatedData.pass_0, null, 2)}\n\n`;
    }
    contextMessage += `Extract the requested financial data from the documents.`;
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
    
    contextMessage += `Write a comprehensive, professional ${passConfig.description.replace('Writing ', '').replace('...', '')} section. Reference the financial data and company background provided above.`;
  }

  // Create thread with context
  const thread = await openai.beta.threads.create({
    messages: [
      {
        role: 'user',
        content: contextMessage,
        attachments: report.file_ids?.map((fileId: string) => ({
          file_id: fileId,
          tools: [{ type: 'file_search' as const }],
        })) || [],
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

  // Store thread and run IDs
  await supabase
    .from('reports')
    .update({
      openai_thread_id: thread.id,
      openai_run_id: run.id,
    })
    .eq('id', reportId);
}

async function getAccumulatedData(supabase: any, reportId: string, currentPass: number) {
  const data: any = {};
  
  // Get data from all previous passes
  for (let i = 0; i < currentPass; i++) {
    const { data: passData } = await supabase
      .from('report_pass_data')
      .select('data')
      .eq('report_id', reportId)
      .eq('pass_number', i)
      .single();
    
    if (passData) {
      data[`pass_${i}`] = passData.data;
    }
  }
  
  return data;
}

async function storePassData(supabase: any, reportId: string, passNumber: number, data: any) {
  await supabase
    .from('report_pass_data')
    .upsert({
      report_id: reportId,
      pass_number: passNumber,
      data: data,
    });
}

async function processPassResults(supabase: any, reportId: string, passNumber: number, run: any) {
  // Results are already stored via tool calls
  // This function can be used for additional processing if needed
}

async function calculateFinalValuation(supabase: any, reportId: string) {
  // Import valuation engine
  const { ValuationEngine } = await import('@/lib/valuation/engine');
  
  // Get all accumulated data
  const accumulatedData = await getAccumulatedData(supabase, reportId, 18);
  
  // Merge all financial data
  const financialData = {
    ...accumulatedData.pass_1,
    ...accumulatedData.pass_2,
    ...accumulatedData.pass_3,
    ...accumulatedData.pass_4,
    ...accumulatedData.pass_5,
  };
  
  // Calculate valuation
  const engine = new ValuationEngine();
  const result = engine.calculateValuation(financialData);
  
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
  await supabase
    .from('reports')
    .update({
      report_status: 'completed',
      report_data: {
        ...financialData,
        ...narrativeData,
        ...result,
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
