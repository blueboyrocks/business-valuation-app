# Business Valuation App - Technical Audit

**Date:** January 23, 2026
**Auditor:** Claude Code
**Codebase Version:** Current main branch

---

## Table of Contents

1. [Multi-Pass Architecture](#1-multi-pass-architecture)
2. [API Routes](#2-api-routes)
3. [Calculation Engine](#3-calculation-engine)
4. [PDF Generation](#4-pdf-generation)
5. [Database Schema](#5-database-schema)
6. [Knowledge/Skills Integration](#6-knowledgeskills-integration)
7. [Current Issues & Gaps](#7-current-issues--gaps)
8. [Key File Listing](#8-key-file-listing)

---

## 1. Multi-Pass Architecture

### Overview

The valuation pipeline uses a **13-pass architecture** with an additional **11 narrative sub-passes** (11a-11k), totaling **23 distinct AI processing steps**.

### Pass Structure

| Pass | Name | Phase | Purpose |
|------|------|-------|---------|
| 1 | Document Classification & Company Profile | Extraction | Identify documents, extract company info, classify industry |
| 2 | Income Statement Extraction | Extraction | Extract detailed income statement for all years |
| 3 | Balance Sheet & Working Capital | Extraction | Extract balance sheet, calculate working capital metrics |
| 4 | Industry Analysis | Analysis | Analyze industry trends, competitive position, benchmarks (supports web search) |
| 5 | Earnings Normalization | Analysis | Calculate SDE and EBITDA with adjustments |
| 6 | Risk Assessment | Analysis | Score risk factors, determine discount/cap rates |
| 7 | Asset Approach Valuation | Valuation | Calculate adjusted net asset value |
| 8 | Income Approach Valuation | Valuation | Apply capitalization of earnings method |
| 9 | Market Approach Valuation | Valuation | Apply transaction multiples and rules of thumb |
| 10 | Value Synthesis | Synthesis | Weight approaches, apply discounts, conclude value |
| 11 | Legacy Narratives | Narrative | (Deprecated) Generate all report narratives in single pass |
| 12 | Economic Conditions | Research | Current interest rates, inflation, market sentiment (supports web search) |
| 13 | Comparable Transactions | Research | Recent M&A deals in industry (supports web search) |

### Narrative Sub-Passes (11a-11k)

Each narrative pass has a designated **expert persona**:

| Pass | Name | Word Count | Expert Persona | Run Order |
|------|------|------------|----------------|-----------|
| 11a | Executive Summary | 1,000-1,200 | Senior Valuation Partner | 11 (LAST) |
| 11b | Company Overview | 600-800 | Senior Business Analyst | 1 |
| 11c | Financial Analysis | 1,000-1,200 | CFO / Financial Analyst | 2 |
| 11d | Industry Analysis | 600-800 | Industry Research Analyst | 3 |
| 11e | Risk Assessment | 700-900 | M&A Due Diligence Expert | 4 |
| 11f | Asset Approach | 500-600 | Certified Appraiser (ASA) | 5 |
| 11g | Income Approach | 500-600 | CVA Valuation Analyst | 6 |
| 11h | Market Approach | 500-600 | M&A Transaction Advisor | 7 |
| 11i | Valuation Synthesis | 700-900 | Lead Valuation Partner | 8 |
| 11j | Assumptions & Conditions | 400-500 | Valuation Compliance Expert | 9 |
| 11k | Value Enhancement | 600-800 | Strategy Consultant | 10 |

**Execution Order:** 11b → 11c → 11d → 11e → 11f → 11g → 11h → 11i → 11j → 11k → 11a (Executive Summary runs LAST to synthesize all others)

### File Structure

```
lib/claude/
├── orchestrator-v2.ts        # Main 12-pass pipeline orchestration (3,211 lines)
├── orchestrator.ts           # Legacy orchestrator (858 lines)
├── pass-executor.ts          # Executes individual passes and narratives (353 lines)
├── pass-configs.ts           # Pass configuration and prompt builders (686 lines)
├── knowledge-router.ts       # Dynamic knowledge injection (2,711 lines)
├── embedded-knowledge.ts     # Embedded valuation data (3,101 lines)
├── types-v2.ts               # Type definitions for passes (2,214 lines)
├── transform-to-final-report.ts  # Transforms outputs to final report (1,141 lines)
└── prompts-v2/
    ├── index.ts              # Exports all prompts (338 lines)
    ├── pass-01-document-classification.ts
    ├── pass-02-income-statement.ts
    ├── pass-03-balance-sheet.ts
    ├── pass-04-industry-analysis.ts
    ├── pass-04-industry-with-search.ts  # Web search variant
    ├── pass-05-earnings-normalization.ts
    ├── pass-06-risk-assessment.ts
    ├── pass-07-asset-approach.ts
    ├── pass-08-income-approach.ts
    ├── pass-09-market-approach.ts
    ├── pass-10-value-synthesis.ts
    ├── pass-11-narratives.ts (legacy)
    ├── pass-11-narratives-complete.ts
    ├── pass-11a-executive-summary.ts
    ├── pass-11b-company-overview.ts
    ├── pass-11c-financial-analysis.ts
    ├── pass-11d-industry-analysis.ts
    ├── pass-11e-risk-assessment.ts
    ├── pass-11f-asset-approach.ts
    ├── pass-11g-income-approach.ts
    ├── pass-11h-market-approach.ts
    ├── pass-11i-valuation-synthesis.ts
    ├── pass-11j-assumptions.ts
    ├── pass-11k-recommendations.ts
    ├── pass-12-economic-conditions.ts
    ├── pass-12-quality-review.ts
    └── pass-13-comparable-transactions.ts
```

### Orchestration Code (orchestrator-v2.ts)

Key orchestration function:

```typescript
export async function runTwelvePassValuation(
  reportId: string,
  pdfBase64: string[],
  onProgress?: (pass: number, message: string, percent: number) => void
): Promise<TwelvePassOrchestrationResult>
```

Features:
- Sequential execution with dependency management
- Dynamic knowledge injection for each pass
- Database persistence after each pass
- Retry logic with exponential backoff (MAX_RETRIES = 2)
- Progress callbacks for UI updates
- Token and cost tracking

Model used: `claude-sonnet-4-20250514`

---

## 2. API Routes

### All Routes (27 total)

| Route | Lines | Purpose |
|-------|-------|---------|
| `/api/upload-documents` | 209 | Handle document uploads, create reports |
| `/api/naics-suggest` | 171 | AI-powered NAICS code suggestions |
| `/api/analyze-documents` | 347 | Legacy document analysis |
| `/api/reports/[id]/process-claude` | 498 | **PRIMARY** - Run 12-pass pipeline |
| `/api/reports/[id]/process-multipass` | 703 | Alternative multi-pass processor |
| `/api/reports/[id]/process-18pass` | 803 | Extended 18-pass variant (experimental) |
| `/api/reports/[id]/process-16pass` | 386 | 16-pass variant |
| `/api/reports/[id]/process-13pass` | 354 | 13-pass variant |
| `/api/reports/[id]/process-pass` | 219 | Execute single pass |
| `/api/reports/[id]/process-skills` | 661 | Process with skills integration |
| `/api/reports/[id]/process` | 465 | Legacy processing route |
| `/api/reports/[id]/rerun-passes` | 454 | **NEW** - Selective pass re-run |
| `/api/reports/[id]/regenerate` | 515 | Regenerate PDF from report_data |
| `/api/reports/[id]/status` | 396 | Get processing status |
| `/api/reports/[id]/update-section` | 100 | Update individual report section |
| `/api/reports/[id]/extract-documents` | 80 | Extract text from PDFs |
| `/api/reports/[id]/download-pdf` | 134 | Download generated PDF |
| `/api/reports/[id]/export` | 55 | Export report data |
| `/api/reports/[id]/debug` | 159 | Debug report state |
| `/api/reports/[id]/debug-passes` | 94 | Debug pass outputs |
| `/api/reports/[id]/debug-status` | 75 | Debug status details |
| `/api/debug/report-data/[id]` | 167 | Debug report_data |
| `/api/test-*` | various | Test endpoints |
| `/api/diagnostics/env` | 14 | Environment diagnostics |

### Primary Processing Flow

1. **Upload:** `POST /api/upload-documents`
   - Accepts files already uploaded to Supabase Storage
   - Creates report record with `status: pending`
   - Stores user-provided industry in `pass_outputs.user_provided`

2. **Process:** `POST /api/reports/[id]/process-claude`
   - Fetches PDFs from Supabase Storage
   - Runs 12-pass pipeline via `runTwelvePassValuation()`
   - Saves `pass_outputs` and `report_data` after each pass
   - Generates PDF on completion

3. **Re-run:** `POST /api/reports/[id]/rerun-passes`
   - Accepts `{ passes: number[], narrativePasses: string[], options: { useWebSearch, regenerateAfter } }`
   - Runs selected passes in order
   - Web search available for passes 4, 12, 13
   - Runs quality check at end

---

## 3. Calculation Engine

### Architecture

The app has **TWO calculation engines**:

1. **`lib/valuation/engine.ts`** (371 lines) - Simpler, standalone engine
2. **`lib/calculations/calculation-engine.ts`** (212 lines) - Full calculation orchestrator

### Engine Philosophy

> "AI only extracts data and provides qualitative analysis. Calculations are done with precise math (no rounding until final display)."

### `lib/valuation/engine.ts` - Key Functions

```typescript
// Calculate EBITDA
export function calculateEBITDA(financial: ExtractedFinancialData): number {
  return financial.pretax_income +
         financial.interest_expense +
         financial.depreciation_amortization;
}

// Calculate SDE
export function calculateSDE(financial: ExtractedFinancialData): number {
  return financial.pretax_income +
         financial.owner_compensation +
         financial.interest_expense +
         financial.depreciation_amortization;
}

// Main calculation function
export function calculateValuation(
  financial: ExtractedFinancialData,
  industry: IndustryData
): CalculatedValuation
```

Features:
- Loads industry multiples from `industry-multiples-database.json`
- Calculates all three approaches deterministically
- Applies weights based on asset intensity
- Applies valuation floors (can't be below asset value)
- Returns detailed calculation notes for transparency

### `lib/calculations/calculation-engine.ts` - Full Orchestrator

```typescript
export function runCalculationEngine(inputs: CalculationEngineInputs): CalculationEngineOutput {
  // 1. Calculate Normalized Earnings (SDE and EBITDA)
  const earnings = calculateNormalizedEarnings(inputs.financials, fairMarketSalary);

  // 2. Calculate Asset Approach
  const assetApproach = calculateAssetApproach({ balance_sheet, weight, rationale });

  // 3. Calculate Income Approach
  const incomeApproach = calculateIncomeApproach({ weighted_sde, weighted_ebitda, cap_rate_components });

  // 4. Calculate Market Approach
  const marketApproach = calculateMarketApproach({ multiples, risk_factors });

  // 5. Calculate Synthesis
  const synthesis = calculateValuationSynthesis({ values, weights, discounts });

  // 6. Format Tables for Narrative Passes
  return { earnings, asset_approach, income_approach, market_approach, synthesis, formatted_tables };
}
```

### Calculation Files

```
lib/calculations/
├── calculation-engine.ts          # Master orchestration
├── calculation-orchestrator.ts    # Alternative orchestrator
├── earnings-calculator.ts         # SDE/EBITDA calculations
├── asset-approach-calculator.ts   # Asset approach
├── income-approach-calculator.ts  # Income approach (cap rate build-up)
├── market-approach-calculator.ts  # Market approach (multiple selection)
├── synthesis-calculator.ts        # Final synthesis and discounts
├── risk-scoring-calculator.ts     # Risk factor scoring
├── kpi-calculator.ts             # Financial KPIs
├── working-capital-calculator.ts  # Working capital analysis
├── data-quality-scorer.ts        # Data completeness scoring
├── tax-form-validator.ts         # Tax form validation
├── pass-data-mapper.ts           # Maps pass outputs to engine inputs
├── types.ts                      # TypeScript types
├── extended-types.ts             # Extended types
├── utils.ts                      # Utility functions
└── index.ts                      # Exports
```

---

## 4. PDF Generation

### Generator Files

```
lib/pdf/
├── professional-pdf-generator.ts  # Primary generator (836 lines)
├── bizequity-pdf-generator.ts     # Alternative style (722 lines)
├── puppeteer-generator.ts         # Puppeteer wrapper (561 lines)
├── generator.ts                   # Legacy generator (592 lines)
├── templateGenerator.ts           # HTML template builder (882 lines)
├── puppeteer-chart-renderer.ts    # Chart.js via Puppeteer
├── quickchart-generator.ts        # QuickChart.io fallback
├── chart-generator.ts             # Chart utilities
├── chartGenerator.ts              # Alternative charts
└── auto-generate.ts               # Auto-generation utility
```

### Primary Generator: `ProfessionalPDFGenerator`

```typescript
export class ProfessionalPDFGenerator {
  async generate(companyName: string, reportData: ReportData, generatedDate: string): Promise<Buffer>
}
```

**Technology Stack:**
- `puppeteer-core` for PDF rendering
- `@sparticuz/chromium` for serverless Chrome
- `marked` for markdown-to-HTML conversion
- `Chart.js` via Puppeteer for charts

**Report Data Interface:**

```typescript
interface ReportData {
  // Valuation outputs
  valuation_amount?: number;
  asset_approach_value?: number;
  income_approach_value?: number;
  market_approach_value?: number;

  // Financial data
  annual_revenue?: number;
  pretax_income?: number;
  total_assets?: number;
  total_liabilities?: number;
  // ... more financial fields

  // Narrative sections
  executive_summary?: string;
  company_profile?: string;
  industry_analysis?: string;
  financial_analysis?: string;
  asset_approach_analysis?: string;
  income_approach_analysis?: string;
  market_approach_analysis?: string;
  valuation_reconciliation?: string;
  risk_assessment?: string;
  strategic_insights?: string;

  // Metadata
  naics_code?: string;
  industry_name?: string;
  valuation_date?: string;
}
```

**Charts Generated:**
1. Valuation Approaches Chart (bar chart)
2. Financial Metrics Chart
3. KPI Performance Chart

---

## 5. Database Schema

### Tables (5 total)

#### `reports` - Main report table

```typescript
{
  id: string;                    // UUID
  user_id: string;               // FK to auth.users
  document_id: string | null;    // FK to documents
  company_name: string;
  report_status: 'pending' | 'processing' | 'completed' | 'failed' | 'error' | ...;
  report_data: Json | null;      // Aggregated report data for display/PDF
  pass_outputs: Json | null;     // Raw outputs from each pass
  calculation_results: Json | null;  // Deterministic calculation results
  executive_summary: string | null;
  valuation_amount: number | null;
  valuation_method: string | null;
  current_pass: number | null;
  processing_progress: number | null;
  processing_message: string | null;
  pdf_path: string | null;
  tokens_used: number | null;
  processing_cost: number | null;
  processing_time_ms: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}
```

#### `documents` - Uploaded files

```typescript
{
  id: string;
  user_id: string;
  report_id: string | null;
  file_name: string;
  file_path: string;           // Path in Supabase Storage
  file_size: number;
  mime_type: string;
  company_name: string | null;
  upload_status: 'pending' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}
```

#### `profiles` - User profiles

```typescript
{
  id: string;          // Same as auth.users.id
  email: string;
  full_name: string | null;
  company: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}
```

#### `document_extractions` - Extraction results

```typescript
{
  id: string;
  document_id: string;
  report_id: string;
  extracted_data: Json | null;
  extraction_status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message: string | null;
  created_at: string;
  updated_at: string;
}
```

#### `payments` - Payment records

```typescript
{
  id: string;
  user_id: string;
  report_id: string | null;
  amount: number;
  currency: string;
  payment_status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  payment_provider: string | null;
  payment_provider_id: string | null;
  created_at: string;
  updated_at: string;
}
```

### Pass Outputs Structure (in `reports.pass_outputs`)

```json
{
  "user_provided": {
    "industry_classification": {
      "naics_code": "541330",
      "naics_description": "Engineering Services",
      "sector": "Professional, Scientific, and Technical Services",
      "source": "user_input",
      "confidence": 1.0
    }
  },
  "1": { /* Pass 1 output - company profile, industry */ },
  "2": { /* Pass 2 output - income statements */ },
  "3": { /* Pass 3 output - balance sheets */ },
  "4": { /* Pass 4 output - industry analysis */ },
  "5": { /* Pass 5 output - normalized earnings */ },
  "6": { /* Pass 6 output - risk assessment */ },
  "7": { /* Pass 7 output - asset approach */ },
  "8": { /* Pass 8 output - income approach */ },
  "9": { /* Pass 9 output - market approach */ },
  "10": { /* Pass 10 output - value synthesis */ },
  "12": { /* Pass 12 output - economic conditions */ },
  "13": { /* Pass 13 output - comparable transactions */ },
  "narratives": {
    "narratives": { /* Combined narrative content */ },
    "word_counts": { /* Word counts per section */ },
    "pass_results": {
      "11a": { "content": "...", "word_count": 1150 },
      "11b": { "content": "...", "word_count": 742 },
      // ... etc
    }
  }
}
```

---

## 6. Knowledge/Skills Integration

### Knowledge Router (`lib/claude/knowledge-router.ts`)

Provides embedded valuation knowledge dynamically injected into prompts:

```typescript
// Sector multiples from BizBuySell 2025
const SECTOR_MULTIPLES: Record<string, SectorMultipleData> = {
  automotive_and_boat: { sde_multiple: 3.09, revenue_multiple: 0.70, ... },
  beauty_and_personal_care: { sde_multiple: 2.10, revenue_multiple: 0.53, ... },
  building_and_construction: { sde_multiple: 2.62, revenue_multiple: 0.58, ... },
  // ... 15 sectors total
};
```

### Embedded Knowledge (`lib/claude/embedded-knowledge.ts`)

Contains:
- Capitalization rate data
- DLOM studies
- Valuation standards (USPAP, ASA, AICPA)
- Common add-backs with detailed guidance
- Working capital benchmarks by industry
- Sector multiples
- Detailed industry multiples (NAICS-level)
- Risk assessment framework
- Tax form extraction guides
- Helper functions:
  - `getSizePremium(revenue)`
  - `getIndustryRiskPremium(naicsCode)`
  - `getSuggestedDLOM(factors)`
  - `getWorkingCapitalBenchmark(naicsCode)`

### Skills Integration

The `process-skills` route (661 lines) integrates with a business-valuation-expert skill, though this appears to be an alternative processing path not currently primary.

---

## 7. Current Issues & Gaps

### No TODO/FIXME Comments Found

The codebase has no explicit TODO markers. The "XXX" patterns found are just format examples in prompts (e.g., `$XXX,XXX`).

### Identified Gaps

1. **Multiple Processing Routes:** There are 6+ different process routes (`process-claude`, `process-multipass`, `process-18pass`, `process-16pass`, `process-13pass`, `process-skills`). Only `process-claude` appears to be the primary path.

2. **Legacy Code:**
   - `orchestrator.ts` (legacy) vs `orchestrator-v2.ts` (current)
   - Pass 11 (legacy single narrative pass) vs 11a-11k (new individual passes)
   - Multiple PDF generators with unclear primary usage

3. **Calculation Engine Duplication:**
   - `lib/valuation/engine.ts` - simpler engine
   - `lib/calculations/calculation-engine.ts` - full orchestrator
   - Both appear functional; unclear which is authoritative

4. **Pass 11 Ambiguity:**
   - Pass 11 (legacy) still exists but is marked "kept for backwards compatibility"
   - 11a-11k are the new individual narrative passes
   - Some routes may still use legacy Pass 11

5. **Web Search Passes:**
   - Passes 4, 12, 13 support web search
   - Requires explicit `useWebSearch: true` option
   - Web search tool type: `web_search_20250305`

### Recently Fixed Issues

1. **Array.isArray checks** - Fixed crashes when pass data fields aren't arrays (11b, 11c, 11d, 11e, 11f, 11h, 11j, 11k)
2. **Timeout increased** - `rerun-passes` route now has 800s timeout (was 300s)
3. **JSON parsing** - Added fallback JSON extraction from mixed content responses

---

## 8. Key File Listing

### `/lib/` Directory (by line count, top 30)

| Lines | File |
|-------|------|
| 3,211 | `lib/claude/orchestrator-v2.ts` |
| 3,101 | `lib/claude/embedded-knowledge.ts` |
| 2,711 | `lib/claude/knowledge-router.ts` |
| 2,214 | `lib/claude/types-v2.ts` |
| 1,141 | `lib/claude/transform-to-final-report.ts` |
| 928 | `lib/claude/prompts-v2/pass-06-risk-assessment.ts` |
| 882 | `lib/pdf/templateGenerator.ts` |
| 858 | `lib/claude/orchestrator.ts` |
| 836 | `lib/pdf/professional-pdf-generator.ts` |
| 823 | `lib/claude/prompts/pass-6-synthesis.ts` |
| 784 | `lib/valuation.ts` |
| 729 | `lib/claude/prompts-v2/pass-05-earnings-normalization.ts` |
| 722 | `lib/pdf/bizequity-pdf-generator.ts` |
| 721 | `lib/claude/prompts/pass-5-valuation.ts` |
| 718 | `lib/claude/prompts-v2/pass-12-quality-review.ts` |
| 686 | `lib/claude/pass-configs.ts` |
| 679 | `lib/calculations/data-quality-scorer.ts` |
| 631 | `lib/claude/prompts/pass-4-risk.ts` |
| 621 | `lib/claude/final-report-schema.ts` |
| 609 | `lib/calculations/kpi-calculator.ts` |
| 597 | `lib/claude/types.ts` |
| 592 | `lib/pdf/generator.ts` |
| 590 | `lib/claude/prompts-v2/pass-04-industry-analysis.ts` |
| 575 | `lib/calculations/extended-types.ts` |
| 561 | `lib/pdf/puppeteer-generator.ts` |
| 537 | `lib/extraction.ts` |
| 534 | `lib/claude/prompts-v2/pass-03-balance-sheet.ts` |
| 522 | `lib/claude/prompts-v2/pass-11-narratives.ts` |
| 516 | `lib/claude/prompts/pass-3-earnings.ts` |
| 514 | `lib/claude/function-definitions.ts` |

### `/app/api/` Directory (by line count)

| Lines | Route |
|-------|-------|
| 803 | `reports/[id]/process-18pass/route.ts` |
| 703 | `reports/[id]/process-multipass/route.ts` |
| 661 | `reports/[id]/process-skills/route.ts` |
| 515 | `reports/[id]/regenerate/route.ts` |
| 498 | `reports/[id]/process-claude/route.ts` |
| 465 | `reports/[id]/process/route.ts` |
| 454 | `reports/[id]/rerun-passes/route.ts` |
| 400 | `analyze-documents/route_old.ts` |
| 396 | `reports/[id]/status/route.ts` |
| 386 | `reports/[id]/process-16pass/route.ts` |
| 354 | `reports/[id]/process-13pass/route.ts` |
| 347 | `analyze-documents/route.ts` |
| 219 | `reports/[id]/process-pass/route.ts` |
| 209 | `upload-documents/route.ts` |
| 171 | `naics-suggest/route.ts` |

### Total Counts

- **TypeScript files in `/lib/`:** ~90 files
- **TypeScript files in `/app/api/`:** 27 files
- **Total prompt files:** 24 files
- **Total calculation files:** 17 files (including tests)

---

## Summary

The Business Valuation App is a sophisticated multi-pass AI processing pipeline that:

1. **Extracts** financial data from PDF documents (Passes 1-3)
2. **Analyzes** industry context, earnings, and risk (Passes 4-6)
3. **Values** the business using three approaches (Passes 7-9)
4. **Synthesizes** a final value with discounts (Pass 10)
5. **Narrates** the findings through expert personas (Passes 11a-11k)
6. **Researches** current market conditions with web search (Passes 12-13)
7. **Calculates** deterministically via TypeScript engines
8. **Generates** professional PDF reports via Puppeteer

The primary processing path is:
`/api/upload-documents` → `/api/reports/[id]/process-claude` → `orchestrator-v2.ts` → PDF generation

Re-runs can be done via `/api/reports/[id]/rerun-passes` with selective pass selection and web search options.
