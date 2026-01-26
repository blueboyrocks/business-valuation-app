/**
 * Chart Data Builder
 * Extracts chart-ready data from a ValuationDataAccessor instance.
 * Returns a ChartDataSet that can be passed directly to ReportChartGenerator methods.
 */

import type { ValuationDataAccessor } from '../valuation/data-accessor';
import type { ChartDataSet } from './chart-generator';

/**
 * Build a complete ChartDataSet from the ValuationDataAccessor.
 * Handles missing or sparse data gracefully by using safe defaults.
 */
export function buildChartData(accessor: ValuationDataAccessor): ChartDataSet {
  // --- Revenue by year ---
  const revenueByYear = accessor.getRevenueByYear();
  const revenueTrend = {
    labels: revenueByYear.map(r => r.period),
    values: revenueByYear.map(r => r.revenue),
  };

  // If no year-level revenue data, fall back to current revenue as a single point
  if (revenueTrend.labels.length === 0 && accessor.getRevenue() > 0) {
    revenueTrend.labels = ['Current'];
    revenueTrend.values = [accessor.getRevenue()];
  }

  // --- SDE by year ---
  const sdeByYear = accessor.getSDEByYear();
  const sdeTrend = {
    labels: sdeByYear.map(s => s.period),
    values: sdeByYear.map(s => s.sde),
  };

  if (sdeTrend.labels.length === 0 && accessor.getSDE() > 0) {
    sdeTrend.labels = ['Current'];
    sdeTrend.values = [accessor.getSDE()];
  }

  // --- EBITDA by year ---
  const ebitdaByYear = accessor.getEBITDAByYear();
  const ebitdaTrend = {
    labels: ebitdaByYear.map(e => e.period),
    values: ebitdaByYear.map(e => e.ebitda),
  };

  if (ebitdaTrend.labels.length === 0 && accessor.getEBITDA() > 0) {
    ebitdaTrend.labels = ['Current'];
    ebitdaTrend.values = [accessor.getEBITDA()];
  }

  // --- Valuation comparison from the three approaches ---
  const approaches: { name: string; value: number }[] = [];

  const incomeValue = accessor.getIncomeApproachValue();
  if (incomeValue > 0) {
    approaches.push({ name: 'Income', value: incomeValue });
  }

  const marketValue = accessor.getMarketApproachValue();
  if (marketValue > 0) {
    approaches.push({ name: 'Market', value: marketValue });
  }

  const assetValue = accessor.getAssetApproachValue();
  if (assetValue > 0) {
    approaches.push({ name: 'Asset', value: assetValue });
  }

  const valuationComparison = {
    approaches,
    finalValue: accessor.getFinalValue(),
  };

  // --- Risk score ---
  // Derive a risk score from financial health indicators.
  // This is a simplified heuristic; a dedicated risk module may override it.
  const riskScore = deriveRiskScore(accessor);

  // --- Profitability margin trends ---
  // Compute margin percentages for each year where we have revenue data.
  const profitabilityTrend = buildProfitabilityTrend(accessor);

  return {
    revenueTrend,
    sdeTrend,
    ebitdaTrend,
    valuationComparison,
    riskScore,
    profitabilityTrend,
  };
}

// ============ INTERNAL HELPERS ============

/**
 * Derive a risk score (1-10) from available financial data.
 * Lower score = lower risk, higher score = higher risk.
 * Returns 5 (moderate) when insufficient data is available.
 */
function deriveRiskScore(accessor: ValuationDataAccessor): number {
  let score = 5; // default moderate
  let adjustments = 0;

  // Current ratio assessment
  const currentRatio = accessor.getCurrentRatio();
  if (currentRatio > 0) {
    if (currentRatio >= 2.0) {
      adjustments -= 1; // strong liquidity
    } else if (currentRatio < 1.0) {
      adjustments += 2; // weak liquidity
    }
  }

  // Debt-to-equity assessment
  const debtToEquity = accessor.getDebtToEquityRatio();
  if (debtToEquity > 0) {
    if (debtToEquity > 3.0) {
      adjustments += 2; // highly leveraged
    } else if (debtToEquity > 1.5) {
      adjustments += 1; // moderate leverage
    } else if (debtToEquity < 0.5) {
      adjustments -= 1; // low leverage
    }
  }

  // Profit margin assessment
  const profitMargin = accessor.getProfitMargin();
  if (profitMargin > 0.15) {
    adjustments -= 1; // healthy margins
  } else if (profitMargin < 0.05 && profitMargin >= 0) {
    adjustments += 1; // thin margins
  }

  // Revenue trend assessment (growing = lower risk)
  const revenueByYear = accessor.getRevenueByYear();
  if (revenueByYear.length >= 2) {
    const first = revenueByYear[revenueByYear.length - 1].revenue;
    const last = revenueByYear[0].revenue;
    if (first > 0 && last > 0) {
      if (last > first * 1.1) {
        adjustments -= 1; // growing revenue
      } else if (last < first * 0.9) {
        adjustments += 1; // declining revenue
      }
    }
  }

  score = Math.max(1, Math.min(10, score + adjustments));
  return score;
}

/**
 * Build profitability margin trend data.
 * Computes gross margin, SDE margin, and EBITDA margin as percentages for each year.
 */
function buildProfitabilityTrend(
  accessor: ValuationDataAccessor
): ChartDataSet['profitabilityTrend'] {
  const revenueByYear = accessor.getRevenueByYear();
  const sdeByYear = accessor.getSDEByYear();
  const ebitdaByYear = accessor.getEBITDAByYear();

  // Use SDE years as the canonical labels (they typically have the most coverage)
  const labels = sdeByYear.map(s => s.period);

  // Build margin arrays. Margins are expressed as percentage values (0-100).
  const grossMargins: number[] = [];
  const sdeMargins: number[] = [];
  const ebitdaMargins: number[] = [];

  for (let i = 0; i < labels.length; i++) {
    const period = labels[i];

    // Find matching revenue for this period
    const revenueEntry = revenueByYear.find(r => r.period === period);
    const revenue = revenueEntry?.revenue || 0;

    // SDE margin
    const sdeEntry = sdeByYear.find(s => s.period === period);
    const sde = sdeEntry?.sde || 0;
    sdeMargins.push(revenue > 0 ? (sde / revenue) * 100 : 0);

    // EBITDA margin
    const ebitdaEntry = ebitdaByYear.find(e => e.period === period);
    const ebitda = ebitdaEntry?.ebitda || 0;
    ebitdaMargins.push(revenue > 0 ? (ebitda / revenue) * 100 : 0);

    // Gross margin: estimate from current gross profit ratio if per-year data unavailable
    if (revenue > 0 && accessor.getRevenue() > 0) {
      const grossProfitRatio = accessor.getGrossProfit() / accessor.getRevenue();
      grossMargins.push(grossProfitRatio * 100);
    } else {
      grossMargins.push(0);
    }
  }

  // Fallback: if no year-level data, use current-period snapshot
  if (labels.length === 0 && accessor.getRevenue() > 0) {
    const revenue = accessor.getRevenue();
    return {
      labels: ['Current'],
      margins: {
        gross: [revenue > 0 ? (accessor.getGrossProfit() / revenue) * 100 : 0],
        sde: [revenue > 0 ? (accessor.getSDE() / revenue) * 100 : 0],
        ebitda: [revenue > 0 ? (accessor.getEBITDA() / revenue) * 100 : 0],
      },
    };
  }

  return {
    labels,
    margins: {
      gross: grossMargins,
      sde: sdeMargins,
      ebitda: ebitdaMargins,
    },
  };
}
