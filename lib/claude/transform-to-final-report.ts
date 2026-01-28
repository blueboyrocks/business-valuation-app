/**
 * Transform Pass Outputs to Final Valuation Report
 *
 * This module transforms the 12-pass internal outputs into the
 * authoritative FinalValuationReport schema that matches OUTPUT_SCHEMA.md.
 */

import {
  FinalValuationReport,
  CompanyProfileFinal,
  FinancialDataFinal,
  IncomeStatementFinal,
  BalanceSheetFinal,
  NormalizedEarningsFinal,
  SDEPeriodFinal,
  SDEAdjustmentFinal,
  EBITDAPeriodFinal,
  IndustryAnalysisFinal,
  RiskAssessmentFinal,
  RiskFactorFinal,
  KPIAnalysisFinal,
  ValuationApproachesFinal,
  AssetAdjustmentFinal,
  LiabilityAdjustmentFinal,
  ValuationSynthesisFinal,
  ApproachSummaryFinal,
  NarrativesFinal,
  NarrativeSection,
  DataQualityFinal,
  MetadataFinal,
  NARRATIVE_WORD_TARGETS,
} from './final-report-schema';

import {
  Pass1Output,
  Pass2Output,
  Pass3Output,
  Pass4Output,
  Pass5Output,
  Pass6Output,
  Pass7Output,
  Pass8Output,
  Pass9Output,
  Pass10Output,
  Pass11Output,
  Pass12Output,
} from './types-v2';

// =============================================================================
// MAIN TRANSFORM FUNCTION
// =============================================================================

export interface PassOutputs {
  pass1: Pass1Output;
  pass2: Pass2Output;
  pass3: Pass3Output;
  pass4: Pass4Output;
  pass5: Pass5Output;
  pass6: Pass6Output;
  pass7: Pass7Output;
  pass8: Pass8Output;
  pass9: Pass9Output;
  pass10: Pass10Output;
  pass11: Pass11Output;
  pass12: Pass12Output;
}

/**
 * Transform all 12 pass outputs into the final FinalValuationReport schema.
 * This function maps internal structures to the authoritative output format.
 */
export function transformToFinalReport(
  passes: PassOutputs,
  valuationDate: string
): FinalValuationReport {
  return {
    schema_version: '2.0',
    valuation_date: valuationDate,
    generated_at: new Date().toISOString(),

    company_profile: transformCompanyProfile(passes.pass1),
    financial_data: transformFinancialData(passes.pass1, passes.pass2, passes.pass3),
    normalized_earnings: transformNormalizedEarnings(passes.pass5),
    industry_analysis: transformIndustryAnalysis(passes.pass4),
    risk_assessment: transformRiskAssessment(passes.pass6),
    kpi_analysis: transformKPIAnalysis(passes.pass2, passes.pass3, passes.pass5),
    valuation_approaches: transformValuationApproaches(passes.pass7, passes.pass8, passes.pass9),
    valuation_synthesis: transformValuationSynthesis(passes.pass10, passes.pass3),
    narratives: transformNarratives(passes.pass11, passes.pass6, passes.pass7, passes.pass8, passes.pass9),
    data_quality: transformDataQuality(passes.pass1, passes.pass12),
    metadata: transformMetadata(passes.pass1, passes.pass12),
  };
}

// =============================================================================
// COMPANY PROFILE TRANSFORM
// =============================================================================

function transformCompanyProfile(pass1: Pass1Output): CompanyProfileFinal {
  const profile = pass1?.company_profile || {} as any;
  const industry = pass1?.industry_classification || {} as any;
  const docInfo = pass1?.document_info || {} as any;

  // Map entity type to schema format
  const entityTypeMap: Record<string, CompanyProfileFinal['entity_type']> = {
    's_corp': 'S-Corporation',
    'c_corp': 'C-Corporation',
    'partnership': 'Partnership',
    'sole_proprietorship': 'Sole Proprietorship',
    'llc': 'LLC',
  };

  // Map tax form type
  const taxFormMap: Record<string, CompanyProfileFinal['tax_form_type']> = {
    'tax_return_1120s': '1120-S',
    'tax_return_1120': '1120',
    'tax_return_1065': '1065',
    'tax_return_schedule_c': 'Schedule C',
  };

  return {
    legal_name: profile.legal_name,
    dba_name: profile.dba_names?.[0] || null,
    entity_type: entityTypeMap[pass1.ownership_info?.ownership_type || ''] || 'LLC',
    tax_form_type: taxFormMap[docInfo.document_type] || '1120-S',
    ein: profile.ein || null,
    address: {
      street: profile.business_address?.street || null,
      city: profile.business_address?.city || null,
      state: profile.business_address?.state || null,
      zip: profile.business_address?.zip || null,
    },
    fiscal_year_end: docInfo.fiscal_year_end || '12-31',
    years_in_business: profile.years_in_business || null,
    number_of_employees: profile.number_of_employees?.total_fte || null,
    industry: {
      naics_code: industry.naics_code,
      naics_description: industry.naics_description,
      sic_code: industry.sic_code || null,
      industry_sector: industry.industry_sector,
      industry_subsector: industry.industry_subsector,
    },
    business_description: profile.business_description,
  };
}

// =============================================================================
// FINANCIAL DATA TRANSFORM
// =============================================================================

function transformFinancialData(
  pass1: Pass1Output,
  pass2: Pass2Output,
  pass3: Pass3Output
): FinancialDataFinal {
  const incomeStatements = pass2?.income_statements || [];
  const balanceSheets = pass3?.balance_sheets || [];
  const periods = incomeStatements.map(is => String(is.fiscal_year));

  return {
    periods_analyzed: periods,
    currency: 'USD',
    income_statements: incomeStatements.map(transformIncomeStatement),
    balance_sheets: balanceSheets.map(transformBalanceSheet),
  };
}

function transformIncomeStatement(is: Pass2Output['income_statements'][0]): IncomeStatementFinal {
  return {
    period: String(is.fiscal_year),
    source_document: is.statement_type === 'calendar' ? 'Form 1120-S' : 'Financial Statement',
    revenue: {
      gross_receipts: is.revenue.gross_sales,
      returns_and_allowances: is.revenue.returns_allowances,
      net_revenue: is.revenue.net_sales,
    },
    cost_of_goods_sold: {
      beginning_inventory: is.cost_of_goods_sold.beginning_inventory || 0,
      purchases: is.cost_of_goods_sold.purchases || 0,
      labor: is.cost_of_goods_sold.labor || 0,
      other_costs: is.cost_of_goods_sold.other_costs || 0,
      ending_inventory: is.cost_of_goods_sold.ending_inventory || 0,
      total_cogs: is.cost_of_goods_sold.total_cogs,
    },
    gross_profit: is.gross_profit,
    operating_expenses: {
      officer_compensation: is.operating_expenses.officer_compensation,
      salaries_and_wages: is.operating_expenses.compensation_wages,
      repairs_and_maintenance: is.operating_expenses.repairs_maintenance,
      bad_debts: is.operating_expenses.bad_debt,
      rent: is.operating_expenses.rent_lease,
      taxes_and_licenses: 0, // Not in current schema
      interest_expense: is.other_income_expense?.interest_expense || 0,
      depreciation: is.operating_expenses.depreciation,
      amortization: is.operating_expenses.amortization,
      advertising: is.operating_expenses.advertising_marketing,
      pension_and_profit_sharing: 0, // Not in current schema
      employee_benefits: is.operating_expenses.employee_benefits,
      other_deductions: is.operating_expenses.other_expenses,
      total_operating_expenses: is.operating_expenses.total_operating_expenses,
    },
    operating_income: is.operating_income,
    other_income: is.other_income_expense?.other_income || 0,
    other_expenses: is.other_income_expense?.other_expense || 0,
    net_income_before_tax: is.pretax_income,
    income_tax_expense: is.income_tax_expense,
    net_income: is.net_income,
  };
}

function transformBalanceSheet(bs: Pass3Output['balance_sheets'][0]): BalanceSheetFinal {
  return {
    period: String(bs.fiscal_year),
    source_document: 'Schedule L',
    assets: {
      current_assets: {
        cash: bs.current_assets.cash_and_equivalents,
        accounts_receivable: bs.current_assets.accounts_receivable_gross,
        allowance_for_doubtful_accounts: bs.current_assets.allowance_doubtful_accounts,
        inventory: bs.current_assets.inventory,
        prepaid_expenses: bs.current_assets.prepaid_expenses,
        other_current_assets: bs.current_assets.other_current_assets,
        total_current_assets: bs.current_assets.total_current_assets,
      },
      fixed_assets: {
        land: bs.fixed_assets.land,
        buildings: bs.fixed_assets.buildings,
        machinery_and_equipment: bs.fixed_assets.machinery_equipment,
        furniture_and_fixtures: bs.fixed_assets.furniture_fixtures,
        vehicles: bs.fixed_assets.vehicles,
        leasehold_improvements: bs.fixed_assets.leasehold_improvements,
        accumulated_depreciation: bs.fixed_assets.accumulated_depreciation,
        net_fixed_assets: bs.fixed_assets.net_fixed_assets,
      },
      other_assets: {
        intangible_assets: bs.other_assets.intangible_assets,
        goodwill: bs.other_assets.goodwill,
        other: bs.other_assets.other_long_term_assets,
        total_other_assets: bs.other_assets.total_other_assets,
      },
      total_assets: bs.total_assets,
    },
    liabilities: {
      current_liabilities: {
        accounts_payable: bs.current_liabilities.accounts_payable,
        accrued_expenses: bs.current_liabilities.accrued_expenses,
        current_portion_long_term_debt: bs.current_liabilities.current_portion_long_term_debt,
        other_current_liabilities: bs.current_liabilities.other_current_liabilities,
        total_current_liabilities: bs.current_liabilities.total_current_liabilities,
      },
      long_term_liabilities: {
        notes_payable: bs.long_term_liabilities.notes_payable_long_term,
        mortgages: bs.long_term_liabilities.mortgage_payable,
        shareholder_loans: bs.long_term_liabilities.due_to_shareholders,
        other_long_term_liabilities: bs.long_term_liabilities.other_long_term_liabilities,
        total_long_term_liabilities: bs.long_term_liabilities.total_long_term_liabilities,
      },
      total_liabilities: bs.total_liabilities,
    },
    equity: {
      common_stock: bs.equity.common_stock,
      additional_paid_in_capital: bs.equity.additional_paid_in_capital,
      retained_earnings: bs.equity.retained_earnings,
      treasury_stock: bs.equity.treasury_stock,
      total_equity: bs.equity.total_equity,
    },
  };
}

// =============================================================================
// NORMALIZED EARNINGS TRANSFORM
// =============================================================================

function transformNormalizedEarnings(pass5: Pass5Output): NormalizedEarningsFinal {
  const sdeCalculations = pass5?.sde_calculations || [];
  const ebitdaCalculations = pass5?.ebitda_calculations || [];
  const summary = pass5?.summary || {};

  return {
    methodology_notes: pass5?.normalization_confidence?.major_assumptions?.join('; ') ||
      'Normalized using standard SDE and EBITDA methodologies.',
    sde_calculation: {
      periods: sdeCalculations.map(transformSDEPeriod),
      weighted_average_sde: {
        calculation_method: summary.sde_weighting_method === 'recent_weighted'
          ? '3-year weighted average (3x most recent, 2x prior, 1x earliest)'
          : 'Equal weighted average',
        weights: summary.sde_weights?.map(w => w.weight) || [1, 1, 1],
        weighted_sde: summary.weighted_average_sde || 0,
      },
    },
    ebitda_calculation: {
      periods: ebitdaCalculations.map(transformEBITDAPeriod),
      weighted_average_ebitda: summary.weighted_average_ebitda || 0,
    },
  };
}

function transformSDEPeriod(sde: Pass5Output['sde_calculations'][0]): SDEPeriodFinal {
  // Flatten all adjustments into a single array
  const adjustments: SDEAdjustmentFinal[] = [];

  // Add interest expense
  if (sde.add_backs.interest_expense?.amount) {
    adjustments.push({
      category: 'Interest Expense',
      description: sde.add_backs.interest_expense.description,
      amount: sde.add_backs.interest_expense.amount,
      source_line: sde.add_backs.interest_expense.source?.line_item || 'Interest Expense',
    });
  }

  // Add depreciation
  if (sde.add_backs.depreciation?.amount) {
    adjustments.push({
      category: 'Depreciation',
      description: sde.add_backs.depreciation.description,
      amount: sde.add_backs.depreciation.amount,
      source_line: sde.add_backs.depreciation.source?.line_item || 'Depreciation',
    });
  }

  // Add amortization
  if (sde.add_backs.amortization?.amount) {
    adjustments.push({
      category: 'Amortization',
      description: sde.add_backs.amortization.description,
      amount: sde.add_backs.amortization.amount,
      source_line: sde.add_backs.amortization.source?.line_item || 'Amortization',
    });
  }

  // Add owner compensation
  if (sde.add_backs.owner_compensation?.amount) {
    adjustments.push({
      category: 'Officer Compensation',
      description: sde.add_backs.owner_compensation.description,
      amount: sde.add_backs.owner_compensation.amount,
      source_line: sde.add_backs.owner_compensation.source?.line_item || 'Officer Compensation',
    });
  }

  // Add owner benefits
  if (sde.add_backs.owner_benefits?.amount) {
    adjustments.push({
      category: 'Owner Benefits',
      description: sde.add_backs.owner_benefits.description,
      amount: sde.add_backs.owner_benefits.amount,
      source_line: sde.add_backs.owner_benefits.source?.line_item || 'Employee Benefits',
    });
  }

  // Add owner perks
  if (sde.add_backs.owner_perks?.amount) {
    adjustments.push({
      category: 'Owner Perks',
      description: sde.add_backs.owner_perks.description,
      amount: sde.add_backs.owner_perks.amount,
      source_line: sde.add_backs.owner_perks.source?.line_item || 'Other Deductions',
    });
  }

  // Add one-time expenses
  sde.add_backs.one_time_expenses?.forEach(item => {
    adjustments.push({
      category: 'Non-Recurring',
      description: item.description,
      amount: item.amount,
      source_line: item.source?.line_item || 'Other Deductions',
    });
  });

  // Add discretionary expenses
  sde.add_backs.discretionary_expenses?.forEach(item => {
    adjustments.push({
      category: 'Discretionary',
      description: item.description,
      amount: item.amount,
      source_line: item.source?.line_item || 'Other Deductions',
    });
  });

  return {
    period: String(sde.fiscal_year),
    starting_net_income: sde.reported_net_income,
    adjustments,
    total_adjustments: sde.add_backs.total_add_backs - (sde.deductions?.total_deductions || 0),
    sde: sde.calculated_sde,
  };
}

function transformEBITDAPeriod(ebitda: Pass5Output['ebitda_calculations'][0]): EBITDAPeriodFinal {
  return {
    period: String(ebitda.fiscal_year),
    starting_net_income: ebitda.reported_net_income,
    add_interest: ebitda.interest_expense,
    add_taxes: ebitda.income_tax_expense,
    add_depreciation: ebitda.depreciation,
    add_amortization: ebitda.amortization,
    owner_compensation_adjustment: {
      actual_owner_compensation: 0, // Would need to get from pass2
      fair_market_replacement_salary: 0,
      adjustment_amount: ebitda.total_adjustments,
    },
    other_normalizing_adjustments: ebitda.total_adjustments,
    adjusted_ebitda: ebitda.adjusted_ebitda,
  };
}

// =============================================================================
// INDUSTRY ANALYSIS TRANSFORM
// =============================================================================

function transformIndustryAnalysis(pass4: Pass4Output): IndustryAnalysisFinal {
  const overview = pass4?.industry_overview || {} as any;
  const benchmarks = pass4?.industry_benchmarks || {} as any;
  const multiples = pass4?.valuation_multiples || {} as any;

  // Map growth outlook
  const growthOutlookMap: Record<string, IndustryAnalysisFinal['growth_outlook']> = {
    'emerging': 'Growing',
    'growth': 'Growing',
    'mature': 'Stable',
    'declining': 'Declining',
  };

  // Map barriers to entry
  const barriersMap: Record<string, IndustryAnalysisFinal['barriers_to_entry']> = {
    'low': 'Low',
    'medium': 'Medium',
    'high': 'High',
  };

  return {
    industry_overview: overview.future_outlook || '',
    market_size: overview.market_size?.us_market_size
      ? `$${(overview.market_size.us_market_size / 1000000000).toFixed(1)}B`
      : 'N/A',
    growth_rate: `${((overview.market_growth?.projected_growth_rate || 0) * 100).toFixed(1)}%`,
    growth_outlook: growthOutlookMap[overview.industry_lifecycle] || 'Stable',
    key_trends: overview.current_trends?.map(t => t.trend) || [],
    competitive_landscape: overview.key_success_factors?.join('. ') || '',
    barriers_to_entry: barriersMap[overview.capital_intensity] || 'Medium',
    regulatory_environment: overview.regulation_level || 'Medium',
    technology_impact: overview.technology_dependence || 'Medium',
    industry_benchmarks: {
      gross_margin_benchmark: {
        low: benchmarks.profitability_benchmarks?.gross_margin?.quartile_25 || 0,
        median: benchmarks.profitability_benchmarks?.gross_margin?.median || 0,
        high: benchmarks.profitability_benchmarks?.gross_margin?.quartile_75 || 0,
      },
      operating_margin_benchmark: {
        low: benchmarks.profitability_benchmarks?.operating_margin?.quartile_25 || 0,
        median: benchmarks.profitability_benchmarks?.operating_margin?.median || 0,
        high: benchmarks.profitability_benchmarks?.operating_margin?.quartile_75 || 0,
      },
      revenue_per_employee_benchmark: {
        low: benchmarks.revenue_benchmarks?.revenue_per_employee_median * 0.7 || 0,
        median: benchmarks.revenue_benchmarks?.revenue_per_employee_median || 0,
        high: benchmarks.revenue_benchmarks?.revenue_per_employee_median * 1.3 || 0,
      },
    },
    valuation_multiples: {
      sde_multiple_range: {
        low: multiples.transaction_multiples?.sde_multiple?.low || 0,
        median: multiples.transaction_multiples?.sde_multiple?.median || 0,
        high: multiples.transaction_multiples?.sde_multiple?.high || 0,
      },
      ebitda_multiple_range: {
        low: multiples.transaction_multiples?.ebitda_multiple?.low || 0,
        median: multiples.transaction_multiples?.ebitda_multiple?.median || 0,
        high: multiples.transaction_multiples?.ebitda_multiple?.high || 0,
      },
      revenue_multiple_range: {
        low: multiples.transaction_multiples?.revenue_multiple?.low || 0,
        median: multiples.transaction_multiples?.revenue_multiple?.median || 0,
        high: multiples.transaction_multiples?.revenue_multiple?.high || 0,
      },
      multiple_source: multiples.transaction_multiples?.source || 'Industry transaction data',
      multiple_selection_rationale: 'Multiple selected based on company size, profitability, and risk profile relative to industry transactions.',
    },
  };
}

// =============================================================================
// RISK ASSESSMENT TRANSFORM
// =============================================================================

function transformRiskAssessment(pass6: Pass6Output): RiskAssessmentFinal {
  // Add null checks for pass6 sub-objects
  const companyRisks = pass6?.company_risks || {} as any;
  const riskSummary = pass6?.risk_summary || {} as any;
  const companyStrengths = pass6?.company_strengths || {} as any;
  const multipleAdj = pass6?.multiple_adjustment || {} as any;

  // Map risk level to schema format
  const riskLevelMap: Record<string, RiskAssessmentFinal['overall_risk_rating']> = {
    'low': 'Low',
    'below_average': 'Low',
    'average': 'Moderate',
    'above_average': 'High',
    'high': 'Very High',
  };

  // Extract risk factors from the detailed assessment
  const riskFactors: RiskFactorFinal[] = [];

  // Customer Concentration
  if (companyRisks.operational_risks?.customer_concentration_risk) {
    const risk = companyRisks.operational_risks.customer_concentration_risk;
    riskFactors.push(transformRiskFactor('Customer Concentration', risk));
  }

  // Owner Dependence
  if (companyRisks.operational_risks?.owner_dependence_risk) {
    const risk = companyRisks.operational_risks.owner_dependence_risk;
    riskFactors.push(transformRiskFactor('Owner Dependence', risk));
  }

  // Industry Risk
  if (companyRisks.strategic_risks?.industry_risk) {
    const risk = companyRisks.strategic_risks.industry_risk;
    riskFactors.push(transformRiskFactor('Industry Risk', risk));
  }

  // Financial Risk (use profitability as proxy)
  if (companyRisks.financial_risks?.profitability_risk) {
    const risk = companyRisks.financial_risks.profitability_risk;
    riskFactors.push(transformRiskFactor('Financial Risk', risk));
  }

  // Operational Risk (use facility risk as proxy)
  if (companyRisks.operational_risks?.facility_risk) {
    const risk = companyRisks.operational_risks.facility_risk;
    riskFactors.push(transformRiskFactor('Operational Risk', risk));
  }

  // Market/Economic Risk
  if (companyRisks.external_risks?.economic_sensitivity_risk) {
    const risk = companyRisks.external_risks.economic_sensitivity_risk;
    riskFactors.push(transformRiskFactor('Market/Economic Risk', risk));
  }

  return {
    overall_risk_rating: riskLevelMap[riskSummary.overall_risk_level] || 'Moderate',
    overall_risk_score: riskSummary.overall_risk_score || 50,
    risk_factors: riskFactors,
    company_specific_risks: riskSummary.top_risk_factors?.map((rf: any) => rf.description) || [],
    company_specific_strengths: companyStrengths.strengths?.map((s: any) => s.strength) || [],
    risk_adjusted_multiple: {
      base_multiple: multipleAdj.base_multiple || 0,
      total_risk_adjustment: (1 - (multipleAdj.risk_adjustment_factor || 1)),
      adjusted_multiple: multipleAdj.adjusted_multiple || 0,
    },
  };
}

function transformRiskFactor(category: string, risk: { score: number; description: string; impact: string; mitigation_factors?: string[] }): RiskFactorFinal {
  // Map score to rating
  let rating: RiskFactorFinal['rating'] = 'Moderate';
  if (risk.score <= 3) rating = 'Low';
  else if (risk.score <= 5) rating = 'Moderate';
  else if (risk.score <= 7) rating = 'High';
  else rating = 'Critical';

  // Calculate impact on multiple based on score
  const impactOnMultiple = -(risk.score / 100); // e.g., score of 5 = -5% adjustment

  return {
    category,
    rating,
    score: risk.score,
    description: risk.description,
    mitigation: risk.mitigation_factors?.join('; ') || 'N/A',
    impact_on_multiple: impactOnMultiple,
  };
}

// =============================================================================
// KPI ANALYSIS TRANSFORM
// =============================================================================

function transformKPIAnalysis(
  pass2: Pass2Output,
  pass3: Pass3Output,
  pass5: Pass5Output
): KPIAnalysisFinal {
  const incomeStatements = pass2?.income_statements || [];
  const balanceSheets = pass3?.balance_sheets || [];
  const mostRecent = incomeStatements[0] || {} as any;
  const priorYear = incomeStatements[1] || {} as any;
  const mostRecentBS = balanceSheets[0] || {} as any;

  const revenue = mostRecent?.revenue?.total_revenue || 0;
  const grossProfit = mostRecent?.gross_profit || 0;
  const operatingIncome = mostRecent?.operating_income || 0;
  const netIncome = mostRecent?.net_income || 0;

  const grossMargin = revenue ? grossProfit / revenue : 0;
  const operatingMargin = revenue ? operatingIncome / revenue : 0;
  const netMargin = revenue ? netIncome / revenue : 0;
  const sdeMargin = revenue ? (pass5.summary?.most_recent_sde || 0) / revenue : 0;
  const ebitdaMargin = revenue ? (pass5.summary?.most_recent_ebitda || 0) / revenue : 0;

  // Calculate ratios
  const currentAssets = mostRecentBS?.current_assets?.total_current_assets || 0;
  const currentLiabilities = mostRecentBS?.current_liabilities?.total_current_liabilities || 1;
  const inventory = mostRecentBS?.current_assets?.inventory || 0;
  const totalAssets = mostRecentBS?.total_assets || 1;
  const totalLiabilities = mostRecentBS?.total_liabilities || 0;
  const equity = mostRecentBS?.equity?.total_equity || 1;

  const currentRatio = currentLiabilities ? currentAssets / currentLiabilities : 0;
  const quickRatio = currentLiabilities ? (currentAssets - inventory) / currentLiabilities : 0;
  const workingCapital = currentAssets - currentLiabilities;
  const debtToEquity = equity ? totalLiabilities / equity : 0;
  const debtToAssets = totalAssets ? totalLiabilities / totalAssets : 0;

  // Calculate growth
  const priorRevenue = priorYear?.revenue?.total_revenue || revenue;
  const revenueGrowth = priorRevenue ? ((revenue - priorRevenue) / priorRevenue) : 0;

  return {
    profitability_metrics: {
      gross_profit_margin: {
        value: grossMargin,
        trend: pass2.trend_analysis?.profitability_trend === 'improving' ? 'Improving' :
               pass2.trend_analysis?.profitability_trend === 'declining' ? 'Declining' : 'Stable',
        vs_industry: 'At', // Would need industry comparison
        industry_percentile: 50,
      },
      operating_profit_margin: {
        value: operatingMargin,
        trend: 'Stable',
        vs_industry: 'At',
        industry_percentile: 50,
      },
      net_profit_margin: {
        value: netMargin,
        trend: 'Stable',
        vs_industry: 'At',
        industry_percentile: 50,
      },
      sde_margin: {
        value: sdeMargin,
        trend: pass5.summary?.sde_trend === 'growing' ? 'Improving' :
               pass5.summary?.sde_trend === 'declining' ? 'Declining' : 'Stable',
        vs_industry: 'At',
      },
      ebitda_margin: {
        value: ebitdaMargin,
        trend: pass5.summary?.ebitda_trend === 'growing' ? 'Improving' :
               pass5.summary?.ebitda_trend === 'declining' ? 'Declining' : 'Stable',
        vs_industry: 'At',
      },
    },
    liquidity_metrics: {
      current_ratio: {
        value: currentRatio,
        interpretation: currentRatio >= 2 ? 'Strong liquidity' :
                       currentRatio >= 1 ? 'Adequate liquidity' : 'Potential liquidity concerns',
        vs_industry: 'At',
      },
      quick_ratio: {
        value: quickRatio,
        interpretation: quickRatio >= 1 ? 'Strong quick liquidity' : 'Relies on inventory for liquidity',
        vs_industry: 'At',
      },
      working_capital: {
        value: workingCapital,
        as_percentage_of_revenue: revenue ? (workingCapital / revenue) : 0,
      },
    },
    efficiency_metrics: {
      revenue_per_employee: {
        value: pass2.key_metrics?.revenue_per_employee || 0,
        vs_industry: 'At',
      },
      inventory_turnover: {
        value: inventory ? (mostRecent?.cost_of_goods_sold?.total_cogs || 0) / inventory : 0,
        days_inventory: inventory && mostRecent?.cost_of_goods_sold?.total_cogs
          ? Math.round(365 / ((mostRecent.cost_of_goods_sold.total_cogs || 1) / inventory))
          : 0,
      },
      receivables_turnover: {
        value: mostRecentBS?.current_assets?.accounts_receivable_gross
          ? revenue / mostRecentBS.current_assets.accounts_receivable_gross
          : 0,
        days_sales_outstanding: mostRecentBS?.current_assets?.accounts_receivable_gross && revenue
          ? Math.round(365 / (revenue / mostRecentBS.current_assets.accounts_receivable_gross))
          : 0,
      },
      asset_turnover: {
        value: totalAssets ? revenue / totalAssets : 0,
      },
    },
    leverage_metrics: {
      debt_to_equity: {
        value: debtToEquity,
        interpretation: debtToEquity <= 0.5 ? 'Low leverage' :
                       debtToEquity <= 1 ? 'Moderate leverage' : 'High leverage',
      },
      debt_to_assets: {
        value: debtToAssets,
      },
      interest_coverage_ratio: {
        value: mostRecent?.other_income_expense?.interest_expense
          ? operatingIncome / mostRecent.other_income_expense.interest_expense
          : 999,
        interpretation: 'N/A',
      },
    },
    growth_metrics: {
      revenue_growth_yoy: [
        {
          period: `${mostRecent?.fiscal_year || 'Current'} vs ${priorYear?.fiscal_year || 'Prior'}`,
          value: revenueGrowth,
        },
      ],
      revenue_cagr_3yr: pass2.trend_analysis?.revenue_cagr || 0,
      sde_growth_yoy: pass5.summary?.sde_cagr || 0,
      employee_growth: 0,
    },
  };
}

// =============================================================================
// VALUATION APPROACHES TRANSFORM
// =============================================================================

function transformValuationApproaches(
  pass7: Pass7Output,
  pass8: Pass8Output,
  pass9: Pass9Output
): ValuationApproachesFinal {
  return {
    asset_approach: transformAssetApproach(pass7),
    income_approach: transformIncomeApproach(pass8),
    market_approach: transformMarketApproach(pass9),
  };
}

function transformAssetApproach(pass7: Pass7Output): ValuationApproachesFinal['asset_approach'] {
  const asset = pass7?.asset_approach || {} as any;
  const assetAdj = asset.asset_adjustments || {} as any;
  const liabilityAdj = asset.liability_adjustments || {} as any;

  // Flatten asset adjustments
  const assetAdjustments: AssetAdjustmentFinal[] = [];

  if (assetAdj.receivables_adjustment) {
    assetAdjustments.push({
      asset: 'Accounts Receivable',
      book_value: assetAdj.receivables_adjustment.book_value || 0,
      fair_market_value: assetAdj.receivables_adjustment.fair_market_value || 0,
      adjustment: assetAdj.receivables_adjustment.adjustment_amount || 0,
      rationale: assetAdj.receivables_adjustment.adjustment_rationale || '',
    });
  }

  if (assetAdj.inventory_adjustment) {
    assetAdjustments.push({
      asset: 'Inventory',
      book_value: assetAdj.inventory_adjustment.book_value || 0,
      fair_market_value: assetAdj.inventory_adjustment.fair_market_value || 0,
      adjustment: assetAdj.inventory_adjustment.adjustment_amount || 0,
      rationale: assetAdj.inventory_adjustment.adjustment_rationale || '',
    });
  }

  if (assetAdj.equipment_adjustment) {
    assetAdjustments.push({
      asset: 'Fixed Assets',
      book_value: assetAdj.equipment_adjustment.book_value || 0,
      fair_market_value: assetAdj.equipment_adjustment.fair_market_value || 0,
      adjustment: assetAdj.equipment_adjustment.adjustment_amount || 0,
      rationale: assetAdj.equipment_adjustment.adjustment_rationale || '',
    });
  }

  // Liability adjustments
  const liabilityAdjustments: LiabilityAdjustmentFinal[] = [];

  liabilityAdj.contingent_liabilities?.forEach((adj: any) => {
    liabilityAdjustments.push({
      liability: adj.asset_description,
      book_value: adj.book_value,
      fair_market_value: adj.fair_market_value,
      adjustment: adj.adjustment_amount,
      rationale: adj.adjustment_rationale,
    });
  });

  return {
    methodology: 'Adjusted Net Asset Method',
    applicable: true,
    applicability_rationale: pass7.narrative?.content?.substring(0, 200) || 'Asset approach applied as floor value.',
    book_value_of_equity: asset.book_value_equity,
    asset_adjustments: assetAdjustments,
    liability_adjustments: liabilityAdjustments,
    total_asset_adjustments: asset.total_asset_adjustments,
    total_liability_adjustments: asset.total_liability_adjustments,
    adjusted_net_asset_value: asset.adjusted_book_value,
    weight_assigned: (pass7.weighting_recommendation?.suggested_weight || 15) / 100,
    weight_rationale: pass7.weighting_recommendation?.rationale || 'Asset approach weighted as floor value.',
  };
}

function transformIncomeApproach(pass8: Pass8Output): ValuationApproachesFinal['income_approach'] {
  const income = pass8?.income_approach || {} as any;
  const capRate = income.capitalization_rate_buildup || {} as any;

  return {
    methodology: 'Capitalization of Earnings',
    applicable: true,
    applicability_rationale: 'Income approach appropriate for profitable operating business.',
    benefit_stream_used: income.single_period_capitalization?.benefit_stream_type === 'sde' ? 'SDE' : 'EBITDA',
    benefit_stream_value: income.single_period_capitalization?.benefit_stream_value || 0,
    benefit_stream_rationale: 'Benefit stream selected based on typical buyer profile for business of this size.',
    capitalization_rate: {
      risk_free_rate: capRate?.risk_free_rate?.rate || 0,
      equity_risk_premium: capRate?.equity_risk_premium?.rate || 0,
      size_premium: capRate?.size_premium?.rate || 0,
      industry_risk_premium: capRate?.industry_risk_premium?.rate || 0,
      company_specific_risk_premium: capRate?.company_specific_risk_premium?.rate || 0,
      total_discount_rate: capRate?.total_discount_rate || 0,
      long_term_growth_rate: capRate?.long_term_growth_rate?.rate || 0,
      capitalization_rate: capRate?.capitalization_rate || 0,
    },
    income_approach_value: income.single_period_capitalization?.adjusted_indicated_value || 0,
    weight_assigned: (pass8.weighting_recommendation?.suggested_weight || 45) / 100,
    weight_rationale: pass8.weighting_recommendation?.rationale || 'Income approach weighted as primary indicator.',
  };
}

function transformMarketApproach(pass9: Pass9Output): ValuationApproachesFinal['market_approach'] {
  const market = pass9?.market_approach || {} as any;
  const gtm = market.guideline_transaction_method || {} as any;

  return {
    methodology: 'Guideline Transaction Method',
    applicable: true,
    applicability_rationale: 'Market approach provides direct market evidence of value.',
    comparable_transactions: {
      source: gtm?.method_name || 'Industry transaction databases',
      number_of_comparables: gtm?.transactions_or_companies?.length || 0,
      selection_criteria: 'Transactions selected based on industry, size, and recency.',
      comparable_summary: gtm?.transactions_or_companies?.slice(0, 5).map((t: any) => ({
        industry: t?.industry || 'Similar Industry',
        revenue_range: 'Comparable size',
        sde_multiple: gtm?.multiples_median || 0,
        ebitda_multiple: 0,
      })) || [],
    },
    multiple_applied: {
      type: gtm?.multiple_type === 'sde' ? 'SDE Multiple' :
            gtm?.multiple_type === 'ebitda' ? 'EBITDA Multiple' : 'Revenue Multiple',
      base_multiple: gtm?.multiples_median || 0,
      adjustments: [],
      adjusted_multiple: gtm?.selected_multiple || 0,
    },
    benefit_stream_value: gtm?.benefit_stream_applied || 0,
    market_approach_value: market.indicated_value_point,
    weight_assigned: (pass9.weighting_recommendation?.suggested_weight || 40) / 100,
    weight_rationale: pass9.weighting_recommendation?.rationale || 'Market approach weighted based on transaction data quality.',
  };
}

// =============================================================================
// VALUATION SYNTHESIS TRANSFORM
// =============================================================================

function transformValuationSynthesis(
  pass10: Pass10Output,
  pass3: Pass3Output
): ValuationSynthesisFinal {
  const synthesis = pass10?.value_synthesis || {};
  const conclusion = pass10?.conclusion || {};
  const approachSummaries = synthesis.approach_summaries || [];
  const valueRange = conclusion.value_range || { low: 0, high: 0 };

  return {
    approach_summary: approachSummaries.map(a => ({
      approach: a.approach_name === 'asset' ? 'Asset Approach' :
                a.approach_name === 'income' ? 'Income Approach' : 'Market Approach',
      value: a.indicated_value_point || 0,
      weight: a.weight || 0,
      weighted_value: a.weighted_value || 0,
    })),
    preliminary_value: synthesis.preliminary_value_point || 0,
    discounts_and_premiums: {
      dlom: {
        applicable: synthesis.discounts_premiums?.some(dp => dp.name.toLowerCase().includes('marketability')) || false,
        percentage: synthesis.discounts_premiums?.find(dp => dp.name.toLowerCase().includes('marketability'))?.rate || 0,
        rationale: synthesis.discounts_premiums?.find(dp => dp.name.toLowerCase().includes('marketability'))?.rationale || 'N/A',
      },
      dloc: {
        applicable: synthesis.discounts_premiums?.some(dp => dp.name.toLowerCase().includes('control')) || false,
        percentage: synthesis.discounts_premiums?.find(dp => dp.name.toLowerCase().includes('control'))?.rate || 0,
        rationale: synthesis.discounts_premiums?.find(dp => dp.name.toLowerCase().includes('control'))?.rationale || 'N/A',
      },
      control_premium: {
        applicable: false,
        percentage: 0,
        rationale: 'Not applicable for 100% interest',
      },
      other_adjustments: synthesis.discounts_premiums
        ?.filter(dp => !dp.name.toLowerCase().includes('marketability') && !dp.name.toLowerCase().includes('control'))
        ?.map(dp => ({
          name: dp.name,
          percentage: dp.rate,
          rationale: dp.rationale,
        })) || [],
      total_discount_premium: synthesis.total_discount_premium_adjustment || 0,
    },
    final_valuation: {
      concluded_value: conclusion.concluded_value || 0,
      valuation_range_low: valueRange.low || 0,
      valuation_range_high: valueRange.high || 0,
      confidence_level: conclusion.confidence_level === 'high' ? 'High' :
                       conclusion.confidence_level === 'low' ? 'Low' : 'Moderate',
      confidence_rationale: conclusion.confidence_rationale || '',
    },
    working_capital_analysis: {
      normal_working_capital: pass3?.key_metrics?.most_recent_working_capital || 0,
      actual_working_capital: pass3?.working_capital_analysis?.[0]?.net_working_capital || 0,
      working_capital_adjustment: (pass3?.working_capital_analysis?.[0]?.net_working_capital || 0) -
                                  (pass3?.key_metrics?.most_recent_working_capital || 0),
      notes: 'Working capital normalized to industry standard percentage of revenue.',
    },
  };
}

// =============================================================================
// NARRATIVES TRANSFORM
// =============================================================================

function transformNarratives(
  pass11: Pass11Output,
  pass6: Pass6Output,
  pass7: Pass7Output,
  pass8: Pass8Output,
  pass9: Pass9Output
): NarrativesFinal {
  const narratives = pass11?.report_narratives || {} as any;

  // Build value enhancement content from Pass 6's value drivers and risk mitigants
  const valueDrivers = pass6?.company_strengths?.value_drivers || [];
  const riskMitigants = pass6?.risk_summary?.key_risk_mitigants || [];
  const strengths = pass6?.company_strengths?.strengths || [];

  let valueEnhancementContent = '';
  if (valueDrivers.length > 0 || riskMitigants.length > 0 || strengths.length > 0) {
    const sections: string[] = [];

    if (valueDrivers.length > 0) {
      sections.push('## Key Value Drivers\n\n' + valueDrivers.map(d =>
        `**${d.driver}** (${d.importance}): ${d.description} - Current performance: ${d.current_performance}`
      ).join('\n\n'));
    }

    if (strengths.length > 0) {
      sections.push('## Company Strengths\n\n' + strengths.map(s =>
        `**${s.strength}** (${s.category}): ${s.description}`
      ).join('\n\n'));
    }

    if (riskMitigants.length > 0) {
      sections.push('## Risk Mitigation Strategies\n\n' + riskMitigants.map(m =>
        `- ${m}`
      ).join('\n'));
    }

    valueEnhancementContent = sections.join('\n\n');
  }

  return {
    executive_summary: {
      word_count_target: NARRATIVE_WORD_TARGETS.executive_summary,
      content: narratives.executive_summary?.content || '',
    },
    company_overview: {
      word_count_target: NARRATIVE_WORD_TARGETS.company_overview,
      content: narratives.company_overview?.content || '',
    },
    financial_analysis: {
      word_count_target: NARRATIVE_WORD_TARGETS.financial_analysis,
      content: [
        narratives.financial_analysis?.income_statement_analysis?.content || '',
        narratives.financial_analysis?.balance_sheet_analysis?.content || '',
        narratives.financial_analysis?.ratio_analysis?.content || '',
      ].filter(Boolean).join('\n\n'),
    },
    industry_analysis: {
      word_count_target: NARRATIVE_WORD_TARGETS.industry_analysis,
      content: narratives.industry_analysis?.content || '',
    },
    risk_assessment: {
      word_count_target: NARRATIVE_WORD_TARGETS.risk_assessment,
      content: narratives.risk_assessment?.content || '',
    },
    asset_approach_narrative: {
      word_count_target: NARRATIVE_WORD_TARGETS.asset_approach_narrative,
      content: narratives.valuation_approaches?.asset_approach_narrative?.content ||
               pass7.narrative?.content || '',
    },
    income_approach_narrative: {
      word_count_target: NARRATIVE_WORD_TARGETS.income_approach_narrative,
      content: narratives.valuation_approaches?.income_approach_narrative?.content ||
               pass8.narrative?.content || '',
    },
    market_approach_narrative: {
      word_count_target: NARRATIVE_WORD_TARGETS.market_approach_narrative,
      content: narratives.valuation_approaches?.market_approach_narrative?.content ||
               pass9.narrative?.content || '',
    },
    valuation_synthesis_narrative: {
      word_count_target: NARRATIVE_WORD_TARGETS.valuation_synthesis_narrative,
      content: narratives.valuation_approaches?.synthesis_narrative?.content || '',
    },
    assumptions_and_limiting_conditions: {
      word_count_target: NARRATIVE_WORD_TARGETS.assumptions_and_limiting_conditions,
      content: narratives.conclusion_and_limiting_conditions?.content || '',
    },
    value_enhancement_recommendations: {
      word_count_target: NARRATIVE_WORD_TARGETS.value_enhancement_recommendations,
      content: valueEnhancementContent,
    },
  };
}

// =============================================================================
// DATA QUALITY TRANSFORM
// =============================================================================

function transformDataQuality(pass1: Pass1Output, pass12: Pass12Output): DataQualityFinal {
  const quality = pass1?.data_quality_assessment || {};
  const documentInfo = pass1?.document_info || {};
  const missingCriticalData = quality.missing_critical_data || [];

  // Map extraction quality to confidence
  const confidenceMap: Record<string, DataQualityFinal['extraction_confidence']> = {
    'excellent': 'High',
    'good': 'High',
    'fair': 'Moderate',
    'poor': 'Low',
  };

  return {
    extraction_confidence: confidenceMap[documentInfo.extraction_quality || ''] || 'Moderate',
    data_completeness_score: quality.completeness_score || 0,
    missing_data_flags: missingCriticalData.map(field => ({
      field,
      impact: 'May affect valuation accuracy',
      assumption_made: quality.assumptions_required?.find(a => a.includes(field)) || 'Standard industry assumptions applied',
    })),
    data_quality_notes: quality.data_limitations?.join('. ') || '',
    recommendations_for_improvement: pass12?.report_status?.warnings || [],
  };
}

// =============================================================================
// METADATA TRANSFORM
// =============================================================================

function transformMetadata(pass1: Pass1Output, pass12: Pass12Output): MetadataFinal {
  const documentInfo = pass1?.document_info || {};
  const qualitySummary = pass12?.quality_summary || {};

  return {
    documents_analyzed: [{
      filename: documentInfo.document_type || 'Unknown',
      document_type: documentInfo.document_subtype || documentInfo.document_type || 'Unknown',
      tax_year: String(documentInfo.tax_year || new Date().getFullYear()),
      pages: documentInfo.pages_analyzed || 0,
    }],
    processing_notes: `Quality Grade: ${qualitySummary.quality_grade || 'N/A'}. ` +
                      `Checks passed: ${qualitySummary.passed_checks || 0}/${qualitySummary.total_checks || 0}.`,
    analyst_notes: pass12?.report_status?.review_notes?.join('; ') || '',
  };
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate that the final report meets all schema requirements.
 */
export function validateFinalReport(report: FinalValuationReport): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required field checks
  if (!report.company_profile.legal_name) {
    errors.push('Missing required field: company_profile.legal_name');
  }

  if (!report.company_profile.industry.naics_code) {
    errors.push('Missing required field: company_profile.industry.naics_code');
  }

  if (report.financial_data.income_statements.length === 0) {
    errors.push('At least one income statement is required');
  }

  if (!report.valuation_synthesis.final_valuation.concluded_value) {
    errors.push('Missing required field: valuation_synthesis.final_valuation.concluded_value');
  }

  // Validation rules
  const weights = report.valuation_approaches;
  const totalWeight =
    weights.asset_approach.weight_assigned +
    weights.income_approach.weight_assigned +
    weights.market_approach.weight_assigned;

  if (Math.abs(totalWeight - 1.0) > 0.01) {
    errors.push(`Approach weights must sum to 1.0, got ${totalWeight.toFixed(2)}`);
  }

  // Valuation floor check
  if (report.valuation_synthesis.final_valuation.concluded_value <
      report.valuation_approaches.asset_approach.adjusted_net_asset_value) {
    warnings.push('Concluded value is below adjusted net asset value (valuation floor)');
  }

  // Range validity
  const fv = report.valuation_synthesis.final_valuation;
  if (fv.valuation_range_low >= fv.concluded_value ||
      fv.concluded_value >= fv.valuation_range_high) {
    warnings.push('Concluded value should be within valuation range');
  }

  // Narrative word count checks
  const narratives = report.narratives;
  Object.entries(NARRATIVE_WORD_TARGETS).forEach(([key, target]) => {
    const section = narratives[key as keyof NarrativesFinal] as NarrativeSection;
    if (section?.content) {
      const wordCount = section.content.split(/\s+/).length;
      const minTarget = target * 0.8;
      if (wordCount < minTarget) {
        warnings.push(`${key} narrative below 80% of target (${wordCount}/${target} words)`);
      }
    }
  });

  // Financial consistency checks
  report.financial_data.income_statements.forEach((is, i) => {
    const expectedGrossProfit = is.revenue.net_revenue - is.cost_of_goods_sold.total_cogs;
    if (Math.abs(is.gross_profit - expectedGrossProfit) > 1) {
      warnings.push(`Income statement ${is.period}: Gross profit calculation mismatch`);
    }
  });

  report.financial_data.balance_sheets.forEach((bs, i) => {
    const expectedTotal = bs.liabilities.total_liabilities + bs.equity.total_equity;
    if (Math.abs(bs.assets.total_assets - expectedTotal) > 1) {
      warnings.push(`Balance sheet ${bs.period}: Assets != Liabilities + Equity`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// =============================================================================
// PDF DATA PREPARATION
// =============================================================================

/**
 * Interface for yearly financial data used in PDF generation
 */
export interface YearlyFinancialData {
  year: number;
  revenue: number;
  pretax_income?: number;
  owner_compensation?: number;
  interest_expense?: number;
  depreciation_amortization?: number;
  non_cash_expenses?: number;
  cash?: number;
  accounts_receivable?: number;
  inventory?: number;
  other_current_assets?: number;
  fixed_assets?: number;
  total_assets?: number;
  accounts_payable?: number;
  other_short_term_liabilities?: number;
  bank_loans?: number;
  other_long_term_liabilities?: number;
  total_liabilities?: number;
}

/**
 * Interface for risk factor data used in PDF generation
 */
export interface RiskFactorData {
  category: string;
  rating: string;
  score: number;
  description: string;
}

/**
 * Interface for PDF-ready report data
 */
export interface PDFReportData {
  valuation_amount: number;
  asset_approach_value: number;
  income_approach_value: number;
  market_approach_value: number;
  valuation_range_low: number;
  valuation_range_high: number;

  // Current year financial data
  annual_revenue: number;
  pretax_income?: number;
  owner_compensation?: number;
  interest_expense?: number;
  depreciation_amortization?: number;
  cash?: number;
  accounts_receivable?: number;
  inventory?: number;
  other_current_assets?: number;
  fixed_assets?: number;
  intangible_assets?: number;
  total_assets?: number;
  accounts_payable?: number;
  other_short_term_liabilities?: number;
  bank_loans?: number;
  other_long_term_liabilities?: number;
  total_liabilities?: number;

  // Multi-year data for trends
  yearly_financials: YearlyFinancialData[];

  // Risk assessment
  risk_score: number;
  risk_level: string;
  risk_factors: RiskFactorData[];

  // Industry benchmarks for KPI comparison
  industry_benchmarks: Record<string, number>;

  // Narratives
  executive_summary?: string;
  company_profile?: string;
  industry_analysis?: string;
  financial_analysis?: string;
  asset_approach_analysis?: string;
  income_approach_analysis?: string;
  market_approach_analysis?: string;
  valuation_reconciliation?: string;
  risk_assessment?: string;
  strategic_insights?: string;
  assumptions_limiting_conditions?: string;

  // Metadata
  naics_code?: string;
  industry_name?: string;
  valuation_date?: string;
}

/**
 * Transform pass outputs into PDF-ready data format with multi-year KPI support
 */
export function transformToPDFReportData(
  passes: PassOutputs,
  valuationDate: string
): PDFReportData {
  const pass2 = passes.pass2;
  const pass3 = passes.pass3;
  const pass4 = passes.pass4;
  const pass6 = passes.pass6;
  const pass7 = passes.pass7;
  const pass8 = passes.pass8;
  const pass9 = passes.pass9;
  const pass10 = passes.pass10;
  const pass11 = passes.pass11;

  // Extract yearly financials from income statements and balance sheets
  const incomeStatements = pass2?.income_statements || [];
  const balanceSheets = pass3?.balance_sheets || [];

  const yearlyFinancials: YearlyFinancialData[] = incomeStatements.map(is => {
    const year = is.fiscal_year;
    const matchingBS = balanceSheets.find(bs => bs.fiscal_year === year);

    return {
      year,
      revenue: is.revenue?.total_revenue || is.revenue?.net_sales || 0,
      pretax_income: is.pretax_income,
      owner_compensation: is.operating_expenses?.officer_compensation,
      interest_expense: is.other_income_expense?.interest_expense,
      depreciation_amortization: (is.operating_expenses?.depreciation || 0) + (is.operating_expenses?.amortization || 0),
      cash: matchingBS?.current_assets?.cash_and_equivalents,
      accounts_receivable: matchingBS?.current_assets?.accounts_receivable_gross,
      inventory: matchingBS?.current_assets?.inventory,
      other_current_assets: (matchingBS?.current_assets?.prepaid_expenses || 0) + (matchingBS?.current_assets?.other_current_assets || 0),
      fixed_assets: matchingBS?.fixed_assets?.net_fixed_assets,
      total_assets: matchingBS?.total_assets,
      accounts_payable: matchingBS?.current_liabilities?.accounts_payable,
      other_short_term_liabilities: (matchingBS?.current_liabilities?.accrued_expenses || 0) + (matchingBS?.current_liabilities?.other_current_liabilities || 0),
      bank_loans: matchingBS?.long_term_liabilities?.notes_payable_long_term,
      other_long_term_liabilities: matchingBS?.long_term_liabilities?.other_long_term_liabilities,
      total_liabilities: matchingBS?.total_liabilities,
    };
  }).sort((a, b) => b.year - a.year); // Sort descending (most recent first)

  // Get most recent year data for current financials
  const mostRecentIS = incomeStatements[0] || {} as any;
  const mostRecentBS = balanceSheets[0] || {} as any;

  // Extract risk factors
  const riskFactors: RiskFactorData[] = [];
  const companyRisks = pass6?.company_risks || {} as any;

  const addRiskFactor = (category: string, risk: any) => {
    if (risk?.score) {
      riskFactors.push({
        category,
        rating: risk.score <= 3 ? 'Low' : risk.score <= 5 ? 'Moderate' : risk.score <= 7 ? 'High' : 'Critical',
        score: risk.score,
        description: risk.description || '',
      });
    }
  };

  addRiskFactor('Customer Concentration', companyRisks.operational_risks?.customer_concentration_risk);
  addRiskFactor('Owner Dependence', companyRisks.operational_risks?.owner_dependence_risk);
  addRiskFactor('Industry Risk', companyRisks.strategic_risks?.industry_risk);
  addRiskFactor('Financial Risk', companyRisks.financial_risks?.profitability_risk);
  addRiskFactor('Operational Risk', companyRisks.operational_risks?.facility_risk);
  addRiskFactor('Market Risk', companyRisks.external_risks?.economic_sensitivity_risk);

  // Extract industry benchmarks from pass4
  const industryBenchmarks: Record<string, number> = {};
  const benchmarks = pass4?.industry_benchmarks || {} as any;

  if (benchmarks.profitability_benchmarks?.gross_margin?.median) {
    industryBenchmarks['gross_profit_margin'] = benchmarks.profitability_benchmarks.gross_margin.median;
  }
  if (benchmarks.profitability_benchmarks?.operating_margin?.median) {
    industryBenchmarks['operating_profit_margin'] = benchmarks.profitability_benchmarks.operating_margin.median;
  }
  if (benchmarks.profitability_benchmarks?.net_margin?.median) {
    industryBenchmarks['net_profit_margin'] = benchmarks.profitability_benchmarks.net_margin.median;
  }

  // Get narratives
  const narratives = pass11?.report_narratives || {} as any;

  // Get valuation data
  const synthesis = pass10?.value_synthesis || {} as any;
  const conclusion = pass10?.conclusion || {} as any;

  const assetValue = pass7?.asset_approach?.adjusted_book_value || 0;
  const incomeValue = pass8?.income_approach?.single_period_capitalization?.adjusted_indicated_value || 0;
  const marketValue = pass9?.market_approach?.indicated_value_point || 0;

  return {
    valuation_amount: conclusion.concluded_value || 0,
    asset_approach_value: assetValue,
    income_approach_value: incomeValue,
    market_approach_value: marketValue,
    valuation_range_low: conclusion.value_range?.low || Math.min(assetValue, incomeValue, marketValue) * 0.9,
    valuation_range_high: conclusion.value_range?.high || Math.max(assetValue, incomeValue, marketValue) * 1.1,

    annual_revenue: mostRecentIS.revenue?.total_revenue || mostRecentIS.revenue?.net_sales || 0,
    pretax_income: mostRecentIS.pretax_income,
    owner_compensation: mostRecentIS.operating_expenses?.officer_compensation,
    interest_expense: mostRecentIS.other_income_expense?.interest_expense,
    depreciation_amortization: (mostRecentIS.operating_expenses?.depreciation || 0) + (mostRecentIS.operating_expenses?.amortization || 0),
    cash: mostRecentBS.current_assets?.cash_and_equivalents,
    accounts_receivable: mostRecentBS.current_assets?.accounts_receivable_gross,
    inventory: mostRecentBS.current_assets?.inventory,
    other_current_assets: (mostRecentBS.current_assets?.prepaid_expenses || 0) + (mostRecentBS.current_assets?.other_current_assets || 0),
    fixed_assets: mostRecentBS.fixed_assets?.net_fixed_assets,
    intangible_assets: mostRecentBS.other_assets?.intangible_assets,
    total_assets: mostRecentBS.total_assets,
    accounts_payable: mostRecentBS.current_liabilities?.accounts_payable,
    other_short_term_liabilities: (mostRecentBS.current_liabilities?.accrued_expenses || 0) + (mostRecentBS.current_liabilities?.other_current_liabilities || 0),
    bank_loans: mostRecentBS.long_term_liabilities?.notes_payable_long_term,
    other_long_term_liabilities: mostRecentBS.long_term_liabilities?.other_long_term_liabilities,
    total_liabilities: mostRecentBS.total_liabilities,

    yearly_financials: yearlyFinancials,

    risk_score: pass6?.risk_summary?.overall_risk_score || 5,
    risk_level: pass6?.risk_summary?.overall_risk_level || 'average',
    risk_factors: riskFactors,

    industry_benchmarks: industryBenchmarks,

    executive_summary: narratives.executive_summary?.content,
    company_profile: narratives.company_overview?.content,
    industry_analysis: narratives.industry_analysis?.content,
    financial_analysis: [
      narratives.financial_analysis?.income_statement_analysis?.content,
      narratives.financial_analysis?.balance_sheet_analysis?.content,
      narratives.financial_analysis?.ratio_analysis?.content,
    ].filter(Boolean).join('\n\n'),
    asset_approach_analysis: narratives.valuation_approaches?.asset_approach_narrative?.content || pass7?.narrative?.content,
    income_approach_analysis: narratives.valuation_approaches?.income_approach_narrative?.content || pass8?.narrative?.content,
    market_approach_analysis: narratives.valuation_approaches?.market_approach_narrative?.content || pass9?.narrative?.content,
    valuation_reconciliation: narratives.valuation_approaches?.synthesis_narrative?.content,
    risk_assessment: narratives.risk_analysis?.content,
    strategic_insights: buildValueEnhancementContent(pass6),
    assumptions_limiting_conditions: narratives.conclusion_and_limiting_conditions?.content,

    naics_code: passes.pass1?.industry_classification?.naics_code,
    industry_name: passes.pass1?.industry_classification?.naics_description,
    valuation_date: valuationDate,
  };
}

/**
 * Build value enhancement content from Pass 6 data
 */
function buildValueEnhancementContent(pass6: Pass6Output): string {
  const valueDrivers = pass6?.company_strengths?.value_drivers || [];
  const riskMitigants = pass6?.risk_summary?.key_risk_mitigants || [];
  const strengths = pass6?.company_strengths?.strengths || [];

  const sections: string[] = [];

  if (valueDrivers.length > 0) {
    sections.push('## Key Value Drivers\n\n' + valueDrivers.map((d: any) =>
      `**${d.driver}** (${d.importance}): ${d.description} - Current performance: ${d.current_performance}`
    ).join('\n\n'));
  }

  if (strengths.length > 0) {
    sections.push('## Company Strengths\n\n' + strengths.map((s: any) =>
      `**${s.strength}** (${s.category}): ${s.description}`
    ).join('\n\n'));
  }

  if (riskMitigants.length > 0) {
    sections.push('## Risk Mitigation Strategies\n\n' + riskMitigants.map((m: any) =>
      `- ${m}`
    ).join('\n'));
  }

  return sections.join('\n\n');
}
