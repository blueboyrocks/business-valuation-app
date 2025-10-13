/*
  # Create Storage Bucket for Document Uploads

  1. Storage
    - Create `documents` bucket for storing PDF files
    - Set public access to false for security
    - Configure file size limits (10MB per file)
    
  2. Security
    - Enable RLS on storage.objects
    - Add policies for authenticated users to upload their own documents
    - Add policies for authenticated users to read their own documents
    
  3. Notes
    - Users can only access their own uploaded documents
    - Maximum file size: 10MB per file
    - Allowed MIME types: application/pdf
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760,
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload their own documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can read their own documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
