/**
 * ValuationDataStore Unit Tests
 * TDD: Tests written before implementation
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ValuationDataStore, createValuationDataStore } from '../data-store';
import {
  KFACTOR_FINANCIALS,
  KFACTOR_BALANCE_SHEET,
  KFACTOR_EXPECTED_SDE,
  KFACTOR_DATE_CONFIG,
  ENGINEERING_SERVICES_INDUSTRY,
} from '../../test-utils/fixtures';

describe('ValuationDataStore', () => {
  let store: ValuationDataStore;

  beforeEach(() => {
    store = createValuationDataStore({
      company_name: 'K-Factor Engineering, LLC',
      financials: KFACTOR_FINANCIALS,
      balance_sheet: KFACTOR_BALANCE_SHEET,
      industry: ENGINEERING_SERVICES_INDUSTRY,
      valuation_date: KFACTOR_DATE_CONFIG.valuation_date,
      fiscal_year_end: KFACTOR_DATE_CONFIG.fiscal_year_end,
    });
  });

  describe('initialization', () => {
    it('should create a store with correct financial data', () => {
      expect(store.financial.revenue.current_year).toBe(6_265_024);
      expect(store.financial.revenue.prior_year_1).toBe(6_106_416);
      expect(store.financial.revenue.prior_year_2).toBe(4_601_640);
    });

    it('should calculate weighted average revenue correctly', () => {
      // Weighted average: (6,265,024*3 + 6,106,416*2 + 4,601,640*1) / 6
      const expectedWeighted = (6_265_024 * 3 + 6_106_416 * 2 + 4_601_640 * 1) / 6;
      expect(store.financial.revenue.weighted_average).toBeCloseTo(expectedWeighted, 0);
    });

    it('should store SDE data correctly', () => {
      expect(store.financial.sde.current_year).toBeGreaterThan(0);
      expect(store.financial.sde.weighted_average).toBeGreaterThan(0);
    });

    it('should store meta information', () => {
      expect(store.meta.valuation_date).toBe(KFACTOR_DATE_CONFIG.valuation_date);
      expect(store.meta.fiscal_year_end).toBe(KFACTOR_DATE_CONFIG.fiscal_year_end);
      expect(store.meta.company_name).toBe('K-Factor Engineering, LLC');
    });

    it('should track data sources in audit', () => {
      expect(store.audit.data_sources).toContain('Tax Returns');
      expect(store.audit.last_updated).toBeTruthy();
    });
  });

  describe('immutability', () => {
    it('should be frozen after creation', () => {
      expect(Object.isFrozen(store)).toBe(true);
    });

    it('should not allow modification of financial data', () => {
      expect(() => {
        (store.financial.revenue as { current_year: number }).current_year = 0;
      }).toThrow();
    });

    it('should not allow modification of valuation data', () => {
      expect(() => {
        (store.valuation as { final_value: number }).final_value = 999999;
      }).toThrow();
    });

    it('should not allow adding new properties', () => {
      expect(() => {
        (store as Record<string, unknown>).newProperty = 'test';
      }).toThrow();
    });
  });

  describe('validation', () => {
    it('should reject creation with missing revenue', () => {
      const invalidFinancials = {
        ...KFACTOR_FINANCIALS,
        periods: [{
          ...KFACTOR_FINANCIALS.periods[0],
          gross_receipts: 0,
        }],
      };

      expect(() => {
        createValuationDataStore({
          company_name: 'Test',
          financials: invalidFinancials,
          balance_sheet: KFACTOR_BALANCE_SHEET,
          industry: ENGINEERING_SERVICES_INDUSTRY,
          valuation_date: '2025-01-15',
          fiscal_year_end: '2024-12-31',
        });
      }).toThrow(/revenue/i);
    });

    it('should reject creation with missing balance sheet', () => {
      expect(() => {
        createValuationDataStore({
          company_name: 'Test',
          financials: KFACTOR_FINANCIALS,
          balance_sheet: null as unknown as typeof KFACTOR_BALANCE_SHEET,
          industry: ENGINEERING_SERVICES_INDUSTRY,
          valuation_date: '2025-01-15',
          fiscal_year_end: '2024-12-31',
        });
      }).toThrow(/balance sheet/i);
    });

    it('should reject creation without company name', () => {
      expect(() => {
        createValuationDataStore({
          company_name: '',
          financials: KFACTOR_FINANCIALS,
          balance_sheet: KFACTOR_BALANCE_SHEET,
          industry: ENGINEERING_SERVICES_INDUSTRY,
          valuation_date: '2025-01-15',
          fiscal_year_end: '2024-12-31',
        });
      }).toThrow(/company name/i);
    });
  });

  describe('valuation data', () => {
    it('should store approach values when set', () => {
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

      expect(storeWithValuation.valuation.asset_approach_value).toBe(1_500_000);
      expect(storeWithValuation.valuation.income_approach_value).toBe(2_200_000);
      expect(storeWithValuation.valuation.market_approach_value).toBe(2_800_000);
      expect(storeWithValuation.valuation.final_value).toBe(2_500_000);
    });
  });

  describe('data consistency', () => {
    it('should have consistent revenue across all access points', () => {
      const revenue = store.financial.revenue;
      expect(revenue.current_year).toBe(6_265_024);
      // Verify this is the ONLY source of truth
      expect(store.financial.revenue.current_year).toBe(revenue.current_year);
    });

    it('should have consistent SDE across all access points', () => {
      const sde = store.financial.sde;
      expect(sde.current_year).toBeGreaterThan(0);
      // The same value should be returned every time
      expect(store.financial.sde.current_year).toBe(sde.current_year);
    });
  });
});

describe('createValuationDataStore edge cases', () => {
  it('should handle single year financials', () => {
    const singleYearFinancials = {
      periods: [KFACTOR_FINANCIALS.periods[0]],
      most_recent_year: '2024',
    };

    const store = createValuationDataStore({
      company_name: 'Test Company',
      financials: singleYearFinancials,
      balance_sheet: KFACTOR_BALANCE_SHEET,
      industry: ENGINEERING_SERVICES_INDUSTRY,
      valuation_date: '2025-01-15',
      fiscal_year_end: '2024-12-31',
    });

    expect(store.financial.revenue.current_year).toBe(6_265_024);
    expect(store.financial.revenue.prior_year_1).toBe(0);
    expect(store.financial.revenue.prior_year_2).toBe(0);
  });

  it('should handle two year financials', () => {
    const twoYearFinancials = {
      periods: [KFACTOR_FINANCIALS.periods[0], KFACTOR_FINANCIALS.periods[1]],
      most_recent_year: '2024',
    };

    const store = createValuationDataStore({
      company_name: 'Test Company',
      financials: twoYearFinancials,
      balance_sheet: KFACTOR_BALANCE_SHEET,
      industry: ENGINEERING_SERVICES_INDUSTRY,
      valuation_date: '2025-01-15',
      fiscal_year_end: '2024-12-31',
    });

    expect(store.financial.revenue.current_year).toBe(6_265_024);
    expect(store.financial.revenue.prior_year_1).toBe(6_106_416);
    expect(store.financial.revenue.prior_year_2).toBe(0);
  });
});
