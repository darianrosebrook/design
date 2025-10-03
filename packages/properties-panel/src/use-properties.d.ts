/**
 * @fileoverview React hook for properties panel integration
 * @author @darianrosebrook
 */
import type { NodeType } from "@paths-design/canvas-schema";
import type { SelectionState, PropertyChangeEvent } from "./types";
/**
 * Hook for integrating with the properties service
 */
export declare function useProperties(): {
    selection: SelectionState;
    nodes: any[];
    updateSelection: (newSelection: SelectionState) => void;
    updateNodes: (newNodes: NodeType[]) => void;
    handlePropertyChange: (event: PropertyChangeEvent) => void;
    getCurrentPropertyValue: (propertyKey: string) => import("./types").PropertyValue;
};
/**
 * Hook for individual property editing
 */
export declare function usePropertyEditor(nodeId: string, propertyKey: string): {
    value: any;
    isLoading: boolean;
    handleChange: (newValue: any) => Promise<void>;
};
//# sourceMappingURL=use-properties.d.ts.map