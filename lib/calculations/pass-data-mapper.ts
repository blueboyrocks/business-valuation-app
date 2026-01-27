/**
 * Pass Data Mapper - Maps pass outputs to calculation engine inputs
 *
 * This module transforms the data extracted by passes 1-6 into the
 * structured format required by the calculation engine.
 */

import {
  CalculationEngineInputs,
  MultiYearFinancials,
  SingleYearFinancials,
  BalanceSheetData,
  IndustryData,
  RiskAssessmentData,
  RiskFactor,
} from './types';

/**
 * Safely get a nested property from an object
 */
export function safeGet<T>(obj: unknown, path: string, defaultValue: T): T {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) return defaultValue;
    current = (current as Record<string, unknown>)[key];
  }

  return (current ?? defaultValue) as T;
}

/**
 * Safely convert any value to a string.
 * Handles the case where Pass 2 returns period as an object
 * {start_date, end_date, period_months, fiscal_year} instead of a plain string.
 */
export function safeString(value: unknown, defaultValue = 'Unknown'): string {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (obj.fiscal_year != null) return String(obj.fiscal_year);
    if (typeof obj.end_date === 'string') return obj.end_date.slice(0, 4);
    if (obj.year != null) return String(obj.year);
    if (typeof obj.label === 'string') return obj.label;
  }
  return defaultValue;
}

/**
 * Map pass 2 (income statements) to financials format
 */
function mapFinancials(pass2: Record<string, unknown>): MultiYearFinancials {
  const incomeStatements = safeGet<Array<Record<string, unknown>>>(pass2, 'income_statements', []);

  const periods: SingleYearFinancials[] = incomeStatements.map((stmt) => ({
    period: safeString((stmt as Record<string, unknown>)?.period ?? safeGet<unknown>(stmt, 'period', 'Unknown')),
    net_income: safeGet<number>(stmt, 'net_income', 0),
    gross_receipts:
      safeGet<number>(stmt, 'revenue.gross_receipts', 0) ||
      safeGet<number>(stmt, 'revenue.net_revenue', 0),
    cost_of_goods_sold: safeGet<number>(stmt, 'cost_of_goods_sold.total_cogs', 0),
    gross_profit: safeGet<number>(stmt, 'gross_profit', 0),
    officer_compensation: safeGet<number>(stmt, 'operating_expenses.officer_compensation', 0),
    salaries_and_wages: safeGet<number>(stmt, 'operating_expenses.salaries_and_wages', 0),
    interest_expense: safeGet<number>(stmt, 'operating_expenses.interest_expense', 0),
    depreciation: safeGet<number>(stmt, 'operating_expenses.depreciation', 0),
    amortization: safeGet<number>(stmt, 'operating_expenses.amortization', 0),
    taxes: safeGet<number>(stmt, 'income_tax_expense', 0),
    rent: safeGet<number>(stmt, 'operating_expenses.rent', 0),
    non_recurring_expenses: safeGet<number>(stmt, 'non_recurring_expenses', 0),
    personal_expenses: safeGet<number>(stmt, 'personal_expenses', 0),
    charitable_contributions: safeGet<number>(stmt, 'operating_expenses.charitable_contributions', 0),
    meals_entertainment: safeGet<number>(stmt, 'operating_expenses.meals_entertainment', 0),
    travel: safeGet<number>(stmt, 'operating_expenses.travel', 0),
    auto_expenses: safeGet<number>(stmt, 'operating_expenses.auto', 0),
    insurance: safeGet<number>(stmt, 'operating_expenses.insurance', 0),
    professional_fees: safeGet<number>(stmt, 'operating_expenses.professional_fees', 0),
    other_deductions: safeGet<number>(stmt, 'operating_expenses.other_deductions', 0),
  }));

  // Sort by period (most recent first)
  const sortedPeriods = periods.sort((a, b) => parseInt(b.period) - parseInt(a.period));

  return {
    periods: sortedPeriods,
    most_recent_year: sortedPeriods[0]?.period || 'Unknown',
  };
}

/**
 * Map pass 3 (balance sheet) to balance sheet format
 */
function mapBalanceSheet(pass3: Record<string, unknown>): BalanceSheetData {
  // Try multiple possible locations for balance sheet data
  const bs =
    safeGet<Record<string, unknown>>(pass3, 'balance_sheets.0', {}) ||
    safeGet<Record<string, unknown>>(pass3, 'balance_sheet', {}) ||
    safeGet<Record<string, unknown>>(pass3, 'most_recent_balance_sheet', {});

  return {
    period: safeString((bs as Record<string, unknown>)?.period ?? safeGet<unknown>(bs, 'period', 'Unknown')),
    assets: {
      current_assets: {
        cash: safeGet<number>(bs, 'assets.current_assets.cash', 0),
        accounts_receivable: safeGet<number>(bs, 'assets.current_assets.accounts_receivable', 0),
        allowance_for_doubtful_accounts: safeGet<number>(
          bs,
          'assets.current_assets.allowance_for_doubtful_accounts',
          0
        ),
        inventory: safeGet<number>(bs, 'assets.current_assets.inventory', 0),
        prepaid_expenses: safeGet<number>(bs, 'assets.current_assets.prepaid_expenses', 0),
        other_current_assets: safeGet<number>(bs, 'assets.current_assets.other_current_assets', 0),
        total_current_assets: safeGet<number>(bs, 'assets.current_assets.total_current_assets', 0),
      },
      fixed_assets: {
        land: safeGet<number>(bs, 'assets.fixed_assets.land', 0),
        buildings: safeGet<number>(bs, 'assets.fixed_assets.buildings', 0),
        machinery_and_equipment: safeGet<number>(
          bs,
          'assets.fixed_assets.machinery_and_equipment',
          0
        ),
        furniture_and_fixtures: safeGet<number>(
          bs,
          'assets.fixed_assets.furniture_and_fixtures',
          0
        ),
        vehicles: safeGet<number>(bs, 'assets.fixed_assets.vehicles', 0),
        leasehold_improvements: safeGet<number>(
          bs,
          'assets.fixed_assets.leasehold_improvements',
          0
        ),
        accumulated_depreciation: safeGet<number>(
          bs,
          'assets.fixed_assets.accumulated_depreciation',
          0
        ),
        net_fixed_assets: safeGet<number>(bs, 'assets.fixed_assets.net_fixed_assets', 0),
      },
      other_assets: {
        intangible_assets: safeGet<number>(bs, 'assets.other_assets.intangible_assets', 0),
        goodwill: safeGet<number>(bs, 'assets.other_assets.goodwill', 0),
        other: safeGet<number>(bs, 'assets.other_assets.other', 0),
        total_other_assets: safeGet<number>(bs, 'assets.other_assets.total_other_assets', 0),
      },
      total_assets: safeGet<number>(bs, 'assets.total_assets', 0),
    },
    liabilities: {
      current_liabilities: {
        accounts_payable: safeGet<number>(bs, 'liabilities.current_liabilities.accounts_payable', 0),
        accrued_expenses: safeGet<number>(bs, 'liabilities.current_liabilities.accrued_expenses', 0),
        current_portion_long_term_debt: safeGet<number>(
          bs,
          'liabilities.current_liabilities.current_portion_long_term_debt',
          0
        ),
        other_current_liabilities: safeGet<number>(
          bs,
          'liabilities.current_liabilities.other_current_liabilities',
          0
        ),
        total_current_liabilities: safeGet<number>(
          bs,
          'liabilities.current_liabilities.total_current_liabilities',
          0
        ),
      },
      long_term_liabilities: {
        notes_payable: safeGet<number>(bs, 'liabilities.long_term_liabilities.notes_payable', 0),
        mortgages: safeGet<number>(bs, 'liabilities.long_term_liabilities.mortgages', 0),
        shareholder_loans: safeGet<number>(
          bs,
          'liabilities.long_term_liabilities.shareholder_loans',
          0
        ),
        other_long_term_liabilities: safeGet<number>(
          bs,
          'liabilities.long_term_liabilities.other_long_term_liabilities',
          0
        ),
        total_long_term_liabilities: safeGet<number>(
          bs,
          'liabilities.long_term_liabilities.total_long_term_liabilities',
          0
        ),
      },
      total_liabilities: safeGet<number>(bs, 'liabilities.total_liabilities', 0),
    },
    equity: {
      common_stock: safeGet<number>(bs, 'equity.common_stock', 0),
      additional_paid_in_capital: safeGet<number>(bs, 'equity.additional_paid_in_capital', 0),
      retained_earnings: safeGet<number>(bs, 'equity.retained_earnings', 0),
      treasury_stock: safeGet<number>(bs, 'equity.treasury_stock', 0),
      total_equity: safeGet<number>(bs, 'equity.total_equity', 0),
    },
  };
}

/**
 * Map pass 4 (industry analysis) to industry data format
 */
function mapIndustryData(pass4: Record<string, unknown>): IndustryData {
  // Try multiple possible locations for valuation multiples
  const multiples =
    safeGet<Record<string, unknown>>(pass4, 'valuation_multiples', {}) ||
    safeGet<Record<string, unknown>>(pass4, 'industry_analysis.valuation_multiples', {});

  const industry =
    safeGet<Record<string, unknown>>(pass4, 'industry', {}) ||
    safeGet<Record<string, unknown>>(pass4, 'industry_analysis', {}) ||
    safeGet<Record<string, unknown>>(pass4, 'industry_overview', {});

  return {
    naics_code: safeGet<string>(industry, 'naics_code', '999999'),
    industry_name:
      safeGet<string>(industry, 'naics_description', 'Unknown Industry') ||
      safeGet<string>(industry, 'industry_name', 'Unknown Industry'),
    sde_multiple: {
      low: safeGet<number>(multiples, 'sde_multiple_range.low', 1.5) ||
           safeGet<number>(multiples, 'transaction_multiples.sde_multiple.low', 1.5),
      median: safeGet<number>(multiples, 'sde_multiple_range.median', 2.5) ||
              safeGet<number>(multiples, 'transaction_multiples.sde_multiple.median', 2.5),
      high: safeGet<number>(multiples, 'sde_multiple_range.high', 3.5) ||
            safeGet<number>(multiples, 'transaction_multiples.sde_multiple.high', 3.5),
      source: safeGet<string>(multiples, 'multiple_source', 'Industry Transaction Data 2025'),
    },
    ebitda_multiple: {
      low: safeGet<number>(multiples, 'ebitda_multiple_range.low', 3.0) ||
           safeGet<number>(multiples, 'transaction_multiples.ebitda_multiple.low', 3.0),
      median: safeGet<number>(multiples, 'ebitda_multiple_range.median', 4.5) ||
              safeGet<number>(multiples, 'transaction_multiples.ebitda_multiple.median', 4.5),
      high: safeGet<number>(multiples, 'ebitda_multiple_range.high', 6.0) ||
            safeGet<number>(multiples, 'transaction_multiples.ebitda_multiple.high', 6.0),
      source: safeGet<string>(multiples, 'multiple_source', 'Industry Transaction Data 2025'),
    },
    revenue_multiple: multiples.revenue_multiple_range
      ? {
          low: safeGet<number>(multiples, 'revenue_multiple_range.low', 0.3),
          median: safeGet<number>(multiples, 'revenue_multiple_range.median', 0.5),
          high: safeGet<number>(multiples, 'revenue_multiple_range.high', 0.8),
          source: safeGet<string>(multiples, 'multiple_source', 'Industry Transaction Data 2025'),
        }
      : undefined,
  };
}

/**
 * Map pass 6 (risk assessment) to risk assessment format
 */
function mapRiskAssessment(pass6: Record<string, unknown>): RiskAssessmentData {
  const ra =
    safeGet<Record<string, unknown>>(pass6, 'risk_assessment', {}) ||
    safeGet<Record<string, unknown>>(pass6, 'company_risks', {});

  // Map risk factors
  const rawFactors = safeGet<Array<Record<string, unknown>>>(ra, 'risk_factors', []);
  const riskFactors: RiskFactor[] = rawFactors.map((rf) => ({
    category: safeGet<string>(rf, 'category', 'Unknown'),
    score: safeGet<number>(rf, 'score', 5),
    rating: safeGet<'Low' | 'Moderate' | 'High' | 'Critical'>(rf, 'rating', 'Moderate'),
    impact_on_multiple: safeGet<number>(rf, 'impact_on_multiple', 0),
    description: safeGet<string>(rf, 'description', ''),
  }));

  // Get overall risk score
  const overallScore =
    safeGet<number>(ra, 'overall_risk_score', 5) ||
    safeGet<number>(pass6, 'risk_summary.overall_risk_score', 5);

  // Convert 1-10 risk score to company-specific risk premium
  // Scale: 1-3 = low risk (0-1.5%), 4-6 = moderate (1.5-3%), 7-8 = high (3-4.5%), 9-10 = very high (4.5-6%)
  const companySpecificRiskPremium = Math.max(0, Math.min(0.06, (overallScore - 3) * 0.015));

  return {
    overall_risk_score: overallScore,
    overall_risk_rating: safeGet<'Low' | 'Moderate' | 'High' | 'Very High'>(
      ra,
      'overall_risk_rating',
      'Moderate'
    ),
    risk_factors: riskFactors,
    company_specific_risk_premium: companySpecificRiskPremium,
  };
}

/**
 * Map pass 7 (asset approach) to extract adjusted net asset value
 */
function mapPass7AssetApproach(pass7: Record<string, unknown>): { adjusted_net_asset_value?: number } | undefined {
  const summary = safeGet<Record<string, unknown>>(pass7, 'summary', {});
  const assetApproach = safeGet<Record<string, unknown>>(pass7, 'asset_approach', {});
  const nav =
    safeGet<number>(summary, 'adjusted_net_asset_value', 0) ||
    safeGet<number>(assetApproach, 'adjusted_net_asset_value', 0) ||
    safeGet<number>(assetApproach, 'adjusted_book_value', 0);
  if (nav === 0 && Object.keys(assetApproach).length === 0) return undefined;
  return { adjusted_net_asset_value: nav };
}

/**
 * Main mapper function - converts pass outputs to calculation engine inputs
 *
 * @param passOutputs - Object containing outputs from passes 1-7
 * @returns Formatted inputs for the calculation engine
 */
export function mapPassOutputsToEngineInputs(
  passOutputs: Record<string, Record<string, unknown>>
): CalculationEngineInputs {
  const pass1 = passOutputs['1'] || {};
  const pass2 = passOutputs['2'] || {};
  const pass3 = passOutputs['3'] || {};
  const pass4 = passOutputs['4'] || {};
  const pass5 = passOutputs['5'] || {};
  const pass6 = passOutputs['6'] || {};
  const pass7 = passOutputs['7'] || {};

  // Get company name from pass 1
  const companyName =
    safeGet<string>(pass1, 'company_profile.legal_name', '') ||
    safeGet<string>(pass1, 'company_profile.company_name', 'Unknown Company');

  // Get entity type from pass 1
  const entityType =
    safeGet<string>(pass1, 'company_profile.entity_type', '') ||
    safeGet<string>(pass1, 'ownership_info.ownership_type', 'Unknown');

  // Get fair market salary from pass 5 if available
  const fairMarketSalary =
    safeGet<number>(pass5, 'fair_market_salary', 0) ||
    safeGet<number>(pass5, 'summary.fair_market_salary', 0) ||
    75000;

  return {
    company_name: companyName,
    entity_type: entityType,
    financials: mapFinancials(pass2),
    balance_sheet: mapBalanceSheet(pass3),
    industry: mapIndustryData(pass4),
    fair_market_salary: fairMarketSalary,
    risk_assessment: mapRiskAssessment(pass6),
    pass7_asset_approach: mapPass7AssetApproach(pass7),
  };
}
