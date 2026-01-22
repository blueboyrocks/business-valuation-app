/**
 * Extended Calculation Types
 * Types for KPIs, Risk Scoring, Data Quality, Working Capital, Tax Validation
 */

// ============================================
// KPI CALCULATION TYPES
// ============================================

/**
 * Industry benchmark data for KPI comparison
 */
export interface IndustryBenchmark {
  metric_name: string;
  industry_average: number;
  percentile_25: number;
  percentile_50: number;
  percentile_75: number;
  sample_size?: number;
  as_of_date?: string;
}

/**
 * KPI performance rating
 */
export type KPIRating = 'Outperforming' | 'Meeting Average' | 'Underperforming' | 'N/A';

/**
 * Single KPI calculation result
 */
export interface KPIResult {
  name: string;
  value: number | null;
  formatted_value: string;

  // Trend data (if multiple years)
  trend_values?: Array<{ period: string; value: number }>;
  trend_direction?: 'improving' | 'stable' | 'declining';

  // Industry comparison
  industry_average?: number;
  percentile_rank?: number;
  rating: KPIRating;

  // Educational content
  what_it_means: string;
  why_it_matters: string;
  example: string;

  // Impact on valuation
  valuation_impact: 'positive' | 'neutral' | 'negative';
  impact_description?: string;
}

/**
 * KPI category grouping
 */
export interface KPICategory {
  category_name: string;
  description: string;
  kpis: KPIResult[];
}

/**
 * Complete KPI calculation output
 */
export interface KPICalculationResult {
  // Grouped by category
  liquidity_ratios: KPICategory;
  profitability_ratios: KPICategory;
  efficiency_ratios: KPICategory;
  leverage_ratios: KPICategory;
  growth_metrics: KPICategory;

  // Summary statistics
  total_kpis_calculated: number;
  outperforming_count: number;
  meeting_average_count: number;
  underperforming_count: number;

  // Overall assessment
  overall_financial_health: 'Strong' | 'Good' | 'Fair' | 'Weak';
  health_score: number; // 0-100

  // For charts
  chart_data: {
    financial_metrics_vs_revenue: ChartDataPoint[];
    growth_trends: ChartDataPoint[];
    kpi_performance_summary: ChartDataPoint[];
  };

  calculated_at: string;
}

export interface ChartDataPoint {
  label: string;
  values: Array<{ period: string; value: number }>;
  color?: string;
}

// ============================================
// RISK SCORING TYPES
// ============================================

/**
 * Risk scoring rubric for a single factor
 */
export interface RiskScoringRubric {
  factor_name: string;
  thresholds: Array<{
    condition: string;
    min_value?: number;
    max_value?: number;
    score: number;
    rating: 'Low' | 'Moderate' | 'High' | 'Critical';
    multiple_impact: number; // e.g., -0.15 for -15%
  }>;
  weight: number; // Importance weight 0-1
}

/**
 * Scored risk factor
 */
export interface ScoredRiskFactor {
  factor_name: string;
  category: string;
  raw_value: number | string;
  score: number; // 1-10
  rating: 'Low' | 'Moderate' | 'High' | 'Critical';
  multiple_impact: number;
  weighted_score: number;
  description: string;
  mitigation_suggestion?: string;
}

/**
 * Complete risk scoring result
 */
export interface RiskScoringResult {
  factors: ScoredRiskFactor[];

  // Aggregated scores by category
  category_scores: Array<{
    category: string;
    average_score: number;
    rating: 'Low' | 'Moderate' | 'High' | 'Critical';
  }>;

  // Overall
  overall_risk_score: number; // 1-10
  overall_risk_rating: 'Low' | 'Moderate' | 'High' | 'Very High';
  company_specific_risk_premium: number; // For cap rate
  recommended_multiple_adjustment: number; // Combined impact

  // For narratives
  top_risks: ScoredRiskFactor[];
  top_strengths: ScoredRiskFactor[];

  calculated_at: string;
}

// ============================================
// DATA QUALITY TYPES
// ============================================

/**
 * Field completeness status
 */
export interface FieldStatus {
  field_name: string;
  display_name: string;
  is_present: boolean;
  is_valid: boolean;
  value?: unknown;
  source?: string;
  validation_error?: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  impact_if_missing: string;
}

/**
 * Document completeness status
 */
export interface DocumentStatus {
  document_type: string;
  display_name: string;
  is_uploaded: boolean;
  years_covered?: string[];
  extraction_confidence?: number;
  missing_fields?: string[];
}

/**
 * Data improvement recommendation
 */
export interface DataImprovementRecommendation {
  priority: 1 | 2 | 3; // 1 = highest
  category: 'document' | 'field' | 'validation';
  title: string;
  description: string;
  impact: string;
  current_state: string;
  recommended_action: string;
}

/**
 * Complete data quality assessment
 */
export interface DataQualityAssessment {
  // Overall scores
  overall_completeness_score: number; // 0-100
  overall_confidence_score: number; // 0-100
  data_quality_grade: 'A' | 'B' | 'C' | 'D' | 'F';

  // Field-level detail
  field_statuses: FieldStatus[];
  critical_fields_complete: number;
  critical_fields_total: number;

  // Document-level detail
  document_statuses: DocumentStatus[];
  documents_received: number;
  documents_recommended: number;

  // What's missing
  missing_critical_fields: string[];
  missing_important_fields: string[];
  missing_optional_fields: string[];

  // Recommendations for user
  improvement_recommendations: DataImprovementRecommendation[];

  // Impact statement
  accuracy_statement: string;
  confidence_statement: string;

  // User-facing message
  user_message: string; // "If you provide X, Y, Z, we can improve accuracy by..."

  calculated_at: string;
}

// ============================================
// WORKING CAPITAL TYPES
// ============================================

/**
 * Working capital analysis result
 */
export interface WorkingCapitalAnalysis {
  // Current period
  current_assets: number;
  current_liabilities: number;
  working_capital: number;

  // As percentage of revenue
  wc_as_percent_of_revenue: number;
  industry_wc_percent: number;

  // Normal working capital calculation
  normal_working_capital: number;
  working_capital_adjustment: number; // + means buyer needs to inject
  adjustment_direction: 'inject' | 'extract' | 'none';

  // Components
  components: {
    cash: number;
    accounts_receivable: number;
    inventory: number;
    prepaid_expenses: number;
    accounts_payable: number;
    accrued_expenses: number;
    other_current_liabilities: number;
  };

  // Trends
  trends?: Array<{
    period: string;
    working_capital: number;
    wc_percent: number;
  }>;

  // Narrative support
  analysis_narrative: string;

  calculated_at: string;
}

// ============================================
// TAX FORM VALIDATION TYPES
// ============================================

/**
 * Tax form type
 */
export type TaxFormType =
  | 'Form_1120'
  | 'Form_1120S'
  | 'Form_1065'
  | 'Schedule_C'
  | 'Schedule_K1'
  | 'Form_4562'
  | 'Schedule_L';

/**
 * Single validation rule
 */
export interface TaxValidationRule {
  rule_id: string;
  form_type: TaxFormType;
  description: string;
  validation_type: 'sum_check' | 'balance_check' | 'range_check' | 'required_field' | 'cross_reference';
  fields_involved: string[];
  expected_result: string;
}

/**
 * Validation result for a single rule
 */
export interface TaxValidationResult {
  rule: TaxValidationRule;
  passed: boolean;
  actual_value?: number | string;
  expected_value?: number | string;
  discrepancy?: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggested_fix?: string;
}

/**
 * Complete tax form validation
 */
export interface TaxFormValidation {
  form_type: TaxFormType;
  tax_year: string;

  // Results
  validation_results: TaxValidationResult[];
  errors_count: number;
  warnings_count: number;

  // Summary
  is_valid: boolean;
  confidence_score: number; // 0-100

  // Cross-form checks
  cross_form_validations?: TaxValidationResult[];

  // Recommendations
  recommended_reviews: string[];

  validated_at: string;
}

// ============================================
// EXTENDED ENGINE OUTPUT
// ============================================

/**
 * Extended calculation engine output (adds to base CalculationEngineOutput)
 */
export interface ExtendedCalculationOutput {
  kpi_analysis: KPICalculationResult;
  risk_scoring: RiskScoringResult;
  data_quality: DataQualityAssessment;
  working_capital: WorkingCapitalAnalysis;
  tax_validation?: TaxFormValidation;

  // Summary for report
  valuation_confidence: 'High' | 'Medium' | 'Low';
  key_findings: string[];
  key_concerns: string[];

  extended_calculated_at: string;
}
