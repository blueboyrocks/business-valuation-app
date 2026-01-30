/**
 * Earnings Calculator - SDE and EBITDA calculations
 *
 * US-019: Added COVID normalization to subtract one-time pandemic relief items
 * from earnings for proper SDE calculation (2020-2021 valuations).
 */

import {
  SingleYearFinancials,
  MultiYearFinancials,
  SDEYearCalculation,
  EBITDAYearCalculation,
  NormalizedEarningsResult,
  AddBackItem,
  CalculationStep,
  CovidAdjustmentsData,
} from './types';
import {
  safeNumber,
  roundToDollar,
  calculateWeightedAverage,
  createStep,
  resetStepCounter,
  formatCurrency,
  createTable,
} from './utils';

/**
 * Calculate COVID adjustment amount for a given year.
 * COVID adjustments should be SUBTRACTED from SDE as they are one-time items.
 */
function calculateCovidAdjustmentForYear(
  year: number,
  covidAdjustments?: CovidAdjustmentsData
): { totalAdjustment: number; items: Array<{ category: string; amount: number }> } {
  if (!covidAdjustments) {
    return { totalAdjustment: 0, items: [] };
  }

  // Check if this year is applicable for COVID adjustments (typically 2020-2021)
  const applicableYears = covidAdjustments.applicable_years || [2020, 2021];
  if (!applicableYears.includes(year)) {
    return { totalAdjustment: 0, items: [] };
  }

  const items: Array<{ category: string; amount: number }> = [];
  let total = 0;

  if (covidAdjustments.ppp_loan_forgiveness > 0) {
    items.push({
      category: 'PPP Loan Forgiveness',
      amount: covidAdjustments.ppp_loan_forgiveness,
    });
    total += covidAdjustments.ppp_loan_forgiveness;
  }

  if (covidAdjustments.eidl_advances > 0) {
    items.push({
      category: 'EIDL Advances',
      amount: covidAdjustments.eidl_advances,
    });
    total += covidAdjustments.eidl_advances;
  }

  if (covidAdjustments.employee_retention_credit > 0) {
    items.push({
      category: 'Employee Retention Credit',
      amount: covidAdjustments.employee_retention_credit,
    });
    total += covidAdjustments.employee_retention_credit;
  }

  return { totalAdjustment: total, items };
}

/**
 * Calculate Seller's Discretionary Earnings (SDE) for a single year
 *
 * @param financials - Single year financial data
 * @param steps - Array to push calculation steps to
 * @param covidAdjustments - Optional COVID adjustments to subtract from SDE
 */
export function calculateSDEForYear(
  financials: SingleYearFinancials,
  steps: CalculationStep[],
  covidAdjustments?: CovidAdjustmentsData
): SDEYearCalculation {
  const period = financials.period;
  const startingNetIncome = safeNumber(financials.net_income);
  const adjustments: AddBackItem[] = [];
  let totalAdjustments = 0;

  // Standard add-backs with source line references
  const standardAddBacks: Array<{
    category: string;
    description: string;
    field: keyof SingleYearFinancials;
    sourceLine: string;
  }> = [
    {
      category: 'Officer Compensation',
      description: 'Owner salary added back',
      field: 'officer_compensation',
      sourceLine: 'Form 1120-S Line 7',
    },
    {
      category: 'Interest Expense',
      description: 'Interest on business debt',
      field: 'interest_expense',
      sourceLine: 'Schedule K Line 13a',
    },
    {
      category: 'Depreciation',
      description: 'Non-cash depreciation expense',
      field: 'depreciation',
      sourceLine: 'Form 4562',
    },
    {
      category: 'Amortization',
      description: 'Non-cash amortization expense',
      field: 'amortization',
      sourceLine: 'Form 4562 Part VI',
    },
  ];

  for (const addBack of standardAddBacks) {
    const amount = safeNumber(financials[addBack.field] as number);
    if (amount > 0) {
      adjustments.push({
        category: addBack.category,
        description: addBack.description,
        amount,
        source_line: addBack.sourceLine,
      });
      totalAdjustments += amount;
      steps.push(
        createStep(
          'SDE',
          `${period} - Add back ${addBack.category}`,
          `SDE += ${addBack.category}`,
          { [addBack.category]: amount },
          amount
        )
      );
    }
  }

  // Discretionary add-backs (some at partial percentages)
  const discretionaryFields: Array<{
    category: string;
    field: keyof SingleYearFinancials;
    percentage?: number;
  }> = [
    { category: 'Non-recurring Expenses', field: 'non_recurring_expenses' },
    { category: 'Personal Expenses', field: 'personal_expenses' },
    { category: 'Charitable Contributions', field: 'charitable_contributions' },
    { category: 'Meals & Entertainment', field: 'meals_entertainment', percentage: 0.5 },
    { category: 'Owner Auto Expenses', field: 'auto_expenses', percentage: 0.5 },
  ];

  for (const item of discretionaryFields) {
    const rawAmount = safeNumber(financials[item.field] as number);
    if (rawAmount > 0) {
      const pct = item.percentage || 1;
      const amount = roundToDollar(rawAmount * pct);
      adjustments.push({
        category: item.category,
        description:
          pct < 1
            ? `${pct * 100}% of ${item.category.toLowerCase()}`
            : `Full ${item.category.toLowerCase()} add-back`,
        amount,
      });
      totalAdjustments += amount;
      steps.push(
        createStep(
          'SDE',
          `${period} - Add back ${item.category}`,
          `SDE += ${item.category}${pct < 1 ? ` × ${pct * 100}%` : ''}`,
          { [item.category]: rawAmount, percentage: pct },
          amount
        )
      );
    }
  }

  // Custom discretionary add-backs from pass outputs
  if (financials.discretionary_addbacks) {
    for (const addback of financials.discretionary_addbacks) {
      adjustments.push({
        category: addback.category,
        description: addback.description,
        amount: addback.amount,
        source_line: addback.source_line,
      });
      totalAdjustments += addback.amount;
      steps.push(
        createStep(
          'SDE',
          `${period} - Add back ${addback.description}`,
          `SDE += ${addback.description}`,
          { amount: addback.amount },
          addback.amount
        )
      );
    }
  }

  // Calculate SDE before COVID adjustments
  let sde = roundToDollar(startingNetIncome + totalAdjustments);
  steps.push(
    createStep(
      'SDE',
      `${period} - Calculate SDE before COVID adjustments`,
      'SDE = Net Income + Total Adjustments',
      {
        net_income: startingNetIncome,
        total_adjustments: roundToDollar(totalAdjustments),
      },
      sde
    )
  );

  // Apply COVID adjustments (subtract one-time pandemic relief items)
  // Per US-019: PPP forgiveness, EIDL grants, ERC should be SUBTRACTED from SDE
  const yearNum = parseInt(period, 10);
  const covidResult = calculateCovidAdjustmentForYear(yearNum, covidAdjustments);

  if (covidResult.totalAdjustment > 0) {
    for (const covidItem of covidResult.items) {
      adjustments.push({
        category: 'COVID Normalization',
        description: `Subtract ${covidItem.category} (one-time pandemic relief)`,
        amount: -covidItem.amount, // Negative because we're subtracting
        source_line: 'COVID-19 Relief Adjustment',
      });
      steps.push(
        createStep(
          'SDE',
          `${period} - Subtract ${covidItem.category}`,
          `SDE -= ${covidItem.category} (COVID normalization)`,
          { amount: covidItem.amount },
          -covidItem.amount
        )
      );
    }

    sde = roundToDollar(sde - covidResult.totalAdjustment);
    steps.push(
      createStep(
        'SDE',
        `${period} - Calculate normalized SDE after COVID adjustments`,
        'Normalized SDE = SDE - COVID Adjustments',
        {
          sde_before: sde + covidResult.totalAdjustment,
          covid_adjustments: covidResult.totalAdjustment,
        },
        sde,
        `COVID relief of $${covidResult.totalAdjustment.toLocaleString()} subtracted for normalization`
      )
    );
  }

  return {
    period,
    starting_net_income: startingNetIncome,
    adjustments,
    total_adjustments: roundToDollar(totalAdjustments - covidResult.totalAdjustment),
    sde,
  };
}

/**
 * Calculate EBITDA for a single year with owner compensation normalization
 */
export function calculateEBITDAForYear(
  financials: SingleYearFinancials,
  fairMarketSalary: number,
  steps: CalculationStep[]
): EBITDAYearCalculation {
  const period = financials.period;
  const startingNetIncome = safeNumber(financials.net_income);
  const addInterest = safeNumber(financials.interest_expense);
  const addTaxes = safeNumber(financials.taxes);
  const addDepreciation = safeNumber(financials.depreciation);
  const addAmortization = safeNumber(financials.amortization);

  // Basic EBITDA calculation
  const basicEBITDA = startingNetIncome + addInterest + addTaxes + addDepreciation + addAmortization;
  steps.push(
    createStep(
      'EBITDA',
      `${period} - Calculate basic EBITDA`,
      'EBITDA = Net Income + I + T + D + A',
      {
        net_income: startingNetIncome,
        interest: addInterest,
        taxes: addTaxes,
        depreciation: addDepreciation,
        amortization: addAmortization,
      },
      basicEBITDA
    )
  );

  // Owner compensation adjustment
  const actualOwnerComp = safeNumber(financials.officer_compensation);
  const ownerCompAdjustment = actualOwnerComp - fairMarketSalary;
  steps.push(
    createStep(
      'EBITDA',
      `${period} - Owner compensation adjustment`,
      'Adjustment = Actual Owner Comp - Fair Market Salary',
      {
        actual_owner_comp: actualOwnerComp,
        fair_market_salary: fairMarketSalary,
      },
      ownerCompAdjustment
    )
  );

  // Other normalizing adjustments
  const otherAdjustments = safeNumber(financials.non_recurring_expenses);
  const adjustedEBITDA = roundToDollar(basicEBITDA + ownerCompAdjustment + otherAdjustments);
  steps.push(
    createStep(
      'EBITDA',
      `${period} - Calculate adjusted EBITDA`,
      'Adjusted EBITDA = Basic EBITDA + Owner Comp Adj + Other',
      {
        basic_ebitda: roundToDollar(basicEBITDA),
        owner_comp_adjustment: roundToDollar(ownerCompAdjustment),
        other_adjustments: otherAdjustments,
      },
      adjustedEBITDA
    )
  );

  return {
    period,
    starting_net_income: startingNetIncome,
    add_interest: addInterest,
    add_taxes: addTaxes,
    add_depreciation: addDepreciation,
    add_amortization: addAmortization,
    owner_compensation_adjustment: {
      actual_owner_compensation: actualOwnerComp,
      fair_market_replacement_salary: fairMarketSalary,
      adjustment_amount: roundToDollar(ownerCompAdjustment),
    },
    other_normalizing_adjustments: otherAdjustments,
    adjusted_ebitda: adjustedEBITDA,
  };
}

/**
 * Calculate normalized earnings (SDE and EBITDA) for all periods
 *
 * @param financials - Multi-year financial data
 * @param fairMarketSalary - Fair market replacement salary for owner
 * @param covidAdjustments - Optional COVID adjustments to normalize pandemic relief items
 */
export function calculateNormalizedEarnings(
  financials: MultiYearFinancials,
  fairMarketSalary: number,
  covidAdjustments?: CovidAdjustmentsData
): NormalizedEarningsResult {
  resetStepCounter();
  const steps: CalculationStep[] = [];
  const warnings: string[] = [];

  // Handle missing data
  if (!financials.periods || financials.periods.length === 0) {
    warnings.push('No financial periods provided');
    return {
      sde_by_year: [],
      ebitda_by_year: [],
      weighted_sde: 0,
      weighted_ebitda: 0,
      weighting_method: 'N/A',
      weights_used: [],
      calculation_steps: steps,
      warnings,
    };
  }

  // Validate fair market salary
  let effectiveFMS = fairMarketSalary;
  if (fairMarketSalary <= 0) {
    warnings.push(`Fair market salary is ${fairMarketSalary}. Using $75,000 default.`);
    effectiveFMS = 75000;
  }

  // Sort periods by year (most recent first)
  const sortedPeriods = [...financials.periods].sort(
    (a, b) => parseInt(b.period) - parseInt(a.period)
  );

  // Log COVID adjustments if present
  if (covidAdjustments) {
    const totalCovid =
      (covidAdjustments.ppp_loan_forgiveness || 0) +
      (covidAdjustments.eidl_advances || 0) +
      (covidAdjustments.employee_retention_credit || 0);
    if (totalCovid > 0) {
      warnings.push(
        `COVID adjustments of $${totalCovid.toLocaleString()} will be subtracted from applicable years for normalization`
      );
    }
  }

  // Calculate SDE for each year (with COVID adjustments for 2020-2021)
  const sdeByYear: SDEYearCalculation[] = [];
  for (const period of sortedPeriods) {
    const sdeCalc = calculateSDEForYear(period, steps, covidAdjustments);
    sdeByYear.push(sdeCalc);

    // Add warnings for unusual SDE values
    if (sdeCalc.sde < 0) {
      warnings.push(`${period.period} SDE is negative: ${formatCurrency(sdeCalc.sde)}`);
    } else if (sdeCalc.sde < 50000 && sdeCalc.sde >= 0) {
      warnings.push(`${period.period} SDE is low: ${formatCurrency(sdeCalc.sde)}`);
    }
  }

  // Calculate EBITDA for each year
  const ebitdaByYear: EBITDAYearCalculation[] = [];
  for (const period of sortedPeriods) {
    const ebitdaCalc = calculateEBITDAForYear(period, effectiveFMS, steps);
    ebitdaByYear.push(ebitdaCalc);

    if (ebitdaCalc.adjusted_ebitda < 0) {
      warnings.push(
        `${period.period} EBITDA is negative: ${formatCurrency(ebitdaCalc.adjusted_ebitda)}`
      );
    }
  }

  // Calculate weighted averages
  const sdeValues = sdeByYear.map(s => s.sde);
  const ebitdaValues = ebitdaByYear.map(e => e.adjusted_ebitda);
  const numPeriods = sdeValues.length;

  // Standard weighting: 3-2-1 for 3 years, 2-1 for 2 years, etc.
  const weights =
    numPeriods === 3
      ? [3, 2, 1]
      : numPeriods === 2
        ? [2, 1]
        : numPeriods === 4
          ? [4, 3, 2, 1]
          : [1];

  const weightedSDE = calculateWeightedAverage(sdeValues, weights);
  const weightedEBITDA = calculateWeightedAverage(ebitdaValues, weights);

  steps.push(
    createStep(
      'SDE',
      'Calculate weighted average SDE',
      'Weighted SDE = Σ(SDE × Weight) / Σ(Weight)',
      { values: sdeValues.join(', '), weights: weights.join(', ') },
      weightedSDE
    )
  );

  steps.push(
    createStep(
      'EBITDA',
      'Calculate weighted average EBITDA',
      'Weighted EBITDA = Σ(EBITDA × Weight) / Σ(Weight)',
      { values: ebitdaValues.join(', '), weights: weights.join(', ') },
      weightedEBITDA
    )
  );

  return {
    sde_by_year: sdeByYear,
    ebitda_by_year: ebitdaByYear,
    weighted_sde: weightedSDE,
    weighted_ebitda: weightedEBITDA,
    weighting_method: `${numPeriods}-year weighted average (${weights.join('x, ')}x)`,
    weights_used: weights,
    calculation_steps: steps,
    warnings,
  };
}

/**
 * Format earnings results as markdown tables
 */
export function formatEarningsTables(result: NormalizedEarningsResult): {
  earnings_summary: string;
  sde_detail: string;
  ebitda_detail: string;
} {
  // Summary table
  const summaryHeaders = ['Period', 'SDE', 'EBITDA', 'Weight'];
  const summaryRows = result.sde_by_year.map((sde, i) => [
    sde.period,
    formatCurrency(sde.sde),
    formatCurrency(result.ebitda_by_year[i].adjusted_ebitda),
    `${result.weights_used[i]}x`,
  ]);
  summaryRows.push([
    '**Weighted Avg**',
    `**${formatCurrency(result.weighted_sde)}**`,
    `**${formatCurrency(result.weighted_ebitda)}**`,
    '',
  ]);
  const earnings_summary = createTable(summaryHeaders, summaryRows);

  // SDE detail table
  const sdeHeaders = ['Period', 'Net Income', 'Add-backs', 'SDE'];
  const sdeRows = result.sde_by_year.map(sde => [
    sde.period,
    formatCurrency(sde.starting_net_income),
    formatCurrency(sde.total_adjustments),
    formatCurrency(sde.sde),
  ]);
  const sde_detail = createTable(sdeHeaders, sdeRows);

  // EBITDA detail table
  const ebitdaHeaders = ['Period', 'Net Income', 'I+T+D+A', 'Owner Adj', 'EBITDA'];
  const ebitdaRows = result.ebitda_by_year.map(eb => [
    eb.period,
    formatCurrency(eb.starting_net_income),
    formatCurrency(eb.add_interest + eb.add_taxes + eb.add_depreciation + eb.add_amortization),
    formatCurrency(eb.owner_compensation_adjustment.adjustment_amount),
    formatCurrency(eb.adjusted_ebitda),
  ]);
  const ebitda_detail = createTable(ebitdaHeaders, ebitdaRows);

  return { earnings_summary, sde_detail, ebitda_detail };
}
