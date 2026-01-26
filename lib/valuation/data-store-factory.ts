/**
 * DataStore Factory - PRD-A Step 3
 *
 * Single factory that takes calculation engine output + pass outputs and
 * returns a frozen DataStore + DataAccessor pair.
 */

import type { CalculationEngineOutput } from '../calculations/types';
import { createValuationDataStore, type ValuationDataStore } from './data-store';
import { createDataAccessor, type ValuationDataAccessor } from './data-accessor';

export interface DataStoreFactoryResult {
  store: ValuationDataStore;
  accessor: ValuationDataAccessor;
}

/**
 * Create a DataStore + Accessor from calculation engine results and report data (pass outputs).
 *
 * @param calculationResults - Output from the deterministic calculation engine
 * @param reportData - Flat report data object (from pass outputs / regenerate route)
 */
export function createDataStoreFromResults(
  calculationResults: CalculationEngineOutput,
  reportData: Record<string, unknown>
): DataStoreFactoryResult {
  // Extract company/meta fields from reportData
  const companyName = (reportData.company_name as string) ||
                      (reportData.companyName as string) || '';
  const industry = (reportData.industry_name as string) ||
                   (reportData.industry as string) || '';
  const naicsCode = (reportData.industry_naics_code as string) ||
                    (reportData.naics_code as string) || '';
  const entityType = (reportData.entity_type as string) || '';
  const fiscalYearEnd = (reportData.fiscal_year_end as string) || '';
  const valuationDate = (reportData.valuation_date as string) ||
                        new Date().toISOString().split('T')[0];

  // Extract income statement fields
  const incomeStmt = (reportData.income_statements as unknown[])?.[0] as Record<string, unknown> | undefined;
  const revenue = asNumber(reportData.annual_revenue) ||
                  asNumber((incomeStmt?.revenue as Record<string, unknown>)?.total_revenue) ||
                  asNumber((incomeStmt?.revenue as Record<string, unknown>)?.gross_receipts) || 0;
  const cogs = asNumber(reportData.cost_of_goods_sold) || 0;
  const grossProfit = asNumber(reportData.gross_profit) || (revenue - cogs);
  const netIncome = asNumber(reportData.pretax_income) ||
                    asNumber(incomeStmt?.net_income) || 0;
  const officerComp = asNumber(reportData.owner_compensation) ||
                      asNumber(reportData.officer_compensation) || 0;
  const interest = asNumber(reportData.interest_expense) || 0;
  const depreciation = asNumber(reportData.depreciation_amortization) ||
                       asNumber(reportData.depreciation) || 0;
  const amortization = asNumber(reportData.amortization) || 0;

  // Extract balance sheet fields
  const balanceSheet = {
    total_assets: asNumber(reportData.total_assets) || 0,
    total_liabilities: asNumber(reportData.total_liabilities) || 0,
    total_equity: asNumber(reportData.total_equity) ||
                  (asNumber(reportData.total_assets) || 0) - (asNumber(reportData.total_liabilities) || 0),
    cash: asNumber(reportData.cash) || 0,
    accounts_receivable: asNumber(reportData.accounts_receivable) || 0,
    inventory: asNumber(reportData.inventory) || 0,
    fixed_assets: asNumber(reportData.fixed_assets) || 0,
    intangible_assets: asNumber(reportData.intangible_assets) || 0,
    accounts_payable: asNumber(reportData.accounts_payable) || 0,
    current_assets: (asNumber(reportData.cash) || 0) +
                    (asNumber(reportData.accounts_receivable) || 0) +
                    (asNumber(reportData.inventory) || 0) +
                    (asNumber(reportData.other_current_assets) || 0),
    current_liabilities: (asNumber(reportData.accounts_payable) || 0) +
                         (asNumber(reportData.other_short_term_liabilities) || 0),
  };

  const store = createValuationDataStore({
    calculationResults,
    companyName,
    industry,
    naicsCode,
    entityType,
    fiscalYearEnd,
    valuationDate,
    balanceSheet,
    revenue,
    cogs,
    gross_profit: grossProfit,
    net_income: netIncome,
    officer_compensation: officerComp,
    interest_expense: interest,
    depreciation,
    amortization,
  });

  const accessor = createDataAccessor(store);

  return { store, accessor };
}

/**
 * Create DataStore from pass outputs map (used in orchestrator).
 */
export function createDataStoreFromPassOutputs(
  calculationResults: CalculationEngineOutput,
  passOutputs: Record<string, Record<string, unknown>>
): DataStoreFactoryResult {
  const pass1 = passOutputs['1'] || {};
  const pass2 = passOutputs['2'] || {};
  const pass3 = passOutputs['3'] || {};

  const industryClass = (pass1 as any)?.industry_classification || {};
  const incomeStmts = (pass2 as any)?.income_statements || [];
  const incomeStmt = incomeStmts[0] || {};
  const balanceSheets = (pass3 as any)?.balance_sheets || [];
  const bs = balanceSheets[0] || {};

  const opExpenses = incomeStmt.operating_expenses || {};

  const reportData: Record<string, unknown> = {
    company_name: (pass1 as any)?.company_profile?.company_name ||
                  industryClass.company_name || '',
    industry_name: industryClass.naics_description || '',
    naics_code: industryClass.naics_code || '',
    entity_type: (pass1 as any)?.company_profile?.entity_type || '',
    annual_revenue: incomeStmt.revenue?.total_revenue || incomeStmt.revenue?.gross_receipts || 0,
    pretax_income: incomeStmt.net_income || 0,
    owner_compensation: opExpenses.officer_compensation || 0,
    interest_expense: opExpenses.interest_expense || incomeStmt.interest_expense || 0,
    depreciation_amortization: opExpenses.depreciation_amortization || opExpenses.depreciation || 0,
    total_assets: bs.total_assets || 0,
    total_liabilities: bs.total_liabilities || 0,
    cash: bs.current_assets?.cash || 0,
    accounts_receivable: bs.current_assets?.accounts_receivable || 0,
    inventory: bs.current_assets?.inventory || 0,
    other_current_assets: bs.current_assets?.other_current_assets || 0,
    fixed_assets: bs.fixed_assets?.total_fixed_assets || bs.fixed_assets?.net_fixed_assets || 0,
    intangible_assets: bs.intangible_assets?.total_intangibles || 0,
    accounts_payable: bs.current_liabilities?.accounts_payable || 0,
    other_short_term_liabilities: (bs.current_liabilities?.total_current_liabilities || 0) -
                                  (bs.current_liabilities?.accounts_payable || 0),
  };

  return createDataStoreFromResults(calculationResults, reportData);
}

// ============ HELPERS ============

function asNumber(val: unknown): number {
  if (typeof val === 'number' && !isNaN(val)) return val;
  if (typeof val === 'string') {
    const n = parseFloat(val.replace(/[$,]/g, ''));
    if (!isNaN(n)) return n;
  }
  return 0;
}
