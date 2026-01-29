/**
 * Confidence Scoring System
 * PRD-H: Robust PDF Extraction Pipeline
 *
 * Calculates an overall extraction confidence score for escalation decisions.
 * Weighs classification confidence, mapping completeness, and validation results.
 *
 * Score interpretation:
 * - 90-100: High confidence, ready for valuation
 * - 70-89: Good confidence, minor review recommended
 * - 50-69: Medium confidence, Opus escalation recommended
 * - 0-49: Low confidence, human review recommended
 */

import {
  Stage2Output,
  ValidationResult,
  StructuredFinancialData,
  DocumentClassification,
  CrossDocValidationResult,
} from './types';

/**
 * Weight configuration for confidence calculation
 * Weights sum to 100
 */
const WEIGHTS = {
  // Document classification confidence (20%)
  CLASSIFICATION: 20,

  // Data completeness - critical fields populated (30%)
  DATA_COMPLETENESS: 30,

  // Validation results - no errors, few warnings (30%)
  VALIDATION: 30,

  // Internal consistency - math checks out (20%)
  CONSISTENCY: 20,
};

/**
 * Thresholds for escalation decisions
 */
export const ESCALATION_THRESHOLDS = {
  // Below this score, recommend Opus escalation
  OPUS_ESCALATION: 70,

  // Below this score, recommend human review
  HUMAN_REVIEW: 50,

  // Above this score, ready for valuation
  READY_FOR_VALUATION: 70,
};

/**
 * Confidence score result
 */
export interface ConfidenceScore {
  overall: number; // 0-100
  breakdown: {
    classification: number;
    dataCompleteness: number;
    validation: number;
    consistency: number;
  };
  recommendation: 'ready' | 'opus_escalation' | 'human_review';
  reasoning: string[];
  missingCriticalData: string[];
}

/**
 * Critical fields for SDE valuation
 * Missing any of these significantly impacts confidence
 */
const CRITICAL_FIELDS = {
  income_statement: ['gross_receipts', 'cost_of_goods_sold', 'gross_profit', 'total_income'],
  expenses: ['officer_compensation', 'total_deductions'],
  balance_sheet: ['eoy_total_assets', 'eoy_total_liabilities', 'eoy_total_equity'],
};

/**
 * Calculate classification confidence score
 */
function calculateClassificationScore(classification: DocumentClassification): {
  score: number;
  reasons: string[];
} {
  const reasons: string[] = [];

  // Start with base score based on confidence level
  let score = 0;
  switch (classification.confidence) {
    case 'high':
      score = 100;
      break;
    case 'medium':
      score = 70;
      reasons.push('Medium classification confidence');
      break;
    case 'low':
      score = 40;
      reasons.push('Low classification confidence');
      break;
    default:
      score = 0;
      reasons.push('Unknown classification confidence');
  }

  // Penalize if document type is unknown
  if (classification.document_type === 'UNKNOWN') {
    score = Math.min(score, 20);
    reasons.push('Document type could not be determined');
  }

  // Penalize if tax year missing
  if (!classification.tax_year) {
    score -= 10;
    reasons.push('Tax year not identified');
  }

  // Penalize if entity name missing
  if (!classification.entity_name) {
    score -= 5;
    reasons.push('Entity name not identified');
  }

  // Boost if we have good indicators
  if (classification.indicators && classification.indicators.length >= 3) {
    score = Math.min(score + 5, 100);
  }

  return { score: Math.max(0, score), reasons };
}

/**
 * Calculate data completeness score
 */
function calculateCompletenessScore(data: StructuredFinancialData): {
  score: number;
  reasons: string[];
  missing: string[];
} {
  const reasons: string[] = [];
  const missing: string[] = [];
  let fieldsPopulated = 0;
  let fieldsRequired = 0;

  // Check income statement fields
  const is = data.income_statement;
  if (is) {
    for (const field of CRITICAL_FIELDS.income_statement) {
      fieldsRequired++;
      const value = is[field as keyof typeof is];
      if (value !== undefined && value !== 0) {
        fieldsPopulated++;
      } else {
        missing.push(`income_statement.${field}`);
      }
    }
  } else {
    fieldsRequired += CRITICAL_FIELDS.income_statement.length;
    missing.push('income_statement (entire section)');
    reasons.push('No income statement data extracted');
  }

  // Check expense fields
  const exp = data.expenses;
  if (exp) {
    for (const field of CRITICAL_FIELDS.expenses) {
      fieldsRequired++;
      const value = exp[field as keyof typeof exp];
      if (value !== undefined && value !== 0) {
        fieldsPopulated++;
      } else if (field === 'officer_compensation') {
        // Officer comp can legitimately be 0 for some entity types
        const gp = data.guaranteed_payments;
        if (gp && gp.total > 0) {
          fieldsPopulated++; // Count guaranteed payments as alternative
        } else {
          missing.push(`expenses.${field}`);
        }
      } else {
        missing.push(`expenses.${field}`);
      }
    }
  } else {
    fieldsRequired += CRITICAL_FIELDS.expenses.length;
    missing.push('expenses (entire section)');
    reasons.push('No expense data extracted');
  }

  // Check balance sheet fields
  const bs = data.balance_sheet;
  if (bs) {
    for (const field of CRITICAL_FIELDS.balance_sheet) {
      fieldsRequired++;
      const value = bs[field as keyof typeof bs];
      if (value !== undefined && value !== 0) {
        fieldsPopulated++;
      } else {
        missing.push(`balance_sheet.${field}`);
      }
    }
  } else {
    fieldsRequired += CRITICAL_FIELDS.balance_sheet.length;
    // Balance sheet is optional for Schedule C
    reasons.push('No balance sheet data (may be OK for Schedule C)');
  }

  // Calculate score
  const completenessRatio = fieldsRequired > 0 ? fieldsPopulated / fieldsRequired : 0;
  const score = Math.round(completenessRatio * 100);

  if (completenessRatio < 0.5) {
    reasons.push('Less than 50% of critical fields populated');
  } else if (completenessRatio < 0.8) {
    reasons.push('Some critical fields missing');
  }

  return { score, reasons, missing };
}

/**
 * Calculate validation score
 */
function calculateValidationScore(results: ValidationResult[]): {
  score: number;
  reasons: string[];
} {
  const reasons: string[] = [];

  if (results.length === 0) {
    return { score: 100, reasons: ['No validation issues'] };
  }

  const errors = results.filter((r) => r.severity === 'error');
  const warnings = results.filter((r) => r.severity === 'warning');
  const infos = results.filter((r) => r.severity === 'info');

  // Start with 100, deduct for issues
  let score = 100;

  // Errors are severe - each error deducts 15 points
  score -= errors.length * 15;
  if (errors.length > 0) {
    reasons.push(`${errors.length} validation error(s)`);
  }

  // Warnings deduct 5 points each
  score -= warnings.length * 5;
  if (warnings.length > 0) {
    reasons.push(`${warnings.length} validation warning(s)`);
  }

  // Infos are informational, small deduction
  score -= infos.length * 1;

  return { score: Math.max(0, score), reasons };
}

/**
 * Calculate internal consistency score
 */
function calculateConsistencyScore(data: StructuredFinancialData): {
  score: number;
  reasons: string[];
} {
  const reasons: string[] = [];
  let score = 100;

  // Check balance sheet equation: Assets = Liabilities + Equity
  const bs = data.balance_sheet;
  if (bs) {
    const assets = bs.eoy_total_assets;
    const liabilitiesEquity = bs.eoy_total_liabilities + bs.eoy_total_equity;

    if (assets > 0 || liabilitiesEquity > 0) {
      const diff = Math.abs(assets - liabilitiesEquity);
      const tolerance = Math.max(assets, liabilitiesEquity) * 0.01;

      if (diff > tolerance) {
        score -= 20;
        reasons.push('Balance sheet does not balance');
      }
    }
  }

  // Check gross profit calculation
  const is = data.income_statement;
  if (is) {
    const revenue = is.gross_receipts - (is.returns_allowances || 0);
    const expectedGrossProfit = revenue - is.cost_of_goods_sold;
    const actualGrossProfit = is.gross_profit;

    if (revenue > 0) {
      const diff = Math.abs(expectedGrossProfit - actualGrossProfit);
      const tolerance = revenue * 0.01;

      if (diff > tolerance && diff > 100) {
        score -= 15;
        reasons.push('Gross profit calculation inconsistent');
      }
    }
  }

  // Check COGS reconciliation if detail available
  const cogsDetail = data.cogs_detail;
  if (cogsDetail && is) {
    const calculatedCogs =
      cogsDetail.beginning_inventory +
      cogsDetail.purchases +
      cogsDetail.labor_costs +
      cogsDetail.other_costs -
      cogsDetail.ending_inventory;

    const reportedCogs = is.cost_of_goods_sold;
    const diff = Math.abs(calculatedCogs - reportedCogs);
    const tolerance = Math.max(reportedCogs, 1) * 0.02;

    if (diff > tolerance && diff > 500) {
      score -= 10;
      reasons.push('COGS detail does not reconcile');
    }
  }

  // Check distributions vs net income (sanity check)
  const schedK = data.schedule_k;
  if (schedK && is) {
    const distributions = schedK.cash_distributions ?? 0;
    const netIncome = is.total_income ?? 0;

    if (distributions > 0 && netIncome > 0 && distributions > netIncome * 2) {
      score -= 10;
      reasons.push('Distributions significantly exceed net income');
    }
  }

  return { score: Math.max(0, score), reasons };
}

/**
 * Calculate overall confidence score
 *
 * @param stage2Output - Stage 2 extraction output
 * @param validationResults - Validation results from validator
 * @param crossDocResults - Optional cross-document validation results
 * @returns ConfidenceScore with overall score, breakdown, and recommendation
 */
export function calculateConfidence(
  stage2Output: Stage2Output,
  validationResults: ValidationResult[],
  crossDocResults?: CrossDocValidationResult[]
): ConfidenceScore {
  const reasoning: string[] = [];

  // Calculate each component score
  const classificationResult = calculateClassificationScore(stage2Output.classification);
  const completenessResult = calculateCompletenessScore(stage2Output.structured_data);
  const validationResult = calculateValidationScore(validationResults);
  const consistencyResult = calculateConsistencyScore(stage2Output.structured_data);

  // Collect all reasoning
  reasoning.push(...classificationResult.reasons);
  reasoning.push(...completenessResult.reasons);
  reasoning.push(...validationResult.reasons);
  reasoning.push(...consistencyResult.reasons);

  // Cross-document validation adjustments
  let crossDocAdjustment = 0;
  if (crossDocResults && crossDocResults.length > 0) {
    const crossDocErrors = crossDocResults.reduce(
      (sum, r) => sum + r.discrepancies.filter((d: { severity: string }) => d.severity === 'error').length,
      0
    );
    const crossDocWarnings = crossDocResults.reduce(
      (sum, r) => sum + r.discrepancies.filter((d: { severity: string }) => d.severity === 'warning').length,
      0
    );

    if (crossDocErrors > 0) {
      crossDocAdjustment = -10;
      reasoning.push(`${crossDocErrors} cross-document error(s)`);
    } else if (crossDocWarnings > 0) {
      crossDocAdjustment = -5;
      reasoning.push(`${crossDocWarnings} cross-document warning(s)`);
    }
  }

  // Calculate weighted overall score
  const overall = Math.round(
    (classificationResult.score * WEIGHTS.CLASSIFICATION +
      completenessResult.score * WEIGHTS.DATA_COMPLETENESS +
      validationResult.score * WEIGHTS.VALIDATION +
      consistencyResult.score * WEIGHTS.CONSISTENCY) /
      100 +
      crossDocAdjustment
  );

  // Determine recommendation
  let recommendation: ConfidenceScore['recommendation'];
  if (overall >= ESCALATION_THRESHOLDS.READY_FOR_VALUATION) {
    recommendation = 'ready';
  } else if (overall >= ESCALATION_THRESHOLDS.HUMAN_REVIEW) {
    recommendation = 'opus_escalation';
    reasoning.push(`Score ${overall} below ${ESCALATION_THRESHOLDS.OPUS_ESCALATION} - Opus escalation recommended`);
  } else {
    recommendation = 'human_review';
    reasoning.push(`Score ${overall} below ${ESCALATION_THRESHOLDS.HUMAN_REVIEW} - Human review recommended`);
  }

  return {
    overall: Math.max(0, Math.min(100, overall)),
    breakdown: {
      classification: classificationResult.score,
      dataCompleteness: completenessResult.score,
      validation: validationResult.score,
      consistency: consistencyResult.score,
    },
    recommendation,
    reasoning,
    missingCriticalData: completenessResult.missing,
  };
}

/**
 * Quick confidence check (lightweight version)
 * Useful for early pipeline decisions
 */
export function quickConfidenceCheck(stage2Output: Stage2Output): {
  estimatedScore: number;
  proceed: boolean;
  reason: string;
} {
  const classification = stage2Output.classification;
  const data = stage2Output.structured_data;

  // Quick checks
  if (classification.document_type === 'UNKNOWN') {
    return {
      estimatedScore: 20,
      proceed: false,
      reason: 'Unknown document type',
    };
  }

  if (!data.income_statement || data.income_statement.gross_receipts === 0) {
    return {
      estimatedScore: 30,
      proceed: false,
      reason: 'No revenue data extracted',
    };
  }

  if (classification.confidence === 'low') {
    return {
      estimatedScore: 50,
      proceed: true,
      reason: 'Low classification confidence - recommend AI validation',
    };
  }

  // Basic completeness check
  const hasOfficerComp = (data.expenses?.officer_compensation ?? 0) > 0;
  const hasGuaranteedPayments = (data.guaranteed_payments?.total ?? 0) > 0;

  if (!hasOfficerComp && !hasGuaranteedPayments) {
    return {
      estimatedScore: 60,
      proceed: true,
      reason: 'No owner compensation identified - may be missing or zero',
    };
  }

  return {
    estimatedScore: 80,
    proceed: true,
    reason: 'Basic checks passed',
  };
}

/**
 * Format confidence score for display
 */
export function formatConfidenceScore(score: ConfidenceScore): string {
  const lines: string[] = [];

  lines.push(`Overall Confidence: ${score.overall}%`);
  lines.push(`Recommendation: ${score.recommendation.replace('_', ' ').toUpperCase()}`);
  lines.push('');
  lines.push('Breakdown:');
  lines.push(`  Classification: ${score.breakdown.classification}%`);
  lines.push(`  Data Completeness: ${score.breakdown.dataCompleteness}%`);
  lines.push(`  Validation: ${score.breakdown.validation}%`);
  lines.push(`  Consistency: ${score.breakdown.consistency}%`);

  if (score.missingCriticalData.length > 0) {
    lines.push('');
    lines.push('Missing Critical Data:');
    for (const field of score.missingCriticalData) {
      lines.push(`  - ${field}`);
    }
  }

  if (score.reasoning.length > 0) {
    lines.push('');
    lines.push('Reasoning:');
    for (const reason of score.reasoning) {
      lines.push(`  - ${reason}`);
    }
  }

  return lines.join('\n');
}
