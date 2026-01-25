/**
 * AddBackSchedule Unit Tests
 * TDD: Tests written before implementation
 *
 * Generates detailed add-back schedules showing each normalization
 * adjustment with rationales and source references.
 */
import { describe, it, expect } from 'vitest';
import {
  AddBackSchedule,
  createAddBackSchedule,
  AddBackItem,
  AddBackCategory,
  AddBackScheduleInput,
} from '../add-back-schedule';
import { KFACTOR_EXPECTED_SDE } from '../../test-utils/fixtures';

describe('AddBackSchedule', () => {
  describe('Add-Back Categories', () => {
    it('should support standard add-back categories', () => {
      const schedule = createAddBackSchedule();

      expect(AddBackCategory.OFFICER_COMPENSATION).toBeDefined();
      expect(AddBackCategory.DEPRECIATION_AMORTIZATION).toBeDefined();
      expect(AddBackCategory.INTEREST_EXPENSE).toBeDefined();
      expect(AddBackCategory.DISCRETIONARY).toBeDefined();
      expect(AddBackCategory.NON_RECURRING).toBeDefined();
      expect(AddBackCategory.PERSONAL_EXPENSES).toBeDefined();
      expect(AddBackCategory.RENT_ADJUSTMENT).toBeDefined();
    });

    it('should provide rationale templates for each category', () => {
      const schedule = createAddBackSchedule();

      const officerRationale = schedule.getCategoryRationale(
        AddBackCategory.OFFICER_COMPENSATION
      );

      expect(officerRationale.toLowerCase()).toContain('officer');
      expect(officerRationale.length).toBeGreaterThan(20);
    });
  });

  describe('Add-Back Item Creation', () => {
    it('should create add-back item with full details', () => {
      const schedule = createAddBackSchedule();

      const item = schedule.createItem({
        description: 'Owner Compensation Adjustment',
        category: AddBackCategory.OFFICER_COMPENSATION,
        amount: 250000,
        source: 'Form 1120-S Line 7',
        rationale:
          'Owner salary exceeds market rate for comparable position. ' +
          'Adjusted to market rate of $150,000.',
        year: 2024,
      });

      expect(item.description).toBe('Owner Compensation Adjustment');
      expect(item.category).toBe(AddBackCategory.OFFICER_COMPENSATION);
      expect(item.amount).toBe(250000);
      expect(item.source).toBe('Form 1120-S Line 7');
      expect(item.rationale).toContain('market rate');
    });

    it('should auto-generate rationale if not provided', () => {
      const schedule = createAddBackSchedule();

      const item = schedule.createItem({
        description: 'Depreciation',
        category: AddBackCategory.DEPRECIATION_AMORTIZATION,
        amount: 45000,
        source: 'Form 4562',
        year: 2024,
      });

      expect(item.rationale).toBeDefined();
      expect(item.rationale!.length).toBeGreaterThan(0);
    });

    it('should validate positive amounts', () => {
      const schedule = createAddBackSchedule();

      expect(() => {
        schedule.createItem({
          description: 'Invalid',
          category: AddBackCategory.DISCRETIONARY,
          amount: -1000,
          source: 'Test',
          year: 2024,
        });
      }).toThrow();
    });
  });

  describe('Schedule Generation', () => {
    it('should generate complete add-back schedule', () => {
      const schedule = createAddBackSchedule();

      const input: AddBackScheduleInput = {
        company_name: 'K-Factor Engineering',
        fiscal_year: 2024,
        starting_net_income: KFACTOR_EXPECTED_SDE.fy2024.net_income,
        items: [
          {
            description: 'Officer Compensation',
            category: AddBackCategory.OFFICER_COMPENSATION,
            amount: KFACTOR_EXPECTED_SDE.fy2024.add_officer_compensation,
            source: 'Form 1120-S Line 7',
            year: 2024,
          },
          {
            description: 'Depreciation',
            category: AddBackCategory.DEPRECIATION_AMORTIZATION,
            amount: KFACTOR_EXPECTED_SDE.fy2024.add_depreciation,
            source: 'Form 4562',
            year: 2024,
          },
          {
            description: 'Amortization',
            category: AddBackCategory.DEPRECIATION_AMORTIZATION,
            amount: KFACTOR_EXPECTED_SDE.fy2024.add_amortization,
            source: 'Form 4562 Part VI',
            year: 2024,
          },
          {
            description: 'Interest Expense',
            category: AddBackCategory.INTEREST_EXPENSE,
            amount: KFACTOR_EXPECTED_SDE.fy2024.add_interest,
            source: 'Schedule K',
            year: 2024,
          },
          {
            description: 'Discretionary Expenses',
            category: AddBackCategory.DISCRETIONARY,
            amount: KFACTOR_EXPECTED_SDE.fy2024.add_discretionary,
            source: 'Various',
            year: 2024,
          },
        ],
      };

      const result = schedule.generate(input);

      expect(result.company_name).toBe('K-Factor Engineering');
      expect(result.fiscal_year).toBe(2024);
      expect(result.starting_net_income).toBe(KFACTOR_EXPECTED_SDE.fy2024.net_income);
      expect(result.items.length).toBe(5);
      expect(result.total_add_backs).toBeGreaterThan(0);
      expect(result.adjusted_sde).toBe(
        result.starting_net_income + result.total_add_backs
      );
    });

    it('should calculate K-Factor SDE correctly', () => {
      const schedule = createAddBackSchedule();

      const input: AddBackScheduleInput = {
        company_name: 'K-Factor Engineering',
        fiscal_year: 2024,
        starting_net_income: KFACTOR_EXPECTED_SDE.fy2024.net_income,
        items: [
          {
            description: 'Officer Compensation',
            category: AddBackCategory.OFFICER_COMPENSATION,
            amount: KFACTOR_EXPECTED_SDE.fy2024.add_officer_compensation,
            source: 'Form 1120-S Line 7',
            year: 2024,
          },
          {
            description: 'Depreciation',
            category: AddBackCategory.DEPRECIATION_AMORTIZATION,
            amount: KFACTOR_EXPECTED_SDE.fy2024.add_depreciation,
            source: 'Form 4562',
            year: 2024,
          },
          {
            description: 'Amortization',
            category: AddBackCategory.DEPRECIATION_AMORTIZATION,
            amount: KFACTOR_EXPECTED_SDE.fy2024.add_amortization,
            source: 'Form 4562 Part VI',
            year: 2024,
          },
          {
            description: 'Interest Expense',
            category: AddBackCategory.INTEREST_EXPENSE,
            amount: KFACTOR_EXPECTED_SDE.fy2024.add_interest,
            source: 'Schedule K',
            year: 2024,
          },
          {
            description: 'Discretionary',
            category: AddBackCategory.DISCRETIONARY,
            amount: KFACTOR_EXPECTED_SDE.fy2024.add_discretionary,
            source: 'Various',
            year: 2024,
          },
        ],
      };

      const result = schedule.generate(input);

      // Should match expected K-Factor SDE for FY2024
      expect(result.adjusted_sde).toBeCloseTo(
        KFACTOR_EXPECTED_SDE.fy2024.total_sde,
        -2
      );
    });

    it('should group items by category', () => {
      const schedule = createAddBackSchedule();

      const input: AddBackScheduleInput = {
        company_name: 'Test Company',
        fiscal_year: 2024,
        starting_net_income: 500000,
        items: [
          {
            description: 'Item 1',
            category: AddBackCategory.DEPRECIATION_AMORTIZATION,
            amount: 30000,
            source: 'Source',
            year: 2024,
          },
          {
            description: 'Item 2',
            category: AddBackCategory.DEPRECIATION_AMORTIZATION,
            amount: 20000,
            source: 'Source',
            year: 2024,
          },
          {
            description: 'Item 3',
            category: AddBackCategory.OFFICER_COMPENSATION,
            amount: 100000,
            source: 'Source',
            year: 2024,
          },
        ],
      };

      const result = schedule.generate(input);
      const grouped = schedule.groupByCategory(result.items);

      expect(grouped[AddBackCategory.DEPRECIATION_AMORTIZATION]).toBeDefined();
      expect(grouped[AddBackCategory.DEPRECIATION_AMORTIZATION].length).toBe(2);
      expect(grouped[AddBackCategory.OFFICER_COMPENSATION].length).toBe(1);
    });
  });

  describe('Multi-Year Comparison', () => {
    it('should generate multi-year add-back comparison', () => {
      const schedule = createAddBackSchedule();

      const years = [
        {
          fiscal_year: 2024,
          starting_net_income: KFACTOR_EXPECTED_SDE.fy2024.net_income,
          items: [
            {
              description: 'Officer Compensation',
              category: AddBackCategory.OFFICER_COMPENSATION,
              amount: KFACTOR_EXPECTED_SDE.fy2024.add_officer_compensation,
              source: 'Form 1120-S',
              year: 2024,
            },
          ],
        },
        {
          fiscal_year: 2023,
          starting_net_income: KFACTOR_EXPECTED_SDE.fy2023.net_income,
          items: [
            {
              description: 'Officer Compensation',
              category: AddBackCategory.OFFICER_COMPENSATION,
              amount: KFACTOR_EXPECTED_SDE.fy2023.add_officer_compensation,
              source: 'Form 1120-S',
              year: 2023,
            },
          ],
        },
      ];

      const comparison = schedule.generateMultiYearComparison(
        'K-Factor Engineering',
        years
      );

      expect(comparison.years.length).toBe(2);
      expect(comparison.years[0].fiscal_year).toBe(2024);
      expect(comparison.years[1].fiscal_year).toBe(2023);
    });
  });

  describe('Output Formatting', () => {
    it('should generate markdown output', () => {
      const schedule = createAddBackSchedule();

      const input: AddBackScheduleInput = {
        company_name: 'Test Company',
        fiscal_year: 2024,
        starting_net_income: 500000,
        items: [
          {
            description: 'Officer Compensation',
            category: AddBackCategory.OFFICER_COMPENSATION,
            amount: 150000,
            source: 'Form 1120-S Line 7',
            rationale: 'Above-market owner salary',
            year: 2024,
          },
          {
            description: 'Depreciation',
            category: AddBackCategory.DEPRECIATION_AMORTIZATION,
            amount: 50000,
            source: 'Form 4562',
            year: 2024,
          },
        ],
      };

      const result = schedule.generate(input);
      const markdown = schedule.toMarkdown(result);

      expect(markdown).toContain('Add-Back Schedule');
      expect(markdown).toContain('Officer Compensation');
      expect(markdown).toContain('$150,000');
      expect(markdown).toContain('Form 1120-S');
      expect(markdown).toContain('Total Add-Backs');
      expect(markdown).toContain('Adjusted SDE');
    });

    it('should generate HTML output', () => {
      const schedule = createAddBackSchedule();

      const input: AddBackScheduleInput = {
        company_name: 'Test Company',
        fiscal_year: 2024,
        starting_net_income: 500000,
        items: [
          {
            description: 'Test Item',
            category: AddBackCategory.DISCRETIONARY,
            amount: 25000,
            source: 'GL Account 6000',
            year: 2024,
          },
        ],
      };

      const result = schedule.generate(input);
      const html = schedule.toHTML(result);

      expect(html).toContain('<table');
      expect(html).toContain('</table>');
      expect(html).toContain('Test Item');
      expect(html).toContain('$25,000');
    });

    it('should include rationales in detailed output', () => {
      const schedule = createAddBackSchedule();

      const input: AddBackScheduleInput = {
        company_name: 'Test Company',
        fiscal_year: 2024,
        starting_net_income: 500000,
        items: [
          {
            description: 'Personal Vehicle',
            category: AddBackCategory.PERSONAL_EXPENSES,
            amount: 15000,
            source: 'GL Account 6300',
            rationale:
              'Owner personal vehicle expenses run through business. ' +
              'Full amount added back as discretionary.',
            year: 2024,
          },
        ],
      };

      const result = schedule.generate(input);
      const markdown = schedule.toMarkdown(result, { include_rationales: true });

      expect(markdown).toContain('personal vehicle');
      expect(markdown).toContain('added back');
    });
  });

  describe('Validation', () => {
    it('should validate schedule completeness', () => {
      const schedule = createAddBackSchedule();

      const input: AddBackScheduleInput = {
        company_name: 'Test Company',
        fiscal_year: 2024,
        starting_net_income: 500000,
        items: [
          {
            description: 'Officer Comp',
            category: AddBackCategory.OFFICER_COMPENSATION,
            amount: 150000,
            source: 'Form 1120-S',
            year: 2024,
          },
        ],
      };

      const result = schedule.generate(input);
      const validation = schedule.validate(result);

      expect(validation.is_complete).toBe(true);
      expect(validation.has_sources).toBe(true);
    });

    it('should warn about missing common add-backs', () => {
      const schedule = createAddBackSchedule();

      // Schedule without depreciation (which almost all businesses have)
      const input: AddBackScheduleInput = {
        company_name: 'Test Company',
        fiscal_year: 2024,
        starting_net_income: 500000,
        items: [
          {
            description: 'Officer Comp',
            category: AddBackCategory.OFFICER_COMPENSATION,
            amount: 150000,
            source: 'Form 1120-S',
            year: 2024,
          },
        ],
      };

      const result = schedule.generate(input);
      const validation = schedule.validate(result);

      expect(validation.warnings).toBeDefined();
      expect(
        validation.warnings!.some((w) =>
          w.toLowerCase().includes('depreciation')
        )
      ).toBe(true);
    });
  });
});
