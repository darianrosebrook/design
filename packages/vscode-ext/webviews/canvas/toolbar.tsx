/**
 * @fileoverview Canvas Toolbar Component
 * @author @darianrosebrook
 *
 * Main toolbar for the canvas webview providing essential design tools,
 * selection modes, zoom controls, and view switching.
 */

import React, { useState, useCallback } from "react";
import { createMessage } from "../../src/protocol/messages";

// Declare Lucide icons as global types
declare global {
  interface Window {
    lucide: {
      icons: Record<string, any>;
      createIcons: (options?: {
        icons?: Record<string, any>;
        nameAttr?: string;
        attrs?: Record<string, any>;
      }) => void;
    };
  }
}

// Simple SVG icon renderer
const renderSimpleIcon = (iconName: string) => {
  const icons: Record<string, string> = {
    MousePointer2: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5.653 12.367 7.5 7.5a9 9 0 0 0 7.694-7.694l-7.5-7.5a9 9 0 0 0-7.694 7.694Z"/><path d="m11 15-3-3"/><path d="m11 9 3 3"/></svg>`,
    Square: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/></svg>`,
    Lasso: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 22a5 5 0 0 1-2-4"/><path d="M3.3 13.3A10.97 10.97 0 0 1 3 7c0-2.8 2.2-5 5-5 1.78 0 3.36.84 4.4 2.15"/><path d="M21 2.3a10.97 10.97 0 0 1-.3 6.7"/><path d="M20.7 10.7A10.97 10.97 0 0 1 21 17c0 2.8-2.2 5-5 5-1.78 0-3.36-.84-4.4-2.15"/></svg>`,
    ZoomOut: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><line x1="8" x2="16" y1="11" y2="11"/></svg>`,
    ZoomIn: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><line x1="11" x2="11" y1="8" y2="16"/><line x1="8" x2="16" y1="11" y2="11"/></svg>`,
    Maximize: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>`,
    Grid3X3: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>`,
    Magnet: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 2-2 2"/><path d="m17 7 2-2"/><rect width="8" height="14" x="8" y="4" rx="2"/><path d="M12 16v4"/><path d="m8 16-2 2"/></svg>`,
    Undo: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>`,
    Redo: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>`,
    Palette: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.82-.13 2.66-.375"/><path d="M16.25 19.25a2 2 0 0 1-2.5-2.5"/><path d="M12 12c1.5 0 2.5-1 2.5-2.5s-1-2.5-2.5-2.5-2.5 1-2.5 2.5 1 2.5 2.5 2.5Z"/></svg>`,
    Code: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16,18 22,12 16,6"/><polyline points="8,6 2,12 8,18"/></svg>`,
    Save: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17,21 17,13 7,13 7,21"/><polyline points="7,3 7,8 15,8"/></svg>`,
  };

  return icons[iconName] || null;
};

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
  icon?: string;
  text?: string;
  lucideIconName?: string;
  title: string;
  onClick: () => void;
  isActive?: boolean;
  isDisabled?: boolean;
  shortcut?: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon,
  text,
  lucideIconName,
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

  // Get icon SVG
  const iconSvg = lucideIconName ? renderSimpleIcon(lucideIconName) : null;

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
      {iconSvg ? (
        <div
          dangerouslySetInnerHTML={{ __html: iconSvg }}
          className="lucide-icon"
        />
      ) : text ? (
        <span className="button-text">{text}</span>
      ) : icon ? (
        <span className={`codicon codicon-${icon}`} />
      ) : (
        <span className="button-text">?</span>
      )}
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
  vscode?: VSCodeAPI;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  onViewModeChange,
  vscode,
}) => {
  const vscodeApi = vscode || window.acquireVsCodeApi();

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
      vscodeApi.postMessage(
        createMessage("selectionModeChange", {
          mode,
          config: { mode, multiSelect: false, preserveSelection: false },
        })
      );
    },
    [vscodeApi]
  );

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(zoom * 1.2, 500);
    setZoom(newZoom);
    vscodeApi.postMessage(
      createMessage("zoom", {
        level: newZoom,
      })
    );
  }, [zoom, vscodeApi]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(zoom * 0.8, 10);
    setZoom(newZoom);
    vscodeApi.postMessage(
      createMessage("zoom", {
        level: newZoom,
      })
    );
  }, [zoom, vscodeApi]);

  const handleZoomFit = useCallback(() => {
    setZoom(100);
    vscodeApi.postMessage(createMessage("zoomFit", {}));
  }, [vscodeApi]);

  // Grid and snap handlers
  const handleToggleGrid = useCallback(() => {
    const newShowGrid = !showGrid;
    setShowGrid(newShowGrid);
    vscodeApi.postMessage(createMessage("toggleGrid", {}));
  }, [showGrid, vscodeApi]);

  const handleToggleSnap = useCallback(() => {
    const newSnapToGrid = !snapToGrid;
    setSnapToGrid(newSnapToGrid);
    vscodeApi.postMessage(createMessage("toggleSnap", {}));
  }, [snapToGrid, vscodeApi]);

  // History handlers
  const handleUndo = useCallback(() => {
    vscodeApi.postMessage(createMessage("undo", {}));
  }, [vscodeApi]);

  const handleRedo = useCallback(() => {
    vscodeApi.postMessage(createMessage("redo", {}));
  }, [vscodeApi]);

  // Save handler
  const handleSave = useCallback(() => {
    vscodeApi.postMessage(createMessage("save", {}));
  }, [vscodeApi]);

  // View mode handlers
  const handleViewModeChange = useCallback(
    (mode: "canvas" | "code") => {
      setViewMode(mode);
      onViewModeChange?.(mode);
      vscodeApi.postMessage(createMessage("setViewMode", { mode }));
    },
    [onViewModeChange, vscodeApi]
  );

  return (
    <div className="canvas-toolbar" role="toolbar" aria-label="Canvas tools">
      {/* Selection Tools */}
      <ToolbarGroup label="Selection tools">
        <ToolbarButton
          lucideIconName="MousePointer2"
          title="Single Selection"
          shortcut="V"
          onClick={() => handleSelectionModeChange("single")}
          isActive={selectionMode === "single"}
        />
        <ToolbarButton
          lucideIconName="Square"
          title="Rectangle Selection"
          shortcut="R"
          onClick={() => handleSelectionModeChange("rectangle")}
          isActive={selectionMode === "rectangle"}
        />
        <ToolbarButton
          lucideIconName="Lasso"
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
          lucideIconName="ZoomOut"
          title="Zoom Out"
          shortcut="Ctrl+-"
          onClick={handleZoomOut}
        />
        <span className="zoom-display">{Math.round(zoom)}%</span>
        <ToolbarButton
          lucideIconName="ZoomIn"
          title="Zoom In"
          shortcut="Ctrl+="
          onClick={handleZoomIn}
        />
        <ToolbarButton
          lucideIconName="Maximize"
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
          lucideIconName="Grid3X3"
          title="Toggle Grid"
          onClick={handleToggleGrid}
          isActive={showGrid}
        />
        <ToolbarButton
          lucideIconName="Magnet"
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
          lucideIconName="Undo"
          title="Undo"
          shortcut="Ctrl+Z"
          onClick={handleUndo}
        />
        <ToolbarButton
          lucideIconName="Redo"
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
          lucideIconName="Palette"
          title="Canvas View"
          onClick={() => handleViewModeChange("canvas")}
          isActive={viewMode === "canvas"}
        />
        <ToolbarButton
          lucideIconName="Code"
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
          lucideIconName="Save"
          title="Save Document"
          shortcut="Ctrl+S"
          onClick={handleSave}
        />
      </ToolbarGroup>
    </div>
  );
};
