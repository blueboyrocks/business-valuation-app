/**
 * Document Extraction Logic - Phase 1 of Valuation Pipeline
 *
 * This module contains the core extraction logic that can be called
 * from both the API route and directly from the orchestrator.
 *
 * Supports document types:
 * - Federal tax forms (1120, 1120-S, 1065, Schedule C)
 * - Balance sheets (standalone or Schedule L)
 * - Virginia Form 500 (state tax returns)
 * - Income statements
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { extractWithModal, ModalExtractionResult } from './extraction/modal-client';
import { DocumentType, DocumentTypeInternal, FinalExtractionOutput } from './extraction/types';

// Lazy-initialize clients to avoid build-time errors
let supabase: SupabaseClient | null = null;
let anthropic: Anthropic | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return supabase;
}

function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
  }
  return anthropic;
}

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

// Lightweight extraction prompt - focused only on data extraction
const EXTRACTION_SYSTEM_PROMPT = `You are a financial document extraction specialist. Your ONLY task is to extract structured financial data from tax returns and financial documents.

Extract the following information and return it as valid JSON:

{
  "document_type": "Form 1120" | "Form 1120-S" | "Form 1065" | "Schedule C" | "Financial Statement" | "Other",
  "tax_year": number,
  "entity_info": {
    "business_name": string,
    "ein": string | null,
    "address": string | null,
    "entity_type": "C-Corporation" | "S-Corporation" | "Partnership" | "Sole Proprietorship" | "LLC" | "Other",
    "fiscal_year_end": string | null
  },
  "income_statement": {
    "gross_receipts_sales": number,
    "returns_allowances": number,
    "cost_of_goods_sold": number,
    "gross_profit": number,
    "total_income": number,
    "total_deductions": number,
    "taxable_income": number,
    "net_income": number
  },
  "expenses": {
    "compensation_of_officers": number,
    "salaries_wages": number,
    "repairs_maintenance": number,
    "bad_debts": number,
    "rents": number,
    "taxes_licenses": number,
    "interest": number,
    "depreciation": number,
    "depletion": number,
    "advertising": number,
    "pension_profit_sharing": number,
    "employee_benefits": number,
    "other_deductions": number
  },
  "balance_sheet": {
    "total_assets": number,
    "cash": number,
    "accounts_receivable": number,
    "inventory": number,
    "fixed_assets": number,
    "accumulated_depreciation": number,
    "other_assets": number,
    "total_liabilities": number,
    "accounts_payable": number,
    "loans_payable": number,
    "other_liabilities": number,
    "retained_earnings": number,
    "total_equity": number
  },
  "owner_info": {
    "owner_compensation": number,
    "distributions": number,
    "loans_to_shareholders": number,
    "loans_from_shareholders": number
  },
  "additional_data": {
    "number_of_employees": number | null,
    "accounting_method": "Cash" | "Accrual" | "Other" | null,
    "business_activity": string | null,
    "naics_code": string | null
  },
  "extraction_notes": string[]
}

IMPORTANT RULES:
1. Return ONLY valid JSON - no markdown, no explanations, no text before or after
2. Use 0 for any amounts not found in the document
3. Use null for non-numeric fields that are not found
4. Add any important observations to extraction_notes array
5. If multiple years are present, extract data for the MOST RECENT year only
6. All monetary values should be whole numbers (no cents)`;

const EXTRACTION_USER_PROMPT = `Extract all financial data from this tax return document. Return ONLY the JSON object with no additional text.`;

interface DocumentRecord {
  id: string;
  file_path: string;
  file_name?: string;
  mime_type?: string;
}

interface ExtractionResult {
  documentId: string;
  file_name: string;
  success: boolean;
  error?: string;
  extractedData?: Record<string, unknown>;
}

// Result type for the exported function
export interface ExtractDocumentsResult {
  success: boolean;
  status?: string;
  message?: string;
  error?: string;
  summary?: {
    total: number;
    success: number;
    failed: number;
    partial: number;
  };
  results?: Array<{
    documentId: string;
    file_name: string;
    success: boolean;
    error?: string;
    document_type?: DocumentType;
    extraction_status?: 'complete' | 'partial' | 'failed';
  }>;
  /** Combined extraction output from all documents */
  extraction?: FinalExtractionOutput;
}

/**
 * Map internal document type codes to display names.
 */
const DOCUMENT_TYPE_DISPLAY: Record<DocumentTypeInternal, DocumentType> = {
  form_1120: 'Form 1120',
  form_1120s: 'Form 1120-S',
  form_1065: 'Form 1065',
  schedule_c: 'Schedule C',
  balance_sheet: 'Balance Sheet',
  va_form_500: 'Virginia Form 500',
  income_statement: 'Income Statement',
  other: 'Other',
};

/**
 * Handle balance sheet specific extraction logic.
 * Balance sheets have special priority for asset values.
 */
function handleBalanceSheetExtraction(
  modalResult: ModalExtractionResult,
  documentId: string,
  fileName: string
): ExtractionResult {
  if (!modalResult.success || !modalResult.extraction) {
    return {
      documentId,
      file_name: fileName,
      success: false,
      error: modalResult.error?.message || 'Balance sheet extraction failed',
    };
  }

  const extraction = modalResult.extraction;
  const notes: string[] = [];

  // Check for COVID loan balances
  const years = extraction.available_years;
  for (const year of years) {
    const yearData = extraction.financial_data[year];
    if (yearData?.covid_adjustments) {
      const covid = yearData.covid_adjustments;
      if (covid.eidl_loan_balance > 0) {
        notes.push(`EIDL loan balance detected: $${covid.eidl_loan_balance.toLocaleString()}`);
      }
      if (covid.ppp_loan_balance > 0) {
        notes.push(`PPP loan balance detected: $${covid.ppp_loan_balance.toLocaleString()}`);
      }
    }
  }

  // Check for shareholder loans (red flag)
  if (extraction.red_flags?.loans_to_shareholders) {
    notes.push(`Loans to shareholders: $${extraction.red_flags.loans_to_shareholders_amount.toLocaleString()}`);
  }

  // Check for negative retained earnings (red flag)
  if (extraction.red_flags?.negative_retained_earnings) {
    notes.push(`Negative retained earnings: $${extraction.red_flags.retained_earnings_value.toLocaleString()}`);
  }

  console.log(`[EXTRACT] Balance sheet extracted with ${notes.length} notes: ${notes.join(', ')}`);

  return {
    documentId,
    file_name: fileName,
    success: true,
    extractedData: {
      ...extraction,
      document_type: 'Balance Sheet',
      extraction_notes: notes,
    },
  };
}

/**
 * Handle Virginia Form 500 state tax extraction.
 * State returns provide Virginia-specific adjustments.
 */
function handleStateTaxExtraction(
  modalResult: ModalExtractionResult,
  documentId: string,
  fileName: string
): ExtractionResult {
  if (!modalResult.success || !modalResult.extraction) {
    return {
      documentId,
      file_name: fileName,
      success: false,
      error: modalResult.error?.message || 'State tax extraction failed',
    };
  }

  const extraction = modalResult.extraction;
  const notes: string[] = [];

  // Note Virginia-specific data
  notes.push('Virginia Form 500 processed');
  notes.push('State adjustments available for reconciliation');

  console.log(`[EXTRACT] Virginia Form 500 extracted: ${notes.join(', ')}`);

  return {
    documentId,
    file_name: fileName,
    success: true,
    extractedData: {
      ...extraction,
      document_type: 'Virginia Form 500',
      jurisdiction: 'VA',
      extraction_notes: notes,
    },
  };
}

/**
 * Handle standard federal tax form extraction.
 */
function handleFederalTaxExtraction(
  modalResult: ModalExtractionResult,
  documentId: string,
  fileName: string,
  documentType: DocumentType
): ExtractionResult {
  if (!modalResult.success || !modalResult.extraction) {
    return {
      documentId,
      file_name: fileName,
      success: false,
      error: modalResult.error?.message || 'Federal tax extraction failed',
    };
  }

  const extraction = modalResult.extraction;
  const notes: string[] = [];

  // Check for COVID adjustments in federal forms
  const years = extraction.available_years;
  for (const year of years) {
    const yearData = extraction.financial_data[year];
    if (yearData?.covid_adjustments) {
      const covid = yearData.covid_adjustments;
      if (covid.ppp_forgiveness > 0) {
        notes.push(`PPP forgiveness in ${year}: $${covid.ppp_forgiveness.toLocaleString()}`);
      }
      if (covid.erc_credit > 0) {
        notes.push(`Employee Retention Credit in ${year}: $${covid.erc_credit.toLocaleString()}`);
      }
      if (covid.eidl_grant > 0) {
        notes.push(`EIDL grant in ${year}: $${covid.eidl_grant.toLocaleString()}`);
      }
    }
  }

  console.log(`[EXTRACT] Federal form ${documentType} extracted with ${notes.length} COVID notes`);

  return {
    documentId,
    file_name: fileName,
    success: true,
    extractedData: {
      ...extraction,
      document_type: documentType,
      extraction_notes: notes,
    },
  };
}

/**
 * Determine document type from filename or extracted content.
 */
function inferDocumentType(fileName: string, extractedData?: FinalExtractionOutput): DocumentTypeInternal {
  const lowerName = fileName.toLowerCase();

  // Check filename patterns first
  if (lowerName.includes('balance') || lowerName.includes('bs') || lowerName.includes('statement of financial')) {
    return 'balance_sheet';
  }
  if (lowerName.includes('virginia') || lowerName.includes('va-500') || lowerName.includes('form500')) {
    return 'va_form_500';
  }
  if (lowerName.includes('1120-s') || lowerName.includes('1120s')) {
    return 'form_1120s';
  }
  if (lowerName.includes('1120')) {
    return 'form_1120';
  }
  if (lowerName.includes('1065')) {
    return 'form_1065';
  }
  if (lowerName.includes('schedule-c') || lowerName.includes('schedulec')) {
    return 'schedule_c';
  }
  if (lowerName.includes('income') && lowerName.includes('statement')) {
    return 'income_statement';
  }

  // Fallback to extracted data if available
  if (extractedData?.company_info?.entity_type) {
    switch (extractedData.company_info.entity_type) {
      case 'S-Corporation':
        return 'form_1120s';
      case 'C-Corporation':
        return 'form_1120';
      case 'Partnership':
        return 'form_1065';
      case 'Sole Proprietorship':
        return 'schedule_c';
    }
  }

  return 'other';
}

/**
 * Route extraction to appropriate handler based on document type.
 */
function routeExtraction(
  modalResult: ModalExtractionResult,
  documentId: string,
  fileName: string
): ExtractionResult {
  // Determine document type
  const docTypeInternal = inferDocumentType(fileName, modalResult.extraction);
  const docTypeDisplay = DOCUMENT_TYPE_DISPLAY[docTypeInternal];

  console.log(`[EXTRACT] Routing document ${documentId} as ${docTypeDisplay} (${docTypeInternal})`);

  switch (docTypeInternal) {
    case 'balance_sheet':
      return handleBalanceSheetExtraction(modalResult, documentId, fileName);

    case 'va_form_500':
      return handleStateTaxExtraction(modalResult, documentId, fileName);

    case 'form_1120':
    case 'form_1120s':
    case 'form_1065':
    case 'schedule_c':
      return handleFederalTaxExtraction(modalResult, documentId, fileName, docTypeDisplay);

    case 'income_statement':
      return handleFederalTaxExtraction(modalResult, documentId, fileName, 'Income Statement');

    default:
      // Fallback for unknown document types
      if (!modalResult.success || !modalResult.extraction) {
        return {
          documentId,
          file_name: fileName,
          success: false,
          error: modalResult.error?.message || 'Extraction failed',
        };
      }
      return {
        documentId,
        file_name: fileName,
        success: true,
        extractedData: {
          ...modalResult.extraction,
          document_type: 'Other',
        },
      };
  }
}

/**
 * Core extraction logic - can be called directly or from HTTP handler
 */
export async function extractDocuments(reportId: string): Promise<ExtractDocumentsResult> {
  console.log(`[EXTRACT] Starting document extraction for report ${reportId}`);

  try {
    // ========================================================================
    // 1. Validate report exists
    // ========================================================================
    const { data: report, error: reportError } = await getSupabaseClient()
      .from('reports')
      .select('id, report_status, user_id')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      console.error('[EXTRACT] Report not found:', reportError);
      return { success: false, error: 'Report not found' };
    }

    // ========================================================================
    // 2. Fetch all documents for this report
    // ========================================================================
    const { data: documents, error: docsError } = await getSupabaseClient()
      .from('documents')
      .select('id, file_path, file_name, mime_type')
      .eq('report_id', reportId);

    if (docsError) {
      console.error('[EXTRACT] Error fetching documents:', docsError);
      return { success: false, error: 'Failed to fetch documents' };
    }

    if (!documents || documents.length === 0) {
      return { success: false, error: 'No documents found for this report' };
    }

    console.log(`[EXTRACT] Found ${documents.length} document(s) to process`);

    // ========================================================================
    // 3. Update report status
    // ========================================================================
    await getSupabaseClient()
      .from('reports')
      .update({
        report_status: 'extracting',
        processing_progress: 5,
        processing_message: `Starting extraction of ${documents.length} document(s)...`,
        error_message: null,
      })
      .eq('id', reportId);

    // ========================================================================
    // 4. Process each document sequentially
    // ========================================================================
    const results: ExtractionResult[] = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i] as DocumentRecord;
      const docNumber = i + 1;
      const progressPercent = Math.round(5 + (90 * docNumber / documents.length));

      console.log(`[EXTRACT] Processing document ${docNumber}/${documents.length}: ${doc.file_name || doc.file_path}`);

      // Update progress
      await getSupabaseClient()
        .from('reports')
        .update({
          processing_progress: progressPercent - 10,
          processing_message: `Extracting document ${docNumber} of ${documents.length}...`,
        })
        .eq('id', reportId);

      // Check if extraction already exists
      const { data: existingExtraction } = await getSupabaseClient()
        .from('document_extractions')
        .select('id, extraction_status')
        .eq('document_id', doc.id)
        .eq('report_id', reportId)
        .single();

      if (existingExtraction?.extraction_status === 'completed') {
        console.log(`[EXTRACT] Document ${doc.id} already extracted, skipping`);
        results.push({
          documentId: doc.id,
          file_name: doc.file_name || doc.file_path,
          success: true,
        });
        successCount++;
        continue;
      }

      // Create or update extraction record as processing
      const extractionId = existingExtraction?.id;
      if (extractionId) {
        await getSupabaseClient()
          .from('document_extractions')
          .update({
            extraction_status: 'processing',
            error_message: null,
          })
          .eq('id', extractionId);
      } else {
        await getSupabaseClient()
          .from('document_extractions')
          .insert({
            document_id: doc.id,
            report_id: reportId,
            extraction_status: 'processing',
          });
      }

      // Extract data with retry logic using Modal extraction
      const result = await extractDocumentWithRetry(doc, reportId);
      results.push(result);

      if (result.success) {
        successCount++;

        // Get document type from extracted data for metadata
        const extractedData = result.extractedData as Record<string, unknown> | undefined;
        const documentType = (extractedData?.document_type as string) || 'other';
        const isPartial = !!result.error;
        const extractionStatus = isPartial ? 'partial' : 'completed';

        // Update extraction record with data and document type metadata
        await getSupabaseClient()
          .from('document_extractions')
          .update({
            extracted_data: result.extractedData,
            extraction_status: extractionStatus,
            error_message: isPartial ? result.error : null,
            // Store document type in metadata for filtering/display
            metadata: {
              document_type: documentType,
              extraction_source: 'modal',
              extracted_at: new Date().toISOString(),
            },
          })
          .eq('document_id', doc.id)
          .eq('report_id', reportId);

        console.log(`[EXTRACT] Stored ${documentType} extraction for doc ${doc.id} (${extractionStatus})`);
      } else {
        failCount++;
        // Update extraction record with error
        await getSupabaseClient()
          .from('document_extractions')
          .update({
            extraction_status: 'failed',
            error_message: result.error,
            metadata: {
              extraction_source: 'modal',
              failed_at: new Date().toISOString(),
            },
          })
          .eq('document_id', doc.id)
          .eq('report_id', reportId);
      }

      // Update progress
      await getSupabaseClient()
        .from('reports')
        .update({
          processing_progress: progressPercent,
          processing_message: `Extracted ${docNumber} of ${documents.length} documents`,
        })
        .eq('id', reportId);

      // Small delay between documents to avoid rate limits
      if (i < documents.length - 1) {
        await sleep(1000);
      }
    }

    // ========================================================================
    // 5. Count partial extractions and determine final status
    // ========================================================================
    const partialCount = results.filter(r => r.success && r.error).length;
    const allSuccess = failCount === 0 && partialCount === 0;
    const hasPartial = partialCount > 0 || (successCount > 0 && failCount > 0);

    let finalStatus: string;
    let finalMessage: string;

    if (allSuccess) {
      finalStatus = 'extraction_complete';
      finalMessage = `Successfully extracted ${successCount} document(s)`;
    } else if (successCount === 0) {
      finalStatus = 'extraction_failed';
      finalMessage = `All ${failCount} document(s) failed extraction`;
    } else {
      finalStatus = 'extraction_partial';
      const parts = [];
      if (successCount > 0) parts.push(`${successCount} complete`);
      if (partialCount > 0) parts.push(`${partialCount} partial`);
      if (failCount > 0) parts.push(`${failCount} failed`);
      finalMessage = `Extraction: ${parts.join(', ')}`;
    }

    await getSupabaseClient()
      .from('reports')
      .update({
        report_status: finalStatus,
        processing_progress: 95,
        processing_message: finalMessage,
      })
      .eq('id', reportId);

    console.log(`[EXTRACT] Extraction complete: ${successCount} success, ${partialCount} partial, ${failCount} failed`);

    // ========================================================================
    // 6. Collect document types from extracted data
    // ========================================================================
    const documentTypes = results
      .filter(r => r.success && r.extractedData)
      .map(r => {
        const data = r.extractedData as Record<string, unknown>;
        return {
          documentId: r.documentId,
          document_type: (data.document_type as DocumentType) || 'Other',
        };
      });

    console.log(`[EXTRACT] Document types extracted: ${documentTypes.map(d => d.document_type).join(', ')}`);

    // ========================================================================
    // 7. Return results with document type information
    // ========================================================================
    return {
      success: successCount > 0,
      status: finalStatus,
      message: finalMessage,
      summary: {
        total: documents.length,
        success: successCount - partialCount,
        partial: partialCount,
        failed: failCount,
      },
      results: results.map(r => {
        const data = r.extractedData as Record<string, unknown> | undefined;
        const docType = data?.document_type as DocumentType | undefined;
        const extractionStatus: 'complete' | 'partial' | 'failed' = r.success
          ? (r.error ? 'partial' : 'complete')
          : 'failed';

        return {
          documentId: r.documentId,
          file_name: r.file_name,
          success: r.success,
          error: r.error,
          document_type: docType,
          extraction_status: extractionStatus,
        };
      }),
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during extraction';
    console.error('[EXTRACT] Error:', errorMessage);

    await getSupabaseClient()
      .from('reports')
      .update({
        report_status: 'extraction_failed',
        error_message: errorMessage,
        processing_progress: 0,
      })
      .eq('id', reportId);

    return {
      success: false,
      status: 'error',
      error: errorMessage,
    };
  }
}

/**
 * Extract data from a single document using Modal extraction with document type routing.
 * Falls back to Claude Vision only for scanned PDFs that require OCR.
 */
async function extractDocumentWithRetry(
  doc: DocumentRecord,
  reportId: string
): Promise<ExtractionResult> {
  let lastError: string = '';
  const fileName = doc.file_name || doc.file_path;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[EXTRACT] Attempt ${attempt}/${MAX_RETRIES} for document ${doc.id}`);

      // Download PDF from Supabase Storage
      const pdfBuffer = await downloadDocument(doc.file_path);
      console.log(`[EXTRACT] Loaded PDF: ${pdfBuffer.length} bytes`);

      // Try Modal extraction first (primary extraction method)
      const modalResult = await extractWithModal(pdfBuffer, {
        documentId: doc.id,
        filename: fileName,
        timeout: 60000,
      });

      // If Modal extraction succeeded, route to appropriate handler
      if (modalResult.success && modalResult.extraction) {
        console.log(`[EXTRACT] Modal extraction succeeded for ${doc.id}`);
        return routeExtraction(modalResult, doc.id, fileName);
      }

      // If Modal detected a scanned PDF, fail loud (no silent fallback per requirements)
      if (modalResult.scannedPdfResult?.recommendation === 'require_premium') {
        console.log(`[EXTRACT] Scanned PDF detected for ${doc.id}, requires user decision`);
        return {
          documentId: doc.id,
          file_name: fileName,
          success: false,
          error: `Scanned PDF detected. ${modalResult.scannedPdfResult.explanation}. Please upload a text-based PDF or use premium extraction.`,
        };
      }

      // If Modal failed for other reasons, log error but don't fall back silently
      if (modalResult.error) {
        console.error(`[EXTRACT] Modal extraction failed: ${modalResult.error.code} - ${modalResult.error.message}`);

        // For partial extractions, return what we have
        if (modalResult.extraction) {
          console.log(`[EXTRACT] Returning partial extraction for ${doc.id}`);
          const result = routeExtraction(modalResult, doc.id, fileName);
          return {
            ...result,
            error: `Partial extraction: ${modalResult.error.message}`,
          };
        }

        throw new Error(`Modal extraction failed: ${modalResult.error.message}`);
      }

      // Fallback to Claude Vision for OCR (only if Modal URL is not configured)
      console.log(`[EXTRACT] Falling back to Claude Vision for ${doc.id}`);
      return await extractWithClaudeVision(doc, pdfBuffer);

    } catch (error: unknown) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[EXTRACT] Attempt ${attempt} failed for ${doc.id}:`, lastError);

      if (attempt < MAX_RETRIES) {
        // Wait before retry with exponential backoff
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`[EXTRACT] Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  // All retries failed
  return {
    documentId: doc.id,
    file_name: fileName,
    success: false,
    error: `Failed after ${MAX_RETRIES} attempts: ${lastError}`,
  };
}

/**
 * Extract using Claude Vision API (legacy fallback for scanned PDFs).
 * This is expensive (~$3-15/document) and should only be used when Modal fails.
 */
async function extractWithClaudeVision(
  doc: DocumentRecord,
  pdfBuffer: Buffer
): Promise<ExtractionResult> {
  const pdfBase64 = pdfBuffer.toString('base64');
  const fileName = doc.file_name || doc.file_path;

  console.log(`[EXTRACT] Using Claude Vision for ${doc.id} (expensive fallback)`);

  const response = await getAnthropicClient().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: EXTRACTION_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBase64,
            },
          } as any,
          {
            type: 'text',
            text: EXTRACTION_USER_PROMPT,
          },
        ],
      },
    ],
  });

  // Extract text content from response
  let textContent = '';
  for (const block of response.content) {
    if (block.type === 'text') {
      textContent += block.text;
    }
  }

  // Parse JSON from response
  const extractedData = parseJsonResponse(textContent);

  if (!extractedData) {
    throw new Error('Failed to parse JSON from Claude response');
  }

  // Validate required fields
  if (!extractedData.document_type) {
    throw new Error('Missing document_type in extracted data');
  }

  console.log(`[EXTRACT] Claude Vision extracted from ${fileName}`);
  console.log(`[EXTRACT] Document type: ${extractedData.document_type}, Tax year: ${extractedData.tax_year}`);

  return {
    documentId: doc.id,
    file_name: fileName,
    success: true,
    extractedData,
  };
}

/**
 * Download a document from Supabase Storage
 */
async function downloadDocument(filePath: string): Promise<Buffer> {
  const cleanPath = filePath.replace(/^documents\//, '');

  const { data, error } = await getSupabaseClient().storage
    .from('documents')
    .download(cleanPath);

  if (error) {
    // Try with original path
    const { data: data2, error: error2 } = await getSupabaseClient().storage
      .from('documents')
      .download(filePath);

    if (error2) {
      throw new Error(`Failed to download document: ${error.message}`);
    }

    const arrayBuffer = await data2.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Parse JSON from Claude response with multiple strategies
 */
function parseJsonResponse(text: string): Record<string, unknown> | null {
  // Strategy 1: Direct parse
  try {
    return JSON.parse(text.trim());
  } catch {
    // Continue to next strategy
  }

  // Strategy 2: Extract from markdown code block
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {
      // Continue to next strategy
    }
  }

  // Strategy 3: Find JSON object boundaries
  const jsonStart = text.indexOf('{');
  const jsonEnd = text.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    try {
      return JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    } catch {
      // Failed to parse
    }
  }

  return null;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
