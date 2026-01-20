/**
 * TypeScript interfaces for the 6-pass valuation system
 *
 * This module defines the data structures used throughout the
 * orchestrated valuation pipeline.
 */

// =============================================================================
// KNOWLEDGE REQUEST TYPES
// =============================================================================

export interface KnowledgeRequests {
  industry_specific: string[];
  tax_form_specific: string[];
  risk_factors: string[];
  comparable_industries: string[];
  benchmarks_needed: string[];
}

export interface PassOutput<T> {
  analysis: T;
  knowledge_requests: KnowledgeRequests;
  knowledge_reasoning: string;
}

// =============================================================================
// PASS 1: DOCUMENT EXTRACTION
// =============================================================================

export interface Pass1Analysis {
  document_info: {
    documents_found: Array<{
      type: "1120-S" | "1120" | "1065" | "Schedule C" | "Income Statement" | "Balance Sheet" | "Combined Financial Statement";
      years: string[];
      source: string; // e.g., "Pages 1-5" or "QuickBooks Export"
    }>;
    primary_type: "Tax Return" | "Financial Statement" | "Both";
    quality: "High" | "Medium" | "Low";
    page_count: number;
  };
  company_info: {
    name: string;
    entity_type: string;
    address: {
      street: string | null;
      city: string | null;
      state: string | null;
      zip: string | null;
    };
    ein: string | null;
  };
  industry_classification: {
    naics_code: string;
    naics_description: string;
    confidence: "High" | "Medium" | "Low";
    keywords: string[];
  };
  financial_data: {
    [year: string]: {
      revenue: number;
      cost_of_goods_sold: number;
      gross_profit: number;
      operating_expenses: Record<string, number>;
      owner_compensation: number; // Specifically tracked for SDE calculation
      net_income: number;
      source_document: string; // e.g., "Form 1120-S" or "P&L Statement"
      balance_sheet?: {
        total_assets: number;
        total_liabilities: number;
        total_equity: number;
        cash: number;
        accounts_receivable: number;
        inventory: number;
        fixed_assets: number;
        accumulated_depreciation: number;
        source_document: string; // e.g., "Schedule L" or "Balance Sheet"
      };
    };
  };
  extraction_notes: string;
  data_quality_flags: string[];
}

// =============================================================================
// PASS 2: INDUSTRY ANALYSIS
// =============================================================================

export interface Pass2Analysis {
  industry_overview: {
    sector: string;
    subsector: string;
    market_size: string;
    growth_rate: string;
    growth_outlook: "Growing" | "Stable" | "Declining";
    key_trends: string[];
  };
  competitive_landscape: string;
  industry_benchmarks: {
    gross_margin: { low: number; median: number; high: number };
    operating_margin: { low: number; median: number; high: number };
    sde_margin: { low: number; median: number; high: number };
  };
  valuation_multiples: {
    sde_multiple: { low: number; typical: number; high: number };
    revenue_multiple: { low: number; typical: number; high: number };
    source: string;
  };
  rules_of_thumb: string[];
  due_diligence_questions: string[];
  industry_narrative: string;
}

// =============================================================================
// PASS 3: EARNINGS NORMALIZATION
// =============================================================================

export interface SDEAdjustment {
  category: string;
  description: string;
  amount: number;
  source_line: string;
  justification: string;
}

export interface Pass3Analysis {
  sde_calculation: {
    periods: {
      period: string;
      starting_net_income: number;
      adjustments: SDEAdjustment[];
      total_adjustments: number;
      sde: number;
    }[];
    weighted_average_sde: number;
    weighting_method: string;
  };
  ebitda_calculation: {
    periods: {
      period: string;
      starting_net_income: number;
      add_interest: number;
      add_taxes: number;
      add_depreciation: number;
      add_amortization: number;
      owner_comp_adjustment: number;
      adjusted_ebitda: number;
    }[];
    weighted_average_ebitda: number;
  };
  earnings_quality_assessment: {
    quality_score: "High" | "Medium" | "Low";
    factors: string[];
  };
  earnings_narrative: string;
}

// =============================================================================
// PASS 4: RISK ASSESSMENT
// =============================================================================

export interface RiskScore {
  factor: string;
  weight: number;
  score: number;
  description: string;
  mitigation: string;
  impact_on_value: string;
}

export interface Pass4Analysis {
  overall_risk_rating: "Low" | "Below Average" | "Average" | "Above Average" | "High";
  overall_risk_score: number;
  risk_factors: RiskScore[];
  company_specific_risks: string[];
  company_specific_strengths: string[];
  risk_adjusted_multiple_adjustment: number;
  risk_narrative: string;
}

// =============================================================================
// PASS 5: VALUATION CALCULATION
// =============================================================================

export interface Pass5Analysis {
  asset_approach: {
    book_value: number;
    adjustments: { item: string; adjustment: number; reason: string }[];
    adjusted_net_asset_value: number;
    weight: number;
    narrative: string;
  };
  income_approach: {
    normalized_earnings: number;
    earnings_type: "SDE" | "EBITDA";
    cap_rate_buildup: {
      risk_free_rate: number;
      equity_risk_premium: number;
      size_premium: number;
      company_specific_risk: number;
      total_cap_rate: number;
    };
    capitalized_value: number;
    weight: number;
    narrative: string;
  };
  market_approach: {
    comparable_multiple: number;
    multiple_type: "SDE" | "Revenue";
    multiple_source: string;
    applied_earnings: number;
    market_value: number;
    weight: number;
    narrative: string;
  };
}

// =============================================================================
// PASS 6: NARRATIVE SYNTHESIS (Final Output)
// =============================================================================

export interface FinalValuationOutput {
  schema_version: "2.0";
  valuation_date: string;
  generated_at: string;
  company_profile: {
    legal_name: string;
    entity_type: string;
    tax_form_type: string;
    ein: string | null;
    address: {
      street: string | null;
      city: string | null;
      state: string | null;
      zip: string | null;
    };
    industry: {
      naics_code: string;
      naics_description: string;
      industry_sector: string;
    };
    business_description: string;
  };
  financial_data: {
    periods_analyzed: string[];
    income_statements: Array<{
      period: string;
      revenue: number;
      cost_of_goods_sold: number;
      gross_profit: number;
      operating_expenses: number;
      net_income: number;
    }>;
    balance_sheets: Array<{
      period: string;
      total_assets: number;
      total_liabilities: number;
      total_equity: number;
    }>;
  };
  normalized_earnings: {
    sde_calculation: Pass3Analysis['sde_calculation'];
    ebitda_calculation: Pass3Analysis['ebitda_calculation'];
  };
  industry_analysis: Pass2Analysis;
  risk_assessment: Pass4Analysis;
  valuation_approaches: Pass5Analysis;
  valuation_synthesis: {
    approach_summary: Array<{
      approach: string;
      value: number;
      weight: number;
      weighted_value: number;
    }>;
    preliminary_value: number;
    discounts_and_premiums: {
      dlom: { applicable: boolean; percentage: number; rationale: string };
      dloc: { applicable: boolean; percentage: number; rationale: string };
    };
    final_valuation: {
      concluded_value: number;
      valuation_range_low: number;
      valuation_range_high: number;
      confidence_level: "Low" | "Moderate" | "High";
      confidence_rationale: string;
    };
  };
  narratives: {
    executive_summary: { word_count_target: number; content: string };
    company_overview: { word_count_target: number; content: string };
    financial_analysis: { word_count_target: number; content: string };
    industry_analysis: { word_count_target: number; content: string };
    risk_assessment: { word_count_target: number; content: string };
    asset_approach_narrative: { word_count_target: number; content: string };
    income_approach_narrative: { word_count_target: number; content: string };
    market_approach_narrative: { word_count_target: number; content: string };
    valuation_synthesis_narrative: { word_count_target: number; content: string };
    assumptions_and_limiting_conditions: { word_count_target: number; content: string };
    value_enhancement_recommendations: { word_count_target: number; content: string };
  };
  data_quality: {
    extraction_confidence: "Low" | "Moderate" | "High";
    data_completeness_score: number;
    missing_data_flags: Array<{ field: string; impact: string; assumption_made: string }>;
  };
  metadata: {
    documents_analyzed: Array<{ filename: string; document_type: string; tax_year: string }>;
    processing_notes: string;
  };
}

// =============================================================================
// ORCHESTRATION TYPES
// =============================================================================

export interface OrchestrationResult {
  success: boolean;
  error?: string;
  finalOutput: FinalValuationOutput | null;
  passOutputs: {
    pass: number;
    output: unknown;
    tokensUsed: number;
    processingTime: number;
  }[];
  totalTokensUsed: number;
  totalCost: number;
  processingTime: number;
}

// =============================================================================
// ADDITIONAL UTILITY TYPES
// =============================================================================

/**
 * Document type enumeration for extraction
 */
export type DocumentType =
  | "1120-S"
  | "1120"
  | "1065"
  | "Schedule C"
  | "Income Statement"
  | "Balance Sheet"
  | "Combined Financial Statement";

/**
 * Confidence level enumeration
 */
export type ConfidenceLevel = "Low" | "Medium" | "High";

/**
 * Risk rating enumeration
 */
export type RiskRating = "Low" | "Below Average" | "Average" | "Above Average" | "High";

/**
 * Growth outlook enumeration
 */
export type GrowthOutlook = "Growing" | "Stable" | "Declining";

/**
 * Earnings type enumeration
 */
export type EarningsType = "SDE" | "EBITDA";

/**
 * Pass number type
 */
export type PassNumber = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Pass status for tracking progress
 */
export interface PassStatus {
  passNumber: PassNumber;
  status: "pending" | "running" | "completed" | "failed";
  startTime?: number;
  endTime?: number;
  tokensUsed?: number;
  error?: string;
}

/**
 * Pipeline status for tracking overall progress
 */
export interface PipelineStatus {
  reportId: string;
  currentPass: PassNumber;
  passes: PassStatus[];
  overallStatus: "pending" | "running" | "completed" | "failed";
  progressPercentage: number;
  startTime: number;
  estimatedCompletion?: number;
}

/**
 * Knowledge injection context for a pass
 */
export interface KnowledgeContext {
  sectorMultiples?: import('./embedded-knowledge').SectorMultiple;
  industryMultiples?: import('./embedded-knowledge').IndustryMultiple;
  riskFramework?: import('./embedded-knowledge').RiskFactor[];
  taxFormGuide?: import('./embedded-knowledge').TaxFormGuide;
  financialGuide?: import('./embedded-knowledge').FinancialStatementGuide[];
  addBackCategories?: import('./embedded-knowledge').AddBackCategory[];
  customData?: Record<string, unknown>;
}

/**
 * Claude API message structure
 */
export interface ClaudeMessage {
  role: "user" | "assistant";
  content: string | ClaudeContentBlock[];
}

/**
 * Claude content block for multimodal messages
 */
export interface ClaudeContentBlock {
  type: "text" | "image" | "document";
  text?: string;
  source?: {
    type: "base64";
    media_type: string;
    data: string;
  };
}

/**
 * API response metrics
 */
export interface APIMetrics {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  latencyMs: number;
  model: string;
  timestamp: string;
}

/**
 * Pass configuration
 */
export interface PassConfig {
  passNumber: PassNumber;
  name: string;
  description: string;
  maxTokens: number;
  temperature: number;
  requiredPreviousPasses: PassNumber[];
}

/**
 * Pass configurations for all 6 passes
 */
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
    name: 'Narrative Synthesis',
    description: 'Generate comprehensive narrative sections for the final report',
    maxTokens: 16384,
    temperature: 0.4,
    requiredPreviousPasses: [1, 2, 3, 4, 5],
  },
};

// =============================================================================
// LEGACY COMPATIBILITY TYPES (for backward compatibility)
// =============================================================================

/**
 * @deprecated Use Pass1Analysis instead
 */
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

/**
 * @deprecated Use Pass1Analysis balance_sheet instead
 */
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
