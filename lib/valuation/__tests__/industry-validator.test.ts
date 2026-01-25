/**
 * IndustryReferenceValidator Unit Tests
 * TDD: Tests written before implementation
 */
import { describe, it, expect } from 'vitest';
import {
  IndustryReferenceValidator,
  createIndustryValidator,
  ValidationResult,
} from '../industry-validator';
import { createIndustryLock } from '../industry-lock';

describe('IndustryReferenceValidator', () => {
  const engineeringLock = createIndustryLock({
    naics_code: '541330',
    naics_description: 'Engineering Services',
    locked_by_pass: 2,
  });

  describe('validateNarrative', () => {
    it('should pass valid engineering services narrative', () => {
      const validator = createIndustryValidator(engineeringLock);

      const validNarrative = `
        K-Factor Engineering provides civil engineering and surveying services
        to municipal clients. The company has established strong relationships
        with government agencies for infrastructure projects.
      `;

      const result = validator.validateNarrative(validNarrative);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail narrative with HVAC references', () => {
      const validator = createIndustryValidator(engineeringLock);

      const invalidNarrative = `
        The company provides HVAC installation and heating system repairs.
        Their technicians are skilled in air conditioning maintenance.
      `;

      const result = validator.validateNarrative(invalidNarrative);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.toLowerCase().includes('hvac'))).toBe(true);
    });

    it('should fail narrative with restaurant references', () => {
      const validator = createIndustryValidator(engineeringLock);

      const invalidNarrative = `
        The restaurant chain has expanded to multiple locations offering
        food service to customers throughout the metropolitan area.
      `;

      const result = validator.validateNarrative(invalidNarrative);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should fail narrative with dental practice references', () => {
      const validator = createIndustryValidator(engineeringLock);

      const invalidNarrative = `
        The dental practice serves patients with comprehensive oral care
        including cleanings, fillings, and cosmetic dentistry.
      `;

      const result = validator.validateNarrative(invalidNarrative);
      expect(result.valid).toBe(false);
    });

    it('should flag multiple wrong industry references', () => {
      const validator = createIndustryValidator(engineeringLock);

      const invalidNarrative = `
        The company operates a restaurant and also provides plumbing services.
        They recently expanded into hair salon operations.
      `;

      const result = validator.validateNarrative(invalidNarrative);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('validateSection', () => {
    it('should validate executive summary section', () => {
      const validator = createIndustryValidator(engineeringLock);

      const section = {
        name: 'Executive Summary',
        content: `
          K-Factor Engineering is a professional engineering firm providing
          civil engineering, surveying, and consulting services to government
          and private sector clients.
        `,
      };

      const result = validator.validateSection(section.name, section.content);
      expect(result.valid).toBe(true);
    });

    it('should include section name in error messages', () => {
      const validator = createIndustryValidator(engineeringLock);

      const section = {
        name: 'Market Analysis',
        content: 'The restaurant industry has experienced significant growth.',
      };

      const result = validator.validateSection(section.name, section.content);
      expect(result.valid).toBe(false);
      expect(result.section).toBe('Market Analysis');
    });
  });

  describe('validateFullReport', () => {
    it('should validate entire report with multiple sections', () => {
      const validator = createIndustryValidator(engineeringLock);

      const sections = [
        {
          name: 'Executive Summary',
          content: 'K-Factor Engineering provides professional engineering services.',
        },
        {
          name: 'Company Overview',
          content: 'The firm specializes in civil engineering and surveying.',
        },
        {
          name: 'Financial Analysis',
          content: 'Revenue has grown consistently over the past three years.',
        },
      ];

      const result = validator.validateFullReport(sections);
      expect(result.overall_valid).toBe(true);
      expect(result.sections_passed).toBe(3);
      expect(result.sections_failed).toBe(0);
    });

    it('should report failed sections in full report validation', () => {
      const validator = createIndustryValidator(engineeringLock);

      const sections = [
        {
          name: 'Executive Summary',
          content: 'K-Factor Engineering provides professional engineering services.',
        },
        {
          name: 'Industry Analysis',
          content: 'The HVAC industry is experiencing strong demand.', // Wrong industry
        },
        {
          name: 'Financial Analysis',
          content: 'Revenue has grown consistently over the past three years.',
        },
      ];

      const result = validator.validateFullReport(sections);
      expect(result.overall_valid).toBe(false);
      expect(result.sections_passed).toBe(2);
      expect(result.sections_failed).toBe(1);
      expect(result.failed_sections).toContain('Industry Analysis');
    });
  });

  describe('keyword detection', () => {
    it('should detect partial keyword matches', () => {
      const validator = createIndustryValidator(engineeringLock);

      // "plumber" should be caught even without exact "plumbing" match
      const text = 'The plumber fixed the leak.';
      const result = validator.validateNarrative(text);
      expect(result.valid).toBe(false);
    });

    it('should be case insensitive', () => {
      const validator = createIndustryValidator(engineeringLock);

      const text = 'HVAC SYSTEMS are complex.';
      const result = validator.validateNarrative(text);
      expect(result.valid).toBe(false);
    });

    it('should handle text with no blocked keywords', () => {
      const validator = createIndustryValidator(engineeringLock);

      const text = 'The company provides professional services to clients.';
      const result = validator.validateNarrative(text);
      expect(result.valid).toBe(true);
    });
  });

  describe('suggestions', () => {
    it('should provide suggestions for fixing invalid text', () => {
      const validator = createIndustryValidator(engineeringLock);

      const text = 'The restaurant serves great food.';
      const result = validator.validateNarrative(text);

      expect(result.suggestions).toBeDefined();
      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });
});
