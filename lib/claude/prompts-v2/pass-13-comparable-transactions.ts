/**
 * Pass 13: Comparable Transactions
 *
 * Research real M&A transactions comparable to the subject company.
 * Uses web search to find actual transaction data.
 */

export const PASS_13_COMPARABLE_SYSTEM_PROMPT = `You are an M&A research analyst with access to web search.

Your task is to find and analyze comparable business transactions for a valuation. You MUST use web search to find real, recent transactions.

Search these sources:
- BizBuySell (bizbuysell.com)
- DealStats / BIZCOMPS references
- Industry trade publications
- Press releases about acquisitions
- SEC filings for public acquirers

For each transaction, extract:
- Deal value (if disclosed)
- Revenue and earnings multiples (if calculable)
- Strategic rationale
- Buyer type (strategic vs. financial)

CRITICAL: Return ONLY valid JSON. Cite all sources.`;

export function buildPass13ComparablePrompt(
  industryName: string,
  naicsCode: string,
  companyRevenue: number,
  companySDE: number
): string {
  // Determine revenue range for comparable search
  const revenueLow = Math.round(companyRevenue * 0.5);
  const revenueHigh = Math.round(companyRevenue * 2);

  return `## COMPARABLE TRANSACTIONS RESEARCH

Find recent M&A transactions comparable to:

**Industry**: ${industryName}
**NAICS Code**: ${naicsCode}
**Target Company Revenue**: $${companyRevenue.toLocaleString()}
**Target Company SDE**: $${companySDE.toLocaleString()}
**Comparable Revenue Range**: $${revenueLow.toLocaleString()} - $${revenueHigh.toLocaleString()}

## REQUIRED SEARCHES

Perform these searches to find comparable transactions:

1. "${industryName} business sold 2024"
2. "${industryName} acquisition announcement"
3. "${industryName} company acquired"
4. "${naicsCode} M&A transactions"
5. "small business acquisition ${industryName}"
6. "BizBuySell ${industryName} sold"
7. "${industryName} business for sale closed deal"

## SELECTION CRITERIA

Ideal comparables should have:
- Same or similar NAICS code
- Revenue within 50%-200% of target
- Transaction within last 24 months
- Similar business model
- Similar geographic market (if relevant)

## OUTPUT FORMAT

Return JSON with exactly this structure:

{
  "pass_number": 13,
  "pass_name": "Comparable Transactions",

  "search_parameters": {
    "industry": "${industryName}",
    "naics_code": "${naicsCode}",
    "target_revenue": ${companyRevenue},
    "target_sde": ${companySDE},
    "revenue_range": {
      "low": ${revenueLow},
      "high": ${revenueHigh}
    },
    "search_date": "YYYY-MM-DD"
  },

  "comparable_transactions": [
    {
      "transaction_id": "COMP-001",
      "company_name": "string (use 'Undisclosed' if not public)",
      "company_description": "Brief description of the target company",
      "industry_match": "Exact" | "Close" | "Adjacent",
      "transaction_date": "YYYY-MM",
      "deal_structure": "Asset Sale" | "Stock Sale" | "Merger" | "Unknown",

      "financials": {
        "deal_value": number | null,
        "revenue": number | null,
        "sde": number | null,
        "ebitda": number | null
      },

      "implied_multiples": {
        "revenue_multiple": number | null,
        "sde_multiple": number | null,
        "ebitda_multiple": number | null
      },

      "buyer_info": {
        "buyer_name": "string",
        "buyer_type": "Strategic" | "Financial" | "Individual" | "Unknown",
        "acquisition_rationale": "string"
      },

      "comparability_assessment": {
        "size_match": "Smaller" | "Similar" | "Larger",
        "service_match": "High" | "Medium" | "Low",
        "geographic_match": "Same Region" | "Same Country" | "Different",
        "overall_comparability": "High" | "Medium" | "Low",
        "adjustment_factors": ["string - reasons this comp may trade higher/lower"]
      },

      "source": {
        "name": "string",
        "url": "string",
        "accessed_date": "YYYY-MM-DD"
      }
    }
  ],

  "transaction_summary": {
    "total_transactions_found": number,
    "transactions_analyzed": number,
    "median_sde_multiple": number | null,
    "median_revenue_multiple": number | null,
    "median_ebitda_multiple": number | null,
    "multiple_range": {
      "sde_low": number,
      "sde_high": number,
      "revenue_low": number,
      "revenue_high": number
    },
    "key_observations": ["string"]
  },

  "market_commentary": {
    "deal_activity_level": "High" | "Moderate" | "Low",
    "buyer_demand": "Strong" | "Stable" | "Weak",
    "pricing_trends": "Increasing" | "Stable" | "Decreasing",
    "commentary": "2-3 sentence summary of current M&A market for this industry"
  },

  "data_limitations": [
    "string - note any limitations in available transaction data"
  ],

  "sources": [
    {
      "name": "string",
      "url": "string",
      "accessed_date": "YYYY-MM-DD",
      "transactions_from_source": number
    }
  ],

  "extraction_metadata": {
    "processing_time_ms": 0,
    "tokens_used": 0,
    "web_search_used": true
  }
}

IMPORTANT:
- Find at least 3-5 transactions if possible
- If exact industry matches are scarce, include adjacent industries with clear notation
- Always cite sources
- If deal values are undisclosed, note this but still include the transaction for qualitative context`;
}

export const pass13ComparableConfig = {
  passNumber: 13,
  passName: 'Comparable Transactions',
  maxTokens: 8192,
  temperature: 0.2,
  supportsWebSearch: true,
  dependencies: [1, 2, 5],
};
