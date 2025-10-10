/**
 * @fileoverview Helper utilities for merge conflict detection
 * @author @darianrosebrook
 */

import { ulid } from "ulidx";
import type {
  CanvasDocumentType,
  Conflict,
  NodeSnapshot,
  NodeIndex,
  NodeType,
} from "./types.js";

/**
 * Build index maps for a document to enable O(1) node lookup
 */
export function buildNodeIndex(doc: CanvasDocumentType): NodeIndex {
  const byId = new Map<string, NodeSnapshot>();
  const byParent = new Map<string | undefined, NodeSnapshot[]>();

  doc.artboards.forEach((artboard, artboardIndex) => {
    const path = ["artboards", String(artboardIndex)];
    const snapshot: NodeSnapshot = {
      node: artboard,
      parentId: undefined,
      index: artboardIndex,
      path,
    };
    byId.set(artboard.id, snapshot);
    addToParent(byParent, undefined, snapshot);

    indexChildren(
      artboard.children ?? [],
      artboard.id,
      path.concat("children"),
      byId,
      byParent
    );
  });

  return { byId, byParent };
}

function indexChildren(
  children: NodeType[],
  parentId: string,
  parentPath: string[],
  byId: Map<string, NodeSnapshot>,
  byParent: Map<string | undefined, NodeSnapshot[]>
): void {
  children.forEach((child, childIndex) => {
    const path = parentPath.concat(String(childIndex));
    const snapshot: NodeSnapshot = {
      node: child,
      parentId,
      index: childIndex,
      path,
    };
    byId.set(child.id, snapshot);
    addToParent(byParent, parentId, snapshot);

    if (child.type === "frame" && child.children) {
      indexChildren(
        child.children,
        child.id,
        path.concat("children"),
        byId,
        byParent
      );
    }
  });
}

function addToParent(
  byParent: Map<string | undefined, NodeSnapshot[]>,
  parentId: string | undefined,
  snapshot: NodeSnapshot
): void {
  const list = byParent.get(parentId) ?? [];
  list.push(snapshot);
  byParent.set(parentId, list);
}

/**
 * Produce canonical string path for display/logging
 */
export function formatPath(path: string[]): string {
  return path.reduce((acc, segment, index) => {
    if (/^\d+$/.test(segment)) {
      return `${acc}[${segment}]`;
    }
    return index === 0 ? segment : `${acc}.${segment}`;
  }, "");
}

/**
 * Stable conflict ordering for deterministic results
 */
export function sortConflicts(conflicts: Conflict[]): Conflict[] {
  return [...conflicts].sort((a, b) => {
    const pathA = formatPath(a.path);
    const pathB = formatPath(b.path);
    if (pathA < pathB) {
      return -1;
    }
    if (pathA > pathB) {
      return 1;
    }
    if (a.code < b.code) {
      return -1;
    }
    if (a.code > b.code) {
      return 1;
    }
    return a.id.localeCompare(b.id);
  });
}

/**
 * Generate unique conflict ID
 */
export function generateConflictId(): string {
  return ulid();
}
