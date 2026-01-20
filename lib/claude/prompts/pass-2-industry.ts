/**
 * Pass 2: Industry Analysis Prompt
 *
 * This pass analyzes the business's industry using extracted data
 * from Pass 1 plus injected industry knowledge from the knowledge base.
 */

export const pass2Prompt = `You are an industry analyst specializing in business valuation. Using the extracted financial data and injected industry knowledge, perform a comprehensive industry analysis.

## ANALYSIS REQUIREMENTS

### 1. INDUSTRY CONTEXT

Analyze the broader industry environment:

**Market Overview:**
- Market size (total addressable market in dollars)
- Geographic scope (local, regional, national)
- Market maturity stage

**Growth Analysis:**
- Historical growth rate (past 3-5 years)
- Projected growth rate
- Growth outlook: "Growing", "Stable", or "Declining"

**Key Trends:**
Identify 4-6 trends affecting the industry:
- Technology changes
- Regulatory developments
- Consumer behavior shifts
- Economic factors
- Labor market conditions
- Competitive dynamics

### 2. COMPETITIVE LANDSCAPE

Assess the competitive environment:

**Market Structure:**
- Fragmented (many small players) vs. Concentrated (few dominant players)
- Local vs. national competition

**Barriers to Entry:**
- Licensing requirements
- Capital requirements
- Technical expertise needed
- Relationship/reputation importance
- Regulatory hurdles

**Key Success Factors:**
- What differentiates winners from losers?
- Customer acquisition strategies
- Operational excellence factors

**Competitive Threats:**
- New entrants
- Substitutes
- Technology disruption

### 3. INDUSTRY BENCHMARKS

Compare the subject company to industry norms. Provide ranges as decimals (e.g., 0.45 for 45%):

**Margin Benchmarks:**
- Gross margin: low / median / high
- Operating margin: low / median / high
- SDE margin: low / median / high (SDE as percentage of revenue)

These help assess whether the company is performing above, at, or below industry standards.

### 4. VALUATION MULTIPLES

Identify appropriate valuation multiples for this industry:

**SDE Multiple (most common for small businesses):**
- Low: Below-average businesses
- Typical: Average performers
- High: Premium businesses

**Revenue Multiple:**
- Low / Typical / High range
- Note: Often used as secondary validation

**Source:** Cite where the multiple data comes from (e.g., "BizBuySell data", "Industry transactions", "Broker surveys")

### 5. RULES OF THUMB

Document industry-specific valuation shortcuts:

- Common formulas (e.g., "2.5-3x SDE", "50% of annual revenue")
- What experienced buyers typically pay
- Key value drivers specific to this industry
- Special considerations (inventory, equipment, real estate treatment)
- What commands premium vs. discount multiples

Provide 4-6 rules of thumb as concise statements.

### 6. DUE DILIGENCE QUESTIONS

Generate 5-10 industry-specific questions a buyer should investigate:

**Categories to cover:**
- Customer concentration and retention
- Operational efficiency
- Competitive positioning
- Regulatory compliance
- Key employee/owner transition
- Technology and equipment
- Growth opportunities

Questions should be specific to THIS industry, not generic business questions.

### 7. INDUSTRY NARRATIVE

Write a 400-600 word narrative covering:

**Paragraph 1 (Industry Overview):** What is this industry? Market size, scope, key products/services, customers.

**Paragraph 2 (Market Dynamics):** Growth drivers, economic sensitivity, demand factors.

**Paragraph 3 (Competitive Landscape):** Market structure, competition type, barriers to entry.

**Paragraph 4 (Industry Trends):** Technology impact, regulatory environment, emerging changes.

**Paragraph 5 (Valuation Implications):** How these factors affect business value, what buyers seek, premium/discount factors.

Use professional tone. Include specific numbers. Be objective, not promotional.

## OUTPUT FORMAT

Respond with ONLY valid JSON matching this exact structure:

{
  "analysis": {
    "industry_overview": {
      "sector": "Professional Services",
      "subsector": "HVAC Contractors",
      "market_size": "$150 billion annually in the US",
      "growth_rate": "4-5% annually",
      "growth_outlook": "Growing",
      "key_trends": [
        "Increasing demand for energy-efficient systems",
        "Smart home integration and IoT-enabled HVAC",
        "Technician shortage affecting labor costs",
        "EPA refrigerant regulations driving equipment updates"
      ]
    },
    "competitive_landscape": "The HVAC contractor industry is highly fragmented with thousands of local and regional operators. Competition centers on response time, technical expertise, pricing transparency, and online reputation. Barriers to entry are moderate, requiring EPA certifications, state contractor licenses, and $50K-$150K in startup capital. National franchises are growing but local contractors still dominate most markets.",
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
    "rules_of_thumb": [
      "SDE multiple of 2.5-3.5x is standard for owner-operated HVAC companies",
      "40-60% of annual revenue is a quick valuation estimate",
      "Maintenance agreement portfolios command 1.0-1.5x annual contract revenue premium",
      "Licensed technician count directly impacts value - each adds $15K-$30K",
      "Companies with strong online reviews (4.5+ stars) sell at higher multiples",
      "Residential-only vs. commercial mix affects risk profile and multiple"
    ],
    "due_diligence_questions": [
      "What percentage of revenue is from maintenance agreements vs. repair calls vs. new installations?",
      "What is the customer retention rate for service agreements?",
      "How many licensed technicians are employed? What is turnover?",
      "What manufacturer certifications does the company hold?",
      "What is the age and condition of the service vehicle fleet?",
      "What software systems are used for scheduling, dispatch, and invoicing?",
      "What is the warranty callback rate?",
      "How are new customers acquired? What is customer acquisition cost?",
      "Are there any pending regulatory compliance issues?",
      "What is the owner's role and transition availability?"
    ],
    "industry_narrative": "The HVAC contracting industry represents a substantial segment of the U.S. construction services sector, with annual revenues exceeding $150 billion..."
  },
  "knowledge_requests": {
    "industry_specific": [],
    "tax_form_specific": [],
    "risk_factors": ["owner_dependence", "customer_concentration", "technician_retention"],
    "comparable_industries": [],
    "benchmarks_needed": ["typical_sde_addbacks", "owner_compensation_market_rate"]
  },
  "knowledge_reasoning": "For Pass 3, I need guidance on typical SDE add-backs and market-rate owner compensation. For Pass 4, I need to assess owner dependence and key employee risks."
}

## IMPORTANT INSTRUCTIONS

1. Output ONLY the JSON object - no markdown, no explanation
2. Use the exact field names shown in the structure above
3. Provide specific numbers, not vague ranges
4. Benchmark margins should be decimals (0.45 not 45%)
5. The industry_narrative should be 400-600 words - substantial analysis
6. Generate at least 5 due diligence questions specific to this industry
7. Base analysis on the injected industry knowledge when provided
8. Request knowledge needed for Pass 3 (earnings normalization) and Pass 4 (risk assessment)

Now analyze the industry for the business described in the provided context.`;

/**
 * System context for Pass 2
 */
export const pass2SystemContext = `You are an expert industry analyst specializing in small business valuation. Your role is to analyze industry dynamics, identify appropriate valuation multiples, and assess how industry factors affect business value.

Key priorities:
1. USE INJECTED KNOWLEDGE: Apply the industry-specific data provided
2. BE SPECIFIC: Include actual numbers and percentages
3. BUYER PERSPECTIVE: What would a buyer need to know?
4. CONNECT TO VALUE: How do industry factors affect valuation?

You have expertise in:
- Industry classification (NAICS/SIC codes)
- Market analysis and competitive dynamics
- Valuation multiples by industry
- Due diligence requirements
- Transaction structures`;

/**
 * Build Pass 2 prompt with context from Pass 1 and injected knowledge
 */
export function buildPass2Prompt(
  pass1Summary: string,
  injectedKnowledge: string
): string {
  return `${pass2Prompt}

## CONTEXT FROM PASS 1 (DOCUMENT EXTRACTION)

${pass1Summary}

## INJECTED INDUSTRY KNOWLEDGE

${injectedKnowledge || 'No specific industry knowledge available. Use general industry principles and request specific knowledge for subsequent passes.'}

Analyze this business's industry and provide your assessment.`;
}

/**
 * Create a summary of Pass 1 output for Pass 2 input
 */
export function summarizePass1ForPass2(pass1Output: unknown): string {
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

  const years = financialData ? Object.keys(financialData) : [];
  const latestYear = years[0];
  const latestFinancials = latestYear
    ? (financialData?.[latestYear] as Record<string, unknown>)
    : null;

  let summary = `### Company Information
- Name: ${companyInfo?.name || 'Unknown'}
- Entity Type: ${companyInfo?.entity_type || 'Unknown'}

### Industry Classification (from Pass 1)
- NAICS Code: ${industryClass?.naics_code || 'Unknown'}
- Description: ${industryClass?.naics_description || 'Unknown'}
- Keywords: ${Array.isArray(industryClass?.keywords) ? (industryClass?.keywords as string[]).join(', ') : 'None'}
- Confidence: ${industryClass?.confidence || 'Medium'}

### Financial Summary`;

  if (latestFinancials) {
    const revenue = (latestFinancials.revenue as number) || 0;
    const grossProfit = (latestFinancials.gross_profit as number) || 0;
    const netIncome = (latestFinancials.net_income as number) || 0;
    const ownerComp = (latestFinancials.owner_compensation as number) || 0;

    summary += `
- Latest Year: ${latestYear}
- Revenue: $${revenue.toLocaleString()}
- Gross Profit: $${grossProfit.toLocaleString()}
- Net Income: $${netIncome.toLocaleString()}
- Owner Compensation: $${ownerComp.toLocaleString()}
- Gross Margin: ${revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(1) : 0}%
- Net Margin: ${revenue > 0 ? ((netIncome / revenue) * 100).toFixed(1) : 0}%`;
  } else {
    summary += '\n- No financial data available';
  }

  return summary;
}

/**
 * Validate Pass 2 output structure
 */
export function validatePass2Output(output: unknown): { valid: boolean; errors: string[] } {
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

  // Check industry_overview
  if (!analysis.industry_overview) {
    errors.push('Missing industry_overview');
  } else {
    const overview = analysis.industry_overview as Record<string, unknown>;
    if (!overview.sector) errors.push('Missing industry_overview.sector');
    if (!overview.growth_outlook) errors.push('Missing industry_overview.growth_outlook');
    if (!Array.isArray(overview.key_trends) || overview.key_trends.length === 0) {
      errors.push('Missing or empty industry_overview.key_trends');
    }
  }

  // Check competitive_landscape
  if (!analysis.competitive_landscape || typeof analysis.competitive_landscape !== 'string') {
    errors.push('Missing or invalid competitive_landscape');
  }

  // Check industry_benchmarks
  if (!analysis.industry_benchmarks) {
    errors.push('Missing industry_benchmarks');
  } else {
    const benchmarks = analysis.industry_benchmarks as Record<string, unknown>;
    if (!benchmarks.gross_margin) errors.push('Missing industry_benchmarks.gross_margin');
    if (!benchmarks.operating_margin) errors.push('Missing industry_benchmarks.operating_margin');
    if (!benchmarks.sde_margin) errors.push('Missing industry_benchmarks.sde_margin');
  }

  // Check valuation_multiples
  if (!analysis.valuation_multiples) {
    errors.push('Missing valuation_multiples');
  } else {
    const multiples = analysis.valuation_multiples as Record<string, unknown>;
    if (!multiples.sde_multiple) errors.push('Missing valuation_multiples.sde_multiple');
    if (!multiples.revenue_multiple) errors.push('Missing valuation_multiples.revenue_multiple');
    if (!multiples.source) errors.push('Missing valuation_multiples.source');
  }

  // Check rules_of_thumb
  if (!Array.isArray(analysis.rules_of_thumb) || analysis.rules_of_thumb.length < 3) {
    errors.push('rules_of_thumb must have at least 3 items');
  }

  // Check due_diligence_questions
  if (!Array.isArray(analysis.due_diligence_questions) || analysis.due_diligence_questions.length < 5) {
    errors.push('due_diligence_questions must have at least 5 items');
  }

  // Check industry_narrative
  if (!analysis.industry_narrative || typeof analysis.industry_narrative !== 'string') {
    errors.push('Missing industry_narrative');
  } else {
    const wordCount = (analysis.industry_narrative as string).split(/\s+/).length;
    if (wordCount < 300) {
      errors.push(`industry_narrative too short: ${wordCount} words (need 400-600)`);
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

export default {
  prompt: pass2Prompt,
  systemContext: pass2SystemContext,
  buildPrompt: buildPass2Prompt,
  summarizePass1: summarizePass1ForPass2,
  validate: validatePass2Output,
};
