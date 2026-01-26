/**
 * Industry Validation Gate (PRD-B)
 *
 * Pre-PDF-generation gate that scans all narrative text for wrong-industry
 * keywords. If any blocked keyword is found in any section, the gate fails
 * and returns detailed violation information including the surrounding text
 * snippet for debugging.
 */

import { findBlockedKeywordsInText } from './industry-keywords';

// ============ TYPES ============

export interface IndustryViolation {
  /** Name of the narrative section where the violation was found */
  section: string;
  /** The blocked keyword that was detected */
  keyword: string;
  /** Text snippet surrounding the keyword (±50 characters) for context */
  snippet: string;
}

export interface IndustryGateResult {
  /** Whether the gate passed (true = no violations found) */
  passed: boolean;
  /** List of all violations found across all sections */
  violations: IndustryViolation[];
}

// ============ HELPERS ============

/**
 * Extract a snippet of text surrounding a keyword match.
 * Returns ±50 characters around the first occurrence of the keyword,
 * with ellipsis markers when the snippet is truncated.
 */
function extractSnippet(content: string, keyword: string, radius: number = 50): string {
  const lowerContent = content.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  const index = lowerContent.indexOf(lowerKeyword);

  if (index === -1) {
    return '';
  }

  const start = Math.max(0, index - radius);
  const end = Math.min(content.length, index + keyword.length + radius);

  let snippet = content.slice(start, end);

  if (start > 0) {
    snippet = '...' + snippet;
  }
  if (end < content.length) {
    snippet = snippet + '...';
  }

  return snippet;
}

// ============ GATE FUNCTION ============

/**
 * Run the industry validation gate against a set of narrative sections.
 *
 * Scans every section's content for blocked keywords associated with the
 * given NAICS code. Returns a result indicating whether the gate passed
 * and a list of all violations found.
 *
 * @param naicsCode - The NAICS industry code to validate against
 * @param sections  - Array of narrative sections with name and content
 * @returns Gate result with pass/fail status and violation details
 */
export function runIndustryGate(
  naicsCode: string,
  sections: { name: string; content: string }[]
): IndustryGateResult {
  const violations: IndustryViolation[] = [];

  for (const section of sections) {
    const blockedKeywords = findBlockedKeywordsInText(naicsCode, section.content);

    for (const keyword of blockedKeywords) {
      const snippet = extractSnippet(section.content, keyword);

      violations.push({
        section: section.name,
        keyword,
        snippet,
      });
    }
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}

/**
 * Alias for {@link runIndustryGate}.
 *
 * Validates that all narrative sections comply with the industry keyword
 * rules for the given NAICS code.
 */
export const validateIndustryCompliance = runIndustryGate;
