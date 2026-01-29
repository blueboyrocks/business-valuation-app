/**
 * Form 1125-A Schema Mapping (COGS Detail)
 * PRD-H: Robust PDF Extraction Pipeline
 *
 * Maps extracted table data from Form 1125-A (Cost of Goods Sold).
 * This form provides detailed COGS breakdown required for tax returns.
 *
 * Key purpose:
 * - Verify COGS calculation accuracy
 * - Identify inventory valuation methods
 * - Critical for manufacturing/retail/wholesale businesses
 */

import { FinancialDocumentType } from '../types';
import { FieldMapping, SectionMapping, DocumentMapping } from './form-1120s';

/**
 * Form 1125-A Inventory Method Section (Lines 1-3)
 * Identifies how inventory is valued
 */
const INVENTORY_METHOD_SECTION: SectionMapping = {
  name: 'inventory_method',
  description: 'Form 1125-A Inventory Method (Lines 1-3)',
  identifyingKeywords: ['Inventory at beginning', 'Inventory at end', 'Cost', 'Lower of cost or market'],
  fields: [
    {
      field: 'inventory_beginning',
      sourceLabels: [
        'Inventory at beginning of year',
        'Beginning inventory',
        '1 Inventory beginning',
        'Line 1',
        'Opening inventory',
      ],
      required: true,
    },
    {
      field: 'inventory_ending',
      sourceLabels: [
        'Inventory at end of year',
        'Ending inventory',
        '7 Inventory end',
        'Line 7',
        'Closing inventory',
      ],
      required: true,
    },
    {
      field: 'inventory_method',
      sourceLabels: [
        'Method of inventory',
        'Inventory method',
        'Valuation method',
        '9 Method',
        'Line 9',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Check for LIFO - may affect comparability with industry averages',
    },
  ],
};

/**
 * Form 1125-A Purchases and Costs Section (Lines 2-5)
 * Direct costs that go into COGS
 */
const PURCHASES_COSTS_SECTION: SectionMapping = {
  name: 'purchases_costs',
  description: 'Form 1125-A Purchases and Costs (Lines 2-5)',
  identifyingKeywords: ['Purchases', 'Cost of labor', 'Additional section 263A', 'Other costs'],
  fields: [
    {
      field: 'purchases',
      sourceLabels: [
        'Purchases',
        '2 Purchases',
        'Line 2',
        'Material purchases',
        'Merchandise purchased',
        'Inventory purchases',
      ],
      required: true,
    },
    {
      field: 'cost_of_labor',
      sourceLabels: [
        'Cost of labor',
        '3 Cost of labor',
        'Line 3',
        'Direct labor',
        'Production labor',
        'Manufacturing labor',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'section_263a_costs',
      sourceLabels: [
        'Additional section 263A costs',
        '4 Section 263A',
        'Line 4',
        'Uniform capitalization',
        'UNICAP',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'Capitalized overhead costs - may affect cash flow timing',
    },
    {
      field: 'other_costs',
      sourceLabels: [
        'Other costs',
        '5 Other costs',
        'Line 5',
        'Additional costs',
        'Miscellaneous costs',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'total_costs',
      sourceLabels: [
        'Total',
        '6 Total',
        'Line 6',
        'Add lines 1 through 5',
        'Total costs',
      ],
      required: false,
      defaultValue: 0,
    },
  ],
};

/**
 * Form 1125-A COGS Calculation Section (Lines 6-8)
 * Final COGS calculation
 */
const COGS_CALCULATION_SECTION: SectionMapping = {
  name: 'cogs_calculation',
  description: 'Form 1125-A COGS Calculation (Lines 6-8)',
  identifyingKeywords: ['Cost of goods sold', 'Subtract line 7', 'Total'],
  fields: [
    {
      field: 'costs_before_ending_inventory',
      sourceLabels: [
        'Total',
        '6 Total costs',
        'Line 6',
        'Costs available for sale',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'cost_of_goods_sold',
      sourceLabels: [
        'Cost of goods sold',
        '8 Cost of goods sold',
        'Line 8',
        'COGS',
        'Subtract line 7 from line 6',
      ],
      required: true,
      sdeNote: 'Should match Line 2 on Form 1120/1120-S or Line 4 on Schedule C',
    },
  ],
};

/**
 * Form 1125-A Inventory Identification Section (Line 9)
 * How specific items in inventory are identified
 */
const INVENTORY_IDENTIFICATION_SECTION: SectionMapping = {
  name: 'inventory_identification',
  description: 'Form 1125-A Inventory Identification (Line 9)',
  identifyingKeywords: ['FIFO', 'LIFO', 'Specific identification', 'Average cost'],
  fields: [
    {
      field: 'identification_method',
      sourceLabels: [
        'Check the method(s) used',
        '9a Method',
        'Line 9a',
        'Cost method',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'using_fifo',
      sourceLabels: [
        'FIFO',
        'First-in, first-out',
        '9a(i) FIFO',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'using_lifo',
      sourceLabels: [
        'LIFO',
        'Last-in, first-out',
        '9a(ii) LIFO',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'LIFO may result in lower taxable income - affects comparability',
    },
    {
      field: 'using_specific_identification',
      sourceLabels: [
        'Specific identification',
        '9a(iii) Specific',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'using_other_method',
      sourceLabels: [
        'Other (attach explanation)',
        '9a(iv) Other',
        'Average cost',
        'Weighted average',
      ],
      required: false,
      defaultValue: 0,
    },
  ],
};

/**
 * Form 1125-A Valuation Method Section (Line 9b)
 * How inventory value is determined
 */
const VALUATION_METHOD_SECTION: SectionMapping = {
  name: 'valuation_method',
  description: 'Form 1125-A Valuation Method (Line 9b)',
  identifyingKeywords: ['Lower of cost or market', 'Cost', 'Writedown'],
  fields: [
    {
      field: 'valuation_at_cost',
      sourceLabels: [
        'Cost',
        '9b(i) Cost',
        'At cost',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'valuation_lower_cost_market',
      sourceLabels: [
        'Lower of cost or market',
        '9b(ii) Lower',
        'LCM',
        'Lower of cost or net realizable value',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'valuation_other',
      sourceLabels: [
        'Other (attach explanation)',
        '9b(iii) Other',
        'Writedown',
      ],
      required: false,
      defaultValue: 0,
    },
  ],
};

/**
 * Form 1125-A LIFO-Specific Section (Lines 9c-9f)
 * Only applicable if LIFO is used
 */
const LIFO_SECTION: SectionMapping = {
  name: 'lifo_details',
  description: 'Form 1125-A LIFO Details (Lines 9c-9f)',
  identifyingKeywords: ['LIFO', 'LIFO reserve', 'LIFO recapture'],
  fields: [
    {
      field: 'lifo_adopted_year',
      sourceLabels: [
        'Was there any change in determining quantities',
        '9c LIFO adoption',
        'Line 9c',
        'Year LIFO adopted',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'lifo_reserve_beginning',
      sourceLabels: [
        'LIFO reserve at beginning',
        'Beginning LIFO reserve',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'lifo_reserve_ending',
      sourceLabels: [
        'LIFO reserve at end',
        'Ending LIFO reserve',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'section_263a_amount',
      sourceLabels: [
        'Section 263A costs',
        '9e Section 263A',
        'Line 9e',
        'Capitalized costs',
      ],
      required: false,
      defaultValue: 0,
    },
    {
      field: 'lifo_recapture_amount',
      sourceLabels: [
        'LIFO recapture',
        '9f LIFO recapture',
        'Line 9f',
      ],
      required: false,
      defaultValue: 0,
      sdeNote: 'May be triggered by S-Corp election - non-recurring item',
    },
  ],
};

/**
 * Complete Form 1125-A mapping configuration
 *
 * Validation rules:
 * 1. COGS = Beginning Inventory + Purchases + Labor + Other - Ending Inventory
 * 2. COGS should match Line 2 on tax return
 * 3. Inventory method consistency year-over-year
 *
 * SDE considerations:
 * - LIFO vs FIFO can significantly affect reported COGS
 * - Section 263A costs may defer deductions
 * - Inventory writedowns may be discretionary/non-recurring
 */
export const FORM_1125A_MAPPING: DocumentMapping = {
  documentType: 'FORM_1125A',
  formNumber: '1125-A',
  description: 'Cost of Goods Sold',
  sections: [
    INVENTORY_METHOD_SECTION,
    PURCHASES_COSTS_SECTION,
    COGS_CALCULATION_SECTION,
    INVENTORY_IDENTIFICATION_SECTION,
    VALUATION_METHOD_SECTION,
    LIFO_SECTION,
  ],
};
