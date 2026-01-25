/**
 * CalculationTableGenerator Unit Tests
 * TDD: Tests written before implementation
 *
 * Critical for calculation transparency - a premium feature that shows
 * line-by-line how values were calculated with source references.
 */
import { describe, it, expect } from 'vitest';
import {
  CalculationTableGenerator,
  createCalculationTableGenerator,
  SDECalculationTable,
  MarketApproachTable,
  SynthesisTable,
} from '../calculation-table-generator';
import {
  KFACTOR_EXPECTED_SDE,
  KFACTOR_EXPECTED_VALUATION,
  KFACTOR_INDUSTRY,
} from '../../test-utils/fixtures';

describe('CalculationTableGenerator', () => {
  describe('generateSDETable', () => {
    it('should generate SDE calculation table with line items', () => {
      const generator = createCalculationTableGenerator();

      const sdeData = {
        period: 'FY2024',
        starting_net_income: 728412,
        add_backs: [
          {
            description: 'Officer Compensation',
            amount: 250000,
            source: 'Form 1120-S Line 7',
          },
          {
            description: 'Interest Expense',
            amount: 12500,
            source: 'Schedule K Line 13a',
          },
          {
            description: 'Depreciation',
            amount: 45000,
            source: 'Form 4562',
          },
          {
            description: 'Amortization',
            amount: 8000,
            source: 'Form 4562 Part VI',
          },
        ],
        total_sde: 1043912,
      };

      const table = generator.generateSDETable(sdeData);

      expect(table.title).toBe('Seller\'s Discretionary Earnings Calculation');
      expect(table.period).toBe('FY2024');
      expect(table.rows.length).toBeGreaterThan(4);
      expect(table.total).toBe(1043912);
    });

    it('should include source references for each line item', () => {
      const generator = createCalculationTableGenerator();

      const sdeData = {
        period: 'FY2024',
        starting_net_income: 500000,
        add_backs: [
          {
            description: 'Officer Compensation',
            amount: 150000,
            source: 'Form 1120-S Line 7',
          },
        ],
        total_sde: 650000,
      };

      const table = generator.generateSDETable(sdeData);

      // Find the officer compensation row
      const officerRow = table.rows.find(
        (r) => r.description.includes('Officer')
      );
      expect(officerRow).toBeDefined();
      expect(officerRow!.source).toBe('Form 1120-S Line 7');
    });

    it('should format currency values correctly', () => {
      const generator = createCalculationTableGenerator();

      const sdeData = {
        period: 'FY2024',
        starting_net_income: 728412,
        add_backs: [
          {
            description: 'Test',
            amount: 250000,
            source: 'Test',
          },
        ],
        total_sde: 978412,
      };

      const table = generator.generateSDETable(sdeData);

      // Check that formatted values include $ and commas
      expect(table.formatted_total).toContain('$');
      expect(table.formatted_total).toContain(',');
    });

    it('should generate markdown output', () => {
      const generator = createCalculationTableGenerator();

      const sdeData = {
        period: 'FY2024',
        starting_net_income: 500000,
        add_backs: [
          { description: 'Officer Compensation', amount: 150000, source: 'Line 7' },
          { description: 'Depreciation', amount: 50000, source: 'Form 4562' },
        ],
        total_sde: 700000,
      };

      const table = generator.generateSDETable(sdeData);
      const markdown = generator.toMarkdown(table);

      expect(markdown).toContain('Seller\'s Discretionary Earnings');
      expect(markdown).toContain('Officer Compensation');
      expect(markdown).toContain('$150,000');
      expect(markdown).toContain('**Total SDE');
    });
  });

  describe('generateMarketApproachTable', () => {
    it('should generate market approach table with multiple selection', () => {
      const generator = createCalculationTableGenerator();

      const marketData = {
        benefit_stream: 'SDE',
        benefit_stream_value: 1040718,
        industry: 'Engineering Services',
        naics_code: '541330',
        multiple_range: {
          low: 2.0,
          median: 2.65,
          high: 3.5,
          source: 'Business Reference Guide',
        },
        selected_multiple: 2.65,
        multiple_position: 'Median',
        justification:
          'Median multiple selected based on company performance and industry position',
        adjustments: [
          { factor: 'Customer Concentration', percentage: -0.15 },
          { factor: 'Revenue Growth', percentage: 0.10 },
        ],
        final_multiple: 2.52,
        calculated_value: 2622609,
      };

      const table = generator.generateMarketApproachTable(marketData);

      expect(table.title).toBe('Market Approach Calculation');
      expect(table.benefit_stream).toBe('SDE');
      expect(table.selected_multiple).toBe(2.65);
      expect(table.calculated_value).toBe(2622609);
    });

    it('should show multiple justification', () => {
      const generator = createCalculationTableGenerator();

      const marketData = {
        benefit_stream: 'SDE',
        benefit_stream_value: 1000000,
        industry: 'Engineering Services',
        naics_code: '541330',
        multiple_range: { low: 2.0, median: 2.65, high: 3.5, source: 'BRG' },
        selected_multiple: 3.0,
        multiple_position: 'Above Median',
        justification:
          'Above median multiple justified due to 36% YoY revenue growth and diversified customer base',
        adjustments: [],
        final_multiple: 3.0,
        calculated_value: 3000000,
      };

      const table = generator.generateMarketApproachTable(marketData);
      const markdown = generator.toMarkdown(table);

      expect(markdown).toContain('36% YoY revenue growth');
      expect(markdown).toContain('Above Median');
    });

    it('should show adjustment factors', () => {
      const generator = createCalculationTableGenerator();

      const marketData = {
        benefit_stream: 'SDE',
        benefit_stream_value: 1000000,
        industry: 'Engineering Services',
        naics_code: '541330',
        multiple_range: { low: 2.0, median: 2.65, high: 3.5, source: 'BRG' },
        selected_multiple: 2.65,
        multiple_position: 'Median',
        justification: 'Median selected',
        adjustments: [
          { factor: 'High Customer Concentration', percentage: -0.10 },
          { factor: 'Strong Revenue Growth', percentage: 0.05 },
        ],
        final_multiple: 2.52,
        calculated_value: 2520000,
      };

      const table = generator.generateMarketApproachTable(marketData);
      const markdown = generator.toMarkdown(table);

      expect(markdown).toContain('Customer Concentration');
      expect(markdown).toContain('-10%');
      expect(markdown).toContain('Revenue Growth');
      expect(markdown).toContain('+5%');
    });
  });

  describe('generateSynthesisTable', () => {
    it('should generate synthesis table with approach weights', () => {
      const generator = createCalculationTableGenerator();

      const synthesisData = {
        approaches: [
          { name: 'Asset Approach', value: 1800000, weight: 0.2 },
          { name: 'Income Approach', value: 3200000, weight: 0.4 },
          { name: 'Market Approach', value: 2800000, weight: 0.4 },
        ],
        preliminary_value: 2840000,
        discounts: [
          { name: 'DLOM', percentage: 0.15, amount: 426000 },
        ],
        final_value: 2414000,
        value_range: { low: 2052000, high: 2776000 },
      };

      const table = generator.generateSynthesisTable(synthesisData);

      expect(table.title).toBe('Valuation Synthesis');
      expect(table.approaches.length).toBe(3);
      expect(table.preliminary_value).toBe(2840000);
      expect(table.final_value).toBe(2414000);
    });

    it('should show weighted contributions', () => {
      const generator = createCalculationTableGenerator();

      const synthesisData = {
        approaches: [
          { name: 'Asset Approach', value: 2000000, weight: 0.2 },
          { name: 'Income Approach', value: 3000000, weight: 0.4 },
          { name: 'Market Approach', value: 2500000, weight: 0.4 },
        ],
        preliminary_value: 2600000,
        discounts: [],
        final_value: 2600000,
        value_range: { low: 2210000, high: 2990000 },
      };

      const table = generator.generateSynthesisTable(synthesisData);
      const markdown = generator.toMarkdown(table);

      // Check weighted value column exists
      expect(markdown).toContain('Asset Approach');
      expect(markdown).toContain('20%');
      expect(markdown).toContain('$400,000'); // 2M * 20%
    });

    it('should show discounts and premiums', () => {
      const generator = createCalculationTableGenerator();

      const synthesisData = {
        approaches: [
          { name: 'Market Approach', value: 2500000, weight: 1.0 },
        ],
        preliminary_value: 2500000,
        discounts: [
          { name: 'DLOM', percentage: 0.15, amount: 375000 },
        ],
        final_value: 2125000,
        value_range: { low: 1806000, high: 2444000 },
      };

      const table = generator.generateSynthesisTable(synthesisData);
      const markdown = generator.toMarkdown(table);

      expect(markdown).toContain('DLOM');
      expect(markdown).toContain('15%');
      expect(markdown).toContain('$375,000');
    });
  });

  describe('K-Factor specific tables', () => {
    it('should generate correct K-Factor SDE table', () => {
      const generator = createCalculationTableGenerator();

      const sdeData = {
        period: 'FY2024',
        starting_net_income: KFACTOR_EXPECTED_SDE.fy2024.net_income,
        add_backs: [
          {
            description: 'Officer Compensation',
            amount: KFACTOR_EXPECTED_SDE.fy2024.add_officer_compensation,
            source: 'Form 1120-S Line 7',
          },
          {
            description: 'Depreciation',
            amount: KFACTOR_EXPECTED_SDE.fy2024.add_depreciation,
            source: 'Form 4562',
          },
          {
            description: 'Amortization',
            amount: KFACTOR_EXPECTED_SDE.fy2024.add_amortization,
            source: 'Form 4562 Part VI',
          },
          {
            description: 'Interest Expense',
            amount: KFACTOR_EXPECTED_SDE.fy2024.add_interest,
            source: 'Schedule K',
          },
          {
            description: 'Discretionary Add-backs',
            amount: KFACTOR_EXPECTED_SDE.fy2024.add_discretionary,
            source: 'Various',
          },
        ],
        total_sde: KFACTOR_EXPECTED_SDE.fy2024.total_sde,
      };

      const table = generator.generateSDETable(sdeData);

      expect(table.total).toBeCloseTo(
        KFACTOR_EXPECTED_SDE.fy2024.total_sde,
        -3
      );
    });

    it('should generate correct K-Factor market approach table', () => {
      const generator = createCalculationTableGenerator();

      const marketData = {
        benefit_stream: 'SDE',
        benefit_stream_value: KFACTOR_EXPECTED_SDE.weighted_average_sde,
        industry: 'Engineering Services',
        naics_code: '541330',
        multiple_range: KFACTOR_INDUSTRY.sde_multiple,
        selected_multiple: 2.65,
        multiple_position: 'Median',
        justification: 'Industry median multiple for Engineering Services',
        adjustments: [],
        final_multiple: 2.65,
        calculated_value:
          KFACTOR_EXPECTED_SDE.weighted_average_sde * 2.65,
      };

      const table = generator.generateMarketApproachTable(marketData);

      // Value should be approximately $2.76M (not $4.1M!)
      expect(table.calculated_value).toBeGreaterThan(2000000);
      expect(table.calculated_value).toBeLessThan(3500000);
      expect(table.calculated_value).not.toBeCloseTo(4100000, -4);
    });
  });

  describe('HTML output', () => {
    it('should generate HTML table for PDF rendering', () => {
      const generator = createCalculationTableGenerator();

      const sdeData = {
        period: 'FY2024',
        starting_net_income: 500000,
        add_backs: [
          { description: 'Test', amount: 100000, source: 'Source' },
        ],
        total_sde: 600000,
      };

      const table = generator.generateSDETable(sdeData);
      const html = generator.toHTML(table);

      expect(html).toContain('<table');
      expect(html).toContain('</table>');
      expect(html).toContain('<th');
      expect(html).toContain('<td');
    });
  });
});
