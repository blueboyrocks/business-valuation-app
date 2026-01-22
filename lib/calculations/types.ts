/**
 * Calculation Engine Type Definitions
 */

// ============ INPUT TYPES ============

export interface SingleYearFinancials {
  period: string;
  net_income: number;
  gross_receipts: number;
  cost_of_goods_sold: number;
  gross_profit: number;
  officer_compensation: number;
  salaries_and_wages: number;
  interest_expense: number;
  depreciation: number;
  amortization: number;
  taxes: number;
  rent: number;
  non_recurring_expenses?: number;
  personal_expenses?: number;
  charitable_contributions?: number;
  meals_entertainment?: number;
  travel?: number;
  auto_expenses?: number;
  insurance?: number;
  professional_fees?: number;
  other_deductions?: number;
  discretionary_addbacks?: Array<{
    description: string;
    amount: number;
    category: 'owner_perk' | 'non_recurring' | 'non_operating' | 'personal';
    source_line?: string;
  }>;
}

export interface MultiYearFinancials {
  periods: SingleYearFinancials[];
  most_recent_year: string;
}

export interface BalanceSheetData {
  period: string;
  assets: {
    current_assets: {
      cash: number;
      accounts_receivable: number;
      allowance_for_doubtful_accounts: number;
      inventory: number;
      prepaid_expenses: number;
      other_current_assets: number;
      total_current_assets: number;
    };
    fixed_assets: {
      land: number;
      buildings: number;
      machinery_and_equipment: number;
      furniture_and_fixtures: number;
      vehicles: number;
      leasehold_improvements: number;
      accumulated_depreciation: number;
      net_fixed_assets: number;
    };
    other_assets: {
      intangible_assets: number;
      goodwill: number;
      other: number;
      total_other_assets: number;
    };
    total_assets: number;
  };
  liabilities: {
    current_liabilities: {
      accounts_payable: number;
      accrued_expenses: number;
      current_portion_long_term_debt: number;
      other_current_liabilities: number;
      total_current_liabilities: number;
    };
    long_term_liabilities: {
      notes_payable: number;
      mortgages: number;
      shareholder_loans: number;
      other_long_term_liabilities: number;
      total_long_term_liabilities: number;
    };
    total_liabilities: number;
  };
  equity: {
    common_stock: number;
    additional_paid_in_capital: number;
    retained_earnings: number;
    treasury_stock: number;
    total_equity: number;
  };
}

export interface MultipleRange {
  low: number;
  median: number;
  high: number;
  source: string;
  as_of_date?: string;
}

export interface IndustryData {
  naics_code: string;
  industry_name: string;
  sde_multiple: MultipleRange;
  ebitda_multiple: MultipleRange;
  revenue_multiple?: MultipleRange;
}

export interface RiskFactor {
  category: string;
  score: number;
  rating: 'Low' | 'Moderate' | 'High' | 'Critical';
  impact_on_multiple: number;
  description: string;
}

export interface RiskAssessmentData {
  overall_risk_score: number;
  overall_risk_rating: 'Low' | 'Moderate' | 'High' | 'Very High';
  risk_factors: RiskFactor[];
  company_specific_risk_premium: number;
}

// ============ CALCULATION STEP (audit trail) ============

export interface CalculationStep {
  step_number: number;
  category: 'SDE' | 'EBITDA' | 'Asset' | 'Income' | 'Market' | 'Synthesis';
  description: string;
  formula: string;
  inputs: Record<string, number | string>;
  result: number;
  notes?: string;
}

// ============ SDE/EBITDA OUTPUT TYPES ============

export interface AddBackItem {
  category: string;
  description: string;
  amount: number;
  source_line?: string;
}

export interface SDEYearCalculation {
  period: string;
  starting_net_income: number;
  adjustments: AddBackItem[];
  total_adjustments: number;
  sde: number;
}

export interface EBITDAYearCalculation {
  period: string;
  starting_net_income: number;
  add_interest: number;
  add_taxes: number;
  add_depreciation: number;
  add_amortization: number;
  owner_compensation_adjustment: {
    actual_owner_compensation: number;
    fair_market_replacement_salary: number;
    adjustment_amount: number;
  };
  other_normalizing_adjustments: number;
  adjusted_ebitda: number;
}

export interface NormalizedEarningsResult {
  sde_by_year: SDEYearCalculation[];
  ebitda_by_year: EBITDAYearCalculation[];
  weighted_sde: number;
  weighted_ebitda: number;
  weighting_method: string;
  weights_used: number[];
  calculation_steps: CalculationStep[];
  warnings: string[];
}

// ============ ASSET APPROACH OUTPUT ============

export interface AssetAdjustment {
  item_name: string;
  book_value: number;
  fair_market_value: number;
  adjustment: number;
  rationale: string;
}

export interface AssetApproachCalculation {
  book_value_of_equity: number;
  asset_adjustments: AssetAdjustment[];
  total_asset_adjustments: number;
  liability_adjustments: AssetAdjustment[];
  total_liability_adjustments: number;
  adjusted_net_asset_value: number;
  weight: number;
  weight_rationale?: string;
  calculation_steps: CalculationStep[];
  warnings: string[];
}

// ============ INCOME APPROACH OUTPUT ============

export interface CapRateComponents {
  risk_free_rate: number;
  equity_risk_premium: number;
  size_premium: number;
  industry_risk_premium: number;
  company_specific_risk_premium: number;
  total_discount_rate: number;
  long_term_growth_rate: number;
  capitalization_rate: number;
}

export interface IncomeApproachCalculation {
  benefit_stream: 'SDE' | 'EBITDA';
  benefit_stream_value: number;
  benefit_stream_rationale: string;
  cap_rate_components: CapRateComponents;
  income_approach_value: number;
  weight: number;
  weight_rationale?: string;
  calculation_steps: CalculationStep[];
  warnings: string[];
}

// ============ MARKET APPROACH OUTPUT ============

export interface MultipleAdjustment {
  factor: string;
  adjustment_percentage: number;
  rationale: string;
}

export interface MarketApproachCalculation {
  multiple_type: 'SDE' | 'EBITDA' | 'Revenue';
  base_multiple: number;
  multiple_source: string;
  adjustments: MultipleAdjustment[];
  adjusted_multiple: number;
  benefit_stream_value: number;
  market_approach_value: number;
  weight: number;
  weight_rationale?: string;
  calculation_steps: CalculationStep[];
  warnings: string[];
}

// ============ SYNTHESIS OUTPUT ============

export interface ApproachSummary {
  approach: 'Asset' | 'Income' | 'Market';
  value: number;
  weight: number;
  weighted_value: number;
}

export interface DiscountsAndPremiums {
  dlom: { applicable: boolean; percentage: number; rationale: string };
  dloc: { applicable: boolean; percentage: number; rationale: string };
  control_premium: { applicable: boolean; percentage: number; rationale: string };
  other_adjustments: Array<{ name: string; percentage: number; rationale: string }>;
  total_adjustment_percentage: number;
}

export interface ValueRange {
  low: number;
  mid: number;
  high: number;
  range_percentage: number;
}

export interface ValuationSynthesis {
  approach_summary: ApproachSummary[];
  preliminary_value: number;
  discounts_and_premiums: DiscountsAndPremiums;
  final_concluded_value: number;
  value_range: ValueRange;
  passes_floor_test: boolean;
  floor_value: number;
  calculation_steps: CalculationStep[];
  warnings: string[];
}

// ============ MASTER ENGINE TYPES ============

export interface CalculationEngineInputs {
  company_name: string;
  entity_type: string;
  financials: MultiYearFinancials;
  balance_sheet: BalanceSheetData;
  industry: IndustryData;
  fair_market_salary?: number;
  risk_assessment: RiskAssessmentData;
  config?: CalculationConfig;
}

export interface CalculationConfig {
  asset_weight?: number;
  income_weight?: number;
  market_weight?: number;
  risk_free_rate?: number;
  equity_risk_premium?: number;
  size_premium?: number;
  long_term_growth_rate?: number;
  apply_dlom?: boolean;
  dlom_percentage?: number;
  apply_dloc?: boolean;
  dloc_percentage?: number;
  multiple_position?: 'LOW' | 'MEDIAN' | 'HIGH';
  value_range_percentage?: number;
}

export interface CalculationEngineOutput {
  earnings: NormalizedEarningsResult;
  asset_approach: AssetApproachCalculation;
  income_approach: IncomeApproachCalculation;
  market_approach: MarketApproachCalculation;
  synthesis: ValuationSynthesis;
  all_calculation_steps: CalculationStep[];
  total_steps: number;
  all_warnings: string[];
  formatted_tables: {
    earnings_summary: string;
    sde_detail: string;
    ebitda_detail: string;
    asset_approach: string;
    income_approach: string;
    market_approach: string;
    synthesis: string;
  };
  calculated_at: string;
  engine_version: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FormatOptions {
  decimals?: number;
  showCents?: boolean;
  prefix?: string;
}
