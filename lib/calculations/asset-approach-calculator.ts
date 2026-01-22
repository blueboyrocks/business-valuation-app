/**
 * Asset Approach Calculator - Adjusted Net Asset Method
 */

import {
  BalanceSheetData,
  AssetApproachCalculation,
  AssetAdjustment,
  CalculationStep,
} from './types';
import {
  safeNumber,
  roundToDollar,
  createStep,
  resetStepCounter,
  formatCurrency,
  createTable,
} from './utils';

export interface AssetAdjustmentInput {
  asset_name: string;
  book_value: number;
  fair_market_value: number;
  rationale: string;
}

export interface AssetApproachInputs {
  balance_sheet: BalanceSheetData;
  asset_adjustments?: AssetAdjustmentInput[];
  liability_adjustments?: AssetAdjustmentInput[];
  weight?: number;
  weight_rationale?: string;
}

/**
 * Calculate Asset Approach value using Adjusted Net Asset Method
 */
export function calculateAssetApproach(inputs: AssetApproachInputs): AssetApproachCalculation {
  resetStepCounter();
  const steps: CalculationStep[] = [];
  const warnings: string[] = [];
  const bs = inputs.balance_sheet;

  // Get book values from balance sheet
  const totalAssets = safeNumber(bs.assets.total_assets);
  const totalLiabilities = safeNumber(bs.liabilities.total_liabilities);
  const bookEquity = safeNumber(bs.equity.total_equity);

  // Verify balance sheet balances
  const calculatedEquity = totalAssets - totalLiabilities;
  if (Math.abs(calculatedEquity - bookEquity) > 1) {
    warnings.push(
      `Balance sheet imbalance: Assets (${formatCurrency(totalAssets)}) - ` +
        `Liabilities (${formatCurrency(totalLiabilities)}) = ${formatCurrency(calculatedEquity)}, ` +
        `but Equity shows ${formatCurrency(bookEquity)}`
    );
  }

  // Start with calculated equity (Assets - Liabilities)
  const bookValueOfEquity = roundToDollar(calculatedEquity);
  steps.push(
    createStep(
      'Asset',
      'Calculate book value of equity',
      'Book Value = Total Assets - Total Liabilities',
      { total_assets: totalAssets, total_liabilities: totalLiabilities },
      bookValueOfEquity
    )
  );

  // Process asset adjustments
  const assetAdjustments: AssetAdjustment[] = [];
  let totalAssetAdjustments = 0;

  if (inputs.asset_adjustments && inputs.asset_adjustments.length > 0) {
    for (const adj of inputs.asset_adjustments) {
      const adjustment = safeNumber(adj.fair_market_value) - safeNumber(adj.book_value);
      assetAdjustments.push({
        item_name: adj.asset_name,
        book_value: safeNumber(adj.book_value),
        fair_market_value: safeNumber(adj.fair_market_value),
        adjustment: roundToDollar(adjustment),
        rationale: adj.rationale,
      });
      totalAssetAdjustments += adjustment;
      steps.push(
        createStep(
          'Asset',
          `Adjust ${adj.asset_name} to FMV`,
          'Adjustment = FMV - Book Value',
          { book_value: adj.book_value, fair_market_value: adj.fair_market_value },
          adjustment,
          adj.rationale
        )
      );
    }
  } else {
    // Default adjustments if none provided
    warnings.push('No asset adjustments provided. Using book values as fair market values.');

    // Auto-generate some common adjustments
    const arBalance = safeNumber(bs.assets.current_assets.accounts_receivable);
    const allowance = safeNumber(bs.assets.current_assets.allowance_for_doubtful_accounts);
    if (arBalance > 0 && allowance === 0) {
      // Suggest 5% AR adjustment for uncollectible accounts
      const arAdjustment = roundToDollar(arBalance * -0.05);
      assetAdjustments.push({
        item_name: 'Accounts Receivable',
        book_value: arBalance,
        fair_market_value: arBalance + arAdjustment,
        adjustment: arAdjustment,
        rationale: 'Estimated 5% allowance for doubtful accounts',
      });
      totalAssetAdjustments += arAdjustment;
      steps.push(
        createStep(
          'Asset',
          'Adjust Accounts Receivable for collectibility',
          'Adjustment = -5% of AR balance',
          { ar_balance: arBalance },
          arAdjustment,
          'Estimated allowance for doubtful accounts'
        )
      );
    }
  }

  // Process liability adjustments
  const liabilityAdjustments: AssetAdjustment[] = [];
  let totalLiabilityAdjustments = 0;

  if (inputs.liability_adjustments && inputs.liability_adjustments.length > 0) {
    for (const adj of inputs.liability_adjustments) {
      const adjustment = safeNumber(adj.fair_market_value) - safeNumber(adj.book_value);
      liabilityAdjustments.push({
        item_name: adj.asset_name,
        book_value: safeNumber(adj.book_value),
        fair_market_value: safeNumber(adj.fair_market_value),
        adjustment: roundToDollar(adjustment),
        rationale: adj.rationale,
      });
      totalLiabilityAdjustments += adjustment;
      steps.push(
        createStep(
          'Asset',
          `Adjust ${adj.asset_name} liability to FMV`,
          'Adjustment = FMV - Book Value',
          { book_value: adj.book_value, fair_market_value: adj.fair_market_value },
          adjustment,
          adj.rationale
        )
      );
    }
  }

  // Calculate adjusted net asset value
  // Asset adjustments increase value (if positive), liability adjustments decrease value (if positive)
  const adjustedNetAssetValue = roundToDollar(
    bookValueOfEquity + totalAssetAdjustments - totalLiabilityAdjustments
  );
  steps.push(
    createStep(
      'Asset',
      'Calculate adjusted net asset value',
      'Adjusted NAV = Book Equity + Asset Adj - Liability Adj',
      {
        book_equity: bookValueOfEquity,
        asset_adjustments: roundToDollar(totalAssetAdjustments),
        liability_adjustments: roundToDollar(totalLiabilityAdjustments),
      },
      adjustedNetAssetValue
    )
  );

  // Warnings for unusual values
  if (adjustedNetAssetValue < 0) {
    warnings.push(
      `Adjusted Net Asset Value is negative: ${formatCurrency(adjustedNetAssetValue)}. ` +
        `Liabilities exceed assets.`
    );
  }

  if (adjustedNetAssetValue === 0 && bookValueOfEquity !== 0) {
    warnings.push(
      'Adjusted NAV equals zero despite non-zero book equity. Review adjustments.'
    );
  }

  // Default weight for asset approach (typically 20% for operating companies)
  const weight = inputs.weight ?? 0.2;

  return {
    book_value_of_equity: bookValueOfEquity,
    asset_adjustments: assetAdjustments,
    total_asset_adjustments: roundToDollar(totalAssetAdjustments),
    liability_adjustments: liabilityAdjustments,
    total_liability_adjustments: roundToDollar(totalLiabilityAdjustments),
    adjusted_net_asset_value: adjustedNetAssetValue,
    weight,
    weight_rationale: inputs.weight_rationale,
    calculation_steps: steps,
    warnings,
  };
}

/**
 * Format asset approach results as markdown
 */
export function formatAssetApproachTable(result: AssetApproachCalculation): string {
  const lines: string[] = [];

  lines.push('### Asset Approach Calculation\n');
  lines.push(`**Book Value of Equity:** ${formatCurrency(result.book_value_of_equity)}\n`);

  // Asset adjustments table
  if (result.asset_adjustments.length > 0) {
    lines.push('**Asset Adjustments:**\n');
    const headers = ['Asset', 'Book Value', 'FMV', 'Adjustment'];
    const rows = result.asset_adjustments.map(adj => [
      adj.item_name,
      formatCurrency(adj.book_value),
      formatCurrency(adj.fair_market_value),
      formatCurrency(adj.adjustment),
    ]);
    rows.push([
      '**Total**',
      '',
      '',
      `**${formatCurrency(result.total_asset_adjustments)}**`,
    ]);
    lines.push(createTable(headers, rows));
    lines.push('');
  }

  // Liability adjustments table
  if (result.liability_adjustments.length > 0) {
    lines.push('**Liability Adjustments:**\n');
    const headers = ['Liability', 'Book Value', 'FMV', 'Adjustment'];
    const rows = result.liability_adjustments.map(adj => [
      adj.item_name,
      formatCurrency(adj.book_value),
      formatCurrency(adj.fair_market_value),
      formatCurrency(adj.adjustment),
    ]);
    rows.push([
      '**Total**',
      '',
      '',
      `**${formatCurrency(result.total_liability_adjustments)}**`,
    ]);
    lines.push(createTable(headers, rows));
    lines.push('');
  }

  lines.push(`**Adjusted Net Asset Value:** ${formatCurrency(result.adjusted_net_asset_value)}`);
  lines.push(`**Weight Assigned:** ${(result.weight * 100).toFixed(0)}%`);

  if (result.weight_rationale) {
    lines.push(`\n*Rationale: ${result.weight_rationale}*`);
  }

  return lines.join('\n');
}
