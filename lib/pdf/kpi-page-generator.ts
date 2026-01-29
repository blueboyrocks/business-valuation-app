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
  generatePerformanceBadge,
} from './puppeteer-chart-renderer';
import {
  sortChronologically,
  generatePlaceholderChart,
  formatYAxisLabel,
  generateYAxisTicks,
} from '../charts/chart-validator';

/**
 * Generate an inline SVG bar chart for KPI visualization
 * This avoids Puppeteer overhead and is much faster
 *
 * PRD-J fixes applied:
 * - Sort years chronologically (oldest to newest, left to right)
 * - Add Y-axis labels with proper scale
 * - Draw benchmark line AFTER bars for visibility
 * - Validate data before rendering
 */
function generateInlineSVGChart(kpi: KPIDetailedResult): string {
  const rawValues = kpi.historicalValues.map(h => h.value || 0);
  const rawYears = kpi.historicalValues.map(h => h.year.toString());
  const benchmark = kpi.benchmark || 0;

  // Validate: need at least 1 data point
  if (rawValues.length === 0 || rawValues.every(v => v === 0 || v === undefined)) {
    return generatePlaceholderChart(kpi.name, 'Requires historical data to display');
  }

  // Sort data chronologically (oldest first) - PRD-J US-003
  const sorted = sortChronologically(rawYears, rawValues);
  const years = sorted.labels;
  const values = sorted.values;

  // Normalize values for display
  const isPercentage = kpi.format === 'percentage';
  const displayValues = isPercentage ? values.map(v => v * 100) : values;
  const displayBenchmark = isPercentage ? benchmark * 100 : benchmark;

  // Chart dimensions
  const chartWidth = 450;
  const chartHeight = 230; // Slightly taller for Y-axis labels
  const leftPadding = 70; // More space for Y-axis labels
  const rightPadding = 30;
  const topPadding = 30;
  const bottomPadding = 50;
  const plotWidth = chartWidth - leftPadding - rightPadding;
  const plotHeight = chartHeight - topPadding - bottomPadding;
  const bottomY = chartHeight - bottomPadding;

  // Calculate Y-axis scale - PRD-J US-004
  const dataMax = Math.max(...displayValues, displayBenchmark);
  const dataMin = 0;
  const yTicks = generateYAxisTicks(dataMin, dataMax * 1.1, 5);
  const yMax = yTicks[yTicks.length - 1] || dataMax * 1.2;

  // Determine unit for Y-axis formatting
  const unit = isPercentage ? '%' : kpi.format === 'times' ? 'x' : undefined;

  // Generate Y-axis labels - PRD-J US-004
  const yAxisLabels = yTicks.map((tick, index) => {
    const y = bottomY - (tick / yMax) * plotHeight;
    const label = formatYAxisLabel(tick, unit);
    return `<text x="${leftPadding - 8}" y="${y + 4}" text-anchor="end" font-size="9" fill="#6B7280">${label}</text>`;
  }).join('\n');

  // Generate horizontal grid lines
  const gridLines = yTicks.map(tick => {
    const y = bottomY - (tick / yMax) * plotHeight;
    return `<line x1="${leftPadding}" y1="${y}" x2="${chartWidth - rightPadding}" y2="${y}" stroke="#E5E7EB" stroke-width="0.5" stroke-dasharray="3,3"/>`;
  }).join('\n');

  // Calculate bar positions
  const barCount = displayValues.length;
  const barAreaWidth = plotWidth / barCount;
  const barWidth = Math.min(60, barAreaWidth * 0.7);
  const barGap = (barAreaWidth - barWidth) / 2;

  // Generate bars
  const bars = displayValues.map((value, index) => {
    const barHeight = Math.max(2, (value / yMax) * plotHeight);
    const x = leftPadding + index * barAreaWidth + barGap;
    const y = bottomY - barHeight;

    // Determine color based on performance
    const ratio = values[index] / benchmark;
    let color = '#FFC107'; // Yellow - meeting
    if (kpi.higherIsBetter) {
      if (ratio > 1.10) color = '#4CAF50'; // Green
      else if (ratio < 0.90) color = '#F44336'; // Red
    } else {
      if (ratio < 0.90) color = '#4CAF50';
      else if (ratio > 1.10) color = '#F44336';
    }

    const formattedValue = isPercentage
      ? `${value.toFixed(1)}%`
      : kpi.format === 'times'
        ? `${value.toFixed(1)}x`
        : value.toFixed(2);

    return `
      <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" rx="4"/>
      <text x="${x + barWidth / 2}" y="${y - 8}" text-anchor="middle" font-size="11" font-weight="bold" fill="#333">${formattedValue}</text>
      <text x="${x + barWidth / 2}" y="${bottomY + 18}" text-anchor="middle" font-size="10" fill="#666">${years[index]}</text>
    `;
  }).join('');

  // Benchmark line position
  const benchmarkY = bottomY - (displayBenchmark / yMax) * plotHeight;
  const benchmarkLabel = isPercentage
    ? `${displayBenchmark.toFixed(1)}%`
    : kpi.format === 'times'
      ? `${displayBenchmark.toFixed(1)}x`
      : displayBenchmark.toFixed(2);

  // SVG with correct render order: grid -> benchmark -> bars -> labels
  // PRD-J US-005: Benchmark line rendered BEFORE data bars so it appears behind them
  return `
    <svg width="${chartWidth}" height="${chartHeight}" xmlns="http://www.w3.org/2000/svg" style="font-family: 'Inter', -apple-system, sans-serif;">
      <!-- Background -->
      <rect width="100%" height="100%" fill="white"/>

      <!-- Grid lines (render first) -->
      <g class="grid-lines">
        ${gridLines}
      </g>

      <!-- Y-axis line -->
      <line x1="${leftPadding}" y1="${topPadding}" x2="${leftPadding}" y2="${bottomY}" stroke="#E5E7EB" stroke-width="1"/>

      <!-- X-axis line -->
      <line x1="${leftPadding}" y1="${bottomY}" x2="${chartWidth - rightPadding}" y2="${bottomY}" stroke="#E5E7EB" stroke-width="1"/>

      <!-- Y-axis labels -->
      <g class="y-axis-labels">
        ${yAxisLabels}
      </g>

      <!-- Benchmark line (render BEFORE bars so bars appear on top) -->
      <g class="benchmark-line">
        <line x1="${leftPadding}" y1="${benchmarkY}" x2="${chartWidth - rightPadding}" y2="${benchmarkY}" stroke="#2196F3" stroke-width="2" stroke-dasharray="6,4"/>
        <text x="${chartWidth - rightPadding + 5}" y="${benchmarkY + 4}" font-size="9" fill="#2196F3">Benchmark: ${benchmarkLabel}</text>
      </g>

      <!-- Data bars (render AFTER benchmark for proper layering) -->
      <g class="data-bars">
        ${bars}
      </g>
    </svg>
  `;
}

/**
 * Generate HTML for a single KPI detail page
 * Note: Chart generation is disabled to avoid Vercel timeout issues
 * Charts are rendered as inline SVG bar charts instead
 */
export async function generateKPIDetailPage(kpi: KPIDetailedResult, generateCharts: boolean = false): Promise<string> {
  const explanation = getKPIExplanation(kpi.id);
  const badge = generatePerformanceBadge(kpi.overallPerformance);

  // Generate inline SVG chart instead of Puppeteer chart to avoid timeout
  const chartImage = generateInlineSVGChart(kpi);

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
        color: #1E3A5F;
        margin: 0 0 10px 0;
        padding-bottom: 15px;
        border-bottom: 3px solid #1E3A5F;
      ">${kpi.name}</h1>

      <!-- Chart Section -->
      ${chartImage ? `
        <div style="margin: 30px 0; text-align: center;">
          ${chartImage}
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
        border-left: 4px solid #1E3A5F;
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
        border-left: 4px solid #1E3A5F;
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
        border-left: 4px solid #C9A962;
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
 * Uses inline SVG charts by default for fast generation
 */
export async function generateAllKPIDetailPages(kpis: KPIDetailedResult[]): Promise<string> {
  const pages: string[] = [];

  for (const kpi of kpis) {
    try {
      // Using inline SVG charts (generateCharts=false) for speed
      const page = await generateKPIDetailPage(kpi, false);
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
