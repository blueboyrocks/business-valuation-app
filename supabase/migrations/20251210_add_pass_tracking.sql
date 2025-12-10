-- Add pass tracking infrastructure for 18-pass system

-- 1. Add missing columns to reports table
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS current_pass INTEGER,
ADD COLUMN IF NOT EXISTS file_ids TEXT[];

-- 2. Create report_pass_data table to store data from each pass
CREATE TABLE IF NOT EXISTS report_pass_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  pass_number integer NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_report_pass UNIQUE(report_id, pass_number)
);

-- 3. Enable RLS on report_pass_data table
ALTER TABLE report_pass_data ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for report_pass_data
CREATE POLICY "Users can view their own report pass data"
  ON report_pass_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reports 
      WHERE reports.id = report_pass_data.report_id 
      AND reports.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own report pass data"
  ON report_pass_data FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM reports 
      WHERE reports.id = report_pass_data.report_id 
      AND reports.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own report pass data"
  ON report_pass_data FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reports 
      WHERE reports.id = report_pass_data.report_id 
      AND reports.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM reports 
      WHERE reports.id = report_pass_data.report_id 
      AND reports.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own report pass data"
  ON report_pass_data FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reports 
      WHERE reports.id = report_pass_data.report_id 
      AND reports.user_id = auth.uid()
    )
  );

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_report_pass_data_report_id ON report_pass_data(report_id);
CREATE INDEX IF NOT EXISTS idx_report_pass_data_pass_number ON report_pass_data(report_id, pass_number);
CREATE INDEX IF NOT EXISTS idx_reports_current_pass ON reports(current_pass) WHERE current_pass IS NOT NULL;

-- 6. Add trigger for updated_at on report_pass_data
CREATE TRIGGER set_updated_at_report_pass_data
  BEFORE UPDATE ON report_pass_data
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- 7. Add comments for documentation
COMMENT ON TABLE report_pass_data IS 'Stores data extracted from each pass of the 18-pass valuation generation system';
COMMENT ON COLUMN reports.current_pass IS 'Current pass number (0-17) in the 18-pass system, null when not processing';
COMMENT ON COLUMN reports.file_ids IS 'Array of OpenAI file IDs for uploaded documents';
