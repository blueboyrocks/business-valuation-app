import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { calculateKPIs, formatKPI, type FinancialData } from '../valuation/kpi-calculator';
import {
  generateValuationHistoryChart,
  generateFinancialMetricsChart,
  generateValuationApproachesChart,
} from './chart-generator';

interface ReportData {
  // Valuation outputs
  valuation_amount?: number;
  asset_approach_value?: number;
  income_approach_value?: number;
  market_approach_value?: number;
  enterprise_value?: number;
  liquidation_value?: number;
  
  // Financial data (current year)
  annual_revenue?: number;
  pretax_income?: number;
  owner_compensation?: number;
  interest_expense?: number;
  depreciation_amortization?: number;
  non_cash_expenses?: number;
  one_time_expenses?: number;
  one_time_revenues?: number;
  cash?: number;
  accounts_receivable?: number;
  inventory?: number;
  other_current_assets?: number;
  fixed_assets?: number;
  intangible_assets?: number;
  total_assets?: number;
  accounts_payable?: number;
  other_short_term_liabilities?: number;
  bank_loans?: number;
  other_long_term_liabilities?: number;
  total_liabilities?: number;
  
  // Multi-year data (if available)
  financial_history?: {
    year: string;
    revenue: number;
    pretax_income?: number;
    owner_compensation?: number;
    cash?: number;
    total_assets?: number;
    total_liabilities?: number;
  }[];
  
  // Narrative sections
  executive_summary?: string;
  company_profile?: string;
  industry_analysis?: string;
  financial_analysis?: string;
  asset_approach_analysis?: string;
  income_approach_analysis?: string;
  market_approach_analysis?: string;
  valuation_reconciliation?: string;
  risk_assessment?: string;
  strategic_insights?: string;
  
  // Metadata
  naics_code?: string;
  industry_name?: string;
  valuation_date?: string;
}

export class BizEquityPDFGenerator {
  /**
   * Generate professional BizEquity-style PDF
   */
  async generate(companyName: string, reportData: ReportData, generatedDate: string): Promise<Buffer> {
    console.log('[PDF] Generating BizEquity-style PDF...');

    try {
      // Prepare financial data for KPI calculations
      const currentYearData: FinancialData = {
        revenue: reportData.annual_revenue || 0,
        pretax_income: reportData.pretax_income,
        owner_compensation: reportData.owner_compensation,
        interest_expense: reportData.interest_expense,
        depreciation_amortization: reportData.depreciation_amortization || reportData.non_cash_expenses,
        non_cash_expenses: reportData.non_cash_expenses,
        one_time_expenses: reportData.one_time_expenses,
        one_time_revenues: reportData.one_time_revenues,
        cash: reportData.cash,
        accounts_receivable: reportData.accounts_receivable,
        inventory: reportData.inventory,
        other_current_assets: reportData.other_current_assets,
        fixed_assets: reportData.fixed_assets,
        intangible_assets: reportData.intangible_assets,
        total_assets: reportData.total_assets,
        accounts_payable: reportData.accounts_payable,
        other_short_term_liabilities: reportData.other_short_term_liabilities,
        bank_loans: reportData.bank_loans,
        other_long_term_liabilities: reportData.other_long_term_liabilities,
        total_liabilities: reportData.total_liabilities,
      };

      // Calculate KPIs
      const kpis = calculateKPIs(currentYearData);

      // Generate charts as base64
      const charts = await this.generateCharts(reportData, kpis);

      // Build HTML
      const html = this.buildHTML(companyName, reportData, generatedDate, kpis, charts);

      // Generate PDF with Puppeteer
      const browser = await puppeteer.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: true,
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = Buffer.from(await page.pdf({
        format: 'Letter',
        printBackground: true,
        margin: {
          top: '0.75in',
          right: '0.75in',
          bottom: '0.75in',
          left: '0.75in',
        },
      }));

      await browser.close();

      console.log(`[PDF] Generated successfully (${pdfBuffer.length} bytes)`);
      return pdfBuffer;

    } catch (error) {
      console.error('[PDF] Generation error:', error);
      throw error;
    }
  }

  /**
   * Generate all charts for the report
   */
  private async generateCharts(reportData: ReportData, kpis: any): Promise<Record<string, string>> {
    const charts: Record<string, string> = {};

    try {
      // Valuation approaches chart
      if (reportData.asset_approach_value && reportData.income_approach_value && reportData.market_approach_value) {
        const buffer = await generateValuationApproachesChart({
          asset: reportData.asset_approach_value,
          income: reportData.income_approach_value,
          market: reportData.market_approach_value,
        });
        charts.valuationApproaches = `data:image/png;base64,${buffer.toString('base64')}`;
      }

      // Financial metrics chart (if multi-year data available)
      if (reportData.financial_history && reportData.financial_history.length > 1) {
        const years = reportData.financial_history.map(h => h.year);
        const buffer = await generateFinancialMetricsChart(years, {
          revenue: reportData.financial_history.map(h => h.revenue),
          cashFlow: reportData.financial_history.map(h => {
            const data: FinancialData = { revenue: h.revenue, pretax_income: h.pretax_income };
            const kpi = calculateKPIs(data);
            return kpi.cash_flow || 0;
          }),
          totalDebt: reportData.financial_history.map(h => h.total_liabilities || 0),
          inventory: reportData.financial_history.map(() => reportData.inventory || 0),
          receivables: reportData.financial_history.map(() => reportData.accounts_receivable || 0),
        });
        charts.financialMetrics = `data:image/png;base64,${buffer.toString('base64')}`;
      }

    } catch (error) {
      console.error('[PDF] Chart generation error:', error);
    }

    return charts;
  }

  /**
   * Build complete HTML for PDF
   */
  private buildHTML(
    companyName: string,
    reportData: ReportData,
    generatedDate: string,
    kpis: any,
    charts: Record<string, string>
  ): string {
    const fmt = (val: number | null | undefined) => val ? `$${val.toLocaleString()}` : 'N/A';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #333;
    }
    
    .cover-page {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: linear-gradient(135deg, #0066CC 0%, #004C99 100%);
      color: white;
      padding: 60px;
      page-break-after: always;
    }
    
    .cover-title {
      font-size: 48pt;
      font-weight: bold;
      margin-bottom: 20px;
    }
    
    .cover-subtitle {
      font-size: 24pt;
      margin-bottom: 60px;
    }
    
    .cover-company {
      font-size: 36pt;
      font-weight: bold;
      margin-bottom: 10px;
    }
    
    .cover-date {
      font-size: 14pt;
      opacity: 0.9;
    }
    
    .cover-footer {
      font-size: 10pt;
      opacity: 0.8;
      line-height: 1.4;
    }
    
    .toc {
      page-break-after: always;
      padding: 40px 0;
    }
    
    .toc h1 {
      font-size: 32pt;
      color: #0066CC;
      margin-bottom: 30px;
      padding-bottom: 10px;
      border-bottom: 3px solid #0066CC;
    }
    
    .toc-item {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #E0E0E0;
      font-size: 12pt;
    }
    
    .section {
      page-break-before: always;
      padding: 40px 0;
    }
    
    .section-title {
      font-size: 28pt;
      color: white;
      background: #0066CC;
      padding: 20px 30px;
      margin: -40px 0 30px 0;
    }
    
    h2 {
      font-size: 18pt;
      color: #0066CC;
      margin: 30px 0 15px 0;
    }
    
    h3 {
      font-size: 14pt;
      color: #333;
      margin: 20px 0 10px 0;
    }
    
    p {
      margin-bottom: 12px;
      text-align: justify;
    }
    
    .value-card {
      background: #F5F5F5;
      border-left: 4px solid #0066CC;
      padding: 20px;
      margin: 20px 0;
    }
    
    .value-label {
      font-size: 10pt;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    
    .value-amount {
      font-size: 32pt;
      font-weight: bold;
      color: #7CB342;
    }
    
    .value-subtitle {
      font-size: 11pt;
      color: #666;
      margin-top: 5px;
    }
    
    .three-col {
      display: flex;
      gap: 20px;
      margin: 30px 0;
    }
    
    .col {
      flex: 1;
      background: #F5F5F5;
      padding: 20px;
      border-radius: 8px;
    }
    
    .col-title {
      font-size: 12pt;
      font-weight: bold;
      color: #0066CC;
      margin-bottom: 10px;
    }
    
    .col-value {
      font-size: 24pt;
      font-weight: bold;
      color: #7CB342;
      margin-bottom: 10px;
    }
    
    .col-text {
      font-size: 10pt;
      color: #666;
      line-height: 1.4;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 10pt;
    }
    
    thead {
      background: #0066CC;
      color: white;
    }
    
    th {
      padding: 12px;
      text-align: left;
      font-weight: bold;
    }
    
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #E0E0E0;
    }
    
    tbody tr:nth-child(even) {
      background: #F9F9F9;
    }
    
    .financial-table {
      margin: 30px 0;
    }
    
    .financial-section {
      margin-bottom: 30px;
    }
    
    .financial-section h3 {
      background: #0066CC;
      color: white;
      padding: 10px 15px;
      margin: 0 0 10px 0;
    }
    
    .kpi-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 20px 0;
    }
    
    .kpi-card {
      background: #F5F5F5;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #7CB342;
    }
    
    .kpi-name {
      font-size: 10pt;
      color: #666;
      margin-bottom: 5px;
    }
    
    .kpi-value {
      font-size: 20pt;
      font-weight: bold;
      color: #333;
    }
    
    .chart-container {
      margin: 30px 0;
      text-align: center;
    }
    
    .chart-container img {
      max-width: 100%;
      height: auto;
    }
    
    .performance-badge {
      display: inline-block;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 10pt;
      font-weight: bold;
      margin-left: 10px;
    }
    
    .badge-good { background: #7CB342; color: white; }
    .badge-average { background: #42A5F5; color: white; }
    .badge-poor { background: #7E57C2; color: white; }
    
    ul {
      margin: 15px 0 15px 30px;
    }
    
    li {
      margin-bottom: 8px;
    }
  </style>
</head>
<body>

  <!-- Cover Page -->
  <div class="cover-page">
    <div>
      <div class="cover-title">Business Valuation Report</div>
      <div class="cover-subtitle">How much is your company worth?</div>
    </div>
    <div>
      <div class="cover-company">${companyName}</div>
      <div class="cover-date">Valuation Date: ${reportData.valuation_date || generatedDate}</div>
      <div class="cover-date">Report Generated: ${generatedDate}</div>
      ${reportData.industry_name ? `<div class="cover-date">Industry: ${reportData.industry_name}</div>` : ''}
      ${reportData.naics_code ? `<div class="cover-date">NAICS Code: ${reportData.naics_code}</div>` : ''}
    </div>
    <div class="cover-footer">
      This report provides general estimates of fair market value for internal use only. It should not be used to obtain credit or for any commercial purposes. The estimates are based on information provided and publicly available data.
    </div>
  </div>

  <!-- Table of Contents -->
  <div class="toc">
    <h1>Contents</h1>
    <div class="toc-item"><span>About Your Valuation Report</span><span>3</span></div>
    <div class="toc-item"><span>Your Valuation</span><span>4</span></div>
    <div class="toc-item"><span>Financial Summary</span><span>5</span></div>
    <div class="toc-item"><span>Key Performance Indicators</span><span>6</span></div>
    <div class="toc-item"><span>Executive Summary</span><span>7</span></div>
    <div class="toc-item"><span>Financial Analysis</span><span>8</span></div>
    <div class="toc-item"><span>Valuation Methodology</span><span>9</span></div>
    <div class="toc-item"><span>Risk Assessment</span><span>10</span></div>
    <div class="toc-item"><span>Strategic Insights</span><span>11</span></div>
  </div>

  <!-- About Your Valuation Report -->
  <div class="section">
    <h1 class="section-title">About Your Valuation Report</h1>
    
    <p>This dynamically driven and customized report was generated to provide the business owner and entrepreneur with <strong>general estimates of fair market value and liquidation value under relevant transaction conditions</strong> assumed for the profiled business at a fair price and in real-time.</p>
    
    <p>The results presented will provide the reader with estimates which reflect both the "sale of assets" and "the sale of equity" (on a going concern basis) as well as estimates which reflect the "liquidation value" and the so-called "enterprise value" of the subject company.</p>
    
    <h2>Four Valuation Types Provided</h2>
    
    <div class="three-col">
      <div class="col">
        <div class="col-title">Asset Value</div>
        <div class="col-text">Includes inventory, fixed assets, and intangible assets. Excludes liquid financial assets and liabilities.</div>
      </div>
      <div class="col">
        <div class="col-title">Equity Value</div>
        <div class="col-text">Includes all assets plus liquid financial assets, minus all liabilities. Full transfer of legal entity.</div>
      </div>
      <div class="col">
        <div class="col-title">Enterprise Value</div>
        <div class="col-text">Total value of the firm including debt. Useful for comparing companies with varying debt levels.</div>
      </div>
    </div>
    
    <h2>Key Performance Indicators</h2>
    
    <p>The metrics known as Key Performance Indicators (KPIs) were calculated based on company-specific data linked to industry averages. These KPIs are useful measures of overall financial and operational health and should be checked regularly to identify trends or "red flags" which require corrective action.</p>
    
    <p><strong>Color-coded performance system:</strong></p>
    <ul>
      <li><span class="performance-badge badge-good">Green</span> - Outperforming Industry</li>
      <li><span class="performance-badge badge-average">Blue</span> - Meeting Industry Average</li>
      <li><span class="performance-badge badge-poor">Purple</span> - Underperforming in Industry</li>
    </ul>
  </div>

  <!-- Your Valuation -->
  <div class="section">
    <h1 class="section-title">Your Valuation</h1>
    
    <h2>${companyName}</h2>
    ${reportData.industry_name ? `<p><strong>Industry:</strong> ${reportData.naics_code} - ${reportData.industry_name}</p>` : ''}
    
    <div class="value-card">
      <div class="value-label">Equity Value (Latest Valuation)</div>
      <div class="value-amount">${fmt(reportData.valuation_amount)}</div>
      <div class="value-subtitle">Fair Market Value</div>
    </div>
    
    ${charts.valuationApproaches ? `
    <div class="chart-container">
      <img src="${charts.valuationApproaches}" alt="Valuation Approaches" />
    </div>
    ` : ''}
    
    <div class="three-col">
      <div class="col">
        <div class="col-title">Asset Sale Value</div>
        <div class="col-value">${fmt(reportData.asset_approach_value)}</div>
        <div class="col-text">Includes inventory, fixtures, equipment, and intangible assets. Buyer operates from newly formed entity.</div>
      </div>
      <div class="col">
        <div class="col-title">Enterprise Value</div>
        <div class="col-value">${fmt(reportData.enterprise_value)}</div>
        <div class="col-text">Total value of the firm including debt. Reflects value of entire capital structure.</div>
      </div>
      <div class="col">
        <div class="col-title">Liquidation Value</div>
        <div class="col-value">${fmt(reportData.liquidation_value)}</div>
        <div class="col-text">Net amount realized if business is terminated and assets sold piecemeal.</div>
      </div>
    </div>
  </div>

  <!-- Financial Summary -->
  <div class="section">
    <h1 class="section-title">Financial Summary</h1>
    
    <h2>${new Date().getFullYear()}</h2>
    
    <div class="financial-table">
      <div class="financial-section">
        <h3>Income</h3>
        <table>
          <tr><td>Revenue</td><td style="text-align: right; font-weight: bold;">${fmt(reportData.annual_revenue)}</td></tr>
          <tr><td>Pretax Income</td><td style="text-align: right;">${fmt(reportData.pretax_income)}</td></tr>
          <tr><td>Officer Compensation</td><td style="text-align: right;">${fmt(reportData.owner_compensation)}</td></tr>
          <tr><td>Interest Expense</td><td style="text-align: right;">${fmt(reportData.interest_expense)}</td></tr>
          <tr><td>Non-Cash Expenses</td><td style="text-align: right;">${fmt(reportData.non_cash_expenses || reportData.depreciation_amortization)}</td></tr>
        </table>
      </div>
      
      <div class="financial-section">
        <h3>Assets</h3>
        <table>
          <tr><td>Cash</td><td style="text-align: right; font-weight: bold;">${fmt(reportData.cash)}</td></tr>
          <tr><td>Accounts Receivable</td><td style="text-align: right;">${fmt(reportData.accounts_receivable)}</td></tr>
          <tr><td>Inventory</td><td style="text-align: right;">${fmt(reportData.inventory)}</td></tr>
          <tr><td>Other Current Assets</td><td style="text-align: right;">${fmt(reportData.other_current_assets)}</td></tr>
          <tr><td>Fixed Assets</td><td style="text-align: right;">${fmt(reportData.fixed_assets)}</td></tr>
          <tr><td>Intangible Assets</td><td style="text-align: right;">${fmt(reportData.intangible_assets)}</td></tr>
          <tr><td><strong>Total Assets</strong></td><td style="text-align: right; font-weight: bold;">${fmt(reportData.total_assets)}</td></tr>
        </table>
      </div>
      
      <div class="financial-section">
        <h3>Liabilities</h3>
        <table>
          <tr><td>Accounts Payable</td><td style="text-align: right;">${fmt(reportData.accounts_payable)}</td></tr>
          <tr><td>Other Short-Term Liabilities</td><td style="text-align: right;">${fmt(reportData.other_short_term_liabilities)}</td></tr>
          <tr><td>Bank Loans</td><td style="text-align: right;">${fmt(reportData.bank_loans)}</td></tr>
          <tr><td>Other Long-Term Liabilities</td><td style="text-align: right;">${fmt(reportData.other_long_term_liabilities)}</td></tr>
          <tr><td><strong>Total Liabilities</strong></td><td style="text-align: right; font-weight: bold;">${fmt(reportData.total_liabilities)}</td></tr>
        </table>
      </div>
    </div>
    
    ${charts.financialMetrics ? `
    <div class="chart-container">
      <img src="${charts.financialMetrics}" alt="Financial Metrics" />
    </div>
    ` : ''}
  </div>

  <!-- KPI Overview -->
  <div class="section">
    <h1 class="section-title">Key Performance Indicators</h1>
    
    <p>In order to better understand your company's operations, we have calculated a variety of Key Performance Indicators (KPIs) for your review and comparison to industry benchmarks. Key factors include size, profitability, and growth.</p>
    
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-name">Cash Flow-to-Revenue</div>
        <div class="kpi-value">${formatKPI(kpis.cash_flow_to_revenue, 'percentage')}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-name">Cash-to-Revenue</div>
        <div class="kpi-value">${formatKPI(kpis.cash_to_revenue, 'percentage')}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-name">Fixed Assets-to-Revenue</div>
        <div class="kpi-value">${formatKPI(kpis.fixed_assets_to_revenue, 'percentage')}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-name">Total Debt-to-Revenue</div>
        <div class="kpi-value">${formatKPI(kpis.total_debt_to_revenue, 'percentage')}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-name">Current Ratio</div>
        <div class="kpi-value">${formatKPI(kpis.current_ratio, 'ratio')}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-name">Profit Margin</div>
        <div class="kpi-value">${formatKPI(kpis.profit_margin, 'percentage')}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-name">EBITDA Margin</div>
        <div class="kpi-value">${formatKPI(kpis.ebitda_margin, 'percentage')}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-name">Return on Assets</div>
        <div class="kpi-value">${formatKPI(kpis.return_on_assets, 'percentage')}</div>
      </div>
    </div>
  </div>

  ${this.renderNarrativeSection('Executive Summary', reportData.executive_summary)}
  ${this.renderNarrativeSection('Company Profile', reportData.company_profile)}
  ${this.renderNarrativeSection('Industry Analysis', reportData.industry_analysis)}
  ${this.renderNarrativeSection('Financial Analysis', reportData.financial_analysis)}
  ${this.renderNarrativeSection('Asset Approach Analysis', reportData.asset_approach_analysis)}
  ${this.renderNarrativeSection('Income Approach Analysis', reportData.income_approach_analysis)}
  ${this.renderNarrativeSection('Market Approach Analysis', reportData.market_approach_analysis)}
  ${this.renderNarrativeSection('Valuation Reconciliation', reportData.valuation_reconciliation)}
  ${this.renderNarrativeSection('Risk Assessment', reportData.risk_assessment)}
  ${this.renderNarrativeSection('Strategic Insights', reportData.strategic_insights)}

</body>
</html>
    `;
  }

  /**
   * Render a narrative section
   */
  private renderNarrativeSection(title: string, content?: string): string {
    if (!content) return '';
    
    return `
  <div class="section">
    <h1 class="section-title">${title}</h1>
    ${this.markdownToHTML(content)}
  </div>
    `;
  }

  /**
   * Convert markdown to HTML (basic implementation)
   */
  private markdownToHTML(markdown: string): string {
    // Basic markdown conversion
    let html = markdown
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h2>$1</h2>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Lists
      .replace(/^\* (.*$)/gim, '<li>$1</li>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      // Paragraphs
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
    
    // Wrap lists
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Wrap in paragraphs
    if (!html.startsWith('<h') && !html.startsWith('<ul')) {
      html = '<p>' + html + '</p>';
    }
    
    return html;
  }
}
