/**
 * Chart Validator Tests
 * PRD-J Chart Visualization Fixes - US-001, US-002, US-004
 */
import { describe, it, expect } from 'vitest';
import {
  validateChartData,
  validateChartDataOrThrow,
  extractYear,
  sortChronologically,
  generatePlaceholderChart,
  generateYAxisTicks,
  formatYAxisLabel,
  generateYAxisLabels,
  ChartConfig,
} from '../chart-validator';

describe('Chart Validator', () => {
  describe('validateChartData', () => {
    it('should validate a valid chart config', () => {
      const config: ChartConfig = {
        id: 'test-valid',
        title: 'Revenue Trend',
        type: 'line',
        data: {
          labels: ['2022', '2023', '2024'],
          values: [4601640, 6106416, 6265024],
        },
      };

      const result = validateChartData(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty data arrays', () => {
      const config: ChartConfig = {
        id: 'test-empty',
        title: 'Test Chart',
        type: 'line',
        data: { labels: [], values: [] },
      };

      const result = validateChartData(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Empty labels array');
      expect(result.errors).toContain('Empty values array');
    });

    it('should reject when labels and values have different lengths', () => {
      const config: ChartConfig = {
        id: 'test-mismatch',
        title: 'Test Chart',
        type: 'bar',
        data: {
          labels: ['2022', '2023', '2024'],
          values: [100, 200],
        },
      };

      const result = validateChartData(config);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('different lengths'))).toBe(true);
    });

    it('should reject undefined values', () => {
      const config: ChartConfig = {
        id: 'test-undefined',
        title: 'Test Chart',
        type: 'line',
        data: {
          labels: ['2022', '2023', '2024'],
          values: [100, undefined as unknown as number, 300],
        },
      };

      const result = validateChartData(config);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('undefined'))).toBe(true);
    });

    it('should reject NaN values', () => {
      const config: ChartConfig = {
        id: 'test-nan',
        title: 'Test Chart',
        type: 'line',
        data: {
          labels: ['2022', '2023', '2024'],
          values: [100, NaN, 300],
        },
      };

      const result = validateChartData(config);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('NaN'))).toBe(true);
    });

    it('should reject non-string labels', () => {
      const config: ChartConfig = {
        id: 'test-bad-labels',
        title: 'Test Chart',
        type: 'bar',
        data: {
          labels: [2022 as unknown as string, '2023', '2024'],
          values: [100, 200, 300],
        },
      };

      const result = validateChartData(config);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('not a string'))).toBe(true);
    });

    it('should warn about N/A labels', () => {
      const config: ChartConfig = {
        id: 'test-na-labels',
        title: 'Test Chart',
        type: 'line',
        data: {
          labels: ['2022', 'N/A', '2024'],
          values: [100, 200, 300],
        },
      };

      const result = validateChartData(config);

      expect(result.valid).toBe(true); // Still valid
      expect(result.warnings.some((w) => w.includes('N/A'))).toBe(true);
    });

    it('should reject when all labels are placeholders', () => {
      const config: ChartConfig = {
        id: 'test-all-na',
        title: 'Test Chart',
        type: 'line',
        data: {
          labels: ['N/A', 'N/A', 'N/A'],
          values: [100, 200, 300],
        },
      };

      const result = validateChartData(config);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('All labels are placeholders'))).toBe(true);
    });

    it('should validate secondary values array', () => {
      const config: ChartConfig = {
        id: 'test-values2',
        title: 'SDE/EBITDA Trend',
        type: 'line',
        data: {
          labels: ['2022', '2023', '2024'],
          values: [100, 200, 300],
          values2: [80, 160], // Wrong length
        },
      };

      const result = validateChartData(config);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Secondary values'))).toBe(true);
    });

    it('should warn about invalid benchmark value', () => {
      const config: ChartConfig = {
        id: 'test-benchmark',
        title: 'Test Chart',
        type: 'bar',
        data: {
          labels: ['2022', '2023', '2024'],
          values: [100, 200, 300],
        },
        benchmark: {
          value: NaN,
          label: 'Industry Average',
        },
      };

      const result = validateChartData(config);

      expect(result.valid).toBe(true); // Still valid, just warns
      expect(result.warnings.some((w) => w.includes('Benchmark'))).toBe(true);
    });
  });

  describe('validateChartDataOrThrow', () => {
    it('should return config for valid data', () => {
      const config: ChartConfig = {
        id: 'test-valid',
        title: 'Test Chart',
        type: 'line',
        data: {
          labels: ['2022', '2023'],
          values: [100, 200],
        },
      };

      expect(validateChartDataOrThrow(config)).toBe(config);
    });

    it('should throw for invalid data', () => {
      const config: ChartConfig = {
        id: 'test-invalid',
        title: 'Test Chart',
        type: 'line',
        data: {
          labels: [],
          values: [],
        },
      };

      expect(() => validateChartDataOrThrow(config)).toThrow('Invalid chart data');
    });
  });

  describe('extractYear', () => {
    it('should extract year from simple year string', () => {
      expect(extractYear('2024')).toBe(2024);
    });

    it('should extract year from FY format', () => {
      expect(extractYear('FY2024')).toBe(2024);
      expect(extractYear('FY 2023')).toBe(2023);
    });

    it('should extract year from quarter format', () => {
      expect(extractYear('2024-Q1')).toBe(2024);
      expect(extractYear('Q1 2024')).toBe(2024);
    });

    it('should extract year from Year prefix', () => {
      expect(extractYear('Year 2022')).toBe(2022);
    });

    it('should return 0 for invalid input', () => {
      expect(extractYear('')).toBe(0);
      expect(extractYear('N/A')).toBe(0);
      expect(extractYear(null as unknown as string)).toBe(0);
    });

    it('should handle 2-digit years', () => {
      expect(extractYear("'24")).toBe(2024);
      expect(extractYear("'99")).toBe(1999);
    });
  });

  describe('sortChronologically', () => {
    it('should sort years in ascending order', () => {
      const result = sortChronologically(
        ['2024', '2022', '2023'],
        [300, 100, 200]
      );

      expect(result.labels).toEqual(['2022', '2023', '2024']);
      expect(result.values).toEqual([100, 200, 300]);
    });

    it('should sort with secondary values', () => {
      const result = sortChronologically(
        ['2024', '2022', '2023'],
        [300, 100, 200],
        [30, 10, 20]
      );

      expect(result.labels).toEqual(['2022', '2023', '2024']);
      expect(result.values).toEqual([100, 200, 300]);
      expect(result.values2).toEqual([10, 20, 30]);
    });

    it('should handle FY format', () => {
      const result = sortChronologically(
        ['FY2024', 'FY2022', 'FY2023'],
        [300, 100, 200]
      );

      expect(result.labels).toEqual(['FY2022', 'FY2023', 'FY2024']);
      expect(result.values).toEqual([100, 200, 300]);
    });

    it('should handle empty arrays', () => {
      const result = sortChronologically([], []);

      expect(result.labels).toEqual([]);
      expect(result.values).toEqual([]);
    });

    it('should handle already sorted data', () => {
      const result = sortChronologically(
        ['2022', '2023', '2024'],
        [100, 200, 300]
      );

      expect(result.labels).toEqual(['2022', '2023', '2024']);
      expect(result.values).toEqual([100, 200, 300]);
    });
  });

  describe('generatePlaceholderChart', () => {
    it('should generate valid SVG', () => {
      const svg = generatePlaceholderChart('Revenue Trend', 'Requires 2+ years of data');

      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('Insufficient Data');
      expect(svg).toContain('Revenue Trend');
      expect(svg).toContain('Requires 2+ years of data');
    });

    it('should accept custom dimensions', () => {
      const svg = generatePlaceholderChart('Test', 'Reason', 300, 200);

      expect(svg).toContain('width="300"');
      expect(svg).toContain('height="200"');
    });
  });

  describe('generateYAxisTicks', () => {
    it('should generate nice tick values', () => {
      const ticks = generateYAxisTicks(0, 100, 5);

      expect(ticks.length).toBeGreaterThanOrEqual(4);
      expect(ticks.length).toBeLessThanOrEqual(7);
      expect(ticks[0]).toBeLessThanOrEqual(0);
      expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(100);
    });

    it('should handle large numbers', () => {
      const ticks = generateYAxisTicks(0, 5_000_000, 5);

      expect(ticks.length).toBeGreaterThanOrEqual(4);
      expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(5_000_000);
    });

    it('should handle small decimals', () => {
      const ticks = generateYAxisTicks(0, 0.5, 5);

      expect(ticks.length).toBeGreaterThanOrEqual(4);
      expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(0.5);
    });
  });

  describe('formatYAxisLabel', () => {
    it('should format currency values', () => {
      expect(formatYAxisLabel(1_500_000, '$')).toBe('$1.5M');
      expect(formatYAxisLabel(500_000, '$')).toBe('$500K');
      expect(formatYAxisLabel(1000, '$')).toBe('$1K');
    });

    it('should format percentage values', () => {
      expect(formatYAxisLabel(25, '%')).toBe('25%');
      expect(formatYAxisLabel(12.5, '%')).toBe('13%'); // Rounded
    });

    it('should format multiplier values', () => {
      expect(formatYAxisLabel(2.5, 'x')).toBe('3x'); // Rounded
    });

    it('should format plain numbers', () => {
      expect(formatYAxisLabel(1_000_000)).toBe('1.0M');
      expect(formatYAxisLabel(1000)).toBe('1K');
    });

    it('should handle billions', () => {
      expect(formatYAxisLabel(2_500_000_000, '$')).toBe('$2.5B');
    });
  });

  describe('generateYAxisLabels', () => {
    it('should generate labels with values and formatted strings', () => {
      const labels = generateYAxisLabels(0, 1_000_000, '$', 5);

      expect(labels.length).toBeGreaterThanOrEqual(4);
      expect(labels[0]).toHaveProperty('value');
      expect(labels[0]).toHaveProperty('label');
      expect(labels[0].label).toMatch(/^\$/);
    });

    it('should generate percentage labels', () => {
      const labels = generateYAxisLabels(0, 100, '%', 5);

      expect(labels.length).toBeGreaterThanOrEqual(4);
      expect(labels[labels.length - 1].label).toMatch(/%$/);
    });
  });
});
