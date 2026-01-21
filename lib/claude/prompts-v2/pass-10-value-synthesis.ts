/**
 * Pass 10: Value Synthesis & Reconciliation
 *
 * This pass synthesizes all valuation approaches:
 * - Summarize all three approaches with values and weights
 * - Calculate weighted average preliminary value
 * - Apply discounts/premiums (DLOM, DLOC, etc.)
 * - Working capital adjustments
 * - Calculate final concluded value
 * - Determine reasonable valuation range
 * - Assess confidence level
 */

import { Pass10Output } from '../types-v2';

export const PASS_10_SYSTEM_PROMPT = `You are an expert business appraiser performing the critical task of synthesizing multiple valuation approaches into a final concluded value. This is where professional judgment is most important.

You understand that value synthesis requires:
- Careful weighting of approaches based on reliability and appropriateness
- Transparent documentation of all adjustments
- Application of appropriate discounts for marketability and control
- Professional judgment in reconciling different indications
- Clear articulation of the reasoning behind the final conclusion

Your analysis must be:
- Logically consistent with findings from all prior passes
- Transparent in weighting decisions and adjustments
- Compliant with professional valuation standards
- Supported by documented evidence and reasoning

You will output ONLY valid JSON matching the required schema.`;

export const PASS_10_USER_PROMPT = `Synthesize all valuation approaches into a final concluded value.

## CONTEXT FROM PRIOR PASSES

You have received:
- **Pass 1**: Company profile, ownership structure, purpose of valuation
- **Pass 3**: Balance sheet including working capital analysis
- **Pass 4**: Industry benchmarks and market data
- **Pass 5**: Normalized earnings (SDE and EBITDA)
- **Pass 6**: Risk assessment and discount rate components
- **Pass 7**: Asset approach indication with weight recommendation
- **Pass 8**: Income approach indication with weight recommendation
- **Pass 9**: Market approach indication with weight recommendation

Use this data to synthesize a final concluded value.

## YOUR TASK

### 1. SUMMARIZE VALUATION APPROACHES

Present all three approaches with their indicated values and recommended weights:

| Approach | Indicated Value | Recommended Weight | Rationale for Weight |
|----------|-----------------|-------------------|----------------------|
| Asset Approach | $X,XXX,XXX | XX% | From Pass 7 |
| Income Approach | $X,XXX,XXX | XX% | From Pass 8 |
| Market Approach | $X,XXX,XXX | XX% | From Pass 9 |

**Critical**: Weights must sum to 100%.

#### Weighting Considerations

| Factor | Asset Weight | Income Weight | Market Weight |
|--------|--------------|---------------|---------------|
| Profitable operating business | Lower | Higher | Higher |
| Asset-intensive business | Higher | Lower | Moderate |
| Holding company | Highest | Low | Low |
| Growth business | Lower | Moderate | Higher |
| Stable mature business | Moderate | Highest | Moderate |
| Distressed/turnaround | Higher | Lower | Lower |
| High quality market data | - | - | Higher |
| Volatile earnings | Lower | Lower | Higher |

**Document your weighting rationale** based on business characteristics from Pass 1 and 6.

### 2. CALCULATE WEIGHTED AVERAGE VALUE

\`\`\`
Asset Approach:    $X,XXX,XXX × XX% = $X,XXX,XXX
Income Approach:   $X,XXX,XXX × XX% = $X,XXX,XXX
Market Approach:   $X,XXX,XXX × XX% = $X,XXX,XXX
                                      ───────────
Weighted Average Preliminary Value:   $X,XXX,XXX
\`\`\`

### 3. APPLY DISCOUNTS AND PREMIUMS

#### A. Discount for Lack of Marketability (DLOM)

DLOM reflects the difficulty of selling a privately-held interest compared to publicly-traded securities.

**DLOM Support from Studies:**

| Study Type | Typical Range | Application |
|------------|---------------|-------------|
| Restricted Stock Studies | 15-35% | Marketable but restricted |
| Pre-IPO Studies | 30-50% | Private vs. public |
| Mandelbaum Factors | Varies | Factor-based adjustment |

**Factors Affecting DLOM:**

| Factor | Impact on DLOM | Subject Company Assessment |
|--------|----------------|---------------------------|
| Size of interest | Larger = lower DLOM | XX% interest |
| Dividend history | Dividends = lower DLOM | Regular/None |
| Prospect of sale/IPO | High = lower DLOM | Assessment |
| Restrictions on transfer | More = higher DLOM | Standard/Restrictive |
| Financial performance | Strong = lower DLOM | From Pass 5/6 |
| Industry | Attractive = lower DLOM | From Pass 4 |

**DLOM Selection:**
- Selected DLOM: XX%
- Range considered: XX% - XX%
- Primary supporting study: [Name and cite]
- Rationale for selection within range

**Important**: For controlling interests, DLOM is typically lower (10-25%) than minority interests (20-40%).

#### B. Discount for Lack of Control (DLOC)

DLOC applies when valuing minority interests without control.

| Interest Type | DLOC Application |
|---------------|------------------|
| 100% ownership | No DLOC (full control) |
| 51%+ controlling | No DLOC or minimal |
| Significant minority (25-50%) | 0-15% |
| Small minority (< 25%) | 15-30% |

**DLOC Selection:**
- Ownership interest being valued: XX%
- Selected DLOC: XX%
- Rationale: [Control rights, blocking positions, etc.]

**Note**: Asset approach typically produces control value; market approach may need adjustment based on transaction type.

#### C. Other Adjustments

| Adjustment | Amount | Rationale |
|------------|--------|-----------|
| Key person discount | -X% | If owner is leaving and critical |
| Strategic premium | +X% | If strategic buyer likely |
| Trapped-in capital gains | -$X | Embedded tax liability in assets |
| Contingent liabilities | -$X | Known but unrecorded liabilities |

### 4. WORKING CAPITAL ADJUSTMENT

If not already reflected in the approaches, adjust for working capital:

| Item | Amount | Notes |
|------|--------|-------|
| Required working capital | $XXX,XXX | Typically 10-20% of revenue |
| Actual working capital | $XXX,XXX | From Pass 3 |
| Excess/(Deficit) | $XXX,XXX | Adjustment to value |

**Note**: Check whether each approach already includes this adjustment to avoid double-counting.

### 5. CALCULATE FINAL CONCLUDED VALUE

\`\`\`
Weighted Average Preliminary Value    $X,XXX,XXX
Less: DLOM (XX%)                      ($XXX,XXX)
Less: DLOC (XX%)                      ($XXX,XXX)
Plus/Less: Other Adjustments          $XXX,XXX
Plus/Less: Working Capital Adj.       $XXX,XXX
                                      ───────────
Final Concluded Value:                $X,XXX,XXX
\`\`\`

### 6. DETERMINE VALUATION RANGE

Professional appraisals typically present a range reflecting inherent uncertainty:

| Range Width | Appropriate When |
|-------------|------------------|
| ±10-15% | High confidence, consistent approaches |
| ±15-20% | Normal uncertainty, typical engagement |
| ±20-25% | Higher uncertainty, divergent approaches |
| ±25%+ | Significant uncertainty, limited data |

**Range Calculation:**
\`\`\`
Concluded Value:        $X,XXX,XXX
Low End (−XX%):        $X,XXX,XXX
High End (+XX%):       $X,XXX,XXX
Valuation Range:       $X,XXX,XXX to $X,XXX,XXX
\`\`\`

**Factors supporting range width:**
- Consistency of approaches (closer = narrower range)
- Quality of data
- Business stability
- Market conditions

### 7. CONFIDENCE ASSESSMENT

Rate confidence in the concluded value:

| Dimension | Score (1-10) | Notes |
|-----------|--------------|-------|
| Data quality | X | Completeness of financials |
| Approach consistency | X | How close were the three approaches |
| Rate/multiple support | X | Quality of comparable data |
| Business stability | X | Predictability of earnings |
| Overall confidence | X | Weighted average |

**Confidence Level:**
- High (8-10): Strong data, consistent approaches, stable business
- Moderate (5-7): Adequate data, some divergence, normal uncertainty
- Low (< 5): Limited data, significant divergence, high uncertainty

### 8. VALUE SYNTHESIS NARRATIVE

Write a 600-800 word narrative explaining:
- Why each approach received its weight
- How the approaches correlated (consistency check)
- Rationale for DLOM selection with supporting studies
- Any other adjustments and why
- The concluded value and what it represents
- The valuation range and confidence level
- Key factors that could change the value

## OUTPUT FORMAT

Output ONLY valid JSON matching this structure:

{
  "pass_number": 10,
  "pass_name": "Value Synthesis & Reconciliation",
  "value_synthesis": {
    "approach_summary": [
      {
        "approach": "Asset Approach",
        "indicated_value": 1850000,
        "weight": 15,
        "weight_rationale": "Asset approach receives lower weight (15%) because this is a profitable operating business where value derives primarily from earning power, not asset values. The adjusted net asset value of $1.85M represents a floor value but understates the intangible value of customer relationships, reputation, and trained workforce."
      },
      {
        "approach": "Income Approach",
        "indicated_value": 2785216,
        "weight": 45,
        "weight_rationale": "Income approach receives significant weight (45%) because: (1) business is profitable with stable, growing earnings; (2) capitalization rate build-up is well-documented with each component sourced; (3) single-period capitalization is appropriate for this mature business. The implied multiple of 4.9x SDE is supported by company quality factors."
      },
      {
        "approach": "Market Approach",
        "indicated_value": 1957458,
        "weight": 40,
        "weight_rationale": "Market approach receives substantial weight (40%) because: (1) SDE multiples from transaction databases are highly relevant for small business valuations; (2) buyers and sellers in this market use multiple-based thinking; (3) both SDE and revenue methods produced consistent results. Limitation is use of generalized industry multiples vs. specific comparables."
      }
    ],
    "weighted_average_calculation": {
      "asset_contribution": 277500,
      "income_contribution": 1253347,
      "market_contribution": 782983,
      "preliminary_value": 2313830
    },
    "discounts_and_premiums": {
      "dlom": {
        "selected_rate": 0.15,
        "range_low": 0.10,
        "range_high": 0.25,
        "supporting_studies": [
          {
            "study_name": "FMV Opinions Restricted Stock Study",
            "indicated_discount": 0.18,
            "relevance": "Restricted stock studies show 15-25% discount for lack of marketability"
          },
          {
            "study_name": "Stout Restricted Stock Study",
            "indicated_discount": 0.16,
            "relevance": "Recent study supporting mid-range DLOM"
          }
        ],
        "mandelbaum_factors": [
          {
            "factor": "Financial statement analysis",
            "impact": "Reduces DLOM",
            "rationale": "Strong financials with above-average profitability"
          },
          {
            "factor": "Company's dividend policy",
            "impact": "Increases DLOM slightly",
            "rationale": "Irregular distributions typical of S-corp"
          },
          {
            "factor": "Nature of the company",
            "impact": "Neutral",
            "rationale": "Established operating business"
          },
          {
            "factor": "Company management",
            "impact": "Increases DLOM slightly",
            "rationale": "Owner-dependent operations"
          },
          {
            "factor": "Restrictions on transferability",
            "impact": "Neutral",
            "rationale": "Standard S-corp restrictions"
          },
          {
            "factor": "Holding period",
            "impact": "Increases DLOM slightly",
            "rationale": "Private company with uncertain exit timeline"
          },
          {
            "factor": "Company redemption policy",
            "impact": "Neutral to negative",
            "rationale": "No formal redemption policy"
          },
          {
            "factor": "Costs associated with IPO",
            "impact": "N/A",
            "rationale": "IPO not viable for company of this size"
          }
        ],
        "rationale": "Selected 15% DLOM at the lower end of the range because: (1) 100% controlling interest being valued; (2) strong financial performance reduces marketability concerns; (3) HVAC service businesses have active buyer markets; (4) company size and profitability make it attractive to multiple buyer types. Restricted stock studies support this level."
      },
      "dloc": {
        "selected_rate": 0,
        "ownership_percentage": 100,
        "rationale": "No discount for lack of control applied because a 100% controlling interest is being valued. Owner has full control over all business decisions including sale, liquidation, distributions, and strategic direction."
      },
      "other_adjustments": [
        {
          "description": "No additional adjustments required",
          "amount": 0,
          "rationale": "No key person discount applied as both owners are expected to transition with the business. No strategic premium as valuation assumes financial buyer. No trapped-in capital gains as asset values are close to tax basis."
        }
      ]
    },
    "working_capital_adjustment": {
      "required_working_capital": 375000,
      "actual_working_capital": 511900,
      "excess_or_deficit": 136900,
      "already_reflected_in_approaches": true,
      "additional_adjustment": 0,
      "notes": "Excess working capital of $136,900 was already added in the income approach (Pass 8). Asset approach inherently includes all working capital. Market approach uses multiples that assume normalized working capital. No additional adjustment needed to avoid double-counting."
    },
    "final_value_calculation": {
      "preliminary_value": 2313830,
      "dlom_amount": 347075,
      "dloc_amount": 0,
      "other_adjustments_total": 0,
      "working_capital_adjustment": 0,
      "final_concluded_value": 1966755
    },
    "valuation_range": {
      "range_percentage": 17.5,
      "low_value": 1625000,
      "high_value": 2310000,
      "point_estimate": 1966755,
      "range_rationale": "Range of ±17.5% (approximately $1.6M to $2.3M) reflects: (1) moderate divergence between approaches (asset approach lower, income approach higher); (2) good quality financial data with 2 years of complete records; (3) some uncertainty in capitalization rate components; (4) normal uncertainty typical of small business valuations. Point estimate of approximately $2.0M represents our best judgment within this range."
    },
    "confidence_assessment": {
      "data_quality_score": 7,
      "approach_consistency_score": 6,
      "rate_multiple_support_score": 7,
      "business_stability_score": 8,
      "overall_confidence_score": 7,
      "confidence_level": "Moderate-High",
      "confidence_notes": "Overall confidence is moderate-high based on: good quality financial data and documentation; some divergence between approaches (expected given different methodologies); well-supported capitalization rate build-up; stable, profitable business with growth trajectory. Primary uncertainty relates to company-specific risk premium estimation and market multiple adjustments."
    }
  },
  "narrative": {
    "title": "Value Synthesis & Reconciliation",
    "content": "The final step in the valuation process is synthesizing the three approaches into a concluded value. This requires careful weighting of each approach based on its reliability and appropriateness for the subject company, followed by application of appropriate discounts.\\n\\nWe weighted the income approach at 45% because it directly values the company's earning power, which is the primary source of value for a profitable operating business. The capitalization of earnings method is well-suited for this mature, stable business with predictable earnings. The build-up method for the capitalization rate provides a transparent, component-based discount rate that reflects the specific risks of this investment.\\n\\nThe market approach received 40% weight because transaction multiples provide direct evidence of what buyers are paying for similar businesses. Small business buyers and sellers commonly think in terms of SDE multiples, making this approach highly relevant. Both the SDE multiple and revenue multiple methods produced consistent results, supporting the reliability of this indication. The limitation is reliance on industry-wide multiples rather than specific comparable transactions.\\n\\nThe asset approach received 15% weight because, while it provides a useful floor value, it understates the intangible value of this going concern. Customer relationships, trained workforce, reputation, and operating systems create value beyond the adjusted net asset value. Asset-based values are most relevant for asset-intensive or holding companies, neither of which describes this operating service business.\\n\\nThe weighted average of the three approaches yields a preliminary value of approximately $2.31 million. We then applied a 15% Discount for Lack of Marketability (DLOM) to reflect the difficulty of selling a privately-held business interest compared to publicly-traded securities. The selected DLOM is at the lower end of the typical range (10-25% for controlling interests) because: the company has strong financial performance; HVAC service businesses have active buyer markets; and the 100% controlling interest provides maximum flexibility for sale. Restricted stock studies support this level, with the FMV Opinions study indicating approximately 18% and the Stout study indicating approximately 16%.\\n\\nNo Discount for Lack of Control was applied because we are valuing a 100% controlling interest. The owner has complete control over operations, strategic direction, distributions, and the decision to sell.\\n\\nAfter applying the 15% DLOM, the final concluded value is approximately $1.97 million, which we round to $2.0 million for the point estimate. We present this with a range of $1.6 million to $2.3 million (±17.5%) reflecting the inherent uncertainty in small business valuations.\\n\\nOur confidence level is moderate-high. The financial data is complete and well-documented. The three approaches, while showing some divergence (expected given their different methodologies), are directionally consistent. The divergence primarily reflects the difference between asset-based floor value and the premium value associated with superior earning power. The income approach's higher indication is supported by the company's above-average profitability, recurring revenue base, and growth trajectory.\\n\\nKey factors that could affect this value include: changes in earnings performance; shifts in the interest rate environment affecting discount rates; industry consolidation affecting market multiples; and the specific circumstances of any actual transaction including buyer type and deal structure.",
    "word_count": 548,
    "key_points": [
      "Income approach weighted 45%, market approach 40%, asset approach 15%",
      "Preliminary weighted value of $2.31 million",
      "15% DLOM applied for controlling interest in private company",
      "Final concluded value of approximately $2.0 million",
      "Valuation range of $1.6M to $2.3M with moderate-high confidence"
    ]
  },
  "extraction_metadata": {
    "processing_time_ms": 0,
    "tokens_used": 0
  }
}

## CRITICAL INSTRUCTIONS

1. **WEIGHTS MUST SUM TO 100%**: Verify approach weights total 100%.

2. **DOCUMENT WEIGHTING RATIONALE**: Each approach weight needs specific justification based on business characteristics.

3. **SUPPORT DLOM SELECTION**: Cite specific studies and factors supporting the selected discount.

4. **CHECK FOR DOUBLE-COUNTING**: Verify working capital and other items aren't counted multiple times.

5. **SHOW ALL MATH**: Display weighted average calculation and final value build-up clearly.

6. **RANGE REFLECTS UNCERTAINTY**: Wider range for less certain valuations.

7. **CONFIDENCE IS HONEST**: Don't overstate confidence; acknowledge limitations.

8. **NARRATIVE EXPLAINS JUDGMENT**: The synthesis narrative should articulate professional reasoning.

9. **CONSISTENCY CHECK**: Verify the concluded value makes sense relative to individual approaches.

10. **OUTPUT ONLY JSON**: Your entire response must be valid JSON. No text before or after.

Now synthesize the valuation approaches into a final concluded value.`;

export const pass10PromptConfig = {
  passNumber: 10,
  passName: 'Value Synthesis & Reconciliation',
  systemPrompt: PASS_10_SYSTEM_PROMPT,
  userPrompt: PASS_10_USER_PROMPT,
  expectedOutputType: 'Pass10Output' as const,
  maxTokens: 8192,
  temperature: 0.2,
};

export default pass10PromptConfig;
