/**
 * Disclaimers Unit Tests
 * TDD: Tests written before implementation
 *
 * Professional disclaimers ensure legal compliance and set appropriate
 * expectations for valuation report usage.
 */
import { describe, it, expect } from 'vitest';
import {
  DisclaimerManager,
  createDisclaimerManager,
  DisclaimerType,
  DisclaimerContext,
} from '../disclaimers';

describe('DisclaimerManager', () => {
  describe('Standard Disclaimers', () => {
    it('should have purpose and use disclaimer', () => {
      const manager = createDisclaimerManager();

      const disclaimer = manager.getDisclaimer(DisclaimerType.PURPOSE_AND_USE);

      expect(disclaimer).toBeDefined();
      expect(disclaimer.title).toContain('Purpose');
      expect(disclaimer.content.length).toBeGreaterThan(100);
    });

    it('should have assumptions disclaimer', () => {
      const manager = createDisclaimerManager();

      const disclaimer = manager.getDisclaimer(DisclaimerType.ASSUMPTIONS);

      expect(disclaimer).toBeDefined();
      expect(disclaimer.title).toContain('Assumptions');
      expect(disclaimer.content.length).toBeGreaterThan(100);
    });

    it('should have limiting conditions disclaimer', () => {
      const manager = createDisclaimerManager();

      const disclaimer = manager.getDisclaimer(DisclaimerType.LIMITING_CONDITIONS);

      expect(disclaimer).toBeDefined();
      expect(disclaimer.title).toContain('Limiting');
      expect(disclaimer.content.length).toBeGreaterThan(100);
    });

    it('should have data reliance disclaimer', () => {
      const manager = createDisclaimerManager();

      const disclaimer = manager.getDisclaimer(DisclaimerType.DATA_RELIANCE);

      expect(disclaimer).toBeDefined();
      expect(disclaimer.content).toContain('relied upon');
    });

    it('should have market conditions disclaimer', () => {
      const manager = createDisclaimerManager();

      const disclaimer = manager.getDisclaimer(DisclaimerType.MARKET_CONDITIONS);

      expect(disclaimer).toBeDefined();
      expect(disclaimer.content).toContain('market');
    });

    it('should have confidentiality disclaimer', () => {
      const manager = createDisclaimerManager();

      const disclaimer = manager.getDisclaimer(DisclaimerType.CONFIDENTIALITY);

      expect(disclaimer).toBeDefined();
      expect(disclaimer.content).toContain('confidential');
    });

    it('should have at least 6 standard disclaimers', () => {
      const manager = createDisclaimerManager();

      const all = manager.getAllDisclaimers();

      expect(all.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('Contextual Disclaimers', () => {
    it('should customize disclaimer with company name', () => {
      const manager = createDisclaimerManager();

      const context: DisclaimerContext = {
        company_name: 'K-Factor Engineering, Inc.',
        valuation_date: '2024-12-31',
        report_date: '2025-01-15',
      };

      const disclaimer = manager.getDisclaimer(
        DisclaimerType.PURPOSE_AND_USE,
        context
      );

      expect(disclaimer.content).toContain('K-Factor Engineering');
    });

    it('should customize disclaimer with valuation date', () => {
      const manager = createDisclaimerManager();

      const context: DisclaimerContext = {
        company_name: 'Test Company',
        valuation_date: '2024-12-31',
        report_date: '2025-01-15',
      };

      const disclaimer = manager.getDisclaimer(
        DisclaimerType.MARKET_CONDITIONS,
        context
      );

      expect(disclaimer.content).toContain('2024');
    });

    it('should include industry-specific disclaimers when applicable', () => {
      const manager = createDisclaimerManager();

      const context: DisclaimerContext = {
        company_name: 'Test Company',
        valuation_date: '2024-12-31',
        report_date: '2025-01-15',
        industry: 'Engineering Services',
        naics_code: '541330',
      };

      const disclaimers = manager.getDisclaimersForContext(context);

      // Should have industry-specific content
      expect(disclaimers.length).toBeGreaterThan(0);
    });
  });

  describe('Assumptions Section', () => {
    it('should generate standard assumptions list', () => {
      const manager = createDisclaimerManager();

      const assumptions = manager.getStandardAssumptions();

      expect(assumptions.length).toBeGreaterThanOrEqual(5);
      expect(assumptions.some((a) => a.toLowerCase().includes('going concern'))).toBe(true);
      expect(assumptions.some((a) => a.toLowerCase().includes('information'))).toBe(true);
    });

    it('should allow custom assumptions', () => {
      const manager = createDisclaimerManager();

      manager.addCustomAssumption(
        'The business will maintain its current customer base'
      );

      const assumptions = manager.getStandardAssumptions();

      expect(assumptions.some((a) => a.includes('customer base'))).toBe(true);
    });
  });

  describe('Limiting Conditions Section', () => {
    it('should generate standard limiting conditions', () => {
      const manager = createDisclaimerManager();

      const conditions = manager.getLimitingConditions();

      expect(conditions.length).toBeGreaterThanOrEqual(5);
      expect(conditions.some((c) => c.includes('liable'))).toBe(true);
    });

    it('should include standard of value disclaimer', () => {
      const manager = createDisclaimerManager();

      const conditions = manager.getLimitingConditions();

      expect(conditions.some((c) => c.toLowerCase().includes('fair market value'))).toBe(
        true
      );
    });
  });

  describe('Output Generation', () => {
    it('should generate complete disclaimers section as markdown', () => {
      const manager = createDisclaimerManager();

      const context: DisclaimerContext = {
        company_name: 'K-Factor Engineering, Inc.',
        valuation_date: '2024-12-31',
        report_date: '2025-01-15',
      };

      const markdown = manager.generateDisclaimersMarkdown(context);

      expect(markdown).toContain('Assumptions');
      expect(markdown).toContain('Limiting Conditions');
      expect(markdown).toContain('K-Factor Engineering');
    });

    it('should generate disclaimers section as HTML', () => {
      const manager = createDisclaimerManager();

      const context: DisclaimerContext = {
        company_name: 'Test Company',
        valuation_date: '2024-12-31',
        report_date: '2025-01-15',
      };

      const html = manager.generateDisclaimersHTML(context);

      expect(html).toContain('<div');
      expect(html).toContain('</div>');
      expect(html).toContain('Assumptions');
    });

    it('should include all required sections for professional report', () => {
      const manager = createDisclaimerManager();

      const context: DisclaimerContext = {
        company_name: 'Professional Corp',
        valuation_date: '2024-12-31',
        report_date: '2025-01-15',
      };

      const markdown = manager.generateDisclaimersMarkdown(context);

      // Must include these sections for professional compliance
      expect(markdown).toContain('Purpose');
      expect(markdown).toContain('Assumptions');
      expect(markdown).toContain('Limiting Conditions');
      expect(markdown).toContain('Confidentiality');
    });
  });

  describe('Legal Compliance', () => {
    it('should include no liability disclaimer', () => {
      const manager = createDisclaimerManager();

      const conditions = manager.getLimitingConditions();

      expect(conditions.some((c) => c.toLowerCase().includes('liab'))).toBe(true);
    });

    it('should include professional standards reference', () => {
      const manager = createDisclaimerManager();

      const context: DisclaimerContext = {
        company_name: 'Test Company',
        valuation_date: '2024-12-31',
        report_date: '2025-01-15',
      };

      const markdown = manager.generateDisclaimersMarkdown(context);

      // Should reference professional standards
      expect(markdown.toLowerCase()).toMatch(/standard|professional|accepted/);
    });

    it('should not provide legal or tax advice', () => {
      const manager = createDisclaimerManager();

      const disclaimer = manager.getDisclaimer(DisclaimerType.LIMITING_CONDITIONS);

      expect(disclaimer.content.toLowerCase()).toMatch(/legal|tax|advice/);
    });
  });

  describe('Validation', () => {
    it('should validate that all required disclaimers are present', () => {
      const manager = createDisclaimerManager();

      const context: DisclaimerContext = {
        company_name: 'Test Company',
        valuation_date: '2024-12-31',
        report_date: '2025-01-15',
      };

      const validation = manager.validateCompleteness(context);

      expect(validation.is_complete).toBe(true);
      expect(validation.missing_disclaimers).toBeUndefined();
    });
  });
});
