/**
 * Document Extraction API - Phase 1 of Valuation Pipeline
 *
 * This endpoint extracts financial data from each PDF document sequentially.
 * It uses a lightweight extraction prompt (not the full valuation skill) to
 * stay under rate limits and improve reliability.
 *
 * Flow:
 * 1. Fetch all documents for the report
 * 2. For each document:
 *    - Load PDF from Supabase Storage
 *    - Call Claude API with focused extraction prompt
 *    - Save extracted data to document_extractions table
 *    - Update progress
 * 3. Return summary of extraction results
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Vercel Pro timeout
export const maxDuration = 300;

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
  filename?: string;
  file_type?: string;
}

interface ExtractionResult {
  documentId: string;
  filename: string;
  success: boolean;
  error?: string;
  extractedData?: Record<string, unknown>;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const reportId = params.id;
  console.log(`[EXTRACT] Starting document extraction for report ${reportId}`);

  try {
    // ========================================================================
    // 1. Validate report exists
    // ========================================================================
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('id, report_status, user_id')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      console.error('[EXTRACT] Report not found:', reportError);
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // ========================================================================
    // 2. Fetch all documents for this report
    // ========================================================================
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('id, file_path, filename, file_type')
      .eq('report_id', reportId);

    if (docsError) {
      console.error('[EXTRACT] Error fetching documents:', docsError);
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }

    if (!documents || documents.length === 0) {
      return NextResponse.json({ error: 'No documents found for this report' }, { status: 400 });
    }

    console.log(`[EXTRACT] Found ${documents.length} document(s) to process`);

    // ========================================================================
    // 3. Update report status
    // ========================================================================
    await supabase
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

      console.log(`[EXTRACT] Processing document ${docNumber}/${documents.length}: ${doc.filename || doc.file_path}`);

      // Update progress
      await supabase
        .from('reports')
        .update({
          processing_progress: progressPercent - 10,
          processing_message: `Extracting document ${docNumber} of ${documents.length}...`,
        })
        .eq('id', reportId);

      // Check if extraction already exists
      const { data: existingExtraction } = await supabase
        .from('document_extractions')
        .select('id, extraction_status')
        .eq('document_id', doc.id)
        .eq('report_id', reportId)
        .single();

      if (existingExtraction?.extraction_status === 'completed') {
        console.log(`[EXTRACT] Document ${doc.id} already extracted, skipping`);
        results.push({
          documentId: doc.id,
          filename: doc.filename || doc.file_path,
          success: true,
        });
        successCount++;
        continue;
      }

      // Create or update extraction record as processing
      const extractionId = existingExtraction?.id;
      if (extractionId) {
        await supabase
          .from('document_extractions')
          .update({
            extraction_status: 'processing',
            error_message: null,
          })
          .eq('id', extractionId);
      } else {
        await supabase
          .from('document_extractions')
          .insert({
            document_id: doc.id,
            report_id: reportId,
            extraction_status: 'processing',
          });
      }

      // Extract data with retry logic
      const result = await extractDocumentWithRetry(doc, reportId);
      results.push(result);

      if (result.success) {
        successCount++;
        // Update extraction record with data
        await supabase
          .from('document_extractions')
          .update({
            extracted_data: result.extractedData,
            extraction_status: 'completed',
            error_message: null,
          })
          .eq('document_id', doc.id)
          .eq('report_id', reportId);
      } else {
        failCount++;
        // Update extraction record with error
        await supabase
          .from('document_extractions')
          .update({
            extraction_status: 'failed',
            error_message: result.error,
          })
          .eq('document_id', doc.id)
          .eq('report_id', reportId);
      }

      // Update progress
      await supabase
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
    // 5. Update final status
    // ========================================================================
    const allSuccess = failCount === 0;
    const finalStatus = allSuccess ? 'extraction_complete' : 'extraction_partial';
    const finalMessage = allSuccess
      ? `Successfully extracted ${successCount} document(s)`
      : `Extracted ${successCount} of ${documents.length} documents (${failCount} failed)`;

    await supabase
      .from('reports')
      .update({
        report_status: finalStatus,
        processing_progress: 95,
        processing_message: finalMessage,
      })
      .eq('id', reportId);

    console.log(`[EXTRACT] Extraction complete: ${successCount} success, ${failCount} failed`);

    // ========================================================================
    // 6. Return results
    // ========================================================================
    return NextResponse.json({
      status: finalStatus,
      message: finalMessage,
      summary: {
        total: documents.length,
        success: successCount,
        failed: failCount,
      },
      results: results.map(r => ({
        documentId: r.documentId,
        filename: r.filename,
        success: r.success,
        error: r.error,
      })),
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during extraction';
    console.error('[EXTRACT] Error:', errorMessage);

    await supabase
      .from('reports')
      .update({
        report_status: 'extraction_failed',
        error_message: errorMessage,
        processing_progress: 0,
      })
      .eq('id', reportId);

    return NextResponse.json({
      status: 'error',
      error: errorMessage,
    }, { status: 500 });
  }
}

/**
 * Extract data from a single document with retry logic
 */
async function extractDocumentWithRetry(
  doc: DocumentRecord,
  reportId: string
): Promise<ExtractionResult> {
  let lastError: string = '';

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[EXTRACT] Attempt ${attempt}/${MAX_RETRIES} for document ${doc.id}`);

      // Download PDF from Supabase Storage
      const pdfBuffer = await downloadDocument(doc.file_path);
      const pdfBase64 = pdfBuffer.toString('base64');

      console.log(`[EXTRACT] Loaded PDF: ${pdfBuffer.length} bytes`);

      // Call Claude API
      const response = await anthropic.messages.create({
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

      console.log(`[EXTRACT] Successfully extracted data from ${doc.filename || doc.file_path}`);
      console.log(`[EXTRACT] Document type: ${extractedData.document_type}, Tax year: ${extractedData.tax_year}`);

      return {
        documentId: doc.id,
        filename: doc.filename || doc.file_path,
        success: true,
        extractedData,
      };

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
    filename: doc.filename || doc.file_path,
    success: false,
    error: `Failed after ${MAX_RETRIES} attempts: ${lastError}`,
  };
}

/**
 * Download a document from Supabase Storage
 */
async function downloadDocument(filePath: string): Promise<Buffer> {
  const cleanPath = filePath.replace(/^documents\//, '');

  const { data, error } = await supabase.storage
    .from('documents')
    .download(cleanPath);

  if (error) {
    // Try with original path
    const { data: data2, error: error2 } = await supabase.storage
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

/**
 * GET handler for checking extraction status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const reportId = params.id;

  // Get extraction records for this report
  const { data: extractions, error } = await supabase
    .from('document_extractions')
    .select('id, document_id, extraction_status, error_message, created_at, updated_at')
    .eq('report_id', reportId);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch extractions' }, { status: 500 });
  }

  const total = extractions?.length || 0;
  const completed = extractions?.filter(e => e.extraction_status === 'completed').length || 0;
  const failed = extractions?.filter(e => e.extraction_status === 'failed').length || 0;
  const pending = extractions?.filter(e => e.extraction_status === 'pending').length || 0;
  const processing = extractions?.filter(e => e.extraction_status === 'processing').length || 0;

  return NextResponse.json({
    total,
    completed,
    failed,
    pending,
    processing,
    extractions: extractions || [],
  });
}
