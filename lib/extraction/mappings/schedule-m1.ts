/**
 * Schedule M-1 Schema Mapping
 * PRD-H: Robust PDF Extraction Pipeline
 *
 * Maps extracted table data from Schedule M-1 (Book-Tax Reconciliation).
 * Schedule M-1 reconciles net income per books with income per return.
 *
 * Key purpose:
 * - Identify book-tax differences that may indicate unreported items
 * - Significant differences (>5% variance) should trigger warnings
 * - Helps validate the accuracy of extracted financial data
 */

import { FinancialDocumentType } from '../types';
import { FieldMapping, SectionMapping, DocumentMapping } from './form-1120s';

/**
 * Schedule M-1 Additions Section (Lines 1-4)
 * Items that increase taxable income relative to book income
 */
const ADDITIONS_SECTION: SectionMapping = {
  name: 'additions',
  description: 'Schedule M-1 Additions (Lines 1-4)',
  identifyingKeywords: ['Net income per books', 'Federal income tax', 'Meals and entertainment', 'Travel and entertainment'],
  fields: [
    {
      field: 'net_income_per_books',
      sourceLabels: [
        'Net income (loss) per books',
        'Net income per books',
        '1 Net income per books',
        'Line 1',
        'Book income',
        'Net income - books',
      ],
      required: true,
      sdeNote: 'Starting point for reconciliation - should approximate ordinary business income',
    },
    {
      field: 'federal_income_tax',
      sourceLabels: [
        'Federal income tax per books',
        'Federal income tax',
        '2 Federal income tax',
        'Line 2',
        'Income tax expense - books',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Book tax expense - add back for pre-tax analysis',
    },
    {
      field: 'excess_capital_losses',
      sourceLabels: [
        'Excess of capital losses over capital gains',
        'Capital losses over gains',
        '3 Excess capital losses',
        'Line 3',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'income_not_on_books',
      sourceLabels: [
        'Income subject to tax not recorded on books',
        'Income not on books',
        '4 Income not on books',
        'Line 4',
        'Taxable income not in books',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'May indicate unreported income - investigate source',
    },
    {
      field: 'expenses_on_books_not_deductible',
      sourceLabels: [
        'Expenses recorded on books this year not deducted',
        'Expenses not deductible',
        '5 Expenses not deducted',
        'Line 5',
        'Non-deductible expenses',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'travel_entertainment_50',
      sourceLabels: [
        'Travel and entertainment',
        '5a Travel and entertainment',
        'Line 5a',
        'T&E',
        '50% meals and entertainment',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Reflects 50% non-deductible portion - total M&E may be higher',
    },
    {
      field: 'depreciation_difference',
      sourceLabels: [
        'Depreciation',
        '5b Depreciation',
        'Line 5b',
        'Book vs tax depreciation',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Book/tax depreciation difference - useful for understanding true D&A',
    },
    {
      field: 'charitable_contributions_carryover',
      sourceLabels: [
        'Charitable contributions',
        '5c Charitable contributions',
        'Line 5c',
        'Contributions carryover',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'other_additions',
      sourceLabels: [
        'Other',
        '5d Other',
        'Line 5d',
        'Other additions',
        'Other non-deductible',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'total_additions',
      sourceLabels: [
        'Add lines 1 through 5',
        'Total lines 1-5',
        '6 Total',
        'Line 6',
        'Total additions',
      ],
      required: false,
      defaultValue: 0,
    },
  ],
};

/**
 * Schedule M-1 Subtractions Section (Lines 7-8)
 * Items that decrease taxable income relative to book income
 */
const SUBTRACTIONS_SECTION: SectionMapping = {
  name: 'subtractions',
  description: 'Schedule M-1 Subtractions (Lines 7-8)',
  identifyingKeywords: ['Income recorded on books', 'Deductions not charged', 'Schedule K'],
  fields: [
    {
      field: 'income_on_books_not_taxed',
      sourceLabels: [
        'Income recorded on books not included on Schedule K',
        'Income on books not taxed',
        '7 Income on books not on Schedule K',
        'Line 7',
        'Tax-exempt income',
        'Non-taxable book income',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'May include PPP loan forgiveness - review for COVID adjustments',
    },
    {
      field: 'tax_exempt_interest',
      sourceLabels: [
        'Tax-exempt interest',
        '7a Tax-exempt interest',
        'Line 7a',
        'Municipal bond interest',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'other_income_on_books_not_taxed',
      sourceLabels: [
        'Other',
        '7b Other',
        'Line 7b',
        'Other tax-exempt income',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'deductions_not_on_books',
      sourceLabels: [
        'Deductions on this return not charged against book income',
        'Deductions not on books',
        '8 Deductions not charged to books',
        'Line 8',
        'Tax deductions not in books',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'depreciation_tax_over_book',
      sourceLabels: [
        'Depreciation',
        '8a Depreciation',
        'Line 8a',
        'Tax depreciation over book',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Accelerated depreciation difference - may indicate Section 179 or bonus depreciation',
    },
    {
      field: 'charitable_contributions_deducted',
      sourceLabels: [
        'Charitable contributions',
        '8b Charitable contributions',
        'Line 8b',
        'Contributions deducted',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'other_subtractions',
      sourceLabels: [
        'Other',
        '8c Other',
        'Line 8c',
        'Other subtractions',
        'Other deductions',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'total_subtractions',
      sourceLabels: [
        'Add lines 7 and 8',
        'Total lines 7-8',
        'Total subtractions',
      ],
      required: false,
      defaultValue: 0,
    },
  ],
};

/**
 * Schedule M-1 Final Reconciliation (Line 9)
 * This should equal income per Schedule K
 */
const RECONCILIATION_SECTION: SectionMapping = {
  name: 'reconciliation',
  description: 'Schedule M-1 Final Reconciliation (Line 9)',
  identifyingKeywords: ['Income (loss) per return', 'Analysis of Net Income', 'Schedule K'],
  fields: [
    {
      field: 'income_per_return',
      sourceLabels: [
        'Income (loss) per return',
        'Income per return',
        '9 Income per return',
        'Line 9',
        'Taxable income',
        'Income per Schedule K',
        'Schedule K income',
      ],
      required: true,
      sdeNote: 'Should match ordinary business income on Schedule K Line 1',
    },
    {
      field: 'book_tax_difference',
      sourceLabels: [
        'Book-tax difference',
        'Difference',
        'Total difference',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Large differences (>5% of revenue) warrant investigation',
    },
  ],
};

/**
 * Schedule M-1 Analysis of Net Income (for C-Corps)
 * C-Corps have a more detailed M-1 analysis
 */
const ANALYSIS_SECTION: SectionMapping = {
  name: 'analysis',
  description: 'Schedule M-1 Net Income Analysis (C-Corp)',
  identifyingKeywords: ['Analysis of unappropriated', 'Retained earnings'],
  fields: [
    {
      field: 'retained_earnings_beginning',
      sourceLabels: [
        'Balance at beginning of year',
        'Beginning retained earnings',
        'RE beginning',
        '1 Balance beginning',
        'Line 1',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'net_income_per_books_analysis',
      sourceLabels: [
        'Net income (loss) per books',
        '2 Net income per books',
        'Line 2',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'other_increases',
      sourceLabels: [
        'Other increases',
        '3 Other increases',
        'Line 3',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'dividends_cash',
      sourceLabels: [
        'Cash',
        '5a Cash dividends',
        'Line 5a',
        'Cash distributions',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'dividends_stock',
      sourceLabels: [
        'Stock',
        '5b Stock dividends',
        'Line 5b',
        'Stock distributions',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'dividends_property',
      sourceLabels: [
        'Property',
        '5c Property dividends',
        'Line 5c',
        'Property distributions',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'other_decreases',
      sourceLabels: [
        'Other decreases',
        '6 Other decreases',
        'Line 6',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'retained_earnings_ending',
      sourceLabels: [
        'Balance at end of year',
        'Ending retained earnings',
        'RE ending',
        '7 Balance end',
        'Line 7',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Should match Schedule L retained earnings EOY',
    },
  ],
};

/**
 * Complete Schedule M-1 mapping configuration
 *
 * Key validation rules:
 * 1. Line 6 (total additions) - Line 7-8 (total subtractions) should = Line 9 (income per return)
 * 2. Line 9 should approximately match Schedule K Line 1 (ordinary business income)
 * 3. Significant book-tax differences (>5% of revenue) should generate warnings
 *
 * Common book-tax differences:
 * - Depreciation (Section 179, bonus, MACRS vs straight-line)
 * - Meals and entertainment (50% limitation)
 * - State taxes (SALT limitations)
 * - Officer life insurance premiums
 */
export const SCHEDULE_M1_MAPPING: DocumentMapping = {
  documentType: 'SCHEDULE_M1', // Using specific type for standalone M-1 docs
  formNumber: 'Schedule M-1',
  description: 'Reconciliation of Income (Loss) per Books With Income (Loss) per Return',
  sections: [
    ADDITIONS_SECTION,
    SUBTRACTIONS_SECTION,
    RECONCILIATION_SECTION,
    ANALYSIS_SECTION,
  ],
};
