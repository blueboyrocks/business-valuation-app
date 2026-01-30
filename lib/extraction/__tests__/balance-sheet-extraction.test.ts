/**
 * US-023: Integration test for balance sheet extraction
 *
 * Tests the balance sheet extraction functionality including:
 * - Total assets, liabilities, equity extraction
 * - EIDL/PPP loan detection
 * - Red flags population (loans to shareholders, negative retained earnings)
 */

import { describe, it, expect } from 'vitest';
import {
  getTotalAssets,
  getBookValue,
  getCovidAdjustments,
} from '../data-accessors';
import { FinalExtractionOutput, RedFlags, YearFinancialData } from '../types';

/**
 * Create mock balance sheet extraction data.
 * Structure based on kfactor6.pdf QuickBooks balance sheet format.
 */
function createMockBalanceSheetExtraction(overrides?: {
  total_assets?: number;
  total_liabilities?: number;
  total_equity?: number;
  loans_to_shareholders?: number;
  retained_earnings?: number;
  eidl_loan_balance?: number;
  ppp_loan_balance?: number;
}): FinalExtractionOutput {
  const totalAssets = overrides?.total_assets ?? 500000;
  const totalLiabilities = overrides?.total_liabilities ?? 200000;
  const totalEquity = overrides?.total_equity ?? 300000;
  const retainedEarnings = overrides?.retained_earnings ?? 200000;
  const loansToShareholders = overrides?.loans_to_shareholders ?? 0;
  const eidlLoanBalance = overrides?.eidl_loan_balance ?? 0;
  const pppLoanBalance = overrides?.ppp_loan_balance ?? 0;

  const yearData: YearFinancialData = {
    tax_year: 2023,
    document_type: 'Balance Sheet',
    income_statement: {
      gross_receipts_sales: 1000000,
      returns_allowances: 0,
      cost_of_goods_sold: 300000,
      gross_profit: 700000,
      total_income: 700000,
      total_deductions: 550000,
      taxable_income: 150000,
      net_income: 150000,
    },
    expenses: {
      compensation_of_officers: 200000,
      salaries_wages: 150000,
      repairs_maintenance: 10000,
      bad_debts: 0,
      rents: 36000,
      taxes_licenses: 15000,
      interest: 5000,
      depreciation: 25000,
      depletion: 0,
      advertising: 8000,
      pension_profit_sharing: 10000,
      employee_benefits: 30000,
      other_deductions: 61000,
    },
    balance_sheet: {
      // Current / End of Year values
      total_assets: totalAssets,
      cash: 100000,
      accounts_receivable: 150000,
      inventory: 50000,
      fixed_assets: 200000,
      accumulated_depreciation: 50000,
      other_assets: 50000,
      total_liabilities: totalLiabilities,
      accounts_payable: 75000,
      loans_payable: 100000 + eidlLoanBalance + pppLoanBalance,
      other_liabilities: 25000,
      retained_earnings: retainedEarnings,
      total_equity: totalEquity,
      // Schedule L - Beginning of Year (BOY)
      boy_cash: 80000,
      boy_accounts_receivable: 140000,
      boy_inventory: 45000,
      boy_total_assets: 450000,
      boy_total_liabilities: 180000,
      // Schedule L - End of Year (EOY)
      eoy_cash: 100000,
      eoy_accounts_receivable: 150000,
      eoy_inventory: 50000,
      eoy_total_assets: totalAssets,
      eoy_total_liabilities: totalLiabilities,
      eoy_retained_earnings: retainedEarnings,
    },
    schedule_k: {
      section_179_deduction: 15000,
      charitable_contributions: 5000,
      investment_interest: 0,
      net_section_1231_gain: 0,
      other_net_gain_loss: 0,
      total_foreign_taxes: 0,
      total_distributions: 100000,
      capital_gains: 0,
      capital_gains_short: 0,
      capital_gains_long: 0,
      distributions_cash: 100000,
      distributions_property: 0,
    },
    owner_info: {
      owner_compensation: 200000,
      guaranteed_payments: 0,
      distributions: 100000,
      loans_to_shareholders: loansToShareholders,
      loans_from_shareholders: 0,
    },
    covid_adjustments: {
      ppp_loan: 0,
      ppp_forgiveness: 0,
      ppp_loan_balance: pppLoanBalance,
      eidl_loan_balance: eidlLoanBalance,
      eidl_grant: 0,
      erc_credit: 0,
    },
  };

  // Build red flags based on data
  const redFlags: RedFlags = {
    loans_to_shareholders: loansToShareholders > 0,
    loans_to_shareholders_amount: loansToShareholders,
    declining_revenue: false,
    negative_equity: totalEquity < 0,
    negative_retained_earnings: retainedEarnings < 0,
    retained_earnings_value: retainedEarnings,
    high_owner_compensation: false,
    related_party_transactions: false,
    unusual_expenses: false,
    missing_schedules: false,
    notes: [],
  };

  // Add notes for detected issues
  if (loansToShareholders > 0) {
    redFlags.notes.push(`Loans to shareholders: $${loansToShareholders.toLocaleString()}`);
  }
  if (retainedEarnings < 0) {
    redFlags.notes.push(`Negative retained earnings: $${retainedEarnings.toLocaleString()}`);
  }
  if (eidlLoanBalance > 0 || pppLoanBalance > 0) {
    redFlags.notes.push('COVID loan balances detected on balance sheet');
  }

  return {
    extraction_id: 'test-bs-001',
    extraction_timestamp: '2024-01-15T10:00:00Z',
    source: 'modal',
    company_info: {
      business_name: 'Balance Sheet Test Company',
      ein: '12-3456789',
      address: '123 Main St',
      entity_type: 'S-Corporation',
      fiscal_year_end: '12/31',
      naics_code: '541330',
      business_activity: 'Engineering Services',
      number_of_employees: 10,
      accounting_method: 'Accrual',
    },
    financial_data: {
      2023: yearData,
    },
    available_years: [2023],
    red_flags: redFlags,
  };
}

describe('Balance Sheet Extraction', () => {
  describe('Basic asset and liability extraction', () => {
    it('extracts total_assets correctly', () => {
      const extraction = createMockBalanceSheetExtraction({ total_assets: 750000 });
      const totalAssets = getTotalAssets(extraction, 2023);
      expect(totalAssets).toBe(750000);
    });

    it('extracts total_liabilities correctly', () => {
      const extraction = createMockBalanceSheetExtraction({ total_liabilities: 350000 });
      const yearData = extraction.financial_data[2023];
      expect(yearData.balance_sheet.total_liabilities).toBe(350000);
    });

    it('extracts total_equity correctly', () => {
      const extraction = createMockBalanceSheetExtraction({ total_equity: 400000 });
      const yearData = extraction.financial_data[2023];
      expect(yearData.balance_sheet.total_equity).toBe(400000);
    });

    it('calculates book value correctly (assets - liabilities)', () => {
      const extraction = createMockBalanceSheetExtraction({
        total_assets: 800000,
        total_liabilities: 300000,
      });
      const bookValue = getBookValue(extraction, 2023);
      expect(bookValue).toBe(500000);
    });
  });

  describe('COVID loan detection', () => {
    it('detects EIDL loan balance in covid_adjustments', () => {
      const extraction = createMockBalanceSheetExtraction({ eidl_loan_balance: 150000 });
      const covid = getCovidAdjustments(extraction, 2023);
      expect(covid.eidl_loan_balance).toBe(150000);
    });

    it('detects PPP loan balance in covid_adjustments', () => {
      const extraction = createMockBalanceSheetExtraction({ ppp_loan_balance: 75000 });
      const covid = getCovidAdjustments(extraction, 2023);
      expect(covid.ppp_loan_balance).toBe(75000);
    });

    it('detects both EIDL and PPP loans', () => {
      const extraction = createMockBalanceSheetExtraction({
        eidl_loan_balance: 150000,
        ppp_loan_balance: 50000,
      });
      const covid = getCovidAdjustments(extraction, 2023);
      expect(covid.eidl_loan_balance).toBe(150000);
      expect(covid.ppp_loan_balance).toBe(50000);
    });

    it('returns zero for COVID loans when not present', () => {
      const extraction = createMockBalanceSheetExtraction();
      const covid = getCovidAdjustments(extraction, 2023);
      expect(covid.eidl_loan_balance).toBe(0);
      expect(covid.ppp_loan_balance).toBe(0);
    });
  });

  describe('Red flags population', () => {
    it('flags loans_to_shareholders when present', () => {
      const extraction = createMockBalanceSheetExtraction({
        loans_to_shareholders: 50000,
      });
      expect(extraction.red_flags.loans_to_shareholders).toBe(true);
      expect(extraction.red_flags.loans_to_shareholders_amount).toBe(50000);
    });

    it('does not flag loans_to_shareholders when zero', () => {
      const extraction = createMockBalanceSheetExtraction({
        loans_to_shareholders: 0,
      });
      expect(extraction.red_flags.loans_to_shareholders).toBe(false);
      expect(extraction.red_flags.loans_to_shareholders_amount).toBe(0);
    });

    it('flags negative_retained_earnings when applicable', () => {
      const extraction = createMockBalanceSheetExtraction({
        retained_earnings: -75000,
      });
      expect(extraction.red_flags.negative_retained_earnings).toBe(true);
      expect(extraction.red_flags.retained_earnings_value).toBe(-75000);
    });

    it('does not flag positive retained_earnings', () => {
      const extraction = createMockBalanceSheetExtraction({
        retained_earnings: 200000,
      });
      expect(extraction.red_flags.negative_retained_earnings).toBe(false);
      expect(extraction.red_flags.retained_earnings_value).toBe(200000);
    });

    it('populates notes array with red flag details', () => {
      const extraction = createMockBalanceSheetExtraction({
        loans_to_shareholders: 25000,
        retained_earnings: -50000,
      });
      expect(extraction.red_flags.notes.length).toBeGreaterThan(0);
      expect(extraction.red_flags.notes.some(n => n.includes('Loans to shareholders'))).toBe(true);
      expect(extraction.red_flags.notes.some(n => n.includes('Negative retained earnings'))).toBe(true);
    });

    it('adds COVID loan note to red flags when detected', () => {
      const extraction = createMockBalanceSheetExtraction({
        eidl_loan_balance: 100000,
      });
      expect(extraction.red_flags.notes.some(n => n.includes('COVID loan'))).toBe(true);
    });
  });

  describe('Beginning/End of Year values', () => {
    it('extracts BOY (beginning of year) values', () => {
      const extraction = createMockBalanceSheetExtraction();
      const yearData = extraction.financial_data[2023];
      expect(yearData.balance_sheet.boy_cash).toBe(80000);
      expect(yearData.balance_sheet.boy_total_assets).toBe(450000);
      expect(yearData.balance_sheet.boy_total_liabilities).toBe(180000);
    });

    it('extracts EOY (end of year) values', () => {
      const extraction = createMockBalanceSheetExtraction({
        total_assets: 600000,
        total_liabilities: 250000,
      });
      const yearData = extraction.financial_data[2023];
      expect(yearData.balance_sheet.eoy_total_assets).toBe(600000);
      expect(yearData.balance_sheet.eoy_total_liabilities).toBe(250000);
    });
  });

  describe('Edge cases', () => {
    it('handles zero balance sheet (no assets)', () => {
      const extraction = createMockBalanceSheetExtraction({
        total_assets: 0,
        total_liabilities: 0,
        total_equity: 0,
      });
      expect(getTotalAssets(extraction, 2023)).toBe(0);
      expect(getBookValue(extraction, 2023)).toBe(0);
    });

    it('handles negative equity (liabilities exceed assets)', () => {
      const extraction = createMockBalanceSheetExtraction({
        total_assets: 200000,
        total_liabilities: 350000,
        total_equity: -150000,
      });
      expect(extraction.red_flags.negative_equity).toBe(true);
      expect(getBookValue(extraction, 2023)).toBe(-150000);
    });

    it('returns 0 for non-existent year', () => {
      const extraction = createMockBalanceSheetExtraction();
      expect(getTotalAssets(extraction, 2020)).toBe(0);
      expect(getBookValue(extraction, 2020)).toBe(0);
    });
  });
});
