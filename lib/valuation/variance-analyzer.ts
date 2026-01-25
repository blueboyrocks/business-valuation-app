/**
 * VarianceAnalyzer - Prior Valuation Reconciliation
 *
 * This module analyzes variances between our valuation and prior valuations
 * to ensure consistency and require reconciliation when significant
 * discrepancies exist.
 *
 * Key features:
 * - Flags variances >25% as WARNING
 * - Flags variances >50% as CRITICAL
 * - Generates reconciliation narratives
 * - Supports multiple prior valuations
 *
 * CRITICAL: This helps catch the $4.1M error by comparing to BizEquity's $2.0M
 */

// ============ TYPES ============

export enum VarianceSeverity {
  ACCEPTABLE = 'acceptable',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export interface PriorValuation {
  source: string;
  value: number;
  date: string;
  methodology?: string;
  notes?: string;
}

export interface VarianceAnalysisResult {
  current_value: number;
  prior_value: number;
  prior_source: string;
  prior_date: string;
  variance_amount: number;
  variance_percentage: number;
  direction: 'higher' | 'lower' | 'equal';
  severity: VarianceSeverity;
  requires_reconciliation: boolean;
  reconciliation_required_reason?: string;
  reconciliation_factors?: string[];
  error?: string;
}

export interface VarianceAnalyzerConfig {
  warning_threshold: number; // Default: 0.25 (25%)
  critical_threshold: number; // Default: 0.50 (50%)
}

// ============ DEFAULT CONFIG ============

const DEFAULT_CONFIG: VarianceAnalyzerConfig = {
  warning_threshold: 0.25,
  critical_threshold: 0.50,
};

// ============ ANALYZER CLASS ============

export class VarianceAnalyzer {
  private readonly config: VarianceAnalyzerConfig;

  constructor(config: Partial<VarianceAnalyzerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Analyze variance between current valuation and a prior valuation
   */
  analyzeVariance(
    currentValue: number,
    priorValuation: PriorValuation
  ): VarianceAnalysisResult {
    const { value: priorValue, source, date } = priorValuation;

    // Handle invalid prior valuation
    if (priorValue <= 0) {
      return {
        current_value: currentValue,
        prior_value: priorValue,
        prior_source: source,
        prior_date: date,
        variance_amount: currentValue,
        variance_percentage: 1, // 100%
        direction: 'higher',
        severity: VarianceSeverity.CRITICAL,
        requires_reconciliation: true,
        reconciliation_required_reason: 'Prior valuation is invalid (zero or negative)',
        error: 'Prior valuation is invalid (zero or negative)',
      };
    }

    // Calculate variance
    const varianceAmount = currentValue - priorValue;
    const variancePercentage = varianceAmount / priorValue;
    const absoluteVariance = Math.abs(variancePercentage);

    // Determine direction
    let direction: 'higher' | 'lower' | 'equal';
    if (varianceAmount > 0) {
      direction = 'higher';
    } else if (varianceAmount < 0) {
      direction = 'lower';
    } else {
      direction = 'equal';
    }

    // Determine severity
    let severity: VarianceSeverity;
    if (absoluteVariance >= this.config.critical_threshold) {
      severity = VarianceSeverity.CRITICAL;
    } else if (absoluteVariance >= this.config.warning_threshold) {
      severity = VarianceSeverity.WARNING;
    } else {
      severity = VarianceSeverity.ACCEPTABLE;
    }

    // Determine if reconciliation is required
    const requiresReconciliation = severity !== VarianceSeverity.ACCEPTABLE;
    let reconciliationReason: string | undefined;

    if (severity === VarianceSeverity.CRITICAL) {
      reconciliationReason =
        `Variance of ${(absoluteVariance * 100).toFixed(1)}% exceeds critical threshold ` +
        `of ${(this.config.critical_threshold * 100).toFixed(0)}%. Detailed reconciliation required.`;
    } else if (severity === VarianceSeverity.WARNING) {
      reconciliationReason =
        `Variance of ${(absoluteVariance * 100).toFixed(1)}% exceeds warning threshold ` +
        `of ${(this.config.warning_threshold * 100).toFixed(0)}%. Reconciliation recommended.`;
    }

    return {
      current_value: currentValue,
      prior_value: priorValue,
      prior_source: source,
      prior_date: date,
      variance_amount: varianceAmount,
      variance_percentage: variancePercentage,
      direction,
      severity,
      requires_reconciliation: requiresReconciliation,
      reconciliation_required_reason: reconciliationReason,
    };
  }

  /**
   * Analyze variance against multiple prior valuations
   */
  analyzeMultiplePriorValuations(
    currentValue: number,
    priorValuations: PriorValuation[]
  ): VarianceAnalysisResult[] {
    return priorValuations.map((prior) => this.analyzeVariance(currentValue, prior));
  }

  /**
   * Get the maximum severity from multiple variance results
   */
  getMaxSeverity(results: VarianceAnalysisResult[]): VarianceSeverity {
    const severityOrder = [
      VarianceSeverity.ACCEPTABLE,
      VarianceSeverity.WARNING,
      VarianceSeverity.CRITICAL,
    ];

    let maxSeverity = VarianceSeverity.ACCEPTABLE;
    for (const result of results) {
      if (
        severityOrder.indexOf(result.severity) > severityOrder.indexOf(maxSeverity)
      ) {
        maxSeverity = result.severity;
      }
    }

    return maxSeverity;
  }

  /**
   * Generate a reconciliation narrative for a variance analysis
   */
  generateReconciliationNarrative(result: VarianceAnalysisResult): string {
    const {
      current_value,
      prior_value,
      prior_source,
      variance_percentage,
      direction,
      severity,
      reconciliation_factors,
    } = result;

    const currentFormatted = `$${current_value.toLocaleString()}`;
    const priorFormatted = `$${prior_value.toLocaleString()}`;
    const variancePct = `${(Math.abs(variance_percentage) * 100).toFixed(1)}%`;

    let narrative = `### Prior Valuation Reconciliation\n\n`;

    narrative += `Our concluded value of ${currentFormatted} differs from the ${prior_source} `;
    narrative += `valuation of ${priorFormatted} by ${variancePct} `;
    narrative += `(our value is ${direction}).\n\n`;

    // Add severity context
    if (severity === VarianceSeverity.CRITICAL) {
      narrative += `**⚠️ CRITICAL:** This variance exceeds the 50% threshold and requires `;
      narrative += `detailed explanation and justification.\n\n`;
    } else if (severity === VarianceSeverity.WARNING) {
      narrative += `**Warning:** This variance exceeds the 25% threshold and should be `;
      narrative += `addressed in the report.\n\n`;
    }

    // Add reconciliation factors if provided
    if (reconciliation_factors && reconciliation_factors.length > 0) {
      narrative += `**Key Factors Contributing to Variance:**\n\n`;
      for (const factor of reconciliation_factors) {
        narrative += `- ${factor}\n`;
      }
      narrative += '\n';
    }

    // Add general explanation for common variance sources
    narrative += `**Common Sources of Valuation Variance:**\n\n`;
    narrative += `- Different benefit stream (SDE vs EBITDA)\n`;
    narrative += `- Different multiple applied\n`;
    narrative += `- Updated financial data\n`;
    narrative += `- Industry-specific adjustments\n`;
    narrative += `- Risk factor differences\n`;
    narrative += `- Methodology differences (AVM vs full appraisal)\n`;

    return narrative;
  }

  /**
   * Check if any variance requires blocking report generation
   */
  hasBlockingVariance(results: VarianceAnalysisResult[]): boolean {
    return results.some((r) => r.severity === VarianceSeverity.CRITICAL);
  }

  /**
   * Generate a summary of all variance analyses
   */
  generateSummary(results: VarianceAnalysisResult[]): string {
    if (results.length === 0) {
      return 'No prior valuations available for comparison.';
    }

    const maxSeverity = this.getMaxSeverity(results);
    const criticalCount = results.filter(
      (r) => r.severity === VarianceSeverity.CRITICAL
    ).length;
    const warningCount = results.filter(
      (r) => r.severity === VarianceSeverity.WARNING
    ).length;
    const acceptableCount = results.filter(
      (r) => r.severity === VarianceSeverity.ACCEPTABLE
    ).length;

    let summary = `Compared against ${results.length} prior valuation(s):\n`;
    summary += `- ${acceptableCount} within acceptable range (<25% variance)\n`;
    if (warningCount > 0) {
      summary += `- ${warningCount} with warning-level variance (25-50%)\n`;
    }
    if (criticalCount > 0) {
      summary += `- ${criticalCount} with critical variance (>50%)\n`;
    }

    if (maxSeverity === VarianceSeverity.CRITICAL) {
      summary += `\n**ACTION REQUIRED:** Critical variance detected. Reconciliation must be completed.`;
    } else if (maxSeverity === VarianceSeverity.WARNING) {
      summary += `\n**RECOMMENDATION:** Variance explanation should be included in report.`;
    }

    return summary;
  }
}

// ============ FACTORY FUNCTION ============

/**
 * Create a new VarianceAnalyzer
 */
export function createVarianceAnalyzer(
  config?: Partial<VarianceAnalyzerConfig>
): VarianceAnalyzer {
  return new VarianceAnalyzer(config);
}
