/**
 * @fileoverview Tree traversal algorithms for canvas documents
 * @author @darianrosebrook
 */

import type { CanvasDocumentType, NodeType } from "@paths-design/canvas-schema";
import { ArtboardType as _ArtboardType } from "@paths-design/canvas-schema";
import { observability } from "./observability.js";
import type { NodePath, TraversalOptions } from "./types.js";

/**
 * Traversal result
 */
export interface TraversalResult {
  node: NodeType;
  path: NodePath;
  depth: number;
  artboardIndex: number;
}

/**
 * Traverse all nodes in the document
 */
export function* traverseDocument(
  document: CanvasDocumentType,
  options: TraversalOptions = {}
): Generator<TraversalResult> {
  // Log operation start
  observability.log("info", "engine.operation.start", {
    operation: "traverseDocument",
    documentId: document.id,
    artboardCount: document.artboards.length,
    maxDepth: options.maxDepth,
    includeRoot: options.includeRoot,
    hasFilter: !!options.filter,
  });

  const startTime = performance.now();

  try {
    const {
      maxDepth = Infinity,
      includeRoot = false,
      filter,
      artboardIndex: targetArtboardIndex,
    } = options;

    const artboards = document.artboards;

    for (
      let artboardIndex = 0;
      artboardIndex < artboards.length;
      artboardIndex++
    ) {
      if (
        targetArtboardIndex !== undefined &&
        targetArtboardIndex !== artboardIndex
      ) {
        continue;
      }

      const artboard = document.artboards[artboardIndex];

      if (includeRoot) {
        const rootResult: TraversalResult = {
          node: artboard,
          path: [artboardIndex],
          depth: 0,
          artboardIndex,
        };

        if (!filter || filter(artboard, [artboardIndex])) {
          yield rootResult;
        }
      }

      yield* traverseTree(
        artboard.children,
        [artboardIndex, "children"],
        1,
        maxDepth,
        filter,
        artboardIndex
      );
    }

    // Log operation complete
    const duration = performance.now() - startTime;
    observability.recordOperation("traverseDocument", duration);

    observability.log("info", "engine.operation.complete", {
      operation: "traverseDocument",
      duration_ms: Math.round(duration),
      documentId: document.id,
    });
  } catch (error) {
    const duration = performance.now() - startTime;
    observability.recordOperation("traverseDocument", duration);

    observability.log("error", "engine.operation.error", {
      operation: "traverseDocument",
      error: error instanceof Error ? error.message : String(error),
      duration_ms: Math.round(duration),
      documentId: document.id,
    });

    throw error;
  }
}

/**
 * Traverse a tree of nodes
 */
function* traverseTree(
  nodes: NodeType[],
  currentPath: NodePath,
  currentDepth: number,
  maxDepth: number,
  filter?: (node: NodeType, path: NodePath) => boolean,
  artboardIndex?: number
): Generator<TraversalResult> {
  if (currentDepth > maxDepth) {
    return;
  }

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const path = [...currentPath, i];

    const result: TraversalResult = {
      node,
      path,
      depth: currentDepth,
      artboardIndex: artboardIndex ?? 0,
    };

    // Apply filter if provided
    if (!filter || filter(node, path)) {
      yield result;
    }

    // Traverse children if this node has them
    if ("children" in node && node.children && node.children.length > 0) {
      yield* traverseTree(
        node.children,
        [...path, "children"],
        currentDepth + 1,
        maxDepth,
        filter,
        artboardIndex
      );
    }
  }
}

/**
 * Find all nodes of a specific type
 */
export function findNodesByType(
  document: CanvasDocumentType,
  nodeType: string,
  options: TraversalOptions = {}
): TraversalResult[] {
  const results: TraversalResult[] = [];

  for (const result of traverseDocument(document, options)) {
    if (result.node.type === nodeType) {
      results.push(result);
    }
  }

  return results;
}

/**
 * Find nodes by name pattern
 */
export function findNodesByName(
  document: CanvasDocumentType,
  namePattern: string | RegExp,
  options: TraversalOptions = {}
): TraversalResult[] {
  const results: TraversalResult[] = [];
  const regex =
    typeof namePattern === "string" ? new RegExp(namePattern) : namePattern;

  for (const result of traverseDocument(document, options)) {
    if (regex.test(result.node.name)) {
      results.push(result);
    }
  }

  return results;
}

/**
 * Get all ancestors of a node
 */
export function getAncestors(
  document: CanvasDocumentType,
  nodePath: NodePath
): TraversalResult[] {
  const ancestors: TraversalResult[] = [];

  // Walk through all traversal results and find ancestors of the target path
  for (const result of traverseDocument(document)) {
    // Check if this node's path is a prefix of the target path
    if (result.path.length < nodePath.length) {
      let isAncestor = true;
      for (let i = 0; i < result.path.length; i++) {
        if (result.path[i] !== nodePath[i]) {
          isAncestor = false;
          break;
        }
      }
      if (isAncestor) {
        ancestors.push(result);
      }
    }
  }

  return ancestors;
}

/**
 * Get all descendants of a node
 */
export function getDescendants(
  document: CanvasDocumentType,
  nodePath: NodePath
): TraversalResult[] {
  const descendants: TraversalResult[] = [];

  // Walk through all traversal results and find descendants of the target path
  for (const result of traverseDocument(document)) {
    // Check if this node's path starts with the target path
    if (result.path.length > nodePath.length) {
      let isDescendant = true;
      for (let i = 0; i < nodePath.length; i++) {
        if (result.path[i] !== nodePath[i]) {
          isDescendant = false;
          break;
        }
      }
      if (isDescendant) {
        descendants.push(result);
      }
    }
  }

  return descendants;
}

/**
 * Calculate the total number of nodes in the document
 */
export function countNodes(document: CanvasDocumentType): number {
  // Log operation start
  observability.log("info", "engine.operation.start", {
    operation: "countNodes",
    documentId: document.id,
  });

  const startTime = performance.now();

  try {
    let count = 0;

    for (const _ of traverseDocument(document)) {
      count++;
    }

    // Log operation complete
    const duration = performance.now() - startTime;
    observability.recordOperation("traverseDocument", duration, count);

    observability.log("info", "engine.operation.complete", {
      operation: "countNodes",
      duration_ms: Math.round(duration),
      documentId: document.id,
      nodeCount: count,
    });

    return count;
  } catch (error) {
    const duration = performance.now() - startTime;
    observability.recordOperation("traverseDocument", duration);

    observability.log("error", "engine.operation.error", {
      operation: "countNodes",
      error: error instanceof Error ? error.message : String(error),
      duration_ms: Math.round(duration),
      documentId: document.id,
    });

    throw error;
  }
}

/**
 * Get document statistics
 */
export function getDocumentStats(document: CanvasDocumentType): {
  totalNodes: number;
  nodesByType: Record<string, number>;
  maxDepth: number;
  artboardCount: number;
} {
  const nodesByType: Record<string, number> = {};
  let maxDepth = 0;

  for (const result of traverseDocument(document)) {
    // Count by type
    nodesByType[result.node.type] = (nodesByType[result.node.type] || 0) + 1;

    // Track max depth
    if (result.depth > maxDepth) {
      maxDepth = result.depth;
    }
  }

  return {
    totalNodes: countNodes(document),
    nodesByType,
    maxDepth,
    artboardCount: document.artboards.length,
  };
}
