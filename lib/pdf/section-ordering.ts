/**
 * Professional Section Ordering for PDF Reports
 *
 * Defines the canonical order of sections in generated business valuation PDFs.
 * All PDF generation and TOC rendering should reference this ordering.
 */

export interface SectionDefinition {
  readonly key: string;
  readonly displayName: string;
  readonly estimatedPages: number;
}

/**
 * Professional section order constant.
 * Defines the 18 sections in canonical rendering order.
 * Cover page and TOC are implicit (always first two) and not included here.
 */
export const PROFESSIONAL_SECTION_ORDER: readonly SectionDefinition[] = [
  { key: 'executiveSummary', displayName: 'Executive Summary', estimatedPages: 3 },
  { key: 'conclusionOfValue', displayName: 'Conclusion of Value', estimatedPages: 2 },
  { key: 'companyProfile', displayName: 'Company Profile', estimatedPages: 2 },
  { key: 'industryAnalysis', displayName: 'Industry Analysis', estimatedPages: 2 },
  { key: 'financialAnalysis', displayName: 'Financial Analysis', estimatedPages: 2 },
  { key: 'financialSummary', displayName: 'Financial Summary', estimatedPages: 2 },
  { key: 'sdeCalculationTable', displayName: 'SDE Calculation Detail', estimatedPages: 1 },
  { key: 'financialTrends', displayName: 'Financial Performance Trends', estimatedPages: 1 },
  { key: 'assetApproach', displayName: 'Asset Approach', estimatedPages: 2 },
  { key: 'incomeApproach', displayName: 'Income Approach', estimatedPages: 2 },
  { key: 'capRateBuildupTable', displayName: 'Cap Rate Buildup', estimatedPages: 1 },
  { key: 'marketApproach', displayName: 'Market Approach', estimatedPages: 2 },
  { key: 'valuationReconciliation', displayName: 'Valuation Reconciliation', estimatedPages: 2 },
  { key: 'riskAssessment', displayName: 'Risk Assessment', estimatedPages: 2 },
  { key: 'keyPerformanceIndicators', displayName: 'Key Performance Indicators', estimatedPages: 2 },
  { key: 'strategicInsights', displayName: 'Strategic Insights', estimatedPages: 2 },
  { key: 'assumptionsAndConditions', displayName: 'Assumptions & Limiting Conditions', estimatedPages: 2 },
  { key: 'sourcesAndReferences', displayName: 'Sources and References', estimatedPages: 1 },
] as const;

/**
 * Returns an ordered array of section entries from a section map,
 * following the professional section order. Only includes sections
 * that are present (truthy) in the input map.
 *
 * @param sectionMap - Map of section key to content (string or boolean indicating presence)
 * @returns Ordered array of { key, displayName, content } for present sections
 */
export function getOrderedSections(
  sectionMap: Map<string, string | boolean>
): Array<{ key: string; displayName: string; content: string | boolean }> {
  const ordered: Array<{ key: string; displayName: string; content: string | boolean }> = [];

  for (const section of PROFESSIONAL_SECTION_ORDER) {
    const content = sectionMap.get(section.key);
    if (content) {
      ordered.push({
        key: section.key,
        displayName: section.displayName,
        content,
      });
    }
  }

  return ordered;
}

/**
 * Approximate words per page for content-based page estimation.
 * A typical PDF page with 11pt body text, margins, and some headings/tables
 * holds approximately 350 words of narrative content. Sections with charts
 * or tables have lower effective word density.
 */
const WORDS_PER_PAGE = 350;

/**
 * Minimum pages per section (even short sections take at least 1 page
 * due to page-break-before styling).
 */
const MIN_PAGES_PER_SECTION = 1;

/**
 * Strips HTML tags from content and counts words.
 */
function countContentWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return 0;
  return text.split(' ').length;
}

/**
 * Estimates the number of pages a section will occupy based on its content length.
 * Falls back to the static estimatedPages value when no content is provided.
 */
function estimatePages(section: SectionDefinition, content?: string): number {
  if (!content) {
    return section.estimatedPages;
  }
  const words = countContentWords(content);
  const estimated = Math.ceil(words / WORDS_PER_PAGE);
  return Math.max(MIN_PAGES_PER_SECTION, estimated);
}

/**
 * Generates TOC items with estimated page numbers based on which sections
 * are present. Cover page is page 1, TOC is page 2, content starts at page 3.
 *
 * When sectionContents is provided, page numbers are estimated from actual
 * content length (word count). Otherwise, static estimatedPages values are used.
 *
 * @param presentSectionKeys - Set of section keys that are present in the report
 * @param sectionContents - Optional map of section key to HTML content for dynamic page estimation
 * @returns Array of { displayName, pageNumber, key, sectionNumber } for TOC rendering
 */
export function generateTocEntries(
  presentSectionKeys: Set<string>,
  sectionContents?: Map<string, string>
): Array<{ displayName: string; pageNumber: number; key: string; sectionNumber: number }> {
  const entries: Array<{ displayName: string; pageNumber: number; key: string; sectionNumber: number }> = [];
  let pageNum = 3; // Page 1: Cover, Page 2: TOC
  let sectionNum = 1;

  for (const section of PROFESSIONAL_SECTION_ORDER) {
    if (presentSectionKeys.has(section.key)) {
      entries.push({
        displayName: section.displayName,
        pageNumber: pageNum,
        key: section.key,
        sectionNumber: sectionNum,
      });
      const content = sectionContents ? sectionContents.get(section.key) : undefined;
      pageNum += estimatePages(section, content);
      sectionNum++;
    }
  }

  return entries;
}

/**
 * Returns the display name for a section key, or the key itself if not found.
 */
export function getSectionDisplayName(key: string): string {
  const section = PROFESSIONAL_SECTION_ORDER.find(s => s.key === key);
  return section ? section.displayName : key;
}
