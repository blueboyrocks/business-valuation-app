-- Create document_extractions table for storing intermediate PDF extraction data
-- This table stores the structured financial data extracted from each PDF
-- before it's processed into the final valuation report

CREATE TABLE IF NOT EXISTS document_extractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    extracted_data JSONB,
    extraction_status TEXT NOT NULL DEFAULT 'pending' CHECK (extraction_status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for common query patterns
CREATE INDEX idx_document_extractions_document_id ON document_extractions(document_id);
CREATE INDEX idx_document_extractions_report_id ON document_extractions(report_id);
CREATE INDEX idx_document_extractions_status ON document_extractions(extraction_status);

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_document_extractions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_document_extractions_updated_at
    BEFORE UPDATE ON document_extractions
    FOR EACH ROW
    EXECUTE FUNCTION update_document_extractions_updated_at();

-- Add RLS policies
ALTER TABLE document_extractions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view extractions for their own reports
CREATE POLICY "Users can view own document extractions"
    ON document_extractions
    FOR SELECT
    USING (
        report_id IN (
            SELECT id FROM reports WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can insert extractions for their own reports
CREATE POLICY "Users can insert own document extractions"
    ON document_extractions
    FOR INSERT
    WITH CHECK (
        report_id IN (
            SELECT id FROM reports WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can update extractions for their own reports
CREATE POLICY "Users can update own document extractions"
    ON document_extractions
    FOR UPDATE
    USING (
        report_id IN (
            SELECT id FROM reports WHERE user_id = auth.uid()
        )
    );

-- Policy: Service role can do everything (for backend API)
CREATE POLICY "Service role full access to document extractions"
    ON document_extractions
    FOR ALL
    USING (auth.role() = 'service_role');

-- Add comment for documentation
COMMENT ON TABLE document_extractions IS 'Stores intermediate extraction data from PDFs before final valuation processing';
COMMENT ON COLUMN document_extractions.extracted_data IS 'JSONB containing structured financial data extracted from the document';
COMMENT ON COLUMN document_extractions.extraction_status IS 'Status of extraction: pending, processing, completed, or failed';
