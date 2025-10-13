/*
  # Create RPC function to update document report_id

  1. New Functions
    - `update_document_report_id` - Updates the report_id for a document
  
  2. Notes
    - Simple helper function to update document-report linkage
    - Works around TypeScript type limitations
*/

CREATE OR REPLACE FUNCTION update_document_report_id(doc_id uuid, new_report_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE documents
  SET report_id = new_report_id
  WHERE id = doc_id;
END;
$$;
