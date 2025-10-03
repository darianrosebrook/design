/**
 * @fileoverview Action Bar Component - Bottom toolbar with canvas tools
 * @author @darianrosebrook
 */

import React, { useState, useCallback } from "react";
import { createMessage } from "../../../src/protocol/messages";
import { Button, ToggleButton } from "@paths-design/design-system";
import {
  MousePointer2,
  MousePointerClick,
  Frame,
  Type,
  Image,
  Shapes,
  View,
  Save,
  Hand,
  Scaling,
  SquareDashedMousePointer,
  SquareMousePointer,
  Spline,
  VectorSquare,
  Circle,
  Group,
  Section,
  FileInput,
  LucideProps,
  Video,
  Code,
} from "lucide-react";

// VS Code API type
interface VSCodeAPI {
  postMessage(message: unknown): void;
}
interface ActionBarOverflowOption {
  name: string;
  icon: React.FunctionComponent<LucideProps>;
  shortcut?: string[];
  onClick: () => void;
  isActive: boolean;
}
interface ActionBarButton {
  name: string;
  defaultIcon: React.FunctionComponent<LucideProps>;
  shortcut?: string[];
  overflowOptions?: ActionBarOverflowOption[];
  isActive?: boolean;
  onClick?: () => void;
}

interface ActionBarProps {
  onViewModeChange?: (mode: "canvas" | "code") => void;
  vscode?: VSCodeAPI;
}
type SelectionMode = "single" | "move" | "scale";
type WrapMode = "group" | "frame" | "section" | "page";
type TypeMode = "text";
type ImageMode = "image" | "video";
type ShapeMode = "line" | "rectangle" | "ellipse" | "polygon";
type ViewMode = "canvas" | "code";
type Tool =
  | SelectionMode
  | WrapMode
  | TypeMode
  | ImageMode
  | ShapeMode
  | ViewMode;

export const ActionBar: React.FC<ActionBarProps> = ({
  onViewModeChange,
  vscode,
}) => {
  const vscodeApi = vscode || (window as any).acquireVsCodeApi();

  // Toolbar state
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("single");
  const [wrapMode, setWrapMode] = useState<WrapMode>("frame");
  const [typeMode, setTypeMode] = useState<TypeMode>("text");
  const [imageMode, setImageMode] = useState<ImageMode>("image");
  const [shapeMode, setShapeMode] = useState<ShapeMode>("rectangle");
  const [zoom, setZoom] = useState(100);
  const [viewMode, setViewMode] = useState<"canvas" | "code">("canvas");
  const actionBarLayout: ActionBarButton[] = [
    {
      name: "Selection",
      defaultIcon: MousePointer2,
      shortcut: ["V"],
      overflowOptions: [
        {
          name: "Single Selection",
          icon: MousePointer2,
          shortcut: ["V"],
          onClick: () => handleSelectionModeChange("single"),
          isActive: selectionMode === "single",
        },
        {
          name: "Move Canvas",
          icon: Hand,
          shortcut: ["H"],
          onClick: () => handleSelectionModeChange("move"),
          isActive: selectionMode === "move",
        },
        {
          name: "Scale",
          icon: Scaling,
          shortcut: ["K"],
          onClick: () => handleSelectionModeChange("scale"),
          isActive: selectionMode === "scale",
        },
      ],
    },
    {
      name: "Wrap",
      defaultIcon: Frame,
      shortcut: ["F"],
      overflowOptions: [
        {
          name: "Group",
          icon: Group,
          onClick: () => handleWrapModeChange("group"),
          isActive: wrapMode === "group",
        },
        {
          name: "Frame",
          icon: Frame,
          onClick: () => handleWrapModeChange("frame"),
          isActive: wrapMode === "frame",
        },
        {
          name: "Section",
          icon: Section,
          onClick: () => handleWrapModeChange("section"),
          isActive: wrapMode === "section",
        },
        {
          name: "Page",
          icon: FileInput,
          onClick: () => handleWrapModeChange("page"),
          isActive: wrapMode === "page",
        },
      ],
    },
    {
      name: "Type",
      defaultIcon: Type,
      shortcut: ["T"],
      overflowOptions: [
        {
          name: "Text",
          icon: Type,
          onClick: () => handleTypeModeChange("text"),
          isActive: typeMode === "text",
        },
      ],
    },
    {
      name: "Image",
      defaultIcon: Image,
      shortcut: ["I"],
      overflowOptions: [
        {
          name: "Image",
          icon: Image,
          onClick: () => handleImageModeChange("image"),
          isActive: imageMode === "image",
        },
        {
          name: "Video",
          icon: Video,
          onClick: () => handleImageModeChange("video"),
          isActive: imageMode === "video",
        },
      ],
    },
    {
      name: "Shape",
      defaultIcon: Shapes,
      shortcut: ["R"],
      overflowOptions: [
        {
          name: "Line",
          icon: Spline,
          shortcut: ["L", "P"],
          onClick: () => handleShapeModeChange("line"),
          isActive: shapeMode === "line",
        },
        {
          name: "Rectangle",
          icon: VectorSquare,
          shortcut: ["R"],
          onClick: () => handleShapeModeChange("rectangle"),
          isActive: shapeMode === "rectangle",
        },
        {
          name: "Ellipse",
          icon: Circle,
          shortcut: ["E"],
          onClick: () => handleShapeModeChange("ellipse"),
          isActive: shapeMode === "ellipse",
        },
        {
          name: "Polygon",
          icon: Shapes,
          shortcut: ["Shift+P"],
          onClick: () => handleShapeModeChange("polygon"),
          isActive: shapeMode === "polygon",
        },
      ],
    },
    {
      name: "View mode",
      defaultIcon: View,
      shortcut: ["Shift+D"],
      overflowOptions: [
        {
          name: "Canvas",
          icon: View,
          onClick: () => handleViewModeChange("canvas"),
          isActive: viewMode === "canvas",
        },
        {
          name: "Code",
          icon: Code,
          onClick: () => handleViewModeChange("code"),
          isActive: viewMode === "code",
        },
      ],
    },
    {
      name: "Save",
      defaultIcon: Save,
      shortcut: ["Ctrl+S"],
    },
  ];

  // Selection mode handlers
  const handleSelectionModeChange = useCallback(
    (mode: SelectionMode) => {
      setSelectionMode(mode);
      vscodeApi.postMessage(
        createMessage("selectionModeChange", {
          mode: mode as "single" | "rectangle" | "lasso",
          config: { multiSelect: false, preserveSelection: false },
        })
      );
    },
    [vscodeApi]
  );

  // TODO: Add zoom and save message types to protocol
  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(zoom * 1.2, 500);
    setZoom(newZoom);
    // vscodeApi.postMessage(createMessage("zoom", { level: newZoom }));
  }, [zoom]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(zoom * 0.8, 10);
    setZoom(newZoom);
    // vscodeApi.postMessage(createMessage("zoom", { level: newZoom }));
  }, [zoom]);

  const handleZoomFit = useCallback(() => {
    setZoom(100);
    // vscodeApi.postMessage(createMessage("zoomFit", {}));
  }, []);

  // Save handler
  const handleSave = useCallback(() => {
    // vscodeApi.postMessage(createMessage("saveDocument", { path: "", document: {} as any }));
  }, []);

  // Wrap mode handlers
  const handleWrapModeChange = useCallback(
    (mode: WrapMode) => {
      setWrapMode(mode);
      vscodeApi.postMessage(
        createMessage("wrapModeChange", {
          mode,
        })
      );
    },
    [vscodeApi]
  );

  // Type mode handlers
  const handleTypeModeChange = useCallback(
    (mode: TypeMode) => {
      setTypeMode(mode);
      vscodeApi.postMessage(
        createMessage("typeModeChange", {
          mode,
        })
      );
    },
    [vscodeApi]
  );

  // Image mode handlers
  const handleImageModeChange = useCallback(
    (mode: ImageMode) => {
      setImageMode(mode);
      vscodeApi.postMessage(
        createMessage("imageModeChange", {
          mode,
        })
      );
    },
    [vscodeApi]
  );

  // Shape mode handlers
  const handleShapeModeChange = useCallback(
    (mode: ShapeMode) => {
      setShapeMode(mode);
      vscodeApi.postMessage(
        createMessage("shapeModeChange", {
          mode,
        })
      );
    },
    [vscodeApi]
  );

  // View mode handlers
  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      setViewMode(mode);
      onViewModeChange?.(mode);
      vscodeApi.postMessage(createMessage("viewModeChange", { mode }));
    },
    [onViewModeChange, vscodeApi]
  );

  return (
    <div className="action-bar">
      {actionBarLayout.map((button, index) => {
        const IconComponent = button.defaultIcon;
        const tooltip = button.shortcut
          ? `${button.name} (${button.shortcut.join("+")})`
          : button.name;

        const overflowItems =
          button.overflowOptions?.map((option) => ({
            label: option.shortcut
              ? `${option.name} (${option.shortcut.join("+")})`
              : option.name,
            onClick: option.onClick,
          })) || [];

        return (
          <ToggleButton
            key={`${button.name}-${index}`}
            tooltip={tooltip}
            isActive={button.isActive}
            onClick={button.onClick}
            {...(overflowItems.length > 0 ? { overflowItems } : {})}
          >
            <IconComponent size={16} />
          </ToggleButton>
        );
      })}
    </div>
  );
};
