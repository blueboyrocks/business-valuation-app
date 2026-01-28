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

// Extended calculators
export {
  calculateAllKPIs,
  formatKPITable,
  type KPICalculatorInputs,
} from './kpi-calculator';

export {
  calculateRiskScoring,
  scoreRiskFactor,
  RISK_RUBRICS,
  type RiskScoringInputs,
} from './risk-scoring-calculator';

export {
  calculateDataQuality,
  VALUABLE_DOCUMENTS,
  CRITICAL_FIELDS,
  IMPORTANT_FIELDS,
  type DataQualityInputs,
} from './data-quality-scorer';

export {
  calculateWorkingCapital,
  INDUSTRY_WC_BENCHMARKS,
  type WorkingCapitalInputs,
} from './working-capital-calculator';

export {
  validateTaxFormData,
  FORM_1120S_RULES,
  FORM_1120_RULES,
  FORM_1065_RULES,
  SCHEDULE_C_RULES,
  UNIVERSAL_RULES,
  type TaxFormValidationInputs,
} from './tax-form-validator';

export {
  runCalculationOrchestrator,
} from './calculation-orchestrator';

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
  AssetApproachSource,
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

// Extended types
export type {
  // KPI types
  IndustryBenchmark,
  KPIRating,
  KPIResult,
  KPICategory,
  KPICalculationResult,
  ChartDataPoint,
  // Risk scoring types
  RiskScoringRubric,
  ScoredRiskFactor,
  RiskScoringResult,
  // Data quality types
  FieldStatus,
  DocumentStatus,
  DataImprovementRecommendation,
  DataQualityAssessment,
  MissingDataItem,
  ImprovementRecommendation,
  DocumentType,
  DataQualityCategoryScore,
  DataQualityResult,
  // Working capital types
  WorkingCapitalAnalysis,
  WorkingCapitalComponent,
  WorkingCapitalTrend,
  WorkingCapitalResult,
  // Tax validation types
  TaxFormType,
  TaxValidationRule,
  TaxValidationResult,
  TaxFormValidation,
  ValidationRule,
  ValidationError,
  ValidationWarning,
  TaxFormValidationResult,
  // Extended output
  ExtendedCalculationOutput,
} from './extended-types';

// Orchestrator types
export type {
  OrchestratorInputs,
  OrchestratorResult,
  OrchestratorSummary,
} from './calculation-orchestrator';
