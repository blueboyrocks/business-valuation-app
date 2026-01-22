/**
 * Data Quality Scorer Unit Tests
 */
import { describe, it, expect } from 'vitest';
import { calculateDataQuality } from '../data-quality-scorer';
import { SingleYearFinancials, BalanceSheetData } from '../types';

describe('Data Quality Scorer', () => {
  const completeFinancials: SingleYearFinancials = {
    period: '2024',
    gross_receipts: 1000000,
    net_income: 100000,
    officer_compensation: 80000,
    cost_of_goods_sold: 600000,
    depreciation: 15000,
    interest_expense: 10000,
    amortization: 5000,
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
    gross_profit: 400000,
  };

  const completeBalanceSheet: BalanceSheetData = {
    as_of_date: '2024-12-31',
    assets: {
      current_assets: {
        cash: 50000,
        accounts_receivable: 125000,
        inventory: 100000,
        prepaid_expenses: 10000,
        other_current_assets: 5000,
        total_current_assets: 290000,
      },
      fixed_assets: {
        property_plant_equipment: 200000,
        accumulated_depreciation: 80000,
        net_fixed_assets: 120000,
        other_assets: 10000,
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
        long_term_debt: 100000,
        other_long_term_liabilities: 10000,
        total_long_term_liabilities: 110000,
      },
      total_liabilities: 220000,
    },
    equity: {
      common_stock: 50000,
      retained_earnings: 150000,
      total_equity: 200000,
    },
  };

  describe('calculateDataQuality', () => {
    it('should return high score for complete data', () => {
      const result = calculateDataQuality({
        financials: [
          completeFinancials,
          { ...completeFinancials, period: '2023', gross_receipts: 900000, net_income: 85000 },
          { ...completeFinancials, period: '2022', gross_receipts: 800000, net_income: 70000 },
        ],
        balance_sheet: completeBalanceSheet,
        documents_provided: ['tax return 1120-S', 'balance sheet', 'profit and loss'],
        company_name: 'Test Company',
        industry: 'manufacturing',
      });

      expect(result.overall_score).toBeGreaterThanOrEqual(70);
      expect(result.can_proceed_with_valuation).toBe(true);
      expect(['High', 'Moderate']).toContain(result.confidence_level);
    });

    it('should return low score for minimal data', () => {
      const result = calculateDataQuality({
        financials: [{
          period: '2024',
          gross_receipts: 500000,
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
        }],
        company_name: 'Test Company',
        industry: 'services',
      });

      expect(result.overall_score).toBeLessThan(50);
      expect(result.missing_data.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should identify missing critical fields', () => {
      const result = calculateDataQuality({
        financials: [{
          period: '2024',
          gross_receipts: 500000,
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
        }],
        company_name: 'Test Company',
        industry: 'retail',
      });

      const criticalMissing = result.missing_data.filter(m => m.importance === 'critical');
      expect(criticalMissing.length).toBeGreaterThanOrEqual(3);
    });

    it('should recommend additional years of data', () => {
      const result = calculateDataQuality({
        financials: [completeFinancials],
        company_name: 'Test Company',
        industry: 'construction',
      });

      const yearRecommendation = result.recommendations.find(r =>
        r.action.toLowerCase().includes('year') || r.description.toLowerCase().includes('year')
      );
      expect(yearRecommendation).toBeDefined();
    });

    it('should handle empty financials array', () => {
      const result = calculateDataQuality({
        financials: [],
        company_name: 'Test Company',
        industry: 'services',
      });

      expect(result.overall_score).toBe(0);
      expect(result.can_proceed_with_valuation).toBe(false);
      expect(result.confidence_level).toBe('Insufficient');
    });

    it('should identify missing documents', () => {
      const result = calculateDataQuality({
        financials: [completeFinancials],
        documents_provided: ['tax return'],
        company_name: 'Test Company',
        industry: 'services',
      });

      expect(result.document_coverage.documents_missing.length).toBeGreaterThan(0);
      expect(result.document_coverage.coverage_score).toBeLessThan(1);
    });

    it('should generate actionable recommendations', () => {
      const result = calculateDataQuality({
        financials: [{
          period: '2024',
          gross_receipts: 500000,
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
        }],
        company_name: 'Test Company',
        industry: 'restaurant',
      });

      result.recommendations.forEach(rec => {
        expect(rec.action).toBeTruthy();
        expect(rec.description).toBeTruthy();
        expect(['critical', 'high', 'medium', 'low']).toContain(rec.priority);
      });
    });
  });
});
