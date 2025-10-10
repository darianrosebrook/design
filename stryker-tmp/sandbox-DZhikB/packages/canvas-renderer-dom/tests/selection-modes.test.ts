/**
 * @fileoverview Tests for advanced selection modes
 * @author @darianrosebrook
 */

import { describe, it, expect, beforeEach } from "vitest";
import { SelectionModesCoordinator } from "../src/selection-modes.js";
import type {
  SelectionMode,
  Point,
  Rectangle,
  SelectionModeConfig,
} from "../src/selection-modes.js";
import type { CanvasDocumentType, NodeType } from "@paths-design/canvas-schema";
import { createObservability } from "../src/observability.js";

/**
 * Create a test canvas document with known node positions
 */
function createTestDocument(): CanvasDocumentType {
  return {
    version: "1.0.0",
    id: "test-doc",
    name: "Test Document",
    artboards: [
      {
        id: "artboard-1",
        name: "Test Artboard",
        type: "artboard",
        frame: { x: 0, y: 0, width: 1000, height: 800 },
        visible: true,
        locked: false,
        children: [
          {
            id: "node-1",
            name: "Node 1",
            type: "frame",
            frame: { x: 10, y: 10, width: 100, height: 100 },
            visible: true,
            locked: false,
            children: [],
          },
          {
            id: "node-2",
            name: "Node 2",
            type: "frame",
            frame: { x: 150, y: 10, width: 100, height: 100 },
            visible: true,
            locked: false,
            children: [],
          },
          {
            id: "node-3",
            name: "Node 3",
            type: "frame",
            frame: { x: 10, y: 150, width: 100, height: 100 },
            visible: true,
            locked: false,
            children: [],
          },
          {
            id: "node-4",
            name: "Node 4 (Hidden)",
            type: "frame",
            frame: { x: 150, y: 150, width: 100, height: 100 },
            visible: false, // Should not be selectable
            locked: false,
            children: [],
          },
          {
            id: "node-5",
            name: "Node 5 (Locked)",
            type: "frame",
            frame: { x: 300, y: 10, width: 100, height: 100 },
            visible: true,
            locked: true, // Should not be selectable
            children: [],
          },
        ],
      },
    ],
  };
}

describe("SelectionModesCoordinator", () => {
  let coordinator: SelectionModesCoordinator;
  let document: CanvasDocumentType;
  let observability: ReturnType<typeof createObservability>;

  beforeEach(() => {
    observability = createObservability();
    coordinator = new SelectionModesCoordinator(observability);
    document = createTestDocument();
    coordinator.setDocument(document);
  });

  describe("Rectangle Selection", () => {
    it("should select all nodes within rectangle", async () => {
      const rect: Rectangle = { x: 0, y: 0, width: 300, height: 300 };
      const config: SelectionModeConfig = {
        mode: "rectangle",
        multiSelect: true,
        preserveSelection: false,
      };

      const result = await coordinator.performRectangleSelection(rect, config);

      // Should select node-1, node-2, node-3 (not node-4 hidden, not node-5 locked)
      expect(result.selectedNodeIds).toHaveLength(3);
      expect(result.selectedNodeIds).toContain("node-1");
      expect(result.selectedNodeIds).toContain("node-2");
      expect(result.selectedNodeIds).toContain("node-3");
      expect(result.selectedNodeIds).not.toContain("node-4"); // Hidden
      expect(result.selectedNodeIds).not.toContain("node-5"); // Locked
    });

    it("should select partial nodes within rectangle", async () => {
      const rect: Rectangle = { x: 50, y: 50, width: 150, height: 150 };
      const config: SelectionModeConfig = {
        mode: "rectangle",
        multiSelect: true,
        preserveSelection: false,
      };

      const result = await coordinator.performRectangleSelection(rect, config);

      // Should select node-1, node-2, node-3 (all partially overlap)
      expect(result.selectedNodeIds).toHaveLength(3);
      expect(result.selectedNodeIds).toContain("node-1");
      expect(result.selectedNodeIds).toContain("node-2");
      expect(result.selectedNodeIds).toContain("node-3");
    });

    it("should select no nodes when rectangle is empty", async () => {
      const rect: Rectangle = { x: 500, y: 500, width: 100, height: 100 };
      const config: SelectionModeConfig = {
        mode: "rectangle",
        multiSelect: true,
        preserveSelection: false,
      };

      const result = await coordinator.performRectangleSelection(rect, config);

      expect(result.selectedNodeIds).toHaveLength(0);
      expect(result.accuracy).toBe(1.0); // No hits, so 100% accuracy
    });

    it("should complete within performance budget", async () => {
      const rect: Rectangle = { x: 0, y: 0, width: 1000, height: 800 };
      const config: SelectionModeConfig = {
        mode: "rectangle",
        multiSelect: true,
        preserveSelection: false,
      };

      const result = await coordinator.performRectangleSelection(rect, config);

      // Performance requirement: <50ms
      expect(result.duration).toBeLessThan(50);
    });

    it("should handle single selection mode", async () => {
      const rect: Rectangle = { x: 0, y: 0, width: 300, height: 300 };
      const config: SelectionModeConfig = {
        mode: "single",
        multiSelect: false,
        preserveSelection: false,
      };

      const result = await coordinator.performRectangleSelection(rect, config);

      // Should only select the first node
      expect(result.selectedNodeIds).toHaveLength(1);
      expect(result.selectedNodeIds[0]).toBe("node-1");
    });
  });

  describe("Lasso Selection", () => {
    it("should select nodes within lasso path", async () => {
      // Lasso path around node-1 and node-2
      const path: Point[] = [
        { x: 0, y: 0 },
        { x: 270, y: 0 },
        { x: 270, y: 120 },
        { x: 0, y: 120 },
      ];
      const config: SelectionModeConfig = {
        mode: "lasso",
        multiSelect: true,
        preserveSelection: false,
      };

      const result = await coordinator.performLassoSelection(path, config);

      // Should select node-1 and node-2
      expect(result.selectedNodeIds).toHaveLength(2);
      expect(result.selectedNodeIds).toContain("node-1");
      expect(result.selectedNodeIds).toContain("node-2");
      expect(result.selectedNodeIds).not.toContain("node-3");
    });

    it("should use winding rule for point-in-polygon test", async () => {
      // Irregular L-shaped lasso path around node-1 (10,10 to 110,110)
      const path: Point[] = [
        { x: 5, y: 5 },
        { x: 115, y: 5 },
        { x: 115, y: 115 },
        { x: 5, y: 115 },
      ];
      const config: SelectionModeConfig = {
        mode: "lasso",
        multiSelect: true,
        preserveSelection: false,
      };

      const result = await coordinator.performLassoSelection(path, config);

      // Should select node-1 which is at (10,10) with size 100x100
      expect(result.selectedNodeIds).toContain("node-1");
    });

    it("should handle circular lasso path", async () => {
      // Create circular path around node-2
      const centerX = 200;
      const centerY = 60;
      const radius = 80;
      const segments = 16;
      const path: Point[] = [];

      for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        path.push({
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
        });
      }

      const config: SelectionModeConfig = {
        mode: "lasso",
        multiSelect: true,
        preserveSelection: false,
      };

      const result = await coordinator.performLassoSelection(path, config);

      // Should select node-2
      expect(result.selectedNodeIds).toContain("node-2");
    });

    it("should complete within performance budget", async () => {
      const path: Point[] = [
        { x: 0, y: 0 },
        { x: 270, y: 0 },
        { x: 270, y: 120 },
        { x: 0, y: 120 },
      ];
      const config: SelectionModeConfig = {
        mode: "lasso",
        multiSelect: true,
        preserveSelection: false,
      };

      const result = await coordinator.performLassoSelection(path, config);

      // Performance requirement: <30ms
      expect(result.duration).toBeLessThan(30);
    });

    it("should handle empty lasso path gracefully", async () => {
      const path: Point[] = [];
      const config: SelectionModeConfig = {
        mode: "lasso",
        multiSelect: true,
        preserveSelection: false,
      };

      // Should return empty selection rather than throwing
      const result = await coordinator.performLassoSelection(path, config);
      expect(result.selectedNodeIds).toHaveLength(0);
    });
  });

  describe("Multi-Select Modes", () => {
    it("should include existing selection when preserveSelection is true", async () => {
      const coordinator = new SelectionModesCoordinator(createObservability());
      coordinator.setDocument(createTestDocument());
      coordinator.setCurrentSelection(["node-1", "node-2"]);

      const rect: Rectangle = { x: 0, y: 0, width: 300, height: 300 };
      const config: SelectionModeConfig = {
        mode: "rectangle",
        multiSelect: true,
        preserveSelection: true,
      };

      const result = await coordinator.performRectangleSelection(rect, config);
      expect(new Set(result.selectedNodeIds)).toEqual(
        new Set(["node-1", "node-2", "node-3"])
      );
    });

    it("should preserve existing selection when no new hits are detected", async () => {
      const coordinator = new SelectionModesCoordinator(createObservability());
      coordinator.setDocument(createTestDocument());
      coordinator.setCurrentSelection(["node-1"]);

      const rect: Rectangle = { x: 500, y: 500, width: 100, height: 100 };
      const config: SelectionModeConfig = {
        mode: "rectangle",
        multiSelect: true,
        preserveSelection: true,
      };

      const result = await coordinator.performRectangleSelection(rect, config);
      expect(result.selectedNodeIds).toEqual(["node-1"]);
    });
  });

  describe("Parameter Validation", () => {
    it("should validate rectangle with negative dimensions", () => {
      const rect: Rectangle = { x: 0, y: 0, width: -100, height: 100 };
      const result = coordinator.validateSelectionOperation("rectangle", rect);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("negative");
    });

    it("should validate rectangle with infinite coordinates", () => {
      const rect: Rectangle = {
        x: Number.POSITIVE_INFINITY,
        y: 0,
        width: 100,
        height: 100,
      };
      const result = coordinator.validateSelectionOperation("rectangle", rect);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("finite");
    });

    it("should validate lasso with too few points", () => {
      const path: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ];
      const result = coordinator.validateSelectionOperation("lasso", path);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("at least 3 points");
    });

    it("should validate lasso with infinite coordinates", () => {
      const path: Point[] = [
        { x: 0, y: 0 },
        { x: Number.NaN, y: 10 },
        { x: 10, y: 10 },
      ];
      const result = coordinator.validateSelectionOperation("lasso", path);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("finite");
    });

    it("should accept valid rectangle", () => {
      const rect: Rectangle = { x: 0, y: 0, width: 100, height: 100 };
      const result = coordinator.validateSelectionOperation("rectangle", rect);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should accept valid lasso path", () => {
      const path: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 50, y: 100 },
      ];
      const result = coordinator.validateSelectionOperation("lasso", path);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe("Error Handling", () => {
    it("should throw error when no document is set", async () => {
      const freshCoordinator = new SelectionModesCoordinator(observability);
      const rect: Rectangle = { x: 0, y: 0, width: 100, height: 100 };
      const config: SelectionModeConfig = {
        mode: "rectangle",
        multiSelect: true,
        preserveSelection: false,
      };

      await expect(
        freshCoordinator.performRectangleSelection(rect, config)
      ).rejects.toThrow("No document loaded");
    });

    it("should handle empty artboards gracefully", async () => {
      const emptyDocument: CanvasDocumentType = {
        version: "1.0.0",
        id: "empty-doc",
        name: "Empty Document",
        artboards: [],
      };

      coordinator.setDocument(emptyDocument);

      const rect: Rectangle = { x: 0, y: 0, width: 100, height: 100 };
      const config: SelectionModeConfig = {
        mode: "rectangle",
        multiSelect: true,
        preserveSelection: false,
      };

      const result = await coordinator.performRectangleSelection(rect, config);

      expect(result.selectedNodeIds).toHaveLength(0);
    });

    it("should handle artboard with no children", async () => {
      const documentNoChildren: CanvasDocumentType = {
        version: "1.0.0",
        id: "no-children-doc",
        name: "No Children Document",
        artboards: [
          {
            id: "artboard-1",
            name: "Empty Artboard",
            type: "artboard",
            frame: { x: 0, y: 0, width: 1000, height: 800 },
            visible: true,
            locked: false,
            children: undefined,
          },
        ],
      };

      coordinator.setDocument(documentNoChildren);

      const rect: Rectangle = { x: 0, y: 0, width: 100, height: 100 };
      const config: SelectionModeConfig = {
        mode: "rectangle",
        multiSelect: true,
        preserveSelection: false,
      };

      const result = await coordinator.performRectangleSelection(rect, config);

      expect(result.selectedNodeIds).toHaveLength(0);
    });
  });

  describe("Nested Node Selection", () => {
    it("should select nested frame children", async () => {
      // Create document with nested frames
      const nestedDoc: CanvasDocumentType = {
        version: "1.0.0",
        id: "nested-doc",
        name: "Nested Document",
        artboards: [
          {
            id: "artboard-1",
            name: "Test Artboard",
            type: "artboard",
            frame: { x: 0, y: 0, width: 1000, height: 800 },
            visible: true,
            locked: false,
            children: [
              {
                id: "parent-frame",
                name: "Parent Frame",
                type: "frame",
                frame: { x: 10, y: 10, width: 200, height: 200 },
                visible: true,
                locked: false,
                children: [
                  {
                    id: "child-frame",
                    name: "Child Frame",
                    type: "frame",
                    frame: { x: 20, y: 20, width: 50, height: 50 },
                    visible: true,
                    locked: false,
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      };

      coordinator.setDocument(nestedDoc);

      const rect: Rectangle = { x: 0, y: 0, width: 300, height: 300 };
      const config: SelectionModeConfig = {
        mode: "rectangle",
        multiSelect: true,
        preserveSelection: false,
      };

      const result = await coordinator.performRectangleSelection(rect, config);

      // Should select both parent and child
      expect(result.selectedNodeIds).toContain("parent-frame");
      expect(result.selectedNodeIds).toContain("child-frame");
    });
  });

  describe("Performance with Large Node Counts", () => {
    it("should handle 1000 nodes efficiently", async () => {
      // Create document with 1000 nodes
      const nodes: NodeType[] = [];
      const gridSize = 32; // 32x32 = 1024 nodes

      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          nodes.push({
            id: `node-${i}-${j}`,
            name: `Node ${i},${j}`,
            type: "frame",
            frame: {
              x: i * 30,
              y: j * 30,
              width: 20,
              height: 20,
            },
            visible: true,
            locked: false,
            children: [],
          });
        }
      }

      const largeDoc: CanvasDocumentType = {
        version: "1.0.0",
        id: "large-doc",
        name: "Large Document",
        artboards: [
          {
            id: "artboard-1",
            name: "Large Artboard",
            type: "artboard",
            frame: { x: 0, y: 0, width: 2000, height: 2000 },
            visible: true,
            locked: false,
            children: nodes,
          },
        ],
      };

      coordinator.setDocument(largeDoc);

      const rect: Rectangle = { x: 0, y: 0, width: 500, height: 500 };
      const config: SelectionModeConfig = {
        mode: "rectangle",
        multiSelect: true,
        preserveSelection: false,
      };

      const result = await coordinator.performRectangleSelection(rect, config);

      // Performance requirement: <100ms for 1000 nodes
      expect(result.duration).toBeLessThan(100);

      // Should have selected multiple nodes
      expect(result.selectedNodeIds.length).toBeGreaterThan(0);
    });
  });
});
