/**
 * @fileoverview MCP tools for selection inspection and manipulation
 * @author @darianrosebrook
 *
 * Exposes Designer selection state to MCP agents and automation tools.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * MCP tool definitions for selection operations
 */
export const SELECTION_TOOLS: Tool[] = [
  {
    name: "designer_get_selection",
    description:
      "Get the current selection state from the Designer canvas. Returns selected node IDs, focused node, and selection mode.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "designer_get_selection_details",
    description:
      "Get detailed information about currently selected nodes including their properties, bounds, and hierarchy.",
    inputSchema: {
      type: "object",
      properties: {
        includeChildren: {
          type: "boolean",
          description: "Include child nodes of selected frames",
          default: false,
        },
      },
    },
  },
  {
    name: "designer_set_selection",
    description:
      "Set the selection to specific node IDs. Supports multi-select and selection mode configuration.",
    inputSchema: {
      type: "object",
      properties: {
        nodeIds: {
          type: "array",
          items: { type: "string" },
          description: "Array of node IDs to select",
        },
        mode: {
          type: "string",
          enum: ["single", "rectangle", "lasso"],
          description: "Selection mode to use",
          default: "single",
        },
        preserveExisting: {
          type: "boolean",
          description: "Merge with existing selection instead of replacing",
          default: false,
        },
      },
      required: ["nodeIds"],
    },
  },
  {
    name: "designer_clear_selection",
    description: "Clear all selected nodes in the Designer canvas.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "designer_select_by_type",
    description:
      "Select all nodes of a specific type (e.g., 'frame', 'text', 'component').",
    inputSchema: {
      type: "object",
      properties: {
        nodeType: {
          type: "string",
          description: "Node type to select",
        },
        artboardId: {
          type: "string",
          description: "Optional: Limit selection to specific artboard",
        },
      },
      required: ["nodeType"],
    },
  },
  {
    name: "designer_select_by_name",
    description: "Select nodes matching a name pattern (supports regex).",
    inputSchema: {
      type: "object",
      properties: {
        pattern: {
          type: "string",
          description: "Name pattern to match (regex supported)",
        },
        caseSensitive: {
          type: "boolean",
          description: "Case-sensitive matching",
          default: false,
        },
      },
      required: ["pattern"],
    },
  },
  {
    name: "designer_get_selection_bounds",
    description:
      "Get the combined bounding box of all selected nodes in document coordinates.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "designer_export_selection",
    description:
      "Export selected nodes as JSON for inspection or external processing.",
    inputSchema: {
      type: "object",
      properties: {
        includeStyles: {
          type: "boolean",
          description: "Include computed styles",
          default: true,
        },
        includeChildren: {
          type: "boolean",
          description: "Include child node tree",
          default: true,
        },
      },
    },
  },
];

/**
 * Selection tool handler implementation
 * Connects MCP tools to SelectionAPI
 */
export class SelectionToolsHandler {
  /**
   * Handle MCP tool calls for selection operations
   */
  async handleToolCall(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<unknown> {
    if (!selectionAPI) {
      throw new Error(
        "SelectionAPI not initialized - call setSelectionAPI() first"
      );
    }

    try {
      switch (toolName) {
        case "designer_get_selection":
          return await this.handleGetSelection();

        case "designer_get_selection_details":
          return await this.handleGetSelectionDetails(args);

        case "designer_set_selection":
          return await this.handleSetSelection(args);

        case "designer_clear_selection":
          return await this.handleClearSelection();

        case "designer_select_by_type":
          return await this.handleSelectByType(args);

        case "designer_select_by_name":
          return await this.handleSelectByName(args);

        case "designer_get_selection_bounds":
          return await this.handleGetSelectionBounds();

        case "designer_export_selection":
          return await this.handleExportSelection(args);

        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      console.error(`MCP Selection Tool failed: ${toolName}`, error);
      throw error; // Re-throw for MCP error handling
    }
  }

  private async handleGetSelection() {
    const info = selectionAPI.getSelectionInfo();
    if (!info) {
      return {
        selectedNodeIds: [],
        focusedNodeId: null,
        mode: "single",
        count: 0,
        error: "Failed to get selection info",
      };
    }

    return {
      selectedNodeIds: info.selection.selectedNodeIds,
      focusedNodeId: info.selection.focusedNodeId,
      mode: info.mode,
      count: info.stats.selectedCount,
    };
  }

  private async handleGetSelectionDetails(args: Record<string, unknown>) {
    const includeChildren = Boolean(args.includeChildren);
    const details = selectionAPI.getSelectedNodesDetails();

    return {
      nodes: details,
      includeChildren,
      timestamp: Date.now(),
      count: details.length,
    };
  }

  private async handleSetSelection(args: Record<string, unknown>) {
    // Validate input
    const nodeIds = Array.isArray(args.nodeIds) ? args.nodeIds : [];
    const mode = typeof args.mode === "string" ? args.mode : "single";

    // Basic validation
    if (nodeIds.some((id) => typeof id !== "string")) {
      throw new Error("nodeIds must be an array of strings");
    }

    if (!["single", "rectangle", "lasso"].includes(mode)) {
      throw new Error("mode must be one of: single, rectangle, lasso");
    }

    // Note: Actual implementation would need SelectionCoordinator access
    // This is a placeholder for when MCP is fully integrated
    console.log(
      `MCP: Would set selection to ${nodeIds.length} nodes in ${mode} mode`
    );

    return {
      success: true,
      selectedCount: nodeIds.length,
      mode,
      nodeIds,
    };
  }

  private async handleClearSelection() {
    // Note: Actual implementation would need SelectionCoordinator access
    console.log("MCP: Would clear selection");

    return {
      success: true,
      previousCount: 0, // Would get from coordinator
    };
  }

  private async handleSelectByType(args: Record<string, unknown>) {
    const nodeType = String(args.nodeType || "");
    const artboardId = args.artboardId ? String(args.artboardId) : undefined;

    if (!nodeType) {
      throw new Error("nodeType is required");
    }

    // Note: Actual implementation would query document and set selection
    console.log(`MCP: Would select nodes of type ${nodeType}`);

    return {
      success: true,
      nodeType,
      selectedCount: 0, // Placeholder - would be actual count
      artboardId,
    };
  }

  private async handleSelectByName(args: Record<string, unknown>) {
    const pattern = String(args.pattern || "");
    const caseSensitive = Boolean(args.caseSensitive);

    if (!pattern) {
      throw new Error("pattern is required");
    }

    // Note: Actual implementation would use regex matching
    console.log(`MCP: Would select nodes matching pattern: ${pattern}`);

    return {
      success: true,
      pattern,
      caseSensitive,
      selectedCount: 0, // Placeholder - would be actual count
    };
  }

  private async handleGetSelectionBounds() {
    const bounds = selectionAPI.getSelectionBounds();

    if (!bounds) {
      return {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        hasSelection: false,
      };
    }

    return {
      ...bounds,
      hasSelection: true,
    };
  }

  private async handleExportSelection(args: Record<string, unknown>) {
    const includeStyles = args.includeStyles !== false;
    const includeChildren = args.includeChildren !== false;

    const state = selectionAPI.exportSelectionState();
    if (!state) {
      return {
        error: "Failed to export selection state",
        nodes: [],
        includeStyles,
        includeChildren,
        timestamp: Date.now(),
      };
    }

    return {
      selection: state.selection,
      mode: state.mode,
      stats: state.stats,
      nodes: selectionAPI.getSelectedNodesDetails(),
      includeStyles,
      includeChildren,
      timestamp: state.timestamp,
    };
  }
}
