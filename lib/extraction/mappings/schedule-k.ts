/**
 * Schedule K Schema Mapping
 * PRD-H: Robust PDF Extraction Pipeline
 *
 * Maps extracted table data from Schedule K to standard financial schema.
 * Schedule K appears on both Form 1120-S (S-Corp) and Form 1065 (Partnership).
 *
 * Key SDE add-backs from Schedule K:
 * - Section 179 deduction - MUST ADD BACK (accelerated depreciation)
 * - Capital gains - NON-RECURRING add-backs
 * - Distributions - used for cash flow verification
 */

import { FinancialDocumentType } from '../types';
import { FieldMapping, SectionMapping, DocumentMapping } from './form-1120s';

/**
 * Schedule K Income/Loss Section (Lines 1-11)
 * This is where ordinary business income and passthrough items appear
 */
const INCOME_LOSS_SECTION: SectionMapping = {
  name: 'income_loss',
  description: 'Schedule K Income/Loss Section (Lines 1-11)',
  identifyingKeywords: ['Ordinary business income', 'Net rental', 'Interest income', 'Dividends'],
  fields: [
    {
      field: 'ordinary_business_income',
      sourceLabels: [
        'Ordinary business income (loss)',
        'Ordinary business income',
        '1 Ordinary business income',
        'Line 1',
        'Ordinary income (loss)',
      ],
      required: true,
      sdeNote: 'Starting point for SDE calculation - this is net income before owner comp adjustments',
    },
    {
      field: 'net_rental_real_estate',
      sourceLabels: [
        'Net rental real estate income (loss)',
        'Net rental real estate',
        '2 Net rental real estate',
        'Line 2',
        'Rental real estate',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'May be from related party - review for arm\'s length rent',
    },
    {
      field: 'other_rental_income',
      sourceLabels: [
        'Other net rental income (loss)',
        'Other rental income',
        '3 Other rental',
        'Line 3',
        'Other gross rental',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'interest_income',
      sourceLabels: [
        'Interest income',
        '4 Interest income',
        'Line 4',
        '5 Interest income',
        'Line 5',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'ordinary_dividends',
      sourceLabels: [
        'Ordinary dividends',
        '5 Dividends',
        'Line 5',
        '6a Ordinary dividends',
        'Line 6a',
        'Dividends',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'qualified_dividends',
      sourceLabels: [
        'Qualified dividends',
        '5b Qualified dividends',
        '6b Qualified dividends',
        'Line 5b',
        'Line 6b',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'royalties',
      sourceLabels: [
        'Royalties',
        '6 Royalties',
        'Line 6',
        '7 Royalties',
        'Line 7',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'net_short_term_capital_gain',
      sourceLabels: [
        'Net short-term capital gain (loss)',
        'Net short-term capital gain',
        '7 Net short-term',
        '8 Net short-term',
        'Line 7',
        'Line 8',
        'Short-term capital gain',
        'STCG',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'NON-RECURRING - Add back for SDE normalization',
    },
    {
      field: 'net_long_term_capital_gain',
      sourceLabels: [
        'Net long-term capital gain (loss)',
        'Net long-term capital gain',
        '8a Net long-term',
        '9a Net long-term',
        'Line 8a',
        'Line 9a',
        'Long-term capital gain',
        'LTCG',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'NON-RECURRING - Add back for SDE normalization',
    },
    {
      field: 'collectibles_gain',
      sourceLabels: [
        'Collectibles (28%) gain (loss)',
        '8b Collectibles',
        '9b Collectibles',
        'Line 8b',
        'Line 9b',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'NON-RECURRING - Add back for SDE normalization',
    },
    {
      field: 'unrecaptured_section_1250_gain',
      sourceLabels: [
        'Unrecaptured section 1250 gain',
        '8c Unrecaptured',
        '9c Unrecaptured',
        'Line 8c',
        'Line 9c',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'NON-RECURRING - Add back for SDE normalization (depreciation recapture)',
    },
    {
      field: 'net_section_1231_gain',
      sourceLabels: [
        'Net section 1231 gain (loss)',
        'Net section 1231 gain',
        '9 Net section 1231',
        '10 Net section 1231',
        'Line 9',
        'Line 10',
        'Section 1231',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'NON-RECURRING - Add back for SDE normalization (asset sale gains)',
    },
    {
      field: 'other_income_loss',
      sourceLabels: [
        'Other income (loss)',
        '10 Other income',
        '11 Other income',
        'Line 10',
        'Line 11',
      ],
      required: false,
      defaultValue: 0,
    },
  ],
};

/**
 * Schedule K Deductions Section (Lines 12-13)
 * Key: Section 179 deduction MUST be added back for SDE
 */
const DEDUCTIONS_SECTION: SectionMapping = {
  name: 'deductions',
  description: 'Schedule K Deductions Section (Lines 12-13)',
  identifyingKeywords: ['Section 179', 'Charitable contributions', 'Deductions'],
  fields: [
    {
      field: 'section_179_deduction',
      sourceLabels: [
        'Section 179 deduction',
        '11 Section 179',
        '12 Section 179',
        'Line 11',
        'Line 12',
        'Section 179 expense deduction',
        'Sec 179',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'MUST ADD BACK - Accelerated depreciation that must be normalized for SDE calculation',
    },
    {
      field: 'other_deductions',
      sourceLabels: [
        'Other deductions',
        '12 Other deductions',
        '13 Other deductions',
        'Line 12',
        'Line 13',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'charitable_contributions',
      sourceLabels: [
        'Charitable contributions',
        'Charitable cash contributions',
        '12a Charitable',
        '13a Charitable',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Discretionary - often added back for SDE',
    },
    {
      field: 'investment_interest',
      sourceLabels: [
        'Investment interest expense',
        '12b Investment interest',
        '13b Investment interest',
      ],
      required: false,
      defaultValue: 0,
    },
  ],
};

/**
 * Schedule K Self-Employment Section (Lines 14)
 * For partnerships - guaranteed payments are reported here
 */
const SELF_EMPLOYMENT_SECTION: SectionMapping = {
  name: 'self_employment',
  description: 'Schedule K Self-Employment Section (Line 14)',
  identifyingKeywords: ['Guaranteed payments', 'Self-employment'],
  fields: [
    {
      field: 'guaranteed_payments_services',
      sourceLabels: [
        'Guaranteed payments for services',
        '4a Guaranteed payments services',
        'Line 4a',
        'Guaranteed payments - services',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'PRIMARY OWNER COMPENSATION for partnerships - add back for SDE',
    },
    {
      field: 'guaranteed_payments_capital',
      sourceLabels: [
        'Guaranteed payments for capital',
        '4b Guaranteed payments capital',
        'Line 4b',
        'Guaranteed payments - capital',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'guaranteed_payments_total',
      sourceLabels: [
        'Total guaranteed payments',
        '4c Total guaranteed payments',
        'Line 4c',
        'Guaranteed payments total',
        'Total guaranteed',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Total partner compensation - add back for SDE',
    },
    {
      field: 'net_earnings_self_employment',
      sourceLabels: [
        'Net earnings from self-employment',
        '14a Net earnings',
        '14 Self-employment',
        'Line 14a',
        'Self-employment income',
      ],
      required: false,
      defaultValue: 0,
    },
  ],
};

/**
 * Schedule K Credits Section (Lines 15)
 * Tax credits that may indicate special situations
 */
const CREDITS_SECTION: SectionMapping = {
  name: 'credits',
  description: 'Schedule K Credits Section (Line 15)',
  identifyingKeywords: ['Credits', 'Tax credit', 'Low-income housing'],
  fields: [
    {
      field: 'low_income_housing_credit',
      sourceLabels: [
        'Low-income housing credit',
        '15a Low-income housing',
        'Line 15a',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'rehabilitation_credit',
      sourceLabels: [
        'Rehabilitation credit',
        '15b Rehabilitation',
        'Line 15b',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'other_credits',
      sourceLabels: [
        'Other credits',
        '15c Other credits',
        'Line 15c',
      ],
      required: false,
      defaultValue: 0,
    },
  ],
};

/**
 * Schedule K Distributions Section (Lines 16-17)
 * Critical for cash flow verification
 */
const DISTRIBUTIONS_SECTION: SectionMapping = {
  name: 'distributions',
  description: 'Schedule K Distributions Section (Lines 16-17)',
  identifyingKeywords: ['Distributions', 'Cash distributions', 'Property distributions'],
  fields: [
    {
      field: 'cash_distributions',
      sourceLabels: [
        'Cash and marketable securities',
        'Cash distributions',
        '16a Cash distributions',
        '16d Property distributions',
        '19a Cash distributions',
        'Line 16a',
        'Line 16d',
        'Line 19a',
        'Distributions - cash',
        'Shareholder distributions',
        'Partner distributions',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Cash flow indicator - should correlate with net income over time',
    },
    {
      field: 'property_distributions',
      sourceLabels: [
        'Property distributions',
        '16b Property',
        '16e Property',
        '19b Property',
        'Line 16b',
        'Line 16e',
        'Line 19b',
        'Distributions - property',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'total_distributions',
      sourceLabels: [
        'Total distributions',
        'Total property distributions',
        '19 Total distributions',
      ],
      required: false,
      defaultValue: 0,
    },
  ],
};

/**
 * Schedule K Alternative Minimum Tax (AMT) Section (Lines 17)
 * AMT adjustments that may affect SDE calculation
 */
const AMT_SECTION: SectionMapping = {
  name: 'amt',
  description: 'Schedule K AMT Section (Line 17)',
  identifyingKeywords: ['Alternative minimum tax', 'AMT', 'Adjustment'],
  fields: [
    {
      field: 'depreciation_amt_adjustment',
      sourceLabels: [
        'Depreciation adjustment on property',
        '17a Depreciation adjustment',
        '15a Depreciation adjustment',
        'Line 17a',
        'Line 15a',
        'AMT depreciation',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'depletion_amt_adjustment',
      sourceLabels: [
        'Depletion (other than oil & gas)',
        '17c Depletion',
        '15c Depletion',
        'Line 17c',
        'Line 15c',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'oil_gas_deductions',
      sourceLabels: [
        'Oil, gas, & geothermal',
        '17b Oil gas',
        '15b Oil gas',
        'Line 17b',
        'Line 15b',
      ],
      required: false,
      defaultValue: 0,
    },
  ],
};

/**
 * Schedule K Foreign Transactions Section (Lines 18)
 * May indicate international operations
 */
const FOREIGN_TRANSACTIONS_SECTION: SectionMapping = {
  name: 'foreign_transactions',
  description: 'Schedule K Foreign Transactions Section (Line 18)',
  identifyingKeywords: ['Foreign', 'Foreign tax', 'International'],
  fields: [
    {
      field: 'foreign_taxes_paid',
      sourceLabels: [
        'Foreign taxes paid or accrued',
        'Foreign taxes paid',
        '16 Foreign taxes',
        '18 Foreign taxes',
        'Line 16',
        'Line 18',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'foreign_source_income',
      sourceLabels: [
        'Foreign source income',
        'Foreign income',
        '16h Foreign source',
        '18h Foreign source',
      ],
      required: false,
      defaultValue: 0,
    },
  ],
};

/**
 * Complete Schedule K mapping configuration
 *
 * Note: Schedule K appears in both Form 1120-S and Form 1065 with slight variations.
 * Line numbers may differ between forms. This mapping covers both.
 *
 * When processing:
 * 1. Look for Schedule K header or "Shareholders'/Partners' Distributive Share Items"
 * 2. Extract values for all fields
 * 3. Populate schedule_k field in Stage2Output
 */
export const SCHEDULE_K_MAPPING: DocumentMapping = {
  documentType: 'SCHEDULE_K1', // Using K1 type since K is embedded in main forms
  formNumber: 'Schedule K',
  description: 'Shareholders\'/Partners\' Distributive Share Items',
  sections: [
    INCOME_LOSS_SECTION,
    DEDUCTIONS_SECTION,
    SELF_EMPLOYMENT_SECTION,
    CREDITS_SECTION,
    DISTRIBUTIONS_SECTION,
    AMT_SECTION,
    FOREIGN_TRANSACTIONS_SECTION,
  ],
};
