/**
 * IndustryMultiplesLookup - Enhanced Industry Multiples with Ranges
 *
 * This module provides structured access to industry multiples with:
 * - Low, median, and high ranges for each multiple type
 * - Hard ceilings to prevent multiple inflation
 * - Validation of selected multiples
 * - Recommended multiple calculation based on company factors
 *
 * CRITICAL: This fixes the $4.1M valuation error by enforcing proper ranges
 */

import industryDatabase from './industry-multiples-database.json';

// ============ TYPES ============

export interface MultipleRange {
  low: number;
  median: number;
  high: number;
  ceiling: number; // Hard maximum (typically high * 1.2)
  source: string;
}

export interface IndustryMultiples {
  naics_code: string;
  industry_name: string;
  sde_multiple: MultipleRange;
  ebitda_multiple: MultipleRange;
  revenue_multiple: MultipleRange;
  notes: string;
}

export interface MultipleValidationResult {
  valid: boolean;
  within_typical_range: boolean;
  warning?: string;
  error?: string;
  suggested_range?: { low: number; high: number };
}

export interface CompanyFactors {
  revenue_growth_rate?: number;
  profit_margin?: number;
  risk_score?: number;
  customer_concentration?: number;
  owner_dependency?: number;
}

export interface MultipleRecommendation {
  sde_multiple: number;
  position: 'low' | 'median' | 'high';
  adjustments: Array<{ factor: string; adjustment: number }>;
  rationale: string;
}

// ============ PARSED MULTIPLE RANGES ============

// Pre-defined ranges based on industry valuation rules
// These are enhanced from the database with proper low/median/high values
const ENHANCED_MULTIPLES: Record<string, Omit<IndustryMultiples, 'naics_code' | 'industry_name' | 'notes'>> = {
  '541330': { // Engineering Services
    sde_multiple: { low: 2.0, median: 2.65, high: 3.5, ceiling: 4.2, source: 'Business Reference Guide' },
    ebitda_multiple: { low: 3.0, median: 4.5, high: 6.0, ceiling: 7.2, source: 'Business Reference Guide' },
    revenue_multiple: { low: 0.30, median: 0.45, high: 0.60, ceiling: 0.72, source: 'Business Reference Guide' },
  },
  '541211': { // Accounting Firms
    sde_multiple: { low: 2.5, median: 3.0, high: 3.5, ceiling: 4.2, source: 'Business Reference Guide' },
    ebitda_multiple: { low: 4.0, median: 5.0, high: 6.0, ceiling: 7.2, source: 'Business Reference Guide' },
    revenue_multiple: { low: 0.40, median: 0.75, high: 1.25, ceiling: 1.5, source: 'Business Reference Guide' },
  },
  '541810': { // Advertising Agencies
    sde_multiple: { low: 2.0, median: 3.0, high: 4.0, ceiling: 4.8, source: 'Business Reference Guide' },
    ebitda_multiple: { low: 3.0, median: 4.5, high: 6.0, ceiling: 7.2, source: 'Business Reference Guide' },
    revenue_multiple: { low: 0.40, median: 0.55, high: 0.75, ceiling: 0.9, source: 'Business Reference Guide' },
  },
  '541310': { // Architectural Firms
    sde_multiple: { low: 2.0, median: 2.5, high: 3.0, ceiling: 3.6, source: 'Business Reference Guide' },
    ebitda_multiple: { low: 3.0, median: 4.0, high: 5.0, ceiling: 6.0, source: 'Business Reference Guide' },
    revenue_multiple: { low: 0.40, median: 0.50, high: 0.60, ceiling: 0.72, source: 'Business Reference Guide' },
  },
  '541511': { // Software Development
    sde_multiple: { low: 3.0, median: 5.0, high: 8.0, ceiling: 9.6, source: 'Business Reference Guide' },
    ebitda_multiple: { low: 6.0, median: 10.0, high: 15.0, ceiling: 18.0, source: 'Business Reference Guide' },
    revenue_multiple: { low: 1.0, median: 2.0, high: 3.0, ceiling: 3.6, source: 'Business Reference Guide' },
  },
  '722511': { // Full-Service Restaurants
    sde_multiple: { low: 2.5, median: 3.0, high: 3.5, ceiling: 4.2, source: 'Business Reference Guide' },
    ebitda_multiple: { low: 3.0, median: 4.0, high: 5.0, ceiling: 6.0, source: 'Business Reference Guide' },
    revenue_multiple: { low: 0.30, median: 0.35, high: 0.40, ceiling: 0.48, source: 'Business Reference Guide' },
  },
  '238220': { // HVAC Contractors
    sde_multiple: { low: 2.5, median: 3.0, high: 3.5, ceiling: 4.2, source: 'Business Reference Guide' },
    ebitda_multiple: { low: 3.0, median: 4.0, high: 5.0, ceiling: 6.0, source: 'Business Reference Guide' },
    revenue_multiple: { low: 0.40, median: 0.50, high: 0.60, ceiling: 0.72, source: 'Business Reference Guide' },
  },
  '511210': { // SaaS Companies
    sde_multiple: { low: 5.0, median: 7.0, high: 10.0, ceiling: 12.0, source: 'Business Reference Guide' },
    ebitda_multiple: { low: 8.0, median: 12.0, high: 20.0, ceiling: 24.0, source: 'Business Reference Guide' },
    revenue_multiple: { low: 3.0, median: 6.0, high: 10.0, ceiling: 12.0, source: 'Business Reference Guide' },
  },
  '621210': { // Dental Practices
    sde_multiple: { low: 3.0, median: 3.5, high: 4.0, ceiling: 4.8, source: 'Business Reference Guide' },
    ebitda_multiple: { low: 5.0, median: 6.0, high: 7.0, ceiling: 8.4, source: 'Business Reference Guide' },
    revenue_multiple: { low: 0.60, median: 0.70, high: 0.80, ceiling: 0.96, source: 'Business Reference Guide' },
  },
  '524210': { // Insurance Agencies
    sde_multiple: { low: 3.0, median: 4.0, high: 5.0, ceiling: 6.0, source: 'Business Reference Guide' },
    ebitda_multiple: { low: 5.0, median: 6.5, high: 8.0, ceiling: 9.6, source: 'Business Reference Guide' },
    revenue_multiple: { low: 1.0, median: 1.25, high: 1.5, ceiling: 1.8, source: 'Business Reference Guide' },
  },
};

// ============ LOOKUP CLASS ============

export class IndustryMultiplesLookup {
  private industries: typeof industryDatabase.industries;

  constructor() {
    this.industries = industryDatabase.industries;
  }

  /**
   * Get industry by exact NAICS code
   */
  getIndustryByNAICS(naicsCode: string) {
    return this.industries.find((i) => i.naics_code === naicsCode) || null;
  }

  /**
   * Get industry by partial NAICS code (first 4 digits)
   */
  getIndustryByPartialNAICS(partialCode: string) {
    return this.industries.find((i) => i.naics_code.startsWith(partialCode)) || null;
  }

  /**
   * Get all industries
   */
  getAllIndustries() {
    return [...this.industries];
  }

  /**
   * Get SDE multiple range for an industry
   */
  getSDEMultipleRange(naicsCode: string): MultipleRange | null {
    // Check enhanced multiples first
    if (ENHANCED_MULTIPLES[naicsCode]) {
      return ENHANCED_MULTIPLES[naicsCode].sde_multiple;
    }

    // Fall back to parsing from database
    const industry = this.getIndustryByNAICS(naicsCode);
    if (!industry) return null;

    return this.parseMultipleRange(industry, 'sde');
  }

  /**
   * Get EBITDA multiple range for an industry
   */
  getEBITDAMultipleRange(naicsCode: string): MultipleRange | null {
    if (ENHANCED_MULTIPLES[naicsCode]) {
      return ENHANCED_MULTIPLES[naicsCode].ebitda_multiple;
    }

    const industry = this.getIndustryByNAICS(naicsCode);
    if (!industry) return null;

    return this.parseMultipleRange(industry, 'ebitda');
  }

  /**
   * Get revenue multiple range for an industry
   */
  getRevenueMultipleRange(naicsCode: string): MultipleRange | null {
    if (ENHANCED_MULTIPLES[naicsCode]) {
      return ENHANCED_MULTIPLES[naicsCode].revenue_multiple;
    }

    const industry = this.getIndustryByNAICS(naicsCode);
    if (!industry) return null;

    return this.parseMultipleRange(industry, 'revenue');
  }

  /**
   * Get hard ceiling for SDE multiple
   */
  getSDEMultipleCeiling(naicsCode: string): number {
    const range = this.getSDEMultipleRange(naicsCode);
    if (!range) return 5.0; // Default ceiling
    return range.ceiling;
  }

  /**
   * Validate an SDE multiple for an industry
   */
  validateSDEMultiple(naicsCode: string, multiple: number): MultipleValidationResult {
    const range = this.getSDEMultipleRange(naicsCode);

    if (!range) {
      return {
        valid: true,
        within_typical_range: true,
        warning: `No data available for NAICS ${naicsCode}, using default validation`,
      };
    }

    // Check against ceiling
    if (multiple > range.ceiling) {
      return {
        valid: false,
        within_typical_range: false,
        error: `Multiple of ${multiple.toFixed(2)}x exceeds hard ceiling of ${range.ceiling}x for this industry`,
        suggested_range: { low: range.low, high: range.high },
      };
    }

    // Check against typical range
    if (multiple > range.high) {
      return {
        valid: true,
        within_typical_range: false,
        warning: `Multiple of ${multiple.toFixed(2)}x is above typical range of ${range.low}x-${range.high}x but below ceiling`,
        suggested_range: { low: range.low, high: range.high },
      };
    }

    if (multiple < range.low) {
      return {
        valid: true,
        within_typical_range: false,
        warning: `Multiple of ${multiple.toFixed(2)}x is below typical range of ${range.low}x-${range.high}x`,
        suggested_range: { low: range.low, high: range.high },
      };
    }

    return {
      valid: true,
      within_typical_range: true,
    };
  }

  /**
   * Get recommended multiple based on company factors
   */
  getRecommendedMultiple(naicsCode: string, factors: CompanyFactors): MultipleRecommendation {
    const range = this.getSDEMultipleRange(naicsCode);

    if (!range) {
      return {
        sde_multiple: 2.5, // Default
        position: 'median',
        adjustments: [],
        rationale: 'Using default multiple due to unavailable industry data',
      };
    }

    let multiple = range.median;
    const adjustments: Array<{ factor: string; adjustment: number }> = [];
    let position: 'low' | 'median' | 'high' = 'median';

    // Adjust for revenue growth
    if (factors.revenue_growth_rate !== undefined) {
      if (factors.revenue_growth_rate > 0.20) {
        const adjustment = Math.min(0.3, factors.revenue_growth_rate);
        multiple += adjustment;
        adjustments.push({ factor: 'High Revenue Growth', adjustment });
      } else if (factors.revenue_growth_rate < 0) {
        const adjustment = Math.max(-0.3, factors.revenue_growth_rate);
        multiple += adjustment;
        adjustments.push({ factor: 'Revenue Decline', adjustment });
      }
    }

    // Adjust for risk score
    if (factors.risk_score !== undefined) {
      if (factors.risk_score > 60) {
        const adjustment = -0.2 - (factors.risk_score - 60) * 0.01;
        multiple += adjustment;
        adjustments.push({ factor: 'High Risk', adjustment });
      } else if (factors.risk_score < 30) {
        const adjustment = 0.1 + (30 - factors.risk_score) * 0.005;
        multiple += adjustment;
        adjustments.push({ factor: 'Low Risk', adjustment });
      }
    }

    // Adjust for customer concentration
    if (factors.customer_concentration !== undefined) {
      if (factors.customer_concentration > 0.40) {
        const adjustment = -0.15;
        multiple += adjustment;
        adjustments.push({ factor: 'High Customer Concentration', adjustment });
      } else if (factors.customer_concentration < 0.20) {
        const adjustment = 0.1;
        multiple += adjustment;
        adjustments.push({ factor: 'Diversified Customer Base', adjustment });
      }
    }

    // Ensure within bounds
    multiple = Math.max(range.low, Math.min(range.ceiling, multiple));

    // Determine position
    if (multiple <= range.low + (range.median - range.low) * 0.3) {
      position = 'low';
    } else if (multiple >= range.median + (range.high - range.median) * 0.7) {
      position = 'high';
    }

    const rationale = adjustments.length > 0
      ? `Median of ${range.median}x adjusted for: ${adjustments.map((a) => a.factor).join(', ')}`
      : `Using industry median of ${range.median}x`;

    return {
      sde_multiple: Math.round(multiple * 100) / 100,
      position,
      adjustments,
      rationale,
    };
  }

  /**
   * Parse multiple range from industry data
   */
  private parseMultipleRange(
    industry: (typeof industryDatabase.industries)[0],
    type: 'sde' | 'ebitda' | 'revenue'
  ): MultipleRange {
    // Parse from valuation_rules text
    const rules = industry.valuation_rules || [];

    let low: number;
    let high: number;

    if (type === 'sde') {
      const sdeRule = rules.find((r) => r.toLowerCase().includes('sde'));
      const parsed = this.parseRangeFromRule(sdeRule);
      low = parsed.low || industry.typical_sde_multiple * 0.75;
      high = parsed.high || industry.typical_sde_multiple * 1.25;
    } else if (type === 'ebitda') {
      const ebitdaRule = rules.find((r) => r.toLowerCase().includes('ebitda'));
      const parsed = this.parseRangeFromRule(ebitdaRule);
      low = parsed.low || industry.typical_ebitda_multiple * 0.75;
      high = parsed.high || industry.typical_ebitda_multiple * 1.25;
    } else {
      const revenueRule = rules.find((r) => r.toLowerCase().includes('revenue'));
      const parsed = this.parseRangeFromRule(revenueRule);
      low = parsed.low || industry.typical_revenue_multiple * 0.75;
      high = parsed.high || industry.typical_revenue_multiple * 1.25;
    }

    const median = (low + high) / 2;
    const ceiling = high * 1.2;

    return {
      low,
      median,
      high,
      ceiling,
      source: 'Business Reference Guide',
    };
  }

  /**
   * Parse low/high values from a rule string like "2 to 3 times SDE"
   */
  private parseRangeFromRule(rule: string | undefined): { low: number; high: number } | { low: null; high: null } {
    if (!rule) return { low: null, high: null };

    // Match patterns like "2 to 3", "2.5 to 3.5", "40% to 60%"
    const rangeMatch = rule.match(/([\d.]+)\s*(?:to|-)\s*([\d.]+)/);

    if (rangeMatch) {
      let low = parseFloat(rangeMatch[1]);
      let high = parseFloat(rangeMatch[2]);

      // Handle percentage ranges (for revenue multiples)
      if (rule.includes('%')) {
        low = low / 100;
        high = high / 100;
      }

      return { low, high };
    }

    // Handle single value patterns like "2.2 times SDE"
    const singleMatch = rule.match(/([\d.]+)\s*times/i);
    if (singleMatch) {
      const value = parseFloat(singleMatch[1]);
      // Create a range around the single value (+/- 20%)
      return { low: value * 0.8, high: value * 1.2 };
    }

    return { low: null, high: null };
  }
}

// ============ FACTORY FUNCTION ============

/**
 * Create a new IndustryMultiplesLookup
 */
export function createMultiplesLookup(): IndustryMultiplesLookup {
  return new IndustryMultiplesLookup();
}
