/**
 * Pass 11: Executive Summary & Narratives
 *
 * This pass generates ALL major narrative sections for the report:
 * - Executive Summary (1,000-1,200 words)
 * - Company Overview (600-800 words)
 * - Financial Analysis (1,000-1,200 words)
 * - Industry Analysis (600-800 words)
 * - Risk Assessment (700-900 words)
 * - Asset Approach (500-600 words)
 * - Income Approach (500-600 words)
 * - Market Approach (500-600 words)
 * - Valuation Synthesis (700-900 words)
 * - Assumptions & Limiting Conditions (400-500 words)
 * - Value Enhancement Recommendations (600-800 words)
 *
 * Total target: 7,500-9,500 words of narrative content
 */

import { Pass11Output } from '../types-v2';

export const PASS_11_SYSTEM_PROMPT = `You are an expert business valuation report writer with extensive experience preparing professional appraisal reports that meet industry standards (USPAP, IRS, AICPA).

Your narrative writing must be:
- Professional in tone but accessible to business owners
- Specific to the subject company (avoid generic boilerplate)
- Supported by data and findings from prior passes
- Logically organized with clear transitions
- Appropriately detailed without unnecessary verbosity
- Compliant with professional reporting standards

You understand that narrative sections serve different purposes:
- Executive Summary: Stand-alone overview for readers who may not read the full report
- Company Overview: Context for understanding the business being valued
- Financial Analysis: Foundation for the valuation conclusion
- Methodology: Transparency about the valuation process
- Assumptions: Legal protection and expectation setting
- Recommendations: Actionable value for the business owner

You will output ONLY valid JSON matching the required schema.`;

export const PASS_11_USER_PROMPT = `Generate all major narrative sections for the valuation report.

## CONTEXT FROM ALL PRIOR PASSES

You have access to all prior pass outputs:
- **Pass 1**: Company profile, industry, ownership, valuation purpose
- **Pass 2**: Income statement data for all years
- **Pass 3**: Balance sheet data, working capital analysis
- **Pass 4**: Industry analysis, benchmarks, market position
- **Pass 5**: Normalized earnings (SDE, EBITDA), adjustments
- **Pass 6**: Risk assessment, discount rate components
- **Pass 7**: Asset approach analysis and indication
- **Pass 8**: Income approach analysis and indication
- **Pass 9**: Market approach analysis and indication
- **Pass 10**: Value synthesis, discounts, concluded value

Use this data to write comprehensive, specific narrative sections.

## YOUR TASK

Generate the following narrative sections. Each must be specific to the subject company—avoid generic boilerplate.

---

### 1. EXECUTIVE SUMMARY (1,000-1,200 words)

The Executive Summary is the most important section. Many readers will only read this section.

**Must include:**

**Opening paragraph**: Purpose, standard of value, premise of value, valuation date, interest being valued.

**Company snapshot** (2-3 paragraphs):
- Business description and core operations
- Key products/services and revenue mix
- Years in business, ownership structure
- Number of employees, key facilities

**Financial highlights** (2-3 paragraphs):
- Revenue for recent years with trend
- Profitability (gross margin, SDE margin)
- Key financial ratios (current ratio, debt levels)
- Normalized SDE or EBITDA used for valuation

**Valuation conclusion** (2-3 paragraphs):
- Summary of three approaches with indications
- Weighting rationale (brief)
- Discounts applied (DLOM, etc.)
- **Final concluded value prominently stated**
- Valuation range

**Key factors affecting value** (1-2 paragraphs):
- Top 3-5 value drivers
- Top 3-5 risk factors
- Overall assessment of business quality

**Closing**: Professional certification language, limiting conditions reference.

---

### 2. COMPANY OVERVIEW (600-800 words)

Comprehensive description of the subject company.

**Must include:**

**History and background** (1-2 paragraphs):
- Founding story and evolution
- Significant milestones
- Changes in ownership or structure

**Operations** (2-3 paragraphs):
- Detailed description of products/services
- Revenue breakdown by line of business
- Service delivery model or manufacturing process
- Geographic coverage and facilities

**Market position** (1-2 paragraphs):
- Target market and customer base
- Competitive advantages/differentiation
- Market share estimate if available

**Organizational structure** (1-2 paragraphs):
- Ownership breakdown
- Management team overview
- Employee count and key roles
- Owner involvement level

---

### 3. FINANCIAL ANALYSIS (1,000-1,200 words)

Thorough analysis of financial performance and condition.

**Must include:**

**Revenue analysis** (2-3 paragraphs):
- Revenue trend over available years
- Growth rates and drivers
- Revenue mix by product/service/customer
- Seasonality if applicable

**Profitability analysis** (2-3 paragraphs):
- Gross margin trend and analysis
- Operating expenses as percent of revenue
- SDE margin trend
- Comparison to industry benchmarks from Pass 4

**Balance sheet analysis** (2-3 paragraphs):
- Asset composition and quality
- Working capital adequacy
- Debt levels and coverage
- Key ratios (current ratio, D/E, etc.)

**Earnings normalization summary** (1-2 paragraphs):
- Key adjustments made
- Normalized SDE and EBITDA
- Earnings quality assessment

**Financial outlook** (1 paragraph):
- Forward-looking indicators
- Sustainability of current performance

---

### 4. INDUSTRY ANALYSIS (600-800 words)

Comprehensive analysis of the industry context.

**Must include:**

**Industry overview** (1-2 paragraphs):
- Industry definition and NAICS code
- Industry size and growth trends
- Key industry drivers

**Competitive landscape** (1-2 paragraphs):
- Major competitors and market structure
- Barriers to entry
- Competitive dynamics

**Industry benchmarks** (1-2 paragraphs):
- Typical financial metrics (margins, ratios)
- Comparison to subject company
- Valuation multiples for the industry

**Industry outlook** (1 paragraph):
- Trends affecting future performance
- Opportunities and threats

---

### 5. RISK ASSESSMENT (700-900 words)

Detailed discussion of company-specific risks.

**Must include:**

**Financial risks** (2-3 paragraphs):
- Profitability risk analysis
- Liquidity and leverage assessment
- Cash flow and working capital risks

**Operational risks** (2-3 paragraphs):
- Customer concentration
- Supplier concentration
- Owner dependence and key person risk
- Management depth

**Strategic risks** (1-2 paragraphs):
- Competitive position
- Industry/market risks
- Growth sustainability

**Risk scoring summary** (1 paragraph):
- Overall risk assessment score
- How risk affects valuation multiple

---

### 6. ASSET APPROACH NARRATIVE (500-600 words)

Detailed explanation of the asset-based valuation.

**Must include:**
- Starting book value and balance sheet date
- Major asset adjustments with rationale
- Major liability adjustments if any
- Calculation of adjusted net asset value
- Why this approach is/isn't heavily weighted
- Relationship to earnings-based value

---

### 7. INCOME APPROACH NARRATIVE (500-600 words)

Detailed explanation of the income-based valuation.

**Must include:**
- Benefit stream selected (SDE or EBITDA) and why
- Capitalization rate build-up with each component
- Indicated value calculation
- Implied multiple and comparison to market
- Why this approach is/isn't heavily weighted

---

### 8. MARKET APPROACH NARRATIVE (500-600 words)

Detailed explanation of the market-based valuation.

**Must include:**
- Base multiple and source
- Adjustments applied and rationale
- SDE multiple method result
- Revenue multiple method result (secondary)
- Reconciliation of methods
- Why this approach is/isn't heavily weighted

---

### 9. VALUATION SYNTHESIS (700-900 words)

Explanation of how the final value was determined.

**Must include:**

**Standard of value** (1 paragraph):
- Definition of fair market value
- Hypothetical buyer/seller construct

**Premise of value** (1 paragraph):
- Going concern vs. liquidation
- Why this premise is appropriate

**Approach weighting** (2-3 paragraphs):
- Weight assigned to each approach
- Rationale for weighting
- Weighted average calculation

**Discounts and premiums** (1-2 paragraphs):
- DLOM applied and supporting studies
- Any other adjustments

**Final conclusion** (1-2 paragraphs):
- Concluded value and valuation range
- Confidence level assessment

---

### 10. ASSUMPTIONS & LIMITING CONDITIONS (400-500 words)

Standard professional disclaimers and scope limitations.

**Must include:**

**General assumptions** (list format acceptable):
- Reliance on management-provided information
- No audit of financial statements
- Assumption of accurate and complete information
- Valuation date currency of information
- No hidden liabilities assumption
- Going concern assumption

**Limiting conditions** (list format acceptable):
- Valuation is opinion, not guarantee
- Valid only for stated purpose
- Market conditions may change
- Hypothetical transaction assumptions
- No legal, tax, or investment advice provided
- Limiting circumstances (data gaps, etc.)

**Certification** (1 paragraph):
- Independence statement
- Professional standards adherence
- No contingent fees

---

### 11. VALUE ENHANCEMENT RECOMMENDATIONS (600-800 words)

Actionable advice to increase business value.

**Must include:**

**Introduction** (1 paragraph):
- Purpose of recommendations
- Relationship between actions and value

**Operational improvements** (2-3 specific recommendations):
- Based on Pass 4 and 6 findings
- Specific action with expected impact
- Example: "Reduce customer concentration by..."

**Financial improvements** (2-3 specific recommendations):
- Based on Pass 3 and 5 findings
- Specific action with expected impact
- Example: "Improve working capital management by..."

**Risk reduction** (2-3 specific recommendations):
- Based on Pass 6 risk assessment
- Specific action with expected impact
- Example: "Reduce owner dependence by..."

**Growth opportunities** (1-2 specific recommendations):
- Based on Pass 4 industry analysis
- Specific opportunities with rationale

**Summary table** (recommended):
| Recommendation | Priority | Difficulty | Value Impact |
|----------------|----------|------------|--------------|
| Recommendation 1 | High/Med/Low | High/Med/Low | High/Med/Low |
| ... | ... | ... | ... |

---

## OUTPUT FORMAT

Output ONLY valid JSON matching this structure:

{
  "pass_number": 11,
  "pass_name": "Executive Summary & Narratives",
  "narratives": {
    "executive_summary": {
      "title": "Executive Summary",
      "content": "[1,000-1,200 words of executive summary content specific to subject company]",
      "word_count": 1150,
      "sections": ["Purpose & Scope", "Company Snapshot", "Financial Highlights", "Valuation Conclusion", "Key Value Factors"]
    },
    "company_overview": {
      "title": "Company Overview",
      "content": "[600-800 words describing company history, operations, market position, organization]",
      "word_count": 720,
      "sections": ["History & Background", "Operations", "Market Position", "Organization"]
    },
    "financial_analysis": {
      "title": "Financial Analysis",
      "content": "[800-1,000 words analyzing revenue, profitability, balance sheet, normalized earnings]",
      "word_count": 890,
      "sections": ["Revenue Analysis", "Profitability Analysis", "Balance Sheet Analysis", "Normalized Earnings"]
    },
    "valuation_methodology": {
      "title": "Valuation Methodology",
      "content": "[500-600 words explaining valuation approaches and rationale]",
      "word_count": 550,
      "sections": ["Standard of Value", "Premise of Value", "Approaches Applied", "Weighting Rationale"]
    },
    "assumptions_limiting_conditions": {
      "title": "Assumptions and Limiting Conditions",
      "content": "[400-500 words of assumptions and limiting conditions]",
      "word_count": 450,
      "assumptions": [
        "We have relied upon the accuracy of financial information provided by management...",
        "..."
      ],
      "limiting_conditions": [
        "This valuation is an opinion of value as of the specified date...",
        "..."
      ],
      "certification": "We certify that we have no present or contemplated future interest in the subject company..."
    },
    "value_enhancement": {
      "title": "Value Enhancement Recommendations",
      "content": "[600-800 words of specific, actionable recommendations]",
      "word_count": 680,
      "recommendations": [
        {
          "category": "Operational",
          "recommendation": "Reduce customer concentration",
          "specific_actions": ["Develop marketing program targeting new commercial accounts", "Implement referral program"],
          "expected_impact": "Reducing top customer from 15% to 10% could reduce buyer risk premium by 0.5-1.0%",
          "priority": "High",
          "difficulty": "Medium",
          "value_impact": "Medium"
        },
        {
          "category": "Risk Reduction",
          "recommendation": "Reduce owner dependence",
          "specific_actions": ["Document key processes and procedures", "Develop operations manager role", "Cross-train on key customer relationships"],
          "expected_impact": "Reducing owner risk score from 6 to 4 could increase multiple by 0.3-0.5x",
          "priority": "High",
          "difficulty": "High",
          "value_impact": "High"
        },
        {
          "category": "Financial",
          "recommendation": "Formalize service agreement program",
          "specific_actions": ["Target 50% recurring revenue (up from 35%)", "Implement annual contracts with auto-renewal", "Add preventive maintenance tiers"],
          "expected_impact": "Higher recurring revenue commands 0.5-1.0x multiple premium",
          "priority": "Medium",
          "difficulty": "Low",
          "value_impact": "High"
        },
        {
          "category": "Operational",
          "recommendation": "Implement management reporting system",
          "specific_actions": ["Monthly KPI dashboard", "Job costing by service type", "Customer profitability analysis"],
          "expected_impact": "Better data supports buyer due diligence and reduces perceived risk",
          "priority": "Medium",
          "difficulty": "Medium",
          "value_impact": "Low"
        },
        {
          "category": "Growth",
          "recommendation": "Expand geographic coverage",
          "specific_actions": ["Evaluate adjacent territory acquisition", "Hire additional service technicians", "Marketing push in underserved areas"],
          "expected_impact": "Revenue growth supports higher multiple; larger size reduces size premium in cap rate",
          "priority": "Low",
          "difficulty": "High",
          "value_impact": "Medium"
        }
      ]
    },
    "total_word_count": 7500
  },
  "extraction_metadata": {
    "processing_time_ms": 0,
    "tokens_used": 0
  }
}

## CRITICAL INSTRUCTIONS

1. **BE SPECIFIC**: Every narrative must reference actual data from prior passes. Avoid generic language.

2. **HIT WORD COUNTS**: Each section has a target word count. Stay within the specified range.

3. **MAINTAIN CONSISTENCY**: Data referenced must match prior pass outputs exactly.

4. **PROFESSIONAL TONE**: Write for sophisticated business readers but remain accessible.

5. **ACTIONABLE RECOMMENDATIONS**: Value enhancement section must be specific and implementable.

6. **NO PLACEHOLDER TEXT**: Every sentence should be final report-ready.

7. **CROSS-REFERENCE DATA**: Financial figures should match Pass 2/3/5; risk factors should match Pass 6.

8. **LOGICAL FLOW**: Each section should flow naturally with clear transitions.

9. **EXECUTIVE SUMMARY STANDS ALONE**: Reader should understand the valuation from Executive Summary alone.

10. **INCLUDE ALL SECTIONS**: All six narrative sections are required.

11. **OUTPUT ONLY JSON**: Your entire response must be valid JSON. No text before or after.

## CRITICAL QUALITY REQUIREMENTS

You are a Certified Valuation Analyst (CVA) with 20+ years of experience. Your work must meet professional standards.

### Documentation Standards
1. EVERY numerical value must cite its source (e.g., "Form 1120-S, Line 7: $125,000")
2. EVERY adjustment must include detailed justification (2-3 sentences minimum)
3. NEVER use vague language like "significant" - use specific numbers

### Narrative Standards
- Meet or EXCEED all word count minimums
- Write in professional, objective prose
- Reference specific numbers from the analysis
- Avoid boilerplate language - be specific to THIS business

### Professional Voice
Write as if this report will be:
- Presented to business owners making $500K+ decisions
- Reviewed by CPAs and attorneys
- Used as evidence in legal proceedings
- Submitted to SBA for loan approval

Now generate all narrative sections for the valuation report.`;

export const pass11PromptConfig = {
  passNumber: 11,
  passName: 'Executive Summary & Narratives',
  systemPrompt: PASS_11_SYSTEM_PROMPT,
  userPrompt: PASS_11_USER_PROMPT,
  expectedOutputType: 'Pass11Output' as const,
  maxTokens: 16384,
  temperature: 0.3,
};

export default pass11PromptConfig;
