import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id;
    console.log(`[EXPORT] Fetching report data for ${reportId}`);

    // Get report data from database using service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: report, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error || !report) {
      console.error('[EXPORT] Report not found:', error);
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    if (report.report_status !== 'completed') {
      console.error('[EXPORT] Report not completed yet');
      return NextResponse.json(
        { error: 'Report is not completed yet' },
        { status: 400 }
      );
    }

    console.log('[EXPORT] Report data retrieved successfully');

    // Return report data as JSON for client-side PDF generation
    return NextResponse.json({
      company_name: report.company_name,
      report_data: report.report_data,
      created_at: report.created_at,
    });

  } catch (error) {
    console.error('[EXPORT] Error fetching report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report data' },
      { status: 500 }
    );
  }
}
