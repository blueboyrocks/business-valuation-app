/**
 * Document Classifier Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { classifyDocument, classifyByKeywords, extractTaxYear, extractEntityName } from '../classifier';
import {
  mockForm1120SStage1Output,
  mockForm1065Stage1Output,
  mockScheduleCStage1Output,
  mockIncomeStatementStage1Output,
} from './fixtures/mock-stage1-output';

describe('Document Classifier', () => {
  describe('classifyByKeywords', () => {
    it('should classify Form 1120-S with high confidence', () => {
      const result = classifyByKeywords(mockForm1120SStage1Output);

      expect(result).not.toBeNull();
      expect(result?.document_type).toBe('FORM_1120S');
      expect(result?.confidence).toBe('high');
      expect(result?.indicators).toContain('Form 1120-S');
    });

    it('should classify Form 1065 with high confidence', () => {
      const result = classifyByKeywords(mockForm1065Stage1Output);

      expect(result).not.toBeNull();
      expect(result?.document_type).toBe('FORM_1065');
      expect(result?.confidence).toBe('high');
    });

    it('should classify Schedule C with high confidence', () => {
      const result = classifyByKeywords(mockScheduleCStage1Output);

      expect(result).not.toBeNull();
      expect(result?.document_type).toBe('SCHEDULE_C');
      expect(result?.confidence).toBe('high');
    });

    it('should classify Income Statement', () => {
      const result = classifyByKeywords(mockIncomeStatementStage1Output);

      expect(result).not.toBeNull();
      expect(result?.document_type).toBe('INCOME_STATEMENT');
    });
  });

  describe('extractTaxYear', () => {
    it('should extract tax year from "Tax Year 2023"', () => {
      const result = extractTaxYear('Tax Year 2023');
      expect(result).toBe('2023');
    });

    it('should extract tax year from "For the year ended December 31, 2023"', () => {
      const result = extractTaxYear('For the year ended December 31, 2023');
      expect(result).toBe('2023');
    });

    it('should extract tax year from "FY 2022"', () => {
      const result = extractTaxYear('FY 2022');
      expect(result).toBe('2022');
    });

    it('should return null for text without year', () => {
      const result = extractTaxYear('Some text without a year');
      expect(result).toBeNull();
    });
  });

  describe('extractEntityName', () => {
    it('should extract corporation name', () => {
      const result = extractEntityName('Name of corporation: ABC Company LLC\nMore text');
      expect(result).toBe('ABC Company LLC');
    });

    it('should extract partnership name', () => {
      const result = extractEntityName('Name of partnership: XYZ Partners LP\nMore text');
      expect(result).toBe('XYZ Partners LP');
    });

    it('should extract business name', () => {
      const result = extractEntityName('Business name: Smith Consulting\nMore text');
      expect(result).toBe('Smith Consulting');
    });

    it('should extract name with entity suffix', () => {
      // Pattern requires space or comma after entity suffix
      const result = extractEntityName('ABC Industries Inc, Address: 123 Main St');
      expect(result).toBe('ABC Industries Inc');
    });
  });

  describe('classifyDocument (integration)', () => {
    it('should classify Form 1120-S via fast path', async () => {
      const result = await classifyDocument(mockForm1120SStage1Output);

      expect(result.document_type).toBe('FORM_1120S');
      expect(result.confidence).toBe('high');
      expect(result.tax_year).toBe('2023');
      expect(result.entity_name).toContain('ABC Company');
    });

    it('should classify Form 1065 via fast path', async () => {
      const result = await classifyDocument(mockForm1065Stage1Output);

      expect(result.document_type).toBe('FORM_1065');
      expect(result.confidence).toBe('high');
      expect(result.tax_year).toBe('2023');
    });
  });
});
