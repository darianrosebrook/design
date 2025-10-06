"use client";

import { Label } from "@paths-design/design-system";
import type React from "react";
import { useState } from "react";
import { Link2, Unlink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/ui/primitives/Button";
import { Input } from "@/ui/primitives/Input";

interface LayoutSectionProps {
  width: number;
  height: number;
  aspectLocked: boolean;
  onWidthChange: (value: number) => void;
  onHeightChange: (value: number) => void;
  onAspectLockToggle: () => void;
  className?: string;
}

export function LayoutSection({
  width,
  height,
  aspectLocked,
  onWidthChange,
  onHeightChange,
  onAspectLockToggle,
  className,
}: LayoutSectionProps) {
  // Provide safe defaults for NaN values
  const safeWidth =
    isNaN(width) || width === null || width === undefined ? 0 : Number(width);
  const safeHeight =
    isNaN(height) || height === null || height === undefined
      ? 0
      : Number(height);
  const aspectRatio = safeHeight > 0 ? safeWidth / safeHeight : 0;

  const handleWidthChange = (newWidth: number) => {
    onWidthChange(newWidth);
    if (aspectLocked && aspectRatio > 0) {
      const newHeight = newWidth / aspectRatio;
      onHeightChange(newHeight);
    }
  };

  const handleHeightChange = (newHeight: number) => {
    onHeightChange(newHeight);
    if (aspectLocked && aspectRatio > 0) {
      const newWidth = newHeight * aspectRatio;
      onWidthChange(newWidth);
    }
  };

  return (
    <div className={`space-y-4 ${className || ""}`}>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Width</Label>
          <Input
            type="number"
            value={isNaN(safeWidth) ? 0 : Math.round(safeWidth)}
            onChange={(e) => handleWidthChange(Number(e.target.value))}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Height</Label>
          <Input
            type="number"
            value={isNaN(safeHeight) ? 0 : Math.round(safeHeight)}
            onChange={(e) => handleHeightChange(Number(e.target.value))}
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Aspect Ratio</Label>
        <div className="flex items-center justify-between">
          <span className="text-sm font-mono">
            {isNaN(aspectRatio) ? "0.00" : aspectRatio.toFixed(2)}:1
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onAspectLockToggle}
            className="h-8 w-8 p-0"
          >
            {aspectLocked ? (
              <Link2 className="h-4 w-4" />
            ) : (
              <Unlink className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
