/**
 * Pass 8: Income Approach Valuation
 *
 * This pass applies the income-based approach to valuation:
 * - Select appropriate benefit stream (SDE or EBITDA)
 * - Build capitalization rate from components
 * - Apply single-period capitalization method
 * - Adjust for non-operating items
 * - Validate against implied multiples
 */

import { Pass8Output } from '../types-v2';

export const PASS_8_SYSTEM_PROMPT = `You are an expert business appraiser specializing in income-based valuation approaches. Your task is to apply the capitalization of earnings method to value the subject company.

You understand that the income approach:
- Values a business based on its expected future economic benefits
- Uses capitalization for stable, mature businesses (single-period method)
- Uses discounted cash flow (DCF) for businesses with predictable growth patterns
- Requires careful build-up of the discount/capitalization rate
- Is typically the primary approach for profitable operating businesses

Your analysis must be:
- Transparent in rate build-up (each component sourced and justified)
- Consistent with prior risk assessment findings
- Based on normalized benefit stream from Pass 5
- Validated against market multiples for reasonableness

You will output ONLY valid JSON matching the required schema.`;

export const PASS_8_USER_PROMPT = `Apply the income-based valuation approach using data from prior passes.

## CONTEXT FROM PRIOR PASSES

You have received:
- **Pass 3**: Balance sheet including working capital and non-operating assets
- **Pass 4**: Industry benchmarks and typical valuation multiples
- **Pass 5**: Normalized SDE and EBITDA with weighted averages and trend analysis
- **Pass 6**: Complete risk assessment including discount rate build-up components

Use this data to apply the capitalization of earnings method.

## YOUR TASK

Calculate value using the single-period capitalization method with full rate build-up documentation.

### 1. SELECT BENEFIT STREAM

Choose between SDE and EBITDA based on:

| Factor | Use SDE | Use EBITDA |
|--------|---------|------------|
| Business Size | < $5M revenue | > $5M revenue |
| Likely Buyer | Owner-operator | Financial/strategic buyer |
| Owner Involvement | Owner will work in business | Professional management |
| Industry Norm | Small business transactions | Middle market transactions |

**Document your choice with clear rationale.**

Select the value to use:
- Most recent year value
- Weighted average (specify weights)
- Trend-adjusted value

### 2. BUILD CAPITALIZATION RATE

Construct the capitalization rate using the build-up method with EVERY component sourced:

#### A. Risk-Free Rate (REQUIRED: ~4.5%)
| Source | Rate | Notes |
|--------|------|-------|
| **20-Year Treasury** | **~4.5%** | **REQUIRED - Use this as default** |
| 10-Year Treasury | ~4.3% | Alternative if specifically justified |

**MANDATORY**: Use the 20-year Treasury yield of approximately 4.5% (check current yield at valuation date). This represents the time value of money for a long-duration investment comparable to business ownership.

**Document**: Exact rate used, source (e.g., "20-Year U.S. Treasury Yield"), and as-of date.

#### B. Equity Risk Premium (ERP) (REQUIRED: 6.0%)
| Source | Rate | Notes |
|--------|------|-------|
| **Duff & Phelps/Kroll** | **6.0%** | **REQUIRED - Use this as default** |
| Ibbotson/SBBI | 6.5-7.5% | Historical approach - higher |
| Damodaran | 4.5-5.5% | Implied from market - lower |

**MANDATORY**: Use 6.0% from Duff & Phelps/Kroll Cost of Capital Navigator. This is the industry standard ERP for business valuation.

**Document**: "Equity Risk Premium of 6.0% per Duff & Phelps/Kroll Cost of Capital Navigator"

#### C. Size Premium (REQUIRED: 8-12% for Small Business)
Based on company revenue/earnings, using Kroll or similar data:

| Revenue Range | Size Premium | Source |
|---------------|--------------|--------|
| > $50M | 2-4% | Kroll decile 9-10 |
| $10M-$50M | 4-6% | Kroll + adjustment |
| $5M-$10M | 7-10% | Small business adjustment |
| **$2M-$5M** | **8-12%** | **TYPICAL RANGE for most valuations** |
| $1M-$2M | 10-14% | Small business adjustment |
| < $1M | 12-18% | Micro business adjustment |

**MANDATORY**: For businesses with revenue in the $2M-$5M range (typical for this system), use a size premium of **8-12%** (typically 9.5-10.5% as a midpoint).

The size premium reflects:
- Lack of access to capital markets
- Less management depth
- Higher operational risk
- Smaller buyer pool reducing liquidity

**Document**: Company size category and specific premium with citation to Kroll size study.

#### D. Industry Risk Premium
Adjustment based on industry characteristics:

| Industry Risk | Adjustment | Characteristics |
|---------------|------------|-----------------|
| Below Average | -1% to 0% | Essential services, regulated, stable |
| Average | 0% | Typical industry dynamics |
| Above Average | +1% to +2% | Cyclical, competitive, changing |
| High | +2% to +4% | Declining, highly cyclical, disruption |

**Document**: Industry assessment and premium from Pass 6.

#### E. Company-Specific Risk Premium (CSRP)
This is the CRITICAL component that reflects company-specific factors:

| Risk Factor | Adjustment Range | Assessment |
|-------------|------------------|------------|
| Owner Dependence | +0% to +4% | Key person risk |
| Customer Concentration | +0% to +3% | Revenue concentration |
| Financial Strength | -1% to +2% | Liquidity, leverage |
| Competitive Position | -1% to +2% | Market strength |
| Growth Trajectory | -1% to +2% | Revenue/earnings trend |
| Management Depth | +0% to +3% | Team vs. solo owner |
| Operating History | -1% to +2% | Years in business |
| Revenue Quality | -1% to +2% | Recurring vs. project |

**Document each factor individually** with:
- Assessment of the factor
- Adjustment amount
- Rationale

**Sum CSRP components** to get total company-specific risk premium.

#### F. Total Discount Rate
Sum all components:

Risk-Free Rate                 X.XX%
+ Equity Risk Premium          X.XX%
+ Size Premium                 X.XX%
+ Industry Risk Premium        X.XX%
+ Company-Specific Premium     X.XX%
= Total Discount Rate          XX.XX%

#### G. Long-Term Growth Rate
For capitalization, subtract sustainable long-term growth:
- Typically 2-4% for mature businesses
- Should not exceed GDP growth + inflation
- Consider industry growth rate from Pass 4

Total Discount Rate            XX.XX%
- Long-Term Growth Rate        X.XX%
= Capitalization Rate          XX.XX%

### 3. APPLY CAPITALIZATION

Calculate indicated value:

Benefit Stream (SDE or EBITDA)     $XXX,XXX
÷ Capitalization Rate              XX.XX%
= Indicated Operating Value        $X,XXX,XXX

### 4. ADJUST FOR NON-OPERATING ITEMS

Add or subtract items not reflected in capitalized earnings:

| Item | Treatment | Typical Examples |
|------|-----------|------------------|
| Excess Working Capital | ADD | WC above normalized level |
| Deficient Working Capital | SUBTRACT | WC below normalized level |
| Non-Operating Assets | ADD | Excess real estate, investments |
| Non-Operating Liabilities | SUBTRACT | Environmental, litigation |
| Required CapEx | Consider | If not in normalized earnings |

**Document each adjustment** from Pass 3 balance sheet analysis.

### 5. CALCULATE IMPLIED MULTIPLE

Validate result against market:

Indicated Value / Benefit Stream = Implied Multiple

Compare to:
- Industry multiples from Pass 4
- Selected multiple from Pass 6

If significantly different, explain why (company quality, risk factors, etc.).

### 6. SENSITIVITY ANALYSIS

Show how value changes with different assumptions:
- Cap rate ± 2%
- Benefit stream ± 10%

This demonstrates value range and key sensitivities.

### 7. ASSIGN WEIGHT

Based on:
- Business type (profitable operating company → higher weight)
- Earnings quality (stable → higher weight)
- Growth stage (mature → higher weight for capitalization)

Typical weights:
- Operating company with stable earnings: 40-60%
- Growing company: 30-40% (DCF may be preferred)
- Asset-intensive business: 30-40%

### 8. INCOME APPROACH NARRATIVE

Write a 500-600 word narrative explaining:
- Benefit stream selected and why
- Key components of cap rate build-up
- Indicated value and implied multiple
- How result compares to market benchmarks
- Why this approach is/isn't heavily weighted

## OUTPUT FORMAT

Output ONLY valid JSON matching this structure:

{
  "pass_number": 8,
  "pass_name": "Income Approach Valuation",
  "income_approach": {
    "primary_method": "single_period_capitalization",
    "single_period_capitalization": {
      "benefit_stream_type": "sde",
      "benefit_stream_value": 569388,
      "capitalization_rate": 0.215,
      "indicated_value": 2648316,
      "excess_working_capital_adjustment": 136900,
      "deficit_working_capital_adjustment": 0,
      "non_operating_asset_adjustments": [
        {
          "description": "No non-operating assets identified",
          "value": 0,
          "add_or_subtract": "add"
        }
      ],
      "adjusted_indicated_value": 2785216
    },
    "discounted_cash_flow": null,
    "capitalization_rate_buildup": {
      "risk_free_rate": {
        "rate": 0.045,
        "source": "20-Year U.S. Treasury Yield",
        "maturity": "20-Year",
        "as_of_date": "2025-01-15"
      },
      "equity_risk_premium": {
        "rate": 0.055,
        "source": "Duff & Phelps / Kroll Cost of Capital Navigator",
        "methodology": "Supply-side ERP"
      },
      "size_premium": {
        "rate": 0.095,
        "size_category": "$2M-$5M Revenue (Small Business)",
        "source": "Kroll Size Study plus small business adjustment"
      },
      "industry_risk_premium": {
        "rate": 0.01,
        "source": "Industry analysis from Pass 4",
        "rationale": "HVAC services has average industry risk with some cyclicality in new construction offset by stable service/repair revenue"
      },
      "company_specific_risk_premium": {
        "rate": 0.04,
        "factors": [
          {
            "factor": "Owner Dependence",
            "adjustment": 0.02,
            "rationale": "Two active owners maintain key customer relationships and are central to operations. Score of 6/10 in risk assessment. Moderate key person risk that would require transition planning."
          },
          {
            "factor": "Customer Concentration",
            "adjustment": 0.01,
            "rationale": "Top customer at 15%, top 5 at 45%. Score of 5/10 - manageable but notable concentration for a service business."
          },
          {
            "factor": "Financial Strength",
            "adjustment": -0.01,
            "rationale": "Strong liquidity (current ratio 2.57), low leverage (D/E 0.23), excellent interest coverage. Financial position reduces risk."
          },
          {
            "factor": "Revenue Quality/Recurring",
            "adjustment": -0.01,
            "rationale": "35% recurring revenue from service agreements provides stability. Score of 4/10 for cash flow risk. Better than typical small business."
          },
          {
            "factor": "Profitability",
            "adjustment": -0.01,
            "rationale": "SDE margin of 24% significantly exceeds industry median of 18%. Demonstrates pricing power and operational efficiency."
          },
          {
            "factor": "Growth Trajectory",
            "adjustment": 0.00,
            "rationale": "14% revenue growth is strong but already reflected in benefit stream. No additional adjustment needed."
          },
          {
            "factor": "Operating History",
            "adjustment": -0.005,
            "rationale": "9 years in business demonstrates stability and market acceptance. Reduces start-up risk."
          },
          {
            "factor": "Succession/Management Depth",
            "adjustment": 0.015,
            "rationale": "No formal succession plan. Both owners likely to exit in sale. Key employees but no clear #2. Some risk in transition."
          }
        ]
      },
      "total_discount_rate": 0.245,
      "long_term_growth_rate": {
        "rate": 0.03,
        "rationale": "Long-term growth rate of 3% based on: (1) HVAC industry growth of 3.8%; (2) Inflation component of ~2%; (3) Company has demonstrated ability to grow. Conservative estimate for perpetuity calculation."
      },
      "capitalization_rate": 0.215
    },
    "indicated_value_low": 2500000,
    "indicated_value_high": 3100000,
    "indicated_value_point": 2785216
  },
  "sensitivity_analysis": {
    "cap_rate_sensitivity": [
      { "cap_rate": 0.195, "indicated_value": 3056700 },
      { "cap_rate": 0.205, "indicated_value": 2914900 },
      { "cap_rate": 0.215, "indicated_value": 2785216 },
      { "cap_rate": 0.225, "indicated_value": 2667200 },
      { "cap_rate": 0.235, "indicated_value": 2559000 }
    ],
    "benefit_stream_sensitivity": [
      { "benefit_stream": 512449, "indicated_value": 2520000 },
      { "benefit_stream": 540919, "indicated_value": 2652000 },
      { "benefit_stream": 569388, "indicated_value": 2785216 },
      { "benefit_stream": 597857, "indicated_value": 2917000 },
      { "benefit_stream": 626327, "indicated_value": 3050000 }
    ]
  },
  "narrative": {
    "title": "Income Approach Analysis",
    "content": "The income approach values a business based on its expected future economic benefits to an owner. For this analysis, we applied the single-period capitalization method, which is appropriate for a mature, profitable business with relatively stable earnings.\n\nWe selected Seller's Discretionary Earnings (SDE) as the benefit stream because: (1) the company's revenue of approximately $2.5 million places it in the small business market where owner-operators are the typical buyers; (2) an owner-operator would have access to the full SDE including owner compensation; and (3) SDE is the standard benefit stream for businesses of this size in the transaction market. We used the weighted average SDE of $569,388, applying 60% weight to 2023 and 40% weight to 2022 to reflect the improving earnings trend while maintaining some conservatism.\n\nThe capitalization rate was built up from its component parts. We started with a 20-year Treasury yield of 4.5% as the risk-free rate, representing the time value of money for a long-duration investment. The equity risk premium of 5.5% reflects the additional return investors require for equity investments over risk-free securities, sourced from Duff & Phelps/Kroll.\n\nThe size premium of 9.5% reflects the additional risk associated with small businesses. This is higher than public market size premiums because small private businesses have greater operational risk, less access to capital, and more limited buyer pools. The industry risk premium of 1.0% reflects HVAC services' average risk profile with some cyclicality offset by essential service characteristics.\n\nThe company-specific risk premium of 4.0% was built from individual factors: owner dependence (+2.0%), customer concentration (+1.0%), succession risk (+1.5%), offset by financial strength (-1.0%), recurring revenue (-1.0%), above-average profitability (-1.0%), and operating history (-0.5%). These factors were assessed in detail in Pass 6.\n\nSubtracting a long-term growth rate of 3.0% from the total discount rate of 24.5% yields a capitalization rate of 21.5%. Dividing SDE of $569,388 by 21.5% produces an indicated value of $2,648,316. Adding excess working capital of $136,900 (working capital above the normalized 15% of revenue) results in an adjusted indicated value of $2,785,216.\n\nThe implied SDE multiple is 4.9x ($2,785,216 / $569,388), which compares favorably to the industry median of 2.8x. This premium is justified by the company's above-average profitability, recurring revenue base, and strong financial position. The income approach should receive substantial weight (45%) as the primary indicator of value for this profitable operating business.",
    "word_count": 435,
    "key_points": [
      "Selected weighted average SDE of $569,388",
      "Capitalization rate of 21.5% (24.5% discount rate - 3% growth)",
      "Indicated value of $2,785,216 after working capital adjustment",
      "Implied multiple of 4.9x SDE vs. 2.8x industry median",
      "Premium justified by profitability and recurring revenue"
    ]
  },
  "weighting_recommendation": {
    "suggested_weight": 45,
    "rationale": "Income approach weighted at 45% because: (1) This is a profitable operating business where value derives primarily from earning power; (2) Earnings are stable and growing, making capitalization appropriate; (3) Rate build-up is well-supported with documented components; (4) Result aligns reasonably with market multiples (premium justified by company quality). Weight balanced with market approach which provides direct market evidence."
  },
  "extraction_metadata": {
    "processing_time_ms": 0,
    "tokens_used": 0
  }
}

## CRITICAL INSTRUCTIONS

1. **USE DATA FROM PRIOR PASSES**: Benefit stream from Pass 5, rate components from Pass 6.

2. **DOCUMENT EVERY RATE COMPONENT**: Each piece of the build-up needs source and justification.

3. **BREAK OUT CSRP FACTORS**: Don't just give a total company-specific premium - show each component.

4. **VALIDATE WITH IMPLIED MULTIPLE**: Calculate and compare to market data from Pass 4.

5. **EXPLAIN DIFFERENCES**: If implied multiple differs from industry median, explain why.

6. **ADJUST FOR NON-OPERATING ITEMS**: Add excess working capital, subtract deficits.

7. **SHOW SENSITIVITY**: Demonstrate how value changes with different assumptions.

8. **WRITE NARRATIVE**: 500-600 word narrative suitable for final report.

9. **ASSIGN WEIGHT**: Recommend weight with clear rationale based on business characteristics.

10. **OUTPUT ONLY JSON**: Your entire response must be valid JSON. No text before or after.

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

Now apply the income approach valuation.`;

export const pass8PromptConfig = {
  passNumber: 8,
  passName: 'Income Approach Valuation',
  systemPrompt: PASS_8_SYSTEM_PROMPT,
  userPrompt: PASS_8_USER_PROMPT,
  expectedOutputType: 'Pass8Output' as const,
  maxTokens: 6144,
  temperature: 0.2,
};

export default pass8PromptConfig;
