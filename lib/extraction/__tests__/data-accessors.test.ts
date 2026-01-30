import { describe, it, expect } from 'vitest';
import {
  getLatestYearData,
  getYearData,
  getYearsSorted,
  getOwnerCompensation,
  getDepreciationAddBack,
  getCovidAdjustments,
  getTotalCovidAdjustments,
  getRevenue,
  getNetIncome,
  getTotalAssets,
  getBookValue,
  getAllSdeAddBacks,
  getNormalizedNetIncome,
  calculateSDE,
  getLatestSDE,
  getWeightedAverageSDE,
} from '../data-accessors';
import { FinalExtractionOutput } from '../types';

// Mock extraction data for testing
function createMockExtraction(overrides?: Partial<FinalExtractionOutput>): FinalExtractionOutput {
  return {
    extraction_id: 'test-123',
    extraction_timestamp: '2024-01-15T10:00:00Z',
    source: 'modal',
    company_info: {
      business_name: 'Test Company',
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
      2023: {
        tax_year: 2023,
        document_type: 'Form 1120-S',
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
          depletion: 2000,
          advertising: 8000,
          pension_profit_sharing: 10000,
          employee_benefits: 30000,
          other_deductions: 59000,
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
        },
        schedule_k: {
          section_179_deduction: 15000,
          charitable_contributions: 5000,
          investment_interest: 0,
          net_section_1231_gain: 0,
          other_net_gain_loss: 0,
          total_foreign_taxes: 0,
          total_distributions: 100000,
        },
        owner_info: {
          owner_compensation: 200000,
          guaranteed_payments: 0,
          distributions: 100000,
          loans_to_shareholders: 0,
          loans_from_shareholders: 0,
        },
        covid_adjustments: {
          ppp_loan: 0,
          ppp_forgiveness: 0,
          eidl_grant: 0,
          erc_credit: 0,
        },
      },
      2022: {
        tax_year: 2022,
        document_type: 'Form 1120-S',
        income_statement: {
          gross_receipts_sales: 900000,
          returns_allowances: 0,
          cost_of_goods_sold: 280000,
          gross_profit: 620000,
          total_income: 620000,
          total_deductions: 500000,
          taxable_income: 120000,
          net_income: 120000,
        },
        expenses: {
          compensation_of_officers: 180000,
          salaries_wages: 140000,
          repairs_maintenance: 8000,
          bad_debts: 0,
          rents: 36000,
          taxes_licenses: 12000,
          interest: 6000,
          depreciation: 20000,
          depletion: 0,
          advertising: 6000,
          pension_profit_sharing: 8000,
          employee_benefits: 25000,
          other_deductions: 59000,
        },
        balance_sheet: {
          total_assets: 450000,
          cash: 80000,
          accounts_receivable: 130000,
          inventory: 45000,
          fixed_assets: 195000,
          accumulated_depreciation: 45000,
          other_assets: 45000,
          total_liabilities: 180000,
          accounts_payable: 65000,
          loans_payable: 90000,
          other_liabilities: 25000,
          retained_earnings: 180000,
          total_equity: 270000,
        },
        schedule_k: {
          section_179_deduction: 10000,
          charitable_contributions: 4000,
          investment_interest: 0,
          net_section_1231_gain: 0,
          other_net_gain_loss: 0,
          total_foreign_taxes: 0,
          total_distributions: 80000,
        },
        owner_info: {
          owner_compensation: 180000,
          guaranteed_payments: 0,
          distributions: 80000,
          loans_to_shareholders: 0,
          loans_from_shareholders: 0,
        },
        covid_adjustments: {
          ppp_loan: 50000,
          ppp_forgiveness: 50000,
          eidl_grant: 10000,
          erc_credit: 20000,
        },
      },
    },
    available_years: [2023, 2022],
    red_flags: {
      loans_to_shareholders: false,
      declining_revenue: false,
      negative_equity: false,
      high_owner_compensation: false,
      related_party_transactions: false,
      unusual_expenses: false,
      missing_schedules: false,
      notes: [],
    },
    ...overrides,
  };
}

describe('data-accessors', () => {
  describe('year data accessors', () => {
    it('getYearsSorted returns years descending', () => {
      const extraction = createMockExtraction();
      const years = getYearsSorted(extraction);

      expect(years).toEqual([2023, 2022]);
    });

    it('getLatestYearData returns most recent year', () => {
      const extraction = createMockExtraction();
      const data = getLatestYearData(extraction);

      expect(data?.tax_year).toBe(2023);
    });

    it('getYearData returns null for missing year', () => {
      const extraction = createMockExtraction();
      const data = getYearData(extraction, 2020);

      expect(data).toBeNull();
    });
  });

  describe('owner compensation (entity-type aware)', () => {
    it('S-Corp uses compensation_of_officers', () => {
      const extraction = createMockExtraction();
      const comp = getOwnerCompensation(extraction, 2023);

      expect(comp).toBe(200000);
    });

    it('Partnership uses guaranteed_payments', () => {
      const extraction = createMockExtraction({
        company_info: {
          ...createMockExtraction().company_info,
          entity_type: 'Partnership',
        },
        financial_data: {
          2023: {
            ...createMockExtraction().financial_data[2023],
            owner_info: {
              ...createMockExtraction().financial_data[2023].owner_info,
              guaranteed_payments: 150000,
            },
          },
        },
        available_years: [2023],
      });

      const comp = getOwnerCompensation(extraction, 2023);
      expect(comp).toBe(150000);
    });

    it('Sole Prop uses net_income', () => {
      const extraction = createMockExtraction({
        company_info: {
          ...createMockExtraction().company_info,
          entity_type: 'Sole Proprietorship',
        },
      });

      const comp = getOwnerCompensation(extraction, 2023);
      expect(comp).toBe(150000); // net_income
    });
  });

  describe('depreciation add-back', () => {
    it('includes both depreciation and Section 179', () => {
      const extraction = createMockExtraction();
      const addBack = getDepreciationAddBack(extraction, 2023);

      expect(addBack).toBe(25000 + 15000); // depreciation + section 179
    });
  });

  describe('COVID adjustments', () => {
    it('returns COVID adjustments for year', () => {
      const extraction = createMockExtraction();
      const covid = getCovidAdjustments(extraction, 2022);

      expect(covid.ppp_forgiveness).toBe(50000);
      expect(covid.erc_credit).toBe(20000);
    });

    it('getTotalCovidAdjustments sums all relief', () => {
      const extraction = createMockExtraction();
      const total = getTotalCovidAdjustments(extraction, 2022);

      expect(total).toBe(50000 + 10000 + 20000); // ppp + eidl + erc
    });
  });

  describe('revenue and income', () => {
    it('getRevenue returns gross receipts', () => {
      const extraction = createMockExtraction();
      expect(getRevenue(extraction, 2023)).toBe(1000000);
    });

    it('getNetIncome returns net income', () => {
      const extraction = createMockExtraction();
      expect(getNetIncome(extraction, 2023)).toBe(150000);
    });
  });

  describe('balance sheet', () => {
    it('getTotalAssets returns total assets', () => {
      const extraction = createMockExtraction();
      expect(getTotalAssets(extraction, 2023)).toBe(500000);
    });

    it('getBookValue calculates assets minus liabilities', () => {
      const extraction = createMockExtraction();
      expect(getBookValue(extraction, 2023)).toBe(500000 - 200000);
    });
  });

  describe('SDE calculation', () => {
    it('getAllSdeAddBacks returns categorized items', () => {
      const extraction = createMockExtraction();
      const result = getAllSdeAddBacks(extraction, 2023);

      expect(result.items.length).toBeGreaterThan(0);

      // Check for owner compensation
      const ownerComp = result.items.find(i => i.category === 'owner_compensation');
      expect(ownerComp?.amount).toBe(200000);

      // Check for depreciation
      const depreciation = result.items.find(i => i.category === 'depreciation');
      expect(depreciation?.amount).toBe(25000);

      // Check for Section 179
      const section179 = result.items.find(i => i.category === 'section_179');
      expect(section179?.amount).toBe(15000);

      // Check for interest
      const interest = result.items.find(i => i.category === 'interest');
      expect(interest?.amount).toBe(5000);
    });

    it('getNormalizedNetIncome subtracts COVID adjustments', () => {
      const extraction = createMockExtraction();

      // 2023 has no COVID adjustments
      expect(getNormalizedNetIncome(extraction, 2023)).toBe(150000);

      // 2022 has COVID adjustments
      expect(getNormalizedNetIncome(extraction, 2022)).toBe(120000 - 80000); // net - covid
    });

    it('calculateSDE combines net income and add-backs', () => {
      const extraction = createMockExtraction();
      const sde = calculateSDE(extraction, 2023);

      // Net income: 150000
      // Add-backs: 200000 (officer) + 25000 (dep) + 15000 (179) + 2000 (amort) + 5000 (int) = 247000
      // Total: 150000 + 247000 = 397000
      expect(sde).toBe(397000);
    });

    it('getLatestSDE returns most recent year SDE', () => {
      const extraction = createMockExtraction();
      const sde = getLatestSDE(extraction);

      expect(sde).toBe(calculateSDE(extraction, 2023));
    });

    it('getWeightedAverageSDE applies weights correctly', () => {
      const extraction = createMockExtraction();
      const weightedSDE = getWeightedAverageSDE(extraction);

      const sde2023 = calculateSDE(extraction, 2023);
      const sde2022 = calculateSDE(extraction, 2022);

      // Weights: 2023=3, 2022=2
      const expected = (sde2023 * 3 + sde2022 * 2) / 5;
      expect(weightedSDE).toBeCloseTo(expected, 2);
    });
  });

  describe('edge cases', () => {
    it('handles missing year data gracefully', () => {
      const extraction = createMockExtraction();

      expect(getRevenue(extraction, 1900)).toBe(0);
      expect(getNetIncome(extraction, 1900)).toBe(0);
      expect(getAllSdeAddBacks(extraction, 1900)).toEqual({ total: 0, items: [] });
    });

    it('handles empty extraction', () => {
      const extraction = createMockExtraction({
        financial_data: {},
        available_years: [],
      });

      expect(getLatestYearData(extraction)).toBeNull();
      expect(getYearsSorted(extraction)).toEqual([]);
      expect(getLatestSDE(extraction)).toBe(0);
      expect(getWeightedAverageSDE(extraction)).toBe(0);
    });
  });
});
