/**
 * @fileoverview Canvas Toolbar Component
 * @author @darianrosebrook
 *
 * Main toolbar for the canvas webview providing essential design tools,
 * selection modes, zoom controls, and view switching.
 */

import React, { useState, useCallback } from "react";

// VS Code API type
interface VSCodeAPI {
  postMessage(message: unknown): void;
}

declare global {
  interface Window {
    acquireVsCodeApi(): VSCodeAPI;
  }
}

interface ToolbarButtonProps {
  icon: string;
  title: string;
  onClick: () => void;
  isActive?: boolean;
  isDisabled?: boolean;
  shortcut?: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon,
  title,
  onClick,
  isActive = false,
  isDisabled = false,
  shortcut,
}) => {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (!isDisabled) {
        onClick();
      }
    },
    [onClick, isDisabled]
  );

  return (
    <button
      className={`toolbar-button ${isActive ? "active" : ""} ${
        isDisabled ? "disabled" : ""
      }`}
      onClick={handleClick}
      disabled={isDisabled}
      title={shortcut ? `${title} (${shortcut})` : title}
      type="button"
    >
      <span className={`codicon codicon-${icon}`} />
    </button>
  );
};

interface ToolbarGroupProps {
  children: React.ReactNode;
  label?: string;
}

const ToolbarGroup: React.FC<ToolbarGroupProps> = ({ children, label }) => {
  return (
    <div className="toolbar-group" role="group" aria-label={label}>
      {children}
    </div>
  );
};

interface CanvasToolbarProps {
  onViewModeChange?: (mode: "canvas" | "code") => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  onViewModeChange,
}) => {
  const vscode = window.acquireVsCodeApi();

  // Toolbar state
  const [selectionMode, setSelectionMode] = useState<
    "single" | "rectangle" | "lasso"
  >("single");
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [viewMode, setViewMode] = useState<"canvas" | "code">("canvas");

  // Selection mode handlers
  const handleSelectionModeChange = useCallback(
    (mode: "single" | "rectangle" | "lasso") => {
      setSelectionMode(mode);
      vscode.postMessage({
        type: "selectionModeChange",
        payload: {
          mode,
          config: { mode, multiSelect: false, preserveSelection: false },
        },
      });
    },
    [vscode]
  );

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(zoom * 1.2, 500);
    setZoom(newZoom);
    vscode.postMessage({
      type: "zoom",
      level: newZoom,
    });
  }, [zoom, vscode]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(zoom * 0.8, 10);
    setZoom(newZoom);
    vscode.postMessage({
      type: "zoom",
      level: newZoom,
    });
  }, [zoom, vscode]);

  const handleZoomFit = useCallback(() => {
    setZoom(100);
    vscode.postMessage({
      type: "zoomFit",
    });
  }, [vscode]);

  // Grid and snap handlers
  const handleToggleGrid = useCallback(() => {
    const newShowGrid = !showGrid;
    setShowGrid(newShowGrid);
    vscode.postMessage({
      type: "toggleGrid",
    });
  }, [showGrid, vscode]);

  const handleToggleSnap = useCallback(() => {
    const newSnapToGrid = !snapToGrid;
    setSnapToGrid(newSnapToGrid);
    vscode.postMessage({
      type: "toggleSnap",
    });
  }, [snapToGrid, vscode]);

  // History handlers
  const handleUndo = useCallback(() => {
    vscode.postMessage({
      type: "undo",
    });
  }, [vscode]);

  const handleRedo = useCallback(() => {
    vscode.postMessage({
      type: "redo",
    });
  }, [vscode]);

  // Save handler
  const handleSave = useCallback(() => {
    vscode.postMessage({
      type: "save",
    });
  }, [vscode]);

  // View mode handlers
  const handleViewModeChange = useCallback(
    (mode: "canvas" | "code") => {
      setViewMode(mode);
      onViewModeChange?.(mode);
      vscode.postMessage({
        type: "setViewMode",
        mode,
      });
    },
    [onViewModeChange, vscode]
  );

  return (
    <div className="canvas-toolbar" role="toolbar" aria-label="Canvas tools">
      {/* Selection Tools */}
      <ToolbarGroup label="Selection tools">
        <ToolbarButton
          icon="target"
          title="Single Selection"
          shortcut="V"
          onClick={() => handleSelectionModeChange("single")}
          isActive={selectionMode === "single"}
        />
        <ToolbarButton
          icon="selection"
          title="Rectangle Selection"
          shortcut="R"
          onClick={() => handleSelectionModeChange("rectangle")}
          isActive={selectionMode === "rectangle"}
        />
        <ToolbarButton
          icon="lasso"
          title="Lasso Selection"
          shortcut="L"
          onClick={() => handleSelectionModeChange("lasso")}
          isActive={selectionMode === "lasso"}
        />
      </ToolbarGroup>

      {/* Separator */}
      <div className="toolbar-separator" />

      {/* Zoom Controls */}
      <ToolbarGroup label="Zoom controls">
        <ToolbarButton
          icon="zoom-out"
          title="Zoom Out"
          shortcut="Ctrl+-"
          onClick={handleZoomOut}
        />
        <span className="zoom-display">{Math.round(zoom)}%</span>
        <ToolbarButton
          icon="zoom-in"
          title="Zoom In"
          shortcut="Ctrl+="
          onClick={handleZoomIn}
        />
        <ToolbarButton
          icon="screen-full"
          title="Fit to Screen"
          shortcut="Ctrl+0"
          onClick={handleZoomFit}
        />
      </ToolbarGroup>

      {/* Separator */}
      <div className="toolbar-separator" />

      {/* Grid and Snap */}
      <ToolbarGroup label="Grid and snap">
        <ToolbarButton
          icon="grid"
          title="Toggle Grid"
          onClick={handleToggleGrid}
          isActive={showGrid}
        />
        <ToolbarButton
          icon="magnet"
          title="Toggle Snap to Grid"
          onClick={handleToggleSnap}
          isActive={snapToGrid}
        />
      </ToolbarGroup>

      {/* Separator */}
      <div className="toolbar-separator" />

      {/* History */}
      <ToolbarGroup label="History">
        <ToolbarButton
          icon="arrow-left"
          title="Undo"
          shortcut="Ctrl+Z"
          onClick={handleUndo}
        />
        <ToolbarButton
          icon="arrow-right"
          title="Redo"
          shortcut="Ctrl+Y"
          onClick={handleRedo}
        />
      </ToolbarGroup>

      {/* Separator */}
      <div className="toolbar-separator" />

      {/* View Mode Toggle */}
      <ToolbarGroup label="View mode">
        <ToolbarButton
          icon="paintcan"
          title="Canvas View"
          onClick={() => handleViewModeChange("canvas")}
          isActive={viewMode === "canvas"}
        />
        <ToolbarButton
          icon="json"
          title="Code View"
          onClick={() => handleViewModeChange("code")}
          isActive={viewMode === "code"}
        />
      </ToolbarGroup>

      {/* Separator */}
      <div className="toolbar-separator" />

      {/* Save */}
      <ToolbarGroup label="File operations">
        <ToolbarButton
          icon="save"
          title="Save Document"
          shortcut="Ctrl+S"
          onClick={handleSave}
        />
      </ToolbarGroup>
    </div>
  );
};
