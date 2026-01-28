/**
 * Safe String Utilities Unit Tests
 * Tests that safeString, safeYear, safePeriodLabel, safeCurrency,
 * safePercentage, safeMultiple NEVER return [object Object], undefined, null, or NaN.
 */
import { describe, it, expect } from 'vitest';
import {
  safeString,
  safeYear,
  safePeriodLabel,
  safeCurrency,
  safePercentage,
  safeMultiple,
} from '../safe-string';

// ============ safeString ============

describe('safeString', () => {
  it('should return empty string for null', () => {
    expect(safeString(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(safeString(undefined)).toBe('');
  });

  it('should return the string as-is for string input', () => {
    expect(safeString('hello')).toBe('hello');
  });

  it('should convert numbers to strings', () => {
    expect(safeString(42)).toBe('42');
    expect(safeString(3.14)).toBe('3.14');
    expect(safeString(0)).toBe('0');
    expect(safeString(-100)).toBe('-100');
  });

  it('should return fallback for NaN', () => {
    expect(safeString(NaN)).toBe('');
    expect(safeString(NaN, 'N/A')).toBe('N/A');
  });

  it('should return fallback for Infinity', () => {
    expect(safeString(Infinity)).toBe('');
    expect(safeString(-Infinity, 'N/A')).toBe('N/A');
  });

  it('should convert booleans to strings', () => {
    expect(safeString(true)).toBe('true');
    expect(safeString(false)).toBe('false');
  });

  it('should convert valid Date to ISO string', () => {
    const d = new Date('2024-06-15T00:00:00.000Z');
    expect(safeString(d)).toBe('2024-06-15T00:00:00.000Z');
  });

  it('should return fallback for invalid Date', () => {
    expect(safeString(new Date('invalid'))).toBe('');
    expect(safeString(new Date('invalid'), 'N/A')).toBe('N/A');
  });

  it('should join array elements', () => {
    expect(safeString(['a', 'b', 'c'])).toBe('a, b, c');
  });

  it('should return fallback for empty array', () => {
    expect(safeString([])).toBe('');
    expect(safeString([], 'none')).toBe('none');
  });

  it('should extract from object with common properties', () => {
    expect(safeString({ label: 'Engineering' })).toBe('Engineering');
    expect(safeString({ name: 'K-Factor' })).toBe('K-Factor');
    expect(safeString({ value: 'test' })).toBe('test');
    expect(safeString({ text: 'hello' })).toBe('hello');
    expect(safeString({ title: 'Mr.' })).toBe('Mr.');
    expect(safeString({ display: 'shown' })).toBe('shown');
    expect(safeString({ year: 2024 })).toBe('2024');
    expect(safeString({ id: 'abc' })).toBe('abc');
  });

  it('should return fallback for object with no common properties', () => {
    expect(safeString({ foo: 'bar' })).toBe('');
    expect(safeString({ foo: 'bar' }, 'fallback')).toBe('fallback');
  });

  it('should NEVER return [object Object]', () => {
    const results = [
      safeString({}),
      safeString({ foo: 'bar' }),
      safeString({ nested: { deep: true } }),
      safeString(Object.create(null)),
    ];
    for (const r of results) {
      expect(r).not.toBe('[object Object]');
      expect(r).not.toContain('[object Object]');
    }
  });

  it('should use custom fallback', () => {
    expect(safeString(null, 'default')).toBe('default');
    expect(safeString(undefined, 'default')).toBe('default');
  });

  it('should prefer label key for objects', () => {
    // label comes first in the check order
    expect(safeString({ label: 'first', name: 'second' })).toBe('first');
  });

  it('should extract numeric values from object properties', () => {
    expect(safeString({ value: 42 })).toBe('42');
  });

  it('should skip null/undefined object properties', () => {
    expect(safeString({ label: null, name: 'found' })).toBe('found');
    expect(safeString({ label: undefined, value: 'yes' })).toBe('yes');
  });
});

// ============ safeYear ============

describe('safeYear', () => {
  it('should return year from a number in valid range', () => {
    expect(safeYear(2024)).toBe('2024');
    expect(safeYear(1999)).toBe('1999');
    expect(safeYear(2100)).toBe('2100');
  });

  it('should return fallback for number outside year range', () => {
    expect(safeYear(500)).toBe('');
    expect(safeYear(99999)).toBe('');
  });

  it('should extract year from plain string', () => {
    expect(safeYear('2024')).toBe('2024');
  });

  it('should extract year from FY prefix string', () => {
    expect(safeYear('FY 2024')).toBe('2024');
  });

  it('should extract year from date string', () => {
    expect(safeYear('2024-12-31')).toBe('2024');
  });

  it('should extract year from Date object', () => {
    expect(safeYear(new Date('2024-06-15'))).toBe('2024');
  });

  it('should extract year from object with year property', () => {
    expect(safeYear({ year: 2024 })).toBe('2024');
  });

  it('should extract year from object with value property', () => {
    expect(safeYear({ value: '2024' })).toBe('2024');
  });

  it('should return fallback for null', () => {
    expect(safeYear(null)).toBe('');
    expect(safeYear(null, 'N/A')).toBe('N/A');
  });

  it('should return fallback for undefined', () => {
    expect(safeYear(undefined)).toBe('');
  });

  it('should return fallback for NaN', () => {
    expect(safeYear(NaN)).toBe('');
  });

  it('should return fallback for invalid Date', () => {
    expect(safeYear(new Date('invalid'))).toBe('');
  });

  it('should return fallback for non-year string', () => {
    expect(safeYear('hello')).toBe('');
  });

  it('should return fallback for object without year-like properties', () => {
    expect(safeYear({ foo: 'bar' })).toBe('');
  });
});

// ============ safePeriodLabel ============

describe('safePeriodLabel', () => {
  it('should format as FY YYYY by default', () => {
    expect(safePeriodLabel(2024)).toBe('FY 2024');
  });

  it('should use custom prefix', () => {
    expect(safePeriodLabel(2024, 'CY')).toBe('CY 2024');
  });

  it('should handle string input', () => {
    expect(safePeriodLabel('2024')).toBe('FY 2024');
  });

  it('should handle FY-prefixed string', () => {
    expect(safePeriodLabel('FY 2024')).toBe('FY 2024');
  });

  it('should return empty string for null', () => {
    expect(safePeriodLabel(null)).toBe('');
  });

  it('should return empty string for invalid input', () => {
    expect(safePeriodLabel('hello')).toBe('');
  });
});

// ============ safeCurrency ============

describe('safeCurrency', () => {
  it('should format number as USD', () => {
    expect(safeCurrency(1_500_000)).toBe('$1,500,000');
  });

  it('should format zero as $0', () => {
    expect(safeCurrency(0)).toBe('$0');
  });

  it('should format negative numbers', () => {
    const result = safeCurrency(-500_000);
    expect(result).toContain('500,000');
  });

  it('should format string numbers', () => {
    expect(safeCurrency('2500000')).toBe('$2,500,000');
  });

  it('should handle already-formatted string with $ and commas', () => {
    expect(safeCurrency('$1,500,000')).toBe('$1,500,000');
  });

  it('should return fallback for null', () => {
    expect(safeCurrency(null)).toBe('$0');
    expect(safeCurrency(null, 'N/A')).toBe('N/A');
  });

  it('should return fallback for undefined', () => {
    expect(safeCurrency(undefined)).toBe('$0');
  });

  it('should return fallback for NaN string', () => {
    expect(safeCurrency('not a number')).toBe('$0');
  });

  it('should return fallback for objects', () => {
    expect(safeCurrency({ value: 100 })).toBe('$0');
  });

  it('should return fallback for NaN number', () => {
    expect(safeCurrency(NaN)).toBe('$0');
  });

  it('should return fallback for Infinity', () => {
    expect(safeCurrency(Infinity)).toBe('$0');
  });

  it('should format with 0 decimal places', () => {
    const result = safeCurrency(1234.56);
    expect(result).toBe('$1,235');
  });
});

// ============ safePercentage ============

describe('safePercentage', () => {
  it('should format number as percentage', () => {
    expect(safePercentage(25.5)).toBe('25.5%');
  });

  it('should format with custom decimal places', () => {
    expect(safePercentage(25.567, 2)).toBe('25.57%');
    expect(safePercentage(25, 0)).toBe('25%');
  });

  it('should format zero', () => {
    expect(safePercentage(0)).toBe('0.0%');
  });

  it('should parse string with % suffix', () => {
    expect(safePercentage('15.6%')).toBe('15.6%');
  });

  it('should parse plain numeric string', () => {
    expect(safePercentage('25.5')).toBe('25.5%');
  });

  it('should return fallback for null', () => {
    expect(safePercentage(null)).toBe('0.0%');
    expect(safePercentage(null, 1, 'N/A')).toBe('N/A');
  });

  it('should return fallback for undefined', () => {
    expect(safePercentage(undefined)).toBe('0.0%');
  });

  it('should return fallback for NaN', () => {
    expect(safePercentage(NaN)).toBe('0.0%');
  });

  it('should return fallback for objects', () => {
    expect(safePercentage({ value: 10 })).toBe('0.0%');
  });
});

// ============ safeMultiple ============

describe('safeMultiple', () => {
  it('should format number as multiple with x suffix', () => {
    expect(safeMultiple(2.50)).toBe('2.50x');
  });

  it('should format with custom suffix', () => {
    expect(safeMultiple(3.0, 'X')).toBe('3.00X');
  });

  it('should parse string with trailing x', () => {
    expect(safeMultiple('2.65x')).toBe('2.65x');
  });

  it('should parse plain numeric string', () => {
    expect(safeMultiple('3.14')).toBe('3.14x');
  });

  it('should format zero', () => {
    expect(safeMultiple(0)).toBe('0.00x');
  });

  it('should return fallback for null', () => {
    expect(safeMultiple(null)).toBe('0.00x');
    expect(safeMultiple(null, 'x', 'N/A')).toBe('N/A');
  });

  it('should return fallback for undefined', () => {
    expect(safeMultiple(undefined)).toBe('0.00x');
  });

  it('should return fallback for NaN', () => {
    expect(safeMultiple(NaN)).toBe('0.00x');
  });

  it('should return fallback for objects', () => {
    expect(safeMultiple({ value: 2 })).toBe('0.00x');
  });

  it('should return fallback for non-numeric string', () => {
    expect(safeMultiple('not a number')).toBe('0.00x');
  });
});

// ============ Cross-cutting: NEVER returns dangerous strings ============

describe('no dangerous strings in output', () => {
  const dangerousInputs = [
    null,
    undefined,
    NaN,
    Infinity,
    -Infinity,
    {},
    { foo: 'bar' },
    { nested: { deep: true } },
    [],
    new Date('invalid'),
  ];

  it('safeString NEVER returns [object Object], undefined, null, or NaN', () => {
    for (const input of dangerousInputs) {
      const result = safeString(input);
      expect(result).not.toBe('[object Object]');
      expect(result).not.toBe('undefined');
      expect(result).not.toBe('null');
      expect(result).not.toBe('NaN');
      expect(result).not.toContain('[object Object]');
    }
  });

  it('safeCurrency NEVER returns [object Object], undefined, null, or NaN', () => {
    for (const input of dangerousInputs) {
      const result = safeCurrency(input);
      expect(result).not.toBe('[object Object]');
      expect(result).not.toBe('undefined');
      expect(result).not.toBe('null');
      expect(result).not.toBe('NaN');
      expect(result).not.toContain('[object Object]');
    }
  });

  it('safePercentage NEVER returns [object Object], undefined, null, or NaN', () => {
    for (const input of dangerousInputs) {
      const result = safePercentage(input);
      expect(result).not.toBe('[object Object]');
      expect(result).not.toBe('undefined');
      expect(result).not.toBe('null');
      expect(result).not.toBe('NaN');
      expect(result).not.toContain('[object Object]');
    }
  });

  it('safeMultiple NEVER returns [object Object], undefined, null, or NaN', () => {
    for (const input of dangerousInputs) {
      const result = safeMultiple(input);
      expect(result).not.toBe('[object Object]');
      expect(result).not.toBe('undefined');
      expect(result).not.toBe('null');
      expect(result).not.toBe('NaN');
      expect(result).not.toContain('[object Object]');
    }
  });

  it('safeYear NEVER returns [object Object], undefined, null, or NaN', () => {
    for (const input of dangerousInputs) {
      const result = safeYear(input);
      expect(result).not.toBe('[object Object]');
      expect(result).not.toBe('undefined');
      expect(result).not.toBe('null');
      expect(result).not.toBe('NaN');
      expect(result).not.toContain('[object Object]');
    }
  });
});
