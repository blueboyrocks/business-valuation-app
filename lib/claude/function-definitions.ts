/**
 * Claude Tool Definitions for Business Valuation
 * 
 * This file defines the tool (function) that Claude will use to return
 * structured valuation data. This replaces the OpenAI function definitions.
 */

import Anthropic from '@anthropic-ai/sdk';

/**
 * The main valuation output tool definition
 * Claude will call this function with the complete valuation data
 */
export const VALUATION_OUTPUT_TOOL: Anthropic.Tool = {
  name: 'submit_valuation_report',
  description: `Submit the complete business valuation report. This function MUST be called with ALL extracted financial data, calculated valuations, risk assessments, and narrative sections. Every field should be populated with actual data from the documents or well-reasoned estimates based on industry standards.`,
  input_schema: {
    type: 'object',
    properties: {
      schema_version: {
        type: 'string',
        description: 'Schema version, always "2.0"',
      },
      valuation_date: {
        type: 'string',
        description: 'Date of valuation in YYYY-MM-DD format',
      },
      
      // Company Profile
      company_profile: {
        type: 'object',
        properties: {
          legal_name: { type: 'string', description: 'Legal business name from tax return' },
          dba_name: { type: ['string', 'null'], description: 'Doing business as name, if any' },
          entity_type: { 
            type: 'string', 
            enum: ['S-Corporation', 'C-Corporation', 'Partnership', 'Sole Proprietorship', 'LLC'],
            description: 'Business entity type based on tax form' 
          },
          tax_form_type: { 
            type: 'string', 
            enum: ['1120-S', '1120', '1065', 'Schedule C'],
            description: 'Type of tax form analyzed' 
          },
          ein: { type: ['string', 'null'], description: 'Employer Identification Number' },
          address: {
            type: 'object',
            properties: {
              street: { type: ['string', 'null'] },
              city: { type: ['string', 'null'] },
              state: { type: ['string', 'null'] },
              zip: { type: ['string', 'null'] },
            },
          },
          fiscal_year_end: { type: 'string', description: 'Fiscal year end in MM-DD format' },
          years_in_business: { type: ['number', 'null'] },
          number_of_employees: { type: ['number', 'null'] },
          industry: {
            type: 'object',
            properties: {
              naics_code: { type: 'string', description: '6-digit NAICS code' },
              naics_description: { type: 'string' },
              sic_code: { type: ['string', 'null'] },
              industry_sector: { type: 'string' },
              industry_subsector: { type: 'string' },
            },
            required: ['naics_code', 'naics_description', 'industry_sector', 'industry_subsector'],
          },
          business_description: { 
            type: 'string', 
            description: 'Comprehensive business description, 100-300 words' 
          },
        },
        required: ['legal_name', 'entity_type', 'tax_form_type', 'industry', 'business_description'],
      },

      // Financial Data
      financial_data: {
        type: 'object',
        properties: {
          periods_analyzed: {
            type: 'array',
            items: { type: 'string' },
            description: 'Years analyzed, e.g., ["2024", "2023", "2022"]',
          },
          currency: { type: 'string', description: 'Always "USD"' },
          income_statements: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                period: { type: 'string' },
                source_document: { type: 'string' },
                revenue: {
                  type: 'object',
                  properties: {
                    gross_receipts: { type: 'number' },
                    returns_and_allowances: { type: 'number' },
                    net_revenue: { type: 'number' },
                  },
                },
                cost_of_goods_sold: {
                  type: 'object',
                  properties: {
                    total_cogs: { type: 'number' },
                  },
                },
                gross_profit: { type: 'number' },
                operating_expenses: {
                  type: 'object',
                  properties: {
                    officer_compensation: { type: 'number' },
                    salaries_and_wages: { type: 'number' },
                    rent: { type: 'number' },
                    interest_expense: { type: 'number' },
                    depreciation: { type: 'number' },
                    amortization: { type: 'number' },
                    other_deductions: { type: 'number' },
                    total_operating_expenses: { type: 'number' },
                  },
                },
                operating_income: { type: 'number' },
                net_income: { type: 'number' },
              },
            },
          },
          balance_sheets: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                period: { type: 'string' },
                assets: {
                  type: 'object',
                  properties: {
                    current_assets: {
                      type: 'object',
                      properties: {
                        cash: { type: 'number' },
                        accounts_receivable: { type: 'number' },
                        inventory: { type: 'number' },
                        total_current_assets: { type: 'number' },
                      },
                    },
                    fixed_assets: {
                      type: 'object',
                      properties: {
                        net_fixed_assets: { type: 'number' },
                      },
                    },
                    total_assets: { type: 'number' },
                  },
                },
                liabilities: {
                  type: 'object',
                  properties: {
                    current_liabilities: {
                      type: 'object',
                      properties: {
                        total_current_liabilities: { type: 'number' },
                      },
                    },
                    total_liabilities: { type: 'number' },
                  },
                },
                equity: {
                  type: 'object',
                  properties: {
                    total_equity: { type: 'number' },
                  },
                },
              },
            },
          },
        },
        required: ['periods_analyzed', 'currency', 'income_statements'],
      },

      // Normalized Earnings
      normalized_earnings: {
        type: 'object',
        properties: {
          methodology_notes: { type: 'string' },
          sde_calculation: {
            type: 'object',
            properties: {
              periods: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    period: { type: 'string' },
                    starting_net_income: { type: 'number' },
                    adjustments: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          category: { type: 'string' },
                          description: { type: 'string' },
                          amount: { type: 'number' },
                          source_line: { type: 'string' },
                        },
                      },
                    },
                    total_adjustments: { type: 'number' },
                    sde: { type: 'number' },
                  },
                },
              },
              weighted_average_sde: {
                type: 'object',
                properties: {
                  calculation_method: { type: 'string' },
                  weights: { type: 'array', items: { type: 'number' } },
                  weighted_sde: { type: 'number' },
                },
              },
            },
          },
          ebitda_calculation: {
            type: 'object',
            properties: {
              periods: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    period: { type: 'string' },
                    starting_net_income: { type: 'number' },
                    add_interest: { type: 'number' },
                    add_taxes: { type: 'number' },
                    add_depreciation: { type: 'number' },
                    add_amortization: { type: 'number' },
                    adjusted_ebitda: { type: 'number' },
                  },
                },
              },
              weighted_average_ebitda: { type: 'number' },
            },
          },
        },
      },

      // Industry Analysis
      industry_analysis: {
        type: 'object',
        properties: {
          industry_overview: { type: 'string', description: '400-600 words' },
          market_size: { type: 'string' },
          growth_rate: { type: 'string' },
          growth_outlook: { type: 'string', enum: ['Growing', 'Stable', 'Declining'] },
          key_trends: { type: 'array', items: { type: 'string' } },
          competitive_landscape: { type: 'string', description: '200-300 words' },
          barriers_to_entry: { type: 'string', enum: ['Low', 'Medium', 'High'] },
        },
      },

      // Risk Assessment
      risk_assessment: {
        type: 'object',
        properties: {
          overall_risk_score: { type: 'number', description: '1.0-5.0 scale' },
          risk_category: { 
            type: 'string', 
            enum: ['Low', 'Below Average', 'Average', 'Above Average', 'Elevated', 'High', 'Very High'] 
          },
          risk_factors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                factor: { type: 'string' },
                score: { type: 'number' },
                weight: { type: 'number' },
                weighted_score: { type: 'number' },
                rationale: { type: 'string' },
              },
            },
          },
          multiple_adjustment: { type: 'number', description: 'Adjustment to base multiple' },
        },
      },

      // Valuation Approaches
      valuation_approaches: {
        type: 'object',
        properties: {
          asset_approach: {
            type: 'object',
            properties: {
              methodology: { type: 'string' },
              total_assets: { type: 'number' },
              total_liabilities: { type: 'number' },
              adjusted_net_asset_value: { type: 'number' },
              adjustments: { type: 'array', items: { type: 'object' } },
            },
          },
          income_approach: {
            type: 'object',
            properties: {
              methodology: { type: 'string' },
              earnings_base: { type: 'string', enum: ['SDE', 'EBITDA'] },
              normalized_earnings: { type: 'number' },
              capitalization_rate: { type: 'number' },
              multiple_used: { type: 'number' },
              indicated_value: { type: 'number' },
            },
          },
          market_approach: {
            type: 'object',
            properties: {
              methodology: { type: 'string' },
              revenue_base: { type: 'number' },
              revenue_multiple: { type: 'number' },
              indicated_value: { type: 'number' },
              comparable_data_source: { type: 'string' },
            },
          },
        },
      },

      // Valuation Synthesis
      valuation_synthesis: {
        type: 'object',
        properties: {
          approach_summary: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                approach: { type: 'string' },
                value: { type: 'number' },
                weight: { type: 'number' },
                weighted_value: { type: 'number' },
              },
            },
          },
          preliminary_value: { type: 'number' },
          discounts_and_premiums: {
            type: 'object',
            properties: {
              dlom: {
                type: 'object',
                properties: {
                  applicable: { type: 'boolean' },
                  percentage: { type: 'number' },
                  rationale: { type: 'string' },
                },
              },
              total_discount_premium: { type: 'number' },
            },
          },
          final_valuation: {
            type: 'object',
            properties: {
              concluded_value: { type: 'number' },
              valuation_range_low: { type: 'number' },
              valuation_range_high: { type: 'number' },
              confidence_level: { type: 'string', enum: ['Low', 'Moderate', 'High'] },
              confidence_rationale: { type: 'string' },
            },
            required: ['concluded_value', 'valuation_range_low', 'valuation_range_high', 'confidence_level'],
          },
        },
        required: ['approach_summary', 'final_valuation'],
      },

      // Narratives
      narratives: {
        type: 'object',
        properties: {
          executive_summary: {
            type: 'object',
            properties: {
              word_count_target: { type: 'number' },
              content: { type: 'string', description: 'Comprehensive executive summary, ~800 words' },
            },
          },
          company_overview: {
            type: 'object',
            properties: {
              word_count_target: { type: 'number' },
              content: { type: 'string', description: '~500 words' },
            },
          },
          financial_analysis: {
            type: 'object',
            properties: {
              word_count_target: { type: 'number' },
              content: { type: 'string', description: 'Detailed financial analysis with specific numbers, ~1000 words' },
            },
          },
          industry_analysis: {
            type: 'object',
            properties: {
              word_count_target: { type: 'number' },
              content: { type: 'string', description: '~600 words' },
            },
          },
          risk_assessment: {
            type: 'object',
            properties: {
              word_count_target: { type: 'number' },
              content: { type: 'string', description: '~700 words' },
            },
          },
          asset_approach_narrative: {
            type: 'object',
            properties: {
              word_count_target: { type: 'number' },
              content: { type: 'string', description: '~500 words' },
            },
          },
          income_approach_narrative: {
            type: 'object',
            properties: {
              word_count_target: { type: 'number' },
              content: { type: 'string', description: '~500 words' },
            },
          },
          market_approach_narrative: {
            type: 'object',
            properties: {
              word_count_target: { type: 'number' },
              content: { type: 'string', description: '~500 words' },
            },
          },
          valuation_synthesis_narrative: {
            type: 'object',
            properties: {
              word_count_target: { type: 'number' },
              content: { type: 'string', description: '~600 words' },
            },
          },
          assumptions_and_limiting_conditions: {
            type: 'object',
            properties: {
              word_count_target: { type: 'number' },
              content: { type: 'string', description: '~400 words' },
            },
          },
          value_enhancement_recommendations: {
            type: 'object',
            properties: {
              word_count_target: { type: 'number' },
              content: { type: 'string', description: 'Actionable recommendations, ~500 words' },
            },
          },
        },
        required: ['executive_summary', 'financial_analysis', 'valuation_synthesis_narrative'],
      },

      // Data Quality
      data_quality: {
        type: 'object',
        properties: {
          extraction_confidence: { type: 'string', enum: ['Low', 'Moderate', 'High'] },
          data_completeness_score: { type: 'number', description: 'Percentage 0-100' },
          missing_data_flags: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                impact: { type: 'string' },
                assumption_made: { type: 'string' },
              },
            },
          },
          data_quality_notes: { type: 'string' },
        },
      },

      // Metadata
      metadata: {
        type: 'object',
        properties: {
          documents_analyzed: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                filename: { type: 'string' },
                document_type: { type: 'string' },
                tax_year: { type: 'string' },
                pages: { type: 'number' },
              },
            },
          },
          processing_notes: { type: 'string' },
        },
      },
    },
    required: [
      'schema_version',
      'valuation_date',
      'company_profile',
      'financial_data',
      'normalized_earnings',
      'valuation_approaches',
      'valuation_synthesis',
      'narratives',
      'data_quality',
    ],
  },
};

/**
 * Get all tools for the valuation API call
 */
export function getValuationTools(): Anthropic.Tool[] {
  return [VALUATION_OUTPUT_TOOL];
}
