/**
 * KPI Explanations Library
 * Static educational content for all 13 Key Performance Indicators
 * Used in PDF generation for detailed KPI pages
 */

export interface KPIExplanation {
  id: string;
  name: string;
  category: 'profitability' | 'liquidity' | 'efficiency' | 'leverage' | 'growth';
  whatItMeans: string;
  whyItMatters: string;
  example: string;
  benchmarkSource: string;
  higherIsBetter: boolean;
  format: 'percentage' | 'ratio' | 'days' | 'times';
  industryBenchmark?: {
    low: number;
    median: number;
    high: number;
  };
}

export const KPI_EXPLANATIONS: Record<string, KPIExplanation> = {
  revenue_growth_rate: {
    id: 'revenue_growth_rate',
    name: 'Revenue Growth Rate',
    category: 'growth',
    whatItMeans: 'Revenue Growth Rate measures the year-over-year percentage change in a company\'s total revenue. It indicates whether a business is expanding, maintaining, or declining in terms of sales volume. This metric captures the fundamental trajectory of the business by comparing current period revenue against prior period revenue.',
    whyItMatters: 'Revenue growth is one of the most critical indicators of business health and is a key driver of business valuation. Consistent revenue growth demonstrates market demand for the company\'s products or services, effective sales strategies, and successful customer acquisition. Buyers and investors often pay premium multiples for companies with strong, consistent growth trajectories. Conversely, declining revenue may signal market challenges, competitive pressures, or operational issues that negatively impact valuation.',
    example: 'If a company generated $2.5 million in revenue in 2023 and $2.8 million in 2024, the revenue growth rate would be calculated as: ($2.8M - $2.5M) / $2.5M = 12%. This indicates healthy growth that would be viewed favorably by potential buyers. A growth rate below industry average might indicate market share loss, while rates significantly above average could suggest unsustainable growth that may normalize.',
    benchmarkSource: 'Industry transaction data and economic indicators',
    higherIsBetter: true,
    format: 'percentage',
    industryBenchmark: { low: 0.02, median: 0.05, high: 0.15 }
  },

  gross_profit_margin: {
    id: 'gross_profit_margin',
    name: 'Gross Profit Margin',
    category: 'profitability',
    whatItMeans: 'Gross Profit Margin measures the percentage of revenue that remains after deducting the direct costs of goods sold (COGS). It represents the company\'s efficiency in converting raw materials and direct labor into revenue, before accounting for operating expenses, taxes, and interest. This metric reveals the fundamental profitability of the core business operations.',
    whyItMatters: 'Gross margin is a critical indicator of pricing power and production efficiency. A high gross margin suggests the company can command premium prices, has effective supplier negotiations, or operates with lean production costs. This metric directly impacts available funds for operating expenses, growth investments, and owner distributions. Companies with higher gross margins are generally more resilient during economic downturns and command higher valuation multiples.',
    example: 'A manufacturing company with $3 million in revenue and $1.8 million in COGS has a gross profit of $1.2 million, resulting in a 40% gross margin. If the industry median is 35%, this company demonstrates superior operational efficiency or pricing power. Each percentage point improvement in gross margin on $3M revenue represents $30,000 in additional gross profit.',
    benchmarkSource: 'RMA Annual Statement Studies and industry transaction data',
    higherIsBetter: true,
    format: 'percentage',
    industryBenchmark: { low: 0.25, median: 0.35, high: 0.50 }
  },

  operating_profit_margin: {
    id: 'operating_profit_margin',
    name: 'Operating Profit Margin',
    category: 'profitability',
    whatItMeans: 'Operating Profit Margin (also known as Operating Margin or EBIT Margin) measures the percentage of revenue remaining after deducting both cost of goods sold and all operating expenses. It excludes interest expense and income taxes, focusing purely on the profitability of business operations. This metric shows how efficiently management controls costs across the entire operation.',
    whyItMatters: 'Operating margin reflects management\'s ability to control overhead costs while maintaining revenue. It accounts for administrative expenses, marketing, rent, utilities, and other indirect costs that don\'t scale linearly with sales. A strong operating margin indicates efficient operations and provides more flexibility for debt service, reinvestment, and distributions. Buyers use this metric to assess the sustainability of earnings and potential for improvement under new ownership.',
    example: 'A professional services firm with $1.5 million in revenue, $600,000 in direct costs, and $500,000 in operating expenses would have an operating profit of $400,000 and an operating margin of 26.7%. If competitors average 20%, this firm demonstrates superior cost control. The $100,000 advantage translates to higher owner earnings and a potentially higher valuation.',
    benchmarkSource: 'RMA Annual Statement Studies and industry financial benchmarks',
    higherIsBetter: true,
    format: 'percentage',
    industryBenchmark: { low: 0.05, median: 0.10, high: 0.20 }
  },

  net_profit_margin: {
    id: 'net_profit_margin',
    name: 'Net Profit Margin',
    category: 'profitability',
    whatItMeans: 'Net Profit Margin represents the percentage of revenue that remains as profit after all expenses, including operating costs, interest, and taxes, have been deducted. It is the ultimate measure of bottom-line profitability, showing what percentage of each revenue dollar the company retains as profit. This metric captures the cumulative effect of all business decisions on profitability.',
    whyItMatters: 'Net profit margin is the most comprehensive profitability measure, incorporating all costs and financial decisions. It affects the company\'s ability to reinvest, pay dividends, and build reserves for future challenges. A strong net margin indicates not only operational efficiency but also prudent financial management. Buyers analyze this metric to understand the true earning power of the business and its capacity to service acquisition debt.',
    example: 'A retail business generating $4 million in revenue with $200,000 in net income has a 5% net profit margin. While this may seem modest, it\'s important to compare against industry norms. If the retail industry median is 3%, this business is outperforming peers. For owner-operated businesses, net margin is often understated due to owner compensation included in expenses.',
    benchmarkSource: 'Industry financial databases and tax return analysis',
    higherIsBetter: true,
    format: 'percentage',
    industryBenchmark: { low: 0.02, median: 0.05, high: 0.12 }
  },

  return_on_assets: {
    id: 'return_on_assets',
    name: 'Return on Assets (ROA)',
    category: 'profitability',
    whatItMeans: 'Return on Assets measures how efficiently a company uses its total assets to generate profit. It is calculated by dividing net income by total assets, showing the percentage return generated from the company\'s investment in assets. ROA indicates how well management utilizes both current and fixed assets to produce earnings.',
    whyItMatters: 'ROA is crucial for understanding capital efficiency and comparing performance across companies with different capital structures. A high ROA suggests the business generates strong profits without requiring excessive asset investment. This metric is particularly important for asset-intensive businesses where significant capital is tied up in equipment, inventory, or facilities. Buyers use ROA to assess whether asset utilization could be improved post-acquisition.',
    example: 'A distribution company with $500,000 in net income and $2.5 million in total assets has a 20% ROA. This means every dollar invested in assets generates 20 cents in profit annually. If industry peers average 12% ROA, this company demonstrates superior asset utilization. The excess return suggests efficient inventory management, productive equipment, or optimized facilities.',
    benchmarkSource: 'Industry financial benchmarks and company comparisons',
    higherIsBetter: true,
    format: 'percentage',
    industryBenchmark: { low: 0.05, median: 0.10, high: 0.20 }
  },

  return_on_equity: {
    id: 'return_on_equity',
    name: 'Return on Equity (ROE)',
    category: 'profitability',
    whatItMeans: 'Return on Equity measures the profit generated relative to shareholders\' equity (the owner\'s investment in the business). It is calculated by dividing net income by total equity, showing the return owners receive on their invested capital. ROE reflects both operational performance and financial leverage decisions.',
    whyItMatters: 'ROE is the ultimate measure of owner returns and is directly relevant to business valuation. A high ROE indicates the business generates substantial returns on the owner\'s investment, making it attractive to buyers. However, ROE can be artificially high when equity is low or negative due to accumulated losses or excessive distributions. Sustainable high ROE typically commands premium valuations.',
    example: 'A consulting firm with $300,000 in net income and $1 million in equity has a 30% ROE. This means the owner earns a 30% annual return on invested capital, far exceeding typical market returns. If the industry median is 18%, this firm is exceptionally profitable. However, if equity is low due to prior distributions, the ROE may overstate true capital efficiency.',
    benchmarkSource: 'Financial benchmark databases and industry analysis',
    higherIsBetter: true,
    format: 'percentage',
    industryBenchmark: { low: 0.10, median: 0.18, high: 0.30 }
  },

  current_ratio: {
    id: 'current_ratio',
    name: 'Current Ratio',
    category: 'liquidity',
    whatItMeans: 'Current Ratio measures a company\'s ability to pay short-term obligations using its short-term assets. It is calculated by dividing current assets (cash, receivables, inventory) by current liabilities (payables, short-term debt, accrued expenses). A ratio above 1.0 indicates more current assets than current liabilities.',
    whyItMatters: 'Current ratio is a fundamental measure of short-term financial health and liquidity risk. Lenders and buyers use this metric to assess whether the business can meet its near-term obligations. A ratio below 1.0 may indicate liquidity stress and potential cash flow problems. However, an excessively high ratio might suggest inefficient use of working capital. The ideal ratio varies by industry based on typical payment cycles and inventory requirements.',
    example: 'A wholesale business with $800,000 in current assets and $400,000 in current liabilities has a current ratio of 2.0. This indicates $2 of current assets for every $1 of current liabilities, suggesting comfortable liquidity. If the business suddenly lost a major customer or faced unexpected expenses, it has a cushion to absorb the impact without defaulting on obligations.',
    benchmarkSource: 'RMA Annual Statement Studies by industry',
    higherIsBetter: true,
    format: 'ratio',
    industryBenchmark: { low: 1.0, median: 1.5, high: 2.5 }
  },

  quick_ratio: {
    id: 'quick_ratio',
    name: 'Quick Ratio',
    category: 'liquidity',
    whatItMeans: 'Quick Ratio (also called Acid-Test Ratio) measures a company\'s ability to meet short-term obligations using only its most liquid assets. It is calculated by dividing quick assets (cash, marketable securities, and receivables) by current liabilities, excluding inventory. This provides a more conservative view of liquidity than the current ratio.',
    whyItMatters: 'Quick ratio reveals whether a company can meet its obligations without relying on selling inventory. This is critical because inventory can be slow to convert to cash and may sell at discounted prices in distress situations. A quick ratio below 1.0 suggests the business depends on inventory turnover or external financing for short-term obligations. This metric is especially important for businesses with slow-moving or specialized inventory.',
    example: 'A retailer with $500,000 in current assets, $200,000 in inventory, and $250,000 in current liabilities has a quick ratio of 1.2 (($500K - $200K) / $250K). This indicates the business can cover current obligations without selling any inventory. If a supply chain disruption prevented inventory replenishment, the business could still meet its financial commitments.',
    benchmarkSource: 'Industry liquidity benchmarks and RMA studies',
    higherIsBetter: true,
    format: 'ratio',
    industryBenchmark: { low: 0.5, median: 1.0, high: 1.5 }
  },

  debt_to_equity: {
    id: 'debt_to_equity',
    name: 'Debt-to-Equity Ratio',
    category: 'leverage',
    whatItMeans: 'Debt-to-Equity Ratio measures the proportion of company financing that comes from creditors versus owners. It is calculated by dividing total liabilities by total shareholders\' equity. A ratio of 1.0 means equal funding from debt and equity; higher ratios indicate greater reliance on borrowed funds.',
    whyItMatters: 'This ratio is crucial for understanding financial risk and capital structure. Higher debt levels increase fixed obligations and financial risk, especially during economic downturns. However, moderate debt can enhance returns on equity through financial leverage. Buyers assess this ratio to understand existing obligations and the company\'s capacity for acquisition debt. Excessively leveraged businesses may face covenant violations or refinancing challenges.',
    example: 'A company with $600,000 in total liabilities and $400,000 in equity has a debt-to-equity ratio of 1.5. This means creditors have provided 60% of the capital structure. If industry norms are 0.8, this business is more leveraged than peers, which could be concerning if profits decline. A buyer might need to pay down debt or negotiate with lenders as part of acquisition.',
    benchmarkSource: 'Industry financial structure analysis and lender guidelines',
    higherIsBetter: false,
    format: 'ratio',
    industryBenchmark: { low: 0.3, median: 0.8, high: 1.5 }
  },

  asset_turnover: {
    id: 'asset_turnover',
    name: 'Asset Turnover',
    category: 'efficiency',
    whatItMeans: 'Asset Turnover measures how efficiently a company uses its assets to generate revenue. It is calculated by dividing total revenue by total assets, showing how many dollars of revenue are generated per dollar of assets. Higher turnover indicates more efficient asset utilization.',
    whyItMatters: 'Asset turnover reveals operational efficiency and capital intensity. Companies with high turnover generate significant revenue from relatively modest asset investments, often indicating lean operations. Low turnover may suggest underutilized assets, excessive inventory, or capital-intensive business models. When combined with profit margin analysis, asset turnover helps explain return on assets and identifies improvement opportunities.',
    example: 'A logistics company with $5 million in revenue and $2 million in assets has an asset turnover of 2.5x. Each dollar of assets generates $2.50 in annual revenue. If competitors average 2.0x, this company operates more efficiently. A buyer might value this efficiency highly, as it suggests the business can grow without proportional asset investment.',
    benchmarkSource: 'Industry efficiency benchmarks and operational analysis',
    higherIsBetter: true,
    format: 'times',
    industryBenchmark: { low: 1.0, median: 2.0, high: 3.5 }
  },

  inventory_turnover: {
    id: 'inventory_turnover',
    name: 'Inventory Turnover',
    category: 'efficiency',
    whatItMeans: 'Inventory Turnover measures how many times a company sells and replaces its inventory during a period. It is calculated by dividing cost of goods sold by average inventory. Higher turnover indicates faster-moving inventory and more efficient inventory management.',
    whyItMatters: 'Inventory turnover directly impacts cash flow and working capital requirements. High turnover means less capital is tied up in inventory, reducing carrying costs, obsolescence risk, and storage expenses. Low turnover may indicate overstocking, slow-moving products, or declining demand. For many businesses, improving inventory turnover is a key value enhancement strategy that buyers can implement post-acquisition.',
    example: 'A parts distributor with $2.4 million in COGS and $300,000 average inventory has an inventory turnover of 8.0x, meaning inventory is sold and replaced 8 times per year (every 46 days). If industry median is 6.0x, this company manages inventory more efficiently, freeing up capital for other uses. The 2-turn improvement could represent $100,000 less working capital required.',
    benchmarkSource: 'Industry inventory metrics and supply chain benchmarks',
    higherIsBetter: true,
    format: 'times',
    industryBenchmark: { low: 4.0, median: 6.0, high: 10.0 }
  },

  receivables_turnover: {
    id: 'receivables_turnover',
    name: 'Receivables Turnover',
    category: 'efficiency',
    whatItMeans: 'Receivables Turnover (often expressed as Days Sales Outstanding or DSO) measures how quickly a company collects payment from customers. It is calculated by dividing revenue by average accounts receivable. Higher turnover (lower days) indicates faster collection and more efficient credit management.',
    whyItMatters: 'Receivables management directly impacts cash flow and working capital. Slow collections tie up cash that could fund operations or growth. High receivables relative to revenue may indicate collection problems, customer concentration risk, or overly lenient credit policies. Buyers examine this metric to identify potential cash flow improvements and assess customer payment reliability.',
    example: 'A B2B services company with $3 million in revenue and $250,000 in receivables has a receivables turnover of 12x, equivalent to 30 days sales outstanding. If credit terms are Net 30 and industry averages 45 days, this company collects efficiently. Reducing DSO from 45 to 30 days on $3M revenue would free up approximately $125,000 in working capital.',
    benchmarkSource: 'Industry payment terms and collection benchmarks',
    higherIsBetter: true,
    format: 'times',
    industryBenchmark: { low: 6.0, median: 10.0, high: 15.0 }
  },

  sde_to_revenue: {
    id: 'sde_to_revenue',
    name: 'SDE/Revenue Ratio',
    category: 'profitability',
    whatItMeans: 'SDE/Revenue Ratio (also called SDE Margin) measures Seller\'s Discretionary Earnings as a percentage of total revenue. SDE represents the total financial benefit available to a single owner-operator, including net income plus owner compensation, interest, depreciation, and other add-backs. This ratio shows what percentage of revenue converts to owner benefit.',
    whyItMatters: 'SDE margin is the most important profitability metric for small business valuation because it represents the true economic benefit available to a buyer. A higher SDE margin indicates more cash flow per dollar of revenue, supporting higher valuations. This metric normalizes profitability across businesses with different owner compensation levels. Buyers apply industry-appropriate SDE multiples to this figure to determine business value.',
    example: 'A contractor generating $2 million in revenue with $400,000 in SDE has an SDE margin of 20%. If the industry median is 15%, this business converts a larger share of revenue to owner benefit. Assuming a 2.5x SDE multiple, the valuation would be $1 million. The above-average margin might justify a premium multiple due to demonstrated efficiency.',
    benchmarkSource: 'Industry transaction databases and SDE analysis',
    higherIsBetter: true,
    format: 'percentage',
    industryBenchmark: { low: 0.10, median: 0.18, high: 0.28 }
  }
};

/**
 * Get KPI explanation by ID
 */
export function getKPIExplanation(kpiId: string): KPIExplanation | undefined {
  return KPI_EXPLANATIONS[kpiId];
}

/**
 * Get all KPIs by category
 */
export function getKPIsByCategory(category: KPIExplanation['category']): KPIExplanation[] {
  return Object.values(KPI_EXPLANATIONS).filter(kpi => kpi.category === category);
}

/**
 * Get all profitability KPIs
 */
export function getProfitabilityKPIs(): KPIExplanation[] {
  return getKPIsByCategory('profitability');
}

/**
 * Get all liquidity KPIs
 */
export function getLiquidityKPIs(): KPIExplanation[] {
  return getKPIsByCategory('liquidity');
}

/**
 * Get all efficiency KPIs
 */
export function getEfficiencyKPIs(): KPIExplanation[] {
  return getKPIsByCategory('efficiency');
}

/**
 * Get all leverage KPIs
 */
export function getLeverageKPIs(): KPIExplanation[] {
  return getKPIsByCategory('leverage');
}

/**
 * Get all growth KPIs
 */
export function getGrowthKPIs(): KPIExplanation[] {
  return getKPIsByCategory('growth');
}

/**
 * Get ordered list of all KPIs for PDF generation
 */
export function getAllKPIsOrdered(): KPIExplanation[] {
  const order = [
    // Growth
    'revenue_growth_rate',
    // Profitability
    'gross_profit_margin',
    'operating_profit_margin',
    'net_profit_margin',
    'sde_to_revenue',
    'return_on_assets',
    'return_on_equity',
    // Liquidity
    'current_ratio',
    'quick_ratio',
    // Leverage
    'debt_to_equity',
    // Efficiency
    'asset_turnover',
    'inventory_turnover',
    'receivables_turnover',
  ];

  return order.map(id => KPI_EXPLANATIONS[id]).filter(Boolean);
}
