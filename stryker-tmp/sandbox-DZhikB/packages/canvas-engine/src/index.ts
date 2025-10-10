/**
 * @fileoverview Main entry point for Canvas Engine package
 * @author @darianrosebrook
 */

// Export types
export * from "./types.js";

// Export operations
export * from "./operations.js";

// Export traversal
export * from "./traversal.js";

// Export hit testing
export * from "./hit-testing.js";

// Export patches
export * from "./patches.js";

// Export observability
export * from "./observability.js";

// Re-export commonly used functions from schema
export {
  generateNodeId,
  isValidUlid,
  validateCanvasDocument,
  CanvasDocument,
  Node,
  Artboard,
} from "@paths-design/canvas-schema";
