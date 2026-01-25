/**
 * IndustryLock Unit Tests
 * TDD: Tests written before implementation
 */
import { describe, it, expect } from 'vitest';
import {
  IndustryLock,
  createIndustryLock,
  IndustryLockError,
} from '../industry-lock';
import { ENGINEERING_SERVICES_INDUSTRY } from '../../test-utils/fixtures';

describe('IndustryLock', () => {
  describe('initialization', () => {
    it('should create a lock with NAICS code', () => {
      const lock = createIndustryLock({
        naics_code: '541330',
        naics_description: 'Engineering Services',
        locked_by_pass: 2,
      });

      expect(lock.naics_code).toBe('541330');
      expect(lock.naics_description).toBe('Engineering Services');
    });

    it('should include optional SIC code', () => {
      const lock = createIndustryLock({
        naics_code: '541330',
        naics_description: 'Engineering Services',
        sic_code: '8711',
        locked_by_pass: 2,
      });

      expect(lock.sic_code).toBe('8711');
    });

    it('should record when and by which pass the lock was created', () => {
      const lock = createIndustryLock({
        naics_code: '541330',
        naics_description: 'Engineering Services',
        locked_by_pass: 2,
      });

      expect(lock.locked_at).toBeTruthy();
      expect(lock.locked_by_pass).toBe(2);
    });
  });

  describe('immutability', () => {
    it('should be frozen after creation', () => {
      const lock = createIndustryLock({
        naics_code: '541330',
        naics_description: 'Engineering Services',
        locked_by_pass: 2,
      });

      expect(Object.isFrozen(lock)).toBe(true);
    });

    it('should not allow modification of NAICS code', () => {
      const lock = createIndustryLock({
        naics_code: '541330',
        naics_description: 'Engineering Services',
        locked_by_pass: 2,
      });

      expect(() => {
        (lock as { naics_code: string }).naics_code = '999999';
      }).toThrow();
    });
  });

  describe('validation', () => {
    it('should validate NAICS code format', () => {
      // Valid 6-digit NAICS code
      expect(() =>
        createIndustryLock({
          naics_code: '541330',
          naics_description: 'Engineering Services',
          locked_by_pass: 2,
        })
      ).not.toThrow();
    });

    it('should reject invalid NAICS code format', () => {
      expect(() =>
        createIndustryLock({
          naics_code: 'ABC123',
          naics_description: 'Invalid',
          locked_by_pass: 2,
        })
      ).toThrow(/NAICS/i);
    });

    it('should reject empty NAICS code', () => {
      expect(() =>
        createIndustryLock({
          naics_code: '',
          naics_description: 'Engineering Services',
          locked_by_pass: 2,
        })
      ).toThrow(/NAICS/i);
    });

    it('should require description', () => {
      expect(() =>
        createIndustryLock({
          naics_code: '541330',
          naics_description: '',
          locked_by_pass: 2,
        })
      ).toThrow(/description/i);
    });
  });

  describe('reference validation', () => {
    it('should validate text containing correct industry references', () => {
      const lock = createIndustryLock({
        naics_code: '541330',
        naics_description: 'Engineering Services',
        locked_by_pass: 2,
      });

      const validText =
        'The company provides engineering services including civil engineering design.';
      const result = lock.validateReference(validText);

      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect wrong industry references', () => {
      const lock = createIndustryLock({
        naics_code: '541330',
        naics_description: 'Engineering Services',
        locked_by_pass: 2,
      });

      const invalidText = 'The company specializes in HVAC installation and plumbing repairs.';
      const result = lock.validateReference(invalidText);

      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues.some((i) => i.includes('HVAC') || i.includes('plumbing'))).toBe(true);
    });

    it('should return all invalid references found', () => {
      const lock = createIndustryLock({
        naics_code: '541330',
        naics_description: 'Engineering Services',
        locked_by_pass: 2,
      });

      const invalidText =
        'The restaurant chain also operates dental practices and hair salons.';
      const result = lock.validateReference(invalidText);

      expect(result.issues.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('industry matching', () => {
    it('should match by NAICS code', () => {
      const lock = createIndustryLock({
        naics_code: '541330',
        naics_description: 'Engineering Services',
        locked_by_pass: 2,
      });

      expect(lock.matchesNAICS('541330')).toBe(true);
      expect(lock.matchesNAICS('722511')).toBe(false);
    });

    it('should match by industry name (case insensitive)', () => {
      const lock = createIndustryLock({
        naics_code: '541330',
        naics_description: 'Engineering Services',
        locked_by_pass: 2,
      });

      expect(lock.matchesIndustry('engineering')).toBe(true);
      expect(lock.matchesIndustry('ENGINEERING')).toBe(true);
      expect(lock.matchesIndustry('restaurant')).toBe(false);
    });
  });

  describe('serialization', () => {
    it('should convert to JSON', () => {
      const lock = createIndustryLock({
        naics_code: '541330',
        naics_description: 'Engineering Services',
        sic_code: '8711',
        locked_by_pass: 2,
      });

      const json = lock.toJSON();

      expect(json.naics_code).toBe('541330');
      expect(json.naics_description).toBe('Engineering Services');
      expect(json.sic_code).toBe('8711');
      expect(json.locked_by_pass).toBe(2);
      expect(json.locked_at).toBeTruthy();
    });
  });
});
