/**
 * @fileoverview Merge resolution types and interfaces
 * @author @darianrosebrook
 */

import type { CanvasDocumentType } from "../types.js";
import type { Conflict } from "../types.js";

export type { Conflict };

/**
 * Resolution strategies for different conflict types
 */
export enum ResolutionStrategy {
  PREFER_LOCAL = "prefer-local",
  PREFER_REMOTE = "prefer-remote",
  PREFER_BASE = "prefer-base",
  MANUAL = "manual",
  AVERAGE = "average", // For numeric values
  MERGE = "merge", // For additive changes
}

/**
 * Result of resolving a single conflict
 */
export interface MergeResolution {
  conflict: Conflict;
  strategy: ResolutionStrategy;
  resolvedValue: unknown;
  confidence: number; // 0-1, how confident we are in this resolution
  requiresReview: boolean;
  explanation: string;
  applied: boolean; // Whether this resolution was actually applied
}

/**
 * Context for merge resolution operations
 */
export interface MergeContext {
  base: CanvasDocumentType;
  local: CanvasDocumentType;
  remote: CanvasDocumentType;
  target: "local" | "remote"; // Which document to apply resolutions to
}

/**
 * Result of the overall merge resolution process
 */
export interface MergeResult {
  success: boolean;
  resolvedDocument: CanvasDocumentType;
  resolutions: MergeResolution[];
  unresolvedConflicts: MergeResolution[];
  confidence: number; // Overall confidence in the merge
  needsManualReview: boolean;
}

/**
 * Options for merge resolution behavior
 */
export interface MergeResolutionOptions {
  autoResolve?: boolean;
  maxAutoResolveConfidence?: number; // 0-1, minimum confidence to auto-resolve
  resolutionStrategies?: Partial<Record<string, ResolutionStrategy>>;
  onConflict?: (
    conflict: Conflict,
    context: MergeContext
  ) => ResolutionStrategy;
  failOnUnresolved?: boolean;
}

/**
 * Default merge resolution options
 */
export const DEFAULT_MERGE_OPTIONS: Required<MergeResolutionOptions> = {
  autoResolve: true,
  maxAutoResolveConfidence: 0.7,
  resolutionStrategies: {
    "S-ORDER": ResolutionStrategy.PREFER_LOCAL,
    "M-NAME": ResolutionStrategy.PREFER_REMOTE,
    "P-VISIBILITY": ResolutionStrategy.PREFER_LOCAL,
  },
  onConflict: () => ResolutionStrategy.MANUAL,
  failOnUnresolved: false,
};

/**
 * Interface for conflict resolvers
 */
export interface ConflictResolver {
  canResolve(conflict: Conflict): boolean;
  resolve(conflict: Conflict, context: MergeContext): MergeResolution;
}

/**
 * Resolution strategy mapping for different conflict types
 */
export const CONFLICT_TYPE_STRATEGIES: Record<string, ResolutionStrategy> = {
  // Auto-resolvable conflicts
  "S-ORDER": ResolutionStrategy.PREFER_LOCAL,
  "M-NAME": ResolutionStrategy.PREFER_REMOTE,
  "P-VISIBILITY": ResolutionStrategy.PREFER_LOCAL,

  // Manual resolution required
  "S-DEL-MOD": ResolutionStrategy.MANUAL,
  "S-ADD-ADD": ResolutionStrategy.MANUAL,
  "S-MOVE-MOVE": ResolutionStrategy.MANUAL,
  "P-GEOMETRY": ResolutionStrategy.MANUAL,
  "P-LAYOUT": ResolutionStrategy.MANUAL,
  "P-STYLE": ResolutionStrategy.MANUAL,
  "C-TEXT": ResolutionStrategy.MANUAL,
  "C-COMPONENT-PROPS": ResolutionStrategy.MANUAL,
};

/**
 * Confidence levels for different resolution strategies
 */
export const STRATEGY_CONFIDENCE: Record<ResolutionStrategy, number> = {
  [ResolutionStrategy.PREFER_LOCAL]: 0.7,
  [ResolutionStrategy.PREFER_REMOTE]: 0.8,
  [ResolutionStrategy.PREFER_BASE]: 0.6,
  [ResolutionStrategy.MANUAL]: 0.0,
  [ResolutionStrategy.AVERAGE]: 0.6,
  [ResolutionStrategy.MERGE]: 0.5,
};
