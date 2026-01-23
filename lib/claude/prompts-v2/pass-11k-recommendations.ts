/**
 * Pass 11k: Value Enhancement Recommendations
 *
 * Expert: Senior Strategy Consultant (McKinsey/BCG background)
 * Word Count: 600-800 words
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export const PASS_11K_SYSTEM_PROMPT = `You are a senior strategy consultant who spent 15 years at McKinsey and BCG advising on M&A transactions and value creation. You now specialize in helping business owners maximize their company's value before a sale.

Your task is to write the Value Enhancement Recommendations section. This section must:
- Provide specific, actionable recommendations (not generic advice)
- Prioritize by impact and feasibility
- Estimate potential value impact where possible
- Connect recommendations to the risk factors and valuation analysis
- Give the business owner a clear roadmap

You write as a trusted advisor who genuinely wants to help the owner build wealth.

CRITICAL: Return ONLY valid JSON. No markdown code fences.`;

export function buildPass11kPrompt(
  companyProfile: any,
  financialData: any,
  riskAssessment: any,
  valuationResults: any
): string {
  return `## VALUE ENHANCEMENT RECOMMENDATIONS TASK

Write actionable Value Enhancement Recommendations (600-800 words) for this valuation report.

## COMPANY CONTEXT

**Company**: ${companyProfile.legal_name || companyProfile.company_name || 'Subject Company'}
**Industry**: ${companyProfile.industry_name || 'Not specified'}
**Revenue**: $${financialData.revenue?.toLocaleString() || 'Not specified'}
**Current Valuation**: $${valuationResults.concluded_value?.toLocaleString() || 'Pending'}
**Implied SDE Multiple**: ${valuationResults.implied_sde_multiple?.toFixed(1) || 'N/A'}x

## KEY RISK FACTORS TO ADDRESS

${Array.isArray(riskAssessment.top_risks) ? riskAssessment.top_risks.map((r: any) => `
**${r.factor || r}** (Score: ${r.score || 'N/A'}/5)
- Current State: ${r.current_state || 'See risk analysis'}
- Impact on Value: ${r.value_impact || 'Negative pressure on multiple'}
`).join('\n') : '- Customer concentration\n- Owner dependence\n- Key employee risk'}

## VALUE DRIVERS TO LEVERAGE

${Array.isArray(riskAssessment.value_drivers) ? riskAssessment.value_drivers.map((d: string) => `- ${d}`).join('\n') : '- Established market position\n- Consistent financial performance\n- Growth potential'}

## FINANCIAL METRICS TO IMPROVE

| Metric | Current | Industry Median | Gap |
|--------|---------|-----------------|-----|
| Gross Margin | ${((financialData.gross_margin || 0) * 100).toFixed(1)}% | ${((financialData.industry_gross_margin || 0.35) * 100).toFixed(1)}% | ${(((financialData.gross_margin || 0) - (financialData.industry_gross_margin || 0.35)) * 100).toFixed(1)}% |
| Operating Margin | ${((financialData.operating_margin || 0) * 100).toFixed(1)}% | ${((financialData.industry_operating_margin || 0.10) * 100).toFixed(1)}% | ${(((financialData.operating_margin || 0) - (financialData.industry_operating_margin || 0.10)) * 100).toFixed(1)}% |
| Revenue Growth | ${((financialData.revenue_growth || 0) * 100).toFixed(1)}% | ${((financialData.industry_growth || 0.05) * 100).toFixed(1)}% | ${(((financialData.revenue_growth || 0) - (financialData.industry_growth || 0.05)) * 100).toFixed(1)}% |

## RECOMMENDATION REQUIREMENTS

Provide 5-7 specific recommendations. Each must include:

1. **Title**: Clear, action-oriented
2. **Current State**: What's happening now
3. **Target State**: What good looks like
4. **Specific Actions**: 2-3 concrete steps
5. **Timeline**: When this can be achieved
6. **Estimated Value Impact**: How it affects valuation (%, $ range, or qualitative)
7. **Priority**: High/Medium/Low based on impact vs. effort

## STRUCTURE

Your recommendations should address:

1. **Revenue Enhancement** (at least 1 recommendation)
   - Diversification, pricing, new markets, etc.

2. **Profitability Improvement** (at least 1 recommendation)
   - Cost reduction, margin improvement, efficiency

3. **Risk Reduction** (at least 2 recommendations)
   - Customer concentration, owner dependence, key person risk

4. **Operational Excellence** (at least 1 recommendation)
   - Systems, documentation, scalability

5. **Strategic Positioning** (at least 1 recommendation)
   - Market position, competitive advantage, growth platform

## OUTPUT FORMAT

{
  "section": "value_enhancement_recommendations",
  "word_count": number,
  "content": "The full 600-800 word recommendations section...",
  "recommendations_summary": [
    {
      "title": "string",
      "priority": "High" | "Medium" | "Low",
      "estimated_value_impact": "string",
      "timeline": "string"
    }
  ]
}`;
}

export const pass11kConfig = {
  passNumber: '11k',
  passName: 'Value Enhancement Recommendations',
  systemPrompt: PASS_11K_SYSTEM_PROMPT,
  userPromptBuilder: buildPass11kPrompt,
  maxTokens: 2048,
  temperature: 0.4, // Slightly higher for creative recommendations
  dependencies: [2, 5, 6, 10],
  runOrder: 10,
};

export default pass11kConfig;
