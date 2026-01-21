/**
 * Final Valuation Report Schema
 *
 * This file defines the AUTHORITATIVE output schema that matches OUTPUT_SCHEMA.md exactly.
 * All field names, nesting structures, and types must match the schema precisely.
 *
 * This is the format that will be:
 * 1. Returned from the orchestrator after all 12 passes
 * 2. Validated by Pass 12 quality review
 * 3. Used by the PDF generation system
 * 4. Stored in the database as report_data
 *
 * Schema Version: 2.0
 * Last Updated: January 2026
 */

// =============================================================================
// TOP-LEVEL FINAL REPORT INTERFACE
// =============================================================================

export interface FinalValuationReport {
  schema_version: '2.0';
  valuation_date: string; // YYYY-MM-DD
  generated_at: string; // ISO-8601 timestamp

  company_profile: CompanyProfileFinal;
  financial_data: FinancialDataFinal;
  normalized_earnings: NormalizedEarningsFinal;
  industry_analysis: IndustryAnalysisFinal;
  risk_assessment: RiskAssessmentFinal;
  kpi_analysis: KPIAnalysisFinal;
  valuation_approaches: ValuationApproachesFinal;
  valuation_synthesis: ValuationSynthesisFinal;
  narratives: NarrativesFinal;
  data_quality: DataQualityFinal;
  metadata: MetadataFinal;
}

// =============================================================================
// COMPANY PROFILE
// =============================================================================

export interface CompanyProfileFinal {
  legal_name: string;
  dba_name: string | null;
  entity_type: 'S-Corporation' | 'C-Corporation' | 'Partnership' | 'Sole Proprietorship' | 'LLC';
  tax_form_type: '1120-S' | '1120' | '1065' | 'Schedule C';
  ein: string | null;
  address: {
    street: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
  };
  fiscal_year_end: string; // MM-DD format
  years_in_business: number | null;
  number_of_employees: number | null;
  industry: {
    naics_code: string;
    naics_description: string;
    sic_code: string | null;
    industry_sector: string;
    industry_subsector: string;
  };
  business_description: string;
}

// =============================================================================
// FINANCIAL DATA
// =============================================================================

export interface FinancialDataFinal {
  periods_analyzed: string[];
  currency: string;
  income_statements: IncomeStatementFinal[];
  balance_sheets: BalanceSheetFinal[];
}

export interface IncomeStatementFinal {
  period: string;
  source_document: string;
  revenue: {
    gross_receipts: number;
    returns_and_allowances: number;
    net_revenue: number;
  };
  cost_of_goods_sold: {
    beginning_inventory: number;
    purchases: number;
    labor: number;
    other_costs: number;
    ending_inventory: number;
    total_cogs: number;
  };
  gross_profit: number;
  operating_expenses: {
    officer_compensation: number;
    salaries_and_wages: number;
    repairs_and_maintenance: number;
    bad_debts: number;
    rent: number;
    taxes_and_licenses: number;
    interest_expense: number;
    depreciation: number;
    amortization: number;
    advertising: number;
    pension_and_profit_sharing: number;
    employee_benefits: number;
    other_deductions: number;
    total_operating_expenses: number;
  };
  operating_income: number;
  other_income: number;
  other_expenses: number;
  net_income_before_tax: number;
  income_tax_expense: number;
  net_income: number;
}

export interface BalanceSheetFinal {
  period: string;
  source_document: string;
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

// =============================================================================
// NORMALIZED EARNINGS
// =============================================================================

export interface NormalizedEarningsFinal {
  methodology_notes: string;
  sde_calculation: SDECalculationFinal;
  ebitda_calculation: EBITDACalculationFinal;
}

export interface SDECalculationFinal {
  periods: SDEPeriodFinal[];
  weighted_average_sde: {
    calculation_method: string;
    weights: number[];
    weighted_sde: number;
  };
}

export interface SDEPeriodFinal {
  period: string;
  starting_net_income: number;
  adjustments: SDEAdjustmentFinal[];
  total_adjustments: number;
  sde: number;
}

export interface SDEAdjustmentFinal {
  category: string;
  description: string;
  amount: number;
  source_line: string;
}

export interface EBITDACalculationFinal {
  periods: EBITDAPeriodFinal[];
  weighted_average_ebitda: number;
}

export interface EBITDAPeriodFinal {
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

// =============================================================================
// INDUSTRY ANALYSIS
// =============================================================================

export interface IndustryAnalysisFinal {
  industry_overview: string;
  market_size: string;
  growth_rate: string;
  growth_outlook: 'Growing' | 'Stable' | 'Declining';
  key_trends: string[];
  competitive_landscape: string;
  barriers_to_entry: 'Low' | 'Medium' | 'High';
  regulatory_environment: string;
  technology_impact: string;
  industry_benchmarks: {
    gross_margin_benchmark: BenchmarkRange;
    operating_margin_benchmark: BenchmarkRange;
    revenue_per_employee_benchmark: BenchmarkRange;
  };
  valuation_multiples: {
    sde_multiple_range: BenchmarkRange;
    ebitda_multiple_range: BenchmarkRange;
    revenue_multiple_range: BenchmarkRange;
    multiple_source: string;
    multiple_selection_rationale: string;
  };
}

export interface BenchmarkRange {
  low: number;
  median: number;
  high: number;
}

// =============================================================================
// RISK ASSESSMENT
// =============================================================================

export interface RiskAssessmentFinal {
  overall_risk_rating: 'Low' | 'Moderate' | 'High' | 'Very High';
  overall_risk_score: number;
  risk_factors: RiskFactorFinal[];
  company_specific_risks: string[];
  company_specific_strengths: string[];
  risk_adjusted_multiple: {
    base_multiple: number;
    total_risk_adjustment: number;
    adjusted_multiple: number;
  };
}

export interface RiskFactorFinal {
  category: string;
  rating: 'Low' | 'Moderate' | 'High' | 'Critical';
  score: number;
  description: string;
  mitigation: string;
  impact_on_multiple: number;
}

// =============================================================================
// KPI ANALYSIS
// =============================================================================

export interface KPIAnalysisFinal {
  profitability_metrics: {
    gross_profit_margin: KPIMetricFinal;
    operating_profit_margin: KPIMetricFinal;
    net_profit_margin: KPIMetricFinal;
    sde_margin: KPIMetricSimple;
    ebitda_margin: KPIMetricSimple;
  };
  liquidity_metrics: {
    current_ratio: LiquidityMetric;
    quick_ratio: LiquidityMetric;
    working_capital: {
      value: number;
      as_percentage_of_revenue: number;
    };
  };
  efficiency_metrics: {
    revenue_per_employee: {
      value: number;
      vs_industry: 'Above' | 'At' | 'Below';
    };
    inventory_turnover: {
      value: number;
      days_inventory: number;
    };
    receivables_turnover: {
      value: number;
      days_sales_outstanding: number;
    };
    asset_turnover: {
      value: number;
    };
  };
  leverage_metrics: {
    debt_to_equity: {
      value: number;
      interpretation: string;
    };
    debt_to_assets: {
      value: number;
    };
    interest_coverage_ratio: {
      value: number;
      interpretation: string;
    };
  };
  growth_metrics: {
    revenue_growth_yoy: Array<{
      period: string;
      value: number;
    }>;
    revenue_cagr_3yr: number;
    sde_growth_yoy: number;
    employee_growth: number;
  };
}

export interface KPIMetricFinal {
  value: number;
  trend: 'Improving' | 'Stable' | 'Declining';
  vs_industry: 'Above' | 'At' | 'Below';
  industry_percentile: number;
}

export interface KPIMetricSimple {
  value: number;
  trend: 'Improving' | 'Stable' | 'Declining';
  vs_industry: 'Above' | 'At' | 'Below';
}

export interface LiquidityMetric {
  value: number;
  interpretation: string;
  vs_industry: 'Above' | 'At' | 'Below';
}

// =============================================================================
// VALUATION APPROACHES
// =============================================================================

export interface ValuationApproachesFinal {
  asset_approach: AssetApproachFinal;
  income_approach: IncomeApproachFinal;
  market_approach: MarketApproachFinal;
}

export interface AssetApproachFinal {
  methodology: string;
  applicable: boolean;
  applicability_rationale: string;
  book_value_of_equity: number;
  asset_adjustments: AssetAdjustmentFinal[];
  liability_adjustments: LiabilityAdjustmentFinal[];
  total_asset_adjustments: number;
  total_liability_adjustments: number;
  adjusted_net_asset_value: number;
  weight_assigned: number;
  weight_rationale: string;
}

export interface AssetAdjustmentFinal {
  asset: string;
  book_value: number;
  fair_market_value: number;
  adjustment: number;
  rationale: string;
}

export interface LiabilityAdjustmentFinal {
  liability: string;
  book_value: number;
  fair_market_value: number;
  adjustment: number;
  rationale: string;
}

export interface IncomeApproachFinal {
  methodology: string;
  applicable: boolean;
  applicability_rationale: string;
  benefit_stream_used: 'SDE' | 'EBITDA';
  benefit_stream_value: number;
  benefit_stream_rationale: string;
  capitalization_rate: {
    risk_free_rate: number;
    equity_risk_premium: number;
    size_premium: number;
    industry_risk_premium: number;
    company_specific_risk_premium: number;
    total_discount_rate: number;
    long_term_growth_rate: number;
    capitalization_rate: number;
  };
  income_approach_value: number;
  weight_assigned: number;
  weight_rationale: string;
}

export interface MarketApproachFinal {
  methodology: string;
  applicable: boolean;
  applicability_rationale: string;
  comparable_transactions: {
    source: string;
    number_of_comparables: number;
    selection_criteria: string;
    comparable_summary: ComparableSummaryFinal[];
  };
  multiple_applied: {
    type: 'SDE Multiple' | 'EBITDA Multiple' | 'Revenue Multiple';
    base_multiple: number;
    adjustments: MultipleAdjustmentFinal[];
    adjusted_multiple: number;
  };
  benefit_stream_value: number;
  market_approach_value: number;
  weight_assigned: number;
  weight_rationale: string;
}

export interface ComparableSummaryFinal {
  industry: string;
  revenue_range: string;
  sde_multiple: number;
  ebitda_multiple: number;
}

export interface MultipleAdjustmentFinal {
  factor: string;
  adjustment: number;
}

// =============================================================================
// VALUATION SYNTHESIS
// =============================================================================

export interface ValuationSynthesisFinal {
  approach_summary: ApproachSummaryFinal[];
  preliminary_value: number;
  discounts_and_premiums: {
    dlom: DiscountPremiumItem;
    dloc: DiscountPremiumItem;
    control_premium: DiscountPremiumItem;
    other_adjustments: OtherAdjustmentFinal[];
    total_discount_premium: number;
  };
  final_valuation: {
    concluded_value: number;
    valuation_range_low: number;
    valuation_range_high: number;
    confidence_level: 'Low' | 'Moderate' | 'High';
    confidence_rationale: string;
  };
  working_capital_analysis: {
    normal_working_capital: number;
    actual_working_capital: number;
    working_capital_adjustment: number;
    notes: string;
  };
}

export interface ApproachSummaryFinal {
  approach: 'Asset Approach' | 'Income Approach' | 'Market Approach';
  value: number;
  weight: number;
  weighted_value: number;
}

export interface DiscountPremiumItem {
  applicable: boolean;
  percentage: number;
  rationale: string;
}

export interface OtherAdjustmentFinal {
  name: string;
  percentage: number;
  rationale: string;
}

// =============================================================================
// NARRATIVES
// =============================================================================

export interface NarrativesFinal {
  executive_summary: NarrativeSection;
  company_overview: NarrativeSection;
  financial_analysis: NarrativeSection;
  industry_analysis: NarrativeSection;
  risk_assessment: NarrativeSection;
  asset_approach_narrative: NarrativeSection;
  income_approach_narrative: NarrativeSection;
  market_approach_narrative: NarrativeSection;
  valuation_synthesis_narrative: NarrativeSection;
  assumptions_and_limiting_conditions: NarrativeSection;
  value_enhancement_recommendations: NarrativeSection;
}

export interface NarrativeSection {
  word_count_target: number;
  content: string;
}

// Word count targets as constants for reference
export const NARRATIVE_WORD_TARGETS = {
  executive_summary: 800,
  company_overview: 500,
  financial_analysis: 1000,
  industry_analysis: 600,
  risk_assessment: 700,
  asset_approach_narrative: 500,
  income_approach_narrative: 500,
  market_approach_narrative: 500,
  valuation_synthesis_narrative: 600,
  assumptions_and_limiting_conditions: 400,
  value_enhancement_recommendations: 500,
} as const;

// =============================================================================
// DATA QUALITY
// =============================================================================

export interface DataQualityFinal {
  extraction_confidence: 'Low' | 'Moderate' | 'High';
  data_completeness_score: number;
  missing_data_flags: MissingDataFlag[];
  data_quality_notes: string;
  recommendations_for_improvement: string[];
}

export interface MissingDataFlag {
  field: string;
  impact: string;
  assumption_made: string;
}

// =============================================================================
// METADATA
// =============================================================================

export interface MetadataFinal {
  documents_analyzed: DocumentAnalyzed[];
  processing_notes: string;
  analyst_notes: string;
}

export interface DocumentAnalyzed {
  filename: string;
  document_type: string;
  tax_year: string;
  pages: number;
}

// =============================================================================
// ERROR RESPONSE (when valuation cannot be completed)
// =============================================================================

export interface ValuationErrorResponse {
  schema_version: '2.0';
  error: true;
  error_code: 'INSUFFICIENT_DATA' | 'UNREADABLE_DOCUMENT' | 'UNSUPPORTED_FORM_TYPE';
  error_message: string;
  partial_data?: Partial<FinalValuationReport>;
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

export function isFinalValuationReport(obj: unknown): obj is FinalValuationReport {
  if (!obj || typeof obj !== 'object') return false;
  const report = obj as Record<string, unknown>;
  return (
    report.schema_version === '2.0' &&
    typeof report.valuation_date === 'string' &&
    typeof report.company_profile === 'object' &&
    typeof report.financial_data === 'object' &&
    typeof report.valuation_synthesis === 'object'
  );
}

export function isValuationErrorResponse(obj: unknown): obj is ValuationErrorResponse {
  if (!obj || typeof obj !== 'object') return false;
  const response = obj as Record<string, unknown>;
  return response.error === true && typeof response.error_code === 'string';
}
