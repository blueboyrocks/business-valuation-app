/**
 * Claude Skills API Business Valuation Processing Route
 *
 * This API route processes uploaded documents using Anthropic's Skills API.
 * It uses the pre-built PDF skill and optionally a custom business-valuation-expert skill.
 *
 * Required environment variables:
 * - ANTHROPIC_API_KEY: Your Anthropic API key
 * - BUSINESS_VALUATION_SKILL_ID: (Optional) Custom skill ID if uploaded
 *
 * Required betas:
 * - code-execution-2025-08-25: Enables code execution (required for Skills)
 * - skills-2025-10-02: Enables Skills API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Vercel Pro allows up to 5 minutes for serverless functions
export const maxDuration = 300;

// Skills configuration
const USE_CUSTOM_SKILL = !!process.env.BUSINESS_VALUATION_SKILL_ID;
const CUSTOM_SKILL_ID = process.env.BUSINESS_VALUATION_SKILL_ID;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const reportId = params.id;
  console.log(`[SKILLS-API] Starting valuation for report ${reportId}`);
  console.log(`[SKILLS-API] Using custom skill: ${USE_CUSTOM_SKILL ? CUSTOM_SKILL_ID : 'No'}`);

  try {
    // ========================================================================
    // 1. Fetch report from database
    // ========================================================================
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      console.error('[SKILLS-API] Report not found:', reportError);
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Check if already completed
    if (report.report_status === 'completed') {
      return NextResponse.json({
        status: 'completed',
        message: 'Report already completed',
      });
    }

    // ========================================================================
    // 2. Update status to processing
    // ========================================================================
    await supabase
      .from('reports')
      .update({
        report_status: 'processing',
        processing_progress: 5,
        processing_message: 'Initializing Skills API pipeline...',
        error_message: null,
      })
      .eq('id', reportId);

    // ========================================================================
    // 3. Get and download documents
    // ========================================================================
    const documents = await getDocuments(reportId, report);

    if (documents.length === 0) {
      throw new Error('No documents found for this report');
    }

    await updateProgress(reportId, 10, 'Loading documents...');

    const primaryDocument = documents[0];
    const pdfBuffer = await downloadDocument(primaryDocument.file_path);
    const pdfBase64 = pdfBuffer.toString('base64');

    console.log(`[SKILLS-API] Loaded document: ${primaryDocument.filename || primaryDocument.file_path} (${pdfBuffer.length} bytes)`);

    // ========================================================================
    // 4. Build Skills configuration
    // ========================================================================
    await updateProgress(reportId, 20, 'Configuring AI skills...');

    // Build skills array
    const skills: Array<{
      type: 'anthropic' | 'custom';
      skill_id: string;
      version: string;
    }> = [
      // Always include PDF skill for document processing
      {
        type: 'anthropic',
        skill_id: 'pdf',
        version: 'latest'
      }
    ];

    // Add custom business valuation skill if configured
    if (USE_CUSTOM_SKILL && CUSTOM_SKILL_ID) {
      skills.push({
        type: 'custom',
        skill_id: CUSTOM_SKILL_ID,
        version: 'latest'
      });
      console.log(`[SKILLS-API] Using custom skill: ${CUSTOM_SKILL_ID}`);
    }

    // ========================================================================
    // 5. Call Claude with Skills API
    // ========================================================================
    await updateProgress(reportId, 30, 'Analyzing document with Claude Skills API...');

    const valuationPrompt = buildValuationPrompt(report.company_name || 'Subject Company');

    console.log(`[SKILLS-API] Calling Claude with ${skills.length} skill(s)...`);

    const response = await anthropic.beta.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16000,
      betas: ['code-execution-2025-08-25', 'skills-2025-10-02'],
      container: {
        skills: skills
      },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: pdfBase64
              }
            },
            {
              type: 'text',
              text: valuationPrompt
            }
          ]
        }
      ],
      tools: [
        {
          type: 'code_execution_20250825',
          name: 'code_execution'
        }
      ]
    } as any); // Type assertion needed for beta API

    console.log(`[SKILLS-API] Response received`);
    console.log(`[SKILLS-API] Stop reason: ${response.stop_reason}`);
    console.log(`[SKILLS-API] Usage: ${JSON.stringify(response.usage)}`);

    await updateProgress(reportId, 70, 'Processing Claude response...');

    // ========================================================================
    // 6. Handle pause_turn for long operations
    // ========================================================================
    let finalResponse = response;
    let messages: any[] = [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBase64
            }
          },
          {
            type: 'text',
            text: valuationPrompt
          }
        ]
      }
    ];

    // Handle pause_turn by continuing the conversation
    let retryCount = 0;
    const maxRetries = 5;

    while (finalResponse.stop_reason === 'pause_turn' && retryCount < maxRetries) {
      console.log(`[SKILLS-API] Handling pause_turn (attempt ${retryCount + 1})`);

      messages.push({ role: 'assistant', content: finalResponse.content });

      const containerResponse = finalResponse as any;
      const containerId = containerResponse.container?.id;

      finalResponse = await anthropic.beta.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 16000,
        betas: ['code-execution-2025-08-25', 'skills-2025-10-02'],
        container: {
          id: containerId,
          skills: skills
        },
        messages: messages,
        tools: [
          {
            type: 'code_execution_20250825',
            name: 'code_execution'
          }
        ]
      } as any);

      retryCount++;
    }

    // ========================================================================
    // 7. Extract structured output from response
    // ========================================================================
    await updateProgress(reportId, 85, 'Extracting valuation data...');

    let valuationData: any = null;
    let textContent = '';

    for (const content of finalResponse.content) {
      if (content.type === 'text') {
        textContent += content.text;

        // Try to extract JSON from markdown code blocks
        const jsonMatch = content.text.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          try {
            valuationData = JSON.parse(jsonMatch[1]);
            console.log('[SKILLS-API] Extracted JSON from code block');
          } catch (e) {
            console.warn('[SKILLS-API] Failed to parse JSON from code block');
          }
        }

        // Try to parse entire text as JSON
        if (!valuationData) {
          try {
            const jsonStart = content.text.indexOf('{');
            const jsonEnd = content.text.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd > jsonStart) {
              valuationData = JSON.parse(content.text.substring(jsonStart, jsonEnd + 1));
              console.log('[SKILLS-API] Extracted JSON from text');
            }
          } catch (e) {
            // Not valid JSON
          }
        }
      }
    }

    // If no structured data, create basic output from text
    if (!valuationData) {
      console.warn('[SKILLS-API] No structured JSON found, creating basic output');
      valuationData = {
        raw_analysis: textContent,
        extraction_method: 'text_only',
        warning: 'Structured data extraction failed'
      };
    }

    // ========================================================================
    // 8. Map output to database format
    // ========================================================================
    const mappedOutput = mapSkillsOutputToDbFormat(valuationData, report, finalResponse.usage);

    // ========================================================================
    // 9. Save to database
    // ========================================================================
    await updateProgress(reportId, 95, 'Saving valuation report...');

    const { error: updateError } = await supabase
      .from('reports')
      .update({
        report_status: 'completed',
        report_data: mappedOutput,
        processing_progress: 100,
        processing_message: 'Valuation complete!',
        completed_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    if (updateError) {
      console.error('[SKILLS-API] Failed to save report:', updateError);
      throw new Error('Failed to save report data');
    }

    console.log('[SKILLS-API] Report completed successfully!');

    // ========================================================================
    // 10. Return success response
    // ========================================================================
    return NextResponse.json({
      status: 'completed',
      message: 'Valuation report generated successfully using Skills API',
      usage: finalResponse.usage,
      skills_used: skills.map(s => s.skill_id),
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during processing';
    console.error('[SKILLS-API] Error:', errorMessage);

    await supabase
      .from('reports')
      .update({
        report_status: 'error',
        error_message: errorMessage,
        processing_progress: 0,
      })
      .eq('id', reportId);

    return NextResponse.json({
      status: 'error',
      error: errorMessage,
    }, { status: 500 });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build the valuation prompt for Claude
 */
function buildValuationPrompt(companyName: string): string {
  return `You are a certified business valuator. Analyze this tax return/financial document for "${companyName}" and produce a comprehensive business valuation report.

## Required Analysis

1. **Document Identification**
   - Identify the tax form type (1120, 1120-S, 1065, Schedule C)
   - Extract the tax year(s)
   - Note the entity type

2. **Financial Data Extraction**
   - Extract all income statement data (revenue, COGS, expenses, net income)
   - Extract balance sheet data (assets, liabilities)
   - Identify officer/owner compensation
   - Note depreciation and amortization

3. **Earnings Normalization**
   - Calculate SDE (Seller's Discretionary Earnings) with detailed add-backs
   - Calculate EBITDA
   - Apply 3-year weighted average if multiple years available
   - Document each add-back with justification

4. **Industry Analysis**
   - Classify by NAICS code
   - Identify industry-specific valuation multiples
   - Note industry trends and risks

5. **Risk Assessment**
   - Score 10 risk factors (1-5 scale):
     * Revenue concentration
     * Owner dependency
     * Financial record quality
     * Industry stability
     * Competitive position
     * Growth trajectory
     * Asset quality
     * Geographic risk
     * Regulatory environment
     * Economic sensitivity
   - Calculate weighted risk score

6. **Valuation Calculation**
   Apply all three approaches:

   **Asset Approach:**
   - Adjust book values to FMV
   - Calculate adjusted net asset value

   **Income Approach:**
   - Build up capitalization rate
   - Capitalize normalized earnings

   **Market Approach:**
   - Apply industry-specific SDE/EBITDA multiple
   - Adjust for company-specific factors

7. **Value Reconciliation**
   - Weight the three approaches
   - Apply DLOM if appropriate (15-25% typical)
   - Conclude Fair Market Value with range

## Output Format

Return your analysis as a structured JSON object with these sections:

\`\`\`json
{
  "valuation_summary": {
    "valuation_date": "YYYY-MM-DD",
    "business_name": "...",
    "concluded_fair_market_value": number,
    "value_range": { "low": number, "high": number },
    "confidence_level": "High|Medium|Low"
  },
  "company_overview": {
    "business_name": "...",
    "legal_entity_type": "...",
    "naics_code": "...",
    "industry": "...",
    "years_in_business": number,
    "business_description": "..."
  },
  "financial_summary": {
    "years_analyzed": [2021, 2022, 2023],
    "revenue_trend": { "amounts": [...], "cagr": number },
    "profitability": { "gross_margin_avg": number, "net_margin_avg": number },
    "balance_sheet_summary": { "total_assets": number, "total_liabilities": number, "book_value_equity": number }
  },
  "normalized_earnings": {
    "sde_analysis": {
      "years": [...],
      "annual_sde": [...],
      "weighted_average_sde": number,
      "add_back_categories": [{ "category": "...", "amount": number, "justification": "..." }]
    },
    "ebitda_analysis": {
      "annual_ebitda": [...],
      "weighted_average_ebitda": number
    }
  },
  "risk_assessment": {
    "overall_risk_score": number,
    "risk_category": "...",
    "risk_factors": [{ "factor_name": "...", "score": number, "rationale": "..." }]
  },
  "valuation_approaches": {
    "asset_approach": { "adjusted_net_asset_value": number, "weight_assigned": number },
    "income_approach": { "capitalization_rate": number, "indicated_value": number, "weight_assigned": number },
    "market_approach": { "multiple_used": number, "indicated_value": number, "weight_assigned": number }
  },
  "valuation_conclusion": {
    "preliminary_value": number,
    "dlom_applied": number,
    "concluded_fair_market_value": number,
    "value_range": { "low": number, "high": number }
  },
  "narratives": {
    "executive_summary": "300+ word summary...",
    "financial_analysis": "Detailed analysis...",
    "risk_assessment": "Risk discussion...",
    "valuation_synthesis": "How value was determined..."
  }
}
\`\`\`

Be thorough, accurate, and ensure all numbers are mathematically consistent. This valuation must withstand professional scrutiny.`;
}

/**
 * Get documents for a report
 */
async function getDocuments(reportId: string, report: Record<string, unknown>): Promise<Array<{ file_path: string; filename?: string }>> {
  const { data: documents, error } = await supabase
    .from('documents')
    .select('*')
    .eq('report_id', reportId);

  if (!error && documents && documents.length > 0) {
    return documents;
  }

  if (report.document_paths) {
    const paths = typeof report.document_paths === 'string'
      ? JSON.parse(report.document_paths)
      : report.document_paths;

    return (paths as string[]).map((path: string) => ({
      file_path: path,
      filename: path.split('/').pop(),
    }));
  }

  return [];
}

/**
 * Download a document from Supabase Storage
 */
async function downloadDocument(filePath: string): Promise<Buffer> {
  const cleanPath = filePath.replace(/^documents\//, '');

  const { data, error } = await supabase.storage
    .from('documents')
    .download(cleanPath);

  if (error) {
    const { data: data2, error: error2 } = await supabase.storage
      .from('documents')
      .download(filePath);

    if (error2) {
      throw new Error(`Failed to download document: ${error.message}`);
    }

    const arrayBuffer = await data2.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Update processing progress
 */
async function updateProgress(reportId: string, progress: number, message: string) {
  console.log(`[SKILLS-API] Progress ${progress}%: ${message}`);

  await supabase
    .from('reports')
    .update({
      processing_progress: progress,
      processing_message: message,
    })
    .eq('id', reportId);
}

/**
 * Map Skills API output to database format
 */
function mapSkillsOutputToDbFormat(
  output: any,
  report: Record<string, unknown>,
  usage: any
): Record<string, unknown> {
  // Handle case where output is raw text
  if (output.extraction_method === 'text_only') {
    return {
      schema_version: '3.0-skills',
      raw_analysis: output.raw_analysis,
      extraction_warning: output.warning,
      pipeline_metadata: {
        method: 'skills-api',
        tokens_used: usage,
        timestamp: new Date().toISOString(),
      }
    };
  }

  // Map structured output
  return {
    schema_version: '3.0-skills',
    generated_at: new Date().toISOString(),

    // Valuation Summary
    valuation_summary: output.valuation_summary || {},

    // Company Profile
    company_profile: {
      legal_name: output.company_overview?.business_name || report.company_name,
      entity_type: output.company_overview?.legal_entity_type,
      naics_code: output.company_overview?.naics_code,
      industry: output.company_overview?.industry,
      years_in_business: output.company_overview?.years_in_business,
      business_description: output.company_overview?.business_description,
    },

    // Financial Data
    financial_data: output.financial_summary || {},

    // Normalized Earnings
    normalized_earnings: output.normalized_earnings || {},

    // Risk Assessment
    risk_assessment: output.risk_assessment || {},

    // Valuation Approaches
    valuation_approaches: output.valuation_approaches || {},

    // Valuation Conclusion
    valuation_synthesis: {
      final_valuation: {
        concluded_value: output.valuation_conclusion?.concluded_fair_market_value,
        valuation_range_low: output.valuation_conclusion?.value_range?.low,
        valuation_range_high: output.valuation_conclusion?.value_range?.high,
      }
    },

    // Narratives
    narratives: output.narratives || {},

    // Raw values for compatibility
    valuation_amount: output.valuation_conclusion?.concluded_fair_market_value,
    valuation_range_low: output.valuation_conclusion?.value_range?.low,
    valuation_range_high: output.valuation_conclusion?.value_range?.high,

    // Pipeline metadata
    pipeline_metadata: {
      method: 'skills-api',
      model: 'claude-sonnet-4-5-20250929',
      tokens_used: usage,
      timestamp: new Date().toISOString(),
    }
  };
}

/**
 * GET handler for checking processing status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const reportId = params.id;

  const { data: report, error } = await supabase
    .from('reports')
    .select('report_status, processing_progress, processing_message, error_message')
    .eq('id', reportId)
    .single();

  if (error || !report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  return NextResponse.json({
    status: report.report_status,
    progress: report.processing_progress || 0,
    message: report.processing_message || '',
    error: report.error_message,
    endpoint: 'skills-api',
  });
}
