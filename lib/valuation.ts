/**
 * Valuation Logic - Phase 2 of Valuation Pipeline
 *
 * This module contains the core valuation logic that can be called
 * from both the API route and directly from the orchestrator.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { generateAndStorePDF } from './pdf/auto-generate';

// Lazy-initialize clients to avoid build-time errors
let supabase: SupabaseClient | null = null;
let anthropic: Anthropic | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return supabase;
}

function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
  }
  return anthropic;
}

// Extraction data interface
interface DocumentExtraction {
  id: string;
  document_id: string;
  extracted_data: Record<string, unknown>;
  extraction_status: string;
  created_at: string;
}

// Result type for the exported function
export interface ProcessValuationResult {
  success: boolean;
  status?: string;
  message?: string;
  error?: string;
  valuation?: {
    concluded_value: number;
    range_low: number;
    range_high: number;
    confidence: string;
  };
  metrics?: {
    processing_time_ms: number;
    input_tokens: number;
    output_tokens: number;
    documents_analyzed: number;
  };
}

/**
 * Core valuation logic - can be called directly or from HTTP handler
 */
export async function processValuation(reportId: string): Promise<ProcessValuationResult> {
  console.log(`[VALUATION] Starting Phase 2 valuation for report ${reportId}`);

  try {
    // ========================================================================
    // 1. Fetch report from database
    // ========================================================================
    const { data: report, error: reportError } = await getSupabaseClient()
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      console.error('[VALUATION] Report not found:', reportError);
      return { success: false, error: 'Report not found' };
    }

    // Check if already completed
    if (report.report_status === 'completed') {
      const existingValuation = extractValuationSummary(report.report_data);
      return {
        success: true,
        status: 'completed',
        message: 'Report already completed',
        valuation: existingValuation ? {
          concluded_value: existingValuation.concluded_value as number,
          range_low: existingValuation.range_low as number,
          range_high: existingValuation.range_high as number,
          confidence: 'Medium',
        } : undefined,
      };
    }

    // ========================================================================
    // 2. Fetch all extracted document data
    // ========================================================================
    const { data: extractions, error: extractError } = await getSupabaseClient()
      .from('document_extractions')
      .select('*')
      .eq('report_id', reportId)
      .eq('extraction_status', 'completed');

    if (extractError) {
      console.error('[VALUATION] Error fetching extractions:', extractError);
      return { success: false, error: 'Failed to fetch document extractions' };
    }

    if (!extractions || extractions.length === 0) {
      console.error('[VALUATION] No completed extractions found');
      return {
        success: false,
        error: 'No extracted document data found. Please run document extraction first (Phase 1).',
      };
    }

    console.log(`[VALUATION] Found ${extractions.length} extracted document(s)`);

    // ========================================================================
    // 3. Update status to processing
    // ========================================================================
    await getSupabaseClient()
      .from('reports')
      .update({
        report_status: 'valuating',
        processing_progress: 10,
        processing_message: 'Preparing valuation analysis...',
        error_message: null,
      })
      .eq('id', reportId);

    // ========================================================================
    // 4. Combine all extracted data into context
    // ========================================================================
    await updateProgress(reportId, 20, 'Combining extracted financial data...');

    const combinedContext = buildFinancialContext(extractions as DocumentExtraction[]);
    console.log(`[VALUATION] Built financial context: ${combinedContext.length} characters`);

    // ========================================================================
    // 5. Build Standard Messages API request
    // ========================================================================
    await updateProgress(reportId, 30, 'Initializing valuation model...');

    const systemPrompt = `You are an expert business valuation analyst with deep expertise in small business valuations, financial analysis, and the application of standard valuation methodologies.

You have been provided with PRE-EXTRACTED financial data from tax returns. The data has already been extracted and validated - you do NOT need to read PDFs.

Your task is to perform a comprehensive business valuation analysis using the extracted data.

## VALUATION METHODOLOGY

You will apply three standard valuation approaches:

### 1. Asset Approach (Adjusted Net Asset Value)
- Start with book value of assets from the balance sheet
- Adjust assets to fair market value (receivables, inventory, fixed assets)
- Subtract liabilities at face value
- Result: Adjusted Net Asset Value

### 2. Income Approach (Capitalization of Earnings)
- Calculate Seller's Discretionary Earnings (SDE):
  SDE = Net Income + Owner Compensation + Depreciation + Interest + One-time expenses
- Apply a capitalization rate based on risk (typically 20-33% for small businesses)
- Result: SDE / Cap Rate = Indicated Value

### 3. Market Approach (Comparable Transaction Method)
- Apply industry-appropriate SDE multiples (typically 1.5x - 3.5x for small businesses)
- Adjust multiple based on company-specific risk factors
- Result: SDE × Multiple = Indicated Value

### Risk Assessment Framework
Score each factor 1-5 (1=low risk, 5=high risk):
1. Revenue concentration (customer dependency)
2. Owner dependency
3. Industry outlook
4. Revenue trend/stability
5. Profitability margins
6. Working capital adequacy
7. Asset condition/age
8. Competition level
9. Economic sensitivity
10. Geographic risk

### Final Value Determination
- Weight the three approaches (typically: Asset 15%, Income 40%, Market 45%)
- Apply Discount for Lack of Marketability (DLOM) of 15-25%
- Determine value range (typically +/- 15% of concluded value)

## OUTPUT FORMAT

Output your complete analysis as a single JSON object with this structure:
{
  "valuation_summary": { "valuation_date": "YYYY-MM-DD", "business_name": "", "concluded_fair_market_value": 0, "value_range": {"low": 0, "high": 0}, "confidence_level": "High/Medium/Low", "primary_valuation_method": "" },
  "company_overview": { "business_name": "", "legal_entity_type": "", "naics_code": "", "industry": "", "location": "", "years_in_business": 0, "number_of_employees": 0, "business_description": "" },
  "financial_summary": { "years_analyzed": [], "revenue_trend": {"amounts": [], "growth_rates": [], "cagr": 0}, "profitability": {"gross_margin_avg": 0, "operating_margin_avg": 0, "net_margin_avg": 0}, "balance_sheet_summary": {"total_assets": 0, "total_liabilities": 0, "book_value_equity": 0} },
  "normalized_earnings": { "sde_analysis": {"years": [], "reported_net_income": [], "add_backs": {}, "total_add_backs": [], "annual_sde": [], "weighted_average_sde": 0}, "ebitda_analysis": {"years": [], "annual_ebitda": [], "weighted_average_ebitda": 0}, "benefit_stream_selection": {"selected_metric": "SDE", "selected_amount": 0, "rationale": ""} },
  "industry_analysis": { "industry_name": "", "sector": "", "naics_code": "", "market_size": "", "growth_outlook": "", "competitive_landscape": "", "key_success_factors": [], "industry_multiples": {"sde_multiple_range": {"low": 0, "high": 0}, "revenue_multiple_range": {"low": 0, "high": 0}} },
  "risk_assessment": { "overall_risk_score": 0, "risk_category": "Low/Below Average/Average/Above Average/High", "risk_factors": [{"factor_name": "", "weight": 0, "score": 0, "rationale": ""}], "multiple_adjustment": {"base_adjustment": 0, "rationale": ""} },
  "valuation_approaches": { "asset_approach": {"methodology": "Adjusted Net Asset Value", "total_assets": 0, "asset_adjustments": [], "adjusted_assets": 0, "total_liabilities": 0, "adjusted_net_asset_value": 0}, "income_approach": {"methodology": "Capitalization of Earnings", "benefit_stream": "SDE", "benefit_stream_amount": 0, "capitalization_rate": {"risk_free_rate": 0, "equity_risk_premium": 0, "size_premium": 0, "company_specific_risk": 0, "capitalization_rate": 0}, "implied_multiple": 0, "indicated_value": 0}, "market_approach": {"methodology": "Guideline Transaction Method", "benefit_stream": "SDE", "benefit_stream_amount": 0, "base_multiple": 0, "risk_adjusted_multiple": 0, "selected_multiple": 0, "indicated_value": 0, "multiple_source": ""} },
  "valuation_conclusion": { "approach_values": {"asset_approach": {"value": 0, "weight": 0.15, "weighted_value": 0}, "income_approach": {"value": 0, "weight": 0.40, "weighted_value": 0}, "market_approach": {"value": 0, "weight": 0.45, "weighted_value": 0}}, "preliminary_value": 0, "discounts_applied": [{"discount_type": "DLOM", "discount_percentage": 0, "discount_amount": 0, "rationale": ""}], "concluded_fair_market_value": 0, "value_range": {"low": 0, "high": 0, "range_rationale": ""} },
  "narratives": { "executive_summary": "", "company_overview": "", "financial_analysis": "", "industry_analysis": "", "risk_assessment": "", "asset_approach_narrative": "", "income_approach_narrative": "", "market_approach_narrative": "", "valuation_synthesis": "", "assumptions_and_limiting_conditions": "", "value_enhancement_recommendations": "" },
  "metadata": { "analysis_timestamp": "", "document_types_analyzed": [], "years_of_data": 0, "data_quality_score": "High/Medium/Low", "confidence_metrics": {"data_quality": "", "comparable_quality": "", "overall_confidence": ""} }
}

IMPORTANT RULES:
1. All monetary values should be whole numbers (no cents)
2. Percentages as decimals (0.15 not 15%)
3. Generate detailed narratives (200-500 words each section)
4. Output ONLY the JSON object - no text before or after
5. Ensure all calculations are mathematically consistent`;

    // ========================================================================
    // 6. Call Claude Standard Messages API
    // ========================================================================
    await updateProgress(reportId, 40, 'Performing valuation analysis...');
    console.log('[VALUATION] Calling Claude Standard Messages API...');
    const startTime = Date.now();

    const response = await getAnthropicClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Here is the pre-extracted financial data from ${extractions.length} document(s). Analyze this data and generate a comprehensive business valuation report.

=== EXTRACTED FINANCIAL DATA ===

${combinedContext}

=== END OF EXTRACTED DATA ===

Based on this extracted financial data, please:
1. Synthesize the financial information across all documents/years
2. Calculate normalized SDE (Seller's Discretionary Earnings) and EBITDA with appropriate add-backs
3. Conduct risk assessment using the 10-factor framework (score each 1-5)
4. Apply appropriate industry multiples based on the NAICS code and business type
5. Calculate Asset, Income, and Market approach values
6. Weight the approaches (Asset 15%, Income 40%, Market 45%) and apply DLOM discount
7. Generate complete valuation report with all detailed narratives

Output as a single valid JSON object. Do not include any text before or after the JSON.`
        }
      ]
    });

    const processingTime = Date.now() - startTime;
    console.log(`[VALUATION] API call completed in ${processingTime}ms`);

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
      console.error('[VALUATION] Failed to parse JSON from response');
      console.error('[VALUATION] Raw response:', rawTextContent.substring(0, 1000));
      throw new Error('Failed to parse valuation JSON from Claude response');
    }

    console.log('[VALUATION] Successfully parsed valuation JSON');

    // ========================================================================
    // 8. Map output to database format
    // ========================================================================
    await updateProgress(reportId, 85, 'Saving valuation report...');

    const mappedOutput = mapValuationToDbFormat(valuationJson, report);

    // Add pipeline metadata
    mappedOutput.pipeline_metadata = {
      method: 'two-phase-standard-api',
      phase: 2,
      model: 'claude-sonnet-4-20250514',
      processing_time_ms: processingTime,
      input_tokens: response.usage?.input_tokens || 0,
      output_tokens: response.usage?.output_tokens || 0,
      documents_analyzed: extractions.length,
      pipeline_version: '5.0',
    };

    // Store extraction references
    mappedOutput.extraction_ids = extractions.map((e: DocumentExtraction) => e.id);

    // ========================================================================
    // 9. Save complete report to database
    // ========================================================================
    const { error: updateError } = await getSupabaseClient()
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
      console.error('[VALUATION] Failed to save report:', updateError);
      throw new Error('Failed to save report data');
    }

    const concludedValue = valuationJson.valuation_conclusion?.concluded_fair_market_value ||
      valuationJson.valuation_summary?.concluded_fair_market_value || 0;

    console.log('[VALUATION] Report completed successfully!');
    console.log(`[VALUATION] Concluded value: $${concludedValue.toLocaleString()}`);

    // ========================================================================
    // 10. Generate PDF automatically
    // ========================================================================
    console.log('[VALUATION] Starting automatic PDF generation...');
    const pdfResult = await generateAndStorePDF(
      reportId,
      report.company_name,
      mappedOutput as Record<string, unknown>
    );

    if (pdfResult.success) {
      console.log(`[VALUATION] PDF generated and stored: ${pdfResult.pdfPath}`);
    } else {
      console.warn(`[VALUATION] PDF generation failed (non-blocking): ${pdfResult.error}`);
    }

    // ========================================================================
    // 11. Return success response
    // ========================================================================
    return {
      success: true,
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
        documents_analyzed: extractions.length,
      },
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during processing';
    console.error('[VALUATION] Error:', errorMessage);

    // Update report status to error
    await getSupabaseClient()
      .from('reports')
      .update({
        report_status: 'error',
        error_message: errorMessage,
        processing_progress: 0,
      })
      .eq('id', reportId);

    return {
      success: false,
      status: 'error',
      error: errorMessage,
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build a combined financial context string from all extractions
 */
function buildFinancialContext(extractions: DocumentExtraction[]): string {
  const sections: string[] = [];

  // Sort extractions by tax year if available
  const sortedExtractions = [...extractions].sort((a, b) => {
    const yearA = (a.extracted_data?.tax_year as number) || 0;
    const yearB = (b.extracted_data?.tax_year as number) || 0;
    return yearA - yearB;
  });

  for (let i = 0; i < sortedExtractions.length; i++) {
    const extraction = sortedExtractions[i];
    const data = extraction.extracted_data;

    if (!data) continue;

    const docType = data.document_type || 'Unknown Document';
    const taxYear = data.tax_year || 'Unknown Year';

    sections.push(`--- Document ${i + 1}: ${docType} (Tax Year ${taxYear}) ---`);
    sections.push('');

    // Entity Information
    const entity = data.entity_info as Record<string, unknown> | undefined;
    if (entity) {
      sections.push('ENTITY INFORMATION:');
      sections.push(`  Business Name: ${entity.business_name || 'N/A'}`);
      sections.push(`  EIN: ${entity.ein || 'N/A'}`);
      sections.push(`  Entity Type: ${entity.entity_type || 'N/A'}`);
      sections.push(`  Address: ${entity.address || 'N/A'}`);
      sections.push(`  Fiscal Year End: ${entity.fiscal_year_end || 'N/A'}`);
      sections.push('');
    }

    // Income Statement
    const income = data.income_statement as Record<string, unknown> | undefined;
    if (income) {
      sections.push('INCOME STATEMENT:');
      sections.push(`  Gross Receipts/Sales: $${formatNumber(income.gross_receipts_sales)}`);
      sections.push(`  Returns & Allowances: $${formatNumber(income.returns_allowances)}`);
      sections.push(`  Cost of Goods Sold: $${formatNumber(income.cost_of_goods_sold)}`);
      sections.push(`  Gross Profit: $${formatNumber(income.gross_profit)}`);
      sections.push(`  Total Income: $${formatNumber(income.total_income)}`);
      sections.push(`  Total Deductions: $${formatNumber(income.total_deductions)}`);
      sections.push(`  Taxable Income: $${formatNumber(income.taxable_income)}`);
      sections.push(`  Net Income: $${formatNumber(income.net_income)}`);
      sections.push('');
    }

    // Expenses
    const expenses = data.expenses as Record<string, unknown> | undefined;
    if (expenses) {
      sections.push('EXPENSES BREAKDOWN:');
      sections.push(`  Officer Compensation: $${formatNumber(expenses.compensation_of_officers)}`);
      sections.push(`  Salaries & Wages: $${formatNumber(expenses.salaries_wages)}`);
      sections.push(`  Repairs & Maintenance: $${formatNumber(expenses.repairs_maintenance)}`);
      sections.push(`  Bad Debts: $${formatNumber(expenses.bad_debts)}`);
      sections.push(`  Rents: $${formatNumber(expenses.rents)}`);
      sections.push(`  Taxes & Licenses: $${formatNumber(expenses.taxes_licenses)}`);
      sections.push(`  Interest: $${formatNumber(expenses.interest)}`);
      sections.push(`  Depreciation: $${formatNumber(expenses.depreciation)}`);
      sections.push(`  Advertising: $${formatNumber(expenses.advertising)}`);
      sections.push(`  Pension/Profit Sharing: $${formatNumber(expenses.pension_profit_sharing)}`);
      sections.push(`  Employee Benefits: $${formatNumber(expenses.employee_benefits)}`);
      sections.push(`  Other Deductions: $${formatNumber(expenses.other_deductions)}`);
      sections.push('');
    }

    // Balance Sheet
    const balance = data.balance_sheet as Record<string, unknown> | undefined;
    if (balance) {
      sections.push('BALANCE SHEET:');
      sections.push('  Assets:');
      sections.push(`    Cash: $${formatNumber(balance.cash)}`);
      sections.push(`    Accounts Receivable: $${formatNumber(balance.accounts_receivable)}`);
      sections.push(`    Inventory: $${formatNumber(balance.inventory)}`);
      sections.push(`    Fixed Assets: $${formatNumber(balance.fixed_assets)}`);
      sections.push(`    Accumulated Depreciation: $${formatNumber(balance.accumulated_depreciation)}`);
      sections.push(`    Other Assets: $${formatNumber(balance.other_assets)}`);
      sections.push(`    TOTAL ASSETS: $${formatNumber(balance.total_assets)}`);
      sections.push('  Liabilities:');
      sections.push(`    Accounts Payable: $${formatNumber(balance.accounts_payable)}`);
      sections.push(`    Loans Payable: $${formatNumber(balance.loans_payable)}`);
      sections.push(`    Other Liabilities: $${formatNumber(balance.other_liabilities)}`);
      sections.push(`    TOTAL LIABILITIES: $${formatNumber(balance.total_liabilities)}`);
      sections.push('  Equity:');
      sections.push(`    Retained Earnings: $${formatNumber(balance.retained_earnings)}`);
      sections.push(`    TOTAL EQUITY: $${formatNumber(balance.total_equity)}`);
      sections.push('');
    }

    // Owner Information
    const owner = data.owner_info as Record<string, unknown> | undefined;
    if (owner) {
      sections.push('OWNER INFORMATION:');
      sections.push(`  Owner Compensation: $${formatNumber(owner.owner_compensation)}`);
      sections.push(`  Distributions: $${formatNumber(owner.distributions)}`);
      sections.push(`  Loans to Shareholders: $${formatNumber(owner.loans_to_shareholders)}`);
      sections.push(`  Loans from Shareholders: $${formatNumber(owner.loans_from_shareholders)}`);
      sections.push('');
    }

    // Additional Data
    const additional = data.additional_data as Record<string, unknown> | undefined;
    if (additional) {
      sections.push('ADDITIONAL INFORMATION:');
      sections.push(`  Number of Employees: ${additional.number_of_employees || 'N/A'}`);
      sections.push(`  Accounting Method: ${additional.accounting_method || 'N/A'}`);
      sections.push(`  Business Activity: ${additional.business_activity || 'N/A'}`);
      sections.push(`  NAICS Code: ${additional.naics_code || 'N/A'}`);
      sections.push('');
    }

    // Extraction Notes
    const notes = data.extraction_notes as string[] | undefined;
    if (notes && notes.length > 0) {
      sections.push('EXTRACTION NOTES:');
      notes.forEach(note => sections.push(`  - ${note}`));
      sections.push('');
    }

    sections.push('');
  }

  return sections.join('\n');
}

/**
 * Format a number for display
 */
function formatNumber(value: unknown): string {
  if (value === null || value === undefined) return '0';
  const num = Number(value);
  if (isNaN(num)) return '0';
  return num.toLocaleString();
}

/**
 * Update processing progress in database
 */
async function updateProgress(reportId: string, progress: number, message: string) {
  console.log(`[VALUATION] Progress ${progress}%: ${message}`);

  await getSupabaseClient()
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
    schema_version: '4.0',
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
