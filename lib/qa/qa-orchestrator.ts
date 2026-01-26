/**
 * QAOrchestrator - Coordinates the Three-Layer QA System
 *
 * Manages the flow through all QA layers:
 * - Layer 1: Deterministic validation (math, schema, ranges)
 * - Layer 2: AI-powered validation (narrative quality, industry accuracy)
 * - Layer 3: Auto-correction engine
 *
 * Key features:
 * - Runs validations in sequence
 * - Applies auto-corrections where possible
 * - Generates QA report
 * - Blocks report generation on critical failures
 */

import type { ValuationDataStore } from '../valuation/data-store';
import {
  DeterministicValidationEngine,
  createDeterministicValidator,
  FullValidationResult,
  ValidationSeverity,
} from './deterministic-validator';
import {
  AutoCorrectionEngine,
  createAutoCorrectionEngine,
  CorrectionAuditEntry,
} from './auto-correction-engine';
import { IndustryReferenceValidator, createIndustryValidator } from '../valuation/industry-validator';
import { createIndustryLock } from '../valuation/industry-lock';

// ============ TYPES ============

export enum QAStatus {
  PASSED = 'passed',
  PASSED_WITH_WARNINGS = 'passed_with_warnings',
  NEEDS_REVIEW = 'needs_review',
  FAILED = 'failed',
  BLOCKED = 'blocked',
}

export interface LayerResult {
  layer: number;
  name: string;
  passed: boolean;
  score: number;
  issues_found: number;
  issues_fixed: number;
  critical_issues: number;
}

export interface QAReport {
  status: QAStatus;
  overall_score: number;
  can_generate_report: boolean;
  layer_results: LayerResult[];
  total_issues: number;
  total_fixed: number;
  total_remaining: number;
  critical_blockers: string[];
  warnings: string[];
  corrections_applied: CorrectionAuditEntry[];
  validation_result: FullValidationResult;
  timestamp: string;
  duration_ms: number;
}

export interface QAOrchestratorConfig {
  run_layer_1: boolean; // Deterministic
  run_layer_2: boolean; // AI-powered (industry validation)
  run_layer_3: boolean; // Auto-correction
  auto_correct: boolean;
  strict_mode: boolean; // Block on warnings too
  minimum_passing_score: number;
}

// ============ DEFAULT CONFIG ============

const DEFAULT_CONFIG: QAOrchestratorConfig = {
  run_layer_1: true,
  run_layer_2: true,
  run_layer_3: true,
  auto_correct: true,
  strict_mode: false,
  minimum_passing_score: 70,
};

// ============ ORCHESTRATOR CLASS ============

export class QAOrchestrator {
  private readonly store: ValuationDataStore;
  private readonly config: QAOrchestratorConfig;
  private deterministicValidator: DeterministicValidationEngine;
  private autoCorrectionEngine: AutoCorrectionEngine;
  private industryValidator: IndustryReferenceValidator | null = null;

  constructor(store: ValuationDataStore, config: Partial<QAOrchestratorConfig> = {}) {
    this.store = store;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.deterministicValidator = createDeterministicValidator(store);
    this.autoCorrectionEngine = createAutoCorrectionEngine();

    // Initialize industry validator if we have industry data
    if (store.company && store.company.naics_code) {
      const lock = createIndustryLock({
        naics_code: store.company.naics_code,
        naics_description: store.company.industry,
        locked_by_pass: 2,
      });
      this.industryValidator = createIndustryValidator(lock);
    }
  }

  /**
   * Run the full QA pipeline
   */
  async runFullQA(narrativeSections?: Array<{ name: string; content: string }>): Promise<QAReport> {
    const startTime = Date.now();
    const layerResults: LayerResult[] = [];
    let criticalBlockers: string[] = [];
    let warnings: string[] = [];

    // Layer 1: Deterministic Validation
    let layer1Result: FullValidationResult | null = null;
    if (this.config.run_layer_1) {
      layer1Result = this.runLayer1();
      layerResults.push({
        layer: 1,
        name: 'Deterministic Validation',
        passed: layer1Result.overall_passed,
        score: layer1Result.score,
        issues_found: layer1Result.all_issues.length,
        issues_fixed: 0,
        critical_issues: layer1Result.critical_count,
      });

      criticalBlockers.push(
        ...layer1Result.all_issues
          .filter((i) => i.severity === ValidationSeverity.CRITICAL)
          .map((i) => i.message)
      );

      warnings.push(
        ...layer1Result.all_issues
          .filter((i) => i.severity === ValidationSeverity.WARNING)
          .map((i) => i.message)
      );
    }

    // Layer 2: AI-Powered Validation (Industry)
    if (this.config.run_layer_2 && this.industryValidator && narrativeSections) {
      const layer2Result = this.runLayer2(narrativeSections);
      layerResults.push(layer2Result);

      if (!layer2Result.passed) {
        warnings.push('Industry reference validation found issues');
      }
    }

    // Layer 3: Auto-Correction
    if (this.config.run_layer_3 && this.config.auto_correct) {
      const layer3Result = this.runLayer3();
      layerResults.push(layer3Result);
    }

    // Calculate overall status
    const overallScore = this.calculateOverallScore(layerResults);
    const status = this.determineStatus(layerResults, criticalBlockers, overallScore);
    const canGenerate = status !== QAStatus.BLOCKED && status !== QAStatus.FAILED;

    const totalIssues = layerResults.reduce((sum, r) => sum + r.issues_found, 0);
    const totalFixed = layerResults.reduce((sum, r) => sum + r.issues_fixed, 0);

    return {
      status,
      overall_score: overallScore,
      can_generate_report: canGenerate,
      layer_results: layerResults,
      total_issues: totalIssues,
      total_fixed: totalFixed,
      total_remaining: totalIssues - totalFixed,
      critical_blockers: criticalBlockers,
      warnings,
      corrections_applied: this.autoCorrectionEngine.getCorrectionAudit(),
      validation_result: layer1Result || this.getEmptyValidationResult(),
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
    };
  }

  /**
   * Run Layer 1: Deterministic Validation
   */
  private runLayer1(): FullValidationResult {
    return this.deterministicValidator.runAllValidations();
  }

  /**
   * Run Layer 2: Industry Reference Validation
   */
  private runLayer2(sections: Array<{ name: string; content: string }>): LayerResult {
    if (!this.industryValidator) {
      return {
        layer: 2,
        name: 'Industry Reference Validation',
        passed: true,
        score: 100,
        issues_found: 0,
        issues_fixed: 0,
        critical_issues: 0,
      };
    }

    const result = this.industryValidator.validateFullReport(sections);

    return {
      layer: 2,
      name: 'Industry Reference Validation',
      passed: result.overall_valid,
      score: result.overall_valid ? 100 : Math.max(0, 100 - result.all_errors.length * 10),
      issues_found: result.all_errors.length + result.all_warnings.length,
      issues_fixed: 0,
      critical_issues: result.all_errors.length,
    };
  }

  /**
   * Run Layer 3: Auto-Correction
   */
  private runLayer3(): LayerResult {
    let issuesFixed = 0;

    // Attempt to correct weighted average using year-over-year data
    const sdeByYear = this.store.financial.sde_by_year;
    const sdeData = {
      current_year: sdeByYear[0]?.sde || this.store.financial.sde,
      prior_year_1: sdeByYear[1]?.sde || 0,
      prior_year_2: sdeByYear[2]?.sde || 0,
      weighted_average: this.store.financial.weighted_sde,
    };

    const sdeCorrection = this.autoCorrectionEngine.correctWeightedAverage(sdeData);
    if (sdeCorrection.corrected) {
      issuesFixed++;
    }

    // Similar for EBITDA
    const ebitdaByYear = this.store.financial.ebitda_by_year;
    const ebitdaData = {
      current_year: ebitdaByYear[0]?.ebitda || this.store.financial.ebitda,
      prior_year_1: ebitdaByYear[1]?.ebitda || 0,
      prior_year_2: ebitdaByYear[2]?.ebitda || 0,
      weighted_average: this.store.financial.weighted_ebitda,
    };

    const ebitdaCorrection = this.autoCorrectionEngine.correctWeightedAverage(ebitdaData);
    if (ebitdaCorrection.corrected) {
      issuesFixed++;
    }

    return {
      layer: 3,
      name: 'Auto-Correction',
      passed: true, // Auto-correction always "passes" - it just fixes what it can
      score: 100,
      issues_found: 0, // Issues are found in Layer 1
      issues_fixed: issuesFixed,
      critical_issues: 0,
    };
  }

  /**
   * Calculate overall QA score
   */
  private calculateOverallScore(layers: LayerResult[]): number {
    if (layers.length === 0) return 100;

    // Weighted average of layer scores
    // Layer 1 (deterministic) is most important: 60%
    // Layer 2 (industry) is important: 30%
    // Layer 3 (auto-correction) is supplementary: 10%
    const weights = { 1: 0.6, 2: 0.3, 3: 0.1 };

    let totalWeight = 0;
    let weightedSum = 0;

    for (const layer of layers) {
      const weight = weights[layer.layer as keyof typeof weights] || 0.1;
      totalWeight += weight;
      weightedSum += layer.score * weight;
    }

    return Math.round(totalWeight > 0 ? weightedSum / totalWeight : 0);
  }

  /**
   * Determine overall QA status
   */
  private determineStatus(
    layers: LayerResult[],
    criticalBlockers: string[],
    score: number
  ): QAStatus {
    // Critical blockers = blocked
    if (criticalBlockers.length > 0) {
      return QAStatus.BLOCKED;
    }

    // Check if any layer failed
    const anyFailed = layers.some((l) => !l.passed && l.critical_issues > 0);
    if (anyFailed) {
      return QAStatus.FAILED;
    }

    // Score below minimum = needs review
    if (score < this.config.minimum_passing_score) {
      return QAStatus.NEEDS_REVIEW;
    }

    // Check for warnings
    const hasWarnings = layers.some((l) => l.issues_found > l.issues_fixed);
    if (hasWarnings) {
      if (this.config.strict_mode) {
        return QAStatus.NEEDS_REVIEW;
      }
      return QAStatus.PASSED_WITH_WARNINGS;
    }

    return QAStatus.PASSED;
  }

  /**
   * Get empty validation result for when Layer 1 is skipped
   */
  private getEmptyValidationResult(): FullValidationResult {
    return {
      overall_passed: true,
      categories: {},
      critical_count: 0,
      error_count: 0,
      warning_count: 0,
      all_issues: [],
      score: 100,
    };
  }

  /**
   * Get a summary of the QA status
   */
  async getSummary(): Promise<string> {
    const report = await this.runFullQA();

    switch (report.status) {
      case QAStatus.PASSED:
        return `QA PASSED (Score: ${report.overall_score}/100)`;
      case QAStatus.PASSED_WITH_WARNINGS:
        return `QA PASSED with ${report.warnings.length} warning(s) (Score: ${report.overall_score}/100)`;
      case QAStatus.NEEDS_REVIEW:
        return `QA NEEDS REVIEW - Score ${report.overall_score}/100 below threshold`;
      case QAStatus.FAILED:
        return `QA FAILED - ${report.total_remaining} issue(s) remaining`;
      case QAStatus.BLOCKED:
        return `QA BLOCKED - ${report.critical_blockers.length} critical issue(s): ${report.critical_blockers.join(', ')}`;
      default:
        return `QA Status Unknown (Score: ${report.overall_score}/100)`;
    }
  }
}

// ============ FACTORY FUNCTION ============

/**
 * Create a new QAOrchestrator
 */
export function createQAOrchestrator(
  store: ValuationDataStore,
  config?: Partial<QAOrchestratorConfig>
): QAOrchestrator {
  return new QAOrchestrator(store, config);
}
