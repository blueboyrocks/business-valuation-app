/**
 * Pass 4: Industry Analysis with Web Search
 *
 * Enhanced industry analysis that leverages web search for real-time data:
 * - Current industry valuation multiples
 * - Recent M&A transactions
 * - Industry trends and outlook
 * - Economic indicators
 */

export const PASS_4_WEB_SEARCH_SYSTEM_PROMPT = `You are an expert business valuation analyst with access to web search.

Your task is to research and analyze the industry for a business valuation. You MUST use web search to find:

1. **Current Industry Multiples**: Search for recent SDE and EBITDA multiples for this specific industry
2. **Comparable Transactions**: Find 3-5 recent M&A transactions in this sector (last 24 months)
3. **Industry Trends**: Current market conditions, growth rates, challenges
4. **Economic Factors**: Interest rates, inflation, sector-specific economic indicators

For EVERY factual claim about industry data, you MUST:
- Use web search to verify current data
- Cite your sources with URLs
- Include the date of the data

IMPORTANT HANDLING FOR UNKNOWN INDUSTRIES:
If the industry is listed as "Unknown" or you cannot identify it:
1. Search for general "small business valuation multiples" and "private company acquisition trends"
2. Use broad service or retail business benchmarks as defaults
3. Still return complete JSON with your best estimates and note the limitations
4. NEVER refuse to provide data - always give reasonable defaults based on general small business data

CRITICAL REQUIREMENTS:
- You MUST return ONLY valid JSON - no explanations, no markdown, no text before or after the JSON
- Start your response with { and end with }
- Do NOT include any text like "I need to" or "Let me search" - just return the JSON directly
- If you cannot find specific data, use reasonable industry defaults and note it in research_notes`;

export function buildPass4WebSearchPrompt(
  companyProfile: Record<string, unknown>,
  financialData: { annual_revenue?: number; normalized_sde?: number }
): string {
  const naicsCode = String(companyProfile?.naics_code || 'Unknown');
  const industryName = String(companyProfile?.industry_name ||
                              companyProfile?.naics_description || 'Unknown Industry');
  const revenue = financialData?.annual_revenue || 0;
  const sde = financialData?.normalized_sde || 0;

  // Determine if we have valid industry data
  const hasValidIndustry = industryName && industryName !== 'Unknown Industry' && industryName !== 'Unknown';
  const hasValidNaics = naicsCode && naicsCode !== 'Unknown' && naicsCode !== '';

  // Build search terms - use fallbacks for unknown industries
  const searchIndustry = hasValidIndustry ? industryName : 'small business service company';
  const searchNaics = hasValidNaics ? naicsCode : 'professional services';

  return `## INDUSTRY RESEARCH TASK

Research the following industry for a business valuation:

**Industry**: ${industryName}${!hasValidIndustry ? ' (NOTE: Industry unknown - use general small business data)' : ''}
**NAICS Code**: ${naicsCode}${!hasValidNaics ? ' (NOTE: NAICS unknown - use general benchmarks)' : ''}
**Company Revenue**: $${revenue.toLocaleString()}
**Company SDE**: $${sde.toLocaleString()}

${!hasValidIndustry ? `
IMPORTANT: The specific industry is unknown. You MUST still:
1. Search for general small business valuation multiples and trends
2. Use service business or general SMB benchmarks as defaults
3. Return complete JSON with reasonable estimates
4. Note the data limitations in research_notes
` : ''}

## REQUIRED WEB SEARCHES

Please perform the following searches and synthesize the results:

### 1. Industry Valuation Multiples
Search for: "${searchIndustry} business valuation multiples 2024 2025"
Search for: "SDE multiple small business acquisition"
${hasValidNaics ? `Search for: "${searchNaics} industry valuation"` : 'Search for: "private company valuation multiples by revenue"'}

### 2. Comparable Transactions
Search for: "${searchIndustry} acquisition transactions 2024"
Search for: "small business M&A deals 2024 2025"
Search for: "business sold $${Math.round(revenue / 1000000)}M revenue"

### 3. Industry Analysis
Search for: "${searchIndustry} industry outlook 2025"
Search for: "small business market trends 2025"
Search for: "${searchIndustry} industry challenges"

### 4. Economic Context
Search for: "small business lending rates 2025"
Search for: "private company valuations 2025 trends"

## OUTPUT REQUIREMENTS

Return JSON with this structure:

{
  "pass_number": 4,
  "pass_name": "Industry Analysis (Web Search Enhanced)",

  "industry_classification": {
    "naics_code": "${naicsCode}",
    "naics_description": "${industryName}",
    "sic_code": "string or null",
    "industry_sector": "string"
  },

  "valuation_multiples": {
    "sde_multiple": {
      "low": number,
      "median": number,
      "high": number,
      "source": "URL or source name",
      "data_date": "YYYY-MM"
    },
    "ebitda_multiple": {
      "low": number,
      "median": number,
      "high": number,
      "source": "string",
      "data_date": "YYYY-MM"
    },
    "revenue_multiple": {
      "low": number,
      "median": number,
      "high": number,
      "source": "string",
      "data_date": "YYYY-MM"
    }
  },

  "comparable_transactions": [
    {
      "company_name": "string (or 'Undisclosed')",
      "transaction_date": "YYYY-MM",
      "deal_value": number or null,
      "revenue": number or null,
      "ebitda": number or null,
      "implied_multiple": number or null,
      "multiple_type": "SDE" | "EBITDA" | "Revenue",
      "buyer": "string",
      "source": "URL or source",
      "notes": "string"
    }
  ],

  "industry_overview": {
    "industry_name": "${industryName}",
    "market_size": "string (e.g., '$365 billion')",
    "market_size_source": "URL",
    "growth_rate": number (as decimal, e.g., 0.052 for 5.2%),
    "growth_rate_source": "URL",
    "key_trends": ["string"],
    "key_challenges": ["string"],
    "competitive_landscape": "string description",
    "barriers_to_entry": "string",
    "industry_lifecycle": "emerging" | "growth" | "mature" | "declining",
    "industry_outlook": "Positive" | "Stable" | "Negative",
    "outlook_rationale": "string"
  },

  "industry_benchmarks": {
    "gross_margin_median": number,
    "operating_margin_median": number,
    "sde_margin_median": number,
    "current_ratio_median": number,
    "debt_to_equity_median": number,
    "source": "string"
  },

  "industry_risk_assessment": {
    "overall_industry_risk": "low" | "below_average" | "average" | "above_average" | "high",
    "industry_risk_premium": number,
    "risk_factors": [
      {
        "factor": "string",
        "impact": number,
        "description": "string"
      }
    ]
  },

  "economic_context": {
    "prime_rate": number,
    "sba_loan_rate": number,
    "inflation_rate": number,
    "gdp_growth": number,
    "unemployment_rate": number,
    "market_conditions_summary": "string",
    "data_date": "YYYY-MM",
    "sources": ["URLs"]
  },

  "sources_cited": [
    {
      "name": "string",
      "url": "string",
      "accessed_date": "YYYY-MM-DD",
      "data_type": "multiples" | "transactions" | "industry" | "economic"
    }
  ],

  "research_notes": "string - any caveats about data availability or quality",

  "extraction_metadata": {
    "processing_time_ms": 0,
    "tokens_used": 0,
    "web_search_used": true
  }
}

Use web search for EVERY section. Do not rely on training data for current multiples or transactions.`;
}
