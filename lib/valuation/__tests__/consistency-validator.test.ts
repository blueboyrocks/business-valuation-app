/**
 * ConsistencyValidator Unit Tests
 * Updated to match new ValuationDataStore interface
 */
import { describe, it, expect } from 'vitest';
import {
  ConsistencyValidator,
  createConsistencyValidator,
  ValidationSeverity,
} from '../consistency-validator';
import type { ValuationDataStore } from '../data-store';

/**
 * Build a mock ValuationDataStore matching the new flat interface.
 * Values sourced from K-Factor Engineering fixture data.
 */
function buildMockStore(overrides?: {
  financial?: Partial<ValuationDataStore['financial']>;
  valuation?: Partial<ValuationDataStore['valuation']>;
  company?: Partial<ValuationDataStore['company']>;
  balance_sheet?: Partial<ValuationDataStore['balance_sheet']>;
  metadata?: Partial<ValuationDataStore['metadata']>;
}): ValuationDataStore {
  const baseFinancial: ValuationDataStore['financial'] = {
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
  };

  const baseValuation: ValuationDataStore['valuation'] = {
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
  };

  const baseCompany: ValuationDataStore['company'] = {
    name: 'K-Factor Engineering, LLC',
    industry: 'Engineering Services',
    naics_code: '541330',
    sic_code: '',
    entity_type: 'S-Corporation',
    fiscal_year_end: '2024-12-31',
    location: '',
    years_in_business: 0,
  };

  const baseBalanceSheet: ValuationDataStore['balance_sheet'] = {
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
  };

  const baseMetadata: ValuationDataStore['metadata'] = {
    report_date: '2025-01-20',
    valuation_date: '2025-01-15',
    generated_at: new Date().toISOString(),
    engine_version: '1.0.0',
    total_calc_steps: 10,
  };

  const baseRisk: ValuationDataStore['risk'] = {
    overall_score: 50,
    overall_rating: 'Moderate',
    factors: [],
  };

  const baseDataQuality: ValuationDataStore['data_quality'] = {
    completeness_score: 85,
    years_of_data: 3,
    missing_fields: [],
  };

  return {
    financial: { ...baseFinancial, ...overrides?.financial },
    valuation: { ...baseValuation, ...overrides?.valuation },
    company: { ...baseCompany, ...overrides?.company },
    balance_sheet: { ...baseBalanceSheet, ...overrides?.balance_sheet },
    metadata: { ...baseMetadata, ...overrides?.metadata },
    risk: baseRisk,
    data_quality: baseDataQuality,
  };
}

describe('ConsistencyValidator', () => {
  describe('financial data validation', () => {
    it('should pass for consistent financial data', () => {
      const store = buildMockStore();
      const validator = createConsistencyValidator(store);
      const result = validator.validateFinancials();

      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect negative revenue', () => {
      const store = buildMockStore({
        financial: { revenue: -100_000 },
      });

      const validator = createConsistencyValidator(store);
      const result = validator.validateFinancials();

      expect(result.passed).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should warn on significant revenue decline', () => {
      const store = buildMockStore({
        financial: {
          revenue: 3_000_000,
          revenue_by_year: [
            { period: '2024', revenue: 3_000_000 }, // Current year - big drop
            { period: '2023', revenue: 6_106_416 }, // Prior year 1
            { period: '2022', revenue: 6_000_000 }, // Prior year 2
          ],
        },
      });

      const validator = createConsistencyValidator(store);
      const result = validator.validateFinancials();

      expect(result.warnings.some((w) => w.includes('decline') || w.includes('decrease'))).toBe(true);
    });
  });

  describe('balance sheet validation', () => {
    it('should pass for balanced balance sheet', () => {
      const store = buildMockStore();
      const validator = createConsistencyValidator(store);
      const result = validator.validateBalanceSheet();

      expect(result.passed).toBe(true);
    });

    it('should detect imbalanced balance sheet', () => {
      const store = buildMockStore({
        balance_sheet: {
          total_assets: 5_000_000, // Doesn't match liabilities + equity
          total_liabilities: 618_000,
          total_equity: 1_333_000,
        },
      });

      const validator = createConsistencyValidator(store);
      const result = validator.validateBalanceSheet();

      expect(result.passed).toBe(false);
      expect(result.errors.some((e) => e.includes('balance') || e.includes('Assets'))).toBe(true);
    });

    it('should warn on negative equity', () => {
      const store = buildMockStore({
        balance_sheet: {
          total_equity: -1_700_000,
          total_assets: 618_000 - 1_700_000, // liabilities + equity
          total_liabilities: 618_000,
        },
      });

      const validator = createConsistencyValidator(store);
      const result = validator.validateBalanceSheet();

      expect(result.warnings.some((w) => w.includes('negative') || w.includes('equity'))).toBe(true);
    });
  });

  describe('calculation validation', () => {
    it('should validate SDE calculation consistency', () => {
      const store = buildMockStore();
      const validator = createConsistencyValidator(store);
      const result = validator.validateCalculations();

      expect(result.passed).toBe(true);
    });

    it('should validate that SDE is greater than net income', () => {
      const store = buildMockStore();

      // SDE should always be >= net income (since it adds back items)
      expect(store.financial.sde).toBeGreaterThanOrEqual(
        store.financial.net_income
      );
    });
  });

  describe('valuation validation', () => {
    it('should validate valuation range consistency', () => {
      const store = buildMockStore({
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

      const validator = createConsistencyValidator(store);
      const result = validator.validateValuation();

      expect(result.passed).toBe(true);
    });

    it('should detect final value outside range', () => {
      const store = buildMockStore({
        valuation: {
          asset_approach_value: 1_500_000,
          income_approach_value: 2_200_000,
          market_approach_value: 2_800_000,
          final_value: 5_000_000, // Outside the range
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

      const validator = createConsistencyValidator(store);
      const result = validator.validateValuation();

      expect(result.passed).toBe(false);
      expect(result.errors.some((e) => e.includes('range') || e.includes('outside'))).toBe(true);
    });

    it('should warn on large spread between approaches', () => {
      const store = buildMockStore({
        valuation: {
          asset_approach_value: 500_000, // Very low
          income_approach_value: 2_200_000,
          market_approach_value: 4_000_000, // Very high - 8x difference from asset
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

      const validator = createConsistencyValidator(store);
      const result = validator.validateValuation();

      expect(result.warnings.some((w) => w.includes('spread') || w.includes('variance'))).toBe(true);
    });
  });

  describe('full validation', () => {
    it('should run all validations and return combined result', () => {
      const store = buildMockStore();
      const validator = createConsistencyValidator(store);
      const result = validator.validateAll();

      expect(result.overall_passed).toBe(true);
      expect(result.sections).toHaveProperty('financials');
      expect(result.sections).toHaveProperty('balance_sheet');
      expect(result.sections).toHaveProperty('calculations');
    });

    it('should fail overall if any critical section fails', () => {
      const store = buildMockStore({
        balance_sheet: {
          total_assets: 10_000_000, // Severely imbalanced
          total_liabilities: 618_000,
          total_equity: 1_333_000,
        },
      });

      const validator = createConsistencyValidator(store);
      const result = validator.validateAll();

      expect(result.overall_passed).toBe(false);
    });
  });

  describe('error severity', () => {
    it('should categorize errors by severity', () => {
      const store = buildMockStore();
      const validator = createConsistencyValidator(store);
      const result = validator.validateAll();

      // Should have severity info available
      expect(result).toHaveProperty('error_count');
      expect(result).toHaveProperty('warning_count');
    });
  });
});
