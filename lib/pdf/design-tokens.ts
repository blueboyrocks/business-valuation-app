/**
 * Centralized Design System Tokens
 *
 * Single source of truth for all visual styling in ValuationPro PDF reports.
 * All colors, typography, and spacing values should reference these tokens.
 */

// ─── Color Palette ───────────────────────────────────────────────────────────

export const COLORS = {
  /** Navy — primary brand color, used for headings, section headers, charts */
  primary: '#1E3A5F',
  /** Lighter navy — used in gradients alongside primary */
  primaryLight: '#2E5A8F',
  /** Gold — accent color for borders, highlights, totals */
  accent: '#C9A962',
  /** Green — positive values, growth indicators */
  positive: '#059669',
  /** Red — negative values, risk indicators */
  negative: '#DC2626',
  /** Dark gray — primary body text */
  text: '#1F2937',
  /** Medium gray — secondary/label text */
  textLight: '#6B7280',
  /** White — page background */
  background: '#FFFFFF',
  /** Light gray — alternating row, card backgrounds */
  backgroundAlt: '#F9FAFB',
  /** Light border gray — table/cell borders */
  border: '#E5E7EB',
} as const;

/** Ordered chart color palette — used for multi-series charts */
export const CHART_COLOR_PALETTE = [
  '#1E3A5F', // navy
  '#059669', // green
  '#C9A962', // gold
  '#7C3AED', // purple
  '#DC2626', // red
  '#0891B2', // cyan
] as const;

// ─── Typography ──────────────────────────────────────────────────────────────

export const TYPOGRAPHY = {
  /** Heading font stack — Merriweather serif */
  headingFont: "'Merriweather', Georgia, serif",
  /** Body font stack — Inter sans-serif */
  bodyFont: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  /** Monospace font stack — JetBrains Mono */
  monoFont: "'JetBrains Mono', 'Fira Code', monospace",
} as const;

export const FONT_SIZES = {
  h1: '28pt',
  h2: '18pt',
  h3: '14pt',
  body: '11pt',
  small: '10pt',
  xs: '9pt',
} as const;

// ─── CSS Generation ──────────────────────────────────────────────────────────

/**
 * Generates a <style> block string using the design tokens.
 * This provides CSS custom properties (variables) that can be referenced
 * throughout the PDF HTML, plus base data-table styling classes.
 */
export function generateDesignTokenCSS(): string {
  return `
    /* ── Design System Custom Properties ── */
    :root {
      --color-primary: ${COLORS.primary};
      --color-primary-light: ${COLORS.primaryLight};
      --color-accent: ${COLORS.accent};
      --color-positive: ${COLORS.positive};
      --color-negative: ${COLORS.negative};
      --color-text: ${COLORS.text};
      --color-text-light: ${COLORS.textLight};
      --color-background: ${COLORS.background};
      --color-background-alt: ${COLORS.backgroundAlt};
      --color-border: ${COLORS.border};

      --font-heading: ${TYPOGRAPHY.headingFont};
      --font-body: ${TYPOGRAPHY.bodyFont};
      --font-mono: ${TYPOGRAPHY.monoFont};

      --font-size-h1: ${FONT_SIZES.h1};
      --font-size-h2: ${FONT_SIZES.h2};
      --font-size-h3: ${FONT_SIZES.h3};
      --font-size-body: ${FONT_SIZES.body};
      --font-size-small: ${FONT_SIZES.small};
      --font-size-xs: ${FONT_SIZES.xs};
    }

    /* ── Professional Data Table Styles ── */
    .data-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin: 20px 0;
      font-size: ${FONT_SIZES.small};
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }

    .data-table thead {
      background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryLight} 100%);
      color: white;
    }

    .data-table th {
      padding: 10px 14px;
      text-align: left;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-size: ${FONT_SIZES.xs};
    }

    .data-table td {
      padding: 10px 14px;
      border-bottom: 1px solid ${COLORS.border};
    }

    .data-table tbody tr:nth-child(even) {
      background: ${COLORS.backgroundAlt};
    }

    .data-table .total-row {
      background: #FEF3C7;
      font-weight: 600;
    }

    .data-table td.currency {
      text-align: right;
      font-family: ${TYPOGRAPHY.monoFont};
    }

    .data-table td.percentage {
      text-align: right;
    }
  `;
}
