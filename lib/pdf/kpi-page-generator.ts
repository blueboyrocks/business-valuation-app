/**
 * KPI Detail Page Generator
 * Generates HTML for individual KPI detail pages in the PDF report
 */

import {
  KPIDetailedResult,
  PerformanceLevel,
  TrendDirection,
  getPerformanceColor,
  getPerformanceBadgeLabel,
  formatKPIValue,
} from '../valuation/kpi-calculator';
import { KPIExplanation, getKPIExplanation } from '../content/kpi-explanations';
import {
  generateKPIComparisonChart,
  generatePerformanceBadge,
  type KPIComparisonChartData,
} from './puppeteer-chart-renderer';

/**
 * Generate HTML for a single KPI detail page
 */
export async function generateKPIDetailPage(kpi: KPIDetailedResult): Promise<string> {
  const explanation = getKPIExplanation(kpi.id);
  const badge = generatePerformanceBadge(kpi.overallPerformance);

  // Prepare chart data
  const chartData: KPIComparisonChartData = {
    kpiName: kpi.name,
    years: kpi.historicalValues.map(h => h.year.toString()),
    values: kpi.historicalValues.map(h => h.value || 0),
    benchmark: kpi.benchmark || 0,
    format: kpi.format === 'percentage' ? 'percentage' : kpi.format === 'times' ? 'times' : 'ratio',
    higherIsBetter: kpi.higherIsBetter,
  };

  // Generate chart image
  let chartImage = '';
  try {
    chartImage = await generateKPIComparisonChart(chartData);
  } catch (error) {
    console.error(`[KPI Page] Error generating chart for ${kpi.name}:`, error);
  }

  // Build performance table rows
  const tableRows = kpi.historicalValues
    .map((h) => {
      const performanceColor = getPerformanceColor(h.performance);
      const formattedValue = formatKPIValue(h.value, kpi.format);
      const vsIndustry = h.vsIndustry !== null
        ? (h.vsIndustry >= 0 ? `+${h.vsIndustry.toFixed(1)}%` : `${h.vsIndustry.toFixed(1)}%`)
        : 'N/A';
      const performanceIcon = getPerformanceIcon(h.performance);

      return `
        <tr>
          <td style="font-weight: 600;">${h.year}</td>
          <td style="text-align: right; font-size: 14pt; font-weight: bold;">${formattedValue}</td>
          <td style="text-align: right;">
            <span style="
              display: inline-flex;
              align-items: center;
              color: ${performanceColor};
              font-weight: 500;
            ">
              ${performanceIcon} ${getPerformanceBadgeLabel(h.performance)} (${vsIndustry})
            </span>
          </td>
        </tr>
      `;
    })
    .join('');

  // Build trend indicator
  const trendIcon = getTrendIcon(kpi.trend);
  const trendLabel = getTrendLabel(kpi.trend);

  return `
    <div class="kpi-detail-page" style="page-break-before: always; padding: 40px 0;">
      <!-- Header with Badge -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
        <div>
          ${badge}
          <div style="font-size: 12pt; color: #666; margin-top: 8px;">
            ${trendIcon} ${trendLabel}
          </div>
        </div>
      </div>

      <!-- KPI Title -->
      <h1 style="
        font-size: 28pt;
        color: #0066CC;
        margin: 0 0 10px 0;
        padding-bottom: 15px;
        border-bottom: 3px solid #0066CC;
      ">${kpi.name}</h1>

      <!-- Chart Section -->
      ${chartImage ? `
        <div style="margin: 30px 0; text-align: center;">
          <img src="${chartImage}" alt="${kpi.name} Chart" style="max-width: 100%; height: auto;" />
        </div>
      ` : ''}

      <!-- Performance Table -->
      <table style="width: 100%; border-collapse: collapse; margin: 25px 0; font-size: 11pt;">
        <thead>
          <tr style="background: #F5F5F5; border-bottom: 2px solid #E0E0E0;">
            <th style="padding: 12px; text-align: left; width: 15%;">Year</th>
            <th style="padding: 12px; text-align: right; width: 25%;">Value</th>
            <th style="padding: 12px; text-align: right; width: 60%;">vs. Industry Benchmark</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <!-- Industry Benchmark Reference -->
      <div style="
        background: #E3F2FD;
        border-left: 4px solid #2196F3;
        padding: 12px 15px;
        margin: 20px 0;
        font-size: 11pt;
      ">
        <strong>Industry Benchmark:</strong> ${formatKPIValue(kpi.benchmark, kpi.format)}
        ${explanation?.benchmarkSource ? `<span style="color: #666;"> (Source: ${explanation.benchmarkSource})</span>` : ''}
      </div>

      ${explanation ? generateExplanationSection(explanation) : ''}
    </div>
  `;
}

/**
 * Generate the educational explanation section
 */
function generateExplanationSection(explanation: KPIExplanation): string {
  return `
    <!-- What Does It Mean? -->
    <div style="margin-top: 30px;">
      <h2 style="
        font-size: 14pt;
        color: #333;
        background: #F5F5F5;
        padding: 12px 15px;
        margin: 0 0 15px 0;
        border-left: 4px solid #0066CC;
      ">What Does It Mean?</h2>
      <p style="
        font-size: 11pt;
        line-height: 1.7;
        color: #444;
        text-align: justify;
        margin: 0 0 20px 0;
      ">${explanation.whatItMeans}</p>
    </div>

    <!-- Why Should It Matter? -->
    <div style="margin-top: 25px;">
      <h2 style="
        font-size: 14pt;
        color: #333;
        background: #F5F5F5;
        padding: 12px 15px;
        margin: 0 0 15px 0;
        border-left: 4px solid #0066CC;
      ">Why Should It Matter?</h2>
      <p style="
        font-size: 11pt;
        line-height: 1.7;
        color: #444;
        text-align: justify;
        margin: 0 0 20px 0;
      ">${explanation.whyItMatters}</p>
    </div>

    <!-- Give Me An Example -->
    <div style="margin-top: 25px;">
      <h2 style="
        font-size: 14pt;
        color: #333;
        background: #F5F5F5;
        padding: 12px 15px;
        margin: 0 0 15px 0;
        border-left: 4px solid #7CB342;
      ">Give Me An Example</h2>
      <p style="
        font-size: 11pt;
        line-height: 1.7;
        color: #444;
        text-align: justify;
        margin: 0;
        background: #F9FBE7;
        padding: 15px;
        border-radius: 4px;
      ">${explanation.example}</p>
    </div>
  `;
}

/**
 * Get performance indicator icon
 */
function getPerformanceIcon(level: PerformanceLevel): string {
  switch (level) {
    case 'outperforming':
      return '<span style="color: #4CAF50; font-size: 16px;">&#9650;</span>'; // Up arrow
    case 'meeting':
      return '<span style="color: #FFC107; font-size: 16px;">&#9679;</span>'; // Circle
    case 'underperforming':
      return '<span style="color: #F44336; font-size: 16px;">&#9660;</span>'; // Down arrow
    default:
      return '';
  }
}

/**
 * Get trend indicator icon
 */
function getTrendIcon(trend: TrendDirection): string {
  switch (trend) {
    case 'improving':
      return '<span style="color: #4CAF50;">&#8593;</span>'; // Up arrow
    case 'stable':
      return '<span style="color: #2196F3;">&#8594;</span>'; // Right arrow
    case 'declining':
      return '<span style="color: #F44336;">&#8595;</span>'; // Down arrow
    default:
      return '';
  }
}

/**
 * Get trend label
 */
function getTrendLabel(trend: TrendDirection): string {
  switch (trend) {
    case 'improving':
      return 'Improving Trend';
    case 'stable':
      return 'Stable Trend';
    case 'declining':
      return 'Declining Trend';
    default:
      return '';
  }
}

/**
 * Generate all KPI detail pages
 */
export async function generateAllKPIDetailPages(kpis: KPIDetailedResult[]): Promise<string> {
  const pages: string[] = [];

  for (const kpi of kpis) {
    try {
      const page = await generateKPIDetailPage(kpi);
      pages.push(page);
    } catch (error) {
      console.error(`[KPI Page] Error generating page for ${kpi.name}:`, error);
    }
  }

  return pages.join('\n');
}

/**
 * Generate KPI summary section for TOC
 */
export function generateKPISummaryForTOC(kpis: KPIDetailedResult[], startPage: number): string[] {
  return kpis.map((kpi, index) => {
    return `<div class="toc-item" style="padding-left: 20px;"><span>${kpi.name}</span><span>${startPage + index}</span></div>`;
  });
}
