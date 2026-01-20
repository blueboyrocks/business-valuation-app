/**
 * Pass 6: Final Synthesis Prompt
 *
 * This is the final pass that synthesizes all previous outputs into
 * the complete valuation report with full narratives for PDF generation.
 */

export const pass6Prompt = `You are a Certified Valuation Analyst completing the FINAL synthesis of a comprehensive business valuation report. Your output will be used to generate the official PDF report.

## YOUR MISSION

Synthesize all previous pass analysis into a complete, professional valuation report. This is the FINAL deliverable - every field must be populated with substantive content.

---

## STEP 1: CALCULATE WEIGHTED AVERAGE VALUE

Combine the three valuation approaches:

\`\`\`
Preliminary Value = (Asset Approach × Asset Weight)
                  + (Income Approach × Income Weight)
                  + (Market Approach × Market Weight)

Example:
Asset Approach:   $200,000 × 0.20 = $40,000
Income Approach:  $850,000 × 0.40 = $340,000
Market Approach:  $625,000 × 0.40 = $250,000
Preliminary Value: $630,000
\`\`\`

Verify weights sum to 100%.

---

## STEP 2: APPLY DISCOUNTS AND PREMIUMS

### DLOM (Discount for Lack of Marketability)

Applies to privately-held business interests that cannot be readily sold.

| Business Characteristics | DLOM Range |
|-------------------------|------------|
| Strong earnings, good records, low risk | 10-15% |
| Average business, moderate risk | 15-20% |
| Higher risk, key person dependent | 20-25% |
| Very small, limited marketability | 25-35% |

**Standard: Use 15% unless specific factors warrant adjustment.**

### DLOC (Discount for Lack of Control)

- Only applies when valuing a MINORITY interest
- NOT applicable for 100% ownership (which is what we're valuing)
- Typical range: 15-30% when applicable

### Application:

\`\`\`
Preliminary Value:     $630,000
Less: DLOM (15%):      ($94,500)
Concluded FMV:         $535,500 → Round to $535,000
\`\`\`

---

## STEP 3: WORKING CAPITAL ADJUSTMENT

Compare actual working capital to normal operating requirements:

\`\`\`
Normal Working Capital = 1-2 months of revenue (industry dependent)
Actual Working Capital = Current Assets - Current Liabilities
Adjustment = Actual - Normal

Example:
- Annual Revenue: $1,200,000
- Normal WC (1.5 months): $150,000
- Actual WC: $180,000
- Adjustment: +$30,000 (excess working capital adds to value)
\`\`\`

If actual working capital significantly exceeds or falls short of normal operating needs, adjust the concluded value accordingly.

---

## STEP 4: DETERMINE FINAL VALUE AND RANGE

### Final Value Calculation:

\`\`\`
Final Value = (Preliminary Value × (1 - DLOM)) + WC Adjustment
\`\`\`

### Value Range:

| Confidence Level | Range |
|-----------------|-------|
| High (strong data, clear comparables) | ±10-15% |
| Moderate (adequate data, some uncertainty) | ±15-20% |
| Low (limited data, significant uncertainty) | ±20-25% |

### Sanity Checks:

1. Concluded Value ≥ Adjusted Net Asset Value (floor)
2. Value Range: Low < Concluded < High
3. Value-to-Revenue ratio: typically 0.3x to 1.5x
4. Implied payback: typically 3-5 years

---

## STEP 5: WRITE ALL NARRATIVES

Generate comprehensive narratives totaling 7,000-12,000 words.

### Required Narratives with Word Targets:

| Section | Words | Content Focus |
|---------|-------|---------------|
| **Executive Summary** | 800-1,200 | Complete overview: purpose, company, value conclusion, methodology summary, key drivers, risks |
| **Company Overview** | 500-800 | Business description, history, operations, products/services, market position |
| **Financial Analysis** | 1,000-1,500 | Deep dive: revenue trends, margins, balance sheet, cash flow, earnings normalization, benchmarks |
| **Industry Analysis** | 600-800 | Market context, growth trends, competition, success factors (leverage Pass 2) |
| **Risk Assessment** | 700-1,000 | Risk factors, scores, mitigants, impact on value (leverage Pass 4) |
| **Asset Approach** | 400-500 | Methodology, book value, adjustments, weight rationale |
| **Income Approach** | 400-500 | Methodology, benefit stream, cap rate buildup, weight rationale |
| **Market Approach** | 400-500 | Methodology, multiples, adjustments, weight rationale |
| **Valuation Synthesis** | 600-800 | Reconciliation, weighting rationale, DLOM application, final value |
| **Assumptions & Limitations** | 400-600 | Standard caveats, FMV definition, reliance statements, purpose restrictions |
| **Value Enhancement** | 500-700 | Actionable recommendations to improve value |

### Narrative Quality Requirements:

- Professional, third-person language
- Specific numbers and percentages
- Cite data sources (e.g., "As shown in the 2023 tax return...")
- Connect analysis to value conclusions
- No placeholder text - every sentence must be substantive

---

## STEP 6: QUALITY CHECKS

Before finalizing, verify:

✓ All numbers are mathematically consistent
✓ Weights sum to exactly 100%
✓ DLOM calculation is correct
✓ Value range brackets the concluded value
✓ All narratives meet minimum word counts
✓ Cap rate components sum correctly
✓ Implied multiple = 1 / Cap rate
✓ Same earnings figure used in Income and Market approaches
✓ Concluded value appears consistently throughout

---

## OUTPUT FORMAT

Respond with ONLY valid JSON matching this exact structure:

{
  "schema_version": "2.0",
  "valuation_date": "2024-01-15",
  "generated_at": "2024-01-15T14:30:00Z",

  "company_profile": {
    "legal_name": "ABC Company, Inc.",
    "entity_type": "S-Corporation",
    "tax_form_type": "Form 1120-S",
    "ein": "12-3456789",
    "address": {
      "street": "123 Main Street",
      "city": "Anytown",
      "state": "CA",
      "zip": "90210"
    },
    "industry": {
      "naics_code": "238220",
      "naics_description": "Plumbing, Heating, and Air-Conditioning Contractors",
      "industry_sector": "Construction - Specialty Trades"
    },
    "business_description": "ABC Company is a full-service HVAC contractor providing residential and commercial heating, cooling, and ventilation services in the greater metropolitan area..."
  },

  "financial_data": {
    "periods_analyzed": ["2021", "2022", "2023"],
    "income_statements": [
      {
        "period": "2023",
        "revenue": 1485000,
        "cost_of_goods_sold": 742500,
        "gross_profit": 742500,
        "operating_expenses": 520000,
        "net_income": 148500
      }
    ],
    "balance_sheets": [
      {
        "period": "2023",
        "total_assets": 425000,
        "total_liabilities": 185000,
        "total_equity": 240000
      }
    ]
  },

  "normalized_earnings": {
    "sde_calculation": {
      "periods": [
        {
          "period": "2023",
          "starting_net_income": 148500,
          "adjustments": [
            {
              "category": "Owner Compensation",
              "description": "Officer salary - sole owner",
              "amount": 120000,
              "source_line": "Form 1120-S, Line 7",
              "justification": "Owner's W-2 salary added back as SDE represents total owner benefit"
            }
          ],
          "total_adjustments": 156000,
          "sde": 304500
        }
      ],
      "weighted_average_sde": 285000,
      "weighting_method": "3x/2x/1x weighting (most recent year weighted 3x)"
    },
    "ebitda_calculation": {
      "periods": [
        {
          "period": "2023",
          "starting_net_income": 148500,
          "add_interest": 12000,
          "add_taxes": 0,
          "add_depreciation": 35000,
          "add_amortization": 0,
          "owner_comp_adjustment": 40000,
          "adjusted_ebitda": 235500
        }
      ],
      "weighted_average_ebitda": 220000
    },
    "earnings_quality_assessment": {
      "quality_score": "Medium",
      "factors": [
        "Consistent revenue growth over 3 years",
        "Owner compensation clearly documented",
        "Some discretionary expenses identified"
      ]
    }
  },

  "industry_analysis": {
    "industry_overview": {
      "sector": "Construction - Specialty Trades",
      "subsector": "HVAC Contractors",
      "market_size": "$150 billion annually in the US",
      "growth_rate": "4-5% annually",
      "growth_outlook": "Growing",
      "key_trends": ["Energy efficiency demand", "Smart home integration", "Technician shortage"]
    },
    "competitive_landscape": "Highly fragmented industry with thousands of local operators...",
    "industry_benchmarks": {
      "gross_margin": { "low": 0.35, "median": 0.45, "high": 0.55 },
      "operating_margin": { "low": 0.08, "median": 0.12, "high": 0.18 },
      "sde_margin": { "low": 0.12, "median": 0.18, "high": 0.25 }
    },
    "valuation_multiples": {
      "sde_multiple": { "low": 2.0, "typical": 2.8, "high": 3.5 },
      "revenue_multiple": { "low": 0.4, "typical": 0.6, "high": 0.8 },
      "source": "BizBuySell 2024 data, industry broker surveys"
    },
    "rules_of_thumb": ["2.5-3.5x SDE for owner-operated HVAC companies"],
    "due_diligence_questions": ["What percentage of revenue is from maintenance agreements?"],
    "industry_narrative": "The HVAC contracting industry represents a substantial segment..."
  },

  "risk_assessment": {
    "overall_risk_rating": "Above Average",
    "overall_risk_score": 2.65,
    "risk_factors": [
      {
        "factor": "Size Risk",
        "weight": 0.15,
        "score": 3,
        "description": "Revenue of $1.5M is typical small business size",
        "mitigation": "Document systems to demonstrate scalability",
        "impact_on_value": "Neutral"
      }
    ],
    "company_specific_risks": ["Owner handles most customer relationships", "Single location"],
    "company_specific_strengths": ["Strong online reputation", "Experienced team"],
    "risk_adjusted_multiple_adjustment": -0.25,
    "risk_narrative": "The risk assessment yields an overall weighted score of 2.65..."
  },

  "valuation_approaches": {
    "asset_approach": {
      "book_value": 240000,
      "adjustments": [
        { "item": "Equipment appreciation", "adjustment": 25000, "reason": "Vehicles worth more than depreciated value" },
        { "item": "Inventory obsolescence", "adjustment": -5000, "reason": "Slow-moving parts" }
      ],
      "adjusted_net_asset_value": 260000,
      "weight": 0.20,
      "narrative": "The Asset Approach begins with the book value of equity..."
    },
    "income_approach": {
      "normalized_earnings": 285000,
      "earnings_type": "SDE",
      "cap_rate_buildup": {
        "risk_free_rate": 0.045,
        "equity_risk_premium": 0.06,
        "size_premium": 0.05,
        "company_specific_risk": 0.06,
        "total_cap_rate": 0.215
      },
      "capitalized_value": 1325581,
      "weight": 0.40,
      "narrative": "The Income Approach values the business based on its earnings power..."
    },
    "market_approach": {
      "comparable_multiple": 2.55,
      "multiple_type": "SDE",
      "multiple_source": "BizBuySell HVAC transactions, industry surveys",
      "applied_earnings": 285000,
      "market_value": 726750,
      "weight": 0.40,
      "narrative": "The Market Approach applies multiples from comparable transactions..."
    }
  },

  "valuation_synthesis": {
    "approach_summary": [
      { "approach": "Asset Approach", "value": 260000, "weight": 0.20, "weighted_value": 52000 },
      { "approach": "Income Approach", "value": 1325581, "weight": 0.40, "weighted_value": 530232 },
      { "approach": "Market Approach", "value": 726750, "weight": 0.40, "weighted_value": 290700 }
    ],
    "preliminary_value": 872932,
    "discounts_and_premiums": {
      "dlom": { "applicable": true, "percentage": 0.15, "rationale": "Standard DLOM for private company with moderate risk" },
      "dloc": { "applicable": false, "percentage": 0, "rationale": "Not applicable - valuing 100% interest" }
    },
    "final_valuation": {
      "concluded_value": 742000,
      "valuation_range_low": 630000,
      "valuation_range_high": 855000,
      "confidence_level": "Moderate",
      "confidence_rationale": "Adequate financial data with some uncertainty in earnings normalization"
    }
  },

  "narratives": {
    "executive_summary": { "word_count_target": 1000, "content": "This valuation report presents a Fair Market Value determination for ABC Company, Inc. as of January 15, 2024..." },
    "company_overview": { "word_count_target": 650, "content": "ABC Company, Inc. is a full-service HVAC contractor established in 2008..." },
    "financial_analysis": { "word_count_target": 1250, "content": "The financial analysis examines three years of historical performance from 2021 through 2023..." },
    "industry_analysis": { "word_count_target": 700, "content": "The HVAC contracting industry represents a significant segment of the construction services sector..." },
    "risk_assessment": { "word_count_target": 850, "content": "This risk assessment evaluates ten key factors that impact the company's valuation..." },
    "asset_approach_narrative": { "word_count_target": 450, "content": "The Asset Approach values a business based on the fair market value of its underlying assets..." },
    "income_approach_narrative": { "word_count_target": 450, "content": "The Income Approach values a business based on its ability to generate future economic benefits..." },
    "market_approach_narrative": { "word_count_target": 450, "content": "The Market Approach derives value from pricing multiples observed in sales of comparable businesses..." },
    "valuation_synthesis_narrative": { "word_count_target": 700, "content": "The valuation synthesis combines the three approaches into a concluded Fair Market Value..." },
    "assumptions_and_limiting_conditions": { "word_count_target": 500, "content": "This valuation is subject to the following assumptions and limiting conditions..." },
    "value_enhancement_recommendations": { "word_count_target": 600, "content": "Based on our analysis, we have identified several opportunities to enhance business value..." }
  },

  "data_quality": {
    "extraction_confidence": "Moderate",
    "data_completeness_score": 0.85,
    "missing_data_flags": [
      { "field": "Customer concentration data", "impact": "Moderate", "assumption_made": "Assumed diversified based on industry" }
    ]
  },

  "metadata": {
    "documents_analyzed": [
      { "filename": "2023_1120S.pdf", "document_type": "Form 1120-S", "tax_year": "2023" }
    ],
    "processing_notes": "Analysis completed using 6-pass orchestrated approach"
  }
}

---

## IMPORTANT INSTRUCTIONS

1. Output ONLY the JSON object - no markdown code fences, no explanation
2. ALL narrative fields must contain SUBSTANTIVE content meeting word count targets
3. Numbers must be MATHEMATICALLY CONSISTENT throughout
4. Use actual data from previous passes - no placeholders
5. Round final values appropriately ($5,000 or $10,000 increments)
6. Ensure concluded value appears consistently across all sections
7. DLOM is applied to preliminary value, not individual approaches
8. Value range must bracket the concluded value (low < concluded < high)
9. Professional, third-person tone throughout all narratives
10. This output generates the PDF - quality must be publication-ready

Now synthesize all previous analysis into the complete valuation report.`;

/**
 * System context for Pass 6
 */
export const pass6SystemContext = `You are a Certified Valuation Analyst (CVA) completing a comprehensive business valuation report. Your role is to synthesize all analysis into a professional, publication-ready deliverable.

Key priorities:
1. CONSISTENCY: All numbers must match across sections
2. COMPLETENESS: Every field must have substantive content
3. PROFESSIONALISM: Third-person, objective language throughout
4. DEFENSIBILITY: Every conclusion supported by evidence
5. QUALITY: Output must be publication-ready for PDF generation

You have expertise in:
- Business valuation report writing
- Fair Market Value determination
- Valuation methodology synthesis
- Professional appraisal standards
- Narrative development`;

/**
 * Build Pass 6 prompt with context from all previous passes
 */
export function buildPass6Prompt(
  pass1Summary: string,
  pass2Summary: string,
  pass3Summary: string,
  pass4Summary: string,
  pass5Summary: string,
  injectedKnowledge: string
): string {
  return `${pass6Prompt}

## CONTEXT FROM PASS 1 (DOCUMENT EXTRACTION)

${pass1Summary}

## CONTEXT FROM PASS 2 (INDUSTRY ANALYSIS)

${pass2Summary}

## CONTEXT FROM PASS 3 (EARNINGS NORMALIZATION)

${pass3Summary}

## CONTEXT FROM PASS 4 (RISK ASSESSMENT)

${pass4Summary}

## CONTEXT FROM PASS 5 (VALUATION CALCULATION)

${pass5Summary}

## INJECTED KNOWLEDGE

${injectedKnowledge || 'No additional knowledge provided.'}

Synthesize all analysis into the complete final valuation report.`;
}

/**
 * Create a comprehensive summary of Pass 1-5 outputs for Pass 6
 */
export function createComprehensiveSummary(
  pass1Output: unknown,
  pass2Output: unknown,
  pass3Output: unknown,
  pass4Output: unknown,
  pass5Output: unknown
): string {
  const sections: string[] = [];

  // Pass 1 Summary
  if (pass1Output && typeof pass1Output === 'object') {
    const p1 = (pass1Output as Record<string, unknown>).analysis as Record<string, unknown> | undefined;
    if (p1) {
      const companyInfo = p1.company_info as Record<string, unknown> | undefined;
      const financialData = p1.financial_data as Record<string, unknown> | undefined;

      sections.push(`### PASS 1: DOCUMENT EXTRACTION
- Company: ${companyInfo?.name || 'Unknown'}
- Entity Type: ${companyInfo?.entity_type || 'Unknown'}
- Financial periods available: ${financialData ? Object.keys(financialData).join(', ') : 'None'}`);
    }
  }

  // Pass 2 Summary
  if (pass2Output && typeof pass2Output === 'object') {
    const p2 = (pass2Output as Record<string, unknown>).analysis as Record<string, unknown> | undefined;
    if (p2) {
      const overview = p2.industry_overview as Record<string, unknown> | undefined;
      const multiples = p2.valuation_multiples as Record<string, unknown> | undefined;
      const sdeMultiple = multiples?.sde_multiple as Record<string, number> | undefined;

      sections.push(`### PASS 2: INDUSTRY ANALYSIS
- Sector: ${overview?.sector || 'Unknown'}
- Growth Outlook: ${overview?.growth_outlook || 'Unknown'}
- SDE Multiple: ${sdeMultiple?.low || '?'}x - ${sdeMultiple?.high || '?'}x (typical: ${sdeMultiple?.typical || '?'}x)`);
    }
  }

  // Pass 3 Summary
  if (pass3Output && typeof pass3Output === 'object') {
    const p3 = (pass3Output as Record<string, unknown>).analysis as Record<string, unknown> | undefined;
    if (p3) {
      const sdeCalc = p3.sde_calculation as Record<string, unknown> | undefined;
      const ebitdaCalc = p3.ebitda_calculation as Record<string, unknown> | undefined;

      sections.push(`### PASS 3: EARNINGS NORMALIZATION
- Weighted Average SDE: $${((sdeCalc?.weighted_average_sde as number) || 0).toLocaleString()}
- Weighted Average EBITDA: $${((ebitdaCalc?.weighted_average_ebitda as number) || 0).toLocaleString()}`);
    }
  }

  // Pass 4 Summary
  if (pass4Output && typeof pass4Output === 'object') {
    const p4 = (pass4Output as Record<string, unknown>).analysis as Record<string, unknown> | undefined;
    if (p4) {
      sections.push(`### PASS 4: RISK ASSESSMENT
- Overall Risk Score: ${((p4.overall_risk_score as number) || 0).toFixed(2)}
- Risk Rating: ${p4.overall_risk_rating || 'Unknown'}
- Multiple Adjustment: ${(p4.risk_adjusted_multiple_adjustment as number) || 0}x`);
    }
  }

  // Pass 5 Summary
  if (pass5Output && typeof pass5Output === 'object') {
    const p5 = (pass5Output as Record<string, unknown>).analysis as Record<string, unknown> | undefined;
    if (p5) {
      const asset = p5.asset_approach as Record<string, unknown> | undefined;
      const income = p5.income_approach as Record<string, unknown> | undefined;
      const market = p5.market_approach as Record<string, unknown> | undefined;

      sections.push(`### PASS 5: VALUATION CALCULATION
- Asset Approach: $${((asset?.adjusted_net_asset_value as number) || 0).toLocaleString()} (${((asset?.weight as number) || 0) * 100}% weight)
- Income Approach: $${((income?.capitalized_value as number) || 0).toLocaleString()} (${((income?.weight as number) || 0) * 100}% weight)
- Market Approach: $${((market?.market_value as number) || 0).toLocaleString()} (${((market?.weight as number) || 0) * 100}% weight)`);
    }
  }

  return sections.join('\n\n');
}

/**
 * Validate Pass 6 output structure
 */
export function validatePass6Output(output: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!output || typeof output !== 'object') {
    errors.push('Output is not an object');
    return { valid: false, errors };
  }

  const data = output as Record<string, unknown>;

  // Check required top-level fields
  const requiredFields = [
    'schema_version',
    'valuation_date',
    'company_profile',
    'financial_data',
    'normalized_earnings',
    'industry_analysis',
    'risk_assessment',
    'valuation_approaches',
    'valuation_synthesis',
    'narratives',
    'data_quality',
    'metadata'
  ];

  for (const field of requiredFields) {
    if (!data[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Check company_profile
  if (data.company_profile) {
    const profile = data.company_profile as Record<string, unknown>;
    if (!profile.legal_name) errors.push('Missing company_profile.legal_name');
    if (!profile.entity_type) errors.push('Missing company_profile.entity_type');
  }

  // Check valuation_synthesis
  if (data.valuation_synthesis) {
    const synthesis = data.valuation_synthesis as Record<string, unknown>;

    // Check approach_summary
    if (!Array.isArray(synthesis.approach_summary)) {
      errors.push('Missing valuation_synthesis.approach_summary array');
    } else {
      // Verify weights sum to 1.0
      const totalWeight = (synthesis.approach_summary as Array<Record<string, unknown>>)
        .reduce((sum, a) => sum + ((a.weight as number) || 0), 0);
      if (Math.abs(totalWeight - 1.0) > 0.01) {
        errors.push(`Approach weights must sum to 1.0, got ${totalWeight.toFixed(2)}`);
      }
    }

    // Check final_valuation
    if (synthesis.final_valuation) {
      const fv = synthesis.final_valuation as Record<string, unknown>;
      if (typeof fv.concluded_value !== 'number') {
        errors.push('Missing valuation_synthesis.final_valuation.concluded_value');
      }
      if (typeof fv.valuation_range_low !== 'number') {
        errors.push('Missing valuation_synthesis.final_valuation.valuation_range_low');
      }
      if (typeof fv.valuation_range_high !== 'number') {
        errors.push('Missing valuation_synthesis.final_valuation.valuation_range_high');
      }

      // Check range brackets concluded value
      const low = fv.valuation_range_low as number;
      const concluded = fv.concluded_value as number;
      const high = fv.valuation_range_high as number;
      if (low && concluded && high) {
        if (low >= concluded) errors.push('valuation_range_low must be less than concluded_value');
        if (concluded >= high) errors.push('concluded_value must be less than valuation_range_high');
      }
    }
  }

  // Check narratives
  if (data.narratives) {
    const narratives = data.narratives as Record<string, unknown>;
    const requiredNarratives = [
      { key: 'executive_summary', minWords: 600 },
      { key: 'company_overview', minWords: 400 },
      { key: 'financial_analysis', minWords: 800 },
      { key: 'industry_analysis', minWords: 500 },
      { key: 'risk_assessment', minWords: 500 },
      { key: 'asset_approach_narrative', minWords: 300 },
      { key: 'income_approach_narrative', minWords: 300 },
      { key: 'market_approach_narrative', minWords: 300 },
      { key: 'valuation_synthesis_narrative', minWords: 400 },
      { key: 'assumptions_and_limiting_conditions', minWords: 300 },
      { key: 'value_enhancement_recommendations', minWords: 400 }
    ];

    for (const { key, minWords } of requiredNarratives) {
      const narrative = narratives[key] as Record<string, unknown> | undefined;
      if (!narrative) {
        errors.push(`Missing narrative: ${key}`);
      } else if (!narrative.content || typeof narrative.content !== 'string') {
        errors.push(`Missing narrative content: ${key}`);
      } else {
        const wordCount = (narrative.content as string).split(/\s+/).length;
        if (wordCount < minWords) {
          errors.push(`Narrative ${key} too short: ${wordCount} words (need ${minWords}+)`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Perform consistency checks on final output
 */
export function performConsistencyChecks(output: unknown): { passed: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!output || typeof output !== 'object') {
    errors.push('Output is not a valid object');
    return { passed: false, errors, warnings };
  }

  const data = output as Record<string, unknown>;
  const synthesis = data.valuation_synthesis as Record<string, unknown> | undefined;
  const approaches = data.valuation_approaches as Record<string, unknown> | undefined;

  if (!synthesis || !approaches) {
    errors.push('Missing valuation_synthesis or valuation_approaches');
    return { passed: false, errors, warnings };
  }

  // Check 1: Weights sum to 100%
  const approachSummary = synthesis.approach_summary as Array<Record<string, unknown>> | undefined;
  if (approachSummary) {
    const totalWeight = approachSummary.reduce((sum, a) => sum + ((a.weight as number) || 0), 0);
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      errors.push(`Weights sum to ${(totalWeight * 100).toFixed(1)}%, must be 100%`);
    }
  }

  // Check 2: Weighted values calculated correctly
  if (approachSummary) {
    for (const approach of approachSummary) {
      const value = approach.value as number;
      const weight = approach.weight as number;
      const weightedValue = approach.weighted_value as number;
      const expected = value * weight;
      if (Math.abs(expected - weightedValue) > 100) {
        warnings.push(`${approach.approach} weighted value may be incorrect: ${weightedValue} vs expected ${expected.toFixed(0)}`);
      }
    }
  }

  // Check 3: Preliminary value = sum of weighted values
  if (approachSummary) {
    const sumWeighted = approachSummary.reduce((sum, a) => sum + ((a.weighted_value as number) || 0), 0);
    const preliminary = synthesis.preliminary_value as number;
    if (Math.abs(sumWeighted - preliminary) > 100) {
      errors.push(`Preliminary value (${preliminary}) doesn't match sum of weighted values (${sumWeighted.toFixed(0)})`);
    }
  }

  // Check 4: DLOM applied correctly
  const discounts = synthesis.discounts_and_premiums as Record<string, unknown> | undefined;
  const finalVal = synthesis.final_valuation as Record<string, unknown> | undefined;
  if (discounts && finalVal) {
    const dlom = discounts.dlom as Record<string, unknown> | undefined;
    const preliminary = synthesis.preliminary_value as number;
    const concluded = finalVal.concluded_value as number;

    if (dlom?.applicable && dlom?.percentage) {
      const dlomPct = dlom.percentage as number;
      const expectedConcluded = preliminary * (1 - dlomPct);
      // Allow for rounding
      if (Math.abs(expectedConcluded - concluded) > 5000) {
        warnings.push(`Concluded value may not reflect DLOM correctly: ${concluded} vs expected ${expectedConcluded.toFixed(0)}`);
      }
    }
  }

  // Check 5: Value range brackets concluded value
  if (finalVal) {
    const low = finalVal.valuation_range_low as number;
    const concluded = finalVal.concluded_value as number;
    const high = finalVal.valuation_range_high as number;

    if (low >= concluded) {
      errors.push('Value range low must be less than concluded value');
    }
    if (concluded >= high) {
      errors.push('Concluded value must be less than value range high');
    }
  }

  // Check 6: Cap rate and implied multiple consistency
  const income = approaches.income_approach as Record<string, unknown> | undefined;
  if (income) {
    const capRateBuildup = income.cap_rate_buildup as Record<string, unknown> | undefined;
    if (capRateBuildup) {
      const capRate = capRateBuildup.total_cap_rate as number;
      const earnings = income.normalized_earnings as number;
      const capitalizedValue = income.capitalized_value as number;

      if (capRate > 0 && earnings > 0) {
        const expectedValue = earnings / capRate;
        if (Math.abs(expectedValue - capitalizedValue) > 1000) {
          warnings.push(`Income approach value may be incorrect: ${capitalizedValue} vs expected ${expectedValue.toFixed(0)}`);
        }
      }
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Calculate DLOM based on business characteristics
 */
export function calculateSuggestedDLOM(
  riskScore: number,
  revenue: number,
  hasGoodRecords: boolean
): { rate: number; rationale: string } {
  let dlom = 0.15; // Base 15%

  // Adjust for risk
  if (riskScore <= 2.0) dlom -= 0.02;
  else if (riskScore >= 3.5) dlom += 0.05;
  else if (riskScore >= 3.0) dlom += 0.03;

  // Adjust for size
  if (revenue < 500000) dlom += 0.05;
  else if (revenue < 1000000) dlom += 0.02;
  else if (revenue > 5000000) dlom -= 0.03;

  // Adjust for record quality
  if (!hasGoodRecords) dlom += 0.03;

  // Cap at reasonable range
  dlom = Math.max(0.10, Math.min(0.35, dlom));

  const rationale = `DLOM of ${(dlom * 100).toFixed(0)}% based on risk score (${riskScore.toFixed(2)}), ` +
    `business size ($${revenue.toLocaleString()} revenue), and financial record quality.`;

  return { rate: dlom, rationale };
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
  prompt: pass6Prompt,
  systemContext: pass6SystemContext,
  buildPrompt: buildPass6Prompt,
  createComprehensiveSummary,
  validate: validatePass6Output,
  performConsistencyChecks,
  calculateSuggestedDLOM,
  roundValue,
};
