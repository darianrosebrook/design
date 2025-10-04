/**
 * @fileoverview Action Bar Component - Bottom toolbar with canvas tools
 * @author @darianrosebrook
 */

// Use global React object provided by react-bundle.js
const React = (window as any).React as typeof import("react");
const { useState, useCallback } = React;
import { ToggleButton } from "@paths-design/design-system";
import type { LucideProps } from "lucide-react";
import {
  MousePointer2,
  MousePointerClick,
  Frame,
  Type,
  Image,
  Shapes,
  View,
  Save,
  SquareDashedMousePointer,
  Spline,
  VectorSquare,
  Circle,
  Group,
  Section,
  FileInput,
  Video,
  Code,
} from "lucide-react";
import { createMessage } from "../../../src/protocol/messages";

// VS Code API type
interface VSCodeAPI {
  postMessage(message: unknown): void;
}
interface ActionBarOverflowOption {
  name: string;
  icon: React.ComponentType<LucideProps>;
  shortcut?: string[];
  onClick: () => void;
  isActive: boolean;
}
interface ActionBarButton {
  name: string;
  defaultIcon: React.ComponentType<LucideProps>;
  shortcut?: string[];
  overflowOptions?: ActionBarOverflowOption[];
  isActive?: boolean;
  onClick?: () => void;
}

interface ActionBarProps {
  onViewModeChange?: (mode: "canvas" | "code") => void;
  vscode?: VSCodeAPI;
}
type SelectionMode = "single" | "rectangle" | "lasso";
type WrapMode = "group" | "frame" | "section" | "page";
type TypeMode = "text";
type ImageMode = "image" | "video";
type ShapeMode = "line" | "rectangle" | "ellipse" | "polygon";
type ViewMode = "canvas" | "code";

export const ActionBar = React.forwardRef<HTMLDivElement, ActionBarProps>(
  (props: ActionBarProps, ref: React.Ref<HTMLDivElement> | null) => {
    const { onViewModeChange, vscode } = props;
    // Require vscode prop - it should be passed from parent component
    if (!vscode) {
      throw new Error("ActionBar requires vscode prop");
    }

    // Toolbar state
    const [selectionMode, setSelectionMode] = useState<SelectionMode>("single");
    const [wrapMode, setWrapMode] = useState<WrapMode>("frame");
    const [typeMode, setTypeMode] = useState<TypeMode>("text");
    const [imageMode, setImageMode] = useState<ImageMode>("image");
    const [shapeMode, setShapeMode] = useState<ShapeMode>("rectangle");
    const [zoom, setZoom] = useState(100);
    const [viewMode, setViewMode] = useState<ViewMode>("canvas");
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
            name: "Rectangle Selection",
            icon: MousePointerClick,
            shortcut: ["M"],
            onClick: () => handleSelectionModeChange("rectangle"),
            isActive: selectionMode === "rectangle",
          },
          {
            name: "Lasso Selection",
            icon: SquareDashedMousePointer,
            shortcut: ["L"],
            onClick: () => handleSelectionModeChange("lasso"),
            isActive: selectionMode === "lasso",
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
        vscode.postMessage(
          createMessage("selectionModeChange", {
            mode: mode as "single" | "rectangle" | "lasso",
            config: { multiSelect: false, preserveSelection: false },
          })
        );
      },
      [vscode]
    );

    // TODO: Add zoom and save message types to protocol
    // Zoom handlers
    const _handleZoomIn = useCallback(() => {
      const newZoom = Math.min(zoom * 1.2, 500);
      setZoom(newZoom);
      // vscode.postMessage(createMessage("zoom", { level: newZoom }));
    }, [zoom]);

    const _handleZoomOut = useCallback(() => {
      const newZoom = Math.max(zoom * 0.8, 10);
      setZoom(newZoom);
      // vscode.postMessage(createMessage("zoom", { level: newZoom }));
    }, [zoom]);

    const _handleZoomFit = useCallback(() => {
      setZoom(100);
      // vscode.postMessage(createMessage("zoomFit", {}));
    }, []);

    // Save handler
    const _handleSave = useCallback(() => {
      // vscode.postMessage(createMessage("saveDocument", { path: "", document: {} as any }));
    }, []);

    // Wrap mode handlers
    const handleWrapModeChange = useCallback(
      (mode: WrapMode) => {
        setWrapMode(mode);
        vscode.postMessage(
          createMessage("wrapModeChange", {
            mode,
          })
        );
      },
      [vscode]
    );

    // Type mode handlers
    const handleTypeModeChange = useCallback(
      (mode: TypeMode) => {
        setTypeMode(mode);
        vscode.postMessage(
          createMessage("typeModeChange", {
            mode,
          })
        );
      },
      [vscode]
    );

    // Image mode handlers
    const handleImageModeChange = useCallback(
      (mode: ImageMode) => {
        setImageMode(mode);
        vscode.postMessage(
          createMessage("imageModeChange", {
            mode,
          })
        );
      },
      [vscode]
    );

    // Shape mode handlers
    const handleShapeModeChange = useCallback(
      (mode: ShapeMode) => {
        setShapeMode(mode);
        vscode.postMessage(
          createMessage("shapeModeChange", {
            mode,
          })
        );
      },
      [vscode]
    );

    // View mode handlers
    const handleViewModeChange = useCallback(
      (mode: ViewMode) => {
        setViewMode(mode);
        onViewModeChange?.(mode);
        vscode.postMessage(createMessage("viewModeChange", { mode }));
      },
      [onViewModeChange, vscode]
    );

    return (
      <div ref={ref} className="action-bar">
        {actionBarLayout.map((button) => {
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
              key={button.name}
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
  }
);
