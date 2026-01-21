/**
 * Pass 5: Earnings Normalization (SDE/EBITDA)
 *
 * This pass performs comprehensive earnings normalization:
 * - Calculate Seller's Discretionary Earnings (SDE) with all add-backs
 * - Calculate EBITDA and Adjusted EBITDA
 * - Document every adjustment with source and justification
 * - Assess earnings quality and sustainability
 * - Calculate multi-year weighted averages
 * - Compare to industry benchmarks
 */

import { Pass5Output } from '../types-v2';

export const PASS_5_SYSTEM_PROMPT = `You are an expert business valuation analyst specializing in earnings normalization for small and mid-sized businesses. Your task is to calculate normalized earnings metrics (SDE and EBITDA) that accurately represent the economic benefit stream available to a potential buyer.

You understand that the purpose of normalization is to:
1. Add back non-cash expenses (depreciation, amortization)
2. Add back owner-specific expenses that won't continue under new ownership
3. Add back/subtract one-time or non-recurring items
4. Adjust for related-party transactions at non-market rates
5. Normalize owner compensation to market levels
6. Present earnings as they would be for a hypothetical buyer

Every adjustment you make must be:
- Clearly categorized (add_back, deduction, normalization)
- Traced to a specific source (tax form line, financial statement item)
- Justified with clear rationale
- Classified by recurrence (one_time, recurring, partially_recurring)
- Assessed for confidence level (high, medium, low)

You will output ONLY valid JSON matching the required schema.`;

export const PASS_5_USER_PROMPT = `Calculate normalized earnings (SDE and EBITDA) for the subject company using data from prior passes.

## CONTEXT FROM PRIOR PASSES

You have received:
- **Pass 1**: Company profile, ownership structure, officer compensation data
- **Pass 2**: Detailed income statements for all years with line-item detail
- **Pass 3**: Balance sheet data including working capital analysis
- **Pass 4**: Industry benchmarks including typical margins and owner compensation

Use this data to calculate and document all earnings normalizations.

## YOUR TASK

Perform comprehensive earnings normalization for each year of data available, then calculate weighted averages.

### 1. SDE CALCULATION (Seller's Discretionary Earnings)

For each year, start with reported net income and systematically identify all add-backs:

#### A. Non-Cash Expenses (Always Add Back)
| Item | Typical Source | Notes |
|------|---------------|-------|
| Depreciation | 1120-S Line 14, Form 4562 | 100% add-back |
| Amortization | Various schedules | 100% add-back |

#### B. Interest & Financing (Add Back for Debt-Free Value)
| Item | Typical Source | Notes |
|------|---------------|-------|
| Interest Expense | 1120-S Line 13 | All interest to show debt-free cash flow |
| Loan Fees | Other deductions | One-time financing costs |

#### C. Owner Compensation (Primary SDE Component)
| Item | Typical Source | Notes |
|------|---------------|-------|
| Officer/Owner Salary | 1120-S Line 7, W-2 | Full amount added back |
| Owner Payroll Taxes | Calculated from salary | FICA/Medicare on owner wages |
| Owner Health Insurance | Benefits/Schedule K-1 | Personal health coverage |
| Owner Life Insurance | Insurance expense detail | Key-man or personal policies |
| Owner Retirement Contributions | Line 17, 401(k) records | Owner-specific contributions |
| Owner Vehicle (Personal Portion) | Vehicle expense, Form 4562 | Estimate 30-50% personal |
| Owner Cell Phone | Utilities/other expenses | If identifiable |

**CRITICAL**: Document the owner's actual compensation and benefits in detail. This is typically the largest SDE add-back.

#### D. Discretionary/Personal Expenses
| Item | Typical Source | Red Flags |
|------|---------------|-----------|
| Personal Travel | Travel expense detail | Vacation destinations, family included |
| Personal Meals | Meals & entertainment | Non-business purposes |
| Country Club/Memberships | Dues & subscriptions | Personal benefit |
| Charitable Contributions | Donations, Line 19 | Owner's personal giving |
| Political Contributions | Other expenses | Personal political activity |

#### E. One-Time/Non-Recurring Items
| Item | Treatment | Documentation Needed |
|------|-----------|---------------------|
| Lawsuit Settlements | Add back if one-time | Settlement agreement |
| Legal Fees (Specific Cases) | Add back if non-recurring | Invoice detail |
| Moving/Relocation Costs | Add back | Documentation |
| Natural Disaster Costs | Add back | Insurance records |
| PPP Loan Forgiveness | Adjust out (income) | May inflate reported income |
| ERTC Credits | Adjust out (income) | May inflate reported income |
| Asset Sale Gains/Losses | Add back/deduct | Form 4797 |

#### F. Related Party Adjustments
| Item | Treatment | Documentation |
|------|-----------|---------------|
| Above-Market Rent | Add back excess | Market rent comparables |
| Below-Market Rent | Deduct difference | Market rent comparables |
| Management Fees to Related Entity | Add back | Service documentation |
| Family Wages Above Market | Add back excess | Job descriptions, market wages |

#### G. Compensation Normalization (If Needed)
If owner takes significantly below-market compensation:
- Research market compensation for CEO/President of similar-sized company
- SUBTRACT the difference (negative add-back)
- This represents what a replacement owner/manager would need to be paid

### 2. EBITDA CALCULATION

Calculate standard EBITDA:
- Net Income + Interest + Taxes + Depreciation + Amortization = EBITDA

Calculate Adjusted EBITDA:
- Add owner compensation above market rate (if owner takes excess)
- Add one-time items
- Add/subtract related party adjustments
- Note: Adjusted EBITDA does NOT add back full owner compensation

### 3. EARNINGS QUALITY ASSESSMENT

Evaluate the quality and sustainability of earnings:

**Revenue Quality**
- What percentage is recurring (contracts, subscriptions)?
- Customer concentration risk?
- Revenue trend consistency?

**Expense Quality**
- How much is truly discretionary?
- What percentage required normalization?
- Are expenses well-documented?

**Earnings Consistency**
- Calculate coefficient of variation across years
- Is earnings trend stable, improving, declining, or volatile?

**Cash Flow Correlation**
- Do earnings convert to cash flow?
- What is the earnings-to-cash-flow ratio?

**Sustainability Assessment**
- What percentage of earnings is sustainable?
- Identify any at-risk items (customer concentration, key contract, etc.)

### 4. MULTI-YEAR WEIGHTED AVERAGE

Calculate weighted average SDE and EBITDA using appropriate weighting:

**Weighting Methods**:
- **Equal Weight**: Use when earnings are stable
- **Recent Weighted**: Use when trend is clear (e.g., 1-2-3 for 3 years)
- **Most Recent Only**: Use when significant recent changes make history less relevant

Document which method you're using and why.

### 5. COMPARISON TO BENCHMARKS

Compare normalized metrics to industry benchmarks from Pass 4:
- SDE margin vs. industry median
- EBITDA margin vs. industry median
- Identify where company outperforms or underperforms

### 6. EARNINGS NORMALIZATION NARRATIVE

Write a 600-800 word narrative explaining:
- Starting point (reported net income)
- Major categories of adjustments
- Specific significant adjustments and rationale
- Earnings quality assessment
- How normalized earnings compare to industry
- Recommended benefit stream for valuation

## OUTPUT FORMAT

Output ONLY valid JSON matching this structure:

{
  "pass_number": 5,
  "pass_name": "Earnings Normalization (SDE/EBITDA)",
  "sde_calculations": [
    {
      "fiscal_year": 2023,
      "reported_net_income": 285000,
      "add_backs": {
        "interest_expense": {
          "description": "Interest Expense",
          "amount": 12000,
          "adjustment_type": "add_back",
          "rationale": "Add back all interest to present debt-free earnings. Interest from equipment financing will not transfer to buyer.",
          "source": {
            "document_name": "Form 1120-S 2023",
            "page_number": 1,
            "line_item": "Line 13",
            "confidence": "high"
          },
          "recurrence": "recurring",
          "confidence": "high"
        },
        "depreciation": {
          "description": "Depreciation Expense",
          "amount": 45000,
          "adjustment_type": "add_back",
          "rationale": "Non-cash expense. Equipment is functional; no immediate replacement needed per depreciation schedule review.",
          "source": {
            "document_name": "Form 1120-S 2023",
            "page_number": 1,
            "line_item": "Line 14 / Form 4562",
            "confidence": "high"
          },
          "recurrence": "recurring",
          "confidence": "high"
        },
        "amortization": {
          "description": "Amortization of Intangibles",
          "amount": 5000,
          "adjustment_type": "add_back",
          "rationale": "Non-cash amortization of software licenses.",
          "source": {
            "document_name": "Form 4562",
            "line_item": "Part VI",
            "confidence": "high"
          },
          "recurrence": "recurring",
          "confidence": "high"
        },
        "owner_compensation": {
          "description": "Officer Compensation - Owner Salary",
          "amount": 180000,
          "adjustment_type": "add_back",
          "rationale": "Owner/President salary of $180,000. Full amount added back for SDE as this represents owner's compensation that would be available to buyer/operator.",
          "source": {
            "document_name": "Form 1120-S 2023",
            "page_number": 1,
            "line_item": "Line 7",
            "confidence": "high"
          },
          "recurrence": "recurring",
          "confidence": "high"
        },
        "owner_benefits": {
          "description": "Owner Health Insurance",
          "amount": 24000,
          "adjustment_type": "add_back",
          "rationale": "Health insurance premiums for owner and family ($2,000/month). Personal benefit that would not continue for new employees.",
          "source": {
            "document_name": "Schedule K-1",
            "line_item": "Box 12 Code E",
            "confidence": "high"
          },
          "recurrence": "recurring",
          "confidence": "high"
        },
        "owner_perks": {
          "description": "Owner Vehicle - Personal Use Portion",
          "amount": 8400,
          "adjustment_type": "add_back",
          "rationale": "Company vehicle expense of $14,000. Estimated 60% personal use based on mileage logs absence. Add back $8,400 personal portion.",
          "source": {
            "document_name": "Other Deductions Schedule",
            "line_item": "Vehicle expenses",
            "confidence": "medium"
          },
          "recurrence": "recurring",
          "confidence": "medium"
        },
        "one_time_expenses": [
          {
            "description": "Legal Fees - Lease Renegotiation",
            "amount": 15000,
            "adjustment_type": "add_back",
            "rationale": "One-time legal fees for commercial lease renegotiation completed in 2023. Lease now runs through 2028.",
            "source": {
              "document_name": "Other Deductions Schedule",
              "line_item": "Legal & professional fees",
              "confidence": "high"
            },
            "recurrence": "one_time",
            "confidence": "high"
          }
        ],
        "non_recurring_items": [],
        "discretionary_expenses": [
          {
            "description": "Charitable Contributions",
            "amount": 8500,
            "adjustment_type": "add_back",
            "rationale": "Owner's personal charitable giving through the business. New owner may or may not continue.",
            "source": {
              "document_name": "Other Deductions Schedule",
              "line_item": "Charitable contributions",
              "confidence": "high"
            },
            "recurrence": "recurring",
            "confidence": "high"
          },
          {
            "description": "Meals & Entertainment - Personal Portion",
            "amount": 6000,
            "adjustment_type": "add_back",
            "rationale": "Total M&E of $18,000. Estimated 1/3 ($6,000) lacks clear business purpose based on expense review. Remainder appears legitimate business development.",
            "source": {
              "document_name": "Other Deductions Schedule",
              "line_item": "Meals & entertainment",
              "confidence": "medium"
            },
            "recurrence": "recurring",
            "confidence": "medium"
          }
        ],
        "related_party_adjustments": [
          {
            "description": "Rent Adjustment - Above Market",
            "amount": 12000,
            "adjustment_type": "add_back",
            "rationale": "Company pays $10,000/month to owner's LLC for building. Market rent for comparable space is $9,000/month. Add back $12,000 annual excess.",
            "source": {
              "document_name": "Form 1120-S 2023",
              "line_item": "Line 11 (Rents)",
              "confidence": "medium"
            },
            "recurrence": "recurring",
            "confidence": "medium"
          }
        ],
        "other_add_backs": [],
        "total_add_backs": 315900
      },
      "deductions": {
        "one_time_income": [],
        "non_recurring_income": [
          {
            "description": "PPP Loan Forgiveness",
            "amount": 0,
            "adjustment_type": "deduction",
            "rationale": "No PPP forgiveness in 2023. (Was recognized in 2021)",
            "recurrence": "one_time",
            "confidence": "high"
          }
        ],
        "non_operating_income": [],
        "other_deductions": [],
        "total_deductions": 0
      },
      "normalizations": {
        "rent_adjustment": null,
        "compensation_adjustment": null,
        "inventory_adjustment": null,
        "other_normalizations": [],
        "total_normalizations": 0
      },
      "calculated_sde": 600900,
      "sde_margin": 0.241
    },
    {
      "fiscal_year": 2022,
      "reported_net_income": 245000,
      "add_backs": {
        "interest_expense": {
          "description": "Interest Expense",
          "amount": 14000,
          "adjustment_type": "add_back",
          "rationale": "Add back interest for debt-free earnings presentation.",
          "source": { "document_name": "Form 1120-S 2022", "line_item": "Line 13", "confidence": "high" },
          "recurrence": "recurring",
          "confidence": "high"
        },
        "depreciation": {
          "description": "Depreciation Expense",
          "amount": 42000,
          "adjustment_type": "add_back",
          "rationale": "Non-cash depreciation expense.",
          "source": { "document_name": "Form 1120-S 2022", "line_item": "Line 14", "confidence": "high" },
          "recurrence": "recurring",
          "confidence": "high"
        },
        "amortization": {
          "description": "Amortization",
          "amount": 5000,
          "adjustment_type": "add_back",
          "rationale": "Non-cash amortization.",
          "source": { "document_name": "Form 4562 2022", "confidence": "high" },
          "recurrence": "recurring",
          "confidence": "high"
        },
        "owner_compensation": {
          "description": "Officer Compensation",
          "amount": 165000,
          "adjustment_type": "add_back",
          "rationale": "Full owner salary added back for SDE.",
          "source": { "document_name": "Form 1120-S 2022", "line_item": "Line 7", "confidence": "high" },
          "recurrence": "recurring",
          "confidence": "high"
        },
        "owner_benefits": {
          "description": "Owner Health Insurance",
          "amount": 22000,
          "adjustment_type": "add_back",
          "rationale": "Owner health insurance premiums.",
          "source": { "document_name": "Schedule K-1 2022", "confidence": "high" },
          "recurrence": "recurring",
          "confidence": "high"
        },
        "owner_perks": {
          "description": "Owner Vehicle - Personal Use",
          "amount": 7500,
          "adjustment_type": "add_back",
          "rationale": "Estimated 60% personal use of company vehicle.",
          "source": { "document_name": "Other Deductions", "confidence": "medium" },
          "recurrence": "recurring",
          "confidence": "medium"
        },
        "one_time_expenses": [],
        "non_recurring_items": [],
        "discretionary_expenses": [
          {
            "description": "Charitable Contributions",
            "amount": 7500,
            "adjustment_type": "add_back",
            "rationale": "Owner discretionary charitable giving.",
            "source": { "document_name": "Other Deductions 2022", "confidence": "high" },
            "recurrence": "recurring",
            "confidence": "high"
          },
          {
            "description": "Meals & Entertainment - Personal",
            "amount": 5500,
            "adjustment_type": "add_back",
            "rationale": "Estimated personal portion of M&E.",
            "source": { "document_name": "Other Deductions 2022", "confidence": "medium" },
            "recurrence": "recurring",
            "confidence": "medium"
          }
        ],
        "related_party_adjustments": [
          {
            "description": "Rent - Above Market",
            "amount": 12000,
            "adjustment_type": "add_back",
            "rationale": "Same above-market rent adjustment as 2023.",
            "source": { "document_name": "Form 1120-S 2022", "line_item": "Line 11", "confidence": "medium" },
            "recurrence": "recurring",
            "confidence": "medium"
          }
        ],
        "other_add_backs": [],
        "total_add_backs": 280500
      },
      "deductions": {
        "one_time_income": [],
        "non_recurring_income": [],
        "non_operating_income": [],
        "other_deductions": [],
        "total_deductions": 0
      },
      "normalizations": {
        "rent_adjustment": null,
        "compensation_adjustment": null,
        "inventory_adjustment": null,
        "other_normalizations": [],
        "total_normalizations": 0
      },
      "calculated_sde": 525500,
      "sde_margin": 0.233
    }
  ],
  "ebitda_calculations": [
    {
      "fiscal_year": 2023,
      "reported_net_income": 285000,
      "interest_expense": 12000,
      "income_tax_expense": 0,
      "depreciation": 45000,
      "amortization": 5000,
      "ebitda": 347000,
      "ebitda_margin": 0.139,
      "adjustments": [
        {
          "description": "One-time legal fees",
          "amount": 15000,
          "adjustment_type": "add_back",
          "rationale": "Non-recurring lease renegotiation costs",
          "recurrence": "one_time",
          "confidence": "high"
        },
        {
          "description": "Above-market related party rent",
          "amount": 12000,
          "adjustment_type": "add_back",
          "rationale": "Rent to owner LLC exceeds market by $1,000/month",
          "recurrence": "recurring",
          "confidence": "medium"
        },
        {
          "description": "Owner compensation above market",
          "amount": 30000,
          "adjustment_type": "add_back",
          "rationale": "Owner salary of $180K exceeds market rate of $150K for CEO of company this size",
          "recurrence": "recurring",
          "confidence": "medium"
        }
      ],
      "total_adjustments": 57000,
      "adjusted_ebitda": 404000,
      "adjusted_ebitda_margin": 0.162
    },
    {
      "fiscal_year": 2022,
      "reported_net_income": 245000,
      "interest_expense": 14000,
      "income_tax_expense": 0,
      "depreciation": 42000,
      "amortization": 5000,
      "ebitda": 306000,
      "ebitda_margin": 0.136,
      "adjustments": [
        {
          "description": "Above-market related party rent",
          "amount": 12000,
          "adjustment_type": "add_back",
          "rationale": "Rent to owner LLC exceeds market",
          "recurrence": "recurring",
          "confidence": "medium"
        },
        {
          "description": "Owner compensation above market",
          "amount": 15000,
          "adjustment_type": "add_back",
          "rationale": "Owner salary of $165K exceeds market rate of $150K",
          "recurrence": "recurring",
          "confidence": "medium"
        }
      ],
      "total_adjustments": 27000,
      "adjusted_ebitda": 333000,
      "adjusted_ebitda_margin": 0.148
    }
  ],
  "earnings_quality": {
    "overall_quality": "above_average",
    "quality_score": 7.5,
    "revenue_quality": {
      "score": 8,
      "recurring_percentage": 35,
      "concentration_risk": "medium",
      "notes": "35% of revenue from service agreements provides base recurring revenue. Top 5 customers represent 40% of revenue - manageable concentration. Revenue has grown consistently for 3 years."
    },
    "expense_quality": {
      "score": 7,
      "discretionary_percentage": 12,
      "normalized_percentage": 18,
      "notes": "Approximately 18% of expenses required normalization, primarily owner compensation and related party rent. Expense structure is typical for industry."
    },
    "earnings_consistency": {
      "score": 8,
      "coefficient_of_variation": 0.08,
      "trend": "improving",
      "notes": "SDE has grown from $525K to $601K (14% increase) with low volatility. Consistent improvement driven by revenue growth and stable margins."
    },
    "cash_flow_correlation": {
      "score": 7,
      "earnings_to_cash_flow_ratio": 0.92,
      "notes": "Strong correlation between earnings and cash flow. Working capital needs are modest. No significant non-cash revenue recognition issues."
    },
    "earnings_sustainability": {
      "sustainable_percentage": 90,
      "at_risk_items": [
        {
          "item": "Top customer concentration",
          "amount": 150000,
          "risk_level": "medium",
          "reason": "Largest customer represents 15% of revenue. Loss would impact SDE by approximately $50K"
        },
        {
          "item": "Owner relationship-dependent revenue",
          "amount": 75000,
          "risk_level": "medium",
          "reason": "Estimated 10% of revenue tied to owner's personal relationships"
        }
      ]
    }
  },
  "summary": {
    "most_recent_sde": 600900,
    "weighted_average_sde": 569388,
    "sde_weighting_method": "recent_weighted",
    "sde_weights": [
      { "year": 2022, "weight": 0.4 },
      { "year": 2023, "weight": 0.6 }
    ],
    "sde_trend": "growing",
    "sde_cagr": 0.144,
    "most_recent_ebitda": 404000,
    "weighted_average_ebitda": 375600,
    "ebitda_trend": "growing",
    "ebitda_cagr": 0.213,
    "total_adjustments_most_recent": 315900,
    "adjustment_categories": [
      { "category": "Owner Compensation & Benefits", "total_amount": 212400, "percentage_of_sde": 35.3 },
      { "category": "Non-Cash (D&A)", "total_amount": 50000, "percentage_of_sde": 8.3 },
      { "category": "Interest", "total_amount": 12000, "percentage_of_sde": 2.0 },
      { "category": "One-Time Items", "total_amount": 15000, "percentage_of_sde": 2.5 },
      { "category": "Discretionary", "total_amount": 14500, "percentage_of_sde": 2.4 },
      { "category": "Related Party", "total_amount": 12000, "percentage_of_sde": 2.0 }
    ]
  },
  "normalization_confidence": {
    "overall": "high",
    "major_assumptions": [
      "Owner vehicle personal use estimated at 60% based on industry norms and lack of mileage logs",
      "Market rent estimate based on similar commercial properties in area",
      "Personal portion of meals & entertainment estimated at 33% based on expense review"
    ],
    "areas_of_uncertainty": [
      "Exact personal use percentage of company vehicle",
      "Whether all charitable contributions are truly owner discretionary"
    ],
    "sensitivity_to_assumptions": "low"
  },
  "recommended_benefit_stream": {
    "metric": "sde",
    "value": 569388,
    "rationale": "Recommend using weighted average SDE of $569,388 as the primary benefit stream for valuation. Weighting of 60% to 2023 and 40% to 2022 reflects the improving trend while acknowledging year-over-year consistency. SDE is the appropriate metric for a business of this size where a buyer would likely be an owner-operator. The SDE margin of 24% exceeds industry median of 18%, reflecting strong operational management."
  },
  "extraction_metadata": {
    "processing_time_ms": 0,
    "tokens_used": 0
  }
}

## CRITICAL INSTRUCTIONS

1. **DOCUMENT EVERY ADD-BACK**: Each adjustment must have description, amount, source reference, and detailed rationale.

2. **BE CONSERVATIVE**: When uncertain about personal vs. business use, err on the side of lower add-backs. Document your reasoning.

3. **CITE SPECIFIC SOURCES**: Reference exact tax form lines (e.g., "1120-S Line 7") or financial statement line items.

4. **CATEGORIZE CORRECTLY**: Use the correct adjustment_type (add_back, deduction, normalization) and recurrence (one_time, recurring, partially_recurring).

5. **CALCULATE ACCURATELY**: Double-check that add-backs sum correctly and that SDE = Net Income + Total Add-backs - Deductions.

6. **JUSTIFY OWNER COMP**: The owner compensation add-back is typically the largest. Document salary, benefits, perks separately.

7. **ADDRESS COMPENSATION NORMALIZATION**: If owner takes below-market compensation, you MUST show a negative adjustment (deduction).

8. **MULTI-YEAR CONSISTENCY**: Apply similar logic across years. If you add back rent in one year, do it in all years.

9. **COMPARE TO BENCHMARKS**: Reference industry benchmarks from Pass 4 when assessing margins and earnings quality.

10. **WEIGHTED AVERAGE**: Use appropriate weighting (equal, recent-weighted, or single-year) and explain your choice.

11. **OUTPUT ONLY JSON**: Your entire response must be valid JSON. No text before or after.

Now calculate the complete earnings normalization.`;

export const pass5PromptConfig = {
  passNumber: 5,
  passName: 'Earnings Normalization (SDE/EBITDA)',
  systemPrompt: PASS_5_SYSTEM_PROMPT,
  userPrompt: PASS_5_USER_PROMPT,
  expectedOutputType: 'Pass5Output' as const,
  maxTokens: 8192,
  temperature: 0.2,
};

export default pass5PromptConfig;
