/**
 * Report Aggregator
 *
 * Aggregates pass outputs into a unified report_data structure.
 * Handles data from all 13 passes including web search enhanced passes.
 */

/**
 * Helper to safely get pass output by number
 */
function getPass(passOutputs: Record<string, unknown>, num: number): Record<string, unknown> {
  return (passOutputs[String(num)] || passOutputs[`pass${num}`] || passOutputs[`pass_${num}`] || {}) as Record<string, unknown>;
}

/**
 * Helper to safely get nested narrative content
 * Handles multiple storage locations:
 * 1. New 11a-11k system: passOutputs.narratives.pass_results['11a'].content
 * 2. New 11a-11k combined: passOutputs.narratives.narratives.key
 * 3. Old Pass 11 system: passOutputs['11'].report_narratives.key
 */
function getNarrative(passData: Record<string, unknown>, key: string): string {
  // First, check if passData has narratives directly (covers old system)
  const narratives = (passData?.narratives || passData?.report_narratives || passData) as Record<string, unknown>;
  const section = narratives?.[key];
  if (typeof section === 'string') return section;
  if (section && typeof section === 'object' && 'content' in section) {
    return (section as { content: string }).content || '';
  }

  // Also check report_narratives for nested structures (old Pass 11 output)
  const reportNarratives = passData?.report_narratives as Record<string, unknown>;
  if (reportNarratives) {
    const reportSection = reportNarratives[key];
    if (typeof reportSection === 'string') return reportSection;
    if (reportSection && typeof reportSection === 'object' && 'content' in reportSection) {
      return (reportSection as { content: string }).content || '';
    }
    // Check nested structures for financial_analysis and valuation_approaches
    if (key === 'financial_analysis' && reportNarratives.financial_analysis) {
      const finAnalysis = reportNarratives.financial_analysis as Record<string, unknown>;
      // Combine sub-sections if they exist
      const parts = ['income_statement_analysis', 'balance_sheet_analysis', 'cash_flow_analysis', 'ratio_analysis', 'trend_analysis'];
      const combined = parts.map(p => {
        const sub = finAnalysis[p];
        if (typeof sub === 'string') return sub;
        if (sub && typeof sub === 'object' && 'content' in sub) return (sub as { content: string }).content;
        return '';
      }).filter(Boolean).join('\n\n');
      if (combined) return combined;
    }
    if (key.includes('approach_narrative') && reportNarratives.valuation_approaches) {
      const valApproaches = reportNarratives.valuation_approaches as Record<string, unknown>;
      const section = valApproaches[key];
      if (typeof section === 'string') return section;
      if (section && typeof section === 'object' && 'content' in section) {
        return (section as { content: string }).content || '';
      }
    }
  }

  return '';
}

/**
 * Helper to get narrative from new 11a-11k pass_results structure
 */
function getNarrativeFromPassResults(passOutputs: Record<string, unknown>, passId: string): string {
  const narrativesWrapper = passOutputs?.narratives as Record<string, unknown>;
  if (!narrativesWrapper) return '';

  // Check pass_results first (individual pass outputs)
  const passResults = narrativesWrapper?.pass_results as Record<string, unknown>;
  if (passResults?.[passId]) {
    const passResult = passResults[passId] as Record<string, unknown>;
    if (typeof passResult?.content === 'string') return passResult.content;
  }

  // Check combined narratives object
  const combinedNarratives = narrativesWrapper?.narratives as Record<string, unknown>;
  if (combinedNarratives) {
    // Map passId to key name
    const keyMap: Record<string, string> = {
      '11a': 'executive_summary',
      '11b': 'company_overview',
      '11c': 'financial_analysis',
      '11d': 'industry_analysis',
      '11e': 'risk_assessment',
      '11f': 'asset_approach_narrative',
      '11g': 'income_approach_narrative',
      '11h': 'market_approach_narrative',
      '11i': 'valuation_synthesis',
      '11j': 'assumptions_limiting_conditions',
      '11k': 'value_enhancement_recommendations',
    };
    const key = keyMap[passId];
    if (key && typeof combinedNarratives[key] === 'string') {
      return combinedNarratives[key] as string;
    }
  }

  return '';
}

/**
 * Helper to get numeric value with fallback
 */
function getNumber(obj: unknown, ...paths: string[]): number {
  for (const path of paths) {
    const parts = path.split('.');
    let value: unknown = obj;
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = (value as Record<string, unknown>)[part];
      } else {
        value = undefined;
        break;
      }
    }
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }
  }
  return 0;
}

/**
 * Aggregate pass outputs into report_data structure
 */
export function aggregatePassOutputsToReportData(
  passOutputs: Record<string, unknown>,
  existingReportData: Record<string, unknown> = {}
): Record<string, unknown> {
  const pass1 = getPass(passOutputs, 1);
  const pass2 = getPass(passOutputs, 2);
  const pass3 = getPass(passOutputs, 3);
  const pass4 = getPass(passOutputs, 4);
  const pass5 = getPass(passOutputs, 5);
  const pass6 = getPass(passOutputs, 6);
  const pass7 = getPass(passOutputs, 7);
  const pass8 = getPass(passOutputs, 8);
  const pass9 = getPass(passOutputs, 9);
  const pass10 = getPass(passOutputs, 10);
  const pass11 = getPass(passOutputs, 11);
  const pass12 = getPass(passOutputs, 12);
  const pass13 = getPass(passOutputs, 13);

  // Get user-provided data (takes priority over extracted data)
  const userProvided = (passOutputs['user_provided'] || {}) as Record<string, unknown>;
  const userIndustry = (userProvided?.industry_classification || {}) as Record<string, unknown>;

  // Get nested objects
  const companyProfile = (pass1?.company_profile || {}) as Record<string, unknown>;
  // User-provided industry takes priority, then Pass 1, then Pass 4
  const industryClass = (userIndustry?.naics_code ? userIndustry : (pass1?.industry_classification || pass4?.industry_classification || {})) as Record<string, unknown>;
  const incomeStatements = (pass2?.income_statements || []) as Record<string, unknown>[];
  const latestIncome = incomeStatements[0] || {};
  const balanceSheets = (pass3?.balance_sheets || []) as Record<string, unknown>[];
  const latestBalance = balanceSheets[0] || {};
  const summary5 = (pass5?.summary || {}) as Record<string, unknown>;
  const riskSummary = (pass6?.risk_summary || {}) as Record<string, unknown>;
  const assetSummary = (pass7?.summary || {}) as Record<string, unknown>;
  const incomeSummary = (pass8?.income_approach || {}) as Record<string, unknown>;
  const marketSummary = (pass9?.market_approach || {}) as Record<string, unknown>;
  const valueSynthesis = (pass10?.value_synthesis || {}) as Record<string, unknown>;
  const conclusion = (pass10?.conclusion || {}) as Record<string, unknown>;
  const economicSnapshot = (pass12?.economic_snapshot || {}) as Record<string, unknown>;
  const interestRates = (pass12?.interest_rates || {}) as Record<string, unknown>;
  const valuationImplications = (pass12?.valuation_implications || {}) as Record<string, unknown>;

  // Extract approach values
  const assetValue = getNumber(pass7, 'summary.adjusted_net_asset_value', 'asset_approach.adjusted_book_value');
  const incomeValue = getNumber(pass8, 'income_approach.indicated_value_point', 'income_approach.single_period_capitalization.adjusted_indicated_value');
  const marketValue = getNumber(pass9, 'market_approach.indicated_value_point', 'market_approach.method_reconciliation.weighted_indicated_value');

  // Get concluded value
  const pass10Concluded = getNumber(pass10, 'conclusion.concluded_value', 'value_synthesis.final_value_point');
  const calculatedValue = pass10Concluded || (assetValue * 0.20 + incomeValue * 0.40 + marketValue * 0.40);
  const concludedValue = calculatedValue > 0 ? Math.round(calculatedValue) : null;

  // Get revenue from income statements
  const revenue = (latestIncome?.revenue || {}) as Record<string, unknown>;
  const annualRevenue = getNumber(latestIncome, 'revenue.total_revenue', 'revenue.gross_receipts', 'revenue.net_sales');

  // Get operating expenses
  const opExpenses = (latestIncome?.operating_expenses || {}) as Record<string, unknown>;

  // Get current assets
  const currentAssets = (latestBalance?.current_assets || {}) as Record<string, unknown>;

  // Get current liabilities
  const currentLiabilities = (latestBalance?.current_liabilities || {}) as Record<string, unknown>;

  // Get long term liabilities
  const longTermLiabilities = (latestBalance?.long_term_liabilities || {}) as Record<string, unknown>;

  // Build aggregated report
  return {
    ...existingReportData,

    // === Company Profile (Pass 1) ===
    company_name: String(companyProfile?.legal_name || existingReportData.company_name || ''),
    entity_type: String(companyProfile?.entity_type || existingReportData.entity_type || ''),
    years_in_business: getNumber(companyProfile, 'years_in_business'),
    business_description: String(companyProfile?.business_description || ''),

    // === Industry (Pass 1 + Pass 4) ===
    industry_name: String(industryClass?.naics_description || existingReportData.industry_name || ''),
    naics_code: String(industryClass?.naics_code || existingReportData.naics_code || ''),
    sic_code: String(industryClass?.sic_code || ''),

    // === Industry Multiples (Pass 4 with web search) ===
    industry_sde_multiple: getNumber(pass4, 'valuation_multiples.sde_multiple.median'),
    industry_ebitda_multiple: getNumber(pass4, 'valuation_multiples.ebitda_multiple.median'),
    industry_revenue_multiple: getNumber(pass4, 'valuation_multiples.revenue_multiple.median'),
    industry_overview: pass4?.industry_overview || existingReportData.industry_overview,
    industry_benchmarks: pass4?.industry_benchmarks || existingReportData.industry_benchmarks,

    // === Comparable Transactions (Pass 13) ===
    comparable_transactions: (pass13?.comparable_transactions as unknown[]) || existingReportData.comparable_transactions || [],
    transaction_summary: pass13?.transaction_summary || existingReportData.transaction_summary,
    market_commentary: pass13?.market_commentary || existingReportData.market_commentary,

    // === Economic Conditions (Pass 12) ===
    economic_conditions: {
      risk_free_rate: getNumber(interestRates, '20_year_treasury.current') ||
                      getNumber(valuationImplications, 'risk_free_rate_recommendation') ||
                      (existingReportData.economic_conditions as Record<string, unknown>)?.risk_free_rate || 0.045,
      prime_rate: getNumber(interestRates, 'prime_rate.current'),
      inflation_rate: getNumber(pass12, 'inflation.cpi_annual.current'),
      market_conditions: pass12?.valuation_market_conditions,
      data_date: String(economicSnapshot?.as_of_date || ''),
    },

    // === Financial Data (Pass 2, 3, 5) ===
    annual_revenue: annualRevenue,
    gross_profit: getNumber(latestIncome, 'gross_profit'),
    operating_income: getNumber(latestIncome, 'operating_income'),
    pretax_income: getNumber(latestIncome, 'pretax_income'),
    net_income: getNumber(latestIncome, 'net_income'),

    // Normalized earnings
    normalized_sde: getNumber(summary5, 'weighted_average_sde', 'most_recent_sde'),
    normalized_ebitda: getNumber(summary5, 'most_recent_ebitda'),

    // Compensation
    owner_compensation: getNumber(pass5, 'sde_calculations.0.add_backs.owner_compensation.amount') ||
                        getNumber(opExpenses, 'officer_compensation'),
    officer_compensation: getNumber(opExpenses, 'officer_compensation'),

    // Other income items
    interest_expense: getNumber(opExpenses, 'interest_expense') || getNumber(latestIncome, 'interest_expense'),
    depreciation_amortization: getNumber(opExpenses, 'depreciation') + getNumber(opExpenses, 'amortization'),

    // === Balance Sheet (Pass 3) ===
    cash: getNumber(currentAssets, 'cash_and_equivalents', 'cash'),
    accounts_receivable: getNumber(currentAssets, 'accounts_receivable_net', 'accounts_receivable'),
    inventory: getNumber(currentAssets, 'inventory'),
    other_current_assets: getNumber(currentAssets, 'other_current_assets'),
    total_current_assets: getNumber(currentAssets, 'total_current_assets') || getNumber(latestBalance, 'current_assets.total_current_assets'),
    fixed_assets: getNumber(latestBalance, 'fixed_assets.net_fixed_assets', 'fixed_assets.total_fixed_assets'),
    intangible_assets: getNumber(latestBalance, 'other_assets.net_intangibles', 'other_assets.intangible_assets'),
    total_assets: getNumber(latestBalance, 'total_assets'),

    accounts_payable: getNumber(currentLiabilities, 'accounts_payable'),
    other_short_term_liabilities: getNumber(currentLiabilities, 'total_current_liabilities') - getNumber(currentLiabilities, 'accounts_payable'),
    total_current_liabilities: getNumber(currentLiabilities, 'total_current_liabilities') || getNumber(latestBalance, 'current_liabilities.total_current_liabilities'),
    bank_loans: getNumber(longTermLiabilities, 'notes_payable_long_term'),
    other_long_term_liabilities: getNumber(longTermLiabilities, 'total_long_term_liabilities'),
    total_liabilities: getNumber(latestBalance, 'total_liabilities'),
    total_equity: getNumber(latestBalance, 'equity.total_equity'),

    // Working capital
    working_capital: (pass3?.key_metrics as Record<string, unknown>)?.most_recent_working_capital ||
                     getNumber(currentAssets, 'total_current_assets') - getNumber(currentLiabilities, 'total_current_liabilities'),

    // === Risk Data (Pass 6) ===
    risk_score: getNumber(riskSummary, 'overall_risk_score'),
    overall_risk_score: getNumber(riskSummary, 'overall_risk_score'),
    overall_risk_level: String(riskSummary?.overall_risk_level || 'average'),
    discount_rate: getNumber(pass6, 'risk_premium_calculation.total_discount_rate'),
    capitalization_rate: getNumber(pass6, 'risk_premium_calculation.capitalization_rate'),

    // === Valuation Results (Pass 7, 8, 9, 10) ===
    asset_approach_value: assetValue,
    income_approach_value: incomeValue,
    market_approach_value: marketValue,

    // Approach weights
    asset_approach_weight: getNumber(valueSynthesis, 'approach_summaries.0.weight') || 0.20,
    income_approach_weight: getNumber(valueSynthesis, 'approach_summaries.1.weight') || 0.40,
    market_approach_weight: getNumber(valueSynthesis, 'approach_summaries.2.weight') || 0.40,

    // Liquidation value - check multiple paths
    liquidation_value: getNumber(pass7,
      'summary.orderly_liquidation_value',
      'asset_approach.orderly_liquidation_value.value',
      'orderly_liquidation_value.value',
      'orderly_liquidation_value'
    ) || (assetValue > 0 ? Math.round(assetValue * 0.65) : null),

    // === Valuation Summary ===
    valuation_amount: concludedValue,
    valuation_method: 'Weighted Multi-Approach',
    confidence_level: String(conclusion?.confidence_level || 'Moderate'),
    value_range_low: getNumber(conclusion, 'value_range.low') || (concludedValue ? Math.round(concludedValue * 0.85) : 0),
    value_range_high: getNumber(conclusion, 'value_range.high') || (concludedValue ? Math.round(concludedValue * 1.15) : 0),
    standard_of_value: 'Fair Market Value',
    premise_of_value: String(conclusion?.premise_of_value || 'going_concern'),

    // Value drivers and risks
    key_value_drivers: pass10?.key_value_drivers || [],
    key_risks_to_value: pass10?.key_risks_to_value || [],

    // === ALL 11 NARRATIVES ===
    // Try new 11a-11k system first, then fall back to old Pass 11 system
    executive_summary: getNarrativeFromPassResults(passOutputs, '11a') || getNarrative(pass11, 'executive_summary'),
    company_profile: getNarrativeFromPassResults(passOutputs, '11b') || getNarrative(pass11, 'company_overview'),
    financial_analysis: getNarrativeFromPassResults(passOutputs, '11c') || getNarrative(pass11, 'financial_analysis'),
    industry_analysis: getNarrativeFromPassResults(passOutputs, '11d') || getNarrative(pass11, 'industry_analysis') || getNarrative(pass4, 'narrative'),
    risk_assessment: getNarrativeFromPassResults(passOutputs, '11e') || getNarrative(pass11, 'risk_assessment') || getNarrative(pass6, 'narrative'),
    asset_approach_analysis: getNarrativeFromPassResults(passOutputs, '11f') || getNarrative(pass11, 'asset_approach_narrative') || getNarrative(pass7, 'narrative'),
    income_approach_analysis: getNarrativeFromPassResults(passOutputs, '11g') || getNarrative(pass11, 'income_approach_narrative') || getNarrative(pass8, 'narrative'),
    market_approach_analysis: getNarrativeFromPassResults(passOutputs, '11h') || getNarrative(pass11, 'market_approach_narrative') || getNarrative(pass9, 'narrative'),
    valuation_reconciliation: getNarrativeFromPassResults(passOutputs, '11i') || getNarrative(pass11, 'valuation_synthesis') || getNarrative(pass10, 'narrative'),
    assumptions_limiting_conditions: getNarrativeFromPassResults(passOutputs, '11j') || getNarrative(pass11, 'assumptions_limiting_conditions'),
    strategic_insights: getNarrativeFromPassResults(passOutputs, '11k') || getNarrative(pass11, 'value_enhancement_recommendations'),
    recommendations: getNarrativeFromPassResults(passOutputs, '11k') || getNarrative(pass11, 'value_enhancement_recommendations'),

    // Nested narratives object for components that expect this structure
    narratives: {
      executive_summary: getNarrativeFromPassResults(passOutputs, '11a') || getNarrative(pass11, 'executive_summary'),
      company_overview: getNarrativeFromPassResults(passOutputs, '11b') || getNarrative(pass11, 'company_overview'),
      financial_analysis: getNarrativeFromPassResults(passOutputs, '11c') || getNarrative(pass11, 'financial_analysis'),
      industry_analysis: getNarrativeFromPassResults(passOutputs, '11d') || getNarrative(pass11, 'industry_analysis') || getNarrative(pass4, 'narrative'),
      risk_assessment: getNarrativeFromPassResults(passOutputs, '11e') || getNarrative(pass11, 'risk_assessment') || getNarrative(pass6, 'narrative'),
      asset_approach_narrative: getNarrativeFromPassResults(passOutputs, '11f') || getNarrative(pass11, 'asset_approach_narrative') || getNarrative(pass7, 'narrative'),
      income_approach_narrative: getNarrativeFromPassResults(passOutputs, '11g') || getNarrative(pass11, 'income_approach_narrative') || getNarrative(pass8, 'narrative'),
      market_approach_narrative: getNarrativeFromPassResults(passOutputs, '11h') || getNarrative(pass11, 'market_approach_narrative') || getNarrative(pass9, 'narrative'),
      valuation_synthesis: getNarrativeFromPassResults(passOutputs, '11i') || getNarrative(pass11, 'valuation_synthesis') || getNarrative(pass10, 'narrative'),
      assumptions_limiting_conditions: getNarrativeFromPassResults(passOutputs, '11j') || getNarrative(pass11, 'assumptions_limiting_conditions'),
      value_enhancement_recommendations: getNarrativeFromPassResults(passOutputs, '11k') || getNarrative(pass11, 'value_enhancement_recommendations'),
      // Also include strategic_insights for backwards compatibility
      strategic_insights: getNarrativeFromPassResults(passOutputs, '11k') || getNarrative(pass11, 'value_enhancement_recommendations'),
    },

    // === Word counts for quality checking ===
    pass11_word_counts: pass11?.word_counts,

    // === Data sources ===
    industry_data_sources: pass4?.sources_cited || [],
    comparable_data_sources: pass13?.sources || [],
    economic_data_sources: pass12?.sources || [],

    // === Data Quality (Pass 12) ===
    quality_score: getNumber(pass12, 'quality_summary.overall_quality_score', 'quality_score') ||
                   (existingReportData.quality_score as number) || 0,
    quality_grade: String(
      (pass12?.quality_summary as Record<string, unknown>)?.quality_grade ||
      pass12?.quality_grade ||
      existingReportData.quality_grade ||
      'N/A'
    ),
    data_completeness: (pass12?.quality_summary as Record<string, unknown>)?.completeness_score ||
                       (pass12?.data_completeness as Record<string, unknown>) ||
                       existingReportData.data_completeness,
    quality_issues: (pass12?.issues_found as unknown[]) ||
                    (pass12?.quality_summary as Record<string, unknown>)?.issues ||
                    existingReportData.quality_issues || [],
    quality_recommendations: (pass12?.recommendations as unknown[]) ||
                             (pass12?.quality_summary as Record<string, unknown>)?.recommendations ||
                             existingReportData.quality_recommendations || [],
  };
}
