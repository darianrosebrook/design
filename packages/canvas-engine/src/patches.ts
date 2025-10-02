/**
 * @fileoverview JSON Patch operations for canvas documents
 * @author @darianrosebrook
 */

import type { CanvasDocumentType } from "@paths-design/canvas-schema";
import { observability } from "./observability.js";
import type { JsonPatch, DocumentPatch } from "./types.js";

/**
 * Apply a JSON Patch to a document
 */
export function applyPatch(
  document: CanvasDocumentType,
  patch: JsonPatch
): CanvasDocumentType {
  // Log operation start
  observability.log("info", "engine.operation.start", {
    operation: "applyPatch",
    documentId: document.id,
    patchOp: patch.op,
    patchPath: patch.path,
  });

  const startTime = performance.now();

  try {
    const result = JSON.parse(JSON.stringify(document));

    let finalResult: CanvasDocumentType;
    switch (patch.op) {
      case "add":
        finalResult = applyAdd(result, patch);
        break;
      case "remove":
        finalResult = applyRemove(result, patch);
        break;
      case "replace":
        finalResult = applyReplace(result, patch);
        break;
      case "move":
        finalResult = applyMove(result, patch);
        break;
      case "copy":
        finalResult = applyCopy(result, patch);
        break;
      case "test":
        finalResult = applyTest(result, patch) ? result : document;
        break;
      default:
        throw new Error(`Unknown patch operation: ${(patch as any).op}`);
    }

    // Log operation complete
    const duration = performance.now() - startTime;
    observability.recordOperation("applyPatch", duration);

    observability.log("info", "engine.operation.complete", {
      operation: "applyPatch",
      duration_ms: Math.round(duration),
      documentId: document.id,
      patchOp: patch.op,
    });

    return finalResult;
  } catch (error) {
    const duration = performance.now() - startTime;
    observability.recordOperation("applyPatch", duration);

    observability.log("error", "engine.operation.error", {
      operation: "applyPatch",
      error: error instanceof Error ? error.message : String(error),
      duration_ms: Math.round(duration),
      documentId: document.id,
      patchOp: patch.op,
    });

    throw error;
  }
}

/**
 * Apply multiple patches to a document
 */
export function applyPatches(
  document: CanvasDocumentType,
  patches: JsonPatch[]
): CanvasDocumentType {
  // Log operation start
  observability.log("info", "engine.operation.start", {
    operation: "applyPatches",
    documentId: document.id,
    patchCount: patches.length,
    patchOps: patches.map((p) => p.op),
  });

  const startTime = performance.now();

  try {
    let result = document;

    for (const patch of patches) {
      result = applyPatch(result, patch);
    }

    // Log operation complete
    const duration = performance.now() - startTime;
    observability.recordOperation("applyPatches", duration);

    observability.log("info", "engine.operation.complete", {
      operation: "applyPatches",
      duration_ms: Math.round(duration),
      documentId: document.id,
      patchCount: patches.length,
    });

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    observability.recordOperation("applyPatches", duration);

    observability.log("error", "engine.operation.error", {
      operation: "applyPatches",
      error: error instanceof Error ? error.message : String(error),
      duration_ms: Math.round(duration),
      documentId: document.id,
      patchCount: patches.length,
    });

    throw error;
  }
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
  } else if (parent === null || parent === undefined) {
    // Path doesn't exist, cannot replace
    throw new Error(`Path not found: ${patch.path}`);
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
  console.log("applyMove called with:", patch);
  if (!patch.path || !patch.from) {
    throw new Error("Move operation requires path and from");
  }

  // Get the value to move
  const value = getValueAtPath(document, patch.from);
  console.log("Value to move:", value);
  if (value === undefined) {
    throw new Error(`Source path not found: ${patch.from}`);
  }

  // Parse paths to understand the move operation
  const fromPath = patch.from.split("/").filter(Boolean);
  const toPath = patch.path.split("/").filter(Boolean);

  // If moving within the same array, adjust the destination index
  if (
    fromPath.length === toPath.length &&
    fromPath.slice(0, -1).join("/") === toPath.slice(0, -1).join("/")
  ) {
    const fromIndex = parseInt(fromPath[fromPath.length - 1]);
    const toIndex = parseInt(toPath[toPath.length - 1]);

    console.log("Path adjustment: fromIndex:", fromIndex, "toIndex:", toIndex);
    if (fromIndex < toIndex) {
      // Adjust destination index since we're removing from before the destination
      toPath[toPath.length - 1] = (toIndex - 1).toString();
      patch.path = "/" + toPath.join("/");
      console.log("Adjusted path:", patch.path);
    }
  }

  // Remove from source location (direct implementation to avoid recursion)
  const { parent: fromParent, key: fromKey } = getParentAndKey(
    document,
    patch.from
  );
  console.log("From parent:", fromParent, "From key:", fromKey);
  if (fromParent === null || fromKey === null) {
    throw new Error(`Source path not found: ${patch.from}`);
  }

  let result = { ...document };
  if (typeof fromKey === "number") {
    // Removing from array
    const newArray = [
      ...(fromParent as any[]).slice(0, fromKey),
      ...(fromParent as any[]).slice(fromKey + 1),
    ];
    const parentPath = "/" + fromPath.slice(0, -1).join("/");
    console.log(
      "Removing from array, parentPath:",
      parentPath,
      "newArray:",
      newArray.map((c) => c.name)
    );
    result = setValueAtPath(result, parentPath, newArray);
  } else {
    // Removing from object
    const newObj = { ...fromParent };
    delete newObj[fromKey];
    const parentPath = "/" + fromPath.slice(0, -1).join("/");
    console.log(
      "Removing from object, parentPath:",
      parentPath,
      "newObj:",
      newObj
    );
    result = setValueAtPath(result, parentPath, newObj);
  }

  // Add to destination location (direct implementation to avoid recursion)
  const { parent: toParent, key: toKey } = getParentAndKey(result, patch.path);
  if (toParent === null || toKey === null) {
    throw new Error(`Destination path not found: ${patch.path}`);
  }

  if (typeof toKey === "number") {
    // Adding to array
    const newArray = [
      ...(toParent as any[]).slice(0, toKey),
      value,
      ...(toParent as any[]).slice(toKey),
    ];
    const parentPath = "/" + toPath.slice(0, -1).join("/");
    console.log(
      "Adding to array, parentPath:",
      parentPath,
      "newArray:",
      newArray.map((c) => c.name)
    );
    result = setValueAtPath(result, parentPath, newArray);
  } else {
    // Adding to object
    const newObj = { ...toParent, [toKey]: value };
    const parentPath = "/" + toPath.slice(0, -1).join("/");
    console.log("Adding to object, parentPath:", parentPath, "newObj:", newObj);
    result = setValueAtPath(result, parentPath, newObj);
  }

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
 * Set a value at a given path in the document
 */
function setValueAtPath(
  document: CanvasDocumentType,
  path: string,
  value: any
): CanvasDocumentType {
  console.log("setValueAtPath called with path:", path, "value:", value);
  if (path === "/" || path === "") {
    return value;
  }

  const result = JSON.parse(JSON.stringify(document)); // Deep clone
  const pathParts = path.substring(1).split("/").filter(Boolean);
  let current: any = result;

  // Navigate to the parent of the target
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];

    if (current == null) {
      throw new Error(`Path not found: ${path}`);
    }

    if (part === "-") {
      current = current[current.length - 1];
    } else if (/^\d+$/.test(part)) {
      current = current[parseInt(part, 10)];
    } else {
      current = current[part];
    }
  }

  const lastPart = pathParts[pathParts.length - 1];

  if (current == null) {
    throw new Error(`Path not found: ${path}`);
  }

  if (lastPart === "-") {
    current.push(value);
  } else if (/^\d+$/.test(lastPart)) {
    current[parseInt(lastPart, 10)] = value;
  } else {
    current[lastPart] = value;
  }

  return result;
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
    if (current == null) {
      return undefined;
    }

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

/**
 * Invert a single patch operation
 */
export function invertPatch(patch: JsonPatch): JsonPatch {
  switch (patch.op) {
    case "add":
      return {
        op: "remove",
        path: patch.path,
      };

    case "remove":
      return {
        op: "add",
        path: patch.path,
        value: patch.value, // Would need original value in real implementation
      };

    case "replace":
      return {
        op: "replace",
        path: patch.path,
        value: patch.value, // Would need original value in real implementation
      };

    case "move":
      return {
        op: "move",
        from: patch.path,
        path: patch.from || "",
      };

    case "copy":
      return {
        op: "remove",
        path: patch.path,
      };

    case "test":
      return {
        op: "test",
        path: patch.path,
        value: patch.value, // Would need original value in real implementation
      };

    default:
      throw new Error(
        `Cannot invert unknown patch operation: ${(patch as any).op}`
      );
  }
}

/**
 * Invert multiple patches (in reverse order)
 */
export function invertPatches(patches: JsonPatch[]): JsonPatch[] {
  return patches.slice().reverse().map(invertPatch);
}
