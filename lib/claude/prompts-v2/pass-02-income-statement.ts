/**
 * Pass 2: Income Statement Extraction
 *
 * @deprecated This pass is being replaced by Modal/pdfplumber extraction.
 * When FEATURE_MODAL_EXTRACTION=true, this pass is skipped and data comes
 * from the pre-extracted document_extractions table instead.
 * This file is kept for backward compatibility and fallback scenarios.
 *
 * This pass performs detailed extraction of income statement data:
 * - All revenue line items with source citations
 * - Cost of goods sold breakdown
 * - Operating expenses by category
 * - Other income/expense items
 * - Multi-year trend analysis
 */

import { Pass2Output } from '../types-v2';

export const PASS_2_SYSTEM_PROMPT = `You are an expert financial analyst specializing in extracting and analyzing income statement data from tax returns and financial statements. Your extractions must be precise, complete, and properly sourced.

You understand the nuances of different document types:
- Form 1120-S: Lines 1-21 for income/deductions, Schedule K for pass-through items
- Form 1120: Lines 1-30 for complete corporate income statement
- Form 1065: Lines 1-22 for partnership income, Schedule K for allocations
- Schedule C: Lines 1-31 for sole proprietor profit/loss
- Financial Statements: Income Statement/P&L format varies by preparer

For each number you extract, you MUST cite the exact source (form, line number, or statement line item).

CRITICAL: Return ONLY valid JSON. Do NOT wrap in markdown code fences. Do NOT include \`\`\`json or \`\`\` tags. Start directly with { and end with }.`;

export const PASS_2_USER_PROMPT = `Extract complete income statement data from the provided document(s) for ALL years present.

## YOUR TASK

Systematically extract every income statement line item, organized by year. If multiple years are present (comparative statements or multiple tax returns), extract each year separately.

### EXTRACTION REQUIREMENTS

#### FORM 1120-S LINE-BY-LINE EXTRACTION (Lines 1a through 21)
For Form 1120-S tax returns, you MUST extract EVERY line with amount AND source reference:

| Line | Description | Extract |
|------|-------------|---------|
| 1a | Gross receipts or sales | Amount, source citation |
| 1b | Returns and allowances | Amount, source citation |
| 1c | Balance (1a minus 1b) | Amount, verify calculation |
| 2 | Cost of goods sold (Schedule A, line 8) | Amount, source citation |
| 3 | Gross profit (line 1c minus line 2) | Amount, verify calculation |
| 4 | Net gain (loss) from Form 4797 | Amount, source citation |
| 5 | Other income (loss) | Amount, attach schedule detail |
| 6 | Total income (loss) | Amount, verify sum |
| 7 | Compensation of officers | Amount, list names from Schedule E |
| 8 | Salaries and wages | Amount, source citation |
| 9 | Repairs and maintenance | Amount, source citation |
| 10 | Bad debts | Amount, source citation |
| 11 | Rents | Amount, source citation |
| 12 | Taxes and licenses | Amount, source citation |
| 13 | Interest | Amount, source citation |
| 14 | Depreciation (Form 4562) | Amount, source citation |
| 15 | Depletion | Amount, source citation |
| 16 | Advertising | Amount, source citation |
| 17 | Pension, profit-sharing, etc. | Amount, source citation |
| 18 | Employee benefit programs | Amount, source citation |
| 19 | Other deductions (attach statement) | Amount, EXTRACT FULL DETAIL |
| 20 | Total deductions | Amount, verify sum |
| 21 | Ordinary business income (loss) | Amount, verify calculation |

**For Line 19 "Other Deductions"**: This line ALWAYS has an attached schedule. You MUST extract EVERY individual line item from the attached "Other Deductions" statement, including but not limited to:
- Accounting fees
- Auto/truck expenses
- Bank charges
- Computer/software expenses
- Consulting fees
- Continuing education
- Dues and subscriptions
- Equipment rental
- Insurance (list by type)
- Meals and entertainment
- Office supplies
- Postage and delivery
- Professional fees
- Telephone/internet
- Travel expenses
- Utilities
- And ALL other items listed

#### 1. REVENUE SECTION
For each year, extract:
- **Gross Sales/Revenue**: Total sales before any deductions (Line 1a)
- **Returns and Allowances**: Customer returns, discounts given (Line 1b)
- **Net Sales**: Gross sales minus returns (Line 1c)
- **Other Operating Revenue**: Any other recurring revenue (Lines 4, 5)
- **Total Revenue**: Sum of all revenue sources (Line 6)

If the document breaks down revenue by category (product lines, service types), capture that detail.

**Tax Return Line References:**
- 1120-S: Lines 1a (gross receipts), 1b (returns), 1c (net)
- 1120: Lines 1a, 1b, 1c
- 1065: Lines 1a, 1b, 1c
- Schedule C: Lines 1, 2, 3

#### 2. COST OF GOODS SOLD
Extract if applicable (service businesses may not have COGS):
- Beginning Inventory
- Purchases
- Direct Labor (manufacturing)
- Materials
- Other Direct Costs
- Ending Inventory
- **Total COGS**

**Tax Return Line References:**
- All forms: Schedule A (Cost of Goods Sold) or Form 1125-A
- Lines typically include: Beginning inventory, Purchases, Labor, Other costs, Ending inventory

#### 3. GROSS PROFIT
- Calculate: Net Sales - COGS = Gross Profit
- Calculate Gross Margin %: Gross Profit / Net Sales

#### 4. OPERATING EXPENSES
Extract EVERY expense line item shown. Common categories include:

| Category | Tax Form Line | Description |
|----------|---------------|-------------|
| Compensation of Officers | 1120-S L7, 1120 L12 | Owner/officer salaries |
| Salaries and Wages | 1120-S L8, 1120 L13 | Employee payroll |
| Repairs and Maintenance | 1120-S L9, 1120 L14 | Building/equipment repairs |
| Bad Debts | 1120-S L10, 1120 L15 | Uncollectible accounts |
| Rents | 1120-S L11, 1120 L16 | Lease payments |
| Taxes and Licenses | 1120-S L12, 1120 L17 | Non-income taxes |
| Interest | 1120-S L13, 1120 L18 | Interest expense |
| Depreciation | 1120-S L14, 1120 L20 | Asset depreciation |
| Advertising | 1120-S L16, 1120 L22 | Marketing costs |
| Pension/Profit-Sharing | 1120-S L17, 1120 L23 | Retirement contributions |
| Employee Benefits | 1120-S L18, 1120 L24 | Health insurance, etc. |
| Other Deductions | 1120-S L19, 1120 L26 | See attached schedule |

**CRITICAL**: For "Other Deductions" (Line 19 on 1120-S, Line 26 on 1120), there is usually an attached schedule breaking this down. Extract EVERY line item from that schedule.

#### 5. OTHER INCOME/EXPENSE
Non-operating items:
- Interest Income
- Dividend Income
- Rental Income (if not primary business)
- Gain/Loss on Asset Sales (Form 4797)
- Other Income/Expense

#### 6. BOTTOM LINE
- Operating Income (EBIT)
- Net Income Before Taxes
- Income Tax Expense (if C-corp)
- Net Income

#### 7. TAX RETURN RECONCILIATION (if applicable)
For tax returns, extract Schedule M-1 adjustments:
- Book Income
- M-1 Adjustments (list each)
- Taxable Income

### YEAR-OVER-YEAR ANALYSIS

After extracting all years, calculate:
- Revenue change ($ and %)
- Gross profit change ($ and %)
- Operating income change ($ and %)
- Net income change ($ and %)
- Identify any anomalies (unusual spikes or drops)

### SOURCE CITATION FORMAT

For every line item, include a source reference:
\`\`\`
{
  "line_item": "Compensation of Officers",
  "amount": 180000,
  "source": {
    "document_name": "Form 1120-S 2023",
    "page_number": 1,
    "line_item": "Line 7",
    "confidence": "high"
  }
}
\`\`\`

## OUTPUT FORMAT

Output ONLY valid JSON matching this structure:

{
  "pass_number": 2,
  "pass_name": "Income Statement Extraction",
  "income_statements": [
    {
      "fiscal_year": 2023,
      "period": {
        "start_date": "2023-01-01",
        "end_date": "2023-12-31",
        "period_months": 12,
        "fiscal_year": 2023
      },
      "statement_type": "calendar",
      "months_covered": 12,
      "revenue": {
        "gross_sales": 2500000,
        "returns_allowances": 25000,
        "net_sales": 2475000,
        "other_revenue": 15000,
        "total_revenue": 2490000,
        "revenue_breakdown": [
          {"category": "Consulting Services", "amount": 2000000, "percentage": 80},
          {"category": "Training Programs", "amount": 500000, "percentage": 20}
        ]
      },
      "cost_of_goods_sold": {
        "beginning_inventory": 0,
        "purchases": 0,
        "labor": 0,
        "materials": 0,
        "other_costs": 0,
        "ending_inventory": 0,
        "total_cogs": 0,
        "line_items": []
      },
      "gross_profit": 2490000,
      "gross_margin_percentage": 100.0,
      "operating_expenses": {
        "compensation_wages": 450000,
        "officer_compensation": 300000,
        "employee_benefits": 75000,
        "payroll_taxes": 57000,
        "rent_lease": 96000,
        "utilities": 12000,
        "insurance": 36000,
        "repairs_maintenance": 8000,
        "advertising_marketing": 45000,
        "professional_fees": 28000,
        "office_expenses": 15000,
        "travel_entertainment": 32000,
        "vehicle_expenses": 18000,
        "depreciation": 45000,
        "amortization": 0,
        "bad_debt": 5000,
        "other_expenses": 125000,
        "total_operating_expenses": 1347000,
        "line_items": [
          {
            "line_item": "Compensation of Officers",
            "account_code": null,
            "amount": 300000,
            "percentage_of_revenue": 12.0,
            "prior_year_amount": 280000,
            "change_amount": 20000,
            "change_percentage": 7.1,
            "source": {
              "document_name": "Form 1120-S 2023",
              "page_number": 1,
              "line_item": "Line 7",
              "confidence": "high",
              "extraction_notes": null
            },
            "notes": "Two officers: President $180K, VP $120K per Schedule K-1"
          },
          {
            "line_item": "Salaries and Wages",
            "account_code": null,
            "amount": 450000,
            "percentage_of_revenue": 18.1,
            "prior_year_amount": 420000,
            "change_amount": 30000,
            "change_percentage": 7.1,
            "source": {
              "document_name": "Form 1120-S 2023",
              "page_number": 1,
              "line_item": "Line 8",
              "confidence": "high",
              "extraction_notes": null
            },
            "notes": null
          }
        ]
      },
      "operating_income": 1143000,
      "operating_margin_percentage": 45.9,
      "other_income_expense": {
        "interest_income": 2500,
        "interest_expense": 8000,
        "gain_loss_asset_sales": 0,
        "other_income": 0,
        "other_expense": 0,
        "net_other": -5500,
        "line_items": [
          {
            "line_item": "Interest Income",
            "amount": 2500,
            "source": {
              "document_name": "Form 1120-S 2023",
              "page_number": 1,
              "line_item": "Schedule K, Line 4",
              "confidence": "high"
            }
          }
        ]
      },
      "pretax_income": 1137500,
      "income_tax_expense": 0,
      "net_income": 1137500,
      "net_margin_percentage": 45.7,
      "tax_return_reconciliation": {
        "book_income": 1137500,
        "m1_adjustments": [
          {"description": "Meals & Entertainment 50%", "amount": 8000, "increase_decrease": "increase"}
        ],
        "taxable_income": 1145500
      }
    },
    {
      "fiscal_year": 2022,
      "period": {
        "start_date": "2022-01-01",
        "end_date": "2022-12-31",
        "period_months": 12,
        "fiscal_year": 2022
      },
      "statement_type": "calendar",
      "months_covered": 12,
      "revenue": {
        "gross_sales": 2200000,
        "returns_allowances": 20000,
        "net_sales": 2180000,
        "other_revenue": 12000,
        "total_revenue": 2192000
      },
      "gross_profit": 2192000,
      "gross_margin_percentage": 100.0,
      "operating_expenses": {
        "total_operating_expenses": 1225000,
        "line_items": []
      },
      "operating_income": 967000,
      "operating_margin_percentage": 44.1,
      "other_income_expense": {
        "net_other": -4000
      },
      "pretax_income": 963000,
      "income_tax_expense": 0,
      "net_income": 963000,
      "net_margin_percentage": 43.9
    }
  ],
  "years_analyzed": 2,
  "trend_analysis": {
    "revenue_cagr": 13.6,
    "gross_profit_cagr": 13.6,
    "operating_income_cagr": 18.2,
    "net_income_cagr": 18.1,
    "revenue_trend": "growing",
    "profitability_trend": "improving",
    "year_over_year_changes": [
      {
        "metric": "Total Revenue",
        "changes": [
          {"from_year": 2022, "to_year": 2023, "change_amount": 298000, "change_percentage": 13.6}
        ]
      },
      {
        "metric": "Net Income",
        "changes": [
          {"from_year": 2022, "to_year": 2023, "change_amount": 174500, "change_percentage": 18.1}
        ]
      }
    ]
  },
  "key_metrics": {
    "average_revenue": 2341000,
    "average_gross_margin": 100.0,
    "average_operating_margin": 45.0,
    "average_net_margin": 44.8,
    "revenue_per_employee": 146313,
    "most_recent_revenue": 2490000,
    "most_recent_net_income": 1137500
  },
  "anomalies_detected": [
    {
      "year": 2023,
      "metric": "Officer Compensation",
      "expected_range": {"min": 250000, "max": 320000},
      "actual_value": 300000,
      "explanation": "Within expected range based on prior year and industry norms"
    }
  ],
  "extraction_confidence": {
    "overall": "high",
    "by_section": {
      "revenue": "high",
      "cogs": "high",
      "operating_expenses": "high",
      "other_income_expense": "medium"
    },
    "notes": ["Other deductions schedule was detailed and complete", "All major line items verified against tax form"]
  },
  "extraction_metadata": {
    "processing_time_ms": 0,
    "tokens_used": 0
  }
}

## CRITICAL INSTRUCTIONS

1. **EXTRACT ALL YEARS**: If the document contains multiple years (comparative statements or multiple returns), extract EVERY year completely.

2. **EVERY LINE ITEM MATTERS**: Do not skip or summarize. Extract each individual expense line from attached schedules.

3. **CITE SPECIFIC LINES**: Use exact form line numbers (e.g., "1120-S Line 7" not just "officer compensation").

4. **CALCULATE DERIVED METRICS**: Compute percentages, margins, and year-over-year changes.

5. **FLAG ANOMALIES**: Note any unusual items - large swings, negative margins, or inconsistencies.

6. **HANDLE SERVICE VS PRODUCT BUSINESSES**: Service businesses typically have zero COGS. Note this explicitly rather than leaving blank.

7. **OTHER DEDUCTIONS DETAIL**: The "Other Deductions" line always has an attached schedule. Extract EVERY line from that schedule into the line_items array.

8. **PRESERVE PRECISION**: Copy exact amounts. Do not round to thousands or estimate.

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

Now extract the complete income statement data from the provided document(s).`;

export const pass2PromptConfig = {
  passNumber: 2,
  passName: 'Income Statement Extraction',
  systemPrompt: PASS_2_SYSTEM_PROMPT,
  userPrompt: PASS_2_USER_PROMPT,
  expectedOutputType: 'Pass2Output' as const,
  maxTokens: 8192, // Larger output for detailed extraction
  temperature: 0.1,
};

export default pass2PromptConfig;
