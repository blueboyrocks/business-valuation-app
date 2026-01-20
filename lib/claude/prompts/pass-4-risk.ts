/**
 * Pass 4: Risk Assessment Prompt
 *
 * This pass evaluates 10 weighted risk factors, calculates the overall
 * risk score, determines the multiple adjustment, and generates a risk narrative.
 */

export const pass4Prompt = `You are a business valuation risk analyst. Your task is to evaluate company-specific risk factors that affect the valuation multiple.

## RISK ASSESSMENT FRAMEWORK

Score each of the following 10 risk factors on a 1-5 scale:
- **1 = Low Risk** (favorable condition, supports premium multiple)
- **2 = Below Average Risk** (better than typical)
- **3 = Average Risk** (typical for small businesses)
- **4 = Above Average Risk** (concerning, warrants discount)
- **5 = High Risk** (serious concern, significant discount)

### THE 10 RISK FACTORS WITH WEIGHTS

| Factor | Weight | Description |
|--------|--------|-------------|
| **1. Size Risk** | 15% | Larger businesses are more stable. Revenue <$500K = 5, $500K-$1M = 4, $1M-$2M = 3, $2M-$5M = 2, >$5M = 1 |
| **2. Customer Concentration** | 15% | Revenue dependence on few customers. Top customer >35% = 5, 20-35% = 4, 10-20% = 3, 5-10% = 2, <5% = 1 |
| **3. Owner Dependence** | 15% | How critical is the owner? Owner IS the business = 5, primary operator = 4, active with support = 3, semi-absentee = 2, fully absentee = 1 |
| **4. Management Depth** | 10% | Management beyond owner. No management = 5, limited = 4, key managers = 3, strong #2 = 2, executive team = 1 |
| **5. Financial Record Quality** | 10% | Record reliability. Poor/gaps = 5, tax returns only = 4, compiled = 3, reviewed = 2, audited = 1 |
| **6. Industry Outlook** | 10% | Industry prospects. Severe decline = 5, declining = 4, stable = 3, moderate growth = 2, high growth = 1 |
| **7. Competitive Position** | 10% | Market positioning. Struggling = 5, weak = 4, solid = 3, strong = 2, market leader = 1 |
| **8. Geographic Concentration** | 5% | Geographic diversification. Single location weak market = 5, single location good market = 4, metro area = 3, regional = 2, national = 1 |
| **9. Supplier Dependence** | 5% | Supplier risk. Single source = 5, dependent on 1-2 = 4, key supplier = 3, primary with alternatives = 2, highly diversified = 1 |
| **10. Regulatory Risk** | 5% | Regulatory exposure. Highly regulated = 5, heavy = 4, moderate = 3, standard = 2, minimal = 1 |

### FOR EACH FACTOR, PROVIDE:

1. **Score (1-5)**: Based on evidence from previous passes
2. **Description**: Why this score was assigned (2-3 sentences)
3. **Mitigation**: How this risk could be reduced (1-2 sentences)
4. **Impact on Value**: How this factor affects the valuation (brief statement)

## WEIGHTED RISK SCORE CALCULATION

Calculate the weighted average:

\`\`\`
Weighted Score =
    (Size Risk × 0.15) +
    (Customer Concentration × 0.15) +
    (Owner Dependence × 0.15) +
    (Management Depth × 0.10) +
    (Financial Record Quality × 0.10) +
    (Industry Outlook × 0.10) +
    (Competitive Position × 0.10) +
    (Geographic Concentration × 0.05) +
    (Supplier Dependence × 0.05) +
    (Regulatory Risk × 0.05)

= Total Weighted Score (1.0 to 5.0)
\`\`\`

## MULTIPLE ADJUSTMENT TABLE

Based on the weighted risk score, determine the adjustment to the industry multiple:

| Weighted Score | Risk Rating | Multiple Adjustment |
|----------------|-------------|---------------------|
| 1.0 - 1.5 | Low | +0.5x to +1.0x |
| 1.5 - 2.0 | Below Average | +0.25x to +0.5x |
| 2.0 - 2.5 | Average | 0x (no adjustment) |
| 2.5 - 3.0 | Above Average | -0.25x to -0.5x |
| 3.0 - 3.5 | High | -0.5x to -0.75x |
| 3.5 - 5.0 | Very High | -0.75x to -1.5x |

Select within the range based on:
- Use LOW end if scores cluster near threshold
- Use HIGH end if multiple factors are at extreme scores
- Consider compounding effects of related risks

## COMPANY-SPECIFIC ANALYSIS

Beyond the 10 factors, identify:

**Company-Specific Risks (3-5):**
- Risks not captured by standard factors
- Transition risks during ownership change
- Hidden risks (deferred maintenance, legal exposure, aging workforce)

**Company-Specific Strengths (3-5):**
- Unique competitive advantages
- Valuable intangibles (brand, reputation, IP)
- Growth opportunities

## RISK NARRATIVE

Write a comprehensive risk assessment narrative (600-800 words) covering:

**Paragraph 1 - Overall Assessment (100-120 words):**
Overall risk rating, weighted score, primary risk drivers, comparison to typical small business.

**Paragraph 2 - Key Risk Factors (150-180 words):**
Discuss the 2-3 highest-scored factors with evidence and impact on value.

**Paragraph 3 - Risk Mitigants (120-150 words):**
Discuss the 2-3 lowest-scored factors (strengths) and how they offset risks.

**Paragraph 4 - Company-Specific Analysis (120-150 words):**
Unique risks and strengths, transition considerations, what a buyer should monitor.

**Paragraph 5 - Conclusion (100-120 words):**
State the multiple adjustment, justify it, note any deal structure recommendations (earnout, seller note, transition period).

## OUTPUT FORMAT

Respond with ONLY valid JSON matching this exact structure:

{
  "analysis": {
    "overall_risk_rating": "Average",
    "overall_risk_score": 2.65,
    "risk_factors": [
      {
        "factor": "Size Risk",
        "weight": 0.15,
        "score": 3,
        "description": "Revenue of $1.2M places this business in the typical small business category with moderate scale.",
        "mitigation": "Document systems and processes to demonstrate scalability potential to buyers.",
        "impact_on_value": "Neutral - average size means standard multiple applies"
      },
      {
        "factor": "Customer Concentration",
        "weight": 0.15,
        "score": 2,
        "description": "Well-diversified customer base with largest customer at 8% of revenue. Top 5 customers represent 25% combined.",
        "mitigation": "Continue expanding customer base and avoid over-reliance on any single account.",
        "impact_on_value": "Positive - diversification reduces risk and supports multiple"
      },
      {
        "factor": "Owner Dependence",
        "weight": 0.15,
        "score": 4,
        "description": "Owner works 50+ hours weekly and maintains primary relationships with key customers and vendors.",
        "mitigation": "Document processes, cross-train employees, consider extended transition period with earnout.",
        "impact_on_value": "Negative - significant transition risk warrants multiple discount"
      },
      {
        "factor": "Management Depth",
        "weight": 0.10,
        "score": 3,
        "description": "Operations manager handles day-to-day but owner makes all strategic decisions.",
        "mitigation": "Empower operations manager with more decision authority before sale.",
        "impact_on_value": "Neutral - typical for businesses this size"
      },
      {
        "factor": "Financial Record Quality",
        "weight": 0.10,
        "score": 2,
        "description": "CPA-prepared tax returns with organized QuickBooks records and documented add-backs.",
        "mitigation": "Maintain current practices and ensure clean transition of records.",
        "impact_on_value": "Positive - clean records build buyer confidence"
      },
      {
        "factor": "Industry Outlook",
        "weight": 0.10,
        "score": 2,
        "description": "Industry growing 4-5% annually with favorable demographic and regulatory tailwinds.",
        "mitigation": "Stay current on technology and regulatory changes affecting the industry.",
        "impact_on_value": "Positive - growth outlook supports higher multiple"
      },
      {
        "factor": "Competitive Position",
        "weight": 0.10,
        "score": 2,
        "description": "Strong local reputation with 4.7 star reviews, premium pricing, and loyal customer base.",
        "mitigation": "Document brand assets and customer testimonials for transition.",
        "impact_on_value": "Positive - reputation provides competitive moat"
      },
      {
        "factor": "Geographic Concentration",
        "weight": 0.05,
        "score": 4,
        "description": "Single location serving 30-mile radius with no expansion plans.",
        "mitigation": "Consider expansion potential as value enhancement opportunity.",
        "impact_on_value": "Slight negative - limited by local market"
      },
      {
        "factor": "Supplier Dependence",
        "weight": 0.05,
        "score": 2,
        "description": "Relationships with multiple suppliers, no exclusive arrangements, easy to switch.",
        "mitigation": "Maintain certifications with multiple vendors.",
        "impact_on_value": "Positive - supply chain flexibility"
      },
      {
        "factor": "Regulatory Risk",
        "weight": 0.05,
        "score": 3,
        "description": "Standard industry licensing requirements, all certifications current, no violations.",
        "mitigation": "Maintain compliance and monitor regulatory changes.",
        "impact_on_value": "Neutral - standard requirements"
      }
    ],
    "company_specific_risks": [
      "Owner maintains personal relationships with top 20 customers",
      "Key technician approaching retirement age with no succession plan",
      "No documented standard operating procedures"
    ],
    "company_specific_strengths": [
      "25% of revenue from recurring maintenance agreements",
      "Experienced technician team with low turnover",
      "Strong online reputation differentiates from competitors"
    ],
    "risk_adjusted_multiple_adjustment": -0.25,
    "risk_narrative": "The risk assessment for XYZ Company yields an overall weighted risk score of 2.65, placing the business in the 'Above Average Risk' category..."
  },
  "knowledge_requests": {
    "industry_specific": [],
    "tax_form_specific": [],
    "risk_factors": [],
    "comparable_industries": [],
    "benchmarks_needed": ["cap_rate_buildup", "comparable_transactions"]
  },
  "knowledge_reasoning": "For Pass 5, we need cap rate buildup methodology for the income approach and comparable transaction data for market approach validation."
}

## IMPORTANT INSTRUCTIONS

1. Output ONLY the JSON object - no markdown, no explanation
2. Score ALL 10 risk factors with evidence from previous passes
3. Calculate weighted score correctly (must sum weights × scores)
4. Select multiple adjustment from the table based on weighted score
5. Identify 3-5 company-specific risks AND 3-5 strengths
6. Write risk narrative of 600-800 words covering all 5 paragraphs
7. Be specific with evidence - cite numbers, percentages, facts from financial data
8. Consider how risks interact (owner dependence + customer concentration compounds)

Now analyze the risk profile for the business described in the provided context.`;

/**
 * System context for Pass 4
 */
export const pass4SystemContext = `You are an expert business valuation risk analyst. Your role is to objectively assess company-specific risk factors that affect the appropriate valuation multiple.

Key priorities:
1. EVIDENCE-BASED: Every score must cite specific evidence from previous passes
2. OBJECTIVE: Apply consistent standards across all 10 factors
3. BUYER PERSPECTIVE: What risks would concern a potential acquirer?
4. QUANTIFIED IMPACT: Connect risk assessment to multiple adjustment

You have expertise in:
- Small business risk assessment frameworks
- Valuation multiple adjustments
- Due diligence risk identification
- Deal structure recommendations
- Transition planning`;

/**
 * Build Pass 4 prompt with context from Passes 1-3 and injected knowledge
 */
export function buildPass4Prompt(
  pass1Summary: string,
  pass2Summary: string,
  pass3Summary: string,
  injectedKnowledge: string
): string {
  return `${pass4Prompt}

## CONTEXT FROM PASS 1 (DOCUMENT EXTRACTION)

${pass1Summary}

## CONTEXT FROM PASS 2 (INDUSTRY ANALYSIS)

${pass2Summary}

## CONTEXT FROM PASS 3 (EARNINGS NORMALIZATION)

${pass3Summary}

## INJECTED RISK ASSESSMENT KNOWLEDGE

${injectedKnowledge || 'No specific risk guidance available. Apply standard small business risk assessment framework.'}

Analyze this business's risk profile and provide your assessment.`;
}

/**
 * Create a summary of Pass 1 output for Pass 4 input
 */
export function summarizePass1ForPass4(pass1Output: unknown): string {
  if (!pass1Output || typeof pass1Output !== 'object') {
    return 'No Pass 1 data available.';
  }

  const data = pass1Output as Record<string, unknown>;
  const analysis = data.analysis as Record<string, unknown> | undefined;

  if (!analysis) {
    return 'No analysis data available from Pass 1.';
  }

  const companyInfo = analysis.company_info as Record<string, unknown> | undefined;
  const industryClass = analysis.industry_classification as Record<string, unknown> | undefined;
  const financialData = analysis.financial_data as Record<string, unknown> | undefined;
  const docInfo = analysis.document_info as Record<string, unknown> | undefined;
  const dataQualityFlags = analysis.data_quality_flags as string[] | undefined;

  const years = financialData ? Object.keys(financialData).sort().reverse() : [];
  const latestYear = years[0];
  const latestFinancials = latestYear
    ? (financialData?.[latestYear] as Record<string, unknown>)
    : null;

  let summary = `### Company Information
- Name: ${companyInfo?.name || 'Unknown'}
- Entity Type: ${companyInfo?.entity_type || 'Unknown'}
- Location: ${(companyInfo?.address as Record<string, unknown>)?.city || 'Unknown'}, ${(companyInfo?.address as Record<string, unknown>)?.state || ''}

### Industry Classification
- NAICS Code: ${industryClass?.naics_code || 'Unknown'}
- Description: ${industryClass?.naics_description || 'Unknown'}
- Confidence: ${industryClass?.confidence || 'Medium'}

### Document Quality
- Primary Type: ${docInfo?.primary_type || 'Unknown'}
- Quality Assessment: ${docInfo?.quality || 'Unknown'}`;

  if (latestFinancials) {
    const revenue = (latestFinancials.revenue as number) || 0;
    const balanceSheet = latestFinancials.balance_sheet as Record<string, unknown> | undefined;

    summary += `

### Financial Summary (${latestYear})
- Revenue: $${revenue.toLocaleString()}
- Net Income: $${((latestFinancials.net_income as number) || 0).toLocaleString()}
- Owner Compensation: $${((latestFinancials.owner_compensation as number) || 0).toLocaleString()}`;

    if (balanceSheet) {
      summary += `
- Total Assets: $${((balanceSheet.total_assets as number) || 0).toLocaleString()}`;
    }
  }

  if (dataQualityFlags && dataQualityFlags.length > 0) {
    summary += `

### Data Quality Flags
${dataQualityFlags.map(flag => `- ${flag}`).join('\n')}`;
  }

  return summary;
}

/**
 * Create a summary of Pass 2 output for Pass 4 input
 */
export function summarizePass2ForPass4(pass2Output: unknown): string {
  if (!pass2Output || typeof pass2Output !== 'object') {
    return 'No Pass 2 data available.';
  }

  const data = pass2Output as Record<string, unknown>;
  const analysis = data.analysis as Record<string, unknown> | undefined;

  if (!analysis) {
    return 'No analysis data available from Pass 2.';
  }

  const overview = analysis.industry_overview as Record<string, unknown> | undefined;
  const benchmarks = analysis.industry_benchmarks as Record<string, unknown> | undefined;
  const multiples = analysis.valuation_multiples as Record<string, unknown> | undefined;

  let summary = `### Industry Overview
- Sector: ${overview?.sector || 'Unknown'}
- Growth Outlook: ${overview?.growth_outlook || 'Unknown'}
- Growth Rate: ${overview?.growth_rate || 'Unknown'}`;

  if (overview?.key_trends && Array.isArray(overview.key_trends)) {
    summary += `
- Key Trends: ${(overview.key_trends as string[]).slice(0, 3).join('; ')}`;
  }

  summary += `

### Competitive Landscape
${analysis.competitive_landscape || 'Not available'}`;

  if (benchmarks) {
    const sdeMargin = benchmarks.sde_margin as Record<string, number> | undefined;
    if (sdeMargin) {
      summary += `

### Industry Benchmarks
- SDE Margin: Low ${(sdeMargin.low * 100).toFixed(0)}% / Median ${(sdeMargin.median * 100).toFixed(0)}% / High ${(sdeMargin.high * 100).toFixed(0)}%`;
    }
  }

  if (multiples) {
    const sdeMultiple = multiples.sde_multiple as Record<string, number> | undefined;
    if (sdeMultiple) {
      summary += `

### Valuation Multiples
- SDE Multiple: Low ${sdeMultiple.low}x / Typical ${sdeMultiple.typical}x / High ${sdeMultiple.high}x
- Source: ${multiples.source || 'Not specified'}`;
    }
  }

  return summary;
}

/**
 * Create a summary of Pass 3 output for Pass 4 input
 */
export function summarizePass3ForPass4(pass3Output: unknown): string {
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
- Weighted Average SDE: $${weightedSDE.toLocaleString()}
- Weighting Method: ${sdeCalc.weighting_method || 'Not specified'}`;

    const periods = sdeCalc.periods as Array<Record<string, unknown>> | undefined;
    if (periods && periods.length > 0) {
      summary += `
- Periods Analyzed: ${periods.length}`;
      const latestPeriod = periods[0];
      if (latestPeriod) {
        summary += `
- Latest Period SDE: $${((latestPeriod.sde as number) || 0).toLocaleString()}
- Total Adjustments: $${((latestPeriod.total_adjustments as number) || 0).toLocaleString()}`;
      }
    }
  }

  if (ebitdaCalc) {
    const weightedEBITDA = (ebitdaCalc.weighted_average_ebitda as number) || 0;
    summary += `

### EBITDA
- Weighted Average EBITDA: $${weightedEBITDA.toLocaleString()}`;
  }

  if (qualityAssessment) {
    summary += `

### Earnings Quality
- Quality Score: ${qualityAssessment.quality_score || 'Not assessed'}`;

    const factors = qualityAssessment.factors as string[] | undefined;
    if (factors && factors.length > 0) {
      summary += `
- Quality Factors: ${factors.slice(0, 3).join('; ')}`;
    }
  }

  return summary;
}

/**
 * Validate Pass 4 output structure
 */
export function validatePass4Output(output: unknown): { valid: boolean; errors: string[] } {
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

  // Check overall_risk_rating
  const validRatings = ['Low', 'Below Average', 'Average', 'Above Average', 'High'];
  if (!analysis.overall_risk_rating || !validRatings.includes(analysis.overall_risk_rating as string)) {
    errors.push('Missing or invalid overall_risk_rating (must be Low, Below Average, Average, Above Average, or High)');
  }

  // Check overall_risk_score
  if (typeof analysis.overall_risk_score !== 'number') {
    errors.push('Missing overall_risk_score');
  } else if (analysis.overall_risk_score < 1 || analysis.overall_risk_score > 5) {
    errors.push('overall_risk_score must be between 1 and 5');
  }

  // Check risk_factors
  if (!Array.isArray(analysis.risk_factors)) {
    errors.push('Missing risk_factors array');
  } else {
    if (analysis.risk_factors.length !== 10) {
      errors.push(`Expected 10 risk_factors, got ${analysis.risk_factors.length}`);
    }

    // Validate structure of each risk factor
    const requiredFactors = [
      'Size Risk', 'Customer Concentration', 'Owner Dependence', 'Management Depth',
      'Financial Record Quality', 'Industry Outlook', 'Competitive Position',
      'Geographic Concentration', 'Supplier Dependence', 'Regulatory Risk'
    ];

    const foundFactors = new Set<string>();
    for (const factor of analysis.risk_factors as Array<Record<string, unknown>>) {
      if (!factor.factor) errors.push('Risk factor missing factor name');
      else foundFactors.add(factor.factor as string);

      if (typeof factor.weight !== 'number') errors.push(`Risk factor "${factor.factor}" missing weight`);
      if (typeof factor.score !== 'number') errors.push(`Risk factor "${factor.factor}" missing score`);
      else if ((factor.score as number) < 1 || (factor.score as number) > 5) {
        errors.push(`Risk factor "${factor.factor}" score must be 1-5`);
      }
      if (!factor.description) errors.push(`Risk factor "${factor.factor}" missing description`);
      if (!factor.mitigation) errors.push(`Risk factor "${factor.factor}" missing mitigation`);
      if (!factor.impact_on_value) errors.push(`Risk factor "${factor.factor}" missing impact_on_value`);
    }

    for (const required of requiredFactors) {
      if (!foundFactors.has(required)) {
        errors.push(`Missing required risk factor: ${required}`);
      }
    }
  }

  // Check company_specific_risks
  if (!Array.isArray(analysis.company_specific_risks)) {
    errors.push('Missing company_specific_risks array');
  } else if (analysis.company_specific_risks.length < 3) {
    errors.push('company_specific_risks must have at least 3 items');
  }

  // Check company_specific_strengths
  if (!Array.isArray(analysis.company_specific_strengths)) {
    errors.push('Missing company_specific_strengths array');
  } else if (analysis.company_specific_strengths.length < 3) {
    errors.push('company_specific_strengths must have at least 3 items');
  }

  // Check risk_adjusted_multiple_adjustment
  if (typeof analysis.risk_adjusted_multiple_adjustment !== 'number') {
    errors.push('Missing risk_adjusted_multiple_adjustment');
  }

  // Check risk_narrative
  if (!analysis.risk_narrative || typeof analysis.risk_narrative !== 'string') {
    errors.push('Missing risk_narrative');
  } else {
    const wordCount = (analysis.risk_narrative as string).split(/\s+/).length;
    if (wordCount < 500) {
      errors.push(`risk_narrative too short: ${wordCount} words (need 600-800)`);
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
 * Calculate weighted risk score from risk factors
 */
export function calculateWeightedRiskScore(
  riskFactors: Array<{ factor: string; weight: number; score: number }>
): number {
  return riskFactors.reduce((sum, factor) => sum + (factor.weight * factor.score), 0);
}

/**
 * Determine risk rating from weighted score
 */
export function getRiskRatingFromScore(
  weightedScore: number
): 'Low' | 'Below Average' | 'Average' | 'Above Average' | 'High' {
  if (weightedScore <= 1.5) return 'Low';
  if (weightedScore <= 2.0) return 'Below Average';
  if (weightedScore <= 2.5) return 'Average';
  if (weightedScore <= 3.0) return 'Above Average';
  return 'High';
}

/**
 * Get recommended multiple adjustment from weighted score
 */
export function getMultipleAdjustmentFromScore(weightedScore: number): { low: number; high: number } {
  if (weightedScore <= 1.5) return { low: 0.5, high: 1.0 };
  if (weightedScore <= 2.0) return { low: 0.25, high: 0.5 };
  if (weightedScore <= 2.5) return { low: 0, high: 0 };
  if (weightedScore <= 3.0) return { low: -0.5, high: -0.25 };
  if (weightedScore <= 3.5) return { low: -0.75, high: -0.5 };
  return { low: -1.5, high: -0.75 };
}

export default {
  prompt: pass4Prompt,
  systemContext: pass4SystemContext,
  buildPrompt: buildPass4Prompt,
  summarizePass1: summarizePass1ForPass4,
  summarizePass2: summarizePass2ForPass4,
  summarizePass3: summarizePass3ForPass4,
  validate: validatePass4Output,
  calculateWeightedRiskScore,
  getRiskRatingFromScore,
  getMultipleAdjustmentFromScore,
};
