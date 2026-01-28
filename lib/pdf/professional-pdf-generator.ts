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
import { safeString } from '../utils/safe-string';
import { generateTocEntries, PROFESSIONAL_SECTION_ORDER } from './section-ordering';
import { generateDesignTokenCSS } from './design-tokens';
import { CitationManager } from '../citations/citation-manager';
import { CalculationTableGenerator, type SDETableInput, type MarketApproachInput, type SynthesisInput, type CapRateBuiltupInput, type AssetAdjustmentInput } from '../display/calculation-table-generator';
import { DEFAULT_CAP_RATE_COMPONENTS } from '../calculations/income-approach-calculator';
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
      } else {
        console.warn('[PDF] _dataAccessor found but is not a valid class instance or serialized store. Keys:', Object.keys(raw || {}).join(', '));
      }
    }

    // Runtime type check: if accessor exists, verify it has required methods
    if (accessor && typeof accessor.getRevenue !== 'function') {
      console.error(
        '[PDF] Invalid accessor: expected ValuationDataAccessor instance with methods, ' +
        `got ${typeof accessor} with keys: ${Object.keys(accessor || {}).join(', ')}. Falling back to reportData.`
      );
      accessor = undefined;
    }

    if (accessor) {
      console.log('[PDF] Using DataAccessor for financial values');
    } else {
      console.log('[PDF] No DataAccessor available, using reportData directly');
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
            <table class="data-table">
              <thead><tr>
                <th>Citation</th>
                <th>Source</th>
                <th>Context</th>
              </tr></thead>
              <tbody>
                ${allCitations.map((c, i) => `
                  <tr>
                    <td style="font-weight: bold;">${safeString(c.inline, '')}</td>
                    <td>${safeString(citationManager.getSource(c.source_code)?.name || c.source_code, '')} (${safeString(c.year, '')})</td>
                    <td style="color: #666;">${safeString(c.context, '')}</td>
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
      let capRateTableHTML = '';
      let assetTableHTML = '';
      let marketTableHTML = '';
      let synthesisTableHTML = '';
      if (accessor) {
        try {
          const tableGen = new CalculationTableGenerator();

          // SDE Table - comprehensive add-back breakdown with sources
          const sdeAddBacks: Array<{ description: string; amount: number; source: string }> = [
            { description: 'Officer Compensation', amount: accessor.getOfficerCompensation(), source: 'Tax Return Schedule C / W-2' },
            { description: 'Interest Expense', amount: accessor.getInterestExpense(), source: 'Tax Return' },
            { description: 'Depreciation', amount: accessor.getDepreciation(), source: 'Form 4562' },
            { description: 'Amortization', amount: accessor.getAmortization(), source: 'Form 4562' },
          ];
          // Include one-time/non-recurring expenses from reportData if available
          if (reportData.one_time_expenses && reportData.one_time_expenses > 0) {
            sdeAddBacks.push({ description: 'One-Time / Non-Recurring Expenses', amount: reportData.one_time_expenses, source: 'Owner Reported' });
          }
          const sdeInput: SDETableInput = {
            period: accessor.getSDEByYear()[0]?.period || new Date().getFullYear().toString(),
            starting_net_income: accessor.getNetIncome(),
            add_backs: sdeAddBacks.filter(a => a.amount > 0),
            total_sde: accessor.getSDE(),
          };
          const sdeTable = tableGen.generateSDETable(sdeInput);
          sdeTableHTML = tableGen.toHTML(sdeTable);

          // Cap Rate Buildup Table
          const finalCapRate = accessor.getCapRate();
          const capRateInput: CapRateBuiltupInput = {
            risk_free_rate: DEFAULT_CAP_RATE_COMPONENTS.risk_free_rate,
            equity_risk_premium: DEFAULT_CAP_RATE_COMPONENTS.equity_risk_premium,
            size_premium: DEFAULT_CAP_RATE_COMPONENTS.size_premium,
            industry_risk_premium: DEFAULT_CAP_RATE_COMPONENTS.industry_risk_premium,
            company_specific_risk_premium: DEFAULT_CAP_RATE_COMPONENTS.company_specific_risk_premium,
            long_term_growth_rate: DEFAULT_CAP_RATE_COMPONENTS.long_term_growth_rate,
            capitalization_rate: finalCapRate,
          };
          const capRateTable = tableGen.generateCapRateBuiltupTable(capRateInput);
          capRateTableHTML = tableGen.capRateBuiltupTableToHTML(capRateTable);

          // Asset Adjustment Table
          const otherAssets = Math.max(0, accessor.getTotalAssets() - accessor.getCash() - accessor.getAccountsReceivable() - accessor.getInventory() - accessor.getFixedAssets());
          const assetAdjInput: AssetAdjustmentInput = {
            cash: accessor.getCash(),
            accounts_receivable: accessor.getAccountsReceivable(),
            inventory: accessor.getInventory(),
            fixed_assets: accessor.getFixedAssets(),
            other_assets: otherAssets,
            total_assets: accessor.getTotalAssets(),
            total_liabilities: accessor.getTotalLiabilities(),
          };
          const assetAdjTable = tableGen.generateAssetAdjustmentTable(assetAdjInput);
          assetTableHTML = tableGen.assetAdjustmentTableToHTML(assetAdjTable);

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
      let html = await this.buildHTML(
        companyName, reportData, generatedDate, kpis,
        enterprise_value, liquidation_value, charts, kpiDetailPages,
        accessor, inlineSvgCharts, citationManager, bibliographyHTML,
        sdeTableHTML, marketTableHTML, synthesisTableHTML, capRateTableHTML, assetTableHTML
      );

      // Safety net: replace any [object Object] in rendered HTML
      if (html.includes('[object Object]')) {
        console.error('[PDF] SAFETY NET: Detected [object Object] in HTML. Replacing with "N/A".');
        html = html.replace(/\[object Object\]/g, 'N/A');
      }

      // Generate PDF with Puppeteer
      const browser = await puppeteer.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: true,
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // Wait for Google Fonts to load
      await page.evaluateHandle('document.fonts.ready');

      const pdfBuffer = Buffer.from(await page.pdf({
        format: 'Letter',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: `<div style="font-size:8pt;font-family:'Inter',Arial,sans-serif;width:100%;padding:0 0.75in;display:flex;justify-content:space-between;color:#6B7280;">
          <span>Business Valuation Report</span>
          <span>${companyName.replace(/'/g, '&#39;')} | Confidential</span>
        </div>`,
        footerTemplate: `<div style="font-size:8pt;font-family:'Inter',Arial,sans-serif;width:100%;padding:0 0.75in;display:flex;justify-content:space-between;color:#6B7280;">
          <span>&copy; ${new Date().getFullYear()} Valuation App</span>
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>`,
        margin: {
          top: '1in',
          right: '0.75in',
          bottom: '0.85in',
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
    synthesisTableHTML: string = '',
    capRateTableHTML: string = '',
    assetTableHTML: string = ''
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
    const citeInline = (code: string) => citationManager ? `<sup style="color: #1E3A5F; font-size: 8pt;">[${code}-${citeYear}]</sup>` : '';

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
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:wght@400;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1F2937;
    }

    .cover-page {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: linear-gradient(135deg, #1E3A5F 0%, #0F2440 100%);
      color: white;
      padding: 60px;
      page-break-after: always;
      position: relative;
      margin: -1in -0.75in -0.85in -0.75in;
      padding: 1.5in 1.25in 1.35in 1.25in;
    }

    .cover-page::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: linear-gradient(90deg, #C9A962 0%, #E8D5A0 50%, #C9A962 100%);
    }

    .cover-title {
      font-family: 'Merriweather', Georgia, serif;
      font-size: 44pt;
      font-weight: 700;
      margin-bottom: 20px;
      letter-spacing: -0.5px;
    }

    .cover-subtitle {
      font-size: 20pt;
      font-weight: 400;
      margin-bottom: 60px;
      opacity: 0.9;
      letter-spacing: 0.5px;
    }

    .cover-company {
      font-family: 'Merriweather', Georgia, serif;
      font-size: 32pt;
      font-weight: 700;
      margin-bottom: 10px;
    }

    .cover-date {
      font-size: 13pt;
      opacity: 0.85;
      font-weight: 400;
    }

    .cover-footer {
      font-size: 9pt;
      opacity: 0.7;
      line-height: 1.5;
    }

    .toc {
      page-break-after: always;
      padding: 40px 0;
    }

    .toc h1 {
      font-family: 'Merriweather', Georgia, serif;
      font-size: 28pt;
      color: #1E3A5F;
      margin-bottom: 30px;
      padding-bottom: 10px;
      border-bottom: 3px solid #C9A962;
    }

    .toc-item {
      display: flex;
      align-items: baseline;
      padding: 10px 0;
      font-size: 11pt;
      line-height: 1.4;
    }

    .toc-number {
      flex: 0 0 36px;
      font-weight: 600;
      color: #1E3A5F;
    }

    .toc-title {
      flex: 1 1 auto;
      overflow: hidden;
    }

    .toc-leader {
      flex: 1 0 20px;
      border-bottom: 1px dotted #9CA3AF;
      margin: 0 8px;
      position: relative;
      top: -4px;
    }

    .toc-page {
      flex: 0 0 auto;
      text-align: right;
      font-weight: 600;
      color: #1E3A5F;
    }

    .toc-sub-item {
      display: flex;
      align-items: baseline;
      padding: 6px 0 6px 36px;
      font-size: 10pt;
      color: #6B7280;
    }

    .toc-sub-item .toc-title {
      font-style: italic;
    }

    .toc-sub-item .toc-page {
      color: #6B7280;
      font-weight: 400;
    }

    .section {
      page-break-before: always;
      padding: 40px 0;
    }

    .section-title {
      font-family: 'Merriweather', Georgia, serif;
      font-size: 24pt;
      color: white;
      background: linear-gradient(135deg, #1E3A5F 0%, #2E5A8F 100%);
      padding: 20px 30px;
      margin: -40px 0 30px 0;
      letter-spacing: -0.3px;
    }

    h2 {
      font-family: 'Merriweather', Georgia, serif;
      font-size: 16pt;
      color: #1E3A5F;
      margin: 30px 0 15px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid #C9A962;
    }

    h3 {
      font-size: 13pt;
      color: #1F2937;
      font-weight: 600;
      margin: 20px 0 10px 0;
    }

    p {
      margin-bottom: 12px;
      text-align: justify;
    }

    .value-card {
      background: #F8FAFC;
      border-left: 4px solid #1E3A5F;
      padding: 20px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
    }

    .value-label {
      font-size: 10pt;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 5px;
      font-weight: 500;
    }

    .value-amount {
      font-family: 'JetBrains Mono', monospace;
      font-size: 32pt;
      font-weight: 700;
      color: #1E3A5F;
    }

    .value-subtitle {
      font-size: 11pt;
      color: #6B7280;
      margin-top: 5px;
    }

    .three-col {
      display: flex;
      gap: 20px;
      margin: 30px 0;
    }

    .col {
      flex: 1;
      background: #F8FAFC;
      padding: 20px;
      border-radius: 8px;
      border-top: 3px solid #C9A962;
    }

    .col-title {
      font-size: 11pt;
      font-weight: 600;
      color: #1E3A5F;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .col-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 22pt;
      font-weight: 700;
      color: #1E3A5F;
      margin-bottom: 10px;
    }

    .col-text {
      font-size: 9pt;
      color: #6B7280;
      line-height: 1.5;
    }

    ${generateDesignTokenCSS()}

    /* Legacy table selectors for backward compatibility */
    table:not(.data-table) {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin: 20px 0;
      font-size: 10pt;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }

    table:not(.data-table) thead {
      background: linear-gradient(135deg, #1E3A5F 0%, #2E5A8F 100%);
      color: white;
    }

    table:not(.data-table) th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-size: 9pt;
    }

    table:not(.data-table) td {
      padding: 10px 12px;
      border-bottom: 1px solid #E5E7EB;
    }

    table:not(.data-table) tbody tr:nth-child(even) {
      background: #F9FAFB;
    }

    .financial-table {
      margin: 30px 0;
    }

    .financial-section {
      margin-bottom: 30px;
    }

    .financial-section h3 {
      background: linear-gradient(135deg, #1E3A5F 0%, #2E5A8F 100%);
      color: white;
      padding: 10px 15px;
      margin: 0 0 10px 0;
      border-radius: 6px 6px 0 0;
      font-size: 11pt;
      letter-spacing: 0.03em;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 20px 0;
    }

    .kpi-card {
      background: #F8FAFC;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #C9A962;
    }

    .kpi-name {
      font-size: 9pt;
      color: #6B7280;
      margin-bottom: 5px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      font-weight: 500;
    }

    .kpi-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 20pt;
      font-weight: 700;
      color: #1F2937;
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

    @media print {
      * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
    .value-card, .col, .kpi-card, table, .three-col, .chart-container {
      page-break-inside: avoid;
    }
    .narrative h2, .narrative h3 { page-break-after: avoid; }
    .narrative p { orphans: 3; widows: 3; }
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
      <div class="cover-company">${accessor ? safeString(accessor.getCompanyName(), companyName) : companyName}</div>
      <div class="cover-date">Valuation Date: ${accessor ? safeString(accessor.getValuationDate(), generatedDate) : (reportData.valuation_date || generatedDate)}</div>
      <div class="cover-date">Report Generated: ${generatedDate}</div>
      ${accessor ? `<div class="cover-date">Concluded Fair Market Value: ${accessor.getFormattedFinalValue()}</div>` : ''}
      ${(() => {
        const industryName = accessor ? safeString(accessor.getIndustryName()) : (reportData.industry_name || '');
        const naicsCode = accessor ? safeString(accessor.getNaicsCode()) : (reportData.naics_code || '');
        if (!industryName) return '';
        return `<div class="cover-date">Industry: ${naicsCode ? `${naicsCode} - ` : ''}${industryName}</div>`;
      })()}
    </div>
    <div class="cover-footer">
      This report provides general estimates of fair market value for internal use only. It should not be used to obtain credit or for any commercial purposes. The estimates are based on information provided and publicly available data.
    </div>
  </div>

  <!-- Table of Contents -->
  <div class="toc">
    <h1>Contents</h1>
    ${(() => {
      // Build set of present sections and content map for dynamic page estimation
      const presentSections = new Set<string>();
      const sectionContents = new Map<string, string>();

      // Always-present sections
      presentSections.add('executiveSummary');
      sectionContents.set('executiveSummary', execSummary || '');
      presentSections.add('conclusionOfValue');
      presentSections.add('financialSummary');
      presentSections.add('keyPerformanceIndicators');

      // Conditional sections
      if (companyProfile) { presentSections.add('companyProfile'); sectionContents.set('companyProfile', companyProfile); }
      if (industryAnalysis) { presentSections.add('industryAnalysis'); sectionContents.set('industryAnalysis', industryAnalysis); }
      if (financialAnalysis) { presentSections.add('financialAnalysis'); sectionContents.set('financialAnalysis', financialAnalysis); }
      if (charts.financialTrend) { presentSections.add('financialTrends'); }
      if (assetAnalysis) { presentSections.add('assetApproach'); sectionContents.set('assetApproach', assetAnalysis); }
      if (incomeAnalysis) { presentSections.add('incomeApproach'); sectionContents.set('incomeApproach', incomeAnalysis); }
      if (capRateTableHTML) { presentSections.add('capRateBuildupTable'); sectionContents.set('capRateBuildupTable', capRateTableHTML); }
      if (marketAnalysis) { presentSections.add('marketApproach'); sectionContents.set('marketApproach', marketAnalysis); }
      if (valuationRecon) { presentSections.add('valuationReconciliation'); sectionContents.set('valuationReconciliation', valuationRecon); }
      if (riskAssessment || charts.riskGauge || inlineSvgCharts?.riskGauge) { presentSections.add('riskAssessment'); if (riskAssessment) sectionContents.set('riskAssessment', riskAssessment); }
      if (strategicInsights) { presentSections.add('strategicInsights'); sectionContents.set('strategicInsights', strategicInsights); }
      if (assumptionsLimitingConditions) { presentSections.add('assumptionsAndConditions'); sectionContents.set('assumptionsAndConditions', assumptionsLimitingConditions); }
      if (bibliographyHTML) { presentSections.add('sourcesAndReferences'); sectionContents.set('sourcesAndReferences', bibliographyHTML); }

      // Generate TOC entries with content-based page estimation
      const tocEntries = generateTocEntries(presentSections, sectionContents);
      const tocItems: string[] = [];

      for (const entry of tocEntries) {
        tocItems.push(
          `<div class="toc-item">` +
          `<span class="toc-number">${entry.sectionNumber}.</span>` +
          `<span class="toc-title">${entry.displayName}</span>` +
          `<span class="toc-leader"></span>` +
          `<span class="toc-page">${entry.pageNumber}</span>` +
          `</div>`
        );
      }

      // KPI Detail Pages (sub-items appended after KPI section)
      if (kpiDetailPages && kpiDetailPages.length > 0) {
        const kpiEntry = tocEntries.find(e => e.key === 'keyPerformanceIndicators');
        let detailPageNum = kpiEntry ? kpiEntry.pageNumber + 2 : 20;
        const kpiSubItems = [
          'Profitability Metrics',
          'Liquidity Metrics',
          'Efficiency Metrics',
          'Leverage Metrics',
          'Growth Metrics',
        ];
        const kpiPageIncrements = [5, 2, 3, 1, 1];
        for (let i = 0; i < kpiSubItems.length; i++) {
          tocItems.push(
            `<div class="toc-sub-item">` +
            `<span class="toc-title">${kpiSubItems[i]}</span>` +
            `<span class="toc-leader"></span>` +
            `<span class="toc-page">${detailPageNum}</span>` +
            `</div>`
          );
          detailPageNum += kpiPageIncrements[i];
        }
      }

      return tocItems.join('\n    ');
    })()}
  </div>

  <!-- Executive Summary (moved to front) -->
  <div class="section" id="section-executive-summary">
    <h1 class="section-title">Executive Summary</h1>
    <div class="narrative">
      ${execSummary}
    </div>
    ${accessor ? `
    <div style="margin-top: 30px; padding: 20px; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px;">
      <h3 style="margin-top: 0; color: #1E3A5F;">Key Financial Highlights</h3>
      <table class="data-table">
        <tbody>
        <tr>
          <td>Annual Revenue</td>
          <td class="currency">${accessor.getFormattedRevenue()}</td>
        </tr>
        <tr>
          <td>Seller's Discretionary Earnings (SDE)</td>
          <td class="currency">${accessor.getFormattedSDE()}</td>
        </tr>
        <tr class="total-row">
          <td>Concluded Fair Market Value</td>
          <td class="currency" style="color: #1E3A5F;">${accessor.getFormattedFinalValue()}</td>
        </tr>
        <tr>
          <td>Value Range</td>
          <td class="currency">${accessor.getFormattedValueRange().display}</td>
        </tr>
        <tr>
          <td>Asset Approach (${accessor.getFormattedApproachWeight('asset')})</td>
          <td class="currency">${accessor.getFormattedApproachValue('asset')}</td>
        </tr>
        <tr>
          <td>Income Approach (${accessor.getFormattedApproachWeight('income')})</td>
          <td class="currency">${accessor.getFormattedApproachValue('income')}</td>
        </tr>
        <tr>
          <td>Market Approach (${accessor.getFormattedApproachWeight('market')})</td>
          <td class="currency">${accessor.getFormattedApproachValue('market')}</td>
        </tr>
        </tbody>
      </table>
    </div>
    ` : ''}
  </div>

  <!-- Conclusion of Value (renamed from Your Valuation) -->
  <div class="section" id="section-conclusion-of-value">
    <h1 class="section-title">Conclusion of Value</h1>

    <h2>${accessor ? safeString(accessor.getCompanyName(), companyName) : companyName}</h2>
    ${(() => {
      const industryName = accessor ? safeString(accessor.getIndustryName()) : (reportData.industry_name || '');
      const naicsCode = accessor ? safeString(accessor.getNaicsCode()) : (reportData.naics_code || '');
      if (!industryName) return '';
      return `<p><strong>Industry:</strong> ${naicsCode ? `${naicsCode} - ` : ''}${industryName}</p>`;
    })()}

    <div class="value-card">
      <div class="value-label">Equity Value (Fair Market Value)</div>
      <div class="value-amount">${accessor ? accessor.getFormattedFinalValue() : fmt(fv)}</div>
      <div class="value-subtitle">Based on Weighted Average of Three Approaches${citeInline('BRG')}</div>
    </div>

          <h2>Valuation Approaches</h2>
          ${inlineSvgCharts?.valuationComparison ? `<div style="margin: 20px 0; text-align: center;">${inlineSvgCharts.valuationComparison}</div>` : ''}
          ${charts.valuation ? `<div class="chart-container"><img src="${charts.valuation}" alt="Valuation Approaches Chart" style="max-width: 100%; height: auto;"/></div>` : ''}
          <table class="data-table financial-table">
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
                <td class="currency">${accessor ? accessor.getFormattedApproachValue('asset') : fmt(av)}</td>
                <td class="percentage">${accessor ? accessor.getFormattedApproachWeight('asset') : '20%'}</td>
              </tr>
              <tr>
                <td>Income Approach${citeInline('NYU')}</td>
                <td class="currency">${accessor ? accessor.getFormattedApproachValue('income') : fmt(iv)}</td>
                <td class="percentage">${accessor ? accessor.getFormattedApproachWeight('income') : '40%'}</td>
              </tr>
              <tr>
                <td>Market Approach${citeInline('BBS')}</td>
                <td class="currency">${accessor ? accessor.getFormattedApproachValue('market') : fmt(mv)}</td>
                <td class="percentage">${accessor ? accessor.getFormattedApproachWeight('market') : '40%'}</td>
              </tr>
            </tbody>
          </table>
          ${synthesisTableHTML ? `<h3>Value Synthesis Detail</h3>${synthesisTableHTML}` : ''}

    <div class="three-col">
      <div class="col">
        <div class="col-title">Asset Sale Value</div>
        <div class="col-value">${accessor ? accessor.getFormattedApproachValue('asset') : fmt(av)}</div>
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
      <h3 style="margin-top: 0; color: #1E3A5F;">Key Financial Metrics</h3>
      <table class="data-table">
        <tbody>
        <tr><td>Normalized SDE</td><td class="currency">${accessor.getFormattedSDE('weighted')}</td></tr>
        <tr><td>SDE Multiple Applied</td><td class="currency">${accessor.getFormattedSDEMultiple()} ${citeInline('BBS')}</td></tr>
        <tr><td>Capitalization Rate</td><td class="percentage">${accessor.getFormattedCapRate()} ${citeInline('NYU')}</td></tr>
        <tr><td>Value Range</td><td class="currency">${accessor.getFormattedValueRange().display}</td></tr>
        </tbody>
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

  <!-- Company Profile -->
  ${companyProfile ? `
  <div class="section" id="section-company-profile">
    <h1 class="section-title">Company Profile</h1>
    ${accessor ? `
    <div style="margin-bottom: 20px; padding: 15px; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px;">
      <table class="data-table">
        <tbody>
        <tr>
          <td style="font-weight: bold; width: 160px;">Company Name</td>
          <td>${safeString(accessor.getCompanyName())}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Industry</td>
          <td>${safeString(accessor.getIndustryName())}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">NAICS Code</td>
          <td>${safeString(accessor.getNaicsCode())}</td>
        </tr>
        </tbody>
      </table>
    </div>
    ` : ''}
    <div class="narrative">
      ${companyProfile}
    </div>
  </div>
  ` : ''}

  <!-- Industry Analysis -->
  ${industryAnalysis ? `
  <div class="section" id="section-industry-analysis">
    <h1 class="section-title">Industry Analysis</h1>
    <div class="narrative">
      ${industryAnalysis}
    </div>
  </div>
  ` : ''}

  <!-- Financial Analysis -->
  ${financialAnalysis ? `
  <div class="section" id="section-financial-analysis">
    <h1 class="section-title">Financial Analysis</h1>
    ${accessor ? `
    <div style="margin-bottom: 24px; padding: 20px; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px;">
      <h3 style="margin-top: 0; color: #1E3A5F;">Key Financial Metrics</h3>
      <table class="data-table">
        <tbody>
        <tr>
          <td>Annual Revenue</td>
          <td class="currency">${accessor.getFormattedRevenue()}</td>
        </tr>
        <tr>
          <td>Revenue Growth Rate</td>
          <td class="percentage">${accessor.getFormattedRevenueGrowthRate()}</td>
        </tr>
        <tr>
          <td>Seller's Discretionary Earnings (SDE)</td>
          <td class="currency">${accessor.getFormattedSDE()}</td>
        </tr>
        <tr>
          <td>EBITDA</td>
          <td class="currency">${accessor.getFormattedEBITDA()}</td>
        </tr>
        <tr>
          <td>SDE Margin</td>
          <td class="percentage">${accessor.getFormattedSDEMargin()}</td>
        </tr>
        <tr>
          <td>Gross Margin</td>
          <td class="percentage">${accessor.getFormattedGrossMargin()}</td>
        </tr>
        <tr>
          <td>Total Assets</td>
          <td class="currency">${accessor.getFormattedTotalAssets()}</td>
        </tr>
        <tr>
          <td>Total Liabilities</td>
          <td class="currency">${accessor.getFormattedTotalLiabilities()}</td>
        </tr>
        <tr>
          <td>Book Value (Net Assets)</td>
          <td class="currency">${accessor.getFormattedBookValue()}</td>
        </tr>
        <tr>
          <td>Current Ratio</td>
          <td class="currency">${accessor.getFormattedCurrentRatio()}</td>
        </tr>
        </tbody>
      </table>
    </div>
    ` : ''}
    ${inlineSvgCharts?.profitabilityTrend ? `
    <h2>Profitability Trends</h2>
    <div style="margin: 20px 0; text-align: center;">${inlineSvgCharts.profitabilityTrend}</div>
    ` : ''}
    <div class="narrative">
      ${financialAnalysis}
    </div>
  </div>
  ` : ''}

  <!-- Financial Summary -->
  <div class="section" id="section-financial-summary">
    <h1 class="section-title">Financial Summary</h1>

    ${inlineSvgCharts?.revenueTrend ? `
    <h2>Revenue Trend</h2>
    <div style="margin: 20px 0; text-align: center;">${inlineSvgCharts.revenueTrend}</div>
    ` : ''}

    <h2>${new Date().getFullYear()} ${citeInline('IRS')}</h2>

    <div class="financial-table">
      <div class="financial-section">
        <h3>Income</h3>
        <table class="data-table">
          <tbody>
          <tr><td>Revenue</td><td class="currency" style="font-weight: bold;">${fmt(rev)}</td></tr>
          <tr><td>Pretax Income</td><td class="currency">${fmt(accessor?.getNetIncome() ?? reportData.pretax_income)}</td></tr>
          <tr><td>Officer Compensation</td><td class="currency">${fmt(accessor?.getOfficerCompensation() ?? reportData.owner_compensation)}</td></tr>
          <tr><td>Interest Expense</td><td class="currency">${fmt(accessor?.getInterestExpense() ?? reportData.interest_expense)}</td></tr>
          <tr><td>Non-Cash Expenses</td><td class="currency">${fmt(accessor?.getDepreciation() ?? reportData.non_cash_expenses ?? reportData.depreciation_amortization)}</td></tr>
          ${accessor && sde ? `<tr class="total-row"><td><strong>Seller's Discretionary Earnings (SDE)</strong></td><td class="currency">${fmt(sde)}</td></tr>` : ''}
          ${accessor && ebitda ? `<tr style="background: #E3F2FD; font-weight: 600;"><td><strong>EBITDA</strong></td><td class="currency">${fmt(ebitda)}</td></tr>` : ''}
          </tbody>
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
        <table class="data-table">
          <tbody>
          <tr><td>Cash</td><td class="currency" style="font-weight: bold;">${fmt(accessor?.getCash() ?? reportData.cash)}</td></tr>
          <tr><td>Accounts Receivable</td><td class="currency">${fmt(accessor?.getAccountsReceivable() ?? reportData.accounts_receivable)}</td></tr>
          <tr><td>Inventory</td><td class="currency">${fmt(accessor?.getInventory() ?? reportData.inventory)}</td></tr>
          <tr><td>Other Current Assets</td><td class="currency">${fmt(reportData.other_current_assets)}</td></tr>
          <tr><td>Fixed Assets</td><td class="currency">${fmt(accessor?.getFixedAssets() ?? reportData.fixed_assets)}</td></tr>
          <tr><td>Intangible Assets</td><td class="currency">${fmt(accessor?.getIntangibleAssets() ?? reportData.intangible_assets)}</td></tr>
          <tr class="total-row"><td><strong>Total Assets</strong></td><td class="currency">${fmt(accessor?.getTotalAssets() ?? reportData.total_assets)}</td></tr>
          </tbody>
        </table>
      </div>

      <div class="financial-section">
        <h3>Liabilities</h3>
        <table class="data-table">
          <tbody>
          <tr><td>Accounts Payable</td><td class="currency">${fmt(reportData.accounts_payable)}</td></tr>
          <tr><td>Other Short-Term Liabilities</td><td class="currency">${fmt(reportData.other_short_term_liabilities)}</td></tr>
          <tr><td>Bank Loans</td><td class="currency">${fmt(reportData.bank_loans)}</td></tr>
          <tr><td>Other Long-Term Liabilities</td><td class="currency">${fmt(reportData.other_long_term_liabilities)}</td></tr>
          <tr class="total-row"><td><strong>Total Liabilities</strong></td><td class="currency">${fmt(accessor?.getTotalLiabilities() ?? reportData.total_liabilities)}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Financial Trends -->
  ${charts.financialTrend ? `
  <div class="section" id="section-financial-trends">
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

  <!-- Valuation Approaches -->
  ${assetAnalysis ? `
  <div class="section" id="section-asset-approach">
    <h1 class="section-title">Asset Approach Analysis</h1>
    ${accessor ? `
    <div style="margin-bottom: 24px; padding: 20px; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px;">
      <h3 style="margin-top: 0; color: #1E3A5F;">Asset Approach Summary</h3>
      <table class="data-table">
        <tbody>
        <tr>
          <td>Asset Approach Value</td>
          <td class="currency" style="color: #1E3A5F;">${accessor.getFormattedApproachValue('asset')}</td>
        </tr>
        <tr>
          <td>Approach Weight</td>
          <td class="percentage">${accessor.getFormattedApproachWeight('asset')}</td>
        </tr>
        <tr>
          <td>Total Assets</td>
          <td class="currency">${accessor.getFormattedTotalAssets()}</td>
        </tr>
        <tr>
          <td>Total Liabilities</td>
          <td class="currency">${accessor.getFormattedTotalLiabilities()}</td>
        </tr>
        <tr>
          <td>Book Value (Net Assets)</td>
          <td class="currency">${accessor.getFormattedBookValue()}</td>
        </tr>
        </tbody>
      </table>
    </div>
    ` : ''}
    ${assetTableHTML ? `<div style="margin-bottom: 24px;">${assetTableHTML}</div>` : ''}
    <div class="narrative">
      ${assetAnalysis}
    </div>
  </div>
  ` : ''}

  ${incomeAnalysis ? `
  <div class="section" id="section-income-approach">
    <h1 class="section-title">Income Approach Analysis</h1>
    ${accessor ? `
    <div style="margin-bottom: 24px; padding: 20px; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px;">
      <h3 style="margin-top: 0; color: #1E3A5F;">Income Approach Summary</h3>
      <table class="data-table">
        <tbody>
        <tr>
          <td>Income Approach Value</td>
          <td class="currency" style="color: #1E3A5F;">${accessor.getFormattedApproachValue('income')}</td>
        </tr>
        <tr>
          <td>Approach Weight</td>
          <td class="percentage">${accessor.getFormattedApproachWeight('income')}</td>
        </tr>
        <tr>
          <td>Normalized SDE</td>
          <td class="currency">${accessor.getFormattedSDE('normalized')}</td>
        </tr>
        <tr>
          <td>Capitalization Rate</td>
          <td class="percentage">${accessor.getFormattedCapRate()}</td>
        </tr>
        </tbody>
      </table>
    </div>
    ` : ''}
    <div class="narrative">
      ${incomeAnalysis}
    </div>
  </div>
  ` : ''}

  ${capRateTableHTML ? `
  <div class="section" id="section-cap-rate-buildup">
    <h1 class="section-title">Capitalization Rate Build-Up</h1>
    <p style="margin-bottom: 16px; color: #4B5563; line-height: 1.6;">
      The capitalization rate is developed using the build-up method, which aggregates various risk components to reflect
      the total required rate of return for an investment in this business, adjusted for long-term sustainable growth.
    </p>
    ${capRateTableHTML}
    <p style="margin-top: 16px; color: #6B7280; font-size: 10pt; font-style: italic;">
      The capitalization rate converts a single-period benefit stream into an indication of value using the formula:
      Value = Benefit Stream &divide; Capitalization Rate.
    </p>
  </div>
  ` : ''}

  ${marketAnalysis ? `
  <div class="section" id="section-market-approach">
    <h1 class="section-title">Market Approach Analysis</h1>
    ${accessor ? `
    <div style="margin-bottom: 24px; padding: 20px; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px;">
      <h3 style="margin-top: 0; color: #1E3A5F;">Market Approach Summary</h3>
      <table class="data-table">
        <tbody>
        <tr>
          <td>Market Approach Value</td>
          <td class="currency" style="color: #1E3A5F;">${accessor.getFormattedApproachValue('market')}</td>
        </tr>
        <tr>
          <td>Approach Weight</td>
          <td class="percentage">${accessor.getFormattedApproachWeight('market')}</td>
        </tr>
        <tr>
          <td>Normalized SDE</td>
          <td class="currency">${accessor.getFormattedSDE('normalized')}</td>
        </tr>
        <tr>
          <td>SDE Multiple</td>
          <td class="currency">${accessor.getFormattedSDEMultiple()}</td>
        </tr>
        </tbody>
      </table>
    </div>
    ` : ''}
    ${marketTableHTML ? `<div style="margin-bottom: 30px;">${marketTableHTML}</div>` : ''}
    <div class="narrative">
      ${marketAnalysis}
    </div>
  </div>
  ` : ''}

  <!-- Valuation Reconciliation -->
  ${valuationRecon ? `
  <div class="section" id="section-valuation-reconciliation">
    <h1 class="section-title">Valuation Reconciliation</h1>
    ${accessor ? `
    <div style="margin-bottom: 24px; padding: 20px; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px;">
      <h3 style="margin-top: 0; color: #1E3A5F;">Reconciliation Summary</h3>
      <table class="data-table">
        <tbody>
        <tr>
          <td>Asset Approach Value</td>
          <td class="currency">${accessor.getFormattedApproachValue('asset')}</td>
          <td class="percentage" style="color: #6B7280; padding-left: 12px;">${accessor.getFormattedApproachWeight('asset')}</td>
        </tr>
        <tr>
          <td>Income Approach Value</td>
          <td class="currency">${accessor.getFormattedApproachValue('income')}</td>
          <td class="percentage" style="color: #6B7280; padding-left: 12px;">${accessor.getFormattedApproachWeight('income')}</td>
        </tr>
        <tr>
          <td>Market Approach Value</td>
          <td class="currency">${accessor.getFormattedApproachValue('market')}</td>
          <td class="percentage" style="color: #6B7280; padding-left: 12px;">${accessor.getFormattedApproachWeight('market')}</td>
        </tr>
        <tr>
          <td>DLOM Adjustment</td>
          <td class="currency">${accessor.getFormattedDLOMAmount()}</td>
          <td class="percentage" style="color: #6B7280; padding-left: 12px;">${accessor.getFormattedDLOMRate()}</td>
        </tr>
        <tr class="total-row">
          <td style="font-weight: 600;">Concluded Fair Market Value</td>
          <td class="currency" style="color: #1E3A5F; font-size: 11pt;">${accessor.getFormattedFinalValue()}</td>
          <td class="currency" style="color: #6B7280; padding-left: 12px;">${accessor.getFormattedValueRange().display}</td>
        </tr>
        </tbody>
      </table>
    </div>
    ` : ''}
    <div class="narrative">
      ${valuationRecon}
    </div>
  </div>
  ` : ''}

  <!-- Risk Assessment -->
  ${riskAssessment || charts.riskGauge || inlineSvgCharts?.riskGauge ? `
  <div class="section" id="section-risk-assessment">
    <h1 class="section-title">Risk Assessment</h1>

    ${accessor ? `
    <div style="margin-bottom: 24px; padding: 20px; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px;">
      <h3 style="margin-top: 0; color: #1E3A5F;">Risk Profile Overview</h3>
      <table class="data-table">
        <tbody>
        <tr>
          <td>Overall Risk Score</td>
          <td class="currency" style="color: #1E3A5F;">${accessor.getRiskScore()}/10</td>
        </tr>
        <tr>
          <td>Risk Rating</td>
          <td class="currency">${safeString(accessor.getRiskRating(), 'N/A')}</td>
        </tr>
        </tbody>
      </table>
    </div>
    ` : ''}

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
    <table class="data-table">
      <thead>
        <tr>
          <th>Risk Category</th>
          <th style="text-align: center;">Rating</th>
          <th style="text-align: center;">Score</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        ${reportData.risk_factors.map((rf: any, idx: number) => `
          <tr>
            <td style="font-weight: 500;">${safeString(rf.category, 'N/A')}</td>
            <td style="text-align: center;">
              <span style="
                display: inline-block;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 9pt;
                font-weight: 600;
                background: ${rf.rating === 'Low' ? '#E8F5E9' : rf.rating === 'High' || rf.rating === 'Critical' ? '#FFEBEE' : '#FFF8E1'};
                color: ${rf.rating === 'Low' ? '#2E7D32' : rf.rating === 'High' || rf.rating === 'Critical' ? '#C62828' : '#F57F17'};
              ">${safeString(rf.rating, 'N/A')}</span>
            </td>
            <td style="text-align: center; font-weight: bold;">${safeString(rf.score, 'N/A')}/10</td>
            <td style="color: #666;">${safeString(rf.description, '')}</td>
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

  <!-- KPI Overview -->
  <div class="section" id="section-kpi-overview">
    <h1 class="section-title">Key Performance Indicators</h1>

    <p>In order to better understand your company's operations, we have calculated a variety of Key Performance Indicators (KPIs) for your review and comparison to industry benchmarks.</p>

    ${accessor ? `
    <div style="margin-bottom: 24px; padding: 20px; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px;">
      <h3 style="margin-top: 0; color: #1E3A5F;">Source Financial Metrics</h3>
      <table class="data-table">
        <tbody>
        <tr>
          <td>Annual Revenue</td>
          <td class="currency">${accessor.getFormattedRevenue()}</td>
        </tr>
        <tr>
          <td>SDE Margin</td>
          <td class="percentage">${accessor.getFormattedSDEMargin()}</td>
        </tr>
        <tr>
          <td>EBITDA Margin</td>
          <td class="percentage">${accessor.getFormattedEBITDAMargin()}</td>
        </tr>
        <tr>
          <td>Current Ratio</td>
          <td class="currency">${accessor.getFormattedCurrentRatio()}</td>
        </tr>
        </tbody>
      </table>
    </div>
    ` : ''}

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-name">Cash Flow-to-Revenue</div>
        <div class="kpi-value">${safeString(formatKPI(kpis.cash_flow_to_revenue, 'percentage'), 'N/A')}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-name">Cash-to-Revenue</div>
        <div class="kpi-value">${safeString(formatKPI(kpis.cash_to_revenue, 'percentage'), 'N/A')}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-name">Fixed Assets-to-Revenue</div>
        <div class="kpi-value">${safeString(formatKPI(kpis.fixed_assets_to_revenue, 'percentage'), 'N/A')}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-name">Total Debt-to-Revenue</div>
        <div class="kpi-value">${safeString(formatKPI(kpis.total_debt_to_revenue, 'percentage'), 'N/A')}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-name">Current Ratio</div>
        <div class="kpi-value">${safeString(formatKPI(kpis.current_ratio, 'ratio'), 'N/A')}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-name">Profit Margin</div>
        <div class="kpi-value">${safeString(formatKPI(kpis.profit_margin, 'percentage'), 'N/A')}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-name">EBITDA Margin</div>
        <div class="kpi-value">${safeString(formatKPI(kpis.ebitda_margin, 'percentage'), 'N/A')}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-name">Return on Assets</div>
        <div class="kpi-value">${safeString(formatKPI(kpis.return_on_assets, 'percentage'), 'N/A')}</div>
      </div>
    </div>

    ${charts.kpiPerformance ? `
    <h2 style="margin-top: 40px;">KPI Performance Analysis</h2>
    <div class="chart-container">
      <img src="${charts.kpiPerformance}" alt="KPI Performance Chart" style="max-width: 100%; height: auto; margin: 20px 0;"/>
    </div>
    ` : ''}
  </div>

  <!-- KPI Detail Pages -->
  ${kpiDetailPages}

  <!-- Strategic Insights -->
  ${strategicInsights ? `
  <div class="section" id="section-strategic-insights">
    <h1 class="section-title">Strategic Insights</h1>
    ${accessor ? `
    <div style="margin-bottom: 24px; padding: 20px; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px;">
      <h3 style="margin-top: 0; color: #1E3A5F;">Company Snapshot</h3>
      <table class="data-table">
        <tbody>
        <tr>
          <td>Company</td>
          <td class="currency">${safeString(accessor.getCompanyName(), companyName)}</td>
        </tr>
        <tr>
          <td>Annual Revenue</td>
          <td class="currency">${accessor.getFormattedRevenue()}</td>
        </tr>
        <tr>
          <td>SDE</td>
          <td class="currency">${accessor.getFormattedSDE()}</td>
        </tr>
        <tr class="total-row">
          <td>Concluded Value</td>
          <td class="currency" style="color: #1E3A5F;">${accessor.getFormattedFinalValue()}</td>
        </tr>
        </tbody>
      </table>
    </div>
    ` : ''}
    <div class="narrative">
      ${strategicInsights}
    </div>
  </div>
  ` : ''}

  <!-- Assumptions & Limiting Conditions -->
  ${assumptionsLimitingConditions ? `
  <div class="section" id="section-assumptions">
    <h1 class="section-title">Assumptions & Limiting Conditions</h1>
    ${accessor ? `
    <p style="font-size: 10pt; color: #6B7280; margin-bottom: 16px;">
      This valuation of <strong>${safeString(accessor.getCompanyName(), companyName)}</strong> is subject to the following assumptions and limiting conditions as of the valuation date of <strong>${safeString(accessor.getValuationDate(), generatedDate)}</strong>.
    </p>
    ` : ''}
    <div class="narrative">
      ${assumptionsLimitingConditions}
    </div>
  </div>
  ` : ''}

  <!-- Bibliography -->
  ${bibliographyHTML}

</body>
</html>
    `;
  }
}
