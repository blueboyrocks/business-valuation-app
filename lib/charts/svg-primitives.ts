/**
 * SVG Primitives
 * Low-level helper functions that return SVG element markup strings.
 * Used by chart generators to compose complete inline SVG charts for PDF reports.
 */

import { CHART_COLORS, CHART_FONTS } from './theme';

// ============ OPTION INTERFACES ============

export interface RectOptions {
  rx?: number;
  opacity?: number;
  stroke?: string;
  strokeWidth?: number;
}

export interface LineOptions {
  strokeWidth?: number;
  dashArray?: string;
}

export interface TextOptions {
  fontSize?: number;
  fill?: string;
  anchor?: 'start' | 'middle' | 'end';
  fontWeight?: 'normal' | 'bold' | '500' | '600' | '700';
  dominantBaseline?: string;
  transform?: string;
}

// ============ PRIMITIVE FUNCTIONS ============

/**
 * Generate an SVG rectangle element.
 */
export function rect(
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  opts?: RectOptions
): string {
  const rx = opts?.rx ?? 0;
  const opacity = opts?.opacity !== undefined ? ` opacity="${opts.opacity}"` : '';
  const stroke = opts?.stroke ? ` stroke="${opts.stroke}" stroke-width="${opts.strokeWidth ?? 1}"` : '';
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" rx="${rx}"${opacity}${stroke}/>`;
}

/**
 * Generate an SVG line element.
 */
export function line(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  stroke: string,
  opts?: LineOptions
): string {
  const sw = opts?.strokeWidth ?? 1;
  const dash = opts?.dashArray ? ` stroke-dasharray="${opts.dashArray}"` : '';
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw}"${dash}/>`;
}

/**
 * Generate an SVG text element.
 */
export function text(
  x: number,
  y: number,
  content: string,
  opts?: TextOptions
): string {
  const fontSize = opts?.fontSize ?? CHART_FONTS.labelSize;
  const fill = opts?.fill ?? CHART_COLORS.text;
  const anchor = opts?.anchor ?? 'start';
  const fontWeight = opts?.fontWeight ? ` font-weight="${opts.fontWeight}"` : '';
  const baseline = opts?.dominantBaseline ? ` dominant-baseline="${opts.dominantBaseline}"` : '';
  const transform = opts?.transform ? ` transform="${opts.transform}"` : '';
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${fontSize}" fill="${fill}"${fontWeight}${baseline}${transform}>${escapeXml(content)}</text>`;
}

/**
 * Generate an SVG circle element.
 */
export function circle(cx: number, cy: number, r: number, fill: string): string {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
}

/**
 * Generate an SVG path element.
 */
export function path(d: string, fill: string, stroke?: string, strokeWidth?: number): string {
  const strokeAttr = stroke ? ` stroke="${stroke}" stroke-width="${strokeWidth ?? 2}"` : '';
  return `<path d="${d}" fill="${fill}"${strokeAttr}/>`;
}

/**
 * Generate a vertical Y-axis line.
 */
export function yAxis(x: number, yStart: number, yEnd: number): string {
  return line(x, yStart, x, yEnd, CHART_COLORS.grid);
}

/**
 * Generate a horizontal X-axis line.
 */
export function xAxis(y: number, xStart: number, xEnd: number): string {
  return line(xStart, y, xEnd, y, CHART_COLORS.grid);
}

/**
 * Generate a set of evenly-spaced horizontal grid lines.
 * @param count Number of grid lines (excluding bottom axis)
 * @param xStart Left edge x coordinate
 * @param xEnd Right edge x coordinate
 * @param yStart Top y coordinate (first grid line)
 * @param yEnd Bottom y coordinate (last grid line / axis)
 */
export function gridLines(
  count: number,
  xStart: number,
  xEnd: number,
  yStart: number,
  yEnd: number
): string {
  if (count <= 0) return '';
  const lines: string[] = [];
  for (let i = 0; i <= count; i++) {
    const y = yStart + ((yEnd - yStart) * i) / count;
    lines.push(
      line(xStart, y, xEnd, y, CHART_COLORS.grid, { strokeWidth: 0.5, dashArray: '3,3' })
    );
  }
  return lines.join('\n');
}

/**
 * Wrap SVG content in a complete <svg> element with xmlns and default font-family.
 */
export function svgWrapper(width: number, height: number, content: string): string {
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" style="font-family: ${CHART_FONTS.family};">\n${content}\n</svg>`;
}

// ============ INTERNAL HELPERS ============

/**
 * Escape special XML characters in text content.
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
