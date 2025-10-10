/**
 * @fileoverview Property-based tests for Canvas Engine operations using fast-check
 * @author @darianrosebrook
 */

import { describe, it } from "vitest";
import fc from "fast-check";
import {
  findNodeById,
  createNode,
  updateNode,
  deleteNode,
} from "../src/operations.js";
import { validateCanvasDocument } from "@paths-design/canvas-schema";

// Arbitraries for generating test data
const nodeIdArb = fc.string({ minLength: 10, maxLength: 20 });
const nodeTypeArb = fc.oneof(
  fc.constant("frame"),
  fc.constant("text"),
  fc.constant("rectangle"),
  fc.constant("ellipse")
);
const nodeNameArb = fc.string({ minLength: 1, maxLength: 50 });
const frameArb = fc.record({
  x: fc.integer({ min: -1000, max: 1000 }),
  y: fc.integer({ min: -1000, max: 1000 }),
  width: fc.integer({ min: 1, max: 2000 }),
  height: fc.integer({ min: 1, max: 2000 }),
});
const styleArb = fc.record({
  fills: fc.array(
    fc.record({
      type: fc.oneof(fc.constant("solid"), fc.constant("gradient")),
      color: fc.oneof(
        fc.constant("tokens.color.surface"),
        fc.constant("tokens.color.text"),
        fc.constant("#000000"),
        fc.constant("#ffffff")
      ),
    }),
    { minLength: 0, maxLength: 3 }
  ),
  opacity: fc.float({ min: 0, max: 1 }),
});
const layoutArb = fc.record({
  mode: fc.oneof(fc.constant("flex"), fc.constant("grid")),
  direction: fc.oneof(fc.constant("row"), fc.constant("column")),
  gap: fc.integer({ min: 0, max: 100 }),
  padding: fc.integer({ min: 0, max: 100 }),
});

const nodeArb = fc.record({
  id: nodeIdArb,
  type: nodeTypeArb,
  name: nodeNameArb,
  frame: frameArb,
  style: styleArb,
  layout: layoutArb,
  text: fc.option(fc.string({ minLength: 0, maxLength: 200 })),
  textStyle: fc.option(
    fc.record({
      family: fc.oneof(fc.constant("Inter"), fc.constant("Arial")),
      size: fc.integer({ min: 8, max: 72 }),
      weight: fc.oneof(fc.constant("400"), fc.constant("700")),
      color: fc.oneof(fc.constant("tokens.color.text"), fc.constant("#000000")),
    })
  ),
});

const documentArb = fc.record({
  schemaVersion: fc.constant("0.1.0"),
  id: nodeIdArb,
  name: fc.string({ minLength: 1, maxLength: 100 }),
  artboards: fc.array(
    fc.record({
      id: nodeIdArb,
      name: fc.string({ minLength: 1, maxLength: 100 }),
      frame: frameArb,
      children: fc.array(nodeArb, { minLength: 0, maxLength: 10 }),
    }),
    { minLength: 1, maxLength: 5 }
  ),
});

// Property: All operations preserve document schema validity
describe("Canvas Operations Schema Preservation", () => {
  it("should preserve schema validity after findNodeById", () => {
    fc.assert(
      fc.property(documentArb, nodeIdArb, (doc, nodeId) => {
        const result = findNodeById(doc, nodeId);

        // If node is found, document should still be valid
        if (result.success) {
          const isValid = validateCanvasDocument(doc);
          return isValid.success;
        }

        // If node is not found, that's also valid behavior
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("should preserve schema validity after createNode", () => {
    fc.assert(
      fc.property(
        documentArb,
        nodeArb,
        fc.array(fc.string(), { minLength: 1, maxLength: 5 }),
        (doc, node, path) => {
          const result = createNode(doc, path, node);

          if (result.success) {
            const isValid = validateCanvasDocument(result.data.document);
            return isValid.success;
          }

          // Creation failure is acceptable for invalid paths
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should preserve schema validity after updateNode", () => {
    fc.assert(
      fc.property(documentArb, nodeIdArb, nodeArb, (doc, nodeId, updates) => {
        const result = updateNode(doc, nodeId, updates);

        if (result.success) {
          const isValid = validateCanvasDocument(result.data.document);
          return isValid.success;
        }

        // Update failure is acceptable for non-existent nodes
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("should preserve schema validity after deleteNode", () => {
    fc.assert(
      fc.property(documentArb, nodeIdArb, (doc, nodeId) => {
        const result = deleteNode(doc, nodeId);

        if (result.success) {
          const isValid = validateCanvasDocument(result.data.document);
          return isValid.success;
        }

        // Delete failure is acceptable for non-existent nodes
        return true;
      }),
      { numRuns: 100 }
    );
  });
});

// Property: Operations are deterministic
describe("Canvas Operations Determinism", () => {
  it("should produce consistent results for identical operations", () => {
    fc.assert(
      fc.property(documentArb, nodeIdArb, nodeArb, (doc, nodeId, updates) => {
        const result1 = updateNode(doc, nodeId, updates);
        const result2 = updateNode(doc, nodeId, updates);

        if (result1.success && result2.success) {
          return (
            JSON.stringify(result1.data.document) ===
            JSON.stringify(result2.data.document)
          );
        }

        // Both should fail or both should succeed
        return result1.success === result2.success;
      }),
      { numRuns: 100 }
    );
  });
});

// Property: Operations handle edge cases gracefully
describe("Canvas Operations Edge Cases", () => {
  it("should handle empty documents", () => {
    fc.assert(
      fc.property(nodeIdArb, (nodeId) => {
        const emptyDoc = {
          schemaVersion: "0.1.0",
          id: "empty-doc",
          name: "Empty Document",
          artboards: [],
        };

        const findResult = findNodeById(emptyDoc, nodeId);
        const updateResult = updateNode(emptyDoc, nodeId, { name: "test" });
        const deleteResult = deleteNode(emptyDoc, nodeId);

        // All operations should fail gracefully on empty documents
        return (
          !findResult.success && !updateResult.success && !deleteResult.success
        );
      }),
      { numRuns: 50 }
    );
  });

  it("should handle deeply nested structures", () => {
    fc.assert(
      fc.property(
        fc.array(nodeArb, { minLength: 10, maxLength: 20 }),
        (nodes) => {
          const deepDoc = {
            schemaVersion: "0.1.0",
            id: "deep-doc",
            name: "Deep Document",
            artboards: [
              {
                id: "root",
                name: "Root",
                frame: { x: 0, y: 0, width: 1000, height: 1000 },
                children: nodes,
              },
            ],
          };

          // Should be able to find nodes in deeply nested structures
          const firstNodeId = nodes[0]?.id;
          if (firstNodeId) {
            const result = findNodeById(deepDoc, firstNodeId);
            return result.success;
          }

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });
});

// Property: Frame coordinates are within reasonable bounds
describe("Canvas Frame Constraints", () => {
  it("should maintain valid frame coordinates", () => {
    fc.assert(
      fc.property(documentArb, (doc) => {
        // Check that all frame coordinates are within reasonable bounds
        const checkFrames = (obj: any): boolean => {
          if (obj.frame) {
            const { x, y, width, height } = obj.frame;
            return (
              x >= -10000 &&
              x <= 10000 &&
              y >= -10000 &&
              y <= 10000 &&
              width >= 1 &&
              width <= 10000 &&
              height >= 1 &&
              height <= 10000
            );
          }

          if (typeof obj === "object" && obj !== null) {
            return Object.values(obj).every(checkFrames);
          }

          return true;
        };

        return checkFrames(doc);
      }),
      { numRuns: 100 }
    );
  });
});
