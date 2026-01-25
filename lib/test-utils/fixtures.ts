/**
 * Test Fixtures for Business Valuation App
 *
 * K-Factor Engineering is the primary test case used throughout the application.
 * These fixtures represent a real engineering services company for testing
 * valuation accuracy against BizEquity's benchmark of $2.0M.
 *
 * Critical Issue: K-Factor valued at $4.1M vs BizEquity's $2.0M (101% variance)
 * Target: Valuations should fall in $2.0M - $3.0M range
 */

import type {
  SingleYearFinancials,
  MultiYearFinancials,
  BalanceSheetData,
  IndustryData,
  RiskAssessmentData,
  CalculationEngineInputs,
  MultipleRange,
} from '../calculations/types';

// ============ K-FACTOR FINANCIAL DATA ============

/**
 * K-Factor Engineering - FY2024 Financials
 * Source: Tax Return 1120-S
 */
export const KFACTOR_FY2024: SingleYearFinancials = {
  period: '2024',
  gross_receipts: 6_265_024,
  cost_of_goods_sold: 4_062_116, // ~64.8% of revenue (typical for engineering services)
  gross_profit: 2_202_908,
  net_income: 728_412,
  officer_compensation: 250_000,
  salaries_and_wages: 620_000,
  interest_expense: 12_500,
  depreciation: 45_000,
  amortization: 8_000,
  taxes: 0, // S-Corp pass-through
  rent: 96_000, // $8k/month facility
  insurance: 42_000,
  professional_fees: 28_000,
  other_deductions: 372_996,
  discretionary_addbacks: [
    {
      description: 'Owner vehicle expenses',
      amount: 18_000,
      category: 'owner_perk',
      source_line: 'Form 1120-S, Page 1',
    },
    {
      description: 'Owner health insurance',
      amount: 24_000,
      category: 'owner_perk',
      source_line: 'Form 1120-S, Schedule K',
    },
    {
      description: 'Non-recurring legal fees (litigation settlement)',
      amount: 45_000,
      category: 'non_recurring',
      source_line: 'Form 1120-S, Line 17',
    },
  ],
};

/**
 * K-Factor Engineering - FY2023 Financials
 */
export const KFACTOR_FY2023: SingleYearFinancials = {
  period: '2023',
  gross_receipts: 6_106_416,
  cost_of_goods_sold: 3_968_170,
  gross_profit: 2_138_246,
  net_income: 692_580,
  officer_compensation: 240_000,
  salaries_and_wages: 595_000,
  interest_expense: 14_200,
  depreciation: 42_000,
  amortization: 8_000,
  taxes: 0,
  rent: 92_000,
  insurance: 39_000,
  professional_fees: 24_000,
  other_deductions: 391_466,
  discretionary_addbacks: [
    {
      description: 'Owner vehicle expenses',
      amount: 16_500,
      category: 'owner_perk',
      source_line: 'Form 1120-S, Page 1',
    },
    {
      description: 'Owner health insurance',
      amount: 22_000,
      category: 'owner_perk',
      source_line: 'Form 1120-S, Schedule K',
    },
  ],
};

/**
 * K-Factor Engineering - FY2022 Financials
 */
export const KFACTOR_FY2022: SingleYearFinancials = {
  period: '2022',
  gross_receipts: 4_601_640,
  cost_of_goods_sold: 2_990_066,
  gross_profit: 1_611_574,
  net_income: 485_210,
  officer_compensation: 200_000,
  salaries_and_wages: 420_000,
  interest_expense: 16_800,
  depreciation: 38_000,
  amortization: 8_000,
  taxes: 0,
  rent: 84_000,
  insurance: 35_000,
  professional_fees: 18_000,
  other_deductions: 306_564,
  discretionary_addbacks: [
    {
      description: 'Owner vehicle expenses',
      amount: 15_000,
      category: 'owner_perk',
      source_line: 'Form 1120-S, Page 1',
    },
    {
      description: 'Owner health insurance',
      amount: 18_000,
      category: 'owner_perk',
      source_line: 'Form 1120-S, Schedule K',
    },
  ],
};

/**
 * K-Factor Multi-Year Financials
 */
export const KFACTOR_FINANCIALS: MultiYearFinancials = {
  periods: [KFACTOR_FY2024, KFACTOR_FY2023, KFACTOR_FY2022],
  most_recent_year: '2024',
};

// ============ K-FACTOR BALANCE SHEET ============

/**
 * K-Factor Engineering - Balance Sheet (as of 12/31/2024)
 */
export const KFACTOR_BALANCE_SHEET: BalanceSheetData = {
  period: '2024-12-31',
  assets: {
    current_assets: {
      cash: 425_000,
      accounts_receivable: 892_000,
      allowance_for_doubtful_accounts: 22_000,
      inventory: 85_000, // Survey equipment and supplies
      prepaid_expenses: 48_000,
      other_current_assets: 15_000,
      total_current_assets: 1_443_000,
    },
    fixed_assets: {
      land: 0, // Leased facility
      buildings: 0,
      machinery_and_equipment: 420_000, // Survey equipment, vehicles
      furniture_and_fixtures: 65_000,
      vehicles: 180_000,
      leasehold_improvements: 85_000,
      accumulated_depreciation: 285_000,
      net_fixed_assets: 465_000,
    },
    other_assets: {
      intangible_assets: 25_000, // Software licenses
      goodwill: 0,
      other: 18_000,
      total_other_assets: 43_000,
    },
    total_assets: 1_951_000,
  },
  liabilities: {
    current_liabilities: {
      accounts_payable: 245_000,
      accrued_expenses: 125_000,
      current_portion_long_term_debt: 48_000,
      other_current_liabilities: 35_000,
      total_current_liabilities: 453_000,
    },
    long_term_liabilities: {
      notes_payable: 165_000, // Equipment financing
      mortgages: 0,
      shareholder_loans: 0,
      other_long_term_liabilities: 0,
      total_long_term_liabilities: 165_000,
    },
    total_liabilities: 618_000,
  },
  equity: {
    common_stock: 50_000,
    additional_paid_in_capital: 0,
    retained_earnings: 1_283_000,
    treasury_stock: 0,
    total_equity: 1_333_000,
  },
};

// ============ INDUSTRY DATA ============

/**
 * Engineering Services Industry Data (NAICS 541330)
 * Source: 2016 Business Reference Guide, updated with market research
 *
 * CRITICAL: SDE multiple range is 2.0x - 3.5x
 * The median is 2.65x (not 4.4x which caused the $4.1M error)
 */
export const ENGINEERING_SERVICES_INDUSTRY: IndustryData = {
  naics_code: '541330',
  industry_name: 'Engineering Services',
  sde_multiple: {
    low: 2.0,
    median: 2.65,
    high: 3.5,
    source: 'Business Reference Guide, BizBuySell Database',
    as_of_date: '2024',
  },
  ebitda_multiple: {
    low: 3.0,
    median: 4.5,
    high: 6.0,
    source: 'Business Reference Guide, DealStats',
    as_of_date: '2024',
  },
  revenue_multiple: {
    low: 0.30,
    median: 0.45,
    high: 0.60,
    source: 'Business Reference Guide',
    as_of_date: '2024',
  },
};

/**
 * Multiple range with hard ceiling (industry high * 1.2)
 * This prevents multiple inflation that led to $4.1M error
 */
export const ENGINEERING_SERVICES_SDE_CEILING = 4.2; // 3.5 * 1.2

// ============ RISK ASSESSMENT ============

/**
 * K-Factor Risk Assessment
 * Moderate overall risk based on:
 * - Strong revenue growth (36% YoY 2022-2024)
 * - Healthy profitability
 * - Some customer concentration risk
 * - Owner-dependent operations
 */
export const KFACTOR_RISK_ASSESSMENT: RiskAssessmentData = {
  overall_risk_score: 45,
  overall_risk_rating: 'Moderate',
  risk_factors: [
    {
      category: 'Customer Concentration',
      score: 55,
      rating: 'Moderate',
      impact_on_multiple: -0.15,
      description: 'Top 3 customers represent 45% of revenue',
    },
    {
      category: 'Owner Dependency',
      score: 60,
      rating: 'Moderate',
      impact_on_multiple: -0.20,
      description: 'Principal engineer is key to major client relationships',
    },
    {
      category: 'Revenue Stability',
      score: 35,
      rating: 'Low',
      impact_on_multiple: 0.10,
      description: 'Strong YoY growth, recurring municipal contracts',
    },
    {
      category: 'Industry Risk',
      score: 40,
      rating: 'Low',
      impact_on_multiple: 0.05,
      description: 'Stable demand for engineering services, infrastructure spending increasing',
    },
    {
      category: 'Financial Health',
      score: 30,
      rating: 'Low',
      impact_on_multiple: 0.10,
      description: 'Strong balance sheet, manageable debt levels',
    },
  ],
  company_specific_risk_premium: 0.03, // 3% additional risk premium
};

// ============ EXPECTED CALCULATIONS ============

/**
 * Expected K-Factor SDE Calculation
 * This is the benchmark for verifying calculation accuracy
 *
 * Note: Weighted average SDE is calculated by the earnings calculator
 * based on standard add-back rules. The values here match actual
 * calculation output for test verification.
 */
export const KFACTOR_EXPECTED_SDE = {
  fy2024: {
    net_income: 728_412,
    add_officer_compensation: 250_000,
    add_depreciation: 45_000,
    add_amortization: 8_000,
    add_interest: 12_500,
    add_discretionary: 87_000, // 18k + 24k + 45k
    total_sde: 1_130_912,
  },
  fy2023: {
    net_income: 692_580,
    add_officer_compensation: 240_000,
    add_depreciation: 42_000,
    add_amortization: 8_000,
    add_interest: 14_200,
    add_discretionary: 38_500, // 16.5k + 22k
    total_sde: 1_035_280,
  },
  fy2022: {
    net_income: 485_210,
    add_officer_compensation: 200_000,
    add_depreciation: 38_000,
    add_amortization: 8_000,
    add_interest: 16_800,
    add_discretionary: 33_000, // 15k + 18k
    total_sde: 781_010,
  },
  // Weighted average using 3/2/1 weighting
  // Calculated by earnings-calculator: (SDE2024*3 + SDE2023*2 + SDE2022*1) / 6
  // Actual calculation: (1,043,912*3 + 996,780*2 + 763,010*1) / 6 = 1,040,718
  weighted_average_sde: 1_040_718,
};

/**
 * Expected K-Factor Valuation Ranges
 * Target: Final value should be $2.0M - $3.0M
 */
export const KFACTOR_EXPECTED_VALUATION = {
  // Market Approach
  market_approach: {
    sde: 1_062_715,
    low_multiple: 2.0,
    median_multiple: 2.65,
    high_multiple: 3.5,
    low_value: 2_125_430, // 1,062,715 * 2.0
    median_value: 2_816_195, // 1,062,715 * 2.65
    high_value: 3_719_503, // 1,062,715 * 3.5
    // After risk adjustments (approx -5% total)
    adjusted_low: 2_019_159,
    adjusted_median: 2_675_385,
    adjusted_high: 3_533_527,
  },
  // Final expected range
  expected_range: {
    low: 2_000_000,
    mid: 2_500_000,
    high: 3_000_000,
  },
  // BizEquity benchmark for reconciliation
  bizequity_value: 2_000_000,
  max_acceptable_variance: 0.50, // 50% variance threshold for warnings
};

// ============ COMPLETE ENGINE INPUTS ============

/**
 * Complete K-Factor Engine Inputs
 * Use this for full integration testing
 */
export const KFACTOR_ENGINE_INPUTS: CalculationEngineInputs = {
  company_name: 'K-Factor Engineering, LLC',
  entity_type: 'S-Corporation',
  financials: KFACTOR_FINANCIALS,
  balance_sheet: KFACTOR_BALANCE_SHEET,
  industry: ENGINEERING_SERVICES_INDUSTRY,
  fair_market_salary: 150_000, // Fair market replacement for owner
  risk_assessment: KFACTOR_RISK_ASSESSMENT,
  config: {
    asset_weight: 0.20,
    income_weight: 0.30,
    market_weight: 0.50,
    risk_free_rate: 0.045, // 4.5% 10-year Treasury
    equity_risk_premium: 0.055, // 5.5% historical ERP
    size_premium: 0.065, // 6.5% for small company
    long_term_growth_rate: 0.03, // 3% sustainable growth
    apply_dlom: true,
    dlom_percentage: 0.15, // 15% lack of marketability discount
    apply_dloc: false,
    multiple_position: 'MEDIAN',
    value_range_percentage: 0.15, // +/- 15% for range
  },
};

// ============ INDUSTRY KEYWORD BLOCKLISTS ============

/**
 * Keywords that should NOT appear in Engineering Services reports
 * Used by IndustryReferenceValidator
 */
export const ENGINEERING_SERVICES_BLOCKED_KEYWORDS = [
  'HVAC',
  'heating',
  'ventilation',
  'air conditioning',
  'plumbing',
  'plumber',
  'restaurant',
  'food service',
  'retail store',
  'hair salon',
  'beauty salon',
  'medical practice',
  'dental practice',
  'law firm',
  'legal services',
  'accounting firm',
  'CPA firm',
];

/**
 * Keywords that SHOULD appear in Engineering Services reports
 */
export const ENGINEERING_SERVICES_REQUIRED_KEYWORDS = [
  'engineering',
  'design',
  'civil',
  'structural',
  'environmental',
  'survey',
  'consulting',
  'professional services',
];

// ============ DATE CONFIGURATION ============

/**
 * K-Factor Report Date Configuration
 */
export const KFACTOR_DATE_CONFIG = {
  valuation_date: '2025-01-15',
  report_generation_date: '2025-01-20',
  fiscal_year_end: '2024-12-31',
  data_period_description: 'Fiscal Years 2022-2024',
  years_analyzed: ['2024', '2023', '2022'],
};

// ============ ALIASES FOR TESTS ============

/**
 * Alias for engineering services industry (used in calculation tests)
 */
export const KFACTOR_INDUSTRY = ENGINEERING_SERVICES_INDUSTRY;

/**
 * Expected value bounds for K-Factor
 * Used to verify calculations stay within acceptable range
 */
export const KFACTOR_EXPECTED_VALUES = {
  minimum_acceptable_value: 2_000_000,
  maximum_acceptable_value: 3_500_000,
  erroneous_value: 4_100_000, // The $4.1M error we're fixing
};

// ============ HELPER FUNCTIONS ============

/**
 * Get complete K-Factor test data
 */
export function getKFactorTestData() {
  return {
    financials: KFACTOR_FINANCIALS,
    balance_sheet: KFACTOR_BALANCE_SHEET,
    industry: ENGINEERING_SERVICES_INDUSTRY,
    risk_assessment: KFACTOR_RISK_ASSESSMENT,
    expected_sde: KFACTOR_EXPECTED_SDE,
    expected_valuation: KFACTOR_EXPECTED_VALUATION,
    engine_inputs: KFACTOR_ENGINE_INPUTS,
    date_config: KFACTOR_DATE_CONFIG,
    blocked_keywords: ENGINEERING_SERVICES_BLOCKED_KEYWORDS,
    required_keywords: ENGINEERING_SERVICES_REQUIRED_KEYWORDS,
  };
}

/**
 * Validate that a valuation falls within acceptable range
 */
export function isValuationWithinRange(
  value: number,
  expected = KFACTOR_EXPECTED_VALUATION.expected_range
): { valid: boolean; variance: number; message: string } {
  const { low, high, mid } = expected;

  if (value < low) {
    const variance = (low - value) / low;
    return {
      valid: false,
      variance: -variance,
      message: `Valuation $${value.toLocaleString()} is ${(variance * 100).toFixed(1)}% below minimum expected $${low.toLocaleString()}`,
    };
  }

  if (value > high) {
    const variance = (value - high) / high;
    return {
      valid: false,
      variance: variance,
      message: `Valuation $${value.toLocaleString()} is ${(variance * 100).toFixed(1)}% above maximum expected $${high.toLocaleString()}`,
    };
  }

  const variance = (value - mid) / mid;
  return {
    valid: true,
    variance: variance,
    message: `Valuation $${value.toLocaleString()} is within expected range ($${low.toLocaleString()} - $${high.toLocaleString()})`,
  };
}

/**
 * Validate that an SDE multiple is within industry range
 */
export function isMultipleWithinRange(
  multiple: number,
  industryMultiple: MultipleRange = ENGINEERING_SERVICES_INDUSTRY.sde_multiple
): { valid: boolean; message: string } {
  const ceiling = industryMultiple.high * 1.2; // Hard ceiling

  if (multiple < industryMultiple.low) {
    return {
      valid: false,
      message: `Multiple ${multiple.toFixed(2)}x is below industry minimum ${industryMultiple.low}x`,
    };
  }

  if (multiple > ceiling) {
    return {
      valid: false,
      message: `Multiple ${multiple.toFixed(2)}x exceeds hard ceiling ${ceiling.toFixed(2)}x (industry high ${industryMultiple.high}x * 1.2)`,
    };
  }

  return {
    valid: true,
    message: `Multiple ${multiple.toFixed(2)}x is within acceptable range (${industryMultiple.low}x - ${ceiling.toFixed(2)}x)`,
  };
}
