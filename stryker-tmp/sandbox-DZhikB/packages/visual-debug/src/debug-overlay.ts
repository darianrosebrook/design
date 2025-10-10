/**
 * @fileoverview Debug overlay renderer for canvas debugging
 * @author @darianrosebrook
 */

import { EventEmitter } from "node:events";
import type {
  CanvasDocumentType,
  NodeType as _NodeType,
} from "@paths-design/canvas-schema";
import type {
  DebugOverlayConfig,
  DebugOverlayMode,
  DebugOverlayRenderer,
  NodeDebugInfo,
  PerformanceMetrics,
  DebugDataCollector,
} from "./types.js";

/**
 * Default debug overlay configuration
 */
const DEFAULT_CONFIG: DebugOverlayConfig = {
  enabledModes: [],
  visible: false,
  zIndex: 9999,
  opacity: 0.8,
  colors: {
    bounds: "rgba(255, 0, 0, 0.5)",
    hitAreas: "rgba(0, 255, 0, 0.3)",
    coordinates: "rgba(0, 0, 255, 0.8)",
    performance: "rgba(255, 255, 0, 0.7)",
    layout: "rgba(255, 0, 255, 0.6)",
    selection: "rgba(0, 255, 255, 0.7)",
    hierarchy: "rgba(128, 128, 128, 0.5)",
  },
  fontSize: 12,
  showDetails: false,
};

/**
 * Canvas debug overlay renderer
 */
export class CanvasDebugOverlay
  extends EventEmitter
  implements DebugOverlayRenderer
{
  private config: DebugOverlayConfig;
  private overlayElement: HTMLDivElement | null = null;
  private canvasElement: HTMLElement | null = null;
  private dataCollector: DebugDataCollector;
  private isDestroyed = false;

  constructor(
    config: Partial<DebugOverlayConfig> = {},
    dataCollector?: DebugDataCollector
  ) {
    super();

    this.config = { ...DEFAULT_CONFIG, ...config };
    this.dataCollector = dataCollector || new DebugDataCollectorImpl();

    this.setupEventListeners();
  }

  /**
   * Render the debug overlay
   */
  render(document: CanvasDocumentType, container: HTMLElement): void {
    if (this.isDestroyed) {
      return;
    }

    // Update canvas reference
    this.canvasElement = container;

    // Create overlay element if it doesn't exist and should be visible
    if (
      !this.overlayElement &&
      this.config.visible &&
      this.config.enabledModes.length > 0
    ) {
      this.overlayElement = this.createOverlayElement();
      container.appendChild(this.overlayElement);
    }

    // Update overlay positioning if it exists
    if (this.overlayElement) {
      this.updateOverlayPosition(container);

      // Render debug information
      if (this.config.visible && this.config.enabledModes.length > 0) {
        this.renderDebugInfo(document);
      } else {
        this.clearOverlay();
      }
    }
  }

  /**
   * Update overlay configuration
   */
  updateConfig(config: Partial<DebugOverlayConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit("config-updated", { config });

    // Re-render if visible
    if (this.overlayElement && this.canvasElement) {
      this.render({} as CanvasDocumentType, this.canvasElement);
    }
  }

  /**
   * Enable/disable debug mode
   */
  setModeEnabled(mode: DebugOverlayMode, enabled: boolean): void {
    const modes = new Set(this.config.enabledModes);

    if (enabled) {
      modes.add(mode);
    } else {
      modes.delete(mode);
    }

    this.updateConfig({ enabledModes: Array.from(modes) });
    this.emit("mode-changed", { mode, enabled });

    // Handle overlay visibility based on new mode state
    this.updateOverlayVisibility();
  }

  /**
   * Show/hide overlay
   */
  setVisible(visible: boolean): void {
    this.updateConfig({ visible });
    this.emit("visibility-changed", { visible });

    this.updateOverlayVisibility();
  }

  /**
   * Update overlay element visibility based on config
   */
  private updateOverlayVisibility(): void {
    if (!this.overlayElement) {
      return;
    }

    const shouldBeVisible =
      this.config.visible && this.config.enabledModes.length > 0;
    this.overlayElement.style.display = shouldBeVisible ? "block" : "none";
  }

  /**
   * Get current configuration
   */
  getConfig(): DebugOverlayConfig {
    return { ...this.config };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    this.isDestroyed = true;
    this.removeEventListeners();

    if (this.overlayElement && this.overlayElement.parentNode) {
      this.overlayElement.parentNode.removeChild(this.overlayElement);
    }

    this.overlayElement = null;
    this.canvasElement = null;
  }

  /**
   * Create the overlay DOM element
   */
  private createOverlayElement(): HTMLDivElement {
    const overlay = document.createElement("div");
    overlay.style.position = "absolute";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.pointerEvents = "none";
    overlay.style.zIndex = this.config.zIndex.toString();
    overlay.style.opacity = this.config.opacity.toString();
    overlay.style.display = this.config.visible ? "block" : "none";
    overlay.setAttribute("data-debug-overlay", "true");

    return overlay;
  }

  /**
   * Update overlay position to match canvas
   */
  private updateOverlayPosition(container: HTMLElement): void {
    if (!this.overlayElement) {
      return;
    }

    const rect = container.getBoundingClientRect();
    this.overlayElement.style.top = `${rect.top}px`;
    this.overlayElement.style.left = `${rect.left}px`;
    this.overlayElement.style.width = `${rect.width}px`;
    this.overlayElement.style.height = `${rect.height}px`;
  }

  /**
   * Render debug information
   */
  private renderDebugInfo(document: CanvasDocumentType): void {
    if (!this.overlayElement) {
      return;
    }

    this.clearOverlay();

    // Collect debug data
    const debugData = this.dataCollector.collect(document);

    // Render each enabled mode
    for (const mode of this.config.enabledModes) {
      this.renderMode(mode, debugData);
    }
  }

  /**
   * Render a specific debug mode
   */
  private renderMode(
    mode: DebugOverlayMode,
    debugData: Map<string, NodeDebugInfo>
  ): void {
    switch (mode) {
      case "bounds":
        this.renderBoundsOverlay(debugData);
        break;
      case "hit-areas":
        this.renderHitAreasOverlay(debugData);
        break;
      case "coordinates":
        this.renderCoordinatesOverlay(debugData);
        break;
      case "performance":
        this.renderPerformanceOverlay();
        break;
      case "layout":
        this.renderLayoutOverlay(debugData);
        break;
      case "selection":
        this.renderSelectionOverlay(debugData);
        break;
      case "hierarchy":
        this.renderHierarchyOverlay(debugData);
        break;
    }
  }

  /**
   * Render bounds overlay
   */
  private renderBoundsOverlay(debugData: Map<string, NodeDebugInfo>): void {
    for (const info of debugData.values()) {
      if (!info.visible) {
        continue;
      }

      const div = document.createElement("div");
      div.style.position = "absolute";
      div.style.left = `${info.bounds.absoluteX}px`;
      div.style.top = `${info.bounds.absoluteY}px`;
      div.style.width = `${info.bounds.width}px`;
      div.style.height = `${info.bounds.height}px`;
      div.style.border = `2px solid ${this.config.colors.bounds}`;
      div.style.backgroundColor = "transparent";
      div.style.boxSizing = "border-box";

      if (this.config.showDetails) {
        div.title = `Node: ${info.nodeId}\nType: ${info.type}\nBounds: ${info.bounds.width}x${info.bounds.height}`;
      }

      this.overlayElement!.appendChild(div);
    }
  }

  /**
   * Render hit areas overlay
   */
  private renderHitAreasOverlay(debugData: Map<string, NodeDebugInfo>): void {
    for (const info of debugData.values()) {
      if (!info.visible || !info.selectable) {
        continue;
      }

      const div = document.createElement("div");
      div.style.position = "absolute";
      div.style.left = `${info.bounds.absoluteX}px`;
      div.style.top = `${info.bounds.absoluteY}px`;
      div.style.width = `${info.bounds.width}px`;
      div.style.height = `${info.bounds.height}px`;
      div.style.backgroundColor = this.config.colors.hitAreas;
      div.style.border = `1px dashed ${this.config.colors.hitAreas.replace(
        "0.3",
        "0.8"
      )}`;

      this.overlayElement!.appendChild(div);
    }
  }

  /**
   * Render coordinates overlay
   */
  private renderCoordinatesOverlay(
    debugData: Map<string, NodeDebugInfo>
  ): void {
    for (const info of debugData.values()) {
      if (!info.visible) {
        continue;
      }

      const label = document.createElement("div");
      label.style.position = "absolute";
      label.style.left = `${info.bounds.absoluteX}px`;
      label.style.top = `${info.bounds.absoluteY - 20}px`;
      label.style.color = this.config.colors.coordinates;
      label.style.fontSize = `${this.config.fontSize}px`;
      label.style.fontFamily = "monospace";
      label.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
      label.style.padding = "2px 4px";
      label.style.borderRadius = "2px";
      label.style.whiteSpace = "nowrap";
      label.textContent = `(${Math.round(info.bounds.x)}, ${Math.round(
        info.bounds.y
      )})`;

      this.overlayElement!.appendChild(label);
    }
  }

  /**
   * Render performance overlay
   */
  private renderPerformanceOverlay(): void {
    const metrics = this.dataCollector.getMetrics();

    const panel = document.createElement("div");
    panel.style.position = "absolute";
    panel.style.top = "10px";
    panel.style.right = "10px";
    panel.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    panel.style.color = "white";
    panel.style.fontSize = `${this.config.fontSize}px`;
    panel.style.fontFamily = "monospace";
    panel.style.padding = "8px";
    panel.style.borderRadius = "4px";
    panel.style.border = `1px solid ${this.config.colors.performance}`;

    panel.innerHTML = `
      <div>FPS: ${Math.round(metrics.frameRate)}</div>
      <div>Render: ${metrics.renderTime.toFixed(1)}ms</div>
      <div>Hit Test: ${metrics.hitTestTime.toFixed(1)}ms</div>
      <div>Memory: ${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB</div>
    `;

    this.overlayElement!.appendChild(panel);
  }

  /**
   * Render layout overlay
   */
  private renderLayoutOverlay(debugData: Map<string, NodeDebugInfo>): void {
    for (const info of debugData.values()) {
      if (!info.visible) {
        continue;
      }

      const div = document.createElement("div");
      div.style.position = "absolute";
      div.style.left = `${info.bounds.absoluteX}px`;
      div.style.top = `${info.bounds.absoluteY}px`;
      div.style.width = `${info.bounds.width}px`;
      div.style.height = `${info.bounds.height}px`;
      div.style.border = `1px solid ${this.config.colors.layout}`;
      div.style.backgroundColor = "transparent";

      // Add layout guides
      const guides = document.createElement("div");
      guides.style.position = "absolute";
      guides.style.left = "50%";
      guides.style.top = "50%";
      guides.style.width = "2px";
      guides.style.height = "2px";
      guides.style.backgroundColor = this.config.colors.layout;
      guides.style.transform = "translate(-50%, -50%)";

      div.appendChild(guides);
      this.overlayElement!.appendChild(div);
    }
  }

  /**
   * Render selection overlay
   */
  private renderSelectionOverlay(debugData: Map<string, NodeDebugInfo>): void {
    // This would be enhanced with actual selection state
    // For now, just show selectable areas
    this.renderHitAreasOverlay(debugData);
  }

  /**
   * Render hierarchy overlay
   */
  private renderHierarchyOverlay(debugData: Map<string, NodeDebugInfo>): void {
    const depthColors = [
      "#ff0000",
      "#00ff00",
      "#0000ff",
      "#ffff00",
      "#ff00ff",
      "#00ffff",
    ];

    for (const info of debugData.values()) {
      if (!info.visible) {
        continue;
      }

      const depth = Math.min(info.depth, depthColors.length - 1);
      const color = depthColors[depth];

      const div = document.createElement("div");
      div.style.position = "absolute";
      div.style.left = `${info.bounds.absoluteX}px`;
      div.style.top = `${info.bounds.absoluteY}px`;
      div.style.width = `${info.bounds.width}px`;
      div.style.height = `${info.bounds.height}px`;
      div.style.border = `3px solid ${color}`;
      div.style.backgroundColor = `${color}20`;
      div.style.boxSizing = "border-box";

      this.overlayElement!.appendChild(div);
    }
  }

  /**
   * Clear overlay content
   */
  private clearOverlay(): void {
    if (!this.overlayElement) {
      return;
    }

    while (this.overlayElement.firstChild) {
      this.overlayElement.removeChild(this.overlayElement.firstChild);
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen for window resize to reposition overlay
    window.addEventListener("resize", this.handleResize);
  }

  /**
   * Remove event listeners
   */
  private removeEventListeners(): void {
    window.removeEventListener("resize", this.handleResize);
  }

  /**
   * Handle window resize
   */
  private handleResize = (): void => {
    if (this.canvasElement && this.overlayElement) {
      this.updateOverlayPosition(this.canvasElement);
    }
  };
}

/**
 * Debug data collector implementation
 */
class DebugDataCollectorImpl implements DebugDataCollector {
  private nodeDebugInfo = new Map<string, NodeDebugInfo>();
  private performanceMetrics: PerformanceMetrics = {
    renderTime: 0,
    hitTestTime: 0,
    updateTime: 0,
    frameRate: 60,
    memoryUsage: 0,
  };

  collect(_document: CanvasDocumentType): Map<string, NodeDebugInfo> {
    // This would traverse the document and collect debug info
    // For now, return empty map
    return this.nodeDebugInfo;
  }

  updateMetrics(metrics: Partial<PerformanceMetrics>): void {
    this.performanceMetrics = { ...this.performanceMetrics, ...metrics };
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  clear(): void {
    this.nodeDebugInfo.clear();
  }
}
