/**
 * @fileoverview Tests for canvas DOM renderer
 * @author @darianrosebrook
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createCanvasRenderer } from "../src/renderer.js";
import type { CanvasDocumentType } from "@paths-design/canvas-schema";
import { JSDOM } from "jsdom";

// Setup JSDOM environment
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
global.document = dom.window.document as any;
global.window = dom.window as any;
global.HTMLElement = dom.window.HTMLElement as any;

// Mock performance.now() to avoid JSDOM stack overflow
let mockTime = 0;
global.performance = {
  now: () => {
    mockTime += 16.67; // Simulate 60fps
    return mockTime;
  },
} as any;

global.requestAnimationFrame = ((cb: Function) => setTimeout(() => cb(mockTime), 0)) as any;
global.cancelAnimationFrame = ((id: number) => clearTimeout(id)) as any;

describe("CanvasDOMRenderer", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  describe("initialization", () => {
    it("should create renderer with default options", () => {
      const renderer = createCanvasRenderer();
      expect(renderer).toBeDefined();
      expect(renderer.getFPS()).toBe(60);
      expect(renderer.getDirtyNodeCount()).toBe(0);
    });

    it("should create renderer with custom options", () => {
      const onSelectionChange = vi.fn();
      const renderer = createCanvasRenderer({
        interactive: false,
        classPrefix: "test-",
        onSelectionChange,
      });
      expect(renderer).toBeDefined();
    });
  });

  describe("render", () => {
    it("should render a simple document", () => {
      const renderer = createCanvasRenderer();
      const doc: CanvasDocumentType = {
        schemaVersion: "0.1.0",
        id: "test-doc",
        name: "Test Document",
        artboards: [
          {
            id: "artboard-1",
            name: "Artboard 1",
            frame: { x: 0, y: 0, width: 800, height: 600 },
            children: [],
          },
        ],
      };

      renderer.render(doc, container);

      expect(container.children.length).toBeGreaterThan(0);
      expect(container.className).toContain("canvas-renderer");
    });

    it("should render frame nodes", () => {
      const renderer = createCanvasRenderer();
      const doc: CanvasDocumentType = {
        schemaVersion: "0.1.0",
        id: "test-doc",
        name: "Test Document",
        artboards: [
          {
            id: "artboard-1",
            name: "Artboard 1",
            frame: { x: 0, y: 0, width: 800, height: 600 },
            children: [
              {
                id: "frame-1",
                type: "frame",
                name: "Frame 1",
                visible: true,
                frame: { x: 100, y: 100, width: 200, height: 150 },
                children: [],
              },
            ],
          },
        ],
      };

      renderer.render(doc, container);

      const frameElement = container.querySelector('[data-node-id="frame-1"]');
      expect(frameElement).toBeTruthy();
      expect(frameElement?.getAttribute("role")).toBe("group");
    });

    it("should render text nodes", () => {
      const renderer = createCanvasRenderer();
      const doc: CanvasDocumentType = {
        schemaVersion: "0.1.0",
        id: "test-doc",
        name: "Test Document",
        artboards: [
          {
            id: "artboard-1",
            name: "Artboard 1",
            frame: { x: 0, y: 0, width: 800, height: 600 },
            children: [
              {
                id: "text-1",
                type: "text",
                name: "Text 1",
                visible: true,
                frame: { x: 100, y: 100, width: 200, height: 30 },
                text: "Hello World",
              },
            ],
          },
        ],
      };

      renderer.render(doc, container);

      const textElement = container.querySelector('[data-node-id="text-1"]');
      expect(textElement).toBeTruthy();
      expect(textElement?.textContent).toBe("Hello World");
      expect(textElement?.getAttribute("role")).toBe("text");
    });

    it("should render component nodes", () => {
      const renderer = createCanvasRenderer();
      const doc: CanvasDocumentType = {
        schemaVersion: "0.1.0",
        id: "test-doc",
        name: "Test Document",
        artboards: [
          {
            id: "artboard-1",
            name: "Artboard 1",
            frame: { x: 0, y: 0, width: 800, height: 600 },
            children: [
              {
                id: "component-1",
                type: "component",
                name: "Button",
                visible: true,
                frame: { x: 100, y: 100, width: 120, height: 40 },
                componentKey: "Button",
                props: { label: "Click me" },
              },
            ],
          },
        ],
      };

      renderer.render(doc, container);

      const componentElement = container.querySelector('[data-node-id="component-1"]');
      expect(componentElement).toBeTruthy();
      expect(componentElement?.getAttribute("role")).toBe("button");
    });

    it("should set accessibility attributes", () => {
      const renderer = createCanvasRenderer();
      const doc: CanvasDocumentType = {
        schemaVersion: "0.1.0",
        id: "test-doc",
        name: "Test Document",
        artboards: [
          {
            id: "artboard-1",
            name: "Artboard 1",
            frame: { x: 0, y: 0, width: 800, height: 600 },
            children: [
              {
                id: "frame-1",
                type: "frame",
                name: "Container",
                visible: true,
                frame: { x: 0, y: 0, width: 100, height: 100 },
                children: [],
              },
            ],
          },
        ],
      };

      renderer.render(doc, container);

      const frameElement = container.querySelector('[data-node-id="frame-1"]');
      expect(frameElement?.getAttribute("role")).toBe("group");
      expect(frameElement?.getAttribute("aria-label")).toContain("Container");
      expect(frameElement?.getAttribute("tabindex")).toBe("0");
      expect(frameElement?.getAttribute("aria-selected")).toBe("false");
    });
  });

  describe("selection", () => {
    it("should handle selection changes", () => {
      const onSelectionChange = vi.fn();
      const renderer = createCanvasRenderer({ onSelectionChange });
      const doc: CanvasDocumentType = {
        schemaVersion: "0.1.0",
        id: "test-doc",
        name: "Test Document",
        artboards: [
          {
            id: "artboard-1",
            name: "Artboard 1",
            frame: { x: 0, y: 0, width: 800, height: 600 },
            children: [
              {
                id: "node-1",
                type: "frame",
                name: "Node 1",
                visible: true,
                frame: { x: 0, y: 0, width: 100, height: 100 },
                children: [],
              },
            ],
          },
        ],
      };

      renderer.render(doc, container);
      renderer.setSelection(["node-1"]);

      expect(onSelectionChange).toHaveBeenCalledWith(["node-1"]);
      const element = container.querySelector('[data-node-id="node-1"]');
      expect(element?.getAttribute("aria-selected")).toBe("true");
    });

    it("should clear selection", () => {
      const renderer = createCanvasRenderer();
      const doc: CanvasDocumentType = {
        schemaVersion: "0.1.0",
        id: "test-doc",
        name: "Test Document",
        artboards: [
          {
            id: "artboard-1",
            name: "Artboard 1",
            frame: { x: 0, y: 0, width: 800, height: 600 },
            children: [
              {
                id: "node-1",
                type: "frame",
                name: "Node 1",
                visible: true,
                frame: { x: 0, y: 0, width: 100, height: 100 },
                children: [],
              },
            ],
          },
        ],
      };

      renderer.render(doc, container);
      renderer.setSelection(["node-1"]);
      renderer.setSelection([]);

      const element = container.querySelector('[data-node-id="node-1"]');
      expect(element?.getAttribute("aria-selected")).toBe("false");
    });
  });

  describe("performance", () => {
    it("should track FPS", () => {
      const renderer = createCanvasRenderer();
      expect(renderer.getFPS()).toBe(60);
    });

    it("should track dirty nodes", () => {
      const renderer = createCanvasRenderer();
      const doc: CanvasDocumentType = {
        schemaVersion: "0.1.0",
        id: "test-doc",
        name: "Test Document",
        artboards: [
          {
            id: "artboard-1",
            name: "Artboard 1",
            frame: { x: 0, y: 0, width: 800, height: 600 },
            children: [
              {
                id: "node-1",
                type: "frame",
                name: "Node 1",
                visible: true,
                frame: { x: 0, y: 0, width: 100, height: 100 },
                children: [],
              },
            ],
          },
        ],
      };

      renderer.render(doc, container);
      renderer.updateNodes(["node-1"], [{ visible: false }]);

      expect(renderer.getDirtyNodeCount()).toBeGreaterThan(0);
    });

    it("should track pixel ratio", () => {
      const renderer = createCanvasRenderer();
      const doc: CanvasDocumentType = {
        schemaVersion: "0.1.0",
        id: "test-doc",
        name: "Test Document",
        artboards: [
          {
            id: "artboard-1",
            name: "Artboard 1",
            frame: { x: 0, y: 0, width: 800, height: 600 },
            children: [],
          },
        ],
      };

      renderer.render(doc, container);
      expect(renderer.getPixelRatio()).toBeGreaterThanOrEqual(1);
    });
  });

  describe("observability", () => {
    it("should provide observability instance", () => {
      const renderer = createCanvasRenderer();
      const obs = renderer.getObservability();
      
      expect(obs).toBeDefined();
      expect(obs.logger).toBeDefined();
      expect(obs.metrics).toBeDefined();
      expect(obs.tracer).toBeDefined();
    });

    it("should log render events", () => {
      const renderer = createCanvasRenderer();
      const doc: CanvasDocumentType = {
        schemaVersion: "0.1.0",
        id: "test-doc",
        name: "Test Document",
        artboards: [
          {
            id: "artboard-1",
            name: "Artboard 1",
            frame: { x: 0, y: 0, width: 800, height: 600 },
            children: [],
          },
        ],
      };

      renderer.render(doc, container);
      
      const logs = renderer.getObservability().logger.getLogs();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs.some(log => log.category === "renderer.render.start")).toBe(true);
      expect(logs.some(log => log.category === "renderer.render.complete")).toBe(true);
    });

    it("should collect metrics", () => {
      const renderer = createCanvasRenderer();
      const doc: CanvasDocumentType = {
        schemaVersion: "0.1.0",
        id: "test-doc",
        name: "Test Document",
        artboards: [
          {
            id: "artboard-1",
            name: "Artboard 1",
            frame: { x: 0, y: 0, width: 800, height: 600 },
            children: [],
          },
        ],
      };

      renderer.render(doc, container);
      
      const metrics = renderer.getObservability().metrics.getMetrics();
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics.some(m => m.name === "renderer_frame_duration_ms")).toBe(true);
    });
  });

  describe("cleanup", () => {
    it("should cleanup on destroy", () => {
      const renderer = createCanvasRenderer();
      const doc: CanvasDocumentType = {
        schemaVersion: "0.1.0",
        id: "test-doc",
        name: "Test Document",
        artboards: [
          {
            id: "artboard-1",
            name: "Artboard 1",
            frame: { x: 0, y: 0, width: 800, height: 600 },
            children: [],
          },
        ],
      };

      renderer.render(doc, container);
      expect(container.children.length).toBeGreaterThan(0);

      renderer.destroy();
      expect(container.children.length).toBe(0);
    });
  });
});

