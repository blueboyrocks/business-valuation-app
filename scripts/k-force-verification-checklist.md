# K-Force Test Report: Verification Checklist

**PRD-H Final Gate - US-012**

This document outlines the manual verification steps to confirm all data consistency fixes from US-001 through US-011 are working correctly.

## Pre-Verification Setup

1. Ensure the application is deployed with all PRD-H changes
2. Have access to:
   - Application UI or API endpoint for K-Force report
   - Supabase database access for manifest_json queries
   - Server logs for [MANIFEST], [INJECTOR], [QUALITY_GATE], [DATA_FLOW] entries

## Expected K-Force Values (Reference)

Based on PRD notes, K-Force should have approximately:

| Metric | Expected Value |
|--------|----------------|
| Final Concluded Value | ~$2.27M |
| Value Range Low | ~$1.93M |
| Value Range High | ~$2.61M |
| SDE Multiple | ~2.5x |
| Asset Approach | ~$1.1M (not $0) |
| Revenue | Consistent across all sections |

**Incorrect values to watch for:**
- Value range of $3.8M-$4.6M (wrong)
- SDE multiple of 4.9x (wrong)
- Asset approach = $0 (wrong)

---

## Verification Steps

### Step 1: Generate K-Force PDF

- [ ] Navigate to K-Force report in the application
- [ ] Trigger PDF generation (via UI download button or API)
- [ ] Note the timestamp for log correlation

**API method (alternative):**
```bash
POST /api/reports/[K-FORCE-REPORT-ID]/download-pdf
```

**Mini-report mode for quick visual check:**
```bash
POST /api/reports/[K-FORCE-REPORT-ID]/download-pdf?testMode=true
```

---

### Step 2: Check Server Logs

Verify the following log prefixes appear and show correct values:

#### [MANIFEST] Logs (US-001)
- [ ] `[MANIFEST] final_value=` shows ~$2.27M
- [ ] `[MANIFEST] value_range_low=` shows ~$1.93M
- [ ] `[MANIFEST] value_range_high=` shows ~$2.61M
- [ ] `[MANIFEST] asset_approach=` shows ~$1.1M (NOT $0)
- [ ] `[MANIFEST] sde_multiple=` shows ~2.5x (NOT 4.9x)
- [ ] `[MANIFEST] GENERATION_COMPLETE values_logged=15`

#### [INJECTOR] Logs (US-007)
- [ ] `[INJECTOR] Section:` entries appear
- [ ] Values found and replaced counts shown
- [ ] No errors in injection process

#### [QUALITY_GATE] Logs (US-009)
- [ ] `[QUALITY_GATE] Score:` shows high score (>80)
- [ ] `[QUALITY_GATE] CanProceed: true`
- [ ] No blocking errors in quality gate

#### [DATA_FLOW] Logs (US-006)
- [ ] `[DATA_FLOW] Mode: CALCULATION_ENGINE (authoritative)` appears
- [ ] Sources show CALCULATION_ENGINE for critical fields
- [ ] NO logs showing narrative values overwriting calculation values

#### [ASSET_APPROACH] Logs (US-005)
- [ ] `[ASSET_APPROACH] totalAssets=` shows K-Force assets (~$2.2M)
- [ ] `[ASSET_APPROACH] liabilities=` shows K-Force liabilities (~$1.1M)
- [ ] `[ASSET_APPROACH] calculated=` shows ~$1.1M

---

### Step 3: Query Supabase Manifest

```sql
SELECT
  manifest_json->'critical_values'->>'final_concluded_value' as final_value,
  manifest_json->'critical_values'->>'value_range_low' as range_low,
  manifest_json->'critical_values'->>'value_range_high' as range_high,
  manifest_json->'critical_values'->>'asset_approach_value' as asset_approach,
  manifest_json->'critical_values'->>'sde_multiple_used' as sde_multiple,
  manifest_json->'consistency_check'->>'passed' as consistency_passed,
  manifest_json->'consistency_check'->'errors' as consistency_errors
FROM reports
WHERE id = '[K-FORCE-REPORT-ID]';
```

#### Manifest Checks (US-002, US-003)
- [ ] manifest_json exists (not null)
- [ ] final_concluded_value ~= $2,270,000
- [ ] value_range_low ~= $1,930,000
- [ ] value_range_high ~= $2,610,000
- [ ] asset_approach_value > $0 (should be ~$1.1M)
- [ ] sde_multiple_used ~= 2.5
- [ ] consistency_check.passed = true
- [ ] consistency_check.errors = [] (empty array)

---

### Step 4: Validate Manifest Consistency

Run the manifest validator on the stored manifest:

```typescript
import { parseManifest } from '@/lib/valuation/manifest-generator';
import { validateManifest } from '@/lib/valuation/manifest-validator';

const manifest = parseManifest(reportRow.manifest_json);
const result = validateManifest(manifest);

console.log('Passed:', result.passed);
console.log('Errors:', result.errors);
console.log('Warnings:', result.warnings);
```

#### Validator Checks (US-003)
- [ ] result.passed === true
- [ ] result.errors.length === 0
- [ ] Weights sum to 1.0 (no "weights do not sum" error)
- [ ] Value range valid (low < final < high)
- [ ] Weighted value math correct (within 2% tolerance)

---

### Step 5: Visual PDF Verification

Open the generated PDF and manually verify:

#### Executive Summary Section
- [ ] Final concluded value = ~$2.27M (NOT $4.2M or other hallucinated value)
- [ ] Value range = $1.93M - $2.61M (NOT $3.8M - $4.6M)
- [ ] SDE multiple = ~2.5x (NOT 4.9x)
- [ ] Revenue matches financial data

#### Valuation Approaches Section
- [ ] Asset Approach shows ~$1.1M (NOT $0)
- [ ] Income Approach shows calculated value
- [ ] Market Approach shows calculated value
- [ ] Approach weights are visible and sum to 100%

#### Value Reconciliation Section
- [ ] Final value matches Executive Summary
- [ ] Approach values match their respective sections
- [ ] Weighted calculation shown correctly

#### General Checks
- [ ] No "[object Object]" text anywhere
- [ ] No "undefined" text anywhere
- [ ] No NaN or Infinity values
- [ ] All currency values formatted consistently ($X,XXX,XXX)

---

### Step 6: Cross-Section Consistency

Verify the same value appears consistently across sections:

| Value | Executive Summary | Approaches | Reconciliation | Conclusion |
|-------|-------------------|------------|----------------|------------|
| Final Value | [ ] | N/A | [ ] | [ ] |
| Asset Approach | N/A | [ ] | [ ] | N/A |
| Income Approach | N/A | [ ] | [ ] | N/A |
| Market Approach | N/A | [ ] | [ ] | N/A |
| SDE Multiple | [ ] | [ ] | N/A | N/A |
| Revenue | [ ] | [ ] | N/A | N/A |

All checkboxes in same row should have matching values.

---

## Mini-Report Mode Verification (US-004)

If using testMode=true:

- [ ] Mini-report generates successfully
- [ ] Contains Critical Values Summary Table
- [ ] Table shows all authoritative values
- [ ] File is < 10 pages
- [ ] Yellow test banners visible
- [ ] Values match full report

---

## Test Script Verification (US-011)

Run the integration test:

```bash
npx ts-node scripts/test-manifest-consistency.ts
```

- [ ] Script runs without errors
- [ ] Reports PASS for all consistency checks
- [ ] No TypeScript compilation errors

---

## Pass/Fail Criteria

**PASS** if all of the following are true:
1. All log prefixes appear with correct values
2. Manifest saved to Supabase with consistency_check.passed = true
3. Visual PDF shows consistent values (no hallucination)
4. Final value appears same in all sections (~$2.27M)
5. Asset approach > $0 (~$1.1M)
6. Value range is $1.93M-$2.61M (not $3.8M-$4.6M)
7. SDE multiple is ~2.5x (not 4.9x)
8. No [object Object] or undefined in PDF

**FAIL** if any of the above are false.

---

## Troubleshooting

### Asset Approach Still $0
- Check [ASSET_APPROACH] logs for balance sheet data
- Verify Pass 3 ran and has balance sheet data in pass_results

### Values Still Inconsistent
- Check [DATA_FLOW] logs - are narratives overwriting calculations?
- Check [INJECTOR] logs - is the value injector running?
- Check [QUALITY_GATE] logs - was there a warning that should have been an error?

### Manifest Not Saved
- Check download-pdf route logs for errors
- Verify manifest_json column exists in reports table

### Quality Gate Not Blocking
- Verify criticalSections use snake_case (executive_summary, not executiveSummary)
- Check if the section content is being passed to quality gate

---

## Completion

When all checks pass:
- Mark US-012 as passes: true in prd.json
- PRD-H is complete!

**Date Verified:** ________________
**Verified By:** ________________
**K-Force Report ID:** ________________
**Notes:**
