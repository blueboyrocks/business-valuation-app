import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Report = Database['public']['Tables']['reports']['Row'];
type Document = Database['public']['Tables']['documents']['Row'];

interface AnalysisRequest {
  reportId: string;
}

export async function POST(request: NextRequest) {
  console.log('🔬 [ANALYZE] Starting analysis request');
  try {
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json() as AnalysisRequest;
    const { reportId } = body;

    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

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

    const { data: documents, error: documentsError } = await supabase
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

    console.log(`✓ [ANALYZE] Found ${documents.length} documents`);

    // Update report status to processing
    await supabase
      .from('reports')
      .update({
        report_status: 'processing',
        processing_started_at: new Date().toISOString(),
      } as any)
      .eq('id', reportId);

    console.log(`✓ [ANALYZE] Report ${reportId} marked as processing`);

    // NOTE: Claude processing is triggered by the frontend calling /api/reports/[id]/process-claude
    // The frontend will poll the process-claude endpoint which runs the 6-pass valuation pipeline
    // This approach leverages Claude's native PDF understanding for document analysis

    return NextResponse.json({
      success: true,
      message: 'Analysis started. Frontend will call /api/reports/[id]/process-claude to continue.',
      reportId,
    });
  } catch (error) {
    console.error('Error in analyze-documents route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
