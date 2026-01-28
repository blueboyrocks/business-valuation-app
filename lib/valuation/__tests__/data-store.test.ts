/**
 * ValuationDataStore Unit Tests
 * Updated to match new createValuationDataStore(DataStoreFromEngineInput) signature.
 * Uses a mock CalculationEngineOutput based on K-Factor Engineering values.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import type { CalculationEngineOutput } from '../../calculations/types';
import {
  ValuationDataStore,
  createValuationDataStore,
  DataStoreFromEngineInput,
  DataIntegrityError,
} from '../data-store';

// ============ MOCK DATA ============

/** Minimal mock CalculationEngineOutput inspired by K-Factor Engineering */
const mockCalculationResults: CalculationEngineOutput = {
  earnings: {
    sde_by_year: [
      {
        period: '2024',
        starting_net_income: 450_000,
        adjustments: [
          { category: 'Owner Compensation', description: 'Officer compensation', amount: 350_000 },
          { category: 'Interest', description: 'Interest expense', amount: 15_000 },
          { category: 'Depreciation', description: 'Depreciation', amount: 85_000 },
        ],
        total_adjustments: 450_000,
        sde: 900_000,
      },
      {
        period: '2023',
        starting_net_income: 400_000,
        adjustments: [
          { category: 'Owner Compensation', description: 'Officer compensation', amount: 320_000 },
          { category: 'Interest', description: 'Interest expense', amount: 12_000 },
          { category: 'Depreciation', description: 'Depreciation', amount: 78_000 },
        ],
        total_adjustments: 410_000,
        sde: 810_000,
      },
      {
        period: '2022',
        starting_net_income: 300_000,
        adjustments: [
          { category: 'Owner Compensation', description: 'Officer compensation', amount: 300_000 },
          { category: 'Interest', description: 'Interest expense', amount: 10_000 },
          { category: 'Depreciation', description: 'Depreciation', amount: 70_000 },
        ],
        total_adjustments: 380_000,
        sde: 680_000,
      },
    ],
    ebitda_by_year: [
      {
        period: '2024',
        starting_net_income: 450_000,
        add_interest: 15_000,
        add_taxes: 120_000,
        add_depreciation: 85_000,
        add_amortization: 10_000,
        owner_compensation_adjustment: {
          actual_owner_compensation: 350_000,
          fair_market_replacement_salary: 150_000,
          adjustment_amount: 200_000,
        },
        other_normalizing_adjustments: 0,
        adjusted_ebitda: 880_000,
      },
      {
        period: '2023',
        starting_net_income: 400_000,
        add_interest: 12_000,
        add_taxes: 100_000,
        add_depreciation: 78_000,
        add_amortization: 8_000,
        owner_compensation_adjustment: {
          actual_owner_compensation: 320_000,
          fair_market_replacement_salary: 150_000,
          adjustment_amount: 170_000,
        },
        other_normalizing_adjustments: 0,
        adjusted_ebitda: 768_000,
      },
      {
        period: '2022',
        starting_net_income: 300_000,
        add_interest: 10_000,
        add_taxes: 80_000,
        add_depreciation: 70_000,
        add_amortization: 5_000,
        owner_compensation_adjustment: {
          actual_owner_compensation: 300_000,
          fair_market_replacement_salary: 150_000,
          adjustment_amount: 150_000,
        },
        other_normalizing_adjustments: 0,
        adjusted_ebitda: 615_000,
      },
    ],
    weighted_sde: 845_000,
    weighted_ebitda: 810_000,
    weighting_method: '3-2-1 weighted average',
    weights_used: [3, 2, 1],
    calculation_steps: [],
    warnings: [],
  },
  asset_approach: {
    book_value_of_equity: 1_200_000,
    asset_adjustments: [],
    total_asset_adjustments: 100_000,
    liability_adjustments: [],
    total_liability_adjustments: 0,
    adjusted_net_asset_value: 1_300_000,
    weight: 0.20,
    calculation_steps: [],
    warnings: [],
  },
  income_approach: {
    benefit_stream: 'SDE',
    benefit_stream_value: 845_000,
    benefit_stream_rationale: 'SDE is preferred for small businesses',
    cap_rate_components: {
      risk_free_rate: 0.045,
      equity_risk_premium: 0.06,
      size_premium: 0.055,
      industry_risk_premium: 0.02,
      company_specific_risk_premium: 0.03,
      total_discount_rate: 0.21,
      long_term_growth_rate: 0.03,
      capitalization_rate: 0.18,
    },
    income_approach_value: 4_694_444,
    weight: 0.40,
    calculation_steps: [],
    warnings: [],
  },
  market_approach: {
    multiple_type: 'SDE',
    base_multiple: 2.8,
    multiple_source: 'DealStats/BizBuySell',
    adjustments: [],
    adjusted_multiple: 2.65,
    benefit_stream_value: 845_000,
    market_approach_value: 2_239_250,
    weight: 0.40,
    calculation_steps: [],
    warnings: [],
  },
  synthesis: {
    approach_summary: [
      { approach: 'Income', value: 4_694_444, weight: 0.40, weighted_value: 1_877_778 },
      { approach: 'Market', value: 2_239_250, weight: 0.40, weighted_value: 895_700 },
      { approach: 'Asset', value: 1_300_000, weight: 0.20, weighted_value: 260_000 },
    ],
    preliminary_value: 3_033_478,
    discounts_and_premiums: {
      dlom: { applicable: true, percentage: 0.15, rationale: 'Private company, no ready market' },
      dloc: { applicable: false, percentage: 0, rationale: '' },
      control_premium: { applicable: false, percentage: 0, rationale: '' },
      other_adjustments: [],
      total_adjustment_percentage: 0.15,
    },
    final_concluded_value: 2_578_456,
    value_range: { low: 2_191_688, mid: 2_578_456, high: 2_965_224, range_percentage: 0.15 },
    passes_floor_test: true,
    floor_value: 1_300_000,
    calculation_steps: [],
    warnings: [],
  },
  all_calculation_steps: [],
  total_steps: 42,
  all_warnings: [],
  formatted_tables: {
    earnings_summary: '',
    sde_detail: '',
    ebitda_detail: '',
    asset_approach: '',
    income_approach: '',
    market_approach: '',
    synthesis: '',
  },
  calculated_at: '2025-01-15T10:00:00.000Z',
  engine_version: '1.0.0',
};

/** Full DataStoreFromEngineInput based on K-Factor Engineering */
const kFactorInput: DataStoreFromEngineInput = {
  calculationResults: mockCalculationResults,
  companyName: 'K-Factor Engineering, LLC',
  industry: 'Engineering Services',
  naicsCode: '541330',
  entityType: 'LLC',
  fiscalYearEnd: '2024-12-31',
  location: 'Dallas, TX',
  yearsInBusiness: 12,
  valuationDate: '2025-01-15',
  balanceSheet: {
    total_assets: 2_500_000,
    total_liabilities: 1_100_000,
    total_equity: 1_400_000,
    cash: 350_000,
    accounts_receivable: 620_000,
    inventory: 50_000,
    fixed_assets: 900_000,
    intangible_assets: 200_000,
    accounts_payable: 280_000,
    current_assets: 1_020_000,
    current_liabilities: 450_000,
  },
  revenue: 6_265_024,
  cogs: 3_200_000,
  gross_profit: 3_065_024,
  net_income: 450_000,
  officer_compensation: 350_000,
  interest_expense: 15_000,
  depreciation: 85_000,
  amortization: 10_000,
};

// ============ TESTS ============

describe('ValuationDataStore', () => {
  let store: ValuationDataStore;

  beforeEach(() => {
    store = createValuationDataStore(kFactorInput);
  });

  describe('financial section', () => {
    it('should populate revenue from the input', () => {
      expect(store.financial.revenue).toBe(6_265_024);
    });

    it('should populate cost of goods sold', () => {
      expect(store.financial.cogs).toBe(3_200_000);
    });

    it('should populate gross profit', () => {
      expect(store.financial.gross_profit).toBe(3_065_024);
    });

    it('should populate SDE from the first year of calculation output', () => {
      expect(store.financial.sde).toBe(900_000);
    });

    it('should populate EBITDA from the first year of calculation output', () => {
      expect(store.financial.ebitda).toBe(880_000);
    });

    it('should populate net income', () => {
      expect(store.financial.net_income).toBe(450_000);
    });

    it('should populate officer compensation', () => {
      expect(store.financial.officer_compensation).toBe(350_000);
    });

    it('should populate interest expense', () => {
      expect(store.financial.interest_expense).toBe(15_000);
    });

    it('should populate depreciation', () => {
      expect(store.financial.depreciation).toBe(85_000);
    });

    it('should populate amortization', () => {
      expect(store.financial.amortization).toBe(10_000);
    });

    it('should populate weighted SDE from calculation engine', () => {
      expect(store.financial.weighted_sde).toBe(845_000);
    });

    it('should populate weighted EBITDA from calculation engine', () => {
      expect(store.financial.weighted_ebitda).toBe(810_000);
    });

    it('should populate sde_by_year array from calculation engine', () => {
      expect(store.financial.sde_by_year).toHaveLength(3);
      expect(store.financial.sde_by_year[0]).toEqual({ period: '2024', sde: 900_000 });
      expect(store.financial.sde_by_year[1]).toEqual({ period: '2023', sde: 810_000 });
      expect(store.financial.sde_by_year[2]).toEqual({ period: '2022', sde: 680_000 });
    });

    it('should populate ebitda_by_year array from calculation engine', () => {
      expect(store.financial.ebitda_by_year).toHaveLength(3);
      expect(store.financial.ebitda_by_year[0]).toEqual({ period: '2024', ebitda: 880_000 });
      expect(store.financial.ebitda_by_year[1]).toEqual({ period: '2023', ebitda: 768_000 });
      expect(store.financial.ebitda_by_year[2]).toEqual({ period: '2022', ebitda: 615_000 });
    });
  });

  describe('valuation section', () => {
    it('should populate final_value from synthesis', () => {
      expect(store.valuation.final_value).toBe(2_578_456);
    });

    it('should populate preliminary_value from synthesis', () => {
      expect(store.valuation.preliminary_value).toBe(3_033_478);
    });

    it('should populate income_approach_value', () => {
      expect(store.valuation.income_approach_value).toBe(4_694_444);
    });

    it('should populate market_approach_value', () => {
      expect(store.valuation.market_approach_value).toBe(2_239_250);
    });

    it('should populate asset_approach_value', () => {
      expect(store.valuation.asset_approach_value).toBe(1_300_000);
    });

    it('should populate value range from synthesis', () => {
      expect(store.valuation.value_range_low).toBe(2_191_688);
      expect(store.valuation.value_range_high).toBe(2_965_224);
    });

    it('should populate SDE multiple from market approach', () => {
      expect(store.valuation.sde_multiple).toBe(2.65);
    });

    it('should populate capitalization rate from income approach', () => {
      expect(store.valuation.cap_rate).toBe(0.18);
    });

    it('should populate approach weights from synthesis summary', () => {
      expect(store.valuation.income_weight).toBe(0.40);
      expect(store.valuation.market_weight).toBe(0.40);
      expect(store.valuation.asset_weight).toBe(0.20);
    });

    it('should populate DLOM discount from synthesis', () => {
      expect(store.valuation.dlom_percentage).toBe(0.15);
      expect(store.valuation.dlom_applied).toBe(true);
    });
  });

  describe('company section', () => {
    it('should populate company name', () => {
      expect(store.company.name).toBe('K-Factor Engineering, LLC');
    });

    it('should populate industry', () => {
      expect(store.company.industry).toBe('Engineering Services');
    });

    it('should populate NAICS code', () => {
      expect(store.company.naics_code).toBe('541330');
    });

    it('should populate entity type', () => {
      expect(store.company.entity_type).toBe('LLC');
    });

    it('should populate fiscal year end', () => {
      expect(store.company.fiscal_year_end).toBe('2024-12-31');
    });

    it('should populate location', () => {
      expect(store.company.location).toBe('Dallas, TX');
    });

    it('should populate years in business', () => {
      expect(store.company.years_in_business).toBe(12);
    });
  });

  describe('balance_sheet section', () => {
    it('should populate total assets', () => {
      expect(store.balance_sheet.total_assets).toBe(2_500_000);
    });

    it('should populate total liabilities', () => {
      expect(store.balance_sheet.total_liabilities).toBe(1_100_000);
    });

    it('should populate total equity', () => {
      expect(store.balance_sheet.total_equity).toBe(1_400_000);
    });

    it('should populate cash', () => {
      expect(store.balance_sheet.cash).toBe(350_000);
    });

    it('should populate accounts receivable', () => {
      expect(store.balance_sheet.accounts_receivable).toBe(620_000);
    });

    it('should populate inventory', () => {
      expect(store.balance_sheet.inventory).toBe(50_000);
    });

    it('should populate fixed assets', () => {
      expect(store.balance_sheet.fixed_assets).toBe(900_000);
    });

    it('should populate intangible assets', () => {
      expect(store.balance_sheet.intangible_assets).toBe(200_000);
    });

    it('should populate accounts payable', () => {
      expect(store.balance_sheet.accounts_payable).toBe(280_000);
    });

    it('should populate current assets', () => {
      expect(store.balance_sheet.current_assets).toBe(1_020_000);
    });

    it('should populate current liabilities', () => {
      expect(store.balance_sheet.current_liabilities).toBe(450_000);
    });
  });

  describe('metadata section', () => {
    it('should populate valuation_date from input', () => {
      expect(store.metadata.valuation_date).toBe('2025-01-15');
    });

    it('should populate report_date as today in ISO format', () => {
      // report_date should be a valid YYYY-MM-DD string
      expect(store.metadata.report_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should populate engine_version from calculation output', () => {
      expect(store.metadata.engine_version).toBe('1.0.0');
    });

    it('should populate total_calc_steps from calculation output', () => {
      expect(store.metadata.total_calc_steps).toBe(42);
    });

    it('should populate generated_at as an ISO timestamp', () => {
      expect(store.metadata.generated_at).toBeTruthy();
      // Should be parseable as a date
      expect(new Date(store.metadata.generated_at).getTime()).not.toBeNaN();
    });
  });

  describe('immutability', () => {
    it('should be frozen at the top level', () => {
      expect(Object.isFrozen(store)).toBe(true);
    });

    it('should be deeply frozen - financial section', () => {
      expect(Object.isFrozen(store.financial)).toBe(true);
    });

    it('should be deeply frozen - valuation section', () => {
      expect(Object.isFrozen(store.valuation)).toBe(true);
    });

    it('should be deeply frozen - company section', () => {
      expect(Object.isFrozen(store.company)).toBe(true);
    });

    it('should be deeply frozen - balance_sheet section', () => {
      expect(Object.isFrozen(store.balance_sheet)).toBe(true);
    });

    it('should be deeply frozen - metadata section', () => {
      expect(Object.isFrozen(store.metadata)).toBe(true);
    });

    it('should not allow modification of financial data', () => {
      expect(() => {
        (store.financial as { revenue: number }).revenue = 0;
      }).toThrow();
    });

    it('should not allow modification of valuation data', () => {
      expect(() => {
        (store.valuation as { final_value: number }).final_value = 999_999;
      }).toThrow();
    });

    it('should not allow modification of company data', () => {
      expect(() => {
        (store.company as { name: string }).name = 'Hacked';
      }).toThrow();
    });

    it('should not allow adding new properties to the store', () => {
      expect(() => {
        (store as unknown as Record<string, unknown>).newProperty = 'test';
      }).toThrow();
    });
  });
});

describe('createValuationDataStore with optional fields omitted', () => {
  it('should default optional company fields to empty/zero', () => {
    const minimalInput: DataStoreFromEngineInput = {
      calculationResults: mockCalculationResults,
      companyName: 'Minimal Corp',
      industry: 'Consulting',
      naicsCode: '541611',
      revenue: 6_265_024,
    };

    const store = createValuationDataStore(minimalInput);

    expect(store.company.name).toBe('Minimal Corp');
    expect(store.company.industry).toBe('Consulting');
    expect(store.company.naics_code).toBe('541611');
    expect(store.company.sic_code).toBe('');
    expect(store.company.entity_type).toBe('');
    expect(store.company.fiscal_year_end).toBe('');
    expect(store.company.location).toBe('');
    expect(store.company.years_in_business).toBe(0);
  });

  it('should default balance sheet fields to zero when omitted', () => {
    const inputWithoutBalanceSheet: DataStoreFromEngineInput = {
      calculationResults: mockCalculationResults,
      companyName: 'No BS Corp',
      industry: 'Consulting',
      naicsCode: '541611',
      revenue: 6_265_024,
    };

    const store = createValuationDataStore(inputWithoutBalanceSheet);

    expect(store.balance_sheet.total_assets).toBe(0);
    expect(store.balance_sheet.total_liabilities).toBe(0);
    expect(store.balance_sheet.total_equity).toBe(0);
    expect(store.balance_sheet.cash).toBe(0);
    expect(store.balance_sheet.accounts_receivable).toBe(0);
  });

  it('should default non-required financial pass-through fields to zero when omitted', () => {
    const inputWithoutOptionalFinancials: DataStoreFromEngineInput = {
      calculationResults: mockCalculationResults,
      companyName: 'No Financials Corp',
      industry: 'Consulting',
      naicsCode: '541611',
      revenue: 6_265_024, // required
    };

    const store = createValuationDataStore(inputWithoutOptionalFinancials);

    expect(store.financial.cogs).toBe(0);
    expect(store.financial.gross_profit).toBe(0);
    expect(store.financial.net_income).toBe(0);
    expect(store.financial.officer_compensation).toBe(0);
    expect(store.financial.interest_expense).toBe(0);
    expect(store.financial.depreciation).toBe(0);
    expect(store.financial.amortization).toBe(0);
  });

  it('should still derive SDE/EBITDA from engine even without pass-through fields', () => {
    const minimalInput: DataStoreFromEngineInput = {
      calculationResults: mockCalculationResults,
      companyName: 'Engine Only Corp',
      industry: 'Consulting',
      naicsCode: '541611',
      revenue: 6_265_024,
    };

    const store = createValuationDataStore(minimalInput);

    // These come from the calculation engine, not from pass-through fields
    expect(store.financial.sde).toBe(900_000);
    expect(store.financial.ebitda).toBe(880_000);
    expect(store.financial.weighted_sde).toBe(845_000);
    expect(store.financial.weighted_ebitda).toBe(810_000);
    expect(store.financial.sde_by_year).toHaveLength(3);
    expect(store.financial.ebitda_by_year).toHaveLength(3);
  });

  it('should default valuation_date to today when not provided', () => {
    const inputWithoutDate: DataStoreFromEngineInput = {
      calculationResults: mockCalculationResults,
      companyName: 'No Date Corp',
      industry: 'Consulting',
      naicsCode: '541611',
      revenue: 6_265_024,
    };

    const store = createValuationDataStore(inputWithoutDate);

    const today = new Date().toISOString().split('T')[0];
    expect(store.metadata.valuation_date).toBe(today);
  });

  it('should still produce a frozen store with minimal input', () => {
    const minimalInput: DataStoreFromEngineInput = {
      calculationResults: mockCalculationResults,
      companyName: 'Frozen Corp',
      industry: 'Consulting',
      naicsCode: '541611',
      revenue: 6_265_024,
    };

    const store = createValuationDataStore(minimalInput);

    expect(Object.isFrozen(store)).toBe(true);
    expect(Object.isFrozen(store.financial)).toBe(true);
    expect(Object.isFrozen(store.valuation)).toBe(true);
    expect(Object.isFrozen(store.company)).toBe(true);
    expect(Object.isFrozen(store.balance_sheet)).toBe(true);
    expect(Object.isFrozen(store.metadata)).toBe(true);
    expect(Object.isFrozen(store.risk)).toBe(true);
    expect(Object.isFrozen(store.data_quality)).toBe(true);
  });
});

describe('new PRD-H fields', () => {
  let store: ValuationDataStore;

  beforeEach(() => {
    store = createValuationDataStore(kFactorInput);
  });

  it('should populate dlom_amount from percentage * preliminary_value', () => {
    const expected = 0.15 * 3_033_478;
    expect(store.valuation.dlom_amount).toBeCloseTo(expected, 0);
  });

  it('should populate dloc_rate from synthesis', () => {
    expect(store.valuation.dloc_rate).toBe(0);
  });

  it('should populate dloc_amount', () => {
    expect(store.valuation.dloc_amount).toBe(0);
  });

  it('should populate sic_code (defaults to empty)', () => {
    expect(store.company.sic_code).toBe('');
  });

  it('should populate risk section with defaults', () => {
    expect(store.risk).toBeDefined();
    expect(store.risk.overall_score).toBe(50); // default
    expect(store.risk.overall_rating).toBe('Moderate');
    expect(store.risk.factors).toEqual([]);
  });

  it('should populate data_quality section', () => {
    expect(store.data_quality).toBeDefined();
    expect(store.data_quality.completeness_score).toBeGreaterThan(0);
    expect(store.data_quality.years_of_data).toBe(3);
    expect(Array.isArray(store.data_quality.missing_fields)).toBe(true);
  });

  it('should freeze risk section', () => {
    expect(Object.isFrozen(store.risk)).toBe(true);
  });

  it('should freeze data_quality section', () => {
    expect(Object.isFrozen(store.data_quality)).toBe(true);
  });

  it('should populate risk rating based on score', () => {
    const lowRisk = createValuationDataStore({ ...kFactorInput, overallRiskScore: 20 });
    expect(lowRisk.risk.overall_rating).toBe('Low');

    const moderate = createValuationDataStore({ ...kFactorInput, overallRiskScore: 40 });
    expect(moderate.risk.overall_rating).toBe('Moderate');

    const elevated = createValuationDataStore({ ...kFactorInput, overallRiskScore: 60 });
    expect(elevated.risk.overall_rating).toBe('Elevated');

    const high = createValuationDataStore({ ...kFactorInput, overallRiskScore: 80 });
    expect(high.risk.overall_rating).toBe('High');
  });
});

describe('DataIntegrityError validation', () => {
  it('should throw DataIntegrityError when revenue is missing', () => {
    const inputWithoutRevenue: DataStoreFromEngineInput = {
      calculationResults: mockCalculationResults,
      companyName: 'No Revenue Corp',
      industry: 'Consulting',
      naicsCode: '541611',
      // revenue is omitted (0 or undefined)
    };

    expect(() => createValuationDataStore(inputWithoutRevenue)).toThrow(DataIntegrityError);
  });

  it('should include missing field names in the error', () => {
    const inputWithoutRevenue: DataStoreFromEngineInput = {
      calculationResults: mockCalculationResults,
      companyName: 'No Revenue Corp',
      industry: 'Consulting',
      naicsCode: '541611',
    };

    try {
      createValuationDataStore(inputWithoutRevenue);
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(DataIntegrityError);
      expect((err as DataIntegrityError).missingFields).toContain('revenue.current');
    }
  });

  it('should throw when final_value is zero', () => {
    const zeroFinalValue = {
      ...mockCalculationResults,
      synthesis: {
        ...mockCalculationResults.synthesis,
        final_concluded_value: 0,
      },
    };

    const input: DataStoreFromEngineInput = {
      calculationResults: zeroFinalValue,
      companyName: 'Zero Final Corp',
      industry: 'Consulting',
      naicsCode: '541611',
      revenue: 6_265_024,
    };

    expect(() => createValuationDataStore(input)).toThrow(DataIntegrityError);
  });

  it('should throw when weighted_sde is zero', () => {
    const zeroSDE = {
      ...mockCalculationResults,
      earnings: {
        ...mockCalculationResults.earnings,
        weighted_sde: 0,
      },
    };

    const input: DataStoreFromEngineInput = {
      calculationResults: zeroSDE,
      companyName: 'Zero SDE Corp',
      industry: 'Consulting',
      naicsCode: '541611',
      revenue: 6_265_024,
    };

    expect(() => createValuationDataStore(input)).toThrow(DataIntegrityError);
  });

  it('should not throw when all required fields are present', () => {
    expect(() => createValuationDataStore(kFactorInput)).not.toThrow();
  });
});

describe('createValuationDataStore data consistency', () => {
  it('should return the same values on repeated access', () => {
    const store = createValuationDataStore(kFactorInput);

    // Read twice and verify identity
    const rev1 = store.financial.revenue;
    const rev2 = store.financial.revenue;
    expect(rev1).toBe(rev2);

    const val1 = store.valuation.final_value;
    const val2 = store.valuation.final_value;
    expect(val1).toBe(val2);
  });

  it('should map all three approach summaries into valuation weights', () => {
    const store = createValuationDataStore(kFactorInput);

    // Weights should sum to 1.0
    const totalWeight =
      store.valuation.income_weight +
      store.valuation.market_weight +
      store.valuation.asset_weight;
    expect(totalWeight).toBeCloseTo(1.0, 10);
  });
});
