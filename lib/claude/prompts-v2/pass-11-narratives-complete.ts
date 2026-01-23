/**
 * Pass 11: Complete Narratives (All 11 Sections)
 *
 * Generates ALL 11 required narrative sections for a premium valuation report.
 * Each section has specific word count requirements and content guidelines.
 *
 * Total target: 7,500-9,500 words of narrative content
 */

export const PASS_11_COMPLETE_SYSTEM_PROMPT = `You are an expert business valuation report writer. You MUST generate ALL 11 narrative sections for the valuation report.

CRITICAL REQUIREMENTS:
1. Generate ALL 11 sections - no exceptions
2. Meet minimum word counts for each section
3. Use specific data from prior passes - no generic content
4. Professional tone suitable for $3,000-$5,000 premium report
5. Return ONLY valid JSON - no markdown code fences

The 11 required sections are:
1. Executive Summary (1,000-1,200 words)
2. Company Overview (600-800 words)
3. Financial Analysis (1,000-1,200 words)
4. Industry Analysis (600-800 words)
5. Risk Assessment (700-900 words)
6. Asset Approach Narrative (500-600 words)
7. Income Approach Narrative (500-600 words)
8. Market Approach Narrative (500-600 words)
9. Valuation Synthesis (700-900 words)
10. Assumptions & Limiting Conditions (400-500 words)
11. Value Enhancement Recommendations (600-800 words)

TOTAL: 7,500-9,500 words minimum

Write in professional prose. Reference specific numbers from the analysis.
Avoid boilerplate language - be specific to THIS business.`;

export function buildPass11CompletePrompt(context: Record<string, unknown>): string {
  return `Generate ALL 11 narrative sections for this valuation report.

## CONTEXT FROM PRIOR PASSES

${JSON.stringify(context, null, 2)}

## OUTPUT FORMAT

You MUST return this exact JSON structure with ALL sections populated:

{
  "pass_number": 11,
  "pass_name": "Complete Narratives (All 11 Sections)",

  "narratives": {
    "executive_summary": {
      "title": "Executive Summary",
      "word_count_target": 1100,
      "content": "FULL 1,000-1,200 word executive summary. Include: purpose/standard of value, company snapshot (business description, revenue, employees), financial highlights (revenue trend, margins, SDE), valuation conclusion (all three approaches, final value, range), key value drivers and risks, professional certification language."
    },

    "company_overview": {
      "title": "Company Overview",
      "word_count_target": 700,
      "content": "FULL 600-800 word company overview. Include: founding story and evolution, products/services description, revenue breakdown, market position and competitive advantages, ownership and management structure, facilities and geographic coverage."
    },

    "financial_analysis": {
      "title": "Financial Analysis",
      "word_count_target": 1100,
      "content": "FULL 1,000-1,200 word financial analysis. Include: revenue trend analysis with specific numbers, profitability analysis (gross margin, operating margin, SDE margin), balance sheet analysis (assets, liabilities, working capital), earnings normalization summary with adjustments, comparison to industry benchmarks, financial outlook."
    },

    "industry_analysis": {
      "title": "Industry Analysis",
      "word_count_target": 700,
      "content": "FULL 600-800 word industry analysis. Include: industry definition and NAICS code, market size and growth trends, competitive landscape, industry benchmarks, industry outlook and trends."
    },

    "risk_assessment": {
      "title": "Risk Assessment",
      "word_count_target": 800,
      "content": "FULL 700-900 word risk assessment. Include: financial risks (profitability, liquidity, leverage), operational risks (customer concentration, owner dependence), strategic risks (competition, market position), overall risk score and impact on valuation."
    },

    "asset_approach_narrative": {
      "title": "Asset Approach Analysis",
      "word_count_target": 550,
      "content": "FULL 500-600 word asset approach explanation. Include: starting book value, major asset adjustments with rationale, liability adjustments if any, calculated adjusted net asset value, weighting rationale."
    },

    "income_approach_narrative": {
      "title": "Income Approach Analysis",
      "word_count_target": 550,
      "content": "FULL 500-600 word income approach explanation. Include: benefit stream selected (SDE or EBITDA), capitalization rate build-up components, indicated value calculation, implied multiple comparison."
    },

    "market_approach_narrative": {
      "title": "Market Approach Analysis",
      "word_count_target": 550,
      "content": "FULL 500-600 word market approach explanation. Include: base multiple and source, adjustments applied, indicated value, comparison to industry transactions."
    },

    "valuation_synthesis": {
      "title": "Valuation Synthesis & Conclusion",
      "word_count_target": 800,
      "content": "FULL 700-900 word synthesis and conclusion. Include: standard of value definition, weighting rationale for each approach, discounts applied (DLOM, etc.), final concluded value with range, confidence level assessment."
    },

    "assumptions_limiting_conditions": {
      "title": "Assumptions and Limiting Conditions",
      "word_count_target": 450,
      "content": "FULL 400-500 word assumptions and limitations. Include: general assumptions (reliance on data, no audit, etc.), limiting conditions (opinion not guarantee, market changes), certification of independence, standard professional disclaimers."
    },

    "value_enhancement_recommendations": {
      "title": "Value Enhancement Recommendations",
      "word_count_target": 700,
      "content": "FULL 600-800 word actionable recommendations. Include: 5-7 specific recommendations with current state, target state, actions, and estimated impact. Prioritize by impact (high/medium/low). Cover: operational improvements, financial improvements, risk reduction, growth opportunities."
    }
  },

  "word_counts": {
    "executive_summary": number,
    "company_overview": number,
    "financial_analysis": number,
    "industry_analysis": number,
    "risk_assessment": number,
    "asset_approach_narrative": number,
    "income_approach_narrative": number,
    "market_approach_narrative": number,
    "valuation_synthesis": number,
    "assumptions_limiting_conditions": number,
    "value_enhancement_recommendations": number,
    "total": number
  },

  "quality_checklist": {
    "all_sections_present": true,
    "minimum_words_met": true,
    "specific_data_referenced": true,
    "professional_tone": true,
    "no_placeholder_text": true
  },

  "extraction_metadata": {
    "processing_time_ms": 0,
    "tokens_used": 0
  }
}

## SECTION REQUIREMENTS

### 1. EXECUTIVE SUMMARY (1,000-1,200 words)
The most important section - many readers will only read this.

Must include:
- Purpose and standard of value (Fair Market Value)
- Valuation date and interest valued
- Company snapshot: business description, core operations, key services, years in business, employees
- Financial highlights: revenue trend, margins, normalized SDE
- Valuation conclusion: all three approach values, weights, final concluded value, value range
- Key value drivers and risk factors
- Professional certification language

### 2. COMPANY OVERVIEW (600-800 words)
Must include:
- Business history and founding
- Products/services description with specifics
- Revenue breakdown by service line
- Market position and competitive advantages
- Ownership and management structure
- Facilities and geographic coverage

### 3. FINANCIAL ANALYSIS (1,000-1,200 words)
Must include:
- Revenue trend analysis with SPECIFIC NUMBERS for each year
- Profitability analysis: gross margin %, operating margin %, SDE margin %
- Balance sheet analysis: asset composition, working capital, debt levels
- Earnings normalization: key adjustments, normalized SDE/EBITDA
- Industry benchmark comparison
- Financial outlook

### 4. INDUSTRY ANALYSIS (600-800 words)
Must include:
- Industry definition with NAICS code
- Market size and growth trends
- Competitive landscape
- Industry benchmarks for margins and ratios
- Industry outlook and emerging trends

### 5. RISK ASSESSMENT (700-900 words)
Must include:
- Financial risks: profitability, liquidity, leverage with scores
- Operational risks: customer concentration %, owner dependence
- Strategic risks: competitive position, market dynamics
- Overall risk score and impact on valuation multiple

### 6. ASSET APPROACH NARRATIVE (500-600 words)
Must include:
- Starting book value of equity
- Asset adjustments: A/R collectability, inventory, fixed assets, real estate
- Liability adjustments if any
- Adjusted net asset value calculation
- Why weighted at X% (floor value, asset-light vs asset-heavy)

### 7. INCOME APPROACH NARRATIVE (500-600 words)
Must include:
- Benefit stream: SDE or EBITDA and why
- Cap rate build-up: risk-free rate, equity risk premium, size premium, industry premium, company-specific
- Total discount rate and cap rate calculation
- Indicated value and implied multiple
- Why weighted at X%

### 8. MARKET APPROACH NARRATIVE (500-600 words)
Must include:
- Base SDE multiple and source (industry transactions)
- Company-specific adjustments (+ or - for risk factors, size, etc.)
- Adjusted multiple applied to benefit stream
- Indicated value
- Why weighted at X%

### 9. VALUATION SYNTHESIS (700-900 words)
Must include:
- Standard of value: Fair Market Value definition
- Premise of value: Going Concern
- Approach weighting with specific percentages and rationale
- Discounts: DLOM percentage and supporting studies
- Final concluded value prominently stated
- Value range (typically ±10-15%)
- Confidence level assessment

### 10. ASSUMPTIONS & LIMITING CONDITIONS (400-500 words)
Must include:
- General assumptions (data reliance, no audit, arm's length, no hidden liabilities, going concern)
- Limiting conditions (opinion not guarantee, date-specific, hypothetical transaction, no advice)
- Independence certification
- Professional standards reference (USPAP, IRS)

### 11. VALUE ENHANCEMENT RECOMMENDATIONS (600-800 words)
Must include 5-7 specific recommendations:
- Each with: current state, recommended action, expected value impact
- Categories: operational improvements, financial improvements, risk reduction, growth
- Prioritization: High/Medium/Low impact
- Realistic timelines

NOW GENERATE ALL 11 SECTIONS. Do not skip any section. Do not use placeholder text. Every section must have substantial, specific content.`;
}

export const pass11CompleteConfig = {
  passNumber: 11,
  passName: 'Complete Narratives (All 11 Sections)',
  maxTokens: 16384,
  temperature: 0.3,
  supportsWebSearch: false,
  dependencies: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
};
