/**
 * AutoCorrectionEngine - Layer 3 of QA System
 *
 * Automatically corrects certain types of errors and flags
 * others for human review. Key features:
 * - Calculation corrections (weighted averages, etc.)
 * - Format corrections (currency, percentage)
 * - Consistency suggestions
 * - Human review flagging
 */

// ============ TYPES ============

export enum CorrectionType {
  CALCULATION = 'calculation',
  FORMAT = 'format',
  CONSISTENCY = 'consistency',
  NONE = 'none',
}

export interface CorrectionResult {
  corrected: boolean;
  correction_type: CorrectionType;
  original_value: unknown;
  new_value: unknown;
  description?: string;
}

export interface ConsistencyCorrectionResult {
  has_suggestion: boolean;
  suggested_value: number | null;
  sections_to_update: string[];
  confidence: number;
}

export interface ValuationValidationResult {
  requires_review: boolean;
  auto_correctable: boolean;
  issue_description: string;
  suggested_range?: { low: number; high: number };
}

export interface CorrectionAuditEntry {
  correction_type: CorrectionType;
  timestamp: string;
  original_value: unknown;
  new_value: unknown;
  description: string;
}

export interface HumanReviewResult {
  requires_human_review: boolean;
  critical_issues: Array<{ severity: string; message: string }>;
  reviewable_issues: Array<{ severity: string; message: string }>;
}

// ============ CONSTANTS ============

const TOLERANCE = 0.001; // 0.1% tolerance for floating point comparisons

// Industry-specific multiple ranges
const INDUSTRY_MULTIPLE_RANGES: Record<string, { low: number; high: number; ceiling: number }> = {
  '541330': { low: 2.0, high: 3.5, ceiling: 4.2 }, // Engineering Services
  '541211': { low: 2.5, high: 3.5, ceiling: 4.2 }, // CPA Firms
  '722511': { low: 1.5, high: 3.0, ceiling: 3.6 }, // Restaurants
  '541511': { low: 3.0, high: 8.0, ceiling: 9.6 }, // Software
  default: { low: 2.0, high: 4.0, ceiling: 4.8 },
};

// ============ ENGINE CLASS ============

export class AutoCorrectionEngine {
  private correctionAudit: CorrectionAuditEntry[] = [];

  /**
   * Correct weighted average calculation
   */
  correctWeightedAverage(data: {
    current_year: number;
    prior_year_1: number;
    prior_year_2: number;
    weighted_average: number;
  }): CorrectionResult {
    const values = [data.current_year, data.prior_year_1, data.prior_year_2].filter((v) => v > 0);

    let expectedWeighted: number;
    if (values.length === 1) {
      expectedWeighted = values[0];
    } else if (values.length === 2) {
      expectedWeighted = (values[0] * 3 + values[1] * 2) / 5;
    } else if (values.length === 3) {
      expectedWeighted = (data.current_year * 3 + data.prior_year_1 * 2 + data.prior_year_2 * 1) / 6;
    } else {
      return {
        corrected: false,
        correction_type: CorrectionType.NONE,
        original_value: data.weighted_average,
        new_value: data.weighted_average,
        description: 'No data to calculate weighted average',
      };
    }

    const diff = Math.abs(data.weighted_average - expectedWeighted) / expectedWeighted;

    if (diff > TOLERANCE) {
      this.addToAudit(
        CorrectionType.CALCULATION,
        data.weighted_average,
        expectedWeighted,
        'Corrected weighted average calculation'
      );

      return {
        corrected: true,
        correction_type: CorrectionType.CALCULATION,
        original_value: data.weighted_average,
        new_value: expectedWeighted,
        description: `Corrected weighted average from ${data.weighted_average} to ${expectedWeighted}`,
      };
    }

    return {
      corrected: false,
      correction_type: CorrectionType.NONE,
      original_value: data.weighted_average,
      new_value: data.weighted_average,
    };
  }

  /**
   * Correct currency formatting
   */
  correctCurrencyFormat(value: string | number): CorrectionResult {
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/[$,]/g, '')) : value;

    if (isNaN(numValue)) {
      return {
        corrected: false,
        correction_type: CorrectionType.NONE,
        original_value: value,
        new_value: value,
        description: 'Invalid number',
      };
    }

    const formatted = `$${Math.round(numValue).toLocaleString('en-US')}`;
    const originalStr = String(value);

    if (originalStr === formatted) {
      return {
        corrected: false,
        correction_type: CorrectionType.NONE,
        original_value: value,
        new_value: formatted,
      };
    }

    this.addToAudit(CorrectionType.FORMAT, value, formatted, 'Corrected currency format');

    return {
      corrected: true,
      correction_type: CorrectionType.FORMAT,
      original_value: value,
      new_value: formatted,
      description: `Formatted as currency: ${formatted}`,
    };
  }

  /**
   * Correct percentage formatting
   */
  correctPercentageFormat(value: number): CorrectionResult {
    const formatted = `${(value * 100).toFixed(1)}%`;

    this.addToAudit(CorrectionType.FORMAT, value, formatted, 'Corrected percentage format');

    return {
      corrected: true,
      correction_type: CorrectionType.FORMAT,
      original_value: value,
      new_value: formatted,
      description: `Formatted as percentage: ${formatted}`,
    };
  }

  /**
   * Suggest correction for data consistency issues
   */
  suggestConsistencyCorrection(
    sectionData: Record<string, { revenue?: number; sde?: number }>,
    field: string
  ): ConsistencyCorrectionResult {
    const values: { section: string; value: number }[] = [];

    for (const [section, data] of Object.entries(sectionData)) {
      const value = data[field as keyof typeof data] as number | undefined;
      if (value !== undefined) {
        values.push({ section, value });
      }
    }

    if (values.length < 2) {
      return {
        has_suggestion: false,
        suggested_value: null,
        sections_to_update: [],
        confidence: 0,
      };
    }

    // Find the most common value (mode)
    const valueCounts = new Map<number, number>();
    for (const { value } of values) {
      valueCounts.set(value, (valueCounts.get(value) || 0) + 1);
    }

    let modeValue = values[0].value;
    let modeCount = 0;

    for (const [value, count] of Array.from(valueCounts.entries())) {
      if (count > modeCount) {
        modeValue = value;
        modeCount = count;
      }
    }

    // If all values are the same, no correction needed
    if (modeCount === values.length) {
      return {
        has_suggestion: false,
        suggested_value: null,
        sections_to_update: [],
        confidence: 1,
      };
    }

    // Find sections that need to be updated
    const sectionsToUpdate = values
      .filter((v) => Math.abs(v.value - modeValue) > modeValue * TOLERANCE)
      .map((v) => v.section);

    return {
      has_suggestion: true,
      suggested_value: modeValue,
      sections_to_update: sectionsToUpdate,
      confidence: modeCount / values.length,
    };
  }

  /**
   * Validate valuation multiple against industry range
   */
  validateValuationMultiple(
    valuation: number,
    sde: number,
    naicsCode: string
  ): ValuationValidationResult {
    if (sde <= 0) {
      return {
        requires_review: true,
        auto_correctable: false,
        issue_description: 'Cannot validate multiple: SDE is zero or negative',
      };
    }

    const multiple = valuation / sde;
    const range = INDUSTRY_MULTIPLE_RANGES[naicsCode] || INDUSTRY_MULTIPLE_RANGES.default;

    if (multiple > range.ceiling) {
      return {
        requires_review: true,
        auto_correctable: false,
        issue_description: `Implied multiple of ${multiple.toFixed(2)}x exceeds maximum ceiling of ${range.ceiling}x for this industry`,
        suggested_range: { low: range.low, high: range.high },
      };
    }

    if (multiple > range.high) {
      return {
        requires_review: true,
        auto_correctable: false,
        issue_description: `Implied multiple of ${multiple.toFixed(2)}x is above typical range of ${range.low}x-${range.high}x for this industry`,
        suggested_range: { low: range.low, high: range.high },
      };
    }

    if (multiple < range.low) {
      return {
        requires_review: true,
        auto_correctable: false,
        issue_description: `Implied multiple of ${multiple.toFixed(2)}x is below typical range of ${range.low}x-${range.high}x for this industry`,
        suggested_range: { low: range.low, high: range.high },
      };
    }

    return {
      requires_review: false,
      auto_correctable: false,
      issue_description: '',
    };
  }

  /**
   * Process multiple corrections in batch
   */
  batchCorrect(
    corrections: Array<{ type: string; value: string | number }>
  ): CorrectionResult[] {
    return corrections.map((c) => {
      if (c.type === 'currency') {
        return this.correctCurrencyFormat(c.value);
      } else if (c.type === 'percentage') {
        return this.correctPercentageFormat(c.value as number);
      }
      return {
        corrected: false,
        correction_type: CorrectionType.NONE,
        original_value: c.value,
        new_value: c.value,
      };
    });
  }

  /**
   * Flag issues for human review
   */
  flagForHumanReview(
    issues: Array<{ severity: string; message: string }>
  ): HumanReviewResult {
    const criticalIssues = issues.filter((i) => i.severity === 'critical');
    const reviewableIssues = issues.filter(
      (i) => i.severity === 'error' || i.severity === 'warning'
    );

    return {
      requires_human_review: criticalIssues.length > 0,
      critical_issues: criticalIssues,
      reviewable_issues: reviewableIssues,
    };
  }

  /**
   * Get correction audit trail
   */
  getCorrectionAudit(): CorrectionAuditEntry[] {
    return [...this.correctionAudit];
  }

  /**
   * Clear correction audit
   */
  clearCorrectionAudit(): void {
    this.correctionAudit = [];
  }

  /**
   * Add entry to correction audit
   */
  private addToAudit(
    type: CorrectionType,
    original: unknown,
    newValue: unknown,
    description: string
  ): void {
    this.correctionAudit.push({
      correction_type: type,
      timestamp: new Date().toISOString(),
      original_value: original,
      new_value: newValue,
      description,
    });
  }
}

// ============ FACTORY FUNCTION ============

/**
 * Create a new AutoCorrectionEngine
 */
export function createAutoCorrectionEngine(): AutoCorrectionEngine {
  return new AutoCorrectionEngine();
}
