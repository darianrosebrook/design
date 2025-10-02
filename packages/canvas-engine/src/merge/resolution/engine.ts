/**
 * @fileoverview Merge resolution engine for Designer canvas documents
 * @author @darianrosebrook
 */

import { type Conflict, type CanvasDocumentType } from "../types.js";
import {
  type MergeResolution,
  type MergeContext,
  type MergeResult,
  type MergeResolutionOptions,
  type ConflictResolver,
  ResolutionStrategy,
  DEFAULT_MERGE_OPTIONS,
  CONFLICT_TYPE_STRATEGIES,
  STRATEGY_CONFIDENCE,
} from "./types.js";
import { PreferLocalResolver } from "./resolvers/prefer-local.js";
import { PreferRemoteResolver } from "./resolvers/prefer-remote.js";
import { ManualResolver } from "./resolvers/manual.js";

/**
 * Main merge resolution engine that attempts to automatically resolve conflicts
 */
export class MergeResolutionEngine {
  private options: Required<MergeResolutionOptions>;
  private resolvers: Map<ResolutionStrategy, ConflictResolver>;

  constructor(options: MergeResolutionOptions = {}) {
    this.options = { ...DEFAULT_MERGE_OPTIONS, ...options };
    this.resolvers = new Map([
      [ResolutionStrategy.PREFER_LOCAL, new PreferLocalResolver()],
      [ResolutionStrategy.PREFER_REMOTE, new PreferRemoteResolver()],
      [ResolutionStrategy.MANUAL, new ManualResolver()],
    ]);
  }

  /**
   * Resolve conflicts in a merge operation
   */
  async resolveConflicts(
    conflicts: Conflict[],
    context: MergeContext
  ): Promise<MergeResult> {
    const resolutions: MergeResolution[] = [];

    // Resolve each conflict
    for (const conflict of conflicts) {
      const resolution = await this.resolveConflict(conflict, context);
      resolutions.push(resolution);
    }

    // Apply resolutions that can be auto-resolved
    let resolvedDocument =
      context.target === "local" ? context.local : context.remote;
    const appliedResolutions = resolutions.filter((r) => r.applied);
    const unresolvedResolutions = resolutions.filter((r) => !r.applied);

    for (const resolution of appliedResolutions) {
      resolvedDocument = this.applyResolution(resolvedDocument, resolution);
    }

    // Calculate overall confidence
    const confidence = this.calculateOverallConfidence(resolutions);

    return {
      success:
        unresolvedResolutions.length === 0 || !this.options.failOnUnresolved,
      resolvedDocument,
      resolutions,
      unresolvedConflicts: unresolvedResolutions,
      confidence,
      needsManualReview: unresolvedResolutions.length > 0,
    };
  }

  /**
   * Resolve a single conflict using the appropriate strategy
   */
  private async resolveConflict(
    conflict: Conflict,
    context: MergeContext
  ): Promise<MergeResolution> {
    // Determine the resolution strategy
    const strategy = this.determineStrategy(conflict, context);

    // Get the resolver for this strategy
    const resolver = this.resolvers.get(strategy);
    if (!resolver) {
      throw new Error(`No resolver found for strategy: ${strategy}`);
    }

    // Resolve the conflict
    const resolution = resolver.resolve(conflict, context);

    // Determine if we should auto-apply this resolution
    const shouldApply =
      !resolution.requiresReview &&
      resolution.confidence >= this.options.maxAutoResolveConfidence &&
      this.options.autoResolve;

    return {
      ...resolution,
      applied: shouldApply,
    };
  }

  /**
   * Determine which resolution strategy to use for a conflict
   */
  private determineStrategy(
    conflict: Conflict,
    context: MergeContext
  ): ResolutionStrategy {
    // Check if a custom strategy was specified
    const customStrategy = this.options.resolutionStrategies?.[conflict.code];
    if (customStrategy) {
      return customStrategy;
    }

    // Use the conflict type's default strategy
    const typeStrategy = CONFLICT_TYPE_STRATEGIES[conflict.code];
    if (typeStrategy) {
      return typeStrategy;
    }

    // Fall back to the onConflict callback
    return this.options.onConflict(conflict, context);
  }

  /**
   * Apply a resolution to a document
   */
  private applyResolution(
    document: CanvasDocumentType,
    resolution: MergeResolution
  ): CanvasDocumentType {
    // Clone the document to avoid mutation
    const result = JSON.parse(JSON.stringify(document)) as CanvasDocumentType;

    // Handle special cases for different conflict types
    if (resolution.conflict.code === "S-ORDER") {
      return this.applyOrderResolution(result, resolution);
    }

    // Apply the resolution based on the conflict path
    const { path } = resolution.conflict;
    const { resolvedValue } = resolution;

    if (path.length === 0) {
      throw new Error("Cannot apply resolution to root path");
    }

    // Navigate to the parent object and set the value
    let current: any = result;
    for (let i = 0; i < path.length - 1; i++) {
      const segment = path[i];
      if (typeof segment === "string") {
        if (!current[segment]) {
          current[segment] = {};
        }
        current = current[segment];
      } else if (typeof segment === "number") {
        if (!Array.isArray(current)) {
          throw new Error(
            `Expected array at path segment ${i}, got ${typeof current}`
          );
        }
        if (segment >= current.length) {
          throw new Error(`Array index ${segment} out of bounds`);
        }
        current = current[segment];
      }
    }

    // Set the final value
    const lastSegment = path[path.length - 1];
    if (typeof lastSegment === "string") {
      current[lastSegment] = resolvedValue;
    } else if (typeof lastSegment === "number") {
      if (!Array.isArray(current)) {
        throw new Error(
          `Expected array at final path segment, got ${typeof current}`
        );
      }
      current[lastSegment] = resolvedValue;
    }

    return result;
  }

  /**
   * Apply S-ORDER resolution by reordering children
   */
  private applyOrderResolution(
    document: CanvasDocumentType,
    resolution: MergeResolution
  ): CanvasDocumentType {
    const { path } = resolution.conflict;
    const resolvedValue = resolution.resolvedValue;

    // For S-ORDER, resolvedValue is an array of node IDs in the desired order
    const desiredOrder = resolvedValue as string[];

    // Navigate to the children array
    let current: any = document;
    for (let i = 0; i < path.length; i++) {
      const segment = path[i];
      if (typeof segment === "string") {
        current = current[segment];
      } else if (typeof segment === "number") {
        current = current[segment];
      }
    }

    // Current should now be the children array
    if (!Array.isArray(current)) {
      throw new Error("Expected children array for S-ORDER resolution");
    }

    // Reorder the children array based on the desired order
    const reorderedChildren = desiredOrder.map((nodeId) => {
      const child = current.find((c: any) => c.id === nodeId);
      if (!child) {
        throw new Error(`Child with ID ${nodeId} not found in children array`);
      }
      return child;
    });

    // Replace the children array with the reordered version
    const parentPath = path.slice(0, -1);
    let parent: any = document;
    for (let i = 0; i < parentPath.length; i++) {
      const segment = parentPath[i];
      if (typeof segment === "string") {
        parent = parent[segment];
      } else if (typeof segment === "number") {
        parent = parent[segment];
      }
    }

    const lastSegment = path[path.length - 1];
    if (typeof lastSegment === "string") {
      parent[lastSegment] = reorderedChildren;
    }

    return document;
  }

  /**
   * Calculate overall confidence in the merge resolution
   */
  private calculateOverallConfidence(resolutions: MergeResolution[]): number {
    if (resolutions.length === 0) {
      return 1.0; // No conflicts = perfect confidence
    }

    // Weight by whether resolutions were applied vs require manual review
    const appliedResolutions = resolutions.filter((r) => r.applied);
    const manualResolutions = resolutions.filter((r) => !r.applied);

    const appliedWeight = appliedResolutions.length;
    const manualWeight = manualResolutions.length * 2; // Manual resolutions reduce confidence more

    const totalWeight = appliedWeight + manualWeight;
    if (totalWeight === 0) {
      return 1.0;
    }

    // Calculate weighted average confidence
    let totalConfidence = 0;
    for (const resolution of appliedResolutions) {
      totalConfidence += resolution.confidence * 1.0; // Normal weight for applied
    }
    for (const resolution of manualResolutions) {
      totalConfidence += resolution.confidence * 0.5; // Reduced weight for manual
    }

    return Math.max(0, Math.min(1, totalConfidence / totalWeight));
  }
}

/**
 * Convenience function to create and run merge resolution
 */
export async function resolveMergeConflicts(
  conflicts: Conflict[],
  context: MergeContext,
  options?: MergeResolutionOptions
): Promise<MergeResult> {
  const engine = new MergeResolutionEngine(options);
  return engine.resolveConflicts(conflicts, context);
}

/**
 * Check if a conflict can be auto-resolved with high confidence
 */
export function canAutoResolve(
  conflict: Conflict,
  options: MergeResolutionOptions = {}
): boolean {
  const strategy =
    CONFLICT_TYPE_STRATEGIES[conflict.code] || ResolutionStrategy.MANUAL;
  const confidence = STRATEGY_CONFIDENCE[strategy];
  const minConfidence =
    options.maxAutoResolveConfidence ??
    DEFAULT_MERGE_OPTIONS.maxAutoResolveConfidence;

  return confidence >= minConfidence && strategy !== ResolutionStrategy.MANUAL;
}
