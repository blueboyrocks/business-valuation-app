/**
 * Server-Side Valuation Calculation Engine
 * 
 * This module performs ALL valuation calculations server-side.
 * AI only extracts data and provides qualitative analysis.
 * 
 * Calculations are done with precise math (no rounding until final display).
 */

import industryMultiplesDatabase from './industry-multiples-database.json';

export interface ExtractedFinancialData {
  // Core financial metrics (extracted by AI)
  revenue: number;
  pretax_income: number;
  owner_compensation: number;
  interest_expense: number;
  depreciation_amortization: number;
  total_assets: number;
  total_liabilities: number;
  
  // Optional additional data
  cash?: number;
  accounts_receivable?: number;
  inventory?: number;
  fixed_assets?: number;
  intangible_assets?: number;
  accounts_payable?: number;
  current_liabilities?: number;
  long_term_debt?: number;
}

export interface IndustryData {
  naics_code: string;
  industry_name: string;
}

export interface ValuationWeights {
  asset_weight: number;    // 0.0 to 1.0
  income_weight: number;   // 0.0 to 1.0
  market_weight: number;   // 0.0 to 1.0
}

export interface CalculatedValuation {
  // Calculated financial metrics
  ebitda: number;
  sde: number;
  net_assets: number;
  
  // Industry multiples used
  revenue_multiple: number;
  ebitda_multiple: number;
  sde_multiple: number;
  
  // Three approach values
  asset_approach_value: number;
  income_approach_value: number;
  market_approach_value: number;
  
  // Weights
  asset_approach_weight: number;
  income_approach_weight: number;
  market_approach_weight: number;
  
  // Final valuation
  valuation_amount: number;
  valuation_range_low: number;
  valuation_range_high: number;
  
  // Calculation details for transparency
  calculation_notes: string[];
}

/**
 * Calculate EBITDA from financial components
 */
export function calculateEBITDA(financial: ExtractedFinancialData): number {
  // EBITDA = Pretax Income + Interest + Depreciation + Amortization
  const ebitda = 
    financial.pretax_income +
    financial.interest_expense +
    financial.depreciation_amortization;
  
  return ebitda;
}

/**
 * Calculate SDE (Seller's Discretionary Earnings) from financial components
 */
export function calculateSDE(financial: ExtractedFinancialData): number {
  // SDE = Pretax Income + Owner Compensation + Interest + Depreciation + Amortization
  const sde = 
    financial.pretax_income +
    financial.owner_compensation +
    financial.interest_expense +
    financial.depreciation_amortization;
  
  return sde;
}

/**
 * Get industry multiples from database
 */
export function getIndustryMultiples(naicsCode: string): {
  revenue_multiple: number;
  ebitda_multiple: number;
  sde_multiple: number;
} {
  // Find industry in database by NAICS code
  const database = industryMultiplesDatabase as { industries: any[] };
  const industry = database.industries.find(
    (ind) => ind.naics_code === naicsCode
  );
  
  if (!industry) {
    console.warn(`[ENGINE] Industry not found for NAICS ${naicsCode}, using default multiples`);
    return {
      revenue_multiple: 1.0,
      ebitda_multiple: 5.0,
      sde_multiple: 3.0,
    };
  }
  
  return {
    revenue_multiple: industry.revenue_multiple || 1.0,
    ebitda_multiple: industry.ebitda_multiple || 5.0,
    sde_multiple: industry.sde_multiple || 3.0,
  };
}

/**
 * Calculate Asset Approach value
 */
export function calculateAssetApproach(financial: ExtractedFinancialData): number {
  // Asset Approach = Total Assets - Total Liabilities
  // This is a simplified approach; in practice, assets would be adjusted to fair market value
  const netAssets = financial.total_assets - financial.total_liabilities;
  
  // Add adjustments for intangible assets if provided
  const intangibleValue = financial.intangible_assets || 0;
  
  // Asset approach value
  const assetValue = netAssets + intangibleValue;
  
  return Math.max(assetValue, 0); // Can't be negative
}

/**
 * Calculate Income Approach value
 */
export function calculateIncomeApproach(
  financial: ExtractedFinancialData,
  sde: number,
  ebitda: number,
  sdeMultiple: number,
  ebitdaMultiple: number
): number {
  // For owner-operated businesses (high owner compensation), use SDE
  // For professionally managed businesses, use EBITDA
  
  const ownerCompPercentage = financial.owner_compensation / financial.revenue;
  
  let incomeValue: number;
  let method: string;
  
  if (ownerCompPercentage > 0.15) {
    // Owner-operated: use SDE
    incomeValue = sde * sdeMultiple;
    method = 'SDE';
  } else {
    // Professionally managed: use EBITDA
    incomeValue = ebitda * ebitdaMultiple;
    method = 'EBITDA';
  }
  
  console.log(`[ENGINE] Income Approach using ${method}: ${method === 'SDE' ? sde : ebitda} × ${method === 'SDE' ? sdeMultiple : ebitdaMultiple} = ${incomeValue}`);
  
  return incomeValue;
}

/**
 * Calculate Market Approach value
 */
export function calculateMarketApproach(
  financial: ExtractedFinancialData,
  revenueMultiple: number
): number {
  // Market Approach = Revenue × Revenue Multiple
  const marketValue = financial.revenue * revenueMultiple;
  
  console.log(`[ENGINE] Market Approach: ${financial.revenue} × ${revenueMultiple} = ${marketValue}`);
  
  return marketValue;
}

/**
 * Determine appropriate weights for each approach
 */
export function determineWeights(
  financial: ExtractedFinancialData,
  industry: IndustryData
): ValuationWeights {
  // Default weights
  let assetWeight = 0.20;
  let incomeWeight = 0.40;
  let marketWeight = 0.40;
  
  // Adjust based on business characteristics
  
  // Asset-intensive businesses: increase asset weight
  const assetIntensity = financial.total_assets / financial.revenue;
  if (assetIntensity > 2.0) {
    assetWeight = 0.30;
    incomeWeight = 0.35;
    marketWeight = 0.35;
  }
  
  // Service businesses with low assets: decrease asset weight
  if (assetIntensity < 0.5) {
    assetWeight = 0.10;
    incomeWeight = 0.45;
    marketWeight = 0.45;
  }
  
  // Ensure weights sum to 1.0
  const total = assetWeight + incomeWeight + marketWeight;
  assetWeight = assetWeight / total;
  incomeWeight = incomeWeight / total;
  marketWeight = marketWeight / total;
  
  console.log(`[ENGINE] Weights: Asset ${(assetWeight * 100).toFixed(0)}%, Income ${(incomeWeight * 100).toFixed(0)}%, Market ${(marketWeight * 100).toFixed(0)}%`);
  
  return { asset_weight: assetWeight, income_weight: incomeWeight, market_weight: marketWeight };
}

/**
 * Main valuation calculation engine
 */
export function calculateValuation(
  financial: ExtractedFinancialData,
  industry: IndustryData
): CalculatedValuation {
  console.log(`[ENGINE] ========== STARTING VALUATION CALCULATION ==========`);
  console.log(`[ENGINE] Company: ${industry.industry_name} (NAICS: ${industry.naics_code})`);
  
  // Defensive checks - ensure all required fields are numbers
  const safeFinancial: ExtractedFinancialData = {
    revenue: Number(financial.revenue) || 0,
    pretax_income: Number(financial.pretax_income) || 0,
    owner_compensation: Number(financial.owner_compensation) || 0,
    interest_expense: Number(financial.interest_expense) || 0,
    depreciation_amortization: Number(financial.depreciation_amortization) || 0,
    total_assets: Number(financial.total_assets) || 0,
    total_liabilities: Number(financial.total_liabilities) || 0,
    cash: financial.cash ? Number(financial.cash) : undefined,
    accounts_receivable: financial.accounts_receivable ? Number(financial.accounts_receivable) : undefined,
    inventory: financial.inventory ? Number(financial.inventory) : undefined,
    fixed_assets: financial.fixed_assets ? Number(financial.fixed_assets) : undefined,
    intangible_assets: financial.intangible_assets ? Number(financial.intangible_assets) : undefined,
    accounts_payable: financial.accounts_payable ? Number(financial.accounts_payable) : undefined,
    current_liabilities: financial.current_liabilities ? Number(financial.current_liabilities) : undefined,
    long_term_debt: financial.long_term_debt ? Number(financial.long_term_debt) : undefined,
  };
  
  console.log(`[ENGINE] Revenue: $${safeFinancial.revenue.toLocaleString()}`);
  console.log(`[ENGINE] Pretax Income: $${safeFinancial.pretax_income.toLocaleString()}`);
  console.log(`[ENGINE] Total Assets: $${safeFinancial.total_assets.toLocaleString()}`);
  console.log(`[ENGINE] Total Liabilities: $${safeFinancial.total_liabilities.toLocaleString()}`);
  
  const notes: string[] = [];
  
  // Use safeFinancial for all calculations
  financial = safeFinancial;
  
  // Step 1: Calculate EBITDA and SDE
  const ebitda = calculateEBITDA(financial);
  const sde = calculateSDE(financial);
  
  console.log(`[ENGINE] EBITDA: $${ebitda.toLocaleString()}`);
  console.log(`[ENGINE] SDE: $${sde.toLocaleString()}`);
  
  notes.push(`EBITDA calculated as: Pretax Income ($${financial.pretax_income.toLocaleString()}) + Interest ($${financial.interest_expense.toLocaleString()}) + D&A ($${financial.depreciation_amortization.toLocaleString()}) = $${ebitda.toLocaleString()}`);
  notes.push(`SDE calculated as: Pretax Income ($${financial.pretax_income.toLocaleString()}) + Owner Comp ($${financial.owner_compensation.toLocaleString()}) + Interest ($${financial.interest_expense.toLocaleString()}) + D&A ($${financial.depreciation_amortization.toLocaleString()}) = $${sde.toLocaleString()}`);
  
  // Step 2: Get industry multiples
  const multiples = getIndustryMultiples(industry.naics_code);
  
  console.log(`[ENGINE] Industry Multiples: Revenue ${multiples.revenue_multiple}x, EBITDA ${multiples.ebitda_multiple}x, SDE ${multiples.sde_multiple}x`);
  
  notes.push(`Industry multiples for ${industry.industry_name}: Revenue ${multiples.revenue_multiple}x, EBITDA ${multiples.ebitda_multiple}x, SDE ${multiples.sde_multiple}x`);
  
  // Step 3: Calculate three approaches
  const assetValue = calculateAssetApproach(financial);
  const incomeValue = calculateIncomeApproach(financial, sde, ebitda, multiples.sde_multiple, multiples.ebitda_multiple);
  const marketValue = calculateMarketApproach(financial, multiples.revenue_multiple);
  
  console.log(`[ENGINE] Asset Approach: $${assetValue.toLocaleString()}`);
  console.log(`[ENGINE] Income Approach: $${incomeValue.toLocaleString()}`);
  console.log(`[ENGINE] Market Approach: $${marketValue.toLocaleString()}`);
  
  notes.push(`Asset Approach: Total Assets ($${financial.total_assets.toLocaleString()}) - Total Liabilities ($${financial.total_liabilities.toLocaleString()}) = $${assetValue.toLocaleString()}`);
  notes.push(`Income Approach: ${sde > ebitda * 1.2 ? 'SDE' : 'EBITDA'} × Multiple = $${incomeValue.toLocaleString()}`);
  notes.push(`Market Approach: Revenue ($${financial.revenue.toLocaleString()}) × ${multiples.revenue_multiple}x = $${marketValue.toLocaleString()}`);
  
  // Step 4: Determine weights
  const weights = determineWeights(financial, industry);
  
  notes.push(`Weights determined: Asset ${(weights.asset_weight * 100).toFixed(0)}%, Income ${(weights.income_weight * 100).toFixed(0)}%, Market ${(weights.market_weight * 100).toFixed(0)}%`);
  
  // Step 5: Calculate weighted average (PRECISE - NO ROUNDING)
  const weightedAverage = 
    (assetValue * weights.asset_weight) +
    (incomeValue * weights.income_weight) +
    (marketValue * weights.market_weight);
  
  console.log(`[ENGINE] Weighted Average Calculation:`);
  console.log(`  Asset: $${assetValue.toLocaleString()} × ${weights.asset_weight.toFixed(2)} = $${(assetValue * weights.asset_weight).toLocaleString()}`);
  console.log(`  Income: $${incomeValue.toLocaleString()} × ${weights.income_weight.toFixed(2)} = $${(incomeValue * weights.income_weight).toLocaleString()}`);
  console.log(`  Market: $${marketValue.toLocaleString()} × ${weights.market_weight.toFixed(2)} = $${(marketValue * weights.market_weight).toLocaleString()}`);
  console.log(`  TOTAL: $${weightedAverage.toLocaleString()}`);
  
  notes.push(`Final Valuation: ($${assetValue.toLocaleString()} × ${weights.asset_weight.toFixed(2)}) + ($${incomeValue.toLocaleString()} × ${weights.income_weight.toFixed(2)}) + ($${marketValue.toLocaleString()} × ${weights.market_weight.toFixed(2)}) = $${weightedAverage.toLocaleString()}`);
  
  // Step 6: Calculate value range (±7%)
  const rangeLow = weightedAverage * 0.93;
  const rangeHigh = weightedAverage * 1.07;
  
  console.log(`[ENGINE] Value Range: $${rangeLow.toLocaleString()} - $${rangeHigh.toLocaleString()}`);
  
  notes.push(`Value range: ±7% of midpoint = $${rangeLow.toLocaleString()} to $${rangeHigh.toLocaleString()}`);
  
  console.log(`[ENGINE] ========== CALCULATION COMPLETE ==========`);
  
  return {
    ebitda,
    sde,
    net_assets: financial.total_assets - financial.total_liabilities,
    revenue_multiple: multiples.revenue_multiple,
    ebitda_multiple: multiples.ebitda_multiple,
    sde_multiple: multiples.sde_multiple,
    asset_approach_value: assetValue,
    income_approach_value: incomeValue,
    market_approach_value: marketValue,
    asset_approach_weight: weights.asset_weight,
    income_approach_weight: weights.income_weight,
    market_approach_weight: weights.market_weight,
    valuation_amount: weightedAverage,
    valuation_range_low: rangeLow,
    valuation_range_high: rangeHigh,
    calculation_notes: notes,
  };
}
