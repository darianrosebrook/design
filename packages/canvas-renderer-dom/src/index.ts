/**
 * @fileoverview Canvas Renderer DOM package exports
 * @author @darianrosebrook
 *
 * DOM-based renderer for canvas documents. Renders CanvasDocument instances
 * to interactive HTML elements for display in VS Code webviews.
 */

// Main renderer
export { CanvasDOMRenderer, createCanvasRenderer } from "./renderer.js";

// Types
export type {
  CanvasRenderer,
  RendererOptions,
  RenderedNode,
  SelectionState,
  RenderContext,
  NodeRenderer,
} from "./types.js";

export { RENDERER_CLASSES, RENDERER_EVENTS } from "./types.js";

// Individual node renderers (exported for testing and extensibility)
export { renderFrame } from "./renderers/frame.js";
export { renderText } from "./renderers/text.js";
export { renderComponent } from "./renderers/component.js";
