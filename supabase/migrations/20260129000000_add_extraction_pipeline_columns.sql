-- Add extraction pipeline columns to document_extractions table
-- PRD-H: Robust PDF Extraction Pipeline
-- Adds support for 3-stage pipeline: Stage1 (pdfplumber), Stage2 (Haiku), Stage3 (Sonnet/Opus)

-- Add document classification columns
ALTER TABLE document_extractions
ADD COLUMN IF NOT EXISTS document_type TEXT,
ADD COLUMN IF NOT EXISTS tax_year TEXT,
ADD COLUMN IF NOT EXISTS entity_name TEXT;

-- Add stage-specific output columns (JSONB for flexibility)
ALTER TABLE document_extractions
ADD COLUMN IF NOT EXISTS stage1_output JSONB,
ADD COLUMN IF NOT EXISTS stage2_output JSONB,
ADD COLUMN IF NOT EXISTS stage3_output JSONB;

-- Add quality metrics columns
ALTER TABLE document_extractions
ADD COLUMN IF NOT EXISTS confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
ADD COLUMN IF NOT EXISTS validation_status TEXT CHECK (validation_status IN ('passed', 'warnings', 'errors')),
ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER;

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_document_extractions_document_type
    ON document_extractions(document_type);
CREATE INDEX IF NOT EXISTS idx_document_extractions_tax_year
    ON document_extractions(tax_year);
CREATE INDEX IF NOT EXISTS idx_document_extractions_confidence_score
    ON document_extractions(confidence_score);
CREATE INDEX IF NOT EXISTS idx_document_extractions_validation_status
    ON document_extractions(validation_status);

-- Add comments for documentation
COMMENT ON COLUMN document_extractions.document_type IS 'Classified document type: FORM_1120S, FORM_1065, INCOME_STATEMENT, etc.';
COMMENT ON COLUMN document_extractions.tax_year IS 'Tax year extracted from document (e.g., 2024)';
COMMENT ON COLUMN document_extractions.entity_name IS 'Company/entity name extracted from document';
COMMENT ON COLUMN document_extractions.stage1_output IS 'Stage 1 output: pdfplumber extraction (tables, text_by_region, raw_text)';
COMMENT ON COLUMN document_extractions.stage2_output IS 'Stage 2 output: Haiku classification and structuring (structured_data, red_flags)';
COMMENT ON COLUMN document_extractions.stage3_output IS 'Stage 3 output: Sonnet/Opus validation and enrichment (final extraction output)';
COMMENT ON COLUMN document_extractions.confidence_score IS 'Extraction confidence score 0-100, used for Opus escalation decisions';
COMMENT ON COLUMN document_extractions.validation_status IS 'Validation result: passed, warnings, or errors';
COMMENT ON COLUMN document_extractions.processing_time_ms IS 'Total processing time in milliseconds across all stages';
