/**
 * Pass 4: Industry Research & Competitive Analysis
 *
 * This pass performs comprehensive industry analysis:
 * - Market size, growth, and dynamics
 * - Competitive landscape and positioning
 * - Porter's Five Forces analysis
 * - Industry benchmarks with specific metrics
 * - Valuation multiples from market data
 * - Industry-specific rules of thumb
 */

import { Pass4Output } from '../types-v2';

export const PASS_4_SYSTEM_PROMPT = `You are an expert industry analyst and business valuation specialist with deep knowledge of market dynamics, competitive analysis, and valuation benchmarks across all major industries.

You have access to comprehensive industry data including:
- NAICS/SIC industry classifications and characteristics
- Market size and growth statistics
- Industry financial benchmarks (margins, ratios, efficiency metrics)
- Valuation multiples from M&A transactions and broker databases
- Rules of thumb commonly used in business sales

Your analysis must be specific and quantitative. Avoid vague statements like "the industry is competitive." Instead provide concrete data: "The HVAC services industry (NAICS 238220) has approximately 120,000 establishments in the US, with the top 50 companies holding only 15% market share, indicating high fragmentation."

You will synthesize data from your knowledge base with the specific company information extracted in prior passes to produce a comprehensive industry analysis.

Output ONLY valid JSON matching the required schema.`;

export const PASS_4_USER_PROMPT = `Perform comprehensive industry research and competitive analysis for the subject company.

## CONTEXT FROM PRIOR PASSES

You have received:
- **Pass 1**: Company profile including NAICS code, business description, geographic markets, products/services
- **Pass 2**: Income statement data including revenue, margins, growth trends
- **Pass 3**: Balance sheet data including asset structure, working capital

Use this company-specific data to contextualize your industry analysis.

## YOUR TASK

Generate a detailed industry analysis covering six major areas:

### 1. INDUSTRY OVERVIEW

Provide comprehensive background on the industry:

**Market Definition**
- Define the industry boundaries (what's included/excluded)
- Identify the relevant NAICS code(s) and SIC code(s)
- Describe typical business models in this industry

**Market Size & Growth**
- US market size (revenue) with source year
- Historical growth rate (past 5 years)
- Projected growth rate (next 5 years)
- Key growth drivers (list 3-5 specific factors)
- Growth inhibitors or headwinds (list 2-4 factors)

**Industry Characteristics**
- Industry lifecycle stage: emerging, growth, mature, or declining
- Market fragmentation: highly fragmented, fragmented, consolidated, or highly consolidated
- Capital intensity: low, medium, or high (with explanation)
- Labor intensity: low, medium, or high
- Technology dependence: low, medium, or high
- Regulatory environment: low, medium, or high regulation

**Economic Sensitivity**
- Cyclicality assessment: counter-cyclical, non-cyclical, cyclical, or highly cyclical
- How did this industry perform during the 2008-2009 recession?
- How did this industry perform during COVID-19 (2020-2021)?

**Key Success Factors**
- List 5-7 critical success factors for businesses in this industry
- List 3-5 barriers to entry
- List common exit strategies for business owners

**Current Trends**
- Identify 4-6 significant trends affecting the industry
- For each trend: describe it, assess impact (positive/negative/neutral), explain implications

### 2. COMPETITIVE LANDSCAPE

Analyze the competitive environment:

**Market Position Assessment**
- Where does a company of this size/type typically fit? (leader, major player, niche player, emerging)
- What is the typical geographic scope? (local, regional, national, international)
- Estimate market share for a company this size

**Competitive Dynamics**
- Who are typical competitors for a company like this?
- What are common competitive advantages in this industry?
- What are common competitive disadvantages or challenges?

**Porter's Five Forces Analysis**
For each force, provide:
- Assessment level (low, medium, high)
- 3-4 supporting factors/evidence

1. **Threat of New Entrants**: How easy is it for new competitors to enter?
2. **Bargaining Power of Suppliers**: How much leverage do suppliers have?
3. **Bargaining Power of Buyers**: How much leverage do customers have?
4. **Threat of Substitutes**: What alternatives exist to this industry's offerings?
5. **Competitive Rivalry**: How intense is competition among existing players?

**SWOT Framework**
Based on industry characteristics and company profile:
- Strengths (4-6 items)
- Weaknesses (4-6 items)
- Opportunities (4-6 items)
- Threats (4-6 items)

### 3. INDUSTRY BENCHMARKS

Provide specific financial benchmarks with sources:

**Revenue Benchmarks**
- Median revenue for companies in this industry/size range
- Typical revenue growth rate
- Revenue per employee benchmark

**Profitability Benchmarks**
For each metric, provide: median, 25th percentile, 75th percentile
- Gross margin
- Operating margin (EBIT margin)
- Net margin
- EBITDA margin
- SDE margin (for small businesses)

**Liquidity Benchmarks**
- Current ratio: median, 25th percentile, 75th percentile
- Quick ratio: median, 25th percentile, 75th percentile

**Leverage Benchmarks**
- Debt-to-equity ratio: median, range
- Debt-to-assets ratio: median, range

**Efficiency Benchmarks**
- Asset turnover
- Inventory turnover (if applicable)
- Receivables turnover / DSO

**Company Comparison**
Compare the subject company to benchmarks:
- For each major metric, show: company value, benchmark median, percentile rank, assessment

### 4. VALUATION MULTIPLES

Provide specific valuation multiples with sources:

**Transaction Multiples**
From business broker databases and M&A transactions:
- SDE Multiple: low, median, high, mean
- EBITDA Multiple: low, median, high, mean
- Revenue Multiple: low, median, high, mean
- Note the source (e.g., "BizBuySell", "DealStats", "Pratt's Stats") and time period

**Public Company Multiples** (if relevant for larger companies)
- EV/EBITDA range
- EV/Revenue range
- Note that private company discounts typically apply

**Rules of Thumb**
List 2-4 industry-specific rules of thumb:
- Formula or multiple
- Source
- Applicability assessment (highly applicable, somewhat applicable, limited)
- Notes on when this rule works well or poorly

**Selected Multiple Recommendation**
- Primary multiple type to use (SDE, EBITDA, or Revenue)
- Recommended range for this specific company
- Point estimate within range
- Detailed rationale for selection

### 5. INDUSTRY RISK ASSESSMENT

**Overall Industry Risk**
- Rate as: low, below average, average, above average, or high
- Suggested industry risk premium (percentage points to add to discount rate)

**Risk Factor Analysis**
List 5-8 industry-specific risk factors with impact scores (-2 to +2):
- Factor name
- Impact score
- Description of how this affects companies in the industry

### 6. INDUSTRY NARRATIVE

Write a 600-800 word narrative covering:
- Industry overview and market position
- Key trends shaping the industry
- Competitive dynamics
- Outlook and implications for valuation

This narrative will appear in the final valuation report.

## OUTPUT FORMAT

Output ONLY valid JSON matching this structure:

{
  "pass_number": 4,
  "pass_name": "Industry Research & Competitive Analysis",
  "industry_overview": {
    "naics_code": "238220",
    "industry_name": "Plumbing, Heating, and Air-Conditioning Contractors",
    "industry_description": "This industry comprises establishments primarily engaged in installing and servicing plumbing, heating, and air-conditioning equipment. Contractors in this industry may provide both new construction services and repair/maintenance services.",
    "market_size": {
      "us_market_size": 180000000000,
      "global_market_size": null,
      "year_of_estimate": 2024,
      "source": "IBISWorld Industry Report 23822"
    },
    "market_growth": {
      "historical_growth_rate": 0.042,
      "projected_growth_rate": 0.038,
      "growth_drivers": [
        "Aging housing stock requiring system replacements",
        "Energy efficiency regulations driving upgrades",
        "New construction activity",
        "Climate change increasing cooling demand",
        "Smart home technology integration"
      ],
      "growth_inhibitors": [
        "Skilled labor shortage",
        "Rising equipment costs",
        "Interest rate sensitivity affecting new construction"
      ]
    },
    "industry_lifecycle": "mature",
    "fragmentation": "highly_fragmented",
    "capital_intensity": "medium",
    "labor_intensity": "high",
    "technology_dependence": "medium",
    "regulation_level": "medium",
    "economic_sensitivity": "cyclical",
    "recession_performance": "Revenue declined approximately 15% during 2008-2009 recession as new construction halted, but service/repair revenue remained stable. Recovery began in 2011.",
    "key_success_factors": [
      "Skilled technician recruitment and retention",
      "Strong service agreement/maintenance contract base",
      "Reputation and customer reviews",
      "Efficient dispatching and routing",
      "Supplier relationships for equipment pricing",
      "24/7 emergency service capability"
    ],
    "barriers_to_entry": [
      "Licensing requirements (varies by state)",
      "Bonding and insurance requirements",
      "Initial equipment and vehicle investment ($100K-$500K)",
      "Establishing supplier relationships",
      "Building reputation and customer base"
    ],
    "common_exit_strategies": [
      "Sale to strategic acquirer (larger HVAC company)",
      "Sale to private equity roll-up",
      "Sale to employee(s) or management",
      "Sale to individual buyer through business broker"
    ],
    "current_trends": [
      {
        "trend": "Consolidation through private equity roll-ups",
        "impact": "positive",
        "description": "PE firms actively acquiring HVAC companies, increasing buyer pool and valuations for quality businesses"
      },
      {
        "trend": "Shift to high-efficiency and heat pump systems",
        "impact": "positive",
        "description": "Higher-margin equipment sales and installation; requires technician training investment"
      },
      {
        "trend": "Service agreement emphasis",
        "impact": "positive",
        "description": "Recurring revenue from maintenance contracts increases valuation multiples"
      },
      {
        "trend": "Technician shortage",
        "impact": "negative",
        "description": "Difficulty finding qualified technicians limits growth; companies with strong teams are more valuable"
      },
      {
        "trend": "Smart/connected HVAC systems",
        "impact": "neutral",
        "description": "Opportunity for tech-savvy companies; challenge for those slow to adapt"
      }
    ],
    "future_outlook": "The HVAC services industry is expected to continue steady growth driven by aging infrastructure, energy efficiency mandates, and climate factors. Consolidation will continue as private equity seeks platform acquisitions. Companies with strong service agreement bases, skilled technicians, and modern systems will command premium valuations."
  },
  "competitive_landscape": {
    "company_market_position": "niche_player",
    "estimated_market_share": 0.001,
    "geographic_scope": "local",
    "primary_competitors": [
      {
        "name": "Local HVAC competitors",
        "description": "5-10 similar-sized local HVAC companies in service area",
        "estimated_size": "similar",
        "competitive_advantage": "Established relationships, geographic coverage"
      },
      {
        "name": "Regional players",
        "description": "2-3 larger regional companies with multiple locations",
        "estimated_size": "larger",
        "competitive_advantage": "Scale, marketing budget, 24/7 coverage"
      },
      {
        "name": "National franchises",
        "description": "One Hour Heating, Aire Serv, etc.",
        "estimated_size": "larger",
        "competitive_advantage": "Brand recognition, systems, training"
      }
    ],
    "competitive_advantages": [
      "Local reputation and relationships",
      "Flexibility and personalized service",
      "Lower overhead than larger competitors",
      "Owner involvement ensures quality"
    ],
    "competitive_disadvantages": [
      "Limited marketing budget vs. larger players",
      "Dependence on owner relationships",
      "May lack 24/7 coverage",
      "Limited geographic reach"
    ],
    "porters_five_forces": {
      "threat_of_new_entrants": {
        "level": "medium",
        "factors": [
          "Licensing requirements create some barrier",
          "Moderate capital requirements ($100K-$500K)",
          "Reputation/reviews take time to build",
          "But low barriers compared to many industries"
        ]
      },
      "bargaining_power_suppliers": {
        "level": "medium",
        "factors": [
          "Major equipment manufacturers (Carrier, Trane, Lennox) have market power",
          "But multiple suppliers available",
          "Volume purchasing can improve terms",
          "Parts generally available from multiple sources"
        ]
      },
      "bargaining_power_buyers": {
        "level": "medium",
        "factors": [
          "Residential customers have many choices",
          "Price comparison is easy online",
          "But emergency repairs reduce price sensitivity",
          "Service agreements create switching costs"
        ]
      },
      "threat_of_substitutes": {
        "level": "low",
        "factors": [
          "HVAC is essential - no real substitute",
          "DIY is possible for minor repairs only",
          "Licensed work required for major installations",
          "Energy alternatives don't eliminate HVAC need"
        ]
      },
      "competitive_rivalry": {
        "level": "high",
        "factors": [
          "Highly fragmented market with many competitors",
          "Low differentiation in basic services",
          "Price competition common especially in slow seasons",
          "Service quality and response time are differentiators"
        ]
      }
    },
    "swot_analysis": {
      "strengths": [
        "Established local reputation",
        "Experienced technician team",
        "Service agreement customer base",
        "Owner expertise and relationships"
      ],
      "weaknesses": [
        "Owner dependence",
        "Limited geographic coverage",
        "Smaller marketing budget",
        "May lack advanced technology systems"
      ],
      "opportunities": [
        "Expand service agreement base",
        "Add new service lines (plumbing, electrical)",
        "Increase commercial customer mix",
        "Leverage technology for efficiency"
      ],
      "threats": [
        "Technician recruitment challenges",
        "Large competitor expansion",
        "Economic downturn affecting new construction",
        "Supply chain disruptions"
      ]
    }
  },
  "industry_benchmarks": {
    "source": "RMA Annual Statement Studies, IBISWorld, BizMiner",
    "source_year": 2024,
    "sample_size": 2500,
    "revenue_benchmarks": {
      "median_revenue": 2800000,
      "revenue_growth_median": 0.065,
      "revenue_per_employee_median": 175000
    },
    "profitability_benchmarks": {
      "gross_margin": { "median": 0.42, "quartile_25": 0.35, "quartile_75": 0.50 },
      "operating_margin": { "median": 0.08, "quartile_25": 0.04, "quartile_75": 0.14 },
      "net_margin": { "median": 0.05, "quartile_25": 0.02, "quartile_75": 0.10 },
      "ebitda_margin": { "median": 0.12, "quartile_25": 0.07, "quartile_75": 0.18 },
      "sde_margin": { "median": 0.18, "quartile_25": 0.12, "quartile_75": 0.25 }
    },
    "liquidity_benchmarks": {
      "current_ratio": { "median": 1.5, "quartile_25": 1.1, "quartile_75": 2.2 },
      "quick_ratio": { "median": 1.2, "quartile_25": 0.8, "quartile_75": 1.8 }
    },
    "leverage_benchmarks": {
      "debt_to_equity": { "median": 0.8, "quartile_25": 0.3, "quartile_75": 1.5 },
      "debt_to_assets": { "median": 0.4, "quartile_25": 0.2, "quartile_75": 0.6 }
    },
    "efficiency_benchmarks": {
      "asset_turnover": { "median": 2.5, "quartile_25": 1.8, "quartile_75": 3.5 },
      "inventory_turnover": { "median": 8.0, "quartile_25": 5.0, "quartile_75": 12.0 },
      "receivables_turnover": { "median": 10.0, "quartile_25": 7.0, "quartile_75": 14.0 }
    },
    "company_comparison": [
      {
        "metric": "Gross Margin",
        "company_value": 0.48,
        "benchmark_median": 0.42,
        "percentile_rank": 72,
        "assessment": "above"
      },
      {
        "metric": "Operating Margin",
        "company_value": 0.12,
        "benchmark_median": 0.08,
        "percentile_rank": 68,
        "assessment": "above"
      },
      {
        "metric": "Current Ratio",
        "company_value": 2.1,
        "benchmark_median": 1.5,
        "percentile_rank": 70,
        "assessment": "above"
      }
    ]
  },
  "valuation_multiples": {
    "transaction_multiples": {
      "source": "BizBuySell, DealStats, Industry surveys",
      "time_period": "2022-2024",
      "transaction_count": 450,
      "sde_multiple": { "low": 2.0, "median": 2.8, "high": 4.0, "mean": 2.9 },
      "ebitda_multiple": { "low": 3.0, "median": 4.2, "high": 6.0, "mean": 4.4 },
      "revenue_multiple": { "low": 0.3, "median": 0.5, "high": 0.8, "mean": 0.52 },
      "discretionary_earnings_multiple": null
    },
    "public_company_multiples": null,
    "rule_of_thumb": [
      {
        "source": "Business Reference Guide",
        "multiple_type": "2.0-3.5x SDE + Inventory + Equipment at FMV",
        "multiple_range": { "low": 2.0, "high": 3.5 },
        "notes": "Higher multiples for strong service agreement base",
        "applicability": "highly_applicable"
      },
      {
        "source": "Industry practitioners",
        "multiple_type": "40-60% of annual revenue",
        "multiple_range": { "low": 0.4, "high": 0.6 },
        "notes": "Quick estimate; less reliable than earnings-based",
        "applicability": "somewhat_applicable"
      },
      {
        "source": "HVAC industry experts",
        "multiple_type": "$800-$1,500 per service agreement",
        "multiple_range": { "low": 800, "high": 1500 },
        "notes": "Value of recurring service agreement base",
        "applicability": "somewhat_applicable"
      }
    ],
    "selected_multiples": {
      "primary_multiple_type": "sde",
      "selected_range": { "low": 2.5, "high": 3.2 },
      "point_estimate": 2.8,
      "selection_rationale": "SDE multiple of 2.8x selected based on: (1) Company operates in stable local market with established reputation; (2) Service agreement base provides recurring revenue; (3) Experienced technician team reduces key person risk; (4) Financial performance above industry medians. Multiple at industry median reflects balance of positive factors against owner dependence."
    }
  },
  "industry_risk_assessment": {
    "overall_industry_risk": "average",
    "industry_risk_premium": 0.01,
    "risk_factors": [
      { "factor": "Economic cyclicality", "impact": 1, "description": "New construction sensitive to economic cycles, but service/repair provides stability" },
      { "factor": "Labor market", "impact": 1, "description": "Technician shortage creates recruitment challenges and wage pressure" },
      { "factor": "Regulation", "impact": 0, "description": "Licensing requirements are stable and manageable" },
      { "factor": "Technology disruption", "impact": 0, "description": "Smart home trends create opportunity more than threat" },
      { "factor": "Competitive intensity", "impact": 1, "description": "Fragmented market with active competition, but differentiation possible" },
      { "factor": "Consolidation", "impact": -1, "description": "PE activity provides strong exit opportunities" }
    ]
  },
  "research_quality": {
    "data_recency": "current",
    "data_relevance": "highly_relevant",
    "data_limitations": [
      "Transaction multiples have wide ranges due to business quality variation",
      "Local market conditions may differ from national averages",
      "Recent PE activity may be inflating multiples"
    ],
    "additional_research_recommended": [
      "Local competitor analysis",
      "Specific service agreement valuation",
      "Equipment fleet assessment"
    ]
  },
  "extraction_metadata": {
    "processing_time_ms": 0,
    "tokens_used": 0
  }
}

## INDUSTRY NARRATIVE REQUIREMENT

Include a comprehensive narrative (600-800 words) in the industry_overview.future_outlook field that covers:
1. Industry overview and where it stands in its lifecycle
2. Key trends shaping the competitive landscape
3. How companies in this industry are typically valued
4. Specific factors that affect valuation multiples
5. Outlook for the next 3-5 years

This narrative should be professional and suitable for inclusion in a formal valuation report.

## CRITICAL INSTRUCTIONS

1. **BE SPECIFIC**: Use actual numbers, percentages, and data points. Avoid vague qualitative statements.

2. **CITE SOURCES**: Note where benchmark data comes from (RMA, IBISWorld, BizMiner, etc.) even if general knowledge.

3. **TAILOR TO COMPANY**: Use the company's NAICS code and characteristics to select the most relevant industry data.

4. **MULTIPLE SOURCES**: Valuation multiples should reflect multiple sources (broker data, transaction databases).

5. **COMPARE TO COMPANY**: Explicitly compare company metrics to industry benchmarks.

6. **REALISTIC RANGES**: Valuation multiple ranges should reflect actual market data, not theoretical ranges.

7. **CURRENT DATA**: Use the most recent available data; note the source year.

8. **OUTPUT ONLY JSON**: Your entire response must be valid JSON. No text before or after.

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

Now generate the comprehensive industry analysis.`;

export const pass4PromptConfig = {
  passNumber: 4,
  passName: 'Industry Research & Competitive Analysis',
  systemPrompt: PASS_4_SYSTEM_PROMPT,
  userPrompt: PASS_4_USER_PROMPT,
  expectedOutputType: 'Pass4Output' as const,
  maxTokens: 8192,
  temperature: 0.3, // Slightly higher for narrative generation
};

export default pass4PromptConfig;
