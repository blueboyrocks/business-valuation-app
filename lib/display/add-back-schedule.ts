/**
 * AddBackSchedule - Detailed Normalization Schedule
 *
 * Generates comprehensive add-back schedules showing each earnings
 * normalization adjustment with rationales and source references.
 *
 * Key features:
 * - Categorized add-back items
 * - Automatic rationale generation
 * - Multi-year comparison support
 * - Source document references
 *
 * CRITICAL: Each add-back must be traceable to source documents
 */

// ============ ENUMS ============

export enum AddBackCategory {
  OFFICER_COMPENSATION = 'officer_compensation',
  DEPRECIATION_AMORTIZATION = 'depreciation_amortization',
  INTEREST_EXPENSE = 'interest_expense',
  DISCRETIONARY = 'discretionary',
  NON_RECURRING = 'non_recurring',
  PERSONAL_EXPENSES = 'personal_expenses',
  RENT_ADJUSTMENT = 'rent_adjustment',
  OTHER = 'other',
}

// ============ TYPES ============

export interface AddBackItemInput {
  description: string;
  category: AddBackCategory;
  amount: number;
  source: string;
  rationale?: string;
  year: number;
}

export interface AddBackItem extends AddBackItemInput {
  formatted_amount: string;
}

export interface AddBackScheduleInput {
  company_name: string;
  fiscal_year: number;
  starting_net_income: number;
  items: AddBackItemInput[];
}

export interface AddBackScheduleResult {
  company_name: string;
  fiscal_year: number;
  starting_net_income: number;
  formatted_starting_net_income: string;
  items: AddBackItem[];
  total_add_backs: number;
  formatted_total_add_backs: string;
  adjusted_sde: number;
  formatted_adjusted_sde: string;
}

export interface MultiYearComparison {
  company_name: string;
  years: AddBackScheduleResult[];
}

export interface YearInput {
  fiscal_year: number;
  starting_net_income: number;
  items: AddBackItemInput[];
}

export interface ScheduleValidation {
  is_complete: boolean;
  has_sources: boolean;
  warnings?: string[];
  errors?: string[];
}

export interface MarkdownOptions {
  include_rationales?: boolean;
}

// ============ RATIONALE TEMPLATES ============

const CATEGORY_RATIONALES: Record<AddBackCategory, string> = {
  [AddBackCategory.OFFICER_COMPENSATION]:
    'Officer compensation represents the salary and benefits paid to the owner(s). ' +
    'This amount is added back to normalize earnings and reflect true economic benefit ' +
    'available to a prospective buyer who would replace this compensation.',
  [AddBackCategory.DEPRECIATION_AMORTIZATION]:
    'Depreciation and amortization are non-cash charges that reduce reported earnings ' +
    'but do not represent actual cash outflows. These amounts are added back ' +
    'as they are accounting entries rather than operational expenses.',
  [AddBackCategory.INTEREST_EXPENSE]:
    'Interest expense is added back because it reflects the current owner\'s ' +
    'financing decisions. A buyer may have different capital structure and ' +
    'financing arrangements.',
  [AddBackCategory.DISCRETIONARY]:
    'Discretionary expenses represent costs that benefit the owner personally ' +
    'or are not essential to business operations. These are normalized to reflect ' +
    'expenses a typical buyer would or would not incur.',
  [AddBackCategory.NON_RECURRING]:
    'Non-recurring expenses are one-time costs not expected to repeat in normal ' +
    'business operations. These are added back to reflect sustainable earnings.',
  [AddBackCategory.PERSONAL_EXPENSES]:
    'Personal expenses run through the business are added back as they do not ' +
    'represent legitimate business costs and would not be incurred by a new owner.',
  [AddBackCategory.RENT_ADJUSTMENT]:
    'Rent adjustment normalizes occupancy costs to market rates when the business ' +
    'operates in owner-owned property or has below/above market lease terms.',
  [AddBackCategory.OTHER]:
    'This adjustment normalizes earnings to reflect true economic benefit ' +
    'available to a prospective buyer.',
};

// ============ HELPER FUNCTIONS ============

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

// ============ ADD-BACK SCHEDULE CLASS ============

export class AddBackSchedule {
  /**
   * Get the standard rationale for a category
   */
  getCategoryRationale(category: AddBackCategory): string {
    return CATEGORY_RATIONALES[category] || CATEGORY_RATIONALES[AddBackCategory.OTHER];
  }

  /**
   * Create an add-back item with validation
   */
  createItem(input: AddBackItemInput): AddBackItem {
    if (input.amount < 0) {
      throw new Error('Add-back amount must be positive');
    }

    return {
      ...input,
      rationale: input.rationale || this.getCategoryRationale(input.category),
      formatted_amount: formatCurrency(input.amount),
    };
  }

  /**
   * Generate a complete add-back schedule
   */
  generate(input: AddBackScheduleInput): AddBackScheduleResult {
    const items = input.items.map((item) => this.createItem(item));
    const totalAddBacks = items.reduce((sum, item) => sum + item.amount, 0);
    const adjustedSDE = input.starting_net_income + totalAddBacks;

    return {
      company_name: input.company_name,
      fiscal_year: input.fiscal_year,
      starting_net_income: input.starting_net_income,
      formatted_starting_net_income: formatCurrency(input.starting_net_income),
      items,
      total_add_backs: totalAddBacks,
      formatted_total_add_backs: formatCurrency(totalAddBacks),
      adjusted_sde: adjustedSDE,
      formatted_adjusted_sde: formatCurrency(adjustedSDE),
    };
  }

  /**
   * Group items by category
   */
  groupByCategory(items: AddBackItem[]): Record<AddBackCategory, AddBackItem[]> {
    const grouped: Record<AddBackCategory, AddBackItem[]> = {
      [AddBackCategory.OFFICER_COMPENSATION]: [],
      [AddBackCategory.DEPRECIATION_AMORTIZATION]: [],
      [AddBackCategory.INTEREST_EXPENSE]: [],
      [AddBackCategory.DISCRETIONARY]: [],
      [AddBackCategory.NON_RECURRING]: [],
      [AddBackCategory.PERSONAL_EXPENSES]: [],
      [AddBackCategory.RENT_ADJUSTMENT]: [],
      [AddBackCategory.OTHER]: [],
    };

    for (const item of items) {
      grouped[item.category].push(item);
    }

    return grouped;
  }

  /**
   * Generate multi-year comparison
   */
  generateMultiYearComparison(
    companyName: string,
    years: YearInput[]
  ): MultiYearComparison {
    const results = years.map((year) =>
      this.generate({
        company_name: companyName,
        fiscal_year: year.fiscal_year,
        starting_net_income: year.starting_net_income,
        items: year.items,
      })
    );

    // Sort by year descending (most recent first)
    results.sort((a, b) => b.fiscal_year - a.fiscal_year);

    return {
      company_name: companyName,
      years: results,
    };
  }

  /**
   * Validate schedule completeness
   */
  validate(result: AddBackScheduleResult): ScheduleValidation {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check if all items have sources
    const hasSources = result.items.every((item) => item.source && item.source.length > 0);
    if (!hasSources) {
      errors.push('Some add-back items are missing source references');
    }

    // Check for common missing categories
    const categories = new Set(result.items.map((item) => item.category));

    if (!categories.has(AddBackCategory.DEPRECIATION_AMORTIZATION)) {
      warnings.push(
        'No depreciation/amortization add-back found. Most businesses have depreciation expenses.'
      );
    }

    if (result.items.length === 0) {
      errors.push('Schedule has no add-back items');
    }

    return {
      is_complete: errors.length === 0,
      has_sources: hasSources,
      warnings: warnings.length > 0 ? warnings : undefined,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Generate markdown output
   */
  toMarkdown(result: AddBackScheduleResult, options?: MarkdownOptions): string {
    const includeRationales = options?.include_rationales ?? false;

    let md = `## Add-Back Schedule\n\n`;
    md += `**Company:** ${result.company_name}\n`;
    md += `**Fiscal Year:** ${result.fiscal_year}\n\n`;

    md += `| Description | Amount | Source |\n`;
    md += `|-------------|--------|--------|\n`;
    md += `| Net Income (Starting) | ${result.formatted_starting_net_income} | Tax Return |\n`;

    for (const item of result.items) {
      md += `| ${item.description} | ${item.formatted_amount} | ${item.source} |\n`;

      if (includeRationales && item.rationale) {
        md += `| *${item.rationale.substring(0, 80)}...* | | |\n`;
      }
    }

    md += `| **Total Add-Backs** | **${result.formatted_total_add_backs}** | |\n`;
    md += `| **Adjusted SDE** | **${result.formatted_adjusted_sde}** | |\n`;

    return md;
  }

  /**
   * Generate HTML output
   */
  toHTML(result: AddBackScheduleResult): string {
    let html = `<div class="add-back-schedule">\n`;
    html += `<h2>Add-Back Schedule</h2>\n`;
    html += `<p><strong>Company:</strong> ${result.company_name}</p>\n`;
    html += `<p><strong>Fiscal Year:</strong> ${result.fiscal_year}</p>\n`;

    html += `<table class="add-back-table">\n`;
    html += `<thead>\n`;
    html += `<tr><th>Description</th><th>Amount</th><th>Source</th></tr>\n`;
    html += `</thead>\n`;
    html += `<tbody>\n`;

    html += `<tr><td>Net Income (Starting)</td><td>${result.formatted_starting_net_income}</td><td>Tax Return</td></tr>\n`;

    for (const item of result.items) {
      html += `<tr><td>${item.description}</td><td>${item.formatted_amount}</td><td>${item.source}</td></tr>\n`;
    }

    html += `<tr class="total-row"><td><strong>Total Add-Backs</strong></td><td><strong>${result.formatted_total_add_backs}</strong></td><td></td></tr>\n`;
    html += `<tr class="sde-row"><td><strong>Adjusted SDE</strong></td><td><strong>${result.formatted_adjusted_sde}</strong></td><td></td></tr>\n`;

    html += `</tbody>\n`;
    html += `</table>\n`;
    html += `</div>`;

    return html;
  }
}

// ============ FACTORY FUNCTION ============

/**
 * Create a new AddBackSchedule
 */
export function createAddBackSchedule(): AddBackSchedule {
  return new AddBackSchedule();
}
