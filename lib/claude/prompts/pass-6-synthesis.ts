// Pass 6: Final Synthesis and Report Generation
// Combines all passes into complete valuation report with narratives

import {
  PassOutput,
  Pass6Analysis,
  Pass1Analysis,
  Pass2Analysis,
  Pass3Analysis,
  Pass4Analysis,
  Pass5Analysis,
  FinalValuationOutput,
  PASS_CONFIGS
} from '../types';

// ============================================================================
// OUTPUT SCHEMA (Matches PDF generation requirements)
// ============================================================================

export const OUTPUT_SCHEMA = `
## COMPLETE OUTPUT SCHEMA

Your output must exactly match this JSON structure for PDF generation:

\`\`\`json
{
  "valuation_summary": {
    "company_name": "string",
    "valuation_date": "YYYY-MM-DD",
    "report_date": "YYYY-MM-DD",
    "prepared_by": "AI-Assisted Valuation Analysis",
    "standard_of_value": "Fair Market Value",
    "premise_of_value": "Going Concern",
    "concluded_value": 0,
    "value_range_low": 0,
    "value_range_high": 0,
    "confidence_level": "High | Medium | Low"
  },

  "company_overview": {
    "business_name": "string",
    "legal_entity_type": "string (S-Corp, C-Corp, LLC, Partnership, Sole Proprietorship)",
    "industry": "string",
    "naics_code": "string",
    "years_in_business": 0,
    "location": "string (City, State)",
    "number_of_employees": 0,
    "business_description": "string (2-3 sentences)",
    "products_services": ["string"],
    "key_customers": "string (description, not names)",
    "competitive_advantages": ["string"],
    "ownership_structure": "string"
  },

  "financial_summary": {
    "fiscal_year_end": "string (e.g., December 31)",
    "years_analyzed": [2021, 2022, 2023],
    "revenue_trend": {
      "amounts": [0, 0, 0],
      "growth_rates": [0, 0],
      "trend_description": "Increasing | Stable | Decreasing | Volatile"
    },
    "profitability": {
      "gross_margin_avg": 0,
      "operating_margin_avg": 0,
      "net_margin_avg": 0
    },
    "balance_sheet_summary": {
      "total_assets": 0,
      "total_liabilities": 0,
      "book_value_equity": 0,
      "working_capital": 0,
      "debt_to_equity_ratio": 0
    },
    "cash_flow_indicators": {
      "operating_cash_flow_estimate": 0,
      "capex_requirements": "Low | Moderate | High",
      "working_capital_needs": "Low | Moderate | High"
    }
  },

  "normalized_earnings": {
    "sde_analysis": {
      "years": [2021, 2022, 2023],
      "reported_net_income": [0, 0, 0],
      "total_add_backs": [0, 0, 0],
      "annual_sde": [0, 0, 0],
      "weighted_average_sde": 0,
      "add_back_categories": [
        {
          "category": "string",
          "description": "string",
          "amount": 0,
          "justification": "string"
        }
      ]
    },
    "ebitda_analysis": {
      "years": [2021, 2022, 2023],
      "annual_ebitda": [0, 0, 0],
      "weighted_average_ebitda": 0,
      "ebitda_margin_avg": 0
    },
    "benefit_stream_selection": {
      "selected_metric": "SDE | EBITDA",
      "selected_amount": 0,
      "selection_rationale": "string"
    }
  },

  "industry_analysis": {
    "industry_name": "string",
    "sector": "string",
    "market_size": "string (e.g., '$50B nationally')",
    "growth_outlook": "Strong Growth | Moderate Growth | Stable | Declining",
    "competitive_landscape": "Fragmented | Moderately Concentrated | Highly Concentrated",
    "key_success_factors": ["string"],
    "industry_risks": ["string"],
    "industry_multiples": {
      "sde_multiple_range": { "low": 0, "median": 0, "high": 0 },
      "ebitda_multiple_range": { "low": 0, "median": 0, "high": 0 },
      "revenue_multiple_range": { "low": 0, "median": 0, "high": 0 }
    },
    "comparable_transactions_summary": "string"
  },

  "risk_assessment": {
    "overall_risk_score": 0,
    "risk_category": "Low | Below Average | Average | Above Average | Elevated | High | Very High",
    "risk_factors": [
      {
        "factor": "string",
        "weight": 0,
        "score": 0,
        "weighted_score": 0,
        "assessment": "string"
      }
    ],
    "key_risks": ["string"],
    "risk_mitigants": ["string"],
    "multiple_adjustment": {
      "base_adjustment": 0,
      "rationale": "string"
    }
  },

  "valuation_approaches": {
    "asset_approach": {
      "methodology": "Adjusted Net Asset Value",
      "book_value_equity": 0,
      "asset_adjustments": 0,
      "liability_adjustments": 0,
      "adjusted_net_asset_value": 0,
      "weight_in_conclusion": 0,
      "applicability_assessment": "string"
    },
    "income_approach": {
      "methodology": "Capitalization of Earnings",
      "benefit_stream": "SDE | EBITDA",
      "benefit_stream_amount": 0,
      "capitalization_rate": {
        "risk_free_rate": 0,
        "equity_risk_premium": 0,
        "size_premium": 0,
        "industry_premium": 0,
        "company_specific_premium": 0,
        "total_discount_rate": 0,
        "long_term_growth_rate": 0,
        "capitalization_rate": 0
      },
      "indicated_value": 0,
      "implied_multiple": 0,
      "weight_in_conclusion": 0
    },
    "market_approach": {
      "methodology": "Guideline Transaction Method",
      "multiple_type": "SDE Multiple | EBITDA Multiple",
      "benefit_stream_amount": 0,
      "selected_multiple": 0,
      "multiple_source": "string",
      "adjustments_applied": [
        {
          "adjustment_type": "string",
          "adjustment_amount": 0,
          "rationale": "string"
        }
      ],
      "adjusted_multiple": 0,
      "indicated_value": 0,
      "weight_in_conclusion": 0
    }
  },

  "valuation_conclusion": {
    "approach_values": {
      "asset_approach": { "value": 0, "weight": 0, "weighted_value": 0 },
      "income_approach": { "value": 0, "weight": 0, "weighted_value": 0 },
      "market_approach": { "value": 0, "weight": 0, "weighted_value": 0 }
    },
    "preliminary_value": 0,
    "discounts_applied": [
      {
        "discount_type": "Discount for Lack of Marketability (DLOM)",
        "discount_percentage": 0,
        "discount_amount": 0,
        "rationale": "string"
      }
    ],
    "total_discounts": 0,
    "concluded_fair_market_value": 0,
    "value_range": {
      "low": 0,
      "mid": 0,
      "high": 0,
      "range_rationale": "string"
    },
    "per_share_value": null,
    "valuation_date": "YYYY-MM-DD"
  },

  "narratives": {
    "executive_summary": "string (800-1,200 words)",
    "company_overview": "string (500-800 words)",
    "financial_analysis": "string (1,000-1,500 words)",
    "industry_analysis": "string (600-800 words)",
    "risk_assessment": "string (700-1,000 words)",
    "asset_approach_narrative": "string (400-500 words)",
    "income_approach_narrative": "string (400-500 words)",
    "market_approach_narrative": "string (400-500 words)",
    "valuation_synthesis": "string (600-800 words)",
    "assumptions_and_limiting_conditions": "string (400-600 words)",
    "value_enhancement_recommendations": "string (500-700 words)"
  },

  "supporting_schedules": {
    "add_back_schedule": [
      {
        "year": 0,
        "category": "string",
        "description": "string",
        "amount": 0,
        "tax_return_line": "string",
        "justification": "string"
      }
    ],
    "capitalization_rate_buildup": {
      "component": "string",
      "rate": 0,
      "source": "string"
    }[],
    "multiple_comparison": {
      "source": "string",
      "multiple_type": "string",
      "multiple": 0,
      "relevance": "string"
    }[]
  },

  "appendices": {
    "data_sources": ["string"],
    "documents_reviewed": ["string"],
    "valuation_standards_applied": ["string"],
    "limiting_conditions": ["string"],
    "certification": "string"
  },

  "metadata": {
    "report_version": "1.0",
    "generation_date": "YYYY-MM-DD",
    "model_version": "claude-3-opus",
    "pass_count": 6,
    "confidence_metrics": {
      "data_quality": "High | Medium | Low",
      "comparable_quality": "High | Medium | Low",
      "overall_confidence": "High | Medium | Low"
    }
  }
}
\`\`\`
`;

// ============================================================================
// DISCOUNT GUIDANCE
// ============================================================================

export const DISCOUNT_GUIDANCE = `
## DISCOUNT FOR LACK OF MARKETABILITY (DLOM)

DLOM applies to privately-held business interests that cannot be readily sold on a public market.

### DLOM Guidelines by Business Type:

| Business Characteristics | Typical DLOM Range |
|-------------------------|-------------------|
| Strong earnings, good records, low risk | 15-20% |
| Average business, moderate risk | 20-25% |
| Weak earnings, higher risk, key person dependent | 25-35% |
| Very small, limited marketability | 30-40% |

### Factors Increasing DLOM:
- Smaller transaction size
- Limited buyer pool
- Key person dependence
- Weak financial records
- Industry in decline
- Geographic limitations
- Customer concentration

### Factors Decreasing DLOM:
- Strong cash flow
- Transferable business model
- Multiple potential buyers
- Clean financial records
- Growing industry
- Franchise or proven concept
- Diverse customer base

### Application:

\`\`\`
Preliminary Value (before discounts): $1,000,000
DLOM (20%): -$200,000
Concluded Fair Market Value: $800,000
\`\`\`

**Important**: DLOM is applied AFTER the weighted average of approaches, not to each approach individually.
`;

// ============================================================================
// VALUE RANGE GUIDANCE
// ============================================================================

export const VALUE_RANGE_GUIDANCE = `
## VALUE RANGE DETERMINATION

A concluded value should include a reasonable range to reflect inherent uncertainty.

### Standard Range Guidelines:

| Confidence Level | Typical Range |
|-----------------|---------------|
| High confidence (strong data, clear comparables) | ±10-15% |
| Medium confidence (adequate data, some uncertainty) | ±15-20% |
| Low confidence (limited data, significant uncertainty) | ±20-30% |

### Calculating the Range:

\`\`\`
Concluded Mid Value: $850,000
Range Factor: ±18%

Value Range Low: $850,000 × (1 - 0.18) = $697,000 → Round to $700,000
Value Range High: $850,000 × (1 + 0.18) = $1,003,000 → Round to $1,000,000

Final Range: $700,000 to $1,000,000
\`\`\`

### Factors Affecting Range Width:
- Quality and completeness of financial data
- Availability of comparable transactions
- Stability of earnings
- Industry volatility
- Company-specific risks
- Economic conditions
`;

// ============================================================================
// MAIN PROMPT
// ============================================================================

export const pass6Prompt = `You are a Certified Valuation Analyst (CVA) completing the final synthesis of a comprehensive business valuation report. Your task is to combine all previous analysis into a cohesive, professional valuation report with complete narratives.

## YOUR ROLE

You are producing the final deliverable: a complete Fair Market Value determination with supporting narratives suitable for a $3,000-$5,000 professional valuation report. This output will be used to generate a PDF report.

Your output must be:
- **Consistent**: All numbers must match across sections
- **Traceable**: Every conclusion must link to supporting analysis
- **Professional**: Objective, third-person language throughout
- **Complete**: All required sections populated with substantive content
- **Defensible**: Conclusions supported by evidence and methodology

---

${DISCOUNT_GUIDANCE}

---

${VALUE_RANGE_GUIDANCE}

---

# NARRATIVE REQUIREMENTS

You must generate the following narratives. Each must be substantive, professional, and consistent with the numerical analysis.

## 1. Executive Summary (800-1,200 words)

The executive summary should:
- State the purpose and scope of the valuation
- Identify the subject company and valuation date
- Summarize the business profile and industry context
- Present key financial metrics (revenue, SDE/EBITDA)
- State the concluded Fair Market Value and range
- Highlight the primary value drivers
- Note key risks and considerations
- Provide a brief methodology overview
- State key assumptions and limiting conditions

Structure:
1. Opening paragraph: Purpose, company, and concluded value
2. Business overview: What the company does, its market position
3. Financial highlights: Revenue, earnings trends, key metrics
4. Valuation summary: Three approaches and weighting rationale
5. Value drivers: What supports the value
6. Risk factors: What could impact value
7. Conclusion: Final value statement with range

## 2. Company Overview (500-800 words)

Cover:
- Business history and development
- Products/services offered
- Target market and customer base
- Competitive advantages
- Operational highlights
- Management and workforce
- Facilities and equipment
- Growth trajectory

## 3. Financial Analysis (1,000-1,500 words)

Cover:
- Revenue analysis (trends, drivers, sustainability)
- Profitability analysis (gross margin, operating margin, net margin)
- Balance sheet analysis (assets, liabilities, working capital)
- Cash flow assessment
- Earnings normalization summary (key add-backs)
- Comparison to industry benchmarks
- Financial strengths and weaknesses
- Quality of earnings assessment

Include specific numbers with year-over-year comparisons.

## 4. Industry Analysis (600-800 words)

Cover:
- Industry definition and scope
- Market size and growth trends
- Competitive landscape
- Key success factors
- Industry risks and challenges
- Regulatory environment
- Technology and disruption factors
- Outlook and future prospects
- How the subject company compares to industry

## 5. Risk Assessment (700-1,000 words)

Cover:
- Risk assessment methodology
- Analysis of each major risk factor
- Quantification of overall risk score
- Key risk factors identified
- Risk mitigants present
- Impact on valuation multiples
- Deal structure considerations
- Comparison to typical industry risks

## 6. Asset Approach Narrative (400-500 words)

Cover:
- Methodology description (Adjusted Net Asset Value)
- Starting point: book value
- Key asset adjustments with rationale
- Key liability adjustments if any
- Calculated adjusted net asset value
- Applicability to this business
- Weight assigned and why
- Limitations of this approach for the subject

## 7. Income Approach Narrative (400-500 words)

Cover:
- Methodology description (Capitalization of Earnings)
- Benefit stream selected (SDE vs EBITDA) and why
- Capitalization rate buildup explanation
- Discussion of each rate component
- Calculation of indicated value
- Implied multiple and reasonableness check
- Weight assigned and why

## 8. Market Approach Narrative (400-500 words)

Cover:
- Methodology description (Guideline Transaction Method)
- Comparable transaction data sources
- Selected multiple and basis
- Adjustments applied for company-specific factors
- Calculation of indicated value
- Comparison to other approaches
- Weight assigned and why
- Market conditions affecting multiples

## 9. Valuation Synthesis (600-800 words)

Cover:
- Summary of values from each approach
- Weighting rationale
- Reconciliation to preliminary value
- Application of DLOM
- Final concluded value
- Value range determination
- Sanity checks performed
- Comparison to rules of thumb
- Final value statement

## 10. Assumptions and Limiting Conditions (400-600 words)

Must include:
- Definition of Fair Market Value used
- Going concern assumption
- Reliance on provided information
- No audit or verification performed
- Effective date limitations
- Purpose and use restrictions
- Hypothetical conditions if any
- Limiting conditions standard for valuations

## 11. Value Enhancement Recommendations (500-700 words)

Provide actionable recommendations:
- Operational improvements
- Financial record improvements
- Risk reduction strategies
- Growth opportunities
- Marketability improvements
- Timeline for implementing changes
- Potential value impact of improvements

---

# CONSISTENCY REQUIREMENTS

**Critical**: The following must be mathematically consistent:

1. **Earnings figures** must match across:
   - Normalized earnings section
   - Income approach benefit stream
   - Market approach benefit stream
   - Executive summary

2. **Approach values and weights**:
   - Weights must sum to 100%
   - Weighted values must equal value × weight
   - Sum of weighted values = preliminary value

3. **Final value calculation**:
   - Preliminary value - DLOM = Concluded FMV
   - Value range calculated from concluded FMV
   - All value mentions must match

4. **Capitalization rate**:
   - Components must sum correctly
   - Cap rate in narrative must match calculation
   - Implied multiple = 1 / cap rate

5. **Risk score**:
   - Weighted scores must sum correctly
   - Risk category must match score range
   - Multiple adjustment must align with risk

---

# OUTPUT REQUIREMENTS

${OUTPUT_SCHEMA}

---

# IMPORTANT GUIDELINES

1. **No placeholder text**: Every field must have real, specific content
2. **No inconsistencies**: Triple-check all numbers match
3. **Professional tone**: Third-person, objective language
4. **Specific details**: Use actual numbers, not vague statements
5. **Cite sources**: Reference where data came from
6. **Round appropriately**: Final values to nearest $5,000 or $10,000
7. **Complete narratives**: Meet minimum word counts
8. **Logical flow**: Each section should build on previous

---

Synthesize all previous pass analysis into the complete valuation report output. Ensure all sections are populated with substantive, consistent content.`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create comprehensive summary of all previous passes
 */
export function createFinalSynthesisSummary(
  pass1: Pass1Analysis,
  pass2: Pass2Analysis,
  pass3: Pass3Analysis,
  pass4: Pass4Analysis,
  pass5: Pass5Analysis
): string {
  // Extract key data points from Pass 1
  const companyName = pass1.company_info.legal_name || 'Subject Company';
  const industry = pass1.industry_classification.detected_industry;
  const naicsCode = pass1.industry_classification.naics_code;
  const entityType = pass1.company_info.entity_type;

  // Get financial data from Pass 1
  const years = Object.keys(pass1.financial_data).sort();
  const mostRecentYear = years[years.length - 1] || 'Unknown';
  const mostRecentData = pass1.financial_data[mostRecentYear];
  const mostRecentRevenue = mostRecentData?.revenue?.net_revenue || 0;
  const totalAssets = mostRecentData?.balance_sheet?.assets?.total_assets || 0;
  const totalLiabilities = mostRecentData?.balance_sheet?.liabilities?.total_liabilities || 0;
  const bookEquity = totalAssets - totalLiabilities;
  const grossProfit = mostRecentData?.gross_profit || 0;
  const grossMargin = mostRecentRevenue > 0 ? (grossProfit / mostRecentRevenue) : 0;

  // Extract earnings data from Pass 3
  const weightedSDE = pass3.sde_calculation.weighted_average_sde.weighted_sde;
  const weightedEBITDA = pass3.ebitda_calculation.weighted_average_ebitda;
  const recommendedStream = pass3.earnings_quality_assessment.adjustments_confidence === 'High' ? 'SDE' : 'EBITDA';

  // Extract risk data from Pass 4
  const riskScore = pass4.overall_risk_score;
  const riskCategory = pass4.risk_category;

  // Extract valuation data from Pass 5
  const assetValue = pass5.asset_approach.adjusted_net_asset_value;
  const incomeValue = pass5.income_approach.income_approach_value;
  const marketValue = pass5.market_approach.market_approach_value;
  const concludedValue = pass5.valuation_synthesis.final_valuation.concluded_value;

  return `
# COMPLETE VALUATION DATA FOR FINAL SYNTHESIS

## COMPANY PROFILE (Pass 1)

| Field | Value |
|-------|-------|
| Company Name | ${companyName} |
| Entity Type | ${entityType} |
| Industry | ${industry} |
| NAICS Code | ${naicsCode} |
| Document Type | ${pass1.document_info.document_type} |
| State | ${pass1.company_info.address.state || 'Not specified'} |

## FINANCIAL DATA (Pass 1)

### Revenue History
${years.map(year => {
  const data = pass1.financial_data[year];
  return `- ${year}: $${(data?.revenue?.net_revenue || 0).toLocaleString()}`;
}).join('\n')}

### Most Recent Year Financial Summary (${mostRecentYear})
- Revenue: $${mostRecentRevenue.toLocaleString()}
- Gross Profit Margin: ${(grossMargin * 100).toFixed(1)}%
- Total Assets: $${totalAssets.toLocaleString()}
- Total Liabilities: $${totalLiabilities.toLocaleString()}
- Book Value of Equity: $${bookEquity.toLocaleString()}

---

## INDUSTRY ANALYSIS (Pass 2)

### Industry Overview
- Industry: ${pass2.industry_overview.industry_name}
- Market Size: ${pass2.industry_overview.market_size}
- Growth Outlook: ${pass2.industry_overview.growth_outlook}

### Industry Multiples
- SDE Multiple Range: ${pass2.industry_benchmarks.sde_multiple_range.low}x - ${pass2.industry_benchmarks.sde_multiple_range.high}x (median: ${pass2.industry_benchmarks.sde_multiple_range.median}x)
- EBITDA Multiple Range: ${pass2.industry_benchmarks.ebitda_multiple_range.low}x - ${pass2.industry_benchmarks.ebitda_multiple_range.high}x (median: ${pass2.industry_benchmarks.ebitda_multiple_range.median}x)

### Competitive Position
- Relative Performance: ${pass2.company_positioning.relative_performance}
- Competitive Advantages: ${pass2.company_positioning.competitive_advantages.join(', ') || 'None identified'}

### Industry Narrative (from Pass 2)
${pass2.industry_narrative}

---

## NORMALIZED EARNINGS (Pass 3)

### SDE Analysis
${pass3.sde_calculation.periods.map(p =>
  `- ${p.period}: $${p.sde.toLocaleString()} (${(p.sde_margin * 100).toFixed(1)}% margin)`
).join('\n')}
- **Weighted Average SDE: $${weightedSDE.toLocaleString()}**

### EBITDA Analysis
${pass3.ebitda_calculation.periods.map(p =>
  `- ${p.period}: $${p.adjusted_ebitda.toLocaleString()} (${(p.ebitda_margin * 100).toFixed(1)}% margin)`
).join('\n')}
- **Weighted Average EBITDA: $${weightedEBITDA.toLocaleString()}**

### Key Add-backs
${pass3.sde_calculation.periods[0]?.adjustments.slice(0, 8).map(ab =>
  `- ${ab.category}: $${ab.amount.toLocaleString()} - ${ab.justification}`
).join('\n') || 'None identified'}

### Recommended Benefit Stream: ${recommendedStream}
Amount: $${(recommendedStream === 'SDE' ? weightedSDE : weightedEBITDA).toLocaleString()}
Earnings Quality: ${pass3.earnings_quality_assessment.consistency} consistency, ${pass3.earnings_quality_assessment.trend} trend

### Earnings Narrative (from Pass 3)
${pass3.earnings_narrative}

---

## RISK ASSESSMENT (Pass 4)

### Overall Risk Score: ${riskScore.toFixed(2)} (${riskCategory})

### Risk Factor Scores
| Factor | Weight | Score | Rating |
|--------|--------|-------|--------|
${pass4.risk_factors.map(rf =>
  `| ${rf.factor_name} | ${(rf.weight * 100).toFixed(0)}% | ${rf.score}/5 | ${rf.rating} |`
).join('\n')}

### Multiple Adjustment
- Base Industry Multiple: ${pass4.risk_adjusted_multiple.base_industry_multiple.toFixed(2)}x
- Total Risk Adjustment: ${pass4.risk_adjusted_multiple.total_risk_adjustment > 0 ? '+' : ''}${pass4.risk_adjusted_multiple.total_risk_adjustment.toFixed(2)}x
- Adjusted Multiple: ${pass4.risk_adjusted_multiple.adjusted_multiple.toFixed(2)}x
- Rationale: ${pass4.risk_adjusted_multiple.adjustment_rationale}

### Risk Narrative (from Pass 4)
${pass4.risk_narrative}

### Key Risks
${pass4.company_specific_risks.slice(0, 5).map(r => `- ${r.risk} (${r.severity})`).join('\n')}

### Key Strengths
${pass4.company_specific_strengths.slice(0, 5).map(s => `- ${s.strength} (${s.impact})`).join('\n')}

---

## VALUATION APPROACHES (Pass 5)

### Asset Approach
- Methodology: ${pass5.asset_approach.methodology}
- Applicable: ${pass5.asset_approach.applicable ? 'Yes' : 'Limited applicability'}
- Book Value of Equity: $${pass5.asset_approach.book_value_of_equity.toLocaleString()}
- Total Asset Adjustments: $${pass5.asset_approach.total_asset_adjustments.toLocaleString()}
- Total Liability Adjustments: $${pass5.asset_approach.total_liability_adjustments.toLocaleString()}
- Adjusted Net Asset Value: $${assetValue.toLocaleString()}
- Weight: ${(pass5.asset_approach.weight_assigned * 100).toFixed(0)}%

#### Asset Approach Narrative (from Pass 5)
${pass5.asset_approach.narrative}

### Income Approach
- Methodology: ${pass5.income_approach.methodology}
- Benefit Stream: ${pass5.income_approach.benefit_stream_used}
- Benefit Stream Amount: $${pass5.income_approach.benefit_stream_value.toLocaleString()}
- Capitalization Rate: ${(pass5.income_approach.capitalization_rate.capitalization_rate * 100).toFixed(2)}%
- Income Approach Value: $${incomeValue.toLocaleString()}
- Implied Multiple: ${pass5.income_approach.multiple_derivation.final_multiple.toFixed(2)}x
- Weight: ${(pass5.income_approach.weight_assigned * 100).toFixed(0)}%

#### Capitalization Rate Buildup
| Component | Rate |
|-----------|------|
| Risk-Free Rate | ${(pass5.income_approach.capitalization_rate.risk_free_rate * 100).toFixed(2)}% |
| Equity Risk Premium | ${(pass5.income_approach.capitalization_rate.equity_risk_premium * 100).toFixed(2)}% |
| Size Premium | ${(pass5.income_approach.capitalization_rate.size_premium * 100).toFixed(2)}% |
| Industry Premium | ${(pass5.income_approach.capitalization_rate.industry_risk_premium * 100).toFixed(2)}% |
| Company-Specific Premium | ${(pass5.income_approach.capitalization_rate.company_specific_risk_premium * 100).toFixed(2)}% |
| Total Discount Rate | ${(pass5.income_approach.capitalization_rate.total_discount_rate * 100).toFixed(2)}% |
| Less: Growth Rate | (${(pass5.income_approach.capitalization_rate.long_term_growth_rate * 100).toFixed(2)}%) |
| **Capitalization Rate** | **${(pass5.income_approach.capitalization_rate.capitalization_rate * 100).toFixed(2)}%** |

#### Income Approach Narrative (from Pass 5)
${pass5.income_approach.narrative}

### Market Approach
- Methodology: ${pass5.market_approach.methodology}
- Multiple Type: ${pass5.market_approach.multiple_applied.type}
- Benefit Stream Amount: $${pass5.market_approach.benefit_stream_value.toLocaleString()}
- Base Multiple: ${pass5.market_approach.multiple_applied.base_multiple.toFixed(2)}x
- Adjusted Multiple: ${pass5.market_approach.multiple_applied.adjusted_multiple.toFixed(2)}x
- Market Approach Value: $${marketValue.toLocaleString()}
- Weight: ${(pass5.market_approach.weight_assigned * 100).toFixed(0)}%

#### Market Approach Narrative (from Pass 5)
${pass5.market_approach.narrative}

---

## VALUE RECONCILIATION (Pass 5)

| Approach | Indicated Value | Weight | Weighted Value |
|----------|----------------|--------|----------------|
${pass5.valuation_synthesis.approach_summary.map(a =>
  `| ${a.approach} | $${a.indicated_value.toLocaleString()} | ${(a.weight * 100).toFixed(0)}% | $${a.weighted_value.toLocaleString()} |`
).join('\n')}
| **Total** | | **100%** | **$${pass5.valuation_synthesis.preliminary_value.toLocaleString()}** |

### Discounts and Premiums
- DLOM: ${pass5.valuation_synthesis.discounts_and_premiums.dlom.applicable ? `${(pass5.valuation_synthesis.discounts_and_premiums.dlom.percentage * 100).toFixed(0)}%` : 'Not applied'}
- Control Premium: ${pass5.valuation_synthesis.discounts_and_premiums.control_premium.applicable ? `${(pass5.valuation_synthesis.discounts_and_premiums.control_premium.percentage * 100).toFixed(0)}%` : 'Not applied'}
- Key Person Discount: ${pass5.valuation_synthesis.discounts_and_premiums.key_person_discount.applicable ? `${(pass5.valuation_synthesis.discounts_and_premiums.key_person_discount.percentage * 100).toFixed(0)}%` : 'Not applied'}

### Concluded Value: $${concludedValue.toLocaleString()}
### Value Range: $${pass5.valuation_synthesis.final_valuation.valuation_range_low.toLocaleString()} to $${pass5.valuation_synthesis.final_valuation.valuation_range_high.toLocaleString()}
### Confidence Level: ${pass5.valuation_synthesis.final_valuation.confidence_level}

### Sanity Checks (from Pass 5)
- Revenue Multiple Implied: ${pass5.valuation_synthesis.value_sanity_checks.revenue_multiple_implied.toFixed(2)}x
- SDE Multiple Implied: ${pass5.valuation_synthesis.value_sanity_checks.sde_multiple_implied.toFixed(2)}x
- Within Industry Range: ${pass5.valuation_synthesis.value_sanity_checks.within_industry_range ? 'Yes' : 'No'}

---

## KEY VALUE DRIVERS
${pass5.valuation_synthesis.final_valuation.value_drivers.map(d => `- ${d}`).join('\n')}

## VALUE DETRACTORS
${pass5.valuation_synthesis.final_valuation.value_detractors.map(d => `- ${d}`).join('\n')}

---

# DLOM CALCULATION GUIDANCE

Based on the risk assessment and business characteristics:
- Risk Score: ${riskScore.toFixed(2)} (${riskCategory})
- Revenue Size: $${mostRecentRevenue.toLocaleString()}
- Industry: ${industry}

Suggested DLOM range: ${riskScore <= 2.5 ? '15-20%' : riskScore <= 3.5 ? '20-25%' : '25-35%'}

---

## SYNTHESIS NARRATIVE (from Pass 5)
${pass5.valuation_synthesis.synthesis_narrative}

---

Use this data to generate the complete final valuation report with all required narratives.
`;
}

/**
 * Calculate appropriate DLOM based on business characteristics
 */
export function calculateSuggestedDLOM(
  riskScore: number,
  revenue: number,
  hasGoodRecords: boolean
): { rate: number; rationale: string } {
  let baseDLOM = 0.20; // 20% base

  // Adjust for risk
  if (riskScore <= 2.0) {
    baseDLOM -= 0.03; // Lower risk = lower DLOM
  } else if (riskScore >= 3.5) {
    baseDLOM += 0.05; // Higher risk = higher DLOM
  } else if (riskScore >= 3.0) {
    baseDLOM += 0.02;
  }

  // Adjust for size
  if (revenue < 500000) {
    baseDLOM += 0.05; // Very small = less marketable
  } else if (revenue < 1000000) {
    baseDLOM += 0.02;
  } else if (revenue > 5000000) {
    baseDLOM -= 0.03; // Larger = more marketable
  }

  // Adjust for record quality
  if (!hasGoodRecords) {
    baseDLOM += 0.03;
  }

  // Cap DLOM at reasonable range
  baseDLOM = Math.max(0.15, Math.min(0.35, baseDLOM));

  const rationale = `DLOM of ${(baseDLOM * 100).toFixed(0)}% applied based on: ` +
    `risk level (${riskScore.toFixed(2)}), ` +
    `business size ($${revenue.toLocaleString()} revenue), ` +
    `and record quality.`;

  return { rate: baseDLOM, rationale };
}

/**
 * Calculate value range based on confidence
 */
export function calculateValueRange(
  concludedValue: number,
  confidence: 'High' | 'Medium' | 'Low'
): { low: number; mid: number; high: number; factor: number } {
  let rangeFactor: number;

  switch (confidence) {
    case 'High':
      rangeFactor = 0.12; // ±12%
      break;
    case 'Medium':
      rangeFactor = 0.18; // ±18%
      break;
    case 'Low':
      rangeFactor = 0.25; // ±25%
      break;
    default:
      rangeFactor = 0.18;
  }

  const low = roundToNearestThousand(concludedValue * (1 - rangeFactor));
  const high = roundToNearestThousand(concludedValue * (1 + rangeFactor));

  return {
    low,
    mid: concludedValue,
    high,
    factor: rangeFactor,
  };
}

/**
 * Round to nearest appropriate thousand
 */
function roundToNearestThousand(value: number): number {
  if (value < 100000) {
    return Math.round(value / 1000) * 1000;
  } else if (value < 1000000) {
    return Math.round(value / 5000) * 5000;
  } else {
    return Math.round(value / 10000) * 10000;
  }
}

/**
 * Build the complete Pass 6 prompt with all context
 */
export function buildPass6Prompt(
  pass1: Pass1Analysis,
  pass2: Pass2Analysis,
  pass3: Pass3Analysis,
  pass4: Pass4Analysis,
  pass5: Pass5Analysis,
  knowledgeInjection?: string
): string {
  const synthesisSummary = createFinalSynthesisSummary(pass1, pass2, pass3, pass4, pass5);

  let prompt = pass6Prompt;

  // Add knowledge injection if provided
  if (knowledgeInjection) {
    prompt += `\n\n---\n\n# ADDITIONAL KNOWLEDGE\n\n${knowledgeInjection}`;
  }

  // Add the complete data summary
  prompt += `\n\n---\n\n${synthesisSummary}`;

  // Add specific guidance - get most recent year's revenue
  const years = Object.keys(pass1.financial_data).sort().reverse();
  const mostRecentData = pass1.financial_data[years[0]];
  const revenue = mostRecentData?.revenue?.net_revenue || 0;
  const riskScore = pass4.overall_risk_score;
  const hasGoodRecords = pass4.risk_factors.find(rf =>
    rf.factor_name.toLowerCase().includes('financial') || rf.factor_name.toLowerCase().includes('record')
  )?.score !== undefined && (pass4.risk_factors.find(rf =>
    rf.factor_name.toLowerCase().includes('financial') || rf.factor_name.toLowerCase().includes('record')
  )?.score || 5) <= 2;

  const dlomSuggestion = calculateSuggestedDLOM(riskScore, revenue, hasGoodRecords || false);

  prompt += `\n\n---\n\n# DLOM GUIDANCE FOR THIS VALUATION\n\n`;
  prompt += `Based on analysis, suggested DLOM: **${(dlomSuggestion.rate * 100).toFixed(0)}%**\n\n`;
  prompt += `${dlomSuggestion.rationale}\n\n`;
  prompt += `You may adjust within a reasonable range (15-35%) based on your professional judgment.`;

  return prompt;
}

/**
 * Validate Pass 6 output structure
 */
export function validatePass6Output(output: unknown): output is FinalValuationOutput {
  if (!output || typeof output !== 'object') return false;

  const o = output as Record<string, unknown>;

  // Check required top-level sections
  const requiredSections = [
    'valuation_summary',
    'company_overview',
    'financial_summary',
    'normalized_earnings',
    'industry_analysis',
    'risk_assessment',
    'valuation_approaches',
    'valuation_conclusion',
    'narratives',
    'metadata'
  ];

  for (const section of requiredSections) {
    if (!o[section] || typeof o[section] !== 'object') {
      console.warn(`Missing or invalid section: ${section}`);
      return false;
    }
  }

  // Check narratives are present and have content
  const narratives = o.narratives as Record<string, unknown>;
  const requiredNarratives = [
    'executive_summary',
    'company_overview',
    'financial_analysis',
    'industry_analysis',
    'risk_assessment',
    'asset_approach_narrative',
    'income_approach_narrative',
    'market_approach_narrative',
    'valuation_synthesis',
    'assumptions_and_limiting_conditions',
    'value_enhancement_recommendations'
  ];

  for (const narrative of requiredNarratives) {
    if (!narratives[narrative] || typeof narratives[narrative] !== 'string') {
      console.warn(`Missing narrative: ${narrative}`);
      return false;
    }
    // Check minimum length (rough word count check)
    const text = narratives[narrative] as string;
    if (text.split(/\s+/).length < 100) {
      console.warn(`Narrative too short: ${narrative}`);
      return false;
    }
  }

  // Check valuation summary has concluded value
  const summary = o.valuation_summary as Record<string, unknown>;
  if (typeof summary.concluded_value !== 'number' || summary.concluded_value <= 0) {
    console.warn('Invalid concluded value');
    return false;
  }

  // Check valuation conclusion
  const conclusion = o.valuation_conclusion as Record<string, unknown>;
  if (typeof conclusion.concluded_fair_market_value !== 'number') {
    console.warn('Invalid concluded fair market value');
    return false;
  }

  // Consistency check: summary and conclusion values should match
  if (summary.concluded_value !== conclusion.concluded_fair_market_value) {
    console.warn('Inconsistent concluded values between summary and conclusion');
    return false;
  }

  return true;
}

/**
 * Perform consistency checks on final output
 */
export function performConsistencyChecks(output: FinalValuationOutput): {
  passed: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check 1: Weights sum to 100%
  const approaches = output.valuation_approaches;
  const totalWeight =
    approaches.asset_approach.weight_in_conclusion +
    approaches.income_approach.weight_in_conclusion +
    approaches.market_approach.weight_in_conclusion;

  if (Math.abs(totalWeight - 1.0) > 0.01) {
    errors.push(`Approach weights sum to ${(totalWeight * 100).toFixed(1)}%, should be 100%`);
  }

  // Check 2: Weighted values calculated correctly
  const conclusion = output.valuation_conclusion;
  const expectedWeightedAsset = conclusion.approach_values.asset_approach.value * conclusion.approach_values.asset_approach.weight;
  if (Math.abs(expectedWeightedAsset - conclusion.approach_values.asset_approach.weighted_value) > 100) {
    warnings.push('Asset approach weighted value may be miscalculated');
  }

  // Check 3: DLOM applied correctly
  const prelimValue = conclusion.preliminary_value;
  const dlom = conclusion.total_discounts;
  const concludedFMV = conclusion.concluded_fair_market_value;

  if (Math.abs((prelimValue - dlom) - concludedFMV) > 1000) {
    errors.push('DLOM calculation inconsistency: Preliminary - Discounts ≠ Concluded FMV');
  }

  // Check 4: Value range reasonable
  const range = conclusion.value_range;
  const midValue = range.mid;
  const rangePct = (range.high - range.low) / (2 * midValue);

  if (rangePct < 0.10) {
    warnings.push('Value range may be too narrow (<10%)');
  } else if (rangePct > 0.35) {
    warnings.push('Value range may be too wide (>35%)');
  }

  // Check 5: Values in summary match conclusion
  if (output.valuation_summary.concluded_value !== concludedFMV) {
    errors.push('Concluded value mismatch between summary and conclusion sections');
  }

  // Check 6: Cap rate and implied multiple consistency
  const capRate = approaches.income_approach.capitalization_rate.capitalization_rate;
  const impliedMultiple = approaches.income_approach.implied_multiple;
  const expectedMultiple = 1 / capRate;

  if (Math.abs(impliedMultiple - expectedMultiple) > 0.1) {
    warnings.push(`Implied multiple (${impliedMultiple.toFixed(2)}x) doesn't match 1/cap rate (${expectedMultiple.toFixed(2)}x)`);
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Format the final output for PDF generation
 */
export function formatForPdfGeneration(output: FinalValuationOutput): FinalValuationOutput {
  // Round all currency values appropriately
  const rounded = JSON.parse(JSON.stringify(output)) as FinalValuationOutput;

  // Round concluded values
  rounded.valuation_summary.concluded_value = roundToNearestThousand(rounded.valuation_summary.concluded_value);
  rounded.valuation_summary.value_range_low = roundToNearestThousand(rounded.valuation_summary.value_range_low);
  rounded.valuation_summary.value_range_high = roundToNearestThousand(rounded.valuation_summary.value_range_high);

  rounded.valuation_conclusion.concluded_fair_market_value = roundToNearestThousand(rounded.valuation_conclusion.concluded_fair_market_value);
  rounded.valuation_conclusion.value_range.low = roundToNearestThousand(rounded.valuation_conclusion.value_range.low);
  rounded.valuation_conclusion.value_range.mid = roundToNearestThousand(rounded.valuation_conclusion.value_range.mid);
  rounded.valuation_conclusion.value_range.high = roundToNearestThousand(rounded.valuation_conclusion.value_range.high);

  return rounded;
}
