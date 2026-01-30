/**
 * Pass Output Converters
 *
 * Converts FinalExtractionOutput from Modal extraction to
 * Pass1/2/3Output types for compatibility with existing orchestrator.
 */

import { type FinalExtractionOutput, type YearFinancialData } from './types';
import type {
  Pass1Output,
  Pass2Output,
  Pass3Output,
  DocumentInfo,
  CompanyProfile,
  OwnershipInfo,
  IndustryClassification,
  IncomeStatementYear,
  IncomeStatementLineItem,
  BalanceSheetYear,
  BalanceSheetLineItem,
  WorkingCapitalAnalysis,
  SourceReference,
} from '../claude/types-v2';

/** Create a default source reference */
function defaultSource(page = 1): SourceReference {
  return {
    document_name: 'Tax Return',
    page_number: page,
    confidence: 'medium',
  };
}

/** Create a default line item for income statement */
function createLineItem(name: string, amount: number): IncomeStatementLineItem {
  return {
    line_item: name,
    amount,
    source: defaultSource(),
  };
}

/** Create a default balance sheet line item */
function createBsLineItem(name: string, amount: number): BalanceSheetLineItem {
  return {
    line_item: name,
    amount,
    source: defaultSource(),
  };
}

/**
 * Get document type for types-v2 from entity type.
 */
function mapDocumentType(
  entityType: FinalExtractionOutput['company_info']['entity_type']
): DocumentInfo['document_type'] {
  switch (entityType) {
    case 'C-Corporation':
      return 'tax_return_1120';
    case 'S-Corporation':
      return 'tax_return_1120s';
    case 'Partnership':
      return 'tax_return_1065';
    case 'Sole Proprietorship':
      return 'tax_return_schedule_c';
    default:
      return 'other';
  }
}

/**
 * Get ownership type from entity type.
 */
function mapOwnershipType(
  entityType: FinalExtractionOutput['company_info']['entity_type']
): OwnershipInfo['ownership_type'] {
  switch (entityType) {
    case 'S-Corporation':
      return 's_corp';
    case 'C-Corporation':
      return 'c_corp';
    case 'Partnership':
      return 'partnership';
    case 'Sole Proprietorship':
      return 'sole_proprietorship';
    case 'LLC':
      return 'llc';
    default:
      return 'other';
  }
}

/**
 * Convert FinalExtractionOutput to Pass1Output (Document Classification).
 */
export function convertToPass1Output(extraction: FinalExtractionOutput): Pass1Output {
  const latestYear = extraction.available_years[0] || new Date().getFullYear();
  const latestData = extraction.financial_data[latestYear];

  const documentInfo: DocumentInfo = {
    document_type: mapDocumentType(extraction.company_info.entity_type),
    tax_year: latestYear,
    fiscal_year_end: extraction.company_info.fiscal_year_end || 'December 31',
    document_date: extraction.extraction_timestamp,
    pages_analyzed: extraction.raw_data?.document_count || 1,
    extraction_quality: 'good',
    quality_notes: ['Extracted via Modal/pdfplumber pipeline'],
    schedules_present: extraction.company_info.entity_type === 'S-Corporation' ? ['K', 'M-1', 'M-2'] :
                       extraction.company_info.entity_type === 'Partnership' ? ['K', 'M-1', 'M-2'] : [],
    missing_schedules: [],
  };

  const companyProfile: CompanyProfile = {
    legal_name: extraction.company_info.business_name,
    dba_names: [],
    ein: extraction.company_info.ein || undefined,
    state_of_incorporation: 'Not specified',
    business_address: {
      street: extraction.company_info.address || 'Not specified',
      city: 'Not specified',
      state: 'Not specified',
      zip: 'Not specified',
      country: 'USA',
    },
    years_in_business: extraction.available_years.length,
    number_of_employees: {
      full_time: extraction.company_info.number_of_employees || 0,
      part_time: 0,
      contractors: 0,
      total_fte: extraction.company_info.number_of_employees || 0,
    },
    business_description: extraction.company_info.business_activity || 'Not specified',
    products_services: [],
    primary_revenue_sources: [],
    geographic_markets: [],
    customer_concentration: {
      top_customer_percentage: 0,
      top_5_customers_percentage: 0,
    },
    key_personnel: [],
    real_estate_owned: false,
    intellectual_property: [],
    licenses_permits: [],
    litigation_pending: false,
  };

  const ownershipInfo: OwnershipInfo = {
    ownership_type: mapOwnershipType(extraction.company_info.entity_type),
    owners: [{
      name: 'Owner',
      ownership_percentage: 100,
      active_in_business: true,
      compensation: latestData?.owner_info.owner_compensation || 0,
    }],
  };

  const industryClassification: IndustryClassification = {
    naics_code: extraction.company_info.naics_code || '000000',
    naics_description: extraction.company_info.business_activity || 'Not classified',
    industry_sector: 'Other',
    industry_subsector: 'Not specified',
    business_type: 'other',
    classification_confidence: extraction.company_info.naics_code ? 'high' : 'low',
    classification_rationale: 'Based on Modal extraction data',
  };

  return {
    pass_number: 1,
    pass_name: 'Document Classification & Company Profile',
    document_info: documentInfo,
    company_profile: companyProfile,
    ownership_info: ownershipInfo,
    industry_classification: industryClassification,
    data_quality_assessment: {
      overall_quality: 'good',
      completeness_score: 80,
      reliability_score: 85,
      missing_critical_data: [],
      data_limitations: ['Data extracted via Modal - limited narrative context'],
      assumptions_required: [],
    },
    extraction_metadata: {
      processing_time_ms: 0,
      tokens_used: 0,
      model_version: 'modal-pdfplumber',
    },
  };
}

/**
 * Convert year financial data to IncomeStatementYear format.
 */
function convertToIncomeStatementYear(yearData: YearFinancialData): IncomeStatementYear {
  const is = yearData.income_statement;
  const exp = yearData.expenses;
  const revenue = is.gross_receipts_sales;
  const netIncome = is.net_income;

  return {
    fiscal_year: yearData.tax_year,
    period: {
      start_date: `${yearData.tax_year}-01-01`,
      end_date: `${yearData.tax_year}-12-31`,
      period_months: 12,
    },
    statement_type: 'calendar',
    months_covered: 12,

    revenue: {
      gross_sales: revenue,
      returns_allowances: is.returns_allowances,
      net_sales: revenue - is.returns_allowances,
      other_revenue: 0,
      total_revenue: revenue,
    },

    cost_of_goods_sold: {
      total_cogs: is.cost_of_goods_sold,
      line_items: [createLineItem('Cost of Goods Sold', is.cost_of_goods_sold)],
    },

    gross_profit: is.gross_profit,
    gross_margin_percentage: revenue > 0 ? (is.gross_profit / revenue) * 100 : 0,

    operating_expenses: {
      compensation_wages: exp.salaries_wages,
      officer_compensation: exp.compensation_of_officers,
      employee_benefits: exp.employee_benefits,
      payroll_taxes: 0,
      rent_lease: exp.rents,
      utilities: 0,
      insurance: 0,
      repairs_maintenance: exp.repairs_maintenance,
      advertising_marketing: exp.advertising,
      professional_fees: 0,
      office_expenses: 0,
      travel_entertainment: 0,
      vehicle_expenses: 0,
      depreciation: exp.depreciation,
      amortization: 0,
      bad_debt: exp.bad_debts,
      other_expenses: exp.other_deductions,
      total_operating_expenses: is.total_deductions,
      line_items: [
        createLineItem('Officer Compensation', exp.compensation_of_officers),
        createLineItem('Salaries/Wages', exp.salaries_wages),
        createLineItem('Rent', exp.rents),
        createLineItem('Depreciation', exp.depreciation),
        createLineItem('Interest', exp.interest),
        createLineItem('Other', exp.other_deductions),
      ],
    },

    operating_income: is.gross_profit - is.total_deductions,
    operating_margin_percentage: revenue > 0 ? ((is.gross_profit - is.total_deductions) / revenue) * 100 : 0,

    other_income_expense: {
      interest_income: 0,
      interest_expense: exp.interest,
      gain_loss_asset_sales: yearData.schedule_k.net_section_1231_gain,
      other_income: 0,
      other_expense: 0,
      net_other: yearData.schedule_k.net_section_1231_gain - exp.interest,
      line_items: [],
    },

    pretax_income: is.taxable_income,
    income_tax_expense: 0,
    net_income: netIncome,
    net_margin_percentage: revenue > 0 ? (netIncome / revenue) * 100 : 0,
  };
}

/**
 * Convert FinalExtractionOutput to Pass2Output (Income Statement).
 */
export function convertToPass2Output(extraction: FinalExtractionOutput): Pass2Output {
  const incomeStatements: IncomeStatementYear[] = extraction.available_years.map(year => {
    const yearData = extraction.financial_data[year];
    if (!yearData) {
      throw new Error(`Missing financial data for year ${year}`);
    }
    return convertToIncomeStatementYear(yearData);
  });

  const latestYear = extraction.available_years[0];
  const latestData = extraction.financial_data[latestYear];

  // Calculate CAGRs if we have multiple years
  let revenueCagr = 0;
  if (extraction.available_years.length >= 2) {
    const oldestYear = extraction.available_years[extraction.available_years.length - 1];
    const oldestData = extraction.financial_data[oldestYear];
    const years = extraction.available_years.length - 1;

    if (oldestData && latestData) {
      const revenueStart = oldestData.income_statement.gross_receipts_sales;
      const revenueEnd = latestData.income_statement.gross_receipts_sales;
      if (revenueStart > 0) {
        revenueCagr = (Math.pow(revenueEnd / revenueStart, 1 / years) - 1) * 100;
      }
    }
  }

  const avgRevenue = incomeStatements.reduce((sum, is) => sum + is.revenue.total_revenue, 0) / incomeStatements.length;
  const avgGrossMargin = incomeStatements.reduce((sum, is) => sum + is.gross_margin_percentage, 0) / incomeStatements.length;
  const avgNetMargin = incomeStatements.reduce((sum, is) => sum + is.net_margin_percentage, 0) / incomeStatements.length;

  return {
    pass_number: 2,
    pass_name: 'Income Statement Extraction',
    income_statements: incomeStatements,
    years_analyzed: extraction.available_years.length,
    trend_analysis: {
      revenue_cagr: revenueCagr,
      gross_profit_cagr: 0,
      operating_income_cagr: 0,
      net_income_cagr: 0,
      revenue_trend: revenueCagr > 5 ? 'growing' : revenueCagr < -5 ? 'declining' : 'stable',
      profitability_trend: 'stable',
      year_over_year_changes: [],
    },
    key_metrics: {
      average_revenue: avgRevenue,
      average_gross_margin: avgGrossMargin,
      average_operating_margin: 0,
      average_net_margin: avgNetMargin,
      revenue_per_employee: extraction.company_info.number_of_employees && extraction.company_info.number_of_employees > 0
        ? (latestData?.income_statement.gross_receipts_sales || 0) / extraction.company_info.number_of_employees
        : 0,
      most_recent_revenue: latestData?.income_statement.gross_receipts_sales || 0,
      most_recent_net_income: latestData?.income_statement.net_income || 0,
    },
    anomalies_detected: [],
    extraction_confidence: {
      overall: 'medium' as const,
      by_section: {} as Record<string, 'high' | 'medium' | 'low'>,
      notes: ['Extracted via Modal/pdfplumber pipeline'],
    },
    extraction_metadata: {
      processing_time_ms: 0,
      tokens_used: 0,
    },
  };
}

/**
 * Convert year financial data to BalanceSheetYear format.
 */
function convertToBalanceSheetYear(yearData: YearFinancialData): BalanceSheetYear {
  const bs = yearData.balance_sheet;
  const currentAssets = bs.cash + bs.accounts_receivable + bs.inventory;
  const netFixedAssets = bs.fixed_assets - bs.accumulated_depreciation;
  const currentLiabilities = bs.accounts_payable;

  return {
    fiscal_year: yearData.tax_year,
    as_of_date: `${yearData.tax_year}-12-31`,

    // Current Assets
    current_assets: {
      cash_and_equivalents: bs.cash,
      accounts_receivable_gross: bs.accounts_receivable,
      allowance_doubtful_accounts: 0,
      accounts_receivable_net: bs.accounts_receivable,
      inventory: bs.inventory,
      prepaid_expenses: 0,
      other_current_assets: 0,
      total_current_assets: currentAssets,
      line_items: [
        createBsLineItem('Cash', bs.cash),
        createBsLineItem('Accounts Receivable', bs.accounts_receivable),
        createBsLineItem('Inventory', bs.inventory),
      ],
    },

    // Fixed Assets
    fixed_assets: {
      land: 0,
      buildings: 0,
      machinery_equipment: bs.fixed_assets,
      furniture_fixtures: 0,
      vehicles: 0,
      leasehold_improvements: 0,
      construction_in_progress: 0,
      gross_fixed_assets: bs.fixed_assets,
      accumulated_depreciation: bs.accumulated_depreciation,
      net_fixed_assets: netFixedAssets,
      line_items: [
        createBsLineItem('Fixed Assets', bs.fixed_assets),
        createBsLineItem('Accumulated Depreciation', -bs.accumulated_depreciation),
      ],
    },

    // Other Assets
    other_assets: {
      goodwill: 0,
      intangible_assets: 0,
      accumulated_amortization: 0,
      net_intangibles: 0,
      investments: 0,
      notes_receivable_long_term: 0,
      due_from_shareholders: yearData.owner_info.loans_to_shareholders,
      other_long_term_assets: bs.other_assets,
      total_other_assets: bs.other_assets + yearData.owner_info.loans_to_shareholders,
      line_items: [
        createBsLineItem('Other Assets', bs.other_assets),
      ],
    },

    total_assets: bs.total_assets,

    // Current Liabilities
    current_liabilities: {
      accounts_payable: bs.accounts_payable,
      accrued_expenses: 0,
      accrued_wages: 0,
      current_portion_long_term_debt: 0,
      line_of_credit: 0,
      notes_payable_short_term: 0,
      income_taxes_payable: 0,
      deferred_revenue: 0,
      other_current_liabilities: 0,
      total_current_liabilities: currentLiabilities,
      line_items: [
        createBsLineItem('Accounts Payable', bs.accounts_payable),
      ],
    },

    // Long-Term Liabilities
    long_term_liabilities: {
      notes_payable_long_term: bs.loans_payable,
      mortgage_payable: 0,
      equipment_loans: 0,
      due_to_shareholders: yearData.owner_info.loans_from_shareholders,
      deferred_taxes: 0,
      other_long_term_liabilities: bs.other_liabilities,
      total_long_term_liabilities: bs.loans_payable + bs.other_liabilities + yearData.owner_info.loans_from_shareholders,
      line_items: [
        createBsLineItem('Loans Payable', bs.loans_payable),
      ],
    },

    total_liabilities: bs.total_liabilities,

    // Equity
    equity: {
      common_stock: 0,
      additional_paid_in_capital: 0,
      retained_earnings: bs.retained_earnings,
      current_year_net_income: yearData.income_statement.net_income,
      distributions_dividends: yearData.owner_info.distributions,
      treasury_stock: 0,
      accumulated_other_comprehensive_income: 0,
      total_equity: bs.total_equity,
      line_items: [
        createBsLineItem('Retained Earnings', bs.retained_earnings),
      ],
    },

    total_liabilities_and_equity: bs.total_liabilities + bs.total_equity,
    balance_check: Math.abs(bs.total_assets - (bs.total_liabilities + bs.total_equity)) < 1,
  };
}

/**
 * Convert year data to WorkingCapitalAnalysis format.
 */
function convertToWorkingCapitalAnalysis(yearData: YearFinancialData): WorkingCapitalAnalysis {
  const bs = yearData.balance_sheet;
  const currentAssets = bs.cash + bs.accounts_receivable + bs.inventory;
  const currentLiabilities = bs.accounts_payable;
  const revenue = yearData.income_statement.gross_receipts_sales;
  const cogs = yearData.income_statement.cost_of_goods_sold;

  const dso = revenue > 0 ? (bs.accounts_receivable / revenue) * 365 : 0;
  const dio = cogs > 0 ? (bs.inventory / cogs) * 365 : 0;
  const dpo = cogs > 0 ? (bs.accounts_payable / cogs) * 365 : 0;
  const netWc = currentAssets - currentLiabilities;
  const operatingWc = bs.accounts_receivable + bs.inventory - bs.accounts_payable;

  return {
    fiscal_year: yearData.tax_year,

    // Core Working Capital
    current_assets: currentAssets,
    current_liabilities: currentLiabilities,
    net_working_capital: netWc,

    // Operating Working Capital
    accounts_receivable: bs.accounts_receivable,
    inventory: bs.inventory,
    prepaid_expenses: 0,
    accounts_payable: bs.accounts_payable,
    accrued_expenses: 0,
    operating_working_capital: operatingWc,

    // Ratios
    current_ratio: currentLiabilities > 0 ? currentAssets / currentLiabilities : 0,
    quick_ratio: currentLiabilities > 0 ? (bs.cash + bs.accounts_receivable) / currentLiabilities : 0,
    cash_ratio: currentLiabilities > 0 ? bs.cash / currentLiabilities : 0,

    // Turnover Metrics
    days_sales_outstanding: dso,
    days_inventory_outstanding: dio,
    days_payable_outstanding: dpo,
    cash_conversion_cycle: dso + dio - dpo,

    // Working Capital as % of Revenue
    working_capital_to_revenue: revenue > 0 ? (netWc / revenue) * 100 : 0,
    operating_wc_to_revenue: revenue > 0 ? (operatingWc / revenue) * 100 : 0,

    // Adequacy Assessment
    adequacy_assessment: netWc > 0 ? 'adequate' : 'deficient',
    adequacy_notes: 'Based on Modal extraction data',

    // Normalized Working Capital
    normalized_working_capital: netWc,
    normalization_adjustments: [],
  };
}

/**
 * Convert FinalExtractionOutput to Pass3Output (Balance Sheet).
 */
export function convertToPass3Output(extraction: FinalExtractionOutput): Pass3Output {
  const balanceSheets: BalanceSheetYear[] = extraction.available_years.map(year => {
    const yearData = extraction.financial_data[year];
    if (!yearData) {
      throw new Error(`Missing financial data for year ${year}`);
    }
    return convertToBalanceSheetYear(yearData);
  });

  const workingCapitalAnalysis: WorkingCapitalAnalysis[] = extraction.available_years.map(year => {
    const yearData = extraction.financial_data[year];
    if (!yearData) {
      throw new Error(`Missing financial data for year ${year}`);
    }
    return convertToWorkingCapitalAnalysis(yearData);
  });

  const latestYear = extraction.available_years[0];
  const latestData = extraction.financial_data[latestYear];
  const bs = latestData?.balance_sheet;

  const totalAssets = bs?.total_assets || 0;
  const totalLiabilities = bs?.total_liabilities || 0;
  const totalEquity = bs?.total_equity || 0;
  const currentAssets = (bs?.cash || 0) + (bs?.accounts_receivable || 0) + (bs?.inventory || 0);
  const currentLiabilities = bs?.accounts_payable || 0;

  return {
    pass_number: 3,
    pass_name: 'Balance Sheet & Working Capital',
    balance_sheets: balanceSheets,
    working_capital_analysis: workingCapitalAnalysis,
    trend_analysis: {
      total_assets_trend: 'stable',
      total_debt_trend: 'stable',
      equity_trend: 'stable',
      working_capital_trend: 'stable',
    },
    key_metrics: {
      most_recent_total_assets: totalAssets,
      most_recent_total_liabilities: totalLiabilities,
      most_recent_equity: totalEquity,
      most_recent_working_capital: currentAssets - currentLiabilities,
      average_current_ratio: currentLiabilities > 0 ? currentAssets / currentLiabilities : 0,
      average_debt_to_equity: totalEquity > 0 ? totalLiabilities / totalEquity : 0,
      tangible_book_value: totalEquity,
    },
    asset_quality: {
      receivables_quality: 'good',
      receivables_notes: 'Based on Modal extraction data',
      inventory_quality: 'good',
      inventory_notes: 'Based on Modal extraction data',
      fixed_asset_condition: 'good',
      fixed_asset_notes: 'Based on Modal extraction data',
      intangibles_assessment: 'Not applicable',
    },
    debt_analysis: {
      total_debt: bs?.loans_payable || 0,
      debt_to_equity_ratio: totalEquity > 0 ? totalLiabilities / totalEquity : 0,
      debt_to_assets_ratio: totalAssets > 0 ? totalLiabilities / totalAssets : 0,
      interest_coverage_ratio: 0,
      debt_structure_notes: 'Extracted via Modal',
    },
    off_balance_sheet_items: extraction.red_flags.loans_to_shareholders ? [{
      description: 'Loans to shareholders',
      estimated_amount: latestData?.owner_info.loans_to_shareholders || 0,
      impact: 'material' as const,
      notes: 'Related party item that may affect valuation',
    }] : [],
    extraction_metadata: {
      processing_time_ms: 0,
      tokens_used: 0,
    },
  };
}

/**
 * Convert FinalExtractionOutput to all three pass outputs.
 */
export function convertExtractionToPassOutputs(extraction: FinalExtractionOutput): {
  pass1: Pass1Output;
  pass2: Pass2Output;
  pass3: Pass3Output;
} {
  return {
    pass1: convertToPass1Output(extraction),
    pass2: convertToPass2Output(extraction),
    pass3: convertToPass3Output(extraction),
  };
}
