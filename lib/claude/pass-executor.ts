/**
 * Pass Executor Utility
 *
 * Executes individual passes of the valuation pipeline.
 * Supports web search integration for enhanced data gathering.
 * Supports individual narrative passes (11a-11k) with expert personas.
 */

import Anthropic from '@anthropic-ai/sdk';
import { getPassConfig, buildPassPrompt, PassConfig, getNarrativePassConfig, buildNarrativePassPrompt } from './pass-configs';
import { NARRATIVE_EXECUTION_ORDER } from './prompts-v2';

export interface ExecutePassOptions {
  useWebSearch?: boolean;
  forceRegenerate?: boolean;
}

export interface PassExecutionResult {
  success: boolean;
  data?: unknown;
  error?: string;
  tokensUsed?: number;
  webSearchUsed?: boolean;
}

/**
 * Execute a single pass of the valuation pipeline
 */
export async function executePass(
  passNumber: number,
  reportId: string,
  report: {
    company_name: string;
    document_text?: string;
    report_data?: Record<string, unknown> | null;
  },
  priorPassOutputs: Record<string, unknown>,
  options: ExecutePassOptions = {}
): Promise<unknown> {
  const anthropic = new Anthropic();
  const passConfig = getPassConfig(passNumber);

  if (!passConfig) {
    throw new Error(`Unknown pass number: ${passNumber}`);
  }

  console.log(`[PASS ${passNumber}] Executing: ${passConfig.passName}`);

  // Build the prompt with context from prior passes
  const { systemPrompt, userPrompt } = buildPassPrompt(
    passNumber,
    report,
    priorPassOutputs,
    options
  );

  // Configure tools if web search is enabled
  // Note: Web search is a special tool type, handled differently
  const useWebSearchTool = options.useWebSearch && passConfig.supportsWebSearch;
  if (useWebSearchTool) {
    console.log(`[PASS ${passNumber}] Web search enabled`);
  }

  console.log(`[PASS ${passNumber}] Calling Claude API...`);
  console.log(`[PASS ${passNumber}] System prompt length: ${systemPrompt.length}`);
  console.log(`[PASS ${passNumber}] User prompt length: ${userPrompt.length}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messageParams: any = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: passConfig.maxTokens || 8192,
    temperature: passConfig.temperature || 0.2,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  };

  // Add web search tool if enabled
  if (useWebSearchTool) {
    messageParams.tools = [{
      type: 'web_search_20250305',
      name: 'web_search',
    }];
  }

  const response = await anthropic.messages.create(messageParams);

  // Extract text content from response
  let textContent = '';
  for (const block of response.content) {
    if (block.type === 'text') {
      textContent += block.text;
    }
  }

  console.log(`[PASS ${passNumber}] Response length: ${textContent.length} chars`);

  // Parse JSON response
  try {
    // Clean up potential markdown code fences
    let jsonStr = textContent.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    // Try to find JSON object in the response if it doesn't start with {
    if (!jsonStr.startsWith('{')) {
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log(`[PASS ${passNumber}] Found JSON object in response text`);
        jsonStr = jsonMatch[0];
      }
    }

    const parsed = JSON.parse(jsonStr);
    console.log(`[PASS ${passNumber}] Successfully parsed response`);
    return parsed;

  } catch (parseError) {
    console.error(`[PASS ${passNumber}] JSON parse error:`, parseError);
    console.error(`[PASS ${passNumber}] Raw content (first 500 chars):`, textContent.slice(0, 500));

    // Try one more time to extract JSON from the response
    try {
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0]);
        console.log(`[PASS ${passNumber}] Extracted JSON from mixed content`);
        return extracted;
      }
    } catch {
      // Fall through to return raw content
    }

    // Return raw text if JSON parsing fails
    return {
      raw_content: textContent,
      parse_error: true,
      pass_number: passNumber,
    };
  }
}

/**
 * Execute a single narrative pass (11a-11k)
 */
export async function executeNarrativePass(
  passId: string,
  reportId: string,
  report: {
    company_name: string;
    document_text?: string;
    report_data?: Record<string, unknown> | null;
  },
  priorPassOutputs: Record<string, unknown>,
  priorNarratives: Record<string, unknown> = {}
): Promise<unknown> {
  const anthropic = new Anthropic();
  const passConfig = getNarrativePassConfig(passId);

  if (!passConfig) {
    throw new Error(`Unknown narrative pass: ${passId}`);
  }

  console.log(`[NARRATIVE ${passId}] Executing: ${passConfig.passName}`);

  // Build the prompt with context from prior passes and narratives
  const { systemPrompt, userPrompt } = buildNarrativePassPrompt(
    passId,
    report,
    priorPassOutputs,
    priorNarratives
  );

  console.log(`[NARRATIVE ${passId}] Calling Claude API...`);
  console.log(`[NARRATIVE ${passId}] System prompt length: ${systemPrompt.length}`);
  console.log(`[NARRATIVE ${passId}] User prompt length: ${userPrompt.length}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messageParams: any = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: passConfig.maxTokens || 2048,
    temperature: passConfig.temperature || 0.3,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  };

  const response = await anthropic.messages.create(messageParams);

  // Extract text content from response
  let textContent = '';
  for (const block of response.content) {
    if (block.type === 'text') {
      textContent += block.text;
    }
  }

  console.log(`[NARRATIVE ${passId}] Response length: ${textContent.length} chars`);

  // Parse JSON response
  try {
    // Clean up potential markdown code fences
    let jsonStr = textContent.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    const parsed = JSON.parse(jsonStr);
    console.log(`[NARRATIVE ${passId}] Successfully parsed response`);
    console.log(`[NARRATIVE ${passId}] Word count: ${parsed.word_count || 'N/A'}`);
    return parsed;

  } catch (parseError) {
    console.error(`[NARRATIVE ${passId}] JSON parse error:`, parseError);
    console.error(`[NARRATIVE ${passId}] Raw content (first 500 chars):`, textContent.slice(0, 500));

    // Return raw text if JSON parsing fails
    return {
      content: textContent,
      section: passId,
      parse_error: true,
    };
  }
}

/**
 * Execute all narrative passes in the correct order (11b through 11k, then 11a)
 */
export async function executeAllNarrativePasses(
  reportId: string,
  report: {
    company_name: string;
    document_text?: string;
    report_data?: Record<string, unknown> | null;
  },
  priorPassOutputs: Record<string, unknown>,
  onProgress?: (passId: string, status: 'started' | 'completed' | 'error', result?: unknown) => void
): Promise<Record<string, unknown>> {
  const narrativeResults: Record<string, unknown> = {};

  console.log(`[NARRATIVES] Executing all ${NARRATIVE_EXECUTION_ORDER.length} narrative passes...`);
  console.log(`[NARRATIVES] Execution order: ${NARRATIVE_EXECUTION_ORDER.join(' -> ')}`);

  for (const passId of NARRATIVE_EXECUTION_ORDER) {
    console.log(`[NARRATIVES] Starting Pass ${passId}...`);
    onProgress?.(passId, 'started');

    try {
      const result = await executeNarrativePass(
        passId,
        reportId,
        report,
        priorPassOutputs,
        narrativeResults // Include prior narrative results for context
      );

      narrativeResults[passId] = result;
      onProgress?.(passId, 'completed', result);
      console.log(`[NARRATIVES] Completed Pass ${passId}`);

      // Brief delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[NARRATIVES] Error in Pass ${passId}:`, errorMessage);
      narrativeResults[passId] = { error: errorMessage, section: passId };
      onProgress?.(passId, 'error', { error: errorMessage });
    }
  }

  // Combine all narratives into unified structure
  return combineNarrativeResults(narrativeResults);
}

/**
 * Combine individual narrative results into a unified structure
 */
function combineNarrativeResults(results: Record<string, unknown>): Record<string, unknown> {
  // Helper to extract content from result
  const getContent = (result: unknown): string => {
    if (!result) return '';
    if (typeof result === 'string') return result;
    if (typeof result === 'object' && result !== null && 'content' in result) {
      return (result as { content: string }).content || '';
    }
    return '';
  };

  // Helper to extract word count
  const getWordCount = (result: unknown): number => {
    if (!result) return 0;
    if (typeof result === 'object' && result !== null && 'word_count' in result) {
      return (result as { word_count: number }).word_count || 0;
    }
    return 0;
  };

  const narratives = {
    executive_summary: getContent(results['11a']),
    company_overview: getContent(results['11b']),
    financial_analysis: getContent(results['11c']),
    industry_analysis: getContent(results['11d']),
    risk_assessment: getContent(results['11e']),
    asset_approach_narrative: getContent(results['11f']),
    income_approach_narrative: getContent(results['11g']),
    market_approach_narrative: getContent(results['11h']),
    valuation_synthesis: getContent(results['11i']),
    assumptions_limiting_conditions: getContent(results['11j']),
    value_enhancement_recommendations: getContent(results['11k']),
  };

  const wordCounts = {
    executive_summary: getWordCount(results['11a']),
    company_overview: getWordCount(results['11b']),
    financial_analysis: getWordCount(results['11c']),
    industry_analysis: getWordCount(results['11d']),
    risk_assessment: getWordCount(results['11e']),
    asset_approach_narrative: getWordCount(results['11f']),
    income_approach_narrative: getWordCount(results['11g']),
    market_approach_narrative: getWordCount(results['11h']),
    valuation_synthesis: getWordCount(results['11i']),
    assumptions_limiting_conditions: getWordCount(results['11j']),
    value_enhancement_recommendations: getWordCount(results['11k']),
  };

  const totalWordCount = Object.values(wordCounts).reduce((sum, count) => sum + count, 0);

  return {
    narratives,
    word_counts: {
      ...wordCounts,
      total: totalWordCount,
    },
    pass_results: results,
    generated_at: new Date().toISOString(),
    execution_order: [...NARRATIVE_EXECUTION_ORDER],
  };
}
