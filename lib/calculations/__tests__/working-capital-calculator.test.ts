/**
 * Working Capital Calculator Unit Tests
 */
import { describe, it, expect } from 'vitest';
import { calculateWorkingCapital } from '../working-capital-calculator';
import { BalanceSheetData, SingleYearFinancials } from '../types';

describe('Working Capital Calculator', () => {
  const sampleBalanceSheet: BalanceSheetData = {
    as_of_date: '2024-12-31',
    assets: {
      current_assets: {
        cash: 50000,
        accounts_receivable: 100000,
        inventory: 80000,
        prepaid_expenses: 10000,
        other_current_assets: 5000,
        total_current_assets: 245000,
      },
      fixed_assets: {
        property_plant_equipment: 150000,
        accumulated_depreciation: 50000,
        net_fixed_assets: 100000,
        other_assets: 5000,
      },
      total_assets: 350000,
    },
    liabilities: {
      current_liabilities: {
        accounts_payable: 50000,
        accrued_expenses: 20000,
        current_portion_long_term_debt: 10000,
        other_current_liabilities: 5000,
        total_current_liabilities: 85000,
      },
      long_term_liabilities: {
        long_term_debt: 80000,
        other_long_term_liabilities: 5000,
        total_long_term_liabilities: 85000,
      },
      total_liabilities: 170000,
    },
    equity: {
      common_stock: 50000,
      retained_earnings: 130000,
      total_equity: 180000,
    },
  };

  const sampleFinancials: SingleYearFinancials[] = [
    {
      period: '2024',
      gross_receipts: 1000000,
      cost_of_goods_sold: 600000,
      gross_profit: 400000,
      net_income: 100000,
      officer_compensation: 80000,
      depreciation: 15000,
      amortization: 5000,
      interest_expense: 10000,
      rent_expense: 24000,
      salaries_and_wages: 150000,
      taxes: 20000,
      insurance: 12000,
      utilities: 8000,
      advertising: 15000,
      repairs_maintenance: 5000,
      other_deductions: 10000,
      total_deductions: 0,
      returns_allowances: 0,
    },
  ];

  describe('calculateWorkingCapital', () => {
    it('should calculate gross working capital correctly', () => {
      const result = calculateWorkingCapital({
        balance_sheet: sampleBalanceSheet,
        financials: sampleFinancials,
        industry: 'manufacturing',
      });

      // Gross WC = Total Current Assets = 245000
      expect(result.gross_working_capital).toBe(245000);
    });

    it('should calculate net working capital correctly', () => {
      const result = calculateWorkingCapital({
        balance_sheet: sampleBalanceSheet,
        financials: sampleFinancials,
        industry: 'manufacturing',
      });

      // Net WC = Current Assets - Current Liabilities
      // 245000 - 85000 = 160000
      expect(result.net_working_capital).toBe(160000);
    });

    it('should calculate operating working capital correctly', () => {
      const result = calculateWorkingCapital({
        balance_sheet: sampleBalanceSheet,
        financials: sampleFinancials,
        industry: 'manufacturing',
      });

      // Operating WC = (AR + Inventory + Prepaids + Other) - (AP + Accrued + Other)
      // (100000 + 80000 + 10000 + 5000) - (50000 + 20000 + 5000) = 120000
      expect(result.operating_working_capital).toBe(120000);
    });

    it('should calculate normal working capital based on industry', () => {
      const result = calculateWorkingCapital({
        balance_sheet: sampleBalanceSheet,
        financials: sampleFinancials,
        industry: 'manufacturing', // ~24% of revenue typically
      });

      // Normal WC = Revenue * Industry Average (~24%)
      // 1000000 * 0.24 = 240000
      expect(result.normal_working_capital.amount).toBeCloseTo(240000, -4);
    });

    it('should calculate WC adjustment correctly', () => {
      const result = calculateWorkingCapital({
        balance_sheet: sampleBalanceSheet,
        financials: sampleFinancials,
        industry: 'manufacturing',
      });

      // Adjustment = Normal WC - Operating WC
      const expectedAdjustment = result.normal_working_capital.amount - result.operating_working_capital;
      expect(result.working_capital_adjustment.amount).toBe(expectedAdjustment);
    });

    it('should calculate liquidity ratios correctly', () => {
      const result = calculateWorkingCapital({
        balance_sheet: sampleBalanceSheet,
        financials: sampleFinancials,
        industry: 'services',
      });

      // Current Ratio = 245000 / 85000 = 2.88
      expect(result.current_ratio).toBeCloseTo(2.88, 1);

      // Quick Ratio = (245000 - 80000) / 85000 = 1.94
      expect(result.quick_ratio).toBeCloseTo(1.94, 1);
    });

    it('should use default benchmarks for unknown industries', () => {
      const result = calculateWorkingCapital({
        balance_sheet: sampleBalanceSheet,
        financials: sampleFinancials,
        industry: 'some-unknown-industry',
      });

      // Should use default of ~15%
      expect(result.normal_working_capital.as_percent_of_revenue).toBeCloseTo(0.15, 1);
    });

    it('should provide quality assessment', () => {
      const result = calculateWorkingCapital({
        balance_sheet: sampleBalanceSheet,
        financials: sampleFinancials,
        industry: 'retail',
      });

      expect(['Adequate', 'Above Target', 'Below Target', 'Critical']).toContain(result.quality);
      expect(result.quality_description).toBeTruthy();
    });

    it('should generate meaningful narrative', () => {
      const result = calculateWorkingCapital({
        balance_sheet: sampleBalanceSheet,
        financials: sampleFinancials,
        industry: 'wholesale_distribution',
      });

      expect(result.narrative).toContain('Working Capital');
      expect(result.narrative.length).toBeGreaterThan(100);
    });

    it('should handle zero revenue gracefully', () => {
      const zeroFinancials: SingleYearFinancials[] = [{
        period: '2024',
        gross_receipts: 0,
        cost_of_goods_sold: 0,
        gross_profit: 0,
        net_income: 0,
        officer_compensation: 0,
        depreciation: 0,
        amortization: 0,
        interest_expense: 0,
        rent_expense: 0,
        salaries_and_wages: 0,
        taxes: 0,
        insurance: 0,
        utilities: 0,
        advertising: 0,
        repairs_maintenance: 0,
        other_deductions: 0,
        total_deductions: 0,
        returns_allowances: 0,
      }];

      expect(() => {
        calculateWorkingCapital({
          balance_sheet: sampleBalanceSheet,
          financials: zeroFinancials,
          industry: 'services',
        });
      }).not.toThrow();
    });
  });
});
