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
      dlom_amount: 0,
      dloc_rate: 0,
      dloc_amount: 0,
    },
    company: {
      name: 'K-Factor Engineering, LLC',
      industry: 'Engineering Services',
      naics_code: '541330',
      sic_code: '',
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
    risk: {
      overall_score: 50,
      overall_rating: 'Moderate',
      factors: [],
    },
    data_quality: {
      completeness_score: 85,
      years_of_data: 3,
      missing_fields: [],
    },
  };

  if (!overrides) return base;

  return {
    financial: overrides.financial ?? base.financial,
    valuation: overrides.valuation ?? base.valuation,
    company: overrides.company ?? base.company,
    balance_sheet: overrides.balance_sheet ?? base.balance_sheet,
    metadata: overrides.metadata ?? base.metadata,
    risk: overrides.risk ?? base.risk,
    data_quality: overrides.data_quality ?? base.data_quality,
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
          dlom_amount: 375_000,
          dloc_rate: 0,
          dloc_amount: 0,
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
          dlom_amount: 375_000,
          dloc_rate: 0,
          dloc_amount: 0,
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

    it('getRawStore should return the same store', () => {
      const raw = accessor.getRawStore();
      expect(raw).toBe(store);
    });
  });

  describe('formatCurrency returns $X,XXX format', () => {
    it('should format whole numbers with commas and dollar sign', () => {
      expect(accessor.formatCurrency(1_000_000)).toBe('$1,000,000');
    });

    it('should round to whole dollars by default', () => {
      expect(accessor.formatCurrency(1234.56)).toBe('$1,235');
    });

    it('should return $0 for zero', () => {
      expect(accessor.formatCurrency(0)).toBe('$0');
    });

    it('should handle negative values', () => {
      const result = accessor.formatCurrency(-500_000);
      expect(result).toContain('500,000');
    });
  });

  describe('formatPercentage returns X.X% format', () => {
    it('should format decimal as percentage', () => {
      expect(accessor.formatPercentage(0.156)).toBe('15.6%');
    });

    it('should format zero', () => {
      expect(accessor.formatPercentage(0)).toBe('0.0%');
    });

    it('should respect custom decimal places', () => {
      expect(accessor.formatPercentage(0.1567, 2)).toBe('15.67%');
    });

    it('should format 100%', () => {
      expect(accessor.formatPercentage(1.0)).toBe('100.0%');
    });
  });

  describe('getSDEMargin calculates correctly', () => {
    it('should calculate SDE / Revenue', () => {
      // SDE = 1,130,912, Revenue = 6,265,024
      const expected = 1_130_912 / 6_265_024;
      expect(accessor.getSDEMargin()).toBeCloseTo(expected, 6);
    });

    it('should return formatted SDE margin as percentage', () => {
      const formatted = accessor.getFormattedSDEMargin();
      expect(formatted).toMatch(/^\d+\.\d+%$/);
    });

    it('should return 0 when revenue is zero', () => {
      const zeroRevStore = buildMockStore({
        financial: {
          ...store.financial,
          revenue: 0,
        },
      });
      const zeroRevAccessor = createDataAccessor(zeroRevStore);
      expect(zeroRevAccessor.getSDEMargin()).toBe(0);
    });
  });

  describe('getRiskRating returns correct label for score ranges', () => {
    it('should return Low for score <= 25', () => {
      const lowStore = buildMockStore({
        risk: { overall_score: 20, overall_rating: 'Low', factors: [] },
      });
      const lowAccessor = createDataAccessor(lowStore);
      expect(lowAccessor.getRiskRating()).toBe('Low');
    });

    it('should return Moderate for score 26-50', () => {
      const modStore = buildMockStore({
        risk: { overall_score: 40, overall_rating: 'Moderate', factors: [] },
      });
      const modAccessor = createDataAccessor(modStore);
      expect(modAccessor.getRiskRating()).toBe('Moderate');
    });

    it('should return Elevated for score 51-75', () => {
      const elevStore = buildMockStore({
        risk: { overall_score: 65, overall_rating: 'Elevated', factors: [] },
      });
      const elevAccessor = createDataAccessor(elevStore);
      expect(elevAccessor.getRiskRating()).toBe('Elevated');
    });

    it('should return High for score > 75', () => {
      const highStore = buildMockStore({
        risk: { overall_score: 85, overall_rating: 'High', factors: [] },
      });
      const highAccessor = createDataAccessor(highStore);
      expect(highAccessor.getRiskRating()).toBe('High');
    });

    it('should return risk score as number', () => {
      expect(accessor.getRiskScore()).toBe(50);
    });
  });

  describe('edge cases', () => {
    it('should return 0 margin when revenue is zero', () => {
      const zeroRevStore = buildMockStore({
        financial: {
          ...store.financial,
          revenue: 0,
        },
      });
      const zeroRevAccessor = createDataAccessor(zeroRevStore);
      expect(zeroRevAccessor.getSDEMargin()).toBe(0);
      expect(zeroRevAccessor.getEBITDAMargin()).toBe(0);
      expect(zeroRevAccessor.getProfitMargin()).toBe(0);
      expect(zeroRevAccessor.getGrossMargin()).toBe(0);
    });

    it('should return 0 current ratio when current liabilities are zero', () => {
      const zeroCLStore = buildMockStore({
        balance_sheet: {
          ...store.balance_sheet,
          current_liabilities: 0,
        },
      });
      const zeroCLAccessor = createDataAccessor(zeroCLStore);
      expect(zeroCLAccessor.getCurrentRatio()).toBe(0);
    });

    it('should return 0 debt-to-equity when equity is zero', () => {
      const zeroEqStore = buildMockStore({
        balance_sheet: {
          ...store.balance_sheet,
          total_equity: 0,
        },
      });
      const zeroEqAccessor = createDataAccessor(zeroEqStore);
      expect(zeroEqAccessor.getDebtToEquityRatio()).toBe(0);
    });

    it('should return book value as assets minus liabilities', () => {
      // total_assets = 1,951,000, total_liabilities = 618,000
      expect(accessor.getBookValue()).toBe(1_951_000 - 618_000);
    });

    it('should return working capital as current assets minus current liabilities', () => {
      // current_assets = 1,443,000, current_liabilities = 453,000
      expect(accessor.getWorkingCapital()).toBe(1_443_000 - 453_000);
    });
  });

  describe('approach access', () => {
    it('should return approach values by type', () => {
      const storeWithVals = buildMockStore({
        valuation: {
          ...store.valuation,
          asset_approach_value: 1_000_000,
          income_approach_value: 2_000_000,
          market_approach_value: 3_000_000,
        },
      });
      const a = createDataAccessor(storeWithVals);
      expect(a.getApproachValue('asset')).toBe(1_000_000);
      expect(a.getApproachValue('income')).toBe(2_000_000);
      expect(a.getApproachValue('market')).toBe(3_000_000);
    });

    it('should return approach weights by type', () => {
      expect(accessor.getApproachWeight('income')).toBe(0.30);
      expect(accessor.getApproachWeight('market')).toBe(0.50);
      expect(accessor.getApproachWeight('asset')).toBe(0.20);
    });

    it('should format approach values as currency', () => {
      const storeWithVals = buildMockStore({
        valuation: {
          ...store.valuation,
          income_approach_value: 2_500_000,
        },
      });
      const a = createDataAccessor(storeWithVals);
      expect(a.getFormattedApproachValue('income')).toBe('$2,500,000');
    });

    it('should format approach weights as percentages', () => {
      const formatted = accessor.getFormattedApproachWeight('market');
      expect(formatted).toBe('50%');
    });
  });

  describe('SDE type access', () => {
    it('should return current SDE by default', () => {
      expect(accessor.getSDE()).toBe(1_130_912);
    });

    it('should return weighted SDE for normalized type', () => {
      expect(accessor.getSDE('normalized')).toBe(1_040_718);
    });

    it('should return weighted SDE for weighted type', () => {
      expect(accessor.getSDE('weighted')).toBe(1_040_718);
    });

    it('should format SDE by type', () => {
      expect(accessor.getFormattedSDE('normalized')).toContain('1,040,718');
    });
  });

  describe('value range and discounts', () => {
    it('should return structured value range', () => {
      const storeWithRange = buildMockStore({
        valuation: {
          ...store.valuation,
          value_range_low: 2_000_000,
          value_range_high: 3_000_000,
        },
      });
      const a = createDataAccessor(storeWithRange);
      const range = a.getValueRange();
      expect(range.low).toBe(2_000_000);
      expect(range.high).toBe(3_000_000);
      expect(range.display).toContain('2,000,000');
      expect(range.display).toContain('3,000,000');
    });

    it('should return formatted value range', () => {
      const storeWithRange = buildMockStore({
        valuation: {
          ...store.valuation,
          value_range_low: 2_000_000,
          value_range_high: 3_000_000,
        },
      });
      const a = createDataAccessor(storeWithRange);
      const range = a.getFormattedValueRange();
      expect(range.low).toBe('$2,000,000');
      expect(range.high).toBe('$3,000,000');
      expect(range.display).toContain('$2,000,000');
    });

    it('should return DLOM rate and amount', () => {
      const storeWithDlom = buildMockStore({
        valuation: {
          ...store.valuation,
          dlom_percentage: 0.15,
          dlom_amount: 450_000,
        },
      });
      const a = createDataAccessor(storeWithDlom);
      expect(a.getDLOMRate()).toBe(0.15);
      expect(a.getDLOMAmount()).toBe(450_000);
      expect(a.getFormattedDLOMRate()).toBe('15.0%');
      expect(a.getFormattedDLOMAmount()).toBe('$450,000');
    });

    it('should return DLOC rate', () => {
      expect(accessor.getDLOCRate()).toBe(0);
      expect(accessor.getFormattedDLOCRate()).toBe('0.0%');
    });
  });

  describe('data quality and metadata access', () => {
    it('should return completeness score', () => {
      expect(accessor.getCompletenessScore()).toBe(85);
    });

    it('should return years of data', () => {
      expect(accessor.getYearsOfData()).toBe(3);
    });

    it('should return missing fields', () => {
      expect(accessor.getMissingFields()).toEqual([]);
    });

    it('should return valuation date', () => {
      expect(accessor.getValuationDate()).toBe('2025-01-15');
    });

    it('should return report date', () => {
      expect(accessor.getReportDate()).toBe('2025-01-20');
    });
  });

  describe('revenue growth rate', () => {
    it('should calculate growth from most recent two years', () => {
      // 2024: 6,265,024; 2023: 6,106,416
      const expected = (6_265_024 - 6_106_416) / 6_106_416;
      expect(accessor.getRevenueGrowthRate()).toBeCloseTo(expected, 6);
    });

    it('should return 0 when fewer than 2 years', () => {
      const singleYearStore = buildMockStore({
        financial: {
          ...store.financial,
          revenue_by_year: [{ period: '2024', revenue: 6_265_024 }],
        },
      });
      const a = createDataAccessor(singleYearStore);
      expect(a.getRevenueGrowthRate()).toBe(0);
    });

    it('should return 0 when prior year revenue is 0', () => {
      const zeroPriorStore = buildMockStore({
        financial: {
          ...store.financial,
          revenue_by_year: [
            { period: '2024', revenue: 6_265_024 },
            { period: '2023', revenue: 0 },
          ],
        },
      });
      const a = createDataAccessor(zeroPriorStore);
      expect(a.getRevenueGrowthRate()).toBe(0);
    });
  });

  describe('fiscal year label', () => {
    it('should return FY YYYY for current year', () => {
      expect(accessor.getFiscalYearLabel()).toBe('FY 2024');
    });

    it('should return prior year when yearsBack > 0', () => {
      expect(accessor.getFiscalYearLabel(1)).toBe('FY 2023');
      expect(accessor.getFiscalYearLabel(2)).toBe('FY 2022');
    });
  });
});
