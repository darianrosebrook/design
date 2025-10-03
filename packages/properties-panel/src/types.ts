/**
 * @fileoverview Core types for the properties panel
 * @author @darianrosebrook
 */

import type {
  NodeType,
  BaseNodeType,
  SemanticKeyType,
} from "../../canvas-schema/src/index.js";
import type { ComponentIndex } from "../../component-indexer/src/index.js";

/**
 * Selection state for the properties panel
 */
export interface SelectionState {
  selectedNodeIds: string[];
  focusedNodeId: string | null;
}

/**
 * Property value types that can be edited in the panel
 */
export type PropertyValue =
  | string
  | number
  | boolean
  | { x: number; y: number; width: number; height: number } // Rect
  | { r: number; g: number; b: number; a?: number } // Color
  | string[] // Multi-value (for mixed selections)
  | undefined; // For cases where property doesn't exist

/**
 * Property definition for the panel
 */
export interface PropertyDefinition {
  key: string;
  label: string;
  type:
    | "string"
    | "number"
    | "boolean"
    | "rect"
    | "color"
    | "select"
    | "multiselect";
  category: string;
  description?: string;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  multiline?: boolean;
  semanticKey?: SemanticKeyType;
  componentContract?: ComponentContractProperty;
}

/**
 * Component contract property information
 */
export interface ComponentContractProperty {
  componentKey: string;
  propName: string;
  propType: string;
  propDefaults?: Record<string, unknown>;
  passthrough?: {
    attributes?: string[];
    cssVars?: string[];
    events?: string[];
    children?: boolean;
    ariaLabel?: boolean;
  };
}

/**
 * Property section (group of related properties)
 */
export interface PropertySection {
  id: string;
  label: string;
  icon?: string;
  properties: PropertyDefinition[];
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

/**
 * Panel state
 */
export interface PanelState {
  selection: SelectionState;
  sections: PropertySection[];
  isVisible: boolean;
  width: number;
}

/**
 * Property change event
 */
export interface PropertyChangeEvent {
  nodeId: string;
  propertyKey: string;
  oldValue: PropertyValue;
  newValue: PropertyValue;
  sectionId: string;
}

/**
 * Panel event handlers
 */
export interface PanelEventHandlers {
  onPropertyChange: (event: PropertyChangeEvent) => void;
  onSelectionChange: (selection: SelectionState) => void;
  onPanelResize: (width: number) => void;
  onPanelToggle: (visible: boolean) => void;
}

/**
 * Properties panel props
 */
export interface PropertiesPanelProps {
  documentId: string;
  selection: SelectionState;
  onPropertyChange: (event: PropertyChangeEvent) => void;
  onSelectionChange: (selection: SelectionState) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Individual property editor props
 */
export interface PropertyEditorProps {
  definition: PropertyDefinition;
  value: PropertyValue;
  onChange: (value: PropertyValue) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Section component props
 */
export interface PropertySectionProps {
  section: PropertySection;
  selection: SelectionState;
  onPropertyChange: (event: PropertyChangeEvent) => void;
  className?: string;
}
