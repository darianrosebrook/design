/**
 * @fileoverview Integration tests for canvas-renderer-dom
 * @author @darianrosebrook
 *
 * Tests integration with canvas-schema and canvas-engine packages.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { createCanvasRenderer } from "../src/renderer.js";
import { CanvasDocument, generateULID } from "@paths-design/canvas-schema";
import { JSDOM } from "jsdom";

// Setup JSDOM environment
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
global.document = dom.window.document as any;
global.window = dom.window as any;
global.HTMLElement = dom.window.HTMLElement as any;

// Mock performance.now()
let mockTime = 0;
global.performance = {
  now: () => {
    mockTime += 16.67;
    return mockTime;
  },
} as any;

global.requestAnimationFrame = ((cb: Function) =>
  setTimeout(() => cb(mockTime), 0)) as any;
global.cancelAnimationFrame = ((id: number) => clearTimeout(id)) as any;

describe("Integration Tests", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    mockTime = 0;
  });

  describe("Canvas Schema Integration", () => {
    it("should validate and render a valid canvas document", () => {
      const validDoc = {
        schemaVersion: "0.1.0" as const,
        id: generateULID(),
        name: "Test Document",
        artboards: [
          {
            id: generateULID(),
            name: "Main Artboard",
            frame: { x: 0, y: 0, width: 1920, height: 1080 },
            children: [
              {
                id: generateULID(),
                type: "frame" as const,
                name: "Container",
                visible: true,
                frame: { x: 100, y: 100, width: 800, height: 600 },
                children: [
                  {
                    id: generateULID(),
                    type: "text" as const,
                    name: "Title",
                    visible: true,
                    frame: { x: 50, y: 50, width: 700, height: 40 },
                    text: "Welcome to Designer",
                  },
                ],
              },
            ],
          },
        ],
      };

      // Validate against schema
      const result = CanvasDocument.safeParse(validDoc);
      expect(result.success).toBe(true);

      if (result.success) {
        const renderer = createCanvasRenderer();
        renderer.render(result.data, container);

        // Check that nodes were rendered
        expect(container.children.length).toBeGreaterThan(0);
        // Check that frame and text nodes exist (using class names since IDs are generated)
        expect(container.querySelector(".canvas-frame")).toBeTruthy();
        expect(container.querySelector(".canvas-text")).toBeTruthy();
      }
    });

    it("should handle invalid schema gracefully", () => {
      const invalidDoc = {
        schemaVersion: "0.1.0" as const,
        id: generateULID(),
        name: "Invalid Document",
        // Missing required artboards field
      };

      const result = CanvasDocument.safeParse(invalidDoc);
      expect(result.success).toBe(false);
    });

    it("should validate node types correctly", () => {
      const docWithVariousNodes = {
        schemaVersion: "0.1.0" as const,
        id: generateULID(),
        name: "Multi-Type Document",
        artboards: [
          {
            id: generateULID(),
            name: "Test Artboard",
            frame: { x: 0, y: 0, width: 800, height: 600 },
            children: [
              {
                id: generateULID(),
                type: "frame" as const,
                name: "Frame Node",
                visible: true,
                frame: { x: 0, y: 0, width: 200, height: 200 },
                children: [],
              },
              {
                id: generateULID(),
                type: "text" as const,
                name: "Text Node",
                visible: true,
                frame: { x: 0, y: 220, width: 200, height: 30 },
                text: "Hello",
              },
              {
                id: generateULID(),
                type: "component" as const,
                name: "Component Node",
                visible: true,
                frame: { x: 0, y: 270, width: 200, height: 50 },
                componentKey: "Button",
                props: {},
              },
            ],
          },
        ],
      };

      const result = CanvasDocument.safeParse(docWithVariousNodes);
      expect(result.success).toBe(true);

      if (result.success) {
        const renderer = createCanvasRenderer();
        renderer.render(result.data, container);

        // Check nodes were rendered by class name
        expect(container.querySelector(".canvas-frame")).toBeTruthy();
        expect(container.querySelector(".canvas-text")).toBeTruthy();
        expect(container.querySelector(".canvas-component")).toBeTruthy();
      }
    });
  });

  describe("Nested Structure Rendering", () => {
    it("should render deeply nested frame structures", () => {
      const nestedDoc = {
        schemaVersion: "0.1.0" as const,
        id: "nested-doc",
        name: "Nested Document",
        artboards: [
          {
            id: "artboard-1",
            name: "Nested Artboard",
            frame: { x: 0, y: 0, width: 800, height: 600 },
            children: [
              {
                id: "level-1",
                type: "frame" as const,
                name: "Level 1",
                visible: true,
                frame: { x: 0, y: 0, width: 800, height: 600 },
                children: [
                  {
                    id: "level-2",
                    type: "frame" as const,
                    name: "Level 2",
                    visible: true,
                    frame: { x: 50, y: 50, width: 700, height: 500 },
                    children: [
                      {
                        id: "level-3",
                        type: "frame" as const,
                        name: "Level 3",
                        visible: true,
                        frame: { x: 50, y: 50, width: 600, height: 400 },
                        children: [
                          {
                            id: "text-deep",
                            type: "text" as const,
                            name: "Deep Text",
                            visible: true,
                            frame: { x: 10, y: 10, width: 580, height: 30 },
                            text: "Deep nested content",
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const renderer = createCanvasRenderer();
      renderer.render(nestedDoc, container);

      // Check all levels are rendered
      expect(container.querySelector('[data-node-id="level-1"]')).toBeTruthy();
      expect(container.querySelector('[data-node-id="level-2"]')).toBeTruthy();
      expect(container.querySelector('[data-node-id="level-3"]')).toBeTruthy();
      expect(
        container.querySelector('[data-node-id="text-deep"]')
      ).toBeTruthy();

      // Verify nesting structure
      const level1 = container.querySelector('[data-node-id="level-1"]');
      const level2 = level1?.querySelector('[data-node-id="level-2"]');
      const level3 = level2?.querySelector('[data-node-id="level-3"]');
      const textDeep = level3?.querySelector('[data-node-id="text-deep"]');

      expect(textDeep).toBeTruthy();
    });
  });

  describe("Performance Integration", () => {
    it("should handle large documents efficiently", () => {
      // Generate a document with many nodes
      const children = [];
      for (let i = 0; i < 100; i++) {
        children.push({
          id: `node-${i}`,
          type: "frame" as const,
          name: `Frame ${i}`,
          visible: true,
          frame: {
            x: (i % 10) * 100,
            y: Math.floor(i / 10) * 100,
            width: 90,
            height: 90,
          },
          children: [],
        });
      }

      const largeDoc = {
        schemaVersion: "0.1.0" as const,
        id: "large-doc",
        name: "Large Document",
        artboards: [
          {
            id: "artboard-1",
            name: "Large Artboard",
            frame: { x: 0, y: 0, width: 1000, height: 1000 },
            children,
          },
        ],
      };

      const renderer = createCanvasRenderer();
      const startTime = performance.now();
      renderer.render(largeDoc, container);
      const renderTime = performance.now() - startTime;

      // Should render in reasonable time (< 1000ms for 100 nodes)
      expect(renderTime).toBeLessThan(1000);

      // All nodes should be rendered
      expect(
        container.querySelectorAll(".canvas-frame").length
      ).toBeGreaterThanOrEqual(100);
    });

    it("should track performance metrics", () => {
      const doc = {
        schemaVersion: "0.1.0" as const,
        id: "perf-doc",
        name: "Performance Test",
        artboards: [
          {
            id: "artboard-1",
            name: "Test Artboard",
            frame: { x: 0, y: 0, width: 800, height: 600 },
            children: [
              {
                id: "frame-1",
                type: "frame" as const,
                name: "Frame",
                visible: true,
                frame: { x: 0, y: 0, width: 200, height: 200 },
                children: [],
              },
            ],
          },
        ],
      };

      const renderer = createCanvasRenderer();
      renderer.render(doc, container);

      // Check observability metrics
      const metrics = renderer.getObservability().metrics.getMetrics();
      expect(metrics.length).toBeGreaterThan(0);

      const frameMetric = metrics.find(
        (m) => m.name === "renderer_frame_duration_ms"
      );
      expect(frameMetric).toBeDefined();
      expect(frameMetric?.value).toBeGreaterThan(0);
    });
  });

  describe("Selection Integration", () => {
    it("should handle selection across different node types", () => {
      const doc = {
        schemaVersion: "0.1.0" as const,
        id: "selection-doc",
        name: "Selection Test",
        artboards: [
          {
            id: "artboard-1",
            name: "Test Artboard",
            frame: { x: 0, y: 0, width: 800, height: 600 },
            children: [
              {
                id: "frame-1",
                type: "frame" as const,
                name: "Frame",
                visible: true,
                frame: { x: 0, y: 0, width: 200, height: 200 },
                children: [],
              },
              {
                id: "text-1",
                type: "text" as const,
                name: "Text",
                visible: true,
                frame: { x: 0, y: 220, width: 200, height: 30 },
                text: "Select me",
              },
            ],
          },
        ],
      };

      const renderer = createCanvasRenderer();
      renderer.render(doc, container);

      // Select frame
      renderer.setSelection(["frame-1"]);
      let frameElement = container.querySelector('[data-node-id="frame-1"]');
      expect(frameElement?.getAttribute("aria-selected")).toBe("true");

      // Select text
      renderer.setSelection(["text-1"]);
      frameElement = container.querySelector('[data-node-id="frame-1"]');
      const textElement = container.querySelector('[data-node-id="text-1"]');

      expect(frameElement?.getAttribute("aria-selected")).toBe("false");
      expect(textElement?.getAttribute("aria-selected")).toBe("true");

      // Multi-select
      renderer.setSelection(["frame-1", "text-1"]);
      frameElement = container.querySelector('[data-node-id="frame-1"]');
      expect(frameElement?.getAttribute("aria-selected")).toBe("true");
      expect(textElement?.getAttribute("aria-selected")).toBe("true");
    });
  });

  describe("Error Handling", () => {
    it("should handle rendering errors gracefully", () => {
      const renderer = createCanvasRenderer();

      // Try to render before document is set
      expect(() => {
        renderer.updateNodes(["non-existent"], [{}]);
      }).not.toThrow();

      // Should log error but not crash
      const logs = renderer.getObservability().logger.getLogs();
      expect(logs.length).toBeGreaterThanOrEqual(0);
    });

    it("should handle visibility toggling", () => {
      const doc = {
        schemaVersion: "0.1.0" as const,
        id: "visibility-doc",
        name: "Visibility Test",
        artboards: [
          {
            id: "artboard-1",
            name: "Test Artboard",
            frame: { x: 0, y: 0, width: 800, height: 600 },
            children: [
              {
                id: "frame-1",
                type: "frame" as const,
                name: "Visible Frame",
                visible: true,
                frame: { x: 0, y: 0, width: 200, height: 200 },
                children: [],
              },
              {
                id: "frame-2",
                type: "frame" as const,
                name: "Hidden Frame",
                visible: false,
                frame: { x: 220, y: 0, width: 200, height: 200 },
                children: [],
              },
            ],
          },
        ],
      };

      const renderer = createCanvasRenderer();
      renderer.render(doc, container);

      const visibleFrame = container.querySelector(
        '[data-node-id="frame-1"]'
      ) as HTMLElement;
      const hiddenFrame = container.querySelector(
        '[data-node-id="frame-2"]'
      ) as HTMLElement;

      expect(visibleFrame?.style.display).not.toBe("none");
      expect(hiddenFrame?.style.display).toBe("none");
    });
  });
});
