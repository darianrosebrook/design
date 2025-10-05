"use client";

import {
  ChevronDown,
  Circle,
  Code,
  Frame,
  Hand,
  ImageIcon,
  MousePointer2,
  Scaling,
  Shapes,
  Spline,
  Square,
  Type,
  View,
} from "lucide-react";
import type React from "react";
import { useState, useEffect } from "react";
import { useCanvasBridge } from "../lib/bridge-context";
import { useCanvas, type CanvasTool } from "../lib/canvas-context";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface ActionBarOverflowOption {
  name: string;
  icon: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  shortcut?: string[];
  onClick: () => void;
  isActive: boolean;
}

interface ActionBarButton {
  name: string;
  defaultIcon: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  shortcut?: string[];
  overflowOptions?: ActionBarOverflowOption[];
  isActive?: boolean;
  onClick?: () => void;
}

interface ActionBarProps {
  onViewModeChange?: (mode: "canvas" | "code") => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({ onViewModeChange }) => {
  const { activeTool, setActiveTool } = useCanvas();
  const { bridge, isReady } = useCanvasBridge();
  const [viewMode, setViewMode] = useState<"canvas" | "code">("canvas");

  const handleToolChange = (tool: CanvasTool) => {
    setActiveTool(tool);
    if (isReady) {
      // Send tool change through bridge (using selection mode for now)
      const mode =
        tool === "select"
          ? "single"
          : tool === "hand"
          ? "single" // TODO: Add proper tool mapping
          : "single";
      bridge.sendMessage({
        id: crypto.randomUUID(),
        version: "0.1.0",
        timestamp: Date.now(),
        type: "selectionModeChange",
        mode,
        config: { multiSelect: true },
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "v":
          handleToolChange("select");
          break;
        case "h":
          handleToolChange("hand");
          break;
        case "k":
          handleToolChange("scale");
          break;
        case "f":
          handleToolChange("frame");
          break;
        case "t":
          handleToolChange("text");
          break;
        case "i":
          handleToolChange("image");
          break;
        case "r":
          handleToolChange("rectangle");
          break;
        case "e":
          handleToolChange("ellipse");
          break;
        case "l":
        case "p":
          handleToolChange("line");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleToolChange]);

  const handleViewModeChange = (mode: "canvas" | "code") => {
    setViewMode(mode);
    onViewModeChange?.(mode);
    if (isReady) {
      bridge.sendMessage({
        id: crypto.randomUUID(),
        version: "0.1.0",
        timestamp: Date.now(),
        type: "viewModeChange",
        mode,
      });
    }
  };

  const getActiveIcon = (button: ActionBarButton) => {
    if (button.name === "Selection") {
      if (activeTool === "select") {
        return MousePointer2;
      }
      if (activeTool === "hand") {
        return Hand;
      }
      if (activeTool === "scale") {
        return Scaling;
      }
    }
    if (button.name === "Wrap") {
      return activeTool === "frame" ? Frame : button.defaultIcon;
    }
    if (button.name === "Shape") {
      if (activeTool === "rectangle") {
        return Square;
      }
      if (activeTool === "ellipse") {
        return Circle;
      }
      if (activeTool === "line") {
        return Spline;
      }
    }
    if (button.name === "Image") {
      return activeTool === "image" ? ImageIcon : button.defaultIcon;
    }
    if (button.name === "Type") {
      return activeTool === "text" ? Type : button.defaultIcon;
    }
    if (button.name === "View mode") {
      const activeOption = button.overflowOptions?.find((opt) => opt.isActive);
      return activeOption?.icon || button.defaultIcon;
    }
    return button.defaultIcon;
  };

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
          onClick: () => handleToolChange("select"),
          isActive: activeTool === "select",
        },
        {
          name: "Move Canvas",
          icon: Hand,
          shortcut: ["H"],
          onClick: () => handleToolChange("hand"),
          isActive: activeTool === "hand",
        },
        {
          name: "Scale",
          icon: Scaling,
          shortcut: ["K"],
          onClick: () => handleToolChange("scale"),
          isActive: activeTool === "scale",
        },
      ],
    },
    {
      name: "Wrap",
      defaultIcon: Frame,
      shortcut: ["F"],
      onClick: () => handleToolChange("frame"),
      isActive: activeTool === "frame",
    },
    {
      name: "Type",
      defaultIcon: Type,
      shortcut: ["T"],
      onClick: () => handleToolChange("text"),
      isActive: activeTool === "text",
    },
    {
      name: "Image",
      defaultIcon: ImageIcon,
      shortcut: ["I"],
      onClick: () => handleToolChange("image"),
      isActive: activeTool === "image",
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
          onClick: () => handleToolChange("line"),
          isActive: activeTool === "line",
        },
        {
          name: "Rectangle",
          icon: Square,
          shortcut: ["R"],
          onClick: () => handleToolChange("rectangle"),
          isActive: activeTool === "rectangle",
        },
        {
          name: "Ellipse",
          icon: Circle,
          shortcut: ["E"],
          onClick: () => handleToolChange("ellipse"),
          isActive: activeTool === "ellipse",
        },
        {
          name: "Polygon",
          icon: Shapes,
          shortcut: ["Shift+P"],
          onClick: () => handleToolChange("polygon"),
          isActive: activeTool === "polygon",
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
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 bg-zinc-800 border border-zinc-700 rounded-2xl px-2 py-2 shadow-2xl">
        {actionBarLayout.map((button) => {
          const ActiveIcon = getActiveIcon(button);
          const isActive = button.isActive;

          if (button.overflowOptions && button.overflowOptions.length > 1) {
            return (
              <DropdownMenu key={button.name}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 px-2 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 gap-1 ${
                      button.overflowOptions.some((opt) => opt.isActive)
                        ? "bg-zinc-700 text-zinc-100"
                        : ""
                    }`}
                  >
                    <ActiveIcon className="h-4 w-4" />
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="center"
                  side="top"
                  className="bg-zinc-800 border-zinc-700 text-zinc-100"
                >
                  {button.overflowOptions.map((option) => {
                    const OptionIcon = option.icon;
                    return (
                      <DropdownMenuItem
                        key={option.name}
                        onClick={option.onClick}
                        className={`gap-2 hover:bg-zinc-700 cursor-pointer ${
                          option.isActive ? "bg-zinc-700" : ""
                        }`}
                      >
                        <OptionIcon className="h-4 w-4" />
                        <span>{option.name}</span>
                        {option.shortcut && (
                          <span className="ml-auto text-xs text-zinc-500">
                            {option.shortcut.join("+")}
                          </span>
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          }

          return (
            <Button
              key={button.name}
              variant="ghost"
              size="sm"
              onClick={button.onClick}
              className={`h-8 px-2 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 ${
                isActive ? "bg-zinc-700 text-zinc-100" : ""
              }`}
            >
              <ActiveIcon className="h-4 w-4" />
            </Button>
          );
        })}
      </div>
    </div>
  );
};
