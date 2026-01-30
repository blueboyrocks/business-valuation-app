/**
 * Scanned PDF Extraction Decision API
 *
 * Handles user decision when a PDF is detected as scanned.
 * Options:
 * - use_premium: Route to Claude Vision extraction
 * - reupload: Allow user to upload a different document
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isClaudeVisionFallbackAllowed } from '@/lib/feature-flags';

// Lazy-initialize Supabase client
let supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return supabase;
}

interface ExtractionDecisionRequest {
  decision: 'use_premium' | 'reupload' | 'cancel';
  documentIds?: string[];
}

interface ExtractionDecisionResponse {
  success: boolean;
  message: string;
  nextAction?: 'proceed_with_premium' | 'await_reupload' | 'cancelled';
  error?: string;
}

/**
 * POST handler - Process user's extraction decision
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ExtractionDecisionResponse>> {
  const { id: reportId } = await params;

  try {
    const body: ExtractionDecisionRequest = await request.json();
    const { decision, documentIds } = body;

    console.log(`[EXTRACTION-DECISION] Report ${reportId}: User chose ${decision}`);

    // Validate decision
    if (!['use_premium', 'reupload', 'cancel'].includes(decision)) {
      return NextResponse.json(
        { success: false, message: 'Invalid decision', error: 'Decision must be use_premium, reupload, or cancel' },
        { status: 400 }
      );
    }

    // Verify report exists and is awaiting decision
    const { data: report, error: reportError } = await getSupabaseClient()
      .from('reports')
      .select('id, report_status')
      .eq('id', reportId)
      .maybeSingle();

    if (reportError || !report) {
      return NextResponse.json(
        { success: false, message: 'Report not found', error: 'Report does not exist' },
        { status: 404 }
      );
    }

    // Handle each decision type
    switch (decision) {
      case 'use_premium': {
        // Check if Claude Vision fallback is allowed
        if (!isClaudeVisionFallbackAllowed()) {
          return NextResponse.json(
            {
              success: false,
              message: 'Premium extraction not available',
              error: 'Claude Vision fallback is disabled in configuration',
            },
            { status: 403 }
          );
        }

        // Update report status to use premium extraction
        await (getSupabaseClient().from('reports') as any).update({
          report_status: 'extracting_premium',
          processing_message: 'Using premium extraction for scanned documents...',
        }).eq('id', reportId);

        // Mark affected documents for premium extraction
        if (documentIds && documentIds.length > 0) {
          await (getSupabaseClient().from('document_extractions') as any).update({
            extraction_status: 'pending_premium',
            error_message: null,
          }).eq('report_id', reportId).in('document_id', documentIds);
        }

        console.log(`[EXTRACTION-DECISION] Report ${reportId}: Proceeding with premium extraction`);

        return NextResponse.json({
          success: true,
          message: 'Premium extraction initiated. Your scanned documents will be processed using advanced extraction.',
          nextAction: 'proceed_with_premium',
        });
      }

      case 'reupload': {
        // Update report status to allow reupload
        await (getSupabaseClient().from('reports') as any).update({
          report_status: 'awaiting_documents',
          processing_message: 'Waiting for new document upload...',
        }).eq('id', reportId);

        // Mark affected documents as needing replacement
        if (documentIds && documentIds.length > 0) {
          await (getSupabaseClient().from('document_extractions') as any).update({
            extraction_status: 'needs_replacement',
            error_message: 'Document is scanned - please upload a text-based PDF',
          }).eq('report_id', reportId).in('document_id', documentIds);
        }

        console.log(`[EXTRACTION-DECISION] Report ${reportId}: Awaiting document reupload`);

        return NextResponse.json({
          success: true,
          message: 'Please upload a text-based PDF version of your document.',
          nextAction: 'await_reupload',
        });
      }

      case 'cancel': {
        // Update report status to cancelled/draft
        await (getSupabaseClient().from('reports') as any).update({
          report_status: 'draft',
          processing_message: 'Processing cancelled by user',
        }).eq('id', reportId);

        console.log(`[EXTRACTION-DECISION] Report ${reportId}: Cancelled by user`);

        return NextResponse.json({
          success: true,
          message: 'Processing cancelled. You can restart when ready.',
          nextAction: 'cancelled',
        });
      }

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid decision', error: 'Unknown decision type' },
          { status: 400 }
        );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[EXTRACTION-DECISION] Error: ${message}`);

    return NextResponse.json(
      { success: false, message: 'Failed to process decision', error: message },
      { status: 500 }
    );
  }
}

/**
 * GET handler - Get current extraction status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: reportId } = await params;

  try {
    // Get report status
    const { data: report, error: reportError } = await getSupabaseClient()
      .from('reports')
      .select('id, report_status, processing_message')
      .eq('id', reportId)
      .maybeSingle();

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Get extraction statuses for documents
    const { data: extractions } = await getSupabaseClient()
      .from('document_extractions')
      .select('document_id, extraction_status, error_message')
      .eq('report_id', reportId);

    const extractionData = extractions as Array<{
      document_id: string;
      extraction_status: string;
      error_message: string | null;
    }> | null;

    const scannedDocuments = extractionData?.filter(
      e => e.extraction_status === 'scanned_detected' || e.error_message?.includes('scanned')
    );

    const reportData = report as { report_status: string; processing_message: string | null };

    return NextResponse.json({
      reportStatus: reportData.report_status,
      processingMessage: reportData.processing_message,
      requiresDecision: reportData.report_status === 'awaiting_user_decision',
      scannedDocuments: scannedDocuments?.map(d => d.document_id) || [],
      options: reportData.report_status === 'awaiting_user_decision'
        ? [
            {
              value: 'use_premium',
              label: 'Use Premium Extraction',
              description: 'Process scanned documents using advanced AI extraction (may take longer)',
            },
            {
              value: 'reupload',
              label: 'Upload Different Document',
              description: 'Upload a text-based PDF instead of the scanned version',
            },
            {
              value: 'cancel',
              label: 'Cancel',
              description: 'Cancel processing and return to draft',
            },
          ]
        : [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
