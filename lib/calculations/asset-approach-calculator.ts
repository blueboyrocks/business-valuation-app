/**
 * Asset Approach Calculator - Adjusted Net Asset Method
 */

import {
  BalanceSheetData,
  AssetApproachCalculation,
  AssetAdjustment,
  AssetApproachSource,
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
  pass7_adjusted_net_asset_value?: number;
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

  // PRD-H US-005: Log asset approach inputs for debugging
  console.log(`[ASSET_APPROACH] totalAssets=${totalAssets} liabilities=${totalLiabilities} bookEquity=${bookEquity}`);

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

    // 10% inventory obsolescence reserve
    const inventoryBalance = safeNumber(bs.assets.current_assets.inventory);
    if (inventoryBalance > 0) {
      const inventoryAdjustment = roundToDollar(inventoryBalance * -0.10);
      assetAdjustments.push({
        item_name: 'Inventory',
        book_value: inventoryBalance,
        fair_market_value: inventoryBalance + inventoryAdjustment,
        adjustment: inventoryAdjustment,
        rationale: 'Estimated 10% inventory obsolescence reserve',
      });
      totalAssetAdjustments += inventoryAdjustment;
      steps.push(
        createStep(
          'Asset',
          'Adjust Inventory for obsolescence',
          'Adjustment = -10% of inventory balance',
          { inventory_balance: inventoryBalance },
          inventoryAdjustment,
          'Estimated inventory obsolescence reserve'
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

  // 3-tier fallback chain to ensure positive value when assets exist
  let finalValue = adjustedNetAssetValue;
  let source: AssetApproachSource = 'balance_sheet';

  const pass7Value = safeNumber(inputs.pass7_adjusted_net_asset_value);

  if (finalValue > 0) {
    // Tier 1 (primary): Balance sheet calculation produced a positive value
    source = 'balance_sheet';
    console.log(`[AssetApproach] Using balance_sheet source: ${formatCurrency(finalValue)}`);
  } else if (pass7Value > 0) {
    // Tier 2: Fall back to Pass 7 (AI-extracted) output
    finalValue = roundToDollar(pass7Value);
    source = 'pass7';
    warnings.push(
      `Balance sheet calculation yielded ${formatCurrency(adjustedNetAssetValue)}. ` +
        `Using Pass 7 adjusted net asset value: ${formatCurrency(finalValue)}`
    );
    steps.push(
      createStep(
        'Asset',
        'Fallback to Pass 7 adjusted net asset value',
        'Balance sheet NAV <= 0, using Pass 7 output',
        { balance_sheet_nav: adjustedNetAssetValue, pass7_nav: finalValue },
        finalValue,
        'Pass 7 AI-extracted value used as fallback'
      )
    );
    console.log(`[AssetApproach] Using pass7 source: ${formatCurrency(finalValue)}`);
  } else if (totalAssets > 0) {
    // Tier 3: 50% of total assets as floor estimate
    finalValue = roundToDollar(totalAssets * 0.5);
    source = 'estimated';
    warnings.push(
      `Balance sheet calculation and Pass 7 yielded no positive value. ` +
        `Using 50% of total assets (${formatCurrency(totalAssets)}) as floor estimate: ${formatCurrency(finalValue)}`
    );
    steps.push(
      createStep(
        'Asset',
        'Estimate floor value from total assets',
        'Floor = 50% × Total Assets',
        { total_assets: totalAssets },
        finalValue,
        'Conservative floor estimate when other methods produce zero or negative'
      )
    );
    console.log(`[AssetApproach] Using estimated source (50% of total assets): ${formatCurrency(finalValue)}`);
  } else {
    console.log(`[AssetApproach] No positive source available, value: ${formatCurrency(finalValue)}`);
  }

  // Default weight for asset approach (typically 20% for operating companies)
  const weight = inputs.weight ?? 0.2;

  // PRD-H US-005: Summary log with all key values
  console.log(`[ASSET_APPROACH] totalAssets=${totalAssets} liabilities=${totalLiabilities} calculated=${adjustedNetAssetValue} final=${finalValue}`);

  return {
    book_value_of_equity: bookValueOfEquity,
    asset_adjustments: assetAdjustments,
    total_asset_adjustments: roundToDollar(totalAssetAdjustments),
    liability_adjustments: liabilityAdjustments,
    total_liability_adjustments: roundToDollar(totalLiabilityAdjustments),
    adjusted_net_asset_value: finalValue,
    source,
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
