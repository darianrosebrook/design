/**
 * @fileoverview Typography section component for text styling properties
 * @author @darianrosebrook
 */

"use client";

import React, { useCallback, useState } from "react";
import {
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ArrowUpDown,
  Grid3X3,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import { Button } from "@/ui/primitives/Button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/ui/primitives/Popover";
import { TypographyPopover } from "./TypographyPopover";
import { cn } from "@/lib/utils";
import type { PropertyChangeEvent } from "@paths-design/properties-panel";

interface TypographySectionProps {
  selection: {
    selectedNodeIds: string[];
    focusedNodeId: string | null;
  };
  onPropertyChange: (event: PropertyChangeEvent) => void;
  getPropertyValue: (propertyKey: string) => any;
}

interface GhostInputProps {
  value: string | number;
  onChange: (value: string | number) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
  type?: "text" | "number";
}

/**
 * Ghost input component for inline editing of typography values
 */
const GhostInput: React.FC<GhostInputProps> = ({
  value,
  onChange,
  label,
  className,
  disabled = false,
  type = "text",
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
    if (type === "number") {
      const numValue = parseFloat(tempValue);
      if (!isNaN(numValue) && numValue >= 0) {
        onChange(numValue);
      } else {
        setTempValue(value.toString());
      }
    } else {
      onChange(tempValue);
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
          type={type}
          value={tempValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-16 h-6 px-1 text-xs text-center bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          autoFocus
        />
      ) : (
        <button
          onClick={handleClick}
          disabled={disabled}
          className={cn(
            "w-16 h-6 text-xs text-foreground hover:bg-muted/50 rounded transition-colors",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {value}
        </button>
      )}
    </div>
  );
};

export const TypographySection: React.FC<TypographySectionProps> = ({
  selection,
  onPropertyChange,
  getPropertyValue,
}) => {
  const hasSelection = selection.selectedNodeIds.length > 0;

  // Get typography values from selected text object
  const fontFamily = getPropertyValue("fontFamily") || "Inter";
  const fontWeight = getPropertyValue("fontWeight") || "Regular";
  const fontSize = getPropertyValue("fontSize") || 12;
  const lineHeight = getPropertyValue("lineHeight") || "Auto";
  const letterSpacing = getPropertyValue("letterSpacing") || 0;
  const textAlign = getPropertyValue("textAlign") || "left";
  const verticalAlign = getPropertyValue("verticalAlign") || "top";

  const handleFontFamilyChange = useCallback(
    (value: string) => {
      if (!hasSelection) return;

      const nodeId = selection.focusedNodeId || selection.selectedNodeIds[0];

      onPropertyChange({
        nodeId,
        propertyKey: "fontFamily",
        oldValue: getPropertyValue("fontFamily"),
        newValue: value,
        sectionId: "typography",
      });
    },
    [hasSelection, selection, onPropertyChange, getPropertyValue]
  );

  const handleFontWeightChange = useCallback(
    (value: string) => {
      if (!hasSelection) return;

      const nodeId = selection.focusedNodeId || selection.selectedNodeIds[0];

      onPropertyChange({
        nodeId,
        propertyKey: "fontWeight",
        oldValue: getPropertyValue("fontWeight"),
        newValue: value,
        sectionId: "typography",
      });
    },
    [hasSelection, selection, onPropertyChange, getPropertyValue]
  );

  const handleFontSizeChange = useCallback(
    (value: number) => {
      if (!hasSelection) return;

      const nodeId = selection.focusedNodeId || selection.selectedNodeIds[0];

      onPropertyChange({
        nodeId,
        propertyKey: "fontSize",
        oldValue: getPropertyValue("fontSize"),
        newValue: value,
        sectionId: "typography",
      });
    },
    [hasSelection, selection, onPropertyChange, getPropertyValue]
  );

  const handleLineHeightChange = useCallback(
    (value: string) => {
      if (!hasSelection) return;

      const nodeId = selection.focusedNodeId || selection.selectedNodeIds[0];

      onPropertyChange({
        nodeId,
        propertyKey: "lineHeight",
        oldValue: getPropertyValue("lineHeight"),
        newValue: value,
        sectionId: "typography",
      });
    },
    [hasSelection, selection, onPropertyChange, getPropertyValue]
  );

  const handleLetterSpacingChange = useCallback(
    (value: number) => {
      if (!hasSelection) return;

      const nodeId = selection.focusedNodeId || selection.selectedNodeIds[0];

      onPropertyChange({
        nodeId,
        propertyKey: "letterSpacing",
        oldValue: getPropertyValue("letterSpacing"),
        newValue: value,
        sectionId: "typography",
      });
    },
    [hasSelection, selection, onPropertyChange, getPropertyValue]
  );

  const handleTextAlignChange = useCallback(
    (align: string) => {
      if (!hasSelection) return;

      const nodeId = selection.focusedNodeId || selection.selectedNodeIds[0];

      onPropertyChange({
        nodeId,
        propertyKey: "textAlign",
        oldValue: getPropertyValue("textAlign"),
        newValue: align,
        sectionId: "typography",
      });
    },
    [hasSelection, selection, onPropertyChange, getPropertyValue]
  );

  const handleVerticalAlignChange = useCallback(
    (align: string) => {
      if (!hasSelection) return;

      const nodeId = selection.focusedNodeId || selection.selectedNodeIds[0];

      onPropertyChange({
        nodeId,
        propertyKey: "verticalAlign",
        oldValue: getPropertyValue("verticalAlign"),
        newValue: align,
        sectionId: "typography",
      });
    },
    [hasSelection, selection, onPropertyChange, getPropertyValue]
  );

  const fontFamilyOptions = [
    "Inter",
    "Helvetica",
    "Arial",
    "Times New Roman",
    "Georgia",
    "Roboto",
    "Open Sans",
    "Lato",
  ];

  const fontWeightOptions = [
    "Thin",
    "Light",
    "Regular",
    "Medium",
    "SemiBold",
    "Bold",
    "ExtraBold",
    "Black",
  ];

  const lineHeightOptions = ["Auto", "1", "1.2", "1.5", "1.8", "2"];

  const textAlignButtons = [
    {
      id: "left",
      icon: AlignLeft,
      label: "Align Left",
      active: textAlign === "left",
    },
    {
      id: "center",
      icon: AlignCenter,
      label: "Align Center",
      active: textAlign === "center",
    },
    {
      id: "right",
      icon: AlignRight,
      label: "Align Right",
      active: textAlign === "right",
    },
    {
      id: "justify",
      icon: AlignJustify,
      label: "Justify",
      active: textAlign === "justify",
    },
  ];

  const verticalAlignButtons = [
    {
      id: "top",
      icon: ArrowUp,
      label: "Align Top",
      active: verticalAlign === "top",
    },
    {
      id: "middle",
      icon: Minus,
      label: "Align Middle",
      active: verticalAlign === "middle",
    },
    {
      id: "bottom",
      icon: ArrowDown,
      label: "Align Bottom",
      active: verticalAlign === "bottom",
    },
  ];

  return (
    <div className="border-b border-border">
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-medium text-foreground uppercase tracking-wide">
            Typography
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 ml-auto hover:bg-muted"
            title="Grid view"
          >
            <Grid3X3 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Font Family */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-8">Font</span>
          <select
            value={fontFamily}
            onChange={(e) => handleFontFamilyChange(e.target.value)}
            disabled={!hasSelection}
            className="flex-1 h-6 px-2 text-xs bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {fontFamilyOptions.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </div>

        {/* Font Weight */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-8">Weight</span>
          <select
            value={fontWeight}
            onChange={(e) => handleFontWeightChange(e.target.value)}
            disabled={!hasSelection}
            className="flex-1 h-6 px-2 text-xs bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {fontWeightOptions.map((weight) => (
              <option key={weight} value={weight}>
                {weight}
              </option>
            ))}
          </select>
        </div>

        {/* Font Size */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-8">Size</span>
          <GhostInput
            value={fontSize}
            onChange={handleFontSizeChange}
            disabled={!hasSelection}
            type="number"
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-muted"
            title="More size options"
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </div>

        {/* Line Height */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-8">Height</span>
          <Button
            onClick={() => handleLineHeightChange("Auto")}
            disabled={!hasSelection}
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs hover:bg-muted"
          >
            A Auto
          </Button>
        </div>

        {/* Letter Spacing */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-8">Spacing</span>
          <GhostInput
            value={letterSpacing}
            onChange={handleLetterSpacingChange}
            disabled={!hasSelection}
            type="number"
            label="|A|"
          />
        </div>

        {/* Text Alignment */}
        <div className="flex items-center gap-1">
          {textAlignButtons.map((button) => {
            const IconComponent = button.icon;
            return (
              <Button
                key={button.id}
                variant="ghost"
                size="sm"
                onClick={() => handleTextAlignChange(button.id)}
                disabled={!hasSelection}
                className={cn(
                  "h-6 w-6 p-0",
                  button.active
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "hover:bg-muted"
                )}
                title={button.label}
              >
                <IconComponent className="h-3 w-3" />
              </Button>
            );
          })}
        </div>

        {/* Vertical Alignment */}
        <div className="flex items-center gap-1">
          {verticalAlignButtons.map((button) => {
            const IconComponent = button.icon;
            return (
              <Button
                key={button.id}
                variant="ghost"
                size="sm"
                onClick={() => handleVerticalAlignChange(button.id)}
                disabled={!hasSelection}
                className={cn(
                  "h-6 w-6 p-0",
                  button.active
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "hover:bg-muted"
                )}
                title={button.label}
              >
                <IconComponent className="h-3 w-3" />
              </Button>
            );
          })}
        </div>

        {/* Text Direction */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            disabled={!hasSelection}
            className="h-6 w-6 p-0 hover:bg-muted"
            title="Text direction"
          >
            <ArrowUpDown className="h-3 w-3" />
          </Button>
        </div>

        {/* Advanced Typography Popover */}
        <div className="pt-2 border-t border-border">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={!hasSelection}
                className="w-full h-6 text-xs justify-start hover:bg-muted"
              >
                <Type className="h-3 w-3 mr-2" />
                Advanced Typography
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 max-w-sm p-0" align="start">
              <TypographyPopover
                selection={selection}
                onPropertyChange={onPropertyChange}
                getPropertyValue={getPropertyValue}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Selection Info */}
        {hasSelection && (
          <div className="text-xs text-muted-foreground pt-2 border-t border-border">
            Text object selected
          </div>
        )}
      </div>
    </div>
  );
};
