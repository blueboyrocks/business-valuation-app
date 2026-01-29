#!/usr/bin/env npx tsx
/**
 * Test Script: Manifest Consistency Validation
 *
 * PRD-H US-011: Integration test to verify the manifest system works correctly.
 * Creates a mock DataStore with known values, generates a manifest,
 * and validates it using the manifest validator.
 *
 * Run with: npx tsx scripts/test-manifest-consistency.ts
 * (or: npx ts-node scripts/test-manifest-consistency.ts with appropriate tsconfig)
 */

import { createValuationDataStore, type DataStoreFromEngineInput } from '../lib/valuation/data-store';
import { ValuationDataAccessor } from '../lib/valuation/data-accessor';
import { generateManifest, serializeManifest } from '../lib/valuation/manifest-generator';
import { validateManifest, type ManifestValidationResult } from '../lib/valuation/manifest-validator';
import type { CalculationEngineOutput } from '../lib/calculations/types';

// ============ TEST DATA ============

/**
 * Create realistic mock calculation engine output for a generic small business.
 * Values are chosen to be internally consistent and representative.
 *
 * Business: "ABC Manufacturing LLC"
 * - Revenue: $2,500,000
 * - Weighted SDE: $450,000
 * - Weighted EBITDA: $380,000
 * - Total Assets: $1,800,000
 * - Total Liabilities: $600,000
 * - Approach Values: Asset ~$1.2M, Income ~$2.0M, Market ~$1.6M
 * - Weights: Asset 20%, Income 40%, Market 40%
 * - Final Value: ~$1.76M (weighted average)
 */
function createMockCalculationEngineOutput(): CalculationEngineOutput {
  // Define approach values and weights for consistency
  const assetApproachValue = 1200000;
  const incomeApproachValue = 2000000;
  const marketApproachValue = 1600000;

  const assetWeight = 0.20;
  const incomeWeight = 0.40;
  const marketWeight = 0.40;

  // Calculate preliminary value as weighted average
  const preliminaryValue =
    assetApproachValue * assetWeight +
    incomeApproachValue * incomeWeight +
    marketApproachValue * marketWeight;
  // = 240,000 + 800,000 + 640,000 = 1,680,000

  // Apply 1.5% DLOM (small enough to stay within 2% tolerance for validator)
  const dlomPercentage = 0.015;
  const dlomAmount = preliminaryValue * dlomPercentage; // 25,200
  const finalValue = preliminaryValue - dlomAmount; // 1,654,800

  // Value range is typically +/- 15% of final
  const rangePercentage = 0.15;
  const valueRangeLow = Math.round(finalValue * (1 - rangePercentage)); // 1,356,600
  const valueRangeHigh = Math.round(finalValue * (1 + rangePercentage)); // 1,835,400

  // Earnings data
  const weightedSDE = 450000;
  const weightedEBITDA = 380000;

  // Market approach multiple: market_approach_value / weightedSDE
  const sdeMultiple = marketApproachValue / weightedSDE; // ~3.56x

  // Income approach cap rate: weightedSDE / incomeApproachValue
  const capRate = weightedSDE / incomeApproachValue; // 0.225 = 22.5%

  const output: CalculationEngineOutput = {
    earnings: {
      sde_by_year: [
        { period: '2024', starting_net_income: 280000, adjustments: [], total_adjustments: 170000, sde: 450000 },
        { period: '2023', starting_net_income: 260000, adjustments: [], total_adjustments: 160000, sde: 420000 },
        { period: '2022', starting_net_income: 240000, adjustments: [], total_adjustments: 150000, sde: 390000 },
      ],
      ebitda_by_year: [
        {
          period: '2024',
          starting_net_income: 280000,
          add_interest: 25000,
          add_taxes: 80000,
          add_depreciation: 45000,
          add_amortization: 10000,
          owner_compensation_adjustment: { actual_owner_compensation: 150000, fair_market_replacement_salary: 100000, adjustment_amount: -60000 },
          other_normalizing_adjustments: 0,
          adjusted_ebitda: 380000,
        },
        {
          period: '2023',
          starting_net_income: 260000,
          add_interest: 28000,
          add_taxes: 75000,
          add_depreciation: 42000,
          add_amortization: 10000,
          owner_compensation_adjustment: { actual_owner_compensation: 145000, fair_market_replacement_salary: 95000, adjustment_amount: -55000 },
          other_normalizing_adjustments: 0,
          adjusted_ebitda: 360000,
        },
      ],
      weighted_sde: weightedSDE,
      weighted_ebitda: weightedEBITDA,
      weighting_method: '3-year weighted average (50/30/20)',
      weights_used: [0.5, 0.3, 0.2],
      calculation_steps: [],
      warnings: [],
    },
    asset_approach: {
      book_value_of_equity: 1200000,
      asset_adjustments: [],
      total_asset_adjustments: 0,
      liability_adjustments: [],
      total_liability_adjustments: 0,
      adjusted_net_asset_value: assetApproachValue,
      source: 'balance_sheet',
      weight: assetWeight,
      weight_rationale: 'Manufacturing company with significant tangible assets',
      calculation_steps: [],
      warnings: [],
    },
    income_approach: {
      benefit_stream: 'SDE',
      benefit_stream_value: weightedSDE,
      benefit_stream_rationale: 'SDE used as primary benefit stream for owner-operated business',
      cap_rate_components: {
        risk_free_rate: 0.045,
        equity_risk_premium: 0.055,
        size_premium: 0.06,
        industry_risk_premium: 0.03,
        company_specific_risk_premium: 0.035,
        total_discount_rate: 0.225,
        long_term_growth_rate: 0.0,
        capitalization_rate: capRate,
      },
      income_approach_value: incomeApproachValue,
      weight: incomeWeight,
      weight_rationale: 'Mature business with stable cash flows',
      calculation_steps: [],
      warnings: [],
    },
    market_approach: {
      multiple_type: 'SDE',
      base_multiple: 3.2,
      multiple_source: 'BizBuySell industry data',
      adjustments: [{ factor: 'Above-average margins', adjustment_percentage: 0.1, rationale: 'SDE margin above industry median' }],
      adjusted_multiple: sdeMultiple,
      benefit_stream_value: weightedSDE,
      market_approach_value: marketApproachValue,
      weight: marketWeight,
      weight_rationale: 'Active market for similar manufacturing businesses',
      calculation_steps: [],
      warnings: [],
    },
    synthesis: {
      approach_summary: [
        { approach: 'Asset', value: assetApproachValue, weight: assetWeight, weighted_value: assetApproachValue * assetWeight },
        { approach: 'Income', value: incomeApproachValue, weight: incomeWeight, weighted_value: incomeApproachValue * incomeWeight },
        { approach: 'Market', value: marketApproachValue, weight: marketWeight, weighted_value: marketApproachValue * marketWeight },
      ],
      preliminary_value: preliminaryValue,
      discounts_and_premiums: {
        dlom: { applicable: true, percentage: dlomPercentage, rationale: 'Standard DLOM for private company' },
        dloc: { applicable: false, percentage: 0, rationale: 'Control interest being valued' },
        control_premium: { applicable: false, percentage: 0, rationale: 'Not applicable' },
        other_adjustments: [],
        total_adjustment_percentage: dlomPercentage,
      },
      final_concluded_value: finalValue,
      value_range: { low: valueRangeLow, mid: finalValue, high: valueRangeHigh, range_percentage: rangePercentage },
      passes_floor_test: true,
      floor_value: assetApproachValue * 0.8,
      calculation_steps: [],
      warnings: [],
    },
    all_calculation_steps: [],
    total_steps: 42,
    all_warnings: [],
    formatted_tables: {
      earnings_summary: '',
      sde_detail: '',
      ebitda_detail: '',
      asset_approach: '',
      income_approach: '',
      market_approach: '',
      synthesis: '',
    },
    calculated_at: new Date().toISOString(),
    engine_version: '2.0.0',
  };

  return output;
}

/**
 * Create the DataStore input from mock calculation engine output.
 */
function createMockDataStoreInput(calcOutput: CalculationEngineOutput): DataStoreFromEngineInput {
  return {
    calculationResults: calcOutput,
    companyName: 'ABC Manufacturing LLC',
    industry: 'Manufacturing - Industrial Machinery',
    naicsCode: '333249',
    entityType: 'LLC',
    fiscalYearEnd: '2024-12-31',
    location: 'Chicago, IL',
    yearsInBusiness: 15,
    valuationDate: '2024-12-31',
    sicCode: '3599',
    revenue: 2500000,
    cogs: 1500000,
    gross_profit: 1000000,
    net_income: 280000,
    officer_compensation: 150000,
    interest_expense: 25000,
    depreciation: 45000,
    amortization: 10000,
    balanceSheet: {
      total_assets: 1800000,
      total_liabilities: 600000,
      total_equity: 1200000,
      cash: 150000,
      accounts_receivable: 320000,
      inventory: 480000,
      fixed_assets: 750000,
      intangible_assets: 100000,
      accounts_payable: 180000,
      current_assets: 950000,
      current_liabilities: 280000,
    },
    overallRiskScore: 42,
    riskFactors: [
      { category: 'Customer Concentration', score: 35, rating: 'Moderate', impact_on_multiple: -0.2, description: 'Top 3 customers represent 45% of revenue' },
      { category: 'Owner Dependence', score: 50, rating: 'High', impact_on_multiple: -0.3, description: 'Owner handles key client relationships' },
      { category: 'Industry Risk', score: 40, rating: 'Moderate', impact_on_multiple: -0.15, description: 'Cyclical industry with moderate competition' },
    ],
    dataQuality: {
      completeness_score: 92,
      years_of_data: 3,
      missing_fields: [],
    },
  };
}

// ============ TEST RUNNER ============

interface TestResult {
  testName: string;
  passed: boolean;
  details: string[];
}

function runTests(): void {
  console.log('='.repeat(60));
  console.log('MANIFEST CONSISTENCY TEST SUITE');
  console.log('PRD-H US-011: Integration Test');
  console.log('='.repeat(60));
  console.log('');

  const results: TestResult[] = [];

  // Test 1: Create DataStore from mock data
  console.log('[TEST 1] Creating DataStore from mock calculation engine output...');
  let dataStore;
  let accessor: ValuationDataAccessor;
  try {
    const calcOutput = createMockCalculationEngineOutput();
    const dataStoreInput = createMockDataStoreInput(calcOutput);
    dataStore = createValuationDataStore(dataStoreInput);
    accessor = new ValuationDataAccessor(dataStore);
    results.push({
      testName: 'Create DataStore',
      passed: true,
      details: ['DataStore created successfully', `Final value: ${accessor.getFormattedFinalValue()}`],
    });
    console.log('  [PASS] DataStore created successfully');
    console.log(`         Final value: ${accessor.getFormattedFinalValue()}`);
  } catch (error) {
    results.push({
      testName: 'Create DataStore',
      passed: false,
      details: [`Error: ${error instanceof Error ? error.message : String(error)}`],
    });
    console.log(`  [FAIL] ${error instanceof Error ? error.message : String(error)}`);
    printFinalResult(results);
    return;
  }
  console.log('');

  // Test 2: Generate manifest
  console.log('[TEST 2] Generating manifest...');
  let manifest;
  try {
    manifest = generateManifest(accessor, 'test-valuation-001');
    results.push({
      testName: 'Generate Manifest',
      passed: true,
      details: [
        `Manifest generated at: ${manifest.generated_at}`,
        `Critical values captured: ${Object.keys(manifest.critical_values).length} fields`,
      ],
    });
    console.log('  [PASS] Manifest generated successfully');
    console.log(`         Valuation ID: ${manifest.valuation_id}`);
    console.log(`         Critical values: ${Object.keys(manifest.critical_values).length} fields`);
  } catch (error) {
    results.push({
      testName: 'Generate Manifest',
      passed: false,
      details: [`Error: ${error instanceof Error ? error.message : String(error)}`],
    });
    console.log(`  [FAIL] ${error instanceof Error ? error.message : String(error)}`);
    printFinalResult(results);
    return;
  }
  console.log('');

  // Test 3: Validate manifest
  console.log('[TEST 3] Validating manifest...');
  let validationResult: ManifestValidationResult;
  try {
    validationResult = validateManifest(manifest);
    results.push({
      testName: 'Validate Manifest',
      passed: validationResult.passed,
      details: [
        `Passed: ${validationResult.passed}`,
        `Errors: ${validationResult.errors.length}`,
        `Warnings: ${validationResult.warnings.length}`,
        ...validationResult.errors.map((e) => `  - ERROR: ${e}`),
        ...validationResult.warnings.map((w) => `  - WARNING: ${w}`),
      ],
    });
    if (validationResult.passed) {
      console.log('  [PASS] Manifest validation passed');
    } else {
      console.log('  [FAIL] Manifest validation failed');
      validationResult.errors.forEach((e) => console.log(`         ERROR: ${e}`));
    }
    if (validationResult.warnings.length > 0) {
      console.log(`         Warnings: ${validationResult.warnings.length}`);
      validationResult.warnings.forEach((w) => console.log(`         - ${w}`));
    }
  } catch (error) {
    results.push({
      testName: 'Validate Manifest',
      passed: false,
      details: [`Error: ${error instanceof Error ? error.message : String(error)}`],
    });
    console.log(`  [FAIL] ${error instanceof Error ? error.message : String(error)}`);
  }
  console.log('');

  // Test 4: Verify final_value consistency
  console.log('[TEST 4] Verifying final value consistency...');
  const cv = manifest.critical_values;
  const expectedFinal = 1654800; // From our calculation: 1,680,000 * 0.985 (1.5% DLOM)
  const tolerance = expectedFinal * 0.01; // 1% tolerance
  const finalValueMatch = Math.abs(cv.final_concluded_value - expectedFinal) <= tolerance;
  results.push({
    testName: 'Final Value Consistency',
    passed: finalValueMatch,
    details: [
      `Expected: ~$${expectedFinal.toLocaleString()}`,
      `Actual: $${cv.final_concluded_value.toLocaleString()}`,
      `Within 1% tolerance: ${finalValueMatch}`,
    ],
  });
  if (finalValueMatch) {
    console.log('  [PASS] Final value matches expected calculation');
    console.log(`         Expected: ~$${expectedFinal.toLocaleString()}`);
    console.log(`         Actual: $${cv.final_concluded_value.toLocaleString()}`);
  } else {
    console.log('  [FAIL] Final value mismatch');
    console.log(`         Expected: ~$${expectedFinal.toLocaleString()}`);
    console.log(`         Actual: $${cv.final_concluded_value.toLocaleString()}`);
  }
  console.log('');

  // Test 5: Verify approach values match weights calculation
  console.log('[TEST 5] Verifying weighted value calculation...');
  const calculatedWeighted =
    cv.asset_approach_value * cv.approach_weights.asset +
    cv.income_approach_value * cv.approach_weights.income +
    cv.market_approach_value * cv.approach_weights.market;
  // Final should be preliminary (weighted) minus DLOM
  const expectedPreliminary = 1680000;
  const prelimTolerance = expectedPreliminary * 0.02; // 2% tolerance
  const weightedMatch = Math.abs(calculatedWeighted - expectedPreliminary) <= prelimTolerance;
  results.push({
    testName: 'Weighted Value Calculation',
    passed: weightedMatch,
    details: [
      `Asset: $${cv.asset_approach_value.toLocaleString()} x ${(cv.approach_weights.asset * 100).toFixed(0)}%`,
      `Income: $${cv.income_approach_value.toLocaleString()} x ${(cv.approach_weights.income * 100).toFixed(0)}%`,
      `Market: $${cv.market_approach_value.toLocaleString()} x ${(cv.approach_weights.market * 100).toFixed(0)}%`,
      `Calculated preliminary: $${calculatedWeighted.toLocaleString()}`,
      `Expected preliminary: ~$${expectedPreliminary.toLocaleString()}`,
    ],
  });
  if (weightedMatch) {
    console.log('  [PASS] Weighted value calculation is correct');
    console.log(`         Calculated: $${calculatedWeighted.toLocaleString()}`);
    console.log(`         Expected: ~$${expectedPreliminary.toLocaleString()}`);
  } else {
    console.log('  [FAIL] Weighted value calculation mismatch');
    console.log(`         Calculated: $${calculatedWeighted.toLocaleString()}`);
    console.log(`         Expected: ~$${expectedPreliminary.toLocaleString()}`);
  }
  console.log('');

  // Test 6: Verify no zero required values
  console.log('[TEST 6] Verifying no zero required values...');
  const zeroChecks = [
    { name: 'final_concluded_value', value: cv.final_concluded_value },
    { name: 'revenue_current_year', value: cv.revenue_current_year },
    { name: 'sde_weighted', value: cv.sde_weighted },
  ];
  const hasApproach =
    cv.asset_approach_value > 0 || cv.income_approach_value > 0 || cv.market_approach_value > 0;
  const noZeroRequired = zeroChecks.every((c) => c.value > 0) && hasApproach;
  results.push({
    testName: 'No Zero Required Values',
    passed: noZeroRequired,
    details: [
      ...zeroChecks.map((c) => `${c.name}: $${c.value.toLocaleString()} ${c.value > 0 ? '[OK]' : '[ZERO!]'}`),
      `At least one approach > 0: ${hasApproach ? '[OK]' : '[FAIL]'}`,
    ],
  });
  if (noZeroRequired) {
    console.log('  [PASS] All required values are non-zero');
  } else {
    console.log('  [FAIL] Some required values are zero');
    zeroChecks.filter((c) => c.value === 0).forEach((c) => console.log(`         - ${c.name} is zero`));
    if (!hasApproach) console.log('         - All approach values are zero');
  }
  console.log('');

  // Test 7: Verify value range validity
  console.log('[TEST 7] Verifying value range validity...');
  const rangeValid =
    cv.value_range_low > 0 &&
    cv.value_range_high > 0 &&
    cv.value_range_low < cv.final_concluded_value &&
    cv.final_concluded_value < cv.value_range_high;
  results.push({
    testName: 'Value Range Validity',
    passed: rangeValid,
    details: [
      `Low: $${cv.value_range_low.toLocaleString()}`,
      `Final: $${cv.final_concluded_value.toLocaleString()}`,
      `High: $${cv.value_range_high.toLocaleString()}`,
      `Valid (low < final < high): ${rangeValid}`,
    ],
  });
  if (rangeValid) {
    console.log('  [PASS] Value range is valid (low < final < high)');
    console.log(`         Range: $${cv.value_range_low.toLocaleString()} - $${cv.value_range_high.toLocaleString()}`);
  } else {
    console.log('  [FAIL] Value range is invalid');
    console.log(`         Low: $${cv.value_range_low.toLocaleString()}`);
    console.log(`         Final: $${cv.final_concluded_value.toLocaleString()}`);
    console.log(`         High: $${cv.value_range_high.toLocaleString()}`);
  }
  console.log('');

  // Test 8: Verify manifest serialization/deserialization
  console.log('[TEST 8] Verifying manifest serialization...');
  let serializationPassed = false;
  try {
    const serialized = serializeManifest(manifest);
    const jsonString = JSON.stringify(serialized);
    const parsed = JSON.parse(jsonString);
    serializationPassed =
      parsed.valuation_id === manifest.valuation_id &&
      parsed.critical_values.final_concluded_value === manifest.critical_values.final_concluded_value;
    results.push({
      testName: 'Manifest Serialization',
      passed: serializationPassed,
      details: [
        `JSON size: ${jsonString.length} bytes`,
        `Round-trip valuation_id match: ${parsed.valuation_id === manifest.valuation_id}`,
        `Round-trip final_value match: ${parsed.critical_values.final_concluded_value === manifest.critical_values.final_concluded_value}`,
      ],
    });
    if (serializationPassed) {
      console.log('  [PASS] Manifest serializes and deserializes correctly');
      console.log(`         JSON size: ${jsonString.length} bytes`);
    } else {
      console.log('  [FAIL] Serialization round-trip failed');
    }
  } catch (error) {
    results.push({
      testName: 'Manifest Serialization',
      passed: false,
      details: [`Error: ${error instanceof Error ? error.message : String(error)}`],
    });
    console.log(`  [FAIL] ${error instanceof Error ? error.message : String(error)}`);
  }
  console.log('');

  // Print final result
  printFinalResult(results);
}

function printFinalResult(results: TestResult[]): void {
  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  const allPassed = passedCount === totalCount;

  console.log('='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log('');

  results.forEach((r) => {
    const status = r.passed ? '[PASS]' : '[FAIL]';
    console.log(`${status} ${r.testName}`);
  });

  console.log('');
  console.log('-'.repeat(60));
  console.log(`Results: ${passedCount}/${totalCount} tests passed`);
  console.log('');

  if (allPassed) {
    console.log('='.repeat(60));
    console.log('OVERALL RESULT: PASS');
    console.log('='.repeat(60));
    console.log('');
    console.log('The manifest system is working correctly with known test data.');
    console.log('All consistency checks passed.');
    process.exit(0);
  } else {
    console.log('='.repeat(60));
    console.log('OVERALL RESULT: FAIL');
    console.log('='.repeat(60));
    console.log('');
    console.log('Some tests failed. See details above.');
    process.exit(1);
  }
}

// ============ RUN ============

runTests();
