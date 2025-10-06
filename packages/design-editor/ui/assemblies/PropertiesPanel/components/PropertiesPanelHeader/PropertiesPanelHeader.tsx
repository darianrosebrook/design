"use client";

import type React from "react";
import { cn } from "@/lib/utils";

interface PropertiesPanelHeaderProps {
  selectedObjectType?: string;
  className?: string;
}

export function PropertiesPanelHeader({
  selectedObjectType,
  className,
}: PropertiesPanelHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 border-b border-border",
        className
      )}
    >
      <h2 className="text-sm font-semibold">Properties</h2>
      {selectedObjectType ? (
        <span className="text-xs text-muted-foreground capitalize">
          {selectedObjectType}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">Canvas</span>
      )}
    </div>
  );
}
