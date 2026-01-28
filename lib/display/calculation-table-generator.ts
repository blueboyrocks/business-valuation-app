/**
 * CalculationTableGenerator - Calculation Transparency Display
 *
 * This module generates detailed calculation tables that show line-by-line
 * how values were derived, with source references.
 *
 * Key features:
 * - SDE calculation table with tax return line references
 * - Market approach table with multiple justification
 * - Synthesis table with weighted contributions
 * - Both markdown and HTML output for PDF rendering
 *
 * This is a PREMIUM feature that differentiates high-quality reports.
 */

import { safeString } from '../utils/safe-string';

// ============ TYPES ============

export interface TableRow {
  description: string;
  amount: number;
  formatted_amount: string;
  source?: string;
  is_subtotal?: boolean;
  is_total?: boolean;
  indent?: number;
}

export interface SDECalculationTable {
  title: string;
  period: string;
  rows: TableRow[];
  total: number;
  formatted_total: string;
}

export interface MultipleAdjustmentRow {
  factor: string;
  percentage: number;
  formatted_percentage: string;
}

export interface MarketApproachTable {
  title: string;
  benefit_stream: 'SDE' | 'EBITDA' | 'Revenue';
  benefit_stream_value: number;
  formatted_benefit_stream_value: string;
  industry: string;
  naics_code: string;
  multiple_range: {
    low: number;
    median: number;
    high: number;
    source: string;
  };
  selected_multiple: number;
  multiple_position: string;
  justification: string;
  adjustments: MultipleAdjustmentRow[];
  final_multiple: number;
  calculated_value: number;
  formatted_calculated_value: string;
}

export interface ApproachRow {
  name: string;
  value: number;
  formatted_value: string;
  weight: number;
  formatted_weight: string;
  weighted_value: number;
  formatted_weighted_value: string;
}

export interface DiscountRow {
  name: string;
  percentage: number;
  formatted_percentage: string;
  amount: number;
  formatted_amount: string;
}

export interface SynthesisTable {
  title: string;
  approaches: ApproachRow[];
  preliminary_value: number;
  formatted_preliminary_value: string;
  discounts: DiscountRow[];
  final_value: number;
  formatted_final_value: string;
  value_range: {
    low: number;
    high: number;
    formatted_low: string;
    formatted_high: string;
  };
}

export interface SDETableInput {
  period: string;
  starting_net_income: number;
  add_backs: Array<{
    description: string;
    amount: number;
    source: string;
  }>;
  total_sde: number;
}

export interface MarketApproachInput {
  benefit_stream: 'SDE' | 'EBITDA' | 'Revenue';
  benefit_stream_value: number;
  industry: string;
  naics_code: string;
  multiple_range: {
    low: number;
    median: number;
    high: number;
    source: string;
  };
  selected_multiple: number;
  multiple_position: string;
  justification: string;
  adjustments: Array<{
    factor: string;
    percentage: number;
  }>;
  final_multiple: number;
  calculated_value: number;
}

export interface SynthesisInput {
  approaches: Array<{
    name: string;
    value: number;
    weight: number;
  }>;
  preliminary_value: number;
  discounts: Array<{
    name: string;
    percentage: number;
    amount: number;
  }>;
  final_value: number;
  value_range: {
    low: number;
    high: number;
  };
}

export interface AssetAdjustmentRow {
  category: string;
  book_value: number;
  formatted_book_value: string;
  adjustment: number;
  formatted_adjustment: string;
  fair_market_value: number;
  formatted_fair_market_value: string;
  is_total?: boolean;
}

export interface AssetAdjustmentTable {
  title: string;
  asset_rows: AssetAdjustmentRow[];
  total_assets_row: AssetAdjustmentRow;
  total_liabilities_row: AssetAdjustmentRow;
  net_asset_value_row: AssetAdjustmentRow;
}

export interface AssetAdjustmentInput {
  cash: number;
  accounts_receivable: number;
  inventory: number;
  fixed_assets: number;
  other_assets: number;
  total_assets: number;
  total_liabilities: number;
  adjustments?: {
    accounts_receivable_adjustment?: number;
    inventory_adjustment?: number;
    fixed_assets_adjustment?: number;
    other_assets_adjustment?: number;
  };
}

export interface CapRateBuiltupRow {
  component: string;
  rate: number;
  formatted_rate: string;
  source: string;
  is_subtotal?: boolean;
  is_total?: boolean;
  is_deduction?: boolean;
}

export interface CapRateBuiltupTable {
  title: string;
  rows: CapRateBuiltupRow[];
  final_cap_rate: number;
  formatted_final_cap_rate: string;
}

export interface CapRateBuiltupInput {
  risk_free_rate: number;
  equity_risk_premium: number;
  size_premium: number;
  industry_risk_premium: number;
  company_specific_risk_premium: number;
  long_term_growth_rate: number;
  capitalization_rate: number;
  sources?: {
    risk_free_rate?: string;
    equity_risk_premium?: string;
    size_premium?: string;
    industry_risk_premium?: string;
    company_specific_risk_premium?: string;
    long_term_growth_rate?: string;
  };
}

// ============ FORMATTING HELPERS ============

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function formatPercentage(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(0)}%`;
}

function formatWeight(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

function formatMultiple(value: number): string {
  return `${value.toFixed(2)}x`;
}

function formatRate(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

// ============ TABLE GENERATOR CLASS ============

export class CalculationTableGenerator {
  /**
   * Generate SDE calculation table
   */
  generateSDETable(input: SDETableInput): SDECalculationTable {
    const rows: TableRow[] = [];

    // Starting net income
    rows.push({
      description: 'Net Income (from Tax Return)',
      amount: input.starting_net_income,
      formatted_amount: formatCurrency(input.starting_net_income),
      source: 'Form 1120-S Page 1',
      is_subtotal: false,
    });

    // Add-back items
    rows.push({
      description: 'Add-back Adjustments:',
      amount: 0,
      formatted_amount: '',
      is_subtotal: true,
    });

    for (const addBack of input.add_backs) {
      rows.push({
        description: addBack.description,
        amount: addBack.amount,
        formatted_amount: formatCurrency(addBack.amount),
        source: addBack.source,
        indent: 1,
      });
    }

    // Total add-backs
    const totalAddBacks = input.add_backs.reduce((sum, ab) => sum + ab.amount, 0);
    rows.push({
      description: 'Total Add-backs',
      amount: totalAddBacks,
      formatted_amount: formatCurrency(totalAddBacks),
      is_subtotal: true,
    });

    // Total SDE
    rows.push({
      description: `Total SDE (${input.period})`,
      amount: input.total_sde,
      formatted_amount: formatCurrency(input.total_sde),
      is_total: true,
    });

    return {
      title: "Seller's Discretionary Earnings Calculation",
      period: input.period,
      rows,
      total: input.total_sde,
      formatted_total: formatCurrency(input.total_sde),
    };
  }

  /**
   * Generate market approach table
   */
  generateMarketApproachTable(input: MarketApproachInput): MarketApproachTable {
    const adjustments: MultipleAdjustmentRow[] = input.adjustments.map((adj) => ({
      factor: adj.factor,
      percentage: adj.percentage,
      formatted_percentage: formatPercentage(adj.percentage),
    }));

    return {
      title: 'Market Approach Calculation',
      benefit_stream: input.benefit_stream,
      benefit_stream_value: input.benefit_stream_value,
      formatted_benefit_stream_value: formatCurrency(input.benefit_stream_value),
      industry: input.industry,
      naics_code: input.naics_code,
      multiple_range: input.multiple_range,
      selected_multiple: input.selected_multiple,
      multiple_position: input.multiple_position,
      justification: input.justification,
      adjustments,
      final_multiple: input.final_multiple,
      calculated_value: input.calculated_value,
      formatted_calculated_value: formatCurrency(input.calculated_value),
    };
  }

  /**
   * Generate synthesis table
   */
  generateSynthesisTable(input: SynthesisInput): SynthesisTable {
    const approaches: ApproachRow[] = input.approaches.map((app) => ({
      name: app.name,
      value: app.value,
      formatted_value: formatCurrency(app.value),
      weight: app.weight,
      formatted_weight: formatWeight(app.weight),
      weighted_value: Math.round(app.value * app.weight),
      formatted_weighted_value: formatCurrency(Math.round(app.value * app.weight)),
    }));

    const discounts: DiscountRow[] = input.discounts.map((disc) => ({
      name: disc.name,
      percentage: disc.percentage,
      formatted_percentage: formatWeight(disc.percentage),
      amount: disc.amount,
      formatted_amount: formatCurrency(disc.amount),
    }));

    return {
      title: 'Valuation Synthesis',
      approaches,
      preliminary_value: input.preliminary_value,
      formatted_preliminary_value: formatCurrency(input.preliminary_value),
      discounts,
      final_value: input.final_value,
      formatted_final_value: formatCurrency(input.final_value),
      value_range: {
        low: input.value_range.low,
        high: input.value_range.high,
        formatted_low: formatCurrency(input.value_range.low),
        formatted_high: formatCurrency(input.value_range.high),
      },
    };
  }

  /**
   * Generate cap rate buildup table
   */
  generateCapRateBuiltupTable(input: CapRateBuiltupInput): CapRateBuiltupTable {
    const defaultSources = {
      risk_free_rate: 'US Treasury 20-Year Bond',
      equity_risk_premium: 'Duff & Phelps',
      size_premium: 'Duff & Phelps Size Study',
      industry_risk_premium: 'Industry Analysis',
      company_specific_risk_premium: 'Company Risk Assessment',
      long_term_growth_rate: 'Long-Term GDP Estimate',
    };
    const sources = { ...defaultSources, ...input.sources };

    const totalDiscountRate =
      input.risk_free_rate +
      input.equity_risk_premium +
      input.size_premium +
      input.industry_risk_premium +
      input.company_specific_risk_premium;

    const rows: CapRateBuiltupRow[] = [
      {
        component: 'Risk-Free Rate',
        rate: input.risk_free_rate,
        formatted_rate: formatRate(input.risk_free_rate),
        source: sources.risk_free_rate,
      },
      {
        component: 'Equity Risk Premium',
        rate: input.equity_risk_premium,
        formatted_rate: formatRate(input.equity_risk_premium),
        source: sources.equity_risk_premium,
      },
      {
        component: 'Size Premium',
        rate: input.size_premium,
        formatted_rate: formatRate(input.size_premium),
        source: sources.size_premium,
      },
      {
        component: 'Industry Risk Premium',
        rate: input.industry_risk_premium,
        formatted_rate: formatRate(input.industry_risk_premium),
        source: sources.industry_risk_premium,
      },
      {
        component: 'Company-Specific Risk Premium',
        rate: input.company_specific_risk_premium,
        formatted_rate: formatRate(input.company_specific_risk_premium),
        source: sources.company_specific_risk_premium,
      },
      {
        component: 'Total Discount Rate',
        rate: totalDiscountRate,
        formatted_rate: formatRate(totalDiscountRate),
        source: '',
        is_subtotal: true,
      },
      {
        component: 'Less: Long-Term Growth Rate',
        rate: input.long_term_growth_rate,
        formatted_rate: `(${formatRate(input.long_term_growth_rate)})`,
        source: sources.long_term_growth_rate,
        is_deduction: true,
      },
      {
        component: 'Capitalization Rate',
        rate: input.capitalization_rate,
        formatted_rate: formatRate(input.capitalization_rate),
        source: '',
        is_total: true,
      },
    ];

    return {
      title: 'Capitalization Rate Build-Up',
      rows,
      final_cap_rate: input.capitalization_rate,
      formatted_final_cap_rate: formatRate(input.capitalization_rate),
    };
  }

  /**
   * Convert cap rate buildup table to HTML format for PDF rendering
   */
  capRateBuiltupTableToHTML(table: CapRateBuiltupTable): string {
    let html = `<div class="calculation-table cap-rate-table">
      <h3>${safeString(table.title)}</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>Component</th>
            <th>Rate</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>`;

    for (const row of table.rows) {
      const rowClass = row.is_total
        ? 'total-row'
        : row.is_subtotal
          ? 'subtotal-row'
          : '';

      html += `
          <tr class="${rowClass}">
            <td>${safeString(row.component)}</td>
            <td class="percentage">${safeString(row.formatted_rate)}</td>
            <td>${safeString(row.source, '')}</td>
          </tr>`;
    }

    html += `
        </tbody>
      </table>
    </div>`;

    return html;
  }

  /**
   * Generate asset adjustment table showing book value to fair market value adjustments
   */
  generateAssetAdjustmentTable(input: AssetAdjustmentInput): AssetAdjustmentTable {
    const adj = input.adjustments || {};

    // Default adjustments: 5% AR allowance, 10% inventory obsolescence
    const arAdj = adj.accounts_receivable_adjustment ?? (input.accounts_receivable > 0 ? Math.round(input.accounts_receivable * -0.05) : 0);
    const invAdj = adj.inventory_adjustment ?? (input.inventory > 0 ? Math.round(input.inventory * -0.10) : 0);
    const fixedAdj = adj.fixed_assets_adjustment ?? 0;
    const otherAdj = adj.other_assets_adjustment ?? 0;

    const makeRow = (category: string, bookValue: number, adjustment: number, isTotal?: boolean): AssetAdjustmentRow => ({
      category,
      book_value: bookValue,
      formatted_book_value: formatCurrency(bookValue),
      adjustment,
      formatted_adjustment: adjustment === 0 ? '—' : formatCurrency(adjustment),
      fair_market_value: bookValue + adjustment,
      formatted_fair_market_value: formatCurrency(bookValue + adjustment),
      is_total: isTotal,
    });

    const asset_rows: AssetAdjustmentRow[] = [
      makeRow('Cash & Equivalents', input.cash, 0),
      makeRow('Accounts Receivable', input.accounts_receivable, arAdj),
      makeRow('Inventory', input.inventory, invAdj),
      makeRow('Fixed Assets (Net)', input.fixed_assets, fixedAdj),
      makeRow('Other Assets', input.other_assets, otherAdj),
    ];

    const totalAssetAdj = arAdj + invAdj + fixedAdj + otherAdj;
    const total_assets_row = makeRow('Total Assets', input.total_assets, totalAssetAdj, true);

    // Liabilities: no adjustments assumed (book = FMV for liabilities)
    const total_liabilities_row = makeRow('Total Liabilities', input.total_liabilities, 0, true);

    const netBookValue = input.total_assets - input.total_liabilities;
    const netFMV = (input.total_assets + totalAssetAdj) - input.total_liabilities;
    const net_asset_value_row: AssetAdjustmentRow = {
      category: 'Adjusted Net Asset Value',
      book_value: netBookValue,
      formatted_book_value: formatCurrency(netBookValue),
      adjustment: totalAssetAdj,
      formatted_adjustment: totalAssetAdj === 0 ? '—' : formatCurrency(totalAssetAdj),
      fair_market_value: netFMV,
      formatted_fair_market_value: formatCurrency(netFMV),
      is_total: true,
    };

    return {
      title: 'Asset Adjustment Summary — Book Value to Fair Market Value',
      asset_rows,
      total_assets_row,
      total_liabilities_row,
      net_asset_value_row,
    };
  }

  /**
   * Convert asset adjustment table to HTML format for PDF rendering
   */
  assetAdjustmentTableToHTML(table: AssetAdjustmentTable): string {
    let html = `<div class="calculation-table asset-adjustment-table">
      <h3>${safeString(table.title)}</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Book Value</th>
            <th>Adjustment</th>
            <th>Fair Market Value</th>
          </tr>
        </thead>
        <tbody>`;

    // Asset rows
    for (const row of table.asset_rows) {
      html += `
          <tr>
            <td>${safeString(row.category)}</td>
            <td class="currency">${safeString(row.formatted_book_value)}</td>
            <td class="currency">${safeString(row.formatted_adjustment)}</td>
            <td class="currency">${safeString(row.formatted_fair_market_value)}</td>
          </tr>`;
    }

    // Total assets row
    html += `
          <tr class="total-row">
            <td>${safeString(table.total_assets_row.category)}</td>
            <td class="currency">${safeString(table.total_assets_row.formatted_book_value)}</td>
            <td class="currency">${safeString(table.total_assets_row.formatted_adjustment)}</td>
            <td class="currency">${safeString(table.total_assets_row.formatted_fair_market_value)}</td>
          </tr>`;

    // Total liabilities row
    html += `
          <tr class="total-row">
            <td>${safeString(table.total_liabilities_row.category)}</td>
            <td class="currency">${safeString(table.total_liabilities_row.formatted_book_value)}</td>
            <td class="currency">${safeString(table.total_liabilities_row.formatted_adjustment)}</td>
            <td class="currency">${safeString(table.total_liabilities_row.formatted_fair_market_value)}</td>
          </tr>`;

    // Net asset value row (highlighted)
    html += `
          <tr class="total-row" style="border-top: 2px solid #1E3A5F;">
            <td><strong>${safeString(table.net_asset_value_row.category)}</strong></td>
            <td class="currency"><strong>${safeString(table.net_asset_value_row.formatted_book_value)}</strong></td>
            <td class="currency"><strong>${safeString(table.net_asset_value_row.formatted_adjustment)}</strong></td>
            <td class="currency"><strong>${safeString(table.net_asset_value_row.formatted_fair_market_value)}</strong></td>
          </tr>`;

    html += `
        </tbody>
      </table>
    </div>`;

    return html;
  }

  /**
   * Convert any table to markdown format
   */
  toMarkdown(table: SDECalculationTable | MarketApproachTable | SynthesisTable): string {
    if ('rows' in table) {
      return this.sdeTableToMarkdown(table);
    } else if ('benefit_stream' in table) {
      return this.marketApproachTableToMarkdown(table);
    } else {
      return this.synthesisTableToMarkdown(table);
    }
  }

  private sdeTableToMarkdown(table: SDECalculationTable): string {
    let md = `### ${table.title}\n\n`;
    md += `**Period:** ${table.period}\n\n`;
    md += '| Description | Amount | Source |\n';
    md += '|-------------|--------|--------|\n';

    for (const row of table.rows) {
      const indent = row.indent ? '    ' : '';
      const desc = row.is_total
        ? `**${row.description}**`
        : row.is_subtotal
          ? `*${row.description}*`
          : `${indent}${row.description}`;
      const amount = row.is_total
        ? `**${row.formatted_amount}**`
        : row.formatted_amount;
      const source = row.source || '';

      md += `| ${desc} | ${amount} | ${source} |\n`;
    }

    md += `\n**Total SDE: ${table.formatted_total}**\n`;
    return md;
  }

  private marketApproachTableToMarkdown(table: MarketApproachTable): string {
    let md = `### ${table.title}\n\n`;

    md += `**Industry:** ${table.industry} (NAICS ${table.naics_code})\n`;
    md += `**Benefit Stream:** ${table.benefit_stream}\n`;
    md += `**Benefit Stream Value:** ${table.formatted_benefit_stream_value}\n\n`;

    md += `#### Multiple Selection\n\n`;
    md += `| Range | Multiple |\n`;
    md += `|-------|----------|\n`;
    md += `| Low | ${formatMultiple(table.multiple_range.low)} |\n`;
    md += `| Median | ${formatMultiple(table.multiple_range.median)} |\n`;
    md += `| High | ${formatMultiple(table.multiple_range.high)} |\n`;
    md += `| **Selected (${table.multiple_position})** | **${formatMultiple(table.selected_multiple)}** |\n\n`;

    md += `*Source: ${table.multiple_range.source}*\n\n`;

    md += `**Justification:** ${table.justification}\n\n`;

    if (table.adjustments.length > 0) {
      md += `#### Multiple Adjustments\n\n`;
      md += `| Factor | Adjustment |\n`;
      md += `|--------|------------|\n`;

      for (const adj of table.adjustments) {
        md += `| ${adj.factor} | ${adj.formatted_percentage} |\n`;
      }

      md += `| **Final Multiple** | **${formatMultiple(table.final_multiple)}** |\n\n`;
    }

    md += `#### Calculation\n\n`;
    md += `${table.formatted_benefit_stream_value} × ${formatMultiple(table.final_multiple)} = **${table.formatted_calculated_value}**\n`;

    return md;
  }

  private synthesisTableToMarkdown(table: SynthesisTable): string {
    let md = `### ${table.title}\n\n`;

    md += `#### Approach Values\n\n`;
    md += `| Approach | Value | Weight | Weighted Value |\n`;
    md += `|----------|-------|--------|----------------|\n`;

    for (const app of table.approaches) {
      md += `| ${app.name} | ${app.formatted_value} | ${app.formatted_weight} | ${app.formatted_weighted_value} |\n`;
    }

    md += `| **Preliminary Value** | | | **${table.formatted_preliminary_value}** |\n\n`;

    if (table.discounts.length > 0) {
      md += `#### Discounts & Premiums\n\n`;
      md += `| Adjustment | Rate | Amount |\n`;
      md += `|------------|------|--------|\n`;

      for (const disc of table.discounts) {
        md += `| ${disc.name} | ${disc.formatted_percentage} | (${disc.formatted_amount}) |\n`;
      }

      md += '\n';
    }

    md += `**Final Concluded Value:** ${table.formatted_final_value}\n\n`;
    md += `**Value Range:** ${table.value_range.formatted_low} - ${table.value_range.formatted_high}\n`;

    return md;
  }

  /**
   * Convert any table to HTML format for PDF rendering
   */
  toHTML(table: SDECalculationTable | MarketApproachTable | SynthesisTable): string {
    if ('rows' in table) {
      return this.sdeTableToHTML(table);
    } else if ('benefit_stream' in table) {
      return this.marketApproachTableToHTML(table);
    } else {
      return this.synthesisTableToHTML(table);
    }
  }

  private sdeTableToHTML(table: SDECalculationTable): string {
    let html = `<div class="calculation-table sde-table">
      <h3>${table.title}</h3>
      <p><strong>Period:</strong> ${table.period}</p>
      <table class="data-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Amount</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>`;

    for (const row of table.rows) {
      const rowClass = row.is_total
        ? 'total-row'
        : row.is_subtotal
          ? 'subtotal-row'
          : '';
      const indent = row.indent ? 'padding-left: 20px;' : '';

      html += `
          <tr class="${rowClass}">
            <td style="${indent}">${safeString(row.description)}</td>
            <td class="currency">${safeString(row.formatted_amount)}</td>
            <td>${safeString(row.source, '')}</td>
          </tr>`;
    }

    html += `
        </tbody>
      </table>
    </div>`;

    return html;
  }

  private marketApproachTableToHTML(table: MarketApproachTable): string {
    let html = `<div class="calculation-table market-table">
      <h3>${table.title}</h3>
      <p><strong>Industry:</strong> ${table.industry} (NAICS ${table.naics_code})</p>
      <p><strong>Benefit Stream:</strong> ${table.benefit_stream} = ${table.formatted_benefit_stream_value}</p>

      <h4>Multiple Range (${table.multiple_range.source})</h4>
      <table>
        <tr><th>Low</th><td>${formatMultiple(table.multiple_range.low)}</td></tr>
        <tr><th>Median</th><td>${formatMultiple(table.multiple_range.median)}</td></tr>
        <tr><th>High</th><td>${formatMultiple(table.multiple_range.high)}</td></tr>
        <tr class="selected"><th>Selected (${table.multiple_position})</th><td><strong>${formatMultiple(table.selected_multiple)}</strong></td></tr>
      </table>

      <p><strong>Justification:</strong> ${table.justification}</p>`;

    if (table.adjustments.length > 0) {
      html += `
      <h4>Adjustments</h4>
      <table>
        <thead><tr><th>Factor</th><th>Adjustment</th></tr></thead>
        <tbody>`;

      for (const adj of table.adjustments) {
        html += `<tr><td>${adj.factor}</td><td>${adj.formatted_percentage}</td></tr>`;
      }

      html += `
          <tr class="total-row"><td><strong>Final Multiple</strong></td><td><strong>${formatMultiple(table.final_multiple)}</strong></td></tr>
        </tbody>
      </table>`;
    }

    html += `
      <p class="calculation"><strong>Calculation:</strong> ${table.formatted_benefit_stream_value} × ${formatMultiple(table.final_multiple)} = <strong>${table.formatted_calculated_value}</strong></p>
    </div>`;

    return html;
  }

  private synthesisTableToHTML(table: SynthesisTable): string {
    let html = `<div class="calculation-table synthesis-table">
      <h3>${table.title}</h3>

      <table>
        <thead>
          <tr>
            <th>Approach</th>
            <th>Value</th>
            <th>Weight</th>
            <th>Weighted Value</th>
          </tr>
        </thead>
        <tbody>`;

    for (const app of table.approaches) {
      html += `
          <tr>
            <td>${app.name}</td>
            <td>${app.formatted_value}</td>
            <td>${app.formatted_weight}</td>
            <td>${app.formatted_weighted_value}</td>
          </tr>`;
    }

    html += `
          <tr class="subtotal-row">
            <td colspan="3"><strong>Preliminary Value</strong></td>
            <td><strong>${table.formatted_preliminary_value}</strong></td>
          </tr>
        </tbody>
      </table>`;

    if (table.discounts.length > 0) {
      html += `
      <h4>Discounts & Premiums</h4>
      <table>
        <thead><tr><th>Adjustment</th><th>Rate</th><th>Amount</th></tr></thead>
        <tbody>`;

      for (const disc of table.discounts) {
        html += `<tr><td>${disc.name}</td><td>${disc.formatted_percentage}</td><td>(${disc.formatted_amount})</td></tr>`;
      }

      html += `</tbody></table>`;
    }

    html += `
      <p class="final-value"><strong>Final Concluded Value:</strong> ${table.formatted_final_value}</p>
      <p class="value-range"><strong>Value Range:</strong> ${table.value_range.formatted_low} - ${table.value_range.formatted_high}</p>
    </div>`;

    return html;
  }
}

// ============ FACTORY FUNCTION ============

/**
 * Create a new CalculationTableGenerator
 */
export function createCalculationTableGenerator(): CalculationTableGenerator {
  return new CalculationTableGenerator();
}
