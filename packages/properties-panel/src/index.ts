/**
 * @fileoverview Main entry point for the properties panel package
 * @author @darianrosebrook
 */

// Components
export { PropertiesPanel } from "./PropertiesPanel";
export { PropertySectionComponent } from "./PropertySection";
export { PropertyEditor } from "./PropertyEditor";

// Services & Hooks
export { PropertiesService } from "./properties-service";
export { useProperties, usePropertyEditor } from "./use-properties";

// Types
export type {
  SelectionState,
  PropertyValue,
  PropertyDefinition,
  PropertySection,
  PanelState,
  PropertyChangeEvent,
  PanelEventHandlers,
  PropertiesPanelProps,
  PropertyEditorProps,
  PropertySectionProps,
} from "./types";

export type {
  PropertyChangeCallback,
  SelectionChangeCallback,
} from "./properties-service";

// Utilities
export {
  getNodeProperty,
  setNodeProperty,
  getApplicablePropertiesForNode,
  validatePropertyValue,
  formatPropertyValue,
} from "./property-utils";
export { PropertyRegistry } from "./property-registry";

// Styles
export { propertiesPanelStyles } from "./PropertiesPanel";
export { propertySectionStyles } from "./PropertySection";
export { propertyEditorStyles } from "./PropertyEditor";
