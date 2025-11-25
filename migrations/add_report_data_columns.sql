-- Add missing report data columns to reports table
-- These columns store structured data extracted from OpenAI analysis

ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS key_metrics JSONB,
ADD COLUMN IF NOT EXISTS financial_summary JSONB,
ADD COLUMN IF NOT EXISTS risk_factors JSONB,
ADD COLUMN IF NOT EXISTS recommendations JSONB,
ADD COLUMN IF NOT EXISTS full_analysis TEXT;

-- Add comments for documentation
COMMENT ON COLUMN reports.key_metrics IS 'Key financial and business metrics extracted from analysis';
COMMENT ON COLUMN reports.financial_summary IS 'Summary of financial performance and trends';
COMMENT ON COLUMN reports.risk_factors IS 'Identified risks and their assessments';
COMMENT ON COLUMN reports.recommendations IS 'Strategic recommendations for the business';
COMMENT ON COLUMN reports.full_analysis IS 'Complete analysis text from OpenAI';

-- Create indexes for faster JSON queries
CREATE INDEX IF NOT EXISTS idx_reports_key_metrics ON reports USING GIN (key_metrics);
CREATE INDEX IF NOT EXISTS idx_reports_financial_summary ON reports USING GIN (financial_summary);
CREATE INDEX IF NOT EXISTS idx_reports_risk_factors ON reports USING GIN (risk_factors);
CREATE INDEX IF NOT EXISTS idx_reports_recommendations ON reports USING GIN (recommendations);
