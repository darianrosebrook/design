"use client";

import React, { useMemo, useCallback } from "react";
import { PropertiesPanel as IntegratedPropertiesPanel } from "@paths-design/properties-panel";
import { useCanvas } from "@/lib/canvas-context";
import type { SelectionState } from "@paths-design/properties-panel";
import type { PropertyChangeEvent } from "@paths-design/properties-panel";

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
