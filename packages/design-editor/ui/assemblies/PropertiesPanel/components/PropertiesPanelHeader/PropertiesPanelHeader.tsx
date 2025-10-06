"use client";

import type React from "react";
import { useCanvas } from "@/lib/canvas-context";
import { getAllIngestedComponents } from "@/lib/utils/dynamic-component-registry";
import { Badge } from "@/ui/primitives/Badge";
import { Package, Code, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function PropertiesPanelHeader({
  selectedObjectType,
  className,
}: PropertiesPanelHeaderProps) {
  const { selectedId, objects } = useCanvas();
  const selectedObject = selectedId
    ? objects.find((obj) => obj.id === selectedId)
    : null;

  // Get component information if it's a component
  const componentInfo =
    selectedObject?.type === "component" && selectedObject.componentType
      ? getAllIngestedComponents().get(
          selectedObject.componentType.toLowerCase()
        )
      : null;

  const getSourceIcon = () => {
    if (!componentInfo) return null;

    if (componentInfo.source === "design-system") {
      return <Code className="h-3 w-3" />;
    }
    if (componentInfo.source !== "design-system") {
      return <Package className="h-3 w-3" />;
    }
    return <Zap className="h-3 w-3" />;
  };

  const getSourceLabel = () => {
    if (!componentInfo) return selectedObjectType || "Canvas";

    if (componentInfo.source === "design-system") {
      return "Design System";
    }
    if (componentInfo.source !== "design-system") {
      return componentInfo.source;
    }
    return "Custom";
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 border-b border-border",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold">Properties</h2>
        {selectedObject?.name && (
          <span className="text-xs text-muted-foreground truncate max-w-[120px]">
            {selectedObject.name}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {componentInfo && getSourceIcon()}
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground capitalize">
            {getSourceLabel()}
          </span>
          {componentInfo?.version && (
            <Badge variant="outline" className="text-xs px-1 py-0">
              v{componentInfo.version}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
