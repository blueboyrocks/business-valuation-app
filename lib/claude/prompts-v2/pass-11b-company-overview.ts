/**
 * Pass 11b: Company Overview
 *
 * Expert: Senior Business Analyst
 * Word Count: 600-800 words
 *
 * Runs first in the narrative sequence.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export const PASS_11B_SYSTEM_PROMPT = `You are a senior business analyst who has profiled hundreds of companies for M&A transactions, investor presentations, and strategic planning. You excel at distilling complex business operations into clear, compelling narratives.

Your task is to write the Company Overview section of a business valuation report. This section helps readers understand:
- What the company does
- How it makes money
- Its history and evolution
- Its market position and competitive advantages
- Its organizational structure

You write with clarity and precision, making even complex business models accessible. You avoid jargon unless necessary, and when you use technical terms, you explain them.

CRITICAL: Return ONLY valid JSON. No markdown code fences.`;

export function buildPass11bPrompt(
  companyProfile: any,
  incomeStatements: any[],
  balanceSheet: any
): string {
  const mostRecentYear = incomeStatements[0] || {};

  return `## COMPANY OVERVIEW TASK

Write a comprehensive Company Overview (600-800 words) for this valuation report.

## COMPANY PROFILE DATA

**Legal Name**: ${companyProfile.legal_name || companyProfile.company_name || 'Subject Company'}
**DBA/Trade Name**: ${companyProfile.dba_name || 'Same as legal name'}
**Entity Type**: ${companyProfile.entity_type || 'Not specified'}
**State of Incorporation**: ${companyProfile.state || 'Not specified'}
**Year Founded**: ${companyProfile.year_founded || 'Not specified'}
**Industry**: ${companyProfile.industry_name || 'Not specified'}
**NAICS Code**: ${companyProfile.naics_code || 'N/A'}

**Ownership**:
${Array.isArray(companyProfile.owners) ? companyProfile.owners.map((o: any) => `- ${o.name}: ${o.percentage}%`).join('\n') : '- Single owner - 100%'}

**Key Personnel**:
${Array.isArray(companyProfile.key_personnel) ? companyProfile.key_personnel.map((p: any) => `- ${p.name}: ${p.title}`).join('\n') : '- Owner/Operator'}

## OPERATIONAL DATA

**Revenue (Most Recent)**: $${mostRecentYear.revenue?.toLocaleString() || 'Not specified'}
**Number of Employees**: ${companyProfile.employee_count || 'Not specified'}
**Primary Services/Products**: ${companyProfile.services_description || 'Not specified'}
**Geographic Coverage**: ${companyProfile.geographic_coverage || 'Not specified'}

**Cost Structure Indicators**:
- Cost of Goods Sold: $${mostRecentYear.cogs?.toLocaleString() || 'N/A'}
- Salaries & Wages: $${mostRecentYear.salaries?.toLocaleString() || 'N/A'}
- Rent/Facilities: $${mostRecentYear.rent?.toLocaleString() || 'N/A'}

**Asset Base**:
- Total Assets: $${balanceSheet.total_assets?.toLocaleString() || 'N/A'}
- Fixed Assets (Net): $${balanceSheet.fixed_assets?.toLocaleString() || 'N/A'}
- Vehicle Fleet: ${balanceSheet.vehicle_count || 'N/A'} vehicles

## STRUCTURE REQUIREMENTS

Your Company Overview must include:

1. **Business Description** (150 words): What the company does, core services/products, value proposition.

2. **History & Evolution** (100 words): Founding, growth milestones, significant changes. If not specified, focus on current state.

3. **Products/Services Detail** (150 words): Breakdown of offerings, how revenue is generated, pricing model if apparent.

4. **Operations & Infrastructure** (150 words): Facilities, equipment, workforce, geographic reach.

5. **Market Position** (100 words): Competitive advantages, customer base characteristics, market positioning.

6. **Organizational Structure** (100 words): Ownership, management, key personnel roles.

## OUTPUT FORMAT

{
  "section": "company_overview",
  "word_count": number,
  "content": "The full 600-800 word company overview...",
  "key_facts_extracted": {
    "business_model": "string",
    "primary_revenue_source": "string",
    "competitive_advantage": "string"
  }
}`;
}

export const pass11bConfig = {
  passNumber: '11b',
  passName: 'Company Overview',
  systemPrompt: PASS_11B_SYSTEM_PROMPT,
  userPromptBuilder: buildPass11bPrompt,
  maxTokens: 2048,
  temperature: 0.3,
  dependencies: [1, 2, 3],
  runOrder: 1,
};

export default pass11bConfig;
