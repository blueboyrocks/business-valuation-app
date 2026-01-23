/**
 * Valuation System Prompts
 *
 * Export all prompt configurations for the valuation pipeline.
 *
 * Passes 1-3: Data Extraction
 * Passes 4-6: Analysis
 * Passes 7-9: Valuation Approaches
 * Pass 10: Value Synthesis
 * Passes 11a-11k: Individual Narrative Sections (Expert Personas)
 * Passes 12-13: Research with Web Search
 */

// Data Extraction Phase (Passes 1-3)
export { default as pass1Config, PASS_1_SYSTEM_PROMPT, PASS_1_USER_PROMPT } from './pass-01-document-classification';
export { default as pass2Config, PASS_2_SYSTEM_PROMPT, PASS_2_USER_PROMPT } from './pass-02-income-statement';
export { default as pass3Config, PASS_3_SYSTEM_PROMPT, PASS_3_USER_PROMPT } from './pass-03-balance-sheet';

// Analysis Phase (Passes 4-6)
export { default as pass4Config, PASS_4_SYSTEM_PROMPT, PASS_4_USER_PROMPT } from './pass-04-industry-analysis';
export { default as pass5Config, PASS_5_SYSTEM_PROMPT, PASS_5_USER_PROMPT } from './pass-05-earnings-normalization';
export { default as pass6Config, PASS_6_SYSTEM_PROMPT, PASS_6_USER_PROMPT } from './pass-06-risk-assessment';

// Valuation Approaches Phase (Passes 7-9)
export { default as pass7Config, PASS_7_SYSTEM_PROMPT, PASS_7_USER_PROMPT } from './pass-07-asset-approach';
export { default as pass8Config, PASS_8_SYSTEM_PROMPT, PASS_8_USER_PROMPT } from './pass-08-income-approach';
export { default as pass9Config, PASS_9_SYSTEM_PROMPT, PASS_9_USER_PROMPT } from './pass-09-market-approach';

// Synthesis Phase (Pass 10)
export { default as pass10Config, PASS_10_SYSTEM_PROMPT, PASS_10_USER_PROMPT } from './pass-10-value-synthesis';

// Legacy Pass 11 (kept for backwards compatibility)
export { default as pass11Config, PASS_11_SYSTEM_PROMPT, PASS_11_USER_PROMPT } from './pass-11-narratives';
export { default as pass12Config, PASS_12_SYSTEM_PROMPT, PASS_12_USER_PROMPT } from './pass-12-quality-review';

// Individual Narrative Passes (11a-11k) - Expert Personas
export { pass11aConfig, PASS_11A_SYSTEM_PROMPT, buildPass11aPrompt } from './pass-11a-executive-summary';
export { pass11bConfig, PASS_11B_SYSTEM_PROMPT, buildPass11bPrompt } from './pass-11b-company-overview';
export { pass11cConfig, PASS_11C_SYSTEM_PROMPT, buildPass11cPrompt } from './pass-11c-financial-analysis';
export { pass11dConfig, PASS_11D_SYSTEM_PROMPT, buildPass11dPrompt } from './pass-11d-industry-analysis';
export { pass11eConfig, PASS_11E_SYSTEM_PROMPT, buildPass11ePrompt } from './pass-11e-risk-assessment';
export { pass11fConfig, PASS_11F_SYSTEM_PROMPT, buildPass11fPrompt } from './pass-11f-asset-approach';
export { pass11gConfig, PASS_11G_SYSTEM_PROMPT, buildPass11gPrompt } from './pass-11g-income-approach';
export { pass11hConfig, PASS_11H_SYSTEM_PROMPT, buildPass11hPrompt } from './pass-11h-market-approach';
export { pass11iConfig, PASS_11I_SYSTEM_PROMPT, buildPass11iPrompt } from './pass-11i-valuation-synthesis';
export { pass11jConfig, PASS_11J_SYSTEM_PROMPT, buildPass11jPrompt } from './pass-11j-assumptions';
export { pass11kConfig, PASS_11K_SYSTEM_PROMPT, buildPass11kPrompt } from './pass-11k-recommendations';

// Enhanced Prompts with Web Search
export { PASS_4_WEB_SEARCH_SYSTEM_PROMPT, buildPass4WebSearchPrompt } from './pass-04-industry-with-search';
export { PASS_11_COMPLETE_SYSTEM_PROMPT, buildPass11CompletePrompt, pass11CompleteConfig } from './pass-11-narratives-complete';
export { PASS_12_ECONOMIC_SYSTEM_PROMPT, buildPass12EconomicPrompt, pass12EconomicConfig } from './pass-12-economic-conditions';
export { PASS_13_COMPARABLE_SYSTEM_PROMPT, buildPass13ComparablePrompt, pass13ComparableConfig } from './pass-13-comparable-transactions';

// Prompt configuration type for standard passes (1-12)
export interface PromptConfig {
  passNumber: number;
  passName: string;
  systemPrompt: string;
  userPrompt: string;
  expectedOutputType?: string;
  maxTokens: number;
  temperature: number;
}

// Prompt configuration type for narrative passes (11a-11k)
export interface NarrativePromptConfig {
  passNumber: string;
  passName: string;
  systemPrompt: string;
  userPromptBuilder: (...args: unknown[]) => string;
  maxTokens: number;
  temperature: number;
  dependencies: (number | string)[];
  runOrder: number;
}

// Get prompt config by pass number
export function getPromptConfig(passNumber: number): PromptConfig | null {
  switch (passNumber) {
    case 1:
      return require('./pass-01-document-classification').default;
    case 2:
      return require('./pass-02-income-statement').default;
    case 3:
      return require('./pass-03-balance-sheet').default;
    case 4:
      return require('./pass-04-industry-analysis').default;
    case 5:
      return require('./pass-05-earnings-normalization').default;
    case 6:
      return require('./pass-06-risk-assessment').default;
    case 7:
      return require('./pass-07-asset-approach').default;
    case 8:
      return require('./pass-08-income-approach').default;
    case 9:
      return require('./pass-09-market-approach').default;
    case 10:
      return require('./pass-10-value-synthesis').default;
    case 11:
      return require('./pass-11-narratives').default;
    case 12:
      return require('./pass-12-quality-review').default;
    default:
      return null;
  }
}

// Get narrative pass config by ID (11a-11k)
export function getNarrativePassConfig(passId: string): PromptConfig | null {
  switch (passId) {
    case '11a':
      return require('./pass-11a-executive-summary').pass11aConfig;
    case '11b':
      return require('./pass-11b-company-overview').pass11bConfig;
    case '11c':
      return require('./pass-11c-financial-analysis').pass11cConfig;
    case '11d':
      return require('./pass-11d-industry-analysis').pass11dConfig;
    case '11e':
      return require('./pass-11e-risk-assessment').pass11eConfig;
    case '11f':
      return require('./pass-11f-asset-approach').pass11fConfig;
    case '11g':
      return require('./pass-11g-income-approach').pass11gConfig;
    case '11h':
      return require('./pass-11h-market-approach').pass11hConfig;
    case '11i':
      return require('./pass-11i-valuation-synthesis').pass11iConfig;
    case '11j':
      return require('./pass-11j-assumptions').pass11jConfig;
    case '11k':
      return require('./pass-11k-recommendations').pass11kConfig;
    default:
      return null;
  }
}

// All available passes (numeric)
export const AVAILABLE_PASSES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const;

// All available narrative sub-passes
export const AVAILABLE_NARRATIVE_PASSES = ['11a', '11b', '11c', '11d', '11e', '11f', '11g', '11h', '11i', '11j', '11k'] as const;

// Narrative execution order (Executive Summary runs LAST)
export const NARRATIVE_EXECUTION_ORDER = [
  '11b', // Company Overview
  '11c', // Financial Analysis
  '11d', // Industry Analysis
  '11e', // Risk Assessment
  '11f', // Asset Approach
  '11g', // Income Approach
  '11h', // Market Approach
  '11i', // Valuation Synthesis
  '11j', // Assumptions
  '11k', // Recommendations
  '11a', // Executive Summary (LAST - synthesizes all others)
] as const;

// Pass metadata for UI/progress tracking
export const PASS_METADATA: Record<string | number, {
  name: string;
  phase: string;
  description: string;
  estimatedDuration: string;
  wordCount?: string;
  expert?: string;
}> = {
  1: {
    name: 'Document Classification & Company Profile',
    phase: 'extraction',
    description: 'Identify documents, extract company info, classify industry',
    estimatedDuration: '15-30 seconds',
  },
  2: {
    name: 'Income Statement Extraction',
    phase: 'extraction',
    description: 'Extract detailed income statement for all years',
    estimatedDuration: '20-40 seconds',
  },
  3: {
    name: 'Balance Sheet & Working Capital',
    phase: 'extraction',
    description: 'Extract balance sheet, calculate working capital metrics',
    estimatedDuration: '20-40 seconds',
  },
  4: {
    name: 'Industry Research & Competitive Analysis',
    phase: 'analysis',
    description: 'Analyze industry trends, competitive position, benchmarks',
    estimatedDuration: '30-60 seconds',
  },
  5: {
    name: 'Earnings Normalization',
    phase: 'analysis',
    description: 'Calculate SDE and EBITDA with adjustments',
    estimatedDuration: '25-45 seconds',
  },
  6: {
    name: 'Risk Assessment',
    phase: 'analysis',
    description: 'Score risk factors, determine discount/cap rates',
    estimatedDuration: '25-45 seconds',
  },
  7: {
    name: 'Asset Approach Valuation',
    phase: 'valuation',
    description: 'Calculate adjusted net asset value',
    estimatedDuration: '20-35 seconds',
  },
  8: {
    name: 'Income Approach Valuation',
    phase: 'valuation',
    description: 'Apply capitalization of earnings method',
    estimatedDuration: '25-45 seconds',
  },
  9: {
    name: 'Market Approach Valuation',
    phase: 'valuation',
    description: 'Apply transaction multiples and rules of thumb',
    estimatedDuration: '25-45 seconds',
  },
  10: {
    name: 'Value Synthesis & Reconciliation',
    phase: 'synthesis',
    description: 'Weight approaches, apply discounts, conclude value',
    estimatedDuration: '20-35 seconds',
  },
  11: {
    name: 'All Narratives (Legacy)',
    phase: 'narrative',
    description: 'Generate all report narratives in single pass',
    estimatedDuration: '60-90 seconds',
  },
  12: {
    name: 'Economic Conditions',
    phase: 'research',
    description: 'Current interest rates, inflation, market sentiment',
    estimatedDuration: '30-45 seconds',
  },
  13: {
    name: 'Comparable Transactions',
    phase: 'research',
    description: 'Recent M&A deals in industry',
    estimatedDuration: '30-45 seconds',
  },
  // Individual Narrative Passes (11a-11k)
  '11a': {
    name: 'Executive Summary',
    phase: 'narrative',
    description: 'Synthesizes entire report for readers',
    estimatedDuration: '20-30 seconds',
    wordCount: '1,000-1,200',
    expert: 'Senior Valuation Partner',
  },
  '11b': {
    name: 'Company Overview',
    phase: 'narrative',
    description: 'Business description and market position',
    estimatedDuration: '15-25 seconds',
    wordCount: '600-800',
    expert: 'Business Analyst',
  },
  '11c': {
    name: 'Financial Analysis',
    phase: 'narrative',
    description: 'Financial deep-dive with trends and benchmarks',
    estimatedDuration: '20-30 seconds',
    wordCount: '1,000-1,200',
    expert: 'CFO / Financial Analyst',
  },
  '11d': {
    name: 'Industry Analysis',
    phase: 'narrative',
    description: 'Market context and competitive dynamics',
    estimatedDuration: '15-25 seconds',
    wordCount: '600-800',
    expert: 'Industry Research Analyst',
  },
  '11e': {
    name: 'Risk Assessment',
    phase: 'narrative',
    description: 'Risk factors and discount rate justification',
    estimatedDuration: '15-25 seconds',
    wordCount: '700-900',
    expert: 'M&A Due Diligence Expert',
  },
  '11f': {
    name: 'Asset Approach',
    phase: 'narrative',
    description: 'Asset-based valuation methodology',
    estimatedDuration: '15-20 seconds',
    wordCount: '500-600',
    expert: 'Certified Appraiser (ASA)',
  },
  '11g': {
    name: 'Income Approach',
    phase: 'narrative',
    description: 'Earnings-based valuation methodology',
    estimatedDuration: '15-20 seconds',
    wordCount: '500-600',
    expert: 'CVA Valuation Analyst',
  },
  '11h': {
    name: 'Market Approach',
    phase: 'narrative',
    description: 'Transaction-based valuation methodology',
    estimatedDuration: '15-20 seconds',
    wordCount: '500-600',
    expert: 'M&A Transaction Advisor',
  },
  '11i': {
    name: 'Valuation Synthesis',
    phase: 'narrative',
    description: 'Weighting rationale and final conclusion',
    estimatedDuration: '15-25 seconds',
    wordCount: '700-900',
    expert: 'Lead Valuation Partner',
  },
  '11j': {
    name: 'Assumptions & Conditions',
    phase: 'narrative',
    description: 'Professional disclaimers and limitations',
    estimatedDuration: '10-15 seconds',
    wordCount: '400-500',
    expert: 'Valuation Compliance Expert',
  },
  '11k': {
    name: 'Value Enhancement',
    phase: 'narrative',
    description: 'Actionable recommendations for owners',
    estimatedDuration: '15-25 seconds',
    wordCount: '600-800',
    expert: 'Strategy Consultant',
  },
};
