/**
 * Chart Theme Constants
 * Provides consistent color palette, dimensions, and font settings
 * for all inline SVG charts rendered in PDF reports.
 */

// Color palette for chart elements
export const CHART_COLORS = {
  primary: '#0066CC',
  secondary: '#7CB342',
  accent: '#FF9800',
  danger: '#F44336',
  warning: '#FFC107',
  success: '#4CAF50',
  grid: '#E0E0E0',
  text: '#333333',
  textLight: '#666666',
  background: '#FFFFFF',
  backgroundAlt: '#F5F5F5',
};

// Standard chart dimensions (pixels)
export const CHART_DIMENSIONS = {
  width: 540,
  height: 280,
  padding: { top: 30, right: 30, bottom: 50, left: 70 },
  barWidth: 50,
  barGap: 20,
};

// Font settings for chart text elements
export const CHART_FONTS = {
  family: "'Helvetica Neue', Arial, sans-serif",
  titleSize: 14,
  labelSize: 11,
  valueSize: 10,
  axisSize: 9,
};
