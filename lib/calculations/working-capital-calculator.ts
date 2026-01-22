/**
 * Working Capital Calculator
 *
 * Calculates working capital, normal working capital requirements,
 * and adjustments needed for business valuation.
 *
 * @module lib/calculations/working-capital-calculator
 */

import {
  WorkingCapitalResult,
  WorkingCapitalComponent,
  WorkingCapitalTrend,
} from './extended-types';
import { SingleYearFinancials, BalanceSheetData } from './types';
import { safeNumber, safeDivide, formatCurrency, formatPercentage, roundToDecimals } from './utils';

// ============================================
// INDUSTRY WORKING CAPITAL BENCHMARKS
// ============================================

/**
 * Industry working capital as percentage of revenue
 * Source: Industry averages from RMA, BizComps, and IBISWorld
 */
const INDUSTRY_WC_BENCHMARKS: Record<string, { typical_range: [number, number]; average: number }> = {
  // Service businesses (typically lower WC needs)
  'consulting': { typical_range: [0.05, 0.12], average: 0.08 },
  'professional_services': { typical_range: [0.08, 0.15], average: 0.10 },
  'software': { typical_range: [0.05, 0.12], average: 0.08 },
  'healthcare': { typical_range: [0.10, 0.18], average: 0.14 },
  'restaurant': { typical_range: [0.03, 0.08], average: 0.05 },

  // Trade businesses (moderate WC needs)
  'retail': { typical_range: [0.12, 0.22], average: 0.17 },
  'construction': { typical_range: [0.10, 0.20], average: 0.15 },
  'hvac': { typical_range: [0.08, 0.15], average: 0.12 },
  'plumbing': { typical_range: [0.08, 0.14], average: 0.11 },
  'electrical': { typical_range: [0.08, 0.14], average: 0.11 },

  // Product businesses (higher WC needs)
  'wholesale_distribution': { typical_range: [0.15, 0.25], average: 0.20 },
  'manufacturing': { typical_range: [0.18, 0.30], average: 0.24 },
  'e_commerce': { typical_range: [0.12, 0.22], average: 0.16 },

  // Default for unknown industries
  'default': { typical_range: [0.10, 0.20], average: 0.15 },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get industry benchmark for working capital
 */
function getIndustryBenchmark(industry?: string): { typical_range: [number, number]; average: number } {
  if (!industry) return INDUSTRY_WC_BENCHMARKS.default;

  const normalized = industry.toLowerCase().replace(/[^a-z0-9]/g, '_');

  // Try exact match
  if (INDUSTRY_WC_BENCHMARKS[normalized]) {
    return INDUSTRY_WC_BENCHMARKS[normalized];
  }

  // Try partial match
  for (const [key, value] of Object.entries(INDUSTRY_WC_BENCHMARKS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }

  return INDUSTRY_WC_BENCHMARKS.default;
}

/**
 * Calculate days of working capital component
 */
function calculateDays(component: number, annualRevenue: number): number {
  return annualRevenue > 0 ? Math.round((component / annualRevenue) * 365) : 0;
}

// ============================================
// MAIN CALCULATION FUNCTION
// ============================================

export interface WorkingCapitalInputs {
  balance_sheet: BalanceSheetData;
  financials: SingleYearFinancials[];
  industry?: string;
}

/**
 * Calculate comprehensive working capital analysis
 */
export function calculateWorkingCapital(inputs: WorkingCapitalInputs): WorkingCapitalResult {
  const { balance_sheet: bs, financials, industry } = inputs;

  // Get current year revenue
  const sortedFinancials = [...financials].sort((a, b) =>
    parseInt(b.period) - parseInt(a.period)
  );
  const currentRevenue = safeNumber(sortedFinancials[0]?.gross_receipts);
  const cogs = safeNumber(sortedFinancials[0]?.cost_of_goods_sold);

  // ============================================
  // EXTRACT COMPONENTS
  // ============================================

  // Current Assets
  const cash = safeNumber(bs.assets.current_assets.cash);
  const accountsReceivable = safeNumber(bs.assets.current_assets.accounts_receivable);
  const inventory = safeNumber(bs.assets.current_assets.inventory);
  const prepaidExpenses = safeNumber(bs.assets.current_assets.prepaid_expenses);
  const otherCurrentAssets = safeNumber(bs.assets.current_assets.other_current_assets);
  const totalCurrentAssets = safeNumber(bs.assets.current_assets.total_current_assets);

  // Current Liabilities
  const accountsPayable = safeNumber(bs.liabilities.current_liabilities.accounts_payable);
  const accruedExpenses = safeNumber(bs.liabilities.current_liabilities.accrued_expenses);
  const currentDebt = safeNumber(bs.liabilities.current_liabilities.current_portion_long_term_debt);
  const otherCurrentLiabilities = safeNumber(bs.liabilities.current_liabilities.other_current_liabilities);
  const totalCurrentLiabilities = safeNumber(bs.liabilities.current_liabilities.total_current_liabilities);

  // ============================================
  // CALCULATE WORKING CAPITAL METRICS
  // ============================================

  // Gross Working Capital (all current assets)
  const grossWorkingCapital = totalCurrentAssets;

  // Net Working Capital (traditional)
  const netWorkingCapital = totalCurrentAssets - totalCurrentLiabilities;

  // Operating Working Capital (excludes cash and debt)
  // This is what buyers focus on: (AR + Inventory + Prepaids) - (AP + Accrued)
  const operatingWorkingCapital =
    (accountsReceivable + inventory + prepaidExpenses + otherCurrentAssets) -
    (accountsPayable + accruedExpenses + otherCurrentLiabilities);

  // ============================================
  // CALCULATE NORMAL WORKING CAPITAL
  // ============================================

  const benchmark = getIndustryBenchmark(industry);
  const normalWCPercent = benchmark.average;
  const normalWorkingCapital = Math.round(currentRevenue * normalWCPercent);

  // Working Capital Adjustment (buyer peg)
  // Positive = buyer adds cash (business has less WC than needed)
  // Negative = seller gets cash back (business has excess WC)
  const workingCapitalAdjustment = normalWorkingCapital - operatingWorkingCapital;

  // ============================================
  // CALCULATE COMPONENTS WITH DAYS
  // ============================================

  const components: WorkingCapitalComponent[] = [
    {
      name: 'Cash and Cash Equivalents',
      amount: cash,
      as_percent_of_revenue: safeDivide(cash, currentRevenue),
      days_outstanding: calculateDays(cash, currentRevenue),
      included_in_operating_wc: false,
      notes: 'Cash is typically excluded from operating working capital and may be retained by seller',
    },
    {
      name: 'Accounts Receivable',
      amount: accountsReceivable,
      as_percent_of_revenue: safeDivide(accountsReceivable, currentRevenue),
      days_outstanding: calculateDays(accountsReceivable, currentRevenue),
      included_in_operating_wc: true,
      notes: `Collection period of ${calculateDays(accountsReceivable, currentRevenue)} days`,
    },
    {
      name: 'Inventory',
      amount: inventory,
      as_percent_of_revenue: safeDivide(inventory, currentRevenue),
      days_outstanding: cogs > 0 ? Math.round((inventory / cogs) * 365) : 0,
      included_in_operating_wc: true,
      notes: inventory > 0 && cogs > 0
        ? `Inventory turns ${roundToDecimals(cogs / inventory, 1)} times per year`
        : 'No inventory or COGS data',
    },
    {
      name: 'Prepaid Expenses',
      amount: prepaidExpenses,
      as_percent_of_revenue: safeDivide(prepaidExpenses, currentRevenue),
      days_outstanding: calculateDays(prepaidExpenses, currentRevenue),
      included_in_operating_wc: true,
      notes: 'Insurance, rent, and other prepaid items',
    },
    {
      name: 'Accounts Payable',
      amount: -accountsPayable, // Negative as it reduces WC need
      as_percent_of_revenue: safeDivide(accountsPayable, currentRevenue),
      days_outstanding: cogs > 0 ? Math.round((accountsPayable / cogs) * 365) : 0,
      included_in_operating_wc: true,
      notes: `Payment period of ${cogs > 0 ? Math.round((accountsPayable / cogs) * 365) : 0} days`,
    },
    {
      name: 'Accrued Expenses',
      amount: -accruedExpenses,
      as_percent_of_revenue: safeDivide(accruedExpenses, currentRevenue),
      days_outstanding: calculateDays(accruedExpenses, currentRevenue),
      included_in_operating_wc: true,
      notes: 'Wages, taxes, and other accruals owed',
    },
  ];

  // ============================================
  // CALCULATE HISTORICAL TREND
  // ============================================

  const trend = calculateWCTrend(financials, bs, currentRevenue, operatingWorkingCapital);

  // ============================================
  // ASSESS WORKING CAPITAL QUALITY
  // ============================================

  const wcAsPercentOfRevenue = safeDivide(operatingWorkingCapital, currentRevenue);

  let quality: 'Adequate' | 'Above Target' | 'Below Target' | 'Critical';
  let qualityDescription: string;

  if (wcAsPercentOfRevenue >= benchmark.typical_range[1]) {
    quality = 'Above Target';
    qualityDescription = `Working capital of ${formatPercentage(wcAsPercentOfRevenue)} of revenue exceeds the typical industry range of ${formatPercentage(benchmark.typical_range[0])}-${formatPercentage(benchmark.typical_range[1])}. Excess working capital may be distributed to seller at closing.`;
  } else if (wcAsPercentOfRevenue >= benchmark.typical_range[0]) {
    quality = 'Adequate';
    qualityDescription = `Working capital of ${formatPercentage(wcAsPercentOfRevenue)} of revenue falls within the typical industry range of ${formatPercentage(benchmark.typical_range[0])}-${formatPercentage(benchmark.typical_range[1])}. No significant adjustment expected.`;
  } else if (wcAsPercentOfRevenue >= benchmark.typical_range[0] * 0.5) {
    quality = 'Below Target';
    qualityDescription = `Working capital of ${formatPercentage(wcAsPercentOfRevenue)} of revenue is below the typical industry range. Buyer may require additional working capital injection at closing.`;
  } else {
    quality = 'Critical';
    qualityDescription = `Working capital is critically low at ${formatPercentage(wcAsPercentOfRevenue)} of revenue. Significant capital injection likely required.`;
  }

  // ============================================
  // BUILD RESULT
  // ============================================

  return {
    // Summary figures
    gross_working_capital: grossWorkingCapital,
    net_working_capital: netWorkingCapital,
    operating_working_capital: operatingWorkingCapital,

    // Normal WC calculation
    normal_working_capital: {
      amount: normalWorkingCapital,
      as_percent_of_revenue: normalWCPercent,
      calculation_method: 'Industry average as percentage of revenue',
      industry_benchmark: benchmark,
    },

    // Adjustment for valuation
    working_capital_adjustment: {
      amount: workingCapitalAdjustment,
      direction: workingCapitalAdjustment > 0 ? 'Buyer adds to purchase price' : 'Seller retains excess',
      explanation: workingCapitalAdjustment > 0
        ? `Business requires ${formatCurrency(Math.abs(workingCapitalAdjustment))} additional working capital to reach normal operating levels.`
        : workingCapitalAdjustment < 0
          ? `Business has ${formatCurrency(Math.abs(workingCapitalAdjustment))} excess working capital that may be retained by seller.`
          : 'Working capital is at normal levels; no adjustment required.',
    },

    // Components
    components,

    // Metrics
    current_ratio: safeDivide(totalCurrentAssets, totalCurrentLiabilities),
    quick_ratio: safeDivide(totalCurrentAssets - inventory, totalCurrentLiabilities),
    working_capital_to_revenue: wcAsPercentOfRevenue,

    // Quality assessment
    quality,
    quality_description: qualityDescription,

    // Trend
    trend,

    // Narrative for report
    narrative: generateWCNarrative(
      operatingWorkingCapital,
      normalWorkingCapital,
      workingCapitalAdjustment,
      wcAsPercentOfRevenue,
      benchmark,
      quality,
      components
    ),

    calculated_at: new Date().toISOString(),
  };
}

function calculateWCTrend(
  financials: SingleYearFinancials[],
  currentBS: BalanceSheetData,
  currentRevenue: number,
  currentOpWC: number
): WorkingCapitalTrend {
  // For now, we only have current balance sheet
  // In a full implementation, we'd have historical balance sheets

  const current_period = {
    period: financials[0]?.period || new Date().getFullYear().toString(),
    operating_wc: currentOpWC,
    as_percent_of_revenue: safeDivide(currentOpWC, currentRevenue),
  };

  return {
    periods: [current_period],
    trend_direction: 'stable', // Would calculate if we had historical BS
    average_wc_to_revenue: current_period.as_percent_of_revenue,
  };
}

function generateWCNarrative(
  operatingWC: number,
  normalWC: number,
  adjustment: number,
  wcPercent: number,
  benchmark: { typical_range: [number, number]; average: number },
  quality: string,
  components: WorkingCapitalComponent[]
): string {
  let narrative = `### Working Capital Analysis\n\n`;

  narrative += `The business has operating working capital of ${formatCurrency(operatingWC)}, representing ${formatPercentage(wcPercent)} of annual revenue. `;
  narrative += `Industry norms suggest working capital of ${formatPercentage(benchmark.typical_range[0])}-${formatPercentage(benchmark.typical_range[1])} of revenue (average: ${formatPercentage(benchmark.average)}).\n\n`;

  // Quality assessment
  if (quality === 'Adequate') {
    narrative += `**Assessment:** Working capital levels are adequate for normal business operations.\n\n`;
  } else if (quality === 'Above Target') {
    narrative += `**Assessment:** Working capital exceeds typical requirements. The business maintains conservative levels, which may indicate excess cash available for distribution.\n\n`;
  } else if (quality === 'Below Target') {
    narrative += `**Assessment:** Working capital is below typical industry levels. A buyer may need to inject additional capital to support operations.\n\n`;
  } else {
    narrative += `**Assessment:** Working capital is critically low. Immediate attention is needed to ensure operational continuity.\n\n`;
  }

  // Adjustment
  if (Math.abs(adjustment) > 1000) {
    narrative += `**Valuation Impact:** Based on normal working capital requirements of ${formatCurrency(normalWC)}, `;
    if (adjustment > 0) {
      narrative += `a buyer would need to add approximately ${formatCurrency(adjustment)} to the purchase price to bring working capital to normal levels.`;
    } else {
      narrative += `approximately ${formatCurrency(Math.abs(adjustment))} of excess working capital may be retained by the seller or deducted from the purchase price.`;
    }
  }

  return narrative;
}

export { INDUSTRY_WC_BENCHMARKS };
