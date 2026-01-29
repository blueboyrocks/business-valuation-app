/**
 * Modal.com Extraction Client
 * PRD-H: Robust PDF Extraction Pipeline
 *
 * TypeScript client for calling the Modal PDF extraction service.
 * Bridge between Next.js (Vercel) and Modal (Python/pdfplumber).
 */

import { Stage1Output, Stage1Error, ModalExtractionResponse } from './types';

/**
 * Configuration for Modal client
 */
interface ModalClientConfig {
  /** Modal web endpoint URL (set after deployment) */
  endpointUrl?: string;
  /** Request timeout in milliseconds (default: 60000) */
  timeout?: number;
}

/**
 * Get Modal endpoint URL from environment or config
 */
function getEndpointUrl(config?: ModalClientConfig): string {
  // Priority: config > env var > default
  if (config?.endpointUrl) {
    return config.endpointUrl;
  }

  const envUrl = process.env.MODAL_EXTRACTION_URL;
  if (envUrl) {
    return envUrl;
  }

  // Default Modal endpoint (user must deploy and update this)
  throw new Error(
    'Modal extraction URL not configured. Set MODAL_EXTRACTION_URL environment variable or pass endpointUrl in config.'
  );
}

/**
 * Extract PDF using Modal serverless function
 *
 * @param pdfInput - PDF buffer or base64-encoded string
 * @param documentId - Unique identifier for the document
 * @param filename - Original filename
 * @param config - Optional client configuration
 * @returns ModalExtractionResponse with Stage1Output or error
 */
export async function extractPdfViaModal(
  pdfInput: Buffer | string,
  documentId: string,
  filename: string,
  config?: ModalClientConfig
): Promise<ModalExtractionResponse> {
  const timeout = config?.timeout ?? 60000; // 60 second default

  try {
    const endpointUrl = getEndpointUrl(config);

    // Convert buffer to base64 if needed
    const pdfBase64 =
      typeof pdfInput === 'string'
        ? pdfInput
        : pdfInput.toString('base64');

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdf_base64: pdfBase64,
          document_id: documentId,
          filename: filename,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        return {
          success: false,
          error: `Modal service error (${response.status}): ${errorText}`,
        };
      }

      const result = await response.json();

      // Validate response structure
      if (result.success && result.data) {
        // Validate Stage1Output structure
        const data = result.data as Stage1Output;

        if (!data.tables || !data.text_by_region || !data.metadata) {
          return {
            success: false,
            error: 'Invalid Stage1Output structure from Modal service',
          };
        }

        return {
          success: true,
          data: data,
        };
      } else if (result.error) {
        // Handle structured error from Modal
        const error = result.error as Stage1Error;

        return {
          success: false,
          error: error.message || 'Unknown extraction error',
          is_scanned: result.data?.metadata?.is_scanned,
        };
      } else {
        return {
          success: false,
          error: 'Invalid response from Modal service',
        };
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          return {
            success: false,
            error: `Request timeout after ${timeout}ms`,
          };
        }
        return {
          success: false,
          error: `Network error: ${fetchError.message}`,
        };
      }

      return {
        success: false,
        error: 'Unknown network error',
      };
    }
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: 'Unknown error in extractPdfViaModal',
    };
  }
}

/**
 * Check Modal service health
 *
 * @param config - Optional client configuration
 * @returns true if service is healthy, false otherwise
 */
export async function checkModalHealth(config?: ModalClientConfig): Promise<boolean> {
  try {
    const baseUrl = getEndpointUrl(config);
    // Health endpoint is at /health relative to the base endpoint
    const healthUrl = baseUrl.replace(/\/extract_pdf$/, '/health');

    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    return result.status === 'healthy';
  } catch {
    return false;
  }
}

/**
 * Extract PDF with retry logic
 *
 * @param pdfInput - PDF buffer or base64-encoded string
 * @param documentId - Unique identifier for the document
 * @param filename - Original filename
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param config - Optional client configuration
 * @returns ModalExtractionResponse with Stage1Output or error
 */
export async function extractPdfWithRetry(
  pdfInput: Buffer | string,
  documentId: string,
  filename: string,
  maxRetries: number = 3,
  config?: ModalClientConfig
): Promise<ModalExtractionResponse & { retryCount: number }> {
  const delays = [1000, 3000, 9000]; // Exponential backoff: 1s, 3s, 9s
  let lastError: string = '';
  let retryCount = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await extractPdfViaModal(pdfInput, documentId, filename, config);

    if (result.success) {
      return { ...result, retryCount };
    }

    // Check if error is retryable
    const errorLower = result.error?.toLowerCase() || '';
    const isRetryable =
      errorLower.includes('timeout') ||
      errorLower.includes('rate limit') ||
      errorLower.includes('network') ||
      errorLower.includes('503') ||
      errorLower.includes('502') ||
      errorLower.includes('500');

    // Check if error is permanent (don't retry)
    const isPermanent =
      errorLower.includes('encrypted') ||
      errorLower.includes('corrupted') ||
      errorLower.includes('invalid') ||
      errorLower.includes('password');

    if (isPermanent || !isRetryable || attempt >= maxRetries) {
      return { ...result, retryCount };
    }

    // Wait before retry
    const delay = delays[attempt] || delays[delays.length - 1];
    await new Promise((resolve) => setTimeout(resolve, delay));

    lastError = result.error || 'Unknown error';
    retryCount++;
    console.log(`[Modal] Retry ${retryCount}/${maxRetries} after error: ${lastError}`);
  }

  return {
    success: false,
    error: lastError || 'Max retries exceeded',
    retryCount,
  };
}
