/**
 * Chart Data Validator
 * Validates chart data before rendering to ensure no broken charts are displayed.
 * PRD-J Chart Visualization Fixes - US-001
 */

import { CHART_COLORS, CHART_DIMENSIONS, CHART_FONTS } from './theme';
import { rect, text, svgWrapper } from './svg-primitives';

// ============ INTERFACES ============

export interface ChartData {
  labels: string[];
  values: number[];
  values2?: number[];
}

export interface ChartConfig {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'area' | 'gauge' | 'range' | 'grouped-bar';
  data: ChartData;
  xAxis?: {
    title?: string;
    sortChronological?: boolean;
  };
  yAxis?: {
    title?: string;
    unit?: '%' | '$' | 'x' | 'ratio' | 'count';
    min?: number;
    max?: number;
    tickCount?: number;
  };
  benchmark?: {
    value: number;
    label: string;
    lineStyle?: 'solid' | 'dashed' | 'dotted';
  };
}

export interface ChartValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedConfig?: ChartConfig;
}

// ============ VALIDATION FUNCTIONS ============

/**
 * Validates chart data before rendering.
 * Returns validation result with errors, warnings, and optionally sanitized config.
 */
export function validateChartData(config: ChartConfig): ChartValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check data object exists
  if (!config.data) {
    errors.push('Missing data object');
    return { valid: false, errors, warnings };
  }

  // Check data arrays exist
  if (!config.data.labels) {
    errors.push('Missing labels array');
  }
  if (!config.data.values) {
    errors.push('Missing values array');
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  // Check arrays have data
  if (config.data.labels.length === 0) {
    errors.push('Empty labels array');
  }
  if (config.data.values.length === 0) {
    errors.push('Empty values array');
  }

  // Check arrays same length
  if (config.data.labels.length !== config.data.values.length) {
    errors.push(
      `Labels and values arrays different lengths: ${config.data.labels.length} labels vs ${config.data.values.length} values`
    );
  }

  // Check secondary values array length if present
  if (config.data.values2 && config.data.values2.length !== config.data.labels.length) {
    errors.push(
      `Secondary values array different length: ${config.data.values2.length} vs ${config.data.labels.length} labels`
    );
  }

  // Check all values are valid numbers
  for (let i = 0; i < config.data.values.length; i++) {
    const val = config.data.values[i];
    if (val === undefined || val === null) {
      errors.push(`Value at index ${i} is ${val}`);
    } else if (typeof val !== 'number') {
      errors.push(`Value at index ${i} is not a number: ${typeof val}`);
    } else if (isNaN(val)) {
      errors.push(`Value at index ${i} is NaN`);
    }
  }

  // Check secondary values if present
  if (config.data.values2) {
    for (let i = 0; i < config.data.values2.length; i++) {
      const val = config.data.values2[i];
      if (val === undefined || val === null) {
        errors.push(`Secondary value at index ${i} is ${val}`);
      } else if (typeof val !== 'number') {
        errors.push(`Secondary value at index ${i} is not a number: ${typeof val}`);
      } else if (isNaN(val)) {
        errors.push(`Secondary value at index ${i} is NaN`);
      }
    }
  }

  // Check labels are strings
  for (let i = 0; i < config.data.labels.length; i++) {
    const label = config.data.labels[i];
    if (typeof label !== 'string') {
      errors.push(`Label at index ${i} is not a string: ${typeof label}`);
    } else if (label === 'N/A' || label === 'undefined' || label === 'null') {
      warnings.push(`Label at index ${i} is placeholder: "${label}"`);
    }
  }

  // Check for all N/A labels
  if (
    config.data.labels.length > 0 &&
    config.data.labels.every((l) => l === 'N/A' || l === 'undefined' || l === 'null' || l === '')
  ) {
    errors.push('All labels are placeholders - no valid data');
  }

  // Check benchmark value if present
  if (config.benchmark) {
    if (typeof config.benchmark.value !== 'number' || isNaN(config.benchmark.value)) {
      warnings.push('Benchmark value is not a valid number');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates chart data and returns sanitized config or throws on critical errors.
 */
export function validateChartDataOrThrow(config: ChartConfig): ChartConfig {
  const result = validateChartData(config);
  if (!result.valid) {
    throw new Error(`Invalid chart data: ${result.errors.join('; ')}`);
  }
  return config;
}

// ============ CHRONOLOGICAL SORTING ============

/**
 * Extracts a year from various label formats.
 * Handles: '2024', 'FY2024', '2024-Q1', 'Q1 2024', 'Year 2024', etc.
 */
export function extractYear(label: string): number {
  if (!label || typeof label !== 'string') return 0;

  // Try to find a 4-digit year in the string (19xx or 20xx)
  // Use a more permissive pattern that doesn't require word boundary before
  const yearMatch = label.match(/(19|20)\d{2}/);
  if (yearMatch) {
    return parseInt(yearMatch[0], 10);
  }

  // Try to find a 2-digit year prefixed with ' or standalone
  const shortYearMatch = label.match(/'(\d{2})\b|\b(\d{2})\b/);
  if (shortYearMatch) {
    const shortYear = parseInt(shortYearMatch[1] || shortYearMatch[2], 10);
    return shortYear < 50 ? 2000 + shortYear : 1900 + shortYear;
  }

  return 0;
}

/**
 * Sorts chart data chronologically by year (ascending: oldest first).
 * Returns new arrays, does not mutate inputs.
 */
export function sortChronologically(
  labels: string[],
  values: number[],
  values2?: number[]
): { labels: string[]; values: number[]; values2?: number[] } {
  if (!labels || labels.length === 0) {
    return { labels: [], values: [], values2: values2 ? [] : undefined };
  }

  // Create pairs of label, value, and optional value2 with extracted year
  const pairs = labels.map((label, i) => ({
    label,
    value: values[i],
    value2: values2 ? values2[i] : undefined,
    year: extractYear(label),
  }));

  // Sort by year ascending (oldest first)
  pairs.sort((a, b) => a.year - b.year);

  return {
    labels: pairs.map((p) => p.label),
    values: pairs.map((p) => p.value),
    values2: values2 ? pairs.map((p) => p.value2!) : undefined,
  };
}

// ============ PLACEHOLDER CHART ============

/**
 * Generates a placeholder chart SVG for when data is insufficient or invalid.
 */
export function generatePlaceholderChart(
  title: string,
  reason: string,
  width: number = CHART_DIMENSIONS.width,
  height: number = CHART_DIMENSIONS.height
): string {
  const parts: string[] = [];

  // Background
  parts.push(rect(0, 0, width, height, CHART_COLORS.backgroundAlt));

  // Border
  parts.push(
    `<rect x="1" y="1" width="${width - 2}" height="${height - 2}" fill="none" stroke="${CHART_COLORS.grid}" stroke-width="1" rx="4"/>`
  );

  // Icon placeholder (chart bar icon using simple SVG)
  const iconX = width / 2;
  const iconY = height / 2 - 30;
  parts.push(`<g transform="translate(${iconX - 24}, ${iconY - 24})" fill="${CHART_COLORS.textLight}" opacity="0.5">`);
  parts.push('  <rect x="4" y="20" width="8" height="24" rx="1"/>');
  parts.push('  <rect x="16" y="12" width="8" height="32" rx="1"/>');
  parts.push('  <rect x="28" y="4" width="8" height="40" rx="1"/>');
  parts.push('  <rect x="40" y="16" width="8" height="28" rx="1"/>');
  parts.push('</g>');

  // Title
  parts.push(
    text(width / 2, iconY + 50, title || 'Chart', {
      fontSize: CHART_FONTS.titleSize,
      fontWeight: 'bold',
      anchor: 'middle',
      fill: CHART_COLORS.text,
    })
  );

  // "Insufficient Data" message
  parts.push(
    text(width / 2, iconY + 72, 'Insufficient Data for Visualization', {
      fontSize: CHART_FONTS.labelSize,
      anchor: 'middle',
      fill: CHART_COLORS.textLight,
    })
  );

  // Reason
  if (reason) {
    parts.push(
      text(width / 2, iconY + 90, reason, {
        fontSize: CHART_FONTS.axisSize,
        anchor: 'middle',
        fill: CHART_COLORS.textLight,
      })
    );
  }

  return svgWrapper(width, height, parts.join('\n'));
}

// ============ Y-AXIS LABEL GENERATION ============

/**
 * Generates nice tick values for Y-axis scale.
 * Returns array of tick values from min to max.
 */
export function generateYAxisTicks(
  dataMin: number,
  dataMax: number,
  tickCount: number = 5
): number[] {
  if (dataMax <= dataMin) {
    return [0];
  }

  // Calculate nice step
  const range = dataMax - dataMin;
  const rawStep = range / tickCount;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;

  let niceStep: number;
  if (normalized <= 1) niceStep = 1 * magnitude;
  else if (normalized <= 2) niceStep = 2 * magnitude;
  else if (normalized <= 2.5) niceStep = 2.5 * magnitude;
  else if (normalized <= 5) niceStep = 5 * magnitude;
  else niceStep = 10 * magnitude;

  // Calculate nice min and max
  const niceMin = Math.floor(dataMin / niceStep) * niceStep;
  const niceMax = Math.ceil(dataMax / niceStep) * niceStep;

  // Generate ticks
  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + niceStep / 2; v += niceStep) {
    ticks.push(v);
  }

  return ticks;
}

/**
 * Formats a number as a compact label with the specified unit.
 */
export function formatYAxisLabel(value: number, unit?: '%' | '$' | 'x' | 'ratio' | 'count'): string {
  const absValue = Math.abs(value);

  // Format number with abbreviation
  let formatted: string;
  if (absValue >= 1_000_000_000) {
    formatted = `${(value / 1_000_000_000).toFixed(1)}B`;
  } else if (absValue >= 1_000_000) {
    formatted = `${(value / 1_000_000).toFixed(1)}M`;
  } else if (absValue >= 1_000) {
    formatted = `${(value / 1_000).toFixed(0)}K`;
  } else if (absValue >= 1 || absValue === 0) {
    formatted = value.toFixed(0);
  } else {
    formatted = value.toFixed(2);
  }

  // Apply unit prefix/suffix
  switch (unit) {
    case '$':
      return `$${formatted}`;
    case '%':
      return `${formatted}%`;
    case 'x':
      return `${formatted}x`;
    case 'ratio':
      return formatted;
    case 'count':
    default:
      return formatted;
  }
}

/**
 * Generates Y-axis labels array with positions and formatted values.
 */
export function generateYAxisLabels(
  min: number,
  max: number,
  unit?: '%' | '$' | 'x' | 'ratio' | 'count',
  tickCount: number = 5
): { value: number; label: string }[] {
  const ticks = generateYAxisTicks(min, max, tickCount);
  return ticks.map((value) => ({
    value,
    label: formatYAxisLabel(value, unit),
  }));
}
