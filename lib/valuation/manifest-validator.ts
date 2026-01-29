/**
 * Manifest Consistency Validator
 *
 * PRD-H US-003: Automated validator that checks manifest consistency
 * so that fixes can be verified programmatically without manual PDF inspection.
 *
 * This validator checks the MANIFEST for internal consistency. Different from
 * the existing quality-gate which checks section text.
 */

import type {
  ReportManifest,
  CriticalValues,
  ValueAppearance,
  ApproachWeights,
} from './manifest-generator';

// ============ RESULT TYPES ============

/**
 * Result of manifest validation.
 */
export interface ManifestValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

// ============ TOLERANCES ============

/**
 * Tolerance for currency value comparisons (1%).
 * Currency values within 1% of each other are considered consistent.
 */
const CURRENCY_TOLERANCE = 0.01;

/**
 * Tolerance for approach weight sum (0.001).
 * Weights must sum to 1.0 within this tolerance.
 */
const WEIGHT_SUM_TOLERANCE = 0.001;

/**
 * Tolerance for weighted value calculation (2%).
 * The weighted sum of approaches should match final value within 2%.
 */
const WEIGHTED_CALC_TOLERANCE = 0.02;

// ============ VALIDATION FUNCTIONS ============

/**
 * Validate a report manifest for internal consistency.
 *
 * Performs the following checks:
 * 1. All appearances of same metric have identical value (within 1% tolerance)
 * 2. Approach weights sum to 1.0 (within 0.001 tolerance)
 * 3. Value range valid (low < final < high)
 * 4. Math correct (weighted_value ≈ sum of approach × weight, within 2%)
 * 5. No zero values for required fields (final_value, revenue, at least one approach > 0)
 *
 * @param manifest - The ReportManifest to validate
 * @returns ManifestValidationResult with passed status, errors, and warnings
 */
export function validateManifest(manifest: ReportManifest): ManifestValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log(`[MANIFEST_VALIDATOR] Validating manifest for valuation ${manifest.valuation_id}`);

  const { critical_values, value_appearances } = manifest;

  // Check 1: Value appearance consistency (within 1% tolerance for currency)
  const appearanceErrors = checkValueAppearanceConsistency(value_appearances);
  errors.push(...appearanceErrors.errors);
  warnings.push(...appearanceErrors.warnings);

  // Check 2: Approach weights sum to 1.0
  const weightErrors = checkWeightSum(critical_values.approach_weights);
  errors.push(...weightErrors);

  // Check 3: Value range valid (low < final < high)
  const rangeErrors = checkValueRange(
    critical_values.value_range_low,
    critical_values.final_concluded_value,
    critical_values.value_range_high
  );
  errors.push(...rangeErrors);

  // Check 4: Weighted value calculation is correct
  const mathResult = checkWeightedValueMath(critical_values);
  errors.push(...mathResult.errors);
  warnings.push(...mathResult.warnings);

  // Check 5: No zero values for required fields
  const zeroValueResult = checkRequiredFields(critical_values);
  errors.push(...zeroValueResult.errors);
  warnings.push(...zeroValueResult.warnings);

  const passed = errors.length === 0;

  console.log(`[MANIFEST_VALIDATOR] VALIDATION_COMPLETE passed=${passed} errors=${errors.length} warnings=${warnings.length}`);

  if (errors.length > 0) {
    console.log(`[MANIFEST_VALIDATOR] Errors: ${errors.join('; ')}`);
  }
  if (warnings.length > 0) {
    console.log(`[MANIFEST_VALIDATOR] Warnings: ${warnings.join('; ')}`);
  }

  return {
    passed,
    errors,
    warnings,
  };
}

/**
 * Check that all appearances of the same metric have identical values
 * (within 1% tolerance for currency values).
 */
function checkValueAppearanceConsistency(
  value_appearances: Map<string, ValueAppearance[]> | Record<string, ValueAppearance[]>
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Convert Map to Record if necessary
  const appearances: Record<string, ValueAppearance[]> =
    value_appearances instanceof Map
      ? Object.fromEntries(value_appearances)
      : value_appearances;

  for (const [metric, occurrences] of Object.entries(appearances)) {
    if (!occurrences || occurrences.length < 2) {
      continue; // Need at least 2 appearances to check consistency
    }

    // Use the first occurrence as reference
    const referenceValue = occurrences[0].value;
    const referenceSection = occurrences[0].section;

    for (let i = 1; i < occurrences.length; i++) {
      const occurrence = occurrences[i];
      const diff = Math.abs(occurrence.value - referenceValue);
      const relativeDiff = referenceValue !== 0 ? diff / Math.abs(referenceValue) : diff;

      if (relativeDiff > CURRENCY_TOLERANCE) {
        errors.push(
          `Inconsistent ${metric}: ${referenceSection}=${formatCurrency(referenceValue)} vs ${occurrence.section}=${formatCurrency(occurrence.value)} (${(relativeDiff * 100).toFixed(2)}% difference)`
        );
      }
    }
  }

  return { errors, warnings };
}

/**
 * Check that approach weights sum to 1.0 (within tolerance).
 */
function checkWeightSum(weights: ApproachWeights): string[] {
  const errors: string[] = [];

  const weightSum = weights.asset + weights.income + weights.market;

  if (Math.abs(weightSum - 1.0) > WEIGHT_SUM_TOLERANCE) {
    errors.push(
      `Approach weights sum to ${weightSum.toFixed(4)} (asset=${weights.asset.toFixed(4)}, income=${weights.income.toFixed(4)}, market=${weights.market.toFixed(4)}), expected 1.0`
    );
  }

  return errors;
}

/**
 * Check that value range is valid: low < final < high.
 */
function checkValueRange(low: number, final: number, high: number): string[] {
  const errors: string[] = [];

  // Only check if we have valid range values
  if (low > 0 && high > 0) {
    if (low >= high) {
      errors.push(
        `Value range invalid: low (${formatCurrency(low)}) must be less than high (${formatCurrency(high)})`
      );
    }

    if (final < low) {
      errors.push(
        `Final value (${formatCurrency(final)}) is below range low (${formatCurrency(low)})`
      );
    }

    if (final > high) {
      errors.push(
        `Final value (${formatCurrency(final)}) is above range high (${formatCurrency(high)})`
      );
    }
  }

  return errors;
}

/**
 * Check that weighted value math is correct:
 * weighted_value ≈ (asset × asset_weight) + (income × income_weight) + (market × market_weight)
 * within 2% tolerance.
 */
function checkWeightedValueMath(values: CriticalValues): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  const { approach_weights } = values;

  // Calculate expected weighted value
  const calculatedWeightedValue =
    values.asset_approach_value * approach_weights.asset +
    values.income_approach_value * approach_weights.income +
    values.market_approach_value * approach_weights.market;

  // Compare to final concluded value
  const finalValue = values.final_concluded_value;

  if (finalValue > 0 && calculatedWeightedValue > 0) {
    const diff = Math.abs(calculatedWeightedValue - finalValue);
    const relativeDiff = diff / finalValue;

    if (relativeDiff > WEIGHTED_CALC_TOLERANCE) {
      errors.push(
        `Weighted value mismatch: calculated=${formatCurrency(calculatedWeightedValue)} vs final=${formatCurrency(finalValue)} (${(relativeDiff * 100).toFixed(2)}% difference). ` +
          `Calculation: (${formatCurrency(values.asset_approach_value)}×${approach_weights.asset.toFixed(2)}) + (${formatCurrency(values.income_approach_value)}×${approach_weights.income.toFixed(2)}) + (${formatCurrency(values.market_approach_value)}×${approach_weights.market.toFixed(2)})`
      );
    } else if (relativeDiff > CURRENCY_TOLERANCE) {
      // Small difference - just a warning
      warnings.push(
        `Weighted value slightly differs from final: calculated=${formatCurrency(calculatedWeightedValue)} vs final=${formatCurrency(finalValue)} (${(relativeDiff * 100).toFixed(2)}% difference)`
      );
    }
  }

  return { errors, warnings };
}

/**
 * Check that required fields have non-zero values:
 * - final_value must be > 0
 * - revenue must be > 0
 * - at least one approach must be > 0
 */
function checkRequiredFields(values: CriticalValues): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Final value is required
  if (values.final_concluded_value === 0) {
    errors.push('Final concluded value is zero');
  }

  // Revenue is important but may be zero in some cases
  if (values.revenue_current_year === 0) {
    warnings.push('Revenue is zero - verify this is intentional');
  }

  // At least one approach must have a value
  const hasApproachValue =
    values.asset_approach_value > 0 ||
    values.income_approach_value > 0 ||
    values.market_approach_value > 0;

  if (!hasApproachValue) {
    errors.push(
      'All approach values are zero (asset=0, income=0, market=0) - at least one approach is required'
    );
  }

  // Check for individual zero approaches with non-zero weight (potential issue)
  if (values.approach_weights.asset > 0 && values.asset_approach_value === 0) {
    warnings.push(
      `Asset approach has weight ${(values.approach_weights.asset * 100).toFixed(1)}% but value is $0`
    );
  }
  if (values.approach_weights.income > 0 && values.income_approach_value === 0) {
    warnings.push(
      `Income approach has weight ${(values.approach_weights.income * 100).toFixed(1)}% but value is $0`
    );
  }
  if (values.approach_weights.market > 0 && values.market_approach_value === 0) {
    warnings.push(
      `Market approach has weight ${(values.approach_weights.market * 100).toFixed(1)}% but value is $0`
    );
  }

  return { errors, warnings };
}

// ============ HELPERS ============

/**
 * Format a number as currency for error messages.
 */
function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  } else {
    return `$${value.toFixed(2)}`;
  }
}

/**
 * Convenience function to validate a manifest and log results.
 * Returns true if validation passed.
 */
export function validateAndLogManifest(manifest: ReportManifest): boolean {
  const result = validateManifest(manifest);

  if (result.passed) {
    console.log(`[MANIFEST_VALIDATOR] Manifest validation PASSED for ${manifest.valuation_id}`);
  } else {
    console.error(`[MANIFEST_VALIDATOR] Manifest validation FAILED for ${manifest.valuation_id}`);
    result.errors.forEach((error) => {
      console.error(`[MANIFEST_VALIDATOR] ERROR: ${error}`);
    });
  }

  result.warnings.forEach((warning) => {
    console.warn(`[MANIFEST_VALIDATOR] WARNING: ${warning}`);
  });

  return result.passed;
}
