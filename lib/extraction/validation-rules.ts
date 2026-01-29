/**
 * Validation Rules for Extracted Financial Data
 * PRD-H: Robust PDF Extraction Pipeline
 *
 * Defines all validation rules for extracted financial data.
 * Rules are categorized by area and have severity levels:
 * - error: Blocks further processing (critical data issues)
 * - warning: Flags for review but allows processing
 * - info: Informational only (SDE add-back opportunities)
 */

import { Stage2Output, ValidationResult, StructuredFinancialData } from './types';

/**
 * Validation rule definition
 */
export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  category: 'balance_sheet' | 'income_statement' | 'sde' | 'schedule_m1' | 'cash_flow' | 'covid' | 'industry' | 'related_party' | 'trend';
  severity: 'error' | 'warning' | 'info';
  validate: (data: StructuredFinancialData, rawText?: string) => ValidationResult | null;
}

// ============================================================
// BALANCE SHEET RULES (BS001-BS003)
// ============================================================

export const BS001_ASSETS_EQUAL_LIABILITIES_EQUITY: ValidationRule = {
  id: 'BS001',
  name: 'Balance Sheet Equation',
  description: 'Assets should equal Liabilities + Equity (1% tolerance)',
  category: 'balance_sheet',
  severity: 'error',
  validate: (data) => {
    const bs = data.balance_sheet;
    if (!bs) return null;

    const assets = bs.eoy_total_assets;
    const liabilitiesEquity = bs.eoy_total_liabilities + bs.eoy_total_equity;

    if (assets === 0 && liabilitiesEquity === 0) return null; // No balance sheet data

    const diff = Math.abs(assets - liabilitiesEquity);
    const tolerance = Math.max(assets, liabilitiesEquity) * 0.01; // 1% tolerance

    if (diff > tolerance) {
      return {
        id: 'BS001',
        name: 'Balance Sheet Imbalance',
        severity: 'error',
        passed: false,
        field: 'balance_sheet',
        message: `Balance sheet does not balance. Assets ($${assets.toLocaleString()}) ≠ Liabilities + Equity ($${liabilitiesEquity.toLocaleString()}). Difference: $${diff.toLocaleString()}. Review extracted values for errors.`,
      };
    }

    return null;
  },
};

export const BS002_LOANS_TO_SHAREHOLDERS: ValidationRule = {
  id: 'BS002',
  name: 'Loans to Shareholders',
  description: 'Flags loans to shareholders as potential red flag',
  category: 'balance_sheet',
  severity: 'warning',
  validate: (data) => {
    const bs = data.balance_sheet;
    if (!bs) return null;

    const loans = bs.eoy_loans_to_shareholders;
    if (loans > 0) {
      return {
        id: 'BS002',
        name: 'Loans to Shareholders Detected',
        severity: 'warning',
        passed: false,
        field: 'loans_to_shareholders',
        message: `Loans to shareholders: $${loans.toLocaleString()}. May indicate distributions disguised as loans or personal expenses. Review loan terms and repayment history.`,
      };
    }

    return null;
  },
};

export const BS003_NEGATIVE_RETAINED_EARNINGS: ValidationRule = {
  id: 'BS003',
  name: 'Negative Retained Earnings',
  description: 'Flags negative retained earnings as potential concern',
  category: 'balance_sheet',
  severity: 'warning',
  validate: (data) => {
    const bs = data.balance_sheet;
    if (!bs) return null;

    const retainedEarnings = bs.eoy_retained_earnings;
    if (retainedEarnings < 0) {
      return {
        id: 'BS003',
        name: 'Negative Retained Earnings',
        severity: 'warning',
        passed: false,
        field: 'retained_earnings',
        message: `Negative retained earnings: ($${Math.abs(retainedEarnings).toLocaleString()}). Indicates accumulated losses. Review historical profitability.`,
      };
    }

    return null;
  },
};

// ============================================================
// INCOME STATEMENT RULES (IS001-IS005)
// ============================================================

export const IS001_GROSS_PROFIT_CALCULATION: ValidationRule = {
  id: 'IS001',
  name: 'Gross Profit Calculation',
  description: 'Gross Profit should equal Revenue - COGS',
  category: 'income_statement',
  severity: 'error',
  validate: (data) => {
    const is = data.income_statement;
    if (!is) return null;

    const revenue = is.gross_receipts - (is.returns_allowances || 0);
    const cogs = is.cost_of_goods_sold;
    const grossProfit = is.gross_profit;

    if (revenue === 0 && cogs === 0 && grossProfit === 0) return null;

    const expected = revenue - cogs;
    const diff = Math.abs(grossProfit - expected);
    const tolerance = Math.max(revenue, 1) * 0.01; // 1% tolerance

    if (diff > tolerance && diff > 100) {
      return {
        id: 'IS001',
        name: 'Gross Profit Mismatch',
        severity: 'error',
        passed: false,
        field: 'gross_profit',
        message: `Gross profit ($${grossProfit.toLocaleString()}) does not match Revenue - COGS ($${expected.toLocaleString()}). Difference: $${diff.toLocaleString()}. Review extraction.`,
      };
    }

    return null;
  },
};

export const IS002_REVENUE_POSITIVE: ValidationRule = {
  id: 'IS002',
  name: 'Revenue is Positive',
  description: 'Revenue should be positive for a viable business',
  category: 'income_statement',
  severity: 'error',
  validate: (data) => {
    const is = data.income_statement;
    if (!is) return null;

    const revenue = is.gross_receipts;
    if (revenue <= 0) {
      return {
        id: 'IS002',
        name: 'Non-Positive Revenue',
        severity: 'error',
        passed: false,
        field: 'gross_receipts',
        message: `Revenue is ${revenue <= 0 ? 'zero or negative' : 'missing'}: $${revenue.toLocaleString()}. May indicate extraction failure or shell company.`,
      };
    }

    return null;
  },
};

export const IS003_COGS_RECONCILIATION: ValidationRule = {
  id: 'IS003',
  name: 'COGS Detail Reconciliation',
  description: 'COGS detail should reconcile to COGS total',
  category: 'income_statement',
  severity: 'warning',
  validate: (data) => {
    const cogsDetail = data.cogs_detail;
    if (!cogsDetail) return null;

    const calculated =
      cogsDetail.beginning_inventory +
      cogsDetail.purchases +
      cogsDetail.labor_costs +
      cogsDetail.other_costs -
      cogsDetail.ending_inventory;

    const reported = data.income_statement?.cost_of_goods_sold ?? 0;
    const diff = Math.abs(calculated - reported);
    const tolerance = Math.max(reported, 1) * 0.02; // 2% tolerance

    if (diff > tolerance && diff > 500) {
      return {
        id: 'IS003',
        name: 'COGS Reconciliation Mismatch',
        severity: 'warning',
        passed: false,
        field: 'cogs_detail',
        message: `COGS detail ($${calculated.toLocaleString()}) does not reconcile to COGS total ($${reported.toLocaleString()}). Difference: $${diff.toLocaleString()}. Check for Section 263A adjustments.`,
      };
    }

    return null;
  },
};

export const IS004_OTHER_INCOME_PERCENT: ValidationRule = {
  id: 'IS004',
  name: 'Other Income Percentage',
  description: 'Other income should typically be less than 10% of revenue',
  category: 'income_statement',
  severity: 'warning',
  validate: (data) => {
    const is = data.income_statement;
    if (!is || is.gross_receipts === 0) return null;

    const otherIncomePercent = is.other_income / is.gross_receipts;

    if (otherIncomePercent > 0.10) {
      return {
        id: 'IS004',
        name: 'High Other Income',
        severity: 'warning',
        passed: false,
        field: 'other_income',
        message: `Other income is ${(otherIncomePercent * 100).toFixed(1)}% of revenue ($${is.other_income.toLocaleString()}). Review for COVID relief, asset sales, or non-recurring items.`,
      };
    }

    return null;
  },
};

export const IS005_OTHER_DEDUCTIONS_PERCENT: ValidationRule = {
  id: 'IS005',
  name: 'Other Deductions Percentage',
  description: 'Other deductions should typically be less than 20% of total deductions',
  category: 'income_statement',
  severity: 'warning',
  validate: (data) => {
    const expenses = data.expenses;
    if (!expenses || expenses.total_deductions === 0) return null;

    const otherDeductionsPercent = expenses.other_deductions / expenses.total_deductions;

    if (otherDeductionsPercent > 0.20) {
      return {
        id: 'IS005',
        name: 'High Other Deductions',
        severity: 'warning',
        passed: false,
        field: 'other_deductions',
        message: `Other deductions are ${(otherDeductionsPercent * 100).toFixed(1)}% of total deductions ($${expenses.other_deductions.toLocaleString()}). Request breakdown for related party or personal expenses.`,
      };
    }

    return null;
  },
};

// ============================================================
// SDE RULES (SDE001-SDE004)
// ============================================================

export const SDE001_OFFICER_COMP_PERCENT: ValidationRule = {
  id: 'SDE001',
  name: 'Officer Compensation Percentage',
  description: 'Officer compensation typically 5-50% of revenue for small businesses',
  category: 'sde',
  severity: 'warning',
  validate: (data) => {
    const is = data.income_statement;
    const expenses = data.expenses;
    if (!is || !expenses || is.gross_receipts === 0) return null;

    const officerComp = expenses.officer_compensation ?? 0;
    if (officerComp === 0) return null; // No officer comp extracted

    const percent = officerComp / is.gross_receipts;

    if (percent < 0.05) {
      return {
        id: 'SDE001',
        name: 'Low Officer Compensation',
        severity: 'warning',
        passed: false,
        field: 'officer_compensation',
        message: `Officer compensation is ${(percent * 100).toFixed(1)}% of revenue ($${officerComp.toLocaleString()}), below typical 5% minimum. Owner may be taking comp through other means (rent, loans, etc.).`,
      };
    }

    if (percent > 0.50) {
      return {
        id: 'SDE001',
        name: 'High Officer Compensation',
        severity: 'warning',
        passed: false,
        field: 'officer_compensation',
        message: `Officer compensation is ${(percent * 100).toFixed(1)}% of revenue ($${officerComp.toLocaleString()}), above typical 50% maximum. May indicate aggressive tax planning or multiple owners.`,
      };
    }

    return null;
  },
};

export const SDE002_SECTION_179: ValidationRule = {
  id: 'SDE002',
  name: 'Section 179 Deduction',
  description: 'Section 179 deduction should be added back for SDE',
  category: 'sde',
  severity: 'info',
  validate: (data) => {
    const schedK = data.schedule_k;
    if (!schedK) return null;

    const section179 = schedK.section_179_deduction ?? 0;
    if (section179 > 0) {
      return {
        id: 'SDE002',
        name: 'Section 179 Deduction Detected',
        severity: 'info',
        passed: false,
        field: 'section_179_deduction',
        message: `Section 179 deduction: $${section179.toLocaleString()}. Add back for SDE calculation (accelerated depreciation).`,
      };
    }

    return null;
  },
};

export const SDE003_GUARANTEED_PAYMENTS: ValidationRule = {
  id: 'SDE003',
  name: 'Guaranteed Payments',
  description: 'Partnership guaranteed payments are owner compensation',
  category: 'sde',
  severity: 'info',
  validate: (data) => {
    const gp = data.guaranteed_payments;
    if (!gp) return null;

    const total = gp.total;
    if (total > 0) {
      return {
        id: 'SDE003',
        name: 'Guaranteed Payments Detected',
        severity: 'info',
        passed: false,
        field: 'guaranteed_payments',
        message: `Guaranteed payments to partners: $${total.toLocaleString()}. Add back for SDE (primary owner comp for partnerships).`,
      };
    }

    return null;
  },
};

export const SDE004_CAPITAL_GAINS: ValidationRule = {
  id: 'SDE004',
  name: 'Capital Gains',
  description: 'Capital gains are non-recurring and should be normalized',
  category: 'sde',
  severity: 'info',
  validate: (data) => {
    const schedK = data.schedule_k;
    if (!schedK) return null;

    const totalGains =
      (schedK.net_short_term_capital_gain ?? 0) +
      (schedK.net_long_term_capital_gain ?? 0) +
      (schedK.net_section_1231_gain ?? 0);

    if (totalGains !== 0) {
      return {
        id: 'SDE004',
        name: 'Capital Gains Detected',
        severity: 'info',
        passed: false,
        field: 'capital_gains',
        message: `Capital gains: $${totalGains.toLocaleString()}. Non-recurring - ${totalGains > 0 ? 'subtract' : 'add back'} for normalized earnings.`,
      };
    }

    return null;
  },
};

// ============================================================
// SCHEDULE M-1 RULES (M1001)
// ============================================================

export const M1001_BOOK_TAX_RECONCILIATION: ValidationRule = {
  id: 'M1001',
  name: 'Book-Tax Reconciliation',
  description: 'M-1 should reconcile book income to tax income',
  category: 'schedule_m1',
  severity: 'warning',
  validate: (data) => {
    const m1 = data.schedule_m1;
    if (!m1) return null;

    const bookIncome = m1.net_income_per_books;
    const taxIncome = m1.income_per_schedule_k;

    if (bookIncome === 0 && taxIncome === 0) return null;

    const difference = Math.abs(bookIncome - taxIncome);
    const revenue = data.income_statement?.gross_receipts ?? 1;
    const percentDiff = difference / revenue;

    // Flag if difference exceeds 5% of revenue
    if (percentDiff > 0.05 && difference > 10000) {
      return {
        id: 'M1001',
        name: 'Significant Book-Tax Difference',
        severity: 'warning',
        passed: false,
        field: 'schedule_m1',
        message: `Book income ($${bookIncome.toLocaleString()}) differs from Schedule K income ($${taxIncome.toLocaleString()}) by ${(percentDiff * 100).toFixed(1)}% of revenue. May indicate timing differences, aggressive accounting, or unreported items.`,
      };
    }

    return null;
  },
};

// ============================================================
// CASH FLOW RULES (CF001)
// ============================================================

export const CF001_DISTRIBUTIONS_VS_NET_INCOME: ValidationRule = {
  id: 'CF001',
  name: 'Distributions vs Net Income',
  description: 'Distributions should generally not exceed net income long-term',
  category: 'cash_flow',
  severity: 'warning',
  validate: (data) => {
    const schedK = data.schedule_k;
    const is = data.income_statement;
    if (!schedK || !is) return null;

    const distributions = schedK.cash_distributions ?? 0;
    const netIncome = is.total_income ?? 0;

    if (distributions === 0 || netIncome === 0) return null;

    if (distributions > netIncome * 1.5) {
      return {
        id: 'CF001',
        name: 'Distributions Exceed Net Income',
        severity: 'warning',
        passed: false,
        field: 'cash_distributions',
        message: `Distributions ($${distributions.toLocaleString()}) significantly exceed net income ($${netIncome.toLocaleString()}). May indicate prior year earnings usage, cash flow issues, or value extraction before sale.`,
      };
    }

    return null;
  },
};

// ============================================================
// COVID RULES (COVID001)
// ============================================================

export const COVID001_RELIEF_DETECTED: ValidationRule = {
  id: 'COVID001',
  name: 'COVID Relief Detected',
  description: 'COVID relief items should be normalized',
  category: 'covid',
  severity: 'info',
  validate: (data) => {
    const covid = data.covid_adjustments;
    if (!covid) return null;

    const total =
      covid.ppp_loan_forgiveness +
      covid.eidl_advances +
      covid.employee_retention_credit;

    if (total > 0) {
      return {
        id: 'COVID001',
        name: 'COVID Relief Items',
        severity: 'info',
        passed: false,
        field: 'covid_adjustments',
        message: `COVID relief items: $${total.toLocaleString()} (PPP: $${covid.ppp_loan_forgiveness.toLocaleString()}, EIDL: $${covid.eidl_advances.toLocaleString()}, ERC: $${covid.employee_retention_credit.toLocaleString()}). Subtract from normalized earnings.`,
      };
    }

    return null;
  },
};

// ============================================================
// INDUSTRY RULES (IND001)
// ============================================================

export const IND001_GROSS_MARGIN: ValidationRule = {
  id: 'IND001',
  name: 'Gross Margin Reasonableness',
  description: 'Gross margin should be within typical industry range',
  category: 'industry',
  severity: 'warning',
  validate: (data) => {
    const is = data.income_statement;
    if (!is || is.gross_receipts === 0) return null;

    const grossMargin = is.gross_profit / is.gross_receipts;

    // Flag extremely low or high gross margins
    if (grossMargin < 0) {
      return {
        id: 'IND001',
        name: 'Negative Gross Margin',
        severity: 'warning',
        passed: false,
        field: 'gross_margin',
        message: `Negative gross margin (${(grossMargin * 100).toFixed(1)}%). COGS exceeds revenue - review for errors.`,
      };
    }

    if (grossMargin > 0.95) {
      return {
        id: 'IND001',
        name: 'Very High Gross Margin',
        severity: 'warning',
        passed: false,
        field: 'gross_margin',
        message: `Unusually high gross margin (${(grossMargin * 100).toFixed(1)}%). Verify service business or check for missing COGS.`,
      };
    }

    return null;
  },
};

// ============================================================
// RELATED PARTY RULES (RPT001)
// ============================================================

export const RPT001_RELATED_PARTY_INDICATORS: ValidationRule = {
  id: 'RPT001',
  name: 'Related Party Indicators',
  description: 'Checks for multiple related party red flags',
  category: 'related_party',
  severity: 'warning',
  validate: (data) => {
    const rf = data.red_flags;
    const bs = data.balance_sheet;
    const expenses = data.expenses;
    const is = data.income_statement;

    if (!rf || !bs || !expenses || !is) return null;

    const indicators: string[] = [];

    if (rf.has_loans_to_shareholders) {
      indicators.push(`Loans to shareholders: $${rf.loans_to_shareholders_amount.toLocaleString()}`);
    }

    const loansFrom = bs.eoy_loans_from_shareholders ?? 0;
    if (loansFrom > 0) {
      indicators.push(`Loans from shareholders: $${loansFrom.toLocaleString()}`);
    }

    const rent = expenses.rent ?? 0;
    const rentPercent = is.gross_receipts > 0 ? rent / is.gross_receipts : 0;
    if (rentPercent > 0.10 && rent > 10000) {
      indicators.push(`High rent: $${rent.toLocaleString()} (${(rentPercent * 100).toFixed(1)}% of revenue)`);
    }

    if (indicators.length >= 2) {
      return {
        id: 'RPT001',
        name: 'Multiple Related Party Indicators',
        severity: 'warning',
        passed: false,
        field: 'related_party',
        message: `Multiple related party indicators detected: ${indicators.join('; ')}. Review for arm's-length pricing and normalization.`,
      };
    }

    return null;
  },
};

// ============================================================
// TREND RULES (TREND001)
// ============================================================

export const TREND001_REVENUE_CHANGE: ValidationRule = {
  id: 'TREND001',
  name: 'YoY Revenue Change',
  description: 'Year-over-year revenue change should be reasonable',
  category: 'trend',
  severity: 'warning',
  validate: (data) => {
    const rf = data.red_flags;
    if (!rf || rf.revenue_yoy_change_percent === null) return null;

    const yoyChange = rf.revenue_yoy_change_percent;

    if (Math.abs(yoyChange) > 0.30) {
      const direction = yoyChange > 0 ? 'increase' : 'decrease';
      return {
        id: 'TREND001',
        name: 'Significant Revenue Change',
        severity: 'warning',
        passed: false,
        field: 'revenue_trend',
        message: `Revenue ${direction} of ${(Math.abs(yoyChange) * 100).toFixed(1)}% year-over-year. ` +
          (yoyChange > 0
            ? 'May indicate new customer wins, COVID recovery, or acquisition.'
            : 'May indicate customer losses, market decline, or operational issues.'),
      };
    }

    return null;
  },
};

// ============================================================
// ALL RULES EXPORT
// ============================================================

export const ALL_VALIDATION_RULES: ValidationRule[] = [
  // Balance Sheet
  BS001_ASSETS_EQUAL_LIABILITIES_EQUITY,
  BS002_LOANS_TO_SHAREHOLDERS,
  BS003_NEGATIVE_RETAINED_EARNINGS,
  // Income Statement
  IS001_GROSS_PROFIT_CALCULATION,
  IS002_REVENUE_POSITIVE,
  IS003_COGS_RECONCILIATION,
  IS004_OTHER_INCOME_PERCENT,
  IS005_OTHER_DEDUCTIONS_PERCENT,
  // SDE
  SDE001_OFFICER_COMP_PERCENT,
  SDE002_SECTION_179,
  SDE003_GUARANTEED_PAYMENTS,
  SDE004_CAPITAL_GAINS,
  // Schedule M-1
  M1001_BOOK_TAX_RECONCILIATION,
  // Cash Flow
  CF001_DISTRIBUTIONS_VS_NET_INCOME,
  // COVID
  COVID001_RELIEF_DETECTED,
  // Industry
  IND001_GROSS_MARGIN,
  // Related Party
  RPT001_RELATED_PARTY_INDICATORS,
  // Trend
  TREND001_REVENUE_CHANGE,
];
