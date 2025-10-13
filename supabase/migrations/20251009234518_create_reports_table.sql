/*
  # Create Reports Table

  1. New Tables
    - `reports`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `document_id` (uuid, references documents)
      - `company_name` (text)
      - `report_status` (text: pending, processing, completed, failed)
      - `report_data` (jsonb, stores the valuation analysis)
      - `executive_summary` (text)
      - `valuation_amount` (numeric)
      - `valuation_method` (text)
      - `processing_started_at` (timestamptz)
      - `processing_completed_at` (timestamptz)
      - `error_message` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `reports` table
    - Add policy for users to read their own reports
    - Add policy for users to insert their own reports
    - Add policy for users to update their own reports
    - Add policy for users to delete their own reports
  
  3. Notes
    - Reports are linked to both users and documents
    - Report data stored as JSONB for flexibility
    - Status tracking for processing pipeline
    - Timestamps for performance monitoring
*/

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  company_name text NOT NULL,
  report_status text NOT NULL DEFAULT 'pending',
  report_data jsonb,
  executive_summary text,
  valuation_amount numeric(15, 2),
  valuation_method text,
  processing_started_at timestamptz,
  processing_completed_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT report_status_check CHECK (report_status IN ('pending', 'processing', 'completed', 'failed'))
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports"
  ON reports FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reports"
  ON reports FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger for updated_at on reports
CREATE TRIGGER set_updated_at_reports
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS reports_user_id_idx ON reports(user_id);
CREATE INDEX IF NOT EXISTS reports_document_id_idx ON reports(document_id);
CREATE INDEX IF NOT EXISTS reports_status_idx ON reports(report_status);
CREATE INDEX IF NOT EXISTS reports_created_at_idx ON reports(created_at DESC);