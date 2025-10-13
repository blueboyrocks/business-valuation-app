import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';
import { Database } from '@/lib/supabase/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let browser;

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

    if (typedReport.report_status !== 'completed') {
      return NextResponse.json(
        { error: 'Report is not completed yet' },
        { status: 400 }
      );
    }

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    const htmlContent = generateReportHTML(typedReport);

    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
      printBackground: true,
    });

    await browser.close();

    const fileName = `${typedReport.company_name.replace(/[^a-z0-9]/gi, '_')}_Valuation_Report.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);

    if (browser) {
      await browser.close();
    }

    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

function generateReportHTML(report: any): string {
  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';
    return `${value.toFixed(2)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const reportData = report.report_data || {};

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            line-height: 1.6;
            color: #1e293b;
            font-size: 11pt;
          }
          .header {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            padding: 40px 30px;
            margin-bottom: 30px;
          }
          .company-name {
            font-size: 32pt;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .report-title {
            font-size: 18pt;
            opacity: 0.95;
            margin-bottom: 20px;
          }
          .report-meta {
            font-size: 10pt;
            opacity: 0.9;
          }
          .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          .section-title {
            font-size: 16pt;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e2e8f0;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 30px;
          }
          .summary-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
          }
          .summary-card-label {
            font-size: 10pt;
            color: #64748b;
            margin-bottom: 8px;
          }
          .summary-card-value {
            font-size: 20pt;
            font-weight: bold;
            color: #1e293b;
          }
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 20px;
          }
          .metric-item {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 15px;
          }
          .metric-label {
            font-size: 9pt;
            color: #64748b;
            margin-bottom: 5px;
          }
          .metric-value {
            font-size: 14pt;
            font-weight: bold;
            color: #1e293b;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th {
            background: #f1f5f9;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            border-bottom: 2px solid #cbd5e1;
            font-size: 10pt;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 10pt;
          }
          .executive-summary {
            background: #f8fafc;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin-bottom: 30px;
            line-height: 1.8;
          }
          .risk-item {
            background: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 4px;
          }
          .risk-high {
            background: #fef2f2;
            border-left-color: #ef4444;
          }
          .risk-medium {
            background: #fffbeb;
            border-left-color: #f59e0b;
          }
          .risk-low {
            background: #f0f9ff;
            border-left-color: #3b82f6;
          }
          .risk-title {
            font-weight: bold;
            margin-bottom: 5px;
          }
          .finding-item {
            margin-bottom: 12px;
            padding-left: 20px;
            position: relative;
          }
          .finding-item:before {
            content: '•';
            position: absolute;
            left: 5px;
            color: #3b82f6;
            font-weight: bold;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            font-size: 9pt;
            color: #64748b;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">${report.company_name}</div>
          <div class="report-title">Business Valuation Report</div>
          <div class="report-meta">
            Generated: ${formatDate(report.created_at)} |
            Method: ${report.valuation_method || 'Comprehensive Analysis'}
          </div>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-card-label">Estimated Value</div>
            <div class="summary-card-value">${formatCurrency(report.valuation_amount)}</div>
          </div>
          <div class="summary-card">
            <div class="summary-card-label">Valuation Method</div>
            <div class="summary-card-value" style="font-size: 14pt;">${report.valuation_method || 'N/A'}</div>
          </div>
          <div class="summary-card">
            <div class="summary-card-label">Report Status</div>
            <div class="summary-card-value" style="font-size: 14pt;">Completed</div>
          </div>
        </div>

        ${report.executive_summary ? `
        <div class="section">
          <div class="section-title">Executive Summary</div>
          <div class="executive-summary">
            ${report.executive_summary.replace(/\n/g, '<br>')}
          </div>
        </div>
        ` : ''}

        ${reportData.financial_metrics ? `
        <div class="section">
          <div class="section-title">Financial Metrics</div>
          <div class="metrics-grid">
            ${reportData.financial_metrics.revenue ? `
            <div class="metric-item">
              <div class="metric-label">Annual Revenue</div>
              <div class="metric-value">${formatCurrency(reportData.financial_metrics.revenue)}</div>
            </div>
            ` : ''}
            ${reportData.financial_metrics.ebitda ? `
            <div class="metric-item">
              <div class="metric-label">EBITDA</div>
              <div class="metric-value">${formatCurrency(reportData.financial_metrics.ebitda)}</div>
            </div>
            ` : ''}
            ${reportData.financial_metrics.net_income ? `
            <div class="metric-item">
              <div class="metric-label">Net Income</div>
              <div class="metric-value">${formatCurrency(reportData.financial_metrics.net_income)}</div>
            </div>
            ` : ''}
            ${reportData.financial_metrics.profit_margin ? `
            <div class="metric-item">
              <div class="metric-label">Profit Margin</div>
              <div class="metric-value">${formatPercentage(reportData.financial_metrics.profit_margin)}</div>
            </div>
            ` : ''}
            ${reportData.financial_metrics.revenue_growth ? `
            <div class="metric-item">
              <div class="metric-label">Revenue Growth</div>
              <div class="metric-value">${formatPercentage(reportData.financial_metrics.revenue_growth)}</div>
            </div>
            ` : ''}
            ${reportData.financial_metrics.assets ? `
            <div class="metric-item">
              <div class="metric-label">Total Assets</div>
              <div class="metric-value">${formatCurrency(reportData.financial_metrics.assets)}</div>
            </div>
            ` : ''}
          </div>
        </div>
        ` : ''}

        ${reportData.valuation_methods && reportData.valuation_methods.length > 0 ? `
        <div class="section">
          <div class="section-title">Valuation Methods</div>
          ${reportData.valuation_methods.map((method: any) => `
            <div class="metric-item" style="margin-bottom: 15px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <strong>${method.method_name}</strong>
                <strong>${formatCurrency(method.estimated_value)}</strong>
              </div>
              ${method.description ? `<p style="margin-bottom: 8px; color: #64748b;">${method.description}</p>` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${reportData.comparable_companies && reportData.comparable_companies.length > 0 ? `
        <div class="section">
          <div class="section-title">Comparable Companies</div>
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th style="text-align: right;">Revenue</th>
                <th style="text-align: right;">Multiple</th>
                <th style="text-align: right;">Industry</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.comparable_companies.map((company: any) => `
                <tr>
                  <td>${company.name}</td>
                  <td style="text-align: right;">${formatCurrency(company.revenue)}</td>
                  <td style="text-align: right;">${company.multiple ? company.multiple.toFixed(2) + 'x' : 'N/A'}</td>
                  <td style="text-align: right;">${company.industry}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        ${reportData.risk_factors && reportData.risk_factors.length > 0 ? `
        <div class="section">
          <div class="section-title">Risk Assessment</div>
          ${reportData.risk_factors.map((risk: any) => `
            <div class="risk-item risk-${risk.severity || 'medium'}">
              <div class="risk-title">${risk.category} - ${risk.severity ? risk.severity.toUpperCase() : 'MEDIUM'}</div>
              <div>${risk.description}</div>
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${reportData.key_findings && reportData.key_findings.length > 0 ? `
        <div class="section">
          <div class="section-title">Key Findings</div>
          ${reportData.key_findings.map((finding: string) => `
            <div class="finding-item">${finding}</div>
          `).join('')}
        </div>
        ` : ''}

        ${reportData.recommendations && reportData.recommendations.length > 0 ? `
        <div class="section">
          <div class="section-title">Recommendations</div>
          ${reportData.recommendations.map((rec: string) => `
            <div class="finding-item">${rec}</div>
          `).join('')}
        </div>
        ` : ''}

        <div class="footer">
          <p>This report was generated using AI-powered business valuation analysis.</p>
          <p>For questions or additional analysis, please contact your valuation specialist.</p>
        </div>
      </body>
    </html>
  `;
}
