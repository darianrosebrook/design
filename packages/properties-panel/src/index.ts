/**
 * @fileoverview Main entry point for the properties panel package
 * @author @darianrosebrook
 */

// Components
export { PropertiesPanel } from "./PropertiesPanel.js";
export { PropertySectionComponent } from "./PropertySection.js";
export { PropertyEditor } from "./PropertyEditor.js";

// Services & Hooks
export { PropertiesService } from "./properties-service.js";
export { useProperties, usePropertyEditor } from "./use-properties.js";

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
  FontMetadata,
  FontVariant,
} from "./types.js";

export type {
  PropertyChangeCallback,
  SelectionChangeCallback,
} from "./properties-service.js";

// Utilities
export {
  getNodeProperty,
  setNodeProperty,
  getApplicablePropertiesForNode,
  validatePropertyValue,
  formatPropertyValue,
} from "./property-utils.js";
export { PropertyRegistry } from "./property-registry.js";

// Styles
export { propertiesPanelStyles } from "./PropertiesPanel.js";
export { propertySectionStyles } from "./PropertySection.js";
export { propertyEditorStyles } from "./PropertyEditor.js";
