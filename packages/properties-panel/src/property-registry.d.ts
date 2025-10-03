/**
 * @fileoverview Property registry for the properties panel
 * @author @darianrosebrook
 */
import type { PropertySection, PropertyDefinition } from "./types";
/**
 * Registry of all available properties for different node types
 */
export declare class PropertyRegistry {
    private static sections;
    /**
     * Register a property section
     */
    static registerSection(section: PropertySection): void;
    /**
     * Get all registered sections
     */
    static getSections(): PropertySection[];
    /**
     * Get sections for a specific node type
     */
    static getSectionsForNodeType(nodeType: string): PropertySection[];
    /**
     * Get properties for a specific node type
     */
    static getPropertiesForNodeType(nodeType: string): PropertyDefinition[];
    /**
     * Check if a property is compatible with a node type
     */
    private static isPropertyCompatibleWithNodeType;
    /**
     * Initialize default property sections
     */
    static initialize(): void;
}
//# sourceMappingURL=property-registry.d.ts.map