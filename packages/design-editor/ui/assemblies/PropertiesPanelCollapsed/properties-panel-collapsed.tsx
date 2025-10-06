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
    <div className="// flex items-center gap-3 px-3 py-2">
      {/* Properties Icon */}
      <Settings className="// h-4 w-4 text-muted-foreground shrink-0" />

      {/* Selection Info */}
      <div className="// flex items-center gap-3 min-w-0 flex-1">
        {hasSelection && selectedObjectType ? (
          <>
            {/* Object Type Icon */}
            {(() => {
              const Icon = typeIcons[selectedObjectType];
              return (
                <Icon className="// h-4 w-4 text-muted-foreground shrink-0" />
              );
            })()}

            {/* Object Name */}
            <span className="// text-xs font-medium text-foreground truncate">
              {selectedObjectName || selectedObjectType}
            </span>

            {/* Type Label */}
            <span className="// text-xs text-muted-foreground capitalize shrink-0">
              {selectedObjectType}
            </span>
          </>
        ) : (
          <>
            {/* No Selection */}
            <div className="w-4 h-4 rounded-full bg-muted shrink-0" />
            <span className="text-xs text-muted-foreground">Canvas</span>
          </>
        )}
      </div>
    </div>
  );
}
