/**
 * Market Approach Calculator - Guideline Transaction Method
 *
 * CRITICAL: Integrates with MultipleValidator to prevent invalid multiples
 * that caused the $4.1M valuation error (should have been ~$2.8M)
 */

import {
  MarketApproachCalculation,
  MultipleAdjustment,
  MultipleRange,
  RiskFactor,
  CalculationStep,
} from './types';
import {
  safeNumber,
  roundToThousand,
  clamp,
  createStep,
  resetStepCounter,
  formatCurrency,
  formatMultiple,
  formatPercentage,
} from './utils';
import { createMultipleValidator } from '../valuation/multiple-validator';
import { createMultiplesLookup } from '../valuation/industry-multiples-lookup';

export interface MarketApproachInputs {
  weighted_sde: number;
  weighted_ebitda: number;
  revenue?: number;
  sde_multiple: MultipleRange;
  ebitda_multiple: MultipleRange;
  revenue_multiple?: MultipleRange;
  multiple_preference: 'SDE' | 'EBITDA' | 'REVENUE' | 'AUTO';
  multiple_position: 'LOW' | 'MEDIAN' | 'HIGH' | 'CUSTOM';
  custom_multiple?: number;
  risk_factors?: RiskFactor[];
  manual_adjustments?: MultipleAdjustment[];
  weight?: number;
  weight_rationale?: string;
  /** NAICS code for industry-specific multiple validation */
  naics_code?: string;
  /** Justification for multiple selection (required for above-median) */
  multiple_justification?: string;
}

/**
 * Convert risk factors to multiple adjustments
 * Higher risk = lower multiple (negative adjustment)
 */
export function riskFactorsToAdjustments(riskFactors: RiskFactor[]): MultipleAdjustment[] {
  return riskFactors
    .filter(rf => rf.impact_on_multiple !== 0)
    .map(rf => ({
      factor: rf.category,
      adjustment_percentage: rf.impact_on_multiple,
      rationale: rf.description,
    }));
}

/**
 * Apply adjustments to base multiple
 * PRD-C: Uses industry ceiling instead of permissive baseMultiple * 2.0 clamp
 */
export function applyMultipleAdjustments(
  baseMultiple: number,
  adjustments: MultipleAdjustment[],
  steps: CalculationStep[],
  industryCeiling?: number
): { adjustedMultiple: number; appliedAdjustments: MultipleAdjustment[] } {
  let currentMultiple = baseMultiple;
  const appliedAdjustments: MultipleAdjustment[] = [];

  for (const adj of adjustments) {
    const factor = 1 + adj.adjustment_percentage;
    const newMultiple = currentMultiple * factor;

    steps.push(
      createStep(
        'Market',
        `Apply adjustment: ${adj.factor}`,
        `Multiple = ${formatMultiple(currentMultiple)} × (1 + ${formatPercentage(adj.adjustment_percentage)})`,
        {
          current_multiple: currentMultiple,
          adjustment: formatPercentage(adj.adjustment_percentage),
        },
        newMultiple
      )
    );

    currentMultiple = newMultiple;
    appliedAdjustments.push(adj);
  }

  // PRD-C: Clamp to industry ceiling when available, otherwise use reasonable fallback
  const MIN_MULTIPLE = 0.5;
  const maxMultiple = industryCeiling || (baseMultiple * 2.0);
  const finalMultiple = clamp(currentMultiple, MIN_MULTIPLE, maxMultiple);

  if (finalMultiple !== currentMultiple) {
    steps.push(
      createStep(
        'Market',
        industryCeiling ? 'Apply industry ceiling limit' : 'Apply multiple floor/ceiling',
        `Clamped to [${formatMultiple(MIN_MULTIPLE)}, ${formatMultiple(maxMultiple)}]${industryCeiling ? ' (industry ceiling)' : ''}`,
        { before_clamp: currentMultiple, after_clamp: finalMultiple, industry_ceiling: industryCeiling ?? 'N/A' },
        finalMultiple
      )
    );
  }

  return { adjustedMultiple: finalMultiple, appliedAdjustments };
}

/**
 * Calculate Market Approach value using Guideline Transaction Method
 */
export function calculateMarketApproach(inputs: MarketApproachInputs): MarketApproachCalculation {
  resetStepCounter();
  const steps: CalculationStep[] = [];
  const warnings: string[] = [];

  const sde = safeNumber(inputs.weighted_sde);
  const ebitda = safeNumber(inputs.weighted_ebitda);
  const revenue = safeNumber(inputs.revenue);

  // Select multiple type and corresponding data
  let multipleType: 'SDE' | 'EBITDA' | 'Revenue';
  let multipleRange: MultipleRange;
  let benefitStreamValue: number;

  if (inputs.multiple_preference === 'AUTO') {
    // Automatic selection based on business size
    if (sde < 1000000) {
      multipleType = 'SDE';
      multipleRange = inputs.sde_multiple;
      benefitStreamValue = sde;
    } else {
      multipleType = 'EBITDA';
      multipleRange = inputs.ebitda_multiple;
      benefitStreamValue = ebitda;
    }

    // Fallback to revenue if earnings are negative
    if (benefitStreamValue <= 0 && inputs.revenue_multiple) {
      multipleType = 'Revenue';
      multipleRange = inputs.revenue_multiple;
      benefitStreamValue = revenue;
      warnings.push('Using revenue multiple because earnings are negative or zero.');
    }
  } else if (inputs.multiple_preference === 'REVENUE') {
    if (!inputs.revenue_multiple) {
      throw new Error('Revenue multiple requested but not provided');
    }
    multipleType = 'Revenue';
    multipleRange = inputs.revenue_multiple;
    benefitStreamValue = revenue;
  } else {
    multipleType = inputs.multiple_preference;
    multipleRange = multipleType === 'SDE' ? inputs.sde_multiple : inputs.ebitda_multiple;
    benefitStreamValue = multipleType === 'SDE' ? sde : ebitda;
  }

  steps.push(
    createStep(
      'Market',
      `Select ${multipleType} multiple`,
      `Using ${multipleType} from ${multipleRange.source}`,
      {
        multiple_type: multipleType,
        benefit_stream: benefitStreamValue,
        source: multipleRange.source,
      },
      benefitStreamValue
    )
  );

  // Select base multiple based on position
  let baseMultiple: number;
  switch (inputs.multiple_position) {
    case 'LOW':
      baseMultiple = multipleRange.low;
      break;
    case 'HIGH':
      baseMultiple = multipleRange.high;
      break;
    case 'CUSTOM':
      if (inputs.custom_multiple === undefined) {
        throw new Error('Custom multiple selected but not provided');
      }
      baseMultiple = inputs.custom_multiple;
      break;
    case 'MEDIAN':
    default:
      baseMultiple = multipleRange.median;
  }

  steps.push(
    createStep(
      'Market',
      `Select base multiple (${inputs.multiple_position})`,
      `Base = ${formatMultiple(baseMultiple)} from [${formatMultiple(multipleRange.low)}, ${formatMultiple(multipleRange.median)}, ${formatMultiple(multipleRange.high)}]`,
      {
        low: multipleRange.low,
        median: multipleRange.median,
        high: multipleRange.high,
        selected: baseMultiple,
      },
      baseMultiple
    )
  );

  // Get adjustments
  let adjustments: MultipleAdjustment[];
  if (inputs.manual_adjustments && inputs.manual_adjustments.length > 0) {
    adjustments = inputs.manual_adjustments;
  } else if (inputs.risk_factors && inputs.risk_factors.length > 0) {
    adjustments = riskFactorsToAdjustments(inputs.risk_factors);
  } else {
    adjustments = [];
    warnings.push('No risk adjustments applied to market multiple.');
  }

  // PRD-C: Look up industry ceiling for the clamp
  let industryCeiling: number | undefined;
  if (inputs.naics_code) {
    try {
      const lookup = createMultiplesLookup();
      const range = lookup.getSDEMultipleRange(inputs.naics_code);
      if (range?.ceiling) {
        industryCeiling = range.ceiling;
      }
    } catch {
      // Fallback to no ceiling
    }
  }

  // Apply adjustments with industry ceiling
  const { adjustedMultiple, appliedAdjustments } = applyMultipleAdjustments(
    baseMultiple,
    adjustments,
    steps,
    industryCeiling
  );

  steps.push(
    createStep(
      'Market',
      'Final adjusted multiple',
      `Adjusted = ${formatMultiple(adjustedMultiple)}`,
      { base_multiple: baseMultiple, num_adjustments: appliedAdjustments.length },
      adjustedMultiple
    )
  );

  // CRITICAL: Validate multiple against industry ceiling
  // This prevents the $4.1M error (4.4x multiple was used instead of max 4.2x)
  let validatedMultiple = adjustedMultiple;
  if (inputs.naics_code && multipleType === 'SDE') {
    const validator = createMultipleValidator(inputs.naics_code);
    const validation = validator.validateSDEMultiple(
      adjustedMultiple,
      inputs.multiple_justification || ''
    );

    if (!validation.valid) {
      // Multiple exceeds ceiling - use ceiling instead
      const industryRange = validator.getIndustryRange();
      if (industryRange.sde?.ceiling) {
        validatedMultiple = industryRange.sde.ceiling;
        warnings.push(
          `CRITICAL: Multiple ${formatMultiple(adjustedMultiple)} exceeds industry ceiling ` +
            `of ${formatMultiple(industryRange.sde.ceiling)}. Using ceiling value to prevent overvaluation.`
        );
        steps.push(
          createStep(
            'Market',
            'Apply industry ceiling limit',
            `Multiple capped at ${formatMultiple(validatedMultiple)} (ceiling)`,
            {
              requested_multiple: adjustedMultiple,
              industry_ceiling: industryRange.sde.ceiling,
              rejection_reason: validation.rejection_reason || 'Exceeds industry ceiling',
            },
            validatedMultiple
          )
        );
      }
    } else {
      // Add any validation warnings
      warnings.push(...validation.warnings);
    }
  }

  // Calculate value using validated multiple
  const marketApproachValue = roundToThousand(benefitStreamValue * validatedMultiple);

  steps.push(
    createStep(
      'Market',
      'Calculate market approach value',
      'Value = Benefit Stream × Validated Multiple',
      { benefit_stream: benefitStreamValue, validated_multiple: validatedMultiple },
      marketApproachValue
    )
  );

  // Validate result
  if (marketApproachValue <= 0) {
    warnings.push(
      `Market approach value is ${formatCurrency(marketApproachValue)}. ` +
        `Check benefit stream and multiple inputs.`
    );
  }

  // Default weight for market approach (typically 40%)
  const weight = inputs.weight ?? 0.4;

  return {
    multiple_type: multipleType,
    base_multiple: baseMultiple,
    multiple_source: multipleRange.source,
    adjustments: appliedAdjustments,
    adjusted_multiple: validatedMultiple, // Use ceiling-validated multiple
    benefit_stream_value: benefitStreamValue,
    market_approach_value: marketApproachValue,
    weight,
    weight_rationale: inputs.weight_rationale,
    calculation_steps: steps,
    warnings,
  };
}

/**
 * Format market approach results as markdown
 */
export function formatMarketApproachTable(result: MarketApproachCalculation): string {
  const lines: string[] = [];

  lines.push('### Market Approach Calculation\n');
  lines.push(`**Multiple Type:** ${result.multiple_type}`);
  lines.push(`**Multiple Source:** ${result.multiple_source}`);
  lines.push(`**Base Multiple:** ${formatMultiple(result.base_multiple)}\n`);

  if (result.adjustments.length > 0) {
    lines.push('**Multiple Adjustments:**\n');
    lines.push('| Factor | Adjustment |');
    lines.push('|--------|------------|');
    for (const adj of result.adjustments) {
      const sign = adj.adjustment_percentage >= 0 ? '+' : '';
      lines.push(`| ${adj.factor} | ${sign}${formatPercentage(adj.adjustment_percentage)} |`);
    }
    lines.push('');
  }

  lines.push(`**Adjusted Multiple:** ${formatMultiple(result.adjusted_multiple)}`);
  lines.push(`**Benefit Stream Value:** ${formatCurrency(result.benefit_stream_value)}`);
  lines.push(`**Market Approach Value:** ${formatCurrency(result.market_approach_value)}`);
  lines.push(`**Weight Assigned:** ${(result.weight * 100).toFixed(0)}%`);

  if (result.weight_rationale) {
    lines.push(`\n*Rationale: ${result.weight_rationale}*`);
  }

  return lines.join('\n');
}
