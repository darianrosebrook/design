/**
 * @fileoverview Types for visual debugging tools
 * @author @darianrosebrook
 */

import type {
  CanvasDocumentType,
  NodeType as _NodeType,
} from "@paths-design/canvas-schema";

/**
 * Debug overlay mode
 */
export type DebugOverlayMode =
  | "bounds"
  | "hit-areas"
  | "coordinates"
  | "performance"
  | "layout"
  | "selection"
  | "hierarchy";

/**
 * Debug overlay configuration
 */
export interface DebugOverlayConfig {
  /** Which debug modes to enable */
  enabledModes: DebugOverlayMode[];
  /** Whether the overlay is visible */
  visible: boolean;
  /** Z-index for the overlay */
  zIndex: number;
  /** Opacity of the overlay */
  opacity: number;
  /** Colors for different debug elements */
  colors: {
    bounds: string;
    hitAreas: string;
    coordinates: string;
    performance: string;
    layout: string;
    selection: string;
    hierarchy: string;
  };
  /** Font size for text labels */
  fontSize: number;
  /** Whether to show detailed information */
  showDetails: boolean;
}

/**
 * Bounds information for a node
 */
export interface NodeBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  absoluteX: number;
  absoluteY: number;
}

/**
 * Performance metrics for rendering
 */
export interface PerformanceMetrics {
  renderTime: number;
  hitTestTime: number;
  updateTime: number;
  frameRate: number;
  memoryUsage: number;
}

/**
 * Debug information for a canvas node
 */
export interface NodeDebugInfo {
  nodeId: string;
  type: string;
  bounds: NodeBounds;
  visible: boolean;
  selectable: boolean;
  hasChildren: boolean;
  depth: number;
  performance?: {
    renderTime: number;
    updateTime: number;
  };
}

/**
 * Debug overlay event types
 */
export type DebugOverlayEvent =
  | { type: "mode-changed"; mode: DebugOverlayMode; enabled: boolean }
  | { type: "visibility-changed"; visible: boolean }
  | { type: "config-updated"; config: Partial<DebugOverlayConfig> }
  | { type: "node-hovered"; nodeId: string | null }
  | { type: "performance-updated"; metrics: PerformanceMetrics };

/**
 * Debug overlay renderer interface
 */
export interface DebugOverlayRenderer {
  /** Render the debug overlay */
  render(document: CanvasDocumentType, container: HTMLElement): void;
  /** Update overlay configuration */
  updateConfig(config: Partial<DebugOverlayConfig>): void;
  /** Enable/disable debug mode */
  setModeEnabled(mode: DebugOverlayMode, enabled: boolean): void;
  /** Show/hide overlay */
  setVisible(visible: boolean): void;
  /** Get current configuration */
  getConfig(): DebugOverlayConfig;
  /** Clean up resources */
  destroy(): void;
}

/**
 * Debug data collector interface
 */
export interface DebugDataCollector {
  /** Collect debug information for a document */
  collect(document: CanvasDocumentType): Map<string, NodeDebugInfo>;
  /** Update performance metrics */
  updateMetrics(metrics: Partial<PerformanceMetrics>): void;
  /** Get current performance metrics */
  getMetrics(): PerformanceMetrics;
  /** Clear collected data */
  clear(): void;
}
