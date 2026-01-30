/**
 * Extraction Error Types and Handlers
 *
 * Standardized error types for extraction failures.
 * Errors are actionable - they tell the user what to do next.
 */

/**
 * Error codes for extraction failures.
 */
export enum ExtractionErrorCode {
  /** Failed to connect to Modal service */
  MODAL_CONNECTION_FAILED = 'MODAL_CONNECTION_FAILED',
  /** Modal request timed out */
  MODAL_TIMEOUT = 'MODAL_TIMEOUT',
  /** PDF is password protected */
  PDF_ENCRYPTED = 'PDF_ENCRYPTED',
  /** PDF file is corrupted or invalid */
  PDF_CORRUPTED = 'PDF_CORRUPTED',
  /** PDF is scanned/image-based (requires premium extraction) */
  PDF_SCANNED = 'PDF_SCANNED',
  /** Extraction succeeded but required data is missing */
  MISSING_REQUIRED_DATA = 'MISSING_REQUIRED_DATA',
  /** Unknown or unexpected error */
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Structured extraction error with actionable information.
 */
export interface ExtractionError {
  /** Error code for programmatic handling */
  code: ExtractionErrorCode;
  /** Human-readable error message */
  message: string;
  /** Suggested action for the user to resolve the error */
  suggestedRemediation: string;
  /** Whether the operation can be retried */
  isRetryable: boolean;
  /** Optional additional context */
  context?: Record<string, unknown>;
  /** Timestamp when error occurred */
  timestamp: string;
}

/**
 * Create an ExtractionError with consistent structure.
 */
export function createExtractionError(
  code: ExtractionErrorCode,
  context?: Record<string, unknown>
): ExtractionError {
  const timestamp = new Date().toISOString();

  switch (code) {
    case ExtractionErrorCode.MODAL_CONNECTION_FAILED:
      return {
        code,
        message: 'Unable to connect to the extraction service.',
        suggestedRemediation:
          'Please try again in a few minutes. If the problem persists, contact support.',
        isRetryable: true,
        context,
        timestamp,
      };

    case ExtractionErrorCode.MODAL_TIMEOUT:
      return {
        code,
        message: 'Extraction timed out while processing your document.',
        suggestedRemediation:
          'Please try again. If processing large documents, consider splitting them.',
        isRetryable: true,
        context,
        timestamp,
      };

    case ExtractionErrorCode.PDF_ENCRYPTED:
      return {
        code,
        message: 'This PDF is password protected.',
        suggestedRemediation:
          'Please upload an unprotected version of the PDF, or remove the password protection.',
        isRetryable: false,
        context,
        timestamp,
      };

    case ExtractionErrorCode.PDF_CORRUPTED:
      return {
        code,
        message: 'The PDF file appears to be corrupted or invalid.',
        suggestedRemediation:
          'Please try re-downloading the original document and uploading again.',
        isRetryable: false,
        context,
        timestamp,
      };

    case ExtractionErrorCode.PDF_SCANNED:
      return {
        code,
        message: 'This PDF appears to be a scanned document.',
        suggestedRemediation:
          'Scanned documents require premium extraction. Would you like to use premium extraction for this document?',
        isRetryable: false,
        context,
        timestamp,
      };

    case ExtractionErrorCode.MISSING_REQUIRED_DATA:
      return {
        code,
        message: 'The document was processed but required financial data could not be found.',
        suggestedRemediation:
          'Please ensure you uploaded the correct document type (tax returns, financial statements).',
        isRetryable: false,
        context,
        timestamp,
      };

    case ExtractionErrorCode.UNKNOWN_ERROR:
    default:
      return {
        code: ExtractionErrorCode.UNKNOWN_ERROR,
        message: 'An unexpected error occurred during extraction.',
        suggestedRemediation:
          'Please try again. If the problem persists, contact support with the error details.',
        isRetryable: true,
        context,
        timestamp,
      };
  }
}

/**
 * Error response structure for API responses.
 */
export interface ExtractionErrorResponse {
  success: false;
  error: ExtractionError;
}

/**
 * Handle an extraction error and return an appropriate response.
 *
 * @param error - The caught error (may be native Error or ExtractionError)
 * @param context - Additional context to include in the error
 * @returns Structured error response
 */
export function handleExtractionError(
  error: unknown,
  context?: Record<string, unknown>
): ExtractionErrorResponse {
  // If already an ExtractionError, return it
  if (isExtractionError(error)) {
    console.error(`[EXTRACTION-ERROR] ${error.code}: ${error.message}`, error.context);
    return { success: false, error };
  }

  // Determine error code from native error
  const code = classifyError(error);
  const extractionError = createExtractionError(code, {
    ...context,
    originalError: error instanceof Error ? error.message : String(error),
  });

  console.error(
    `[EXTRACTION-ERROR] ${extractionError.code}: ${extractionError.message}`,
    extractionError.context
  );

  return { success: false, error: extractionError };
}

/**
 * Type guard for ExtractionError.
 */
export function isExtractionError(error: unknown): error is ExtractionError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'suggestedRemediation' in error &&
    'isRetryable' in error &&
    Object.values(ExtractionErrorCode).includes((error as ExtractionError).code)
  );
}

/**
 * Classify a native error into an ExtractionErrorCode.
 */
function classifyError(error: unknown): ExtractionErrorCode {
  if (!(error instanceof Error)) {
    return ExtractionErrorCode.UNKNOWN_ERROR;
  }

  const message = error.message.toLowerCase();

  // Connection errors
  if (
    message.includes('econnrefused') ||
    message.includes('enotfound') ||
    message.includes('network') ||
    message.includes('connection')
  ) {
    return ExtractionErrorCode.MODAL_CONNECTION_FAILED;
  }

  // Timeout errors
  if (message.includes('timeout') || message.includes('timed out')) {
    return ExtractionErrorCode.MODAL_TIMEOUT;
  }

  // PDF errors
  if (message.includes('password') || message.includes('encrypted')) {
    return ExtractionErrorCode.PDF_ENCRYPTED;
  }

  if (message.includes('corrupt') || message.includes('invalid pdf')) {
    return ExtractionErrorCode.PDF_CORRUPTED;
  }

  if (message.includes('scanned') || message.includes('ocr required')) {
    return ExtractionErrorCode.PDF_SCANNED;
  }

  return ExtractionErrorCode.UNKNOWN_ERROR;
}

/**
 * Custom error class that can be thrown in code.
 */
export class ExtractionException extends Error {
  public readonly extractionError: ExtractionError;

  constructor(code: ExtractionErrorCode, context?: Record<string, unknown>) {
    const error = createExtractionError(code, context);
    super(error.message);
    this.name = 'ExtractionException';
    this.extractionError = error;
  }
}
