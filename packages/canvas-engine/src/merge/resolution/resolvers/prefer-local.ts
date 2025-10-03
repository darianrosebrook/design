/**
 * @fileoverview Prefer local resolver - chooses local changes over remote
 * @author @darianrosebrook
 */

import type { Conflict, MergeContext, MergeResolution } from "../types.js";
import { ResolutionStrategy, STRATEGY_CONFIDENCE } from "../types.js";

/**
 * Resolver that prefers local changes over remote changes
 */
export class PreferLocalResolver {
  canResolve(_conflict: Conflict): boolean {
    // This resolver can handle any conflict type
    return true;
  }

  resolve(conflict: Conflict, _context: MergeContext): MergeResolution {
    return {
      conflict,
      strategy: ResolutionStrategy.PREFER_LOCAL,
      resolvedValue: conflict.localValue,
      confidence: STRATEGY_CONFIDENCE[ResolutionStrategy.PREFER_LOCAL],
      requiresReview: false,
      explanation: "Using local changes as they represent current workflow",
      applied: true,
    };
  }
}
