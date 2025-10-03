/**
 * @fileoverview Property utilities for getting/setting node properties
 * @author @darianrosebrook
 */

import type { NodeType, TextNodeType } from "@paths-design/canvas-schema";
import type { PropertyValue, PropertyDefinition } from "./types";

/**
 * Get the value of a property from a node
 */
export function getNodeProperty(
  node: NodeType,
  propertyKey: string
): PropertyValue | undefined {
  // Handle nested property access (e.g., "frame.x", "textStyle.size")
  const parts = propertyKey.split(".");

  if (parts.length === 1) {
    // Direct property access
    return (node as Record<string, unknown>)[propertyKey];
  }

  if (parts.length === 2) {
    const [parent, child] = parts;

    switch (parent) {
      case "frame":
        return node.frame
          ? (node.frame as Record<string, unknown>)[child]
          : undefined;

      case "textStyle":
        return node.type === "text" && node.textStyle
          ? (node.textStyle as Record<string, unknown>)[child]
          : undefined;

      case "text":
        return node.type === "text" ? (node as TextNodeType).text : undefined;

      case "constraints":
        // Constraints are not yet implemented in the schema
        return undefined;

      default:
        return (node as Record<string, unknown>)[parent]?.[child];
    }
  }

  // For deeper nesting, traverse the object
  let current: unknown = node;
  for (const part of parts) {
    if (current == null || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Set a property value on a node (returns a new node with the updated property)
 */
export function setNodeProperty(
  node: NodeType,
  propertyKey: string,
  value: PropertyValue
): NodeType {
  // Handle nested property access (e.g., "frame.x", "textStyle.size")
  const parts = propertyKey.split(".");

  if (parts.length === 1) {
    // Direct property access
    return { ...node, [propertyKey]: value };
  }

  if (parts.length === 2) {
    const [parent, child] = parts;

    switch (parent) {
      case "frame":
        return {
          ...node,
          frame: {
            ...node.frame,
            [child]: value,
          },
        };

      case "textStyle":
        if (node.type === "text") {
          return {
            ...node,
            textStyle: {
              ...node.textStyle,
              [child]: value,
            },
          };
        }
        break;

      case "text":
        if (node.type === "text") {
          return {
            ...node,
            text: value as string,
          };
        }
        break;

      case "constraints":
        // Constraints are not yet implemented in the schema
        // For now, store them in the node's data field
        return {
          ...node,
          data: {
            ...node.data,
            constraints: {
              ...node.data?.constraints,
              [child]: value,
            },
          },
        };
    }
  }

  // For deeper nesting, create a deep clone and update
  const updatedNode = JSON.parse(JSON.stringify(node));
  let current: Record<string, unknown> = updatedNode;

  // Navigate to the parent of the final property
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current[part] == null) {
      current[part] = {};
    }
    current = current[part];
  }

  // Set the final property
  current[parts[parts.length - 1]] = value;

  return updatedNode;
}

/**
 * Get all applicable properties for a node based on its type
 */
export function getApplicablePropertiesForNode(
  node: NodeType
): PropertyDefinition[] {
  // This would be implemented by filtering the registry based on node type
  // For now, return a basic set based on node type
  const properties: PropertyDefinition[] = [];

  // All nodes have layout properties
  properties.push(
    {
      key: "frame.x",
      label: "X",
      type: "number",
      category: "position",
      min: -10000,
      max: 10000,
      step: 1,
      precision: 0,
    },
    {
      key: "frame.y",
      label: "Y",
      type: "number",
      category: "position",
      min: -10000,
      max: 10000,
      step: 1,
      precision: 0,
    },
    {
      key: "frame.width",
      label: "Width",
      type: "number",
      category: "size",
      min: 0,
      max: 10000,
      step: 1,
      precision: 0,
    },
    {
      key: "frame.height",
      label: "Height",
      type: "number",
      category: "size",
      min: 0,
      max: 10000,
      step: 1,
      precision: 0,
    },
    {
      key: "rotation",
      label: "Rotation",
      type: "number",
      category: "transform",
      min: -360,
      max: 360,
      step: 1,
      precision: 0,
    }
  );

  // Style properties for all nodes
  properties.push({
    key: "opacity",
    label: "Opacity",
    type: "number",
    category: "appearance",
    min: 0,
    max: 1,
    step: 0.01,
    precision: 2,
  });

  // Node type specific properties
  if (node.type === "text") {
    properties.push(
      {
        key: "text.content",
        label: "Content",
        type: "string",
        category: "content",
        multiline: true,
      },
      {
        key: "textStyle.family",
        label: "Font Family",
        type: "select",
        category: "typography",
        options: [
          { label: "Inter", value: "Inter" },
          { label: "System", value: "system-ui" },
          { label: "Arial", value: "Arial" },
        ],
      },
      {
        key: "textStyle.size",
        label: "Font Size",
        type: "number",
        category: "typography",
        min: 8,
        max: 200,
        step: 1,
        precision: 0,
      },
      {
        key: "textStyle.color",
        label: "Text Color",
        type: "color",
        category: "typography",
      }
    );
  }

  if (node.type === "frame" || node.type === "vector") {
    properties.push({
      key: "radius",
      label: "Corner Radius",
      type: "number",
      category: "appearance",
      min: 0,
      max: 1000,
      step: 1,
      precision: 0,
    });
  }

  return properties;
}

/**
 * Check if a property value is valid for a given property definition
 */
export function validatePropertyValue(
  value: PropertyValue,
  definition: PropertyDefinition
): { valid: boolean; error?: string } {
  switch (definition.type) {
    case "number":
      const num =
        typeof value === "number" ? value : parseFloat(value as string);
      if (isNaN(num)) {
        return { valid: false, error: "Must be a valid number" };
      }

      if (definition.min !== undefined && num < definition.min) {
        return { valid: false, error: `Must be at least ${definition.min}` };
      }

      if (definition.max !== undefined && num > definition.max) {
        return { valid: false, error: `Must be at most ${definition.max}` };
      }

      break;

    case "string":
      if (typeof value !== "string") {
        return { valid: false, error: "Must be a string" };
      }

      if (definition.min !== undefined && value.length < definition.min) {
        return {
          valid: false,
          error: `Must be at least ${definition.min} characters`,
        };
      }

      if (definition.max !== undefined && value.length > definition.max) {
        return {
          valid: false,
          error: `Must be at most ${definition.max} characters`,
        };
      }

      break;

    case "select":
      if (typeof value !== "string") {
        return { valid: false, error: "Must be a valid option" };
      }

      if (
        definition.options &&
        !definition.options.some((opt) => opt.value === value)
      ) {
        return { valid: false, error: "Invalid option selected" };
      }

      break;

    case "color":
      // Basic color validation - could be enhanced
      if (typeof value !== "string" && typeof value !== "object") {
        return { valid: false, error: "Must be a valid color" };
      }

      break;
  }

  return { valid: true };
}

/**
 * Format a property value for display
 */
export function formatPropertyValue(
  value: PropertyValue,
  definition: PropertyDefinition
): string {
  if (value == null) {
    return "";
  }

  switch (definition.type) {
    case "number":
      const num =
        typeof value === "number" ? value : parseFloat(value as string);
      if (definition.precision !== undefined) {
        return num.toFixed(definition.precision);
      }
      return num.toString();

    case "color":
      if (typeof value === "string") {
        return value;
      }
      if (typeof value === "object" && value !== null) {
        const color = value as { r: number; g: number; b: number; a?: number };
        if (color.a !== undefined) {
          return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
        }
        return `rgb(${color.r}, ${color.g}, ${color.b})`;
      }
      return "";

    case "boolean":
      return value ? "Yes" : "No";

    case "rect":
      if (typeof value === "object" && value !== null) {
        const rect = value as {
          x: number;
          y: number;
          width: number;
          height: number;
        };
        return `${rect.x}, ${rect.y}, ${rect.width}×${rect.height}`;
      }
      return "";

    default:
      return String(value);
  }
}
