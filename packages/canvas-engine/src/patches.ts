/**
 * @fileoverview JSON Patch operations for canvas documents
 * @author @darianrosebrook
 */

import type { CanvasDocumentType } from "@paths-design/canvas-schema";
import type { JsonPatch, DocumentPatch } from "./types.js";

/**
 * Apply a JSON Patch to a document
 */
export function applyPatch(
  document: CanvasDocumentType,
  patch: JsonPatch
): CanvasDocumentType {
  const result = JSON.parse(JSON.stringify(document));

  switch (patch.op) {
    case "add":
      return applyAdd(result, patch);
    case "remove":
      return applyRemove(result, patch);
    case "replace":
      return applyReplace(result, patch);
    case "move":
      return applyMove(result, patch);
    case "copy":
      return applyCopy(result, patch);
    case "test":
      return applyTest(result, patch) ? result : document;
    default:
      throw new Error(`Unknown patch operation: ${(patch as any).op}`);
  }
}

/**
 * Apply multiple patches to a document
 */
export function applyPatches(
  document: CanvasDocumentType,
  patches: JsonPatch[]
): CanvasDocumentType {
  let result = document;

  for (const patch of patches) {
    result = applyPatch(result, patch);
  }

  return result;
}

/**
 * Apply an 'add' operation
 */
function applyAdd(
  document: CanvasDocumentType,
  patch: JsonPatch
): CanvasDocumentType {
  if (!patch.path) {
    throw new Error("Add operation requires a path");
  }

  const { parent, key } = getParentAndKey(document, patch.path);

  if (key === null) {
    // Adding to root
    (document as any)[patch.path.substring(1)] = patch.value;
  } else if (typeof key === "number") {
    // Adding to array
    parent.splice(key, 0, patch.value);
  } else {
    // Adding to object
    parent[key] = patch.value;
  }

  return document;
}

/**
 * Apply a 'remove' operation
 */
function applyRemove(
  document: CanvasDocumentType,
  patch: JsonPatch
): CanvasDocumentType {
  if (!patch.path) {
    throw new Error("Remove operation requires a path");
  }

  const { parent, key } = getParentAndKey(document, patch.path);

  if (key === null) {
    // Removing from root
    delete (document as any)[patch.path.substring(1)];
  } else if (typeof key === "number") {
    // Removing from array
    parent.splice(key, 1);
  } else {
    // Removing from object
    delete parent[key];
  }

  return document;
}

/**
 * Apply a 'replace' operation
 */
function applyReplace(
  document: CanvasDocumentType,
  patch: JsonPatch
): CanvasDocumentType {
  if (!patch.path) {
    throw new Error("Replace operation requires a path");
  }

  const { parent, key } = getParentAndKey(document, patch.path);

  if (key === null) {
    // Replacing root
    return patch.value as CanvasDocumentType;
  } else if (typeof key === "number") {
    // Replacing in array
    parent[key] = patch.value;
  } else {
    // Replacing in object
    parent[key] = patch.value;
  }

  return document;
}

/**
 * Apply a 'move' operation
 */
function applyMove(
  document: CanvasDocumentType,
  patch: JsonPatch
): CanvasDocumentType {
  if (!patch.path || !patch.from) {
    throw new Error("Move operation requires path and from");
  }

  // Get the value to move
  const value = getValueAtPath(document, patch.from);
  if (value === undefined) {
    throw new Error(`Source path not found: ${patch.from}`);
  }

  // Remove from source location
  const removePatch: JsonPatch = { op: "remove", path: patch.from };
  let result = applyPatch(document, removePatch);

  // Add to destination location
  const addPatch: JsonPatch = { op: "add", path: patch.path, value };
  result = applyPatch(result, addPatch);

  return result;
}

/**
 * Apply a 'copy' operation
 */
function applyCopy(
  document: CanvasDocumentType,
  patch: JsonPatch
): CanvasDocumentType {
  if (!patch.path || !patch.from) {
    throw new Error("Copy operation requires path and from");
  }

  // Get the value to copy
  const value = getValueAtPath(document, patch.from);
  if (value === undefined) {
    throw new Error(`Source path not found: ${patch.from}`);
  }

  // Add to destination location (don't remove from source)
  return applyAdd(document, { op: "add", path: patch.path, value });
}

/**
 * Apply a 'test' operation
 */
function applyTest(document: CanvasDocumentType, patch: JsonPatch): boolean {
  if (!patch.path) {
    throw new Error("Test operation requires a path");
  }

  const value = getValueAtPath(document, patch.path);
  return JSON.stringify(value) === JSON.stringify(patch.value);
}

/**
 * Get the parent object and key for a given path
 */
function getParentAndKey(
  document: CanvasDocumentType,
  path: string
): {
  parent: any;
  key: string | number | null;
} {
  const pathParts = path.substring(1).split("/").filter(Boolean);

  if (pathParts.length === 0) {
    return { parent: null, key: null };
  }

  let current: any = document;

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
    return { parent: current, key: current.length };
  } else if (/^\d+$/.test(lastPart)) {
    return { parent: current, key: parseInt(lastPart, 10) };
  } else {
    return { parent: current, key: lastPart };
  }
}

/**
 * Get value at a JSON Pointer path
 */
function getValueAtPath(obj: any, path: string): any {
  if (path === "") {
    return obj;
  }

  const pathParts = path.substring(1).split("/").filter(Boolean);
  let current = obj;

  for (const part of pathParts) {
    if (current == null) {return undefined;}

    if (part === "-") {
      current = current[current.length - 1];
    } else if (/^\d+$/.test(part)) {
      current = current[parseInt(part, 10)];
    } else {
      current = current[part];
    }
  }

  return current;
}

/**
 * Create a patch that undoes another patch
 */
export function createReversePatch(patch: JsonPatch): JsonPatch {
  switch (patch.op) {
    case "add":
      return { op: "remove", path: patch.path };
    case "remove":
      return { op: "add", path: patch.path, value: patch.value };
    case "replace":
      return { op: "replace", path: patch.path, value: patch.value };
    case "move":
      return { op: "move", path: patch.from!, from: patch.path };
    case "copy":
      return { op: "remove", path: patch.path };
    case "test":
      return patch; // Test operations are idempotent
    default:
      throw new Error(`Cannot reverse unknown operation: ${(patch as any).op}`);
  }
}

/**
 * Apply multiple patches and generate reverse patches
 */
export function applyPatchesWithReverse(
  document: CanvasDocumentType,
  patches: JsonPatch[]
): DocumentPatch {
  const reversePatches = patches.map(createReversePatch);
  const newDocument = applyPatches(document, patches);

  return {
    document: newDocument,
    patches,
    reversePatches,
  };
}
