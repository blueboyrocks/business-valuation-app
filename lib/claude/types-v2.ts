/**
 * 12-Pass Business Valuation System Type Definitions
 *
 * This file contains comprehensive interfaces for the upgraded 12-pass
 * valuation pipeline, designed to capture all detail a professional
 * business appraiser would include in a formal valuation report.
 *
 * Pass Overview:
 * 1. Document Classification & Company Profile
 * 2. Income Statement Extraction
 * 3. Balance Sheet & Working Capital
 * 4. Industry Research & Competitive Analysis
 * 5. Earnings Normalization (SDE/EBITDA)
 * 6. Risk Assessment
 * 7. Asset Approach Valuation
 * 8. Income Approach Valuation
 * 9. Market Approach Valuation
 * 10. Value Synthesis & Reconciliation
 * 11. Executive Summary & Narratives
 * 12. Quality Review & Error Correction
 */

// =============================================================================
// COMMON TYPES
// =============================================================================

export interface MonetaryAmount {
  value: number;
  currency: string;
  formatted: string;
}

export interface DateRange {
  start_date: string;
  end_date: string;
  period_months: number;
  fiscal_year?: number;
}

export interface SourceReference {
  document_name: string;
  page_number?: number;
  line_item?: string;
  confidence: 'high' | 'medium' | 'low';
  extraction_notes?: string;
}

export interface AdjustmentItem {
  description: string;
  amount: number;
  adjustment_type: 'add_back' | 'deduction' | 'normalization' | 'non_recurring' | 'discretionary' | 'related_party';
  rationale: string;
  source?: SourceReference;
  recurrence: 'one_time' | 'recurring' | 'partially_recurring';
  confidence: 'high' | 'medium' | 'low';
}

export interface RiskFactor {
  category: string;
  factor: string;
  description: string;
  score: number; // 1-10 scale
  weight: number; // 0-1 weighting
  weighted_score: number;
  impact: 'positive' | 'negative' | 'neutral';
  mitigation_factors?: string[];
  evidence?: string[];
}

export interface Narrative {
  title: string;
  content: string;
  word_count: number;
  key_points: string[];
}

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  category: string;
  field: string;
  message: string;
  suggested_correction?: string;
  auto_correctable: boolean;
}

// =============================================================================
// PASS 1: DOCUMENT CLASSIFICATION & COMPANY PROFILE
// =============================================================================

export interface DocumentInfo {
  document_type: 'tax_return_1120' | 'tax_return_1120s' | 'tax_return_1065' | 'tax_return_schedule_c' | 'financial_statement' | 'compiled_statement' | 'reviewed_statement' | 'audited_statement' | 'internal_statement' | 'other';
  document_subtype?: string;
  tax_year?: number;
  fiscal_year_end?: string;
  document_date: string;
  preparer_info?: {
    name?: string;
    firm?: string;
    ptin?: string;
    ein?: string;
  };
  pages_analyzed: number;
  extraction_quality: 'excellent' | 'good' | 'fair' | 'poor';
  quality_notes: string[];
  schedules_present: string[];
  missing_schedules: string[];
}

export interface OwnershipInfo {
  ownership_type: 'sole_proprietorship' | 'partnership' | 'llc' | 's_corp' | 'c_corp' | 'other';
  owners: Array<{
    name: string;
    title?: string;
    ownership_percentage: number;
    active_in_business: boolean;
    compensation?: number;
    related_party_transactions?: string[];
  }>;
  total_shares_outstanding?: number;
  voting_vs_nonvoting?: {
    voting_shares: number;
    nonvoting_shares: number;
  };
  buy_sell_agreement_exists?: boolean;
  succession_plan_exists?: boolean;
}

export interface CompanyProfile {
  legal_name: string;
  dba_names: string[];
  ein?: string;
  state_of_incorporation: string;
  date_incorporated?: string;
  business_address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  mailing_address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  phone?: string;
  website?: string;
  years_in_business: number;
  number_of_employees: {
    full_time: number;
    part_time: number;
    contractors: number;
    total_fte: number;
  };
  business_description: string;
  products_services: string[];
  primary_revenue_sources: Array<{
    source: string;
    percentage_of_revenue: number;
  }>;
  geographic_markets: string[];
  customer_concentration: {
    top_customer_percentage?: number;
    top_5_customers_percentage?: number;
    customer_count_estimate?: number;
    recurring_revenue_percentage?: number;
  };
  key_personnel: Array<{
    name: string;
    title: string;
    years_with_company: number;
    key_person_risk: 'high' | 'medium' | 'low';
    responsibilities: string[];
  }>;
  real_estate_owned: boolean;
  intellectual_property: string[];
  licenses_permits: string[];
  litigation_pending: boolean;
  litigation_details?: string;
}

export interface IndustryClassification {
  naics_code: string;
  naics_description: string;
  sic_code?: string;
  sic_description?: string;
  industry_sector: string;
  industry_subsector: string;
  business_type: 'manufacturing' | 'wholesale' | 'retail' | 'service' | 'construction' | 'professional_services' | 'healthcare' | 'technology' | 'hospitality' | 'transportation' | 'real_estate' | 'other';
  classification_confidence: 'high' | 'medium' | 'low';
  classification_rationale: string;
  alternative_classifications?: Array<{
    naics_code: string;
    description: string;
    fit_score: number;
  }>;
}

export interface Pass1Output {
  pass_number: 1;
  pass_name: 'Document Classification & Company Profile';
  document_info: DocumentInfo;
  company_profile: CompanyProfile;
  ownership_info: OwnershipInfo;
  industry_classification: IndustryClassification;
  data_quality_assessment: {
    overall_quality: 'excellent' | 'good' | 'fair' | 'poor';
    completeness_score: number; // 0-100
    reliability_score: number; // 0-100
    missing_critical_data: string[];
    data_limitations: string[];
    assumptions_required: string[];
  };
  extraction_metadata: {
    processing_time_ms: number;
    tokens_used: number;
    model_version: string;
  };
}

// =============================================================================
// PASS 2: INCOME STATEMENT EXTRACTION
// =============================================================================

export interface IncomeStatementLineItem {
  line_item: string;
  account_code?: string;
  amount: number;
  percentage_of_revenue?: number;
  prior_year_amount?: number;
  change_amount?: number;
  change_percentage?: number;
  source: SourceReference;
  notes?: string;
}

export interface IncomeStatementYear {
  fiscal_year: number;
  period: DateRange;
  statement_type: 'calendar' | 'fiscal' | 'partial' | 'stub';
  months_covered: number;

  // Revenue Section
  revenue: {
    gross_sales: number;
    returns_allowances: number;
    net_sales: number;
    other_revenue: number;
    total_revenue: number;
    revenue_breakdown?: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
  };

  // Cost of Goods Sold
  cost_of_goods_sold: {
    beginning_inventory?: number;
    purchases?: number;
    labor?: number;
    materials?: number;
    other_costs?: number;
    ending_inventory?: number;
    total_cogs: number;
    line_items: IncomeStatementLineItem[];
  };

  gross_profit: number;
  gross_margin_percentage: number;

  // Operating Expenses
  operating_expenses: {
    compensation_wages: number;
    officer_compensation: number;
    employee_benefits: number;
    payroll_taxes: number;
    rent_lease: number;
    utilities: number;
    insurance: number;
    repairs_maintenance: number;
    advertising_marketing: number;
    professional_fees: number;
    office_expenses: number;
    travel_entertainment: number;
    vehicle_expenses: number;
    depreciation: number;
    amortization: number;
    bad_debt: number;
    other_expenses: number;
    total_operating_expenses: number;
    line_items: IncomeStatementLineItem[];
  };

  operating_income: number;
  operating_margin_percentage: number;

  // Other Income/Expense
  other_income_expense: {
    interest_income: number;
    interest_expense: number;
    gain_loss_asset_sales: number;
    other_income: number;
    other_expense: number;
    net_other: number;
    line_items: IncomeStatementLineItem[];
  };

  // Bottom Line
  pretax_income: number;
  income_tax_expense: number;
  net_income: number;
  net_margin_percentage: number;

  // Tax Return Specific (if applicable)
  tax_return_reconciliation?: {
    book_income: number;
    m1_adjustments: Array<{
      description: string;
      amount: number;
      increase_decrease: 'increase' | 'decrease';
    }>;
    taxable_income: number;
  };
}

export interface Pass2Output {
  pass_number: 2;
  pass_name: 'Income Statement Extraction';
  income_statements: IncomeStatementYear[];
  years_analyzed: number;

  trend_analysis: {
    revenue_cagr: number;
    gross_profit_cagr: number;
    operating_income_cagr: number;
    net_income_cagr: number;
    revenue_trend: 'growing' | 'stable' | 'declining' | 'volatile';
    profitability_trend: 'improving' | 'stable' | 'declining' | 'volatile';
    year_over_year_changes: Array<{
      metric: string;
      changes: Array<{
        from_year: number;
        to_year: number;
        change_amount: number;
        change_percentage: number;
      }>;
    }>;
  };

  key_metrics: {
    average_revenue: number;
    average_gross_margin: number;
    average_operating_margin: number;
    average_net_margin: number;
    revenue_per_employee: number;
    most_recent_revenue: number;
    most_recent_net_income: number;
  };

  anomalies_detected: Array<{
    year: number;
    metric: string;
    expected_range: { min: number; max: number };
    actual_value: number;
    explanation?: string;
  }>;

  extraction_confidence: {
    overall: 'high' | 'medium' | 'low';
    by_section: Record<string, 'high' | 'medium' | 'low'>;
    notes: string[];
  };

  extraction_metadata: {
    processing_time_ms: number;
    tokens_used: number;
  };
}

// =============================================================================
// PASS 3: BALANCE SHEET & WORKING CAPITAL
// =============================================================================

export interface BalanceSheetLineItem {
  line_item: string;
  account_code?: string;
  amount: number;
  prior_year_amount?: number;
  source: SourceReference;
  fair_market_value?: number;
  fmv_adjustment_rationale?: string;
  notes?: string;
}

export interface BalanceSheetYear {
  fiscal_year: number;
  as_of_date: string;

  // Current Assets
  current_assets: {
    cash_and_equivalents: number;
    accounts_receivable_gross: number;
    allowance_doubtful_accounts: number;
    accounts_receivable_net: number;
    inventory: number;
    prepaid_expenses: number;
    other_current_assets: number;
    total_current_assets: number;
    line_items: BalanceSheetLineItem[];
  };

  // Fixed Assets
  fixed_assets: {
    land: number;
    buildings: number;
    machinery_equipment: number;
    furniture_fixtures: number;
    vehicles: number;
    leasehold_improvements: number;
    construction_in_progress: number;
    gross_fixed_assets: number;
    accumulated_depreciation: number;
    net_fixed_assets: number;
    line_items: BalanceSheetLineItem[];
  };

  // Other Assets
  other_assets: {
    goodwill: number;
    intangible_assets: number;
    accumulated_amortization: number;
    net_intangibles: number;
    investments: number;
    notes_receivable_long_term: number;
    due_from_shareholders: number;
    other_long_term_assets: number;
    total_other_assets: number;
    line_items: BalanceSheetLineItem[];
  };

  total_assets: number;

  // Current Liabilities
  current_liabilities: {
    accounts_payable: number;
    accrued_expenses: number;
    accrued_wages: number;
    current_portion_long_term_debt: number;
    line_of_credit: number;
    notes_payable_short_term: number;
    income_taxes_payable: number;
    deferred_revenue: number;
    other_current_liabilities: number;
    total_current_liabilities: number;
    line_items: BalanceSheetLineItem[];
  };

  // Long-Term Liabilities
  long_term_liabilities: {
    notes_payable_long_term: number;
    mortgage_payable: number;
    equipment_loans: number;
    due_to_shareholders: number;
    deferred_taxes: number;
    other_long_term_liabilities: number;
    total_long_term_liabilities: number;
    line_items: BalanceSheetLineItem[];
  };

  total_liabilities: number;

  // Equity
  equity: {
    common_stock: number;
    additional_paid_in_capital: number;
    retained_earnings: number;
    current_year_net_income: number;
    distributions_dividends: number;
    treasury_stock: number;
    accumulated_other_comprehensive_income: number;
    total_equity: number;
    line_items: BalanceSheetLineItem[];
  };

  total_liabilities_and_equity: number;
  balance_check: boolean; // assets = liabilities + equity
}

export interface WorkingCapitalAnalysis {
  fiscal_year: number;

  // Core Working Capital
  current_assets: number;
  current_liabilities: number;
  net_working_capital: number;

  // Operating Working Capital (excludes cash and debt)
  accounts_receivable: number;
  inventory: number;
  prepaid_expenses: number;
  accounts_payable: number;
  accrued_expenses: number;
  operating_working_capital: number;

  // Ratios
  current_ratio: number;
  quick_ratio: number;
  cash_ratio: number;

  // Turnover Metrics
  days_sales_outstanding: number;
  days_inventory_outstanding: number;
  days_payable_outstanding: number;
  cash_conversion_cycle: number;

  // Working Capital as % of Revenue
  working_capital_to_revenue: number;
  operating_wc_to_revenue: number;

  // Adequacy Assessment
  adequacy_assessment: 'excess' | 'adequate' | 'tight' | 'deficient';
  adequacy_notes: string;

  // Normalized Working Capital
  normalized_working_capital: number;
  normalization_adjustments: Array<{
    description: string;
    amount: number;
    rationale: string;
  }>;
}

export interface Pass3Output {
  pass_number: 3;
  pass_name: 'Balance Sheet & Working Capital';
  balance_sheets: BalanceSheetYear[];
  working_capital_analysis: WorkingCapitalAnalysis[];

  // Multi-year analysis
  trend_analysis: {
    total_assets_trend: 'growing' | 'stable' | 'declining';
    total_debt_trend: 'growing' | 'stable' | 'declining';
    equity_trend: 'growing' | 'stable' | 'declining';
    working_capital_trend: 'improving' | 'stable' | 'deteriorating';
  };

  // Key Metrics Summary
  key_metrics: {
    most_recent_total_assets: number;
    most_recent_total_liabilities: number;
    most_recent_equity: number;
    most_recent_working_capital: number;
    average_current_ratio: number;
    average_debt_to_equity: number;
    tangible_book_value: number;
  };

  // Asset Quality Assessment
  asset_quality: {
    receivables_quality: 'excellent' | 'good' | 'fair' | 'poor';
    receivables_notes: string;
    inventory_quality: 'excellent' | 'good' | 'fair' | 'poor';
    inventory_notes: string;
    fixed_asset_condition: 'excellent' | 'good' | 'fair' | 'poor';
    fixed_asset_notes: string;
    intangibles_assessment: string;
  };

  // Debt Analysis
  debt_analysis: {
    total_debt: number;
    debt_to_equity_ratio: number;
    debt_to_assets_ratio: number;
    interest_coverage_ratio: number;
    debt_structure_notes: string;
  };

  // Off-Balance Sheet Items
  off_balance_sheet_items: Array<{
    description: string;
    estimated_amount?: number;
    impact: 'material' | 'immaterial';
    notes: string;
  }>;

  extraction_metadata: {
    processing_time_ms: number;
    tokens_used: number;
  };
}

// =============================================================================
// PASS 4: INDUSTRY RESEARCH & COMPETITIVE ANALYSIS
// =============================================================================

export interface IndustryOverview {
  naics_code: string;
  industry_name: string;
  industry_description: string;

  // Market Size & Growth
  market_size: {
    us_market_size?: number;
    global_market_size?: number;
    year_of_estimate: number;
    source: string;
  };
  market_growth: {
    historical_growth_rate: number;
    projected_growth_rate: number;
    growth_drivers: string[];
    growth_inhibitors: string[];
  };

  // Industry Characteristics
  industry_lifecycle: 'emerging' | 'growth' | 'mature' | 'declining';
  fragmentation: 'highly_fragmented' | 'fragmented' | 'consolidated' | 'highly_consolidated';
  capital_intensity: 'low' | 'medium' | 'high';
  labor_intensity: 'low' | 'medium' | 'high';
  technology_dependence: 'low' | 'medium' | 'high';
  regulation_level: 'low' | 'medium' | 'high';

  // Economic Sensitivity
  economic_sensitivity: 'counter_cyclical' | 'non_cyclical' | 'cyclical' | 'highly_cyclical';
  recession_performance: string;

  // Key Success Factors
  key_success_factors: string[];
  barriers_to_entry: string[];
  common_exit_strategies: string[];

  // Trends & Outlook
  current_trends: Array<{
    trend: string;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
  }>;
  future_outlook: string;
  disruption_risks: string[];
}

export interface CompetitiveLandscape {
  // Market Position
  company_market_position: 'leader' | 'major_player' | 'niche_player' | 'emerging' | 'unknown';
  estimated_market_share?: number;
  geographic_scope: 'local' | 'regional' | 'national' | 'international';

  // Competitive Dynamics
  primary_competitors: Array<{
    name: string;
    description: string;
    estimated_size: 'larger' | 'similar' | 'smaller';
    competitive_advantage: string;
  }>;
  competitive_advantages: string[];
  competitive_disadvantages: string[];

  // Porter's Five Forces
  porters_five_forces: {
    threat_of_new_entrants: {
      level: 'low' | 'medium' | 'high';
      factors: string[];
    };
    bargaining_power_suppliers: {
      level: 'low' | 'medium' | 'high';
      factors: string[];
    };
    bargaining_power_buyers: {
      level: 'low' | 'medium' | 'high';
      factors: string[];
    };
    threat_of_substitutes: {
      level: 'low' | 'medium' | 'high';
      factors: string[];
    };
    competitive_rivalry: {
      level: 'low' | 'medium' | 'high';
      factors: string[];
    };
  };

  // SWOT Summary
  swot_analysis: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
}

export interface IndustryBenchmarks {
  source: string;
  source_year: number;
  sample_size?: number;

  // Revenue Metrics
  revenue_benchmarks: {
    median_revenue: number;
    revenue_growth_median: number;
    revenue_per_employee_median: number;
  };

  // Profitability Benchmarks
  profitability_benchmarks: {
    gross_margin: { median: number; quartile_25: number; quartile_75: number };
    operating_margin: { median: number; quartile_25: number; quartile_75: number };
    net_margin: { median: number; quartile_25: number; quartile_75: number };
    ebitda_margin: { median: number; quartile_25: number; quartile_75: number };
    sde_margin?: { median: number; quartile_25: number; quartile_75: number };
  };

  // Liquidity Benchmarks
  liquidity_benchmarks: {
    current_ratio: { median: number; quartile_25: number; quartile_75: number };
    quick_ratio: { median: number; quartile_25: number; quartile_75: number };
  };

  // Leverage Benchmarks
  leverage_benchmarks: {
    debt_to_equity: { median: number; quartile_25: number; quartile_75: number };
    debt_to_assets: { median: number; quartile_25: number; quartile_75: number };
  };

  // Efficiency Benchmarks
  efficiency_benchmarks: {
    asset_turnover: { median: number; quartile_25: number; quartile_75: number };
    inventory_turnover: { median: number; quartile_25: number; quartile_75: number };
    receivables_turnover: { median: number; quartile_25: number; quartile_75: number };
  };

  // Company vs Benchmark Comparison
  company_comparison: Array<{
    metric: string;
    company_value: number;
    benchmark_median: number;
    percentile_rank: number;
    assessment: 'significantly_above' | 'above' | 'at' | 'below' | 'significantly_below';
  }>;
}

export interface ValuationMultiples {
  // Transaction Multiples
  transaction_multiples: {
    source: string;
    time_period: string;
    transaction_count: number;
    sde_multiple: { low: number; median: number; high: number; mean: number };
    ebitda_multiple: { low: number; median: number; high: number; mean: number };
    revenue_multiple: { low: number; median: number; high: number; mean: number };
    discretionary_earnings_multiple?: { low: number; median: number; high: number; mean: number };
  };

  // Public Company Multiples (if applicable)
  public_company_multiples?: {
    source: string;
    as_of_date: string;
    company_count: number;
    ev_ebitda: { low: number; median: number; high: number };
    ev_revenue: { low: number; median: number; high: number };
    price_earnings: { low: number; median: number; high: number };
  };

  // Rule of Thumb Multiples
  rule_of_thumb: Array<{
    source: string;
    multiple_type: string;
    multiple_range: { low: number; high: number };
    notes: string;
    applicability: 'highly_applicable' | 'somewhat_applicable' | 'limited_applicability';
  }>;

  // Selected Multiples for Valuation
  selected_multiples: {
    primary_multiple_type: 'sde' | 'ebitda' | 'revenue' | 'discretionary_earnings';
    selected_range: { low: number; high: number };
    point_estimate: number;
    selection_rationale: string;
  };
}

export interface Pass4Output {
  pass_number: 4;
  pass_name: 'Industry Research & Competitive Analysis';
  industry_overview: IndustryOverview;
  competitive_landscape: CompetitiveLandscape;
  industry_benchmarks: IndustryBenchmarks;
  valuation_multiples: ValuationMultiples;

  // Industry Risk Premium
  industry_risk_assessment: {
    overall_industry_risk: 'low' | 'below_average' | 'average' | 'above_average' | 'high';
    industry_risk_premium: number; // percentage to add to discount rate
    risk_factors: Array<{
      factor: string;
      impact: number; // -2 to +2
      description: string;
    }>;
  };

  // Data Quality
  research_quality: {
    data_recency: 'current' | 'recent' | 'dated' | 'stale';
    data_relevance: 'highly_relevant' | 'relevant' | 'somewhat_relevant' | 'limited_relevance';
    data_limitations: string[];
    additional_research_recommended: string[];
  };

  extraction_metadata: {
    processing_time_ms: number;
    tokens_used: number;
  };
}

// =============================================================================
// PASS 5: EARNINGS NORMALIZATION (SDE/EBITDA)
// =============================================================================

export interface SDECalculation {
  fiscal_year: number;

  // Starting Point
  reported_net_income: number;

  // Add-backs
  add_backs: {
    interest_expense: AdjustmentItem;
    depreciation: AdjustmentItem;
    amortization: AdjustmentItem;
    owner_compensation: AdjustmentItem;
    owner_benefits: AdjustmentItem;
    owner_perks: AdjustmentItem;
    one_time_expenses: AdjustmentItem[];
    non_recurring_items: AdjustmentItem[];
    discretionary_expenses: AdjustmentItem[];
    related_party_adjustments: AdjustmentItem[];
    other_add_backs: AdjustmentItem[];
    total_add_backs: number;
  };

  // Deductions
  deductions: {
    one_time_income: AdjustmentItem[];
    non_recurring_income: AdjustmentItem[];
    non_operating_income: AdjustmentItem[];
    other_deductions: AdjustmentItem[];
    total_deductions: number;
  };

  // Normalizations
  normalizations: {
    rent_adjustment: AdjustmentItem | null;
    compensation_adjustment: AdjustmentItem | null;
    inventory_adjustment: AdjustmentItem | null;
    other_normalizations: AdjustmentItem[];
    total_normalizations: number;
  };

  // Calculated SDE
  calculated_sde: number;
  sde_margin: number;
}

export interface EBITDACalculation {
  fiscal_year: number;

  // Starting Point
  reported_net_income: number;

  // Standard EBITDA Add-backs
  interest_expense: number;
  income_tax_expense: number;
  depreciation: number;
  amortization: number;

  // EBITDA
  ebitda: number;
  ebitda_margin: number;

  // Adjustments for Normalized EBITDA
  adjustments: AdjustmentItem[];
  total_adjustments: number;

  // Adjusted EBITDA
  adjusted_ebitda: number;
  adjusted_ebitda_margin: number;
}

export interface EarningsQuality {
  // Quality Assessment
  overall_quality: 'high' | 'above_average' | 'average' | 'below_average' | 'low';
  quality_score: number; // 1-10

  // Quality Factors
  revenue_quality: {
    score: number;
    recurring_percentage: number;
    concentration_risk: 'low' | 'medium' | 'high';
    notes: string;
  };

  expense_quality: {
    score: number;
    discretionary_percentage: number;
    normalized_percentage: number;
    notes: string;
  };

  earnings_consistency: {
    score: number;
    coefficient_of_variation: number;
    trend: 'improving' | 'stable' | 'declining' | 'volatile';
    notes: string;
  };

  cash_flow_correlation: {
    score: number;
    earnings_to_cash_flow_ratio: number;
    notes: string;
  };

  // Sustainability Assessment
  earnings_sustainability: {
    sustainable_percentage: number;
    at_risk_items: Array<{
      item: string;
      amount: number;
      risk_level: 'high' | 'medium' | 'low';
      reason: string;
    }>;
  };
}

export interface Pass5Output {
  pass_number: 5;
  pass_name: 'Earnings Normalization (SDE/EBITDA)';

  sde_calculations: SDECalculation[];
  ebitda_calculations: EBITDACalculation[];
  earnings_quality: EarningsQuality;

  // Summary Metrics
  summary: {
    // SDE Summary
    most_recent_sde: number;
    weighted_average_sde: number;
    sde_weighting_method: 'equal' | 'recent_weighted' | 'trend_adjusted' | 'custom';
    sde_weights: Array<{ year: number; weight: number }>;
    sde_trend: 'growing' | 'stable' | 'declining' | 'volatile';
    sde_cagr: number;

    // EBITDA Summary
    most_recent_ebitda: number;
    weighted_average_ebitda: number;
    ebitda_trend: 'growing' | 'stable' | 'declining' | 'volatile';
    ebitda_cagr: number;

    // Adjustment Summary
    total_adjustments_most_recent: number;
    adjustment_categories: Array<{
      category: string;
      total_amount: number;
      percentage_of_sde: number;
    }>;
  };

  // Normalization Confidence
  normalization_confidence: {
    overall: 'high' | 'medium' | 'low';
    major_assumptions: string[];
    areas_of_uncertainty: string[];
    sensitivity_to_assumptions: 'low' | 'medium' | 'high';
  };

  // Recommended Benefit Stream
  recommended_benefit_stream: {
    metric: 'sde' | 'ebitda' | 'adjusted_ebitda';
    value: number;
    rationale: string;
  };

  extraction_metadata: {
    processing_time_ms: number;
    tokens_used: number;
  };
}

// =============================================================================
// PASS 6: RISK ASSESSMENT
// =============================================================================

export interface CompanyRiskAssessment {
  // Financial Risks
  financial_risks: {
    profitability_risk: RiskFactor;
    liquidity_risk: RiskFactor;
    leverage_risk: RiskFactor;
    cash_flow_risk: RiskFactor;
    working_capital_risk: RiskFactor;
    financial_reporting_risk: RiskFactor;
  };

  // Operational Risks
  operational_risks: {
    customer_concentration_risk: RiskFactor;
    supplier_concentration_risk: RiskFactor;
    key_employee_risk: RiskFactor;
    owner_dependence_risk: RiskFactor;
    facility_risk: RiskFactor;
    technology_risk: RiskFactor;
    regulatory_compliance_risk: RiskFactor;
    litigation_risk: RiskFactor;
  };

  // Strategic Risks
  strategic_risks: {
    competitive_position_risk: RiskFactor;
    market_risk: RiskFactor;
    industry_risk: RiskFactor;
    growth_sustainability_risk: RiskFactor;
    succession_risk: RiskFactor;
  };

  // External Risks
  external_risks: {
    economic_sensitivity_risk: RiskFactor;
    regulatory_change_risk: RiskFactor;
    technology_disruption_risk: RiskFactor;
    supply_chain_risk: RiskFactor;
  };
}

export interface CompanyStrengths {
  strengths: Array<{
    category: string;
    strength: string;
    description: string;
    value_impact: 'significant_positive' | 'moderate_positive' | 'minor_positive';
    evidence: string[];
  }>;

  competitive_advantages: Array<{
    advantage: string;
    sustainability: 'highly_sustainable' | 'sustainable' | 'temporary';
    description: string;
  }>;

  value_drivers: Array<{
    driver: string;
    importance: 'critical' | 'important' | 'moderate';
    current_performance: 'strong' | 'adequate' | 'weak';
    description: string;
  }>;
}

export interface RiskPremiumCalculation {
  // Build-up Method Components
  risk_free_rate: {
    rate: number;
    source: string;
    as_of_date: string;
  };

  equity_risk_premium: {
    rate: number;
    source: string;
  };

  size_premium: {
    rate: number;
    company_size_category: string;
    source: string;
  };

  industry_risk_premium: {
    rate: number;
    rationale: string;
  };

  company_specific_risk_premium: {
    rate: number;
    factors: Array<{
      factor: string;
      adjustment: number;
      rationale: string;
    }>;
    total_company_specific: number;
  };

  // Total Required Rate of Return
  total_discount_rate: number;
  capitalization_rate: number;
  cap_rate_adjustment_rationale?: string;
}

export interface Pass6Output {
  pass_number: 6;
  pass_name: 'Risk Assessment';

  company_risks: CompanyRiskAssessment;
  company_strengths: CompanyStrengths;

  // Risk Summary
  risk_summary: {
    overall_risk_level: 'low' | 'below_average' | 'average' | 'above_average' | 'high';
    overall_risk_score: number; // 1-10, 10 being highest risk

    top_risk_factors: RiskFactor[];
    key_risk_mitigants: string[];

    risk_score_breakdown: {
      financial_risk_score: number;
      operational_risk_score: number;
      strategic_risk_score: number;
      external_risk_score: number;
    };
  };

  // Discount/Cap Rate Determination
  risk_premium_calculation: RiskPremiumCalculation;

  // Multiple Adjustment
  multiple_adjustment: {
    base_multiple: number;
    risk_adjustment_factor: number; // e.g., 0.85 for 15% discount
    adjusted_multiple: number;
    adjustment_rationale: string;
  };

  // Risk-Related Discounts
  suggested_discounts: {
    lack_of_marketability: {
      applicable: boolean;
      suggested_range: { low: number; high: number };
      rationale: string;
    };
    key_person_discount: {
      applicable: boolean;
      suggested_range: { low: number; high: number };
      rationale: string;
    };
    minority_discount: {
      applicable: boolean;
      suggested_range: { low: number; high: number };
      rationale: string;
    };
  };

  extraction_metadata: {
    processing_time_ms: number;
    tokens_used: number;
  };
}

// =============================================================================
// PASS 7: ASSET APPROACH VALUATION
// =============================================================================

export interface AssetAdjustment {
  asset_category: string;
  asset_description: string;
  book_value: number;
  fair_market_value: number;
  adjustment_amount: number;
  adjustment_rationale: string;
  valuation_method: string;
  supporting_data?: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface AssetApproach {
  // Starting Point
  book_value_equity: number;
  as_of_date: string;

  // Asset Adjustments
  asset_adjustments: {
    // Current Assets
    cash_adjustment: AssetAdjustment | null;
    receivables_adjustment: AssetAdjustment | null;
    inventory_adjustment: AssetAdjustment | null;
    prepaid_adjustment: AssetAdjustment | null;

    // Fixed Assets
    land_adjustment: AssetAdjustment | null;
    building_adjustment: AssetAdjustment | null;
    equipment_adjustment: AssetAdjustment | null;
    vehicle_adjustment: AssetAdjustment | null;
    leasehold_adjustment: AssetAdjustment | null;

    // Intangible Assets
    goodwill_adjustment: AssetAdjustment | null;
    other_intangibles_adjustment: AssetAdjustment | null;

    // Other Assets
    other_asset_adjustments: AssetAdjustment[];
  };

  total_asset_adjustments: number;
  adjusted_total_assets: number;

  // Liability Adjustments
  liability_adjustments: {
    recorded_liabilities_adjustment: AssetAdjustment | null;
    contingent_liabilities: AssetAdjustment[];
    unrecorded_liabilities: AssetAdjustment[];
    deferred_tax_adjustment: AssetAdjustment | null;
    other_liability_adjustments: AssetAdjustment[];
  };

  total_liability_adjustments: number;
  adjusted_total_liabilities: number;

  // Calculated Values
  adjusted_book_value: number;

  // Intangible Value Assessment
  intangible_value_assessment: {
    identifiable_intangibles: Array<{
      type: string;
      description: string;
      estimated_value: number;
      valuation_method: string;
    }>;
    total_identifiable_intangibles: number;
    implied_goodwill?: number;
  };

  // Orderly Liquidation Value
  orderly_liquidation_value?: {
    value: number;
    liquidation_period_months: number;
    assumptions: string[];
  };

  // Forced Liquidation Value
  forced_liquidation_value?: {
    value: number;
    discount_from_orderly: number;
    assumptions: string[];
  };
}

export interface Pass7Output {
  pass_number: 7;
  pass_name: 'Asset Approach Valuation';

  asset_approach: AssetApproach;

  // Summary Values
  summary: {
    book_value_equity: number;
    total_adjustments: number;
    adjusted_net_asset_value: number;
    tangible_net_asset_value: number;
    orderly_liquidation_value?: number;
  };

  // Method Applicability
  method_applicability: {
    adjusted_book_value_applicable: boolean;
    liquidation_value_applicable: boolean;
    excess_earnings_method_applicable: boolean;
    applicability_rationale: string;
  };

  // Narrative
  narrative: Narrative;

  // Weighting Recommendation
  weighting_recommendation: {
    suggested_weight: number; // 0-100%
    rationale: string;
  };

  extraction_metadata: {
    processing_time_ms: number;
    tokens_used: number;
  };
}

// =============================================================================
// PASS 8: INCOME APPROACH VALUATION
// =============================================================================

export interface CapitalizationRateBuildup {
  // Risk-Free Rate
  risk_free_rate: {
    rate: number;
    source: string;
    maturity: string;
    as_of_date: string;
  };

  // Equity Risk Premium
  equity_risk_premium: {
    rate: number;
    source: string;
    methodology: string;
  };

  // Size Premium
  size_premium: {
    rate: number;
    size_category: string;
    source: string;
  };

  // Industry Risk Premium
  industry_risk_premium: {
    rate: number;
    source?: string;
    rationale: string;
  };

  // Company-Specific Risk Premium
  company_specific_risk_premium: {
    rate: number;
    factors: Array<{
      factor: string;
      adjustment: number;
      rationale: string;
    }>;
  };

  // Total Discount Rate
  total_discount_rate: number;

  // Long-term Growth Rate
  long_term_growth_rate: {
    rate: number;
    rationale: string;
  };

  // Capitalization Rate
  capitalization_rate: number;
}

export interface SinglePeriodCapitalization {
  benefit_stream_type: 'sde' | 'ebitda' | 'net_income' | 'cash_flow';
  benefit_stream_value: number;
  capitalization_rate: number;
  indicated_value: number;

  // Adjustments
  excess_working_capital_adjustment?: number;
  deficit_working_capital_adjustment?: number;
  non_operating_asset_adjustments: Array<{
    description: string;
    value: number;
    add_or_subtract: 'add' | 'subtract';
  }>;

  adjusted_indicated_value: number;
}

export interface DiscountedCashFlow {
  projection_period_years: number;
  terminal_value_method: 'perpetuity_growth' | 'exit_multiple';

  // Projected Cash Flows
  projected_cash_flows: Array<{
    year: number;
    revenue: number;
    ebitda: number;
    capital_expenditures: number;
    working_capital_change: number;
    free_cash_flow: number;
    discount_factor: number;
    present_value: number;
  }>;

  // Projection Assumptions
  projection_assumptions: {
    revenue_growth_rates: number[];
    ebitda_margin: number;
    capex_as_percent_revenue: number;
    working_capital_as_percent_revenue: number;
    rationale: string;
  };

  // Present Value of Projection Period
  pv_projection_period: number;

  // Terminal Value
  terminal_value: {
    terminal_year_cash_flow: number;
    terminal_growth_rate?: number;
    exit_multiple?: number;
    terminal_value: number;
    discount_factor: number;
    pv_terminal_value: number;
  };

  // Total Enterprise Value
  enterprise_value: number;

  // Adjustments to Equity Value
  less_debt: number;
  plus_excess_cash: number;
  plus_non_operating_assets: number;
  equity_value: number;
}

export interface IncomeApproach {
  // Primary Method
  primary_method: 'single_period_capitalization' | 'discounted_cash_flow';

  // Single Period Capitalization
  single_period_capitalization?: SinglePeriodCapitalization;

  // DCF (if applicable)
  discounted_cash_flow?: DiscountedCashFlow;

  // Cap Rate Buildup
  capitalization_rate_buildup: CapitalizationRateBuildup;

  // Indicated Value Range
  indicated_value_low: number;
  indicated_value_high: number;
  indicated_value_point: number;
}

export interface Pass8Output {
  pass_number: 8;
  pass_name: 'Income Approach Valuation';

  income_approach: IncomeApproach;

  // Sensitivity Analysis
  sensitivity_analysis: {
    cap_rate_sensitivity: Array<{
      cap_rate: number;
      indicated_value: number;
    }>;
    benefit_stream_sensitivity: Array<{
      benefit_stream: number;
      indicated_value: number;
    }>;
  };

  // Narrative
  narrative: Narrative;

  // Weighting Recommendation
  weighting_recommendation: {
    suggested_weight: number; // 0-100%
    rationale: string;
  };

  extraction_metadata: {
    processing_time_ms: number;
    tokens_used: number;
  };
}

// =============================================================================
// PASS 9: MARKET APPROACH VALUATION
// =============================================================================

export interface GuidelineTransaction {
  transaction_date: string;
  target_company: string;
  target_description: string;
  target_location?: string;
  acquirer?: string;
  transaction_type: 'asset_sale' | 'stock_sale' | 'merger' | 'unknown';

  // Financial Data
  revenue?: number;
  ebitda?: number;
  sde?: number;
  asking_price?: number;
  selling_price: number;

  // Calculated Multiples
  revenue_multiple?: number;
  ebitda_multiple?: number;
  sde_multiple?: number;

  // Comparability Assessment
  comparability_score: number; // 1-10
  comparability_factors: {
    size_comparability: 'very_similar' | 'similar' | 'somewhat_similar' | 'different';
    industry_comparability: 'very_similar' | 'similar' | 'somewhat_similar' | 'different';
    geographic_comparability: 'very_similar' | 'similar' | 'somewhat_similar' | 'different';
    profitability_comparability: 'very_similar' | 'similar' | 'somewhat_similar' | 'different';
  };

  source: string;
  notes?: string;
}

export interface GuidelinePublicCompany {
  company_name: string;
  ticker: string;
  exchange: string;
  as_of_date: string;

  // Company Info
  description: string;
  market_cap: number;
  enterprise_value: number;
  revenue_ltm: number;
  ebitda_ltm: number;

  // Multiples
  ev_revenue: number;
  ev_ebitda: number;
  price_earnings?: number;

  // Comparability
  comparability_score: number;
  comparability_notes: string;

  // Adjustments Needed
  size_adjustment_factor?: number;
  marketability_adjustment_factor?: number;
}

export interface MarketApproachMethod {
  method_name: string;
  transactions_or_companies: (GuidelineTransaction | GuidelinePublicCompany)[];

  // Multiple Analysis
  multiple_type: 'sde' | 'ebitda' | 'revenue';
  multiples_range: { low: number; high: number };
  multiples_median: number;
  multiples_mean: number;

  // Selected Multiple
  selected_multiple: number;
  selection_rationale: string;

  // Indicated Value
  benefit_stream_applied: number;
  indicated_value_before_adjustments: number;

  // Adjustments
  adjustments: Array<{
    description: string;
    amount: number;
    rationale: string;
  }>;

  indicated_value_after_adjustments: number;
}

export interface RuleOfThumb {
  rule_name: string;
  source: string;
  formula: string;
  inputs: Record<string, number>;
  indicated_value: number;
  applicability: 'high' | 'medium' | 'low';
  applicability_notes: string;
}

export interface MarketApproach {
  // Guideline Transaction Method
  guideline_transaction_method?: MarketApproachMethod;

  // Guideline Public Company Method (if applicable)
  guideline_public_company_method?: MarketApproachMethod;

  // Rule of Thumb Methods
  rule_of_thumb_methods: RuleOfThumb[];

  // Reconciliation of Methods
  method_reconciliation: {
    methods_used: string[];
    weights: Record<string, number>;
    weighted_indicated_value: number;
    reconciliation_rationale: string;
  };

  // Final Market Approach Value
  indicated_value_low: number;
  indicated_value_high: number;
  indicated_value_point: number;
}

export interface Pass9Output {
  pass_number: 9;
  pass_name: 'Market Approach Valuation';

  market_approach: MarketApproach;

  // Data Quality Assessment
  data_quality: {
    transaction_data_quality: 'excellent' | 'good' | 'fair' | 'limited';
    transaction_count: number;
    recency_of_transactions: string;
    comparability_overall: 'highly_comparable' | 'comparable' | 'somewhat_comparable' | 'limited_comparability';
    data_limitations: string[];
  };

  // Narrative
  narrative: Narrative;

  // Weighting Recommendation
  weighting_recommendation: {
    suggested_weight: number; // 0-100%
    rationale: string;
  };

  extraction_metadata: {
    processing_time_ms: number;
    tokens_used: number;
  };
}

// =============================================================================
// PASS 10: VALUE SYNTHESIS & RECONCILIATION
// =============================================================================

export interface ApproachSummary {
  approach_name: 'asset' | 'income' | 'market';
  indicated_value_low: number;
  indicated_value_high: number;
  indicated_value_point: number;
  weight: number;
  weighted_value: number;
  confidence_level: 'high' | 'medium' | 'low';
  key_assumptions: string[];
  limitations: string[];
}

export interface DiscountPremium {
  type: 'discount' | 'premium';
  name: string;
  rate: number;
  amount: number;
  rationale: string;
  supporting_data?: string;
  applicable_to: 'all_approaches' | 'specific_approach';
  confidence: 'high' | 'medium' | 'low';
}

export interface ValueSynthesis {
  // Individual Approach Values
  approach_summaries: ApproachSummary[];

  // Weighting
  weighting_method: 'equal' | 'judgment' | 'statistical';
  weighting_rationale: string;

  // Preliminary Value
  preliminary_value_low: number;
  preliminary_value_high: number;
  preliminary_value_point: number;

  // Discounts and Premiums
  discounts_premiums: DiscountPremium[];
  total_discount_premium_adjustment: number;

  // Final Value
  final_value_low: number;
  final_value_high: number;
  final_value_point: number;

  // Value per Share (if applicable)
  shares_outstanding?: number;
  value_per_share?: number;

  // Sanity Checks
  sanity_checks: {
    value_to_revenue_ratio: number;
    value_to_sde_multiple: number;
    value_to_ebitda_multiple: number;
    value_to_book_value_ratio: number;
    reasonableness_assessment: 'reasonable' | 'requires_explanation' | 'outlier';
    notes: string;
  };
}

export interface Pass10Output {
  pass_number: 10;
  pass_name: 'Value Synthesis & Reconciliation';

  value_synthesis: ValueSynthesis;

  // Conclusion
  conclusion: {
    standard_of_value: 'fair_market_value' | 'fair_value' | 'investment_value' | 'intrinsic_value';
    premise_of_value: 'going_concern' | 'liquidation' | 'assemblage';
    valuation_date: string;
    concluded_value: number;
    value_range: { low: number; high: number };
    confidence_level: 'high' | 'medium' | 'low';
    confidence_rationale: string;
  };

  // Key Value Drivers
  key_value_drivers: Array<{
    driver: string;
    impact: 'major_positive' | 'positive' | 'neutral' | 'negative' | 'major_negative';
    description: string;
  }>;

  // Key Risks to Value
  key_risks_to_value: Array<{
    risk: string;
    potential_impact: number; // percentage
    description: string;
  }>;

  // Narrative
  narrative: Narrative;

  extraction_metadata: {
    processing_time_ms: number;
    tokens_used: number;
  };
}

// =============================================================================
// PASS 11: EXECUTIVE SUMMARY & NARRATIVES
// =============================================================================

export interface ExecutiveSummary {
  // Key Findings
  company_overview: string;
  purpose_of_valuation: string;
  valuation_date: string;

  // Financial Highlights
  financial_highlights: {
    most_recent_revenue: number;
    revenue_trend: string;
    most_recent_sde: number;
    most_recent_ebitda: number;
    key_financial_observations: string[];
  };

  // Valuation Conclusion
  valuation_conclusion: {
    concluded_value: number;
    value_range: { low: number; high: number };
    primary_valuation_approach: string;
    key_drivers: string[];
  };

  // Key Strengths & Risks
  key_strengths: string[];
  key_risks: string[];

  // Recommendations (if applicable)
  recommendations?: string[];
}

export interface ReportNarratives {
  // Section Narratives
  executive_summary: Narrative;

  company_overview: Narrative;

  industry_analysis: Narrative;

  financial_analysis: {
    income_statement_analysis: Narrative;
    balance_sheet_analysis: Narrative;
    cash_flow_analysis: Narrative;
    ratio_analysis: Narrative;
    trend_analysis: Narrative;
  };

  normalization_discussion: Narrative;

  risk_assessment: Narrative;

  valuation_approaches: {
    asset_approach_narrative: Narrative;
    income_approach_narrative: Narrative;
    market_approach_narrative: Narrative;
    synthesis_narrative: Narrative;
  };

  conclusion_and_limiting_conditions: Narrative;

  // Appendices
  appendix_notes: Array<{
    title: string;
    content: string;
  }>;
}

export interface Pass11Output {
  pass_number: 11;
  pass_name: 'Executive Summary & Narratives';

  executive_summary: ExecutiveSummary;
  report_narratives: ReportNarratives;

  // Report Metadata
  report_metadata: {
    total_word_count: number;
    section_word_counts: Record<string, number>;
    readability_score?: number;
    report_version: string;
    generated_date: string;
  };

  extraction_metadata: {
    processing_time_ms: number;
    tokens_used: number;
  };
}

// =============================================================================
// PASS 12: QUALITY REVIEW & ERROR CORRECTION
// =============================================================================

export interface QualityCheck {
  category: 'mathematical' | 'logical' | 'completeness' | 'consistency' | 'reasonableness' | 'formatting';
  check_name: string;
  check_description: string;
  passed: boolean;
  severity: 'critical' | 'major' | 'minor' | 'info';
  details?: string;
  affected_sections?: string[];
}

export interface Correction {
  correction_id: string;
  category: string;
  original_value: string | number;
  corrected_value: string | number;
  field_path: string;
  rationale: string;
  auto_applied: boolean;
  requires_review: boolean;
}

export interface QualityReview {
  // Mathematical Checks
  mathematical_checks: {
    balance_sheet_balances: QualityCheck;
    income_statement_totals: QualityCheck;
    sde_calculation_accuracy: QualityCheck;
    valuation_math_accuracy: QualityCheck;
    percentage_calculations: QualityCheck;
    weighted_average_calculations: QualityCheck;
  };

  // Logical Checks
  logical_checks: {
    year_over_year_consistency: QualityCheck;
    ratio_reasonableness: QualityCheck;
    multiple_reasonableness: QualityCheck;
    value_range_logic: QualityCheck;
    date_consistency: QualityCheck;
  };

  // Completeness Checks
  completeness_checks: {
    required_fields_present: QualityCheck;
    all_years_analyzed: QualityCheck;
    all_approaches_attempted: QualityCheck;
    narratives_complete: QualityCheck;
    sources_cited: QualityCheck;
  };

  // Consistency Checks
  consistency_checks: {
    company_name_consistent: QualityCheck;
    financial_data_consistent: QualityCheck;
    terminology_consistent: QualityCheck;
    formatting_consistent: QualityCheck;
  };

  // Reasonableness Checks
  reasonableness_checks: {
    value_to_revenue_reasonable: QualityCheck;
    margins_reasonable: QualityCheck;
    multiples_within_range: QualityCheck;
    growth_rates_reasonable: QualityCheck;
    adjustments_reasonable: QualityCheck;
  };

  // Schema Validation (OUTPUT_SCHEMA.md v2.0)
  schema_validation?: {
    schema_version: '2.0';
    validation_checks: Array<{
      check: string;
      status: 'pass' | 'fail';
      value?: number | string;
      concluded?: number;
      floor?: number;
    }>;
    narrative_word_counts: {
      executive_summary: { target: number; actual: number; status: 'pass' | 'fail' };
      company_overview: { target: number; actual: number; status: 'pass' | 'fail' };
      financial_analysis: { target: number; actual: number; status: 'pass' | 'fail' };
      industry_analysis: { target: number; actual: number; status: 'pass' | 'fail' };
      risk_assessment: { target: number; actual: number; status: 'pass' | 'fail' };
      asset_approach_narrative: { target: number; actual: number; status: 'pass' | 'fail' };
      income_approach_narrative: { target: number; actual: number; status: 'pass' | 'fail' };
      market_approach_narrative: { target: number; actual: number; status: 'pass' | 'fail' };
      valuation_synthesis_narrative: { target: number; actual: number; status: 'pass' | 'fail' };
      assumptions_and_limiting_conditions: { target: number; actual: number; status: 'pass' | 'fail' };
      value_enhancement_recommendations: { target: number; actual: number; status: 'pass' | 'fail' };
    };
    validation_passed: boolean;
    validation_errors: string[];
    validation_warnings: string[];
  };
}

export interface Pass12Output {
  pass_number: 12;
  pass_name: 'Quality Review & Error Correction';

  quality_review: QualityReview;

  // Summary
  quality_summary: {
    total_checks: number;
    passed_checks: number;
    failed_checks: number;
    critical_issues: number;
    major_issues: number;
    minor_issues: number;
    overall_quality_score: number; // 0-100
    quality_grade: 'A' | 'B' | 'C' | 'D' | 'F';
  };

  // Issues Found
  issues_found: ValidationIssue[];

  // Corrections Applied
  corrections_applied: Correction[];
  corrections_pending_review: Correction[];

  // Final Report Status
  report_status: {
    ready_for_delivery: boolean;
    blocking_issues: string[];
    warnings: string[];
    review_notes: string[];
  };

  // Corrected Report Reference
  final_corrected_report: {
    corrections_applied_count: number;
    sections_modified: string[];
    review_timestamp: string;
  };

  extraction_metadata: {
    processing_time_ms: number;
    tokens_used: number;
  };
}

// =============================================================================
// ORCHESTRATION TYPES
// =============================================================================

export type PassOutput =
  | Pass1Output
  | Pass2Output
  | Pass3Output
  | Pass4Output
  | Pass5Output
  | Pass6Output
  | Pass7Output
  | Pass8Output
  | Pass9Output
  | Pass10Output
  | Pass11Output
  | Pass12Output;

export interface PassMetrics {
  pass_number: number;
  pass_name: string;
  start_time: string;
  end_time: string;
  duration_ms: number;
  tokens_input: number;
  tokens_output: number;
  tokens_total: number;
  cost_usd: number;
  retry_count: number;
  success: boolean;
  error_message?: string;
}

export interface TwelvePassFinalReport {
  // Report Identification
  report_id: string;
  report_version: string;
  generated_at: string;

  // Company & Valuation Context
  company_profile: CompanyProfile;
  valuation_date: string;
  standard_of_value: string;
  premise_of_value: string;

  // Financial Summary
  financial_summary: {
    years_analyzed: number;
    most_recent_year: number;
    revenue: number;
    gross_profit: number;
    operating_income: number;
    net_income: number;
    sde: number;
    ebitda: number;
    total_assets: number;
    total_liabilities: number;
    equity: number;
  };

  // Valuation Conclusion
  valuation_conclusion: {
    concluded_value: number;
    value_range_low: number;
    value_range_high: number;
    confidence_level: 'high' | 'medium' | 'low';

    approaches_used: Array<{
      approach: string;
      indicated_value: number;
      weight: number;
    }>;

    discounts_applied: Array<{
      type: string;
      rate: number;
      amount: number;
    }>;
  };

  // All Pass Outputs (for reference)
  pass_outputs: {
    pass_1: Pass1Output;
    pass_2: Pass2Output;
    pass_3: Pass3Output;
    pass_4: Pass4Output;
    pass_5: Pass5Output;
    pass_6: Pass6Output;
    pass_7: Pass7Output;
    pass_8: Pass8Output;
    pass_9: Pass9Output;
    pass_10: Pass10Output;
    pass_11: Pass11Output;
    pass_12: Pass12Output;
  };

  // Executive Summary & Narratives (convenience access)
  executive_summary: ExecutiveSummary;
  report_narratives: ReportNarratives;

  // Quality Information
  quality_score: number;
  quality_grade: string;
  data_limitations: string[];
  key_assumptions: string[];
}

export interface TwelvePassOrchestrationResult {
  // Success/Failure
  success: boolean;
  error?: string;
  error_details?: {
    pass_number: number;
    pass_name: string;
    error_type: string;
    error_message: string;
    stack_trace?: string;
  };

  // Pass Outputs
  pass_outputs: PassOutput[];
  completed_passes: number;
  total_passes: 12;

  // Final Report (only if success)
  final_report?: TwelvePassFinalReport;

  // Final Valuation Report in new schema format (matches OUTPUT_SCHEMA.md)
  final_valuation_report?: import('./final-report-schema').FinalValuationReport;

  // Validation result for the final report
  validation_result?: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };

  // Metrics
  metrics: {
    total_duration_ms: number;
    total_tokens_used: number;
    total_cost_usd: number;
    pass_metrics: PassMetrics[];

    average_pass_duration_ms: number;
    slowest_pass: { number: number; name: string; duration_ms: number };
    most_expensive_pass: { number: number; name: string; cost_usd: number };
  };

  // Processing Info
  processing_info: {
    started_at: string;
    completed_at: string;
    model_version: string;
    orchestrator_version: string;
    document_pages_processed: number;
    retry_count: number;
  };
}

// =============================================================================
// STATUS TRACKING
// =============================================================================

export type TwelvePassStatus =
  | 'pending'
  | 'pass_1_processing' | 'pass_1_complete'
  | 'pass_2_processing' | 'pass_2_complete'
  | 'pass_3_processing' | 'pass_3_complete'
  | 'pass_4_processing' | 'pass_4_complete'
  | 'pass_5_processing' | 'pass_5_complete'
  | 'pass_6_processing' | 'pass_6_complete'
  | 'pass_7_processing' | 'pass_7_complete'
  | 'pass_8_processing' | 'pass_8_complete'
  | 'pass_9_processing' | 'pass_9_complete'
  | 'pass_10_processing' | 'pass_10_complete'
  | 'pass_11_processing' | 'pass_11_complete'
  | 'pass_12_processing' | 'pass_12_complete'
  | 'completed'
  | 'error'
  | 'cancelled';

export interface TwelvePassProgressCallback {
  (
    pass: number,
    status: 'starting' | 'processing' | 'complete' | 'error',
    message: string,
    percentage: number,
    metrics?: Partial<PassMetrics>
  ): Promise<void>;
}

// =============================================================================
// KNOWLEDGE INJECTION
// =============================================================================

export interface IndustryKnowledge {
  naics_code: string;
  industry_name: string;

  typical_multiples: {
    sde_range: { low: number; high: number };
    ebitda_range: { low: number; high: number };
    revenue_range: { low: number; high: number };
  };

  typical_margins: {
    gross_margin_range: { low: number; high: number };
    operating_margin_range: { low: number; high: number };
    net_margin_range: { low: number; high: number };
  };

  key_risk_factors: string[];
  key_value_drivers: string[];
  common_adjustments: string[];

  market_characteristics: {
    fragmentation: string;
    growth_rate: string;
    cyclicality: string;
    barriers_to_entry: string;
  };
}

export interface ValuationKnowledge {
  // Capitalization Rate Data
  risk_free_rate: {
    current_rate: number;
    source: string;
    as_of_date: string;
  };

  equity_risk_premium: {
    current_rate: number;
    source: string;
  };

  size_premiums: Array<{
    size_category: string;
    revenue_range: { min: number; max: number };
    premium: number;
    source: string;
  }>;

  // Discount Guidance
  lack_of_marketability_discounts: {
    typical_range: { low: number; high: number };
    factors_affecting: string[];
  };

  // Normalization Guidance
  owner_compensation_benchmarks: Array<{
    revenue_range: { min: number; max: number };
    typical_compensation: number;
    source: string;
  }>;
}
