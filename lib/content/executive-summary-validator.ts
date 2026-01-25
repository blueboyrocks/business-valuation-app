/**
 * ExecutiveSummaryValidator - Executive Summary Quality Validation
 *
 * Validates that executive summaries meet premium report standards:
 * - 600-900 word requirement
 * - All required subsections present
 * - At least 5 specific financial figures
 *
 * CRITICAL: Premium reports require comprehensive executive summaries
 */

// ============ TYPES ============

export interface ExecutiveSummaryRequirements {
  min_word_count: number;
  max_word_count: number;
  min_financial_figures: number;
  required_sections: string[];
}

export interface WordCountResult {
  valid: boolean;
  word_count: number;
  error?: string;
}

export interface SectionsResult {
  valid: boolean;
  present_sections: string[];
  missing_sections: string[];
}

export interface FinancialFiguresResult {
  valid: boolean;
  figure_count: number;
  figures: string[];
  error?: string;
}

export interface ExecutiveSummaryValidationResult {
  valid: boolean;
  word_count: WordCountResult;
  sections: SectionsResult;
  financial_figures: FinancialFiguresResult;
  recommendations: string[];
}

// ============ DEFAULT REQUIREMENTS ============

const DEFAULT_REQUIREMENTS: ExecutiveSummaryRequirements = {
  min_word_count: 600,
  max_word_count: 900,
  min_financial_figures: 5,
  required_sections: [
    'company overview',
    'key findings',
    'valuation methodology',
    'valuation conclusion',
  ],
};

// ============ FINANCIAL FIGURE PATTERNS ============

const FINANCIAL_PATTERNS = [
  /\$[\d,]+(?:\.\d{2})?(?:\s*(?:million|billion|M|B|K))?/gi, // $1,234,567 or $2.5M
  /\$\d+(?:\.\d+)?[MBK]/gi, // $2.5M format
  /[\d.]+%/g, // Percentages
  /[\d.]+x\b/gi, // Multiples like 2.65x
  /\d{1,3}(?:,\d{3})+/g, // Large numbers with commas
];

// ============ VALIDATOR CLASS ============

export class ExecutiveSummaryValidator {
  private readonly requirements: ExecutiveSummaryRequirements;

  constructor(customRequirements?: Partial<ExecutiveSummaryRequirements>) {
    this.requirements = { ...DEFAULT_REQUIREMENTS, ...customRequirements };
  }

  /**
   * Get current requirements
   */
  getRequirements(): ExecutiveSummaryRequirements {
    return { ...this.requirements };
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    const cleaned = text.trim().replace(/\s+/g, ' ');
    if (cleaned.length === 0) return 0;
    return cleaned.split(' ').filter((word) => word.length > 0).length;
  }

  /**
   * Validate word count
   */
  validateWordCount(text: string): WordCountResult {
    const wordCount = this.countWords(text);

    if (wordCount < this.requirements.min_word_count) {
      return {
        valid: false,
        word_count: wordCount,
        error: `Word count (${wordCount}) is below minimum of ${this.requirements.min_word_count}`,
      };
    }

    if (wordCount > this.requirements.max_word_count) {
      return {
        valid: false,
        word_count: wordCount,
        error: `Word count (${wordCount}) exceeds maximum of ${this.requirements.max_word_count}`,
      };
    }

    return {
      valid: true,
      word_count: wordCount,
    };
  }

  /**
   * Check if text has a specific section
   */
  hasSection(text: string, sectionName: string): boolean {
    const normalizedText = text.toLowerCase();
    const normalizedSection = sectionName.toLowerCase();

    // Look for section headers with various markdown formats
    const patterns = [
      new RegExp(`##\\s*${normalizedSection}`, 'i'),
      new RegExp(`###\\s*${normalizedSection}`, 'i'),
      new RegExp(`\\*\\*${normalizedSection}\\*\\*`, 'i'),
      new RegExp(`^${normalizedSection}:?\\s*$`, 'im'),
    ];

    return patterns.some((pattern) => pattern.test(text));
  }

  /**
   * Validate presence of required sections
   */
  validateSections(text: string): SectionsResult {
    const presentSections: string[] = [];
    const missingSections: string[] = [];

    for (const section of this.requirements.required_sections) {
      if (this.hasSection(text, section)) {
        presentSections.push(section);
      } else {
        missingSections.push(section);
      }
    }

    return {
      valid: missingSections.length === 0,
      present_sections: presentSections,
      missing_sections: missingSections,
    };
  }

  /**
   * Extract financial figures from text
   */
  extractFinancialFigures(text: string): string[] {
    const figures = new Set<string>();

    for (const pattern of FINANCIAL_PATTERNS) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          figures.add(match);
        }
      }
    }

    return Array.from(figures);
  }

  /**
   * Validate financial figures count
   */
  validateFinancialFigures(text: string): FinancialFiguresResult {
    const figures = this.extractFinancialFigures(text);
    const figureCount = figures.length;

    if (figureCount < this.requirements.min_financial_figures) {
      return {
        valid: false,
        figure_count: figureCount,
        figures,
        error: `Found ${figureCount} financial figures, minimum ${this.requirements.min_financial_figures} required`,
      };
    }

    return {
      valid: true,
      figure_count: figureCount,
      figures,
    };
  }

  /**
   * Complete validation of executive summary
   */
  validate(text: string): ExecutiveSummaryValidationResult {
    const wordCountResult = this.validateWordCount(text);
    const sectionsResult = this.validateSections(text);
    const financialFiguresResult = this.validateFinancialFigures(text);

    const recommendations: string[] = [];

    // Word count recommendations
    if (!wordCountResult.valid) {
      if (wordCountResult.word_count < this.requirements.min_word_count) {
        const needed = this.requirements.min_word_count - wordCountResult.word_count;
        recommendations.push(
          `Expand executive summary by approximately ${needed} words to meet minimum of ${this.requirements.min_word_count}`
        );
      } else {
        const excess = wordCountResult.word_count - this.requirements.max_word_count;
        recommendations.push(
          `Reduce executive summary by approximately ${excess} words to meet maximum of ${this.requirements.max_word_count}`
        );
      }
    }

    // Section recommendations
    if (!sectionsResult.valid) {
      for (const section of sectionsResult.missing_sections) {
        recommendations.push(`Add "${section}" section to executive summary`);
      }
    }

    // Financial figures recommendations
    if (!financialFiguresResult.valid) {
      const needed =
        this.requirements.min_financial_figures - financialFiguresResult.figure_count;
      recommendations.push(
        `Include ${needed} more specific financial figures (revenue, profit, value, etc.)`
      );
    }

    const isValid =
      wordCountResult.valid && sectionsResult.valid && financialFiguresResult.valid;

    return {
      valid: isValid,
      word_count: wordCountResult,
      sections: sectionsResult,
      financial_figures: financialFiguresResult,
      recommendations,
    };
  }
}

// ============ FACTORY FUNCTION ============

/**
 * Create a new ExecutiveSummaryValidator
 */
export function createExecutiveSummaryValidator(
  customRequirements?: Partial<ExecutiveSummaryRequirements>
): ExecutiveSummaryValidator {
  return new ExecutiveSummaryValidator(customRequirements);
}
