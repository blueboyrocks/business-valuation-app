// Valuation Pipeline Orchestrator
// Chains all 6 passes together with dynamic knowledge injection

import Anthropic from '@anthropic-ai/sdk';
import {
  OrchestrationResult,
  PassOutput,
  Pass1Analysis,
  Pass2Analysis,
  Pass3Analysis,
  Pass4Analysis,
  Pass5Analysis,
  Pass6Analysis,
  FinalValuationOutput,
  PASS_CONFIGS,
  KnowledgeRequests,
} from './types';

import { KnowledgeRouter } from './knowledge-router';
import { buildPass1Prompt, validatePass1Output } from './prompts/pass-1-extraction';
import { buildPass2Prompt, validatePass2Output } from './prompts/pass-2-industry';
import { buildPass3Prompt, validatePass3Output } from './prompts/pass-3-earnings';
import { buildPass4Prompt, validatePass4Output } from './prompts/pass-4-risk';
import { buildPass5Prompt, validatePass5Output } from './prompts/pass-5-valuation';
import { buildPass6Prompt, validatePass6Output, performConsistencyChecks, formatForPdfGeneration } from './prompts/pass-6-synthesis';

// ============================================================================
// CONSTANTS
// ============================================================================

// Claude Sonnet pricing (as of 2024)
const PRICING = {
  inputTokensPer1M: 3.00,  // $3 per 1M input tokens
  outputTokensPer1M: 15.00, // $15 per 1M output tokens
};

const MAX_RETRIES = 2;
const MODEL = 'claude-sonnet-4-20250514';

// ============================================================================
// TYPES
// ============================================================================

interface PassResult<T> {
  success: boolean;
  output: T | null;
  rawResponse: string;
  inputTokens: number;
  outputTokens: number;
  error?: string;
  retryCount: number;
}

interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

/**
 * Run the complete 6-pass valuation pipeline
 */
export async function runValuationPipeline(
  pdfBase64: string,
  reportId: string,
  onProgress?: (pass: number, status: string) => void
): Promise<OrchestrationResult> {
  const startTime = Date.now();
  const client = new Anthropic();
  const knowledgeRouter = new KnowledgeRouter();

  // Track all pass outputs for debugging
  const passOutputs: Array<{
    pass: number;
    success: boolean;
    output: unknown;
    tokens: TokenUsage;
    error?: string;
  }> = [];

  // Track total token usage
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  // Store parsed outputs from each pass
  let pass1Output: Pass1Analysis | null = null;
  let pass2Output: Pass2Analysis | null = null;
  let pass3Output: Pass3Analysis | null = null;
  let pass4Output: Pass4Analysis | null = null;
  let pass5Output: Pass5Analysis | null = null;
  let pass6Output: FinalValuationOutput | null = null;

  try {
    // ========================================================================
    // PASS 1: Document Extraction
    // ========================================================================
    onProgress?.(1, 'Extracting financial data from documents...');

    const pass1Result = await executePass1(client, pdfBase64, knowledgeRouter);
    totalInputTokens += pass1Result.inputTokens;
    totalOutputTokens += pass1Result.outputTokens;

    passOutputs.push({
      pass: 1,
      success: pass1Result.success,
      output: pass1Result.output,
      tokens: {
        inputTokens: pass1Result.inputTokens,
        outputTokens: pass1Result.outputTokens,
        cost: calculateCost(pass1Result.inputTokens, pass1Result.outputTokens),
      },
      error: pass1Result.error,
    });

    if (!pass1Result.success || !pass1Result.output) {
      throw new Error(`Pass 1 failed: ${pass1Result.error || 'Unknown error'}`);
    }

    pass1Output = pass1Result.output;
    console.log(`Pass 1 complete: Extracted data for ${pass1Output.company_info.legal_name || 'Subject Company'}`);

    // ========================================================================
    // PASS 2: Industry Analysis
    // ========================================================================
    onProgress?.(2, 'Analyzing industry context and multiples...');

    const pass2Result = await executePass2(
      client,
      pass1Output,
      knowledgeRouter
    );
    totalInputTokens += pass2Result.inputTokens;
    totalOutputTokens += pass2Result.outputTokens;

    passOutputs.push({
      pass: 2,
      success: pass2Result.success,
      output: pass2Result.output,
      tokens: {
        inputTokens: pass2Result.inputTokens,
        outputTokens: pass2Result.outputTokens,
        cost: calculateCost(pass2Result.inputTokens, pass2Result.outputTokens),
      },
      error: pass2Result.error,
    });

    if (!pass2Result.success || !pass2Result.output) {
      throw new Error(`Pass 2 failed: ${pass2Result.error || 'Unknown error'}`);
    }

    pass2Output = pass2Result.output;
    console.log(`Pass 2 complete: Industry analysis for ${pass2Output.industry_overview?.industry_name || 'Unknown Industry'}`);

    // ========================================================================
    // PASS 3: Earnings Normalization
    // ========================================================================
    onProgress?.(3, 'Normalizing earnings and calculating SDE/EBITDA...');

    const pass3Result = await executePass3(
      client,
      pass1Output,
      pass2Output,
      knowledgeRouter
    );
    totalInputTokens += pass3Result.inputTokens;
    totalOutputTokens += pass3Result.outputTokens;

    passOutputs.push({
      pass: 3,
      success: pass3Result.success,
      output: pass3Result.output,
      tokens: {
        inputTokens: pass3Result.inputTokens,
        outputTokens: pass3Result.outputTokens,
        cost: calculateCost(pass3Result.inputTokens, pass3Result.outputTokens),
      },
      error: pass3Result.error,
    });

    if (!pass3Result.success || !pass3Result.output) {
      throw new Error(`Pass 3 failed: ${pass3Result.error || 'Unknown error'}`);
    }

    pass3Output = pass3Result.output;
    console.log(`Pass 3 complete: Weighted SDE = $${pass3Output.sde_calculation.weighted_average_sde.toLocaleString()}`);

    // ========================================================================
    // PASS 4: Risk Assessment
    // ========================================================================
    onProgress?.(4, 'Assessing risk factors and multiple adjustments...');

    const pass4Result = await executePass4(
      client,
      pass1Output,
      pass2Output,
      pass3Output,
      knowledgeRouter
    );
    totalInputTokens += pass4Result.inputTokens;
    totalOutputTokens += pass4Result.outputTokens;

    passOutputs.push({
      pass: 4,
      success: pass4Result.success,
      output: pass4Result.output,
      tokens: {
        inputTokens: pass4Result.inputTokens,
        outputTokens: pass4Result.outputTokens,
        cost: calculateCost(pass4Result.inputTokens, pass4Result.outputTokens),
      },
      error: pass4Result.error,
    });

    if (!pass4Result.success || !pass4Result.output) {
      throw new Error(`Pass 4 failed: ${pass4Result.error || 'Unknown error'}`);
    }

    pass4Output = pass4Result.output;
    console.log(`Pass 4 complete: Risk score = ${pass4Output.overall_risk_score.toFixed(2)} (${pass4Output.risk_category})`);

    // ========================================================================
    // PASS 5: Valuation Calculation
    // ========================================================================
    onProgress?.(5, 'Calculating value using three approaches...');

    const pass5Result = await executePass5(
      client,
      pass1Output,
      pass2Output,
      pass3Output,
      pass4Output,
      knowledgeRouter
    );
    totalInputTokens += pass5Result.inputTokens;
    totalOutputTokens += pass5Result.outputTokens;

    passOutputs.push({
      pass: 5,
      success: pass5Result.success,
      output: pass5Result.output,
      tokens: {
        inputTokens: pass5Result.inputTokens,
        outputTokens: pass5Result.outputTokens,
        cost: calculateCost(pass5Result.inputTokens, pass5Result.outputTokens),
      },
      error: pass5Result.error,
    });

    if (!pass5Result.success || !pass5Result.output) {
      throw new Error(`Pass 5 failed: ${pass5Result.error || 'Unknown error'}`);
    }

    pass5Output = pass5Result.output;
    console.log(`Pass 5 complete: Concluded value = $${pass5Output.valuation_synthesis.final_valuation.concluded_value.toLocaleString()}`);

    // ========================================================================
    // PASS 6: Final Synthesis
    // ========================================================================
    onProgress?.(6, 'Generating final report and narratives...');

    const pass6Result = await executePass6(
      client,
      pass1Output,
      pass2Output,
      pass3Output,
      pass4Output,
      pass5Output,
      knowledgeRouter
    );
    totalInputTokens += pass6Result.inputTokens;
    totalOutputTokens += pass6Result.outputTokens;

    passOutputs.push({
      pass: 6,
      success: pass6Result.success,
      output: pass6Result.output,
      tokens: {
        inputTokens: pass6Result.inputTokens,
        outputTokens: pass6Result.outputTokens,
        cost: calculateCost(pass6Result.inputTokens, pass6Result.outputTokens),
      },
      error: pass6Result.error,
    });

    if (!pass6Result.success || !pass6Result.output) {
      throw new Error(`Pass 6 failed: ${pass6Result.error || 'Unknown error'}`);
    }

    pass6Output = pass6Result.output;

    // Perform consistency checks
    const consistencyCheck = performConsistencyChecks(pass6Output);
    if (!consistencyCheck.passed) {
      console.warn('Consistency check warnings:', consistencyCheck.errors);
    }
    if (consistencyCheck.warnings.length > 0) {
      console.warn('Consistency check warnings:', consistencyCheck.warnings);
    }

    // Format for PDF generation
    const formattedOutput = formatForPdfGeneration(pass6Output);

    console.log(`Pass 6 complete: Final FMV = $${formattedOutput.valuation_conclusion.concluded_fair_market_value.toLocaleString()}`);

    // ========================================================================
    // SUCCESS - Return results
    // ========================================================================
    const processingTime = Date.now() - startTime;
    const totalCost = calculateCost(totalInputTokens, totalOutputTokens);

    onProgress?.(6, 'Valuation complete!');

    return {
      success: true,
      finalOutput: formattedOutput,
      passOutputs: passOutputs.map(p => ({
        pass: p.pass,
        success: p.success,
        output: p.output,
        error: p.error,
      })),
      totalTokensUsed: {
        input: totalInputTokens,
        output: totalOutputTokens,
        total: totalInputTokens + totalOutputTokens,
      },
      totalCost,
      processingTimeMs: processingTime,
      consistencyCheck,
    };
  } catch (error) {
    // Handle pipeline failure
    const processingTime = Date.now() - startTime;
    const totalCost = calculateCost(totalInputTokens, totalOutputTokens);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error('Pipeline failed:', errorMessage);

    return {
      success: false,
      error: errorMessage,
      finalOutput: null,
      passOutputs: passOutputs.map(p => ({
        pass: p.pass,
        success: p.success,
        output: p.output,
        error: p.error,
      })),
      totalTokensUsed: {
        input: totalInputTokens,
        output: totalOutputTokens,
        total: totalInputTokens + totalOutputTokens,
      },
      totalCost,
      processingTimeMs: processingTime,
      partialResults: {
        pass1: pass1Output,
        pass2: pass2Output,
        pass3: pass3Output,
        pass4: pass4Output,
        pass5: pass5Output,
      },
    };
  }
}

// ============================================================================
// PASS EXECUTION FUNCTIONS
// ============================================================================

/**
 * Execute Pass 1: Document Extraction
 */
async function executePass1(
  client: Anthropic,
  pdfBase64: string,
  knowledgeRouter: KnowledgeRouter
): Promise<PassResult<Pass1Analysis>> {
  const config = PASS_CONFIGS[1];
  let retryCount = 0;
  let lastError = '';

  while (retryCount <= MAX_RETRIES) {
    try {
      // Build prompt with minimal knowledge (document classification)
      const { system, user } = buildPass1Prompt();

      // Call Claude with PDF document
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        system: system,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: pdfBase64,
                },
              },
              {
                type: 'text',
                text: user,
              },
            ],
          },
        ],
        stream: false,
      });

      // Extract response text
      const responseText = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map(block => block.text)
        .join('\n');

      // Parse JSON from response
      const parsed = parseJsonFromResponse<PassOutput<Pass1Analysis>>(responseText);

      if (!parsed) {
        throw new Error('Failed to parse JSON from Pass 1 response');
      }

      // Validate output structure
      if (!validatePass1Output(parsed)) {
        throw new Error('Pass 1 output validation failed');
      }

      return {
        success: true,
        output: parsed.analysis,
        rawResponse: responseText,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        retryCount,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Pass 1 attempt ${retryCount + 1} failed: ${lastError}`);
      retryCount++;

      if (retryCount <= MAX_RETRIES) {
        // Wait before retry (exponential backoff)
        await sleep(1000 * Math.pow(2, retryCount));
      }
    }
  }

  return {
    success: false,
    output: null,
    rawResponse: '',
    inputTokens: 0,
    outputTokens: 0,
    error: lastError,
    retryCount,
  };
}

/**
 * Execute Pass 2: Industry Analysis
 */
async function executePass2(
  client: Anthropic,
  pass1: Pass1Analysis,
  knowledgeRouter: KnowledgeRouter
): Promise<PassResult<Pass2Analysis>> {
  const config = PASS_CONFIGS[2];
  let retryCount = 0;
  let lastError = '';

  while (retryCount <= MAX_RETRIES) {
    try {
      // Build knowledge injection for industry
      const industryKeywords = [
        pass1.industry_classification.detected_industry,
        ...(pass1.industry_classification.industry_keywords || []),
      ].filter(Boolean);

      const knowledgeInjection = knowledgeRouter.buildKnowledgeInjection(
        {},
        2,
        {
          keywords: industryKeywords,
          naicsCode: pass1.industry_classification.naics_code,
        }
      );

      // Build prompt with Pass 1 output and knowledge
      const companyName = pass1.company_info.legal_name || 'Subject Company';
      const { system, user } = buildPass2Prompt(companyName, pass1, knowledgeInjection);

      const response = await client.messages.create({
        model: MODEL,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        system: system,
        messages: [
          {
            role: 'user',
            content: user,
          },
        ],
        stream: false,
      });

      const responseText = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map(block => block.text)
        .join('\n');

      const parsed = parseJsonFromResponse<PassOutput<Pass2Analysis>>(responseText);

      if (!parsed) {
        throw new Error('Failed to parse JSON from Pass 2 response');
      }

      if (!validatePass2Output(parsed)) {
        throw new Error('Pass 2 output validation failed');
      }

      return {
        success: true,
        output: parsed.analysis,
        rawResponse: responseText,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        retryCount,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Pass 2 attempt ${retryCount + 1} failed: ${lastError}`);
      retryCount++;

      if (retryCount <= MAX_RETRIES) {
        await sleep(1000 * Math.pow(2, retryCount));
      }
    }
  }

  return {
    success: false,
    output: null,
    rawResponse: '',
    inputTokens: 0,
    outputTokens: 0,
    error: lastError,
    retryCount,
  };
}

/**
 * Execute Pass 3: Earnings Normalization
 */
async function executePass3(
  client: Anthropic,
  pass1: Pass1Analysis,
  pass2: Pass2Analysis,
  knowledgeRouter: KnowledgeRouter
): Promise<PassResult<Pass3Analysis>> {
  const config = PASS_CONFIGS[3];
  let retryCount = 0;
  let lastError = '';

  while (retryCount <= MAX_RETRIES) {
    try {
      // Build knowledge injection for tax form extraction
      const knowledgeInjection = knowledgeRouter.buildKnowledgeInjection(
        {},
        3,
        {
          taxFormType: pass1.document_info.document_type,
          keywords: [pass1.industry_classification.detected_industry],
        }
      );

      const companyName3 = pass1.company_info.legal_name || 'Subject Company';
      const { system: system3, user: user3 } = buildPass3Prompt(companyName3, pass1, pass2, knowledgeInjection);

      const response = await client.messages.create({
        model: MODEL,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        system: system3,
        messages: [
          {
            role: 'user',
            content: user3,
          },
        ],
        stream: false,
      });

      const responseText = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map(block => block.text)
        .join('\n');

      const parsed = parseJsonFromResponse<PassOutput<Pass3Analysis>>(responseText);

      if (!parsed) {
        throw new Error('Failed to parse JSON from Pass 3 response');
      }

      if (!validatePass3Output(parsed)) {
        throw new Error('Pass 3 output validation failed');
      }

      return {
        success: true,
        output: parsed.analysis,
        rawResponse: responseText,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        retryCount,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Pass 3 attempt ${retryCount + 1} failed: ${lastError}`);
      retryCount++;

      if (retryCount <= MAX_RETRIES) {
        await sleep(1000 * Math.pow(2, retryCount));
      }
    }
  }

  return {
    success: false,
    output: null,
    rawResponse: '',
    inputTokens: 0,
    outputTokens: 0,
    error: lastError,
    retryCount,
  };
}

/**
 * Execute Pass 4: Risk Assessment
 */
async function executePass4(
  client: Anthropic,
  pass1: Pass1Analysis,
  pass2: Pass2Analysis,
  pass3: Pass3Analysis,
  knowledgeRouter: KnowledgeRouter
): Promise<PassResult<Pass4Analysis>> {
  const config = PASS_CONFIGS[4];
  let retryCount = 0;
  let lastError = '';

  while (retryCount <= MAX_RETRIES) {
    try {
      // Build knowledge injection for risk framework
      const knowledgeInjection = knowledgeRouter.buildKnowledgeInjection(
        {},
        4,
        {
          keywords: [pass1.industry_classification.detected_industry],
        }
      );

      const companyName4 = pass1.company_info.legal_name || 'Subject Company';
      const { system: system4, user: user4 } = buildPass4Prompt(companyName4, pass1, pass2, pass3, knowledgeInjection);

      const response = await client.messages.create({
        model: MODEL,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        system: system4,
        messages: [
          {
            role: 'user',
            content: user4,
          },
        ],
        stream: false,
      });

      const responseText = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map(block => block.text)
        .join('\n');

      const parsed = parseJsonFromResponse<PassOutput<Pass4Analysis>>(responseText);

      if (!parsed) {
        throw new Error('Failed to parse JSON from Pass 4 response');
      }

      if (!validatePass4Output(parsed)) {
        throw new Error('Pass 4 output validation failed');
      }

      return {
        success: true,
        output: parsed.analysis,
        rawResponse: responseText,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        retryCount,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Pass 4 attempt ${retryCount + 1} failed: ${lastError}`);
      retryCount++;

      if (retryCount <= MAX_RETRIES) {
        await sleep(1000 * Math.pow(2, retryCount));
      }
    }
  }

  return {
    success: false,
    output: null,
    rawResponse: '',
    inputTokens: 0,
    outputTokens: 0,
    error: lastError,
    retryCount,
  };
}

/**
 * Execute Pass 5: Valuation Calculation
 */
async function executePass5(
  client: Anthropic,
  pass1: Pass1Analysis,
  pass2: Pass2Analysis,
  pass3: Pass3Analysis,
  pass4: Pass4Analysis,
  knowledgeRouter: KnowledgeRouter
): Promise<PassResult<Pass5Analysis>> {
  const config = PASS_CONFIGS[5];
  let retryCount = 0;
  let lastError = '';

  while (retryCount <= MAX_RETRIES) {
    try {
      // Build knowledge injection for valuation multiples
      const knowledgeInjection = knowledgeRouter.buildKnowledgeInjection(
        {},
        5,
        {
          keywords: [pass1.industry_classification.detected_industry],
          naicsCode: pass1.industry_classification.naics_code,
        }
      );

      const prompt = buildPass5Prompt(pass1, pass2, pass3, pass4, knowledgeInjection);

      const response = await client.messages.create({
        model: MODEL,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        stream: false,
      });

      const responseText = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map(block => block.text)
        .join('\n');

      const parsed = parseJsonFromResponse<PassOutput<Pass5Analysis>>(responseText);

      if (!parsed) {
        throw new Error('Failed to parse JSON from Pass 5 response');
      }

      if (!validatePass5Output(parsed)) {
        throw new Error('Pass 5 output validation failed');
      }

      return {
        success: true,
        output: parsed.analysis,
        rawResponse: responseText,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        retryCount,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Pass 5 attempt ${retryCount + 1} failed: ${lastError}`);
      retryCount++;

      if (retryCount <= MAX_RETRIES) {
        await sleep(1000 * Math.pow(2, retryCount));
      }
    }
  }

  return {
    success: false,
    output: null,
    rawResponse: '',
    inputTokens: 0,
    outputTokens: 0,
    error: lastError,
    retryCount,
  };
}

/**
 * Execute Pass 6: Final Synthesis
 */
async function executePass6(
  client: Anthropic,
  pass1: Pass1Analysis,
  pass2: Pass2Analysis,
  pass3: Pass3Analysis,
  pass4: Pass4Analysis,
  pass5: Pass5Analysis,
  knowledgeRouter: KnowledgeRouter
): Promise<PassResult<FinalValuationOutput>> {
  const config = PASS_CONFIGS[6];
  let retryCount = 0;
  let lastError = '';

  while (retryCount <= MAX_RETRIES) {
    try {
      // Build knowledge injection for output schema and formatting
      const knowledgeInjection = knowledgeRouter.buildKnowledgeInjection(
        {},
        6,
        {}
      );

      const prompt = buildPass6Prompt(pass1, pass2, pass3, pass4, pass5, knowledgeInjection);

      const response = await client.messages.create({
        model: MODEL,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        stream: false,
      });

      const responseText = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map(block => block.text)
        .join('\n');

      const parsed = parseJsonFromResponse<FinalValuationOutput>(responseText);

      if (!parsed) {
        throw new Error('Failed to parse JSON from Pass 6 response');
      }

      if (!validatePass6Output(parsed)) {
        throw new Error('Pass 6 output validation failed');
      }

      return {
        success: true,
        output: parsed,
        rawResponse: responseText,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        retryCount,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Pass 6 attempt ${retryCount + 1} failed: ${lastError}`);
      retryCount++;

      if (retryCount <= MAX_RETRIES) {
        await sleep(1000 * Math.pow(2, retryCount));
      }
    }
  }

  return {
    success: false,
    output: null,
    rawResponse: '',
    inputTokens: 0,
    outputTokens: 0,
    error: lastError,
    retryCount,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Parse JSON from Claude response (handles markdown code blocks)
 */
function parseJsonFromResponse<T>(response: string): T | null {
  try {
    // Try to extract JSON from markdown code block
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim()) as T;
    }

    // Try to find JSON object directly
    const jsonStart = response.indexOf('{');
    const jsonEnd = response.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      const jsonStr = response.substring(jsonStart, jsonEnd + 1);
      return JSON.parse(jsonStr) as T;
    }

    // Try parsing the entire response
    return JSON.parse(response) as T;
  } catch (error) {
    console.error('Failed to parse JSON from response:', error);
    console.error('Response preview:', response.substring(0, 500));
    return null;
  }
}

/**
 * Calculate cost from token usage
 */
function calculateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * PRICING.inputTokensPer1M;
  const outputCost = (outputTokens / 1_000_000) * PRICING.outputTokensPer1M;
  return Math.round((inputCost + outputCost) * 10000) / 10000; // Round to 4 decimal places
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  calculateCost,
  parseJsonFromResponse,
  PRICING,
  MODEL,
};
