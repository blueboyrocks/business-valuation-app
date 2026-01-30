/**
 * Pass 1: Document Classification & Company Profile
 *
 * @deprecated This pass is being replaced by Modal/pdfplumber extraction.
 * When FEATURE_MODAL_EXTRACTION=true, this pass is skipped and data comes
 * from the pre-extracted document_extractions table instead.
 * This file is kept for backward compatibility and fallback scenarios.
 *
 * This pass analyzes the uploaded document(s) to:
 * - Identify document type(s) and tax year(s)
 * - Extract company profile information
 * - Classify industry using NAICS/SIC codes
 * - Assess data quality and completeness
 */

import { Pass1Output } from '../types-v2';

export const PASS_1_SYSTEM_PROMPT = `You are an expert financial document analyst specializing in business valuation. Your task is to carefully examine uploaded documents (tax returns, financial statements, or other business records) and extract foundational information about the company.

You must be extremely precise in your extractions. Every piece of data you report must be directly observable in the document. If information is not clearly present, mark it as null or indicate uncertainty.

CRITICAL: Return ONLY valid JSON. Do NOT wrap in markdown code fences. Do NOT include \`\`\`json or \`\`\` tags. Start directly with { and end with }.`;

export const PASS_1_USER_PROMPT = `Analyze the provided document(s) and extract comprehensive information about the company and document characteristics.

## YOUR TASK

Carefully review every page of the uploaded document. Extract and organize information into the following categories:

### 1. DOCUMENT INFORMATION
Identify what type of document(s) you are analyzing:
- **Document Type**: Classify as one of: tax_return_1120, tax_return_1120s, tax_return_1065, tax_return_schedule_c, financial_statement, compiled_statement, reviewed_statement, audited_statement, internal_statement, or other
- **Tax Year/Fiscal Year**: What period does this document cover?
- **Document Date**: When was the document prepared or filed?
- **Preparer Information**: If a tax return, note the preparer's name, firm, and PTIN if visible
- **Pages Analyzed**: Count total pages you reviewed
- **Schedules Present**: List all schedules, attachments, or supplementary pages (e.g., "Schedule K-1", "Balance Sheet", "Depreciation Schedule")
- **Missing Schedules**: Note any referenced but not included schedules
- **Extraction Quality**: Rate as excellent, good, fair, or poor based on document clarity and completeness

### 2. COMPANY PROFILE (ALL FIELDS REQUIRED)
Extract all company information - use "NOT FOUND IN DOCUMENTS" for any field that cannot be determined:

**CRITICAL FIELDS (must extract or explicitly mark as NOT FOUND):**
- **Legal Name**: Exact legal name as shown on documents (from Form header)
- **DBA Names**: Any "doing business as" names (if none, state "None identified")
- **EIN**: Employer Identification Number (format: XX-XXXXXXX) - Form 1120-S Box B
- **State of Incorporation**: Where the entity was formed - Form 1120-S Box E
- **Date of Incorporation**: When the entity was formed (if determinable)
- **Business Address**: Full street address, city, state, ZIP from form header
- **Business Description**: From tax return "Business Activity" or description field
- **Principal Business Activity Code**: From Form 1120-S Box A (this is NAICS)
- **Products/Services**: List specific products or services mentioned
- **Years in Business**: Calculate from incorporation date if available
- **Number of Employees**: From Form 1120-S Schedule K, Line 13 or other sources
- **Full-time, Part-time, Contractors**: Break down if identifiable

**IMPORTANT**: If a field is not found in the documents, you MUST set the value to "NOT FOUND IN DOCUMENTS" rather than leaving blank or guessing.

### 3. OWNERSHIP INFORMATION
- **Entity Type**: Sole proprietorship, partnership, LLC, S-corp, C-corp
- **Owners**: List each owner with name, title, ownership percentage, and whether active in business
- **Total Shares Outstanding**: If applicable
- **Compensation**: Officer/owner compensation amounts from tax return

### 4. INDUSTRY CLASSIFICATION (MANDATORY)
Determine the most appropriate industry classification with FULL 6-digit precision:

**REQUIRED - Extract or Determine:**
- **NAICS Code**: MUST be full 6-digit North American Industry Classification System code
  - First preference: Use the code from Form 1120-S Box A "Principal Business Activity Code"
  - If not on form: Derive from business description using official NAICS tables
  - Example: "541611" not "5416" or "54"
- **NAICS Description**: Official description for that EXACT 6-digit code
- **SIC Code**: 4-digit Standard Industrial Classification code
  - Cross-reference from NAICS or determine from business description
  - Example: "8742" for Management Consulting
- **SIC Description**: Official SIC description
- **Industry Sector**: Broad category (e.g., "Professional Services", "Manufacturing", "Healthcare")
- **Industry Subsector**: More specific category
- **Business Type**: manufacturing, wholesale, retail, service, construction, professional_services, healthcare, technology, hospitality, transportation, real_estate, or other
- **Classification Rationale**: 2-3 sentences explaining why you chose this classification based on the business activities described

### 5. DATA QUALITY ASSESSMENT
Evaluate what you have to work with:
- **Overall Quality**: Rate excellent, good, fair, or poor
- **Completeness Score**: 0-100 based on how much required data is present
- **Reliability Score**: 0-100 based on data consistency and source reliability
- **Missing Critical Data**: List any essential information that's missing
- **Data Limitations**: Note any issues that may affect valuation accuracy
- **Assumptions Required**: List assumptions that must be made due to missing data

## SOURCE CITATION REQUIREMENTS

For every piece of extracted data, note where you found it:
- For tax returns: Cite specific line numbers (e.g., "1120-S Page 1, Line 1a")
- For financial statements: Cite the statement name and line item
- For other documents: Cite page number and section

## OUTPUT FORMAT

Output ONLY valid JSON matching this structure (no markdown, no explanation):

{
  "pass_number": 1,
  "pass_name": "Document Classification & Company Profile",
  "document_info": {
    "document_type": "tax_return_1120s",
    "document_subtype": "S Corporation Income Tax Return",
    "tax_year": 2023,
    "fiscal_year_end": "12/31",
    "document_date": "2024-03-15",
    "preparer_info": {
      "name": "John Smith, CPA",
      "firm": "Smith & Associates",
      "ptin": "P00123456",
      "ein": "12-3456789"
    },
    "pages_analyzed": 25,
    "extraction_quality": "good",
    "quality_notes": ["Some pages slightly blurry", "All schedules present"],
    "schedules_present": ["Schedule K", "Schedule K-1", "Schedule L", "Schedule M-1", "Form 4562"],
    "missing_schedules": []
  },
  "company_profile": {
    "legal_name": "ABC Services Inc",
    "dba_names": ["ABC Consulting"],
    "ein": "12-3456789",
    "state_of_incorporation": "Delaware",
    "date_incorporated": "2015-06-01",
    "business_address": {
      "street": "123 Main Street, Suite 100",
      "city": "Anytown",
      "state": "CA",
      "zip": "90210",
      "country": "USA"
    },
    "mailing_address": null,
    "phone": "555-123-4567",
    "website": "www.abcservices.com",
    "years_in_business": 9,
    "number_of_employees": {
      "full_time": 15,
      "part_time": 3,
      "contractors": 2,
      "total_fte": 17
    },
    "business_description": "Management consulting services for small and medium businesses",
    "products_services": ["Strategic planning", "Operations consulting", "Financial advisory"],
    "primary_revenue_sources": [
      {"source": "Consulting fees", "percentage_of_revenue": 80},
      {"source": "Training workshops", "percentage_of_revenue": 20}
    ],
    "geographic_markets": ["California", "Nevada", "Arizona"],
    "customer_concentration": {
      "top_customer_percentage": 15,
      "top_5_customers_percentage": 45,
      "customer_count_estimate": 50,
      "recurring_revenue_percentage": 30
    },
    "key_personnel": [
      {
        "name": "Jane Doe",
        "title": "President/CEO",
        "years_with_company": 9,
        "key_person_risk": "high",
        "responsibilities": ["Client relationships", "Business development", "Strategic direction"]
      }
    ],
    "real_estate_owned": false,
    "intellectual_property": ["Proprietary consulting methodology"],
    "licenses_permits": ["State business license"],
    "litigation_pending": false,
    "litigation_details": null
  },
  "ownership_info": {
    "ownership_type": "s_corp",
    "owners": [
      {
        "name": "Jane Doe",
        "title": "President",
        "ownership_percentage": 60,
        "active_in_business": true,
        "compensation": 180000,
        "related_party_transactions": []
      },
      {
        "name": "John Doe",
        "title": "Vice President",
        "ownership_percentage": 40,
        "active_in_business": true,
        "compensation": 120000,
        "related_party_transactions": []
      }
    ],
    "total_shares_outstanding": 1000,
    "voting_vs_nonvoting": null,
    "buy_sell_agreement_exists": null,
    "succession_plan_exists": null
  },
  "industry_classification": {
    "naics_code": "541611",
    "naics_description": "Administrative Management and General Management Consulting Services",
    "sic_code": "8742",
    "sic_description": "Management Consulting Services",
    "industry_sector": "Professional Services",
    "industry_subsector": "Management Consulting",
    "business_type": "professional_services",
    "classification_confidence": "high",
    "classification_rationale": "Business description on tax return explicitly states management consulting services. Revenue is primarily from consulting fees. NAICS 541611 is the most specific classification for general management consulting.",
    "alternative_classifications": [
      {"naics_code": "541618", "description": "Other Management Consulting Services", "fit_score": 7}
    ]
  },
  "data_quality_assessment": {
    "overall_quality": "good",
    "completeness_score": 85,
    "reliability_score": 90,
    "missing_critical_data": ["Detailed customer list", "Employee roster"],
    "data_limitations": ["Only one year of tax data provided", "No interim financial statements"],
    "assumptions_required": ["Assumed fiscal year matches calendar year based on tax return dates"]
  },
  "extraction_metadata": {
    "processing_time_ms": 0,
    "tokens_used": 0,
    "model_version": "claude-3"
  }
}

## CRITICAL INSTRUCTIONS

1. **Accuracy Over Completeness**: Only report data you can directly observe. Use null for missing fields rather than guessing.

2. **Exact Values**: Copy numbers and text exactly as shown. Do not round or estimate.

3. **Source Everything**: Every data point should be traceable to a specific location in the document.

4. **Flag Uncertainties**: If you're unsure about any classification or extraction, note it in quality_notes.

5. **Multiple Documents**: If analyzing multiple years or document types, note this in document_info.

6. **NAICS Precision**: Use the most specific 6-digit NAICS code that fits. Explain your reasoning.

7. **Output ONLY JSON**: Your entire response must be valid JSON. No text before or after.

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

Now analyze the provided document(s) and output the JSON result.`;

export const pass1PromptConfig = {
  passNumber: 1,
  passName: 'Document Classification & Company Profile',
  systemPrompt: PASS_1_SYSTEM_PROMPT,
  userPrompt: PASS_1_USER_PROMPT,
  expectedOutputType: 'Pass1Output' as const,
  maxTokens: 4096,
  temperature: 0.1, // Low temperature for factual extraction
};

export default pass1PromptConfig;
