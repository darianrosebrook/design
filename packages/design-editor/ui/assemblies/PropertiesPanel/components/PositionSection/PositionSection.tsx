/**
 * @fileoverview Position section component for the properties panel
 * @author @darianrosebrook
 */

"use client";

import React, { useState, useCallback } from "react";
import { RotateCcw, Link as LinkIcon } from "lucide-react";
import { Button } from "@/ui/primitives/Button";
import { cn } from "@/lib/utils";
import type { PropertyChangeEvent } from "@paths-design/properties-panel";

interface PositionSectionProps {
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
  label: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Ghost input component for inline editing of position values
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
    if (!isNaN(numValue)) {
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
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-xs text-muted-foreground w-4">{label}</span>
      {isEditing ? (
        <input
          type="number"
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
          {Math.round(value)}
        </button>
      )}
    </div>
  );
};

export const PositionSection: React.FC<PositionSectionProps> = ({
  selection,
  onPropertyChange,
  getPropertyValue,
}) => {
  const hasSelection = selection.selectedNodeIds.length > 0;

  // Get position values from selected node
  const x = getPropertyValue("x") || getPropertyValue("frame.x") || 480;
  const y = getPropertyValue("y") || getPropertyValue("frame.y") || 1624;
  const rotation = getPropertyValue("rotation") || 0;

  const handlePositionChange = useCallback(
    (axis: "x" | "y", value: number) => {
      if (!hasSelection) return;

      const nodeId = selection.focusedNodeId || selection.selectedNodeIds[0];

      // Update the direct property
      onPropertyChange({
        nodeId,
        propertyKey: axis,
        oldValue: getPropertyValue(axis),
        newValue: value,
        sectionId: "position",
      });
    },
    [hasSelection, selection, onPropertyChange, getPropertyValue]
  );

  const handleRotationChange = useCallback(
    (value: number) => {
      if (!hasSelection) return;

      const nodeId = selection.focusedNodeId || selection.selectedNodeIds[0];

      onPropertyChange({
        nodeId,
        propertyKey: "rotation",
        oldValue: getPropertyValue("rotation"),
        newValue: value,
        sectionId: "position",
      });
    },
    [hasSelection, selection, onPropertyChange, getPropertyValue]
  );

  const handleResetRotation = () => {
    handleRotationChange(0);
  };

  return (
    <div className="border-b border-border">
      <div className="px-3 py-2 border-b border-border">
        <h3 className="text-xs font-medium text-foreground uppercase tracking-wide">
          Position
        </h3>
      </div>

      <div className="p-3 space-y-3">
        {/* X, Y Coordinates */}
        <div className="flex items-center gap-4">
          <GhostInput
            value={x}
            onChange={(value) => handlePositionChange("x", value)}
            label="X"
            disabled={!hasSelection}
          />
          <GhostInput
            value={y}
            onChange={(value) => handlePositionChange("y", value)}
            label="Y"
            disabled={!hasSelection}
          />
        </div>

        {/* Rotation */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Rotation</span>
          <GhostInput
            value={rotation}
            onChange={handleRotationChange}
            label=""
            className="flex-1"
            disabled={!hasSelection}
          />
          <span className="text-xs text-muted-foreground">°</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetRotation}
            disabled={!hasSelection || rotation === 0}
            className="h-6 w-6 p-0 hover:bg-muted"
            title="Reset rotation"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>

        {/* Alignment Dropdowns */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">H Center</span>
          <select
            disabled={!hasSelection}
            defaultValue="center"
            className="flex-1 h-6 px-2 text-xs bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">V Top</span>
          <select
            disabled={!hasSelection}
            defaultValue="top"
            className="flex-1 h-6 px-2 text-xs bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="top">Top</option>
            <option value="middle">Middle</option>
            <option value="bottom">Bottom</option>
          </select>
        </div>

        {/* Selection Info */}
        {hasSelection && (
          <div className="text-xs text-muted-foreground pt-2 border-t border-border">
            {selection.selectedNodeIds.length === 1
              ? "Single object selected"
              : `${selection.selectedNodeIds.length} objects selected`}
          </div>
        )}
      </div>
    </div>
  );
};
