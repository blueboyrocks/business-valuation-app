/**
 * Schema Mapper
 * PRD-H: Robust PDF Extraction Pipeline - Stage 2
 *
 * Maps extracted table data to standard financial schema based on document type.
 * Uses document-specific mapping configurations and Claude Haiku for ambiguous fields.
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  FinancialDocumentType,
  Stage1Output,
  Stage2Output,
  DocumentClassification,
  StructuredFinancialData,
  IncomeStatementData,
  ExpenseData,
  BalanceSheetData,
  ScheduleKData,
  ScheduleM1Data,
  GuaranteedPayments,
  OwnerInfo,
  RedFlagIndicators,
  COGSDetail,
  CovidAdjustments,
  UnmappedDataItem,
  Stage2Metadata,
  ExtractedTable,
} from './types';
import { FORM_1120S_MAPPING, FieldMapping, DocumentMapping } from './mappings/form-1120s';
import { FORM_1120_MAPPING } from './mappings/form-1120';
import { FORM_1065_MAPPING } from './mappings/form-1065';
import { SCHEDULE_C_MAPPING } from './mappings/schedule-c';
import { INCOME_STATEMENT_MAPPING } from './mappings/income-statement';
import { BALANCE_SHEET_MAPPING } from './mappings/balance-sheet';
import { SCHEDULE_K_MAPPING } from './mappings/schedule-k';
import { SCHEDULE_M1_MAPPING } from './mappings/schedule-m1';
import { FORM_1125A_MAPPING } from './mappings/form-1125a';

// Haiku model for field mapping assistance
const HAIKU_MODEL = 'claude-3-5-haiku-20241022';

/**
 * Registry of document mappings
 */
const MAPPING_REGISTRY: Map<FinancialDocumentType, DocumentMapping> = new Map([
  ['FORM_1120S', FORM_1120S_MAPPING],
  ['FORM_1120', FORM_1120_MAPPING],
  ['FORM_1065', FORM_1065_MAPPING],
  ['SCHEDULE_C', SCHEDULE_C_MAPPING],
  ['INCOME_STATEMENT', INCOME_STATEMENT_MAPPING],
  ['BALANCE_SHEET', BALANCE_SHEET_MAPPING],
  ['SCHEDULE_K1', SCHEDULE_K_MAPPING],
  ['SCHEDULE_M1', SCHEDULE_M1_MAPPING],
  ['FORM_1125A', FORM_1125A_MAPPING],
  // Additional mappings will be registered by other stories
]);

/**
 * Parse a numeric value from a string
 * Handles: $1,234.56, (1,234), -1234, 1234.56
 */
function parseNumericValue(value: string | null | undefined): number {
  if (!value || typeof value !== 'string') return 0;

  // Clean the string
  let cleaned = value.trim();

  // Handle parentheses as negative
  const isNegative = cleaned.startsWith('(') && cleaned.endsWith(')');
  if (isNegative) {
    cleaned = cleaned.slice(1, -1);
  }

  // Remove currency symbols, commas, spaces
  cleaned = cleaned.replace(/[$,\s]/g, '');

  // Handle explicit negative sign
  const hasNegativeSign = cleaned.startsWith('-');
  if (hasNegativeSign) {
    cleaned = cleaned.slice(1);
  }

  // Parse the number
  const num = parseFloat(cleaned);

  if (isNaN(num)) return 0;

  return (isNegative || hasNegativeSign) ? -num : num;
}

/**
 * Find a field value in extracted tables
 */
function findFieldInTables(
  tables: ExtractedTable[],
  fieldMapping: FieldMapping
): { value: number; source: string } | null {
  for (const table of tables) {
    // Search in rows
    for (const row of table.rows) {
      for (let colIdx = 0; colIdx < row.length; colIdx++) {
        const cell = row[colIdx]?.toLowerCase() || '';

        // Check if this cell matches any source label
        for (const label of fieldMapping.sourceLabels) {
          if (cell.includes(label.toLowerCase())) {
            // Found a match - look for numeric value in adjacent columns
            for (let valueIdx = colIdx + 1; valueIdx < row.length; valueIdx++) {
              const valueCell = row[valueIdx];
              if (valueCell && /[\d$,.()\-]/.test(valueCell)) {
                const numValue = parseNumericValue(valueCell);
                if (numValue !== 0 || valueCell.includes('0')) {
                  return {
                    value: numValue,
                    source: `Page ${table.page_number}, Table ${table.table_index}, Row: "${row.slice(0, 3).join(' | ')}"`,
                  };
                }
              }
            }
          }
        }
      }
    }

    // Also check headers if present
    if (table.headers) {
      for (let headerIdx = 0; headerIdx < table.headers.length; headerIdx++) {
        const header = table.headers[headerIdx]?.toLowerCase() || '';

        for (const label of fieldMapping.sourceLabels) {
          if (header.includes(label.toLowerCase())) {
            // Found a matching header - get values from that column
            for (const row of table.rows) {
              const value = row[headerIdx];
              if (value && /[\d$,.()\-]/.test(value)) {
                return {
                  value: parseNumericValue(value),
                  source: `Page ${table.page_number}, Table ${table.table_index}, Column: "${header}"`,
                };
              }
            }
          }
        }
      }
    }
  }

  return null;
}

/**
 * Find field value in raw text using regex patterns
 */
function findFieldInText(
  rawText: string,
  fieldMapping: FieldMapping
): { value: number; source: string } | null {
  for (const label of fieldMapping.sourceLabels) {
    // Create pattern to find label followed by a number
    const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = [
      new RegExp(`${escapedLabel}[:\\s]+\\$?([\\d,]+(?:\\.\\d{2})?)`, 'i'),
      new RegExp(`${escapedLabel}[\\s]+([\\d,]+)`, 'i'),
      new RegExp(`${escapedLabel}[:\\s]+\\(([\\d,]+(?:\\.\\d{2})?)\\)`, 'i'),
    ];

    for (const pattern of patterns) {
      const match = rawText.match(pattern);
      if (match && match[1]) {
        const value = parseNumericValue(match[1]);
        if (value !== 0) {
          return {
            value,
            source: `Text match: "${match[0].slice(0, 50)}"`,
          };
        }
      }
    }
  }

  return null;
}

/**
 * Use Haiku to find ambiguous field mappings
 */
async function findFieldWithHaiku(
  stage1Output: Stage1Output,
  fieldMapping: FieldMapping,
  documentType: FinancialDocumentType
): Promise<{ value: number; source: string; confidence: string } | null> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Prepare context
  const tablesContext = stage1Output.tables
    .slice(0, 5)
    .map((t) => `Table (page ${t.page_number}):\n${JSON.stringify(t.rows.slice(0, 10), null, 2)}`)
    .join('\n\n');

  const prompt = `You are extracting financial data from a ${documentType} document.

Find the value for: ${fieldMapping.field}
Possible labels in the document: ${fieldMapping.sourceLabels.join(', ')}

TABLES FROM DOCUMENT:
${tablesContext}

RAW TEXT EXCERPT:
${stage1Output.raw_text.slice(0, 2000)}

Find the numeric value for "${fieldMapping.field}". Consider:
- The value may be in dollars (with $ symbol)
- Negative values may be shown in parentheses
- Values may have commas as thousands separators

Respond with ONLY valid JSON:
{
  "value": 123456.78,
  "source": "Found in table on page 1, row 'Line 7 Compensation of officers'",
  "confidence": "high"
}

If the field is not found, respond:
{
  "value": null,
  "source": "Not found",
  "confidence": "none"
}`;

  try {
    const response = await client.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (parsed.value === null) return null;

    return {
      value: typeof parsed.value === 'number' ? parsed.value : parseNumericValue(String(parsed.value)),
      source: `AI: ${parsed.source}`,
      confidence: parsed.confidence || 'medium',
    };
  } catch {
    return null;
  }
}

/**
 * Extract all fields for a document type
 */
async function extractFields(
  stage1Output: Stage1Output,
  documentType: FinancialDocumentType,
  useHaikuForMissing: boolean = true
): Promise<{ fields: Map<string, number>; unmapped: UnmappedDataItem[]; fieldsMapped: number; fieldsMissing: number }> {
  const mapping = MAPPING_REGISTRY.get(documentType);
  if (!mapping) {
    return { fields: new Map(), unmapped: [], fieldsMapped: 0, fieldsMissing: 0 };
  }

  const fields = new Map<string, number>();
  const unmapped: UnmappedDataItem[] = [];
  let fieldsMapped = 0;
  let fieldsMissing = 0;

  for (const section of mapping.sections) {
    for (const fieldMapping of section.fields) {
      // Try tables first
      let result = findFieldInTables(stage1Output.tables, fieldMapping);

      // Try raw text if not found in tables
      if (!result) {
        result = findFieldInText(stage1Output.raw_text, fieldMapping);
      }

      // Try Haiku for required fields not found
      if (!result && fieldMapping.required && useHaikuForMissing) {
        const haikuResult = await findFieldWithHaiku(stage1Output, fieldMapping, documentType);
        if (haikuResult) {
          result = { value: haikuResult.value, source: haikuResult.source };
        }
      }

      if (result) {
        fields.set(fieldMapping.field, result.value);
        fieldsMapped++;
      } else if (fieldMapping.defaultValue !== undefined) {
        fields.set(fieldMapping.field, fieldMapping.defaultValue);
      } else if (fieldMapping.required) {
        fieldsMissing++;
        unmapped.push({
          source_location: `${section.name}/${fieldMapping.field}`,
          original_text: fieldMapping.sourceLabels[0],
          value: 'NOT_FOUND',
        });
      }
    }
  }

  return { fields, unmapped, fieldsMapped, fieldsMissing };
}

/**
 * Build IncomeStatementData from extracted fields
 */
function buildIncomeStatement(fields: Map<string, number>): IncomeStatementData {
  return {
    gross_receipts: fields.get('gross_receipts') || 0,
    returns_allowances: fields.get('returns_allowances') || 0,
    cost_of_goods_sold: fields.get('cost_of_goods_sold') || 0,
    gross_profit: fields.get('gross_profit') || 0,
    total_income: fields.get('total_income') || 0,
    other_income: fields.get('other_income') || 0,
    net_gain_form_4797: fields.get('net_gain_form_4797') || 0,
  };
}

/**
 * Build ExpenseData from extracted fields
 */
function buildExpenses(fields: Map<string, number>): ExpenseData {
  return {
    officer_compensation: fields.get('officer_compensation') || 0,
    salaries_wages: fields.get('salaries_wages') || 0,
    rent: fields.get('rent') || 0,
    depreciation: fields.get('depreciation') || 0,
    amortization: fields.get('amortization') || 0,
    interest: fields.get('interest') || 0,
    taxes_licenses: fields.get('taxes_licenses') || 0,
    bad_debts: fields.get('bad_debts') || 0,
    advertising: fields.get('advertising') || 0,
    repairs_maintenance: fields.get('repairs_maintenance') || 0,
    pension_profit_sharing: fields.get('pension_profit_sharing') || 0,
    employee_benefits: fields.get('employee_benefits') || 0,
    other_deductions: fields.get('other_deductions') || 0,
    total_deductions: fields.get('total_deductions') || 0,
  };
}

/**
 * Build BalanceSheetData from extracted fields
 * Handles BOY (beginning of year) and EOY (end of year)
 */
function buildBalanceSheet(fields: Map<string, number>): BalanceSheetData {
  // For now, use same values for BOY and EOY (single year extraction)
  // Multi-year support will be added later
  const getValue = (field: string) => fields.get(field) || 0;

  return {
    // BOY
    boy_cash: getValue('cash'),
    boy_accounts_receivable: getValue('accounts_receivable'),
    boy_allowance_bad_debts: getValue('allowance_bad_debts'),
    boy_inventory: getValue('inventory'),
    boy_other_current_assets: getValue('other_current_assets'),
    boy_loans_to_shareholders: getValue('loans_to_shareholders'),
    boy_buildings_depreciable: getValue('buildings_depreciable'),
    boy_accumulated_depreciation: getValue('accumulated_depreciation'),
    boy_land: getValue('land'),
    boy_intangible_assets: getValue('intangible_assets'),
    boy_other_assets: getValue('other_assets'),
    boy_total_assets: getValue('total_assets'),
    boy_accounts_payable: getValue('accounts_payable'),
    boy_short_term_debt: getValue('short_term_debt'),
    boy_other_current_liabilities: getValue('other_current_liabilities'),
    boy_loans_from_shareholders: getValue('loans_from_shareholders'),
    boy_long_term_debt: getValue('long_term_debt'),
    boy_other_liabilities: getValue('other_liabilities'),
    boy_total_liabilities: getValue('total_liabilities'),
    boy_capital_stock: getValue('capital_stock'),
    boy_additional_paid_in_capital: getValue('additional_paid_in_capital'),
    boy_retained_earnings: getValue('retained_earnings'),
    boy_adjustments_equity: getValue('adjustments_equity'),
    boy_treasury_stock: getValue('treasury_stock'),
    boy_total_equity: getValue('total_equity'),

    // EOY (same values for single year)
    eoy_cash: getValue('cash'),
    eoy_accounts_receivable: getValue('accounts_receivable'),
    eoy_allowance_bad_debts: getValue('allowance_bad_debts'),
    eoy_inventory: getValue('inventory'),
    eoy_other_current_assets: getValue('other_current_assets'),
    eoy_loans_to_shareholders: getValue('loans_to_shareholders'),
    eoy_buildings_depreciable: getValue('buildings_depreciable'),
    eoy_accumulated_depreciation: getValue('accumulated_depreciation'),
    eoy_land: getValue('land'),
    eoy_intangible_assets: getValue('intangible_assets'),
    eoy_other_assets: getValue('other_assets'),
    eoy_total_assets: getValue('total_assets'),
    eoy_accounts_payable: getValue('accounts_payable'),
    eoy_short_term_debt: getValue('short_term_debt'),
    eoy_other_current_liabilities: getValue('other_current_liabilities'),
    eoy_loans_from_shareholders: getValue('loans_from_shareholders'),
    eoy_long_term_debt: getValue('long_term_debt'),
    eoy_other_liabilities: getValue('other_liabilities'),
    eoy_total_liabilities: getValue('total_liabilities'),
    eoy_capital_stock: getValue('capital_stock'),
    eoy_additional_paid_in_capital: getValue('additional_paid_in_capital'),
    eoy_retained_earnings: getValue('retained_earnings'),
    eoy_adjustments_equity: getValue('adjustments_equity'),
    eoy_treasury_stock: getValue('treasury_stock'),
    eoy_total_equity: getValue('total_equity'),
  };
}

/**
 * Build OwnerInfo from extracted fields
 */
function buildOwnerInfo(fields: Map<string, number>): OwnerInfo {
  return {
    officer_compensation: fields.get('officer_compensation') || 0,
    guaranteed_payments_total: 0, // Populated by Form 1065 mapping
    distributions_cash: fields.get('cash_distributions') || 0,
    distributions_property: fields.get('property_distributions') || 0,
    loans_to_shareholders: fields.get('loans_to_shareholders') || 0,
    loans_from_shareholders: fields.get('loans_from_shareholders') || 0,
    section_179_deduction: fields.get('section_179_deduction') || 0,
  };
}

/**
 * Build RedFlagIndicators from extracted data
 */
function buildRedFlags(fields: Map<string, number>, incomeStatement: IncomeStatementData, expenses: ExpenseData): RedFlagIndicators {
  const loansToShareholders = fields.get('loans_to_shareholders') || 0;
  const retainedEarnings = fields.get('retained_earnings') || 0;
  const otherIncome = incomeStatement.other_income;
  const revenue = incomeStatement.gross_receipts;
  const otherDeductions = expenses.other_deductions;
  const totalDeductions = expenses.total_deductions;
  const distributions = fields.get('cash_distributions') || 0;
  const netIncome = incomeStatement.total_income - totalDeductions;

  return {
    has_loans_to_shareholders: loansToShareholders > 0,
    loans_to_shareholders_amount: loansToShareholders,
    negative_retained_earnings: retainedEarnings < 0,
    other_income_percent: revenue > 0 ? (otherIncome / revenue) * 100 : 0,
    other_deductions_percent: totalDeductions > 0 ? (otherDeductions / totalDeductions) * 100 : 0,
    distributions_exceed_net_income: distributions > netIncome,
    distributions_vs_net_income_ratio: netIncome > 0 ? distributions / netIncome : 0,
    revenue_yoy_change_percent: null, // Requires multi-year data
    revenue_decline_flag: false,
  };
}

/**
 * Map Stage1Output to Stage2Output
 *
 * @param stage1Output - Raw extraction from Stage 1
 * @param classification - Document classification result
 * @returns Stage2Output with structured financial data
 */
export async function mapToSchema(
  stage1Output: Stage1Output,
  classification: DocumentClassification
): Promise<Stage2Output> {
  const startTime = Date.now();

  // Extract fields using document-specific mapping
  const { fields, unmapped, fieldsMapped, fieldsMissing } = await extractFields(
    stage1Output,
    classification.document_type,
    true // Use Haiku for missing required fields
  );

  // Build structured data components
  const incomeStatement = buildIncomeStatement(fields);
  const expenses = buildExpenses(fields);
  const balanceSheet = buildBalanceSheet(fields);
  const ownerInfo = buildOwnerInfo(fields);
  const redFlags = buildRedFlags(fields, incomeStatement, expenses);

  // Build complete structured data
  const structuredData: StructuredFinancialData = {
    income_statement: incomeStatement,
    cogs_detail: null, // Populated by Form 1125-A mapping
    expenses: expenses,
    balance_sheet: balanceSheet,
    schedule_k: null, // Populated by Schedule K mapping
    schedule_m1: null, // Populated by Schedule M-1 mapping
    guaranteed_payments: null, // Populated by Form 1065 mapping
    owner_info: ownerInfo,
    depreciation_detail: null, // Populated by depreciation schedule mapping
    covid_adjustments: null, // Populated by COVID detector
    red_flags: redFlags,
  };

  // Generate warnings
  const warnings: string[] = [];

  if (redFlags.has_loans_to_shareholders) {
    warnings.push(`RED FLAG: $${redFlags.loans_to_shareholders_amount.toLocaleString()} in loans to shareholders`);
  }
  if (redFlags.negative_retained_earnings) {
    warnings.push('RED FLAG: Negative retained earnings indicates accumulated losses');
  }
  if (redFlags.other_income_percent > 10) {
    warnings.push(`Other income is ${redFlags.other_income_percent.toFixed(1)}% of revenue - requires itemization`);
  }
  if (redFlags.other_deductions_percent > 20) {
    warnings.push(`Other deductions is ${redFlags.other_deductions_percent.toFixed(1)}% of total - requires detail review`);
  }

  // Calculate confidence score
  const totalFields = fieldsMapped + fieldsMissing;
  const confidenceScore = totalFields > 0 ? Math.round((fieldsMapped / totalFields) * 100) : 0;

  const processingTime = Date.now() - startTime;

  return {
    document_id: stage1Output.document_id,
    classification: classification,
    structured_data: structuredData,
    unmapped_data: unmapped,
    warnings: warnings,
    processing_metadata: {
      tables_processed: stage1Output.tables.length,
      fields_mapped: fieldsMapped,
      fields_missing: fieldsMissing,
      confidence_score: confidenceScore,
    },
  };
}

/**
 * Register a document mapping
 */
export function registerMapping(mapping: DocumentMapping): void {
  MAPPING_REGISTRY.set(mapping.documentType, mapping);
}

/**
 * Get registered mappings
 */
export function getRegisteredMappings(): FinancialDocumentType[] {
  return Array.from(MAPPING_REGISTRY.keys());
}
