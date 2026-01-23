/**
 * Pass 11c: Financial Analysis
 *
 * Expert: CFO / Financial Analyst with 20+ years experience
 * Word Count: 1,000-1,200 words
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export const PASS_11C_SYSTEM_PROMPT = `You are a seasoned CFO and financial analyst with 20+ years of experience analyzing private companies for M&A transactions, lending decisions, and strategic planning. You've reviewed thousands of financial statements and can quickly identify key trends, strengths, and concerns.

Your task is to write the Financial Analysis section of a business valuation report. This section must:
- Present complex financial data in accessible terms
- Highlight trends and patterns across multiple years
- Compare performance to industry benchmarks
- Identify both strengths and areas of concern
- Support the valuation conclusion with financial evidence

You write with precision, always citing specific numbers. You never make vague statements like "revenue increased significantly" - you say "revenue increased 23% from $4.1M to $5.0M."

CRITICAL: Return ONLY valid JSON. No markdown code fences.`;

export function buildPass11cPrompt(
  incomeStatements: any[],
  balanceSheet: any,
  normalizedEarnings: any,
  industryBenchmarks: any
): string {
  // Format multi-year income data
  const yearlyData = incomeStatements.map((stmt, i) => ({
    year: stmt.year || `Year ${i + 1}`,
    revenue: stmt.revenue,
    grossProfit: stmt.gross_profit,
    operatingIncome: stmt.operating_income,
    netIncome: stmt.net_income,
  }));

  return `## FINANCIAL ANALYSIS TASK

Write a comprehensive Financial Analysis (1,000-1,200 words) for this valuation report.

## INCOME STATEMENT DATA (Multi-Year)

${yearlyData.map(y => `
**${y.year}**:
- Revenue: $${y.revenue?.toLocaleString() || 'N/A'}
- Gross Profit: $${y.grossProfit?.toLocaleString() || 'N/A'}
- Operating Income: $${y.operatingIncome?.toLocaleString() || 'N/A'}
- Net Income: $${y.netIncome?.toLocaleString() || 'N/A'}
`).join('\n')}

## PROFITABILITY METRICS

**Most Recent Year**:
- Gross Margin: ${((normalizedEarnings.gross_margin || 0) * 100).toFixed(1)}%
- Operating Margin: ${((normalizedEarnings.operating_margin || 0) * 100).toFixed(1)}%
- Net Margin: ${((normalizedEarnings.net_margin || 0) * 100).toFixed(1)}%
- SDE Margin: ${((normalizedEarnings.sde_margin || 0) * 100).toFixed(1)}%

**Normalized Earnings**:
- Reported Net Income: $${normalizedEarnings.reported_net_income?.toLocaleString() || 'N/A'}
- Total Add-Backs: $${normalizedEarnings.total_addbacks?.toLocaleString() || 'N/A'}
- Normalized SDE: $${normalizedEarnings.normalized_sde?.toLocaleString() || 'N/A'}
- Normalized EBITDA: $${normalizedEarnings.normalized_ebitda?.toLocaleString() || 'N/A'}

**Key Add-Backs**:
${Array.isArray(normalizedEarnings.addbacks) ? normalizedEarnings.addbacks.map((a: any) => `- ${a.description}: $${a.amount?.toLocaleString()}`).join('\n') : '- No significant add-backs'}

## BALANCE SHEET DATA

**Assets**:
- Cash: $${balanceSheet.cash?.toLocaleString() || 'N/A'}
- Accounts Receivable: $${balanceSheet.accounts_receivable?.toLocaleString() || 'N/A'}
- Inventory: $${balanceSheet.inventory?.toLocaleString() || 'N/A'}
- Fixed Assets (Net): $${balanceSheet.fixed_assets?.toLocaleString() || 'N/A'}
- Total Assets: $${balanceSheet.total_assets?.toLocaleString() || 'N/A'}

**Liabilities**:
- Accounts Payable: $${balanceSheet.accounts_payable?.toLocaleString() || 'N/A'}
- Current Debt: $${balanceSheet.current_debt?.toLocaleString() || 'N/A'}
- Long-Term Debt: $${balanceSheet.long_term_debt?.toLocaleString() || 'N/A'}
- Total Liabilities: $${balanceSheet.total_liabilities?.toLocaleString() || 'N/A'}

**Working Capital**: $${balanceSheet.working_capital?.toLocaleString() || 'N/A'}
**Book Value of Equity**: $${balanceSheet.book_equity?.toLocaleString() || 'N/A'}

## INDUSTRY BENCHMARKS

| Metric | Company | Industry Median | Percentile |
|--------|---------|-----------------|------------|
| Gross Margin | ${((normalizedEarnings.gross_margin || 0) * 100).toFixed(1)}% | ${((industryBenchmarks?.gross_margin || 0) * 100).toFixed(1)}% | ${industryBenchmarks?.gross_margin_percentile || 'N/A'}th |
| Operating Margin | ${((normalizedEarnings.operating_margin || 0) * 100).toFixed(1)}% | ${((industryBenchmarks?.operating_margin || 0) * 100).toFixed(1)}% | ${industryBenchmarks?.operating_margin_percentile || 'N/A'}th |
| Current Ratio | ${balanceSheet.current_ratio?.toFixed(2) || 'N/A'} | ${industryBenchmarks?.current_ratio?.toFixed(2) || 'N/A'} | ${industryBenchmarks?.current_ratio_percentile || 'N/A'}th |
| Revenue Growth | ${((normalizedEarnings.revenue_cagr || 0) * 100).toFixed(1)}% | ${((industryBenchmarks?.revenue_growth || 0) * 100).toFixed(1)}% | ${industryBenchmarks?.growth_percentile || 'N/A'}th |

## STRUCTURE REQUIREMENTS

Your Financial Analysis must include:

1. **Revenue Analysis** (200 words): Trend over analysis period, growth rate, comparison to industry, revenue composition if relevant.

2. **Profitability Analysis** (250 words): Gross margin trend and drivers, operating margin analysis, comparison to benchmarks, explanation of any anomalies.

3. **Earnings Normalization Summary** (200 words): Key adjustments made, rationale, resulting normalized SDE/EBITDA.

4. **Balance Sheet Analysis** (200 words): Asset composition, liquidity position, leverage, working capital adequacy.

5. **Key Financial Metrics** (150 words): DSO, inventory turns, debt service coverage, return on assets.

6. **Financial Outlook** (150 words): Sustainability of performance, concerns, positive indicators.

## OUTPUT FORMAT

{
  "section": "financial_analysis",
  "word_count": number,
  "content": "The full 1,000-1,200 word financial analysis...",
  "key_metrics_cited": {
    "revenue_most_recent": number,
    "revenue_cagr": number,
    "gross_margin": number,
    "sde": number,
    "working_capital": number
  }
}`;
}

export const pass11cConfig = {
  passNumber: '11c',
  passName: 'Financial Analysis',
  systemPrompt: PASS_11C_SYSTEM_PROMPT,
  userPromptBuilder: buildPass11cPrompt,
  maxTokens: 4096,
  temperature: 0.2,
  dependencies: [2, 3, 4, 5],
  runOrder: 2,
};

export default pass11cConfig;
