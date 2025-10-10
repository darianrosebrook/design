/**
 * @fileoverview Layout section component for frame properties
 * @author @darianrosebrook
 */

"use client";

import React, { useState, useCallback } from "react";
import {
  Grid3X3,
  Square,
  RotateCcw,
  AlignHorizontalJustifyCenter,
  Plus,
  Minus,
} from "lucide-react";
import { Button } from "@/ui/primitives/Button";
import { cn } from "@/lib/utils";
import type { PropertyChangeEvent } from "@paths-design/properties-panel";

interface LayoutSectionProps {
  selection: {
    selectedNodeIds: string[];
    focusedNodeId: string | null;
  };
  onPropertyChange: (event: PropertyChangeEvent) => void;
  getPropertyValue: (propertyKey: string) => any;
}

interface GhostInputProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Ghost input component for inline editing of layout values
 */
const GhostInput: React.FC<GhostInputProps> = ({
  value,
  onChange,
  label,
  className,
  disabled = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value.toString());

  const handleClick = () => {
    if (disabled) return;
    setIsEditing(true);
    setTempValue(value.toString());
  };

  const handleBlur = () => {
    setIsEditing(false);
    const numValue = parseFloat(tempValue);
    if (!isNaN(numValue) && numValue >= 0) {
      onChange(numValue);
    } else {
      setTempValue(value.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setTempValue(value.toString());
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempValue(e.target.value);
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
      {isEditing ? (
        <input
          type="number"
          value={tempValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-12 h-5 px-1 text-xs text-center bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          autoFocus
        />
      ) : (
        <button
          onClick={handleClick}
          disabled={disabled}
          className={cn(
            "w-12 h-5 text-xs text-foreground hover:bg-muted/50 rounded transition-colors",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {Math.round(value)}
        </button>
      )}
    </div>
  );
};

type LayoutType = "none" | "flex" | "grid";
type SizingType = "fixed" | "fill" | "hug";

export const LayoutSection: React.FC<LayoutSectionProps> = ({
  selection,
  onPropertyChange,
  getPropertyValue,
}) => {
  const hasSelection = selection.selectedNodeIds.length > 0;

  // Get layout values from selected frame
  const layoutType = (getPropertyValue("layoutType") || "none") as LayoutType;
  const width =
    getPropertyValue("width") || getPropertyValue("frame.width") || 360;
  const height =
    getPropertyValue("height") || getPropertyValue("frame.height") || 48;
  const widthSizing = (getPropertyValue("widthSizing") || "fill") as SizingType;
  const heightSizing = (getPropertyValue("heightSizing") ||
    "hug") as SizingType;

  // Padding values
  const paddingTop =
    getPropertyValue("paddingTop") || getPropertyValue("padding.top") || 24;
  const paddingRight =
    getPropertyValue("paddingRight") || getPropertyValue("padding.right") || 8;
  const paddingBottom =
    getPropertyValue("paddingBottom") ||
    getPropertyValue("padding.bottom") ||
    24;
  const paddingLeft =
    getPropertyValue("paddingLeft") || getPropertyValue("padding.left") || 24;

  // Gap values
  const gap = getPropertyValue("gap") || 0;
  const gapX = getPropertyValue("gapX") || getPropertyValue("gap.x") || 0;
  const gapY = getPropertyValue("gapY") || getPropertyValue("gap.y") || 0;

  const handleLayoutTypeChange = useCallback(
    (newLayoutType: LayoutType) => {
      if (!hasSelection) return;

      const nodeId = selection.focusedNodeId || selection.selectedNodeIds[0];

      onPropertyChange({
        nodeId,
        propertyKey: "layoutType",
        oldValue: getPropertyValue("layoutType"),
        newValue: newLayoutType,
        sectionId: "layout",
      });
    },
    [hasSelection, selection, onPropertyChange, getPropertyValue]
  );

  const handleDimensionChange = useCallback(
    (dimension: "width" | "height", value: number) => {
      if (!hasSelection) return;

      const nodeId = selection.focusedNodeId || selection.selectedNodeIds[0];

      onPropertyChange({
        nodeId,
        propertyKey: dimension,
        oldValue: getPropertyValue(dimension),
        newValue: value,
        sectionId: "layout",
      });
    },
    [hasSelection, selection, onPropertyChange, getPropertyValue]
  );

  const handleSizingChange = useCallback(
    (dimension: "width" | "height", sizing: SizingType) => {
      if (!hasSelection) return;

      const nodeId = selection.focusedNodeId || selection.selectedNodeIds[0];
      const propertyKey = `${dimension}Sizing`;

      onPropertyChange({
        nodeId,
        propertyKey,
        oldValue: getPropertyValue(propertyKey),
        newValue: sizing,
        sectionId: "layout",
      });
    },
    [hasSelection, selection, onPropertyChange, getPropertyValue]
  );

  const handlePaddingChange = useCallback(
    (side: "top" | "right" | "bottom" | "left", value: number) => {
      if (!hasSelection) return;

      const nodeId = selection.focusedNodeId || selection.selectedNodeIds[0];
      const propertyKey = `padding${
        side.charAt(0).toUpperCase() + side.slice(1)
      }`;

      onPropertyChange({
        nodeId,
        propertyKey,
        oldValue: getPropertyValue(propertyKey),
        newValue: value,
        sectionId: "layout",
      });
    },
    [hasSelection, selection, onPropertyChange, getPropertyValue]
  );

  const handleGapChange = useCallback(
    (gapType: "gap" | "gapX" | "gapY", value: number) => {
      if (!hasSelection) return;

      const nodeId = selection.focusedNodeId || selection.selectedNodeIds[0];

      onPropertyChange({
        nodeId,
        propertyKey: gapType,
        oldValue: getPropertyValue(gapType),
        newValue: value,
        sectionId: "layout",
      });
    },
    [hasSelection, selection, onPropertyChange, getPropertyValue]
  );

  const layoutTypeButtons = [
    {
      id: "none",
      icon: Square,
      label: "None",
      active: layoutType === "none",
    },
    {
      id: "flex",
      icon: AlignHorizontalJustifyCenter,
      label: "Flex",
      active: layoutType === "flex",
    },
    {
      id: "grid",
      icon: Grid3X3,
      label: "Grid",
      active: layoutType === "grid",
    },
  ];

  return (
    <div className="border-b border-border">
      {/* Layout Type Selector */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          {layoutTypeButtons.map((button) => {
            const IconComponent = button.icon;
            return (
              <Button
                key={button.id}
                variant="ghost"
                size="sm"
                onClick={() => handleLayoutTypeChange(button.id as LayoutType)}
                disabled={!hasSelection}
                className={cn(
                  "h-8 w-8 p-0",
                  button.active
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "hover:bg-muted"
                )}
                title={button.label}
              >
                <IconComponent className="h-4 w-4" />
              </Button>
            );
          })}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Dimensions and Sizing */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-4">W</span>
            <GhostInput
              value={width}
              onChange={(value) => handleDimensionChange("width", value)}
              disabled={!hasSelection}
            />
            <select
              value={widthSizing}
              onChange={(e) =>
                handleSizingChange("width", e.target.value as SizingType)
              }
              disabled={!hasSelection}
              className="h-6 px-2 text-xs bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="fixed">Fixed</option>
              <option value="fill">Fill</option>
              <option value="hug">Hug</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-4">H</span>
            <GhostInput
              value={height}
              onChange={(value) => handleDimensionChange("height", value)}
              disabled={!hasSelection}
            />
            <select
              value={heightSizing}
              onChange={(e) =>
                handleSizingChange("height", e.target.value as SizingType)
              }
              disabled={!hasSelection}
              className="h-6 px-2 text-xs bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="fixed">Fixed</option>
              <option value="fill">Fill</option>
              <option value="hug">Hug</option>
            </select>
          </div>
        </div>

        {/* Layout Controls (only show for flex/grid) */}
        {(layoutType === "flex" || layoutType === "grid") && (
          <div className="p-2 bg-muted/30 rounded border">
            <div className="flex items-center justify-center mb-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-muted-foreground/40" />
                <Plus className="h-3 w-3 text-muted-foreground" />
                <div className="w-2 h-2 bg-muted-foreground/40" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Align Items
                </span>
                <select
                  disabled={!hasSelection}
                  className="h-6 px-2 text-xs bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="auto">Auto</option>
                  <option value="start">Start</option>
                  <option value="center">Center</option>
                  <option value="end">End</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Justify Content
                </span>
                <select
                  disabled={!hasSelection}
                  className="h-6 px-2 text-xs bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="auto">Auto</option>
                  <option value="start">Start</option>
                  <option value="center">Center</option>
                  <option value="end">End</option>
                  <option value="space-between">Space Between</option>
                  <option value="space-around">Space Around</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Box Model / Padding Visualization */}
        <div
          className="relative mx-auto max-w-full overflow-hidden"
          style={{ width: 200, height: 120 }}
        >
          {/* Margin area (outermost) */}
          <div
            className="absolute border-2 border-dashed border-muted-foreground/20 rounded bg-muted/5"
            style={{
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          >
            {/* Padding area (middle) */}
            <div
              className="absolute border-2 border-muted-foreground/40 rounded bg-muted/10"
              style={{
                top: paddingTop,
                left: paddingLeft,
                right: paddingRight,
                bottom: paddingBottom,
              }}
            >
              {/* Content area (innermost) */}
              <div className="absolute inset-0 border-2 border-dashed border-primary/60 rounded bg-primary/5 flex items-center justify-center">
                <Plus className="h-4 w-4 text-primary" />
              </div>
            </div>
          </div>

          {/* Padding ghost inputs */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full">
            <GhostInput
              value={paddingTop}
              onChange={(value) => handlePaddingChange("top", value)}
              disabled={!hasSelection}
              className="text-xs"
            />
          </div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
            <GhostInput
              value={paddingBottom}
              onChange={(value) => handlePaddingChange("bottom", value)}
              disabled={!hasSelection}
              className="text-xs"
            />
          </div>
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-full">
            <GhostInput
              value={paddingLeft}
              onChange={(value) => handlePaddingChange("left", value)}
              disabled={!hasSelection}
              className="text-xs"
            />
          </div>
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-full">
            <GhostInput
              value={paddingRight}
              onChange={(value) => handlePaddingChange("right", value)}
              disabled={!hasSelection}
              className="text-xs"
            />
          </div>
        </div>

        {/* Gap Controls (only for flex/grid) */}
        {(layoutType === "flex" || layoutType === "grid") && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Gap</span>
              <GhostInput
                value={gap}
                onChange={(value) => handleGapChange("gap", value)}
                disabled={!hasSelection}
              />
            </div>

            {(gapX > 0 || gapY > 0) && (
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">X</span>
                  <GhostInput
                    value={gapX}
                    onChange={(value) => handleGapChange("gapX", value)}
                    disabled={!hasSelection}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Y</span>
                  <GhostInput
                    value={gapY}
                    onChange={(value) => handleGapChange("gapY", value)}
                    disabled={!hasSelection}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Selection Info */}
        {hasSelection && (
          <div className="text-xs text-muted-foreground pt-2 border-t border-border">
            {layoutType === "none"
              ? "No layout (absolute positioning)"
              : `${
                  layoutType.charAt(0).toUpperCase() + layoutType.slice(1)
                } layout enabled`}
          </div>
        )}
      </div>
    </div>
  );
};
