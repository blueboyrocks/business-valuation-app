# Business Valuation App - Technical Summary

> **Version**: 2.0
> **Last Updated**: January 2026
> **Purpose**: Comprehensive technical documentation for onboarding and continuity

---

## Table of Contents
1. [System Architecture Overview](#1-system-architecture-overview)
2. [API Endpoints](#2-api-endpoints)
3. [Database Schema](#3-database-schema)
4. [File Structure](#4-file-structure)
5. [Data Flow Walkthrough](#5-data-flow-walkthrough)
6. [Pass-by-Pass Specification](#6-pass-by-pass-specification)
7. [Known Issues & Fixes Applied](#7-known-issues--fixes-applied)
8. [Testing Instructions](#8-testing-instructions)
9. [Environment Variables Required](#9-environment-variables-required)
10. [Deployment Notes](#10-deployment-notes)

---

## 1. System Architecture Overview

### The 12-Pass Valuation System

The application generates comprehensive business valuation reports using a **12-pass AI pipeline**. Each pass is a specialized Claude API call that handles a specific aspect of the valuation analysis.

**Pass Phases:**
- **Passes 1-3**: Data Extraction (extracts data from PDF documents)
- **Passes 4-6**: Analysis (industry research, earnings normalization, risk assessment)
- **Passes 7-9**: Valuation Approaches (asset, income, market)
- **Passes 10-12**: Synthesis & Review (value reconciliation, narratives, quality check)

### Why Chained API Calls?

The system uses a **chained API calls pattern** where each pass is executed as a separate HTTP request. This architecture was chosen because:

1. **Vercel Timeout Limits**: Vercel Pro has an 800-second max function timeout. Running all 12 passes in one request would exceed this.
2. **Reliability**: If one pass fails, the system can retry just that pass instead of restarting everything.
3. **Progress Tracking**: Users see real-time progress as each pass completes.
4. **Cost Control**: Partial processing is saved, avoiding redundant API calls.

### Data Flow Diagram

```
┌─────────────────┐
│   Upload Page   │
│ (Frontend)      │
└────────┬────────┘
         │ 1. Upload PDFs to Supabase Storage
         │ 2. Create document records
         │ 3. Create report record (status: pending)
         ▼
┌─────────────────┐
│  Report Page    │
│ (Frontend)      │
└────────┬────────┘
         │ 4. Auto-starts processing when status is 'pending'
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Chained Pass Execution                    │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐       ┌──────┐ │
│  │  Pass 1  │──▶│  Pass 2  │──▶│  Pass 3  │──...──│Pass 12│ │
│  │ (with PDF)│   │ (with PDF)│   │ (with PDF)│       │      │ │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘       └──┬───┘ │
│       │              │              │                 │      │
│       ▼              ▼              ▼                 ▼      │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              pass_outputs (JSONB column)                ││
│  │  { "1": {...}, "2": {...}, ..., "12": {...} }          ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
         │
         │ 5. After Pass 12 completes
         ▼
┌─────────────────┐
│ Final Report    │
│ Assembly        │
└────────┬────────┘
         │ 6. Transform to FinalValuationReport schema
         │ 7. Save to report_data column
         │ 8. Generate PDF, upload to storage
         ▼
┌─────────────────┐
│ Report Display  │
│ + PDF Download  │
└─────────────────┘
```

---

## 2. API Endpoints

### Primary Endpoints (Current System)

| Path | Method | Purpose |
|------|--------|---------|
| `/api/upload-documents` | POST | Create report and link uploaded documents |
| `/api/reports/[id]/process-pass` | POST | Execute a single pass (1-12) |
| `/api/reports/[id]/process-pass` | GET | Get current processing state |
| `/api/reports/[id]/status` | GET | Get detailed report status |
| `/api/reports/[id]/download-pdf` | POST | Generate and download PDF |
| `/api/reports/[id]/debug-passes` | GET | Debug: inspect pass_outputs |

### POST `/api/upload-documents`

Creates a report and links uploaded documents.

**Request:**
```json
{
  "companyName": "Acme Corporation",
  "files": [
    { "name": "2023_tax_return.pdf", "path": "user123/1234567890-2023_tax_return.pdf", "size": 524288 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "reportId": "uuid-here",
  "documents": [{ "id": "doc-uuid", "file_name": "2023_tax_return.pdf", "file_path": "..." }]
}
```

### POST `/api/reports/[id]/process-pass?pass={N}`

Executes a single pass of the 12-pass pipeline.

**Query Parameters:**
- `pass` (required): Pass number 1-12
- `force` (optional): `true` to skip prerequisite checks

**Response:**
```json
{
  "success": true,
  "passNumber": 4,
  "passName": "Industry Research & Competitive Analysis",
  "passDescription": "Industry Analysis",
  "isComplete": false,
  "nextPass": 5,
  "metrics": {
    "processingTimeMs": 15234,
    "inputTokens": 12500,
    "outputTokens": 3200,
    "costUsd": 0.085
  }
}
```

When `isComplete: true` (Pass 12 finished):
```json
{
  "success": true,
  "passNumber": 12,
  "isComplete": true,
  "nextPass": null,
  "valuationSummary": {
    "concludedValue": 2500000,
    "valueRangeLow": 2200000,
    "valueRangeHigh": 2800000,
    "qualityGrade": "B",
    "qualityScore": 82
  }
}
```

### GET `/api/reports/[id]/process-pass`

Returns current processing state without executing any pass.

**Response:**
```json
{
  "success": true,
  "reportId": "uuid",
  "currentPass": 6,
  "completedPasses": [1, 2, 3, 4, 5, 6],
  "status": "pass_6_complete",
  "progress": 48,
  "message": "Pass 6/12: Risk Assessment complete",
  "canResume": true,
  "nextPass": 7
}
```

### GET `/api/reports/[id]/debug-passes`

Debug endpoint to inspect pass_outputs in database.

**Query Parameters:**
- `pass` (optional): Get specific pass data

**Response (no pass specified):**
```json
{
  "reportId": "uuid",
  "companyName": "Acme Corp",
  "status": "pass_6_complete",
  "currentPass": 6,
  "totalPasses": 6,
  "passKeys": ["1", "2", "3", "4", "5", "6"],
  "passSummaries": {
    "1": { "exists": true, "keys": ["pass_number", "document_info", "company_profile", "industry_classification"] },
    "2": { "exists": true, "keys": ["pass_number", "income_statements", "trend_analysis"] }
  }
}
```

### Legacy/Alternative Endpoints

| Path | Method | Notes |
|------|--------|-------|
| `/api/analyze-documents` | POST/GET | Old two-phase workflow (extract then valuate) |
| `/api/reports/[id]/process-claude` | POST | Old single-request 12-pass (times out) |
| `/api/reports/[id]/process-multipass` | POST | Experimental multi-pass |

---

## 3. Database Schema

### Tables Overview

| Table | Purpose |
|-------|---------|
| `reports` | Main report records with status, pass outputs, final data |
| `documents` | Uploaded document records linked to reports |
| `document_extractions` | Per-document extraction results (legacy) |
| `profiles` | User profiles |
| `payments` | Payment records |

### Reports Table - Complete Column List

```sql
CREATE TABLE reports (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  document_id UUID REFERENCES documents(id),
  company_name TEXT NOT NULL,

  -- Status
  report_status TEXT NOT NULL DEFAULT 'pending',
  -- Valid statuses: pending, processing, extracting, extraction_complete,
  -- extraction_partial, extraction_failed, valuating, valuation_failed,
  -- completed, failed, error, cancelled,
  -- pass_1_processing, pass_1_complete, pass_2_processing, pass_2_complete, ...

  current_pass INTEGER,
  processing_progress INTEGER,        -- 0-100 percentage
  processing_message TEXT,

  -- Pass Outputs (CRITICAL for chained processing)
  pass_outputs JSONB,                 -- Stores output from each completed pass

  -- Final Report Data
  report_data JSONB,                  -- FinalValuationReport after all passes
  executive_summary TEXT,
  valuation_amount NUMERIC,
  valuation_method TEXT,

  -- PDF
  pdf_path TEXT,                      -- Path in Supabase storage

  -- Processing Metrics
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  tokens_used INTEGER,
  processing_cost NUMERIC,
  processing_time_ms INTEGER,

  -- Error Handling
  error_message TEXT,

  -- Legacy Fields
  openai_thread_id TEXT,
  openai_run_id TEXT,
  file_ids TEXT[],

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### pass_outputs JSONB Structure

The `pass_outputs` column stores all intermediate pass results:

```json
{
  "1": {
    "pass_number": 1,
    "pass_name": "Document Classification & Company Profile",
    "document_info": { "document_type": "tax_return_1120s", "tax_year": 2023, ... },
    "company_profile": { "legal_name": "Acme Corp", "ein": "12-3456789", ... },
    "ownership_info": { "owners": [...], "ownership_type": "s_corp" },
    "industry_classification": { "naics_code": "541611", "naics_description": "...", ... },
    "data_quality_assessment": { "overall_quality": "good", ... }
  },
  "2": {
    "pass_number": 2,
    "pass_name": "Income Statement Extraction",
    "income_statements": [ { "fiscal_year": 2023, "revenue": {...}, ... } ],
    "trend_analysis": { "revenue_cagr": 0.05, ... },
    "key_metrics": { "average_revenue": 1500000, ... }
  },
  "3": { /* Balance Sheet data */ },
  "4": { /* Industry Analysis data */ },
  "5": { /* Normalized Earnings data */ },
  "6": { /* Risk Assessment data */ },
  "7": { /* Asset Approach valuation */ },
  "8": { /* Income Approach valuation */ },
  "9": { /* Market Approach valuation */ },
  "10": { /* Value Synthesis */ },
  "11": { /* Narratives */ },
  "12": { /* Quality Review */ }
}
```

### Documents Table

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  report_id UUID REFERENCES reports(id),  -- Links document to report
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,                 -- Path in Supabase storage
  file_size INTEGER,
  mime_type TEXT,
  company_name TEXT,
  upload_status TEXT DEFAULT 'pending',    -- pending, completed, failed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. File Structure

### Core Processing Files

| File | Purpose |
|------|---------|
| `lib/claude/orchestrator-v2.ts` | Main orchestration logic. Contains `executeSinglePass()`, `runTwelvePassValuation()`, pass builders, document download, database save/load |
| `lib/claude/types-v2.ts` | TypeScript interfaces for all 12 pass outputs (`Pass1Output`, `Pass2Output`, etc.) |
| `lib/claude/prompts-v2/*.ts` | System and user prompts for each pass. Each file exports `PASS_N_SYSTEM_PROMPT`, `PASS_N_USER_PROMPT`, and a config object |
| `lib/claude/transform-to-final-report.ts` | Transforms 12 pass outputs into `FinalValuationReport` schema |
| `lib/claude/final-report-schema.ts` | TypeScript interfaces for the final output schema (matches OUTPUT_SCHEMA.md) |
| `lib/claude/embedded-knowledge.ts` | Static valuation data: sector multiples, risk frameworks, DLOM studies, cap rate benchmarks |

### API Route Files

| File | Purpose |
|------|---------|
| `app/api/reports/[id]/process-pass/route.ts` | Chained pass execution endpoint. Calls `executeSinglePass()` |
| `app/api/upload-documents/route.ts` | Creates reports and links documents |
| `app/api/reports/[id]/download-pdf/route.ts` | PDF generation and download |
| `app/api/reports/[id]/debug-passes/route.ts` | Debug endpoint for inspecting pass_outputs |
| `app/api/reports/[id]/status/route.ts` | Detailed status with phase breakdown |

### Frontend Files

| File | Purpose |
|------|---------|
| `app/dashboard/upload/page.tsx` | Upload form. Uploads files to Supabase Storage, calls `/api/upload-documents`, redirects to report page |
| `app/dashboard/reports/[id]/page.tsx` | Report viewer. Auto-starts processing, shows 12-pass progress, displays final report |
| `app/dashboard/reports/page.tsx` | Reports list |
| `components/EnhancedReportDisplay.tsx` | Renders the final valuation report |

### Supabase Integration

| File | Purpose |
|------|---------|
| `lib/supabase/server.ts` | Creates server-side Supabase client with **SERVICE_ROLE_KEY** (bypasses RLS) |
| `lib/supabase/client.ts` | Creates browser-side Supabase client with anon key |
| `lib/supabase/types.ts` | TypeScript types generated from database schema |

### PDF Generation

| File | Purpose |
|------|---------|
| `lib/pdf/auto-generate.ts` | `generateAndStorePDF()` - called after Pass 12 completes |
| `lib/pdf/professional-pdf-generator.ts` | Puppeteer-based PDF generation |

---

## 5. Data Flow Walkthrough

### Step 1: User Uploads Documents

**Location**: `app/dashboard/upload/page.tsx`

1. User enters company name and selects PDF files
2. Files are uploaded directly to Supabase Storage bucket `documents`
3. Path format: `{userId}/{timestamp}-{filename}.pdf`
4. Frontend calls `POST /api/upload-documents` with file paths

### Step 2: Report and Document Records Created

**Location**: `app/api/upload-documents/route.ts`

1. Creates document records in `documents` table with `file_path`
2. Creates report record in `reports` table with:
   - `user_id`
   - `company_name`
   - `report_status: 'pending'`
   - `document_id` pointing to first document
3. Links all documents to report by setting `report_id` on each document
4. Returns `reportId` to frontend

### Step 3: Frontend Redirects and Auto-Starts Processing

**Location**: `app/dashboard/reports/[id]/page.tsx`

1. Page loads, fetches report from database
2. Calls `GET /api/reports/{id}/process-pass` to get current state
3. If status is `pending` or `canResume: true`, auto-starts processing
4. Calls `POST /api/reports/{id}/process-pass?pass=1` for first pass

### Step 4: Pass 1 Executes (Document Classification)

**Location**: `lib/claude/orchestrator-v2.ts` - `executeSinglePass()`

1. Downloads PDFs from Supabase Storage via `downloadReportDocuments()`
2. Queries `documents` table for `report_id = X`
3. Falls back to `reports.document_id` if no documents found
4. Downloads each file from storage bucket
5. For each document, calls Claude API with PDF as base64
6. Merges outputs if multiple documents
7. Saves output to `pass_outputs["1"]` in database
8. Updates `report_status` to `pass_1_complete`

### Step 5: Passes 2-12 Execute in Chain

**Frontend**: After each pass completes, frontend calls next pass

**Passes 2-3**: Still need PDFs (extraction passes)
- Same document download process
- Prior pass outputs injected into prompts

**Passes 4-12**: Analysis passes (no PDFs needed)
- Load prior pass outputs from `pass_outputs`
- Build request with relevant prior data
- Call Claude API
- Save output to `pass_outputs["{N}"]`

### Step 6: Pass 12 Completes - Final Report Assembly

**Location**: `lib/claude/orchestrator-v2.ts` - `executeSinglePass()` line ~1032

1. After Pass 12 succeeds, `isComplete = true`
2. Reload all pass outputs from database
3. Call `assembleFinalReport()` which uses `transformToFinalReport()`
4. Save final report to `report_data` column
5. Update status to `completed`

### Step 7: PDF Generation

**Location**: `app/api/reports/[id]/process-pass/route.ts` line ~129

1. After `executeSinglePass()` returns with `isComplete: true`
2. Calls `generateAndStorePDF(reportId, companyName, finalReport)`
3. PDF generated with Puppeteer
4. Uploaded to Supabase Storage bucket `reports`
5. Path saved to `reports.pdf_path`

### Step 8: User Sees Final Report

**Location**: `app/dashboard/reports/[id]/page.tsx`

1. Report page detects `report_status: 'completed'`
2. Displays `EnhancedReportDisplay` component
3. User can click "Export PDF" to download

---

## 6. Pass-by-Pass Specification

### Pass 1: Document Classification & Company Profile

**Purpose**: Analyze uploaded documents to extract company information and classify the business

**Input**: PDF documents (base64 encoded)

**Processing**:
- Identify document type (tax return type, financial statement)
- Extract company profile (name, address, EIN, employees)
- Extract ownership information
- Classify industry (NAICS/SIC codes)
- Assess data quality

**Output Interface**: `Pass1Output`
```typescript
{
  pass_number: 1,
  pass_name: 'Document Classification & Company Profile',
  document_info: DocumentInfo,
  company_profile: CompanyProfile,
  ownership_info: OwnershipInfo,
  industry_classification: IndustryClassification,
  data_quality_assessment: { overall_quality, completeness_score, ... }
}
```

**Database**: Saves to `pass_outputs["1"]`

---

### Pass 2: Income Statement Extraction

**Purpose**: Extract detailed income statement data for all available years

**Input**: PDF documents + Pass 1 output (company context)

**Processing**:
- Extract revenue, COGS, expenses for each year
- Calculate gross profit, operating income, net income
- Identify trends and anomalies
- Map tax return line items to standard categories

**Output Interface**: `Pass2Output`
```typescript
{
  pass_number: 2,
  income_statements: IncomeStatementYear[],
  years_analyzed: number,
  trend_analysis: { revenue_cagr, profitability_trend, ... },
  key_metrics: { average_revenue, average_gross_margin, ... }
}
```

**Database**: Saves to `pass_outputs["2"]`

---

### Pass 3: Balance Sheet & Working Capital

**Purpose**: Extract balance sheet data and analyze working capital

**Input**: PDF documents + Pass 1 & 2 outputs

**Processing**:
- Extract assets, liabilities, equity
- Calculate working capital metrics
- Analyze liquidity ratios
- Assess asset quality

**Output Interface**: `Pass3Output`
```typescript
{
  pass_number: 3,
  balance_sheets: BalanceSheetYear[],
  working_capital_analysis: WorkingCapitalAnalysis[],
  trend_analysis: { total_assets_trend, ... },
  key_metrics: { most_recent_total_assets, ... },
  debt_analysis: { total_debt, debt_to_equity_ratio, ... }
}
```

**Database**: Saves to `pass_outputs["3"]`

---

### Pass 4: Industry Research & Competitive Analysis

**Purpose**: Analyze industry context, benchmarks, and competitive position

**Input**: Pass 1, 2, 3 outputs (no PDF needed)

**Processing**:
- Research industry trends and outlook
- Determine typical valuation multiples
- Compare company to industry benchmarks
- Assess competitive position (Porter's Five Forces, SWOT)

**Output Interface**: `Pass4Output`
```typescript
{
  pass_number: 4,
  industry_overview: IndustryOverview,
  competitive_landscape: CompetitiveLandscape,
  industry_benchmarks: IndustryBenchmarks,
  valuation_multiples: ValuationMultiples,
  industry_risk_assessment: { overall_industry_risk, industry_risk_premium, ... }
}
```

**Database**: Saves to `pass_outputs["4"]`

---

### Pass 5: Earnings Normalization

**Purpose**: Calculate normalized SDE and EBITDA with add-backs

**Input**: Pass 1, 2, 3, 4 outputs

**Processing**:
- Add back owner compensation, depreciation, interest
- Identify discretionary and non-recurring items
- Normalize rent, compensation to market rates
- Calculate weighted average earnings
- Assess earnings quality

**Output Interface**: `Pass5Output`
```typescript
{
  pass_number: 5,
  sde_calculations: SDECalculation[],
  ebitda_calculations: EBITDACalculation[],
  earnings_quality: EarningsQuality,
  summary: { most_recent_sde, weighted_average_sde, ... },
  recommended_benefit_stream: { metric, value, rationale }
}
```

**Database**: Saves to `pass_outputs["5"]`

---

### Pass 6: Risk Assessment

**Purpose**: Evaluate business risks and determine discount/cap rates

**Input**: Pass 1, 2, 3, 4, 5 outputs

**Processing**:
- Score financial, operational, strategic, external risks
- Identify company strengths and competitive advantages
- Build up discount rate (risk-free + ERP + size + industry + company-specific)
- Suggest DLOM, key person discounts

**Output Interface**: `Pass6Output`
```typescript
{
  pass_number: 6,
  company_risks: CompanyRiskAssessment,
  company_strengths: CompanyStrengths,
  risk_summary: { overall_risk_level, overall_risk_score, top_risk_factors, ... },
  risk_premium_calculation: RiskPremiumCalculation,
  suggested_discounts: { lack_of_marketability, key_person_discount, ... }
}
```

**Database**: Saves to `pass_outputs["6"]`

---

### Pass 7: Asset Approach Valuation

**Purpose**: Calculate adjusted net asset value

**Input**: Pass 3, 4, 6 outputs

**Processing**:
- Start with book value equity
- Adjust assets to fair market value
- Adjust liabilities for contingencies
- Calculate tangible book value
- Assess orderly/forced liquidation values

**Output Interface**: `Pass7Output`
```typescript
{
  pass_number: 7,
  asset_approach: AssetApproach,
  summary: { book_value_equity, total_adjustments, adjusted_net_asset_value, ... },
  method_applicability: { adjusted_book_value_applicable, ... },
  weighting_recommendation: { suggested_weight, rationale }
}
```

**Database**: Saves to `pass_outputs["7"]`

---

### Pass 8: Income Approach Valuation

**Purpose**: Calculate value using capitalization of earnings

**Input**: Pass 3, 4, 5, 6 outputs

**Processing**:
- Select benefit stream (SDE or EBITDA)
- Build up capitalization rate
- Apply single-period capitalization
- Adjust for excess/deficit working capital
- Run sensitivity analysis

**Output Interface**: `Pass8Output`
```typescript
{
  pass_number: 8,
  income_approach: IncomeApproach,
  sensitivity_analysis: { cap_rate_sensitivity, benefit_stream_sensitivity },
  weighting_recommendation: { suggested_weight, rationale }
}
```

**Database**: Saves to `pass_outputs["8"]`

---

### Pass 9: Market Approach Valuation

**Purpose**: Calculate value using comparable transactions

**Input**: Pass 1, 4, 5, 6 outputs

**Processing**:
- Research guideline transactions
- Analyze transaction multiples
- Apply rules of thumb
- Select appropriate multiples
- Reconcile market data

**Output Interface**: `Pass9Output`
```typescript
{
  pass_number: 9,
  market_approach: MarketApproach,
  data_quality: { transaction_data_quality, transaction_count, ... },
  weighting_recommendation: { suggested_weight, rationale }
}
```

**Database**: Saves to `pass_outputs["9"]`

---

### Pass 10: Value Synthesis & Reconciliation

**Purpose**: Weight approaches and conclude final value

**Input**: Pass 1, 3, 4, 5, 6, 7, 8, 9 outputs

**Processing**:
- Summarize each approach's indicated value
- Determine weighting based on data quality and applicability
- Apply discounts (DLOM, key person)
- Conclude final value range
- Perform sanity checks

**Output Interface**: `Pass10Output`
```typescript
{
  pass_number: 10,
  value_synthesis: ValueSynthesis,
  conclusion: {
    standard_of_value: 'fair_market_value',
    concluded_value: number,
    value_range: { low, high },
    confidence_level: 'high' | 'medium' | 'low'
  },
  key_value_drivers: [...],
  key_risks_to_value: [...]
}
```

**Database**: Saves to `pass_outputs["10"]`

---

### Pass 11: Executive Summary & Narratives

**Purpose**: Generate all report narratives

**Input**: Pass 1-10 outputs

**Processing**:
- Write executive summary
- Generate company overview narrative
- Write financial analysis sections
- Create valuation approach narratives
- Draft assumptions and limiting conditions

**Output Interface**: `Pass11Output`
```typescript
{
  pass_number: 11,
  executive_summary: ExecutiveSummary,
  report_narratives: ReportNarratives,
  report_metadata: { total_word_count, section_word_counts, ... }
}
```

**Database**: Saves to `pass_outputs["11"]`

---

### Pass 12: Quality Review & Error Correction

**Purpose**: Validate calculations and finalize report

**Input**: Pass 1-11 outputs

**Processing**:
- Check mathematical accuracy (balance sheet balances, percentages)
- Validate logical consistency
- Verify completeness
- Check reasonableness of values
- Generate quality score and grade

**Output Interface**: `Pass12Output`
```typescript
{
  pass_number: 12,
  quality_review: QualityReview,
  quality_summary: { total_checks, passed_checks, failed_checks, overall_quality_score, quality_grade },
  issues_found: ValidationIssue[],
  corrections_applied: Correction[],
  report_status: { ready_for_delivery, blocking_issues, warnings }
}
```

**Database**: Saves to `pass_outputs["12"]`

---

## 7. Known Issues & Fixes Applied

### Issue 1: JSON Markdown Wrapping

**Problem**: Claude sometimes returns JSON wrapped in markdown code fences (```json...```), causing parse errors.

**Fix**: Added `cleanJsonResponse()` helper in orchestrator-v2.ts that strips markdown before parsing. Also updated all 12 pass prompts with stronger "CRITICAL: Return ONLY valid JSON" instructions.

**Files Modified**:
- `lib/claude/orchestrator-v2.ts`
- All `lib/claude/prompts-v2/pass-*.ts` files

---

### Issue 2: Database Save Not Working (.single() Error)

**Problem**: Supabase `.single()` throws "Cannot coerce the result to a single JSON object" when 0 rows returned.

**Fix**: Changed all `.single()` calls to `.maybeSingle()` with explicit null handling.

**Files Modified**:
- `lib/claude/orchestrator-v2.ts` - `loadPassOutputsFromDatabase()`, `getProcessingState()`
- `app/api/reports/[id]/process-pass/route.ts`

---

### Issue 3: Document Retrieval Mismatch

**Problem**: Documents not found when querying by `report_id` due to RLS (Row Level Security) blocking service-side queries.

**Fix**:
1. Changed `lib/supabase/server.ts` to use `SUPABASE_SERVICE_ROLE_KEY` instead of anon key
2. Added fallback logic to query by `reports.document_id` if no documents found by `report_id`

**Files Modified**:
- `lib/supabase/server.ts`
- `lib/claude/orchestrator-v2.ts` - `downloadReportDocuments()`

---

### Issue 4: Frontend Calling Wrong Endpoint

**Problem**: Upload page was calling old `/api/reports/[id]/process-claude` endpoint instead of new `/api/reports/[id]/process-pass`.

**Fix**: Changed upload page to redirect to report page after upload. Report page handles chained pass processing.

**Files Modified**:
- `app/dashboard/upload/page.tsx`

---

### Issue 5: TypeScript Types Missing pass_outputs

**Problem**: TypeScript types didn't include `pass_outputs` column, causing type errors.

**Fix**: Added `pass_outputs: Json | null` to Row, Insert, and Update interfaces in types file.

**Files Modified**:
- `lib/supabase/types.ts`

---

### Issue 6: Force Mode for Testing

**Problem**: No way to skip expensive passes (1-3) for testing later passes.

**Fix**: Added `force=true` query parameter to skip prerequisite validation.

**Usage**: `POST /api/reports/{id}/process-pass?pass=4&force=true`

**Files Modified**:
- `app/api/reports/[id]/process-pass/route.ts`
- `lib/claude/orchestrator-v2.ts`

---

## 8. Testing Instructions

### Run Full 12-Pass Test

1. Go to `/dashboard/upload`
2. Enter a company name
3. Upload PDF tax return(s)
4. Click "Upload & Generate Report"
5. You'll be redirected to the report page
6. Watch the 12-pass progress indicators
7. Once complete, verify the final report displays correctly

### Test Individual Passes via Console

**Start Pass 1:**
```javascript
const token = (await supabase.auth.getSession()).data.session.access_token;
const response = await fetch('/api/reports/YOUR_REPORT_ID/process-pass?pass=1', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});
console.log(await response.json());
```

**Check State:**
```javascript
const state = await fetch('/api/reports/YOUR_REPORT_ID/process-pass').then(r => r.json());
console.log(state);
```

**Skip to Pass 4 (force mode):**
```javascript
const response = await fetch('/api/reports/YOUR_REPORT_ID/process-pass?pass=4&force=true', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Use Debug-Passes Endpoint

**Get summary of all passes:**
```
GET /api/reports/YOUR_REPORT_ID/debug-passes
```

**Get specific pass data:**
```
GET /api/reports/YOUR_REPORT_ID/debug-passes?pass=1
```

### Resume from Specific Pass

If processing failed at pass 6:
1. Check state: `GET /api/reports/{id}/process-pass`
2. Verify `completedPasses: [1,2,3,4,5]`
3. Retry: `POST /api/reports/{id}/process-pass?pass=6`

---

## 9. Environment Variables Required

### Required Variables

```env
# Anthropic (Claude API)
ANTHROPIC_API_KEY=sk-ant-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # CRITICAL: Required for server-side operations

# Base URL (for server-side redirects)
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### Optional Variables

```env
# OpenAI (legacy, not currently used)
OPENAI_API_KEY=sk-...

# Stripe (if payments enabled)
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

### Important Notes

- `SUPABASE_SERVICE_ROLE_KEY` **must** be set for the 12-pass system to work. Without it, document retrieval fails due to RLS.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend.

---

## 10. Deployment Notes

### Vercel Configuration

**vercel.json** (if needed):
```json
{
  "functions": {
    "app/api/reports/[id]/process-pass/route.ts": {
      "maxDuration": 800
    }
  }
}
```

Each pass route file includes:
```typescript
export const maxDuration = 800; // Vercel Pro max
export const dynamic = 'force-dynamic';
```

### Database Migrations

**Required Column**: Ensure `pass_outputs JSONB` column exists on reports table:

```sql
ALTER TABLE reports ADD COLUMN IF NOT EXISTS pass_outputs JSONB;
```

### Supabase Storage Buckets

Two buckets required:
1. `documents` - For uploaded PDF documents
2. `reports` - For generated PDF reports

Both should have appropriate RLS policies or be accessed via service role key.

### Vercel Environment Variables

Set all environment variables in Vercel dashboard:
- Settings → Environment Variables
- Add all variables from Section 9
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set for Production

### Build Verification

Before deploying, verify build passes:
```bash
npm run build
```

### Post-Deployment Checklist

1. ✅ Upload a test document
2. ✅ Verify Pass 1 starts and completes
3. ✅ Monitor Vercel function logs for errors
4. ✅ Verify all 12 passes complete
5. ✅ Check PDF download works
6. ✅ Verify final report displays correctly

---

## Appendix: Key Type References

### Pass Output Type Union
```typescript
type PassOutput =
  | Pass1Output | Pass2Output | Pass3Output
  | Pass4Output | Pass5Output | Pass6Output
  | Pass7Output | Pass8Output | Pass9Output
  | Pass10Output | Pass11Output | Pass12Output;
```

### Single Pass Result
```typescript
interface SinglePassResult {
  success: boolean;
  passNumber: number;
  passName: string;
  output?: PassOutput;
  isComplete: boolean;
  nextPass: number | null;
  processingTimeMs: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  error?: string;
  finalReport?: TwelvePassFinalReport;
}
```

### Processing State
```typescript
interface ProcessingState {
  currentPass: number;
  completedPasses: number[];
  status: string;
  progress: number;
  message: string;
  canResume: boolean;
  nextPass: number | null;
}
```

---

*This document should be updated whenever significant changes are made to the system architecture, API contracts, or data structures.*
