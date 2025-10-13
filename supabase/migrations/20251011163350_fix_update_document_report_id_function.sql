/*
  # Fix update_document_report_id function

  1. Changes
    - Drop and recreate the function with proper security
    - Use SECURITY INVOKER instead of SECURITY DEFINER
    - Add user_id check for security
  
  2. Notes
    - Ensures users can only update their own documents
    - Maintains RLS policy enforcement
*/

DROP FUNCTION IF EXISTS update_document_report_id(uuid, uuid);

CREATE OR REPLACE FUNCTION update_document_report_id(doc_id uuid, new_report_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  UPDATE documents
  SET report_id = new_report_id
  WHERE id = doc_id
  AND user_id = auth.uid();
END;
$$;
