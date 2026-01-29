/**
 * Form 1120-S (S-Corporation) Schema Mapping
 * PRD-H: Robust PDF Extraction Pipeline
 *
 * Maps extracted table data from Form 1120-S to standard financial schema.
 * Key SDE add-back: Officer Compensation (Line 7)
 */

import { FinancialDocumentType } from '../types';

/**
 * Mapping configuration for a specific field
 */
export interface FieldMapping {
  /** Standard field name in our schema */
  field: string;
  /** Possible labels in the source document */
  sourceLabels: string[];
  /** Whether this field is required */
  required: boolean;
  /** Default value if not found */
  defaultValue?: number;
  /** Notes about SDE treatment */
  sdeNote?: string;
}

/**
 * Section mapping configuration
 */
export interface SectionMapping {
  name: string;
  description: string;
  identifyingKeywords: string[];
  fields: FieldMapping[];
}

/**
 * Complete mapping configuration for a document type
 */
export interface DocumentMapping {
  documentType: FinancialDocumentType;
  formNumber: string;
  description: string;
  sections: SectionMapping[];
}

/**
 * Form 1120-S Income Section (Lines 1-6)
 */
const INCOME_SECTION: SectionMapping = {
  name: 'income',
  description: 'Form 1120-S Income Section (Lines 1-6)',
  identifyingKeywords: ['Gross receipts', 'Cost of goods sold', 'Gross profit'],
  fields: [
    {
      field: 'gross_receipts',
      sourceLabels: [
        'Gross receipts or sales',
        '1a Gross receipts',
        'Line 1a',
        'Gross receipts',
        'Total revenue',
        'Sales',
      ],
      required: true,
    },
    {
      field: 'returns_allowances',
      sourceLabels: [
        'Returns and allowances',
        '1b Returns',
        'Line 1b',
        'Sales returns',
        'Allowances',
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
        'Cost of sales',
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
        'Gross income',
      ],
      required: true,
    },
    {
      field: 'net_gain_form_4797',
      sourceLabels: [
        'Net gain (loss) from Form 4797',
        '4 Net gain',
        'Line 4',
        'Form 4797',
        'Gain on sale',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Non-recurring - typically add back for SDE normalization',
    },
    {
      field: 'other_income',
      sourceLabels: [
        'Other income (loss)',
        '5 Other income',
        'Line 5',
        'Other income',
        'Miscellaneous income',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'total_income',
      sourceLabels: [
        'Total income (loss)',
        '6 Total income',
        'Line 6',
        'Total income',
      ],
      required: true,
    },
  ],
};

/**
 * Form 1120-S Deductions Section (Lines 7-20)
 */
const DEDUCTIONS_SECTION: SectionMapping = {
  name: 'deductions',
  description: 'Form 1120-S Deductions Section (Lines 7-20)',
  identifyingKeywords: ['Compensation of officers', 'Salaries and wages', 'Depreciation'],
  fields: [
    {
      field: 'officer_compensation',
      sourceLabels: [
        'Compensation of officers',
        '7 Compensation',
        'Line 7',
        'Officer compensation',
        'Officers compensation',
        'Officer salaries',
      ],
      required: true,
      sdeNote: 'PRIMARY SDE ADD-BACK - Full amount added back for owner compensation',
    },
    {
      field: 'salaries_wages',
      sourceLabels: [
        'Salaries and wages',
        '8 Salaries',
        'Line 8',
        'Wages',
        'Employee wages',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'repairs_maintenance',
      sourceLabels: [
        'Repairs and maintenance',
        '9 Repairs',
        'Line 9',
        'Repairs',
        'Maintenance',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'bad_debts',
      sourceLabels: [
        'Bad debts',
        '10 Bad debts',
        'Line 10',
        'Bad debt expense',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'rent',
      sourceLabels: [
        'Rents',
        '11 Rents',
        'Line 11',
        'Rent expense',
        'Lease expense',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'taxes_licenses',
      sourceLabels: [
        'Taxes and licenses',
        '12 Taxes',
        'Line 12',
        'Payroll taxes',
        'State taxes',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'interest',
      sourceLabels: [
        'Interest',
        '13 Interest',
        'Line 13',
        'Interest expense',
        'Loan interest',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Often added back for SDE (discretionary financing)',
    },
    {
      field: 'depreciation',
      sourceLabels: [
        'Depreciation',
        '14 Depreciation',
        'Line 14',
        'Depreciation expense',
        'Form 4562 depreciation',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Add back for SDE calculation',
    },
    {
      field: 'depletion',
      sourceLabels: [
        'Depletion',
        '15 Depletion',
        'Line 15',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'advertising',
      sourceLabels: [
        'Advertising',
        '16 Advertising',
        'Line 16',
        'Marketing',
        'Advertising expense',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'pension_profit_sharing',
      sourceLabels: [
        'Pension, profit-sharing',
        '17 Pension',
        'Line 17',
        'Retirement plans',
        '401k',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'employee_benefits',
      sourceLabels: [
        'Employee benefit programs',
        '18 Employee benefits',
        'Line 18',
        'Health insurance',
        'Benefits',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'other_deductions',
      sourceLabels: [
        'Other deductions',
        '19 Other deductions',
        'Line 19',
        'Other expenses',
        'Miscellaneous',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'total_deductions',
      sourceLabels: [
        'Total deductions',
        '20 Total deductions',
        'Line 20',
      ],
      required: true,
    },
  ],
};

/**
 * Form 1120-S Schedule L - Assets (Lines 1-15)
 */
const SCHEDULE_L_ASSETS: SectionMapping = {
  name: 'balance_sheet_assets',
  description: 'Schedule L - Assets (Beginning and End of Year)',
  identifyingKeywords: ['Cash', 'Trade notes', 'Accounts receivable', 'Total assets'],
  fields: [
    {
      field: 'cash',
      sourceLabels: ['Cash', '1 Cash', 'Line 1', 'Cash and equivalents'],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'accounts_receivable',
      sourceLabels: [
        'Trade notes and accounts receivable',
        '2a Trade notes',
        'Line 2a',
        'Accounts receivable',
        'A/R',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'allowance_bad_debts',
      sourceLabels: [
        'Less allowance for bad debts',
        '2b Less allowance',
        'Line 2b',
        'Allowance for doubtful accounts',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'inventory',
      sourceLabels: ['Inventories', '3 Inventories', 'Line 3', 'Inventory'],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'us_government_obligations',
      sourceLabels: [
        'U.S. government obligations',
        '4 Government obligations',
        'Line 4',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'tax_exempt_securities',
      sourceLabels: [
        'Tax-exempt securities',
        '5 Tax-exempt',
        'Line 5',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'other_current_assets',
      sourceLabels: [
        'Other current assets',
        '6 Other current',
        'Line 6',
        'Prepaid expenses',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'loans_to_shareholders',
      sourceLabels: [
        'Loans to shareholders',
        '7 Loans to shareholders',
        'Line 7',
        'Due from shareholders',
        'Shareholder loans receivable',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'RED FLAG - May indicate distributions disguised as loans',
    },
    {
      field: 'mortgage_real_estate_loans',
      sourceLabels: [
        'Mortgage and real estate loans',
        '8 Mortgage loans',
        'Line 8',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'other_investments',
      sourceLabels: [
        'Other investments',
        '9 Other investments',
        'Line 9',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'buildings_depreciable',
      sourceLabels: [
        'Buildings and other depreciable assets',
        '10a Buildings',
        'Line 10a',
        'Fixed assets',
        'Property and equipment',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'accumulated_depreciation',
      sourceLabels: [
        'Less accumulated depreciation',
        '10b Less accumulated',
        'Line 10b',
        'Accumulated depreciation',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'land',
      sourceLabels: ['Land', '11 Land', 'Line 11'],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'intangible_assets',
      sourceLabels: [
        'Intangible assets',
        '12a Intangible assets',
        'Line 12a',
        'Goodwill',
        'Patents',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'accumulated_amortization',
      sourceLabels: [
        'Less accumulated amortization',
        '12b Less accumulated amortization',
        'Line 12b',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'other_assets',
      sourceLabels: [
        'Other assets',
        '13 Other assets',
        'Line 13',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'total_assets',
      sourceLabels: [
        'Total assets',
        '14 Total assets',
        'Line 14',
      ],
      required: true,
    },
  ],
};

/**
 * Form 1120-S Schedule L - Liabilities and Equity (Lines 15-27)
 */
const SCHEDULE_L_LIABILITIES: SectionMapping = {
  name: 'balance_sheet_liabilities',
  description: 'Schedule L - Liabilities and Equity (Beginning and End of Year)',
  identifyingKeywords: ['Accounts payable', 'Total liabilities', 'Retained earnings'],
  fields: [
    {
      field: 'accounts_payable',
      sourceLabels: [
        'Accounts payable',
        '15 Accounts payable',
        'Line 15',
        'A/P',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'short_term_debt',
      sourceLabels: [
        'Mortgages, notes, bonds payable in less than 1 year',
        '16 Short-term debt',
        'Line 16',
        'Current portion of long-term debt',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'other_current_liabilities',
      sourceLabels: [
        'Other current liabilities',
        '17 Other current liabilities',
        'Line 17',
        'Accrued expenses',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'loans_from_shareholders',
      sourceLabels: [
        'Loans from shareholders',
        '18 Loans from shareholders',
        'Line 18',
        'Due to shareholders',
        'Shareholder loans payable',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'May indicate undercapitalization or owner loans',
    },
    {
      field: 'long_term_debt',
      sourceLabels: [
        'Mortgages, notes, bonds payable in 1 year or more',
        '19 Long-term debt',
        'Line 19',
        'Long-term notes payable',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'other_liabilities',
      sourceLabels: [
        'Other liabilities',
        '20 Other liabilities',
        'Line 20',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'capital_stock',
      sourceLabels: [
        'Capital stock',
        '21 Capital stock',
        'Line 21',
        'Common stock',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'additional_paid_in_capital',
      sourceLabels: [
        'Additional paid-in capital',
        '22 Additional paid-in capital',
        'Line 22',
        'Paid-in capital',
        'APIC',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'retained_earnings',
      sourceLabels: [
        'Retained earnings',
        '23 Retained earnings',
        'Line 23',
        'Accumulated earnings',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Negative retained earnings is a RED FLAG',
    },
    {
      field: 'adjustments_equity',
      sourceLabels: [
        'Adjustments to shareholders equity',
        '24 Adjustments',
        'Line 24',
        'AAA',
        'Accumulated adjustments account',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'treasury_stock',
      sourceLabels: [
        'Less cost of treasury stock',
        '25 Treasury stock',
        'Line 25',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'total_liabilities_equity',
      sourceLabels: [
        'Total liabilities and shareholders equity',
        '26 Total liabilities and equity',
        'Line 26',
        'Total liabilities and equity',
      ],
      required: true,
    },
  ],
};

/**
 * Complete Form 1120-S mapping configuration
 */
export const FORM_1120S_MAPPING: DocumentMapping = {
  documentType: 'FORM_1120S',
  formNumber: '1120-S',
  description: 'U.S. Income Tax Return for an S Corporation',
  sections: [
    INCOME_SECTION,
    DEDUCTIONS_SECTION,
    SCHEDULE_L_ASSETS,
    SCHEDULE_L_LIABILITIES,
  ],
};

/**
 * Get all field mappings for Form 1120-S
 */
export function getForm1120SFieldMappings(): Map<string, FieldMapping> {
  const mappings = new Map<string, FieldMapping>();

  for (const section of FORM_1120S_MAPPING.sections) {
    for (const field of section.fields) {
      mappings.set(field.field, field);
    }
  }

  return mappings;
}

/**
 * Get SDE-relevant fields from Form 1120-S
 */
export function getForm1120SSDEFields(): FieldMapping[] {
  const sdeFields: FieldMapping[] = [];

  for (const section of FORM_1120S_MAPPING.sections) {
    for (const field of section.fields) {
      if (field.sdeNote) {
        sdeFields.push(field);
      }
    }
  }

  return sdeFields;
}
