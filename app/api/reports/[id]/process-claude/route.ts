/**
 * Claude 6-Pass Business Valuation Processing Route
 *
 * This API route processes uploaded documents using the 6-pass Claude valuation system.
 * It orchestrates document extraction, industry analysis, earnings normalization,
 * risk assessment, valuation calculation, and final synthesis.
 *
 * Passes:
 * 1. Document Extraction - Extract financial data from PDFs
 * 2. Industry Analysis - Analyze industry context and multiples
 * 3. Earnings Normalization - Calculate SDE/EBITDA with add-backs
 * 4. Risk Assessment - Score risk factors and adjust multiples
 * 5. Valuation Calculation - Apply Asset, Income, Market approaches
 * 6. Final Synthesis - Generate complete report with narratives
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { runValuationPipeline } from '@/lib/claude/orchestrator';
import { mapClaudeOutputToDbFormat, validateClaudeOutput } from '@/lib/claude/output-mapper';
import { FinalValuationOutput } from '@/lib/claude/types';

// Initialize Supabase client with service role for backend operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Vercel Pro allows up to 5 minutes for serverless functions
export const maxDuration = 300;

// Status mapping for each pass
const PASS_STATUS_MAP: Record<number, string> = {
  1: 'pass_1_complete',
  2: 'pass_2_complete',
  3: 'pass_3_complete',
  4: 'pass_4_complete',
  5: 'pass_5_complete',
  6: 'completed',
};

const PASS_PROGRESS_MAP: Record<number, number> = {
  1: 20,
  2: 35,
  3: 50,
  4: 65,
  5: 80,
  6: 100,
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const reportId = params.id;
  console.log(`[6-PASS] Starting valuation pipeline for report ${reportId}`);

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
      console.error('[6-PASS] Report not found:', reportError);
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Check if already completed
    if (report.report_status === 'completed') {
      return NextResponse.json({
        status: 'completed',
        message: 'Report already completed',
        valuation: extractValuationSummary(report.report_data),
      });
    }

    // Check if failed (allow retry)
    if (report.report_status === 'failed') {
      console.log('[6-PASS] Retrying failed report...');
    }

    // ========================================================================
    // 2. Update status to processing
    // ========================================================================
    await supabase
      .from('reports')
      .update({
        report_status: 'processing',
        current_pass: 0,
        processing_progress: 5,
        processing_message: 'Initializing valuation pipeline...',
        error_message: null, // Clear any previous errors
      })
      .eq('id', reportId);

    // ========================================================================
    // 3. Get uploaded documents
    // ========================================================================
    const documents = await getDocuments(reportId, report);

    if (documents.length === 0) {
      throw new Error('No documents found for this report');
    }

    console.log(`[6-PASS] Found ${documents.length} document(s) to analyze`);

    // ========================================================================
    // 4. Download and convert PDF to base64
    // ========================================================================
    await updateProgress(reportId, 10, 'Loading documents...');

    // For now, use the first PDF document
    const primaryDocument = documents[0];
    const pdfBuffer = await downloadDocument(primaryDocument.file_path);
    const pdfBase64 = pdfBuffer.toString('base64');

    console.log(`[6-PASS] Loaded document: ${primaryDocument.filename || primaryDocument.file_path} (${pdfBuffer.length} bytes)`);

    // ========================================================================
    // 5. Run the 6-pass valuation pipeline
    // ========================================================================
    const onProgress = async (pass: number, status: string) => {
      const progress = PASS_PROGRESS_MAP[pass] || (pass * 15);
      const dbStatus = pass === 6 ? 'completed' : `pass_${pass}_complete`;

      console.log(`[6-PASS] Pass ${pass}: ${status}`);

      await supabase
        .from('reports')
        .update({
          current_pass: pass,
          processing_progress: progress,
          processing_message: status,
          report_status: pass < 6 ? 'processing' : dbStatus,
        })
        .eq('id', reportId);
    };

    const result = await runValuationPipeline(pdfBase64, reportId, onProgress);

    // ========================================================================
    // 6. Handle pipeline result
    // ========================================================================
    if (!result.success || !result.finalOutput) {
      console.error('[6-PASS] Pipeline failed:', result.error);

      // Save partial results if available
      const partialData = result.partialResults ? {
        partial: true,
        ...result.partialResults,
        pipeline_error: result.error,
        tokens_used: result.totalTokensUsed,
        cost: result.totalCost,
      } : null;

      await supabase
        .from('reports')
        .update({
          report_status: 'error',
          error_message: result.error || 'Valuation pipeline failed',
          report_data: partialData,
          processing_progress: 0,
        })
        .eq('id', reportId);

      return NextResponse.json({
        status: 'error',
        error: result.error || 'Processing failed',
        passResults: result.passOutputs?.map(p => ({
          pass: p.pass,
          success: p.success,
          error: p.error,
        })),
      }, { status: 500 });
    }

    // ========================================================================
    // 7. Validate and map output for PDF generation
    // ========================================================================
    console.log('[6-PASS] Pipeline successful, validating output...');

    const validation = validateClaudeOutput(result.finalOutput);
    if (!validation.valid) {
      console.warn('[6-PASS] Validation warnings:', validation.errors);
    }

    // Map to database format
    const mappedOutput = mapFinalOutputToDbFormat(result.finalOutput, report);

    // Add pipeline metadata
    mappedOutput.pipeline_metadata = {
      passes_completed: 6,
      total_tokens: result.totalTokensUsed,
      total_cost: result.totalCost,
      processing_time_ms: result.processingTimeMs,
      consistency_check: result.consistencyCheck,
      model: 'claude-sonnet-4-20250514',
      pipeline_version: '2.0',
    };

    // ========================================================================
    // 8. Save complete report to database
    // ========================================================================
    const { error: updateError } = await supabase
      .from('reports')
      .update({
        report_status: 'completed',
        report_data: mappedOutput,
        current_pass: 6,
        processing_progress: 100,
        processing_message: 'Valuation complete!',
        completed_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    if (updateError) {
      console.error('[6-PASS] Failed to save report:', updateError);
      throw new Error('Failed to save report data');
    }

    console.log('[6-PASS] Report completed successfully!');
    console.log(`[6-PASS] Concluded value: $${result.finalOutput.valuation_conclusion.concluded_fair_market_value.toLocaleString()}`);
    console.log(`[6-PASS] Total cost: $${result.totalCost.toFixed(4)}`);
    console.log(`[6-PASS] Total tokens: ${result.totalTokensUsed.total.toLocaleString()}`);

    // ========================================================================
    // 9. Return success response
    // ========================================================================
    return NextResponse.json({
      status: 'completed',
      message: 'Valuation report generated successfully',
      valuation: {
        concluded_value: result.finalOutput.valuation_conclusion.concluded_fair_market_value,
        range_low: result.finalOutput.valuation_conclusion.value_range.low,
        range_high: result.finalOutput.valuation_conclusion.value_range.high,
        confidence: result.finalOutput.valuation_summary.confidence_level,
      },
      metrics: {
        total_tokens: result.totalTokensUsed.total,
        total_cost: result.totalCost,
        processing_time_ms: result.processingTimeMs,
      },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during processing';
    console.error('[6-PASS] Error:', errorMessage);

    // Update report status to error
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
 * Get documents for a report from various sources
 */
async function getDocuments(reportId: string, report: Record<string, unknown>): Promise<Array<{ file_path: string; filename?: string }>> {
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

    return (paths as string[]).map((path: string) => ({
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
 * Update processing progress in database
 */
async function updateProgress(reportId: string, progress: number, message: string) {
  console.log(`[6-PASS] Progress ${progress}%: ${message}`);

  await supabase
    .from('reports')
    .update({
      processing_progress: progress,
      processing_message: message,
    })
    .eq('id', reportId);
}

/**
 * Map FinalValuationOutput to the database format expected by PDF generator
 */
function mapFinalOutputToDbFormat(output: FinalValuationOutput, report: Record<string, unknown>): Record<string, unknown> {
  return {
    // Schema info
    schema_version: '2.0',
    valuation_date: output.valuation_summary.valuation_date,
    generated_at: new Date().toISOString(),

    // Company Profile
    company_profile: {
      legal_name: output.company_overview.business_name || report.company_name,
      dba_name: null,
      entity_type: output.company_overview.legal_entity_type,
      ein: null,
      address: {
        city: output.company_overview.location?.split(',')[0]?.trim(),
        state: output.company_overview.location?.split(',')[1]?.trim(),
      },
      industry: {
        naics_code: output.company_overview.naics_code,
        naics_description: output.company_overview.industry,
      },
      years_in_business: output.company_overview.years_in_business,
      number_of_employees: output.company_overview.number_of_employees,
      business_description: output.company_overview.business_description,
    },

    // Financial Data
    financial_data: {
      income_statements: output.financial_summary.years_analyzed.map((year, i) => ({
        period: year.toString(),
        revenue: {
          net_revenue: output.financial_summary.revenue_trend.amounts[i] || 0,
        },
        gross_profit: (output.financial_summary.revenue_trend.amounts[i] || 0) *
          (output.financial_summary.profitability.gross_margin_avg / 100),
        net_income: (output.financial_summary.revenue_trend.amounts[i] || 0) *
          (output.financial_summary.profitability.net_margin_avg / 100),
      })),
      balance_sheets: [{
        period: output.financial_summary.years_analyzed[output.financial_summary.years_analyzed.length - 1]?.toString(),
        assets: {
          total_assets: output.financial_summary.balance_sheet_summary.total_assets,
        },
        liabilities: {
          total_liabilities: output.financial_summary.balance_sheet_summary.total_liabilities,
        },
        equity: {
          total_equity: output.financial_summary.balance_sheet_summary.book_value_equity,
        },
      }],
    },

    // Normalized Earnings
    normalized_earnings: {
      sde_calculation: {
        weighted_average_sde: {
          weighted_sde: output.normalized_earnings.benefit_stream_selection.selected_metric === 'SDE'
            ? output.normalized_earnings.benefit_stream_selection.selected_amount
            : output.normalized_earnings.sde_analysis.weighted_average_sde,
        },
        periods: output.normalized_earnings.sde_analysis.years.map((year, i) => ({
          period: year.toString(),
          reported_net_income: output.normalized_earnings.sde_analysis.reported_net_income[i],
          total_adjustments: output.normalized_earnings.sde_analysis.total_add_backs[i],
          adjusted_sde: output.normalized_earnings.sde_analysis.annual_sde[i],
          adjustments: output.normalized_earnings.sde_analysis.add_back_categories,
        })),
      },
      ebitda_calculation: {
        weighted_average_ebitda: output.normalized_earnings.ebitda_analysis.weighted_average_ebitda,
        periods: output.normalized_earnings.ebitda_analysis.years.map((year, i) => ({
          period: year.toString(),
          adjusted_ebitda: output.normalized_earnings.ebitda_analysis.annual_ebitda[i],
        })),
      },
    },

    // Industry Analysis
    industry_analysis: {
      industry_overview: output.narratives.industry_analysis,
      industry_name: output.industry_analysis.industry_name,
      sector: output.industry_analysis.sector,
      market_size: output.industry_analysis.market_size,
      growth_outlook: output.industry_analysis.growth_outlook,
      competitive_landscape: output.industry_analysis.competitive_landscape,
      key_trends: output.industry_analysis.key_success_factors,
    },

    // Risk Assessment
    risk_assessment: {
      overall_risk_score: output.risk_assessment.overall_risk_score,
      risk_category: output.risk_assessment.risk_category,
      risk_factors: output.risk_assessment.risk_factors,
      multiple_adjustment: output.risk_assessment.multiple_adjustment.base_adjustment,
    },

    // Valuation Approaches
    valuation_approaches: {
      asset_approach: {
        methodology: output.valuation_approaches.asset_approach.methodology,
        total_assets: output.financial_summary.balance_sheet_summary.total_assets,
        total_liabilities: output.financial_summary.balance_sheet_summary.total_liabilities,
        adjusted_net_asset_value: output.valuation_approaches.asset_approach.adjusted_net_asset_value,
        adjustments: output.valuation_approaches.asset_approach.asset_adjustments,
      },
      income_approach: {
        methodology: output.valuation_approaches.income_approach.methodology,
        earnings_base: output.valuation_approaches.income_approach.benefit_stream,
        normalized_earnings: output.valuation_approaches.income_approach.benefit_stream_amount,
        capitalization_rate: output.valuation_approaches.income_approach.capitalization_rate.capitalization_rate,
        multiple_used: output.valuation_approaches.income_approach.implied_multiple,
        indicated_value: output.valuation_approaches.income_approach.indicated_value,
      },
      market_approach: {
        methodology: output.valuation_approaches.market_approach.methodology,
        revenue_base: output.valuation_approaches.market_approach.benefit_stream_amount,
        revenue_multiple: output.valuation_approaches.market_approach.selected_multiple,
        indicated_value: output.valuation_approaches.market_approach.indicated_value,
        comparable_data_source: output.valuation_approaches.market_approach.multiple_source,
      },
    },

    // Valuation Synthesis
    valuation_synthesis: {
      approach_summary: [
        {
          approach: 'Asset Approach',
          value: output.valuation_conclusion.approach_values.asset_approach.value,
          weight: output.valuation_conclusion.approach_values.asset_approach.weight,
          weighted_value: output.valuation_conclusion.approach_values.asset_approach.weighted_value,
        },
        {
          approach: 'Income Approach',
          value: output.valuation_conclusion.approach_values.income_approach.value,
          weight: output.valuation_conclusion.approach_values.income_approach.weight,
          weighted_value: output.valuation_conclusion.approach_values.income_approach.weighted_value,
        },
        {
          approach: 'Market Approach',
          value: output.valuation_conclusion.approach_values.market_approach.value,
          weight: output.valuation_conclusion.approach_values.market_approach.weight,
          weighted_value: output.valuation_conclusion.approach_values.market_approach.weighted_value,
        },
      ],
      preliminary_value: output.valuation_conclusion.preliminary_value,
      discounts_and_premiums: {
        dlom: output.valuation_conclusion.discounts_applied[0]?.discount_percentage || 0,
        dlom_amount: output.valuation_conclusion.discounts_applied[0]?.discount_amount || 0,
      },
      final_valuation: {
        concluded_value: output.valuation_conclusion.concluded_fair_market_value,
        valuation_range_low: output.valuation_conclusion.value_range.low,
        valuation_range_high: output.valuation_conclusion.value_range.high,
        confidence_level: output.valuation_summary.confidence_level,
        confidence_rationale: output.valuation_conclusion.value_range.range_rationale,
      },
    },

    // Narratives
    narratives: {
      executive_summary: { content: output.narratives.executive_summary },
      company_overview: { content: output.narratives.company_overview },
      financial_analysis: { content: output.narratives.financial_analysis },
      industry_analysis: { content: output.narratives.industry_analysis },
      risk_assessment: { content: output.narratives.risk_assessment },
      asset_approach_narrative: { content: output.narratives.asset_approach_narrative },
      income_approach_narrative: { content: output.narratives.income_approach_narrative },
      market_approach_narrative: { content: output.narratives.market_approach_narrative },
      valuation_synthesis_narrative: { content: output.narratives.valuation_synthesis },
      assumptions_and_limiting_conditions: { content: output.narratives.assumptions_and_limiting_conditions },
      value_enhancement_recommendations: { content: output.narratives.value_enhancement_recommendations },
    },

    // Data Quality
    data_quality: {
      extraction_confidence: output.metadata.confidence_metrics.data_quality,
      comparable_quality: output.metadata.confidence_metrics.comparable_quality,
      overall_confidence: output.metadata.confidence_metrics.overall_confidence,
    },

    // Raw values for compatibility
    annual_revenue: output.financial_summary.revenue_trend.amounts[output.financial_summary.revenue_trend.amounts.length - 1] || 0,
    normalized_sde: output.normalized_earnings.benefit_stream_selection.selected_metric === 'SDE'
      ? output.normalized_earnings.benefit_stream_selection.selected_amount
      : output.normalized_earnings.sde_analysis.weighted_average_sde,
    normalized_ebitda: output.normalized_earnings.ebitda_analysis.weighted_average_ebitda,
    valuation_amount: output.valuation_conclusion.concluded_fair_market_value,
    valuation_range_low: output.valuation_conclusion.value_range.low,
    valuation_range_high: output.valuation_conclusion.value_range.high,
  };
}

/**
 * Extract valuation summary from existing report data
 */
function extractValuationSummary(reportData: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!reportData) return null;

  const synthesis = reportData.valuation_synthesis as Record<string, unknown> | undefined;
  const finalVal = synthesis?.final_valuation as Record<string, unknown> | undefined;

  if (!finalVal) return null;

  return {
    concluded_value: finalVal.concluded_value,
    range_low: finalVal.valuation_range_low,
    range_high: finalVal.valuation_range_high,
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
    .select('report_status, processing_progress, processing_message, error_message, current_pass')
    .eq('id', reportId)
    .single();

  if (error || !report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  return NextResponse.json({
    status: report.report_status,
    progress: report.processing_progress || 0,
    message: report.processing_message || '',
    currentPass: report.current_pass || 0,
    error: report.error_message,
  });
}
