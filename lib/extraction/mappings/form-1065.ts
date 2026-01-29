/**
 * Form 1065 (Partnership) Schema Mapping
 * PRD-H: Robust PDF Extraction Pipeline
 *
 * Maps extracted table data from Form 1065 to standard financial schema.
 * Key difference: Guaranteed payments to partners (Line 10) is PRIMARY owner compensation
 */

import { FinancialDocumentType } from '../types';
import { FieldMapping, SectionMapping, DocumentMapping } from './form-1120s';

/**
 * Form 1065 Income Section (Lines 1-8)
 */
const INCOME_SECTION: SectionMapping = {
  name: 'income',
  description: 'Form 1065 Income Section (Lines 1-8)',
  identifyingKeywords: ['Gross receipts', 'Cost of goods sold', 'Gross profit', 'Ordinary income'],
  fields: [
    {
      field: 'gross_receipts',
      sourceLabels: [
        'Gross receipts or sales',
        '1a Gross receipts',
        'Line 1a',
        'Gross receipts',
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
      field: 'ordinary_income_other',
      sourceLabels: [
        'Ordinary income (loss) from other partnerships',
        '4 Ordinary income',
        'Line 4',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'net_farm_profit',
      sourceLabels: [
        'Net farm profit (loss)',
        '5 Net farm profit',
        'Line 5',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'net_gain_form_4797',
      sourceLabels: [
        'Net gain (loss) from Form 4797',
        '6 Net gain',
        'Line 6',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Non-recurring - add back for SDE normalization',
    },
    {
      field: 'other_income',
      sourceLabels: [
        'Other income (loss)',
        '7 Other income',
        'Line 7',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'total_income',
      sourceLabels: [
        'Total income (loss)',
        '8 Total income',
        'Line 8',
      ],
      required: true,
    },
  ],
};

/**
 * Form 1065 Deductions Section (Lines 9-21)
 * Key: Guaranteed payments (Line 10) is PRIMARY owner comp for partnerships
 */
const DEDUCTIONS_SECTION: SectionMapping = {
  name: 'deductions',
  description: 'Form 1065 Deductions Section (Lines 9-21)',
  identifyingKeywords: ['Salaries and wages', 'Guaranteed payments', 'Depreciation'],
  fields: [
    {
      field: 'salaries_wages',
      sourceLabels: [
        'Salaries and wages',
        '9 Salaries',
        'Line 9',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'guaranteed_payments',
      sourceLabels: [
        'Guaranteed payments to partners',
        '10 Guaranteed payments',
        'Line 10',
        'Guaranteed payments',
      ],
      required: true,
      sdeNote: 'PRIMARY OWNER COMPENSATION FOR PARTNERSHIPS - Full amount added back',
    },
    {
      field: 'repairs_maintenance',
      sourceLabels: [
        'Repairs and maintenance',
        '11 Repairs',
        'Line 11',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'bad_debts',
      sourceLabels: [
        'Bad debts',
        '12 Bad debts',
        'Line 12',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'rent',
      sourceLabels: [
        'Rents',
        '13 Rents',
        'Line 13',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'taxes_licenses',
      sourceLabels: [
        'Taxes and licenses',
        '14 Taxes',
        'Line 14',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'interest',
      sourceLabels: [
        'Interest',
        '15 Interest',
        'Line 15',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Often added back for SDE (discretionary financing)',
    },
    {
      field: 'depreciation',
      sourceLabels: [
        'Depreciation',
        '16a Depreciation',
        'Line 16a',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Add back for SDE calculation',
    },
    {
      field: 'depletion',
      sourceLabels: [
        'Depletion',
        '17 Depletion',
        'Line 17',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'retirement_plans',
      sourceLabels: [
        'Retirement plans',
        '18 Retirement',
        'Line 18',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'employee_benefits',
      sourceLabels: [
        'Employee benefit programs',
        '19 Employee benefits',
        'Line 19',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'other_deductions',
      sourceLabels: [
        'Other deductions',
        '20 Other deductions',
        'Line 20',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'total_deductions',
      sourceLabels: [
        'Total deductions',
        '21 Total deductions',
        'Line 21',
      ],
      required: true,
    },
  ],
};

/**
 * Form 1065 Schedule L - Assets
 */
const SCHEDULE_L_ASSETS: SectionMapping = {
  name: 'balance_sheet_assets',
  description: 'Schedule L - Assets (Beginning and End of Year)',
  identifyingKeywords: ['Cash', 'Trade notes', 'Total assets', 'Partners capital'],
  fields: [
    {
      field: 'cash',
      sourceLabels: ['Cash', '1 Cash'],
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
      sourceLabels: ['Inventories', '3 Inventories'],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'loans_to_partners',
      sourceLabels: [
        'Loans to partners',
        '7 Loans to partners',
        'Due from partners',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'RED FLAG - Similar to loans to shareholders',
    },
    {
      field: 'buildings_depreciable',
      sourceLabels: [
        'Buildings and other depreciable assets',
        '9a Buildings',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'accumulated_depreciation',
      sourceLabels: [
        'Less accumulated depreciation',
        '9b Accumulated depreciation',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'land',
      sourceLabels: ['Land', '10 Land'],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'intangible_assets',
      sourceLabels: ['Intangible assets', '11a Intangible'],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'total_assets',
      sourceLabels: ['Total assets', '14 Total assets'],
      required: true,
    },
  ],
};

/**
 * Form 1065 Schedule L - Liabilities and Partners' Capital
 */
const SCHEDULE_L_LIABILITIES: SectionMapping = {
  name: 'balance_sheet_liabilities',
  description: 'Schedule L - Liabilities and Partners\' Capital',
  identifyingKeywords: ['Accounts payable', 'Partners capital', 'Total liabilities'],
  fields: [
    {
      field: 'accounts_payable',
      sourceLabels: ['Accounts payable', '15 Accounts payable'],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'short_term_debt',
      sourceLabels: [
        'Mortgages, notes, bonds payable in less than 1 year',
        '16 Short-term debt',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'other_current_liabilities',
      sourceLabels: [
        'Other current liabilities',
        '17 Other current',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'loans_from_partners',
      sourceLabels: [
        'Loans from partners',
        '19 Loans from partners',
        'Due to partners',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'long_term_debt',
      sourceLabels: [
        'Mortgages, notes, bonds payable in 1 year or more',
        '19 Long-term debt',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'partners_capital',
      sourceLabels: [
        'Partners capital accounts',
        '21 Partners capital',
        'Total partners capital',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'total_liabilities_capital',
      sourceLabels: [
        'Total liabilities and capital',
        '22 Total liabilities',
      ],
      required: true,
    },
  ],
};

/**
 * Form 1065 Schedule K - Partners' Distributive Share Items
 * These flow through to K-1s
 */
const SCHEDULE_K_SECTION: SectionMapping = {
  name: 'schedule_k',
  description: 'Schedule K - Partners\' Distributive Share Items',
  identifyingKeywords: ['Ordinary business income', 'Net rental', 'Guaranteed payments', 'Distributions'],
  fields: [
    {
      field: 'ordinary_business_income',
      sourceLabels: [
        'Ordinary business income',
        '1 Ordinary business income',
        'Line 1',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'net_rental_real_estate',
      sourceLabels: [
        'Net rental real estate income',
        '2 Net rental',
        'Line 2',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'other_rental_income',
      sourceLabels: [
        'Other net rental income',
        '3 Other rental',
        'Line 3',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'guaranteed_payments_services',
      sourceLabels: [
        'Guaranteed payments for services',
        '4a Guaranteed payments',
        'Line 4a',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'PRIMARY OWNER COMPENSATION - Add back for SDE',
    },
    {
      field: 'guaranteed_payments_capital',
      sourceLabels: [
        'Guaranteed payments for capital',
        '4b Guaranteed payments capital',
        'Line 4b',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'guaranteed_payments_total',
      sourceLabels: [
        'Total guaranteed payments',
        '4c Total guaranteed',
        'Line 4c',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Total partner compensation - add back for SDE',
    },
    {
      field: 'interest_income',
      sourceLabels: [
        'Interest income',
        '5 Interest',
        'Line 5',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'ordinary_dividends',
      sourceLabels: [
        'Ordinary dividends',
        '6a Dividends',
        'Line 6a',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'net_short_term_capital_gain',
      sourceLabels: [
        'Net short-term capital gain',
        '8 Short-term gain',
        'Line 8',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Non-recurring - add back for SDE normalization',
    },
    {
      field: 'net_long_term_capital_gain',
      sourceLabels: [
        'Net long-term capital gain',
        '9a Long-term gain',
        'Line 9a',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Non-recurring - add back for SDE normalization',
    },
    {
      field: 'net_section_1231_gain',
      sourceLabels: [
        'Net section 1231 gain',
        '10 Section 1231',
        'Line 10',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Non-recurring - add back for SDE normalization',
    },
    {
      field: 'section_179_deduction',
      sourceLabels: [
        'Section 179 deduction',
        '11 Section 179',
        'Line 11',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'MUST ADD BACK - Accelerated depreciation',
    },
    {
      field: 'cash_distributions',
      sourceLabels: [
        'Cash and marketable securities',
        '19a Distributions',
        'Line 19a',
        'Distributions',
      ],
      required: false,
      defaultValue: 0,
    },
  ],
};

/**
 * Complete Form 1065 mapping configuration
 */
export const FORM_1065_MAPPING: DocumentMapping = {
  documentType: 'FORM_1065',
  formNumber: '1065',
  description: 'U.S. Return of Partnership Income',
  sections: [
    INCOME_SECTION,
    DEDUCTIONS_SECTION,
    SCHEDULE_L_ASSETS,
    SCHEDULE_L_LIABILITIES,
    SCHEDULE_K_SECTION,
  ],
};
