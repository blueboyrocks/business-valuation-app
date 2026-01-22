/**
 * Regenerate Report API Route
 *
 * This endpoint regenerates the final report and PDF from existing pass outputs
 * WITHOUT calling the Claude API again. Use when:
 * - All 12 passes completed but report generation failed
 * - PDF generation failed after successful processing
 * - Need to regenerate with updated transform logic
 *
 * Usage: POST /api/reports/[id]/regenerate
 *
 * Query params:
 * - skipPdf=true: Only regenerate report_data, skip PDF generation
 */

export const maxDuration = 120; // PDF generation can take time
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { transformToFinalReport, PassOutputs, validateFinalReport } from '@/lib/claude/transform-to-final-report';
import { generateAndStorePDF } from '@/lib/pdf/auto-generate';
import {
  Pass1Output,
  Pass2Output,
  Pass3Output,
  Pass4Output,
  Pass5Output,
  Pass6Output,
  Pass7Output,
  Pass8Output,
  Pass9Output,
  Pass10Output,
  Pass11Output,
  Pass12Output,
} from '@/lib/claude/types-v2';

// Lazy-initialize Supabase client
let supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return supabase;
}

interface PassOutputRow {
  pass_number: number;
  output_data: unknown;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reportId } = await params;
  const { searchParams } = new URL(request.url);
  const skipPdf = searchParams.get('skipPdf') === 'true';

  console.log(`[REGENERATE] Starting regeneration for report ${reportId}`);

  try {
    // 1. Fetch the report with pass_outputs
    const { data: reportData, error: reportError } = await getSupabaseClient()
      .from('reports')
      .select('id, company_name, report_status, pass_outputs')
      .eq('id', reportId)
      .maybeSingle();

    if (reportError) {
      console.error(`[REGENERATE] Database error: ${reportError.message}`);
      return NextResponse.json(
        { success: false, error: `Database error: ${reportError.message}` },
        { status: 500 }
      );
    }

    if (!reportData) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    const report = reportData as {
      id: string;
      company_name: string;
      report_status: string;
      pass_outputs: Record<string, unknown> | null;
    };

    // 2. Get pass outputs from the report's pass_outputs JSONB column
    const passOutputsData = report.pass_outputs || {};
    console.log(`[REGENERATE] Pass outputs keys: ${Object.keys(passOutputsData).join(', ')}`);

    if (Object.keys(passOutputsData).length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No pass outputs found. The valuation passes must complete first.',
        missingPasses: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      }, { status: 400 });
    }

    // 3. Check which passes are available
    const availablePasses = Object.keys(passOutputsData)
      .map(k => parseInt(k))
      .filter(n => !isNaN(n))
      .sort((a, b) => a - b);
    const missingPasses = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter(
      p => !availablePasses.includes(p)
    );

    console.log(`[REGENERATE] Available passes: ${availablePasses.join(', ')}`);

    if (missingPasses.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Cannot regenerate report. Missing passes: ${missingPasses.join(', ')}`,
        availablePasses,
        missingPasses,
        hint: `Use the "Retry from Pass ${missingPasses[0]}" button to complete the remaining passes first.`,
      }, { status: 400 });
    }

    // 4. Build PassOutputs object from the JSONB column
    // The pass_outputs column stores data as { "1": {...}, "2": {...}, ... }
    const passMap = new Map(
      Object.entries(passOutputsData).map(([k, v]) => [parseInt(k), v])
    );

    const passes: PassOutputs = {
      pass1: passMap.get(1) as Pass1Output,
      pass2: passMap.get(2) as Pass2Output,
      pass3: passMap.get(3) as Pass3Output,
      pass4: passMap.get(4) as Pass4Output,
      pass5: passMap.get(5) as Pass5Output,
      pass6: passMap.get(6) as Pass6Output,
      pass7: passMap.get(7) as Pass7Output,
      pass8: passMap.get(8) as Pass8Output,
      pass9: passMap.get(9) as Pass9Output,
      pass10: passMap.get(10) as Pass10Output,
      pass11: passMap.get(11) as Pass11Output,
      pass12: passMap.get(12) as Pass12Output,
    };

    // 5. Transform to final report
    console.log(`[REGENERATE] Transforming pass outputs to final report...`);
    const valuationDate = new Date().toISOString().split('T')[0];
    const finalReport = transformToFinalReport(passes, valuationDate);

    // 6. Validate the report
    const validation = validateFinalReport(finalReport);
    if (!validation.valid) {
      console.warn(`[REGENERATE] Validation errors: ${validation.errors.join(', ')}`);
    }
    if (validation.warnings.length > 0) {
      console.warn(`[REGENERATE] Validation warnings: ${validation.warnings.join(', ')}`);
    }

    // 7. Extract key values for database
    const concludedValue = finalReport.valuation_synthesis?.final_valuation?.concluded_value || null;
    const qualityGrade = passes.pass12?.quality_summary?.quality_grade || 'B';
    const qualityScore = passes.pass12?.quality_summary?.overall_quality_score || 75;

    // Add quality metrics to final report
    const reportWithQuality = {
      ...finalReport,
      quality_grade: qualityGrade,
      quality_score: qualityScore,
      valuation_conclusion: {
        concluded_value: concludedValue,
        value_range_low: finalReport.valuation_synthesis?.final_valuation?.valuation_range_low,
        value_range_high: finalReport.valuation_synthesis?.final_valuation?.valuation_range_high,
        confidence_level: finalReport.valuation_synthesis?.final_valuation?.confidence_level,
      },
    };

    // 8. Update the report in database
    console.log(`[REGENERATE] Saving report to database...`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (getSupabaseClient().from('reports') as any).update({
      report_status: 'completed',
      report_data: reportWithQuality,
      valuation_amount: concludedValue,
      valuation_method: 'Weighted Multi-Approach',
      executive_summary: finalReport.narratives?.executive_summary?.content || null,
      updated_at: new Date().toISOString(),
    }).eq('id', reportId);

    if (updateError) {
      console.error(`[REGENERATE] Error updating report: ${updateError.message}`);
      return NextResponse.json(
        { success: false, error: `Error saving report: ${updateError.message}` },
        { status: 500 }
      );
    }

    // 9. Generate PDF (unless skipped)
    let pdfGenerated = false;
    let pdfPath: string | null = null;
    let pdfError: string | null = null;

    if (!skipPdf) {
      console.log(`[REGENERATE] Generating PDF...`);
      try {
        const result = await generateAndStorePDF(
          reportId,
          report.company_name,
          reportWithQuality as unknown as Record<string, unknown>
        );

        pdfGenerated = result.success;
        pdfPath = result.pdfPath || null;
        pdfError = result.error || null;

        if (pdfGenerated) {
          console.log(`[REGENERATE] PDF generated: ${pdfPath}`);
        } else {
          console.warn(`[REGENERATE] PDF generation failed: ${pdfError}`);
        }
      } catch (err) {
        console.warn(`[REGENERATE] PDF generation error:`, err);
        pdfGenerated = false;
        pdfError = err instanceof Error ? err.message : 'Unknown PDF error';
      }
    }

    // 10. Return success
    return NextResponse.json({
      success: true,
      message: 'Report regenerated successfully',
      reportId,
      valuationSummary: {
        concludedValue,
        valueRangeLow: finalReport.valuation_synthesis?.final_valuation?.valuation_range_low,
        valueRangeHigh: finalReport.valuation_synthesis?.final_valuation?.valuation_range_high,
        qualityGrade,
        qualityScore,
      },
      validation: {
        valid: validation.valid,
        errorCount: validation.errors.length,
        warningCount: validation.warnings.length,
        warnings: validation.warnings.slice(0, 5), // Show first 5 warnings
      },
      pdf: {
        generated: pdfGenerated,
        path: pdfPath,
        error: pdfError,
        skipped: skipPdf,
      },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[REGENERATE] Error:`, errorMessage);

    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}

/**
 * GET handler - Check regeneration eligibility
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reportId } = await params;

  try {
    // Fetch the report's pass_outputs JSONB column
    const { data: reportData, error } = await getSupabaseClient()
      .from('reports')
      .select('id, pass_outputs, report_status')
      .eq('id', reportId)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!reportData) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    const report = reportData as {
      id: string;
      pass_outputs: Record<string, unknown> | null;
      report_status: string;
    };

    // Extract available passes from the JSONB column keys
    const passOutputsData = report.pass_outputs || {};
    const availablePasses = Object.keys(passOutputsData)
      .map(k => parseInt(k))
      .filter(n => !isNaN(n))
      .sort((a, b) => a - b);

    const missingPasses = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter(
      p => !availablePasses.includes(p)
    );

    return NextResponse.json({
      success: true,
      reportId,
      reportStatus: report.report_status,
      canRegenerate: missingPasses.length === 0,
      availablePasses,
      missingPasses,
      nextRequiredPass: missingPasses.length > 0 ? missingPasses[0] : null,
      hint: missingPasses.length > 0
        ? `Complete passes ${missingPasses.join(', ')} before regenerating`
        : 'All passes complete. Ready to regenerate.',
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
