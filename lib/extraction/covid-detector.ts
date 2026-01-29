/**
 * COVID Adjustment Detector
 * PRD-H: Robust PDF Extraction Pipeline
 *
 * Detects COVID-era relief items that should be normalized out of earnings.
 * These are NON-RECURRING items that inflate income during 2020-2024.
 *
 * Key items to detect:
 * - PPP loan forgiveness (Paycheck Protection Program)
 * - EIDL advances/grants (Economic Injury Disaster Loan)
 * - ERC/ERTC (Employee Retention Credit/Tax Credit)
 * - SBA disaster grants
 * - State/local COVID relief grants
 *
 * These items should be SUBTRACTED from normalized earnings because:
 * - They are one-time government relief, not recurring revenue
 * - They artificially inflate reported income
 * - A buyer would not expect these to continue post-acquisition
 */

import { Stage2Output, CovidAdjustments, StructuredFinancialData } from './types';

/**
 * COVID-related keywords to search for in extracted text
 */
const COVID_KEYWORDS = {
  ppp: [
    'ppp',
    'paycheck protection',
    'paycheck protection program',
    'ppp loan',
    'ppp forgiveness',
    'ppp loan forgiveness',
    'forgiveness of ppp',
    'sba ppp',
    'ppp grant',
  ],
  eidl: [
    'eidl',
    'economic injury',
    'economic injury disaster',
    'eidl advance',
    'eidl grant',
    'disaster loan',
    'sba eidl',
    'eidl forgiveness',
  ],
  erc: [
    'erc',
    'ertc',
    'employee retention',
    'employee retention credit',
    'employee retention tax credit',
    'retention credit',
    'covid credit',
    'payroll tax credit',
  ],
  other_relief: [
    'covid relief',
    'covid grant',
    'coronavirus relief',
    'pandemic relief',
    'cares act',
    'arpa',
    'american rescue',
    'shuttered venue',
    'restaurant revitalization',
    'state covid',
    'local covid',
    'covid assistance',
  ],
};

/**
 * Tax years where COVID relief items are most common
 */
const COVID_RELEVANT_YEARS = ['2020', '2021', '2022', '2023', '2024'];

/**
 * Typical PPP loan amounts by business size (for reasonableness checks)
 */
const PPP_TYPICAL_RANGES = {
  small: { min: 10000, max: 150000 },     // Small businesses
  medium: { min: 150000, max: 500000 },   // Medium businesses
  large: { min: 500000, max: 10000000 },  // Larger businesses
};

/**
 * Result of COVID detection analysis
 */
export interface CovidDetectionResult {
  adjustments: CovidAdjustments;
  warnings: string[];
  totalAdjustment: number;
  isCovidRelevantYear: boolean;
}

/**
 * Search text for COVID-related keywords
 */
function findCovidKeywords(
  text: string,
  category: keyof typeof COVID_KEYWORDS
): { found: boolean; matches: string[]; confidence: 'high' | 'medium' | 'low' } {
  const textLower = text.toLowerCase();
  const keywords = COVID_KEYWORDS[category];
  const matches: string[] = [];

  for (const keyword of keywords) {
    if (textLower.includes(keyword.toLowerCase())) {
      matches.push(keyword);
    }
  }

  const found = matches.length > 0;
  let confidence: 'high' | 'medium' | 'low' = 'low';

  if (matches.length >= 3) {
    confidence = 'high';
  } else if (matches.length >= 1) {
    confidence = 'medium';
  }

  return { found, matches, confidence };
}

/**
 * Attempt to extract a dollar amount near COVID keywords
 */
function extractAmountNearKeyword(
  text: string,
  keyword: string
): number | null {
  const textLower = text.toLowerCase();
  const keywordIndex = textLower.indexOf(keyword.toLowerCase());

  if (keywordIndex === -1) return null;

  // Look for dollar amounts within 100 characters of the keyword
  const searchStart = Math.max(0, keywordIndex - 50);
  const searchEnd = Math.min(text.length, keywordIndex + keyword.length + 100);
  const searchText = text.substring(searchStart, searchEnd);

  // Match dollar amounts: $1,234,567.89 or 1,234,567 or 1234567
  const amountPattern = /\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+(?:\.\d{2})?)/g;
  const matches = searchText.match(amountPattern);

  if (matches && matches.length > 0) {
    // Return the largest amount found (most likely to be the relief amount)
    const amounts = matches.map((m) => {
      const cleaned = m.replace(/[$,\s]/g, '');
      return parseFloat(cleaned);
    });

    return Math.max(...amounts);
  }

  return null;
}

/**
 * Check if "other income" field contains COVID relief
 */
function analyzeOtherIncome(
  structuredData: StructuredFinancialData,
  rawText: string
): { amount: number; source: string } | null {
  // Check if other_income is unusually high for COVID years
  const otherIncome = structuredData.income_statement?.other_income ?? 0;

  if (otherIncome <= 0) return null;

  // Check if raw text mentions COVID near "other income"
  const otherIncomeSection = rawText.toLowerCase();
  const hasCovidMention =
    findCovidKeywords(otherIncomeSection, 'ppp').found ||
    findCovidKeywords(otherIncomeSection, 'eidl').found ||
    findCovidKeywords(otherIncomeSection, 'erc').found ||
    findCovidKeywords(otherIncomeSection, 'other_relief').found;

  if (hasCovidMention && otherIncome > 10000) {
    return {
      amount: otherIncome,
      source: 'other_income_line_with_covid_keywords',
    };
  }

  return null;
}

/**
 * Main COVID adjustment detection function
 *
 * @param stage2Output - The Stage 2 extraction output
 * @param rawText - Raw text from the document for keyword searching
 * @param taxYear - The tax year of the document
 * @returns CovidDetectionResult with all detected adjustments
 */
export function detectCovidAdjustments(
  stage2Output: Stage2Output,
  rawText: string,
  taxYear: string | null
): CovidDetectionResult {
  const warnings: string[] = [];
  const isCovidRelevantYear = taxYear ? COVID_RELEVANT_YEARS.includes(taxYear) : false;
  const effectiveTaxYear = taxYear || 'unknown';

  // Initialize adjustments with zeros (required by type)
  const adjustments: CovidAdjustments = {
    ppp_loan_forgiveness: 0,
    eidl_advances: 0,
    employee_retention_credit: 0,
    tax_year: effectiveTaxYear,
  };

  // If not a COVID-relevant year, return early
  if (!isCovidRelevantYear) {
    return {
      adjustments,
      warnings: [],
      totalAdjustment: 0,
      isCovidRelevantYear: false,
    };
  }

  // Search for PPP forgiveness
  const pppResult = findCovidKeywords(rawText, 'ppp');
  if (pppResult.found) {
    // Try to extract amount
    for (const keyword of pppResult.matches) {
      const amount = extractAmountNearKeyword(rawText, keyword);
      if (amount && amount > 5000) {
        // Minimum threshold
        adjustments.ppp_loan_forgiveness = amount;
        warnings.push(
          `PPP loan forgiveness detected: $${amount.toLocaleString()}. ` +
            `This is a NON-RECURRING item that should be SUBTRACTED from normalized earnings.`
        );
        break;
      }
    }

    // If no amount found but keywords present, flag it
    if (adjustments.ppp_loan_forgiveness === 0) {
      warnings.push(
        `PPP-related keywords found but amount could not be extracted. ` +
          `Review 'Other Income' line for PPP forgiveness amount.`
      );
    }
  }

  // Search for EIDL advances
  const eidlResult = findCovidKeywords(rawText, 'eidl');
  if (eidlResult.found) {
    for (const keyword of eidlResult.matches) {
      const amount = extractAmountNearKeyword(rawText, keyword);
      if (amount && amount > 1000) {
        adjustments.eidl_advances = amount;
        warnings.push(
          `EIDL advance/grant detected: $${amount.toLocaleString()}. ` +
            `This is a NON-RECURRING item that should be SUBTRACTED from normalized earnings.`
        );
        break;
      }
    }
  }

  // Search for Employee Retention Credit
  const ercResult = findCovidKeywords(rawText, 'erc');
  if (ercResult.found) {
    for (const keyword of ercResult.matches) {
      const amount = extractAmountNearKeyword(rawText, keyword);
      if (amount && amount > 5000) {
        adjustments.employee_retention_credit = amount;
        warnings.push(
          `Employee Retention Credit detected: $${amount.toLocaleString()}. ` +
            `This is a NON-RECURRING item that should be SUBTRACTED from normalized earnings.`
        );
        break;
      }
    }
  }

  // Search for other COVID relief (adds to ERC since no separate field)
  const otherResult = findCovidKeywords(rawText, 'other_relief');
  if (otherResult.found && adjustments.employee_retention_credit === 0) {
    for (const keyword of otherResult.matches) {
      const amount = extractAmountNearKeyword(rawText, keyword);
      if (amount && amount > 1000) {
        // Store in ERC field as it's the most flexible COVID field
        adjustments.employee_retention_credit = amount;
        warnings.push(
          `Other COVID relief detected (${keyword}): $${amount.toLocaleString()}. ` +
            `Review for non-recurring adjustment.`
        );
        break;
      }
    }
  }

  // Check structured data for suspicious "other income"
  if (stage2Output.structured_data) {
    const otherIncomeResult = analyzeOtherIncome(stage2Output.structured_data, rawText);
    if (otherIncomeResult && adjustments.ppp_loan_forgiveness === 0 && adjustments.eidl_advances === 0) {
      warnings.push(
        `Elevated 'Other Income' of $${otherIncomeResult.amount.toLocaleString()} detected ` +
          `in COVID-relevant year (${taxYear}). Review for PPP, EIDL, or other relief.`
      );
    }
  }

  // Calculate total adjustment
  const totalAdjustment =
    adjustments.ppp_loan_forgiveness +
    adjustments.eidl_advances +
    adjustments.employee_retention_credit;

  // Add summary warning if adjustments found
  if (totalAdjustment > 0) {
    warnings.push(
      `TOTAL COVID ADJUSTMENTS: $${totalAdjustment.toLocaleString()} should be ` +
        `SUBTRACTED from normalized earnings for SDE/EBITDA calculation.`
    );
  }

  return {
    adjustments,
    warnings,
    totalAdjustment,
    isCovidRelevantYear,
  };
}

/**
 * Check if a specific field likely contains COVID relief
 * Useful for targeted field-level analysis
 */
export function isLikelyCovidRelief(
  fieldValue: number,
  fieldName: string,
  taxYear: string | null
): boolean {
  // Only check COVID-relevant years
  if (!taxYear || !COVID_RELEVANT_YEARS.includes(taxYear)) {
    return false;
  }

  // Check field names that commonly contain COVID relief
  const fieldNameLower = fieldName.toLowerCase();
  const covidRelatedFields = [
    'other_income',
    'other_revenue',
    'miscellaneous_income',
    'grant_income',
    'forgiveness',
    'relief',
    'ppp',
    'eidl',
    'erc',
  ];

  const isCovidField = covidRelatedFields.some((f) => fieldNameLower.includes(f));

  // Flag if field name suggests COVID and amount is significant
  return isCovidField && fieldValue > 10000;
}

/**
 * Get recommended SDE adjustment for COVID items
 */
export function getCovidSdeAdjustment(adjustments: CovidAdjustments): {
  adjustment: number;
  direction: 'subtract';
  reason: string;
} {
  const total =
    adjustments.ppp_loan_forgiveness +
    adjustments.eidl_advances +
    adjustments.employee_retention_credit;

  return {
    adjustment: total,
    direction: 'subtract',
    reason:
      'COVID-era relief items (PPP, EIDL, ERC) are non-recurring government assistance ' +
      'that artificially inflated income during 2020-2024. These should be subtracted ' +
      'from normalized earnings because a buyer would not expect these to continue.',
  };
}
