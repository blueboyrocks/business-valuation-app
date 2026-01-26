/**
 * DeterministicValidator Unit Tests
 * Updated to match new ValuationDataStore interface
 *
 * Layer 1 of the QA System - Pure deterministic checks with no AI
 */
import { describe, it, expect } from 'vitest';
import {
  DeterministicValidationEngine,
  createDeterministicValidator,
  ValidationCategory,
  ValidationSeverity,
} from '../deterministic-validator';
import type { ValuationDataStore } from '../../valuation/data-store';

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
  };

  const baseCompany: ValuationDataStore['company'] = {
    name: 'K-Factor Engineering, LLC',
    industry: 'Engineering Services',
    naics_code: '541330',
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

  return {
    financial: { ...baseFinancial, ...overrides?.financial },
    valuation: { ...baseValuation, ...overrides?.valuation },
    company: { ...baseCompany, ...overrides?.company },
    balance_sheet: { ...baseBalanceSheet, ...overrides?.balance_sheet },
    metadata: { ...baseMetadata, ...overrides?.metadata },
  };
}

describe('DeterministicValidationEngine', () => {
  describe('data consistency checks', () => {
    it('should pass when all data is consistent', () => {
      const store = buildMockStore();
      const validator = createDeterministicValidator(store);
      const result = validator.validateDataConsistency();

      expect(result.passed).toBe(true);
      expect(result.critical_errors).toHaveLength(0);
    });

    it('should detect revenue mismatch across sections', () => {
      const store = buildMockStore();
      const validator = createDeterministicValidator(store);

      // Simulate a section that reports wrong revenue
      const sectionData = {
        executive_summary: { revenue: 5_000_000 }, // Wrong value
        financial_analysis: { revenue: 6_265_024 }, // Correct value
      };

      const result = validator.validateCrossSection(sectionData, 'revenue', 6_265_024);
      expect(result.passed).toBe(false);
      expect(result.errors.some((e) => e.includes('executive_summary'))).toBe(true);
    });
  });

  describe('calculation verification', () => {
    it('should verify SDE calculation is correct', () => {
      const store = buildMockStore();
      const validator = createDeterministicValidator(store);
      const result = validator.verifySDECalculation();

      expect(result.passed).toBe(true);
    });

    it('should detect incorrect SDE calculation', () => {
      // SDE less than net income indicates an error
      const store = buildMockStore({
        financial: {
          sde: 500_000, // Wrong value - less than net_income of 728_412
          weighted_sde: 500_000,
        },
      });

      const validator = createDeterministicValidator(store);
      const result = validator.verifySDECalculation();

      expect(result.passed).toBe(false);
    });

    it('should verify weighted average calculation', () => {
      const store = buildMockStore();
      const validator = createDeterministicValidator(store);
      const result = validator.verifyWeightedAverage();

      expect(result.passed).toBe(true);
    });
  });

  describe('range checks', () => {
    it('should validate revenue is within reasonable range', () => {
      const store = buildMockStore();
      const validator = createDeterministicValidator(store);
      const result = validator.validateRanges();

      expect(result.passed).toBe(true);
    });

    it('should flag unreasonable profit margins', () => {
      const store = buildMockStore({
        financial: {
          net_income: 5_600_000, // 90% of 6.2M revenue
        },
      });

      const validator = createDeterministicValidator(store);
      const result = validator.validateRanges();

      expect(result.warnings.some((w) => w.includes('margin') || w.includes('profit'))).toBe(true);
    });
  });

  describe('valuation checks', () => {
    it('should validate valuation is within expected range', () => {
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

      const validator = createDeterministicValidator(store);
      const result = validator.validateValuation();

      expect(result.passed).toBe(true);
    });

    it('should flag valuation too high (like $4.1M for K-Factor)', () => {
      const store = buildMockStore({
        valuation: {
          asset_approach_value: 1_500_000,
          income_approach_value: 2_200_000,
          market_approach_value: 4_100_000, // Way too high
          final_value: 4_100_000,
          preliminary_value: 4_100_000,
          value_range_low: 3_500_000,
          value_range_high: 4_700_000,
          sde_multiple: 2.65,
          cap_rate: 0.20,
          income_weight: 0.30,
          market_weight: 0.50,
          asset_weight: 0.20,
          dlom_percentage: 0.15,
          dlom_applied: true,
        },
      });

      const validator = createDeterministicValidator(store);
      const result = validator.validateValuation();

      // Should flag as warning or error since 4.1M is way above expected 2-3M
      expect(result.warnings.length + result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('schema validation', () => {
    it('should validate required fields are present', () => {
      const store = buildMockStore();
      const validator = createDeterministicValidator(store);
      const result = validator.validateSchema();

      expect(result.passed).toBe(true);
    });
  });

  describe('full validation', () => {
    it('should run all validations and return combined result', () => {
      const store = buildMockStore();
      const validator = createDeterministicValidator(store);
      const result = validator.runAllValidations();

      expect(result.overall_passed).toBe(true);
      expect(result.categories).toHaveProperty('data_consistency');
      expect(result.categories).toHaveProperty('calculations');
      expect(result.categories).toHaveProperty('ranges');
      expect(result.categories).toHaveProperty('schema');
    });

    it('should categorize errors by severity', () => {
      const store = buildMockStore();
      const validator = createDeterministicValidator(store);
      const result = validator.runAllValidations();

      expect(result.critical_count).toBeDefined();
      expect(result.error_count).toBeDefined();
      expect(result.warning_count).toBeDefined();
    });
  });
});
