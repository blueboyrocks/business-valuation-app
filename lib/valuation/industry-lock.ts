/**
 * IndustryLock - Prevents Industry Classification Changes After Determination
 *
 * This module implements the Industry Classification Lock (PRD Section 2).
 * Key features:
 * - Locks industry after Pass 2 determines classification
 * - Validates text references against locked industry
 * - Prevents cross-industry contamination in narratives
 */

import { findBlockedKeywordsInText, getKeywordSetForNAICS } from './industry-keywords';

// ============ TYPES ============

export interface IndustryLockInput {
  naics_code: string;
  naics_description: string;
  sic_code?: string;
  locked_by_pass: number;
}

export interface IndustryValidationResult {
  valid: boolean;
  issues: string[];
  blocked_keywords_found: string[];
}

export interface IndustryLockJSON {
  naics_code: string;
  naics_description: string;
  sic_code: string | null;
  locked_at: string;
  locked_by_pass: number;
}

// ============ ERROR CLASS ============

export class IndustryLockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IndustryLockError';
  }
}

// ============ INDUSTRY LOCK CLASS ============

export class IndustryLock {
  readonly naics_code: string;
  readonly naics_description: string;
  readonly sic_code: string | null;
  readonly locked_at: string;
  readonly locked_by_pass: number;

  constructor(input: IndustryLockInput) {
    // Validate NAICS code
    if (!input.naics_code || input.naics_code.trim() === '') {
      throw new IndustryLockError('NAICS code is required');
    }

    // NAICS codes should be 2-6 digits
    if (!/^\d{2,6}$/.test(input.naics_code)) {
      throw new IndustryLockError(`Invalid NAICS code format: ${input.naics_code}. Must be 2-6 digits.`);
    }

    // Validate description
    if (!input.naics_description || input.naics_description.trim() === '') {
      throw new IndustryLockError('Industry description is required');
    }

    this.naics_code = input.naics_code;
    this.naics_description = input.naics_description;
    this.sic_code = input.sic_code || null;
    this.locked_at = new Date().toISOString();
    this.locked_by_pass = input.locked_by_pass;

    // Freeze the object to prevent modifications
    Object.freeze(this);
  }

  /**
   * Validate text for incorrect industry references
   */
  validateReference(text: string): IndustryValidationResult {
    const issues: string[] = [];
    const blockedFound = findBlockedKeywordsInText(this.naics_code, text);

    if (blockedFound.length > 0) {
      for (const keyword of blockedFound) {
        issues.push(
          `Text contains reference to '${keyword}' which is inconsistent with ${this.naics_description} (NAICS ${this.naics_code})`
        );
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      blocked_keywords_found: blockedFound,
    };
  }

  /**
   * Check if a NAICS code matches the locked industry
   */
  matchesNAICS(naicsCode: string): boolean {
    return this.naics_code === naicsCode;
  }

  /**
   * Check if text contains the industry name (case insensitive)
   */
  matchesIndustry(text: string): boolean {
    const lowerText = text.toLowerCase();
    const lowerDescription = this.naics_description.toLowerCase();

    // Check for key words from the industry description
    const keyWords = lowerDescription.split(/\s+/);

    for (const word of keyWords) {
      if (word.length > 3 && lowerText.includes(word)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get keyword set for this locked industry
   */
  getKeywordSet() {
    return getKeywordSetForNAICS(this.naics_code);
  }

  /**
   * Convert to JSON for serialization
   */
  toJSON(): IndustryLockJSON {
    return {
      naics_code: this.naics_code,
      naics_description: this.naics_description,
      sic_code: this.sic_code,
      locked_at: this.locked_at,
      locked_by_pass: this.locked_by_pass,
    };
  }

  /**
   * Get a human-readable string representation
   */
  toString(): string {
    return `IndustryLock(${this.naics_code}: ${this.naics_description})`;
  }
}

// ============ FACTORY FUNCTION ============

/**
 * Create a new IndustryLock
 */
export function createIndustryLock(input: IndustryLockInput): IndustryLock {
  return new IndustryLock(input);
}

/**
 * Create an IndustryLock from a JSON object
 */
export function createIndustryLockFromJSON(json: IndustryLockJSON): IndustryLock {
  const lock = new IndustryLock({
    naics_code: json.naics_code,
    naics_description: json.naics_description,
    sic_code: json.sic_code || undefined,
    locked_by_pass: json.locked_by_pass,
  });

  // Note: locked_at will be regenerated - if preservation is needed,
  // create a mutable version first
  return lock;
}
