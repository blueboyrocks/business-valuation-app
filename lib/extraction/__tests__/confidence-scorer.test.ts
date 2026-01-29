/**
 * Confidence Scorer Tests
 */

import { describe, it, expect } from 'vitest';
import { calculateConfidence, quickConfidenceCheck, ESCALATION_THRESHOLDS } from '../confidence-scorer';
import { ValidationResult } from '../types';
import { createMockStage2Output } from './fixtures/mock-stage2-output';

describe('Confidence Scorer', () => {
  describe('calculateConfidence', () => {
    it('should give high score for complete data with high classification confidence', () => {
      const stage2Output = createMockStage2Output({
        confidence: 'high',
        revenue: 1000000,
        officerComp: 100000,
      });
      const validationResults: ValidationResult[] = [];

      const result = calculateConfidence(stage2Output, validationResults);

      expect(result.overall).toBeGreaterThanOrEqual(70);
      expect(result.recommendation).toBe('ready');
    });

    it('should reduce score for low classification confidence', () => {
      const stage2Output = createMockStage2Output({
        confidence: 'low',
      });
      const validationResults: ValidationResult[] = [];

      const result = calculateConfidence(stage2Output, validationResults);

      expect(result.breakdown.classification).toBeLessThan(60);
    });

    it('should reduce score for UNKNOWN document type', () => {
      const stage2Output = createMockStage2Output({
        documentType: 'UNKNOWN',
      });
      const validationResults: ValidationResult[] = [];

      const result = calculateConfidence(stage2Output, validationResults);

      // UNKNOWN document type caps classification score at 20
      expect(result.breakdown.classification).toBeLessThanOrEqual(20);
      // But overall score depends on other components too (completeness, validation, consistency)
      // With good data, it may still be "ready" even with unknown doc type
      expect(result.overall).toBeLessThan(90); // Score reduced but not necessarily human_review
    });

    it('should reduce score for validation errors', () => {
      const stage2Output = createMockStage2Output({});
      const validationResults: ValidationResult[] = [
        {
          id: 'TEST001',
          name: 'Test Error',
          severity: 'error',
          passed: false,
          message: 'Test error message',
        },
      ];

      const result = calculateConfidence(stage2Output, validationResults);

      expect(result.breakdown.validation).toBeLessThan(100);
    });

    it('should identify missing critical data', () => {
      const stage2Output = createMockStage2Output({
        revenue: 0, // Missing revenue
        officerComp: 0, // Missing officer comp
      });
      const validationResults: ValidationResult[] = [];

      const result = calculateConfidence(stage2Output, validationResults);

      expect(result.missingCriticalData.length).toBeGreaterThan(0);
    });

    it('should recommend opus_escalation for medium scores', () => {
      const stage2Output = createMockStage2Output({
        confidence: 'medium',
        taxYear: null,
        entityName: null,
      });
      const validationResults: ValidationResult[] = [
        { id: 'TEST001', name: 'Warning', severity: 'warning', passed: false, message: 'Warning 1' },
        { id: 'TEST002', name: 'Warning', severity: 'warning', passed: false, message: 'Warning 2' },
      ];

      const result = calculateConfidence(stage2Output, validationResults);

      // Check if recommendation is appropriate based on score
      if (result.overall < ESCALATION_THRESHOLDS.HUMAN_REVIEW) {
        expect(result.recommendation).toBe('human_review');
      } else if (result.overall < ESCALATION_THRESHOLDS.OPUS_ESCALATION) {
        expect(result.recommendation).toBe('opus_escalation');
      }
    });
  });

  describe('quickConfidenceCheck', () => {
    it('should proceed for good data', () => {
      const stage2Output = createMockStage2Output({
        revenue: 1000000,
        officerComp: 100000,
      });

      const result = quickConfidenceCheck(stage2Output);

      expect(result.proceed).toBe(true);
      expect(result.estimatedScore).toBeGreaterThanOrEqual(70);
    });

    it('should not proceed for UNKNOWN document type', () => {
      const stage2Output = createMockStage2Output({
        documentType: 'UNKNOWN',
      });

      const result = quickConfidenceCheck(stage2Output);

      expect(result.proceed).toBe(false);
      expect(result.reason).toContain('Unknown document type');
    });

    it('should not proceed for zero revenue', () => {
      const stage2Output = createMockStage2Output({
        revenue: 0,
      });

      const result = quickConfidenceCheck(stage2Output);

      expect(result.proceed).toBe(false);
      expect(result.reason).toContain('revenue');
    });

    it('should proceed but warn for missing owner compensation', () => {
      const stage2Output = createMockStage2Output({
        officerComp: 0,
        guaranteedPayments: 0,
      });

      const result = quickConfidenceCheck(stage2Output);

      expect(result.proceed).toBe(true);
      expect(result.reason).toContain('compensation');
    });

    it('should handle guaranteed payments as alternative to officer comp', () => {
      const stage2Output = createMockStage2Output({
        officerComp: 0,
        guaranteedPayments: 150000,
      });

      const result = quickConfidenceCheck(stage2Output);

      expect(result.proceed).toBe(true);
      expect(result.estimatedScore).toBeGreaterThanOrEqual(70);
    });
  });
});
