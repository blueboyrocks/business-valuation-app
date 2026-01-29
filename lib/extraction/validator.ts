/**
 * Extraction Data Validator
 * PRD-H: Robust PDF Extraction Pipeline
 *
 * Validates extracted financial data for reasonableness before
 * it affects valuation calculations.
 *
 * Validation levels:
 * - error: Critical issues that block further processing
 * - warning: Issues that require review but allow processing
 * - info: Informational items (SDE add-back opportunities)
 */

import { Stage2Output, ValidationResult, StructuredFinancialData } from './types';
import { ALL_VALIDATION_RULES, ValidationRule } from './validation-rules';

/**
 * Validation summary
 */
export interface ValidationSummary {
  passed: boolean;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  results: ValidationResult[];
  blockers: ValidationResult[];
}

/**
 * Validate extracted financial data against all rules
 *
 * @param stage2Output - The Stage 2 extraction output
 * @param rawText - Optional raw text for additional checks
 * @returns ValidationSummary with all validation results
 */
export function validateExtraction(
  stage2Output: Stage2Output,
  rawText?: string
): ValidationSummary {
  const results: ValidationResult[] = [];

  const structuredData = stage2Output.structured_data;
  if (!structuredData) {
    return {
      passed: false,
      errorCount: 1,
      warningCount: 0,
      infoCount: 0,
      results: [
        {
          id: 'VAL000',
          name: 'No Data',
          severity: 'error',
          passed: false,
          field: 'structured_data',
          message: 'No structured data available for validation. Extraction may have failed - review Stage 1 and Stage 2 outputs.',
        },
      ],
      blockers: [],
    };
  }

  // Run all validation rules
  for (const rule of ALL_VALIDATION_RULES) {
    try {
      const result = rule.validate(structuredData, rawText);
      if (result) {
        results.push(result);
      }
    } catch (error) {
      // Log but don't fail on individual rule errors
      console.error(`Validation rule ${rule.id} failed:`, error);
    }
  }

  // Count by severity
  const errorCount = results.filter((r) => r.severity === 'error').length;
  const warningCount = results.filter((r) => r.severity === 'warning').length;
  const infoCount = results.filter((r) => r.severity === 'info').length;

  // Extract blockers (errors that prevent processing)
  const blockers = results.filter((r) => r.severity === 'error');

  return {
    passed: errorCount === 0,
    errorCount,
    warningCount,
    infoCount,
    results,
    blockers,
  };
}

/**
 * Run a subset of validation rules
 *
 * @param structuredData - The structured financial data
 * @param ruleIds - Array of rule IDs to run
 * @returns Array of validation results
 */
export function validateSubset(
  structuredData: StructuredFinancialData,
  ruleIds: string[]
): ValidationResult[] {
  const results: ValidationResult[] = [];

  const rules = ALL_VALIDATION_RULES.filter((r) => ruleIds.includes(r.id));

  for (const rule of rules) {
    try {
      const result = rule.validate(structuredData);
      if (result) {
        results.push(result);
      }
    } catch (error) {
      console.error(`Validation rule ${rule.id} failed:`, error);
    }
  }

  return results;
}

/**
 * Run validation rules by category
 *
 * @param structuredData - The structured financial data
 * @param category - The category to validate
 * @returns Array of validation results
 */
export function validateCategory(
  structuredData: StructuredFinancialData,
  category: ValidationRule['category']
): ValidationResult[] {
  const results: ValidationResult[] = [];

  const rules = ALL_VALIDATION_RULES.filter((r) => r.category === category);

  for (const rule of rules) {
    try {
      const result = rule.validate(structuredData);
      if (result) {
        results.push(result);
      }
    } catch (error) {
      console.error(`Validation rule ${rule.id} failed:`, error);
    }
  }

  return results;
}

/**
 * Get all SDE-related validation info items
 * Useful for building the SDE add-back summary
 *
 * @param structuredData - The structured financial data
 * @returns Array of SDE-related validation results
 */
export function getSdeValidationInfo(
  structuredData: StructuredFinancialData
): ValidationResult[] {
  const sdeRuleIds = ['SDE002', 'SDE003', 'SDE004', 'COVID001'];
  return validateSubset(structuredData, sdeRuleIds);
}

/**
 * Get critical blockers only
 * Useful for quick pre-processing check
 *
 * @param structuredData - The structured financial data
 * @returns Array of blocking validation results
 */
export function getCriticalBlockers(
  structuredData: StructuredFinancialData
): ValidationResult[] {
  const results: ValidationResult[] = [];

  const criticalRules = ALL_VALIDATION_RULES.filter((r) => r.severity === 'error');

  for (const rule of criticalRules) {
    try {
      const result = rule.validate(structuredData);
      if (result) {
        results.push(result);
      }
    } catch (error) {
      console.error(`Validation rule ${rule.id} failed:`, error);
    }
  }

  return results;
}

/**
 * Format validation results as human-readable text
 */
export function formatValidationResults(summary: ValidationSummary): string {
  const lines: string[] = [];

  lines.push(`Validation ${summary.passed ? 'PASSED' : 'FAILED'}`);
  lines.push(`  Errors: ${summary.errorCount}`);
  lines.push(`  Warnings: ${summary.warningCount}`);
  lines.push(`  Info: ${summary.infoCount}`);
  lines.push('');

  if (summary.blockers.length > 0) {
    lines.push('=== BLOCKERS (must fix) ===');
    for (const result of summary.blockers) {
      lines.push(`[${result.id}] ${result.name}`);
      lines.push(`  ${result.message}`);
      lines.push('');
    }
  }

  const warnings = summary.results.filter((r) => r.severity === 'warning');
  if (warnings.length > 0) {
    lines.push('=== WARNINGS (review recommended) ===');
    for (const result of warnings) {
      lines.push(`[${result.id}] ${result.name}`);
      lines.push(`  ${result.message}`);
      lines.push('');
    }
  }

  const info = summary.results.filter((r) => r.severity === 'info');
  if (info.length > 0) {
    lines.push('=== INFO (SDE opportunities) ===');
    for (const result of info) {
      lines.push(`[${result.id}] ${result.name}`);
      lines.push(`  ${result.message}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Check if validation results indicate the data is usable
 * (may have warnings but no blocking errors)
 */
export function isDataUsable(summary: ValidationSummary): boolean {
  return summary.passed || summary.errorCount === 0;
}

/**
 * Get validation status string for database storage
 */
export function getValidationStatus(
  summary: ValidationSummary
): 'passed' | 'warnings' | 'errors' {
  if (summary.errorCount > 0) return 'errors';
  if (summary.warningCount > 0) return 'warnings';
  return 'passed';
}
