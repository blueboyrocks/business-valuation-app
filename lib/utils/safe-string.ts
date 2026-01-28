/**
 * Safe string conversion utilities to prevent [object Object], undefined, null,
 * and NaN from appearing in report output.
 */

const COMMON_OBJECT_KEYS = ['label', 'name', 'value', 'text', 'title', 'display', 'year', 'id'] as const;

/**
 * Safely convert any value to a string, never returning [object Object],
 * undefined, null, or NaN.
 */
export function safeString(value: unknown, fallback: string = ''): string {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    if (Number.isNaN(value) || !Number.isFinite(value)) {
      return fallback;
    }
    return String(value);
  }

  if (typeof value === 'boolean') {
    return String(value);
  }

  if (value instanceof Date) {
    if (isNaN(value.getTime())) {
      return fallback;
    }
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return fallback;
    }
    return value.map(item => safeString(item, '')).filter(Boolean).join(', ');
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    for (const key of COMMON_OBJECT_KEYS) {
      if (key in obj && obj[key] !== null && obj[key] !== undefined) {
        const extracted = obj[key];
        if (typeof extracted === 'string') return extracted;
        if (typeof extracted === 'number' && !Number.isNaN(extracted)) return String(extracted);
      }
    }
    return fallback;
  }

  return fallback;
}

/**
 * Extract a 4-digit year from various value types.
 * Handles numbers (2024), strings ("2024", "FY 2024", "2024-12-31"),
 * dates, and objects with year-like properties.
 */
export function safeYear(value: unknown, fallback: string = ''): string {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === 'number') {
    if (Number.isNaN(value) || !Number.isFinite(value)) {
      return fallback;
    }
    if (value >= 1900 && value <= 2100) {
      return String(value);
    }
    return fallback;
  }

  if (typeof value === 'string') {
    const yearMatch = value.match(/\b((?:19|20)\d{2})\b/);
    if (yearMatch) {
      return yearMatch[1];
    }
    return fallback;
  }

  if (value instanceof Date) {
    if (isNaN(value.getTime())) {
      return fallback;
    }
    return String(value.getFullYear());
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    for (const key of ['year', 'value', 'label', 'name', 'text', 'display'] as const) {
      if (key in obj && obj[key] !== null && obj[key] !== undefined) {
        const result = safeYear(obj[key], '');
        if (result) return result;
      }
    }
    return fallback;
  }

  return fallback;
}

/**
 * Format a value as a period label like "FY 2024".
 */
export function safePeriodLabel(value: unknown, prefix: string = 'FY'): string {
  const year = safeYear(value);
  if (!year) {
    return '';
  }
  return `${prefix} ${year}`;
}

/**
 * Format a number as USD currency using Intl.NumberFormat with 0 decimal places.
 */
export function safeCurrency(value: unknown, fallback: string = '$0'): string {
  if (value === null || value === undefined) {
    return fallback;
  }

  let num: number;
  if (typeof value === 'number') {
    num = value;
  } else if (typeof value === 'string') {
    num = parseFloat(value.replace(/[$,]/g, ''));
  } else {
    return fallback;
  }

  if (Number.isNaN(num) || !Number.isFinite(num)) {
    return fallback;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Format a number as a percentage string.
 * Assumes value is already in percentage form (e.g., 25.5 -> "25.5%").
 */
export function safePercentage(value: unknown, decimals: number = 1, fallback: string = '0.0%'): string {
  if (value === null || value === undefined) {
    return fallback;
  }

  let num: number;
  if (typeof value === 'number') {
    num = value;
  } else if (typeof value === 'string') {
    num = parseFloat(value.replace(/%/g, ''));
  } else {
    return fallback;
  }

  if (Number.isNaN(num) || !Number.isFinite(num)) {
    return fallback;
  }

  return `${num.toFixed(decimals)}%`;
}

/**
 * Format a number as a multiple with suffix like "2.50x".
 */
export function safeMultiple(value: unknown, suffix: string = 'x', fallback: string = '0.00x'): string {
  if (value === null || value === undefined) {
    return fallback;
  }

  let num: number;
  if (typeof value === 'number') {
    num = value;
  } else if (typeof value === 'string') {
    num = parseFloat(value.replace(/x$/i, ''));
  } else {
    return fallback;
  }

  if (Number.isNaN(num) || !Number.isFinite(num)) {
    return fallback;
  }

  return `${num.toFixed(2)}${suffix}`;
}
