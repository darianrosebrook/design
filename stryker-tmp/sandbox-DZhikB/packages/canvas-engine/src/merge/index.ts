/**
 * @fileoverview Merge functionality exports
 * @author @darianrosebrook
 */

// Export types
export type {
  CanvasDocumentType,
  NodeType,
  NodeSnapshot,
  NodeIndex,
  Conflict,
} from "./types.js";

// Export utilities
export {
  buildNodeIndex,
  formatPath,
  sortConflicts,
  generateConflictId,
} from "./utils.js";

// Export conflict detector
export {
  detectConflicts,
  ConflictDetectorContext,
} from "./conflict-detector.js";

// Export diff engine
export type {
  DiffOperation,
  DiffOperationType,
  DiffResult,
  DiffOptions,
  NodeChange,
  PropertyDiff,
  DocumentPair,
  NodePair,
  DiffComparator,
  NodeFilter,
} from "./diff/index.js";

export {
  SemanticDiffEngine,
  diffDocuments,
  DEFAULT_DIFF_OPTIONS,
} from "./diff/index.js";

// Export resolution engine
export type {
  MergeResolution,
  MergeContext,
  MergeResult,
  MergeResolutionOptions,
  ConflictResolver,
} from "./resolution/index.js";

export {
  MergeResolutionEngine,
  resolveMergeConflicts,
  canAutoResolve,
  ResolutionStrategy,
  DEFAULT_MERGE_OPTIONS,
  CONFLICT_TYPE_STRATEGIES,
  STRATEGY_CONFIDENCE,
} from "./resolution/index.js";
