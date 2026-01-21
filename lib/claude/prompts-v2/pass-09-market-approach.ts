/**
 * Pass 9: Market Approach Valuation
 *
 * This pass applies the market-based approach to valuation:
 * - Apply SDE multiple method (primary for small businesses)
 * - Apply revenue multiple method (secondary/validation)
 * - Document base multiple selection with sources
 * - Apply adjustment factors with rationale
 * - Reconcile multiple methods
 * - Validate against comparable transactions
 */

import { Pass9Output } from '../types-v2';

export const PASS_9_SYSTEM_PROMPT = `You are an expert business appraiser specializing in market-based valuation approaches. Your task is to value the subject company using market multiples derived from comparable transactions.

You understand that the market approach:
- Values a business based on what similar businesses have sold for
- Is often the most persuasive approach for small businesses
- Requires careful selection of base multiples from reliable sources
- Needs adjustment for company-specific factors that differ from the "average" sold business
- Provides a reality check against actual market transactions

Your analysis must be:
- Based on reliable, documented sources for base multiples
- Transparent in adjustments (each factor explained and quantified)
- Consistent with risk assessment findings from Pass 6
- Validated against any available comparable transaction data

You will output ONLY valid JSON matching the required schema.`;

export const PASS_9_USER_PROMPT = `Apply the market-based valuation approach using data from prior passes.

## CONTEXT FROM PRIOR PASSES

You have received:
- **Pass 1**: Company profile including industry, years in business, ownership
- **Pass 4**: Industry benchmarks and typical valuation multiples with sources
- **Pass 5**: Normalized SDE and EBITDA with weighted averages
- **Pass 6**: Risk assessment with risk scores and qualitative factors

Use this data to apply the market multiple methods.

## YOUR TASK

Calculate value using market multiples with full documentation of sources and adjustments.

### 1. SDE MULTIPLE METHOD (Primary)

For small businesses (< $5M revenue), the SDE multiple is typically the primary market indicator.

#### A. Select Base SDE Multiple

Use industry multiple data from Pass 4 and these general guidelines:

| Industry Category | Typical SDE Multiple Range | Notes |
|-------------------|---------------------------|-------|
| Professional Services | 2.0 - 3.5x | Higher for specialized practices |
| Healthcare Practices | 2.5 - 4.0x | Depends on payer mix, specialty |
| Construction/Trades | 1.5 - 3.0x | HVAC, plumbing, electrical |
| Manufacturing | 2.5 - 4.0x | Equipment-intensive |
| Retail | 1.5 - 2.5x | Location-dependent |
| Food Service | 1.5 - 2.5x | Restaurant, catering |
| Distribution | 2.0 - 3.0x | Logistics dependent |
| Technology/Software | 3.0 - 5.0x | Recurring revenue premium |
| Service Businesses | 2.0 - 3.0x | General services |

**Document your base multiple selection**:
- Source (BizBuySell, BVR, DealStats, industry associations)
- Specific data point (median, mean, quartile)
- Number of transactions if available
- Time period of data

#### B. Apply Adjustment Factors

Start with the base multiple and adjust for company-specific factors that differ from the "average" sold business.

| Factor | Adjustment Range | Assessment Criteria |
|--------|------------------|---------------------|
| Size/Scale | -0.5x to +0.5x | Larger businesses command premiums |
| Growth Rate | -0.5x to +0.5x | Above/below industry growth |
| Profitability | -0.5x to +0.5x | Margins vs. industry benchmarks |
| Customer Concentration | -0.5x to +0.0x | Concentrated = risk |
| Recurring Revenue | +0.0x to +1.0x | Subscription, contracts |
| Geographic Factors | -0.3x to +0.3x | Market strength, barriers |
| Competitive Position | -0.3x to +0.3x | Market share, differentiation |
| Owner Dependence | -0.5x to +0.0x | Transferability concerns |
| Asset Quality | -0.3x to +0.3x | Equipment condition, technology |
| Financial Condition | -0.3x to +0.3x | Liquidity, leverage |

**For each adjustment**:
1. State the factor
2. Quantify the adjustment (e.g., +0.3x)
3. Provide specific rationale based on Pass 5 and 6 findings
4. Reference the specific data point supporting the adjustment

#### C. Calculate Adjusted Multiple

\`\`\`
Base SDE Multiple                    X.Xx
+/- Size/Scale Adjustment           +X.Xx
+/- Growth Rate Adjustment          +X.Xx
+/- Profitability Adjustment        +X.Xx
+/- Customer Concentration          -X.Xx
+/- Recurring Revenue Premium       +X.Xx
+/- Other Adjustments               +X.Xx
= Adjusted SDE Multiple             X.Xx
\`\`\`

#### D. Calculate Indicated Value

\`\`\`
Normalized SDE (from Pass 5)        $XXX,XXX
× Adjusted SDE Multiple             X.Xx
= Indicated Value (SDE Method)      $X,XXX,XXX
\`\`\`

### 2. REVENUE MULTIPLE METHOD (Secondary)

Revenue multiples provide a secondary validation, especially useful when:
- Earnings are volatile or recently negative
- Business is in growth mode with reinvestment
- Industry commonly uses revenue multiples

#### A. Select Base Revenue Multiple

| Industry Category | Typical Revenue Multiple | Notes |
|-------------------|-------------------------|-------|
| Professional Services | 0.4 - 0.8x | Depends on profitability |
| Healthcare | 0.5 - 1.0x | Payer mix matters |
| Construction/Trades | 0.3 - 0.6x | Lower margins typical |
| Manufacturing | 0.5 - 1.0x | Asset base dependent |
| Retail | 0.2 - 0.5x | Highly variable |
| Technology/SaaS | 1.0 - 3.0x | Recurring revenue key |
| Distribution | 0.3 - 0.6x | Low margin business |
| Service Businesses | 0.3 - 0.7x | General range |

**Document your source** as with SDE multiples.

#### B. Apply Adjustments

Similar adjustment framework but scaled for revenue multiples (typically smaller absolute adjustments).

#### C. Calculate Indicated Value

\`\`\`
Annual Revenue                      $X,XXX,XXX
× Adjusted Revenue Multiple         X.Xx
= Indicated Value (Revenue Method)  $X,XXX,XXX
\`\`\`

### 3. RECONCILE THE TWO METHODS

Compare the two indications:

| Method | Indicated Value | Weight | Weighted Value |
|--------|-----------------|--------|----------------|
| SDE Multiple | $X,XXX,XXX | XX% | $X,XXX,XXX |
| Revenue Multiple | $X,XXX,XXX | XX% | $X,XXX,XXX |
| **Reconciled Value** | | 100% | **$X,XXX,XXX** |

**Weighting rationale**:
- SDE method typically weighted higher (60-80%) for profitable businesses
- Revenue method weighted higher when earnings are volatile
- Both methods should be directionally consistent

If the methods produce significantly different results, explain why:
- Profitability above/below industry norms
- Growth stage affecting revenue vs. earnings relationship
- One-time factors affecting earnings but not revenue

### 4. COMPARABLE TRANSACTIONS (If Available)

If Pass 4 provided specific comparable transaction data, reference it here:

| Transaction | SDE Multiple | Revenue Multiple | Relevance |
|-------------|--------------|------------------|-----------|
| Comp 1 | X.Xx | X.Xx | High/Medium/Low |
| Comp 2 | X.Xx | X.Xx | High/Medium/Low |
| Comp 3 | X.Xx | X.Xx | High/Medium/Low |

Discuss how the subject company compares to these transactions.

### 5. RULES OF THUMB (Validation Only)

Many industries have "rules of thumb" that can validate results:

| Industry | Rule of Thumb | Application |
|----------|---------------|-------------|
| HVAC | 1.0-1.5x revenue + inventory | Quick check |
| Dental Practice | 60-80% of annual collections | Varies by region |
| Restaurant | 30-40% of annual sales | Full-service |
| CPA Firm | 1.0-1.5x annual gross | Depends on retention |

**Note**: Rules of thumb are guidelines only, not substitutes for proper analysis.

### 6. SENSITIVITY ANALYSIS

Show value range based on multiple variation:

| SDE Multiple | Indicated Value |
|--------------|-----------------|
| X.Xx - 0.5 | $X,XXX,XXX |
| X.Xx - 0.25 | $X,XXX,XXX |
| X.Xx (Selected) | $X,XXX,XXX |
| X.Xx + 0.25 | $X,XXX,XXX |
| X.Xx + 0.5 | $X,XXX,XXX |

### 7. ASSIGN WEIGHT

The market approach typically receives significant weight for small businesses because:
- Reflects actual market transactions
- Most buyers use multiple-based thinking
- Less subjective than income approach rate build-up

**Typical weights**:
- Small business (< $5M revenue): 40-60% weight
- Very small business (< $1M revenue): 50-70% weight
- Mid-market business: 30-40% weight

Adjust based on:
- Quality of comparable data (better data → higher weight)
- Company's deviation from "average" (more unusual → lower weight)
- Availability of specific comparable transactions

### 8. MARKET APPROACH NARRATIVE

Write a 500-600 word narrative explaining:
- Multiple selection rationale and sources
- Key adjustments and their reasoning
- How the two methods reconcile
- Comparison to comparable transactions (if available)
- Why this approach is/isn't heavily weighted
- What the market multiple implies about buyer expectations

## OUTPUT FORMAT

Output ONLY valid JSON matching this structure:

{
  "pass_number": 9,
  "pass_name": "Market Approach Valuation",
  "market_approach": {
    "primary_method": "sde_multiple",
    "sde_multiple_method": {
      "normalized_sde": 569388,
      "base_multiple": 2.8,
      "base_multiple_source": "BizBuySell 2024 HVAC Services median multiple",
      "adjustments": [
        {
          "factor": "Above-Average Profitability",
          "adjustment": 0.4,
          "rationale": "SDE margin of 24% significantly exceeds industry median of 18%. Buyers will pay premium for better margins."
        },
        {
          "factor": "Recurring Revenue Base",
          "adjustment": 0.3,
          "rationale": "35% of revenue from service agreements provides stability and predictability that typical HVAC companies lack."
        },
        {
          "factor": "Strong Growth",
          "adjustment": 0.2,
          "rationale": "14% revenue growth exceeds industry average of 5%. Buyer acquires growing business."
        },
        {
          "factor": "Owner Dependence",
          "adjustment": -0.3,
          "rationale": "Two active owners with key customer relationships. Risk score of 6/10. Requires transition planning."
        },
        {
          "factor": "Customer Concentration",
          "adjustment": -0.1,
          "rationale": "Top customer at 15%, manageable but notable for service business."
        },
        {
          "factor": "Strong Financial Position",
          "adjustment": 0.2,
          "rationale": "Current ratio 2.57, minimal debt. Low financial risk for buyer."
        }
      ],
      "adjusted_multiple": 3.5,
      "indicated_value": 1992858
    },
    "revenue_multiple_method": {
      "revenue": 2500000,
      "base_multiple": 0.5,
      "base_multiple_source": "DealStats HVAC industry median revenue multiple",
      "adjustments": [
        {
          "factor": "High Profitability",
          "adjustment": 0.15,
          "rationale": "24% SDE margin vs. 18% industry median justifies premium to revenue multiple."
        },
        {
          "factor": "Growth Rate",
          "adjustment": 0.05,
          "rationale": "Above-average growth supports higher revenue multiple."
        },
        {
          "factor": "Business Mix",
          "adjustment": 0.05,
          "rationale": "Service agreements provide higher-margin recurring revenue."
        }
      ],
      "adjusted_multiple": 0.75,
      "indicated_value": 1875000
    },
    "rules_of_thumb": [
      {
        "rule": "HVAC: 1.0-1.5x revenue plus inventory",
        "calculation": "1.25 × $2,500,000 + $175,000 inventory = $3,300,000",
        "notes": "High end of range given profitability and service mix. Includes inventory."
      }
    ],
    "comparable_transactions": [
      {
        "description": "Regional HVAC company, similar size",
        "sale_price": 1850000,
        "sde_multiple": 3.2,
        "revenue_multiple": 0.68,
        "relevance_score": "High",
        "comparison_notes": "Similar market, slightly lower margins"
      }
    ],
    "reconciliation": {
      "sde_method_value": 1992858,
      "sde_method_weight": 70,
      "revenue_method_value": 1875000,
      "revenue_method_weight": 30,
      "reconciled_value": 1957458,
      "reconciliation_rationale": "SDE method weighted at 70% because: (1) business is profitable with stable earnings; (2) SDE is the primary metric for small business transactions; (3) revenue multiple is secondary validation. Both methods are directionally consistent (within 6%), supporting reliability."
    },
    "indicated_value_low": 1800000,
    "indicated_value_high": 2150000,
    "indicated_value_point": 1957458
  },
  "sensitivity_analysis": {
    "multiple_sensitivity": [
      { "multiple": 3.0, "indicated_value": 1708164 },
      { "multiple": 3.25, "indicated_value": 1850511 },
      { "multiple": 3.5, "indicated_value": 1992858 },
      { "multiple": 3.75, "indicated_value": 2135205 },
      { "multiple": 4.0, "indicated_value": 2277552 }
    ]
  },
  "narrative": {
    "title": "Market Approach Analysis",
    "content": "The market approach values a business based on pricing multiples derived from actual transactions of similar companies. This approach is particularly relevant for small businesses where market participants (buyers and sellers) commonly think in terms of multiples of earnings or revenue.\\n\\nFor the SDE multiple method, we selected a base multiple of 2.8x based on BizBuySell's 2024 median for HVAC service companies. This data represents hundreds of closed transactions and reflects what buyers are actually paying in the current market. We then adjusted this base multiple for company-specific factors.\\n\\nPositive adjustments totaling +1.1x were applied for: above-average profitability (+0.4x) given the company's 24% SDE margin versus the 18% industry median; recurring revenue base (+0.3x) reflecting the 35% of revenue from service agreements; strong growth (+0.2x) for the 14% revenue growth rate; and strong financial position (+0.2x) for the excellent liquidity and minimal debt. These factors make this company more attractive than the average HVAC business changing hands.\\n\\nNegative adjustments totaling -0.4x were applied for: owner dependence (-0.3x) because both owners maintain key customer relationships and are central to operations; and customer concentration (-0.1x) as the top customer represents 15% of revenue. The net result is an adjusted SDE multiple of 3.5x.\\n\\nApplying this multiple to the weighted average SDE of $569,388 yields an indicated value of approximately $1,993,000.\\n\\nAs secondary validation, we applied a revenue multiple analysis. Using a base revenue multiple of 0.5x from DealStats, adjusted to 0.75x for the company's strong profitability and growth, produces an indicated value of $1,875,000 on $2.5 million in revenue.\\n\\nReconciling these methods with 70% weight to SDE and 30% to revenue yields a market approach indication of $1,957,000. The two methods are within 6% of each other, providing confidence in the result.\\n\\nThe industry rule of thumb (1.0-1.5x revenue plus inventory) suggests a range of $2.7M to $3.9M, but this rule includes inventory and reflects full business value. Adjusting for our scope, it supports the indicated range.\\n\\nWe recommend weighting the market approach at 40% in the final value synthesis. While market data is highly relevant and buyers commonly use multiple-based thinking, the income approach's detailed rate build-up provides complementary insight into the risk-adjusted return. The market approach is limited by the need to adjust generalized industry multiples for company-specific factors, introducing some subjectivity.",
    "word_count": 418,
    "key_points": [
      "Base SDE multiple of 2.8x from BizBuySell transaction data",
      "Adjusted to 3.5x for company quality factors",
      "SDE method indicates $1,993,000",
      "Revenue method validates at $1,875,000",
      "Reconciled market approach value of $1,957,000"
    ]
  },
  "weighting_recommendation": {
    "suggested_weight": 40,
    "rationale": "Market approach weighted at 40% because: (1) This is a small business where market multiples are highly relevant; (2) Transaction data provides direct market evidence; (3) Both SDE and revenue methods produce consistent results. Weight balanced with income approach which provides detailed rate build-up analysis. Market approach somewhat limited by using generalized industry multiples rather than specific comparable transactions."
  },
  "extraction_metadata": {
    "processing_time_ms": 0,
    "tokens_used": 0
  }
}

## CRITICAL INSTRUCTIONS

1. **DOCUMENT MULTIPLE SOURCES**: Every base multiple needs a source (database, study, association).

2. **EXPLAIN EVERY ADJUSTMENT**: Each adjustment to the multiple requires:
   - The factor being adjusted for
   - The quantified adjustment (e.g., +0.3x)
   - Specific rationale referencing Pass 5/6 data

3. **SHOW YOUR MATH**: Display the build-up from base to adjusted multiple.

4. **USE BOTH METHODS**: SDE and revenue multiples provide validation.

5. **RECONCILE THOUGHTFULLY**: Weight the methods based on their reliability for this business.

6. **REFERENCE COMPARABLES**: If Pass 4 provided comparable transactions, discuss them.

7. **VALIDATE WITH RULES OF THUMB**: Industry rules of thumb provide sanity checks.

8. **SHOW SENSITIVITY**: Multiple variation shows the value range.

9. **WRITE NARRATIVE**: 500-600 word narrative suitable for final report.

10. **ASSIGN WEIGHT**: Recommend weight with clear rationale.

11. **OUTPUT ONLY JSON**: Your entire response must be valid JSON. No text before or after.

## CRITICAL QUALITY REQUIREMENTS

You are a Certified Valuation Analyst (CVA) with 20+ years of experience. Your work must meet professional standards.

### Documentation Standards
1. EVERY numerical value must cite its source (e.g., "Form 1120-S, Line 7: $125,000")
2. EVERY adjustment must include detailed justification (2-3 sentences minimum)
3. NEVER use vague language like "significant" - use specific numbers

### Narrative Standards
- Meet or EXCEED all word count minimums
- Write in professional, objective prose
- Reference specific numbers from the analysis
- Avoid boilerplate language - be specific to THIS business

### Professional Voice
Write as if this report will be:
- Presented to business owners making $500K+ decisions
- Reviewed by CPAs and attorneys
- Used as evidence in legal proceedings
- Submitted to SBA for loan approval

Now apply the market approach valuation.`;

export const pass9PromptConfig = {
  passNumber: 9,
  passName: 'Market Approach Valuation',
  systemPrompt: PASS_9_SYSTEM_PROMPT,
  userPrompt: PASS_9_USER_PROMPT,
  expectedOutputType: 'Pass9Output' as const,
  maxTokens: 6144,
  temperature: 0.2,
};

export default pass9PromptConfig;
