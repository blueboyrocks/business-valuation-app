/**
 * ExecutiveSummaryValidator Unit Tests
 * TDD: Tests written before implementation
 *
 * Validates executive summary meets premium report requirements:
 * - 600-900 word count
 * - All required subsections present
 * - At least 5 specific financial figures
 */
import { describe, it, expect } from 'vitest';
import {
  ExecutiveSummaryValidator,
  createExecutiveSummaryValidator,
  ExecutiveSummaryRequirements,
  ExecutiveSummaryValidationResult,
} from '../executive-summary-validator';

describe('ExecutiveSummaryValidator', () => {
  describe('Word Count Validation', () => {
    it('should accept 600-900 word count as valid', () => {
      const validator = createExecutiveSummaryValidator();

      // Generate text with ~750 words
      const text = 'word '.repeat(750);

      const result = validator.validateWordCount(text);

      expect(result.valid).toBe(true);
      expect(result.word_count).toBeGreaterThanOrEqual(600);
      expect(result.word_count).toBeLessThanOrEqual(900);
    });

    it('should warn if word count below 600', () => {
      const validator = createExecutiveSummaryValidator();

      const text = 'word '.repeat(400);

      const result = validator.validateWordCount(text);

      expect(result.valid).toBe(false);
      expect(result.word_count).toBeLessThan(600);
      expect(result.error).toContain('below');
    });

    it('should warn if word count above 900', () => {
      const validator = createExecutiveSummaryValidator();

      const text = 'word '.repeat(1000);

      const result = validator.validateWordCount(text);

      expect(result.valid).toBe(false);
      expect(result.word_count).toBeGreaterThan(900);
      expect(result.error).toContain('exceeds');
    });

    it('should count words correctly ignoring extra whitespace', () => {
      const validator = createExecutiveSummaryValidator();

      const text = '  word   word   word  \n\n  word   word  ';

      const result = validator.validateWordCount(text);

      expect(result.word_count).toBe(5);
    });
  });

  describe('Required Subsections', () => {
    it('should validate presence of company overview section', () => {
      const validator = createExecutiveSummaryValidator();

      const textWithSection = `
        ## Company Overview
        The company is a leading provider of engineering services.
      `;
      const textWithoutSection = `
        ## Some Other Section
        Random content here.
      `;

      expect(validator.hasSection(textWithSection, 'company overview')).toBe(true);
      expect(validator.hasSection(textWithoutSection, 'company overview')).toBe(false);
    });

    it('should validate presence of valuation conclusion section', () => {
      const validator = createExecutiveSummaryValidator();

      const textWithSection = `
        ## Valuation Conclusion
        Based on our analysis, the fair market value is $2.8 million.
      `;

      expect(validator.hasSection(textWithSection, 'valuation conclusion')).toBe(true);
    });

    it('should validate presence of key findings section', () => {
      const validator = createExecutiveSummaryValidator();

      const textWithSection = `
        ## Key Findings
        - Strong revenue growth
        - Diversified customer base
      `;

      expect(validator.hasSection(textWithSection, 'key findings')).toBe(true);
    });

    it('should validate all required sections at once', () => {
      const validator = createExecutiveSummaryValidator();

      const completeText = `
        ## Company Overview
        K-Factor Engineering is a professional engineering services firm.

        ## Key Findings
        - Revenue growth of 36% year-over-year
        - Strong profit margins

        ## Valuation Methodology
        We employed multiple valuation approaches.

        ## Valuation Conclusion
        The fair market value is estimated at $2.8 million.
      `;

      const result = validator.validateSections(completeText);

      expect(result.valid).toBe(true);
      expect(result.missing_sections.length).toBe(0);
    });

    it('should identify missing sections', () => {
      const validator = createExecutiveSummaryValidator();

      const incompleteText = `
        ## Company Overview
        Some company description.
      `;

      const result = validator.validateSections(incompleteText);

      expect(result.valid).toBe(false);
      expect(result.missing_sections.length).toBeGreaterThan(0);
    });
  });

  describe('Financial Figures', () => {
    it('should detect financial figures in text', () => {
      const validator = createExecutiveSummaryValidator();

      const text = `
        The company reported revenue of $6,265,024 in FY2024.
        Net income was $728,412, representing a 11.6% margin.
        SDE totaled $1,040,718 after normalization adjustments.
        The concluded value is $2,800,000 with a range of $2.4M - $3.2M.
      `;

      const figures = validator.extractFinancialFigures(text);

      expect(figures.length).toBeGreaterThanOrEqual(5);
    });

    it('should require minimum 5 financial figures', () => {
      const validator = createExecutiveSummaryValidator();

      const textWithFewFigures = `
        The value is $2.8 million.
      `;

      const result = validator.validateFinancialFigures(textWithFewFigures);

      expect(result.valid).toBe(false);
      expect(result.figure_count).toBeLessThan(5);
      expect(result.error).toContain('minimum');
    });

    it('should accept 5+ financial figures', () => {
      const validator = createExecutiveSummaryValidator();

      const textWithFigures = `
        Revenue: $6,265,024. Net Income: $728,412. SDE: $1,040,718.
        Value: $2,800,000. Range: $2.4M to $3.2M. Multiple: 2.65x.
      `;

      const result = validator.validateFinancialFigures(textWithFigures);

      expect(result.valid).toBe(true);
      expect(result.figure_count).toBeGreaterThanOrEqual(5);
    });

    it('should detect various currency formats', () => {
      const validator = createExecutiveSummaryValidator();

      const text = `
        $1,234,567
        $2.5M
        $500K
        2.65x multiple
        15% growth
      `;

      const figures = validator.extractFinancialFigures(text);

      expect(figures.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Complete Validation', () => {
    it('should validate complete executive summary', () => {
      const validator = createExecutiveSummaryValidator();

      // Generate a complete, valid executive summary
      const validSummary = `
        ## Company Overview

        K-Factor Engineering, Inc. is a professional engineering services firm
        specializing in structural and civil engineering consulting. Founded in 2015,
        the company has established itself as a reputable provider serving commercial
        and residential clients throughout the metropolitan area. The company operates
        from a leased facility and employs 12 full-time professionals including
        licensed engineers and support staff.

        ## Key Findings

        Our analysis identified several key factors influencing value:

        - Revenue of $6,265,024 in FY2024 represents 36% year-over-year growth
        - Net income of $728,412 demonstrates strong profitability
        - Normalized SDE of $1,040,718 provides the basis for valuation
        - Customer concentration is moderate with top 5 clients at 45% of revenue
        - Management team has strong industry experience and client relationships

        ## Valuation Methodology

        We employed multiple valuation approaches to triangulate value:

        - Asset Approach: Based on adjusted book value of tangible and intangible assets
        - Income Approach: Capitalization of normalized earnings at appropriate rate
        - Market Approach: Application of industry multiples to benefit stream

        The median SDE multiple for Engineering Services (NAICS 541330) is 2.65x
        based on market transaction data from BizBuySell and Business Reference Guide.

        ## Valuation Conclusion

        Based on our comprehensive analysis, we conclude that the fair market value
        of K-Factor Engineering, Inc. as of December 31, 2024 is:

        **$2,800,000** (Two Million Eight Hundred Thousand Dollars)

        This value falls within our estimated range of $2,400,000 to $3,200,000 and
        represents a 40% premium to the BizEquity automated valuation of $2,000,000,
        which we attribute to the company's strong growth trajectory and profit margins.

        ${ 'word '.repeat(400) }
      `;

      const result = validator.validate(validSummary);

      expect(result.valid).toBe(true);
      expect(result.word_count.valid).toBe(true);
      expect(result.sections.valid).toBe(true);
      expect(result.financial_figures.valid).toBe(true);
    });

    it('should identify all issues with invalid summary', () => {
      const validator = createExecutiveSummaryValidator();

      const invalidSummary = `
        ## Introduction

        This is a brief summary.
      `;

      const result = validator.validate(invalidSummary);

      expect(result.valid).toBe(false);
      expect(result.word_count.valid).toBe(false);
      expect(result.sections.valid).toBe(false);
      expect(result.financial_figures.valid).toBe(false);
    });

    it('should return recommendations for improvement', () => {
      const validator = createExecutiveSummaryValidator();

      const partialSummary = `
        ## Company Overview

        Test company description with $1M revenue and $200K profit.

        ${ 'word '.repeat(150) }
      `;

      const result = validator.validate(partialSummary);

      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Requirements Configuration', () => {
    it('should allow custom word count requirements', () => {
      const validator = createExecutiveSummaryValidator({
        min_word_count: 500,
        max_word_count: 1000,
      });

      const text = 'word '.repeat(550);
      const result = validator.validateWordCount(text);

      expect(result.valid).toBe(true);
    });

    it('should allow custom minimum financial figures', () => {
      const validator = createExecutiveSummaryValidator({
        min_financial_figures: 3,
      });

      const text = '$1M revenue, $200K profit, and $800K value.';
      const result = validator.validateFinancialFigures(text);

      expect(result.valid).toBe(true);
    });

    it('should return default requirements', () => {
      const validator = createExecutiveSummaryValidator();

      const requirements = validator.getRequirements();

      expect(requirements.min_word_count).toBe(600);
      expect(requirements.max_word_count).toBe(900);
      expect(requirements.min_financial_figures).toBe(5);
      expect(requirements.required_sections.length).toBeGreaterThan(0);
    });
  });
});
