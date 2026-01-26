/**
 * ConsistencyValidator - Data Consistency Checks
 *
 * This module validates data consistency across the valuation report.
 * Key validations:
 * - Financial data integrity
 * - Balance sheet balance
 * - Calculation consistency
 * - Valuation range validation
 */

import type { ValuationDataStore } from './data-store';

// ============ TYPES ============

export enum ValidationSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

export interface ValidationIssue {
  message: string;
  severity: ValidationSeverity;
  field?: string;
  expected?: string | number;
  actual?: string | number;
}

export interface SectionValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  issues: ValidationIssue[];
}

export interface FullValidationResult {
  overall_passed: boolean;
  sections: {
    financials: SectionValidationResult;
    balance_sheet: SectionValidationResult;
    calculations: SectionValidationResult;
    valuation?: SectionValidationResult;
  };
  error_count: number;
  warning_count: number;
  all_errors: string[];
  all_warnings: string[];
}

// ============ VALIDATOR CLASS ============

export class ConsistencyValidator {
  private readonly store: ValuationDataStore;

  constructor(store: ValuationDataStore) {
    this.store = store;
  }

  /**
   * Validate financial data consistency
   */
  validateFinancials(): SectionValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const issues: ValidationIssue[] = [];

    const revenue = this.store.financial.revenue;

    // Check for valid revenue values
    if (revenue <= 0) {
      errors.push('Current year revenue must be greater than zero');
      issues.push({
        message: 'Current year revenue must be greater than zero',
        severity: ValidationSeverity.ERROR,
        field: 'revenue',
        actual: revenue,
      });
    }

    // Check for significant revenue decline (>30% YoY) using revenue_by_year
    const revByYear = this.store.financial.revenue_by_year;
    if (revByYear.length >= 2 && revByYear[1].revenue > 0) {
      const yoyChange = (revByYear[0].revenue - revByYear[1].revenue) / revByYear[1].revenue;
      if (yoyChange < -0.3) {
        warnings.push(
          `Significant revenue decline of ${Math.abs(yoyChange * 100).toFixed(1)}% year-over-year`
        );
        issues.push({
          message: `Significant revenue decline detected`,
          severity: ValidationSeverity.WARNING,
          field: 'revenue',
          expected: 'Stable or growing revenue',
          actual: `${(yoyChange * 100).toFixed(1)}% change`,
        });
      }

      // Check for unrealistic revenue growth (>100% YoY)
      if (yoyChange > 1.0) {
        warnings.push(
          `Unusually high revenue growth of ${(yoyChange * 100).toFixed(1)}% year-over-year - verify data accuracy`
        );
        issues.push({
          message: 'Unusually high revenue growth - verify data accuracy',
          severity: ValidationSeverity.WARNING,
          field: 'revenue',
          actual: `${(yoyChange * 100).toFixed(1)}% growth`,
        });
      }
    }

    // Check SDE is reasonable relative to revenue
    const sde = this.store.financial.sde;
    if (sde > revenue) {
      warnings.push('SDE exceeds revenue - verify add-back calculations');
      issues.push({
        message: 'SDE exceeds revenue',
        severity: ValidationSeverity.WARNING,
        field: 'sde',
        expected: 'SDE <= Revenue',
        actual: `SDE: $${sde.toLocaleString()}, Revenue: $${revenue.toLocaleString()}`,
      });
    }

    // Check for negative net income (warning, not error)
    const netIncome = this.store.financial.net_income;
    if (netIncome < 0) {
      warnings.push('Current year shows net loss - consider impact on valuation');
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
      issues,
    };
  }

  /**
   * Validate balance sheet consistency
   */
  validateBalanceSheet(): SectionValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const issues: ValidationIssue[] = [];

    const bs = this.store.balance_sheet;

    // Check balance sheet balance (Assets = Liabilities + Equity)
    const totalAssets = bs.total_assets;
    const totalLiabilitiesAndEquity = bs.total_liabilities + bs.total_equity;

    // Allow 1% tolerance for rounding
    const tolerance = Math.max(totalAssets, totalLiabilitiesAndEquity) * 0.01;
    const difference = Math.abs(totalAssets - totalLiabilitiesAndEquity);

    if (difference > tolerance && totalAssets > 0) {
      errors.push(
        `Balance sheet does not balance. Assets ($${totalAssets.toLocaleString()}) ≠ Liabilities + Equity ($${totalLiabilitiesAndEquity.toLocaleString()})`
      );
      issues.push({
        message: 'Balance sheet does not balance',
        severity: ValidationSeverity.ERROR,
        field: 'balance_sheet',
        expected: `Assets = Liabilities + Equity`,
        actual: `Difference of $${difference.toLocaleString()}`,
      });
    }

    // Check for negative equity
    if (bs.total_equity < 0) {
      warnings.push(
        `Negative total equity of $${Math.abs(bs.total_equity).toLocaleString()} indicates financial distress`
      );
      issues.push({
        message: 'Negative equity indicates financial distress',
        severity: ValidationSeverity.WARNING,
        field: 'total_equity',
        actual: bs.total_equity,
      });
    }

    // Check current ratio
    const currentAssets = bs.current_assets;
    const currentLiabilities = bs.current_liabilities;

    if (currentLiabilities > 0) {
      const currentRatio = currentAssets / currentLiabilities;
      if (currentRatio < 1.0) {
        warnings.push(
          `Current ratio of ${currentRatio.toFixed(2)} indicates potential liquidity concerns`
        );
      }
    }

    // Validate current assets sum
    const calculatedCurrentAssets =
      (bs.cash || 0) +
      (bs.accounts_receivable || 0) +
      (bs.inventory || 0);

    // Only flag if we have data and significant difference
    if (currentAssets > 0 && calculatedCurrentAssets > 0) {
      const currentAssetsDiff = Math.abs(calculatedCurrentAssets - currentAssets);
      if (currentAssetsDiff > tolerance) {
        warnings.push('Current assets components do not sum to total - verify data');
      }
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
      issues,
    };
  }

  /**
   * Validate calculation consistency
   */
  validateCalculations(): SectionValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const issues: ValidationIssue[] = [];

    const calcSDE = this.store.financial.sde;
    const calcNetIncome = this.store.financial.net_income;

    // SDE should be >= net income (since it adds back items)
    if (calcSDE < calcNetIncome && calcNetIncome > 0) {
      errors.push('SDE is less than net income - calculation error detected');
      issues.push({
        message: 'SDE should be greater than or equal to net income',
        severity: ValidationSeverity.ERROR,
        field: 'sde',
        expected: `>= $${calcNetIncome.toLocaleString()}`,
        actual: `$${calcSDE.toLocaleString()}`,
      });
    }

    // Weighted SDE should be reasonable
    const sdeByYear = this.store.financial.sde_by_year;
    if (sdeByYear.length > 0 && this.store.financial.weighted_sde > 0) {
      const sdeValues = sdeByYear.map(y => y.sde).filter(v => v > 0);
      if (sdeValues.length > 0) {
        const minSDE = Math.min(...sdeValues);
        const maxSDE = Math.max(...sdeValues);
        if (this.store.financial.weighted_sde < minSDE || this.store.financial.weighted_sde > maxSDE) {
          warnings.push('Weighted average SDE is outside the range of individual years');
        }
      }
    }

    // EBITDA validation
    const calcEBITDA = this.store.financial.ebitda;
    if (calcEBITDA < calcNetIncome && calcNetIncome > 0) {
      warnings.push(
        'EBITDA is less than net income - verify interest, taxes, depreciation, and amortization add-backs'
      );
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
      issues,
    };
  }

  /**
   * Validate valuation results (if present)
   */
  validateValuation(): SectionValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const issues: ValidationIssue[] = [];

    const valuation = this.store.valuation;

    // Skip if no valuation results
    if (valuation.final_value === 0) {
      return {
        passed: true,
        errors: [],
        warnings: ['Valuation results not yet available'],
        issues: [],
      };
    }

    // Final value should be within range
    if (
      valuation.value_range_low > 0 &&
      valuation.value_range_high > 0 &&
      (valuation.final_value < valuation.value_range_low ||
        valuation.final_value > valuation.value_range_high)
    ) {
      errors.push(
        `Final value ($${valuation.final_value.toLocaleString()}) is outside the stated range ($${valuation.value_range_low.toLocaleString()} - $${valuation.value_range_high.toLocaleString()})`
      );
      issues.push({
        message: 'Final value is outside stated range',
        severity: ValidationSeverity.ERROR,
        field: 'valuation.final_value',
        expected: `$${valuation.value_range_low.toLocaleString()} - $${valuation.value_range_high.toLocaleString()}`,
        actual: `$${valuation.final_value.toLocaleString()}`,
      });
    }

    // Check spread between approaches
    const approachValues = [
      valuation.asset_approach_value,
      valuation.income_approach_value,
      valuation.market_approach_value,
    ].filter((v) => v > 0);

    if (approachValues.length >= 2) {
      const maxApproach = Math.max(...approachValues);
      const minApproach = Math.min(...approachValues);
      const spread = (maxApproach - minApproach) / minApproach;

      if (spread > 1.0) {
        // >100% spread
        warnings.push(
          `Large variance between valuation approaches (${(spread * 100).toFixed(0)}% spread). ` +
            `Range: $${minApproach.toLocaleString()} to $${maxApproach.toLocaleString()}`
        );
        issues.push({
          message: 'Large variance between valuation approaches',
          severity: ValidationSeverity.WARNING,
          field: 'valuation.approaches',
          actual: `${(spread * 100).toFixed(0)}% spread`,
        });
      }
    }

    // Validate range is reasonable (not too wide or narrow)
    if (valuation.value_range_low > 0 && valuation.value_range_high > 0) {
      const rangePct =
        (valuation.value_range_high - valuation.value_range_low) / valuation.final_value;

      if (rangePct > 0.5) {
        warnings.push(
          `Valuation range is very wide (${(rangePct * 100).toFixed(0)}% of concluded value)`
        );
      } else if (rangePct < 0.1) {
        warnings.push(
          `Valuation range may be too narrow (${(rangePct * 100).toFixed(0)}% of concluded value)`
        );
      }
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
      issues,
    };
  }

  /**
   * Run all validations and return combined result
   */
  validateAll(): FullValidationResult {
    const financials = this.validateFinancials();
    const balanceSheet = this.validateBalanceSheet();
    const calculations = this.validateCalculations();
    const valuation = this.validateValuation();

    const allErrors = [
      ...financials.errors,
      ...balanceSheet.errors,
      ...calculations.errors,
      ...valuation.errors,
    ];

    const allWarnings = [
      ...financials.warnings,
      ...balanceSheet.warnings,
      ...calculations.warnings,
      ...valuation.warnings,
    ];

    return {
      overall_passed: financials.passed && balanceSheet.passed && calculations.passed,
      sections: {
        financials,
        balance_sheet: balanceSheet,
        calculations,
        valuation,
      },
      error_count: allErrors.length,
      warning_count: allWarnings.length,
      all_errors: allErrors,
      all_warnings: allWarnings,
    };
  }

  /**
   * Get a summary of the validation
   */
  getSummary(): string {
    const result = this.validateAll();

    if (result.overall_passed && result.warning_count === 0) {
      return 'All consistency checks passed';
    }

    if (result.overall_passed) {
      return `Consistency checks passed with ${result.warning_count} warning(s)`;
    }

    return `Consistency checks failed: ${result.error_count} error(s), ${result.warning_count} warning(s)`;
  }
}

// ============ FACTORY FUNCTION ============

/**
 * Create a new ConsistencyValidator
 */
export function createConsistencyValidator(store: ValuationDataStore): ConsistencyValidator {
  return new ConsistencyValidator(store);
}
