/**
 * ValuationDataAccessor - Controlled Access to Valuation Data
 *
 * PRD-A: Provides typed getters over the frozen ValuationDataStore.
 * All PDF generator financial value reads go through this accessor.
 */

import type { ValuationDataStore } from './data-store';

// ============ TYPES ============

export interface FormatOptions {
  showCents?: boolean;
  decimals?: number;
}

// ============ ACCESSOR CLASS ============

export class ValuationDataAccessor {
  private readonly store: ValuationDataStore;

  constructor(store: ValuationDataStore) {
    this.store = store;
  }

  // ============ FINANCIAL ACCESS ============

  getRevenue(): number {
    return this.store.financial.revenue;
  }

  getRevenueFormatted(): string {
    return this.formatCurrency(this.store.financial.revenue);
  }

  getCOGS(): number {
    return this.store.financial.cogs;
  }

  getGrossProfit(): number {
    return this.store.financial.gross_profit;
  }

  getGrossProfitFormatted(): string {
    return this.formatCurrency(this.store.financial.gross_profit);
  }

  getSDE(): number {
    return this.store.financial.sde;
  }

  getSDEFormatted(): string {
    return this.formatCurrency(this.store.financial.sde);
  }

  getWeightedSDE(): number {
    return this.store.financial.weighted_sde;
  }

  getWeightedSDEFormatted(): string {
    return this.formatCurrency(this.store.financial.weighted_sde);
  }

  getEBITDA(): number {
    return this.store.financial.ebitda;
  }

  getEBITDAFormatted(): string {
    return this.formatCurrency(this.store.financial.ebitda);
  }

  getWeightedEBITDA(): number {
    return this.store.financial.weighted_ebitda;
  }

  getWeightedEBITDAFormatted(): string {
    return this.formatCurrency(this.store.financial.weighted_ebitda);
  }

  getNetIncome(): number {
    return this.store.financial.net_income;
  }

  getNetIncomeFormatted(): string {
    return this.formatCurrency(this.store.financial.net_income);
  }

  getOfficerCompensation(): number {
    return this.store.financial.officer_compensation;
  }

  getInterestExpense(): number {
    return this.store.financial.interest_expense;
  }

  getDepreciation(): number {
    return this.store.financial.depreciation;
  }

  getAmortization(): number {
    return this.store.financial.amortization;
  }

  getSDEByYear(): ReadonlyArray<{ period: string; sde: number }> {
    return this.store.financial.sde_by_year;
  }

  getEBITDAByYear(): ReadonlyArray<{ period: string; ebitda: number }> {
    return this.store.financial.ebitda_by_year;
  }

  getRevenueByYear(): ReadonlyArray<{ period: string; revenue: number }> {
    return this.store.financial.revenue_by_year;
  }

  // ============ VALUATION ACCESS ============

  getFinalValue(): number {
    return this.store.valuation.final_value;
  }

  getFinalValueFormatted(): string {
    return this.formatCurrency(this.store.valuation.final_value);
  }

  getPreliminaryValue(): number {
    return this.store.valuation.preliminary_value;
  }

  getIncomeApproachValue(): number {
    return this.store.valuation.income_approach_value;
  }

  getIncomeApproachValueFormatted(): string {
    return this.formatCurrency(this.store.valuation.income_approach_value);
  }

  getMarketApproachValue(): number {
    return this.store.valuation.market_approach_value;
  }

  getMarketApproachValueFormatted(): string {
    return this.formatCurrency(this.store.valuation.market_approach_value);
  }

  getAssetApproachValue(): number {
    return this.store.valuation.asset_approach_value;
  }

  getAssetApproachValueFormatted(): string {
    return this.formatCurrency(this.store.valuation.asset_approach_value);
  }

  getValueRangeLow(): number {
    return this.store.valuation.value_range_low;
  }

  getValueRangeHigh(): number {
    return this.store.valuation.value_range_high;
  }

  getValueRangeFormatted(): string {
    return `${this.formatCurrency(this.store.valuation.value_range_low)} - ${this.formatCurrency(this.store.valuation.value_range_high)}`;
  }

  getSDEMultiple(): number {
    return this.store.valuation.sde_multiple;
  }

  getSDEMultipleFormatted(): string {
    return `${this.store.valuation.sde_multiple.toFixed(2)}x`;
  }

  getCapRate(): number {
    return this.store.valuation.cap_rate;
  }

  getCapRateFormatted(): string {
    return `${(this.store.valuation.cap_rate * 100).toFixed(1)}%`;
  }

  getAssetWeight(): number {
    return this.store.valuation.asset_weight;
  }

  getIncomeWeight(): number {
    return this.store.valuation.income_weight;
  }

  getMarketWeight(): number {
    return this.store.valuation.market_weight;
  }

  getDLOMPercentage(): number {
    return this.store.valuation.dlom_percentage;
  }

  isDLOMApplied(): boolean {
    return this.store.valuation.dlom_applied;
  }

  // ============ COMPANY ACCESS ============

  getCompanyName(): string {
    return this.store.company.name;
  }

  getIndustry(): string {
    return this.store.company.industry;
  }

  getNAICSCode(): string {
    return this.store.company.naics_code;
  }

  getEntityType(): string {
    return this.store.company.entity_type;
  }

  getFiscalYearEnd(): string {
    return this.store.company.fiscal_year_end;
  }

  // ============ BALANCE SHEET ACCESS ============

  getTotalAssets(): number {
    return this.store.balance_sheet.total_assets;
  }

  getTotalLiabilities(): number {
    return this.store.balance_sheet.total_liabilities;
  }

  getTotalEquity(): number {
    return this.store.balance_sheet.total_equity;
  }

  getCash(): number {
    return this.store.balance_sheet.cash;
  }

  getAccountsReceivable(): number {
    return this.store.balance_sheet.accounts_receivable;
  }

  getInventory(): number {
    return this.store.balance_sheet.inventory;
  }

  getFixedAssets(): number {
    return this.store.balance_sheet.fixed_assets;
  }

  getIntangibleAssets(): number {
    return this.store.balance_sheet.intangible_assets;
  }

  getCurrentRatio(): number {
    const cl = this.store.balance_sheet.current_liabilities;
    if (cl === 0) return 0;
    return this.store.balance_sheet.current_assets / cl;
  }

  getWorkingCapital(): number {
    return this.store.balance_sheet.current_assets - this.store.balance_sheet.current_liabilities;
  }

  getDebtToEquityRatio(): number {
    const eq = this.store.balance_sheet.total_equity;
    if (eq === 0) return 0;
    return this.store.balance_sheet.total_liabilities / eq;
  }

  // ============ METADATA ACCESS ============

  getValuationDate(): string {
    return this.store.metadata.valuation_date;
  }

  getReportDate(): string {
    return this.store.metadata.report_date;
  }

  getEngineVersion(): string {
    return this.store.metadata.engine_version;
  }

  // ============ DERIVED METRICS ============

  getEnterpriseValue(): number {
    return this.store.valuation.final_value + this.store.balance_sheet.total_liabilities;
  }

  getEnterpriseValueFormatted(): string {
    return this.formatCurrency(this.getEnterpriseValue());
  }

  getLiquidationValue(): number {
    const cash = this.store.balance_sheet.cash;
    const ar = this.store.balance_sheet.accounts_receivable * 0.7;
    const inv = this.store.balance_sheet.inventory * 0.5;
    const fixed = this.store.balance_sheet.fixed_assets * 0.4;
    const liabilities = this.store.balance_sheet.total_liabilities;
    const calculated = cash + ar + inv + fixed - liabilities;
    if (calculated <= 0) {
      return Math.round(this.store.valuation.asset_approach_value * 0.65);
    }
    return Math.max(0, calculated);
  }

  getLiquidationValueFormatted(): string {
    return this.formatCurrency(this.getLiquidationValue());
  }

  getProfitMargin(): number {
    if (this.store.financial.revenue === 0) return 0;
    return this.store.financial.net_income / this.store.financial.revenue;
  }

  getSDEMargin(): number {
    if (this.store.financial.revenue === 0) return 0;
    return this.store.financial.sde / this.store.financial.revenue;
  }

  getEBITDAMargin(): number {
    if (this.store.financial.revenue === 0) return 0;
    return this.store.financial.ebitda / this.store.financial.revenue;
  }

  // ============ FORMATTING HELPERS ============

  formatCurrency(value: number, options: FormatOptions = {}): string {
    if (value === null || value === undefined) return 'N/A';
    if (value === 0) return '$0';
    const { showCents = false } = options;
    if (showCents) {
      return `$${value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return `$${Math.round(value).toLocaleString('en-US')}`;
  }

  formatPercentage(value: number, decimals: number = 1): string {
    return `${(value * 100).toFixed(decimals)}%`;
  }

  formatMultiple(value: number, decimals: number = 2): string {
    return `${value.toFixed(decimals)}x`;
  }

  // ============ RAW STORE ACCESS ============

  getStore(): ValuationDataStore {
    return this.store;
  }

  hasValuationResults(): boolean {
    return this.store.valuation.final_value > 0;
  }
}

// ============ FACTORY FUNCTION ============

export function createDataAccessor(store: ValuationDataStore): ValuationDataAccessor {
  return new ValuationDataAccessor(store);
}
