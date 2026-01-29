/**
 * Schedule C (Sole Proprietorship) Schema Mapping
 * PRD-H: Robust PDF Extraction Pipeline
 *
 * Maps extracted table data from Schedule C (Form 1040) to standard financial schema.
 * Key differences:
 * - No balance sheet (sole props don't file Schedule L)
 * - Net profit = owner draws for SDE calculation
 * - Home office, car/truck, meals typically have personal use components
 */

import { FinancialDocumentType } from '../types';
import { FieldMapping, SectionMapping, DocumentMapping } from './form-1120s';

/**
 * Schedule C Income Section (Part I, Lines 1-7)
 */
const INCOME_SECTION: SectionMapping = {
  name: 'income',
  description: 'Schedule C Income Section (Part I, Lines 1-7)',
  identifyingKeywords: ['Gross receipts', 'Returns and allowances', 'Gross profit', 'Gross income'],
  fields: [
    {
      field: 'gross_receipts',
      sourceLabels: [
        'Gross receipts or sales',
        '1 Gross receipts',
        'Line 1',
        'Gross receipts',
      ],
      required: true,
    },
    {
      field: 'returns_allowances',
      sourceLabels: [
        'Returns and allowances',
        '2 Returns',
        'Line 2',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'net_receipts',
      sourceLabels: [
        'Subtract line 2 from line 1',
        '3 Net receipts',
        'Line 3',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'cost_of_goods_sold',
      sourceLabels: [
        'Cost of goods sold',
        '4 Cost of goods',
        'Line 4',
        'COGS',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'gross_profit',
      sourceLabels: [
        'Gross profit',
        '5 Gross profit',
        'Line 5',
      ],
      required: true,
    },
    {
      field: 'other_income',
      sourceLabels: [
        'Other income',
        '6 Other income',
        'Line 6',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'gross_income',
      sourceLabels: [
        'Gross income',
        '7 Gross income',
        'Line 7',
      ],
      required: true,
    },
  ],
};

/**
 * Schedule C Expenses Section (Part II, Lines 8-27)
 * Key SDE add-backs: home office, portion of car/truck, portion of meals
 */
const EXPENSES_SECTION: SectionMapping = {
  name: 'expenses',
  description: 'Schedule C Expenses Section (Part II, Lines 8-27)',
  identifyingKeywords: ['Advertising', 'Car and truck', 'Depreciation', 'Insurance', 'Office expense'],
  fields: [
    {
      field: 'advertising',
      sourceLabels: [
        'Advertising',
        '8 Advertising',
        'Line 8',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'car_truck_expenses',
      sourceLabels: [
        'Car and truck expenses',
        '9 Car and truck',
        'Line 9',
        'Vehicle expenses',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'PARTIAL ADD-BACK - Typically 50% personal use. Review for actual business percentage.',
    },
    {
      field: 'commissions_fees',
      sourceLabels: [
        'Commissions and fees',
        '10 Commissions',
        'Line 10',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'contract_labor',
      sourceLabels: [
        'Contract labor',
        '11 Contract labor',
        'Line 11',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'depletion',
      sourceLabels: [
        'Depletion',
        '12 Depletion',
        'Line 12',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'depreciation',
      sourceLabels: [
        'Depreciation and section 179',
        '13 Depreciation',
        'Line 13',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Add back for SDE calculation',
    },
    {
      field: 'employee_benefits',
      sourceLabels: [
        'Employee benefit programs',
        '14 Employee benefits',
        'Line 14',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'insurance',
      sourceLabels: [
        'Insurance (other than health)',
        '15 Insurance',
        'Line 15',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'interest_mortgage',
      sourceLabels: [
        'Interest on business debt',
        'Interest (Mortgage)',
        '16a Interest',
        'Line 16a',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Often added back for SDE (discretionary financing)',
    },
    {
      field: 'interest_other',
      sourceLabels: [
        'Interest (Other)',
        '16b Interest',
        'Line 16b',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Often added back for SDE (discretionary financing)',
    },
    {
      field: 'legal_professional',
      sourceLabels: [
        'Legal and professional services',
        '17 Legal',
        'Line 17',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'office_expense',
      sourceLabels: [
        'Office expense',
        '18 Office expense',
        'Line 18',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'pension_profit_sharing',
      sourceLabels: [
        'Pension and profit-sharing plans',
        '19 Pension',
        'Line 19',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'rent_vehicles',
      sourceLabels: [
        'Rent or lease (vehicles)',
        '20a Rent vehicles',
        'Line 20a',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Review for personal use component',
    },
    {
      field: 'rent_equipment',
      sourceLabels: [
        'Rent or lease (other)',
        '20b Rent equipment',
        'Line 20b',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'repairs_maintenance',
      sourceLabels: [
        'Repairs and maintenance',
        '21 Repairs',
        'Line 21',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'supplies',
      sourceLabels: [
        'Supplies',
        '22 Supplies',
        'Line 22',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'taxes_licenses',
      sourceLabels: [
        'Taxes and licenses',
        '23 Taxes',
        'Line 23',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'travel',
      sourceLabels: [
        'Travel',
        '24a Travel',
        'Line 24a',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'meals',
      sourceLabels: [
        'Deductible meals',
        'Meals',
        '24b Meals',
        'Line 24b',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'PARTIAL ADD-BACK - Only 50% deductible; owner may add back remaining 50% for personal.',
    },
    {
      field: 'utilities',
      sourceLabels: [
        'Utilities',
        '25 Utilities',
        'Line 25',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'wages',
      sourceLabels: [
        'Wages',
        '26 Wages',
        'Line 26',
        'Salaries and wages',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'other_expenses',
      sourceLabels: [
        'Other expenses',
        '27a Other',
        'Line 27a',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'total_expenses',
      sourceLabels: [
        'Total expenses',
        '28 Total expenses',
        'Line 28',
      ],
      required: true,
    },
  ],
};

/**
 * Schedule C Net Profit Section (Part II, Lines 29-31)
 * Net profit is effectively the owner's draw for SDE calculation
 */
const NET_PROFIT_SECTION: SectionMapping = {
  name: 'net_profit',
  description: 'Schedule C Net Profit Section (Lines 29-31)',
  identifyingKeywords: ['Net profit', 'Tentative profit', 'Home use'],
  fields: [
    {
      field: 'tentative_profit',
      sourceLabels: [
        'Tentative profit',
        '29 Tentative profit',
        'Line 29',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'home_office_deduction',
      sourceLabels: [
        'Expenses for business use of your home',
        'Home office deduction',
        '30 Business use of home',
        'Line 30',
        'Form 8829',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'FULL ADD-BACK - Home office is discretionary and typically added back for SDE.',
    },
    {
      field: 'net_profit',
      sourceLabels: [
        'Net profit or (loss)',
        'Net profit',
        '31 Net profit',
        'Line 31',
      ],
      required: true,
      sdeNote: 'NET PROFIT = OWNER COMPENSATION for sole proprietors. This is the base for SDE calculation.',
    },
  ],
};

/**
 * Schedule C Cost of Goods Sold (Part III)
 * Optional section for businesses with inventory
 */
const COGS_SECTION: SectionMapping = {
  name: 'cost_of_goods_sold_detail',
  description: 'Schedule C Cost of Goods Sold (Part III)',
  identifyingKeywords: ['Inventory at beginning', 'Purchases', 'Cost of labor', 'Inventory at end'],
  fields: [
    {
      field: 'inventory_beginning',
      sourceLabels: [
        'Inventory at beginning of year',
        '35 Inventory beginning',
        'Line 35',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'purchases',
      sourceLabels: [
        'Purchases less cost of items withdrawn',
        '36 Purchases',
        'Line 36',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'cost_of_labor',
      sourceLabels: [
        'Cost of labor',
        '37 Cost of labor',
        'Line 37',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'materials_supplies',
      sourceLabels: [
        'Materials and supplies',
        '38 Materials',
        'Line 38',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'other_costs',
      sourceLabels: [
        'Other costs',
        '39 Other costs',
        'Line 39',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'inventory_ending',
      sourceLabels: [
        'Inventory at end of year',
        '41 Inventory ending',
        'Line 41',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'cogs_calculated',
      sourceLabels: [
        'Cost of goods sold',
        '42 COGS',
        'Line 42',
      ],
      required: false,
      defaultValue: 0,
    },
  ],
};

/**
 * Schedule C Vehicle Information (Part IV)
 * Used to assess personal use percentage
 */
const VEHICLE_SECTION: SectionMapping = {
  name: 'vehicle_information',
  description: 'Schedule C Vehicle Information (Part IV)',
  identifyingKeywords: ['Business miles', 'Commuting miles', 'Personal miles', 'Total miles'],
  fields: [
    {
      field: 'business_miles',
      sourceLabels: [
        'Business miles',
        '44a Business miles',
        'Line 44a',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'commuting_miles',
      sourceLabels: [
        'Commuting miles',
        '44b Commuting miles',
        'Line 44b',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Commuting is personal use - may indicate inflated business percentage',
    },
    {
      field: 'other_personal_miles',
      sourceLabels: [
        'Other miles',
        'Personal miles',
        '44c Other miles',
        'Line 44c',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'total_miles',
      sourceLabels: [
        'Total miles',
        'Total mileage',
      ],
      required: false,
      defaultValue: 0,
    },
  ],
};

/**
 * Complete Schedule C mapping configuration
 *
 * Note: Schedule C has NO balance sheet (sole props don't file Schedule L).
 * All balance sheet fields will default to 0.
 * Net profit (Line 31) represents the owner's effective compensation.
 */
export const SCHEDULE_C_MAPPING: DocumentMapping = {
  documentType: 'SCHEDULE_C',
  formNumber: 'Schedule C',
  description: 'Profit or Loss From Business (Sole Proprietorship)',
  sections: [
    INCOME_SECTION,
    EXPENSES_SECTION,
    NET_PROFIT_SECTION,
    COGS_SECTION,
    VEHICLE_SECTION,
  ],
};
