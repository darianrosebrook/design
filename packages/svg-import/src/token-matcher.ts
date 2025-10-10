/**
 * @fileoverview Token matching for SVG colors
 * @author @darianrosebrook
 */

import { DesignTokens } from '@paths-design/design-tokens';
import { TokenMatch } from './types.js';

/**
 * Color distance calculation (simple RGB distance)
 */
function colorDistance(color1: string, color2: string): number {
  // Convert hex colors to RGB
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    return Infinity; // Can't compare
  }

  const dr = rgb1.r - rgb2.r;
  const dg = rgb1.g - rgb2.g;
  const db = rgb1.b - rgb2.b;

  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Normalize color format (ensure # prefix and lowercase)
 */
function normalizeColor(color: string): string {
  if (color.startsWith('#')) {
    return color.toLowerCase();
  }
  return `#${color.toLowerCase()}`;
}

/**
 * Token matcher for SVG colors
 */
export class TokenMatcher {
  private tokens: DesignTokens;
  private threshold: number;

  constructor(tokens: DesignTokens, threshold = 0.8) {
    this.tokens = tokens;
    this.threshold = threshold;
  }

  /**
   * Find token matches for colors found in SVG
   */
  matchColors(colors: string[]): TokenMatch[] {
    const matches: TokenMatch[] = [];
    const colorTokens = this.flattenColorTokens();

    for (const color of colors) {
      const normalizedColor = normalizeColor(color);
      const match = this.findBestMatch(normalizedColor, colorTokens);

      if (match && match.confidence >= this.threshold) {
        matches.push(match);
      }
    }

    return matches;
  }

  /**
   * Flatten color tokens into a searchable format
   */
  private flattenColorTokens(): Array<{ path: string; value: string }> {
    const tokens: Array<{ path: string; value: string }> = [];

    function traverse(obj: any, path: string = '') {
      if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;
          if (typeof value === 'string' && value.startsWith('#')) {
            tokens.push({ path: `tokens.color.${currentPath}`, value });
          } else if (typeof value === 'object') {
            traverse(value, currentPath);
          }
        }
      }
    }

    if (this.tokens.color) {
      traverse(this.tokens.color);
    }

    return tokens;
  }

  /**
   * Find the best token match for a color
   */
  private findBestMatch(color: string, colorTokens: Array<{ path: string; value: string }>): TokenMatch | null {
    let bestMatch: TokenMatch | null = null;
    let bestDistance = Infinity;

    for (const token of colorTokens) {
      const normalizedTokenColor = normalizeColor(token.value);
      const distance = colorDistance(color, normalizedTokenColor);

      // Perfect match
      if (distance === 0) {
        return {
          color,
          token: token.path,
          confidence: 1.0,
          locations: []
        };
      }

      // Calculate confidence based on distance (inverse relationship)
      const maxDistance = 441.67; // sqrt(255^2 * 3) - maximum possible distance
      const confidence = 1 - (distance / maxDistance);

      if (confidence > this.threshold && confidence > (bestMatch?.confidence || 0)) {
        bestMatch = {
          color,
          token: token.path,
          confidence,
          locations: []
        };
      }
    }

    return bestMatch;
  }

  /**
   * Extract all colors from SVG content
   */
  static extractColors(svgContent: string): string[] {
    const colors: Set<string> = new Set();

    // Match hex colors
    const hexRegex = /#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})/g;
    let match;
    while ((match = hexRegex.exec(svgContent)) !== null) {
      colors.add(match[0]);
    }

    // Match rgb/rgba colors
    const rgbRegex = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/g;
    while ((match = rgbRegex.exec(svgContent)) !== null) {
      const r = parseInt(match[1]);
      const g = parseInt(match[2]);
      const b = parseInt(match[3]);
      colors.add(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);
    }

    return Array.from(colors);
  }
}
