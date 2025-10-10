/**
 * @fileoverview SVG Import and Canvas Conversion
 * @author @darianrosebrook
 */

import { SVGParser } from './parser.js';
import { SVGConverter } from './converter.js';
import { TokenMatcher } from './token-matcher.js';
import { DesignTokens, validateTokens, defaultTokens } from '@paths-design/design-tokens';
import {
  SVGImportOptions,
  SVGImportResult,
  ImportProgress,
  ImportWarning,
  ImportStats,
  DEFAULT_SECURITY_POLICY
} from './types.js';

/**
 * Main SVG import engine
 */
export class SVGImportEngine {
  private parser: SVGParser;
  private converter: SVGConverter;

  constructor(options: { securityPolicy?: typeof DEFAULT_SECURITY_POLICY } = {}) {
    this.parser = new SVGParser(options.securityPolicy);
    this.converter = new SVGConverter();
  }

  /**
   * Import SVG content and convert to canvas nodes
   */
  async import(svgContent: string, options: SVGImportOptions = {}): Promise<SVGImportResult> {
    const startTime = Date.now();
    const warnings: ImportWarning[] = [];

    // Validate options
    const {
      enableTokenMatching = true,
      tokenMatchThreshold = 0.8,
      onProgress,
      onWarning
    } = options;

    // Set up warning callback
    const warningCallback = (warning: ImportWarning) => {
      warnings.push(warning);
      onWarning?.(warning);
    };

    try {
      // Phase 1: Parse SVG
      onProgress?.({ phase: 'parsing', percentage: 10, message: 'Parsing SVG content' });
      const { document, warnings: parseWarnings } = this.parser.parse(svgContent);
      parseWarnings.forEach(warningCallback);

      // Phase 2: Convert to canvas nodes
      onProgress?.({ phase: 'converting', percentage: 50, message: 'Converting to canvas nodes' });
      const { nodes, warnings: convertWarnings } = this.converter.convert(document);
      convertWarnings.forEach(warningCallback);

      // Phase 3: Token matching
      let tokenMatches: any[] = [];
      if (enableTokenMatching && nodes.length > 0) {
        onProgress?.({ phase: 'optimizing', percentage: 80, message: 'Matching design tokens' });
        tokenMatches = await this.performTokenMatching(svgContent, tokenMatchThreshold);
      }

      // Phase 4: Complete
      onProgress?.({ phase: 'complete', percentage: 100, message: 'Import complete' });

      const stats: ImportStats = {
        elementsProcessed: this.countElements(document),
        elementsConverted: nodes.length,
        pathOptimizationSavings: 0, // TODO: Implement path optimization
        durationMs: Date.now() - startTime
      };

      return {
        nodes,
        tokenMatches,
        warnings,
        stats
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      warningCallback({
        type: 'security_issue',
        message: `Import failed: ${errorMessage}`,
        suggestion: 'Check SVG validity and try again'
      });

      return {
        nodes: [],
        tokenMatches: [],
        warnings,
        stats: {
          elementsProcessed: 0,
          elementsConverted: 0,
          pathOptimizationSavings: 0,
          durationMs: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Perform token matching on SVG colors
   */
  private async performTokenMatching(svgContent: string, threshold: number): Promise<any[]> {
    try {
      // Extract colors from SVG
      const colors = TokenMatcher.extractColors(svgContent);

      // Get design tokens (simplified - would load from actual token files)
      const tokens = await this.loadDesignTokens();
      const validation = validateTokens(tokens);
      return validation.valid ? tokens : defaultTokens;

      // Match colors to tokens
      const matcher = new TokenMatcher(tokens, threshold);
      return matcher.matchColors(colors);
    } catch (error) {
      // If token matching fails, continue without it
      return [];
    }
  }

  /**
   * Load design tokens (placeholder implementation)
   */
  private async loadDesignTokens(): Promise<DesignTokens> {
    // TODO: Load actual design tokens from files
    // For now, return a basic token set matching the schema
    return {
      color: {
        background: {
          primary: '#4F46E5',
          secondary: '#6B7280',
          tertiary: '#9CA3AF',
          surface: '#FFFFFF',
          elevated: '#F9FAFB'
        },
        text: {
          primary: '#1F2937',
          secondary: '#6B7280',
          tertiary: '#9CA3AF',
          inverse: '#FFFFFF'
        },
        border: {
          subtle: '#E5E7EB',
          default: '#D1D5DB',
          strong: '#9CA3AF'
        },
        interactive: {
          primary: { default: '#4F46E5', hover: '#3730A3', pressed: '#1E1B4B' },
          secondary: { default: '#6B7280', hover: '#4B5563', pressed: '#374151' },
          danger: { default: '#EF4444', hover: '#DC2626', pressed: '#B91C1C' }
        },
        semantic: {
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6'
        }
      }
    };
  }

  /**
   * Count elements in SVG document
   */
  private countElements(document: Document): number {
    return document.getElementsByTagName('*').length;
  }
}

/**
 * Convenience function for SVG import
 */
export async function importSVG(svgContent: string, options?: SVGImportOptions): Promise<SVGImportResult> {
  const engine = new SVGImportEngine();
  return engine.import(svgContent, options);
}

// Re-export types
export type {
  SVGImportOptions,
  SVGImportResult,
  ImportProgress,
  ImportWarning,
  ImportStats,
  CanvasNode,
  VectorNode,
  GroupNode,
  TextNode,
  TokenMatch
} from './types.js';

// Re-export classes
export { SVGParser } from './parser.js';
export { SVGConverter } from './converter.js';
export { TokenMatcher } from './token-matcher.js';
