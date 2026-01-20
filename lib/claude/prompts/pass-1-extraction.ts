/**
 * Pass 1: Document Extraction Prompt
 *
 * This pass reads uploaded PDF documents and extracts all financial data.
 * Handles both tax returns (1120-S, 1120, 1065, Schedule C) and
 * financial statements (P&L, Balance Sheet).
 */

export const pass1Prompt = `You are a financial document extraction specialist. Your task is to analyze the uploaded PDF document(s) and extract all financial information with precision.

## DOCUMENT IDENTIFICATION

First, identify ALL document types present in the PDF. A single PDF may contain multiple document types:

**Tax Returns:**
- Form 1120-S (S Corporation)
- Form 1120 (C Corporation)
- Form 1065 (Partnership)
- Schedule C (Sole Proprietorship, attached to Form 1040)

**Financial Statements:**
- Income Statement / Profit & Loss (P&L)
- Balance Sheet / Statement of Financial Position
- Combined Financial Statement

For each document found, note the type, years covered, and page location.

## COMPANY INFORMATION EXTRACTION

Extract the following company details:
- **Legal Name**: As shown on tax return or letterhead
- **Entity Type**: S-Corp, C-Corp, Partnership, LLC, Sole Proprietorship
- **Address**: Street, City, State, ZIP
- **EIN**: Employer Identification Number (from tax returns)

## INDUSTRY CLASSIFICATION

Based on the business activities described in the documents:
1. Assign a 6-digit NAICS code (be as specific as possible)
2. Provide the official NAICS description
3. List 3-5 keywords describing the business
4. Rate your confidence: "High" (clear industry), "Medium" (educated inference), "Low" (limited information)

## FINANCIAL DATA EXTRACTION

Extract financial data for EACH fiscal year present. Match data to these specific locations:

### Tax Return Line References:

**Form 1120-S (S Corporation):**
- Line 1a: Gross receipts or sales → revenue
- Line 1b: Returns and allowances
- Line 2: Cost of goods sold → cost_of_goods_sold
- Line 3: Gross profit → gross_profit
- Line 7: Compensation of officers → owner_compensation (CRITICAL)
- Line 8: Salaries and wages
- Line 9: Repairs and maintenance
- Line 11: Rents
- Line 12: Taxes and licenses
- Line 13: Interest → interest_expense
- Line 14: Depreciation → depreciation
- Line 16: Advertising
- Line 17: Pension/profit-sharing
- Line 18: Employee benefit programs
- Line 19: Other deductions (review attached schedule)
- Line 21: Ordinary business income → net_income
- Schedule L: Balance sheet data (if present)

**Form 1120 (C Corporation):**
- Similar structure to 1120-S
- Line 12: Compensation of officers → owner_compensation

**Form 1065 (Partnership):**
- Line 1a: Gross receipts
- Line 10: Guaranteed payments to partners → owner_compensation (CRITICAL)
- Note: Also check Schedule K-1 for partner compensation

**Schedule C (Sole Proprietorship):**
- Line 1: Gross receipts → revenue
- Line 4: Cost of goods sold
- Line 7: Gross income
- Line 31: Net profit → net_income
- Owner compensation is the net profit PLUS any wages the owner paid themselves

### Financial Statement Terminology Mapping:

Financial statements use varied terminology. Map these equivalents:

**Revenue:**
- Sales, Gross Sales, Net Sales, Total Revenue, Total Income, Service Revenue, Fee Income

**Cost of Goods Sold:**
- COGS, Cost of Sales, Cost of Revenue, Direct Costs, Cost of Services

**Owner Compensation (CRITICAL for valuation):**
- Officer Compensation, Officer Salary, Owner Salary, Owner Draw, Management Salary
- Guaranteed Payments (partnerships), Shareholder Wages
- May be embedded in "Salaries & Wages" - look for detail or footnotes

**Operating Expenses to Extract:**
- Salaries & Wages (non-owner)
- Rent / Lease Expense
- Utilities
- Insurance
- Repairs & Maintenance
- Depreciation
- Amortization
- Advertising / Marketing
- Professional Fees (Legal, Accounting)
- Office Expenses
- Travel & Entertainment
- Vehicle Expenses
- Interest Expense
- Other / Miscellaneous

## OWNER COMPENSATION - SPECIAL ATTENTION

Owner compensation is CRITICAL for Seller's Discretionary Earnings (SDE) calculation. Search thoroughly:

1. **On Tax Returns**: Officer compensation line, guaranteed payments
2. **On Financial Statements**: May be in Payroll, Management Fees, or buried in G&A
3. **If unclear**: Flag as "Owner compensation not separately identified"
4. **Multiple owners**: Sum all owner/officer compensation

## BALANCE SHEET DATA

If balance sheet is available (Schedule L on tax returns, or separate Balance Sheet):

Extract:
- Cash and cash equivalents
- Accounts receivable
- Inventory
- Total current assets
- Fixed assets (gross)
- Accumulated depreciation
- Net fixed assets
- Total assets
- Accounts payable
- Accrued expenses
- Current portion of long-term debt
- Total current liabilities
- Long-term debt
- Total liabilities
- Total equity (Retained Earnings + Capital Stock)

## DATA QUALITY FLAGS

Note any issues:
- Missing years or incomplete data
- Inconsistent totals (e.g., assets ≠ liabilities + equity)
- Unusual items or one-time events mentioned
- Amendments or restatements
- Owner compensation not clearly identifiable
- Handwritten or illegible sections
- Multiple businesses combined

## OUTPUT FORMAT

Respond with ONLY valid JSON matching this exact structure:

{
  "analysis": {
    "document_info": {
      "documents_found": [
        { "type": "1120-S", "years": ["2024", "2023"], "source": "Pages 1-12" }
      ],
      "primary_type": "Tax Return",
      "quality": "High",
      "page_count": 0
    },
    "company_info": {
      "name": "",
      "entity_type": "",
      "address": {
        "street": null,
        "city": null,
        "state": null,
        "zip": null
      },
      "ein": null
    },
    "industry_classification": {
      "naics_code": "",
      "naics_description": "",
      "confidence": "Medium",
      "keywords": []
    },
    "financial_data": {
      "2024": {
        "revenue": 0,
        "cost_of_goods_sold": 0,
        "gross_profit": 0,
        "operating_expenses": {
          "salaries_wages": 0,
          "rent": 0,
          "utilities": 0,
          "insurance": 0,
          "repairs_maintenance": 0,
          "depreciation": 0,
          "amortization": 0,
          "advertising": 0,
          "professional_fees": 0,
          "office_expenses": 0,
          "travel_entertainment": 0,
          "vehicle_expenses": 0,
          "interest_expense": 0,
          "other_expenses": 0,
          "total_operating_expenses": 0
        },
        "owner_compensation": 0,
        "net_income": 0,
        "source_document": "Form 1120-S",
        "balance_sheet": {
          "total_assets": 0,
          "total_liabilities": 0,
          "total_equity": 0,
          "cash": 0,
          "accounts_receivable": 0,
          "inventory": 0,
          "fixed_assets": 0,
          "accumulated_depreciation": 0,
          "source_document": "Schedule L"
        }
      }
    },
    "extraction_notes": "",
    "data_quality_flags": []
  },
  "knowledge_requests": {
    "industry_specific": [],
    "tax_form_specific": [],
    "risk_factors": [],
    "comparable_industries": [],
    "benchmarks_needed": []
  },
  "knowledge_reasoning": ""
}

## IMPORTANT INSTRUCTIONS

1. Output ONLY the JSON object - no markdown, no explanation, no commentary
2. Use 0 for missing numeric values, null for missing strings
3. Include ALL years found in the documents
4. Be precise with numbers - do not round or estimate
5. If a value is clearly shown, extract it exactly
6. For knowledge_requests, identify what industry data, benchmarks, or guidance would help subsequent analysis passes
7. In knowledge_reasoning, briefly explain what additional context would be valuable

Now analyze the uploaded document(s) and extract all financial data.`;

/**
 * System prompt context for Pass 1
 */
export const pass1SystemContext = `You are a specialized financial document extraction AI. Your role is to accurately extract financial data from tax returns and financial statements for business valuation purposes.

Key priorities:
1. ACCURACY: Extract numbers exactly as shown - do not round or estimate
2. COMPLETENESS: Capture all years and all available data points
3. OWNER COMPENSATION: This is critical for SDE calculation - search thoroughly
4. TRANSPARENCY: Flag any data quality issues or assumptions

You have expertise in:
- IRS tax forms (1120-S, 1120, 1065, Schedule C)
- Financial statement formats (QuickBooks, Xero, CPA-prepared)
- NAICS industry classification
- Business valuation data requirements`;

/**
 * Helper to format the prompt with document context
 */
export function buildPass1Prompt(documentContext?: string): string {
  if (documentContext) {
    return `${pass1Prompt}\n\n## DOCUMENT CONTEXT\n${documentContext}`;
  }
  return pass1Prompt;
}

/**
 * Validate Pass 1 output structure
 */
export function validatePass1Output(output: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!output || typeof output !== 'object') {
    errors.push('Output is not an object');
    return { valid: false, errors };
  }

  const data = output as Record<string, unknown>;

  if (!data.analysis) {
    errors.push('Missing analysis object');
    return { valid: false, errors };
  }

  const analysis = data.analysis as Record<string, unknown>;

  // Check document_info
  if (!analysis.document_info) {
    errors.push('Missing document_info');
  } else {
    const docInfo = analysis.document_info as Record<string, unknown>;
    if (!docInfo.documents_found || !Array.isArray(docInfo.documents_found)) {
      errors.push('Missing or invalid documents_found array');
    }
  }

  // Check company_info
  if (!analysis.company_info) {
    errors.push('Missing company_info');
  } else {
    const compInfo = analysis.company_info as Record<string, unknown>;
    if (!compInfo.name) {
      errors.push('Missing company_info.name');
    }
  }

  // Check industry_classification
  if (!analysis.industry_classification) {
    errors.push('Missing industry_classification');
  } else {
    const indClass = analysis.industry_classification as Record<string, unknown>;
    if (!indClass.naics_code) {
      errors.push('Missing industry_classification.naics_code');
    }
  }

  // Check financial_data
  if (!analysis.financial_data || typeof analysis.financial_data !== 'object') {
    errors.push('Missing financial_data');
  } else {
    const finData = analysis.financial_data as Record<string, unknown>;
    const years = Object.keys(finData);
    if (years.length === 0) {
      errors.push('No fiscal years in financial_data');
    }
    for (const year of years) {
      const yearData = finData[year] as Record<string, unknown>;
      if (yearData.revenue === undefined) {
        errors.push(`Missing revenue for ${year}`);
      }
      if (yearData.net_income === undefined) {
        errors.push(`Missing net_income for ${year}`);
      }
    }
  }

  // Check knowledge_requests
  if (!data.knowledge_requests) {
    errors.push('Missing knowledge_requests');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default {
  prompt: pass1Prompt,
  systemContext: pass1SystemContext,
  buildPrompt: buildPass1Prompt,
  validate: validatePass1Output,
};
