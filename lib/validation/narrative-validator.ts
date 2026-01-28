/**
 * Post-Generation Narrative Validator
 *
 * Checks generated narrative text for correct financial values by comparing
 * against the authoritative DataAccessor. Catches AI hallucinations before
 * they reach the PDF.
 *
 * PRD-I: US-014
 */

import type { ValuationDataAccessor } from '../valuation/data-accessor';

// ============ TYPES ============

export interface ValueMention {
  metric: string;
  found: string;
  expected: string;
  matched: boolean;
  context: string;
}

export interface NarrativeValidationResult {
  valid: boolean;
  section: string;
  errors: string[];
  warnings: string[];
  valueMentions: ValueMention[];
}

// ============ EXTRACTION HELPERS ============

/**
 * Extract all currency values from text (e.g., "$1,234,567" or "$1.2M").
 * Returns an array of { raw, value }.
 */
function extractCurrencyValues(text: string): Array<{ raw: string; value: number }> {
  const results: Array<{ raw: string; value: number }> = [];

  // Match $X,XXX,XXX or $X,XXX patterns (with optional decimals)
  const fullPattern = /\$\s?([\d,]+(?:\.\d{1,2})?)/g;
  let match: RegExpExecArray | null;
  while ((match = fullPattern.exec(text)) !== null) {
    const raw = match[0];
    const numStr = match[1].replace(/,/g, '');
    const value = parseFloat(numStr);
    if (!isNaN(value) && value > 0) {
      results.push({ raw, value });
    }
  }

  // Match $X.XM or $X.XB patterns (millions/billions shorthand)
  const shortPattern = /\$\s?([\d.]+)\s*(million|billion|M|B)/gi;
  while ((match = shortPattern.exec(text)) !== null) {
    const raw = match[0];
    const num = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    const multiplier = (unit === 'million' || unit === 'm') ? 1_000_000 : 1_000_000_000;
    const value = num * multiplier;
    if (!isNaN(value) && value > 0) {
      results.push({ raw, value });
    }
  }

  return results;
}

/**
 * Extract multiplier values from text (e.g., "2.50x" or "2.5 times").
 */
function extractMultiples(text: string): Array<{ raw: string; value: number }> {
  const results: Array<{ raw: string; value: number }> = [];

  const pattern = /([\d.]+)\s*[xX×]\b/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const raw = match[0];
    const value = parseFloat(match[1]);
    if (!isNaN(value) && value > 0 && value < 100) {
      results.push({ raw, value });
    }
  }

  // Also match "X.XX times" pattern
  const timesPattern = /([\d.]+)\s*times/gi;
  while ((match = timesPattern.exec(text)) !== null) {
    const raw = match[0];
    const value = parseFloat(match[1]);
    if (!isNaN(value) && value > 0 && value < 100) {
      results.push({ raw, value });
    }
  }

  return results;
}

/**
 * Check if a found value matches an authoritative value within tolerance.
 */
function valuesMatch(found: number, authoritative: number, tolerance: number): boolean {
  if (authoritative === 0) return found === 0;
  const diff = Math.abs(found - authoritative) / Math.abs(authoritative);
  return diff <= tolerance;
}

/**
 * Get surrounding context for a match in text.
 */
function getContext(text: string, searchStr: string, contextChars: number = 60): string {
  const idx = text.indexOf(searchStr);
  if (idx === -1) return '';
  const start = Math.max(0, idx - contextChars);
  const end = Math.min(text.length, idx + searchStr.length + contextChars);
  let ctx = text.slice(start, end).replace(/\s+/g, ' ').trim();
  if (start > 0) ctx = '...' + ctx;
  if (end < text.length) ctx = ctx + '...';
  return ctx;
}

// ============ METRIC CHECK DEFINITIONS ============

interface NarrativeMetricCheck {
  metric: string;
  getAuthoritative: (accessor: ValuationDataAccessor) => number;
  getFormatted: (accessor: ValuationDataAccessor) => string;
  type: 'currency' | 'multiple';
  tolerance: number;
  /** Keywords near the value to identify it as this metric */
  keywords: string[];
  /** Sections where this metric is critical (error if wrong, not warning) */
  criticalIn: string[];
}

const NARRATIVE_CHECKS: NarrativeMetricCheck[] = [
  {
    metric: 'Final Value',
    getAuthoritative: (a) => a.getFinalValue(),
    getFormatted: (a) => a.getFormattedFinalValue(),
    type: 'currency',
    tolerance: 0.01,
    keywords: [
      'concluded', 'fair market value', 'final value', 'fmv',
      'valuation conclusion', 'concluded value', 'determined value',
      'estimated value', 'appraised value', 'opinion of value',
    ],
    criticalIn: [
      'executive_summary', 'executiveSummary',
      'conclusion_of_value', 'conclusionOfValue',
    ],
  },
  {
    metric: 'SDE Multiple',
    getAuthoritative: (a) => a.getSDEMultiple(),
    getFormatted: (a) => a.getFormattedSDEMultiple(),
    type: 'multiple',
    tolerance: 0.05,
    keywords: [
      'sde multiple', 'earnings multiple', 'sde multiplier',
      'multiple of sde', 'market multiple', 'multiplied by',
    ],
    criticalIn: [
      'executive_summary', 'executiveSummary',
      'market_approach', 'marketApproach',
    ],
  },
];

// ============ MAIN VALIDATOR ============

/**
 * Validate a generated narrative section against authoritative DataAccessor values.
 *
 * Extracts financial values from the narrative text and compares them to
 * authoritative values. Reports mismatches as errors (critical sections)
 * or warnings (non-critical sections).
 *
 * @param section - Section identifier (e.g., 'executive_summary' or 'executiveSummary')
 * @param generatedText - The AI-generated narrative text to validate
 * @param accessor - DataAccessor providing authoritative values
 * @returns NarrativeValidationResult with validity status, errors, warnings, and value mentions
 */
export function validateNarrative(
  section: string,
  generatedText: string,
  accessor: ValuationDataAccessor,
): NarrativeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const valueMentions: ValueMention[] = [];

  if (!generatedText || generatedText.trim().length === 0) {
    return { valid: true, section, errors, warnings, valueMentions };
  }

  const lowerText = generatedText.toLowerCase();

  for (const check of NARRATIVE_CHECKS) {
    const authValue = check.getAuthoritative(accessor);
    const formattedAuth = check.getFormatted(accessor);

    // Skip metrics with zero/invalid authoritative values
    if (authValue === 0 || isNaN(authValue)) continue;

    // Check if any keywords for this metric appear in the text
    const hasKeyword = check.keywords.some(kw => lowerText.includes(kw));
    if (!hasKeyword) continue;

    // Extract values from text based on metric type
    const extracted = check.type === 'currency'
      ? extractCurrencyValues(generatedText)
      : extractMultiples(generatedText);

    if (extracted.length === 0) continue;

    // Filter to candidates in similar range (within 10x of authoritative)
    const candidates = extracted.filter(e => {
      const ratio = e.value / authValue;
      return ratio > 0.1 && ratio < 10;
    });

    const isCritical = check.criticalIn.includes(section);

    for (const candidate of candidates) {
      const matched = valuesMatch(candidate.value, authValue, check.tolerance);
      const context = getContext(generatedText, candidate.raw);

      valueMentions.push({
        metric: check.metric,
        found: candidate.raw,
        expected: formattedAuth,
        matched,
        context,
      });

      if (!matched) {
        const message = `${check.metric} mismatch in "${section}": found ${candidate.raw} but expected ${formattedAuth}`;
        if (isCritical) {
          errors.push(message);
        } else {
          warnings.push(message);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    section,
    errors,
    warnings,
    valueMentions,
  };
}

/**
 * Validate a narrative section and throw on critical errors.
 *
 * Logs warnings to console but does not throw for non-critical issues.
 * Throws an Error with detailed message if any critical errors are found.
 *
 * @param section - Section identifier
 * @param generatedText - The AI-generated narrative text to validate
 * @param accessor - DataAccessor providing authoritative values
 * @throws Error if critical value mismatches are found
 */
export function validateNarrativeOrThrow(
  section: string,
  generatedText: string,
  accessor: ValuationDataAccessor,
): void {
  const result = validateNarrative(section, generatedText, accessor);

  // Log warnings
  for (const warning of result.warnings) {
    console.log(`[NarrativeValidator] WARNING: ${warning}`);
  }

  if (!result.valid) {
    const errorSummary = result.errors.join('\n  - ');
    throw new Error(
      `Narrative validation failed for "${section}":\n  - ${errorSummary}\n` +
      `Fix the narrative to use the exact authoritative values from the DataAccessor.`
    );
  }
}
