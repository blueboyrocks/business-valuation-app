# Tax Form Analysis for Business Valuation

## Overview

This document provides comprehensive guidance for extracting financial data from business tax returns to calculate SDE (Seller's Discretionary Earnings) and EBITDA for business valuation purposes.

---

## Form 1120-S (S Corporation) Analysis

### Key Lines for SDE/EBITDA Calculation

#### Income Section (Lines 1-6)
| Line | Description | Use in Valuation |
|------|-------------|------------------|
| 1a | Gross receipts or sales | Total revenue baseline |
| 1b | Returns and allowances | Deduct from gross receipts |
| 1c | Net receipts (1a - 1b) | **Primary revenue figure** |
| 2 | Cost of goods sold | Direct costs |
| 3 | Gross profit (1c - 2) | Gross margin analysis |
| 4 | Net gain (loss) from Form 4797 | Usually add back (non-recurring) |
| 5 | Other income | Evaluate for recurring nature |
| 6 | Total income | Starting point for adjustments |

#### Deductions Section (Lines 7-20)
| Line | Description | Add Back to SDE? |
|------|-------------|------------------|
| 7 | Compensation of officers | **YES - Add back owner compensation** |
| 8 | Salaries and wages | Evaluate for owner family members |
| 9 | Repairs and maintenance | No (operating expense) |
| 10 | Bad debts | Consider if non-recurring |
| 11 | Rents | No (operating expense) |
| 12 | Taxes and licenses | No (operating expense) |
| 13 | Interest | **YES - Add back for EBITDA** |
| 14 | Depreciation | **YES - Add back for SDE/EBITDA** |
| 15 | Depletion | **YES - Add back** |
| 16 | Advertising | No (operating expense) |
| 17 | Pension/profit-sharing | Evaluate for owner benefit |
| 18 | Employee benefit programs | Evaluate for owner benefit |
| 19 | Other deductions | **Review Schedule K for details** |
| 20 | Total deductions | Sum of all deductions |

#### Bottom Line
| Line | Description | Notes |
|------|-------------|-------|
| 21 | Ordinary business income (loss) | Line 6 minus Line 20 |
| 22a-c | Tax and payments | Not relevant for SDE |
| 23a-d | Estimated tax penalty | Not relevant for SDE |

### Schedule K (Shareholders' Pro Rata Share Items)

Critical for understanding distributions and additional income:

| Line | Description | Valuation Relevance |
|------|-------------|---------------------|
| 1 | Ordinary business income | Pass-through to owners |
| 2 | Net rental real estate income | Additional income source |
| 3 | Other net rental income | Additional income source |
| 4 | Interest income | May be non-operating |
| 5a | Ordinary dividends | May be non-operating |
| 6 | Royalties | Evaluate nature |
| 7 | Net short-term capital gain | Usually non-recurring |
| 8a | Net long-term capital gain | Usually non-recurring |
| 10 | Net section 1231 gain | Usually non-recurring |
| 11 | Other income | Review for recurring items |
| 12a | Section 179 deduction | **Add back (accelerated depreciation)** |
| 16a | Distributions (cash) | Shows actual cash to owners |
| 16d | Distributions (property) | Shows actual distributions |

### Schedule L (Balance Sheet)

Essential for assessing business health and working capital:

| Line | Description | Analysis Use |
|------|-------------|--------------|
| 1 | Cash | Liquidity assessment |
| 2a-b | Trade notes and accounts receivable | Working capital |
| 3 | Inventories | Working capital |
| 4 | U.S. government obligations | Excess assets |
| 5 | Tax-exempt securities | Excess assets |
| 6 | Other current assets | Working capital |
| 7 | Loans to shareholders | **Potential add-back** |
| 8 | Mortgage and real estate loans | Asset evaluation |
| 9a-b | Other investments | Non-operating assets |
| 10a-b | Buildings and depreciable assets | Fixed asset base |
| 11a-b | Land | Real estate value |
| 12a-b | Intangible assets | Goodwill, IP |
| 13 | Other assets | Evaluate nature |
| 14 | Total assets | Overall size metric |
| 15 | Accounts payable | Current liabilities |
| 16 | Mortgages, notes, bonds (< 1 year) | **Subtract from cash flow** |
| 17 | Other current liabilities | Working capital |
| 18 | Loans from shareholders | May indicate undercapitalization |
| 19 | Mortgages, notes, bonds (≥ 1 year) | Long-term debt |
| 20 | Other liabilities | Evaluate nature |
| 21 | Capital stock | Equity structure |
| 22 | Additional paid-in capital | Equity structure |
| 23 | Retained earnings | Accumulated profits |
| 24 | Adjustments to shareholders' equity | Equity adjustments |
| 25 | Less cost of treasury stock | Equity reduction |
| 26 | Total liabilities and equity | Must equal Line 14 |

### Schedule M-1 (Reconciliation)

Reveals differences between book and tax income:

| Line | Description | Valuation Insight |
|------|-------------|-------------------|
| 1 | Net income per books | Book income baseline |
| 2 | Income on Schedule K not on books | Tax vs. book differences |
| 3 | Expenses on books not on Schedule K | Non-deductible expenses |
| 4 | Total (add lines 1-3) | Reconciliation subtotal |
| 5 | Income on books not on Schedule K | Book vs. tax differences |
| 6 | Deductions on Schedule K not on books | Tax-only deductions |
| 7 | Total (add lines 5-6) | Reconciliation subtotal |
| 8 | Income (loss) per Schedule K | Should match Schedule K, Line 18 |

---

## Form 1120 (C Corporation) Analysis

### Key Differences from 1120-S

C Corporations pay corporate income tax, so the analysis differs:

| Line | Description | Add Back? |
|------|-------------|-----------|
| 1a-c | Gross receipts | Revenue baseline |
| 2 | Cost of goods sold | Direct costs |
| 3 | Gross profit | Margin analysis |
| 11 | Total income | Pre-deduction income |
| 12 | Compensation of officers | **YES - Owner portion** |
| 13 | Salaries and wages | Evaluate for owners |
| 14 | Repairs and maintenance | No |
| 15 | Bad debts | If non-recurring |
| 16 | Rents | No |
| 17 | Taxes and licenses | No |
| 18 | Interest | **YES - For EBITDA** |
| 19 | Charitable contributions | **YES - Discretionary** |
| 20 | Depreciation | **YES** |
| 21 | Depletion | **YES** |
| 22 | Advertising | No |
| 23 | Pension/profit-sharing | Owner portion |
| 24 | Employee benefit programs | Owner portion |
| 25 | Domestic production deduction | Evaluate |
| 26 | Other deductions | Review Schedule K |
| 27 | Total deductions | Sum |
| 28 | Taxable income before NOL | Pre-tax income |
| 29a-b | Net operating loss deduction | Add back |
| 30 | Taxable income | After NOL |
| 31 | Total tax | **Add back for pre-tax analysis** |

---

## Form 1065 (Partnership) Analysis

### Key Lines

| Line | Description | Valuation Use |
|------|-------------|---------------|
| 1a-c | Gross receipts | Revenue |
| 2 | Cost of goods sold | Direct costs |
| 3 | Gross profit | Margin |
| 8 | Total income | Pre-deduction |
| 9 | Salaries (non-partners) | Operating expense |
| 10 | Guaranteed payments to partners | **Add back - Owner compensation** |
| 11 | Repairs and maintenance | Operating |
| 12 | Bad debts | If non-recurring |
| 13 | Rent | Operating |
| 14 | Taxes and licenses | Operating |
| 15 | Interest | **Add back for EBITDA** |
| 16a | Depreciation | **Add back** |
| 16b | Less depreciation in COGS | Adjustment |
| 16c | Net depreciation | **Add back amount** |
| 17 | Depletion | **Add back** |
| 18 | Retirement plans | Partner portion |
| 19 | Employee benefit programs | Partner portion |
| 20 | Other deductions | Review detail |
| 21 | Total deductions | Sum |
| 22 | Ordinary business income | Bottom line |

### Schedule K-1 (Partner's Share)

| Line | Description | Notes |
|------|-------------|-------|
| 1 | Ordinary business income | Partner's share |
| 4a | Guaranteed payments (services) | **Owner compensation** |
| 4b | Guaranteed payments (capital) | **Owner compensation** |
| 4c | Total guaranteed payments | **Total owner comp** |
| 19a | Distributions (cash) | Actual cash received |
| 19b | Distributions (property) | Property received |

---

## Schedule C (Sole Proprietorship) Analysis

### Key Lines

| Line | Description | Add Back? |
|------|-------------|-----------|
| 1 | Gross receipts | Revenue |
| 2 | Returns and allowances | Deduct |
| 3 | Net receipts | Net revenue |
| 4 | Cost of goods sold | Direct costs |
| 5 | Gross profit | Margin |
| 6 | Other income | Evaluate |
| 7 | Gross income | Total income |
| 8 | Advertising | No |
| 9 | Car and truck expenses | **Evaluate personal use** |
| 10 | Commissions and fees | No |
| 11 | Contract labor | No |
| 12 | Depletion | **YES** |
| 13 | Depreciation | **YES** |
| 14 | Employee benefit programs | **Owner portion** |
| 15 | Insurance (non-health) | No |
| 16a | Interest (mortgage) | **YES for EBITDA** |
| 16b | Interest (other) | **YES for EBITDA** |
| 17 | Legal and professional | No |
| 18 | Office expense | No |
| 19 | Pension/profit-sharing | **Owner portion** |
| 20a | Rent (vehicles, equipment) | No |
| 20b | Rent (other) | No |
| 21 | Repairs and maintenance | No |
| 22 | Supplies | No |
| 23 | Taxes and licenses | No |
| 24a | Travel | **Evaluate personal** |
| 24b | Deductible meals | **50% typically personal** |
| 25 | Utilities | No |
| 26 | Wages | No |
| 27a | Other expenses | **Review for personal** |
| 28 | Total expenses | Sum |
| 29 | Tentative profit | Pre-home office |
| 30 | Home office deduction | **Add back** |
| 31 | Net profit (loss) | Bottom line |

---

## SDE Calculation Worksheet

### Standard Add-Backs

```
Net Income (from tax return)                    $_______

ADD BACK:
+ Owner's salary/compensation                   $_______
+ Owner's payroll taxes (employer portion)      $_______
+ Owner's health insurance                      $_______
+ Owner's retirement contributions              $_______
+ Depreciation                                  $_______
+ Amortization                                  $_______
+ Interest expense                              $_______
+ One-time/non-recurring expenses               $_______
+ Personal expenses through business            $_______
  - Personal auto use                           $_______
  - Personal travel                             $_______
  - Personal meals/entertainment                $_______
  - Personal insurance                          $_______
  - Family member salaries (above market)       $_______
+ Non-cash expenses                             $_______
+ Charitable contributions                      $_______

SUBTRACT:
- Non-recurring income                          $_______
- Investment income (if non-operating)          $_______
- Gain on sale of assets                        $_______

= SELLER'S DISCRETIONARY EARNINGS (SDE)         $_______
```

### EBITDA Calculation (for larger businesses)

```
Net Income                                      $_______

ADD BACK:
+ Interest expense                              $_______
+ Income tax expense                            $_______
+ Depreciation                                  $_______
+ Amortization                                  $_______

= EBITDA                                        $_______

ADJUSTMENTS for Normalized EBITDA:
+ Above-market owner compensation               $_______
+ One-time expenses                             $_______
+ Non-recurring items                           $_______
- Below-market rent (if owner-owned property)   $_______
- Below-market salaries                         $_______

= ADJUSTED/NORMALIZED EBITDA                    $_______
```

---

## Red Flags to Watch For

### Income Manipulation
- Significant year-over-year revenue fluctuations without explanation
- Large "other income" amounts without detail
- Unusual timing of revenue recognition
- Related party transactions at non-market rates

### Expense Concerns
- Officer compensation significantly above or below market
- Large "other deductions" without itemization
- Repairs that may be capital improvements
- Excessive travel and entertainment
- Related party rent payments

### Balance Sheet Issues
- Large loans to/from shareholders
- Negative retained earnings
- Significant changes in inventory levels
- Accounts receivable aging concerns
- Unrecorded liabilities

### Cash Flow Red Flags
- Net income significantly different from cash distributions
- Declining cash balances despite reported profits
- Heavy reliance on debt financing
- Deferred revenue recognition

---

## Quality of Earnings Adjustments

### Common Normalizing Adjustments

| Category | Adjustment Type | Direction |
|----------|-----------------|-----------|
| Owner compensation | Adjust to market rate | +/- |
| Rent | Adjust to market rate | +/- |
| Related party transactions | Adjust to arm's length | +/- |
| One-time legal fees | Add back | + |
| One-time consulting | Add back | + |
| Lawsuit settlements | Add back | + |
| Insurance proceeds | Subtract | - |
| PPP loan forgiveness | Subtract | - |
| EIDL advances | Evaluate | +/- |
| COVID-related anomalies | Normalize | +/- |
| Customer concentration risk | Discount multiple | N/A |
| Key person dependency | Discount multiple | N/A |
