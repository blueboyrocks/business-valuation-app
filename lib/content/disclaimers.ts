/**
 * DisclaimerManager - Professional Disclaimers and Assumptions
 *
 * Manages standard assumptions and limiting conditions for valuation reports
 * to ensure legal compliance and set appropriate expectations.
 *
 * Key features:
 * - Standard industry disclaimers
 * - Customizable context (company name, dates)
 * - Assumptions and limiting conditions
 * - Professional standards compliance
 *
 * CRITICAL: All professional valuation reports must include these sections
 */

// ============ ENUMS ============

export enum DisclaimerType {
  PURPOSE_AND_USE = 'purpose_and_use',
  ASSUMPTIONS = 'assumptions',
  LIMITING_CONDITIONS = 'limiting_conditions',
  DATA_RELIANCE = 'data_reliance',
  MARKET_CONDITIONS = 'market_conditions',
  CONFIDENTIALITY = 'confidentiality',
  NO_LEGAL_ADVICE = 'no_legal_advice',
  STANDARD_OF_VALUE = 'standard_of_value',
}

// ============ TYPES ============

export interface Disclaimer {
  type: DisclaimerType;
  title: string;
  content: string;
}

export interface DisclaimerContext {
  company_name: string;
  valuation_date: string;
  report_date: string;
  industry?: string;
  naics_code?: string;
  standard_of_value?: string;
  purpose?: string;
}

export interface DisclaimerValidation {
  is_complete: boolean;
  missing_disclaimers?: DisclaimerType[];
}

// ============ STANDARD DISCLAIMERS ============

const STANDARD_DISCLAIMERS: Record<DisclaimerType, Omit<Disclaimer, 'type'>> = {
  [DisclaimerType.PURPOSE_AND_USE]: {
    title: 'Purpose and Intended Use',
    content:
      'This valuation report has been prepared for {{company_name}} for the sole purpose ' +
      'of estimating the fair market value of the business. This report is intended for ' +
      'use by the intended recipient(s) only and should not be relied upon by any other ' +
      'party without the express written consent of the valuator. The conclusions contained ' +
      'herein are valid only for the specific purpose stated and may not be applicable for ' +
      'other purposes such as taxation, litigation, or regulatory compliance.',
  },
  [DisclaimerType.ASSUMPTIONS]: {
    title: 'Assumptions',
    content:
      'This valuation is based on certain assumptions about {{company_name}} and market ' +
      'conditions. These assumptions are detailed in this section. If any assumption proves ' +
      'to be incorrect, the value conclusion may require revision. The valuator has relied ' +
      'on information provided by management and has not independently verified all data.',
  },
  [DisclaimerType.LIMITING_CONDITIONS]: {
    title: 'Limiting Conditions',
    content:
      'This valuation is subject to certain limiting conditions. The valuator assumes no ' +
      'liability for matters of a legal nature affecting the subject company or title thereto, ' +
      'nor does the valuator render any opinion as to title. This report does not constitute ' +
      'legal, tax, or investment advice. The estimated value is as of {{valuation_date}} and ' +
      'may change due to subsequent events or changes in market conditions.',
  },
  [DisclaimerType.DATA_RELIANCE]: {
    title: 'Data Reliance',
    content:
      'In preparing this valuation, we have relied upon financial information and other data ' +
      'provided by the management of {{company_name}}. We have not audited or independently ' +
      'verified such information and assume no responsibility for its accuracy or completeness. ' +
      'Should any information prove to be materially different from that relied upon, the ' +
      'value conclusion may require adjustment.',
  },
  [DisclaimerType.MARKET_CONDITIONS]: {
    title: 'Market Conditions',
    content:
      'The valuation reflects market conditions as of {{valuation_date}}. Economic conditions, ' +
      'industry dynamics, and other external factors may change, potentially affecting the ' +
      'value of the subject company. This valuation does not predict future market conditions ' +
      'or the future performance of the business.',
  },
  [DisclaimerType.CONFIDENTIALITY]: {
    title: 'Confidentiality',
    content:
      'This report contains confidential and proprietary information about {{company_name}}. ' +
      'The information contained herein should not be disclosed to any third party without ' +
      'the express written consent of the company and the valuator. Recipients of this report ' +
      'agree to maintain confidentiality of all non-public information.',
  },
  [DisclaimerType.NO_LEGAL_ADVICE]: {
    title: 'No Legal or Tax Advice',
    content:
      'Nothing in this report constitutes legal or tax advice. Readers should consult with ' +
      'qualified legal and tax professionals regarding any legal or tax matters related to ' +
      'the subject company or this valuation. The valuator makes no representations regarding ' +
      'the tax or legal consequences of the transaction.',
  },
  [DisclaimerType.STANDARD_OF_VALUE]: {
    title: 'Standard of Value',
    content:
      'This valuation estimates the Fair Market Value of the subject company. Fair Market ' +
      'Value is defined as the price at which property would change hands between a willing ' +
      'buyer and a willing seller, neither being under compulsion to buy or sell, and both ' +
      'having reasonable knowledge of relevant facts. This standard assumes a hypothetical ' +
      'transaction and does not consider any specific buyer or seller.',
  },
};

// ============ STANDARD ASSUMPTIONS ============

const STANDARD_ASSUMPTIONS: string[] = [
  'The business will continue as a going concern and will not be liquidated or sold under distress conditions.',
  'Information provided by management is accurate and complete to the best of their knowledge.',
  'There are no hidden or undisclosed liabilities that would materially affect the value.',
  'The financial statements fairly represent the financial position of the company.',
  'Current management will continue to operate the business competently.',
  'There are no pending or threatened legal actions that would materially affect value.',
  'All required licenses, permits, and authorizations will remain in effect.',
  'Economic and industry conditions will remain relatively stable in the near term.',
];

// ============ LIMITING CONDITIONS ============

const LIMITING_CONDITIONS: string[] = [
  'The valuator shall not be required to give testimony or appear in court by reason of this valuation unless arrangements have been made in advance.',
  'The valuator assumes no responsibility for matters of a legal nature affecting the subject company or its title.',
  'The valuator shall not be held liable for any loss arising from reliance on this valuation for purposes other than those stated.',
  'This valuation is based on the definition of Fair Market Value and may not be appropriate for other standards of value.',
  'The valuator has not made a physical inspection of the company assets unless specifically noted.',
  'This report is valid only for the valuation date stated herein and may not reflect changes in value subsequent to that date.',
  'The value conclusion assumes the company is free of any liens or encumbrances unless otherwise stated.',
  'The valuator makes no warranty as to the achievability of any projected financial results.',
];

// ============ DISCLAIMER MANAGER CLASS ============

export class DisclaimerManager {
  private customAssumptions: string[] = [];
  private customConditions: string[] = [];

  /**
   * Get a specific disclaimer
   */
  getDisclaimer(type: DisclaimerType, context?: DisclaimerContext): Disclaimer {
    const template = STANDARD_DISCLAIMERS[type];

    let content = template.content;

    // Apply context substitutions
    if (context) {
      content = content.replace(/\{\{company_name\}\}/g, context.company_name);
      content = content.replace(/\{\{valuation_date\}\}/g, context.valuation_date);
      content = content.replace(/\{\{report_date\}\}/g, context.report_date);

      if (context.industry) {
        content = content.replace(/\{\{industry\}\}/g, context.industry);
      }
    }

    return {
      type,
      title: template.title,
      content,
    };
  }

  /**
   * Get all disclaimers
   */
  getAllDisclaimers(context?: DisclaimerContext): Disclaimer[] {
    return Object.values(DisclaimerType).map((type) =>
      this.getDisclaimer(type, context)
    );
  }

  /**
   * Get disclaimers relevant to a specific context
   */
  getDisclaimersForContext(context: DisclaimerContext): Disclaimer[] {
    // Return all standard disclaimers customized for context
    return this.getAllDisclaimers(context);
  }

  /**
   * Get standard assumptions
   */
  getStandardAssumptions(): string[] {
    return [...STANDARD_ASSUMPTIONS, ...this.customAssumptions];
  }

  /**
   * Add a custom assumption
   */
  addCustomAssumption(assumption: string): void {
    this.customAssumptions.push(assumption);
  }

  /**
   * Get limiting conditions
   */
  getLimitingConditions(): string[] {
    return [...LIMITING_CONDITIONS, ...this.customConditions];
  }

  /**
   * Add a custom limiting condition
   */
  addLimitingCondition(condition: string): void {
    this.customConditions.push(condition);
  }

  /**
   * Generate complete disclaimers section as markdown
   */
  generateDisclaimersMarkdown(context: DisclaimerContext): string {
    let markdown = '# Assumptions and Limiting Conditions\n\n';

    // Purpose and Use
    const purposeDisclaimer = this.getDisclaimer(
      DisclaimerType.PURPOSE_AND_USE,
      context
    );
    markdown += `## ${purposeDisclaimer.title}\n\n`;
    markdown += `${purposeDisclaimer.content}\n\n`;

    // Standard of Value
    const valueDisclaimer = this.getDisclaimer(
      DisclaimerType.STANDARD_OF_VALUE,
      context
    );
    markdown += `## ${valueDisclaimer.title}\n\n`;
    markdown += `${valueDisclaimer.content}\n\n`;

    // Assumptions
    markdown += '## Assumptions\n\n';
    markdown += 'This valuation is based on the following assumptions:\n\n';
    for (const assumption of this.getStandardAssumptions()) {
      markdown += `- ${assumption}\n`;
    }
    markdown += '\n';

    // Limiting Conditions
    markdown += '## Limiting Conditions\n\n';
    markdown += 'This valuation is subject to the following limiting conditions:\n\n';
    for (const condition of this.getLimitingConditions()) {
      markdown += `- ${condition}\n`;
    }
    markdown += '\n';

    // Data Reliance
    const dataDisclaimer = this.getDisclaimer(DisclaimerType.DATA_RELIANCE, context);
    markdown += `## ${dataDisclaimer.title}\n\n`;
    markdown += `${dataDisclaimer.content}\n\n`;

    // Market Conditions
    const marketDisclaimer = this.getDisclaimer(
      DisclaimerType.MARKET_CONDITIONS,
      context
    );
    markdown += `## ${marketDisclaimer.title}\n\n`;
    markdown += `${marketDisclaimer.content}\n\n`;

    // Confidentiality
    const confidentialityDisclaimer = this.getDisclaimer(
      DisclaimerType.CONFIDENTIALITY,
      context
    );
    markdown += `## ${confidentialityDisclaimer.title}\n\n`;
    markdown += `${confidentialityDisclaimer.content}\n\n`;

    return markdown;
  }

  /**
   * Generate disclaimers as HTML
   */
  generateDisclaimersHTML(context: DisclaimerContext): string {
    let html = '<div class="disclaimers">\n';
    html += '<h1>Assumptions and Limiting Conditions</h1>\n';

    // Purpose
    const purposeDisclaimer = this.getDisclaimer(
      DisclaimerType.PURPOSE_AND_USE,
      context
    );
    html += `<div class="disclaimer-section">\n`;
    html += `<h2>${purposeDisclaimer.title}</h2>\n`;
    html += `<p>${purposeDisclaimer.content}</p>\n`;
    html += `</div>\n`;

    // Assumptions
    html += `<div class="disclaimer-section">\n`;
    html += `<h2>Assumptions</h2>\n`;
    html += `<p>This valuation is based on the following assumptions:</p>\n`;
    html += `<ul>\n`;
    for (const assumption of this.getStandardAssumptions()) {
      html += `<li>${assumption}</li>\n`;
    }
    html += `</ul>\n`;
    html += `</div>\n`;

    // Limiting Conditions
    html += `<div class="disclaimer-section">\n`;
    html += `<h2>Limiting Conditions</h2>\n`;
    html += `<p>This valuation is subject to the following limiting conditions:</p>\n`;
    html += `<ul>\n`;
    for (const condition of this.getLimitingConditions()) {
      html += `<li>${condition}</li>\n`;
    }
    html += `</ul>\n`;
    html += `</div>\n`;

    html += '</div>';

    return html;
  }

  /**
   * Validate that all required disclaimers are present
   */
  validateCompleteness(context: DisclaimerContext): DisclaimerValidation {
    const requiredTypes = [
      DisclaimerType.PURPOSE_AND_USE,
      DisclaimerType.ASSUMPTIONS,
      DisclaimerType.LIMITING_CONDITIONS,
      DisclaimerType.DATA_RELIANCE,
    ];

    const allDisclaimers = this.getAllDisclaimers(context);
    const presentTypes = new Set(allDisclaimers.map((d) => d.type));

    const missingTypes = requiredTypes.filter((type) => !presentTypes.has(type));

    return {
      is_complete: missingTypes.length === 0,
      missing_disclaimers: missingTypes.length > 0 ? missingTypes : undefined,
    };
  }

  /**
   * Reset custom additions
   */
  reset(): void {
    this.customAssumptions = [];
    this.customConditions = [];
  }
}

// ============ FACTORY FUNCTION ============

/**
 * Create a new DisclaimerManager
 */
export function createDisclaimerManager(): DisclaimerManager {
  return new DisclaimerManager();
}
