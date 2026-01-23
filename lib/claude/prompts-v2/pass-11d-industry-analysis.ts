/**
 * Pass 11d: Industry Analysis
 *
 * Expert: Senior Industry Research Analyst
 * Word Count: 600-800 words
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export const PASS_11D_SYSTEM_PROMPT = `You are a senior industry research analyst at a leading market intelligence firm. You specialize in analyzing industries for M&A transactions, helping buyers and sellers understand market dynamics, competitive forces, and valuation implications.

Your task is to write the Industry Analysis section of a business valuation report. This section must:
- Define the industry and its boundaries
- Present market size and growth data
- Analyze competitive dynamics
- Identify industry-specific risks and opportunities
- Explain how industry factors affect valuation

You cite sources when presenting market data. You distinguish between hard data and informed estimates. You connect industry trends directly to valuation implications.

CRITICAL: Return ONLY valid JSON. No markdown code fences.`;

export function buildPass11dPrompt(
  industryData: any,
  economicConditions: any,
  comparableTransactions: any
): string {
  return `## INDUSTRY ANALYSIS TASK

Write a comprehensive Industry Analysis (600-800 words) for this valuation report.

## INDUSTRY CLASSIFICATION

**NAICS Code**: ${industryData.naics_code || 'N/A'}
**Industry Name**: ${industryData.naics_description || industryData.industry_name || 'Not specified'}
**SIC Code**: ${industryData.sic_code || 'N/A'}
**Industry Sector**: ${industryData.sector || 'Not specified'}

## MARKET DATA

**Market Size**: ${industryData.market_size || 'Not specified'}
**Market Size Source**: ${industryData.market_size_source || 'Industry research'}
**Annual Growth Rate**: ${((industryData.growth_rate || 0) * 100).toFixed(1)}%
**Growth Rate Source**: ${industryData.growth_rate_source || 'Industry data'}
**Industry Outlook**: ${industryData.industry_outlook || 'Stable'}

## VALUATION MULTIPLES (Industry)

| Multiple Type | Low | Median | High | Source |
|---------------|-----|--------|------|--------|
| SDE Multiple | ${industryData.sde_multiple?.low || 'N/A'}x | ${industryData.sde_multiple?.median || 'N/A'}x | ${industryData.sde_multiple?.high || 'N/A'}x | ${industryData.sde_multiple?.source || 'Industry data'} |
| EBITDA Multiple | ${industryData.ebitda_multiple?.low || 'N/A'}x | ${industryData.ebitda_multiple?.median || 'N/A'}x | ${industryData.ebitda_multiple?.high || 'N/A'}x | ${industryData.ebitda_multiple?.source || 'Industry data'} |
| Revenue Multiple | ${industryData.revenue_multiple?.low || 'N/A'}x | ${industryData.revenue_multiple?.median || 'N/A'}x | ${industryData.revenue_multiple?.high || 'N/A'}x | ${industryData.revenue_multiple?.source || 'Industry data'} |

## INDUSTRY BENCHMARKS

| Metric | Industry Median |
|--------|-----------------|
| Gross Margin | ${((industryData.benchmarks?.gross_margin || 0) * 100).toFixed(1)}% |
| Operating Margin | ${((industryData.benchmarks?.operating_margin || 0) * 100).toFixed(1)}% |
| SDE Margin | ${((industryData.benchmarks?.sde_margin || 0) * 100).toFixed(1)}% |
| Current Ratio | ${industryData.benchmarks?.current_ratio?.toFixed(2) || 'N/A'} |

## KEY TRENDS & FACTORS

**Key Trends**:
${Array.isArray(industryData.key_trends) ? industryData.key_trends.map((t: string) => `- ${t}`).join('\n') : '- See industry analysis'}

**Key Challenges**:
${Array.isArray(industryData.key_challenges) ? industryData.key_challenges.map((c: string) => `- ${c}`).join('\n') : '- Standard industry challenges apply'}

**Competitive Landscape**: ${industryData.competitive_landscape || 'Fragmented market with local competition'}

**Barriers to Entry**: ${industryData.barriers_to_entry || 'Moderate barriers including equipment, licensing, and expertise'}

## ECONOMIC CONTEXT

**Interest Rate Environment**: ${economicConditions?.interest_rates?.prime_rate?.current || 'Current market rates'}% prime rate
**M&A Activity Level**: ${economicConditions?.market_conditions?.m_and_a_activity?.level || 'Moderate'}
**Buyer Sentiment**: ${economicConditions?.market_conditions?.buyer_sentiment?.strategic_buyers || 'Active interest from strategic buyers'}

## RECENT TRANSACTIONS IN INDUSTRY

${comparableTransactions?.slice(0, 3).map((tx: any) => `
- **${tx.company_name || 'Undisclosed'}** (${tx.transaction_date}): ${tx.financials?.deal_value ? '$' + tx.financials.deal_value.toLocaleString() : 'Undisclosed'} - ${tx.implied_multiples?.sde_multiple ? tx.implied_multiples.sde_multiple.toFixed(1) + 'x SDE' : 'Multiple not disclosed'}
`).join('\n') || 'No recent transactions identified in search. Industry database multiples applied.'}

## STRUCTURE REQUIREMENTS

Your Industry Analysis must include:

1. **Industry Definition** (100 words): What the industry encompasses, NAICS classification, related industries.

2. **Market Size & Growth** (150 words): Total addressable market, growth trajectory, growth drivers.

3. **Competitive Landscape** (150 words): Market structure (fragmented/consolidated), major players, competitive dynamics.

4. **Industry Trends** (150 words): Key trends affecting the industry, technology changes, regulatory factors.

5. **Valuation Implications** (150 words): How industry factors affect multiples, current M&A environment, buyer interest level.

## OUTPUT FORMAT

{
  "section": "industry_analysis",
  "word_count": number,
  "content": "The full 600-800 word industry analysis...",
  "sources_cited": ["source1", "source2"],
  "key_industry_factors": {
    "growth_rate": number,
    "median_multiple": number,
    "outlook": "string"
  }
}`;
}

export const pass11dConfig = {
  passNumber: '11d',
  passName: 'Industry Analysis',
  systemPrompt: PASS_11D_SYSTEM_PROMPT,
  userPromptBuilder: buildPass11dPrompt,
  maxTokens: 2048,
  temperature: 0.3,
  dependencies: [4, 12, 13],
  runOrder: 3,
};

export default pass11dConfig;
