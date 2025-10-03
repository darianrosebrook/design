/**
 * @fileoverview Selection coordinator for VS Code extension
 * @author @darianrosebrook
 *
 * Coordinates selection state across multiple webviews and provides
 * selection mode management for the VS Code extension.
 */

import type { SelectionState } from "@paths-design/properties-panel";
import type * as vscode from "vscode";
import { createHash } from "crypto";

/**
 * Selection mode types
 */
export type SelectionMode = "rectangle" | "lasso" | "single";

/**
 * Selection mode configuration
 */
export interface SelectionModeConfig {
  mode: SelectionMode;
  multiSelect: boolean;
  preserveSelection: boolean;
}

/**
 * Selection operation result
 */
export interface SelectionResult {
  selectedNodeIds: string[];
  accuracy: number;
  duration: number;
}

/**
 * Selection change event callback
 */
export type SelectionChangeListener = (
  selection: SelectionState,
  mode: SelectionMode
) => void;

/**
 * Selection coordinator for managing selection state across webviews
 *
 * ⚠️ **Design Note**: This class manages state for multiple webviews but
 * lacks proper event emitter pattern. Consider refactoring to EventEmitter
 * for better decoupling and testing.
 */
export class SelectionCoordinator {
  private static instance: SelectionCoordinator;
  private webviewPanels = new Set<vscode.WebviewPanel>();
  private currentSelection: SelectionState = {
    selectedNodeIds: [],
    focusedNodeId: null,
  };
  private currentMode: SelectionMode = "single";
  private modeConfig: SelectionModeConfig = {
    mode: "single",
    multiSelect: false,
    preserveSelection: false,
  };
  private selectionHistory: SelectionState[] = [];
  private maxHistorySize = 50;
  private listeners = new Set<
    (selection: SelectionState, mode: SelectionMode) => void
  >();

  // Race condition protection - serialize selection updates
  private updateQueue: Promise<void> = Promise.resolve();

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Subscribe to selection changes
   *
   * @param listener Callback invoked when selection changes
   * @returns Disposable to unsubscribe
   *
   * ⚠️ **Memory Leak Risk**: Caller MUST dispose to avoid memory leaks
   */
  onSelectionChange(listener: SelectionChangeListener): {
    dispose: () => void;
  } {
    this.listeners.add(listener);

    return {
      dispose: () => {
        this.listeners.delete(listener);
      },
    };
  }

  /**
   * Notify all listeners of selection change
   * @internal
   */
  private notifySelectionChange(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.currentSelection, this.currentMode);
      } catch (error) {
        console.error("Selection change listener error:", error);
      }
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(): SelectionCoordinator {
    if (!SelectionCoordinator.instance) {
      SelectionCoordinator.instance = new SelectionCoordinator();
    }
    return SelectionCoordinator.instance;
  }

  /**
   * Register a webview panel for selection coordination
   */
  registerWebviewPanel(panel: vscode.WebviewPanel): void {
    this.webviewPanels.add(panel);

    // Send current selection state to new panel
    this.broadcastToPanel(panel, {
      command: "setSelection",
      selection: this.currentSelection,
    });

    // Send current selection mode
    this.broadcastToPanel(panel, {
      command: "setSelectionMode",
      mode: this.currentMode,
      config: this.modeConfig,
    });

    // Listen for panel disposal
    panel.onDidDispose(() => {
      this.webviewPanels.delete(panel);
    });

    console.info(
      `Selection coordinator: registered webview panel (${this.webviewPanels.size} total)`
    );
  }

  /**
   * Update selection state and broadcast to all webviews
   * Uses promise queue to prevent race conditions
   */
  async updateSelection(
    selection: SelectionState,
    sourcePanel?: vscode.WebviewPanel
  ): Promise<void> {
    // Serialize all updates through a promise chain
    this.updateQueue = this.updateQueue
      .then(() => this._updateSelectionInternal(selection, sourcePanel))
      .catch((error) => {
        console.error("SelectionCoordinator: Update failed", error);
        // Don't re-throw to prevent breaking the queue
      });

    return this.updateQueue;
  }

  /**
   * Internal selection update implementation
   * @private
   */
  private async _updateSelectionInternal(
    selection: SelectionState,
    sourcePanel?: vscode.WebviewPanel
  ): Promise<void> {
    // Add to history for undo functionality
    this.addToHistory(this.currentSelection);

    // Update current selection
    this.currentSelection = { ...selection };

    // Update focused node if there's a selection
    if (selection.selectedNodeIds.length > 0) {
      this.currentSelection.focusedNodeId = selection.selectedNodeIds[0];
    } else {
      this.currentSelection.focusedNodeId = null;
    }

    console.info("Selection updated:", {
      selectedCount: this.currentSelection.selectedNodeIds.length,
      focusedNodeId: this.currentSelection.focusedNodeId,
      sourcePanel: sourcePanel ? "webview" : "extension",
    });

    // Notify listeners and broadcast
    this.emitSelectionChange();

    // Broadcast to all webviews except the source (to avoid loops)
    await this.broadcast(
      {
        command: "setSelection",
        selection: this.currentSelection,
      },
      sourcePanel
    );
  }

  /**
   * Set selection mode and broadcast to all webviews
   * Uses promise queue to prevent race conditions
   */
  async setSelectionMode(
    mode: SelectionMode,
    config?: Partial<SelectionModeConfig>,
    sourcePanel?: vscode.WebviewPanel
  ): Promise<void> {
    // Serialize mode changes through the same queue
    this.updateQueue = this.updateQueue
      .then(() => this._setSelectionModeInternal(mode, config, sourcePanel))
      .catch((error) => {
        console.error("SelectionCoordinator: Mode change failed", error);
      });

    return this.updateQueue;
  }

  /**
   * Internal mode change implementation
   * @private
   */
  private async _setSelectionModeInternal(
    mode: SelectionMode,
    config?: Partial<SelectionModeConfig>,
    sourcePanel?: vscode.WebviewPanel
  ): Promise<void> {
    this.currentMode = mode;
    this.modeConfig = {
      ...this.modeConfig,
      ...config,
      mode,
    };

    console.info("Selection mode changed:", {
      mode: this.currentMode,
      config: this.modeConfig,
    });

    this.emitSelectionChange();

    // Broadcast to all webviews
    await this.broadcast(
      {
        command: "setSelectionMode",
        mode: this.currentMode,
        config: this.modeConfig,
      },
      sourcePanel
    );
  }

  /**
   * Handle selection operation result from renderer
   */
  async handleSelectionOperation(
    result: SelectionResult,
    mode: SelectionMode,
    sourcePanel?: vscode.WebviewPanel
  ): Promise<void> {
    console.info("Selection operation completed:", {
      mode,
      selectedCount: result.selectedNodeIds.length,
      accuracy: result.accuracy,
      duration: result.duration,
    });

    // Update selection based on mode configuration
    if (
      this.modeConfig.preserveSelection &&
      this.currentSelection.selectedNodeIds.length > 0
    ) {
      // Merge with existing selection
      const mergedSelection = new Set([
        ...this.currentSelection.selectedNodeIds,
        ...result.selectedNodeIds,
      ]);

      await this.updateSelection(
        {
          selectedNodeIds: Array.from(mergedSelection),
          focusedNodeId: result.selectedNodeIds[0] || null,
        },
        sourcePanel
      );
    } else {
      // Replace selection
      await this.updateSelection(
        {
          selectedNodeIds: result.selectedNodeIds,
          focusedNodeId: result.selectedNodeIds[0] || null,
        },
        sourcePanel
      );
    }
  }

  /**
   * Clear current selection
   */
  async clearSelection(sourcePanel?: vscode.WebviewPanel): Promise<void> {
    await this.updateSelection(
      {
        selectedNodeIds: [],
        focusedNodeId: null,
      },
      sourcePanel
    );
  }

  /**
   * Toggle selection mode
   */
  async toggleSelectionMode(sourcePanel?: vscode.WebviewPanel): Promise<void> {
    const modes: SelectionMode[] = ["single", "rectangle", "lasso"];
    const currentIndex = modes.indexOf(this.currentMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    const nextMode = modes[nextIndex];

    await this.setSelectionMode(nextMode, undefined, sourcePanel);
  }

  /**
   * Get current selection state
   */
  getCurrentSelection(): SelectionState {
    return { ...this.currentSelection };
  }

  /**
   * Get current selection mode
   */
  getCurrentMode(): SelectionMode {
    return this.currentMode;
  }

  /**
   * Get current mode configuration
   */
  getModeConfig(): SelectionModeConfig {
    return { ...this.modeConfig };
  }

  /**
   * Check if multi-select is active
   */
  isMultiSelectActive(): boolean {
    return (
      this.modeConfig.multiSelect ||
      this.currentSelection.selectedNodeIds.length > 1
    );
  }

  /**
   * Undo last selection change
   */
  async undoSelection(): Promise<boolean> {
    if (this.selectionHistory.length === 0) {
      return false;
    }

    const previousSelection = this.selectionHistory.pop()!;
    await this.updateSelection(previousSelection);
    return true;
  }

  /**
   * Get selection statistics
   */
  getSelectionStats(): {
    totalWebviews: number;
    historySize: number;
    currentMode: SelectionMode;
    selectedCount: number;
  } {
    return {
      totalWebviews: this.webviewPanels.size,
      historySize: this.selectionHistory.length,
      currentMode: this.currentMode,
      selectedCount: this.currentSelection.selectedNodeIds.length,
    };
  }

  onSelectionChange(
    listener: (selection: SelectionState, mode: SelectionMode) => void
  ): { dispose: () => void } {
    this.listeners.add(listener);

    return {
      dispose: () => {
        this.listeners.delete(listener);
      },
    };
  }

  private emitSelectionChange(): void {
    for (const listener of this.listeners) {
      try {
        listener({ ...this.currentSelection }, this.currentMode);
      } catch (error) {
        console.error("Selection change listener failed", error);
      }
    }
  }

  /**
   * Broadcast message to all registered webviews
   */
  private async broadcast(
    message: any,
    excludePanel?: vscode.WebviewPanel
  ): Promise<void> {
    const promises: Promise<boolean>[] = [];

    for (const panel of this.webviewPanels) {
      if (panel === excludePanel) {
        continue;
      }

      if (panel.webview) {
        // Convert Thenable to Promise
        promises.push(Promise.resolve(panel.webview.postMessage(message)));
      }
    }

    // Wait for all messages to be sent (with timeout)
    const results = await Promise.allSettled(
      promises.map((promise, index) =>
        promise.catch((error) => {
          console.error(`Failed to send message to webview ${index}:`, error);
          return false;
        })
      )
    );

    const successCount = results.filter(
      (result) => result.status === "fulfilled" && result.value === true
    ).length;

    if (successCount !== this.webviewPanels.size - (excludePanel ? 1 : 0)) {
      console.warn(
        "Selection coordinator: not all webviews received broadcast",
        {
          expected: this.webviewPanels.size - (excludePanel ? 1 : 0),
          actual: successCount,
        }
      );
    }
  }

  /**
   * Broadcast message to specific panel
   */
  private async broadcastToPanel(
    panel: vscode.WebviewPanel,
    message: any
  ): Promise<boolean> {
    try {
      if (panel.webview) {
        return await Promise.resolve(panel.webview.postMessage(message));
      }
      return false;
    } catch (error) {
      console.error("Failed to send message to panel:", error);
      return false;
    }
  }

  /**
   * Add selection state to history for undo functionality
   */
  private addToHistory(selection: SelectionState): void {
    // Don't add if it's the same as the last entry
    if (
      this.selectionHistory.length > 0 &&
      JSON.stringify(
        this.selectionHistory[this.selectionHistory.length - 1]
      ) === JSON.stringify(selection)
    ) {
      return;
    }

    this.selectionHistory.push({ ...selection });

    // Trim history if it gets too large
    if (this.selectionHistory.length > this.maxHistorySize) {
      this.selectionHistory.shift();
    }
  }

  /**
   * Cleanup and reset coordinator state
   */
  dispose(): void {
    this.webviewPanels.clear();
    this.selectionHistory = [];
    this.currentSelection = {
      selectedNodeIds: [],
      focusedNodeId: null,
    };

    console.info("Selection coordinator disposed");
  }
}
