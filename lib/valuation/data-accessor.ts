/**
 * ValuationDataAccessor - Controlled Access to Valuation Data
 *
 * This module provides a controlled interface for accessing valuation data
 * from the ValuationDataStore. Key features:
 * - Type-safe access methods
 * - Formatted value helpers
 * - Access logging for audit trails
 * - Consistency guarantees
 */

import type { ValuationDataStore } from './data-store';
import type { IndustryData } from '../calculations/types';

// ============ TYPES ============

export type FinancialPeriod = 'current' | 'prior_1' | 'prior_2' | 'weighted';
export type SDEPeriod = FinancialPeriod | 'normalized';
export type ApproachType = 'asset' | 'income' | 'market';

export interface AccessLogEntry {
  section: string;
  field: string;
  timestamp: string;
}

export interface FormatOptions {
  showCents?: boolean;
  decimals?: number;
}

// ============ ACCESSOR CLASS ============

export class ValuationDataAccessor {
  private readonly store: ValuationDataStore;
  private accessLog: AccessLogEntry[] = [];

  constructor(store: ValuationDataStore) {
    this.store = store;
  }

  // ============ REVENUE ACCESS ============

  /**
   * Get revenue for a specific period
   */
  getRevenue(period: FinancialPeriod): number {
    switch (period) {
      case 'current':
        return this.store.financial.revenue.current_year;
      case 'prior_1':
        return this.store.financial.revenue.prior_year_1;
      case 'prior_2':
        return this.store.financial.revenue.prior_year_2;
      case 'weighted':
        return this.store.financial.revenue.weighted_average;
      default:
        throw new Error(`Invalid revenue period: ${period}`);
    }
  }

  /**
   * Get formatted revenue string
   */
  getFormattedRevenue(period: FinancialPeriod): string {
    return this.formatCurrency(this.getRevenue(period));
  }

  // ============ SDE ACCESS ============

  /**
   * Get SDE for a specific period
   */
  getSDE(period: SDEPeriod): number {
    switch (period) {
      case 'current':
        return this.store.financial.sde.current_year;
      case 'prior_1':
        return this.store.financial.sde.prior_year_1;
      case 'prior_2':
        return this.store.financial.sde.prior_year_2;
      case 'weighted':
        return this.store.financial.sde.weighted_average;
      case 'normalized':
        return this.store.financial.sde.normalized;
      default:
        throw new Error(`Invalid SDE period: ${period}`);
    }
  }

  /**
   * Get formatted SDE string
   */
  getFormattedSDE(period: SDEPeriod): string {
    return this.formatCurrency(this.getSDE(period));
  }

  // ============ EBITDA ACCESS ============

  /**
   * Get EBITDA for a specific period
   */
  getEBITDA(period: FinancialPeriod): number {
    switch (period) {
      case 'current':
        return this.store.financial.ebitda.current_year;
      case 'prior_1':
        return this.store.financial.ebitda.prior_year_1;
      case 'prior_2':
        return this.store.financial.ebitda.prior_year_2;
      case 'weighted':
        return this.store.financial.ebitda.weighted_average;
      default:
        throw new Error(`Invalid EBITDA period: ${period}`);
    }
  }

  /**
   * Get formatted EBITDA string
   */
  getFormattedEBITDA(period: FinancialPeriod): string {
    return this.formatCurrency(this.getEBITDA(period));
  }

  // ============ NET INCOME ACCESS ============

  /**
   * Get net income for a specific period
   */
  getNetIncome(period: FinancialPeriod): number {
    switch (period) {
      case 'current':
        return this.store.financial.net_income.current_year;
      case 'prior_1':
        return this.store.financial.net_income.prior_year_1;
      case 'prior_2':
        return this.store.financial.net_income.prior_year_2;
      case 'weighted':
        return this.store.financial.net_income.weighted_average;
      default:
        throw new Error(`Invalid net income period: ${period}`);
    }
  }

  // ============ VALUATION ACCESS ============

  /**
   * Get the final concluded value
   */
  getFinalValue(): number {
    return this.store.valuation.final_value;
  }

  /**
   * Get the value range
   */
  getValueRange(): { low: number; high: number } {
    return {
      low: this.store.valuation.value_range_low,
      high: this.store.valuation.value_range_high,
    };
  }

  /**
   * Get value from a specific approach
   */
  getApproachValue(approach: ApproachType): number {
    switch (approach) {
      case 'asset':
        return this.store.valuation.asset_approach_value;
      case 'income':
        return this.store.valuation.income_approach_value;
      case 'market':
        return this.store.valuation.market_approach_value;
      default:
        throw new Error(`Invalid approach: ${approach}`);
    }
  }

  /**
   * Get weighted value (before discounts/premiums)
   */
  getWeightedValue(): number {
    return this.store.valuation.weighted_value;
  }

  // ============ META ACCESS ============

  /**
   * Get company name
   */
  getCompanyName(): string {
    return this.store.meta.company_name;
  }

  /**
   * Get valuation date
   */
  getValuationDate(): string {
    return this.store.meta.valuation_date;
  }

  /**
   * Get fiscal year end
   */
  getFiscalYearEnd(): string {
    return this.store.meta.fiscal_year_end;
  }

  /**
   * Get industry information
   */
  getIndustry(): IndustryData {
    return this.store.industry;
  }

  /**
   * Get data period description
   */
  getDataPeriodDescription(): string {
    return this.store.meta.data_period_description;
  }

  // ============ BALANCE SHEET ACCESS ============

  /**
   * Get total assets
   */
  getTotalAssets(): number {
    return this.store.balance_sheet.assets.total_assets;
  }

  /**
   * Get total liabilities
   */
  getTotalLiabilities(): number {
    return this.store.balance_sheet.liabilities.total_liabilities;
  }

  /**
   * Get total equity
   */
  getTotalEquity(): number {
    return this.store.balance_sheet.equity.total_equity;
  }

  /**
   * Get current ratio (current assets / current liabilities)
   */
  getCurrentRatio(): number {
    const currentAssets = this.store.balance_sheet.assets.current_assets.total_current_assets;
    const currentLiabilities = this.store.balance_sheet.liabilities.current_liabilities.total_current_liabilities;

    if (currentLiabilities === 0) return 0;
    return currentAssets / currentLiabilities;
  }

  /**
   * Get working capital
   */
  getWorkingCapital(): number {
    const currentAssets = this.store.balance_sheet.assets.current_assets.total_current_assets;
    const currentLiabilities = this.store.balance_sheet.liabilities.current_liabilities.total_current_liabilities;
    return currentAssets - currentLiabilities;
  }

  /**
   * Get debt-to-equity ratio
   */
  getDebtToEquityRatio(): number {
    const totalLiabilities = this.getTotalLiabilities();
    const totalEquity = this.getTotalEquity();

    if (totalEquity === 0) return 0;
    return totalLiabilities / totalEquity;
  }

  // ============ FORMATTING HELPERS ============

  /**
   * Format a number as currency
   */
  formatCurrency(value: number, options: FormatOptions = {}): string {
    const { showCents = false } = options;

    if (showCents) {
      return `$${value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }

    return `$${Math.round(value).toLocaleString('en-US')}`;
  }

  /**
   * Format a number as percentage
   */
  formatPercentage(value: number, decimals: number = 1): string {
    return `${(value * 100).toFixed(decimals)}%`;
  }

  /**
   * Format a number as a multiple
   */
  formatMultiple(value: number, decimals: number = 2): string {
    return `${value.toFixed(decimals)}x`;
  }

  // ============ AUDIT LOGGING ============

  /**
   * Log an access to a specific field
   */
  logAccess(section: string, field: string): void {
    this.accessLog.push({
      section,
      field,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get the full access log
   */
  getAccessLog(): AccessLogEntry[] {
    return [...this.accessLog];
  }

  /**
   * Get access summary by section
   */
  getAccessSummary(): Record<string, number> {
    const summary: Record<string, number> = {};

    for (const entry of this.accessLog) {
      summary[entry.section] = (summary[entry.section] || 0) + 1;
    }

    return summary;
  }

  /**
   * Clear the access log
   */
  clearAccessLog(): void {
    this.accessLog = [];
  }

  // ============ RAW STORE ACCESS ============

  /**
   * Get the underlying data store (for advanced use cases)
   */
  getStore(): ValuationDataStore {
    return this.store;
  }

  /**
   * Check if valuation results are available
   */
  hasValuationResults(): boolean {
    return this.store.valuation.final_value > 0;
  }

  /**
   * Get all financial periods that have data
   */
  getAvailablePeriods(): string[] {
    const periods: string[] = [];
    if (this.store.financial.revenue.current_year > 0) periods.push('current');
    if (this.store.financial.revenue.prior_year_1 > 0) periods.push('prior_1');
    if (this.store.financial.revenue.prior_year_2 > 0) periods.push('prior_2');
    return periods;
  }
}

// ============ FACTORY FUNCTION ============

/**
 * Create a new ValuationDataAccessor
 */
export function createDataAccessor(store: ValuationDataStore): ValuationDataAccessor {
  return new ValuationDataAccessor(store);
}
