/**
 * Data Quality Assessment Calculator
 *
 * Evaluates the completeness and quality of provided financial data,
 * identifies gaps, and provides recommendations for improving accuracy.
 *
 * @module lib/calculations/data-quality-scorer
 */

import {
  DataQualityResult,
  MissingDataItem,
  ImprovementRecommendation,
  DocumentType,
} from './extended-types';
import { SingleYearFinancials, BalanceSheetData } from './types';
import { safeNumber } from './utils';

// ============================================
// REQUIRED DATA DEFINITIONS
// ============================================

/**
 * Critical fields that must be present for a basic valuation
 */
const CRITICAL_FIELDS = [
  { field: 'gross_receipts', name: 'Gross Receipts/Revenue', category: 'Income', weight: 1.0 },
  { field: 'net_income', name: 'Net Income', category: 'Income', weight: 1.0 },
  { field: 'officer_compensation', name: 'Officer Compensation', category: 'SDE Add-backs', weight: 0.9 },
  { field: 'cost_of_goods_sold', name: 'Cost of Goods Sold', category: 'Income', weight: 0.8 },
  { field: 'depreciation', name: 'Depreciation', category: 'SDE Add-backs', weight: 0.8 },
] as const;

/**
 * Important fields that improve valuation accuracy
 */
const IMPORTANT_FIELDS = [
  { field: 'interest_expense', name: 'Interest Expense', category: 'EBITDA Add-backs', weight: 0.7 },
  { field: 'amortization', name: 'Amortization', category: 'EBITDA Add-backs', weight: 0.6 },
  { field: 'rent_expense', name: 'Rent/Lease Expense', category: 'Expenses', weight: 0.6 },
  { field: 'salaries_wages', name: 'Salaries and Wages', category: 'Expenses', weight: 0.5 },
  { field: 'taxes', name: 'Taxes', category: 'Expenses', weight: 0.5 },
  { field: 'insurance', name: 'Insurance', category: 'Expenses', weight: 0.4 },
  { field: 'utilities', name: 'Utilities', category: 'Expenses', weight: 0.3 },
  { field: 'advertising', name: 'Advertising', category: 'Expenses', weight: 0.3 },
] as const;

/**
 * Balance sheet fields and their importance
 */
const BALANCE_SHEET_FIELDS = [
  { path: 'assets.current_assets.cash', name: 'Cash', category: 'Balance Sheet', weight: 0.8 },
  { path: 'assets.current_assets.accounts_receivable', name: 'Accounts Receivable', category: 'Balance Sheet', weight: 0.7 },
  { path: 'assets.current_assets.inventory', name: 'Inventory', category: 'Balance Sheet', weight: 0.6 },
  { path: 'assets.fixed_assets.net_fixed_assets', name: 'Fixed Assets (Net)', category: 'Balance Sheet', weight: 0.7 },
  { path: 'assets.total_assets', name: 'Total Assets', category: 'Balance Sheet', weight: 0.9 },
  { path: 'liabilities.current_liabilities.accounts_payable', name: 'Accounts Payable', category: 'Balance Sheet', weight: 0.6 },
  { path: 'liabilities.total_liabilities', name: 'Total Liabilities', category: 'Balance Sheet', weight: 0.8 },
  { path: 'equity.total_equity', name: 'Total Equity', category: 'Balance Sheet', weight: 0.7 },
] as const;

/**
 * Documents that would improve valuation quality
 */
const VALUABLE_DOCUMENTS: DocumentType[] = [
  {
    type: 'tax_return',
    name: 'Business Tax Return (1120/1120-S/1065)',
    importance: 'critical',
    impact_description: 'Required for accurate SDE calculation and add-back identification',
    years_preferred: 3,
  },
  {
    type: 'profit_loss',
    name: 'Profit & Loss Statement',
    importance: 'high',
    impact_description: 'Provides detailed expense breakdown for normalization',
    years_preferred: 3,
  },
  {
    type: 'balance_sheet',
    name: 'Balance Sheet',
    importance: 'high',
    impact_description: 'Essential for working capital analysis and asset-based valuation',
    years_preferred: 2,
  },
  {
    type: 'tax_return_schedule_k1',
    name: 'Schedule K-1 (Partner/Shareholder)',
    importance: 'medium',
    impact_description: 'Reveals pass-through income and distributions',
    years_preferred: 1,
  },
  {
    type: 'ar_aging',
    name: 'Accounts Receivable Aging Report',
    importance: 'medium',
    impact_description: 'Assesses collectibility and working capital quality',
    years_preferred: 1,
  },
  {
    type: 'inventory_list',
    name: 'Inventory Listing',
    importance: 'medium',
    impact_description: 'Validates inventory value and identifies obsolescence',
    years_preferred: 1,
  },
  {
    type: 'fixed_asset_schedule',
    name: 'Fixed Asset/Depreciation Schedule',
    importance: 'medium',
    impact_description: 'Identifies equipment condition and capital needs',
    years_preferred: 1,
  },
  {
    type: 'debt_schedule',
    name: 'Debt Schedule',
    importance: 'medium',
    impact_description: 'Required for proper debt adjustment in enterprise value',
    years_preferred: 1,
  },
  {
    type: 'customer_list',
    name: 'Top 10 Customer Revenue Breakdown',
    importance: 'high',
    impact_description: 'Critical for assessing customer concentration risk',
    years_preferred: 1,
  },
  {
    type: 'lease_agreements',
    name: 'Real Estate Lease Agreements',
    importance: 'medium',
    impact_description: 'Identifies below/above-market rent adjustments',
    years_preferred: 1,
  },
  {
    type: 'ytd_financials',
    name: 'Year-to-Date Financial Statements',
    importance: 'high',
    impact_description: 'Shows current year trajectory and recent performance',
    years_preferred: 1,
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Safely access nested object property by path
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((curr: unknown, key) => {
    if (curr && typeof curr === 'object' && key in (curr as Record<string, unknown>)) {
      return (curr as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/**
 * Check if a value is present and non-zero
 */
function isPresent(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'number') return !isNaN(value) && value !== 0;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}

/**
 * Calculate weighted score for a set of fields
 */
function calculateFieldScore(
  data: Record<string, unknown>,
  fields: ReadonlyArray<{ field?: string; path?: string; weight: number }>
): { score: number; present: number; total: number } {
  let totalWeight = 0;
  let achievedWeight = 0;
  let presentCount = 0;

  for (const field of fields) {
    const key = field.field || field.path || '';
    const value = field.path ? getNestedValue(data, field.path) : data[key];
    totalWeight += field.weight;

    if (isPresent(value)) {
      achievedWeight += field.weight;
      presentCount++;
    }
  }

  return {
    score: totalWeight > 0 ? achievedWeight / totalWeight : 0,
    present: presentCount,
    total: fields.length,
  };
}

// ============================================
// MAIN CALCULATION FUNCTIONS
// ============================================

export interface DataQualityInputs {
  financials: SingleYearFinancials[];
  balance_sheet?: BalanceSheetData;
  documents_provided?: string[];
  company_name?: string;
  industry?: string;
}

/**
 * Calculate comprehensive data quality score
 */
export function calculateDataQuality(inputs: DataQualityInputs): DataQualityResult {
  const { financials, balance_sheet, documents_provided = [] } = inputs;

  // Flatten financials for field checking
  const latestFinancials = financials[0] || {};
  const financialData = latestFinancials as unknown as Record<string, unknown>;
  const balanceData = (balance_sheet || {}) as unknown as Record<string, unknown>;

  // ============================================
  // CALCULATE FIELD COMPLETENESS
  // ============================================

  const criticalScore = calculateFieldScore(financialData, CRITICAL_FIELDS);
  const importantScore = calculateFieldScore(financialData, IMPORTANT_FIELDS);
  const balanceSheetScore = balance_sheet
    ? calculateFieldScore(balanceData, BALANCE_SHEET_FIELDS)
    : { score: 0, present: 0, total: BALANCE_SHEET_FIELDS.length };

  // ============================================
  // IDENTIFY MISSING DATA
  // ============================================

  const missingItems: MissingDataItem[] = [];

  // Check critical fields
  for (const field of CRITICAL_FIELDS) {
    if (!isPresent(financialData[field.field])) {
      missingItems.push({
        field_name: field.name,
        category: field.category,
        importance: 'critical',
        impact_on_valuation: getFieldImpact(field.field, 'critical'),
        how_to_provide: getProvisionInstructions(field.field),
      });
    }
  }

  // Check important fields
  for (const field of IMPORTANT_FIELDS) {
    if (!isPresent(financialData[field.field])) {
      missingItems.push({
        field_name: field.name,
        category: field.category,
        importance: 'high',
        impact_on_valuation: getFieldImpact(field.field, 'high'),
        how_to_provide: getProvisionInstructions(field.field),
      });
    }
  }

  // Check balance sheet fields
  if (balance_sheet) {
    for (const field of BALANCE_SHEET_FIELDS) {
      if (!isPresent(getNestedValue(balanceData, field.path))) {
        missingItems.push({
          field_name: field.name,
          category: field.category,
          importance: 'medium',
          impact_on_valuation: getFieldImpact(field.path, 'medium'),
          how_to_provide: getProvisionInstructions(field.path),
        });
      }
    }
  } else {
    // No balance sheet at all
    missingItems.push({
      field_name: 'Complete Balance Sheet',
      category: 'Balance Sheet',
      importance: 'high',
      impact_on_valuation: 'Balance sheet is required for working capital analysis, asset-based valuation, and comprehensive financial health assessment.',
      how_to_provide: 'Provide a balance sheet as of the most recent fiscal year-end, or request one from your accountant.',
    });
  }

  // ============================================
  // EVALUATE DOCUMENT COVERAGE
  // ============================================

  const documentCoverage = evaluateDocumentCoverage(documents_provided);

  // ============================================
  // CALCULATE MULTI-YEAR DATA QUALITY
  // ============================================

  const yearsOfData = financials.length;
  const multiYearScore = Math.min(1, yearsOfData / 3); // 3 years is ideal

  const yearConsistency = calculateYearConsistency(financials);

  // ============================================
  // GENERATE RECOMMENDATIONS
  // ============================================

  const recommendations = generateRecommendations(
    missingItems,
    documentCoverage,
    yearsOfData,
    criticalScore,
    inputs.industry
  );

  // ============================================
  // CALCULATE OVERALL SCORES
  // ============================================

  // Weighted overall score
  const overallScore = (
    criticalScore.score * 0.40 +
    importantScore.score * 0.20 +
    balanceSheetScore.score * 0.20 +
    multiYearScore * 0.10 +
    yearConsistency * 0.05 +
    documentCoverage.coverage_score * 0.05
  );

  // Determine confidence level
  let confidence_level: 'High' | 'Moderate' | 'Low' | 'Insufficient';
  if (overallScore >= 0.85) confidence_level = 'High';
  else if (overallScore >= 0.65) confidence_level = 'Moderate';
  else if (overallScore >= 0.40) confidence_level = 'Low';
  else confidence_level = 'Insufficient';

  // Determine if valuation can proceed
  const can_proceed = criticalScore.score >= 0.6;

  return {
    overall_score: Math.round(overallScore * 100),
    confidence_level,
    can_proceed_with_valuation: can_proceed,

    category_scores: {
      critical_data: {
        score: Math.round(criticalScore.score * 100),
        present: criticalScore.present,
        total: criticalScore.total,
        label: 'Critical Financial Data',
      },
      important_data: {
        score: Math.round(importantScore.score * 100),
        present: importantScore.present,
        total: importantScore.total,
        label: 'Important Financial Details',
      },
      balance_sheet: {
        score: Math.round(balanceSheetScore.score * 100),
        present: balanceSheetScore.present,
        total: balanceSheetScore.total,
        label: 'Balance Sheet Data',
      },
      multi_year: {
        score: Math.round(multiYearScore * 100),
        present: yearsOfData,
        total: 3,
        label: 'Historical Data (Years)',
      },
    },

    missing_data: missingItems,
    document_coverage: documentCoverage,
    recommendations,

    // Quality narrative for the report
    quality_narrative: generateQualityNarrative(
      overallScore,
      confidence_level,
      missingItems,
      yearsOfData,
      recommendations
    ),

    calculated_at: new Date().toISOString(),
  };
}

// ============================================
// SUPPORT FUNCTIONS
// ============================================

function getFieldImpact(field: string, importance: string): string {
  const impacts: Record<string, string> = {
    gross_receipts: 'Revenue is the foundation for revenue multiples and trend analysis. Without it, valuation accuracy is severely compromised.',
    net_income: 'Net income is required to calculate SDE and EBITDA. Missing this prevents proper earnings-based valuation.',
    officer_compensation: 'Officer compensation is typically the largest SDE add-back. Without it, SDE may be significantly understated.',
    cost_of_goods_sold: 'COGS is needed to calculate gross margin and assess profitability relative to industry benchmarks.',
    depreciation: 'Depreciation is a key EBITDA add-back. Missing this may understate cash flow and value.',
    interest_expense: 'Interest expense is required for proper EBITDA calculation and debt analysis.',
    amortization: 'Amortization affects EBITDA calculation, particularly for businesses with intangible assets.',
    rent_expense: 'Rent expense is needed to identify potential market rent adjustments and real estate impacts.',
    salaries_wages: 'Total wages help benchmark labor costs against industry standards.',
    'assets.current_assets.cash': 'Cash levels affect working capital and may be excluded from the business sale.',
    'assets.current_assets.accounts_receivable': 'A/R is critical for working capital calculation and assessing collection risk.',
    'assets.current_assets.inventory': 'Inventory valuation affects asset-based methods and working capital.',
    'assets.total_assets': 'Total assets are required for efficiency ratios and asset-based valuation.',
    'liabilities.total_liabilities': 'Total liabilities are essential for calculating equity value and debt adjustments.',
  };

  return impacts[field] || `This ${importance} data point improves the accuracy and reliability of the valuation.`;
}

function getProvisionInstructions(field: string): string {
  const instructions: Record<string, string> = {
    gross_receipts: 'Found on Line 1c of Form 1120-S, Line 1c of Form 1120, or Line 3 of Schedule C. Can also be provided from a P&L statement.',
    net_income: 'Found on Line 18 of Form 1120-S, Line 28 of Form 1120, or Line 31 of Schedule C.',
    officer_compensation: 'Found on Line 7 of Form 1120-S or detailed in Schedule E of Form 1120.',
    cost_of_goods_sold: 'Found on Line 2 of most business tax returns or the COGS section of a P&L.',
    depreciation: 'Found on Line 14 of Form 1120-S/1120 or from the depreciation schedule.',
    interest_expense: 'Found on Line 13 of Form 1120-S/1120.',
    rent_expense: 'Found on Line 16 of Form 1120-S/1120 or detailed in expense schedules.',
    'assets.current_assets.cash': 'Provide from the most recent balance sheet or bank statement.',
    'assets.current_assets.accounts_receivable': 'Provide from balance sheet or A/R aging report.',
    'assets.current_assets.inventory': 'Provide from balance sheet or inventory valuation report.',
  };

  return instructions[field] || 'Please provide this information from your financial statements or tax returns.';
}

function evaluateDocumentCoverage(documents_provided: string[]): DataQualityResult['document_coverage'] {
  const normalized = documents_provided.map(d => d.toLowerCase());

  const provided: string[] = [];
  const missing: DocumentType[] = [];

  for (const doc of VALUABLE_DOCUMENTS) {
    const isProvided = normalized.some(d =>
      d.includes(doc.type.replace(/_/g, ' ')) ||
      d.includes(doc.name.toLowerCase()) ||
      matchesDocumentType(d, doc.type)
    );

    if (isProvided) {
      provided.push(doc.name);
    } else {
      missing.push(doc);
    }
  }

  // Calculate coverage score (critical documents weighted more heavily)
  const totalWeight = VALUABLE_DOCUMENTS.reduce((sum, d) =>
    sum + (d.importance === 'critical' ? 3 : d.importance === 'high' ? 2 : 1), 0
  );

  const achievedWeight = provided.reduce((sum, name) => {
    const doc = VALUABLE_DOCUMENTS.find(d => d.name === name);
    return sum + (doc ? (doc.importance === 'critical' ? 3 : doc.importance === 'high' ? 2 : 1) : 0);
  }, 0);

  return {
    documents_provided: provided,
    documents_missing: missing,
    coverage_score: totalWeight > 0 ? achievedWeight / totalWeight : 0,
  };
}

function matchesDocumentType(provided: string, docType: string): boolean {
  const mappings: Record<string, string[]> = {
    tax_return: ['1120', '1120-s', '1120s', '1065', 'schedule c', 'tax return'],
    profit_loss: ['p&l', 'profit and loss', 'income statement'],
    balance_sheet: ['balance sheet', 'bs', 'statement of financial position'],
    ar_aging: ['aging', 'receivable', 'a/r'],
    customer_list: ['customer', 'client list', 'revenue breakdown'],
    ytd_financials: ['ytd', 'year to date', 'interim'],
  };

  const keywords = mappings[docType] || [];
  return keywords.some(k => provided.includes(k));
}

function calculateYearConsistency(financials: SingleYearFinancials[]): number {
  if (financials.length < 2) return 0.5; // Neutral if only one year

  // Check if revenue trend is consistent (no huge unexplained swings)
  const revenues = financials.map(f => safeNumber(f.gross_receipts)).filter(r => r > 0);
  if (revenues.length < 2) return 0.5;

  // Calculate year-over-year changes
  const changes: number[] = [];
  for (let i = 1; i < revenues.length; i++) {
    const change = Math.abs((revenues[i] - revenues[i-1]) / revenues[i-1]);
    changes.push(change);
  }

  // High volatility (>50% swings) reduces consistency score
  const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
  if (avgChange > 0.5) return 0.3;
  if (avgChange > 0.3) return 0.6;
  if (avgChange > 0.15) return 0.8;
  return 1.0;
}

function generateRecommendations(
  missingItems: MissingDataItem[],
  documentCoverage: DataQualityResult['document_coverage'],
  yearsOfData: number,
  criticalScore: { score: number },
  industry?: string
): ImprovementRecommendation[] {
  const recommendations: ImprovementRecommendation[] = [];

  // Critical data gaps
  const criticalMissing = missingItems.filter(m => m.importance === 'critical');
  if (criticalMissing.length > 0) {
    recommendations.push({
      priority: 'critical',
      action: 'Provide Missing Critical Data',
      description: `The following critical data points are missing: ${criticalMissing.map(m => m.field_name).join(', ')}. These are essential for an accurate valuation.`,
      impact_on_accuracy: `Providing this data could improve valuation accuracy by ${Math.round(criticalMissing.length * 15)}%`,
      effort_level: 'low',
    });
  }

  // Additional years of data
  if (yearsOfData < 3) {
    recommendations.push({
      priority: 'high',
      action: `Provide ${3 - yearsOfData} Additional Year(s) of Financial Data`,
      description: `You provided ${yearsOfData} year(s) of data. Having 3 years enables trend analysis and weighted average calculations for a more reliable valuation.`,
      impact_on_accuracy: `Adding ${3 - yearsOfData} more year(s) of data could improve accuracy by 10-15%`,
      effort_level: 'medium',
    });
  }

  // Balance sheet
  if (!documentCoverage.documents_provided.includes('Balance Sheet')) {
    recommendations.push({
      priority: 'high',
      action: 'Provide Balance Sheet',
      description: 'A balance sheet is required for working capital analysis, asset-based valuation methods, and financial health ratios.',
      impact_on_accuracy: 'Balance sheet data enables 20% more valuation methodologies',
      effort_level: 'low',
    });
  }

  // Customer concentration data
  if (!documentCoverage.documents_provided.includes('Top 10 Customer Revenue Breakdown')) {
    recommendations.push({
      priority: 'high',
      action: 'Provide Customer Concentration Data',
      description: 'A breakdown of revenue by top 10 customers is critical for assessing concentration risk, which directly impacts valuation multiples.',
      impact_on_accuracy: 'Customer data enables proper risk scoring that can affect value by ±10-20%',
      effort_level: 'low',
    });
  }

  // YTD financials
  if (!documentCoverage.documents_provided.includes('Year-to-Date Financial Statements') && yearsOfData > 0) {
    recommendations.push({
      priority: 'medium',
      action: 'Provide Year-to-Date Financials',
      description: 'Current year financial data shows recent performance trajectory and strengthens the valuation with more timely information.',
      impact_on_accuracy: 'YTD data provides more current performance indicators',
      effort_level: 'low',
    });
  }

  // Industry-specific recommendations
  if (industry) {
    const industryRecs = getIndustrySpecificRecommendations(industry, documentCoverage);
    recommendations.push(...industryRecs);
  }

  // Sort by priority
  const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations.slice(0, 7); // Top 7 recommendations
}

function getIndustrySpecificRecommendations(
  industry: string,
  documentCoverage: DataQualityResult['document_coverage']
): ImprovementRecommendation[] {
  const recs: ImprovementRecommendation[] = [];
  const ind = industry.toLowerCase();

  // Manufacturing/distribution - inventory is critical
  if (ind.includes('manufactur') || ind.includes('distribution') || ind.includes('wholesale')) {
    if (!documentCoverage.documents_provided.some(d => d.toLowerCase().includes('inventory'))) {
      recs.push({
        priority: 'high',
        action: 'Provide Detailed Inventory Report',
        description: 'For manufacturing/distribution businesses, inventory valuation significantly impacts the asset-based approach and working capital calculation.',
        impact_on_accuracy: 'Detailed inventory data can affect asset value by 10-25%',
        effort_level: 'medium',
      });
    }
  }

  // Service businesses - labor analysis
  if (ind.includes('service') || ind.includes('consulting') || ind.includes('professional')) {
    recs.push({
      priority: 'medium',
      action: 'Provide Employee Roster with Compensation',
      description: 'Service businesses are valued heavily on their team. Employee data helps assess key person risk and labor efficiency.',
      impact_on_accuracy: 'Labor analysis improves risk assessment accuracy',
      effort_level: 'medium',
    });
  }

  // Real estate intensive businesses
  if (ind.includes('restaurant') || ind.includes('retail') || ind.includes('hotel')) {
    if (!documentCoverage.documents_provided.some(d => d.toLowerCase().includes('lease'))) {
      recs.push({
        priority: 'high',
        action: 'Provide Lease Agreements',
        description: 'Location-dependent businesses require lease analysis to assess rent reasonableness and transferability.',
        impact_on_accuracy: 'Lease terms can affect value by 5-15% through rent adjustments',
        effort_level: 'low',
      });
    }
  }

  return recs;
}

function generateQualityNarrative(
  overallScore: number,
  confidence: string,
  missingItems: MissingDataItem[],
  yearsOfData: number,
  recommendations: ImprovementRecommendation[]
): string {
  const criticalMissing = missingItems.filter(m => m.importance === 'critical').length;
  const highMissing = missingItems.filter(m => m.importance === 'high').length;

  let narrative = '';

  // Opening assessment
  if (overallScore >= 0.85) {
    narrative = `The financial data provided is comprehensive and supports a high-confidence valuation. `;
  } else if (overallScore >= 0.65) {
    narrative = `The financial data provided is adequate for a reasonable valuation estimate. `;
  } else if (overallScore >= 0.40) {
    narrative = `The financial data provided has notable gaps that affect valuation precision. `;
  } else {
    narrative = `The financial data provided is insufficient for a reliable valuation. `;
  }

  // Years commentary
  if (yearsOfData >= 3) {
    narrative += `With ${yearsOfData} years of historical data, we can perform meaningful trend analysis. `;
  } else if (yearsOfData === 2) {
    narrative += `With 2 years of data, basic trend analysis is possible, though 3 years would be preferable. `;
  } else {
    narrative += `With only 1 year of data, trend analysis is limited; consider providing additional years. `;
  }

  // Missing data commentary
  if (criticalMissing > 0) {
    narrative += `**Important:** ${criticalMissing} critical data point(s) are missing, which affects core valuation calculations. `;
  }

  if (highMissing > 0 && criticalMissing === 0) {
    narrative += `${highMissing} important data point(s) would improve accuracy. `;
  }

  // Improvement opportunity
  if (recommendations.length > 0 && overallScore < 0.85) {
    const topRec = recommendations[0];
    narrative += `\n\n**To improve this valuation:** ${topRec.action}. ${topRec.impact_on_accuracy}.`;
  }

  return narrative;
}

export { VALUABLE_DOCUMENTS, CRITICAL_FIELDS, IMPORTANT_FIELDS };
