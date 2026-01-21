/**
 * Pass 3: Balance Sheet & Working Capital Analysis
 *
 * This pass performs detailed extraction of balance sheet data:
 * - Complete asset, liability, and equity extraction
 * - Working capital calculation and analysis
 * - Liquidity and leverage ratio computation
 * - Off-balance-sheet item identification
 * - Asset quality assessment
 */

import { Pass3Output } from '../types-v2';

export const PASS_3_SYSTEM_PROMPT = `You are an expert financial analyst specializing in balance sheet analysis for business valuation purposes. Your task is to extract complete balance sheet data and perform working capital analysis.

You understand balance sheet sources in various documents:
- Form 1120-S/1120: Schedule L contains the balance sheet (beginning and end of year)
- Form 1065: Schedule L contains partnership balance sheet
- Schedule C: No formal balance sheet (use any supplementary schedules)
- Financial Statements: Standard balance sheet format

For valuation purposes, you focus on:
1. Accurate extraction of all asset and liability categories
2. Working capital adequacy analysis
3. Asset quality assessment (especially receivables and inventory)
4. Identification of non-operating or excess assets
5. Related-party items that may need adjustment

CRITICAL: Return ONLY valid JSON. Do NOT wrap in markdown code fences. Do NOT include \`\`\`json or \`\`\` tags. Start directly with { and end with }.`;

export const PASS_3_USER_PROMPT = `Extract complete balance sheet data and perform working capital analysis from the provided document(s).

## YOUR TASK

Systematically extract every balance sheet line item for ALL years present. Tax returns on Schedule L show both beginning and end of year balances - extract both as separate years.

### SCHEDULE L COMPLETE LINE-BY-LINE EXTRACTION (Lines 1-26)

For Form 1120-S Schedule L, you MUST extract EVERY line with BOTH beginning (Column b) AND ending (Column d) balances:

**ASSETS (Lines 1-15)**
| Line | Description | Beginning (b) | Ending (d) |
|------|-------------|---------------|------------|
| 1 | Cash | $ | $ |
| 2a | Trade notes and accounts receivable | $ | $ |
| 2b | Less allowance for bad debts | $ | $ |
| 3 | Inventories | $ | $ |
| 4 | U.S. government obligations | $ | $ |
| 5 | Tax-exempt securities | $ | $ |
| 6 | Other current assets (attach statement) | $ | $ |
| 7 | Loans to shareholders | $ | $ |
| 8 | Mortgage and real estate loans | $ | $ |
| 9 | Other investments (attach statement) | $ | $ |
| 10a | Buildings and other depreciable assets | $ | $ |
| 10b | Less accumulated depreciation | $ | $ |
| 11a | Depletable assets | $ | $ |
| 11b | Less accumulated depletion | $ | $ |
| 12 | Land (net of any amortization) | $ | $ |
| 13a | Intangible assets (amortizable only) | $ | $ |
| 13b | Less accumulated amortization | $ | $ |
| 14 | Other assets (attach statement) | $ | $ |
| 15 | **Total assets** | $ | $ |

**LIABILITIES AND SHAREHOLDERS' EQUITY (Lines 16-27)**
| Line | Description | Beginning (b) | Ending (d) |
|------|-------------|---------------|------------|
| 16 | Accounts payable | $ | $ |
| 17 | Mortgages, notes, bonds payable in less than 1 year | $ | $ |
| 18 | Other current liabilities (attach statement) | $ | $ |
| 19 | Loans from shareholders | $ | $ |
| 20 | Mortgages, notes, bonds payable in 1 year or more | $ | $ |
| 21 | Other liabilities (attach statement) | $ | $ |
| 22a | Capital stock | $ | $ |
| 22b | Additional paid-in capital | $ | $ |
| 23 | Retained earnings | $ | $ |
| 24 | Adjustments to shareholders' equity | $ | $ |
| 25 | Less cost of treasury stock | $ | $ |
| 26 | Total liabilities and shareholders' equity | $ | $ |

**CRITICAL VALIDATION:**
- Line 15 (Total Assets) MUST EQUAL Line 26 (Total Liabilities + Equity)
- If they don't balance, FLAG THIS DISCREPANCY
- Document both Beginning of Year (Column b) and End of Year (Column d)

### EXTRACTION REQUIREMENTS

#### 1. CURRENT ASSETS
Extract each current asset category:

| Asset | Tax Form Line (Schedule L) | Notes |
|-------|---------------------------|-------|
| Cash & Equivalents | Line 1 | Bank accounts, money markets |
| Trade Notes & Accounts Receivable | Line 2a | Customer receivables |
| Less: Allowance for Doubtful Accounts | Line 2b | Reserve for bad debts |
| Inventories | Line 3 | Raw materials, WIP, finished goods |
| U.S. Government Obligations | Line 4 | Treasury securities |
| Tax-Exempt Securities | Line 5 | Municipal bonds |
| Other Current Assets | Line 6 | Prepaid expenses, other |

For each asset:
- Record the book value exactly as shown
- Note if fair market value might differ significantly
- Identify any assets that may be personal rather than business

#### 2. FIXED ASSETS (Property, Plant & Equipment)
Extract each fixed asset category:

| Asset | Tax Form Line (Schedule L) | Notes |
|-------|---------------------------|-------|
| Buildings & Other Depreciable Assets | Line 10a | Gross value |
| Less: Accumulated Depreciation | Line 10b | Total depreciation taken |
| Depletable Assets | Line 11a | Oil, gas, minerals |
| Less: Accumulated Depletion | Line 11b | Depletion taken |
| Land | Line 12 | Not depreciated |

**IMPORTANT**: Also extract the depreciation schedule (Form 4562) details if available:
- List of assets by category
- Original cost
- Date placed in service
- Depreciation method
- Current year depreciation

#### 3. OTHER ASSETS
| Asset | Tax Form Line | Notes |
|-------|--------------|-------|
| Intangible Assets | Line 13a | Goodwill, patents, licenses |
| Less: Accumulated Amortization | Line 13b | Amortization taken |
| Other Assets | Line 14 | Notes receivable, investments, due from shareholders |

**FLAG**: "Due from Shareholders" or "Loans to Officers" should be specifically identified as these often represent non-operating items or disguised distributions.

#### 4. CURRENT LIABILITIES
| Liability | Tax Form Line | Notes |
|-----------|--------------|-------|
| Accounts Payable | Line 16 | Trade payables |
| Mortgages, Notes, Bonds (< 1 year) | Line 17 | Current portion of debt |
| Other Current Liabilities | Line 18 | Accrued expenses, taxes payable |

#### 5. LONG-TERM LIABILITIES
| Liability | Tax Form Line | Notes |
|-----------|--------------|-------|
| Mortgages, Notes, Bonds (> 1 year) | Line 19 | Long-term debt |
| Other Liabilities | Line 20 | Deferred taxes, other |

**FLAG**: "Loans from Shareholders" should be specifically identified as these may be reclassified as equity for valuation purposes.

#### 6. EQUITY SECTION
| Account | Tax Form Line | Notes |
|---------|--------------|-------|
| Capital Stock | Line 22 (1120) / Line 21 (1065) | Par value of stock |
| Additional Paid-In Capital | Line 23 (1120) | Capital above par |
| Retained Earnings (Beginning) | Line 24 (1120) | Accumulated earnings |
| Adjustments to Shareholders' Equity | Line 25 (1120) | Various adjustments |
| Less: Cost of Treasury Stock | Line 26 (1120) | Repurchased shares |
| Retained Earnings (Ending) | Line 27 (1120) | End of year |

For S-Corps (Schedule L):
- Capital Stock (Line 22a)
- Retained Earnings (Line 24)
- AAA (Accumulated Adjustments Account) - from Schedule M-2

#### 7. WORKING CAPITAL ANALYSIS

Calculate for each year:
- **Current Assets**: Sum of all current assets
- **Current Liabilities**: Sum of all current liabilities
- **Net Working Capital**: Current Assets - Current Liabilities
- **Operating Working Capital**: (A/R + Inventory + Prepaids) - (A/P + Accrued Expenses)

Calculate Ratios:
- **Current Ratio**: Current Assets / Current Liabilities
- **Quick Ratio**: (Current Assets - Inventory) / Current Liabilities
- **Cash Ratio**: Cash / Current Liabilities

Calculate Turnover Metrics (requires income statement data from Pass 2):
- **Days Sales Outstanding (DSO)**: (A/R / Annual Revenue) x 365
- **Days Inventory Outstanding (DIO)**: (Inventory / COGS) x 365
- **Days Payable Outstanding (DPO)**: (A/P / COGS) x 365
- **Cash Conversion Cycle**: DSO + DIO - DPO

#### 8. WORKING CAPITAL NORMALIZATION

Assess whether working capital is at a "normal" level:
- Compare working capital as % of revenue to industry norms
- Identify seasonal factors if year-end is atypical
- Note any one-time items inflating/deflating working capital
- Calculate normalized working capital adjustment needed

#### 9. OFF-BALANCE SHEET ITEMS

Look for references to:
- Operating leases (now mostly on balance sheet under ASC 842)
- Guarantees or commitments
- Contingent liabilities (litigation, warranties)
- Unfunded pension obligations
- Purchase commitments

These may appear in:
- Footnotes to financial statements
- Tax return schedules
- Attached accountant notes

### OUTPUT FORMAT

Output ONLY valid JSON matching this structure:

{
  "pass_number": 3,
  "pass_name": "Balance Sheet & Working Capital",
  "balance_sheets": [
    {
      "fiscal_year": 2023,
      "as_of_date": "2023-12-31",
      "current_assets": {
        "cash_and_equivalents": 485000,
        "accounts_receivable_gross": 320000,
        "allowance_doubtful_accounts": 15000,
        "accounts_receivable_net": 305000,
        "inventory": 0,
        "prepaid_expenses": 35000,
        "other_current_assets": 12000,
        "total_current_assets": 837000,
        "line_items": [
          {
            "line_item": "Cash",
            "account_code": null,
            "amount": 485000,
            "prior_year_amount": 325000,
            "source": {
              "document_name": "Form 1120-S 2023",
              "page_number": 4,
              "line_item": "Schedule L, Line 1, Column (d)",
              "confidence": "high"
            },
            "fair_market_value": 485000,
            "fmv_adjustment_rationale": "Cash equals FMV",
            "notes": null
          },
          {
            "line_item": "Accounts Receivable",
            "amount": 320000,
            "prior_year_amount": 285000,
            "source": {
              "document_name": "Form 1120-S 2023",
              "page_number": 4,
              "line_item": "Schedule L, Line 2a, Column (d)",
              "confidence": "high"
            },
            "fair_market_value": 305000,
            "fmv_adjustment_rationale": "Net of allowance for doubtful accounts",
            "notes": "DSO of 47 days is within industry norm"
          }
        ]
      },
      "fixed_assets": {
        "land": 0,
        "buildings": 0,
        "machinery_equipment": 180000,
        "furniture_fixtures": 45000,
        "vehicles": 85000,
        "leasehold_improvements": 65000,
        "construction_in_progress": 0,
        "gross_fixed_assets": 375000,
        "accumulated_depreciation": 195000,
        "net_fixed_assets": 180000,
        "line_items": [
          {
            "line_item": "Buildings and Other Depreciable Assets",
            "amount": 375000,
            "source": {
              "document_name": "Form 1120-S 2023",
              "page_number": 4,
              "line_item": "Schedule L, Line 10a, Column (d)",
              "confidence": "high"
            },
            "notes": "See Form 4562 for depreciation detail"
          },
          {
            "line_item": "Less Accumulated Depreciation",
            "amount": 195000,
            "source": {
              "document_name": "Form 1120-S 2023",
              "page_number": 4,
              "line_item": "Schedule L, Line 10b, Column (d)",
              "confidence": "high"
            }
          }
        ]
      },
      "other_assets": {
        "goodwill": 0,
        "intangible_assets": 25000,
        "accumulated_amortization": 10000,
        "net_intangibles": 15000,
        "investments": 0,
        "notes_receivable_long_term": 0,
        "due_from_shareholders": 45000,
        "other_long_term_assets": 0,
        "total_other_assets": 60000,
        "line_items": [
          {
            "line_item": "Loans to Shareholders",
            "amount": 45000,
            "source": {
              "document_name": "Form 1120-S 2023",
              "page_number": 4,
              "line_item": "Schedule L, Line 7, Column (d)",
              "confidence": "high"
            },
            "notes": "NON-OPERATING ASSET: Should be excluded from operating value or treated as distribution"
          }
        ]
      },
      "total_assets": 1077000,
      "current_liabilities": {
        "accounts_payable": 125000,
        "accrued_expenses": 85000,
        "accrued_wages": 32000,
        "current_portion_long_term_debt": 24000,
        "line_of_credit": 0,
        "notes_payable_short_term": 0,
        "income_taxes_payable": 0,
        "deferred_revenue": 45000,
        "other_current_liabilities": 15000,
        "total_current_liabilities": 326000,
        "line_items": [
          {
            "line_item": "Accounts Payable",
            "amount": 125000,
            "source": {
              "document_name": "Form 1120-S 2023",
              "page_number": 4,
              "line_item": "Schedule L, Line 16, Column (d)",
              "confidence": "high"
            }
          }
        ]
      },
      "long_term_liabilities": {
        "notes_payable_long_term": 120000,
        "mortgage_payable": 0,
        "equipment_loans": 0,
        "due_to_shareholders": 0,
        "deferred_taxes": 0,
        "other_long_term_liabilities": 0,
        "total_long_term_liabilities": 120000,
        "line_items": [
          {
            "line_item": "Long-term Notes Payable",
            "amount": 120000,
            "source": {
              "document_name": "Form 1120-S 2023",
              "page_number": 4,
              "line_item": "Schedule L, Line 19, Column (d)",
              "confidence": "high"
            },
            "notes": "Equipment financing, matures 2027"
          }
        ]
      },
      "total_liabilities": 446000,
      "equity": {
        "common_stock": 1000,
        "additional_paid_in_capital": 49000,
        "retained_earnings": 580000,
        "current_year_net_income": 0,
        "distributions_dividends": 0,
        "treasury_stock": 0,
        "accumulated_other_comprehensive_income": 0,
        "total_equity": 631000,
        "line_items": [
          {
            "line_item": "Capital Stock",
            "amount": 1000,
            "source": {
              "document_name": "Form 1120-S 2023",
              "page_number": 4,
              "line_item": "Schedule L, Line 22a",
              "confidence": "high"
            }
          },
          {
            "line_item": "Retained Earnings",
            "amount": 580000,
            "source": {
              "document_name": "Form 1120-S 2023",
              "page_number": 4,
              "line_item": "Schedule L, Line 24",
              "confidence": "high"
            }
          }
        ]
      },
      "total_liabilities_and_equity": 1077000,
      "balance_check": true
    }
  ],
  "working_capital_analysis": [
    {
      "fiscal_year": 2023,
      "current_assets": 837000,
      "current_liabilities": 326000,
      "net_working_capital": 511000,
      "accounts_receivable": 305000,
      "inventory": 0,
      "prepaid_expenses": 35000,
      "accounts_payable": 125000,
      "accrued_expenses": 117000,
      "operating_working_capital": 98000,
      "current_ratio": 2.57,
      "quick_ratio": 2.57,
      "cash_ratio": 1.49,
      "days_sales_outstanding": 47,
      "days_inventory_outstanding": 0,
      "days_payable_outstanding": 0,
      "cash_conversion_cycle": 47,
      "working_capital_to_revenue": 20.5,
      "operating_wc_to_revenue": 3.9,
      "adequacy_assessment": "adequate",
      "adequacy_notes": "Strong current ratio of 2.57 indicates ample liquidity. DSO of 47 days is reasonable for B2B consulting.",
      "normalized_working_capital": 374100,
      "normalization_adjustments": [
        {
          "description": "Normalize to 15% of revenue (industry standard for professional services)",
          "amount": -136900,
          "rationale": "Current WC at 20.5% of revenue exceeds 15% industry norm; excess is $136,900"
        }
      ]
    }
  ],
  "trend_analysis": {
    "total_assets_trend": "growing",
    "total_debt_trend": "stable",
    "equity_trend": "growing",
    "working_capital_trend": "improving"
  },
  "key_metrics": {
    "most_recent_total_assets": 1077000,
    "most_recent_total_liabilities": 446000,
    "most_recent_equity": 631000,
    "most_recent_working_capital": 511000,
    "average_current_ratio": 2.57,
    "average_debt_to_equity": 0.71,
    "tangible_book_value": 616000
  },
  "asset_quality": {
    "receivables_quality": "good",
    "receivables_notes": "DSO of 47 days is within industry norm. 4.7% allowance for doubtful accounts is reasonable.",
    "inventory_quality": "excellent",
    "inventory_notes": "Service business with no inventory - not applicable.",
    "fixed_asset_condition": "good",
    "fixed_asset_notes": "Assets 52% depreciated. Mix of office equipment and leasehold improvements appropriate for consulting firm.",
    "intangibles_assessment": "Minor intangibles of $15K net appear to be software licenses being amortized."
  },
  "debt_analysis": {
    "total_debt": 144000,
    "debt_to_equity_ratio": 0.23,
    "debt_to_assets_ratio": 0.13,
    "interest_coverage_ratio": 142.9,
    "debt_structure_notes": "Low leverage with debt primarily from equipment financing. Strong interest coverage indicates no debt service concerns."
  },
  "off_balance_sheet_items": [
    {
      "description": "Operating lease for office space",
      "estimated_amount": 288000,
      "impact": "material",
      "notes": "3-year lease at $8,000/month. Remaining term 36 months. Under ASC 842 should be on balance sheet but tax return may not reflect."
    }
  ],
  "extraction_metadata": {
    "processing_time_ms": 0,
    "tokens_used": 0
  }
}

## CRITICAL INSTRUCTIONS

1. **BALANCE MUST BALANCE**: Verify that Total Assets = Total Liabilities + Total Equity. Flag if it doesn't.

2. **BEGINNING AND END OF YEAR**: Schedule L shows both columns. Extract end of year as current, beginning as prior year.

3. **FLAG NON-OPERATING ITEMS**: Specifically identify:
   - Loans to/from shareholders
   - Investments not used in operations
   - Personal assets on company books
   - Related-party receivables/payables

4. **CALCULATE ALL RATIOS**: Compute current ratio, quick ratio, DSO, DPO, etc. even if some are N/A (note as N/A for service businesses without inventory).

5. **ASSESS WORKING CAPITAL NORMALIZATION**: Compare to industry benchmarks and calculate normalized WC amount.

6. **CITE EVERY LINE**: Use exact Schedule L line references (e.g., "Line 1, Column (d)" for end of year cash).

7. **LOOK FOR FOOTNOTES**: Financial statements may have footnotes with critical information about contingencies, lease commitments, or asset valuations.

8. **PRESERVE EXACT AMOUNTS**: Do not round. Copy numbers exactly as shown on documents.

9. **OUTPUT ONLY JSON**: Your entire response must be valid JSON. No text before or after.

## CRITICAL QUALITY REQUIREMENTS

You are a Certified Valuation Analyst (CVA) with 20+ years of experience. Your work must meet professional standards.

### Documentation Standards
1. EVERY numerical value must cite its source (e.g., "Form 1120-S, Line 7: $125,000")
2. EVERY adjustment must include detailed justification (2-3 sentences minimum)
3. NEVER use vague language like "significant" - use specific numbers

### Narrative Standards
- Meet or EXCEED all word count minimums
- Write in professional, objective prose
- Reference specific numbers from the analysis
- Avoid boilerplate language - be specific to THIS business

### Professional Voice
Write as if this report will be:
- Presented to business owners making $500K+ decisions
- Reviewed by CPAs and attorneys
- Used as evidence in legal proceedings
- Submitted to SBA for loan approval

Now extract the complete balance sheet and working capital analysis from the provided document(s).`;

export const pass3PromptConfig = {
  passNumber: 3,
  passName: 'Balance Sheet & Working Capital',
  systemPrompt: PASS_3_SYSTEM_PROMPT,
  userPrompt: PASS_3_USER_PROMPT,
  expectedOutputType: 'Pass3Output' as const,
  maxTokens: 8192,
  temperature: 0.1,
};

export default pass3PromptConfig;
