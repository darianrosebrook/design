/**
 * @fileoverview React hook for properties panel integration
 * @author @darianrosebrook
 */
import { useState, useEffect, useCallback } from "react";
import { PropertiesService } from "./properties-service";
/**
 * Hook for integrating with the properties service
 */
export function useProperties() {
    const [selection, setSelection] = useState(PropertiesService.getInstance().getSelection());
    const [nodes, setNodes] = useState([]);
    // Subscribe to service changes
    useEffect(() => {
        const service = PropertiesService.getInstance();
        // Subscribe to selection changes
        const unsubscribeSelection = service.onSelectionChange((newSelection) => {
            setSelection(newSelection);
        });
        // Subscribe to property changes
        const unsubscribeProperties = service.onPropertyChange((event) => {
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
    const updateSelection = useCallback((newSelection) => {
        PropertiesService.getInstance().setSelection(newSelection);
    }, []);
    /**
     * Set the available nodes
     */
    const updateNodes = useCallback((newNodes) => {
        PropertiesService.getInstance().setNodes(newNodes);
        setNodes(newNodes);
    }, []);
    /**
     * Handle property change
     */
    const handlePropertyChange = useCallback((event) => {
        // For now, we just need to trigger a re-render
        // In a real implementation, this would send the change to the canvas
        setNodes((prevNodes) => [...prevNodes]);
    }, []);
    /**
     * Get current property value for display
     */
    const getCurrentPropertyValue = useCallback((propertyKey) => {
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
export function usePropertyEditor(nodeId, propertyKey) {
    const [value, setValue] = useState(undefined);
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
    const handleChange = useCallback(async (newValue) => {
        setIsLoading(true);
        try {
            const success = PropertiesService.getInstance().setNodeProperty(nodeId, propertyKey, newValue);
            if (success) {
                setValue(newValue);
            }
        }
        catch (error) {
            console.error("Failed to update property:", error);
        }
        finally {
            setIsLoading(false);
        }
    }, [nodeId, propertyKey]);
    return {
        value,
        isLoading,
        handleChange,
    };
}
