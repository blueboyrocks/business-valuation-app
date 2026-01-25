/**
 * ValuationDataAccessor Unit Tests
 * TDD: Tests written before implementation
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ValuationDataAccessor, createDataAccessor } from '../data-accessor';
import { createValuationDataStore, ValuationDataStore } from '../data-store';
import {
  KFACTOR_FINANCIALS,
  KFACTOR_BALANCE_SHEET,
  KFACTOR_DATE_CONFIG,
  ENGINEERING_SERVICES_INDUSTRY,
} from '../../test-utils/fixtures';

describe('ValuationDataAccessor', () => {
  let store: ValuationDataStore;
  let accessor: ValuationDataAccessor;

  beforeEach(() => {
    store = createValuationDataStore({
      company_name: 'K-Factor Engineering, LLC',
      financials: KFACTOR_FINANCIALS,
      balance_sheet: KFACTOR_BALANCE_SHEET,
      industry: ENGINEERING_SERVICES_INDUSTRY,
      valuation_date: KFACTOR_DATE_CONFIG.valuation_date,
      fiscal_year_end: KFACTOR_DATE_CONFIG.fiscal_year_end,
    });
    accessor = createDataAccessor(store);
  });

  describe('revenue access', () => {
    it('should return current year revenue', () => {
      expect(accessor.getRevenue('current')).toBe(6_265_024);
    });

    it('should return prior year 1 revenue', () => {
      expect(accessor.getRevenue('prior_1')).toBe(6_106_416);
    });

    it('should return prior year 2 revenue', () => {
      expect(accessor.getRevenue('prior_2')).toBe(4_601_640);
    });

    it('should return weighted average revenue', () => {
      const expected = (6_265_024 * 3 + 6_106_416 * 2 + 4_601_640 * 1) / 6;
      expect(accessor.getRevenue('weighted')).toBeCloseTo(expected, 0);
    });

    it('should throw for invalid period', () => {
      expect(() => accessor.getRevenue('invalid' as 'current')).toThrow();
    });
  });

  describe('SDE access', () => {
    it('should return current year SDE', () => {
      expect(accessor.getSDE('current')).toBeGreaterThan(0);
    });

    it('should return weighted SDE', () => {
      expect(accessor.getSDE('weighted')).toBeGreaterThan(0);
    });

    it('should return normalized SDE', () => {
      expect(accessor.getSDE('normalized')).toBeGreaterThan(0);
    });
  });

  describe('EBITDA access', () => {
    it('should return current year EBITDA', () => {
      expect(accessor.getEBITDA('current')).toBeGreaterThan(0);
    });

    it('should return weighted EBITDA', () => {
      expect(accessor.getEBITDA('weighted')).toBeGreaterThan(0);
    });
  });

  describe('formatted values', () => {
    it('should return formatted revenue with dollar sign', () => {
      const formatted = accessor.getFormattedRevenue('current');
      expect(formatted).toMatch(/^\$[\d,]+$/);
      expect(formatted).toContain('6,265,024');
    });

    it('should return formatted SDE with dollar sign', () => {
      const formatted = accessor.getFormattedSDE('weighted');
      expect(formatted).toMatch(/^\$[\d,]+$/);
    });

    it('should return formatted currency for any value', () => {
      const formatted = accessor.formatCurrency(1234567.89);
      expect(formatted).toBe('$1,234,568'); // Rounded to whole dollars
    });

    it('should return formatted currency with cents when specified', () => {
      const formatted = accessor.formatCurrency(1234567.89, { showCents: true });
      expect(formatted).toBe('$1,234,567.89');
    });

    it('should return formatted percentage', () => {
      const formatted = accessor.formatPercentage(0.156);
      expect(formatted).toBe('15.6%');
    });

    it('should return formatted multiple', () => {
      const formatted = accessor.formatMultiple(2.65);
      expect(formatted).toBe('2.65x');
    });
  });

  describe('valuation access', () => {
    it('should return valuation results', () => {
      const storeWithValuation = createValuationDataStore({
        company_name: 'K-Factor Engineering, LLC',
        financials: KFACTOR_FINANCIALS,
        balance_sheet: KFACTOR_BALANCE_SHEET,
        industry: ENGINEERING_SERVICES_INDUSTRY,
        valuation_date: KFACTOR_DATE_CONFIG.valuation_date,
        fiscal_year_end: KFACTOR_DATE_CONFIG.fiscal_year_end,
        valuationResults: {
          asset_approach_value: 1_500_000,
          income_approach_value: 2_200_000,
          market_approach_value: 2_800_000,
          weighted_value: 2_500_000,
          final_value: 2_500_000,
          value_range_low: 2_125_000,
          value_range_high: 2_875_000,
        },
      });
      const accessorWithValuation = createDataAccessor(storeWithValuation);

      expect(accessorWithValuation.getFinalValue()).toBe(2_500_000);
      expect(accessorWithValuation.getValueRange()).toEqual({
        low: 2_125_000,
        high: 2_875_000,
      });
    });

    it('should return approach values', () => {
      const storeWithValuation = createValuationDataStore({
        company_name: 'Test',
        financials: KFACTOR_FINANCIALS,
        balance_sheet: KFACTOR_BALANCE_SHEET,
        industry: ENGINEERING_SERVICES_INDUSTRY,
        valuation_date: '2025-01-15',
        fiscal_year_end: '2024-12-31',
        valuationResults: {
          asset_approach_value: 1_500_000,
          income_approach_value: 2_200_000,
          market_approach_value: 2_800_000,
          weighted_value: 2_500_000,
          final_value: 2_500_000,
          value_range_low: 2_125_000,
          value_range_high: 2_875_000,
        },
      });
      const accessorWithValuation = createDataAccessor(storeWithValuation);

      expect(accessorWithValuation.getApproachValue('asset')).toBe(1_500_000);
      expect(accessorWithValuation.getApproachValue('income')).toBe(2_200_000);
      expect(accessorWithValuation.getApproachValue('market')).toBe(2_800_000);
    });
  });

  describe('meta access', () => {
    it('should return company name', () => {
      expect(accessor.getCompanyName()).toBe('K-Factor Engineering, LLC');
    });

    it('should return valuation date', () => {
      expect(accessor.getValuationDate()).toBe(KFACTOR_DATE_CONFIG.valuation_date);
    });

    it('should return industry info', () => {
      const industry = accessor.getIndustry();
      expect(industry.naics_code).toBe('541330');
      expect(industry.industry_name).toBe('Engineering Services');
    });

    it('should return fiscal year end', () => {
      expect(accessor.getFiscalYearEnd()).toBe(KFACTOR_DATE_CONFIG.fiscal_year_end);
    });
  });

  describe('audit logging', () => {
    it('should log access when logAccess is called', () => {
      accessor.logAccess('executive_summary', 'revenue.current');
      const log = accessor.getAccessLog();

      expect(log.length).toBeGreaterThan(0);
      expect(log[0]).toMatchObject({
        section: 'executive_summary',
        field: 'revenue.current',
      });
    });

    it('should track multiple accesses', () => {
      accessor.logAccess('section1', 'field1');
      accessor.logAccess('section2', 'field2');
      accessor.logAccess('section1', 'field3');

      const log = accessor.getAccessLog();
      expect(log.length).toBe(3);
    });

    it('should record timestamp for each access', () => {
      accessor.logAccess('test', 'field');
      const log = accessor.getAccessLog();

      expect(log[0].timestamp).toBeTruthy();
      expect(new Date(log[0].timestamp).getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should return access summary by section', () => {
      accessor.logAccess('executive_summary', 'revenue');
      accessor.logAccess('executive_summary', 'sde');
      accessor.logAccess('market_approach', 'sde');
      accessor.logAccess('market_approach', 'multiple');

      const summary = accessor.getAccessSummary();
      expect(summary['executive_summary']).toBe(2);
      expect(summary['market_approach']).toBe(2);
    });
  });

  describe('balance sheet access', () => {
    it('should return total assets', () => {
      expect(accessor.getTotalAssets()).toBe(KFACTOR_BALANCE_SHEET.assets.total_assets);
    });

    it('should return total liabilities', () => {
      expect(accessor.getTotalLiabilities()).toBe(KFACTOR_BALANCE_SHEET.liabilities.total_liabilities);
    });

    it('should return total equity', () => {
      expect(accessor.getTotalEquity()).toBe(KFACTOR_BALANCE_SHEET.equity.total_equity);
    });

    it('should return current ratio', () => {
      const currentAssets = KFACTOR_BALANCE_SHEET.assets.current_assets.total_current_assets;
      const currentLiabilities = KFACTOR_BALANCE_SHEET.liabilities.current_liabilities.total_current_liabilities;
      const expectedRatio = currentAssets / currentLiabilities;

      expect(accessor.getCurrentRatio()).toBeCloseTo(expectedRatio, 2);
    });
  });

  describe('consistency checks', () => {
    it('should verify revenue consistency', () => {
      // Access revenue multiple times - should always return same value
      const rev1 = accessor.getRevenue('current');
      const rev2 = accessor.getRevenue('current');
      const rev3 = accessor.getRevenue('current');

      expect(rev1).toBe(rev2);
      expect(rev2).toBe(rev3);
    });

    it('should verify SDE consistency', () => {
      const sde1 = accessor.getSDE('weighted');
      const sde2 = accessor.getSDE('weighted');

      expect(sde1).toBe(sde2);
    });
  });
});
