/**
 * Calculation Orchestrator
 *
 * Central coordinator for all deterministic calculators.
 * Manages execution order, data flow, and result aggregation.
 */

import { calculateAllKPIs } from './kpi-calculator';
import { calculateRiskScoring, RiskScoringInputs } from './risk-scoring-calculator';
import { calculateDataQuality, DataQualityInputs } from './data-quality-scorer';
import { calculateWorkingCapital, WorkingCapitalInputs } from './working-capital-calculator';
import { validateTaxFormData, TaxFormValidationInputs } from './tax-form-validator';
import {
  KPICalculationResult,
  RiskScoringResult,
  DataQualityResult,
  WorkingCapitalResult,
  TaxFormValidationResult,
  TaxFormType,
  IndustryBenchmark,
} from './extended-types';
import { SingleYearFinancials, BalanceSheetData } from './types';

export interface OrchestratorInputs {
  financials: SingleYearFinancials[];
  balance_sheet?: BalanceSheetData;
  company_name: string;
  industry: string;
  naics_code?: string;
  tax_form_type: TaxFormType;
  documents_provided?: string[];
  risk_inputs?: Partial<RiskScoringInputs>;
  industry_benchmarks?: Record<string, IndustryBenchmark>;
}

export interface OrchestratorResult {
  execution_id: string;
  executed_at: string;
  execution_time_ms: number;

  data_quality: DataQualityResult;
  can_proceed: boolean;
  tax_validation: TaxFormValidationResult;
  kpis?: KPICalculationResult;
  risk_scoring?: RiskScoringResult;
  working_capital?: WorkingCapitalResult;

  errors: Array<{ component: string; error: string; recoverable: boolean }>;
  summary: OrchestratorSummary;
}

export interface OrchestratorSummary {
  overall_data_quality_score: number;
  overall_financial_health: string;
  overall_risk_rating: string;
  working_capital_status: string;
  key_findings: string[];
  recommendations: string[];
}

/**
 * Execute all deterministic calculations in sequence
 */
export async function runCalculationOrchestrator(
  inputs: OrchestratorInputs
): Promise<OrchestratorResult> {
  const startTime = Date.now();
  const executionId = `calc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const errors: OrchestratorResult['errors'] = [];
  const keyFindings: string[] = [];
  const recommendations: string[] = [];

  // STEP 1: Data Quality Assessment
  let dataQuality: DataQualityResult;
  try {
    dataQuality = calculateDataQuality({
      financials: inputs.financials,
      balance_sheet: inputs.balance_sheet,
      documents_provided: inputs.documents_provided,
      company_name: inputs.company_name,
      industry: inputs.industry,
    });

    if (dataQuality.overall_score < 40) {
      keyFindings.push(`Data quality score is low (${dataQuality.overall_score}/100).`);
    }
    recommendations.push(...dataQuality.recommendations.slice(0, 3).map(r => r.action));
  } catch (error) {
    errors.push({ component: 'DataQuality', error: String(error), recoverable: false });
    dataQuality = createEmptyDataQualityResult();
  }

  const canProceed = dataQuality.can_proceed_with_valuation;

  // STEP 2: Tax Form Validation
  let taxValidation: TaxFormValidationResult;
  try {
    taxValidation = validateTaxFormData({
      form_type: inputs.tax_form_type,
      extracted_data: inputs.financials[0] || ({} as SingleYearFinancials),
      balance_sheet_data: flattenBalanceSheet(inputs.balance_sheet),
    });

    if (!taxValidation.is_valid) {
      keyFindings.push(`Tax validation found ${taxValidation.summary.errors_found} error(s).`);
    }
  } catch (error) {
    errors.push({ component: 'TaxValidation', error: String(error), recoverable: true });
    taxValidation = createEmptyTaxValidationResult(inputs.tax_form_type);
  }

  // STEP 3: KPI Calculations
  let kpis: KPICalculationResult | undefined;
  if (canProceed && inputs.balance_sheet && inputs.financials.length > 0) {
    try {
      // Sort financials by period (most recent first)
      const sortedFinancials = [...inputs.financials].sort((a, b) =>
        parseInt(b.period) - parseInt(a.period)
      );
      const currentFinancials = sortedFinancials[0];
      const priorYears = sortedFinancials.slice(1);

      kpis = calculateAllKPIs({
        current_financials: currentFinancials,
        balance_sheet: inputs.balance_sheet,
        prior_years: priorYears.length > 0 ? priorYears : undefined,
        custom_benchmarks: inputs.industry_benchmarks,
      });
      keyFindings.push(`Financial health: ${kpis.overall_financial_health}`);
    } catch (error) {
      errors.push({ component: 'KPIs', error: String(error), recoverable: true });
    }
  }

  // STEP 4: Working Capital
  let workingCapital: WorkingCapitalResult | undefined;
  if (inputs.balance_sheet) {
    try {
      workingCapital = calculateWorkingCapital({
        balance_sheet: inputs.balance_sheet,
        financials: inputs.financials,
        industry: inputs.industry,
      });
      keyFindings.push(`Working capital: ${workingCapital.quality}`);
    } catch (error) {
      errors.push({ component: 'WorkingCapital', error: String(error), recoverable: true });
    }
  }

  // STEP 5: Risk Scoring
  let riskScoring: RiskScoringResult | undefined;
  if (inputs.risk_inputs && canProceed) {
    try {
      riskScoring = calculateRiskScoring(inputs.risk_inputs as RiskScoringInputs);
      keyFindings.push(`Risk rating: ${riskScoring.overall_risk_rating}`);
    } catch (error) {
      errors.push({ component: 'RiskScoring', error: String(error), recoverable: true });
    }
  }

  // Build Summary
  const summary: OrchestratorSummary = {
    overall_data_quality_score: dataQuality.overall_score,
    overall_financial_health: kpis?.overall_financial_health || 'Unable to assess',
    overall_risk_rating: riskScoring?.overall_risk_rating || 'Not scored',
    working_capital_status: workingCapital?.quality || 'Not analyzed',
    key_findings: keyFindings,
    recommendations,
  };

  return {
    execution_id: executionId,
    executed_at: new Date().toISOString(),
    execution_time_ms: Date.now() - startTime,
    data_quality: dataQuality,
    can_proceed: canProceed,
    tax_validation: taxValidation,
    kpis,
    risk_scoring: riskScoring,
    working_capital: workingCapital,
    errors,
    summary,
  };
}

function flattenBalanceSheet(bs?: BalanceSheetData): Record<string, number> {
  if (!bs) return {};
  return {
    total_assets: bs.assets?.total_assets || 0,
    total_liabilities: bs.liabilities?.total_liabilities || 0,
    total_equity: bs.equity?.total_equity || 0,
  };
}

function createEmptyDataQualityResult(): DataQualityResult {
  return {
    overall_score: 0,
    confidence_level: 'Insufficient',
    can_proceed_with_valuation: false,
    category_scores: {
      critical_data: { score: 0, present: 0, total: 5, label: 'Critical' },
      important_data: { score: 0, present: 0, total: 8, label: 'Important' },
      balance_sheet: { score: 0, present: 0, total: 8, label: 'Balance Sheet' },
      multi_year: { score: 0, present: 0, total: 3, label: 'Historical' },
    },
    missing_data: [],
    document_coverage: { documents_provided: [], documents_missing: [], coverage_score: 0 },
    recommendations: [],
    quality_narrative: 'Unable to assess.',
    calculated_at: new Date().toISOString(),
  };
}

function createEmptyTaxValidationResult(formType: TaxFormType): TaxFormValidationResult {
  return {
    form_type: formType,
    is_valid: false,
    confidence_score: 0,
    summary: { total_rules_checked: 0, rules_passed: 0, errors_found: 0, warnings_found: 0 },
    errors: [],
    warnings: [],
    passed_rules: [],
    recommended_actions: [],
    validation_narrative: 'Unable to validate.',
    validated_at: new Date().toISOString(),
  };
}
