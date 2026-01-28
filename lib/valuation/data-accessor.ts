/**
 * ValuationDataAccessor - Controlled Access to Valuation Data
 *
 * PRD-A: Provides typed getters over the frozen ValuationDataStore.
 * PRD-H: Enhanced with full field coverage, formatted getters, computed properties.
 * All PDF generator financial value reads go through this accessor.
 */

import type { ValuationDataStore } from './data-store';

// ============ TYPES ============

export interface FormatOptions {
  showCents?: boolean;
  decimals?: number;
}

export type ApproachType = 'asset' | 'income' | 'market';

export type SDEType = 'current' | 'normalized' | 'weighted';

export interface ValueRange {
  low: number;
  high: number;
  display: string;
}

// ============ ACCESSOR CLASS ============

export class ValuationDataAccessor {
  private readonly store: ValuationDataStore;

  constructor(store: ValuationDataStore) {
    this.store = store;
  }

  // ============ COMPANY ACCESS ============

  getCompanyName(): string {
    return this.store.company.name;
  }

  getIndustryName(): string {
    return this.store.company.industry;
  }

  /** @deprecated Use getIndustryName() */
  getIndustry(): string {
    return this.store.company.industry;
  }

  getNaicsCode(): string {
    return this.store.company.naics_code;
  }

  /** @deprecated Use getNaicsCode() */
  getNAICSCode(): string {
    return this.store.company.naics_code;
  }

  getSicCode(): string {
    return this.store.company.sic_code;
  }

  getEntityType(): string {
    return this.store.company.entity_type;
  }

  getFiscalYearEnd(): string {
    return this.store.company.fiscal_year_end;
  }

  getLocation(): string {
    return this.store.company.location;
  }

  getYearsInBusiness(): number {
    return this.store.company.years_in_business;
  }

  /**
   * Returns a fiscal year label like "FY 2024" or "FY 2023" when yearsBack > 0.
   * Extracts the year from fiscal_year_end (expected format: "YYYY-MM-DD" or "YYYY").
   */
  getFiscalYearLabel(yearsBack: number = 0): string {
    const fyEnd = this.store.company.fiscal_year_end;
    const match = fyEnd.match(/(\d{4})/);
    if (!match) return `FY ${yearsBack === 0 ? 'Current' : `-${yearsBack}`}`;
    const year = parseInt(match[1], 10) - yearsBack;
    return `FY ${year}`;
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

  // ============ REVENUE ACCESS ============

  /**
   * Get revenue for a period. Without arguments returns current year revenue.
   * @param period - Optional period string (e.g. "2024") to look up in revenue_by_year
   */
  getRevenue(period?: string): number {
    if (period) {
      const entry = this.store.financial.revenue_by_year.find(
        r => r.period === period
      );
      return entry?.revenue ?? 0;
    }
    return this.store.financial.revenue;
  }

  getFormattedRevenue(period?: string): string {
    return this.formatCurrency(this.getRevenue(period));
  }

  /** @deprecated Use getFormattedRevenue() */
  getRevenueFormatted(): string {
    return this.formatCurrency(this.store.financial.revenue);
  }

  /**
   * Calculate revenue growth rate from most recent two years in revenue_by_year.
   * Returns as a decimal (e.g. 0.15 for 15% growth).
   */
  getRevenueGrowthRate(): number {
    const years = this.store.financial.revenue_by_year;
    if (years.length < 2) return 0;
    const current = years[0].revenue;
    const prior = years[1].revenue;
    if (prior === 0) return 0;
    return (current - prior) / prior;
  }

  getFormattedRevenueGrowthRate(): string {
    return this.formatPercentage(this.getRevenueGrowthRate());
  }

  getRevenueByYear(): ReadonlyArray<{ period: string; revenue: number }> {
    return this.store.financial.revenue_by_year;
  }

  // ============ EARNINGS ACCESS ============

  /**
   * Get SDE by type.
   * - 'current': current year SDE (default)
   * - 'normalized' or 'weighted': weighted/normalized SDE
   */
  getSDE(type?: SDEType): number {
    if (type === 'normalized' || type === 'weighted') {
      return this.store.financial.weighted_sde;
    }
    return this.store.financial.sde;
  }

  getFormattedSDE(type?: SDEType): string {
    return this.formatCurrency(this.getSDE(type));
  }

  /** @deprecated Use getFormattedSDE() */
  getSDEFormatted(): string {
    return this.formatCurrency(this.store.financial.sde);
  }

  getWeightedSDE(): number {
    return this.store.financial.weighted_sde;
  }

  getWeightedSDEFormatted(): string {
    return this.formatCurrency(this.store.financial.weighted_sde);
  }

  getNetIncome(): number {
    return this.store.financial.net_income;
  }

  getNetIncomeFormatted(): string {
    return this.formatCurrency(this.store.financial.net_income);
  }

  getFormattedNetIncome(): string {
    return this.formatCurrency(this.store.financial.net_income);
  }

  getEBITDA(): number {
    return this.store.financial.ebitda;
  }

  getEBITDAFormatted(): string {
    return this.formatCurrency(this.store.financial.ebitda);
  }

  getFormattedEBITDA(): string {
    return this.formatCurrency(this.store.financial.ebitda);
  }

  getWeightedEBITDA(): number {
    return this.store.financial.weighted_ebitda;
  }

  getWeightedEBITDAFormatted(): string {
    return this.formatCurrency(this.store.financial.weighted_ebitda);
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

  // ============ DERIVED FINANCIAL METRICS ============

  getSDEMargin(): number {
    if (this.store.financial.revenue === 0) return 0;
    return this.store.financial.sde / this.store.financial.revenue;
  }

  getFormattedSDEMargin(): string {
    return this.formatPercentage(this.getSDEMargin());
  }

  getEBITDAMargin(): number {
    if (this.store.financial.revenue === 0) return 0;
    return this.store.financial.ebitda / this.store.financial.revenue;
  }

  getFormattedEBITDAMargin(): string {
    return this.formatPercentage(this.getEBITDAMargin());
  }

  getProfitMargin(): number {
    if (this.store.financial.revenue === 0) return 0;
    return this.store.financial.net_income / this.store.financial.revenue;
  }

  getFormattedProfitMargin(): string {
    return this.formatPercentage(this.getProfitMargin());
  }

  getGrossMargin(): number {
    if (this.store.financial.revenue === 0) return 0;
    return this.store.financial.gross_profit / this.store.financial.revenue;
  }

  getFormattedGrossMargin(): string {
    return this.formatPercentage(this.getGrossMargin());
  }

  // ============ BALANCE SHEET ACCESS ============

  getTotalAssets(): number {
    return this.store.balance_sheet.total_assets;
  }

  getFormattedTotalAssets(): string {
    return this.formatCurrency(this.store.balance_sheet.total_assets);
  }

  getTotalLiabilities(): number {
    return this.store.balance_sheet.total_liabilities;
  }

  getFormattedTotalLiabilities(): string {
    return this.formatCurrency(this.store.balance_sheet.total_liabilities);
  }

  getTotalEquity(): number {
    return this.store.balance_sheet.total_equity;
  }

  getFormattedTotalEquity(): string {
    return this.formatCurrency(this.store.balance_sheet.total_equity);
  }

  getBookValue(): number {
    return this.store.balance_sheet.total_assets - this.store.balance_sheet.total_liabilities;
  }

  getFormattedBookValue(): string {
    return this.formatCurrency(this.getBookValue());
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

  getFormattedCurrentRatio(): string {
    return `${this.getCurrentRatio().toFixed(2)}x`;
  }

  getWorkingCapital(): number {
    return this.store.balance_sheet.current_assets - this.store.balance_sheet.current_liabilities;
  }

  getFormattedWorkingCapital(): string {
    return this.formatCurrency(this.getWorkingCapital());
  }

  getDebtToEquityRatio(): number {
    const eq = this.store.balance_sheet.total_equity;
    if (eq === 0) return 0;
    return this.store.balance_sheet.total_liabilities / eq;
  }

  getFormattedDebtToEquityRatio(): string {
    return `${this.getDebtToEquityRatio().toFixed(2)}x`;
  }

  // ============ VALUATION APPROACH ACCESS ============

  /**
   * Get approach value by approach type.
   */
  getApproachValue(approach: ApproachType): number {
    switch (approach) {
      case 'asset': return this.store.valuation.asset_approach_value;
      case 'income': return this.store.valuation.income_approach_value;
      case 'market': return this.store.valuation.market_approach_value;
    }
  }

  getFormattedApproachValue(approach: ApproachType): string {
    return this.formatCurrency(this.getApproachValue(approach));
  }

  /**
   * Get approach weight by approach type (as decimal, e.g. 0.40).
   */
  getApproachWeight(approach: ApproachType): number {
    switch (approach) {
      case 'asset': return this.store.valuation.asset_weight;
      case 'income': return this.store.valuation.income_weight;
      case 'market': return this.store.valuation.market_weight;
    }
  }

  getFormattedApproachWeight(approach: ApproachType): string {
    return this.formatPercentage(this.getApproachWeight(approach), 0);
  }

  // Keep specific accessors for backward compatibility
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

  getAssetWeight(): number {
    return this.store.valuation.asset_weight;
  }

  getIncomeWeight(): number {
    return this.store.valuation.income_weight;
  }

  getMarketWeight(): number {
    return this.store.valuation.market_weight;
  }

  // ============ VALUATION MULTIPLES & RATES ============

  getSDEMultiple(): number {
    return this.store.valuation.sde_multiple;
  }

  getFormattedSDEMultiple(): string {
    return `${this.store.valuation.sde_multiple.toFixed(2)}x`;
  }

  /** @deprecated Use getFormattedSDEMultiple() */
  getSDEMultipleFormatted(): string {
    return this.getFormattedSDEMultiple();
  }

  getCapRate(): number {
    return this.store.valuation.cap_rate;
  }

  getFormattedCapRate(): string {
    return `${(this.store.valuation.cap_rate * 100).toFixed(1)}%`;
  }

  /** @deprecated Use getFormattedCapRate() */
  getCapRateFormatted(): string {
    return this.getFormattedCapRate();
  }

  // ============ FINAL VALUE & RANGE ============

  getFinalValue(): number {
    return this.store.valuation.final_value;
  }

  getFormattedFinalValue(): string {
    return this.formatCurrency(this.store.valuation.final_value);
  }

  /** @deprecated Use getFormattedFinalValue() */
  getFinalValueFormatted(): string {
    return this.getFormattedFinalValue();
  }

  getPreliminaryValue(): number {
    return this.store.valuation.preliminary_value;
  }

  getFormattedPreliminaryValue(): string {
    return this.formatCurrency(this.store.valuation.preliminary_value);
  }

  getValueRangeLow(): number {
    return this.store.valuation.value_range_low;
  }

  getValueRangeHigh(): number {
    return this.store.valuation.value_range_high;
  }

  /**
   * Returns the value range as a structured object with low, high, and display string.
   */
  getValueRange(): ValueRange {
    const low = this.store.valuation.value_range_low;
    const high = this.store.valuation.value_range_high;
    return {
      low,
      high,
      display: `${this.formatCurrency(low)} - ${this.formatCurrency(high)}`,
    };
  }

  /**
   * Returns the formatted value range as a structured object with low, high, and display strings.
   */
  getFormattedValueRange(): { low: string; high: string; display: string } {
    return {
      low: this.formatCurrency(this.store.valuation.value_range_low),
      high: this.formatCurrency(this.store.valuation.value_range_high),
      display: `${this.formatCurrency(this.store.valuation.value_range_low)} - ${this.formatCurrency(this.store.valuation.value_range_high)}`,
    };
  }

  /** @deprecated Use getFormattedValueRange().display */
  getValueRangeFormatted(): string {
    return this.getFormattedValueRange().display;
  }

  // ============ DISCOUNTS ============

  getDLOMRate(): number {
    return this.store.valuation.dlom_percentage;
  }

  getFormattedDLOMRate(): string {
    return this.formatPercentage(this.store.valuation.dlom_percentage);
  }

  getDLOMAmount(): number {
    return this.store.valuation.dlom_amount;
  }

  getFormattedDLOMAmount(): string {
    return this.formatCurrency(this.store.valuation.dlom_amount);
  }

  /** @deprecated Use getDLOMRate() */
  getDLOMPercentage(): number {
    return this.store.valuation.dlom_percentage;
  }

  isDLOMApplied(): boolean {
    return this.store.valuation.dlom_applied;
  }

  getDLOCRate(): number {
    return this.store.valuation.dloc_rate;
  }

  getFormattedDLOCRate(): string {
    return this.formatPercentage(this.store.valuation.dloc_rate);
  }

  getDLOCAmount(): number {
    return this.store.valuation.dloc_amount;
  }

  // ============ RISK ACCESS ============

  getRiskScore(): number {
    return this.store.risk.overall_score;
  }

  getRiskRating(): 'Low' | 'Moderate' | 'Elevated' | 'High' {
    return this.store.risk.overall_rating;
  }

  getRiskFactors(): ReadonlyArray<import('../calculations/types').RiskFactor> {
    return this.store.risk.factors;
  }

  // ============ DATA QUALITY ACCESS ============

  getCompletenessScore(): number {
    return this.store.data_quality.completeness_score;
  }

  getYearsOfData(): number {
    return this.store.data_quality.years_of_data;
  }

  getMissingFields(): ReadonlyArray<string> {
    return this.store.data_quality.missing_fields;
  }

  // ============ DERIVED ENTERPRISE METRICS ============

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

  // ============ FORMATTING HELPERS ============

  /**
   * Format a number as USD currency using Intl.NumberFormat.
   */
  formatCurrency(value: number, options: FormatOptions = {}): string {
    if (value === null || value === undefined) return 'N/A';
    if (value === 0) return '$0';
    const { showCents = false } = options;
    if (showCents) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(value));
  }

  /**
   * Format a decimal ratio as a percentage using Intl.NumberFormat.
   * @param value - Decimal value (e.g. 0.156 for 15.6%)
   * @param decimals - Number of decimal places (default 1)
   */
  formatPercentage(value: number, decimals: number = 1): string {
    return `${(value * 100).toFixed(decimals)}%`;
  }

  formatMultiple(value: number, decimals: number = 2): string {
    return `${value.toFixed(decimals)}x`;
  }

  // ============ RAW STORE ACCESS ============

  /**
   * Returns the full readonly data store.
   */
  getRawStore(): Readonly<ValuationDataStore> {
    return this.store;
  }

  /** @deprecated Use getRawStore() */
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
