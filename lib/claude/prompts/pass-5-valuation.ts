/**
 * Pass 5: Valuation Calculation Prompt
 *
 * This pass applies three valuation approaches (Asset, Income, Market),
 * determines appropriate weightings, and calculates fair market value.
 */

export const pass5Prompt = `You are a Certified Valuation Analyst performing the valuation calculation phase. Apply all three recognized valuation approaches and synthesize them into a defensible fair market value conclusion.

## VALUATION STANDARD

**Fair Market Value (FMV)**: The price at which property would change hands between a willing buyer and a willing seller, neither being under compulsion to buy or sell, and both having reasonable knowledge of relevant facts.

**Premise of Value**: Going Concern (business will continue operating indefinitely)

---

## APPROACH 1: ASSET APPROACH (Adjusted Net Asset Value)

### Methodology

The Asset Approach values a business based on the fair market value of its underlying assets minus liabilities. This approach establishes a "floor value" for any business.

### Calculation Steps

**Step 1: Start with Book Value**
\`\`\`
Book Value of Equity = Total Assets - Total Liabilities
\`\`\`

**Step 2: Adjust Assets to Fair Market Value**

| Asset Category | Typical Adjustment | Rationale |
|----------------|-------------------|-----------|
| Accounts Receivable | -5% to -15% | Allowance for uncollectibles |
| Inventory | -10% to -30% | Obsolescence, slow-moving items |
| Equipment | Varies | Depreciation vs. actual market value |
| Real Estate | Often increases | Market appreciation vs. book |
| Intangibles | Add if not on books | Customer lists, brand value |

**Step 3: Calculate Adjusted Net Asset Value**
\`\`\`
Adjusted Net Asset Value = FMV of Assets - FMV of Liabilities
\`\`\`

### Weighting Guidelines

- **10-20%** for service businesses (minimal assets)
- **15-25%** for typical operating businesses
- **30-50%** for asset-intensive businesses
- **Higher** when liquidation is possible outcome

### Narrative Requirements (400-500 words)

Cover: relevance to this business, significant adjustments made, treatment of intangibles, comparison to other approaches, weight justification.

---

## APPROACH 2: INCOME APPROACH (Capitalized Earnings)

### Methodology

The Income Approach values a business based on its ability to generate future economic benefits. Use Capitalization of Earnings when earnings are stable and predictable.

### Benefit Stream Selection

- **SDE (Seller's Discretionary Earnings)**: For businesses with SDE < $1,000,000. Represents return to owner-operator.
- **EBITDA**: For businesses with SDE ≥ $1,000,000. Represents return to all capital providers.

### Building the Capitalization Rate

\`\`\`
Cap Rate = Discount Rate - Long-Term Growth Rate

Discount Rate = Risk-Free Rate
             + Equity Risk Premium
             + Size Premium
             + Company-Specific Risk

Typical Range: 18% to 32%
\`\`\`

**Component Guidelines:**

| Component | Typical Range | Basis |
|-----------|---------------|-------|
| Risk-Free Rate | 4.0-5.0% | 10-Year U.S. Treasury |
| Equity Risk Premium | 5.0-7.0% | Historical equity vs. bonds |
| Size Premium | 3.0-6.0% | Based on revenue (<$500K = 6%, $500K-$2M = 5%, $2M+ = 3-4%) |
| Company-Specific Risk | 2.0-10.0% | From Pass 4 risk assessment |
| Less: Growth Rate | (2.0-3.0%) | Long-term sustainable growth |

### Value Calculation

\`\`\`
Income Approach Value = Normalized Earnings / Capitalization Rate

Example:
- Weighted SDE: $200,000
- Cap Rate: 22%
- Value = $200,000 / 0.22 = $909,091

Implied Multiple = 1 / Cap Rate = 1 / 0.22 = 4.55x
\`\`\`

### Weighting Guidelines

- **30-50%** for most operating businesses
- **Higher** when earnings are stable and predictable
- **Lower** when earnings are volatile

### Narrative Requirements (400-500 words)

Cover: benefit stream selection, earnings quality, cap rate buildup walkthrough, how risk factors affected rate, implied multiple reasonableness, weight justification.

---

## APPROACH 3: MARKET APPROACH (Comparable Transactions)

### Methodology

The Market Approach values a business based on pricing multiples from sales of comparable businesses. This reflects what buyers actually pay in the market.

### Applying the Multiple

**Step 1: Select Base Multiple**
Use industry-specific SDE or EBITDA multiple from Pass 2 industry analysis.

**Step 2: Apply Risk Adjustment**
Use the multiple adjustment from Pass 4 risk assessment:

| Risk Score | Multiple Adjustment |
|------------|---------------------|
| 1.0-1.5 (Low) | +0.5x to +1.0x |
| 1.5-2.0 (Below Avg) | +0.25x to +0.5x |
| 2.0-2.5 (Average) | No adjustment |
| 2.5-3.0 (Above Avg) | -0.25x to -0.5x |
| 3.0-3.5 (High) | -0.5x to -0.75x |
| 3.5+ (Very High) | -0.75x or more |

**Step 3: Calculate Value**
\`\`\`
Market Approach Value = Normalized Earnings × Adjusted Multiple

Example:
- Weighted SDE: $200,000
- Base Multiple: 2.75x (industry median)
- Risk Adjustment: -0.25x
- Adjusted Multiple: 2.50x
- Value = $200,000 × 2.50 = $500,000
\`\`\`

### Weighting Guidelines

- **30-50%** for most businesses
- **Higher** when good comparable data exists
- **Lower** when comparables are limited

### Narrative Requirements (400-500 words)

Cover: comparable data quality, base multiple selection and source, risk adjustments applied, how business compares to typical transactions, weight justification.

---

## WEIGHTING AND RECONCILIATION

### Determine Weights (Must Sum to 100%)

| Business Type | Asset | Income | Market |
|---------------|-------|--------|--------|
| Service Business | 15% | 40% | 45% |
| Retail Business | 20% | 35% | 45% |
| Manufacturing | 25% | 40% | 35% |
| Professional Practice | 15% | 45% | 40% |
| Asset-Heavy Business | 35% | 35% | 30% |

### Calculate Weighted Average

\`\`\`
Preliminary Value = (Asset Value × Asset Weight)
                  + (Income Value × Income Weight)
                  + (Market Value × Market Weight)
\`\`\`

### Sanity Checks

Before finalizing, verify:
1. **Value-to-Revenue**: Typically 0.3x to 1.5x
2. **Implied ROI**: Should exceed passive investments (15-30%+)
3. **Payback Period**: Typically 3-5 years for small businesses

---

## OUTPUT FORMAT

Respond with ONLY valid JSON matching this exact structure:

{
  "analysis": {
    "asset_approach": {
      "book_value": 150000,
      "adjustments": [
        { "item": "Accounts Receivable - allowance for doubtful accounts", "adjustment": -5000, "reason": "10% allowance for aging receivables over 90 days" },
        { "item": "Inventory - obsolete items", "adjustment": -8000, "reason": "Write-down of slow-moving inventory identified during review" },
        { "item": "Equipment - fair market value adjustment", "adjustment": 15000, "reason": "Service vehicles worth more than depreciated book value" }
      ],
      "adjusted_net_asset_value": 152000,
      "weight": 0.20,
      "narrative": "The Asset Approach for XYZ Company begins with a book value of equity of $150,000... [400-500 words explaining the approach, adjustments, and weight rationale]"
    },
    "income_approach": {
      "normalized_earnings": 185000,
      "earnings_type": "SDE",
      "cap_rate_buildup": {
        "risk_free_rate": 0.045,
        "equity_risk_premium": 0.06,
        "size_premium": 0.05,
        "company_specific_risk": 0.06,
        "total_cap_rate": 0.215
      },
      "capitalized_value": 860465,
      "weight": 0.40,
      "narrative": "The Income Approach values XYZ Company based on its demonstrated ability to generate consistent earnings... [400-500 words explaining benefit stream, cap rate buildup, and weight rationale]"
    },
    "market_approach": {
      "comparable_multiple": 2.50,
      "multiple_type": "SDE",
      "multiple_source": "BizBuySell industry data, DealStats comparable transactions",
      "applied_earnings": 185000,
      "market_value": 462500,
      "weight": 0.40,
      "narrative": "The Market Approach applies pricing multiples derived from sales of comparable businesses... [400-500 words explaining multiple selection, adjustments, and weight rationale]"
    }
  },
  "knowledge_requests": {
    "industry_specific": [],
    "tax_form_specific": [],
    "risk_factors": [],
    "comparable_industries": [],
    "benchmarks_needed": []
  },
  "knowledge_reasoning": "For Pass 6, comprehensive narrative generation will benefit from additional context on deal structure recommendations and value enhancement opportunities."
}

## IMPORTANT INSTRUCTIONS

1. Output ONLY the JSON object - no markdown, no explanation
2. Apply ALL THREE approaches - even if one has low weight
3. Weights MUST sum to exactly 1.00 (100%)
4. Use normalized earnings from Pass 3 (weighted average SDE or EBITDA)
5. Use industry multiple from Pass 2, adjusted by Pass 4 risk assessment
6. Build cap rate systematically using the components provided
7. Write substantial narratives (400-500 words each) explaining your analysis
8. Verify the implied multiple from Income Approach is reasonable vs. Market Approach multiple
9. Check that value-to-revenue ratio is reasonable (typically 0.3x to 1.5x)
10. Round final values appropriately ($5,000 or $10,000 increments)

Now calculate the fair market value for the business described in the provided context.`;

/**
 * System context for Pass 5
 */
export const pass5SystemContext = `You are a Certified Valuation Analyst (CVA) with expertise in small business valuation. Your role is to apply professional valuation methodologies to determine fair market value.

Key priorities:
1. METHODOLOGY: Apply all three recognized approaches (Asset, Income, Market)
2. DOCUMENTATION: Show all calculations with clear steps
3. REASONABLENESS: Cross-check values between approaches
4. DEFENSIBILITY: Every assumption must be justified
5. CONSERVATIVE: When uncertain, err on the side of caution

You have expertise in:
- Business valuation standards (Fair Market Value)
- Capitalization rate development
- Market multiple analysis
- Asset valuation adjustments
- Valuation reconciliation`;

/**
 * Current market data for cap rate calculations
 */
export const MARKET_DATA = {
  riskFreeRate: 0.045,
  equityRiskPremium: 0.06,
  longTermGrowthRate: 0.025,
  lastUpdated: '2025-01-01',
};

/**
 * Build Pass 5 prompt with context from Passes 1-4 and injected knowledge
 */
export function buildPass5Prompt(
  pass1Summary: string,
  pass2Summary: string,
  pass3Summary: string,
  pass4Summary: string,
  injectedKnowledge: string
): string {
  return `${pass5Prompt}

## CONTEXT FROM PASS 1 (DOCUMENT EXTRACTION)

${pass1Summary}

## CONTEXT FROM PASS 2 (INDUSTRY ANALYSIS)

${pass2Summary}

## CONTEXT FROM PASS 3 (EARNINGS NORMALIZATION)

${pass3Summary}

## CONTEXT FROM PASS 4 (RISK ASSESSMENT)

${pass4Summary}

## INJECTED VALUATION KNOWLEDGE

${injectedKnowledge || 'No specific valuation guidance available. Apply standard valuation methodologies.'}

Calculate the fair market value for this business using all three approaches.`;
}

/**
 * Create a summary of Pass 1 output for Pass 5 input
 */
export function summarizePass1ForPass5(pass1Output: unknown): string {
  if (!pass1Output || typeof pass1Output !== 'object') {
    return 'No Pass 1 data available.';
  }

  const data = pass1Output as Record<string, unknown>;
  const analysis = data.analysis as Record<string, unknown> | undefined;

  if (!analysis) {
    return 'No analysis data available from Pass 1.';
  }

  const companyInfo = analysis.company_info as Record<string, unknown> | undefined;
  const financialData = analysis.financial_data as Record<string, unknown> | undefined;

  const years = financialData ? Object.keys(financialData).sort().reverse() : [];
  const latestYear = years[0];
  const latestFinancials = latestYear
    ? (financialData?.[latestYear] as Record<string, unknown>)
    : null;

  let summary = `### Company Information
- Name: ${companyInfo?.name || 'Unknown'}
- Entity Type: ${companyInfo?.entity_type || 'Unknown'}`;

  if (latestFinancials) {
    const revenue = (latestFinancials.revenue as number) || 0;
    const balanceSheet = latestFinancials.balance_sheet as Record<string, unknown> | undefined;

    summary += `

### Financial Summary (${latestYear})
- Revenue: $${revenue.toLocaleString()}
- Net Income: $${((latestFinancials.net_income as number) || 0).toLocaleString()}`;

    if (balanceSheet) {
      const totalAssets = (balanceSheet.total_assets as number) || 0;
      const totalLiabilities = (balanceSheet.total_liabilities as number) || 0;
      const bookValue = totalAssets - totalLiabilities;

      summary += `

### Balance Sheet
- Total Assets: $${totalAssets.toLocaleString()}
- Total Liabilities: $${totalLiabilities.toLocaleString()}
- Book Value of Equity: $${bookValue.toLocaleString()}
- Cash: $${((balanceSheet.cash as number) || 0).toLocaleString()}
- Accounts Receivable: $${((balanceSheet.accounts_receivable as number) || 0).toLocaleString()}
- Inventory: $${((balanceSheet.inventory as number) || 0).toLocaleString()}
- Fixed Assets: $${((balanceSheet.fixed_assets as number) || 0).toLocaleString()}`;
    }
  }

  return summary;
}

/**
 * Create a summary of Pass 2 output for Pass 5 input
 */
export function summarizePass2ForPass5(pass2Output: unknown): string {
  if (!pass2Output || typeof pass2Output !== 'object') {
    return 'No Pass 2 data available.';
  }

  const data = pass2Output as Record<string, unknown>;
  const analysis = data.analysis as Record<string, unknown> | undefined;

  if (!analysis) {
    return 'No analysis data available from Pass 2.';
  }

  const overview = analysis.industry_overview as Record<string, unknown> | undefined;
  const multiples = analysis.valuation_multiples as Record<string, unknown> | undefined;

  let summary = `### Industry Overview
- Sector: ${overview?.sector || 'Unknown'}
- Growth Outlook: ${overview?.growth_outlook || 'Unknown'}`;

  if (multiples) {
    const sdeMultiple = multiples.sde_multiple as Record<string, number> | undefined;
    const revenueMultiple = multiples.revenue_multiple as Record<string, number> | undefined;

    if (sdeMultiple) {
      summary += `

### Industry Valuation Multiples
- SDE Multiple: Low ${sdeMultiple.low}x / Typical ${sdeMultiple.typical}x / High ${sdeMultiple.high}x`;
    }

    if (revenueMultiple) {
      summary += `
- Revenue Multiple: Low ${revenueMultiple.low}x / Typical ${revenueMultiple.typical}x / High ${revenueMultiple.high}x`;
    }

    summary += `
- Multiple Source: ${multiples.source || 'Industry data'}`;
  }

  return summary;
}

/**
 * Create a summary of Pass 3 output for Pass 5 input
 */
export function summarizePass3ForPass5(pass3Output: unknown): string {
  if (!pass3Output || typeof pass3Output !== 'object') {
    return 'No Pass 3 data available.';
  }

  const data = pass3Output as Record<string, unknown>;
  const analysis = data.analysis as Record<string, unknown> | undefined;

  if (!analysis) {
    return 'No analysis data available from Pass 3.';
  }

  const sdeCalc = analysis.sde_calculation as Record<string, unknown> | undefined;
  const ebitdaCalc = analysis.ebitda_calculation as Record<string, unknown> | undefined;
  const qualityAssessment = analysis.earnings_quality_assessment as Record<string, unknown> | undefined;

  let summary = '### Normalized Earnings';

  if (sdeCalc) {
    const weightedSDE = (sdeCalc.weighted_average_sde as number) || 0;
    summary += `
- **Weighted Average SDE: $${weightedSDE.toLocaleString()}**
- Weighting Method: ${sdeCalc.weighting_method || 'Standard 3x/2x/1x'}`;

    const periods = sdeCalc.periods as Array<Record<string, unknown>> | undefined;
    if (periods && periods.length > 0) {
      summary += `
- Periods Analyzed:`;
      for (const period of periods) {
        summary += `
  - ${period.period}: SDE $${((period.sde as number) || 0).toLocaleString()}`;
      }
    }
  }

  if (ebitdaCalc) {
    const weightedEBITDA = (ebitdaCalc.weighted_average_ebitda as number) || 0;
    summary += `

### EBITDA
- **Weighted Average EBITDA: $${weightedEBITDA.toLocaleString()}**`;
  }

  if (qualityAssessment) {
    summary += `

### Earnings Quality
- Quality Score: ${qualityAssessment.quality_score || 'Not assessed'}`;
  }

  return summary;
}

/**
 * Create a summary of Pass 4 output for Pass 5 input
 */
export function summarizePass4ForPass5(pass4Output: unknown): string {
  if (!pass4Output || typeof pass4Output !== 'object') {
    return 'No Pass 4 data available.';
  }

  const data = pass4Output as Record<string, unknown>;
  const analysis = data.analysis as Record<string, unknown> | undefined;

  if (!analysis) {
    return 'No analysis data available from Pass 4.';
  }

  const riskScore = (analysis.overall_risk_score as number) || 2.5;
  const riskRating = (analysis.overall_risk_rating as string) || 'Average';
  const multipleAdjustment = (analysis.risk_adjusted_multiple_adjustment as number) || 0;

  let summary = `### Risk Assessment
- Overall Risk Score: ${riskScore.toFixed(2)}
- Risk Rating: ${riskRating}
- Multiple Adjustment: ${multipleAdjustment >= 0 ? '+' : ''}${multipleAdjustment.toFixed(2)}x`;

  // Derive company-specific risk premium from risk score
  let companyRiskPremium = 0.05; // default 5%
  if (riskScore <= 1.5) companyRiskPremium = 0.02;
  else if (riskScore <= 2.0) companyRiskPremium = 0.03;
  else if (riskScore <= 2.5) companyRiskPremium = 0.05;
  else if (riskScore <= 3.0) companyRiskPremium = 0.07;
  else if (riskScore <= 3.5) companyRiskPremium = 0.09;
  else companyRiskPremium = 0.12;

  summary += `
- Implied Company-Specific Risk Premium: ${(companyRiskPremium * 100).toFixed(1)}%`;

  const riskFactors = analysis.risk_factors as Array<Record<string, unknown>> | undefined;
  if (riskFactors && riskFactors.length > 0) {
    summary += `

### Key Risk Factors`;
    for (const factor of riskFactors.slice(0, 5)) {
      summary += `
- ${factor.factor}: ${factor.score}/5`;
    }
  }

  const strengths = analysis.company_specific_strengths as string[] | undefined;
  const risks = analysis.company_specific_risks as string[] | undefined;

  if (strengths && strengths.length > 0) {
    summary += `

### Key Strengths
${strengths.slice(0, 3).map(s => `- ${s}`).join('\n')}`;
  }

  if (risks && risks.length > 0) {
    summary += `

### Key Risks
${risks.slice(0, 3).map(r => `- ${r}`).join('\n')}`;
  }

  return summary;
}

/**
 * Validate Pass 5 output structure
 */
export function validatePass5Output(output: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!output || typeof output !== 'object') {
    errors.push('Output is not an object');
    return { valid: false, errors };
  }

  const data = output as Record<string, unknown>;

  if (!data.analysis) {
    errors.push('Missing analysis object');
    return { valid: false, errors };
  }

  const analysis = data.analysis as Record<string, unknown>;

  // Check asset_approach
  if (!analysis.asset_approach) {
    errors.push('Missing asset_approach');
  } else {
    const asset = analysis.asset_approach as Record<string, unknown>;
    if (typeof asset.book_value !== 'number') errors.push('Missing asset_approach.book_value');
    if (!Array.isArray(asset.adjustments)) errors.push('Missing asset_approach.adjustments array');
    if (typeof asset.adjusted_net_asset_value !== 'number') errors.push('Missing asset_approach.adjusted_net_asset_value');
    if (typeof asset.weight !== 'number') errors.push('Missing asset_approach.weight');
    if (!asset.narrative || typeof asset.narrative !== 'string') errors.push('Missing asset_approach.narrative');
    else {
      const wordCount = (asset.narrative as string).split(/\s+/).length;
      if (wordCount < 300) errors.push(`asset_approach.narrative too short: ${wordCount} words (need 400-500)`);
    }
  }

  // Check income_approach
  if (!analysis.income_approach) {
    errors.push('Missing income_approach');
  } else {
    const income = analysis.income_approach as Record<string, unknown>;
    if (typeof income.normalized_earnings !== 'number') errors.push('Missing income_approach.normalized_earnings');
    if (!['SDE', 'EBITDA'].includes(income.earnings_type as string)) errors.push('income_approach.earnings_type must be SDE or EBITDA');
    if (!income.cap_rate_buildup) errors.push('Missing income_approach.cap_rate_buildup');
    else {
      const cap = income.cap_rate_buildup as Record<string, unknown>;
      if (typeof cap.risk_free_rate !== 'number') errors.push('Missing cap_rate_buildup.risk_free_rate');
      if (typeof cap.equity_risk_premium !== 'number') errors.push('Missing cap_rate_buildup.equity_risk_premium');
      if (typeof cap.size_premium !== 'number') errors.push('Missing cap_rate_buildup.size_premium');
      if (typeof cap.company_specific_risk !== 'number') errors.push('Missing cap_rate_buildup.company_specific_risk');
      if (typeof cap.total_cap_rate !== 'number') errors.push('Missing cap_rate_buildup.total_cap_rate');
    }
    if (typeof income.capitalized_value !== 'number') errors.push('Missing income_approach.capitalized_value');
    if (typeof income.weight !== 'number') errors.push('Missing income_approach.weight');
    if (!income.narrative || typeof income.narrative !== 'string') errors.push('Missing income_approach.narrative');
    else {
      const wordCount = (income.narrative as string).split(/\s+/).length;
      if (wordCount < 300) errors.push(`income_approach.narrative too short: ${wordCount} words (need 400-500)`);
    }
  }

  // Check market_approach
  if (!analysis.market_approach) {
    errors.push('Missing market_approach');
  } else {
    const market = analysis.market_approach as Record<string, unknown>;
    if (typeof market.comparable_multiple !== 'number') errors.push('Missing market_approach.comparable_multiple');
    if (!['SDE', 'Revenue'].includes(market.multiple_type as string)) errors.push('market_approach.multiple_type must be SDE or Revenue');
    if (!market.multiple_source) errors.push('Missing market_approach.multiple_source');
    if (typeof market.applied_earnings !== 'number') errors.push('Missing market_approach.applied_earnings');
    if (typeof market.market_value !== 'number') errors.push('Missing market_approach.market_value');
    if (typeof market.weight !== 'number') errors.push('Missing market_approach.weight');
    if (!market.narrative || typeof market.narrative !== 'string') errors.push('Missing market_approach.narrative');
    else {
      const wordCount = (market.narrative as string).split(/\s+/).length;
      if (wordCount < 300) errors.push(`market_approach.narrative too short: ${wordCount} words (need 400-500)`);
    }
  }

  // Check weights sum to 1.0
  if (analysis.asset_approach && analysis.income_approach && analysis.market_approach) {
    const assetWeight = (analysis.asset_approach as Record<string, unknown>).weight as number;
    const incomeWeight = (analysis.income_approach as Record<string, unknown>).weight as number;
    const marketWeight = (analysis.market_approach as Record<string, unknown>).weight as number;

    if (typeof assetWeight === 'number' && typeof incomeWeight === 'number' && typeof marketWeight === 'number') {
      const totalWeight = assetWeight + incomeWeight + marketWeight;
      if (Math.abs(totalWeight - 1.0) > 0.01) {
        errors.push(`Weights must sum to 1.0, got ${totalWeight.toFixed(2)}`);
      }
    }
  }

  // Check knowledge_requests
  if (!data.knowledge_requests) {
    errors.push('Missing knowledge_requests');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate size premium based on revenue
 */
export function calculateSizePremium(revenue: number): number {
  if (revenue < 500000) return 0.06;
  if (revenue < 2000000) return 0.05;
  if (revenue < 10000000) return 0.04;
  return 0.03;
}

/**
 * Calculate company-specific risk premium from risk score
 */
export function calculateCompanyRiskPremium(riskScore: number): number {
  if (riskScore <= 1.5) return 0.02;
  if (riskScore <= 2.0) return 0.03;
  if (riskScore <= 2.5) return 0.05;
  if (riskScore <= 3.0) return 0.07;
  if (riskScore <= 3.5) return 0.09;
  if (riskScore <= 4.0) return 0.12;
  return 0.15;
}

/**
 * Calculate implied multiple from cap rate
 */
export function calculateImpliedMultiple(capRate: number): number {
  return capRate > 0 ? 1 / capRate : 0;
}

/**
 * Format currency value
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Round value to appropriate precision
 */
export function roundValue(value: number): number {
  if (value < 100000) return Math.round(value / 1000) * 1000;
  if (value < 1000000) return Math.round(value / 5000) * 5000;
  return Math.round(value / 10000) * 10000;
}

export default {
  prompt: pass5Prompt,
  systemContext: pass5SystemContext,
  marketData: MARKET_DATA,
  buildPrompt: buildPass5Prompt,
  summarizePass1: summarizePass1ForPass5,
  summarizePass2: summarizePass2ForPass5,
  summarizePass3: summarizePass3ForPass5,
  summarizePass4: summarizePass4ForPass5,
  validate: validatePass5Output,
  calculateSizePremium,
  calculateCompanyRiskPremium,
  calculateImpliedMultiple,
  formatCurrency,
  roundValue,
};
