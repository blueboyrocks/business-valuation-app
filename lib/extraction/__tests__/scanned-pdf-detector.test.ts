import { describe, it, expect } from 'vitest';
import {
  analyzeTextDensity,
  detectFromModalResponse,
  detectScannedPdf,
  requiresPremiumExtraction,
  shouldWarnUser,
} from '../scanned-pdf-detector';

describe('scanned-pdf-detector', () => {
  describe('analyzeTextDensity', () => {
    it('should detect scanned PDF with very low text density (<50 chars/page)', () => {
      const pageTexts = ['Hello', 'World', ''];
      const result = analyzeTextDensity(pageTexts);

      expect(result.isScanned).toBe(true);
      expect(result.avgCharsPerPage).toBeLessThan(50);
      expect(result.recommendation).toBe('require_premium');
    });

    it('should warn user with medium text density (50-500 chars/page)', () => {
      // Create pages with ~200 chars each
      const pageTexts = [
        'A'.repeat(200),
        'B'.repeat(250),
        'C'.repeat(150),
      ];
      const result = analyzeTextDensity(pageTexts);

      expect(result.isScanned).toBe(false);
      expect(result.avgCharsPerPage).toBeGreaterThanOrEqual(50);
      expect(result.avgCharsPerPage).toBeLessThan(500);
      expect(result.recommendation).toBe('warn_user');
    });

    it('should proceed with high text density (>=500 chars/page)', () => {
      const pageTexts = [
        'A'.repeat(1000),
        'B'.repeat(800),
        'C'.repeat(1200),
      ];
      const result = analyzeTextDensity(pageTexts);

      expect(result.isScanned).toBe(false);
      expect(result.avgCharsPerPage).toBeGreaterThanOrEqual(500);
      expect(result.recommendation).toBe('proceed');
    });

    it('should handle empty pages array', () => {
      const result = analyzeTextDensity([]);

      expect(result.isScanned).toBe(true);
      expect(result.pagesAnalyzed).toBe(0);
      expect(result.recommendation).toBe('require_premium');
    });

    it('should handle null/undefined text in pages', () => {
      const pageTexts = [null as unknown as string, undefined as unknown as string, 'Hello'];
      const result = analyzeTextDensity(pageTexts);

      expect(result.pagesAnalyzed).toBe(3);
      expect(result.avgCharsPerPage).toBeLessThan(50);
    });
  });

  describe('detectFromModalResponse', () => {
    it('should detect scanned from Modal is_scanned flag', () => {
      const result = detectFromModalResponse({
        is_scanned: true,
        ocr_confidence: 0.2,
        page_count: 10,
      });

      expect(result.isScanned).toBe(true);
      expect(result.recommendation).toBe('require_premium');
    });

    it('should detect OCR extraction method', () => {
      const result = detectFromModalResponse({
        is_scanned: false,
        extraction_method: 'ocr',
        ocr_confidence: 0.8,
        page_count: 5,
      });

      expect(result.recommendation).toBe('proceed');
      expect(result.explanation).toContain('OCR extraction succeeded');
    });

    it('should proceed with text-based document', () => {
      const result = detectFromModalResponse({
        is_scanned: false,
        extraction_method: 'pdfplumber',
        page_count: 20,
      });

      expect(result.isScanned).toBe(false);
      expect(result.recommendation).toBe('proceed');
    });

    it('should handle missing metadata gracefully', () => {
      const result = detectFromModalResponse({});

      expect(result.isScanned).toBe(false);
      expect(result.recommendation).toBe('proceed');
    });
  });

  describe('detectScannedPdf', () => {
    it('should prioritize Modal is_scanned flag', () => {
      const pageTexts = ['A'.repeat(1000)]; // Would normally proceed
      const modalMetadata = { is_scanned: true, ocr_confidence: 0.1 };

      const result = detectScannedPdf(pageTexts, modalMetadata);

      expect(result.isScanned).toBe(true);
      expect(result.recommendation).toBe('require_premium');
    });

    it('should use text analysis when Modal says not scanned but text is sparse', () => {
      const pageTexts = ['Hi', 'There'];
      const modalMetadata = { is_scanned: false };

      const result = detectScannedPdf(pageTexts, modalMetadata);

      expect(result.recommendation).toBe('require_premium');
    });

    it('should fallback to Modal metadata when no page texts', () => {
      const modalMetadata = { is_scanned: false, page_count: 10 };

      const result = detectScannedPdf([], modalMetadata);

      expect(result.recommendation).toBe('proceed');
    });
  });

  describe('utility functions', () => {
    it('requiresPremiumExtraction should return true for require_premium', () => {
      const result = analyzeTextDensity(['']);
      expect(requiresPremiumExtraction(result)).toBe(true);
    });

    it('requiresPremiumExtraction should return false for proceed', () => {
      const result = analyzeTextDensity(['A'.repeat(1000)]);
      expect(requiresPremiumExtraction(result)).toBe(false);
    });

    it('shouldWarnUser should return true for warn_user', () => {
      const result = analyzeTextDensity(['A'.repeat(200)]);
      expect(shouldWarnUser(result)).toBe(true);
    });

    it('shouldWarnUser should return true for require_premium', () => {
      const result = analyzeTextDensity(['']);
      expect(shouldWarnUser(result)).toBe(true);
    });

    it('shouldWarnUser should return false for proceed', () => {
      const result = analyzeTextDensity(['A'.repeat(1000)]);
      expect(shouldWarnUser(result)).toBe(false);
    });
  });
});
