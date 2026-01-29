/**
 * Form 1120 (C-Corporation) Schema Mapping
 * PRD-H: Robust PDF Extraction Pipeline
 *
 * Maps extracted table data from Form 1120 to standard financial schema.
 * Key differences from 1120-S: Income tax (Line 31), different line numbers.
 * Key SDE add-back: Officer Compensation (Line 12)
 */

import { FinancialDocumentType } from '../types';
import { FieldMapping, SectionMapping, DocumentMapping } from './form-1120s';

/**
 * Form 1120 Income Section (Lines 1-11)
 */
const INCOME_SECTION: SectionMapping = {
  name: 'income',
  description: 'Form 1120 Income Section (Lines 1-11)',
  identifyingKeywords: ['Gross receipts', 'Cost of goods sold', 'Gross profit', 'Dividends'],
  fields: [
    {
      field: 'gross_receipts',
      sourceLabels: [
        'Gross receipts or sales',
        '1a Gross receipts',
        'Line 1a',
        'Gross receipts',
        'Total revenue',
      ],
      required: true,
    },
    {
      field: 'returns_allowances',
      sourceLabels: [
        'Returns and allowances',
        '1b Returns',
        'Line 1b',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'cost_of_goods_sold',
      sourceLabels: [
        'Cost of goods sold',
        '2 Cost of goods',
        'Line 2',
        'COGS',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'gross_profit',
      sourceLabels: [
        'Gross profit',
        '3 Gross profit',
        'Line 3',
      ],
      required: true,
    },
    {
      field: 'dividends',
      sourceLabels: [
        'Dividends',
        '4 Dividends',
        'Line 4',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'interest_income',
      sourceLabels: [
        'Interest',
        '5 Interest',
        'Line 5',
        'Interest income',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'gross_rents',
      sourceLabels: [
        'Gross rents',
        '6 Gross rents',
        'Line 6',
        'Rental income',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'gross_royalties',
      sourceLabels: [
        'Gross royalties',
        '7 Gross royalties',
        'Line 7',
        'Royalty income',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'capital_gain',
      sourceLabels: [
        'Capital gain net income',
        '8 Capital gain',
        'Line 8',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Non-recurring - add back for SDE normalization',
    },
    {
      field: 'net_gain_form_4797',
      sourceLabels: [
        'Net gain (loss) from Form 4797',
        '9 Net gain',
        'Line 9',
        'Form 4797',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Non-recurring - add back for SDE normalization',
    },
    {
      field: 'other_income',
      sourceLabels: [
        'Other income',
        '10 Other income',
        'Line 10',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'total_income',
      sourceLabels: [
        'Total income',
        '11 Total income',
        'Line 11',
      ],
      required: true,
    },
  ],
};

/**
 * Form 1120 Deductions Section (Lines 12-27)
 */
const DEDUCTIONS_SECTION: SectionMapping = {
  name: 'deductions',
  description: 'Form 1120 Deductions Section (Lines 12-27)',
  identifyingKeywords: ['Compensation of officers', 'Salaries and wages', 'Depreciation'],
  fields: [
    {
      field: 'officer_compensation',
      sourceLabels: [
        'Compensation of officers',
        '12 Compensation',
        'Line 12',
        'Officer compensation',
      ],
      required: true,
      sdeNote: 'PRIMARY SDE ADD-BACK - Full amount added back for owner compensation',
    },
    {
      field: 'salaries_wages',
      sourceLabels: [
        'Salaries and wages',
        '13 Salaries',
        'Line 13',
        'Wages',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'repairs_maintenance',
      sourceLabels: [
        'Repairs and maintenance',
        '14 Repairs',
        'Line 14',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'bad_debts',
      sourceLabels: [
        'Bad debts',
        '15 Bad debts',
        'Line 15',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'rent',
      sourceLabels: [
        'Rents',
        '16 Rents',
        'Line 16',
        'Rent expense',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'taxes_licenses',
      sourceLabels: [
        'Taxes and licenses',
        '17 Taxes',
        'Line 17',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'interest',
      sourceLabels: [
        'Interest',
        '18 Interest',
        'Line 18',
        'Interest expense',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Often added back for SDE (discretionary financing)',
    },
    {
      field: 'charitable_contributions',
      sourceLabels: [
        'Charitable contributions',
        '19 Charitable',
        'Line 19',
        'Donations',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Discretionary - often added back for SDE',
    },
    {
      field: 'depreciation',
      sourceLabels: [
        'Depreciation',
        '20 Depreciation',
        'Line 20',
        'Form 4562',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Add back for SDE calculation',
    },
    {
      field: 'depletion',
      sourceLabels: [
        'Depletion',
        '21 Depletion',
        'Line 21',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'advertising',
      sourceLabels: [
        'Advertising',
        '22 Advertising',
        'Line 22',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'pension_profit_sharing',
      sourceLabels: [
        'Pension, profit-sharing',
        '23 Pension',
        'Line 23',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'employee_benefits',
      sourceLabels: [
        'Employee benefit programs',
        '24 Employee benefits',
        'Line 24',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'domestic_production',
      sourceLabels: [
        'Domestic production activities deduction',
        '25 Domestic production',
        'Line 25',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'other_deductions',
      sourceLabels: [
        'Other deductions',
        '26 Other deductions',
        'Line 26',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'total_deductions',
      sourceLabels: [
        'Total deductions',
        '27 Total deductions',
        'Line 27',
      ],
      required: true,
    },
  ],
};

/**
 * Form 1120 Tax and Payments Section (Lines 28-35)
 */
const TAX_SECTION: SectionMapping = {
  name: 'tax',
  description: 'Form 1120 Tax and Payments (Lines 28-35)',
  identifyingKeywords: ['Taxable income', 'Total tax', 'Income tax'],
  fields: [
    {
      field: 'taxable_income_before_nol',
      sourceLabels: [
        'Taxable income before net operating loss',
        '28 Taxable income',
        'Line 28',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'net_operating_loss_deduction',
      sourceLabels: [
        'Net operating loss deduction',
        '29a NOL',
        'Line 29a',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'taxable_income',
      sourceLabels: [
        'Taxable income',
        '30 Taxable income',
        'Line 30',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'total_tax',
      sourceLabels: [
        'Total tax',
        '31 Total tax',
        'Line 31',
        'Income tax',
        'Federal income tax',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Add back for pre-tax SDE calculation (C-Corp specific)',
    },
  ],
};

/**
 * Form 1120 Schedule L - Assets (same structure as 1120-S)
 */
const SCHEDULE_L_ASSETS: SectionMapping = {
  name: 'balance_sheet_assets',
  description: 'Schedule L - Assets (Beginning and End of Year)',
  identifyingKeywords: ['Cash', 'Trade notes', 'Total assets'],
  fields: [
    {
      field: 'cash',
      sourceLabels: ['Cash', '1 Cash', 'Line 1'],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'accounts_receivable',
      sourceLabels: [
        'Trade notes and accounts receivable',
        '2a Trade notes',
        'Accounts receivable',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'inventory',
      sourceLabels: ['Inventories', '3 Inventories', 'Inventory'],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'loans_to_shareholders',
      sourceLabels: [
        'Loans to shareholders',
        '7 Loans to shareholders',
        'Due from shareholders',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'RED FLAG - May indicate distributions disguised as loans',
    },
    {
      field: 'buildings_depreciable',
      sourceLabels: [
        'Buildings and other depreciable assets',
        '10a Buildings',
        'Fixed assets',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'accumulated_depreciation',
      sourceLabels: [
        'Less accumulated depreciation',
        '10b Accumulated depreciation',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'land',
      sourceLabels: ['Land', '11 Land'],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'intangible_assets',
      sourceLabels: ['Intangible assets', '12a Intangible'],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'total_assets',
      sourceLabels: ['Total assets', '15 Total assets'],
      required: true,
    },
  ],
};

/**
 * Form 1120 Schedule L - Liabilities and Equity
 */
const SCHEDULE_L_LIABILITIES: SectionMapping = {
  name: 'balance_sheet_liabilities',
  description: 'Schedule L - Liabilities and Equity',
  identifyingKeywords: ['Accounts payable', 'Total liabilities', 'Retained earnings'],
  fields: [
    {
      field: 'accounts_payable',
      sourceLabels: ['Accounts payable', '16 Accounts payable'],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'short_term_debt',
      sourceLabels: [
        'Mortgages, notes, bonds payable in less than 1 year',
        '17 Short-term debt',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'loans_from_shareholders',
      sourceLabels: [
        'Loans from shareholders',
        '19 Loans from shareholders',
        'Due to shareholders',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'long_term_debt',
      sourceLabels: [
        'Mortgages, notes, bonds payable in 1 year or more',
        '20 Long-term debt',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'capital_stock',
      sourceLabels: ['Capital stock', '22 Capital stock', 'Common stock'],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'additional_paid_in_capital',
      sourceLabels: [
        'Additional paid-in capital',
        '23 Paid-in capital',
        'APIC',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'retained_earnings',
      sourceLabels: [
        'Retained earnings—Appropriated',
        'Retained earnings—Unappropriated',
        '24 Retained earnings',
        '25 Retained earnings',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Negative retained earnings is a RED FLAG',
    },
    {
      field: 'total_liabilities_equity',
      sourceLabels: [
        'Total liabilities and shareholders equity',
        '27 Total liabilities',
      ],
      required: true,
    },
  ],
};

/**
 * Complete Form 1120 mapping configuration
 */
export const FORM_1120_MAPPING: DocumentMapping = {
  documentType: 'FORM_1120',
  formNumber: '1120',
  description: 'U.S. Corporation Income Tax Return (C-Corp)',
  sections: [
    INCOME_SECTION,
    DEDUCTIONS_SECTION,
    TAX_SECTION,
    SCHEDULE_L_ASSETS,
    SCHEDULE_L_LIABILITIES,
  ],
};
