/**
 * Claude-Based Business Valuation Processing Route
 *
 * This API route processes uploaded documents using Claude instead of OpenAI.
 * It replaces the 18-pass OpenAI system with a single, comprehensive Claude call
 * that analyzes documents and produces a complete valuation report.
 *
 * Key advantages:
 * - Native PDF support (no file upload API needed)
 * - Single API call instead of 18 passes
 * - Better reasoning for complex financial documents
 * - Structured output via tool use
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  getClaudeClient,
  CLAUDE_MODEL,
  MAX_TOKENS,
  pdfToClaudeDocument,
  extractToolUse,
  callClaudeWithRetry,
} from '@/lib/claude/client';
import { getValuationSystemPrompt } from '@/lib/claude/valuation-prompt';
import { getValuationTools } from '@/lib/claude/function-definitions';
import { calculateValuation, ExtractedFinancialData, IndustryData } from '@/lib/valuation/engine';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const maxDuration = 300; // 5 minutes max for Vercel Pro

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const reportId = params.id;
  console.log(`[CLAUDE-PROCESS] Starting valuation for report ${reportId}`);

  try {
    // Get report from database
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      console.error('[CLAUDE-PROCESS] Report not found:', reportError);
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Check if already completed or failed
    if (report.report_status === 'completed') {
      return NextResponse.json({
        status: 'completed',
        message: 'Report already completed',
      });
    }

    if (report.report_status === 'failed') {
      return NextResponse.json({
        status: 'failed',
        error: report.error_message,
      });
    }

    // Update status to processing
    await supabase
      .from('reports')
      .update({
        report_status: 'processing',
        current_pass: 0,
      })
      .eq('id', reportId);

    // Get uploaded documents
    const documents = await getDocuments(reportId, report);

    if (documents.length === 0) {
      throw new Error('No documents found for this report');
    }

    console.log(`[CLAUDE-PROCESS] Found ${documents.length} documents to analyze`);

    // Update progress
    await updateProgress(reportId, 10, 'Loading documents...');

    // Convert documents to Claude format
    const documentBlocks: Anthropic.DocumentBlockParam[] = [];
    for (const doc of documents) {
      try {
        const pdfBuffer = await downloadDocument(doc.file_path);
        documentBlocks.push(pdfToClaudeDocument(pdfBuffer));
        console.log(`[CLAUDE-PROCESS] Loaded document: ${doc.filename || doc.file_path}`);
      } catch (err) {
        console.error(`[CLAUDE-PROCESS] Failed to load document:`, err);
      }
    }

    if (documentBlocks.length === 0) {
      throw new Error('Failed to load any documents');
    }

    await updateProgress(reportId, 20, 'Analyzing documents with AI...');

    // Build the user message with all documents
    const userContent: Anthropic.ContentBlockParam[] = [
      ...documentBlocks,
      {
        type: 'text',
        text: `Please analyze these financial documents for ${report.company_name} and produce a complete business valuation report.

IMPORTANT INSTRUCTIONS:
1. Extract ALL financial data from the tax returns and financial statements
2. Calculate SDE (Seller's Discretionary Earnings) with all appropriate add-backs
3. Calculate EBITDA with proper adjustments
4. Identify the appropriate industry and NAICS code
5. Apply relevant industry valuation multiples
6. Assess company-specific risk factors
7. Calculate the valuation using Asset, Income, and Market approaches
8. Weight the approaches appropriately
9. Write comprehensive narrative sections for each part of the report
10. Call the submit_valuation_report function with ALL the data

Be thorough and detailed. This report needs to justify a $500-$5,000 price point.
Reference specific line items and numbers from the tax returns.
All narratives should meet their word count targets.`,
      },
    ];

    // Call Claude with the valuation tools
    console.log('[CLAUDE-PROCESS] Calling Claude API...');

    const response = await callClaudeWithRetry({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      system: getValuationSystemPrompt(report.company_name),
      tools: getValuationTools(),
      tool_choice: { type: 'tool', name: 'submit_valuation_report' },
      messages: [
        {
          role: 'user',
          content: userContent,
        },
      ],
    });

    console.log('[CLAUDE-PROCESS] Claude response received, extracting tool use...');
    await updateProgress(reportId, 60, 'Processing valuation data...');

    // Extract the tool use result
    const toolUse = extractToolUse(response);

    if (!toolUse || toolUse.toolName !== 'submit_valuation_report') {
      console.error('[CLAUDE-PROCESS] No valid tool use found in response');
      throw new Error('Claude did not return structured valuation data');
    }

    const valuationData = toolUse.toolInput;
    console.log('[CLAUDE-PROCESS] Valuation data extracted successfully');

    await updateProgress(reportId, 70, 'Validating calculations...');

    // Validate and enhance with server-side calculations
    const enhancedData = await validateAndEnhanceValuation(valuationData, report);

    await updateProgress(reportId, 80, 'Finalizing report...');

    // Store the complete report data
    const { error: updateError } = await supabase
      .from('reports')
      .update({
        report_status: 'completed',
        report_data: enhancedData,
        current_pass: 18, // Mark as complete
        completed_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    if (updateError) {
      console.error('[CLAUDE-PROCESS] Failed to update report:', updateError);
      throw new Error('Failed to save report data');
    }

    console.log('[CLAUDE-PROCESS] Report completed successfully!');

    return NextResponse.json({
      status: 'completed',
      message: 'Valuation report generated successfully',
      valuation: {
        concluded_value: enhancedData.valuation_synthesis?.final_valuation?.concluded_value,
        range_low: enhancedData.valuation_synthesis?.final_valuation?.valuation_range_low,
        range_high: enhancedData.valuation_synthesis?.final_valuation?.valuation_range_high,
      },
    });

  } catch (error: any) {
    console.error('[CLAUDE-PROCESS] Error:', error);

    // Update report status to failed
    await supabase
      .from('reports')
      .update({
        report_status: 'failed',
        error_message: error.message || 'Unknown error during processing',
      })
      .eq('id', reportId);

    return NextResponse.json({
      status: 'failed',
      error: error.message || 'Processing failed',
    }, { status: 500 });
  }
}

/**
 * Get documents for a report
 */
async function getDocuments(reportId: string, report: any): Promise<any[]> {
  // Try to get documents from the documents table
  const { data: documents, error } = await supabase
    .from('documents')
    .select('*')
    .eq('report_id', reportId);

  if (!error && documents && documents.length > 0) {
    return documents;
  }

  // Fallback: check if document paths are stored in report
  if (report.document_paths) {
    const paths = typeof report.document_paths === 'string'
      ? JSON.parse(report.document_paths)
      : report.document_paths;

    return paths.map((path: string) => ({
      file_path: path,
      filename: path.split('/').pop(),
    }));
  }

  // Check document_ids
  if (report.document_ids) {
    const ids = typeof report.document_ids === 'string'
      ? JSON.parse(report.document_ids)
      : report.document_ids;

    const { data: docs } = await supabase
      .from('documents')
      .select('*')
      .in('id', ids);

    return docs || [];
  }

  return [];
}

/**
 * Download a document from Supabase Storage
 */
async function downloadDocument(filePath: string): Promise<Buffer> {
  // Handle different path formats
  const cleanPath = filePath.replace(/^documents\//, '');

  const { data, error } = await supabase.storage
    .from('documents')
    .download(cleanPath);

  if (error) {
    // Try with original path
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
  console.log(`[CLAUDE-PROCESS] Progress ${progress}%: ${message}`);

  await supabase
    .from('reports')
    .update({
      processing_progress: progress,
      processing_message: message,
    })
    .eq('id', reportId);
}

/**
 * Validate and enhance valuation data with server-side calculations
 */
async function validateAndEnhanceValuation(data: any, report: any): Promise<any> {
  // Ensure we have the basic structure
  if (!data.schema_version) {
    data.schema_version = '2.0';
  }

  if (!data.valuation_date) {
    data.valuation_date = new Date().toISOString().split('T')[0];
  }

  // Add generated timestamp
  data.generated_at = new Date().toISOString();

  // Validate final valuation exists
  if (!data.valuation_synthesis?.final_valuation?.concluded_value) {
    console.warn('[CLAUDE-PROCESS] Missing concluded value, attempting to calculate...');

    // Try to calculate from approaches if available
    if (data.valuation_approaches) {
      const assetValue = data.valuation_approaches.asset_approach?.adjusted_net_asset_value || 0;
      const incomeValue = data.valuation_approaches.income_approach?.indicated_value || 0;
      const marketValue = data.valuation_approaches.market_approach?.indicated_value || 0;

      // Use income approach as primary if available
      const primaryValue = incomeValue || marketValue || assetValue;

      if (primaryValue > 0) {
        data.valuation_synthesis = data.valuation_synthesis || {};
        data.valuation_synthesis.final_valuation = {
          concluded_value: primaryValue,
          valuation_range_low: Math.round(primaryValue * 0.85),
          valuation_range_high: Math.round(primaryValue * 1.15),
          confidence_level: 'Moderate',
          confidence_rationale: 'Calculated from available approach values',
        };
      }
    }
  }

  // Ensure valuation floor (cannot be less than net assets)
  if (data.valuation_synthesis?.final_valuation?.concluded_value) {
    const netAssets = data.valuation_approaches?.asset_approach?.adjusted_net_asset_value || 0;
    const concludedValue = data.valuation_synthesis.final_valuation.concluded_value;

    if (concludedValue < netAssets && netAssets > 0) {
      console.log(`[CLAUDE-PROCESS] Applying valuation floor: ${concludedValue} -> ${netAssets}`);
      data.valuation_synthesis.final_valuation.concluded_value = netAssets;
      data.valuation_synthesis.final_valuation.valuation_range_low = Math.round(netAssets * 0.93);
      data.valuation_synthesis.final_valuation.valuation_range_high = Math.round(netAssets * 1.07);
    }
  }

  // Add company name if not present
  if (!data.company_profile?.legal_name && report.company_name) {
    data.company_profile = data.company_profile || {};
    data.company_profile.legal_name = report.company_name;
  }

  // Validate narrative word counts
  if (data.narratives) {
    const narrativeTargets: Record<string, number> = {
      executive_summary: 800,
      company_overview: 500,
      financial_analysis: 1000,
      industry_analysis: 600,
      risk_assessment: 700,
      asset_approach_narrative: 500,
      income_approach_narrative: 500,
      market_approach_narrative: 500,
      valuation_synthesis_narrative: 600,
      assumptions_and_limiting_conditions: 400,
      value_enhancement_recommendations: 500,
    };

    for (const [key, target] of Object.entries(narrativeTargets)) {
      if (data.narratives[key]) {
        data.narratives[key].word_count_target = target;

        // Log warning if narrative is too short
        const content = data.narratives[key].content || '';
        const wordCount = content.split(/\s+/).filter((w: string) => w.length > 0).length;

        if (wordCount < target * 0.8) {
          console.warn(`[CLAUDE-PROCESS] Narrative "${key}" is ${wordCount} words (target: ${target})`);
        }
      }
    }
  }

  // Set data quality if not present
  if (!data.data_quality) {
    data.data_quality = {
      extraction_confidence: 'Moderate',
      data_completeness_score: 75,
      missing_data_flags: [],
      data_quality_notes: 'Automated extraction from provided documents',
    };
  }

  return data;
}

/**
 * GET handler for checking status
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
  });
}
