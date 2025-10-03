/**
 * @fileoverview Semantic diff engine for Designer canvas documents
 * @author @darianrosebrook
 */

import type { CanvasDocumentType, NodeIndex } from "../types.js";
import { buildNodeIndex } from "../utils.js";
import type {
  DiffOperation,
  DiffResult,
  DiffOptions,
  // DocumentPair, // TODO: Remove if not needed
  NodeChange,
  // PropertyDiff, // TODO: Remove if not needed
} from "./types.js";
import { DEFAULT_DIFF_OPTIONS } from "./types.js";

/**
 * Main semantic diff engine for comparing canvas documents
 */
export class SemanticDiffEngine {
  private options: Required<DiffOptions>;

  constructor(options: DiffOptions = {}) {
    this.options = { ...DEFAULT_DIFF_OPTIONS, ...options };
  }

  /**
   * Compute semantic diff between two documents
   */
  async diff(
    base: CanvasDocumentType,
    target: CanvasDocumentType
  ): Promise<DiffResult> {
    const startTime = Date.now();

    // Build node indexes for efficient lookup
    const baseIndex = buildNodeIndex(base);
    const targetIndex = buildNodeIndex(target);

    // Identify node changes
    const nodeChanges = this.identifyNodeChanges(baseIndex, targetIndex);

    // Generate diff operations
    const operations: DiffOperation[] = [];
    for (const change of nodeChanges) {
      if (operations.length >= this.options.maxOperations) {
        break;
      }

      const ops = this.generateOperationsForChange(
        change,
        baseIndex,
        targetIndex
      );
      operations.push(...ops);
    }

    // Sort operations for deterministic output
    operations.sort(this.sortOperations);

    const duration = Date.now() - startTime;

    return {
      operations,
      summary: this.calculateSummary(operations),
      metadata: {
        fromDocumentId: base.id,
        toDocumentId: target.id,
        timestamp: Date.now(),
        duration,
      },
    };
  }

  /**
   * Identify what nodes were added, removed, modified, or moved
   */
  private identifyNodeChanges(
    baseIndex: NodeIndex,
    targetIndex: NodeIndex
  ): NodeChange[] {
    const changes: NodeChange[] = [];
    const processedIds = new Set<string>();

    // Find added and modified nodes
    for (const [nodeId, targetSnapshot] of targetIndex.byId) {
      const baseSnapshot = baseIndex.byId.get(nodeId);

      if (!baseSnapshot) {
        // Node was added
        changes.push({
          nodeId,
          type: "added",
          newNode: targetSnapshot.node,
          newPath: targetSnapshot.path,
        });
      } else if (this.nodesDiffer(baseSnapshot.node, targetSnapshot.node)) {
        // Node was modified
        changes.push({
          nodeId,
          type: "modified",
          oldNode: baseSnapshot.node,
          newNode: targetSnapshot.node,
          oldPath: baseSnapshot.path,
          newPath: targetSnapshot.path,
        });
      } else if (!this.pathsEqual(baseSnapshot.path, targetSnapshot.path)) {
        // Node was moved (structure changed but content same)
        changes.push({
          nodeId,
          type: "moved",
          oldNode: baseSnapshot.node,
          newNode: targetSnapshot.node,
          oldPath: baseSnapshot.path,
          newPath: targetSnapshot.path,
        });
      }

      processedIds.add(nodeId);
    }

    // Find removed nodes
    for (const [nodeId, baseSnapshot] of baseIndex.byId) {
      if (!processedIds.has(nodeId)) {
        changes.push({
          nodeId,
          type: "removed",
          oldNode: baseSnapshot.node,
          oldPath: baseSnapshot.path,
        });
      }
    }

    return changes;
  }

  /**
   * Generate diff operations for a single node change
   */
  private generateOperationsForChange(
    change: NodeChange,
    _baseIndex: NodeIndex,
    _targetIndex: NodeIndex
  ): DiffOperation[] {
    const operations: DiffOperation[] = [];

    switch (change.type) {
      case "added":
        operations.push(this.createAddOperation(change));
        break;

      case "removed":
        operations.push(this.createRemoveOperation(change));
        break;

      case "modified":
        operations.push(...this.createModifyOperations(change));
        break;

      case "moved":
        operations.push(this.createMoveOperation(change));
        break;
    }

    return operations;
  }

  /**
   * Create operation for added node
   */
  private createAddOperation(change: NodeChange): DiffOperation {
    const { nodeId, newNode, newPath } = change;
    if (!newPath) {
      throw new Error("newPath is required for add operation");
    }
    const parentPath = newPath.slice(0, -1);
    const index = parseInt(newPath[newPath.length - 1]);

    return {
      type: "add",
      nodeId,
      path: newPath,
      newValue: newNode,
      metadata: {
        parentId: this.getParentIdFromPath(parentPath),
        index,
        description: `Added ${newNode?.type ?? "unknown"} node "${
          newNode?.name ?? "unnamed"
        }"`,
        severity: "info",
      },
    };
  }

  /**
   * Create operation for removed node
   */
  private createRemoveOperation(change: NodeChange): DiffOperation {
    const { nodeId, oldNode, oldPath } = change;

    return {
      type: "remove",
      nodeId,
      path: oldPath ?? [],
      oldValue: oldNode,
      metadata: {
        description: `Removed ${oldNode?.type ?? "unknown"} node "${
          oldNode?.name ?? "unnamed"
        }"`,
        severity: "warning",
      },
    };
  }

  /**
   * Create operations for modified node (property-level changes)
   */
  private createModifyOperations(change: NodeChange): DiffOperation[] {
    const { nodeId, oldNode, newNode, newPath } = change;
    const operations: DiffOperation[] = [];

    if (!oldNode || !newNode) {
      return operations;
    }

    // Compare frames
    if (this.options.includeProperty) {
      const frameOps = this.diffFrames(
        nodeId,
        newPath ?? [],
        oldNode.frame,
        newNode.frame
      );
      operations.push(...frameOps);
    }

    // Compare visibility
    if (this.options.includeProperty) {
      const visibilityOps = this.diffVisibility(
        nodeId,
        newPath ?? [],
        oldNode.visible,
        newNode.visible
      );
      operations.push(...visibilityOps);
    }

    // Compare layout
    if (this.options.includeProperty) {
      const layoutOps = this.diffLayout(
        nodeId,
        newPath ?? [],
        oldNode.layout,
        newNode.layout
      );
      operations.push(...layoutOps);
    }

    // Compare text content
    if (
      this.options.includeContent &&
      oldNode.type === "text" &&
      newNode.type === "text"
    ) {
      const textOps = this.diffText(
        nodeId,
        newPath ?? [],
        oldNode.text,
        newNode.text
      );
      operations.push(...textOps);
    }

    // Compare names
    if (this.options.includeMetadata) {
      const nameOps = this.diffName(
        nodeId,
        newPath ?? [],
        oldNode.name,
        newNode.name
      );
      operations.push(...nameOps);
    }

    return operations;
  }

  /**
   * Create operation for moved node
   */
  private createMoveOperation(change: NodeChange): DiffOperation {
    const { nodeId, oldPath, newPath } = change;
    if (!oldPath || !newPath) {
      throw new Error("oldPath and newPath are required for move operation");
    }
    const _oldParentPath = oldPath.slice(0, -1);
    const newParentPath = newPath.slice(0, -1);
    const newIndex = parseInt(newPath[newPath.length - 1]);

    return {
      type: "move",
      nodeId,
      path: newPath,
      metadata: {
        parentId: this.getParentIdFromPath(newParentPath),
        index: newIndex,
        description: `Moved node from ${this.formatPath(
          oldPath
        )} to ${this.formatPath(newPath)}`,
        severity: "info",
      },
    };
  }

  /**
   * Diff frame properties
   */
  private diffFrames(
    nodeId: string,
    path: string[],
    oldFrame:
      | { x: number; y: number; width: number; height: number }
      | undefined,
    newFrame:
      | { x: number; y: number; width: number; height: number }
      | undefined
  ): DiffOperation[] {
    if (!oldFrame || !newFrame) {
      return [];
    }

    const operations: DiffOperation[] = [];

    // Compare individual frame properties
    const frameProps = ["x", "y", "width", "height"];
    for (const prop of frameProps) {
      if (oldFrame[prop] !== newFrame[prop]) {
        operations.push({
          type: "modify",
          nodeId,
          path: [...path, "frame", prop],
          field: prop,
          oldValue: oldFrame[prop],
          newValue: newFrame[prop],
          metadata: {
            description: `Changed frame ${prop} from ${oldFrame[prop]} to ${newFrame[prop]}`,
            severity: "info",
          },
        });
      }
    }

    return operations;
  }

  /**
   * Diff visibility property
   */
  private diffVisibility(
    nodeId: string,
    path: string[],
    oldVisible: boolean | undefined,
    newVisible: boolean | undefined
  ): DiffOperation[] {
    const oldVal = oldVisible ?? true;
    const newVal = newVisible ?? true;

    if (oldVal !== newVal) {
      return [
        {
          type: "modify",
          nodeId,
          path: [...path, "visible"],
          field: "visible",
          oldValue: oldVal,
          newValue: newVal,
          metadata: {
            description: `Changed visibility from ${oldVal} to ${newVal}`,
            severity: "info",
          },
        },
      ];
    }

    return [];
  }

  /**
   * Diff layout properties
   */
  private diffLayout(
    nodeId: string,
    path: string[],
    oldLayout: Record<string, unknown> | undefined,
    newLayout: Record<string, unknown> | undefined
  ): DiffOperation[] {
    // Handle cases where one or both layouts are undefined
    const oldLayoutStr = oldLayout ? JSON.stringify(oldLayout) : "";
    const newLayoutStr = newLayout ? JSON.stringify(newLayout) : "";

    if (oldLayoutStr === newLayoutStr) {
      return [];
    }

    return [
      {
        type: "modify",
        nodeId,
        path: [...path, "layout"],
        field: "layout",
        oldValue: oldLayout,
        newValue: newLayout,
        metadata: {
          description: `Changed layout properties`,
          severity: "info",
        },
      },
    ];
  }

  /**
   * Diff text content
   */
  private diffText(
    nodeId: string,
    path: string[],
    oldText: string,
    newText: string
  ): DiffOperation[] {
    if (oldText === newText) {
      return [];
    }

    return [
      {
        type: "modify",
        nodeId,
        path: [...path, "text"],
        field: "text",
        oldValue: oldText,
        newValue: newText,
        metadata: {
          description: `Changed text from "${oldText}" to "${newText}"`,
          severity: "info",
        },
      },
    ];
  }

  /**
   * Diff node names
   */
  private diffName(
    nodeId: string,
    path: string[],
    oldName: string,
    newName: string
  ): DiffOperation[] {
    if (oldName === newName) {
      return [];
    }

    return [
      {
        type: "modify",
        nodeId,
        path: [...path, "name"],
        field: "name",
        oldValue: oldName,
        newValue: newName,
        metadata: {
          description: `Renamed from "${oldName}" to "${newName}"`,
          severity: "info",
        },
      },
    ];
  }

  /**
   * Check if two nodes are different (deep comparison for relevant properties)
   */
  private nodesDiffer(oldNode: any, newNode: any): boolean {
    // Compare basic properties that affect the node's identity/behavior
    return (
      oldNode.name !== newNode.name ||
      oldNode.type !== newNode.type ||
      oldNode.visible !== newNode.visible ||
      JSON.stringify(oldNode.frame) !== JSON.stringify(newNode.frame) ||
      JSON.stringify(oldNode.layout) !== JSON.stringify(newNode.layout) ||
      (oldNode.type === "text" && oldNode.text !== newNode.text)
    );
  }

  /**
   * Check if two paths are equal
   */
  private pathsEqual(path1: string[], path2: string[]): boolean {
    return (
      path1.length === path2.length &&
      path1.every((segment, i) => segment === path2[i])
    );
  }

  /**
   * Extract parent ID from a path
   */
  private getParentIdFromPath(_path: string[]): string | undefined {
    // Parent ID would be the node ID in the artboards or children arrays
    // This is a simplified implementation
    return undefined;
  }

  /**
   * Format path for display
   */
  private formatPath(path: string[]): string {
    return path.reduce((acc, segment, index) => {
      if (/^\d+$/.test(segment)) {
        return `${acc}[${segment}]`;
      }
      return index === 0 ? segment : `${acc}.${segment}`;
    }, "");
  }

  /**
   * Sort operations for deterministic output
   */
  private sortOperations(a: DiffOperation, b: DiffOperation): number {
    // Sort by type, then by path, then by nodeId
    const typeOrder = { remove: 0, add: 1, move: 2, modify: 3 };
    const typeDiff = typeOrder[a.type] - typeOrder[b.type];
    if (typeDiff !== 0) {
      return typeDiff;
    }

    const pathA = a.path.join(".");
    const pathB = b.path.join(".");
    if (pathA < pathB) {
      return -1;
    }
    if (pathA > pathB) {
      return 1;
    }

    return a.nodeId.localeCompare(b.nodeId);
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(operations: DiffOperation[]) {
    const summary = {
      added: 0,
      removed: 0,
      modified: 0,
      moved: 0,
      total: operations.length,
    };

    for (const op of operations) {
      switch (op.type) {
        case "add":
          summary.added++;
          break;
        case "remove":
          summary.removed++;
          break;
        case "modify":
          summary.modified++;
          break;
        case "move":
          summary.moved++;
          break;
      }
    }

    return summary;
  }
}

/**
 * Convenience function to create and run a diff
 */
export async function diffDocuments(
  base: CanvasDocumentType,
  target: CanvasDocumentType,
  options?: DiffOptions
): Promise<DiffResult> {
  const engine = new SemanticDiffEngine(options);
  return engine.diff(base, target);
}
