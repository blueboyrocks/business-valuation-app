/**
 * Pass 12: Quality Review & Error Correction
 *
 * This is the CRITICAL quality control pass that:
 * - Verifies ALL mathematical calculations
 * - Checks consistency across all passes
 * - Verifies narrative quality and word counts
 * - Checks logical coherence
 * - Identifies errors or inconsistencies
 * - Produces corrected final output if needed
 * - Assigns quality scores for each dimension
 */

import { Pass12Output } from '../types-v2';

export const PASS_12_SYSTEM_PROMPT = `You are an expert quality control reviewer for business valuation reports. Your role is to ensure the valuation meets professional standards before delivery.

Your review must be:
- Meticulous in checking mathematical accuracy
- Thorough in verifying cross-pass consistency
- Critical in evaluating logical coherence
- Honest in identifying issues and gaps
- Constructive in providing corrections

You understand that quality control is the final safeguard against:
- Mathematical errors that undermine credibility
- Inconsistencies that confuse readers
- Logical gaps that weaken the conclusion
- Missing information that creates liability
- Narrative errors that appear unprofessional

A quality report is one where:
- All numbers tie out and are mathematically correct
- All cross-references are consistent
- The conclusion logically follows from the analysis
- The narrative is clear, professional, and error-free
- All professional standards requirements are met

You will output ONLY valid JSON matching the required schema.`;

export const PASS_12_USER_PROMPT = `Perform comprehensive quality review of the complete valuation report.

## CONTEXT: COMPLETE VALUATION DATA

You have access to all 11 prior pass outputs:
- **Pass 1**: Document classification, company profile
- **Pass 2**: Income statement extraction
- **Pass 3**: Balance sheet extraction
- **Pass 4**: Industry analysis
- **Pass 5**: Earnings normalization
- **Pass 6**: Risk assessment
- **Pass 7**: Asset approach
- **Pass 8**: Income approach
- **Pass 9**: Market approach
- **Pass 10**: Value synthesis
- **Pass 11**: Narratives

Your task is to review EVERYTHING for accuracy, consistency, and quality.

## YOUR TASK

### 1. MATHEMATICAL VERIFICATION

Check ALL calculations across all passes:

#### A. Income Statement Checks
\`\`\`
[ ] Revenue figures consistent across Pass 2, 5, 8, 9, 11
[ ] Gross profit = Revenue - COGS
[ ] Operating income = Gross profit - Operating expenses
[ ] Net income = Operating income - Other income/expenses - Taxes
[ ] Growth rate calculations correct (Year-over-year)
[ ] Percentage calculations correct (margins, ratios)
\`\`\`

#### B. Balance Sheet Checks
\`\`\`
[ ] Assets = Liabilities + Equity
[ ] Working capital = Current assets - Current liabilities
[ ] Current ratio = Current assets / Current liabilities
[ ] Debt-to-equity = Total debt / Total equity
[ ] All ratios calculated correctly
\`\`\`

#### C. Earnings Normalization Checks
\`\`\`
[ ] SDE = Net income + Owner compensation + Add-backs - Subtractions
[ ] EBITDA = Net income + Interest + Taxes + Depreciation + Amortization
[ ] Weighted average calculated correctly (weights sum to 100%)
[ ] Each add-back supported by documentation
\`\`\`

#### D. Valuation Calculations
\`\`\`
[ ] Asset approach: Book value + Adjustments = Adjusted NAV
[ ] Income approach: Benefit stream / Cap rate = Indicated value
[ ] Cap rate = Discount rate - Growth rate
[ ] Discount rate = Sum of all components
[ ] Market approach: SDE × Multiple = Indicated value
[ ] Multiple adjustments calculated correctly
\`\`\`

#### E. Synthesis Calculations
\`\`\`
[ ] Approach weights sum to 100%
[ ] Weighted value = Σ(Indicated value × Weight)
[ ] DLOM calculated correctly
[ ] Final value = Preliminary - DLOM - DLOC ± Adjustments
[ ] Value range calculated correctly (±X%)
\`\`\`

**Document every calculation verified and any errors found.**

### 2. CONSISTENCY CHECKS

Verify data consistency across all passes:

#### A. Company Information
\`\`\`
[ ] Company name consistent across all passes
[ ] Industry classification consistent
[ ] Years in business consistent
[ ] Ownership structure consistent
[ ] Valuation date consistent
\`\`\`

#### B. Financial Data
\`\`\`
[ ] Revenue figures match between passes 2, 5, 8, 9, 10, 11
[ ] SDE figures match between passes 5, 8, 9, 10, 11
[ ] EBITDA figures match between passes 5, 8, 10, 11
[ ] Working capital figures match between passes 3, 8, 10
[ ] Asset values match between passes 3, 7, 10
\`\`\`

#### C. Rates and Multiples
\`\`\`
[ ] Risk-free rate consistent between passes 6, 8
[ ] Size premium consistent between passes 6, 8
[ ] Capitalization rate consistent between passes 6, 8, 10
[ ] SDE multiple consistent between passes 4, 9, 10
\`\`\`

#### D. Risk Assessment
\`\`\`
[ ] Risk scores in Pass 6 align with adjustments in Pass 8, 9
[ ] CSRP factors in Pass 8 match risk assessment in Pass 6
[ ] Multiple adjustments in Pass 9 align with risk factors in Pass 6
\`\`\`

#### E. Value Conclusions
\`\`\`
[ ] Indicated values in Pass 10 match conclusions from Pass 7, 8, 9
[ ] Final value in Pass 10 properly flows to Pass 11 narrative
[ ] Value range in Pass 10 is reasonable (±15-25%)
\`\`\`

**Document every inconsistency found.**

### 3. LOGICAL COHERENCE

Evaluate whether the analysis makes sense:

#### A. Does the Value Make Sense?
\`\`\`
[ ] Final value is reasonable multiple of SDE (typically 2-5x for small businesses)
[ ] Final value is reasonable multiple of revenue (typically 0.5-1.5x)
[ ] Final value is supportable given risk profile
[ ] Higher-risk business → lower multiple (and vice versa)
[ ] Profitable business → income approach weighted appropriately
\`\`\`

#### B. Do the Approaches Align?
\`\`\`
[ ] If approaches diverge significantly, is it explained?
[ ] Asset approach providing floor value for operating business?
[ ] Income approach reasonable for profitable business?
[ ] Market approach consistent with industry benchmarks?
\`\`\`

#### C. Are Discounts Appropriate?
\`\`\`
[ ] DLOM level appropriate for controlling vs. minority interest?
[ ] DLOM supported by cited studies?
[ ] DLOC applied only if minority interest?
[ ] Other adjustments properly supported?
\`\`\`

#### D. Does the Narrative Support the Conclusion?
\`\`\`
[ ] Executive summary conclusion matches Pass 10?
[ ] Risk factors in narrative match Pass 6 assessment?
[ ] Financial analysis supports the earnings used in valuation?
[ ] Methodology section accurately describes what was done?
\`\`\`

**Document any logical issues found.**

### 4. NARRATIVE QUALITY REVIEW

Evaluate each narrative section:

#### A. Word Count Verification
| Section | Target | Actual | Pass/Fail |
|---------|--------|--------|-----------|
| Executive Summary | 1000-1200 | XXX | [ ] |
| Company Overview | 600-800 | XXX | [ ] |
| Financial Analysis | 800-1000 | XXX | [ ] |
| Valuation Methodology | 500-600 | XXX | [ ] |
| Assumptions | 400-500 | XXX | [ ] |
| Value Enhancement | 600-800 | XXX | [ ] |

#### B. Content Quality
For each section, assess:
- **Specificity**: Does it reference actual company data?
- **Accuracy**: Are all facts and figures correct?
- **Clarity**: Is it well-organized and easy to follow?
- **Completeness**: Are all required elements present?
- **Professionalism**: Is the tone appropriate?

Grade each section: A (excellent), B (good), C (acceptable), D (needs revision), F (fail)

### 5. PROFESSIONAL STANDARDS COMPLIANCE

\`\`\`
[ ] Valuation date clearly stated
[ ] Standard of value defined (Fair Market Value)
[ ] Premise of value stated (Going Concern)
[ ] Purpose of valuation stated
[ ] Interest being valued specified (100%, minority, etc.)
[ ] Assumptions and limiting conditions present
[ ] Independence statement included
[ ] Data sources cited throughout
\`\`\`

### 5.5. FINAL OUTPUT SCHEMA VALIDATION (OUTPUT_SCHEMA.md v2.0)

Verify the final report can be transformed to match the authoritative output schema:

#### A. Required Top-Level Fields
\`\`\`
[ ] schema_version: "2.0" present
[ ] valuation_date: YYYY-MM-DD format
[ ] generated_at: ISO-8601 timestamp
[ ] company_profile: All required fields populated
[ ] financial_data: At least one income statement and balance sheet
[ ] normalized_earnings: SDE and EBITDA calculations complete
[ ] industry_analysis: Benchmarks and multiples present
[ ] risk_assessment: Overall rating and risk factors present
[ ] kpi_analysis: Profitability, liquidity, efficiency metrics
[ ] valuation_approaches: All three approaches calculated
[ ] valuation_synthesis: Final value with range
[ ] narratives: All 11 narrative sections present
[ ] data_quality: Extraction confidence and completeness score
[ ] metadata: Documents analyzed and processing notes
\`\`\`

#### B. Critical Schema Rules
\`\`\`
[ ] Approach weights sum to exactly 1.0 (100%)
[ ] valuation_range_low < concluded_value < valuation_range_high
[ ] concluded_value >= adjusted_net_asset_value (valuation floor)
[ ] All monetary values are numbers (not formatted strings)
[ ] All percentages expressed as decimals (0.15, not "15%")
\`\`\`

#### C. Narrative Word Count Targets (must be within 80% of target)
| Section | Target Words | Minimum Acceptable |
|---------|-------------|-------------------|
| executive_summary | 800 | 640 |
| company_overview | 500 | 400 |
| financial_analysis | 1000 | 800 |
| industry_analysis | 600 | 480 |
| risk_assessment | 700 | 560 |
| asset_approach_narrative | 500 | 400 |
| income_approach_narrative | 500 | 400 |
| market_approach_narrative | 500 | 400 |
| valuation_synthesis_narrative | 600 | 480 |
| assumptions_and_limiting_conditions | 400 | 320 |
| value_enhancement_recommendations | 500 | 400 |

**Document any schema validation issues found.**

### 6. ERROR CLASSIFICATION

Classify any errors found:

| Error Type | Severity | Impact | Pass Affected |
|------------|----------|--------|---------------|
| Mathematical error | Critical/Major/Minor | High/Medium/Low | Pass X |
| Inconsistency | Critical/Major/Minor | High/Medium/Low | Pass X, Y |
| Missing data | Critical/Major/Minor | High/Medium/Low | Pass X |
| Narrative error | Critical/Major/Minor | High/Medium/Low | Pass X |
| Logical gap | Critical/Major/Minor | High/Medium/Low | Pass X |

**Severity definitions:**
- **Critical**: Would cause rejection; must be fixed
- **Major**: Significantly impacts credibility; should be fixed
- **Minor**: Noticeable but doesn't affect conclusion; nice to fix

### 7. CORRECTIONS

If errors are found, provide corrections:

For each error:
1. **Location**: Which pass, which field
2. **Current value**: What is currently there
3. **Corrected value**: What it should be
4. **Rationale**: Why this is the correct value

### 8. QUALITY SCORES

Assign quality grades:

| Dimension | Grade (A-F) | Score (0-100) | Notes |
|-----------|-------------|---------------|-------|
| Mathematical Accuracy | X | XX | |
| Data Consistency | X | XX | |
| Logical Coherence | X | XX | |
| Narrative Quality | X | XX | |
| Professional Standards | X | XX | |
| **Overall Quality** | **X** | **XX** | |

**Grade definitions:**
- A (90-100): Excellent, ready for delivery
- B (80-89): Good, minor improvements possible
- C (70-79): Acceptable, some revisions recommended
- D (60-69): Below standard, significant revision needed
- F (<60): Unacceptable, major rework required

### 9. FINAL RECOMMENDATION

Based on review, recommend:
- **APPROVE**: Ready for delivery as-is
- **APPROVE WITH NOTES**: Ready but note minor issues
- **REVISE**: Needs corrections before delivery
- **REJECT**: Needs significant rework

## OUTPUT FORMAT

Output ONLY valid JSON matching this structure:

{
  "pass_number": 12,
  "pass_name": "Quality Review & Error Correction",
  "quality_review": {
    "mathematical_verification": {
      "calculations_verified": 47,
      "errors_found": 0,
      "checks": [
        {
          "category": "Income Statement",
          "check": "Revenue consistency across passes",
          "status": "pass",
          "details": "Revenue of $2,500,000 consistent in Pass 2, 5, 8, 9, 11"
        },
        {
          "category": "Income Statement",
          "check": "Gross profit calculation",
          "status": "pass",
          "details": "GP $875,000 = Revenue $2,500,000 - COGS $1,625,000 ✓"
        },
        {
          "category": "Balance Sheet",
          "check": "Assets = Liabilities + Equity",
          "status": "pass",
          "details": "$1,234,567 = $456,789 + $777,778 ✓"
        },
        {
          "category": "Earnings Normalization",
          "check": "SDE calculation",
          "status": "pass",
          "details": "SDE $569,388 = Net Income + Adjustments, all add-backs documented"
        },
        {
          "category": "Valuation",
          "check": "Capitalization rate build-up",
          "status": "pass",
          "details": "Cap rate 21.5% = Discount 24.5% - Growth 3.0% ✓"
        },
        {
          "category": "Valuation",
          "check": "Income approach value",
          "status": "pass",
          "details": "$2,648,316 = $569,388 / 0.215 ✓"
        },
        {
          "category": "Synthesis",
          "check": "Weights sum to 100%",
          "status": "pass",
          "details": "15% + 45% + 40% = 100% ✓"
        },
        {
          "category": "Synthesis",
          "check": "DLOM calculation",
          "status": "pass",
          "details": "$347,075 = $2,313,830 × 15% ✓"
        }
      ]
    },
    "consistency_checks": {
      "items_verified": 35,
      "inconsistencies_found": 0,
      "checks": [
        {
          "category": "Company Information",
          "check": "Company name consistency",
          "status": "pass",
          "passes_checked": [1, 11],
          "details": "Company name consistent across all passes"
        },
        {
          "category": "Financial Data",
          "check": "SDE figure consistency",
          "status": "pass",
          "passes_checked": [5, 8, 9, 10, 11],
          "details": "Weighted SDE of $569,388 consistent across all passes"
        },
        {
          "category": "Rates",
          "check": "Capitalization rate consistency",
          "status": "pass",
          "passes_checked": [6, 8, 10],
          "details": "Cap rate of 21.5% consistent"
        }
      ]
    },
    "logical_coherence": {
      "issues_found": 0,
      "checks": [
        {
          "check": "Value reasonableness",
          "status": "pass",
          "details": "Final value of $2.0M = 3.5x SDE, reasonable for profitable small business with above-average margins"
        },
        {
          "check": "Approach alignment",
          "status": "pass",
          "details": "Asset approach ($1.85M) < Income ($2.79M) > Market ($1.96M) - expected for profitable operating business"
        },
        {
          "check": "Discount appropriateness",
          "status": "pass",
          "details": "15% DLOM appropriate for controlling interest; no DLOC for 100% ownership"
        },
        {
          "check": "Narrative-conclusion alignment",
          "status": "pass",
          "details": "Executive summary accurately reflects Pass 10 concluded value of ~$2.0M"
        }
      ]
    },
    "narrative_quality": {
      "executive_summary": {
        "target_words": "1000-1200",
        "actual_words": 1150,
        "word_count_status": "pass",
        "specificity_grade": "A",
        "accuracy_grade": "A",
        "clarity_grade": "A",
        "completeness_grade": "A",
        "professionalism_grade": "A",
        "overall_grade": "A",
        "notes": "Comprehensive and specific to subject company"
      },
      "company_overview": {
        "target_words": "600-800",
        "actual_words": 720,
        "word_count_status": "pass",
        "specificity_grade": "A",
        "accuracy_grade": "A",
        "clarity_grade": "A",
        "completeness_grade": "B",
        "professionalism_grade": "A",
        "overall_grade": "A",
        "notes": "Well-written overview of business operations"
      },
      "financial_analysis": {
        "target_words": "800-1000",
        "actual_words": 890,
        "word_count_status": "pass",
        "specificity_grade": "A",
        "accuracy_grade": "A",
        "clarity_grade": "A",
        "completeness_grade": "A",
        "professionalism_grade": "A",
        "overall_grade": "A",
        "notes": "Thorough analysis with proper benchmarking"
      },
      "valuation_methodology": {
        "target_words": "500-600",
        "actual_words": 550,
        "word_count_status": "pass",
        "specificity_grade": "A",
        "accuracy_grade": "A",
        "clarity_grade": "A",
        "completeness_grade": "A",
        "professionalism_grade": "A",
        "overall_grade": "A",
        "notes": "Clear explanation of methodology"
      },
      "assumptions_limiting_conditions": {
        "target_words": "400-500",
        "actual_words": 450,
        "word_count_status": "pass",
        "specificity_grade": "B",
        "accuracy_grade": "A",
        "clarity_grade": "A",
        "completeness_grade": "A",
        "professionalism_grade": "A",
        "overall_grade": "A",
        "notes": "Standard professional language included"
      },
      "value_enhancement": {
        "target_words": "600-800",
        "actual_words": 680,
        "word_count_status": "pass",
        "specificity_grade": "A",
        "accuracy_grade": "A",
        "clarity_grade": "A",
        "completeness_grade": "A",
        "professionalism_grade": "A",
        "overall_grade": "A",
        "notes": "Specific, actionable recommendations"
      },
      "total_word_count": 4440,
      "overall_narrative_grade": "A"
    },
    "professional_standards": {
      "compliance_items": [
        { "requirement": "Valuation date stated", "status": "pass" },
        { "requirement": "Standard of value defined", "status": "pass" },
        { "requirement": "Premise of value stated", "status": "pass" },
        { "requirement": "Purpose stated", "status": "pass" },
        { "requirement": "Interest specified", "status": "pass" },
        { "requirement": "Assumptions present", "status": "pass" },
        { "requirement": "Limiting conditions present", "status": "pass" },
        { "requirement": "Independence statement", "status": "pass" },
        { "requirement": "Data sources cited", "status": "pass" }
      ],
      "compliance_percentage": 100,
      "compliance_grade": "A"
    },
    "schema_validation": {
      "schema_version": "2.0",
      "validation_checks": [
        { "check": "All required top-level fields present", "status": "pass" },
        { "check": "Approach weights sum to 1.0", "status": "pass", "value": 1.0 },
        { "check": "Concluded value within range", "status": "pass" },
        { "check": "Valuation floor check", "status": "pass", "concluded": 2000000, "floor": 1850000 },
        { "check": "Monetary values as numbers", "status": "pass" },
        { "check": "Percentages as decimals", "status": "pass" }
      ],
      "narrative_word_counts": {
        "executive_summary": { "target": 800, "actual": 850, "status": "pass" },
        "company_overview": { "target": 500, "actual": 520, "status": "pass" },
        "financial_analysis": { "target": 1000, "actual": 980, "status": "pass" },
        "industry_analysis": { "target": 600, "actual": 620, "status": "pass" },
        "risk_assessment": { "target": 700, "actual": 710, "status": "pass" },
        "asset_approach_narrative": { "target": 500, "actual": 480, "status": "pass" },
        "income_approach_narrative": { "target": 500, "actual": 510, "status": "pass" },
        "market_approach_narrative": { "target": 500, "actual": 490, "status": "pass" },
        "valuation_synthesis_narrative": { "target": 600, "actual": 580, "status": "pass" },
        "assumptions_and_limiting_conditions": { "target": 400, "actual": 420, "status": "pass" },
        "value_enhancement_recommendations": { "target": 500, "actual": 480, "status": "pass" }
      },
      "validation_passed": true,
      "validation_errors": [],
      "validation_warnings": []
    },
    "errors_found": [],
    "corrections_made": [],
    "quality_scores": {
      "mathematical_accuracy": { "grade": "A", "score": 98, "notes": "All calculations verified correct" },
      "data_consistency": { "grade": "A", "score": 96, "notes": "All data consistent across passes" },
      "logical_coherence": { "grade": "A", "score": 94, "notes": "Conclusion well-supported by analysis" },
      "narrative_quality": { "grade": "A", "score": 92, "notes": "Professional, specific narratives" },
      "professional_standards": { "grade": "A", "score": 100, "notes": "Full compliance" },
      "schema_validation": { "grade": "A", "score": 100, "notes": "All schema requirements met" },
      "overall": { "grade": "A", "score": 96, "notes": "Report ready for delivery" }
    },
    "final_recommendation": {
      "status": "APPROVE",
      "summary": "The valuation report meets professional standards and is ready for delivery. All mathematical calculations are accurate, data is consistent across passes, the analysis logically supports the conclusion, and narratives are professional quality.",
      "conditions": [],
      "notes": "This is a well-documented valuation with transparent methodology and appropriate support for the concluded value."
    }
  },
  "corrected_final_report": null,
  "extraction_metadata": {
    "processing_time_ms": 0,
    "tokens_used": 0
  }
}

## EXAMPLE WITH ERRORS

If errors are found, the output would include:

{
  "errors_found": [
    {
      "error_id": "ERR-001",
      "error_type": "Mathematical",
      "severity": "Major",
      "location": "Pass 8 - capitalization rate calculation",
      "current_value": "Cap rate = 22.5%",
      "correct_value": "Cap rate = 21.5%",
      "impact": "Understates value by approximately $130,000",
      "explanation": "Discount rate of 24.5% minus growth of 3.0% equals 21.5%, not 22.5%"
    },
    {
      "error_id": "ERR-002",
      "error_type": "Inconsistency",
      "severity": "Minor",
      "location": "Pass 11 - Executive Summary",
      "current_value": "Revenue of $2.6 million",
      "correct_value": "Revenue of $2.5 million",
      "impact": "Creates reader confusion",
      "explanation": "Pass 2 shows revenue of $2,500,000; narrative rounds differently"
    }
  ],
  "corrections_made": [
    {
      "error_id": "ERR-001",
      "correction": "Updated Pass 8 capitalization rate from 22.5% to 21.5%",
      "affected_values": ["Pass 8 indicated value", "Pass 10 weighted average"],
      "new_values": {
        "pass_8_indicated_value": 2648316,
        "pass_10_preliminary_value": 2313830
      }
    }
  ],
  "corrected_final_report": {
    "has_corrections": true,
    "correction_summary": "2 errors corrected: 1 mathematical error in cap rate calculation, 1 revenue figure inconsistency in narrative",
    "corrected_values": {
      "pass_8_capitalization_rate": 0.215,
      "pass_8_indicated_value": 2648316,
      "pass_11_executive_summary_revenue": 2500000
    },
    "corrected_narratives": {
      "executive_summary": "[Corrected narrative with $2.5M revenue...]"
    }
  },
  "final_recommendation": {
    "status": "APPROVE WITH NOTES",
    "summary": "Corrections have been applied. Report now ready for delivery.",
    "conditions": ["Verify corrected values before final delivery"],
    "notes": "Mathematical error would have understated value; corrected to accurate calculation."
  }
}

## CRITICAL INSTRUCTIONS

1. **CHECK EVERY CALCULATION**: This is not a sampling exercise. Verify ALL math.

2. **TRACE DATA ACROSS PASSES**: Every key figure should be traced through all passes where it appears.

3. **BE CRITICAL**: Your job is to find problems, not rubber-stamp. Look hard for issues.

4. **CLASSIFY ERRORS PROPERLY**: Critical errors must be flagged appropriately.

5. **PROVIDE CORRECTIONS**: Don't just identify errors—provide the correct values.

6. **GRADE HONESTLY**: Don't inflate grades. A "C" means acceptable but improvable.

7. **VERIFY NARRATIVES**: Check that narrative statements match underlying data.

8. **CHECK WORD COUNTS**: Verify each narrative section meets word count targets.

9. **RECOMMEND APPROPRIATELY**: Only recommend APPROVE if the report is truly ready.

10. **INCLUDE CORRECTED_FINAL_REPORT**: If errors found, populate this field with corrections.

11. **OUTPUT ONLY JSON**: Your entire response must be valid JSON. No text before or after.

Now perform comprehensive quality review of the valuation report.`;

export const pass12PromptConfig = {
  passNumber: 12,
  passName: 'Quality Review & Error Correction',
  systemPrompt: PASS_12_SYSTEM_PROMPT,
  userPrompt: PASS_12_USER_PROMPT,
  expectedOutputType: 'Pass12Output' as const,
  maxTokens: 12288,
  temperature: 0.1,
};

export default pass12PromptConfig;
