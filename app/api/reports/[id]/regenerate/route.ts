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

export const maxDuration = 120; // PDF generation can take time - v6 (premium quality fixes)
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { transformToFinalReport, PassOutputs, validateFinalReport } from '@/lib/claude/transform-to-final-report';
import { generateAndStorePDF } from '@/lib/pdf/auto-generate';
import { validateReportOutput } from '@/lib/validation/report-output-validator';
import { reconcileWithNarratives } from '@/lib/extraction/narrative-data-extractor';
import { checkReportQuality, formatQualityReport } from '@/lib/validation/quality-checker';
import { createDisclaimerManager, type DisclaimerContext } from '@/lib/content/disclaimers';
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
import {
  runCalculationEngine,
  mapPassOutputsToEngineInputs,
  type CalculationEngineOutput,
} from '@/lib/calculations';
import { createDataStoreFromResults } from '@/lib/valuation/data-store-factory';
import type { ValuationDataAccessor } from '@/lib/valuation/data-accessor';
import { runIndustryGate } from '@/lib/valuation/industry-gate';
import { createMultiplesLookup } from '@/lib/valuation/industry-multiples-lookup';
import { createConsistencyValidator } from '@/lib/valuation/consistency-validator';
import { runQualityGate } from '@/lib/validation/quality-gate';

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

  console.log(`[REGENERATE] v4 - Starting regeneration for report ${reportId}`);

  try {
    // 1. Fetch the report with pass_outputs and calculation_results
    const { data: reportData, error: reportError } = await getSupabaseClient()
      .from('reports')
      .select('id, company_name, report_status, pass_outputs, calculation_results')
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
      calculation_results: CalculationEngineOutput | null;
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

    // 7. Extract key values - PREFER deterministic calculation engine over AI
    let calcResults = report.calculation_results;
    let hasCalcEngine = !!calcResults?.synthesis?.final_concluded_value;

    // If no stored calculation results, run the engine on-the-fly from pass outputs
    if (!hasCalcEngine) {
      console.log(`[REGENERATE] No stored calculation results. Running calculation engine on-the-fly...`);
      try {
        const passDataForEngine: Record<string, Record<string, unknown>> = {
          '1': passMap.get(1) as Record<string, unknown>,
          '2': passMap.get(2) as Record<string, unknown>,
          '3': passMap.get(3) as Record<string, unknown>,
          '4': passMap.get(4) as Record<string, unknown>,
          '5': passMap.get(5) as Record<string, unknown>,
          '6': passMap.get(6) as Record<string, unknown>,
          '7': passMap.get(7) as Record<string, unknown>,
        };
        const calculationInputs = mapPassOutputsToEngineInputs(passDataForEngine);
        calcResults = runCalculationEngine(calculationInputs);
        hasCalcEngine = !!calcResults?.synthesis?.final_concluded_value;

        if (hasCalcEngine) {
          console.log(`[REGENERATE] Calculation engine produced values. Concluded: $${calcResults!.synthesis.final_concluded_value.toLocaleString()}`);
          // Save to database for future regenerations
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (getSupabaseClient().from('reports') as any)
            .update({ calculation_results: calcResults })
            .eq('id', reportId);
          console.log(`[REGENERATE] Saved calculation results to database`);
        } else {
          console.warn(`[REGENERATE] Calculation engine ran but produced no concluded value`);
        }
      } catch (calcError) {
        console.warn(`[REGENERATE] Calculation engine failed (non-blocking):`, calcError);
      }
    }

    if (hasCalcEngine) {
      console.log(`[REGENERATE] Using deterministic calculation engine values`);
    } else {
      console.log(`[REGENERATE] Falling back to AI pass outputs`);
    }

    // PRD-A: Create DataStore + Accessor for single source of truth
    let dataAccessor: ValuationDataAccessor | undefined;
    if (hasCalcEngine && calcResults) {
      try {
        const reportMeta: Record<string, unknown> = {
          company_name: report.company_name,
          industry_name: passes.pass1?.industry_classification?.naics_description ||
                         passes.pass4?.industry_overview?.industry_name || '',
          naics_code: passes.pass1?.industry_classification?.naics_code || '',
          entity_type: (passes.pass1 as any)?.company_profile?.entity_type || '',
          annual_revenue: (passes.pass2?.income_statements?.[0] as any)?.revenue?.total_revenue || 0,
          pretax_income: (passes.pass2?.income_statements?.[0] as any)?.net_income || 0,
          owner_compensation: (passes.pass2?.income_statements?.[0] as any)?.operating_expenses?.officer_compensation || 0,
          total_assets: (passes.pass3?.balance_sheets?.[0] as any)?.total_assets || 0,
          total_liabilities: (passes.pass3?.balance_sheets?.[0] as any)?.total_liabilities || 0,
          cash: (passes.pass3?.balance_sheets?.[0] as any)?.current_assets?.cash || 0,
          accounts_receivable: (passes.pass3?.balance_sheets?.[0] as any)?.current_assets?.accounts_receivable || 0,
          inventory: (passes.pass3?.balance_sheets?.[0] as any)?.current_assets?.inventory || 0,
        };
        const { accessor } = createDataStoreFromResults(calcResults, reportMeta);
        dataAccessor = accessor;
        console.log(`[REGENERATE] DataStore created. Final value: ${accessor.getFinalValueFormatted()}`);
      } catch (dsError) {
        console.warn(`[REGENERATE] DataStore creation failed (non-blocking):`, dsError);
      }
    }

    // PRD-A Step 7: ConsistencyValidator - BLOCKS on failure
    if (dataAccessor && hasCalcEngine && calcResults) {
      const { store } = createDataStoreFromResults(calcResults, {
        company_name: report.company_name,
        industry_name: passes.pass1?.industry_classification?.naics_description ||
                       passes.pass4?.industry_overview?.industry_name || '',
        naics_code: passes.pass1?.industry_classification?.naics_code || '',
        entity_type: (passes.pass1 as any)?.company_profile?.entity_type || '',
        annual_revenue: (passes.pass2?.income_statements?.[0] as any)?.revenue?.total_revenue || 0,
        pretax_income: (passes.pass2?.income_statements?.[0] as any)?.net_income || 0,
        owner_compensation: (passes.pass2?.income_statements?.[0] as any)?.operating_expenses?.officer_compensation || 0,
        total_assets: (passes.pass3?.balance_sheets?.[0] as any)?.total_assets || 0,
        total_liabilities: (passes.pass3?.balance_sheets?.[0] as any)?.total_liabilities || 0,
        cash: (passes.pass3?.balance_sheets?.[0] as any)?.current_assets?.cash || 0,
        accounts_receivable: (passes.pass3?.balance_sheets?.[0] as any)?.current_assets?.accounts_receivable || 0,
        inventory: (passes.pass3?.balance_sheets?.[0] as any)?.current_assets?.inventory || 0,
      });
      const validator = createConsistencyValidator(store);
      const validationResult = validator.validateAll();
      if (!validationResult.overall_passed) {
        console.error(`[REGENERATE] CONSISTENCY GATE BLOCKED: ${validationResult.error_count} error(s), ${validationResult.warning_count} warning(s)`);
        validationResult.all_errors.forEach(e => console.error(`  [ERROR] ${e}`));
        validationResult.all_warnings.forEach(w => console.error(`  [WARN] ${w}`));
        return NextResponse.json({
          success: false,
          error: `Consistency gate blocked PDF generation: ${validationResult.error_count} data consistency error(s) detected`,
          gate: 'consistency',
          errors: validationResult.all_errors,
          warnings: validationResult.all_warnings,
          hint: 'Fix data inconsistencies in pass outputs or NULL calculation_results to force re-computation.',
        }, { status: 422 });
      }
      console.log(`[REGENERATE] Consistency gate passed (${validationResult.warning_count} warning(s))`);
    }

    // PRD-B: Industry Gate - BLOCKS on wrong-industry references
    const naicsCode = passes.pass1?.industry_classification?.naics_code || '';
    if (naicsCode) {
      const narrativeSections = [
        { name: 'executive_summary', content: (passes.pass11 as any)?.report_narratives?.executive_summary?.content || '' },
        { name: 'industry_analysis', content: (passes.pass11 as any)?.report_narratives?.industry_analysis?.content || '' },
        { name: 'financial_analysis', content: (passes.pass11 as any)?.report_narratives?.financial_analysis?.content || '' },
        { name: 'market_approach', content: (passes.pass9 as any)?.narrative || '' },
        { name: 'income_approach', content: (passes.pass8 as any)?.narrative || '' },
        { name: 'asset_approach', content: (passes.pass7 as any)?.narrative || '' },
      ].filter(s => s.content.length > 0);

      const gateResult = runIndustryGate(naicsCode, narrativeSections);
      if (!gateResult.passed) {
        console.error(`[REGENERATE] INDUSTRY GATE BLOCKED: ${gateResult.violations.length} violations found`);
        gateResult.violations.forEach(v => {
          console.error(`  - Section "${v.section}": blocked keyword "${v.keyword}" found near: "${v.snippet}"`);
        });
        return NextResponse.json({
          success: false,
          error: `Industry gate blocked PDF generation: ${gateResult.violations.length} wrong-industry reference(s) found in narratives`,
          gate: 'industry',
          violations: gateResult.violations.map(v => ({
            section: v.section,
            keyword: v.keyword,
            snippet: v.snippet,
          })),
          hint: 'Re-run Pass 11 (narrative generation) to regenerate narratives with correct industry context, then try regeneration again.',
        }, { status: 422 });
      }
      console.log(`[REGENERATE] Industry gate passed (NAICS ${naicsCode})`);
    }

    // PRD-C: Value Gate - BLOCKS if SDE multiple exceeds industry ceiling
    if (hasCalcEngine && calcResults && naicsCode) {
      const sdeMultiple = calcResults.market_approach.adjusted_multiple;
      const lookup = createMultiplesLookup();
      const range = lookup.getSDEMultipleRange(naicsCode);
      if (range && sdeMultiple > range.ceiling) {
        console.error(`[REGENERATE] VALUE GATE BLOCKED: SDE multiple ${sdeMultiple.toFixed(2)}x exceeds ceiling ${range.ceiling.toFixed(2)}x for NAICS ${naicsCode}`);
        return NextResponse.json({
          success: false,
          error: `Value gate blocked PDF generation: SDE multiple ${sdeMultiple.toFixed(2)}x exceeds industry ceiling of ${range.ceiling.toFixed(2)}x for NAICS ${naicsCode}`,
          gate: 'value',
          details: {
            sde_multiple: sdeMultiple,
            industry_ceiling: range.ceiling,
            naics_code: naicsCode,
          },
          hint: 'NULL the calculation_results column to force re-computation with ceiling enforcement, then try regeneration again.',
        }, { status: 422 });
      }
      if (range) {
        console.log(`[REGENERATE] Value gate passed: ${sdeMultiple.toFixed(2)}x within ceiling ${range.ceiling.toFixed(2)}x`);
      }
    }

    // Read values from calculation engine first, fall back to AI pass outputs
    const assetValue = hasCalcEngine
      ? (calcResults!.asset_approach.adjusted_net_asset_value ||
         passes.pass7?.summary?.adjusted_net_asset_value ||
         passes.pass7?.asset_approach?.adjusted_book_value || 0)
      : (passes.pass7?.summary?.adjusted_net_asset_value ||
         passes.pass7?.asset_approach?.adjusted_book_value || 0);
    const incomeValue = hasCalcEngine
      ? calcResults!.income_approach.income_approach_value
      : (passes.pass8?.income_approach?.indicated_value_point ||
         passes.pass8?.income_approach?.single_period_capitalization?.adjusted_indicated_value || 0);
    const marketValue = hasCalcEngine
      ? calcResults!.market_approach.market_approach_value
      : (passes.pass9?.market_approach?.indicated_value_point ||
         passes.pass9?.market_approach?.guideline_transaction_method?.indicated_value_after_adjustments || 0);

    // Get concluded value from calculation engine, then pass10, then weighted average
    const concludedValue = hasCalcEngine
      ? calcResults!.synthesis.final_concluded_value
      : (passes.pass10?.conclusion?.concluded_value ||
         ((assetValue * 0.20) + (incomeValue * 0.40) + (marketValue * 0.40)) || null);

    // Get financial data from passes (cast to any for flexible property access)
    const incomeStmt = (passes.pass2?.income_statements?.[0] || {}) as any;
    const balanceSheet = (passes.pass3?.balance_sheets?.[0] || {}) as any;
    const opExpenses = incomeStmt.operating_expenses || {} as any;

    const qualityGrade = passes.pass12?.quality_summary?.quality_grade || 'B';
    const qualityScore = passes.pass12?.quality_summary?.overall_quality_score || 75;

    console.log(`[REGENERATE] Extracted values - Asset: ${assetValue}, Income: ${incomeValue}, Market: ${marketValue}, Concluded: ${concludedValue}`);

    // Extract narratives from Pass 11
    const pass11Narratives = (passes.pass11 as any)?.report_narratives || (passes.pass11 as any)?.narratives || {};

    // Helper to get narrative content (handles both string and {content: string} formats)
    const getNarrativeContent = (value: any): string => {
      if (!value) return '';
      if (typeof value === 'string') return value;
      if (value.content) return value.content;
      return '';
    };

    // Add quality metrics AND flat properties for PDF generator and web app
    const reportWithQuality = {
      ...finalReport,
      // Quality metrics
      quality_grade: qualityGrade,
      quality_score: qualityScore,

      // Valuation metadata (flat for web app)
      valuation_amount: concludedValue,
      valuation_method: 'Weighted Multi-Approach',
      confidence_level: finalReport.valuation_synthesis?.final_valuation?.confidence_level || 'Moderate',
      valuation_range_low: hasCalcEngine
        ? calcResults!.synthesis.value_range.low
        : (finalReport.valuation_synthesis?.final_valuation?.valuation_range_low || (concludedValue ? Math.round(concludedValue * 0.85) : 0)),
      valuation_range_high: hasCalcEngine
        ? calcResults!.synthesis.value_range.high
        : (finalReport.valuation_synthesis?.final_valuation?.valuation_range_high || (concludedValue ? Math.round(concludedValue * 1.15) : 0)),
      standard_of_value: 'Fair Market Value',

      // Also keep nested structure for compatibility
      valuation_conclusion: {
        concluded_value: concludedValue,
        value_range_low: hasCalcEngine
          ? calcResults!.synthesis.value_range.low
          : (finalReport.valuation_synthesis?.final_valuation?.valuation_range_low || (concludedValue ? Math.round(concludedValue * 0.85) : 0)),
        value_range_high: hasCalcEngine
          ? calcResults!.synthesis.value_range.high
          : (finalReport.valuation_synthesis?.final_valuation?.valuation_range_high || (concludedValue ? Math.round(concludedValue * 1.15) : 0)),
        confidence_level: finalReport.valuation_synthesis?.final_valuation?.confidence_level || 'Moderate',
      },

      // Approach values (flat for web app)
      asset_approach_value: assetValue,
      income_approach_value: incomeValue,
      market_approach_value: marketValue,

      // Approach weights as numbers (critical for web app display)
      asset_approach_weight: hasCalcEngine
        ? (calcResults!.synthesis.approach_summary.find(a => a.approach === 'Asset')?.weight ?? 0.20)
        : 0.20,
      income_approach_weight: hasCalcEngine
        ? (calcResults!.synthesis.approach_summary.find(a => a.approach === 'Income')?.weight ?? 0.40)
        : 0.40,
      market_approach_weight: hasCalcEngine
        ? (calcResults!.synthesis.approach_summary.find(a => a.approach === 'Market')?.weight ?? 0.40)
        : 0.40,

      // Liquidation value (65% of asset value per industry standard)
      liquidation_value: Math.round(assetValue * 0.65),

      // Financial data (flat) for PDF generator
      annual_revenue: incomeStmt.revenue?.total_revenue || incomeStmt.revenue?.gross_receipts || 0,
      pretax_income: incomeStmt.net_income || 0,
      owner_compensation: (passes.pass5?.sde_calculations?.[0] as any)?.owner_compensation?.amount ||
                          incomeStmt.operating_expenses?.officer_compensation || 0,
      officer_compensation: incomeStmt.operating_expenses?.officer_compensation || 0,
      interest_expense: opExpenses.interest_expense || incomeStmt.interest_expense || 0,
      depreciation_amortization: opExpenses.depreciation_amortization || opExpenses.depreciation || 0,
      non_cash_expenses: opExpenses.depreciation_amortization || opExpenses.depreciation || 0,

      // Normalized earnings - prefer deterministic calculation engine
      normalized_sde: hasCalcEngine
        ? calcResults!.earnings.weighted_sde
        : ((passes.pass5?.summary as any)?.normalized_sde || passes.pass5?.summary?.most_recent_sde || 0),
      normalized_ebitda: hasCalcEngine
        ? calcResults!.earnings.weighted_ebitda
        : ((passes.pass5?.summary as any)?.most_recent_ebitda || passes.pass5?.summary?.most_recent_ebitda || 0),

      // Balance sheet data
      cash: balanceSheet.current_assets?.cash || 0,
      accounts_receivable: balanceSheet.current_assets?.accounts_receivable || 0,
      inventory: balanceSheet.current_assets?.inventory || 0,
      other_current_assets: balanceSheet.current_assets?.other_current_assets || 0,
      fixed_assets: balanceSheet.fixed_assets?.total_fixed_assets || balanceSheet.fixed_assets?.net_fixed_assets || 0,
      intangible_assets: balanceSheet.intangible_assets?.total_intangibles || 0,
      total_assets: balanceSheet.total_assets || 0,
      accounts_payable: balanceSheet.current_liabilities?.accounts_payable || 0,
      other_short_term_liabilities: (balanceSheet.current_liabilities?.total_current_liabilities || 0) - (balanceSheet.current_liabilities?.accounts_payable || 0),
      bank_loans: balanceSheet.long_term_liabilities?.notes_payable || 0,
      other_long_term_liabilities: balanceSheet.long_term_liabilities?.total_long_term_liabilities || 0,
      total_liabilities: balanceSheet.total_liabilities || 0,

      // Risk data (use any cast for flexible property access)
      risk_score: (passes.pass6 as any)?.overall_risk_score || (passes.pass6 as any)?.risk_assessment?.overall_score || 5,
      overall_risk_score: (passes.pass6 as any)?.overall_risk_score || (passes.pass6 as any)?.risk_assessment?.overall_score || 5,

      // Industry data
      industry_name: passes.pass1?.industry_classification?.naics_description ||
                     passes.pass4?.industry_overview?.industry_name || '',
      industry_naics_code: passes.pass1?.industry_classification?.naics_code || '',

      // ALL NARRATIVE SECTIONS (flat for web app) - critical for premium report
      executive_summary: getNarrativeContent(finalReport.narratives?.executive_summary) ||
                         getNarrativeContent(pass11Narratives.executive_summary) || '',

      financial_analysis: getNarrativeContent(finalReport.narratives?.financial_analysis) ||
                          getNarrativeContent(pass11Narratives.financial_analysis) || '',

      industry_analysis: getNarrativeContent(finalReport.narratives?.industry_analysis) ||
                         getNarrativeContent(pass11Narratives.industry_analysis) ||
                         getNarrativeContent((passes.pass4 as any)?.narrative) || '',

      risk_assessment: getNarrativeContent(finalReport.narratives?.risk_assessment) ||
                       getNarrativeContent(pass11Narratives.risk_assessment) ||
                       getNarrativeContent((passes.pass6 as any)?.narrative) || '',

      company_profile: getNarrativeContent(finalReport.narratives?.company_overview) ||
                       getNarrativeContent(pass11Narratives.company_overview) ||
                       getNarrativeContent((passes.pass1 as any)?.narrative) || '',

      strategic_insights: getNarrativeContent(finalReport.narratives?.value_enhancement_recommendations) ||
                          getNarrativeContent(pass11Narratives.value_enhancement_recommendations) ||
                          getNarrativeContent(pass11Narratives.strategic_insights) || '',

      // Approach narratives (flat for web app)
      asset_approach_analysis: getNarrativeContent(finalReport.narratives?.asset_approach_narrative) ||
                               getNarrativeContent(passes.pass7?.narrative) || '',
      income_approach_analysis: getNarrativeContent(finalReport.narratives?.income_approach_narrative) ||
                                getNarrativeContent(passes.pass8?.narrative) || '',
      market_approach_analysis: getNarrativeContent(finalReport.narratives?.market_approach_narrative) ||
                                getNarrativeContent(passes.pass9?.narrative) || '',
      valuation_reconciliation: getNarrativeContent(finalReport.narratives?.valuation_synthesis_narrative) ||
                                getNarrativeContent(passes.pass10?.narrative) || '',
    };

    // 7b. Generate and attach standard disclaimers
    try {
      const disclaimerManager = createDisclaimerManager();
      const disclaimerContext: DisclaimerContext = {
        company_name: report.company_name || 'the subject company',
        valuation_date: finalReport.valuation_date || new Date().toISOString().split('T')[0],
        report_date: new Date().toISOString().split('T')[0],
        industry: reportWithQuality.industry_name || undefined,
        naics_code: reportWithQuality.industry_naics_code || undefined,
        standard_of_value: 'Fair Market Value',
      };
      const allDisclaimers = disclaimerManager.getAllDisclaimers(disclaimerContext);
      (reportWithQuality as any).disclaimers = allDisclaimers.map(d => ({
        title: d.title,
        content: d.content,
      }));
      console.log(`[REGENERATE] Added ${allDisclaimers.length} standard disclaimers`);
    } catch (disclaimerError) {
      console.warn(`[REGENERATE] Disclaimer generation failed (non-blocking):`, disclaimerError);
    }

    // 7b-2. Attach calculation engine metadata if available
    if (hasCalcEngine) {
      (reportWithQuality as any).calculation_engine = {
        version: calcResults!.engine_version || 'deterministic-v1',
        total_steps: calcResults!.total_steps,
        sde_weighted: calcResults!.earnings.weighted_sde,
        ebitda_weighted: calcResults!.earnings.weighted_ebitda,
        asset_value: calcResults!.asset_approach.adjusted_net_asset_value,
        income_value: calcResults!.income_approach.income_approach_value,
        market_value: calcResults!.market_approach.market_approach_value,
        cap_rate: calcResults!.income_approach.cap_rate_components.capitalization_rate,
        sde_multiple: calcResults!.market_approach.adjusted_multiple,
        preliminary_value: calcResults!.synthesis.preliminary_value,
        final_value: calcResults!.synthesis.final_concluded_value,
        value_range_low: calcResults!.synthesis.value_range.low,
        value_range_high: calcResults!.synthesis.value_range.high,
        dlom_applied: calcResults!.synthesis.discounts_and_premiums.dlom.applicable,
        dlom_percentage: calcResults!.synthesis.discounts_and_premiums.dlom.percentage,
      };
      console.log(`[REGENERATE] Attached calculation engine metadata (${calcResults!.total_steps} steps)`);
    }

    // 7c. Reconcile with narrative data (fallback for missing values)
    // IMPORTANT: Pass hasCalculationEngine flag to prevent narrative values from
    // overwriting deterministic calculation engine values. Data flow is one-directional:
    // Calculation Engine -> DataStore -> Narratives (narratives never modify calc values).
    const narrativesForReconciliation = {
      executive_summary: finalReport.narratives?.executive_summary,
      asset_approach_narrative: finalReport.narratives?.asset_approach_narrative || passes.pass7?.narrative,
      income_approach_narrative: finalReport.narratives?.income_approach_narrative || passes.pass8?.narrative,
      market_approach_narrative: finalReport.narratives?.market_approach_narrative || passes.pass9?.narrative,
    };

    const reconciledReport = reconcileWithNarratives(
      reportWithQuality,
      narrativesForReconciliation,
      { hasCalculationEngine: hasCalcEngine }
    );
    console.log(`[REGENERATE] After reconciliation - Asset: ${reconciledReport.asset_approach_value}, Income: ${reconciledReport.income_approach_value}, Market: ${reconciledReport.market_approach_value}`);

    // 7c. Validate the final report data
    const outputValidation = validateReportOutput(reconciledReport);
    if (!outputValidation.isValid) {
      console.warn(`[REGENERATE] Output validation failed: ${outputValidation.missingFields.join(', ')}`);
    }
    console.log(`[REGENERATE] Output completeness score: ${outputValidation.score}/100`);

    // 7d. Quality check for premium report standards
    const qualityResult = checkReportQuality(reconciledReport);
    console.log(formatQualityReport(qualityResult));
    console.log(`[REGENERATE] Quality Score: ${qualityResult.score}/100 (Grade: ${qualityResult.grade}, Premium Ready: ${qualityResult.isPremiumReady})`);

    // Add quality metrics to the report
    reconciledReport.quality_score = qualityResult.score;
    reconciledReport.quality_grade = qualityResult.grade;
    reconciledReport.is_premium_ready = qualityResult.isPremiumReady;

    // US-027: Run comprehensive quality gate before finalizing
    if (dataAccessor) {
      console.log(`[REGENERATE] Running comprehensive quality gate...`);

      // Build section contents from reconciledReport
      const sectionContents = new Map<string, string>();
      const narrativeKeys = [
        'executive_summary',
        'company_profile',
        'financial_analysis',
        'industry_analysis',
        'risk_assessment',
        'asset_approach_analysis',
        'income_approach_analysis',
        'market_approach_analysis',
        'valuation_reconciliation',
        'strategic_insights',
      ];
      for (const key of narrativeKeys) {
        const value = (reconciledReport as Record<string, unknown>)[key];
        if (typeof value === 'string' && value.length > 0) {
          sectionContents.set(key, value);
        }
      }

      const rawDataString = JSON.stringify(reconciledReport);
      const qualityGateResult = runQualityGate(dataAccessor, sectionContents, rawDataString);

      console.log(`[REGENERATE] Quality gate score: ${qualityGateResult.score}/100`);
      console.log(`[REGENERATE] Quality gate canProceed: ${qualityGateResult.canProceed}`);

      // Store quality gate result in report
      (reconciledReport as Record<string, unknown>).quality_gate = {
        score: qualityGateResult.score,
        passed: qualityGateResult.passed,
        canProceed: qualityGateResult.canProceed,
        categories: {
          dataIntegrity: qualityGateResult.categories.dataIntegrity.score,
          businessRules: qualityGateResult.categories.businessRules.score,
          completeness: qualityGateResult.categories.completeness.score,
          formatting: qualityGateResult.categories.formatting.score,
        },
        blockingErrors: qualityGateResult.blockingErrors,
        warnings: qualityGateResult.warnings,
      };

      if (!qualityGateResult.canProceed) {
        console.error(`[REGENERATE] Quality gate BLOCKED finalization`);
        console.error(`[REGENERATE] Blocking errors: ${qualityGateResult.blockingErrors.join(', ')}`);
        return NextResponse.json({
          success: false,
          error: 'Quality gate blocked report finalization',
          gate: 'quality',
          score: qualityGateResult.score,
          blockingErrors: qualityGateResult.blockingErrors,
          warnings: qualityGateResult.warnings,
          categories: {
            dataIntegrity: qualityGateResult.categories.dataIntegrity.score,
            businessRules: qualityGateResult.categories.businessRules.score,
            completeness: qualityGateResult.categories.completeness.score,
            formatting: qualityGateResult.categories.formatting.score,
          },
          hint: 'Fix the blocking errors and try regeneration again.',
        }, { status: 422 });
      }

      // Log warnings but proceed
      if (qualityGateResult.warnings.length > 0) {
        console.warn(`[REGENERATE] Quality gate passed with ${qualityGateResult.warnings.length} warning(s)`);
      }
    } else {
      console.warn(`[REGENERATE] No DataAccessor available - skipping quality gate`);
    }

    // 8. Update the report in database
    console.log(`[REGENERATE] Saving report to database...`);
    // Use reconciled values for the final concluded value
    const finalConcludedValue = reconciledReport.valuation_amount || concludedValue;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (getSupabaseClient().from('reports') as any).update({
      report_status: 'completed',
      report_data: reconciledReport,
      valuation_amount: finalConcludedValue,
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
          reconciledReport as unknown as Record<string, unknown>,
          dataAccessor
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
      version: 'v6',
      valuationSummary: {
        concludedValue: finalConcludedValue,
        assetApproachValue: reconciledReport.asset_approach_value,
        incomeApproachValue: reconciledReport.income_approach_value,
        marketApproachValue: reconciledReport.market_approach_value,
        valueRangeLow: finalReport.valuation_synthesis?.final_valuation?.valuation_range_low,
        valueRangeHigh: finalReport.valuation_synthesis?.final_valuation?.valuation_range_high,
        qualityGrade,
        qualityScore,
      },
      validation: {
        schemaValid: validation.valid,
        schemaErrorCount: validation.errors.length,
        schemaWarningCount: validation.warnings.length,
        schemaWarnings: validation.warnings.slice(0, 5),
        outputValid: outputValidation.isValid,
        outputCompletenessScore: outputValidation.score,
        outputMissingFields: outputValidation.missingFields,
        outputNullFields: outputValidation.nullFields.slice(0, 5),
      },
      quality: {
        score: qualityResult.score,
        grade: qualityResult.grade,
        isPremiumReady: qualityResult.isPremiumReady,
        summary: qualityResult.summary,
        failedChecks: qualityResult.checks.filter(c => !c.passed).map(c => ({
          name: c.name,
          category: c.category,
          details: c.details,
        })),
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
