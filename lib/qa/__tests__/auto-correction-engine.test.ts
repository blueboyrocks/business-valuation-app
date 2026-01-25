/**
 * AutoCorrectionEngine Unit Tests
 * TDD: Tests written before implementation
 *
 * Layer 3 of the QA System - Automatic error correction
 */
import { describe, it, expect } from 'vitest';
import {
  AutoCorrectionEngine,
  createAutoCorrectionEngine,
  CorrectionType,
  CorrectionResult,
} from '../auto-correction-engine';
import { createValuationDataStore } from '../../valuation/data-store';
import {
  KFACTOR_FINANCIALS,
  KFACTOR_BALANCE_SHEET,
  ENGINEERING_SERVICES_INDUSTRY,
} from '../../test-utils/fixtures';

describe('AutoCorrectionEngine', () => {
  describe('calculation corrections', () => {
    it('should correct weighted average calculation', () => {
      const engine = createAutoCorrectionEngine();

      const incorrectData = {
        current_year: 6_265_024,
        prior_year_1: 6_106_416,
        prior_year_2: 4_601_640,
        weighted_average: 5_000_000, // Incorrect
      };

      const result = engine.correctWeightedAverage(incorrectData);

      expect(result.corrected).toBe(true);
      expect(result.correction_type).toBe(CorrectionType.CALCULATION);
      // Expected: (6,265,024*3 + 6,106,416*2 + 4,601,640*1) / 6 = 5,934,924
      expect(result.new_value).toBeCloseTo(5_934_924, -2);
    });

    it('should not correct already correct weighted average', () => {
      const engine = createAutoCorrectionEngine();

      const correctWeighted = (6_265_024 * 3 + 6_106_416 * 2 + 4_601_640 * 1) / 6;

      const correctData = {
        current_year: 6_265_024,
        prior_year_1: 6_106_416,
        prior_year_2: 4_601_640,
        weighted_average: correctWeighted,
      };

      const result = engine.correctWeightedAverage(correctData);

      expect(result.corrected).toBe(false);
    });
  });

  describe('format corrections', () => {
    it('should correct currency formatting', () => {
      const engine = createAutoCorrectionEngine();

      const result = engine.correctCurrencyFormat('6265024');
      expect(result.corrected).toBe(true);
      expect(result.new_value).toBe('$6,265,024');
    });

    it('should correct already formatted currency', () => {
      const engine = createAutoCorrectionEngine();

      const result = engine.correctCurrencyFormat('$6,265,024');
      expect(result.corrected).toBe(false);
      expect(result.new_value).toBe('$6,265,024');
    });

    it('should correct percentage formatting', () => {
      const engine = createAutoCorrectionEngine();

      const result = engine.correctPercentageFormat(0.156);
      expect(result.corrected).toBe(true);
      expect(result.new_value).toBe('15.6%');
    });
  });

  describe('data consistency corrections', () => {
    it('should suggest correction for mismatched revenue', () => {
      const engine = createAutoCorrectionEngine();

      const sectionData = {
        executive_summary: { revenue: 5_000_000 },
        financial_analysis: { revenue: 6_265_024 },
        market_approach: { revenue: 6_265_024 },
      };

      const result = engine.suggestConsistencyCorrection(sectionData, 'revenue');

      expect(result.has_suggestion).toBe(true);
      expect(result.suggested_value).toBe(6_265_024); // Majority value
      expect(result.sections_to_update).toContain('executive_summary');
    });

    it('should not suggest correction when all values match', () => {
      const engine = createAutoCorrectionEngine();

      const sectionData = {
        executive_summary: { revenue: 6_265_024 },
        financial_analysis: { revenue: 6_265_024 },
        market_approach: { revenue: 6_265_024 },
      };

      const result = engine.suggestConsistencyCorrection(sectionData, 'revenue');

      expect(result.has_suggestion).toBe(false);
    });
  });

  describe('valuation corrections', () => {
    it('should flag but not auto-correct valuation issues', () => {
      const engine = createAutoCorrectionEngine();

      // $4.1M valuation with $1M SDE = 4.1x multiple (too high for engineering)
      const result = engine.validateValuationMultiple(4_100_000, 1_000_000, '541330');

      expect(result.requires_review).toBe(true);
      expect(result.auto_correctable).toBe(false);
      expect(result.issue_description).toMatch(/multiple|range/i);
    });

    it('should pass reasonable valuation multiple', () => {
      const engine = createAutoCorrectionEngine();

      // $2.5M valuation with $1M SDE = 2.5x multiple (within range)
      const result = engine.validateValuationMultiple(2_500_000, 1_000_000, '541330');

      expect(result.requires_review).toBe(false);
    });
  });

  describe('batch corrections', () => {
    it('should process multiple corrections', () => {
      const engine = createAutoCorrectionEngine();

      const corrections = [
        { type: 'currency', value: '6265024' },
        { type: 'currency', value: '4601640' },
        { type: 'percentage', value: 0.156 },
      ];

      const results = engine.batchCorrect(corrections);

      expect(results.length).toBe(3);
      expect(results[0].new_value).toBe('$6,265,024');
      expect(results[1].new_value).toBe('$4,601,640');
      expect(results[2].new_value).toBe('15.6%');
    });
  });

  describe('correction audit', () => {
    it('should track all corrections made', () => {
      const engine = createAutoCorrectionEngine();

      engine.correctCurrencyFormat('1000000');
      engine.correctPercentageFormat(0.25);

      const audit = engine.getCorrectionAudit();

      expect(audit.length).toBe(2);
      expect(audit[0].correction_type).toBeDefined();
      expect(audit[0].timestamp).toBeDefined();
    });

    it('should clear audit when requested', () => {
      const engine = createAutoCorrectionEngine();

      engine.correctCurrencyFormat('1000000');
      engine.clearCorrectionAudit();

      const audit = engine.getCorrectionAudit();
      expect(audit.length).toBe(0);
    });
  });

  describe('human review flagging', () => {
    it('should flag critical issues for human review', () => {
      const engine = createAutoCorrectionEngine();

      const issues = [
        { severity: 'critical', message: 'Missing data' },
        { severity: 'warning', message: 'High variance' },
        { severity: 'error', message: 'Calculation error' },
      ];

      const flagged = engine.flagForHumanReview(issues);

      expect(flagged.requires_human_review).toBe(true);
      expect(flagged.critical_issues.length).toBe(1);
      expect(flagged.reviewable_issues.length).toBe(2);
    });

    it('should not flag when no critical issues', () => {
      const engine = createAutoCorrectionEngine();

      const issues = [
        { severity: 'warning', message: 'Minor issue' },
        { severity: 'info', message: 'Note' },
      ];

      const flagged = engine.flagForHumanReview(issues);

      expect(flagged.requires_human_review).toBe(false);
    });
  });
});
