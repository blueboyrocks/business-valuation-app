/**
 * Feature Flags Module
 *
 * Centralized feature flag management for toggling between Modal and Claude Vision
 * extraction paths. Read from environment variables for safe deployment.
 */

export interface FeatureFlags {
  /** Use Modal/pdfplumber extraction instead of Claude Vision for passes 1-3 */
  useModalExtraction: boolean;
  /** Allow fallback to Claude Vision if Modal fails (only for scanned PDFs with user opt-in) */
  allowClaudeVisionFallback: boolean;
  /** Show extraction debug panel in admin UI */
  showExtractionDebugPanel: boolean;
  /** Fail mode for Modal errors: 'hard' throws immediately, 'queue' queues for manual review */
  modalFailMode: 'hard' | 'queue';
}

/**
 * Get current feature flags from environment variables.
 *
 * Environment variables:
 * - FEATURE_MODAL_EXTRACTION: 'true' to enable Modal extraction (default: false)
 * - FEATURE_CLAUDE_VISION_FALLBACK: 'true' to allow Claude Vision fallback (default: false)
 * - FEATURE_EXTRACTION_DEBUG: 'true' to show debug panel (default: false)
 * - MODAL_FAIL_MODE: 'hard' or 'queue' (default: 'hard')
 */
export function getFeatureFlags(): FeatureFlags {
  return {
    useModalExtraction: process.env.FEATURE_MODAL_EXTRACTION === 'true',
    allowClaudeVisionFallback: process.env.FEATURE_CLAUDE_VISION_FALLBACK === 'true',
    showExtractionDebugPanel: process.env.FEATURE_EXTRACTION_DEBUG === 'true',
    modalFailMode: (process.env.MODAL_FAIL_MODE === 'queue' ? 'queue' : 'hard') as 'hard' | 'queue',
  };
}

/**
 * Check if Modal extraction is enabled.
 * Convenience function for the most common check.
 */
export function isModalExtractionEnabled(): boolean {
  return getFeatureFlags().useModalExtraction;
}

/**
 * Check if Claude Vision fallback is allowed.
 * Only used for scanned PDFs with explicit user opt-in.
 */
export function isClaudeVisionFallbackAllowed(): boolean {
  return getFeatureFlags().allowClaudeVisionFallback;
}

/**
 * Log current feature flag state for debugging.
 */
export function logFeatureFlags(): void {
  const flags = getFeatureFlags();
  console.log('[FEATURE-FLAGS] Current configuration:');
  console.log(`  - useModalExtraction: ${flags.useModalExtraction}`);
  console.log(`  - allowClaudeVisionFallback: ${flags.allowClaudeVisionFallback}`);
  console.log(`  - showExtractionDebugPanel: ${flags.showExtractionDebugPanel}`);
  console.log(`  - modalFailMode: ${flags.modalFailMode}`);
}
