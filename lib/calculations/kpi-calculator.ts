/**
 * KPI Calculator
 *
 * Calculates 20+ Key Performance Indicators with industry comparisons,
 * trend analysis, and educational content for each metric.
 */

import {
  KPIResult,
  KPICategory,
  KPICalculationResult,
  KPIRating,
  ChartDataPoint,
  IndustryBenchmark,
} from './extended-types';

import { SingleYearFinancials, BalanceSheetData } from './types';
import { safeNumber, safeDivide, formatCurrency, formatPercentage, roundToDecimals } from './utils';

// ============================================
// INDUSTRY BENCHMARKS (Default values by industry type)
// ============================================

const DEFAULT_BENCHMARKS: Record<string, IndustryBenchmark> = {
  current_ratio: { metric_name: 'Current Ratio', industry_average: 1.5, percentile_25: 1.0, percentile_50: 1.5, percentile_75: 2.5 },
  quick_ratio: { metric_name: 'Quick Ratio', industry_average: 1.0, percentile_25: 0.6, percentile_50: 1.0, percentile_75: 1.8 },
  cash_to_revenue: { metric_name: 'Cash-to-Revenue', industry_average: 0.10, percentile_25: 0.05, percentile_50: 0.10, percentile_75: 0.20 },
  cash_flow_to_revenue: { metric_name: 'Cash Flow-to-Revenue', industry_average: 0.08, percentile_25: 0.03, percentile_50: 0.08, percentile_75: 0.15 },
  gross_margin: { metric_name: 'Gross Margin', industry_average: 0.35, percentile_25: 0.25, percentile_50: 0.35, percentile_75: 0.50 },
  operating_margin: { metric_name: 'Operating Margin', industry_average: 0.10, percentile_25: 0.05, percentile_50: 0.10, percentile_75: 0.18 },
  net_margin: { metric_name: 'Net Margin', industry_average: 0.06, percentile_25: 0.02, percentile_50: 0.06, percentile_75: 0.12 },
  return_on_assets: { metric_name: 'Return on Assets', industry_average: 0.08, percentile_25: 0.03, percentile_50: 0.08, percentile_75: 0.15 },
  return_on_equity: { metric_name: 'Return on Equity', industry_average: 0.15, percentile_25: 0.08, percentile_50: 0.15, percentile_75: 0.25 },
  asset_turnover: { metric_name: 'Asset Turnover', industry_average: 1.5, percentile_25: 0.8, percentile_50: 1.5, percentile_75: 2.5 },
  inventory_turnover: { metric_name: 'Inventory Turnover', industry_average: 6.0, percentile_25: 3.0, percentile_50: 6.0, percentile_75: 12.0 },
  receivables_days: { metric_name: 'Receivables Days', industry_average: 45, percentile_25: 30, percentile_50: 45, percentile_75: 60 },
  payables_days: { metric_name: 'Payables Days', industry_average: 30, percentile_25: 20, percentile_50: 30, percentile_75: 45 },
  debt_to_equity: { metric_name: 'Debt-to-Equity', industry_average: 0.50, percentile_25: 0.20, percentile_50: 0.50, percentile_75: 1.00 },
  debt_to_assets: { metric_name: 'Debt-to-Assets', industry_average: 0.35, percentile_25: 0.15, percentile_50: 0.35, percentile_75: 0.55 },
  interest_coverage: { metric_name: 'Interest Coverage', industry_average: 5.0, percentile_25: 2.0, percentile_50: 5.0, percentile_75: 10.0 },
  revenue_growth: { metric_name: 'Revenue Growth', industry_average: 0.05, percentile_25: -0.02, percentile_50: 0.05, percentile_75: 0.15 },
  fixed_assets_to_revenue: { metric_name: 'Fixed Assets-to-Revenue', industry_average: 0.15, percentile_25: 0.05, percentile_50: 0.15, percentile_75: 0.30 },
  total_debt_to_revenue: { metric_name: 'Total Debt-to-Revenue', industry_average: 0.25, percentile_25: 0.10, percentile_50: 0.25, percentile_75: 0.50 },
  total_debt_to_income: { metric_name: 'Total Debt-to-Income', industry_average: 2.0, percentile_25: 0.5, percentile_50: 2.0, percentile_75: 4.0 },
};

// ============================================
// KPI EDUCATIONAL CONTENT
// ============================================

const KPI_CONTENT: Record<string, { what_it_means: string; why_it_matters: string; example: string }> = {
  current_ratio: {
    what_it_means: 'This liquidity ratio measures the company\'s ability to pay short-term obligations with its current assets.',
    why_it_matters: 'A higher ratio indicates better liquidity and ability to meet short-term debts. Lenders and investors use this to assess financial health.',
    example: 'If current assets are $200K and current liabilities are $100K, the current ratio is 2.0, meaning the company has $2 of current assets for every $1 of current liabilities.',
  },
  quick_ratio: {
    what_it_means: 'Also called the "acid test," this measures ability to pay short-term obligations without relying on inventory sales.',
    why_it_matters: 'More conservative than current ratio because inventory can be hard to liquidate quickly. Important for businesses with slow-moving inventory.',
    example: 'If current assets minus inventory equals $150K and current liabilities are $100K, the quick ratio is 1.5.',
  },
  cash_to_revenue: {
    what_it_means: 'Shows what percentage of annual revenue is held as cash or cash equivalents.',
    why_it_matters: 'Indicates the company\'s liquidity cushion relative to its size. Too low suggests vulnerability; too high may indicate inefficient capital deployment.',
    example: 'If cash is $130K and revenue is $1M, cash-to-revenue is 13%, meaning the company holds about 1.5 months of revenue in cash.',
  },
  cash_flow_to_revenue: {
    what_it_means: 'This multi-purpose ratio shows the firm\'s ability to convert sales revenue into spendable cash.',
    why_it_matters: 'A higher percentage indicates the company can turn more revenue into cash flow. Key measure for growth potential without outside capital.',
    example: 'If a winery has a ratio of 11%, it means for every $1 of revenue it generates around 11 cents in discretionary cash flow.',
  },
  gross_margin: {
    what_it_means: 'The percentage of revenue remaining after deducting cost of goods sold.',
    why_it_matters: 'Higher margins indicate better pricing power and operational efficiency. Critical for covering operating expenses and generating profit.',
    example: 'If revenue is $1M and COGS is $600K, gross margin is 40%, meaning 40 cents of each dollar sold covers overhead and profit.',
  },
  operating_margin: {
    what_it_means: 'The percentage of revenue remaining after all operating expenses (before interest and taxes).',
    why_it_matters: 'Shows operational efficiency independent of financing decisions and tax strategies. Better for comparing companies.',
    example: 'If operating income is $100K on $1M revenue, operating margin is 10%.',
  },
  net_margin: {
    what_it_means: 'Also known as "return on sales," this indicates the relative profit margin for each dollar of sales.',
    why_it_matters: 'The bottom line profitability metric. Higher gross profits and lower expenses boost this metric, which directly impacts valuation.',
    example: 'If a convenience store has a ratio of 17%, this means for every $1 of revenue it has a pretax income of 17 cents.',
  },
  return_on_assets: {
    what_it_means: 'Measures how efficiently the company uses its assets to generate profit.',
    why_it_matters: 'Higher ROA indicates better asset utilization. Useful for comparing companies with different asset intensities.',
    example: 'If net income is $80K and total assets are $500K, ROA is 16%, meaning each dollar of assets generates 16 cents of profit.',
  },
  return_on_equity: {
    what_it_means: 'Measures the return generated on shareholders\' equity investment.',
    why_it_matters: 'The primary measure of profitability for owners. Higher ROE makes the business more attractive to investors.',
    example: 'If net income is $100K and equity is $400K, ROE is 25%, indicating strong returns for owners.',
  },
  debt_to_equity: {
    what_it_means: 'Shows the extent of the debt load in comparison to the company\'s equity value.',
    why_it_matters: 'A higher ratio means the company is financing growth with more debt, which increases risk. Lower ratios indicate the company is "safer."',
    example: 'If a machinery manufacturer has a ratio of 2.8, for every $1 owned by shareholders the company owes $2.80 to creditors.',
  },
  debt_to_assets: {
    what_it_means: 'The proportion of assets financed by debt versus equity.',
    why_it_matters: 'Higher ratios indicate more financial leverage and risk. Important for assessing bankruptcy risk.',
    example: 'If total debt is $200K and assets are $500K, debt-to-assets is 40%, meaning creditors finance 40% of assets.',
  },
  total_debt_to_income: {
    what_it_means: 'Shows the relationship between total company debt and ongoing profit performance.',
    why_it_matters: 'Firms with high debts relative to pretax profits are riskier. From a valuation perspective, firms with lower debts and higher profits are worth more.',
    example: 'If total debts are $100K and pretax profits are $50K, it would take two years to pay off debts from ongoing profits.',
  },
  revenue_growth: {
    what_it_means: 'The year-over-year percentage change in total revenue.',
    why_it_matters: 'Growth is a key valuation driver. Consistent growth indicates market demand and effective management.',
    example: 'If revenue grew from $900K to $1M, revenue growth is 11.1%.',
  },
  asset_turnover: {
    what_it_means: 'Measures how efficiently the company uses its assets to generate sales.',
    why_it_matters: 'Higher turnover indicates better asset utilization. Varies significantly by industry.',
    example: 'If revenue is $1.5M and assets are $1M, asset turnover is 1.5x, meaning each dollar of assets generates $1.50 in sales.',
  },
  receivables_days: {
    what_it_means: 'Average number of days to collect payment from customers.',
    why_it_matters: 'Longer collection periods tie up cash and increase bad debt risk. Shorter is generally better.',
    example: 'If A/R is $125K and annual revenue is $1M, receivables days is about 46 days.',
  },
  inventory_turnover: {
    what_it_means: 'How many times inventory is sold and replaced during the year.',
    why_it_matters: 'Higher turnover indicates efficient inventory management and strong sales. Low turnover may indicate obsolescence.',
    example: 'If COGS is $600K and average inventory is $100K, inventory turns 6 times per year.',
  },
  fixed_assets_to_revenue: {
    what_it_means: 'Shows the investment in fixed assets relative to sales volume.',
    why_it_matters: 'Higher ratios indicate capital-intensive operations. Important for understanding asset requirements for growth.',
    example: 'If fixed assets are $70K and revenue is $1M, fixed assets-to-revenue is 7%.',
  },
  total_debt_to_revenue: {
    what_it_means: 'Total debt obligations as a percentage of annual revenue.',
    why_it_matters: 'Indicates debt burden relative to business size. Higher ratios suggest more leverage.',
    example: 'If total debt is $150K and revenue is $1M, debt-to-revenue is 15%.',
  },
  interest_coverage: {
    what_it_means: 'How many times operating income covers interest expense.',
    why_it_matters: 'Higher coverage indicates better ability to service debt. Below 1.5x is concerning.',
    example: 'If operating income is $100K and interest is $20K, interest coverage is 5x.',
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Determine KPI rating based on value and benchmark
 */
function getRating(value: number, benchmark: IndustryBenchmark, higherIsBetter: boolean = true): KPIRating {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';

  if (higherIsBetter) {
    if (value >= benchmark.percentile_75) return 'Outperforming';
    if (value >= benchmark.percentile_25) return 'Meeting Average';
    return 'Underperforming';
  } else {
    // For metrics where lower is better (like debt ratios, receivables days)
    if (value <= benchmark.percentile_25) return 'Outperforming';
    if (value <= benchmark.percentile_75) return 'Meeting Average';
    return 'Underperforming';
  }
}

/**
 * Convert rating to valuation impact
 */
function getValuationImpact(rating: KPIRating): 'positive' | 'neutral' | 'negative' {
  switch (rating) {
    case 'Outperforming': return 'positive';
    case 'Meeting Average': return 'neutral';
    case 'Underperforming': return 'negative';
    default: return 'neutral';
  }
}

/**
 * Format KPI value based on type
 */
function formatKPIValue(value: number | null, type: 'percentage' | 'ratio' | 'currency' | 'days' | 'times'): string {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';

  switch (type) {
    case 'percentage': return formatPercentage(value);
    case 'ratio': return `${roundToDecimals(value, 2)}`;
    case 'currency': return formatCurrency(value);
    case 'days': return `${Math.round(value)} days`;
    case 'times': return `${roundToDecimals(value, 1)}x`;
    default: return String(roundToDecimals(value, 2));
  }
}

/**
 * Calculate percentile rank for a value
 */
function calculatePercentileRank(value: number, benchmark: IndustryBenchmark, higherIsBetter: boolean): number {
  const { percentile_25, percentile_50, percentile_75 } = benchmark;

  let rank: number;
  if (higherIsBetter) {
    if (value <= percentile_25) rank = 25 * (value / percentile_25);
    else if (value <= percentile_50) rank = 25 + 25 * ((value - percentile_25) / (percentile_50 - percentile_25));
    else if (value <= percentile_75) rank = 50 + 25 * ((value - percentile_50) / (percentile_75 - percentile_50));
    else rank = 75 + 25 * Math.min(1, (value - percentile_75) / percentile_75);
  } else {
    // Invert for lower-is-better metrics
    if (value >= percentile_75) rank = 25 * (1 - (value - percentile_75) / percentile_75);
    else if (value >= percentile_50) rank = 25 + 25 * ((percentile_75 - value) / (percentile_75 - percentile_50));
    else if (value >= percentile_25) rank = 50 + 25 * ((percentile_50 - value) / (percentile_50 - percentile_25));
    else rank = 75 + 25 * Math.min(1, (percentile_25 - value) / percentile_25);
  }

  return Math.max(0, Math.min(100, Math.round(rank)));
}

/**
 * Calculate a single KPI with all metadata
 */
function calculateKPI(
  name: string,
  value: number | null,
  formatType: 'percentage' | 'ratio' | 'currency' | 'days' | 'times',
  benchmark: IndustryBenchmark,
  higherIsBetter: boolean = true,
  trendValues?: Array<{ period: string; value: number }>
): KPIResult {
  const content = KPI_CONTENT[name] || {
    what_it_means: 'This metric measures a key aspect of financial performance.',
    why_it_matters: 'Understanding this metric helps assess business health.',
    example: 'Compare your value to the industry average for context.',
  };

  const rating = value !== null ? getRating(value, benchmark, higherIsBetter) : 'N/A';

  // Determine trend direction
  let trend_direction: 'improving' | 'stable' | 'declining' | undefined;
  if (trendValues && trendValues.length >= 2) {
    const first = trendValues[trendValues.length - 1].value;
    const last = trendValues[0].value;
    const change = (last - first) / Math.abs(first || 1);

    if (higherIsBetter) {
      trend_direction = change > 0.05 ? 'improving' : change < -0.05 ? 'declining' : 'stable';
    } else {
      trend_direction = change < -0.05 ? 'improving' : change > 0.05 ? 'declining' : 'stable';
    }
  }

  return {
    name: benchmark.metric_name,
    value,
    formatted_value: formatKPIValue(value, formatType),
    trend_values: trendValues,
    trend_direction,
    industry_average: benchmark.industry_average,
    percentile_rank: value !== null ? calculatePercentileRank(value, benchmark, higherIsBetter) : undefined,
    rating,
    what_it_means: content.what_it_means,
    why_it_matters: content.why_it_matters,
    example: content.example,
    valuation_impact: getValuationImpact(rating),
  };
}

// ============================================
// CATEGORY CALCULATION FUNCTIONS
// ============================================

/**
 * Calculate liquidity ratios
 */
function calculateLiquidityRatios(
  financials: SingleYearFinancials,
  balanceSheet: BalanceSheetData,
  priorYears?: SingleYearFinancials[]
): KPICategory {
  const currentAssets = safeNumber(balanceSheet.assets.current_assets.total_current_assets);
  const currentLiabilities = safeNumber(balanceSheet.liabilities.current_liabilities.total_current_liabilities);
  const inventory = safeNumber(balanceSheet.assets.current_assets.inventory);
  const cash = safeNumber(balanceSheet.assets.current_assets.cash);
  const revenue = safeNumber(financials.gross_receipts);

  const currentRatio = safeDivide(currentAssets, currentLiabilities);
  const quickRatio = safeDivide(currentAssets - inventory, currentLiabilities);
  const cashToRevenue = safeDivide(cash, revenue);

  return {
    category_name: 'Liquidity Ratios',
    description: 'Measures the company\'s ability to meet short-term obligations',
    kpis: [
      calculateKPI('current_ratio', currentRatio, 'ratio', DEFAULT_BENCHMARKS.current_ratio, true),
      calculateKPI('quick_ratio', quickRatio, 'ratio', DEFAULT_BENCHMARKS.quick_ratio, true),
      calculateKPI('cash_to_revenue', cashToRevenue, 'percentage', DEFAULT_BENCHMARKS.cash_to_revenue, true),
    ],
  };
}

/**
 * Calculate profitability ratios
 */
function calculateProfitabilityRatios(
  financials: SingleYearFinancials,
  balanceSheet: BalanceSheetData,
  priorYears?: SingleYearFinancials[]
): KPICategory {
  const revenue = safeNumber(financials.gross_receipts);
  const grossProfit = safeNumber(financials.gross_profit);
  const netIncome = safeNumber(financials.net_income);
  const totalAssets = safeNumber(balanceSheet.assets.total_assets);
  const totalEquity = safeNumber(balanceSheet.equity.total_equity);
  const cogs = safeNumber(financials.cost_of_goods_sold);

  // Calculate operating income (revenue - cogs - operating expenses)
  const operatingExpenses = safeNumber(financials.salaries_and_wages) +
    safeNumber(financials.rent) +
    safeNumber(financials.insurance) +
    safeNumber(financials.professional_fees) +
    safeNumber(financials.other_deductions);
  const operatingIncome = grossProfit - operatingExpenses;

  const grossMargin = safeDivide(grossProfit, revenue);
  const operatingMargin = safeDivide(operatingIncome, revenue);
  const netMargin = safeDivide(netIncome, revenue);
  const roa = safeDivide(netIncome, totalAssets);
  const roe = safeDivide(netIncome, totalEquity);

  return {
    category_name: 'Profitability Ratios',
    description: 'Measures the company\'s ability to generate profit',
    kpis: [
      calculateKPI('gross_margin', grossMargin, 'percentage', DEFAULT_BENCHMARKS.gross_margin, true),
      calculateKPI('operating_margin', operatingMargin, 'percentage', DEFAULT_BENCHMARKS.operating_margin, true),
      calculateKPI('net_margin', netMargin, 'percentage', DEFAULT_BENCHMARKS.net_margin, true),
      calculateKPI('return_on_assets', roa, 'percentage', DEFAULT_BENCHMARKS.return_on_assets, true),
      calculateKPI('return_on_equity', roe, 'percentage', DEFAULT_BENCHMARKS.return_on_equity, true),
    ],
  };
}

/**
 * Calculate efficiency ratios
 */
function calculateEfficiencyRatios(
  financials: SingleYearFinancials,
  balanceSheet: BalanceSheetData,
  priorYears?: SingleYearFinancials[]
): KPICategory {
  const revenue = safeNumber(financials.gross_receipts);
  const totalAssets = safeNumber(balanceSheet.assets.total_assets);
  const inventory = safeNumber(balanceSheet.assets.current_assets.inventory);
  const cogs = safeNumber(financials.cost_of_goods_sold);
  const ar = safeNumber(balanceSheet.assets.current_assets.accounts_receivable);
  const ap = safeNumber(balanceSheet.liabilities.current_liabilities.accounts_payable);
  const fixedAssets = safeNumber(balanceSheet.assets.fixed_assets.net_fixed_assets);

  const assetTurnover = safeDivide(revenue, totalAssets);
  const inventoryTurnover = safeDivide(cogs, inventory);
  const receivablesDays = safeDivide(ar * 365, revenue);
  const payablesDays = safeDivide(ap * 365, cogs);
  const fixedAssetsToRevenue = safeDivide(fixedAssets, revenue);

  return {
    category_name: 'Efficiency Ratios',
    description: 'Measures how effectively the company uses its assets',
    kpis: [
      calculateKPI('asset_turnover', assetTurnover, 'times', DEFAULT_BENCHMARKS.asset_turnover, true),
      calculateKPI('inventory_turnover', inventoryTurnover, 'times', DEFAULT_BENCHMARKS.inventory_turnover, true),
      calculateKPI('receivables_days', receivablesDays, 'days', DEFAULT_BENCHMARKS.receivables_days, false),
      calculateKPI('fixed_assets_to_revenue', fixedAssetsToRevenue, 'percentage', DEFAULT_BENCHMARKS.fixed_assets_to_revenue, false),
    ],
  };
}

/**
 * Calculate leverage ratios
 */
function calculateLeverageRatios(
  financials: SingleYearFinancials,
  balanceSheet: BalanceSheetData,
  priorYears?: SingleYearFinancials[]
): KPICategory {
  const totalAssets = safeNumber(balanceSheet.assets.total_assets);
  const totalEquity = safeNumber(balanceSheet.equity.total_equity);
  const totalLiabilities = safeNumber(balanceSheet.liabilities.total_liabilities);
  const revenue = safeNumber(financials.gross_receipts);
  const netIncome = safeNumber(financials.net_income);
  const interestExpense = safeNumber(financials.interest_expense);
  const grossProfit = safeNumber(financials.gross_profit);

  // Calculate operating income
  const operatingExpenses = safeNumber(financials.salaries_and_wages) +
    safeNumber(financials.rent) +
    safeNumber(financials.insurance) +
    safeNumber(financials.professional_fees) +
    safeNumber(financials.other_deductions);
  const operatingIncome = grossProfit - operatingExpenses;

  const debtToEquity = safeDivide(totalLiabilities, totalEquity);
  const debtToAssets = safeDivide(totalLiabilities, totalAssets);
  const interestCoverage = safeDivide(operatingIncome, interestExpense);
  const debtToRevenue = safeDivide(totalLiabilities, revenue);
  const debtToIncome = safeDivide(totalLiabilities, netIncome);

  return {
    category_name: 'Leverage Ratios',
    description: 'Measures the company\'s debt levels and financial risk',
    kpis: [
      calculateKPI('debt_to_equity', debtToEquity, 'ratio', DEFAULT_BENCHMARKS.debt_to_equity, false),
      calculateKPI('debt_to_assets', debtToAssets, 'percentage', DEFAULT_BENCHMARKS.debt_to_assets, false),
      calculateKPI('interest_coverage', interestCoverage, 'times', DEFAULT_BENCHMARKS.interest_coverage, true),
      calculateKPI('total_debt_to_revenue', debtToRevenue, 'percentage', DEFAULT_BENCHMARKS.total_debt_to_revenue, false),
      calculateKPI('total_debt_to_income', debtToIncome, 'ratio', DEFAULT_BENCHMARKS.total_debt_to_income, false),
    ],
  };
}

/**
 * Calculate growth metrics
 */
function calculateGrowthMetrics(
  financials: SingleYearFinancials,
  priorYears?: SingleYearFinancials[]
): KPICategory {
  const currentRevenue = safeNumber(financials.gross_receipts);
  let revenueGrowth: number | null = null;
  let trendValues: Array<{ period: string; value: number }> | undefined;

  if (priorYears && priorYears.length > 0) {
    const priorRevenue = safeNumber(priorYears[0].gross_receipts);
    revenueGrowth = safeDivide(currentRevenue - priorRevenue, priorRevenue);

    trendValues = [
      { period: financials.period, value: currentRevenue },
      ...priorYears.map(py => ({ period: py.period, value: safeNumber(py.gross_receipts) })),
    ];
  }

  return {
    category_name: 'Growth Metrics',
    description: 'Measures the company\'s growth trajectory',
    kpis: [
      calculateKPI('revenue_growth', revenueGrowth, 'percentage', DEFAULT_BENCHMARKS.revenue_growth, true, trendValues),
    ],
  };
}

// ============================================
// MAIN CALCULATION FUNCTION
// ============================================

export interface KPICalculatorInputs {
  current_financials: SingleYearFinancials;
  balance_sheet: BalanceSheetData;
  prior_years?: SingleYearFinancials[];
  custom_benchmarks?: Record<string, IndustryBenchmark>;
}

/**
 * Calculate all KPIs for a business
 *
 * @param inputs - Financial data and optional benchmarks
 * @returns Complete KPI analysis with ratings and educational content
 */
export function calculateAllKPIs(inputs: KPICalculatorInputs): KPICalculationResult {
  const { current_financials, balance_sheet, prior_years } = inputs;

  // Calculate each category
  const liquidity = calculateLiquidityRatios(current_financials, balance_sheet, prior_years);
  const profitability = calculateProfitabilityRatios(current_financials, balance_sheet, prior_years);
  const efficiency = calculateEfficiencyRatios(current_financials, balance_sheet, prior_years);
  const leverage = calculateLeverageRatios(current_financials, balance_sheet, prior_years);
  const growth = calculateGrowthMetrics(current_financials, prior_years);

  // Collect all KPIs
  const allKPIs = [
    ...liquidity.kpis,
    ...profitability.kpis,
    ...efficiency.kpis,
    ...leverage.kpis,
    ...growth.kpis,
  ];

  // Count by rating
  const outperforming = allKPIs.filter(k => k.rating === 'Outperforming').length;
  const meetingAverage = allKPIs.filter(k => k.rating === 'Meeting Average').length;
  const underperforming = allKPIs.filter(k => k.rating === 'Underperforming').length;
  const total = allKPIs.filter(k => k.rating !== 'N/A').length;

  // Calculate health score (0-100)
  const healthScore = total > 0
    ? Math.round((outperforming * 100 + meetingAverage * 50) / total)
    : 50;

  // Determine overall health
  let overallHealth: 'Strong' | 'Good' | 'Fair' | 'Weak';
  if (healthScore >= 75) overallHealth = 'Strong';
  else if (healthScore >= 60) overallHealth = 'Good';
  else if (healthScore >= 40) overallHealth = 'Fair';
  else overallHealth = 'Weak';

  // Build chart data
  const chartData = buildChartData(current_financials, balance_sheet, prior_years, allKPIs);

  return {
    liquidity_ratios: liquidity,
    profitability_ratios: profitability,
    efficiency_ratios: efficiency,
    leverage_ratios: leverage,
    growth_metrics: growth,
    total_kpis_calculated: total,
    outperforming_count: outperforming,
    meeting_average_count: meetingAverage,
    underperforming_count: underperforming,
    overall_financial_health: overallHealth,
    health_score: healthScore,
    chart_data: chartData,
    calculated_at: new Date().toISOString(),
  };
}

/**
 * Build chart data for visualization
 */
function buildChartData(
  financials: SingleYearFinancials,
  balanceSheet: BalanceSheetData,
  priorYears: SingleYearFinancials[] | undefined,
  allKPIs: KPIResult[]
): KPICalculationResult['chart_data'] {
  // Financial metrics vs revenue chart
  const revenue = safeNumber(financials.gross_receipts);
  const grossProfit = safeNumber(financials.gross_profit);
  const netIncome = safeNumber(financials.net_income);

  const financialMetrics: ChartDataPoint[] = [
    { label: 'Revenue', values: [{ period: financials.period, value: revenue }], color: '#3b82f6' },
    { label: 'Gross Profit', values: [{ period: financials.period, value: grossProfit }], color: '#10b981' },
    { label: 'Net Income', values: [{ period: financials.period, value: netIncome }], color: '#8b5cf6' },
  ];

  // Growth trends chart
  const growthTrends: ChartDataPoint[] = [];
  if (priorYears && priorYears.length > 0) {
    const allYears = [financials, ...priorYears].reverse();
    growthTrends.push({
      label: 'Revenue',
      values: allYears.map(y => ({ period: y.period, value: safeNumber(y.gross_receipts) })),
      color: '#3b82f6',
    });
  }

  // KPI performance summary
  const kpiSummary: ChartDataPoint[] = [
    { label: 'Outperforming', values: [{ period: 'Current', value: allKPIs.filter(k => k.rating === 'Outperforming').length }], color: '#10b981' },
    { label: 'Meeting Average', values: [{ period: 'Current', value: allKPIs.filter(k => k.rating === 'Meeting Average').length }], color: '#f59e0b' },
    { label: 'Underperforming', values: [{ period: 'Current', value: allKPIs.filter(k => k.rating === 'Underperforming').length }], color: '#ef4444' },
  ];

  return {
    financial_metrics_vs_revenue: financialMetrics,
    growth_trends: growthTrends,
    kpi_performance_summary: kpiSummary,
  };
}

/**
 * Format KPI results as markdown table
 */
export function formatKPITable(result: KPICalculationResult): string {
  const lines: string[] = [];

  lines.push('## KPI Analysis Summary\n');
  lines.push(`**Overall Financial Health:** ${result.overall_financial_health} (Score: ${result.health_score}/100)\n`);
  lines.push(`**KPIs Analyzed:** ${result.total_kpis_calculated}`);
  lines.push(`- Outperforming: ${result.outperforming_count}`);
  lines.push(`- Meeting Average: ${result.meeting_average_count}`);
  lines.push(`- Underperforming: ${result.underperforming_count}\n`);

  // Format each category
  const categories = [
    result.liquidity_ratios,
    result.profitability_ratios,
    result.efficiency_ratios,
    result.leverage_ratios,
    result.growth_metrics,
  ];

  for (const category of categories) {
    lines.push(`### ${category.category_name}\n`);
    lines.push('| Metric | Value | Rating | Industry Avg |');
    lines.push('|--------|-------|--------|--------------|');

    for (const kpi of category.kpis) {
      const ratingEmoji = kpi.rating === 'Outperforming' ? '🟢' :
        kpi.rating === 'Meeting Average' ? '🟡' :
        kpi.rating === 'Underperforming' ? '🔴' : '⚪';
      lines.push(`| ${kpi.name} | ${kpi.formatted_value} | ${ratingEmoji} ${kpi.rating} | ${kpi.industry_average !== undefined ? formatKPIValue(kpi.industry_average, 'ratio') : 'N/A'} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
