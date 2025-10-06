"use client";

import { Label } from "@paths-design/design-system";
import type React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/ui/primitives/Input";

interface PositionSectionProps {
  x: number;
  y: number;
  onXChange: (value: number) => void;
  onYChange: (value: number) => void;
  className?: string;
}

export function PositionSection({
  x,
  y,
  onXChange,
  onYChange,
  className,
}: PositionSectionProps) {
  // Provide safe defaults for NaN values
  const safeX = isNaN(x) ? 0 : x;
  const safeY = isNaN(y) ? 0 : y;
  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">X</Label>
          <Input
            type="number"
            value={safeX}
            onChange={(e) => onXChange(Number(e.target.value))}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Y</Label>
          <Input
            type="number"
            value={safeY}
            onChange={(e) => onYChange(Number(e.target.value))}
            className="h-8 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
