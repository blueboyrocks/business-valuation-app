/**
 * Pass 12: Economic Conditions
 *
 * Research current economic conditions relevant to business valuation.
 * Uses web search for real-time economic data.
 */

export const PASS_12_ECONOMIC_SYSTEM_PROMPT = `You are an economic analyst with access to web search.

Your task is to research current economic conditions relevant to business valuation. You MUST use web search to find current data.

Search for:
- Federal Reserve interest rates
- SBA lending rates
- Inflation data
- GDP growth
- Small business sentiment
- Industry-specific economic factors

CRITICAL: Return ONLY valid JSON. All data must be current (within last 30 days if possible).`;

export function buildPass12EconomicPrompt(
  industryName: string,
  valuationDate: string
): string {
  return `## ECONOMIC CONDITIONS RESEARCH

Research current economic conditions as of ${valuationDate} relevant to valuing a ${industryName} business.

## REQUIRED SEARCHES

1. "Federal Reserve interest rate decision 2025"
2. "current prime rate January 2025"
3. "SBA 7a loan rate current"
4. "US inflation rate current"
5. "small business optimism index latest"
6. "${industryName} industry economic outlook"
7. "private company valuations 2025"
8. "M&A market conditions small business"
9. "20 year treasury rate current"
10. "equity risk premium 2025"

## OUTPUT FORMAT

{
  "pass_number": 12,
  "pass_name": "Economic Conditions",

  "economic_snapshot": {
    "as_of_date": "YYYY-MM-DD",
    "data_currency": "Most recent available"
  },

  "interest_rates": {
    "federal_funds_rate": {
      "current": number,
      "previous": number,
      "direction": "Rising" | "Stable" | "Falling",
      "source": "URL"
    },
    "prime_rate": {
      "current": number,
      "source": "URL"
    },
    "10_year_treasury": {
      "current": number,
      "source": "URL"
    },
    "20_year_treasury": {
      "current": number,
      "note": "Used as risk-free rate in valuation",
      "source": "URL"
    },
    "sba_7a_rate": {
      "current_range": "string (e.g., 'Prime + 2.25% to 2.75%')",
      "effective_rate": number,
      "source": "URL"
    }
  },

  "inflation": {
    "cpi_annual": {
      "current": number,
      "previous_year": number,
      "source": "URL"
    },
    "pce_annual": {
      "current": number,
      "source": "URL"
    },
    "fed_target": number,
    "inflation_outlook": "string"
  },

  "economic_growth": {
    "gdp_growth_annual": {
      "current": number,
      "forecast_next_year": number,
      "source": "URL"
    },
    "economic_outlook": "Expansion" | "Stable" | "Slowdown" | "Recession Risk"
  },

  "small_business_environment": {
    "nfib_optimism_index": {
      "current": number,
      "historical_average": 98,
      "interpretation": "string",
      "source": "URL"
    },
    "small_business_lending": {
      "availability": "Tight" | "Normal" | "Easy",
      "trend": "string",
      "source": "URL"
    },
    "sba_loan_volume": {
      "trend": "Increasing" | "Stable" | "Decreasing",
      "note": "string"
    }
  },

  "valuation_market_conditions": {
    "m_and_a_activity": {
      "level": "High" | "Moderate" | "Low",
      "trend": "Increasing" | "Stable" | "Decreasing",
      "commentary": "string"
    },
    "private_company_multiples": {
      "trend": "Expanding" | "Stable" | "Compressing",
      "driver": "string (e.g., 'interest rates', 'buyer demand')"
    },
    "buyer_sentiment": {
      "strategic_buyers": "Active" | "Selective" | "Cautious",
      "financial_buyers": "Active" | "Selective" | "Cautious",
      "individual_buyers": "Active" | "Selective" | "Cautious"
    }
  },

  "industry_specific": {
    "industry": "${industryName}",
    "sector_performance": "Outperforming" | "In-line" | "Underperforming",
    "sector_specific_factors": ["string"],
    "regulatory_environment": "string",
    "source": "URL"
  },

  "valuation_implications": {
    "risk_free_rate_recommendation": number,
    "risk_free_rate_rationale": "Based on 20-year Treasury as of [date]",
    "equity_risk_premium_current": number,
    "equity_risk_premium_source": "Duff & Phelps / Kroll",
    "size_premium_considerations": "string",
    "overall_market_assessment": "Favorable for sellers" | "Balanced" | "Favorable for buyers",
    "key_factors_affecting_value": ["string"]
  },

  "sources": [
    {
      "name": "string",
      "url": "string",
      "data_point": "string",
      "accessed": "YYYY-MM-DD"
    }
  ],

  "extraction_metadata": {
    "processing_time_ms": 0,
    "tokens_used": 0,
    "web_search_used": true
  }
}`;
}

export const pass12EconomicConfig = {
  passNumber: 12,
  passName: 'Economic Conditions',
  maxTokens: 4096,
  temperature: 0.2,
  supportsWebSearch: true,
  dependencies: [1],
};
