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

  // Safely find the selected object with additional error handling
  const selectedObject = (() => {
    if (!selectedId || !objects || !Array.isArray(objects)) {
      return null;
    }

    try {
      return objects.find((obj) => {
        if (!obj || typeof obj !== "object") {
          return false;
        }
        return obj.id === selectedId;
      });
    } catch (error) {
      console.warn("Error finding selected object:", error);
      return null;
    }
  })();

  // Get component information if it's a component
  const componentInfo = (() => {
    if (
      !selectedObject ||
      selectedObject.type !== "component" ||
      !selectedObject.componentType
    ) {
      return null;
    }

    try {
      const components = getAllIngestedComponents();
      if (!components || typeof components.get !== "function") {
        return null;
      }
      return components.get(selectedObject.componentType.toLowerCase());
    } catch (error) {
      console.warn("Error getting component info:", error);
      return null;
    }
  })();

  const getSourceIcon = () => {
    if (!componentInfo || typeof componentInfo !== "object") return null;

    if (componentInfo.source === "design-system") {
      return <Code className="h-3 w-3" />;
    }
    if (componentInfo.source !== "design-system") {
      return <Package className="h-3 w-3" />;
    }
    return <Zap className="h-3 w-3" />;
  };

  const getSourceLabel = () => {
    if (!componentInfo || typeof componentInfo !== "object")
      return selectedObjectType || "Canvas";

    if (componentInfo.source === "design-system") {
      return "Design System";
    }
    if (componentInfo.source !== "design-system") {
      return componentInfo.source || "Unknown";
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
          {componentInfo?.version &&
            typeof componentInfo.version === "string" && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                v{componentInfo.version}
              </Badge>
            )}
        </div>
      </div>
    </div>
  );
}
