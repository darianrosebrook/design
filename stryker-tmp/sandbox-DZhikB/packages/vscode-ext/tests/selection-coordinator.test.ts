/**
 * @fileoverview Tests for selection coordinator in VS Code extension
 * @author @darianrosebrook
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { SelectionState } from "@paths-design/properties-panel";
import {
  SelectionCoordinator,
  type SelectionMode,
  type SelectionModeConfig,
  type SelectionResult,
} from "../src/canvas-webview/selection-coordinator.js";

// Mock VS Code API
const createMockWebviewPanel = () => {
  const messageHandlers = new Set<(message: any) => Promise<boolean>>();

  return {
    webview: {
      postMessage: vi.fn().mockImplementation(async (message: any) => {
        for (const handler of messageHandlers) {
          await handler(message);
        }
        return true;
      }),
    },
    onDidDispose: vi.fn((callback: () => void) => {
      return { dispose: () => {} };
    }),
    _addMessageHandler: (handler: (message: any) => Promise<boolean>) => {
      messageHandlers.add(handler);
    },
  };
};

describe("SelectionCoordinator", () => {
  let coordinator: SelectionCoordinator;

  beforeEach(() => {
    // Reset singleton instance for each test
    // @ts-expect-error - accessing private static field for testing
    SelectionCoordinator.instance = undefined;
    coordinator = SelectionCoordinator.getInstance();
  });

  describe("Singleton Pattern", () => {
    it("should return same instance on multiple calls", () => {
      const instance1 = SelectionCoordinator.getInstance();
      const instance2 = SelectionCoordinator.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe("Webview Registration", () => {
    it("should register webview panel successfully", () => {
      const panel = createMockWebviewPanel();

      coordinator.registerWebviewPanel(panel as any);

      const stats = coordinator.getSelectionStats();
      expect(stats.totalWebviews).toBe(1);
    });

    it("should send current selection state to new panel", async () => {
      const panel = createMockWebviewPanel();

      // Set initial selection
      await coordinator.updateSelection({
        selectedNodeIds: ["node-1", "node-2"],
        focusedNodeId: "node-1",
      });

      coordinator.registerWebviewPanel(panel as any);

      // Should have called postMessage with setSelection
      expect(panel.webview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          command: "setSelection",
          selection: expect.objectContaining({
            selectedNodeIds: ["node-1", "node-2"],
          }),
        })
      );
    });

    it("should send current selection mode to new panel", () => {
      const panel = createMockWebviewPanel();

      coordinator.registerWebviewPanel(panel as any);

      // Should have called postMessage with setSelectionMode
      expect(panel.webview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          command: "setSelectionMode",
          mode: "single",
        })
      );
    });

    it("should clean up on panel disposal", () => {
      const panel = createMockWebviewPanel();
      coordinator.registerWebviewPanel(panel as any);

      const stats1 = coordinator.getSelectionStats();
      expect(stats1.totalWebviews).toBe(1);

      // Trigger disposal callback
      const disposeCallback = panel.onDidDispose.mock.calls[0][0];
      disposeCallback();

      const stats2 = coordinator.getSelectionStats();
      expect(stats2.totalWebviews).toBe(0);
    });
  });

  describe("Selection State Management", () => {
    it("should update selection state", async () => {
      const selection: SelectionState = {
        selectedNodeIds: ["node-1", "node-2"],
        focusedNodeId: "node-1",
      };

      await coordinator.updateSelection(selection);

      const currentSelection = coordinator.getCurrentSelection();
      expect(currentSelection.selectedNodeIds).toEqual(["node-1", "node-2"]);
      expect(currentSelection.focusedNodeId).toBe("node-1");
    });

    it("should broadcast selection to all webviews", async () => {
      const panel1 = createMockWebviewPanel();
      const panel2 = createMockWebviewPanel();

      coordinator.registerWebviewPanel(panel1 as any);
      coordinator.registerWebviewPanel(panel2 as any);

      const selection: SelectionState = {
        selectedNodeIds: ["node-3"],
        focusedNodeId: "node-3",
      };

      await coordinator.updateSelection(selection);

      // Both panels should receive the update
      expect(panel1.webview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          command: "setSelection",
          selection: expect.objectContaining({
            selectedNodeIds: ["node-3"],
          }),
        })
      );

      expect(panel2.webview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          command: "setSelection",
          selection: expect.objectContaining({
            selectedNodeIds: ["node-3"],
          }),
        })
      );
    });

    it("should exclude source panel from broadcast", async () => {
      const panel1 = createMockWebviewPanel();
      const panel2 = createMockWebviewPanel();

      coordinator.registerWebviewPanel(panel1 as any);
      coordinator.registerWebviewPanel(panel2 as any);

      // Clear mock calls from registration
      panel1.webview.postMessage.mockClear();
      panel2.webview.postMessage.mockClear();

      const selection: SelectionState = {
        selectedNodeIds: ["node-4"],
        focusedNodeId: "node-4",
      };

      await coordinator.updateSelection(selection, panel1 as any);

      // panel1 should not receive update (it's the source)
      expect(panel1.webview.postMessage).not.toHaveBeenCalled();

      // panel2 should receive update
      expect(panel2.webview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          command: "setSelection",
        })
      );
    });

    it("should set focusedNodeId to first selected node", async () => {
      const selection: SelectionState = {
        selectedNodeIds: ["node-5", "node-6", "node-7"],
        focusedNodeId: null, // Will be set automatically
      };

      await coordinator.updateSelection(selection);

      const currentSelection = coordinator.getCurrentSelection();
      expect(currentSelection.focusedNodeId).toBe("node-5");
    });

    it("should clear focusedNodeId when selection is empty", async () => {
      // Set initial selection
      await coordinator.updateSelection({
        selectedNodeIds: ["node-1"],
        focusedNodeId: "node-1",
      });

      // Clear selection
      await coordinator.clearSelection();

      const currentSelection = coordinator.getCurrentSelection();
      expect(currentSelection.selectedNodeIds).toHaveLength(0);
      expect(currentSelection.focusedNodeId).toBeNull();
    });
  });

  describe("Selection Mode Management", () => {
    it("should set selection mode", async () => {
      await coordinator.setSelectionMode("rectangle");

      expect(coordinator.getCurrentMode()).toBe("rectangle");
    });

    it("should update mode configuration", async () => {
      await coordinator.setSelectionMode("lasso", {
        multiSelect: true,
        preserveSelection: true,
      });

      const config = coordinator.getModeConfig();
      expect(config.mode).toBe("lasso");
      expect(config.multiSelect).toBe(true);
      expect(config.preserveSelection).toBe(true);
    });

    it("should broadcast mode change to all webviews", async () => {
      const panel = createMockWebviewPanel();
      coordinator.registerWebviewPanel(panel as any);

      // Clear registration calls
      panel.webview.postMessage.mockClear();

      await coordinator.setSelectionMode("rectangle");

      expect(panel.webview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          command: "setSelectionMode",
          mode: "rectangle",
        })
      );
    });

    it("should toggle through selection modes", async () => {
      expect(coordinator.getCurrentMode()).toBe("single");

      await coordinator.toggleSelectionMode();
      expect(coordinator.getCurrentMode()).toBe("rectangle");

      await coordinator.toggleSelectionMode();
      expect(coordinator.getCurrentMode()).toBe("lasso");

      await coordinator.toggleSelectionMode();
      expect(coordinator.getCurrentMode()).toBe("single");
    });
  });

  describe("Selection Operation Handling", () => {
    it("should handle selection operation result", async () => {
      const result: SelectionResult = {
        selectedNodeIds: ["node-1", "node-2", "node-3"],
        accuracy: 0.95,
        duration: 25,
      };

      await coordinator.handleSelectionOperation(result, "rectangle");

      const selection = coordinator.getCurrentSelection();
      expect(selection.selectedNodeIds).toEqual(["node-1", "node-2", "node-3"]);
      expect(selection.focusedNodeId).toBe("node-1");
    });

    it("should merge with existing selection when preserveSelection is true", async () => {
      // Set initial selection
      await coordinator.updateSelection({
        selectedNodeIds: ["node-1"],
        focusedNodeId: "node-1",
      });

      // Enable preserve selection
      await coordinator.setSelectionMode("rectangle", {
        preserveSelection: true,
      });

      const result: SelectionResult = {
        selectedNodeIds: ["node-2", "node-3"],
        accuracy: 1.0,
        duration: 15,
      };

      await coordinator.handleSelectionOperation(result, "rectangle");

      const selection = coordinator.getCurrentSelection();
      expect(selection.selectedNodeIds).toContain("node-1");
      expect(selection.selectedNodeIds).toContain("node-2");
      expect(selection.selectedNodeIds).toContain("node-3");
    });

    it("should replace selection when preserveSelection is false", async () => {
      // Set initial selection
      await coordinator.updateSelection({
        selectedNodeIds: ["node-1"],
        focusedNodeId: "node-1",
      });

      const result: SelectionResult = {
        selectedNodeIds: ["node-2", "node-3"],
        accuracy: 1.0,
        duration: 15,
      };

      await coordinator.handleSelectionOperation(result, "rectangle");

      const selection = coordinator.getCurrentSelection();
      expect(selection.selectedNodeIds).not.toContain("node-1");
      expect(selection.selectedNodeIds).toContain("node-2");
      expect(selection.selectedNodeIds).toContain("node-3");
    });
  });

  describe("Multi-Select Detection", () => {
    it("should detect multi-select when multiple nodes selected", async () => {
      await coordinator.updateSelection({
        selectedNodeIds: ["node-1", "node-2"],
        focusedNodeId: "node-1",
      });

      expect(coordinator.isMultiSelectActive()).toBe(true);
    });

    it("should detect multi-select when config flag is set", async () => {
      await coordinator.setSelectionMode("rectangle", {
        multiSelect: true,
      });

      expect(coordinator.isMultiSelectActive()).toBe(true);
    });

    it("should not detect multi-select with single selection", async () => {
      await coordinator.updateSelection({
        selectedNodeIds: ["node-1"],
        focusedNodeId: "node-1",
      });

      expect(coordinator.isMultiSelectActive()).toBe(false);
    });
  });

  describe("Selection History", () => {
    it("should add selection to history", async () => {
      await coordinator.updateSelection({
        selectedNodeIds: ["node-1"],
        focusedNodeId: "node-1",
      });

      await coordinator.updateSelection({
        selectedNodeIds: ["node-2"],
        focusedNodeId: "node-2",
      });

      const stats = coordinator.getSelectionStats();
      expect(stats.historySize).toBeGreaterThan(0);
    });

    it("should undo selection change", async () => {
      await coordinator.updateSelection({
        selectedNodeIds: ["node-1"],
        focusedNodeId: "node-1",
      });

      await coordinator.updateSelection({
        selectedNodeIds: ["node-2"],
        focusedNodeId: "node-2",
      });

      const undone = await coordinator.undoSelection();
      expect(undone).toBe(true);

      const selection = coordinator.getCurrentSelection();
      expect(selection.selectedNodeIds).toContain("node-1");
    });

    it("should return false when no history available", async () => {
      const undone = await coordinator.undoSelection();
      expect(undone).toBe(false);
    });

    it("should not add duplicate selections to history", async () => {
      await coordinator.updateSelection({
        selectedNodeIds: ["node-1"],
        focusedNodeId: "node-1",
      });

      // Same selection again
      await coordinator.updateSelection({
        selectedNodeIds: ["node-1"],
        focusedNodeId: "node-1",
      });

      const stats = coordinator.getSelectionStats();
      // History should not have duplicate - only the initial empty state and first selection
      expect(stats.historySize).toBeLessThanOrEqual(2);
    });
  });

  describe("Statistics", () => {
    it("should provide selection statistics", async () => {
      const panel1 = createMockWebviewPanel();
      const panel2 = createMockWebviewPanel();

      coordinator.registerWebviewPanel(panel1 as any);
      coordinator.registerWebviewPanel(panel2 as any);

      await coordinator.updateSelection({
        selectedNodeIds: ["node-1", "node-2"],
        focusedNodeId: "node-1",
      });

      await coordinator.setSelectionMode("rectangle");

      const stats = coordinator.getSelectionStats();

      expect(stats.totalWebviews).toBe(2);
      expect(stats.currentMode).toBe("rectangle");
      expect(stats.selectedCount).toBe(2);
      expect(stats.historySize).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Disposal", () => {
    it("should clear all state on disposal", () => {
      const panel = createMockWebviewPanel();
      coordinator.registerWebviewPanel(panel as any);

      coordinator.dispose();

      const stats = coordinator.getSelectionStats();
      expect(stats.totalWebviews).toBe(0);
      expect(stats.historySize).toBe(0);
      expect(stats.selectedCount).toBe(0);
    });
  });

  describe("Error Handling", () => {
    it("should handle webview message failures gracefully", async () => {
      const panel = createMockWebviewPanel();

      // Make postMessage fail
      panel.webview.postMessage.mockRejectedValue(
        new Error("Webview disposed")
      );

      coordinator.registerWebviewPanel(panel as any);

      // Should not throw
      await expect(
        coordinator.updateSelection({
          selectedNodeIds: ["node-1"],
          focusedNodeId: "node-1",
        })
      ).resolves.not.toThrow();
    });

    it("should handle missing webview gracefully", async () => {
      const panel = {
        webview: null,
        onDidDispose: vi.fn(),
      };

      coordinator.registerWebviewPanel(panel as any);

      // Should not throw
      await expect(
        coordinator.updateSelection({
          selectedNodeIds: ["node-1"],
          focusedNodeId: "node-1",
        })
      ).resolves.not.toThrow();
    });
  });
});
