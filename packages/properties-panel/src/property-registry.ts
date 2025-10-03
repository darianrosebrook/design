/**
 * @fileoverview Property registry for the properties panel
 * @author @darianrosebrook
 */

import type {
  PropertySection,
  PropertyDefinition,
  FontMetadata,
} from "./types";

/**
 * Registry of all available properties for different node types
 */
export class PropertyRegistry {
  private static sections: Map<string, PropertySection> = new Map();
  private static fontOptions: Array<{ label: string; value: string }> = [];

  /**
   * Register a property section
   */
  static registerSection(section: PropertySection): void {
    this.sections.set(section.id, section);
  }

  static setFontFamilies(fonts: FontMetadata[]): void {
    this.fontOptions = fonts.map((font) => ({
      label: font.family,
      value: font.family,
    }));
    this.initialize();
  }

  /**
   * Get all registered sections
   */
  static getSections(): PropertySection[] {
    return Array.from(this.sections.values());
  }

  /**
   * Get sections for a specific node type
   */
  static getSectionsForNodeType(nodeType: string): PropertySection[] {
    const allSections = this.getSections();

    // Filter sections based on node type compatibility
    return allSections.filter((section) => {
      return section.properties.some((prop) =>
        this.isPropertyCompatibleWithNodeType(prop, nodeType)
      );
    });
  }

  /**
   * Get properties for a specific node type
   */
  static getPropertiesForNodeType(nodeType: string): PropertyDefinition[] {
    const sections = this.getSectionsForNodeType(nodeType);
    return sections.flatMap((section) => section.properties);
  }

  /**
   * Check if a property is compatible with a node type
   */
  private static isPropertyCompatibleWithNodeType(
    property: PropertyDefinition,
    nodeType: string
  ): boolean {
    // Define compatibility rules
    const compatibilityRules: Record<string, string[]> = {
      // Layout properties - all node types
      "frame.x": ["frame", "text", "vector", "image", "component"],
      "frame.y": ["frame", "text", "vector", "image", "component"],
      "frame.width": ["frame", "text", "vector", "image", "component"],
      "frame.height": ["frame", "text", "vector", "image", "component"],
      rotation: ["frame", "text", "vector", "image", "component"],
      constrainProportions: ["frame", "text", "vector", "image", "component"],

      // Alignment properties - frame-like nodes
      horizontalAlignment: ["frame", "text", "vector", "image", "component"],
      verticalAlignment: ["frame", "text", "vector", "image", "component"],

      // Constraint properties - frame-like nodes
      "constraints.left": ["frame", "text", "vector", "image", "component"],
      "constraints.right": ["frame", "text", "vector", "image", "component"],
      "constraints.top": ["frame", "text", "vector", "image", "component"],
      "constraints.bottom": ["frame", "text", "vector", "image", "component"],

      // Style properties
      opacity: ["frame", "text", "vector", "image", "component"],
      radius: ["frame", "vector"], // Only frames and vectors have corner radius

      // Text-specific properties
      "text.content": ["text"],
      "textStyle.family": ["text"],
      "textStyle.size": ["text"],
      "textStyle.weight": ["text"],
      "textStyle.lineHeight": ["text"],
      "textStyle.letterSpacing": ["text"],
      "textStyle.color": ["text"],

      // Component-specific properties
      componentKey: ["component"],
    };

    return compatibilityRules[property.key]?.includes(nodeType) ?? false;
  }

  /**
   * Initialize default property sections
   */
  static initialize(): void {
    // Clear existing sections
    this.sections.clear();

    // Layout section
    this.registerSection({
      id: "layout",
      label: "Layout",
      icon: "📐",
      properties: [
        {
          key: "frame.x",
          label: "X",
          type: "number",
          category: "position",
          description: "Horizontal position",
          min: -10000,
          max: 10000,
          step: 1,
          precision: 0,
          disclosure: "primary",
        },
        {
          key: "frame.y",
          label: "Y",
          type: "number",
          category: "position",
          description: "Vertical position",
          min: -10000,
          max: 10000,
          step: 1,
          precision: 0,
          disclosure: "primary",
        },
        {
          key: "frame.width",
          label: "Width",
          type: "number",
          category: "size",
          description: "Element width",
          min: 0,
          max: 10000,
          step: 1,
          precision: 0,
          disclosure: "primary",
        },
        {
          key: "frame.height",
          label: "Height",
          type: "number",
          category: "size",
          description: "Element height",
          min: 0,
          max: 10000,
          step: 1,
          precision: 0,
          disclosure: "primary",
        },
        {
          key: "rotation",
          label: "Rotation",
          type: "number",
          category: "transform",
          description: "Rotation angle in degrees",
          min: -360,
          max: 360,
          step: 1,
          precision: 0,
          disclosure: "advanced",
        },
        {
          key: "constrainProportions",
          label: "Constrain Proportions",
          type: "boolean",
          category: "size",
          description: "Maintain aspect ratio when resizing",
          disclosure: "advanced",
        },
      ],
    });

    // Alignment section
    this.registerSection({
      id: "alignment",
      label: "Alignment",
      icon: "⚖️",
      collapsible: true,
      defaultCollapsed: true,
      properties: [
        {
          key: "horizontalAlignment",
          label: "Horizontal Alignment",
          type: "select",
          category: "alignment",
          description: "Horizontal alignment within parent",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" },
          ],
          disclosure: "primary",
        },
        {
          key: "verticalAlignment",
          label: "Vertical Alignment",
          type: "select",
          category: "alignment",
          description: "Vertical alignment within parent",
          options: [
            { label: "Top", value: "top" },
            { label: "Middle", value: "middle" },
            { label: "Bottom", value: "bottom" },
          ],
          disclosure: "primary",
        },
      ],
    });

    // Constraints section
    this.registerSection({
      id: "constraints",
      label: "Constraints",
      icon: "🔗",
      collapsible: true,
      defaultCollapsed: true,
      properties: [
        {
          key: "constraints.left",
          label: "Left Constraint",
          type: "select",
          category: "constraints",
          description: "Left edge constraint behavior",
          options: [
            { label: "None", value: "none" },
            { label: "Left", value: "left" },
            { label: "Right", value: "right" },
            { label: "Center", value: "center" },
            { label: "Scale", value: "scale" },
          ],
          disclosure: "advanced",
        },
        {
          key: "constraints.right",
          label: "Right Constraint",
          type: "select",
          category: "constraints",
          description: "Right edge constraint behavior",
          options: [
            { label: "None", value: "none" },
            { label: "Left", value: "left" },
            { label: "Right", value: "right" },
            { label: "Center", value: "center" },
            { label: "Scale", value: "scale" },
          ],
          disclosure: "advanced",
        },
        {
          key: "constraints.top",
          label: "Top Constraint",
          type: "select",
          category: "constraints",
          description: "Top edge constraint behavior",
          options: [
            { label: "None", value: "none" },
            { label: "Top", value: "top" },
            { label: "Bottom", value: "bottom" },
            { label: "Center", value: "center" },
            { label: "Scale", value: "scale" },
          ],
          disclosure: "advanced",
        },
        {
          key: "constraints.bottom",
          label: "Bottom Constraint",
          type: "select",
          category: "constraints",
          description: "Bottom edge constraint behavior",
          options: [
            { label: "None", value: "none" },
            { label: "Top", value: "top" },
            { label: "Bottom", value: "bottom" },
            { label: "Center", value: "center" },
            { label: "Scale", value: "scale" },
          ],
          disclosure: "advanced",
        },
      ],
    });

    // Appearance section
    this.registerSection({
      id: "appearance",
      label: "Appearance",
      icon: "🎨",
      properties: [
        {
          key: "opacity",
          label: "Opacity",
          type: "number",
          category: "appearance",
          description: "Transparency level",
          min: 0,
          max: 1,
          step: 0.01,
          precision: 2,
          disclosure: "primary",
        },
        {
          key: "radius",
          label: "Corner Radius",
          type: "number",
          category: "appearance",
          description: "Corner radius for rounded corners",
          min: 0,
          max: 1000,
          step: 1,
          precision: 0,
          disclosure: "primary",
        },
      ],
    });

    // Text section
    this.registerSection({
      id: "text",
      label: "Text",
      icon: "📝",
      properties: [
        {
          key: "text.content",
          label: "Content",
          type: "string",
          category: "content",
          description: "Text content",
          multiline: true,
          disclosure: "primary",
        },
        {
          key: "textStyle.family",
          label: "Font Family",
          type: "select",
          category: "typography",
          description: "Font family",
          options: this.fontOptions.length
            ? this.fontOptions
            : [
                { label: "Inter", value: "Inter" },
                { label: "System", value: "system-ui" },
                { label: "Arial", value: "Arial" },
                { label: "Helvetica", value: "Helvetica" },
              ],
          disclosure: "primary",
        },
        {
          key: "textStyle.size",
          label: "Font Size",
          type: "number",
          category: "typography",
          description: "Font size in pixels",
          min: 8,
          max: 200,
          step: 1,
          precision: 0,
          disclosure: "primary",
        },
        {
          key: "textStyle.weight",
          label: "Font Weight",
          type: "select",
          category: "typography",
          description: "Font weight",
          options: [
            { label: "Light", value: "300" },
            { label: "Normal", value: "400" },
            { label: "Medium", value: "500" },
            { label: "Semibold", value: "600" },
            { label: "Bold", value: "700" },
          ],
          disclosure: "advanced",
        },
        {
          key: "textStyle.lineHeight",
          label: "Line Height",
          type: "number",
          category: "typography",
          description: "Line height multiplier",
          min: 0.8,
          max: 3,
          step: 0.1,
          precision: 1,
          disclosure: "advanced",
        },
        {
          key: "textStyle.letterSpacing",
          label: "Letter Spacing",
          type: "number",
          category: "typography",
          description: "Letter spacing in pixels",
          min: -10,
          max: 20,
          step: 0.5,
          precision: 1,
          disclosure: "advanced",
        },
        {
          key: "textStyle.color",
          label: "Text Color",
          type: "color",
          category: "typography",
          description: "Text color",
          disclosure: "primary",
        },
      ],
    });

    // Component section
    this.registerSection({
      id: "component",
      label: "Component",
      icon: "🧩",
      properties: [
        {
          key: "componentKey",
          label: "Component",
          type: "select",
          category: "component",
          description: "Component reference",
          options: [
            // This will be populated dynamically based on available components
          ],
        },
      ],
    });
  }
}

// Initialize default sections
PropertyRegistry.initialize();
