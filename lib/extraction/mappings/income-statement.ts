/**
 * Income Statement / P&L Schema Mapping
 * PRD-H: Robust PDF Extraction Pipeline
 *
 * Maps extracted table data from Profit & Loss statements to standard financial schema.
 * Key challenges:
 * - P&L formats vary WIDELY by accounting software (QuickBooks, Xero, Sage, etc.)
 * - Column layouts vary: single year, multi-year comparison, with/without budget
 * - Category naming is inconsistent across businesses
 * - This mapping relies more heavily on Claude Haiku for field matching
 */

import { FinancialDocumentType } from '../types';
import { FieldMapping, SectionMapping, DocumentMapping } from './form-1120s';

/**
 * Income Statement Revenue Section
 * Common names: Revenue, Income, Sales, Gross Sales
 */
const REVENUE_SECTION: SectionMapping = {
  name: 'revenue',
  description: 'Income Statement Revenue Section',
  identifyingKeywords: ['Revenue', 'Income', 'Sales', 'Gross Sales', 'Total Revenue', 'Total Income'],
  fields: [
    {
      field: 'gross_revenue',
      sourceLabels: [
        'Total Revenue',
        'Gross Revenue',
        'Total Sales',
        'Gross Sales',
        'Total Income',
        'Revenue',
        'Sales',
        'Income',
        'Service Revenue',
        'Product Sales',
        'Fee Income',
      ],
      required: true,
    },
    {
      field: 'sales_discounts',
      sourceLabels: [
        'Sales Discounts',
        'Discounts Given',
        'Customer Discounts',
        'Trade Discounts',
        'Less: Discounts',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'sales_returns',
      sourceLabels: [
        'Sales Returns',
        'Returns and Allowances',
        'Customer Returns',
        'Refunds',
        'Less: Returns',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'net_revenue',
      sourceLabels: [
        'Net Revenue',
        'Net Sales',
        'Net Income from Operations',
        'Total Net Revenue',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'other_income',
      sourceLabels: [
        'Other Income',
        'Other Revenue',
        'Non-operating Income',
        'Interest Income',
        'Miscellaneous Income',
        'Gain on Sale',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Review for non-recurring items to add back',
    },
  ],
};

/**
 * Income Statement Cost of Goods Sold Section
 * Some P&Ls show COGS detail, others just a total
 */
const COGS_SECTION: SectionMapping = {
  name: 'cost_of_goods_sold',
  description: 'Income Statement COGS Section',
  identifyingKeywords: ['Cost of Goods Sold', 'COGS', 'Cost of Sales', 'Cost of Revenue', 'Direct Costs'],
  fields: [
    {
      field: 'cost_of_goods_sold',
      sourceLabels: [
        'Cost of Goods Sold',
        'COGS',
        'Cost of Sales',
        'Cost of Revenue',
        'Direct Costs',
        'Cost of Products Sold',
        'Cost of Services',
        'Total COGS',
        'Total Cost of Goods Sold',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'beginning_inventory',
      sourceLabels: [
        'Beginning Inventory',
        'Opening Inventory',
        'Inventory, Beginning',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'purchases',
      sourceLabels: [
        'Purchases',
        'Material Purchases',
        'Inventory Purchases',
        'Product Costs',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'direct_labor',
      sourceLabels: [
        'Direct Labor',
        'Production Labor',
        'Labor Costs',
        'Manufacturing Labor',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'ending_inventory',
      sourceLabels: [
        'Ending Inventory',
        'Closing Inventory',
        'Inventory, Ending',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'gross_profit',
      sourceLabels: [
        'Gross Profit',
        'Gross Margin',
        'Gross Income',
        'Total Gross Profit',
      ],
      required: true,
    },
  ],
};

/**
 * Income Statement Operating Expenses Section
 * This is where owner compensation typically appears
 */
const OPERATING_EXPENSES_SECTION: SectionMapping = {
  name: 'operating_expenses',
  description: 'Income Statement Operating Expenses Section',
  identifyingKeywords: ['Operating Expenses', 'General and Administrative', 'G&A', 'SG&A', 'Overhead'],
  fields: [
    {
      field: 'officer_compensation',
      sourceLabels: [
        'Officer Compensation',
        'Officers Salaries',
        'Owner Salary',
        'Owner Compensation',
        'Owner Draw',
        'Shareholder Salaries',
        'Management Salaries',
        'Executive Compensation',
        'Partner Draws',
        'Member Draws',
        'Guaranteed Payments',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'PRIMARY SDE ADD-BACK - Full amount added back',
    },
    {
      field: 'salaries_wages',
      sourceLabels: [
        'Salaries and Wages',
        'Wages',
        'Salaries',
        'Payroll',
        'Employee Wages',
        'Staff Salaries',
        'Total Payroll',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'payroll_taxes',
      sourceLabels: [
        'Payroll Taxes',
        'Employment Taxes',
        'FICA',
        'Employer Taxes',
        'Payroll Tax Expense',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'employee_benefits',
      sourceLabels: [
        'Employee Benefits',
        'Benefits',
        'Health Insurance',
        'Insurance - Health',
        'Group Health',
        '401k Contributions',
        'Retirement Contributions',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'rent',
      sourceLabels: [
        'Rent',
        'Rent Expense',
        'Lease Expense',
        'Office Rent',
        'Facility Rent',
        'Building Rent',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Review for related party rent (may need adjustment to market rate)',
    },
    {
      field: 'utilities',
      sourceLabels: [
        'Utilities',
        'Utility Expense',
        'Electric',
        'Gas',
        'Water',
        'Phone',
        'Internet',
        'Telecommunications',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'insurance',
      sourceLabels: [
        'Insurance',
        'Insurance Expense',
        'Business Insurance',
        'Liability Insurance',
        'General Insurance',
        'Property Insurance',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'professional_fees',
      sourceLabels: [
        'Professional Fees',
        'Accounting Fees',
        'Legal Fees',
        'Legal and Accounting',
        'Consulting Fees',
        'Professional Services',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'advertising',
      sourceLabels: [
        'Advertising',
        'Marketing',
        'Advertising and Marketing',
        'Promotion',
        'Marketing Expense',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'office_expense',
      sourceLabels: [
        'Office Expense',
        'Office Supplies',
        'Supplies',
        'Office Supplies and Equipment',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'repairs_maintenance',
      sourceLabels: [
        'Repairs and Maintenance',
        'Repairs',
        'Maintenance',
        'Equipment Repairs',
        'Building Maintenance',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'vehicle_expense',
      sourceLabels: [
        'Vehicle Expense',
        'Auto Expense',
        'Car and Truck',
        'Vehicle',
        'Automobile',
        'Gas and Oil',
        'Mileage',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Review for personal use component (often 50% add-back)',
    },
    {
      field: 'travel',
      sourceLabels: [
        'Travel',
        'Travel Expense',
        'Business Travel',
        'Airfare',
        'Lodging',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'meals_entertainment',
      sourceLabels: [
        'Meals and Entertainment',
        'Meals',
        'Entertainment',
        'Business Meals',
        'Client Entertainment',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Discretionary - often added back for SDE',
    },
    {
      field: 'bad_debt',
      sourceLabels: [
        'Bad Debt',
        'Bad Debt Expense',
        'Uncollectible Accounts',
        'Allowance for Doubtful Accounts',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Non-recurring - add back for SDE normalization',
    },
    {
      field: 'bank_charges',
      sourceLabels: [
        'Bank Charges',
        'Bank Fees',
        'Service Charges',
        'Credit Card Fees',
        'Merchant Fees',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'dues_subscriptions',
      sourceLabels: [
        'Dues and Subscriptions',
        'Memberships',
        'Professional Dues',
        'Subscriptions',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'licenses_permits',
      sourceLabels: [
        'Licenses and Permits',
        'Licenses',
        'Business Licenses',
        'Permits',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'taxes_other',
      sourceLabels: [
        'Taxes',
        'Tax Expense',
        'Other Taxes',
        'Property Tax',
        'Sales Tax Expense',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'depreciation',
      sourceLabels: [
        'Depreciation',
        'Depreciation Expense',
        'Depreciation and Amortization',
        'D&A',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Add back for SDE calculation',
    },
    {
      field: 'amortization',
      sourceLabels: [
        'Amortization',
        'Amortization Expense',
        'Intangible Amortization',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Add back for SDE calculation',
    },
    {
      field: 'other_expenses',
      sourceLabels: [
        'Other Expenses',
        'Miscellaneous',
        'Miscellaneous Expense',
        'Other Operating Expenses',
        'Sundry Expenses',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'total_operating_expenses',
      sourceLabels: [
        'Total Operating Expenses',
        'Total Expenses',
        'Total G&A',
        'Total SG&A',
        'Total Overhead',
      ],
      required: true,
    },
  ],
};

/**
 * Income Statement Other Income/Expense Section
 * Non-operating items that are typically non-recurring
 */
const OTHER_INCOME_EXPENSE_SECTION: SectionMapping = {
  name: 'other_income_expense',
  description: 'Income Statement Other Income/Expense Section (Non-Operating)',
  identifyingKeywords: ['Other Income', 'Other Expense', 'Interest', 'Non-Operating'],
  fields: [
    {
      field: 'interest_income',
      sourceLabels: [
        'Interest Income',
        'Interest Earned',
        'Investment Income',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'interest_expense',
      sourceLabels: [
        'Interest Expense',
        'Interest Paid',
        'Loan Interest',
        'Finance Charges',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Often added back for SDE (discretionary financing)',
    },
    {
      field: 'gain_loss_asset_sale',
      sourceLabels: [
        'Gain on Sale of Assets',
        'Loss on Sale of Assets',
        'Gain (Loss) on Asset Disposal',
        'Asset Sale Gain',
        'Asset Sale Loss',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Non-recurring - add back for SDE normalization',
    },
    {
      field: 'other_income_net',
      sourceLabels: [
        'Other Income, Net',
        'Total Other Income',
        'Net Other Income',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'other_expense_net',
      sourceLabels: [
        'Other Expense, Net',
        'Total Other Expense',
        'Net Other Expense',
      ],
      required: false,
      defaultValue: 0,
    },
  ],
};

/**
 * Income Statement Bottom Line Section
 * Net income and related calculations
 */
const BOTTOM_LINE_SECTION: SectionMapping = {
  name: 'bottom_line',
  description: 'Income Statement Bottom Line (Net Income)',
  identifyingKeywords: ['Net Income', 'Net Profit', 'Net Loss', 'Income Before Tax', 'EBITDA'],
  fields: [
    {
      field: 'operating_income',
      sourceLabels: [
        'Operating Income',
        'Operating Profit',
        'Income from Operations',
        'EBIT',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'income_before_tax',
      sourceLabels: [
        'Income Before Tax',
        'Pre-Tax Income',
        'Earnings Before Tax',
        'Income Before Income Taxes',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'income_tax_expense',
      sourceLabels: [
        'Income Tax Expense',
        'Provision for Income Taxes',
        'Income Taxes',
        'Tax Expense',
        'Federal Tax',
        'State Tax',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Add back for pre-tax SDE calculation',
    },
    {
      field: 'net_income',
      sourceLabels: [
        'Net Income',
        'Net Profit',
        'Net Earnings',
        'Net Income (Loss)',
        'Net Profit (Loss)',
        'Bottom Line',
        'Profit After Tax',
      ],
      required: true,
    },
    {
      field: 'ebitda',
      sourceLabels: [
        'EBITDA',
        'Adjusted EBITDA',
        'Earnings Before Interest, Taxes, Depreciation',
      ],
      required: false,
      defaultValue: 0,
    },
  ],
};

/**
 * Complete Income Statement mapping configuration
 *
 * Note: P&L formats vary significantly. This mapping covers common patterns
 * but relies on Claude Haiku for ambiguous field matching.
 *
 * Multi-year handling: The schema-mapper should look for multiple value columns
 * and map each to the appropriate year in StructuredFinancialData.
 */
export const INCOME_STATEMENT_MAPPING: DocumentMapping = {
  documentType: 'INCOME_STATEMENT',
  formNumber: 'P&L',
  description: 'Profit and Loss Statement / Income Statement',
  sections: [
    REVENUE_SECTION,
    COGS_SECTION,
    OPERATING_EXPENSES_SECTION,
    OTHER_INCOME_EXPENSE_SECTION,
    BOTTOM_LINE_SECTION,
  ],
};
