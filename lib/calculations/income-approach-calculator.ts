/**
 * Income Approach Calculator - Capitalization of Earnings
 */

import {
  IncomeApproachCalculation,
  CapRateComponents,
  CalculationStep,
} from './types';
import {
  safeNumber,
  roundToDollar,
  roundToThousand,
  safeDivide,
  createStep,
  resetStepCounter,
  formatCurrency,
  formatPercentage,
} from './utils';

/**
 * Default capitalization rate components based on current market data
 */
export const DEFAULT_CAP_RATE_COMPONENTS = {
  risk_free_rate: 0.045, // 20-year Treasury
  equity_risk_premium: 0.055, // Duff & Phelps ERP
  size_premium: 0.04, // Small business premium
  industry_risk_premium: 0.02, // Industry-specific risk
  company_specific_risk_premium: 0.03, // Company-specific factors
  long_term_growth_rate: 0.025, // Long-term GDP growth
};

export interface IncomeApproachInputs {
  weighted_sde: number;
  weighted_ebitda: number;
  benefit_stream_preference: 'SDE' | 'EBITDA' | 'AUTO';
  sde_threshold?: number;
  cap_rate_components?: Partial<CapRateComponents>;
  company_specific_risk_premium?: number;
  weight?: number;
  weight_rationale?: string;
}

/**
 * Calculate capitalization rate from components using build-up method
 */
export function calculateCapitalizationRate(
  components: Partial<CapRateComponents>,
  steps: CalculationStep[]
): { capRate: number; fullComponents: CapRateComponents } {
  const full: CapRateComponents = {
    risk_free_rate: components.risk_free_rate ?? DEFAULT_CAP_RATE_COMPONENTS.risk_free_rate,
    equity_risk_premium:
      components.equity_risk_premium ?? DEFAULT_CAP_RATE_COMPONENTS.equity_risk_premium,
    size_premium: components.size_premium ?? DEFAULT_CAP_RATE_COMPONENTS.size_premium,
    industry_risk_premium:
      components.industry_risk_premium ?? DEFAULT_CAP_RATE_COMPONENTS.industry_risk_premium,
    company_specific_risk_premium:
      components.company_specific_risk_premium ??
      DEFAULT_CAP_RATE_COMPONENTS.company_specific_risk_premium,
    long_term_growth_rate:
      components.long_term_growth_rate ?? DEFAULT_CAP_RATE_COMPONENTS.long_term_growth_rate,
    total_discount_rate: 0,
    capitalization_rate: 0,
  };

  // Calculate total discount rate (build-up method)
  full.total_discount_rate =
    full.risk_free_rate +
    full.equity_risk_premium +
    full.size_premium +
    full.industry_risk_premium +
    full.company_specific_risk_premium;

  steps.push(
    createStep(
      'Income',
      'Calculate total discount rate',
      'Discount Rate = Rf + ERP + SP + IRP + CSRP',
      {
        risk_free_rate: formatPercentage(full.risk_free_rate),
        equity_risk_premium: formatPercentage(full.equity_risk_premium),
        size_premium: formatPercentage(full.size_premium),
        industry_risk_premium: formatPercentage(full.industry_risk_premium),
        company_specific_risk: formatPercentage(full.company_specific_risk_premium),
      },
      full.total_discount_rate * 100 // Store as percentage for readability
    )
  );

  // Capitalization rate = Discount rate - Growth rate
  full.capitalization_rate = full.total_discount_rate - full.long_term_growth_rate;

  steps.push(
    createStep(
      'Income',
      'Calculate capitalization rate',
      'Cap Rate = Discount Rate - Growth Rate',
      {
        discount_rate: formatPercentage(full.total_discount_rate),
        growth_rate: formatPercentage(full.long_term_growth_rate),
      },
      full.capitalization_rate * 100
    )
  );

  return { capRate: full.capitalization_rate, fullComponents: full };
}

/**
 * Calculate Income Approach value using Capitalization of Earnings method
 */
export function calculateIncomeApproach(inputs: IncomeApproachInputs): IncomeApproachCalculation {
  resetStepCounter();
  const steps: CalculationStep[] = [];
  const warnings: string[] = [];

  const sde = safeNumber(inputs.weighted_sde);
  const ebitda = safeNumber(inputs.weighted_ebitda);
  const threshold = inputs.sde_threshold ?? 500000;

  // Select benefit stream
  let benefitStream: 'SDE' | 'EBITDA';
  let benefitStreamValue: number;
  let benefitStreamRationale: string;

  if (inputs.benefit_stream_preference === 'AUTO') {
    // Automatic selection based on business size
    if (sde < threshold) {
      benefitStream = 'SDE';
      benefitStreamValue = sde;
      benefitStreamRationale =
        `SDE selected because earnings (${formatCurrency(sde)}) are below the ` +
        `${formatCurrency(threshold)} threshold, indicating a smaller owner-operated business.`;
    } else if (sde >= 1000000) {
      benefitStream = 'EBITDA';
      benefitStreamValue = ebitda;
      benefitStreamRationale =
        `EBITDA selected because earnings (${formatCurrency(sde)} SDE) exceed $1M, ` +
        `indicating a larger business where normalized EBITDA is more appropriate.`;
    } else {
      benefitStream = 'SDE';
      benefitStreamValue = sde;
      benefitStreamRationale =
        `SDE selected as default for mid-sized owner-operated business ` +
        `with earnings of ${formatCurrency(sde)}.`;
    }
  } else {
    benefitStream = inputs.benefit_stream_preference;
    benefitStreamValue = benefitStream === 'SDE' ? sde : ebitda;
    benefitStreamRationale = `${benefitStream} selected per analyst preference.`;
  }

  steps.push(
    createStep(
      'Income',
      'Select benefit stream',
      `Benefit Stream = ${benefitStream}`,
      { weighted_sde: sde, weighted_ebitda: ebitda, selection: benefitStream },
      benefitStreamValue
    )
  );

  // Build cap rate components
  const capRateComponents: Partial<CapRateComponents> = { ...inputs.cap_rate_components };
  if (inputs.company_specific_risk_premium !== undefined) {
    capRateComponents.company_specific_risk_premium = inputs.company_specific_risk_premium;
  }

  const { capRate, fullComponents } = calculateCapitalizationRate(capRateComponents, steps);

  // Validate cap rate
  if (capRate <= 0) {
    warnings.push(
      `Capitalization rate is ${formatPercentage(capRate)}, which is invalid. Using 15% floor.`
    );
  }
  if (capRate > 0.5) {
    warnings.push(
      `Capitalization rate of ${formatPercentage(capRate)} is unusually high (>50%).`
    );
  }

  // Apply floor to cap rate
  const effectiveCapRate = Math.max(capRate, 0.1);

  // Calculate value
  const incomeApproachValue = roundToThousand(
    safeDivide(benefitStreamValue, effectiveCapRate, 0)
  );

  steps.push(
    createStep(
      'Income',
      'Calculate income approach value',
      'Value = Benefit Stream / Capitalization Rate',
      {
        benefit_stream: benefitStreamValue,
        cap_rate: formatPercentage(effectiveCapRate),
      },
      incomeApproachValue
    )
  );

  // Validate result
  if (incomeApproachValue <= 0) {
    warnings.push(
      `Income approach value is ${formatCurrency(incomeApproachValue)}. ` +
        `Check benefit stream and cap rate inputs.`
    );
  }

  // Default weight for income approach (typically 40% for operating companies)
  const weight = inputs.weight ?? 0.4;

  return {
    benefit_stream: benefitStream,
    benefit_stream_value: benefitStreamValue,
    benefit_stream_rationale: benefitStreamRationale,
    cap_rate_components: fullComponents,
    income_approach_value: incomeApproachValue,
    weight,
    weight_rationale: inputs.weight_rationale,
    calculation_steps: steps,
    warnings,
  };
}

/**
 * Format income approach results as markdown
 */
export function formatIncomeApproachTable(result: IncomeApproachCalculation): string {
  const lines: string[] = [];
  const cap = result.cap_rate_components;

  lines.push('### Income Approach Calculation\n');
  lines.push(`**Benefit Stream:** ${result.benefit_stream}`);
  lines.push(`**Benefit Stream Value:** ${formatCurrency(result.benefit_stream_value)}\n`);

  lines.push('**Capitalization Rate Build-up:**\n');
  lines.push('| Component | Rate |');
  lines.push('|-----------|------|');
  lines.push(`| Risk-free Rate | ${formatPercentage(cap.risk_free_rate)} |`);
  lines.push(`| Equity Risk Premium | ${formatPercentage(cap.equity_risk_premium)} |`);
  lines.push(`| Size Premium | ${formatPercentage(cap.size_premium)} |`);
  lines.push(`| Industry Risk Premium | ${formatPercentage(cap.industry_risk_premium)} |`);
  lines.push(`| Company-specific Risk | ${formatPercentage(cap.company_specific_risk_premium)} |`);
  lines.push(`| **Total Discount Rate** | **${formatPercentage(cap.total_discount_rate)}** |`);
  lines.push(`| Less: Growth Rate | (${formatPercentage(cap.long_term_growth_rate)}) |`);
  lines.push(`| **Capitalization Rate** | **${formatPercentage(cap.capitalization_rate)}** |`);
  lines.push('');

  lines.push(`**Income Approach Value:** ${formatCurrency(result.income_approach_value)}`);
  lines.push(`**Weight Assigned:** ${(result.weight * 100).toFixed(0)}%`);

  if (result.weight_rationale) {
    lines.push(`\n*Rationale: ${result.weight_rationale}*`);
  }

  return lines.join('\n');
}
