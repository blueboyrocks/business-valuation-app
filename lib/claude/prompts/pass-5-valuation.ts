// Pass 5: Valuation Calculation
// Applies Asset, Income, and Market approaches to determine business value

import {
  PassOutput,
  Pass5Analysis,
  Pass1Analysis,
  Pass2Analysis,
  Pass3Analysis,
  Pass4Analysis,
  PASS_CONFIGS
} from '../types';

// ============================================================================
// CURRENT MARKET DATA (Update periodically)
// ============================================================================

export const MARKET_DATA = {
  riskFreeRate: 0.045, // 10-year Treasury rate (4.5%)
  equityRiskPremium: 0.06, // Historical equity risk premium (6%)
  longTermGrowthRate: 0.025, // Long-term GDP growth assumption (2.5%)
  lastUpdated: '2025-01-01',

  // Size premiums based on market cap/revenue
  sizePremiums: {
    micro: 0.06, // <$500K revenue
    small: 0.05, // $500K-$2M revenue
    medium: 0.04, // $2M-$10M revenue
    large: 0.03, // >$10M revenue
  },

  // Industry risk premiums (added to base cap rate)
  industryRiskPremiums: {
    technology: 0.03,
    healthcare: 0.025,
    manufacturing: 0.02,
    retail: 0.025,
    services: 0.02,
    construction: 0.03,
    restaurant: 0.035,
    automotive: 0.025,
    professional_services: 0.015,
    default: 0.025,
  } as Record<string, number>,
};

// ============================================================================
// MAIN PROMPT
// ============================================================================

export const pass5Prompt = `You are a Certified Valuation Analyst (CVA) performing the valuation calculation phase of a comprehensive business appraisal. Your task is to apply all three recognized valuation approaches and synthesize them into a defensible fair market value conclusion.

## YOUR ROLE

You are calculating the Fair Market Value (FMV) of a business, defined as:
"The price at which property would change hands between a willing buyer and a willing seller, neither being under any compulsion to buy or sell and both having reasonable knowledge of relevant facts."

This is a formal valuation that must:
- Apply recognized valuation methodologies
- Document all assumptions and calculations
- Provide defensible conclusions
- Meet professional appraisal standards

## CURRENT MARKET CONDITIONS

As of the valuation date:
- **Risk-Free Rate**: ${(MARKET_DATA.riskFreeRate * 100).toFixed(2)}% (10-Year U.S. Treasury)
- **Equity Risk Premium**: ${(MARKET_DATA.equityRiskPremium * 100).toFixed(2)}% (Historical average)
- **Long-Term Growth Rate**: ${(MARKET_DATA.longTermGrowthRate * 100).toFixed(2)}% (GDP growth assumption)

---

# VALUATION APPROACH 1: ASSET APPROACH (Adjusted Net Asset Method)

## Methodology Overview

The Asset Approach values a business based on the fair market value of its underlying assets minus its liabilities. This approach is most relevant for:
- Asset-intensive businesses
- Holding companies
- Businesses with significant real estate
- Liquidation scenarios
- As a floor value for any business

## Calculation Steps

### Step 1: Start with Book Value
\`\`\`
Book Value of Equity = Total Assets - Total Liabilities
\`\`\`

### Step 2: Adjust Assets to Fair Market Value

Common adjustments include:

| Asset Category | Common Adjustment | Rationale |
|---------------|-------------------|-----------|
| Accounts Receivable | -5% to -15% | Allowance for uncollectible accounts |
| Inventory | -10% to -30% | Obsolescence, marketability discount |
| Fixed Assets (Equipment) | Varies widely | Depreciation vs. actual FMV |
| Real Estate | Often increases | Market appreciation vs. book |
| Intangible Assets | Add if not on books | Customer lists, patents, goodwill |
| Prepaid Expenses | Usually at book | Limited adjustment needed |

### Step 3: Adjust Liabilities
- Review contingent liabilities
- Consider off-balance-sheet obligations
- Adjust debt to current market rates if significantly different

### Step 4: Calculate Adjusted Net Asset Value
\`\`\`
Adjusted Net Asset Value = FMV of Assets - FMV of Liabilities
\`\`\`

## Weighting Consideration

The Asset Approach typically receives:
- **15-25% weight** for operating businesses (going concern)
- **50-100% weight** for asset-holding companies
- **Higher weight** when assets are primary value driver
- **Lower weight** when earnings power exceeds asset value significantly

---

# VALUATION APPROACH 2: INCOME APPROACH (Capitalization of Earnings)

## Methodology Overview

The Income Approach values a business based on its ability to generate future economic benefits. We use the Capitalization of Earnings method, which is appropriate when:
- The business has stable, predictable earnings
- Historical earnings are representative of future expectations
- The business is expected to continue operations indefinitely

## Benefit Stream Selection

### For Businesses with SDE < $1,000,000:
Use **Seller's Discretionary Earnings (SDE)**
- Represents return to a working owner
- Appropriate for small businesses where owner is actively involved
- Most common metric for main street businesses

### For Businesses with SDE ≥ $1,000,000:
Use **EBITDA (Earnings Before Interest, Taxes, Depreciation, Amortization)**
- Represents return to all capital providers
- Appropriate for larger businesses
- More comparable to public company metrics

## Building the Capitalization Rate

The capitalization rate represents the required rate of return minus expected growth:

\`\`\`
Cap Rate = Discount Rate - Long-Term Growth Rate

Where Discount Rate = Risk-Free Rate
                    + Equity Risk Premium
                    + Size Premium
                    + Industry Risk Premium
                    + Company-Specific Risk Premium
\`\`\`

### Component Details:

| Component | Rate | Source/Rationale |
|-----------|------|------------------|
| Risk-Free Rate | ${(MARKET_DATA.riskFreeRate * 100).toFixed(2)}% | 10-Year U.S. Treasury |
| Equity Risk Premium | ${(MARKET_DATA.equityRiskPremium * 100).toFixed(2)}% | Historical equity vs. bonds |
| Size Premium | 3-6% | Based on revenue size |
| Industry Risk Premium | 1.5-3.5% | Industry-specific factors |
| Company-Specific Risk | Varies | From risk assessment (Pass 4) |
| Less: Growth Rate | (${(MARKET_DATA.longTermGrowthRate * 100).toFixed(2)}%) | Long-term sustainable growth |

### Size Premium Guidelines:

| Revenue Range | Size Premium |
|---------------|--------------|
| < $500,000 | 6.0% |
| $500,000 - $2,000,000 | 5.0% |
| $2,000,000 - $10,000,000 | 4.0% |
| > $10,000,000 | 3.0% |

### Company-Specific Risk Premium (from Risk Assessment):

| Weighted Risk Score | Company-Specific Premium |
|---------------------|-------------------------|
| 1.0 - 1.5 (Low Risk) | 0% - 2% |
| 1.5 - 2.0 (Below Average) | 2% - 4% |
| 2.0 - 2.5 (Average) | 4% - 6% |
| 2.5 - 3.0 (Above Average) | 6% - 8% |
| 3.0 - 3.5 (Elevated) | 8% - 10% |
| 3.5 - 4.0 (High) | 10% - 14% |
| 4.0 - 5.0 (Very High) | 14% - 20%+ |

## Value Calculation

\`\`\`
Income Approach Value = Benefit Stream / Capitalization Rate

Example:
- Weighted Average SDE: $250,000
- Cap Rate: 25%
- Value = $250,000 / 0.25 = $1,000,000
\`\`\`

## Reasonableness Check

The implied multiple should be:
\`\`\`
Implied Multiple = 1 / Cap Rate

Example: 1 / 0.25 = 4.0x multiple
\`\`\`

Compare this to market multiples - they should be in a reasonable range.

## Weighting Consideration

The Income Approach typically receives:
- **35-50% weight** for most operating businesses
- **Higher weight** when earnings are stable and predictable
- **Lower weight** when earnings are volatile or declining

---

# VALUATION APPROACH 3: MARKET APPROACH (Guideline Transaction Method)

## Methodology Overview

The Market Approach values a business based on pricing multiples derived from sales of comparable businesses. This approach reflects what buyers are actually paying in the market.

## Multiple Selection

### SDE Multiple (for smaller businesses):
- Most common for businesses under $1M in earnings
- Represents total return to owner-operator
- Range typically 1.5x to 4.0x for most industries

### EBITDA Multiple (for larger businesses):
- Used for businesses over $1M in earnings
- More comparable to middle market transactions
- Range typically 3.0x to 6.0x for most industries

### Revenue Multiple (supplementary):
- Useful for high-growth or unprofitable businesses
- Common in certain industries (SaaS, healthcare practices)
- Should be used as secondary indicator

## Applying the Multiple

### Step 1: Select Base Multiple
Use industry-specific multiple from comparable transactions data.

### Step 2: Apply Risk Adjustments
From Pass 4, apply the multiple adjustment based on risk score:

| Risk Score | Multiple Adjustment |
|------------|---------------------|
| 1.0 - 1.5 | +0.5x to +1.0x |
| 1.5 - 2.0 | +0.25x to +0.5x |
| 2.0 - 2.5 | No adjustment |
| 2.5 - 3.0 | -0.25x to -0.5x |
| 3.0 - 3.5 | -0.5x to -0.75x |
| 3.5 - 4.0 | -0.75x to -1.0x |
| 4.0 - 5.0 | -1.0x or more |

### Step 3: Calculate Market Value
\`\`\`
Market Approach Value = Benefit Stream × Adjusted Multiple

Example:
- Weighted SDE: $250,000
- Base Multiple: 2.75x (industry median)
- Risk Adjustment: -0.25x (above average risk)
- Adjusted Multiple: 2.50x
- Value = $250,000 × 2.50 = $625,000
\`\`\`

## Weighting Consideration

The Market Approach typically receives:
- **35-50% weight** for most businesses
- **Higher weight** when good comparable data exists
- **Higher weight** for industries with active transaction markets
- **Lower weight** when comparables are limited or dissimilar

---

# RECONCILIATION AND FINAL VALUE

## Weighting the Approaches

Consider these factors when assigning weights:

| Factor | Favors Asset | Favors Income | Favors Market |
|--------|-------------|---------------|---------------|
| Asset-intensive business | ✓ | | |
| Strong earnings history | | ✓ | |
| Good comparable data | | | ✓ |
| Service business | | ✓ | ✓ |
| Holding company | ✓ | | |
| Growing business | | ✓ | |
| Declining business | ✓ | | |

## Typical Weighting Ranges:

| Business Type | Asset | Income | Market |
|---------------|-------|--------|--------|
| Main Street Service | 15% | 40% | 45% |
| Main Street Retail | 20% | 35% | 45% |
| Manufacturing | 25% | 40% | 35% |
| Professional Practice | 15% | 45% | 40% |
| Asset-Heavy Business | 35% | 35% | 30% |

## Sanity Checks

Before finalizing value, verify:

1. **Value-to-Revenue Ratio**: Typically 0.3x to 1.5x for most businesses
2. **Return on Investment**: Should exceed passive investment returns
3. **Payback Period**: Typically 3-5 years for main street businesses
4. **Debt Service Coverage**: If financed, can cash flow support debt?

---

# OUTPUT REQUIREMENTS

## JSON Structure

Return your analysis as a JSON object with this structure:

\`\`\`json
{
  "analysis": {
    "valuation_date": "YYYY-MM-DD",
    "standard_of_value": "Fair Market Value",
    "premise_of_value": "Going Concern",

    "asset_approach": {
      "methodology": "Adjusted Net Asset Method",
      "book_value_equity": 0,
      "asset_adjustments": [
        {
          "asset_category": "string",
          "book_value": 0,
          "fair_market_value": 0,
          "adjustment": 0,
          "rationale": "string"
        }
      ],
      "total_asset_adjustments": 0,
      "liability_adjustments": [
        {
          "liability_category": "string",
          "book_value": 0,
          "fair_market_value": 0,
          "adjustment": 0,
          "rationale": "string"
        }
      ],
      "total_liability_adjustments": 0,
      "adjusted_net_asset_value": 0,
      "weight_assigned": 0.20,
      "weighted_value": 0,
      "narrative": "400-500 word explanation of asset approach application"
    },

    "income_approach": {
      "methodology": "Capitalization of Earnings",
      "benefit_stream_type": "SDE or EBITDA",
      "benefit_stream_amount": 0,
      "capitalization_rate_buildup": {
        "risk_free_rate": 0.045,
        "equity_risk_premium": 0.060,
        "size_premium": 0.050,
        "industry_risk_premium": 0.025,
        "company_specific_risk_premium": 0.060,
        "total_discount_rate": 0.240,
        "less_growth_rate": 0.025,
        "capitalization_rate": 0.215
      },
      "indicated_value": 0,
      "implied_multiple": 0,
      "reasonableness_check": "string",
      "weight_assigned": 0.40,
      "weighted_value": 0,
      "narrative": "400-500 word explanation of income approach application"
    },

    "market_approach": {
      "methodology": "Guideline Transaction Method",
      "multiple_type": "SDE Multiple or EBITDA Multiple",
      "benefit_stream_amount": 0,
      "base_multiple": 0,
      "base_multiple_source": "string",
      "risk_adjustment": 0,
      "other_adjustments": [
        {
          "factor": "string",
          "adjustment": 0,
          "rationale": "string"
        }
      ],
      "adjusted_multiple": 0,
      "indicated_value": 0,
      "comparable_transactions_discussion": "string",
      "weight_assigned": 0.40,
      "weighted_value": 0,
      "narrative": "400-500 word explanation of market approach application"
    },

    "value_reconciliation": {
      "asset_approach_value": 0,
      "asset_approach_weight": 0.20,
      "income_approach_value": 0,
      "income_approach_weight": 0.40,
      "market_approach_value": 0,
      "market_approach_weight": 0.40,
      "weighted_average_value": 0,
      "rounding_adjustment": 0,
      "concluded_fair_market_value": 0,
      "value_range_low": 0,
      "value_range_high": 0,
      "weighting_rationale": "string explaining why these weights were selected"
    },

    "sanity_checks": {
      "value_to_revenue_ratio": 0,
      "value_to_revenue_assessment": "string",
      "implied_roi": 0,
      "roi_assessment": "string",
      "implied_payback_years": 0,
      "payback_assessment": "string",
      "overall_reasonableness": "string"
    },

    "valuation_summary": {
      "concluded_value": 0,
      "value_range": "string (e.g., '$850,000 to $1,050,000')",
      "primary_value_drivers": ["string"],
      "key_assumptions": ["string"],
      "limiting_conditions": ["string"]
    }
  },

  "knowledge_requests": {
    "for_pass_6": ["specific knowledge needed for narrative generation"]
  },

  "knowledge_reasoning": "Explanation of what knowledge would enhance the final narrative"
}
\`\`\`

---

# NARRATIVE REQUIREMENTS

## Asset Approach Narrative (400-500 words)

Your narrative should address:
1. Why the asset approach is relevant (or limited) for this business
2. Discussion of the most significant asset adjustments
3. Treatment of intangible assets (customer relationships, brand, etc.)
4. How the adjusted net asset value compares to the other approaches
5. Rationale for the weight assigned

## Income Approach Narrative (400-500 words)

Your narrative should address:
1. Selection of benefit stream (SDE vs. EBITDA) and why
2. Discussion of the earnings quality and normalization
3. Walk-through of the capitalization rate buildup
4. How company-specific risk factors affected the rate
5. Reasonableness of the implied multiple
6. Rationale for the weight assigned

## Market Approach Narrative (400-500 words)

Your narrative should address:
1. Availability and quality of comparable transaction data
2. Selection of the base multiple and its source
3. Adjustments made for company-specific factors
4. How this business compares to typical transactions
5. Discussion of current M&A market conditions
6. Rationale for the weight assigned

---

# IMPORTANT GUIDELINES

1. **Show Your Work**: Include all calculations with clear steps
2. **Be Conservative**: When uncertain, err on the side of caution
3. **Document Assumptions**: Every assumption should be stated explicitly
4. **Cross-Check Values**: Ensure the three approaches produce reasonable, explainable results
5. **Explain Divergence**: If approaches produce very different values, explain why
6. **Round Appropriately**: Final value should be rounded to nearest $5,000 or $10,000

## Common Errors to Avoid

- Don't use a multiple that contradicts the cap rate (they should imply similar values)
- Don't ignore the asset approach even if value is low
- Don't apply adjustments twice (once in cap rate AND in multiple)
- Don't use growth rate higher than GDP for perpetuity calculations
- Don't forget to check if the value "makes sense" relative to revenue

---

Analyze the business data provided and calculate the fair market value using all three approaches. Provide detailed calculations and thorough narratives for each approach.`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create summary of Pass 1-4 data for Pass 5
 */
export function createValuationInputSummary(
  pass1: Pass1Analysis,
  pass2: Pass2Analysis,
  pass3: Pass3Analysis,
  pass4: Pass4Analysis
): string {
  // Extract key financial data from the most recent year
  const years = Object.keys(pass1.financial_data).sort().reverse();
  const mostRecentYear = years[0] || 'Unknown';
  const mostRecentData = pass1.financial_data[mostRecentYear];

  const revenue = mostRecentData?.revenue?.net_revenue || 0;
  const netIncome = mostRecentData?.net_income || 0;
  const totalAssets = mostRecentData?.balance_sheet?.assets?.total_assets || 0;
  const totalLiabilities = mostRecentData?.balance_sheet?.liabilities?.total_liabilities || 0;
  const bookEquity = totalAssets - totalLiabilities;
  const grossProfit = mostRecentData?.gross_profit || 0;
  const grossMargin = revenue > 0 ? (grossProfit / revenue) : 0;

  // Extract earnings data
  const weightedSDE = pass3.sde_calculation.weighted_average_sde.weighted_sde;
  const weightedEBITDA = pass3.ebitda_calculation.weighted_average_ebitda;
  const recommendedStream = pass3.earnings_quality_assessment.adjustments_confidence === 'High' ? 'SDE' : 'EBITDA';
  const recommendedAmount = recommendedStream === 'SDE' ? weightedSDE : weightedEBITDA;

  // Extract risk data
  const riskScore = pass4.overall_risk_score;
  const riskCategory = pass4.risk_category;
  const multipleAdjustment = pass4.risk_adjusted_multiple.total_risk_adjustment;

  // Extract industry data
  const industryMultiple = pass2.industry_benchmarks.sde_multiple_range.median;
  const multipleType = 'SDE';
  const industry = pass1.industry_classification.detected_industry;

  return `
## BUSINESS SUMMARY

**Company Profile:**
- Business: ${pass1.company_info.legal_name || 'Subject Company'}
- Industry: ${industry}
- NAICS Code: ${pass1.industry_classification.naics_code}
- Entity Type: ${pass1.company_info.entity_type}
- State: ${pass1.company_info.address.state || 'Not specified'}

---

## FINANCIAL DATA (Most Recent Year: ${mostRecentYear})

**Income Statement:**
- Revenue: $${revenue.toLocaleString()}
- Net Income: $${netIncome.toLocaleString()}
- Gross Margin: ${(grossMargin * 100).toFixed(1)}%

**Balance Sheet:**
- Total Assets: $${totalAssets.toLocaleString()}
- Total Liabilities: $${totalLiabilities.toLocaleString()}
- Book Value of Equity: $${bookEquity.toLocaleString()}

**Asset Details (if available):**
- Cash: $${(mostRecentData?.balance_sheet?.assets?.cash || 0).toLocaleString()}
- Accounts Receivable: $${(mostRecentData?.balance_sheet?.assets?.accounts_receivable || 0).toLocaleString()}
- Inventory: $${(mostRecentData?.balance_sheet?.assets?.inventory || 0).toLocaleString()}
- Fixed Assets (Net): $${(mostRecentData?.balance_sheet?.assets?.fixed_assets_net || 0).toLocaleString()}

**Liability Details (if available):**
- Accounts Payable: $${(mostRecentData?.balance_sheet?.liabilities?.accounts_payable || 0).toLocaleString()}
- Long-term Debt: $${(mostRecentData?.balance_sheet?.liabilities?.long_term_debt || 0).toLocaleString()}

---

## NORMALIZED EARNINGS (From Pass 3)

**Seller's Discretionary Earnings (SDE):**
${pass3.sde_calculation.periods.map(p =>
  `- ${p.period}: $${p.sde.toLocaleString()}`
).join('\n')}
- **Weighted Average SDE: $${weightedSDE.toLocaleString()}**

**EBITDA:**
${pass3.ebitda_calculation.periods.map(p =>
  `- ${p.period}: $${p.adjusted_ebitda.toLocaleString()}`
).join('\n')}
- **Weighted Average EBITDA: $${weightedEBITDA.toLocaleString()}**

**Recommended Benefit Stream: ${recommendedStream}**
- Amount: $${recommendedAmount.toLocaleString()}
- Earnings Quality: ${pass3.earnings_quality_assessment.consistency} consistency, ${pass3.earnings_quality_assessment.trend} trend

**Key Add-backs Applied:**
${pass3.sde_calculation.periods[0]?.adjustments.slice(0, 5).map(ab =>
  `- ${ab.category}: $${ab.amount.toLocaleString()} (${ab.confidence} confidence)`
).join('\n') || 'None identified'}

---

## INDUSTRY ANALYSIS (From Pass 2)

**Industry Overview:**
- Industry: ${pass2.industry_overview.industry_name}
- Market Size: ${pass2.industry_overview.market_size}
- Growth Outlook: ${pass2.industry_overview.growth_outlook}

**Industry Multiples:**
- SDE Multiple Range: ${pass2.industry_benchmarks.sde_multiple_range.low}x - ${pass2.industry_benchmarks.sde_multiple_range.high}x (median: ${pass2.industry_benchmarks.sde_multiple_range.median}x)
- EBITDA Multiple Range: ${pass2.industry_benchmarks.ebitda_multiple_range.low}x - ${pass2.industry_benchmarks.ebitda_multiple_range.high}x (median: ${pass2.industry_benchmarks.ebitda_multiple_range.median}x)

**Industry Benchmarks:**
- Gross Margin: ${(pass2.industry_benchmarks.gross_margin_benchmark.median * 100).toFixed(1)}%
- Operating Margin: ${(pass2.industry_benchmarks.operating_margin_benchmark.median * 100).toFixed(1)}%
- Net Margin: ${(pass2.industry_benchmarks.profit_margin_benchmark.median * 100).toFixed(1)}%

**Company Positioning:** ${pass2.company_positioning.relative_performance}

---

## RISK ASSESSMENT (From Pass 4)

**Overall Risk Score: ${riskScore.toFixed(2)} (${riskCategory})**

**Risk Factor Scores:**
${pass4.risk_factors.map(rf =>
  `- ${rf.factor_name} (${(rf.weight * 100).toFixed(0)}%): ${rf.score}/5 - ${rf.rating} Risk`
).join('\n')}

**Multiple Adjustment:**
- Base Industry Multiple: ${pass4.risk_adjusted_multiple.base_industry_multiple.toFixed(2)}x
- Total Risk Adjustment: ${multipleAdjustment > 0 ? '+' : ''}${multipleAdjustment.toFixed(2)}x
- Adjusted Multiple: ${pass4.risk_adjusted_multiple.adjusted_multiple.toFixed(2)}x
- Rationale: ${pass4.risk_adjusted_multiple.adjustment_rationale}

**Key Risks:**
${pass4.company_specific_risks.slice(0, 3).map(r => `- ${r.risk} (${r.severity})`).join('\n')}

**Key Strengths:**
${pass4.company_specific_strengths.slice(0, 3).map(s => `- ${s.strength} (${s.impact})`).join('\n')}

---

## CALCULATION INPUTS FOR VALUATION

| Input | Value | Source |
|-------|-------|--------|
| Weighted SDE | $${weightedSDE.toLocaleString()} | Pass 3 |
| Weighted EBITDA | $${weightedEBITDA.toLocaleString()} | Pass 3 |
| Recommended Stream | ${recommendedStream} | Pass 3 |
| Revenue | $${revenue.toLocaleString()} | Pass 1 |
| Book Equity | $${bookEquity.toLocaleString()} | Pass 1 |
| Industry Multiple | ${industryMultiple.toFixed(2)}x ${multipleType} | Pass 2 |
| Risk Score | ${riskScore.toFixed(2)} | Pass 4 |
| Multiple Adjustment | ${multipleAdjustment > 0 ? '+' : ''}${multipleAdjustment.toFixed(2)}x | Pass 4 |

---

Use these inputs to calculate business value using all three approaches.
`;
}

/**
 * Calculate appropriate size premium based on revenue
 */
export function calculateSizePremium(revenue: number): number {
  if (revenue < 500000) return MARKET_DATA.sizePremiums.micro;
  if (revenue < 2000000) return MARKET_DATA.sizePremiums.small;
  if (revenue < 10000000) return MARKET_DATA.sizePremiums.medium;
  return MARKET_DATA.sizePremiums.large;
}

/**
 * Get industry risk premium
 */
export function getIndustryRiskPremium(sector: string): number {
  const normalizedSector = sector.toLowerCase().replace(/[^a-z]/g, '_');
  return MARKET_DATA.industryRiskPremiums[normalizedSector] || MARKET_DATA.industryRiskPremiums.default;
}

/**
 * Calculate company-specific risk premium from risk score
 */
export function calculateCompanySpecificPremium(riskScore: number): number {
  if (riskScore <= 1.5) return 0.01; // 1%
  if (riskScore <= 2.0) return 0.03; // 3%
  if (riskScore <= 2.5) return 0.05; // 5%
  if (riskScore <= 3.0) return 0.07; // 7%
  if (riskScore <= 3.5) return 0.09; // 9%
  if (riskScore <= 4.0) return 0.12; // 12%
  return 0.17; // 17%+ for very high risk
}

/**
 * Build the complete Pass 5 prompt with context
 */
export function buildPass5Prompt(
  pass1: Pass1Analysis,
  pass2: Pass2Analysis,
  pass3: Pass3Analysis,
  pass4: Pass4Analysis,
  knowledgeInjection?: string
): string {
  const inputSummary = createValuationInputSummary(pass1, pass2, pass3, pass4);

  let prompt = pass5Prompt;

  // Add knowledge injection if provided
  if (knowledgeInjection) {
    prompt += `\n\n---\n\n# ADDITIONAL KNOWLEDGE FOR THIS VALUATION\n\n${knowledgeInjection}`;
  }

  // Add the specific business data
  prompt += `\n\n---\n\n# BUSINESS DATA FOR VALUATION\n\n${inputSummary}`;

  // Add specific calculation guidance - get most recent year's revenue
  const years = Object.keys(pass1.financial_data).sort().reverse();
  const mostRecentData = pass1.financial_data[years[0]];
  const revenue = mostRecentData?.revenue?.net_revenue || 0;
  const sizePremium = calculateSizePremium(revenue);
  const industryPremium = getIndustryRiskPremium(pass1.industry_classification.detected_industry);
  const companyPremium = calculateCompanySpecificPremium(pass4.overall_risk_score);

  prompt += `\n\n---\n\n# PRE-CALCULATED RATE COMPONENTS\n\n`;
  prompt += `Based on the business profile, use these rate components:\n\n`;
  prompt += `| Component | Rate | Calculation Basis |\n`;
  prompt += `|-----------|------|-------------------|\n`;
  prompt += `| Risk-Free Rate | ${(MARKET_DATA.riskFreeRate * 100).toFixed(2)}% | 10-Year Treasury |\n`;
  prompt += `| Equity Risk Premium | ${(MARKET_DATA.equityRiskPremium * 100).toFixed(2)}% | Historical average |\n`;
  prompt += `| Size Premium | ${(sizePremium * 100).toFixed(2)}% | Revenue of $${revenue.toLocaleString()} |\n`;
  prompt += `| Industry Risk Premium | ${(industryPremium * 100).toFixed(2)}% | ${pass1.industry_classification.detected_industry} |\n`;
  prompt += `| Company-Specific Premium | ${(companyPremium * 100).toFixed(2)}% | Risk score of ${pass4.overall_risk_score.toFixed(2)} |\n`;
  prompt += `| Total Discount Rate | ${((MARKET_DATA.riskFreeRate + MARKET_DATA.equityRiskPremium + sizePremium + industryPremium + companyPremium) * 100).toFixed(2)}% | Sum of above |\n`;
  prompt += `| Less: Growth Rate | (${(MARKET_DATA.longTermGrowthRate * 100).toFixed(2)}%) | Long-term growth |\n`;
  prompt += `| **Capitalization Rate** | **${((MARKET_DATA.riskFreeRate + MARKET_DATA.equityRiskPremium + sizePremium + industryPremium + companyPremium - MARKET_DATA.longTermGrowthRate) * 100).toFixed(2)}%** | Discount - Growth |\n`;

  return prompt;
}

/**
 * Validate Pass 5 output structure
 */
export function validatePass5Output(output: unknown): output is PassOutput<Pass5Analysis> {
  if (!output || typeof output !== 'object') return false;

  const o = output as Record<string, unknown>;

  // Check top-level structure
  if (!o.analysis || typeof o.analysis !== 'object') return false;
  if (!o.knowledge_requests || typeof o.knowledge_requests !== 'object') return false;

  const analysis = o.analysis as Record<string, unknown>;

  // Check required valuation sections
  if (!analysis.asset_approach || typeof analysis.asset_approach !== 'object') return false;
  if (!analysis.income_approach || typeof analysis.income_approach !== 'object') return false;
  if (!analysis.market_approach || typeof analysis.market_approach !== 'object') return false;
  if (!analysis.value_reconciliation || typeof analysis.value_reconciliation !== 'object') return false;
  if (!analysis.valuation_summary || typeof analysis.valuation_summary !== 'object') return false;

  // Check that we have a concluded value
  const summary = analysis.valuation_summary as Record<string, unknown>;
  if (typeof summary.concluded_value !== 'number' || summary.concluded_value <= 0) return false;

  // Check reconciliation totals
  const reconciliation = analysis.value_reconciliation as Record<string, unknown>;
  if (typeof reconciliation.concluded_fair_market_value !== 'number') return false;

  // Validate weights sum to 1
  const assetWeight = (analysis.asset_approach as Record<string, unknown>).weight_assigned as number;
  const incomeWeight = (analysis.income_approach as Record<string, unknown>).weight_assigned as number;
  const marketWeight = (analysis.market_approach as Record<string, unknown>).weight_assigned as number;

  const totalWeight = assetWeight + incomeWeight + marketWeight;
  if (Math.abs(totalWeight - 1.0) > 0.01) {
    console.warn(`Weights do not sum to 1.0: ${totalWeight}`);
    return false;
  }

  return true;
}

/**
 * Extract key valuation data for Pass 6
 */
export function extractPass5ValuationData(analysis: Pass5Analysis): {
  concludedValue: number;
  valueRange: { low: number; high: number };
  assetApproachValue: number;
  incomeApproachValue: number;
  marketApproachValue: number;
  capRate: number;
  impliedMultiple: number;
  primaryDrivers: string[];
} {
  return {
    concludedValue: analysis.valuation_synthesis.final_valuation.concluded_value,
    valueRange: {
      low: analysis.valuation_synthesis.final_valuation.valuation_range_low,
      high: analysis.valuation_synthesis.final_valuation.valuation_range_high,
    },
    assetApproachValue: analysis.asset_approach.adjusted_net_asset_value,
    incomeApproachValue: analysis.income_approach.income_approach_value,
    marketApproachValue: analysis.market_approach.market_approach_value,
    capRate: analysis.income_approach.capitalization_rate.capitalization_rate,
    impliedMultiple: analysis.income_approach.multiple_derivation.final_multiple,
    primaryDrivers: analysis.valuation_synthesis.final_valuation.value_drivers,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Round value to appropriate precision
 */
export function roundValue(value: number): number {
  if (value < 100000) {
    return Math.round(value / 1000) * 1000; // Round to nearest $1,000
  } else if (value < 1000000) {
    return Math.round(value / 5000) * 5000; // Round to nearest $5,000
  } else {
    return Math.round(value / 10000) * 10000; // Round to nearest $10,000
  }
}
