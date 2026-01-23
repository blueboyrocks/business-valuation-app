/**
 * Pass 11e: Risk Assessment Narrative
 *
 * Expert: Senior M&A Due Diligence Expert
 * Word Count: 700-900 words
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export const PASS_11E_SYSTEM_PROMPT = `You are a senior M&A due diligence expert who has evaluated hundreds of acquisition targets. You specialize in identifying, quantifying, and communicating business risks that affect transaction value.

Your task is to write the Risk Assessment section of a business valuation report. This section must:
- Identify specific risks, not generic categories
- Quantify risk impact where possible
- Connect risks to valuation adjustments
- Balance concerns with mitigating factors
- Provide actionable insight for decision-makers

You are direct about risks but not alarmist. You distinguish between deal-breaker risks and manageable concerns. You always explain how each risk affects value.

CRITICAL: Return ONLY valid JSON. No markdown code fences.`;

export function buildPass11ePrompt(riskAssessment: any): string {
  return `## RISK ASSESSMENT TASK

Write a comprehensive Risk Assessment (700-900 words) for this valuation report.

## RISK FACTOR SCORES

| Risk Factor | Score (1-5) | Category |
|-------------|-------------|----------|
| Customer Concentration | ${riskAssessment.factors?.customer_concentration?.score || 'N/A'}/5 | ${riskAssessment.factors?.customer_concentration?.category || 'N/A'} |
| Owner Dependence | ${riskAssessment.factors?.owner_dependence?.score || 'N/A'}/5 | ${riskAssessment.factors?.owner_dependence?.category || 'N/A'} |
| Financial Record Quality | ${riskAssessment.factors?.financial_records?.score || 'N/A'}/5 | ${riskAssessment.factors?.financial_records?.category || 'N/A'} |
| Industry Stability | ${riskAssessment.factors?.industry_stability?.score || 'N/A'}/5 | ${riskAssessment.factors?.industry_stability?.category || 'N/A'} |
| Competitive Position | ${riskAssessment.factors?.competitive_position?.score || 'N/A'}/5 | ${riskAssessment.factors?.competitive_position?.category || 'N/A'} |
| Growth Trajectory | ${riskAssessment.factors?.growth_trajectory?.score || 'N/A'}/5 | ${riskAssessment.factors?.growth_trajectory?.category || 'N/A'} |
| Asset Quality | ${riskAssessment.factors?.asset_quality?.score || 'N/A'}/5 | ${riskAssessment.factors?.asset_quality?.category || 'N/A'} |
| Geographic Risk | ${riskAssessment.factors?.geographic_risk?.score || 'N/A'}/5 | ${riskAssessment.factors?.geographic_risk?.category || 'N/A'} |
| Regulatory Environment | ${riskAssessment.factors?.regulatory?.score || 'N/A'}/5 | ${riskAssessment.factors?.regulatory?.category || 'N/A'} |
| Economic Sensitivity | ${riskAssessment.factors?.economic_sensitivity?.score || 'N/A'}/5 | ${riskAssessment.factors?.economic_sensitivity?.category || 'N/A'} |

**Overall Risk Score**: ${riskAssessment.overall_score || 'N/A'}/5.0 (${riskAssessment.risk_category || 'Moderate'})

## RISK DETAILS

**Customer Concentration**:
${riskAssessment.factors?.customer_concentration?.details || 'Customer diversification analysis pending'}

**Owner Dependence**:
${riskAssessment.factors?.owner_dependence?.details || 'Owner dependence analysis pending'}

**Other Key Risks**:
${Array.isArray(riskAssessment.top_risks) ? riskAssessment.top_risks.map((r: any) => `- ${r.factor}: ${r.details}`).join('\n') : '- See detailed risk analysis'}

## DISCOUNT RATE BUILD-UP

| Component | Rate | Source/Rationale |
|-----------|------|------------------|
| Risk-Free Rate | ${((riskAssessment.discount_rate?.risk_free || 0.04) * 100).toFixed(1)}% | 20-Year Treasury |
| Equity Risk Premium | ${((riskAssessment.discount_rate?.equity_risk_premium || 0.06) * 100).toFixed(1)}% | Duff & Phelps |
| Size Premium | ${((riskAssessment.discount_rate?.size_premium || 0.06) * 100).toFixed(1)}% | Based on revenue |
| Industry Risk | ${((riskAssessment.discount_rate?.industry_risk || 0.02) * 100).toFixed(1)}% | Industry data |
| Company-Specific Risk | ${((riskAssessment.discount_rate?.company_specific || 0.04) * 100).toFixed(1)}% | Risk factors above |
| **Total Discount Rate** | **${((riskAssessment.discount_rate?.total || 0.22) * 100).toFixed(1)}%** | |

## VALUE DRIVERS (Positive Factors)

${Array.isArray(riskAssessment.value_drivers) ? riskAssessment.value_drivers.map((d: string) => `- ${d}`).join('\n') : '- Established business operations\n- Consistent financial performance\n- Industry expertise'}

## STRUCTURE REQUIREMENTS

Your Risk Assessment must include:

1. **Risk Overview** (100 words): Overall risk profile, how it compares to typical businesses of this size/industry.

2. **Financial Risks** (150 words): Profitability stability, leverage, liquidity, earnings quality.

3. **Operational Risks** (200 words): Customer concentration, owner dependence, key employee risk, supplier dependencies.

4. **Strategic Risks** (150 words): Competitive threats, market position sustainability, technology risk, regulatory exposure.

5. **Risk Quantification** (150 words): How risks translate to discount rate, what the overall risk score means for value.

6. **Mitigating Factors** (100 words): Positive factors that offset risks, value drivers.

## OUTPUT FORMAT

{
  "section": "risk_assessment",
  "word_count": number,
  "content": "The full 700-900 word risk assessment...",
  "risk_summary": {
    "overall_score": number,
    "highest_risks": ["risk1", "risk2"],
    "key_mitigants": ["mitigant1", "mitigant2"],
    "implied_discount_rate": number
  }
}`;
}

export const pass11eConfig = {
  passNumber: '11e',
  passName: 'Risk Assessment Narrative',
  systemPrompt: PASS_11E_SYSTEM_PROMPT,
  userPromptBuilder: buildPass11ePrompt,
  maxTokens: 2048,
  temperature: 0.2,
  dependencies: [6],
  runOrder: 4,
};

export default pass11eConfig;
