/**
 * @fileoverview Canvas Toolbar Component
 * @author @darianrosebrook
 *
 * Main toolbar for the canvas webview providing essential design tools,
 * selection modes, zoom controls, and view switching.
 */

import React, { useState, useCallback } from "react";
import { createMessage } from "../../src/protocol/messages";
import { Button, Stack } from "@paths-design/design-system";

const toolbarLayout = [
  {
    name: "Selection",
    defaultIcon: "MousePointer2",
    defaultIconOnClick: "MousePointerClick",
    shortcut: "V",
    overflowOptions: [
      {
        name: "Single Selection",
        icon: "MousePointer2",
        iconOnClick: "MousePointerClick",
        onClick: () => handleSelectionModeChange("single"),
        isActive: selectionMode === "single",
      },
      {
        name: "Move Canvas",
        icon: "Hand",
        iconOnClick: "HandGrab",
        onClick: () => handleSelectionModeChange("move"),
        isActive: selectionMode === "move",
      },
      {
        name: "Scale",
        icon: "Scaling",
        iconOnClick: "Scaling",
        onClick: () => handleSelectionModeChange("scale"),
        isActive: selectionMode === "scale",
      },
    ],
  },
  {
    name: "Wrap",
    defaultIcon: "Frame",
    defaultIconOnClick: "Frame",
    shortcut: "F",
    overflowOptions: [
      {
        name: "Group",
        icon: "Group",
        iconOnClick: "Group",
        onClick: () => handleWrapModeChange("group"),
        isActive: wrapMode === "group",
      },
      {
        name: "Frame",
        icon: "Frame",
        iconOnClick: "Frame",
        onClick: () => handleWrapModeChange("frame"),
        isActive: wrapMode === "frame",
      },
      {
        name: "Section",
        icon: "Section",
        iconOnClick: "Section",
        onClick: () => handleWrapModeChange("section"),
        isActive: wrapMode === "section",
      },
      {
        name: "Page",
        icon: "FileInput",
        iconOnClick: "FileInput",
        onClick: () => handleWrapModeChange("page"),
        isActive: wrapMode === "page",
      },
    ],
  },
  {
    name: "Type",
    defaultIcon: "Type",
    defaultIconOnClick: "Type",
    shortcut: "T",
    overflowOptions: [
      {
        name: "Text",
        icon: "Type",
        iconOnClick: "Type",
        onClick: () => handleTypeModeChange("text"),
        isActive: typeMode === "text",
      },
    ],
  },
  {
    name: "Image",
    defaultIcon: "Image",
    defaultIconOnClick: "Image",
    shortcut: "I",
    overflowOptions: [
      {
        name: "Image",
        icon: "Image",
        iconOnClick: "ImageUp",
        onClick: () => handleImageModeChange("image"),
        isActive: imageMode === "image",
      },
      {
        name: "Video",
        icon: "Video",
        iconOnClick: "Video",
        onClick: () => handleImageModeChange("video"),
        isActive: imageMode === "video",
      },
    ],
  },
  {
    name: "Shape",
    defaultIcon: "Shape",
    defaultIconOnClick: "Shape",
    shortcut: "R",
    overflowOptions: [
      {
        name: "Line",
        icon: "Line",
        iconOnClick: "Spline",
        shortcut: ["L", "P"],
        onClick: () => handleShapeModeChange("line"),
        isActive: shapeMode === "line",
      },
      {
        name: "Rectangle",
        icon: "VectorSquare",
        iconOnClick: "VectorSquare",
        shortcut: "R",
        onClick: () => handleShapeModeChange("rectangle"),
        isActive: shapeMode === "rectangle",
      },
      {
        name: "Ellipse",
        icon: "Circle",
        iconOnClick: "Circle",
        shortcut: "E",
        onClick: () => handleShapeModeChange("ellipse"),
        isActive: shapeMode === "ellipse",
      },
      {
        name: "Polygon",
        icon: "Shapes",
        iconOnClick: "Shapes",
        shortcut: "Shift+P",
        onClick: () => handleShapeModeChange("polygon"),
        isActive: shapeMode === "polygon",
      },
    ],
  },
];
interface ToolbarAction {
  name: string;
  defaultIcon: string;
  defaultIconOnClick: string;
  shortcut: string;
  overflowOptions: ToolbarAction[];
  isActive: boolean;
}

const TOOLBAR_ACTIONS = {
  SELECTION_MODE_CHANGE: "selectionModeChange",
  ZOOM: "zoom",
  ZOOM_FIT: "zoomFit",
  TOGGLE_GRID: "toggleGrid",
  TOGGLE_SNAP: "toggleSnap",
};
const toolbarActions: ToolbarAction[] = new Map([]);

const registerToolbarAction = (action: ToolbarAction) => {
  toolbarActions.set(action.command, action);
};

const getToolbarAction = (command: string) => {
  return toolbarActions.get(command);
};

const getToolbarActionByTitle = (title: string) => {
  return Array.from(toolbarActions.values()).find(
    (action) => action.title === title
  );
};

const getToolbarActionByShortcut = (shortcut: string) => {
  return Array.from(toolbarActions.values()).find(
    (action) => action.shortcut === shortcut
  );
};

const getToolbarActionByPayload = (payload: Record<string, any>) => {
  return Array.from(toolbarActions.values()).find(
    (action) => action.payload === payload
  );
};
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
  variant?: "primary" | "secondary" | "destructive";
  size?: "sm" | "md" | "lg";
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
  variant = "secondary",
  size = "sm",
}) => {
  // Get icon SVG
  const iconSvg = lucideIconName ? renderSimpleIcon(lucideIconName) : null;

  // Determine button variant based on active state
  const buttonVariant = isActive ? "primary" : variant;

  return (
    <Button
      variant={buttonVariant}
      size={size}
      disabled={isDisabled}
      onClick={onClick}
      title={shortcut ? `${title} (${shortcut})` : title}
      className={`toolbar-button ${isActive ? "active" : ""}`}
      aria-label={title}
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
    </Button>
  );
};

interface ToolbarGroupProps {
  children: React.ReactNode;
  label?: string;
}

const ToolbarGroup: React.FC<ToolbarGroupProps> = ({ children, label }) => {
  return (
    <Stack
      direction="horizontal"
      spacing="xs"
      className="toolbar-group"
      as="div"
      role="group"
      aria-label={label}
    >
      {children}
    </Stack>
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
    "single" | "rectangle" | "lasso" | "move" | "scale"
  >("single");
  const [wrapMode, setWrapMode] = useState<
    "group" | "frame" | "section" | "page"
  >("frame");
  const [typeMode, setTypeMode] = useState<"text">("text");
  const [imageMode, setImageMode] = useState<"image" | "video">("image");
  const [shapeMode, setShapeMode] = useState<
    "line" | "rectangle" | "ellipse" | "polygon"
  >("rectangle");
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [viewMode, setViewMode] = useState<"canvas" | "code">("canvas");

  // Selection mode handlers
  const handleSelectionModeChange = useCallback(
    (mode: "single" | "rectangle" | "lasso" | "move" | "scale") => {
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

  const handleWrapModeChange = useCallback(
    (mode: "group" | "frame" | "section" | "page") => {
      setWrapMode(mode);
      // TODO: Implement wrap mode change
    },
    []
  );

  const handleTypeModeChange = useCallback((mode: "text") => {
    setTypeMode(mode);
    // TODO: Implement type mode change
  }, []);

  const handleImageModeChange = useCallback((mode: "image" | "video") => {
    setImageMode(mode);
    // TODO: Implement image mode change
  }, []);

  const handleShapeModeChange = useCallback(
    (mode: "line" | "rectangle" | "ellipse" | "polygon") => {
      setShapeMode(mode);
      // TODO: Implement shape mode change
    },
    []
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
    <div className="bottom-action-bar" role="toolbar" aria-label="Canvas tools">
      <div className="action-bar-content">
        {toolbarLayout.map((category) => (
          <div key={category.name} className="tool-category">
            <div className="category-tools">
              {/* Primary tool button */}
              <ToolbarButton
                lucideIconName={category.defaultIcon}
                title={category.name}
                shortcut={category.shortcut}
                onClick={() => {
                  const firstOption = category.overflowOptions[0];
                  if (firstOption) {
                    firstOption.onClick();
                  }
                }}
                isActive={category.overflowOptions.some((opt) => opt.isActive)}
              />

              {/* Overflow menu could be added here */}
            </div>
          </div>
        ))}

        {/* Separator */}
        <div className="action-bar-separator" />

        {/* Secondary actions */}
        <div className="secondary-actions">
          <ToolbarButton
            lucideIconName="ZoomOut"
            title="Zoom Out"
            onClick={handleZoomOut}
            size="sm"
          />
          <span className="zoom-display">{Math.round(zoom)}%</span>
          <ToolbarButton
            lucideIconName="ZoomIn"
            title="Zoom In"
            onClick={handleZoomIn}
            size="sm"
          />
          <ToolbarButton
            lucideIconName="Maximize"
            title="Fit to Screen"
            onClick={handleZoomFit}
            size="sm"
          />
        </div>

        {/* Separator */}
        <div className="action-bar-separator" />

        {/* View mode toggle */}
        <div className="view-mode-toggle">
          <ToolbarButton
            lucideIconName="Palette"
            title="Canvas View"
            onClick={() => handleViewModeChange("canvas")}
            isActive={viewMode === "canvas"}
            size="sm"
          />
          <ToolbarButton
            lucideIconName="Code"
            title="Code View"
            onClick={() => handleViewModeChange("code")}
            isActive={viewMode === "code"}
            size="sm"
          />
        </div>
      </div>
    </div>
  );
};
