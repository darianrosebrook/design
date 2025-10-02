/**
 * @fileoverview Manual resolver - requires human intervention
 * @author @darianrosebrook
 */

import type { Conflict, MergeContext } from "../types.js";
import {
  ResolutionStrategy,
  STRATEGY_CONFIDENCE,
  type MergeResolution,
} from "../types.js";

/**
 * Resolver that marks conflicts as requiring manual review
 */
export class ManualResolver {
  canResolve(conflict: Conflict): boolean {
    // This resolver can handle any conflict type
    return true;
  }

  resolve(conflict: Conflict, context: MergeContext): MergeResolution {
    return {
      conflict,
      strategy: ResolutionStrategy.MANUAL,
      resolvedValue: conflict.baseValue, // Keep base as fallback
      confidence: STRATEGY_CONFIDENCE[ResolutionStrategy.MANUAL],
      requiresReview: true,
      explanation: "This conflict requires human judgment to resolve",
      applied: false,
    };
  }
}
