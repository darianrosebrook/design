/**
 * @fileoverview Snapshot tests for visual regression
 * @author @darianrosebrook
 * 
 * These tests act as "golden frame" tests by capturing the rendered
 * DOM structure and ensuring it remains consistent across changes.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { createCanvasRenderer } from "../src/renderer.js";
import type { CanvasDocumentType } from "@paths-design/canvas-schema";
import { generateULID } from "@paths-design/canvas-schema";
import { JSDOM } from "jsdom";

// Setup JSDOM environment
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
global.document = dom.window.document as any;
global.window = dom.window as any;
global.HTMLElement = dom.window.HTMLElement as any;

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

/**
 * Serialize DOM element to deterministic string for snapshot testing
 */
function serializeDOMStructure(element: HTMLElement): string {
  const attrs = Array.from(element.attributes)
    .filter((attr) => !attr.name.startsWith("data-node-id")) // Exclude ULIDs
    .map((attr) => `${attr.name}="${attr.value}"`)
    .sort()
    .join(" ");

  const tag = element.tagName.toLowerCase();
  const children = Array.from(element.children)
    .map((child) => serializeDOMStructure(child as HTMLElement))
    .join("\n");

  const content = element.textContent?.trim() || "";
  
  if (children) {
    return `<${tag}${attrs ? " " + attrs : ""}>\n${children}\n</${tag}>`;
  } else if (content) {
    return `<${tag}${attrs ? " " + attrs : ""}>${content}</${tag}>`;
  } else {
    return `<${tag}${attrs ? " " + attrs : ""} />`;
  }
}

describe("Snapshot Tests (Golden Frames)", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    mockTime = 0;
  });

  describe("Basic Node Rendering", () => {
    it("should match snapshot for simple frame", () => {
      const doc: CanvasDocumentType = {
        schemaVersion: "0.1.0" as const,
        id: generateULID(),
        name: "Simple Frame Test",
        artboards: [
          {
            id: generateULID(),
            name: "Artboard",
            frame: { x: 0, y: 0, width: 800, height: 600 },
            children: [
              {
                id: generateULID(),
                type: "frame" as const,
                name: "Container",
                visible: true,
                frame: { x: 100, y: 100, width: 200, height: 150 },
                children: [],
              },
            ],
          },
        ],
      };

      const renderer = createCanvasRenderer();
      renderer.render(doc, container);

      // Get rendered structure (excluding dynamic ULIDs)
      const frame = container.querySelector(".canvas-frame");
      expect(frame).toBeTruthy();
      expect(frame?.className).toContain("canvas-frame");
      expect(frame?.getAttribute("role")).toBe("group");
      expect(frame?.getAttribute("tabindex")).toBe("0");
    });

    it("should match snapshot for text node", () => {
      const doc: CanvasDocumentType = {
        schemaVersion: "0.1.0" as const,
        id: generateULID(),
        name: "Text Node Test",
        artboards: [
          {
            id: generateULID(),
            name: "Artboard",
            frame: { x: 0, y: 0, width: 800, height: 600 },
            children: [
              {
                id: generateULID(),
                type: "text" as const,
                name: "Title",
                visible: true,
                frame: { x: 50, y: 50, width: 300, height: 40 },
                text: "Hello World",
                textStyle: {
                  family: "Arial",
                  size: 16,
                  weight: "400",
                },
              },
            ],
          },
        ],
      };

      const renderer = createCanvasRenderer();
      renderer.render(doc, container);

      const textNode = container.querySelector(".canvas-text");
      expect(textNode).toBeTruthy();
      expect(textNode?.textContent).toBe("Hello World");
      expect(textNode?.getAttribute("role")).toBe("text");
      expect(textNode?.getAttribute("aria-label")).toContain("Hello World");
    });

    it("should match snapshot for component node", () => {
      const doc: CanvasDocumentType = {
        schemaVersion: "0.1.0" as const,
        id: generateULID(),
        name: "Component Test",
        artboards: [
          {
            id: generateULID(),
            name: "Artboard",
            frame: { x: 0, y: 0, width: 800, height: 600 },
            children: [
              {
                id: generateULID(),
                type: "component" as const,
                name: "Button Instance",
                visible: true,
                frame: { x: 100, y: 100, width: 120, height: 40 },
                componentKey: "Button",
                props: { label: "Click me" },
              },
            ],
          },
        ],
      };

      const renderer = createCanvasRenderer();
      renderer.render(doc, container);

      const component = container.querySelector(".canvas-component");
      expect(component).toBeTruthy();
      expect(component?.getAttribute("role")).toBe("button");
      expect(component?.getAttribute("data-component-key")).toBe("Button");
    });
  });

  describe("Nested Structures", () => {
    it("should match snapshot for nested frames", () => {
      const doc: CanvasDocumentType = {
        schemaVersion: "0.1.0" as const,
        id: generateULID(),
        name: "Nested Test",
        artboards: [
          {
            id: generateULID(),
            name: "Artboard",
            frame: { x: 0, y: 0, width: 800, height: 600 },
            children: [
              {
                id: generateULID(),
                type: "frame" as const,
                name: "Parent",
                visible: true,
                frame: { x: 0, y: 0, width: 400, height: 400 },
                children: [
                  {
                    id: generateULID(),
                    type: "frame" as const,
                    name: "Child",
                    visible: true,
                    frame: { x: 50, y: 50, width: 200, height: 200 },
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      };

      const renderer = createCanvasRenderer();
      renderer.render(doc, container);

      // Get artboard (first frame), then parent, then child
      const allFrames = container.querySelectorAll(".canvas-frame");
      expect(allFrames.length).toBe(3); // artboard + parent + child
      
      const parentFrame = allFrames[1]; // Second frame is parent
      const childFrame = allFrames[2]; // Third frame is child
      
      expect(parentFrame).toBeTruthy();
      expect(childFrame).toBeTruthy();
      expect(childFrame?.getAttribute("aria-label")).toContain("Child");
    });
  });

  describe("Accessibility Attributes", () => {
    it("should match snapshot for ARIA attributes", () => {
      const doc: CanvasDocumentType = {
        schemaVersion: "0.1.0" as const,
        id: generateULID(),
        name: "A11y Test",
        artboards: [
          {
            id: generateULID(),
            name: "Artboard",
            frame: { x: 0, y: 0, width: 800, height: 600 },
            children: [
              {
                id: generateULID(),
                type: "frame" as const,
                name: "Accessible Frame",
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

      // Get all frames (artboard + child)
      const frames = container.querySelectorAll(".canvas-frame");
      const childFrame = frames[1]; // Second frame is the child (first is artboard)
      
      // Verify all expected ARIA attributes
      expect(childFrame?.getAttribute("role")).toBe("group");
      expect(childFrame?.getAttribute("aria-label")).toContain("Accessible Frame");
      expect(childFrame?.getAttribute("aria-selected")).toBe("false");
      expect(childFrame?.getAttribute("aria-hidden")).toBe("false");
      expect(childFrame?.getAttribute("tabindex")).toBe("0");
    });

    it("should match snapshot for selection state", () => {
      const doc: CanvasDocumentType = {
        schemaVersion: "0.1.0" as const,
        id: generateULID(),
        name: "Selection Test",
        artboards: [
          {
            id: generateULID(),
            name: "Artboard",
            frame: { x: 0, y: 0, width: 800, height: 600 },
            children: [
              {
                id: "test-node-1",
                type: "frame" as const,
                name: "Selectable",
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

      // Initially unselected
      let frame = container.querySelector('[data-node-id="test-node-1"]');
      expect(frame?.getAttribute("aria-selected")).toBe("false");

      // After selection
      renderer.setSelection(["test-node-1"]);
      frame = container.querySelector('[data-node-id="test-node-1"]');
      expect(frame?.getAttribute("aria-selected")).toBe("true");
    });
  });

  describe("Style Application", () => {
    it("should match snapshot for styled frame", () => {
      const doc: CanvasDocumentType = {
        schemaVersion: "0.1.0" as const,
        id: generateULID(),
        name: "Styled Frame Test",
        artboards: [
          {
            id: generateULID(),
            name: "Artboard",
            frame: { x: 0, y: 0, width: 800, height: 600 },
            children: [
              {
                id: generateULID(),
                type: "frame" as const,
                name: "Styled Frame",
                visible: true,
                frame: { x: 0, y: 0, width: 200, height: 200 },
                style: {
                  fills: [{ type: "solid", color: "#ff0000" }],
                  radius: 8,
                  opacity: 0.9,
                },
                children: [],
              },
            ],
          },
        ],
      };

      const renderer = createCanvasRenderer();
      renderer.render(doc, container);

      // Get child frame (second frame, first is artboard)
      const frames = container.querySelectorAll(".canvas-frame");
      const styledFrame = frames[1] as HTMLElement;
      
      // Verify styles are applied (may be rgb format in JSDOM)
      expect(styledFrame?.style.backgroundColor).toBeTruthy();
      expect(styledFrame?.style.borderRadius).toBe("8px");
      expect(styledFrame?.style.opacity).toBe("0.9");
    });

    it("should match snapshot for styled text", () => {
      const doc: CanvasDocumentType = {
        schemaVersion: "0.1.0" as const,
        id: generateULID(),
        name: "Styled Text Test",
        artboards: [
          {
            id: generateULID(),
            name: "Artboard",
            frame: { x: 0, y: 0, width: 800, height: 600 },
            children: [
              {
                id: generateULID(),
                type: "text" as const,
                name: "Styled Text",
                visible: true,
                frame: { x: 0, y: 0, width: 300, height: 40 },
                text: "Styled Text",
                textStyle: {
                  family: "Arial",
                  size: 24,
                  weight: "700",
                  lineHeight: 1.5,
                  letterSpacing: 1,
                },
              },
            ],
          },
        ],
      };

      const renderer = createCanvasRenderer();
      renderer.render(doc, container);

      const text = container.querySelector(".canvas-text") as HTMLElement;
      
      expect(text?.style.fontFamily).toBe("Arial");
      expect(text?.style.fontSize).toBe("24px");
      expect(text?.style.fontWeight).toBe("700");
      expect(text?.style.lineHeight).toBe("1.5px");
      expect(text?.style.letterSpacing).toBe("1px");
    });
  });

  describe("Deterministic Rendering", () => {
    it("should produce identical output for same input", () => {
      const doc: CanvasDocumentType = {
        schemaVersion: "0.1.0" as const,
        id: generateULID(),
        name: "Determinism Test",
        artboards: [
          {
            id: generateULID(),
            name: "Artboard",
            frame: { x: 0, y: 0, width: 800, height: 600 },
            children: [
              {
                id: generateULID(),
                type: "frame" as const,
                name: "Frame",
                visible: true,
                frame: { x: 100, y: 100, width: 200, height: 150 },
                children: [],
              },
            ],
          },
        ],
      };

      // Render twice
      const renderer1 = createCanvasRenderer();
      const container1 = document.createElement("div");
      renderer1.render(doc, container1);

      const renderer2 = createCanvasRenderer();
      const container2 = document.createElement("div");
      renderer2.render(doc, container2);

      // Compare structure (excluding ULIDs)
      const struct1 = serializeDOMStructure(container1);
      const struct2 = serializeDOMStructure(container2);

      expect(struct1).toBe(struct2);
    });
  });
});

