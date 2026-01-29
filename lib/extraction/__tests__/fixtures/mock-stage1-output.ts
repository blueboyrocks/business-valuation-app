/**
 * Mock Stage1Output fixtures for testing
 *
 * These fixtures simulate pdfplumber extraction output
 * for various document types.
 */

import { Stage1Output, PageTextRegions } from '../../types';

/**
 * Create mock PageTextRegions
 */
function createPageTextRegions(header: string, body: string): PageTextRegions {
  return {
    header,
    body_left: body,
    body_right: '',
    footer: '',
    full_text: header + '\n' + body,
  };
}

/**
 * Mock Form 1120-S (S-Corporation) Stage1Output
 */
export const mockForm1120SStage1Output: Stage1Output = {
  document_id: 'test-1120s-001',
  filename: 'form1120s-2023.pdf',
  extraction_timestamp: '2024-01-15T10:00:00Z',
  raw_text: `
Form 1120-S
Form 1120-S
U.S. Income Tax Return for an S Corporation
U.S. Income Tax Return for an S Corporation
S Corporation Tax Return
Tax Year 2023

Name of corporation: ABC Company LLC
EIN: 12-3456789

Income
1a Gross receipts or sales............... 1,500,000
1b Returns and allowances................. 25,000
1c Balance................................ 1,475,000
2 Cost of goods sold...................... 750,000
3 Gross profit (subtract line 2 from 1c). 725,000
4 Net gain (loss) from Form 4797......... 0
5 Other income........................... 15,000
6 Total income........................... 740,000

Deductions
7 Compensation of officers............... 150,000
8 Salaries and wages..................... 200,000
9 Repairs and maintenance................ 25,000
10 Bad debts.............................. 5,000
11 Rents.................................. 48,000
12 Taxes and licenses..................... 35,000
13 Interest............................... 12,000
14 Depreciation........................... 45,000
15 Depletion.............................. 0
16 Advertising............................ 15,000
17 Pension, profit-sharing, etc........... 20,000
18 Employee benefit programs.............. 18,000
19 Other deductions....................... 32,000
20 Total deductions....................... 605,000
21 Ordinary business income (loss)........ 135,000

Schedule K - Shareholders' Pro Rata Share Items (Form 1120-S)
1 Ordinary business income (loss)........ 135,000
12a Section 179 deduction.................. 25,000
16a Cash distributions..................... 100,000
  `,
  tables: [
    {
      page_number: 1,
      table_index: 0,
      headers: ['Line', 'Description', 'Amount'],
      rows: [
        ['1a', 'Gross receipts or sales', '1,500,000'],
        ['1b', 'Returns and allowances', '25,000'],
        ['2', 'Cost of goods sold', '750,000'],
        ['3', 'Gross profit', '725,000'],
        ['6', 'Total income', '740,000'],
      ],
      row_count: 5,
      column_count: 3,
    },
    {
      page_number: 2,
      table_index: 0,
      headers: ['Line', 'Description', 'Amount'],
      rows: [
        ['7', 'Compensation of officers', '150,000'],
        ['8', 'Salaries and wages', '200,000'],
        ['11', 'Rents', '48,000'],
        ['13', 'Interest', '12,000'],
        ['14', 'Depreciation', '45,000'],
        ['20', 'Total deductions', '605,000'],
        ['21', 'Ordinary business income', '135,000'],
      ],
      row_count: 7,
      column_count: 3,
    },
  ],
  text_by_region: {
    '1': createPageTextRegions('Form 1120-S U.S. Income Tax Return for an S Corporation', 'ABC Company LLC EIN: 12-3456789 Tax Year 2023'),
  },
  metadata: {
    page_count: 4,
    is_scanned: false,
    extraction_method: 'pdfplumber',
    processing_time_ms: 1500,
  },
};

/**
 * Mock Form 1065 (Partnership) Stage1Output
 */
export const mockForm1065Stage1Output: Stage1Output = {
  document_id: 'test-1065-001',
  filename: 'form1065-2023.pdf',
  extraction_timestamp: '2024-01-15T10:00:00Z',
  raw_text: `
Form 1065
U.S. Return of Partnership Income
Tax Year 2023

Name of partnership: XYZ Partners LP
EIN: 98-7654321

Income
1a Gross receipts or sales............... 2,000,000
2 Cost of goods sold...................... 1,000,000
3 Gross profit............................ 1,000,000
4 Ordinary income......................... 0
5 Net farm profit......................... 0
6 Net gain (loss) from Form 4797......... 10,000
7 Other income............................ 5,000
8 Total income............................ 1,015,000

Deductions
9 Salaries and wages...................... 300,000
10 Guaranteed payments to partners........ 200,000
11 Repairs and maintenance................ 30,000
12 Bad debts.............................. 10,000
13 Rent................................... 60,000
14 Taxes and licenses..................... 40,000
15 Interest............................... 20,000
16a Depreciation.......................... 50,000
20 Other deductions....................... 55,000
21 Total deductions....................... 765,000
22 Ordinary business income (loss)........ 250,000

Schedule K
1 Ordinary business income (loss)........ 250,000
4a Guaranteed payments for services...... 200,000
12a Section 179 deduction................ 15,000
19a Cash distributions................... 180,000
  `,
  tables: [
    {
      page_number: 1,
      table_index: 0,
      headers: ['Line', 'Description', 'Amount'],
      rows: [
        ['1a', 'Gross receipts or sales', '2,000,000'],
        ['2', 'Cost of goods sold', '1,000,000'],
        ['3', 'Gross profit', '1,000,000'],
        ['8', 'Total income', '1,015,000'],
      ],
      row_count: 4,
      column_count: 3,
    },
  ],
  text_by_region: {
    '1': createPageTextRegions('Form 1065 U.S. Return of Partnership Income', 'XYZ Partners LP EIN: 98-7654321 Tax Year 2023'),
  },
  metadata: {
    page_count: 3,
    is_scanned: false,
    extraction_method: 'pdfplumber',
    processing_time_ms: 1200,
  },
};

/**
 * Mock Schedule C (Sole Proprietorship) Stage1Output
 */
export const mockScheduleCStage1Output: Stage1Output = {
  document_id: 'test-schedule-c-001',
  filename: 'schedule-c-2023.pdf',
  extraction_timestamp: '2024-01-15T10:00:00Z',
  raw_text: `
Schedule C
Profit or Loss From Business
(Sole Proprietorship)
Tax Year 2023

Name of proprietor: John Smith
Business name: Smith Consulting

Part I. Income
1 Gross receipts or sales............... 350,000
2 Returns and allowances................. 5,000
3 Subtract line 2 from line 1........... 345,000
4 Cost of goods sold..................... 50,000
5 Gross profit........................... 295,000
6 Other income........................... 2,000
7 Gross income........................... 297,000

Part II. Expenses
8 Advertising............................ 8,000
9 Car and truck expenses................. 12,000
11 Contract labor......................... 25,000
13 Depreciation........................... 15,000
17 Legal and professional services....... 10,000
18 Office expense......................... 5,000
20a Rent - vehicles, machinery, equipment. 3,000
20b Rent - other business property....... 18,000
24a Travel................................ 8,000
24b Meals................................ 6,000
25 Utilities.............................. 4,000
27a Other expenses....................... 10,000
28 Total expenses......................... 124,000
29 Tentative profit....................... 173,000
30 Expenses for home office.............. 8,000
31 Net profit............................. 165,000
  `,
  tables: [],
  text_by_region: {
    '1': createPageTextRegions('Schedule C Profit or Loss From Business', 'John Smith Smith Consulting Tax Year 2023'),
  },
  metadata: {
    page_count: 2,
    is_scanned: false,
    extraction_method: 'pdfplumber',
    processing_time_ms: 800,
  },
};

/**
 * Mock P&L (Income Statement) Stage1Output
 */
export const mockIncomeStatementStage1Output: Stage1Output = {
  document_id: 'test-pl-001',
  filename: 'income-statement-2023.pdf',
  extraction_timestamp: '2024-01-15T10:00:00Z',
  raw_text: `
ABC Company LLC
Income Statement
For the Year Ended December 31, 2023

Revenue
  Gross Revenue...................... 1,200,000
  Less: Returns & Allowances......... (20,000)
  Net Revenue....................... 1,180,000

Cost of Goods Sold
  Beginning Inventory................ 100,000
  Purchases.......................... 500,000
  Ending Inventory................... (120,000)
  Cost of Goods Sold................ 480,000

Gross Profit........................ 700,000

Operating Expenses
  Owner Salary....................... 120,000
  Employee Wages..................... 180,000
  Rent............................... 48,000
  Utilities.......................... 12,000
  Insurance.......................... 24,000
  Depreciation....................... 30,000
  Office Supplies.................... 8,000
  Professional Fees.................. 15,000
  Advertising........................ 20,000
  Travel............................. 10,000
  Meals & Entertainment.............. 8,000
  Other.............................. 25,000
  Total Operating Expenses........... 500,000

Operating Income.................... 200,000
  Interest Expense................... (15,000)
Net Income Before Tax............... 185,000
  Income Tax Expense................. 0
Net Income.......................... 185,000
  `,
  tables: [
    {
      page_number: 1,
      table_index: 0,
      headers: ['Description', 'Amount'],
      rows: [
        ['Gross Revenue', '1,200,000'],
        ['Returns & Allowances', '(20,000)'],
        ['Net Revenue', '1,180,000'],
        ['Cost of Goods Sold', '480,000'],
        ['Gross Profit', '700,000'],
      ],
      row_count: 5,
      column_count: 2,
    },
  ],
  text_by_region: {
    '1': createPageTextRegions('ABC Company LLC Income Statement', 'For the Year Ended December 31, 2023'),
  },
  metadata: {
    page_count: 1,
    is_scanned: false,
    extraction_method: 'pdfplumber',
    processing_time_ms: 600,
  },
};

/**
 * Mock scanned PDF Stage1Output (OCR failed)
 */
export const mockScannedPdfStage1Output: Stage1Output = {
  document_id: 'test-scanned-001',
  filename: 'scanned-doc.pdf',
  extraction_timestamp: '2024-01-15T10:00:00Z',
  raw_text: '', // OCR failed
  tables: [],
  text_by_region: {},
  metadata: {
    page_count: 5,
    is_scanned: true,
    extraction_method: 'ocr',
    processing_time_ms: 3000,
    ocr_confidence: 0.2,
  },
};
