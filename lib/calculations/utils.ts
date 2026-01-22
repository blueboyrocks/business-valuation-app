/**
 * Calculation Engine Utilities
 */

import { CalculationStep, FormatOptions, ValidationResult } from './types';

// ============ FORMATTING ============

/**
 * Format a number as currency with optional configuration
 */
export function formatCurrency(value: number, options: FormatOptions = {}): string {
  const { decimals = 0, showCents = false, prefix = '$' } = options;
  const actualDecimals = showCents ? 2 : decimals;
  const formatted = Math.abs(value).toFixed(actualDecimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return value < 0 ? `(${prefix}${formatted})` : `${prefix}${formatted}`;
}

/**
 * Format a decimal as a percentage string
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format a number as a multiple (e.g., "2.50x")
 */
export function formatMultiple(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}x`;
}

// ============ ROUNDING ============

/**
 * Round a number to the nearest whole dollar
 */
export function roundToDollar(value: number): number {
  return Math.round(value);
}

/**
 * Round a number to the nearest thousand
 */
export function roundToThousand(value: number): number {
  return Math.round(value / 1000) * 1000;
}

/**
 * Round a number to a specific number of decimal places
 */
export function roundToDecimals(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

// ============ SAFE MATH ============

/**
 * Safely divide two numbers, returning a default value if division is invalid
 */
export function safeDivide(numerator: number, denominator: number, defaultValue: number = 0): number {
  if (denominator === 0 || !isFinite(denominator)) return defaultValue;
  const result = numerator / denominator;
  return isFinite(result) ? result : defaultValue;
}

/**
 * Convert null/undefined/NaN values to 0
 */
export function safeNumber(value: number | null | undefined): number {
  if (value === null || value === undefined || isNaN(value)) return 0;
  return value;
}

/**
 * Clamp a value between min and max bounds
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ============ WEIGHTED AVERAGE ============

/**
 * Calculate a weighted average of values
 * Default weights: Most recent year gets highest weight (3x, 2x, 1x for 3 years)
 */
export function calculateWeightedAverage(values: number[], weights?: number[]): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0];

  // Default weights by number of periods (most recent first)
  const defaultWeights: Record<number, number[]> = {
    2: [2, 1],
    3: [3, 2, 1],
    4: [4, 3, 2, 1],
    5: [5, 4, 3, 2, 1],
  };

  const actualWeights = weights || defaultWeights[values.length] || values.map((_, i) => values.length - i);
  const effectiveWeights = actualWeights.slice(0, values.length);

  const totalWeight = effectiveWeights.reduce((sum, w) => sum + w, 0);
  const weightedSum = values.reduce((sum, val, i) => sum + val * effectiveWeights[i], 0);

  return roundToDollar(safeDivide(weightedSum, totalWeight));
}

// ============ VALIDATION ============

/**
 * Validate that weights sum to 1.0
 */
export function validateWeights(weights: number[]): ValidationResult {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1.0) > 0.001) {
    return {
      valid: false,
      errors: [`Weights must sum to 1.0, got ${sum.toFixed(4)}`],
      warnings: [],
    };
  }
  return { valid: true, errors: [], warnings: [] };
}

/**
 * Validate that a value is positive
 */
export function validatePositive(value: number, fieldName: string): ValidationResult {
  if (value < 0) {
    return {
      valid: false,
      errors: [`${fieldName} cannot be negative: ${value}`],
      warnings: [],
    };
  }
  return { valid: true, errors: [], warnings: [] };
}

/**
 * Validate that a value is between 0 and 1 (percentage)
 */
export function validatePercentage(value: number, fieldName: string): ValidationResult {
  if (value < 0 || value > 1) {
    return {
      valid: false,
      errors: [`${fieldName} must be between 0 and 1, got ${value}`],
      warnings: [],
    };
  }
  return { valid: true, errors: [], warnings: [] };
}

// ============ STEP BUILDER ============

let stepCounter = 0;

/**
 * Reset the step counter (call at start of each engine run)
 */
export function resetStepCounter(): void {
  stepCounter = 0;
}

/**
 * Create a calculation step for the audit trail
 */
export function createStep(
  category: CalculationStep['category'],
  description: string,
  formula: string,
  inputs: Record<string, number | string>,
  result: number,
  notes?: string
): CalculationStep {
  stepCounter++;
  return {
    step_number: stepCounter,
    category,
    description,
    formula,
    inputs,
    result: roundToDollar(result),
    notes,
  };
}

/**
 * Get current step count
 */
export function getStepCount(): number {
  return stepCounter;
}

// ============ TABLE FORMATTERS ============

/**
 * Create a markdown table row
 */
export function tableRow(cells: string[]): string {
  return `| ${cells.join(' | ')} |`;
}

/**
 * Create a markdown table separator row
 */
export function tableSeparator(columnCount: number): string {
  return `|${Array(columnCount).fill('---').join('|')}|`;
}

/**
 * Create a complete markdown table
 */
export function createTable(headers: string[], rows: string[][]): string {
  const headerRow = tableRow(headers);
  const separator = tableSeparator(headers.length);
  const dataRows = rows.map(row => tableRow(row)).join('\n');
  return `${headerRow}\n${separator}\n${dataRows}`;
}

// ============ NUMBER PARSING ============

/**
 * Parse a string that might contain currency formatting to a number
 */
export function parseCurrency(value: string | number): number {
  if (typeof value === 'number') return value;
  // Remove $, commas, parentheses (for negative), and whitespace
  const cleaned = value.replace(/[$,\s]/g, '').replace(/^\((.+)\)$/, '-$1');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parse a percentage string to a decimal
 */
export function parsePercentage(value: string | number): number {
  if (typeof value === 'number') return value;
  const cleaned = value.replace(/%/g, '').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed / 100;
}
