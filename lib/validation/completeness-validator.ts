/**
 * Content Completeness Validator
 *
 * Checks that all required report sections are present with minimum word counts
 * and required elements. Ensures no report is missing critical sections.
 *
 * PRD-I: US-012
 */

// ============ TYPES ============

export interface SectionCheck {
  name: string;
  displayName: string;
  present: boolean;
  wordCount: number;
  minimumWords: number;
  meetsMinimum: boolean;
}

export interface CompletenessResult {
  passed: boolean;
  sections: SectionCheck[];
  errors: string[];
  warnings: string[];
  totalWordCount: number;
}

// ============ REQUIRED SECTIONS ============

interface RequiredSection {
  /** Key used for case-insensitive partial matching against section map keys */
  matchPatterns: string[];
  displayName: string;
  minimumWords: number;
}

const REQUIRED_SECTIONS: RequiredSection[] = [
  {
    matchPatterns: ['executive summary', 'executivesummary', 'exec summary'],
    displayName: 'Executive Summary',
    minimumWords: 400,
  },
  {
    matchPatterns: ['conclusion of value', 'conclusionofvalue', 'conclusion'],
    displayName: 'Conclusion of Value',
    minimumWords: 50,
  },
  {
    matchPatterns: ['company profile', 'companyprofile', 'company overview'],
    displayName: 'Company Profile',
    minimumWords: 200,
  },
  {
    matchPatterns: ['industry analysis', 'industryanalysis', 'industry overview'],
    displayName: 'Industry Analysis',
    minimumWords: 150,
  },
  {
    matchPatterns: ['financial analysis', 'financialanalysis', 'financial review'],
    displayName: 'Financial Analysis',
    minimumWords: 300,
  },
  {
    matchPatterns: ['asset approach', 'assetapproach', 'asset-based'],
    displayName: 'Asset Approach',
    minimumWords: 100,
  },
  {
    matchPatterns: ['income approach', 'incomeapproach', 'income-based'],
    displayName: 'Income Approach',
    minimumWords: 150,
  },
  {
    matchPatterns: ['market approach', 'marketapproach', 'market-based'],
    displayName: 'Market Approach',
    minimumWords: 200,
  },
  {
    matchPatterns: ['risk assessment', 'riskassessment', 'risk analysis'],
    displayName: 'Risk Assessment',
    minimumWords: 150,
  },
  {
    matchPatterns: [
      'assumptions and limiting conditions',
      'assumptionsandconditions',
      'assumptions',
      'limiting conditions',
    ],
    displayName: 'Assumptions and Limiting Conditions',
    minimumWords: 100,
  },
  {
    matchPatterns: [
      'sources and references',
      'sourcesandreferences',
      'sources',
      'references',
      'bibliography',
    ],
    displayName: 'Sources and References',
    minimumWords: 50,
  },
];

const TOTAL_MINIMUM_WORD_COUNT = 5000;

// ============ HELPERS ============

/**
 * Count words in a text string.
 * Strips HTML tags before counting.
 */
function countWords(text: string): number {
  // Strip HTML tags
  const stripped = text.replace(/<[^>]*>/g, ' ');
  // Split on whitespace, filter empty strings
  const words = stripped.split(/\s+/).filter(w => w.length > 0);
  return words.length;
}

/**
 * Check if a section key matches a required section by case-insensitive partial matching.
 * Handles camelCase keys (e.g., "executiveSummary") and display-name keys (e.g., "Executive Summary").
 */
function sectionMatches(sectionKey: string, patterns: string[]): boolean {
  const normalized = sectionKey.toLowerCase().replace(/[-_\s]/g, '');
  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i].toLowerCase().replace(/[-_\s]/g, '');
    if (normalized.includes(pattern) || pattern.includes(normalized)) {
      return true;
    }
  }
  return false;
}

/**
 * Find the content for a required section by matching against all section map keys.
 * Returns the matched key and content, or null if not found.
 */
function findSectionContent(
  sectionContents: Map<string, string>,
  requiredSection: RequiredSection
): { key: string; content: string } | null {
  const keys = Array.from(sectionContents.keys());
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (sectionMatches(key, requiredSection.matchPatterns)) {
      const content = sectionContents.get(key);
      if (content !== undefined) {
        return { key, content };
      }
    }
  }
  return null;
}

// ============ MAIN VALIDATOR ============

/**
 * Validate content completeness of report sections.
 *
 * Checks that all required sections are present and meet minimum word counts.
 * Missing required sections are errors (blocking).
 * Below-minimum word counts are warnings.
 *
 * @param sectionContents - Map of section name to section text/HTML content
 * @returns CompletenessResult with sections, errors, warnings, and total word count
 */
export function validateCompleteness(
  sectionContents: Map<string, string>
): CompletenessResult {
  const sections: SectionCheck[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  let totalWordCount = 0;

  // Count total words across all sections
  const allKeys = Array.from(sectionContents.keys());
  for (let i = 0; i < allKeys.length; i++) {
    const content = sectionContents.get(allKeys[i]);
    if (content) {
      totalWordCount += countWords(content);
    }
  }

  // Check each required section
  for (let i = 0; i < REQUIRED_SECTIONS.length; i++) {
    const required = REQUIRED_SECTIONS[i];
    const found = findSectionContent(sectionContents, required);

    if (!found || found.content.trim().length === 0) {
      // Missing section - blocking error
      sections.push({
        name: required.matchPatterns[0],
        displayName: required.displayName,
        present: false,
        wordCount: 0,
        minimumWords: required.minimumWords,
        meetsMinimum: false,
      });
      errors.push(`Missing required section: ${required.displayName}`);
      continue;
    }

    const wordCount = countWords(found.content);
    const meetsMinimum = wordCount >= required.minimumWords;

    sections.push({
      name: found.key,
      displayName: required.displayName,
      present: true,
      wordCount,
      minimumWords: required.minimumWords,
      meetsMinimum,
    });

    if (!meetsMinimum) {
      warnings.push(
        `${required.displayName} has ${wordCount} words (minimum: ${required.minimumWords})`
      );
    }
  }

  // Check total word count
  if (totalWordCount < TOTAL_MINIMUM_WORD_COUNT) {
    warnings.push(
      `Total word count is ${totalWordCount} (minimum recommended: ${TOTAL_MINIMUM_WORD_COUNT})`
    );
  }

  return {
    passed: errors.length === 0,
    sections,
    errors,
    warnings,
    totalWordCount,
  };
}
