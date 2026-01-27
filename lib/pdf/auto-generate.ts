/**
 * Automatic PDF Generation Helper
 *
 * This module handles automatic PDF generation after valuation completes.
 * It generates the PDF and uploads it to Supabase storage.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ProfessionalPDFGenerator } from './professional-pdf-generator';
import type { ValuationDataAccessor } from '../valuation/data-accessor';

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

export interface AutoPDFResult {
  success: boolean;
  pdfPath?: string;
  pdfSize?: number;
  error?: string;
  generationTimeMs?: number;
}

/**
 * Automatically generate and store PDF for a completed report
 */
export async function generateAndStorePDF(
  reportId: string,
  companyName: string,
  reportData: Record<string, unknown>,
  accessor?: ValuationDataAccessor
): Promise<AutoPDFResult> {
  const startTime = Date.now();
  console.log(`[AUTO-PDF] ========================================`);
  console.log(`[AUTO-PDF] Starting automatic PDF generation`);
  console.log(`[AUTO-PDF] Report ID: ${reportId}`);
  console.log(`[AUTO-PDF] Company: ${companyName}`);

  try {
    // Generate the PDF
    const generatedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    console.log(`[AUTO-PDF] Initializing PDF generator...`);
    const generator = new ProfessionalPDFGenerator();

    console.log(`[AUTO-PDF] Generating PDF with Puppeteer...`);
    const pdfBuffer = await generator.generate(companyName, reportData, generatedDate, accessor);
    console.log(`[AUTO-PDF] PDF generated: ${pdfBuffer.length} bytes`);

    // Create a safe filename
    const safeCompanyName = companyName.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
    const timestamp = Date.now();
    const filename = `${reportId}/${safeCompanyName}_Valuation_${timestamp}.pdf`;

    // Try to upload to Supabase storage (optional - bucket may not exist)
    let pdfPath: string | null = null;

    console.log(`[AUTO-PDF] Attempting upload to Supabase storage: ${filename}`);

    try {
      const { data: uploadData, error: uploadError } = await getSupabaseClient()
        .storage
        .from('reports')
        .upload(filename, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) {
        // Storage upload failed - log but don't fail the whole operation
        // PDFs can still be generated on-demand via the download endpoint
        console.warn(`[AUTO-PDF] ⚠️ Storage upload skipped: ${uploadError.message}`);
        console.log(`[AUTO-PDF] Note: PDF can still be downloaded on-demand`);
      } else {
        pdfPath = uploadData.path;
        console.log(`[AUTO-PDF] ✓ PDF uploaded to storage`);

        // Update the report with the PDF path
        const { error: updateError } = await getSupabaseClient()
          .from('reports')
          .update({ pdf_path: pdfPath })
          .eq('id', reportId);

        if (updateError) {
          console.warn(`[AUTO-PDF] ⚠️ Failed to save PDF path to report:`, updateError.message);
        } else {
          console.log(`[AUTO-PDF] ✓ Report updated with PDF path`);
        }
      }
    } catch (storageError) {
      // Catch any unexpected storage errors
      console.warn(`[AUTO-PDF] ⚠️ Storage error (non-fatal):`, storageError);
    }

    const duration = Date.now() - startTime;
    console.log(`[AUTO-PDF] ✓ PDF generation complete! Total time: ${duration}ms`);
    console.log(`[AUTO-PDF] ========================================`);

    return {
      success: true,
      pdfPath: pdfPath || undefined,
      pdfSize: pdfBuffer.length,
      generationTimeMs: duration,
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error(`[AUTO-PDF] ❌ Failed after ${duration}ms`);
    console.error(`[AUTO-PDF] Error: ${errorMessage}`);
    console.log(`[AUTO-PDF] ========================================`);

    // Update report to indicate PDF generation failed (but don't fail the whole valuation)
    try {
      await getSupabaseClient()
        .from('reports')
        .update({
          processing_message: `Valuation complete. PDF generation failed: ${errorMessage}`
        })
        .eq('id', reportId);
    } catch {
      // Ignore update errors
    }

    return {
      success: false,
      error: errorMessage,
      generationTimeMs: duration,
    };
  }
}

/**
 * Get a signed URL for downloading a PDF
 */
export async function getPDFDownloadURL(pdfPath: string): Promise<string | null> {
  try {
    const { data, error } = await getSupabaseClient()
      .storage
      .from('reports')
      .createSignedUrl(pdfPath, 3600); // 1 hour expiry

    if (error) {
      console.error(`[AUTO-PDF] Failed to create signed URL:`, error.message);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error(`[AUTO-PDF] Error creating signed URL:`, error);
    return null;
  }
}
