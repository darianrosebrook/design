/**
 * @fileoverview Properties service for handling node property operations
 * @author @darianrosebrook
 */
import type { NodeType } from "../../canvas-schema/src/index.js";
import type { PropertyChangeEvent, SelectionState, PropertyValue, PropertyDefinition } from "./types";
import type { ComponentIndex } from "../../component-indexer/src/index.js";
/**
 * Callback type for property change notifications
 */
export type PropertyChangeCallback = (event: PropertyChangeEvent) => void;
/**
 * Callback type for selection change notifications
 */
export type SelectionChangeCallback = (selection: SelectionState) => void;
/**
 * Service for managing properties panel operations
 */
export declare class PropertiesService {
    private static instance;
    private nodes;
    private componentIndex?;
    private selection;
    private propertyChangeCallbacks;
    private selectionChangeCallbacks;
    /**
     * Get singleton instance
     */
    static getInstance(): PropertiesService;
    /**
     * Set the available nodes (from canvas document)
     */
    setNodes(nodes: NodeType[]): void;
    /**
     * Set the component index for semantic key and contract support
     */
    setComponentIndex(componentIndex: ComponentIndex): void;
    /**
     * Update a single node
     */
    updateNode(nodeId: string, updates: Partial<NodeType>): void;
    /**
     * Get current selection
     */
    getSelection(): SelectionState;
    /**
     * Set current selection
     */
    setSelection(selection: SelectionState): void;
    /**
     * Get property value for a node
     */
    getNodeProperty(nodeId: string, propertyKey: string): PropertyValue | undefined;
    /**
     * Set property value for a node
     */
    setNodeProperty(nodeId: string, propertyKey: string, value: PropertyValue): boolean;
    /**
     * Get applicable properties for currently selected nodes
     */
    getApplicableProperties(): Array<{
        nodeId: string;
        properties: PropertyDefinition[];
    }>;
    /**
     * Get applicable properties for a node, enhanced with semantic keys and component contracts
     */
    private getApplicablePropertiesForNodeWithContracts;
    /**
     * Get properties from component contract for a semantic key
     */
    private getContractPropertiesForSemanticKey;
    /**
     * Get properties from component contract
     */
    private getContractPropertiesForComponent;
    /**
     * Map TypeScript/JavaScript type to property panel type
     */
    private mapTypeToPropertyType;
    /**
     * Get all applicable properties for the current selection
     */
    getAllApplicableProperties(): any[];
    /**
     * Get mixed property values across selected nodes
     */
    getMixedPropertyValue(propertyKey: string): PropertyValue | "mixed";
    /**
     * Subscribe to property changes
     */
    onPropertyChange(callback: PropertyChangeCallback): () => void;
    /**
     * Subscribe to selection changes
     */
    onSelectionChange(callback: SelectionChangeCallback): () => void;
    /**
     * Notify property change callbacks
     */
    private notifyPropertyChanges;
    /**
     * Get section ID for a property key
     */
    private getSectionIdForProperty;
    /**
     * Reset the service state
     */
    reset(): void;
}
//# sourceMappingURL=properties-service.d.ts.map