/**
 * Type Definitions for 6-Pass Dynamic Valuation System
 *
 * This file contains all TypeScript interfaces for the multi-pass Claude-based
 * business valuation system with dynamic knowledge injection.
 */

// ============================================================================
// CORE WRAPPER TYPES
// ============================================================================

/**
 * Every pass outputs this structure - analysis plus knowledge requests
 */
export interface PassOutput<T> {
  analysis: T;
  knowledge_requests: KnowledgeRequests;
  knowledge_reasoning: string;
}

/**
 * Knowledge requests that Claude can make between passes
 */
export interface KnowledgeRequests {
  industry_specific?: string[];
  tax_form_specific?: string[];
  risk_factors?: string[];
  comparable_industries?: string[];
  benchmarks_needed?: string[];
  valuation_methodologies?: string[];
  regulatory_considerations?: string[];
}

/**
 * Injected knowledge from the knowledge base
 */
export interface InjectedKnowledge {
  industry_data?: IndustryKnowledge;
  tax_form_guidance?: TaxFormGuidance;
  risk_framework?: RiskFramework;
  valuation_multiples?: ValuationMultiples;
  benchmarks?: IndustryBenchmarks;
  regulatory_info?: RegulatoryInfo;
}

export interface IndustryKnowledge {
  naics_code: string;
  industry_name: string;
  description: string;
  typical_characteristics: string[];
  valuation_considerations: string[];
  market_data: {
    market_size?: string;
    growth_rate?: string;
    key_players?: string[];
  };
}

export interface TaxFormGuidance {
  form_type: string;
  key_lines: Array<{
    line: string;
    description: string;
    valuation_relevance: string;
  }>;
  common_adjustments: string[];
  red_flags: string[];
}

export interface RiskFramework {
  factors: Array<{
    name: string;
    weight: number;
    scoring_criteria: Record<number, string>;
  }>;
  adjustment_guidelines: Record<string, number>;
}

export interface ValuationMultiples {
  industry: string;
  sde_multiple: { low: number; median: number; high: number };
  ebitda_multiple: { low: number; median: number; high: number };
  revenue_multiple: { low: number; median: number; high: number };
  source: string;
  as_of_date: string;
}

export interface IndustryBenchmarks {
  industry: string;
  profit_margins: { gross: number; operating: number; net: number };
  expense_ratios: Record<string, number>;
  revenue_per_employee: number;
  inventory_turnover?: number;
  accounts_receivable_days?: number;
}

export interface RegulatoryInfo {
  industry: string;
  key_regulations: string[];
  compliance_requirements: string[];
  risk_considerations: string[];
}

// ============================================================================
// PASS 1 - DOCUMENT EXTRACTION
// ============================================================================

export type DocumentType = '1120-S' | '1120' | '1065' | 'Schedule C' | 'Financial Statement' | 'Other';
export type EntityType = 'S-Corporation' | 'C-Corporation' | 'Partnership' | 'Sole Proprietorship' | 'LLC';
export type QualityLevel = 'Good' | 'Fair' | 'Poor';
export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

export interface Pass1Analysis {
  document_info: {
    document_type: DocumentType;
    fiscal_years: string[];
    page_count: number;
    quality_assessment: QualityLevel;
    documents_received: Array<{
      filename: string;
      type: string;
      years_covered: string[];
    }>;
  };
  company_info: {
    legal_name: string;
    dba_name: string | null;
    entity_type: EntityType;
    ein: string | null;
    address: {
      street: string | null;
      city: string | null;
      state: string | null;
      zip: string | null;
    };
    fiscal_year_end: string;
    date_incorporated: string | null;
    state_of_incorporation: string | null;
  };
  industry_classification: {
    detected_industry: string;
    naics_code: string;
    sic_code: string | null;
    industry_keywords: string[];
    business_activity_description: string;
    confidence: ConfidenceLevel;
  };
  financial_data: Record<string, YearlyFinancialData>;
  extraction_notes: string[];
  data_quality_flags: string[];
  missing_information: string[];
}

export interface YearlyFinancialData {
  period: string;
  source_document: string;
  revenue: {
    gross_receipts: number;
    returns_allowances: number;
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
    pension_profit_sharing: number;
    employee_benefits: number;
    other_deductions: number;
    total_operating_expenses: number;
  };
  operating_income: number;
  other_income: number;
  other_expenses: number;
  net_income: number;
  balance_sheet: BalanceSheetData;
}

export interface BalanceSheetData {
  assets: {
    cash: number;
    accounts_receivable: number;
    inventory: number;
    prepaid_expenses: number;
    other_current_assets: number;
    total_current_assets: number;
    land: number;
    buildings: number;
    machinery_equipment: number;
    furniture_fixtures: number;
    vehicles: number;
    fixed_assets_gross: number;
    accumulated_depreciation: number;
    fixed_assets_net: number;
    intangible_assets: number;
    other_assets: number;
    total_assets: number;
  };
  liabilities: {
    accounts_payable: number;
    accrued_expenses: number;
    current_portion_ltd: number;
    notes_payable_current: number;
    other_current_liabilities: number;
    total_current_liabilities: number;
    long_term_debt: number;
    notes_payable_long_term: number;
    other_long_term_liabilities: number;
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

// ============================================================================
// PASS 2 - INDUSTRY ANALYSIS
// ============================================================================

export type GrowthOutlook = 'Growing' | 'Stable' | 'Declining';
export type BarrierLevel = 'Low' | 'Medium' | 'High';

export interface Pass2Analysis {
  industry_overview: {
    industry_name: string;
    naics_code: string;
    naics_description: string;
    market_size: string;
    growth_rate: string;
    growth_outlook: GrowthOutlook;
    economic_sensitivity: 'Cyclical' | 'Non-Cyclical' | 'Counter-Cyclical';
    key_trends: string[];
    technology_impact: string;
    regulatory_environment: string;
    labor_considerations: string;
  };
  competitive_landscape: {
    market_structure: 'Fragmented' | 'Concentrated' | 'Oligopoly' | 'Monopolistic Competition';
    barriers_to_entry: BarrierLevel;
    barriers_description: string[];
    major_players: string[];
    competitive_factors: string[];
    threat_of_substitutes: BarrierLevel;
    supplier_power: BarrierLevel;
    buyer_power: BarrierLevel;
  };
  industry_benchmarks: {
    revenue_multiple_range: MultipleRange;
    sde_multiple_range: MultipleRange;
    ebitda_multiple_range: MultipleRange;
    profit_margin_benchmark: BenchmarkRange;
    gross_margin_benchmark: BenchmarkRange;
    operating_margin_benchmark: BenchmarkRange;
    revenue_per_employee: BenchmarkRange;
    typical_deal_structure: string;
    typical_expenses: Record<string, string>;
  };
  rules_of_thumb: {
    primary_valuation_method: string;
    primary_method_rationale: string;
    alternative_methods: string[];
    special_considerations: string[];
    inventory_treatment: string;
    ar_treatment: string;
    equipment_considerations: string;
    real_estate_considerations: string;
    goodwill_expectations: string;
  };
  company_positioning: {
    relative_size: 'Below Average' | 'Average' | 'Above Average';
    relative_performance: 'Below Average' | 'Average' | 'Above Average';
    competitive_advantages: string[];
    competitive_disadvantages: string[];
  };
  due_diligence_questions: string[];
  industry_narrative: string;
}

export interface MultipleRange {
  low: number;
  median: number;
  high: number;
  source?: string;
}

export interface BenchmarkRange {
  low: number;
  median: number;
  high: number;
  unit?: string;
}

// ============================================================================
// PASS 3 - EARNINGS NORMALIZATION
// ============================================================================

export type EarningsQuality = 'High' | 'Moderate' | 'Low';
export type EarningsTrend = 'Improving' | 'Stable' | 'Declining' | 'Volatile';

export interface Pass3Analysis {
  sde_calculation: {
    periods: SDEPeriod[];
    weighted_average_sde: {
      calculation_method: string;
      weights: number[];
      weighted_sde: number;
      weighting_rationale: string;
    };
    sde_trend_analysis: string;
  };
  ebitda_calculation: {
    periods: EBITDAPeriod[];
    weighted_average_ebitda: number;
    ebitda_trend_analysis: string;
  };
  earnings_quality_assessment: {
    consistency: EarningsQuality;
    consistency_rationale: string;
    trend: EarningsTrend;
    trend_rationale: string;
    sustainability: EarningsQuality;
    sustainability_rationale: string;
    red_flags: string[];
    strengths: string[];
    adjustments_confidence: ConfidenceLevel;
  };
  key_metrics: {
    average_revenue: number;
    average_gross_margin: number;
    average_operating_margin: number;
    average_net_margin: number;
    revenue_growth_rate: number;
    earnings_growth_rate: number;
  };
  owner_benefit_analysis: {
    total_owner_compensation: number;
    fair_market_replacement_salary: number;
    excess_owner_compensation: number;
    owner_perks_identified: Array<{
      item: string;
      amount: number;
      add_back_percentage: number;
    }>;
  };
  methodology_notes: string;
  earnings_narrative: string;
}

export interface SDEPeriod {
  period: string;
  starting_net_income: number;
  adjustments: SDEAdjustment[];
  total_adjustments: number;
  sde: number;
  sde_margin: number;
}

export interface SDEAdjustment {
  category: 'Owner Compensation' | 'Depreciation/Amortization' | 'Interest' | 'Non-Recurring' | 'Personal Expenses' | 'Related Party' | 'Other';
  description: string;
  amount: number;
  source_line: string;
  justification: string;
  confidence: ConfidenceLevel;
}

export interface EBITDAPeriod {
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
  other_normalizing_adjustments: Array<{
    description: string;
    amount: number;
  }>;
  adjusted_ebitda: number;
  ebitda_margin: number;
}

// ============================================================================
// PASS 4 - RISK ASSESSMENT
// ============================================================================

export type RiskRating = 'Low' | 'Moderate' | 'High' | 'Very High';
export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Critical';

export interface Pass4Analysis {
  overall_risk_rating: RiskRating;
  overall_risk_score: number;
  risk_category: 'Low Risk' | 'Below Average Risk' | 'Average Risk' | 'Above Average Risk' | 'High Risk';
  risk_factors: RiskFactor[];
  weighted_risk_calculation: {
    factor_scores: Array<{
      factor: string;
      score: number;
      weight: number;
      weighted: number;
    }>;
    total_weighted_score: number;
    calculation_notes: string;
  };
  company_specific_risks: Array<{
    risk: string;
    severity: RiskLevel;
    likelihood: RiskLevel;
    mitigation_possible: boolean;
    mitigation_strategy?: string;
  }>;
  company_specific_strengths: Array<{
    strength: string;
    impact: 'Minor' | 'Moderate' | 'Significant';
    sustainability: 'Short-term' | 'Medium-term' | 'Long-term';
  }>;
  risk_adjusted_multiple: {
    base_industry_multiple: number;
    size_adjustment: number;
    financial_performance_adjustment: number;
    customer_concentration_adjustment: number;
    owner_dependence_adjustment: number;
    other_adjustments: Array<{
      factor: string;
      adjustment: number;
    }>;
    total_risk_adjustment: number;
    adjusted_multiple: number;
    adjustment_rationale: string;
  };
  deal_structure_considerations: {
    recommended_deal_structure: string;
    earnout_recommendation: boolean;
    earnout_rationale?: string;
    seller_note_recommendation: boolean;
    seller_note_rationale?: string;
    training_transition_period: string;
    non_compete_recommendation: string;
  };
  risk_narrative: string;
}

export interface RiskFactor {
  category: string;
  factor_name: string;
  weight: number;
  score: number;
  rating: RiskLevel;
  description: string;
  evidence: string[];
  mitigation: string;
  impact_on_multiple: number;
}

// ============================================================================
// PASS 5 - VALUATION CALCULATION
// ============================================================================

export type BenefitStreamType = 'SDE' | 'EBITDA';

export interface Pass5Analysis {
  asset_approach: AssetApproach;
  income_approach: IncomeApproach;
  market_approach: MarketApproach;
  valuation_synthesis: ValuationSynthesis;
}

export interface AssetApproach {
  methodology: string;
  applicable: boolean;
  applicability_rationale: string;
  book_value_of_equity: number;
  asset_adjustments: AssetAdjustment[];
  liability_adjustments: LiabilityAdjustment[];
  total_asset_adjustments: number;
  total_liability_adjustments: number;
  adjusted_net_asset_value: number;
  goodwill_indication: number;
  weight_assigned: number;
  weight_rationale: string;
  narrative: string;
}

export interface AssetAdjustment {
  asset: string;
  book_value: number;
  fair_market_value: number;
  adjustment: number;
  rationale: string;
}

export interface LiabilityAdjustment {
  liability: string;
  book_value: number;
  fair_market_value: number;
  adjustment: number;
  rationale: string;
}

export interface IncomeApproach {
  methodology: string;
  applicable: boolean;
  applicability_rationale: string;
  benefit_stream_used: BenefitStreamType;
  benefit_stream_value: number;
  benefit_stream_rationale: string;
  capitalization_rate: CapitalizationRate;
  multiple_derivation: {
    base_multiple: number;
    base_multiple_source: string;
    adjustments: Array<{
      factor: string;
      adjustment: number;
      rationale: string;
    }>;
    final_multiple: number;
  };
  income_approach_value: number;
  sanity_check: {
    implied_roi: number;
    payback_period: number;
    reasonable: boolean;
    notes: string;
  };
  weight_assigned: number;
  weight_rationale: string;
  narrative: string;
}

export interface CapitalizationRate {
  risk_free_rate: number;
  equity_risk_premium: number;
  size_premium: number;
  industry_risk_premium: number;
  company_specific_risk_premium: number;
  total_discount_rate: number;
  long_term_growth_rate: number;
  capitalization_rate: number;
  build_up_notes: string;
}

export interface MarketApproach {
  methodology: string;
  applicable: boolean;
  applicability_rationale: string;
  comparable_transactions: {
    source: string;
    data_quality: QualityLevel;
    number_of_comparables: number;
    selection_criteria: string;
    comparable_summary: ComparableTransaction[];
  };
  multiple_selection: {
    sde_multiple_selected: number;
    ebitda_multiple_selected: number;
    revenue_multiple_selected: number;
    selection_rationale: string;
  };
  multiple_applied: {
    type: 'SDE' | 'EBITDA' | 'Revenue';
    base_multiple: number;
    adjustments: Array<{
      factor: string;
      adjustment: number;
    }>;
    adjusted_multiple: number;
  };
  benefit_stream_value: number;
  market_approach_value: number;
  weight_assigned: number;
  weight_rationale: string;
  narrative: string;
}

export interface ComparableTransaction {
  industry: string;
  revenue_range: string;
  sde_multiple: number;
  ebitda_multiple?: number;
  revenue_multiple?: number;
  notes?: string;
}

export interface ValuationSynthesis {
  approach_summary: ApproachSummary[];
  preliminary_value: number;
  discounts_and_premiums: DiscountsAndPremiums;
  final_valuation: FinalValuation;
  value_sanity_checks: {
    revenue_multiple_implied: number;
    sde_multiple_implied: number;
    price_per_employee?: number;
    within_industry_range: boolean;
    notes: string;
  };
  synthesis_narrative: string;
}

export interface ApproachSummary {
  approach: string;
  indicated_value: number;
  weight: number;
  weighted_value: number;
  rationale: string;
}

export interface DiscountsAndPremiums {
  dlom: {
    applicable: boolean;
    percentage: number;
    rationale: string;
  };
  control_premium: {
    applicable: boolean;
    percentage: number;
    rationale: string;
  };
  key_person_discount: {
    applicable: boolean;
    percentage: number;
    rationale: string;
  };
  other_adjustments: Array<{
    name: string;
    percentage: number;
    rationale: string;
  }>;
  total_discount_premium_percentage: number;
}

export interface FinalValuation {
  concluded_value: number;
  valuation_range_low: number;
  valuation_range_high: number;
  confidence_level: ConfidenceLevel;
  confidence_rationale: string;
  value_drivers: string[];
  value_detractors: string[];
}

// ============================================================================
// PASS 6 - NARRATIVE GENERATION
// ============================================================================

export interface Pass6Analysis {
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
  certification_statement: NarrativeSection;
}

export interface NarrativeSection {
  title: string;
  content: string;
  word_count: number;
  key_points: string[];
}

// ============================================================================
// ORCHESTRATION TYPES
// ============================================================================

export interface PassResult<T> {
  pass: number;
  passName: string;
  output: PassOutput<T>;
  tokensUsed: {
    input: number;
    output: number;
  };
  processingTimeMs: number;
  knowledgeInjected: string[];
  success: boolean;
  error?: string;
}

export interface OrchestrationResult {
  success: boolean;
  finalOutput: FinalValuationOutput | null;
  error?: string;
  passOutputs: Array<{
    pass: number;
    success: boolean;
    output: unknown;
    error?: string;
  }>;
  totalTokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  totalCost: number;
  processingTimeMs: number;
  consistencyCheck?: {
    passed: boolean;
    errors: string[];
    warnings: string[];
  };
  partialResults?: {
    pass1: Pass1Analysis | null;
    pass2: Pass2Analysis | null;
    pass3: Pass3Analysis | null;
    pass4: Pass4Analysis | null;
    pass5: Pass5Analysis | null;
  };
}

// ============================================================================
// FINAL VALUATION OUTPUT (Matches pass-6-synthesis OUTPUT_SCHEMA)
// ============================================================================

/**
 * This interface matches the OUTPUT_SCHEMA from pass-6-synthesis.ts
 * and is used for PDF generation.
 */
export interface FinalValuationOutput {
  valuation_summary: {
    company_name: string;
    valuation_date: string;
    report_date: string;
    prepared_by: string;
    standard_of_value: string;
    premise_of_value: string;
    concluded_value: number;
    value_range_low: number;
    value_range_high: number;
    confidence_level: ConfidenceLevel;
  };

  company_overview: {
    business_name: string;
    legal_entity_type: string;
    industry: string;
    naics_code: string;
    years_in_business: number;
    location: string;
    number_of_employees: number;
    business_description: string;
    products_services: string[];
    key_customers: string;
    competitive_advantages: string[];
    ownership_structure: string;
  };

  financial_summary: {
    fiscal_year_end: string;
    years_analyzed: number[];
    revenue_trend: {
      amounts: number[];
      growth_rates: number[];
      trend_description: string;
    };
    profitability: {
      gross_margin_avg: number;
      operating_margin_avg: number;
      net_margin_avg: number;
    };
    balance_sheet_summary: {
      total_assets: number;
      total_liabilities: number;
      book_value_equity: number;
      working_capital: number;
      debt_to_equity_ratio: number;
    };
    cash_flow_indicators: {
      operating_cash_flow_estimate: number;
      capex_requirements: string;
      working_capital_needs: string;
    };
  };

  normalized_earnings: {
    sde_analysis: {
      years: number[];
      reported_net_income: number[];
      total_add_backs: number[];
      annual_sde: number[];
      weighted_average_sde: number;
      add_back_categories: Array<{
        category: string;
        description: string;
        amount: number;
        justification: string;
      }>;
    };
    ebitda_analysis: {
      years: number[];
      annual_ebitda: number[];
      weighted_average_ebitda: number;
      ebitda_margin_avg: number;
    };
    benefit_stream_selection: {
      selected_metric: BenefitStreamType;
      selected_amount: number;
      selection_rationale: string;
    };
  };

  industry_analysis: {
    industry_name: string;
    sector: string;
    market_size: string;
    growth_outlook: string;
    competitive_landscape: string;
    key_success_factors: string[];
    industry_risks: string[];
    industry_multiples: {
      sde_multiple_range: { low: number; median: number; high: number };
      ebitda_multiple_range: { low: number; median: number; high: number };
      revenue_multiple_range: { low: number; median: number; high: number };
    };
    comparable_transactions_summary: string;
  };

  risk_assessment: {
    overall_risk_score: number;
    risk_category: string;
    risk_factors: Array<{
      factor: string;
      weight: number;
      score: number;
      weighted_score: number;
      assessment: string;
    }>;
    key_risks: string[];
    risk_mitigants: string[];
    multiple_adjustment: {
      base_adjustment: number;
      rationale: string;
    };
  };

  valuation_approaches: {
    asset_approach: {
      methodology: string;
      book_value_equity: number;
      asset_adjustments: number;
      liability_adjustments: number;
      adjusted_net_asset_value: number;
      weight_in_conclusion: number;
      applicability_assessment: string;
    };
    income_approach: {
      methodology: string;
      benefit_stream: BenefitStreamType;
      benefit_stream_amount: number;
      capitalization_rate: {
        risk_free_rate: number;
        equity_risk_premium: number;
        size_premium: number;
        industry_premium: number;
        company_specific_premium: number;
        total_discount_rate: number;
        long_term_growth_rate: number;
        capitalization_rate: number;
      };
      indicated_value: number;
      implied_multiple: number;
      weight_in_conclusion: number;
    };
    market_approach: {
      methodology: string;
      multiple_type: string;
      benefit_stream_amount: number;
      selected_multiple: number;
      multiple_source: string;
      adjustments_applied: Array<{
        adjustment_type: string;
        adjustment_amount: number;
        rationale: string;
      }>;
      adjusted_multiple: number;
      indicated_value: number;
      weight_in_conclusion: number;
    };
  };

  valuation_conclusion: {
    approach_values: {
      asset_approach: { value: number; weight: number; weighted_value: number };
      income_approach: { value: number; weight: number; weighted_value: number };
      market_approach: { value: number; weight: number; weighted_value: number };
    };
    preliminary_value: number;
    discounts_applied: Array<{
      discount_type: string;
      discount_percentage: number;
      discount_amount: number;
      rationale: string;
    }>;
    total_discounts: number;
    concluded_fair_market_value: number;
    value_range: {
      low: number;
      mid: number;
      high: number;
      range_rationale: string;
    };
    per_share_value: number | null;
    valuation_date: string;
  };

  narratives: {
    executive_summary: string;
    company_overview: string;
    financial_analysis: string;
    industry_analysis: string;
    risk_assessment: string;
    asset_approach_narrative: string;
    income_approach_narrative: string;
    market_approach_narrative: string;
    valuation_synthesis: string;
    assumptions_and_limiting_conditions: string;
    value_enhancement_recommendations: string;
  };

  supporting_schedules?: {
    add_back_schedule: Array<{
      year: number;
      category: string;
      description: string;
      amount: number;
      tax_return_line: string;
      justification: string;
    }>;
    capitalization_rate_buildup: Array<{
      component: string;
      rate: number;
      source: string;
    }>;
    multiple_comparison: Array<{
      source: string;
      multiple_type: string;
      multiple: number;
      relevance: string;
    }>;
  };

  appendices?: {
    data_sources: string[];
    documents_reviewed: string[];
    valuation_standards_applied: string[];
    limiting_conditions: string[];
    certification: string;
  };

  metadata: {
    report_version: string;
    generation_date: string;
    model_version: string;
    pass_count: number;
    confidence_metrics: {
      data_quality: ConfidenceLevel;
      comparable_quality: ConfidenceLevel;
      overall_confidence: ConfidenceLevel;
    };
  };
}

export interface IncomeStatementOutput {
  period: string;
  source_document: string;
  revenue: {
    gross_receipts: number;
    returns_and_allowances: number;
    net_revenue: number;
  };
  cost_of_goods_sold: {
    total_cogs: number;
  };
  gross_profit: number;
  operating_expenses: {
    officer_compensation: number;
    salaries_and_wages: number;
    rent: number;
    interest_expense: number;
    depreciation: number;
    amortization: number;
    other_deductions: number;
    total_operating_expenses: number;
  };
  operating_income: number;
  net_income: number;
}

export interface BalanceSheetOutput {
  period: string;
  assets: {
    current_assets: {
      cash: number;
      accounts_receivable: number;
      inventory: number;
      total_current_assets: number;
    };
    fixed_assets: {
      net_fixed_assets: number;
    };
    total_assets: number;
  };
  liabilities: {
    current_liabilities: {
      total_current_liabilities: number;
    };
    total_liabilities: number;
  };
  equity: {
    total_equity: number;
  };
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface ProcessValuationRequest {
  reportId: string;
  companyName: string;
  documentPaths: string[];
  options?: {
    skipPasses?: number[];
    maxRetries?: number;
    debugMode?: boolean;
  };
}

export interface ProcessValuationResponse {
  success: boolean;
  status: 'completed' | 'failed' | 'processing';
  reportId: string;
  valuation?: {
    concluded_value: number;
    range_low: number;
    range_high: number;
    confidence: ConfidenceLevel;
  };
  processingDetails?: {
    passesCompleted: number;
    totalPasses: number;
    tokensUsed: number;
    estimatedCost: number;
    processingTimeMs: number;
  };
  error?: string;
  warnings?: string[];
}

// ============================================================================
// KNOWLEDGE BASE TYPES
// ============================================================================

export interface KnowledgeBaseQuery {
  type: 'industry' | 'tax_form' | 'risk' | 'multiples' | 'benchmarks' | 'regulatory';
  identifier: string;
  context?: Record<string, any>;
}

export interface KnowledgeBaseResponse {
  found: boolean;
  data: InjectedKnowledge | null;
  source: string;
  confidence: ConfidenceLevel;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type PassNumber = 1 | 2 | 3 | 4 | 5 | 6;

export type PassAnalysisType =
  | Pass1Analysis
  | Pass2Analysis
  | Pass3Analysis
  | Pass4Analysis
  | Pass5Analysis
  | Pass6Analysis;

export interface PassConfig {
  passNumber: PassNumber;
  name: string;
  description: string;
  maxTokens: number;
  temperature: number;
  requiredPreviousPasses: PassNumber[];
}

export const PASS_CONFIGS: Record<PassNumber, PassConfig> = {
  1: {
    passNumber: 1,
    name: 'Document Extraction',
    description: 'Extract financial data and company information from uploaded documents',
    maxTokens: 8192,
    temperature: 0,
    requiredPreviousPasses: [],
  },
  2: {
    passNumber: 2,
    name: 'Industry Analysis',
    description: 'Analyze industry context, benchmarks, and competitive landscape',
    maxTokens: 8192,
    temperature: 0.3,
    requiredPreviousPasses: [1],
  },
  3: {
    passNumber: 3,
    name: 'Earnings Normalization',
    description: 'Calculate SDE, EBITDA, and normalized earnings with adjustments',
    maxTokens: 8192,
    temperature: 0,
    requiredPreviousPasses: [1, 2],
  },
  4: {
    passNumber: 4,
    name: 'Risk Assessment',
    description: 'Evaluate company-specific and industry risks, determine multiple adjustments',
    maxTokens: 8192,
    temperature: 0.2,
    requiredPreviousPasses: [1, 2, 3],
  },
  5: {
    passNumber: 5,
    name: 'Valuation Calculation',
    description: 'Apply Asset, Income, and Market approaches to determine value',
    maxTokens: 8192,
    temperature: 0,
    requiredPreviousPasses: [1, 2, 3, 4],
  },
  6: {
    passNumber: 6,
    name: 'Narrative Generation',
    description: 'Generate comprehensive narrative sections for the final report',
    maxTokens: 16384,
    temperature: 0.4,
    requiredPreviousPasses: [1, 2, 3, 4, 5],
  },
};
