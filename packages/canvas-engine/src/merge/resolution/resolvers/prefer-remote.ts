/**
 * @fileoverview Prefer remote resolver - chooses remote changes over local
 * @author @darianrosebrook
 */

import type { Conflict, MergeContext } from "../types.js";
import {
  ResolutionStrategy,
  STRATEGY_CONFIDENCE,
  type MergeResolution,
} from "../types.js";

/**
 * Resolver that prefers remote changes over local changes
 */
export class PreferRemoteResolver {
  canResolve(conflict: Conflict): boolean {
    // This resolver can handle any conflict type
    return true;
  }

  resolve(conflict: Conflict, context: MergeContext): MergeResolution {
    return {
      conflict,
      strategy: ResolutionStrategy.PREFER_REMOTE,
      resolvedValue: conflict.remoteValue,
      confidence: STRATEGY_CONFIDENCE[ResolutionStrategy.PREFER_REMOTE],
      requiresReview: false,
      explanation: "Using remote changes as they may represent team consensus",
      applied: true,
    };
  }
}
