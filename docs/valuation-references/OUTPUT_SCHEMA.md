# Business Valuation Output Schema

This document defines the comprehensive JSON output schema that Claude must produce when performing a business valuation. This schema is designed for direct consumption by the Business Valuation App for PDF report generation.

## Schema Version
**Version**: 2.0  
**Last Updated**: January 2026  
**Breaking Changes from v1**: Added confidence scores, expanded risk assessment, structured KPIs, enhanced narrative sections

---

## Complete Output Schema

```json
{
  "schema_version": "2.0",
  "valuation_date": "YYYY-MM-DD",
  "generated_at": "ISO-8601 timestamp",
  
  "company_profile": {
    "legal_name": "string",
    "dba_name": "string | null",
    "entity_type": "S-Corporation | C-Corporation | Partnership | Sole Proprietorship | LLC",
    "tax_form_type": "1120-S | 1120 | 1065 | Schedule C",
    "ein": "string | null",
    "address": {
      "street": "string | null",
      "city": "string | null",
      "state": "string | null",
      "zip": "string | null"
    },
    "fiscal_year_end": "MM-DD",
    "years_in_business": "number | null",
    "number_of_employees": "number | null",
    "industry": {
      "naics_code": "string (6-digit)",
      "naics_description": "string",
      "sic_code": "string | null",
      "industry_sector": "string",
      "industry_subsector": "string"
    },
    "business_description": "string (100-300 words describing the business operations)"
  },

  "financial_data": {
    "periods_analyzed": ["2024", "2023", "2022"],
    "currency": "USD",
    
    "income_statements": [
      {
        "period": "2024",
        "source_document": "Form 1120-S",
        "revenue": {
          "gross_receipts": "number",
          "returns_and_allowances": "number",
          "net_revenue": "number"
        },
        "cost_of_goods_sold": {
          "beginning_inventory": "number",
          "purchases": "number",
          "labor": "number",
          "other_costs": "number",
          "ending_inventory": "number",
          "total_cogs": "number"
        },
        "gross_profit": "number",
        "operating_expenses": {
          "officer_compensation": "number",
          "salaries_and_wages": "number",
          "repairs_and_maintenance": "number",
          "bad_debts": "number",
          "rent": "number",
          "taxes_and_licenses": "number",
          "interest_expense": "number",
          "depreciation": "number",
          "amortization": "number",
          "advertising": "number",
          "pension_and_profit_sharing": "number",
          "employee_benefits": "number",
          "other_deductions": "number",
          "total_operating_expenses": "number"
        },
        "operating_income": "number",
        "other_income": "number",
        "other_expenses": "number",
        "net_income_before_tax": "number",
        "income_tax_expense": "number",
        "net_income": "number"
      }
    ],

    "balance_sheets": [
      {
        "period": "2024",
        "source_document": "Schedule L",
        "assets": {
          "current_assets": {
            "cash": "number",
            "accounts_receivable": "number",
            "allowance_for_doubtful_accounts": "number",
            "inventory": "number",
            "prepaid_expenses": "number",
            "other_current_assets": "number",
            "total_current_assets": "number"
          },
          "fixed_assets": {
            "land": "number",
            "buildings": "number",
            "machinery_and_equipment": "number",
            "furniture_and_fixtures": "number",
            "vehicles": "number",
            "leasehold_improvements": "number",
            "accumulated_depreciation": "number",
            "net_fixed_assets": "number"
          },
          "other_assets": {
            "intangible_assets": "number",
            "goodwill": "number",
            "other": "number",
            "total_other_assets": "number"
          },
          "total_assets": "number"
        },
        "liabilities": {
          "current_liabilities": {
            "accounts_payable": "number",
            "accrued_expenses": "number",
            "current_portion_long_term_debt": "number",
            "other_current_liabilities": "number",
            "total_current_liabilities": "number"
          },
          "long_term_liabilities": {
            "notes_payable": "number",
            "mortgages": "number",
            "shareholder_loans": "number",
            "other_long_term_liabilities": "number",
            "total_long_term_liabilities": "number"
          },
          "total_liabilities": "number"
        },
        "equity": {
          "common_stock": "number",
          "additional_paid_in_capital": "number",
          "retained_earnings": "number",
          "treasury_stock": "number",
          "total_equity": "number"
        }
      }
    ]
  },

  "normalized_earnings": {
    "methodology_notes": "string explaining normalization approach",
    
    "sde_calculation": {
      "periods": [
        {
          "period": "2024",
          "starting_net_income": "number",
          "adjustments": [
            {
              "category": "Officer Compensation",
              "description": "Owner salary added back",
              "amount": "number",
              "source_line": "Form 1120-S, Line 7"
            },
            {
              "category": "Interest Expense",
              "description": "Business loan interest",
              "amount": "number",
              "source_line": "Form 1120-S, Line 19"
            },
            {
              "category": "Depreciation",
              "description": "Non-cash expense",
              "amount": "number",
              "source_line": "Form 1120-S, Line 12"
            },
            {
              "category": "Amortization",
              "description": "Non-cash expense",
              "amount": "number",
              "source_line": "Form 1120-S, Line 13"
            },
            {
              "category": "Owner Perks",
              "description": "Personal vehicle expenses",
              "amount": "number",
              "source_line": "Estimated from Other Deductions"
            },
            {
              "category": "Non-Recurring",
              "description": "One-time legal settlement",
              "amount": "number",
              "source_line": "Other Deductions"
            }
          ],
          "total_adjustments": "number",
          "sde": "number"
        }
      ],
      "weighted_average_sde": {
        "calculation_method": "3-year weighted average (3x most recent, 2x prior, 1x earliest)",
        "weights": [3, 2, 1],
        "weighted_sde": "number"
      }
    },

    "ebitda_calculation": {
      "periods": [
        {
          "period": "2024",
          "starting_net_income": "number",
          "add_interest": "number",
          "add_taxes": "number",
          "add_depreciation": "number",
          "add_amortization": "number",
          "owner_compensation_adjustment": {
            "actual_owner_compensation": "number",
            "fair_market_replacement_salary": "number",
            "adjustment_amount": "number"
          },
          "other_normalizing_adjustments": "number",
          "adjusted_ebitda": "number"
        }
      ],
      "weighted_average_ebitda": "number"
    }
  },

  "industry_analysis": {
    "industry_overview": "string (400-600 words)",
    "market_size": "string",
    "growth_rate": "string (percentage)",
    "growth_outlook": "Growing | Stable | Declining",
    "key_trends": ["string"],
    "competitive_landscape": "string (200-300 words)",
    "barriers_to_entry": "Low | Medium | High",
    "regulatory_environment": "string",
    "technology_impact": "string",
    
    "industry_benchmarks": {
      "gross_margin_benchmark": {
        "low": "number (percentage)",
        "median": "number (percentage)",
        "high": "number (percentage)"
      },
      "operating_margin_benchmark": {
        "low": "number (percentage)",
        "median": "number (percentage)",
        "high": "number (percentage)"
      },
      "revenue_per_employee_benchmark": {
        "low": "number",
        "median": "number",
        "high": "number"
      }
    },

    "valuation_multiples": {
      "sde_multiple_range": {
        "low": "number",
        "median": "number",
        "high": "number"
      },
      "ebitda_multiple_range": {
        "low": "number",
        "median": "number",
        "high": "number"
      },
      "revenue_multiple_range": {
        "low": "number",
        "median": "number",
        "high": "number"
      },
      "multiple_source": "string (e.g., 'BizBuySell 2024 data', 'DealStats')",
      "multiple_selection_rationale": "string explaining why specific multiple was chosen"
    }
  },

  "risk_assessment": {
    "overall_risk_rating": "Low | Moderate | High | Very High",
    "overall_risk_score": "number (1-10, where 10 is highest risk)",
    
    "risk_factors": [
      {
        "category": "Customer Concentration",
        "rating": "Low | Moderate | High | Critical",
        "score": "number (1-10)",
        "description": "string",
        "mitigation": "string",
        "impact_on_multiple": "number (percentage adjustment, e.g., -0.15 for 15% reduction)"
      },
      {
        "category": "Owner Dependence",
        "rating": "Low | Moderate | High | Critical",
        "score": "number (1-10)",
        "description": "string",
        "mitigation": "string",
        "impact_on_multiple": "number"
      },
      {
        "category": "Industry Risk",
        "rating": "Low | Moderate | High | Critical",
        "score": "number (1-10)",
        "description": "string",
        "mitigation": "string",
        "impact_on_multiple": "number"
      },
      {
        "category": "Financial Risk",
        "rating": "Low | Moderate | High | Critical",
        "score": "number (1-10)",
        "description": "string",
        "mitigation": "string",
        "impact_on_multiple": "number"
      },
      {
        "category": "Operational Risk",
        "rating": "Low | Moderate | High | Critical",
        "score": "number (1-10)",
        "description": "string",
        "mitigation": "string",
        "impact_on_multiple": "number"
      },
      {
        "category": "Market/Economic Risk",
        "rating": "Low | Moderate | High | Critical",
        "score": "number (1-10)",
        "description": "string",
        "mitigation": "string",
        "impact_on_multiple": "number"
      }
    ],

    "company_specific_risks": ["string"],
    "company_specific_strengths": ["string"],
    
    "risk_adjusted_multiple": {
      "base_multiple": "number",
      "total_risk_adjustment": "number (percentage)",
      "adjusted_multiple": "number"
    }
  },

  "kpi_analysis": {
    "profitability_metrics": {
      "gross_profit_margin": {
        "value": "number (percentage)",
        "trend": "Improving | Stable | Declining",
        "vs_industry": "Above | At | Below",
        "industry_percentile": "number"
      },
      "operating_profit_margin": {
        "value": "number (percentage)",
        "trend": "Improving | Stable | Declining",
        "vs_industry": "Above | At | Below",
        "industry_percentile": "number"
      },
      "net_profit_margin": {
        "value": "number (percentage)",
        "trend": "Improving | Stable | Declining",
        "vs_industry": "Above | At | Below",
        "industry_percentile": "number"
      },
      "sde_margin": {
        "value": "number (percentage)",
        "trend": "Improving | Stable | Declining",
        "vs_industry": "Above | At | Below"
      },
      "ebitda_margin": {
        "value": "number (percentage)",
        "trend": "Improving | Stable | Declining",
        "vs_industry": "Above | At | Below"
      }
    },

    "liquidity_metrics": {
      "current_ratio": {
        "value": "number",
        "interpretation": "string",
        "vs_industry": "Above | At | Below"
      },
      "quick_ratio": {
        "value": "number",
        "interpretation": "string",
        "vs_industry": "Above | At | Below"
      },
      "working_capital": {
        "value": "number",
        "as_percentage_of_revenue": "number (percentage)"
      }
    },

    "efficiency_metrics": {
      "revenue_per_employee": {
        "value": "number",
        "vs_industry": "Above | At | Below"
      },
      "inventory_turnover": {
        "value": "number",
        "days_inventory": "number"
      },
      "receivables_turnover": {
        "value": "number",
        "days_sales_outstanding": "number"
      },
      "asset_turnover": {
        "value": "number"
      }
    },

    "leverage_metrics": {
      "debt_to_equity": {
        "value": "number",
        "interpretation": "string"
      },
      "debt_to_assets": {
        "value": "number (percentage)"
      },
      "interest_coverage_ratio": {
        "value": "number",
        "interpretation": "string"
      }
    },

    "growth_metrics": {
      "revenue_growth_yoy": [
        {"period": "2024 vs 2023", "value": "number (percentage)"},
        {"period": "2023 vs 2022", "value": "number (percentage)"}
      ],
      "revenue_cagr_3yr": "number (percentage)",
      "sde_growth_yoy": "number (percentage)",
      "employee_growth": "number (percentage)"
    }
  },

  "valuation_approaches": {
    "asset_approach": {
      "methodology": "Adjusted Net Asset Method",
      "applicable": "boolean",
      "applicability_rationale": "string",
      
      "book_value_of_equity": "number",
      "asset_adjustments": [
        {
          "asset": "Accounts Receivable",
          "book_value": "number",
          "fair_market_value": "number",
          "adjustment": "number",
          "rationale": "string"
        },
        {
          "asset": "Inventory",
          "book_value": "number",
          "fair_market_value": "number",
          "adjustment": "number",
          "rationale": "string"
        },
        {
          "asset": "Fixed Assets",
          "book_value": "number",
          "fair_market_value": "number",
          "adjustment": "number",
          "rationale": "string"
        }
      ],
      "liability_adjustments": [
        {
          "liability": "string",
          "book_value": "number",
          "fair_market_value": "number",
          "adjustment": "number",
          "rationale": "string"
        }
      ],
      "total_asset_adjustments": "number",
      "total_liability_adjustments": "number",
      "adjusted_net_asset_value": "number",
      
      "weight_assigned": "number (percentage, e.g., 0.20 for 20%)",
      "weight_rationale": "string"
    },

    "income_approach": {
      "methodology": "Capitalization of Earnings",
      "applicable": "boolean",
      "applicability_rationale": "string",
      
      "benefit_stream_used": "SDE | EBITDA",
      "benefit_stream_value": "number",
      "benefit_stream_rationale": "string explaining why SDE or EBITDA was chosen",
      
      "capitalization_rate": {
        "risk_free_rate": "number (percentage)",
        "equity_risk_premium": "number (percentage)",
        "size_premium": "number (percentage)",
        "industry_risk_premium": "number (percentage)",
        "company_specific_risk_premium": "number (percentage)",
        "total_discount_rate": "number (percentage)",
        "long_term_growth_rate": "number (percentage)",
        "capitalization_rate": "number (percentage)"
      },
      
      "income_approach_value": "number",
      
      "weight_assigned": "number (percentage)",
      "weight_rationale": "string"
    },

    "market_approach": {
      "methodology": "Guideline Transaction Method",
      "applicable": "boolean",
      "applicability_rationale": "string",
      
      "comparable_transactions": {
        "source": "string (e.g., 'BizBuySell', 'DealStats')",
        "number_of_comparables": "number",
        "selection_criteria": "string",
        "comparable_summary": [
          {
            "industry": "string",
            "revenue_range": "string",
            "sde_multiple": "number",
            "ebitda_multiple": "number"
          }
        ]
      },
      
      "multiple_applied": {
        "type": "SDE Multiple | EBITDA Multiple | Revenue Multiple",
        "base_multiple": "number",
        "adjustments": [
          {
            "factor": "string",
            "adjustment": "number (percentage)"
          }
        ],
        "adjusted_multiple": "number"
      },
      
      "benefit_stream_value": "number",
      "market_approach_value": "number",
      
      "weight_assigned": "number (percentage)",
      "weight_rationale": "string"
    }
  },

  "valuation_synthesis": {
    "approach_summary": [
      {
        "approach": "Asset Approach",
        "value": "number",
        "weight": "number (percentage)",
        "weighted_value": "number"
      },
      {
        "approach": "Income Approach",
        "value": "number",
        "weight": "number (percentage)",
        "weighted_value": "number"
      },
      {
        "approach": "Market Approach",
        "value": "number",
        "weight": "number (percentage)",
        "weighted_value": "number"
      }
    ],
    
    "preliminary_value": "number",
    
    "discounts_and_premiums": {
      "dlom": {
        "applicable": "boolean",
        "percentage": "number",
        "rationale": "string"
      },
      "dloc": {
        "applicable": "boolean",
        "percentage": "number",
        "rationale": "string"
      },
      "control_premium": {
        "applicable": "boolean",
        "percentage": "number",
        "rationale": "string"
      },
      "other_adjustments": [
        {
          "name": "string",
          "percentage": "number",
          "rationale": "string"
        }
      ],
      "total_discount_premium": "number (percentage)"
    },
    
    "final_valuation": {
      "concluded_value": "number",
      "valuation_range_low": "number",
      "valuation_range_high": "number",
      "confidence_level": "Low | Moderate | High",
      "confidence_rationale": "string"
    },

    "working_capital_analysis": {
      "normal_working_capital": "number",
      "actual_working_capital": "number",
      "working_capital_adjustment": "number",
      "notes": "string"
    }
  },

  "narratives": {
    "executive_summary": {
      "word_count_target": 800,
      "content": "string (comprehensive executive summary)"
    },
    "company_overview": {
      "word_count_target": 500,
      "content": "string"
    },
    "financial_analysis": {
      "word_count_target": 1000,
      "content": "string (detailed financial analysis with specific numbers)"
    },
    "industry_analysis": {
      "word_count_target": 600,
      "content": "string"
    },
    "risk_assessment": {
      "word_count_target": 700,
      "content": "string"
    },
    "asset_approach_narrative": {
      "word_count_target": 500,
      "content": "string"
    },
    "income_approach_narrative": {
      "word_count_target": 500,
      "content": "string"
    },
    "market_approach_narrative": {
      "word_count_target": 500,
      "content": "string"
    },
    "valuation_synthesis_narrative": {
      "word_count_target": 600,
      "content": "string"
    },
    "assumptions_and_limiting_conditions": {
      "word_count_target": 400,
      "content": "string"
    },
    "value_enhancement_recommendations": {
      "word_count_target": 500,
      "content": "string (actionable recommendations to increase business value)"
    }
  },

  "data_quality": {
    "extraction_confidence": "Low | Moderate | High",
    "data_completeness_score": "number (percentage)",
    "missing_data_flags": [
      {
        "field": "string",
        "impact": "string",
        "assumption_made": "string"
      }
    ],
    "data_quality_notes": "string",
    "recommendations_for_improvement": ["string"]
  },

  "metadata": {
    "documents_analyzed": [
      {
        "filename": "string",
        "document_type": "string",
        "tax_year": "string",
        "pages": "number"
      }
    ],
    "processing_notes": "string",
    "analyst_notes": "string"
  }
}
```

---

## Field Requirements and Validation Rules

### Required Fields (Must Always Be Present)
- `schema_version`
- `valuation_date`
- `company_profile.legal_name`
- `company_profile.entity_type`
- `company_profile.industry.naics_code`
- `financial_data.income_statements` (at least one period)
- `normalized_earnings.sde_calculation` OR `normalized_earnings.ebitda_calculation`
- `valuation_approaches` (at least two approaches must be calculated)
- `valuation_synthesis.final_valuation.concluded_value`
- All narrative sections

### Validation Rules

1. **Valuation Floor**: `final_valuation.concluded_value` must be >= `asset_approach.adjusted_net_asset_value`
2. **Weight Sum**: All approach weights must sum to 1.0 (100%)
3. **Range Validity**: `valuation_range_low` < `concluded_value` < `valuation_range_high`
4. **Narrative Minimums**: Each narrative must meet at least 80% of `word_count_target`
5. **Financial Consistency**: `gross_profit` = `net_revenue` - `total_cogs`
6. **Balance Sheet Balance**: `total_assets` = `total_liabilities` + `total_equity`

### Handling Missing Data

When data cannot be extracted:
1. Set the field to `null`
2. Add an entry to `data_quality.missing_data_flags`
3. Document any assumptions made
4. Adjust `data_quality.extraction_confidence` accordingly

---

## Example Partial Output

```json
{
  "schema_version": "2.0",
  "valuation_date": "2026-01-17",
  "generated_at": "2026-01-17T15:30:00Z",
  
  "company_profile": {
    "legal_name": "K-Factor, Inc.",
    "dba_name": null,
    "entity_type": "S-Corporation",
    "tax_form_type": "1120-S",
    "ein": "12-3456789",
    "address": {
      "street": "123 Business Lane",
      "city": "Austin",
      "state": "TX",
      "zip": "78701"
    },
    "fiscal_year_end": "12-31",
    "years_in_business": 8,
    "number_of_employees": 12,
    "industry": {
      "naics_code": "541611",
      "naics_description": "Administrative Management and General Management Consulting Services",
      "sic_code": "8742",
      "industry_sector": "Professional Services",
      "industry_subsector": "Management Consulting"
    },
    "business_description": "K-Factor, Inc. is a management consulting firm specializing in operational efficiency and business process improvement for mid-sized manufacturing companies. The company provides strategic advisory services, lean manufacturing implementation, and supply chain optimization. Founded in 2018, the firm has built a strong reputation in the Texas market and serves clients across the Southwest region."
  },
  
  "valuation_synthesis": {
    "approach_summary": [
      {
        "approach": "Asset Approach",
        "value": 285000,
        "weight": 0.20,
        "weighted_value": 57000
      },
      {
        "approach": "Income Approach",
        "value": 1250000,
        "weight": 0.45,
        "weighted_value": 562500
      },
      {
        "approach": "Market Approach",
        "value": 1100000,
        "weight": 0.35,
        "weighted_value": 385000
      }
    ],
    "preliminary_value": 1004500,
    "discounts_and_premiums": {
      "dlom": {
        "applicable": true,
        "percentage": 0.15,
        "rationale": "Standard DLOM for private company with limited marketability"
      },
      "dloc": {
        "applicable": false,
        "percentage": 0,
        "rationale": "Valuing 100% ownership interest"
      },
      "control_premium": {
        "applicable": false,
        "percentage": 0,
        "rationale": "Not applicable for 100% interest"
      },
      "other_adjustments": [],
      "total_discount_premium": -0.15
    },
    "final_valuation": {
      "concluded_value": 854000,
      "valuation_range_low": 750000,
      "valuation_range_high": 950000,
      "confidence_level": "High",
      "confidence_rationale": "Three years of consistent financial data, clear industry comparables, and straightforward business model support high confidence in this valuation."
    }
  }
}
```

---

## Integration Notes for App Development

### API Response Structure
The app should expect this JSON as the response from the Claude API call. The entire object should be parseable in a single JSON.parse() operation.

### Error Handling
If Claude cannot complete the valuation, it should return:
```json
{
  "schema_version": "2.0",
  "error": true,
  "error_code": "INSUFFICIENT_DATA | UNREADABLE_DOCUMENT | UNSUPPORTED_FORM_TYPE",
  "error_message": "string describing the issue",
  "partial_data": { ... any data that was successfully extracted ... }
}
```

### PDF Generation Mapping
Each section of the PDF report maps to specific fields:
- Cover Page → `company_profile`, `valuation_date`
- Executive Summary → `narratives.executive_summary`
- Financial Summary → `financial_data`, `kpi_analysis`
- Valuation Results → `valuation_synthesis`
- Detailed Analysis → `narratives.*`
- Appendices → `normalized_earnings`, `valuation_approaches`
