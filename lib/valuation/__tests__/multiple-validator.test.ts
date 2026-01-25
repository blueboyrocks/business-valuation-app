/**
 * MultipleValidator Unit Tests
 * TDD: Tests written before implementation
 *
 * Critical for preventing the $4.1M error by validating selected multiples
 */
import { describe, it, expect } from 'vitest';
import {
  MultipleValidator,
  createMultipleValidator,
  ValidationResult,
} from '../multiple-validator';
import { KFACTOR_EXPECTED_SDE } from '../../test-utils/fixtures';

describe('MultipleValidator', () => {
  describe('validateSDEMultiple', () => {
    it('should accept reasonable multiple within range', () => {
      const validator = createMultipleValidator('541330'); // Engineering Services

      const result = validator.validateSDEMultiple(2.8, 'Strong financial performance');

      expect(result.valid).toBe(true);
      expect(result.rejection_reason).toBeUndefined();
    });

    it('should REJECT multiple of 4.4x that caused $4.1M error', () => {
      const validator = createMultipleValidator('541330');

      const result = validator.validateSDEMultiple(4.4, 'Exceptional company');

      expect(result.valid).toBe(false);
      expect(result.rejection_reason).toContain('ceiling');
    });

    it('should warn on multiple above typical range but below ceiling', () => {
      const validator = createMultipleValidator('541330');

      const result = validator.validateSDEMultiple(3.8, 'Strong performer');

      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('above');
    });

    it('should require justification for multiples above median', () => {
      const validator = createMultipleValidator('541330');

      // No justification
      const result1 = validator.validateSDEMultiple(3.2, '');
      expect(result1.warnings.some((w) => w.includes('justification'))).toBe(true);

      // With justification
      const result2 = validator.validateSDEMultiple(
        3.2,
        'Strong revenue growth of 36% YoY, government contracts, and diversified customer base'
      );
      expect(result2.valid).toBe(true);
    });
  });

  describe('K-Factor specific validation', () => {
    it('should accept 2.65x median multiple for K-Factor', () => {
      const validator = createMultipleValidator('541330');
      const sde = KFACTOR_EXPECTED_SDE.weighted_average_sde;

      const result = validator.validateSDEMultiple(2.65, 'Median industry multiple');
      const impliedValue = validator.calculateImpliedValue(sde, 2.65);

      expect(result.valid).toBe(true);
      expect(impliedValue).toBeCloseTo(sde * 2.65, -4);
    });

    it('should produce valuation in $2-3M range with 2.65x', () => {
      const validator = createMultipleValidator('541330');
      const sde = KFACTOR_EXPECTED_SDE.weighted_average_sde; // ~$1,062,715

      const result = validator.validateSDEMultiple(2.65, 'Median multiple');
      const impliedValue = validator.calculateImpliedValue(sde, 2.65);

      // $1,062,715 * 2.65 = $2,816,195
      expect(result.valid).toBe(true);
      expect(impliedValue).toBeGreaterThan(2_000_000);
      expect(impliedValue).toBeLessThan(3_500_000);
    });

    it('should reject multiple that would produce $4.1M valuation', () => {
      const validator = createMultipleValidator('541330');
      const sde = KFACTOR_EXPECTED_SDE.weighted_average_sde;

      // To get $4.1M, multiple would be ~3.86x
      const multipleFor4M = 4_100_000 / sde;

      const result = validator.validateSDEMultiple(
        multipleFor4M,
        'Test multiple'
      );

      // Should warn or fail since 3.86x is above typical range
      expect(result.warnings.length > 0 || !result.valid).toBe(true);
    });
  });

  describe('getRecommendedMultiple', () => {
    it('should recommend median multiple by default', () => {
      const validator = createMultipleValidator('541330');

      const recommendation = validator.getRecommendedMultiple({});

      expect(recommendation.sde_multiple).toBeCloseTo(2.65, 2);
    });

    it('should recommend higher multiple for strong growth', () => {
      const validator = createMultipleValidator('541330');

      const recommendation = validator.getRecommendedMultiple({
        revenue_growth_rate: 0.36, // K-Factor's actual growth
      });

      expect(recommendation.sde_multiple).toBeGreaterThan(2.65);
      expect(recommendation.sde_multiple).toBeLessThanOrEqual(3.5);
    });

    it('should cap recommendation at industry ceiling', () => {
      const validator = createMultipleValidator('541330');

      const recommendation = validator.getRecommendedMultiple({
        revenue_growth_rate: 0.50,
        profit_margin: 0.25,
        customer_concentration: 0.10, // Very low concentration
      });

      expect(recommendation.sde_multiple).toBeLessThanOrEqual(4.2); // Ceiling
    });
  });

  describe('calculateImpliedValue', () => {
    it('should calculate correct implied value', () => {
      const validator = createMultipleValidator('541330');

      const implied = validator.calculateImpliedValue(
        1_062_715, // SDE
        2.65 // Multiple
      );

      expect(implied).toBeCloseTo(2_816_195, -3);
    });
  });

  describe('validateValueRange', () => {
    it('should accept value in expected range', () => {
      const validator = createMultipleValidator('541330');

      const result = validator.validateValueRange(
        2_500_000,
        1_062_715, // SDE
        { low: 2_000_000, high: 3_000_000 }
      );

      expect(result.valid).toBe(true);
    });

    it('should flag value significantly above expected range', () => {
      const validator = createMultipleValidator('541330');

      const result = validator.validateValueRange(
        4_100_000, // The erroneous value
        1_062_715,
        { low: 2_000_000, high: 3_000_000 }
      );

      expect(result.valid).toBe(false);
      expect(result.variance_pct).toBeGreaterThan(0.30); // >30% above high
    });
  });

  describe('edge cases', () => {
    it('should handle unknown industry codes', () => {
      const validator = createMultipleValidator('999999');

      const result = validator.validateSDEMultiple(3.0, 'Test');

      expect(result.valid).toBe(true);
      expect(result.warnings.some((w) => w.includes('unknown'))).toBe(true);
    });

    it('should reject negative multiples', () => {
      const validator = createMultipleValidator('541330');

      const result = validator.validateSDEMultiple(-1.0, 'Test');

      expect(result.valid).toBe(false);
    });

    it('should reject zero multiple', () => {
      const validator = createMultipleValidator('541330');

      const result = validator.validateSDEMultiple(0, 'Test');

      expect(result.valid).toBe(false);
    });
  });
});
