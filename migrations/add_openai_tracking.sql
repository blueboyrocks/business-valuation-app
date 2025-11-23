-- Add OpenAI tracking columns to reports table
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS openai_thread_id TEXT,
ADD COLUMN IF NOT EXISTS openai_run_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reports_openai_run_id ON reports(openai_run_id);
CREATE INDEX IF NOT EXISTS idx_reports_status_processing ON reports(report_status) WHERE report_status = 'processing';
