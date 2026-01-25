/**
 * MultipleValidator - Validates Valuation Multiples
 *
 * This module validates selected multiples against industry ranges.
 * CRITICAL: This is the key fix for the $4.1M valuation error.
 *
 * Key features:
 * - Validates multiples against industry ranges
 * - Enforces hard ceilings
 * - Requires justification for above-median multiples
 * - Calculates implied values
 */

import {
  IndustryMultiplesLookup,
  createMultiplesLookup,
  CompanyFactors,
  MultipleRecommendation,
} from './industry-multiples-lookup';

// ============ TYPES ============

export interface ValidationResult {
  valid: boolean;
  rejection_reason?: string;
  warnings: string[];
  implied_value?: number;
  multiple_position?: 'below_range' | 'within_range' | 'above_range' | 'above_ceiling';
  suggested_range?: { low: number; high: number };
}

export interface ValueRangeValidationResult {
  valid: boolean;
  variance_pct: number;
  message: string;
}

// ============ VALIDATOR CLASS ============

export class MultipleValidator {
  private readonly naicsCode: string;
  private readonly lookup: IndustryMultiplesLookup;

  constructor(naicsCode: string) {
    this.naicsCode = naicsCode;
    this.lookup = createMultiplesLookup();
  }

  /**
   * Validate an SDE multiple
   */
  validateSDEMultiple(multiple: number, justification: string): ValidationResult {
    const warnings: string[] = [];

    // Basic validation
    if (multiple <= 0) {
      return {
        valid: false,
        rejection_reason: 'Multiple must be greater than zero',
        warnings: [],
      };
    }

    // Get industry range
    const range = this.lookup.getSDEMultipleRange(this.naicsCode);

    if (!range) {
      warnings.push(
        `Warning: Industry data unknown for NAICS ${this.naicsCode}. Using general validation rules.`
      );
      // Use general validation for unknown industries
      if (multiple > 10) {
        return {
          valid: false,
          rejection_reason: `Multiple of ${multiple.toFixed(2)}x exceeds reasonable maximum for most industries`,
          warnings,
        };
      }
      return { valid: true, warnings };
    }

    // Check against ceiling (HARD LIMIT)
    if (multiple > range.ceiling) {
      return {
        valid: false,
        rejection_reason: `Multiple of ${multiple.toFixed(2)}x exceeds hard ceiling of ${range.ceiling.toFixed(2)}x for ${this.getIndustryName()}`,
        warnings,
        multiple_position: 'above_ceiling',
        suggested_range: { low: range.low, high: range.high },
      };
    }

    // Check against typical range
    let multiplePosition: ValidationResult['multiple_position'] = 'within_range';

    if (multiple > range.high) {
      multiplePosition = 'above_range';
      warnings.push(
        `Multiple of ${multiple.toFixed(2)}x is above typical range of ${range.low.toFixed(2)}x-${range.high.toFixed(2)}x for ${this.getIndustryName()}`
      );
    } else if (multiple < range.low) {
      multiplePosition = 'below_range';
      warnings.push(
        `Multiple of ${multiple.toFixed(2)}x is below typical range of ${range.low.toFixed(2)}x-${range.high.toFixed(2)}x for ${this.getIndustryName()}`
      );
    }

    // Require justification for above-median multiples
    if (multiple > range.median && (!justification || justification.trim().length < 20)) {
      warnings.push(
        `Multiple of ${multiple.toFixed(2)}x is above median (${range.median.toFixed(2)}x). Provide detailed justification for this premium.`
      );
    }

    return {
      valid: true,
      warnings,
      multiple_position: multiplePosition,
      suggested_range: { low: range.low, high: range.high },
    };
  }

  /**
   * Get recommended multiple based on company factors
   */
  getRecommendedMultiple(factors: CompanyFactors): MultipleRecommendation {
    return this.lookup.getRecommendedMultiple(this.naicsCode, factors);
  }

  /**
   * Calculate implied value from SDE and multiple
   */
  calculateImpliedValue(sde: number, multiple: number): number {
    return sde * multiple;
  }

  /**
   * Validate that a value falls within expected range
   */
  validateValueRange(
    value: number,
    sde: number,
    expectedRange: { low: number; high: number }
  ): ValueRangeValidationResult {
    if (value < expectedRange.low) {
      const variancePct = (expectedRange.low - value) / expectedRange.low;
      return {
        valid: false,
        variance_pct: -variancePct,
        message: `Value of $${value.toLocaleString()} is ${(variancePct * 100).toFixed(1)}% below expected minimum of $${expectedRange.low.toLocaleString()}`,
      };
    }

    if (value > expectedRange.high) {
      const variancePct = (value - expectedRange.high) / expectedRange.high;
      return {
        valid: false,
        variance_pct: variancePct,
        message: `Value of $${value.toLocaleString()} is ${(variancePct * 100).toFixed(1)}% above expected maximum of $${expectedRange.high.toLocaleString()}`,
      };
    }

    const midpoint = (expectedRange.low + expectedRange.high) / 2;
    const variancePct = (value - midpoint) / midpoint;

    return {
      valid: true,
      variance_pct: variancePct,
      message: `Value of $${value.toLocaleString()} is within expected range`,
    };
  }

  /**
   * Get the industry name
   */
  getIndustryName(): string {
    const industry = this.lookup.getIndustryByNAICS(this.naicsCode);
    return industry?.industry_name || `Industry ${this.naicsCode}`;
  }

  /**
   * Get the full industry multiple range
   */
  getIndustryRange() {
    return {
      sde: this.lookup.getSDEMultipleRange(this.naicsCode),
      ebitda: this.lookup.getEBITDAMultipleRange(this.naicsCode),
      revenue: this.lookup.getRevenueMultipleRange(this.naicsCode),
    };
  }

  /**
   * Validate a complete market approach calculation
   */
  validateMarketApproach(params: {
    sde: number;
    selected_multiple: number;
    justification: string;
    calculated_value: number;
  }): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate the multiple
    const multipleResult = this.validateSDEMultiple(params.selected_multiple, params.justification);

    if (!multipleResult.valid) {
      errors.push(multipleResult.rejection_reason || 'Invalid multiple');
    }

    warnings.push(...multipleResult.warnings);

    // Verify the calculation
    const expectedValue = params.sde * params.selected_multiple;
    const calcDiff = Math.abs(params.calculated_value - expectedValue) / expectedValue;

    if (calcDiff > 0.001) {
      // >0.1% difference
      errors.push(
        `Calculation error: Expected $${expectedValue.toLocaleString()}, got $${params.calculated_value.toLocaleString()}`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

// ============ FACTORY FUNCTION ============

/**
 * Create a new MultipleValidator
 */
export function createMultipleValidator(naicsCode: string): MultipleValidator {
  return new MultipleValidator(naicsCode);
}
