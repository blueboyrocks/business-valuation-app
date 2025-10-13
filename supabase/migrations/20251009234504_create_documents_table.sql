/*
  # Create Documents Table

  1. New Tables
    - `documents`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `file_name` (text)
      - `file_path` (text)
      - `file_size` (bigint)
      - `mime_type` (text)
      - `company_name` (text)
      - `upload_status` (text: pending, completed, failed)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `documents` table
    - Add policy for users to read their own documents
    - Add policy for users to insert their own documents
    - Add policy for users to update their own documents
    - Add policy for users to delete their own documents
  
  3. Notes
    - Documents are linked to user profiles
    - File paths reference Supabase storage locations
    - Upload status tracks the document processing state
*/

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  company_name text,
  upload_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT upload_status_check CHECK (upload_status IN ('pending', 'completed', 'failed'))
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents"
  ON documents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger for updated_at on documents
CREATE TRIGGER set_updated_at_documents
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS documents_user_id_idx ON documents(user_id);
CREATE INDEX IF NOT EXISTS documents_created_at_idx ON documents(created_at DESC);