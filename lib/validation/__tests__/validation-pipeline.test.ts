/**
 * Validation Pipeline Integration Tests
 *
 * Tests the complete validation pipeline: consistency, business rules,
 * completeness, and quality gate working together.
 *
 * Uses generic mock business data (not K-Force specific).
 *
 * PRD-I: US-016
 */
import { describe, it, expect } from 'vitest';
import { ValuationDataAccessor } from '../../valuation/data-accessor';
import type { ValuationDataStore } from '../../valuation/data-store';
import { validateValueConsistency } from '../consistency-validator';
import { validateBusinessRules } from '../business-rule-validator';
import { validateCompleteness } from '../completeness-validator';
import { runQualityGate, runQualityGateOrThrow } from '../quality-gate';

// ============ MOCK BUILDER ============

/**
 * Build a generic mock ValuationDataStore for a fictitious consulting firm.
 * All values are realistic but represent NO real company.
 */
function buildMockStore(overrides?: Partial<ValuationDataStore>): ValuationDataStore {
  // NOTE: Values chosen so that revenue, SDE, and balance sheet amounts are
  // outside the consistency validator's 0.1x-10x candidate range relative
  // to final_value ($5,250,000). This prevents false positive cross-metric
  // matches when section text contains both concluded-value keywords and
  // other dollar amounts.
  //
  // final_value = $5,250,000 → candidate range is $525,000 - $52,500,000
  // revenue = $18,500,000 (3.5x - in range but labeled "revenue" in text)
  // weighted_sde = $2,100,000 (0.4x - in range but labeled "sde" in text)
  // approach values: ~$4.5M-$5.5M (close to final, realistic)
  // balance_sheet total_assets = $4,200,000 (0.8x)
  const base: ValuationDataStore = {
    financial: {
      revenue: 18_500_000,
      cogs: 11_100_000,
      gross_profit: 7_400_000,
      sde: 2_250_000,
      ebitda: 1_800_000,
      net_income: 1_400_000,
      officer_compensation: 350_000,
      interest_expense: 45_000,
      depreciation: 120_000,
      amortization: 30_000,
      weighted_sde: 2_100_000,
      weighted_ebitda: 1_700_000,
      sde_by_year: [
        { period: '2024', sde: 2_250_000 },
        { period: '2023', sde: 2_050_000 },
        { period: '2022', sde: 1_900_000 },
      ],
      ebitda_by_year: [
        { period: '2024', ebitda: 1_800_000 },
        { period: '2023', ebitda: 1_650_000 },
        { period: '2022', ebitda: 1_500_000 },
      ],
      revenue_by_year: [
        { period: '2024', revenue: 18_500_000 },
        { period: '2023', revenue: 17_200_000 },
        { period: '2022', revenue: 15_800_000 },
      ],
    },
    valuation: {
      income_approach_value: 5_040_000,
      market_approach_value: 5_565_000,
      asset_approach_value: 3_150_000,
      final_value: 5_250_000,
      preliminary_value: 5_500_000,
      value_range_low: 4_500_000,
      value_range_high: 6_000_000,
      sde_multiple: 2.65,
      cap_rate: 0.25,
      income_weight: 0.35,
      market_weight: 0.45,
      asset_weight: 0.20,
      dlom_percentage: 0.10,
      dlom_applied: true,
      dlom_amount: 550_000,
      dloc_rate: 0,
      dloc_amount: 0,
    },
    company: {
      name: 'Apex Consulting Group, LLC',
      industry: 'Professional Services',
      naics_code: '541611',
      sic_code: '7371',
      entity_type: 'S-Corporation',
      fiscal_year_end: '2024-12-31',
      location: 'Denver, CO',
      years_in_business: 12,
    },
    balance_sheet: {
      total_assets: 4_200_000,
      total_liabilities: 1_850_000,
      total_equity: 2_350_000,
      cash: 875_000,
      accounts_receivable: 1_600_000,
      inventory: 125_000,
      fixed_assets: 1_400_000,
      intangible_assets: 200_000,
      accounts_payable: 600_000,
      current_assets: 2_650_000,
      current_liabilities: 1_050_000,
    },
    metadata: {
      report_date: '2025-06-15',
      valuation_date: '2025-06-01',
      generated_at: new Date().toISOString(),
      engine_version: '1.0.0',
      total_calc_steps: 10,
    },
    risk: {
      overall_score: 40,
      overall_rating: 'Moderate',
      factors: [],
    },
    data_quality: {
      completeness_score: 90,
      years_of_data: 3,
      missing_fields: [],
    },
  };

  if (!overrides) return base;

  return {
    financial: overrides.financial ?? base.financial,
    valuation: overrides.valuation ?? base.valuation,
    company: overrides.company ?? base.company,
    balance_sheet: overrides.balance_sheet ?? base.balance_sheet,
    metadata: overrides.metadata ?? base.metadata,
    risk: overrides.risk ?? base.risk,
    data_quality: overrides.data_quality ?? base.data_quality,
  };
}

// ============ SECTION CONTENT BUILDER ============

/**
 * Build a complete set of section contents with consistent values from the mock store.
 * Uses the same data accessor for all values to ensure consistency.
 *
 * IMPORTANT: The consistency validator scans for dollar values near keywords like
 * "concluded", "fair market value", "final value". To avoid false positives, we
 * keep non-final-value dollar amounts separated from these keywords, and ensure
 * the final value appears directly after such keywords.
 */
function buildValidSectionContents(accessor: ValuationDataAccessor): Map<string, string> {
  const sections = new Map<string, string>();
  const fv = accessor.getFormattedFinalValue();
  const rev = accessor.getFormattedRevenue();
  const sde = accessor.getFormattedSDE('normalized');
  const sdeMult = accessor.getFormattedSDEMultiple();

  // CRITICAL SECTIONS: The consistency validator checks ALL dollar amounts in sections
  // containing "concluded"/"fair market value" keywords. Only include the final value
  // dollar amount in these sections to avoid false-positive mismatches.
  sections.set('executiveSummary', generateWords(500, [
    `The concluded fair market value of ${accessor.getCompanyName()} is ${fv}.`,
    `This valuation was conducted as of ${accessor.getValuationDate()}.`,
    'The analysis incorporated three recognized valuation approaches, each contributing to a weighted conclusion.',
    'Operational performance has been consistent, with stable margins and manageable overhead.',
    `The company generates strong annual revenue with normalized seller discretionary earnings reflecting healthy profitability.`,
    `The market approach applied an SDE multiple of ${sdeMult}.`,
  ]));

  sections.set('conclusionOfValue', generateWords(100, [
    `Based on our analysis, the concluded fair market value is ${fv}.`,
    'This conclusion reflects a weighted consideration of three valuation approaches.',
    'The selected methodologies are appropriate for a company of this size and type.',
  ]));

  sections.set('companyProfile', generateWords(250, [
    `${accessor.getCompanyName()} is a ${accessor.getIndustryName()} firm.`,
    `The company has been operating for ${accessor.getYearsInBusiness()} years.`,
    `NAICS Code: ${accessor.getNaicsCode()}.`,
  ]));

  sections.set('industryAnalysis', generateWords(200, [
    `The ${accessor.getIndustryName()} sector has experienced steady growth.`,
    'Industry multiples range from 2.0x to 4.0x SDE for mid-sized firms.',
    'Market conditions favor acquisitions in this space.',
  ]));

  sections.set('financialAnalysis', generateWords(350, [
    `Total annual revenue was ${rev} for the most recent fiscal year.`,
    `Normalized SDE was ${sde}, representing a healthy margin.`,
    'The company has shown consistent growth over the past three years.',
    'Balance sheet analysis reveals adequate working capital and manageable debt levels.',
  ]));

  sections.set('assetApproach', generateWords(150, [
    'The asset-based method provides a floor indication of enterprise worth.',
    'Adjustments were made for accounts receivable collectibility and inventory obsolescence.',
    'Book values were adjusted to approximate fair market conditions for tangible assets.',
  ]));

  sections.set('incomeApproach', generateWords(200, [
    'The income-based method capitalizes expected future earnings into a present worth indication.',
    `A capitalization rate of ${accessor.getFormattedCapRate()} was applied to the earnings base.`,
    `Normalized SDE of ${sde} was used as the earnings base for capitalization.`,
  ]));

  sections.set('marketApproach', generateWords(250, [
    'The market-based method compares the subject company to similar transactions.',
    `An SDE multiple of ${sdeMult} was selected based on comparable transactions.`,
    `Applied to normalized seller discretionary earnings of ${sde} to derive the indication.`,
  ]));

  sections.set('riskAssessment', generateWords(200, [
    'Risk factors were evaluated across market, operational, financial, and regulatory dimensions.',
    'Overall risk was assessed as moderate with adequate mitigation strategies in place.',
    'Customer concentration risk is partially offset by long-term contracts.',
  ]));

  sections.set('assumptionsAndConditions', generateWords(150, [
    'This engagement assumes a going-concern basis for the subject entity.',
    'The standard applied is Fair Market Worth as defined by IRS Revenue Ruling 59-60.',
    'Information provided by management was assumed to be accurate and complete.',
    'No extraordinary events are anticipated that would materially affect the outcome.',
  ]));

  sections.set('sourcesAndReferences', generateWords(80, [
    'Sources: Company financial statements (2022-2024), IRS tax returns.',
    'Industry data from IBISWorld and BizBuySell transaction database.',
    'Risk-free rate from US Treasury 20-year bond yield.',
  ]));

  return sections;
}

/**
 * Generate text with at least `minWords` words, injecting the given sentences throughout.
 */
function generateWords(minWords: number, sentences: string[]): string {
  const filler = 'The analysis demonstrates strong performance metrics across key indicators. '
    + 'Operational efficiency has been maintained throughout the review period. '
    + 'Management has implemented effective strategies to drive growth and profitability. '
    + 'The market environment continues to present both opportunities and challenges. '
    + 'Comparative analysis supports the valuations derived through standard methodologies. '
    + 'Financial indicators suggest a stable and well-managed operation. '
    + 'Historical trends confirm consistent operational execution and sound fiscal management. '
    + 'The competitive landscape requires ongoing adaptation and strategic investment. '
    + 'Revenue diversification and client retention are notable strengths. '
    + 'Working capital management demonstrates prudent financial stewardship.';

  let text = sentences.join(' ');
  while (text.split(/\s+/).length < minWords) {
    text += ' ' + filler;
  }
  return text;
}

// ============ TESTS ============

describe('Validation Pipeline Integration Tests', () => {
  // ---- Passing scenario ----

  describe('valid report data passes quality gate', () => {
    it('should pass quality gate with score >= 70 for valid data', () => {
      const store = buildMockStore();
      const accessor = new ValuationDataAccessor(store);
      const sections = buildValidSectionContents(accessor);
      const rawData = JSON.stringify(store);

      const result = runQualityGate(accessor, sections, rawData);

      expect(result.canProceed).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(70);
      expect(result.blockingErrors).toHaveLength(0);
    });

    it('should not throw with runQualityGateOrThrow for valid data', () => {
      const store = buildMockStore();
      const accessor = new ValuationDataAccessor(store);
      const sections = buildValidSectionContents(accessor);
      const rawData = JSON.stringify(store);

      expect(() => runQualityGateOrThrow(accessor, sections, rawData)).not.toThrow();
    });
  });

  // ---- Consistency failures ----

  describe('inconsistent values across sections', () => {
    it('should fail when executive summary has different final value than conclusion', () => {
      const store = buildMockStore();
      const accessor = new ValuationDataAccessor(store);
      const sections = buildValidSectionContents(accessor);

      // Tamper the executive summary to show a DIFFERENT concluded value
      const wrongValue = '$1,500,000';
      const tampered = sections.get('executiveSummary')!
        .replace(accessor.getFormattedFinalValue(), wrongValue);
      sections.set('executiveSummary', tampered);

      const consistencyResult = validateValueConsistency(accessor, sections);

      // Should detect the mismatch
      expect(consistencyResult.passed).toBe(false);
      expect(consistencyResult.errors.length).toBeGreaterThan(0);
      expect(consistencyResult.errors.some(e => e.includes('mismatch'))).toBe(true);
    });

    it('should detect inconsistent values through quality gate', () => {
      const store = buildMockStore();
      const accessor = new ValuationDataAccessor(store);
      const sections = buildValidSectionContents(accessor);

      // Tamper the conclusion to show a different concluded value
      const original = sections.get('conclusionOfValue')!;
      const tampered = original.replace(
        accessor.getFormattedFinalValue(),
        '$2,000,000'
      );
      sections.set('conclusionOfValue', tampered);
      const rawData = JSON.stringify(store);

      const result = runQualityGate(accessor, sections, rawData);

      expect(result.categories.dataIntegrity.errors.length).toBeGreaterThan(0);
    });
  });

  // ---- [object Object] detection ----

  describe('[object Object] in raw data blocks generation', () => {
    it('should fail quality gate when raw data contains [object Object]', () => {
      const store = buildMockStore();
      const accessor = new ValuationDataAccessor(store);
      const sections = buildValidSectionContents(accessor);

      // Inject [object Object] into the raw data string
      const rawData = JSON.stringify(store) + ' [object Object] ';

      const result = runQualityGate(accessor, sections, rawData);

      expect(result.categories.dataIntegrity.passed).toBe(false);
      expect(result.categories.dataIntegrity.errors.some(
        e => e.includes('[object Object]')
      )).toBe(true);
    });

    it('should fail quality gate when section content contains [object Object]', () => {
      const store = buildMockStore();
      const accessor = new ValuationDataAccessor(store);
      const sections = buildValidSectionContents(accessor);

      // Inject [object Object] into a section
      const original = sections.get('financialAnalysis')!;
      sections.set('financialAnalysis', original + ' Revenue was [object Object] for the period.');

      const rawData = JSON.stringify(store);
      const result = runQualityGate(accessor, sections, rawData);

      expect(result.categories.dataIntegrity.passed).toBe(false);
      expect(result.categories.dataIntegrity.errors.some(
        e => e.includes('[object Object]')
      )).toBe(true);
    });

    it('should block generation via runQualityGateOrThrow', () => {
      const store = buildMockStore();
      const accessor = new ValuationDataAccessor(store);
      const sections = buildValidSectionContents(accessor);

      const rawData = JSON.stringify(store) + ' [object Object] ';

      expect(() => runQualityGateOrThrow(accessor, sections, rawData)).toThrow(
        /Quality gate BLOCKED/
      );
    });
  });

  // ---- Missing required section ----

  describe('missing required section blocks generation', () => {
    it('should fail completeness when Executive Summary is missing', () => {
      const store = buildMockStore();
      const accessor = new ValuationDataAccessor(store);
      const sections = buildValidSectionContents(accessor);

      // Remove the executive summary
      sections.delete('executiveSummary');

      const completenessResult = validateCompleteness(sections);

      expect(completenessResult.passed).toBe(false);
      expect(completenessResult.errors.some(
        e => e.includes('Executive Summary')
      )).toBe(true);
    });

    it('should fail quality gate when required section is missing', () => {
      const store = buildMockStore();
      const accessor = new ValuationDataAccessor(store);
      const sections = buildValidSectionContents(accessor);

      // Remove the executive summary
      sections.delete('executiveSummary');

      const rawData = JSON.stringify(store);
      const result = runQualityGate(accessor, sections, rawData);

      expect(result.categories.completeness.passed).toBe(false);
      expect(result.categories.completeness.errors.some(
        e => e.includes('Executive Summary')
      )).toBe(true);
      // Missing section is a blocking error
      expect(result.blockingErrors.some(e => e.includes('Executive Summary'))).toBe(true);
    });

    it('should block generation via runQualityGateOrThrow when section missing', () => {
      const store = buildMockStore();
      const accessor = new ValuationDataAccessor(store);
      const sections = buildValidSectionContents(accessor);
      sections.delete('executiveSummary');

      const rawData = JSON.stringify(store);

      expect(() => runQualityGateOrThrow(accessor, sections, rawData)).toThrow(
        /Quality gate BLOCKED/
      );
    });
  });

  // ---- Asset approach $0 with positive assets ----

  describe('asset approach $0 with positive assets fails business rules', () => {
    it('should fail when asset approach value is 0 but total assets > 0', () => {
      const store = buildMockStore({
        valuation: {
          ...buildMockStore().valuation,
          asset_approach_value: 0,
        },
      });
      const accessor = new ValuationDataAccessor(store);

      const result = validateBusinessRules(accessor);

      expect(result.passed).toBe(false);
      expect(result.errors.some(e => e.includes('Asset approach'))).toBe(true);
    });

    it('should fail quality gate when asset approach is $0 with positive assets', () => {
      const store = buildMockStore({
        valuation: {
          ...buildMockStore().valuation,
          asset_approach_value: 0,
        },
      });
      const accessor = new ValuationDataAccessor(store);
      const sections = buildValidSectionContents(accessor);
      const rawData = JSON.stringify(store);

      const result = runQualityGate(accessor, sections, rawData);

      expect(result.categories.businessRules.passed).toBe(false);
      expect(result.categories.businessRules.errors.some(
        e => e.includes('Asset approach')
      )).toBe(true);
    });
  });

  // ---- SDE multiple outside industry range ----

  describe('SDE multiple outside industry range', () => {
    it('should generate warning when SDE multiple is below industry range', () => {
      const store = buildMockStore({
        valuation: {
          ...buildMockStore().valuation,
          sde_multiple: 1.0, // Below Professional Services range (2.0-4.0)
        },
      });
      const accessor = new ValuationDataAccessor(store);

      const result = validateBusinessRules(accessor);

      // Below range but not > 1.5x max → warning, not error
      expect(result.warnings.some(e => e.includes('outside'))).toBe(true);
    });

    it('should generate error when SDE multiple far exceeds industry max', () => {
      const store = buildMockStore({
        valuation: {
          ...buildMockStore().valuation,
          sde_multiple: 7.0, // Well above 1.5x max for Professional Services (4.0 * 1.5 = 6.0)
        },
      });
      const accessor = new ValuationDataAccessor(store);

      const result = validateBusinessRules(accessor);

      expect(result.passed).toBe(false);
      expect(result.errors.some(e => e.includes('exceeds'))).toBe(true);
    });
  });

  // ---- Approach weights not summing to 100% ----

  describe('approach weights not summing to 100%', () => {
    it('should fail when weights sum to significantly more than 100%', () => {
      const store = buildMockStore({
        valuation: {
          ...buildMockStore().valuation,
          income_weight: 0.50,
          market_weight: 0.50,
          asset_weight: 0.30, // Total = 130%
        },
      });
      const accessor = new ValuationDataAccessor(store);

      const result = validateBusinessRules(accessor);

      expect(result.passed).toBe(false);
      expect(result.errors.some(e => e.includes('weights sum'))).toBe(true);
    });

    it('should fail when weights sum to significantly less than 100%', () => {
      const store = buildMockStore({
        valuation: {
          ...buildMockStore().valuation,
          income_weight: 0.20,
          market_weight: 0.20,
          asset_weight: 0.10, // Total = 50%
        },
      });
      const accessor = new ValuationDataAccessor(store);

      const result = validateBusinessRules(accessor);

      expect(result.passed).toBe(false);
      expect(result.errors.some(e => e.includes('weights sum'))).toBe(true);
    });

    it('should pass when weights sum to 100% within 1% tolerance', () => {
      const store = buildMockStore({
        valuation: {
          ...buildMockStore().valuation,
          income_weight: 0.34,
          market_weight: 0.46,
          asset_weight: 0.20, // Total = 1.00
        },
      });
      const accessor = new ValuationDataAccessor(store);

      const result = validateBusinessRules(accessor);

      // The weight-sum rule should pass
      const weightRule = result.results.find(r => r.rule === 'Approach Weights Sum to 100%');
      expect(weightRule?.passed).toBe(true);
    });

    it('should fail quality gate when weights are wrong', () => {
      const store = buildMockStore({
        valuation: {
          ...buildMockStore().valuation,
          income_weight: 0.50,
          market_weight: 0.50,
          asset_weight: 0.50, // Total = 150%
        },
      });
      const accessor = new ValuationDataAccessor(store);
      const sections = buildValidSectionContents(accessor);
      const rawData = JSON.stringify(store);

      const result = runQualityGate(accessor, sections, rawData);

      expect(result.categories.businessRules.passed).toBe(false);
      expect(result.blockingErrors.some(e => e.includes('weights'))).toBe(true);
    });
  });

  // ---- Quality gate score and structure ----

  describe('quality gate result structure', () => {
    it('should include all four quality categories', () => {
      const store = buildMockStore();
      const accessor = new ValuationDataAccessor(store);
      const sections = buildValidSectionContents(accessor);
      const rawData = JSON.stringify(store);

      const result = runQualityGate(accessor, sections, rawData);

      expect(result.categories.dataIntegrity).toBeDefined();
      expect(result.categories.businessRules).toBeDefined();
      expect(result.categories.completeness).toBeDefined();
      expect(result.categories.formatting).toBeDefined();
    });

    it('should have correct category weights summing to 1.0', () => {
      const store = buildMockStore();
      const accessor = new ValuationDataAccessor(store);
      const sections = buildValidSectionContents(accessor);
      const rawData = JSON.stringify(store);

      const result = runQualityGate(accessor, sections, rawData);

      const totalWeight =
        result.categories.dataIntegrity.weight +
        result.categories.businessRules.weight +
        result.categories.completeness.weight +
        result.categories.formatting.weight;

      expect(totalWeight).toBeCloseTo(1.0, 2);
    });

    it('should have score between 0 and 100', () => {
      const store = buildMockStore();
      const accessor = new ValuationDataAccessor(store);
      const sections = buildValidSectionContents(accessor);
      const rawData = JSON.stringify(store);

      const result = runQualityGate(accessor, sections, rawData);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  // ---- Final value must be positive ----

  describe('final value must be positive', () => {
    it('should fail business rules when final value is zero', () => {
      const store = buildMockStore({
        valuation: {
          ...buildMockStore().valuation,
          final_value: 0,
        },
      });
      const accessor = new ValuationDataAccessor(store);

      const result = validateBusinessRules(accessor);

      expect(result.passed).toBe(false);
      expect(result.errors.some(e => e.includes('Final value'))).toBe(true);
    });

    it('should fail business rules when final value is negative', () => {
      const store = buildMockStore({
        valuation: {
          ...buildMockStore().valuation,
          final_value: -100_000,
        },
      });
      const accessor = new ValuationDataAccessor(store);

      const result = validateBusinessRules(accessor);

      expect(result.passed).toBe(false);
      expect(result.errors.some(e => e.includes('Final value'))).toBe(true);
    });
  });

  // ---- Cap rate validation ----

  describe('cap rate validation', () => {
    it('should fail when cap rate is below 5%', () => {
      const store = buildMockStore({
        valuation: {
          ...buildMockStore().valuation,
          cap_rate: 0.03, // 3% - below minimum
        },
      });
      const accessor = new ValuationDataAccessor(store);

      const result = validateBusinessRules(accessor);

      expect(result.passed).toBe(false);
      expect(result.errors.some(e => e.includes('Cap rate'))).toBe(true);
    });

    it('should fail when cap rate exceeds 60%', () => {
      const store = buildMockStore({
        valuation: {
          ...buildMockStore().valuation,
          cap_rate: 0.65, // 65% - above maximum
        },
      });
      const accessor = new ValuationDataAccessor(store);

      const result = validateBusinessRules(accessor);

      expect(result.passed).toBe(false);
      expect(result.errors.some(e => e.includes('Cap rate'))).toBe(true);
    });

    it('should warn when cap rate outside 10%-50% but inside 5%-60%', () => {
      const store = buildMockStore({
        valuation: {
          ...buildMockStore().valuation,
          cap_rate: 0.08, // 8% - warning range
        },
      });
      const accessor = new ValuationDataAccessor(store);

      const result = validateBusinessRules(accessor);

      // Should pass (no errors) but have warnings
      expect(result.passed).toBe(true);
      expect(result.warnings.some(e => e.includes('Cap rate'))).toBe(true);
    });
  });

  // ---- Multiple blocking errors compound ----

  describe('multiple blocking errors', () => {
    it('should accumulate all blocking errors from different categories', () => {
      const store = buildMockStore({
        valuation: {
          ...buildMockStore().valuation,
          final_value: 0,                // Business rule: final value not positive
          asset_approach_value: 0,        // Business rule: asset approach $0 with positive assets
          income_weight: 0.50,
          market_weight: 0.50,
          asset_weight: 0.50,            // Business rule: weights sum to 150%
        },
      });
      const accessor = new ValuationDataAccessor(store);
      const sections = buildValidSectionContents(accessor);
      sections.delete('executiveSummary'); // Completeness: missing section

      const rawData = JSON.stringify(store) + ' [object Object] '; // Data integrity

      const result = runQualityGate(accessor, sections, rawData);

      expect(result.canProceed).toBe(false);
      // Should have errors from multiple categories
      expect(result.blockingErrors.length).toBeGreaterThanOrEqual(3);
      expect(result.categories.dataIntegrity.passed).toBe(false);
      expect(result.categories.businessRules.passed).toBe(false);
      expect(result.categories.completeness.passed).toBe(false);
    });
  });

  // ---- Undefined/NaN detection ----

  describe('undefined and NaN detection', () => {
    it('should detect undefined in raw data', () => {
      const store = buildMockStore();
      const accessor = new ValuationDataAccessor(store);
      const sections = buildValidSectionContents(accessor);

      const rawData = '{"value": undefined, "other": "data"}';

      const result = runQualityGate(accessor, sections, rawData);

      expect(result.categories.dataIntegrity.errors.some(
        e => e.includes('undefined')
      )).toBe(true);
    });

    it('should detect NaN in section content', () => {
      const store = buildMockStore();
      const accessor = new ValuationDataAccessor(store);
      const sections = buildValidSectionContents(accessor);

      const original = sections.get('financialAnalysis')!;
      sections.set('financialAnalysis', original + ' The growth rate was NaN percent.');

      const rawData = JSON.stringify(store);
      const result = runQualityGate(accessor, sections, rawData);

      expect(result.categories.dataIntegrity.errors.some(
        e => e.includes('NaN')
      )).toBe(true);
    });
  });

  // ---- N/A in critical fields ----

  describe('N/A in critical fields', () => {
    it('should flag N/A near concluded value', () => {
      const store = buildMockStore();
      const accessor = new ValuationDataAccessor(store);
      const sections = buildValidSectionContents(accessor);

      // Insert N/A near "concluded value"
      const original = sections.get('conclusionOfValue')!;
      sections.set('conclusionOfValue', original + ' The concluded value is N/A pending review.');

      const rawData = JSON.stringify(store);
      const result = runQualityGate(accessor, sections, rawData);

      expect(result.categories.formatting.errors.some(
        e => e.includes('N/A')
      )).toBe(true);
    });
  });

  // ---- Completeness word count warnings ----

  describe('completeness word count warnings', () => {
    it('should warn when section has too few words', () => {
      const sections = new Map<string, string>();
      sections.set('executiveSummary', 'This is a very short summary.'); // Way below 400 words
      sections.set('conclusionOfValue', generateWords(50, ['Concluded value is $950,000.']));
      sections.set('companyProfile', generateWords(200, ['Company overview.']));
      sections.set('industryAnalysis', generateWords(150, ['Industry overview.']));
      sections.set('financialAnalysis', generateWords(300, ['Financial overview.']));
      sections.set('assetApproach', generateWords(100, ['Asset approach.']));
      sections.set('incomeApproach', generateWords(150, ['Income approach.']));
      sections.set('marketApproach', generateWords(200, ['Market approach.']));
      sections.set('riskAssessment', generateWords(150, ['Risk assessment.']));
      sections.set('assumptionsAndConditions', generateWords(100, ['Assumptions.']));
      sections.set('sourcesAndReferences', generateWords(50, ['Sources.']));

      const result = validateCompleteness(sections);

      // Should pass (all sections present) but warn about exec summary word count
      expect(result.passed).toBe(true);
      expect(result.warnings.some(w => w.includes('Executive Summary'))).toBe(true);
    });
  });
});
