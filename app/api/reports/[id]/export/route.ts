import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import puppeteer from 'puppeteer';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id;
    console.log(`[EXPORT] Starting PDF export for report ${reportId}`);

    // Get report data from database
    const supabase = await createClient();
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

    if (report.status !== 'completed') {
      console.error('[EXPORT] Report not completed yet');
      return NextResponse.json(
        { error: 'Report is not completed yet' },
        { status: 400 }
      );
    }

    const reportData = report.report_data;
    console.log('[EXPORT] Report data retrieved, generating PDF...');

    // Generate HTML content for PDF
    const htmlContent = generateReportHTML(report.company_name, reportData);

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    });

    await browser.close();

    console.log('[EXPORT] PDF generated successfully');

    // Return PDF as downloadable file
    const fileName = `${report.company_name.replace(/[^a-z0-9]/gi, '_')}_Valuation_Report.pdf`;
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error('[EXPORT] Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

function generateReportHTML(companyName: string, reportData: any): string {
  const {
    estimated_value,
    value_range_low,
    value_range_high,
    valuation_method,
    valuation_standard,
    confidence_level,
    valuation_premise,
    company_overview,
    purpose_of_valuation,
    scope_of_analysis,
    key_findings_and_value_conclusion,
    primary_value_drivers,
    critical_risk_factors,
    methodology_summary_and_conclusion,
    business_description,
    products_services_and_revenue_streams,
    target_markets_and_customers,
    competitive_advantages,
    management_and_operations,
    key_success_factors,
    historical_financial_performance,
    revenue_and_profitability_analysis,
    cash_flow_and_working_capital,
    financial_projections_and_assumptions,
    valuation_approaches_overview,
    detailed_valuation_calculations,
    final_value_conclusion_and_reconciliation,
    key_risks_and_challenges,
    risk_mitigation_strategies,
    market_position_and_competitive_landscape,
    growth_opportunities,
    value_enhancement_recommendations,
    strategic_considerations,
  } = reportData;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Business Valuation Report - ${companyName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1a1a1a;
      background: white;
    }
    
    .cover-page {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      page-break-after: always;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
    }
    
    .cover-page h1 {
      font-size: 48pt;
      margin-bottom: 20px;
      font-weight: 700;
    }
    
    .cover-page h2 {
      font-size: 32pt;
      margin-bottom: 40px;
      font-weight: 400;
    }
    
    .cover-page .value-box {
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      padding: 30px 60px;
      border-radius: 10px;
      margin: 40px 0;
    }
    
    .cover-page .value {
      font-size: 56pt;
      font-weight: 700;
      margin: 10px 0;
    }
    
    .cover-page .date {
      font-size: 14pt;
      margin-top: 40px;
      opacity: 0.9;
    }
    
    .content {
      padding: 40px;
    }
    
    h1 {
      font-size: 24pt;
      color: #667eea;
      margin-top: 30px;
      margin-bottom: 15px;
      page-break-after: avoid;
    }
    
    h2 {
      font-size: 18pt;
      color: #764ba2;
      margin-top: 25px;
      margin-bottom: 12px;
      page-break-after: avoid;
    }
    
    h3 {
      font-size: 14pt;
      color: #555;
      margin-top: 20px;
      margin-bottom: 10px;
      page-break-after: avoid;
    }
    
    p {
      margin-bottom: 12px;
      text-align: justify;
    }
    
    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    
    .highlight-box {
      background: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 20px;
      margin: 20px 0;
      page-break-inside: avoid;
    }
    
    .value-summary {
      background: #667eea;
      color: white;
      padding: 25px;
      border-radius: 8px;
      margin: 30px 0;
      page-break-inside: avoid;
    }
    
    .value-summary h2 {
      color: white;
      margin-top: 0;
    }
    
    .value-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-top: 15px;
    }
    
    .value-item {
      background: rgba(255, 255, 255, 0.1);
      padding: 12px;
      border-radius: 5px;
    }
    
    .value-item label {
      font-size: 9pt;
      opacity: 0.9;
      display: block;
      margin-bottom: 5px;
    }
    
    .value-item .value {
      font-size: 16pt;
      font-weight: 700;
    }
    
    .page-break {
      page-break-before: always;
    }
    
    footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 9pt;
      color: #666;
      padding: 10px;
      border-top: 1px solid #ddd;
    }
    
    @page {
      margin: 20mm 15mm;
    }
    
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover-page">
    <h1>Business Valuation Report</h1>
    <h2>${companyName}</h2>
    <div class="value-box">
      <div style="font-size: 14pt; opacity: 0.9;">Estimated Value</div>
      <div class="value">${formatCurrency(estimated_value)}</div>
      <div style="font-size: 12pt; margin-top: 10px;">
        Range: ${formatCurrency(value_range_low)} - ${formatCurrency(value_range_high)}
      </div>
    </div>
    <div class="date">Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
  </div>

  <!-- Content -->
  <div class="content">
    <!-- Valuation Summary -->
    <div class="value-summary">
      <h2>Valuation Summary</h2>
      <div class="value-grid">
        <div class="value-item">
          <label>Estimated Value</label>
          <div class="value">${formatCurrency(estimated_value)}</div>
        </div>
        <div class="value-item">
          <label>Value Range</label>
          <div class="value">${formatCurrency(value_range_low)} - ${formatCurrency(value_range_high)}</div>
        </div>
        <div class="value-item">
          <label>Valuation Method</label>
          <div class="value" style="font-size: 12pt;">${valuation_method || 'N/A'}</div>
        </div>
        <div class="value-item">
          <label>Standard</label>
          <div class="value" style="font-size: 12pt;">${valuation_standard || 'N/A'}</div>
        </div>
        <div class="value-item">
          <label>Confidence Level</label>
          <div class="value" style="font-size: 12pt;">${confidence_level || 'N/A'}</div>
        </div>
        <div class="value-item">
          <label>Premise</label>
          <div class="value" style="font-size: 12pt;">${valuation_premise || 'N/A'}</div>
        </div>
      </div>
    </div>

    <!-- Executive Summary -->
    <div class="page-break"></div>
    <h1>Executive Summary</h1>
    
    <div class="section">
      <h2>Company Overview</h2>
      <p>${company_overview || 'N/A'}</p>
    </div>
    
    <div class="section">
      <h2>Purpose of Valuation</h2>
      <p>${purpose_of_valuation || 'N/A'}</p>
    </div>
    
    <div class="section">
      <h2>Scope of Analysis</h2>
      <p>${scope_of_analysis || 'N/A'}</p>
    </div>
    
    <div class="section">
      <h2>Key Findings and Value Conclusion</h2>
      <p>${key_findings_and_value_conclusion || 'N/A'}</p>
    </div>
    
    <div class="highlight-box">
      <h3>Primary Value Drivers</h3>
      <p>${primary_value_drivers || 'N/A'}</p>
    </div>
    
    <div class="highlight-box">
      <h3>Critical Risk Factors</h3>
      <p>${critical_risk_factors || 'N/A'}</p>
    </div>
    
    <div class="section">
      <h2>Methodology Summary and Conclusion</h2>
      <p>${methodology_summary_and_conclusion || 'N/A'}</p>
    </div>

    <!-- Company Profile -->
    <div class="page-break"></div>
    <h1>Company Profile</h1>
    
    <div class="section">
      <h2>Business Description</h2>
      <p>${business_description || 'N/A'}</p>
    </div>
    
    <div class="section">
      <h2>Products, Services, and Revenue Streams</h2>
      <p>${products_services_and_revenue_streams || 'N/A'}</p>
    </div>
    
    <div class="section">
      <h2>Target Markets and Customers</h2>
      <p>${target_markets_and_customers || 'N/A'}</p>
    </div>
    
    <div class="section">
      <h2>Competitive Advantages</h2>
      <p>${competitive_advantages || 'N/A'}</p>
    </div>
    
    <div class="section">
      <h2>Management and Operations</h2>
      <p>${management_and_operations || 'N/A'}</p>
    </div>
    
    <div class="section">
      <h2>Key Success Factors</h2>
      <p>${key_success_factors || 'N/A'}</p>
    </div>

    <!-- Financial Analysis -->
    <div class="page-break"></div>
    <h1>Financial Analysis</h1>
    
    <div class="section">
      <h2>Historical Financial Performance</h2>
      <p>${historical_financial_performance || 'N/A'}</p>
    </div>
    
    <div class="section">
      <h2>Revenue and Profitability Analysis</h2>
      <p>${revenue_and_profitability_analysis || 'N/A'}</p>
    </div>
    
    <div class="section">
      <h2>Cash Flow and Working Capital</h2>
      <p>${cash_flow_and_working_capital || 'N/A'}</p>
    </div>
    
    <div class="section">
      <h2>Financial Projections and Assumptions</h2>
      <p>${financial_projections_and_assumptions || 'N/A'}</p>
    </div>

    <!-- Valuation Analysis -->
    <div class="page-break"></div>
    <h1>Valuation Analysis</h1>
    
    <div class="section">
      <h2>Valuation Approaches Overview</h2>
      <p>${valuation_approaches_overview || 'N/A'}</p>
    </div>
    
    <div class="section">
      <h2>Detailed Valuation Calculations</h2>
      <p>${detailed_valuation_calculations || 'N/A'}</p>
    </div>
    
    <div class="section">
      <h2>Final Value Conclusion and Reconciliation</h2>
      <p>${final_value_conclusion_and_reconciliation || 'N/A'}</p>
    </div>

    <!-- Risk Assessment -->
    <div class="page-break"></div>
    <h1>Risk Assessment</h1>
    
    <div class="section">
      <h2>Key Risks and Challenges</h2>
      <p>${key_risks_and_challenges || 'N/A'}</p>
    </div>
    
    <div class="section">
      <h2>Risk Mitigation Strategies</h2>
      <p>${risk_mitigation_strategies || 'N/A'}</p>
    </div>

    <!-- Strategic Insights & Recommendations -->
    <div class="page-break"></div>
    <h1>Strategic Insights & Recommendations</h1>
    
    <div class="section">
      <h2>Market Position and Competitive Landscape</h2>
      <p>${market_position_and_competitive_landscape || 'N/A'}</p>
    </div>
    
    <div class="section">
      <h2>Growth Opportunities</h2>
      <p>${growth_opportunities || 'N/A'}</p>
    </div>
    
    <div class="section">
      <h2>Value Enhancement Recommendations</h2>
      <p>${value_enhancement_recommendations || 'N/A'}</p>
    </div>
    
    <div class="section">
      <h2>Strategic Considerations</h2>
      <p>${strategic_considerations || 'N/A'}</p>
    </div>
  </div>
</body>
</html>
  `;
}
