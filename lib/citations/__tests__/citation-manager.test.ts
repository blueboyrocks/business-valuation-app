/**
 * CitationManager Unit Tests
 * TDD: Tests written before implementation
 *
 * Critical for professional credibility - ensures all valuation
 * claims are backed by verifiable sources.
 */
import { describe, it, expect } from 'vitest';
import {
  CitationManager,
  createCitationManager,
  Citation,
  CitationSource,
  StandardSources,
} from '../citation-manager';

describe('CitationManager', () => {
  describe('Standard Sources', () => {
    it('should have BizBuySell as a standard source', () => {
      const manager = createCitationManager();
      const source = manager.getSource('BBS');

      expect(source).toBeDefined();
      expect(source!.name).toBe('BizBuySell');
      expect(source!.type).toBe('market_data');
    });

    it('should have RMA Annual Statement Studies as a standard source', () => {
      const manager = createCitationManager();
      const source = manager.getSource('RMA');

      expect(source).toBeDefined();
      expect(source!.name).toBe('RMA Annual Statement Studies');
      expect(source!.type).toBe('financial_benchmark');
    });

    it('should have Business Reference Guide as a standard source', () => {
      const manager = createCitationManager();
      const source = manager.getSource('BRG');

      expect(source).toBeDefined();
      expect(source!.name).toBe('Business Reference Guide');
      expect(source!.type).toBe('valuation_guide');
    });

    it('should have NYU Stern data as a standard source', () => {
      const manager = createCitationManager();
      const source = manager.getSource('NYU');

      expect(source).toBeDefined();
      expect(source!.name).toContain('NYU Stern');
      expect(source!.type).toBe('academic');
    });

    it('should have IRS/Tax data as a standard source', () => {
      const manager = createCitationManager();
      const source = manager.getSource('IRS');

      expect(source).toBeDefined();
      expect(source!.name).toContain('IRS');
      expect(source!.type).toBe('tax_data');
    });

    it('should have at least 8 standard sources', () => {
      const manager = createCitationManager();
      const sources = manager.getAllSources();

      expect(sources.length).toBeGreaterThanOrEqual(8);
    });
  });

  describe('Citation Creation', () => {
    it('should create inline citation with source code and year', () => {
      const manager = createCitationManager();

      const citation = manager.cite('BBS', 2025, 'Transaction data for SDE multiples');

      expect(citation.inline).toBe('[BBS-2025]');
      expect(citation.source_code).toBe('BBS');
      expect(citation.year).toBe(2025);
      expect(citation.context).toBe('Transaction data for SDE multiples');
    });

    it('should create citation with page reference', () => {
      const manager = createCitationManager();

      const citation = manager.cite('BRG', 2025, 'Engineering Services multiples', {
        page: '234-236',
      });

      expect(citation.inline).toBe('[BRG-2025, pp. 234-236]');
    });

    it('should create citation with section reference', () => {
      const manager = createCitationManager();

      const citation = manager.cite('RMA', 2025, 'Industry financial ratios', {
        section: 'Professional Services',
      });

      expect(citation.inline).toBe('[RMA-2025, Professional Services]');
    });

    it('should track all citations used', () => {
      const manager = createCitationManager();

      manager.cite('BBS', 2025, 'Context 1');
      manager.cite('RMA', 2025, 'Context 2');
      manager.cite('BRG', 2025, 'Context 3');

      const citations = manager.getAllCitations();

      expect(citations.length).toBe(3);
    });

    it('should not duplicate citations for same source/year', () => {
      const manager = createCitationManager();

      manager.cite('BBS', 2025, 'Context 1');
      manager.cite('BBS', 2025, 'Context 2'); // Same source, same year
      manager.cite('BBS', 2024, 'Context 3'); // Same source, different year

      const citations = manager.getAllCitations();

      // Should have 2 unique citations (BBS-2025 and BBS-2024)
      expect(citations.length).toBe(2);
    });
  });

  describe('Citation Insertion', () => {
    it('should insert citation into text', () => {
      const manager = createCitationManager();

      const text =
        'The median SDE multiple for Engineering Services is 2.65x according to industry data.';
      const citedText = manager.insertCitation(
        text,
        'BRG',
        2025,
        'Engineering Services multiples'
      );

      expect(citedText).toContain('[BRG-2025]');
      expect(citedText).toBe(
        'The median SDE multiple for Engineering Services is 2.65x according to industry data. [BRG-2025]'
      );
    });

    it('should insert citation at specific position', () => {
      const manager = createCitationManager();

      const text = 'Revenue of $6.2M represents strong performance in the industry.';
      const citedText = manager.insertCitation(
        text,
        'IRS',
        2024,
        'Tax return data',
        { position: 17 } // After "$6.2M"
      );

      expect(citedText).toContain('[IRS-2024]');
      expect(citedText.indexOf('[IRS-2024]')).toBeGreaterThan(10);
    });
  });

  describe('Bibliography Generation', () => {
    it('should generate bibliography from used citations', () => {
      const manager = createCitationManager();

      manager.cite('BBS', 2025, 'Transaction data');
      manager.cite('RMA', 2025, 'Financial ratios');
      manager.cite('BRG', 2025, 'Valuation multiples');

      const bibliography = manager.generateBibliography();

      expect(bibliography).toContain('BizBuySell');
      expect(bibliography).toContain('RMA Annual Statement Studies');
      expect(bibliography).toContain('Business Reference Guide');
      expect(bibliography).toContain('2025');
    });

    it('should format bibliography in standard format', () => {
      const manager = createCitationManager();

      manager.cite('BRG', 2025, 'Test');

      const bibliography = manager.generateBibliography();

      // Should have proper formatting
      expect(bibliography).toContain('## Sources and References');
      expect(bibliography).toMatch(/\[BRG-2025\]/);
    });

    it('should sort bibliography alphabetically by source code', () => {
      const manager = createCitationManager();

      manager.cite('RMA', 2025, 'Test 1');
      manager.cite('BBS', 2025, 'Test 2');
      manager.cite('NYU', 2025, 'Test 3');

      const bibliography = manager.generateBibliography();
      const lines = bibliography.split('\n').filter((l) => l.startsWith('['));

      // Should be in alphabetical order: BBS, NYU, RMA
      expect(lines[0]).toContain('BBS');
      expect(lines[1]).toContain('NYU');
      expect(lines[2]).toContain('RMA');
    });

    it('should include URLs where available', () => {
      const manager = createCitationManager();

      manager.cite('NYU', 2025, 'Cost of capital data');

      const bibliography = manager.generateBibliography();

      expect(bibliography).toContain('http');
    });
  });

  describe('Citation Validation', () => {
    it('should validate that text contains minimum citations', () => {
      const manager = createCitationManager();

      const textWithCitations = `
        The company reported revenue of $6.2M [IRS-2024].
        Industry multiples range from 2.0x to 3.5x [BRG-2025].
        Transaction data shows median multiple of 2.65x [BBS-2025].
      `;

      // Register the citations
      manager.cite('IRS', 2024, 'Revenue');
      manager.cite('BRG', 2025, 'Multiples');
      manager.cite('BBS', 2025, 'Transactions');

      const validation = manager.validateCitations(textWithCitations, {
        minimum_citations: 3,
      });

      expect(validation.valid).toBe(true);
      expect(validation.citation_count).toBe(3);
    });

    it('should fail validation when citations are missing', () => {
      const manager = createCitationManager();

      const textWithoutCitations = `
        The company reported revenue of $6.2M.
        Industry multiples range from 2.0x to 3.5x.
        Transaction data shows median multiple of 2.65x.
      `;

      const validation = manager.validateCitations(textWithoutCitations, {
        minimum_citations: 3,
      });

      expect(validation.valid).toBe(false);
      expect(validation.citation_count).toBe(0);
      expect(validation.error).toContain('minimum');
    });

    it('should detect unregistered citations in text', () => {
      const manager = createCitationManager();

      const textWithUnknownCitation = `
        Based on proprietary data [XYZ-2025], the value is $3M.
      `;

      const validation = manager.validateCitations(textWithUnknownCitation);

      expect(validation.warnings).toBeDefined();
      expect(validation.warnings!.some((w) => w.includes('XYZ-2025'))).toBe(true);
    });

    it('should validate required source types are cited', () => {
      const manager = createCitationManager();

      manager.cite('BBS', 2025, 'Market data');

      const validation = manager.validateCitations('Test [BBS-2025]', {
        required_source_types: ['market_data', 'financial_benchmark'],
      });

      expect(validation.valid).toBe(false);
      expect(validation.missing_source_types).toContain('financial_benchmark');
    });
  });

  describe('Custom Sources', () => {
    it('should allow adding custom citation sources', () => {
      const manager = createCitationManager();

      manager.addSource({
        code: 'CUST',
        name: 'Custom Industry Report',
        type: 'industry_report',
        publisher: 'Custom Publisher',
        url: 'https://example.com/report',
      });

      const source = manager.getSource('CUST');

      expect(source).toBeDefined();
      expect(source!.name).toBe('Custom Industry Report');
    });

    it('should use custom source in citations', () => {
      const manager = createCitationManager();

      manager.addSource({
        code: 'IBR',
        name: 'Industry Benchmark Report',
        type: 'industry_report',
        publisher: 'Industry Association',
      });

      const citation = manager.cite('IBR', 2025, 'Benchmark data');

      expect(citation.inline).toBe('[IBR-2025]');
    });
  });

  describe('Valuation Report Integration', () => {
    it('should generate citations for common valuation claims', () => {
      const manager = createCitationManager();

      // SDE multiple claim
      const sdeCitation = manager.citeSDEMultiple('Engineering Services', 2.65);
      expect(sdeCitation.inline).toContain('BRG');

      // Industry financial data
      const financialCitation = manager.citeIndustryFinancials('541330');
      expect(financialCitation.inline).toContain('RMA');

      // Cost of capital
      const cocCitation = manager.citeCostOfCapital();
      expect(cocCitation.inline).toContain('NYU');
    });

    it('should track citation coverage for report sections', () => {
      const manager = createCitationManager();

      manager.cite('BBS', 2025, 'Market approach data');
      manager.cite('RMA', 2025, 'Financial benchmarks');
      manager.cite('BRG', 2025, 'Valuation multiples');
      manager.cite('NYU', 2025, 'Cost of capital');
      manager.cite('IRS', 2024, 'Tax return data');

      const coverage = manager.getCitationCoverage();

      expect(coverage.market_data).toBe(true);
      expect(coverage.financial_benchmark).toBe(true);
      expect(coverage.valuation_guide).toBe(true);
      expect(coverage.academic).toBe(true);
      expect(coverage.tax_data).toBe(true);
    });

    it('should generate minimum 10 citations for premium report', () => {
      const manager = createCitationManager();

      // Simulate a premium report with various citations
      manager.cite('BBS', 2025, 'Transaction data 1');
      manager.cite('BBS', 2024, 'Transaction data 2');
      manager.cite('RMA', 2025, 'Financial ratios');
      manager.cite('RMA', 2024, 'Prior year ratios');
      manager.cite('BRG', 2025, 'SDE multiples');
      manager.cite('BRG', 2024, 'Prior year multiples');
      manager.cite('NYU', 2025, 'Cost of capital');
      manager.cite('IRS', 2024, 'Tax return data');
      manager.cite('IRS', 2023, 'Prior tax data');
      manager.citeSDEMultiple('Engineering', 2.65);

      const citations = manager.getAllCitations();

      expect(citations.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('HTML/Markdown Output', () => {
    it('should generate citation as HTML link', () => {
      const manager = createCitationManager();

      const citation = manager.cite('NYU', 2025, 'Cost of capital');
      const html = manager.citationToHTML(citation);

      expect(html).toContain('<a');
      expect(html).toContain('href=');
      expect(html).toContain('NYU');
    });

    it('should generate bibliography as HTML', () => {
      const manager = createCitationManager();

      manager.cite('BBS', 2025, 'Test');
      manager.cite('RMA', 2025, 'Test');

      const html = manager.generateBibliographyHTML();

      expect(html).toContain('<ul');
      expect(html).toContain('<li');
      expect(html).toContain('</ul>');
    });
  });
});
