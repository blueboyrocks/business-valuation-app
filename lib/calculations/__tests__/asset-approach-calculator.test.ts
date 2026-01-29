/**
 * Asset Approach Calculator Tests
 * PRD-H v2 US-004: Verify 3-tier fallback chain
 */
import { describe, it, expect } from 'vitest';
import { calculateAssetApproach, AssetApproachInputs } from '../asset-approach-calculator';
import { BalanceSheetData } from '../types';

/**
 * Build a mock BalanceSheetData for testing
 */
function buildMockBalanceSheet(overrides: Partial<{
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  cash: number;
  accountsReceivable: number;
  inventory: number;
}>): BalanceSheetData {
  const totalAssets = overrides.totalAssets ?? 2_000_000;
  const totalLiabilities = overrides.totalLiabilities ?? 800_000;
  const totalEquity = overrides.totalEquity ?? (totalAssets - totalLiabilities);

  return {
    period: '2024',
    assets: {
      current_assets: {
        cash: overrides.cash ?? 350_000,
        accounts_receivable: overrides.accountsReceivable ?? 620_000,
        allowance_for_doubtful_accounts: 0,
        inventory: overrides.inventory ?? 50_000,
        prepaid_expenses: 30_000,
        other_current_assets: 50_000,
        total_current_assets: 1_100_000,
      },
      fixed_assets: {
        land: 0,
        buildings: 0,
        machinery_and_equipment: 600_000,
        furniture_and_fixtures: 100_000,
        vehicles: 100_000,
        leasehold_improvements: 100_000,
        accumulated_depreciation: 300_000,
        net_fixed_assets: 600_000,
      },
      other_assets: {
        intangible_assets: 200_000,
        goodwill: 0,
        other: 100_000,
        total_other_assets: 300_000,
      },
      total_assets: totalAssets,
    },
    liabilities: {
      current_liabilities: {
        accounts_payable: 280_000,
        accrued_expenses: 50_000,
        current_portion_long_term_debt: 20_000,
        other_current_liabilities: 100_000,
        total_current_liabilities: 450_000,
      },
      long_term_liabilities: {
        notes_payable: 250_000,
        mortgages: 0,
        shareholder_loans: 0,
        other_long_term_liabilities: 100_000,
        total_long_term_liabilities: 350_000,
      },
      total_liabilities: totalLiabilities,
    },
    equity: {
      common_stock: 100_000,
      additional_paid_in_capital: 0,
      retained_earnings: totalEquity - 100_000,
      treasury_stock: 0,
      total_equity: totalEquity,
    },
  };
}

describe('Asset Approach Calculator', () => {
  describe('Tier 1: Balance sheet calculation (primary)', () => {
    it('should use balance sheet when it produces positive value', () => {
      const inputs: AssetApproachInputs = {
        balance_sheet: buildMockBalanceSheet({
          totalAssets: 2_000_000,
          totalLiabilities: 800_000,
          totalEquity: 1_200_000,
        }),
      };

      const result = calculateAssetApproach(inputs);

      expect(result.source).toBe('balance_sheet');
      expect(result.adjusted_net_asset_value).toBeGreaterThan(0);
    });

    it('should calculate book value correctly from assets minus liabilities', () => {
      const inputs: AssetApproachInputs = {
        balance_sheet: buildMockBalanceSheet({
          totalAssets: 2_000_000,
          totalLiabilities: 800_000,
        }),
      };

      const result = calculateAssetApproach(inputs);

      expect(result.book_value_of_equity).toBe(1_200_000);
    });

    it('should apply asset adjustments correctly', () => {
      const inputs: AssetApproachInputs = {
        balance_sheet: buildMockBalanceSheet({
          totalAssets: 2_000_000,
          totalLiabilities: 800_000,
        }),
        asset_adjustments: [
          {
            asset_name: 'Equipment',
            book_value: 500_000,
            fair_market_value: 450_000,
            rationale: 'Depreciation adjustment',
          },
        ],
      };

      const result = calculateAssetApproach(inputs);

      expect(result.total_asset_adjustments).toBe(-50_000);
      expect(result.adjusted_net_asset_value).toBe(1_150_000); // 1,200,000 - 50,000
    });
  });

  describe('Tier 2: Pass 7 fallback', () => {
    it('should use Pass 7 value when balance sheet calculation is zero', () => {
      const inputs: AssetApproachInputs = {
        balance_sheet: buildMockBalanceSheet({
          totalAssets: 1_000_000,
          totalLiabilities: 1_000_000,
          totalEquity: 0,
        }),
        pass7_adjusted_net_asset_value: 800_000,
      };

      const result = calculateAssetApproach(inputs);

      expect(result.source).toBe('pass7');
      expect(result.adjusted_net_asset_value).toBe(800_000);
    });

    it('should use Pass 7 value when balance sheet calculation is negative', () => {
      const inputs: AssetApproachInputs = {
        balance_sheet: buildMockBalanceSheet({
          totalAssets: 800_000,
          totalLiabilities: 1_200_000,
          totalEquity: -400_000,
        }),
        pass7_adjusted_net_asset_value: 500_000,
      };

      const result = calculateAssetApproach(inputs);

      expect(result.source).toBe('pass7');
      expect(result.adjusted_net_asset_value).toBe(500_000);
    });

    it('should add warning when falling back to Pass 7', () => {
      const inputs: AssetApproachInputs = {
        balance_sheet: buildMockBalanceSheet({
          totalAssets: 1_000_000,
          totalLiabilities: 1_000_000,
          totalEquity: 0,
        }),
        pass7_adjusted_net_asset_value: 800_000,
      };

      const result = calculateAssetApproach(inputs);

      expect(result.warnings.some(w => w.includes('Pass 7'))).toBe(true);
    });
  });

  describe('Tier 3: 50% of total assets fallback', () => {
    it('should use 50% of total assets when both balance sheet and Pass 7 fail', () => {
      const inputs: AssetApproachInputs = {
        balance_sheet: buildMockBalanceSheet({
          totalAssets: 2_000_000,
          totalLiabilities: 2_500_000,
          totalEquity: -500_000,
        }),
        // No pass7 value provided
      };

      const result = calculateAssetApproach(inputs);

      expect(result.source).toBe('estimated');
      expect(result.adjusted_net_asset_value).toBe(1_000_000); // 50% of 2,000,000
    });

    it('should use 50% estimate when Pass 7 is zero', () => {
      const inputs: AssetApproachInputs = {
        balance_sheet: buildMockBalanceSheet({
          totalAssets: 1_500_000,
          totalLiabilities: 1_500_000,
          totalEquity: 0,
        }),
        pass7_adjusted_net_asset_value: 0,
      };

      const result = calculateAssetApproach(inputs);

      expect(result.source).toBe('estimated');
      expect(result.adjusted_net_asset_value).toBe(750_000); // 50% of 1,500,000
    });

    it('should add warning when using estimated floor', () => {
      const inputs: AssetApproachInputs = {
        balance_sheet: buildMockBalanceSheet({
          totalAssets: 2_000_000,
          totalLiabilities: 2_500_000,
        }),
      };

      const result = calculateAssetApproach(inputs);

      expect(result.warnings.some(w => w.includes('50% of total assets'))).toBe(true);
    });
  });

  describe('PRD-H US-004: Never return $0 when assets exist', () => {
    it('should return positive value when totalAssets > 0 (tier 1)', () => {
      const inputs: AssetApproachInputs = {
        balance_sheet: buildMockBalanceSheet({
          totalAssets: 2_000_000,
          totalLiabilities: 500_000,
        }),
      };

      const result = calculateAssetApproach(inputs);

      expect(result.adjusted_net_asset_value).toBeGreaterThan(0);
    });

    it('should return positive value when totalAssets > 0 (tier 2)', () => {
      const inputs: AssetApproachInputs = {
        balance_sheet: buildMockBalanceSheet({
          totalAssets: 2_000_000,
          totalLiabilities: 2_000_000,
        }),
        pass7_adjusted_net_asset_value: 600_000,
      };

      const result = calculateAssetApproach(inputs);

      expect(result.adjusted_net_asset_value).toBeGreaterThan(0);
    });

    it('should return positive value when totalAssets > 0 (tier 3)', () => {
      const inputs: AssetApproachInputs = {
        balance_sheet: buildMockBalanceSheet({
          totalAssets: 3_000_000,
          totalLiabilities: 4_000_000,
        }),
        // No pass7 value
      };

      const result = calculateAssetApproach(inputs);

      expect(result.adjusted_net_asset_value).toBeGreaterThan(0);
      expect(result.adjusted_net_asset_value).toBe(1_500_000); // 50% of 3M
    });

    it('should only return 0 or negative when totalAssets is 0', () => {
      const inputs: AssetApproachInputs = {
        balance_sheet: buildMockBalanceSheet({
          totalAssets: 0,
          totalLiabilities: 100_000,
          totalEquity: -100_000,
        }),
      };

      const result = calculateAssetApproach(inputs);

      // When total assets is 0, all tiers fail and we return calculated value
      expect(result.adjusted_net_asset_value).toBeLessThanOrEqual(0);
    });
  });

  describe('Output structure', () => {
    it('should return required fields per PRD-H v2 spec', () => {
      const inputs: AssetApproachInputs = {
        balance_sheet: buildMockBalanceSheet({}),
      };

      const result = calculateAssetApproach(inputs);

      // Verify all required fields present
      expect(result).toHaveProperty('adjusted_net_asset_value');
      expect(result).toHaveProperty('source');
      expect(result).toHaveProperty('book_value_of_equity');
      expect(result).toHaveProperty('asset_adjustments');
      expect(result).toHaveProperty('total_asset_adjustments');
      expect(result).toHaveProperty('calculation_steps');
      expect(result).toHaveProperty('warnings');
    });

    it('should include source in output', () => {
      const inputs: AssetApproachInputs = {
        balance_sheet: buildMockBalanceSheet({}),
      };

      const result = calculateAssetApproach(inputs);

      expect(['balance_sheet', 'pass7', 'estimated']).toContain(result.source);
    });
  });

  describe('Auto-generated adjustments', () => {
    it('should auto-generate AR adjustment when no adjustments provided', () => {
      const inputs: AssetApproachInputs = {
        balance_sheet: buildMockBalanceSheet({
          accountsReceivable: 100_000,
        }),
        // No asset_adjustments
      };

      const result = calculateAssetApproach(inputs);

      expect(result.asset_adjustments.some(a => a.item_name === 'Accounts Receivable')).toBe(true);
    });

    it('should auto-generate inventory adjustment when no adjustments provided', () => {
      const inputs: AssetApproachInputs = {
        balance_sheet: buildMockBalanceSheet({
          inventory: 200_000,
        }),
        // No asset_adjustments
      };

      const result = calculateAssetApproach(inputs);

      expect(result.asset_adjustments.some(a => a.item_name === 'Inventory')).toBe(true);
    });

    it('should not auto-generate when adjustments are provided', () => {
      const inputs: AssetApproachInputs = {
        balance_sheet: buildMockBalanceSheet({
          inventory: 200_000,
        }),
        asset_adjustments: [
          {
            asset_name: 'Custom Asset',
            book_value: 100_000,
            fair_market_value: 90_000,
            rationale: 'Test adjustment',
          },
        ],
      };

      const result = calculateAssetApproach(inputs);

      expect(result.asset_adjustments.some(a => a.item_name === 'Inventory')).toBe(false);
      expect(result.asset_adjustments.some(a => a.item_name === 'Custom Asset')).toBe(true);
    });
  });
});
