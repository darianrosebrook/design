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
} from "lucide-react";
import { useState, useEffect } from "react";
import type React from "react";
import styles from "./action-bar.module.scss";
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

export const ActionBar = ({ onViewModeChange }: ActionBarProps) => {
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
        <div className={styles.actionBarContainer}>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleActionBar}
            className={styles.actionBarToggleButton}
            title="Show Action Bar (`)"
          >
            <Eye className={styles.actionBarIcon} />
          </Button>
        </div>
      )}

      {/* Main Action Bar */}
      <div
        className={`${styles.actionBarContainer} ${
          styles.actionBarTransition
        } ${isVisible ? styles.actionBarVisible : styles.actionBarHidden}`}
      >
        <div className={styles.actionBar}>
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
                      className={`${styles.actionBarButton} ${
                        button.overflowOptions.some((opt) => opt.isActive)
                          ? styles.actionBarButtonActive
                          : ""
                      }`}
                    >
                      <ActiveIcon className={styles.actionBarIcon} />
                      <ChevronDown className={styles.actionBarIconSmall} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="center"
                    side="top"
                    className={styles.actionBarDropdown}
                  >
                    {button.overflowOptions.map((option) => {
                      const OptionIcon = option.icon;
                      return (
                        <DropdownMenuItem
                          key={option.name}
                          onClick={option.onClick}
                          className={`${styles.actionBarDropdownItem} ${
                            option.isActive
                              ? styles.actionBarDropdownItemActive
                              : ""
                          }`}
                        >
                          <OptionIcon className={styles.actionBarIcon} />
                          <span>{option.name}</span>
                          {option.shortcut && (
                            <span className={styles.actionBarDropdownShortcut}>
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
                className={`${styles.actionBarButton} ${
                  isActive ? styles.actionBarButtonActive : ""
                }`}
              >
                <ActiveIcon className={styles.actionBarIcon} />
              </Button>
            );
          })}

          {/* Hide Action Bar Button */}
          <div className={styles.actionBarDivider} />
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleActionBar}
            className={styles.actionBarButton}
            title="Hide Action Bar (`)"
          >
            <EyeOff className={styles.actionBarIcon} />
          </Button>
        </div>
      </div>
    </>
  );
};
