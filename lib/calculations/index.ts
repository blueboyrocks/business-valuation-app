/**
 * Calculation Engine - Main Export
 *
 * This module provides deterministic calculation functions for business valuation.
 * All math is performed in TypeScript code for 100% accuracy and auditability.
 */

// Main engine
export { runCalculationEngine, DEFAULT_CONFIG, ENGINE_VERSION } from './calculation-engine';

// Individual calculators
export {
  calculateNormalizedEarnings,
  formatEarningsTables,
  calculateSDEForYear,
  calculateEBITDAForYear,
} from './earnings-calculator';

export {
  calculateAssetApproach,
  formatAssetApproachTable,
} from './asset-approach-calculator';

export {
  calculateIncomeApproach,
  formatIncomeApproachTable,
  calculateCapitalizationRate,
  DEFAULT_CAP_RATE_COMPONENTS,
} from './income-approach-calculator';

export {
  calculateMarketApproach,
  formatMarketApproachTable,
  applyMultipleAdjustments,
  riskFactorsToAdjustments,
} from './market-approach-calculator';

export {
  calculateValuationSynthesis,
  formatSynthesisTable,
  calculateWeightedValue,
  applyDiscountsAndPremiums,
  DEFAULT_DLOM,
  DEFAULT_VALUE_RANGE_PERCENT,
} from './synthesis-calculator';

// Data mapper
export { mapPassOutputsToEngineInputs, safeGet } from './pass-data-mapper';

// Utilities
export {
  formatCurrency,
  formatPercentage,
  formatMultiple,
  roundToDollar,
  roundToThousand,
  roundToDecimals,
  safeDivide,
  safeNumber,
  clamp,
  calculateWeightedAverage,
  validateWeights,
  validatePositive,
  validatePercentage,
  createStep,
  resetStepCounter,
  getStepCount,
  createTable,
  tableRow,
  tableSeparator,
  parseCurrency,
  parsePercentage,
} from './utils';

// Types
export type {
  // Input types
  SingleYearFinancials,
  MultiYearFinancials,
  BalanceSheetData,
  MultipleRange,
  IndustryData,
  RiskFactor,
  RiskAssessmentData,
  // Calculation step
  CalculationStep,
  // Earnings types
  AddBackItem,
  SDEYearCalculation,
  EBITDAYearCalculation,
  NormalizedEarningsResult,
  // Asset approach types
  AssetAdjustment,
  AssetApproachCalculation,
  // Income approach types
  CapRateComponents,
  IncomeApproachCalculation,
  // Market approach types
  MultipleAdjustment,
  MarketApproachCalculation,
  // Synthesis types
  ApproachSummary,
  DiscountsAndPremiums,
  ValueRange,
  ValuationSynthesis,
  // Engine types
  CalculationEngineInputs,
  CalculationConfig,
  CalculationEngineOutput,
  ValidationResult,
  FormatOptions,
} from './types';
