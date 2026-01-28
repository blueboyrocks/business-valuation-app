/**
 * Narrative Data Extractor
 *
 * When structured data is missing but narratives contain actual numbers,
 * this utility extracts values from narrative text as a fallback.
 *
 * This is a safety net for when the AI properly writes narratives but
 * fails to populate the structured JSON fields.
 */

export interface ExtractedNarrativeData {
  revenue?: number;
  netIncome?: number;
  sde?: number;
  weightedSde?: number;
  normalizedSde?: number;
  ebitda?: number;
  totalAssets?: number;
  totalLiabilities?: number;
  equity?: number;
  bookEquity?: number;
  adjustedNetAssetValue?: number;
  incomeApproachValue?: number;
  marketApproachValue?: number;
  concludedValue?: number;
  cash?: number;
  accountsReceivable?: number;
  workingCapital?: number;
}

/**
 * Parse a currency value from text (handles $1,234,567 and $1.2M formats)
 */
function parseCurrency(match: string): number {
  // Remove $ and commas
  let cleanValue = match.replace(/[$,]/g, '');

  // Check for million/M suffix
  const isMillion = /million|M\b/i.test(match);
  const isBillion = /billion|B\b/i.test(match);

  // Extract numeric part
  const numMatch = cleanValue.match(/([\d.]+)/);
  if (!numMatch) return NaN;

  let value = parseFloat(numMatch[1]);

  if (isBillion) value *= 1_000_000_000;
  else if (isMillion) value *= 1_000_000;

  return value;
}

/**
 * Extract financial data from narrative text
 */
export function extractDataFromNarratives(
  narratives: Record<string, string | { content: string } | undefined>
): ExtractedNarrativeData {
  const result: ExtractedNarrativeData = {};

  // Combine all narrative text
  const allText = Object.values(narratives)
    .map(n => {
      if (!n) return '';
      if (typeof n === 'string') return n;
      return n.content || '';
    })
    .join(' ');

  if (!allText) return result;

  // Define extraction patterns with multiple variations
  const patterns: Array<{
    key: keyof ExtractedNarrativeData;
    patterns: RegExp[];
  }> = [
    {
      key: 'revenue',
      patterns: [
        /(?:revenue|gross receipts?|total revenue|annual revenue)\s+(?:of\s+)?\$?([\d,]+(?:\.\d+)?)\s*(?:million|M)?/gi,
        /\$?([\d,]+(?:\.\d+)?)\s*(?:million|M)?\s+(?:in\s+)?(?:revenue|gross receipts?)/gi,
      ],
    },
    {
      key: 'sde',
      patterns: [
        /(?:SDE|seller'?s?\s+discretionary\s+earnings?)\s+(?:of\s+)?\$?([\d,]+(?:\.\d+)?)/gi,
        /\$?([\d,]+(?:\.\d+)?)\s+(?:SDE|seller'?s?\s+discretionary)/gi,
      ],
    },
    {
      key: 'weightedSde',
      patterns: [
        /weighted\s+(?:average\s+)?SDE\s+(?:of\s+)?\$?([\d,]+(?:\.\d+)?)/gi,
      ],
    },
    {
      key: 'normalizedSde',
      patterns: [
        /normalized\s+SDE\s+(?:of\s+)?\$?([\d,]+(?:\.\d+)?)/gi,
      ],
    },
    {
      key: 'ebitda',
      patterns: [
        /EBITDA\s+(?:of\s+)?\$?([\d,]+(?:\.\d+)?)/gi,
        /\$?([\d,]+(?:\.\d+)?)\s+EBITDA/gi,
      ],
    },
    {
      key: 'bookEquity',
      patterns: [
        /book\s+(?:value\s+(?:of\s+)?)?equity\s+(?:of\s+)?\$?([\d,]+(?:\.\d+)?)/gi,
        /book\s+equity\s+(?:of\s+)?\$?([\d,]+(?:\.\d+)?)/gi,
      ],
    },
    {
      key: 'adjustedNetAssetValue',
      patterns: [
        /adjusted\s+net\s+asset\s+value\s+(?:of\s+)?\$?([\d,]+(?:\.\d+)?)/gi,
        /asset\s+approach.*?(?:value|indicates?)\s+(?:of\s+)?\$?([\d,]+(?:\.\d+)?)/gi,
        /(?:value|floor)\s+(?:of\s+)?\$?([\d,]+(?:\.\d+)?)\s*(?:million|M)?/gi,
      ],
    },
    {
      key: 'incomeApproachValue',
      patterns: [
        /(?:income\s+approach|capitalization).*?(?:value|indicates?)\s+(?:of\s+)?\$?([\d,]+(?:\.\d+)?)/gi,
        /(?:total\s+)?indicated\s+(?:operating\s+)?value\s+(?:of\s+|to\s+)?\$?([\d,]+(?:\.\d+)?)/gi,
      ],
    },
    {
      key: 'marketApproachValue',
      patterns: [
        /market\s+approach.*?(?:value|indicates?)\s+(?:of\s+)?\$?([\d,]+(?:\.\d+)?)/gi,
        /indicated\s+value\s+(?:of\s+)?\$?([\d,]+(?:\.\d+)?)/gi,
      ],
    },
    {
      key: 'cash',
      patterns: [
        /cash\s+(?:and\s+cash\s+equivalents?\s+)?(?:of\s+)?\$?([\d,]+(?:\.\d+)?)/gi,
      ],
    },
    {
      key: 'accountsReceivable',
      patterns: [
        /(?:accounts?\s+)?receivable[s]?\s+(?:of\s+)?\$?([\d,]+(?:\.\d+)?)/gi,
      ],
    },
    {
      key: 'totalLiabilities',
      patterns: [
        /(?:total\s+)?liabilities\s+(?:of\s+)?\$?([\d,]+(?:\.\d+)?)/gi,
        /\$?([\d,]+(?:\.\d+)?)\s+(?:in\s+)?(?:recorded\s+)?liabilities/gi,
      ],
    },
    {
      key: 'workingCapital',
      patterns: [
        /(?:excess\s+)?working\s+capital\s+(?:of\s+)?\$?([\d,]+(?:\.\d+)?)/gi,
      ],
    },
  ];

  // Extract each value
  for (const { key, patterns: regexes } of patterns) {
    for (const regex of regexes) {
      // Use exec() in a loop instead of matchAll() for broader compatibility
      let match: RegExpExecArray | null;
      // Reset regex lastIndex to ensure fresh matching
      regex.lastIndex = 0;
      while ((match = regex.exec(allText)) !== null) {
        const fullMatch = match[0];
        const value = parseCurrency(fullMatch);

        if (!isNaN(value) && value > 0) {
          // Prefer larger values for approach valuations (avoid picking up small references)
          if (key.includes('Value') || key.includes('revenue')) {
            const existing = result[key];
            if (!existing || value > existing) {
              result[key] = value;
            }
          } else {
            // For other fields, take first match
            if (!result[key]) {
              result[key] = value;
            }
          }
        }
      }
    }
  }

  return result;
}

/**
 * Reconcile structured data with narrative-extracted data.
 *
 * IMPORTANT: This function only FILLS MISSING data (null, undefined, or 0).
 * It NEVER overwrites existing calculation engine values. The data flow is
 * one-directional: Calculation Engine -> DataStore -> Narratives.
 * Narratives receive values but never modify them.
 *
 * @param structuredData - The structured report data (may already have calculation engine values)
 * @param narratives - Narrative sections to extract fallback values from
 * @param options - Optional configuration
 * @param options.hasCalculationEngine - If true, skip reconciliation for fields that the
 *   calculation engine is authoritative over (approach values, concluded value, revenue).
 *   This prevents narrative-extracted values from ever overwriting deterministic calculations.
 */
export function reconcileWithNarratives(
  structuredData: any,
  narratives: Record<string, string | { content: string } | undefined>,
  options?: { hasCalculationEngine?: boolean }
): any {
  const hasCalcEngine = options?.hasCalculationEngine ?? false;
  const narrativeData = extractDataFromNarratives(narratives);
  const reconciled = { ...structuredData };

  // Fields that the calculation engine is authoritative over.
  // When the calc engine has run, these fields must NEVER be overwritten by narrative data.
  const calculationEngineFields = new Set([
    'asset_approach_value',
    'income_approach_value',
    'market_approach_value',
    'annual_revenue',
    'valuation_amount',
  ]);

  // Map narrative fields to structured data fields
  const mappings: Array<{
    narrativeKey: keyof ExtractedNarrativeData;
    structuredKey: string;
    minValue?: number;
  }> = [
    { narrativeKey: 'adjustedNetAssetValue', structuredKey: 'asset_approach_value', minValue: 100000 },
    { narrativeKey: 'incomeApproachValue', structuredKey: 'income_approach_value', minValue: 100000 },
    { narrativeKey: 'marketApproachValue', structuredKey: 'market_approach_value', minValue: 100000 },
    { narrativeKey: 'revenue', structuredKey: 'annual_revenue', minValue: 10000 },
    { narrativeKey: 'cash', structuredKey: 'cash' },
    { narrativeKey: 'accountsReceivable', structuredKey: 'accounts_receivable' },
  ];

  let reconciliationsMade = 0;

  for (const { narrativeKey, structuredKey, minValue } of mappings) {
    // GUARD: Never overwrite calculation engine authoritative fields
    if (hasCalcEngine && calculationEngineFields.has(structuredKey)) {
      continue;
    }

    const currentValue = reconciled[structuredKey];
    const narrativeValue = narrativeData[narrativeKey];

    // Only fill MISSING data (null, undefined, or 0) - never overwrite existing values
    if ((!currentValue || currentValue === 0) && narrativeValue && narrativeValue > 0) {
      // Apply minimum value filter if specified
      if (minValue && narrativeValue < minValue) continue;

      console.log(`[RECONCILE] Filling missing value for ${structuredKey}: $${narrativeValue.toLocaleString()}`);
      reconciled[structuredKey] = narrativeValue;
      reconciliationsMade++;
    }
  }

  // Calculate concluded value ONLY if missing AND no calculation engine
  if (!hasCalcEngine && (!reconciled.valuation_amount || reconciled.valuation_amount === 0)) {
    const asset = reconciled.asset_approach_value || 0;
    const income = reconciled.income_approach_value || 0;
    const market = reconciled.market_approach_value || 0;

    if (asset > 0 || income > 0 || market > 0) {
      // Use 20/40/40 weighting (or adjust based on available approaches)
      const weights = { asset: 0.20, income: 0.40, market: 0.40 };
      const totalWeight = (asset > 0 ? weights.asset : 0) +
                          (income > 0 ? weights.income : 0) +
                          (market > 0 ? weights.market : 0);

      const weightedValue = (
        (asset > 0 ? asset * weights.asset : 0) +
        (income > 0 ? income * weights.income : 0) +
        (market > 0 ? market * weights.market : 0)
      ) / totalWeight;

      reconciled.valuation_amount = Math.round(weightedValue);
      console.log(`[RECONCILE] Calculated concluded value: $${reconciled.valuation_amount.toLocaleString()}`);
      reconciliationsMade++;
    }
  }

  if (reconciliationsMade > 0) {
    console.log(`[RECONCILE] Made ${reconciliationsMade} reconciliation(s) from narrative data`);
  } else {
    console.log(`[RECONCILE] No reconciliations needed - all values already present`);
  }

  return reconciled;
}
