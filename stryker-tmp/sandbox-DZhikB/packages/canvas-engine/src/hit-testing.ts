/**
 * @fileoverview Hit testing for canvas node collision detection
 * @author @darianrosebrook
 */

import type {
  CanvasDocumentType,
  NodeType,
  RectType,
} from "@paths-design/canvas-schema";
import { observability } from "./observability.js";
import {
  traverseDocument,
  TraversalResult as _TraversalResult,
} from "./traversal.js";
import type { HitTestResult, NodePath } from "./types.js";

/**
 * Point for hit testing
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Hit test a point against all nodes in the document
 */
export function hitTest(
  document: CanvasDocumentType,
  point: Point,
  options: {
    includeInvisible?: boolean;
    artboardIndex?: number;
  } = {}
): HitTestResult | null {
  // Log operation start
  observability.log("info", "engine.hit_test.result", {
    operation: "hitTest",
    documentId: document.id,
    point: `${point.x},${point.y}`,
    artboardIndex: options.artboardIndex,
    includeInvisible: options.includeInvisible,
  });

  const startTime = performance.now();

  try {
    const { includeInvisible = false, artboardIndex } = options;

    let bestHit: HitTestResult | null = null;

    const nodes = Array.from(
      traverseDocument(
        document,
        artboardIndex !== undefined ? { artboardIndex } : undefined
      )
    );

    for (let i = nodes.length - 1; i >= 0; i--) {
      const result = nodes[i];

      if (
        !includeInvisible &&
        !isNodeVisibleInHierarchy(document, result.path)
      ) {
        continue;
      }

      if (pointInNode(point, result.node, result.path)) {
        bestHit = {
          nodeId: result.node.id,
          nodePath: result.path,
          point,
          node: result.node,
        };
        break;
      }
    }

    // Log operation complete
    const duration = performance.now() - startTime;
    observability.recordOperation("hitTest", duration);

    observability.log("info", "engine.operation.complete", {
      operation: "hitTest",
      duration_ms: Math.round(duration),
      documentId: document.id,
      hitResult: bestHit ? "hit" : "miss",
    });

    return bestHit;
  } catch (error) {
    const duration = performance.now() - startTime;
    observability.recordOperation("hitTest", duration);

    observability.log("error", "engine.operation.error", {
      operation: "hitTest",
      error: error instanceof Error ? error.message : String(error),
      duration_ms: Math.round(duration),
      documentId: document.id,
    });

    throw error;
  }
}

/**
 * Check if a point is inside a node's bounds
 */
function pointInNode(point: Point, node: NodeType, path: NodePath): boolean {
  // Get the node's frame
  const frame = getNodeFrame(node, path);

  if (!frame) {
    return false;
  }

  // Simple rectangle hit test
  return (
    point.x >= frame.x &&
    point.x <= frame.x + frame.width &&
    point.y >= frame.y &&
    point.y <= frame.y + frame.height
  );
}

/**
 * Get the frame (bounding box) of a node
 */
function getNodeFrame(node: NodeType, _path: NodePath): RectType | null {
  // For now, assume nodes have a 'frame' property
  // In a full implementation, we'd calculate frames based on layout
  if ("frame" in node && node.frame) {
    return node.frame;
  }

  return null;
}

/**
 * Get all nodes that intersect with a rectangle
 */
export function hitTestRect(
  document: CanvasDocumentType,
  rect: RectType,
  options: {
    includeInvisible?: boolean;
    artboardIndex?: number;
  } = {}
): HitTestResult[] {
  const { includeInvisible = false, artboardIndex } = options;
  const hits: HitTestResult[] = [];

  for (const result of traverseDocument(document)) {
    // Skip if artboard filtering is applied
    if (artboardIndex !== undefined && result.artboardIndex !== artboardIndex) {
      continue;
    }

    // Skip invisible nodes unless explicitly requested
    if (!includeInvisible && !result.node.visible) {
      continue;
    }

    const nodeFrame = getNodeFrame(result.node, result.path);
    if (
      nodeFrame &&
      rectsIntersect(rect, nodeFrame) &&
      (includeInvisible || isNodeVisibleInHierarchy(document, result.path))
    ) {
      hits.push({
        nodeId: result.node.id,
        nodePath: result.path,
        point: { x: rect.x, y: rect.y },
        node: result.node,
      });
    }
  }

  return hits;
}

/**
 * Check if two rectangles intersect
 */
function rectsIntersect(rect1: RectType, rect2: RectType): boolean {
  return !(
    rect1.x + rect1.width <= rect2.x ||
    rect2.x + rect2.width <= rect1.x ||
    rect1.y + rect1.height <= rect2.y ||
    rect2.y + rect2.height <= rect1.y
  );
}

/**
 * Get nodes within a certain distance of a point
 */
export function hitTestProximity(
  document: CanvasDocumentType,
  point: Point,
  maxDistance: number,
  options: {
    includeInvisible?: boolean;
    artboardIndex?: number;
  } = {}
): HitTestResult[] {
  const { includeInvisible = false, artboardIndex } = options;
  const hits: HitTestResult[] = [];

  for (const result of traverseDocument(document)) {
    // Skip if artboard filtering is applied
    if (artboardIndex !== undefined && result.artboardIndex !== artboardIndex) {
      continue;
    }

    // Skip invisible nodes unless explicitly requested
    if (!includeInvisible && !result.node.visible) {
      continue;
    }

    const nodeFrame = getNodeFrame(result.node, result.path);
    if (
      nodeFrame &&
      pointInProximity(point, nodeFrame, maxDistance) &&
      (includeInvisible || isNodeVisibleInHierarchy(document, result.path))
    ) {
      hits.push({
        nodeId: result.node.id,
        nodePath: result.path,
        point,
        node: result.node,
      });
    }
  }

  return hits;
}

/**
 * Check if a point is within a certain distance of a rectangle
 */
function pointInProximity(
  point: Point,
  rect: RectType,
  maxDistance: number
): boolean {
  // Check if point is inside the rectangle (distance 0)
  if (pointInNode(point, { frame: rect } as any, [])) {
    return true;
  }

  // Check distance to rectangle edges
  const dx = Math.max(
    0,
    Math.max(rect.x - point.x, point.x - (rect.x + rect.width))
  );
  const dy = Math.max(
    0,
    Math.max(rect.y - point.y, point.y - (rect.y + rect.height))
  );

  return Math.sqrt(dx * dx + dy * dy) <= maxDistance;
}

function isNodeVisibleInHierarchy(
  document: CanvasDocumentType,
  path: NodePath
): boolean {
  const parts: Array<number | string> = [];

  for (let i = 0; i < path.length; i++) {
    const part = path[i];
    parts.push(part);

    if (part === "children") {
      continue;
    }

    const current = resolvePath(document, parts);

    if (!current) {
      return false;
    }

    if (typeof current === "object" && "visible" in current) {
      if ((current as { visible?: boolean }).visible === false) {
        return false;
      }
    }
  }

  return true;
}

function resolvePath(document: CanvasDocumentType, path: NodePath): any {
  let current: any = document;

  for (const segment of path) {
    if (segment === "children") {
      if (current && "children" in current) {
        current = current.children;
      } else {
        return undefined;
      }
      continue;
    }

    if (typeof segment === "number") {
      if (Array.isArray(current)) {
        current = current[segment];
      } else if (current && Array.isArray(current.artboards)) {
        current = current.artboards[segment];
      } else {
        return undefined;
      }
    } else if (typeof segment === "string") {
      current = current?.[segment];
    }

    if (!current) {
      return undefined;
    }
  }

  return current;
}
