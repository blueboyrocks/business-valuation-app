# Business Valuation Output Schema

## Required JSON Structure

Your analysis must output valid JSON matching this schema. All fields are required unless marked optional.

```json
{
  "valuation_summary": {
    "valuation_date": "2024-01-15",
    "business_name": "Company Name, LLC",
    "concluded_fair_market_value": 1500000,
    "value_range": {
      "low": 1275000,
      "high": 1725000
    },
    "confidence_level": "High",
    "primary_valuation_method": "Market Approach",
    "premise_of_value": "Fair Market Value",
    "standard_of_value": "Going Concern"
  },

  "company_overview": {
    "business_name": "Company Name, LLC",
    "legal_entity_type": "S-Corporation",
    "naics_code": "541110",
    "industry": "Legal Services",
    "location": "City, State",
    "years_in_business": 15,
    "number_of_employees": 12,
    "business_description": "Full paragraph describing the business, its services, and market position."
  },

  "financial_summary": {
    "years_analyzed": [2021, 2022, 2023],
    "revenue_trend": {
      "amounts": [1200000, 1350000, 1500000],
      "growth_rates": [null, 12.5, 11.1],
      "cagr": 11.8
    },
    "profitability": {
      "gross_margin_avg": 65.5,
      "operating_margin_avg": 22.3,
      "net_margin_avg": 18.5
    },
    "balance_sheet_summary": {
      "total_assets": 850000,
      "total_liabilities": 320000,
      "book_value_equity": 530000,
      "current_ratio": 2.1,
      "debt_to_equity": 0.60
    }
  },

  "normalized_earnings": {
    "sde_analysis": {
      "years": [2021, 2022, 2023],
      "reported_net_income": [180000, 210000, 250000],
      "add_backs": {
        "owner_compensation_excess": [75000, 80000, 85000],
        "depreciation": [25000, 28000, 30000],
        "interest_expense": [8000, 7000, 6000],
        "personal_expenses": [12000, 14000, 15000],
        "non_recurring": [0, 25000, 0],
        "other_add_backs": [5000, 6000, 7000]
      },
      "total_add_backs": [125000, 160000, 143000],
      "annual_sde": [305000, 370000, 393000],
      "weighted_average_sde": 365000,
      "weighting_method": "3-year weighted (1-2-3)",
      "add_back_categories": [
        {
          "category": "Owner Compensation",
          "amount": 85000,
          "justification": "Salary of $175,000 exceeds market rate of $90,000 for similar role",
          "confidence": "High"
        }
      ]
    },
    "ebitda_analysis": {
      "years": [2021, 2022, 2023],
      "reported_net_income": [180000, 210000, 250000],
      "add_backs": {
        "depreciation": [25000, 28000, 30000],
        "interest_expense": [8000, 7000, 6000],
        "income_taxes": [45000, 52000, 62000]
      },
      "annual_ebitda": [258000, 297000, 348000],
      "weighted_average_ebitda": 315000,
      "weighting_method": "3-year weighted (1-2-3)"
    },
    "benefit_stream_selection": {
      "selected_metric": "SDE",
      "selected_amount": 365000,
      "rationale": "SDE is appropriate as the business is owner-operated with the owner actively involved in daily operations."
    }
  },

  "industry_analysis": {
    "industry_name": "Legal Services",
    "sector": "Professional Services",
    "naics_code": "541110",
    "market_size": "Large and stable market",
    "growth_outlook": "Moderate growth expected at 3-5% annually",
    "competitive_landscape": "Fragmented market with numerous small practitioners",
    "key_success_factors": [
      "Reputation and referral network",
      "Specialization and expertise",
      "Client relationship management"
    ],
    "industry_multiples": {
      "sde_multiple_range": {"low": 1.5, "median": 2.0, "high": 2.8},
      "ebitda_multiple_range": {"low": 3.0, "median": 4.0, "high": 5.5},
      "revenue_multiple_range": {"low": 0.5, "median": 0.8, "high": 1.2}
    }
  },

  "risk_assessment": {
    "overall_risk_score": 2.65,
    "risk_category": "Average",
    "risk_factors": [
      {
        "factor_name": "Revenue Concentration",
        "weight": 0.12,
        "score": 3,
        "rationale": "Top 3 clients represent 35% of revenue"
      },
      {
        "factor_name": "Owner Dependency",
        "weight": 0.15,
        "score": 4,
        "rationale": "Owner handles most client relationships"
      }
    ],
    "multiple_adjustment": {
      "base_adjustment": -0.15,
      "rationale": "Above-average owner dependency offset by strong financial records"
    }
  },

  "valuation_approaches": {
    "asset_approach": {
      "methodology": "Adjusted Net Asset Value",
      "applicable": true,
      "book_value_equity": 530000,
      "asset_adjustments": [
        {
          "item": "Equipment",
          "book_value": 120000,
          "fair_market_value": 95000,
          "adjustment": -25000,
          "rationale": "Depreciated computer equipment near end of useful life"
        }
      ],
      "total_asset_adjustments": -25000,
      "liability_adjustments": [],
      "total_liability_adjustments": 0,
      "adjusted_net_asset_value": 505000,
      "weight_assigned": 0.15,
      "weight_rationale": "Limited weight as service business with minimal tangible assets"
    },
    "income_approach": {
      "methodology": "Single-Period Capitalization",
      "benefit_stream": "SDE",
      "benefit_stream_amount": 365000,
      "capitalization_rate": {
        "risk_free_rate": 0.045,
        "equity_risk_premium": 0.055,
        "size_premium": 0.065,
        "industry_risk_premium": 0.02,
        "company_specific_risk_premium": 0.025,
        "total_discount_rate": 0.21,
        "long_term_growth_rate": 0.03,
        "capitalization_rate": 0.18
      },
      "indicated_value": 2027778,
      "implied_multiple": 5.56,
      "weight_assigned": 0.40,
      "weight_rationale": "Strong weight given consistent earnings history"
    },
    "market_approach": {
      "methodology": "Guideline Transaction Method",
      "benefit_stream": "SDE",
      "benefit_stream_amount": 365000,
      "base_multiple": 2.0,
      "multiple_source": "Industry transaction data - Legal Services",
      "multiple_adjustments": [
        {
          "factor": "Strong reputation",
          "adjustment": 0.25
        },
        {
          "factor": "Owner dependency",
          "adjustment": -0.15
        }
      ],
      "selected_multiple": 2.10,
      "indicated_value": 766500,
      "weight_assigned": 0.45,
      "weight_rationale": "Primary method with abundant comparable transaction data"
    }
  },

  "valuation_conclusion": {
    "approach_values": {
      "asset_approach": {
        "value": 505000,
        "weight": 0.15,
        "weighted_value": 75750
      },
      "income_approach": {
        "value": 2027778,
        "weight": 0.40,
        "weighted_value": 811111
      },
      "market_approach": {
        "value": 766500,
        "weight": 0.45,
        "weighted_value": 344925
      }
    },
    "preliminary_value": 1231786,
    "discounts_applied": [
      {
        "type": "DLOM",
        "discount_percentage": 0.15,
        "discount_amount": 184768,
        "rationale": "Standard discount for lack of marketability in private company"
      }
    ],
    "concluded_fair_market_value": 1047018,
    "value_range": {
      "low": 890365,
      "high": 1203671,
      "range_rationale": "Based on +/- 15% for valuation uncertainty"
    }
  },

  "narratives": {
    "executive_summary": "Detailed 300+ word executive summary covering key findings...",
    "company_overview": "Detailed 200+ word company description...",
    "financial_analysis": "Detailed 300+ word financial analysis...",
    "industry_analysis": "Detailed 250+ word industry analysis...",
    "risk_assessment": "Detailed 200+ word risk assessment...",
    "asset_approach_narrative": "Detailed 200+ word asset approach explanation...",
    "income_approach_narrative": "Detailed 200+ word income approach explanation...",
    "market_approach_narrative": "Detailed 200+ word market approach explanation...",
    "valuation_synthesis": "Detailed 200+ word synthesis narrative...",
    "assumptions_and_limiting_conditions": "Standard assumptions and limiting conditions...",
    "value_enhancement_recommendations": "3-5 specific recommendations for increasing business value..."
  },

  "metadata": {
    "analysis_timestamp": "2024-01-15T10:30:00Z",
    "document_types_analyzed": ["Form 1120-S", "Schedule K-1"],
    "years_of_data": 3,
    "data_quality_score": 0.85,
    "confidence_metrics": {
      "data_quality": "High",
      "comparable_quality": "Medium",
      "overall_confidence": "High"
    }
  }
}
```

## Field Requirements

### Numeric Fields
- All monetary values in whole dollars (no cents)
- Percentages as decimals (0.15 not 15%)
- Ratios to 2 decimal places
- Growth rates as percentages with 1 decimal

### Narrative Fields
- **Executive Summary**: 300-500 words
- **Company Overview**: 200-300 words
- **Financial Analysis**: 300-400 words
- **Industry Analysis**: 250-350 words
- **Risk Assessment**: 200-300 words
- **Each Approach Narrative**: 200-300 words
- **Valuation Synthesis**: 200-300 words

### Confidence Levels
Use exactly these values:
- "High" - Strong data, clear comparables, converging values
- "Medium" - Adequate data, some uncertainty
- "Low" - Limited data, significant estimation required

### Risk Scores
- Individual factors: 1-5 (integers)
- Overall score: 1.00-5.00 (2 decimals)
- Categories: "Very Low", "Low", "Below Average", "Average", "Above Average", "High", "Very High"
