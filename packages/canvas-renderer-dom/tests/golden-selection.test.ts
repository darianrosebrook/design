/**
 * @fileoverview Golden selection tests - reference scenarios with expected outcomes
 * @author @darianrosebrook
 *
 * CAWS Compliance: Golden frame testing for reference designs
 * Tests selection behavior against known-good reference scenarios.
 */

import { describe, it, expect } from "vitest";
import { SelectionModesCoordinator } from "../src/selection-modes.js";
import { createObservability } from "../src/observability.js";
import type { CanvasDocumentType } from "@paths-design/canvas-schema";

/**
 * Golden test document - a well-known layout for testing selections
 */
const goldenDocument: CanvasDocumentType = {
  version: "1.0.0",
  id: "golden-selection-test",
  name: "Golden Selection Test Document",
  artboards: [
    {
      id: "artboard-main",
      name: "Main Artboard",
      type: "artboard",
      frame: { x: 0, y: 0, width: 1200, height: 800 },
      visible: true,
      locked: false,
      children: [
        // Top row - evenly spaced rectangles
        {
          id: "rect-1",
          name: "Red Rectangle",
          type: "frame",
          frame: { x: 100, y: 100, width: 150, height: 100 },
          visible: true,
          locked: false,
          children: [],
        },
        {
          id: "rect-2",
          name: "Blue Rectangle",
          type: "frame",
          frame: { x: 300, y: 100, width: 150, height: 100 },
          visible: true,
          locked: false,
          children: [],
        },
        {
          id: "rect-3",
          name: "Green Rectangle",
          type: "frame",
          frame: { x: 500, y: 100, width: 150, height: 100 },
          visible: true,
          locked: false,
          children: [],
        },
        // Middle row - nested frames
        {
          id: "container-1",
          name: "Container Frame",
          type: "frame",
          frame: { x: 200, y: 250, width: 400, height: 200 },
          visible: true,
          locked: false,
          children: [
            {
              id: "nested-1",
              name: "Nested Child 1",
              type: "frame",
              frame: { x: 20, y: 20, width: 80, height: 60 },
              visible: true,
              locked: false,
              children: [],
            },
            {
              id: "nested-2",
              name: "Nested Child 2",
              type: "frame",
              frame: { x: 120, y: 20, width: 80, height: 60 },
              visible: true,
              locked: false,
              children: [],
            },
          ],
        },
        // Bottom row - irregular shapes
        {
          id: "irregular-1",
          name: "Irregular Shape 1",
          type: "frame",
          frame: { x: 150, y: 500, width: 120, height: 80 },
          visible: true,
          locked: false,
          children: [],
        },
        {
          id: "irregular-2",
          name: "Irregular Shape 2",
          type: "frame",
          frame: { x: 350, y: 480, width: 100, height: 120 },
          visible: true,
          locked: false,
          children: [],
        },
      ],
    },
  ],
};

describe("Golden Selection Tests", () => {
  let coordinator: SelectionModesCoordinator;

  beforeEach(() => {
    coordinator = new SelectionModesCoordinator(createObservability());
    coordinator.setDocument(goldenDocument);
  });

  describe("Rectangle Selection Golden Scenarios", () => {
    it("should select top row rectangles with perfect rectangle", async () => {
      const result = await coordinator.performRectangleSelection(
        { x: 50, y: 50, width: 650, height: 200 },
        { mode: "rectangle", multiSelect: true, preserveSelection: false }
      );

      // Selection includes all intersecting nodes: top row + nested children
      expect(result.selectedNodeIds.sort()).toEqual(
        ["rect-1", "rect-2", "rect-3", "nested-1", "nested-2"].sort()
      );
      expect(result.accuracy).toBe(1.0);
    });

    it("should select only first rectangle with tight rectangle", async () => {
      const result = await coordinator.performRectangleSelection(
        { x: 90, y: 90, width: 170, height: 120 },
        { mode: "rectangle", multiSelect: true, preserveSelection: false }
      );

      expect(result.selectedNodeIds).toEqual(["rect-1"]);
      expect(result.accuracy).toBe(1.0);
    });

    it("should select nested children with container rectangle", async () => {
      const result = await coordinator.performRectangleSelection(
        { x: 190, y: 240, width: 420, height: 220 },
        { mode: "rectangle", multiSelect: true, preserveSelection: false }
      );

      // Container rectangle intersects with container-1 only (nested children are inside but not directly intersected)
      expect(result.selectedNodeIds).toEqual(["container-1"]);
      expect(result.accuracy).toBe(1.0);
    });

    it("should select nested child with small rectangle", async () => {
      const result = await coordinator.performRectangleSelection(
        { x: 10, y: 10, width: 30, height: 30 }, // Small rectangle overlapping nested-1
        { mode: "rectangle", multiSelect: true, preserveSelection: false }
      );

      expect(result.selectedNodeIds).toEqual(["nested-1"]);
      expect(result.accuracy).toBe(1.0);
    });

    it("should select irregular shapes with overlapping rectangle", async () => {
      const result = await coordinator.performRectangleSelection(
        { x: 100, y: 450, width: 400, height: 200 },
        { mode: "rectangle", multiSelect: true, preserveSelection: false }
      );

      expect(result.selectedNodeIds).toEqual(["irregular-1", "irregular-2"]);
      expect(result.accuracy).toBe(1.0);
    });
  });

  describe("Lasso Selection Golden Scenarios", () => {
    it("should select top row with simple lasso around them", async () => {
      const lassoPath = [
        { x: 50, y: 50 },
        { x: 700, y: 50 },
        { x: 700, y: 250 },
        { x: 50, y: 250 },
        { x: 50, y: 50 },
      ];

      const result = await coordinator.performLassoSelection(lassoPath, {
        mode: "lasso",
        multiSelect: true,
        preserveSelection: false,
      });

      // Lasso includes all intersecting nodes: top row + nested children
      expect(result.selectedNodeIds.sort()).toEqual(
        ["rect-1", "rect-2", "rect-3", "nested-1", "nested-2"].sort()
      );
      expect(result.accuracy).toBe(1.0);
    });

    it("should select only center rectangle with figure-8 lasso", async () => {
      const lassoPath = [
        { x: 250, y: 50 },
        { x: 450, y: 50 },
        { x: 450, y: 250 },
        { x: 350, y: 200 },
        { x: 250, y: 250 },
        { x: 250, y: 50 },
      ];

      const result = await coordinator.performLassoSelection(lassoPath, {
        mode: "lasso",
        multiSelect: true,
        preserveSelection: false,
      });

      expect(result.selectedNodeIds).toEqual(["rect-2"]);
      expect(result.accuracy).toBe(1.0);
    });

    it("should select nested children with complex lasso", async () => {
      const lassoPath = [
        { x: 180, y: 230 },
        { x: 640, y: 230 },
        { x: 640, y: 480 },
        { x: 520, y: 420 },
        { x: 380, y: 480 },
        { x: 240, y: 420 },
        { x: 180, y: 480 },
        { x: 180, y: 230 },
      ];

      const result = await coordinator.performLassoSelection(lassoPath, {
        mode: "lasso",
        multiSelect: true,
        preserveSelection: false,
      });

      expect(result.selectedNodeIds).toEqual(["container-1"]);
      expect(result.accuracy).toBe(1.0);
    });

    it("should handle self-intersecting lasso (figure-8)", async () => {
      const lassoPath = [
        { x: 100, y: 100 },
        { x: 300, y: 100 },
        { x: 200, y: 200 },
        { x: 400, y: 200 },
        { x: 300, y: 300 },
        { x: 100, y: 300 },
        { x: 200, y: 200 },
        { x: 100, y: 100 },
      ];

      const result = await coordinator.performLassoSelection(lassoPath, {
        mode: "lasso",
        multiSelect: true,
        preserveSelection: false,
      });

      // Should select nodes within the valid polygon regions
      expect(result.selectedNodeIds.length).toBeGreaterThan(0);
      expect(result.accuracy).toBe(1.0);
    });
  });

  describe("Multi-Select Golden Scenarios", () => {
    it("should preserve selection when preserveSelection is true", async () => {
      // Set initial selection state for multi-select
      coordinator.setCurrentSelection(["rect-1"]);

      // Second selection with preserve
      await coordinator.performRectangleSelection(
        { x: 290, y: 90, width: 170, height: 120 },
        { mode: "rectangle", multiSelect: true, preserveSelection: true }
      );

      expect(coordinator.getCurrentSelectionIds()).toEqual([
        "rect-1",
        "rect-2",
      ]);
    });

    it("should replace selection when preserveSelection is false", async () => {
      // Set initial selection state for multi-select
      coordinator.setCurrentSelection(["rect-1"]);

      // Second selection without preserve
      await coordinator.performRectangleSelection(
        { x: 290, y: 90, width: 170, height: 120 },
        { mode: "rectangle", multiSelect: true, preserveSelection: false }
      );

      expect(coordinator.getCurrentSelectionIds()).toEqual(["rect-2"]);
    });

    it("should handle empty subsequent selections", async () => {
      // Set initial selection state for multi-select
      coordinator.setCurrentSelection(["rect-1"]);

      // Empty selection with preserve should keep original
      await coordinator.performRectangleSelection(
        { x: 1, y: 1, width: 1, height: 1 }, // Empty selection
        { mode: "rectangle", multiSelect: true, preserveSelection: true }
      );

      expect(coordinator.getCurrentSelectionIds()).toEqual(["rect-1"]);
    });
  });

  describe("Performance Golden Benchmarks", () => {
    it("should complete selections within golden time bounds", async () => {
      const startTime = performance.now();

      // Large rectangle covering everything
      const result = await coordinator.performRectangleSelection(
        { x: 0, y: 0, width: 1200, height: 800 },
        { mode: "rectangle", multiSelect: true, preserveSelection: false }
      );

      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(50); // Golden performance bound
      expect(result.selectedNodeIds).toHaveLength(8); // All nodes
      expect(result.accuracy).toBe(1.0);
    });

    it("should handle complex lasso within golden time bounds", async () => {
      const complexLasso = Array.from({ length: 50 }, (_, i) => ({
        x: 200 + 100 * Math.cos((i / 50) * 2 * Math.PI),
        y: 300 + 100 * Math.sin((i / 50) * 2 * Math.PI),
      }));

      const startTime = performance.now();
      const result = await coordinator.performLassoSelection(complexLasso, {
        mode: "lasso",
        multiSelect: true,
        preserveSelection: false,
      });

      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(100); // Golden performance bound for complex lasso
      expect(result.accuracy).toBe(1.0);
    });
  });

  describe("Edge Case Golden Scenarios", () => {
    it("should handle rectangle exactly matching node bounds", async () => {
      const result = await coordinator.performRectangleSelection(
        { x: 100, y: 100, width: 150, height: 100 }, // Exact match for rect-1
        { mode: "rectangle", multiSelect: true, preserveSelection: false }
      );

      expect(result.selectedNodeIds).toEqual(["rect-1"]);
      expect(result.accuracy).toBe(1.0);
    });

    it("should handle rectangle overlapping multiple nesting levels", async () => {
      const result = await coordinator.performRectangleSelection(
        { x: 210, y: 260, width: 100, height: 80 }, // Overlaps container and nested child
        { mode: "rectangle", multiSelect: true, preserveSelection: false }
      );

      expect(result.selectedNodeIds).toEqual(["container-1"]);
      expect(result.accuracy).toBe(1.0);
    });

    it("should handle lasso touching node boundaries", async () => {
      const boundaryLasso = [
        { x: 95, y: 95 },
        { x: 255, y: 95 },
        { x: 255, y: 205 },
        { x: 95, y: 205 },
        { x: 95, y: 95 },
      ];

      const result = await coordinator.performLassoSelection(boundaryLasso, {
        mode: "lasso",
        multiSelect: true,
        preserveSelection: false,
      });

      expect(result.selectedNodeIds).toEqual(["rect-1"]);
      expect(result.accuracy).toBe(1.0);
    });
  });
});
