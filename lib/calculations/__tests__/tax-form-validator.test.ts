/**
 * Tax Form Validator Unit Tests
 */
import { describe, it, expect } from 'vitest';
import { validateTaxFormData } from '../tax-form-validator';
import { SingleYearFinancials } from '../types';

describe('Tax Form Validator', () => {
  const validFinancials: SingleYearFinancials = {
    period: '2024',
    gross_receipts: 1000000,
    cost_of_goods_sold: 600000,
    gross_profit: 400000, // Correct: 1000000 - 600000
    net_income: 100000,
    total_deductions: 300000,
    officer_compensation: 80000,
    salaries_and_wages: 120000,
    depreciation: 20000,
    rent: 30000,
    rent_expense: 30000,
    interest_expense: 10000,
    amortization: 5000,
    taxes: 0,
    insurance: 0,
    utilities: 0,
    advertising: 0,
    repairs_maintenance: 0,
    other_deductions: 40000,
    returns_allowances: 0,
  };

  describe('validateTaxFormData', () => {
    it('should validate correct 1120-S data', () => {
      const result = validateTaxFormData({
        form_type: '1120-S',
        extracted_data: validFinancials,
        balance_sheet_data: {
          total_assets: 500000,
          total_liabilities: 200000,
          total_equity: 300000, // Correct: 500000 - 200000
        },
      });

      expect(result.is_valid).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.confidence_score).toBeGreaterThanOrEqual(80);
    });

    it('should detect gross profit calculation error', () => {
      const invalidFinancials: SingleYearFinancials = {
        ...validFinancials,
        gross_profit: 450000, // WRONG: should be 400000
      };

      const result = validateTaxFormData({
        form_type: '1120-S',
        extracted_data: invalidFinancials,
      });

      expect(result.is_valid).toBe(false);
      const grossProfitError = result.errors.find(e => e.rule_name.includes('Gross Profit'));
      expect(grossProfitError).toBeDefined();
    });

    it('should detect balance sheet imbalance', () => {
      const result = validateTaxFormData({
        form_type: '1120-S',
        extracted_data: validFinancials,
        balance_sheet_data: {
          total_assets: 500000,
          total_liabilities: 200000,
          total_equity: 250000, // WRONG: should be 300000
        },
      });

      const balanceError = result.errors.find(e =>
        e.rule_name.includes('Balance Sheet') || e.rule_name.includes('Assets')
      );
      expect(balanceError).toBeDefined();
    });

    it('should warn on unusually high depreciation', () => {
      const highDepreciationFinancials: SingleYearFinancials = {
        ...validFinancials,
        gross_receipts: 100000,
        cost_of_goods_sold: 60000,
        gross_profit: 40000,
        depreciation: 60000, // 60% of revenue - very high
      };

      const result = validateTaxFormData({
        form_type: '1120-S',
        extracted_data: highDepreciationFinancials,
      });

      const depreciationWarning = result.warnings.find(w => w.rule_name.includes('Depreciation'));
      expect(depreciationWarning).toBeDefined();
    });

    it('should reject zero or negative revenue', () => {
      const zeroRevenueFinancials: SingleYearFinancials = {
        ...validFinancials,
        gross_receipts: 0,
      };

      const result = validateTaxFormData({
        form_type: 'Schedule_C',
        extracted_data: zeroRevenueFinancials,
      });

      expect(result.is_valid).toBe(false);
      const revenueError = result.errors.find(e => e.rule_name.includes('Revenue'));
      expect(revenueError).toBeDefined();
    });

    it('should detect COGS exceeding revenue', () => {
      const invalidCOGSFinancials: SingleYearFinancials = {
        ...validFinancials,
        gross_receipts: 500000,
        cost_of_goods_sold: 600000, // More than revenue
        gross_profit: -100000,
      };

      const result = validateTaxFormData({
        form_type: '1120',
        extracted_data: invalidCOGSFinancials,
      });

      expect(result.is_valid).toBe(false);
      const cogsError = result.errors.find(e => e.rule_name.includes('COGS'));
      expect(cogsError).toBeDefined();
    });

    it('should provide correction guidance', () => {
      const invalidFinancials: SingleYearFinancials = {
        ...validFinancials,
        gross_profit: 500000, // Wrong
      };

      const result = validateTaxFormData({
        form_type: '1120-S',
        extracted_data: invalidFinancials,
      });

      result.errors.forEach(error => {
        expect(error.correction_guidance).toBeTruthy();
        expect(error.correction_guidance.length).toBeGreaterThan(20);
      });
    });

    it('should handle different form types', () => {
      const formTypes = ['1120-S', '1120', '1065', 'Schedule_C'] as const;

      formTypes.forEach(formType => {
        const result = validateTaxFormData({
          form_type: formType,
          extracted_data: validFinancials,
        });

        expect(result.form_type).toBe(formType);
        expect(result.summary.total_rules_checked).toBeGreaterThan(0);
      });
    });

    it('should allow small tolerance for rounding', () => {
      const slightlyOffFinancials: SingleYearFinancials = {
        ...validFinancials,
        gross_profit: 400001, // Off by $1 - should pass
      };

      const result = validateTaxFormData({
        form_type: '1120-S',
        extracted_data: slightlyOffFinancials,
      });

      // Should pass due to 1% tolerance
      const grossProfitError = result.errors.find(e => e.rule_name.includes('Gross Profit'));
      expect(grossProfitError).toBeUndefined();
    });
  });
});
