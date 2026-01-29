/**
 * Document Extraction API v2 - PRD-H Pipeline
 *
 * New extraction endpoint using the three-stage pipeline:
 * - Stage 1: Modal/pdfplumber deterministic extraction
 * - Stage 2: Haiku classification and schema mapping
 * - Stage 3: Sonnet/Opus validation and enrichment
 *
 * This endpoint:
 * 1. Fetches documents from Supabase storage
 * 2. Runs the extraction pipeline for each document
 * 3. Stores results in document_extractions table
 * 4. Updates report status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { extractDocumentPipeline, PipelineResult } from '@/lib/extraction/pipeline';
import { FinalExtractionOutput, PipelineProgressEvent } from '@/lib/extraction/types';

// Lazy-initialize Supabase client to avoid build-time errors
let supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return supabase;
}

// Vercel Pro timeout - extraction can take a while
export const maxDuration = 300;

/**
 * Extraction result for a single document
 */
interface DocumentExtractionResult {
  documentId: string;
  filename: string;
  success: boolean;
  confidenceScore: number;
  validationStatus: 'passed' | 'warnings' | 'errors';
  error?: string;
  needsClaudeVision?: boolean;
  processingTimeMs: number;
}

/**
 * API response
 */
interface ExtractionResponse {
  success: boolean;
  reportId: string;
  documentsProcessed: number;
  documentsSuccessful: number;
  documentsFailed: number;
  results: DocumentExtractionResult[];
  totalProcessingTimeMs: number;
  error?: string;
}

/**
 * Fetch document file from Supabase storage
 */
async function fetchDocumentFile(
  client: SupabaseClient,
  documentId: string,
  storagePath: string
): Promise<Buffer | null> {
  try {
    const { data, error } = await client.storage
      .from('documents')
      .download(storagePath);

    if (error) {
      console.error(`[Extract-v2] Failed to download ${storagePath}:`, error);
      return null;
    }

    // Convert Blob to Buffer
    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error(`[Extract-v2] Error fetching document ${documentId}:`, error);
    return null;
  }
}

/**
 * Save extraction result to database
 */
async function saveExtractionResult(
  client: SupabaseClient,
  reportId: string,
  documentId: string,
  result: PipelineResult
): Promise<void> {
  const validationStatus = result.finalOutput?.validation.status ??
    (result.error ? 'errors' : 'passed');

  const upsertData = {
    report_id: reportId,
    document_id: documentId,
    document_type: result.stage2Output?.classification.document_type ?? null,
    tax_year: result.stage2Output?.classification.tax_year ?? null,
    entity_name: result.stage2Output?.classification.entity_name ?? null,
    stage1_output: result.stage1Output ?? null,
    stage2_output: result.stage2Output ?? null,
    stage3_output: result.finalOutput ?? null,
    confidence_score: result.finalOutput?.financial_data
      ? Object.values(result.finalOutput.financial_data)[0]?.extraction_confidence ?? null
      : null,
    validation_status: validationStatus,
    processing_time_ms: result.processingTimeMs,
    updated_at: new Date().toISOString(),
  };

  const { error } = await client
    .from('document_extractions')
    .upsert(upsertData, {
      onConflict: 'report_id,document_id',
    });

  if (error) {
    console.error(`[Extract-v2] Failed to save extraction for ${documentId}:`, error);
  }
}

/**
 * Update report status
 */
async function updateReportStatus(
  client: SupabaseClient,
  reportId: string,
  status: 'extracting' | 'extracted' | 'extraction_failed',
  extractionSummary?: object
): Promise<void> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  // Map v2 extraction status to report_status
  if (status === 'extracting') {
    updateData.report_status = 'processing';
  } else if (status === 'extracted') {
    updateData.report_status = 'processing'; // Still need to run valuation
  } else {
    updateData.report_status = 'failed';
  }

  if (extractionSummary) {
    // Get existing report_data and merge
    const { data: report } = await client
      .from('reports')
      .select('report_data')
      .eq('id', reportId)
      .single();

    updateData.report_data = {
      ...(report?.report_data as object ?? {}),
      extraction_v2_summary: extractionSummary,
    };
  }

  const { error } = await client
    .from('reports')
    .update(updateData)
    .eq('id', reportId);

  if (error) {
    console.error(`[Extract-v2] Failed to update report status:`, error);
  }
}

/**
 * POST handler - Run extraction pipeline
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ExtractionResponse>> {
  const reportId = params.id;
  const totalStartTime = Date.now();
  const client = getSupabaseClient();

  console.log(`[Extract-v2] Starting extraction for report ${reportId}`);

  try {
    // Get request body for optional parameters
    let requestBody: { documentIds?: string[]; skipAiValidation?: boolean } = {};
    try {
      requestBody = await request.json();
    } catch {
      // No body is OK
    }

    // Update report status to extracting
    await updateReportStatus(client, reportId, 'extracting');

    // Get documents for this report
    const { data: documents, error: docsError } = await client
      .from('documents')
      .select('id, file_name, storage_path')
      .eq('report_id', reportId);

    if (docsError) {
      console.error(`[Extract-v2] Failed to fetch documents:`, docsError);
      return NextResponse.json({
        success: false,
        reportId,
        documentsProcessed: 0,
        documentsSuccessful: 0,
        documentsFailed: 0,
        results: [],
        totalProcessingTimeMs: Date.now() - totalStartTime,
        error: 'Failed to fetch documents',
      }, { status: 500 });
    }

    if (!documents || documents.length === 0) {
      return NextResponse.json({
        success: false,
        reportId,
        documentsProcessed: 0,
        documentsSuccessful: 0,
        documentsFailed: 0,
        results: [],
        totalProcessingTimeMs: Date.now() - totalStartTime,
        error: 'No documents found for this report',
      }, { status: 404 });
    }

    // Filter to specific documents if requested
    const docsToProcess = requestBody.documentIds
      ? documents.filter((d) => requestBody.documentIds!.includes(d.id))
      : documents;

    console.log(`[Extract-v2] Processing ${docsToProcess.length} documents`);

    const results: DocumentExtractionResult[] = [];

    // Process each document
    for (const doc of docsToProcess) {
      console.log(`[Extract-v2] Processing document ${doc.id}: ${doc.file_name}`);

      // Fetch PDF from storage
      const pdfBuffer = await fetchDocumentFile(client, doc.id, doc.storage_path);

      if (!pdfBuffer) {
        results.push({
          documentId: doc.id,
          filename: doc.file_name,
          success: false,
          confidenceScore: 0,
          validationStatus: 'errors',
          error: 'Failed to download document from storage',
          processingTimeMs: 0,
        });
        continue;
      }

      // Run extraction pipeline
      const pipelineResult = await extractDocumentPipeline(
        pdfBuffer,
        doc.id,
        doc.file_name,
        {
          skipAiValidation: requestBody.skipAiValidation,
          onProgress: (event: PipelineProgressEvent) => {
            console.log(`[Extract-v2] ${doc.id}: ${event.stage} - ${JSON.stringify(event)}`);
          },
        }
      );

      // Save to database
      await saveExtractionResult(client, reportId, doc.id, pipelineResult);

      // Build result
      const confidenceScore = pipelineResult.finalOutput?.financial_data
        ? Object.values(pipelineResult.finalOutput.financial_data)[0]?.extraction_confidence ?? 0
        : 0;

      results.push({
        documentId: doc.id,
        filename: doc.file_name,
        success: pipelineResult.success,
        confidenceScore,
        validationStatus: pipelineResult.finalOutput?.validation.status ?? 'errors',
        error: pipelineResult.error ?? undefined,
        needsClaudeVision: pipelineResult.needsClaudeVision,
        processingTimeMs: pipelineResult.processingTimeMs,
      });
    }

    // Calculate summary
    const documentsSuccessful = results.filter((r) => r.success).length;
    const documentsFailed = results.filter((r) => !r.success).length;
    const totalProcessingTimeMs = Date.now() - totalStartTime;

    // Update report status
    const finalStatus = documentsFailed === docsToProcess.length ? 'extraction_failed' : 'extracted';
    await updateReportStatus(client, reportId, finalStatus, {
      documentsProcessed: docsToProcess.length,
      documentsSuccessful,
      documentsFailed,
      totalProcessingTimeMs,
      completedAt: new Date().toISOString(),
    });

    console.log(`[Extract-v2] Extraction complete. Success: ${documentsSuccessful}/${docsToProcess.length}`);

    return NextResponse.json({
      success: documentsFailed < docsToProcess.length,
      reportId,
      documentsProcessed: docsToProcess.length,
      documentsSuccessful,
      documentsFailed,
      results,
      totalProcessingTimeMs,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Extract-v2] Extraction failed:`, error);

    await updateReportStatus(client, reportId, 'extraction_failed');

    return NextResponse.json({
      success: false,
      reportId,
      documentsProcessed: 0,
      documentsSuccessful: 0,
      documentsFailed: 0,
      results: [],
      totalProcessingTimeMs: Date.now() - totalStartTime,
      error: errorMessage,
    }, { status: 500 });
  }
}

/**
 * GET handler - Check extraction status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const reportId = params.id;
  const client = getSupabaseClient();

  try {
    // Get extraction records for this report
    const { data: extractions, error } = await client
      .from('document_extractions')
      .select(`
        id,
        document_id,
        document_type,
        tax_year,
        entity_name,
        confidence_score,
        validation_status,
        processing_time_ms,
        created_at,
        updated_at
      `)
      .eq('report_id', reportId);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch extractions' },
        { status: 500 }
      );
    }

    const total = extractions?.length || 0;
    const successful = extractions?.filter((e) => e.validation_status !== 'errors').length || 0;
    const failed = extractions?.filter((e) => e.validation_status === 'errors').length || 0;
    const avgConfidence =
      total > 0
        ? Math.round(
            extractions!.reduce((sum, e) => sum + (e.confidence_score || 0), 0) / total
          )
        : 0;

    return NextResponse.json({
      reportId,
      total,
      successful,
      failed,
      averageConfidence: avgConfidence,
      extractions: extractions || [],
    });
  } catch (error) {
    console.error(`[Extract-v2] Status check failed:`, error);
    return NextResponse.json(
      { error: 'Failed to check extraction status' },
      { status: 500 }
    );
  }
}
