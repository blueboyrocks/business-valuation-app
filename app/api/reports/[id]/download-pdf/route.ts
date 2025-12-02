import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { BizEquityPDFGenerator } from '@/lib/pdf/bizequity-pdf-generator';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Generate a professional PDF report using Puppeteer
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const reportId = params.id;
  console.log(`[PDF] Generating PDF for report ${reportId}`);

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

    // Fetch report data
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (reportError || !report) {
      console.error('[PDF] Report not found:', reportError);
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (report.report_status !== 'completed') {
      return NextResponse.json({ error: 'Report not completed yet' }, { status: 400 });
    }

    // Generate PDF
    const reportData = report.report_data || {};
    const generatedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    console.log('[PDF] Generating BizEquity-style PDF...');
    const generator = new BizEquityPDFGenerator();
    const pdfBuffer = await generator.generate(report.company_name, reportData, generatedDate);

    console.log(`[PDF] PDF generated successfully (${pdfBuffer.length} bytes)`);

    // Return PDF as response
    const filename = `${report.company_name.replace(/[^a-z0-9]/gi, '_')}_Valuation_Report.pdf`;
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error: any) {
    console.error('[PDF] Generation error:', error);
    return NextResponse.json(
      { error: 'PDF generation failed', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for direct PDF download (alternative to POST)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return POST(request, { params });
}
