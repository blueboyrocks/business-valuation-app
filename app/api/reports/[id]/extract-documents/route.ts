/**
 * Document Extraction API - Phase 1 of Valuation Pipeline
 *
 * This endpoint extracts financial data from each PDF document sequentially.
 * It uses a lightweight extraction prompt (not the full valuation skill) to
 * stay under rate limits and improve reliability.
 *
 * The core extraction logic is in lib/extraction.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { extractDocuments } from '@/lib/extraction';

// Initialize Supabase client for status checks
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Vercel Pro timeout
export const maxDuration = 300;

/**
 * HTTP POST handler - thin wrapper around extractDocuments
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const result = await extractDocuments(params.id);

  if (!result.success) {
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json(result);
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
