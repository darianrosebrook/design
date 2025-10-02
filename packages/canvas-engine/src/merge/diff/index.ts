/**
 * @fileoverview Semantic diff module exports
 * @author @darianrosebrook
 */

// Export types
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
} from "./types.js";

// Export engine
export { SemanticDiffEngine, diffDocuments } from "./engine.js";

// Export default options
export { DEFAULT_DIFF_OPTIONS } from "./types.js";
