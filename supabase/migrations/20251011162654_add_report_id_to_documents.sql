/*
  # Add report_id to documents table

  1. Changes
    - Add `report_id` column to `documents` table
    - Create foreign key reference to `reports` table
    - Create index for faster queries on report_id
  
  2. Notes
    - This links documents to specific reports
    - Allows fetching only documents associated with a particular report
    - Prevents mixing documents from different uploads of the same company
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'report_id'
  ) THEN
    ALTER TABLE documents ADD COLUMN report_id uuid REFERENCES reports(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS documents_report_id_idx ON documents(report_id);
  END IF;
END $$;
