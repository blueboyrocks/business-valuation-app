/**
 * Balance Sheet Schema Mapping
 * PRD-H: Robust PDF Extraction Pipeline
 *
 * Maps extracted table data from Balance Sheets to standard financial schema.
 * Key features:
 * - Handles BOY (Beginning of Year) and EOY (End of Year) columns
 * - Identifies loans to/from shareholders as RED FLAGS
 * - Negative retained earnings flagged
 * - Used for working capital analysis
 */

import { FinancialDocumentType } from '../types';
import { FieldMapping, SectionMapping, DocumentMapping } from './form-1120s';

/**
 * Balance Sheet Current Assets Section
 * Liquid assets expected to be converted to cash within one year
 */
const CURRENT_ASSETS_SECTION: SectionMapping = {
  name: 'current_assets',
  description: 'Balance Sheet Current Assets',
  identifyingKeywords: ['Current Assets', 'Cash', 'Accounts Receivable', 'Inventory'],
  fields: [
    {
      field: 'cash',
      sourceLabels: [
        'Cash',
        'Cash and Cash Equivalents',
        'Cash & Equivalents',
        'Cash on Hand',
        'Bank Accounts',
        'Checking Account',
        'Savings Account',
        'Petty Cash',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'accounts_receivable_gross',
      sourceLabels: [
        'Accounts Receivable',
        'A/R',
        'Trade Receivables',
        'Trade Accounts Receivable',
        'Receivables',
        'Customer Receivables',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'allowance_doubtful',
      sourceLabels: [
        'Allowance for Doubtful Accounts',
        'Allowance for Bad Debts',
        'Less: Allowance',
        'Reserve for Bad Debts',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'accounts_receivable_net',
      sourceLabels: [
        'Net Accounts Receivable',
        'Accounts Receivable, Net',
        'Net Receivables',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'inventory',
      sourceLabels: [
        'Inventory',
        'Inventories',
        'Merchandise Inventory',
        'Raw Materials',
        'Work in Progress',
        'Finished Goods',
        'Total Inventory',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'prepaid_expenses',
      sourceLabels: [
        'Prepaid Expenses',
        'Prepaid Assets',
        'Prepaid Insurance',
        'Prepaid Rent',
        'Other Prepaid',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'notes_receivable',
      sourceLabels: [
        'Notes Receivable',
        'Loans Receivable',
        'Short-term Notes Receivable',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'loans_to_shareholders',
      sourceLabels: [
        'Loans to Shareholders',
        'Due from Shareholders',
        'Shareholder Loans Receivable',
        'Loans to Officers',
        'Due from Officers',
        'Due from Related Parties',
        'Loans to Partners',
        'Due from Partners',
        'Loans to Members',
        'Due from Members',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'RED FLAG - May indicate distributions disguised as loans. Review for repayment terms.',
    },
    {
      field: 'other_current_assets',
      sourceLabels: [
        'Other Current Assets',
        'Other Assets',
        'Miscellaneous Current Assets',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'total_current_assets',
      sourceLabels: [
        'Total Current Assets',
        'Current Assets Total',
      ],
      required: true,
    },
  ],
};

/**
 * Balance Sheet Fixed Assets Section
 * Long-term tangible assets used in operations
 */
const FIXED_ASSETS_SECTION: SectionMapping = {
  name: 'fixed_assets',
  description: 'Balance Sheet Fixed Assets (Property, Plant & Equipment)',
  identifyingKeywords: ['Fixed Assets', 'Property', 'Equipment', 'Accumulated Depreciation'],
  fields: [
    {
      field: 'land',
      sourceLabels: [
        'Land',
        'Real Estate - Land',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'buildings_gross',
      sourceLabels: [
        'Buildings',
        'Building',
        'Real Estate - Buildings',
        'Structures',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'machinery_equipment_gross',
      sourceLabels: [
        'Machinery and Equipment',
        'Equipment',
        'Machinery',
        'Production Equipment',
        'Manufacturing Equipment',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'furniture_fixtures_gross',
      sourceLabels: [
        'Furniture and Fixtures',
        'Furniture',
        'Fixtures',
        'Office Furniture',
        'F&F',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'vehicles_gross',
      sourceLabels: [
        'Vehicles',
        'Automobiles',
        'Trucks',
        'Transportation Equipment',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'leasehold_improvements_gross',
      sourceLabels: [
        'Leasehold Improvements',
        'Tenant Improvements',
        'Build-out',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'computer_equipment_gross',
      sourceLabels: [
        'Computer Equipment',
        'Computers',
        'Computer Hardware',
        'IT Equipment',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'accumulated_depreciation',
      sourceLabels: [
        'Accumulated Depreciation',
        'Less: Accumulated Depreciation',
        'Acc. Depreciation',
        'Accum. Depreciation',
        'Total Accumulated Depreciation',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'fixed_assets_net',
      sourceLabels: [
        'Net Fixed Assets',
        'Fixed Assets, Net',
        'Net Property and Equipment',
        'PP&E, Net',
        'Net PP&E',
        'Property, Plant & Equipment, Net',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'total_fixed_assets',
      sourceLabels: [
        'Total Fixed Assets',
        'Total Property and Equipment',
        'Total PP&E',
        'Fixed Assets Total',
      ],
      required: true,
    },
  ],
};

/**
 * Balance Sheet Other Assets Section
 * Intangible and long-term assets
 */
const OTHER_ASSETS_SECTION: SectionMapping = {
  name: 'other_assets',
  description: 'Balance Sheet Other Assets (Intangibles and Long-term)',
  identifyingKeywords: ['Intangible', 'Goodwill', 'Other Assets', 'Long-term'],
  fields: [
    {
      field: 'goodwill',
      sourceLabels: [
        'Goodwill',
        'Goodwill, Net',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'intangible_assets_gross',
      sourceLabels: [
        'Intangible Assets',
        'Intangibles',
        'Patents',
        'Trademarks',
        'Copyrights',
        'Customer Lists',
        'Non-compete Agreements',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'accumulated_amortization',
      sourceLabels: [
        'Accumulated Amortization',
        'Less: Accumulated Amortization',
        'Accum. Amortization',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'intangible_assets_net',
      sourceLabels: [
        'Net Intangible Assets',
        'Intangible Assets, Net',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'investments',
      sourceLabels: [
        'Investments',
        'Long-term Investments',
        'Investment in Subsidiaries',
        'Marketable Securities',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'notes_receivable_long_term',
      sourceLabels: [
        'Long-term Notes Receivable',
        'Notes Receivable - Long-term',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'deposits',
      sourceLabels: [
        'Deposits',
        'Security Deposits',
        'Rental Deposits',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'deferred_tax_asset',
      sourceLabels: [
        'Deferred Tax Asset',
        'Deferred Taxes',
        'DTA',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'other_long_term_assets',
      sourceLabels: [
        'Other Long-term Assets',
        'Other Assets',
        'Miscellaneous Assets',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'total_other_assets',
      sourceLabels: [
        'Total Other Assets',
        'Other Assets Total',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'total_assets',
      sourceLabels: [
        'Total Assets',
        'Assets Total',
        'TOTAL ASSETS',
      ],
      required: true,
    },
  ],
};

/**
 * Balance Sheet Current Liabilities Section
 * Obligations due within one year
 */
const CURRENT_LIABILITIES_SECTION: SectionMapping = {
  name: 'current_liabilities',
  description: 'Balance Sheet Current Liabilities',
  identifyingKeywords: ['Current Liabilities', 'Accounts Payable', 'Short-term', 'Accrued'],
  fields: [
    {
      field: 'accounts_payable',
      sourceLabels: [
        'Accounts Payable',
        'A/P',
        'Trade Payables',
        'Trade Accounts Payable',
        'Payables',
        'Vendor Payables',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'accrued_expenses',
      sourceLabels: [
        'Accrued Expenses',
        'Accrued Liabilities',
        'Accruals',
        'Accrued Payroll',
        'Accrued Wages',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'accrued_payroll',
      sourceLabels: [
        'Accrued Payroll',
        'Accrued Wages',
        'Wages Payable',
        'Salaries Payable',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'accrued_taxes',
      sourceLabels: [
        'Accrued Taxes',
        'Taxes Payable',
        'Income Taxes Payable',
        'Sales Tax Payable',
        'Payroll Taxes Payable',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'short_term_debt',
      sourceLabels: [
        'Short-term Debt',
        'Notes Payable',
        'Current Portion of Long-term Debt',
        'Line of Credit',
        'Credit Line',
        'Bank Line',
        'Short-term Notes Payable',
        'Current Notes Payable',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'deferred_revenue',
      sourceLabels: [
        'Deferred Revenue',
        'Unearned Revenue',
        'Customer Deposits',
        'Prepaid Revenue',
        'Contract Liabilities',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'loans_from_shareholders_current',
      sourceLabels: [
        'Loans from Shareholders',
        'Due to Shareholders',
        'Shareholder Loans Payable',
        'Loans from Officers',
        'Due to Officers',
        'Due to Related Parties',
        'Loans from Partners',
        'Due to Partners',
        'Loans from Members',
        'Due to Members',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Related party debt - review for arm\'s length terms',
    },
    {
      field: 'other_current_liabilities',
      sourceLabels: [
        'Other Current Liabilities',
        'Other Liabilities',
        'Miscellaneous Current Liabilities',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'total_current_liabilities',
      sourceLabels: [
        'Total Current Liabilities',
        'Current Liabilities Total',
      ],
      required: true,
    },
  ],
};

/**
 * Balance Sheet Long-term Liabilities Section
 * Obligations due beyond one year
 */
const LONG_TERM_LIABILITIES_SECTION: SectionMapping = {
  name: 'long_term_liabilities',
  description: 'Balance Sheet Long-term Liabilities',
  identifyingKeywords: ['Long-term', 'Mortgage', 'Notes Payable', 'Term Loan'],
  fields: [
    {
      field: 'long_term_debt',
      sourceLabels: [
        'Long-term Debt',
        'Long-term Notes Payable',
        'Bank Loans - Long-term',
        'Term Loan',
        'SBA Loan',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'mortgage_payable',
      sourceLabels: [
        'Mortgage Payable',
        'Mortgage',
        'Real Estate Mortgage',
        'Building Mortgage',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'equipment_notes',
      sourceLabels: [
        'Equipment Notes',
        'Equipment Loans',
        'Vehicle Loans',
        'Auto Loans',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'capital_lease_obligations',
      sourceLabels: [
        'Capital Lease Obligations',
        'Finance Lease Liabilities',
        'Lease Obligations',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'loans_from_shareholders_long_term',
      sourceLabels: [
        'Long-term Loans from Shareholders',
        'Shareholder Notes - Long-term',
        'Related Party Debt - Long-term',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Related party debt - may be subordinated or forgiven in sale',
    },
    {
      field: 'deferred_tax_liability',
      sourceLabels: [
        'Deferred Tax Liability',
        'Deferred Taxes - Long-term',
        'DTL',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'other_long_term_liabilities',
      sourceLabels: [
        'Other Long-term Liabilities',
        'Other Liabilities - Long-term',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'total_long_term_liabilities',
      sourceLabels: [
        'Total Long-term Liabilities',
        'Long-term Liabilities Total',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'total_liabilities',
      sourceLabels: [
        'Total Liabilities',
        'Liabilities Total',
        'TOTAL LIABILITIES',
      ],
      required: true,
    },
  ],
};

/**
 * Balance Sheet Equity Section
 * Shareholders'/Owners' equity components
 */
const EQUITY_SECTION: SectionMapping = {
  name: 'equity',
  description: 'Balance Sheet Shareholders\' Equity',
  identifyingKeywords: ['Equity', 'Capital', 'Retained Earnings', 'Stock'],
  fields: [
    {
      field: 'common_stock',
      sourceLabels: [
        'Common Stock',
        'Capital Stock',
        'Issued Stock',
        'Stated Capital',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'preferred_stock',
      sourceLabels: [
        'Preferred Stock',
        'Preference Stock',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'additional_paid_in_capital',
      sourceLabels: [
        'Additional Paid-in Capital',
        'APIC',
        'Paid-in Capital',
        'Capital Surplus',
        'Capital in Excess of Par',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'members_capital',
      sourceLabels: [
        'Members\' Capital',
        'Member Capital',
        'LLC Capital',
        'Members\' Equity',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'partners_capital',
      sourceLabels: [
        'Partners\' Capital',
        'Partner Capital',
        'Partnership Capital',
        'Partners\' Equity',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'retained_earnings',
      sourceLabels: [
        'Retained Earnings',
        'Accumulated Earnings',
        'Retained Profits',
        'Accumulated Deficit',
        'Accumulated Surplus',
        'Undistributed Earnings',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'RED FLAG if negative - indicates accumulated losses',
    },
    {
      field: 'current_year_earnings',
      sourceLabels: [
        'Current Year Earnings',
        'Net Income',
        'Year-to-Date Earnings',
        'Current Period Earnings',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'treasury_stock',
      sourceLabels: [
        'Treasury Stock',
        'Treasury Shares',
        'Less: Treasury Stock',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'distributions',
      sourceLabels: [
        'Distributions',
        'Shareholder Distributions',
        'Dividends',
        'Owner Draws',
        'Member Distributions',
        'Partner Distributions',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'other_comprehensive_income',
      sourceLabels: [
        'Other Comprehensive Income',
        'OCI',
        'Accumulated OCI',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'total_equity',
      sourceLabels: [
        'Total Equity',
        'Total Shareholders\' Equity',
        'Total Stockholders\' Equity',
        'Total Members\' Equity',
        'Total Partners\' Capital',
        'Net Worth',
        'Equity Total',
        'TOTAL EQUITY',
      ],
      required: true,
    },
    {
      field: 'total_liabilities_equity',
      sourceLabels: [
        'Total Liabilities and Equity',
        'Total Liabilities & Equity',
        'Total Liabilities and Shareholders\' Equity',
        'Total Liabilities and Net Worth',
        'TOTAL LIABILITIES AND EQUITY',
      ],
      required: true,
    },
  ],
};

/**
 * Complete Balance Sheet mapping configuration
 *
 * Note: Balance sheets typically have BOY and EOY columns.
 * The schema-mapper should detect column headers like:
 * - "Beginning", "End", "Prior Year", "Current Year"
 * - Date ranges like "12/31/2023", "12/31/2024"
 * And map values to the appropriate period in BalanceSheetData.
 *
 * Key validations:
 * - Assets = Liabilities + Equity (within 1% tolerance)
 * - Loans to shareholders > 0 = RED FLAG
 * - Negative retained earnings = RED FLAG
 */
export const BALANCE_SHEET_MAPPING: DocumentMapping = {
  documentType: 'BALANCE_SHEET',
  formNumber: 'BS',
  description: 'Balance Sheet / Statement of Financial Position',
  sections: [
    CURRENT_ASSETS_SECTION,
    FIXED_ASSETS_SECTION,
    OTHER_ASSETS_SECTION,
    CURRENT_LIABILITIES_SECTION,
    LONG_TERM_LIABILITIES_SECTION,
    EQUITY_SECTION,
  ],
};
