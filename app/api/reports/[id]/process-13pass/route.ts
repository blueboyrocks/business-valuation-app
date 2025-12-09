import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID!;

// 13-Pass Architecture
// Phase 1: Data Extraction (Passes 1-5)
// Phase 2: Narrative Generation (Passes 6-13)

const PASS_CONFIG = [
  // Phase 1: Data Extraction
  { pass: 1, name: 'extract_core_company_data', description: 'Extracting core company data...', progress: 7 },
  { pass: 2, name: 'extract_income_statement_details', description: 'Extracting income statement...', progress: 15 },
  { pass: 3, name: 'extract_balance_sheet_details', description: 'Extracting balance sheet...', progress: 23 },
  { pass: 4, name: 'extract_special_items', description: 'Extracting special items...', progress: 31 },
  { pass: 5, name: 'extract_business_metrics', description: 'Extracting business metrics...', progress: 38 },
  
  // Phase 2: Narrative Generation
  { pass: 6, name: 'write_executive_summary', description: 'Writing executive summary...', progress: 46 },
  { pass: 7, name: 'write_company_profile', description: 'Writing company profile...', progress: 54 },
  { pass: 8, name: 'write_industry_analysis', description: 'Writing industry analysis...', progress: 62 },
  { pass: 9, name: 'write_financial_analysis', description: 'Writing financial analysis...', progress: 69 },
  { pass: 10, name: 'write_asset_approach_analysis', description: 'Writing asset approach analysis...', progress: 77 },
  { pass: 11, name: 'write_income_approach_analysis', description: 'Writing income approach analysis...', progress: 85 },
  { pass: 12, name: 'write_market_approach_analysis', description: 'Writing market approach analysis...', progress: 92 },
  { pass: 13, name: 'write_final_sections', description: 'Writing final sections...', progress: 96 },
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

    // Determine current pass
    const currentPass = report.current_pass || 0;
    const nextPass = currentPass + 1;

    if (nextPass > 13) {
      // All passes complete - calculate final valuation
      return await calculateFinalValuation(supabase, reportId);
    }

    const passConfig = PASS_CONFIG[nextPass - 1];

    // Check if this pass is already running
    if (report.openai_thread_id && report.openai_run_id && nextPass === currentPass + 1) {
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
          pass: nextPass,
          progress: passConfig.progress,
          message: `Pass ${nextPass}/13 complete. ${PASS_CONFIG[nextPass]?.description || 'Finalizing...'}`,
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
          progress: passConfig.progress,
          message: passConfig.description,
        });
      } else {
        // Still running
        return NextResponse.json({
          status: 'processing',
          pass: nextPass,
          progress: passConfig.progress,
          message: passConfig.description,
        });
      }
    }

    // Start new pass
    await startPass(supabase, reportId, nextPass, report.document_ids);

    return NextResponse.json({
      status: 'processing',
      pass: nextPass,
      progress: passConfig.progress,
      message: passConfig.description,
    });

  } catch (error) {
    console.error('Error in 13-pass processing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function startPass(
  supabase: any,
  reportId: string,
  passNumber: number,
  documentIds: string[]
) {
  const passConfig = PASS_CONFIG[passNumber - 1];

  // Upload documents to OpenAI (if not already done)
  let fileIds: string[] = [];
  if (passNumber === 1) {
    // First pass - upload documents
    for (const docId of documentIds) {
      const { data: doc } = await supabase
        .from('documents')
        .select('file_path')
        .eq('id', docId)
        .single();

      if (doc?.file_path) {
        const { data: fileData } = await supabase.storage
          .from('documents')
          .download(doc.file_path);

        if (fileData) {
          const file = await openai.files.create({
            file: fileData,
            purpose: 'assistants',
          });
          fileIds.push(file.id);
        }
      }
    }
  }

  // Create thread
  const thread = await openai.beta.threads.create({
    messages: [
      {
        role: 'user',
        content: getPassPrompt(passNumber, reportId),
        ...(fileIds.length > 0 && { attachments: fileIds.map(id => ({ file_id: id, tools: [{ type: 'file_search' as const }] })) }),
      },
    ],
  });

  // Start run with specific function
  const run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id: ASSISTANT_ID,
    tools: [{ type: 'function', function: { name: passConfig.name } }],
  });

  // Update report
  await supabase
    .from('reports')
    .update({
      openai_thread_id: thread.id,
      openai_run_id: run.id,
      current_pass: passNumber,
      report_status: 'processing',
    })
    .eq('id', reportId);
}

function getPassPrompt(passNumber: number, reportId: string): string {
  const prompts = [
    // Pass 1
    `Extract ONLY the basic company information and top-line financial numbers for report ${reportId}. Do not write any narratives. Just find and extract these 10 core numbers from the documents.`,
    
    // Pass 2
    `Extract ONLY the complete income statement breakdown for report ${reportId}. Find every expense category. Do not write narratives. Just extract these 15 numbers.`,
    
    // Pass 3
    `Extract ONLY the complete balance sheet breakdown for report ${reportId}. Find every asset and liability. Do not write narratives. Just extract these 20 numbers.`,
    
    // Pass 4
    `Hunt for special items for report ${reportId}: insurance reserves, PPP loans, owner loans, non-recurring items, personal expenses. Extract numbers only, no narratives.`,
    
    // Pass 5
    `Extract or calculate business metrics and financial ratios for report ${reportId}. Numbers only, no narratives.`,
    
    // Pass 6
    `Write a comprehensive executive summary (2000-2500 words) for report ${reportId}. Include: business overview, valuation conclusion, key findings, financial performance, market position, strategic considerations, risks. Write in professional, detailed paragraphs. Use the financial data already extracted.`,
    
    // Pass 7
    `Write a detailed company profile (1500-2000 words) for report ${reportId}. Include: history, ownership, products/services, customers, competitive advantages, organization. Write in professional, detailed paragraphs.`,
    
    // Pass 8
    `Write a comprehensive industry analysis (2000-2500 words) for report ${reportId}. Include: industry overview, market size/trends, competitive landscape, regulatory environment, technology trends, growth drivers, challenges, future outlook. Write in professional, detailed paragraphs with specific examples.`,
    
    // Pass 9
    `Write a detailed financial analysis (3000-3500 words) for report ${reportId}. Include: revenue analysis, profitability trends, cash flow analysis, balance sheet strength, financial ratios, working capital, comparison to industry benchmarks, historical trends, strengths/weaknesses. Write in professional, detailed paragraphs. Reference specific numbers.`,
    
    // Pass 10
    `Write a comprehensive asset approach analysis (1500-2000 words) for report ${reportId}. Include: methodology explanation, book vs fair market value, asset adjustments, tangible vs intangible assets, liquidation considerations, going concern vs liquidation premise, strengths/limitations, conclusion. Write in professional, detailed paragraphs.`,
    
    // Pass 11
    `Write a comprehensive income approach analysis (2000-2500 words) for report ${reportId}. Include: methodology explanation, capitalization of earnings, DCF method, normalization adjustments, discount rate selection, cap rate selection, growth assumptions, strengths/limitations, conclusion. Write in professional, detailed paragraphs.`,
    
    // Pass 12
    `Write a comprehensive market approach analysis (2000-2500 words) for report ${reportId}. Include: methodology explanation, comparable company analysis, transaction multiples, industry benchmarks, multiple selection rationale, comparability adjustments, market conditions, strengths/limitations, conclusion. Write in professional, detailed paragraphs.`,
    
    // Pass 13
    `Write final comprehensive sections (3000-3500 words total) for report ${reportId}: Valuation Reconciliation (1000 words), Risk Assessment (1000-1500 words), Strategic Insights (1000-1500 words), Discounts and Premiums (500 words). Write in professional, detailed paragraphs with actionable recommendations.`,
  ];

  return prompts[passNumber - 1];
}

async function processPassResults(
  supabase: any,
  reportId: string,
  passNumber: number,
  run: any
) {
  // Results are already stored via tool calls
  // This function can be used for additional processing if needed
  console.log(`Pass ${passNumber} completed for report ${reportId}`);
}

async function storePassData(
  supabase: any,
  reportId: string,
  passNumber: number,
  data: any
) {
  // Store extracted data in report_data JSONB column
  const { data: report } = await supabase
    .from('reports')
    .select('report_data')
    .eq('id', reportId)
    .single();

  const existingData = report?.report_data || {};
  const updatedData = { ...existingData, ...data };

  await supabase
    .from('reports')
    .update({ report_data: updatedData })
    .eq('id', reportId);
}

async function calculateFinalValuation(supabase: any, reportId: string) {
  // All 13 passes complete - calculate valuation
  const { data: report } = await supabase
    .from('reports')
    .select('report_data')
    .eq('id', reportId)
    .single();

  const data = report?.report_data || {};

  // Call valuation engine
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/reports/${reportId}/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (response.ok) {
    await supabase
      .from('reports')
      .update({
        report_status: 'completed',
        current_pass: 13,
      })
      .eq('id', reportId);

    return NextResponse.json({
      status: 'completed',
      progress: 100,
      message: 'Valuation complete!',
    });
  } else {
    throw new Error('Valuation calculation failed');
  }
}
