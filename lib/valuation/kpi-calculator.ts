/**
 * KPI Calculator
 * Calculates Key Performance Indicators from financial data
 */

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
