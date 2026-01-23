/**
 * Report Output Validator
 *
 * Validates that all required fields are populated before saving/rendering.
 * Identifies missing data that would result in "N/A" in the PDF.
 */

export interface ReportValidationResult {
  isValid: boolean;
  missingFields: string[];
  nullFields: string[];
  warnings: string[];
  score: number; // 0-100 completeness score
}

function getNestedValue(obj: any, path: string): any {
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
}

/**
 * Validate that a report has all required fields populated
 */
export function validateReportOutput(data: any): ReportValidationResult {
  const result: ReportValidationResult = {
    isValid: true,
    missingFields: [],
    nullFields: [],
    warnings: [],
    score: 100,
  };

  if (!data) {
    result.isValid = false;
    result.missingFields.push('report_data (entire object)');
    result.score = 0;
    return result;
  }

  // Critical valuation fields - report is useless without these
  const criticalFields = [
    { path: 'valuation_amount', alt: 'valuation_synthesis.final_valuation.concluded_value' },
    { path: 'asset_approach_value', alt: 'valuation_approaches.asset_approach.adjusted_net_asset_value' },
    { path: 'income_approach_value', alt: 'valuation_approaches.income_approach.income_approach_value' },
    { path: 'market_approach_value', alt: 'valuation_approaches.market_approach.market_approach_value' },
  ];

  // Important financial fields
  const financialFields = [
    { path: 'annual_revenue', alt: 'financial_data.income_statements.0.revenue.total_revenue' },
    { path: 'pretax_income', alt: 'financial_data.income_statements.0.net_income' },
    { path: 'total_assets', alt: 'financial_data.balance_sheets.0.total_assets' },
    { path: 'total_liabilities', alt: 'financial_data.balance_sheets.0.total_liabilities' },
    { path: 'cash', alt: 'financial_data.balance_sheets.0.current_assets.cash' },
  ];

  // Narrative fields
  const narrativeFields = [
    { path: 'executive_summary', alt: 'narratives.executive_summary.content' },
    { path: 'asset_approach_analysis', alt: 'narratives.asset_approach_narrative.content' },
    { path: 'income_approach_analysis', alt: 'narratives.income_approach_narrative.content' },
    { path: 'market_approach_analysis', alt: 'narratives.market_approach_narrative.content' },
  ];

  let missingCritical = 0;
  let missingFinancial = 0;
  let missingNarrative = 0;

  // Check critical fields
  for (const field of criticalFields) {
    const value = getNestedValue(data, field.path);
    const altValue = getNestedValue(data, field.alt);

    if ((value === undefined || value === null || value === 0) &&
        (altValue === undefined || altValue === null || altValue === 0)) {
      result.missingFields.push(`${field.path} (and alt: ${field.alt})`);
      missingCritical++;
    }
  }

  // Check financial fields
  for (const field of financialFields) {
    const value = getNestedValue(data, field.path);
    const altValue = getNestedValue(data, field.alt);

    if ((value === undefined || value === null) &&
        (altValue === undefined || altValue === null)) {
      result.nullFields.push(`${field.path} (and alt: ${field.alt})`);
      missingFinancial++;
    }
  }

  // Check narrative fields
  for (const field of narrativeFields) {
    const value = getNestedValue(data, field.path);
    const altValue = getNestedValue(data, field.alt);

    if ((!value || value.length < 50) && (!altValue || altValue.length < 50)) {
      result.warnings.push(`${field.path}: No meaningful content`);
      missingNarrative++;
    }
  }

  // Calculate score
  const totalFields = criticalFields.length + financialFields.length + narrativeFields.length;
  const missingTotal = missingCritical + missingFinancial + missingNarrative;
  result.score = Math.round(((totalFields - missingTotal) / totalFields) * 100);

  // Critical fields missing = invalid
  if (missingCritical > 0) {
    result.isValid = false;
  }

  // Special checks
  const revenue = getNestedValue(data, 'annual_revenue') ||
                  getNestedValue(data, 'financial_data.income_statements.0.revenue.total_revenue');
  if (typeof revenue === 'number' && revenue === 0) {
    result.warnings.push('Revenue is exactly zero - possible extraction failure');
  }

  const concludedValue = getNestedValue(data, 'valuation_amount') ||
                         getNestedValue(data, 'valuation_synthesis.final_valuation.concluded_value');
  if (typeof concludedValue === 'number' && concludedValue === 0) {
    result.warnings.push('Concluded value is zero - valuation synthesis may have failed');
  }

  return result;
}

/**
 * Quick check if report has minimum required data for PDF generation
 */
export function hasMinimumDataForPDF(data: any): boolean {
  if (!data) return false;

  // Must have at least one valuation approach value
  const hasValuation =
    (data.valuation_amount && data.valuation_amount > 0) ||
    (data.asset_approach_value && data.asset_approach_value > 0) ||
    (data.income_approach_value && data.income_approach_value > 0) ||
    (data.market_approach_value && data.market_approach_value > 0);

  // Must have some financial data
  const hasFinancials =
    (data.annual_revenue && data.annual_revenue > 0) ||
    (data.total_assets && data.total_assets > 0);

  return hasValuation || hasFinancials;
}
