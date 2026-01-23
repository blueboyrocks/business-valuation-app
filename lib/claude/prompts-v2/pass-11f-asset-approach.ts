/**
 * Pass 11f: Asset Approach Narrative
 *
 * Expert: Certified Senior Appraiser (ASA)
 * Word Count: 500-600 words
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export const PASS_11F_SYSTEM_PROMPT = `You are a Certified Senior Appraiser (ASA) specializing in business valuation with deep expertise in the asset-based approach. You have valued tangible and intangible assets for hundreds of businesses.

Your task is to write the Asset Approach section of a business valuation report. This section must:
- Explain the asset approach methodology clearly
- Detail each significant adjustment from book to fair market value
- Justify each adjustment with sound reasoning
- Present the indicated value with appropriate context
- Explain when this approach is most/least relevant

You write with technical precision while remaining accessible to non-appraisers.

CRITICAL: Return ONLY valid JSON. No markdown code fences.`;

export function buildPass11fPrompt(assetApproach: any): string {
  return `## ASSET APPROACH TASK

Write a comprehensive Asset Approach narrative (500-600 words) for this valuation report.

## ASSET APPROACH DATA

**Starting Point**:
- Book Value of Equity: $${assetApproach.book_equity?.toLocaleString() || 'N/A'}
- Total Assets (Book): $${assetApproach.total_assets_book?.toLocaleString() || 'N/A'}
- Total Liabilities: $${assetApproach.total_liabilities?.toLocaleString() || 'N/A'}

**Asset Adjustments**:
${Array.isArray(assetApproach.adjustments) ? assetApproach.adjustments.map((adj: any) => `
- **${adj.asset_category}**: Book $${adj.book_value?.toLocaleString() || 'N/A'} -> FMV $${adj.fair_market_value?.toLocaleString() || 'N/A'} (Adjustment: ${adj.adjustment >= 0 ? '+' : ''}$${adj.adjustment?.toLocaleString() || '0'})
  - Rationale: ${adj.rationale || 'Fair value assessment'}
`).join('\n') : '- Adjustments pending analysis'}

**Liability Adjustments**:
${Array.isArray(assetApproach.liability_adjustments) ? assetApproach.liability_adjustments.map((adj: any) => `
- ${adj.description}: ${adj.adjustment >= 0 ? '+' : ''}$${adj.adjustment?.toLocaleString() || '0'}
`).join('\n') : '- No liability adjustments required'}

**Summary**:
- Total Asset Adjustments: ${(assetApproach.total_asset_adjustments || 0) >= 0 ? '+' : ''}$${assetApproach.total_asset_adjustments?.toLocaleString() || '0'}
- Total Liability Adjustments: ${(assetApproach.total_liability_adjustments || 0) >= 0 ? '+' : ''}$${assetApproach.total_liability_adjustments?.toLocaleString() || '0'}
- **Adjusted Net Asset Value**: $${assetApproach.indicated_value?.toLocaleString() || 'Pending calculation'}

**Liquidation Scenarios**:
- Orderly Liquidation (6-month): $${assetApproach.orderly_liquidation?.toLocaleString() || 'N/A'}
- Forced Liquidation: $${assetApproach.forced_liquidation?.toLocaleString() || 'N/A'}

**Weighting Recommendation**: ${assetApproach.weight_recommendation || 15}%
**Rationale**: ${assetApproach.weight_rationale || 'Operating business primarily valued on earnings capacity'}

## STRUCTURE REQUIREMENTS

Your Asset Approach narrative must include:

1. **Methodology Overview** (75 words): What the asset approach measures, when it's most applicable.

2. **Starting Point** (50 words): Book value of equity, basis for adjustments.

3. **Key Adjustments** (200 words): Detail the 2-3 most significant adjustments with full rationale.

4. **Minor Adjustments** (75 words): Summarize smaller adjustments.

5. **Indicated Value** (75 words): State the adjusted net asset value, what it represents.

6. **Relevance Assessment** (75 words): Why this approach does/doesn't receive heavy weighting for this business.

## OUTPUT FORMAT

{
  "section": "asset_approach_narrative",
  "word_count": number,
  "content": "The full 500-600 word asset approach narrative...",
  "key_figures": {
    "book_equity": number,
    "adjusted_nav": number,
    "total_adjustments": number
  }
}`;
}

export const pass11fConfig = {
  passNumber: '11f',
  passName: 'Asset Approach Narrative',
  systemPrompt: PASS_11F_SYSTEM_PROMPT,
  userPromptBuilder: buildPass11fPrompt,
  maxTokens: 2048,
  temperature: 0.2,
  dependencies: [7],
  runOrder: 5,
};

export default pass11fConfig;
