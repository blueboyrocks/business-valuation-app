/**
 * ReportChartGenerator
 * Generates complete inline SVG chart strings for PDF report pages.
 * Each method returns a self-contained <svg> element with all styling inline.
 *
 * Charts follow the pattern established in lib/pdf/kpi-page-generator.ts
 * using string-based SVG construction for Puppeteer/HTML-to-PDF rendering.
 */

import { CHART_COLORS, CHART_DIMENSIONS, CHART_FONTS } from './theme';
import { rect, line, text, circle, path, svgWrapper, gridLines, yAxis, xAxis } from './svg-primitives';

// ============ DATA INTERFACES ============

export interface ChartDataSet {
  revenueTrend: { labels: string[]; values: number[] };
  sdeTrend: { labels: string[]; values: number[] };
  ebitdaTrend: { labels: string[]; values: number[] };
  valuationComparison: { approaches: { name: string; value: number }[]; finalValue: number };
  riskScore: number;
  profitabilityTrend: { labels: string[]; margins: { gross: number[]; sde: number[]; ebitda: number[] } };
}

// ============ HELPERS ============

/**
 * Format a number as a compact currency label (e.g. $1.2M, $450K).
 */
function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

/**
 * Compute nice Y-axis maximum value that rounds up above the data max.
 */
function niceMax(maxValue: number): number {
  if (maxValue <= 0) return 100;
  const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue)));
  const normalized = maxValue / magnitude;
  let nice: number;
  if (normalized <= 1.2) nice = 1.5;
  else if (normalized <= 2) nice = 2;
  else if (normalized <= 3) nice = 3;
  else if (normalized <= 5) nice = 5;
  else if (normalized <= 7.5) nice = 8;
  else nice = 10;
  return nice * magnitude;
}

/**
 * Generate Y-axis tick labels for a given range.
 */
function yAxisLabels(
  count: number,
  maxValue: number,
  x: number,
  yStart: number,
  yEnd: number,
  formatter: (v: number) => string
): string {
  const labels: string[] = [];
  for (let i = 0; i <= count; i++) {
    const value = maxValue - (maxValue * i) / count;
    const y = yStart + ((yEnd - yStart) * i) / count;
    labels.push(
      text(x - 8, y + 3, formatter(value), {
        fontSize: CHART_FONTS.axisSize,
        fill: CHART_COLORS.textLight,
        anchor: 'end',
      })
    );
  }
  return labels.join('\n');
}

// ============ CHART GENERATOR CLASS ============

export class ReportChartGenerator {

  // ---------------------------------------------------------------------------
  // 1. Revenue Trend Bar Chart
  // ---------------------------------------------------------------------------

  /**
   * Vertical bar chart showing revenue by year.
   * Bars with value labels above and year labels below, Y-axis with gridlines.
   */
  generateRevenueTrendChart(labels: string[], values: number[]): string {
    const { width, height, padding } = CHART_DIMENSIONS;
    if (labels.length === 0 || values.length === 0) {
      return svgWrapper(width, height, text(width / 2, height / 2, 'No revenue data available', {
        anchor: 'middle',
        fill: CHART_COLORS.textLight,
      }));
    }

    const plotLeft = padding.left;
    const plotRight = width - padding.right;
    const plotTop = padding.top;
    const plotBottom = height - padding.bottom;
    const plotWidth = plotRight - plotLeft;
    const plotHeight = plotBottom - plotTop;

    const maxVal = niceMax(Math.max(...values));
    const gridCount = 5;

    // Compute bar geometry
    const barCount = values.length;
    const totalGap = (barCount + 1) * CHART_DIMENSIONS.barGap;
    const barWidth = Math.min(CHART_DIMENSIONS.barWidth, (plotWidth - totalGap) / barCount);

    const parts: string[] = [];

    // Background
    parts.push(rect(0, 0, width, height, CHART_COLORS.background));

    // Title
    parts.push(text(width / 2, 18, 'Revenue Trend', {
      fontSize: CHART_FONTS.titleSize,
      fontWeight: 'bold',
      anchor: 'middle',
      fill: CHART_COLORS.text,
    }));

    // Grid lines
    parts.push(gridLines(gridCount, plotLeft, plotRight, plotTop, plotBottom));

    // Y-axis and X-axis
    parts.push(yAxis(plotLeft, plotTop, plotBottom));
    parts.push(xAxis(plotBottom, plotLeft, plotRight));

    // Y-axis labels
    parts.push(yAxisLabels(gridCount, maxVal, plotLeft, plotTop, plotBottom, formatCompactCurrency));

    // Bars
    const barAreaWidth = plotWidth / barCount;
    for (let i = 0; i < barCount; i++) {
      const centerX = plotLeft + barAreaWidth * (i + 0.5);
      const bx = centerX - barWidth / 2;
      const barHeight = (values[i] / maxVal) * plotHeight;
      const by = plotBottom - barHeight;

      parts.push(rect(bx, by, barWidth, barHeight, CHART_COLORS.primary, { rx: 3 }));

      // Value label above bar
      parts.push(text(centerX, by - 6, formatCompactCurrency(values[i]), {
        fontSize: CHART_FONTS.valueSize,
        fontWeight: 'bold',
        anchor: 'middle',
        fill: CHART_COLORS.text,
      }));

      // Year label below bar
      parts.push(text(centerX, plotBottom + 16, labels[i], {
        fontSize: CHART_FONTS.labelSize,
        anchor: 'middle',
        fill: CHART_COLORS.textLight,
      }));
    }

    return svgWrapper(width, height, parts.join('\n'));
  }

  // ---------------------------------------------------------------------------
  // 2. SDE/EBITDA Dual-Line Trend Chart
  // ---------------------------------------------------------------------------

  /**
   * Line chart with two polylines (SDE and EBITDA) over years,
   * circle markers at each data point, and a legend below.
   */
  generateSDEEBITDATrendChart(labels: string[], sdeValues: number[], ebitdaValues: number[]): string {
    const { width, height, padding } = CHART_DIMENSIONS;
    if (labels.length === 0) {
      return svgWrapper(width, height, text(width / 2, height / 2, 'No earnings data available', {
        anchor: 'middle',
        fill: CHART_COLORS.textLight,
      }));
    }

    const plotLeft = padding.left;
    const plotRight = width - padding.right;
    const plotTop = padding.top + 5;
    const plotBottom = height - padding.bottom - 10; // extra space for legend
    const plotWidth = plotRight - plotLeft;
    const plotHeight = plotBottom - plotTop;
    const gridCount = 5;

    const allValues = [...sdeValues, ...ebitdaValues].filter(v => v > 0);
    const maxVal = niceMax(allValues.length > 0 ? Math.max(...allValues) : 100);

    const parts: string[] = [];

    // Background
    parts.push(rect(0, 0, width, height, CHART_COLORS.background));

    // Title
    parts.push(text(width / 2, 18, 'SDE & EBITDA Trend', {
      fontSize: CHART_FONTS.titleSize,
      fontWeight: 'bold',
      anchor: 'middle',
      fill: CHART_COLORS.text,
    }));

    // Grid lines, axes
    parts.push(gridLines(gridCount, plotLeft, plotRight, plotTop, plotBottom));
    parts.push(yAxis(plotLeft, plotTop, plotBottom));
    parts.push(xAxis(plotBottom, plotLeft, plotRight));
    parts.push(yAxisLabels(gridCount, maxVal, plotLeft, plotTop, plotBottom, formatCompactCurrency));

    // X-axis year labels
    const stepX = labels.length > 1 ? plotWidth / (labels.length - 1) : 0;
    for (let i = 0; i < labels.length; i++) {
      const x = labels.length === 1 ? plotLeft + plotWidth / 2 : plotLeft + stepX * i;
      parts.push(text(x, plotBottom + 16, labels[i], {
        fontSize: CHART_FONTS.labelSize,
        anchor: 'middle',
        fill: CHART_COLORS.textLight,
      }));
    }

    // Helper to plot a line series
    const plotLine = (values: number[], color: string) => {
      if (values.length === 0) return;
      const points: { x: number; y: number }[] = [];
      for (let i = 0; i < values.length; i++) {
        const x = labels.length === 1 ? plotLeft + plotWidth / 2 : plotLeft + stepX * i;
        const y = plotBottom - (values[i] / maxVal) * plotHeight;
        points.push({ x, y });
      }

      // Polyline path
      const d = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
      parts.push(path(d, 'none', color, 2.5));

      // Circle markers
      for (const p of points) {
        parts.push(circle(p.x, p.y, 4, CHART_COLORS.background));
        parts.push(circle(p.x, p.y, 3, color));
      }
    };

    plotLine(sdeValues, CHART_COLORS.primary);
    plotLine(ebitdaValues, CHART_COLORS.secondary);

    // Legend
    const legendY = height - 10;
    const legendCenterX = width / 2;
    // SDE legend item
    parts.push(rect(legendCenterX - 100, legendY - 8, 12, 12, CHART_COLORS.primary, { rx: 2 }));
    parts.push(text(legendCenterX - 84, legendY + 2, 'SDE', {
      fontSize: CHART_FONTS.valueSize,
      fill: CHART_COLORS.text,
    }));
    // EBITDA legend item
    parts.push(rect(legendCenterX + 20, legendY - 8, 12, 12, CHART_COLORS.secondary, { rx: 2 }));
    parts.push(text(legendCenterX + 36, legendY + 2, 'EBITDA', {
      fontSize: CHART_FONTS.valueSize,
      fill: CHART_COLORS.text,
    }));

    return svgWrapper(width, height, parts.join('\n'));
  }

  // ---------------------------------------------------------------------------
  // 3. Valuation Comparison Horizontal Bar Chart
  // ---------------------------------------------------------------------------

  /**
   * Horizontal bar chart comparing valuation approach values.
   * Labels on the left, bars extending right, values on the right end.
   * A dashed vertical line marks the final concluded value.
   */
  generateValuationComparisonChart(
    approaches: { name: string; value: number; color?: string }[],
    finalValue: number
  ): string {
    const { width, height, padding } = CHART_DIMENSIONS;
    if (approaches.length === 0) {
      return svgWrapper(width, height, text(width / 2, height / 2, 'No valuation data available', {
        anchor: 'middle',
        fill: CHART_COLORS.textLight,
      }));
    }

    const plotLeft = padding.left + 60; // extra room for labels
    const plotRight = width - padding.right - 10;
    const plotTop = padding.top + 10;
    const plotBottom = height - padding.bottom;
    const plotWidth = plotRight - plotLeft;

    const defaultColors = [CHART_COLORS.primary, CHART_COLORS.secondary, CHART_COLORS.accent, CHART_COLORS.success];
    const allValues = [...approaches.map(a => a.value), finalValue];
    const maxVal = niceMax(Math.max(...allValues));

    const barCount = approaches.length;
    const availableHeight = plotBottom - plotTop;
    const barHeight = Math.min(40, (availableHeight - (barCount - 1) * 12) / barCount);
    const totalBarsHeight = barCount * barHeight + (barCount - 1) * 12;
    const startY = plotTop + (availableHeight - totalBarsHeight) / 2;

    const parts: string[] = [];

    // Background
    parts.push(rect(0, 0, width, height, CHART_COLORS.background));

    // Title
    parts.push(text(width / 2, 18, 'Valuation Comparison', {
      fontSize: CHART_FONTS.titleSize,
      fontWeight: 'bold',
      anchor: 'middle',
      fill: CHART_COLORS.text,
    }));

    // Vertical grid lines
    const gridCount = 4;
    for (let i = 0; i <= gridCount; i++) {
      const x = plotLeft + (plotWidth * i) / gridCount;
      parts.push(line(x, plotTop, x, plotBottom, CHART_COLORS.grid, { strokeWidth: 0.5, dashArray: '3,3' }));
      parts.push(text(x, plotBottom + 14, formatCompactCurrency((maxVal * i) / gridCount), {
        fontSize: CHART_FONTS.axisSize,
        fill: CHART_COLORS.textLight,
        anchor: 'middle',
      }));
    }

    // Horizontal bars
    for (let i = 0; i < barCount; i++) {
      const approach = approaches[i];
      const color = approach.color || defaultColors[i % defaultColors.length];
      const by = startY + i * (barHeight + 12);
      const bw = (approach.value / maxVal) * plotWidth;

      // Label on left
      parts.push(text(plotLeft - 8, by + barHeight / 2 + 4, approach.name, {
        fontSize: CHART_FONTS.labelSize,
        fill: CHART_COLORS.text,
        anchor: 'end',
        fontWeight: '500',
      }));

      // Bar
      parts.push(rect(plotLeft, by, Math.max(bw, 2), barHeight, color, { rx: 3, opacity: 0.85 }));

      // Value at end of bar
      const labelX = plotLeft + bw + 6;
      parts.push(text(labelX, by + barHeight / 2 + 4, formatCompactCurrency(approach.value), {
        fontSize: CHART_FONTS.valueSize,
        fontWeight: 'bold',
        fill: CHART_COLORS.text,
      }));
    }

    // Final value dashed vertical line
    const finalX = plotLeft + (finalValue / maxVal) * plotWidth;
    parts.push(line(finalX, plotTop - 5, finalX, plotBottom + 5, CHART_COLORS.danger, { strokeWidth: 2, dashArray: '6,4' }));
    parts.push(text(finalX, plotTop - 10, `Final: ${formatCompactCurrency(finalValue)}`, {
      fontSize: CHART_FONTS.valueSize,
      fontWeight: 'bold',
      anchor: 'middle',
      fill: CHART_COLORS.danger,
    }));

    return svgWrapper(width, height, parts.join('\n'));
  }

  // ---------------------------------------------------------------------------
  // 4. Risk Gauge Chart
  // ---------------------------------------------------------------------------

  /**
   * Semi-circle gauge chart. The arc transitions from green (low risk)
   * through yellow to red (high risk). A needle points at the score position.
   * Score range: 1 (low risk) to 10 (high risk).
   */
  generateRiskGaugeChart(score: number, label: string): string {
    const { width } = CHART_DIMENSIONS;
    const gaugeHeight = 260;
    const cx = width / 2;
    const cy = 180;
    const outerR = 120;
    const innerR = 85;

    // Clamp score to 1-10
    const clampedScore = Math.max(1, Math.min(10, score));

    const parts: string[] = [];

    // Background
    parts.push(rect(0, 0, width, gaugeHeight, CHART_COLORS.background));

    // Title
    parts.push(text(cx, 22, label || 'Risk Assessment', {
      fontSize: CHART_FONTS.titleSize,
      fontWeight: 'bold',
      anchor: 'middle',
      fill: CHART_COLORS.text,
    }));

    // Draw arc segments (green -> yellow -> red) over 180 degrees (PI radians)
    // We divide the arc into 10 segments
    const segmentCount = 10;
    const startAngle = Math.PI; // left (180 deg)
    const endAngle = 0;        // right (0 deg) - semi-circle top
    const segmentAngle = (startAngle - endAngle) / segmentCount;

    for (let i = 0; i < segmentCount; i++) {
      const a1 = startAngle - i * segmentAngle;
      const a2 = startAngle - (i + 1) * segmentAngle;

      // Color gradient: segments 0-3 green, 4-6 yellow, 7-9 red
      let color: string;
      if (i < 3) color = CHART_COLORS.success;
      else if (i < 5) color = '#8BC34A'; // light green
      else if (i < 7) color = CHART_COLORS.warning;
      else if (i < 9) color = CHART_COLORS.accent;
      else color = CHART_COLORS.danger;

      const x1Outer = cx + outerR * Math.cos(a1);
      const y1Outer = cy - outerR * Math.sin(a1);
      const x2Outer = cx + outerR * Math.cos(a2);
      const y2Outer = cy - outerR * Math.sin(a2);
      const x1Inner = cx + innerR * Math.cos(a2);
      const y1Inner = cy - innerR * Math.sin(a2);
      const x2Inner = cx + innerR * Math.cos(a1);
      const y2Inner = cy - innerR * Math.sin(a1);

      const d = [
        `M ${x1Outer.toFixed(1)} ${y1Outer.toFixed(1)}`,
        `A ${outerR} ${outerR} 0 0 1 ${x2Outer.toFixed(1)} ${y2Outer.toFixed(1)}`,
        `L ${x1Inner.toFixed(1)} ${y1Inner.toFixed(1)}`,
        `A ${innerR} ${innerR} 0 0 0 ${x2Inner.toFixed(1)} ${y2Inner.toFixed(1)}`,
        'Z',
      ].join(' ');

      parts.push(path(d, color));
    }

    // Needle
    // Score 1 = left (PI), score 10 = right (0)
    const needleAngle = startAngle - ((clampedScore - 1) / (segmentCount - 1)) * (startAngle - endAngle);
    const needleLen = outerR + 8;
    const needleTipX = cx + needleLen * Math.cos(needleAngle);
    const needleTipY = cy - needleLen * Math.sin(needleAngle);

    // Needle triangle
    const baseOffset = 6;
    const baseAngle1 = needleAngle + Math.PI / 2;
    const baseAngle2 = needleAngle - Math.PI / 2;
    const bx1 = cx + baseOffset * Math.cos(baseAngle1);
    const by1 = cy - baseOffset * Math.sin(baseAngle1);
    const bx2 = cx + baseOffset * Math.cos(baseAngle2);
    const by2 = cy - baseOffset * Math.sin(baseAngle2);

    const needlePath = `M ${needleTipX.toFixed(1)} ${needleTipY.toFixed(1)} L ${bx1.toFixed(1)} ${by1.toFixed(1)} L ${bx2.toFixed(1)} ${by2.toFixed(1)} Z`;
    parts.push(path(needlePath, CHART_COLORS.text));

    // Center circle
    parts.push(circle(cx, cy, 8, CHART_COLORS.text));
    parts.push(circle(cx, cy, 5, CHART_COLORS.background));

    // Score value
    parts.push(text(cx, cy + 35, `${clampedScore} / 10`, {
      fontSize: 20,
      fontWeight: 'bold',
      anchor: 'middle',
      fill: CHART_COLORS.text,
    }));

    // Low / High labels
    parts.push(text(cx - outerR - 5, cy + 16, 'Low', {
      fontSize: CHART_FONTS.axisSize,
      fill: CHART_COLORS.success,
      anchor: 'end',
      fontWeight: '500',
    }));
    parts.push(text(cx + outerR + 5, cy + 16, 'High', {
      fontSize: CHART_FONTS.axisSize,
      fill: CHART_COLORS.danger,
      anchor: 'start',
      fontWeight: '500',
    }));

    // Risk level label
    let riskLabel: string;
    let riskColor: string;
    if (clampedScore <= 3) {
      riskLabel = 'Low Risk';
      riskColor = CHART_COLORS.success;
    } else if (clampedScore <= 6) {
      riskLabel = 'Moderate Risk';
      riskColor = CHART_COLORS.warning;
    } else {
      riskLabel = 'High Risk';
      riskColor = CHART_COLORS.danger;
    }

    parts.push(text(cx, cy + 55, riskLabel, {
      fontSize: CHART_FONTS.labelSize,
      fontWeight: 'bold',
      anchor: 'middle',
      fill: riskColor,
    }));

    return svgWrapper(width, gaugeHeight, parts.join('\n'));
  }

  // ---------------------------------------------------------------------------
  // 5. Profitability Trend Chart (Multi-Line)
  // ---------------------------------------------------------------------------

  /**
   * Line chart with three margin series (gross, SDE, EBITDA) as percentages.
   * Polyline paths with circle markers and a legend below.
   */
  generateProfitabilityTrendChart(
    labels: string[],
    grossMargins: number[],
    sdeMargins: number[],
    ebitdaMargins: number[]
  ): string {
    const { width, height, padding } = CHART_DIMENSIONS;
    if (labels.length === 0) {
      return svgWrapper(width, height, text(width / 2, height / 2, 'No profitability data available', {
        anchor: 'middle',
        fill: CHART_COLORS.textLight,
      }));
    }

    const plotLeft = padding.left;
    const plotRight = width - padding.right;
    const plotTop = padding.top + 5;
    const plotBottom = height - padding.bottom - 15; // legend space
    const plotWidth = plotRight - plotLeft;
    const plotHeight = plotBottom - plotTop;
    const gridCount = 5;

    // All margin values as percentages (0-100)
    const allMargins = [...grossMargins, ...sdeMargins, ...ebitdaMargins].filter(v => v !== undefined);
    const maxMargin = niceMax(allMargins.length > 0 ? Math.max(...allMargins) : 100);

    const parts: string[] = [];

    // Background
    parts.push(rect(0, 0, width, height, CHART_COLORS.background));

    // Title
    parts.push(text(width / 2, 18, 'Profitability Margins', {
      fontSize: CHART_FONTS.titleSize,
      fontWeight: 'bold',
      anchor: 'middle',
      fill: CHART_COLORS.text,
    }));

    // Grid, axes
    parts.push(gridLines(gridCount, plotLeft, plotRight, plotTop, plotBottom));
    parts.push(yAxis(plotLeft, plotTop, plotBottom));
    parts.push(xAxis(plotBottom, plotLeft, plotRight));

    // Y-axis labels (percentages)
    parts.push(yAxisLabels(gridCount, maxMargin, plotLeft, plotTop, plotBottom, v => `${v.toFixed(0)}%`));

    // X-axis year labels
    const stepX = labels.length > 1 ? plotWidth / (labels.length - 1) : 0;
    for (let i = 0; i < labels.length; i++) {
      const x = labels.length === 1 ? plotLeft + plotWidth / 2 : plotLeft + stepX * i;
      parts.push(text(x, plotBottom + 16, labels[i], {
        fontSize: CHART_FONTS.labelSize,
        anchor: 'middle',
        fill: CHART_COLORS.textLight,
      }));
    }

    // Helper to plot a line series
    const plotSeries = (values: number[], color: string) => {
      if (!values || values.length === 0) return;
      const points: { x: number; y: number }[] = [];
      for (let i = 0; i < values.length; i++) {
        const x = labels.length === 1 ? plotLeft + plotWidth / 2 : plotLeft + stepX * i;
        const y = plotBottom - (values[i] / maxMargin) * plotHeight;
        points.push({ x, y });
      }

      const d = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
      parts.push(path(d, 'none', color, 2.5));

      for (const p of points) {
        parts.push(circle(p.x, p.y, 4, CHART_COLORS.background));
        parts.push(circle(p.x, p.y, 3, color));
      }
    };

    plotSeries(grossMargins, CHART_COLORS.accent);
    plotSeries(sdeMargins, CHART_COLORS.primary);
    plotSeries(ebitdaMargins, CHART_COLORS.secondary);

    // Legend
    const legendY = height - 6;
    const legendStartX = width / 2 - 130;
    const items = [
      { label: 'Gross Margin', color: CHART_COLORS.accent },
      { label: 'SDE Margin', color: CHART_COLORS.primary },
      { label: 'EBITDA Margin', color: CHART_COLORS.secondary },
    ];
    let lx = legendStartX;
    for (const item of items) {
      parts.push(rect(lx, legendY - 8, 10, 10, item.color, { rx: 2 }));
      parts.push(text(lx + 14, legendY + 1, item.label, {
        fontSize: CHART_FONTS.axisSize,
        fill: CHART_COLORS.text,
      }));
      lx += 90;
    }

    return svgWrapper(width, height, parts.join('\n'));
  }

  // ---------------------------------------------------------------------------
  // 6. KPI Benchmark Grouped Bar Chart
  // ---------------------------------------------------------------------------

  /**
   * Grouped vertical bar chart comparing company KPI values against industry benchmarks.
   * Two bars per KPI: company (primary) and benchmark (secondary).
   */
  generateKPIBenchmarkChart(
    kpis: { name: string; companyValue: number; benchmark: number }[]
  ): string {
    const { width, height, padding } = CHART_DIMENSIONS;
    if (kpis.length === 0) {
      return svgWrapper(width, height, text(width / 2, height / 2, 'No KPI data available', {
        anchor: 'middle',
        fill: CHART_COLORS.textLight,
      }));
    }

    const plotLeft = padding.left;
    const plotRight = width - padding.right;
    const plotTop = padding.top + 5;
    const plotBottom = height - padding.bottom - 15;
    const plotWidth = plotRight - plotLeft;
    const plotHeight = plotBottom - plotTop;
    const gridCount = 5;

    const allValues = kpis.flatMap(k => [k.companyValue, k.benchmark]);
    const maxVal = niceMax(Math.max(...allValues));

    const parts: string[] = [];

    // Background
    parts.push(rect(0, 0, width, height, CHART_COLORS.background));

    // Title
    parts.push(text(width / 2, 18, 'KPI vs Industry Benchmark', {
      fontSize: CHART_FONTS.titleSize,
      fontWeight: 'bold',
      anchor: 'middle',
      fill: CHART_COLORS.text,
    }));

    // Grid, axes
    parts.push(gridLines(gridCount, plotLeft, plotRight, plotTop, plotBottom));
    parts.push(yAxis(plotLeft, plotTop, plotBottom));
    parts.push(xAxis(plotBottom, plotLeft, plotRight));

    // Y-axis labels
    parts.push(yAxisLabels(gridCount, maxVal, plotLeft, plotTop, plotBottom, v => `${v.toFixed(0)}%`));

    // Bar groups
    const groupCount = kpis.length;
    const groupWidth = plotWidth / groupCount;
    const subBarWidth = Math.min(28, (groupWidth - 20) / 2);
    const subBarGap = 4;

    for (let i = 0; i < groupCount; i++) {
      const kpi = kpis[i];
      const groupCenterX = plotLeft + groupWidth * (i + 0.5);

      // Company bar (left of center)
      const compBarX = groupCenterX - subBarWidth - subBarGap / 2;
      const compBarH = (kpi.companyValue / maxVal) * plotHeight;
      const compBarY = plotBottom - compBarH;
      parts.push(rect(compBarX, compBarY, subBarWidth, compBarH, CHART_COLORS.primary, { rx: 2 }));

      // Company value label
      parts.push(text(compBarX + subBarWidth / 2, compBarY - 5, `${kpi.companyValue.toFixed(1)}%`, {
        fontSize: CHART_FONTS.axisSize,
        fontWeight: 'bold',
        anchor: 'middle',
        fill: CHART_COLORS.primary,
      }));

      // Benchmark bar (right of center)
      const benchBarX = groupCenterX + subBarGap / 2;
      const benchBarH = (kpi.benchmark / maxVal) * plotHeight;
      const benchBarY = plotBottom - benchBarH;
      parts.push(rect(benchBarX, benchBarY, subBarWidth, benchBarH, CHART_COLORS.secondary, { rx: 2, opacity: 0.75 }));

      // Benchmark value label
      parts.push(text(benchBarX + subBarWidth / 2, benchBarY - 5, `${kpi.benchmark.toFixed(1)}%`, {
        fontSize: CHART_FONTS.axisSize,
        fontWeight: 'bold',
        anchor: 'middle',
        fill: CHART_COLORS.secondary,
      }));

      // KPI name label below
      parts.push(text(groupCenterX, plotBottom + 14, kpi.name, {
        fontSize: CHART_FONTS.axisSize,
        anchor: 'middle',
        fill: CHART_COLORS.textLight,
      }));
    }

    // Legend
    const legendY = height - 6;
    const legendCenterX = width / 2;
    parts.push(rect(legendCenterX - 110, legendY - 8, 10, 10, CHART_COLORS.primary, { rx: 2 }));
    parts.push(text(legendCenterX - 96, legendY + 1, 'Company', {
      fontSize: CHART_FONTS.axisSize,
      fill: CHART_COLORS.text,
    }));
    parts.push(rect(legendCenterX + 10, legendY - 8, 10, 10, CHART_COLORS.secondary, { rx: 2 }));
    parts.push(text(legendCenterX + 24, legendY + 1, 'Benchmark', {
      fontSize: CHART_FONTS.axisSize,
      fill: CHART_COLORS.text,
    }));

    return svgWrapper(width, height, parts.join('\n'));
  }
}
