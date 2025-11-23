import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { Database } from '@/lib/supabase/types';
import { 
  generateRevenueChart,
  generateMarginChart,
  generateValuationWaterfallChart,
  generateApproachWeightingPieChart,
  generateRiskGaugeChart,
  generateBenchmarkingRadarChart
} from '@/lib/pdf/chartGenerator';
import { generateEnhancedReportHTML } from '@/lib/pdf/templateGenerator';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let browser;

  try {
    console.log('📄 [PDF EXPORT] Starting PDF generation for report:', params.id);
    
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

    if (typedReport.report_status !== 'completed') {
      return NextResponse.json(
        { error: 'Report is not completed yet' },
        { status: 400 }
      );
    }

    console.log('📊 [PDF EXPORT] Generating charts...');
    
    // Extract report data
    const reportData = typedReport.report_data || {};
    const financial = reportData.financial_analysis || {};
    const historicalData = financial.historical_financial_data || [];
    const approaches = reportData.valuation_approaches || {};
    const reconciliation = reportData.valuation_reconciliation || {};
    const riskAssessment = reportData.risk_assessment || {};
    const benchmarking = reportData.industry_benchmarking || {};

    // Generate all charts
    const charts: any = {};

    try {
      // Revenue and EBITDA trend chart
      if (historicalData.length > 0) {
        console.log('  📈 Generating revenue chart...');
        const revenueBuffer = await generateRevenueChart(historicalData);
        charts.revenue = revenueBuffer.toString('base64');
      }

      // Margin analysis chart
      if (historicalData.length > 0) {
        console.log('  📈 Generating margin chart...');
        const marginBuffer = await generateMarginChart(historicalData);
        charts.margins = marginBuffer.toString('base64');
      }

      // Valuation waterfall chart
      if (approaches.asset_approach || approaches.income_approach || approaches.market_approach) {
        console.log('  📈 Generating waterfall chart...');
        const waterfallBuffer = await generateValuationWaterfallChart(approaches);
        charts.waterfall = waterfallBuffer.toString('base64');
      }

      // Approach weighting pie chart
      if (reconciliation.approach_weighting && reconciliation.approach_weighting.length > 0) {
        console.log('  📈 Generating weighting chart...');
        const weightingBuffer = await generateApproachWeightingPieChart(reconciliation);
        charts.weighting = weightingBuffer.toString('base64');
      }

      // Risk gauge chart
      if (riskAssessment.overall_risk_score !== undefined) {
        console.log('  📈 Generating risk chart...');
        const riskBuffer = await generateRiskGaugeChart(riskAssessment.overall_risk_score);
        charts.risk = riskBuffer.toString('base64');
      }

      // Benchmarking radar chart
      if (benchmarking.industry_percentile_rankings) {
        console.log('  📈 Generating benchmarking chart...');
        const benchmarkingBuffer = await generateBenchmarkingRadarChart(benchmarking);
        charts.benchmarking = benchmarkingBuffer.toString('base64');
      }

      console.log('✅ [PDF EXPORT] Charts generated successfully');
    } catch (chartError) {
      console.error('⚠️ [PDF EXPORT] Error generating charts:', chartError);
      // Continue without charts - they're optional
    }

    console.log('📝 [PDF EXPORT] Generating HTML template...');
    
    // Generate HTML with enhanced template
    const htmlContent = generateEnhancedReportHTML({
      report: typedReport,
      reportData,
      charts
    });

    console.log('🌐 [PDF EXPORT] Launching browser...');
    
    // Use different configurations for local development vs serverless
    const isLocal = process.env.NODE_ENV === 'development' || !process.env.VERCEL;
    
    browser = await puppeteer.launch({
      args: isLocal ? [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ] : chromium.args,
      executablePath: isLocal 
        ? process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser'
        : await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();

    console.log('📄 [PDF EXPORT] Setting content...');
    
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    console.log('🖨️ [PDF EXPORT] Generating PDF...');
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm',
      },
      printBackground: true,
      preferCSSPageSize: true,
    });

    await browser.close();

    console.log('✅ [PDF EXPORT] PDF generated successfully');

    const fileName = `${typedReport.company_name.replace(/[^a-z0-9]/gi, '_')}_Valuation_Report.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('❌ [PDF EXPORT] Error generating PDF:', error);

    if (browser) {
      await browser.close();
    }

    return NextResponse.json(
      { 
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
