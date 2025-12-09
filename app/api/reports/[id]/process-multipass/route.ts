import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getOpenAIClient } from '@/lib/openai/client';
import { calculateValuation, type ExtractedFinancialData, type IndustryData } from '@/lib/valuation/engine';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Multi-pass extraction endpoint
 * Orchestrates 3 sequential AI extraction passes for comprehensive data collection
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const reportId = params.id;
  console.log(`[MULTIPASS] Processing report ${reportId}`);

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

    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (report.report_status === 'completed' || report.report_status === 'failed') {
      return NextResponse.json({
        status: report.report_status,
        message: report.report_status === 'completed' ? 'Analysis complete' : 'Analysis failed',
      });
    }

    const reportData = report.report_data as any || {};
    const currentPass = reportData.extraction_pass || 1;
    
    console.log(`[MULTIPASS] Current pass: ${currentPass}/3`);

    if (currentPass === 1) {
      return await handlePass1(reportId, report, reportData, user.id, supabase);
    }
    
    if (currentPass === 2) {
      return await handlePass2(reportId, report, reportData, user.id, supabase);
    }
    
    if (currentPass === 3) {
      return await handlePass3(reportId, report, reportData, user.id, supabase);
    }

    return NextResponse.json({ status: 'error', message: 'Invalid extraction pass' });

  } catch (error: any) {
    console.error(`[MULTIPASS] Error:`, error);
    return NextResponse.json({ status: 'failed', error: error.message }, { status: 500 });
  }
}

async function handlePass1(reportId: string, report: any, reportData: any, userId: string, supabase: any) {
  console.log(`[MULTIPASS] Handling Pass 1`);

  if (!reportData.pass1_thread_id || !reportData.pass1_run_id) {
    console.log(`[MULTIPASS] Initializing Pass 1`);
    try {
      await startPass1(reportId, report.company_name, userId, supabase);
      return NextResponse.json({
        status: 'processing',
        pass: 1,
        message: 'Pass 1: Extracting primary data and writing narratives...',
        progress: 10,
      });
    } catch (error: any) {
      console.error(`[MULTIPASS] Pass 1 init failed:`, error);
      await supabase.from('reports').update({
        report_status: 'failed',
        error_message: `Pass 1 failed: ${error.message}`,
      } as any).eq('id', reportId);
      return NextResponse.json({ status: 'failed', error: error.message });
    }
  }

  const openai = getOpenAIClient();
  const run = await openai.beta.threads.runs.retrieve(reportData.pass1_run_id, {
    thread_id: reportData.pass1_thread_id,
  });

  console.log(`[MULTIPASS] Pass 1 status: ${run.status}`);

  if (run.status === 'requires_action') {
    await handleToolCalls(run, reportId, reportData, supabase, 1);
    return NextResponse.json({
      status: 'processing',
      pass: 1,
      message: 'Pass 1: Saving primary data...',
      progress: 25,
    });
  }

  if (run.status === 'completed') {
    console.log(`[MULTIPASS] Pass 1 completed, advancing to Pass 2`);
    
    const { data: currentReport } = await supabase
      .from('reports')
      .select('report_data')
      .eq('id', reportId)
      .single();
    
    const currentData = (currentReport?.report_data as any) || {};
    
    await supabase.from('reports').update({
      report_data: {
        ...currentData,
        extraction_pass: 2,
        pass1_completed: new Date().toISOString(),
      },
    } as any).eq('id', reportId);

    return NextResponse.json({
      status: 'processing',
      pass: 2,
      message: 'Pass 1 complete! Starting Pass 2: Detailed financials...',
      progress: 35,
    });
  }

  if (run.status === 'failed' || run.status === 'cancelled' || run.status === 'expired') {
    await supabase.from('reports').update({
      report_status: 'failed',
      error_message: `Pass 1 ${run.status}`,
    } as any).eq('id', reportId);
    return NextResponse.json({ status: 'failed', error: `Pass 1 ${run.status}` });
  }

  return NextResponse.json({
    status: 'processing',
    pass: 1,
    message: 'Pass 1: Extracting primary data...',
    progress: 20,
  });
}

async function handlePass2(reportId: string, report: any, reportData: any, userId: string, supabase: any) {
  console.log(`[MULTIPASS] Handling Pass 2`);

  if (!reportData.pass2_thread_id || !reportData.pass2_run_id) {
    console.log(`[MULTIPASS] Initializing Pass 2`);
    try {
      await startPass2(reportId, report.company_name, userId, supabase, reportData);
      return NextResponse.json({
        status: 'processing',
        pass: 2,
        message: 'Pass 2: Extracting detailed financial breakdown...',
        progress: 40,
      });
    } catch (error: any) {
      console.error(`[MULTIPASS] Pass 2 init failed:`, error);
      await supabase.from('reports').update({
        report_status: 'failed',
        error_message: `Pass 2 failed: ${error.message}`,
      } as any).eq('id', reportId);
      return NextResponse.json({ status: 'failed', error: error.message });
    }
  }

  const openai = getOpenAIClient();
  const run = await openai.beta.threads.runs.retrieve(reportData.pass2_run_id, {
    thread_id: reportData.pass2_thread_id,
  });

  console.log(`[MULTIPASS] Pass 2 status: ${run.status}`);

  if (run.status === 'requires_action') {
    await handleToolCalls(run, reportId, reportData, supabase, 2);
    return NextResponse.json({
      status: 'processing',
      pass: 2,
      message: 'Pass 2: Saving detailed financial data...',
      progress: 55,
    });
  }

  if (run.status === 'completed') {
    console.log(`[MULTIPASS] Pass 2 completed, advancing to Pass 3`);
    
    const { data: currentReport } = await supabase
      .from('reports')
      .select('report_data')
      .eq('id', reportId)
      .single();
    
    const currentData = (currentReport?.report_data as any) || {};
    
    await supabase.from('reports').update({
      report_data: {
        ...currentData,
        extraction_pass: 3,
        pass2_completed: new Date().toISOString(),
      },
    } as any).eq('id', reportId);

    return NextResponse.json({
      status: 'processing',
      pass: 3,
      message: 'Pass 2 complete! Starting Pass 3: Advanced data...',
      progress: 65,
    });
  }

  if (run.status === 'failed' || run.status === 'cancelled' || run.status === 'expired') {
    await supabase.from('reports').update({
      report_status: 'failed',
      error_message: `Pass 2 ${run.status}`,
    } as any).eq('id', reportId);
    return NextResponse.json({ status: 'failed', error: `Pass 2 ${run.status}` });
  }

  return NextResponse.json({
    status: 'processing',
    pass: 2,
    message: 'Pass 2: Extracting detailed financials...',
    progress: 50,
  });
}

async function handlePass3(reportId: string, report: any, reportData: any, userId: string, supabase: any) {
  console.log(`[MULTIPASS] Handling Pass 3`);

  if (!reportData.pass3_thread_id || !reportData.pass3_run_id) {
    console.log(`[MULTIPASS] Initializing Pass 3`);
    try {
      await startPass3(reportId, report.company_name, userId, supabase, reportData);
      return NextResponse.json({
        status: 'processing',
        pass: 3,
        message: 'Pass 3: Extracting industry-specific and advanced data...',
        progress: 70,
      });
    } catch (error: any) {
      console.error(`[MULTIPASS] Pass 3 init failed:`, error);
      await supabase.from('reports').update({
        report_status: 'failed',
        error_message: `Pass 3 failed: ${error.message}`,
      } as any).eq('id', reportId);
      return NextResponse.json({ status: 'failed', error: error.message });
    }
  }

  const openai = getOpenAIClient();
  const run = await openai.beta.threads.runs.retrieve(reportData.pass3_run_id, {
    thread_id: reportData.pass3_thread_id,
  });

  console.log(`[MULTIPASS] Pass 3 status: ${run.status}`);

  if (run.status === 'requires_action') {
    await handleToolCalls(run, reportId, reportData, supabase, 3);
    return NextResponse.json({
      status: 'processing',
      pass: 3,
      message: 'Pass 3: Saving advanced data...',
      progress: 85,
    });
  }

  if (run.status === 'completed') {
    console.log(`[MULTIPASS] Pass 3 completed, calculating final valuation`);
    
    const { data: currentReport } = await supabase
      .from('reports')
      .select('report_data')
      .eq('id', reportId)
      .single();
    
    const finalData = (currentReport?.report_data as any) || {};
    
    await calculateFinalValuation(reportId, finalData, supabase);

    return NextResponse.json({
      status: 'completed',
      message: 'All 3 passes complete! Valuation calculated successfully.',
      progress: 100,
    });
  }

  if (run.status === 'failed' || run.status === 'cancelled' || run.status === 'expired') {
    await supabase.from('reports').update({
      report_status: 'failed',
      error_message: `Pass 3 ${run.status}`,
    } as any).eq('id', reportId);
    return NextResponse.json({ status: 'failed', error: `Pass 3 ${run.status}` });
  }

  return NextResponse.json({
    status: 'processing',
    pass: 3,
    message: 'Pass 3: Extracting advanced data...',
    progress: 80,
  });
}

async function handleToolCalls(run: any, reportId: string, reportData: any, supabase: any, pass: number) {
  console.log(`[MULTIPASS] Handling tool calls for Pass ${pass}`);

  if (run.required_action?.type === 'submit_tool_outputs') {
    const toolCalls = run.required_action.submit_tool_outputs.tool_calls;
    const toolOutputs = [];

    for (const toolCall of toolCalls) {
      console.log(`[MULTIPASS] Tool: ${toolCall.function.name}`);
      
      try {
        let jsonString = toolCall.function.arguments.trim();
        const lastBraceIndex = jsonString.lastIndexOf('}');
        if (lastBraceIndex !== -1 && lastBraceIndex < jsonString.length - 1) {
          jsonString = jsonString.substring(0, lastBraceIndex + 1);
        }
        
        const args = JSON.parse(jsonString);
        
        // Get current data
        const { data: currentReport } = await supabase
          .from('reports')
          .select('report_data, valuation_amount, valuation_method, executive_summary')
          .eq('id', reportId)
          .single();
        
        const currentData = (currentReport?.report_data as any) || {};
        
        // Merge new data
        const updatedData = {
          ...currentData,
          ...args,
        };

        // Update database
        await supabase.from('reports').update({
          report_data: updatedData,
          valuation_amount: args.valuation_amount || currentReport?.valuation_amount,
          valuation_method: args.valuation_method || currentReport?.valuation_method,
          executive_summary: args.executive_summary || currentReport?.executive_summary,
        }).eq('id', reportId);

        console.log(`[MULTIPASS] Pass ${pass} data merged successfully`);
        
        toolOutputs.push({
          tool_call_id: toolCall.id,
          output: JSON.stringify({ success: true, message: `Pass ${pass} data saved` }),
        });
      } catch (e) {
        console.error(`[MULTIPASS] Error processing tool call:`, e);
        toolOutputs.push({
          tool_call_id: toolCall.id,
          output: JSON.stringify({ success: false, error: String(e) }),
        });
      }
    }

    const openai = getOpenAIClient();
    const threadId = pass === 1 ? reportData.pass1_thread_id : 
                     pass === 2 ? reportData.pass2_thread_id : 
                     reportData.pass3_thread_id;
    const runId = pass === 1 ? reportData.pass1_run_id : 
                  pass === 2 ? reportData.pass2_run_id : 
                  reportData.pass3_run_id;

    await openai.beta.threads.runs.submitToolOutputs(runId, {
      thread_id: threadId,
      tool_outputs: toolOutputs,
    });
    
    console.log(`[MULTIPASS] Tool outputs submitted for Pass ${pass}`);
  }
}

async function calculateFinalValuation(reportId: string, reportData: any, supabase: any) {
  console.log(`[MULTIPASS] Calculating final valuation`);

  const financialData: ExtractedFinancialData = {
    revenue: reportData.annual_revenue || reportData.gross_revenue || 0,
    pretax_income: reportData.pretax_income || reportData.taxable_income || 0,
    owner_compensation: reportData.owner_compensation || 0,
    interest_expense: reportData.interest_expense || 0,
    depreciation_amortization: reportData.depreciation_amortization || reportData.depreciation || 0,
    total_assets: reportData.total_assets || 0,
    total_liabilities: reportData.total_liabilities || 0,
    cash: reportData.cash || 0,
    accounts_receivable: reportData.accounts_receivable || 0,
    inventory: reportData.inventory || 0,
    fixed_assets: reportData.fixed_assets || reportData.fixed_assets_net || 0,
    intangible_assets: reportData.intangible_assets || 0,
    current_liabilities: reportData.total_current_liabilities || 0,
    long_term_debt: reportData.bank_loans || reportData.total_long_term_liabilities || 0,
  };

  const industryData: IndustryData = {
    naics_code: reportData.industry_naics_code,
    industry_name: reportData.industry_name,
  };

  const calculatedValuation = calculateValuation(financialData, industryData);

  console.log(`[MULTIPASS] Final valuation: $${calculatedValuation.valuation_amount.toLocaleString()}`);

  await supabase.from('reports').update({
    report_status: 'completed',
    processing_completed_at: new Date().toISOString(),
    valuation_amount: calculatedValuation.valuation_amount,
    report_data: {
      ...reportData,
      normalized_ebitda: calculatedValuation.ebitda,
      normalized_sde: calculatedValuation.sde,
      asset_approach_value: calculatedValuation.asset_approach_value,
      asset_approach_weight: calculatedValuation.asset_approach_weight,
      income_approach_value: calculatedValuation.income_approach_value,
      income_approach_weight: calculatedValuation.income_approach_weight,
      market_approach_value: calculatedValuation.market_approach_value,
      market_approach_weight: calculatedValuation.market_approach_weight,
      valuation_amount: calculatedValuation.valuation_amount,
      valuation_range_low: calculatedValuation.valuation_range_low,
      valuation_range_high: calculatedValuation.valuation_range_high,
      revenue_multiple_used: calculatedValuation.revenue_multiple,
      ebitda_multiple_used: calculatedValuation.ebitda_multiple,
      sde_multiple_used: calculatedValuation.sde_multiple,
      calculation_notes: calculatedValuation.calculation_notes,
      pass3_completed: new Date().toISOString(),
    },
  }).eq('id', reportId);

  console.log(`[MULTIPASS] Final valuation saved - report complete!`);
}

async function startPass1(reportId: string, companyName: string, userId: string, supabase: any) {
  console.log(`[MULTIPASS] Initializing Pass 1`);
  
  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('report_id', reportId);
  
  if (!documents || documents.length === 0) {
    throw new Error('No documents found');
  }
  
  const openai = getOpenAIClient();
  const assistantId = process.env.OPENAI_ASSISTANT_ID!;
  
  const fileIds: string[] = [];
  for (const doc of documents) {
    const { data: fileData } = await supabase.storage
      .from('documents')
      .download(doc.file_path);
    
    if (!fileData) continue;
    
    const buffer = Buffer.from(await fileData.arrayBuffer());
    const blob = new Blob([buffer], { type: doc.mime_type || 'application/pdf' });
    const fileToUpload = Object.assign(blob, {
      name: doc.file_name,
      lastModified: Date.now()
    });
    
    const uploadedFile = await openai.files.create({
      file: fileToUpload as any,
      purpose: 'assistants'
    });
    
    fileIds.push(uploadedFile.id);
  }
  
  const thread = await openai.beta.threads.create({
    messages: [{
      role: 'user',
      content: `PASS 1 OF 3: PRIMARY EXTRACTION

Analyze the financial documents for ${companyName}.

FOCUS FOR THIS PASS:
1. Extract 17 core financial metrics
2. Write comprehensive, detailed narrative sections (1500-3500 words EACH)
3. Provide thorough professional analysis

QUALITY OVER SPEED! Take your time to write detailed narratives.

Call extract_primary_valuation_data with your complete analysis.`,
      attachments: fileIds.slice(0, 10).map(id => ({
        file_id: id,
        tools: [{ type: 'file_search' }],
      })),
    }],
  });
  
  if (fileIds.length > 10) {
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: 'Additional documents:',
      attachments: fileIds.slice(10).map(id => ({
        file_id: id,
        tools: [{ type: 'file_search' }],
      })),
    });
  }
  
  const run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id: assistantId,
  });
  
  const { data: currentReport } = await supabase
    .from('reports')
    .select('report_data')
    .eq('id', reportId)
    .single();
  
  const currentData = (currentReport?.report_data as any) || {};
  
  await supabase.from('reports').update({
    report_data: {
      ...currentData,
      extraction_pass: 1,
      pass1_thread_id: thread.id,
      pass1_run_id: run.id,
      openai_file_ids: fileIds,
      pass1_started: new Date().toISOString(),
    }
  } as any).eq('id', reportId);
  
  console.log(`[MULTIPASS] Pass 1 initialized: thread=${thread.id}, run=${run.id}`);
}

async function startPass2(reportId: string, companyName: string, userId: string, supabase: any, reportData: any) {
  console.log(`[MULTIPASS] Initializing Pass 2`);
  
  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('report_id', reportId);
  
  if (!documents || documents.length === 0) {
    throw new Error('No documents found');
  }
  
  const openai = getOpenAIClient();
  const assistantId = process.env.OPENAI_ASSISTANT_ID!;
  
  // Reuse uploaded files from Pass 1
  const fileIds = reportData.openai_file_ids || [];
  
  const thread = await openai.beta.threads.create({
    messages: [{
      role: 'user',
      content: `PASS 2 OF 3: DETAILED FINANCIAL EXTRACTION

Analyze the same documents for ${companyName}.

FOCUS FOR THIS PASS:
Extract detailed financial breakdown:
- All income statement line items
- Complete asset breakdown
- Complete liability breakdown
- Expense categories

Be thorough - extract every number available!

Call extract_detailed_financial_data with report_id="${reportId}" and all financial details.`,
      attachments: fileIds.slice(0, 10).map((id: string) => ({
        file_id: id,
        tools: [{ type: 'file_search' }],
      })),
    }],
  });
  
  if (fileIds.length > 10) {
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: 'Additional documents:',
      attachments: fileIds.slice(10).map((id: string) => ({
        file_id: id,
        tools: [{ type: 'file_search' }],
      })),
    });
  }
  
  const run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id: assistantId,
  });
  
  const { data: currentReport } = await supabase
    .from('reports')
    .select('report_data')
    .eq('id', reportId)
    .single();
  
  const currentData = (currentReport?.report_data as any) || {};
  
  await supabase.from('reports').update({
    report_data: {
      ...currentData,
      pass2_thread_id: thread.id,
      pass2_run_id: run.id,
      pass2_started: new Date().toISOString(),
    }
  } as any).eq('id', reportId);
  
  console.log(`[MULTIPASS] Pass 2 initialized: thread=${thread.id}, run=${run.id}`);
}

async function startPass3(reportId: string, companyName: string, userId: string, supabase: any, reportData: any) {
  console.log(`[MULTIPASS] Initializing Pass 3`);
  
  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('report_id', reportId);
  
  if (!documents || documents.length === 0) {
    throw new Error('No documents found');
  }
  
  const openai = getOpenAIClient();
  const assistantId = process.env.OPENAI_ASSISTANT_ID!;
  
  const fileIds = reportData.openai_file_ids || [];
  
  const thread = await openai.beta.threads.create({
    messages: [{
      role: 'user',
      content: `PASS 3 OF 3: ADVANCED & INDUSTRY-SPECIFIC DATA

Final pass for ${companyName}.

FOCUS FOR THIS PASS:
- Industry-specific items (insurance reserves, etc.)
- Special items (PPP loans, owner loans, pensions)
- Non-recurring items and adjustments
- Customer concentration metrics
- Business characteristics

Hunt for unique details that add value to the analysis!

Call extract_advanced_financial_data with report_id="${reportId}" and all advanced data.`,
      attachments: fileIds.slice(0, 10).map((id: string) => ({
        file_id: id,
        tools: [{ type: 'file_search' }],
      })),
    }],
  });
  
  if (fileIds.length > 10) {
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: 'Additional documents:',
      attachments: fileIds.slice(10).map((id: string) => ({
        file_id: id,
        tools: [{ type: 'file_search' }],
      })),
    });
  }
  
  const run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id: assistantId,
  });
  
  const { data: currentReport } = await supabase
    .from('reports')
    .select('report_data')
    .eq('id', reportId)
    .single();
  
  const currentData = (currentReport?.report_data as any) || {};
  
  await supabase.from('reports').update({
    report_data: {
      ...currentData,
      pass3_thread_id: thread.id,
      pass3_run_id: run.id,
      pass3_started: new Date().toISOString(),
    }
  } as any).eq('id', reportId);
  
  console.log(`[MULTIPASS] Pass 3 initialized: thread=${thread.id}, run=${run.id}`);
}
