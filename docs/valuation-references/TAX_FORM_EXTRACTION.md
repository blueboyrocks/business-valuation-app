# Tax Form Extraction Guide for Business Valuation

## Overview

This guide provides line-by-line instructions for extracting financial data from business tax returns to calculate SDE (Seller's Discretionary Earnings) and EBITDA for business valuation purposes.

---

## Form 1120-S (S Corporation)

### Page 1: Income

| Line | Description | Extract? | Notes |
|------|-------------|----------|-------|
| 1a | Gross receipts or sales | **YES** | Total revenue |
| 1b | Returns and allowances | **YES** | Subtract from 1a |
| 1c | Balance (1a - 1b) | **YES** | Net revenue - PRIMARY REVENUE FIGURE |
| 2 | Cost of goods sold (Schedule A) | **YES** | Direct costs |
| 3 | Gross profit (1c - 2) | **YES** | Gross margin |
| 4 | Net gain (loss) from Form 4797 | **YES** | Usually non-recurring - ADD BACK |
| 5 | Other income (see statement) | **YES** | Evaluate for recurring nature |
| 6 | Total income (add 3-5) | **YES** | Total income before deductions |

### Page 1: Deductions

| Line | Description | Extract? | Add Back? |
|------|-------------|----------|-----------|
| 7 | Compensation of officers | **YES** | **YES** - Owner portion |
| 8 | Salaries and wages | **YES** | Evaluate for owner family |
| 9 | Repairs and maintenance | **YES** | No |
| 10 | Bad debts | **YES** | If non-recurring |
| 11 | Rents | **YES** | Adjust if related party |
| 12 | Taxes and licenses | **YES** | No |
| 13 | Interest | **YES** | **YES** - For EBITDA |
| 14 | Depreciation | **YES** | **YES** |
| 15 | Depletion | **YES** | **YES** |
| 16 | Advertising | **YES** | No |
| 17 | Pension, profit-sharing, etc. | **YES** | Owner portion |
| 18 | Employee benefit programs | **YES** | Owner portion |
| 19 | Other deductions (attach statement) | **YES** | Review for personal items |
| 20 | Total deductions | **YES** | Sum of 7-19 |
| 21 | Ordinary business income (loss) | **YES** | **STARTING POINT FOR SDE** |

### Schedule K (Shareholders' Pro Rata Share Items)

| Line | Description | Extract? | Notes |
|------|-------------|----------|-------|
| 1 | Ordinary business income (loss) | **YES** | Should match Page 1, Line 21 |
| 2 | Net rental real estate income | **YES** | May be non-operating |
| 3 | Other net rental income | **YES** | May be non-operating |
| 4 | Interest income | **YES** | Usually non-operating |
| 5a | Ordinary dividends | **YES** | Usually non-operating |
| 5b | Qualified dividends | **YES** | Usually non-operating |
| 6 | Royalties | **YES** | Evaluate nature |
| 7 | Net short-term capital gain | **YES** | Non-recurring - ADD BACK |
| 8a | Net long-term capital gain | **YES** | Non-recurring - ADD BACK |
| 9 | Net section 1231 gain | **YES** | Non-recurring - ADD BACK |
| 10 | Other income (loss) | **YES** | Review for recurring |
| 11 | Section 179 deduction | **YES** | **ADD BACK** |
| 12a | Section 179 deduction | **YES** | **ADD BACK** (accelerated depreciation) |
| 16a | Distributions (cash) | **YES** | Shows actual cash to owners |
| 16b | Distributions (property) | **YES** | Shows property distributions |
| 16c | Distributions (AAA) | **YES** | Accumulated adjustments |
| 16d | Distributions (PTI) | **YES** | Previously taxed income |

### Schedule L (Balance Sheet per Books)

**Assets (Beginning/End of Year)**

| Line | Description | Extract? | Analysis Use |
|------|-------------|----------|--------------|
| 1 | Cash | **YES** | Liquidity assessment |
| 2a | Trade notes and accounts receivable | **YES** | Working capital |
| 2b | Less allowance for bad debts | **YES** | Net A/R |
| 3 | Inventories | **YES** | Working capital |
| 4 | U.S. government obligations | **YES** | Excess assets |
| 5 | Tax-exempt securities | **YES** | Excess assets |
| 6 | Other current assets | **YES** | Working capital |
| 7 | Loans to shareholders | **YES** | **RED FLAG** - Potential add-back |
| 8 | Mortgage and real estate loans | **YES** | Asset evaluation |
| 9a | Other investments | **YES** | Non-operating assets |
| 10a | Buildings and other depreciable assets | **YES** | Fixed asset base |
| 10b | Less accumulated depreciation | **YES** | Net fixed assets |
| 11a | Land (net of any amortization) | **YES** | Real estate value |
| 12a | Intangible assets | **YES** | Goodwill, IP |
| 12b | Less accumulated amortization | **YES** | Net intangibles |
| 13 | Other assets | **YES** | Evaluate nature |
| 14 | Total assets | **YES** | Overall size metric |

**Liabilities and Shareholders' Equity**

| Line | Description | Extract? | Analysis Use |
|------|-------------|----------|--------------|
| 15 | Accounts payable | **YES** | Current liabilities |
| 16 | Mortgages, notes, bonds (< 1 year) | **YES** | **SUBTRACT from cash flow** |
| 17 | Other current liabilities | **YES** | Working capital |
| 18 | Loans from shareholders | **YES** | May indicate undercapitalization |
| 19 | Mortgages, notes, bonds (≥ 1 year) | **YES** | Long-term debt |
| 20 | Other liabilities | **YES** | Evaluate nature |
| 21 | Capital stock | **YES** | Equity structure |
| 22 | Additional paid-in capital | **YES** | Equity structure |
| 23 | Retained earnings | **YES** | Accumulated profits |
| 24 | Adjustments to shareholders' equity | **YES** | Equity adjustments |
| 25 | Less cost of treasury stock | **YES** | Equity reduction |
| 26 | Total liabilities and equity | **YES** | Must equal Line 14 |

### Schedule M-1 (Reconciliation of Income per Books with Income per Return)

| Line | Description | Extract? | Notes |
|------|-------------|----------|-------|
| 1 | Net income (loss) per books | **YES** | Book income baseline |
| 2 | Income included on Schedule K not on books | **YES** | Tax vs. book differences |
| 3 | Expenses recorded on books not on Schedule K | **YES** | Non-deductible expenses |
| 4 | Add lines 1 through 3 | **YES** | Subtotal |
| 5 | Income recorded on books not on Schedule K | **YES** | Book vs. tax differences |
| 6 | Deductions on Schedule K not charged on books | **YES** | Tax-only deductions |
| 7 | Add lines 5 and 6 | **YES** | Subtotal |
| 8 | Income (loss) per Schedule K | **YES** | Should match Schedule K, Line 18 |

---

## Form 1120 (C Corporation)

### Key Differences from 1120-S

C Corporations pay corporate income tax at the entity level, affecting valuation analysis:

### Page 1: Income

| Line | Description | Extract? | Notes |
|------|-------------|----------|-------|
| 1a | Gross receipts or sales | **YES** | Total revenue |
| 1b | Returns and allowances | **YES** | Subtract |
| 1c | Balance | **YES** | Net revenue |
| 2 | Cost of goods sold | **YES** | Direct costs |
| 3 | Gross profit | **YES** | Margin analysis |
| 4 | Dividends (Schedule C) | **YES** | Usually non-operating |
| 5 | Interest | **YES** | Usually non-operating |
| 6 | Gross rents | **YES** | May be non-operating |
| 7 | Gross royalties | **YES** | Evaluate nature |
| 8 | Capital gain net income | **YES** | Non-recurring |
| 9 | Net gain (loss) Form 4797 | **YES** | Non-recurring |
| 10 | Other income | **YES** | Evaluate |
| 11 | Total income | **YES** | Sum of 3-10 |

### Page 1: Deductions

| Line | Description | Extract? | Add Back? |
|------|-------------|----------|-----------|
| 12 | Compensation of officers | **YES** | **YES** - Owner portion |
| 13 | Salaries and wages | **YES** | Evaluate for owners |
| 14 | Repairs and maintenance | **YES** | No |
| 15 | Bad debts | **YES** | If non-recurring |
| 16 | Rents | **YES** | Adjust if related party |
| 17 | Taxes and licenses | **YES** | No |
| 18 | Interest | **YES** | **YES** - For EBITDA |
| 19 | Charitable contributions | **YES** | **YES** - Discretionary |
| 20 | Depreciation | **YES** | **YES** |
| 21 | Depletion | **YES** | **YES** |
| 22 | Advertising | **YES** | No |
| 23 | Pension, profit-sharing | **YES** | Owner portion |
| 24 | Employee benefit programs | **YES** | Owner portion |
| 25 | Reserved | - | - |
| 26 | Other deductions | **YES** | Review statement |
| 27 | Total deductions | **YES** | Sum |
| 28 | Taxable income before NOL | **YES** | Pre-tax income |
| 29a | Net operating loss deduction | **YES** | **ADD BACK** |
| 30 | Taxable income | **YES** | After NOL |
| 31 | Total tax | **YES** | **ADD BACK** for pre-tax analysis |

---

## Form 1065 (Partnership)

### Page 1: Income

| Line | Description | Extract? | Notes |
|------|-------------|----------|-------|
| 1a | Gross receipts or sales | **YES** | Total revenue |
| 1b | Returns and allowances | **YES** | Subtract |
| 1c | Balance | **YES** | Net revenue |
| 2 | Cost of goods sold | **YES** | Direct costs |
| 3 | Gross profit | **YES** | Margin |
| 4 | Ordinary income from other partnerships | **YES** | Evaluate |
| 5 | Net farm profit | **YES** | If applicable |
| 6 | Net gain (loss) Form 4797 | **YES** | Non-recurring |
| 7 | Other income | **YES** | Evaluate |
| 8 | Total income | **YES** | Sum of 3-7 |

### Page 1: Deductions

| Line | Description | Extract? | Add Back? |
|------|-------------|----------|-----------|
| 9 | Salaries and wages (non-partners) | **YES** | No |
| 10 | Guaranteed payments to partners | **YES** | **YES** - Owner compensation |
| 11 | Repairs and maintenance | **YES** | No |
| 12 | Bad debts | **YES** | If non-recurring |
| 13 | Rent | **YES** | Adjust if related party |
| 14 | Taxes and licenses | **YES** | No |
| 15 | Interest | **YES** | **YES** - For EBITDA |
| 16a | Depreciation | **YES** | **YES** |
| 16b | Less depreciation reported on Schedule A | **YES** | Adjustment |
| 16c | Balance | **YES** | **ADD BACK** this amount |
| 17 | Depletion | **YES** | **YES** |
| 18 | Retirement plans | **YES** | Partner portion |
| 19 | Employee benefit programs | **YES** | Partner portion |
| 20 | Other deductions | **YES** | Review statement |
| 21 | Total deductions | **YES** | Sum |
| 22 | Ordinary business income (loss) | **YES** | **STARTING POINT** |

### Schedule K-1 (Partner's Share of Income)

| Line | Description | Extract? | Notes |
|------|-------------|----------|-------|
| 1 | Ordinary business income (loss) | **YES** | Partner's share |
| 2 | Net rental real estate income | **YES** | May be non-operating |
| 3 | Other net rental income | **YES** | May be non-operating |
| 4a | Guaranteed payments for services | **YES** | **OWNER COMPENSATION** |
| 4b | Guaranteed payments for capital | **YES** | **OWNER COMPENSATION** |
| 4c | Total guaranteed payments | **YES** | **TOTAL OWNER COMP** |
| 5 | Interest income | **YES** | Usually non-operating |
| 6a | Ordinary dividends | **YES** | Usually non-operating |
| 7 | Royalties | **YES** | Evaluate |
| 8 | Net short-term capital gain | **YES** | Non-recurring |
| 9a | Net long-term capital gain | **YES** | Non-recurring |
| 10 | Net section 1231 gain | **YES** | Non-recurring |
| 11 | Other income | **YES** | Evaluate |
| 12 | Section 179 deduction | **YES** | **ADD BACK** |
| 19a | Distributions (cash and marketable securities) | **YES** | Actual cash received |
| 19b | Distributions (other property) | **YES** | Property received |

---

## Schedule C (Sole Proprietorship)

### Income Section

| Line | Description | Extract? | Notes |
|------|-------------|----------|-------|
| 1 | Gross receipts or sales | **YES** | Total revenue |
| 2 | Returns and allowances | **YES** | Subtract |
| 3 | Subtract line 2 from line 1 | **YES** | Net receipts |
| 4 | Cost of goods sold | **YES** | Direct costs |
| 5 | Gross profit | **YES** | Margin |
| 6 | Other income | **YES** | Evaluate |
| 7 | Gross income | **YES** | Total income |

### Expenses Section

| Line | Description | Extract? | Add Back? |
|------|-------------|----------|-----------|
| 8 | Advertising | **YES** | No |
| 9 | Car and truck expenses | **YES** | **50% typically personal** |
| 10 | Commissions and fees | **YES** | No |
| 11 | Contract labor | **YES** | No |
| 12 | Depletion | **YES** | **YES** |
| 13 | Depreciation and section 179 | **YES** | **YES** |
| 14 | Employee benefit programs | **YES** | **Owner portion** |
| 15 | Insurance (other than health) | **YES** | No |
| 16a | Interest (mortgage) | **YES** | **YES** - For EBITDA |
| 16b | Interest (other) | **YES** | **YES** - For EBITDA |
| 17 | Legal and professional services | **YES** | No |
| 18 | Office expense | **YES** | No |
| 19 | Pension and profit-sharing plans | **YES** | **Owner portion** |
| 20a | Rent (vehicles, machinery, equipment) | **YES** | No |
| 20b | Rent (other business property) | **YES** | Adjust if related party |
| 21 | Repairs and maintenance | **YES** | No |
| 22 | Supplies | **YES** | No |
| 23 | Taxes and licenses | **YES** | No |
| 24a | Travel | **YES** | **Evaluate personal component** |
| 24b | Deductible meals | **YES** | **50% typically personal** |
| 25 | Utilities | **YES** | No |
| 26 | Wages | **YES** | No |
| 27a | Other expenses (from line 48) | **YES** | **Review for personal** |
| 27b | Reserved | - | - |
| 28 | Total expenses | **YES** | Sum of 8-27a |
| 29 | Tentative profit (loss) | **YES** | Before home office |
| 30 | Expenses for business use of home | **YES** | **ADD BACK** |
| 31 | Net profit (loss) | **YES** | **STARTING POINT** |

---

## SDE Calculation Template

```
SELLER'S DISCRETIONARY EARNINGS CALCULATION

Business Name: _______________________
Tax Year: ___________________________
Entity Type: ________________________

STARTING POINT:
Net Income/Ordinary Business Income (Line 21/22/31)    $_____________

STANDARD ADD-BACKS:
+ Owner's Salary (Form 1120-S Line 7, or W-2)          $_____________
+ Owner's Payroll Taxes (7.65% of salary)              $_____________
+ Owner's Health Insurance                              $_____________
+ Owner's Retirement Contributions                      $_____________
+ Depreciation (Line 14/16c/13)                        $_____________
+ Amortization                                         $_____________
+ Interest Expense (Line 13/15/16a+16b)                $_____________
+ Section 179 Expense (Schedule K Line 12)             $_____________

DISCRETIONARY ADD-BACKS:
+ Personal Auto Expenses (50% of Line 9)               $_____________
+ Personal Travel                                      $_____________
+ Personal Meals (50% of Line 24b)                     $_____________
+ Personal Cell Phone                                  $_____________
+ Family Member Above-Market Salaries                  $_____________
+ Charitable Contributions                             $_____________
+ Home Office Deduction (Line 30)                      $_____________
+ One-Time Legal/Professional Fees                     $_____________
+ Non-Recurring Expenses                               $_____________

SUBTRACTIONS:
- Non-Recurring Income                                 $_____________
- Investment Income (if non-operating)                 $_____________
- Gain on Sale of Assets                               $_____________
- Below-Market Rent Adjustment                         $_____________

TOTAL SDE                                              $_____________

SDE as % of Revenue: ________%
(Healthy range: 15-40% depending on industry)
```

---

## Red Flags Checklist

### Income Red Flags
- [ ] Revenue declined >10% year-over-year without explanation
- [ ] Large "other income" without itemization
- [ ] Significant related party transactions
- [ ] Revenue recognition timing concerns
- [ ] Cash-heavy business with incomplete records

### Expense Red Flags
- [ ] Officer compensation significantly above/below market
- [ ] Large "other deductions" without detail
- [ ] Repairs that may be capital improvements
- [ ] Excessive travel and entertainment
- [ ] Related party rent payments above market

### Balance Sheet Red Flags
- [ ] Large loans to shareholders (Line 7 on Schedule L)
- [ ] Negative retained earnings
- [ ] Significant inventory fluctuations
- [ ] Accounts receivable aging concerns
- [ ] Unrecorded liabilities

### Cash Flow Red Flags
- [ ] Net income significantly different from distributions
- [ ] Declining cash despite reported profits
- [ ] Heavy reliance on debt financing
- [ ] Deferred revenue concerns

---

## Multi-Year Analysis

When multiple years are provided, calculate:

1. **Revenue Trend**
   - Year-over-year growth rate
   - 3-year CAGR (Compound Annual Growth Rate)
   - Identify seasonality or cyclicality

2. **SDE Trend**
   - Year-over-year change
   - SDE margin trend (SDE/Revenue)
   - Weighted average SDE (most recent year weighted higher)

3. **Weighted Average Calculation**
   ```
   Weighted SDE = (Year 1 SDE × 1) + (Year 2 SDE × 2) + (Year 3 SDE × 3)
                  ─────────────────────────────────────────────────────────
                                         6
   ```

4. **Normalization Adjustments**
   - COVID-19 impact (2020-2021)
   - PPP loan forgiveness
   - EIDL advances
   - Supply chain disruptions
   - Unusual one-time events
