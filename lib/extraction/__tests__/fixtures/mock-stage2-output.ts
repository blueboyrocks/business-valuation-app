/**
 * Mock Stage2Output fixtures for testing
 *
 * Creates properly typed mock data for Stage2Output
 * that matches the actual type definitions.
 */

import {
  Stage2Output,
  StructuredFinancialData,
  DocumentClassification,
  IncomeStatementData,
  ExpenseData,
  BalanceSheetData,
  OwnerInfo,
  RedFlagIndicators,
  ScheduleKData,
} from '../../types';

/**
 * Default income statement data
 */
function createDefaultIncomeStatement(overrides: Partial<IncomeStatementData> = {}): IncomeStatementData {
  return {
    gross_receipts: 1000000,
    returns_allowances: 0,
    cost_of_goods_sold: 400000,
    gross_profit: 600000,
    other_income: 0,
    net_gain_form_4797: 0,
    total_income: 600000,
    ...overrides,
  };
}

/**
 * Default expense data
 */
function createDefaultExpenses(overrides: Partial<ExpenseData> = {}): ExpenseData {
  return {
    officer_compensation: 100000,
    salaries_wages: 150000,
    rent: 36000,
    taxes_licenses: 20000,
    interest: 10000,
    depreciation: 25000,
    amortization: 0,
    repairs_maintenance: 10000,
    bad_debts: 0,
    advertising: 12000,
    employee_benefits: 20000,
    pension_profit_sharing: 15000,
    other_deductions: 20000,
    total_deductions: 400000,
    ...overrides,
  };
}

/**
 * Default balance sheet data
 */
function createDefaultBalanceSheet(overrides: Partial<BalanceSheetData> = {}): BalanceSheetData {
  return {
    // Beginning of Year
    boy_cash: 50000,
    boy_accounts_receivable: 100000,
    boy_allowance_bad_debts: 0,
    boy_inventory: 150000,
    boy_other_current_assets: 10000,
    boy_loans_to_shareholders: 0,
    boy_buildings_depreciable: 0,
    boy_accumulated_depreciation: 75000,
    boy_land: 0,
    boy_intangible_assets: 0,
    boy_other_assets: 15000,
    boy_total_assets: 450000,
    boy_accounts_payable: 60000,
    boy_short_term_debt: 25000,
    boy_other_current_liabilities: 15000,
    boy_loans_from_shareholders: 0,
    boy_long_term_debt: 100000,
    boy_other_liabilities: 0,
    boy_total_liabilities: 200000,
    boy_capital_stock: 10000,
    boy_additional_paid_in_capital: 40000,
    boy_retained_earnings: 200000,
    boy_adjustments_equity: 0,
    boy_treasury_stock: 0,
    boy_total_equity: 250000,
    // End of Year
    eoy_cash: 75000,
    eoy_accounts_receivable: 120000,
    eoy_allowance_bad_debts: 0,
    eoy_inventory: 175000,
    eoy_other_current_assets: 15000,
    eoy_loans_to_shareholders: 0,
    eoy_buildings_depreciable: 0,
    eoy_accumulated_depreciation: 100000,
    eoy_land: 0,
    eoy_intangible_assets: 0,
    eoy_other_assets: 20000,
    eoy_total_assets: 530000,
    eoy_accounts_payable: 70000,
    eoy_short_term_debt: 20000,
    eoy_other_current_liabilities: 20000,
    eoy_loans_from_shareholders: 0,
    eoy_long_term_debt: 80000,
    eoy_other_liabilities: 0,
    eoy_total_liabilities: 190000,
    eoy_capital_stock: 10000,
    eoy_additional_paid_in_capital: 40000,
    eoy_retained_earnings: 290000,
    eoy_adjustments_equity: 0,
    eoy_treasury_stock: 0,
    eoy_total_equity: 340000,
    ...overrides,
  };
}

/**
 * Default owner info
 */
function createDefaultOwnerInfo(overrides: Partial<OwnerInfo> = {}): OwnerInfo {
  return {
    officer_compensation: 100000,
    guaranteed_payments_total: 0,
    distributions_cash: 0,
    distributions_property: 0,
    loans_to_shareholders: 0,
    loans_from_shareholders: 0,
    section_179_deduction: 0,
    ...overrides,
  };
}

/**
 * Default red flag indicators
 */
function createDefaultRedFlags(overrides: Partial<RedFlagIndicators> = {}): RedFlagIndicators {
  return {
    has_loans_to_shareholders: false,
    loans_to_shareholders_amount: 0,
    negative_retained_earnings: false,
    other_income_percent: 0,
    other_deductions_percent: 0.05,
    distributions_exceed_net_income: false,
    distributions_vs_net_income_ratio: 0,
    revenue_yoy_change_percent: null,
    revenue_decline_flag: false,
    ...overrides,
  };
}

/**
 * Options for creating mock Stage2Output
 */
export interface MockStage2Options {
  confidence?: 'high' | 'medium' | 'low';
  documentType?: string;
  taxYear?: string | null;
  entityName?: string | null;
  revenue?: number;
  officerComp?: number;
  guaranteedPayments?: number;
  totalAssets?: number;
  loansToShareholders?: number;
  loansFromShareholders?: number;
  rent?: number;
  otherIncome?: number;
  otherDeductions?: number;
  totalDeductions?: number;
}

/**
 * Create a mock Stage2Output with proper types
 */
export function createMockStage2Output(options: MockStage2Options = {}): Stage2Output {
  const {
    confidence = 'high',
    documentType = 'FORM_1120S',
    taxYear = '2023',
    entityName = 'Test Company LLC',
    revenue = 1000000,
    officerComp = 100000,
    guaranteedPayments = 0,
    totalAssets = 500000,
    loansToShareholders = 0,
    loansFromShareholders = 0,
    rent = 36000,
    otherIncome = 0,
    otherDeductions = 20000,
    totalDeductions = 400000,
  } = options;

  const classification: DocumentClassification = {
    document_type: documentType as DocumentClassification['document_type'],
    confidence,
    indicators: ['Test indicator'],
    tax_year: taxYear,
    entity_name: entityName,
  };

  const incomeStatement = createDefaultIncomeStatement({
    gross_receipts: revenue,
    cost_of_goods_sold: revenue * 0.4,
    gross_profit: revenue * 0.6,
    other_income: otherIncome,
    total_income: revenue * 0.2 + otherIncome,
  });

  const expenses = createDefaultExpenses({
    officer_compensation: officerComp,
    rent,
    other_deductions: otherDeductions,
    total_deductions: totalDeductions,
  });

  const balanceSheet = createDefaultBalanceSheet({
    eoy_total_assets: totalAssets,
    eoy_loans_to_shareholders: loansToShareholders,
    eoy_loans_from_shareholders: loansFromShareholders,
    eoy_total_liabilities: 190000 + loansFromShareholders,
    eoy_total_equity: totalAssets - 190000 - loansFromShareholders,
    eoy_retained_earnings: totalAssets - 190000 - loansFromShareholders - 50000,
  });

  const ownerInfo = createDefaultOwnerInfo({
    officer_compensation: officerComp,
    guaranteed_payments_total: guaranteedPayments,
    loans_to_shareholders: loansToShareholders,
    loans_from_shareholders: loansFromShareholders,
  });

  const redFlags = createDefaultRedFlags({
    has_loans_to_shareholders: loansToShareholders > 0,
    loans_to_shareholders_amount: loansToShareholders,
    other_deductions_percent: totalDeductions > 0 ? otherDeductions / totalDeductions : 0,
  });

  const structuredData: StructuredFinancialData = {
    income_statement: incomeStatement,
    cogs_detail: null,
    expenses,
    balance_sheet: balanceSheet,
    schedule_k: null,
    schedule_m1: null,
    guaranteed_payments: guaranteedPayments > 0
      ? { services: guaranteedPayments, capital: 0, total: guaranteedPayments }
      : null,
    owner_info: ownerInfo,
    depreciation_detail: null,
    covid_adjustments: null,
    red_flags: redFlags,
  };

  return {
    document_id: 'test-doc-001',
    classification,
    structured_data: structuredData,
    unmapped_data: [],
    warnings: [],
    processing_metadata: {
      tables_processed: 3,
      fields_mapped: 50,
      fields_missing: 5,
      confidence_score: 85,
    },
  };
}

/**
 * Create a Schedule K data object for testing
 */
export function createMockScheduleK(overrides: Partial<ScheduleKData> = {}): ScheduleKData {
  return {
    ordinary_business_income: 135000,
    net_rental_real_estate_income: 0,
    other_rental_income: 0,
    interest_income: 0,
    ordinary_dividends: 0,
    royalties: 0,
    net_short_term_capital_gain: 0,
    net_long_term_capital_gain: 0,
    net_section_1231_gain: 0,
    other_income: 0,
    section_179_deduction: 0,
    charitable_contributions: 0,
    investment_interest: 0,
    other_deductions: 0,
    cash_distributions: 0,
    property_distributions: 0,
    ...overrides,
  };
}
