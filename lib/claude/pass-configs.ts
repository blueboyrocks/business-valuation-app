/**
 * Pass Configuration Registry
 *
 * Central configuration for all passes of the valuation pipeline.
 * Includes prompt builders and web search support flags.
 * Supports individual narrative passes (11a-11k) with expert personas.
 */

import { getPromptConfig, getNarrativePassConfig as getPromptNarrativeConfig } from './prompts-v2';
import {
  PASS_4_WEB_SEARCH_SYSTEM_PROMPT,
  buildPass4WebSearchPrompt,
} from './prompts-v2/pass-04-industry-with-search';
import {
  PASS_11_COMPLETE_SYSTEM_PROMPT,
  buildPass11CompletePrompt,
} from './prompts-v2/pass-11-narratives-complete';
import {
  PASS_12_ECONOMIC_SYSTEM_PROMPT,
  buildPass12EconomicPrompt,
} from './prompts-v2/pass-12-economic-conditions';
import {
  PASS_13_COMPARABLE_SYSTEM_PROMPT,
  buildPass13ComparablePrompt,
} from './prompts-v2/pass-13-comparable-transactions';

// Import narrative pass prompt builders
import { buildPass11aPrompt, PASS_11A_SYSTEM_PROMPT } from './prompts-v2/pass-11a-executive-summary';
import { buildPass11bPrompt, PASS_11B_SYSTEM_PROMPT } from './prompts-v2/pass-11b-company-overview';
import { buildPass11cPrompt, PASS_11C_SYSTEM_PROMPT } from './prompts-v2/pass-11c-financial-analysis';
import { buildPass11dPrompt, PASS_11D_SYSTEM_PROMPT } from './prompts-v2/pass-11d-industry-analysis';
import { buildPass11ePrompt, PASS_11E_SYSTEM_PROMPT } from './prompts-v2/pass-11e-risk-assessment';
import { buildPass11fPrompt, PASS_11F_SYSTEM_PROMPT } from './prompts-v2/pass-11f-asset-approach';
import { buildPass11gPrompt, PASS_11G_SYSTEM_PROMPT } from './prompts-v2/pass-11g-income-approach';
import { buildPass11hPrompt, PASS_11H_SYSTEM_PROMPT } from './prompts-v2/pass-11h-market-approach';
import { buildPass11iPrompt, PASS_11I_SYSTEM_PROMPT } from './prompts-v2/pass-11i-valuation-synthesis';
import { buildPass11jPrompt, PASS_11J_SYSTEM_PROMPT } from './prompts-v2/pass-11j-assumptions';
import { buildPass11kPrompt, PASS_11K_SYSTEM_PROMPT } from './prompts-v2/pass-11k-recommendations';

export interface PassConfig {
  passNumber: number;
  passName: string;
  maxTokens: number;
  temperature: number;
  supportsWebSearch: boolean;
  dependencies: number[];
}

export interface NarrativePassConfig {
  passNumber: string;
  passName: string;
  maxTokens: number;
  temperature: number;
  dependencies: (number | string)[];
  runOrder: number;
}

/**
 * Pass configuration definitions
 */
const PASS_CONFIGS: Record<number, PassConfig> = {
  1: {
    passNumber: 1,
    passName: 'Document Classification & Company Profile',
    maxTokens: 8192,
    temperature: 0.2,
    supportsWebSearch: false,
    dependencies: [],
  },
  2: {
    passNumber: 2,
    passName: 'Income Statement Extraction',
    maxTokens: 8192,
    temperature: 0.2,
    supportsWebSearch: false,
    dependencies: [1],
  },
  3: {
    passNumber: 3,
    passName: 'Balance Sheet & Working Capital',
    maxTokens: 8192,
    temperature: 0.2,
    supportsWebSearch: false,
    dependencies: [1],
  },
  4: {
    passNumber: 4,
    passName: 'Industry Analysis (with Web Search)',
    maxTokens: 8192,
    temperature: 0.2,
    supportsWebSearch: true,
    dependencies: [1, 2],
  },
  5: {
    passNumber: 5,
    passName: 'Earnings Normalization',
    maxTokens: 8192,
    temperature: 0.2,
    supportsWebSearch: false,
    dependencies: [1, 2, 3],
  },
  6: {
    passNumber: 6,
    passName: 'Risk Assessment',
    maxTokens: 8192,
    temperature: 0.2,
    supportsWebSearch: false,
    dependencies: [1, 2, 3, 4, 5],
  },
  7: {
    passNumber: 7,
    passName: 'Asset Approach Valuation',
    maxTokens: 8192,
    temperature: 0.2,
    supportsWebSearch: false,
    dependencies: [3, 5, 6],
  },
  8: {
    passNumber: 8,
    passName: 'Income Approach Valuation',
    maxTokens: 8192,
    temperature: 0.2,
    supportsWebSearch: false,
    dependencies: [5, 6],
  },
  9: {
    passNumber: 9,
    passName: 'Market Approach Valuation',
    maxTokens: 8192,
    temperature: 0.2,
    supportsWebSearch: true,
    dependencies: [4, 5, 6],
  },
  10: {
    passNumber: 10,
    passName: 'Value Synthesis & Reconciliation',
    maxTokens: 8192,
    temperature: 0.2,
    supportsWebSearch: false,
    dependencies: [7, 8, 9],
  },
  11: {
    passNumber: 11,
    passName: 'Complete Narratives (All 11 Sections)',
    maxTokens: 16384,
    temperature: 0.3,
    supportsWebSearch: false,
    dependencies: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  },
  12: {
    passNumber: 12,
    passName: 'Economic Conditions',
    maxTokens: 4096,
    temperature: 0.2,
    supportsWebSearch: true,
    dependencies: [1],
  },
  13: {
    passNumber: 13,
    passName: 'Comparable Transactions',
    maxTokens: 8192,
    temperature: 0.2,
    supportsWebSearch: true,
    dependencies: [1, 2, 5],
  },
};

/**
 * Get pass configuration by pass number
 */
export function getPassConfig(passNumber: number): PassConfig | undefined {
  return PASS_CONFIGS[passNumber];
}

/**
 * Get all pass configurations
 */
export function getAllPassConfigs(): PassConfig[] {
  return Object.values(PASS_CONFIGS).sort((a, b) => a.passNumber - b.passNumber);
}

/**
 * Helper to safely get pass output by number
 */
function getPassOutput(priorOutputs: Record<string, unknown>, passNum: number): unknown {
  return priorOutputs[String(passNum)] || priorOutputs[`pass${passNum}`] || null;
}

/**
 * Helper to safely get narrative content
 */
function getNarrativeContent(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && 'content' in value) {
    return (value as { content: string }).content || '';
  }
  return '';
}

/**
 * Build prompts for a specific pass
 */
export function buildPassPrompt(
  passNumber: number,
  report: {
    company_name: string;
    document_text?: string;
    report_data?: Record<string, unknown> | null;
  },
  priorPassOutputs: Record<string, unknown>,
  options: { useWebSearch?: boolean } = {}
): { systemPrompt: string; userPrompt: string } {
  // Get pass outputs by number
  const pass1 = getPassOutput(priorPassOutputs, 1) as Record<string, unknown> | null;
  const pass2 = getPassOutput(priorPassOutputs, 2) as Record<string, unknown> | null;
  const pass3 = getPassOutput(priorPassOutputs, 3) as Record<string, unknown> | null;
  const pass4 = getPassOutput(priorPassOutputs, 4) as Record<string, unknown> | null;
  const pass5 = getPassOutput(priorPassOutputs, 5) as Record<string, unknown> | null;
  const pass6 = getPassOutput(priorPassOutputs, 6) as Record<string, unknown> | null;
  const pass7 = getPassOutput(priorPassOutputs, 7) as Record<string, unknown> | null;
  const pass8 = getPassOutput(priorPassOutputs, 8) as Record<string, unknown> | null;
  const pass9 = getPassOutput(priorPassOutputs, 9) as Record<string, unknown> | null;
  const pass10 = getPassOutput(priorPassOutputs, 10) as Record<string, unknown> | null;

  // Check for user-provided industry (highest priority)
  const userProvided = priorPassOutputs['user_provided'] as Record<string, unknown> | undefined;
  const userIndustry = userProvided?.industry_classification as Record<string, unknown> | undefined;

  // Extract common values
  const companyProfile = (pass1?.company_profile || {}) as Record<string, unknown>;
  // User-provided industry takes priority over extracted
  const industryClassification = (userIndustry || pass1?.industry_classification || pass4?.industry_classification || {}) as Record<string, unknown>;
  const incomeStatements = ((pass2?.income_statements || []) as unknown[]);
  const latestIncome = incomeStatements[0] as Record<string, unknown> | undefined;
  const balanceSheets = ((pass3?.balance_sheets || []) as unknown[]);
  const latestBalance = balanceSheets[0] as Record<string, unknown> | undefined;
  const summary5 = (pass5?.summary || {}) as Record<string, unknown>;

  const industryName = String(industryClassification?.naics_description || 'Unknown Industry');
  const naicsCode = String(industryClassification?.naics_code || '');
  const companyRevenue = Number((latestIncome?.revenue as Record<string, unknown>)?.total_revenue || 0);
  const companySDE = Number(summary5?.weighted_average_sde || summary5?.most_recent_sde || 0);
  const valuationDate = new Date().toISOString().split('T')[0];

  // Special handling for passes with web search or complete narratives
  if (passNumber === 4 && options.useWebSearch) {
    return {
      systemPrompt: PASS_4_WEB_SEARCH_SYSTEM_PROMPT,
      userPrompt: buildPass4WebSearchPrompt(companyProfile, {
        annual_revenue: companyRevenue,
        normalized_sde: companySDE,
      }),
    };
  }

  if (passNumber === 11) {
    // Build comprehensive context for Pass 11
    const fullContext = buildPass11Context(priorPassOutputs, report);
    return {
      systemPrompt: PASS_11_COMPLETE_SYSTEM_PROMPT,
      userPrompt: buildPass11CompletePrompt(fullContext),
    };
  }

  if (passNumber === 12 && options.useWebSearch) {
    return {
      systemPrompt: PASS_12_ECONOMIC_SYSTEM_PROMPT,
      userPrompt: buildPass12EconomicPrompt(industryName, valuationDate),
    };
  }

  if (passNumber === 13 && options.useWebSearch) {
    return {
      systemPrompt: PASS_13_COMPARABLE_SYSTEM_PROMPT,
      userPrompt: buildPass13ComparablePrompt(
        industryName,
        naicsCode,
        companyRevenue,
        companySDE
      ),
    };
  }

  // For standard passes, use the existing prompts-v2 config
  const standardConfig = getPromptConfig(passNumber);
  if (standardConfig) {
    // Build context string for the user prompt
    const contextStr = buildPriorPassContext(passNumber, priorPassOutputs, report);

    // For Pass 1, inject user-provided industry if available
    let industryContext = '';
    if (passNumber === 1 && userIndustry) {
      industryContext = `\n\n## KNOWN INDUSTRY CLASSIFICATION (User Verified)

IMPORTANT: The user has confirmed the industry classification. You MUST use this exact classification in your output:

**NAICS Code**: ${userIndustry.naics_code}
**Industry**: ${userIndustry.naics_description}
**Sector**: ${userIndustry.sector || 'Not specified'}

Do NOT try to determine a different industry - use this verified classification.\n`;
    }

    return {
      systemPrompt: standardConfig.systemPrompt,
      userPrompt: `${standardConfig.userPrompt}${industryContext}\n\n## PRIOR PASS DATA\n\n${contextStr}\n\n## DOCUMENT TEXT\n\n${report.document_text || 'No document text available'}`,
    };
  }

  throw new Error(`No prompt configuration found for pass ${passNumber}`);
}

/**
 * Build context string from prior pass outputs
 */
function buildPriorPassContext(
  passNumber: number,
  priorOutputs: Record<string, unknown>,
  report: { company_name: string }
): string {
  const parts: string[] = [];
  parts.push(`Company Name: ${report.company_name}`);

  // Add relevant prior pass data based on dependencies
  const config = getPassConfig(passNumber);
  if (!config) return parts.join('\n');

  for (const depPass of config.dependencies) {
    const output = getPassOutput(priorOutputs, depPass);
    if (output) {
      parts.push(`\n### Pass ${depPass} Output:\n${JSON.stringify(output, null, 2).slice(0, 5000)}`);
    }
  }

  return parts.join('\n');
}

/**
 * Build comprehensive context for Pass 11 (all narratives)
 */
function buildPass11Context(
  priorOutputs: Record<string, unknown>,
  report: { company_name: string }
): Record<string, unknown> {
  const pass1 = getPassOutput(priorOutputs, 1) as Record<string, unknown> | null;
  const pass2 = getPassOutput(priorOutputs, 2) as Record<string, unknown> | null;
  const pass3 = getPassOutput(priorOutputs, 3) as Record<string, unknown> | null;
  const pass4 = getPassOutput(priorOutputs, 4) as Record<string, unknown> | null;
  const pass5 = getPassOutput(priorOutputs, 5) as Record<string, unknown> | null;
  const pass6 = getPassOutput(priorOutputs, 6) as Record<string, unknown> | null;
  const pass7 = getPassOutput(priorOutputs, 7) as Record<string, unknown> | null;
  const pass8 = getPassOutput(priorOutputs, 8) as Record<string, unknown> | null;
  const pass9 = getPassOutput(priorOutputs, 9) as Record<string, unknown> | null;
  const pass10 = getPassOutput(priorOutputs, 10) as Record<string, unknown> | null;
  const pass12 = getPassOutput(priorOutputs, 12) as Record<string, unknown> | null;
  const pass13 = getPassOutput(priorOutputs, 13) as Record<string, unknown> | null;

  return {
    company_name: report.company_name,
    company_profile: pass1?.company_profile,
    ownership_info: pass1?.ownership_info,
    industry_classification: pass1?.industry_classification,
    income_statements: pass2?.income_statements,
    key_financial_metrics: pass2?.key_metrics,
    balance_sheets: pass3?.balance_sheets,
    working_capital_analysis: pass3?.working_capital_analysis,
    industry_overview: pass4?.industry_overview,
    industry_benchmarks: pass4?.industry_benchmarks,
    valuation_multiples: pass4?.valuation_multiples,
    sde_calculations: pass5?.sde_calculations,
    ebitda_calculations: pass5?.ebitda_calculations,
    earnings_summary: pass5?.summary,
    risk_assessment: pass6?.company_risks,
    risk_summary: pass6?.risk_summary,
    company_strengths: pass6?.company_strengths,
    discount_rate: pass6?.risk_premium_calculation,
    asset_approach: pass7?.asset_approach,
    asset_approach_summary: pass7?.summary,
    income_approach: pass8?.income_approach,
    market_approach: pass9?.market_approach,
    value_synthesis: pass10?.value_synthesis,
    valuation_conclusion: pass10?.conclusion,
    key_value_drivers: pass10?.key_value_drivers,
    key_risks: pass10?.key_risks_to_value,
    economic_conditions: pass12,
    comparable_transactions: pass13?.comparable_transactions,
  };
}

/**
 * Narrative pass configurations (11a-11k)
 */
const NARRATIVE_PASS_CONFIGS: Record<string, NarrativePassConfig> = {
  '11a': {
    passNumber: '11a',
    passName: 'Executive Summary',
    maxTokens: 4096,
    temperature: 0.3,
    dependencies: ['11b', '11c', '11d', '11e', '11f', '11g', '11h', '11i', '11j', '11k'],
    runOrder: 11,
  },
  '11b': {
    passNumber: '11b',
    passName: 'Company Overview',
    maxTokens: 2048,
    temperature: 0.3,
    dependencies: [1, 2, 3],
    runOrder: 1,
  },
  '11c': {
    passNumber: '11c',
    passName: 'Financial Analysis',
    maxTokens: 4096,
    temperature: 0.2,
    dependencies: [2, 3, 4, 5],
    runOrder: 2,
  },
  '11d': {
    passNumber: '11d',
    passName: 'Industry Analysis',
    maxTokens: 2048,
    temperature: 0.3,
    dependencies: [4, 12, 13],
    runOrder: 3,
  },
  '11e': {
    passNumber: '11e',
    passName: 'Risk Assessment',
    maxTokens: 2048,
    temperature: 0.2,
    dependencies: [6],
    runOrder: 4,
  },
  '11f': {
    passNumber: '11f',
    passName: 'Asset Approach Narrative',
    maxTokens: 2048,
    temperature: 0.2,
    dependencies: [7],
    runOrder: 5,
  },
  '11g': {
    passNumber: '11g',
    passName: 'Income Approach Narrative',
    maxTokens: 2048,
    temperature: 0.2,
    dependencies: [8],
    runOrder: 6,
  },
  '11h': {
    passNumber: '11h',
    passName: 'Market Approach Narrative',
    maxTokens: 2048,
    temperature: 0.2,
    dependencies: [9, 13],
    runOrder: 7,
  },
  '11i': {
    passNumber: '11i',
    passName: 'Valuation Synthesis',
    maxTokens: 2048,
    temperature: 0.2,
    dependencies: [10, '11f', '11g', '11h'],
    runOrder: 8,
  },
  '11j': {
    passNumber: '11j',
    passName: 'Assumptions & Limiting Conditions',
    maxTokens: 1536,
    temperature: 0.1,
    dependencies: [1],
    runOrder: 9,
  },
  '11k': {
    passNumber: '11k',
    passName: 'Value Enhancement Recommendations',
    maxTokens: 2048,
    temperature: 0.4,
    dependencies: [2, 5, 6, 10],
    runOrder: 10,
  },
};

/**
 * Get narrative pass configuration by ID
 */
export function getNarrativePassConfig(passId: string): NarrativePassConfig | undefined {
  return NARRATIVE_PASS_CONFIGS[passId];
}

/**
 * Get all narrative pass configurations
 */
export function getAllNarrativePassConfigs(): NarrativePassConfig[] {
  return Object.values(NARRATIVE_PASS_CONFIGS).sort((a, b) => a.runOrder - b.runOrder);
}

/**
 * Deterministic calculation results that override AI-generated values
 */
export interface CalcResultsForNarrative {
  concluded_value: number;
  value_range_low: number;
  value_range_high: number;
  sde_multiple: number;
  weighted_sde: number;
  weighted_ebitda: number;
  asset_approach_value: number;
  income_approach_value: number;
  market_approach_value: number;
  asset_weight: number;
  income_weight: number;
  market_weight: number;
}

/**
 * Build prompts for a narrative pass (11a-11k)
 */
export function buildNarrativePassPrompt(
  passId: string,
  report: {
    company_name: string;
    document_text?: string;
    report_data?: Record<string, unknown> | null;
  },
  priorPassOutputs: Record<string, unknown>,
  priorNarratives: Record<string, unknown> = {},
  calculationResults?: CalcResultsForNarrative
): { systemPrompt: string; userPrompt: string } {
  // Get pass outputs by number
  const pass1 = getPassOutput(priorPassOutputs, 1) as Record<string, unknown> | null;
  const pass2 = getPassOutput(priorPassOutputs, 2) as Record<string, unknown> | null;
  const pass3 = getPassOutput(priorPassOutputs, 3) as Record<string, unknown> | null;
  const pass4 = getPassOutput(priorPassOutputs, 4) as Record<string, unknown> | null;
  const pass5 = getPassOutput(priorPassOutputs, 5) as Record<string, unknown> | null;
  const pass6 = getPassOutput(priorPassOutputs, 6) as Record<string, unknown> | null;
  const pass7 = getPassOutput(priorPassOutputs, 7) as Record<string, unknown> | null;
  const pass8 = getPassOutput(priorPassOutputs, 8) as Record<string, unknown> | null;
  const pass9 = getPassOutput(priorPassOutputs, 9) as Record<string, unknown> | null;
  const pass10 = getPassOutput(priorPassOutputs, 10) as Record<string, unknown> | null;
  const pass12 = getPassOutput(priorPassOutputs, 12) as Record<string, unknown> | null;
  const pass13 = getPassOutput(priorPassOutputs, 13) as Record<string, unknown> | null;

  // Extract common context
  const companyProfile = (pass1?.company_profile || {}) as Record<string, unknown>;
  companyProfile.company_name = companyProfile.legal_name || report.company_name;

  const incomeStatements = (pass2?.income_statements || []) as unknown[];
  const latestBalance = ((pass3?.balance_sheets || []) as unknown[])[0] as Record<string, unknown> | undefined;
  const industryData = (pass4?.industry_overview || pass4 || {}) as Record<string, unknown>;
  const normalizedEarnings = (pass5?.summary || pass5 || {}) as Record<string, unknown>;
  const riskAssessment = (pass6 || {}) as Record<string, unknown>;
  const assetApproach = (pass7?.asset_approach || pass7 || {}) as Record<string, unknown>;
  const incomeApproach = (pass8?.income_approach || pass8 || {}) as Record<string, unknown>;
  const marketApproach = (pass9?.market_approach || pass9 || {}) as Record<string, unknown>;
  const valuationResults = (pass10?.conclusion || pass10?.value_synthesis || pass10 || {}) as Record<string, unknown>;
  const economicConditions = (pass12 || {}) as Record<string, unknown>;
  const comparableTransactions = (pass13?.comparable_transactions || []) as unknown[];

  // Build industry benchmarks from industry data
  const industryBenchmarks = (industryData.benchmarks || industryData.industry_benchmarks || {}) as Record<string, unknown>;

  // Helper to get narrative content
  const getNarrativeContent = (result: unknown): string => {
    if (!result) return '';
    if (typeof result === 'string') return result;
    if (typeof result === 'object' && result !== null && 'content' in result) {
      return (result as { content: string }).content || '';
    }
    return '';
  };

  // Build prompts based on pass ID
  switch (passId) {
    case '11a': {
      // Executive Summary - needs all other narratives for context
      // revenue may be an object { total_revenue, ... } per IncomeStatementYear - extract number
      const rawRevenue11a = normalizedEarnings.revenue || (incomeStatements[0] as Record<string, unknown>)?.revenue;
      const financialSummary = {
        revenue: typeof rawRevenue11a === 'object' && rawRevenue11a !== null ? (rawRevenue11a as Record<string, unknown>).total_revenue : rawRevenue11a,
        revenue_cagr: normalizedEarnings.revenue_cagr || 0,
        gross_margin: normalizedEarnings.gross_margin || 0,
        operating_margin: normalizedEarnings.operating_margin || 0,
        normalized_sde: normalizedEarnings.normalized_sde || normalizedEarnings.weighted_average_sde,
        normalized_ebitda: normalizedEarnings.normalized_ebitda || normalizedEarnings.weighted_average_ebitda,
      };

      // Override with deterministic calculation engine results when available
      let effectiveValuationResults = valuationResults;
      if (calculationResults && calculationResults.concluded_value > 0) {
        effectiveValuationResults = {
          ...valuationResults,
          concluded_value: calculationResults.concluded_value,
          value_range_low: calculationResults.value_range_low,
          value_range_high: calculationResults.value_range_high,
          asset_approach: calculationResults.asset_approach_value,
          income_approach: calculationResults.income_approach_value,
          market_approach: calculationResults.market_approach_value,
          asset_weight: Math.round(calculationResults.asset_weight * 100),
          income_weight: Math.round(calculationResults.income_weight * 100),
          market_weight: Math.round(calculationResults.market_weight * 100),
          confidence_level: 'High',
        };
        financialSummary.normalized_sde = calculationResults.weighted_sde;
        financialSummary.normalized_ebitda = calculationResults.weighted_ebitda;
      }

      const otherNarratives = {
        company_overview: getNarrativeContent(priorNarratives['11b']),
        financial_analysis: getNarrativeContent(priorNarratives['11c']),
        risk_assessment: getNarrativeContent(priorNarratives['11e']),
      };
      return {
        systemPrompt: PASS_11A_SYSTEM_PROMPT,
        userPrompt: buildPass11aPrompt(companyProfile, financialSummary, effectiveValuationResults, riskAssessment, otherNarratives),
      };
    }

    case '11b': {
      // Company Overview
      return {
        systemPrompt: PASS_11B_SYSTEM_PROMPT,
        userPrompt: buildPass11bPrompt(companyProfile, incomeStatements, latestBalance || {}),
      };
    }

    case '11c': {
      // Financial Analysis
      return {
        systemPrompt: PASS_11C_SYSTEM_PROMPT,
        userPrompt: buildPass11cPrompt(incomeStatements, latestBalance || {}, normalizedEarnings, industryBenchmarks),
      };
    }

    case '11d': {
      // Industry Analysis
      return {
        systemPrompt: PASS_11D_SYSTEM_PROMPT,
        userPrompt: buildPass11dPrompt(industryData, economicConditions, comparableTransactions),
      };
    }

    case '11e': {
      // Risk Assessment
      return {
        systemPrompt: PASS_11E_SYSTEM_PROMPT,
        userPrompt: buildPass11ePrompt(riskAssessment),
      };
    }

    case '11f': {
      // Asset Approach Narrative
      return {
        systemPrompt: PASS_11F_SYSTEM_PROMPT,
        userPrompt: buildPass11fPrompt(assetApproach),
      };
    }

    case '11g': {
      // Income Approach Narrative
      return {
        systemPrompt: PASS_11G_SYSTEM_PROMPT,
        userPrompt: buildPass11gPrompt(incomeApproach),
      };
    }

    case '11h': {
      // Market Approach Narrative
      return {
        systemPrompt: PASS_11H_SYSTEM_PROMPT,
        userPrompt: buildPass11hPrompt(marketApproach, comparableTransactions as Record<string, unknown>[]),
      };
    }

    case '11i': {
      // Valuation Synthesis
      let effectiveValuation11i = valuationResults;
      if (calculationResults && calculationResults.concluded_value > 0) {
        effectiveValuation11i = {
          ...valuationResults,
          concluded_value: calculationResults.concluded_value,
          value_range_low: calculationResults.value_range_low,
          value_range_high: calculationResults.value_range_high,
          asset_approach: calculationResults.asset_approach_value,
          income_approach: calculationResults.income_approach_value,
          market_approach: calculationResults.market_approach_value,
          asset_weight: Math.round(calculationResults.asset_weight * 100),
          income_weight: Math.round(calculationResults.income_weight * 100),
          market_weight: Math.round(calculationResults.market_weight * 100),
        };
      }
      const approachNarratives = {
        asset: getNarrativeContent(priorNarratives['11f']),
        income: getNarrativeContent(priorNarratives['11g']),
        market: getNarrativeContent(priorNarratives['11h']),
      };
      return {
        systemPrompt: PASS_11I_SYSTEM_PROMPT,
        userPrompt: buildPass11iPrompt(effectiveValuation11i, approachNarratives),
      };
    }

    case '11j': {
      // Assumptions & Limiting Conditions
      const dataQuality = (pass1?.data_quality || {}) as Record<string, unknown>;
      const reportMetadata = {
        valuation_date: companyProfile.valuation_date || new Date().toISOString().split('T')[0],
        report_date: new Date().toISOString().split('T')[0],
        purpose: companyProfile.valuation_purpose || 'Fair Market Value determination',
        standard_of_value: 'Fair Market Value',
        premise_of_value: 'Going Concern',
        interest_valued: '100% equity interest',
        documents: pass1?.documents_identified,
        data_limitations: dataQuality.limitations,
      };
      return {
        systemPrompt: PASS_11J_SYSTEM_PROMPT,
        userPrompt: buildPass11jPrompt(reportMetadata),
      };
    }

    case '11k': {
      // Value Enhancement Recommendations
      // revenue may be an object { total_revenue, ... } per IncomeStatementYear - extract number
      const rawRevenue11k = normalizedEarnings.revenue || (incomeStatements[0] as Record<string, unknown>)?.revenue;
      const financialData = {
        revenue: typeof rawRevenue11k === 'object' && rawRevenue11k !== null ? (rawRevenue11k as Record<string, unknown>).total_revenue : rawRevenue11k,
        gross_margin: normalizedEarnings.gross_margin || 0,
        operating_margin: normalizedEarnings.operating_margin || 0,
        revenue_growth: normalizedEarnings.revenue_cagr || 0,
        industry_gross_margin: industryBenchmarks.gross_margin || 0.35,
        industry_operating_margin: industryBenchmarks.operating_margin || 0.10,
        industry_growth: industryBenchmarks.revenue_growth || 0.05,
      };
      let effectiveValuation11k = valuationResults;
      if (calculationResults && calculationResults.concluded_value > 0) {
        effectiveValuation11k = {
          ...valuationResults,
          concluded_value: calculationResults.concluded_value,
          value_range_low: calculationResults.value_range_low,
          value_range_high: calculationResults.value_range_high,
        };
      }
      return {
        systemPrompt: PASS_11K_SYSTEM_PROMPT,
        userPrompt: buildPass11kPrompt(companyProfile, financialData, riskAssessment, effectiveValuation11k),
      };
    }

    default:
      throw new Error(`Unknown narrative pass: ${passId}`);
  }
}
