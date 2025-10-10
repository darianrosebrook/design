"use client";

import type {
  SelectionState,
  PropertyChangeEvent,
} from "@paths-design/properties-panel";
import { PropertiesPanel as IntegratedPropertiesPanel } from "@paths-design/properties-panel";
import type React from "react";
import { useMemo, useCallback } from "react";
import { useCanvas } from "@/lib/canvas-context";
import { CanvasBackgroundControls } from "@/ui/composers/CanvasBackgroundControls";
import { ScrollArea } from "@/ui/primitives/ScrollArea";
import { CustomPropertiesPanel } from "./CustomPropertiesPanel";

export function PropertiesPanel() {
  const {
    document,
    objects,
    selectedId,
    selectedIds,
    updateNode,
    setSelectedId,
    setSelectedIds,
  } = useCanvas();

  // Convert current selection to PropertiesPanel format
  const selection: SelectionState = useMemo(
    () => ({
      selectedNodeIds: selectedIds.size > 0 ? Array.from(selectedIds) : [],
      focusedNodeId: selectedId,
    }),
    [selectedId, selectedIds]
  );

  // Handle property changes from the PropertiesPanel
  const handlePropertyChange = useCallback(
    async (event: PropertyChangeEvent) => {
      const { nodeId, propertyKey, newValue } = event;

      try {
        await updateNode(nodeId, { [propertyKey]: newValue });
      } catch (error) {
        console.error("Failed to update property:", error);
      }
    },
    [updateNode]
  );

  // Handle selection changes from the PropertiesPanel
  const handleSelectionChange = useCallback(
    (newSelection: SelectionState) => {
      // Update canvas selection based on PropertiesPanel selection
      if (newSelection.focusedNodeId) {
        // Set the primary selection
        setSelectedId(newSelection.focusedNodeId);
      }

      if (newSelection.selectedNodeIds.length > 0) {
        // Set multi-selection
        setSelectedIds(new Set(newSelection.selectedNodeIds));
      } else {
        // Clear selection if no nodes selected
        setSelectedIds(new Set());
        setSelectedId(null);
      }
    },
    [setSelectedId, setSelectedIds]
  );

  // Get actual property values from selected canvas objects
  const getPropertyValue = useCallback(
    (propertyKey: string) => {
      if (!selectedId) return undefined;

      // Find the selected object
      const selectedObject = objects.find((obj) => obj.id === selectedId);
      if (!selectedObject) return undefined;

      // Handle nested property access (e.g., "frame.x", "padding.top")
      const keys = propertyKey.split(".");
      let value = selectedObject;

      for (const key of keys) {
        if (value && typeof value === "object" && key in value) {
          value = (value as any)[key];
        } else {
          return undefined;
        }
      }

      // Map some property keys to their actual canvas object properties
      const propertyMap: Record<string, string> = {
        x: "x",
        y: "y",
        "frame.x": "x",
        "frame.y": "y",
        width: "width",
        height: "height",
        "frame.width": "width",
        "frame.height": "height",
        rotation: "rotation",
        opacity: "opacity",
        backgroundColor: "backgroundColor",
        fill: "backgroundColor",
        borderColor: "borderColor",
        borderWidth: "borderWidth",
        borderStyle: "borderStyle",
      };

      const mappedKey = propertyMap[propertyKey] || propertyKey;

      // Try to get the value from the mapped property
      if (mappedKey in selectedObject) {
        return (selectedObject as any)[mappedKey];
      }

      // Return the nested value if found
      return value;
    },
    [selectedId, objects]
  );

  return (
    <CustomPropertiesPanel
      documentId={document.id}
      selection={selection}
      onPropertyChange={handlePropertyChange}
      onSelectionChange={handleSelectionChange}
      getPropertyValue={getPropertyValue}
    />
  );
}
