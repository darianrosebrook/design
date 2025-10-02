/**
 * @fileoverview Tree traversal algorithms for canvas documents
 * @author @darianrosebrook
 */

import type {
  CanvasDocumentType,
  NodeType} from "@paths-design/canvas-schema";
import {
  ArtboardType,
} from "@paths-design/canvas-schema";
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
  const { maxDepth = Infinity, includeRoot = false, filter } = options;

  for (
    let artboardIndex = 0;
    artboardIndex < document.artboards.length;
    artboardIndex++
  ) {
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
  const pathCopy = [...nodePath];

  // Remove the node itself and walk up the path
  while (pathCopy.length > 1) {
    pathCopy.pop(); // Remove current node

    // Find the ancestor node
    let current: any = document;
    for (const segment of pathCopy) {
      current = current[segment];
    }

    if (current && typeof current === "object" && "id" in current) {
      ancestors.unshift({
        node: current,
        path: [...pathCopy],
        depth: pathCopy.length - 1,
        artboardIndex: 0, // Would need to calculate this properly
      });
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

  // Find the node first
  const targetNode: NodeType | null = null;
  let current: any = document;

  for (const segment of nodePath) {
    current = current[segment];
  }

  if (current && "children" in current && current.children) {
    // Traverse all descendants
    for (const result of traverseTree(
      current.children,
      [...nodePath, "children"],
      nodePath.length + 1,
      Infinity,
      undefined,
      0
    )) {
      descendants.push(result);
    }
  }

  return descendants;
}

/**
 * Calculate the total number of nodes in the document
 */
export function countNodes(document: CanvasDocumentType): number {
  let count = 0;

  for (const _ of traverseDocument(document)) {
    count++;
  }

  return count;
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
