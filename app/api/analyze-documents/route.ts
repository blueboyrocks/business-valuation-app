/**
 * Document Analysis Orchestrator - Two-Phase Workflow
 *
 * This endpoint orchestrates the complete valuation workflow:
 * Phase 1: Extract financial data from each document (sequential)
 * Phase 2: Generate comprehensive valuation report from extracted data
 *
 * Flow:
 * 1. Validate request and check documents exist
 * 2. Call extractDocuments function directly (Phase 1)
 * 3. Call processValuation function directly (Phase 2)
 * 4. Return final result
 *
 * NOTE: We use direct function imports instead of HTTP calls to avoid
 * authentication issues between serverless functions on Vercel.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { extractDocuments } from '@/lib/extraction';
import { processValuation } from '@/lib/valuation';

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

interface AnalysisRequest {
  reportId: string;
}

// Allow up to 5 minutes for the orchestration
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  console.log('🔬 [ORCHESTRATOR] Starting two-phase valuation workflow');

  let reportId: string | undefined;

  try {
    // ========================================================================
    // 1. Authenticate user
    // ========================================================================
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const authSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const { data: { user }, error: authError } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ========================================================================
    // 2. Validate request
    // ========================================================================
    const body = await request.json() as AnalysisRequest;
    reportId = body.reportId;

    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    // ========================================================================
    // 3. Verify report and documents exist
    // ========================================================================
    const { data: report, error: reportError } = await getSupabaseClient()
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (reportError || !report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    const { data: documents, error: documentsError } = await getSupabaseClient()
      .from('documents')
      .select('*')
      .eq('report_id', reportId)
      .eq('user_id', user.id);

    if (documentsError || !documents || documents.length === 0) {
      return NextResponse.json(
        { error: 'No documents found for this report' },
        { status: 404 }
      );
    }

    console.log(`✓ [ORCHESTRATOR] Found ${documents.length} document(s) for report ${reportId}`);

    // ========================================================================
    // 4. Update report status to processing
    // ========================================================================
    await getSupabaseClient()
      .from('reports')
      .update({
        report_status: 'processing',
        processing_started_at: new Date().toISOString(),
        processing_progress: 0,
        processing_message: 'Starting document analysis...',
        error_message: null,
      })
      .eq('id', reportId);

    console.log(`✓ [ORCHESTRATOR] Report ${reportId} marked as processing`);

    // ========================================================================
    // 5. PHASE 1: Extract documents (direct function call)
    // ========================================================================
    console.log('📄 [ORCHESTRATOR] Starting Phase 1: Document Extraction');

    await getSupabaseClient()
      .from('reports')
      .update({
        processing_progress: 5,
        processing_message: `Extracting financial data from ${documents.length} document(s)...`,
      })
      .eq('id', reportId);

    // Call extraction function directly (no HTTP overhead)
    console.log(`📄 [ORCHESTRATOR] Calling extractDocuments function directly`);
    const extractResult = await extractDocuments(reportId);

    if (!extractResult.success) {
      console.error('❌ [ORCHESTRATOR] Phase 1 failed:', extractResult.error);

      await getSupabaseClient()
        .from('reports')
        .update({
          report_status: 'extraction_failed',
          error_message: extractResult.error || 'Document extraction failed',
          processing_progress: 0,
        })
        .eq('id', reportId);

      return NextResponse.json({
        status: 'error',
        phase: 1,
        error: extractResult.error || 'Document extraction failed',
        details: extractResult,
      }, { status: 500 });
    }

    // Check if any extractions failed
    if (extractResult.summary && extractResult.summary.failed > 0) {
      console.warn(`⚠️ [ORCHESTRATOR] ${extractResult.summary.failed} document(s) failed extraction`);

      // If ALL documents failed, abort
      if (extractResult.summary.success === 0) {
        await getSupabaseClient()
          .from('reports')
          .update({
            report_status: 'extraction_failed',
            error_message: 'All document extractions failed',
            processing_progress: 0,
          })
          .eq('id', reportId);

        return NextResponse.json({
          status: 'error',
          phase: 1,
          error: 'All document extractions failed',
          details: extractResult,
        }, { status: 500 });
      }

      // Continue with partial extractions
      console.log(`✓ [ORCHESTRATOR] Continuing with ${extractResult.summary.success} successful extraction(s)`);
    }

    console.log(`✓ [ORCHESTRATOR] Phase 1 complete: ${extractResult.summary?.success || 0} document(s) extracted`);

    // ========================================================================
    // 6. PHASE 2: Generate valuation report (direct function call)
    // ========================================================================
    console.log('📊 [ORCHESTRATOR] Starting Phase 2: Valuation Report');

    await getSupabaseClient()
      .from('reports')
      .update({
        processing_progress: 50,
        processing_message: 'Generating comprehensive valuation report...',
      })
      .eq('id', reportId);

    // Call valuation function directly (no HTTP overhead)
    console.log(`📊 [ORCHESTRATOR] Calling processValuation function directly`);
    const valuationResult = await processValuation(reportId);

    if (!valuationResult.success) {
      console.error('❌ [ORCHESTRATOR] Phase 2 failed:', valuationResult.error);

      await getSupabaseClient()
        .from('reports')
        .update({
          report_status: 'valuation_failed',
          error_message: valuationResult.error || 'Valuation report generation failed',
          processing_progress: 50,
        })
        .eq('id', reportId);

      return NextResponse.json({
        status: 'error',
        phase: 2,
        error: valuationResult.error || 'Valuation report generation failed',
        extractionResult: {
          success: extractResult.summary?.success || 0,
          failed: extractResult.summary?.failed || 0,
        },
        details: valuationResult,
      }, { status: 500 });
    }

    console.log(`✓ [ORCHESTRATOR] Phase 2 complete: Valuation report generated`);

    // ========================================================================
    // 7. Return success response
    // ========================================================================
    console.log('🎉 [ORCHESTRATOR] Two-phase workflow completed successfully!');

    return NextResponse.json({
      status: 'completed',
      message: 'Valuation report generated successfully',
      reportId,
      phases: {
        extraction: {
          status: 'completed',
          documentsProcessed: extractResult.summary?.success || 0,
          documentsFailed: extractResult.summary?.failed || 0,
        },
        valuation: {
          status: 'completed',
          concludedValue: valuationResult.valuation?.concluded_value,
          rangeLow: valuationResult.valuation?.range_low,
          rangeHigh: valuationResult.valuation?.range_high,
          confidence: valuationResult.valuation?.confidence,
        },
      },
      metrics: valuationResult.metrics,
    });

  } catch (error) {
    console.error('❌ [ORCHESTRATOR] Unexpected error:', error);

    // Try to update report status
    if (reportId) {
      try {
        await getSupabaseClient()
          .from('reports')
          .update({
            report_status: 'error',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            processing_progress: 0,
          })
          .eq('id', reportId);
      } catch (updateError) {
        console.error('Failed to update report status:', updateError);
      }
    }

    return NextResponse.json({
      status: 'error',
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * GET endpoint to check the current status of analysis
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reportId = searchParams.get('reportId');

  if (!reportId) {
    return NextResponse.json({ error: 'reportId is required' }, { status: 400 });
  }

  const { data: report, error } = await getSupabaseClient()
    .from('reports')
    .select('report_status, processing_progress, processing_message, error_message')
    .eq('id', reportId)
    .single();

  if (error || !report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  // Also get extraction status
  const { data: extractions } = await getSupabaseClient()
    .from('document_extractions')
    .select('extraction_status')
    .eq('report_id', reportId);

  const extractionSummary = {
    total: extractions?.length || 0,
    completed: extractions?.filter(e => e.extraction_status === 'completed').length || 0,
    failed: extractions?.filter(e => e.extraction_status === 'failed').length || 0,
    pending: extractions?.filter(e => e.extraction_status === 'pending').length || 0,
    processing: extractions?.filter(e => e.extraction_status === 'processing').length || 0,
  };

  return NextResponse.json({
    status: report.report_status,
    progress: report.processing_progress || 0,
    message: report.processing_message || '',
    error: report.error_message,
    extraction: extractionSummary,
  });
}
