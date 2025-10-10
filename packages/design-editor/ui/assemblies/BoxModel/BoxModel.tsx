/**
 * @fileoverview Box Model component for displaying and editing element dimensions and spacing
 * @author @darianrosebrook
 */

"use client";

import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface BoxModelProps {
  width: number;
  height: number;
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  onDimensionChange?: (width: number, height: number) => void;
  onPaddingChange?: (padding: BoxModelProps["padding"]) => void;
  onMarginChange?: (margin: BoxModelProps["margin"]) => void;
  className?: string;
}

interface GhostInputProps {
  value: number;
  onChange: (value: number) => void;
  position:
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right";
  className?: string;
}

/**
 * Ghost input component for inline editing of values
 */
const GhostInput: React.FC<GhostInputProps> = ({
  value,
  onChange,
  position,
  className,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value.toString());

  const handleClick = () => {
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

  const getPositionClasses = () => {
    switch (position) {
      case "top":
        return "top-0 left-1/2 transform -translate-x-1/2 -translate-y-full";
      case "bottom":
        return "bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full";
      case "left":
        return "left-0 top-1/2 transform -translate-y-1/2 -translate-x-full";
      case "right":
        return "right-0 top-1/2 transform translate-y-1/2 translate-x-full";
      case "top-left":
        return "top-0 left-0 transform -translate-x-full -translate-y-full";
      case "top-right":
        return "top-0 right-0 transform translate-x-full -translate-y-full";
      case "bottom-left":
        return "bottom-0 left-0 transform -translate-x-full translate-y-full";
      case "bottom-right":
        return "bottom-0 right-0 transform translate-x-full translate-y-full";
      default:
        return "";
    }
  };

  return (
    <div className={cn("absolute", getPositionClasses(), className)}>
      <div className="flex items-center gap-1">
        {/* Dash indicator */}
        <div className="w-4 h-px bg-muted-foreground/40" />

        {/* Input field */}
        {isEditing ? (
          <input
            type="number"
            value={tempValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-8 h-5 px-1 text-xs text-center bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            autoFocus
          />
        ) : (
          <button
            onClick={handleClick}
            className="w-8 h-5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded transition-colors cursor-pointer"
          >
            {value}
          </button>
        )}

        {/* Dash indicator */}
        <div className="w-4 h-px bg-muted-foreground/40" />
      </div>
    </div>
  );
};

/**
 * Box Model component showing element dimensions and spacing
 */
export const BoxModel: React.FC<BoxModelProps> = ({
  width,
  height,
  padding,
  margin,
  onDimensionChange,
  onPaddingChange,
  onMarginChange,
  className,
}) => {
  // Calculate aspect ratio
  const aspectRatio =
    width > 0 && height > 0 ? (width / height).toFixed(2) : "1.00";

  const handlePaddingChange = useCallback(
    (side: keyof typeof padding, value: number) => {
      const newPadding = { ...padding, [side]: value };
      onPaddingChange?.(newPadding);
    },
    [padding, onPaddingChange]
  );

  const handleMarginChange = useCallback(
    (side: keyof typeof margin, value: number) => {
      const newMargin = { ...margin, [side]: value };
      onMarginChange?.(newMargin);
    },
    [margin, onMarginChange]
  );

  const handleDimensionChange = useCallback(
    (dimension: "width" | "height", value: number) => {
      if (dimension === "width") {
        onDimensionChange?.(value, height);
      } else {
        onDimensionChange?.(width, value);
      }
    },
    [width, height, onDimensionChange]
  );

  return (
    <div
      className={cn("p-6 bg-card border border-border rounded-lg", className)}
    >
      {/* Title */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground mb-1">
          Box Model
        </h3>
        <p className="text-xs text-muted-foreground">
          Aspect ratio: {aspectRatio}
        </p>
      </div>

      {/* Box Model Visualization */}
      <div className="relative mx-auto" style={{ width: 400, height: 300 }}>
        {/* Margin area (outermost) */}
        <div
          className="absolute border-2 border-dashed border-muted-foreground/20 rounded-lg bg-muted/5"
          style={{
            top: margin.top,
            left: margin.left,
            right: margin.right,
            bottom: margin.bottom,
          }}
        >
          {/* Padding area (middle) */}
          <div
            className="absolute border-2 border-muted-foreground/40 rounded bg-muted/10"
            style={{
              top: padding.top,
              left: padding.left,
              right: padding.right,
              bottom: padding.bottom,
            }}
          >
            {/* Content area (innermost) */}
            <div
              className="absolute border-2 border-dashed border-primary/60 rounded bg-primary/5 flex items-center justify-center"
              style={{
                width: width,
                height: height,
              }}
            >
              <div className="text-center">
                <div className="text-xs text-primary font-medium">
                  {width} × {height}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Margin ghost inputs */}
        <GhostInput
          value={margin.top}
          onChange={(value) => handleMarginChange("top", value)}
          position="top"
          className="text-pink-500"
        />
        <GhostInput
          value={margin.bottom}
          onChange={(value) => handleMarginChange("bottom", value)}
          position="bottom"
          className="text-pink-500"
        />
        <GhostInput
          value={margin.left}
          onChange={(value) => handleMarginChange("left", value)}
          position="left"
          className="text-blue-500"
        />
        <GhostInput
          value={margin.right}
          onChange={(value) => handleMarginChange("right", value)}
          position="right"
          className="text-blue-500"
        />

        {/* Padding ghost inputs */}
        <GhostInput
          value={padding.top}
          onChange={(value) => handlePaddingChange("top", value)}
          position="top-left"
        />
        <GhostInput
          value={padding.right}
          onChange={(value) => handlePaddingChange("right", value)}
          position="top-right"
        />
        <GhostInput
          value={padding.bottom}
          onChange={(value) => handlePaddingChange("bottom", value)}
          position="bottom-right"
        />
        <GhostInput
          value={padding.left}
          onChange={(value) => handlePaddingChange("left", value)}
          position="bottom-left"
        />

        {/* Dimension inputs */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDimensionChange("width", width)}
              className="px-2 py-1 text-xs bg-background border border-border rounded text-foreground hover:bg-muted/50 transition-colors"
            >
              {width}
            </button>
            <span className="text-xs text-muted-foreground">×</span>
            <button
              onClick={() => handleDimensionChange("height", height)}
              className="px-2 py-1 text-xs bg-background border border-border rounded text-foreground hover:bg-muted/50 transition-colors"
            >
              {height}
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
        <div>
          <div className="text-muted-foreground mb-1">Total Size</div>
          <div className="text-foreground font-medium">
            {width + padding.left + padding.right + margin.left + margin.right}{" "}
            ×{" "}
            {height + padding.top + padding.bottom + margin.top + margin.bottom}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground mb-1">Content Size</div>
          <div className="text-foreground font-medium">
            {width} × {height}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoxModel;
