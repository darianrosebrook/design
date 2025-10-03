/**
 * @fileoverview Canvas Document Validation
 * @author @darianrosebrook
 *
 * Validates canvas documents against JSON Schema using Ajv.
 */

import Ajv from "ajv";
import addFormats from "ajv-formats";

/**
 * Ajv instance configured for canvas schema validation
 */
const ajv = new Ajv({
  allErrors: true,
  verbose: true,
  strict: false,
});
addFormats(ajv);

/**
 * Canvas document schema
 */
const schema = {
  $id: "https://paths.design.dev/schemas/canvas-0.1.json",
  title: "CanvasDocument",
  type: "object",
  required: ["schemaVersion", "id", "name", "artboards"],
  properties: {
    schemaVersion: { const: "0.1.0" },
    id: { type: "string", pattern: "^[0-9A-HJKMNP-TV-Z]{26}$" },
    name: { type: "string" },
    meta: { type: "object", additionalProperties: true },
    artboards: {
      type: "array",
      items: { $ref: "#/$defs/Artboard" },
      minItems: 1,
    },
  },
  $defs: {
    Artboard: {
      type: "object",
      required: ["id", "name", "frame", "children"],
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        frame: { $ref: "#/$defs/Rect" },
        background: {
          $ref: "#/$defs/Fill",
          default: { type: "solid", color: "tokens.color.background" },
        },
        children: { type: "array", items: { $ref: "#/$defs/Node" } },
      },
    },
    Node: {
      oneOf: [
        { $ref: "#/$defs/FrameNode" },
        { $ref: "#/$defs/TextNode" },
        { $ref: "#/$defs/ComponentInstanceNode" },
      ],
    },
    BaseNode: {
      type: "object",
      required: ["id", "type", "name", "visible", "frame", "style"],
      properties: {
        id: { type: "string" },
        type: { type: "string" },
        name: { type: "string" },
        visible: { type: "boolean", default: true },
        frame: { $ref: "#/$defs/Rect" },
        style: { $ref: "#/$defs/Style" },
        data: { type: "object", additionalProperties: true },
        bind: { $ref: "#/$defs/Binding" },
      },
    },
    FrameNode: {
      allOf: [
        { $ref: "#/$defs/BaseNode" },
        {
          properties: {
            type: { const: "frame" },
            layout: { $ref: "#/$defs/Layout" },
            children: { type: "array", items: { $ref: "#/$defs/Node" } },
          },
        },
      ],
    },
    TextNode: {
      allOf: [
        { $ref: "#/$defs/BaseNode" },
        {
          properties: {
            type: { const: "text" },
            text: { type: "string" },
            textStyle: { $ref: "#/$defs/TextStyle" },
          },
          required: ["text"],
        },
      ],
    },
    ComponentInstanceNode: {
      allOf: [
        { $ref: "#/$defs/BaseNode" },
        {
          properties: {
            type: { const: "component" },
            componentKey: { type: "string" },
            props: { type: "object", additionalProperties: true },
          },
          required: ["componentKey"],
        },
      ],
    },
    Rect: {
      type: "object",
      required: ["x", "y", "width", "height"],
      properties: {
        x: { type: "number" },
        y: { type: "number" },
        width: { type: "number", minimum: 0 },
        height: { type: "number", minimum: 0 },
      },
    },
    Style: {
      type: "object",
      properties: {
        fills: { type: "array", items: { $ref: "#/$defs/Fill" } },
        strokes: { type: "array", items: { $ref: "#/$defs/Stroke" } },
        radius: { type: "number" },
        opacity: { type: "number", minimum: 0, maximum: 1 },
        shadow: { $ref: "#/$defs/Shadow" },
      },
      additionalProperties: false,
    },
    Fill: {
      type: "object",
      properties: {
        type: { enum: ["solid", "linearGradient", "radialGradient"] },
        color: { type: "string" },
        stops: { type: "array", items: { $ref: "#/$defs/ColorStop" } },
      },
      required: ["type"],
      additionalProperties: false,
    },
    Stroke: {
      type: "object",
      properties: {
        color: { type: "string" },
        thickness: { type: "number", minimum: 0 },
      },
      required: ["color", "thickness"],
      additionalProperties: false,
    },
    Shadow: {
      type: "object",
      properties: {
        x: { type: "number" },
        y: { type: "number" },
        blur: { type: "number" },
        spread: { type: "number" },
        color: { type: "string" },
      },
      additionalProperties: false,
    },
    ColorStop: {
      type: "object",
      properties: {
        offset: { type: "number", minimum: 0, maximum: 1 },
        color: { type: "string" },
      },
      required: ["offset", "color"],
    },
    TextStyle: {
      type: "object",
      properties: {
        family: { type: "string" },
        size: { type: "number" },
        lineHeight: { type: "number" },
        weight: { type: "string" },
        letterSpacing: { type: "number" },
        color: { type: "string" },
      },
      additionalProperties: false,
    },
    Layout: {
      type: "object",
      properties: {
        mode: { enum: ["absolute", "flex", "grid"], default: "absolute" },
        direction: { enum: ["row", "column"] },
        gap: { type: "number" },
        padding: { type: "number" },
      },
      additionalProperties: false,
    },
    Binding: {
      type: "object",
      properties: {
        token: { type: "string" },
        prop: { type: "string" },
        cssVar: { type: "string" },
      },
      additionalProperties: false,
    },
  },
};

const validate = ajv.compile(schema);

/**
 * Validate a canvas document against the schema
 * @param doc Document to validate
 * @returns Validation result
 */
export function validateCanvasDocument(doc: unknown): {
  valid: boolean;
  errors?: Array<{ message: string; path?: string }>;
  data?: any;
} {
  const valid = validate(doc);

  if (valid) {
    return { valid: true, data: doc };
  }

  return {
    valid: false,
    errors:
      validate.errors?.map((error) => ({
        message: error.message || "Validation error",
        path: error.instancePath || undefined,
      })) || [],
  };
}

/**
 * Validate with detailed error reporting
 * @param doc Document to validate
 * @returns Detailed validation result
 */
export function validateWithDetails(doc: unknown): {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
  data?: any;
} {
  const result = validateCanvasDocument(doc);

  if (result.valid) {
    return { valid: true, data: result.data };
  }

  return {
    valid: false,
    errors:
      result.errors?.map(
        (err) => `${err.path ? `${err.path}: ` : ""}${err.message}`
      ) || [],
  };
}
