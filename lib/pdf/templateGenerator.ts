export interface PDFData {
  report: any;
  reportData: any;
  charts: {
    revenue?: string;
    margins?: string;
    waterfall?: string;
    weighting?: string;
    risk?: string;
    benchmarking?: string;
  };
}

export function generateEnhancedReportHTML(data: PDFData): string {
  const { report, reportData, charts } = data;

  const formatCurrency = (amount: number | null | undefined) => {
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

  const formatNumber = (num: number | null | undefined) => {
    if (!num) return 'N/A';
    return new Intl.NumberFormat('en-US').format(num);
  };

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
          
          @page {
            size: A4;
            margin: 0;
          }
          
          body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            line-height: 1.6;
            color: #1e293b;
            font-size: 10pt;
          }
          
          .page {
            page-break-after: always;
            padding: 40px 50px;
            min-height: 297mm;
            position: relative;
          }
          
          .page:last-child {
            page-break-after: auto;
          }
          
          /* Cover Page */
          .cover-page {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #0ea5e9 100%);
            color: white;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: 80px 50px;
          }
          
          .cover-logo {
            font-size: 48pt;
            font-weight: bold;
            margin-bottom: 60px;
            letter-spacing: 2px;
          }
          
          .cover-title {
            font-size: 42pt;
            font-weight: bold;
            margin-bottom: 20px;
            line-height: 1.2;
          }
          
          .cover-subtitle {
            font-size: 24pt;
            opacity: 0.9;
            margin-bottom: 60px;
          }
          
          .cover-meta {
            font-size: 14pt;
            opacity: 0.85;
            margin-top: 40px;
          }
          
          .cover-confidential {
            position: absolute;
            bottom: 40px;
            font-size: 12pt;
            opacity: 0.7;
          }
          
          /* Header */
          .header {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            padding: 30px 40px;
            margin: -40px -50px 30px -50px;
          }
          
          .company-name {
            font-size: 28pt;
            font-weight: bold;
            margin-bottom: 8px;
          }
          
          .report-title {
            font-size: 16pt;
            opacity: 0.95;
            margin-bottom: 15px;
          }
          
          .report-meta {
            font-size: 9pt;
            opacity: 0.9;
          }
          
          /* Sections */
          .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          
          .section-title {
            font-size: 18pt;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 3px solid #3b82f6;
          }
          
          .subsection-title {
            font-size: 14pt;
            font-weight: bold;
            color: #334155;
            margin: 20px 0 10px 0;
          }
          
          /* Summary Cards */
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 30px;
          }
          
          .summary-card {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border: 2px solid #cbd5e1;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
          }
          
          .summary-card-label {
            font-size: 9pt;
            color: #64748b;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .summary-card-value {
            font-size: 20pt;
            font-weight: bold;
            color: #1e293b;
          }
          
          .summary-card-highlight {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            border-color: #3b82f6;
          }
          
          .summary-card-highlight .summary-card-value {
            color: #1e40af;
          }
          
          /* Executive Summary */
          .executive-summary {
            background: #f8fafc;
            border-left: 5px solid #3b82f6;
            padding: 25px;
            margin-bottom: 30px;
            line-height: 1.8;
            border-radius: 8px;
          }
          
          /* Metrics Grid */
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 20px;
          }
          
          .metric-item {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .metric-label {
            font-size: 9pt;
            color: #64748b;
            font-weight: 600;
          }
          
          .metric-value {
            font-size: 13pt;
            font-weight: bold;
            color: #1e293b;
          }
          
          /* Tables */
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            background: white;
          }
          
          th {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            font-size: 9pt;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 9pt;
          }
          
          tr:last-child td {
            border-bottom: none;
          }
          
          tr:nth-child(even) {
            background: #f8fafc;
          }
          
          .table-total {
            font-weight: bold;
            background: #e0f2fe !important;
            border-top: 2px solid #3b82f6;
          }
          
          /* Charts */
          .chart-container {
            margin: 20px 0;
            text-align: center;
            page-break-inside: avoid;
          }
          
          .chart-image {
            max-width: 100%;
            height: auto;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px;
            background: white;
          }
          
          /* Risk Items */
          .risk-item {
            padding: 15px;
            margin-bottom: 12px;
            border-radius: 8px;
            border-left: 5px solid;
            page-break-inside: avoid;
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
            font-size: 10pt;
          }
          
          .risk-description {
            font-size: 9pt;
            line-height: 1.6;
          }
          
          /* Findings & Recommendations */
          .finding-item {
            margin-bottom: 15px;
            padding-left: 25px;
            position: relative;
            page-break-inside: avoid;
          }
          
          .finding-item:before {
            content: '●';
            position: absolute;
            left: 5px;
            color: #3b82f6;
            font-weight: bold;
            font-size: 12pt;
          }
          
          /* Highlight Boxes */
          .highlight-box {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            border: 2px solid #3b82f6;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            page-break-inside: avoid;
          }
          
          .highlight-box-title {
            font-size: 14pt;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 10px;
          }
          
          /* Footer */
          .footer {
            position: absolute;
            bottom: 20px;
            left: 50px;
            right: 50px;
            padding-top: 15px;
            border-top: 1px solid #e2e8f0;
            font-size: 8pt;
            color: #64748b;
            display: flex;
            justify-content: space-between;
          }
          
          /* Page Numbers */
          .page-number {
            text-align: right;
          }
          
          /* Disclaimer */
          .disclaimer {
            background: #fef3c7;
            border: 2px solid #f59e0b;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
            font-size: 8pt;
            line-height: 1.6;
          }
          
          .disclaimer-title {
            font-weight: bold;
            font-size: 10pt;
            margin-bottom: 10px;
            color: #92400e;
          }
        </style>
      </head>
      <body>
        <!-- Cover Page -->
        <div class="page cover-page">
          <div class="cover-logo">VALUATION REPORT</div>
          <div class="cover-title">${report.company_name || 'Business Valuation'}</div>
          <div class="cover-subtitle">Comprehensive Business Valuation Analysis</div>
          <div class="cover-meta">
            Report Date: ${formatDate(report.created_at)}<br>
            Valuation Method: ${report.valuation_method || 'Multi-Approach Analysis'}
          </div>
          <div class="cover-confidential">
            CONFIDENTIAL & PROPRIETARY<br>
            This report contains confidential information
          </div>
        </div>

        <!-- Executive Summary Page -->
        <div class="page">
          <div class="header">
            <div class="company-name">${report.company_name}</div>
            <div class="report-title">Executive Summary</div>
            <div class="report-meta">
              Generated: ${formatDate(report.created_at)} | 
              Method: ${report.valuation_method || 'Comprehensive Analysis'}
            </div>
          </div>

          <div class="summary-grid">
            <div class="summary-card summary-card-highlight">
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

          ${report.executive_summary || reportData.executive_summary ? `
          <div class="executive-summary">
            <strong style="font-size: 12pt; display: block; margin-bottom: 10px;">Executive Summary</strong>
            ${(report.executive_summary || reportData.executive_summary || '').replace(/\n/g, '<br>')}
          </div>
          ` : ''}

          ${reportData.valuation_conclusion ? `
          <div class="highlight-box">
            <div class="highlight-box-title">Valuation Conclusion</div>
            <div style="font-size: 10pt; line-height: 1.7;">
              ${reportData.valuation_conclusion.conclusion_statement || 'N/A'}
            </div>
          </div>
          ` : ''}

          <div class="footer">
            <div>Confidential Business Valuation Report</div>
            <div class="page-number">Page 2</div>
          </div>
        </div>

        ${generateCompanyOverviewPage(reportData, report, formatCurrency, formatNumber)}
        ${generateFinancialAnalysisPage(reportData, report, charts, formatCurrency, formatPercentage)}
        ${generateValuationApproachesPage(reportData, charts, formatCurrency)}
        ${generateRiskAnalysisPage(reportData, charts)}
        ${generateBenchmarkingPage(reportData, charts, formatPercentage)}
        ${generateConclusionPage(reportData, report, formatCurrency)}
        ${generateDisclaimerPage()}
      </body>
    </html>
  `;
}

function generateCompanyOverviewPage(reportData: any, report: any, formatCurrency: Function, formatNumber: Function): string {
  const overview = reportData.company_overview || {};
  const financial = reportData.financial_analysis || {};
  
  return `
    <div class="page">
      <div class="header">
        <div class="company-name">${report.company_name}</div>
        <div class="report-title">Company Overview</div>
      </div>

      <div class="section">
        <div class="section-title">Business Profile</div>
        
        <div class="metrics-grid">
          ${overview.industry ? `
          <div class="metric-item">
            <div class="metric-label">Industry</div>
            <div class="metric-value">${overview.industry}</div>
          </div>
          ` : ''}
          
          ${overview.years_in_business ? `
          <div class="metric-item">
            <div class="metric-label">Years in Business</div>
            <div class="metric-value">${overview.years_in_business}</div>
          </div>
          ` : ''}
          
          ${overview.employee_count ? `
          <div class="metric-item">
            <div class="metric-label">Employees</div>
            <div class="metric-value">${formatNumber(overview.employee_count)}</div>
          </div>
          ` : ''}
          
          ${overview.location ? `
          <div class="metric-item">
            <div class="metric-label">Location</div>
            <div class="metric-value">${overview.location}</div>
          </div>
          ` : ''}
        </div>

        ${overview.business_description ? `
        <div style="margin-top: 20px;">
          <div class="subsection-title">Business Description</div>
          <p style="line-height: 1.8;">${overview.business_description}</p>
        </div>
        ` : ''}
      </div>

      ${financial.key_financial_metrics ? `
      <div class="section">
        <div class="section-title">Key Financial Metrics</div>
        <div class="metrics-grid">
          ${financial.key_financial_metrics.revenue ? `
          <div class="metric-item">
            <div class="metric-label">Annual Revenue</div>
            <div class="metric-value">${formatCurrency(financial.key_financial_metrics.revenue)}</div>
          </div>
          ` : ''}
          
          ${financial.key_financial_metrics.ebitda ? `
          <div class="metric-item">
            <div class="metric-label">EBITDA</div>
            <div class="metric-value">${formatCurrency(financial.key_financial_metrics.ebitda)}</div>
          </div>
          ` : ''}
          
          ${financial.key_financial_metrics.net_income ? `
          <div class="metric-item">
            <div class="metric-label">Net Income</div>
            <div class="metric-value">${formatCurrency(financial.key_financial_metrics.net_income)}</div>
          </div>
          ` : ''}
          
          ${financial.key_financial_metrics.total_assets ? `
          <div class="metric-item">
            <div class="metric-label">Total Assets</div>
            <div class="metric-value">${formatCurrency(financial.key_financial_metrics.total_assets)}</div>
          </div>
          ` : ''}
        </div>
      </div>
      ` : ''}

      <div class="footer">
        <div>Confidential Business Valuation Report</div>
        <div class="page-number">Page 3</div>
      </div>
    </div>
  `;
}

function generateFinancialAnalysisPage(reportData: any, report: any, charts: any, formatCurrency: Function, formatPercentage: Function): string {
  const financial = reportData.financial_analysis || {};
  const historical = financial.historical_financial_data || [];
  
  return `
    <div class="page">
      <div class="header">
        <div class="company-name">${report.company_name}</div>
        <div class="report-title">Financial Analysis</div>
      </div>

      <div class="section">
        <div class="section-title">Historical Financial Performance</div>
        
        ${charts.revenue ? `
        <div class="chart-container">
          <img src="data:image/png;base64,${charts.revenue}" class="chart-image" alt="Revenue Trend" />
        </div>
        ` : ''}

        ${historical.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Year</th>
              <th>Revenue</th>
              <th>EBITDA</th>
              <th>Net Income</th>
              <th>EBITDA Margin</th>
            </tr>
          </thead>
          <tbody>
            ${historical.map((year: any) => `
              <tr>
                <td><strong>${year.year}</strong></td>
                <td>${formatCurrency(year.revenue)}</td>
                <td>${formatCurrency(year.ebitda)}</td>
                <td>${formatCurrency(year.net_income)}</td>
                <td>${formatPercentage(year.ebitda_margin_percent)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}
      </div>

      ${charts.margins ? `
      <div class="section">
        <div class="section-title">Margin Analysis</div>
        <div class="chart-container">
          <img src="data:image/png;base64,${charts.margins}" class="chart-image" alt="Margin Trends" />
        </div>
      </div>
      ` : ''}

      <div class="footer">
        <div>Confidential Business Valuation Report</div>
        <div class="page-number">Page 4</div>
      </div>
    </div>
  `;
}

function generateValuationApproachesPage(reportData: any, charts: any, formatCurrency: Function): string {
  const approaches = reportData.valuation_approaches || {};
  
  return `
    <div class="page">
      <div class="header">
        <div class="company-name">Valuation Analysis</div>
        <div class="report-title">Valuation Approaches</div>
      </div>

      <div class="section">
        <div class="section-title">Valuation Methods Comparison</div>
        
        ${charts.waterfall ? `
        <div class="chart-container">
          <img src="data:image/png;base64,${charts.waterfall}" class="chart-image" alt="Valuation Approaches" />
        </div>
        ` : ''}

        <table>
          <thead>
            <tr>
              <th>Approach</th>
              <th>Method</th>
              <th>Indicated Value</th>
            </tr>
          </thead>
          <tbody>
            ${approaches.asset_approach ? `
            <tr>
              <td><strong>Asset Approach</strong></td>
              <td>Adjusted Net Asset Value</td>
              <td>${formatCurrency(approaches.asset_approach.adjusted_net_asset_value)}</td>
            </tr>
            ` : ''}
            
            ${approaches.income_approach ? `
            <tr>
              <td><strong>Income Approach</strong></td>
              <td>Discounted Cash Flow / Capitalization</td>
              <td>${formatCurrency(approaches.income_approach.income_approach_conclusion)}</td>
            </tr>
            ` : ''}
            
            ${approaches.market_approach ? `
            <tr>
              <td><strong>Market Approach</strong></td>
              <td>Comparable Company Analysis</td>
              <td>${formatCurrency(approaches.market_approach.weighted_market_value)}</td>
            </tr>
            ` : ''}
          </tbody>
        </table>
      </div>

      ${charts.weighting ? `
      <div class="section">
        <div class="section-title">Approach Weighting</div>
        <div class="chart-container">
          <img src="data:image/png;base64,${charts.weighting}" class="chart-image" alt="Approach Weighting" />
        </div>
      </div>
      ` : ''}

      <div class="footer">
        <div>Confidential Business Valuation Report</div>
        <div class="page-number">Page 5</div>
      </div>
    </div>
  `;
}

function generateRiskAnalysisPage(reportData: any, charts: any): string {
  const risks = reportData.risk_assessment || {};
  const riskFactors = risks.risk_factors || [];
  
  return `
    <div class="page">
      <div class="header">
        <div class="company-name">Risk Analysis</div>
        <div class="report-title">Risk Assessment</div>
      </div>

      ${charts.risk ? `
      <div class="section">
        <div class="section-title">Overall Risk Profile</div>
        <div class="chart-container">
          <img src="data:image/png;base64,${charts.risk}" class="chart-image" alt="Risk Score" />
        </div>
      </div>
      ` : ''}

      <div class="section">
        <div class="section-title">Key Risk Factors</div>
        ${riskFactors.map((risk: any) => `
          <div class="risk-item risk-${risk.severity?.toLowerCase() || 'medium'}">
            <div class="risk-title">${risk.factor || 'Risk Factor'} - ${risk.severity || 'Medium'} Risk</div>
            <div class="risk-description">${risk.description || ''}</div>
          </div>
        `).join('')}
      </div>

      <div class="footer">
        <div>Confidential Business Valuation Report</div>
        <div class="page-number">Page 6</div>
      </div>
    </div>
  `;
}

function generateBenchmarkingPage(reportData: any, charts: any, formatPercentage: Function): string {
  const benchmarking = reportData.industry_benchmarking || {};
  
  return `
    <div class="page">
      <div class="header">
        <div class="company-name">Industry Benchmarking</div>
        <div class="report-title">Comparative Analysis</div>
      </div>

      ${charts.benchmarking ? `
      <div class="section">
        <div class="section-title">Industry Percentile Rankings</div>
        <div class="chart-container">
          <img src="data:image/png;base64,${charts.benchmarking}" class="chart-image" alt="Benchmarking" />
        </div>
      </div>
      ` : ''}

      ${benchmarking.industry_percentile_rankings ? `
      <div class="section">
        <div class="section-title">Performance Metrics</div>
        <div class="metrics-grid">
          <div class="metric-item">
            <div class="metric-label">Revenue Growth Percentile</div>
            <div class="metric-value">${formatPercentage(benchmarking.industry_percentile_rankings.revenue_growth_percentile)}</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">Profitability Percentile</div>
            <div class="metric-value">${formatPercentage(benchmarking.industry_percentile_rankings.profitability_percentile)}</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">Efficiency Percentile</div>
            <div class="metric-value">${formatPercentage(benchmarking.industry_percentile_rankings.efficiency_percentile)}</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">Leverage Percentile</div>
            <div class="metric-value">${formatPercentage(benchmarking.industry_percentile_rankings.leverage_percentile)}</div>
          </div>
        </div>
      </div>
      ` : ''}

      <div class="footer">
        <div>Confidential Business Valuation Report</div>
        <div class="page-number">Page 7</div>
      </div>
    </div>
  `;
}

function generateConclusionPage(reportData: any, report: any, formatCurrency: Function): string {
  const conclusion = reportData.valuation_conclusion || {};
  const recommendations = reportData.recommendations || [];
  
  return `
    <div class="page">
      <div class="header">
        <div class="company-name">${report.company_name}</div>
        <div class="report-title">Conclusion & Recommendations</div>
      </div>

      <div class="section">
        <div class="section-title">Final Valuation Conclusion</div>
        <div class="highlight-box">
          <div class="highlight-box-title">Concluded Value: ${formatCurrency(report.valuation_amount)}</div>
          <p style="margin-top: 15px; line-height: 1.8;">
            ${conclusion.conclusion_statement || 'Based on our comprehensive analysis, this represents the fair market value of the business.'}
          </p>
        </div>
      </div>

      ${recommendations.length > 0 ? `
      <div class="section">
        <div class="section-title">Key Recommendations</div>
        ${recommendations.map((rec: any) => `
          <div class="finding-item">
            <strong>${rec.recommendation || ''}</strong><br>
            <span style="color: #64748b;">${rec.rationale || ''}</span>
          </div>
        `).join('')}
      </div>
      ` : ''}

      <div class="footer">
        <div>Confidential Business Valuation Report</div>
        <div class="page-number">Page 8</div>
      </div>
    </div>
  `;
}

function generateDisclaimerPage(): string {
  return `
    <div class="page">
      <div class="section">
        <div class="section-title">Important Disclaimers</div>
        
        <div class="disclaimer">
          <div class="disclaimer-title">Confidentiality Notice</div>
          This valuation report contains confidential and proprietary information. It is intended solely for the use of the client and should not be distributed to third parties without prior written consent.
        </div>

        <div class="disclaimer">
          <div class="disclaimer-title">Valuation Purpose</div>
          This valuation is prepared for general business planning purposes. It should not be relied upon for tax, legal, or financial reporting without consulting appropriate professionals.
        </div>

        <div class="disclaimer">
          <div class="disclaimer-title">Assumptions and Limiting Conditions</div>
          This valuation is based on information provided by the client and publicly available data. We have not independently verified all information and assume it to be accurate and complete. The valuation reflects conditions as of the report date and may change with market conditions.
        </div>

        <div class="disclaimer">
          <div class="disclaimer-title">Professional Standards</div>
          This analysis follows generally accepted valuation principles and methodologies. However, it is generated using automated systems and should be reviewed by a qualified valuation professional for critical decisions.
        </div>
      </div>

      <div class="footer">
        <div>Confidential Business Valuation Report</div>
        <div class="page-number">Page 9</div>
      </div>
    </div>
  `;
}
