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
import { Button } from "@/components/ui/button";

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
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground">Alignment</div>

      {/* Horizontal Alignment */}
      <div className="flex gap-1">
        {horizontalAlignments.map(({ key, icon: Icon, label }) => (
          <Button
            key={key}
            variant={
              currentAlignment?.horizontal === key ? "default" : "outline"
            }
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => onAlign(`horizontal-${key}`)}
            title={label}
          >
            <Icon className="h-3 w-3" />
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
            className="flex-1 h-8 text-xs"
            onClick={() => onAlign(`vertical-${key}`)}
            title={label}
          >
            <Icon className="h-3 w-3" />
          </Button>
        ))}
      </div>

      {/* Distribution */}
      <div className="pt-2 border-t border-border">
        <div className="text-xs font-medium text-muted-foreground mb-2">
          Distribution
        </div>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => onAlign("distribute-horizontal")}
            title="Distribute Horizontally"
          >
            <AlignHorizontalJustifyCenter className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => onAlign("distribute-vertical")}
            title="Distribute Vertically"
          >
            <AlignVerticalJustifyCenter className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
