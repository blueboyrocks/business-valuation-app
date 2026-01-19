/**
 * Claude Valuation Output Mapper
 * 
 * This module maps the structured output from Claude's valuation tool
 * to the format expected by the existing PDF generator and database schema.
 */

/**
 * Map Claude's valuation output to the format expected by the PDF generator
 */
export function mapClaudeOutputToPdfFormat(claudeOutput: any): any {
  const output = claudeOutput;
  
  // Extract key financial metrics
  const latestIncome = output.financial_data?.income_statements?.[0] || {};
  const latestBalance = output.financial_data?.balance_sheets?.[0] || {};
  
  return {
    // Company Overview
    company_overview: {
      company_name: output.company_profile?.legal_name || '',
      dba_name: output.company_profile?.dba_name || null,
      entity_type: output.company_profile?.entity_type || '',
      ein: output.company_profile?.ein || '',
      address: output.company_profile?.address || {},
      industry_name: output.company_profile?.industry?.naics_description || '',
      naics_code: output.company_profile?.industry?.naics_code || '',
      sic_code: output.company_profile?.industry?.sic_code || '',
      years_in_business: output.company_profile?.years_in_business || null,
      employee_count: output.company_profile?.number_of_employees || null,
      business_description: output.company_profile?.business_description || '',
      location: formatAddress(output.company_profile?.address),
    },

    // Financial Analysis
    financial_analysis: {
      historical_financial_data: mapIncomeStatements(output.financial_data?.income_statements || []),
      key_financial_metrics: {
        revenue: latestIncome.revenue?.net_revenue || 0,
        ebitda: output.normalized_earnings?.ebitda_calculation?.weighted_average_ebitda || 0,
        sde: output.normalized_earnings?.sde_calculation?.weighted_average_sde?.weighted_sde || 0,
        net_income: latestIncome.net_income || 0,
        total_assets: latestBalance.assets?.total_assets || 0,
        total_liabilities: latestBalance.liabilities?.total_liabilities || 0,
        total_equity: latestBalance.equity?.total_equity || 0,
        gross_margin: calculateMargin(
          latestIncome.gross_profit,
          latestIncome.revenue?.net_revenue
        ),
        operating_margin: calculateMargin(
          latestIncome.operating_income,
          latestIncome.revenue?.net_revenue
        ),
        net_margin: calculateMargin(
          latestIncome.net_income,
          latestIncome.revenue?.net_revenue
        ),
      },
      sde_adjustments: mapSdeAdjustments(output.normalized_earnings?.sde_calculation),
      ebitda_calculation: mapEbitdaCalculation(output.normalized_earnings?.ebitda_calculation),
    },

    // Industry Analysis
    industry_analysis: {
      industry_overview: output.industry_analysis?.industry_overview || '',
      market_size: output.industry_analysis?.market_size || '',
      growth_rate: output.industry_analysis?.growth_rate || '',
      growth_outlook: output.industry_analysis?.growth_outlook || 'Stable',
      key_trends: output.industry_analysis?.key_trends || [],
      competitive_landscape: output.industry_analysis?.competitive_landscape || '',
      barriers_to_entry: output.industry_analysis?.barriers_to_entry || 'Medium',
    },

    // Risk Assessment
    risk_assessment: {
      overall_risk_score: output.risk_assessment?.overall_risk_score || 2.5,
      risk_category: output.risk_assessment?.risk_category || 'Average',
      risk_factors: output.risk_assessment?.risk_factors || [],
      multiple_adjustment: output.risk_assessment?.multiple_adjustment || 0,
    },

    // Valuation Approaches
    asset_approach: {
      methodology: output.valuation_approaches?.asset_approach?.methodology || 'Adjusted Net Asset Method',
      total_assets: output.valuation_approaches?.asset_approach?.total_assets || 0,
      total_liabilities: output.valuation_approaches?.asset_approach?.total_liabilities || 0,
      adjusted_net_asset_value: output.valuation_approaches?.asset_approach?.adjusted_net_asset_value || 0,
      adjustments: output.valuation_approaches?.asset_approach?.adjustments || [],
    },

    income_approach: {
      methodology: output.valuation_approaches?.income_approach?.methodology || 'Capitalization of Earnings',
      earnings_base: output.valuation_approaches?.income_approach?.earnings_base || 'SDE',
      normalized_earnings: output.valuation_approaches?.income_approach?.normalized_earnings || 0,
      capitalization_rate: output.valuation_approaches?.income_approach?.capitalization_rate || 0,
      multiple_used: output.valuation_approaches?.income_approach?.multiple_used || 0,
      indicated_value: output.valuation_approaches?.income_approach?.indicated_value || 0,
    },

    market_approach: {
      methodology: output.valuation_approaches?.market_approach?.methodology || 'Guideline Transaction Method',
      revenue_base: output.valuation_approaches?.market_approach?.revenue_base || 0,
      revenue_multiple: output.valuation_approaches?.market_approach?.revenue_multiple || 0,
      indicated_value: output.valuation_approaches?.market_approach?.indicated_value || 0,
      comparable_data_source: output.valuation_approaches?.market_approach?.comparable_data_source || 'Industry transaction data',
    },

    // Valuation Reconciliation
    valuation_reconciliation: {
      approach_weighting: mapApproachWeighting(output.valuation_synthesis?.approach_summary || []),
      preliminary_value: output.valuation_synthesis?.preliminary_value || 0,
      discounts_and_premiums: output.valuation_synthesis?.discounts_and_premiums || {},
      final_valuation: {
        concluded_value: output.valuation_synthesis?.final_valuation?.concluded_value || 0,
        valuation_range_low: output.valuation_synthesis?.final_valuation?.valuation_range_low || 0,
        valuation_range_high: output.valuation_synthesis?.final_valuation?.valuation_range_high || 0,
        confidence_level: output.valuation_synthesis?.final_valuation?.confidence_level || 'Moderate',
        confidence_rationale: output.valuation_synthesis?.final_valuation?.confidence_rationale || '',
      },
    },

    // Narratives
    narratives: {
      executive_summary: output.narratives?.executive_summary?.content || '',
      company_overview: output.narratives?.company_overview?.content || '',
      financial_analysis: output.narratives?.financial_analysis?.content || '',
      industry_analysis: output.narratives?.industry_analysis?.content || '',
      risk_assessment: output.narratives?.risk_assessment?.content || '',
      asset_approach_narrative: output.narratives?.asset_approach_narrative?.content || '',
      income_approach_narrative: output.narratives?.income_approach_narrative?.content || '',
      market_approach_narrative: output.narratives?.market_approach_narrative?.content || '',
      valuation_synthesis_narrative: output.narratives?.valuation_synthesis_narrative?.content || '',
      assumptions_and_limiting_conditions: output.narratives?.assumptions_and_limiting_conditions?.content || '',
      value_enhancement_recommendations: output.narratives?.value_enhancement_recommendations?.content || '',
    },

    // Metadata
    valuation_date: output.valuation_date || new Date().toISOString().split('T')[0],
    generated_at: output.generated_at || new Date().toISOString(),
    schema_version: output.schema_version || '2.0',
    data_quality: output.data_quality || {},
    metadata: output.metadata || {},
  };
}

/**
 * Map to the existing database report_data schema
 */
export function mapClaudeOutputToDbFormat(claudeOutput: any, reportId: string): any {
  const pdfFormat = mapClaudeOutputToPdfFormat(claudeOutput);
  
  // Also include raw financial data for the valuation engine
  const latestIncome = claudeOutput.financial_data?.income_statements?.[0] || {};
  const latestBalance = claudeOutput.financial_data?.balance_sheets?.[0] || {};
  
  return {
    ...pdfFormat,
    
    // Raw extracted values for compatibility with existing code
    annual_revenue: latestIncome.revenue?.net_revenue || 0,
    gross_receipts: latestIncome.revenue?.gross_receipts || 0,
    cost_of_goods_sold: latestIncome.cost_of_goods_sold?.total_cogs || 0,
    gross_profit: latestIncome.gross_profit || 0,
    officer_compensation: latestIncome.operating_expenses?.officer_compensation || 0,
    salaries_and_wages: latestIncome.operating_expenses?.salaries_and_wages || 0,
    rent: latestIncome.operating_expenses?.rent || 0,
    interest_expense: latestIncome.operating_expenses?.interest_expense || 0,
    depreciation: latestIncome.operating_expenses?.depreciation || 0,
    amortization: latestIncome.operating_expenses?.amortization || 0,
    other_deductions: latestIncome.operating_expenses?.other_deductions || 0,
    net_income: latestIncome.net_income || 0,
    pretax_income: latestIncome.net_income || 0, // Use net as pretax for S-corp
    
    total_assets: latestBalance.assets?.total_assets || 0,
    total_liabilities: latestBalance.liabilities?.total_liabilities || 0,
    cash: latestBalance.assets?.current_assets?.cash || 0,
    accounts_receivable: latestBalance.assets?.current_assets?.accounts_receivable || 0,
    inventory: latestBalance.assets?.current_assets?.inventory || 0,
    fixed_assets: latestBalance.assets?.fixed_assets?.net_fixed_assets || 0,
    
    // Calculated values
    normalized_sde: claudeOutput.normalized_earnings?.sde_calculation?.weighted_average_sde?.weighted_sde || 0,
    normalized_ebitda: claudeOutput.normalized_earnings?.ebitda_calculation?.weighted_average_ebitda || 0,
    
    // Approach values
    asset_approach_value: claudeOutput.valuation_approaches?.asset_approach?.adjusted_net_asset_value || 0,
    income_approach_value: claudeOutput.valuation_approaches?.income_approach?.indicated_value || 0,
    market_approach_value: claudeOutput.valuation_approaches?.market_approach?.indicated_value || 0,
    
    // Weights
    asset_approach_weight: findWeight(claudeOutput.valuation_synthesis?.approach_summary, 'Asset'),
    income_approach_weight: findWeight(claudeOutput.valuation_synthesis?.approach_summary, 'Income'),
    market_approach_weight: findWeight(claudeOutput.valuation_synthesis?.approach_summary, 'Market'),
    
    // Final valuation
    valuation_amount: claudeOutput.valuation_synthesis?.final_valuation?.concluded_value || 0,
    valuation_range_low: claudeOutput.valuation_synthesis?.final_valuation?.valuation_range_low || 0,
    valuation_range_high: claudeOutput.valuation_synthesis?.final_valuation?.valuation_range_high || 0,
    
    // Industry
    industry_naics_code: claudeOutput.company_profile?.industry?.naics_code || '',
    industry_name: claudeOutput.company_profile?.industry?.naics_description || '',
    
    // Multiples used
    sde_multiple: claudeOutput.valuation_approaches?.income_approach?.multiple_used || 0,
    revenue_multiple: claudeOutput.valuation_approaches?.market_approach?.revenue_multiple || 0,
  };
}

// Helper functions

function formatAddress(address: any): string {
  if (!address) return '';
  const parts = [address.city, address.state].filter(Boolean);
  return parts.join(', ');
}

function calculateMargin(numerator: number | undefined, denominator: number | undefined): number {
  if (!numerator || !denominator || denominator === 0) return 0;
  return (numerator / denominator) * 100;
}

function mapIncomeStatements(statements: any[]): any[] {
  return statements.map(stmt => ({
    period: stmt.period,
    revenue: stmt.revenue?.net_revenue || 0,
    gross_profit: stmt.gross_profit || 0,
    operating_income: stmt.operating_income || 0,
    net_income: stmt.net_income || 0,
    depreciation: stmt.operating_expenses?.depreciation || 0,
    interest_expense: stmt.operating_expenses?.interest_expense || 0,
    officer_compensation: stmt.operating_expenses?.officer_compensation || 0,
  }));
}

function mapSdeAdjustments(sdeCalc: any): any[] {
  if (!sdeCalc?.periods?.[0]?.adjustments) return [];
  
  return sdeCalc.periods[0].adjustments.map((adj: any) => ({
    category: adj.category,
    description: adj.description,
    amount: adj.amount,
    source: adj.source_line,
  }));
}

function mapEbitdaCalculation(ebitdaCalc: any): any {
  if (!ebitdaCalc?.periods?.[0]) return {};
  
  const period = ebitdaCalc.periods[0];
  return {
    starting_net_income: period.starting_net_income || 0,
    add_interest: period.add_interest || 0,
    add_taxes: period.add_taxes || 0,
    add_depreciation: period.add_depreciation || 0,
    add_amortization: period.add_amortization || 0,
    adjusted_ebitda: period.adjusted_ebitda || 0,
  };
}

function mapApproachWeighting(approaches: any[]): any[] {
  return approaches.map(approach => ({
    approach: approach.approach,
    indicated_value: approach.value,
    weight_assigned: approach.weight,
    weighted_value: approach.weighted_value,
  }));
}

function findWeight(approaches: any[], approachName: string): number {
  if (!approaches) return 0;
  const found = approaches.find(a => 
    a.approach?.toLowerCase().includes(approachName.toLowerCase())
  );
  return found?.weight || 0;
}

/**
 * Validate the Claude output has required fields
 */
export function validateClaudeOutput(output: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Required top-level fields
  if (!output.company_profile?.legal_name) {
    errors.push('Missing company legal name');
  }
  
  if (!output.financial_data?.income_statements?.length) {
    errors.push('Missing income statement data');
  }
  
  if (!output.valuation_synthesis?.final_valuation?.concluded_value) {
    errors.push('Missing concluded valuation');
  }
  
  // Check narratives
  const requiredNarratives = [
    'executive_summary',
    'financial_analysis',
    'valuation_synthesis_narrative',
  ];
  
  for (const narrative of requiredNarratives) {
    if (!output.narratives?.[narrative]?.content) {
      errors.push(`Missing ${narrative} narrative`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
