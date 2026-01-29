/**
 * Cross-Document Validation
 * PRD-H: Robust PDF Extraction Pipeline
 *
 * Validates data consistency across multiple uploaded documents:
 * - Tax return revenue vs P&L revenue
 * - K-1 allocations vs tax return totals
 * - Multiple years for trend reasonableness
 */

import {
  Stage2Output,
  CrossDocValidationResult,
  FinancialDocumentType,
  StructuredFinancialData,
} from './types';

/**
 * Tolerance thresholds for cross-document validation
 */
const TOLERANCES = {
  // Revenue comparison tolerance (2%)
  REVENUE_PERCENT: 0.02,

  // Net income tolerance (5% - allows for timing differences)
  NET_INCOME_PERCENT: 0.05,

  // Balance sheet tolerance (1%)
  BALANCE_SHEET_PERCENT: 0.01,

  // Absolute minimum difference to flag (ignore small amounts)
  MIN_DIFFERENCE: 100,

  // YoY change threshold for trend validation
  MAX_YOY_CHANGE: 0.30, // 30%
};

/**
 * Document data for comparison
 */
interface DocumentData {
  documentId: string;
  documentType: FinancialDocumentType;
  taxYear: string | null;
  data: StructuredFinancialData;
}

/**
 * Compare tax return to financial statement (P&L)
 */
function compareTaxVsFinancial(
  taxReturn: DocumentData,
  financialStatement: DocumentData
): CrossDocValidationResult {
  const discrepancies: CrossDocValidationResult['discrepancies'] = [];

  const taxData = taxReturn.data;
  const fsData = financialStatement.data;

  // Compare revenue
  const taxRevenue = taxData.income_statement?.gross_receipts ?? 0;
  const fsRevenue = fsData.income_statement?.gross_receipts ?? 0;

  if (taxRevenue > 0 && fsRevenue > 0) {
    const revenueDiff = Math.abs(taxRevenue - fsRevenue);
    const revenuePercent = revenueDiff / Math.max(taxRevenue, fsRevenue);

    if (revenuePercent > TOLERANCES.REVENUE_PERCENT && revenueDiff > TOLERANCES.MIN_DIFFERENCE) {
      discrepancies.push({
        field: 'revenue',
        values: {
          [taxReturn.documentId]: taxRevenue,
          [financialStatement.documentId]: fsRevenue,
        },
        difference: revenueDiff,
        severity: revenuePercent > 0.10 ? 'error' : 'warning',
      });
    }
  }

  // Compare COGS
  const taxCogs = taxData.income_statement?.cost_of_goods_sold ?? 0;
  const fsCogs = fsData.income_statement?.cost_of_goods_sold ?? 0;

  if (taxCogs > 0 && fsCogs > 0) {
    const cogsDiff = Math.abs(taxCogs - fsCogs);
    const cogsPercent = cogsDiff / Math.max(taxCogs, fsCogs);

    if (cogsPercent > TOLERANCES.REVENUE_PERCENT && cogsDiff > TOLERANCES.MIN_DIFFERENCE) {
      discrepancies.push({
        field: 'cost_of_goods_sold',
        values: {
          [taxReturn.documentId]: taxCogs,
          [financialStatement.documentId]: fsCogs,
        },
        difference: cogsDiff,
        severity: cogsPercent > 0.10 ? 'error' : 'warning',
      });
    }
  }

  // Compare net income
  const taxNetIncome = taxData.income_statement?.total_income ?? 0;
  const fsNetIncome = fsData.income_statement?.total_income ?? 0;

  if (taxNetIncome !== 0 && fsNetIncome !== 0) {
    const netIncomeDiff = Math.abs(taxNetIncome - fsNetIncome);
    const netIncomePercent = netIncomeDiff / Math.max(Math.abs(taxNetIncome), Math.abs(fsNetIncome));

    if (netIncomePercent > TOLERANCES.NET_INCOME_PERCENT && netIncomeDiff > TOLERANCES.MIN_DIFFERENCE) {
      discrepancies.push({
        field: 'net_income',
        values: {
          [taxReturn.documentId]: taxNetIncome,
          [financialStatement.documentId]: fsNetIncome,
        },
        difference: netIncomeDiff,
        severity: netIncomePercent > 0.15 ? 'error' : 'warning',
      });
    }
  }

  // Compare total assets (if both have balance sheets)
  const taxAssets = taxData.balance_sheet?.eoy_total_assets ?? 0;
  const fsAssets = fsData.balance_sheet?.eoy_total_assets ?? 0;

  if (taxAssets > 0 && fsAssets > 0) {
    const assetsDiff = Math.abs(taxAssets - fsAssets);
    const assetsPercent = assetsDiff / Math.max(taxAssets, fsAssets);

    if (assetsPercent > TOLERANCES.BALANCE_SHEET_PERCENT && assetsDiff > TOLERANCES.MIN_DIFFERENCE) {
      discrepancies.push({
        field: 'total_assets',
        values: {
          [taxReturn.documentId]: taxAssets,
          [financialStatement.documentId]: fsAssets,
        },
        difference: assetsDiff,
        severity: assetsPercent > 0.05 ? 'error' : 'warning',
      });
    }
  }

  return {
    comparison_type: 'tax_vs_financial',
    documents_compared: [taxReturn.documentId, financialStatement.documentId],
    passed: discrepancies.filter((d) => d.severity === 'error').length === 0,
    discrepancies,
  };
}

/**
 * Compare K-1 allocations to tax return totals
 */
function compareK1VsReturn(
  k1Document: DocumentData,
  taxReturn: DocumentData
): CrossDocValidationResult {
  const discrepancies: CrossDocValidationResult['discrepancies'] = [];

  const k1Data = k1Document.data;
  const taxData = taxReturn.data;

  // Compare ordinary income
  const k1OrdinaryIncome = k1Data.schedule_k?.ordinary_business_income ?? 0;
  const taxOrdinaryIncome = taxData.income_statement?.total_income ?? 0;

  // K-1 shows partner's share, so this is more of a sanity check
  // K-1 should be a portion of the total
  if (k1OrdinaryIncome !== 0 && taxOrdinaryIncome !== 0) {
    // If K-1 amount exceeds tax return total, that's an error
    if (Math.abs(k1OrdinaryIncome) > Math.abs(taxOrdinaryIncome) * 1.05) {
      discrepancies.push({
        field: 'ordinary_income',
        values: {
          [k1Document.documentId]: k1OrdinaryIncome,
          [taxReturn.documentId]: taxOrdinaryIncome,
        },
        difference: Math.abs(k1OrdinaryIncome - taxOrdinaryIncome),
        severity: 'warning',
      });
    }
  }

  // Compare Section 179
  const k1Section179 = k1Data.schedule_k?.section_179_deduction ?? 0;
  const taxSection179 = taxData.schedule_k?.section_179_deduction ?? 0;

  if (k1Section179 !== 0 && taxSection179 !== 0) {
    if (k1Section179 > taxSection179) {
      discrepancies.push({
        field: 'section_179_deduction',
        values: {
          [k1Document.documentId]: k1Section179,
          [taxReturn.documentId]: taxSection179,
        },
        difference: k1Section179 - taxSection179,
        severity: 'warning',
      });
    }
  }

  // Compare distributions
  const k1Distributions = k1Data.schedule_k?.cash_distributions ?? 0;
  const taxDistributions = taxData.schedule_k?.cash_distributions ?? 0;

  if (k1Distributions !== 0 && taxDistributions !== 0) {
    if (k1Distributions > taxDistributions) {
      discrepancies.push({
        field: 'cash_distributions',
        values: {
          [k1Document.documentId]: k1Distributions,
          [taxReturn.documentId]: taxDistributions,
        },
        difference: k1Distributions - taxDistributions,
        severity: 'warning',
      });
    }
  }

  return {
    comparison_type: 'k1_vs_return',
    documents_compared: [k1Document.documentId, taxReturn.documentId],
    passed: discrepancies.filter((d) => d.severity === 'error').length === 0,
    discrepancies,
  };
}

/**
 * Compare year-over-year for trend reasonableness
 */
function compareYearOverYear(
  olderYear: DocumentData,
  newerYear: DocumentData
): CrossDocValidationResult {
  const discrepancies: CrossDocValidationResult['discrepancies'] = [];

  const olderData = olderYear.data;
  const newerData = newerYear.data;

  // Revenue trend
  const olderRevenue = olderData.income_statement?.gross_receipts ?? 0;
  const newerRevenue = newerData.income_statement?.gross_receipts ?? 0;

  if (olderRevenue > 0 && newerRevenue > 0) {
    const revenueChange = (newerRevenue - olderRevenue) / olderRevenue;

    if (Math.abs(revenueChange) > TOLERANCES.MAX_YOY_CHANGE) {
      discrepancies.push({
        field: 'revenue_yoy_change',
        values: {
          [olderYear.documentId]: olderRevenue,
          [newerYear.documentId]: newerRevenue,
        },
        difference: Math.abs(newerRevenue - olderRevenue),
        severity: Math.abs(revenueChange) > 0.50 ? 'error' : 'warning',
      });
    }
  }

  // Gross margin trend
  const olderGrossMargin =
    olderRevenue > 0 ? (olderData.income_statement?.gross_profit ?? 0) / olderRevenue : 0;
  const newerGrossMargin =
    newerRevenue > 0 ? (newerData.income_statement?.gross_profit ?? 0) / newerRevenue : 0;

  if (olderGrossMargin > 0 && newerGrossMargin > 0) {
    const marginChange = Math.abs(newerGrossMargin - olderGrossMargin);

    // Gross margin shouldn't swing more than 10 percentage points
    if (marginChange > 0.10) {
      discrepancies.push({
        field: 'gross_margin_change',
        values: {
          [olderYear.documentId]: Math.round(olderGrossMargin * 1000) / 10, // As percentage
          [newerYear.documentId]: Math.round(newerGrossMargin * 1000) / 10,
        },
        difference: Math.round(marginChange * 1000) / 10, // As percentage points
        severity: marginChange > 0.20 ? 'error' : 'warning',
      });
    }
  }

  // Officer compensation trend
  const olderOfficerComp = olderData.expenses?.officer_compensation ?? 0;
  const newerOfficerComp = newerData.expenses?.officer_compensation ?? 0;

  if (olderOfficerComp > 0 && newerOfficerComp > 0) {
    const compChange = Math.abs(newerOfficerComp - olderOfficerComp) / olderOfficerComp;

    // Officer comp shouldn't change more than 50% YoY
    if (compChange > 0.50) {
      discrepancies.push({
        field: 'officer_compensation_change',
        values: {
          [olderYear.documentId]: olderOfficerComp,
          [newerYear.documentId]: newerOfficerComp,
        },
        difference: Math.abs(newerOfficerComp - olderOfficerComp),
        severity: 'warning',
      });
    }
  }

  // Asset growth trend
  const olderAssets = olderData.balance_sheet?.eoy_total_assets ?? 0;
  const newerAssets = newerData.balance_sheet?.eoy_total_assets ?? 0;

  if (olderAssets > 0 && newerAssets > 0) {
    const assetChange = Math.abs(newerAssets - olderAssets) / olderAssets;

    // Assets shouldn't change more than 50% YoY without explanation
    if (assetChange > 0.50) {
      discrepancies.push({
        field: 'total_assets_change',
        values: {
          [olderYear.documentId]: olderAssets,
          [newerYear.documentId]: newerAssets,
        },
        difference: Math.abs(newerAssets - olderAssets),
        severity: assetChange > 0.75 ? 'error' : 'warning',
      });
    }
  }

  return {
    comparison_type: 'year_over_year',
    documents_compared: [olderYear.documentId, newerYear.documentId],
    passed: discrepancies.filter((d) => d.severity === 'error').length === 0,
    discrepancies,
  };
}

/**
 * Check if document is a tax return
 */
function isTaxReturn(docType: FinancialDocumentType): boolean {
  return ['FORM_1120', 'FORM_1120S', 'FORM_1065', 'SCHEDULE_C'].includes(docType);
}

/**
 * Check if document is a financial statement
 */
function isFinancialStatement(docType: FinancialDocumentType): boolean {
  return ['INCOME_STATEMENT', 'BALANCE_SHEET'].includes(docType);
}

/**
 * Check if document is a K-1
 */
function isK1(docType: FinancialDocumentType): boolean {
  return docType === 'SCHEDULE_K1';
}

/**
 * Main cross-document validation function
 *
 * @param documents - Array of Stage2Output from multiple documents
 * @returns Array of CrossDocValidationResult for each comparison made
 */
export function validateCrossDocument(
  documents: Stage2Output[]
): CrossDocValidationResult[] {
  const results: CrossDocValidationResult[] = [];

  // Convert to DocumentData for easier processing
  const docData: DocumentData[] = documents.map((doc) => ({
    documentId: doc.document_id,
    documentType: doc.classification.document_type,
    taxYear: doc.classification.tax_year,
    data: doc.structured_data,
  }));

  // Group by tax year
  const byYear: Record<string, DocumentData[]> = {};
  for (const doc of docData) {
    const year = doc.taxYear || 'unknown';
    if (!byYear[year]) {
      byYear[year] = [];
    }
    byYear[year].push(doc);
  }

  // Compare tax return to financial statements (same year)
  for (const [year, yearDocs] of Object.entries(byYear)) {
    if (year === 'unknown') continue;

    const taxReturns = yearDocs.filter((d) => isTaxReturn(d.documentType));
    const financialStatements = yearDocs.filter((d) => isFinancialStatement(d.documentType));
    const k1s = yearDocs.filter((d) => isK1(d.documentType));

    // Tax return vs P&L comparison
    for (const taxReturn of taxReturns) {
      for (const fs of financialStatements) {
        // Only compare P&L (income statements), not balance sheets alone
        if (fs.documentType === 'INCOME_STATEMENT') {
          results.push(compareTaxVsFinancial(taxReturn, fs));
        }
      }
    }

    // K-1 vs tax return comparison
    for (const k1 of k1s) {
      for (const taxReturn of taxReturns) {
        // Only compare K-1 to pass-through entities
        if (['FORM_1120S', 'FORM_1065'].includes(taxReturn.documentType)) {
          results.push(compareK1VsReturn(k1, taxReturn));
        }
      }
    }
  }

  // Year-over-year comparison
  const years = Object.keys(byYear)
    .filter((y) => y !== 'unknown')
    .sort();

  for (let i = 0; i < years.length - 1; i++) {
    const olderYear = years[i];
    const newerYear = years[i + 1];

    // Find comparable documents between years
    const olderTaxReturns = byYear[olderYear].filter((d) => isTaxReturn(d.documentType));
    const newerTaxReturns = byYear[newerYear].filter((d) => isTaxReturn(d.documentType));

    // Compare same document types across years
    for (const older of olderTaxReturns) {
      const newer = newerTaxReturns.find((d) => d.documentType === older.documentType);
      if (newer) {
        results.push(compareYearOverYear(older, newer));
      }
    }
  }

  return results;
}

/**
 * Get summary of cross-document validation results
 */
export function summarizeCrossDocValidation(
  results: CrossDocValidationResult[]
): {
  passed: boolean;
  errorCount: number;
  warningCount: number;
  comparisons: number;
  summary: string[];
} {
  let errorCount = 0;
  let warningCount = 0;
  const summary: string[] = [];

  for (const result of results) {
    const errors = result.discrepancies.filter((d) => d.severity === 'error');
    const warnings = result.discrepancies.filter((d) => d.severity === 'warning');

    errorCount += errors.length;
    warningCount += warnings.length;

    if (errors.length > 0 || warnings.length > 0) {
      summary.push(
        `${result.comparison_type}: ${errors.length} errors, ${warnings.length} warnings`
      );
      for (const disc of result.discrepancies) {
        const values = Object.entries(disc.values)
          .map(([k, v]) => `${k}: $${v.toLocaleString()}`)
          .join(' vs ');
        summary.push(
          `  - ${disc.field}: ${values} (diff: $${disc.difference.toLocaleString()}) [${disc.severity}]`
        );
      }
    }
  }

  return {
    passed: errorCount === 0,
    errorCount,
    warningCount,
    comparisons: results.length,
    summary,
  };
}

/**
 * Check if two Stage2Outputs represent the same entity
 */
export function isSameEntity(doc1: Stage2Output, doc2: Stage2Output): boolean {
  const name1 = doc1.classification.entity_name?.toLowerCase().trim();
  const name2 = doc2.classification.entity_name?.toLowerCase().trim();

  if (!name1 || !name2) return false;

  // Simple string comparison for now
  // Could be enhanced with fuzzy matching
  return name1 === name2 || name1.includes(name2) || name2.includes(name1);
}
