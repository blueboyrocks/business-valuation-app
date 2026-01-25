/**
 * VarianceAnalyzer Unit Tests
 * TDD: Tests written before implementation
 *
 * Critical for detecting valuation discrepancies and requiring reconciliation
 * when our valuation differs significantly from prior valuations.
 */
import { describe, it, expect } from 'vitest';
import {
  VarianceAnalyzer,
  createVarianceAnalyzer,
  PriorValuation,
  VarianceAnalysisResult,
  VarianceSeverity,
} from '../variance-analyzer';
import { KFACTOR_EXPECTED_VALUATION } from '../../test-utils/fixtures';

describe('VarianceAnalyzer', () => {
  describe('analyzeVariance', () => {
    it('should flag variance >25% as WARNING', () => {
      const analyzer = createVarianceAnalyzer();
      const priorValuation: PriorValuation = {
        source: 'BizEquity',
        value: 2_000_000,
        date: '2024-06-15',
        methodology: 'Automated valuation model',
      };

      // Our value: $2,700,000 (35% higher than $2M)
      const result = analyzer.analyzeVariance(2_700_000, priorValuation);

      expect(result.variance_percentage).toBeCloseTo(0.35, 2);
      expect(result.severity).toBe(VarianceSeverity.WARNING);
      expect(result.requires_reconciliation).toBe(true);
    });

    it('should flag variance >50% as CRITICAL', () => {
      const analyzer = createVarianceAnalyzer();
      const priorValuation: PriorValuation = {
        source: 'BizEquity',
        value: 2_000_000,
        date: '2024-06-15',
        methodology: 'Automated valuation model',
      };

      // Our value: $4,100,000 (105% higher - the error case!)
      const result = analyzer.analyzeVariance(4_100_000, priorValuation);

      expect(result.variance_percentage).toBeCloseTo(1.05, 2);
      expect(result.severity).toBe(VarianceSeverity.CRITICAL);
      expect(result.requires_reconciliation).toBe(true);
      expect(result.reconciliation_required_reason).toContain('exceeds');
    });

    it('should accept variance <25% as ACCEPTABLE', () => {
      const analyzer = createVarianceAnalyzer();
      const priorValuation: PriorValuation = {
        source: 'BizEquity',
        value: 2_000_000,
        date: '2024-06-15',
        methodology: 'Automated valuation model',
      };

      // Our value: $2,200,000 (10% higher)
      const result = analyzer.analyzeVariance(2_200_000, priorValuation);

      expect(result.variance_percentage).toBeCloseTo(0.10, 2);
      expect(result.severity).toBe(VarianceSeverity.ACCEPTABLE);
      expect(result.requires_reconciliation).toBe(false);
    });

    it('should handle negative variance (our value is lower)', () => {
      const analyzer = createVarianceAnalyzer();
      const priorValuation: PriorValuation = {
        source: 'Industry Report',
        value: 3_000_000,
        date: '2024-06-15',
        methodology: 'Comparable transactions',
      };

      // Our value: $2,000,000 (33% lower)
      const result = analyzer.analyzeVariance(2_000_000, priorValuation);

      expect(result.variance_percentage).toBeCloseTo(-0.333, 2);
      expect(result.severity).toBe(VarianceSeverity.WARNING);
      expect(result.direction).toBe('lower');
    });

    it('should handle exact match', () => {
      const analyzer = createVarianceAnalyzer();
      const priorValuation: PriorValuation = {
        source: 'Prior Appraisal',
        value: 2_500_000,
        date: '2024-01-15',
        methodology: 'Full appraisal',
      };

      const result = analyzer.analyzeVariance(2_500_000, priorValuation);

      expect(result.variance_percentage).toBe(0);
      expect(result.severity).toBe(VarianceSeverity.ACCEPTABLE);
      expect(result.requires_reconciliation).toBe(false);
    });
  });

  describe('analyzeMultiplePriorValuations', () => {
    it('should analyze multiple prior valuations', () => {
      const analyzer = createVarianceAnalyzer();
      const priorValuations: PriorValuation[] = [
        {
          source: 'BizEquity',
          value: 2_000_000,
          date: '2024-06-15',
          methodology: 'AVM',
        },
        {
          source: 'Industry Benchmark',
          value: 2_500_000,
          date: '2024-03-01',
          methodology: 'Rule of thumb',
        },
      ];

      // Our value: $2,800,000
      const results = analyzer.analyzeMultiplePriorValuations(
        2_800_000,
        priorValuations
      );

      expect(results.length).toBe(2);
      expect(results[0].prior_source).toBe('BizEquity');
      expect(results[1].prior_source).toBe('Industry Benchmark');
    });

    it('should identify the most severe variance', () => {
      const analyzer = createVarianceAnalyzer();
      const priorValuations: PriorValuation[] = [
        { source: 'Source A', value: 2_800_000, date: '2024-01-01', methodology: 'M1' },
        { source: 'Source B', value: 2_000_000, date: '2024-01-01', methodology: 'M2' },
        { source: 'Source C', value: 3_200_000, date: '2024-01-01', methodology: 'M3' },
      ];

      // Our value: $4,100,000 (highest variance from Source B)
      const results = analyzer.analyzeMultiplePriorValuations(
        4_100_000,
        priorValuations
      );

      const maxSeverity = analyzer.getMaxSeverity(results);
      expect(maxSeverity).toBe(VarianceSeverity.CRITICAL);
    });
  });

  describe('K-Factor reconciliation', () => {
    it('should flag K-Factor $4.1M vs BizEquity $2.0M as CRITICAL', () => {
      const analyzer = createVarianceAnalyzer();
      const bizequityValuation: PriorValuation = {
        source: 'BizEquity',
        value: KFACTOR_EXPECTED_VALUATION.bizequity_value, // $2,000,000
        date: '2024-06-15',
        methodology: 'Automated Valuation Model (AVM)',
      };

      // The erroneous $4.1M valuation
      const result = analyzer.analyzeVariance(4_100_000, bizequityValuation);

      expect(result.severity).toBe(VarianceSeverity.CRITICAL);
      expect(result.variance_percentage).toBeGreaterThan(0.50);
      expect(result.requires_reconciliation).toBe(true);
    });

    it('should accept K-Factor $2.8M vs BizEquity $2.0M with WARNING', () => {
      const analyzer = createVarianceAnalyzer();
      const bizequityValuation: PriorValuation = {
        source: 'BizEquity',
        value: KFACTOR_EXPECTED_VALUATION.bizequity_value,
        date: '2024-06-15',
        methodology: 'Automated Valuation Model (AVM)',
      };

      // The corrected valuation (~$2.8M)
      const result = analyzer.analyzeVariance(2_800_000, bizequityValuation);

      expect(result.severity).toBe(VarianceSeverity.WARNING);
      expect(result.variance_percentage).toBeCloseTo(0.40, 2);
      expect(result.requires_reconciliation).toBe(true);
    });

    it('should accept K-Factor $2.5M vs BizEquity $2.0M as WARNING (within 25%)', () => {
      const analyzer = createVarianceAnalyzer();
      const bizequityValuation: PriorValuation = {
        source: 'BizEquity',
        value: KFACTOR_EXPECTED_VALUATION.bizequity_value,
        date: '2024-06-15',
        methodology: 'Automated Valuation Model (AVM)',
      };

      // A value in the middle of expected range
      const result = analyzer.analyzeVariance(2_500_000, bizequityValuation);

      expect(result.severity).toBe(VarianceSeverity.WARNING);
      expect(result.variance_percentage).toBeCloseTo(0.25, 2);
    });
  });

  describe('generateReconciliationNarrative', () => {
    it('should generate reconciliation narrative for variance', () => {
      const analyzer = createVarianceAnalyzer();
      const priorValuation: PriorValuation = {
        source: 'BizEquity',
        value: 2_000_000,
        date: '2024-06-15',
        methodology: 'Automated Valuation Model',
      };

      const result = analyzer.analyzeVariance(2_800_000, priorValuation);
      const narrative = analyzer.generateReconciliationNarrative(result);

      expect(narrative).toContain('BizEquity');
      expect(narrative).toContain('$2,000,000');
      expect(narrative).toContain('$2,800,000');
      expect(narrative).toContain('40'); // percentage
    });

    it('should explain reasons for variance in narrative', () => {
      const analyzer = createVarianceAnalyzer();
      const priorValuation: PriorValuation = {
        source: 'BizEquity',
        value: 2_000_000,
        date: '2024-06-15',
        methodology: 'AVM',
      };

      const result = analyzer.analyzeVariance(2_800_000, priorValuation);
      result.reconciliation_factors = [
        'Different multiple applied',
        'Updated financial data',
        'Industry-specific adjustments',
      ];

      const narrative = analyzer.generateReconciliationNarrative(result);

      expect(narrative).toContain('Different multiple applied');
      expect(narrative).toContain('Updated financial data');
    });
  });

  describe('custom thresholds', () => {
    it('should allow custom variance thresholds', () => {
      const analyzer = createVarianceAnalyzer({
        warning_threshold: 0.15, // 15% instead of 25%
        critical_threshold: 0.30, // 30% instead of 50%
      });

      const priorValuation: PriorValuation = {
        source: 'Strict Benchmark',
        value: 2_000_000,
        date: '2024-01-01',
        methodology: 'Test',
      };

      // 20% variance should be WARNING with 15% threshold
      const result = analyzer.analyzeVariance(2_400_000, priorValuation);
      expect(result.severity).toBe(VarianceSeverity.WARNING);

      // 35% variance should be CRITICAL with 30% threshold
      const result2 = analyzer.analyzeVariance(2_700_000, priorValuation);
      expect(result2.severity).toBe(VarianceSeverity.CRITICAL);
    });
  });

  describe('edge cases', () => {
    it('should handle zero prior valuation', () => {
      const analyzer = createVarianceAnalyzer();
      const priorValuation: PriorValuation = {
        source: 'Invalid',
        value: 0,
        date: '2024-01-01',
        methodology: 'Test',
      };

      const result = analyzer.analyzeVariance(2_000_000, priorValuation);

      expect(result.severity).toBe(VarianceSeverity.CRITICAL);
      expect(result.error).toContain('invalid');
    });

    it('should handle negative prior valuation', () => {
      const analyzer = createVarianceAnalyzer();
      const priorValuation: PriorValuation = {
        source: 'Invalid',
        value: -500_000,
        date: '2024-01-01',
        methodology: 'Test',
      };

      const result = analyzer.analyzeVariance(2_000_000, priorValuation);

      expect(result.severity).toBe(VarianceSeverity.CRITICAL);
      expect(result.error).toContain('invalid');
    });

    it('should handle zero current valuation', () => {
      const analyzer = createVarianceAnalyzer();
      const priorValuation: PriorValuation = {
        source: 'Valid',
        value: 2_000_000,
        date: '2024-01-01',
        methodology: 'Test',
      };

      const result = analyzer.analyzeVariance(0, priorValuation);

      expect(result.severity).toBe(VarianceSeverity.CRITICAL);
      expect(result.variance_percentage).toBe(-1); // -100%
    });
  });
});
