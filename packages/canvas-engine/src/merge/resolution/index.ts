/**
 * @fileoverview Merge resolution module exports
 * @author @darianrosebrook
 */

// Export types
export type {
  MergeResolution,
  MergeContext,
  MergeResult,
  MergeResolutionOptions,
  ConflictResolver,
} from "./types.js";

export {
  ResolutionStrategy,
  DEFAULT_MERGE_OPTIONS,
  CONFLICT_TYPE_STRATEGIES,
  STRATEGY_CONFIDENCE,
} from "./types.js";

// Export engine
export {
  MergeResolutionEngine,
  resolveMergeConflicts,
  canAutoResolve,
} from "./engine.js";

// Export resolvers
export type { ConflictResolver as IConflictResolver } from "./resolvers/index.js";
export {
  PreferLocalResolver,
  PreferRemoteResolver,
  ManualResolver,
} from "./resolvers/index.js";
