/**
 * ValuationDataStore - Single Source of Truth for Valuation Data
 *
 * PRD-A: Data Consistency Engine
 * Accepts pre-computed values from the calculation engine + metadata from pass outputs.
 * The entire store is frozen after creation to prevent mutation.
 *
 * NO independent calculations — all computed values come from the calculation engine.
 */

import type { CalculationEngineOutput } from '../calculations/types';

// ============ INTERFACES ============

export interface FinancialData {
  readonly revenue: number;
  readonly cogs: number;
  readonly gross_profit: number;
  readonly sde: number;
  readonly ebitda: number;
  readonly net_income: number;
  readonly officer_compensation: number;
  readonly interest_expense: number;
  readonly depreciation: number;
  readonly amortization: number;
  readonly weighted_sde: number;
  readonly weighted_ebitda: number;
  readonly sde_by_year: ReadonlyArray<{ period: string; sde: number }>;
  readonly ebitda_by_year: ReadonlyArray<{ period: string; ebitda: number }>;
  readonly revenue_by_year: ReadonlyArray<{ period: string; revenue: number }>;
}

export interface ValuationData {
  readonly income_approach_value: number;
  readonly market_approach_value: number;
  readonly asset_approach_value: number;
  readonly final_value: number;
  readonly preliminary_value: number;
  readonly value_range_low: number;
  readonly value_range_high: number;
  readonly sde_multiple: number;
  readonly cap_rate: number;
  readonly income_weight: number;
  readonly market_weight: number;
  readonly asset_weight: number;
  readonly dlom_percentage: number;
  readonly dlom_applied: boolean;
}

export interface CompanyData {
  readonly name: string;
  readonly industry: string;
  readonly naics_code: string;
  readonly entity_type: string;
  readonly fiscal_year_end: string;
  readonly location: string;
  readonly years_in_business: number;
}

export interface BalanceSheetSummary {
  readonly total_assets: number;
  readonly total_liabilities: number;
  readonly total_equity: number;
  readonly cash: number;
  readonly accounts_receivable: number;
  readonly inventory: number;
  readonly fixed_assets: number;
  readonly intangible_assets: number;
  readonly accounts_payable: number;
  readonly current_assets: number;
  readonly current_liabilities: number;
}

export interface MetadataInfo {
  readonly report_date: string;
  readonly valuation_date: string;
  readonly generated_at: string;
  readonly engine_version: string;
  readonly total_calc_steps: number;
}

export interface ValuationDataStore {
  readonly financial: FinancialData;
  readonly valuation: ValuationData;
  readonly company: CompanyData;
  readonly balance_sheet: BalanceSheetSummary;
  readonly metadata: MetadataInfo;
}

// ============ FACTORY INPUT ============

export interface DataStoreFromEngineInput {
  calculationResults: CalculationEngineOutput;
  companyName: string;
  industry: string;
  naicsCode: string;
  entityType?: string;
  fiscalYearEnd?: string;
  location?: string;
  yearsInBusiness?: number;
  valuationDate?: string;
  // Balance sheet data from pass outputs
  balanceSheet?: {
    total_assets?: number;
    total_liabilities?: number;
    total_equity?: number;
    cash?: number;
    accounts_receivable?: number;
    inventory?: number;
    fixed_assets?: number;
    intangible_assets?: number;
    accounts_payable?: number;
    current_assets?: number;
    current_liabilities?: number;
  };
  // Additional financial data from pass outputs
  revenue?: number;
  cogs?: number;
  gross_profit?: number;
  net_income?: number;
  officer_compensation?: number;
  interest_expense?: number;
  depreciation?: number;
  amortization?: number;
}

// ============ DEEP FREEZE ============

function deepFreeze<T extends object>(obj: T): Readonly<T> {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  const propNames = Object.getOwnPropertyNames(obj) as (keyof T)[];
  for (const name of propNames) {
    const value = obj[name];
    if (value && typeof value === 'object') {
      deepFreeze(value as object);
    }
  }
  return Object.freeze(obj);
}

// ============ FACTORY FUNCTION ============

/**
 * Create a frozen ValuationDataStore from calculation engine output + pass metadata.
 * This is the ONLY way to create a data store — no independent calculations.
 */
export function createValuationDataStore(input: DataStoreFromEngineInput): ValuationDataStore {
  const calc = input.calculationResults;

  // Map earnings data from calculation engine
  const sdeByYear = calc.earnings.sde_by_year.map(y => ({
    period: y.period,
    sde: y.sde,
  }));
  const ebitdaByYear = calc.earnings.ebitda_by_year.map(y => ({
    period: y.period,
    ebitda: y.adjusted_ebitda,
  }));

  // Get revenue by year from the SDE year data (net_income + adjustments give us SDE, but we need revenue from pass)
  // We'll use the earnings data periods to correlate
  const revenueByYear = sdeByYear.map(y => ({
    period: y.period,
    revenue: 0, // Will be filled from pass outputs if available
  }));

  const financial: FinancialData = {
    revenue: input.revenue || 0,
    cogs: input.cogs || 0,
    gross_profit: input.gross_profit || 0,
    sde: sdeByYear.length > 0 ? sdeByYear[0].sde : 0,
    ebitda: ebitdaByYear.length > 0 ? ebitdaByYear[0].ebitda : 0,
    net_income: input.net_income || 0,
    officer_compensation: input.officer_compensation || 0,
    interest_expense: input.interest_expense || 0,
    depreciation: input.depreciation || 0,
    amortization: input.amortization || 0,
    weighted_sde: calc.earnings.weighted_sde,
    weighted_ebitda: calc.earnings.weighted_ebitda,
    sde_by_year: sdeByYear,
    ebitda_by_year: ebitdaByYear,
    revenue_by_year: revenueByYear,
  };

  // Get approach weights from synthesis
  const assetSummary = calc.synthesis.approach_summary.find(a => a.approach === 'Asset');
  const incomeSummary = calc.synthesis.approach_summary.find(a => a.approach === 'Income');
  const marketSummary = calc.synthesis.approach_summary.find(a => a.approach === 'Market');

  const valuation: ValuationData = {
    income_approach_value: calc.income_approach.income_approach_value,
    market_approach_value: calc.market_approach.market_approach_value,
    asset_approach_value: calc.asset_approach.adjusted_net_asset_value,
    final_value: calc.synthesis.final_concluded_value,
    preliminary_value: calc.synthesis.preliminary_value,
    value_range_low: calc.synthesis.value_range.low,
    value_range_high: calc.synthesis.value_range.high,
    sde_multiple: calc.market_approach.adjusted_multiple,
    cap_rate: calc.income_approach.cap_rate_components.capitalization_rate,
    income_weight: incomeSummary?.weight ?? 0.40,
    market_weight: marketSummary?.weight ?? 0.40,
    asset_weight: assetSummary?.weight ?? 0.20,
    dlom_percentage: calc.synthesis.discounts_and_premiums.dlom.percentage,
    dlom_applied: calc.synthesis.discounts_and_premiums.dlom.applicable,
  };

  const bs = input.balanceSheet || {};
  const balance_sheet: BalanceSheetSummary = {
    total_assets: bs.total_assets || 0,
    total_liabilities: bs.total_liabilities || 0,
    total_equity: bs.total_equity || 0,
    cash: bs.cash || 0,
    accounts_receivable: bs.accounts_receivable || 0,
    inventory: bs.inventory || 0,
    fixed_assets: bs.fixed_assets || 0,
    intangible_assets: bs.intangible_assets || 0,
    accounts_payable: bs.accounts_payable || 0,
    current_assets: bs.current_assets || 0,
    current_liabilities: bs.current_liabilities || 0,
  };

  const company: CompanyData = {
    name: input.companyName,
    industry: input.industry,
    naics_code: input.naicsCode,
    entity_type: input.entityType || '',
    fiscal_year_end: input.fiscalYearEnd || '',
    location: input.location || '',
    years_in_business: input.yearsInBusiness || 0,
  };

  const metadata: MetadataInfo = {
    report_date: new Date().toISOString().split('T')[0],
    valuation_date: input.valuationDate || new Date().toISOString().split('T')[0],
    generated_at: new Date().toISOString(),
    engine_version: calc.engine_version,
    total_calc_steps: calc.total_steps,
  };

  const store: ValuationDataStore = {
    financial,
    valuation,
    company,
    balance_sheet,
    metadata,
  };

  return deepFreeze(store) as ValuationDataStore;
}
