/**
 * @fileoverview Tests for resource limits and quota management
 * @author @darianrosebrook
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  ResourceManager,
  createResourceManager,
  defaultLimits,
} from "../src/security/resource-limits.js";
import type { CanvasDocumentType } from "@paths-design/designer/canvas-schema";

describe("ResourceManager", () => {
  let manager: ResourceManager;

  beforeEach(() => {
    manager = createResourceManager();
  });

  describe("Node Count Validation", () => {
    it("accepts documents within node limit", () => {
      const doc: CanvasDocumentType = {
        schemaVersion: "0.1.0",
        id: "01JF2PZV9G2WR5C3W7P0YHNX9D",
        name: "Test",
        artboards: [
          {
            id: "01JF2PZV9G2WR5C3W7P0YHNX9E",
            name: "Artboard",
            frame: { x: 0, y: 0, width: 1440, height: 1024 },
            children: [
              {
                id: "01JF2PZV9G2WR5C3W7P0YHNX9F",
                type: "text",
                name: "Text",
                visible: true,
                frame: { x: 0, y: 0, width: 100, height: 50 },
                text: "Hello",
              },
            ],
          },
        ],
      };

      const result = manager.validateNodeCount(doc);
      expect(result.valid).toBe(true);
      expect(result.details?.nodeCount).toBe(2); // 1 artboard + 1 text node
    });

    it("warns when node count exceeds warning threshold", () => {
      const customManager = createResourceManager({
        warningNodeCount: 2,
        maxNodeCount: 10,
      });

      const doc: CanvasDocumentType = {
        schemaVersion: "0.1.0",
        id: "01JF2PZV9G2WR5C3W7P0YHNX9D",
        name: "Test",
        artboards: [
          {
            id: "01JF2PZV9G2WR5C3W7P0YHNX9E",
            name: "Artboard",
            frame: { x: 0, y: 0, width: 1440, height: 1024 },
            children: [
              {
                id: "01JF2PZV9G2WR5C3W7P0YHNX9F",
                type: "text",
                name: "Text1",
                visible: true,
                frame: { x: 0, y: 0, width: 100, height: 50 },
                text: "Hello",
              },
              {
                id: "01JF2PZV9G2WR5C3W7P0YHNXA0",
                type: "text",
                name: "Text2",
                visible: true,
                frame: { x: 0, y: 0, width: 100, height: 50 },
                text: "World",
              },
            ],
          },
        ],
      };

      const result = customManager.validateNodeCount(doc);
      expect(result.valid).toBe(true);
      expect(result.warning).toBeDefined();
      expect(result.warning).toContain("performance");
      expect(result.details?.nodeCount).toBe(3);
    });

    it("rejects documents exceeding max node count", () => {
      const customManager = createResourceManager({
        maxNodeCount: 2,
      });

      const doc: CanvasDocumentType = {
        schemaVersion: "0.1.0",
        id: "01JF2PZV9G2WR5C3W7P0YHNX9D",
        name: "Test",
        artboards: [
          {
            id: "01JF2PZV9G2WR5C3W7P0YHNX9E",
            name: "Artboard",
            frame: { x: 0, y: 0, width: 1440, height: 1024 },
            children: [
              {
                id: "01JF2PZV9G2WR5C3W7P0YHNX9F",
                type: "text",
                name: "Text1",
                visible: true,
                frame: { x: 0, y: 0, width: 100, height: 50 },
                text: "Hello",
              },
              {
                id: "01JF2PZV9G2WR5C3W7P0YHNXA0",
                type: "text",
                name: "Text2",
                visible: true,
                frame: { x: 0, y: 0, width: 100, height: 50 },
                text: "World",
              },
            ],
          },
        ],
      };

      const result = customManager.validateNodeCount(doc);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("exceeding limit");
      expect(result.details?.nodeCount).toBe(3);
    });

    it("counts nested frame children correctly", () => {
      const doc: CanvasDocumentType = {
        schemaVersion: "0.1.0",
        id: "01JF2PZV9G2WR5C3W7P0YHNX9D",
        name: "Test",
        artboards: [
          {
            id: "01JF2PZV9G2WR5C3W7P0YHNX9E",
            name: "Artboard",
            frame: { x: 0, y: 0, width: 1440, height: 1024 },
            children: [
              {
                id: "01JF2PZV9G2WR5C3W7P0YHNX9F",
                type: "frame",
                name: "Container",
                visible: true,
                frame: { x: 0, y: 0, width: 400, height: 300 },
                children: [
                  {
                    id: "01JF2PZV9G2WR5C3W7P0YHNXA0",
                    type: "text",
                    name: "NestedText",
                    visible: true,
                    frame: { x: 0, y: 0, width: 100, height: 50 },
                    text: "Nested",
                  },
                ],
              },
            ],
          },
        ],
      };

      const result = manager.validateNodeCount(doc);
      expect(result.valid).toBe(true);
      expect(result.details?.nodeCount).toBe(3); // 1 artboard + 1 frame + 1 text
    });

    it("handles documents with multiple artboards", () => {
      const doc: CanvasDocumentType = {
        schemaVersion: "0.1.0",
        id: "01JF2PZV9G2WR5C3W7P0YHNX9D",
        name: "Test",
        artboards: [
          {
            id: "01JF2PZV9G2WR5C3W7P0YHNX9E",
            name: "Artboard1",
            frame: { x: 0, y: 0, width: 1440, height: 1024 },
            children: [
              {
                id: "01JF2PZV9G2WR5C3W7P0YHNX9F",
                type: "text",
                name: "Text1",
                visible: true,
                frame: { x: 0, y: 0, width: 100, height: 50 },
                text: "Hello",
              },
            ],
          },
          {
            id: "01JF2PZV9G2WR5C3W7P0YHNXA1",
            name: "Artboard2",
            frame: { x: 0, y: 0, width: 1440, height: 1024 },
            children: [
              {
                id: "01JF2PZV9G2WR5C3W7P0YHNXA2",
                type: "text",
                name: "Text2",
                visible: true,
                frame: { x: 0, y: 0, width: 100, height: 50 },
                text: "World",
              },
            ],
          },
        ],
      };

      const result = manager.validateNodeCount(doc);
      expect(result.valid).toBe(true);
      expect(result.details?.nodeCount).toBe(4); // 2 artboards + 2 text nodes
    });

    it("handles empty artboards", () => {
      const doc: CanvasDocumentType = {
        schemaVersion: "0.1.0",
        id: "01JF2PZV9G2WR5C3W7P0YHNX9D",
        name: "Test",
        artboards: [
          {
            id: "01JF2PZV9G2WR5C3W7P0YHNX9E",
            name: "Empty",
            frame: { x: 0, y: 0, width: 1440, height: 1024 },
            children: [],
          },
        ],
      };

      const result = manager.validateNodeCount(doc);
      expect(result.valid).toBe(true);
      expect(result.details?.nodeCount).toBe(1); // Just the artboard
    });
  });

  describe("Memory Usage Estimation", () => {
    it("estimates memory usage for document", () => {
      const doc: CanvasDocumentType = {
        schemaVersion: "0.1.0",
        id: "01JF2PZV9G2WR5C3W7P0YHNX9D",
        name: "Test",
        artboards: [
          {
            id: "01JF2PZV9G2WR5C3W7P0YHNX9E",
            name: "Artboard",
            frame: { x: 0, y: 0, width: 1440, height: 1024 },
            children: [],
          },
        ],
      };

      const estimatedMB = manager.estimateMemoryUsage(doc);
      expect(estimatedMB).toBeGreaterThan(0);
      expect(estimatedMB).toBeLessThan(1); // 1 node should be < 1MB
    });

    it("validates memory usage within limits", () => {
      const doc: CanvasDocumentType = {
        schemaVersion: "0.1.0",
        id: "01JF2PZV9G2WR5C3W7P0YHNX9D",
        name: "Test",
        artboards: [
          {
            id: "01JF2PZV9G2WR5C3W7P0YHNX9E",
            name: "Artboard",
            frame: { x: 0, y: 0, width: 1440, height: 1024 },
            children: [],
          },
        ],
      };

      const result = manager.validateMemoryUsage(doc);
      expect(result.valid).toBe(true);
      expect(result.details?.memoryUsageMB).toBeDefined();
    });

    it("rejects documents with excessive estimated memory", () => {
      const customManager = createResourceManager({
        maxMemoryMB: 0.001, // Very low limit
      });

      const doc: CanvasDocumentType = {
        schemaVersion: "0.1.0",
        id: "01JF2PZV9G2WR5C3W7P0YHNX9D",
        name: "Test",
        artboards: [
          {
            id: "01JF2PZV9G2WR5C3W7P0YHNX9E",
            name: "Artboard",
            frame: { x: 0, y: 0, width: 1440, height: 1024 },
            children: [
              {
                id: "01JF2PZV9G2WR5C3W7P0YHNX9F",
                type: "text",
                name: "Text",
                visible: true,
                frame: { x: 0, y: 0, width: 100, height: 50 },
                text: "Hello",
              },
            ],
          },
        ],
      };

      const result = customManager.validateMemoryUsage(doc);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("memory usage");
    });
  });

  describe("Configuration", () => {
    it("uses default limits when not specified", () => {
      const manager = createResourceManager();
      const limits = manager.getLimits();

      expect(limits.maxFileSizeBytes).toBe(defaultLimits.maxFileSizeBytes);
      expect(limits.maxNodeCount).toBe(defaultLimits.maxNodeCount);
      expect(limits.warningNodeCount).toBe(defaultLimits.warningNodeCount);
      expect(limits.maxMemoryMB).toBe(defaultLimits.maxMemoryMB);
    });

    it("accepts custom limits", () => {
      const customLimits = {
        maxFileSizeBytes: 1024,
        maxNodeCount: 10,
        warningNodeCount: 5,
        maxMemoryMB: 100,
      };

      const manager = createResourceManager(customLimits);
      const limits = manager.getLimits();

      expect(limits).toEqual(customLimits);
    });

    it("allows updating limits", () => {
      const manager = createResourceManager();

      manager.updateLimits({
        maxNodeCount: 100,
      });

      const limits = manager.getLimits();
      expect(limits.maxNodeCount).toBe(100);
      expect(limits.maxFileSizeBytes).toBe(defaultLimits.maxFileSizeBytes);
    });

    it("returns readonly copy of limits", () => {
      const manager = createResourceManager();
      const limits = manager.getLimits();

      // TypeScript should prevent this, but test runtime behavior
      expect(() => {
        (limits as any).maxNodeCount = 999;
      }).not.toThrow();

      // Original should not be affected
      const newLimits = manager.getLimits();
      expect(newLimits.maxNodeCount).toBe(defaultLimits.maxNodeCount);
    });
  });

  describe("Edge Cases", () => {
    it("handles deeply nested structures", () => {
      // Create a deeply nested document
      const createNestedFrame = (depth: number, id: number): any => {
        if (depth === 0) {
          return {
            id: `01JF2PZV9G2WR5C3W7P0YHNX${id.toString().padStart(2, "0")}`,
            type: "text",
            name: "Leaf",
            visible: true,
            frame: { x: 0, y: 0, width: 100, height: 50 },
            text: "Nested",
          };
        }

        return {
          id: `01JF2PZV9G2WR5C3W7P0YHNX${id.toString().padStart(2, "0")}`,
          type: "frame",
          name: `Frame${depth}`,
          visible: true,
          frame: { x: 0, y: 0, width: 400, height: 300 },
          children: [createNestedFrame(depth - 1, id + 1)],
        };
      };

      const doc: CanvasDocumentType = {
        schemaVersion: "0.1.0",
        id: "01JF2PZV9G2WR5C3W7P0YHNX9D",
        name: "Test",
        artboards: [
          {
            id: "01JF2PZV9G2WR5C3W7P0YHNX9E",
            name: "Artboard",
            frame: { x: 0, y: 0, width: 1440, height: 1024 },
            children: [createNestedFrame(10, 0)],
          },
        ],
      };

      const result = manager.validateNodeCount(doc);
      expect(result.valid).toBe(true);
      expect(result.details?.nodeCount).toBe(12); // 1 artboard + 11 nested frames/text
    });

    it("handles documents with no artboards", () => {
      const doc: CanvasDocumentType = {
        schemaVersion: "0.1.0",
        id: "01JF2PZV9G2WR5C3W7P0YHNX9D",
        name: "Test",
        artboards: [],
      };

      const result = manager.validateNodeCount(doc);
      expect(result.valid).toBe(true);
      expect(result.details?.nodeCount).toBe(0);
    });
  });
});
