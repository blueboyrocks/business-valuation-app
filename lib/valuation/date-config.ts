/**
 * DateConfiguration - Centralized Date Management
 *
 * This module provides consistent date handling across the valuation report.
 * Key features:
 * - Standardized date formatting
 * - Year label generation
 * - Date validation
 * - Period descriptions
 */

// ============ TYPES ============

export interface DateConfigInput {
  valuation_date: string;
  fiscal_year_end: string;
  years_analyzed: string[];
  report_generation_date?: string;
}

export type DateFormat = 'long' | 'short' | 'iso' | 'fiscal_year';

// ============ DATE CONFIGURATION CLASS ============

export class DateConfiguration {
  readonly valuation_date: string;
  readonly fiscal_year_end: string;
  readonly years_analyzed: string[];
  readonly report_generation_date: string;
  readonly data_period_description: string;

  constructor(input: DateConfigInput) {
    this.valuation_date = input.valuation_date;
    this.fiscal_year_end = input.fiscal_year_end;
    this.years_analyzed = input.years_analyzed;
    this.report_generation_date = input.report_generation_date || new Date().toISOString();
    this.data_period_description = this.generateDataPeriodDescription();
  }

  /**
   * Format a date string for display
   * Uses UTC to avoid timezone issues
   */
  formatDate(dateStr: string, format: DateFormat): string {
    // Parse the ISO date string manually to avoid timezone issues
    const parts = dateStr.split('-');
    if (parts.length !== 3) {
      return dateStr;
    }

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      return dateStr;
    }

    // Create date at noon UTC to avoid any timezone shifts
    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

    if (isNaN(date.getTime())) {
      return dateStr; // Return original if invalid
    }

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    switch (format) {
      case 'long':
        return `${monthNames[month - 1]} ${day}, ${year}`;

      case 'short':
        return `${month}/${day}/${year}`;

      case 'iso':
        return dateStr;

      case 'fiscal_year':
        return `FY ${year}`;

      default:
        return dateStr;
    }
  }

  /**
   * Get the current year label (most recent fiscal year)
   */
  getCurrentYearLabel(): string {
    if (this.years_analyzed.length === 0) return '';
    return `FY${this.years_analyzed[0]}`;
  }

  /**
   * Get the prior year 1 label
   */
  getPriorYear1Label(): string {
    if (this.years_analyzed.length < 2) return '';
    return `FY${this.years_analyzed[1]}`;
  }

  /**
   * Get the prior year 2 label
   */
  getPriorYear2Label(): string {
    if (this.years_analyzed.length < 3) return '';
    return `FY${this.years_analyzed[2]}`;
  }

  /**
   * Validate a date string
   */
  isValidDate(dateStr: string): boolean {
    // Check ISO format (YYYY-MM-DD)
    const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoRegex.test(dateStr)) {
      return false;
    }

    const [year, month, day] = dateStr.split('-').map(Number);

    // Basic range checks
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (year < 1900 || year > 2100) return false;

    // Create date at noon UTC to avoid timezone issues
    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    if (isNaN(date.getTime())) {
      return false;
    }

    // Verify the date components match (handles invalid dates like 2024-02-30)
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() + 1 === month &&
      date.getUTCDate() === day
    );
  }

  /**
   * Validate that valuation date is after fiscal year end
   */
  isValuationDateValid(): boolean {
    const valuationDate = new Date(this.valuation_date);
    const fiscalYearEnd = new Date(this.fiscal_year_end);

    return valuationDate >= fiscalYearEnd;
  }

  /**
   * Generate data period description
   */
  private generateDataPeriodDescription(): string {
    if (this.years_analyzed.length === 0) {
      return 'No data period';
    }

    if (this.years_analyzed.length === 1) {
      return `Fiscal Year ${this.years_analyzed[0]}`;
    }

    const sortedYears = [...this.years_analyzed].sort();
    const startYear = sortedYears[0];
    const endYear = sortedYears[sortedYears.length - 1];

    return `Fiscal Years ${startYear}-${endYear}`;
  }

  /**
   * Get trailing twelve months description
   */
  getTrailingTwelveMonthsDescription(): string {
    const endDate = new Date(this.fiscal_year_end);
    const startDate = new Date(endDate);
    startDate.setFullYear(startDate.getFullYear() - 1);
    startDate.setDate(startDate.getDate() + 1);

    return `Trailing 12 months ending ${this.formatDate(this.fiscal_year_end, 'long')}`;
  }

  /**
   * Get as-of date description
   */
  getAsOfDescription(): string {
    return `As of ${this.formatDate(this.valuation_date, 'long')}`;
  }

  /**
   * Get all year labels
   */
  getAllYearLabels(): string[] {
    return this.years_analyzed.map((year) => `FY${year}`);
  }

  /**
   * Get formatted valuation date
   */
  getFormattedValuationDate(): string {
    return this.formatDate(this.valuation_date, 'long');
  }

  /**
   * Get formatted fiscal year end
   */
  getFormattedFiscalYearEnd(): string {
    return this.formatDate(this.fiscal_year_end, 'long');
  }
}

// ============ DATE LABEL VALIDATOR ============

export class DateLabelValidator {
  private readonly validYears: Set<string>;
  private readonly yearPattern = /(?:FY\s*)?(\d{4})/gi;

  constructor(validYears: string[]) {
    this.validYears = new Set(validYears);
  }

  /**
   * Validate a single year reference
   */
  validateYearReference(reference: string): boolean {
    const match = reference.match(/(\d{4})/);
    if (!match) return false;

    return this.validYears.has(match[1]);
  }

  /**
   * Find all year references in text
   */
  findYearReferences(text: string): string[] {
    const references: string[] = [];
    const matches = Array.from(text.matchAll(this.yearPattern));

    for (const match of matches) {
      const year = match[1];
      // Filter out years that are clearly not fiscal years (e.g., years < 2000)
      if (parseInt(year) >= 2000 && parseInt(year) <= 2100) {
        if (!references.includes(year)) {
          references.push(year);
        }
      }
    }

    return references;
  }

  /**
   * Validate all year references in text
   */
  validateText(text: string): string[] {
    const issues: string[] = [];
    const references = this.findYearReferences(text);

    for (const year of references) {
      if (!this.validYears.has(year)) {
        issues.push(
          `Invalid year reference: ${year}. Valid years are: ${Array.from(this.validYears).join(', ')}`
        );
      }
    }

    return issues;
  }

  /**
   * Check if text contains only valid year references
   */
  isTextValid(text: string): boolean {
    return this.validateText(text).length === 0;
  }
}

// ============ FACTORY FUNCTION ============

/**
 * Create a new DateConfiguration
 */
export function createDateConfiguration(input: DateConfigInput): DateConfiguration {
  return new DateConfiguration(input);
}

/**
 * Create a DateLabelValidator from years analyzed
 */
export function createDateLabelValidator(yearsAnalyzed: string[]): DateLabelValidator {
  return new DateLabelValidator(yearsAnalyzed);
}
