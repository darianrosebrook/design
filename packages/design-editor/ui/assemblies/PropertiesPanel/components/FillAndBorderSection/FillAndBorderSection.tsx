/**
 * @fileoverview Fill and Border section component for styling properties
 * @author @darianrosebrook
 */

"use client";

import React, { useCallback, useState } from "react";
import {
  Palette,
  Square,
  Paintbrush,
  Eye,
  EyeOff,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/ui/primitives/Button";
import { Label } from "@/ui/primitives/Label";
import { Slider } from "@/ui/primitives/Slider";
import { ColorPicker } from "@/ui/assemblies/ColorPicker";
import { cn } from "@/lib/utils";
import type { PropertyChangeEvent } from "@paths-design/properties-panel";

interface FillAndBorderSectionProps {
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
  min?: number;
  max?: number;
  step?: number;
}

/**
 * Ghost input component for inline editing of numeric values
 */
const GhostInput: React.FC<GhostInputProps> = ({
  value,
  onChange,
  label,
  className,
  disabled = false,
  min = 0,
  max = 100,
  step = 1,
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
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
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
          min={min}
          max={max}
          step={step}
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

export const FillAndBorderSection: React.FC<FillAndBorderSectionProps> = ({
  selection,
  onPropertyChange,
  getPropertyValue,
}) => {
  const hasSelection = selection.selectedNodeIds.length > 0;

  // Get color and styling values from selected object
  const fillColor =
    getPropertyValue("fill") ||
    getPropertyValue("backgroundColor") ||
    "#3b82f6";
  const borderColor =
    getPropertyValue("borderColor") || getPropertyValue("stroke") || "#e5e7eb";
  const borderWidth =
    getPropertyValue("borderWidth") || getPropertyValue("strokeWidth") || 1;
  const borderStyle = getPropertyValue("borderStyle") || "solid";
  const fillOpacity =
    getPropertyValue("fillOpacity") || getPropertyValue("opacity") || 100;
  const borderOpacity = getPropertyValue("borderOpacity") || 100;
  const hasFill = getPropertyValue("hasFill") !== false;
  const hasBorder = getPropertyValue("hasBorder") !== false;

  const handleFillColorChange = useCallback(
    (color: string) => {
      if (!hasSelection) return;

      const nodeId = selection.focusedNodeId || selection.selectedNodeIds[0];

      onPropertyChange({
        nodeId,
        propertyKey: "fill",
        oldValue: getPropertyValue("fill"),
        newValue: color,
        sectionId: "fillAndBorder",
      });
    },
    [hasSelection, selection, onPropertyChange, getPropertyValue]
  );

  const handleBorderColorChange = useCallback(
    (color: string) => {
      if (!hasSelection) return;

      const nodeId = selection.focusedNodeId || selection.selectedNodeIds[0];

      onPropertyChange({
        nodeId,
        propertyKey: "borderColor",
        oldValue: getPropertyValue("borderColor"),
        newValue: color,
        sectionId: "fillAndBorder",
      });
    },
    [hasSelection, selection, onPropertyChange, getPropertyValue]
  );

  const handleBorderWidthChange = useCallback(
    (value: number) => {
      if (!hasSelection) return;

      const nodeId = selection.focusedNodeId || selection.selectedNodeIds[0];

      onPropertyChange({
        nodeId,
        propertyKey: "borderWidth",
        oldValue: getPropertyValue("borderWidth"),
        newValue: value,
        sectionId: "fillAndBorder",
      });
    },
    [hasSelection, selection, onPropertyChange, getPropertyValue]
  );

  const handleOpacityChange = useCallback(
    (property: "fillOpacity" | "borderOpacity", value: number) => {
      if (!hasSelection) return;

      const nodeId = selection.focusedNodeId || selection.selectedNodeIds[0];

      onPropertyChange({
        nodeId,
        propertyKey: property,
        oldValue: getPropertyValue(property),
        newValue: value,
        sectionId: "fillAndBorder",
      });
    },
    [hasSelection, selection, onPropertyChange, getPropertyValue]
  );

  const handleFillToggle = useCallback(() => {
    if (!hasSelection) return;

    const nodeId = selection.focusedNodeId || selection.selectedNodeIds[0];

    onPropertyChange({
      nodeId,
      propertyKey: "hasFill",
      oldValue: getPropertyValue("hasFill"),
      newValue: !hasFill,
      sectionId: "fillAndBorder",
    });
  }, [hasSelection, selection, onPropertyChange, getPropertyValue, hasFill]);

  const handleBorderToggle = useCallback(() => {
    if (!hasSelection) return;

    const nodeId = selection.focusedNodeId || selection.selectedNodeIds[0];

    onPropertyChange({
      nodeId,
      propertyKey: "hasBorder",
      oldValue: getPropertyValue("hasBorder"),
      newValue: !hasBorder,
      sectionId: "fillAndBorder",
    });
  }, [hasSelection, selection, onPropertyChange, getPropertyValue, hasBorder]);

  const handleBorderStyleChange = useCallback(
    (style: string) => {
      if (!hasSelection) return;

      const nodeId = selection.focusedNodeId || selection.selectedNodeIds[0];

      onPropertyChange({
        nodeId,
        propertyKey: "borderStyle",
        oldValue: getPropertyValue("borderStyle"),
        newValue: style,
        sectionId: "fillAndBorder",
      });
    },
    [hasSelection, selection, onPropertyChange, getPropertyValue]
  );

  const borderStyleOptions = [
    { value: "solid", label: "Solid" },
    { value: "dashed", label: "Dashed" },
    { value: "dotted", label: "Dotted" },
    { value: "none", label: "None" },
  ];

  return (
    <div className="border-b border-border">
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-medium text-foreground uppercase tracking-wide">
            Fill & Border
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 ml-auto hover:bg-muted"
            title="More fill options"
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Fill Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFillToggle}
                disabled={!hasSelection}
                className={cn(
                  "h-6 w-6 p-0",
                  hasFill
                    ? "text-foreground hover:bg-muted"
                    : "text-muted-foreground hover:bg-muted"
                )}
                title={hasFill ? "Hide fill" : "Show fill"}
              >
                {hasFill ? (
                  <Eye className="h-3 w-3" />
                ) : (
                  <EyeOff className="h-3 w-3" />
                )}
              </Button>
              <span className="text-xs text-muted-foreground">Fill</span>
            </div>
          </div>

          {hasFill && (
            <div className="space-y-2">
              <ColorPicker
                color={fillColor}
                onChange={handleFillColorChange}
                label="Fill Color"
              />

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Opacity</span>
                <div className="flex-1">
                  <Slider
                    value={[fillOpacity]}
                    onValueChange={(value) =>
                      handleOpacityChange("fillOpacity", value[0])
                    }
                    max={100}
                    min={0}
                    step={1}
                    className="w-full"
                    disabled={!hasSelection}
                  />
                </div>
                <GhostInput
                  value={fillOpacity}
                  onChange={(value) =>
                    handleOpacityChange("fillOpacity", value)
                  }
                  disabled={!hasSelection}
                  min={0}
                  max={100}
                />
              </div>
            </div>
          )}
        </div>

        {/* Border Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBorderToggle}
                disabled={!hasSelection}
                className={cn(
                  "h-6 w-6 p-0",
                  hasBorder
                    ? "text-foreground hover:bg-muted"
                    : "text-muted-foreground hover:bg-muted"
                )}
                title={hasBorder ? "Hide border" : "Show border"}
              >
                {hasBorder ? (
                  <Eye className="h-3 w-3" />
                ) : (
                  <EyeOff className="h-3 w-3" />
                )}
              </Button>
              <span className="text-xs text-muted-foreground">Border</span>
            </div>
          </div>

          {hasBorder && (
            <div className="space-y-2">
              <ColorPicker
                color={borderColor}
                onChange={handleBorderColorChange}
                label="Border Color"
              />

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Width</span>
                <GhostInput
                  value={borderWidth}
                  onChange={handleBorderWidthChange}
                  disabled={!hasSelection}
                  min={0}
                  max={50}
                  step={0.5}
                />
                <select
                  value={borderStyle}
                  onChange={(e) => handleBorderStyleChange(e.target.value)}
                  disabled={!hasSelection}
                  className="flex-1 h-6 px-2 text-xs bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {borderStyleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Opacity</span>
                <div className="flex-1">
                  <Slider
                    value={[borderOpacity]}
                    onValueChange={(value) =>
                      handleOpacityChange("borderOpacity", value[0])
                    }
                    max={100}
                    min={0}
                    step={1}
                    className="w-full"
                    disabled={!hasSelection}
                  />
                </div>
                <GhostInput
                  value={borderOpacity}
                  onChange={(value) =>
                    handleOpacityChange("borderOpacity", value)
                  }
                  disabled={!hasSelection}
                  min={0}
                  max={100}
                />
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              handleFillColorChange("#00000000");
              handleFillToggle();
            }}
            disabled={!hasSelection}
            className="h-6 px-2 text-xs hover:bg-muted"
          >
            No Fill
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              handleBorderWidthChange(0);
              handleBorderToggle();
            }}
            disabled={!hasSelection}
            className="h-6 px-2 text-xs hover:bg-muted"
          >
            No Border
          </Button>
        </div>

        {/* Selection Info */}
        {hasSelection && (
          <div className="text-xs text-muted-foreground pt-2 border-t border-border">
            {hasFill && hasBorder
              ? "Fill and border enabled"
              : hasFill
              ? "Fill only"
              : hasBorder
              ? "Border only"
              : "No fill or border"}
          </div>
        )}
      </div>
    </div>
  );
};
