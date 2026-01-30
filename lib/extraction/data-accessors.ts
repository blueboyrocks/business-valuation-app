/**
 * Data Accessors for FinalExtractionOutput
 *
 * Helper functions to safely access extraction data with entity-type awareness.
 * All functions handle null/undefined gracefully with ?? 0 defaults.
 */

import {
  FinalExtractionOutput,
  YearFinancialData,
  isSCorp,
  isPartnership,
  isSoleProp,
  CovidAdjustments,
} from './types';

// ============================================================================
// Year Data Accessors
// ============================================================================

/**
 * Get the most recent year's financial data.
 */
export function getLatestYearData(
  extraction: FinalExtractionOutput
): YearFinancialData | null {
  const years = getYearsSorted(extraction);
  if (years.length === 0) return null;
  return extraction.financial_data[years[0]] ?? null;
}

/**
 * Get financial data for a specific year.
 */
export function getYearData(
  extraction: FinalExtractionOutput,
  year: number
): YearFinancialData | null {
  return extraction.financial_data[year] ?? null;
}

/**
 * Get available years sorted descending (most recent first).
 */
export function getYearsSorted(extraction: FinalExtractionOutput): number[] {
  return [...extraction.available_years].sort((a, b) => b - a);
}

/**
 * Get the number of years of financial data available.
 */
export function getYearCount(extraction: FinalExtractionOutput): number {
  return extraction.available_years.length;
}

// ============================================================================
// Owner Compensation Accessors (Entity-Type Aware)
// ============================================================================

/**
 * Get owner compensation for a specific year.
 *
 * Entity-type aware:
 * - S-Corp: Uses compensation_of_officers from expenses
 * - Partnership: Uses guaranteed_payments from owner_info
 * - Sole Prop: Uses net_income (owner IS the business)
 * - C-Corp/Other: Uses compensation_of_officers from expenses
 */
export function getOwnerCompensation(
  extraction: FinalExtractionOutput,
  year: number
): number {
  const yearData = getYearData(extraction, year);
  if (!yearData) return 0;

  if (isSCorp(extraction)) {
    // S-Corp: Officer compensation is the owner comp
    return yearData.expenses.compensation_of_officers ?? 0;
  }

  if (isPartnership(extraction)) {
    // Partnership: Guaranteed payments to partners
    return yearData.owner_info.guaranteed_payments ?? 0;
  }

  if (isSoleProp(extraction)) {
    // Sole Prop: Net income IS the owner's compensation (Schedule C)
    return yearData.income_statement.net_income ?? 0;
  }

  // Default to officer compensation
  return yearData.expenses.compensation_of_officers ?? 0;
}

/**
 * Get owner compensation for the most recent year.
 */
export function getLatestOwnerCompensation(
  extraction: FinalExtractionOutput
): number {
  const years = getYearsSorted(extraction);
  if (years.length === 0) return 0;
  return getOwnerCompensation(extraction, years[0]);
}

// ============================================================================
// Depreciation & Section 179 Accessors
// ============================================================================

/**
 * Get total depreciation add-back for a year.
 * Includes both regular depreciation AND Section 179 deduction.
 */
export function getDepreciationAddBack(
  extraction: FinalExtractionOutput,
  year: number
): number {
  const yearData = getYearData(extraction, year);
  if (!yearData) return 0;

  const regularDepreciation = yearData.expenses.depreciation ?? 0;
  const section179 = yearData.schedule_k.section_179_deduction ?? 0;

  return regularDepreciation + section179;
}

/**
 * Get Section 179 deduction only.
 */
export function getSection179(
  extraction: FinalExtractionOutput,
  year: number
): number {
  const yearData = getYearData(extraction, year);
  if (!yearData) return 0;
  return yearData.schedule_k.section_179_deduction ?? 0;
}

/**
 * Get regular depreciation only (excludes Section 179).
 */
export function getRegularDepreciation(
  extraction: FinalExtractionOutput,
  year: number
): number {
  const yearData = getYearData(extraction, year);
  if (!yearData) return 0;
  return yearData.expenses.depreciation ?? 0;
}

// ============================================================================
// COVID Adjustment Accessors
// ============================================================================

/**
 * Get COVID-related adjustments for a year.
 */
export function getCovidAdjustments(
  extraction: FinalExtractionOutput,
  year: number
): CovidAdjustments {
  const yearData = getYearData(extraction, year);
  if (!yearData) {
    return {
      ppp_loan: 0,
      ppp_forgiveness: 0,
      ppp_loan_balance: 0,
      eidl_loan_balance: 0,
      eidl_grant: 0,
      erc_credit: 0,
    };
  }
  return yearData.covid_adjustments;
}

/**
 * Get total COVID-related income to subtract for normalization.
 */
export function getTotalCovidAdjustments(
  extraction: FinalExtractionOutput,
  year: number
): number {
  const covid = getCovidAdjustments(extraction, year);
  return (
    (covid.ppp_forgiveness ?? 0) +
    (covid.eidl_grant ?? 0) +
    (covid.erc_credit ?? 0)
  );
}

// ============================================================================
// Revenue & Income Accessors
// ============================================================================

/**
 * Get gross revenue for a year.
 */
export function getRevenue(
  extraction: FinalExtractionOutput,
  year: number
): number {
  const yearData = getYearData(extraction, year);
  if (!yearData) return 0;
  return yearData.income_statement.gross_receipts_sales ?? 0;
}

/**
 * Get net income for a year.
 */
export function getNetIncome(
  extraction: FinalExtractionOutput,
  year: number
): number {
  const yearData = getYearData(extraction, year);
  if (!yearData) return 0;
  return yearData.income_statement.net_income ?? 0;
}

/**
 * Get cost of goods sold for a year.
 */
export function getCOGS(
  extraction: FinalExtractionOutput,
  year: number
): number {
  const yearData = getYearData(extraction, year);
  if (!yearData) return 0;
  return yearData.income_statement.cost_of_goods_sold ?? 0;
}

/**
 * Get gross profit for a year.
 */
export function getGrossProfit(
  extraction: FinalExtractionOutput,
  year: number
): number {
  const yearData = getYearData(extraction, year);
  if (!yearData) return 0;
  return yearData.income_statement.gross_profit ?? 0;
}

// ============================================================================
// Expense Accessors
// ============================================================================

/**
 * Get interest expense for a year.
 */
export function getInterestExpense(
  extraction: FinalExtractionOutput,
  year: number
): number {
  const yearData = getYearData(extraction, year);
  if (!yearData) return 0;
  return yearData.expenses.interest ?? 0;
}

/**
 * Get total deductions for a year.
 */
export function getTotalDeductions(
  extraction: FinalExtractionOutput,
  year: number
): number {
  const yearData = getYearData(extraction, year);
  if (!yearData) return 0;
  return yearData.income_statement.total_deductions ?? 0;
}

/**
 * Get rent expense for a year.
 */
export function getRentExpense(
  extraction: FinalExtractionOutput,
  year: number
): number {
  const yearData = getYearData(extraction, year);
  if (!yearData) return 0;
  return yearData.expenses.rents ?? 0;
}

// ============================================================================
// Balance Sheet Accessors
// ============================================================================

/**
 * Get total assets for a year.
 */
export function getTotalAssets(
  extraction: FinalExtractionOutput,
  year: number
): number {
  const yearData = getYearData(extraction, year);
  if (!yearData) return 0;
  return yearData.balance_sheet.total_assets ?? 0;
}

/**
 * Get total liabilities for a year.
 */
export function getTotalLiabilities(
  extraction: FinalExtractionOutput,
  year: number
): number {
  const yearData = getYearData(extraction, year);
  if (!yearData) return 0;
  return yearData.balance_sheet.total_liabilities ?? 0;
}

/**
 * Get total equity for a year.
 */
export function getTotalEquity(
  extraction: FinalExtractionOutput,
  year: number
): number {
  const yearData = getYearData(extraction, year);
  if (!yearData) return 0;
  return yearData.balance_sheet.total_equity ?? 0;
}

/**
 * Get book value (total assets - total liabilities) for a year.
 */
export function getBookValue(
  extraction: FinalExtractionOutput,
  year: number
): number {
  return getTotalAssets(extraction, year) - getTotalLiabilities(extraction, year);
}

/**
 * Get cash for a year.
 */
export function getCash(
  extraction: FinalExtractionOutput,
  year: number
): number {
  const yearData = getYearData(extraction, year);
  if (!yearData) return 0;
  return yearData.balance_sheet.cash ?? 0;
}

/**
 * Get accounts receivable for a year.
 */
export function getAccountsReceivable(
  extraction: FinalExtractionOutput,
  year: number
): number {
  const yearData = getYearData(extraction, year);
  if (!yearData) return 0;
  return yearData.balance_sheet.accounts_receivable ?? 0;
}

/**
 * Get inventory for a year.
 */
export function getInventory(
  extraction: FinalExtractionOutput,
  year: number
): number {
  const yearData = getYearData(extraction, year);
  if (!yearData) return 0;
  return yearData.balance_sheet.inventory ?? 0;
}

// ============================================================================
// Red Flags Accessors
// ============================================================================

/**
 * Check if loans to shareholders exist (a red flag for S-Corps).
 */
export function hasLoansToShareholders(
  extraction: FinalExtractionOutput
): boolean {
  return extraction.red_flags.loans_to_shareholders ?? false;
}

/**
 * Get all red flag notes.
 */
export function getRedFlagNotes(extraction: FinalExtractionOutput): string[] {
  return extraction.red_flags.notes ?? [];
}

/**
 * Count total red flags.
 */
export function countRedFlags(extraction: FinalExtractionOutput): number {
  const flags = extraction.red_flags;
  let count = 0;
  if (flags.loans_to_shareholders) count++;
  if (flags.declining_revenue) count++;
  if (flags.negative_equity) count++;
  if (flags.high_owner_compensation) count++;
  if (flags.related_party_transactions) count++;
  if (flags.unusual_expenses) count++;
  if (flags.missing_schedules) count++;
  return count;
}

// ============================================================================
// SDE (Seller's Discretionary Earnings) Calculation Accessors
// ============================================================================

/**
 * Categories of SDE add-backs.
 */
export type SdeAddBackCategory =
  | 'owner_compensation'
  | 'depreciation'
  | 'section_179'
  | 'amortization'
  | 'interest'
  | 'capital_gains'
  | 'covid_adjustments';

/**
 * Individual SDE add-back item with metadata.
 */
export interface SdeAddBackItem {
  category: SdeAddBackCategory;
  description: string;
  amount: number;
  source?: string;
}

/**
 * Result of SDE add-back calculation.
 */
export interface SdeAddBacksResult {
  total: number;
  items: SdeAddBackItem[];
}

/**
 * Get all SDE add-backs for a year, categorized.
 *
 * SDE add-backs include:
 * - Owner compensation (entity-type aware)
 * - Depreciation
 * - Section 179 deduction
 * - Amortization (via depletion field)
 * - Interest expense
 * - Non-recurring capital gains/losses
 * - COVID adjustments (normalized out)
 */
export function getAllSdeAddBacks(
  extraction: FinalExtractionOutput,
  year: number
): SdeAddBacksResult {
  const yearData = getYearData(extraction, year);
  if (!yearData) {
    return { total: 0, items: [] };
  }

  const items: SdeAddBackItem[] = [];

  // 1. Owner Compensation (entity-type aware)
  const ownerComp = getOwnerCompensation(extraction, year);
  if (ownerComp > 0) {
    let description = 'Owner Compensation';
    let source = 'Tax Return';

    if (isSCorp(extraction)) {
      description = 'Officer Compensation (S-Corp)';
      source = 'Form 1120-S, Line 7';
    } else if (isPartnership(extraction)) {
      description = 'Guaranteed Payments to Partners';
      source = 'Form 1065, Schedule K';
    } else if (isSoleProp(extraction)) {
      description = 'Net Profit (Owner Draw)';
      source = 'Schedule C, Line 31';
    }

    items.push({
      category: 'owner_compensation',
      description,
      amount: ownerComp,
      source,
    });
  }

  // 2. Regular Depreciation
  const depreciation = yearData.expenses.depreciation ?? 0;
  if (depreciation > 0) {
    items.push({
      category: 'depreciation',
      description: 'Depreciation',
      amount: depreciation,
      source: 'Tax Return, Depreciation Schedule',
    });
  }

  // 3. Section 179 Deduction (often missed!)
  const section179 = yearData.schedule_k.section_179_deduction ?? 0;
  if (section179 > 0) {
    items.push({
      category: 'section_179',
      description: 'Section 179 Deduction',
      amount: section179,
      source: 'Schedule K, Section 179',
    });
  }

  // 4. Amortization (using depletion field as proxy)
  const amortization = yearData.expenses.depletion ?? 0;
  if (amortization > 0) {
    items.push({
      category: 'amortization',
      description: 'Amortization/Depletion',
      amount: amortization,
      source: 'Tax Return',
    });
  }

  // 5. Interest Expense
  const interest = yearData.expenses.interest ?? 0;
  if (interest > 0) {
    items.push({
      category: 'interest',
      description: 'Interest Expense',
      amount: interest,
      source: 'Tax Return, Interest Expense',
    });
  }

  // 6. Capital Gains/Losses (non-recurring - add back losses, subtract gains)
  const capitalGainLoss = yearData.schedule_k.net_section_1231_gain ?? 0;
  if (capitalGainLoss !== 0) {
    // Negative capital gain (loss) is added back
    // Positive capital gain is subtracted (add negative)
    items.push({
      category: 'capital_gains',
      description: capitalGainLoss < 0 ? 'Add back: Capital Loss' : 'Subtract: Capital Gain',
      amount: -capitalGainLoss, // Negate because gains reduce SDE, losses increase
      source: 'Schedule K, Section 1231 Gain/Loss',
    });
  }

  // 7. COVID Adjustments (normalize out one-time income)
  const covidTotal = getTotalCovidAdjustments(extraction, year);
  if (covidTotal > 0) {
    items.push({
      category: 'covid_adjustments',
      description: 'COVID Relief (PPP/EIDL/ERC) - Normalized Out',
      amount: -covidTotal, // Subtract because these were one-time income boosts
      source: 'COVID Relief Programs',
    });
  }

  // Calculate total
  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return { total, items };
}

/**
 * Get normalized net income for a year.
 *
 * Subtracts COVID adjustments from reported net income to show
 * what the business would have earned without one-time relief.
 */
export function getNormalizedNetIncome(
  extraction: FinalExtractionOutput,
  year: number
): number {
  const netIncome = getNetIncome(extraction, year);
  const covidTotal = getTotalCovidAdjustments(extraction, year);

  return netIncome - covidTotal;
}

/**
 * Calculate SDE for a year.
 *
 * SDE = Normalized Net Income + Add-backs
 */
export function calculateSDE(
  extraction: FinalExtractionOutput,
  year: number
): number {
  const normalizedNetIncome = getNormalizedNetIncome(extraction, year);
  const addBacks = getAllSdeAddBacks(extraction, year);

  return normalizedNetIncome + addBacks.total;
}

/**
 * Get SDE for the most recent year.
 */
export function getLatestSDE(extraction: FinalExtractionOutput): number {
  const years = getYearsSorted(extraction);
  if (years.length === 0) return 0;
  return calculateSDE(extraction, years[0]);
}

/**
 * Calculate weighted average SDE across available years.
 *
 * Uses declining weights: most recent = 3, second = 2, third = 1
 */
export function getWeightedAverageSDE(
  extraction: FinalExtractionOutput
): number {
  const years = getYearsSorted(extraction);
  if (years.length === 0) return 0;

  const weights = [3, 2, 1]; // Most recent gets highest weight
  let weightedSum = 0;
  let totalWeight = 0;

  for (let i = 0; i < Math.min(years.length, weights.length); i++) {
    const sde = calculateSDE(extraction, years[i]);
    weightedSum += sde * weights[i];
    totalWeight += weights[i];
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}
