# Valuation Methodology Guide

## Overview of Three Approaches

Business valuation professionals use three fundamental approaches:
1. **Asset Approach** - What are the net assets worth?
2. **Income Approach** - What is the earning power worth?
3. **Market Approach** - What are similar businesses selling for?

Each approach has specific applications and limitations.

---

## Asset Approach

### When to Use
- Asset-heavy businesses (real estate, equipment-intensive)
- Holding companies
- Businesses being liquidated
- Businesses with minimal earnings
- Floor value establishment

### When NOT to Emphasize
- Service businesses with few tangible assets
- High-growth companies
- Businesses where value derives from intangibles

### Methodology: Adjusted Net Asset Value

**Step 1: Start with Book Values**
```
Book Value of Equity = Total Assets - Total Liabilities
```

**Step 2: Adjust Assets to Fair Market Value**

| Asset | Adjustment Approach |
|-------|-------------------|
| Cash | Usually no adjustment |
| Accounts Receivable | Deduct uncollectible amounts |
| Inventory | Adjust for obsolete/slow-moving |
| Equipment | Appraise at FMV (not depreciated book) |
| Real Estate | Appraise at current market value |
| Intangibles | Often significant adjustment |
| Goodwill | Usually written off unless transferable |

**Step 3: Adjust Liabilities**
- Confirm all liabilities are recorded
- Add contingent liabilities if material
- Adjust for off-balance-sheet obligations

**Step 4: Calculate Adjusted Net Asset Value**
```
Adjusted Net Asset Value = Adjusted Assets - Adjusted Liabilities
```

### Typical Adjustments

| Item | Common Adjustment |
|------|-------------------|
| Equipment | +/- 20-50% from book value |
| Real Estate | Often significant increase |
| Inventory | -10-30% for obsolete items |
| A/R | -5-15% for doubtful accounts |
| Goodwill | Often written to $0 |

---

## Income Approach

### When to Use
- Service businesses
- Professional practices
- Any business with consistent earnings
- Primary approach for most operating businesses

### Methodology: Single-Period Capitalization

**Step 1: Determine Benefit Stream**
- SDE (for owner-operated businesses < $1M earnings)
- EBITDA (for larger businesses with management)

**Step 2: Build Up Capitalization Rate**

```
Risk-Free Rate (20-year Treasury)       4.50%
+ Equity Risk Premium                   5.50%
+ Size Premium                          6.00%
+ Industry Risk Premium                 2.00%
+ Company-Specific Risk Premium         3.00%
= Total Discount Rate                  21.00%
- Long-Term Growth Rate                 3.00%
= Capitalization Rate                  18.00%
```

**Risk-Free Rate Sources:**
- 20-year U.S. Treasury yield
- Currently approximately 4.0-5.0%

**Equity Risk Premium:**
- Historical average: 5.0-6.0%
- Source: Duff & Phelps, Ibbotson

**Size Premium (Duff & Phelps 2024):**
| Decile | Market Cap | Size Premium |
|--------|-----------|--------------|
| 10b (smallest) | < $2M | 11.0-12.0% |
| 10a | $2M-$5M | 8.0-10.0% |
| 9 | $5M-$15M | 6.0-8.0% |
| 8 | $15M-$50M | 4.0-6.0% |

**Industry Risk Premium:**
| Industry Type | Premium Range |
|--------------|---------------|
| Professional Services | 1.0-3.0% |
| Manufacturing | 2.0-4.0% |
| Retail | 3.0-5.0% |
| Construction | 3.0-6.0% |
| Technology | 2.0-5.0% |

**Company-Specific Risk Premium:**
Based on 10-factor risk assessment (see risk-framework.md)
| Risk Score | Company Premium |
|------------|-----------------|
| 1.0-2.0 | 0-2% |
| 2.0-3.0 | 2-4% |
| 3.0-4.0 | 4-6% |
| 4.0-5.0 | 6-10% |

**Step 3: Calculate Value**
```
Income Approach Value = Benefit Stream ÷ Capitalization Rate

Example:
SDE = $400,000
Cap Rate = 20%
Value = $400,000 ÷ 0.20 = $2,000,000
```

**Step 4: Derive Implied Multiple**
```
Implied Multiple = 1 ÷ Capitalization Rate = 1 ÷ 0.20 = 5.0x
```

---

## Market Approach

### When to Use
- When comparable transaction data exists
- Most widely accepted for small businesses
- Primary method for many buyers

### Methodology: Guideline Transaction Method

**Step 1: Identify Appropriate Multiple**
- Use industry-specific multiples (see industry-multiples.md)
- Consider business size for multiple selection
- Adjust for company-specific factors

**Step 2: Select Benefit Stream**
- SDE for owner-operated businesses
- EBITDA for larger businesses
- Revenue multiple as sanity check

**Step 3: Adjust Multiple**
```
Base Industry Multiple: 2.5x SDE
+ Quality Adjustments: +0.5x (strong recurring revenue)
- Risk Adjustments: -0.25x (owner dependency)
= Adjusted Multiple: 2.75x SDE
```

**Step 4: Calculate Value**
```
Market Approach Value = Benefit Stream × Adjusted Multiple

Example:
SDE = $400,000
Adjusted Multiple = 2.75x
Value = $400,000 × 2.75 = $1,100,000
```

### Multiple Selection Guidelines

| Business SDE | Typical Multiple Range |
|-------------|----------------------|
| < $100K | 1.0x - 2.0x |
| $100K - $250K | 1.5x - 2.5x |
| $250K - $500K | 2.0x - 3.0x |
| $500K - $1M | 2.5x - 4.0x |
| > $1M | 3.0x - 5.0x+ |

---

## Weighting the Approaches

### Standard Weighting Guidelines

| Business Type | Asset | Income | Market |
|--------------|-------|--------|--------|
| Service Business | 10% | 40% | 50% |
| Manufacturing | 25% | 35% | 40% |
| Distribution | 20% | 35% | 45% |
| Retail | 15% | 35% | 50% |
| Real Estate Intensive | 40% | 30% | 30% |
| Professional Practice | 5% | 45% | 50% |

### Factors Affecting Weights

**Increase Asset Weight When:**
- Significant tangible assets
- Real estate included
- Below-average earnings
- Liquidation scenario

**Increase Income Weight When:**
- Strong, consistent earnings
- Unique business model
- Limited comparable transactions
- Growth potential

**Increase Market Weight When:**
- Abundant transaction data
- Industry-standard multiples
- Typical business characteristics
- Buyer is financial (not strategic)

---

## Discounts and Premiums

### Discount for Lack of Marketability (DLOM)

**Purpose:** Adjust for illiquidity of private company interests

**Typical Ranges:**
| Factor | DLOM Range |
|--------|-----------|
| Control Interest | 10-20% |
| Minority Interest | 25-40% |

**DLOM Factors:**
- Distribution policy
- Put options/buyout provisions
- Prospect of going public
- Size of block
- Business risk

### Control Premium/Minority Discount

**Control Premium:** Applied when valuing a controlling interest
- Typical range: 20-40%

**Minority Discount:** Applied when valuing a minority interest
- Typical range: 15-35%

---

## Value Reconciliation

### Final Steps

1. **Review Each Approach**
   - Is the value reasonable?
   - Are the inputs defensible?
   - Do the approaches converge?

2. **Apply Weights**
   ```
   Weighted Value = (Asset × W1) + (Income × W2) + (Market × W3)
   ```

3. **Apply Discounts/Premiums**
   ```
   Final Value = Weighted Value × (1 - DLOM)
   ```

4. **Establish Value Range**
   - Low: -10% to -15% of concluded value
   - High: +10% to +15% of concluded value

5. **Sanity Check**
   - Revenue multiple: Should be 0.3x - 2.0x for most businesses
   - Return on investment: Should be 15-35% for buyers
   - Payback period: Typically 3-7 years
