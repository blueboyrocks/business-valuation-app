/**
 * Value Consistency Validator
 *
 * Extracts financial values from report section text and compares all mentions
 * of the same metric against the authoritative DataAccessor source.
 * Catches cases where different sections show different numbers for the same value.
 *
 * PRD-I: US-010
 */

import type { ValuationDataAccessor } from '../valuation/data-accessor';

// ============ TYPES ============

export interface ConsistencyCheck {
  metric: string;
  authoritative: string;
  found: string;
  section: string;
  passed: boolean;
  tolerance: number;
  context: string;
}

export interface ConsistencyResult {
  passed: boolean;
  checks: ConsistencyCheck[];
  errors: string[];
  warnings: string[];
}

// ============ EXTRACTION HELPERS ============

/**
 * Extract all currency values from text (e.g., "$1,234,567" or "$1.2M").
 * Returns an array of { raw, value } where value is the numeric amount.
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
 * Extract percentage values from text (e.g., "15.5%" or "15.5 percent").
 * Returns the numeric percentage value (e.g., 15.5 for "15.5%").
 */
function extractPercentages(text: string): Array<{ raw: string; value: number }> {
  const results: Array<{ raw: string; value: number }> = [];

  // Match X.X% or X% patterns
  const pctPattern = /([\d.]+)\s*%/g;
  let match: RegExpExecArray | null;
  while ((match = pctPattern.exec(text)) !== null) {
    const raw = match[0];
    const value = parseFloat(match[1]);
    if (!isNaN(value) && value > 0 && value <= 100) {
      results.push({ raw, value });
    }
  }

  // Also match "X.X percent" pattern
  const percentPattern = /([\d.]+)\s*percent/gi;
  while ((match = percentPattern.exec(text)) !== null) {
    const raw = match[0];
    const value = parseFloat(match[1]);
    if (!isNaN(value) && value > 0 && value <= 100) {
      results.push({ raw, value });
    }
  }

  return results;
}

/**
 * Check if a currency value in text is "close enough" to an authoritative value.
 * Uses tolerance as a percentage (e.g., 0.01 = 1%).
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

/**
 * Check if a keyword appears within N characters of a value position.
 * This ensures we only flag values that are contextually related to a metric.
 */
function isNearKeyword(
  text: string,
  valuePosition: number,
  keywords: string[],
  maxDistance: number = 150
): boolean {
  const lowerText = text.toLowerCase();
  for (const keyword of keywords) {
    const keywordPos = lowerText.indexOf(keyword);
    if (keywordPos !== -1) {
      // Check if keyword is within maxDistance characters of the value
      const distance = Math.abs(keywordPos - valuePosition);
      if (distance <= maxDistance) {
        return true;
      }
      // Also check for multiple occurrences of the keyword
      let searchFrom = keywordPos + keyword.length;
      while (searchFrom < lowerText.length) {
        const nextPos = lowerText.indexOf(keyword, searchFrom);
        if (nextPos === -1) break;
        if (Math.abs(nextPos - valuePosition) <= maxDistance) {
          return true;
        }
        searchFrom = nextPos + keyword.length;
      }
    }
  }
  return false;
}

// ============ METRIC DEFINITIONS ============

interface MetricDefinition {
  name: string;
  getAuthoritative: (accessor: ValuationDataAccessor) => number;
  getFormattedAuthoritative: (accessor: ValuationDataAccessor) => string;
  type: 'currency' | 'multiple' | 'percentage';
  tolerance: number;
  /** Keywords that must appear near the value to be considered a match for this metric */
  keywords: string[];
  /** Sections where this metric is most important (others still checked) */
  criticalSections?: string[];
}

const METRIC_DEFINITIONS: MetricDefinition[] = [
  {
    name: 'Final Value / Concluded Value',
    getAuthoritative: (a) => a.getFinalValue(),
    getFormattedAuthoritative: (a) => a.getFormattedFinalValue(),
    type: 'currency',
    tolerance: 0.01,
    keywords: [
      'concluded', 'fair market value', 'final value', 'fmv',
      'valuation conclusion', 'concluded value', 'determined value',
      'estimated value', 'appraised value',
    ],
    // PRD-H US-009: Use snake_case to match buildSectionContents() keys in download-pdf route
    criticalSections: ['executive_summary', 'conclusion_of_value', 'valuation_reconciliation'],
  },
  {
    name: 'SDE Multiple',
    getAuthoritative: (a) => a.getSDEMultiple(),
    getFormattedAuthoritative: (a) => a.getFormattedSDEMultiple(),
    type: 'multiple',
    tolerance: 0.05,
    keywords: [
      'sde multiple', 'earnings multiple', 'sde multiplier',
      'multiple of sde', 'multiplied by', 'market multiple',
    ],
    criticalSections: ['executive_summary', 'market_approach_analysis'],
  },
  {
    name: 'Normalized SDE',
    getAuthoritative: (a) => a.getSDE('normalized'),
    getFormattedAuthoritative: (a) => a.getFormattedSDE('normalized'),
    type: 'currency',
    tolerance: 0.01,
    keywords: [
      'normalized sde', 'weighted sde', 'normalized earnings',
      'adjusted sde', 'discretionary earnings', 'seller',
    ],
    criticalSections: ['executive_summary', 'financial_analysis'],
  },
  {
    name: 'Revenue',
    getAuthoritative: (a) => a.getRevenue(),
    getFormattedAuthoritative: (a) => a.getFormattedRevenue(),
    type: 'currency',
    tolerance: 0.01,
    keywords: [
      'revenue', 'annual revenue', 'total revenue', 'sales',
      'gross revenue', 'top line',
    ],
    criticalSections: ['executive_summary', 'financial_analysis'],
  },
  // ============ APPROACH VALUES ============
  {
    name: 'Asset Approach Value',
    getAuthoritative: (a) => a.getApproachValue('asset'),
    getFormattedAuthoritative: (a) => a.getFormattedApproachValue('asset'),
    type: 'currency',
    tolerance: 0.01,
    keywords: [
      'asset approach', 'asset-based', 'adjusted net asset',
      'book value', 'net asset value', 'asset method',
    ],
    criticalSections: ['executive_summary', 'asset_approach_analysis', 'valuation_reconciliation'],
  },
  {
    name: 'Income Approach Value',
    getAuthoritative: (a) => a.getApproachValue('income'),
    getFormattedAuthoritative: (a) => a.getFormattedApproachValue('income'),
    type: 'currency',
    tolerance: 0.01,
    keywords: [
      'income approach', 'capitalization of earnings', 'discounted cash flow',
      'dcf', 'income method', 'earnings-based',
    ],
    criticalSections: ['executive_summary', 'income_approach_analysis', 'valuation_reconciliation'],
  },
  {
    name: 'Market Approach Value',
    getAuthoritative: (a) => a.getApproachValue('market'),
    getFormattedAuthoritative: (a) => a.getFormattedApproachValue('market'),
    type: 'currency',
    tolerance: 0.01,
    keywords: [
      'market approach', 'comparable', 'guideline', 'transaction',
      'market method', 'market-based', 'comp',
    ],
    criticalSections: ['executive_summary', 'market_approach_analysis', 'valuation_reconciliation'],
  },
  // ============ CAP RATE ============
  {
    name: 'Capitalization Rate',
    getAuthoritative: (a) => a.getCapRate() * 100, // Convert to percentage for matching
    getFormattedAuthoritative: (a) => a.getFormattedCapRate(),
    type: 'percentage',
    tolerance: 0.05, // 5% relative tolerance on the percentage value
    keywords: [
      'cap rate', 'capitalization rate', 'discount rate',
      'required return', 'rate of return',
    ],
    criticalSections: ['income_approach_analysis', 'valuation_reconciliation'],
  },
  // ============ VALUE RANGE ============
  {
    name: 'Value Range Low',
    getAuthoritative: (a) => a.getValueRangeLow(),
    getFormattedAuthoritative: (a) => a.getFormattedValueRange().low,
    type: 'currency',
    tolerance: 0.01,
    keywords: [
      'range', 'low end', 'minimum', 'floor', 'lower bound',
    ],
    criticalSections: ['executive_summary', 'valuation_reconciliation'],
  },
  {
    name: 'Value Range High',
    getAuthoritative: (a) => a.getValueRangeHigh(),
    getFormattedAuthoritative: (a) => a.getFormattedValueRange().high,
    type: 'currency',
    tolerance: 0.01,
    keywords: [
      'range', 'high end', 'maximum', 'ceiling', 'upper bound',
    ],
    criticalSections: ['executive_summary', 'valuation_reconciliation'],
  },
];

// ============ MAIN VALIDATOR ============

/**
 * Validate value consistency across report sections.
 *
 * Extracts financial values from each report section's text content and
 * compares them against authoritative values from the DataAccessor.
 *
 * @param accessor - DataAccessor providing authoritative values
 * @param sectionContents - Map of section name to section text content
 * @returns ConsistencyResult with checks, errors, and warnings
 */
export function validateValueConsistency(
  accessor: ValuationDataAccessor,
  sectionContents: Map<string, string>
): ConsistencyResult {
  const checks: ConsistencyCheck[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  const sectionNames = Array.from(sectionContents.keys());

  for (const sectionName of sectionNames) {
    const content = sectionContents.get(sectionName);
    if (!content || content.trim().length === 0) continue;

    for (const metric of METRIC_DEFINITIONS) {
      const authValue = metric.getAuthoritative(accessor);
      const formattedAuth = metric.getFormattedAuthoritative(accessor);

      // Skip metrics with zero/invalid authoritative values
      if (authValue === 0 || isNaN(authValue)) continue;

      // Extract values from section text based on metric type
      const extracted = metric.type === 'currency'
        ? extractCurrencyValues(content)
        : metric.type === 'percentage'
        ? extractPercentages(content)
        : extractMultiples(content);

      if (extracted.length === 0) continue;

      // Find values that are CONTEXTUALLY related to this metric:
      // 1. Appear near a metric keyword (within 150 chars)
      // 2. Are in a reasonable range (within 3x) of the authoritative value
      for (const candidate of extracted) {
        // Find the position of this value in the text
        const valuePosition = content.indexOf(candidate.raw);
        if (valuePosition === -1) continue;

        // PRD-H: Context-aware matching - only check values that appear near a metric keyword
        // This prevents flagging revenue ($6M) as a "Final Value mismatch" just because
        // "fair market value" appears elsewhere in the same section
        const nearKeyword = isNearKeyword(content, valuePosition, metric.keywords, 150);
        if (!nearKeyword) continue;

        // Also filter to values within a reasonable range (0.2x to 5x)
        // to catch potential mismatches without being too strict
        const ratio = candidate.value / authValue;
        if (ratio <= 0.2 || ratio >= 5) continue;

        const matched = valuesMatch(candidate.value, authValue, metric.tolerance);
        const context = getContext(content, candidate.raw);
        const isCriticalSection = metric.criticalSections?.includes(sectionName);

        const check: ConsistencyCheck = {
          metric: metric.name,
          authoritative: formattedAuth,
          found: candidate.raw,
          section: sectionName,
          passed: matched,
          tolerance: metric.tolerance,
          context,
        };

        checks.push(check);

        if (!matched) {
          const message = `${metric.name} mismatch in "${sectionName}": found ${candidate.raw} but authoritative value is ${formattedAuth}`;
          if (isCriticalSection) {
            errors.push(message);
          } else {
            warnings.push(message);
          }
        }
      }
    }
  }

  return {
    passed: errors.length === 0,
    checks,
    errors,
    warnings,
  };
}
