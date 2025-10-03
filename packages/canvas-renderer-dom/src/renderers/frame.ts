/**
 * @fileoverview Frame node renderer
 * @author @darianrosebrook
 *
 * Renders frame nodes as container elements with layout support.
 * Frames are the primary container type in the canvas document model.
 */

import type { FrameNodeType } from "@paths-design/canvas-schema";
import type { RendererOptions, RenderContext } from "../types.js";
import { RENDERER_CLASSES } from "../types.js";

/**
 * Render a frame node to DOM
 *
 * Frames are container elements that can hold children. They support:
 * - Background fills and strokes
 * - Layout modes (none, flex, grid - future)
 * - Clipping and overflow behavior
 * - Border radius and effects
 *
 * @param node - Frame node to render
 * @param options - Renderer configuration options
 * @param context - Render context with document and parent info
 * @returns HTMLElement representing the frame
 */
export function renderFrame(
  node: FrameNodeType,
  options: RendererOptions,
  _context: RenderContext
): HTMLElement {
  const element = document.createElement("div");

  // Set CSS classes
  element.classList.add(
    `${options.classPrefix ?? ""}${RENDERER_CLASSES.FRAME}`
  );

  // Apply visibility
  if (!node.visible) {
    element.style.display = "none";
  }

  // Apply base styles
  applyFrameStyles(element, node);

  // Apply background fills
  if (node.style?.fills && node.style.fills.length > 0) {
    applyFills(element, node.style.fills);
  }

  // Apply border/stroke
  if (node.style?.strokes && node.style.strokes.length > 0) {
    applyStrokes(element, node.style.strokes);
  }

  // Apply border radius if present (using 'radius' from schema)
  if (node.style?.radius !== undefined) {
    const radius = node.style.radius;
    element.style.borderRadius = `${radius}px`;
  }

  // Apply opacity
  if (node.style?.opacity !== undefined && node.style.opacity !== 1) {
    element.style.opacity = node.style.opacity.toString();
  }

  // Apply layout settings
  if (node.layout) {
    applyLayout(element, node.layout);
  }

  // Set overflow behavior (default to visible)
  element.style.overflow = "visible";

  return element;
}

/**
 * Apply base frame styles (container behavior)
 */
function applyFrameStyles(element: HTMLElement, _node: FrameNodeType): void {
  // Frame acts as a positioned container
  element.style.boxSizing = "border-box";

  // Enable GPU acceleration for transforms
  element.style.willChange = "transform";
}

/**
 * Apply fill styles to element
 */
function applyFills(element: HTMLElement, fills: any[]): void {
  if (!fills || fills.length === 0) {return;}

  // For now, handle solid fills (most common case)
  // TODO: Support gradients, images in future
  const solidFills = fills.filter((f) => f.type === "solid");

  if (solidFills.length > 0) {
    const fill = solidFills[0];
    const opacity = fill.opacity ?? 1;
    element.style.backgroundColor = fill.color ?? "transparent";

    if (opacity !== 1) {
      // Apply opacity to background only
      const color = fill.color ?? "transparent";
      if (color.startsWith("#")) {
        // Convert hex to rgba
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        element.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
      } else {
        element.style.backgroundColor = color;
      }
    }
  }
}

/**
 * Apply stroke/border styles to element
 */
function applyStrokes(element: HTMLElement, strokes: any[]): void {
  if (!strokes || strokes.length === 0) {return;}

  // For now, handle solid strokes (most common case)
  const solidStrokes = strokes.filter((s) => s.type === "solid");

  if (solidStrokes.length > 0) {
    const stroke = solidStrokes[0];
    const width = stroke.thickness ?? 1;
    const color = stroke.color ?? "#000000";
    const opacity = stroke.opacity ?? 1;

    element.style.borderStyle = "solid";
    element.style.borderWidth = `${width}px`;

    if (opacity !== 1 && color.startsWith("#")) {
      // Convert to rgba
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      element.style.borderColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
    } else {
      element.style.borderColor = color;
    }
  }
}

/**
 * Apply layout configuration
 *
 * Currently supports:
 * - none: No layout (absolute positioning of children)
 * - Future: flex, grid layouts
 */
function applyLayout(
  element: HTMLElement,
  layout: FrameNodeType["layout"]
): void {
  if (!layout) {return;}

  switch (layout.type) {
    case "none":
      // Children use absolute positioning (default behavior)
      element.style.position = "relative";
      break;

    case "flex":
      // TODO: Implement flexbox layout
      element.style.display = "flex";
      element.style.position = "relative";
      break;

    case "grid":
      // TODO: Implement grid layout
      element.style.display = "grid";
      element.style.position = "relative";
      break;

    default:
      element.style.position = "relative";
  }
}
