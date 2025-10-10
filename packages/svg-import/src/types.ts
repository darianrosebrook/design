/**
 * @fileoverview Type definitions for SVG import functionality
 * @author @darianrosebrook
 */

import { z } from 'zod';

/**
 * SVG import options
 */
export interface SVGImportOptions {
  /**
   * Maximum file size in bytes (default: 10MB)
   */
  maxFileSize?: number;

  /**
   * Enable token matching for colors
   */
  enableTokenMatching?: boolean;

  /**
   * Token confidence threshold for suggestions (0-1)
   */
  tokenMatchThreshold?: number;

  /**
   * Enable progress tracking for large files
   */
  enableProgressTracking?: boolean;

  /**
   * Callback for progress updates
   */
  onProgress?: (progress: ImportProgress) => void;

  /**
   * Callback for warnings about unsupported features
   */
  onWarning?: (warning: ImportWarning) => void;
}

/**
 * Import progress information
 */
export interface ImportProgress {
  phase: 'parsing' | 'converting' | 'optimizing' | 'complete';
  percentage: number;
  message: string;
}

/**
 * Import warning for unsupported features
 */
export interface ImportWarning {
  type: 'unsupported_feature' | 'security_issue' | 'performance_issue';
  message: string;
  element?: string;
  suggestion?: string;
}

/**
 * SVG import result
 */
export interface SVGImportResult {
  /**
   * Successfully converted canvas nodes
   */
  nodes: CanvasNode[];

  /**
   * Token matches found during import
   */
  tokenMatches: TokenMatch[];

  /**
   * Warnings about unsupported features
   */
  warnings: ImportWarning[];

  /**
   * Import statistics
   */
  stats: ImportStats;
}

/**
 * Import statistics
 */
export interface ImportStats {
  /**
   * Total SVG elements processed
   */
  elementsProcessed: number;

  /**
   * Elements successfully converted
   */
  elementsConverted: number;

  /**
   * Path optimization savings (%)
   */
  pathOptimizationSavings: number;

  /**
   * Import duration in milliseconds
   */
  durationMs: number;
}

/**
 * Token match suggestion
 */
export interface TokenMatch {
  /**
   * The color value found in SVG
   */
  color: string;

  /**
   * Suggested token reference
   */
  token: string;

  /**
   * Confidence score (0-1)
   */
  confidence: number;

  /**
   * Usage locations in the SVG
   */
  locations: string[];
}

/**
 * Canvas node types (simplified for SVG conversion)
 */
export type CanvasNode =
  | VectorNode
  | GroupNode
  | TextNode;

/**
 * Vector node for SVG paths and shapes
 */
export interface VectorNode {
  id: string;
  type: 'vector';
  name: string;
  frame: Frame;
  vectorData: VectorData;
  fills?: Fill[];
  strokes?: Stroke[];
  semanticKey?: string;
}

/**
 * Group node for SVG groups
 */
export interface GroupNode {
  id: string;
  type: 'group';
  name: string;
  frame: Frame;
  children: CanvasNode[];
  semanticKey?: string;
}

/**
 * Text node for SVG text elements
 */
export interface TextNode {
  id: string;
  type: 'text';
  name: string;
  frame: Frame;
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fills?: Fill[];
  semanticKey?: string;
}

/**
 * Frame/bounding box
 */
export interface Frame {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Vector path data
 */
export interface VectorData {
  paths: PathCommand[];
  windingRule: 'nonzero' | 'evenodd';
}

/**
 * SVG path command
 */
export interface PathCommand {
  type: 'M' | 'L' | 'C' | 'Q' | 'Z' | 'A';
  points: number[];
}

/**
 * Fill properties
 */
export interface Fill {
  type: 'solid' | 'gradient' | 'pattern';
  color?: string;
  opacity?: number;
  gradient?: Gradient;
}

/**
 * Stroke properties
 */
export interface Stroke {
  color: string;
  width: number;
  opacity?: number;
  dashPattern?: number[];
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'miter' | 'round' | 'bevel';
}

/**
 * Gradient definition
 */
export interface Gradient {
  type: 'linear' | 'radial';
  stops: GradientStop[];
  transform?: string;
}

/**
 * Gradient color stop
 */
export interface GradientStop {
  color: string;
  position: number;
  opacity?: number;
}

/**
 * SVG parsing security policy
 */
export interface SecurityPolicy {
  /**
   * Maximum file size in bytes
   */
  maxFileSize: number;

  /**
   * Maximum number of elements
   */
  maxElements: number;

  /**
   * Maximum nesting depth
   */
  maxDepth: number;

  /**
   * Forbidden elements (script, foreignObject, etc.)
   */
  forbiddenElements: string[];

  /**
   * Forbidden attributes
   */
  forbiddenAttributes: string[];
}

/**
 * Default security policy
 */
export const DEFAULT_SECURITY_POLICY: SecurityPolicy = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxElements: 10000,
  maxDepth: 50,
  forbiddenElements: [
    'script',
    'foreignObject',
    'iframe',
    'object',
    'embed',
    'form',
    'input',
    'button',
    'audio',
    'video'
  ],
  forbiddenAttributes: [
    'onload',
    'onerror',
    'onclick',
    'onmouseover',
    'href',
    'xlink:href'
  ]
};

/**
 * Zod schemas for validation
 */
export const SVGImportOptionsSchema = z.object({
  maxFileSize: z.number().optional(),
  enableTokenMatching: z.boolean().optional(),
  tokenMatchThreshold: z.number().min(0).max(1).optional(),
  enableProgressTracking: z.boolean().optional(),
  onProgress: z.function().optional(),
  onWarning: z.function().optional(),
});

export const TokenMatchSchema = z.object({
  color: z.string(),
  token: z.string(),
  confidence: z.number().min(0).max(1),
  locations: z.array(z.string()),
});

export const ImportWarningSchema = z.object({
  type: z.enum(['unsupported_feature', 'security_issue', 'performance_issue']),
  message: z.string(),
  element: z.string().optional(),
  suggestion: z.string().optional(),
});
