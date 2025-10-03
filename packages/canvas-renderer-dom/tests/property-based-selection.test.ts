/**
 * @fileoverview Property-based tests for selection determinism
 * @author @darianrosebrook
 *
 * CAWS Compliance: Property-based testing for deterministic selection behavior
 * Ensures identical inputs produce identical selection results.
 */

import { describe, it } from "vitest";
import * as fc from "fast-check";
import { SelectionModesCoordinator } from "../src/selection-modes.js";
import { createObservability } from "../src/observability.js";
import type { CanvasDocumentType } from "@paths-design/canvas-schema";
import type {
  Point,
  Rectangle,
  SelectionModeConfig,
} from "../src/selection-modes.js";

/**
 * Arbitrary generators for property-based testing
 */
const rectangleArbitrary = fc.record({
  x: fc.float({ min: -1000, max: 1000 }).map(Math.fround),
  y: fc.float({ min: -1000, max: 1000 }).map(Math.fround),
  width: fc.float({ min: 1, max: 2000 }).map(Math.fround),
  height: fc.float({ min: 1, max: 2000 }).map(Math.fround),
});

const pointArbitrary = fc.record({
  x: fc.float({ min: -1000, max: 1000 }).map(Math.fround),
  y: fc.float({ min: -1000, max: 1000 }).map(Math.fround),
});

const lassoPathArbitrary = fc.array(pointArbitrary, {
  minLength: 3,
  maxLength: 20,
});

const selectionConfigArbitrary = fc.record({
  mode: fc.constantFrom(
    "rectangle" as const,
    "lasso" as const,
    "single" as const
  ),
  multiSelect: fc.boolean(),
  preserveSelection: fc.boolean(),
});

/**
 * Generate arbitrary canvas documents for testing
 */
const canvasDocumentArbitrary: fc.Arbitrary<CanvasDocumentType> = fc.record({
  version: fc.constant("1.0.0"),
  id: fc.string(),
  name: fc.string(),
  artboards: fc.array(
    fc.record({
      id: fc.string(),
      name: fc.string(),
      type: fc.constant("artboard"),
      frame: fc.record({
        x: fc.float({ min: -1000, max: 1000 }).map(Math.fround),
        y: fc.float({ min: -1000, max: 1000 }).map(Math.fround),
        width: fc.float({ min: 10, max: 2000 }).map(Math.fround),
        height: fc.float({ min: 10, max: 2000 }).map(Math.fround),
      }),
      visible: fc.boolean(),
      locked: fc.boolean(),
      children: fc.array(
        fc.record({
          id: fc.string(),
          name: fc.string(),
          type: fc.constant("frame"),
          frame: fc.record({
            x: fc.float({ min: -1000, max: 1000 }).map(Math.fround),
            y: fc.float({ min: -1000, max: 1000 }).map(Math.fround),
            width: fc.float({ min: 1, max: 1000 }).map(Math.fround),
            height: fc.float({ min: 1, max: 1000 }).map(Math.fround),
          }),
          visible: fc.boolean(),
          locked: fc.boolean(),
          children: fc.constant([]), // Keep simple for property testing
        }),
        { minLength: 0, maxLength: 10 }
      ),
    }),
    { minLength: 1, maxLength: 5 }
  ),
});

describe("Property-Based Selection Testing", () => {
  describe("Rectangle Selection Determinism", () => {
    it("should produce identical results for identical rectangle selections", async () => {
      await fc.assert(
        fc.asyncProperty(
          canvasDocumentArbitrary,
          rectangleArbitrary,
          selectionConfigArbitrary,
          async (document, rect, config) => {
            // Create two identical coordinators
            const coord1 = new SelectionModesCoordinator(createObservability());
            const coord2 = new SelectionModesCoordinator(createObservability());

            coord1.setDocument(document);
            coord2.setDocument(document);

            // Perform same selection twice
            const result1 = await coord1.performRectangleSelection(
              rect,
              config
            );
            const result2 = await coord2.performRectangleSelection(
              rect,
              config
            );

            // Results should be identical
            return (
              result1.selectedNodeIds.length ===
                result2.selectedNodeIds.length &&
              result1.selectedNodeIds.every(
                (id, index) => id === result2.selectedNodeIds[index]
              ) &&
              result1.accuracy === result2.accuracy
            );
          }
        ),
        {
          numRuns: 100,
          verbose: true,
        }
      );
    });

    it("should handle edge case rectangles", async () => {
      await fc.assert(
        fc.asyncProperty(
          canvasDocumentArbitrary,
          fc.record({
            x: fc.float().map(Math.fround),
            y: fc.float().map(Math.fround),
            width: fc
              .float({ min: Math.fround(0.1), max: 10000 })
              .map(Math.fround),
            height: fc
              .float({ min: Math.fround(0.1), max: 10000 })
              .map(Math.fround),
          }),
          selectionConfigArbitrary,
          async (document, rect, config) => {
            const coordinator = new SelectionModesCoordinator(
              createObservability()
            );
            coordinator.setDocument(document);

            // Should not throw errors for any valid rectangle
            const result = await coordinator.performRectangleSelection(
              rect,
              config
            );

            return (
              Array.isArray(result.selectedNodeIds) &&
              typeof result.accuracy === "number" &&
              typeof result.duration === "number" &&
              result.accuracy >= 0 &&
              result.accuracy <= 1 &&
              result.duration >= 0
            );
          }
        ),
        {
          numRuns: 50,
          verbose: true,
        }
      );
    });
  });

  describe("Lasso Selection Determinism", () => {
    it("should produce identical results for identical lasso selections", async () => {
      await fc.assert(
        fc.asyncProperty(
          canvasDocumentArbitrary,
          lassoPathArbitrary,
          selectionConfigArbitrary,
          async (document, path, config) => {
            const coord1 = new SelectionModesCoordinator(createObservability());
            const coord2 = new SelectionModesCoordinator(createObservability());

            coord1.setDocument(document);
            coord2.setDocument(document);

            const result1 = await coord1.performLassoSelection(path, config);
            const result2 = await coord2.performLassoSelection(path, config);

            return (
              result1.selectedNodeIds.length ===
                result2.selectedNodeIds.length &&
              result1.selectedNodeIds.every(
                (id, index) => id === result2.selectedNodeIds[index]
              ) &&
              result1.accuracy === result2.accuracy
            );
          }
        ),
        {
          numRuns: 100,
          verbose: true,
        }
      );
    });

    it("should handle complex lasso paths", async () => {
      await fc.assert(
        fc.asyncProperty(
          canvasDocumentArbitrary,
          fc.array(pointArbitrary, { minLength: 3, maxLength: 100 }), // Complex paths
          selectionConfigArbitrary,
          async (document, path, config) => {
            const coordinator = new SelectionModesCoordinator(
              createObservability()
            );
            coordinator.setDocument(document);

            const result = await coordinator.performLassoSelection(
              path,
              config
            );

            return (
              Array.isArray(result.selectedNodeIds) &&
              typeof result.accuracy === "number" &&
              typeof result.duration === "number" &&
              result.accuracy >= 0 &&
              result.accuracy <= 1 &&
              result.duration >= 0 &&
              result.duration < 1000 // Reasonable performance limit
            );
          }
        ),
        {
          numRuns: 50,
          verbose: true,
        }
      );
    });
  });

  describe("Selection Parameter Validation", () => {
    it("should validate rectangle parameters consistently", async () => {
      await fc.assert(
        fc.asyncProperty(
          canvasDocumentArbitrary,
          fc.record({
            x: fc.float(),
            y: fc.float(),
            width: fc.float(),
            height: fc.float(),
          }),
          async (document, rect) => {
            const coordinator = new SelectionModesCoordinator(
              createObservability()
            );
            coordinator.setDocument(document);

            const validation = coordinator.validateSelectionOperation(
              "rectangle",
              rect
            );

            // Validation should be consistent and return proper structure
            return (
              typeof validation.valid === "boolean" &&
              (validation.valid === true ||
                (validation.valid === false &&
                  typeof validation.error === "string"))
            );
          }
        ),
        {
          numRuns: 100,
          verbose: true,
        }
      );
    });

    it("should validate lasso parameters consistently", async () => {
      await fc.assert(
        fc.asyncProperty(
          canvasDocumentArbitrary,
          fc.array(pointArbitrary, { minLength: 0, maxLength: 50 }),
          async (document, path) => {
            const coordinator = new SelectionModesCoordinator(
              createObservability()
            );
            coordinator.setDocument(document);

            const validation = coordinator.validateSelectionOperation(
              "lasso",
              path
            );

            return (
              typeof validation.valid === "boolean" &&
              (validation.valid === true ||
                (validation.valid === false &&
                  typeof validation.error === "string"))
            );
          }
        ),
        {
          numRuns: 100,
          verbose: true,
        }
      );
    });
  });

  describe("Performance Bounds", () => {
    it("should complete rectangle selections within time bounds", async () => {
      await fc.assert(
        fc.asyncProperty(
          canvasDocumentArbitrary,
          rectangleArbitrary,
          selectionConfigArbitrary,
          async (document, rect, config) => {
            const coordinator = new SelectionModesCoordinator(
              createObservability()
            );
            coordinator.setDocument(document);

            const startTime = performance.now();
            const result = await coordinator.performRectangleSelection(
              rect,
              config
            );
            const duration = performance.now() - startTime;

            // Performance should be reasonable even for large documents
            return duration < 500 && result.duration < 500; // 500ms upper bound
          }
        ),
        {
          numRuns: 50,
          verbose: true,
        }
      );
    });

    it("should complete lasso selections within time bounds", async () => {
      await fc.assert(
        fc.asyncProperty(
          canvasDocumentArbitrary,
          lassoPathArbitrary,
          selectionConfigArbitrary,
          async (document, path, config) => {
            const coordinator = new SelectionModesCoordinator(
              createObservability()
            );
            coordinator.setDocument(document);

            const startTime = performance.now();
            const result = await coordinator.performLassoSelection(
              path,
              config
            );
            const duration = performance.now() - startTime;

            return duration < 500 && result.duration < 500;
          }
        ),
        {
          numRuns: 50,
          verbose: true,
        }
      );
    });
  });

  describe("Selection State Consistency", () => {
    it("should maintain consistent selection state across operations", async () => {
      await fc.assert(
        fc.asyncProperty(
          canvasDocumentArbitrary,
          fc.array(
            fc.record({
              type: fc.constantFrom("rectangle" as const, "lasso" as const),
              rect: rectangleArbitrary,
              path: lassoPathArbitrary,
              config: selectionConfigArbitrary,
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (document, operations) => {
            const coordinator = new SelectionModesCoordinator(
              createObservability()
            );
            coordinator.setDocument(document);

            // Perform sequence of operations
            for (const op of operations) {
              if (op.type === "rectangle") {
                await coordinator.performRectangleSelection(op.rect, op.config);
              } else {
                await coordinator.performLassoSelection(op.path, op.config);
              }
            }

            // Should not have corrupted internal state
            return true; // If we get here without throwing, state is consistent
          }
        ),
        {
          numRuns: 30,
          verbose: true,
        }
      );
    });
  });
});
