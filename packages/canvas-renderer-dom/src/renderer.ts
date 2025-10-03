/**
 * @fileoverview Main canvas DOM renderer
 * @author @darianrosebrook
 */

import type {
  CanvasDocumentType,
  NodeType,
  FrameNodeType,
  TextNodeType,
  // ComponentInstanceNodeType, // TODO: Remove if not needed
} from "@paths-design/canvas-schema";
import type { Observability} from "./observability.js";
import { createObservability } from "./observability.js";
import { renderComponent } from "./renderers/component.js";
import { renderFrame } from "./renderers/frame.js";
import { renderText } from "./renderers/text.js";
import type {
  CanvasRenderer,
  RendererOptions,
  RenderedNode,
  SelectionState,
  RenderContext,
  NodeRenderer,
} from "./types.js";
import { RENDERER_CLASSES } from "./types.js";

/**
 * DOM-based canvas renderer
 * Renders CanvasDocument instances to interactive HTML elements
 */
export class CanvasDOMRenderer implements CanvasRenderer {
  private container: HTMLElement | null = null;
  private document: CanvasDocumentType | null = null;
  private options: RendererOptions & {
    interactive: boolean;
    classPrefix: string;
    onSelectionChange: (nodeIds: string[]) => void;
    onNodeUpdate: (nodeId: string, updates: Partial<NodeType>) => void;
  };
  private selection: SelectionState = { selectedIds: new Set() };
  private nodeElements = new Map<string, HTMLElement>();
  private eventListeners = new Map<string, EventListener>();

  // Performance tracking
  private dirtyNodes = new Set<string>();
  private rafId: number | null = null;
  private lastFrameTime = 0;
  private frameCount = 0;
  private fps = 60;

  // High-DPI support
  private pixelRatio = 1;

  // Accessibility support
  private focusedNodeId: string | null = null;
  private liveRegion: HTMLElement | null = null;

  // Observability
  private observability: Observability;

  constructor(options: RendererOptions = {}) {
    this.options = {
      componentIndex: options.componentIndex,
      interactive: options.interactive ?? true,
      classPrefix: options.classPrefix ?? "",
      onSelectionChange: options.onSelectionChange ?? (() => {}),
      onNodeUpdate: options.onNodeUpdate ?? (() => {}),
    };

    // Initialize observability
    this.observability = createObservability(
      process.env.NODE_ENV !== "production"
    );
  }

  /**
   * Render canvas document to DOM
   */
  render(document: CanvasDocumentType, container: HTMLElement): void {
    const startTime = performance.now();
    const nodeCount = document.artboards.reduce(
      (sum, ab) => sum + (ab.children?.length ?? 0),
      0
    );

    this.observability.logger.info("renderer.render.start", "Starting render", {
      documentId: document.id,
      nodeCount,
    });
    this.observability.tracer.start("renderer.render.pipeline");

    this.document = document;
    this.container = container;

    // Clear previous render
    container.innerHTML = "";
    this.nodeElements.clear();
    this.clearEventListeners();

    // Detect High-DPI display
    this.pixelRatio = window.devicePixelRatio || 1;

    // Set up container
    container.className = `${this.options.classPrefix}${RENDERER_CLASSES.CANVAS}`;
    container.style.position = "relative";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.overflow = "hidden";

    // Accessibility: Set ARIA role for canvas
    container.setAttribute("role", "application");
    container.setAttribute("aria-label", "Canvas design editor");
    container.tabIndex = 0; // Make container focusable

    // Apply High-DPI scaling hint for crisp rendering
    if (this.pixelRatio > 1) {
      container.style.imageRendering = "crisp-edges";
      container.style.transform = `scale(${1 / this.pixelRatio})`;
      container.style.transformOrigin = "0 0";
      // Scale container back up to maintain visual size
      container.style.width = `${100 * this.pixelRatio}%`;
      container.style.height = `${100 * this.pixelRatio}%`;
    }

    // Create live region for screen reader announcements
    this.createLiveRegion(container);

    // Create render context
    const context: RenderContext = {
      document,
      options: this.options,
      selection: this.selection,
      parentElement: container,
      nodeElements: this.nodeElements,
    };

    // Render all artboards
    for (const artboard of document.artboards) {
      // Render artboard as a frame
      const artboardElement = this.renderNode(artboard as any, context);
      container.appendChild(artboardElement);
    }

    // Set up event listeners if interactive
    if (this.options.interactive) {
      this.setupEventListeners(container);
      this.setupKeyboardNavigation(container);
    }

    // Render selection overlay
    this.updateSelectionOverlay();

    // Observability: Complete render
    this.observability.tracer.end("renderer.render.pipeline");
    const duration = performance.now() - startTime;

    this.observability.logger.info(
      "renderer.render.complete",
      "Render complete",
      {
        documentId: document.id,
        nodeCount,
        duration: `${duration.toFixed(2)}ms`,
        nodesDrawn: this.nodeElements.size,
      }
    );

    this.observability.metrics.histogram(
      "renderer_frame_duration_ms",
      duration,
      { document_id: document.id }
    );
    this.observability.metrics.counter(
      "renderer_nodes_drawn_total",
      this.nodeElements.size,
      { document_id: document.id }
    );
    this.observability.metrics.gauge("renderer_fps", this.fps);
  }

  /**
   * Update specific nodes (with dirty tracking)
   */
  updateNodes(nodeIds: string[], updates: Partial<NodeType>[]): void {
    if (!this.document || !this.container) {return;}

    this.observability.logger.debug("renderer.updateNodes", "Updating nodes", {
      nodeCount: nodeIds.length,
    });

    // Mark nodes as dirty
    for (const nodeId of nodeIds) {
      this.dirtyNodes.add(nodeId);
    }

    this.observability.metrics.counter(
      "renderer_dirty_nodes_total",
      nodeIds.length
    );

    // Schedule update on next frame (throttled)
    this.scheduleUpdate(() => {
      for (let i = 0; i < nodeIds.length; i++) {
        const nodeId = nodeIds[i];
        const update = updates[i];
        const element = this.nodeElements.get(nodeId);

        if (element && update) {
          this.updateNodeElement(element, update);
          this.dirtyNodes.delete(nodeId);
        }
      }
    });
  }

  /**
   * Update selection
   */
  setSelection(nodeIds: string[]): void {
    const previousSelection = new Set(this.selection.selectedIds);
    this.selection.selectedIds = new Set(nodeIds);

    // Update ARIA attributes for changed nodes
    for (const nodeId of previousSelection) {
      if (!this.selection.selectedIds.has(nodeId)) {
        const element = this.nodeElements.get(nodeId);
        if (element) {
          element.setAttribute("aria-selected", "false");
        }
      }
    }

    for (const nodeId of this.selection.selectedIds) {
      const element = this.nodeElements.get(nodeId);
      if (element) {
        element.setAttribute("aria-selected", "true");
      }
    }

    this.updateSelectionOverlay();
    this.options.onSelectionChange([...nodeIds]);
  }

  /**
   * Get rendered node information
   */
  getRenderedNode(nodeId: string): RenderedNode | null {
    const element = this.nodeElements.get(nodeId);
    if (!element) {return null;}

    return {
      element,
      nodeId,
      nodeType: element.dataset.nodeType as NodeType["type"],
      bounds: element.getBoundingClientRect(),
    };
  }

  /**
   * Get all rendered nodes
   */
  getRenderedNodes(): RenderedNode[] {
    const nodes: RenderedNode[] = [];
    for (const [nodeId, element] of this.nodeElements) {
      nodes.push({
        element,
        nodeId,
        nodeType: element.dataset.nodeType as NodeType["type"],
        bounds: element.getBoundingClientRect(),
      });
    }
    return nodes;
  }

  /**
   * Cleanup renderer
   */
  destroy(): void {
    this.clearEventListeners();

    // Cancel any pending animation frames
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.container) {
      this.container.innerHTML = "";
      this.container = null;
    }
    this.nodeElements.clear();
    this.dirtyNodes.clear();
    this.document = null;
  }

  /**
   * Schedule an update on the next animation frame (throttled)
   * This ensures we don't update more than 60fps
   */
  private scheduleUpdate(callback: () => void): void {
    if (this.rafId !== null) {
      // Already scheduled, will batch this update
      return;
    }

    this.rafId = requestAnimationFrame((timestamp) => {
      // Calculate FPS
      if (this.lastFrameTime > 0) {
        const delta = timestamp - this.lastFrameTime;
        this.frameCount++;

        // Update FPS every 60 frames
        if (this.frameCount >= 60) {
          this.fps = Math.round(1000 / (delta / this.frameCount));
          this.frameCount = 0;
        }
      }
      this.lastFrameTime = timestamp;

      // Execute callback
      callback();

      // Clear RAF ID
      this.rafId = null;
    });
  }

  /**
   * Get current FPS (for performance monitoring)
   */
  getFPS(): number {
    return this.fps;
  }

  /**
   * Get number of dirty nodes (for performance monitoring)
   */
  getDirtyNodeCount(): number {
    return this.dirtyNodes.size;
  }

  /**
   * Get current pixel ratio (for High-DPI display info)
   */
  getPixelRatio(): number {
    return this.pixelRatio;
  }

  /**
   * Get observability instance for monitoring
   */
  getObservability(): Observability {
    return this.observability;
  }

  /**
   * Render a single node
   */
  private renderNode(node: NodeType, context: RenderContext): HTMLElement {
    const renderer = this.getNodeRenderer(node);
    const element = renderer(node, this.options, context);

    // Set common attributes
    element.dataset.nodeId = node.id;
    element.dataset.nodeType = node.type;
    element.classList.add(
      `${this.options.classPrefix}${RENDERER_CLASSES.NODE}`,
      `${this.options.classPrefix}${RENDERER_CLASSES.NODE}-${node.type}`
    );

    // Accessibility: Add ARIA attributes
    this.applyAccessibilityAttributes(element, node);

    // Apply positioning
    this.applyNodePositioning(element, node);

    // Store reference
    this.nodeElements.set(node.id, element);

    // Render children if this is a frame (or artboard)
    if (node.type === "frame" || (node as any).children) {
      const frameNode = node as FrameNodeType;
      const childContext = { ...context, parentElement: element };

      for (const childNode of frameNode.children ?? []) {
        const childElement = this.renderNode(childNode, childContext);
        element.appendChild(childElement);
      }
    }

    return element;
  }

  /**
   * Get renderer for node type
   */
  private getNodeRenderer(node: NodeType): NodeRenderer {
    switch (node.type) {
      case "frame":
        return renderFrame;
      case "text":
        return renderText;
      case "component":
        return renderComponent;
      default:
        // Fallback renderer for unknown types (vector, group, image, etc.)
        return renderFrame; // Use frame renderer as fallback
    }
  }

  /**
   * Apply positioning styles to node element
   */
  private applyNodePositioning(element: HTMLElement, node: NodeType): void {
    const { x = 0, y = 0, width = 100, height = 100 } = node.frame || {};

    // Apply High-DPI scaling for crisp rendering
    const scaledX = x * this.pixelRatio;
    const scaledY = y * this.pixelRatio;
    const scaledWidth = width * this.pixelRatio;
    const scaledHeight = height * this.pixelRatio;

    element.style.position = "absolute";
    element.style.left = `${scaledX}px`;
    element.style.top = `${scaledY}px`;
    element.style.width = `${scaledWidth}px`;
    element.style.height = `${scaledHeight}px`;

    // Apply rotation if present
    if (node.rotation && node.rotation !== 0) {
      element.style.transform = `rotate(${node.rotation}deg)`;
      element.style.transformOrigin = "center center";
    }
  }

  /**
   * Update node element with partial updates
   */
  private updateNodeElement(
    element: HTMLElement,
    updates: Partial<NodeType>
  ): void {
    if (updates.frame) {
      const frame = { ...element.getBoundingClientRect(), ...updates.frame };
      element.style.left = `${frame.x || 0}px`;
      element.style.top = `${frame.y || 0}px`;
      element.style.width = `${frame.width || 100}px`;
      element.style.height = `${frame.height || 100}px`;
    }

    if (updates.rotation !== undefined) {
      element.style.transform =
        updates.rotation !== 0 ? `rotate(${updates.rotation}deg)` : "";
    }

    // Update selection styling
    const isSelected = this.selection.selectedIds.has(element.dataset.nodeId!);
    element.classList.toggle(
      `${this.options.classPrefix}${RENDERER_CLASSES.SELECTED}`,
      isSelected
    );
  }

  /**
   * Set up event listeners for interactivity
   */
  private setupEventListeners(container: HTMLElement): void {
    const handleCanvasClick = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target === container || !target.closest(`[data-node-id]`)) {
        this.setSelection([]);
      }
    };

    const handleNodeClick = (event: Event) => {
      const mouseEvent = event as MouseEvent;
      const target = mouseEvent.target as HTMLElement;
      const nodeElement = target.closest(`[data-node-id]`) as HTMLElement;
      if (nodeElement) {
        const nodeId = nodeElement.dataset.nodeId!;
        mouseEvent.stopPropagation();

        if (mouseEvent.ctrlKey || mouseEvent.metaKey) {
          // Multi-select
          const newSelection = new Set(this.selection.selectedIds);
          if (newSelection.has(nodeId)) {
            newSelection.delete(nodeId);
          } else {
            newSelection.add(nodeId);
          }
          this.setSelection([...newSelection]);
        } else {
          // Single select
          this.setSelection([nodeId]);
        }
      }
    };

    container.addEventListener("click", handleCanvasClick);
    container.addEventListener("click", handleNodeClick, true);

    this.eventListeners.set("canvas-click", handleCanvasClick);
    this.eventListeners.set("node-click", handleNodeClick);
  }

  /**
   * Clear all event listeners
   */
  private clearEventListeners(): void {
    if (this.container) {
      for (const [eventType, listener] of this.eventListeners) {
        if (eventType === "canvas-click") {
          this.container.removeEventListener("click", listener);
        } else if (eventType === "node-click") {
          this.container.removeEventListener("click", listener, true);
        } else if (eventType === "keydown") {
          this.container.removeEventListener("keydown", listener);
        }
      }
    }
    this.eventListeners.clear();
  }

  /**
   * Create live region for screen reader announcements
   */
  private createLiveRegion(container: HTMLElement): void {
    this.liveRegion = document.createElement("div");
    this.liveRegion.setAttribute("role", "status");
    this.liveRegion.setAttribute("aria-live", "polite");
    this.liveRegion.setAttribute("aria-atomic", "true");
    this.liveRegion.style.position = "absolute";
    this.liveRegion.style.left = "-10000px";
    this.liveRegion.style.width = "1px";
    this.liveRegion.style.height = "1px";
    this.liveRegion.style.overflow = "hidden";
    container.appendChild(this.liveRegion);
  }

  /**
   * Announce message to screen readers
   */
  private announce(message: string): void {
    if (!this.liveRegion) {return;}

    // Clear and set message
    this.liveRegion.textContent = "";
    setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = message;
      }
    }, 100);
  }

  /**
   * Apply accessibility attributes to node element
   */
  private applyAccessibilityAttributes(
    element: HTMLElement,
    node: NodeType
  ): void {
    // Make element focusable
    element.tabIndex = 0;

    // Set ARIA role based on node type
    switch (node.type) {
      case "frame":
        element.setAttribute("role", "group");
        element.setAttribute("aria-label", `Frame: ${node.name}`);
        break;
      case "text":
        element.setAttribute("role", "text");
        const textNode = node as TextNodeType;
        element.setAttribute(
          "aria-label",
          `Text: ${textNode.text || node.name}`
        );
        break;
      case "component":
        element.setAttribute("role", "button");
        element.setAttribute("aria-label", `Component: ${node.name}`);
        break;
      default:
        element.setAttribute("role", "group");
        element.setAttribute("aria-label", node.name);
    }

    // Set visibility state
    element.setAttribute("aria-hidden", (!node.visible).toString());

    // Set selection state
    const isSelected = this.selection.selectedIds.has(node.id);
    element.setAttribute("aria-selected", isSelected.toString());
  }

  /**
   * Setup keyboard navigation
   */
  private setupKeyboardNavigation(container: HTMLElement): void {
    const handleKeyDown = (event: Event) => {
      const keyEvent = event as KeyboardEvent;
      const focusedElement = document.activeElement as HTMLElement;
      const focusedNodeId = focusedElement?.dataset?.nodeId;

      switch (keyEvent.key) {
        case "Tab":
          // Let default tab behavior work
          break;

        case "Enter":
        case " ": // Space
          keyEvent.preventDefault();
          if (focusedNodeId) {
            // Toggle selection
            const newSelection = new Set(this.selection.selectedIds);
            if (newSelection.has(focusedNodeId)) {
              newSelection.delete(focusedNodeId);
              const label = focusedElement.getAttribute("aria-label") || "item";
              this.announce(`Deselected ${label}`);
            } else {
              newSelection.add(focusedNodeId);
              const label = focusedElement.getAttribute("aria-label") || "item";
              this.announce(`Selected ${label}`);
            }
            this.setSelection([...newSelection]);
          }
          break;

        case "Escape":
          keyEvent.preventDefault();
          if (this.selection.selectedIds.size > 0) {
            this.setSelection([]);
            this.announce("Selection cleared");
          }
          break;

        case "a":
          // Ctrl/Cmd+A: Select all
          if (keyEvent.ctrlKey || keyEvent.metaKey) {
            keyEvent.preventDefault();
            const allNodeIds = Array.from(this.nodeElements.keys());
            this.setSelection(allNodeIds);
            this.announce(`Selected all ${allNodeIds.length} items`);
          }
          break;

        case "ArrowUp":
        case "ArrowDown":
        case "ArrowLeft":
        case "ArrowRight":
          // Arrow key navigation (future: move between nodes spatially)
          keyEvent.preventDefault();
          this.handleArrowNavigation(keyEvent.key, focusedNodeId);
          break;
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    this.eventListeners.set("keydown", handleKeyDown);
  }

  /**
   * Handle arrow key navigation between nodes
   */
  private handleArrowNavigation(
    key: string,
    currentNodeId: string | null | undefined
  ): void {
    if (!currentNodeId) {
      // Focus first node
      const firstNode = this.nodeElements.values().next().value;
      if (firstNode) {
        firstNode.focus();
        const label = firstNode.getAttribute("aria-label") || "item";
        this.announce(`Focused ${label}`);
      }
      return;
    }

    // Get all focusable nodes in order
    const nodes = Array.from(this.nodeElements.entries());
    const currentIndex = nodes.findIndex(([id]) => id === currentNodeId);

    if (currentIndex === -1) {return;}

    let nextIndex = currentIndex;
    switch (key) {
      case "ArrowUp":
      case "ArrowLeft":
        nextIndex = currentIndex > 0 ? currentIndex - 1 : nodes.length - 1;
        break;
      case "ArrowDown":
      case "ArrowRight":
        nextIndex = currentIndex < nodes.length - 1 ? currentIndex + 1 : 0;
        break;
    }

    const [nextNodeId, nextElement] = nodes[nextIndex];
    nextElement.focus();
    this.focusedNodeId = nextNodeId;
    const label = nextElement.getAttribute("aria-label") || "item";
    this.announce(`Focused ${label}`);
  }

  /**
   * Update selection overlay and styling
   */
  private updateSelectionOverlay(): void {
    if (!this.container) {return;}

    // Remove existing selection elements
    const existingOutlines = this.container.querySelectorAll(
      `.${this.options.classPrefix}${RENDERER_CLASSES.SELECTION_OUTLINE}`
    );
    existingOutlines.forEach((el) => el.remove());

    // Update selected node styling
    for (const [nodeId, element] of this.nodeElements) {
      const isSelected = this.selection.selectedIds.has(nodeId);
      element.classList.toggle(
        `${this.options.classPrefix}${RENDERER_CLASSES.SELECTED}`,
        isSelected
      );

      if (isSelected) {
        this.addSelectionOutline(element);
      }
    }
  }

  /**
   * Add selection outline to element
   */
  private addSelectionOutline(element: HTMLElement): void {
    const outline = document.createElement("div");
    outline.className = `${this.options.classPrefix}${RENDERER_CLASSES.SELECTION_OUTLINE}`;

    // Position outline around element
    const rect = element.getBoundingClientRect();
    const containerRect = this.container!.getBoundingClientRect();

    outline.style.position = "absolute";
    outline.style.left = `${rect.left - containerRect.left - 2}px`;
    outline.style.top = `${rect.top - containerRect.top - 2}px`;
    outline.style.width = `${rect.width + 4}px`;
    outline.style.height = `${rect.height + 4}px`;
    outline.style.border = "2px solid #007acc";
    outline.style.pointerEvents = "none";
    outline.style.zIndex = "9999";

    this.container!.appendChild(outline);
  }
}

/**
 * Create a new canvas renderer
 */
export function createCanvasRenderer(
  options?: RendererOptions
): CanvasRenderer {
  return new CanvasDOMRenderer(options);
}
