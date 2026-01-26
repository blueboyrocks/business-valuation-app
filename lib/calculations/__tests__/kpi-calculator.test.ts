/**
 * KPI Calculator Unit Tests
 */
import { describe, it, expect } from 'vitest';
import { calculateAllKPIs } from '../kpi-calculator';
import { SingleYearFinancials, BalanceSheetData } from '../types';

describe('KPI Calculator', () => {
  // Sample test data
  const sampleFinancials: SingleYearFinancials = {
    period: '2024',
    gross_receipts: 1000000,
    cost_of_goods_sold: 600000,
    gross_profit: 400000,
    net_income: 100000,
    officer_compensation: 80000,
    depreciation: 15000,
    amortization: 5000,
    interest_expense: 10000,
    rent: 24000,
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
  };

  const priorYearFinancials: SingleYearFinancials = {
    period: '2023',
    gross_receipts: 900000,
    cost_of_goods_sold: 540000,
    gross_profit: 360000,
    net_income: 85000,
    officer_compensation: 75000,
    depreciation: 14000,
    amortization: 5000,
    interest_expense: 12000,
    rent: 24000,
    rent_expense: 24000,
    salaries_and_wages: 140000,
    taxes: 18000,
    insurance: 11000,
    utilities: 7500,
    advertising: 14000,
    repairs_maintenance: 4500,
    other_deductions: 9000,
    total_deductions: 0,
    returns_allowances: 0,
  };

  const sampleBalanceSheet: BalanceSheetData = {
    period: '2024',
    assets: {
      current_assets: {
        cash: 50000,
        accounts_receivable: 125000,
        allowance_for_doubtful_accounts: 0,
        inventory: 100000,
        prepaid_expenses: 10000,
        other_current_assets: 5000,
        total_current_assets: 290000,
      },
      fixed_assets: {
        land: 0,
        buildings: 0,
        machinery_and_equipment: 200000,
        furniture_and_fixtures: 0,
        vehicles: 0,
        leasehold_improvements: 0,
        accumulated_depreciation: 80000,
        net_fixed_assets: 120000,
      },
      other_assets: {
        intangible_assets: 0,
        goodwill: 0,
        other: 10000,
        total_other_assets: 10000,
      },
      total_assets: 420000,
    },
    liabilities: {
      current_liabilities: {
        accounts_payable: 60000,
        accrued_expenses: 25000,
        current_portion_long_term_debt: 15000,
        other_current_liabilities: 10000,
        total_current_liabilities: 110000,
      },
      long_term_liabilities: {
        notes_payable: 100000,
        mortgages: 0,
        shareholder_loans: 0,
        other_long_term_liabilities: 10000,
        total_long_term_liabilities: 110000,
      },
      total_liabilities: 220000,
    },
    equity: {
      common_stock: 50000,
      additional_paid_in_capital: 0,
      retained_earnings: 150000,
      treasury_stock: 0,
      total_equity: 200000,
    },
  };

  describe('calculateAllKPIs', () => {
    it('should calculate liquidity ratios correctly', () => {
      const result = calculateAllKPIs({
        current_financials: sampleFinancials,
        balance_sheet: sampleBalanceSheet,
      });

      // Current Ratio = Current Assets / Current Liabilities
      // 290000 / 110000 = 2.64
      const currentRatio = result.liquidity_ratios.kpis.find(k => k.name === 'Current Ratio');
      expect(currentRatio?.value).toBeCloseTo(2.64, 1);

      // Quick Ratio = (Current Assets - Inventory) / Current Liabilities
      // (290000 - 100000) / 110000 = 1.73
      const quickRatio = result.liquidity_ratios.kpis.find(k => k.name === 'Quick Ratio');
      expect(quickRatio?.value).toBeCloseTo(1.73, 1);
    });

    it('should calculate profitability ratios correctly', () => {
      const result = calculateAllKPIs({
        current_financials: sampleFinancials,
        balance_sheet: sampleBalanceSheet,
      });

      // Gross Margin = Gross Profit / Revenue
      // 400000 / 1000000 = 0.40 (40%)
      const grossMargin = result.profitability_ratios.kpis.find(k => k.name === 'Gross Margin');
      expect(grossMargin?.value).toBeCloseTo(0.40, 2);

      // Net Margin = Net Income / Revenue
      // 100000 / 1000000 = 0.10 (10%)
      const netMargin = result.profitability_ratios.kpis.find(k => k.name === 'Net Margin');
      expect(netMargin?.value).toBeCloseTo(0.10, 2);

      // Return on Assets = Net Income / Total Assets
      // 100000 / 420000 = 0.238
      const roa = result.profitability_ratios.kpis.find(k => k.name === 'Return on Assets');
      expect(roa?.value).toBeCloseTo(0.238, 2);

      // Return on Equity = Net Income / Total Equity
      // 100000 / 200000 = 0.50
      const roe = result.profitability_ratios.kpis.find(k => k.name === 'Return on Equity');
      expect(roe?.value).toBeCloseTo(0.50, 2);
    });

    it('should calculate leverage ratios correctly', () => {
      const result = calculateAllKPIs({
        current_financials: sampleFinancials,
        balance_sheet: sampleBalanceSheet,
      });

      // Debt to Equity = Total Liabilities / Total Equity
      // 220000 / 200000 = 1.10
      const debtToEquity = result.leverage_ratios.kpis.find(k => k.name === 'Debt-to-Equity');
      expect(debtToEquity?.value).toBeCloseTo(1.10, 2);

      // Debt to Assets = Total Liabilities / Total Assets
      // 220000 / 420000 = 0.524
      const debtToAssets = result.leverage_ratios.kpis.find(k => k.name === 'Debt-to-Assets');
      expect(debtToAssets?.value).toBeCloseTo(0.524, 2);
    });

    it('should calculate growth metrics correctly', () => {
      const result = calculateAllKPIs({
        current_financials: sampleFinancials,
        balance_sheet: sampleBalanceSheet,
        prior_years: [priorYearFinancials],
      });

      // Revenue Growth = (Current - Prior) / Prior
      // (1000000 - 900000) / 900000 = 0.111 (11.1%)
      const revenueGrowth = result.growth_metrics.kpis.find(k => k.name === 'Revenue Growth');
      expect(revenueGrowth?.value).toBeCloseTo(0.111, 2);
    });

    it('should calculate health score and counts correctly', () => {
      const result = calculateAllKPIs({
        current_financials: sampleFinancials,
        balance_sheet: sampleBalanceSheet,
      });

      expect(result.total_kpis_calculated).toBeGreaterThan(0);
      expect(result.outperforming_count + result.meeting_average_count + result.underperforming_count)
        .toBeLessThanOrEqual(result.total_kpis_calculated);
      expect(result.health_score).toBeGreaterThanOrEqual(0);
      expect(result.health_score).toBeLessThanOrEqual(100);
      expect(['Strong', 'Good', 'Fair', 'Weak']).toContain(result.overall_financial_health);
    });

    it('should handle single year of data', () => {
      const result = calculateAllKPIs({
        current_financials: sampleFinancials,
        balance_sheet: sampleBalanceSheet,
      });

      // Revenue growth should be null with only one year
      const revenueGrowth = result.growth_metrics.kpis.find(k => k.name === 'Revenue Growth');
      expect(revenueGrowth?.value).toBeNull();
    });

    it('should handle zero values without division errors', () => {
      const zeroFinancials: SingleYearFinancials = {
        period: '2024',
        gross_receipts: 0,
        cost_of_goods_sold: 0,
        gross_profit: 0,
        net_income: 0,
        officer_compensation: 0,
        depreciation: 0,
        amortization: 0,
        interest_expense: 0,
        rent: 0,
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
      };

      const zeroBalanceSheet: BalanceSheetData = {
        period: '2024',
        assets: {
          current_assets: {
            cash: 0, accounts_receivable: 0, allowance_for_doubtful_accounts: 0,
            inventory: 0,
            prepaid_expenses: 0, other_current_assets: 0, total_current_assets: 0,
          },
          fixed_assets: {
            land: 0, buildings: 0, machinery_and_equipment: 0,
            furniture_and_fixtures: 0, vehicles: 0, leasehold_improvements: 0,
            accumulated_depreciation: 0, net_fixed_assets: 0,
          },
          other_assets: {
            intangible_assets: 0, goodwill: 0, other: 0, total_other_assets: 0,
          },
          total_assets: 0,
        },
        liabilities: {
          current_liabilities: {
            accounts_payable: 0, accrued_expenses: 0, current_portion_long_term_debt: 0,
            other_current_liabilities: 0, total_current_liabilities: 0,
          },
          long_term_liabilities: {
            notes_payable: 0, mortgages: 0, shareholder_loans: 0,
            other_long_term_liabilities: 0, total_long_term_liabilities: 0,
          },
          total_liabilities: 0,
        },
        equity: {
          common_stock: 0, additional_paid_in_capital: 0,
          retained_earnings: 0, treasury_stock: 0, total_equity: 0,
        },
      };

      expect(() => {
        calculateAllKPIs({
          current_financials: zeroFinancials,
          balance_sheet: zeroBalanceSheet,
        });
      }).not.toThrow();
    });
  });
});
