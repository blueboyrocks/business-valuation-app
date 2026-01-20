/**
 * Pass 3: Earnings Normalization Prompt
 *
 * This pass calculates SDE and EBITDA with comprehensive documentation
 * of every adjustment, handles multiple years with weighted averages,
 * and assesses earnings quality.
 */

export const pass3Prompt = `You are a business valuation analyst specializing in earnings normalization. Calculate Seller's Discretionary Earnings (SDE) and EBITDA with meticulous documentation of every adjustment.

## SDE CALCULATION

Seller's Discretionary Earnings represents the total financial benefit available to a single owner-operator. Use this formula:

**SDE = Net Income + Owner Compensation + Interest + Depreciation + Amortization + Non-Recurring Expenses + Owner Perks**

### For EACH Add-Back, Document:

1. **Category** - One of:
   - "Owner Compensation" (salary, benefits, payroll taxes)
   - "Depreciation/Amortization" (non-cash expenses)
   - "Interest" (financing costs)
   - "Non-Recurring" (one-time expenses)
   - "Personal Expenses" (owner perks run through business)
   - "Related Party" (above-market payments to family/entities)

2. **Description** - Specific explanation (e.g., "Owner salary - sole shareholder and operator")

3. **Amount** - Exact dollar amount (whole dollars)

4. **Source Line** - Where this came from:
   - Tax returns: "Form 1120-S, Line 7" or "Form 1065, Line 10"
   - Financial statements: "P&L - Officer Salary line" or "Income Statement - Depreciation"
   - Calculated: "Calculated: $150,000 × 7.65% employer FICA"

5. **Justification** - Why this is a valid add-back (e.g., "Owner's salary is added back as SDE represents total benefit to owner-operator")

### Common Add-Backs to Identify:

**Owner Compensation:**
- Officer/owner salary (Line 7 on 1120-S, Line 12 on 1120, Line 10 guaranteed payments on 1065)
- Employer payroll taxes on owner salary (7.65% FICA)
- Owner health insurance premiums
- Owner retirement contributions (401k, SEP, profit sharing)
- Owner life/disability insurance

**Non-Cash Expenses:**
- Depreciation (Line 14 on 1120-S)
- Amortization
- Section 179 expense (Schedule K, Line 11)

**Financing:**
- Interest expense (Line 13 on 1120-S)

**Owner Perks (review "Other Deductions"):**
- Personal portion of vehicle expenses (typically 50%)
- Personal travel expenses
- Personal meals/entertainment (typically 50-100%)
- Club memberships
- Personal cell phone
- Home office deduction (Schedule C, Line 30)

**Non-Recurring:**
- One-time legal fees (litigation, settlements)
- One-time consulting fees
- Moving/relocation costs
- Loss on asset sales
- Unusual bad debt write-offs

**Related Party:**
- Rent above market rate paid to owner's entity
- Excess compensation to family members

## EBITDA CALCULATION

Calculate EBITDA for comparison, especially useful for larger businesses:

**EBITDA = Net Income + Interest + Taxes + Depreciation + Amortization**

Then apply owner compensation adjustment:
- If owner is paid above market rate → add back the excess
- If owner is paid below market rate → subtract the shortfall
- Market rate for general manager typically $60,000-$150,000 depending on company size and role

## MULTIPLE YEAR HANDLING

If 2-3 years of data are present, calculate weighted average:

**Standard Weighting:**
- Most recent year: 3x weight (50%)
- Prior year: 2x weight (33%)
- Two years ago: 1x weight (17%)

**Formula:** (Year1 × 3 + Year2 × 2 + Year3 × 1) ÷ 6

Calculate SDE for EACH year using consistent methodology, then apply weights.

**When to adjust weighting:**
- COVID-affected years (2020-2021): May warrant reduced weight
- Turnaround year: May weight recent performance more heavily
- Major operational change: Explain deviation from standard

## EARNINGS QUALITY ASSESSMENT

Rate the quality of normalized earnings:

**Quality Score:** "High", "Medium", or "Low"

**Factors to evaluate:**
- Revenue consistency (variation under 15% = High)
- Margin reasonableness vs. industry benchmarks
- Record quality and documentation
- Add-back proportion (high add-backs relative to net income = concern)
- Presence of unusual or one-time items
- Trend direction (improving vs. declining)

List 3-5 specific factors supporting your quality score.

## EARNINGS NARRATIVE

Write a 500-800 word narrative covering:

**Paragraph 1 - SDE Summary (100-150 words):**
- Starting net income
- Total add-backs by category
- Final SDE figure
- SDE margin (SDE ÷ Revenue)

**Paragraph 2 - EBITDA Summary (80-120 words):**
- EBITDA calculation
- Owner compensation adjustment rationale
- Market rate salary determination

**Paragraph 3 - Key Add-Backs (100-150 words):**
- Most significant add-backs
- Any add-backs requiring estimation
- Items NOT added back and why
- Confidence level

**Paragraph 4 - Multi-Year Trend (100-150 words):**
- Year-over-year changes
- Trend direction
- Weighting rationale
- Growth rate calculation

**Paragraph 5 - Earnings Quality (100-150 words):**
- Quality rating and evidence
- Sustainability assessment
- Red flags or concerns
- Strengths noted

## OUTPUT FORMAT

Respond with ONLY valid JSON matching this exact structure:

{
  "analysis": {
    "sde_calculation": {
      "periods": [
        {
          "period": "2024",
          "starting_net_income": 150000,
          "adjustments": [
            {
              "category": "Owner Compensation",
              "description": "Officer compensation - sole owner-operator",
              "amount": 120000,
              "source_line": "Form 1120-S, Line 7",
              "justification": "Owner's salary is added back as SDE represents total benefit to owner-operator. New owner would pay themselves from SDE."
            },
            {
              "category": "Owner Compensation",
              "description": "Employer payroll taxes on owner salary",
              "amount": 9180,
              "source_line": "Calculated: $120,000 × 7.65%",
              "justification": "Employer FICA taxes on owner compensation are an owner benefit."
            },
            {
              "category": "Depreciation/Amortization",
              "description": "Depreciation expense on fixed assets",
              "amount": 25000,
              "source_line": "Form 1120-S, Line 14",
              "justification": "Non-cash expense that does not reduce cash available to owner."
            },
            {
              "category": "Interest",
              "description": "Interest expense on business debt",
              "amount": 8000,
              "source_line": "Form 1120-S, Line 13",
              "justification": "Financing cost added back; buyer may have different capital structure."
            },
            {
              "category": "Personal Expenses",
              "description": "Personal portion of vehicle expenses (50%)",
              "amount": 6000,
              "source_line": "Other Deductions - Vehicle expenses $12,000 total",
              "justification": "Industry standard 50% personal use for owner vehicle."
            },
            {
              "category": "Non-Recurring",
              "description": "Legal fees for one-time contract dispute",
              "amount": 12000,
              "source_line": "Other Deductions - Legal fees",
              "justification": "One-time litigation expense, resolved, not expected to recur."
            }
          ],
          "total_adjustments": 180180,
          "sde": 330180
        },
        {
          "period": "2023",
          "starting_net_income": 135000,
          "adjustments": [],
          "total_adjustments": 165000,
          "sde": 300000
        }
      ],
      "weighted_average_sde": 318072,
      "weighting_method": "Standard weighting: Most recent year 3x (50%), prior year 2x (33%), earliest 1x (17%). Applied to 2 years as (2024×3 + 2023×2) ÷ 5 = $318,072"
    },
    "ebitda_calculation": {
      "periods": [
        {
          "period": "2024",
          "starting_net_income": 150000,
          "add_interest": 8000,
          "add_taxes": 0,
          "add_depreciation": 25000,
          "add_amortization": 0,
          "owner_comp_adjustment": 30000,
          "adjusted_ebitda": 213000
        },
        {
          "period": "2023",
          "starting_net_income": 135000,
          "add_interest": 9000,
          "add_taxes": 0,
          "add_depreciation": 22000,
          "add_amortization": 0,
          "owner_comp_adjustment": 28000,
          "adjusted_ebitda": 194000
        }
      ],
      "weighted_average_ebitda": 205400
    },
    "earnings_quality_assessment": {
      "quality_score": "High",
      "factors": [
        "Revenue grew consistently 8% year-over-year",
        "SDE margins stable at 22-24% across both years",
        "Add-backs are standard and well-documented",
        "No unusual or questionable adjustments required",
        "Clean financial records with clear source documentation"
      ]
    },
    "earnings_narrative": "The earnings normalization analysis for [Company Name] reveals a healthy business with sustainable cash flows..."
  },
  "knowledge_requests": {
    "industry_specific": [],
    "tax_form_specific": [],
    "risk_factors": ["owner_dependence", "customer_concentration"],
    "comparable_industries": [],
    "benchmarks_needed": ["market_rate_salary", "sde_multiple_range"]
  },
  "knowledge_reasoning": "For Pass 4, I need to assess owner dependence risk given the owner's active role. For Pass 5, I need confirmed valuation multiples to apply to the normalized SDE of $318,072."
}

## IMPORTANT INSTRUCTIONS

1. Output ONLY the JSON object - no markdown, no explanation
2. Document EVERY add-back with all 5 required fields
3. Be conservative - only include clearly justified adjustments
4. Ensure SDE = Net Income + Total Adjustments (verify math)
5. Calculate SDE margin as SDE ÷ Revenue
6. For S-Corps, taxes = 0 (pass-through entity)
7. Owner comp adjustment for EBITDA = Actual Owner Comp - Market Rate Salary
8. If multiple years available, provide data for EACH year
9. The earnings_narrative should be 500-800 words - substantial analysis
10. Request knowledge needed for Pass 4 (risk) and Pass 5 (valuation)

Now calculate normalized earnings for the business described in the provided context.`;

/**
 * System context for Pass 3
 */
export const pass3SystemContext = `You are an expert business valuation analyst specializing in earnings normalization. Your role is to calculate Seller's Discretionary Earnings (SDE) and EBITDA with meticulous documentation.

Key priorities:
1. ACCURACY: Every calculation must be verifiable
2. DOCUMENTATION: Every add-back needs category, description, amount, source, justification
3. CONSERVATISM: Only include clearly justified adjustments
4. CONSISTENCY: Apply same methodology across all years

You have expertise in:
- SDE and EBITDA calculations
- Tax return line item identification (1120-S, 1120, 1065, Schedule C)
- Common add-backs and their justifications
- Owner compensation analysis
- Earnings quality assessment`;

/**
 * Build Pass 3 prompt with context from previous passes
 */
export function buildPass3Prompt(
  pass1Summary: string,
  pass2Summary: string,
  injectedKnowledge: string
): string {
  return `${pass3Prompt}

## CONTEXT FROM PASS 1 (EXTRACTED FINANCIAL DATA)

${pass1Summary}

## CONTEXT FROM PASS 2 (INDUSTRY ANALYSIS)

${pass2Summary}

## INJECTED KNOWLEDGE

${injectedKnowledge || 'No additional knowledge available. Use standard add-back methodology.'}

Calculate SDE and EBITDA for this business with complete documentation.`;
}

/**
 * Create summary of Pass 1 financial data for Pass 3
 */
export function summarizePass1ForPass3(pass1Output: unknown): string {
  if (!pass1Output || typeof pass1Output !== 'object') {
    return 'No Pass 1 data available.';
  }

  const data = pass1Output as Record<string, unknown>;
  const analysis = data.analysis as Record<string, unknown> | undefined;

  if (!analysis) {
    return 'No analysis data from Pass 1.';
  }

  const docInfo = analysis.document_info as Record<string, unknown> | undefined;
  const companyInfo = analysis.company_info as Record<string, unknown> | undefined;
  const financialData = analysis.financial_data as Record<string, unknown> | undefined;

  let summary = `### Document Information
- Document Type: ${docInfo?.primary_type || 'Unknown'}
- Entity Type: ${companyInfo?.entity_type || 'Unknown'}

### Financial Data by Year\n`;

  if (financialData) {
    const years = Object.keys(financialData).sort().reverse();

    for (const year of years) {
      const yearData = financialData[year] as Record<string, unknown>;
      const opex = yearData?.operating_expenses as Record<string, unknown> | undefined;
      const bs = yearData?.balance_sheet as Record<string, unknown> | undefined;

      summary += `
**${year}:**
- Revenue: $${((yearData?.revenue as number) || 0).toLocaleString()}
- COGS: $${((yearData?.cost_of_goods_sold as number) || 0).toLocaleString()}
- Gross Profit: $${((yearData?.gross_profit as number) || 0).toLocaleString()}
- Owner Compensation: $${((yearData?.owner_compensation as number) || 0).toLocaleString()} ← ADD BACK
- Depreciation: $${((opex?.depreciation as number) || 0).toLocaleString()} ← ADD BACK
- Interest Expense: $${((opex?.interest_expense as number) || 0).toLocaleString()} ← ADD BACK
- Other Expenses: $${((opex?.other_expenses as number) || 0).toLocaleString()} ← REVIEW
- Net Income: $${((yearData?.net_income as number) || 0).toLocaleString()} ← SDE STARTING POINT
- Source: ${yearData?.source_document || 'Unknown'}
`;
    }
  }

  const qualityFlags = analysis.data_quality_flags as string[] | undefined;
  if (qualityFlags && qualityFlags.length > 0) {
    summary += `\n### Data Quality Notes\n${qualityFlags.map(f => `- ${f}`).join('\n')}`;
  }

  return summary;
}

/**
 * Create summary of Pass 2 industry data for Pass 3
 */
export function summarizePass2ForPass3(pass2Output: unknown): string {
  if (!pass2Output || typeof pass2Output !== 'object') {
    return 'No Pass 2 data available.';
  }

  const data = pass2Output as Record<string, unknown>;
  const analysis = data.analysis as Record<string, unknown> | undefined;

  if (!analysis) {
    return 'No analysis data from Pass 2.';
  }

  const overview = analysis.industry_overview as Record<string, unknown> | undefined;
  const benchmarks = analysis.industry_benchmarks as Record<string, unknown> | undefined;
  const multiples = analysis.valuation_multiples as Record<string, unknown> | undefined;

  const sdeMargin = benchmarks?.sde_margin as Record<string, unknown> | undefined;
  const sdeMultiple = multiples?.sde_multiple as Record<string, unknown> | undefined;

  return `### Industry Context
- Sector: ${overview?.sector || 'Unknown'}
- Subsector: ${overview?.subsector || 'Unknown'}

### Industry Benchmarks
- SDE Margin: ${sdeMargin?.low || '?'} - ${sdeMargin?.high || '?'} (median: ${sdeMargin?.median || '?'})
- SDE Multiple Range: ${sdeMultiple?.low || '?'}x - ${sdeMultiple?.high || '?'}x (typical: ${sdeMultiple?.typical || '?'}x)

### Owner Compensation Context
- Market rate for general manager in this industry: Typically $60,000-$150,000
- Adjust based on company size and owner's specific role`;
}

/**
 * Validate Pass 3 output structure
 */
export function validatePass3Output(output: unknown): { valid: boolean; errors: string[] } {
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

  // Check SDE calculation
  if (!analysis.sde_calculation) {
    errors.push('Missing sde_calculation');
  } else {
    const sde = analysis.sde_calculation as Record<string, unknown>;

    if (!Array.isArray(sde.periods) || sde.periods.length === 0) {
      errors.push('Missing or empty sde_calculation.periods');
    } else {
      const period = (sde.periods as Record<string, unknown>[])[0];
      if (period.starting_net_income === undefined) errors.push('Missing starting_net_income');
      if (!Array.isArray(period.adjustments)) errors.push('Missing adjustments array');
      if (period.sde === undefined) errors.push('Missing sde total');

      // Validate adjustment structure
      if (Array.isArray(period.adjustments) && period.adjustments.length > 0) {
        const adj = (period.adjustments as Record<string, unknown>[])[0];
        if (!adj.category) errors.push('Adjustment missing category');
        if (!adj.description) errors.push('Adjustment missing description');
        if (adj.amount === undefined) errors.push('Adjustment missing amount');
        if (!adj.source_line) errors.push('Adjustment missing source_line');
        if (!adj.justification) errors.push('Adjustment missing justification');
      }
    }

    if (sde.weighted_average_sde === undefined) errors.push('Missing weighted_average_sde');
    if (!sde.weighting_method) errors.push('Missing weighting_method');
  }

  // Check EBITDA calculation
  if (!analysis.ebitda_calculation) {
    errors.push('Missing ebitda_calculation');
  } else {
    const ebitda = analysis.ebitda_calculation as Record<string, unknown>;
    if (!Array.isArray(ebitda.periods) || ebitda.periods.length === 0) {
      errors.push('Missing or empty ebitda_calculation.periods');
    }
    if (ebitda.weighted_average_ebitda === undefined) errors.push('Missing weighted_average_ebitda');
  }

  // Check earnings quality
  if (!analysis.earnings_quality_assessment) {
    errors.push('Missing earnings_quality_assessment');
  } else {
    const quality = analysis.earnings_quality_assessment as Record<string, unknown>;
    if (!quality.quality_score) errors.push('Missing quality_score');
    if (!Array.isArray(quality.factors) || quality.factors.length < 3) {
      errors.push('earnings_quality_assessment.factors must have at least 3 items');
    }
  }

  // Check narrative
  if (!analysis.earnings_narrative || typeof analysis.earnings_narrative !== 'string') {
    errors.push('Missing earnings_narrative');
  } else {
    const wordCount = (analysis.earnings_narrative as string).split(/\s+/).length;
    if (wordCount < 400) {
      errors.push(`earnings_narrative too short: ${wordCount} words (need 500-800)`);
    }
  }

  // Check knowledge requests
  if (!data.knowledge_requests) {
    errors.push('Missing knowledge_requests');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default {
  prompt: pass3Prompt,
  systemContext: pass3SystemContext,
  buildPrompt: buildPass3Prompt,
  summarizePass1: summarizePass1ForPass3,
  summarizePass2: summarizePass2ForPass3,
  validate: validatePass3Output,
};
