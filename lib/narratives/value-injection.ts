/**
 * Narrative Value Injection System
 *
 * Generates an authoritative values block to be injected into ALL narrative prompts
 * so that AI-generated narratives use correct, pre-calculated values instead of
 * hallucinating their own.
 *
 * Data flow: Calculation Engine -> DataStore -> DataAccessor -> Values Block -> Narrative Prompt
 */

import type { ValuationDataAccessor } from '../valuation/data-accessor';

// ============ TYPES ============

export interface NarrativePromptOptions {
  /** Additional context to append after the values block */
  additionalContext?: string;
}

// ============ AUTHORITATIVE VALUES BLOCK ============

/**
 * Generates a formatted text block containing all authoritative financial values
 * from the DataAccessor. This block is prepended to every narrative prompt.
 */
export function generateAuthoritativeValuesBlock(accessor: ValuationDataAccessor): string {
  const approaches: Array<{ name: string; type: 'asset' | 'income' | 'market' }> = [
    { name: 'Asset Approach', type: 'asset' },
    { name: 'Income Approach', type: 'income' },
    { name: 'Market Approach', type: 'market' },
  ];

  const approachLines = approaches.map(a =>
    `  - ${a.name}: ${accessor.getFormattedApproachValue(a.type)} (Weight: ${accessor.getFormattedApproachWeight(a.type)})`
  ).join('\n');

  const valueRange = accessor.getFormattedValueRange();

  return `
===== AUTHORITATIVE FINANCIAL VALUES =====
Use ONLY the values below when writing this section. Do NOT calculate, derive, round, or estimate any figures.

COMPANY INFORMATION:
  - Company Name: ${accessor.getCompanyName()}
  - Industry: ${accessor.getIndustryName()}
  - NAICS Code: ${accessor.getNaicsCode()}
  - Valuation Date: ${accessor.getValuationDate()}

VALUATION CONCLUSION:
  - Fair Market Value: ${accessor.getFormattedFinalValue()}
  - Value Range: ${valueRange.display}
  - SDE Multiple: ${accessor.getFormattedSDEMultiple()}
  - DLOM Applied: ${accessor.isDLOMApplied() ? `Yes (${accessor.getFormattedDLOMRate()})` : 'No'}

FINANCIAL METRICS:
  - Annual Revenue: ${accessor.getFormattedRevenue()}
  - Seller's Discretionary Earnings (SDE): ${accessor.getFormattedSDE()}
  - Normalized/Weighted SDE: ${accessor.getFormattedSDE('normalized')}
  - SDE Margin: ${accessor.getFormattedSDEMargin()}
  - EBITDA: ${accessor.getFormattedEBITDA()}
  - Net Income: ${accessor.getFormattedNetIncome()}

VALUATION APPROACHES:
${approachLines}

BALANCE SHEET SUMMARY:
  - Total Assets: ${accessor.getFormattedTotalAssets()}
  - Total Liabilities: ${accessor.getFormattedTotalLiabilities()}
  - Book Value: ${accessor.getFormattedBookValue()}
  - Working Capital: ${accessor.getFormattedWorkingCapital()}

RISK PROFILE:
  - Risk Score: ${accessor.getRiskScore()}/100
  - Risk Rating: ${accessor.getRiskRating()}

===== STRICT RULES =====
1. You MUST use the EXACT figures provided above when referencing any financial value.
2. DO NOT calculate, derive, round, or estimate any values - use them exactly as shown.
3. DO NOT invent or hallucinate any financial figures not listed above.
4. When mentioning the fair market value, use exactly: ${accessor.getFormattedFinalValue()}
5. When mentioning the SDE multiple, use exactly: ${accessor.getFormattedSDEMultiple()}
6. When mentioning revenue, use exactly: ${accessor.getFormattedRevenue()}
==========================================
`.trim();
}

// ============ SECTION-SPECIFIC INSTRUCTIONS ============

interface SectionInstruction {
  wordRange: string;
  guidance: string;
}

const SECTION_INSTRUCTIONS: Record<string, SectionInstruction> = {
  'executive_summary': {
    wordRange: '600-900 words',
    guidance: `Write a comprehensive executive summary that:
- Opens with the concluded fair market value prominently stated
- Summarizes the company profile (name, industry, years in business)
- Highlights key financial metrics (revenue, SDE, margins)
- Briefly describes each valuation approach used and their weights
- Notes the value range and any discounts applied (DLOM)
- Concludes with the risk assessment summary
- Uses a professional, authoritative tone appropriate for a valuation report`,
  },
  'company_profile': {
    wordRange: '300-500 words',
    guidance: `Write a company profile section that:
- Identifies the company by name, industry, and location
- Describes the business operations and services
- Notes years in business and entity type
- References the NAICS code and industry classification
- Provides context about the company's market position
- Uses factual, objective language`,
  },
  'industry_analysis': {
    wordRange: '300-400 words',
    guidance: `Write an industry analysis section that:
- Identifies the industry and relevant classification codes
- Discusses current industry trends and market conditions
- Notes industry-specific factors that affect valuation
- References the SDE multiple range typical for this industry
- Discusses competitive landscape and growth outlook
- Connects industry factors to the company's risk profile`,
  },
  'risk_assessment': {
    wordRange: '300-400 words',
    guidance: `Write a risk assessment section that:
- States the overall risk score and rating
- Discusses key risk factors affecting the valuation
- Explains how risk factors were considered in the valuation approaches
- Notes both company-specific and industry-wide risks
- Discusses mitigating factors where applicable
- Connects risk assessment to the discount rates and multiples used`,
  },
};

/**
 * Builds a complete narrative prompt for a given section by combining:
 * 1. The authoritative values block
 * 2. Section-specific writing instructions
 * 3. Optional additional context
 */
export function buildNarrativePrompt(
  section: string,
  accessor: ValuationDataAccessor,
  additionalContext?: string
): string {
  const valuesBlock = generateAuthoritativeValuesBlock(accessor);
  const instruction = SECTION_INSTRUCTIONS[section];

  let sectionGuidance: string;
  if (instruction) {
    sectionGuidance = `\nSECTION: ${section.replace(/_/g, ' ').toUpperCase()}
TARGET LENGTH: ${instruction.wordRange}

WRITING INSTRUCTIONS:
${instruction.guidance}`;
  } else {
    sectionGuidance = `\nSECTION: ${section.replace(/_/g, ' ').toUpperCase()}

WRITING INSTRUCTIONS:
Write professional, authoritative content for this section of the business valuation report.
Reference the authoritative values above when discussing any financial figures.
Use a formal tone appropriate for a professional valuation document.
Ensure all financial values match exactly with the authoritative values provided.`;
  }

  const parts = [valuesBlock, sectionGuidance];

  if (additionalContext) {
    parts.push(`\nADDITIONAL CONTEXT:\n${additionalContext}`);
  }

  return parts.join('\n');
}
