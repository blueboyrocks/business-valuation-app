import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { marked } from 'marked';
import fs from 'fs/promises';
import path from 'path';

interface ReportData {
  // Calculated values (from server)
  valuation_amount?: number;
  valuation_range_low?: number;
  valuation_range_high?: number;
  asset_approach_value?: number;
  income_approach_value?: number;
  market_approach_value?: number;
  asset_approach_weight?: number;
  income_approach_weight?: number;
  market_approach_weight?: number;
  normalized_ebitda?: number;
  normalized_sde?: number;
  
  // Metadata
  valuation_method?: string;
  valuation_date?: string;
  standard_of_value?: string;
  confidence_level?: string;
  premise_of_value?: string;
  
  // Financial data
  industry_name?: string;
  industry_naics_code?: string;
  revenue_multiple_used?: number;
  ebitda_multiple_used?: number;
  sde_multiple_used?: number;
  annual_revenue?: number;
  pretax_income?: number;
  owner_compensation?: number;
  interest_expense?: number;
  depreciation_amortization?: number;
  total_assets?: number;
  total_liabilities?: number;
  
  // Narrative sections
  executive_summary?: string;
  key_findings?: string[];
  company_profile?: string;
  financial_analysis?: string;
  industry_analysis?: string;
  asset_approach_analysis?: string;
  income_approach_analysis?: string;
  market_approach_analysis?: string;
  valuation_reconciliation?: string;
  discounts_and_premiums?: string;
  risk_assessment?: string;
  critical_risk_factors?: string[];
  strategic_insights?: string;
  value_enhancement_recommendations?: string[];
  assumptions_and_limiting_conditions?: string;
  data_sources?: string;
  methodology_compliance?: string;
  
  [key: string]: any;
}

export class PuppeteerPDFGenerator {
  private templatePath: string;

  constructor() {
    this.templatePath = path.join(process.cwd(), 'lib', 'pdf', 'template.html');
  }

  /**
   * Format currency with no rounding
   */
  private formatCurrency(amount: number | null | undefined): string {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(amount));
  }

  /**
   * Format percentage
   */
  private formatPercent(value: number | null | undefined): string {
    if (!value && value !== 0) return 'N/A';
    return `${(value * 100).toFixed(1)}%`;
  }

  /**
   * Convert markdown to HTML
   */
  private async markdownToHtml(markdown: string | undefined): Promise<string> {
    if (!markdown) return '<p>No data available</p>';
    
    // Configure marked for better formatting
    marked.setOptions({
      breaks: true,
      gfm: true,
    });
    
    return marked(markdown);
  }

  /**
   * Generate cover page HTML
   */
  private generateCoverPage(companyName: string, reportData: ReportData, generatedDate: string): string {
    return `
      <div class="cover-page">
        <h1>Business Valuation Report</h1>
        <div class="company-name">${companyName}</div>
        <div class="metadata">
          <p><strong>Valuation Date:</strong> ${reportData.valuation_date || 'N/A'}</p>
          <p><strong>Report Generated:</strong> ${generatedDate}</p>
          <p><strong>Industry:</strong> ${reportData.industry_name || 'N/A'}</p>
          <p><strong>NAICS Code:</strong> ${reportData.industry_naics_code || 'N/A'}</p>
        </div>
      </div>
    `;
  }

  /**
   * Generate executive summary section
   */
  private async generateExecutiveSummary(companyName: string, reportData: ReportData): Promise<string> {
    const summaryHtml = await this.markdownToHtml(reportData.executive_summary);
    
    return `
      <h2>Executive Summary</h2>
      
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Estimated Value</div>
          <div class="metric-value">${this.formatCurrency(reportData.valuation_amount)}</div>
          <div class="metric-subtitle">Fair Market Value</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Value Range</div>
          <div class="metric-value">${this.formatCurrency(reportData.valuation_range_low)} - ${this.formatCurrency(reportData.valuation_range_high)}</div>
          <div class="metric-subtitle">±7-10% Range</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Confidence Level</div>
          <div class="metric-value">${reportData.confidence_level || 'N/A'}</div>
          <div class="metric-subtitle">Based on Data Quality</div>
        </div>
      </div>

      <div class="executive-summary-box">
        ${summaryHtml}
      </div>

      ${reportData.key_findings && reportData.key_findings.length > 0 ? `
        <h3>Key Findings</h3>
        <ul>
          ${reportData.key_findings.map(finding => `<li>${finding}</li>`).join('')}
        </ul>
      ` : ''}
    `;
  }

  /**
   * Generate valuation chart
   */
  private generateValuationChart(reportData: ReportData): string {
    const chartData = {
      labels: ['Asset Approach', 'Income Approach', 'Market Approach'],
      values: [
        reportData.asset_approach_value || 0,
        reportData.income_approach_value || 0,
        reportData.market_approach_value || 0
      ],
      weights: [
        (reportData.asset_approach_weight || 0) * 100,
        (reportData.income_approach_weight || 0) * 100,
        (reportData.market_approach_weight || 0) * 100
      ]
    };

    return `
      <div class="chart-container">
        <canvas id="valuationChart" width="600" height="400"></canvas>
      </div>
      <script>
        const ctx = document.getElementById('valuationChart').getContext('2d');
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ${JSON.stringify(chartData.labels)},
            datasets: [{
              label: 'Valuation Amount',
              data: ${JSON.stringify(chartData.values)},
              backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
              borderColor: ['#1e40af', '#059669', '#d97706'],
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: 'Valuation Approaches Comparison',
                font: { size: 16, weight: 'bold' }
              },
              legend: {
                display: false
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const value = context.parsed.y;
                    const weight = ${JSON.stringify(chartData.weights)}[context.dataIndex];
                    return [
                      'Value: $' + value.toLocaleString(),
                      'Weight: ' + weight.toFixed(1) + '%'
                    ];
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return '$' + value.toLocaleString();
                  }
                }
              }
            }
          }
        });
      </script>
    `;
  }

  /**
   * Generate valuation methodology section
   */
  private generateValuationMethodology(reportData: ReportData): string {
    return `
      <div class="page-break"></div>
      <h2>Valuation Methodology</h2>
      
      <p><strong>Standard of Value:</strong> ${reportData.standard_of_value || 'Fair Market Value'}</p>
      <p><strong>Premise of Value:</strong> ${reportData.premise_of_value || 'Going Concern'}</p>
      <p><strong>Valuation Method:</strong> ${reportData.valuation_method || 'Weighted Average of Three Approaches'}</p>

      <h3>Three Valuation Approaches</h3>
      
      <table class="valuation-table">
        <thead>
          <tr>
            <th>Approach</th>
            <th class="table-number">Value</th>
            <th class="table-number">Weight</th>
            <th class="table-number">Weighted Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Asset Approach</strong></td>
            <td class="table-number">${this.formatCurrency(reportData.asset_approach_value)}</td>
            <td class="table-number">${this.formatPercent(reportData.asset_approach_weight)}</td>
            <td class="table-number">${this.formatCurrency((reportData.asset_approach_value || 0) * (reportData.asset_approach_weight || 0))}</td>
          </tr>
          <tr>
            <td><strong>Income Approach</strong></td>
            <td class="table-number">${this.formatCurrency(reportData.income_approach_value)}</td>
            <td class="table-number">${this.formatPercent(reportData.income_approach_weight)}</td>
            <td class="table-number">${this.formatCurrency((reportData.income_approach_value || 0) * (reportData.income_approach_weight || 0))}</td>
          </tr>
          <tr>
            <td><strong>Market Approach</strong></td>
            <td class="table-number">${this.formatCurrency(reportData.market_approach_value)}</td>
            <td class="table-number">${this.formatPercent(reportData.market_approach_weight)}</td>
            <td class="table-number">${this.formatCurrency((reportData.market_approach_value || 0) * (reportData.market_approach_weight || 0))}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3"><strong>Concluded Value</strong></td>
            <td class="table-number"><strong>${this.formatCurrency(reportData.valuation_amount)}</strong></td>
          </tr>
        </tfoot>
      </table>

      <h3>Industry Multiples Applied</h3>
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th class="table-number">Multiple</th>
            <th class="table-number">Base Value</th>
            <th class="table-number">Calculated Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Revenue Multiple</td>
            <td class="table-number">${reportData.revenue_multiple_used ? reportData.revenue_multiple_used.toFixed(2) + 'x' : 'N/A'}</td>
            <td class="table-number">${this.formatCurrency(reportData.annual_revenue)}</td>
            <td class="table-number">${this.formatCurrency((reportData.annual_revenue || 0) * (reportData.revenue_multiple_used || 0))}</td>
          </tr>
          <tr>
            <td>EBITDA Multiple</td>
            <td class="table-number">${reportData.ebitda_multiple_used ? reportData.ebitda_multiple_used.toFixed(2) + 'x' : 'N/A'}</td>
            <td class="table-number">${this.formatCurrency(reportData.normalized_ebitda)}</td>
            <td class="table-number">${this.formatCurrency((reportData.normalized_ebitda || 0) * (reportData.ebitda_multiple_used || 0))}</td>
          </tr>
          <tr>
            <td>SDE Multiple</td>
            <td class="table-number">${reportData.sde_multiple_used ? reportData.sde_multiple_used.toFixed(2) + 'x' : 'N/A'}</td>
            <td class="table-number">${this.formatCurrency(reportData.normalized_sde)}</td>
            <td class="table-number">${this.formatCurrency((reportData.normalized_sde || 0) * (reportData.sde_multiple_used || 0))}</td>
          </tr>
        </tbody>
      </table>
    `;
  }

  /**
   * Generate detailed analysis sections
   */
  private async generateAnalysisSections(reportData: ReportData): Promise<string> {
    const sections = [];

    // Company Profile
    if (reportData.company_profile) {
      sections.push(`
        <div class="page-break"></div>
        <h2>Company Profile</h2>
        ${await this.markdownToHtml(reportData.company_profile)}
      `);
    }

    // Industry Analysis
    if (reportData.industry_analysis) {
      sections.push(`
        <div class="page-break"></div>
        <h2>Industry Analysis</h2>
        ${await this.markdownToHtml(reportData.industry_analysis)}
      `);
    }

    // Financial Analysis
    if (reportData.financial_analysis) {
      sections.push(`
        <div class="page-break"></div>
        <h2>Financial Analysis</h2>
        ${await this.markdownToHtml(reportData.financial_analysis)}
      `);
    }

    // Asset Approach
    if (reportData.asset_approach_analysis) {
      sections.push(`
        <div class="page-break"></div>
        <h2>Asset Approach Analysis</h2>
        ${await this.markdownToHtml(reportData.asset_approach_analysis)}
      `);
    }

    // Income Approach
    if (reportData.income_approach_analysis) {
      sections.push(`
        <div class="page-break"></div>
        <h2>Income Approach Analysis</h2>
        ${await this.markdownToHtml(reportData.income_approach_analysis)}
      `);
    }

    // Market Approach
    if (reportData.market_approach_analysis) {
      sections.push(`
        <div class="page-break"></div>
        <h2>Market Approach Analysis</h2>
        ${await this.markdownToHtml(reportData.market_approach_analysis)}
      `);
    }

    // Valuation Reconciliation
    if (reportData.valuation_reconciliation) {
      sections.push(`
        <div class="page-break"></div>
        <h2>Valuation Reconciliation</h2>
        ${await this.markdownToHtml(reportData.valuation_reconciliation)}
      `);
    }

    // Discounts and Premiums
    if (reportData.discounts_and_premiums) {
      sections.push(`
        <div class="page-break"></div>
        <h2>Discounts and Premiums</h2>
        ${await this.markdownToHtml(reportData.discounts_and_premiums)}
      `);
    }

    return sections.join('\n');
  }

  /**
   * Generate risk assessment section
   */
  private async generateRiskAssessment(reportData: ReportData): Promise<string> {
    const riskHtml = await this.markdownToHtml(reportData.risk_assessment);
    
    let criticalRisksHtml = '';
    if (reportData.critical_risk_factors && reportData.critical_risk_factors.length > 0) {
      criticalRisksHtml = `
        <h3>Critical Risk Factors</h3>
        <div class="risk-grid">
          ${reportData.critical_risk_factors.map((risk, index) => `
            <div class="risk-card">
              <h4>Risk ${index + 1}</h4>
              <p>${risk}</p>
            </div>
          `).join('')}
        </div>
      `;
    }

    return `
      <div class="page-break"></div>
      <h2>Risk Assessment</h2>
      ${riskHtml}
      ${criticalRisksHtml}
    `;
  }

  /**
   * Generate strategic insights section
   */
  private async generateStrategicInsights(reportData: ReportData): Promise<string> {
    const insightsHtml = await this.markdownToHtml(reportData.strategic_insights);
    
    let recommendationsHtml = '';
    if (reportData.value_enhancement_recommendations && reportData.value_enhancement_recommendations.length > 0) {
      recommendationsHtml = `
        <h3>Value Enhancement Recommendations</h3>
        ${reportData.value_enhancement_recommendations.map((rec, index) => `
          <div class="recommendation-card">
            <h4>Recommendation ${index + 1}</h4>
            <p>${rec}</p>
          </div>
        `).join('')}
      `;
    }

    return `
      <div class="page-break"></div>
      <h2>Strategic Insights</h2>
      ${insightsHtml}
      ${recommendationsHtml}
    `;
  }

  /**
   * Generate appendix sections
   */
  private async generateAppendix(reportData: ReportData): Promise<string> {
    const sections = [];

    // Assumptions and Limiting Conditions
    if (reportData.assumptions_and_limiting_conditions) {
      sections.push(`
        <div class="page-break"></div>
        <h2>Assumptions and Limiting Conditions</h2>
        ${await this.markdownToHtml(reportData.assumptions_and_limiting_conditions)}
      `);
    }

    // Data Sources
    if (reportData.data_sources) {
      sections.push(`
        <h2>Data Sources</h2>
        ${await this.markdownToHtml(reportData.data_sources)}
      `);
    }

    // Methodology Compliance
    if (reportData.methodology_compliance) {
      sections.push(`
        <h2>Professional Standards Compliance</h2>
        ${await this.markdownToHtml(reportData.methodology_compliance)}
      `);
    }

    return sections.join('\n');
  }

  /**
   * Generate complete PDF
   */
  async generate(companyName: string, reportData: ReportData, generatedDate: string): Promise<Buffer> {
    console.log('[PDF] Generating PDF with Puppeteer...');

    // Build HTML content
    const coverPage = this.generateCoverPage(companyName, reportData, generatedDate);
    const executiveSummary = await this.generateExecutiveSummary(companyName, reportData);
    const valuationChart = this.generateValuationChart(reportData);
    const methodology = this.generateValuationMethodology(reportData);
    const analysis = await this.generateAnalysisSections(reportData);
    const risks = await this.generateRiskAssessment(reportData);
    const insights = await this.generateStrategicInsights(reportData);
    const appendix = await this.generateAppendix(reportData);

    const content = `
      ${coverPage}
      ${executiveSummary}
      ${valuationChart}
      ${methodology}
      ${analysis}
      ${risks}
      ${insights}
      ${appendix}
      
      <div class="confidentiality-notice">
        <strong>CONFIDENTIALITY NOTICE:</strong> This report is confidential and intended solely for the use of ${companyName} and its designated representatives. 
        Unauthorized distribution or reproduction is strictly prohibited.
      </div>
    `;

    // Load template
    const template = await fs.readFile(this.templatePath, 'utf-8');
    const html = template.replace('{{CONTENT}}', content);

    // Launch Puppeteer with serverless chromium
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'letter',
      margin: {
        top: '0.75in',
        right: '0.75in',
        bottom: '0.75in',
        left: '0.75in',
      },
      printBackground: true,
      preferCSSPageSize: true,
    });

    await browser.close();

    console.log(`[PDF] PDF generated successfully (${pdfBuffer.length} bytes)`);
    return Buffer.from(pdfBuffer);
  }
}
