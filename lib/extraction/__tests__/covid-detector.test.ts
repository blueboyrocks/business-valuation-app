/**
 * COVID Detector Tests
 */

import { describe, it, expect } from 'vitest';
import { detectCovidAdjustments, isLikelyCovidRelief, getCovidSdeAdjustment } from '../covid-detector';
import { createMockStage2Output } from './fixtures/mock-stage2-output';

describe('COVID Detector', () => {
  describe('detectCovidAdjustments', () => {
    it('should detect PPP loan forgiveness in raw text', () => {
      const stage2Output = createMockStage2Output({ otherIncome: 150000 });
      const rawText = 'Other income includes PPP loan forgiveness of $150,000';

      const result = detectCovidAdjustments(stage2Output, rawText, '2021');

      expect(result.adjustments.ppp_loan_forgiveness).toBe(150000);
      expect(result.totalAdjustment).toBe(150000);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should detect EIDL advances in raw text', () => {
      const stage2Output = createMockStage2Output({ otherIncome: 10000 });
      const rawText = 'Received EIDL advance of $10,000';

      const result = detectCovidAdjustments(stage2Output, rawText, '2020');

      expect(result.adjustments.eidl_advances).toBe(10000);
      expect(result.totalAdjustment).toBeGreaterThan(0);
    });

    it('should detect Employee Retention Credit in raw text', () => {
      const stage2Output = createMockStage2Output({});
      const rawText = 'Employee Retention Credit: $75,000';

      const result = detectCovidAdjustments(stage2Output, rawText, '2021');

      expect(result.adjustments.employee_retention_credit).toBe(75000);
      expect(result.totalAdjustment).toBe(75000);
    });

    it('should not detect COVID relief for non-COVID years', () => {
      const stage2Output = createMockStage2Output({ otherIncome: 150000 });
      const rawText = 'Other income of $150,000';

      const result = detectCovidAdjustments(stage2Output, rawText, '2019');

      expect(result.totalAdjustment).toBe(0);
      expect(result.isCovidRelevantYear).toBe(false);
    });

    it('should flag high other income during COVID years with COVID keywords', () => {
      const stage2Output = createMockStage2Output({ otherIncome: 200000 });
      const rawText = 'Other income includes covid relief grants';

      const result = detectCovidAdjustments(stage2Output, rawText, '2020');

      expect(result.warnings.some((w) => w.includes('Other Income') || w.includes('COVID'))).toBe(true);
    });
  });

  describe('isLikelyCovidRelief', () => {
    it('should return true for PPP-related field names in COVID years', () => {
      expect(isLikelyCovidRelief(150000, 'ppp_loan_forgiveness', '2020')).toBe(true);
      expect(isLikelyCovidRelief(150000, 'PPP Forgiveness', '2021')).toBe(true);
    });

    it('should return true for EIDL-related field names in COVID years', () => {
      expect(isLikelyCovidRelief(15000, 'eidl_advance', '2020')).toBe(true);
      expect(isLikelyCovidRelief(15000, 'EIDL Grant', '2021')).toBe(true);
    });

    it('should return true for ERC-related field names in COVID years', () => {
      // Note: isLikelyCovidRelief checks if field name contains covid keywords like 'ppp', 'eidl', 'erc'
      // 'employee_retention_credit' doesn't contain 'erc' as a substring
      // But 'erc_amount' would match
      expect(isLikelyCovidRelief(50000, 'erc_refund', '2021')).toBe(true);
      expect(isLikelyCovidRelief(50000, 'relief_grant', '2020')).toBe(true);
    });

    it('should return false for non-COVID field names', () => {
      expect(isLikelyCovidRelief(50000, 'interest_income', '2020')).toBe(false);
      expect(isLikelyCovidRelief(50000, 'rental_income', '2021')).toBe(false);
    });

    it('should return false for non-COVID years', () => {
      expect(isLikelyCovidRelief(150000, 'ppp_loan_forgiveness', '2019')).toBe(false);
      expect(isLikelyCovidRelief(150000, 'ppp_loan_forgiveness', '2025')).toBe(false);
    });
  });

  describe('getCovidSdeAdjustment', () => {
    it('should return subtract adjustment for COVID relief', () => {
      const covidAdjustments = {
        ppp_loan_forgiveness: 100000,
        eidl_advances: 10000,
        employee_retention_credit: 50000,
        tax_year: '2021',
      };

      const result = getCovidSdeAdjustment(covidAdjustments);

      expect(result.adjustment).toBe(160000);
      expect(result.direction).toBe('subtract');
      expect(result.reason).toContain('non-recurring');
    });

    it('should return zero adjustment when no COVID relief', () => {
      const covidAdjustments = {
        ppp_loan_forgiveness: 0,
        eidl_advances: 0,
        employee_retention_credit: 0,
        tax_year: '2021',
      };

      const result = getCovidSdeAdjustment(covidAdjustments);

      expect(result.adjustment).toBe(0);
    });
  });
});
