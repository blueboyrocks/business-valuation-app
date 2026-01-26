/**
 * IndustryMultiplesLookup Unit Tests
 * TDD: Tests written before implementation
 *
 * Critical for fixing the $4.1M valuation error
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  IndustryMultiplesLookup,
  createMultiplesLookup,
  MultipleRange,
} from '../industry-multiples-lookup';

describe('IndustryMultiplesLookup', () => {
  let lookup: IndustryMultiplesLookup;

  beforeEach(() => {
    lookup = createMultiplesLookup();
  });

  describe('Engineering Services (541330)', () => {
    it('should return correct SDE multiple range for engineering services', () => {
      const range = lookup.getSDEMultipleRange('541330');

      expect(range).toBeTruthy();
      expect(range!.low).toBe(2.0);
      expect(range!.median).toBeCloseTo(2.65, 2);
      expect(range!.high).toBe(3.5);
    });

    it('should return correct EBITDA multiple range for engineering services', () => {
      const range = lookup.getEBITDAMultipleRange('541330');

      expect(range).toBeTruthy();
      expect(range!.low).toBe(3.0);
      expect(range!.high).toBe(6.0);
    });

    it('should return correct revenue multiple range for engineering services', () => {
      const range = lookup.getRevenueMultipleRange('541330');

      expect(range).toBeTruthy();
      expect(range!.low).toBe(0.30);
      expect(range!.high).toBe(0.60);
    });

    it('should calculate hard ceiling as high * 1.2', () => {
      const ceiling = lookup.getSDEMultipleCeiling('541330');

      // 3.5 * 1.2 = 4.2
      expect(ceiling).toBe(4.2);
    });
  });

  describe('industry lookup by NAICS code', () => {
    it('should find industry by exact NAICS code', () => {
      const industry = lookup.getIndustryByNAICS('541330');

      expect(industry).toBeTruthy();
      expect(industry!.industry_name).toBe('Engineering Services');
    });

    it('should return null for unknown NAICS code', () => {
      const industry = lookup.getIndustryByNAICS('999999');

      expect(industry).toBeNull();
    });

    it('should find industry by partial NAICS (first 4 digits)', () => {
      // 541330 should match 5413
      const industry = lookup.getIndustryByPartialNAICS('5413');

      expect(industry).toBeTruthy();
    });
  });

  describe('multiple validation', () => {
    it('should validate multiple within range', () => {
      const result = lookup.validateSDEMultiple('541330', 2.5);

      expect(result.valid).toBe(true);
      expect(result.within_typical_range).toBe(true);
    });

    it('should flag multiple above range but below ceiling', () => {
      const result = lookup.validateSDEMultiple('541330', 3.8);

      expect(result.valid).toBe(true);
      expect(result.within_typical_range).toBe(false);
      expect(result.warning).toBeTruthy();
    });

    it('should reject multiple above ceiling', () => {
      const result = lookup.validateSDEMultiple('541330', 4.5);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('ceiling');
    });

    it('should reject multiple of 4.4x for engineering (caused $4.1M error)', () => {
      const result = lookup.validateSDEMultiple('541330', 4.4);

      expect(result.valid).toBe(false);
    });

    it('should accept multiple of 2.8x for engineering (reasonable)', () => {
      const result = lookup.validateSDEMultiple('541330', 2.8);

      expect(result.valid).toBe(true);
      expect(result.within_typical_range).toBe(true);
    });
  });

  describe('recommended multiple calculation', () => {
    it('should recommend median multiple by default', () => {
      const recommendation = lookup.getRecommendedMultiple('541330', {});

      expect(recommendation.sde_multiple).toBeCloseTo(2.65, 2);
      expect(recommendation.position).toBe('median');
    });

    it('should adjust multiple upward for high growth', () => {
      const recommendation = lookup.getRecommendedMultiple('541330', {
        revenue_growth_rate: 0.30, // 30% growth
      });

      expect(recommendation.sde_multiple).toBeGreaterThan(2.65);
      expect(recommendation.sde_multiple).toBeLessThanOrEqual(3.5);
    });

    it('should adjust multiple downward for high risk', () => {
      const recommendation = lookup.getRecommendedMultiple('541330', {
        risk_score: 70, // High risk
      });

      expect(recommendation.sde_multiple).toBeLessThan(2.65);
      expect(recommendation.sde_multiple).toBeGreaterThanOrEqual(2.0);
    });

    it('should not exceed ceiling even with positive factors', () => {
      const recommendation = lookup.getRecommendedMultiple('541330', {
        revenue_growth_rate: 0.50,
        profit_margin: 0.30,
        customer_concentration: 0.10, // Low concentration (good)
      });

      expect(recommendation.sde_multiple).toBeLessThanOrEqual(4.2); // Ceiling
    });
  });

  describe('other industries', () => {
    it('should return higher multiples for software companies', () => {
      const range = lookup.getSDEMultipleRange('541511');

      expect(range).toBeTruthy();
      expect(range!.median).toBeGreaterThan(3.0);
    });

    it('should return correct range for restaurants', () => {
      const range = lookup.getSDEMultipleRange('722511');

      expect(range).toBeTruthy();
      expect(range!.low).toBeCloseTo(2.5, 1);
      expect(range!.high).toBeCloseTo(3.5, 1);
    });

    it('should return higher multiples for SaaS companies', () => {
      const range = lookup.getSDEMultipleRange('511210');

      expect(range).toBeTruthy();
      expect(range!.median).toBeGreaterThan(5.0);
    });
  });

  describe('all industries', () => {
    it('should have SDE multiple ranges for all industries', () => {
      const allIndustries = lookup.getAllIndustries();

      for (const industry of allIndustries) {
        const range = lookup.getSDEMultipleRange(industry.naics_code);
        expect(range, `Missing SDE range for ${industry.industry_name}`).toBeTruthy();
        expect(range!.low, `Invalid low for ${industry.industry_name}`).toBeGreaterThan(0);
        expect(range!.high, `Invalid high for ${industry.industry_name}`).toBeGreaterThan(range!.low);
      }
    });
  });
});
