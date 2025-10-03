/**
 * @fileoverview TypeScript Compiler API-based component scanner
 * @author @darianrosebrook
 */
import type { DiscoveryOptions, DiscoveryResult } from "./types.js";
/**
 * Component scanner using TypeScript Compiler API
 */
export declare class ComponentScanner {
    private program;
    private checker;
    /**
     * Discover React components in a TypeScript project
     */
    discover(options: DiscoveryOptions): Promise<DiscoveryResult>;
    /**
     * Load TypeScript configuration
     */
    private loadTsConfig;
    /**
     * Find TypeScript files in directory
     */
    private findTypeScriptFiles;
    /**
     * Check if file should be scanned
     */
    private shouldScanFile;
    /**
     * Scan a single TypeScript file for React components
     */
    private scanFile;
    /**
     * Check if node is a React component
     */
    private isReactComponent;
    /**
     * Check if function returns JSX
     */
    private hasJSXReturnType;
    /**
     * Check if function body contains JSX elements
     */
    private hasJSXInBody;
    /**
     * Check if class extends React.Component
     */
    private extendsReactComponent;
    /**
     * Extract component metadata from AST node
     */
    private extractComponentMetadata;
    /**
     * Discover compound components (e.g., Card.Header, Menu.Item)
     */
    private discoverCompoundComponents;
    /**
     * Extract component metadata from AST node (base implementation)
     */
    private extractComponentMetadataBase;
    /**
     * Extract props from TypeScript type
     */
    private extractPropsFromType;
    /**
     * Get JSDoc comment text from a JSDoc node or tag
     */
    private getJSDocComment;
    /**
     * Extract default values from component implementation
     */
    private extractDefaultValues;
    /**
     * Extract default values from function parameters (destructuring)
     */
    private extractFromFunctionParameters;
    /**
     * Extract defaults from inline type literal parameters
     */
    private extractDefaultsFromTypeLiteral;
    /**
     * Extract default values from defaultProps assignments
     */
    private extractFromDefaultProps;
    /**
     * Extract default values from destructuring defaults in function body
     */
    private extractFromDestructuringDefaults;
    /**
     * Extract defaults from object binding pattern (destructuring)
     */
    private extractDefaultsFromBindingPattern;
    /**
     * Extract defaults from object literal expression
     */
    private extractDefaultsFromObjectLiteral;
    /**
     * Evaluate a default value expression to a concrete value
     */
    private evaluateDefaultValue;
    /**
     * Get component name from AST node
     */
    private getComponentName;
    /**
     * Create component entry from raw metadata
     */
    private createComponentEntry;
    /**
     * Parse variant information from JSDoc
     */
    private parseVariants;
}
/**
 * Convenience function to discover components
 */
export declare function discoverComponents(options: DiscoveryOptions): Promise<DiscoveryResult>;
//# sourceMappingURL=scanner.d.ts.map