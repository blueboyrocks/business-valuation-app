/**
 * Tax Form Validation Calculator
 *
 * Validates extracted tax form data for mathematical consistency,
 * cross-schedule accuracy, and completeness.
 *
 * @module lib/calculations/tax-form-validator
 */

import {
  TaxFormValidationResult,
  ValidationRule,
  ValidationError,
  ValidationWarning,
  TaxFormType,
} from './extended-types';
import { SingleYearFinancials } from './types';
import { safeNumber, formatCurrency } from './utils';

// ============================================
// VALIDATION RULE DEFINITIONS
// ============================================

/**
 * Form 1120-S (S-Corporation) validation rules
 */
const FORM_1120S_RULES: ValidationRule[] = [
  {
    id: '1120S-001',
    name: 'Gross Profit Calculation',
    description: 'Line 3 (Gross profit) should equal Line 1c - Line 2',
    severity: 'error',
    formula: 'gross_profit = gross_receipts - cost_of_goods_sold',
    tolerance_percent: 0.01,
    validate: (data: Record<string, number>) => {
      const expected = safeNumber(data.gross_receipts) - safeNumber(data.cost_of_goods_sold);
      const actual = safeNumber(data.gross_profit);
      return Math.abs(expected - actual) <= Math.abs(expected * 0.01);
    },
    getExpected: (data: Record<string, number>) =>
      safeNumber(data.gross_receipts) - safeNumber(data.cost_of_goods_sold),
  },
  {
    id: '1120S-002',
    name: 'Total Deductions Sum',
    description: 'Line 20 (Total deductions) should equal sum of Lines 7-19',
    severity: 'error',
    formula: 'total_deductions = sum(officer_comp, salaries, repairs, bad_debts, rents, taxes, interest, depreciation, depletion, advertising, pension, employee_benefits, other_deductions)',
    tolerance_percent: 0.02,
    validate: (data: Record<string, number>) => {
      const deductionFields = [
        'officer_compensation', 'salaries_wages', 'repairs', 'bad_debts',
        'rent_expense', 'taxes_licenses', 'interest_expense', 'depreciation',
        'depletion', 'advertising', 'pension_profit_sharing', 'employee_benefits',
        'other_deductions'
      ];
      const expected = deductionFields.reduce((sum, f) => sum + safeNumber(data[f]), 0);
      const actual = safeNumber(data.total_deductions);
      return actual === 0 || Math.abs(expected - actual) <= Math.abs(expected * 0.02);
    },
    getExpected: (data: Record<string, number>) => {
      const deductionFields = [
        'officer_compensation', 'salaries_wages', 'repairs', 'bad_debts',
        'rent_expense', 'taxes_licenses', 'interest_expense', 'depreciation',
        'depletion', 'advertising', 'pension_profit_sharing', 'employee_benefits',
        'other_deductions'
      ];
      return deductionFields.reduce((sum, f) => sum + safeNumber(data[f]), 0);
    },
  },
  {
    id: '1120S-003',
    name: 'Ordinary Business Income',
    description: 'Line 21 (Ordinary income) should equal Line 6 - Line 20',
    severity: 'error',
    formula: 'ordinary_income = total_income - total_deductions',
    tolerance_percent: 0.01,
    validate: (data: Record<string, number>) => {
      const totalIncome = safeNumber(data.gross_profit) + safeNumber(data.other_income);
      const expected = totalIncome - safeNumber(data.total_deductions);
      const actual = safeNumber(data.net_income);
      return Math.abs(expected - actual) <= Math.abs(expected * 0.01) || actual === 0;
    },
    getExpected: (data: Record<string, number>) => {
      const totalIncome = safeNumber(data.gross_profit) + safeNumber(data.other_income);
      return totalIncome - safeNumber(data.total_deductions);
    },
  },
  {
    id: '1120S-004',
    name: 'Balance Sheet Assets',
    description: 'Total Assets (Schedule L) should equal Total Liabilities + Equity',
    severity: 'error',
    formula: 'total_assets = total_liabilities + total_equity',
    tolerance_percent: 0.01,
    validate: (data: Record<string, number>) => {
      const assets = safeNumber(data.total_assets);
      const liabilitiesEquity = safeNumber(data.total_liabilities) + safeNumber(data.total_equity);
      return assets === 0 || Math.abs(assets - liabilitiesEquity) <= Math.abs(assets * 0.01);
    },
    getExpected: (data: Record<string, number>) =>
      safeNumber(data.total_liabilities) + safeNumber(data.total_equity),
  },
];

/**
 * Form 1120 (C-Corporation) validation rules
 */
const FORM_1120_RULES: ValidationRule[] = [
  {
    id: '1120-001',
    name: 'Gross Profit Calculation',
    description: 'Line 3 should equal Line 1c - Line 2',
    severity: 'error',
    formula: 'gross_profit = gross_receipts - cost_of_goods_sold',
    tolerance_percent: 0.01,
    validate: (data: Record<string, number>) => {
      const expected = safeNumber(data.gross_receipts) - safeNumber(data.cost_of_goods_sold);
      const actual = safeNumber(data.gross_profit);
      return Math.abs(expected - actual) <= Math.abs(expected * 0.01);
    },
    getExpected: (data: Record<string, number>) =>
      safeNumber(data.gross_receipts) - safeNumber(data.cost_of_goods_sold),
  },
  {
    id: '1120-002',
    name: 'Total Income Calculation',
    description: 'Line 11 should equal sum of income items',
    severity: 'error',
    formula: 'total_income = gross_profit + dividends + interest + gross_rents + gross_royalties + capital_gain + other_income',
    tolerance_percent: 0.02,
    validate: (data: Record<string, number>) => {
      const incomeFields = [
        'gross_profit', 'dividends', 'interest_income', 'gross_rents',
        'gross_royalties', 'capital_gain_net', 'net_gain_form_4797', 'other_income'
      ];
      const expected = incomeFields.reduce((sum, f) => sum + safeNumber(data[f]), 0);
      const actual = safeNumber(data.total_income);
      return actual === 0 || Math.abs(expected - actual) <= Math.abs(expected * 0.02);
    },
    getExpected: (data: Record<string, number>) => {
      const incomeFields = [
        'gross_profit', 'dividends', 'interest_income', 'gross_rents',
        'gross_royalties', 'capital_gain_net', 'net_gain_form_4797', 'other_income'
      ];
      return incomeFields.reduce((sum, f) => sum + safeNumber(data[f]), 0);
    },
  },
  {
    id: '1120-003',
    name: 'Balance Sheet Balance',
    description: 'Total Assets must equal Total Liabilities + Shareholders Equity',
    severity: 'error',
    formula: 'total_assets = total_liabilities + shareholders_equity',
    tolerance_percent: 0.01,
    validate: (data: Record<string, number>) => {
      const assets = safeNumber(data.total_assets);
      const liabilitiesEquity = safeNumber(data.total_liabilities) + safeNumber(data.total_equity);
      return assets === 0 || Math.abs(assets - liabilitiesEquity) <= Math.abs(assets * 0.01);
    },
    getExpected: (data: Record<string, number>) =>
      safeNumber(data.total_liabilities) + safeNumber(data.total_equity),
  },
];

/**
 * Form 1065 (Partnership) validation rules
 */
const FORM_1065_RULES: ValidationRule[] = [
  {
    id: '1065-001',
    name: 'Gross Profit Calculation',
    description: 'Line 3 should equal Line 1c - Line 2',
    severity: 'error',
    formula: 'gross_profit = gross_receipts - cost_of_goods_sold',
    tolerance_percent: 0.01,
    validate: (data: Record<string, number>) => {
      const expected = safeNumber(data.gross_receipts) - safeNumber(data.cost_of_goods_sold);
      const actual = safeNumber(data.gross_profit);
      return Math.abs(expected - actual) <= Math.abs(expected * 0.01);
    },
    getExpected: (data: Record<string, number>) =>
      safeNumber(data.gross_receipts) - safeNumber(data.cost_of_goods_sold),
  },
  {
    id: '1065-002',
    name: 'Ordinary Business Income',
    description: 'Line 22 should equal total income minus total deductions',
    severity: 'error',
    formula: 'ordinary_income = total_income - total_deductions',
    tolerance_percent: 0.01,
    validate: (data: Record<string, number>) => {
      const expected = safeNumber(data.total_income) - safeNumber(data.total_deductions);
      const actual = safeNumber(data.net_income);
      return Math.abs(expected - actual) <= Math.abs(expected * 0.01) || actual === 0;
    },
    getExpected: (data: Record<string, number>) =>
      safeNumber(data.total_income) - safeNumber(data.total_deductions),
  },
];

/**
 * Schedule C (Sole Proprietorship) validation rules
 */
const SCHEDULE_C_RULES: ValidationRule[] = [
  {
    id: 'SCHC-001',
    name: 'Gross Profit Calculation',
    description: 'Line 7 should equal Line 3 - Line 4 - Line 6',
    severity: 'error',
    formula: 'gross_profit = gross_receipts - returns_allowances - cost_of_goods_sold',
    tolerance_percent: 0.01,
    validate: (data: Record<string, number>) => {
      const expected = safeNumber(data.gross_receipts) -
                      safeNumber(data.returns_allowances) -
                      safeNumber(data.cost_of_goods_sold);
      const actual = safeNumber(data.gross_profit);
      return Math.abs(expected - actual) <= Math.abs(expected * 0.01);
    },
    getExpected: (data: Record<string, number>) =>
      safeNumber(data.gross_receipts) -
      safeNumber(data.returns_allowances) -
      safeNumber(data.cost_of_goods_sold),
  },
  {
    id: 'SCHC-002',
    name: 'Net Profit Calculation',
    description: 'Line 31 should equal Line 7 - Line 28',
    severity: 'error',
    formula: 'net_profit = gross_profit - total_expenses',
    tolerance_percent: 0.01,
    validate: (data: Record<string, number>) => {
      const expected = safeNumber(data.gross_profit) - safeNumber(data.total_expenses);
      const actual = safeNumber(data.net_income);
      return Math.abs(expected - actual) <= Math.abs(expected * 0.01) || actual === 0;
    },
    getExpected: (data: Record<string, number>) =>
      safeNumber(data.gross_profit) - safeNumber(data.total_expenses),
  },
];

/**
 * Universal validation rules (apply to all form types)
 */
const UNIVERSAL_RULES: ValidationRule[] = [
  {
    id: 'UNI-001',
    name: 'Positive Revenue Check',
    description: 'Gross receipts should be a positive number',
    severity: 'error',
    formula: 'gross_receipts > 0',
    tolerance_percent: 0,
    validate: (data: Record<string, number>) => {
      return safeNumber(data.gross_receipts) > 0;
    },
    getExpected: () => null,
  },
  {
    id: 'UNI-002',
    name: 'COGS Reasonableness',
    description: 'COGS should not exceed gross receipts',
    severity: 'error',
    formula: 'cost_of_goods_sold <= gross_receipts',
    tolerance_percent: 0,
    validate: (data: Record<string, number>) => {
      const cogs = safeNumber(data.cost_of_goods_sold);
      const revenue = safeNumber(data.gross_receipts);
      return cogs === 0 || cogs <= revenue;
    },
    getExpected: (data: Record<string, number>) => safeNumber(data.gross_receipts),
  },
  {
    id: 'UNI-003',
    name: 'Depreciation Reasonableness',
    description: 'Depreciation should not exceed 50% of revenue',
    severity: 'warning',
    formula: 'depreciation <= gross_receipts * 0.5',
    tolerance_percent: 0,
    validate: (data: Record<string, number>) => {
      const depreciation = safeNumber(data.depreciation);
      const revenue = safeNumber(data.gross_receipts);
      return depreciation === 0 || depreciation <= revenue * 0.5;
    },
    getExpected: (data: Record<string, number>) => safeNumber(data.gross_receipts) * 0.5,
  },
];

// ============================================
// MAIN VALIDATION FUNCTION
// ============================================

export interface TaxFormValidationInputs {
  form_type: TaxFormType;
  extracted_data: SingleYearFinancials;
  balance_sheet_data?: Record<string, number>;
}

/**
 * Validate extracted tax form data
 */
export function validateTaxFormData(inputs: TaxFormValidationInputs): TaxFormValidationResult {
  const { form_type, extracted_data, balance_sheet_data = {} } = inputs;

  // Merge all data for validation
  const allData = {
    ...extracted_data,
    ...balance_sheet_data,
  } as unknown as Record<string, number>;

  // Get rules for this form type
  const formRules = getFormRules(form_type);
  const allRules = [...formRules, ...UNIVERSAL_RULES];

  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const passed: string[] = [];

  // Run each rule
  for (const rule of allRules) {
    const isValid = rule.validate(allData);

    if (isValid) {
      passed.push(rule.id);
    } else {
      const expected = rule.getExpected(allData);
      const item = {
        rule_id: rule.id,
        rule_name: rule.name,
        description: rule.description,
        expected_value: expected !== null ? formatCurrency(expected) : 'N/A',
        actual_value: 'See extracted data',
        correction_guidance: getCorrectionGuidance(rule.id, form_type),
      };

      if (rule.severity === 'error') {
        errors.push(item as ValidationError);
      } else {
        warnings.push(item as ValidationWarning);
      }
    }
  }

  // Calculate overall validity
  const totalRules = allRules.length;
  const passedCount = passed.length;
  const errorCount = errors.length;
  const warningCount = warnings.length;

  const isValid = errorCount === 0;
  const confidenceScore = Math.round((passedCount / totalRules) * 100);

  return {
    form_type,
    is_valid: isValid,
    confidence_score: confidenceScore,

    summary: {
      total_rules_checked: totalRules,
      rules_passed: passedCount,
      errors_found: errorCount,
      warnings_found: warningCount,
    },

    errors,
    warnings,
    passed_rules: passed,

    recommended_actions: generateRecommendedActions(errors, warnings, form_type),
    validation_narrative: generateValidationNarrative(isValid, confidenceScore, errors, warnings, form_type),
    validated_at: new Date().toISOString(),
  };
}

function getFormRules(formType: TaxFormType): ValidationRule[] {
  switch (formType) {
    case '1120-S':
    case 'Form_1120S':
      return FORM_1120S_RULES;
    case '1120':
    case 'Form_1120':
      return FORM_1120_RULES;
    case '1065':
    case 'Form_1065':
      return FORM_1065_RULES;
    case 'Schedule_C':
      return SCHEDULE_C_RULES;
    default:
      return [];
  }
}

function getCorrectionGuidance(ruleId: string, formType: TaxFormType): string {
  const guidance: Record<string, string> = {
    '1120S-001': 'Re-extract Line 1c, Line 2, and Line 3. Verify calculation.',
    '1120S-002': 'Re-sum deduction lines 7-19 and compare to Line 20.',
    '1120S-003': 'Verify Line 6 minus Line 20 equals Line 21.',
    '1120S-004': 'Check Schedule L. Assets must equal Liabilities + Equity.',
    '1120-001': 'Verify gross profit calculation: Line 1c - Line 2 = Line 3.',
    '1120-002': 'Sum income lines 4-10 and compare to Line 11.',
    '1120-003': 'Check Schedule L balance sheet balance.',
    '1065-001': 'Verify gross profit: Line 1c - Line 2 = Line 3.',
    '1065-002': 'Check total income minus deductions equals Line 22.',
    'SCHC-001': 'Verify Line 7 = Line 3 - Line 4 - Line 6.',
    'SCHC-002': 'Verify Line 31 = Line 7 - Line 28.',
    'UNI-001': 'Gross receipts must be positive. Check Line 1c.',
    'UNI-002': 'COGS cannot exceed revenue. Check extraction.',
    'UNI-003': 'Depreciation is unusually high. Verify Form 4562.',
  };
  return guidance[ruleId] || `Review ${formType} and re-extract relevant lines.`;
}

function generateRecommendedActions(
  errors: ValidationError[],
  warnings: ValidationWarning[],
  formType: TaxFormType
): string[] {
  const actions: string[] = [];

  if (errors.length > 0) {
    actions.push(`Fix ${errors.length} validation error(s) before proceeding.`);
  }
  if (warnings.length > 0) {
    actions.push(`Review ${warnings.length} warning(s) for data quality.`);
  }
  actions.push(`Compare extracted values against original ${formType}.`);

  return actions;
}

function generateValidationNarrative(
  isValid: boolean,
  confidenceScore: number,
  errors: ValidationError[],
  warnings: ValidationWarning[],
  formType: TaxFormType
): string {
  let narrative = `### Tax Form Validation\n\n`;
  narrative += `**Form:** ${formType} | **Status:** ${isValid ? 'Passed' : 'Failed'} | **Score:** ${confidenceScore}%\n\n`;

  if (isValid && warnings.length === 0) {
    narrative += 'All validation checks passed. Data is consistent.\n';
  } else if (isValid) {
    narrative += `Passed with ${warnings.length} warning(s) to review.\n`;
  } else {
    narrative += `Failed with ${errors.length} error(s). See details above.\n`;
  }

  return narrative;
}

export { FORM_1120S_RULES, FORM_1120_RULES, FORM_1065_RULES, SCHEDULE_C_RULES, UNIVERSAL_RULES };
