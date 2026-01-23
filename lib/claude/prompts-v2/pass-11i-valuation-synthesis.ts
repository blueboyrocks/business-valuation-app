/**
 * Pass 11i: Valuation Synthesis
 *
 * Expert: Lead Valuation Partner
 * Word Count: 700-900 words
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export const PASS_11I_SYSTEM_PROMPT = `You are the Lead Partner at a prestigious business valuation firm, responsible for reviewing and signing off on final valuation conclusions. You synthesize multiple approaches into a defensible, well-reasoned conclusion.

Your task is to write the Valuation Synthesis section of a business valuation report. This section must:
- Define the standard and premise of value
- Explain the weighting rationale for each approach
- Detail any discounts or premiums applied
- Present the final concluded value with a range
- Assess confidence in the conclusion

You write with the authority of someone who must defend this conclusion to attorneys, the IRS, or in court.

CRITICAL: Return ONLY valid JSON. No markdown code fences.`;

export function buildPass11iPrompt(
  valuationResults: any,
  approachNarratives: Record<string, string>
): string {
  return `## VALUATION SYNTHESIS TASK

Write a comprehensive Valuation Synthesis (700-900 words) for this valuation report.

## APPROACH INDICATIONS

| Approach | Indicated Value | Weight | Weighted Value |
|----------|-----------------|--------|----------------|
| Asset Approach | $${valuationResults.asset_value?.toLocaleString() || 'N/A'} | ${valuationResults.asset_weight || 0}% | $${valuationResults.asset_weighted?.toLocaleString() || 'N/A'} |
| Income Approach | $${valuationResults.income_value?.toLocaleString() || 'N/A'} | ${valuationResults.income_weight || 0}% | $${valuationResults.income_weighted?.toLocaleString() || 'N/A'} |
| Market Approach | $${valuationResults.market_value?.toLocaleString() || 'N/A'} | ${valuationResults.market_weight || 0}% | $${valuationResults.market_weighted?.toLocaleString() || 'N/A'} |
| **Weighted Average** | | 100% | **$${valuationResults.weighted_average?.toLocaleString() || 'N/A'}** |

## DISCOUNTS & PREMIUMS

**Discount for Lack of Marketability (DLOM)**:
- Applied: ${valuationResults.dlom_applied ? 'Yes' : 'No'}
- Rate: ${((valuationResults.dlom_rate || 0) * 100).toFixed(0)}%
- Amount: $${valuationResults.dlom_amount?.toLocaleString() || '0'}
- Rationale: ${valuationResults.dlom_rationale || 'Standard DLOM for closely-held business'}

**Control Premium/Discount**:
- Applied: ${valuationResults.control_adjustment ? 'Yes' : 'No'}
- Note: ${valuationResults.control_note || 'Valuing 100% controlling interest - no adjustment required'}

## FINAL CONCLUSION

**Concluded Fair Market Value**: $${valuationResults.concluded_value?.toLocaleString() || 'Pending'}

**Valuation Range**: $${valuationResults.value_range_low?.toLocaleString() || 'N/A'} - $${valuationResults.value_range_high?.toLocaleString() || 'N/A'}

**Implied Multiples**:
- SDE Multiple: ${valuationResults.implied_sde_multiple?.toFixed(1) || 'N/A'}x
- Revenue Multiple: ${valuationResults.implied_revenue_multiple?.toFixed(2) || 'N/A'}x

**Confidence Level**: ${valuationResults.confidence_level || 'Medium'}
**Confidence Rationale**: ${valuationResults.confidence_rationale || 'Based on quality of financial data and market comparable availability'}

## PRIOR APPROACH NARRATIVES (for reference)

**Asset Approach Summary**: ${approachNarratives.asset?.slice(0, 300) || 'Pending'}...
**Income Approach Summary**: ${approachNarratives.income?.slice(0, 300) || 'Pending'}...
**Market Approach Summary**: ${approachNarratives.market?.slice(0, 300) || 'Pending'}...

## STRUCTURE REQUIREMENTS

Your Valuation Synthesis must include:

1. **Standard of Value** (100 words): Define fair market value, hypothetical buyer/seller construct.

2. **Premise of Value** (75 words): Going concern vs. liquidation, why this premise applies.

3. **Approach Reconciliation** (200 words): Why the approaches diverge, which is most reliable for this business.

4. **Weighting Rationale** (150 words): Justify the weight given to each approach.

5. **Discounts & Premiums** (100 words): DLOM rationale, control considerations.

6. **Final Conclusion** (150 words): State the value, the range, what gives you confidence.

7. **Sensitivity Factors** (75 words): What could cause value to be higher or lower.

## OUTPUT FORMAT

{
  "section": "valuation_synthesis",
  "word_count": number,
  "content": "The full 700-900 word valuation synthesis...",
  "conclusion": {
    "concluded_value": number,
    "value_range_low": number,
    "value_range_high": number,
    "confidence_level": "string"
  }
}`;
}

export const pass11iConfig = {
  passNumber: '11i',
  passName: 'Valuation Synthesis',
  systemPrompt: PASS_11I_SYSTEM_PROMPT,
  userPromptBuilder: buildPass11iPrompt,
  maxTokens: 2048,
  temperature: 0.2,
  dependencies: [10, '11f', '11g', '11h'],
  runOrder: 8,
};

export default pass11iConfig;
