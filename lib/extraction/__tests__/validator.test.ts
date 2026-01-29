/**
 * Validator Tests
 */

import { describe, it, expect } from 'vitest';
import { validateExtraction, isDataUsable, getValidationStatus } from '../validator';
import { Stage2Output } from '../types';
import { createMockStage2Output, createMockScheduleK } from './fixtures/mock-stage2-output';

describe('Validator', () => {
  describe('validateExtraction', () => {
    it('should pass validation for good data', () => {
      const stage2Output = createMockStage2Output({});
      const result = validateExtraction(stage2Output);

      expect(result.passed).toBe(true);
      expect(result.errorCount).toBe(0);
    });

    it('should detect balance sheet imbalance', () => {
      const stage2Output = createMockStage2Output({
        totalAssets: 1000000, // Will cause imbalance
      });
      // Manually override to create imbalance
      stage2Output.structured_data.balance_sheet.eoy_total_assets = 1000000;
      stage2Output.structured_data.balance_sheet.eoy_total_liabilities = 190000;
      stage2Output.structured_data.balance_sheet.eoy_total_equity = 340000;
      // Total L+E = 530000, but assets = 1000000 -> imbalance

      const result = validateExtraction(stage2Output);

      expect(result.passed).toBe(false);
      expect(result.errorCount).toBeGreaterThan(0);
      expect(result.blockers.some((b) => b.id === 'BS001')).toBe(true);
    });

    it('should detect loans to shareholders', () => {
      const stage2Output = createMockStage2Output({
        loansToShareholders: 50000,
      });

      const result = validateExtraction(stage2Output);

      expect(result.warningCount).toBeGreaterThan(0);
      expect(result.results.some((r) => r.id === 'BS002')).toBe(true);
    });

    it('should detect non-positive revenue', () => {
      const stage2Output = createMockStage2Output({
        revenue: 0,
      });

      const result = validateExtraction(stage2Output);

      expect(result.passed).toBe(false);
      expect(result.blockers.some((b) => b.id === 'IS002')).toBe(true);
    });

    it('should detect Section 179 deduction', () => {
      const stage2Output = createMockStage2Output({});
      stage2Output.structured_data.schedule_k = createMockScheduleK({
        ordinary_business_income: 135000,
        section_179_deduction: 30000,
      });

      const result = validateExtraction(stage2Output);

      // Section 179 should be flagged as info
      expect(result.infoCount).toBeGreaterThan(0);
      expect(result.results.some((r) => r.id === 'SDE002')).toBe(true);
    });
  });

  describe('isDataUsable', () => {
    it('should return true for passed validation', () => {
      const summary = {
        passed: true,
        errorCount: 0,
        warningCount: 2,
        infoCount: 3,
        results: [],
        blockers: [],
      };

      expect(isDataUsable(summary)).toBe(true);
    });

    it('should return false for failed validation', () => {
      const summary = {
        passed: false,
        errorCount: 1,
        warningCount: 0,
        infoCount: 0,
        results: [],
        blockers: [],
      };

      expect(isDataUsable(summary)).toBe(false);
    });
  });

  describe('getValidationStatus', () => {
    it('should return errors when errorCount > 0', () => {
      const summary = {
        passed: false,
        errorCount: 1,
        warningCount: 2,
        infoCount: 0,
        results: [],
        blockers: [],
      };

      expect(getValidationStatus(summary)).toBe('errors');
    });

    it('should return warnings when warningCount > 0 and no errors', () => {
      const summary = {
        passed: true,
        errorCount: 0,
        warningCount: 2,
        infoCount: 0,
        results: [],
        blockers: [],
      };

      expect(getValidationStatus(summary)).toBe('warnings');
    });

    it('should return passed when no errors or warnings', () => {
      const summary = {
        passed: true,
        errorCount: 0,
        warningCount: 0,
        infoCount: 3,
        results: [],
        blockers: [],
      };

      expect(getValidationStatus(summary)).toBe('passed');
    });
  });
});
