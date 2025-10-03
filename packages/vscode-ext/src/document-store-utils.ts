/**
 * @fileoverview Utility functions for document tree traversal
 * @author @darianrosebrook
 *
 * Extracted utilities to avoid polluting DocumentStore with traversal logic.
 * Provides deterministic node lookup with proper error handling.
 */

import type { CanvasDocumentType, NodeType } from "@paths-design/canvas-schema";

/**
 * Node information with hierarchy context
 */
export interface NodeInfo {
  node: NodeType;
  artboardId: string;
  parentId: string | null;
  depth: number;
}

/**
 * Find a node by ID in the document tree
 *
 * @param document Canvas document to search
 * @param nodeId Node ID to find
 * @returns NodeInfo if found, null otherwise
 *
 * **Performance**: O(n) where n is total nodes. Consider caching for hot paths.
 */
export function findNodeById(
  document: CanvasDocumentType,
  nodeId: string
): NodeInfo | null {
  if (!document?.artboards) {
    return null;
  }

  for (const artboard of document.artboards) {
    // Check artboard itself
    if (artboard.id === nodeId) {
      return {
        node: artboard,
        artboardId: artboard.id,
        parentId: null,
        depth: 0,
      };
    }

    // Search children
    if (artboard.children) {
      const result = findNodeInChildren(
        artboard.children,
        nodeId,
        artboard.id,
        null,
        1
      );
      if (result) {
        return result;
      }
    }
  }

  return null;
}

/**
 * Recursively search children for a node
 *
 * @internal
 */
function findNodeInChildren(
  children: NodeType[],
  targetId: string,
  artboardId: string,
  parentId: string | null,
  depth: number
): NodeInfo | null {
  for (const node of children) {
    if (node.id === targetId) {
      return {
        node,
        artboardId,
        parentId,
        depth,
      };
    }

    if (node.type === "frame" && node.children) {
      const result = findNodeInChildren(
        node.children,
        targetId,
        artboardId,
        node.id,
        depth + 1
      );
      if (result) {
        return result;
      }
    }
  }

  return null;
}

/**
 * Find multiple nodes by IDs efficiently
 *
 * @param document Canvas document to search
 * @param nodeIds Array of node IDs to find
 * @returns Map of nodeId -> NodeInfo (only found nodes)
 *
 * **Performance**: Single traversal for all IDs - O(n) regardless of query size
 */
export function findNodesByIds(
  document: CanvasDocumentType,
  nodeIds: string[]
): Map<string, NodeInfo> {
  const results = new Map<string, NodeInfo>();
  const targetSet = new Set(nodeIds);

  if (!document?.artboards || targetSet.size === 0) {
    return results;
  }

  for (const artboard of document.artboards) {
    if (targetSet.has(artboard.id)) {
      results.set(artboard.id, {
        node: artboard,
        artboardId: artboard.id,
        parentId: null,
        depth: 0,
      });
      targetSet.delete(artboard.id);
    }

    if (targetSet.size === 0) {
      break; // Early exit if all found
    }

    if (artboard.children) {
      findMultipleInChildren(
        artboard.children,
        targetSet,
        artboard.id,
        null,
        1,
        results
      );
    }

    if (targetSet.size === 0) {
      break;
    }
  }

  return results;
}

/**
 * Recursive helper for batch node finding
 *
 * @internal
 */
function findMultipleInChildren(
  children: NodeType[],
  targetSet: Set<string>,
  artboardId: string,
  parentId: string | null,
  depth: number,
  results: Map<string, NodeInfo>
): void {
  for (const node of children) {
    if (targetSet.has(node.id)) {
      results.set(node.id, {
        node,
        artboardId,
        parentId,
        depth,
      });
      targetSet.delete(node.id);

      if (targetSet.size === 0) {
        return; // Early exit
      }
    }

    if (node.type === "frame" && node.children) {
      findMultipleInChildren(
        node.children,
        targetSet,
        artboardId,
        node.id,
        depth + 1,
        results
      );

      if (targetSet.size === 0) {
        return;
      }
    }
  }
}

/**
 * Get all nodes of a specific type
 *
 * @param document Canvas document to search
 * @param nodeType Node type to filter by
 * @param artboardId Optional: limit to specific artboard
 */
export function getNodesByType(
  document: CanvasDocumentType,
  nodeType: string,
  artboardId?: string
): NodeInfo[] {
  const results: NodeInfo[] = [];

  if (!document?.artboards) {
    return results;
  }

  const artboards = artboardId
    ? document.artboards.filter((ab) => ab.id === artboardId)
    : document.artboards;

  for (const artboard of artboards) {
    // Artboards don't have types, only search their children
    if (artboard.children) {
      collectNodesByType(
        artboard.children,
        nodeType,
        artboard.id,
        null,
        1,
        results
      );
    }
  }

  return results;
}

/**
 * Recursive helper for type-based collection
 *
 * @internal
 */
function collectNodesByType(
  children: NodeType[],
  targetType: string,
  artboardId: string,
  parentId: string | null,
  depth: number,
  results: NodeInfo[]
): void {
  for (const node of children) {
    if (node.type === targetType) {
      results.push({
        node,
        artboardId,
        parentId,
        depth,
      });
    }

    if (node.type === "frame" && node.children) {
      collectNodesByType(
        node.children,
        targetType,
        artboardId,
        node.id,
        depth + 1,
        results
      );
    }
  }
}

/**
 * Search nodes by name pattern (regex supported)
 *
 * @param document Canvas document to search
 * @param pattern Regex pattern or string to match
 * @param caseSensitive Case-sensitive matching (default: false)
 */
export function searchNodesByName(
  document: CanvasDocumentType,
  pattern: string | RegExp,
  caseSensitive = false
): NodeInfo[] {
  const results: NodeInfo[] = [];

  if (!document?.artboards) {
    return results;
  }

  const regex =
    typeof pattern === "string"
      ? new RegExp(pattern, caseSensitive ? "" : "i")
      : pattern;

  for (const artboard of document.artboards) {
    if (artboard.name && regex.test(artboard.name)) {
      results.push({
        node: artboard,
        artboardId: artboard.id,
        parentId: null,
        depth: 0,
      });
    }

    if (artboard.children) {
      searchNodesByNameInChildren(
        artboard.children,
        regex,
        artboard.id,
        null,
        1,
        results
      );
    }
  }

  return results;
}

/**
 * Recursive helper for name-based search
 *
 * @internal
 */
function searchNodesByNameInChildren(
  children: NodeType[],
  regex: RegExp,
  artboardId: string,
  parentId: string | null,
  depth: number,
  results: NodeInfo[]
): void {
  for (const node of children) {
    if (node.name && regex.test(node.name)) {
      results.push({
        node,
        artboardId,
        parentId,
        depth,
      });
    }

    if (node.type === "frame" && node.children) {
      searchNodesByNameInChildren(
        node.children,
        regex,
        artboardId,
        node.id,
        depth + 1,
        results
      );
    }
  }
}

/**
 * Calculate combined bounding box for multiple nodes
 *
 * @param nodes Array of nodes to calculate bounds for
 * @returns Combined bounding box or null if no valid frames
 */
export function calculateCombinedBounds(
  nodes: NodeType[]
): { x: number; y: number; width: number; height: number } | null {
  const validNodes = nodes.filter((n) => n.frame);

  if (validNodes.length === 0) {
    return null;
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const node of validNodes) {
    const frame = node.frame!;
    minX = Math.min(minX, frame.x);
    minY = Math.min(minY, frame.y);
    maxX = Math.max(maxX, frame.x + frame.width);
    maxY = Math.max(maxY, frame.y + frame.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
