/**
 * Chart Theme Constants
 * Provides consistent color palette, dimensions, and font settings
 * for all inline SVG charts rendered in PDF reports.
 *
 * Colors are derived from the centralized design system tokens
 * (lib/pdf/design-tokens.ts) to ensure visual consistency between
 * charts, tables, and all other PDF elements.
 */

import { COLORS, CHART_COLOR_PALETTE, TYPOGRAPHY } from '../pdf/design-tokens';

// Color palette for chart elements — derived from design tokens
export const CHART_COLORS = {
  primary: COLORS.primary,        // #1E3A5F navy
  secondary: COLORS.primaryLight, // #2E5A8F lighter navy
  accent: COLORS.accent,          // #C9A962 gold
  danger: COLORS.negative,        // #DC2626 red
  warning: '#FFC107',             // amber (chart-specific, not in design tokens)
  success: COLORS.positive,       // #059669 green
  grid: COLORS.border,            // #E5E7EB light gray
  text: COLORS.text,              // #1F2937 dark gray
  textLight: COLORS.textLight,    // #6B7280 medium gray
  background: COLORS.background,  // #FFFFFF white
  backgroundAlt: COLORS.backgroundAlt, // #F9FAFB light gray
};

/**
 * Ordered multi-series color palette for charts with multiple data series.
 * Re-exported from design tokens for convenient access by chart generators.
 */
export const CHART_SERIES_PALETTE = CHART_COLOR_PALETTE;

// Standard chart dimensions (pixels)
export const CHART_DIMENSIONS = {
  width: 540,
  height: 280,
  padding: { top: 30, right: 30, bottom: 50, left: 70 },
  barWidth: 50,
  barGap: 20,
};

// Font settings for chart text elements — derived from design tokens
export const CHART_FONTS = {
  family: TYPOGRAPHY.bodyFont,
  titleSize: 14,
  labelSize: 11,
  valueSize: 10,
  axisSize: 9,
};
