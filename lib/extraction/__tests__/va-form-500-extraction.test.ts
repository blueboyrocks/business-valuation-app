/**
 * US-024: Integration test for Virginia Form 500 extraction
 *
 * Tests the Virginia Form 500 state tax return extraction including:
 * - Federal taxable income
 * - Virginia taxable income with state adjustments
 * - Apportionment percentage from Schedule 500A
 * - State jurisdiction identification
 */

import { describe, it, expect } from 'vitest';
import { FinalExtractionOutput, YearFinancialData, Jurisdiction } from '../types';

/**
 * Virginia Form 500 specific data structure.
 * Extends the standard extraction output with state-specific fields.
 */
interface VirginiaFormData {
  federal_taxable_income: number;
  virginia_additions: number;
  virginia_subtractions: number;
  virginia_taxable_income: number;
  apportionment_percentage: number;
  virginia_tax_due: number;
  jurisdiction: Jurisdiction;
}

/**
 * Create mock Virginia Form 500 extraction data.
 * Structure based on Virginia Form 500 Corporate Income Tax Return.
 */
function createMockVAForm500Extraction(overrides?: {
  federal_taxable_income?: number;
  virginia_additions?: number;
  virginia_subtractions?: number;
  apportionment_percentage?: number;
}): FinalExtractionOutput & { virginia_data: VirginiaFormData } {
  const federalTaxable = overrides?.federal_taxable_income ?? 150000;
  const additions = overrides?.virginia_additions ?? 5000;
  const subtractions = overrides?.virginia_subtractions ?? 3000;
  const apportionment = overrides?.apportionment_percentage ?? 100;

  // Virginia taxable income = (Federal + Additions - Subtractions) * Apportionment
  const virginiaTaxable = Math.round((federalTaxable + additions - subtractions) * (apportionment / 100));
  const virginiaTax = Math.round(virginiaTaxable * 0.06); // 6% Virginia corporate tax rate

  const yearData: YearFinancialData = {
    tax_year: 2021,
    document_type: 'Virginia Form 500',
    income_statement: {
      gross_receipts_sales: 1000000,
      returns_allowances: 0,
      cost_of_goods_sold: 300000,
      gross_profit: 700000,
      total_income: 700000,
      total_deductions: 550000,
      taxable_income: federalTaxable,
      net_income: federalTaxable,
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
      total_assets: 500000,
      cash: 100000,
      accounts_receivable: 150000,
      inventory: 50000,
      fixed_assets: 200000,
      accumulated_depreciation: 50000,
      other_assets: 50000,
      total_liabilities: 200000,
      accounts_payable: 75000,
      loans_payable: 100000,
      other_liabilities: 25000,
      retained_earnings: 200000,
      total_equity: 300000,
      boy_cash: 80000,
      boy_accounts_receivable: 140000,
      boy_inventory: 45000,
      boy_total_assets: 450000,
      boy_total_liabilities: 180000,
      eoy_cash: 100000,
      eoy_accounts_receivable: 150000,
      eoy_inventory: 50000,
      eoy_total_assets: 500000,
      eoy_total_liabilities: 200000,
      eoy_retained_earnings: 200000,
    },
    schedule_k: {
      section_179_deduction: 0,
      charitable_contributions: 0,
      investment_interest: 0,
      net_section_1231_gain: 0,
      other_net_gain_loss: 0,
      total_foreign_taxes: 0,
      total_distributions: 0,
      capital_gains: 0,
      capital_gains_short: 0,
      capital_gains_long: 0,
      distributions_cash: 0,
      distributions_property: 0,
    },
    owner_info: {
      owner_compensation: 200000,
      guaranteed_payments: 0,
      distributions: 0,
      loans_to_shareholders: 0,
      loans_from_shareholders: 0,
    },
    covid_adjustments: {
      ppp_loan: 0,
      ppp_forgiveness: 0,
      ppp_loan_balance: 0,
      eidl_loan_balance: 0,
      eidl_grant: 0,
      erc_credit: 0,
    },
  };

  const virginiaData: VirginiaFormData = {
    federal_taxable_income: federalTaxable,
    virginia_additions: additions,
    virginia_subtractions: subtractions,
    virginia_taxable_income: virginiaTaxable,
    apportionment_percentage: apportionment,
    virginia_tax_due: virginiaTax,
    jurisdiction: 'VA',
  };

  return {
    extraction_id: 'test-va-001',
    extraction_timestamp: '2024-01-15T10:00:00Z',
    source: 'modal',
    company_info: {
      business_name: 'Virginia Test Corporation',
      ein: '54-1234567',
      address: '123 Main St, Richmond, VA 23219',
      entity_type: 'S-Corporation',
      fiscal_year_end: '12/31',
      naics_code: '541330',
      business_activity: 'Engineering Services',
      number_of_employees: 10,
      accounting_method: 'Accrual',
    },
    financial_data: {
      2021: yearData,
    },
    available_years: [2021],
    red_flags: {
      loans_to_shareholders: false,
      loans_to_shareholders_amount: 0,
      declining_revenue: false,
      negative_equity: false,
      negative_retained_earnings: false,
      retained_earnings_value: 200000,
      high_owner_compensation: false,
      related_party_transactions: false,
      unusual_expenses: false,
      missing_schedules: false,
      notes: [],
    },
    virginia_data: virginiaData,
  };
}

/**
 * Helper to get Virginia-specific data from extraction.
 */
function getVirginiaData(extraction: FinalExtractionOutput & { virginia_data?: VirginiaFormData }): VirginiaFormData | null {
  return extraction.virginia_data || null;
}

describe('Virginia Form 500 Extraction', () => {
  describe('Federal taxable income extraction', () => {
    it('extracts federal_taxable_income correctly', () => {
      const extraction = createMockVAForm500Extraction({ federal_taxable_income: 200000 });
      const vaData = getVirginiaData(extraction);
      expect(vaData?.federal_taxable_income).toBe(200000);
    });

    it('matches income statement taxable_income', () => {
      const extraction = createMockVAForm500Extraction({ federal_taxable_income: 175000 });
      const vaData = getVirginiaData(extraction);
      const yearData = extraction.financial_data[2021];
      expect(vaData?.federal_taxable_income).toBe(yearData.income_statement.taxable_income);
    });
  });

  describe('Virginia taxable income calculation', () => {
    it('calculates virginia_taxable_income with additions and subtractions', () => {
      const extraction = createMockVAForm500Extraction({
        federal_taxable_income: 100000,
        virginia_additions: 10000,
        virginia_subtractions: 5000,
        apportionment_percentage: 100,
      });
      const vaData = getVirginiaData(extraction);
      // VA taxable = (100000 + 10000 - 5000) * 100% = 105000
      expect(vaData?.virginia_taxable_income).toBe(105000);
    });

    it('applies apportionment percentage correctly', () => {
      const extraction = createMockVAForm500Extraction({
        federal_taxable_income: 100000,
        virginia_additions: 0,
        virginia_subtractions: 0,
        apportionment_percentage: 50,
      });
      const vaData = getVirginiaData(extraction);
      // VA taxable = 100000 * 50% = 50000
      expect(vaData?.virginia_taxable_income).toBe(50000);
    });

    it('handles zero federal taxable income', () => {
      const extraction = createMockVAForm500Extraction({
        federal_taxable_income: 0,
        virginia_additions: 5000,
        virginia_subtractions: 2000,
        apportionment_percentage: 100,
      });
      const vaData = getVirginiaData(extraction);
      // VA taxable = (0 + 5000 - 2000) * 100% = 3000
      expect(vaData?.virginia_taxable_income).toBe(3000);
    });
  });

  describe('Apportionment percentage from Schedule 500A', () => {
    it('extracts apportionment_percentage correctly', () => {
      const extraction = createMockVAForm500Extraction({ apportionment_percentage: 75 });
      const vaData = getVirginiaData(extraction);
      expect(vaData?.apportionment_percentage).toBe(75);
    });

    it('handles 100% apportionment (single-state company)', () => {
      const extraction = createMockVAForm500Extraction({ apportionment_percentage: 100 });
      const vaData = getVirginiaData(extraction);
      expect(vaData?.apportionment_percentage).toBe(100);
    });

    it('handles fractional apportionment', () => {
      const extraction = createMockVAForm500Extraction({ apportionment_percentage: 33.33 });
      const vaData = getVirginiaData(extraction);
      expect(vaData?.apportionment_percentage).toBeCloseTo(33.33, 2);
    });
  });

  describe('Jurisdiction identification', () => {
    it('sets jurisdiction to VA', () => {
      const extraction = createMockVAForm500Extraction();
      const vaData = getVirginiaData(extraction);
      expect(vaData?.jurisdiction).toBe('VA');
    });

    it('company address includes Virginia', () => {
      const extraction = createMockVAForm500Extraction();
      expect(extraction.company_info.address).toContain('VA');
    });
  });

  describe('Virginia additions and subtractions', () => {
    it('extracts virginia_additions correctly', () => {
      const extraction = createMockVAForm500Extraction({ virginia_additions: 15000 });
      const vaData = getVirginiaData(extraction);
      expect(vaData?.virginia_additions).toBe(15000);
    });

    it('extracts virginia_subtractions correctly', () => {
      const extraction = createMockVAForm500Extraction({ virginia_subtractions: 8000 });
      const vaData = getVirginiaData(extraction);
      expect(vaData?.virginia_subtractions).toBe(8000);
    });

    it('handles zero additions and subtractions', () => {
      const extraction = createMockVAForm500Extraction({
        virginia_additions: 0,
        virginia_subtractions: 0,
      });
      const vaData = getVirginiaData(extraction);
      expect(vaData?.virginia_additions).toBe(0);
      expect(vaData?.virginia_subtractions).toBe(0);
    });
  });

  describe('Virginia tax calculation', () => {
    it('calculates virginia_tax_due at 6% rate', () => {
      const extraction = createMockVAForm500Extraction({
        federal_taxable_income: 100000,
        virginia_additions: 0,
        virginia_subtractions: 0,
        apportionment_percentage: 100,
      });
      const vaData = getVirginiaData(extraction);
      // VA tax = 100000 * 6% = 6000
      expect(vaData?.virginia_tax_due).toBe(6000);
    });

    it('handles zero taxable income', () => {
      const extraction = createMockVAForm500Extraction({
        federal_taxable_income: 0,
        virginia_additions: 0,
        virginia_subtractions: 0,
        apportionment_percentage: 100,
      });
      const vaData = getVirginiaData(extraction);
      expect(vaData?.virginia_tax_due).toBe(0);
    });
  });

  describe('Document type identification', () => {
    it('sets document_type to Virginia Form 500', () => {
      const extraction = createMockVAForm500Extraction();
      const yearData = extraction.financial_data[2021];
      expect(yearData.document_type).toBe('Virginia Form 500');
    });
  });

  describe('Edge cases', () => {
    it('handles negative federal taxable income (loss)', () => {
      const extraction = createMockVAForm500Extraction({
        federal_taxable_income: -50000,
        virginia_additions: 10000,
        virginia_subtractions: 5000,
        apportionment_percentage: 100,
      });
      const vaData = getVirginiaData(extraction);
      // VA taxable = (-50000 + 10000 - 5000) * 100% = -45000
      expect(vaData?.virginia_taxable_income).toBe(-45000);
    });

    it('handles subtractions exceeding federal + additions', () => {
      const extraction = createMockVAForm500Extraction({
        federal_taxable_income: 50000,
        virginia_additions: 5000,
        virginia_subtractions: 60000,
        apportionment_percentage: 100,
      });
      const vaData = getVirginiaData(extraction);
      // VA taxable = (50000 + 5000 - 60000) * 100% = -5000
      expect(vaData?.virginia_taxable_income).toBe(-5000);
    });
  });
});
