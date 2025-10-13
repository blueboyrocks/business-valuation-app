import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const reportId = params.id;

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

    const typedReport = report as any;

    let progressPercentage = 0;
    let estimatedTimeRemaining = null;

    if (typedReport.report_status === 'pending') {
      progressPercentage = 0;
      estimatedTimeRemaining = '10-15 minutes';
    } else if (typedReport.report_status === 'processing') {
      if (typedReport.processing_started_at) {
        const startTime = new Date(typedReport.processing_started_at).getTime();
        const now = Date.now();
        const elapsed = now - startTime;
        const estimatedTotal = 10 * 60 * 1000;

        progressPercentage = Math.min(95, Math.floor((elapsed / estimatedTotal) * 100));

        const remaining = estimatedTotal - elapsed;
        if (remaining > 0) {
          const minutesRemaining = Math.ceil(remaining / 60000);
          estimatedTimeRemaining = `${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}`;
        } else {
          estimatedTimeRemaining = 'Almost done...';
        }
      } else {
        progressPercentage = 10;
        estimatedTimeRemaining = '10-15 minutes';
      }
    } else if (typedReport.report_status === 'completed') {
      progressPercentage = 100;
      estimatedTimeRemaining = null;
    } else if (typedReport.report_status === 'failed') {
      progressPercentage = 0;
      estimatedTimeRemaining = null;
    }

    return NextResponse.json({
      reportId: typedReport.id,
      status: typedReport.report_status,
      progressPercentage,
      estimatedTimeRemaining,
      companyName: typedReport.company_name,
      valuationAmount: typedReport.valuation_amount,
      valuationMethod: typedReport.valuation_method,
      errorMessage: typedReport.error_message,
      createdAt: typedReport.created_at,
      processingStartedAt: typedReport.processing_started_at,
      processingCompletedAt: typedReport.processing_completed_at,
    });
  } catch (error) {
    console.error('Error in report status route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
