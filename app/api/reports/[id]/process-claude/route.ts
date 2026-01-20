/**
 * Claude Business Valuation Processing Route - Phase 2: Final Valuation
 *
 * This API route generates the final valuation report using pre-extracted document data.
 * It uses the Anthropic Skills API with the business-valuation-expert skill.
 *
 * The core valuation logic is in lib/valuation.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processValuation } from '@/lib/valuation';

// Initialize Supabase client for status checks
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Vercel Pro allows up to 5 minutes for serverless functions
export const maxDuration = 300;

/**
 * HTTP POST handler - thin wrapper around processValuation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const result = await processValuation(params.id);

  if (!result.success) {
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json(result);
}

/**
 * GET handler for checking processing status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const reportId = params.id;

  const { data: report, error } = await supabase
    .from('reports')
    .select('report_status, processing_progress, processing_message, error_message')
    .eq('id', reportId)
    .single();

  if (error || !report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  return NextResponse.json({
    status: report.report_status,
    progress: report.processing_progress || 0,
    message: report.processing_message || '',
    error: report.error_message,
  });
}
