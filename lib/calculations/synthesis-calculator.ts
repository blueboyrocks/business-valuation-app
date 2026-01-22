/**
 * Synthesis Calculator - Combines all approaches into final value
 */

import {
  ValuationSynthesis,
  ApproachSummary,
  DiscountsAndPremiums,
  ValueRange,
  CalculationStep,
} from './types';
import {
  safeNumber,
  roundToDollar,
  roundToThousand,
  validateWeights,
  createStep,
  resetStepCounter,
  formatCurrency,
  formatPercentage,
  createTable,
} from './utils';

/**
 * Default Discount for Lack of Marketability
 */
export const DEFAULT_DLOM = 0.15;

/**
 * Default value range percentage (±15%)
 */
export const DEFAULT_VALUE_RANGE_PERCENT = 0.15;

export interface SynthesisInputs {
  asset_approach_value: number;
  income_approach_value: number;
  market_approach_value: number;
  weights: {
    asset: number;
    income: number;
    market: number;
  };
  discounts_and_premiums?: {
    dlom?: { applicable: boolean; percentage: number; rationale: string };
    dloc?: { applicable: boolean; percentage: number; rationale: string };
    control_premium?: { applicable: boolean; percentage: number; rationale: string };
    other_adjustments?: Array<{ name: string; percentage: number; rationale: string }>;
  };
  value_range_percent?: number;
}

/**
 * Calculate weighted value from all approaches
 */
export function calculateWeightedValue(
  approaches: ApproachSummary[],
  steps: CalculationStep[]
): number {
  let totalWeightedValue = 0;

  for (const approach of approaches) {
    approach.weighted_value = roundToDollar(approach.value * approach.weight);
    totalWeightedValue += approach.weighted_value;

    steps.push(
      createStep(
        'Synthesis',
        `Calculate weighted ${approach.approach} value`,
        `${approach.approach} Weighted = Value × Weight`,
        { value: approach.value, weight: formatPercentage(approach.weight) },
        approach.weighted_value
      )
    );
  }

  const preliminaryValue = roundToDollar(totalWeightedValue);

  steps.push(
    createStep(
      'Synthesis',
      'Calculate preliminary value',
      'Preliminary = Sum of weighted values',
      {
        asset_weighted: approaches.find(a => a.approach === 'Asset')?.weighted_value || 0,
        income_weighted: approaches.find(a => a.approach === 'Income')?.weighted_value || 0,
        market_weighted: approaches.find(a => a.approach === 'Market')?.weighted_value || 0,
      },
      preliminaryValue
    )
  );

  return preliminaryValue;
}

/**
 * Apply discounts and premiums to preliminary value
 */
export function applyDiscountsAndPremiums(
  preliminaryValue: number,
  discounts: DiscountsAndPremiums,
  steps: CalculationStep[]
): number {
  let currentValue = preliminaryValue;

  // Apply DLOM (Discount for Lack of Marketability)
  if (discounts.dlom.applicable && discounts.dlom.percentage > 0) {
    const dlomAmount = currentValue * discounts.dlom.percentage;
    currentValue = currentValue - dlomAmount;

    steps.push(
      createStep(
        'Synthesis',
        'Apply DLOM',
        `Value × (1 - ${formatPercentage(discounts.dlom.percentage)})`,
        {
          before: preliminaryValue,
          dlom_percentage: formatPercentage(discounts.dlom.percentage),
          dlom_amount: roundToDollar(dlomAmount),
        },
        roundToDollar(currentValue),
        discounts.dlom.rationale
      )
    );
  }

  // Apply DLOC (Discount for Lack of Control)
  if (discounts.dloc.applicable && discounts.dloc.percentage > 0) {
    const dlocAmount = currentValue * discounts.dloc.percentage;
    currentValue = currentValue - dlocAmount;

    steps.push(
      createStep(
        'Synthesis',
        'Apply DLOC',
        `Value × (1 - ${formatPercentage(discounts.dloc.percentage)})`,
        {
          before: currentValue + dlocAmount,
          dloc_percentage: formatPercentage(discounts.dloc.percentage),
        },
        roundToDollar(currentValue),
        discounts.dloc.rationale
      )
    );
  }

  // Apply Control Premium (if applicable)
  if (discounts.control_premium.applicable && discounts.control_premium.percentage > 0) {
    const premiumAmount = currentValue * discounts.control_premium.percentage;
    currentValue = currentValue + premiumAmount;

    steps.push(
      createStep(
        'Synthesis',
        'Apply Control Premium',
        `Value × (1 + ${formatPercentage(discounts.control_premium.percentage)})`,
        {
          before: currentValue - premiumAmount,
          premium_percentage: formatPercentage(discounts.control_premium.percentage),
        },
        roundToDollar(currentValue),
        discounts.control_premium.rationale
      )
    );
  }

  // Apply other adjustments
  for (const adj of discounts.other_adjustments) {
    const adjAmount = currentValue * Math.abs(adj.percentage);
    currentValue = adj.percentage > 0 ? currentValue + adjAmount : currentValue - adjAmount;

    steps.push(
      createStep(
        'Synthesis',
        `Apply ${adj.name}`,
        `Adjusted by ${formatPercentage(adj.percentage)}`,
        { adjustment_percentage: formatPercentage(adj.percentage) },
        roundToDollar(currentValue),
        adj.rationale
      )
    );
  }

  return roundToDollar(currentValue);
}

/**
 * Calculate final valuation synthesis
 */
export function calculateValuationSynthesis(inputs: SynthesisInputs): ValuationSynthesis {
  resetStepCounter();
  const steps: CalculationStep[] = [];
  const warnings: string[] = [];

  // Validate weights sum to 1.0
  const weightsArray = [inputs.weights.asset, inputs.weights.income, inputs.weights.market];
  const weightValidation = validateWeights(weightsArray);
  if (!weightValidation.valid) {
    warnings.push(...weightValidation.errors);
  }

  // Build approach summaries
  const approaches: ApproachSummary[] = [
    {
      approach: 'Asset',
      value: safeNumber(inputs.asset_approach_value),
      weight: inputs.weights.asset,
      weighted_value: 0,
    },
    {
      approach: 'Income',
      value: safeNumber(inputs.income_approach_value),
      weight: inputs.weights.income,
      weighted_value: 0,
    },
    {
      approach: 'Market',
      value: safeNumber(inputs.market_approach_value),
      weight: inputs.weights.market,
      weighted_value: 0,
    },
  ];

  // Calculate weighted preliminary value
  const preliminaryValue = calculateWeightedValue(approaches, steps);

  // Setup discounts and premiums
  const discounts: DiscountsAndPremiums = {
    dlom: inputs.discounts_and_premiums?.dlom ?? {
      applicable: true,
      percentage: DEFAULT_DLOM,
      rationale: 'Standard DLOM for private company with limited marketability',
    },
    dloc: inputs.discounts_and_premiums?.dloc ?? {
      applicable: false,
      percentage: 0,
      rationale: 'Valuing 100% ownership interest',
    },
    control_premium: inputs.discounts_and_premiums?.control_premium ?? {
      applicable: false,
      percentage: 0,
      rationale: 'Not applicable for 100% interest',
    },
    other_adjustments: inputs.discounts_and_premiums?.other_adjustments ?? [],
    total_adjustment_percentage: 0,
  };

  // Calculate total adjustment percentage
  let totalAdjPct = 0;
  if (discounts.dlom.applicable) totalAdjPct -= discounts.dlom.percentage;
  if (discounts.dloc.applicable) totalAdjPct -= discounts.dloc.percentage;
  if (discounts.control_premium.applicable) totalAdjPct += discounts.control_premium.percentage;
  for (const adj of discounts.other_adjustments) {
    totalAdjPct += adj.percentage;
  }
  discounts.total_adjustment_percentage = totalAdjPct;

  // Apply discounts and premiums
  const finalValue = applyDiscountsAndPremiums(preliminaryValue, discounts, steps);

  // Apply floor test (value shouldn't be below asset approach)
  const floorValue = safeNumber(inputs.asset_approach_value);
  const passesFloorTest = finalValue >= floorValue;
  let concludedValue = finalValue;

  if (!passesFloorTest) {
    warnings.push(
      `Final value (${formatCurrency(finalValue)}) is below asset floor ` +
        `(${formatCurrency(floorValue)}). Adjusting to floor value.`
    );
    concludedValue = floorValue;

    steps.push(
      createStep(
        'Synthesis',
        'Apply valuation floor',
        'Concluded = max(Final, Asset)',
        { final_value: finalValue, asset_floor: floorValue },
        concludedValue,
        'Floored at asset approach value'
      )
    );
  }

  // Round to nearest thousand
  concludedValue = roundToThousand(concludedValue);

  steps.push(
    createStep(
      'Synthesis',
      'Round concluded value',
      'Rounded to nearest $1,000',
      { before_rounding: finalValue },
      concludedValue
    )
  );

  // Calculate value range
  const rangePercent = inputs.value_range_percent ?? DEFAULT_VALUE_RANGE_PERCENT;
  const valueRange: ValueRange = {
    low: roundToThousand(concludedValue * (1 - rangePercent)),
    mid: concludedValue,
    high: roundToThousand(concludedValue * (1 + rangePercent)),
    range_percentage: rangePercent,
  };

  steps.push(
    createStep(
      'Synthesis',
      `Calculate value range (±${formatPercentage(rangePercent)})`,
      'Range = Value × (1 ± %)',
      { concluded_value: concludedValue, range_percent: formatPercentage(rangePercent) },
      concludedValue,
      `Range: ${formatCurrency(valueRange.low)} - ${formatCurrency(valueRange.high)}`
    )
  );

  return {
    approach_summary: approaches,
    preliminary_value: preliminaryValue,
    discounts_and_premiums: discounts,
    final_concluded_value: concludedValue,
    value_range: valueRange,
    passes_floor_test: passesFloorTest,
    floor_value: floorValue,
    calculation_steps: steps,
    warnings,
  };
}

/**
 * Format synthesis results as markdown
 */
export function formatSynthesisTable(result: ValuationSynthesis): string {
  const lines: string[] = [];

  lines.push('### Valuation Synthesis\n');
  lines.push('**Approach Summary:**\n');

  // Approach summary table
  const headers = ['Approach', 'Value', 'Weight', 'Weighted Value'];
  const rows = result.approach_summary.map(a => [
    a.approach,
    formatCurrency(a.value),
    formatPercentage(a.weight),
    formatCurrency(a.weighted_value),
  ]);
  rows.push([
    '**Preliminary Value**',
    '',
    '',
    `**${formatCurrency(result.preliminary_value)}**`,
  ]);
  lines.push(createTable(headers, rows));
  lines.push('');

  // Discounts and premiums
  const dp = result.discounts_and_premiums;
  lines.push('**Discounts and Premiums:**\n');
  if (dp.dlom.applicable) {
    lines.push(`- DLOM: ${formatPercentage(dp.dlom.percentage)} (${dp.dlom.rationale})`);
  }
  if (dp.dloc.applicable) {
    lines.push(`- DLOC: ${formatPercentage(dp.dloc.percentage)} (${dp.dloc.rationale})`);
  }
  if (dp.control_premium.applicable) {
    lines.push(
      `- Control Premium: +${formatPercentage(dp.control_premium.percentage)} ` +
        `(${dp.control_premium.rationale})`
    );
  }
  for (const adj of dp.other_adjustments) {
    const sign = adj.percentage >= 0 ? '+' : '';
    lines.push(`- ${adj.name}: ${sign}${formatPercentage(adj.percentage)} (${adj.rationale})`);
  }
  lines.push('');

  // Final values
  lines.push(`**Final Concluded Value:** ${formatCurrency(result.final_concluded_value)}`);
  lines.push(
    `**Value Range:** ${formatCurrency(result.value_range.low)} - ` +
      `${formatCurrency(result.value_range.high)} (±${formatPercentage(result.value_range.range_percentage)})`
  );

  if (!result.passes_floor_test) {
    lines.push(
      `\n⚠️ *Value floored at asset approach value of ${formatCurrency(result.floor_value)}*`
    );
  }

  return lines.join('\n');
}
