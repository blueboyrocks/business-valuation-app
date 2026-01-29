/**
 * Extraction Pipeline Types
 * PRD-H: Robust PDF Extraction Pipeline
 *
 * Three-stage pipeline:
 * - Stage 1: Deterministic extraction (Modal/pdfplumber)
 * - Stage 2: AI classification & structuring (Claude Haiku)
 * - Stage 3: AI validation & enrichment (Claude Sonnet/Opus)
 */

// ============================================================
// DOCUMENT TYPES
// ============================================================

/**
 * Financial document types the system can identify
 */
export type FinancialDocumentType =
  // Tax Returns
  | 'FORM_1120'       // C-Corporation
  | 'FORM_1120S'      // S-Corporation
  | 'FORM_1065'       // Partnership
  | 'SCHEDULE_C'      // Sole Proprietorship (attached to 1040)
  | 'SCHEDULE_K1'     // Partner/Shareholder K-1
  | 'SCHEDULE_M1'     // Book-Tax Reconciliation
  // Financial Statements
  | 'INCOME_STATEMENT'      // P&L
  | 'BALANCE_SHEET'         // Statement of Financial Position
  | 'CASH_FLOW_STATEMENT'   // Statement of Cash Flows
  | 'TRIAL_BALANCE'         // Detailed account listing
  // Supporting Documents
  | 'DEPRECIATION_SCHEDULE'
  | 'ACCOUNTS_RECEIVABLE_AGING'
  | 'ACCOUNTS_PAYABLE_AGING'
  | 'INVENTORY_REPORT'
  | 'LOAN_AMORTIZATION'
  | 'FORM_1125A'      // COGS Detail
  // Other
  | 'BANK_STATEMENT'
  | 'APPRAISAL_REPORT'
  | 'LEASE_AGREEMENT'
  | 'UNKNOWN';

/**
 * Entity type for business classification
 */
export type EntityType = 'C_CORP' | 'S_CORP' | 'PARTNERSHIP' | 'SOLE_PROP' | 'LLC';

// ============================================================
// STAGE 1: DETERMINISTIC EXTRACTION (Modal/pdfplumber)
// ============================================================

/**
 * Extracted table from pdfplumber
 */
export interface ExtractedTable {
  page_number: number;
  table_index: number;
  headers: string[] | null;
  rows: string[][];
  row_count: number;
  column_count: number;
}

/**
 * Text extracted by page region
 */
export interface PageTextRegions {
  header: string;
  body_left: string;
  body_right: string;
  footer: string;
  full_text: string;
}

/**
 * Stage 1 extraction metadata
 */
export interface Stage1Metadata {
  page_count: number;
  extraction_method: 'pdfplumber' | 'ocr' | 'hybrid';
  processing_time_ms: number;
  is_scanned: boolean;
  ocr_confidence?: number;
}

/**
 * Stage 1 Output: Raw extraction from pdfplumber/OCR
 * Produced by Modal serverless function
 */
export interface Stage1Output {
  document_id: string;
  filename: string;
  extraction_timestamp: string;
  metadata: Stage1Metadata;
  tables: ExtractedTable[];
  text_by_region: Record<string, PageTextRegions>;
  raw_text: string;
  error?: Stage1Error;
}

/**
 * Stage 1 error types
 */
export interface Stage1Error {
  code: 'ENCRYPTED_PDF' | 'CORRUPTED_PDF' | 'NO_TEXT_FOUND' | 'OCR_FAILED' | 'TIMEOUT' | 'UNKNOWN_ERROR';
  message: string;
}

// ============================================================
// STAGE 2: AI CLASSIFICATION & STRUCTURING (Claude Haiku)
// ============================================================

/**
 * Document classification result
 */
export interface DocumentClassification {
  document_type: FinancialDocumentType;
  confidence: 'high' | 'medium' | 'low';
  indicators: string[];
  tax_year: string | null;
  entity_name: string | null;
}

/**
 * Income statement data
 */
export interface IncomeStatementData {
  gross_receipts: number;
  returns_allowances: number;
  cost_of_goods_sold: number;
  gross_profit: number;
  total_income: number;
  other_income: number;
  net_gain_form_4797: number;  // Usually non-recurring - add back
}

/**
 * COGS detail from Form 1125-A
 */
export interface COGSDetail {
  beginning_inventory: number;
  purchases: number;
  labor_costs: number;
  other_costs: number;
  ending_inventory: number;
  total_cogs: number;
}

/**
 * Expense breakdown
 */
export interface ExpenseData {
  officer_compensation: number;
  salaries_wages: number;
  rent: number;
  depreciation: number;
  amortization: number;
  interest: number;
  taxes_licenses: number;
  bad_debts: number;
  advertising: number;
  repairs_maintenance: number;
  pension_profit_sharing: number;
  employee_benefits: number;
  other_deductions: number;
  total_deductions: number;
}

/**
 * Balance sheet data with BOY/EOY support
 */
export interface BalanceSheetData {
  // Beginning of Year (BOY)
  boy_cash: number;
  boy_accounts_receivable: number;
  boy_allowance_bad_debts: number;
  boy_inventory: number;
  boy_other_current_assets: number;
  boy_loans_to_shareholders: number;     // RED FLAG indicator
  boy_buildings_depreciable: number;
  boy_accumulated_depreciation: number;
  boy_land: number;
  boy_intangible_assets: number;
  boy_other_assets: number;
  boy_total_assets: number;
  boy_accounts_payable: number;
  boy_short_term_debt: number;
  boy_other_current_liabilities: number;
  boy_loans_from_shareholders: number;
  boy_long_term_debt: number;
  boy_other_liabilities: number;
  boy_total_liabilities: number;
  boy_capital_stock: number;
  boy_additional_paid_in_capital: number;
  boy_retained_earnings: number;
  boy_adjustments_equity: number;
  boy_treasury_stock: number;
  boy_total_equity: number;

  // End of Year (EOY)
  eoy_cash: number;
  eoy_accounts_receivable: number;
  eoy_allowance_bad_debts: number;
  eoy_inventory: number;
  eoy_other_current_assets: number;
  eoy_loans_to_shareholders: number;     // RED FLAG indicator
  eoy_buildings_depreciable: number;
  eoy_accumulated_depreciation: number;
  eoy_land: number;
  eoy_intangible_assets: number;
  eoy_other_assets: number;
  eoy_total_assets: number;
  eoy_accounts_payable: number;
  eoy_short_term_debt: number;
  eoy_other_current_liabilities: number;
  eoy_loans_from_shareholders: number;
  eoy_long_term_debt: number;
  eoy_other_liabilities: number;
  eoy_total_liabilities: number;
  eoy_capital_stock: number;
  eoy_additional_paid_in_capital: number;
  eoy_retained_earnings: number;
  eoy_adjustments_equity: number;
  eoy_treasury_stock: number;
  eoy_total_equity: number;
}

/**
 * Schedule K data (S-Corp/Partnership)
 * Critical for SDE add-backs
 */
export interface ScheduleKData {
  ordinary_business_income: number;        // K-1
  net_rental_real_estate_income: number;   // K-2 - May be non-operating
  other_rental_income: number;             // K-3 - May be non-operating
  interest_income: number;                 // K-4 - Usually non-operating
  ordinary_dividends: number;              // K-5a - Usually non-operating
  royalties: number;                       // K-6
  net_short_term_capital_gain: number;     // K-7 - Non-recurring ADD BACK
  net_long_term_capital_gain: number;      // K-8a - Non-recurring ADD BACK
  net_section_1231_gain: number;           // K-10 - Non-recurring ADD BACK
  other_income: number;                    // K-11
  section_179_deduction: number;           // K-12a - **MUST ADD BACK** (accelerated depreciation)
  charitable_contributions: number;        // K-12a
  investment_interest: number;             // K-12b
  other_deductions: number;                // K-12d
  cash_distributions: number;              // K-16a - Actual cash to owners
  property_distributions: number;          // K-16b/d
}

/**
 * Schedule M-1 reconciliation data (Book vs Tax)
 */
export interface ScheduleM1Data {
  net_income_per_books: number;            // M-1 Line 1
  income_on_k_not_books: number;           // M-1 Line 2
  expenses_on_books_not_k: number;         // M-1 Line 3
  income_on_books_not_k: number;           // M-1 Line 5
  deductions_on_k_not_books: number;       // M-1 Line 6
  income_per_schedule_k: number;           // M-1 Line 8 - Should match K-18
}

/**
 * Guaranteed payments (Partnership-specific)
 */
export interface GuaranteedPayments {
  services: number;                        // K-1 Line 4a - **PRIMARY OWNER COMP FOR PARTNERSHIPS**
  capital: number;                         // K-1 Line 4b
  total: number;                           // K-1 Line 4c - Total guaranteed payments
}

/**
 * Owner information (consolidated from various sources)
 */
export interface OwnerInfo {
  officer_compensation: number;            // Primary for S-Corp/C-Corp
  guaranteed_payments_total: number;       // Primary for Partnerships
  distributions_cash: number;
  distributions_property: number;
  loans_to_shareholders: number;           // RED FLAG - potential add-back
  loans_from_shareholders: number;         // May indicate undercapitalization
  section_179_deduction: number;           // From Schedule K
}

/**
 * Red flag indicators
 */
export interface RedFlagIndicators {
  // Balance Sheet Red Flags
  has_loans_to_shareholders: boolean;      // Schedule L Line 7 > 0
  loans_to_shareholders_amount: number;
  negative_retained_earnings: boolean;     // Schedule L Line 23 < 0

  // Income Red Flags
  other_income_percent: number;            // Line 5 / Line 1c - High % is suspicious
  other_deductions_percent: number;        // Line 19 / Total deductions

  // Cash Flow Red Flags
  distributions_exceed_net_income: boolean;  // K-16a > Line 21
  distributions_vs_net_income_ratio: number;

  // Trend Red Flags (if multi-year)
  revenue_yoy_change_percent: number | null;
  revenue_decline_flag: boolean;
}

/**
 * Depreciation schedule detail
 */
export interface DepreciationItem {
  asset_description: string;
  date_acquired: string | null;
  cost_basis: number;
  method: 'MACRS' | 'Straight-Line' | 'Section 179' | 'Bonus' | 'Other';
  current_year_depreciation: number;
  accumulated_depreciation: number;
  remaining_life_years: number | null;
}

/**
 * COVID-era adjustments (2020-2024 returns)
 */
export interface CovidAdjustments {
  ppp_loan_forgiveness: number;            // Non-recurring - SUBTRACT from earnings
  eidl_advances: number;                   // Evaluate - may need adjustment
  employee_retention_credit: number;       // Non-recurring
  tax_year: string;
}

/**
 * Unmapped data item
 */
export interface UnmappedDataItem {
  source_location: string;
  original_text: string;
  value: string | number;
}

/**
 * Structured financial data for a single document
 */
export interface StructuredFinancialData {
  income_statement: IncomeStatementData;
  cogs_detail: COGSDetail | null;
  expenses: ExpenseData;
  balance_sheet: BalanceSheetData;
  schedule_k: ScheduleKData | null;
  schedule_m1: ScheduleM1Data | null;
  guaranteed_payments: GuaranteedPayments | null;
  owner_info: OwnerInfo;
  depreciation_detail: DepreciationItem[] | null;
  covid_adjustments: CovidAdjustments | null;
  red_flags: RedFlagIndicators;
}

/**
 * Stage 2 processing metadata
 */
export interface Stage2Metadata {
  tables_processed: number;
  fields_mapped: number;
  fields_missing: number;
  confidence_score: number;  // 0-100
}

/**
 * Stage 2 Output: Classified and structured data
 * Produced by Claude Haiku
 */
export interface Stage2Output {
  document_id: string;
  classification: DocumentClassification;
  structured_data: StructuredFinancialData;
  unmapped_data: UnmappedDataItem[];
  warnings: string[];
  processing_metadata: Stage2Metadata;
}

// ============================================================
// STAGE 3: AI VALIDATION & ENRICHMENT (Claude Sonnet/Opus)
// ============================================================

/**
 * Validation result from a single rule
 */
export interface ValidationResult {
  id: string;                              // Rule ID (e.g., 'BS001', 'SDE002')
  name: string;
  severity: 'error' | 'warning' | 'info';
  passed: boolean;
  message: string;
  field?: string;
  year?: string;
}

/**
 * Validation rule definition
 */
export interface ValidationRule {
  id: string;
  name: string;
  severity: 'error' | 'warning' | 'info';
  check: (data: Stage2Output) => ValidationResult;
}

/**
 * AI-suggested correction
 */
export interface SuggestedCorrection {
  field: string;
  original_value: number;
  corrected_value: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

/**
 * Cross-document validation result
 */
export interface CrossDocValidationResult {
  comparison_type: 'tax_vs_financial' | 'k1_vs_return' | 'year_over_year';
  documents_compared: string[];
  passed: boolean;
  discrepancies: Array<{
    field: string;
    values: Record<string, number>;
    difference: number;
    severity: 'error' | 'warning';
  }>;
}

/**
 * Suggested SDE add-backs based on extraction
 */
export interface SuggestedSDEAddbacks {
  officer_compensation: number;
  guaranteed_payments: number;
  depreciation: number;
  amortization: number;
  interest: number;
  section_179_deduction: number;
  non_recurring_gains_excluded: number;
  owner_benefits: number;
  total_suggested_addbacks: number;
  notes: string[];
}

// ============================================================
// FINAL EXTRACTION OUTPUT
// ============================================================

/**
 * Document metadata for final output
 */
export interface ExtractedDocumentMeta {
  document_id: string;
  filename: string;
  document_type: FinancialDocumentType;
  tax_year: string;
  pages: number;
}

/**
 * Company information extracted from documents
 */
export interface CompanyInfo {
  name: string;
  entity_type: EntityType;
  ein: string | null;
  address: {
    street: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
  };
  fiscal_year_end: string;  // "12/31" or "06/30" etc.
}

/**
 * Financial data for a single year
 */
export interface YearlyFinancialData {
  // Income Statement
  revenue: number;
  returns_allowances: number;
  net_revenue: number;
  cost_of_goods_sold: number;
  gross_profit: number;
  other_income: number;
  net_gain_form_4797: number;  // Non-recurring
  total_income: number;
  total_operating_expenses: number;
  operating_income: number;
  net_income: number;

  // COGS Detail (Form 1125-A)
  cogs_detail: COGSDetail | null;

  // Expense breakdown
  expenses: ExpenseData;

  // Balance Sheet
  balance_sheet: BalanceSheetData;

  // Schedule K
  schedule_k: ScheduleKData | null;

  // Schedule M-1
  schedule_m1: ScheduleM1Data | null;

  // Guaranteed Payments
  guaranteed_payments: GuaranteedPayments | null;

  // COVID Adjustments
  covid_adjustments: CovidAdjustments | null;

  // Red Flags
  red_flags: RedFlagIndicators;

  // Data quality for this year
  source_document: string;
  extraction_confidence: number;
}

/**
 * Multi-year trend analysis
 */
export interface TrendAnalysis {
  years_analyzed: string[];
  revenue_cagr: number | null;
  revenue_trend: 'growing' | 'stable' | 'declining' | 'volatile';
  sde_trend: 'growing' | 'stable' | 'declining' | 'volatile';
  gross_margin_trend: 'improving' | 'stable' | 'declining';
  notes: string[];
}

/**
 * Validation summary
 */
export interface ValidationSummary {
  status: 'passed' | 'warnings' | 'errors';
  error_count: number;
  warning_count: number;
  info_count: number;
  issues: ValidationResult[];
  corrections_applied: SuggestedCorrection[];
  red_flags_detected: string[];
}

/**
 * Processing metadata for final output
 */
export interface ProcessingMetadata {
  total_time_ms: number;
  stage1_time_ms: number;
  stage2_time_ms: number;
  stage3_time_ms: number;
  model_used: 'haiku' | 'sonnet' | 'opus';
  escalated_to_opus: boolean;
  escalation_reason: string | null;
  retry_count: number;
}

/**
 * Final Extraction Output
 * Complete result of the three-stage pipeline
 */
export interface FinalExtractionOutput {
  extraction_id: string;
  created_at: string;

  // Document metadata
  documents: ExtractedDocumentMeta[];

  // Company information
  company_info: CompanyInfo;

  // Financial data by year
  financial_data: Record<string, YearlyFinancialData>;

  // Multi-year trend analysis (if 2+ years provided)
  trend_analysis: TrendAnalysis | null;

  // Validation summary
  validation: ValidationSummary;

  // Processing metadata
  processing: ProcessingMetadata;

  // Ready for valuation pipeline
  ready_for_valuation: boolean;
  blocking_issues: string[];

  // Suggested SDE add-backs based on extraction
  suggested_sde_addbacks: SuggestedSDEAddbacks;
}

// ============================================================
// API & PIPELINE TYPES
// ============================================================

/**
 * Modal extraction service response
 */
export interface ModalExtractionResponse {
  success: boolean;
  data?: Stage1Output;
  error?: string;
  is_scanned?: boolean;
}

/**
 * Pipeline progress event
 */
export type PipelineProgressEvent =
  | { stage: 'stage1'; status: 'starting' | 'complete'; document_id: string }
  | { stage: 'stage2'; status: 'starting' | 'complete'; document_id: string }
  | { stage: 'stage3'; status: 'starting' | 'complete'; document_id: string }
  | { stage: 'complete'; extraction_id: string }
  | { stage: 'error'; error: string; document_id?: string };

/**
 * Pipeline progress callback
 */
export type PipelineProgressCallback = (event: PipelineProgressEvent) => void;

/**
 * Extraction API request
 */
export interface ExtractionAPIRequest {
  report_id: string;
  document_ids?: string[];  // Optional: extract specific documents only
}

/**
 * Extraction API response
 */
export interface ExtractionAPIResponse {
  success: boolean;
  extraction_id?: string;
  documents_processed?: number;
  confidence_scores?: Record<string, number>;
  error?: string;
}

// ============================================================
// DATABASE TYPES
// ============================================================

/**
 * document_extractions table row type
 */
export interface DocumentExtractionRow {
  id: string;
  report_id: string;
  document_id: string;
  document_type: FinancialDocumentType | null;
  tax_year: string | null;
  entity_name: string | null;
  stage1_output: Stage1Output | null;
  stage2_output: Stage2Output | null;
  stage3_output: FinalExtractionOutput | null;
  confidence_score: number | null;
  validation_status: 'passed' | 'warnings' | 'errors' | null;
  processing_time_ms: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Insert type for document_extractions
 */
export interface DocumentExtractionInsert {
  report_id: string;
  document_id: string;
  document_type?: FinancialDocumentType | null;
  tax_year?: string | null;
  entity_name?: string | null;
  stage1_output?: Stage1Output | null;
  stage2_output?: Stage2Output | null;
  stage3_output?: FinalExtractionOutput | null;
  confidence_score?: number | null;
  validation_status?: 'passed' | 'warnings' | 'errors' | null;
  processing_time_ms?: number | null;
}
