-- Add calculation_results column to valuation_reports table
-- This column stores the output from the deterministic calculation engine

ALTER TABLE valuation_reports
ADD COLUMN IF NOT EXISTS calculation_results JSONB;

-- Add comment describing the column
COMMENT ON COLUMN valuation_reports.calculation_results IS 'Stores deterministic calculation engine output including all calculation steps, normalized earnings, and valuation approach results';

-- Create index for efficient querying of calculation results
CREATE INDEX IF NOT EXISTS idx_valuation_reports_calculation_results
ON valuation_reports USING GIN (calculation_results);
