/**
 * Extraction Data Loader
 *
 * Functions for loading and storing extraction data from the database.
 * Used by the orchestrator to check for existing extractions and load
 * extraction data for passes 4+.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { FinalExtractionOutput } from './types';

// Lazy-initialize Supabase client
let supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return supabase;
}

/**
 * Result of checking for existing extraction.
 */
export interface ExtractionCheckResult {
  exists: boolean;
  status: 'none' | 'pending' | 'processing' | 'completed' | 'failed';
  extraction?: FinalExtractionOutput;
  documentCount?: number;
  error?: string;
}

/**
 * Check if extraction data exists for a report.
 *
 * @param reportId - The report ID to check
 * @returns Check result with extraction data if available
 */
export async function checkExistingExtraction(
  reportId: string
): Promise<ExtractionCheckResult> {
  console.log(`[EXTRACTION-LOADER] Checking for existing extraction for report ${reportId}`);

  try {
    // Query document_extractions table for this report
    const { data: extractions, error } = await getSupabaseClient()
      .from('document_extractions')
      .select('id, extraction_status, extracted_data, document_id')
      .eq('report_id', reportId);

    if (error) {
      console.error(`[EXTRACTION-LOADER] Database error: ${error.message}`);
      return {
        exists: false,
        status: 'none',
        error: error.message,
      };
    }

    if (!extractions || extractions.length === 0) {
      console.log(`[EXTRACTION-LOADER] No extractions found for report ${reportId}`);
      return {
        exists: false,
        status: 'none',
      };
    }

    // Check status of all extractions
    const allCompleted = extractions.every(e => e.extraction_status === 'completed');
    const anyFailed = extractions.some(e => e.extraction_status === 'failed');
    const anyProcessing = extractions.some(e => e.extraction_status === 'processing');

    if (anyFailed) {
      return {
        exists: true,
        status: 'failed',
        documentCount: extractions.length,
        error: 'One or more document extractions failed',
      };
    }

    if (anyProcessing) {
      return {
        exists: true,
        status: 'processing',
        documentCount: extractions.length,
      };
    }

    if (!allCompleted) {
      return {
        exists: true,
        status: 'pending',
        documentCount: extractions.length,
      };
    }

    // All completed - try to load and merge extraction data
    console.log(`[EXTRACTION-LOADER] Found ${extractions.length} completed extraction(s)`);

    // For now, just return the first extraction's data
    // TODO: Merge multiple document extractions into unified output
    const extractionData = extractions[0].extracted_data as FinalExtractionOutput | null;

    if (!extractionData) {
      return {
        exists: true,
        status: 'completed',
        documentCount: extractions.length,
        error: 'Extraction completed but data is missing',
      };
    }

    return {
      exists: true,
      status: 'completed',
      extraction: extractionData,
      documentCount: extractions.length,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[EXTRACTION-LOADER] Error checking extraction: ${message}`);
    return {
      exists: false,
      status: 'none',
      error: message,
    };
  }
}

/**
 * Load extraction data for a report.
 *
 * @param reportId - The report ID
 * @returns FinalExtractionOutput or null if not available
 */
export async function loadExtractionData(
  reportId: string
): Promise<FinalExtractionOutput | null> {
  const result = await checkExistingExtraction(reportId);

  if (result.status !== 'completed' || !result.extraction) {
    console.log(`[EXTRACTION-LOADER] No completed extraction available for report ${reportId}`);
    return null;
  }

  return result.extraction;
}

/**
 * Store extraction data for a report.
 *
 * @param reportId - The report ID
 * @param documentId - The document ID
 * @param extraction - The extraction data to store
 * @returns Success status
 */
export async function storeExtractionData(
  reportId: string,
  documentId: string,
  extraction: FinalExtractionOutput
): Promise<boolean> {
  console.log(`[EXTRACTION-LOADER] Storing extraction for report ${reportId}, document ${documentId}`);

  try {
    const { error } = await getSupabaseClient()
      .from('document_extractions')
      .upsert({
        report_id: reportId,
        document_id: documentId,
        extraction_status: 'completed',
        extracted_data: extraction,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'document_id,report_id',
      });

    if (error) {
      console.error(`[EXTRACTION-LOADER] Failed to store extraction: ${error.message}`);
      return false;
    }

    console.log(`[EXTRACTION-LOADER] Extraction stored successfully`);
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[EXTRACTION-LOADER] Error storing extraction: ${message}`);
    return false;
  }
}

/**
 * Update extraction status.
 *
 * @param reportId - The report ID
 * @param documentId - The document ID
 * @param status - New status
 * @param errorMessage - Optional error message
 */
export async function updateExtractionStatus(
  reportId: string,
  documentId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  errorMessage?: string
): Promise<void> {
  await getSupabaseClient()
    .from('document_extractions')
    .update({
      extraction_status: status,
      error_message: errorMessage ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('report_id', reportId)
    .eq('document_id', documentId);
}
