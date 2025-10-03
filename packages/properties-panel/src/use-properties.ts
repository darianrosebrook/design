/**
 * @fileoverview React hook for properties panel integration
 * @author @darianrosebrook
 */

import type { NodeType } from "@paths-design/canvas-schema";
import { useState, useEffect, useCallback } from "react";
import { PropertiesService } from "./properties-service";
// import { getApplicablePropertiesForNode } from "./property-utils"; // TODO: Remove if not needed
import type {
  SelectionState,
  PropertyChangeEvent,
  PropertyValue,
} from "./types";

/**
 * Hook for integrating with the properties service
 */
export function useProperties() {
  const [selection, setSelection] = useState<SelectionState>(
    PropertiesService.getInstance().getSelection()
  );
  const [nodes, setNodes] = useState<NodeType[]>([]);

  // Subscribe to service changes
  useEffect(() => {
    const service = PropertiesService.getInstance();

    // Subscribe to selection changes
    const unsubscribeSelection = service.onSelectionChange((newSelection) => {
      setSelection(newSelection);
    });

    // Subscribe to property changes
    const unsubscribeProperties = service.onPropertyChange((_event) => {
      // Trigger a re-render when properties change
      setNodes((prevNodes) => [...prevNodes]);
    });

    return () => {
      unsubscribeSelection();
      unsubscribeProperties();
    };
  }, []);

  /**
   * Set the current selection
   */
  const updateSelection = useCallback((newSelection: SelectionState) => {
    PropertiesService.getInstance().setSelection(newSelection);
  }, []);

  /**
   * Set the available nodes
   */
  const updateNodes = useCallback((newNodes: NodeType[]) => {
    PropertiesService.getInstance().setNodes(newNodes);
    setNodes(newNodes);
  }, []);

  /**
   * Handle property change
   */
  const handlePropertyChange = useCallback((_event: PropertyChangeEvent) => {
    // For now, we just need to trigger a re-render
    // In a real implementation, this would send the change to the canvas
    setNodes((prevNodes) => [...prevNodes]);
  }, []);

  /**
   * Get current property value for display
   */
  const getCurrentPropertyValue = useCallback((propertyKey: string) => {
    return PropertiesService.getInstance().getMixedPropertyValue(propertyKey);
  }, []);

  return {
    selection,
    nodes,
    updateSelection,
    updateNodes,
    handlePropertyChange,
    getCurrentPropertyValue,
  };
}

/**
 * Hook for individual property editing
 */
export function usePropertyEditor(nodeId: string, propertyKey: string) {
  const [value, setValue] = useState<unknown>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  // Update value when selection or nodes change
  useEffect(() => {
    const service = PropertiesService.getInstance();
    const currentValue = service.getNodeProperty(nodeId, propertyKey);
    setValue(currentValue);
  }, [nodeId, propertyKey]);

  /**
   * Handle property value change
   */
  const handleChange = useCallback(
    async (newValue: unknown) => {
      setIsLoading(true);

      try {
        const success = PropertiesService.getInstance().setNodeProperty(
          nodeId,
          propertyKey,
          newValue as PropertyValue
        );

        if (success) {
          setValue(newValue);
        }
      } catch (error) {
        console.error("Failed to update property:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [nodeId, propertyKey]
  );

  return {
    value,
    isLoading,
    handleChange,
  };
}
