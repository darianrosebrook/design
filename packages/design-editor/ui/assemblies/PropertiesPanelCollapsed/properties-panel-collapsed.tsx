"use client";

import {
  Square,
  Circle,
  Type,
  ImageIcon,
  LayersIcon,
  Frame,
  Settings,
  Component,
} from "lucide-react";
import type React from "react";
// Removed SCSS module import - using Tailwind classes
import type { ObjectType } from "@/lib/types";

const typeIcons: Record<ObjectType, any> = {
  rectangle: Square,
  circle: Circle,
  text: Type,
  image: ImageIcon,
  group: LayersIcon,
  frame: Frame,
  component: Component,
};

interface PropertiesPanelCollapsedProps {
  selectedObjectType?: ObjectType;
  selectedObjectName?: string;
  hasSelection?: boolean;
}

export function PropertiesPanelCollapsed({
  selectedObjectType,
  selectedObjectName,
  hasSelection = false,
}: PropertiesPanelCollapsedProps) {
  return (
    <div className="w-12 h-full flex flex-col items-center justify-center gap-2 p-2 bg-card border-l border-border">
      {/* Properties Icon */}
      <Settings className="h-5 w-5 text-muted-foreground" />

      {/* Selection Info */}
      <div className="flex flex-col items-center gap-1 flex-1">
        {hasSelection && selectedObjectType ? (
          <>
            {/* Object Type Icon */}
            {(() => {
              const Icon = typeIcons[selectedObjectType];
              return <Icon className="h-4 w-4 text-muted-foreground" />;
            })()}

            {/* Object Name */}
            <span className="text-xs font-medium text-center leading-tight">
              {selectedObjectName || selectedObjectType}
            </span>

            {/* Type Label */}
            <span className="text-xs text-muted-foreground text-center">
              {selectedObjectType}
            </span>
          </>
        ) : (
          <>
            {/* No Selection */}
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center" />
            <span className="text-xs text-muted-foreground">Canvas</span>
          </>
        )}
      </div>
    </div>
  );
}
