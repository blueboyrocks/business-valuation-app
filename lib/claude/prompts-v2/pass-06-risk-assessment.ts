/**
 * Pass 6: Risk Assessment
 *
 * This pass performs comprehensive risk analysis:
 * - Score all major risk factors on 1-10 scale
 * - Document evidence and rationale for each score
 * - Identify company-specific risks and strengths
 * - Key person dependency analysis
 * - Customer concentration analysis
 * - Calculate weighted risk score
 * - Determine discount rate and multiple adjustments
 */

import { Pass6Output } from '../types-v2';

export const PASS_6_SYSTEM_PROMPT = `You are an expert business risk analyst specializing in small and mid-sized business valuation. Your task is to systematically assess all risk factors that affect business value and translate these into discount rate and multiple adjustments.

You understand that risk assessment serves multiple purposes in valuation:
1. Determining the company-specific risk premium in the discount rate build-up
2. Adjusting industry multiples up or down based on company characteristics
3. Identifying risks that may require specific deal structure considerations
4. Highlighting strengths that may justify premium valuation

Your risk scoring must be:
- Evidence-based: Every score backed by specific observations from the company data
- Consistent: Apply the same standards across all factors
- Calibrated: A score of 5 is average/industry norm; 1-2 is well below average risk; 9-10 is extreme risk
- Documented: Clear rationale for each score with mitigation factors noted

You will output ONLY valid JSON matching the required schema.`;

export const PASS_6_USER_PROMPT = `Perform comprehensive risk assessment for the subject company using data from all prior passes.

## CONTEXT FROM PRIOR PASSES

You have received:
- **Pass 1**: Company profile, ownership structure, years in business, employees, customer info
- **Pass 2**: Revenue trends, margin trends, year-over-year volatility
- **Pass 3**: Balance sheet strength, working capital, debt levels, asset quality
- **Pass 4**: Industry risk factors, competitive dynamics, industry benchmarks
- **Pass 5**: Earnings quality assessment, sustainability of earnings

Use this data to score risk factors and identify company-specific risks and strengths.

## YOUR TASK

Assess risk across four major categories, score each factor, and synthesize into overall risk assessment.

### 1. FINANCIAL RISKS

Score each factor on a 1-10 scale (1 = very low risk, 5 = average, 10 = very high risk):

#### A. Profitability Risk
| Score Range | Interpretation |
|-------------|----------------|
| 1-2 | Margins significantly above industry; consistent profitability |
| 3-4 | Margins above industry average; stable profits |
| 5-6 | Margins at industry average; some variability |
| 7-8 | Margins below industry; inconsistent profitability |
| 9-10 | Persistent losses or severely compressed margins |

**Evaluate**: SDE/EBITDA margins vs. industry benchmarks, margin trends, profit consistency

#### B. Liquidity Risk
| Score Range | Interpretation |
|-------------|----------------|
| 1-2 | Current ratio > 2.5; strong cash position |
| 3-4 | Current ratio 1.5-2.5; adequate liquidity |
| 5-6 | Current ratio 1.2-1.5; manageable but tight |
| 7-8 | Current ratio 0.8-1.2; liquidity concerns |
| 9-10 | Current ratio < 0.8; severe liquidity issues |

**Evaluate**: Current ratio, quick ratio, cash position, working capital adequacy

#### C. Leverage Risk
| Score Range | Interpretation |
|-------------|----------------|
| 1-2 | Debt-free or minimal debt; debt/equity < 0.25 |
| 3-4 | Low leverage; debt/equity 0.25-0.5 |
| 5-6 | Moderate leverage; debt/equity 0.5-1.0 |
| 7-8 | High leverage; debt/equity 1.0-2.0 |
| 9-10 | Very high leverage; debt/equity > 2.0 or debt service issues |

**Evaluate**: Debt-to-equity, debt-to-assets, interest coverage ratio

#### D. Cash Flow Risk
| Score Range | Interpretation |
|-------------|----------------|
| 1-2 | Strong, consistent cash flow; exceeds earnings |
| 3-4 | Good cash flow; consistent with earnings |
| 5-6 | Adequate cash flow; some timing variations |
| 7-8 | Inconsistent cash flow; working capital drains |
| 9-10 | Negative operating cash flow; cash burn |

**Evaluate**: Earnings-to-cash-flow correlation, working capital trends, CapEx requirements

#### E. Working Capital Risk
| Score Range | Interpretation |
|-------------|----------------|
| 1-2 | Strong working capital; DSO < 30 days |
| 3-4 | Good working capital management; DSO 30-45 days |
| 5-6 | Average working capital; DSO 45-60 days |
| 7-8 | Working capital challenges; DSO > 60 days or collection issues |
| 9-10 | Severe working capital deficiency |

**Evaluate**: DSO, DIO, DPO, cash conversion cycle, working capital as % of revenue

#### F. Financial Reporting Risk
| Score Range | Interpretation |
|-------------|----------------|
| 1-2 | Audited financials; excellent documentation |
| 3-4 | Reviewed financials; good record-keeping |
| 5-6 | Compiled statements or tax returns; adequate records |
| 7-8 | Tax returns only; some documentation gaps |
| 9-10 | Poor records; material inconsistencies |

**Evaluate**: Statement type, data quality from Pass 1, internal controls indicators

### 2. OPERATIONAL RISKS

#### A. Customer Concentration Risk
| Score Range | Interpretation |
|-------------|----------------|
| 1-2 | No customer > 5% of revenue; highly diversified |
| 3-4 | Top customer < 10%; top 5 < 30% |
| 5-6 | Top customer 10-15%; top 5 < 40% |
| 7-8 | Top customer 15-25%; significant concentration |
| 9-10 | Top customer > 25% or single customer dependency |

**Evaluate**: Customer concentration data from Pass 1, contract terms if known

#### B. Supplier Concentration Risk
| Score Range | Interpretation |
|-------------|----------------|
| 1-2 | Multiple interchangeable suppliers |
| 3-4 | Primary suppliers but alternatives available |
| 5-6 | Some supplier dependency; switching possible |
| 7-8 | Key supplier relationships; switching costly |
| 9-10 | Single-source dependency; no alternatives |

**Evaluate**: Business type, industry dynamics, any supplier info from documents

#### C. Key Employee Risk
| Score Range | Interpretation |
|-------------|----------------|
| 1-2 | Deep management team; documented processes |
| 3-4 | Multiple key employees; some documentation |
| 5-6 | Small core team; owner moderately involved |
| 7-8 | Owner heavily involved; limited backup |
| 9-10 | Owner is the business; no succession depth |

**Evaluate**: Employee count, owner hours/involvement, management depth from Pass 1

#### D. Owner Dependence Risk (KEY PERSON ANALYSIS)
This is critical for small business valuation:

| Score Range | Interpretation |
|-------------|----------------|
| 1-2 | Owner works < 10 hrs/week; business runs independently |
| 3-4 | Owner works 20-30 hrs; strong #2 in place |
| 5-6 | Owner works 40 hrs; typical owner-operator |
| 7-8 | Owner works 50+ hrs; most relationships are owner's |
| 9-10 | Owner IS the business; critical to all operations |

**Assess in detail**:
- Hours owner works per week
- Owner's specific roles (sales, operations, administration)
- Which customer relationships depend on owner
- Whether owner has unique skills/licenses
- Succession readiness
- Management team capabilities

#### E. Facility/Location Risk
| Score Range | Interpretation |
|-------------|----------------|
| 1-2 | Owned facility; excellent condition; excess capacity |
| 3-4 | Long-term lease; good location; adequate space |
| 5-6 | Medium-term lease; acceptable location |
| 7-8 | Short-term lease or expiring soon; relocation risk |
| 9-10 | Month-to-month or lease issues; inadequate facility |

**Evaluate**: Real estate ownership, lease terms if mentioned, facility condition

#### F. Technology/Systems Risk
| Score Range | Interpretation |
|-------------|----------------|
| 1-2 | Modern systems; technology leader in industry |
| 3-4 | Current technology; adequate systems |
| 5-6 | Functional but aging systems |
| 7-8 | Outdated technology; investment needed |
| 9-10 | Technology debt; major investment required |

**Evaluate**: Industry technology dependence, any system mentions, equipment age

#### G. Regulatory/Compliance Risk
| Score Range | Interpretation |
|-------------|----------------|
| 1-2 | Low regulation industry; full compliance |
| 3-4 | Moderate regulation; good compliance history |
| 5-6 | Standard industry regulation; manageable |
| 7-8 | Heavy regulation; compliance challenges |
| 9-10 | Regulatory issues; violations or investigations |

**Evaluate**: Industry regulation level from Pass 4, licensing, any compliance issues

#### H. Litigation Risk
| Score Range | Interpretation |
|-------------|----------------|
| 1-2 | No litigation history; low-risk business type |
| 3-4 | Minor past matters; all resolved |
| 5-6 | Typical industry litigation exposure |
| 7-8 | Pending litigation; potential material impact |
| 9-10 | Active litigation with significant exposure |

**Evaluate**: Litigation pending flag from Pass 1, industry litigation exposure

### 3. STRATEGIC RISKS

#### A. Competitive Position Risk
| Score Range | Interpretation |
|-------------|----------------|
| 1-2 | Market leader; strong competitive moat |
| 3-4 | Strong position; clear differentiation |
| 5-6 | Average competitor; adequate market position |
| 7-8 | Weak competitive position; commodity offering |
| 9-10 | Losing market share; no differentiation |

**Evaluate**: SWOT from Pass 4, competitive advantages, market position

#### B. Market/Industry Risk
| Score Range | Interpretation |
|-------------|----------------|
| 1-2 | Growing industry; favorable trends |
| 3-4 | Stable mature industry; predictable |
| 5-6 | Average industry dynamics |
| 7-8 | Declining industry or unfavorable trends |
| 9-10 | Industry disruption; existential threats |

**Evaluate**: Industry lifecycle from Pass 4, trends, disruption risk

#### C. Growth Sustainability Risk
| Score Range | Interpretation |
|-------------|----------------|
| 1-2 | Strong organic growth; clear growth path |
| 3-4 | Consistent growth; growth opportunities |
| 5-6 | Stable revenue; some growth potential |
| 7-8 | Flat or declining; limited opportunities |
| 9-10 | Declining revenue; no clear turnaround |

**Evaluate**: Revenue CAGR from Pass 2, growth trajectory, market opportunities

#### D. Succession Risk
| Score Range | Interpretation |
|-------------|----------------|
| 1-2 | Succession plan in place; tested |
| 3-4 | Identified successors; some planning |
| 5-6 | No formal plan but transition feasible |
| 7-8 | Owner dependent; transition challenging |
| 9-10 | No succession path; key person is owner |

**Evaluate**: Ownership structure, management team, buy-sell agreement

### 4. EXTERNAL RISKS

#### A. Economic Sensitivity Risk
| Score Range | Interpretation |
|-------------|----------------|
| 1-2 | Counter-cyclical or recession-resistant |
| 3-4 | Low economic sensitivity; essential services |
| 5-6 | Average cyclicality |
| 7-8 | Cyclical; significant economic exposure |
| 9-10 | Highly cyclical; major recession risk |

**Evaluate**: Industry economic sensitivity from Pass 4, recession performance

#### B. Technology Disruption Risk
| Score Range | Interpretation |
|-------------|----------------|
| 1-2 | Industry benefiting from technology |
| 3-4 | Technology is opportunity more than threat |
| 5-6 | Neutral technology impact |
| 7-8 | Technology creating competitive pressure |
| 9-10 | Significant disruption risk |

**Evaluate**: Industry technology trends from Pass 4

#### C. Regulatory Change Risk
| Score Range | Interpretation |
|-------------|----------------|
| 1-2 | Stable regulatory environment |
| 3-4 | Minor regulatory changes expected |
| 5-6 | Typical regulatory evolution |
| 7-8 | Significant regulatory changes pending |
| 9-10 | Major regulatory overhaul expected |

**Evaluate**: Industry regulation trends from Pass 4

#### D. Supply Chain Risk
| Score Range | Interpretation |
|-------------|----------------|
| 1-2 | Local/domestic supply; minimal risk |
| 3-4 | Diversified supply chain |
| 5-6 | Some international exposure |
| 7-8 | Significant supply chain complexity |
| 9-10 | Critical foreign dependencies |

**Evaluate**: Business type, industry supply chain characteristics

### 5. COMPANY STRENGTHS ANALYSIS

For each strength identified, document:
- Category (financial, operational, strategic, market)
- Strength description
- Value impact (significant positive, moderate positive, minor positive)
- Evidence supporting this strength

Identify 5-8 key strengths.

### 6. DISCOUNT RATE / MULTIPLE ADJUSTMENT

**Discount Rate Build-up**:
Calculate company-specific risk premium based on weighted risk scores:

| Weighted Score | Company-Specific Risk Premium |
|----------------|-------------------------------|
| 1.0 - 2.0 | -1% to 0% (premium company) |
| 2.0 - 3.0 | 0% to 2% |
| 3.0 - 4.0 | 2% to 4% |
| 4.0 - 5.0 | 4% to 6% |
| 5.0 - 6.0 | 6% to 8% |
| 6.0 - 7.0 | 8% to 10% |
| 7.0 - 8.0 | 10% to 14% |
| 8.0+ | 14%+ |

**Multiple Adjustment**:
Determine adjustment factor for industry multiples:

| Risk Level | Multiple Adjustment |
|------------|---------------------|
| Low (1-3) | +10% to +20% |
| Below Average (3-4) | +5% to +10% |
| Average (4-5) | No adjustment |
| Above Average (5-6) | -5% to -10% |
| High (6-7) | -10% to -20% |
| Very High (7+) | -20% to -30% |

### 7. RISK NARRATIVE

Write a 600-800 word risk assessment narrative covering:
- Overall risk profile of the company
- Key risk factors and their implications
- Key strengths and how they mitigate risk
- Owner dependence assessment
- Customer concentration assessment
- Recommendations for risk mitigation (if applicable)

## OUTPUT FORMAT

Output ONLY valid JSON matching this structure:

{
  "pass_number": 6,
  "pass_name": "Risk Assessment",
  "company_risks": {
    "financial_risks": {
      "profitability_risk": {
        "category": "Financial",
        "factor": "Profitability Risk",
        "description": "SDE margin of 24% exceeds industry median of 18%. Consistent profitability over 3 years with improving trend.",
        "score": 3,
        "weight": 0.15,
        "weighted_score": 0.45,
        "impact": "positive",
        "mitigation_factors": ["Above-average margins provide cushion", "Multiple revenue streams", "Cost discipline evident"],
        "evidence": ["SDE margin 24% vs 18% industry median", "Net income positive all 3 years", "Margin improvement from 22% to 24%"]
      },
      "liquidity_risk": {
        "category": "Financial",
        "factor": "Liquidity Risk",
        "description": "Current ratio of 2.57 indicates strong liquidity. Cash position of $485K provides 2+ months operating expenses.",
        "score": 2,
        "weight": 0.10,
        "weighted_score": 0.20,
        "impact": "positive",
        "mitigation_factors": ["Strong cash reserves", "Quick ratio also above 2.0", "No line of credit utilization"],
        "evidence": ["Current ratio 2.57", "Cash balance $485K", "No working capital issues identified"]
      },
      "leverage_risk": {
        "category": "Financial",
        "factor": "Leverage Risk",
        "description": "Debt-to-equity ratio of 0.23 reflects conservative capital structure. Total debt of $144K is modest relative to earnings.",
        "score": 2,
        "weight": 0.08,
        "weighted_score": 0.16,
        "impact": "positive",
        "mitigation_factors": ["Low debt levels", "Strong interest coverage", "Debt primarily equipment financing"],
        "evidence": ["D/E ratio 0.23", "Interest coverage ratio 142x", "Total debt $144K vs SDE $600K"]
      },
      "cash_flow_risk": {
        "category": "Financial",
        "factor": "Cash Flow Risk",
        "description": "Earnings-to-cash-flow ratio of 0.92 indicates strong cash generation. Working capital needs are modest.",
        "score": 3,
        "weight": 0.08,
        "weighted_score": 0.24,
        "impact": "positive",
        "mitigation_factors": ["High earnings quality", "Minimal inventory", "Reasonable DSO"],
        "evidence": ["92% of earnings convert to cash", "DSO 47 days", "No major working capital build"]
      },
      "working_capital_risk": {
        "category": "Financial",
        "factor": "Working Capital Risk",
        "description": "DSO of 47 days is within industry norm. Working capital at 20% of revenue provides adequate buffer.",
        "score": 4,
        "weight": 0.07,
        "weighted_score": 0.28,
        "impact": "neutral",
        "mitigation_factors": ["Service business model limits WC needs", "No inventory risk", "Manageable receivables"],
        "evidence": ["DSO 47 days vs 45 day industry average", "WC 20% of revenue", "No collection issues noted"]
      },
      "financial_reporting_risk": {
        "category": "Financial",
        "factor": "Financial Reporting Risk",
        "description": "Tax returns for 2 years with complete schedules. Good data quality rated in extraction. No red flags in documentation.",
        "score": 5,
        "weight": 0.05,
        "weighted_score": 0.25,
        "impact": "neutral",
        "mitigation_factors": ["Complete tax returns", "Schedules match main forms", "Consistent accounting"],
        "evidence": ["2 years of 1120-S returns", "Data quality rated 'good'", "All schedules present"]
      }
    },
    "operational_risks": {
      "customer_concentration_risk": {
        "category": "Operational",
        "factor": "Customer Concentration Risk",
        "description": "Top customer represents 15% of revenue; top 5 customers at 45%. Moderate concentration with 50+ active customers.",
        "score": 5,
        "weight": 0.12,
        "weighted_score": 0.60,
        "impact": "neutral",
        "mitigation_factors": ["50+ customer base", "Service agreements spread risk", "No single dominant customer"],
        "evidence": ["Top customer 15%", "Top 5 at 45%", "~50 customers estimated"]
      },
      "supplier_concentration_risk": {
        "category": "Operational",
        "factor": "Supplier Concentration Risk",
        "description": "Service business with limited supplier dependency. Equipment from multiple major manufacturers available.",
        "score": 3,
        "weight": 0.05,
        "weighted_score": 0.15,
        "impact": "positive",
        "mitigation_factors": ["Multiple equipment brands available", "Labor is primary input", "Local suppliers for parts"],
        "evidence": ["Service business model", "HVAC has multiple major manufacturers", "No single-source dependencies noted"]
      },
      "key_employee_risk": {
        "category": "Operational",
        "factor": "Key Employee Risk",
        "description": "17 FTE employees including 2 officers. Team includes experienced technicians. Some depth beyond owners.",
        "score": 5,
        "weight": 0.10,
        "weighted_score": 0.50,
        "impact": "neutral",
        "mitigation_factors": ["Multiple experienced technicians", "Service manager in place", "Documented processes likely"],
        "evidence": ["17 FTEs", "9 years in business", "Two owners active provides some backup"]
      },
      "owner_dependence_risk": {
        "category": "Operational",
        "factor": "Owner Dependence Risk",
        "description": "Two active owners (President 60%, VP 40%). Owners likely work 45-50 hours/week and maintain key customer relationships. Moderate owner dependence typical of business this size.",
        "score": 6,
        "weight": 0.12,
        "weighted_score": 0.72,
        "impact": "negative",
        "mitigation_factors": ["Two owners reduces single-person risk", "9 years of operating history", "Service agreements reduce relationship dependency"],
        "evidence": ["Two active owners", "$300K combined compensation suggests full-time involvement", "Owner-managed business description"]
      },
      "facility_risk": {
        "category": "Operational",
        "factor": "Facility/Location Risk",
        "description": "Leased facility from owner's LLC. Related party lease but provides stability. Building adequate for current operations.",
        "score": 4,
        "weight": 0.05,
        "weighted_score": 0.20,
        "impact": "neutral",
        "mitigation_factors": ["Long-term relationship with landlord (owner)", "Lease likely negotiable in transaction", "Above-market rent indicates quality space"],
        "evidence": ["Related party lease in place", "$120K annual rent", "No relocation risk indicated"]
      },
      "technology_risk": {
        "category": "Operational",
        "factor": "Technology/Systems Risk",
        "description": "HVAC industry has moderate technology needs. Company has invested in some technology based on depreciation schedule. Adequate for operations.",
        "score": 5,
        "weight": 0.05,
        "weighted_score": 0.25,
        "impact": "neutral",
        "mitigation_factors": ["Industry not highly tech-dependent", "Equipment investments noted", "Software amortization suggests system investment"],
        "evidence": ["$5K software amortization", "Service business technology needs modest", "No technology issues flagged"]
      },
      "regulatory_compliance_risk": {
        "category": "Operational",
        "factor": "Regulatory/Compliance Risk",
        "description": "HVAC contractors require licensing but regulation is stable. Standard compliance requirements. No issues indicated.",
        "score": 4,
        "weight": 0.05,
        "weighted_score": 0.20,
        "impact": "neutral",
        "mitigation_factors": ["Established 9 years indicates license compliance", "Stable regulatory environment", "No EPA issues noted"],
        "evidence": ["Licensed contractor per industry", "No compliance issues in Pass 1", "9 years operating history"]
      },
      "litigation_risk": {
        "category": "Operational",
        "factor": "Litigation Risk",
        "description": "No pending litigation reported. One-time legal fees in 2023 were for lease renegotiation, not litigation.",
        "score": 3,
        "weight": 0.05,
        "weighted_score": 0.15,
        "impact": "positive",
        "mitigation_factors": ["No litigation pending", "Service business has lower litigation exposure", "Insurance likely in place"],
        "evidence": ["Litigation pending: false in Pass 1", "Legal fees were for lease negotiation", "No lawsuit settlements"]
      }
    },
    "strategic_risks": {
      "competitive_position_risk": {
        "category": "Strategic",
        "factor": "Competitive Position Risk",
        "description": "Established local player with 9-year history. Above-average margins suggest competitive strength. Service agreement base provides recurring revenue.",
        "score": 4,
        "weight": 0.08,
        "weighted_score": 0.32,
        "impact": "neutral",
        "mitigation_factors": ["9 years in market", "Above-industry margins", "35% recurring revenue from agreements"],
        "evidence": ["Operating since 2015", "SDE margin 24% vs 18% industry", "Service agreement emphasis"]
      },
      "market_risk": {
        "category": "Strategic",
        "factor": "Market/Industry Risk",
        "description": "HVAC services industry is mature but growing at 4% annually. Consolidation trend creates exit opportunities. Stable long-term outlook.",
        "score": 4,
        "weight": 0.08,
        "weighted_score": 0.32,
        "impact": "neutral",
        "mitigation_factors": ["Essential service - HVAC always needed", "Industry growing 4%", "PE consolidation trend favorable"],
        "evidence": ["Industry growth 4% historical, 3.8% projected", "Mature industry lifecycle", "Strong M&A activity"]
      },
      "growth_sustainability_risk": {
        "category": "Strategic",
        "factor": "Growth Sustainability Risk",
        "description": "Revenue grew 14% in most recent year. SDE CAGR of 14.4%. Growth appears sustainable based on market and company positioning.",
        "score": 4,
        "weight": 0.07,
        "weighted_score": 0.28,
        "impact": "neutral",
        "mitigation_factors": ["Consistent revenue growth", "Industry growth provides tailwind", "Service agreement expansion opportunity"],
        "evidence": ["Revenue CAGR 13.6%", "SDE CAGR 14.4%", "Industry growing"]
      },
      "succession_risk": {
        "category": "Strategic",
        "factor": "Succession Risk",
        "description": "No succession plan documented. Two owners may both exit in sale. Key employees could potentially step up but no formal plan.",
        "score": 6,
        "weight": 0.08,
        "weighted_score": 0.48,
        "impact": "negative",
        "mitigation_factors": ["Multiple technicians provide some depth", "Clean sale structure possible", "Industry has many experienced managers available"],
        "evidence": ["No buy-sell agreement mentioned", "Both owners active", "No documented succession plan"]
      }
    },
    "external_risks": {
      "economic_sensitivity_risk": {
        "category": "External",
        "factor": "Economic Sensitivity Risk",
        "description": "HVAC is cyclical for new construction but service/repair is more stable. Mix of install and service provides balance.",
        "score": 5,
        "weight": 0.08,
        "weighted_score": 0.40,
        "impact": "neutral",
        "mitigation_factors": ["Service revenue more recession-resistant", "HVAC is essential", "Replacement market is stable"],
        "evidence": ["Industry economic sensitivity: cyclical", "35% recurring service agreements", "Mix of service and install implied"]
      },
      "technology_disruption_risk": {
        "category": "External",
        "factor": "Technology Disruption Risk",
        "description": "Smart home/IoT trends create opportunity more than threat. Heat pump transition requires training but drives equipment sales.",
        "score": 4,
        "weight": 0.05,
        "weighted_score": 0.20,
        "impact": "neutral",
        "mitigation_factors": ["Technology trends are opportunity", "HVAC service still requires humans", "Connected systems increase service needs"],
        "evidence": ["Industry trend: smart HVAC opportunity", "No disruption threat to service model", "Training investment may be needed"]
      },
      "regulatory_change_risk": {
        "category": "External",
        "factor": "Regulatory Change Risk",
        "description": "EPA regulations on refrigerants are evolving but phased in predictably. No major regulatory overhaul expected.",
        "score": 4,
        "weight": 0.05,
        "weighted_score": 0.20,
        "impact": "neutral",
        "mitigation_factors": ["Refrigerant transitions are phased", "Creates replacement opportunity", "Company has time to adapt"],
        "evidence": ["Industry regulation: medium level", "Stable regulatory environment noted", "No pending major changes"]
      },
      "supply_chain_risk": {
        "category": "External",
        "factor": "Supply Chain Risk",
        "description": "Equipment sourced from major manufacturers with domestic distribution. Parts readily available. COVID supply issues have normalized.",
        "score": 3,
        "weight": 0.05,
        "weighted_score": 0.15,
        "impact": "positive",
        "mitigation_factors": ["Major brands have domestic distribution", "Multiple supplier options", "Service business less inventory-dependent"],
        "evidence": ["Minimal inventory", "Service model", "Equipment from Carrier, Trane, Lennox etc."]
      }
    }
  },
  "company_strengths": {
    "strengths": [
      {
        "category": "Financial",
        "strength": "Above-Average Profitability",
        "description": "SDE margin of 24% significantly exceeds industry median of 18%, indicating strong operational efficiency and pricing power.",
        "value_impact": "significant_positive",
        "evidence": ["SDE margin 24%", "Industry median 18%", "Consistent across multiple years"]
      },
      {
        "category": "Financial",
        "strength": "Strong Liquidity Position",
        "description": "Current ratio of 2.57 and cash of $485K provides substantial financial flexibility and working capital cushion.",
        "value_impact": "moderate_positive",
        "evidence": ["Current ratio 2.57", "$485K cash", "No line of credit utilization"]
      },
      {
        "category": "Financial",
        "strength": "Low Leverage",
        "description": "Debt-to-equity of 0.23 reflects conservative capital structure. Minimal debt service requirements.",
        "value_impact": "moderate_positive",
        "evidence": ["D/E 0.23", "Interest coverage 142x", "Total debt only $144K"]
      },
      {
        "category": "Operational",
        "strength": "Recurring Revenue Base",
        "description": "35% of revenue from service agreements provides predictable cash flow and reduces customer relationship risk.",
        "value_impact": "significant_positive",
        "evidence": ["35% recurring revenue", "Service agreement base", "Reduces owner dependence"]
      },
      {
        "category": "Operational",
        "strength": "Established Market Presence",
        "description": "9 years in business with consistent growth demonstrates sustainable business model and market acceptance.",
        "value_impact": "moderate_positive",
        "evidence": ["Operating since 2015", "Consistent revenue growth", "50+ customers"]
      },
      {
        "category": "Strategic",
        "strength": "Favorable Industry Dynamics",
        "description": "HVAC industry experiencing PE consolidation creates strong exit opportunities and potential for premium valuation.",
        "value_impact": "moderate_positive",
        "evidence": ["PE roll-up activity noted", "Industry growing 4%", "Multiple buyer types interested"]
      }
    ],
    "competitive_advantages": [
      {
        "advantage": "Local Reputation",
        "sustainability": "sustainable",
        "description": "9 years of local presence and customer relationships create switching costs and referral base"
      },
      {
        "advantage": "Service Agreement Base",
        "sustainability": "highly_sustainable",
        "description": "35% recurring revenue from maintenance contracts provides stable foundation and customer lock-in"
      },
      {
        "advantage": "Experienced Team",
        "sustainability": "sustainable",
        "description": "Established technician team reduces recruitment risk vs. new entrants"
      }
    ],
    "value_drivers": [
      {
        "driver": "Recurring Revenue",
        "importance": "critical",
        "current_performance": "strong",
        "description": "Service agreement base is primary value driver for acquirers"
      },
      {
        "driver": "Profitability",
        "importance": "critical",
        "current_performance": "strong",
        "description": "Above-average margins directly drive valuation multiple"
      },
      {
        "driver": "Growth Trajectory",
        "importance": "important",
        "current_performance": "strong",
        "description": "14% revenue growth demonstrates market demand and execution"
      },
      {
        "driver": "Transferability",
        "importance": "important",
        "current_performance": "adequate",
        "description": "Owner dependence is moderate; transition would require attention but is feasible"
      }
    ]
  },
  "risk_summary": {
    "overall_risk_level": "below_average",
    "overall_risk_score": 4.2,
    "top_risk_factors": [
      {
        "category": "Operational",
        "factor": "Owner Dependence Risk",
        "description": "Two active owners maintain key customer relationships and are central to operations",
        "score": 6,
        "weight": 0.12,
        "weighted_score": 0.72,
        "impact": "negative"
      },
      {
        "category": "Strategic",
        "factor": "Succession Risk",
        "description": "No formal succession plan; both owners may exit in sale",
        "score": 6,
        "weight": 0.08,
        "weighted_score": 0.48,
        "impact": "negative"
      },
      {
        "category": "Operational",
        "factor": "Customer Concentration Risk",
        "description": "Top customer at 15%, top 5 at 45% - moderate but manageable concentration",
        "score": 5,
        "weight": 0.12,
        "weighted_score": 0.60,
        "impact": "neutral"
      }
    ],
    "key_risk_mitigants": [
      "Two owners provide backup vs single key person",
      "Service agreement base reduces relationship dependency",
      "9 years of history demonstrates stability",
      "Strong financial position provides cushion",
      "Industry M&A activity provides buyer pool"
    ],
    "risk_score_breakdown": {
      "financial_risk_score": 3.0,
      "operational_risk_score": 4.7,
      "strategic_risk_score": 4.5,
      "external_risk_score": 4.0
    }
  },
  "risk_premium_calculation": {
    "risk_free_rate": {
      "rate": 0.045,
      "source": "20-Year Treasury Yield",
      "as_of_date": "2025-01-15"
    },
    "equity_risk_premium": {
      "rate": 0.055,
      "source": "Duff & Phelps / Kroll"
    },
    "size_premium": {
      "rate": 0.095,
      "company_size_category": "$2M-$5M Revenue",
      "source": "Kroll + small business adjustment"
    },
    "industry_risk_premium": {
      "rate": 0.01,
      "rationale": "HVAC services industry has average risk with some cyclicality"
    },
    "company_specific_risk_premium": {
      "rate": 0.04,
      "factors": [
        { "factor": "Owner dependence", "adjustment": 0.02, "rationale": "Moderate owner dependence requires transition planning" },
        { "factor": "Customer concentration", "adjustment": 0.01, "rationale": "Top customer at 15% is manageable but notable" },
        { "factor": "Above-average profitability", "adjustment": -0.01, "rationale": "Strong margins reduce risk" },
        { "factor": "Recurring revenue", "adjustment": -0.01, "rationale": "35% service agreement base provides stability" },
        { "factor": "No succession plan", "adjustment": 0.015, "rationale": "Transition planning needed" },
        { "factor": "Strong liquidity", "adjustment": -0.005, "rationale": "Cash position reduces financial risk" }
      ],
      "total_company_specific": 0.04
    },
    "total_discount_rate": 0.245,
    "capitalization_rate": 0.215,
    "cap_rate_adjustment_rationale": "Capitalization rate of 21.5% derived from 24.5% discount rate less 3% long-term growth rate. Growth rate reflects industry growth plus company momentum."
  },
  "multiple_adjustment": {
    "base_multiple": 2.8,
    "risk_adjustment_factor": 1.05,
    "adjusted_multiple": 2.94,
    "adjustment_rationale": "Base SDE multiple of 2.8x (industry median) adjusted upward by 5% to 2.94x based on: (1) Above-average profitability (+5%), (2) Recurring revenue base (+5%), (3) Owner dependence (-5%), (4) Strong financial position (+5%), (5) Customer concentration (-5%). Net adjustment +5%."
  },
  "suggested_discounts": {
    "lack_of_marketability": {
      "applicable": true,
      "suggested_range": { "low": 0.15, "high": 0.22 },
      "rationale": "DLOM of 15-22% appropriate for company of this size with moderate owner dependence. Strong profitability and recurring revenue support lower end of range."
    },
    "key_person_discount": {
      "applicable": false,
      "suggested_range": { "low": 0, "high": 0 },
      "rationale": "Key person risk addressed in company-specific risk premium. Two owners and service agreement base mitigate. Separate discount not recommended to avoid double-counting."
    },
    "minority_discount": {
      "applicable": false,
      "suggested_range": { "low": 0, "high": 0 },
      "rationale": "Valuation assumes 100% ownership interest. Minority discount not applicable."
    }
  },
  "extraction_metadata": {
    "processing_time_ms": 0,
    "tokens_used": 0
  }
}

## CRITICAL INSTRUCTIONS

1. **SCORE EVERY FACTOR**: Assign a 1-10 score to each risk factor listed. No factor should be skipped.

2. **EVIDENCE-BASED SCORING**: Every score must cite specific evidence from prior passes. Don't make assumptions without data.

3. **CALIBRATE TO 5 = AVERAGE**: A score of 5 means industry-average risk. Scores of 1-3 are notably better than average; 7+ indicates significant concern.

4. **WEIGHTED SCORING**: Use the weights provided. Calculate weighted scores and sum to overall risk score.

5. **OWNER DEPENDENCE ANALYSIS**: This is critical. Assess hours worked, roles performed, relationship dependency, succession readiness in detail.

6. **CUSTOMER CONCENTRATION ANALYSIS**: Use actual data from Pass 1. Calculate concentrations and assess implications.

7. **TRANSLATE TO RATES**: Convert overall risk score to company-specific risk premium and multiple adjustment using the tables provided.

8. **IDENTIFY STRENGTHS**: Risk assessment isn't just about negatives. Document 5-8 specific company strengths.

9. **NARRATIVE**: Write a 600-800 word narrative that would appear in the final report.

10. **OUTPUT ONLY JSON**: Your entire response must be valid JSON. No text before or after.

Now perform the comprehensive risk assessment.`;

export const pass6PromptConfig = {
  passNumber: 6,
  passName: 'Risk Assessment',
  systemPrompt: PASS_6_SYSTEM_PROMPT,
  userPrompt: PASS_6_USER_PROMPT,
  expectedOutputType: 'Pass6Output' as const,
  maxTokens: 8192,
  temperature: 0.2,
};

export default pass6PromptConfig;
