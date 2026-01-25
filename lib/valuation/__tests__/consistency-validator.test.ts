/**
 * ConsistencyValidator Unit Tests
 * TDD: Tests written before implementation
 */
import { describe, it, expect } from 'vitest';
import {
  ConsistencyValidator,
  createConsistencyValidator,
  ValidationSeverity,
} from '../consistency-validator';
import { createValuationDataStore } from '../data-store';
import {
  KFACTOR_FINANCIALS,
  KFACTOR_BALANCE_SHEET,
  KFACTOR_DATE_CONFIG,
  ENGINEERING_SERVICES_INDUSTRY,
} from '../../test-utils/fixtures';

describe('ConsistencyValidator', () => {
  describe('financial data validation', () => {
    it('should pass for consistent financial data', () => {
      const store = createValuationDataStore({
        company_name: 'K-Factor Engineering, LLC',
        financials: KFACTOR_FINANCIALS,
        balance_sheet: KFACTOR_BALANCE_SHEET,
        industry: ENGINEERING_SERVICES_INDUSTRY,
        valuation_date: KFACTOR_DATE_CONFIG.valuation_date,
        fiscal_year_end: KFACTOR_DATE_CONFIG.fiscal_year_end,
      });

      const validator = createConsistencyValidator(store);
      const result = validator.validateFinancials();

      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect negative revenue', () => {
      const invalidFinancials = {
        ...KFACTOR_FINANCIALS,
        periods: [
          { ...KFACTOR_FINANCIALS.periods[0], gross_receipts: -100000 },
          ...KFACTOR_FINANCIALS.periods.slice(1),
        ],
      };

      // This should fail at store creation level, but validator should also catch it
      expect(() =>
        createValuationDataStore({
          company_name: 'Test',
          financials: invalidFinancials,
          balance_sheet: KFACTOR_BALANCE_SHEET,
          industry: ENGINEERING_SERVICES_INDUSTRY,
          valuation_date: '2025-01-15',
          fiscal_year_end: '2024-12-31',
        })
      ).toThrow();
    });

    it('should warn on significant revenue decline', () => {
      const decliningFinancials = {
        periods: [
          { ...KFACTOR_FINANCIALS.periods[0], gross_receipts: 3_000_000 }, // Current year - big drop
          { ...KFACTOR_FINANCIALS.periods[1], gross_receipts: 6_106_416 }, // Prior year 1
          { ...KFACTOR_FINANCIALS.periods[2], gross_receipts: 6_000_000 }, // Prior year 2
        ],
        most_recent_year: '2024',
      };

      const store = createValuationDataStore({
        company_name: 'Test',
        financials: decliningFinancials,
        balance_sheet: KFACTOR_BALANCE_SHEET,
        industry: ENGINEERING_SERVICES_INDUSTRY,
        valuation_date: '2025-01-15',
        fiscal_year_end: '2024-12-31',
      });

      const validator = createConsistencyValidator(store);
      const result = validator.validateFinancials();

      expect(result.warnings.some((w) => w.includes('decline') || w.includes('decrease'))).toBe(true);
    });
  });

  describe('balance sheet validation', () => {
    it('should pass for balanced balance sheet', () => {
      const store = createValuationDataStore({
        company_name: 'Test',
        financials: KFACTOR_FINANCIALS,
        balance_sheet: KFACTOR_BALANCE_SHEET,
        industry: ENGINEERING_SERVICES_INDUSTRY,
        valuation_date: '2025-01-15',
        fiscal_year_end: '2024-12-31',
      });

      const validator = createConsistencyValidator(store);
      const result = validator.validateBalanceSheet();

      expect(result.passed).toBe(true);
    });

    it('should detect imbalanced balance sheet', () => {
      const imbalancedBalanceSheet = {
        ...KFACTOR_BALANCE_SHEET,
        assets: {
          ...KFACTOR_BALANCE_SHEET.assets,
          total_assets: 5_000_000, // Doesn't match liabilities + equity
        },
      };

      const store = createValuationDataStore({
        company_name: 'Test',
        financials: KFACTOR_FINANCIALS,
        balance_sheet: imbalancedBalanceSheet,
        industry: ENGINEERING_SERVICES_INDUSTRY,
        valuation_date: '2025-01-15',
        fiscal_year_end: '2024-12-31',
      });

      const validator = createConsistencyValidator(store);
      const result = validator.validateBalanceSheet();

      expect(result.passed).toBe(false);
      expect(result.errors.some((e) => e.includes('balance') || e.includes('Assets'))).toBe(true);
    });

    it('should warn on negative equity', () => {
      const negativeEquityBalanceSheet = {
        ...KFACTOR_BALANCE_SHEET,
        equity: {
          ...KFACTOR_BALANCE_SHEET.equity,
          retained_earnings: -2_000_000,
          total_equity: -1_700_000,
        },
        assets: {
          ...KFACTOR_BALANCE_SHEET.assets,
          total_assets: KFACTOR_BALANCE_SHEET.liabilities.total_liabilities - 1_700_000,
        },
      };

      const store = createValuationDataStore({
        company_name: 'Test',
        financials: KFACTOR_FINANCIALS,
        balance_sheet: negativeEquityBalanceSheet,
        industry: ENGINEERING_SERVICES_INDUSTRY,
        valuation_date: '2025-01-15',
        fiscal_year_end: '2024-12-31',
      });

      const validator = createConsistencyValidator(store);
      const result = validator.validateBalanceSheet();

      expect(result.warnings.some((w) => w.includes('negative') || w.includes('equity'))).toBe(true);
    });
  });

  describe('calculation validation', () => {
    it('should validate SDE calculation consistency', () => {
      const store = createValuationDataStore({
        company_name: 'Test',
        financials: KFACTOR_FINANCIALS,
        balance_sheet: KFACTOR_BALANCE_SHEET,
        industry: ENGINEERING_SERVICES_INDUSTRY,
        valuation_date: '2025-01-15',
        fiscal_year_end: '2024-12-31',
      });

      const validator = createConsistencyValidator(store);
      const result = validator.validateCalculations();

      expect(result.passed).toBe(true);
    });

    it('should validate that SDE is greater than net income', () => {
      const store = createValuationDataStore({
        company_name: 'Test',
        financials: KFACTOR_FINANCIALS,
        balance_sheet: KFACTOR_BALANCE_SHEET,
        industry: ENGINEERING_SERVICES_INDUSTRY,
        valuation_date: '2025-01-15',
        fiscal_year_end: '2024-12-31',
      });

      const validator = createConsistencyValidator(store);
      const result = validator.validateCalculations();

      // SDE should always be >= net income (since it adds back items)
      expect(store.financial.sde.current_year).toBeGreaterThanOrEqual(
        store.financial.net_income.current_year
      );
    });
  });

  describe('valuation validation', () => {
    it('should validate valuation range consistency', () => {
      const store = createValuationDataStore({
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

      const validator = createConsistencyValidator(store);
      const result = validator.validateValuation();

      expect(result.passed).toBe(true);
    });

    it('should detect final value outside range', () => {
      const store = createValuationDataStore({
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
          final_value: 5_000_000, // Outside the range
          value_range_low: 2_125_000,
          value_range_high: 2_875_000,
        },
      });

      const validator = createConsistencyValidator(store);
      const result = validator.validateValuation();

      expect(result.passed).toBe(false);
      expect(result.errors.some((e) => e.includes('range') || e.includes('outside'))).toBe(true);
    });

    it('should warn on large spread between approaches', () => {
      const store = createValuationDataStore({
        company_name: 'Test',
        financials: KFACTOR_FINANCIALS,
        balance_sheet: KFACTOR_BALANCE_SHEET,
        industry: ENGINEERING_SERVICES_INDUSTRY,
        valuation_date: '2025-01-15',
        fiscal_year_end: '2024-12-31',
        valuationResults: {
          asset_approach_value: 500_000, // Very low
          income_approach_value: 2_200_000,
          market_approach_value: 4_000_000, // Very high - 8x difference from asset
          weighted_value: 2_500_000,
          final_value: 2_500_000,
          value_range_low: 2_125_000,
          value_range_high: 2_875_000,
        },
      });

      const validator = createConsistencyValidator(store);
      const result = validator.validateValuation();

      expect(result.warnings.some((w) => w.includes('spread') || w.includes('variance'))).toBe(true);
    });
  });

  describe('full validation', () => {
    it('should run all validations and return combined result', () => {
      const store = createValuationDataStore({
        company_name: 'K-Factor Engineering, LLC',
        financials: KFACTOR_FINANCIALS,
        balance_sheet: KFACTOR_BALANCE_SHEET,
        industry: ENGINEERING_SERVICES_INDUSTRY,
        valuation_date: KFACTOR_DATE_CONFIG.valuation_date,
        fiscal_year_end: KFACTOR_DATE_CONFIG.fiscal_year_end,
      });

      const validator = createConsistencyValidator(store);
      const result = validator.validateAll();

      expect(result.overall_passed).toBe(true);
      expect(result.sections).toHaveProperty('financials');
      expect(result.sections).toHaveProperty('balance_sheet');
      expect(result.sections).toHaveProperty('calculations');
    });

    it('should fail overall if any critical section fails', () => {
      const imbalancedBalanceSheet = {
        ...KFACTOR_BALANCE_SHEET,
        assets: {
          ...KFACTOR_BALANCE_SHEET.assets,
          total_assets: 10_000_000, // Severely imbalanced
        },
      };

      const store = createValuationDataStore({
        company_name: 'Test',
        financials: KFACTOR_FINANCIALS,
        balance_sheet: imbalancedBalanceSheet,
        industry: ENGINEERING_SERVICES_INDUSTRY,
        valuation_date: '2025-01-15',
        fiscal_year_end: '2024-12-31',
      });

      const validator = createConsistencyValidator(store);
      const result = validator.validateAll();

      expect(result.overall_passed).toBe(false);
    });
  });

  describe('error severity', () => {
    it('should categorize errors by severity', () => {
      const store = createValuationDataStore({
        company_name: 'Test',
        financials: KFACTOR_FINANCIALS,
        balance_sheet: KFACTOR_BALANCE_SHEET,
        industry: ENGINEERING_SERVICES_INDUSTRY,
        valuation_date: '2025-01-15',
        fiscal_year_end: '2024-12-31',
      });

      const validator = createConsistencyValidator(store);
      const result = validator.validateAll();

      // Should have severity info available
      expect(result).toHaveProperty('error_count');
      expect(result).toHaveProperty('warning_count');
    });
  });
});
