/**
 * Modal Extraction Client
 *
 * Client for calling the Modal/pdfplumber extraction endpoint.
 * Converts the Modal response to FinalExtractionOutput format.
 */

import {
  FinalExtractionOutput,
  ModalExtractionResponse,
  YearFinancialData,
  CompanyInfo,
  IncomeStatement,
  Expenses,
  BalanceSheet,
  ScheduleK,
  OwnerInfo,
  CovidAdjustments,
  RedFlags,
  EntityType,
  DocumentType,
} from './types';
import {
  ExtractionErrorCode,
  createExtractionError,
  ExtractionException,
} from './errors';
import { detectScannedPdf, ScannedPdfDetectionResult } from './scanned-pdf-detector';

/**
 * Get the Modal extraction endpoint URL from environment.
 */
function getModalUrl(): string {
  const url = process.env.MODAL_EXTRACTION_URL;
  if (!url) {
    throw new ExtractionException(ExtractionErrorCode.MODAL_CONNECTION_FAILED, {
      reason: 'MODAL_EXTRACTION_URL environment variable not set',
    });
  }
  return url;
}

/**
 * Options for Modal extraction.
 */
export interface ModalExtractionOptions {
  /** Document ID for tracking */
  documentId: string;
  /** Original filename */
  filename: string;
  /** Timeout in milliseconds (default: 60000) */
  timeout?: number;
}

/**
 * Result of Modal extraction.
 */
export interface ModalExtractionResult {
  success: boolean;
  extraction?: FinalExtractionOutput;
  scannedPdfResult?: ScannedPdfDetectionResult;
  error?: {
    code: ExtractionErrorCode;
    message: string;
  };
}

/**
 * Call Modal extraction endpoint with a PDF buffer.
 *
 * @param pdfBuffer - The PDF file as a Buffer
 * @param options - Extraction options
 * @returns Extraction result with FinalExtractionOutput or error
 */
export async function extractWithModal(
  pdfBuffer: Buffer,
  options: ModalExtractionOptions
): Promise<ModalExtractionResult> {
  const { documentId, filename, timeout = 60000 } = options;

  console.log(`[MODAL-CLIENT] Starting extraction for document ${documentId} (${filename})`);

  try {
    const modalUrl = getModalUrl();
    const pdfBase64 = pdfBuffer.toString('base64');

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${modalUrl}/extract_pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdf_base64: pdfBase64,
          document_id: documentId,
          filename: filename,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[MODAL-CLIENT] HTTP error ${response.status}: ${errorText}`);

        return {
          success: false,
          error: {
            code: ExtractionErrorCode.MODAL_CONNECTION_FAILED,
            message: `Modal returned HTTP ${response.status}: ${errorText}`,
          },
        };
      }

      const modalResponse: ModalExtractionResponse = await response.json();

      if (!modalResponse.success || !modalResponse.data) {
        const errorCode = modalResponse.error?.code || 'UNKNOWN';
        const errorMessage = modalResponse.error?.message || 'Unknown error';

        console.error(`[MODAL-CLIENT] Extraction failed: ${errorCode} - ${errorMessage}`);

        // Map Modal error codes to our error codes
        let code = ExtractionErrorCode.UNKNOWN_ERROR;
        if (errorCode === 'ENCRYPTED_PDF') {
          code = ExtractionErrorCode.PDF_ENCRYPTED;
        } else if (errorCode === 'CORRUPTED_PDF') {
          code = ExtractionErrorCode.PDF_CORRUPTED;
        }

        return {
          success: false,
          error: { code, message: errorMessage },
        };
      }

      // Check if document is scanned
      const pageTexts = Object.values(modalResponse.data.text_by_region).map(
        region => region.full_text
      );
      const scannedResult = detectScannedPdf(pageTexts, {
        is_scanned: modalResponse.data.metadata.is_scanned,
        ocr_confidence: modalResponse.data.metadata.ocr_confidence ?? undefined,
        page_count: modalResponse.data.metadata.page_count,
        extraction_method: modalResponse.data.metadata.extraction_method,
      });

      if (scannedResult.recommendation === 'require_premium') {
        console.log(`[MODAL-CLIENT] Document ${documentId} is scanned, requires premium extraction`);
        return {
          success: false,
          scannedPdfResult: scannedResult,
          error: {
            code: ExtractionErrorCode.PDF_SCANNED,
            message: scannedResult.explanation,
          },
        };
      }

      // Convert Modal response to FinalExtractionOutput
      const extraction = convertModalToFinalOutput(modalResponse, documentId, filename);

      console.log(`[MODAL-CLIENT] Successfully extracted document ${documentId}`);

      return {
        success: true,
        extraction,
        scannedPdfResult: scannedResult,
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error(`[MODAL-CLIENT] Request timed out after ${timeout}ms`);
        return {
          success: false,
          error: {
            code: ExtractionErrorCode.MODAL_TIMEOUT,
            message: `Extraction timed out after ${timeout}ms`,
          },
        };
      }

      throw fetchError;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[MODAL-CLIENT] Extraction error: ${message}`);

    return {
      success: false,
      error: {
        code: ExtractionErrorCode.MODAL_CONNECTION_FAILED,
        message,
      },
    };
  }
}

/**
 * Convert Modal response to FinalExtractionOutput format.
 *
 * This function parses the raw text and tables from Modal to create
 * a structured extraction output.
 */
function convertModalToFinalOutput(
  response: ModalExtractionResponse,
  documentId: string,
  filename: string
): FinalExtractionOutput {
  const data = response.data!;

  // Parse financial data from tables and text
  const parsedData = parseFinancialData(data.tables, data.raw_text);

  // Determine entity type from document
  const entityType = detectEntityType(data.raw_text, filename);
  const documentType = detectDocumentType(data.raw_text, filename);

  // Extract company info from text
  const companyInfo = extractCompanyInfo(data.raw_text, entityType);

  // Get the tax year(s) from parsed data
  const years = Object.keys(parsedData.yearlyData).map(Number).sort((a, b) => b - a);

  // Build financial data records
  const financialData: Record<number, YearFinancialData> = {};
  for (const year of years) {
    const yearData = parsedData.yearlyData[year];
    financialData[year] = {
      tax_year: year,
      document_type: documentType,
      income_statement: yearData.incomeStatement,
      expenses: yearData.expenses,
      balance_sheet: yearData.balanceSheet,
      schedule_k: yearData.scheduleK,
      owner_info: yearData.ownerInfo,
      covid_adjustments: yearData.covidAdjustments,
    };
  }

  // Detect red flags
  const redFlags = detectRedFlags(financialData, companyInfo);

  return {
    extraction_id: `modal-${documentId}-${Date.now()}`,
    extraction_timestamp: data.extraction_timestamp,
    source: 'modal',
    company_info: companyInfo,
    financial_data: financialData,
    available_years: years,
    red_flags: redFlags,
    raw_data: {
      modal_response: response,
      document_count: 1,
      extraction_notes: [],
    },
  };
}

/**
 * Parse financial data from Modal tables and text.
 */
function parseFinancialData(
  tables: import('./types').ModalExtractedTable[],
  rawText: string
): {
  yearlyData: Record<number, {
    incomeStatement: IncomeStatement;
    expenses: Expenses;
    balanceSheet: BalanceSheet;
    scheduleK: ScheduleK;
    ownerInfo: OwnerInfo;
    covidAdjustments: CovidAdjustments;
  }>;
} {
  // Extract year from document
  const yearMatch = rawText.match(/tax\s*year\s*(\d{4})|(\d{4})\s*(?:form|return)/i);
  const year = yearMatch ? parseInt(yearMatch[1] || yearMatch[2], 10) : new Date().getFullYear() - 1;

  // Parse numbers from text using regex patterns
  const parseAmount = (patterns: RegExp[]): number => {
    for (const pattern of patterns) {
      const match = rawText.match(pattern);
      if (match) {
        const numStr = match[1].replace(/[$,\s]/g, '').replace(/[()]/g, '-');
        const num = parseFloat(numStr);
        if (!isNaN(num)) return Math.round(num);
      }
    }
    return 0;
  };

  // Income Statement patterns
  const grossReceipts = parseAmount([
    /gross\s*receipts.*?[\$]?\s*([\d,]+)/i,
    /total\s*(?:sales|revenue).*?[\$]?\s*([\d,]+)/i,
    /line\s*1[a-c]?.*?[\$]?\s*([\d,]+)/i,
  ]);

  const cogs = parseAmount([
    /cost\s*of\s*goods\s*sold.*?[\$]?\s*([\d,]+)/i,
    /line\s*2.*?[\$]?\s*([\d,]+)/i,
  ]);

  const netIncome = parseAmount([
    /(?:net|taxable)\s*income.*?[\$]?\s*([\d,]+)/i,
    /ordinary\s*(?:business\s*)?income.*?[\$]?\s*([\d,]+)/i,
    /line\s*(?:21|22|30|31).*?[\$]?\s*([\d,]+)/i,
  ]);

  // Expense patterns
  const officerComp = parseAmount([
    /(?:officer|executive)\s*compensation.*?[\$]?\s*([\d,]+)/i,
    /compensation\s*of\s*officers.*?[\$]?\s*([\d,]+)/i,
    /line\s*7.*?[\$]?\s*([\d,]+)/i,
  ]);

  const salaries = parseAmount([
    /salaries\s*(?:and\s*)?wages.*?[\$]?\s*([\d,]+)/i,
    /line\s*8.*?[\$]?\s*([\d,]+)/i,
  ]);

  const rent = parseAmount([
    /rents?.*?[\$]?\s*([\d,]+)/i,
    /line\s*13.*?[\$]?\s*([\d,]+)/i,
  ]);

  const interest = parseAmount([
    /interest\s*(?:expense)?.*?[\$]?\s*([\d,]+)/i,
    /line\s*13.*?[\$]?\s*([\d,]+)/i,
  ]);

  const depreciation = parseAmount([
    /depreciation.*?[\$]?\s*([\d,]+)/i,
    /line\s*14.*?[\$]?\s*([\d,]+)/i,
  ]);

  // Balance sheet patterns
  const totalAssets = parseAmount([
    /total\s*assets.*?[\$]?\s*([\d,]+)/i,
    /line\s*15.*?[\$]?\s*([\d,]+)/i,
  ]);

  const totalLiabilities = parseAmount([
    /total\s*liabilities.*?[\$]?\s*([\d,]+)/i,
    /line\s*22.*?[\$]?\s*([\d,]+)/i,
  ]);

  const cash = parseAmount([
    /cash.*?[\$]?\s*([\d,]+)/i,
    /line\s*1.*?[\$]?\s*([\d,]+)/i,
  ]);

  // Schedule K patterns
  const section179 = parseAmount([
    /section\s*179.*?[\$]?\s*([\d,]+)/i,
    /179\s*deduction.*?[\$]?\s*([\d,]+)/i,
  ]);

  const distributions = parseAmount([
    /distributions.*?[\$]?\s*([\d,]+)/i,
    /line\s*16d.*?[\$]?\s*([\d,]+)/i,
  ]);

  // Owner info
  const guaranteedPayments = parseAmount([
    /guaranteed\s*payments.*?[\$]?\s*([\d,]+)/i,
  ]);

  const loansToShareholders = parseAmount([
    /loans?\s*(?:to|from)\s*shareholders.*?[\$]?\s*([\d,]+)/i,
  ]);

  const grossProfit = grossReceipts - cogs;
  const totalDeductions = officerComp + salaries + rent + interest + depreciation;

  return {
    yearlyData: {
      [year]: {
        incomeStatement: {
          gross_receipts_sales: grossReceipts,
          returns_allowances: 0,
          cost_of_goods_sold: cogs,
          gross_profit: grossProfit,
          total_income: grossProfit,
          total_deductions: totalDeductions,
          taxable_income: netIncome,
          net_income: netIncome,
        },
        expenses: {
          compensation_of_officers: officerComp,
          salaries_wages: salaries,
          repairs_maintenance: 0,
          bad_debts: 0,
          rents: rent,
          taxes_licenses: 0,
          interest: interest,
          depreciation: depreciation,
          depletion: 0,
          advertising: 0,
          pension_profit_sharing: 0,
          employee_benefits: 0,
          other_deductions: 0,
        },
        balanceSheet: {
          total_assets: totalAssets,
          cash: cash,
          accounts_receivable: 0,
          inventory: 0,
          fixed_assets: 0,
          accumulated_depreciation: 0,
          other_assets: 0,
          total_liabilities: totalLiabilities,
          accounts_payable: 0,
          loans_payable: 0,
          other_liabilities: 0,
          retained_earnings: 0,
          total_equity: totalAssets - totalLiabilities,
          boy_cash: 0,
          boy_accounts_receivable: 0,
          boy_inventory: 0,
          boy_total_assets: 0,
          boy_total_liabilities: 0,
          eoy_cash: cash,
          eoy_accounts_receivable: 0,
          eoy_inventory: 0,
          eoy_total_assets: totalAssets,
          eoy_total_liabilities: totalLiabilities,
          eoy_retained_earnings: 0,
        },
        scheduleK: {
          section_179_deduction: section179,
          charitable_contributions: 0,
          investment_interest: 0,
          net_section_1231_gain: 0,
          other_net_gain_loss: 0,
          total_foreign_taxes: 0,
          total_distributions: distributions,
          capital_gains: 0,
          capital_gains_short: 0,
          capital_gains_long: 0,
          distributions_cash: distributions,
          distributions_property: 0,
        },
        ownerInfo: {
          owner_compensation: officerComp,
          guaranteed_payments: guaranteedPayments,
          distributions: distributions,
          loans_to_shareholders: loansToShareholders,
          loans_from_shareholders: 0,
        },
        covidAdjustments: {
          ppp_loan: 0,
          ppp_forgiveness: 0,
          ppp_loan_balance: 0,
          eidl_loan_balance: 0,
          eidl_grant: 0,
          erc_credit: 0,
        },
      },
    },
  };
}

/**
 * Detect entity type from document text.
 */
function detectEntityType(text: string, filename: string): EntityType {
  const lowerText = text.toLowerCase();
  const lowerFilename = filename.toLowerCase();

  if (lowerText.includes('1120-s') || lowerFilename.includes('1120-s') || lowerFilename.includes('1120s')) {
    return 'S-Corporation';
  }
  if (lowerText.includes('1120') || lowerFilename.includes('1120')) {
    return 'C-Corporation';
  }
  if (lowerText.includes('1065') || lowerFilename.includes('1065')) {
    return 'Partnership';
  }
  if (lowerText.includes('schedule c') || lowerFilename.includes('schedule-c') || lowerFilename.includes('schedulec')) {
    return 'Sole Proprietorship';
  }

  return 'Other';
}

/**
 * Detect document type from text.
 */
function detectDocumentType(text: string, filename: string): DocumentType {
  const lowerText = text.toLowerCase();
  const lowerFilename = filename.toLowerCase();

  if (lowerText.includes('1120-s') || lowerFilename.includes('1120-s')) {
    return 'Form 1120-S';
  }
  if (lowerText.includes('1120') || lowerFilename.includes('1120')) {
    return 'Form 1120';
  }
  if (lowerText.includes('1065') || lowerFilename.includes('1065')) {
    return 'Form 1065';
  }
  if (lowerText.includes('schedule c') || lowerFilename.includes('schedule-c')) {
    return 'Schedule C';
  }

  return 'Other';
}

/**
 * Extract company info from document text.
 */
function extractCompanyInfo(text: string, entityType: EntityType): CompanyInfo {
  // Try to extract business name
  const nameMatch = text.match(/(?:business\s*name|name\s*of\s*(?:corporation|partnership|business))[\s:]+([^\n]+)/i);
  const businessName = nameMatch ? nameMatch[1].trim() : 'Unknown Business';

  // Try to extract EIN
  const einMatch = text.match(/(?:ein|employer\s*identification)[\s:]+(\d{2}-?\d{7})/i);
  const ein = einMatch ? einMatch[1] : null;

  // Try to extract NAICS
  const naicsMatch = text.match(/(?:naics|business\s*code)[\s:]+(\d{6})/i);
  const naicsCode = naicsMatch ? naicsMatch[1] : null;

  return {
    business_name: businessName,
    ein,
    address: null,
    entity_type: entityType,
    fiscal_year_end: '12/31',
    naics_code: naicsCode,
    business_activity: null,
    number_of_employees: null,
    accounting_method: 'Accrual',
  };
}

/**
 * Detect red flags from financial data.
 */
function detectRedFlags(
  financialData: Record<number, YearFinancialData>,
  companyInfo: CompanyInfo
): RedFlags {
  const years = Object.keys(financialData).map(Number).sort((a, b) => b - a);
  const notes: string[] = [];

  let loansToShareholders = false;
  let decliningRevenue = false;
  let negativeEquity = false;
  let highOwnerCompensation = false;

  for (const year of years) {
    const data = financialData[year];

    if (data.owner_info.loans_to_shareholders > 0) {
      loansToShareholders = true;
      notes.push(`Loans to shareholders detected in ${year}`);
    }

    if (data.balance_sheet.total_equity < 0) {
      negativeEquity = true;
      notes.push(`Negative equity in ${year}`);
    }

    const revenue = data.income_statement.gross_receipts_sales;
    const ownerComp = data.expenses.compensation_of_officers;
    if (revenue > 0 && ownerComp / revenue > 0.5) {
      highOwnerCompensation = true;
      notes.push(`Owner compensation exceeds 50% of revenue in ${year}`);
    }
  }

  // Check for declining revenue
  if (years.length >= 2) {
    const currentRevenue = financialData[years[0]].income_statement.gross_receipts_sales;
    const priorRevenue = financialData[years[1]].income_statement.gross_receipts_sales;
    if (priorRevenue > 0 && currentRevenue < priorRevenue * 0.9) {
      decliningRevenue = true;
      notes.push('Revenue declined more than 10% year over year');
    }
  }

  // Get retained earnings for the latest year
  const latestYear = Math.max(...Object.keys(financialData).map(Number));
  const latestData = financialData[latestYear];
  const retainedEarnings = latestData?.balance_sheet?.retained_earnings ?? 0;
  const loansToShareholdersAmount = latestData?.owner_info?.loans_to_shareholders ?? 0;

  return {
    loans_to_shareholders: loansToShareholders,
    loans_to_shareholders_amount: loansToShareholdersAmount,
    declining_revenue: decliningRevenue,
    negative_equity: negativeEquity,
    negative_retained_earnings: retainedEarnings < 0,
    retained_earnings_value: retainedEarnings,
    high_owner_compensation: highOwnerCompensation,
    related_party_transactions: false,
    unusual_expenses: false,
    missing_schedules: false,
    notes,
  };
}
