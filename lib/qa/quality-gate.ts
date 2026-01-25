/**
 * QualityGate - Report Quality Assessment System
 *
 * Calculates overall quality score for valuation reports and determines
 * if they meet premium tier standards. Blocks generation of sub-standard reports.
 *
 * Quality Tiers:
 * - PREMIUM: 80+ (justifies $3,000-$5,000 pricing)
 * - GOOD: 65-79
 * - ADEQUATE: 50-64
 * - INSUFFICIENT: <50 (blocked from generation)
 *
 * CRITICAL: Reports must score 80+ for premium tier pricing
 */

// ============ ENUMS ============

export enum QualityTier {
  PREMIUM = 'PREMIUM',
  GOOD = 'GOOD',
  ADEQUATE = 'ADEQUATE',
  INSUFFICIENT = 'INSUFFICIENT',
}

export enum QualityCategory {
  DATA_CONSISTENCY = 'data_consistency',
  CALCULATION_TRANSPARENCY = 'calculation_transparency',
  VALUATION_ACCURACY = 'valuation_accuracy',
  CITATION_COVERAGE = 'citation_coverage',
  NARRATIVE_QUALITY = 'narrative_quality',
}

// ============ TYPES ============

export interface DataConsistencyInput {
  revenue_consistent?: boolean;
  sde_consistent?: boolean;
  dates_consistent?: boolean;
  calculations_verified?: boolean;
}

export interface CalculationTransparencyInput {
  sde_table_included?: boolean;
  market_approach_table_included?: boolean;
  synthesis_table_included?: boolean;
  source_references_complete?: boolean;
}

export interface ValuationAccuracyInput {
  multiple_within_range?: boolean;
  value_within_expected?: boolean;
  no_critical_variance?: boolean;
  reconciliation_complete?: boolean;
}

export interface CitationCoverageInput {
  citation_count?: number;
  market_data_cited?: boolean;
  financial_benchmark_cited?: boolean;
  valuation_guide_cited?: boolean;
  academic_cited?: boolean;
}

export interface NarrativeQualityInput {
  word_count?: number;
  executive_summary_word_count?: number;
  industry_references_correct?: boolean;
  no_placeholder_text?: boolean;
}

export interface ReportQualityInput {
  data_consistency: DataConsistencyInput;
  calculation_transparency: CalculationTransparencyInput;
  valuation_accuracy: ValuationAccuracyInput;
  citation_coverage: CitationCoverageInput;
  narrative_quality: NarrativeQualityInput;
}

export interface CategoryScores {
  data_consistency: number;
  calculation_transparency: number;
  valuation_accuracy: number;
  citation_coverage: number;
  narrative_quality: number;
}

export interface QualityScore {
  overall_score: number;
  tier: QualityTier;
  category_scores: CategoryScores;
  can_generate_pdf: boolean;
  blocking_issues?: string[];
  warnings?: string[];
  recommendations?: string[];
}

export interface MinimumRequirements {
  word_count: number;
  citation_count: number;
  executive_summary_word_count: number;
}

// ============ CONSTANTS ============

const TIER_THRESHOLDS = {
  premium: 80,
  good: 65,
  adequate: 50,
};

const CATEGORY_WEIGHTS: Record<QualityCategory, number> = {
  [QualityCategory.DATA_CONSISTENCY]: 0.25,
  [QualityCategory.VALUATION_ACCURACY]: 0.30,
  [QualityCategory.CALCULATION_TRANSPARENCY]: 0.20,
  [QualityCategory.CITATION_COVERAGE]: 0.10,
  [QualityCategory.NARRATIVE_QUALITY]: 0.15,
};

const MINIMUM_REQUIREMENTS: MinimumRequirements = {
  word_count: 7000,
  citation_count: 10,
  executive_summary_word_count: 600,
};

// ============ QUALITY GATE CLASS ============

export class QualityGate {
  /**
   * Get the quality tier for a given score
   */
  getTier(score: number): QualityTier {
    if (score >= TIER_THRESHOLDS.premium) {
      return QualityTier.PREMIUM;
    } else if (score >= TIER_THRESHOLDS.good) {
      return QualityTier.GOOD;
    } else if (score >= TIER_THRESHOLDS.adequate) {
      return QualityTier.ADEQUATE;
    }
    return QualityTier.INSUFFICIENT;
  }

  /**
   * Get category weights
   */
  getCategoryWeights(): Record<QualityCategory, number> {
    return { ...CATEGORY_WEIGHTS };
  }

  /**
   * Get minimum requirements
   */
  getMinimumRequirements(): MinimumRequirements {
    return { ...MINIMUM_REQUIREMENTS };
  }

  /**
   * Score a specific category
   */
  scoreCategory(category: QualityCategory, input: ReportQualityInput): number {
    switch (category) {
      case QualityCategory.DATA_CONSISTENCY:
        return this.scoreDataConsistency(input.data_consistency);
      case QualityCategory.CALCULATION_TRANSPARENCY:
        return this.scoreCalculationTransparency(input.calculation_transparency);
      case QualityCategory.VALUATION_ACCURACY:
        return this.scoreValuationAccuracy(input.valuation_accuracy);
      case QualityCategory.CITATION_COVERAGE:
        return this.scoreCitationCoverage(input.citation_coverage);
      case QualityCategory.NARRATIVE_QUALITY:
        return this.scoreNarrativeQuality(input.narrative_quality);
      default:
        return 0;
    }
  }

  /**
   * Score data consistency checks
   */
  private scoreDataConsistency(input: DataConsistencyInput): number {
    const checks = [
      input.revenue_consistent ?? false,
      input.sde_consistent ?? false,
      input.dates_consistent ?? false,
      input.calculations_verified ?? false,
    ];

    const passed = checks.filter(Boolean).length;
    return Math.round((passed / checks.length) * 100);
  }

  /**
   * Score calculation transparency
   */
  private scoreCalculationTransparency(input: CalculationTransparencyInput): number {
    const checks = [
      input.sde_table_included ?? false,
      input.market_approach_table_included ?? false,
      input.synthesis_table_included ?? false,
      input.source_references_complete ?? false,
    ];

    const passed = checks.filter(Boolean).length;
    return Math.round((passed / checks.length) * 100);
  }

  /**
   * Score valuation accuracy
   */
  private scoreValuationAccuracy(input: ValuationAccuracyInput): number {
    const checks = [
      input.multiple_within_range ?? false,
      input.value_within_expected ?? false,
      input.no_critical_variance ?? false,
      input.reconciliation_complete ?? false,
    ];

    const passed = checks.filter(Boolean).length;
    return Math.round((passed / checks.length) * 100);
  }

  /**
   * Score citation coverage
   */
  private scoreCitationCoverage(input: CitationCoverageInput): number {
    let score = 0;
    const maxScore = 100;

    // Citation count scoring (40% of category)
    const citationCount = input.citation_count ?? 0;
    if (citationCount >= 10) {
      score += 40;
    } else if (citationCount >= 5) {
      score += 20;
    } else {
      score += Math.round((citationCount / 10) * 40);
    }

    // Source type coverage (60% of category, 15% each)
    if (input.market_data_cited) score += 15;
    if (input.financial_benchmark_cited) score += 15;
    if (input.valuation_guide_cited) score += 15;
    if (input.academic_cited) score += 15;

    return Math.min(score, maxScore);
  }

  /**
   * Score narrative quality
   */
  private scoreNarrativeQuality(input: NarrativeQualityInput): number {
    let score = 0;

    // Word count (30% of category)
    const wordCount = input.word_count ?? 0;
    if (wordCount >= 7000) {
      score += 30;
    } else if (wordCount >= 5000) {
      score += 20;
    } else {
      score += Math.round((wordCount / 7000) * 30);
    }

    // Executive summary word count (30% of category)
    const execSummaryWords = input.executive_summary_word_count ?? 0;
    if (execSummaryWords >= 600) {
      score += 30;
    } else if (execSummaryWords >= 400) {
      score += 20;
    } else {
      score += Math.round((execSummaryWords / 600) * 30);
    }

    // Industry references correct (20% of category)
    if (input.industry_references_correct) score += 20;

    // No placeholder text (20% of category)
    if (input.no_placeholder_text) score += 20;

    return Math.min(score, 100);
  }

  /**
   * Calculate overall quality score
   */
  calculateScore(input: ReportQualityInput): QualityScore {
    // Calculate category scores
    const categoryScores: CategoryScores = {
      data_consistency: this.scoreCategory(QualityCategory.DATA_CONSISTENCY, input),
      calculation_transparency: this.scoreCategory(
        QualityCategory.CALCULATION_TRANSPARENCY,
        input
      ),
      valuation_accuracy: this.scoreCategory(QualityCategory.VALUATION_ACCURACY, input),
      citation_coverage: this.scoreCategory(QualityCategory.CITATION_COVERAGE, input),
      narrative_quality: this.scoreCategory(QualityCategory.NARRATIVE_QUALITY, input),
    };

    // Calculate weighted overall score
    const overallScore = Math.round(
      categoryScores.data_consistency * CATEGORY_WEIGHTS[QualityCategory.DATA_CONSISTENCY] +
        categoryScores.calculation_transparency *
          CATEGORY_WEIGHTS[QualityCategory.CALCULATION_TRANSPARENCY] +
        categoryScores.valuation_accuracy *
          CATEGORY_WEIGHTS[QualityCategory.VALUATION_ACCURACY] +
        categoryScores.citation_coverage *
          CATEGORY_WEIGHTS[QualityCategory.CITATION_COVERAGE] +
        categoryScores.narrative_quality *
          CATEGORY_WEIGHTS[QualityCategory.NARRATIVE_QUALITY]
    );

    // Determine blocking issues
    const blockingIssues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check for blocking issues (data consistency)
    if (!input.data_consistency.revenue_consistent) {
      blockingIssues.push('CRITICAL: Revenue data inconsistency detected');
    }
    if (!input.data_consistency.sde_consistent) {
      blockingIssues.push('CRITICAL: SDE data inconsistency detected');
    }
    if (!input.data_consistency.calculations_verified) {
      blockingIssues.push('CRITICAL: Calculation verification failed');
    }

    // Check for blocking issues (valuation accuracy)
    if (!input.valuation_accuracy.multiple_within_range) {
      blockingIssues.push('CRITICAL: Multiple outside valid industry range');
    }
    if (!input.valuation_accuracy.value_within_expected) {
      blockingIssues.push('CRITICAL: Valuation outside expected range');
    }
    if (!input.valuation_accuracy.no_critical_variance) {
      blockingIssues.push('CRITICAL: Variance from prior valuation exceeds 50%');
    }

    // Non-blocking warnings
    if (!input.calculation_transparency.synthesis_table_included) {
      warnings.push('Missing synthesis table');
      recommendations.push('Add valuation synthesis table showing weighted contributions');
    }

    if ((input.citation_coverage.citation_count ?? 0) < 10) {
      warnings.push(`Citation count (${input.citation_coverage.citation_count ?? 0}) below target of 10`);
      recommendations.push('Add more citations from standard industry sources');
    }

    if (!input.citation_coverage.academic_cited) {
      warnings.push('No academic sources cited');
      recommendations.push('Add citation from NYU Stern or similar academic source');
    }

    if ((input.narrative_quality.word_count ?? 0) < 7000) {
      warnings.push(`Word count (${input.narrative_quality.word_count ?? 0}) below target of 7,000`);
      recommendations.push('Expand narrative sections for more comprehensive analysis');
    }

    if ((input.narrative_quality.executive_summary_word_count ?? 0) < 600) {
      warnings.push(`Executive summary word count below target of 600`);
      recommendations.push('Expand executive summary to 600-900 words');
    }

    // Determine if PDF can be generated
    const canGeneratePdf = blockingIssues.length === 0;

    // If there are blocking issues, tier is automatically INSUFFICIENT
    // regardless of overall score
    const effectiveTier = blockingIssues.length > 0
      ? QualityTier.INSUFFICIENT
      : this.getTier(overallScore);

    // If blocked, cap the effective score at 49 for consistency
    const effectiveScore = blockingIssues.length > 0
      ? Math.min(overallScore, 49)
      : overallScore;

    return {
      overall_score: effectiveScore,
      tier: effectiveTier,
      category_scores: categoryScores,
      can_generate_pdf: canGeneratePdf,
      blocking_issues: blockingIssues.length > 0 ? blockingIssues : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
    };
  }

  /**
   * Generate human-readable quality report
   */
  generateQualityReport(result: QualityScore): string {
    let report = `# Quality Score Report\n\n`;
    report += `## Overall Score: ${result.overall_score}/100 (${result.tier})\n\n`;

    report += `## Category Breakdown\n\n`;
    report += `| Category | Score | Status |\n`;
    report += `|----------|-------|--------|\n`;
    report += `| Data Consistency | ${result.category_scores.data_consistency}/100 | ${this.getStatusEmoji(result.category_scores.data_consistency)} |\n`;
    report += `| Calculation Transparency | ${result.category_scores.calculation_transparency}/100 | ${this.getStatusEmoji(result.category_scores.calculation_transparency)} |\n`;
    report += `| Valuation Accuracy | ${result.category_scores.valuation_accuracy}/100 | ${this.getStatusEmoji(result.category_scores.valuation_accuracy)} |\n`;
    report += `| Citation Coverage | ${result.category_scores.citation_coverage}/100 | ${this.getStatusEmoji(result.category_scores.citation_coverage)} |\n`;
    report += `| Narrative Quality | ${result.category_scores.narrative_quality}/100 | ${this.getStatusEmoji(result.category_scores.narrative_quality)} |\n\n`;

    if (result.blocking_issues && result.blocking_issues.length > 0) {
      report += `## Blocking Issues\n\n`;
      for (const issue of result.blocking_issues) {
        report += `- ${issue}\n`;
      }
      report += '\n';
    }

    if (result.warnings && result.warnings.length > 0) {
      report += `## Warnings\n\n`;
      for (const warning of result.warnings) {
        report += `- ${warning}\n`;
      }
      report += '\n';
    }

    if (result.recommendations && result.recommendations.length > 0) {
      report += `## Recommendations\n\n`;
      for (const rec of result.recommendations) {
        report += `- ${rec}\n`;
      }
      report += '\n';
    }

    report += `## PDF Generation: ${result.can_generate_pdf ? 'ALLOWED' : 'BLOCKED'}\n`;

    return report;
  }

  /**
   * Get status emoji based on score
   */
  private getStatusEmoji(score: number): string {
    if (score >= 80) return 'Excellent';
    if (score >= 65) return 'Good';
    if (score >= 50) return 'Adequate';
    return 'Needs Improvement';
  }
}

// ============ FACTORY FUNCTION ============

/**
 * Create a new QualityGate
 */
export function createQualityGate(): QualityGate {
  return new QualityGate();
}
