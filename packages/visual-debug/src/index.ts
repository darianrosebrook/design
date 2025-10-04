/**
 * @fileoverview Main entry point for visual debugging tools
 * @author @darianrosebrook
 */

import { CanvasDebugOverlay } from "./debug-overlay.js";
export { CanvasDebugOverlay } from "./debug-overlay.js";
export type {
  DebugOverlayMode,
  DebugOverlayConfig,
  DebugOverlayRenderer,
  NodeBounds,
  PerformanceMetrics,
  NodeDebugInfo,
  DebugOverlayEvent,
  DebugDataCollector,
} from "./types.js";

/**
 * Create a new debug overlay renderer
 */
export function createDebugOverlay(
  config?: Partial<import("./types.js").DebugOverlayConfig>
) {
  return new CanvasDebugOverlay(config);
}
