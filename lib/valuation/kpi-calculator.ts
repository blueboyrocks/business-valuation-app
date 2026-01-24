/**
 * KPI Calculator
 * Calculates Key Performance Indicators from financial data
 */

// Performance classification types
export type PerformanceLevel = 'outperforming' | 'meeting' | 'underperforming';
export type TrendDirection = 'improving' | 'stable' | 'declining';

/**
 * Classify performance relative to benchmark using ±10% threshold
 */
export function classifyPerformance(
  value: number | null,
  benchmark: number | null,
  higherIsBetter: boolean = true
): PerformanceLevel {
  if (value === null || benchmark === null || benchmark === 0) return 'meeting';

  const ratio = value / benchmark;

  if (higherIsBetter) {
    if (ratio > 1.10) return 'outperforming';  // >10% above benchmark
    if (ratio < 0.90) return 'underperforming'; // >10% below benchmark
    return 'meeting';
  } else {
    // For metrics where lower is better (e.g., debt-to-equity)
    if (ratio < 0.90) return 'outperforming';  // >10% below benchmark (good)
    if (ratio > 1.10) return 'underperforming'; // >10% above benchmark (bad)
    return 'meeting';
  }
}

/**
 * Calculate trend direction from historical values
 */
export function calculateTrend(values: (number | null)[]): TrendDirection {
  const validValues = values.filter((v): v is number => v !== null);
  if (validValues.length < 2) return 'stable';

  // Compare most recent to oldest
  const oldest = validValues[validValues.length - 1];
  const newest = validValues[0];

  if (oldest === 0) return 'stable';

  const changeRatio = (newest - oldest) / Math.abs(oldest);

  if (changeRatio > 0.05) return 'improving';  // >5% improvement
  if (changeRatio < -0.05) return 'declining'; // >5% decline
  return 'stable';
}

/**
 * Get performance color based on level
 */
export function getPerformanceColor(level: PerformanceLevel): string {
  switch (level) {
    case 'outperforming':
      return '#4CAF50'; // Green
    case 'meeting':
      return '#FFC107'; // Yellow/Amber
    case 'underperforming':
      return '#F44336'; // Red
    default:
      return '#9E9E9E'; // Gray
  }
}

/**
 * Get performance badge label
 */
export function getPerformanceBadgeLabel(level: PerformanceLevel): string {
  switch (level) {
    case 'outperforming':
      return 'Outperforming Industry';
    case 'meeting':
      return 'Meeting Expectations';
    case 'underperforming':
      return 'Below Industry Average';
    default:
      return 'N/A';
  }
}

/**
 * Extended KPI data with historical values and classification
 */
export interface KPIDetailedResult {
  id: string;
  name: string;
  currentValue: number | null;
  historicalValues: {
    year: number;
    value: number | null;
    performance: PerformanceLevel;
    vsIndustry: number | null; // Percentage difference from benchmark
  }[];
  benchmark: number | null;
  trend: TrendDirection;
  overallPerformance: PerformanceLevel;
  format: 'percentage' | 'ratio' | 'days' | 'times';
  higherIsBetter: boolean;
}

export interface FinancialData {
  revenue: number;
  pretax_income?: number;
  owner_compensation?: number;
  interest_expense?: number;
  depreciation_amortization?: number;
  non_cash_expenses?: number;
  one_time_expenses?: number;
  one_time_revenues?: number;
  cash?: number;
  accounts_receivable?: number;
  inventory?: number;
  other_current_assets?: number;
  fixed_assets?: number;
  intangible_assets?: number;
  total_assets?: number;
  accounts_payable?: number;
  other_short_term_liabilities?: number;
  bank_loans?: number;
  other_long_term_liabilities?: number;
  total_liabilities?: number;
}

export interface KPIResults {
  // Liquidity Ratios
  cash_flow_to_revenue: number | null;
  cash_to_revenue: number | null;
  current_ratio: number | null;
  quick_ratio: number | null;
  
  // Efficiency Ratios
  receivables_conversion_days: number | null;
  inventory_to_revenue: number | null;
  fixed_assets_to_revenue: number | null;
  asset_turnover: number | null;
  inventory_turnover: number | null;
  
  // Leverage Ratios
  total_debt_to_revenue: number | null;
  debt_to_equity: number | null;
  debt_to_assets: number | null;
  
  // Profitability Ratios
  profit_margin: number | null;
  ebitda_margin: number | null;
  return_on_assets: number | null;
  return_on_equity: number | null;
  
  // Growth Metrics
  revenue_growth_rate: number | null;
  
  // Calculated Values
  cash_flow: number | null;
  ebitda: number | null;
  total_current_assets: number | null;
  total_current_liabilities: number | null;
  total_debt: number | null;
  equity: number | null;
}

/**
 * Calculate all KPIs from financial data
 */
export function calculateKPIs(data: FinancialData, priorYearData?: FinancialData): KPIResults {
  // Calculate derived values
  const cash_flow = calculateCashFlow(data);
  const ebitda = calculateEBITDA(data);
  const total_current_assets = calculateTotalCurrentAssets(data);
  const total_current_liabilities = calculateTotalCurrentLiabilities(data);
  const total_debt = calculateTotalDebt(data);
  const equity = calculateEquity(data);
  
  return {
    // Liquidity Ratios
    cash_flow_to_revenue: safeRatio(cash_flow, data.revenue),
    cash_to_revenue: safeRatio(data.cash, data.revenue),
    current_ratio: safeRatio(total_current_assets, total_current_liabilities),
    quick_ratio: safeRatio(
      (total_current_assets || 0) - (data.inventory || 0),
      total_current_liabilities
    ),
    
    // Efficiency Ratios
    receivables_conversion_days: data.accounts_receivable && data.revenue
      ? (data.accounts_receivable / data.revenue) * 365
      : null,
    inventory_to_revenue: safeRatio(data.inventory, data.revenue),
    fixed_assets_to_revenue: safeRatio(data.fixed_assets, data.revenue),
    asset_turnover: safeRatio(data.revenue, data.total_assets),
    inventory_turnover: data.inventory && data.revenue
      ? data.revenue / data.inventory
      : null,
    
    // Leverage Ratios
    total_debt_to_revenue: safeRatio(total_debt, data.revenue),
    debt_to_equity: safeRatio(total_debt, equity),
    debt_to_assets: safeRatio(total_debt, data.total_assets),
    
    // Profitability Ratios
    profit_margin: safeRatio(data.pretax_income, data.revenue),
    ebitda_margin: safeRatio(ebitda, data.revenue),
    return_on_assets: safeRatio(data.pretax_income, data.total_assets),
    return_on_equity: safeRatio(data.pretax_income, equity),
    
    // Growth Metrics
    revenue_growth_rate: priorYearData
      ? calculateGrowthRate(priorYearData.revenue, data.revenue)
      : null,
    
    // Calculated Values
    cash_flow,
    ebitda,
    total_current_assets,
    total_current_liabilities,
    total_debt,
    equity,
  };
}

/**
 * Calculate cash flow (Operating Cash Flow approximation)
 */
function calculateCashFlow(data: FinancialData): number | null {
  if (!data.pretax_income) return null;
  
  const depreciation = data.depreciation_amortization || data.non_cash_expenses || 0;
  return data.pretax_income + depreciation;
}

/**
 * Calculate EBITDA
 */
function calculateEBITDA(data: FinancialData): number | null {
  if (!data.pretax_income) return null;
  
  const interest = data.interest_expense || 0;
  const depreciation = data.depreciation_amortization || data.non_cash_expenses || 0;
  
  return data.pretax_income + interest + depreciation;
}

/**
 * Calculate total current assets
 */
function calculateTotalCurrentAssets(data: FinancialData): number | null {
  const cash = data.cash || 0;
  const ar = data.accounts_receivable || 0;
  const inventory = data.inventory || 0;
  const other = data.other_current_assets || 0;
  
  if (cash === 0 && ar === 0 && inventory === 0 && other === 0) return null;
  
  return cash + ar + inventory + other;
}

/**
 * Calculate total current liabilities
 */
function calculateTotalCurrentLiabilities(data: FinancialData): number | null {
  const ap = data.accounts_payable || 0;
  const other = data.other_short_term_liabilities || 0;
  
  if (ap === 0 && other === 0) return null;
  
  return ap + other;
}

/**
 * Calculate total debt
 */
function calculateTotalDebt(data: FinancialData): number | null {
  const shortTerm = data.other_short_term_liabilities || 0;
  const bankLoans = data.bank_loans || 0;
  const longTerm = data.other_long_term_liabilities || 0;
  
  if (shortTerm === 0 && bankLoans === 0 && longTerm === 0) {
    return data.total_liabilities || null;
  }
  
  return shortTerm + bankLoans + longTerm;
}

/**
 * Calculate equity
 */
function calculateEquity(data: FinancialData): number | null {
  if (!data.total_assets) return null;
  
  const liabilities = data.total_liabilities || calculateTotalDebt(data) || 0;
  return data.total_assets - liabilities;
}

/**
 * Safe ratio calculation (returns null if denominator is 0 or null)
 */
function safeRatio(numerator: number | null | undefined, denominator: number | null | undefined): number | null {
  if (!numerator || !denominator || denominator === 0) return null;
  return numerator / denominator;
}

/**
 * Calculate growth rate between two periods
 */
function calculateGrowthRate(oldValue: number, newValue: number): number | null {
  if (!oldValue || oldValue === 0) return null;
  return (newValue - oldValue) / oldValue;
}

/**
 * Format KPI value for display
 */
export function formatKPI(value: number | null, type: 'percentage' | 'ratio' | 'days' | 'currency'): string {
  if (value === null) return 'N/A';
  
  switch (type) {
    case 'percentage':
      return `${(value * 100).toFixed(1)}%`;
    case 'ratio':
      return value.toFixed(2);
    case 'days':
      return `${Math.round(value)} days`;
    case 'currency':
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    default:
      return value.toString();
  }
}

/**
 * Get KPI performance level compared to industry benchmarks
 */
export function getKPIPerformance(
  value: number | null,
  industryAverage: number | null,
  higherIsBetter: boolean = true
): 'good' | 'average' | 'poor' | 'unknown' {
  if (value === null || industryAverage === null) return 'unknown';
  
  const ratio = value / industryAverage;
  
  if (higherIsBetter) {
    if (ratio >= 1.1) return 'good';
    if (ratio >= 0.9) return 'average';
    return 'poor';
  } else {
    if (ratio <= 0.9) return 'good';
    if (ratio <= 1.1) return 'average';
    return 'poor';
  }
}

/**
 * Get color for KPI performance
 */
export function getKPIColor(performance: 'good' | 'average' | 'poor' | 'unknown'): string {
  switch (performance) {
    case 'good':
      return '#7CB342'; // Green
    case 'average':
      return '#42A5F5'; // Blue
    case 'poor':
      return '#7E57C2'; // Purple
    default:
      return '#9E9E9E'; // Gray
  }
}

/**
 * Industry benchmarks for KPIs (can be overridden with actual industry data)
 */
export const DEFAULT_INDUSTRY_BENCHMARKS: Record<string, { value: number; higherIsBetter: boolean }> = {
  revenue_growth_rate: { value: 0.05, higherIsBetter: true },
  gross_profit_margin: { value: 0.35, higherIsBetter: true },
  operating_profit_margin: { value: 0.10, higherIsBetter: true },
  net_profit_margin: { value: 0.05, higherIsBetter: true },
  return_on_assets: { value: 0.10, higherIsBetter: true },
  return_on_equity: { value: 0.18, higherIsBetter: true },
  current_ratio: { value: 1.5, higherIsBetter: true },
  quick_ratio: { value: 1.0, higherIsBetter: true },
  debt_to_equity: { value: 0.8, higherIsBetter: false },
  asset_turnover: { value: 2.0, higherIsBetter: true },
  inventory_turnover: { value: 6.0, higherIsBetter: true },
  receivables_turnover: { value: 10.0, higherIsBetter: true },
  sde_to_revenue: { value: 0.18, higherIsBetter: true },
};

/**
 * Calculate detailed KPI results with multi-year data
 */
export function calculateDetailedKPIs(
  yearlyData: { year: number; data: FinancialData }[],
  industryBenchmarks?: Record<string, number>
): KPIDetailedResult[] {
  // Sort by year descending (most recent first)
  const sortedData = [...yearlyData].sort((a, b) => b.year - a.year);

  // Get benchmarks (use provided or default)
  const benchmarks = industryBenchmarks || {};

  const results: KPIDetailedResult[] = [];

  // Revenue Growth Rate
  const revenueValues = sortedData.map(d => d.data.revenue);
  const growthRates: (number | null)[] = [];
  for (let i = 0; i < sortedData.length - 1; i++) {
    const current = sortedData[i].data.revenue;
    const prior = sortedData[i + 1].data.revenue;
    if (prior && prior !== 0) {
      growthRates.push((current - prior) / prior);
    } else {
      growthRates.push(null);
    }
  }
  const growthBenchmark = benchmarks['revenue_growth_rate'] ?? DEFAULT_INDUSTRY_BENCHMARKS.revenue_growth_rate.value;
  results.push(buildKPIResult('revenue_growth_rate', 'Revenue Growth Rate', growthRates, sortedData.slice(0, -1).map(d => d.year), growthBenchmark, true, 'percentage'));

  // Gross Profit Margin (requires COGS data - estimate from revenue if not available)
  const grossMarginBenchmark = benchmarks['gross_profit_margin'] ?? DEFAULT_INDUSTRY_BENCHMARKS.gross_profit_margin.value;
  const grossMargins = sortedData.map(d => {
    if (!d.data.revenue) return null;
    // Estimate gross margin from pretax_income + typical operating expense ratio
    const estimatedGross = d.data.pretax_income ? (d.data.pretax_income + (d.data.revenue * 0.25)) / d.data.revenue : null;
    return estimatedGross && estimatedGross > 0 ? Math.min(estimatedGross, 0.8) : null;
  });
  results.push(buildKPIResult('gross_profit_margin', 'Gross Profit Margin', grossMargins, sortedData.map(d => d.year), grossMarginBenchmark, true, 'percentage'));

  // Operating Profit Margin
  const opMarginBenchmark = benchmarks['operating_profit_margin'] ?? DEFAULT_INDUSTRY_BENCHMARKS.operating_profit_margin.value;
  const opMargins = sortedData.map(d => {
    if (!d.data.revenue || !d.data.pretax_income) return null;
    const opIncome = d.data.pretax_income + (d.data.interest_expense || 0);
    return opIncome / d.data.revenue;
  });
  results.push(buildKPIResult('operating_profit_margin', 'Operating Profit Margin', opMargins, sortedData.map(d => d.year), opMarginBenchmark, true, 'percentage'));

  // Net Profit Margin
  const netMarginBenchmark = benchmarks['net_profit_margin'] ?? DEFAULT_INDUSTRY_BENCHMARKS.net_profit_margin.value;
  const netMargins = sortedData.map(d => safeRatio(d.data.pretax_income, d.data.revenue));
  results.push(buildKPIResult('net_profit_margin', 'Net Profit Margin', netMargins, sortedData.map(d => d.year), netMarginBenchmark, true, 'percentage'));

  // Return on Assets
  const roaBenchmark = benchmarks['return_on_assets'] ?? DEFAULT_INDUSTRY_BENCHMARKS.return_on_assets.value;
  const roaValues = sortedData.map(d => safeRatio(d.data.pretax_income, d.data.total_assets));
  results.push(buildKPIResult('return_on_assets', 'Return on Assets (ROA)', roaValues, sortedData.map(d => d.year), roaBenchmark, true, 'percentage'));

  // Return on Equity
  const roeBenchmark = benchmarks['return_on_equity'] ?? DEFAULT_INDUSTRY_BENCHMARKS.return_on_equity.value;
  const roeValues = sortedData.map(d => {
    const equity = calculateEquity(d.data);
    return safeRatio(d.data.pretax_income, equity);
  });
  results.push(buildKPIResult('return_on_equity', 'Return on Equity (ROE)', roeValues, sortedData.map(d => d.year), roeBenchmark, true, 'percentage'));

  // Current Ratio
  const currentRatioBenchmark = benchmarks['current_ratio'] ?? DEFAULT_INDUSTRY_BENCHMARKS.current_ratio.value;
  const currentRatios = sortedData.map(d => {
    const currentAssets = calculateTotalCurrentAssets(d.data);
    const currentLiabilities = calculateTotalCurrentLiabilities(d.data);
    return safeRatio(currentAssets, currentLiabilities);
  });
  results.push(buildKPIResult('current_ratio', 'Current Ratio', currentRatios, sortedData.map(d => d.year), currentRatioBenchmark, true, 'ratio'));

  // Quick Ratio
  const quickRatioBenchmark = benchmarks['quick_ratio'] ?? DEFAULT_INDUSTRY_BENCHMARKS.quick_ratio.value;
  const quickRatios = sortedData.map(d => {
    const currentAssets = calculateTotalCurrentAssets(d.data);
    const currentLiabilities = calculateTotalCurrentLiabilities(d.data);
    const quickAssets = (currentAssets || 0) - (d.data.inventory || 0);
    return safeRatio(quickAssets, currentLiabilities);
  });
  results.push(buildKPIResult('quick_ratio', 'Quick Ratio', quickRatios, sortedData.map(d => d.year), quickRatioBenchmark, true, 'ratio'));

  // Debt-to-Equity
  const deBenchmark = benchmarks['debt_to_equity'] ?? DEFAULT_INDUSTRY_BENCHMARKS.debt_to_equity.value;
  const deRatios = sortedData.map(d => {
    const debt = calculateTotalDebt(d.data);
    const equity = calculateEquity(d.data);
    return safeRatio(debt, equity);
  });
  results.push(buildKPIResult('debt_to_equity', 'Debt-to-Equity Ratio', deRatios, sortedData.map(d => d.year), deBenchmark, false, 'ratio'));

  // Asset Turnover
  const atBenchmark = benchmarks['asset_turnover'] ?? DEFAULT_INDUSTRY_BENCHMARKS.asset_turnover.value;
  const atValues = sortedData.map(d => safeRatio(d.data.revenue, d.data.total_assets));
  results.push(buildKPIResult('asset_turnover', 'Asset Turnover', atValues, sortedData.map(d => d.year), atBenchmark, true, 'times'));

  // Inventory Turnover
  const itBenchmark = benchmarks['inventory_turnover'] ?? DEFAULT_INDUSTRY_BENCHMARKS.inventory_turnover.value;
  const itValues = sortedData.map(d => {
    if (!d.data.inventory || d.data.inventory === 0) return null;
    // Estimate COGS as ~70% of revenue for turnover calculation
    const estimatedCOGS = d.data.revenue * 0.7;
    return estimatedCOGS / d.data.inventory;
  });
  results.push(buildKPIResult('inventory_turnover', 'Inventory Turnover', itValues, sortedData.map(d => d.year), itBenchmark, true, 'times'));

  // Receivables Turnover
  const rtBenchmark = benchmarks['receivables_turnover'] ?? DEFAULT_INDUSTRY_BENCHMARKS.receivables_turnover.value;
  const rtValues = sortedData.map(d => safeRatio(d.data.revenue, d.data.accounts_receivable));
  results.push(buildKPIResult('receivables_turnover', 'Receivables Turnover', rtValues, sortedData.map(d => d.year), rtBenchmark, true, 'times'));

  // SDE/Revenue Ratio
  const sdeBenchmark = benchmarks['sde_to_revenue'] ?? DEFAULT_INDUSTRY_BENCHMARKS.sde_to_revenue.value;
  const sdeRatios = sortedData.map(d => {
    const sde = calculateSDE(d.data);
    return safeRatio(sde, d.data.revenue);
  });
  results.push(buildKPIResult('sde_to_revenue', 'SDE/Revenue Ratio', sdeRatios, sortedData.map(d => d.year), sdeBenchmark, true, 'percentage'));

  return results;
}

/**
 * Calculate SDE (Seller's Discretionary Earnings) from financial data
 */
function calculateSDE(data: FinancialData): number | null {
  if (!data.pretax_income) return null;

  const sde = (data.pretax_income || 0)
    + (data.owner_compensation || 0)
    + (data.interest_expense || 0)
    + (data.depreciation_amortization || data.non_cash_expenses || 0);

  return sde;
}

/**
 * Helper function to build a KPI result object
 */
function buildKPIResult(
  id: string,
  name: string,
  values: (number | null)[],
  years: number[],
  benchmark: number,
  higherIsBetter: boolean,
  format: 'percentage' | 'ratio' | 'days' | 'times'
): KPIDetailedResult {
  const historicalValues = values.map((value, index) => {
    const performance = classifyPerformance(value, benchmark, higherIsBetter);
    const vsIndustry = value !== null && benchmark !== 0
      ? ((value - benchmark) / Math.abs(benchmark)) * 100
      : null;

    return {
      year: years[index],
      value,
      performance,
      vsIndustry,
    };
  });

  const trend = calculateTrend(values);
  const currentValue = values.length > 0 ? values[0] : null;
  const overallPerformance = classifyPerformance(currentValue, benchmark, higherIsBetter);

  return {
    id,
    name,
    currentValue,
    historicalValues,
    benchmark,
    trend,
    overallPerformance,
    format,
    higherIsBetter,
  };
}

/**
 * Format KPI detailed value for display
 */
export function formatKPIValue(value: number | null, format: 'percentage' | 'ratio' | 'days' | 'times'): string {
  if (value === null) return 'N/A';

  switch (format) {
    case 'percentage':
      return `${(value * 100).toFixed(1)}%`;
    case 'ratio':
      return value.toFixed(2);
    case 'days':
      return `${Math.round(value)} days`;
    case 'times':
      return `${value.toFixed(1)}x`;
    default:
      return value.toString();
  }
}
