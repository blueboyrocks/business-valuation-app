/*
  # Add manifest_json column to reports table

  PRD-H US-002: Store JSON manifest alongside PDF for automated consistency testing.

  1. Changes
    - Add `manifest_json` (jsonb) column to `reports` table
    - Column stores the report manifest containing all critical values
    - Enables querying valuation data without regenerating PDF

  2. Notes
    - JSONB allows efficient querying of manifest contents
    - Column is nullable as existing reports won't have manifests
*/

ALTER TABLE reports ADD COLUMN IF NOT EXISTS manifest_json JSONB;

-- Add comment for documentation
COMMENT ON COLUMN reports.manifest_json IS 'JSON manifest containing critical valuation values for consistency verification (PRD-H US-002)';
