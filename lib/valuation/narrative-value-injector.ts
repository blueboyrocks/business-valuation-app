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
    type: 'concluded_value' | 'sde' | 'ebitda' | 'revenue' | 'asset_value' | 'income_value' | 'market_value' | 'cap_rate' | 'value_range' | 'sde_multiple';
  }[];
  foundValues: number;
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
 * Parse a currency string to a number
 * Handles formats: $1,234,567, $1.2M, $1.2 million, 1.2 million dollars
 */
function parseCurrency(str: string): number | null {
  // Remove currency symbols, commas, and whitespace
  let cleaned = str.replace(/[$,\s]/g, '').toLowerCase();

  // Handle "million dollars" suffix first (before "million")
  if (cleaned.includes('milliondollars')) {
    cleaned = cleaned.replace(/milliondollars/i, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num * 1_000_000;
  }

  // Handle "million" suffix
  if (cleaned.includes('million')) {
    cleaned = cleaned.replace(/million/i, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num * 1_000_000;
  }

  // Handle "M" suffix (e.g., $4.2M)
  if (cleaned.endsWith('m')) {
    cleaned = cleaned.slice(0, -1);
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num * 1_000_000;
  }

  // Handle "K" suffix (e.g., $500K)
  if (cleaned.endsWith('k')) {
    cleaned = cleaned.slice(0, -1);
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num * 1_000;
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Parse a multiple string to a number (e.g., "4.9x" -> 4.9, "4.9 times" -> 4.9)
 */
function parseMultiple(str: string): number | null {
  // Remove whitespace and lowercase
  const cleaned = str.replace(/\s/g, '').toLowerCase();

  // Handle "Xx" format (e.g., "4.9x", "2.5X")
  if (cleaned.endsWith('x')) {
    const num = parseFloat(cleaned.slice(0, -1));
    return isNaN(num) ? null : num;
  }

  // Handle "X times" format
  if (cleaned.includes('times')) {
    const num = parseFloat(cleaned.replace('times', ''));
    return isNaN(num) ? null : num;
  }

  return null;
}

/**
 * Format a multiple as "X.Xx" string
 */
function formatMultiple(value: number): string {
  return `${value.toFixed(1)}x`;
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
    console.log(`[INJECTOR] Section: ${sectionType}, Found: 0 values, Replaced: 0`);
    return { content, replacements: [], foundValues: 0, hadReplacements: false };
  }

  const replacements: NarrativeValueInjectionResult['replacements'] = [];
  let modifiedContent = content;
  let foundValues = 0;

  // Type for currency values that can be looked up and used in replacements
  type CurrencyValueType = 'concluded_value' | 'sde' | 'ebitda' | 'revenue' | 'asset_value' | 'income_value' | 'market_value';

  // Get authoritative currency values from accessor
  const authValues: Record<CurrencyValueType, number> = {
    concluded_value: accessor.getFinalValue(),
    sde: accessor.getWeightedSDE(),
    ebitda: accessor.getWeightedEBITDA(),
    revenue: accessor.getRevenue(),
    asset_value: accessor.getApproachValue('asset'),
    income_value: accessor.getApproachValue('income'),
    market_value: accessor.getApproachValue('market'),
  };

  // Additional authoritative values for ranges and multiples
  // Fallback: if value range is 0, calculate from final value using standard 15% range
  const finalValue = accessor.getFinalValue();
  let valueRangeLow = accessor.getValueRangeLow();
  let valueRangeHigh = accessor.getValueRangeHigh();
  if ((valueRangeLow === 0 || valueRangeHigh === 0) && finalValue > 0) {
    valueRangeLow = Math.round(finalValue * 0.85 / 1000) * 1000;
    valueRangeHigh = Math.round(finalValue * 1.15 / 1000) * 1000;
    console.log(`[INJECTOR] Value range fallback: calculated ${valueRangeLow} - ${valueRangeHigh} from final value ${finalValue}`);
  }
  const sdeMultiple = accessor.getSDEMultiple();

  // Key phrases that indicate which value is being discussed
  const valueContexts: { pattern: RegExp; type: CurrencyValueType }[] = [
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
    const execSummaryContexts: { keywords: string[]; type: CurrencyValueType }[] = [
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
    // Enhanced pattern to match all currency formats: $1,234,567, $1.2M, $1.2 million, 1.2 million dollars
    const currencyPattern = /\$[\d,]+(?:\.\d{2})?|\$?[\d.]+\s*million(?:\s+dollars)?|[\d.]+\s*million\s+dollars|\$[\d.]+[MK]/gi;
    let match: RegExpExecArray | null;

    while ((match = currencyPattern.exec(modifiedContent)) !== null) {
      const original = match[0];
      const parsed = parseCurrency(original);

      if (parsed !== null && parsed > 100000) { // Only consider values > $100k
        foundValues++;
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

  // For valuation synthesis and other sections, check all three approach values
  if (sectionType === 'valuation_synthesis' || sectionType === 'other') {
    for (const ctx of valueContexts) {
      let match: RegExpExecArray | null;
      const pattern = new RegExp(ctx.pattern.source, ctx.pattern.flags);

      while ((match = pattern.exec(modifiedContent)) !== null) {
        // Find the currency value in the match
        const currencyMatch = match[0].match(/\$[\d,]+(?:\.\d{2})?|\$?[\d.]+\s*million(?:\s+dollars)?|\$[\d.]+[MK]/i);
        if (!currencyMatch) continue;

        foundValues++;
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

  // ======= VALUE RANGE REPLACEMENT =======
  // Patterns like "$3.8M to $4.6M", "$3.8 million to $4.6 million", "between $X and $Y"
  // Improved pattern to match more currency formats
  const currencyValuePattern = `\\$[\\d,]+(?:\\.\\d{2})?|\\$?[\\d.]+\\s*million(?:\\s+dollars)?|\\$[\\d.]+[MK]|[\\d.]+\\s*million\\s+dollars`;
  const rangePatterns = [
    // SIMPLE: "$X,XXX,XXX to $X,XXX,XXX" - most direct match for K-Force format
    /(\$[\d,]+)\s+to\s+(\$[\d,]+)/gi,
    // "$X to $Y" or "$X - $Y"
    new RegExp(`(${currencyValuePattern})\\s*(?:to|-|through)\\s*(${currencyValuePattern})`, 'gi'),
    // "between $X and $Y"
    new RegExp(`between\\s+(${currencyValuePattern})\\s+and\\s+(${currencyValuePattern})`, 'gi'),
    // "from $X to $Y"
    new RegExp(`from\\s+(${currencyValuePattern})\\s+to\\s+(${currencyValuePattern})`, 'gi'),
    // "range of $X to $Y"
    new RegExp(`range\\s+of\\s+(${currencyValuePattern})\\s*(?:to|-|through)\\s*(${currencyValuePattern})`, 'gi'),
  ];

  // Only process value ranges if we have authoritative low/high values
  console.log(`[INJECTOR] Value range check: low=${valueRangeLow}, high=${valueRangeHigh}, will process=${valueRangeLow > 0 && valueRangeHigh > 0}`);
  if (valueRangeLow > 0 && valueRangeHigh > 0) {
    // Test first pattern for debugging
    const testPattern = /(\$[\d,]+)\s*(?:to|-)\s*(\$[\d,]+)/gi;
    const testMatch = testPattern.exec(modifiedContent);
    console.log(`[INJECTOR] Test pattern match: ${testMatch ? testMatch[0] : 'none found'}`);

    for (let i = 0; i < rangePatterns.length; i++) {
      const rangePattern = rangePatterns[i];
      let rangeMatch: RegExpExecArray | null;
      while ((rangeMatch = rangePattern.exec(modifiedContent)) !== null) {
        foundValues += 2; // Two values in a range
        const fullMatch = rangeMatch[0];
        const lowStr = rangeMatch[1];
        const highStr = rangeMatch[2];
        console.log(`[INJECTOR] Range pattern ${i} matched: "${fullMatch}" (low="${lowStr}", high="${highStr}")`);
        console.log(`[INJECTOR] Authoritative range: ${valueRangeLow} - ${valueRangeHigh}`);
        const parsedLow = parseCurrency(lowStr);
        const parsedHigh = parseCurrency(highStr);

        // Check if range values are significantly different from authoritative values
        if (
          parsedLow !== null &&
          parsedHigh !== null &&
          (isSignificantlyDifferent(parsedLow, valueRangeLow) ||
            isSignificantlyDifferent(parsedHigh, valueRangeHigh))
        ) {
          // Construct replacement preserving the format/connector
          const connector = fullMatch.includes('between')
            ? ` and `
            : fullMatch.match(/\s+to\s+/)
              ? ' to '
              : fullMatch.match(/\s*-\s*/)
                ? ' - '
                : fullMatch.match(/\s+through\s+/)
                  ? ' through '
                  : ' to ';

          const prefix = fullMatch.toLowerCase().startsWith('between')
            ? 'between '
            : fullMatch.toLowerCase().startsWith('from')
              ? 'from '
              : fullMatch.toLowerCase().match(/^range\s+of/)
                ? 'range of '
                : '';

          const replacement = `${prefix}${formatCurrency(valueRangeLow)}${connector}${formatCurrency(valueRangeHigh)}`;
          console.log(`[INJECTOR] REPLACING range: "${fullMatch}" → "${replacement}"`);
          modifiedContent =
            modifiedContent.slice(0, rangeMatch.index) +
            replacement +
            modifiedContent.slice(rangeMatch.index + fullMatch.length);

          replacements.push({
            original: fullMatch,
            replacement,
            type: 'value_range',
          });

          // Reset pattern after modification
          rangePattern.lastIndex = rangeMatch.index + replacement.length;
        }
      }
    }
  }

  // ======= SDE MULTIPLE REPLACEMENT =======
  // Patterns like "4.9x", "4.9 times", "multiple of 4.9x", "SDE multiple of 4.9x"
  if (sdeMultiple > 0) {
    const multiplePatterns = [
      // "X.Xx" or "X times" near SDE context
      /(?:SDE|seller['']?s?\s+discretionary\s+earnings?)\s+(?:multiple\s+(?:of\s+)?)?(\d+\.?\d*)\s*(?:x|times)/gi,
      // "multiple of X.Xx" or "X.Xx multiple"
      /multiple\s+of\s+(\d+\.?\d*)\s*(?:x|times)/gi,
      /(\d+\.?\d*)\s*(?:x|times)\s+(?:SDE\s+)?multiple/gi,
      // Stand-alone multiples near valuation context
      /(?:trading|valued|value)\s+at\s+(\d+\.?\d*)\s*(?:x|times)/gi,
    ];

    for (const multiplePattern of multiplePatterns) {
      let multipleMatch: RegExpExecArray | null;
      while ((multipleMatch = multiplePattern.exec(modifiedContent)) !== null) {
        foundValues++;
        const fullMatch = multipleMatch[0];
        const multipleStr = multipleMatch[1];
        const parsed = parseMultiple(`${multipleStr}x`);

        if (parsed !== null && isSignificantlyDifferent(parsed, sdeMultiple)) {
          // Preserve the original format (x vs times)
          const useTimes = fullMatch.toLowerCase().includes('times');
          const replacement = fullMatch.replace(
            new RegExp(`${multipleStr}\\s*(?:x|times)`, 'i'),
            useTimes ? `${sdeMultiple.toFixed(1)} times` : formatMultiple(sdeMultiple)
          );

          modifiedContent =
            modifiedContent.slice(0, multipleMatch.index) +
            replacement +
            modifiedContent.slice(multipleMatch.index + fullMatch.length);

          replacements.push({
            original: fullMatch,
            replacement,
            type: 'sde_multiple',
          });

          // Reset pattern after modification
          multiplePattern.lastIndex = multipleMatch.index + replacement.length;
        }
      }
    }
  }

  console.log(`[INJECTOR] Section: ${sectionType}, Found: ${foundValues} values, Replaced: ${replacements.length}`);

  return {
    content: modifiedContent,
    replacements,
    foundValues,
    hadReplacements: replacements.length > 0,
  };
}

/**
 * Process all narratives in a report, injecting authoritative values
 */
export function injectValuesIntoAllNarratives(
  reportData: Record<string, unknown>,
  accessor: ValuationDataAccessor
): { reportData: Record<string, unknown>; totalReplacements: number; totalFound: number; details: string[] } {
  console.log(`[INJECTOR] Starting narrative value injection...`);
  console.log(`[INJECTOR] Accessor values: finalValue=${accessor.getFinalValue()}, valueRangeLow=${accessor.getValueRangeLow()}, valueRangeHigh=${accessor.getValueRangeHigh()}`);
  console.log(`[INJECTOR] reportData keys: ${Object.keys(reportData).join(', ')}`);
  const details: string[] = [];
  let totalReplacements = 0;
  let totalFound = 0;

  const narrativeFields: { key: string; type: Parameters<typeof injectValuesIntoNarrative>[2] }[] = [
    { key: 'executive_summary', type: 'executive_summary' },
    { key: 'valuation_reconciliation', type: 'valuation_synthesis' },
    { key: 'asset_approach_analysis', type: 'asset_approach' },
    { key: 'income_approach_analysis', type: 'income_approach' },
    { key: 'market_approach_analysis', type: 'market_approach' },
    { key: 'financial_analysis', type: 'other' },
    // PRD-H: Do NOT process company_profile through value injection.
    // Company Profile describes business operations and should NOT contain
    // valuation approach values. Processing it causes false replacements where
    // words like "market position" trigger market_value pattern matching.
    // { key: 'company_profile', type: 'other' },
    { key: 'risk_assessment', type: 'other' },
    { key: 'industry_analysis', type: 'other' },
  ];

  for (const { key, type } of narrativeFields) {
    const content = reportData[key];
    console.log(`[INJECTOR] Checking key "${key}": type=${typeof content}, length=${typeof content === 'string' ? content.length : 'N/A'}`);
    if (typeof content === 'string' && content.length > 0) {
      // Log a snippet for debugging
      if (key === 'executive_summary') {
        const snippet = content.slice(0, 200);
        console.log(`[INJECTOR] executive_summary snippet: ${snippet}...`);
        // Check for the problematic range
        if (content.includes('3,800,000') || content.includes('4,600,000')) {
          console.log(`[INJECTOR] FOUND problematic values in executive_summary`);
        }
      }
      const result = injectValuesIntoNarrative(content, accessor, type);
      totalFound += result.foundValues;
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
        totalFound += result.foundValues;
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

  console.log(`[INJECTOR] Complete: Found ${totalFound} values, Replaced ${totalReplacements}`);
  return { reportData, totalReplacements, totalFound, details };
}
