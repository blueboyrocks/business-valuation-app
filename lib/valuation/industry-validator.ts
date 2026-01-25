/**
 * IndustryReferenceValidator - Validates Text Against Industry Classification
 *
 * This module validates narrative text to ensure it doesn't contain
 * references to wrong industries. Key features:
 * - Full narrative validation
 * - Section-by-section validation
 * - Suggestions for fixing issues
 */

import type { IndustryLock } from './industry-lock';
import { findBlockedKeywordsInText, getRequiredKeywords, hasRequiredKeyword } from './industry-keywords';

// ============ TYPES ============

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  blocked_keywords_found: string[];
  suggestions: string[];
  section?: string;
}

export interface SectionInput {
  name: string;
  content: string;
}

export interface FullReportValidationResult {
  overall_valid: boolean;
  sections_passed: number;
  sections_failed: number;
  failed_sections: string[];
  all_errors: string[];
  all_warnings: string[];
  section_results: Map<string, ValidationResult>;
}

// ============ VALIDATOR CLASS ============

export class IndustryReferenceValidator {
  private readonly industryLock: IndustryLock;

  constructor(industryLock: IndustryLock) {
    this.industryLock = industryLock;
  }

  /**
   * Validate a narrative text block
   */
  validateNarrative(text: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Find blocked keywords
    const blockedFound = findBlockedKeywordsInText(this.industryLock.naics_code, text);

    if (blockedFound.length > 0) {
      for (const keyword of blockedFound) {
        errors.push(
          `Text contains '${keyword}' which is inconsistent with ${this.industryLock.naics_description}`
        );
      }

      suggestions.push(
        `Remove or replace references to: ${blockedFound.join(', ')}`
      );
      suggestions.push(
        `Ensure the narrative describes ${this.industryLock.naics_description} (NAICS ${this.industryLock.naics_code})`
      );
    }

    // Check for required keywords (warning only)
    const requiredKeywords = getRequiredKeywords(this.industryLock.naics_code);
    if (requiredKeywords.length > 0 && !hasRequiredKeyword(this.industryLock.naics_code, text)) {
      warnings.push(
        `Text may not adequately describe ${this.industryLock.naics_description}. Consider including terms like: ${requiredKeywords.join(', ')}`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      blocked_keywords_found: blockedFound,
      suggestions,
    };
  }

  /**
   * Validate a specific report section
   */
  validateSection(sectionName: string, content: string): ValidationResult {
    const result = this.validateNarrative(content);
    result.section = sectionName;

    // Add section context to errors
    if (result.errors.length > 0) {
      result.errors = result.errors.map((error) => `[${sectionName}] ${error}`);
    }

    return result;
  }

  /**
   * Validate an entire report with multiple sections
   */
  validateFullReport(sections: SectionInput[]): FullReportValidationResult {
    const sectionResults = new Map<string, ValidationResult>();
    const failedSections: string[] = [];
    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    let sectionsPassed = 0;
    let sectionsFailed = 0;

    for (const section of sections) {
      const result = this.validateSection(section.name, section.content);
      sectionResults.set(section.name, result);

      if (result.valid) {
        sectionsPassed++;
      } else {
        sectionsFailed++;
        failedSections.push(section.name);
      }

      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    }

    return {
      overall_valid: sectionsFailed === 0,
      sections_passed: sectionsPassed,
      sections_failed: sectionsFailed,
      failed_sections: failedSections,
      all_errors: allErrors,
      all_warnings: allWarnings,
      section_results: sectionResults,
    };
  }

  /**
   * Get the locked industry information
   */
  getIndustryLock(): IndustryLock {
    return this.industryLock;
  }

  /**
   * Quick check if text contains any blocked keywords
   */
  hasBlockedKeywords(text: string): boolean {
    const blocked = findBlockedKeywordsInText(this.industryLock.naics_code, text);
    return blocked.length > 0;
  }

  /**
   * Get a summary of the validator configuration
   */
  getSummary(): string {
    return `IndustryReferenceValidator for ${this.industryLock.naics_description} (NAICS ${this.industryLock.naics_code})`;
  }
}

// ============ FACTORY FUNCTION ============

/**
 * Create a new IndustryReferenceValidator
 */
export function createIndustryValidator(industryLock: IndustryLock): IndustryReferenceValidator {
  return new IndustryReferenceValidator(industryLock);
}
