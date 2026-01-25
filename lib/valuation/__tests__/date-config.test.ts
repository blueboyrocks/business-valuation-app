/**
 * DateConfiguration Unit Tests
 * TDD: Tests written before implementation
 */
import { describe, it, expect } from 'vitest';
import {
  DateConfiguration,
  createDateConfiguration,
  DateLabelValidator,
} from '../date-config';

describe('DateConfiguration', () => {
  describe('initialization', () => {
    it('should create configuration with required dates', () => {
      const config = createDateConfiguration({
        valuation_date: '2025-01-15',
        fiscal_year_end: '2024-12-31',
        years_analyzed: ['2024', '2023', '2022'],
      });

      expect(config.valuation_date).toBe('2025-01-15');
      expect(config.fiscal_year_end).toBe('2024-12-31');
      expect(config.years_analyzed).toEqual(['2024', '2023', '2022']);
    });

    it('should generate report_generation_date automatically', () => {
      const config = createDateConfiguration({
        valuation_date: '2025-01-15',
        fiscal_year_end: '2024-12-31',
        years_analyzed: ['2024', '2023', '2022'],
      });

      expect(config.report_generation_date).toBeTruthy();
      expect(new Date(config.report_generation_date).getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should generate data_period_description', () => {
      const config = createDateConfiguration({
        valuation_date: '2025-01-15',
        fiscal_year_end: '2024-12-31',
        years_analyzed: ['2024', '2023', '2022'],
      });

      expect(config.data_period_description).toContain('2022');
      expect(config.data_period_description).toContain('2024');
    });
  });

  describe('date formatting', () => {
    it('should format date for display (long format)', () => {
      const config = createDateConfiguration({
        valuation_date: '2025-01-15',
        fiscal_year_end: '2024-12-31',
        years_analyzed: ['2024'],
      });

      const formatted = config.formatDate('2025-01-15', 'long');
      expect(formatted).toMatch(/January\s+15,\s+2025/);
    });

    it('should format date for display (short format)', () => {
      const config = createDateConfiguration({
        valuation_date: '2025-01-15',
        fiscal_year_end: '2024-12-31',
        years_analyzed: ['2024'],
      });

      const formatted = config.formatDate('2025-01-15', 'short');
      expect(formatted).toMatch(/1\/15\/2025|01\/15\/2025/);
    });

    it('should format date for display (fiscal year format)', () => {
      const config = createDateConfiguration({
        valuation_date: '2025-01-15',
        fiscal_year_end: '2024-12-31',
        years_analyzed: ['2024'],
      });

      const formatted = config.formatDate('2024-12-31', 'fiscal_year');
      expect(formatted).toMatch(/FY\s*2024/);
    });
  });

  describe('year labels', () => {
    it('should generate correct year labels', () => {
      const config = createDateConfiguration({
        valuation_date: '2025-01-15',
        fiscal_year_end: '2024-12-31',
        years_analyzed: ['2024', '2023', '2022'],
      });

      expect(config.getCurrentYearLabel()).toBe('FY2024');
      expect(config.getPriorYear1Label()).toBe('FY2023');
      expect(config.getPriorYear2Label()).toBe('FY2022');
    });

    it('should handle single year analysis', () => {
      const config = createDateConfiguration({
        valuation_date: '2025-01-15',
        fiscal_year_end: '2024-12-31',
        years_analyzed: ['2024'],
      });

      expect(config.getCurrentYearLabel()).toBe('FY2024');
      expect(config.getPriorYear1Label()).toBe('');
      expect(config.getPriorYear2Label()).toBe('');
    });
  });

  describe('date validation', () => {
    it('should validate date format', () => {
      const config = createDateConfiguration({
        valuation_date: '2025-01-15',
        fiscal_year_end: '2024-12-31',
        years_analyzed: ['2024'],
      });

      expect(config.isValidDate('2025-01-15')).toBe(true);
      expect(config.isValidDate('invalid-date')).toBe(false);
      expect(config.isValidDate('13/45/2025')).toBe(false);
    });

    it('should validate valuation date is after fiscal year end', () => {
      const config = createDateConfiguration({
        valuation_date: '2025-01-15',
        fiscal_year_end: '2024-12-31',
        years_analyzed: ['2024'],
      });

      expect(config.isValuationDateValid()).toBe(true);
    });

    it('should reject valuation date before fiscal year end', () => {
      const config = createDateConfiguration({
        valuation_date: '2024-11-15', // Before fiscal year end
        fiscal_year_end: '2024-12-31',
        years_analyzed: ['2024'],
      });

      expect(config.isValuationDateValid()).toBe(false);
    });
  });

  describe('period descriptions', () => {
    it('should generate trailing twelve months description', () => {
      const config = createDateConfiguration({
        valuation_date: '2025-01-15',
        fiscal_year_end: '2024-12-31',
        years_analyzed: ['2024'],
      });

      const ttm = config.getTrailingTwelveMonthsDescription();
      expect(ttm).toContain('12');
      expect(ttm).toMatch(/month/i);
    });

    it('should generate as-of date description', () => {
      const config = createDateConfiguration({
        valuation_date: '2025-01-15',
        fiscal_year_end: '2024-12-31',
        years_analyzed: ['2024'],
      });

      const asOf = config.getAsOfDescription();
      expect(asOf).toMatch(/as of/i);
      expect(asOf).toContain('2025');
    });
  });
});

describe('DateLabelValidator', () => {
  describe('label validation', () => {
    it('should validate correct year references', () => {
      const validator = new DateLabelValidator(['2024', '2023', '2022']);

      expect(validator.validateYearReference('FY2024')).toBe(true);
      expect(validator.validateYearReference('FY2023')).toBe(true);
      expect(validator.validateYearReference('fiscal year 2024')).toBe(true);
    });

    it('should reject invalid year references', () => {
      const validator = new DateLabelValidator(['2024', '2023', '2022']);

      expect(validator.validateYearReference('FY2021')).toBe(false);
      expect(validator.validateYearReference('FY2025')).toBe(false);
    });

    it('should find all year references in text', () => {
      const validator = new DateLabelValidator(['2024', '2023', '2022']);

      const text = 'Revenue in FY2024 was $6.2M, up from $4.6M in FY2022.';
      const references = validator.findYearReferences(text);

      expect(references).toContain('2024');
      expect(references).toContain('2022');
      expect(references).not.toContain('2023');
    });

    it('should detect inconsistent year references', () => {
      const validator = new DateLabelValidator(['2024', '2023', '2022']);

      const text = 'The company reported strong results in FY2020 with revenue growth.';
      const issues = validator.validateText(text);

      expect(issues.length).toBeGreaterThan(0);
      expect(issues.some((i) => i.includes('2020'))).toBe(true);
    });

    it('should pass text with only valid year references', () => {
      const validator = new DateLabelValidator(['2024', '2023', '2022']);

      const text = 'Revenue grew from $4.6M in FY2022 to $6.3M in FY2024.';
      const issues = validator.validateText(text);

      expect(issues).toHaveLength(0);
    });
  });
});
