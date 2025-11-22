// Test script for PDF generation
const fs = require('fs');
const path = require('path');

// Sample report data based on the OpenAI output
const testReport = {
  id: 'test-report-id',
  company_name: 'Test 5 Consulting',
  valuation_amount: 1555200,
  valuation_method: 'Multi-Approach Analysis',
  report_status: 'completed',
  created_at: new Date().toISOString(),
  executive_summary: 'This comprehensive business valuation analysis for Test 5 Consulting reveals a concluded value of $1,555,200. The company demonstrates strong financial performance with consistent revenue growth and healthy profit margins. Key value drivers include strong client retention, high billable hour utilization, and superior gross margins.',
  report_data: {
    executive_summary: 'This comprehensive business valuation analysis for Test 5 Consulting reveals a concluded value of $1,555,200. The company demonstrates strong financial performance with consistent revenue growth and healthy profit margins.',
    company_overview: {
      industry: 'Professional Services - Consulting',
      years_in_business: 10,
      employee_count: 50,
      location: 'United States',
      business_description: 'Consulting firm providing management and business strategy solutions to small and mid-sized enterprises.'
    },
    financial_analysis: {
      key_financial_metrics: {
        revenue: 1450000,
        ebitda: 582500,
        net_income: 290000,
        total_assets: 950000
      },
      historical_financial_data: [
        {
          year: 2020,
          revenue: 1200000,
          ebitda: 480000,
          net_income: 240000,
          gross_margin_percent: 65,
          ebitda_margin_percent: 40,
          net_margin_percent: 20
        },
        {
          year: 2021,
          revenue: 1300000,
          ebitda: 520000,
          net_income: 260000,
          gross_margin_percent: 65,
          ebitda_margin_percent: 40,
          net_margin_percent: 20
        },
        {
          year: 2022,
          revenue: 1450000,
          ebitda: 582500,
          net_income: 290000,
          gross_margin_percent: 65,
          ebitda_margin_percent: 40,
          net_margin_percent: 20
        }
      ]
    },
    valuation_approaches: {
      asset_approach: {
        adjusted_net_asset_value: 390000
      },
      income_approach: {
        income_approach_conclusion: 2430000
      },
      market_approach: {
        weighted_market_value: 1980000
      }
    },
    valuation_reconciliation: {
      approach_weighting: [
        {
          approach: 'Asset Approach',
          indicated_value: 390000,
          weight_assigned: 30,
          weighted_value: 117000
        },
        {
          approach: 'Income Approach',
          indicated_value: 2430000,
          weight_assigned: 50,
          weighted_value: 1215000
        },
        {
          approach: 'Market Approach',
          indicated_value: 1980000,
          weight_assigned: 20,
          weighted_value: 396000
        }
      ]
    },
    risk_assessment: {
      overall_risk_score: 6.5,
      risk_factors: [
        {
          factor: 'Client Concentration',
          severity: 'High',
          description: 'High reliance on a few major clients could impact revenue stability.'
        },
        {
          factor: 'Economic Sensitivity',
          severity: 'Medium',
          description: 'Consulting industry is sensitive to economic cycles.'
        },
        {
          factor: 'Revenue Volatility',
          severity: 'Low',
          description: 'Revenue has been stable with improving trends.'
        }
      ]
    },
    industry_benchmarking: {
      industry_percentile_rankings: {
        revenue_growth_percentile: 75,
        profitability_percentile: 80,
        efficiency_percentile: 70,
        leverage_percentile: 60
      }
    },
    valuation_conclusion: {
      concluded_value: 1555200,
      conclusion_statement: 'Based on a weighted approach reflecting income, asset, and market considerations, the concluded value is $1,555,200. This valuation reflects the company\'s strong financial performance, growth potential, and market position, adjusted for marketability and other relevant factors.'
    },
    recommendations: [
      {
        recommendation: 'Diversify Client Portfolio',
        rationale: 'Reduce dependency on key clients to mitigate revenue concentration risk'
      },
      {
        recommendation: 'Expand Digital Service Offerings',
        rationale: 'Capitalize on growing demand for digital transformation consulting'
      },
      {
        recommendation: 'Optimize Working Capital Management',
        rationale: 'Improve cash flow efficiency and reduce operating costs'
      }
    ]
  }
};

console.log('✅ Test data structure created successfully');
console.log('📊 Company:', testReport.company_name);
console.log('💰 Valuation:', new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(testReport.valuation_amount));
console.log('📈 Historical data points:', testReport.report_data.financial_analysis.historical_financial_data.length);
console.log('⚠️  Risk factors:', testReport.report_data.risk_assessment.risk_factors.length);
console.log('\n✅ PDF generation system is ready to test with this data structure');
console.log('📝 To test: Upload documents in the app and wait for OpenAI analysis to complete');
console.log('📄 Then click "Export PDF" to generate the enhanced report');
