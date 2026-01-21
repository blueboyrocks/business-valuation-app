/**
 * 12-Pass Valuation System Prompts
 *
 * Export all prompt configurations for the 12-pass pipeline.
 *
 * Passes 1-3: Data Extraction
 * Passes 4-6: Analysis
 * Passes 7-9: Valuation Approaches
 * Passes 10-12: Synthesis & Review
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

// Synthesis & Review Phase (Passes 10-12)
export { default as pass10Config, PASS_10_SYSTEM_PROMPT, PASS_10_USER_PROMPT } from './pass-10-value-synthesis';
export { default as pass11Config, PASS_11_SYSTEM_PROMPT, PASS_11_USER_PROMPT } from './pass-11-narratives';
export { default as pass12Config, PASS_12_SYSTEM_PROMPT, PASS_12_USER_PROMPT } from './pass-12-quality-review';

// Prompt configuration type
export interface PromptConfig {
  passNumber: number;
  passName: string;
  systemPrompt: string;
  userPrompt: string;
  expectedOutputType: string;
  maxTokens: number;
  temperature: number;
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

// All available passes
export const AVAILABLE_PASSES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

// Pass metadata for UI/progress tracking
export const PASS_METADATA = {
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
    name: 'Executive Summary & Narratives',
    phase: 'synthesis',
    description: 'Generate all report narratives and summaries',
    estimatedDuration: '40-60 seconds',
  },
  12: {
    name: 'Quality Review & Error Correction',
    phase: 'synthesis',
    description: 'Validate calculations, check consistency, finalize',
    estimatedDuration: '30-50 seconds',
  },
} as const;
