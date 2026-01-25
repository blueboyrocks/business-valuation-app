/**
 * CitationManager - Source Reference Management
 *
 * Manages citations and references throughout valuation reports to ensure
 * professional credibility and verifiable sources for all claims.
 *
 * Key features:
 * - Standard industry sources pre-configured
 * - Inline citation formatting [BBS-2025]
 * - Bibliography generation
 * - Citation completeness validation
 *
 * CRITICAL: Premium reports require minimum 10 citations across source types
 */

// ============ TYPES ============

export type CitationSourceType =
  | 'market_data'
  | 'financial_benchmark'
  | 'valuation_guide'
  | 'academic'
  | 'tax_data'
  | 'industry_report'
  | 'government'
  | 'proprietary';

export interface CitationSource {
  code: string;
  name: string;
  type: CitationSourceType;
  publisher?: string;
  url?: string;
  description?: string;
}

export interface Citation {
  inline: string;
  source_code: string;
  year: number;
  context: string;
  page?: string;
  section?: string;
  full_reference?: string;
}

export interface CitationOptions {
  page?: string;
  section?: string;
  position?: number;
}

export interface CitationValidationOptions {
  minimum_citations?: number;
  required_source_types?: CitationSourceType[];
}

export interface CitationValidationResult {
  valid: boolean;
  citation_count: number;
  error?: string;
  warnings?: string[];
  missing_source_types?: CitationSourceType[];
}

export interface CitationCoverage {
  market_data: boolean;
  financial_benchmark: boolean;
  valuation_guide: boolean;
  academic: boolean;
  tax_data: boolean;
  industry_report: boolean;
  government: boolean;
  proprietary: boolean;
}

// ============ STANDARD SOURCES ============

export const StandardSources: CitationSource[] = [
  {
    code: 'BBS',
    name: 'BizBuySell',
    type: 'market_data',
    publisher: 'BizBuySell, Inc.',
    url: 'https://www.bizbuysell.com/insight-report/',
    description: 'Business transaction data and market trends',
  },
  {
    code: 'RMA',
    name: 'RMA Annual Statement Studies',
    type: 'financial_benchmark',
    publisher: 'Risk Management Association',
    url: 'https://www.rmahq.org/annual-statement-studies/',
    description: 'Industry financial ratio benchmarks',
  },
  {
    code: 'BRG',
    name: 'Business Reference Guide',
    type: 'valuation_guide',
    publisher: 'Business Brokerage Press',
    description: 'Industry pricing rules and valuation multiples',
  },
  {
    code: 'NYU',
    name: 'NYU Stern School of Business',
    type: 'academic',
    publisher: 'New York University',
    url: 'https://pages.stern.nyu.edu/~adamodar/',
    description: 'Cost of capital and valuation data',
  },
  {
    code: 'IRS',
    name: 'IRS Tax Return Data',
    type: 'tax_data',
    publisher: 'Internal Revenue Service',
    url: 'https://www.irs.gov/',
    description: 'Company tax filings and financial data',
  },
  {
    code: 'IBIS',
    name: 'IBISWorld Industry Reports',
    type: 'industry_report',
    publisher: 'IBISWorld',
    url: 'https://www.ibisworld.com/',
    description: 'Industry analysis and market research',
  },
  {
    code: 'BEA',
    name: 'Bureau of Economic Analysis',
    type: 'government',
    publisher: 'U.S. Department of Commerce',
    url: 'https://www.bea.gov/',
    description: 'Economic statistics and GDP data',
  },
  {
    code: 'SBA',
    name: 'Small Business Administration',
    type: 'government',
    publisher: 'U.S. Small Business Administration',
    url: 'https://www.sba.gov/',
    description: 'Small business statistics and resources',
  },
  {
    code: 'PRATT',
    name: "Pratt's Stats",
    type: 'market_data',
    publisher: 'Business Valuation Resources',
    url: 'https://www.bvresources.com/pratts-stats',
    description: 'Private company transaction database',
  },
  {
    code: 'DM',
    name: 'DealStats (formerly Done Deals)',
    type: 'market_data',
    publisher: 'Business Valuation Resources',
    url: 'https://www.bvresources.com/dealstats',
    description: 'M&A transaction database',
  },
];

// ============ CITATION MANAGER CLASS ============

export class CitationManager {
  private sources: Map<string, CitationSource>;
  private citations: Map<string, Citation>; // Key: "CODE-YEAR"

  constructor() {
    this.sources = new Map();
    this.citations = new Map();

    // Initialize with standard sources
    for (const source of StandardSources) {
      this.sources.set(source.code, source);
    }
  }

  /**
   * Get a source by its code
   */
  getSource(code: string): CitationSource | undefined {
    return this.sources.get(code);
  }

  /**
   * Get all available sources
   */
  getAllSources(): CitationSource[] {
    return Array.from(this.sources.values());
  }

  /**
   * Add a custom citation source
   */
  addSource(source: CitationSource): void {
    this.sources.set(source.code, source);
  }

  /**
   * Create a citation for a source
   */
  cite(
    sourceCode: string,
    year: number,
    context: string,
    options?: CitationOptions
  ): Citation {
    const key = `${sourceCode}-${year}`;
    const source = this.sources.get(sourceCode);

    // Build inline citation
    let inline = `[${key}`;
    if (options?.page) {
      inline += `, pp. ${options.page}`;
    } else if (options?.section) {
      inline += `, ${options.section}`;
    }
    inline += ']';

    // Build full reference
    let fullReference = '';
    if (source) {
      fullReference = `${source.name}. ${year}. ${source.publisher || ''}`;
      if (source.url) {
        fullReference += ` ${source.url}`;
      }
    }

    const citation: Citation = {
      inline,
      source_code: sourceCode,
      year,
      context,
      page: options?.page,
      section: options?.section,
      full_reference: fullReference,
    };

    // Store unique citations (by source+year)
    if (!this.citations.has(key)) {
      this.citations.set(key, citation);
    }

    return citation;
  }

  /**
   * Get all citations used
   */
  getAllCitations(): Citation[] {
    return Array.from(this.citations.values());
  }

  /**
   * Insert citation into text
   */
  insertCitation(
    text: string,
    sourceCode: string,
    year: number,
    context: string,
    options?: CitationOptions
  ): string {
    const citation = this.cite(sourceCode, year, context, options);

    if (options?.position !== undefined && options.position < text.length) {
      // Insert at specific position
      const before = text.slice(0, options.position);
      const after = text.slice(options.position);
      return `${before} ${citation.inline}${after}`;
    }

    // Append to end
    return `${text} ${citation.inline}`;
  }

  /**
   * Generate bibliography from used citations
   */
  generateBibliography(): string {
    const citations = this.getAllCitations();

    if (citations.length === 0) {
      return '## Sources and References\n\nNo citations recorded.';
    }

    // Sort alphabetically by source code
    citations.sort((a, b) => a.source_code.localeCompare(b.source_code));

    let bibliography = '## Sources and References\n\n';

    for (const citation of citations) {
      const source = this.sources.get(citation.source_code);
      const key = `[${citation.source_code}-${citation.year}]`;

      if (source) {
        bibliography += `${key} ${source.name}. (${citation.year}). `;
        if (source.publisher) {
          bibliography += `${source.publisher}. `;
        }
        if (source.url) {
          bibliography += `${source.url}`;
        }
        bibliography += '\n\n';
      } else {
        bibliography += `${key} (${citation.year})\n\n`;
      }
    }

    return bibliography.trim();
  }

  /**
   * Validate citations in text
   */
  validateCitations(
    text: string,
    options?: CitationValidationOptions
  ): CitationValidationResult {
    const warnings: string[] = [];

    // Find all citations in text using regex
    const citationPattern = /\[([A-Z]+)-(\d{4})(?:,\s*[^\]]+)?\]/g;
    const foundCitations: string[] = [];
    let match;

    while ((match = citationPattern.exec(text)) !== null) {
      const code = match[1];
      const year = match[2];
      const key = `${code}-${year}`;
      foundCitations.push(key);

      // Check if citation is registered
      if (!this.sources.has(code) && !this.citations.has(key)) {
        warnings.push(`Unregistered citation found: [${key}]`);
      }
    }

    const citationCount = foundCitations.length;
    const minimumCitations = options?.minimum_citations || 0;

    // Check minimum citation requirement
    if (citationCount < minimumCitations) {
      return {
        valid: false,
        citation_count: citationCount,
        error: `Found ${citationCount} citations, but minimum ${minimumCitations} required`,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    }

    // Check required source types
    if (options?.required_source_types && options.required_source_types.length > 0) {
      const usedSourceTypes = new Set<CitationSourceType>();

      for (const citation of Array.from(this.citations.values())) {
        const source = this.sources.get(citation.source_code);
        if (source) {
          usedSourceTypes.add(source.type);
        }
      }

      const missingTypes = options.required_source_types.filter(
        (type) => !usedSourceTypes.has(type)
      );

      if (missingTypes.length > 0) {
        return {
          valid: false,
          citation_count: citationCount,
          error: `Missing required source types: ${missingTypes.join(', ')}`,
          missing_source_types: missingTypes,
          warnings: warnings.length > 0 ? warnings : undefined,
        };
      }
    }

    return {
      valid: true,
      citation_count: citationCount,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Create citation for SDE multiple claim
   */
  citeSDEMultiple(industry: string, multiple: number): Citation {
    return this.cite(
      'BRG',
      new Date().getFullYear(),
      `SDE multiple of ${multiple}x for ${industry}`
    );
  }

  /**
   * Create citation for industry financial data
   */
  citeIndustryFinancials(naicsCode: string): Citation {
    return this.cite(
      'RMA',
      new Date().getFullYear(),
      `Industry financial benchmarks for NAICS ${naicsCode}`
    );
  }

  /**
   * Create citation for cost of capital data
   */
  citeCostOfCapital(): Citation {
    return this.cite(
      'NYU',
      new Date().getFullYear(),
      'Cost of capital and discount rate data'
    );
  }

  /**
   * Get citation coverage by source type
   */
  getCitationCoverage(): CitationCoverage {
    const coverage: CitationCoverage = {
      market_data: false,
      financial_benchmark: false,
      valuation_guide: false,
      academic: false,
      tax_data: false,
      industry_report: false,
      government: false,
      proprietary: false,
    };

    for (const citation of Array.from(this.citations.values())) {
      const source = this.sources.get(citation.source_code);
      if (source && source.type in coverage) {
        coverage[source.type as keyof CitationCoverage] = true;
      }
    }

    return coverage;
  }

  /**
   * Convert citation to HTML link
   */
  citationToHTML(citation: Citation): string {
    const source = this.sources.get(citation.source_code);
    const text = citation.inline;

    if (source?.url) {
      return `<a href="${source.url}" title="${source.name}">${text}</a>`;
    }

    return `<span class="citation" title="${source?.name || citation.source_code}">${text}</span>`;
  }

  /**
   * Generate bibliography as HTML
   */
  generateBibliographyHTML(): string {
    const citations = this.getAllCitations();

    if (citations.length === 0) {
      return '<div class="bibliography"><h2>Sources and References</h2><p>No citations recorded.</p></div>';
    }

    // Sort alphabetically by source code
    citations.sort((a, b) => a.source_code.localeCompare(b.source_code));

    let html = '<div class="bibliography">\n';
    html += '<h2>Sources and References</h2>\n';
    html += '<ul class="citation-list">\n';

    for (const citation of citations) {
      const source = this.sources.get(citation.source_code);
      const key = `[${citation.source_code}-${citation.year}]`;

      html += '<li>';
      html += `<strong>${key}</strong> `;

      if (source) {
        if (source.url) {
          html += `<a href="${source.url}">${source.name}</a>. `;
        } else {
          html += `${source.name}. `;
        }
        html += `(${citation.year}). `;
        if (source.publisher) {
          html += `${source.publisher}.`;
        }
      } else {
        html += `(${citation.year})`;
      }

      html += '</li>\n';
    }

    html += '</ul>\n';
    html += '</div>';

    return html;
  }

  /**
   * Clear all recorded citations (for testing or new reports)
   */
  reset(): void {
    this.citations.clear();
  }
}

// ============ FACTORY FUNCTION ============

/**
 * Create a new CitationManager
 */
export function createCitationManager(): CitationManager {
  return new CitationManager();
}
