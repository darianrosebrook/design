/**
 * @fileoverview Properties service for handling node property operations
 * @author @darianrosebrook
 */
import {
  getNodeProperty,
  setNodeProperty,
  getApplicablePropertiesForNode,
} from "./property-utils";
/**
 * Service for managing properties panel operations
 */
export class PropertiesService {
  static instance = null;
  nodes = new Map();
  componentIndex;
  selection = {
    selectedNodeIds: [],
    focusedNodeId: null,
  };
  propertyChangeCallbacks = new Set();
  selectionChangeCallbacks = new Set();
  /**
   * Get singleton instance
   */
  static getInstance() {
    if (!PropertiesService.instance) {
      PropertiesService.instance = new PropertiesService();
    }
    return PropertiesService.instance;
  }
  /**
   * Set the available nodes (from canvas document)
   */
  setNodes(nodes) {
    this.nodes.clear();
    for (const node of nodes) {
      this.nodes.set(node.id, node);
    }
  }
  /**
   * Set the component index for semantic key and contract support
   */
  setComponentIndex(componentIndex) {
    this.componentIndex = componentIndex;
  }
  /**
   * Update a single node
   */
  updateNode(nodeId, updates) {
    const existingNode = this.nodes.get(nodeId);
    if (existingNode) {
      const updatedNode = { ...existingNode, ...updates };
      this.nodes.set(nodeId, updatedNode);
      // Notify about property changes
      this.notifyPropertyChanges(nodeId, existingNode, updatedNode);
    }
  }
  /**
   * Get current selection
   */
  getSelection() {
    return { ...this.selection };
  }
  /**
   * Set current selection
   */
  setSelection(selection) {
    const _oldSelection = this.selection;
    this.selection = { ...selection };
    // Notify selection change callbacks
    for (const callback of this.selectionChangeCallbacks) {
      callback(this.selection);
    }
  }
  /**
   * Get property value for a node
   */
  getNodeProperty(nodeId, propertyKey) {
    const node = this.nodes.get(nodeId);
    if (!node) return undefined;
    const value = getNodeProperty(node, propertyKey);
    return value;
  }
  /**
   * Set property value for a node
   */
  setNodeProperty(nodeId, propertyKey, value) {
    const node = this.nodes.get(nodeId);
    if (!node) return false;
    try {
      const oldNode = node;
      const newNode = setNodeProperty(node, propertyKey, value);
      // Update the stored node
      this.nodes.set(nodeId, newNode);
      // Notify about the property change
      this.notifyPropertyChanges(nodeId, oldNode, newNode, propertyKey);
      return true;
    } catch (error) {
      console.error("Failed to set node property:", error);
      return false;
    }
  }
  /**
   * Get applicable properties for currently selected nodes
   */
  getApplicableProperties() {
    const results = [];
    for (const nodeId of this.selection.selectedNodeIds) {
      const node = this.nodes.get(nodeId);
      if (node) {
        const properties =
          this.getApplicablePropertiesForNodeWithContracts(node);
        results.push({ nodeId, properties });
      }
    }
    return results;
  }
  /**
   * Get applicable properties for a node, enhanced with semantic keys and component contracts
   */
  getApplicablePropertiesForNodeWithContracts(node) {
    const properties = getApplicablePropertiesForNode(node);
    // If node has a semantic key, try to find component contract
    if (this.componentIndex && node.semanticKey) {
      const semanticKey = node.semanticKey;
      const contractProperties = this.getContractPropertiesForSemanticKey(
        semanticKey,
        node
      );
      properties.push(...contractProperties);
    }
    // If node is a component instance, get contract properties
    if (node.type === "component" && this.componentIndex) {
      const componentKey = node.componentKey;
      const component = this.componentIndex.components[componentKey];
      if (component) {
        const contractProperties = this.getContractPropertiesForComponent(
          component,
          node
        );
        properties.push(...contractProperties);
      }
    }
    return properties;
  }
  /**
   * Get properties from component contract for a semantic key
   */
  getContractPropertiesForSemanticKey(semanticKey, node) {
    if (!this.componentIndex) return [];
    // Find component that has this semantic key
    for (const [_componentKey, component] of Object.entries(
      this.componentIndex.components
    )) {
      if (component?.semanticKeys?.[semanticKey]) {
        const mapping = component?.semanticKeys?.[semanticKey];
        return this.getContractPropertiesForComponent(
          component,
          node,
          mapping.propDefaults
        );
      }
    }
    return [];
  }
  /**
   * Get properties from component contract
   */
  getContractPropertiesForComponent(component, node, propDefaults) {
    const properties = [];
    for (const prop of component.props) {
      const propertyDef = {
        key: `props.${prop.name}`,
        label: prop.name,
        type: this.mapTypeToPropertyType(prop.type),
        category: "component",
        description: `Component property: ${prop.name}`,
        semanticKey: node.semanticKey,
        componentContract: {
          componentKey: component.id || component.name,
          propName: prop.name,
          propType: prop.type,
          propDefaults,
          passthrough: prop.passthrough,
        },
      };
      // Set default value from contract or prop defaults
      if (prop.defaultValue !== undefined) {
        propertyDef.placeholder = String(prop.defaultValue);
      } else if (propDefaults?.[prop.name] !== undefined) {
        propertyDef.placeholder = String(propDefaults[prop.name]);
      }
      // Handle enum types
      if (prop.enum) {
        propertyDef.type = "select";
        propertyDef.options = prop.enum.map((value) => ({
          label: value,
          value: value,
        }));
      }
      properties.push(propertyDef);
    }
    return properties;
  }
  /**
   * Map TypeScript/JavaScript type to property panel type
   */
  mapTypeToPropertyType(type) {
    if (type.includes("|")) {
      // Union type - check if it's an enum-like union
      const values = type.split("|").map((v) => v.trim().replace(/['"]/g, ""));
      if (values.length <= 5 && values.every((v) => v.length < 20)) {
        return "select";
      }
    }
    switch (type.toLowerCase()) {
      case "string":
        return "string";
      case "number":
        return "number";
      case "boolean":
        return "boolean";
      default:
        return "string"; // Fallback
    }
  }
  /**
   * Get all applicable properties for the current selection
   */
  getAllApplicableProperties() {
    const allProperties = new Set();
    for (const nodeId of this.selection.selectedNodeIds) {
      const node = this.nodes.get(nodeId);
      if (node) {
        const properties = getApplicablePropertiesForNode(node);
        properties.forEach((prop) => allProperties.add(prop.key));
      }
    }
    return Array.from(allProperties).map((key) => ({ key }));
  }
  /**
   * Get mixed property values across selected nodes
   */
  getMixedPropertyValue(propertyKey) {
    if (this.selection.selectedNodeIds.length === 0) {
      return undefined;
    }
    const values = [];
    for (const nodeId of this.selection.selectedNodeIds) {
      const value = this.getNodeProperty(nodeId, propertyKey);
      if (value !== undefined) {
        values.push(value);
      }
    }
    if (values.length === 0) return undefined;
    // Check if all values are the same
    const firstValue = values[0];
    const allSame = values.every(
      (value) => JSON.stringify(value) === JSON.stringify(firstValue)
    );
    return allSame ? firstValue : "mixed";
  }
  /**
   * Subscribe to property changes
   */
  onPropertyChange(callback) {
    this.propertyChangeCallbacks.add(callback);
    // Return unsubscribe function
    return () => {
      this.propertyChangeCallbacks.delete(callback);
    };
  }
  /**
   * Subscribe to selection changes
   */
  onSelectionChange(callback) {
    this.selectionChangeCallbacks.add(callback);
    // Return unsubscribe function
    return () => {
      this.selectionChangeCallbacks.delete(callback);
    };
  }
  /**
   * Notify property change callbacks
   */
  notifyPropertyChanges(nodeId, oldNode, newNode, specificPropertyKey) {
    // If specific property is provided, only notify about that property
    if (specificPropertyKey) {
      const oldValue = getNodeProperty(oldNode, specificPropertyKey);
      const newValue = getNodeProperty(newNode, specificPropertyKey);
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        const event = {
          nodeId,
          propertyKey: specificPropertyKey,
          oldValue,
          newValue,
          sectionId: this.getSectionIdForProperty(specificPropertyKey),
        };
        for (const callback of this.propertyChangeCallbacks) {
          callback(event);
        }
      }
    } else {
      // Notify about all changed properties
      const applicableProperties = getApplicablePropertiesForNode(newNode);
      for (const property of applicableProperties) {
        const oldValue = getNodeProperty(oldNode, property.key);
        const newValue = getNodeProperty(newNode, property.key);
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          const event = {
            nodeId,
            propertyKey: property.key,
            oldValue,
            newValue,
            sectionId: this.getSectionIdForProperty(property.key),
          };
          for (const callback of this.propertyChangeCallbacks) {
            callback(event);
          }
        }
      }
    }
  }
  /**
   * Get section ID for a property key
   */
  getSectionIdForProperty(propertyKey) {
    // Map property keys to section IDs
    if (
      propertyKey.startsWith("frame.") ||
      propertyKey === "rotation" ||
      propertyKey === "constrainProportions"
    ) {
      return "layout";
    }
    if (
      propertyKey === "horizontalAlignment" ||
      propertyKey === "verticalAlignment"
    ) {
      return "alignment";
    }
    if (propertyKey.startsWith("constraints.")) {
      return "constraints";
    }
    if (
      propertyKey.startsWith("textStyle.") ||
      propertyKey.startsWith("text.")
    ) {
      return "text";
    }
    if (propertyKey === "opacity" || propertyKey === "radius") {
      return "appearance";
    }
    if (propertyKey === "componentKey") {
      return "component";
    }
    return "layout"; // Default fallback
  }
  /**
   * Reset the service state
   */
  reset() {
    this.nodes.clear();
    this.selection = { selectedNodeIds: [], focusedNodeId: null };
    this.propertyChangeCallbacks.clear();
    this.selectionChangeCallbacks.clear();
  }
}
