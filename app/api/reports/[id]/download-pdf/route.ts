import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ProfessionalPDFGenerator } from '@/lib/pdf/professional-pdf-generator';
import { createDataStoreFromResults } from '@/lib/valuation/data-store-factory';
import type { CalculationEngineOutput } from '@/lib/calculations/types';
import { runQualityGate } from '@/lib/validation/quality-gate';

/**
 * Build section contents Map from report_data for quality gate
 */
function buildSectionContents(reportData: Record<string, unknown>): Map<string, string> {
  const sections = new Map<string, string>();

  // Extract narrative sections
  const narrativeKeys = [
    'executive_summary',
    'company_profile',
    'financial_analysis',
    'industry_analysis',
    'risk_assessment',
    'asset_approach_analysis',
    'income_approach_analysis',
    'market_approach_analysis',
    'valuation_reconciliation',
    'strategic_insights',
  ];

  for (const key of narrativeKeys) {
    const value = reportData[key];
    if (typeof value === 'string' && value.length > 0) {
      sections.set(key, value);
    } else if (value && typeof value === 'object' && 'content' in value) {
      const content = (value as { content: string }).content;
      if (content && content.length > 0) {
        sections.set(key, content);
      }
    }
  }

  // Also check nested narratives structure
  const narratives = reportData.narratives as Record<string, unknown> | undefined;
  if (narratives) {
    for (const key of narrativeKeys) {
      if (!sections.has(key)) {
        const value = narratives[key];
        if (typeof value === 'string' && value.length > 0) {
          sections.set(key, value);
        } else if (value && typeof value === 'object' && 'content' in value) {
          const content = (value as { content: string }).content;
          if (content && content.length > 0) {
            sections.set(key, content);
          }
        }
      }
    }
  }

  return sections;
}

// Lazy-initialize Supabase client to avoid build-time errors
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
 * Generate a professional PDF report using Puppeteer
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reportId } = await params;
  const startTime = Date.now();
  console.log(`[PDF] ========================================`);
  console.log(`[PDF] PDF Generation Request Started`);
  console.log(`[PDF] Report ID: ${reportId}`);
  console.log(`[PDF] Timestamp: ${new Date().toISOString()}`);

  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    console.log(`[PDF] Auth header present: ${!!authHeader}`);

    if (!authHeader) {
      console.log(`[PDF] ❌ No authorization header`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log(`[PDF] Token length: ${token.length}`);

    const authSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    );

    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
      console.log(`[PDF] ❌ Auth failed:`, authError?.message || 'No user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log(`[PDF] ✓ User authenticated: ${user.id}`);

    // Fetch report data
    const { data: report, error: reportError } = await getSupabaseClient()
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (reportError || !report) {
      console.log(`[PDF] ❌ Report not found:`, reportError?.message || 'No report');
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    console.log(`[PDF] ✓ Report found: ${report.company_name}`);
    console.log(`[PDF] Report status: ${report.report_status}`);

    if (report.report_status !== 'completed') {
      console.log(`[PDF] ❌ Report not completed (status: ${report.report_status})`);
      return NextResponse.json({ error: 'Report not completed yet' }, { status: 400 });
    }

    // Generate PDF
    const reportData = report.report_data || {};
    console.log(`[PDF] Report data keys:`, Object.keys(reportData));
    console.log(`[PDF] Report data size: ${JSON.stringify(reportData).length} bytes`);

    // Reconstruct DataAccessor from calculation_results if available
    let accessor;
    const calcResults = report.calculation_results as CalculationEngineOutput | null;
    if (calcResults?.synthesis?.final_concluded_value) {
      try {
        const { accessor: reconstructed } = createDataStoreFromResults(calcResults, reportData as Record<string, unknown>);
        accessor = reconstructed;
        console.log(`[PDF] Reconstructed DataAccessor from calculation_results`);
      } catch (e) {
        console.warn(`[PDF] Failed to reconstruct DataAccessor:`, e);
      }
    }

    // US-027: Run quality gate before PDF generation
    if (accessor) {
      console.log(`[PDF] Running quality gate...`);
      const sectionContents = buildSectionContents(reportData);
      const rawDataString = JSON.stringify(reportData);
      const qualityResult = runQualityGate(accessor, sectionContents, rawDataString);

      console.log(`[PDF] Quality gate score: ${qualityResult.score}/100`);
      console.log(`[PDF] Quality gate canProceed: ${qualityResult.canProceed}`);

      if (!qualityResult.canProceed) {
        console.error(`[PDF] Quality gate BLOCKED PDF generation`);
        console.error(`[PDF] Blocking errors: ${qualityResult.blockingErrors.join(', ')}`);
        return NextResponse.json({
          error: 'PDF generation blocked by quality gate',
          score: qualityResult.score,
          blockingErrors: qualityResult.blockingErrors,
          warnings: qualityResult.warnings,
          categories: {
            dataIntegrity: qualityResult.categories.dataIntegrity.score,
            businessRules: qualityResult.categories.businessRules.score,
            completeness: qualityResult.categories.completeness.score,
            formatting: qualityResult.categories.formatting.score,
          },
        }, { status: 422 });
      }

      // Log warnings but proceed
      if (qualityResult.warnings.length > 0) {
        console.warn(`[PDF] Quality gate passed with ${qualityResult.warnings.length} warning(s):`);
        qualityResult.warnings.forEach(w => console.warn(`[PDF]   - ${w}`));
      }
    } else {
      console.warn(`[PDF] No DataAccessor available - skipping quality gate`);
    }

    const generatedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    console.log(`[PDF] Starting Puppeteer PDF generation...`);
    const generator = new ProfessionalPDFGenerator();
    const pdfBuffer = await generator.generate(report.company_name, reportData, generatedDate, accessor);

    const duration = Date.now() - startTime;
    console.log(`[PDF] ✓ PDF generated successfully`);
    console.log(`[PDF] PDF size: ${pdfBuffer.length} bytes`);
    console.log(`[PDF] Generation time: ${duration}ms`);
    console.log(`[PDF] ========================================`);

    // Return PDF as response
    const filename = `${report.company_name.replace(/[^a-z0-9]/gi, '_')}_Valuation_Report.pdf`;
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[PDF] ❌ Generation FAILED after ${duration}ms`);
    console.error(`[PDF] Error name: ${error.name}`);
    console.error(`[PDF] Error message: ${error.message}`);
    console.error(`[PDF] Error stack:`, error.stack);
    console.log(`[PDF] ========================================`);
    return NextResponse.json(
      { error: 'PDF generation failed', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for direct PDF download (alternative to POST)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return POST(request, { params });
}
