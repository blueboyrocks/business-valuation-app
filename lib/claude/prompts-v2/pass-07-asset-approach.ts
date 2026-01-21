/**
 * Pass 7: Asset Approach Valuation
 *
 * This pass applies the asset-based approach to valuation:
 * - Start with book value from balance sheet
 * - Adjust each asset category to fair market value
 * - Adjust liabilities as needed
 * - Calculate adjusted net asset value
 * - Assess applicability and assign weighting
 */

import { Pass7Output } from '../types-v2';

export const PASS_7_SYSTEM_PROMPT = `You are an expert business appraiser specializing in asset-based valuation approaches. Your task is to convert book values from financial statements to fair market values and calculate the adjusted net asset value of the business.

You understand that the asset approach:
- Establishes a "floor value" for the business
- Is most relevant for asset-intensive businesses (manufacturing, real estate, distribution)
- Is less relevant for service businesses where value is in intangibles/goodwill
- Requires careful adjustment of each asset category
- May include or exclude intangible assets depending on the standard of value

Your adjustments must be:
- Individually documented with clear rationale
- Based on observable evidence where possible
- Conservative when evidence is limited
- Consistent with fair market value standard (price between willing buyer/seller)

You will output ONLY valid JSON matching the required schema.`;

export const PASS_7_USER_PROMPT = `Apply the asset-based valuation approach using data from prior passes.

## CONTEXT FROM PRIOR PASSES

You have received:
- **Pass 1**: Company profile, entity type, real estate ownership, equipment information
- **Pass 3**: Complete balance sheet with all asset and liability categories
- **Pass 4**: Industry characteristics (asset intensity, typical balance sheet structure)
- **Pass 5**: Normalized earnings (relevant for excess earnings method if applicable)
- **Pass 6**: Risk assessment and company strengths/weaknesses

Use this data to adjust book values to fair market values.

## YOUR TASK

Calculate the adjusted net asset value through systematic adjustment of each balance sheet category.

### 1. STARTING POINT

Document the starting book value of equity:
- Total Assets (from Pass 3)
- Total Liabilities (from Pass 3)
- Book Value of Equity = Total Assets - Total Liabilities
- As of Date (balance sheet date)

### 2. CURRENT ASSET ADJUSTMENTS

#### A. Cash and Cash Equivalents
- Book value typically equals fair market value
- Note any restricted cash that should be excluded
- Identify excess cash above operating needs (may be added separately)

#### B. Accounts Receivable
| Adjustment Type | When to Apply | Typical Adjustment |
|-----------------|---------------|-------------------|
| Aging adjustment | A/R > 90 days | Write down by age category |
| Concentration risk | Large customer balances | Assess collectibility |
| Related party A/R | Due from shareholders/affiliates | May need 100% write-down |
| Allowance adequacy | Compare to historical bad debt | Adjust allowance if inadequate |

**Document**: DSO from Pass 3, any collection issues noted, allowance for doubtful accounts

#### C. Inventory
| Adjustment Type | When to Apply | Typical Adjustment |
|-----------------|---------------|-------------------|
| Obsolescence | Slow-moving items | Write down 10-50% |
| LIFO to FIFO | If LIFO used | Adjust to current cost |
| Market value < cost | Commodity products | Mark to market |
| Excess inventory | Above normal turns | Discount for liquidation |

**Document**: Inventory turnover from Pass 3, inventory type, any quality issues noted

#### D. Prepaid Expenses
- Generally no adjustment needed
- Non-transferable prepaids may be written off
- Deposits may or may not transfer with business

### 3. FIXED ASSET ADJUSTMENTS

#### A. Land
- Book value often understates market value
- May have appreciated significantly
- Consider getting appraisal for significant holdings
- If not owned, no adjustment needed

#### B. Buildings
- Compare depreciated book value to market
- Consider: age, condition, location, functionality
- May be significantly understated on books
- Note if lease vs. own

#### C. Machinery & Equipment
| Condition | Typical FMV vs. Book |
|-----------|---------------------|
| Excellent (< 3 years) | 80-100% of original cost |
| Good (3-7 years) | 50-80% of original cost |
| Fair (7-15 years) | 25-50% of original cost |
| Poor (> 15 years) | 10-25% of original cost or scrap |

**Consider**:
- Age from depreciation schedule
- Specialized vs. general purpose
- Technology obsolescence
- Replacement cost new

#### D. Vehicles
- Use market guides (KBB, NADA) for FMV
- Often close to book value for recent purchases
- Older vehicles may exceed book if fully depreciated

#### E. Leasehold Improvements
- Value only transfers if lease transfers
- May have no value if lease expires soon
- Specialized improvements may have limited transferability

### 4. OTHER ASSET ADJUSTMENTS

#### A. Goodwill (Recorded)
- Remove any recorded goodwill from prior acquisitions
- New goodwill will be captured in earnings-based approaches
- Recorded goodwill may be impaired

#### B. Intangible Assets
- Customer lists: difficult to value separately
- Patents/trademarks: may have value if transferable
- Software: value if proprietary and transferable
- Non-compete agreements: no value in asset approach

#### C. Due from Shareholders/Related Parties
- **Critical**: Often should be written off entirely
- Represents de facto distributions
- May not be collectible in transaction
- Buyer would not pay for owner loans to self

#### D. Investments
- Marketable securities: mark to market
- Non-marketable investments: assess fair value
- Consider if investment is operating or non-operating

### 5. LIABILITY ADJUSTMENTS

#### A. Recorded Liabilities
- Generally at fair value already
- Check for below-market debt (if interest rate is low, PV may exceed book)
- Accrued liabilities should be reviewed for completeness

#### B. Contingent Liabilities
- Pending litigation: estimate probable loss
- Product warranties: assess adequacy of reserves
- Environmental issues: estimate remediation costs
- Tax contingencies: assess audit risk

#### C. Unrecorded Liabilities
- Unfunded pension obligations
- Post-retirement benefits
- Deferred compensation
- Lease obligations (if not on balance sheet)

#### D. Due to Shareholders/Related Parties
- May be reclassified as equity
- Below-market loans may stay as debt
- Above-market loans may be adjusted

### 6. CALCULATE ADJUSTED VALUES

**Adjusted Net Asset Value Calculation**:

Book Value of Equity                          $XXX,XXX
+ Adjustments to Current Assets               $XX,XXX
+ Adjustments to Fixed Assets                 $XX,XXX
+ Adjustments to Other Assets                 $XX,XXX
- Adjustments to Liabilities                  ($XX,XXX)
= Adjusted Net Asset Value                    $XXX,XXX

Also calculate:
- **Tangible Book Value**: Exclude intangibles
- **Orderly Liquidation Value** (if relevant): FMV less selling costs and time discount
- **Forced Liquidation Value** (if relevant): Quick sale values

### 7. ASSESS METHOD APPLICABILITY

Consider whether the asset approach is appropriate for this business:

| Factor | Asset Approach More Relevant | Asset Approach Less Relevant |
|--------|------------------------------|------------------------------|
| Business Type | Manufacturing, Distribution | Professional Services |
| Asset Intensity | High (assets drive earnings) | Low (people drive earnings) |
| Earnings | Marginal or negative | Strong and consistent |
| Going Concern | In doubt | Clearly viable |
| Real Estate | Significant holdings | Leased facilities |

**Assign Weight**: Based on factors above, recommend weight (0-100%) for asset approach in final synthesis.

### 8. ASSET APPROACH NARRATIVE

Write a 500-600 word narrative explaining:
- Starting book value and major adjustments made
- Key assets and their valuation treatment
- Why asset approach is/isn't heavily weighted for this business
- Relationship between asset value and earnings-based values
- Conclusions about asset approach indication

## OUTPUT FORMAT

Output ONLY valid JSON matching this structure:

{
  "pass_number": 7,
  "pass_name": "Asset Approach Valuation",
  "asset_approach": {
    "book_value_equity": 631000,
    "as_of_date": "2023-12-31",
    "asset_adjustments": {
      "cash_adjustment": {
        "asset_category": "Current Assets",
        "asset_description": "Cash and Cash Equivalents",
        "book_value": 485000,
        "fair_market_value": 485000,
        "adjustment_amount": 0,
        "adjustment_rationale": "Cash equals fair market value. No restricted cash identified. Approximately $150K may be considered excess above 2-month operating needs, but included in operating value for this analysis.",
        "valuation_method": "Face value",
        "supporting_data": "Bank balance per Schedule L",
        "confidence": "high"
      },
      "receivables_adjustment": {
        "asset_category": "Current Assets",
        "asset_description": "Accounts Receivable, Net",
        "book_value": 305000,
        "fair_market_value": 290000,
        "adjustment_amount": -15000,
        "adjustment_rationale": "Book value of $320K less existing allowance of $15K = $305K. DSO of 47 days suggests some aging. Applied additional 5% discount ($15K) for collection risk and timing. No specific collection issues identified, but conservative adjustment appropriate for change of control.",
        "valuation_method": "Aging analysis with risk adjustment",
        "supporting_data": "DSO 47 days per Pass 3; no specific problem accounts noted",
        "confidence": "medium"
      },
      "inventory_adjustment": null,
      "prepaid_adjustment": {
        "asset_category": "Current Assets",
        "asset_description": "Prepaid Expenses",
        "book_value": 35000,
        "fair_market_value": 28000,
        "adjustment_amount": -7000,
        "adjustment_rationale": "Prepaids include insurance, rent deposits, and software subscriptions. Estimated 80% transferable to new owner. 20% write-down ($7K) for non-transferable items.",
        "valuation_method": "Transferability assessment",
        "supporting_data": "Standard prepaid categories assumed",
        "confidence": "medium"
      },
      "land_adjustment": null,
      "building_adjustment": null,
      "equipment_adjustment": {
        "asset_category": "Fixed Assets",
        "asset_description": "Machinery, Equipment, Furniture, Vehicles",
        "book_value": 180000,
        "fair_market_value": 195000,
        "adjustment_amount": 15000,
        "adjustment_rationale": "Net book value of $180K (gross $375K less $195K accumulated depreciation) likely understates FMV for HVAC service equipment. Equipment is 52% depreciated but functional. Vehicles and service equipment typically retain value above depreciated book. Estimated FMV at $195K based on 55-60% of original cost for mix of 3-7 year old equipment.",
        "valuation_method": "Age-condition assessment",
        "supporting_data": "Form 4562 depreciation schedule; industry equipment value guides",
        "confidence": "medium"
      },
      "vehicle_adjustment": null,
      "leasehold_adjustment": {
        "asset_category": "Fixed Assets",
        "asset_description": "Leasehold Improvements",
        "book_value": 0,
        "fair_market_value": 0,
        "adjustment_amount": 0,
        "adjustment_rationale": "Leasehold improvements included in equipment category above. Building is leased from related party; improvements would transfer with assumed lease.",
        "valuation_method": "Included in equipment",
        "confidence": "medium"
      },
      "goodwill_adjustment": null,
      "other_intangibles_adjustment": {
        "asset_category": "Other Assets",
        "asset_description": "Intangible Assets (Software)",
        "book_value": 15000,
        "fair_market_value": 10000,
        "adjustment_amount": -5000,
        "adjustment_rationale": "Net intangibles of $15K represent software licenses being amortized. Fair value estimated at $10K based on remaining useful life and transferability. Some licenses may require new owner to obtain separately.",
        "valuation_method": "Remaining useful life",
        "supporting_data": "Amortization schedule",
        "confidence": "medium"
      },
      "other_asset_adjustments": [
        {
          "asset_category": "Other Assets",
          "asset_description": "Loans to Shareholders",
          "book_value": 45000,
          "fair_market_value": 0,
          "adjustment_amount": -45000,
          "adjustment_rationale": "Shareholder loans of $45K should be written off entirely for asset approach purposes. These represent de facto distributions that would not transfer value to a buyer. Owner would settle these before closing or they would reduce purchase price.",
          "valuation_method": "Non-operating asset exclusion",
          "supporting_data": "Schedule L Line 7",
          "confidence": "high"
        }
      ]
    },
    "total_asset_adjustments": -57000,
    "adjusted_total_assets": 1020000,
    "liability_adjustments": {
      "recorded_liabilities_adjustment": {
        "asset_category": "Liabilities",
        "asset_description": "Recorded Liabilities Review",
        "book_value": 446000,
        "fair_market_value": 446000,
        "adjustment_amount": 0,
        "adjustment_rationale": "Recorded liabilities appear complete and at fair value. Debt is at market rates. No below-market loans identified. Accrued expenses appear reasonable for business size.",
        "valuation_method": "Face value review",
        "confidence": "high"
      },
      "contingent_liabilities": [],
      "unrecorded_liabilities": [
        {
          "asset_category": "Liabilities",
          "asset_description": "Operating Lease Liability (Off-Balance Sheet)",
          "book_value": 0,
          "fair_market_value": 0,
          "adjustment_amount": 0,
          "adjustment_rationale": "Operating lease for office space ($8K/month, 36 months remaining = $288K commitment) noted in Pass 3. For asset approach purposes, this is considered a future operating expense rather than a liability adjustment. Lease is with related party and would be negotiated in transaction.",
          "valuation_method": "Operating commitment - not capitalized",
          "confidence": "medium"
        }
      ],
      "deferred_tax_adjustment": null,
      "other_liability_adjustments": []
    },
    "total_liability_adjustments": 0,
    "adjusted_total_liabilities": 446000,
    "adjusted_book_value": 574000,
    "intangible_value_assessment": {
      "identifiable_intangibles": [
        {
          "type": "Customer Relationships",
          "description": "50+ active customers with 35% recurring revenue from service agreements",
          "estimated_value": null,
          "valuation_method": "Not valued separately in asset approach; captured in earnings-based approaches"
        },
        {
          "type": "Workforce in Place",
          "description": "17 FTEs including experienced technicians",
          "estimated_value": null,
          "valuation_method": "Not valued separately; captured in going concern value"
        },
        {
          "type": "Trade Name/Reputation",
          "description": "9 years of local market presence",
          "estimated_value": null,
          "valuation_method": "Not valued separately in asset approach"
        }
      ],
      "total_identifiable_intangibles": 0,
      "implied_goodwill": null
    },
    "orderly_liquidation_value": {
      "value": 485000,
      "liquidation_period_months": 6,
      "assumptions": [
        "A/R collected at 90% over 60 days",
        "Equipment sold at 70% of FMV over 6 months",
        "Prepaids non-recoverable",
        "All liabilities paid at face value",
        "Liquidation costs of 10% of asset proceeds"
      ]
    },
    "forced_liquidation_value": {
      "value": 380000,
      "discount_from_orderly": 0.22,
      "assumptions": [
        "A/R collected at 75% in 30 days",
        "Equipment sold at 50% of FMV in auction",
        "All liabilities paid",
        "Higher liquidation costs (15%)"
      ]
    }
  },
  "summary": {
    "book_value_equity": 631000,
    "total_adjustments": -57000,
    "adjusted_net_asset_value": 574000,
    "tangible_net_asset_value": 564000,
    "orderly_liquidation_value": 485000
  },
  "method_applicability": {
    "adjusted_book_value_applicable": true,
    "liquidation_value_applicable": false,
    "excess_earnings_method_applicable": false,
    "applicability_rationale": "The asset approach provides a floor value of $574K but significantly understates going concern value for this profitable service business. Key observations: (1) This is a service business where value derives primarily from customer relationships, workforce, and earnings capacity - not tangible assets; (2) Strong SDE of $600K+ far exceeds return on tangible assets alone; (3) Most value is in unrecorded intangibles (customer base, reputation, trained workforce); (4) Liquidation value is not relevant as this is a viable going concern. The asset approach should receive minimal weight (10-15%) in the final synthesis, serving primarily as a floor value sanity check."
  },
  "narrative": {
    "title": "Asset Approach Analysis",
    "content": "The asset-based approach establishes value by adjusting the company's book value of equity to fair market value. Starting with book equity of $631,000 as of December 31, 2023, we made several adjustments to arrive at an adjusted net asset value of $574,000.\n\nThe most significant adjustment was the complete write-off of $45,000 in shareholder loans, which represent de facto distributions rather than collectible assets. These would not transfer value to a buyer and would typically be settled or offset against the purchase price at closing.\n\nAccounts receivable of $305,000 (net of allowance) were adjusted downward by $15,000 to reflect collection risk and timing considerations in a change-of-control scenario. While the company's DSO of 47 days is reasonable, a conservative adjustment is appropriate given buyer uncertainty about customer relationships.\n\nFixed assets, primarily HVAC service equipment and vehicles, were adjusted upward by $15,000 from net book value of $180,000 to estimated fair market value of $195,000. The equipment is functional and well-maintained, retaining value above its depreciated book basis. Prepaid expenses were reduced by $7,000 for non-transferable items, and software intangibles were reduced by $5,000 for transferability and remaining useful life.\n\nNo adjustments were made to liabilities, which appear complete and at fair value. The operating lease commitment for office space ($288,000 over 36 months) was noted but not capitalized, as it represents a future operating expense and the lease is with a related party subject to negotiation.\n\nThe asset approach indicates a value of $574,000, but this substantially understates the company's going concern value. This is a professional service business where value derives primarily from customer relationships (50+ customers, 35% recurring revenue), a trained workforce (17 employees), local market reputation (9 years), and demonstrated earnings capacity (SDE over $600,000). These intangible assets are not captured in the adjusted book value.\n\nThe tangible asset value of $564,000 represents less than one year of seller's discretionary earnings, implying significant goodwill value. For comparison, the income and market approaches will likely indicate values of $1.5-1.8 million, demonstrating that most of this company's value lies in intangible assets and earning power rather than tangible assets.\n\nGiven the service business nature, strong profitability, and minimal asset intensity, we recommend weighting the asset approach at only 10% in the final value synthesis. It serves primarily as a floor value and sanity check rather than a primary indicator of value.",
    "word_count": 412,
    "key_points": [
      "Adjusted net asset value of $574,000",
      "Primary adjustment: $45K shareholder loan write-off",
      "Service business with most value in intangibles",
      "Asset approach understates going concern value",
      "Recommended weight: 10%"
    ]
  },
  "weighting_recommendation": {
    "suggested_weight": 10,
    "rationale": "Asset approach weighted at 10% because: (1) Service business with minimal tangible asset base; (2) Value derives from customer relationships, workforce, and earnings - not assets; (3) Strong earnings (SDE $600K+) far exceed return on tangible assets; (4) Asset value serves as floor/sanity check only. Higher weight would be appropriate for asset-intensive businesses or distressed situations."
  },
  "extraction_metadata": {
    "processing_time_ms": 0,
    "tokens_used": 0
  }
}

## CRITICAL INSTRUCTIONS

1. **START WITH BALANCE SHEET**: Use exact figures from Pass 3 as your starting point.

2. **DOCUMENT EVERY ADJUSTMENT**: Each asset category needs explicit treatment, even if no adjustment is made.

3. **WRITE OFF SHAREHOLDER ITEMS**: Loans to/from shareholders typically need adjustment or elimination.

4. **BE CONSERVATIVE**: When uncertain about FMV, err on the conservative side.

5. **EXPLAIN RATIONALE**: Each adjustment needs clear reasoning, not just a number.

6. **CONSIDER INTANGIBLES**: Note intangible assets that exist but aren't valued in asset approach (customer relationships, workforce, brand).

7. **ASSESS APPLICABILITY**: Clearly explain why asset approach is or isn't heavily weighted for this business type.

8. **CALCULATE LIQUIDATION VALUES**: Provide orderly and forced liquidation values with assumptions.

9. **WRITE NARRATIVE**: 500-600 word narrative suitable for final report.

10. **OUTPUT ONLY JSON**: Your entire response must be valid JSON. No text before or after.

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

Now apply the asset approach valuation.`;

export const pass7PromptConfig = {
  passNumber: 7,
  passName: 'Asset Approach Valuation',
  systemPrompt: PASS_7_SYSTEM_PROMPT,
  userPrompt: PASS_7_USER_PROMPT,
  expectedOutputType: 'Pass7Output' as const,
  maxTokens: 6144,
  temperature: 0.2,
};

export default pass7PromptConfig;
