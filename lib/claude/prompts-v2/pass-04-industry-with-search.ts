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

CRITICAL: Return ONLY valid JSON. Do NOT wrap in markdown code fences.`;

export function buildPass4WebSearchPrompt(
  companyProfile: Record<string, unknown>,
  financialData: { annual_revenue?: number; normalized_sde?: number }
): string {
  const naicsCode = String(companyProfile?.naics_code || 'Unknown');
  const industryName = String(companyProfile?.industry_name ||
                              companyProfile?.naics_description || 'Unknown Industry');
  const revenue = financialData?.annual_revenue || 0;
  const sde = financialData?.normalized_sde || 0;

  return `## INDUSTRY RESEARCH TASK

Research the following industry for a business valuation:

**Industry**: ${industryName}
**NAICS Code**: ${naicsCode}
**Company Revenue**: $${revenue.toLocaleString()}
**Company SDE**: $${sde.toLocaleString()}

## REQUIRED WEB SEARCHES

Please perform the following searches and synthesize the results:

### 1. Industry Valuation Multiples
Search for: "${industryName} business valuation multiples 2024 2025"
Search for: "SDE multiple ${industryName} small business"
Search for: "${naicsCode} industry valuation"

### 2. Comparable Transactions
Search for: "${industryName} acquisition transactions 2024"
Search for: "${industryName} M&A deals recent"
Search for: "small business sold ${industryName}"

### 3. Industry Analysis
Search for: "${industryName} industry outlook 2025"
Search for: "${naicsCode} market size growth rate"
Search for: "${industryName} industry challenges trends"

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
