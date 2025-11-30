/**
 * Server-side valuation calculation validation and correction
 * 
 * This module ensures that AI-generated valuations are mathematically correct
 * by recalculating key metrics and correcting any errors.
 */

export interface FinancialData {
  revenue?: number;
  pretax_income?: number;
  net_income?: number;
  owner_compensation?: number;
  officer_compensation?: number;
  interest_expense?: number;
  depreciation?: number;
  amortization?: number;
  ebitda?: number;
  sde?: number;
  total_assets?: number;
  total_liabilities?: number;
  cash?: number;
  accounts_receivable?: number;
  inventory?: number;
  fixed_assets?: number;
  intangible_assets?: number;
}

export interface ValuationData {
  // Financial metrics
  revenue?: number;
  ebitda?: number;
  sde?: number;
  
  // Three approaches
  asset_approach_value?: number;
  asset_approach_weight?: number;
  income_approach_value?: number;
  income_approach_weight?: number;
  market_approach_value?: number;
  market_approach_weight?: number;
  
  // Final valuation
  valuation_amount?: number;
  valuation_range_low?: number;
  valuation_range_high?: number;
  
  // Industry data
  industry_name?: string;
  naics_code?: string;
  revenue_multiple?: number;
  ebitda_multiple?: number;
  sde_multiple?: number;
}

/**
 * Calculate SDE (Seller's Discretionary Earnings) from financial data
 */
export function calculateSDE(financial: FinancialData): number | null {
  // If SDE is already provided and seems reasonable, use it
  if (financial.sde && financial.sde > 0) {
    // Validate it's not obviously wrong
    if (financial.revenue && financial.sde > financial.revenue) {
      console.warn(`[CALC] SDE (${financial.sde}) exceeds revenue (${financial.revenue}), recalculating...`);
    } else {
      return financial.sde;
    }
  }
  
  // Calculate SDE from components
  const pretaxIncome = financial.pretax_income || financial.net_income || 0;
  const ownerComp = financial.owner_compensation || financial.officer_compensation || 0;
  const interest = financial.interest_expense || 0;
  const depreciation = financial.depreciation || 0;
  const amortization = financial.amortization || 0;
  
  // SDE = Pretax Income + Owner Comp + Interest + Depreciation + Amortization
  const calculatedSDE = pretaxIncome + ownerComp + interest + depreciation + amortization;
  
  console.log(`[CALC] SDE Calculation:`);
  console.log(`  Pretax Income: ${pretaxIncome}`);
  console.log(`  Owner/Officer Compensation: ${ownerComp}`);
  console.log(`  Interest: ${interest}`);
  console.log(`  Depreciation: ${depreciation}`);
  console.log(`  Amortization: ${amortization}`);
  console.log(`  Total SDE: ${calculatedSDE}`);
  
  return calculatedSDE > 0 ? calculatedSDE : null;
}

/**
 * Calculate EBITDA from financial data
 */
export function calculateEBITDA(financial: FinancialData): number | null {
  // If EBITDA is already provided and seems reasonable, use it
  if (financial.ebitda && financial.ebitda > 0) {
    return financial.ebitda;
  }
  
  // Calculate EBITDA from components
  const pretaxIncome = financial.pretax_income || financial.net_income || 0;
  const interest = financial.interest_expense || 0;
  const depreciation = financial.depreciation || 0;
  const amortization = financial.amortization || 0;
  
  // EBITDA = Pretax Income + Interest + Depreciation + Amortization
  const calculatedEBITDA = pretaxIncome + interest + depreciation + amortization;
  
  console.log(`[CALC] EBITDA Calculation:`);
  console.log(`  Pretax Income: ${pretaxIncome}`);
  console.log(`  Interest: ${interest}`);
  console.log(`  Depreciation: ${depreciation}`);
  console.log(`  Amortization: ${amortization}`);
  console.log(`  Total EBITDA: ${calculatedEBITDA}`);
  
  return calculatedEBITDA > 0 ? calculatedEBITDA : null;
}

/**
 * Validate and correct weighted average calculation
 */
export function validateWeightedAverage(data: ValuationData): ValuationData {
  const {
    asset_approach_value,
    asset_approach_weight,
    income_approach_value,
    income_approach_weight,
    market_approach_value,
    market_approach_weight,
    valuation_amount,
  } = data;
  
  // Check if we have all required data
  if (!asset_approach_value || !income_approach_value || !market_approach_value ||
      asset_approach_weight === undefined || income_approach_weight === undefined || market_approach_weight === undefined) {
    console.log(`[CALC] Missing approach data, cannot validate weighted average`);
    return data;
  }
  
  // Calculate correct weighted average (NO ROUNDING)
  const calculatedWeightedAvg = 
    (asset_approach_value * asset_approach_weight) +
    (income_approach_value * income_approach_weight) +
    (market_approach_value * market_approach_weight);
  
  console.log(`[CALC] Weighted Average Validation:`);
  console.log(`  Asset: $${asset_approach_value.toLocaleString()} × ${asset_approach_weight} = $${(asset_approach_value * asset_approach_weight).toLocaleString()}`);
  console.log(`  Income: $${income_approach_value.toLocaleString()} × ${income_approach_weight} = $${(income_approach_value * income_approach_weight).toLocaleString()}`);
  console.log(`  Market: $${market_approach_value.toLocaleString()} × ${market_approach_weight} = $${(market_approach_value * market_approach_weight).toLocaleString()}`);
  console.log(`  Calculated Weighted Avg: $${calculatedWeightedAvg.toLocaleString()}`);
  console.log(`  AI Provided: $${valuation_amount?.toLocaleString()}`);
  
  const difference = valuation_amount ? Math.abs(calculatedWeightedAvg - valuation_amount) : Infinity;
  const tolerance = 100; // Allow $100 rounding difference
  
  if (difference > tolerance) {
    console.warn(`[CALC] ⚠️  WEIGHTED AVERAGE MISMATCH! Difference: $${difference.toLocaleString()}`);
    console.warn(`[CALC] Correcting from $${valuation_amount?.toLocaleString()} to $${calculatedWeightedAvg.toLocaleString()}`);
    
    // Update with precise value (NO ROUNDING)
    data.valuation_amount = calculatedWeightedAvg;
    
    // Recalculate range if it exists
    if (data.valuation_range_low && data.valuation_range_high && valuation_amount) {
      const rangePercentage = (data.valuation_range_high - data.valuation_range_low) / 2 / valuation_amount;
      data.valuation_range_low = calculatedWeightedAvg * (1 - rangePercentage);
      data.valuation_range_high = calculatedWeightedAvg * (1 + rangePercentage);
      console.log(`[CALC] Recalculated range: $${data.valuation_range_low.toLocaleString()} - $${data.valuation_range_high.toLocaleString()}`);
    }
  } else {
    console.log(`[CALC] ✅ Weighted average is correct (difference: $${difference.toLocaleString()})`);
  }
  
  return data;
}

/**
 * Validate individual approach calculations
 */
export function validateApproachCalculations(data: ValuationData, financial: FinancialData): ValuationData {
  console.log(`[CALC] Validating individual approach calculations...`);
  
  // Get or calculate SDE
  const sde = calculateSDE(financial);
  const ebitda = calculateEBITDA(financial);
  const revenue = financial.revenue;
  
  if (sde) {
    data.sde = sde;
    console.log(`[CALC] Validated SDE: $${sde.toLocaleString()}`);
  }
  
  if (ebitda) {
    data.ebitda = ebitda;
    console.log(`[CALC] Validated EBITDA: $${ebitda.toLocaleString()}`);
  }
  
  if (revenue) {
    data.revenue = revenue;
    console.log(`[CALC] Revenue: $${revenue.toLocaleString()}`);
  }
  
  // Validate Income Approach if we have SDE/EBITDA and multiples
  if (data.income_approach_value && (sde || ebitda)) {
    const primaryMetric = sde || ebitda;
    const multiple = data.sde_multiple || data.ebitda_multiple;
    
    if (multiple && primaryMetric) {
      const expectedValue = primaryMetric * multiple;
      const difference = Math.abs(expectedValue - data.income_approach_value);
      const tolerance = expectedValue * 0.20; // 20% tolerance
      
      console.log(`[CALC] Income Approach Validation:`);
      console.log(`  Primary Metric (${sde ? 'SDE' : 'EBITDA'}): $${primaryMetric.toLocaleString()}`);
      console.log(`  Multiple: ${multiple}x`);
      console.log(`  Expected Value: $${expectedValue.toLocaleString()}`);
      console.log(`  AI Provided: $${data.income_approach_value.toLocaleString()}`);
      console.log(`  Difference: $${difference.toLocaleString()} (${(difference / expectedValue * 100).toFixed(1)}%)`);
      
      if (difference > tolerance) {
        console.warn(`[CALC] ⚠️  INCOME APPROACH MISMATCH! Correcting...`);
        data.income_approach_value = expectedValue;
      } else {
        console.log(`[CALC] ✅ Income Approach is reasonable`);
      }
    }
  }
  
  // Validate Market Approach if we have revenue and multiple
  if (data.market_approach_value && revenue && data.revenue_multiple) {
    const expectedValue = revenue * data.revenue_multiple;
    const difference = Math.abs(expectedValue - data.market_approach_value);
    const tolerance = expectedValue * 0.20; // 20% tolerance
    
    console.log(`[CALC] Market Approach Validation:`);
    console.log(`  Revenue: $${revenue.toLocaleString()}`);
    console.log(`  Multiple: ${data.revenue_multiple}x`);
    console.log(`  Expected Value: $${expectedValue.toLocaleString()}`);
    console.log(`  AI Provided: $${data.market_approach_value.toLocaleString()}`);
    console.log(`  Difference: $${difference.toLocaleString()} (${(difference / expectedValue * 100).toFixed(1)}%)`);
    
    if (difference > tolerance) {
      console.warn(`[CALC] ⚠️  MARKET APPROACH MISMATCH! Correcting...`);
      data.market_approach_value = expectedValue;
    } else {
      console.log(`[CALC] ✅ Market Approach is reasonable`);
    }
  }
  
  return data;
}

/**
 * Main validation function - validates all calculations
 */
export function validateValuationCalculations(
  valuationData: ValuationData,
  financialData: FinancialData
): ValuationData {
  console.log(`[CALC] ========== STARTING CALCULATION VALIDATION ==========`);
  
  // Step 1: Validate individual approach calculations
  let correctedData = validateApproachCalculations(valuationData, financialData);
  
  // Step 2: Validate weighted average
  correctedData = validateWeightedAverage(correctedData);
  
  console.log(`[CALC] ========== VALIDATION COMPLETE ==========`);
  console.log(`[CALC] Final Valuation: $${correctedData.valuation_amount?.toLocaleString()}`);
  
  return correctedData;
}
