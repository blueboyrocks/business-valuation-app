import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { calculateKPIs, formatKPI, type FinancialData } from '../valuation/kpi-calculator';
import { marked } from 'marked';

interface ReportData {
  // Valuation outputs
  valuation_amount?: number;
  asset_approach_value?: number;
  income_approach_value?: number;
  market_approach_value?: number;
  
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

export class ProfessionalPDFGenerator {
  /**
   * Generate professional PDF without charts (for reliability)
   */
  async generate(companyName: string, reportData: ReportData, generatedDate: string): Promise<Buffer> {
    console.log('[PDF] Generating professional PDF...');

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

      // Calculate enterprise and liquidation values
      const enterprise_value = this.calculateEnterpriseValue(reportData);
      const liquidation_value = this.calculateLiquidationValue(reportData);

      // Build HTML
      const html = await this.buildHTML(companyName, reportData, generatedDate, kpis, enterprise_value, liquidation_value);

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
   * Calculate enterprise value
   */
  private calculateEnterpriseValue(reportData: ReportData): number | null {
    if (!reportData.valuation_amount) return null;
    const totalDebt = reportData.total_liabilities || 0;
    return reportData.valuation_amount + totalDebt;
  }

  /**
   * Calculate liquidation value (conservative estimate)
   */
  private calculateLiquidationValue(reportData: ReportData): number | null {
    if (!reportData.total_assets) return null;
    
    // Liquidation value is typically 50-70% of asset value
    const cash = reportData.cash || 0;
    const ar = (reportData.accounts_receivable || 0) * 0.7; // 70% recovery
    const inventory = (reportData.inventory || 0) * 0.5; // 50% recovery
    const fixedAssets = (reportData.fixed_assets || 0) * 0.4; // 40% recovery
    const liabilities = reportData.total_liabilities || 0;
    
    return Math.max(0, cash + ar + inventory + fixedAssets - liabilities);
  }

  /**
   * Build complete HTML for PDF
   */
  private async buildHTML(
    companyName: string,
    reportData: ReportData,
    generatedDate: string,
    kpis: any,
    enterprise_value: number | null,
    liquidation_value: number | null
  ): Promise<string> {
    const fmt = (val: number | null | undefined) => val ? `$${Math.round(val).toLocaleString()}` : 'N/A';

    // Convert markdown to HTML for narratives
    const execSummary = reportData.executive_summary ? await marked(reportData.executive_summary) : '<p>No executive summary available.</p>';
    const companyProfile = reportData.company_profile ? await marked(reportData.company_profile) : '';
    const industryAnalysis = reportData.industry_analysis ? await marked(reportData.industry_analysis) : '';
    const financialAnalysis = reportData.financial_analysis ? await marked(reportData.financial_analysis) : '';
    const assetAnalysis = reportData.asset_approach_analysis ? await marked(reportData.asset_approach_analysis) : '';
    const incomeAnalysis = reportData.income_approach_analysis ? await marked(reportData.income_approach_analysis) : '';
    const marketAnalysis = reportData.market_approach_analysis ? await marked(reportData.market_approach_analysis) : '';
    const valuationRecon = reportData.valuation_reconciliation ? await marked(reportData.valuation_reconciliation) : '';
    const riskAssessment = reportData.risk_assessment ? await marked(reportData.risk_assessment) : '';
    const strategicInsights = reportData.strategic_insights ? await marked(reportData.strategic_insights) : '';

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
    
    ul {
      margin: 15px 0 15px 30px;
    }
    
    li {
      margin-bottom: 8px;
    }
    
    .narrative {
      font-size: 11pt;
      line-height: 1.8;
    }
    
    .narrative p {
      margin-bottom: 15px;
    }
    
    .narrative h2 {
      margin-top: 25px;
      margin-bottom: 15px;
    }
    
    .narrative h3 {
      margin-top: 20px;
      margin-bottom: 10px;
    }
    
    .narrative ul, .narrative ol {
      margin: 15px 0 15px 40px;
    }
    
    .narrative li {
      margin-bottom: 10px;
    }
  </style>
</head>
<body>

  <!-- Cover Page -->
  <div class="cover-page">
    <div>
      <div class="cover-title">Business Valuation Report</div>
      <div class="cover-subtitle">Professional Valuation Analysis</div>
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
    <div class="toc-item"><span>Your Valuation</span><span>3</span></div>
    <div class="toc-item"><span>Financial Summary</span><span>4</span></div>
    <div class="toc-item"><span>Key Performance Indicators</span><span>5</span></div>
    <div class="toc-item"><span>Executive Summary</span><span>6</span></div>
    ${companyProfile ? '<div class="toc-item"><span>Company Profile</span><span>7</span></div>' : ''}
    ${industryAnalysis ? '<div class="toc-item"><span>Industry Analysis</span><span>8</span></div>' : ''}
    ${financialAnalysis ? '<div class="toc-item"><span>Financial Analysis</span><span>9</span></div>' : ''}
    ${assetAnalysis ? '<div class="toc-item"><span>Asset Approach</span><span>10</span></div>' : ''}
    ${incomeAnalysis ? '<div class="toc-item"><span>Income Approach</span><span>11</span></div>' : ''}
    ${marketAnalysis ? '<div class="toc-item"><span>Market Approach</span><span>12</span></div>' : ''}
    ${valuationRecon ? '<div class="toc-item"><span>Valuation Reconciliation</span><span>13</span></div>' : ''}
    ${riskAssessment ? '<div class="toc-item"><span>Risk Assessment</span><span>14</span></div>' : ''}
    ${strategicInsights ? '<div class="toc-item"><span>Strategic Insights</span><span>15</span></div>' : ''}
  </div>

  <!-- Your Valuation -->
  <div class="section">
    <h1 class="section-title">Your Valuation</h1>
    
    <h2>${companyName}</h2>
    ${reportData.industry_name ? `<p><strong>Industry:</strong> ${reportData.naics_code} - ${reportData.industry_name}</p>` : ''}
    
    <div class="value-card">
      <div class="value-label">Equity Value (Fair Market Value)</div>
      <div class="value-amount">${fmt(reportData.valuation_amount)}</div>
      <div class="value-subtitle">Based on Weighted Average of Three Approaches</div>
    </div>
    
    <h2>Valuation Approaches</h2>
    <table>
      <thead>
        <tr>
          <th>Approach</th>
          <th style="text-align: right;">Value</th>
          <th style="text-align: right;">Weight</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Asset Approach</td>
          <td style="text-align: right; font-weight: bold;">${fmt(reportData.asset_approach_value)}</td>
          <td style="text-align: right;">20%</td>
        </tr>
        <tr>
          <td>Income Approach</td>
          <td style="text-align: right; font-weight: bold;">${fmt(reportData.income_approach_value)}</td>
          <td style="text-align: right;">40%</td>
        </tr>
        <tr>
          <td>Market Approach</td>
          <td style="text-align: right; font-weight: bold;">${fmt(reportData.market_approach_value)}</td>
          <td style="text-align: right;">40%</td>
        </tr>
      </tbody>
    </table>
    
    <div class="three-col">
      <div class="col">
        <div class="col-title">Asset Sale Value</div>
        <div class="col-value">${fmt(reportData.asset_approach_value)}</div>
        <div class="col-text">Includes inventory, fixtures, equipment, and intangible assets. Buyer operates from newly formed entity.</div>
      </div>
      <div class="col">
        <div class="col-title">Enterprise Value</div>
        <div class="col-value">${fmt(enterprise_value)}</div>
        <div class="col-text">Total value of the firm including debt. Reflects value of entire capital structure.</div>
      </div>
      <div class="col">
        <div class="col-title">Liquidation Value</div>
        <div class="col-value">${fmt(liquidation_value)}</div>
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
  </div>

  <!-- KPI Overview -->
  <div class="section">
    <h1 class="section-title">Key Performance Indicators</h1>
    
    <p>In order to better understand your company's operations, we have calculated a variety of Key Performance Indicators (KPIs) for your review and comparison to industry benchmarks.</p>
    
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

  <!-- Executive Summary -->
  <div class="section">
    <h1 class="section-title">Executive Summary</h1>
    <div class="narrative">
      ${execSummary}
    </div>
  </div>

  ${companyProfile ? `
  <div class="section">
    <h1 class="section-title">Company Profile</h1>
    <div class="narrative">
      ${companyProfile}
    </div>
  </div>
  ` : ''}

  ${industryAnalysis ? `
  <div class="section">
    <h1 class="section-title">Industry Analysis</h1>
    <div class="narrative">
      ${industryAnalysis}
    </div>
  </div>
  ` : ''}

  ${financialAnalysis ? `
  <div class="section">
    <h1 class="section-title">Financial Analysis</h1>
    <div class="narrative">
      ${financialAnalysis}
    </div>
  </div>
  ` : ''}

  ${assetAnalysis ? `
  <div class="section">
    <h1 class="section-title">Asset Approach Analysis</h1>
    <div class="narrative">
      ${assetAnalysis}
    </div>
  </div>
  ` : ''}

  ${incomeAnalysis ? `
  <div class="section">
    <h1 class="section-title">Income Approach Analysis</h1>
    <div class="narrative">
      ${incomeAnalysis}
    </div>
  </div>
  ` : ''}

  ${marketAnalysis ? `
  <div class="section">
    <h1 class="section-title">Market Approach Analysis</h1>
    <div class="narrative">
      ${marketAnalysis}
    </div>
  </div>
  ` : ''}

  ${valuationRecon ? `
  <div class="section">
    <h1 class="section-title">Valuation Reconciliation</h1>
    <div class="narrative">
      ${valuationRecon}
    </div>
  </div>
  ` : ''}

  ${riskAssessment ? `
  <div class="section">
    <h1 class="section-title">Risk Assessment</h1>
    <div class="narrative">
      ${riskAssessment}
    </div>
  </div>
  ` : ''}

  ${strategicInsights ? `
  <div class="section">
    <h1 class="section-title">Strategic Insights</h1>
    <div class="narrative">
      ${strategicInsights}
    </div>
  </div>
  ` : ''}

</body>
</html>
    `;
  }
}
