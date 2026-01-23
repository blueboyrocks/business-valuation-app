/**
 * Debug endpoint to inspect report data flow
 * Shows where data is missing between passes and final report
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

function getNestedValue(obj: any, path: string): any {
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reportId } = await params;

  try {
    const { data: report, error } = await getSupabaseClient()
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .maybeSingle();

    if (error || !report) {
      return NextResponse.json({ error: error?.message || 'Report not found' }, { status: 404 });
    }

    // Cast to any to avoid TypeScript inference issues with Supabase
    const reportRow = report as any;
    const reportData = reportRow.report_data || {};
    const passOutputs = reportRow.pass_outputs || {};

    // Extract key values from different sources
    const analysis = {
      report_id: reportRow.id,
      report_status: reportRow.report_status,
      company_name: reportRow.company_name,

      // Check pass outputs
      pass_outputs_available: Object.keys(passOutputs).map(k => parseInt(k)).sort((a, b) => a - b),

      // Direct pass values (where the actual numbers are)
      pass_data: {
        // Pass 2: Income Statements
        pass2_revenue: getNestedValue(passOutputs, '2.income_statements.0.revenue.total_revenue') ||
                       getNestedValue(passOutputs, '2.income_statements.0.revenue.gross_receipts'),
        pass2_net_income: getNestedValue(passOutputs, '2.income_statements.0.net_income'),
        pass2_has_data: !!passOutputs['2'],

        // Pass 3: Balance Sheets
        pass3_total_assets: getNestedValue(passOutputs, '3.balance_sheets.0.total_assets'),
        pass3_total_liabilities: getNestedValue(passOutputs, '3.balance_sheets.0.total_liabilities'),
        pass3_cash: getNestedValue(passOutputs, '3.balance_sheets.0.current_assets.cash'),
        pass3_has_data: !!passOutputs['3'],

        // Pass 5: SDE/EBITDA
        pass5_sde: getNestedValue(passOutputs, '5.summary.most_recent_sde') ||
                   getNestedValue(passOutputs, '5.summary.normalized_sde'),
        pass5_ebitda: getNestedValue(passOutputs, '5.summary.most_recent_ebitda'),
        pass5_has_data: !!passOutputs['5'],

        // Pass 7: Asset Approach
        pass7_adjusted_net_asset: getNestedValue(passOutputs, '7.summary.adjusted_net_asset_value') ||
                                   getNestedValue(passOutputs, '7.asset_approach.adjusted_book_value'),
        pass7_book_equity: getNestedValue(passOutputs, '7.summary.book_value_equity') ||
                           getNestedValue(passOutputs, '7.asset_approach.book_value_equity'),
        pass7_has_data: !!passOutputs['7'],

        // Pass 8: Income Approach
        pass8_indicated_value: getNestedValue(passOutputs, '8.income_approach.indicated_value_point') ||
                               getNestedValue(passOutputs, '8.income_approach.single_period_capitalization.adjusted_indicated_value'),
        pass8_has_data: !!passOutputs['8'],

        // Pass 9: Market Approach
        pass9_indicated_value: getNestedValue(passOutputs, '9.market_approach.indicated_value_point') ||
                               getNestedValue(passOutputs, '9.market_approach.guideline_transaction_method.indicated_value_after_adjustments'),
        pass9_has_data: !!passOutputs['9'],

        // Pass 10: Value Synthesis
        pass10_concluded_value: getNestedValue(passOutputs, '10.conclusion.concluded_value'),
        pass10_has_data: !!passOutputs['10'],
      },

      // Report data (what PDF sees)
      report_data_check: {
        // Top-level flat properties (what PDF generator expects)
        valuation_amount: reportData.valuation_amount,
        asset_approach_value: reportData.asset_approach_value,
        income_approach_value: reportData.income_approach_value,
        market_approach_value: reportData.market_approach_value,
        annual_revenue: reportData.annual_revenue,
        pretax_income: reportData.pretax_income,
        total_assets: reportData.total_assets,
        total_liabilities: reportData.total_liabilities,
        cash: reportData.cash,

        // Nested structure (what transform creates)
        nested_concluded_value: getNestedValue(reportData, 'valuation_synthesis.final_valuation.concluded_value'),
        nested_asset_value: getNestedValue(reportData, 'valuation_approaches.asset_approach.adjusted_net_asset_value'),
        nested_income_value: getNestedValue(reportData, 'valuation_approaches.income_approach.income_approach_value'),
        nested_market_value: getNestedValue(reportData, 'valuation_approaches.market_approach.market_approach_value'),
        nested_revenue: getNestedValue(reportData, 'financial_data.income_statements.0.revenue.total_revenue'),

        // Narrative content check
        has_executive_summary: !!getNestedValue(reportData, 'narratives.executive_summary.content'),
        executive_summary_length: (getNestedValue(reportData, 'narratives.executive_summary.content') || '').length,
        has_asset_narrative: !!getNestedValue(reportData, 'narratives.asset_approach_narrative.content'),
        has_income_narrative: !!getNestedValue(reportData, 'narratives.income_approach_narrative.content'),
        has_market_narrative: !!getNestedValue(reportData, 'narratives.market_approach_narrative.content'),
      },

      // Keys available
      report_data_keys: Object.keys(reportData),

      // Validation summary
      issues: [] as string[],
    };

    // Identify issues
    if (!analysis.pass_data.pass7_adjusted_net_asset && passOutputs['7']) {
      analysis.issues.push('Pass 7 exists but adjusted_net_asset_value not found at expected path');
    }
    if (!analysis.pass_data.pass8_indicated_value && passOutputs['8']) {
      analysis.issues.push('Pass 8 exists but indicated_value not found at expected path');
    }
    if (!analysis.pass_data.pass9_indicated_value && passOutputs['9']) {
      analysis.issues.push('Pass 9 exists but indicated_value not found at expected path');
    }
    if (!analysis.report_data_check.valuation_amount && !analysis.report_data_check.nested_concluded_value) {
      analysis.issues.push('No concluded value in report_data (neither flat nor nested)');
    }
    if (!analysis.report_data_check.asset_approach_value && !analysis.report_data_check.nested_asset_value) {
      analysis.issues.push('No asset approach value in report_data');
    }
    if (!analysis.report_data_check.annual_revenue && !analysis.report_data_check.nested_revenue) {
      analysis.issues.push('No revenue in report_data');
    }

    return NextResponse.json(analysis, { status: 200 });

  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
