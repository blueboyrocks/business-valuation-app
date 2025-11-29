import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';
import { renderToString } from 'react-dom/server';
import { PDFReportTemplate } from '@/components/PDFReportTemplate';
import fs from 'fs';
import path from 'path';

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
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (report.report_status !== 'completed') {
      return NextResponse.json({ error: 'Report not completed yet' }, { status: 400 });
    }

    // Render React component to HTML
    const reportData = report.report_data || {};
    const generatedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    console.log('[PDF] Rendering React component to HTML...');
    const componentHTML = renderToString(
      PDFReportTemplate({
        reportData,
        companyName: report.company_name,
        generatedDate
      })
    );

    // Load CSS
    const cssPath = path.join(process.cwd(), 'styles', 'pdf-report.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    // Create full HTML document
    const fullHTML = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${report.company_name} - Business Valuation Report</title>
          <style>
            ${cssContent}
          </style>
        </head>
        <body>
          ${componentHTML}
        </body>
      </html>
    `;

    console.log('[PDF] Launching Puppeteer...');
    
    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
    });

    const page = await browser.newPage();
    
    console.log('[PDF] Setting page content...');
    await page.setContent(fullHTML, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    console.log('[PDF] Generating PDF...');
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 9px; text-align: center; width: 100%; color: #64748b; padding: 0 0.5in;">
          <span>${report.company_name} - Business Valuation Report</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 9px; text-align: center; width: 100%; color: #64748b; padding: 0 0.5in;">
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
          <span style="margin-left: 20px;">Confidential</span>
        </div>
      `,
    });

    await browser.close();

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
