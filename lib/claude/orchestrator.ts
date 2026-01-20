/**
 * Valuation Pipeline Orchestrator
 *
 * Chains all 6 passes together with dynamic knowledge injection,
 * error handling, retry logic, and cost tracking.
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  OrchestrationResult,
  PassNumber,
  PASS_CONFIGS,
  FinalValuationOutput,
  Pass1Analysis,
  Pass2Analysis,
  Pass3Analysis,
  Pass4Analysis,
  Pass5Analysis,
} from './types';

import {
  SECTOR_MULTIPLES,
  DETAILED_INDUSTRY_MULTIPLES,
  RISK_ASSESSMENT_FRAMEWORK,
  TAX_FORM_EXTRACTION_GUIDE,
  COMMON_ADDBACKS,
  getSectorMultiples,
  getIndustryMultiples,
  getTaxFormGuide,
} from './embedded-knowledge';

import pass1 from './prompts/pass-1-extraction';
import pass2 from './prompts/pass-2-industry';
import pass3 from './prompts/pass-3-earnings';
import pass4 from './prompts/pass-4-risk';
import pass5 from './prompts/pass-5-valuation';
import pass6 from './prompts/pass-6-synthesis';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Claude Sonnet pricing (as of 2024) */
const PRICING = {
  inputTokensPer1M: 3.00,   // $3 per 1M input tokens
  outputTokensPer1M: 15.00, // $15 per 1M output tokens
};

/** Maximum retry attempts per pass */
const MAX_RETRIES = 2;

/** Model to use for all passes */
const MODEL = 'claude-sonnet-4-20250514';

// =============================================================================
// TYPES
// =============================================================================

interface PassResult<T> {
  success: boolean;
  output: T | null;
  rawResponse: string;
  inputTokens: number;
  outputTokens: number;
  processingTime: number;
  error?: string;
  retryCount: number;
}

type ProgressCallback = (pass: number, status: string, percentage: number) => void;

// =============================================================================
// MAIN ORCHESTRATION FUNCTION
// =============================================================================

/**
 * Run the complete 6-pass valuation pipeline
 *
 * @param pdfBase64 - Base64 encoded PDF document
 * @param reportId - Unique identifier for this valuation report
 * @param onProgress - Optional callback for progress updates
 * @returns OrchestrationResult with final valuation or partial results on failure
 */
export async function runValuationPipeline(
  pdfBase64: string,
  reportId: string,
  onProgress?: ProgressCallback
): Promise<OrchestrationResult> {
  const pipelineStartTime = Date.now();
  const client = new Anthropic();

  // Track pass outputs
  const passOutputs: OrchestrationResult['passOutputs'] = [];

  // Track total tokens
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  // Store parsed outputs from each pass
  let pass1Output: Pass1Analysis | null = null;
  let pass2Output: Pass2Analysis | null = null;
  let pass3Output: Pass3Analysis | null = null;
  let pass4Output: Pass4Analysis | null = null;
  let pass5Output: Pass5Analysis | null = null;
  let finalOutput: FinalValuationOutput | null = null;

  try {
    // =========================================================================
    // PASS 1: Document Extraction
    // =========================================================================
    onProgress?.(1, 'Extracting financial data from documents...', 5);
    console.log(`[${reportId}] Starting Pass 1: Document Extraction`);

    const pass1Result = await executePass<Pass1Analysis>(
      client,
      1,
      () => buildPass1Request(pdfBase64),
      pass1.validate
    );

    passOutputs.push({
      pass: 1,
      output: pass1Result.output,
      tokensUsed: pass1Result.inputTokens + pass1Result.outputTokens,
      processingTime: pass1Result.processingTime,
    });

    totalInputTokens += pass1Result.inputTokens;
    totalOutputTokens += pass1Result.outputTokens;

    if (!pass1Result.success || !pass1Result.output) {
      throw new Error(`Pass 1 failed: ${pass1Result.error || 'Unknown error'}`);
    }

    pass1Output = pass1Result.output;
    console.log(`[${reportId}] Pass 1 complete: ${pass1Output.company_info?.name || 'Unknown Company'}`);

    // =========================================================================
    // PASS 2: Industry Analysis
    // =========================================================================
    onProgress?.(2, 'Analyzing industry context and multiples...', 20);
    console.log(`[${reportId}] Starting Pass 2: Industry Analysis`);

    const industryKnowledge = buildIndustryKnowledge(pass1Output);
    const pass1Summary = pass2.summarizePass1(pass1Result.output);

    const pass2Result = await executePass<Pass2Analysis>(
      client,
      2,
      () => ({
        system: pass2.systemContext,
        prompt: pass2.buildPrompt(pass1Summary, industryKnowledge),
      }),
      pass2.validate
    );

    passOutputs.push({
      pass: 2,
      output: pass2Result.output,
      tokensUsed: pass2Result.inputTokens + pass2Result.outputTokens,
      processingTime: pass2Result.processingTime,
    });

    totalInputTokens += pass2Result.inputTokens;
    totalOutputTokens += pass2Result.outputTokens;

    if (!pass2Result.success || !pass2Result.output) {
      throw new Error(`Pass 2 failed: ${pass2Result.error || 'Unknown error'}`);
    }

    pass2Output = pass2Result.output;
    console.log(`[${reportId}] Pass 2 complete: ${pass2Output.industry_overview?.sector || 'Unknown Industry'}`);

    // =========================================================================
    // PASS 3: Earnings Normalization
    // =========================================================================
    onProgress?.(3, 'Normalizing earnings and calculating SDE...', 40);
    console.log(`[${reportId}] Starting Pass 3: Earnings Normalization`);

    const taxFormKnowledge = buildTaxFormKnowledge(pass1Output);
    const pass1SummaryForPass3 = pass3.summarizePass1(pass1Result.output);
    const pass2SummaryForPass3 = pass3.summarizePass2(pass2Result.output);

    const pass3Result = await executePass<Pass3Analysis>(
      client,
      3,
      () => ({
        system: pass3.systemContext,
        prompt: pass3.buildPrompt(pass1SummaryForPass3, pass2SummaryForPass3, taxFormKnowledge),
      }),
      pass3.validate
    );

    passOutputs.push({
      pass: 3,
      output: pass3Result.output,
      tokensUsed: pass3Result.inputTokens + pass3Result.outputTokens,
      processingTime: pass3Result.processingTime,
    });

    totalInputTokens += pass3Result.inputTokens;
    totalOutputTokens += pass3Result.outputTokens;

    if (!pass3Result.success || !pass3Result.output) {
      throw new Error(`Pass 3 failed: ${pass3Result.error || 'Unknown error'}`);
    }

    pass3Output = pass3Result.output;
    const weightedSDE = pass3Output.sde_calculation?.weighted_average_sde || 0;
    console.log(`[${reportId}] Pass 3 complete: Weighted SDE = $${weightedSDE.toLocaleString()}`);

    // =========================================================================
    // PASS 4: Risk Assessment
    // =========================================================================
    onProgress?.(4, 'Assessing risk factors...', 55);
    console.log(`[${reportId}] Starting Pass 4: Risk Assessment`);

    const riskKnowledge = buildRiskKnowledge();
    const pass1SummaryForPass4 = pass4.summarizePass1(pass1Result.output);
    const pass2SummaryForPass4 = pass4.summarizePass2(pass2Result.output);
    const pass3SummaryForPass4 = pass4.summarizePass3(pass3Result.output);

    const pass4Result = await executePass<Pass4Analysis>(
      client,
      4,
      () => ({
        system: pass4.systemContext,
        prompt: pass4.buildPrompt(
          pass1SummaryForPass4,
          pass2SummaryForPass4,
          pass3SummaryForPass4,
          riskKnowledge
        ),
      }),
      pass4.validate
    );

    passOutputs.push({
      pass: 4,
      output: pass4Result.output,
      tokensUsed: pass4Result.inputTokens + pass4Result.outputTokens,
      processingTime: pass4Result.processingTime,
    });

    totalInputTokens += pass4Result.inputTokens;
    totalOutputTokens += pass4Result.outputTokens;

    if (!pass4Result.success || !pass4Result.output) {
      throw new Error(`Pass 4 failed: ${pass4Result.error || 'Unknown error'}`);
    }

    pass4Output = pass4Result.output;
    console.log(`[${reportId}] Pass 4 complete: Risk Score = ${pass4Output.overall_risk_score?.toFixed(2)} (${pass4Output.overall_risk_rating})`);

    // =========================================================================
    // PASS 5: Valuation Calculation
    // =========================================================================
    onProgress?.(5, 'Calculating value using three approaches...', 70);
    console.log(`[${reportId}] Starting Pass 5: Valuation Calculation`);

    const valuationKnowledge = buildValuationKnowledge(pass1Output, pass2Output);
    const pass1SummaryForPass5 = pass5.summarizePass1(pass1Result.output);
    const pass2SummaryForPass5 = pass5.summarizePass2(pass2Result.output);
    const pass3SummaryForPass5 = pass5.summarizePass3(pass3Result.output);
    const pass4SummaryForPass5 = pass5.summarizePass4(pass4Result.output);

    const pass5Result = await executePass<Pass5Analysis>(
      client,
      5,
      () => ({
        system: pass5.systemContext,
        prompt: pass5.buildPrompt(
          pass1SummaryForPass5,
          pass2SummaryForPass5,
          pass3SummaryForPass5,
          pass4SummaryForPass5,
          valuationKnowledge
        ),
      }),
      pass5.validate
    );

    passOutputs.push({
      pass: 5,
      output: pass5Result.output,
      tokensUsed: pass5Result.inputTokens + pass5Result.outputTokens,
      processingTime: pass5Result.processingTime,
    });

    totalInputTokens += pass5Result.inputTokens;
    totalOutputTokens += pass5Result.outputTokens;

    if (!pass5Result.success || !pass5Result.output) {
      throw new Error(`Pass 5 failed: ${pass5Result.error || 'Unknown error'}`);
    }

    pass5Output = pass5Result.output;
    const incomeValue = pass5Output.income_approach?.capitalized_value || 0;
    console.log(`[${reportId}] Pass 5 complete: Income Approach Value = $${incomeValue.toLocaleString()}`);

    // =========================================================================
    // PASS 6: Final Synthesis
    // =========================================================================
    onProgress?.(6, 'Generating final report and narratives...', 85);
    console.log(`[${reportId}] Starting Pass 6: Final Synthesis`);

    const comprehensiveSummary = pass6.createComprehensiveSummary(
      pass1Result.output,
      pass2Result.output,
      pass3Result.output,
      pass4Result.output,
      pass5Result.output
    );

    const pass6Result = await executePass<FinalValuationOutput>(
      client,
      6,
      () => ({
        system: pass6.systemContext,
        prompt: pass6.buildPrompt(
          pass5.summarizePass1(pass1Result.output),
          pass5.summarizePass2(pass2Result.output),
          pass5.summarizePass3(pass3Result.output),
          pass5.summarizePass4(pass4Result.output),
          comprehensiveSummary,
          ''
        ),
      }),
      pass6.validate
    );

    passOutputs.push({
      pass: 6,
      output: pass6Result.output,
      tokensUsed: pass6Result.inputTokens + pass6Result.outputTokens,
      processingTime: pass6Result.processingTime,
    });

    totalInputTokens += pass6Result.inputTokens;
    totalOutputTokens += pass6Result.outputTokens;

    if (!pass6Result.success || !pass6Result.output) {
      throw new Error(`Pass 6 failed: ${pass6Result.error || 'Unknown error'}`);
    }

    finalOutput = pass6Result.output;

    // Perform consistency checks
    const consistencyResult = pass6.performConsistencyChecks(finalOutput);
    if (!consistencyResult.passed) {
      console.warn(`[${reportId}] Consistency check errors:`, consistencyResult.errors);
    }
    if (consistencyResult.warnings.length > 0) {
      console.warn(`[${reportId}] Consistency check warnings:`, consistencyResult.warnings);
    }

    const concludedValue = finalOutput.valuation_synthesis?.final_valuation?.concluded_value || 0;
    console.log(`[${reportId}] Pass 6 complete: Concluded FMV = $${concludedValue.toLocaleString()}`);

    // =========================================================================
    // SUCCESS - Return results
    // =========================================================================
    const processingTime = Date.now() - pipelineStartTime;
    const totalCost = calculateCost(totalInputTokens, totalOutputTokens);

    onProgress?.(6, 'Valuation complete!', 100);
    console.log(`[${reportId}] Pipeline complete in ${(processingTime / 1000).toFixed(1)}s, cost: $${totalCost.toFixed(4)}`);

    return {
      success: true,
      finalOutput,
      passOutputs,
      totalTokensUsed: totalInputTokens + totalOutputTokens,
      totalCost,
      processingTime,
    };

  } catch (error) {
    // Handle pipeline failure - return partial results
    const processingTime = Date.now() - pipelineStartTime;
    const totalCost = calculateCost(totalInputTokens, totalOutputTokens);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error(`[${reportId}] Pipeline failed: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
      finalOutput: null,
      passOutputs,
      totalTokensUsed: totalInputTokens + totalOutputTokens,
      totalCost,
      processingTime,
    };
  }
}

// =============================================================================
// PASS EXECUTION
// =============================================================================

/**
 * Execute a single pass with retry logic
 */
async function executePass<T>(
  client: Anthropic,
  passNumber: PassNumber,
  buildRequest: () => { system?: string; prompt: string; pdfBase64?: string },
  validate: (output: unknown) => { valid: boolean; errors: string[] }
): Promise<PassResult<T>> {
  const config = PASS_CONFIGS[passNumber];
  const startTime = Date.now();
  let retryCount = 0;
  let lastError = '';

  while (retryCount <= MAX_RETRIES) {
    try {
      const request = buildRequest();

      // Build messages based on whether we have a PDF
      const messages: Anthropic.MessageParam[] = request.pdfBase64
        ? [
            {
              role: 'user',
              content: [
                {
                  type: 'document',
                  source: {
                    type: 'base64',
                    media_type: 'application/pdf',
                    data: request.pdfBase64,
                  },
                } as Anthropic.DocumentBlockParam,
                {
                  type: 'text',
                  text: request.prompt,
                },
              ],
            },
          ]
        : [
            {
              role: 'user',
              content: request.prompt,
            },
          ];

      // Call Claude API
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        ...(request.system && { system: request.system }),
        messages,
      });

      // Extract response text
      const responseText = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map(block => block.text)
        .join('\n');

      // Parse JSON from response
      const parsed = parsePassOutput<T>(responseText);

      if (!parsed) {
        throw new Error(`Failed to parse JSON from Pass ${passNumber} response`);
      }

      // Validate output structure
      const validation = validate(parsed);
      if (!validation.valid) {
        console.warn(`Pass ${passNumber} validation errors:`, validation.errors);
        // Continue anyway if we have output - validation is a warning
      }

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        output: parsed.analysis || parsed as T,
        rawResponse: responseText,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        processingTime,
        retryCount,
      };

    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Pass ${passNumber} attempt ${retryCount + 1} failed: ${lastError}`);
      retryCount++;

      if (retryCount <= MAX_RETRIES) {
        // Exponential backoff
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
    processingTime: Date.now() - startTime,
    error: lastError,
    retryCount,
  };
}

/**
 * Build Pass 1 request with PDF document
 */
function buildPass1Request(pdfBase64: string): { system: string; prompt: string; pdfBase64: string } {
  return {
    system: pass1.systemContext,
    prompt: pass1.buildPrompt(),
    pdfBase64,
  };
}

// =============================================================================
// KNOWLEDGE INJECTION HELPERS
// =============================================================================

/**
 * Build industry-specific knowledge injection for Pass 2
 */
export function buildIndustryKnowledge(pass1Output: Pass1Analysis): string {
  const sections: string[] = [];

  // Determine sector from keywords
  const keywords = pass1Output.industry_classification?.keywords || [];
  const naicsCode = pass1Output.industry_classification?.naics_code || '';
  const sector = determineSector(keywords, naicsCode);

  // Get sector multiples
  const sectorMultiples = getSectorMultiples(sector);
  if (sectorMultiples) {
    sections.push(`## SECTOR MULTIPLES (${sector})

| Metric | Low | Typical | High |
|--------|-----|---------|------|
| SDE Multiple | ${sectorMultiples.sdeMultipleLow}x | ${sectorMultiples.sdeMultipleMedian}x | ${sectorMultiples.sdeMultipleHigh}x |
| Revenue Multiple | ${sectorMultiples.revenueMultipleLow}x | ${sectorMultiples.revenueMultipleMedian}x | ${sectorMultiples.revenueMultipleHigh}x |

**Typical Margins:**
- Gross Margin: ${(sectorMultiples.typicalMargins.gross.low * 100).toFixed(0)}% - ${(sectorMultiples.typicalMargins.gross.high * 100).toFixed(0)}%
- Operating Margin: ${(sectorMultiples.typicalMargins.operating.low * 100).toFixed(0)}% - ${(sectorMultiples.typicalMargins.operating.high * 100).toFixed(0)}%

**Key Considerations:**
${sectorMultiples.keyConsiderations.map(c => `- ${c}`).join('\n')}`);
  }

  // Get industry-specific multiples if NAICS code available
  if (naicsCode) {
    const industryMultiples = getIndustryMultiples(naicsCode);
    if (industryMultiples) {
      sections.push(`## INDUSTRY-SPECIFIC DATA (NAICS ${naicsCode})

**Industry:** ${industryMultiples.industryName}

| Metric | Low | Typical | High |
|--------|-----|---------|------|
| SDE Multiple | ${industryMultiples.sdeMultipleLow}x | ${industryMultiples.sdeMultipleMedian}x | ${industryMultiples.sdeMultipleHigh}x |
| Revenue Multiple | ${industryMultiples.revenueMultipleLow}x | ${industryMultiples.revenueMultipleMedian}x | ${industryMultiples.revenueMultipleHigh}x |

**Notes:** ${industryMultiples.notes}`);
    }
  }

  return sections.join('\n\n---\n\n') || 'No specific industry data available. Use general small business valuation principles.';
}

/**
 * Build tax form-specific knowledge injection for Pass 3
 */
export function buildTaxFormKnowledge(pass1Output: Pass1Analysis): string {
  const sections: string[] = [];

  // Determine document type from Pass 1
  const documents = pass1Output.document_info?.documents_found || [];
  const taxForms = documents.filter(d =>
    ['1120-S', '1120', '1065', 'Schedule C'].includes(d.type)
  );

  // Get tax form guide for each form found
  for (const form of taxForms) {
    const guide = getTaxFormGuide(form.type as '1120-S' | '1120' | '1065' | 'Schedule C');
    if (guide) {
      // Find key fields for SDE calculation
      const keyFields = guide.fields.filter(f =>
        f.mappedTo.includes('officer') ||
        f.mappedTo.includes('Compensation') ||
        f.mappedTo.includes('depreciation') ||
        f.mappedTo.includes('interest') ||
        f.notes
      );

      sections.push(`## ${guide.formName} EXTRACTION GUIDE

**Form Type:** ${guide.formType}
**Description:** ${guide.description}

### Key Lines for Earnings Normalization

| Line | Description | Maps To | Notes |
|------|-------------|---------|-------|
${keyFields.map(field =>
  `| ${field.line} | ${field.label} | ${field.mappedTo} | ${field.notes || '-'} |`
).join('\n')}

### All Fields Reference

| Line | Description | Maps To |
|------|-------------|---------|
${guide.fields.map(field =>
  `| ${field.line} | ${field.label} | ${field.mappedTo} |`
).join('\n')}`);
    }
  }

  // Add common add-backs reference
  sections.push(`## COMMON SDE ADD-BACK CATEGORIES

${COMMON_ADDBACKS.map(cat => `### ${cat.category}
${cat.description}

${cat.items.map(item => `- **${item.name}**${item.typical ? ' (Typical)' : ''}: ${item.notes}`).join('\n')}`).join('\n\n')}`);

  return sections.join('\n\n---\n\n') || 'No specific tax form guidance available.';
}

/**
 * Build risk assessment knowledge injection for Pass 4
 */
export function buildRiskKnowledge(): string {
  const sections: string[] = [];

  sections.push(`## RISK ASSESSMENT FRAMEWORK

The following factors should be evaluated, each scored 1-3 (Low/Medium/High):

| Factor | Weight | Impact on Multiple |
|--------|--------|---------------------|
${RISK_ASSESSMENT_FRAMEWORK.map(rf =>
  `| ${rf.name} | ${(rf.weight * 100).toFixed(0)}% | ${rf.impactOnMultiple} |`
).join('\n')}

### Detailed Scoring Criteria

${RISK_ASSESSMENT_FRAMEWORK.map(rf => `**${rf.name}** (Weight: ${(rf.weight * 100).toFixed(0)}%)
- Low (${rf.scoringCriteria.low.score}): ${rf.scoringCriteria.low.description}
- Medium (${rf.scoringCriteria.medium.score}): ${rf.scoringCriteria.medium.description}
- High (${rf.scoringCriteria.high.score}): ${rf.scoringCriteria.high.description}
`).join('\n')}

### Scoring Guide

| Score | Rating | Description |
|-------|--------|-------------|
| 1 | Low Risk | Favorable condition, supports premium |
| 2 | Below Average | Better than typical |
| 3 | Average | Typical for small business |
| 4 | Above Average | Concerning, warrants discount |
| 5 | High Risk | Serious concern, significant discount |

### Multiple Adjustment Table

| Weighted Score | Risk Rating | Multiple Adjustment |
|----------------|-------------|---------------------|
| 1.0 - 1.5 | Low | +0.5x to +1.0x |
| 1.5 - 2.0 | Below Average | +0.25x to +0.5x |
| 2.0 - 2.5 | Average | No adjustment |
| 2.5 - 3.0 | Above Average | -0.25x to -0.5x |
| 3.0 - 3.5 | High | -0.5x to -0.75x |
| 3.5+ | Very High | -0.75x or more |`);

  return sections.join('\n\n');
}

/**
 * Build valuation knowledge injection for Pass 5
 */
export function buildValuationKnowledge(
  pass1Output: Pass1Analysis,
  pass2Output: Pass2Analysis
): string {
  const sections: string[] = [];

  // Current market data
  sections.push(`## CURRENT MARKET DATA

| Component | Rate | Source |
|-----------|------|--------|
| Risk-Free Rate (10-Year Treasury) | 4.5% | Federal Reserve |
| Equity Risk Premium | 6.0% | Duff & Phelps |
| Long-Term Growth Rate | 2.5% | GDP projection |

### Size Premium Guidelines

| Revenue | Size Premium |
|---------|--------------|
| < $500K | 6.0% |
| $500K - $2M | 5.0% |
| $2M - $10M | 4.0% |
| > $10M | 3.0% |`);

  // Get industry multiples from Pass 2 if available
  if (pass2Output?.valuation_multiples) {
    const mult = pass2Output.valuation_multiples;
    sections.push(`## INDUSTRY MULTIPLES (from Pass 2)

| Multiple Type | Low | Typical | High |
|---------------|-----|---------|------|
| SDE Multiple | ${mult.sde_multiple?.low || '?'}x | ${mult.sde_multiple?.typical || '?'}x | ${mult.sde_multiple?.high || '?'}x |
| Revenue Multiple | ${mult.revenue_multiple?.low || '?'}x | ${mult.revenue_multiple?.typical || '?'}x | ${mult.revenue_multiple?.high || '?'}x |

**Source:** ${mult.source || 'Industry data'}`);
  }

  // Weighting guidelines
  sections.push(`## APPROACH WEIGHTING GUIDELINES

| Business Type | Asset | Income | Market |
|---------------|-------|--------|--------|
| Service Business | 15% | 40% | 45% |
| Retail Business | 20% | 35% | 45% |
| Manufacturing | 25% | 40% | 35% |
| Professional Practice | 15% | 45% | 40% |
| Asset-Heavy Business | 35% | 35% | 30% |

**Weights must sum to 100%**`);

  return sections.join('\n\n---\n\n');
}

/**
 * Determine sector from keywords and NAICS code
 */
export function determineSector(keywords: string[], naicsCode: string): string {
  // Map NAICS prefixes to sectors
  const naicsSectorMap: Record<string, string> = {
    '23': 'Construction',
    '31': 'Manufacturing',
    '32': 'Manufacturing',
    '33': 'Manufacturing',
    '44': 'Retail',
    '45': 'Retail',
    '48': 'Transportation',
    '49': 'Transportation',
    '51': 'Technology',
    '52': 'Financial Services',
    '53': 'Real Estate',
    '54': 'Professional Services',
    '56': 'Business Services',
    '62': 'Healthcare',
    '72': 'Hospitality',
    '81': 'Personal Services',
  };

  // Try NAICS code first
  if (naicsCode && naicsCode.length >= 2) {
    const prefix = naicsCode.substring(0, 2);
    if (naicsSectorMap[prefix]) {
      return naicsSectorMap[prefix];
    }
  }

  // Fall back to keyword matching
  const keywordLower = keywords.map(k => k.toLowerCase()).join(' ');

  if (/hvac|plumb|electric|construct|contract/.test(keywordLower)) return 'Construction';
  if (/restaurant|food|bar|cafe|catering/.test(keywordLower)) return 'Food & Beverage';
  if (/retail|store|shop|boutique/.test(keywordLower)) return 'Retail';
  if (/health|medical|dental|clinic/.test(keywordLower)) return 'Healthcare';
  if (/tech|software|it|computer/.test(keywordLower)) return 'Technology';
  if (/account|legal|consult|professional/.test(keywordLower)) return 'Professional Services';
  if (/salon|spa|beauty|personal/.test(keywordLower)) return 'Personal Services';
  if (/auto|car|truck|vehicle/.test(keywordLower)) return 'Automotive';
  if (/hotel|motel|lodging/.test(keywordLower)) return 'Hospitality';
  if (/manufact|product|fabricat/.test(keywordLower)) return 'Manufacturing';
  if (/transport|truck|freight|logistic/.test(keywordLower)) return 'Transportation';
  if (/clean|janitor|maid|maintenance/.test(keywordLower)) return 'Business Services';

  return 'General Business';
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Parse JSON from Claude response, handling markdown code blocks
 */
export function parsePassOutput<T>(response: string): (T & { analysis?: T }) | null {
  try {
    // Try to extract JSON from markdown code block
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }

    // Try to find JSON object directly
    const jsonStart = response.indexOf('{');
    const jsonEnd = response.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      const jsonStr = response.substring(jsonStart, jsonEnd + 1);
      return JSON.parse(jsonStr);
    }

    // Try parsing the entire response
    return JSON.parse(response);
  } catch (error) {
    console.error('Failed to parse JSON from response:', error);
    console.error('Response preview:', response.substring(0, 500));
    return null;
  }
}

/**
 * Calculate cost from token usage
 */
export function calculateCost(inputTokens: number, outputTokens: number): number {
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

// =============================================================================
// EXPORTS
// =============================================================================

export {
  PRICING,
  MODEL,
  MAX_RETRIES,
};

export default {
  runValuationPipeline,
  parsePassOutput,
  calculateCost,
  buildIndustryKnowledge,
  buildTaxFormKnowledge,
  buildRiskKnowledge,
  buildValuationKnowledge,
  determineSector,
};
