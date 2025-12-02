import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Update a specific section of a report
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const reportId = params.id;

  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { sectionName, content } = body;

    if (!sectionName || content === undefined) {
      return NextResponse.json(
        { error: 'Missing sectionName or content' },
        { status: 400 }
      );
    }

    // Fetch current report
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('report_data, user_id')
      .eq('id', reportId)
      .maybeSingle();

    if (fetchError || !report) {
      console.error('[UPDATE] Report not found:', fetchError);
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Verify ownership
    if (report.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update the specific section
    const updatedReportData = {
      ...report.report_data,
      [sectionName]: content,
    };

    // Save back to database
    const { error: updateError } = await supabase
      .from('reports')
      .update({
        report_data: updatedReportData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    if (updateError) {
      console.error('[UPDATE] Failed to update report:', updateError);
      return NextResponse.json(
        { error: 'Failed to update report' },
        { status: 500 }
      );
    }

    console.log(`[UPDATE] Successfully updated ${sectionName} for report ${reportId}`);

    return NextResponse.json({
      success: true,
      message: 'Section updated successfully',
    });

  } catch (error: any) {
    console.error('[UPDATE] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
