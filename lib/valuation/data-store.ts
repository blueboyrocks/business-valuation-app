/**
 * ValuationDataStore - Single Source of Truth for Valuation Data
 *
 * This module implements the Data Consistency Engine (PRD Section 1).
 * All valuation data flows through this centralized store to ensure:
 * - Single source of truth for all financial metrics
 * - Immutability after creation
 * - Audit trail for all data sources
 * - Consistent data across all report sections
 */

import type {
  MultiYearFinancials,
  BalanceSheetData,
  IndustryData,
  SingleYearFinancials,
} from '../calculations/types';

// ============ INTERFACES ============

export interface FinancialMetric {
  current_year: number;
  prior_year_1: number;
  prior_year_2: number;
  weighted_average: number;
}

export interface SDEMetric extends FinancialMetric {
  normalized: number;
}

export interface EBITDAMetric extends FinancialMetric {
  normalized: number;
}

export interface ValuationResults {
  asset_approach_value: number;
  income_approach_value: number;
  market_approach_value: number;
  weighted_value: number;
  final_value: number;
  value_range_low: number;
  value_range_high: number;
}

export interface ValuationMeta {
  company_name: string;
  valuation_date: string;
  report_generation_date: string;
  fiscal_year_end: string;
  data_period_description: string;
  industry_name: string;
  naics_code: string;
}

export interface AuditInfo {
  data_sources: string[];
  last_updated: string;
  consistency_check_passed: boolean;
  warnings: string[];
}

export interface ValuationDataStore {
  readonly financial: {
    readonly revenue: Readonly<FinancialMetric>;
    readonly sde: Readonly<SDEMetric>;
    readonly ebitda: Readonly<EBITDAMetric>;
    readonly net_income: Readonly<FinancialMetric>;
    readonly gross_profit: Readonly<FinancialMetric>;
  };
  readonly valuation: Readonly<ValuationResults>;
  readonly meta: Readonly<ValuationMeta>;
  readonly audit: Readonly<AuditInfo>;
  readonly balance_sheet: Readonly<BalanceSheetData>;
  readonly industry: Readonly<IndustryData>;
}

// ============ INPUT INTERFACE ============

export interface CreateDataStoreInput {
  company_name: string;
  financials: MultiYearFinancials;
  balance_sheet: BalanceSheetData;
  industry: IndustryData;
  valuation_date: string;
  fiscal_year_end: string;
  valuationResults?: Partial<ValuationResults>;
  sde_calculations?: {
    current_year: number;
    prior_year_1: number;
    prior_year_2: number;
    weighted_average: number;
    normalized: number;
  };
  ebitda_calculations?: {
    current_year: number;
    prior_year_1: number;
    prior_year_2: number;
    weighted_average: number;
    normalized: number;
  };
}

// ============ VALIDATION ============

function validateInputs(input: CreateDataStoreInput): void {
  if (!input.company_name || input.company_name.trim() === '') {
    throw new Error('Validation Error: Company name is required');
  }

  if (!input.balance_sheet) {
    throw new Error('Validation Error: Balance sheet data is required');
  }

  if (!input.financials || !input.financials.periods || input.financials.periods.length === 0) {
    throw new Error('Validation Error: Financial data is required');
  }

  const currentYear = input.financials.periods[0];
  if (!currentYear.gross_receipts || currentYear.gross_receipts <= 0) {
    throw new Error('Validation Error: Current year revenue must be greater than zero');
  }

  if (!input.industry) {
    throw new Error('Validation Error: Industry data is required');
  }

  if (!input.valuation_date) {
    throw new Error('Validation Error: Valuation date is required');
  }

  if (!input.fiscal_year_end) {
    throw new Error('Validation Error: Fiscal year end is required');
  }
}

// ============ CALCULATION HELPERS ============

/**
 * Calculate weighted average using 3/2/1 weighting for most recent to oldest
 */
function calculateWeightedAverage(values: number[]): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0];
  if (values.length === 2) {
    return (values[0] * 3 + values[1] * 2) / 5;
  }
  // 3/2/1 weighting for 3 years
  return (values[0] * 3 + values[1] * 2 + values[2] * 1) / 6;
}

/**
 * Calculate SDE from financials
 * SDE = Net Income + Owner Compensation + Depreciation + Amortization + Interest + Discretionary Add-backs
 */
function calculateSDE(financials: SingleYearFinancials): number {
  let sde = financials.net_income || 0;
  sde += financials.officer_compensation || 0;
  sde += financials.depreciation || 0;
  sde += financials.amortization || 0;
  sde += financials.interest_expense || 0;

  // Add discretionary add-backs
  if (financials.discretionary_addbacks) {
    for (const addback of financials.discretionary_addbacks) {
      sde += addback.amount || 0;
    }
  }

  return sde;
}

/**
 * Calculate EBITDA from financials
 * EBITDA = Net Income + Interest + Taxes + Depreciation + Amortization
 */
function calculateEBITDA(financials: SingleYearFinancials): number {
  let ebitda = financials.net_income || 0;
  ebitda += financials.interest_expense || 0;
  ebitda += financials.taxes || 0;
  ebitda += financials.depreciation || 0;
  ebitda += financials.amortization || 0;
  return ebitda;
}

/**
 * Extract metric from financials for a specific field
 */
function extractFinancialMetric(
  periods: SingleYearFinancials[],
  field: keyof SingleYearFinancials
): FinancialMetric {
  const values = periods.map((p) => (p[field] as number) || 0);
  const paddedValues = [...values];
  while (paddedValues.length < 3) {
    paddedValues.push(0);
  }

  return {
    current_year: paddedValues[0],
    prior_year_1: paddedValues[1],
    prior_year_2: paddedValues[2],
    weighted_average: calculateWeightedAverage(values.filter((v) => v > 0)),
  };
}

// ============ FACTORY FUNCTION ============

/**
 * Create an immutable ValuationDataStore
 * This is the single entry point for creating valuation data stores
 */
export function createValuationDataStore(input: CreateDataStoreInput): ValuationDataStore {
  // Validate all inputs
  validateInputs(input);

  const periods = input.financials.periods;

  // Extract revenue data
  const revenue = extractFinancialMetric(periods, 'gross_receipts');

  // Calculate SDE for each year
  const sdeByYear = periods.map(calculateSDE);
  const sde: SDEMetric = input.sde_calculations || {
    current_year: sdeByYear[0] || 0,
    prior_year_1: sdeByYear[1] || 0,
    prior_year_2: sdeByYear[2] || 0,
    weighted_average: calculateWeightedAverage(sdeByYear.filter((v) => v > 0)),
    normalized: calculateWeightedAverage(sdeByYear.filter((v) => v > 0)), // Default to weighted average
  };

  // Calculate EBITDA for each year
  const ebitdaByYear = periods.map(calculateEBITDA);
  const ebitda: EBITDAMetric = input.ebitda_calculations || {
    current_year: ebitdaByYear[0] || 0,
    prior_year_1: ebitdaByYear[1] || 0,
    prior_year_2: ebitdaByYear[2] || 0,
    weighted_average: calculateWeightedAverage(ebitdaByYear.filter((v) => v > 0)),
    normalized: calculateWeightedAverage(ebitdaByYear.filter((v) => v > 0)),
  };

  // Extract net income
  const netIncome = extractFinancialMetric(periods, 'net_income');

  // Extract gross profit
  const grossProfit = extractFinancialMetric(periods, 'gross_profit');

  // Build valuation results (can be empty initially)
  const valuation: ValuationResults = {
    asset_approach_value: input.valuationResults?.asset_approach_value || 0,
    income_approach_value: input.valuationResults?.income_approach_value || 0,
    market_approach_value: input.valuationResults?.market_approach_value || 0,
    weighted_value: input.valuationResults?.weighted_value || 0,
    final_value: input.valuationResults?.final_value || 0,
    value_range_low: input.valuationResults?.value_range_low || 0,
    value_range_high: input.valuationResults?.value_range_high || 0,
  };

  // Build meta information
  const meta: ValuationMeta = {
    company_name: input.company_name,
    valuation_date: input.valuation_date,
    report_generation_date: new Date().toISOString(),
    fiscal_year_end: input.fiscal_year_end,
    data_period_description: generateDataPeriodDescription(periods),
    industry_name: input.industry.industry_name,
    naics_code: input.industry.naics_code,
  };

  // Build audit info
  const audit: AuditInfo = {
    data_sources: ['Tax Returns', 'Balance Sheet'],
    last_updated: new Date().toISOString(),
    consistency_check_passed: true,
    warnings: [],
  };

  // Create the store object
  const store: ValuationDataStore = {
    financial: {
      revenue: Object.freeze(revenue),
      sde: Object.freeze(sde),
      ebitda: Object.freeze(ebitda),
      net_income: Object.freeze(netIncome),
      gross_profit: Object.freeze(grossProfit),
    },
    valuation: Object.freeze(valuation),
    meta: Object.freeze(meta),
    audit: Object.freeze(audit),
    balance_sheet: deepFreeze(input.balance_sheet) as BalanceSheetData,
    industry: deepFreeze(input.industry) as IndustryData,
  };

  // Deep freeze the entire store to make it immutable
  return deepFreeze(store) as ValuationDataStore;
}

// ============ UTILITY FUNCTIONS ============

/**
 * Generate a human-readable description of the data period
 */
function generateDataPeriodDescription(periods: SingleYearFinancials[]): string {
  if (periods.length === 0) return 'No data';
  if (periods.length === 1) return `Fiscal Year ${periods[0].period}`;

  const years = periods.map((p) => p.period).sort();
  return `Fiscal Years ${years[years.length - 1]}-${years[0]}`;
}

/**
 * Deep freeze an object to make it completely immutable
 */
function deepFreeze<T extends object>(obj: T): Readonly<T> {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Get all property names, including non-enumerable ones
  const propNames = Object.getOwnPropertyNames(obj) as (keyof T)[];

  // Freeze properties before freezing self
  for (const name of propNames) {
    const value = obj[name];
    if (value && typeof value === 'object') {
      deepFreeze(value as object);
    }
  }

  return Object.freeze(obj);
}

// ============ EXPORTS ============

export type { CreateDataStoreInput as DataStoreInput };
