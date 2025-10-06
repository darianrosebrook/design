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

export function PropertiesPanel() {
  const { document, selectedId, selectedIds, updateNode } = useCanvas();

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
      const { nodeId, propertyKey, value } = event;

      try {
        await updateNode(nodeId, { [propertyKey]: value });
      } catch (error) {
        console.error("Failed to update property:", error);
      }
    },
    [updateNode]
  );

  // Handle selection changes from the PropertiesPanel
  const handleSelectionChange = useCallback((newSelection: SelectionState) => {
    // Update canvas selection based on PropertiesPanel selection
    if (newSelection.focusedNodeId && newSelection.selectedNodeIds.length > 0) {
      // Set both primary and multi-selection
      // This would need to be implemented in the canvas context
    }
  }, []);

  if (!document) {
    return (
      <div className="w-80 h-full bg-card border-l border-border flex items-center justify-center">
        <div className="text-muted-foreground text-sm">No document loaded</div>
      </div>
    );
  }

  // Show canvas background controls when no object is selected
  if (selectedIds.size === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <h2 className="text-sm font-semibold">Properties</h2>
          <span className="text-xs text-muted-foreground">Canvas</span>
        </div>
        <ScrollArea className="flex-1">
          <CanvasBackgroundControls />
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="w-80 h-full bg-card border-l border-border">
      <IntegratedPropertiesPanel
        documentId={document.id}
        selection={selection}
        onPropertyChange={handlePropertyChange}
        onSelectionChange={handleSelectionChange}
      />
    </div>
  );
}
