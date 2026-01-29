/**
 * Manifest Generator - JSON Manifest for Valuation Reports
 *
 * PRD-H US-002: Creates a JSON manifest with all critical values
 * for automated consistency testing. The manifest is stored in
 * Supabase alongside the PDF to enable querying without regeneration.
 */

import type { ValuationDataAccessor } from './data-accessor';

// ============ INTERFACES ============

/**
 * A single appearance of a value in the report.
 */
export interface ValueAppearance {
  section: string;
  value: number;
}

/**
 * Approach weights used in value reconciliation.
 */
export interface ApproachWeights {
  asset: number;
  income: number;
  market: number;
}

/**
 * All critical numeric values from the valuation.
 */
export interface CriticalValues {
  revenue_current_year: number;
  sde_normalized: number;
  sde_weighted: number;
  final_concluded_value: number;
  value_range_low: number;
  value_range_high: number;
  asset_approach_value: number;
  income_approach_value: number;
  market_approach_value: number;
  sde_multiple_used: number;
  cap_rate: number;
  dlom_percentage: number;
  approach_weights: ApproachWeights;
}

/**
 * Result of consistency checking within the manifest.
 */
export interface ConsistencyCheck {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * The complete report manifest.
 */
export interface ReportManifest {
  generated_at: string;
  valuation_id: string;
  critical_values: CriticalValues;
  value_appearances: Map<string, ValueAppearance[]> | Record<string, ValueAppearance[]>;
  consistency_check: ConsistencyCheck;
}

/**
 * Serializable version of the manifest for JSON storage.
 */
export interface SerializableReportManifest {
  generated_at: string;
  valuation_id: string;
  critical_values: CriticalValues;
  value_appearances: Record<string, ValueAppearance[]>;
  consistency_check: ConsistencyCheck;
}

// ============ MANIFEST GENERATOR ============

/**
 * Generate a report manifest from the ValuationDataAccessor.
 *
 * @param accessor - The ValuationDataAccessor providing authoritative values
 * @param valuationId - The unique identifier for this valuation/report
 * @returns ReportManifest with all critical values and basic consistency checks
 */
export function generateManifest(
  accessor: ValuationDataAccessor,
  valuationId: string
): ReportManifest {
  console.log(`[MANIFEST] Generating manifest for valuation ${valuationId}`);

  // Extract all critical values from the accessor
  const critical_values: CriticalValues = {
    revenue_current_year: accessor.getRevenue(),
    sde_normalized: accessor.getSDE('normalized'),
    sde_weighted: accessor.getWeightedSDE(),
    final_concluded_value: accessor.getFinalValue(),
    value_range_low: accessor.getValueRangeLow(),
    value_range_high: accessor.getValueRangeHigh(),
    asset_approach_value: accessor.getApproachValue('asset'),
    income_approach_value: accessor.getApproachValue('income'),
    market_approach_value: accessor.getApproachValue('market'),
    sde_multiple_used: accessor.getSDEMultiple(),
    cap_rate: accessor.getCapRate(),
    dlom_percentage: accessor.getDLOMRate(),
    approach_weights: {
      asset: accessor.getApproachWeight('asset'),
      income: accessor.getApproachWeight('income'),
      market: accessor.getApproachWeight('market'),
    },
  };

  console.log(`[MANIFEST] critical_values.final_concluded_value=${critical_values.final_concluded_value}`);
  console.log(`[MANIFEST] critical_values.revenue_current_year=${critical_values.revenue_current_year}`);
  console.log(`[MANIFEST] critical_values.sde_weighted=${critical_values.sde_weighted}`);

  // Track where values appear (initially just from accessor)
  // This can be extended to track appearances in narrative sections
  const value_appearances: Record<string, ValueAppearance[]> = {
    final_value: [{ section: 'data_accessor', value: critical_values.final_concluded_value }],
    revenue: [{ section: 'data_accessor', value: critical_values.revenue_current_year }],
    sde_weighted: [{ section: 'data_accessor', value: critical_values.sde_weighted }],
    asset_approach: [{ section: 'data_accessor', value: critical_values.asset_approach_value }],
    income_approach: [{ section: 'data_accessor', value: critical_values.income_approach_value }],
    market_approach: [{ section: 'data_accessor', value: critical_values.market_approach_value }],
    value_range_low: [{ section: 'data_accessor', value: critical_values.value_range_low }],
    value_range_high: [{ section: 'data_accessor', value: critical_values.value_range_high }],
  };

  // Run basic consistency checks
  const consistency_check = runBasicConsistencyChecks(critical_values);

  const manifest: ReportManifest = {
    generated_at: new Date().toISOString(),
    valuation_id: valuationId,
    critical_values,
    value_appearances,
    consistency_check,
  };

  console.log(`[MANIFEST] GENERATION_COMPLETE passed=${consistency_check.passed} errors=${consistency_check.errors.length} warnings=${consistency_check.warnings.length}`);

  return manifest;
}

/**
 * Run basic consistency checks on critical values.
 * More comprehensive validation is done by manifest-validator.ts (US-003).
 */
function runBasicConsistencyChecks(values: CriticalValues): ConsistencyCheck {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check: Approach weights sum to 1.0 (within tolerance)
  const weightSum = values.approach_weights.asset + values.approach_weights.income + values.approach_weights.market;
  if (Math.abs(weightSum - 1.0) > 0.001) {
    errors.push(`Approach weights sum to ${weightSum.toFixed(4)}, expected 1.0`);
  }

  // Check: Value range valid (low < final < high)
  if (values.value_range_low > 0 && values.value_range_high > 0) {
    if (values.value_range_low > values.final_concluded_value) {
      errors.push(`Value range low (${values.value_range_low}) is greater than final value (${values.final_concluded_value})`);
    }
    if (values.final_concluded_value > values.value_range_high) {
      errors.push(`Final value (${values.final_concluded_value}) is greater than value range high (${values.value_range_high})`);
    }
    if (values.value_range_low >= values.value_range_high) {
      errors.push(`Value range low (${values.value_range_low}) must be less than high (${values.value_range_high})`);
    }
  }

  // Check: No zero values for required fields
  if (values.final_concluded_value === 0) {
    errors.push('Final concluded value is zero');
  }
  if (values.revenue_current_year === 0) {
    warnings.push('Revenue is zero');
  }

  // Check: At least one approach has a value > 0
  const hasApproachValue =
    values.asset_approach_value > 0 ||
    values.income_approach_value > 0 ||
    values.market_approach_value > 0;
  if (!hasApproachValue) {
    errors.push('All approach values are zero');
  }

  // Warnings for unusual but not necessarily wrong values
  if (values.sde_multiple_used > 10) {
    warnings.push(`SDE multiple (${values.sde_multiple_used.toFixed(2)}x) is unusually high`);
  }
  if (values.cap_rate > 0.5) {
    warnings.push(`Cap rate (${(values.cap_rate * 100).toFixed(1)}%) is unusually high`);
  }
  if (values.dlom_percentage > 0.35) {
    warnings.push(`DLOM (${(values.dlom_percentage * 100).toFixed(1)}%) is unusually high`);
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Convert a ReportManifest to a serializable format for JSON storage.
 */
export function serializeManifest(manifest: ReportManifest): SerializableReportManifest {
  // Convert Map to plain object if necessary
  const value_appearances: Record<string, ValueAppearance[]> =
    manifest.value_appearances instanceof Map
      ? Object.fromEntries(manifest.value_appearances)
      : manifest.value_appearances;

  return {
    generated_at: manifest.generated_at,
    valuation_id: manifest.valuation_id,
    critical_values: manifest.critical_values,
    value_appearances,
    consistency_check: manifest.consistency_check,
  };
}

/**
 * Parse a serialized manifest from JSON storage.
 */
export function parseManifest(json: SerializableReportManifest): ReportManifest {
  return {
    generated_at: json.generated_at,
    valuation_id: json.valuation_id,
    critical_values: json.critical_values,
    value_appearances: json.value_appearances,
    consistency_check: json.consistency_check,
  };
}
