/**
 * Scanned PDF Detector
 *
 * Detects scanned/image-based PDFs that require premium (Claude Vision) extraction.
 * Modal/pdfplumber cannot extract text from scanned documents.
 *
 * Detection thresholds:
 * - <50 chars/page = definitely scanned -> require_premium
 * - <500 chars/page = possibly scanned -> warn_user
 * - >=500 chars/page = text-based -> proceed
 */

/**
 * Result of scanned PDF detection.
 */
export interface ScannedPdfDetectionResult {
  /** Whether the PDF appears to be scanned */
  isScanned: boolean;
  /** Average text characters per page */
  avgCharsPerPage: number;
  /** Total pages analyzed */
  pagesAnalyzed: number;
  /** Confidence level of the detection (0-1) */
  confidence: number;
  /** Recommended action */
  recommendation: 'proceed' | 'warn_user' | 'require_premium';
  /** Human-readable explanation */
  explanation: string;
}

/** Threshold below which PDF is definitely scanned */
const SCANNED_THRESHOLD = 50;

/** Threshold below which user should be warned */
const WARN_THRESHOLD = 500;

/**
 * Analyze text density metrics to detect scanned PDF.
 *
 * This function analyzes the text extraction result from Modal to determine
 * if the PDF is scanned. It uses text density heuristics.
 *
 * @param pageTexts - Array of text content extracted from each page
 * @returns Detection result with recommendation
 */
export function analyzeTextDensity(pageTexts: string[]): ScannedPdfDetectionResult {
  if (pageTexts.length === 0) {
    return {
      isScanned: true,
      avgCharsPerPage: 0,
      pagesAnalyzed: 0,
      confidence: 1.0,
      recommendation: 'require_premium',
      explanation: 'No pages found in document.',
    };
  }

  // Calculate average characters per page
  const totalChars = pageTexts.reduce((sum, text) => sum + (text?.length ?? 0), 0);
  const avgCharsPerPage = totalChars / pageTexts.length;

  // Determine if scanned based on text density
  const isScanned = avgCharsPerPage < SCANNED_THRESHOLD;
  const isLowDensity = avgCharsPerPage < WARN_THRESHOLD;

  // Calculate confidence based on how far from threshold
  let confidence: number;
  if (avgCharsPerPage < SCANNED_THRESHOLD) {
    // Very confident it's scanned
    confidence = Math.min(1.0, 1.0 - avgCharsPerPage / SCANNED_THRESHOLD);
  } else if (avgCharsPerPage < WARN_THRESHOLD) {
    // Medium confidence - in the gray zone
    confidence = 0.5 + 0.3 * ((WARN_THRESHOLD - avgCharsPerPage) / (WARN_THRESHOLD - SCANNED_THRESHOLD));
  } else {
    // Confident it's text-based
    confidence = Math.min(1.0, avgCharsPerPage / 1000);
  }

  // Determine recommendation
  let recommendation: 'proceed' | 'warn_user' | 'require_premium';
  let explanation: string;

  if (avgCharsPerPage < SCANNED_THRESHOLD) {
    recommendation = 'require_premium';
    explanation = `This document appears to be scanned (${Math.round(avgCharsPerPage)} characters per page). Premium extraction is required for scanned documents.`;
  } else if (avgCharsPerPage < WARN_THRESHOLD) {
    recommendation = 'warn_user';
    explanation = `This document has low text density (${Math.round(avgCharsPerPage)} characters per page). It may be partially scanned. Consider using premium extraction for better results.`;
  } else {
    recommendation = 'proceed';
    explanation = `Document has sufficient text density (${Math.round(avgCharsPerPage)} characters per page) for standard extraction.`;
  }

  return {
    isScanned,
    avgCharsPerPage,
    pagesAnalyzed: pageTexts.length,
    confidence,
    recommendation,
    explanation,
  };
}

/**
 * Detect if a PDF is scanned based on Modal extraction response.
 *
 * Modal's extract_pdf.py already detects scanned PDFs and includes
 * `is_scanned` and `ocr_confidence` in the metadata. This function
 * interprets that response.
 *
 * @param modalMetadata - Metadata from Modal extraction response
 * @returns Detection result with recommendation
 */
export function detectFromModalResponse(modalMetadata: {
  is_scanned?: boolean;
  ocr_confidence?: number;
  page_count?: number;
  extraction_method?: string;
}): ScannedPdfDetectionResult {
  const isScanned = modalMetadata.is_scanned ?? false;
  const confidence = modalMetadata.ocr_confidence ?? (isScanned ? 0.1 : 0.9);
  const pageCount = modalMetadata.page_count ?? 0;
  const wasOcr = modalMetadata.extraction_method === 'ocr';

  let recommendation: 'proceed' | 'warn_user' | 'require_premium';
  let explanation: string;

  if (isScanned || wasOcr) {
    // Modal detected scanned document
    if (confidence < 0.3) {
      recommendation = 'require_premium';
      explanation = 'This document is scanned with very low text confidence. Premium extraction recommended for accurate results.';
    } else if (confidence < 0.7) {
      recommendation = 'warn_user';
      explanation = 'This document appears partially scanned. Results may be incomplete.';
    } else {
      // OCR succeeded with decent confidence
      recommendation = 'proceed';
      explanation = 'Document was scanned but OCR extraction succeeded.';
    }
  } else {
    recommendation = 'proceed';
    explanation = 'Document is text-based and suitable for standard extraction.';
  }

  return {
    isScanned,
    avgCharsPerPage: 0, // Not available from Modal metadata alone
    pagesAnalyzed: pageCount,
    confidence,
    recommendation,
    explanation,
  };
}

/**
 * Combined detection that uses both local analysis and Modal response.
 *
 * @param pageTexts - Array of extracted text per page (can be empty if Modal already detected scanned)
 * @param modalMetadata - Metadata from Modal response
 * @returns Detection result with recommendation
 */
export function detectScannedPdf(
  pageTexts: string[],
  modalMetadata?: {
    is_scanned?: boolean;
    ocr_confidence?: number;
    page_count?: number;
    extraction_method?: string;
  }
): ScannedPdfDetectionResult {
  // If Modal already detected it as scanned, trust that
  if (modalMetadata?.is_scanned) {
    return detectFromModalResponse(modalMetadata);
  }

  // If we have page texts, analyze them
  if (pageTexts.length > 0) {
    const textResult = analyzeTextDensity(pageTexts);

    // If Modal says not scanned but text density is low, prefer text density result
    if (textResult.recommendation !== 'proceed') {
      return textResult;
    }

    // Both agree it's text-based
    return textResult;
  }

  // Fallback to Modal metadata if available
  if (modalMetadata) {
    return detectFromModalResponse(modalMetadata);
  }

  // No data available - recommend proceeding with caution
  return {
    isScanned: false,
    avgCharsPerPage: 0,
    pagesAnalyzed: 0,
    confidence: 0,
    recommendation: 'proceed',
    explanation: 'Unable to determine document type. Proceeding with standard extraction.',
  };
}

/**
 * Quick check if a document should use premium extraction.
 */
export function requiresPremiumExtraction(result: ScannedPdfDetectionResult): boolean {
  return result.recommendation === 'require_premium';
}

/**
 * Quick check if a document should warn the user.
 */
export function shouldWarnUser(result: ScannedPdfDetectionResult): boolean {
  return result.recommendation === 'warn_user' || result.recommendation === 'require_premium';
}
