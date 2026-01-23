/**
 * Pass 11j: Assumptions & Limiting Conditions
 *
 * Expert: Valuation Compliance Expert
 * Word Count: 400-500 words
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export const PASS_11J_SYSTEM_PROMPT = `You are a valuation compliance expert who ensures reports meet professional standards (USPAP, AICPA SSVS No. 1, ASA Business Valuation Standards). You specialize in drafting assumptions and limiting conditions that protect both the appraiser and the client.

Your task is to write the Assumptions & Limiting Conditions section. This section must:
- State standard assumptions about data reliability
- Define scope limitations
- Provide appropriate disclaimers
- Include certification of independence
- Comply with professional standards

You write in precise legal language while remaining understandable.

CRITICAL: Return ONLY valid JSON. No markdown code fences.`;

export function buildPass11jPrompt(reportMetadata: any): string {
  return `## ASSUMPTIONS & LIMITING CONDITIONS TASK

Write the Assumptions & Limiting Conditions section (400-500 words) for this valuation report.

## REPORT METADATA

**Valuation Date**: ${reportMetadata.valuation_date || new Date().toISOString().split('T')[0]}
**Report Date**: ${reportMetadata.report_date || new Date().toISOString().split('T')[0]}
**Purpose**: ${reportMetadata.purpose || 'Fair Market Value determination for internal planning purposes'}
**Standard of Value**: ${reportMetadata.standard_of_value || 'Fair Market Value'}
**Premise of Value**: ${reportMetadata.premise_of_value || 'Going Concern'}
**Interest Valued**: ${reportMetadata.interest_valued || '100% equity interest'}

**Documents Analyzed**:
${reportMetadata.documents?.map((d: any) => `- ${d.type}: ${d.name} (${d.year})`).join('\n') || '- Financial statements provided by management\n- Tax returns as available\n- Operational information from discussions'}

**Data Limitations Noted**:
${reportMetadata.data_limitations?.map((l: string) => `- ${l}`).join('\n') || '- Standard reliance on management-provided information\n- No independent audit performed'}

## REQUIRED SECTIONS

Your Assumptions & Limiting Conditions must include:

### General Assumptions (list format, ~150 words)
- Reliance on management-provided information
- No independent audit of financial statements
- Assumption that information is accurate and complete
- No hidden or contingent liabilities
- Continued availability of key personnel
- No material changes since valuation date

### Limiting Conditions (list format, ~150 words)
- Valuation is an opinion, not a guarantee
- Valid only for the stated purpose and date
- Market conditions may change
- Hypothetical transaction assumptions
- No legal, tax, or investment advice provided
- Report should not be used for [other purposes]

### Certification (paragraph, ~100 words)
- Independence statement
- No contingent fee arrangement
- Professional standards followed
- Appraiser qualifications (reference)

### Specific Limitations (~75 words)
Any data gaps or special circumstances specific to this engagement.

## OUTPUT FORMAT

{
  "section": "assumptions_limiting_conditions",
  "word_count": number,
  "content": "The full 400-500 word assumptions and limiting conditions...",
  "standards_referenced": ["USPAP", "AICPA SSVS No. 1"]
}`;
}

export const pass11jConfig = {
  passNumber: '11j',
  passName: 'Assumptions & Limiting Conditions',
  systemPrompt: PASS_11J_SYSTEM_PROMPT,
  userPromptBuilder: buildPass11jPrompt,
  maxTokens: 1536,
  temperature: 0.1,
  dependencies: [1],
  runOrder: 9,
};

export default pass11jConfig;
