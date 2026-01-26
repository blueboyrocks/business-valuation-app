/**
 * ValuationDataAccessor Unit Tests
 * Updated to match new ValuationDataStore interface
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ValuationDataAccessor, createDataAccessor } from '../data-accessor';
import type { ValuationDataStore } from '../data-store';

/**
 * Build a mock ValuationDataStore matching the new flat interface.
 * Values sourced from K-Factor Engineering fixture data.
 */
function buildMockStore(overrides?: Partial<ValuationDataStore>): ValuationDataStore {
  const base: ValuationDataStore = {
    financial: {
      revenue: 6_265_024,
      cogs: 4_062_116,
      gross_profit: 2_202_908,
      sde: 1_130_912,
      ebitda: 794_912,
      net_income: 728_412,
      officer_compensation: 250_000,
      interest_expense: 12_500,
      depreciation: 45_000,
      amortization: 8_000,
      weighted_sde: 1_040_718,
      weighted_ebitda: 750_000,
      sde_by_year: [
        { period: '2024', sde: 1_130_912 },
        { period: '2023', sde: 1_035_280 },
        { period: '2022', sde: 781_010 },
      ],
      ebitda_by_year: [
        { period: '2024', ebitda: 794_912 },
        { period: '2023', ebitda: 756_780 },
        { period: '2022', ebitda: 548_010 },
      ],
      revenue_by_year: [
        { period: '2024', revenue: 6_265_024 },
        { period: '2023', revenue: 6_106_416 },
        { period: '2022', revenue: 4_601_640 },
      ],
    },
    valuation: {
      income_approach_value: 0,
      market_approach_value: 0,
      asset_approach_value: 0,
      final_value: 0,
      preliminary_value: 0,
      value_range_low: 0,
      value_range_high: 0,
      sde_multiple: 2.65,
      cap_rate: 0.20,
      income_weight: 0.30,
      market_weight: 0.50,
      asset_weight: 0.20,
      dlom_percentage: 0.15,
      dlom_applied: true,
    },
    company: {
      name: 'K-Factor Engineering, LLC',
      industry: 'Engineering Services',
      naics_code: '541330',
      entity_type: 'S-Corporation',
      fiscal_year_end: '2024-12-31',
      location: '',
      years_in_business: 0,
    },
    balance_sheet: {
      total_assets: 1_951_000,
      total_liabilities: 618_000,
      total_equity: 1_333_000,
      cash: 425_000,
      accounts_receivable: 892_000,
      inventory: 85_000,
      fixed_assets: 465_000,
      intangible_assets: 25_000,
      accounts_payable: 245_000,
      current_assets: 1_443_000,
      current_liabilities: 453_000,
    },
    metadata: {
      report_date: '2025-01-20',
      valuation_date: '2025-01-15',
      generated_at: new Date().toISOString(),
      engine_version: '1.0.0',
      total_calc_steps: 10,
    },
  };

  if (!overrides) return base;

  return {
    financial: overrides.financial ?? base.financial,
    valuation: overrides.valuation ?? base.valuation,
    company: overrides.company ?? base.company,
    balance_sheet: overrides.balance_sheet ?? base.balance_sheet,
    metadata: overrides.metadata ?? base.metadata,
  };
}

describe('ValuationDataAccessor', () => {
  let store: ValuationDataStore;
  let accessor: ValuationDataAccessor;

  beforeEach(() => {
    store = buildMockStore();
    accessor = createDataAccessor(store);
  });

  describe('revenue access', () => {
    it('should return revenue', () => {
      expect(accessor.getRevenue()).toBe(6_265_024);
    });

    it('should return formatted revenue with dollar sign', () => {
      const formatted = accessor.getRevenueFormatted();
      expect(formatted).toMatch(/^\$[\d,]+$/);
      expect(formatted).toContain('6,265,024');
    });
  });

  describe('SDE access', () => {
    it('should return current year SDE', () => {
      expect(accessor.getSDE()).toBe(1_130_912);
    });

    it('should return weighted SDE', () => {
      expect(accessor.getWeightedSDE()).toBe(1_040_718);
    });
  });

  describe('EBITDA access', () => {
    it('should return current year EBITDA', () => {
      expect(accessor.getEBITDA()).toBeGreaterThan(0);
    });
  });

  describe('net income access', () => {
    it('should return net income', () => {
      expect(accessor.getNetIncome()).toBe(728_412);
    });
  });

  describe('formatted values', () => {
    it('should return formatted SDE with dollar sign', () => {
      const formatted = accessor.getSDEFormatted();
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
      const storeWithValuation = buildMockStore({
        valuation: {
          asset_approach_value: 1_500_000,
          income_approach_value: 2_200_000,
          market_approach_value: 2_800_000,
          final_value: 2_500_000,
          preliminary_value: 2_500_000,
          value_range_low: 2_125_000,
          value_range_high: 2_875_000,
          sde_multiple: 2.65,
          cap_rate: 0.20,
          income_weight: 0.30,
          market_weight: 0.50,
          asset_weight: 0.20,
          dlom_percentage: 0.15,
          dlom_applied: true,
        },
      });
      const accessorWithValuation = createDataAccessor(storeWithValuation);

      expect(accessorWithValuation.getFinalValue()).toBe(2_500_000);
      expect(accessorWithValuation.getFinalValueFormatted()).toContain('2,500,000');
      expect(accessorWithValuation.getValueRangeLow()).toBe(2_125_000);
      expect(accessorWithValuation.getValueRangeHigh()).toBe(2_875_000);
      expect(accessorWithValuation.getValueRangeFormatted()).toContain('2,125,000');
      expect(accessorWithValuation.getValueRangeFormatted()).toContain('2,875,000');
    });

    it('should return approach values', () => {
      const storeWithValuation = buildMockStore({
        valuation: {
          asset_approach_value: 1_500_000,
          income_approach_value: 2_200_000,
          market_approach_value: 2_800_000,
          final_value: 2_500_000,
          preliminary_value: 2_500_000,
          value_range_low: 2_125_000,
          value_range_high: 2_875_000,
          sde_multiple: 2.65,
          cap_rate: 0.20,
          income_weight: 0.30,
          market_weight: 0.50,
          asset_weight: 0.20,
          dlom_percentage: 0.15,
          dlom_applied: true,
        },
      });
      const accessorWithValuation = createDataAccessor(storeWithValuation);

      expect(accessorWithValuation.getAssetApproachValue()).toBe(1_500_000);
      expect(accessorWithValuation.getIncomeApproachValue()).toBe(2_200_000);
      expect(accessorWithValuation.getMarketApproachValue()).toBe(2_800_000);
    });
  });

  describe('company and metadata access', () => {
    it('should return company name', () => {
      expect(accessor.getCompanyName()).toBe('K-Factor Engineering, LLC');
    });

    it('should return industry', () => {
      expect(accessor.getIndustry()).toBe('Engineering Services');
    });

    it('should return NAICS code', () => {
      expect(accessor.getNAICSCode()).toBe('541330');
    });

    it('should return fiscal year end', () => {
      expect(accessor.getFiscalYearEnd()).toBe('2024-12-31');
    });
  });

  describe('balance sheet access', () => {
    it('should return total assets', () => {
      expect(accessor.getTotalAssets()).toBe(1_951_000);
    });

    it('should return total liabilities', () => {
      expect(accessor.getTotalLiabilities()).toBe(618_000);
    });

    it('should return total equity', () => {
      expect(accessor.getTotalEquity()).toBe(1_333_000);
    });

    it('should return current ratio', () => {
      const currentAssets = 1_443_000;
      const currentLiabilities = 453_000;
      const expectedRatio = currentAssets / currentLiabilities;

      expect(accessor.getCurrentRatio()).toBeCloseTo(expectedRatio, 2);
    });
  });

  describe('consistency checks', () => {
    it('should verify revenue consistency', () => {
      // Access revenue multiple times - should always return same value
      const rev1 = accessor.getRevenue();
      const rev2 = accessor.getRevenue();
      const rev3 = accessor.getRevenue();

      expect(rev1).toBe(rev2);
      expect(rev2).toBe(rev3);
    });

    it('should verify SDE consistency', () => {
      const sde1 = accessor.getSDE();
      const sde2 = accessor.getSDE();

      expect(sde1).toBe(sde2);
    });
  });

  describe('raw store access', () => {
    it('should return the full store', () => {
      const raw = accessor.getStore();
      expect(raw).toBe(store);
      expect(raw.financial.revenue).toBe(6_265_024);
      expect(raw.company.name).toBe('K-Factor Engineering, LLC');
    });
  });
});
