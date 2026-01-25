/**
 * QualityGate Unit Tests
 * TDD: Tests written before implementation
 *
 * Critical for ensuring report quality meets premium tier standards.
 * Calculates overall quality score and prevents generation of sub-standard reports.
 */
import { describe, it, expect } from 'vitest';
import {
  QualityGate,
  createQualityGate,
  QualityScore,
  QualityTier,
  QualityCategory,
  ReportQualityInput,
} from '../quality-gate';
import {
  KFACTOR_EXPECTED_SDE,
  KFACTOR_EXPECTED_VALUATION,
} from '../../test-utils/fixtures';

describe('QualityGate', () => {
  describe('Quality Tier Classification', () => {
    it('should classify score 80+ as PREMIUM tier', () => {
      const gate = createQualityGate();

      const tier = gate.getTier(85);

      expect(tier).toBe(QualityTier.PREMIUM);
    });

    it('should classify score 65-79 as GOOD tier', () => {
      const gate = createQualityGate();

      expect(gate.getTier(65)).toBe(QualityTier.GOOD);
      expect(gate.getTier(79)).toBe(QualityTier.GOOD);
    });

    it('should classify score 50-64 as ADEQUATE tier', () => {
      const gate = createQualityGate();

      expect(gate.getTier(50)).toBe(QualityTier.ADEQUATE);
      expect(gate.getTier(64)).toBe(QualityTier.ADEQUATE);
    });

    it('should classify score below 50 as INSUFFICIENT tier', () => {
      const gate = createQualityGate();

      expect(gate.getTier(49)).toBe(QualityTier.INSUFFICIENT);
      expect(gate.getTier(25)).toBe(QualityTier.INSUFFICIENT);
      expect(gate.getTier(0)).toBe(QualityTier.INSUFFICIENT);
    });
  });

  describe('Category Scoring', () => {
    it('should score data consistency category', () => {
      const gate = createQualityGate();

      const input: ReportQualityInput = {
        data_consistency: {
          revenue_consistent: true,
          sde_consistent: true,
          dates_consistent: true,
          calculations_verified: true,
        },
        calculation_transparency: {},
        valuation_accuracy: {},
        citation_coverage: {},
        narrative_quality: {},
      };

      const score = gate.scoreCategory(QualityCategory.DATA_CONSISTENCY, input);

      expect(score).toBe(100); // All checks passed
    });

    it('should score calculation transparency category', () => {
      const gate = createQualityGate();

      const input: ReportQualityInput = {
        data_consistency: {},
        calculation_transparency: {
          sde_table_included: true,
          market_approach_table_included: true,
          synthesis_table_included: true,
          source_references_complete: true,
        },
        valuation_accuracy: {},
        citation_coverage: {},
        narrative_quality: {},
      };

      const score = gate.scoreCategory(QualityCategory.CALCULATION_TRANSPARENCY, input);

      expect(score).toBe(100);
    });

    it('should score valuation accuracy category', () => {
      const gate = createQualityGate();

      const input: ReportQualityInput = {
        data_consistency: {},
        calculation_transparency: {},
        valuation_accuracy: {
          multiple_within_range: true,
          value_within_expected: true,
          no_critical_variance: true,
          reconciliation_complete: true,
        },
        citation_coverage: {},
        narrative_quality: {},
      };

      const score = gate.scoreCategory(QualityCategory.VALUATION_ACCURACY, input);

      expect(score).toBe(100);
    });

    it('should score citation coverage category', () => {
      const gate = createQualityGate();

      const input: ReportQualityInput = {
        data_consistency: {},
        calculation_transparency: {},
        valuation_accuracy: {},
        citation_coverage: {
          citation_count: 12,
          market_data_cited: true,
          financial_benchmark_cited: true,
          valuation_guide_cited: true,
          academic_cited: true,
        },
        narrative_quality: {},
      };

      const score = gate.scoreCategory(QualityCategory.CITATION_COVERAGE, input);

      expect(score).toBe(100);
    });

    it('should score narrative quality category', () => {
      const gate = createQualityGate();

      const input: ReportQualityInput = {
        data_consistency: {},
        calculation_transparency: {},
        valuation_accuracy: {},
        citation_coverage: {},
        narrative_quality: {
          word_count: 8000,
          executive_summary_word_count: 750,
          industry_references_correct: true,
          no_placeholder_text: true,
        },
      };

      const score = gate.scoreCategory(QualityCategory.NARRATIVE_QUALITY, input);

      expect(score).toBe(100);
    });

    it('should penalize missing data consistency checks', () => {
      const gate = createQualityGate();

      const input: ReportQualityInput = {
        data_consistency: {
          revenue_consistent: true,
          sde_consistent: false, // FAIL
          dates_consistent: true,
          calculations_verified: false, // FAIL
        },
        calculation_transparency: {},
        valuation_accuracy: {},
        citation_coverage: {},
        narrative_quality: {},
      };

      const score = gate.scoreCategory(QualityCategory.DATA_CONSISTENCY, input);

      expect(score).toBeLessThan(100);
      expect(score).toBeGreaterThanOrEqual(40); // 2 of 4 passed
    });

    it('should penalize low citation count', () => {
      const gate = createQualityGate();

      const input: ReportQualityInput = {
        data_consistency: {},
        calculation_transparency: {},
        valuation_accuracy: {},
        citation_coverage: {
          citation_count: 3, // Below minimum 10
          market_data_cited: true,
          financial_benchmark_cited: false,
          valuation_guide_cited: false,
          academic_cited: false,
        },
        narrative_quality: {},
      };

      const score = gate.scoreCategory(QualityCategory.CITATION_COVERAGE, input);

      expect(score).toBeLessThan(50);
    });
  });

  describe('Overall Quality Score', () => {
    it('should calculate overall quality score from all categories', () => {
      const gate = createQualityGate();

      const input: ReportQualityInput = {
        data_consistency: {
          revenue_consistent: true,
          sde_consistent: true,
          dates_consistent: true,
          calculations_verified: true,
        },
        calculation_transparency: {
          sde_table_included: true,
          market_approach_table_included: true,
          synthesis_table_included: true,
          source_references_complete: true,
        },
        valuation_accuracy: {
          multiple_within_range: true,
          value_within_expected: true,
          no_critical_variance: true,
          reconciliation_complete: true,
        },
        citation_coverage: {
          citation_count: 12,
          market_data_cited: true,
          financial_benchmark_cited: true,
          valuation_guide_cited: true,
          academic_cited: true,
        },
        narrative_quality: {
          word_count: 8000,
          executive_summary_word_count: 750,
          industry_references_correct: true,
          no_placeholder_text: true,
        },
      };

      const result = gate.calculateScore(input);

      expect(result.overall_score).toBe(100);
      expect(result.tier).toBe(QualityTier.PREMIUM);
    });

    it('should return score breakdown by category', () => {
      const gate = createQualityGate();

      const input: ReportQualityInput = {
        data_consistency: {
          revenue_consistent: true,
          sde_consistent: true,
          dates_consistent: true,
          calculations_verified: true,
        },
        calculation_transparency: {
          sde_table_included: true,
          market_approach_table_included: true,
          synthesis_table_included: false, // Missing
          source_references_complete: true,
        },
        valuation_accuracy: {
          multiple_within_range: true,
          value_within_expected: true,
          no_critical_variance: true,
          reconciliation_complete: true,
        },
        citation_coverage: {
          citation_count: 8, // Below 10
          market_data_cited: true,
          financial_benchmark_cited: true,
          valuation_guide_cited: true,
          academic_cited: false, // Missing
        },
        narrative_quality: {
          word_count: 8000,
          executive_summary_word_count: 750,
          industry_references_correct: true,
          no_placeholder_text: true,
        },
      };

      const result = gate.calculateScore(input);

      expect(result.category_scores).toBeDefined();
      expect(result.category_scores.data_consistency).toBe(100);
      expect(result.category_scores.calculation_transparency).toBeLessThan(100);
      expect(result.category_scores.citation_coverage).toBeLessThan(100);
    });

    it('should weight categories appropriately', () => {
      const gate = createQualityGate();

      // Data consistency and valuation accuracy should be weighted higher
      const weights = gate.getCategoryWeights();

      expect(weights[QualityCategory.DATA_CONSISTENCY]).toBeGreaterThanOrEqual(0.2);
      expect(weights[QualityCategory.VALUATION_ACCURACY]).toBeGreaterThanOrEqual(0.25);
    });
  });

  describe('Blocking Issues', () => {
    it('should block report with critical variance', () => {
      const gate = createQualityGate();

      const input: ReportQualityInput = {
        data_consistency: {
          revenue_consistent: true,
          sde_consistent: true,
          dates_consistent: true,
          calculations_verified: true,
        },
        calculation_transparency: {
          sde_table_included: true,
          market_approach_table_included: true,
          synthesis_table_included: true,
          source_references_complete: true,
        },
        valuation_accuracy: {
          multiple_within_range: false, // CRITICAL - multiple out of range
          value_within_expected: false, // CRITICAL - $4.1M error
          no_critical_variance: false, // CRITICAL - >50% variance
          reconciliation_complete: false,
        },
        citation_coverage: {
          citation_count: 12,
          market_data_cited: true,
          financial_benchmark_cited: true,
          valuation_guide_cited: true,
          academic_cited: true,
        },
        narrative_quality: {
          word_count: 8000,
          executive_summary_word_count: 750,
          industry_references_correct: true,
          no_placeholder_text: true,
        },
      };

      const result = gate.calculateScore(input);

      expect(result.can_generate_pdf).toBe(false);
      expect(result.blocking_issues).toBeDefined();
      expect(result.blocking_issues!.length).toBeGreaterThan(0);
    });

    it('should block report with data inconsistency', () => {
      const gate = createQualityGate();

      const input: ReportQualityInput = {
        data_consistency: {
          revenue_consistent: false, // CRITICAL
          sde_consistent: false, // CRITICAL
          dates_consistent: true,
          calculations_verified: false, // CRITICAL
        },
        calculation_transparency: {},
        valuation_accuracy: {},
        citation_coverage: {},
        narrative_quality: {},
      };

      const result = gate.calculateScore(input);

      expect(result.can_generate_pdf).toBe(false);
      expect(result.blocking_issues!.some((i) => i.includes('consistency'))).toBe(true);
    });

    it('should allow report with non-blocking issues', () => {
      const gate = createQualityGate();

      const input: ReportQualityInput = {
        data_consistency: {
          revenue_consistent: true,
          sde_consistent: true,
          dates_consistent: true,
          calculations_verified: true,
        },
        calculation_transparency: {
          sde_table_included: true,
          market_approach_table_included: true,
          synthesis_table_included: false, // Non-blocking
          source_references_complete: true,
        },
        valuation_accuracy: {
          multiple_within_range: true,
          value_within_expected: true,
          no_critical_variance: true,
          reconciliation_complete: true,
        },
        citation_coverage: {
          citation_count: 8, // Non-blocking (warning)
          market_data_cited: true,
          financial_benchmark_cited: true,
          valuation_guide_cited: true,
          academic_cited: true,
        },
        narrative_quality: {
          word_count: 6500, // Non-blocking (warning)
          executive_summary_word_count: 600, // Non-blocking (warning)
          industry_references_correct: true,
          no_placeholder_text: true,
        },
      };

      const result = gate.calculateScore(input);

      expect(result.can_generate_pdf).toBe(true);
      expect(result.warnings).toBeDefined();
    });
  });

  describe('K-Factor Quality Assessment', () => {
    it('should FAIL quality check for $4.1M erroneous valuation', () => {
      const gate = createQualityGate();

      // Simulate the erroneous report
      const input: ReportQualityInput = {
        data_consistency: {
          revenue_consistent: true,
          sde_consistent: true,
          dates_consistent: true,
          calculations_verified: false, // Math doesn't check out
        },
        calculation_transparency: {
          sde_table_included: true,
          market_approach_table_included: true,
          synthesis_table_included: true,
          source_references_complete: true,
        },
        valuation_accuracy: {
          multiple_within_range: false, // 4.4x out of range
          value_within_expected: false, // $4.1M not expected
          no_critical_variance: false, // >100% variance from BizEquity
          reconciliation_complete: false,
        },
        citation_coverage: {
          citation_count: 5,
          market_data_cited: true,
          financial_benchmark_cited: false,
          valuation_guide_cited: true,
          academic_cited: false,
        },
        narrative_quality: {
          word_count: 6500,
          executive_summary_word_count: 500,
          industry_references_correct: true,
          no_placeholder_text: true,
        },
      };

      const result = gate.calculateScore(input);

      expect(result.can_generate_pdf).toBe(false);
      expect(result.tier).toBe(QualityTier.INSUFFICIENT);
      expect(result.overall_score).toBeLessThan(50);
    });

    it('should PASS quality check for corrected K-Factor valuation', () => {
      const gate = createQualityGate();

      // Simulate the corrected report
      const input: ReportQualityInput = {
        data_consistency: {
          revenue_consistent: true,
          sde_consistent: true,
          dates_consistent: true,
          calculations_verified: true,
        },
        calculation_transparency: {
          sde_table_included: true,
          market_approach_table_included: true,
          synthesis_table_included: true,
          source_references_complete: true,
        },
        valuation_accuracy: {
          multiple_within_range: true, // 2.65x within range
          value_within_expected: true, // ~$2.8M as expected
          no_critical_variance: true, // 40% variance (warning but OK)
          reconciliation_complete: true,
        },
        citation_coverage: {
          citation_count: 12,
          market_data_cited: true,
          financial_benchmark_cited: true,
          valuation_guide_cited: true,
          academic_cited: true,
        },
        narrative_quality: {
          word_count: 8500,
          executive_summary_word_count: 750,
          industry_references_correct: true,
          no_placeholder_text: true,
        },
      };

      const result = gate.calculateScore(input);

      expect(result.can_generate_pdf).toBe(true);
      expect(result.tier).toBe(QualityTier.PREMIUM);
      expect(result.overall_score).toBeGreaterThanOrEqual(80);
    });
  });

  describe('Quality Report Generation', () => {
    it('should generate human-readable quality report', () => {
      const gate = createQualityGate();

      const input: ReportQualityInput = {
        data_consistency: {
          revenue_consistent: true,
          sde_consistent: true,
          dates_consistent: true,
          calculations_verified: true,
        },
        calculation_transparency: {
          sde_table_included: true,
          market_approach_table_included: true,
          synthesis_table_included: false,
          source_references_complete: true,
        },
        valuation_accuracy: {
          multiple_within_range: true,
          value_within_expected: true,
          no_critical_variance: true,
          reconciliation_complete: true,
        },
        citation_coverage: {
          citation_count: 10,
          market_data_cited: true,
          financial_benchmark_cited: true,
          valuation_guide_cited: true,
          academic_cited: true,
        },
        narrative_quality: {
          word_count: 7500,
          executive_summary_word_count: 700,
          industry_references_correct: true,
          no_placeholder_text: true,
        },
      };

      const scoreResult = gate.calculateScore(input);
      const report = gate.generateQualityReport(scoreResult);

      expect(report).toContain('Quality Score');
      expect(report).toContain('Data Consistency');
      expect(report).toContain('Calculation Transparency');
      expect(report).toContain('Valuation Accuracy');
      expect(report).toContain('Citation Coverage');
      expect(report).toContain('Narrative Quality');
    });

    it('should list recommendations for improvement', () => {
      const gate = createQualityGate();

      const input: ReportQualityInput = {
        data_consistency: {
          revenue_consistent: true,
          sde_consistent: true,
          dates_consistent: true,
          calculations_verified: true,
        },
        calculation_transparency: {
          sde_table_included: true,
          market_approach_table_included: true,
          synthesis_table_included: false, // Missing
          source_references_complete: true,
        },
        valuation_accuracy: {
          multiple_within_range: true,
          value_within_expected: true,
          no_critical_variance: true,
          reconciliation_complete: true,
        },
        citation_coverage: {
          citation_count: 8, // Below target
          market_data_cited: true,
          financial_benchmark_cited: true,
          valuation_guide_cited: true,
          academic_cited: false, // Missing
        },
        narrative_quality: {
          word_count: 6000, // Below target
          executive_summary_word_count: 500, // Below target
          industry_references_correct: true,
          no_placeholder_text: true,
        },
      };

      const scoreResult = gate.calculateScore(input);

      expect(scoreResult.recommendations).toBeDefined();
      expect(scoreResult.recommendations!.length).toBeGreaterThan(0);
      expect(
        scoreResult.recommendations!.some((r) => r.toLowerCase().includes('citation'))
      ).toBe(true);
    });
  });

  describe('Minimum Requirements', () => {
    it('should enforce minimum word count of 7000', () => {
      const gate = createQualityGate();
      const minimums = gate.getMinimumRequirements();

      expect(minimums.word_count).toBeGreaterThanOrEqual(7000);
    });

    it('should enforce minimum citation count of 10', () => {
      const gate = createQualityGate();
      const minimums = gate.getMinimumRequirements();

      expect(minimums.citation_count).toBeGreaterThanOrEqual(10);
    });

    it('should enforce minimum executive summary of 600 words', () => {
      const gate = createQualityGate();
      const minimums = gate.getMinimumRequirements();

      expect(minimums.executive_summary_word_count).toBeGreaterThanOrEqual(600);
    });
  });
});
