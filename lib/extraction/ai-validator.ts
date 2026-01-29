/**
 * AI Validation and Enrichment (Stage 3)
 * PRD-H: Robust PDF Extraction Pipeline
 *
 * Uses Claude Sonnet (or Opus for complex cases) to:
 * - Validate extracted data for reasonableness
 * - Suggest corrections with reasoning
 * - Identify missing critical data
 * - Generate SDE add-back summary
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  Stage2Output,
  ValidationResult,
  FinalExtractionOutput,
  SuggestedCorrection,
  SuggestedSDEAddbacks,
  ValidationSummary,
  ProcessingMetadata,
  CompanyInfo,
  YearlyFinancialData,
  TrendAnalysis,
  ExtractedDocumentMeta,
  StructuredFinancialData,
} from './types';

// Model configuration
const SONNET_MODEL = 'claude-sonnet-4-20250514';
const OPUS_MODEL = 'claude-opus-4-20250514';

/**
 * Generate a simple UUID
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Escalation thresholds
const ESCALATION_THRESHOLDS = {
  MIN_CONFIDENCE: 70, // Escalate if below this
  MAX_ERRORS: 3, // Escalate if more than this many errors
};

/**
 * AI Validation result from Claude
 */
interface AIValidationResult {
  corrections: SuggestedCorrection[];
  missing_data: string[];
  sde_summary: SuggestedSDEAddbacks;
  red_flags: string[];
  overall_confidence: number;
  notes: string[];
}

/**
 * Determine if we should escalate to Opus
 */
function shouldEscalateToOpus(
  validationResults: ValidationResult[],
  stage2Confidence: number
): { escalate: boolean; reason: string | null } {
  const errorCount = validationResults.filter((r) => r.severity === 'error').length;

  if (stage2Confidence < ESCALATION_THRESHOLDS.MIN_CONFIDENCE) {
    return {
      escalate: true,
      reason: `Low extraction confidence (${stage2Confidence}% < ${ESCALATION_THRESHOLDS.MIN_CONFIDENCE}%)`,
    };
  }

  if (errorCount > ESCALATION_THRESHOLDS.MAX_ERRORS) {
    return {
      escalate: true,
      reason: `Too many validation errors (${errorCount} > ${ESCALATION_THRESHOLDS.MAX_ERRORS})`,
    };
  }

  return { escalate: false, reason: null };
}

/**
 * Build prompt for AI validation
 */
function buildValidationPrompt(
  stage2Output: Stage2Output,
  validationResults: ValidationResult[]
): string {
  const data = stage2Output.structured_data;
  if (!data) {
    return 'No structured data available for validation.';
  }

  // Build financial summary
  const financialSummary = buildFinancialSummary(data);

  // Build validation issues
  const validationIssues = validationResults.map((r) => `- [${r.severity.toUpperCase()}] ${r.id}: ${r.message}`).join('\n');

  return `You are a financial analyst reviewing extracted data from business financial documents for a business valuation. Your task is to:

1. VALIDATE the extracted data for reasonableness
2. SUGGEST corrections for any suspicious values (with reasoning)
3. IDENTIFY any missing critical data for SDE valuation
4. CALCULATE suggested SDE add-backs based on the data

DOCUMENT TYPE: ${stage2Output.classification.document_type}
TAX YEAR: ${stage2Output.classification.tax_year || 'Unknown'}
ENTITY: ${stage2Output.classification.entity_name || 'Unknown'}

=== EXTRACTED FINANCIAL DATA ===
${financialSummary}

=== VALIDATION ISSUES DETECTED ===
${validationIssues || 'No validation issues detected'}

=== RED FLAGS FROM EXTRACTION ===
${formatRedFlags(data.red_flags)}

=== YOUR TASK ===
Based on your analysis, provide:

1. **Corrections**: Any values that seem wrong and should be adjusted
2. **Missing Data**: Critical fields that are missing for SDE calculation
3. **SDE Add-backs**: Calculate suggested add-backs based on the data:
   - Officer/owner compensation (from salary or guaranteed payments)
   - Depreciation (standard add-back for cash flow)
   - Amortization (if present)
   - Interest expense (debt-service add-back)
   - Section 179 deduction (accelerated depreciation add-back)
   - Non-recurring capital gains (should be excluded, not added back)
   - Owner benefits (auto, health insurance, etc.)
4. **Red Flags**: Any additional concerns you notice
5. **Confidence Score**: 0-100, how confident are you in this data

Respond ONLY with valid JSON (no markdown code blocks):
{
  "corrections": [
    {
      "field": "officer_compensation",
      "original_value": 0,
      "corrected_value": 75000,
      "confidence": "medium",
      "reasoning": "Schedule K shows guaranteed payments of $75,000"
    }
  ],
  "missing_data": ["ending_inventory", "beginning_inventory"],
  "sde_summary": {
    "officer_compensation": 150000,
    "guaranteed_payments": 0,
    "depreciation": 25000,
    "amortization": 0,
    "interest": 8000,
    "section_179_deduction": 50000,
    "non_recurring_gains_excluded": 10000,
    "owner_benefits": 12000,
    "total_suggested_addbacks": 235000,
    "notes": ["Section 179 is accelerated depreciation", "Capital gain excluded as non-recurring"]
  },
  "red_flags": ["High loans to shareholders may indicate disguised distributions"],
  "overall_confidence": 85,
  "notes": ["Data appears complete", "Balance sheet balances within tolerance"]
}`;
}

/**
 * Build human-readable financial summary
 */
function buildFinancialSummary(data: StructuredFinancialData): string {
  const lines: string[] = [];

  // Income Statement
  const is = data.income_statement;
  if (is) {
    lines.push('INCOME STATEMENT:');
    lines.push(`  Gross Receipts: $${is.gross_receipts.toLocaleString()}`);
    lines.push(`  COGS: $${is.cost_of_goods_sold.toLocaleString()}`);
    lines.push(`  Gross Profit: $${is.gross_profit.toLocaleString()}`);
    lines.push(`  Other Income: $${is.other_income.toLocaleString()}`);
    lines.push(`  Total Income: $${is.total_income.toLocaleString()}`);
    lines.push('');
  }

  // Expenses
  const exp = data.expenses;
  if (exp) {
    lines.push('EXPENSES:');
    lines.push(`  Officer Compensation: $${(exp.officer_compensation ?? 0).toLocaleString()}`);
    lines.push(`  Salaries & Wages: $${(exp.salaries_wages ?? 0).toLocaleString()}`);
    lines.push(`  Rent: $${(exp.rent ?? 0).toLocaleString()}`);
    lines.push(`  Depreciation: $${(exp.depreciation ?? 0).toLocaleString()}`);
    lines.push(`  Interest: $${(exp.interest ?? 0).toLocaleString()}`);
    lines.push(`  Other Deductions: $${(exp.other_deductions ?? 0).toLocaleString()}`);
    lines.push(`  Total Deductions: $${(exp.total_deductions ?? 0).toLocaleString()}`);
    lines.push('');
  }

  // Balance Sheet
  const bs = data.balance_sheet;
  if (bs) {
    lines.push('BALANCE SHEET (EOY):');
    lines.push(`  Total Assets: $${bs.eoy_total_assets.toLocaleString()}`);
    lines.push(`  Total Liabilities: $${bs.eoy_total_liabilities.toLocaleString()}`);
    lines.push(`  Total Equity: $${bs.eoy_total_equity.toLocaleString()}`);
    lines.push(`  Loans to Shareholders: $${(bs.eoy_loans_to_shareholders ?? 0).toLocaleString()}`);
    lines.push(`  Loans from Shareholders: $${(bs.eoy_loans_from_shareholders ?? 0).toLocaleString()}`);
    lines.push(`  Retained Earnings: $${(bs.eoy_retained_earnings ?? 0).toLocaleString()}`);
    lines.push('');
  }

  // Schedule K
  const k = data.schedule_k;
  if (k) {
    lines.push('SCHEDULE K:');
    lines.push(`  Ordinary Business Income: $${(k.ordinary_business_income ?? 0).toLocaleString()}`);
    lines.push(`  Section 179 Deduction: $${(k.section_179_deduction ?? 0).toLocaleString()}`);
    lines.push(`  Cash Distributions: $${(k.cash_distributions ?? 0).toLocaleString()}`);
    lines.push(`  Net Short-term Capital Gain: $${(k.net_short_term_capital_gain ?? 0).toLocaleString()}`);
    lines.push(`  Net Long-term Capital Gain: $${(k.net_long_term_capital_gain ?? 0).toLocaleString()}`);
    lines.push('');
  }

  // Guaranteed Payments
  const gp = data.guaranteed_payments;
  if (gp) {
    lines.push('GUARANTEED PAYMENTS:');
    lines.push(`  Services: $${gp.services.toLocaleString()}`);
    lines.push(`  Capital: $${gp.capital.toLocaleString()}`);
    lines.push(`  Total: $${gp.total.toLocaleString()}`);
    lines.push('');
  }

  // COVID Adjustments
  const covid = data.covid_adjustments;
  if (covid) {
    const total = covid.ppp_loan_forgiveness + covid.eidl_advances + covid.employee_retention_credit;
    if (total > 0) {
      lines.push('COVID ADJUSTMENTS:');
      lines.push(`  PPP Forgiveness: $${covid.ppp_loan_forgiveness.toLocaleString()}`);
      lines.push(`  EIDL Advances: $${covid.eidl_advances.toLocaleString()}`);
      lines.push(`  ERC: $${covid.employee_retention_credit.toLocaleString()}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Format red flags for prompt
 */
function formatRedFlags(redFlags: StructuredFinancialData['red_flags']): string {
  const lines: string[] = [];

  if (redFlags.has_loans_to_shareholders) {
    lines.push(`- Loans to Shareholders: $${redFlags.loans_to_shareholders_amount.toLocaleString()}`);
  }
  if (redFlags.negative_retained_earnings) {
    lines.push('- Negative Retained Earnings');
  }
  if (redFlags.other_income_percent > 0.1) {
    lines.push(`- Significant Other Income (${(redFlags.other_income_percent * 100).toFixed(1)}% of revenue)`);
  }
  if (redFlags.other_deductions_percent > 0.2) {
    lines.push(`- High Other Deductions (${(redFlags.other_deductions_percent * 100).toFixed(1)}% of expenses)`);
  }
  if (redFlags.revenue_yoy_change_percent !== null && Math.abs(redFlags.revenue_yoy_change_percent) > 0.3) {
    lines.push(`- Significant YoY Revenue Change: ${(redFlags.revenue_yoy_change_percent * 100).toFixed(1)}%`);
  }

  return lines.length > 0 ? lines.join('\n') : 'None detected';
}

/**
 * Call Claude for AI validation
 */
async function callClaudeForValidation(
  prompt: string,
  useOpus: boolean
): Promise<AIValidationResult> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const model = useOpus ? OPUS_MODEL : SONNET_MODEL;
  console.log(`[AI Validator] Using model: ${model}`);

  try {
    const response = await client.messages.create({
      model,
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract text content
    const textContent = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    // Parse JSON response
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[AI Validator] Response not valid JSON:', textContent);
      return getDefaultValidationResult();
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      corrections: parsed.corrections || [],
      missing_data: parsed.missing_data || [],
      sde_summary: {
        officer_compensation: parsed.sde_summary?.officer_compensation ?? 0,
        guaranteed_payments: parsed.sde_summary?.guaranteed_payments ?? 0,
        depreciation: parsed.sde_summary?.depreciation ?? 0,
        amortization: parsed.sde_summary?.amortization ?? 0,
        interest: parsed.sde_summary?.interest ?? 0,
        section_179_deduction: parsed.sde_summary?.section_179_deduction ?? 0,
        non_recurring_gains_excluded: parsed.sde_summary?.non_recurring_gains_excluded ?? 0,
        owner_benefits: parsed.sde_summary?.owner_benefits ?? 0,
        total_suggested_addbacks: parsed.sde_summary?.total_suggested_addbacks ?? 0,
        notes: parsed.sde_summary?.notes || [],
      },
      red_flags: parsed.red_flags || [],
      overall_confidence: parsed.overall_confidence ?? 50,
      notes: parsed.notes || [],
    };
  } catch (error) {
    console.error('[AI Validator] API error:', error);
    return getDefaultValidationResult();
  }
}

/**
 * Get default validation result on error
 */
function getDefaultValidationResult(): AIValidationResult {
  return {
    corrections: [],
    missing_data: [],
    sde_summary: {
      officer_compensation: 0,
      guaranteed_payments: 0,
      depreciation: 0,
      amortization: 0,
      interest: 0,
      section_179_deduction: 0,
      non_recurring_gains_excluded: 0,
      owner_benefits: 0,
      total_suggested_addbacks: 0,
      notes: ['AI validation failed - using defaults'],
    },
    red_flags: [],
    overall_confidence: 0,
    notes: ['AI validation failed'],
  };
}

/**
 * Build yearly financial data from Stage2Output
 */
function buildYearlyFinancialData(data: StructuredFinancialData): YearlyFinancialData {
  return {
    revenue: data.income_statement?.gross_receipts ?? 0,
    returns_allowances: data.income_statement?.returns_allowances ?? 0,
    net_revenue: (data.income_statement?.gross_receipts ?? 0) - (data.income_statement?.returns_allowances ?? 0),
    cost_of_goods_sold: data.income_statement?.cost_of_goods_sold ?? 0,
    gross_profit: data.income_statement?.gross_profit ?? 0,
    other_income: data.income_statement?.other_income ?? 0,
    net_gain_form_4797: 0, // Would need to extract from Schedule K
    total_income: data.income_statement?.total_income ?? 0,
    total_operating_expenses: data.expenses?.total_deductions ?? 0,
    operating_income: (data.income_statement?.gross_profit ?? 0) - (data.expenses?.total_deductions ?? 0),
    net_income: data.income_statement?.total_income ?? 0,
    cogs_detail: data.cogs_detail ?? null,
    expenses: data.expenses ?? {
      officer_compensation: 0,
      salaries_wages: 0,
      rent: 0,
      taxes_licenses: 0,
      interest: 0,
      depreciation: 0,
      amortization: 0,
      insurance: 0,
      repairs_maintenance: 0,
      bad_debts: 0,
      advertising: 0,
      employee_benefits: 0,
      pension_plans: 0,
      legal_professional: 0,
      office_expense: 0,
      travel: 0,
      meals_entertainment: 0,
      utilities: 0,
      other_deductions: 0,
      total_deductions: 0,
    },
    balance_sheet: data.balance_sheet ?? {
      boy_cash: 0,
      boy_accounts_receivable: 0,
      boy_inventory: 0,
      boy_loans_to_shareholders: 0,
      boy_other_current_assets: 0,
      boy_total_current_assets: 0,
      boy_land: 0,
      boy_buildings: 0,
      boy_machinery_equipment: 0,
      boy_accumulated_depreciation: 0,
      boy_total_fixed_assets: 0,
      boy_other_assets: 0,
      boy_total_assets: 0,
      boy_accounts_payable: 0,
      boy_short_term_debt: 0,
      boy_other_current_liabilities: 0,
      boy_total_current_liabilities: 0,
      boy_long_term_debt: 0,
      boy_loans_from_shareholders: 0,
      boy_other_liabilities: 0,
      boy_total_liabilities: 0,
      boy_common_stock: 0,
      boy_additional_paid_in_capital: 0,
      boy_retained_earnings: 0,
      boy_total_equity: 0,
      eoy_cash: 0,
      eoy_accounts_receivable: 0,
      eoy_inventory: 0,
      eoy_loans_to_shareholders: 0,
      eoy_other_current_assets: 0,
      eoy_total_current_assets: 0,
      eoy_land: 0,
      eoy_buildings: 0,
      eoy_machinery_equipment: 0,
      eoy_accumulated_depreciation: 0,
      eoy_total_fixed_assets: 0,
      eoy_other_assets: 0,
      eoy_total_assets: 0,
      eoy_accounts_payable: 0,
      eoy_short_term_debt: 0,
      eoy_other_current_liabilities: 0,
      eoy_total_current_liabilities: 0,
      eoy_long_term_debt: 0,
      eoy_loans_from_shareholders: 0,
      eoy_other_liabilities: 0,
      eoy_total_liabilities: 0,
      eoy_common_stock: 0,
      eoy_additional_paid_in_capital: 0,
      eoy_retained_earnings: 0,
      eoy_total_equity: 0,
    },
    schedule_k: data.schedule_k ?? null,
    schedule_m1: data.schedule_m1 ?? null,
    guaranteed_payments: data.guaranteed_payments ?? null,
    covid_adjustments: data.covid_adjustments ?? null,
    red_flags: data.red_flags,
    source_document: 'extraction',
    extraction_confidence: 0, // Will be set by caller
  };
}

/**
 * Validate extracted data with AI (Stage 3)
 *
 * @param stage2Output - Stage 2 extraction output
 * @param validationResults - Validation results from validator
 * @param stage1TimeMs - Time spent in Stage 1
 * @param stage2TimeMs - Time spent in Stage 2
 * @returns FinalExtractionOutput with validated data
 */
export async function validateWithAI(
  stage2Output: Stage2Output,
  validationResults: ValidationResult[],
  stage1TimeMs: number = 0,
  stage2TimeMs: number = 0
): Promise<FinalExtractionOutput> {
  const startTime = Date.now();
  const extractionId = generateUUID();

  // Check if we should escalate to Opus
  const confidence = stage2Output.processing_metadata?.confidence_score ?? 50;
  const escalation = shouldEscalateToOpus(validationResults, confidence);
  const useOpus = escalation.escalate;

  console.log(`[AI Validator] Stage 3 starting. Escalate to Opus: ${useOpus}${escalation.reason ? ` (${escalation.reason})` : ''}`);

  // Build prompt and call AI
  const prompt = buildValidationPrompt(stage2Output, validationResults);
  const aiResult = await callClaudeForValidation(prompt, useOpus);

  const stage3TimeMs = Date.now() - startTime;

  // Build validation summary
  const errorCount = validationResults.filter((r) => r.severity === 'error').length;
  const warningCount = validationResults.filter((r) => r.severity === 'warning').length;
  const infoCount = validationResults.filter((r) => r.severity === 'info').length;

  const validationSummary: ValidationSummary = {
    status: errorCount > 0 ? 'errors' : warningCount > 0 ? 'warnings' : 'passed',
    error_count: errorCount,
    warning_count: warningCount,
    info_count: infoCount,
    issues: validationResults,
    corrections_applied: aiResult.corrections,
    red_flags_detected: [
      ...aiResult.red_flags,
      ...(stage2Output.structured_data?.red_flags.has_loans_to_shareholders ? ['Loans to shareholders detected'] : []),
      ...(stage2Output.structured_data?.red_flags.negative_retained_earnings ? ['Negative retained earnings'] : []),
    ],
  };

  // Build company info
  const companyInfo: CompanyInfo = {
    name: stage2Output.classification.entity_name || 'Unknown Entity',
    entity_type: mapDocTypeToEntityType(stage2Output.classification.document_type),
    ein: null, // Would need to extract from document
    address: {
      street: null,
      city: null,
      state: null,
      zip: null,
    },
    fiscal_year_end: '12/31', // Default, would extract if available
  };

  // Build financial data by year
  const taxYear = stage2Output.classification.tax_year || 'Unknown';
  const financialData: Record<string, YearlyFinancialData> = {};

  if (stage2Output.structured_data) {
    const yearData = buildYearlyFinancialData(stage2Output.structured_data);
    yearData.extraction_confidence = aiResult.overall_confidence;
    financialData[taxYear] = yearData;
  }

  // Build document metadata
  const documents: ExtractedDocumentMeta[] = [
    {
      document_id: generateUUID(), // Would be passed from pipeline
      filename: 'extracted_document', // Would be passed from pipeline
      document_type: stage2Output.classification.document_type,
      tax_year: taxYear,
      pages: 0, // Would be from Stage 1
    },
  ];

  // Build processing metadata
  const processing: ProcessingMetadata = {
    total_time_ms: stage1TimeMs + stage2TimeMs + stage3TimeMs,
    stage1_time_ms: stage1TimeMs,
    stage2_time_ms: stage2TimeMs,
    stage3_time_ms: stage3TimeMs,
    model_used: useOpus ? 'opus' : 'sonnet',
    escalated_to_opus: useOpus,
    escalation_reason: escalation.reason,
    retry_count: 0,
  };

  // Determine if ready for valuation
  const blockingIssues = validationResults
    .filter((r) => r.severity === 'error')
    .map((r) => r.message);

  const readyForValuation = blockingIssues.length === 0;

  return {
    extraction_id: extractionId,
    created_at: new Date().toISOString(),
    documents,
    company_info: companyInfo,
    financial_data: financialData,
    trend_analysis: null, // Single year, no trend
    validation: validationSummary,
    processing,
    ready_for_valuation: readyForValuation,
    blocking_issues: blockingIssues,
    suggested_sde_addbacks: aiResult.sde_summary,
  };
}

/**
 * Map document type to entity type
 */
function mapDocTypeToEntityType(docType: string): CompanyInfo['entity_type'] {
  switch (docType) {
    case 'FORM_1120':
      return 'C_CORP';
    case 'FORM_1120S':
      return 'S_CORP';
    case 'FORM_1065':
      return 'PARTNERSHIP';
    case 'SCHEDULE_C':
      return 'SOLE_PROP';
    default:
      return 'LLC'; // Default to LLC for unknown entity types
  }
}

/**
 * Calculate SDE add-backs from extracted data (no AI call)
 * Useful for quick estimates without AI validation
 */
export function calculateSdeAddbacksFromData(
  data: StructuredFinancialData
): SuggestedSDEAddbacks {
  const notes: string[] = [];

  // Officer compensation / guaranteed payments
  const officerComp = data.expenses?.officer_compensation ?? 0;
  const guaranteedPayments = data.guaranteed_payments?.total ?? 0;

  if (officerComp > 0) {
    notes.push(`Officer compensation: $${officerComp.toLocaleString()}`);
  }
  if (guaranteedPayments > 0) {
    notes.push(`Guaranteed payments: $${guaranteedPayments.toLocaleString()}`);
  }

  // Depreciation and amortization
  const depreciation = data.expenses?.depreciation ?? 0;
  const amortization = data.expenses?.amortization ?? 0;
  const section179 = data.schedule_k?.section_179_deduction ?? 0;

  if (section179 > 0) {
    notes.push(`Section 179 (accelerated depreciation): $${section179.toLocaleString()}`);
  }

  // Interest
  const interest = data.expenses?.interest ?? 0;

  // Non-recurring capital gains (to exclude, not add back)
  const capitalGains =
    (data.schedule_k?.net_short_term_capital_gain ?? 0) +
    (data.schedule_k?.net_long_term_capital_gain ?? 0) +
    (data.schedule_k?.net_section_1231_gain ?? 0);

  if (capitalGains !== 0) {
    notes.push(`Capital gains excluded: $${capitalGains.toLocaleString()}`);
  }

  // Owner benefits (estimated)
  const ownerBenefits = 0; // Would need more granular expense data

  const total =
    officerComp +
    guaranteedPayments +
    depreciation +
    amortization +
    interest +
    section179 +
    ownerBenefits;

  return {
    officer_compensation: officerComp,
    guaranteed_payments: guaranteedPayments,
    depreciation,
    amortization,
    interest,
    section_179_deduction: section179,
    non_recurring_gains_excluded: capitalGains,
    owner_benefits: ownerBenefits,
    total_suggested_addbacks: total,
    notes,
  };
}
