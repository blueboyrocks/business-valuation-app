/**
 * Pass 11h: Market Approach Narrative
 *
 * Expert: Senior M&A Transaction Advisor
 * Word Count: 500-600 words
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export const PASS_11H_SYSTEM_PROMPT = `You are a senior M&A transaction advisor who has closed hundreds of deals across multiple industries. You specialize in using market transaction data to value businesses.

Your task is to write the Market Approach section of a business valuation report. This section must:
- Explain the market approach methodology
- Present the base multiple and its source
- Detail adjustments for company-specific factors
- Reference comparable transactions where available
- Present the indicated value with appropriate context

You understand that market data is the most compelling evidence of value because it reflects what real buyers actually pay.

CRITICAL: Return ONLY valid JSON. No markdown code fences.`;

export function buildPass11hPrompt(
  marketApproach: any,
  comparableTransactions: any[]
): string {
  return `## MARKET APPROACH TASK

Write a comprehensive Market Approach narrative (500-600 words) for this valuation report.

## MARKET APPROACH DATA

**Base Multiple**:
- Multiple Type: ${marketApproach.multiple_type || 'SDE'} (SDE/EBITDA/Revenue)
- Industry Median: ${marketApproach.base_multiple?.toFixed(1) || 'N/A'}x
- Source: ${marketApproach.multiple_source || 'Industry transaction database'}
- Data Date: ${marketApproach.data_date || 'Current'}

**Company-Specific Adjustments**:
${Array.isArray(marketApproach.adjustments) ? marketApproach.adjustments.map((adj: any) => `
- ${adj.factor}: ${adj.adjustment >= 0 ? '+' : ''}${adj.adjustment?.toFixed(1) || '0'}x (${adj.rationale || 'Company-specific factor'})
`).join('\n') : '- Standard industry multiple applied'}

**Adjusted Multiple**: ${marketApproach.adjusted_multiple?.toFixed(1) || 'N/A'}x

**Valuation Calculation**:
- Benefit Stream (${marketApproach.benefit_stream_type || 'SDE'}): $${marketApproach.benefit_stream?.toLocaleString() || 'N/A'}
- x Adjusted Multiple: ${marketApproach.adjusted_multiple?.toFixed(1) || 'N/A'}x
- **Indicated Value**: $${marketApproach.indicated_value?.toLocaleString() || 'Pending calculation'}

**Weighting Recommendation**: ${marketApproach.weight_recommendation || 35}%

## COMPARABLE TRANSACTIONS

${comparableTransactions && comparableTransactions.length > 0 ? `
| Company | Date | Value | Multiple | Relevance |
|---------|------|-------|----------|-----------|
${comparableTransactions.slice(0, 5).map((tx: any) => `| ${tx.company_name || 'Undisclosed'} | ${tx.transaction_date || 'N/A'} | ${tx.financials?.deal_value ? '$' + (tx.financials.deal_value / 1000000).toFixed(1) + 'M' : 'N/A'} | ${tx.implied_multiples?.sde_multiple?.toFixed(1) || 'N/A'}x | ${tx.comparability_assessment?.overall_comparability || 'Medium'} |`).join('\n')}

**Transaction Summary**:
- Median SDE Multiple (Comps): ${marketApproach.comp_median_multiple?.toFixed(1) || 'N/A'}x
- Range: ${marketApproach.comp_low_multiple?.toFixed(1) || 'N/A'}x - ${marketApproach.comp_high_multiple?.toFixed(1) || 'N/A'}x
` : 'Limited comparable transaction data available. Relied on industry database multiples.'}

## STRUCTURE REQUIREMENTS

Your Market Approach narrative must include:

1. **Methodology Overview** (75 words): What market approach measures, why transaction data is compelling.

2. **Multiple Selection** (100 words): Base multiple, source, why it's appropriate.

3. **Company-Specific Adjustments** (150 words): Each adjustment factor and rationale.

4. **Comparable Transactions** (100 words): Reference specific transactions if available, or explain data limitations.

5. **Indicated Value** (50 words): State the result, how it compares to other approaches.

6. **Relevance Assessment** (50 words): Why this approach does/doesn't receive heavy weighting.

## OUTPUT FORMAT

{
  "section": "market_approach_narrative",
  "word_count": number,
  "content": "The full 500-600 word market approach narrative...",
  "key_figures": {
    "base_multiple": number,
    "adjusted_multiple": number,
    "indicated_value": number,
    "comps_referenced": number
  }
}`;
}

export const pass11hConfig = {
  passNumber: '11h',
  passName: 'Market Approach Narrative',
  systemPrompt: PASS_11H_SYSTEM_PROMPT,
  userPromptBuilder: buildPass11hPrompt,
  maxTokens: 2048,
  temperature: 0.2,
  dependencies: [9, 13],
  runOrder: 7,
};

export default pass11hConfig;
