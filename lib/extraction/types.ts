/**
 * Extraction Types
 *
 * Types for the Modal/pdfplumber extraction pipeline and the unified
 * FinalExtractionOutput that downstream consumers use.
 */

// ============================================================================
// Modal Raw Output Types
// ============================================================================

/**
 * Raw table extracted from PDF by Modal/pdfplumber.
 */
export interface ModalExtractedTable {
  page_number: number;
  table_index: number;
  headers: string[] | null;
  rows: string[][];
  row_count: number;
  column_count: number;
}

/**
 * Text organized by page regions.
 */
export interface ModalTextByRegion {
  header: string;
  body_left: string;
  body_right: string;
  footer: string;
  full_text: string;
}

/**
 * Extraction metadata from Modal.
 */
export interface ModalExtractionMetadata {
  page_count: number;
  extraction_method: 'pdfplumber' | 'ocr';
  processing_time_ms: number;
  is_scanned: boolean;
  ocr_confidence: number | null;
}

/**
 * Raw output from Modal extraction endpoint.
 */
export interface ModalExtractionResponse {
  success: boolean;
  data?: {
    document_id: string;
    filename: string;
    extraction_timestamp: string;
    tables: ModalExtractedTable[];
    text_by_region: Record<string, ModalTextByRegion>;
    raw_text: string;
    metadata: ModalExtractionMetadata;
  };
  error?: {
    code: string;
    message: string;
  };
}

// ============================================================================
// Normalized Extraction Output Types
// ============================================================================

/**
 * Entity type from tax document.
 */
export type EntityType =
  | 'C-Corporation'
  | 'S-Corporation'
  | 'Partnership'
  | 'Sole Proprietorship'
  | 'LLC'
  | 'Other';

/**
 * Document type identifier.
 */
export type DocumentType =
  | 'Form 1120'
  | 'Form 1120-S'
  | 'Form 1065'
  | 'Schedule C'
  | 'Financial Statement'
  | 'Other';

/**
 * Company/entity information extracted from document.
 */
export interface CompanyInfo {
  business_name: string;
  ein: string | null;
  address: string | null;
  entity_type: EntityType;
  fiscal_year_end: string | null;
  naics_code: string | null;
  business_activity: string | null;
  number_of_employees: number | null;
  accounting_method: 'Cash' | 'Accrual' | 'Other' | null;
}

/**
 * Income statement line items for a single year.
 */
export interface IncomeStatement {
  gross_receipts_sales: number;
  returns_allowances: number;
  cost_of_goods_sold: number;
  gross_profit: number;
  total_income: number;
  total_deductions: number;
  taxable_income: number;
  net_income: number;
}

/**
 * Expense line items for a single year.
 */
export interface Expenses {
  compensation_of_officers: number;
  salaries_wages: number;
  repairs_maintenance: number;
  bad_debts: number;
  rents: number;
  taxes_licenses: number;
  interest: number;
  depreciation: number;
  depletion: number;
  advertising: number;
  pension_profit_sharing: number;
  employee_benefits: number;
  other_deductions: number;
}

/**
 * Balance sheet line items for a single year.
 */
export interface BalanceSheet {
  total_assets: number;
  cash: number;
  accounts_receivable: number;
  inventory: number;
  fixed_assets: number;
  accumulated_depreciation: number;
  other_assets: number;
  total_liabilities: number;
  accounts_payable: number;
  loans_payable: number;
  other_liabilities: number;
  retained_earnings: number;
  total_equity: number;
}

/**
 * Schedule K data (S-Corp/Partnership specific).
 */
export interface ScheduleK {
  section_179_deduction: number;
  charitable_contributions: number;
  investment_interest: number;
  net_section_1231_gain: number;
  other_net_gain_loss: number;
  total_foreign_taxes: number;
  total_distributions: number;
}

/**
 * Owner/shareholder information.
 */
export interface OwnerInfo {
  owner_compensation: number;
  guaranteed_payments: number;
  distributions: number;
  loans_to_shareholders: number;
  loans_from_shareholders: number;
}

/**
 * COVID-related adjustments.
 */
export interface CovidAdjustments {
  ppp_loan: number;
  ppp_forgiveness: number;
  eidl_grant: number;
  erc_credit: number;
}

/**
 * Red flags detected during extraction.
 */
export interface RedFlags {
  loans_to_shareholders: boolean;
  declining_revenue: boolean;
  negative_equity: boolean;
  high_owner_compensation: boolean;
  related_party_transactions: boolean;
  unusual_expenses: boolean;
  missing_schedules: boolean;
  notes: string[];
}

/**
 * Financial data for a single tax year.
 */
export interface YearFinancialData {
  tax_year: number;
  document_type: DocumentType;
  income_statement: IncomeStatement;
  expenses: Expenses;
  balance_sheet: BalanceSheet;
  schedule_k: ScheduleK;
  owner_info: OwnerInfo;
  covid_adjustments: CovidAdjustments;
}

/**
 * Final normalized extraction output.
 *
 * This is the unified type that all downstream consumers use.
 * It normalizes data from Modal extraction into a consistent structure.
 */
export interface FinalExtractionOutput {
  /** Extraction metadata */
  extraction_id: string;
  extraction_timestamp: string;
  source: 'modal' | 'claude_vision';

  /** Company information */
  company_info: CompanyInfo;

  /** Financial data by year (keyed by tax year) */
  financial_data: Record<number, YearFinancialData>;

  /** Available years sorted descending (most recent first) */
  available_years: number[];

  /** Red flags detected across all documents */
  red_flags: RedFlags;

  /** Raw extraction data for debugging */
  raw_data?: {
    modal_response?: ModalExtractionResponse;
    document_count: number;
    extraction_notes: string[];
  };
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if extraction output has data for a specific year.
 */
export function hasYearData(
  extraction: FinalExtractionOutput,
  year: number
): boolean {
  return year in extraction.financial_data;
}

/**
 * Check if entity type is S-Corporation.
 */
export function isSCorp(extraction: FinalExtractionOutput): boolean {
  return extraction.company_info.entity_type === 'S-Corporation';
}

/**
 * Check if entity type is Partnership.
 */
export function isPartnership(extraction: FinalExtractionOutput): boolean {
  return extraction.company_info.entity_type === 'Partnership';
}

/**
 * Check if entity type is Sole Proprietorship.
 */
export function isSoleProp(extraction: FinalExtractionOutput): boolean {
  return extraction.company_info.entity_type === 'Sole Proprietorship';
}

/**
 * Check if entity type is C-Corporation.
 */
export function isCCorp(extraction: FinalExtractionOutput): boolean {
  return extraction.company_info.entity_type === 'C-Corporation';
}
