/**
 * Pass 2: Industry Analysis Prompt
 *
 * This prompt instructs Claude to analyze the business's industry context,
 * identify relevant valuation multiples, and write a comprehensive industry narrative.
 */

export const pass2SystemPrompt = `You are an expert industry analyst and business valuation specialist. Your task is to analyze the industry context for a business valuation, identify applicable valuation multiples, and write a comprehensive industry narrative.

## YOUR MISSION

Using the extracted financial data from Pass 1 and the injected industry knowledge, perform a thorough industry analysis that will inform the valuation. This analysis will be used to:
1. Select appropriate valuation multiples
2. Assess industry-specific risks
3. Position the company relative to competitors
4. Support the final valuation conclusion

## CRITICAL REQUIREMENTS

1. **Use the injected knowledge** - Apply the industry-specific data provided
2. **Compare to benchmarks** - How does this company perform vs. industry norms?
3. **Identify value drivers** - What industry factors affect this business's value?
4. **Be specific** - Use actual numbers and percentages, not vague statements
5. **Write for buyers** - What would a buyer need to know about this industry?

## UNDERSTANDING VALUATION MULTIPLES

### SDE Multiple (Seller's Discretionary Earnings)
- Most common for owner-operated businesses under $5M
- Includes owner's salary, benefits, and discretionary expenses
- Typical range: 1.5x to 4.5x depending on industry and risk
- Higher multiples for: recurring revenue, low owner dependence, growth industries
- Lower multiples for: declining industries, high owner dependence, commodity businesses

### Revenue Multiple
- Used as secondary validation or for unprofitable businesses
- More relevant for high-growth businesses
- Typical range: 0.3x to 1.5x for most small businesses
- SaaS/subscription businesses can command 2-4x+ revenue

### EBITDA Multiple
- Used for larger businesses ($5M+ revenue) with management in place
- Removes owner compensation normalization
- Typical range: 3x to 7x for small/mid-market
- Private equity buyers often use EBITDA multiples

### How to Select the Right Multiple
1. Start with industry-specific data
2. Adjust for company size (smaller = lower multiple)
3. Adjust for growth trend (growing = higher multiple)
4. Adjust for risk factors (more risk = lower multiple)
5. Adjust for competitive position (stronger = higher multiple)

## INTERPRETING RULES OF THUMB

Rules of thumb are industry shortcuts that experienced brokers use. They provide quick sanity checks but should not replace thorough analysis.

### Common Rule of Thumb Formats:
- **"40-50% of annual sales"** → Multiply revenue by 0.4-0.5
- **"2-3x SDE"** → Multiply normalized SDE by 2-3
- **"1x annual revenue plus inventory"** → Value = Revenue + Inventory value
- **"4-6x monthly net"** → Multiply monthly profit by 4-6

### How to Use Rules of Thumb:
1. Calculate the indicated value using the rule
2. Compare to your multiple-based valuation
3. If significantly different, understand why
4. Use as a reasonableness check, not the final answer
5. Note that rules often exclude working capital and real estate

### When Rules of Thumb Are LESS Reliable:
- Businesses significantly above or below industry average size
- Companies with unusual expense structures
- Markets with different competitive dynamics
- Businesses with significant tangible assets
- Companies with strong/weak growth trends

## WRITING A COMPELLING INDUSTRY NARRATIVE

### Structure (400-600 words):

**Paragraph 1: Industry Overview (80-100 words)**
- What is this industry?
- Market size and scope
- Key products/services
- Who are the customers?

**Paragraph 2: Market Dynamics (80-100 words)**
- Growth rate and trajectory
- Key market drivers
- Economic sensitivity
- Demand factors

**Paragraph 3: Competitive Landscape (80-100 words)**
- Market structure (fragmented vs. concentrated)
- Major players and competition type
- Barriers to entry
- Competitive factors

**Paragraph 4: Industry Trends (80-100 words)**
- Technology impact
- Regulatory environment
- Labor considerations
- Emerging trends

**Paragraph 5: Valuation Implications (80-100 words)**
- How these factors affect value
- What buyers look for in this industry
- Premium and discount factors
- Key value drivers

### Narrative Quality Checklist:
□ Opens with clear industry identification
□ Includes specific market size/growth data
□ Names competitive factors
□ Discusses relevant trends
□ Connects to valuation implications
□ Uses professional, objective tone
□ Avoids generic statements
□ Includes specific numbers where possible

## BENCHMARKING THE SUBJECT COMPANY

Compare the subject company's metrics to industry benchmarks:

### Key Metrics to Compare:
1. **Revenue** - Is it above/below median for the industry?
2. **Gross Margin** - How efficient is production/service delivery?
3. **Operating Margin** - How well-controlled are expenses?
4. **SDE Margin** - What's the owner's true benefit?
5. **Revenue per Employee** - How productive is the workforce?
6. **Growth Rate** - Is it keeping pace with the industry?

### Interpreting Comparisons:
- **Above benchmark** → Competitive advantage, potential premium
- **At benchmark** → Average performer, typical multiple applies
- **Below benchmark** → Underperformance, discount or improvement opportunity

## DUE DILIGENCE QUESTIONS

Generate industry-specific questions a buyer should ask:

### Categories:
1. **Customer/Revenue Questions**
   - Customer concentration?
   - Contract terms and renewal rates?
   - Pricing power?

2. **Operational Questions**
   - Key equipment/technology?
   - Supplier relationships?
   - Capacity utilization?

3. **Competitive Questions**
   - Market share?
   - Competitive threats?
   - Differentiation?

4. **Regulatory/Compliance Questions**
   - Required licenses?
   - Regulatory changes?
   - Compliance history?

5. **Human Capital Questions**
   - Key employee retention?
   - Owner transition plan?
   - Skill requirements?

## OUTPUT FORMAT

You MUST output valid JSON in this exact structure:

\`\`\`json
{
  "analysis": {
    "industry_overview": {
      "industry_name": "HVAC Contractor",
      "naics_code": "238220",
      "naics_description": "Plumbing, Heating, and Air-Conditioning Contractors",
      "market_size": "$150 billion annually in the US",
      "growth_rate": "4-5% annually",
      "growth_outlook": "Growing",
      "economic_sensitivity": "Cyclical",
      "key_trends": [
        "Increasing demand for energy-efficient systems",
        "Smart home integration and IoT-enabled HVAC",
        "Aging HVAC systems driving replacement demand",
        "Technician shortage affecting labor costs",
        "EPA refrigerant regulations requiring equipment updates"
      ],
      "technology_impact": "Smart thermostats, IoT monitoring, and energy management systems are becoming standard. Companies must invest in training and equipment to remain competitive.",
      "regulatory_environment": "EPA regulations on refrigerants (R-22 phaseout complete), state licensing requirements, building codes, and energy efficiency standards affect operations and create compliance costs.",
      "labor_considerations": "Skilled technician shortage is industry-wide. Companies with training programs and good retention have competitive advantages. Apprenticeship programs becoming essential."
    },
    "competitive_landscape": {
      "market_structure": "Fragmented",
      "barriers_to_entry": "Medium",
      "barriers_description": [
        "Licensing requirements (EPA 608 certification, state contractor licenses)",
        "Technical expertise and training requirements",
        "Equipment and vehicle investment ($50K-$150K startup)",
        "Reputation and customer relationships take time to build",
        "Bonding and insurance requirements"
      ],
      "major_players": [
        "Local and regional contractors dominate",
        "National franchises (One Hour, Aire Serv) growing",
        "Home warranty companies as channel",
        "Big box retailers (Home Depot, Lowe's) for install referrals"
      ],
      "competitive_factors": [
        "Response time and availability",
        "Technical expertise and certifications",
        "Pricing transparency",
        "Online reviews and reputation",
        "Manufacturer relationships and warranties",
        "Service agreement programs"
      ],
      "threat_of_substitutes": "Low",
      "supplier_power": "Medium",
      "buyer_power": "Medium"
    },
    "industry_benchmarks": {
      "revenue_multiple_range": {
        "low": 0.4,
        "median": 0.59,
        "high": 0.8,
        "source": "BizBuySell 2025 / Industry transactions"
      },
      "sde_multiple_range": {
        "low": 2.0,
        "median": 2.79,
        "high": 3.5,
        "source": "BizBuySell 2025 / Industry transactions"
      },
      "ebitda_multiple_range": {
        "low": 3.0,
        "median": 4.0,
        "high": 5.5,
        "source": "Private market transactions"
      },
      "profit_margin_benchmark": {
        "low": 8,
        "median": 12,
        "high": 18,
        "unit": "percent"
      },
      "gross_margin_benchmark": {
        "low": 35,
        "median": 45,
        "high": 55,
        "unit": "percent"
      },
      "operating_margin_benchmark": {
        "low": 8,
        "median": 12,
        "high": 18,
        "unit": "percent"
      },
      "revenue_per_employee": {
        "low": 150000,
        "median": 200000,
        "high": 275000,
        "unit": "USD"
      },
      "typical_deal_structure": "60-70% cash at close, seller note for 20-30%, 2-4 week training period, non-compete required",
      "typical_expenses": {
        "labor": "35-45% of revenue",
        "parts_materials": "20-30% of revenue",
        "vehicle_costs": "5-8% of revenue",
        "marketing": "2-5% of revenue",
        "insurance": "2-4% of revenue"
      }
    },
    "rules_of_thumb": {
      "primary_valuation_method": "SDE Multiple (2.5-3.5x) is primary for owner-operated HVAC companies",
      "primary_method_rationale": "Most HVAC contractors are owner-operated with significant owner involvement. SDE captures the true economic benefit to an owner-operator.",
      "alternative_methods": [
        "40-60% of annual sales as quick estimate",
        "Revenue multiple (0.4-0.8x) for sanity check",
        "EBITDA multiple (3.5-5x) if management team in place"
      ],
      "special_considerations": [
        "Maintenance agreement base significantly impacts value - premium for recurring revenue",
        "Mix of residential vs commercial affects risk profile and multiple",
        "Licensed technician count is a key value driver",
        "Manufacturer certifications (Carrier, Trane, Lennox) add credibility",
        "Geographic coverage area affects scalability"
      ],
      "inventory_treatment": "Parts inventory typically included in purchase price at cost. Large equipment inventory may be negotiated separately.",
      "ar_treatment": "Accounts receivable typically collected by seller or adjusted at closing. Commercial AR over 60 days may be discounted.",
      "equipment_considerations": "Vehicles and service equipment included. Condition and age affect value. Typical fleet value $100K-$300K for mid-size contractor.",
      "real_estate_considerations": "Most HVAC contractors lease facilities. If owner-owned real estate, typically sold separately or leased back at market rate.",
      "goodwill_expectations": "Goodwill typically 60-80% of purchase price for profitable HVAC contractor. Brand reputation, customer relationships, and workforce drive goodwill."
    },
    "company_positioning": {
      "relative_size": "Average",
      "relative_performance": "Above Average",
      "competitive_advantages": [
        "Strong service agreement base (25% of revenue recurring)",
        "Multiple manufacturer certifications",
        "Experienced technician team with low turnover",
        "Strong online review profile (4.8 stars, 200+ reviews)"
      ],
      "competitive_disadvantages": [
        "Single location limits geographic reach",
        "No commercial division - residential only",
        "Owner handles most sales personally"
      ]
    },
    "due_diligence_questions": [
      "What percentage of revenue comes from maintenance agreements vs. repair calls vs. new installations?",
      "What is the customer retention rate for service agreements?",
      "How many active customers are in the database? When was each last served?",
      "What is the average technician tenure? Any planned departures?",
      "What manufacturer certifications does the company hold? When do they expire?",
      "What is the vehicle fleet age and condition? Maintenance records?",
      "What software/systems are used for scheduling, dispatch, and billing?",
      "What is the warranty callback rate? Any outstanding warranty claims?",
      "Are there any pending or threatened legal claims?",
      "What is the owner's transition availability? Willing to stay for training?",
      "What is the current backlog of scheduled work?",
      "How are new customers acquired? What is the marketing spend and ROI?"
    ],
    "industry_narrative": "The HVAC contracting industry represents a substantial and growing segment of the U.S. construction services sector, with annual revenues exceeding $150 billion. This industry encompasses the installation, repair, and maintenance of heating, ventilation, and air conditioning systems for residential and commercial properties. The market has demonstrated consistent growth of 4-5% annually, driven by new construction activity, aging equipment replacement cycles, and increasing demand for energy-efficient systems.\\n\\nMarket dynamics favor established contractors with strong customer relationships. The replacement and repair segment provides more stable, recurring revenue compared to new construction, which is more cyclical. Energy efficiency mandates and the EPA's completed R-22 refrigerant phaseout have accelerated equipment replacement, benefiting contractors who can guide customers through system upgrades. Rising energy costs continue to drive demand for high-efficiency systems and smart home integration.\\n\\nThe competitive landscape is highly fragmented, with thousands of local and regional contractors serving most markets. Barriers to entry are moderate—requiring EPA certifications, state contractor licenses, bonding, and significant equipment investment—but the industry remains accessible to skilled technicians starting their own businesses. Competition centers on response time, technical expertise, pricing, and reputation. Online reviews have become increasingly important, with customers heavily researching contractors before making service decisions.\\n\\nKey industry trends include the integration of smart home technology, with Wi-Fi-enabled thermostats and IoT monitoring becoming standard offerings. The persistent shortage of skilled technicians has elevated labor costs and made employee retention a competitive advantage. Companies that invest in training programs and offer competitive compensation are better positioned for growth. Regulatory changes around refrigerants and energy efficiency continue to shape equipment offerings and service requirements.\\n\\nFrom a valuation perspective, HVAC contractors typically sell for 2.5-3.5 times seller's discretionary earnings, with maintenance agreement portfolios commanding premium valuations due to their recurring revenue nature. Buyers particularly value technician teams with manufacturer certifications, strong online reputations, and demonstrated customer retention. The industry's essential nature and consistent demand make well-run HVAC contractors attractive acquisition targets for both strategic buyers looking to expand geographic coverage and financial buyers seeking stable cash flows."
  },
  "knowledge_requests": {
    "tax_form_specific": ["1120-S"],
    "risk_factors": ["owner_dependence", "customer_concentration", "technician_retention"],
    "benchmarks_needed": ["sde_add_backs_hvac", "owner_compensation_market_rate"]
  },
  "knowledge_reasoning": "For Pass 3 (Earnings Normalization), I need guidance on typical SDE add-backs for HVAC contractors and market-rate owner compensation for this size company. For Pass 4 (Risk Assessment), I need to evaluate owner dependence given that the owner handles most sales, and assess the impact of the strong technician retention on risk profile."
}
\`\`\`

## HANDLING INSUFFICIENT INDUSTRY DATA

If the injected knowledge doesn't include specific industry data:

1. **Use sector-level data** as a starting point
2. **Apply general small business principles**
3. **Note the limitation** in your analysis
4. **Be conservative** in multiple selection
5. **Request additional knowledge** for the next pass

## FINAL CHECKLIST

Before outputting, verify:
□ Industry correctly identified with NAICS code
□ Market size and growth rate included
□ Competitive landscape analyzed
□ All three multiple types provided (SDE, Revenue, EBITDA)
□ Rules of thumb documented with context
□ Company positioned relative to industry
□ At least 10 due diligence questions generated
□ Industry narrative is 400-600 words
□ Knowledge requests specify needs for Pass 3 and 4
□ All numbers are realistic and sourced`;

export const pass2UserPrompt = (
  companyName: string,
  pass1Summary: string,
  injectedKnowledge: string
): string => `## TASK: Industry Analysis for ${companyName}

Using the extracted data from Pass 1 and the injected industry knowledge, perform a comprehensive industry analysis.

## PASS 1 EXTRACTED DATA SUMMARY

${pass1Summary}

## INJECTED INDUSTRY KNOWLEDGE

${injectedKnowledge}

## YOUR ANALYSIS REQUIREMENTS

1. **Industry Overview**
   - Confirm or refine the industry classification
   - Document market size, growth rate, and outlook
   - Identify key trends affecting this industry

2. **Competitive Analysis**
   - Describe the market structure
   - Identify barriers to entry
   - List competitive factors

3. **Valuation Multiples**
   - Extract SDE, Revenue, and EBITDA multiple ranges
   - Note the sources and applicability
   - Identify any special considerations

4. **Rules of Thumb**
   - Document industry-specific valuation shortcuts
   - Explain how to interpret them
   - Note limitations

5. **Company Positioning**
   - Compare subject company to benchmarks
   - Identify competitive advantages and disadvantages
   - Assess relative size and performance

6. **Due Diligence Questions**
   - Generate 10-15 industry-specific questions
   - Cover customers, operations, competition, compliance, people

7. **Industry Narrative**
   - Write 400-600 words
   - Cover all five required paragraphs
   - Use specific numbers and facts
   - Professional, buyer-focused tone

8. **Knowledge Requests**
   - Specify what's needed for Pass 3 (Earnings Normalization)
   - Specify what's needed for Pass 4 (Risk Assessment)

## OUTPUT

Respond with valid JSON only. No additional text before or after the JSON.

Begin your analysis now.`;

/**
 * Create a Pass 1 summary for Pass 2 input
 */
export function createPass1Summary(pass1Output: any): string {
  const a = pass1Output.analysis;
  const latestYear = Object.keys(a.financial_data || {})[0];
  const financials = a.financial_data?.[latestYear] || {};

  let summary = `### Company Information
- **Legal Name:** ${a.company_info?.legal_name || 'Unknown'}
- **Entity Type:** ${a.company_info?.entity_type || 'Unknown'}
- **Location:** ${a.company_info?.address?.city || ''}, ${a.company_info?.address?.state || ''}

### Industry Classification (from Pass 1)
- **Detected Industry:** ${a.industry_classification?.detected_industry || 'Unknown'}
- **NAICS Code:** ${a.industry_classification?.naics_code || 'Unknown'}
- **Keywords:** ${(a.industry_classification?.industry_keywords || []).join(', ')}
- **Confidence:** ${a.industry_classification?.confidence || 'Medium'}

### Financial Summary (${latestYear || 'Latest Year'})
- **Net Revenue:** $${(financials.revenue?.net_revenue || 0).toLocaleString()}
- **Gross Profit:** $${(financials.gross_profit || 0).toLocaleString()}
- **Operating Income:** $${(financials.operating_income || 0).toLocaleString()}
- **Net Income:** $${(financials.net_income || 0).toLocaleString()}
- **Officer Compensation:** $${(financials.operating_expenses?.officer_compensation || 0).toLocaleString()}
- **Depreciation:** $${(financials.operating_expenses?.depreciation || 0).toLocaleString()}
- **Interest Expense:** $${(financials.operating_expenses?.interest_expense || 0).toLocaleString()}

### Key Ratios
- **Gross Margin:** ${financials.revenue?.net_revenue ? ((financials.gross_profit / financials.revenue.net_revenue) * 100).toFixed(1) : 0}%
- **Operating Margin:** ${financials.revenue?.net_revenue ? ((financials.operating_income / financials.revenue.net_revenue) * 100).toFixed(1) : 0}%
- **Net Margin:** ${financials.revenue?.net_revenue ? ((financials.net_income / financials.revenue.net_revenue) * 100).toFixed(1) : 0}%

### Balance Sheet Highlights
- **Total Assets:** $${(financials.balance_sheet?.assets?.total_assets || 0).toLocaleString()}
- **Total Liabilities:** $${(financials.balance_sheet?.liabilities?.total_liabilities || 0).toLocaleString()}
- **Total Equity:** $${(financials.balance_sheet?.equity?.total_equity || 0).toLocaleString()}
- **Cash:** $${(financials.balance_sheet?.assets?.cash || 0).toLocaleString()}
- **Accounts Receivable:** $${(financials.balance_sheet?.assets?.accounts_receivable || 0).toLocaleString()}
- **Inventory:** $${(financials.balance_sheet?.assets?.inventory || 0).toLocaleString()}

### Document Information
- **Document Type:** ${a.document_info?.document_type || 'Unknown'}
- **Years Analyzed:** ${(a.document_info?.fiscal_years || []).join(', ')}
- **Data Quality:** ${a.document_info?.quality_assessment || 'Unknown'}

### Data Quality Notes
${(a.data_quality_flags || []).map((f: string) => `- ${f}`).join('\n') || '- No significant issues noted'}
`;

  return summary;
}

/**
 * Build the complete prompt for Pass 2
 */
export function buildPass2Prompt(
  companyName: string,
  pass1Output: any,
  injectedKnowledge: string
): {
  system: string;
  user: string;
} {
  const pass1Summary = createPass1Summary(pass1Output);

  return {
    system: pass2SystemPrompt,
    user: pass2UserPrompt(companyName, pass1Summary, injectedKnowledge),
  };
}

/**
 * Validate Pass 2 output structure
 */
export function validatePass2Output(output: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!output.analysis) {
    errors.push('Missing analysis object');
    return { valid: false, errors };
  }

  const a = output.analysis;

  // Check industry_overview
  if (!a.industry_overview?.industry_name) {
    errors.push('Missing industry_overview.industry_name');
  }
  if (!a.industry_overview?.naics_code) {
    errors.push('Missing industry_overview.naics_code');
  }
  if (!a.industry_overview?.growth_outlook) {
    errors.push('Missing industry_overview.growth_outlook');
  }
  if (!a.industry_overview?.key_trends?.length) {
    errors.push('Missing industry_overview.key_trends');
  }

  // Check competitive_landscape
  if (!a.competitive_landscape?.market_structure) {
    errors.push('Missing competitive_landscape.market_structure');
  }
  if (!a.competitive_landscape?.barriers_to_entry) {
    errors.push('Missing competitive_landscape.barriers_to_entry');
  }

  // Check industry_benchmarks
  if (!a.industry_benchmarks?.sde_multiple_range?.median) {
    errors.push('Missing industry_benchmarks.sde_multiple_range');
  }
  if (!a.industry_benchmarks?.revenue_multiple_range?.median) {
    errors.push('Missing industry_benchmarks.revenue_multiple_range');
  }

  // Check rules_of_thumb
  if (!a.rules_of_thumb?.primary_valuation_method) {
    errors.push('Missing rules_of_thumb.primary_valuation_method');
  }

  // Check due_diligence_questions
  if (!a.due_diligence_questions?.length || a.due_diligence_questions.length < 5) {
    errors.push('Need at least 5 due_diligence_questions');
  }

  // Check industry_narrative
  if (!a.industry_narrative) {
    errors.push('Missing industry_narrative');
  } else {
    const wordCount = a.industry_narrative.split(/\s+/).length;
    if (wordCount < 300) {
      errors.push(`industry_narrative too short: ${wordCount} words (need 400-600)`);
    }
  }

  // Check knowledge_requests
  if (!output.knowledge_requests) {
    errors.push('Missing knowledge_requests');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Extract key metrics from Pass 2 for subsequent passes
 */
export function extractPass2Metrics(pass2Output: any): {
  sdeMultiple: { low: number; median: number; high: number };
  revenueMultiple: { low: number; median: number; high: number };
  ebitdaMultiple: { low: number; median: number; high: number };
  industryName: string;
  naicsCode: string;
  growthOutlook: string;
  barriersToEntry: string;
} {
  const a = pass2Output.analysis;

  return {
    sdeMultiple: a.industry_benchmarks?.sde_multiple_range || { low: 2.0, median: 2.5, high: 3.0 },
    revenueMultiple: a.industry_benchmarks?.revenue_multiple_range || { low: 0.4, median: 0.6, high: 0.8 },
    ebitdaMultiple: a.industry_benchmarks?.ebitda_multiple_range || { low: 3.0, median: 4.0, high: 5.0 },
    industryName: a.industry_overview?.industry_name || 'Unknown',
    naicsCode: a.industry_overview?.naics_code || '',
    growthOutlook: a.industry_overview?.growth_outlook || 'Stable',
    barriersToEntry: a.competitive_landscape?.barriers_to_entry || 'Medium',
  };
}

export default {
  systemPrompt: pass2SystemPrompt,
  userPrompt: pass2UserPrompt,
  createPass1Summary,
  buildPrompt: buildPass2Prompt,
  validate: validatePass2Output,
  extractMetrics: extractPass2Metrics,
};
