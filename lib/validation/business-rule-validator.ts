/**
 * Business Rule Validator
 *
 * Validates report values against business rules and industry-specific ranges.
 * Catches logically impossible results before they reach the PDF.
 *
 * Rules:
 * 1. SDE multiple within industry range
 * 2. Asset approach > $0 when total_assets > $0
 * 3. Approach weights sum to 100%
 * 4. Value range spread between 10% and 50%
 * 5. Final value must be positive
 * 6. Cap rate between 5% and 60%
 */

import type { ValuationDataAccessor } from '../valuation/data-accessor';

// ============ TYPES ============

export interface BusinessRuleResult {
  rule: string;
  passed: boolean;
  severity: 'error' | 'warning';
  message: string;
  details?: string;
}

export interface BusinessRuleValidation {
  passed: boolean;
  results: BusinessRuleResult[];
  errors: string[];
  warnings: string[];
}

// ============ INDUSTRY MULTIPLE RANGES ============

interface MultipleRange {
  low: number;
  high: number;
}

const INDUSTRY_SDE_MULTIPLE_RANGES: Record<string, MultipleRange> = {
  'Engineering Services': { low: 2.0, high: 3.5 },
  'Professional Services': { low: 2.0, high: 4.0 },
  'Manufacturing': { low: 2.5, high: 5.0 },
  'Retail': { low: 1.5, high: 3.0 },
  'Restaurant': { low: 1.5, high: 3.0 },
  'Healthcare': { low: 2.5, high: 5.0 },
  'Technology': { low: 3.0, high: 8.0 },
  'Construction': { low: 2.0, high: 3.5 },
  'Transportation': { low: 2.0, high: 4.0 },
  'default': { low: 1.5, high: 5.0 },
};

// ============ HELPERS ============

/**
 * Look up the SDE multiple range for a given industry name.
 * Matches by checking if the industry name contains a known key (case-insensitive).
 * Falls back to 'default' if no match is found.
 */
function getIndustryRange(industryName: string): MultipleRange {
  const lower = industryName.toLowerCase();
  const keys = Object.keys(INDUSTRY_SDE_MULTIPLE_RANGES);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (key === 'default') continue;
    if (lower.includes(key.toLowerCase())) {
      return INDUSTRY_SDE_MULTIPLE_RANGES[key];
    }
  }
  return INDUSTRY_SDE_MULTIPLE_RANGES['default'];
}

// ============ INDIVIDUAL RULE CHECKS ============

/**
 * Rule 1: SDE multiple within industry range.
 * Warning if outside range. Error if > 1.5x the max.
 */
function checkSDEMultiple(accessor: ValuationDataAccessor): BusinessRuleResult {
  const sdeMultiple = accessor.getSDEMultiple();
  const industryName = accessor.getIndustryName();
  const range = getIndustryRange(industryName);

  if (sdeMultiple > range.high * 1.5) {
    return {
      rule: 'SDE Multiple in Industry Range',
      passed: false,
      severity: 'error',
      message: `SDE multiple ${sdeMultiple.toFixed(2)}x exceeds 1.5x the industry maximum (${(range.high * 1.5).toFixed(2)}x) for ${industryName}`,
      details: `Expected range: ${range.low.toFixed(2)}x - ${range.high.toFixed(2)}x`,
    };
  }

  if (sdeMultiple < range.low || sdeMultiple > range.high) {
    return {
      rule: 'SDE Multiple in Industry Range',
      passed: true,
      severity: 'warning',
      message: `SDE multiple ${sdeMultiple.toFixed(2)}x is outside typical range of ${range.low.toFixed(2)}x - ${range.high.toFixed(2)}x for ${industryName}`,
    };
  }

  return {
    rule: 'SDE Multiple in Industry Range',
    passed: true,
    severity: 'warning',
    message: `SDE multiple ${sdeMultiple.toFixed(2)}x is within industry range`,
  };
}

/**
 * Rule 2: Asset approach > $0 when total_assets > $0.
 */
function checkAssetApproachPositive(accessor: ValuationDataAccessor): BusinessRuleResult {
  const totalAssets = accessor.getTotalAssets();
  const assetValue = accessor.getApproachValue('asset');

  if (totalAssets > 0 && assetValue <= 0) {
    return {
      rule: 'Asset Approach Positive',
      passed: false,
      severity: 'error',
      message: `Asset approach value is $0 but total assets are ${accessor.getFormattedTotalAssets()}`,
      details: 'A company with positive assets must have a positive asset approach value',
    };
  }

  return {
    rule: 'Asset Approach Positive',
    passed: true,
    severity: 'warning',
    message: 'Asset approach value is consistent with total assets',
  };
}

/**
 * Rule 3: Approach weights sum to 100% (within 1% tolerance).
 */
function checkWeightsSum(accessor: ValuationDataAccessor): BusinessRuleResult {
  const assetWeight = accessor.getApproachWeight('asset');
  const incomeWeight = accessor.getApproachWeight('income');
  const marketWeight = accessor.getApproachWeight('market');
  const total = assetWeight + incomeWeight + marketWeight;

  // Weights are stored as decimals (0.40 = 40%), so sum should be ~1.0
  if (Math.abs(total - 1.0) > 0.01) {
    return {
      rule: 'Approach Weights Sum to 100%',
      passed: false,
      severity: 'error',
      message: `Approach weights sum to ${(total * 100).toFixed(1)}% instead of 100%`,
      details: `Asset: ${(assetWeight * 100).toFixed(1)}%, Income: ${(incomeWeight * 100).toFixed(1)}%, Market: ${(marketWeight * 100).toFixed(1)}%`,
    };
  }

  return {
    rule: 'Approach Weights Sum to 100%',
    passed: true,
    severity: 'warning',
    message: 'Approach weights sum to 100%',
  };
}

/**
 * Rule 4: Value range spread between 10% and 50%.
 * Spread = (high - low) / finalValue.
 */
function checkValueRangeSpread(accessor: ValuationDataAccessor): BusinessRuleResult {
  const finalValue = accessor.getFinalValue();
  const range = accessor.getValueRange();

  if (finalValue <= 0) {
    // Can't check range if final value is not positive
    return {
      rule: 'Value Range Spread',
      passed: true,
      severity: 'warning',
      message: 'Cannot check value range spread: final value is not positive',
    };
  }

  const spread = (range.high - range.low) / finalValue;

  if (spread < 0.10) {
    return {
      rule: 'Value Range Spread',
      passed: true,
      severity: 'warning',
      message: `Value range spread is ${(spread * 100).toFixed(1)}%, which is narrower than typical 10% minimum`,
      details: `Range: ${accessor.getFormattedValueRange().display}`,
    };
  }

  if (spread > 0.50) {
    return {
      rule: 'Value Range Spread',
      passed: true,
      severity: 'warning',
      message: `Value range spread is ${(spread * 100).toFixed(1)}%, which is wider than typical 50% maximum`,
      details: `Range: ${accessor.getFormattedValueRange().display}`,
    };
  }

  return {
    rule: 'Value Range Spread',
    passed: true,
    severity: 'warning',
    message: `Value range spread of ${(spread * 100).toFixed(1)}% is within expected bounds`,
  };
}

/**
 * Rule 5: Final value must be positive.
 */
function checkFinalValuePositive(accessor: ValuationDataAccessor): BusinessRuleResult {
  const finalValue = accessor.getFinalValue();

  if (finalValue <= 0) {
    return {
      rule: 'Final Value Positive',
      passed: false,
      severity: 'error',
      message: `Final value is ${accessor.getFormattedFinalValue()} - must be positive`,
    };
  }

  return {
    rule: 'Final Value Positive',
    passed: true,
    severity: 'warning',
    message: `Final value of ${accessor.getFormattedFinalValue()} is positive`,
  };
}

/**
 * Rule 6: Cap rate between 5% and 60%.
 * Error if outside 5%-60%. Warning if outside 10%-50%.
 */
function checkCapRate(accessor: ValuationDataAccessor): BusinessRuleResult {
  const capRate = accessor.getCapRate(); // decimal, e.g. 0.25 = 25%
  const capRatePct = capRate * 100;

  if (capRate < 0.05 || capRate > 0.60) {
    return {
      rule: 'Cap Rate in Range',
      passed: false,
      severity: 'error',
      message: `Cap rate of ${capRatePct.toFixed(1)}% is outside acceptable range of 5% - 60%`,
    };
  }

  if (capRate < 0.10 || capRate > 0.50) {
    return {
      rule: 'Cap Rate in Range',
      passed: true,
      severity: 'warning',
      message: `Cap rate of ${capRatePct.toFixed(1)}% is outside typical range of 10% - 50%`,
    };
  }

  return {
    rule: 'Cap Rate in Range',
    passed: true,
    severity: 'warning',
    message: `Cap rate of ${capRatePct.toFixed(1)}% is within typical range`,
  };
}

// ============ MAIN VALIDATOR ============

/**
 * Validate business rules against the DataAccessor.
 * Returns structured result with errors (blocking) and warnings (advisory).
 */
export function validateBusinessRules(accessor: ValuationDataAccessor): BusinessRuleValidation {
  const results: BusinessRuleResult[] = [
    checkSDEMultiple(accessor),
    checkAssetApproachPositive(accessor),
    checkWeightsSum(accessor),
    checkValueRangeSpread(accessor),
    checkFinalValuePositive(accessor),
    checkCapRate(accessor),
  ];

  const errors: string[] = [];
  const warnings: string[] = [];

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (!r.passed && r.severity === 'error') {
      errors.push(r.message);
    } else if (!r.passed || r.severity === 'warning') {
      // Collect warnings from both failed-warnings and passed-with-warning-messages
      // that indicate out-of-range conditions
      if (!r.passed) {
        warnings.push(r.message);
      }
    }
  }

  // Also collect advisory warnings (rules that passed but flagged something outside typical range)
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.passed && r.severity === 'warning' && r.message.includes('outside')) {
      warnings.push(r.message);
    }
  }

  const passed = errors.length === 0;

  return {
    passed,
    results,
    errors,
    warnings,
  };
}
