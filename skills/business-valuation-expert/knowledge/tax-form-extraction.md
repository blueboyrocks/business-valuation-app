# Tax Form Extraction Guide

## Form 1120 (C-Corporation)

### Page 1 - Income
- Line 1c: Gross receipts or sales
- Line 2: Cost of goods sold
- Line 3: Gross profit
- Line 11: Total income
- Lines 12-27: Deductions
- Line 28: Taxable income before NOL
- Line 30: Taxable income

### Schedule L - Balance Sheet
- Line 1: Cash
- Line 2a-2b: Trade notes and accounts receivable
- Line 3: Inventories
- Line 4: Government obligations
- Line 5: Tax-exempt securities
- Line 6: Other current assets
- Line 7: Loans to shareholders
- Line 8: Mortgage and real estate loans
- Line 9a-9b: Other investments
- Line 10a-10b: Buildings and other depreciable assets
- Line 11: Depletable assets
- Line 12: Land
- Line 13a-13b: Intangible assets
- Line 14: Other assets
- Line 15: Total assets

Liabilities:
- Line 16: Accounts payable
- Line 17: Mortgages, notes, bonds payable (< 1 year)
- Line 18: Other current liabilities
- Line 19: Loans from shareholders
- Line 20: Mortgages, notes, bonds payable (≥ 1 year)
- Line 21: Other liabilities
- Line 22: Capital stock
- Line 23: Additional paid-in capital
- Line 24: Retained earnings
- Line 25: Adjustments to shareholders' equity
- Line 26: Less cost of treasury stock
- Line 27: Total liabilities and shareholders' equity

### Schedule M-1 - Income Reconciliation
Key add-back items often found here:
- Meals and entertainment (50% non-deductible)
- Travel expenses
- Life insurance premiums on officers
- Non-deductible penalties and fines

## Form 1120-S (S-Corporation)

### Page 1 - Income
- Line 1c: Gross receipts or sales
- Line 2: Cost of goods sold
- Line 3: Gross profit
- Line 6: Total income
- Lines 7-19: Deductions
- Line 7: Compensation of officers (CRITICAL for SDE)
- Line 8: Salaries and wages (excluding officers)
- Line 14: Depreciation
- Line 15: Depletion
- Line 16: Advertising
- Line 17: Pension, profit-sharing plans
- Line 18: Employee benefit programs
- Line 19: Other deductions
- Line 21: Ordinary business income (loss)

### Schedule K - Shareholders' Pro Rata Items
- Line 1: Ordinary business income (loss)
- Line 2: Net rental real estate income
- Line 3: Other net rental income
- Line 4: Interest income
- Line 5: Dividends
- Line 6: Royalties
- Line 7: Net short-term capital gain
- Line 8a: Net long-term capital gain
- Line 10: Net section 1231 gain
- Line 11: Other income

### Schedule M-1 - Similar to Form 1120

## Form 1065 (Partnership)

### Page 1 - Income
- Line 1c: Gross receipts or sales
- Line 2: Cost of goods sold
- Line 3: Gross profit
- Lines 4-7: Other income items
- Line 8: Total income
- Lines 9-20: Deductions
- Line 10: Guaranteed payments to partners (CRITICAL for SDE)
- Line 16a: Depreciation
- Line 22: Ordinary business income (loss)

### Schedule K - Partners' Distributive Share Items
Similar structure to Form 1120-S Schedule K

### Schedule L - Balance Sheet
Similar structure to Form 1120

## Schedule C (Sole Proprietorship)

### Part I - Income
- Line 1: Gross receipts or sales
- Line 2: Returns and allowances
- Line 3: Net receipts
- Line 4: Cost of goods sold
- Line 5: Gross profit
- Line 6: Other income
- Line 7: Gross income

### Part II - Expenses
- Line 8: Advertising
- Line 9: Car and truck expenses
- Line 10: Commissions and fees
- Line 11: Contract labor
- Line 12: Depletion
- Line 13: Depreciation
- Line 14: Employee benefit programs
- Line 15: Insurance (other than health)
- Line 16a: Interest - mortgage
- Line 16b: Interest - other
- Line 17: Legal and professional services
- Line 18: Office expense
- Line 19: Pension and profit-sharing plans
- Line 20a: Rent - vehicles, machinery, equipment
- Line 20b: Rent - other business property
- Line 21: Repairs and maintenance
- Line 22: Supplies
- Line 23: Taxes and licenses
- Line 24a: Travel
- Line 24b: Meals (subject to limitations)
- Line 25: Utilities
- Line 26: Wages
- Line 27a: Other expenses
- Line 28: Total expenses
- Line 29: Tentative profit (loss)
- Line 30: Expenses for business use of home
- Line 31: Net profit (loss)

## Key Extraction Points for Valuation

### Always Extract:
1. **Gross Revenue** - Primary indicator of business size
2. **Cost of Goods Sold** - For gross margin calculation
3. **Officer/Owner Compensation** - Critical for SDE normalization
4. **Depreciation** - Always added back for EBITDA
5. **Interest Expense** - Added back for EBITDA
6. **Rent Expense** - Check if below market (related party)
7. **Total Assets** - For asset approach
8. **Total Liabilities** - For book value calculation

### Red Flags to Note:
- Declining revenue trends
- Negative net income
- Related party transactions
- Unusual one-time expenses
- Missing or incomplete schedules
- Significant changes year-over-year
- Loans to/from shareholders
