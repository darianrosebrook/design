/**
 * @fileoverview Type definitions for DOM renderer
 * @author @darianrosebrook
 */

import type { CanvasDocumentType, NodeType } from "@paths-design/canvas-schema";
import type { ComponentIndex } from "@paths-design/component-indexer";

/**
 * Renderer configuration options
 */
export interface RendererOptions {
  /** Component index for resolving component instances */
  componentIndex?: ComponentIndex | undefined;
  /** Enable interactive mode (selection, manipulation) */
  interactive?: boolean;
  /** Custom CSS class prefix */
  classPrefix?: string;
  /** Selection callback */
  onSelectionChange?: (nodeIds: string[]) => void;
  /** Node update callback */
  onNodeUpdate?: (nodeId: string, updates: Partial<NodeType>) => void;
}

/**
 * Rendered node information
 */
export interface RenderedNode {
  /** DOM element */
  element: HTMLElement;
  /** Canvas node ID */
  nodeId: string;
  /** Node type */
  nodeType: NodeType["type"];
  /** Bounding rectangle */
  bounds: DOMRect;
}

/**
 * Selection state
 */
export interface SelectionState {
  /** Selected node IDs */
  selectedIds: Set<string>;
  /** Selection bounds */
  bounds?: DOMRect;
}

/**
 * Renderer instance
 */
export interface CanvasRenderer {
  /** Render canvas document to DOM */
  render(document: CanvasDocumentType, container: HTMLElement): void;

  /** Update specific nodes (with dirty tracking) */
  updateNodes(nodeIds: string[], updates: Partial<NodeType>[]): void;

  /** Update selection */
  setSelection(nodeIds: string[]): void;

  /** Get rendered node information */
  getRenderedNode(nodeId: string): RenderedNode | null;

  /** Get all rendered nodes */
  getRenderedNodes(): RenderedNode[];

  /** Cleanup renderer */
  destroy(): void;

  /** Get current FPS (performance monitoring) */
  getFPS(): number;

  /** Get number of dirty nodes (performance monitoring) */
  getDirtyNodeCount(): number;

  /** Get current pixel ratio (High-DPI display info) */
  getPixelRatio(): number;
}

/**
 * Node renderer function
 */
export type NodeRenderer = (
  node: NodeType,
  options: RendererOptions,
  context: RenderContext
) => HTMLElement;

/**
 * Render context passed to node renderers
 */
export interface RenderContext {
  /** Document being rendered */
  document: CanvasDocumentType;
  /** Renderer options */
  options: RendererOptions;
  /** Selection state */
  selection: SelectionState;
  /** Parent element */
  parentElement: HTMLElement;
  /** Node ID to element mapping */
  nodeElements: Map<string, HTMLElement>;
}

/**
 * CSS class names used by renderer
 */
export const RENDERER_CLASSES = {
  CANVAS: "canvas-renderer",
  NODE: "canvas-node",
  FRAME: "canvas-frame",
  RECTANGLE: "canvas-rectangle",
  TEXT: "canvas-text",
  COMPONENT: "canvas-component",
  SELECTED: "canvas-selected",
  SELECTION_OUTLINE: "canvas-selection-outline",
  SELECTION_HANDLES: "canvas-selection-handles",
  HANDLE: "canvas-handle",
  HANDLE_NW: "canvas-handle-nw",
  HANDLE_NE: "canvas-handle-ne",
  HANDLE_SW: "canvas-handle-sw",
  HANDLE_SE: "canvas-handle-se",
} as const;

/**
 * Event types emitted by renderer
 */
export const RENDERER_EVENTS = {
  NODE_CLICK: "node-click",
  NODE_DOUBLE_CLICK: "node-double-click",
  SELECTION_CHANGE: "selection-change",
  NODE_DRAG_START: "node-drag-start",
  NODE_DRAG: "node-drag",
  NODE_DRAG_END: "node-drag-end",
  CANVAS_CLICK: "canvas-click",
} as const;
