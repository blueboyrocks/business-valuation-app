/**
 * Related Party Detector Tests
 */

import { describe, it, expect } from 'vitest';
import { detectRelatedPartyIndicators, getRelatedPartySdeAdjustments } from '../related-party-detector';
import { createMockStage2Output } from './fixtures/mock-stage2-output';

describe('Related Party Detector', () => {
  describe('detectRelatedPartyIndicators', () => {
    it('should detect loans to shareholders', () => {
      const stage2Output = createMockStage2Output({
        loansToShareholders: 50000,
      });

      const result = detectRelatedPartyIndicators(stage2Output, '');

      expect(result.indicators.some((i) => i.type === 'loan_to_shareholder')).toBe(true);
      expect(result.totalRelatedPartyAmount).toBeGreaterThan(0);
    });

    it('should detect loans from shareholders', () => {
      const stage2Output = createMockStage2Output({
        loansFromShareholders: 75000,
      });

      const result = detectRelatedPartyIndicators(stage2Output, '');

      expect(result.indicators.some((i) => i.type === 'loan_from_shareholder')).toBe(true);
    });

    it('should detect high rent expense', () => {
      const stage2Output = createMockStage2Output({
        rent: 150000, // 15% of $1M revenue
        revenue: 1000000,
      });

      const result = detectRelatedPartyIndicators(stage2Output, '');

      expect(result.indicators.some((i) => i.type === 'high_rent')).toBe(true);
    });

    it('should not flag normal rent expense', () => {
      const stage2Output = createMockStage2Output({
        rent: 36000, // 3.6% of revenue
        revenue: 1000000,
      });

      const result = detectRelatedPartyIndicators(stage2Output, '');

      expect(result.indicators.some((i) => i.type === 'high_rent')).toBe(false);
    });

    it('should detect management fees in text', () => {
      const stage2Output = createMockStage2Output({
        otherDeductions: 100000,
        totalDeductions: 500000,
      });
      const rawText = 'Includes management fee of $100,000 paid to related entity';

      const result = detectRelatedPartyIndicators(stage2Output, rawText);

      expect(result.indicators.some((i) => i.type === 'mgmt_fee')).toBe(true);
    });

    it('should detect high other expenses', () => {
      const stage2Output = createMockStage2Output({
        otherDeductions: 100000,
        totalDeductions: 400000, // 25% is other
      });

      const result = detectRelatedPartyIndicators(stage2Output, '');

      expect(result.indicators.some((i) => i.type === 'other')).toBe(true);
    });

    it('should classify severity correctly', () => {
      const stage2Output = createMockStage2Output({
        loansToShareholders: 150000, // High amount
      });

      const result = detectRelatedPartyIndicators(stage2Output, '');
      const loanIndicator = result.indicators.find((i) => i.type === 'loan_to_shareholder');

      expect(loanIndicator?.severity).toBe('high');
    });

    it('should add summary warning when indicators detected', () => {
      const stage2Output = createMockStage2Output({
        loansToShareholders: 25000,
      });

      const result = detectRelatedPartyIndicators(stage2Output, '');

      expect(result.warnings.some((w) => w.includes('related party indicator'))).toBe(true);
    });
  });

  describe('getRelatedPartySdeAdjustments', () => {
    it('should return review adjustment for loans to shareholders', () => {
      const detection = {
        indicators: [
          {
            type: 'loan_to_shareholder' as const,
            amount: 50000,
            percentOfRevenue: 0.05,
            description: 'Loans to shareholders',
            severity: 'medium' as const,
            recommendation: 'Review',
          },
        ],
        redFlags: [],
        warnings: [],
        totalRelatedPartyAmount: 50000,
      };

      const adjustments = getRelatedPartySdeAdjustments(detection);

      expect(adjustments.length).toBe(1);
      expect(adjustments[0].direction).toBe('review');
      expect(adjustments[0].adjustment).toBe(50000);
    });

    it('should return add adjustment for management fees', () => {
      const detection = {
        indicators: [
          {
            type: 'mgmt_fee' as const,
            amount: 75000,
            percentOfRevenue: 0.075,
            description: 'Management fees',
            severity: 'medium' as const,
            recommendation: 'Review',
          },
        ],
        redFlags: [],
        warnings: [],
        totalRelatedPartyAmount: 75000,
      };

      const adjustments = getRelatedPartySdeAdjustments(detection);

      expect(adjustments.length).toBe(1);
      expect(adjustments[0].direction).toBe('add');
      expect(adjustments[0].type).toBe('Management Fees');
    });

    it('should return multiple adjustments for multiple indicators', () => {
      const detection = {
        indicators: [
          {
            type: 'loan_to_shareholder' as const,
            amount: 50000,
            percentOfRevenue: 0.05,
            description: 'Loans to shareholders',
            severity: 'medium' as const,
            recommendation: 'Review',
          },
          {
            type: 'high_rent' as const,
            amount: 150000,
            percentOfRevenue: 0.15,
            description: 'High rent',
            severity: 'medium' as const,
            recommendation: 'Review',
          },
        ],
        redFlags: [],
        warnings: [],
        totalRelatedPartyAmount: 200000,
      };

      const adjustments = getRelatedPartySdeAdjustments(detection);

      expect(adjustments.length).toBe(2);
    });
  });
});
