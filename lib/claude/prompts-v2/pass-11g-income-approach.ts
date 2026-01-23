/**
 * Pass 11g: Income Approach Narrative
 *
 * Expert: Certified Valuation Analyst (CVA)
 * Word Count: 500-600 words
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export const PASS_11G_SYSTEM_PROMPT = `You are a Certified Valuation Analyst (CVA) with deep expertise in the income approach to business valuation. You specialize in capitalizing earnings and building defensible discount rates.

Your task is to write the Income Approach section of a business valuation report. This section must:
- Explain the capitalization of earnings methodology
- Detail the benefit stream selection (SDE vs EBITDA)
- Walk through the discount rate build-up
- Present the indicated value with implied multiples
- Defend the approach's relevance for this business

You balance technical rigor with accessibility, making complex financial concepts understandable.

CRITICAL: Return ONLY valid JSON. No markdown code fences.`;

export function buildPass11gPrompt(incomeApproach: any): string {
  return `## INCOME APPROACH TASK

Write a comprehensive Income Approach narrative (500-600 words) for this valuation report.

## INCOME APPROACH DATA

**Benefit Stream**:
- Type Selected: ${incomeApproach.benefit_stream_type || 'SDE'} (SDE or EBITDA)
- Amount: $${incomeApproach.benefit_stream?.toLocaleString() || 'N/A'}
- Calculation Basis: ${incomeApproach.calculation_basis || 'Weighted average of historical years'}

**Discount Rate Build-Up**:
| Component | Rate | Rationale |
|-----------|------|-----------|
| Risk-Free Rate | ${((incomeApproach.discount_rate?.risk_free || 0.04) * 100).toFixed(2)}% | ${incomeApproach.discount_rate?.risk_free_source || '20-Year Treasury'} |
| Equity Risk Premium | ${((incomeApproach.discount_rate?.equity_risk_premium || 0.06) * 100).toFixed(2)}% | ${incomeApproach.discount_rate?.erp_source || 'Duff & Phelps'} |
| Size Premium | ${((incomeApproach.discount_rate?.size_premium || 0.06) * 100).toFixed(2)}% | Based on revenue of $${incomeApproach.company_revenue?.toLocaleString() || 'N/A'} |
| Industry Premium | ${((incomeApproach.discount_rate?.industry_premium || 0.02) * 100).toFixed(2)}% | ${incomeApproach.industry_name || 'Industry analysis'} |
| Company-Specific | ${((incomeApproach.discount_rate?.company_specific || 0.04) * 100).toFixed(2)}% | See risk assessment |
| **Total Discount Rate** | **${((incomeApproach.discount_rate?.total || 0.22) * 100).toFixed(2)}%** | |

**Capitalization Rate**:
- Long-Term Growth Rate: ${((incomeApproach.growth_rate || 0.03) * 100).toFixed(1)}%
- Capitalization Rate: ${((incomeApproach.cap_rate || 0.19) * 100).toFixed(2)}% (Discount Rate - Growth)

**Valuation Calculation**:
- ${incomeApproach.benefit_stream_type || 'SDE'}: $${incomeApproach.benefit_stream?.toLocaleString() || 'N/A'}
- / Cap Rate: ${((incomeApproach.cap_rate || 0.19) * 100).toFixed(2)}%
- = Operating Value: $${incomeApproach.operating_value?.toLocaleString() || 'N/A'}
- + Excess Working Capital: $${incomeApproach.excess_working_capital?.toLocaleString() || '0'}
- **Indicated Value**: $${incomeApproach.indicated_value?.toLocaleString() || 'Pending calculation'}

**Implied Multiple**: ${incomeApproach.implied_multiple?.toFixed(1) || 'N/A'}x ${incomeApproach.benefit_stream_type || 'SDE'}

**Weighting Recommendation**: ${incomeApproach.weight_recommendation || 50}%

## STRUCTURE REQUIREMENTS

Your Income Approach narrative must include:

1. **Methodology Overview** (75 words): What income approach measures, why it's primary for operating businesses.

2. **Benefit Stream Selection** (75 words): Why SDE or EBITDA was selected, how it was calculated.

3. **Discount Rate Build-Up** (150 words): Walk through each component, justify the rates.

4. **Capitalization Calculation** (100 words): Show the math, explain the growth rate assumption.

5. **Indicated Value** (50 words): State the result, any adjustments for excess assets.

6. **Implied Multiple Check** (50 words): Compare implied multiple to market data as reasonableness test.

## OUTPUT FORMAT

{
  "section": "income_approach_narrative",
  "word_count": number,
  "content": "The full 500-600 word income approach narrative...",
  "key_figures": {
    "benefit_stream": number,
    "cap_rate": number,
    "indicated_value": number,
    "implied_multiple": number
  }
}`;
}

export const pass11gConfig = {
  passNumber: '11g',
  passName: 'Income Approach Narrative',
  systemPrompt: PASS_11G_SYSTEM_PROMPT,
  userPromptBuilder: buildPass11gPrompt,
  maxTokens: 2048,
  temperature: 0.2,
  dependencies: [8],
  runOrder: 6,
};

export default pass11gConfig;
