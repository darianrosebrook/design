/**
 * @fileoverview VS Code commands for selection debugging and inspection
 * @author @darianrosebrook
 *
 * Developer-facing commands for inspecting and debugging selection state.
 */

import * as vscode from "vscode";
import { SelectionAPI } from "../api/selection-api.js";

/**
 * Register selection debugging commands
 */
export function registerSelectionCommands(
  context: vscode.ExtensionContext
): void {
  // Command: Show selection state in output channel
  const showSelectionStateCommand = vscode.commands.registerCommand(
    "designer.showSelectionState",
    async () => {
      const api = SelectionAPI.getInstance();
      const state = api.exportSelectionState();

      const output = vscode.window.createOutputChannel("Designer Selection");
      output.clear();
      output.appendLine("=== Designer Selection State ===");
      output.appendLine("");
      output.appendLine(`Mode: ${state.mode}`);
      output.appendLine(
        `Selected Nodes: ${state.selection.selectedNodeIds.length}`
      );
      output.appendLine(
        `Focused Node: ${state.selection.focusedNodeId || "none"}`
      );
      output.appendLine("");
      output.appendLine("Selected Node IDs:");
      state.selection.selectedNodeIds.forEach((id) => {
        output.appendLine(`  - ${id}`);
      });
      output.appendLine("");
      output.appendLine("Statistics:");
      output.appendLine(`  Webviews: ${state.stats.totalWebviews}`);
      output.appendLine(`  History Size: ${state.stats.historySize}`);
      output.appendLine("");
      output.appendLine("Recent History:");
      state.history.slice(-5).forEach((entry) => {
        const date = new Date(entry.timestamp).toLocaleTimeString();
        output.appendLine(
          `  ${date} [${entry.mode}] - ${entry.selection.selectedNodeIds.length} nodes`
        );
      });

      output.show();
    }
  );

  // Command: Copy selection state as JSON
  const copySelectionJSONCommand = vscode.commands.registerCommand(
    "designer.copySelectionJSON",
    async () => {
      const api = SelectionAPI.getInstance();
      const state = api.exportSelectionState();

      const json = JSON.stringify(state, null, 2);
      await vscode.env.clipboard.writeText(json);

      vscode.window.showInformationMessage(
        "Selection state copied to clipboard as JSON"
      );
    }
  );

  // Command: Show selection quick pick
  const quickPickSelectionCommand = vscode.commands.registerCommand(
    "designer.quickPickSelection",
    async () => {
      const api = SelectionAPI.getInstance();
      const info = api.getSelectionInfo();

      if (info.selection.selectedNodeIds.length === 0) {
        vscode.window.showInformationMessage("No nodes selected");
        return;
      }

      const items = info.selection.selectedNodeIds.map((id) => ({
        label: id,
        description:
          id === info.selection.focusedNodeId ? "Focused" : undefined,
        detail: `Node ID: ${id}`,
      }));

      const selected = await vscode.window.showQuickPick(items, {
        title: "Selected Nodes",
        placeHolder: "Choose a node to inspect",
      });

      if (selected) {
        await vscode.env.clipboard.writeText(selected.label);
        vscode.window.showInformationMessage(
          `Node ID copied: ${selected.label}`
        );
      }
    }
  );

  // Command: Toggle selection mode (with quick pick)
  const quickToggleSelectionModeCommand = vscode.commands.registerCommand(
    "designer.quickToggleSelectionMode",
    async () => {
      const api = SelectionAPI.getInstance();
      const currentMode = api.getSelectionInfo().mode;

      const modes = [
        {
          label: "$(target) Single Selection",
          description: currentMode === "single" ? "Current" : undefined,
          mode: "single" as const,
        },
        {
          label: "$(selection) Rectangle Selection",
          description: currentMode === "rectangle" ? "Current" : undefined,
          mode: "rectangle" as const,
        },
        {
          label: "$(lasso) Lasso Selection",
          description: currentMode === "lasso" ? "Current" : undefined,
          mode: "lasso" as const,
        },
      ];

      const selected = await vscode.window.showQuickPick(modes, {
        title: "Selection Mode",
        placeHolder: "Choose a selection mode",
      });

      if (selected) {
        await vscode.commands.executeCommand(
          `designer.setSelectionMode${
            selected.mode.charAt(0).toUpperCase() + selected.mode.slice(1)
          }`
        );
      }
    }
  );

  // Command: Clear selection history
  const clearSelectionHistoryCommand = vscode.commands.registerCommand(
    "designer.clearSelectionHistory",
    async () => {
      const api = SelectionAPI.getInstance();
      api.clearHistory();

      vscode.window.showInformationMessage("Selection history cleared");
    }
  );

  context.subscriptions.push(
    showSelectionStateCommand,
    copySelectionJSONCommand,
    quickPickSelectionCommand,
    quickToggleSelectionModeCommand,
    clearSelectionHistoryCommand
  );
}
