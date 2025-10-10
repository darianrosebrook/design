"use client";

import {
  MousePointer2,
  Frame,
  Type,
  ImageIcon,
  Shapes,
  View,
  Hand,
  Scaling,
  Spline,
  Square,
  Circle,
  Code,
  ChevronDown,
  Eye,
  EyeOff,
  Group,
  Section,
  FileBoxIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import type React from "react";
import { useCanvas, type CanvasTool } from "@/lib/canvas-context";
import { Button } from "@/ui/primitives/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/primitives/DropdownMenu";

interface ActionBarOverflowOption {
  name: string;
  icon: React.FunctionComponent<any>;
  shortcut?: string[];
  onClick: () => void;
  isActive: boolean;
}

interface ActionBarButton {
  name: string;
  defaultIcon: React.FunctionComponent<any>;
  shortcut?: string[];
  overflowOptions?: ActionBarOverflowOption[];
  isActive?: boolean;
  onClick?: () => void;
}

interface ActionBarProps {
  onViewModeChange?: (mode: "canvas" | "code") => void;
}

export function ActionBar({ onViewModeChange }: ActionBarProps) {
  const { activeTool, setActiveTool } = useCanvas();
  const [viewMode, setViewMode] = useState<"canvas" | "code">("canvas");
  const [isVisible, setIsVisible] = useState(true);

  // Handle action bar toggle shortcut locally (UI-specific, not canvas state)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "`") {
        setIsVisible(!isVisible);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible]);

  const handleToolChange = (tool: CanvasTool) => {
    setActiveTool(tool);
  };

  const handleViewModeChange = (mode: "canvas" | "code") => {
    setViewMode(mode);
    onViewModeChange?.(mode);
  };

  const toggleActionBar = () => {
    setIsVisible(!isVisible);
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
      overflowOptions: [
        {
          name: "Frame",
          icon: Frame,
          shortcut: ["F"],
          onClick: () => handleToolChange("frame"),
          isActive: activeTool === "frame",
        },
        {
          name: "Group",
          icon: Group,
          shortcut: ["G"],
          onClick: () => handleToolChange("group"),
          isActive: activeTool === "group",
        },
        {
          name: "Section",
          icon: Section,
          shortcut: ["S"],
          onClick: () => handleToolChange("section"),
          isActive: activeTool === "section",
        },
        {
          name: "Page",
          icon: FileBoxIcon,
          shortcut: ["P"],
          onClick: () => handleToolChange("page"),
          isActive: activeTool === "page",
        },
      ],

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
    <>
      {/* Toggle Button - appears when action bar is hidden */}
      {!isVisible && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleActionBar}
            className="h-8 w-8 p-0 bg-zinc-800 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100"
            title="Show Action Bar (`)"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Main Action Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-1 bg-card border border-zinc-800 rounded-2xl px-2 py-2 shadow-2xl">
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
                      className={`h-8 px-2 hover:bg-accent text-muted-foreground hover:text-foreground gap-1 ${
                        button.overflowOptions.some((opt) => opt.isActive)
                          ? "bg-accent text-foreground"
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
                    className="bg-popover text-popover-foreground border border-border"
                  >
                    {button.overflowOptions.map((option) => {
                      const OptionIcon = option.icon;
                      return (
                        <DropdownMenuItem
                          key={option.name}
                          onClick={option.onClick}
                          className={`gap-2 hover:bg-accent cursor-pointer ${
                            option.isActive ? "bg-accent" : ""
                          }`}
                        >
                          <OptionIcon className="h-4 w-4" />
                          <span>{option.name}</span>
                          {option.shortcut && (
                            <span className="ml-auto text-xs text-muted-foreground">
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
                className={`h-8 px-2 hover:bg-accent text-muted-foreground hover:text-foreground ${
                  isActive ? "bg-accent text-foreground" : ""
                }`}
              >
                <ActiveIcon className="h-4 w-4" />
              </Button>
            );
          })}

          {/* Hide Action Bar Button */}
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleActionBar}
            className="h-8 px-2 hover:bg-accent text-muted-foreground hover:text-foreground"
            title="Hide Action Bar (`)"
          >
            <EyeOff className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}

export type { ActionBarProps };
