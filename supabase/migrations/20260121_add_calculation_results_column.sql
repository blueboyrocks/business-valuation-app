-- Add calculation_results column to reports table
-- This column stores the output from the deterministic calculation engine

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS calculation_results JSONB;

-- Add comment describing the column
COMMENT ON COLUMN reports.calculation_results IS 'Stores deterministic calculation engine output including all calculation steps, normalized earnings, and valuation approach results';

-- Create index for efficient querying of calculation results
CREATE INDEX IF NOT EXISTS idx_reports_calculation_results
ON reports USING GIN (calculation_results);
