/**
 * Claude Business Valuation Processing Route (Skills API)
 *
 * This API route processes uploaded documents using the Anthropic Skills API.
 * It makes a single API call with the PDF skill and custom business-valuation-expert skill.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Supabase client with service role for backend operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Vercel Pro allows up to 5 minutes for serverless functions
export const maxDuration = 300;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const reportId = params.id;
  console.log(`[SKILLS-API] Starting valuation for report ${reportId}`);

  try {
    // ========================================================================
    // 1. Fetch report from database
    // ========================================================================
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      console.error('[SKILLS-API] Report not found:', reportError);
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Check if already completed
    if (report.report_status === 'completed') {
      return NextResponse.json({
        status: 'completed',
        message: 'Report already completed',
        valuation: extractValuationSummary(report.report_data),
      });
    }

    // ========================================================================
    // 2. Update status to processing
    // ========================================================================
    await supabase
      .from('reports')
      .update({
        report_status: 'processing',
        processing_progress: 10,
        processing_message: 'Initializing AI analysis...',
        error_message: null,
      })
      .eq('id', reportId);

    // ========================================================================
    // 3. Get uploaded documents
    // ========================================================================
    const documents = await getDocuments(reportId, report);

    if (documents.length === 0) {
      throw new Error('No documents found for this report');
    }

    console.log(`[SKILLS-API] Found ${documents.length} document(s) to analyze`);

    // ========================================================================
    // 4. Download and convert PDF to base64
    // ========================================================================
    await updateProgress(reportId, 20, 'Loading documents...');

    const primaryDocument = documents[0];
    const pdfBuffer = await downloadDocument(primaryDocument.file_path);
    const pdfBase64 = pdfBuffer.toString('base64');

    console.log(`[SKILLS-API] Loaded document: ${primaryDocument.filename || primaryDocument.file_path} (${pdfBuffer.length} bytes)`);

    // ========================================================================
    // 5. Build Skills API request
    // ========================================================================
    await updateProgress(reportId, 30, 'Analyzing with Claude Skills API...');

    // Build skills array
    const skills: Array<{ type: 'anthropic' | 'custom'; skill_id: string; version: string }> = [
      {
        type: 'anthropic',
        skill_id: 'pdf',
        version: 'latest'
      }
    ];

    // Add custom skill if configured
    if (process.env.BUSINESS_VALUATION_SKILL_ID) {
      skills.push({
        type: 'custom',
        skill_id: process.env.BUSINESS_VALUATION_SKILL_ID,
        version: 'latest'
      });
      console.log('[SKILLS-API] Using custom business-valuation-expert skill');
    } else {
      console.log('[SKILLS-API] No custom skill configured, using built-in prompts');
    }

    const systemPrompt = `You are an expert business valuation analyst. Analyze the provided tax return document and generate a comprehensive business valuation report.

Your analysis must include:
1. **Document Extraction**: Extract all financial data from the tax return (revenue, expenses, assets, liabilities, owner compensation)
2. **Company Overview**: Business name, entity type, industry, NAICS code, location, years in business
3. **Financial Summary**: Revenue trends, profitability metrics, balance sheet summary
4. **Normalized Earnings**: Calculate SDE (Seller's Discretionary Earnings) and EBITDA with appropriate add-backs
5. **Industry Analysis**: Industry context, growth outlook, typical multiples
6. **Risk Assessment**: Score 10 risk factors (1-5 scale), calculate overall risk score
7. **Valuation Approaches**:
   - Asset Approach: Adjusted net asset value
   - Income Approach: Capitalization of earnings with built-up discount rate
   - Market Approach: Apply industry multiples to benefit stream
8. **Valuation Conclusion**: Weight the approaches, apply DLOM, determine fair market value range
9. **Narratives**: Generate detailed narrative sections for each part of the report

Output your complete analysis as a single JSON object with this structure:
{
  "valuation_summary": { valuation_date, business_name, concluded_fair_market_value, value_range: {low, high}, confidence_level, primary_valuation_method },
  "company_overview": { business_name, legal_entity_type, naics_code, industry, location, years_in_business, number_of_employees, business_description },
  "financial_summary": { years_analyzed, revenue_trend: {amounts, growth_rates, cagr}, profitability: {gross_margin_avg, operating_margin_avg, net_margin_avg}, balance_sheet_summary },
  "normalized_earnings": { sde_analysis, ebitda_analysis, benefit_stream_selection },
  "industry_analysis": { industry_name, sector, naics_code, market_size, growth_outlook, competitive_landscape, key_success_factors, industry_multiples },
  "risk_assessment": { overall_risk_score, risk_category, risk_factors: [{factor_name, weight, score, rationale}], multiple_adjustment },
  "valuation_approaches": { asset_approach, income_approach, market_approach },
  "valuation_conclusion": { approach_values, preliminary_value, discounts_applied, concluded_fair_market_value, value_range },
  "narratives": { executive_summary, company_overview, financial_analysis, industry_analysis, risk_assessment, asset_approach_narrative, income_approach_narrative, market_approach_narrative, valuation_synthesis, assumptions_and_limiting_conditions, value_enhancement_recommendations },
  "metadata": { analysis_timestamp, document_types_analyzed, years_of_data, data_quality_score, confidence_metrics }
}

All monetary values should be whole numbers (no cents). Percentages as decimals (0.15 not 15%). Generate detailed narratives (200-500 words each).`;

    // ========================================================================
    // 6. Call Claude Skills API
    // ========================================================================
    console.log('[SKILLS-API] Calling Claude API with Skills...');
    const startTime = Date.now();

    const response = await anthropic.beta.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      betas: [
        'code-execution-2025-08-25',
        'skills-2025-10-02',
        'pdfs-2024-09-25'
      ],
      container: {
        skills: skills as any
      },
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: pdfBase64
              }
            } as any,
            {
              type: 'text',
              text: `Analyze this business tax return and generate a comprehensive valuation report.

Use your business valuation expertise to:
1. Extract all financial data from every page
2. Identify the business entity type and fiscal year(s)
3. Calculate normalized SDE and EBITDA with all appropriate add-backs
4. Conduct thorough risk assessment using the 10-factor framework
5. Apply appropriate industry multiples based on NAICS code
6. Calculate Asset, Income, and Market approach values
7. Weight the approaches and apply appropriate discounts
8. Generate complete valuation report with all narratives

Output as a single valid JSON object. Do not include any text before or after the JSON.`
            }
          ]
        }
      ],
      tools: [{
        type: 'code_execution' as any,
        name: 'code_execution'
      }]
    });

    const processingTime = Date.now() - startTime;
    console.log(`[SKILLS-API] API call completed in ${processingTime}ms`);

    // ========================================================================
    // 7. Extract JSON from response
    // ========================================================================
    await updateProgress(reportId, 70, 'Processing valuation results...');

    let valuationJson: any = null;
    let rawTextContent = '';

    // Extract text content from response
    for (const block of response.content) {
      if (block.type === 'text') {
        rawTextContent += block.text;
      }
    }

    // Try to parse JSON from the response
    try {
      // First try direct parse
      valuationJson = JSON.parse(rawTextContent);
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = rawTextContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        valuationJson = JSON.parse(jsonMatch[1].trim());
      } else {
        // Try to find JSON object in the text
        const jsonStart = rawTextContent.indexOf('{');
        const jsonEnd = rawTextContent.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          valuationJson = JSON.parse(rawTextContent.slice(jsonStart, jsonEnd + 1));
        }
      }
    }

    if (!valuationJson) {
      console.error('[SKILLS-API] Failed to parse JSON from response');
      console.error('[SKILLS-API] Raw response:', rawTextContent.substring(0, 1000));
      throw new Error('Failed to parse valuation JSON from Claude response');
    }

    console.log('[SKILLS-API] Successfully parsed valuation JSON');

    // ========================================================================
    // 8. Map output to database format
    // ========================================================================
    await updateProgress(reportId, 85, 'Saving valuation report...');

    const mappedOutput = mapValuationToDbFormat(valuationJson, report);

    // Add pipeline metadata
    mappedOutput.pipeline_metadata = {
      method: 'skills-api',
      model: 'claude-sonnet-4-20250514',
      processing_time_ms: processingTime,
      input_tokens: response.usage?.input_tokens || 0,
      output_tokens: response.usage?.output_tokens || 0,
      skills_used: skills.map(s => s.skill_id),
      pipeline_version: '3.0',
    };

    // ========================================================================
    // 9. Save complete report to database
    // ========================================================================
    const { error: updateError } = await supabase
      .from('reports')
      .update({
        report_status: 'completed',
        report_data: mappedOutput,
        processing_progress: 100,
        processing_message: 'Valuation complete!',
        completed_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    if (updateError) {
      console.error('[SKILLS-API] Failed to save report:', updateError);
      throw new Error('Failed to save report data');
    }

    const concludedValue = valuationJson.valuation_conclusion?.concluded_fair_market_value ||
      valuationJson.valuation_summary?.concluded_fair_market_value || 0;

    console.log('[SKILLS-API] Report completed successfully!');
    console.log(`[SKILLS-API] Concluded value: $${concludedValue.toLocaleString()}`);

    // ========================================================================
    // 10. Return success response
    // ========================================================================
    return NextResponse.json({
      status: 'completed',
      message: 'Valuation report generated successfully',
      valuation: {
        concluded_value: concludedValue,
        range_low: valuationJson.valuation_conclusion?.value_range?.low || concludedValue * 0.85,
        range_high: valuationJson.valuation_conclusion?.value_range?.high || concludedValue * 1.15,
        confidence: valuationJson.valuation_summary?.confidence_level || 'Medium',
      },
      metrics: {
        processing_time_ms: processingTime,
        input_tokens: response.usage?.input_tokens || 0,
        output_tokens: response.usage?.output_tokens || 0,
      },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during processing';
    console.error('[SKILLS-API] Error:', errorMessage);

    // Update report status to error
    await supabase
      .from('reports')
      .update({
        report_status: 'error',
        error_message: errorMessage,
        processing_progress: 0,
      })
      .eq('id', reportId);

    return NextResponse.json({
      status: 'error',
      error: errorMessage,
    }, { status: 500 });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get documents for a report from various sources
 */
async function getDocuments(reportId: string, report: Record<string, unknown>): Promise<Array<{ file_path: string; filename?: string }>> {
  // Try to get documents from the documents table
  const { data: documents, error } = await supabase
    .from('documents')
    .select('*')
    .eq('report_id', reportId);

  if (!error && documents && documents.length > 0) {
    return documents;
  }

  // Fallback: check if document paths are stored in report
  if (report.document_paths) {
    const paths = typeof report.document_paths === 'string'
      ? JSON.parse(report.document_paths)
      : report.document_paths;

    return (paths as string[]).map((path: string) => ({
      file_path: path,
      filename: path.split('/').pop(),
    }));
  }

  // Check document_ids
  if (report.document_ids) {
    const ids = typeof report.document_ids === 'string'
      ? JSON.parse(report.document_ids)
      : report.document_ids;

    const { data: docs } = await supabase
      .from('documents')
      .select('*')
      .in('id', ids);

    return docs || [];
  }

  return [];
}

/**
 * Download a document from Supabase Storage
 */
async function downloadDocument(filePath: string): Promise<Buffer> {
  // Handle different path formats
  const cleanPath = filePath.replace(/^documents\//, '');

  const { data, error } = await supabase.storage
    .from('documents')
    .download(cleanPath);

  if (error) {
    // Try with original path
    const { data: data2, error: error2 } = await supabase.storage
      .from('documents')
      .download(filePath);

    if (error2) {
      throw new Error(`Failed to download document: ${error.message}`);
    }

    const arrayBuffer = await data2.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Update processing progress in database
 */
async function updateProgress(reportId: string, progress: number, message: string) {
  console.log(`[SKILLS-API] Progress ${progress}%: ${message}`);

  await supabase
    .from('reports')
    .update({
      processing_progress: progress,
      processing_message: message,
    })
    .eq('id', reportId);
}

/**
 * Map Claude Skills API output to the database format expected by PDF generator
 */
function mapValuationToDbFormat(output: any, report: Record<string, unknown>): Record<string, unknown> {
  const vs = output.valuation_summary || {};
  const co = output.company_overview || {};
  const fs = output.financial_summary || {};
  const ne = output.normalized_earnings || {};
  const ia = output.industry_analysis || {};
  const ra = output.risk_assessment || {};
  const va = output.valuation_approaches || {};
  const vc = output.valuation_conclusion || {};
  const narratives = output.narratives || {};

  return {
    // Schema info
    schema_version: '3.0',
    valuation_date: vs.valuation_date || new Date().toISOString().split('T')[0],
    generated_at: new Date().toISOString(),

    // Company Profile
    company_profile: {
      legal_name: co.business_name || report.company_name,
      dba_name: null,
      entity_type: co.legal_entity_type,
      ein: null,
      address: {
        city: co.location?.split(',')[0]?.trim(),
        state: co.location?.split(',')[1]?.trim(),
      },
      industry: {
        naics_code: co.naics_code,
        naics_description: co.industry,
      },
      years_in_business: co.years_in_business,
      number_of_employees: co.number_of_employees,
      business_description: co.business_description,
    },

    // Financial Data
    financial_data: {
      income_statements: (fs.years_analyzed || []).map((year: number, i: number) => ({
        period: year?.toString(),
        revenue: {
          net_revenue: fs.revenue_trend?.amounts?.[i] || 0,
        },
        gross_profit: (fs.revenue_trend?.amounts?.[i] || 0) *
          ((fs.profitability?.gross_margin_avg || 50) / 100),
        net_income: (fs.revenue_trend?.amounts?.[i] || 0) *
          ((fs.profitability?.net_margin_avg || 10) / 100),
      })),
      balance_sheets: [{
        period: fs.years_analyzed?.[fs.years_analyzed.length - 1]?.toString(),
        assets: {
          total_assets: fs.balance_sheet_summary?.total_assets || 0,
        },
        liabilities: {
          total_liabilities: fs.balance_sheet_summary?.total_liabilities || 0,
        },
        equity: {
          total_equity: fs.balance_sheet_summary?.book_value_equity || 0,
        },
      }],
    },

    // Normalized Earnings
    normalized_earnings: {
      sde_calculation: {
        weighted_average_sde: {
          weighted_sde: ne.benefit_stream_selection?.selected_amount ||
            ne.sde_analysis?.weighted_average_sde || 0,
        },
        periods: (ne.sde_analysis?.years || []).map((year: number, i: number) => ({
          period: year?.toString(),
          reported_net_income: ne.sde_analysis?.reported_net_income?.[i] || 0,
          total_adjustments: ne.sde_analysis?.total_add_backs?.[i] || 0,
          adjusted_sde: ne.sde_analysis?.annual_sde?.[i] || 0,
          adjustments: ne.sde_analysis?.add_back_categories || [],
        })),
      },
      ebitda_calculation: {
        weighted_average_ebitda: ne.ebitda_analysis?.weighted_average_ebitda || 0,
        periods: (ne.ebitda_analysis?.years || []).map((year: number, i: number) => ({
          period: year?.toString(),
          adjusted_ebitda: ne.ebitda_analysis?.annual_ebitda?.[i] || 0,
        })),
      },
    },

    // Industry Analysis
    industry_analysis: {
      industry_overview: narratives.industry_analysis || '',
      industry_name: ia.industry_name,
      sector: ia.sector,
      market_size: ia.market_size,
      growth_outlook: ia.growth_outlook,
      competitive_landscape: ia.competitive_landscape,
      key_trends: ia.key_success_factors || [],
    },

    // Risk Assessment
    risk_assessment: {
      overall_risk_score: ra.overall_risk_score || 2.5,
      risk_category: ra.risk_category || 'Average',
      risk_factors: ra.risk_factors || [],
      multiple_adjustment: ra.multiple_adjustment?.base_adjustment || 0,
    },

    // Valuation Approaches
    valuation_approaches: {
      asset_approach: {
        methodology: va.asset_approach?.methodology || 'Adjusted Net Asset Value',
        total_assets: fs.balance_sheet_summary?.total_assets || 0,
        total_liabilities: fs.balance_sheet_summary?.total_liabilities || 0,
        adjusted_net_asset_value: va.asset_approach?.adjusted_net_asset_value || 0,
        adjustments: va.asset_approach?.asset_adjustments || [],
      },
      income_approach: {
        methodology: va.income_approach?.methodology || 'Single-Period Capitalization',
        earnings_base: va.income_approach?.benefit_stream || 'SDE',
        normalized_earnings: va.income_approach?.benefit_stream_amount || 0,
        capitalization_rate: va.income_approach?.capitalization_rate?.capitalization_rate || 0.20,
        multiple_used: va.income_approach?.implied_multiple || 5.0,
        indicated_value: va.income_approach?.indicated_value || 0,
      },
      market_approach: {
        methodology: va.market_approach?.methodology || 'Guideline Transaction Method',
        revenue_base: va.market_approach?.benefit_stream_amount || 0,
        revenue_multiple: va.market_approach?.selected_multiple || 2.0,
        indicated_value: va.market_approach?.indicated_value || 0,
        comparable_data_source: va.market_approach?.multiple_source || 'Industry transaction data',
      },
    },

    // Valuation Synthesis
    valuation_synthesis: {
      approach_summary: [
        {
          approach: 'Asset Approach',
          value: vc.approach_values?.asset_approach?.value || va.asset_approach?.adjusted_net_asset_value || 0,
          weight: vc.approach_values?.asset_approach?.weight || 0.15,
          weighted_value: vc.approach_values?.asset_approach?.weighted_value || 0,
        },
        {
          approach: 'Income Approach',
          value: vc.approach_values?.income_approach?.value || va.income_approach?.indicated_value || 0,
          weight: vc.approach_values?.income_approach?.weight || 0.40,
          weighted_value: vc.approach_values?.income_approach?.weighted_value || 0,
        },
        {
          approach: 'Market Approach',
          value: vc.approach_values?.market_approach?.value || va.market_approach?.indicated_value || 0,
          weight: vc.approach_values?.market_approach?.weight || 0.45,
          weighted_value: vc.approach_values?.market_approach?.weighted_value || 0,
        },
      ],
      preliminary_value: vc.preliminary_value || 0,
      discounts_and_premiums: {
        dlom: vc.discounts_applied?.[0]?.discount_percentage || 0.15,
        dlom_amount: vc.discounts_applied?.[0]?.discount_amount || 0,
      },
      final_valuation: {
        concluded_value: vc.concluded_fair_market_value || vs.concluded_fair_market_value || 0,
        valuation_range_low: vc.value_range?.low || 0,
        valuation_range_high: vc.value_range?.high || 0,
        confidence_level: vs.confidence_level || 'Medium',
        confidence_rationale: vc.value_range?.range_rationale || '',
      },
    },

    // Narratives
    narratives: {
      executive_summary: { content: narratives.executive_summary || '' },
      company_overview: { content: narratives.company_overview || '' },
      financial_analysis: { content: narratives.financial_analysis || '' },
      industry_analysis: { content: narratives.industry_analysis || '' },
      risk_assessment: { content: narratives.risk_assessment || '' },
      asset_approach_narrative: { content: narratives.asset_approach_narrative || '' },
      income_approach_narrative: { content: narratives.income_approach_narrative || '' },
      market_approach_narrative: { content: narratives.market_approach_narrative || '' },
      valuation_synthesis_narrative: { content: narratives.valuation_synthesis || '' },
      assumptions_and_limiting_conditions: { content: narratives.assumptions_and_limiting_conditions || '' },
      value_enhancement_recommendations: { content: narratives.value_enhancement_recommendations || '' },
    },

    // Data Quality
    data_quality: {
      extraction_confidence: output.metadata?.confidence_metrics?.data_quality || 'Medium',
      comparable_quality: output.metadata?.confidence_metrics?.comparable_quality || 'Medium',
      overall_confidence: output.metadata?.confidence_metrics?.overall_confidence || 'Medium',
    },

    // Raw values for compatibility
    annual_revenue: fs.revenue_trend?.amounts?.[fs.revenue_trend.amounts.length - 1] || 0,
    normalized_sde: ne.benefit_stream_selection?.selected_amount ||
      ne.sde_analysis?.weighted_average_sde || 0,
    normalized_ebitda: ne.ebitda_analysis?.weighted_average_ebitda || 0,
    valuation_amount: vc.concluded_fair_market_value || vs.concluded_fair_market_value || 0,
    valuation_range_low: vc.value_range?.low || 0,
    valuation_range_high: vc.value_range?.high || 0,
  };
}

/**
 * Extract valuation summary from existing report data
 */
function extractValuationSummary(reportData: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!reportData) return null;

  const synthesis = reportData.valuation_synthesis as Record<string, unknown> | undefined;
  const finalVal = synthesis?.final_valuation as Record<string, unknown> | undefined;

  if (!finalVal) return null;

  return {
    concluded_value: finalVal.concluded_value,
    range_low: finalVal.valuation_range_low,
    range_high: finalVal.valuation_range_high,
  };
}

/**
 * GET handler for checking processing status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const reportId = params.id;

  const { data: report, error } = await supabase
    .from('reports')
    .select('report_status, processing_progress, processing_message, error_message')
    .eq('id', reportId)
    .single();

  if (error || !report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  return NextResponse.json({
    status: report.report_status,
    progress: report.processing_progress || 0,
    message: report.processing_message || '',
    error: report.error_message,
  });
}
