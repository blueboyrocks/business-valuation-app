# Comprehensive Fix Plan for Business Valuation App

**Date:** January 23, 2026
**Based On:** Analysis of K-Force Report (ID: 3d30340d-fa5f-40db-84e5-4089a98bd431)

---

## Executive Summary

After detailed analysis of the PDF report, web UI dashboard, PRD requirements, and codebase, I've identified the following critical issues and their root causes:

| Issue | Severity | Root Cause | Fix Location |
|-------|----------|------------|--------------|
| Missing Risk Assessment narrative | Critical | Field name mismatch (`risk_analysis` vs `risk_assessment`) | `transform-to-final-report.ts:969` |
| Missing Value Enhancement narrative | Critical | Hardcoded empty string | `transform-to-final-report.ts:996` |
| Missing Assumptions & Conditions | Critical | Field name mismatch | `transform-to-final-report.ts:992` |
| TOC page numbers wrong | High | Hardcoded static page numbers | `professional-pdf-generator.ts:580-593` |
| "undefined" NAICS code | Medium | Missing null check | `professional-pdf-generator.ts:601` |
| Dashboard Risk tab empty | Critical | Same as PDF - field mismatch | `report-aggregator.ts` + passes |
| Dashboard Strategic/Recommendations empty | Critical | Same as PDF - empty narratives | `report-aggregator.ts` + passes |

---

## Issue 1: Missing Narrative Sections in PDF

### Problem
The PDF report is missing 4 of the 11 required narrative sections:
- **Industry Analysis (11d)** - Present in pass outputs but may not render
- **Risk Assessment (11e)** - MISSING due to field name mismatch
- **Assumptions & Conditions (11j)** - MISSING due to field name mismatch
- **Value Enhancement (11k)** - MISSING due to hardcoded empty string

### Root Cause Analysis

**File:** `lib/claude/transform-to-final-report.ts`

#### Bug 1: Risk Assessment Field Name Mismatch (Line 969)
```typescript
// CURRENT (WRONG):
risk_assessment: {
  word_count_target: NARRATIVE_WORD_TARGETS.risk_assessment,
  content: narratives.risk_analysis?.content || '',  // ❌ Looking for "risk_analysis"
}

// SHOULD BE:
risk_assessment: {
  word_count_target: NARRATIVE_WORD_TARGETS.risk_assessment,
  content: narratives.risk_assessment?.content || '',  // ✅ Looking for "risk_assessment"
}
```

#### Bug 2: Value Enhancement Hardcoded Empty (Line 996)
```typescript
// CURRENT (WRONG):
value_enhancement_recommendations: {
  word_count_target: NARRATIVE_WORD_TARGETS.value_enhancement_recommendations,
  content: '', // ❌ HARDCODED EMPTY STRING
}

// SHOULD BE:
value_enhancement_recommendations: {
  word_count_target: NARRATIVE_WORD_TARGETS.value_enhancement_recommendations,
  content: narratives.value_enhancement_recommendations?.content || '',  // ✅ Get from pass 11k
}
```

#### Bug 3: Assumptions Field Name Mismatch (Line 992)
```typescript
// CURRENT (POTENTIALLY WRONG):
assumptions_and_limiting_conditions: {
  word_count_target: NARRATIVE_WORD_TARGETS.assumptions_and_limiting_conditions,
  content: narratives.conclusion_and_limiting_conditions?.content || '',  // ⚠️ Verify field name
}

// MAY NEED TO BE:
assumptions_and_limiting_conditions: {
  word_count_target: NARRATIVE_WORD_TARGETS.assumptions_and_limiting_conditions,
  content: narratives.assumptions_limiting_conditions?.content ||
           narratives.assumptions_and_limiting_conditions?.content || '',
}
```

### Fix Required
Edit `lib/claude/transform-to-final-report.ts`:
1. Line 969: Change `risk_analysis` to `risk_assessment`
2. Line 996: Change `''` to `narratives.value_enhancement_recommendations?.content || ''`
3. Line 992: Add fallback for `assumptions_limiting_conditions`

---

## Issue 2: Table of Contents Page Numbers Wrong

### Problem
TOC shows:
- Executive Summary - page 6 (actually page 9)
- Company Profile - page 7 (actually page 12)
- All subsequent pages off by 2-6 pages

### Root Cause
**File:** `lib/pdf/professional-pdf-generator.ts` (lines 580-593)

Page numbers are hardcoded:
```typescript
<div class="toc-item"><span>Your Valuation</span><span>3</span></div>
<div class="toc-item"><span>Financial Summary</span><span>4</span></div>
<div class="toc-item"><span>Key Performance Indicators</span><span>5</span></div>
<div class="toc-item"><span>Executive Summary</span><span>6</span></div>
${companyProfile ? '<div class="toc-item"><span>Company Profile</span><span>7</span></div>' : ''}
// ... etc
```

When sections are conditionally included/excluded, page numbers shift but TOC stays static.

### Fix Options

**Option A: Dynamic Page Calculation (Recommended)**
Calculate page numbers based on content length and which sections are included.

**Option B: CSS Counter-Based Numbering**
Use CSS counters with `counter-increment` and `target-counter()` for automatic numbering.

**Option C: Remove Page Numbers**
Remove hardcoded page numbers from TOC (simplest but reduces functionality).

### Fix Required
Implement dynamic page tracking that:
1. Tracks which sections are included
2. Estimates page breaks based on content length
3. Updates TOC numbers accordingly

---

## Issue 3: "undefined" NAICS Code on Page 3

### Problem
Page 3 shows: `Industry: undefined - Engineering Services`

### Root Cause
**File:** `lib/pdf/professional-pdf-generator.ts` (line 601)

```typescript
${reportData.industry_name ? `<p><strong>Industry:</strong> ${reportData.naics_code} - ${reportData.industry_name}</p>` : ''}
```

The condition checks `industry_name` but displays `naics_code` which may be undefined.

### Fix Required
```typescript
${reportData.industry_name ? `<p><strong>Industry:</strong> ${reportData.naics_code || ''} - ${reportData.industry_name}</p>` : ''}
```

Or better:
```typescript
${reportData.industry_name ? `<p><strong>Industry:</strong> ${reportData.naics_code ? `${reportData.naics_code} - ` : ''}${reportData.industry_name}</p>` : ''}
```

---

## Issue 4: Dashboard Tabs Show "No Data Available"

### Problem
From screenshots:
- **Risk Assessment tab:** Shows "5/10 Moderate Risk" but "No detailed risk assessment narrative available"
- **Strategic Insights tab:** Shows "No detailed strategic insights narrative available" with hardcoded fallback bullets
- **Recommendations tab:** Shows "No specific recommendations available"

### Root Cause
**File:** `components/EnhancedReportDisplay.tsx`

The component extracts narratives from `reportData`:
```typescript
const narratives = {
  risk_assessment: getNarrativeContent(reportData.risk_assessment) ||
                   getNarrativeContent(reportData.narratives?.risk_assessment) || '',
  strategic_insights: getNarrativeContent(reportData.strategic_insights) ||
                      getNarrativeContent(reportData.narratives?.value_enhancement_recommendations) ||
                      getNarrativeContent(reportData.narratives?.strategic_insights) || '',
  // ...
};
```

**File:** `lib/report-aggregator.ts` (lines 316, 322, 331, 339)

The aggregator correctly maps to pass outputs:
```typescript
risk_assessment: getNarrativeFromPassResults(passOutputs, '11e') || getNarrative(pass11, 'risk_assessment') || getNarrative(pass6, 'narrative'),
strategic_insights: getNarrativeFromPassResults(passOutputs, '11k') || getNarrative(pass11, 'value_enhancement_recommendations'),
```

But if pass 11e and 11k don't have content in `pass_outputs.narratives.pass_results`, these will be empty.

### Investigation Needed
1. Check if passes 11e and 11k are actually running and generating content
2. Check if content is stored in `pass_outputs.narratives.pass_results['11e']` and `['11k']`
3. Verify the `getNarrativeFromPassResults()` function is correctly extracting content

### Fix Required
1. Verify narrative passes are executing
2. Add fallback to use Pass 6 (Risk Assessment) data if 11e narrative is missing
3. Add fallback to use Pass 10 (Value Synthesis) recommendations if 11k is missing

---

## Issue 5: Missing Industry Analysis Section

### Problem
Industry Analysis (11d) doesn't appear to be in the PDF despite being in pass outputs.

### Root Cause
The PDF generator checks for industry analysis:
```typescript
const industryContent = getContent(data.industry_analysis) || getContent(narratives.industry_analysis);
const industryAnalysis = industryContent ? await marked(industryContent) : '';
```

If `data.industry_analysis` and `narratives.industry_analysis` are both empty/falsy, the section is skipped.

### Investigation Needed
Check if `report_data.industry_analysis` is populated from pass outputs.

---

## Complete Fix Checklist

### Priority 1: Critical Fixes (PDF Narratives + Dashboard)

- [ ] **FIX 1.1:** `transform-to-final-report.ts:969` - Change `risk_analysis` to `risk_assessment`
- [ ] **FIX 1.2:** `transform-to-final-report.ts:996` - Populate value_enhancement_recommendations from narratives
- [ ] **FIX 1.3:** `transform-to-final-report.ts:992` - Verify/fix assumptions field name
- [ ] **FIX 1.4:** Verify passes 11d, 11e, 11j, 11k are generating content

### Priority 2: High Priority Fixes (TOC + Display)

- [ ] **FIX 2.1:** `professional-pdf-generator.ts:601` - Fix undefined NAICS code display
- [ ] **FIX 2.2:** `professional-pdf-generator.ts:580-593` - Implement dynamic TOC page numbers

### Priority 3: Verification

- [ ] **VERIFY 3.1:** Run export-pass-outputs.ts to check actual pass output structure
- [ ] **VERIFY 3.2:** Regenerate PDF for K-Force report after fixes
- [ ] **VERIFY 3.3:** Check all 11 narratives appear in PDF with correct TOC
- [ ] **VERIFY 3.4:** Check all dashboard tabs display narrative content

---

## Files to Modify

| File | Lines | Change |
|------|-------|--------|
| `lib/claude/transform-to-final-report.ts` | 969, 992, 996 | Fix field name mismatches |
| `lib/pdf/professional-pdf-generator.ts` | 580-593, 601 | Fix TOC + NAICS display |
| `lib/report-aggregator.ts` | 316, 322 | Add fallbacks if needed |

---

## Testing Plan

1. Run the export script to verify pass outputs have narrative content
2. Apply fixes to transform-to-final-report.ts
3. Apply fixes to professional-pdf-generator.ts
4. Regenerate PDF for K-Force report
5. Verify:
   - All 11 narrative sections appear in PDF
   - TOC page numbers are correct
   - No "undefined" values displayed
   - Dashboard tabs show narrative content

---

## Expected Outcome

After fixes:
1. **PDF Report** will contain all 11 narrative sections with correct TOC page numbers
2. **Dashboard** will show narrative content in Risk, Strategic, and Recommendations tabs
3. **No "undefined"** values will appear anywhere in the report
