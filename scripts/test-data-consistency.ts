#!/usr/bin/env npx ts-node
/**
 * End-to-End Integration Test: Data Consistency Validation
 *
 * This script validates the entire data pipeline:
 * 1. Creates DataStore from mock calculation results
 * 2. Creates DataAccessor from the store
 * 3. Generates section content strings from mock data
 * 4. Runs full quality gate
 * 5. Verifies data consistency across all sections
 *
 * Run: npx ts-node scripts/test-data-consistency.ts
 */

import { createDataStoreFromResults } from '../lib/valuation/data-store-factory';
import { runQualityGate } from '../lib/validation/quality-gate';
import type { CalculationEngineOutput } from '../lib/calculations/types';

// ============ MOCK DATA ============

/**
 * Mock calculation engine output for a generic small business
 * (not K-Force specific - generic consulting business)
 * Matches the CalculationEngineOutput interface exactly
 */
const mockCalculationResults: CalculationEngineOutput = {
  engine_version: 'deterministic-v1',
  calculated_at: new Date().toISOString(),
  total_steps: 12,
  all_warnings: [],
  all_calculation_steps: [],

  formatted_tables: {
    earnings_summary: 'Mock earnings summary table',
    sde_detail: 'Mock SDE detail table',
    ebitda_detail: 'Mock EBITDA detail table',
    asset_approach: 'Mock asset approach table',
    income_approach: 'Mock income approach table',
    market_approach: 'Mock market approach table',
    synthesis: 'Mock synthesis table',
  },

  earnings: {
    weighted_sde: 185000,
    weighted_ebitda: 155000,
    weighting_method: '3-year weighted average',
    weights_used: [0.5, 0.33, 0.17],
    sde_by_year: [
      {
        period: '2023',
        starting_net_income: 125000,
        adjustments: [
          { category: 'owner_compensation', description: 'Officer salary', amount: 85000 },
          { category: 'depreciation', description: 'Depreciation add-back', amount: 15000 },
        ],
        total_adjustments: 65000,
        sde: 190000,
      },
      {
        period: '2022',
        starting_net_income: 118000,
        adjustments: [
          { category: 'owner_compensation', description: 'Officer salary', amount: 82000 },
          { category: 'depreciation', description: 'Depreciation add-back', amount: 12000 },
        ],
        total_adjustments: 62000,
        sde: 180000,
      },
    ],
    ebitda_by_year: [
      {
        period: '2023',
        starting_net_income: 125000,
        add_interest: 5000,
        add_taxes: 25000,
        add_depreciation: 15000,
        add_amortization: 0,
        owner_compensation_adjustment: {
          actual_owner_compensation: 85000,
          fair_market_replacement_salary: 75000,
          adjustment_amount: 10000,
        },
        other_normalizing_adjustments: 0,
        adjusted_ebitda: 155000,
      },
    ],
    calculation_steps: [],
    warnings: [],
  },

  asset_approach: {
    book_value_of_equity: 225000,
    asset_adjustments: [
      {
        item_name: 'Equipment FMV adjustment',
        book_value: 50000,
        fair_market_value: 65000,
        adjustment: 15000,
        rationale: 'Equipment appraised at FMV',
      },
      {
        item_name: 'AR collectibility',
        book_value: 72000,
        fair_market_value: 67000,
        adjustment: -5000,
        rationale: 'Allowance for doubtful accounts',
      },
    ],
    total_asset_adjustments: 10000,
    liability_adjustments: [],
    total_liability_adjustments: 0,
    adjusted_net_asset_value: 235000,
    source: 'balance_sheet',
    weight: 0.20,
    weight_rationale: 'Service business with moderate asset base',
    calculation_steps: [],
    warnings: [],
  },

  income_approach: {
    benefit_stream: 'SDE',
    benefit_stream_value: 155000,
    benefit_stream_rationale: 'Using weighted EBITDA for income approach',
    cap_rate_components: {
      risk_free_rate: 0.045,
      equity_risk_premium: 0.06,
      size_premium: 0.08,
      industry_risk_premium: 0.02,
      company_specific_risk_premium: 0.03,
      total_discount_rate: 0.235,
      long_term_growth_rate: 0.0,
      capitalization_rate: 0.235,
    },
    income_approach_value: 660000,
    weight: 0.40,
    weight_rationale: 'Primary approach for service business',
    calculation_steps: [],
    warnings: [],
  },

  market_approach: {
    multiple_type: 'SDE',
    base_multiple: 3.1,
    multiple_source: 'BizBuySell median for NAICS 541611',
    adjustments: [
      {
        factor: 'Size adjustment',
        adjustment_percentage: -0.05,
        rationale: 'Below-median revenue for category',
      },
      {
        factor: 'Geography',
        adjustment_percentage: 0.02,
        rationale: 'Strong regional market',
      },
    ],
    adjusted_multiple: 3.0,
    benefit_stream_value: 185000,
    market_approach_value: 555000,
    weight: 0.40,
    weight_rationale: 'Reliable transaction data available',
    calculation_steps: [],
    warnings: [],
  },

  synthesis: {
    approach_summary: [
      { approach: 'Asset', value: 235000, weight: 0.20, weighted_value: 47000 },
      { approach: 'Income', value: 660000, weight: 0.40, weighted_value: 264000 },
      { approach: 'Market', value: 555000, weight: 0.40, weighted_value: 222000 },
    ],
    preliminary_value: 533000,
    discounts_and_premiums: {
      dlom: { applicable: true, percentage: 0.15, rationale: 'Standard DLOM for closely-held business' },
      dloc: { applicable: false, percentage: 0, rationale: 'Not applicable' },
      control_premium: { applicable: false, percentage: 0, rationale: 'Not applicable' },
      other_adjustments: [],
      total_adjustment_percentage: 0.15,
    },
    final_concluded_value: 453050,
    value_range: {
      low: 385093,
      mid: 453050,
      high: 521008,
      range_percentage: 0.15,
    },
    passes_floor_test: true,
    floor_value: 235000,
    calculation_steps: [],
    warnings: [],
  },
};

/**
 * Mock report metadata for a generic business
 */
const mockReportMeta = {
  company_name: 'Acme Consulting LLC',
  industry_name: 'Management Consulting Services',
  naics_code: '541611',
  entity_type: 'LLC',
  annual_revenue: 650000,
  pretax_income: 125000,
  owner_compensation: 85000,
  total_assets: 320000,
  total_liabilities: 95000,
  cash: 45000,
  accounts_receivable: 72000,
  inventory: 0,
};

/**
 * Generate mock section contents that reference the calculated values
 */
function generateMockSectionContents(
  accessor: ReturnType<typeof createDataStoreFromResults>['accessor']
): Map<string, string> {
  const sections = new Map<string, string>();

  // Executive Summary
  sections.set(
    'executive_summary',
    `
    Executive Summary

    This valuation report presents the Fair Market Value determination for ${accessor.getCompanyName()},
    a ${accessor.getIndustryName()} business operating in NAICS code ${accessor.getNaicsCode()}.
    The engagement was undertaken to provide an independent, objective opinion of value for
    potential transaction, estate planning, and strategic decision-making purposes.

    Based on our comprehensive analysis using three recognized valuation approaches, we conclude
    that the Fair Market Value of the business is ${accessor.getFinalValueFormatted()}, with a
    reasonable range of value between ${accessor.getFormattedValueRange().display}.

    The valuation represents a ${accessor.getFormattedSDEMultiple()} multiple of Seller's
    Discretionary Earnings, which is within the expected range for businesses of this type
    and quality. A 15% Discount for Lack of Marketability (DLOM) has been applied to reflect
    the illiquidity inherent in closely-held business interests.

    Key Financial Highlights:
    - Annual Revenue: ${accessor.getFormattedRevenue()}
    - Weighted Seller's Discretionary Earnings: ${accessor.getFormattedSDE('normalized')}
    - Book Value of Equity: ${accessor.getFormattedBookValue()}
    - Overall Risk Score: ${accessor.getRiskScore()}/100 (${accessor.getRiskRating()})

    The valuation methodology employed all three traditional approaches to business valuation:

    1. Asset Approach: ${accessor.getFormattedApproachValue('asset')} (Weight: ${accessor.getFormattedApproachWeight('asset')})
       This approach values the business based on the fair market value of its underlying assets
       less liabilities. It establishes a floor value and is particularly relevant for asset-intensive
       businesses or liquidation scenarios.

    2. Income Approach: ${accessor.getFormattedApproachValue('income')} (Weight: ${accessor.getFormattedApproachWeight('income')})
       This approach capitalizes the normalized earnings stream using a capitalization rate
       derived from the build-up method. It reflects the present value of future economic benefits.

    3. Market Approach: ${accessor.getFormattedApproachValue('market')} (Weight: ${accessor.getFormattedApproachWeight('market')})
       This approach applies market-derived multiples from comparable business transactions
       to the subject company's earnings. It provides market-based evidence of value.

    The company demonstrates solid financial performance with consistent revenue generation and
    healthy profit margins. The business benefits from an established client base, experienced
    management, and favorable industry dynamics. Areas of potential risk include customer
    concentration and key person dependency, which are reflected in the risk assessment and
    resulting capitalization rate.

    This valuation has been prepared in accordance with the Uniform Standards of Professional
    Appraisal Practice (USPAP) and generally accepted valuation principles. All conclusions
    expressed herein are subject to the assumptions and limiting conditions set forth in this report.
    `.trim()
  );

  // Financial Analysis
  sections.set(
    'financial_analysis',
    `
    Financial Analysis

    ${accessor.getCompanyName()} demonstrates solid financial performance with annual revenue of
    ${accessor.getFormattedRevenue()} and normalized SDE of ${accessor.getFormattedSDE('normalized')}.

    Balance Sheet Summary:
    - Total Assets: ${accessor.getFormattedTotalAssets()}
    - Total Liabilities: ${accessor.getFormattedTotalLiabilities()}
    - Book Value: ${accessor.getFormattedBookValue()}
    - Working Capital: ${accessor.getFormattedWorkingCapital()}

    The company maintains healthy liquidity with adequate working capital to support operations.
    `.trim()
  );

  // Asset Approach
  sections.set(
    'asset_approach_analysis',
    `
    Asset-Based Approach Analysis

    The Asset Approach values the business at ${accessor.getFormattedApproachValue('asset')},
    weighted at ${accessor.getFormattedApproachWeight('asset')} of the final value.

    Starting from book value of ${accessor.getFormattedBookValue()}, we made the following adjustments
    to arrive at the Fair Market Value of tangible assets.

    This approach is particularly relevant for businesses with significant tangible asset bases.
    `.trim()
  );

  // Income Approach
  sections.set(
    'income_approach_analysis',
    `
    Income Approach Analysis

    The Income Approach capitalizes the weighted earnings stream using a capitalization rate
    of 23.5% to derive a value of ${accessor.getFormattedApproachValue('income')}.

    This approach receives ${accessor.getFormattedApproachWeight('income')} weighting in the final synthesis.

    The capitalization rate reflects:
    - Risk-free rate: 4.5%
    - Equity risk premium: 6.0%
    - Size premium: 8.0%
    - Industry-specific risk: 2.0%
    - Company-specific risk: 3.0%
    `.trim()
  );

  // Market Approach
  sections.set(
    'market_approach_analysis',
    `
    Market Approach Analysis

    Based on comparable transactions in the ${accessor.getIndustryName()} industry,
    we applied an SDE multiple of ${accessor.getFormattedSDEMultiple()} to derive a value
    of ${accessor.getFormattedApproachValue('market')}.

    This approach receives ${accessor.getFormattedApproachWeight('market')} weighting.

    Comparable transactions indicated multiples ranging from 2.5x to 3.5x SDE,
    with our selected multiple reflecting the subject company's risk profile and market position.
    `.trim()
  );

  // Risk Assessment
  sections.set(
    'risk_assessment',
    `
    Risk Assessment

    The overall risk profile for ${accessor.getCompanyName()} is assessed as ${accessor.getRiskRating()}
    with a score of ${accessor.getRiskScore()}/100.

    Key risk factors considered include:
    - Owner dependency
    - Customer concentration
    - Industry competition
    - Economic sensitivity

    These factors are reflected in the company-specific risk premium applied in the Income Approach.
    `.trim()
  );

  // Company Profile
  sections.set(
    'company_profile',
    `
    Company Profile

    ${accessor.getCompanyName()} is a ${accessor.getIndustryName()} firm operating under
    NAICS code ${accessor.getNaicsCode()}.

    The company provides professional consulting services to small and mid-sized businesses,
    with a focus on operational improvement and strategic planning.

    Entity Type: ${mockReportMeta.entity_type}
    `.trim()
  );

  // Industry Analysis
  sections.set(
    'industry_analysis',
    `
    Industry Analysis

    The ${accessor.getIndustryName()} industry (NAICS ${accessor.getNaicsCode()}) continues
    to show stable growth characteristics.

    Industry multiples for similar businesses typically range from 2.5x to 3.5x SDE,
    with variations based on size, geography, and specialization.

    The subject company's multiple of ${accessor.getFormattedSDEMultiple()} falls within
    the expected range for businesses of this type.
    `.trim()
  );

  // Valuation Reconciliation
  sections.set(
    'valuation_reconciliation',
    `
    Valuation Synthesis and Conclusion

    We have employed three recognized valuation approaches to determine the Fair Market Value:

    - Asset Approach: ${accessor.getFormattedApproachValue('asset')} (Weight: ${accessor.getFormattedApproachWeight('asset')})
    - Income Approach: ${accessor.getFormattedApproachValue('income')} (Weight: ${accessor.getFormattedApproachWeight('income')})
    - Market Approach: ${accessor.getFormattedApproachValue('market')} (Weight: ${accessor.getFormattedApproachWeight('market')})

    After applying a 15% Discount for Lack of Marketability (DLOM), we conclude the
    Fair Market Value of ${accessor.getCompanyName()} to be ${accessor.getFinalValueFormatted()}.

    Value Range: ${accessor.getFormattedValueRange().display}

    The reconciliation of these approaches considers the nature of the business, availability of
    data, and reliability of each method. The Income and Market approaches receive equal weighting
    as primary indicators of value for this service-based business with strong earnings history.
    The Asset Approach receives lower weighting as the business value derives primarily from
    earnings capacity rather than tangible assets.
    `.trim()
  );

  // Conclusion of Value (required section)
  sections.set(
    'conclusion_of_value',
    `
    Conclusion of Value

    Based upon the analysis and procedures performed, we have concluded that the Fair Market Value
    of ${accessor.getCompanyName()} as of the valuation date is ${accessor.getFinalValueFormatted()}.

    This conclusion represents a point estimate within a reasonable range of value. The value range
    of ${accessor.getFormattedValueRange().display} reflects uncertainty inherent in any business valuation.

    The concluded value reflects the application of the Asset, Income, and Market approaches to value,
    each weighted according to their relevance and reliability for this specific business type.
    A 15% Discount for Lack of Marketability (DLOM) has been applied to reflect the illiquidity
    of a closely-held business interest.

    This valuation has been prepared in accordance with the Uniform Standards of Professional
    Appraisal Practice (USPAP) and the standards promulgated by the American Society of Appraisers.
    The Fair Market Value standard represents the price at which property would change hands between
    a willing buyer and a willing seller, neither being under compulsion to buy or sell, and both
    having reasonable knowledge of relevant facts.
    `.trim()
  );

  // Assumptions and Limiting Conditions (required section)
  sections.set(
    'assumptions_limiting_conditions',
    `
    Assumptions and Limiting Conditions

    This valuation is subject to the following assumptions and limiting conditions:

    1. The financial information provided by management has been accepted without independent
       verification. We have relied upon the accuracy and completeness of all data provided.

    2. This valuation assumes the business will continue as a going concern and that there are
       no undisclosed liabilities or material facts that would affect the concluded value.

    3. Public information and industry data have been obtained from sources deemed reliable,
       but cannot be independently verified for accuracy and completeness.

    4. The valuation does not include any value for personal goodwill associated with the
       current owners unless specifically noted otherwise.

    5. This report is valid only for the stated purpose and as of the valuation date.
       Changes in market conditions or the subject company may render this analysis obsolete.

    6. No investigation has been made of any legal matters affecting the subject company,
       including pending litigation, environmental issues, or regulatory compliance.

    7. The valuation assumes all necessary licenses, permits, and authorizations are in place
       and will remain in effect for the foreseeable future.

    8. Working capital is assumed to be at normal operating levels at the time of transaction.
       Any excess or deficient working capital would require adjustment to the concluded value.
    `.trim()
  );

  // Sources and References (required section)
  sections.set(
    'sources_references',
    `
    Sources and References

    This valuation report was prepared using the following primary sources of information:

    Financial Data Sources:
    - Company income statements for fiscal years 2021-2023
    - Company balance sheets as of year-end 2023
    - Internally prepared financial projections
    - Federal and state tax returns for 2021-2023

    Industry and Market Data Sources:
    - BizBuySell transaction database for comparable sales
    - IBISWorld industry reports for NAICS ${accessor.getNaicsCode()}
    - Risk Management Association (RMA) Annual Statement Studies
    - Duff & Phelps Cost of Capital Navigator

    Valuation Guidance:
    - IRS Revenue Ruling 59-60
    - AICPA Statement on Standards for Valuation Services (SSVS No. 1)
    - Uniform Standards of Professional Appraisal Practice (USPAP)
    - American Society of Appraisers Business Valuation Standards

    Academic and Professional References:
    - Shannon Pratt, "Valuing a Business" (6th Edition)
    - Aswath Damodaran, "Damodaran on Valuation" (2nd Edition)
    - NYU Stern School of Business, Cost of Capital data
    `.trim()
  );

  // Strategic Insights (optional but good for completeness)
  sections.set(
    'strategic_insights',
    `
    Strategic Insights and Value Enhancement Recommendations

    Based on our analysis, we have identified several opportunities that could enhance the value
    of ${accessor.getCompanyName()}:

    1. Revenue Diversification: The company could benefit from expanding its service offerings
       or targeting new market segments to reduce customer concentration risk.

    2. Documentation and Systems: Implementing more robust operational procedures and documentation
       would reduce key person dependency and increase transferability value.

    3. Recurring Revenue: Transitioning to retainer-based or subscription service models would
       create more predictable revenue streams and potentially increase valuation multiples.

    4. Brand Development: Investing in brand recognition and market positioning could support
       premium pricing and customer loyalty.

    5. Operational Efficiency: Continuing to improve gross margins through process optimization
       and selective automation would directly enhance earnings and enterprise value.

    These recommendations are provided for informational purposes and do not constitute
    investment advice or a guarantee of future value enhancement.
    `.trim()
  );

  return sections;
}

// ============ TEST RUNNER ============

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

function runTests(): { passed: boolean; results: TestResult[] } {
  const results: TestResult[] = [];
  let allPassed = true;

  console.log('\n========================================');
  console.log('E2E Data Consistency Integration Test');
  console.log('========================================\n');

  // Step 1: Create DataStore and Accessor
  console.log('Step 1: Creating DataStore from mock calculation results...');
  let accessor: ReturnType<typeof createDataStoreFromResults>['accessor'];
  try {
    const result = createDataStoreFromResults(mockCalculationResults, mockReportMeta);
    accessor = result.accessor;
    results.push({
      name: 'DataStore creation',
      passed: true,
      details: `Created successfully. Final value: ${accessor.getFinalValueFormatted()}`,
    });
    console.log(`  [PASS] DataStore created. Final value: ${accessor.getFinalValueFormatted()}\n`);
  } catch (error) {
    results.push({
      name: 'DataStore creation',
      passed: false,
      details: `Failed: ${error instanceof Error ? error.message : String(error)}`,
    });
    console.log(`  [FAIL] Failed to create DataStore\n`);
    allPassed = false;
    return { passed: false, results };
  }

  // Step 2: Generate section contents
  console.log('Step 2: Generating section contents from DataAccessor...');
  const sectionContents = generateMockSectionContents(accessor);
  results.push({
    name: 'Section content generation',
    passed: true,
    details: `Generated ${sectionContents.size} sections`,
  });
  console.log(`  [PASS] Generated ${sectionContents.size} sections\n`);

  // Step 3: Check for forbidden patterns
  console.log('Step 3: Checking for forbidden patterns ([object Object], undefined, NaN)...');
  const forbiddenPatterns = ['[object Object]', 'undefined', 'NaN'];
  let foundForbidden = false;
  const sectionKeys = Array.from(sectionContents.keys());
  for (const section of sectionKeys) {
    const content = sectionContents.get(section) || '';
    for (const pattern of forbiddenPatterns) {
      if (content.includes(pattern)) {
        foundForbidden = true;
        results.push({
          name: `No "${pattern}" in ${section}`,
          passed: false,
          details: `Found "${pattern}" in section "${section}"`,
        });
        console.log(`  [FAIL] Found "${pattern}" in section "${section}"`);
      }
    }
  }
  if (!foundForbidden) {
    results.push({
      name: 'No forbidden patterns',
      passed: true,
      details: 'No [object Object], undefined, or NaN found in any section',
    });
    console.log(`  [PASS] No forbidden patterns found\n`);
  } else {
    allPassed = false;
    console.log('');
  }

  // Step 4: Run quality gate
  console.log('Step 4: Running quality gate...');
  const rawDataString = JSON.stringify({ ...mockReportMeta, ...mockCalculationResults });
  const qualityResult = runQualityGate(accessor, sectionContents, rawDataString);

  results.push({
    name: 'Quality gate',
    passed: qualityResult.canProceed,
    details: `Score: ${qualityResult.score}/100, Can proceed: ${qualityResult.canProceed}`,
  });

  if (qualityResult.canProceed) {
    console.log(`  [PASS] Quality gate passed (Score: ${qualityResult.score}/100)`);
  } else {
    console.log(`  [FAIL] Quality gate BLOCKED (Score: ${qualityResult.score}/100)`);
    console.log(`    Blocking errors: ${qualityResult.blockingErrors.join(', ')}`);
    allPassed = false;
  }
  if (qualityResult.warnings.length > 0) {
    console.log(`    Warnings: ${qualityResult.warnings.join(', ')}`);
  }
  console.log('');

  // Step 5: Verify final value consistency
  console.log('Step 5: Verifying final value consistency across sections...');
  const finalValueFormatted = accessor.getFinalValueFormatted();
  let valueConsistent = true;
  const sectionsWithValue = ['executive_summary', 'valuation_reconciliation'];
  for (const sectionName of sectionsWithValue) {
    const content = sectionContents.get(sectionName) || '';
    if (!content.includes(finalValueFormatted)) {
      valueConsistent = false;
      results.push({
        name: `Final value in ${sectionName}`,
        passed: false,
        details: `Expected "${finalValueFormatted}" not found in ${sectionName}`,
      });
      console.log(`  [FAIL] Final value not found in ${sectionName}`);
    }
  }
  if (valueConsistent) {
    results.push({
      name: 'Final value consistency',
      passed: true,
      details: `${finalValueFormatted} found consistently across sections`,
    });
    console.log(`  [PASS] Final value ${finalValueFormatted} consistent across sections\n`);
  } else {
    allPassed = false;
    console.log('');
  }

  // Step 6: Verify SDE multiple in valid range
  console.log('Step 6: Verifying SDE multiple is in valid range...');
  const sdeMultiple = mockCalculationResults.market_approach.adjusted_multiple;
  // Use typical industry range for consulting
  const multipleRangeLow = 2.0;
  const multipleRangeHigh = 4.0;
  const multipleInRange = sdeMultiple >= multipleRangeLow && sdeMultiple <= multipleRangeHigh;
  results.push({
    name: 'SDE multiple in range',
    passed: multipleInRange,
    details: `Multiple ${sdeMultiple}x is ${multipleInRange ? 'within' : 'outside'} range ${multipleRangeLow}x - ${multipleRangeHigh}x`,
  });
  if (multipleInRange) {
    console.log(`  [PASS] SDE multiple ${sdeMultiple}x within range ${multipleRangeLow}x - ${multipleRangeHigh}x\n`);
  } else {
    console.log(`  [FAIL] SDE multiple ${sdeMultiple}x outside range\n`);
    allPassed = false;
  }

  // Step 7: Verify asset approach > 0 when assets > 0
  console.log('Step 7: Verifying asset approach value logic...');
  const assetValue = mockCalculationResults.asset_approach.adjusted_net_asset_value;
  const bookValue = mockCalculationResults.asset_approach.book_value_of_equity;
  const assetLogicValid = bookValue > 0 ? assetValue > 0 : true;
  results.push({
    name: 'Asset approach logic',
    passed: assetLogicValid,
    details: `Book value: $${bookValue.toLocaleString()}, Asset approach value: $${assetValue.toLocaleString()}`,
  });
  if (assetLogicValid) {
    console.log(`  [PASS] Asset approach value $${assetValue.toLocaleString()} > 0 (book value: $${bookValue.toLocaleString()})\n`);
  } else {
    console.log(`  [FAIL] Asset approach value should be > 0 when book value > 0\n`);
    allPassed = false;
  }

  // Step 8: Verify approach weights sum to 100%
  console.log('Step 8: Verifying approach weights sum to 100%...');
  const weights = mockCalculationResults.synthesis.approach_summary.map(a => a.weight);
  const weightSum = weights.reduce((sum, w) => sum + w, 0);
  const weightsValid = Math.abs(weightSum - 1.0) < 0.01;
  results.push({
    name: 'Approach weights sum',
    passed: weightsValid,
    details: `Weight sum: ${(weightSum * 100).toFixed(1)}% (expected: 100%)`,
  });
  if (weightsValid) {
    console.log(`  [PASS] Approach weights sum to ${(weightSum * 100).toFixed(1)}%\n`);
  } else {
    console.log(`  [FAIL] Approach weights sum to ${(weightSum * 100).toFixed(1)}% (expected 100%)\n`);
    allPassed = false;
  }

  // Final summary
  console.log('========================================');
  console.log('TEST RESULTS SUMMARY');
  console.log('========================================\n');

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  for (const result of results) {
    const icon = result.passed ? '[PASS]' : '[FAIL]';
    console.log(`${icon} ${result.name}: ${result.details}`);
  }

  console.log('\n----------------------------------------');
  console.log(`Total: ${results.length} tests`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log('----------------------------------------');

  if (allPassed) {
    console.log('\n[PASS] ALL TESTS PASSED\n');
  } else {
    console.log('\n[FAIL] SOME TESTS FAILED\n');
  }

  return { passed: allPassed, results };
}

// ============ MAIN ============

const { passed } = runTests();
process.exit(passed ? 0 : 1);
