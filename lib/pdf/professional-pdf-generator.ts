import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import {
  calculateKPIs,
  formatKPI,
  type FinancialData,
  calculateDetailedKPIs,
  type KPIDetailedResult,
  formatKPIValue,
} from '../valuation/kpi-calculator';
import { marked } from 'marked';
import {
  generateValuationChart,
  generateFinancialMetricsChart,
  generateKPIChart,
  generateKPIComparisonChart,
  generateFinancialTrendChart,
  generateRiskGauge,
  generateValueMap,
  type ValuationChartData,
  type FinancialMetricsChartData,
  type KPIChartData,
  type FinancialTrendChartData,
  type RiskGaugeData,
  type ValueMapData,
} from './puppeteer-chart-renderer';
import { generateAllKPIDetailPages } from './kpi-page-generator';
import { getAllKPIsOrdered } from '../content/kpi-explanations';
import { type ValuationDataAccessor, createDataAccessor } from '../valuation/data-accessor';
import { CitationManager } from '../citations/citation-manager';
import { CalculationTableGenerator, type SDETableInput, type MarketApproachInput, type SynthesisInput } from '../display/calculation-table-generator';
import { ReportChartGenerator } from '../charts/chart-generator';
import { buildChartData } from '../charts/chart-data-builder';

interface YearlyFinancialData {
  year: number;
  revenue: number;
  pretax_income?: number;
  owner_compensation?: number;
  interest_expense?: number;
  depreciation_amortization?: number;
  non_cash_expenses?: number;
  cash?: number;
  accounts_receivable?: number;
  inventory?: number;
  other_current_assets?: number;
  fixed_assets?: number;
  total_assets?: number;
  accounts_payable?: number;
  other_short_term_liabilities?: number;
  bank_loans?: number;
  other_long_term_liabilities?: number;
  total_liabilities?: number;
}

interface ReportData {
  // Valuation outputs
  valuation_amount?: number;
  asset_approach_value?: number;
  income_approach_value?: number;
  market_approach_value?: number;
  valuation_range_low?: number;
  valuation_range_high?: number;

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

  // Multi-year financial data for KPI trends
  yearly_financials?: YearlyFinancialData[];

  // Risk assessment data
  risk_score?: number;
  risk_level?: string;
  risk_factors?: Array<{
    category: string;
    rating: string;
    score: number;
    description: string;
  }>;

  // Industry benchmarks
  industry_benchmarks?: Record<string, number>;

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
  async generate(companyName: string, reportData: ReportData, generatedDate: string, accessor?: ValuationDataAccessor): Promise<Buffer> {
    console.log('[PDF] Generating professional PDF...');

    // PRD-A: Check for accessor attached to report data
    // Handle both class instances and plain objects (deserialized from JSON)
    if (!accessor && (reportData as any)._dataAccessor) {
      const raw = (reportData as any)._dataAccessor;
      if (typeof raw.getRevenue === 'function') {
        // Already a proper class instance
        accessor = raw as ValuationDataAccessor;
      } else if (raw.store) {
        // Plain object from JSON deserialization — reconstruct class instance
        try {
          accessor = createDataAccessor(raw.store);
          console.log('[PDF] Reconstructed DataAccessor from serialized store');
        } catch (e) {
          console.warn('[PDF] Failed to reconstruct DataAccessor from store:', e);
        }
      }
    }

    try {
      // Prepare financial data for KPI calculations
      // PRD-A: Use accessor as single source of truth when available
      const currentYearData: FinancialData = {
        revenue: accessor?.getRevenue() || reportData.annual_revenue || 0,
        pretax_income: accessor?.getNetIncome() || reportData.pretax_income,
        owner_compensation: accessor?.getOfficerCompensation() || reportData.owner_compensation,
        interest_expense: accessor?.getInterestExpense() || reportData.interest_expense,
        depreciation_amortization: accessor?.getDepreciation() || reportData.depreciation_amortization || reportData.non_cash_expenses,
        non_cash_expenses: reportData.non_cash_expenses,
        one_time_expenses: reportData.one_time_expenses,
        one_time_revenues: reportData.one_time_revenues,
        cash: accessor?.getCash() || reportData.cash,
        accounts_receivable: accessor?.getAccountsReceivable() || reportData.accounts_receivable,
        inventory: accessor?.getInventory() || reportData.inventory,
        other_current_assets: reportData.other_current_assets,
        fixed_assets: accessor?.getFixedAssets() || reportData.fixed_assets,
        intangible_assets: accessor?.getIntangibleAssets() || reportData.intangible_assets,
        total_assets: accessor?.getTotalAssets() || reportData.total_assets,
        accounts_payable: reportData.accounts_payable,
        other_short_term_liabilities: reportData.other_short_term_liabilities,
        bank_loans: reportData.bank_loans,
        other_long_term_liabilities: reportData.other_long_term_liabilities,
        total_liabilities: accessor?.getTotalLiabilities() || reportData.total_liabilities,
      };

      // Calculate KPIs
      const kpis = calculateKPIs(currentYearData);

      // Generate Puppeteer-based charts (existing)
      const charts = await this.generateCharts(reportData, kpis);

      // PRD-D: Generate inline SVG charts if accessor is available
      let inlineSvgCharts: {
        revenueTrend?: string;
        sdeEbitdaTrend?: string;
        valuationComparison?: string;
        riskGauge?: string;
        profitabilityTrend?: string;
        kpiBenchmark?: string;
      } = {};
      if (accessor) {
        try {
          const chartGen = new ReportChartGenerator();
          const chartData = buildChartData(accessor);

          if (chartData.revenueTrend.values.length > 0) {
            inlineSvgCharts.revenueTrend = chartGen.generateRevenueTrendChart(
              chartData.revenueTrend.labels, chartData.revenueTrend.values
            );
          }
          if (chartData.sdeTrend.values.length > 0 && chartData.ebitdaTrend.values.length > 0) {
            inlineSvgCharts.sdeEbitdaTrend = chartGen.generateSDEEBITDATrendChart(
              chartData.sdeTrend.labels, chartData.sdeTrend.values, chartData.ebitdaTrend.values
            );
          }
          if (chartData.valuationComparison.approaches.length > 0) {
            inlineSvgCharts.valuationComparison = chartGen.generateValuationComparisonChart(
              chartData.valuationComparison.approaches, chartData.valuationComparison.finalValue
            );
          }
          inlineSvgCharts.riskGauge = chartGen.generateRiskGaugeChart(
            chartData.riskScore, chartData.riskScore <= 3 ? 'Low' : chartData.riskScore <= 6 ? 'Moderate' : 'High'
          );
          if (chartData.profitabilityTrend.labels.length > 0) {
            inlineSvgCharts.profitabilityTrend = chartGen.generateProfitabilityTrendChart(
              chartData.profitabilityTrend.labels,
              chartData.profitabilityTrend.margins.gross,
              chartData.profitabilityTrend.margins.sde,
              chartData.profitabilityTrend.margins.ebitda
            );
          }
          console.log('[PDF] Inline SVG charts generated successfully');
        } catch (chartErr) {
          console.warn('[PDF] Inline SVG chart generation failed (non-blocking):', chartErr);
        }
      }

      // PRD-E: Generate citation bibliography
      let bibliographyHTML = '';
      const citationManager = new CitationManager();
      try {
        const currentYear = new Date().getFullYear();
        citationManager.cite('BBS', currentYear, 'Market transaction data for SDE multiples');
        citationManager.cite('BRG', currentYear, 'Industry-specific pricing rules of thumb');
        citationManager.cite('RMA', currentYear, 'Industry financial ratio benchmarks');
        citationManager.cite('NYU', currentYear, 'Risk-free rate and equity risk premium data');
        citationManager.cite('PRATT', currentYear, 'Private company transaction comparables');
        citationManager.cite('DM', currentYear, 'M&A transaction database for market approach');
        citationManager.cite('IRS', currentYear, 'Tax return financial data verification');
        citationManager.cite('BEA', currentYear, 'GDP and economic condition indicators');
        citationManager.cite('SBA', currentYear, 'Small business industry statistics');
        citationManager.cite('IBIS', currentYear, 'Industry market analysis and trends');

        const bibMarkdown = citationManager.generateBibliography();
        const allCitations = citationManager.getAllCitations();
        bibliographyHTML = `
          <div class="section" style="page-break-before: always;">
            <h1 class="section-title">Sources and References</h1>
            <p style="margin-bottom: 20px;">This report references the following authoritative sources. Inline citations are marked with brackets (e.g., [BBS-${currentYear}]) throughout the report.</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 10pt;">
              <thead><tr style="background: #0066CC; color: white;">
                <th style="padding: 10px; text-align: left;">Citation</th>
                <th style="padding: 10px; text-align: left;">Source</th>
                <th style="padding: 10px; text-align: left;">Context</th>
              </tr></thead>
              <tbody>
                ${allCitations.map((c, i) => `
                  <tr style="background: ${i % 2 === 0 ? '#F9F9F9' : 'white'};">
                    <td style="padding: 8px; font-weight: bold;">${c.inline}</td>
                    <td style="padding: 8px;">${citationManager.getSource(c.source_code)?.name || c.source_code} (${c.year})</td>
                    <td style="padding: 8px; color: #666;">${c.context}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>`;
        console.log(`[PDF] Generated bibliography with ${allCitations.length} citations`);
      } catch (bibErr) {
        console.warn('[PDF] Bibliography generation failed (non-blocking):', bibErr);
      }

      // PRD-E: Generate calculation tables
      let sdeTableHTML = '';
      let marketTableHTML = '';
      let synthesisTableHTML = '';
      if (accessor) {
        try {
          const tableGen = new CalculationTableGenerator();

          // SDE Table
          const sdeInput: SDETableInput = {
            period: accessor.getSDEByYear()[0]?.period || new Date().getFullYear().toString(),
            starting_net_income: accessor.getNetIncome(),
            add_backs: [
              { description: 'Officer Compensation', amount: accessor.getOfficerCompensation(), source: 'Tax Return' },
              { description: 'Interest Expense', amount: accessor.getInterestExpense(), source: 'Tax Return' },
              { description: 'Depreciation & Amortization', amount: accessor.getDepreciation() + accessor.getAmortization(), source: 'Tax Return' },
            ].filter(a => a.amount > 0),
            total_sde: accessor.getSDE(),
          };
          const sdeTable = tableGen.generateSDETable(sdeInput);
          sdeTableHTML = tableGen.toHTML(sdeTable);

          // Market Approach Table
          const marketInput: MarketApproachInput = {
            benefit_stream: 'SDE',
            benefit_stream_value: accessor.getWeightedSDE(),
            industry: accessor.getIndustry(),
            naics_code: accessor.getNAICSCode(),
            multiple_range: { low: 1.5, median: 2.5, high: 3.5, source: 'BizBuySell / Business Reference Guide' },
            selected_multiple: accessor.getSDEMultiple(),
            multiple_position: 'Industry-Adjusted',
            justification: 'Based on company size, growth trajectory, and risk profile relative to industry peers',
            adjustments: [],
            final_multiple: accessor.getSDEMultiple(),
            calculated_value: accessor.getMarketApproachValue(),
          };
          const marketTable = tableGen.generateMarketApproachTable(marketInput);
          marketTableHTML = tableGen.toHTML(marketTable);

          // Synthesis Table
          const synthInput: SynthesisInput = {
            approaches: [
              { name: 'Asset Approach', value: accessor.getAssetApproachValue(), weight: accessor.getAssetWeight() },
              { name: 'Income Approach', value: accessor.getIncomeApproachValue(), weight: accessor.getIncomeWeight() },
              { name: 'Market Approach', value: accessor.getMarketApproachValue(), weight: accessor.getMarketWeight() },
            ],
            preliminary_value: accessor.getPreliminaryValue(),
            discounts: accessor.isDLOMApplied() ? [
              { name: 'Discount for Lack of Marketability (DLOM)', percentage: accessor.getDLOMPercentage(), amount: Math.round(accessor.getPreliminaryValue() * accessor.getDLOMPercentage()) },
            ] : [],
            final_value: accessor.getFinalValue(),
            value_range: { low: accessor.getValueRangeLow(), high: accessor.getValueRangeHigh() },
          };
          const synthTable = tableGen.generateSynthesisTable(synthInput);
          synthesisTableHTML = tableGen.toHTML(synthTable);

          console.log('[PDF] Calculation tables generated successfully');
        } catch (tableErr) {
          console.warn('[PDF] Calculation table generation failed (non-blocking):', tableErr);
        }
      }

      // Calculate enterprise and liquidation values
      // PRD-A: Use accessor when available
      const enterprise_value = accessor
        ? accessor.getEnterpriseValue()
        : this.calculateEnterpriseValue(reportData);
      const liquidation_value = accessor
        ? accessor.getLiquidationValue()
        : this.calculateLiquidationValue(reportData);

      // Generate detailed KPI pages
      const kpiDetailPages = await this.generateDetailedKPIPages(reportData);

      // Build HTML with all PRD enhancements
      const html = await this.buildHTML(
        companyName, reportData, generatedDate, kpis,
        enterprise_value, liquidation_value, charts, kpiDetailPages,
        accessor, inlineSvgCharts, citationManager, bibliographyHTML,
        sdeTableHTML, marketTableHTML, synthesisTableHTML
      );

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
   * Generate charts using Puppeteer + Chart.js
   */
  private async generateCharts(
    reportData: ReportData,
    kpis: any
  ): Promise<{
    valuation?: string;
    financialMetrics?: string;
    kpiPerformance?: string;
    financialTrend?: string;
    riskGauge?: string;
    valueMap?: string;
  }> {
    const charts: {
      valuation?: string;
      financialMetrics?: string;
      kpiPerformance?: string;
      financialTrend?: string;
      riskGauge?: string;
      valueMap?: string;
    } = {};

    try {
      console.log('[PDF] Generating charts...');

      // Valuation approaches chart
      if (reportData.asset_approach_value && reportData.income_approach_value && reportData.market_approach_value) {
        console.log('[PDF] Generating valuation chart...');
        const valuationData: ValuationChartData = {
          asset: reportData.asset_approach_value,
          income: reportData.income_approach_value,
          market: reportData.market_approach_value,
        };
        charts.valuation = await generateValuationChart(valuationData);
        console.log('[PDF] Valuation chart generated:', charts.valuation ? 'success' : 'failed');
      }

      // KPI performance chart
      if (kpis) {
        console.log('[PDF] Generating KPI chart...');
        const kpiData: KPIChartData[] = [
          { name: 'Cash Flow/Revenue', companyValue: (kpis.cash_flow_to_revenue || 0) * 100, industryBenchmark: 15 },
          { name: 'Cash/Revenue', companyValue: (kpis.cash_to_revenue || 0) * 100, industryBenchmark: 10 },
          { name: 'Fixed Assets/Revenue', companyValue: (kpis.fixed_assets_to_revenue || 0) * 100, industryBenchmark: 20 },
          { name: 'Total Debt/Revenue', companyValue: (kpis.total_debt_to_revenue || 0) * 100, industryBenchmark: 30 },
          { name: 'Current Ratio', companyValue: (kpis.current_ratio || 0) * 100, industryBenchmark: 150 },
          { name: 'Debt/Equity', companyValue: Math.abs(kpis.debt_to_equity || 0) * 100, industryBenchmark: 100 },
        ];
        charts.kpiPerformance = await generateKPIChart(kpiData);
        console.log('[PDF] KPI chart generated:', charts.kpiPerformance ? 'success' : 'failed');
      }

      // Financial trend chart (if multi-year data available)
      if (reportData.yearly_financials && reportData.yearly_financials.length > 1) {
        console.log('[PDF] Generating financial trend chart...');
        const sortedYears = [...reportData.yearly_financials].sort((a, b) => a.year - b.year);
        const trendData: FinancialTrendChartData = {
          years: sortedYears.map(y => y.year.toString()),
          datasets: [
            {
              label: 'Revenue',
              data: sortedYears.map(y => y.revenue),
              color: 'rgba(54, 162, 235, 1)',
            },
            {
              label: 'Pretax Income',
              data: sortedYears.map(y => y.pretax_income || 0),
              color: 'rgba(75, 192, 192, 1)',
            },
          ],
        };
        charts.financialTrend = await generateFinancialTrendChart(trendData);
        console.log('[PDF] Financial trend chart generated:', charts.financialTrend ? 'success' : 'failed');
      }

      // Risk gauge chart
      if (reportData.risk_score !== undefined) {
        console.log('[PDF] Generating risk gauge...');
        const riskData: RiskGaugeData = {
          score: reportData.risk_score,
          label: reportData.risk_level || this.getRiskLabel(reportData.risk_score),
        };
        charts.riskGauge = await generateRiskGauge(riskData);
        console.log('[PDF] Risk gauge generated:', charts.riskGauge ? 'success' : 'failed');
      }

      // Value map chart
      if (reportData.valuation_amount && reportData.valuation_range_low && reportData.valuation_range_high) {
        console.log('[PDF] Generating value map...');
        const valueMapData: ValueMapData = {
          lowValue: reportData.valuation_range_low,
          midValue: reportData.valuation_amount,
          highValue: reportData.valuation_range_high,
          companyValue: reportData.valuation_amount,
          industryLow: reportData.valuation_range_low * 0.85,
          industryHigh: reportData.valuation_range_high * 1.15,
        };
        charts.valueMap = await generateValueMap(valueMapData);
        console.log('[PDF] Value map generated:', charts.valueMap ? 'success' : 'failed');
      }

    } catch (error) {
      console.error('[PDF] Chart generation error:', error);
    }

    return charts;
  }

  /**
   * Get risk label from score
   */
  private getRiskLabel(score: number): string {
    if (score <= 3) return 'Low Risk';
    if (score <= 5) return 'Moderate Risk';
    if (score <= 7) return 'Elevated Risk';
    return 'High Risk';
  }

  /**
   * Generate detailed KPI pages with charts
   */
  private async generateDetailedKPIPages(reportData: ReportData): Promise<string> {
    console.log('[PDF] Generating detailed KPI pages...');

    // Prepare yearly financial data for KPI calculations
    let yearlyData: { year: number; data: FinancialData }[] = [];

    if (reportData.yearly_financials && reportData.yearly_financials.length > 0) {
      yearlyData = reportData.yearly_financials.map(yf => ({
        year: yf.year,
        data: {
          revenue: yf.revenue,
          pretax_income: yf.pretax_income,
          owner_compensation: yf.owner_compensation,
          interest_expense: yf.interest_expense,
          depreciation_amortization: yf.depreciation_amortization || yf.non_cash_expenses,
          cash: yf.cash,
          accounts_receivable: yf.accounts_receivable,
          inventory: yf.inventory,
          other_current_assets: yf.other_current_assets,
          fixed_assets: yf.fixed_assets,
          total_assets: yf.total_assets,
          accounts_payable: yf.accounts_payable,
          other_short_term_liabilities: yf.other_short_term_liabilities,
          bank_loans: yf.bank_loans,
          other_long_term_liabilities: yf.other_long_term_liabilities,
          total_liabilities: yf.total_liabilities,
        },
      }));
    } else {
      // Fall back to current year data if no historical data
      const currentYear = new Date().getFullYear();
      yearlyData = [{
        year: currentYear,
        data: {
          revenue: reportData.annual_revenue || 0,
          pretax_income: reportData.pretax_income,
          owner_compensation: reportData.owner_compensation,
          interest_expense: reportData.interest_expense,
          depreciation_amortization: reportData.depreciation_amortization || reportData.non_cash_expenses,
          cash: reportData.cash,
          accounts_receivable: reportData.accounts_receivable,
          inventory: reportData.inventory,
          other_current_assets: reportData.other_current_assets,
          fixed_assets: reportData.fixed_assets,
          total_assets: reportData.total_assets,
          accounts_payable: reportData.accounts_payable,
          other_short_term_liabilities: reportData.other_short_term_liabilities,
          bank_loans: reportData.bank_loans,
          other_long_term_liabilities: reportData.other_long_term_liabilities,
          total_liabilities: reportData.total_liabilities,
        },
      }];
    }

    // Calculate detailed KPIs
    const detailedKPIs = calculateDetailedKPIs(yearlyData, reportData.industry_benchmarks);

    // Generate HTML pages for each KPI
    try {
      const kpiPagesHTML = await generateAllKPIDetailPages(detailedKPIs);
      console.log('[PDF] Generated detailed KPI pages successfully');
      return kpiPagesHTML;
    } catch (error) {
      console.error('[PDF] Error generating KPI detail pages:', error);
      return '';
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
   * First checks if Pass 7 provided a liquidation value, then falls back to calculation
   */
  private calculateLiquidationValue(reportData: ReportData): number | null {
    // First try to use the liquidation value from Pass 7 (if available)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = reportData as any;
    if (data.liquidation_value && typeof data.liquidation_value === 'number' && data.liquidation_value > 0) {
      return data.liquidation_value;
    }

    // Fallback: Calculate from balance sheet components
    if (!reportData.total_assets) return null;

    // Liquidation value is typically 50-70% of asset value
    const cash = reportData.cash || 0;
    const ar = (reportData.accounts_receivable || 0) * 0.7; // 70% recovery
    const inventory = (reportData.inventory || 0) * 0.5; // 50% recovery
    const fixedAssets = (reportData.fixed_assets || 0) * 0.4; // 40% recovery
    const liabilities = reportData.total_liabilities || 0;

    const calculated = cash + ar + inventory + fixedAssets - liabilities;

    // If calculated is negative or zero, try using asset_approach_value as fallback
    if (calculated <= 0 && data.asset_approach_value && data.asset_approach_value > 0) {
      return Math.round(data.asset_approach_value * 0.65);
    }

    return Math.max(0, calculated);
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
    liquidation_value: number | null,
    charts: {
      valuation?: string;
      financialMetrics?: string;
      kpiPerformance?: string;
      financialTrend?: string;
      riskGauge?: string;
      valueMap?: string;
    },
    kpiDetailPages: string = '',
    accessor?: ValuationDataAccessor,
    inlineSvgCharts?: {
      revenueTrend?: string;
      sdeEbitdaTrend?: string;
      valuationComparison?: string;
      riskGauge?: string;
      profitabilityTrend?: string;
      kpiBenchmark?: string;
    },
    citationManager?: CitationManager,
    bibliographyHTML: string = '',
    sdeTableHTML: string = '',
    marketTableHTML: string = '',
    synthesisTableHTML: string = ''
  ): Promise<string> {
    // Format currency - distinguish between 0 (actual zero) and null/undefined (not extracted)
    // PRD-A: Use accessor formatting when available
    const fmt = (val: number | null | undefined) => {
      if (val === null || val === undefined) return 'N/A';
      if (val === 0) return '$0';
      return `$${Math.round(val).toLocaleString()}`;
    };

    // PRD-A: Override values with accessor when available
    const fv = accessor ? accessor.getFinalValue() : reportData.valuation_amount;
    const av = accessor ? accessor.getAssetApproachValue() : reportData.asset_approach_value;
    const iv = accessor ? accessor.getIncomeApproachValue() : reportData.income_approach_value;
    const mv = accessor ? accessor.getMarketApproachValue() : reportData.market_approach_value;
    const rev = accessor ? accessor.getRevenue() : reportData.annual_revenue;
    const sde = accessor ? accessor.getSDE() : null;
    const wSDE = accessor ? accessor.getWeightedSDE() : null;
    const ebitda = accessor ? accessor.getEBITDA() : null;

    // PRD-E: Citation inline reference helper
    const citeYear = new Date().getFullYear();
    const citeInline = (code: string) => citationManager ? `<sup style="color: #0066CC; font-size: 8pt;">[${code}-${citeYear}]</sup>` : '';

    // Helper to extract string content from either string or object with content property
    const getContent = (value: unknown): string => {
      if (!value) return '';
      if (typeof value === 'string') return value;
      if (typeof value === 'object' && value !== null && 'content' in value) {
        return (value as { content: string }).content || '';
      }
      return '';
    };

    // Convert markdown to HTML for narratives
    // Handle both string format and object format { content: string, word_count_target: number }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = reportData as any;
    const narratives = data.narratives || {};

    const execContent = getContent(data.executive_summary) || getContent(narratives.executive_summary);
    const execSummary = execContent ? await marked(execContent) : '<p>No executive summary available.</p>';

    const companyContent = getContent(data.company_profile) || getContent(narratives.company_overview);
    const companyProfile = companyContent ? await marked(companyContent) : '';

    const industryContent = getContent(data.industry_analysis) || getContent(narratives.industry_analysis);
    const industryAnalysis = industryContent ? await marked(industryContent) : '';

    const financialContent = getContent(data.financial_analysis) || getContent(narratives.financial_analysis);
    const financialAnalysis = financialContent ? await marked(financialContent) : '';

    const assetContent = getContent(data.asset_approach_analysis) || getContent(narratives.asset_approach_narrative);
    const assetAnalysis = assetContent ? await marked(assetContent) : '';

    const incomeContent = getContent(data.income_approach_analysis) || getContent(narratives.income_approach_narrative);
    const incomeAnalysis = incomeContent ? await marked(incomeContent) : '';

    const marketContent = getContent(data.market_approach_analysis) || getContent(narratives.market_approach_narrative);
    const marketAnalysis = marketContent ? await marked(marketContent) : '';

    const reconContent = getContent(data.valuation_reconciliation) || getContent(narratives.valuation_synthesis) || getContent(narratives.valuation_synthesis_narrative);
    const valuationRecon = reconContent ? await marked(reconContent) : '';

    const riskContent = getContent(data.risk_assessment) || getContent(narratives.risk_assessment);
    const riskAssessment = riskContent ? await marked(riskContent) : '';

    const strategicContent = getContent(data.strategic_insights) || getContent(narratives.value_enhancement_recommendations);
    const strategicInsights = strategicContent ? await marked(strategicContent) : '';

    const assumptionsContent = getContent(data.assumptions_limiting_conditions) || getContent(narratives.assumptions_limiting_conditions);
    const assumptionsLimitingConditions = assumptionsContent ? await marked(assumptionsContent) : '';

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
    ${(() => {
      // Calculate dynamic page numbers based on included sections
      // Page 1: Cover, Page 2: TOC
      let pageNum = 3;
      const tocItems: string[] = [];

      // Fixed sections (always present)
      tocItems.push(`<div class="toc-item"><span>Your Valuation</span><span>${pageNum}</span></div>`);
      pageNum += 2; // Your Valuation takes ~2 pages

      tocItems.push(`<div class="toc-item"><span>Financial Summary</span><span>${pageNum}</span></div>`);
      pageNum += 2; // Financial Summary takes ~2 pages

      tocItems.push(`<div class="toc-item"><span>Key Performance Indicators</span><span>${pageNum}</span></div>`);
      pageNum += 2; // KPIs take ~2 pages

      // Financial Trends (if available)
      if (charts.financialTrend) {
        tocItems.push(`<div class="toc-item"><span>Financial Performance Trends</span><span>${pageNum}</span></div>`);
        pageNum += 1;
      }

      // KPI Detail Pages (13 KPIs, approximately 1 page each)
      if (kpiDetailPages && kpiDetailPages.length > 0) {
        tocItems.push(`<div class="toc-item"><span>Detailed KPI Analysis</span><span>${pageNum}</span></div>`);
        // Add sub-items for major KPI categories
        tocItems.push(`<div class="toc-item" style="padding-left: 20px;"><span style="color: #666;">- Profitability Metrics</span><span>${pageNum}</span></div>`);
        pageNum += 5; // ~5 profitability KPIs
        tocItems.push(`<div class="toc-item" style="padding-left: 20px;"><span style="color: #666;">- Liquidity Metrics</span><span>${pageNum}</span></div>`);
        pageNum += 2; // 2 liquidity KPIs
        tocItems.push(`<div class="toc-item" style="padding-left: 20px;"><span style="color: #666;">- Efficiency Metrics</span><span>${pageNum}</span></div>`);
        pageNum += 3; // 3 efficiency KPIs
        tocItems.push(`<div class="toc-item" style="padding-left: 20px;"><span style="color: #666;">- Leverage Metrics</span><span>${pageNum}</span></div>`);
        pageNum += 1; // 1 leverage KPI
        tocItems.push(`<div class="toc-item" style="padding-left: 20px;"><span style="color: #666;">- Growth Metrics</span><span>${pageNum}</span></div>`);
        pageNum += 2; // growth + SDE/Revenue
      }

      tocItems.push(`<div class="toc-item"><span>Executive Summary</span><span>${pageNum}</span></div>`);
      pageNum += 3; // Executive Summary takes ~3 pages (long content)

      // Conditional sections
      if (companyProfile) {
        tocItems.push(`<div class="toc-item"><span>Company Profile</span><span>${pageNum}</span></div>`);
        pageNum += 2;
      }
      if (industryAnalysis) {
        tocItems.push(`<div class="toc-item"><span>Industry Analysis</span><span>${pageNum}</span></div>`);
        pageNum += 2;
      }
      if (financialAnalysis) {
        tocItems.push(`<div class="toc-item"><span>Financial Analysis</span><span>${pageNum}</span></div>`);
        pageNum += 2;
      }
      if (assetAnalysis) {
        tocItems.push(`<div class="toc-item"><span>Asset Approach</span><span>${pageNum}</span></div>`);
        pageNum += 2;
      }
      if (incomeAnalysis) {
        tocItems.push(`<div class="toc-item"><span>Income Approach</span><span>${pageNum}</span></div>`);
        pageNum += 2;
      }
      if (marketAnalysis) {
        tocItems.push(`<div class="toc-item"><span>Market Approach</span><span>${pageNum}</span></div>`);
        pageNum += 2;
      }
      if (valuationRecon) {
        tocItems.push(`<div class="toc-item"><span>Valuation Reconciliation</span><span>${pageNum}</span></div>`);
        pageNum += 2;
      }
      if (riskAssessment || charts.riskGauge) {
        tocItems.push(`<div class="toc-item"><span>Risk Assessment</span><span>${pageNum}</span></div>`);
        pageNum += 2;
      }
      if (strategicInsights) {
        tocItems.push(`<div class="toc-item"><span>Strategic Insights</span><span>${pageNum}</span></div>`);
        pageNum += 2;
      }
      if (assumptionsLimitingConditions) {
        tocItems.push(`<div class="toc-item"><span>Assumptions & Limiting Conditions</span><span>${pageNum}</span></div>`);
      }

      return tocItems.join('\n    ');
    })()}
  </div>

  <!-- Your Valuation -->
  <div class="section">
    <h1 class="section-title">Your Valuation</h1>
    
    <h2>${companyName}</h2>
    ${reportData.industry_name ? `<p><strong>Industry:</strong> ${reportData.naics_code ? `${reportData.naics_code} - ` : ''}${reportData.industry_name}</p>` : ''}
    
    <div class="value-card">
      <div class="value-label">Equity Value (Fair Market Value)</div>
      <div class="value-amount">${fmt(fv)}</div>
      <div class="value-subtitle">Based on Weighted Average of Three Approaches${citeInline('BRG')}</div>
    </div>

          <h2>Valuation Approaches</h2>
          ${inlineSvgCharts?.valuationComparison ? `<div style="margin: 20px 0; text-align: center;">${inlineSvgCharts.valuationComparison}</div>` : ''}
          ${charts.valuation ? `<div class="chart-container"><img src="${charts.valuation}" alt="Valuation Approaches Chart" style="max-width: 100%; height: auto;"/></div>` : ''}
          <table class="financial-table">
            <thead>
              <tr>
                <th>Approach</th>
                <th>Value</th>
                <th>Weight</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Asset Approach</td>
                <td>${fmt(av)}</td>
                <td>${accessor ? `${(accessor.getAssetWeight() * 100).toFixed(0)}%` : '20%'}</td>
              </tr>
              <tr>
                <td>Income Approach${citeInline('NYU')}</td>
                <td>${fmt(iv)}</td>
                <td>${accessor ? `${(accessor.getIncomeWeight() * 100).toFixed(0)}%` : '40%'}</td>
              </tr>
              <tr>
                <td>Market Approach${citeInline('BBS')}</td>
                <td>${fmt(mv)}</td>
                <td>${accessor ? `${(accessor.getMarketWeight() * 100).toFixed(0)}%` : '40%'}</td>
              </tr>
            </tbody>
          </table>
          ${synthesisTableHTML ? `<h3>Value Synthesis Detail</h3>${synthesisTableHTML}` : ''}
    
    <div class="three-col">
      <div class="col">
        <div class="col-title">Asset Sale Value</div>
        <div class="col-value">${fmt(av)}</div>
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

    ${accessor ? `
    <div style="margin-top: 20px; padding: 15px; background: #F5F5F5; border-radius: 8px;">
      <h3 style="margin-top: 0; color: #0066CC;">Key Financial Metrics</h3>
      <table style="width: 100%; font-size: 10pt;">
        <tr><td>Normalized SDE</td><td style="text-align: right; font-weight: bold;">${accessor.getWeightedSDEFormatted()}</td></tr>
        <tr><td>SDE Multiple Applied</td><td style="text-align: right; font-weight: bold;">${accessor.getSDEMultipleFormatted()} ${citeInline('BBS')}</td></tr>
        <tr><td>Capitalization Rate</td><td style="text-align: right; font-weight: bold;">${accessor.getCapRateFormatted()} ${citeInline('NYU')}</td></tr>
        <tr><td>Value Range</td><td style="text-align: right; font-weight: bold;">${accessor.getValueRangeFormatted()}</td></tr>
      </table>
    </div>
    ` : ''}

    ${charts.valueMap ? `
    <h2 style="margin-top: 40px;">Valuation Range Overview</h2>
    <div style="margin: 20px 0; text-align: center;">
      <img src="${charts.valueMap}" alt="Value Map" style="max-width: 100%; height: auto;"/>
    </div>
    ` : ''}
  </div>

  <!-- Financial Summary -->
  <div class="section">
    <h1 class="section-title">Financial Summary</h1>

    ${inlineSvgCharts?.revenueTrend ? `
    <h2>Revenue Trend</h2>
    <div style="margin: 20px 0; text-align: center;">${inlineSvgCharts.revenueTrend}</div>
    ` : ''}

    <h2>${new Date().getFullYear()} ${citeInline('IRS')}</h2>

    <div class="financial-table">
      <div class="financial-section">
        <h3>Income</h3>
        <table>
          <tr><td>Revenue</td><td style="text-align: right; font-weight: bold;">${fmt(rev)}</td></tr>
          <tr><td>Pretax Income</td><td style="text-align: right;">${fmt(accessor?.getNetIncome() ?? reportData.pretax_income)}</td></tr>
          <tr><td>Officer Compensation</td><td style="text-align: right;">${fmt(accessor?.getOfficerCompensation() ?? reportData.owner_compensation)}</td></tr>
          <tr><td>Interest Expense</td><td style="text-align: right;">${fmt(accessor?.getInterestExpense() ?? reportData.interest_expense)}</td></tr>
          <tr><td>Non-Cash Expenses</td><td style="text-align: right;">${fmt(accessor?.getDepreciation() ?? reportData.non_cash_expenses ?? reportData.depreciation_amortization)}</td></tr>
          ${accessor && sde ? `<tr style="background: #E8F5E9;"><td><strong>Seller's Discretionary Earnings (SDE)</strong></td><td style="text-align: right; font-weight: bold;">${fmt(sde)}</td></tr>` : ''}
          ${accessor && ebitda ? `<tr style="background: #E3F2FD;"><td><strong>EBITDA</strong></td><td style="text-align: right; font-weight: bold;">${fmt(ebitda)}</td></tr>` : ''}
        </table>
      </div>

      ${sdeTableHTML ? `<div class="financial-section"><h3>SDE Calculation Detail</h3>${sdeTableHTML}</div>` : ''}

      ${inlineSvgCharts?.sdeEbitdaTrend ? `
      <div style="margin: 20px 0; text-align: center;">
        <h3>SDE & EBITDA Trends</h3>
        ${inlineSvgCharts.sdeEbitdaTrend}
      </div>
      ` : ''}
      
      <div class="financial-section">
        <h3>Assets</h3>
        <table>
          <tr><td>Cash</td><td style="text-align: right; font-weight: bold;">${fmt(accessor?.getCash() ?? reportData.cash)}</td></tr>
          <tr><td>Accounts Receivable</td><td style="text-align: right;">${fmt(accessor?.getAccountsReceivable() ?? reportData.accounts_receivable)}</td></tr>
          <tr><td>Inventory</td><td style="text-align: right;">${fmt(accessor?.getInventory() ?? reportData.inventory)}</td></tr>
          <tr><td>Other Current Assets</td><td style="text-align: right;">${fmt(reportData.other_current_assets)}</td></tr>
          <tr><td>Fixed Assets</td><td style="text-align: right;">${fmt(accessor?.getFixedAssets() ?? reportData.fixed_assets)}</td></tr>
          <tr><td>Intangible Assets</td><td style="text-align: right;">${fmt(accessor?.getIntangibleAssets() ?? reportData.intangible_assets)}</td></tr>
          <tr><td><strong>Total Assets</strong></td><td style="text-align: right; font-weight: bold;">${fmt(accessor?.getTotalAssets() ?? reportData.total_assets)}</td></tr>
        </table>
      </div>

      <div class="financial-section">
        <h3>Liabilities</h3>
        <table>
          <tr><td>Accounts Payable</td><td style="text-align: right;">${fmt(reportData.accounts_payable)}</td></tr>
          <tr><td>Other Short-Term Liabilities</td><td style="text-align: right;">${fmt(reportData.other_short_term_liabilities)}</td></tr>
          <tr><td>Bank Loans</td><td style="text-align: right;">${fmt(reportData.bank_loans)}</td></tr>
          <tr><td>Other Long-Term Liabilities</td><td style="text-align: right;">${fmt(reportData.other_long_term_liabilities)}</td></tr>
          <tr><td><strong>Total Liabilities</strong></td><td style="text-align: right; font-weight: bold;">${fmt(accessor?.getTotalLiabilities() ?? reportData.total_liabilities)}</td></tr>
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
    
    ${charts.kpiPerformance ? `
    <h2 style="margin-top: 40px;">KPI Performance Analysis</h2>
    <div class="chart-container">
      <img src="${charts.kpiPerformance}" alt="KPI Performance Chart" style="max-width: 100%; height: auto; margin: 20px 0;"/>
    </div>
    ` : ''}
  </div>

  <!-- Financial Trends -->
  ${charts.financialTrend ? `
  <div class="section">
    <h1 class="section-title">Financial Performance Trends</h1>
    <p>This section presents the historical financial performance trends of ${companyName}, illustrating the trajectory of key financial metrics over the analyzed period.</p>
    <div style="margin: 30px 0; text-align: center;">
      <img src="${charts.financialTrend}" alt="Financial Trends Chart" style="max-width: 100%; height: auto;"/>
    </div>
    <div class="value-card">
      <p style="margin: 0; font-size: 11pt;">Financial trends provide critical context for valuation multiples. Consistent growth supports premium valuations, while volatility may warrant discounts. The chart above illustrates the company's historical performance and trajectory.</p>
    </div>
  </div>
  ` : ''}

  <!-- KPI Detail Pages -->
  ${kpiDetailPages}

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
    ${inlineSvgCharts?.profitabilityTrend ? `
    <h2>Profitability Trends</h2>
    <div style="margin: 20px 0; text-align: center;">${inlineSvgCharts.profitabilityTrend}</div>
    ` : ''}
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
    ${marketTableHTML ? `<div style="margin-bottom: 30px;">${marketTableHTML}</div>` : ''}
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

  ${riskAssessment || charts.riskGauge || inlineSvgCharts?.riskGauge ? `
  <div class="section">
    <h1 class="section-title">Risk Assessment</h1>

    ${inlineSvgCharts?.riskGauge || charts.riskGauge ? `
    <div style="display: flex; gap: 40px; align-items: flex-start; margin-bottom: 30px;">
      <div style="flex: 0 0 auto;">
        ${inlineSvgCharts?.riskGauge ? inlineSvgCharts.riskGauge : `<img src="${charts.riskGauge}" alt="Risk Score Gauge" style="max-width: 400px; height: auto;"/>`}
      </div>
      <div style="flex: 1;">
        <h2 style="margin-top: 0; color: #333;">Risk Profile Summary</h2>
        <p style="font-size: 11pt; line-height: 1.8; color: #444;">
          The overall risk score reflects a comprehensive assessment of factors that may impact the business's future performance and value. This includes operational risks, financial risks, market conditions, and company-specific considerations.
        </p>
        <div style="background: #F5F5F5; padding: 15px; border-radius: 8px; margin-top: 15px;">
          <p style="margin: 0; font-size: 10pt; color: #666;">
            <strong>Risk Score Interpretation:</strong><br/>
            1-3: Low Risk - Stable business with strong fundamentals<br/>
            4-5: Moderate Risk - Some areas require attention<br/>
            6-7: Elevated Risk - Notable concerns that may impact value<br/>
            8-10: High Risk - Significant challenges present
          </p>
        </div>
      </div>
    </div>
    ` : ''}

    ${reportData.risk_factors && reportData.risk_factors.length > 0 ? `
    <h2>Risk Factor Breakdown</h2>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 10pt;">
      <thead>
        <tr style="background: #0066CC; color: white;">
          <th style="padding: 12px; text-align: left;">Risk Category</th>
          <th style="padding: 12px; text-align: center;">Rating</th>
          <th style="padding: 12px; text-align: center;">Score</th>
          <th style="padding: 12px; text-align: left;">Description</th>
        </tr>
      </thead>
      <tbody>
        ${reportData.risk_factors.map((rf: any, idx: number) => `
          <tr style="background: ${idx % 2 === 0 ? '#F9F9F9' : 'white'};">
            <td style="padding: 10px 12px; font-weight: 500;">${rf.category}</td>
            <td style="padding: 10px 12px; text-align: center;">
              <span style="
                display: inline-block;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 9pt;
                font-weight: 600;
                background: ${rf.rating === 'Low' ? '#E8F5E9' : rf.rating === 'High' || rf.rating === 'Critical' ? '#FFEBEE' : '#FFF8E1'};
                color: ${rf.rating === 'Low' ? '#2E7D32' : rf.rating === 'High' || rf.rating === 'Critical' ? '#C62828' : '#F57F17'};
              ">${rf.rating}</span>
            </td>
            <td style="padding: 10px 12px; text-align: center; font-weight: bold;">${rf.score}/10</td>
            <td style="padding: 10px 12px; color: #666;">${rf.description}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ` : ''}

    ${riskAssessment ? `
    <h2>Detailed Risk Analysis</h2>
    <div class="narrative">
      ${riskAssessment}
    </div>
    ` : ''}
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

  ${assumptionsLimitingConditions ? `
  <div class="section">
    <h1 class="section-title">Assumptions & Limiting Conditions</h1>
    <div class="narrative">
      ${assumptionsLimitingConditions}
    </div>
  </div>
  ` : ''}

  ${bibliographyHTML}

</body>
</html>
    `;
  }
}
