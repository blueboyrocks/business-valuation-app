/**
 * Related Party Transaction Detector
 * PRD-H: Robust PDF Extraction Pipeline
 *
 * Detects indicators of related party transactions that may require
 * arm's-length pricing review for business valuations.
 *
 * Key indicators:
 * - Loans to shareholders/officers/members/partners
 * - Loans from shareholders/officers/members/partners
 * - High rent expense (may be to related entity)
 * - Management fees to related entities
 * - Large "other" expense categories
 *
 * Why this matters:
 * - Related party transactions may not be at market rates
 * - Buyers may need to normalize these to arm's-length pricing
 * - Loans to shareholders are often distributions in disguise
 * - Above-market rent to owner-owned property is a form of compensation
 */

import { Stage2Output, RedFlagIndicators, StructuredFinancialData } from './types';

/**
 * Thresholds for flagging related party indicators
 */
const THRESHOLDS = {
  // Rent expense as % of revenue to flag for related party review
  HIGH_RENT_PERCENT: 0.10, // 10%

  // Management fee as % of revenue to flag
  HIGH_MGMT_FEE_PERCENT: 0.05, // 5%

  // Minimum amounts to flag (ignore de minimis)
  MIN_LOAN_TO_SHAREHOLDER: 1000,
  MIN_LOAN_FROM_SHAREHOLDER: 1000,
  MIN_RENT_EXPENSE: 10000,

  // Large "other" expense threshold (% of total expenses)
  HIGH_OTHER_EXPENSE_PERCENT: 0.15, // 15%
};

/**
 * Related party detection result
 */
export interface RelatedPartyDetectionResult {
  indicators: RelatedPartyIndicator[];
  redFlags: string[];
  warnings: string[];
  totalRelatedPartyAmount: number;
}

/**
 * Individual related party indicator
 */
export interface RelatedPartyIndicator {
  type: 'loan_to_shareholder' | 'loan_from_shareholder' | 'high_rent' | 'mgmt_fee' | 'other';
  amount: number;
  percentOfRevenue: number | null;
  description: string;
  severity: 'high' | 'medium' | 'low';
  recommendation: string;
}

/**
 * Detect loans to shareholders from balance sheet
 */
function detectLoansToShareholders(
  structuredData: StructuredFinancialData
): RelatedPartyIndicator | null {
  const balanceSheet = structuredData.balance_sheet;
  if (!balanceSheet) return null;

  // Use end of year balance for current assessment
  const loansToShareholders = balanceSheet.eoy_loans_to_shareholders ?? 0;

  if (loansToShareholders >= THRESHOLDS.MIN_LOAN_TO_SHAREHOLDER) {
    const revenue = structuredData.income_statement?.gross_receipts ?? 1;
    const percentOfRevenue = loansToShareholders / revenue;

    return {
      type: 'loan_to_shareholder',
      amount: loansToShareholders,
      percentOfRevenue,
      description: `Loans to shareholders: $${loansToShareholders.toLocaleString()}`,
      severity: loansToShareholders > 100000 ? 'high' : loansToShareholders > 25000 ? 'medium' : 'low',
      recommendation:
        'Review loan terms and repayment history. Large shareholder loans may indicate: ' +
        '(1) distributions disguised as loans to avoid tax, ' +
        '(2) cash flow issues, or ' +
        '(3) personal expenses paid by company. ' +
        'Buyer may require payoff at closing.',
    };
  }

  return null;
}

/**
 * Detect loans from shareholders from balance sheet
 */
function detectLoansFromShareholders(
  structuredData: StructuredFinancialData
): RelatedPartyIndicator | null {
  const balanceSheet = structuredData.balance_sheet;
  if (!balanceSheet) return null;

  // Use end of year balance for current assessment
  const loansFromShareholders = balanceSheet.eoy_loans_from_shareholders ?? 0;

  if (loansFromShareholders >= THRESHOLDS.MIN_LOAN_FROM_SHAREHOLDER) {
    const revenue = structuredData.income_statement?.gross_receipts ?? 1;
    const percentOfRevenue = loansFromShareholders / revenue;

    return {
      type: 'loan_from_shareholder',
      amount: loansFromShareholders,
      percentOfRevenue,
      description: `Loans from shareholders: $${loansFromShareholders.toLocaleString()}`,
      severity:
        loansFromShareholders > 100000 ? 'high' : loansFromShareholders > 25000 ? 'medium' : 'low',
      recommendation:
        'Review interest rate and terms. Related party debt may have: ' +
        '(1) below-market interest rates (interest add-back may be needed), ' +
        '(2) no fixed repayment schedule, or ' +
        '(3) subordination agreements. ' +
        'Buyer may require payoff or assumption at closing.',
    };
  }

  return null;
}

/**
 * Detect high rent expense that may indicate related party lease
 */
function detectHighRent(structuredData: StructuredFinancialData): RelatedPartyIndicator | null {
  const expenses = structuredData.expenses;
  if (!expenses) return null;

  const rent = expenses.rent ?? 0;
  const revenue = structuredData.income_statement?.gross_receipts ?? 1;
  const percentOfRevenue = rent / revenue;

  if (rent >= THRESHOLDS.MIN_RENT_EXPENSE && percentOfRevenue >= THRESHOLDS.HIGH_RENT_PERCENT) {
    return {
      type: 'high_rent',
      amount: rent,
      percentOfRevenue,
      description: `Rent expense: $${rent.toLocaleString()} (${(percentOfRevenue * 100).toFixed(
        1
      )}% of revenue)`,
      severity: percentOfRevenue > 0.2 ? 'high' : percentOfRevenue > 0.15 ? 'medium' : 'low',
      recommendation:
        'Rent exceeds 10% of revenue. Review for: ' +
        '(1) above-market rent to owner-controlled property (hidden compensation), ' +
        '(2) lease terms and renewal options, ' +
        '(3) market rent comparison. ' +
        'Normalize to market rent for SDE if above-market.',
    };
  }

  return null;
}

/**
 * Detect management fees that may indicate related party
 */
function detectManagementFees(
  structuredData: StructuredFinancialData,
  rawText: string
): RelatedPartyIndicator | null {
  // Check for management fee keywords in text
  const textLower = rawText.toLowerCase();
  const hasMgmtFeeKeywords =
    textLower.includes('management fee') ||
    textLower.includes('consulting fee') ||
    textLower.includes('advisory fee') ||
    textLower.includes('admin fee');

  if (!hasMgmtFeeKeywords) return null;

  // Try to find amount in "other deductions" or "professional fees"
  const expenses = structuredData.expenses;
  const otherDeductions = expenses?.other_deductions ?? 0;
  const revenue = structuredData.income_statement?.gross_receipts ?? 1;

  if (otherDeductions > 0) {
    const percentOfRevenue = otherDeductions / revenue;

    if (percentOfRevenue >= THRESHOLDS.HIGH_MGMT_FEE_PERCENT) {
      return {
        type: 'mgmt_fee',
        amount: otherDeductions,
        percentOfRevenue,
        description: `Possible management fee in other deductions: $${otherDeductions.toLocaleString()}`,
        severity: percentOfRevenue > 0.1 ? 'high' : 'medium',
        recommendation:
          'Management/consulting fees detected. Review for: ' +
          '(1) payments to owner-controlled entities, ' +
          '(2) services actually rendered, ' +
          '(3) market rate comparison. ' +
          'May be a form of owner compensation to add back.',
      };
    }
  }

  return null;
}

/**
 * Detect high "other" expenses that warrant investigation
 */
function detectHighOtherExpenses(
  structuredData: StructuredFinancialData
): RelatedPartyIndicator | null {
  const expenses = structuredData.expenses;
  if (!expenses) return null;

  const otherDeductions = expenses.other_deductions ?? 0;
  const totalDeductions = expenses.total_deductions ?? 1;
  const percentOfExpenses = otherDeductions / totalDeductions;

  if (percentOfExpenses >= THRESHOLDS.HIGH_OTHER_EXPENSE_PERCENT && otherDeductions > 25000) {
    const revenue = structuredData.income_statement?.gross_receipts ?? 1;
    const percentOfRevenue = otherDeductions / revenue;

    return {
      type: 'other',
      amount: otherDeductions,
      percentOfRevenue,
      description: `Other deductions: $${otherDeductions.toLocaleString()} (${(
        percentOfExpenses * 100
      ).toFixed(1)}% of total expenses)`,
      severity: percentOfExpenses > 0.25 ? 'high' : 'medium',
      recommendation:
        '"Other deductions" exceeds 15% of total expenses. Review for: ' +
        '(1) related party transactions hidden in catch-all category, ' +
        '(2) discretionary/personal expenses, ' +
        '(3) non-recurring items. ' +
        'Request detailed breakdown from seller.',
    };
  }

  return null;
}

/**
 * Main related party detection function
 *
 * @param stage2Output - The Stage 2 extraction output
 * @param rawText - Raw text from the document for keyword searching
 * @returns RelatedPartyDetectionResult with all detected indicators
 */
export function detectRelatedPartyIndicators(
  stage2Output: Stage2Output,
  rawText: string
): RelatedPartyDetectionResult {
  const indicators: RelatedPartyIndicator[] = [];
  const redFlags: string[] = [];
  const warnings: string[] = [];

  const structuredData = stage2Output.structured_data;
  if (!structuredData) {
    return {
      indicators: [],
      redFlags: [],
      warnings: ['No structured data available for related party analysis'],
      totalRelatedPartyAmount: 0,
    };
  }

  // Check for loans to shareholders
  const loansToResult = detectLoansToShareholders(structuredData);
  if (loansToResult) {
    indicators.push(loansToResult);
    if (loansToResult.severity === 'high') {
      redFlags.push(loansToResult.description);
    } else {
      warnings.push(loansToResult.description);
    }
  }

  // Check for loans from shareholders
  const loansFromResult = detectLoansFromShareholders(structuredData);
  if (loansFromResult) {
    indicators.push(loansFromResult);
    if (loansFromResult.severity === 'high') {
      redFlags.push(loansFromResult.description);
    } else {
      warnings.push(loansFromResult.description);
    }
  }

  // Check for high rent
  const highRentResult = detectHighRent(structuredData);
  if (highRentResult) {
    indicators.push(highRentResult);
    if (highRentResult.severity === 'high') {
      redFlags.push(highRentResult.description);
    } else {
      warnings.push(highRentResult.description);
    }
  }

  // Check for management fees
  const mgmtFeeResult = detectManagementFees(structuredData, rawText);
  if (mgmtFeeResult) {
    indicators.push(mgmtFeeResult);
    warnings.push(mgmtFeeResult.description);
  }

  // Check for high "other" expenses
  const otherExpensesResult = detectHighOtherExpenses(structuredData);
  if (otherExpensesResult) {
    indicators.push(otherExpensesResult);
    warnings.push(otherExpensesResult.description);
  }

  // Calculate total related party amount
  const totalRelatedPartyAmount = indicators.reduce((sum, ind) => sum + ind.amount, 0);

  // Add summary if significant related party activity
  if (indicators.length > 0) {
    warnings.push(
      `${indicators.length} related party indicator(s) detected totaling $${totalRelatedPartyAmount.toLocaleString()}. ` +
        'Review for arm\'s-length pricing and potential SDE adjustments.'
    );
  }

  return {
    indicators,
    redFlags,
    warnings,
    totalRelatedPartyAmount,
  };
}

/**
 * Update red flags with related party indicators
 */
export function mergeRelatedPartyRedFlags(
  existingRedFlags: RedFlagIndicators,
  detection: RelatedPartyDetectionResult
): RedFlagIndicators {
  // Only update loan flags if they were detected
  const loansToShareholder = detection.indicators.find((i) => i.type === 'loan_to_shareholder');
  const loansFromShareholder = detection.indicators.find((i) => i.type === 'loan_from_shareholder');

  return {
    ...existingRedFlags,
    has_loans_to_shareholders: loansToShareholder
      ? true
      : existingRedFlags.has_loans_to_shareholders,
    loans_to_shareholders_amount: loansToShareholder
      ? loansToShareholder.amount
      : existingRedFlags.loans_to_shareholders_amount,
  };
}

/**
 * Get SDE adjustments for related party items
 */
export function getRelatedPartySdeAdjustments(
  detection: RelatedPartyDetectionResult
): Array<{
  type: string;
  adjustment: number;
  direction: 'add' | 'subtract' | 'review';
  reason: string;
}> {
  const adjustments: Array<{
    type: string;
    adjustment: number;
    direction: 'add' | 'subtract' | 'review';
    reason: string;
  }> = [];

  for (const indicator of detection.indicators) {
    switch (indicator.type) {
      case 'loan_to_shareholder':
        adjustments.push({
          type: 'Loans to Shareholders',
          adjustment: indicator.amount,
          direction: 'review',
          reason:
            'Review whether these represent unpaid distributions. ' +
            'If non-collectable or forgivable, may indicate cash flow understated.',
        });
        break;

      case 'loan_from_shareholder':
        adjustments.push({
          type: 'Loans from Shareholders',
          adjustment: indicator.amount,
          direction: 'review',
          reason:
            'Review interest terms. If below-market rate, may need to adjust interest expense up to market.',
        });
        break;

      case 'high_rent':
        adjustments.push({
          type: 'Related Party Rent',
          adjustment: indicator.amount,
          direction: 'review',
          reason:
            'Compare to market rent. If above market, excess is owner compensation to add back. ' +
            'If related party lease continues post-sale, buyer needs to understand terms.',
        });
        break;

      case 'mgmt_fee':
        adjustments.push({
          type: 'Management Fees',
          adjustment: indicator.amount,
          direction: 'add',
          reason:
            'Management fees to related parties are typically a form of owner compensation. ' +
            'Add back unless buyer expects to continue paying similar fees.',
        });
        break;

      case 'other':
        adjustments.push({
          type: 'Other Expenses',
          adjustment: indicator.amount,
          direction: 'review',
          reason:
            'Large "other" category may contain related party items or personal expenses. ' +
            'Request detailed breakdown.',
        });
        break;
    }
  }

  return adjustments;
}
