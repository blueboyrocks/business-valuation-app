/**
 * DeterministicValidator Unit Tests
 * TDD: Tests written before implementation
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
import { createValuationDataStore } from '../../valuation/data-store';
import {
  KFACTOR_FINANCIALS,
  KFACTOR_BALANCE_SHEET,
  KFACTOR_DATE_CONFIG,
  ENGINEERING_SERVICES_INDUSTRY,
} from '../../test-utils/fixtures';

describe('DeterministicValidationEngine', () => {
  describe('data consistency checks', () => {
    it('should pass when all data is consistent', () => {
      const store = createValuationDataStore({
        company_name: 'K-Factor Engineering, LLC',
        financials: KFACTOR_FINANCIALS,
        balance_sheet: KFACTOR_BALANCE_SHEET,
        industry: ENGINEERING_SERVICES_INDUSTRY,
        valuation_date: KFACTOR_DATE_CONFIG.valuation_date,
        fiscal_year_end: KFACTOR_DATE_CONFIG.fiscal_year_end,
      });

      const validator = createDeterministicValidator(store);
      const result = validator.validateDataConsistency();

      expect(result.passed).toBe(true);
      expect(result.critical_errors).toHaveLength(0);
    });

    it('should detect revenue mismatch across sections', () => {
      const store = createValuationDataStore({
        company_name: 'Test',
        financials: KFACTOR_FINANCIALS,
        balance_sheet: KFACTOR_BALANCE_SHEET,
        industry: ENGINEERING_SERVICES_INDUSTRY,
        valuation_date: '2025-01-15',
        fiscal_year_end: '2024-12-31',
      });

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
      const store = createValuationDataStore({
        company_name: 'Test',
        financials: KFACTOR_FINANCIALS,
        balance_sheet: KFACTOR_BALANCE_SHEET,
        industry: ENGINEERING_SERVICES_INDUSTRY,
        valuation_date: '2025-01-15',
        fiscal_year_end: '2024-12-31',
      });

      const validator = createDeterministicValidator(store);
      const result = validator.verifySDECalculation();

      expect(result.passed).toBe(true);
    });

    it('should detect incorrect SDE calculation', () => {
      const store = createValuationDataStore({
        company_name: 'Test',
        financials: KFACTOR_FINANCIALS,
        balance_sheet: KFACTOR_BALANCE_SHEET,
        industry: ENGINEERING_SERVICES_INDUSTRY,
        valuation_date: '2025-01-15',
        fiscal_year_end: '2024-12-31',
        // Override with wrong SDE
        sde_calculations: {
          current_year: 500_000, // Wrong value
          prior_year_1: 0,
          prior_year_2: 0,
          weighted_average: 500_000,
          normalized: 500_000,
        },
      });

      const validator = createDeterministicValidator(store);
      const result = validator.verifySDECalculation();

      expect(result.passed).toBe(false);
    });

    it('should verify weighted average calculation', () => {
      const store = createValuationDataStore({
        company_name: 'Test',
        financials: KFACTOR_FINANCIALS,
        balance_sheet: KFACTOR_BALANCE_SHEET,
        industry: ENGINEERING_SERVICES_INDUSTRY,
        valuation_date: '2025-01-15',
        fiscal_year_end: '2024-12-31',
      });

      const validator = createDeterministicValidator(store);
      const result = validator.verifyWeightedAverage();

      expect(result.passed).toBe(true);
    });
  });

  describe('range checks', () => {
    it('should validate revenue is within reasonable range', () => {
      const store = createValuationDataStore({
        company_name: 'Test',
        financials: KFACTOR_FINANCIALS,
        balance_sheet: KFACTOR_BALANCE_SHEET,
        industry: ENGINEERING_SERVICES_INDUSTRY,
        valuation_date: '2025-01-15',
        fiscal_year_end: '2024-12-31',
      });

      const validator = createDeterministicValidator(store);
      const result = validator.validateRanges();

      expect(result.passed).toBe(true);
    });

    it('should flag unreasonable profit margins', () => {
      // Create financials with 90% profit margin (unreasonable)
      const unreasonableFinancials = {
        periods: [
          {
            ...KFACTOR_FINANCIALS.periods[0],
            net_income: 5_600_000, // 90% of 6.2M revenue
          },
        ],
        most_recent_year: '2024',
      };

      const store = createValuationDataStore({
        company_name: 'Test',
        financials: unreasonableFinancials,
        balance_sheet: KFACTOR_BALANCE_SHEET,
        industry: ENGINEERING_SERVICES_INDUSTRY,
        valuation_date: '2025-01-15',
        fiscal_year_end: '2024-12-31',
      });

      const validator = createDeterministicValidator(store);
      const result = validator.validateRanges();

      expect(result.warnings.some((w) => w.includes('margin') || w.includes('profit'))).toBe(true);
    });
  });

  describe('valuation checks', () => {
    it('should validate valuation is within expected range', () => {
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

      const validator = createDeterministicValidator(store);
      const result = validator.validateValuation();

      expect(result.passed).toBe(true);
    });

    it('should flag valuation too high (like $4.1M for K-Factor)', () => {
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
          market_approach_value: 4_100_000, // Way too high
          weighted_value: 4_100_000,
          final_value: 4_100_000,
          value_range_low: 3_500_000,
          value_range_high: 4_700_000,
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
      const store = createValuationDataStore({
        company_name: 'K-Factor Engineering, LLC',
        financials: KFACTOR_FINANCIALS,
        balance_sheet: KFACTOR_BALANCE_SHEET,
        industry: ENGINEERING_SERVICES_INDUSTRY,
        valuation_date: KFACTOR_DATE_CONFIG.valuation_date,
        fiscal_year_end: KFACTOR_DATE_CONFIG.fiscal_year_end,
      });

      const validator = createDeterministicValidator(store);
      const result = validator.validateSchema();

      expect(result.passed).toBe(true);
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

      const validator = createDeterministicValidator(store);
      const result = validator.runAllValidations();

      expect(result.overall_passed).toBe(true);
      expect(result.categories).toHaveProperty('data_consistency');
      expect(result.categories).toHaveProperty('calculations');
      expect(result.categories).toHaveProperty('ranges');
      expect(result.categories).toHaveProperty('schema');
    });

    it('should categorize errors by severity', () => {
      const store = createValuationDataStore({
        company_name: 'K-Factor Engineering, LLC',
        financials: KFACTOR_FINANCIALS,
        balance_sheet: KFACTOR_BALANCE_SHEET,
        industry: ENGINEERING_SERVICES_INDUSTRY,
        valuation_date: KFACTOR_DATE_CONFIG.valuation_date,
        fiscal_year_end: KFACTOR_DATE_CONFIG.fiscal_year_end,
      });

      const validator = createDeterministicValidator(store);
      const result = validator.runAllValidations();

      expect(result.critical_count).toBeDefined();
      expect(result.error_count).toBeDefined();
      expect(result.warning_count).toBeDefined();
    });
  });
});
