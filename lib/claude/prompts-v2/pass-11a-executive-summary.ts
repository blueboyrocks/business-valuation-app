/**
 * Pass 11a: Executive Summary
 *
 * Expert: Senior Valuation Partner with 25+ years experience
 * Word Count: 1,000-1,200 words
 *
 * IMPORTANT: This pass runs LAST because it synthesizes all other narrative sections.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export const PASS_11A_SYSTEM_PROMPT = `You are a Senior Partner at a prestigious business valuation firm with 25+ years of experience. You have prepared thousands of valuation reports for transactions ranging from $500K to $500M.

Your task is to write the Executive Summary - the single most important section of the valuation report. Many readers will ONLY read this section, so it must:

1. Stand completely alone - reader should understand the entire valuation from this section
2. Lead with the conclusion - state the value prominently
3. Provide enough context to justify the conclusion
4. Be written in confident, professional prose
5. Be specific to THIS company - no generic boilerplate

You write with authority and precision. Your summaries are known for being comprehensive yet accessible to business owners who aren't valuation experts.

CRITICAL: Return ONLY valid JSON. No markdown code fences.`;

export function buildPass11aPrompt(
  companyProfile: any,
  financialSummary: any,
  valuationResults: any,
  riskAssessment: any,
  otherNarratives: Record<string, string>
): string {
  return `## EXECUTIVE SUMMARY TASK

Write a comprehensive Executive Summary (1,000-1,200 words) for this valuation report.

## COMPANY DATA

**Company**: ${companyProfile.legal_name || companyProfile.company_name || 'Subject Company'}
**Entity Type**: ${companyProfile.entity_type || 'Not specified'}
**Industry**: ${companyProfile.industry_name || 'Not specified'} (NAICS ${companyProfile.naics_code || 'N/A'})
**Ownership**: ${companyProfile.ownership_summary || 'Single owner - 100%'}
**Valuation Date**: ${companyProfile.valuation_date || new Date().toISOString().split('T')[0]}
**Purpose**: ${companyProfile.valuation_purpose || 'Fair Market Value for internal planning'}

## FINANCIAL HIGHLIGHTS

**Revenue (Most Recent Year)**: $${financialSummary.revenue?.toLocaleString() || 'Not specified'}
**Revenue Growth (3-Year CAGR)**: ${((financialSummary.revenue_cagr || 0) * 100).toFixed(1)}%
**Gross Margin**: ${((financialSummary.gross_margin || 0) * 100).toFixed(1)}%
**Operating Margin**: ${((financialSummary.operating_margin || 0) * 100).toFixed(1)}%
**Normalized SDE**: $${financialSummary.normalized_sde?.toLocaleString() || 'Not specified'}
**Normalized EBITDA**: $${financialSummary.normalized_ebitda?.toLocaleString() || 'Not specified'}

## VALUATION RESULTS

**Asset Approach**: $${valuationResults.asset_approach?.toLocaleString() || 'N/A'} (Weight: ${valuationResults.asset_weight || 0}%)
**Income Approach**: $${valuationResults.income_approach?.toLocaleString() || 'N/A'} (Weight: ${valuationResults.income_weight || 0}%)
**Market Approach**: $${valuationResults.market_approach?.toLocaleString() || 'N/A'} (Weight: ${valuationResults.market_weight || 0}%)

**CONCLUDED VALUE**: $${valuationResults.concluded_value?.toLocaleString() || 'Not determined'}
**Value Range**: $${valuationResults.value_range_low?.toLocaleString() || 'N/A'} - $${valuationResults.value_range_high?.toLocaleString() || 'N/A'}
**Confidence Level**: ${valuationResults.confidence_level || 'Medium'}

## CRITICAL: USE THESE EXACT VALUES
The numbers above are AUTHORITATIVE from the deterministic calculation engine.
You MUST use these exact dollar values in your narrative. Do NOT invent, round differently, or adjust them.
When referencing the concluded value, use exactly: $${valuationResults.concluded_value?.toLocaleString() || 'Not determined'}
When referencing approach values, use the exact figures above.

## RISK SUMMARY

**Overall Risk Score**: ${riskAssessment.overall_score || 'N/A'}/10
**Key Risk Factors**: ${riskAssessment.top_risks?.join(', ') || 'See risk assessment section'}
**Key Value Drivers**: ${riskAssessment.value_drivers?.join(', ') || 'See analysis sections'}

## OTHER SECTIONS (for context)

**Company Overview Summary**: ${otherNarratives.company_overview?.slice(0, 500) || 'Pending'}...
**Financial Analysis Summary**: ${otherNarratives.financial_analysis?.slice(0, 500) || 'Pending'}...
**Risk Assessment Summary**: ${otherNarratives.risk_assessment?.slice(0, 500) || 'Pending'}...

## STRUCTURE REQUIREMENTS

Your Executive Summary must include these elements IN THIS ORDER:

1. **Opening paragraph** (100 words): State the purpose, standard of value, valuation date, and subject company. Include the concluded value in the first paragraph.

2. **Company snapshot** (150 words): Business description, years in operation, products/services, market position.

3. **Financial performance** (200 words): Revenue, growth trajectory, profitability, comparison to industry.

4. **Valuation methodology** (200 words): Three approaches used, key assumptions, weighting rationale.

5. **Valuation conclusion** (150 words): Final value with range, implied multiples, what this means.

6. **Key value drivers** (150 words): 3-4 factors supporting the value.

7. **Key risk factors** (100 words): 2-3 factors that could affect value.

8. **Closing certification** (100 words): Professional standards, independence, limitations.

## OUTPUT FORMAT

{
  "section": "executive_summary",
  "word_count": number,
  "content": "The full 1,000-1,200 word executive summary...",
  "key_figures_referenced": {
    "concluded_value": number,
    "revenue": number,
    "sde": number,
    "primary_multiple": number
  }
}`;
}

export const pass11aConfig = {
  passNumber: '11a',
  passName: 'Executive Summary',
  systemPrompt: PASS_11A_SYSTEM_PROMPT,
  userPromptBuilder: buildPass11aPrompt,
  maxTokens: 4096,
  temperature: 0.3,
  dependencies: ['11b', '11c', '11d', '11e', '11f', '11g', '11h', '11i', '11j', '11k'],
  runOrder: 11, // Runs last
};

export default pass11aConfig;
