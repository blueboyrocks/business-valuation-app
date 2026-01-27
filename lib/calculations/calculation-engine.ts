/**
 * Calculation Engine - Master orchestration layer
 */

import {
  CalculationEngineInputs,
  CalculationEngineOutput,
  CalculationConfig,
  CalculationStep,
} from './types';
import { calculateNormalizedEarnings, formatEarningsTables } from './earnings-calculator';
import {
  calculateAssetApproach,
  formatAssetApproachTable,
} from './asset-approach-calculator';
import {
  calculateIncomeApproach,
  formatIncomeApproachTable,
  DEFAULT_CAP_RATE_COMPONENTS,
} from './income-approach-calculator';
import {
  calculateMarketApproach,
  formatMarketApproachTable,
} from './market-approach-calculator';
import {
  calculateValuationSynthesis,
  formatSynthesisTable,
} from './synthesis-calculator';
import { resetStepCounter } from './utils';

/**
 * Default configuration for the calculation engine
 */
export const DEFAULT_CONFIG: CalculationConfig = {
  asset_weight: 0.2,
  income_weight: 0.4,
  market_weight: 0.4,
  risk_free_rate: DEFAULT_CAP_RATE_COMPONENTS.risk_free_rate,
  equity_risk_premium: DEFAULT_CAP_RATE_COMPONENTS.equity_risk_premium,
  size_premium: DEFAULT_CAP_RATE_COMPONENTS.size_premium,
  long_term_growth_rate: DEFAULT_CAP_RATE_COMPONENTS.long_term_growth_rate,
  apply_dlom: true,
  dlom_percentage: 0.15,
  apply_dloc: false,
  dloc_percentage: 0,
  multiple_position: 'MEDIAN',
  value_range_percentage: 0.15,
};

/**
 * Engine version for tracking
 */
export const ENGINE_VERSION = '1.0.0';

/**
 * Run the complete calculation engine
 *
 * @param inputs - All required inputs for valuation calculation
 * @returns Complete calculation output including all approaches and synthesis
 */
export function runCalculationEngine(inputs: CalculationEngineInputs): CalculationEngineOutput {
  resetStepCounter();
  const config = { ...DEFAULT_CONFIG, ...inputs.config };
  const allSteps: CalculationStep[] = [];
  const allWarnings: string[] = [];

  console.log('[CalculationEngine] Starting deterministic calculation engine...');
  console.log(`[CalculationEngine] Company: ${inputs.company_name}`);

  // ========================================================================
  // 1. Calculate Normalized Earnings (SDE and EBITDA)
  // ========================================================================
  const fairMarketSalary = inputs.fair_market_salary ?? 75000;
  const earnings = calculateNormalizedEarnings(inputs.financials, fairMarketSalary);
  allSteps.push(...earnings.calculation_steps);
  allWarnings.push(...earnings.warnings);

  console.log(
    `[CalculationEngine] Earnings: SDE=${earnings.weighted_sde}, EBITDA=${earnings.weighted_ebitda}`
  );

  // ========================================================================
  // 2. Calculate Asset Approach
  // ========================================================================
  const assetApproach = calculateAssetApproach({
    balance_sheet: inputs.balance_sheet,
    weight: config.asset_weight,
    weight_rationale: 'Standard weight for operating business - asset approach provides floor value',
  });
  allSteps.push(...assetApproach.calculation_steps);
  allWarnings.push(...assetApproach.warnings);

  // If engine's own asset approach returns 0 but Pass 7 has a value, use Pass 7's NAV
  if (
    assetApproach.adjusted_net_asset_value === 0 &&
    inputs.pass7_asset_approach?.adjusted_net_asset_value &&
    inputs.pass7_asset_approach.adjusted_net_asset_value > 0
  ) {
    console.log(`[CalculationEngine] Asset Approach was $0, using Pass 7 NAV: ${inputs.pass7_asset_approach.adjusted_net_asset_value}`);
    assetApproach.adjusted_net_asset_value = inputs.pass7_asset_approach.adjusted_net_asset_value;
    allWarnings.push('Asset approach value overridden by Pass 7 (AI-extracted) adjusted net asset value');
  }

  console.log(`[CalculationEngine] Asset Approach: ${assetApproach.adjusted_net_asset_value}`);

  // ========================================================================
  // 3. Calculate Income Approach
  // ========================================================================
  const incomeApproach = calculateIncomeApproach({
    weighted_sde: earnings.weighted_sde,
    weighted_ebitda: earnings.weighted_ebitda,
    benefit_stream_preference: 'AUTO',
    cap_rate_components: {
      risk_free_rate: config.risk_free_rate,
      equity_risk_premium: config.equity_risk_premium,
      size_premium: config.size_premium,
      long_term_growth_rate: config.long_term_growth_rate,
    },
    company_specific_risk_premium: inputs.risk_assessment.company_specific_risk_premium,
    weight: config.income_weight,
    weight_rationale: 'Primary approach for operating business with demonstrated earnings capacity',
  });
  allSteps.push(...incomeApproach.calculation_steps);
  allWarnings.push(...incomeApproach.warnings);

  console.log(`[CalculationEngine] Income Approach: ${incomeApproach.income_approach_value}`);

  // ========================================================================
  // 4. Calculate Market Approach
  // ========================================================================
  const marketApproach = calculateMarketApproach({
    weighted_sde: earnings.weighted_sde,
    weighted_ebitda: earnings.weighted_ebitda,
    revenue: inputs.financials.periods[0]?.gross_receipts,
    sde_multiple: inputs.industry.sde_multiple,
    ebitda_multiple: inputs.industry.ebitda_multiple,
    revenue_multiple: inputs.industry.revenue_multiple,
    multiple_preference: 'AUTO',
    multiple_position: config.multiple_position || 'MEDIAN',
    risk_factors: inputs.risk_assessment.risk_factors,
    weight: config.market_weight,
    weight_rationale: 'Reflects actual market transaction data for similar businesses',
    naics_code: inputs.industry.naics_code,
  });
  allSteps.push(...marketApproach.calculation_steps);
  allWarnings.push(...marketApproach.warnings);

  console.log(`[CalculationEngine] Market Approach: ${marketApproach.market_approach_value}`);

  // ========================================================================
  // 5. Calculate Synthesis
  // ========================================================================
  const synthesis = calculateValuationSynthesis({
    asset_approach_value: assetApproach.adjusted_net_asset_value,
    income_approach_value: incomeApproach.income_approach_value,
    market_approach_value: marketApproach.market_approach_value,
    weights: {
      asset: config.asset_weight!,
      income: config.income_weight!,
      market: config.market_weight!,
    },
    discounts_and_premiums: {
      dlom: {
        applicable: config.apply_dlom!,
        percentage: config.dlom_percentage!,
        rationale: 'Standard DLOM for private company with limited marketability',
      },
      dloc: {
        applicable: config.apply_dloc!,
        percentage: config.dloc_percentage!,
        rationale: 'Valuing 100% ownership interest',
      },
    },
    value_range_percent: config.value_range_percentage,
  });
  allSteps.push(...synthesis.calculation_steps);
  allWarnings.push(...synthesis.warnings);

  console.log(`[CalculationEngine] Final Value: ${synthesis.final_concluded_value}`);
  console.log(`[CalculationEngine] Total calculation steps: ${allSteps.length}`);
  console.log(`[CalculationEngine] Total warnings: ${allWarnings.length}`);

  // ========================================================================
  // 6. Format Tables for Narrative Passes
  // ========================================================================
  const earningsTables = formatEarningsTables(earnings);
  const formattedTables = {
    earnings_summary: earningsTables.earnings_summary,
    sde_detail: earningsTables.sde_detail,
    ebitda_detail: earningsTables.ebitda_detail,
    asset_approach: formatAssetApproachTable(assetApproach),
    income_approach: formatIncomeApproachTable(incomeApproach),
    market_approach: formatMarketApproachTable(marketApproach),
    synthesis: formatSynthesisTable(synthesis),
  };

  // ========================================================================
  // 7. Return Complete Output
  // ========================================================================
  return {
    earnings,
    asset_approach: assetApproach,
    income_approach: incomeApproach,
    market_approach: marketApproach,
    synthesis,
    all_calculation_steps: allSteps,
    total_steps: allSteps.length,
    all_warnings: allWarnings,
    formatted_tables: formattedTables,
    calculated_at: new Date().toISOString(),
    engine_version: ENGINE_VERSION,
  };
}

// Re-export individual calculators for direct use
export { calculateNormalizedEarnings, formatEarningsTables } from './earnings-calculator';
export { calculateAssetApproach, formatAssetApproachTable } from './asset-approach-calculator';
export {
  calculateIncomeApproach,
  formatIncomeApproachTable,
} from './income-approach-calculator';
export { calculateMarketApproach, formatMarketApproachTable } from './market-approach-calculator';
export { calculateValuationSynthesis, formatSynthesisTable } from './synthesis-calculator';
