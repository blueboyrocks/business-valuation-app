/**
 * Narrative Value Injector
 *
 * Post-processes narrative text to replace AI-generated values with authoritative
 * calculation engine values. This ensures narratives display the same values as
 * the calculation tables and prevents value inconsistencies in the final report.
 *
 * PRD-H: Data Integrity - Value consistency between narratives and calculations
 */

import type { ValuationDataAccessor } from './data-accessor';

export interface NarrativeValueInjectionResult {
  content: string;
  replacements: {
    original: string;
    replacement: string;
    type: 'concluded_value' | 'sde' | 'ebitda' | 'revenue' | 'asset_value' | 'income_value' | 'market_value' | 'cap_rate' | 'value_range';
  }[];
  hadReplacements: boolean;
}

/**
 * Format a number as currency for matching in text
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Generate currency patterns that might appear in narrative text
 * e.g., "$4,200,000", "$4.2 million", "$4.2M", "4.2 million dollars"
 */
function generateCurrencyPatterns(value: number): RegExp[] {
  const patterns: RegExp[] = [];

  // Standard currency format: $X,XXX,XXX
  // Match values within 50% of target (to catch rounded/incorrect values)
  const lowBound = Math.floor(value * 0.5);
  const highBound = Math.ceil(value * 1.5);

  // Match dollar amounts with commas (e.g., $4,200,000)
  patterns.push(/\$[\d,]+(?:\.\d{2})?/g);

  // Match "X.X million" or "X million" patterns
  patterns.push(/\$?[\d.]+\s*million(?:\s+dollars)?/gi);

  // Match "XM" patterns (e.g., "$4.2M")
  patterns.push(/\$[\d.]+M/gi);

  return patterns;
}

/**
 * Parse a currency string to a number
 */
function parseCurrency(str: string): number | null {
  // Remove currency symbols, commas, and whitespace
  let cleaned = str.replace(/[$,\s]/g, '').toLowerCase();

  // Handle "million" suffix
  if (cleaned.includes('million')) {
    cleaned = cleaned.replace(/million(?:\s*dollars)?/i, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num * 1_000_000;
  }

  // Handle "M" suffix
  if (cleaned.endsWith('m')) {
    cleaned = cleaned.slice(0, -1);
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num * 1_000_000;
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Check if a parsed value is significantly different from the authoritative value
 * "Significantly different" means more than 5% variance
 */
function isSignificantlyDifferent(parsed: number, authoritative: number): boolean {
  if (authoritative === 0) return parsed !== 0;
  const variance = Math.abs(parsed - authoritative) / authoritative;
  return variance > 0.05; // 5% threshold
}

/**
 * Inject authoritative values into a narrative section.
 *
 * This function scans the narrative for currency values and replaces
 * any that are significantly different from the authoritative calculation
 * engine values.
 *
 * @param content - The narrative text content
 * @param accessor - DataAccessor providing authoritative values
 * @param sectionType - Type of section to help target replacements
 */
export function injectValuesIntoNarrative(
  content: string,
  accessor: ValuationDataAccessor,
  sectionType: 'executive_summary' | 'valuation_synthesis' | 'asset_approach' | 'income_approach' | 'market_approach' | 'other'
): NarrativeValueInjectionResult {
  if (!content || content.length === 0) {
    return { content, replacements: [], hadReplacements: false };
  }

  const replacements: NarrativeValueInjectionResult['replacements'] = [];
  let modifiedContent = content;

  // Get authoritative values from accessor
  const authValues = {
    concluded_value: accessor.getFinalValue(),
    sde: accessor.getWeightedSDE(),
    ebitda: accessor.getWeightedEBITDA(),
    revenue: accessor.getRevenue(),
    asset_value: accessor.getApproachValue('asset'),
    income_value: accessor.getApproachValue('income'),
    market_value: accessor.getApproachValue('market'),
  };

  // Key phrases that indicate which value is being discussed
  const valueContexts: { pattern: RegExp; type: keyof typeof authValues }[] = [
    // Concluded/Fair Market Value patterns
    { pattern: /(?:fair\s+market\s+value|concluded\s+value|valuation|worth|valued\s+at|business\s+value)[^.]*?(\$[\d,]+(?:\.\d{2})?|\$?[\d.]+\s*million|\$[\d.]+M)/gi, type: 'concluded_value' },
    { pattern: /(\$[\d,]+(?:\.\d{2})?|\$?[\d.]+\s*million|\$[\d.]+M)[^.]*?(?:fair\s+market\s+value|concluded\s+value)/gi, type: 'concluded_value' },

    // SDE patterns
    { pattern: /(?:seller['']?s?\s+discretionary\s+earnings?|SDE)[^.]*?(\$[\d,]+(?:\.\d{2})?|\$?[\d.]+\s*million|\$[\d.]+M)/gi, type: 'sde' },
    { pattern: /(\$[\d,]+(?:\.\d{2})?|\$?[\d.]+\s*million|\$[\d.]+M)[^.]*?(?:SDE|discretionary\s+earnings)/gi, type: 'sde' },

    // Revenue patterns
    { pattern: /(?:annual\s+revenue|total\s+revenue|gross\s+revenue)[^.]*?(\$[\d,]+(?:\.\d{2})?|\$?[\d.]+\s*million|\$[\d.]+M)/gi, type: 'revenue' },

    // Asset approach patterns - extended with more variations
    { pattern: /(?:asset\s+approach|adjusted\s+net\s+asset|asset-based|asset\s+method|net\s+asset\s+value)[^.]*?(\$[\d,]+(?:\.\d{2})?|\$?[\d.]+\s*million|\$[\d.]+M)/gi, type: 'asset_value' },
    { pattern: /(\$[\d,]+(?:\.\d{2})?|\$?[\d.]+\s*million|\$[\d.]+M)[^.]*?(?:asset\s+approach|asset\s+method|asset-based)/gi, type: 'asset_value' },

    // Income approach patterns - extended with more variations
    { pattern: /(?:income\s+approach|capitalization\s+of\s+earnings?|capitalized\s+earnings?|income\s+method|earnings-based)[^.]*?(\$[\d,]+(?:\.\d{2})?|\$?[\d.]+\s*million|\$[\d.]+M)/gi, type: 'income_value' },
    { pattern: /(\$[\d,]+(?:\.\d{2})?|\$?[\d.]+\s*million|\$[\d.]+M)[^.]*?(?:income\s+approach|income\s+method)/gi, type: 'income_value' },

    // Market approach patterns - extended with more variations
    { pattern: /(?:market\s+approach|guideline|comparable\s+transaction|market\s+method|market-based|comp)[^.]*?(\$[\d,]+(?:\.\d{2})?|\$?[\d.]+\s*million|\$[\d.]+M)/gi, type: 'market_value' },
    { pattern: /(\$[\d,]+(?:\.\d{2})?|\$?[\d.]+\s*million|\$[\d.]+M)[^.]*?(?:market\s+approach|market\s+method|market-based)/gi, type: 'market_value' },
  ];

  // For executive summary, specifically look for concluded value and approach value mentions
  if (sectionType === 'executive_summary') {
    // Define context patterns for different value types
    const execSummaryContexts: { keywords: string[]; type: keyof typeof authValues }[] = [
      {
        keywords: ['fair market value', 'concluded value', 'valuation of', 'valued at', 'worth', 'business value', 'opinion of value'],
        type: 'concluded_value',
      },
      {
        keywords: ['asset approach', 'asset-based', 'adjusted net asset', 'asset method', 'net asset value'],
        type: 'asset_value',
      },
      {
        keywords: ['income approach', 'capitalization of earnings', 'capitalized earnings', 'income method', 'earnings-based'],
        type: 'income_value',
      },
      {
        keywords: ['market approach', 'guideline', 'comparable', 'market method', 'market-based', 'comp transaction'],
        type: 'market_value',
      },
    ];

    // Find all currency values and replace ones that don't match the expected value
    const currencyPattern = /\$[\d,]+(?:\.\d{2})?|\$?[\d.]+\s*million(?:\s+dollars)?|\$[\d.]+M/gi;
    let match: RegExpExecArray | null;

    while ((match = currencyPattern.exec(modifiedContent)) !== null) {
      const original = match[0];
      const parsed = parseCurrency(original);

      if (parsed !== null && parsed > 100000) { // Only consider values > $100k
        // Check context - what type of value is this near?
        const contextStart = Math.max(0, match.index - 100);
        const contextEnd = Math.min(modifiedContent.length, match.index + original.length + 100);
        const context = modifiedContent.slice(contextStart, contextEnd).toLowerCase();

        for (const ctx of execSummaryContexts) {
          const hasKeyword = ctx.keywords.some(kw => context.includes(kw));
          if (hasKeyword) {
            const authValue = authValues[ctx.type];
            // Skip if authoritative value is 0 (e.g., asset approach not used)
            if (authValue === 0) continue;

            if (isSignificantlyDifferent(parsed, authValue)) {
              const replacement = formatCurrency(authValue);
              modifiedContent = modifiedContent.slice(0, match.index) + replacement + modifiedContent.slice(match.index + original.length);
              replacements.push({
                original,
                replacement,
                type: ctx.type,
              });

              // Reset the regex after modification
              currencyPattern.lastIndex = match.index + replacement.length;
              break; // Don't process this value for other contexts
            }
          }
        }
      }
    }
  }

  // For valuation synthesis, check all three approach values
  if (sectionType === 'valuation_synthesis') {
    for (const ctx of valueContexts) {
      let match: RegExpExecArray | null;
      const pattern = new RegExp(ctx.pattern.source, ctx.pattern.flags);

      while ((match = pattern.exec(modifiedContent)) !== null) {
        // Find the currency value in the match
        const currencyMatch = match[0].match(/\$[\d,]+(?:\.\d{2})?|\$?[\d.]+\s*million|\$[\d.]+M/i);
        if (!currencyMatch) continue;

        const original = currencyMatch[0];
        const parsed = parseCurrency(original);
        const authValue = authValues[ctx.type];

        if (parsed !== null && authValue > 0 && isSignificantlyDifferent(parsed, authValue)) {
          const replacement = formatCurrency(authValue);
          const fullMatchStart = match.index;
          const currencyStart = fullMatchStart + match[0].indexOf(original);

          modifiedContent = modifiedContent.slice(0, currencyStart) + replacement + modifiedContent.slice(currencyStart + original.length);
          replacements.push({
            original,
            replacement,
            type: ctx.type,
          });

          // Reset pattern after modification
          pattern.lastIndex = currencyStart + replacement.length;
        }
      }
    }
  }

  return {
    content: modifiedContent,
    replacements,
    hadReplacements: replacements.length > 0,
  };
}

/**
 * Process all narratives in a report, injecting authoritative values
 */
export function injectValuesIntoAllNarratives(
  reportData: Record<string, unknown>,
  accessor: ValuationDataAccessor
): { reportData: Record<string, unknown>; totalReplacements: number; details: string[] } {
  const details: string[] = [];
  let totalReplacements = 0;

  const narrativeFields: { key: string; type: Parameters<typeof injectValuesIntoNarrative>[2] }[] = [
    { key: 'executive_summary', type: 'executive_summary' },
    { key: 'valuation_reconciliation', type: 'valuation_synthesis' },
    { key: 'asset_approach_analysis', type: 'asset_approach' },
    { key: 'income_approach_analysis', type: 'income_approach' },
    { key: 'market_approach_analysis', type: 'market_approach' },
    { key: 'financial_analysis', type: 'other' },
    { key: 'company_profile', type: 'other' },
    { key: 'risk_assessment', type: 'other' },
    { key: 'industry_analysis', type: 'other' },
  ];

  for (const { key, type } of narrativeFields) {
    const content = reportData[key];
    if (typeof content === 'string' && content.length > 0) {
      const result = injectValuesIntoNarrative(content, accessor, type);
      if (result.hadReplacements) {
        reportData[key] = result.content;
        totalReplacements += result.replacements.length;
        for (const r of result.replacements) {
          details.push(`[${key}] Replaced ${r.type}: "${r.original}" → "${r.replacement}"`);
        }
      }
    }
  }

  // Also check nested narratives object
  const narratives = reportData.narratives as Record<string, unknown> | undefined;
  if (narratives) {
    for (const { key, type } of narrativeFields) {
      // Map flat key to nested key format
      const nestedKey = key === 'executive_summary' ? 'executive_summary' :
                        key === 'valuation_reconciliation' ? 'valuation_synthesis' :
                        key === 'asset_approach_analysis' ? 'asset_approach_narrative' :
                        key === 'income_approach_analysis' ? 'income_approach_narrative' :
                        key === 'market_approach_analysis' ? 'market_approach_narrative' :
                        key === 'company_profile' ? 'company_overview' : key;

      const content = narratives[nestedKey];
      if (typeof content === 'string' && content.length > 0) {
        const result = injectValuesIntoNarrative(content, accessor, type);
        if (result.hadReplacements) {
          narratives[nestedKey] = result.content;
          totalReplacements += result.replacements.length;
          for (const r of result.replacements) {
            details.push(`[narratives.${nestedKey}] Replaced ${r.type}: "${r.original}" → "${r.replacement}"`);
          }
        }
      }
    }
  }

  return { reportData, totalReplacements, details };
}
