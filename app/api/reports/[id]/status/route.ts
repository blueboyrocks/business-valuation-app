/**
 * Report Status API - Two-Phase Progress Tracking
 *
 * Returns detailed status for both phases of the valuation workflow:
 * - Phase 1: Document Extraction (from document_extractions table)
 * - Phase 2: Valuation Report Generation (from reports table)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Initialize service role client for database access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

type ExtractionStatus = 'pending' | 'processing' | 'completed' | 'failed';
type ValuationStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface PhaseStatus {
  extraction: {
    status: ExtractionStatus;
    progress: number;
    documentsTotal: number;
    documentsCompleted: number;
    documentsFailed: number;
    documentsProcessing: number;
    message: string;
  };
  valuation: {
    status: ValuationStatus;
    progress: number;
    message: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const { data: { user }, error: authError } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const reportId = params.id;

    // ========================================================================
    // 2. Fetch report data
    // ========================================================================
    const { data: report, error: reportError } = await supabase
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

    // ========================================================================
    // 3. Fetch document count
    // ========================================================================
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('id')
      .eq('report_id', reportId);

    const totalDocuments = documents?.length || 0;

    // ========================================================================
    // 4. Fetch extraction status from document_extractions table
    // ========================================================================
    const { data: extractions, error: extractError } = await supabase
      .from('document_extractions')
      .select('id, extraction_status')
      .eq('report_id', reportId);

    const extractionStats = {
      total: totalDocuments,
      completed: extractions?.filter(e => e.extraction_status === 'completed').length || 0,
      failed: extractions?.filter(e => e.extraction_status === 'failed').length || 0,
      processing: extractions?.filter(e => e.extraction_status === 'processing').length || 0,
      pending: extractions?.filter(e => e.extraction_status === 'pending').length || 0,
    };

    // ========================================================================
    // 5. Calculate phase statuses
    // ========================================================================
    const typedReport = report as any;
    const reportStatus = typedReport.report_status as string;

    const phases = calculatePhaseStatus(reportStatus, extractionStats, typedReport);

    // ========================================================================
    // 6. Calculate overall progress
    // ========================================================================
    let overallProgress = 0;
    let overallMessage = '';

    if (reportStatus === 'pending') {
      overallProgress = 0;
      overallMessage = 'Waiting to start...';
    } else if (reportStatus === 'processing' || reportStatus === 'extracting') {
      // Phase 1 in progress
      overallProgress = Math.round(phases.extraction.progress * 0.5);
      overallMessage = phases.extraction.message;
    } else if (reportStatus === 'extraction_complete' || reportStatus === 'extraction_partial') {
      // Between phases
      overallProgress = 50;
      overallMessage = 'Extraction complete, preparing valuation...';
    } else if (reportStatus === 'valuating') {
      // Phase 2 in progress
      overallProgress = 50 + Math.round(phases.valuation.progress * 0.5);
      overallMessage = phases.valuation.message;
    } else if (reportStatus === 'completed') {
      overallProgress = 100;
      overallMessage = 'Valuation complete!';
    } else if (reportStatus === 'extraction_failed') {
      overallProgress = 0;
      overallMessage = 'Document extraction failed';
    } else if (reportStatus === 'valuation_failed') {
      overallProgress = 50;
      overallMessage = 'Valuation generation failed';
    } else if (reportStatus === 'error' || reportStatus === 'failed') {
      overallProgress = 0;
      overallMessage = typedReport.error_message || 'An error occurred';
    }

    // ========================================================================
    // 7. Return comprehensive status
    // ========================================================================
    return NextResponse.json({
      // Report identification
      reportId: typedReport.id,
      companyName: typedReport.company_name,

      // Overall status
      status: reportStatus,
      overallProgress,
      overallMessage,

      // Phase-specific status
      phases: {
        extraction: {
          status: phases.extraction.status,
          progress: phases.extraction.progress,
          documentsTotal: extractionStats.total,
          documentsCompleted: extractionStats.completed,
          documentsFailed: extractionStats.failed,
          documentsProcessing: extractionStats.processing,
          message: phases.extraction.message,
        },
        valuation: {
          status: phases.valuation.status,
          progress: phases.valuation.progress,
          message: phases.valuation.message,
        },
      },

      // Valuation results (if completed)
      valuation: reportStatus === 'completed' ? {
        amount: typedReport.valuation_amount,
        rangeLow: typedReport.valuation_range_low,
        rangeHigh: typedReport.valuation_range_high,
        method: typedReport.valuation_method,
      } : null,

      // Error information
      error: typedReport.error_message,

      // Timestamps
      timestamps: {
        created: typedReport.created_at,
        processingStarted: typedReport.processing_started_at,
        completed: typedReport.completed_at,
      },

      // Legacy fields for backwards compatibility
      progressPercentage: overallProgress,
      estimatedTimeRemaining: calculateTimeRemaining(reportStatus, typedReport),
    });

  } catch (error) {
    console.error('Error in report status route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate status for each phase based on report status and extraction stats
 */
function calculatePhaseStatus(
  reportStatus: string,
  extractionStats: { total: number; completed: number; failed: number; processing: number; pending: number },
  report: any
): PhaseStatus {
  const { total, completed, failed, processing } = extractionStats;

  // Default states
  let extractionStatus: ExtractionStatus = 'pending';
  let extractionProgress = 0;
  let extractionMessage = 'Waiting to extract documents...';

  let valuationStatus: ValuationStatus = 'pending';
  let valuationProgress = 0;
  let valuationMessage = 'Waiting for document extraction...';

  // Determine extraction phase status
  if (total === 0) {
    extractionStatus = 'pending';
    extractionProgress = 0;
    extractionMessage = 'No documents to extract';
  } else if (processing > 0) {
    extractionStatus = 'processing';
    extractionProgress = Math.round((completed / total) * 100);
    extractionMessage = `Extracting documents... (${completed}/${total} completed)`;
  } else if (completed === total && total > 0) {
    extractionStatus = 'completed';
    extractionProgress = 100;
    extractionMessage = `All ${total} documents extracted`;
  } else if (completed > 0 && completed < total && processing === 0) {
    // Partial completion (some failed)
    extractionStatus = failed > 0 ? 'completed' : 'processing';
    extractionProgress = Math.round((completed / total) * 100);
    extractionMessage = `${completed}/${total} documents extracted${failed > 0 ? ` (${failed} failed)` : ''}`;
  } else if (failed === total && total > 0) {
    extractionStatus = 'failed';
    extractionProgress = 0;
    extractionMessage = 'All document extractions failed';
  }

  // Override based on report status
  switch (reportStatus) {
    case 'pending':
      extractionStatus = 'pending';
      extractionProgress = 0;
      extractionMessage = 'Waiting to start...';
      valuationStatus = 'pending';
      valuationProgress = 0;
      valuationMessage = 'Waiting for extraction...';
      break;

    case 'processing':
    case 'extracting':
      // Keep calculated extraction status
      valuationStatus = 'pending';
      valuationProgress = 0;
      valuationMessage = 'Waiting for extraction to complete...';
      break;

    case 'extraction_complete':
    case 'extraction_partial':
      extractionStatus = 'completed';
      extractionProgress = 100;
      valuationStatus = 'pending';
      valuationProgress = 0;
      valuationMessage = 'Starting valuation...';
      break;

    case 'extraction_failed':
      extractionStatus = 'failed';
      extractionMessage = report.error_message || 'Document extraction failed';
      valuationStatus = 'pending';
      valuationProgress = 0;
      valuationMessage = 'Cannot proceed without extracted data';
      break;

    case 'valuating':
      extractionStatus = 'completed';
      extractionProgress = 100;
      extractionMessage = `${completed} documents extracted`;
      valuationStatus = 'processing';
      valuationProgress = report.processing_progress ? Math.max(0, report.processing_progress - 50) * 2 : 50;
      valuationMessage = report.processing_message || 'Generating valuation report...';
      break;

    case 'valuation_failed':
      extractionStatus = 'completed';
      extractionProgress = 100;
      valuationStatus = 'failed';
      valuationProgress = 0;
      valuationMessage = report.error_message || 'Valuation generation failed';
      break;

    case 'completed':
      extractionStatus = 'completed';
      extractionProgress = 100;
      extractionMessage = `${completed} documents extracted`;
      valuationStatus = 'completed';
      valuationProgress = 100;
      valuationMessage = 'Valuation complete!';
      break;

    case 'error':
    case 'failed':
      // Determine which phase failed based on extraction stats
      if (completed === 0 && total > 0) {
        extractionStatus = 'failed';
        extractionMessage = report.error_message || 'Extraction failed';
        valuationStatus = 'pending';
      } else {
        extractionStatus = 'completed';
        valuationStatus = 'failed';
        valuationMessage = report.error_message || 'Processing failed';
      }
      break;
  }

  return {
    extraction: {
      status: extractionStatus,
      progress: extractionProgress,
      documentsTotal: total,
      documentsCompleted: completed,
      documentsFailed: failed,
      documentsProcessing: processing,
      message: extractionMessage,
    },
    valuation: {
      status: valuationStatus,
      progress: valuationProgress,
      message: valuationMessage,
    },
  };
}

/**
 * Calculate estimated time remaining
 */
function calculateTimeRemaining(reportStatus: string, report: any): string | null {
  if (reportStatus === 'completed' || reportStatus === 'failed' || reportStatus === 'error') {
    return null;
  }

  if (!report.processing_started_at) {
    return '5-10 minutes';
  }

  const startTime = new Date(report.processing_started_at).getTime();
  const now = Date.now();
  const elapsed = now - startTime;
  const estimatedTotal = 8 * 60 * 1000; // 8 minutes estimated

  const remaining = estimatedTotal - elapsed;
  if (remaining <= 0) {
    return 'Almost done...';
  }

  const minutesRemaining = Math.ceil(remaining / 60000);
  return `${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}`;
}
