/**
 * @fileoverview Public API for selection state inspection
 * @author @darianrosebrook
 *
 * Exposes selection state to developer tools, debugging, and external extensions.
 */

import type { SelectionState } from "@paths-design/properties-panel";
import type { SelectionMode } from "../canvas-webview/selection-coordinator";
import { SelectionCoordinator } from "../canvas-webview/selection-coordinator";
import type { NodeIndexEntry } from "../document-store";
import { DocumentStore } from "../document-store";
import { calculateCombinedBounds } from "../document-store-utils";

/**
 * Detailed selection information including metadata
 */
export interface SelectionInfo {
  /** Current selection state */
  selection: SelectionState;
  /** Active selection mode */
  mode: SelectionMode;
  /** Selection statistics */
  stats: {
    totalWebviews: number;
    historySize: number;
    selectedCount: number;
  };
  /** Timestamp of last selection change */
  lastChanged: number;
}

/**
 * Selection history entry
 */
export interface SelectionHistoryEntry {
  selection: SelectionState;
  timestamp: number;
  mode: SelectionMode;
}

/**
 * Public API for querying and observing selection state
 *
 * This API is designed for:
 * - Developer tools and debugging
 * - External VS Code extensions
 * - MCP agents and automation tools
 * - Testing and diagnostics
 */
export class SelectionAPI {
  private static instance: SelectionAPI;
  private coordinator: SelectionCoordinator;
  private documentStore: DocumentStore;
  private selectionHistory: SelectionHistoryEntry[] = [];
  private maxHistorySize = 100;
  private listeners = new Set<(info: SelectionInfo) => void>();
  private isInitialized = false;

  private constructor() {
    this.coordinator = SelectionCoordinator.getInstance();
    this.documentStore = DocumentStore.getInstance();
  }

  /**
   * Initialize the API and connect to coordinator events
   *
   * ⚠️ CRITICAL: Must be called during extension activation
   * to properly wire up selection change notifications
   *
   * @returns Disposable to cleanup on deactivation
   */
  initialize(): { dispose: () => void } {
    if (this.isInitialized) {
      console.warn("SelectionAPI already initialized");
      return { dispose: () => {} };
    }

    // Connect to SelectionCoordinator events
    const subscription = this.coordinator.onSelectionChange(
      (selection, mode) => {
        const info: SelectionInfo = {
          selection,
          mode,
          stats: this.coordinator.getSelectionStats(),
          lastChanged: Date.now(),
        };

        // Notify listeners and update history
        this.notifySelectionChange(info);
      }
    );

    this.isInitialized = true;

    return {
      dispose: () => {
        subscription.dispose();
        this.dispose();
      },
    };
  }

  /**
   * Get singleton instance
   */
  static getInstance(): SelectionAPI {
    if (!SelectionAPI.instance) {
      SelectionAPI.instance = new SelectionAPI();
    }
    return SelectionAPI.instance;
  }

  /**
   * Get current selection information
   *
   * @example
   * ```typescript
   * const api = SelectionAPI.getInstance();
   * const info = api.getSelectionInfo();
   * console.log(`Selected: ${info.selection.selectedNodeIds.join(', ')}`);
   * console.log(`Mode: ${info.mode}`);
   * ```
   */
  getSelectionInfo(): SelectionInfo | null {
    try {
      const selection = this.coordinator.getCurrentSelection();
      const mode = this.coordinator.getCurrentMode();
      const stats = this.coordinator.getSelectionStats();

      return {
        selection,
        mode,
        stats,
        lastChanged: Date.now(),
      };
    } catch (error) {
      console.error("SelectionAPI: Failed to get selection info", error);
      return null; // Graceful degradation
    }
  }

  /**
   * Get detailed information about selected nodes
   * Includes node metadata from the document store
   *
   * @returns Array of node information with IDs, types, and positions
   *
   * ✅ **Performance**: O(k) where k = selected nodes (using node index cache)
   */
  getSelectedNodesDetails(): Array<{
    id: string;
    type?: string;
    name?: string;
    bounds?: { x: number; y: number; width: number; height: number };
    artboardId?: string;
    parentId?: string | null;
    depth?: number;
  }> {
    try {
      const selection = this.coordinator.getCurrentSelection();
      const document = this.documentStore.getDocument();

      if (!document) {
        console.warn("SelectionAPI: No document loaded - returning IDs only");
        return selection.selectedNodeIds.map((id) => ({ id }));
      }

      // Use node index for O(k) lookups where k = selected nodes
      const nodeInfoMap = this.documentStore.getNodesByIds(
        selection.selectedNodeIds
      );

      return selection.selectedNodeIds.map((id) => {
        const info: NodeIndexEntry | undefined = nodeInfoMap.get(id);
        if (!info) {
          // Node ID exists in selection but not found in document
          // This is a STATE INCONSISTENCY that should be logged
          console.warn(
            `SelectionAPI: Selection contains non-existent node: ${id}`
          );
          return { id };
        }

        return {
          id,
          type: info.node.type,
          name: info.node.name,
          bounds: info.node.frame
            ? {
                x: info.node.frame.x,
                y: info.node.frame.y,
                width: info.node.frame.width,
                height: info.node.frame.height,
              }
            : undefined,
          artboardId: info.artboardId,
          parentId: info.parentId,
          depth: info.depth,
        };
      });
    } catch (error) {
      console.error("SelectionAPI: Failed to get selected node details", error);
      // Fallback: return basic selection IDs
      try {
        const selection = this.coordinator.getCurrentSelection();
        return selection.selectedNodeIds.map((id) => ({ id }));
      } catch (fallbackError) {
        console.error("SelectionAPI: Fallback also failed", fallbackError);
        return [];
      }
    }
  }

  /**
   * Get combined bounding box of all selected nodes
   * Useful for bulk operations like group/frame creation
   */
  getSelectionBounds(): {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null {
    try {
      const details = this.getSelectedNodesDetails();
      const nodes = details
        .filter((d) => d.bounds)
        .map((d) => ({
          id: d.id,
          type: d.type || "unknown",
          name: d.name || "",
          frame: d.bounds!,
        }));

      return calculateCombinedBounds(nodes as any);
    } catch (error) {
      console.error("SelectionAPI: Failed to get selection bounds", error);
      return null;
    }
  }

  /**
   * Get selection history
   * Useful for debugging selection state changes
   *
   * @param limit Maximum number of entries to return (default: 10)
   */
  getSelectionHistory(limit = 10): SelectionHistoryEntry[] {
    return this.selectionHistory.slice(-limit);
  }

  /**
   * Subscribe to selection changes
   * Listeners are called whenever selection state changes
   *
   * @param listener Callback function receiving selection info
   * @returns Disposable to unsubscribe
   *
   * @example
   * ```typescript
   * const api = SelectionAPI.getInstance();
   * const disposable = api.onSelectionChange((info) => {
   *   console.log('Selection changed:', info.selection.selectedNodeIds);
   * });
   *
   * // Later: disposable.dispose();
   * ```
   */
  onSelectionChange(listener: (info: SelectionInfo) => void): {
    dispose: () => void;
  } {
    if (typeof listener !== "function") {
      console.error("SelectionAPI: Invalid listener - must be a function");
      return { dispose: () => {} };
    }

    this.listeners.add(listener);

    return {
      dispose: () => {
        this.listeners.delete(listener);
      },
    };
  }

  /**
   * Notify all listeners of selection change
   * Called internally when selection updates
   */
  notifySelectionChange(info: SelectionInfo): void {
    try {
      // Add to history
      this.selectionHistory.push({
        selection: info.selection,
        timestamp: info.lastChanged,
        mode: info.mode,
      });

      // Trim history
      if (this.selectionHistory.length > this.maxHistorySize) {
        this.selectionHistory.shift();
      }

      // Notify listeners
      for (const listener of this.listeners) {
        try {
          listener(info);
        } catch (error) {
          console.error("SelectionAPI: Listener failed:", error);
          // Remove failed listeners to prevent future errors
          this.listeners.delete(listener);
        }
      }
    } catch (error) {
      console.error("SelectionAPI: Failed to notify selection change:", error);
    }
  }

  /**
   * Export selection state as JSON
   * Useful for debugging, logging, or external tool integration
   */
  exportSelectionState(): {
    selection: SelectionState;
    mode: SelectionMode;
    stats: ReturnType<SelectionCoordinator["getSelectionStats"]>;
    history: SelectionHistoryEntry[];
    timestamp: number;
  } | null {
    try {
      return {
        selection: this.coordinator.getCurrentSelection(),
        mode: this.coordinator.getCurrentMode(),
        stats: this.coordinator.getSelectionStats(),
        history: [...this.selectionHistory],
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("SelectionAPI: Failed to export selection state:", error);
      return null;
    }
  }

  /**
   * Clear selection history
   * Useful for testing or memory management
   */
  clearHistory(): void {
    this.selectionHistory = [];
  }

  /**
   * Dispose API and cleanup
   */
  dispose(): void {
    this.listeners.clear();
    this.selectionHistory = [];
  }
}

/**
 * Global accessor for selection API (for console debugging)
 * Can be accessed via `global.__designerSelectionAPI` in debug console
 */
if (typeof globalThis !== "undefined") {
  (globalThis as any).__designerSelectionAPI = SelectionAPI.getInstance();
}
