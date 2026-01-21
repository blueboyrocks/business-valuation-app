-- Add pass_outputs JSONB column to store all pass outputs in one place
-- This simplifies access for the chained API calls pattern

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS pass_outputs JSONB DEFAULT '{}';

-- Update current_pass to default to 0
ALTER TABLE reports
ALTER COLUMN current_pass SET DEFAULT 0;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reports_pass_outputs ON reports USING GIN (pass_outputs);

-- Add comment for documentation
COMMENT ON COLUMN reports.pass_outputs IS 'JSONB object storing outputs from each pass: {"1": {...}, "2": {...}, ...}';
