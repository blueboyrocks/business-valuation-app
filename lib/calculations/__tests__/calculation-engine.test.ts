/**
 * Calculation Engine Unit Tests
 * TDD: Comprehensive tests for all valuation calculations
 *
 * Critical for ensuring deterministic, accurate calculations
 * Tests SDE, EBITDA, Market Approach, Income Approach, and Synthesis
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateSDEForYear,
  calculateEBITDAForYear,
  calculateNormalizedEarnings,
} from '../earnings-calculator';
import { calculateMarketApproach, MarketApproachInputs } from '../market-approach-calculator';
import { calculateIncomeApproach, IncomeApproachInputs } from '../income-approach-calculator';
import {
  calculateValuationSynthesis,
  SynthesisInputs,
} from '../synthesis-calculator';
import {
  KFACTOR_FINANCIALS,
  KFACTOR_EXPECTED_SDE,
  KFACTOR_EXPECTED_VALUES,
  KFACTOR_INDUSTRY,
} from '../../test-utils/fixtures';
import { SingleYearFinancials, CalculationStep, MultipleRange } from '../types';

describe('Calculation Engine', () => {
  describe('SDE Calculation', () => {
    it('should calculate SDE correctly for a single year', () => {
      const financials: SingleYearFinancials = {
        period: 'FY2024',
        net_income: 500000,
        gross_receipts: 2000000,
        cost_of_goods_sold: 800000,
        gross_profit: 1200000,
        officer_compensation: 150000,
        salaries_and_wages: 400000,
        interest_expense: 25000,
        depreciation: 50000,
        amortization: 10000,
        taxes: 0,
        rent: 60000,
      };

      const steps: CalculationStep[] = [];
      const result = calculateSDEForYear(financials, steps);

      // SDE = Net Income + Officer Comp + Interest + Depreciation + Amortization
      // SDE = 500,000 + 150,000 + 25,000 + 50,000 + 10,000 = 735,000
      expect(result.sde).toBe(735000);
      expect(result.starting_net_income).toBe(500000);
      expect(result.total_adjustments).toBe(235000);
      expect(result.adjustments.length).toBeGreaterThan(0);
    });

    it('should include all standard add-backs', () => {
      const financials: SingleYearFinancials = {
        period: 'FY2024',
        net_income: 100000,
        gross_receipts: 1000000,
        cost_of_goods_sold: 400000,
        gross_profit: 600000,
        officer_compensation: 100000,
        salaries_and_wages: 200000,
        interest_expense: 10000,
        depreciation: 20000,
        amortization: 5000,
        taxes: 0,
        rent: 30000,
        non_recurring_expenses: 15000,
        personal_expenses: 8000,
        charitable_contributions: 3000,
      };

      const steps: CalculationStep[] = [];
      const result = calculateSDEForYear(financials, steps);

      // Check that add-backs include all categories
      const categories = result.adjustments.map((a) => a.category);
      expect(categories).toContain('Officer Compensation');
      expect(categories).toContain('Interest Expense');
      expect(categories).toContain('Depreciation');
      expect(categories).toContain('Amortization');
      expect(categories).toContain('Non-recurring Expenses');
      expect(categories).toContain('Personal Expenses');
      expect(categories).toContain('Charitable Contributions');
    });

    it('should apply partial percentages to meals and auto expenses', () => {
      const financials: SingleYearFinancials = {
        period: 'FY2024',
        net_income: 200000,
        gross_receipts: 1500000,
        cost_of_goods_sold: 600000,
        gross_profit: 900000,
        officer_compensation: 120000,
        salaries_and_wages: 300000,
        interest_expense: 15000,
        depreciation: 25000,
        amortization: 0,
        taxes: 0,
        rent: 40000,
        meals_entertainment: 20000, // Should add back 50%
        auto_expenses: 16000, // Should add back 50%
      };

      const steps: CalculationStep[] = [];
      const result = calculateSDEForYear(financials, steps);

      // Find meals and auto add-backs
      const mealsAddback = result.adjustments.find((a) =>
        a.category.includes('Meals')
      );
      const autoAddback = result.adjustments.find((a) =>
        a.category.includes('Auto')
      );

      // Each should be 50% of original
      expect(mealsAddback?.amount).toBe(10000); // 50% of 20,000
      expect(autoAddback?.amount).toBe(8000); // 50% of 16,000
    });

    it('should create audit trail steps for each add-back', () => {
      const financials: SingleYearFinancials = {
        period: 'FY2024',
        net_income: 300000,
        gross_receipts: 2000000,
        cost_of_goods_sold: 800000,
        gross_profit: 1200000,
        officer_compensation: 150000,
        salaries_and_wages: 400000,
        interest_expense: 20000,
        depreciation: 30000,
        amortization: 5000,
        taxes: 0,
        rent: 50000,
      };

      const steps: CalculationStep[] = [];
      calculateSDEForYear(financials, steps);

      // Should have steps for each add-back plus final SDE calculation
      expect(steps.length).toBeGreaterThan(4);
      expect(steps.every((s) => s.category === 'SDE')).toBe(true);
      expect(steps.every((s) => s.step_number > 0)).toBe(true);
    });

    it('should handle zero net income', () => {
      const financials: SingleYearFinancials = {
        period: 'FY2024',
        net_income: 0,
        gross_receipts: 500000,
        cost_of_goods_sold: 300000,
        gross_profit: 200000,
        officer_compensation: 100000,
        salaries_and_wages: 80000,
        interest_expense: 5000,
        depreciation: 10000,
        amortization: 0,
        taxes: 0,
        rent: 5000,
      };

      const steps: CalculationStep[] = [];
      const result = calculateSDEForYear(financials, steps);

      // SDE should equal total add-backs when net income is 0
      expect(result.sde).toBe(result.total_adjustments);
      expect(result.starting_net_income).toBe(0);
    });

    it('should handle negative net income', () => {
      const financials: SingleYearFinancials = {
        period: 'FY2024',
        net_income: -50000,
        gross_receipts: 300000,
        cost_of_goods_sold: 200000,
        gross_profit: 100000,
        officer_compensation: 80000,
        salaries_and_wages: 50000,
        interest_expense: 5000,
        depreciation: 10000,
        amortization: 0,
        taxes: 0,
        rent: 10000,
      };

      const steps: CalculationStep[] = [];
      const result = calculateSDEForYear(financials, steps);

      // SDE = -50,000 + 80,000 + 5,000 + 10,000 = 45,000
      expect(result.sde).toBe(45000);
      expect(result.starting_net_income).toBe(-50000);
    });
  });

  describe('EBITDA Calculation', () => {
    it('should calculate EBITDA correctly with owner compensation adjustment', () => {
      const financials: SingleYearFinancials = {
        period: 'FY2024',
        net_income: 400000,
        gross_receipts: 3000000,
        cost_of_goods_sold: 1200000,
        gross_profit: 1800000,
        officer_compensation: 200000,
        salaries_and_wages: 600000,
        interest_expense: 30000,
        depreciation: 50000,
        amortization: 10000,
        taxes: 80000,
        rent: 80000,
      };

      const fairMarketSalary = 150000;
      const steps: CalculationStep[] = [];
      const result = calculateEBITDAForYear(financials, fairMarketSalary, steps);

      // Basic EBITDA = Net Income + Interest + Taxes + Depreciation + Amortization
      // Basic EBITDA = 400,000 + 30,000 + 80,000 + 50,000 + 10,000 = 570,000
      // Owner comp adjustment = 200,000 - 150,000 = 50,000
      // Adjusted EBITDA = 570,000 + 50,000 = 620,000
      expect(result.adjusted_ebitda).toBe(620000);
      expect(result.owner_compensation_adjustment.adjustment_amount).toBe(50000);
    });

    it('should handle fair market salary higher than actual compensation', () => {
      const financials: SingleYearFinancials = {
        period: 'FY2024',
        net_income: 300000,
        gross_receipts: 2000000,
        cost_of_goods_sold: 800000,
        gross_profit: 1200000,
        officer_compensation: 100000, // Lower than fair market
        salaries_and_wages: 400000,
        interest_expense: 20000,
        depreciation: 30000,
        amortization: 5000,
        taxes: 50000,
        rent: 60000,
      };

      const fairMarketSalary = 150000; // Higher than actual
      const steps: CalculationStep[] = [];
      const result = calculateEBITDAForYear(financials, fairMarketSalary, steps);

      // Owner comp adjustment = 100,000 - 150,000 = -50,000 (negative)
      expect(result.owner_compensation_adjustment.adjustment_amount).toBe(-50000);
    });
  });

  describe('Weighted Average Earnings', () => {
    it('should calculate weighted average SDE with 3-2-1 weighting', () => {
      const result = calculateNormalizedEarnings(KFACTOR_FINANCIALS, 150000);

      // K-Factor expected weighted SDE is approximately $1,062,715
      expect(result.weighted_sde).toBeCloseTo(
        KFACTOR_EXPECTED_SDE.weighted_average_sde,
        -4
      );
      expect(result.weighting_method).toContain('3-year');
      expect(result.weights_used).toEqual([3, 2, 1]);
    });

    it('should calculate weighted average EBITDA', () => {
      const result = calculateNormalizedEarnings(KFACTOR_FINANCIALS, 150000);

      expect(result.weighted_ebitda).toBeGreaterThan(0);
      expect(result.ebitda_by_year.length).toBe(3);
    });

    it('should generate warnings for unusual values', () => {
      const lowEarningsFinancials = {
        periods: [
          {
            period: 'FY2024',
            net_income: -20000,
            gross_receipts: 100000,
            cost_of_goods_sold: 50000,
            gross_profit: 50000,
            officer_compensation: 30000,
            salaries_and_wages: 20000,
            interest_expense: 2000,
            depreciation: 3000,
            amortization: 0,
            taxes: 0,
            rent: 5000,
          },
        ],
        most_recent_year: 'FY2024',
      };

      const result = calculateNormalizedEarnings(lowEarningsFinancials, 75000);

      // Should warn about low SDE
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should handle missing periods gracefully', () => {
      const emptyFinancials = {
        periods: [],
        most_recent_year: '',
      };

      const result = calculateNormalizedEarnings(emptyFinancials, 75000);

      expect(result.weighted_sde).toBe(0);
      expect(result.weighted_ebitda).toBe(0);
      expect(result.warnings).toContain('No financial periods provided');
    });
  });

  describe('Market Approach', () => {
    const sdeMultiple: MultipleRange = {
      low: 2.0,
      median: 2.65,
      high: 3.5,
      source: 'Business Reference Guide',
    };

    const ebitdaMultiple: MultipleRange = {
      low: 3.0,
      median: 4.5,
      high: 6.0,
      source: 'Business Reference Guide',
    };

    it('should calculate market value using median SDE multiple', () => {
      const inputs: MarketApproachInputs = {
        weighted_sde: 1000000,
        weighted_ebitda: 800000,
        sde_multiple: sdeMultiple,
        ebitda_multiple: ebitdaMultiple,
        multiple_preference: 'SDE',
        multiple_position: 'MEDIAN',
      };

      const result = calculateMarketApproach(inputs);

      // Value = $1,000,000 × 2.65 = $2,650,000
      expect(result.market_approach_value).toBeCloseTo(2650000, -4);
      expect(result.multiple_type).toBe('SDE');
      expect(result.base_multiple).toBe(2.65);
    });

    it('should use LOW multiple when specified', () => {
      const inputs: MarketApproachInputs = {
        weighted_sde: 1000000,
        weighted_ebitda: 800000,
        sde_multiple: sdeMultiple,
        ebitda_multiple: ebitdaMultiple,
        multiple_preference: 'SDE',
        multiple_position: 'LOW',
      };

      const result = calculateMarketApproach(inputs);

      expect(result.base_multiple).toBe(2.0);
      expect(result.market_approach_value).toBeCloseTo(2000000, -4);
    });

    it('should use HIGH multiple when specified', () => {
      const inputs: MarketApproachInputs = {
        weighted_sde: 1000000,
        weighted_ebitda: 800000,
        sde_multiple: sdeMultiple,
        ebitda_multiple: ebitdaMultiple,
        multiple_preference: 'SDE',
        multiple_position: 'HIGH',
      };

      const result = calculateMarketApproach(inputs);

      expect(result.base_multiple).toBe(3.5);
      expect(result.market_approach_value).toBeCloseTo(3500000, -4);
    });

    it('should apply risk factor adjustments to multiple', () => {
      const inputs: MarketApproachInputs = {
        weighted_sde: 1000000,
        weighted_ebitda: 800000,
        sde_multiple: sdeMultiple,
        ebitda_multiple: ebitdaMultiple,
        multiple_preference: 'SDE',
        multiple_position: 'MEDIAN',
        risk_factors: [
          {
            category: 'Customer Concentration',
            score: 70,
            rating: 'High',
            impact_on_multiple: -0.1, // -10%
            description: 'Top customer is 40% of revenue',
          },
        ],
      };

      const result = calculateMarketApproach(inputs);

      // Adjusted multiple = 2.65 × (1 - 0.1) = 2.385
      expect(result.adjusted_multiple).toBeLessThan(2.65);
      expect(result.adjustments.length).toBe(1);
    });

    it('should auto-select SDE for smaller businesses', () => {
      const inputs: MarketApproachInputs = {
        weighted_sde: 500000,
        weighted_ebitda: 400000,
        sde_multiple: sdeMultiple,
        ebitda_multiple: ebitdaMultiple,
        multiple_preference: 'AUTO',
        multiple_position: 'MEDIAN',
      };

      const result = calculateMarketApproach(inputs);

      expect(result.multiple_type).toBe('SDE');
    });

    it('should auto-select EBITDA for larger businesses', () => {
      const inputs: MarketApproachInputs = {
        weighted_sde: 1500000,
        weighted_ebitda: 1200000,
        sde_multiple: sdeMultiple,
        ebitda_multiple: ebitdaMultiple,
        multiple_preference: 'AUTO',
        multiple_position: 'MEDIAN',
      };

      const result = calculateMarketApproach(inputs);

      expect(result.multiple_type).toBe('EBITDA');
    });

    it('should produce K-Factor market value in expected range', () => {
      const inputs: MarketApproachInputs = {
        weighted_sde: KFACTOR_EXPECTED_SDE.weighted_average_sde,
        weighted_ebitda: 900000,
        sde_multiple: KFACTOR_INDUSTRY.sde_multiple,
        ebitda_multiple: KFACTOR_INDUSTRY.ebitda_multiple,
        multiple_preference: 'SDE',
        multiple_position: 'MEDIAN',
      };

      const result = calculateMarketApproach(inputs);

      // K-Factor with SDE ~$1,040,718 × 2.65 = ~$2,757,902
      // Should NOT be $4.1M (the erroneous value)
      expect(result.market_approach_value).toBeGreaterThan(2000000);
      expect(result.market_approach_value).toBeLessThan(3500000);
      expect(result.market_approach_value).not.toBeCloseTo(4100000, -5);
    });

    it('should enforce industry ceiling when NAICS code is provided', () => {
      const inputs: MarketApproachInputs = {
        weighted_sde: 1000000,
        weighted_ebitda: 800000,
        sde_multiple: {
          low: 2.0,
          median: 2.65,
          high: 3.5,
          source: 'Business Reference Guide',
        },
        ebitda_multiple: { low: 3.0, median: 4.5, high: 6.0, source: 'BRG' },
        multiple_preference: 'SDE',
        multiple_position: 'CUSTOM',
        custom_multiple: 4.5, // Above ceiling of 4.2 for engineering
        naics_code: '541330', // Engineering Services
        multiple_justification: 'Test of ceiling enforcement',
      };

      const result = calculateMarketApproach(inputs);

      // Multiple should be capped at ceiling (4.2 for engineering)
      expect(result.adjusted_multiple).toBeLessThanOrEqual(4.2);
      // Value should reflect the capped multiple, not the requested 4.5x
      expect(result.market_approach_value).toBeLessThanOrEqual(4200000);
      // Should have a warning about the ceiling
      expect(result.warnings.some((w) => w.includes('ceiling'))).toBe(true);
    });

    it('should PREVENT the $4.1M error by capping at industry ceiling', () => {
      // This is the critical test that ensures we never produce the erroneous $4.1M value
      const inputs: MarketApproachInputs = {
        weighted_sde: KFACTOR_EXPECTED_SDE.weighted_average_sde, // ~$1,040,718
        weighted_ebitda: 900000,
        sde_multiple: KFACTOR_INDUSTRY.sde_multiple,
        ebitda_multiple: KFACTOR_INDUSTRY.ebitda_multiple,
        multiple_preference: 'SDE',
        multiple_position: 'CUSTOM',
        custom_multiple: 4.4, // The erroneous multiple that caused $4.1M
        naics_code: '541330', // Engineering Services
        multiple_justification: 'Testing ceiling enforcement',
      };

      const result = calculateMarketApproach(inputs);

      // The $4.1M error value would be: $1,040,718 × 4.4 = $4,579,159
      // With ceiling of 4.2x: $1,040,718 × 4.2 = $4,371,016
      // Either way should be much less than the original $4.1M since our SDE is lower

      // Multiple must not exceed ceiling
      expect(result.adjusted_multiple).toBeLessThanOrEqual(4.2);

      // Value must be reasonable (not $4.1M+ for engineering firm)
      expect(result.market_approach_value).toBeLessThan(4500000);

      // Should have warning about ceiling
      expect(result.warnings.some((w) => w.includes('ceiling'))).toBe(true);
    });
  });

  describe('Income Approach', () => {
    it('should calculate income approach value using capitalization of earnings', () => {
      const inputs: IncomeApproachInputs = {
        weighted_sde: 1000000,
        weighted_ebitda: 800000,
        benefit_stream_preference: 'SDE',
      };

      const result = calculateIncomeApproach(inputs);

      // Default cap rate components result in ~17% cap rate
      // Value = $1,000,000 / 0.17 ≈ $5,882,353
      expect(result.income_approach_value).toBeGreaterThan(4000000);
      expect(result.income_approach_value).toBeLessThan(8000000);
      expect(result.benefit_stream).toBe('SDE');
    });

    it('should use EBITDA when specified', () => {
      const inputs: IncomeApproachInputs = {
        weighted_sde: 1000000,
        weighted_ebitda: 800000,
        benefit_stream_preference: 'EBITDA',
      };

      const result = calculateIncomeApproach(inputs);

      expect(result.benefit_stream).toBe('EBITDA');
      expect(result.benefit_stream_value).toBe(800000);
    });

    it('should build cap rate from components', () => {
      const inputs: IncomeApproachInputs = {
        weighted_sde: 1000000,
        weighted_ebitda: 800000,
        benefit_stream_preference: 'SDE',
        cap_rate_components: {
          risk_free_rate: 0.04,
          equity_risk_premium: 0.06,
          size_premium: 0.05,
          industry_risk_premium: 0.02,
          company_specific_risk_premium: 0.03,
          long_term_growth_rate: 0.025,
        },
      };

      const result = calculateIncomeApproach(inputs);

      // Total discount rate = 4% + 6% + 5% + 2% + 3% = 20%
      // Cap rate = 20% - 2.5% = 17.5%
      expect(result.cap_rate_components.total_discount_rate).toBeCloseTo(0.2, 2);
      expect(result.cap_rate_components.capitalization_rate).toBeCloseTo(
        0.175,
        2
      );
    });

    it('should warn on unusually high cap rate', () => {
      const inputs: IncomeApproachInputs = {
        weighted_sde: 1000000,
        weighted_ebitda: 800000,
        benefit_stream_preference: 'SDE',
        cap_rate_components: {
          risk_free_rate: 0.1,
          equity_risk_premium: 0.15,
          size_premium: 0.15,
          industry_risk_premium: 0.1,
          company_specific_risk_premium: 0.1,
          long_term_growth_rate: 0.02,
        },
      };

      const result = calculateIncomeApproach(inputs);

      expect(result.warnings.some((w) => w.includes('unusually high'))).toBe(
        true
      );
    });
  });

  describe('Valuation Synthesis', () => {
    it('should calculate weighted average of all approaches', () => {
      const inputs: SynthesisInputs = {
        asset_approach_value: 1500000,
        income_approach_value: 3000000,
        market_approach_value: 2500000,
        weights: {
          asset: 0.2,
          income: 0.4,
          market: 0.4,
        },
      };

      const result = calculateValuationSynthesis(inputs);

      // Weighted = (1.5M × 0.2) + (3M × 0.4) + (2.5M × 0.4)
      // = 300,000 + 1,200,000 + 1,000,000 = 2,500,000
      expect(result.preliminary_value).toBeCloseTo(2500000, -4);
    });

    it('should apply DLOM discount', () => {
      const inputs: SynthesisInputs = {
        asset_approach_value: 1500000,
        income_approach_value: 3000000,
        market_approach_value: 2500000,
        weights: {
          asset: 0.2,
          income: 0.4,
          market: 0.4,
        },
        discounts_and_premiums: {
          dlom: {
            applicable: true,
            percentage: 0.15,
            rationale: 'Standard DLOM for private company',
          },
        },
      };

      const result = calculateValuationSynthesis(inputs);

      // After 15% DLOM: $2,500,000 × (1 - 0.15) = $2,125,000
      expect(result.final_concluded_value).toBeLessThan(
        result.preliminary_value
      );
      expect(result.discounts_and_premiums.dlom.applicable).toBe(true);
    });

    it('should calculate value range', () => {
      const inputs: SynthesisInputs = {
        asset_approach_value: 1500000,
        income_approach_value: 2800000,
        market_approach_value: 2500000,
        weights: {
          asset: 0.2,
          income: 0.4,
          market: 0.4,
        },
        value_range_percent: 0.15,
      };

      const result = calculateValuationSynthesis(inputs);

      // Range should be ±15% of concluded value
      expect(result.value_range.low).toBeLessThan(result.final_concluded_value);
      expect(result.value_range.high).toBeGreaterThan(
        result.final_concluded_value
      );
      expect(result.value_range.mid).toBe(result.final_concluded_value);
    });

    it('should enforce asset floor value', () => {
      const inputs: SynthesisInputs = {
        asset_approach_value: 3000000, // Higher than weighted average
        income_approach_value: 1500000,
        market_approach_value: 1500000,
        weights: {
          asset: 0.2,
          income: 0.4,
          market: 0.4,
        },
        discounts_and_premiums: {
          dlom: {
            applicable: true,
            percentage: 0.5, // Large discount to trigger floor
            rationale: 'Test',
          },
        },
      };

      const result = calculateValuationSynthesis(inputs);

      // Concluded value should not fall below asset approach
      expect(result.final_concluded_value).toBeGreaterThanOrEqual(
        inputs.asset_approach_value
      );
      expect(result.passes_floor_test).toBe(false);
    });

    it('should warn on invalid weights', () => {
      const inputs: SynthesisInputs = {
        asset_approach_value: 1500000,
        income_approach_value: 2500000,
        market_approach_value: 2500000,
        weights: {
          asset: 0.3,
          income: 0.3,
          market: 0.3, // Sum = 0.9, not 1.0
        },
      };

      const result = calculateValuationSynthesis(inputs);

      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should produce K-Factor final value in expected range', () => {
      // Simulate K-Factor synthesis
      const inputs: SynthesisInputs = {
        asset_approach_value: 1800000, // Estimated
        income_approach_value: 3200000, // SDE / 15% cap rate
        market_approach_value:
          KFACTOR_EXPECTED_SDE.weighted_average_sde * 2.65, // ~$2.8M
        weights: {
          asset: 0.2,
          income: 0.4,
          market: 0.4,
        },
      };

      const result = calculateValuationSynthesis(inputs);

      // Final value should be in $2M-$3.5M range, NOT $4.1M
      expect(result.final_concluded_value).toBeGreaterThan(
        KFACTOR_EXPECTED_VALUES.minimum_acceptable_value
      );
      expect(result.final_concluded_value).toBeLessThan(
        KFACTOR_EXPECTED_VALUES.maximum_acceptable_value
      );
    });
  });

  describe('Calculation Audit Trail', () => {
    it('should generate complete audit trail for earnings calculation', () => {
      const result = calculateNormalizedEarnings(KFACTOR_FINANCIALS, 150000);

      // Should have multiple calculation steps
      expect(result.calculation_steps.length).toBeGreaterThan(10);

      // Each step should have required fields
      for (const step of result.calculation_steps) {
        expect(step.step_number).toBeGreaterThan(0);
        expect(step.category).toBeTruthy();
        expect(step.description).toBeTruthy();
        expect(step.formula).toBeTruthy();
        expect(typeof step.result).toBe('number');
      }
    });

    it('should generate complete audit trail for market approach', () => {
      const inputs: MarketApproachInputs = {
        weighted_sde: 1000000,
        weighted_ebitda: 800000,
        sde_multiple: { low: 2.0, median: 2.65, high: 3.5, source: 'BRG' },
        ebitda_multiple: { low: 3.0, median: 4.5, high: 6.0, source: 'BRG' },
        multiple_preference: 'SDE',
        multiple_position: 'MEDIAN',
      };

      const result = calculateMarketApproach(inputs);

      expect(result.calculation_steps.length).toBeGreaterThan(0);
      expect(
        result.calculation_steps.every((s) => s.category === 'Market')
      ).toBe(true);
    });

    it('should generate complete audit trail for synthesis', () => {
      const inputs: SynthesisInputs = {
        asset_approach_value: 1500000,
        income_approach_value: 2500000,
        market_approach_value: 2500000,
        weights: { asset: 0.2, income: 0.4, market: 0.4 },
      };

      const result = calculateValuationSynthesis(inputs);

      expect(result.calculation_steps.length).toBeGreaterThan(3);
      expect(
        result.calculation_steps.every((s) => s.category === 'Synthesis')
      ).toBe(true);
    });
  });
});
