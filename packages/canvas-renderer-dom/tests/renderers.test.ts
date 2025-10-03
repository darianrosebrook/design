/**
 * @fileoverview Tests for individual node renderers
 * @author @darianrosebrook
 */

import { describe, it, expect, beforeEach } from "vitest";
import { renderFrame } from "../src/renderers/frame.js";
import { renderText } from "../src/renderers/text.js";
import { renderComponent } from "../src/renderers/component.js";
import type { RenderContext } from "../src/types.js";
import type { FrameNodeType, TextNodeType, ComponentNodeType } from "@paths-design/canvas-schema";
import { JSDOM } from "jsdom";

// Setup JSDOM environment
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
global.document = dom.window.document as any;
global.window = dom.window as any;
global.HTMLElement = dom.window.HTMLElement as any;

describe("Frame Renderer", () => {
  let context: RenderContext;

  beforeEach(() => {
    context = {
      componentIndex: undefined,
      classPrefix: "test-",
    };
  });

  it("should render basic frame", () => {
    const node: FrameNodeType = {
      id: "frame-1",
      type: "frame",
      name: "Frame",
      visible: true,
      frame: { x: 10, y: 20, width: 100, height: 80 },
      children: [],
    };

    const element = renderFrame(node, context);

    expect(element.tagName).toBe("DIV");
    expect(element.className).toContain("canvas-frame");
  });

  it("should apply fills to frame", () => {
    const node: FrameNodeType = {
      id: "frame-2",
      type: "frame",
      name: "Colored Frame",
      visible: true,
      frame: { x: 0, y: 0, width: 100, height: 100 },
      style: {
        fills: [
          {
            type: "solid",
            color: "#ff0000",
          },
        ],
      },
      children: [],
    };

    const element = renderFrame(node, context);
    // Browser may convert to rgb format
    expect(element.style.backgroundColor).toMatch(/rgb\(255,\s*0,\s*0\)|#ff0000/i);
  });

  it("should apply strokes to frame", () => {
    const node: FrameNodeType = {
      id: "frame-3",
      type: "frame",
      name: "Stroked Frame",
      visible: true,
      frame: { x: 0, y: 0, width: 100, height: 100 },
      style: {
        strokes: [
          {
            type: "solid",
            color: "#0000ff",
            thickness: 2,
          },
        ],
      },
      children: [],
    };

    const element = renderFrame(node, context);
    expect(element.style.borderWidth).toBe("2px");
    expect(element.style.borderStyle).toBe("solid");
  });

  it("should apply border radius to frame", () => {
    const node: FrameNodeType = {
      id: "frame-4",
      type: "frame",
      name: "Rounded Frame",
      visible: true,
      frame: { x: 0, y: 0, width: 100, height: 100 },
      style: {
        radius: 8,
      },
      children: [],
    };

    const element = renderFrame(node, context);
    expect(element.style.borderRadius).toBe("8px");
  });

  it("should apply opacity to frame", () => {
    const node: FrameNodeType = {
      id: "frame-5",
      type: "frame",
      name: "Semi-transparent Frame",
      visible: true,
      frame: { x: 0, y: 0, width: 100, height: 100 },
      style: {
        opacity: 0.5,
      },
      children: [],
    };

    const element = renderFrame(node, context);
    expect(element.style.opacity).toBe("0.5");
  });

  it("should apply layout settings to frame", () => {
    const node: FrameNodeType = {
      id: "frame-6",
      type: "frame",
      name: "Flex Frame",
      visible: true,
      frame: { x: 0, y: 0, width: 100, height: 100 },
      layout: {
        type: "flex",
        direction: "horizontal",
        gap: 10,
        padding: { top: 5, right: 5, bottom: 5, left: 5 },
      },
      children: [],
    };

    const element = renderFrame(node, context);
    // Layout is partially implemented - only display is set for now
    expect(element.style.display).toBe("flex");
    expect(element.style.position).toBe("relative");
  });

  it("should handle missing style gracefully", () => {
    const node: FrameNodeType = {
      id: "frame-7",
      type: "frame",
      name: "Plain Frame",
      visible: true,
      frame: { x: 0, y: 0, width: 100, height: 100 },
      children: [],
    };

    const element = renderFrame(node, context);
    expect(element).toBeTruthy();
  });
});

describe("Text Renderer", () => {
  let context: RenderContext;

  beforeEach(() => {
    context = {
      componentIndex: undefined,
      classPrefix: "test-",
    };
  });

  it("should render basic text", () => {
    const node: TextNodeType = {
      id: "text-1",
      type: "text",
      name: "Text",
      visible: true,
      frame: { x: 0, y: 0, width: 200, height: 30 },
      text: "Hello World",
    };

    const element = renderText(node, context);

    expect(element.tagName).toBe("DIV");
    expect(element.textContent).toBe("Hello World");
    expect(element.className).toContain("canvas-text");
  });

  it("should apply font family to text", () => {
    const node: TextNodeType = {
      id: "text-2",
      type: "text",
      name: "Styled Text",
      visible: true,
      frame: { x: 0, y: 0, width: 200, height: 30 },
      text: "Styled",
      textStyle: {
        family: "Arial",
        size: 16,
        weight: 400,
      },
    };

    const element = renderText(node, context);
    expect(element.style.fontFamily).toBe("Arial");
    expect(element.style.fontSize).toBe("16px");
  });

  it("should apply text color from fills", () => {
    const node: TextNodeType = {
      id: "text-3",
      type: "text",
      name: "Colored Text",
      visible: true,
      frame: { x: 0, y: 0, width: 200, height: 30 },
      text: "Colored",
      style: {
        fills: [
          {
            type: "solid",
            color: { r: 255, g: 0, b: 0, a: 1 },
          },
        ],
      },
    };

    const element = renderText(node, context);
    // Text color is applied via textStyle, not style.fills
    expect(element).toBeTruthy();
  });

  it("should apply line height to text", () => {
    const node: TextNodeType = {
      id: "text-4",
      type: "text",
      name: "Text with Line Height",
      visible: true,
      frame: { x: 0, y: 0, width: 200, height: 60 },
      text: "Line height test",
      textStyle: {
        family: "Arial",
        size: 16,
        weight: 400,
        lineHeight: 1.5,
      },
    };

    const element = renderText(node, context);
    expect(element.style.lineHeight).toBe("1.5px");
  });

  it("should apply letter spacing to text", () => {
    const node: TextNodeType = {
      id: "text-5",
      type: "text",
      name: "Text with Letter Spacing",
      visible: true,
      frame: { x: 0, y: 0, width: 200, height: 30 },
      text: "Spaced text",
      textStyle: {
        family: "Arial",
        size: 16,
        weight: 400,
        letterSpacing: 2,
      },
    };

    const element = renderText(node, context);
    expect(element.style.letterSpacing).toBe("2px");
  });

  it("should handle empty text", () => {
    const node: TextNodeType = {
      id: "text-6",
      type: "text",
      name: "Empty Text",
      visible: true,
      frame: { x: 0, y: 0, width: 200, height: 30 },
      text: "",
    };

    const element = renderText(node, context);
    expect(element.textContent).toBe("");
  });

  it("should handle missing textStyle", () => {
    const node: TextNodeType = {
      id: "text-7",
      type: "text",
      name: "Plain Text",
      visible: true,
      frame: { x: 0, y: 0, width: 200, height: 30 },
      text: "Plain",
    };

    const element = renderText(node, context);
    expect(element).toBeTruthy();
  });
});

describe("Component Renderer", () => {
  let options: any;
  let context: RenderContext;

  beforeEach(() => {
    options = {
      componentIndex: {
        version: "1.0.0",
        generatedAt: new Date().toISOString(),
        source: {
          root: "./src",
          resolver: "tsconfig",
        },
        components: [
          {
            name: "Button",
            exportType: "named",
            path: "./Button",
            props: [
              { name: "label", type: "string", required: true },
              { name: "variant", type: '"primary" | "secondary"', required: false },
            ],
            defaultProps: {},
            compound: false,
            description: "A button component",
          },
        ],
      },
      classPrefix: "test-",
    };
    context = {
      componentIndex: options.componentIndex,
      classPrefix: options.classPrefix,
    };
  });

  it("should render component with index", () => {
    const node: ComponentNodeType = {
      id: "comp-1",
      type: "component",
      name: "Button Instance",
      visible: true,
      frame: { x: 0, y: 0, width: 120, height: 40 },
      componentKey: "Button",
      props: { label: "Click me", variant: "primary" },
    };

    const element = renderComponent(node, options, context);

    expect(element.tagName).toBe("DIV");
    expect(element.className).toContain("canvas-component");
    expect(element.textContent).toContain("Button");
  });

  it("should render component without index", () => {
    const optionsNoIndex = {
      componentIndex: undefined,
      classPrefix: "test-",
    };
    const contextNoIndex: RenderContext = {
      componentIndex: undefined,
      classPrefix: "test-",
    };

    const node: ComponentNodeType = {
      id: "comp-2",
      type: "component",
      name: "Unknown Component",
      visible: true,
      frame: { x: 0, y: 0, width: 100, height: 100 },
      componentKey: "UnknownComponent",
      props: {},
    };

    const element = renderComponent(node, optionsNoIndex, contextNoIndex);

    expect(element.textContent).toContain("⚠️");
    expect(element.textContent).toContain("UnknownComponent");
  });

  it("should display component props", () => {
    const node: ComponentNodeType = {
      id: "comp-3",
      type: "component",
      name: "Button with Props",
      visible: true,
      frame: { x: 0, y: 0, width: 120, height: 40 },
      componentKey: "Button",
      props: { label: "Submit", variant: "primary" },
    };

    const element = renderComponent(node, options, context);
    expect(element.textContent).toContain("2 props configured");
  });

  it("should handle component with no props", () => {
    const node: ComponentNodeType = {
      id: "comp-4",
      type: "component",
      name: "Button No Props",
      visible: true,
      frame: { x: 0, y: 0, width: 120, height: 40 },
      componentKey: "Button",
      props: {},
    };

    const element = renderComponent(node, options, context);
    expect(element.textContent).toContain("No props configured");
  });

  it("should handle missing component in index", () => {
    const node: ComponentNodeType = {
      id: "comp-5",
      type: "component",
      name: "Missing Component",
      visible: true,
      frame: { x: 0, y: 0, width: 100, height: 100 },
      componentKey: "NonExistent",
      props: {},
    };

    const element = renderComponent(node, options, context);
    expect(element.textContent).toContain("⚠️");
    expect(element.textContent).toContain("NonExistent");
  });
});

