/**
 * Document Type Classifier
 * PRD-H: Robust PDF Extraction Pipeline - Stage 2
 *
 * Classifies financial documents using keyword detection (fast path)
 * and Claude Haiku (for ambiguous cases).
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  FinancialDocumentType,
  Stage1Output,
  DocumentClassification,
} from './types';

// Haiku model for cost-efficient classification
const HAIKU_MODEL = 'claude-3-5-haiku-20241022';

/**
 * Keyword patterns for fast document type detection
 * Each pattern maps to a document type with associated keywords
 */
const DOCUMENT_KEYWORDS: Record<FinancialDocumentType, string[]> = {
  FORM_1120: [
    'Form 1120',
    'U.S. Corporation Income Tax Return',
    'Form1120',
    'Corporate income tax',
  ],
  FORM_1120S: [
    'Form 1120-S',
    'Form 1120S',
    'U.S. Income Tax Return for an S Corporation',
    'S Corporation',
    'Schedule K-1 (Form 1120-S)',
  ],
  FORM_1065: [
    'Form 1065',
    'U.S. Return of Partnership Income',
    'Partnership Return',
    'Schedule K-1 (Form 1065)',
  ],
  SCHEDULE_C: [
    'Schedule C',
    'Profit or Loss From Business',
    'Schedule C (Form 1040)',
    'Sole Proprietorship',
  ],
  SCHEDULE_K1: [
    'Schedule K-1',
    "Partner's Share",
    "Shareholder's Share",
    'Distributive share',
  ],
  INCOME_STATEMENT: [
    'Income Statement',
    'Profit and Loss',
    'P&L Statement',
    'Statement of Operations',
    'Statement of Income',
    'Revenue',
    'Net Income',
    'Gross Profit',
  ],
  BALANCE_SHEET: [
    'Balance Sheet',
    'Statement of Financial Position',
    'Assets',
    'Liabilities',
    'Total Assets',
    'Total Liabilities',
    "Shareholders' Equity",
    "Stockholders' Equity",
  ],
  CASH_FLOW_STATEMENT: [
    'Cash Flow Statement',
    'Statement of Cash Flows',
    'Operating Activities',
    'Investing Activities',
    'Financing Activities',
  ],
  TRIAL_BALANCE: [
    'Trial Balance',
    'General Ledger',
    'Debit',
    'Credit',
    'Account Number',
  ],
  DEPRECIATION_SCHEDULE: [
    'Depreciation Schedule',
    'Fixed Asset Schedule',
    'Form 4562',
    'MACRS',
    'Section 179',
    'Accumulated Depreciation',
  ],
  ACCOUNTS_RECEIVABLE_AGING: [
    'Accounts Receivable Aging',
    'A/R Aging',
    'Customer Aging',
    '0-30 Days',
    '31-60 Days',
    '61-90 Days',
    'Over 90 Days',
  ],
  ACCOUNTS_PAYABLE_AGING: [
    'Accounts Payable Aging',
    'A/P Aging',
    'Vendor Aging',
  ],
  INVENTORY_REPORT: [
    'Inventory Report',
    'Inventory Valuation',
    'Stock Report',
    'FIFO',
    'LIFO',
    'Average Cost',
  ],
  LOAN_AMORTIZATION: [
    'Loan Amortization',
    'Amortization Schedule',
    'Payment Schedule',
    'Principal',
    'Interest Payment',
  ],
  FORM_1125A: [
    'Form 1125-A',
    'Cost of Goods Sold',
    'Beginning Inventory',
    'Ending Inventory',
    'Purchases',
  ],
  BANK_STATEMENT: [
    'Bank Statement',
    'Account Statement',
    'Beginning Balance',
    'Ending Balance',
    'Deposits',
    'Withdrawals',
  ],
  APPRAISAL_REPORT: [
    'Appraisal Report',
    'Fair Market Value',
    'Business Valuation',
    'Appraised Value',
  ],
  LEASE_AGREEMENT: [
    'Lease Agreement',
    'Rental Agreement',
    'Landlord',
    'Tenant',
    'Monthly Rent',
  ],
  UNKNOWN: [],
};

/**
 * Check text for keyword matches
 * Returns match count and matched keywords
 */
function findKeywordMatches(
  text: string,
  keywords: string[]
): { count: number; matched: string[] } {
  const textLower = text.toLowerCase();
  const matched: string[] = [];

  for (const keyword of keywords) {
    if (textLower.includes(keyword.toLowerCase())) {
      matched.push(keyword);
    }
  }

  return { count: matched.length, matched };
}

/**
 * Attempt fast document classification using keywords
 * Returns classification if confident, null if ambiguous
 */
function classifyByKeywords(
  stage1Output: Stage1Output
): DocumentClassification | null {
  const textToSearch = stage1Output.raw_text || '';

  // Collect matches for each document type
  const matches: Array<{
    type: FinancialDocumentType;
    count: number;
    matched: string[];
  }> = [];

  for (const [docType, keywords] of Object.entries(DOCUMENT_KEYWORDS)) {
    if (docType === 'UNKNOWN' || keywords.length === 0) continue;

    const result = findKeywordMatches(textToSearch, keywords);
    if (result.count > 0) {
      matches.push({
        type: docType as FinancialDocumentType,
        count: result.count,
        matched: result.matched,
      });
    }
  }

  // Sort by match count (descending)
  matches.sort((a, b) => b.count - a.count);

  if (matches.length === 0) {
    return null; // No keywords matched, need AI
  }

  const topMatch = matches[0];

  // High confidence: clear winner with 2+ matches
  if (topMatch.count >= 2 && (matches.length === 1 || topMatch.count > matches[1].count * 1.5)) {
    // Extract tax year from text
    const taxYear = extractTaxYear(textToSearch);
    const entityName = extractEntityName(textToSearch);

    return {
      document_type: topMatch.type,
      confidence: 'high',
      indicators: topMatch.matched,
      tax_year: taxYear,
      entity_name: entityName,
    };
  }

  // Medium confidence: single strong match
  if (topMatch.count >= 1 && matches.length <= 2) {
    const taxYear = extractTaxYear(textToSearch);
    const entityName = extractEntityName(textToSearch);

    return {
      document_type: topMatch.type,
      confidence: 'medium',
      indicators: topMatch.matched,
      tax_year: taxYear,
      entity_name: entityName,
    };
  }

  // Ambiguous: need AI assistance
  return null;
}

/**
 * Extract tax year from document text
 */
function extractTaxYear(text: string): string | null {
  // Look for year patterns like "2024", "Tax Year 2024", "FY 2024"
  const patterns = [
    /Tax Year[:\s]+(\d{4})/i,
    /Fiscal Year[:\s]+(\d{4})/i,
    /FY[:\s]+(\d{4})/i,
    /Calendar Year[:\s]+(\d{4})/i,
    /For the year ended[:\s]+.*?(\d{4})/i,
    /Year[:\s]+(\d{4})/i,
    /\b(20[12]\d)\b/, // Years 2010-2029
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const year = parseInt(match[1], 10);
      if (year >= 2015 && year <= 2030) {
        return match[1];
      }
    }
  }

  return null;
}

/**
 * Extract entity name from document text
 */
function extractEntityName(text: string): string | null {
  // Look for common patterns indicating company name
  const patterns = [
    /Name of corporation[:\s]+(.+?)(?:\n|$)/i,
    /Name of partnership[:\s]+(.+?)(?:\n|$)/i,
    /Business name[:\s]+(.+?)(?:\n|$)/i,
    /Company[:\s]+(.+?)(?:\n|$)/i,
    /Entity[:\s]+(.+?)(?:\n|$)/i,
    /^(.+?(?:LLC|Inc|Corp|Corporation|Company|Co\.|LP|LLP))[\s,]/im,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim().slice(0, 100); // Limit length
      if (name.length >= 2 && name.length <= 100) {
        return name;
      }
    }
  }

  return null;
}

/**
 * Classify document using Claude Haiku
 */
async function classifyWithHaiku(
  stage1Output: Stage1Output
): Promise<DocumentClassification> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Prepare context for Haiku
  const rawText = stage1Output.raw_text.slice(0, 4000); // Limit context
  const tablesSummary = stage1Output.tables
    .slice(0, 5)
    .map((t, i) => `Table ${i + 1} (page ${t.page_number}): ${t.row_count} rows, headers: ${JSON.stringify(t.headers)}`)
    .join('\n');

  const prompt = `You are a financial document classifier. Based on the extracted text and table structure from a PDF, identify the document type.

EXTRACTED TEXT (first 4000 characters):
${rawText}

DETECTED TABLES:
${tablesSummary}

Based on this content, identify:
1. Primary document type (from the list below)
2. Confidence level (high/medium/low)
3. Key indicators that led to this classification
4. Tax year or fiscal year (if identifiable)
5. Entity name (if identifiable)

VALID DOCUMENT TYPES:
- FORM_1120 (C-Corporation tax return - look for "Form 1120", corporate income)
- FORM_1120S (S-Corporation tax return - look for "Form 1120-S", shareholder allocations)
- FORM_1065 (Partnership return - look for "Form 1065", partner allocations)
- SCHEDULE_C (Sole proprietorship - look for "Schedule C", attached to 1040)
- SCHEDULE_K1 (K-1 - look for "Schedule K-1", distributive share)
- INCOME_STATEMENT (P&L - look for Revenue, Expenses, Net Income columns)
- BALANCE_SHEET (look for Assets, Liabilities, Equity columns)
- CASH_FLOW_STATEMENT (look for Operating, Investing, Financing activities)
- TRIAL_BALANCE (look for Debit/Credit columns, account numbers)
- DEPRECIATION_SCHEDULE (look for asset descriptions, dates placed in service)
- FORM_1125A (COGS detail - look for beginning/ending inventory, purchases)
- UNKNOWN (if cannot determine)

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "document_type": "FORM_1120S",
  "confidence": "high",
  "indicators": ["Found 'Form 1120-S' header", "Schedule K shareholder allocations present"],
  "tax_year": "2024",
  "entity_name": "ABC Company LLC"
}`;

  try {
    const response = await client.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract text content
    const textContent = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    // Parse JSON response
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Haiku response not valid JSON:', textContent);
      return {
        document_type: 'UNKNOWN',
        confidence: 'low',
        indicators: ['AI response parsing failed'],
        tax_year: null,
        entity_name: null,
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      document_type: parsed.document_type || 'UNKNOWN',
      confidence: parsed.confidence || 'low',
      indicators: parsed.indicators || [],
      tax_year: parsed.tax_year || null,
      entity_name: parsed.entity_name || null,
    };
  } catch (error) {
    console.error('Haiku classification error:', error);
    return {
      document_type: 'UNKNOWN',
      confidence: 'low',
      indicators: ['AI classification failed'],
      tax_year: null,
      entity_name: null,
    };
  }
}

/**
 * Classify a financial document
 *
 * Uses fast keyword detection first, falls back to Haiku for ambiguous cases.
 *
 * @param stage1Output - Raw extraction from Stage 1 (pdfplumber)
 * @returns DocumentClassification with type, confidence, and indicators
 */
export async function classifyDocument(
  stage1Output: Stage1Output
): Promise<DocumentClassification> {
  // Try fast keyword-based classification first
  const keywordResult = classifyByKeywords(stage1Output);

  if (keywordResult && keywordResult.confidence === 'high') {
    console.log(`[Classifier] Fast path: ${keywordResult.document_type} (${keywordResult.confidence})`);
    return keywordResult;
  }

  // Fall back to Haiku for ambiguous cases
  console.log('[Classifier] Using Haiku for classification');
  const haikuResult = await classifyWithHaiku(stage1Output);

  // If keyword result exists but was medium confidence, prefer it if Haiku agrees
  if (keywordResult && keywordResult.document_type === haikuResult.document_type) {
    return {
      ...haikuResult,
      confidence: 'high', // Boost confidence when both agree
      indicators: [...keywordResult.indicators, ...haikuResult.indicators],
    };
  }

  return haikuResult;
}

// Export helper functions for testing
export { classifyByKeywords, extractTaxYear, extractEntityName };
