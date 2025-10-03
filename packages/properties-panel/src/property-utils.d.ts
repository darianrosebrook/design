/**
 * @fileoverview Property utilities for getting/setting node properties
 * @author @darianrosebrook
 */
import type { NodeType } from "../../canvas-schema/src/index.js";
import type { PropertyValue, PropertyDefinition } from "./types";
/**
 * Get the value of a property from a node
 */
export declare function getNodeProperty(node: NodeType, propertyKey: string): PropertyValue | undefined;
/**
 * Set a property value on a node (returns a new node with the updated property)
 */
export declare function setNodeProperty(node: NodeType, propertyKey: string, value: PropertyValue): NodeType;
/**
 * Get all applicable properties for a node based on its type
 */
export declare function getApplicablePropertiesForNode(node: NodeType): PropertyDefinition[];
/**
 * Check if a property value is valid for a given property definition
 */
export declare function validatePropertyValue(value: PropertyValue, definition: PropertyDefinition): {
    valid: boolean;
    error?: string;
};
/**
 * Format a property value for display
 */
export declare function formatPropertyValue(value: PropertyValue, definition: PropertyDefinition): string;
//# sourceMappingURL=property-utils.d.ts.map