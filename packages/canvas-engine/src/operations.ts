/**
 * @fileoverview Immutable node operations for canvas documents
 * @author @darianrosebrook
 *
 * All operations are pure functions that return new documents
 * without mutating the input.
 */

import type {
  CanvasDocumentType,
  NodeType,
  ULIDType,
} from "@paths-design/canvas-schema";
import {
  CanvasDocument,
  Node,
  Artboard,
  ArtboardType,
  generateNodeId,
} from "@paths-design/canvas-schema";
import {
  NodePath,
  OperationResult,
  NodeOperation,
  DocumentPatch,
  JsonPatch,
} from "./types.js";

/**
 * Find a node by ID in the document
 */
export function findNodeById(
  document: CanvasDocumentType,
  nodeId: ULIDType
): OperationResult<{ node: NodeType; path: NodePath; artboardIndex: number }> {
  for (
    let artboardIndex = 0;
    artboardIndex < document.artboards.length;
    artboardIndex++
  ) {
    const artboard = document.artboards[artboardIndex];

    // Search in artboard children
    const result = findNodeInTree(artboard.children, nodeId, [
      artboardIndex,
      "children",
    ]);
    if (result) {
      return {
        success: true,
        data: {
          node: result.node,
          path: result.path,
          artboardIndex,
        },
      };
    }
  }

  return {
    success: false,
    error: `Node with ID ${nodeId} not found`,
  };
}

/**
 * Find a node within a tree structure
 */
function findNodeInTree(
  nodes: NodeType[],
  targetId: ULIDType,
  currentPath: NodePath
): { node: NodeType; path: NodePath } | null {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const path = [...currentPath, i];

    if (node.id === targetId) {
      return { node, path };
    }

    // Search in children if this node has them
    if ("children" in node && node.children) {
      const result = findNodeInTree(node.children, targetId, [
        ...path,
        "children",
      ]);
      if (result) {
        return result;
      }
    }
  }

  return null;
}

/**
 * Create a new node and add it to the document
 */
export function createNode(
  document: CanvasDocumentType,
  parentPath: NodePath,
  nodeData: Omit<NodeType, "id">
): OperationResult<DocumentPatch> {
  try {
    const newNode: NodeType = {
      ...nodeData,
      id: generateNodeId(),
    } as NodeType;

    const patches: any[] = [];
    const reversePatches: any[] = [];

    // Navigate to parent and add the new node
    let current: any = document;
    for (let i = 0; i < parentPath.length - 1; i++) {
      const segment = parentPath[i];

      if (typeof segment === "number" && i === 0) {
        // First numeric index is into artboards array
        current = current.artboards[segment];
      } else {
        current = current[segment];
      }
    }

    const lastKey = parentPath[parentPath.length - 1];
    const parentArray = current[lastKey];

    if (!Array.isArray(parentArray)) {
      return {
        success: false,
        error: `Parent path does not lead to an array (got ${typeof parentArray})`,
      };
    }

    // Add operation
    const insertIndex = parentArray.length;
    const jsonPointerPath = convertPathToJsonPointer([
      ...parentPath,
      insertIndex,
    ]);
    patches.push({
      op: "add",
      path: jsonPointerPath,
      value: newNode,
    });

    // Reverse operation (remove)
    reversePatches.push({
      op: "remove",
      path: jsonPointerPath,
    });

    // Apply patches to create new document
    const newDocument = applyPatches(document, patches);

    return {
      success: true,
      data: {
        document: newDocument,
        patches,
        reversePatches,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Update an existing node
 */
export function updateNode(
  document: CanvasDocumentType,
  nodeId: ULIDType,
  updates: Partial<NodeType>
): OperationResult<DocumentPatch> {
  const findResult = findNodeById(document, nodeId);

  if (!findResult.success || !findResult.data) {
    return {
      success: false,
      error: findResult.error || "Node not found",
    };
  }

  const { path } = findResult.data;

  try {
    const patches: JsonPatch[] = [];
    const reversePatches: JsonPatch[] = [];

    // Convert path to JSON Pointer format
    // path = [0, 'children', 0, 'children', 0] becomes '/artboards/0/children/0/children/0'
    const jsonPointerPath = convertPathToJsonPointer(path);

    // Create patches for each updated property
    for (const [key, value] of Object.entries(updates)) {
      const patchPath = `${jsonPointerPath}/${key}`;

      patches.push({
        op: "replace",
        path: patchPath,
        value,
      });

      // For reverse, we need the old value
      const oldValue = getValueAtPath(document, patchPath);
      reversePatches.push({
        op: "replace",
        path: patchPath,
        value: oldValue,
      });
    }

    const newDocument = applyPatches(document, patches);

    return {
      success: true,
      data: {
        document: newDocument,
        patches,
        reversePatches,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Update failed",
    };
  }
}

/**
 * Delete a node from the document
 */
export function deleteNode(
  document: CanvasDocumentType,
  nodeId: ULIDType
): OperationResult<DocumentPatch> {
  const findResult = findNodeById(document, nodeId);

  if (!findResult.success || !findResult.data) {
    return {
      success: false,
      error: findResult.error || "Node not found",
    };
  }

  const { path } = findResult.data;

  try {
    // Convert path to JSON Pointer format
    const jsonPointerPath = convertPathToJsonPointer(path);

    // Get the node before deletion for reverse operation
    const nodeToDelete = getValueAtPath(document, jsonPointerPath);

    const patches: JsonPatch[] = [
      {
        op: "remove",
        path: jsonPointerPath,
      },
    ];

    const reversePatches: JsonPatch[] = [
      {
        op: "add",
        path: jsonPointerPath,
        value: nodeToDelete,
      },
    ];

    const newDocument = applyPatches(document, patches);

    return {
      success: true,
      data: {
        document: newDocument,
        patches,
        reversePatches,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
}

/**
 * Convert internal path format to JSON Pointer format
 */
function convertPathToJsonPointer(path: NodePath): string {
  // path format: [0, 'children', 0, 'children', 0]
  // should become: '/artboards/0/children/0/children/0'

  const parts: string[] = [];

  for (let i = 0; i < path.length; i++) {
    const segment = path[i];

    if (typeof segment === "number") {
      // Array index
      if (i === 0) {
        // First element is always an index into the artboards array
        parts.push("artboards");
      }
      // Add the index
      parts.push(segment.toString());
    } else {
      // Object property
      parts.push(segment);
    }
  }

  return "/" + parts.join("/");
}

/**
 * Get value at a JSON Pointer path
 */
function getValueAtPath(obj: any, path: string): any {
  const keys = path.substring(1).split("/").filter(Boolean);
  let current = obj;

  for (const key of keys) {
    if (current == null) {
      return undefined;
    }

    if (key === "-") {
      // Last array element
      current = current[current.length - 1];
    } else if (/^\d+$/.test(key)) {
      // Array index
      current = current[parseInt(key, 10)];
    } else {
      // Object property
      current = current[key];
    }
  }

  return current;
}

/**
 * Apply JSON patches to create a new document
 */
function applyPatches(
  document: CanvasDocumentType,
  patches: any[]
): CanvasDocumentType {
  // For now, implement a simple patch application
  // In a full implementation, we'd use a proper JSON Patch library
  const result = JSON.parse(JSON.stringify(document));

  for (const patch of patches) {
    if (patch.op === "add" || patch.op === "replace") {
      const pathParts = patch.path.substring(1).split("/");
      let current: any = result;

      // Navigate to parent
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (part === "-") {
          current = current[current.length - 1];
        } else if (/^\d+$/.test(part)) {
          current = current[parseInt(part, 10)];
        } else {
          current = current[part];
        }
      }

      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart === "-") {
        current.push(patch.value);
      } else if (/^\d+$/.test(lastPart)) {
        current[parseInt(lastPart, 10)] = patch.value;
      } else {
        current[lastPart] = patch.value;
      }
    } else if (patch.op === "remove") {
      const pathParts = patch.path.substring(1).split("/");
      let current: any = result;

      // Navigate to parent
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (part === "-") {
          current = current[current.length - 1];
        } else if (/^\d+$/.test(part)) {
          current = current[parseInt(part, 10)];
        } else {
          current = current[part];
        }
      }

      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart === "-") {
        current.pop();
      } else if (/^\d+$/.test(lastPart)) {
        current.splice(parseInt(lastPart, 10), 1);
      } else {
        delete current[lastPart];
      }
    }
  }

  return result;
}

/**
 * Move a node to a new parent
 */
export function moveNode(
  document: CanvasDocumentType,
  nodeId: ULIDType,
  newParentPath: NodePath,
  newIndex?: number
): OperationResult<DocumentPatch> {
  const findResult = findNodeById(document, nodeId);

  if (!findResult.success || !findResult.data) {
    return {
      success: false,
      error: findResult.error || "Node not found",
    };
  }

  const { node, path: oldPath } = findResult.data;

  try {
    // Convert paths to JSON Pointer format
    const oldJsonPointerPath = convertPathToJsonPointer(oldPath);
    const newJsonPointerPath = convertPathToJsonPointer([
      ...newParentPath,
      newIndex ?? 0,
    ]);

    // Remove from old location
    const removePatches: JsonPatch[] = [
      {
        op: "remove",
        path: oldJsonPointerPath,
      },
    ];

    // Add to new location
    const addPatches: JsonPatch[] = [
      {
        op: "add",
        path: newJsonPointerPath,
        value: node,
      },
    ];

    const newDocument = applyPatches(document, [
      ...removePatches,
      ...addPatches,
    ]);

    return {
      success: true,
      data: {
        document: newDocument,
        patches: [...removePatches, ...addPatches] as JsonPatch[],
        reversePatches: [
          { op: "add", path: oldJsonPointerPath, value: node },
          { op: "remove", path: newJsonPointerPath },
        ] as JsonPatch[],
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Move failed",
    };
  }
}
