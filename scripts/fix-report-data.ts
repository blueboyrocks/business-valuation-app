/**
 * Fix Report Data Script
 *
 * Re-aggregates pass_outputs to report_data using the fixed aggregator.
 * Run with: npx ts-node scripts/fix-report-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import { aggregatePassOutputsToReportData } from '../lib/report-aggregator';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const REPORT_ID = '3d30340d-fa5f-40db-84e5-4089a98bd431';

async function fixReportData() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials. Make sure .env.local has:');
    console.error('  NEXT_PUBLIC_SUPABASE_URL');
    console.error('  SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log(`\n📊 Fixing report data for ${REPORT_ID}...\n`);

  // 1. Fetch current report
  const { data: report, error: fetchError } = await supabase
    .from('reports')
    .select('id, company_name, pass_outputs, report_data')
    .eq('id', REPORT_ID)
    .single();

  if (fetchError || !report) {
    console.error('Error fetching report:', fetchError);
    process.exit(1);
  }

  console.log(`Company: ${report.company_name}`);
  console.log(`Pass outputs keys:`, Object.keys(report.pass_outputs || {}));

  // 2. Check narratives in pass_outputs
  const passOutputs = report.pass_outputs as Record<string, unknown>;
  const narrativesWrapper = passOutputs?.narratives as Record<string, unknown>;
  const passResults = narrativesWrapper?.pass_results as Record<string, unknown>;

  if (passResults) {
    console.log(`\n✅ Found narrative pass_results:`);
    for (const [key, value] of Object.entries(passResults)) {
      const content = (value as Record<string, unknown>)?.content as string;
      console.log(`  ${key}: ${content?.length || 0} chars`);
    }
  } else {
    console.log('❌ No narrative pass_results found');
  }

  // 3. Re-aggregate using fixed aggregator
  console.log(`\n🔄 Re-aggregating with fixed aggregator...`);
  const newReportData = aggregatePassOutputsToReportData(
    passOutputs,
    report.report_data as Record<string, unknown> || {}
  );

  // 4. Check the new data
  console.log(`\n📝 New report_data narrative lengths:`);
  console.log(`  executive_summary: ${(newReportData.executive_summary as string)?.length || 0} chars`);
  console.log(`  risk_assessment: ${(newReportData.risk_assessment as string)?.length || 0} chars`);
  console.log(`  strategic_insights: ${(newReportData.strategic_insights as string)?.length || 0} chars`);
  console.log(`  company_profile: ${(newReportData.company_profile as string)?.length || 0} chars`);
  console.log(`  financial_analysis: ${(newReportData.financial_analysis as string)?.length || 0} chars`);
  console.log(`  industry_analysis: ${(newReportData.industry_analysis as string)?.length || 0} chars`);
  console.log(`  asset_approach_analysis: ${(newReportData.asset_approach_analysis as string)?.length || 0} chars`);
  console.log(`  income_approach_analysis: ${(newReportData.income_approach_analysis as string)?.length || 0} chars`);
  console.log(`  market_approach_analysis: ${(newReportData.market_approach_analysis as string)?.length || 0} chars`);
  console.log(`  valuation_reconciliation: ${(newReportData.valuation_reconciliation as string)?.length || 0} chars`);
  console.log(`  assumptions_limiting_conditions: ${(newReportData.assumptions_limiting_conditions as string)?.length || 0} chars`);

  // 5. Update the database
  console.log(`\n💾 Updating database...`);
  const { error: updateError } = await supabase
    .from('reports')
    .update({
      report_data: newReportData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', REPORT_ID);

  if (updateError) {
    console.error('Error updating report:', updateError);
    process.exit(1);
  }

  console.log(`\n✅ Report data updated successfully!`);
  console.log(`\nNext steps:`);
  console.log(`1. Refresh the dashboard page to see the updated data`);
  console.log(`2. To regenerate the PDF, visit the report and click "Download PDF"`);
  console.log(`   or run: curl -X POST https://your-app.vercel.app/api/reports/${REPORT_ID}/regenerate`);
}

fixReportData().catch(console.error);
