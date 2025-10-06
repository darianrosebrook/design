"use client";

import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyEnd,
  AlignHorizontalJustifyCenter,
} from "lucide-react";
import type React from "react";
// Removed SCSS module import - using Tailwind classes
import { cn } from "@/lib/utils";
import { Button } from "@/ui/primitives/Button";

interface AlignmentGridProps {
  onAlign: (alignment: string) => void;
  currentAlignment?: {
    horizontal?: "left" | "center" | "right";
    vertical?: "top" | "middle" | "bottom";
  };
}

export function AlignmentGrid({
  onAlign,
  currentAlignment,
}: AlignmentGridProps) {
  const horizontalAlignments = [
    { key: "left", icon: AlignLeft, label: "Align Left" },
    { key: "center", icon: AlignCenter, label: "Align Center" },
    { key: "right", icon: AlignRight, label: "Align Right" },
  ];

  const verticalAlignments = [
    { key: "top", icon: AlignVerticalJustifyStart, label: "Align Top" },
    { key: "middle", icon: AlignVerticalJustifyCenter, label: "Align Middle" },
    { key: "bottom", icon: AlignVerticalJustifyEnd, label: "Align Bottom" },
  ];

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">Alignment</div>

      {/* Horizontal Alignment */}
      <div className="flex gap-1">
        {horizontalAlignments.map(({ key, icon: Icon, label }) => (
          <Button
            key={key}
            variant={
              currentAlignment?.horizontal === key ? "default" : "outline"
            }
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onAlign(`horizontal-${key}`)}
            title={label}
          >
            <Icon className="h-4 w-4" />
          </Button>
        ))}
      </div>

      {/* Vertical Alignment */}
      <div className="flex gap-1">
        {verticalAlignments.map(({ key, icon: Icon, label }) => (
          <Button
            key={key}
            variant={currentAlignment?.vertical === key ? "default" : "outline"}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onAlign(`vertical-${key}`)}
            title={label}
          >
            <Icon className="h-4 w-4" />
          </Button>
        ))}
      </div>

      {/* Distribution */}
      <div className="space-y-3">
        <div className="text-sm font-medium">Distribution</div>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onAlign("distribute-horizontal")}
            title="Distribute Horizontally"
          >
            <AlignHorizontalJustifyCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onAlign("distribute-vertical")}
            title="Distribute Vertically"
          >
            <AlignVerticalJustifyCenter className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
