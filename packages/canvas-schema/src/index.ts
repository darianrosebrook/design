/**
 * @fileoverview Canvas Schema - TypeScript types and validation for Designer canvas documents
 * @author @darianrosebrook
 *
 * Core schema definitions for canvas documents, nodes, and validation.
 * Provides Zod schemas for type-safe document manipulation and Ajv validation.
 */

// Core primitive types
import { ulid } from "ulid";
import { z } from "zod";

// Re-export ULID utilities
export {
  generateNodeId,
  generateNodeIds,
  isValidUlid,
  getUlidTimestamp,
  isUlidInTimeRange,
} from "./ulid.js";

/**
 * ULID validation - 26 character string with specific alphabet
 */
export const ULID = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/);

/**
 * Rectangle geometry type
 */
export const Rect = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().min(0),
  height: z.number().min(0),
});

/**
 * Text styling properties
 */
export const TextStyle = z.object({
  family: z.string().optional(),
  size: z.number().optional(),
  lineHeight: z.number().optional(),
  weight: z.string().optional(),
  letterSpacing: z.number().optional(),
  color: z.string().optional(),
});

/**
 * Style properties for visual elements
 */
export const Style = z.object({
  fills: z.array(z.any()).optional(),
  strokes: z.array(z.any()).optional(),
  radius: z.number().optional(),
  opacity: z.number().min(0).max(1).optional(),
  shadow: z.any().optional(),
});

/**
 * Base node properties shared by all node types
 */
const BaseNode = z.object({
  id: ULID,
  type: z.string(),
  name: z.string(),
  visible: z.boolean().default(true),
  frame: Rect,
  style: Style.optional(),
  data: z.record(z.any()).optional(),
  bind: z.any().optional(),
});

/**
 * Text node type
 */
export const TextNode = BaseNode.extend({
  type: z.literal("text"),
  text: z.string(),
  textStyle: TextStyle.optional(),
});

/**
 * Frame node type (container for other nodes)
 */
export const FrameNode = BaseNode.extend({
  type: z.literal("frame"),
  layout: z.record(z.any()).optional(),
  children: z.lazy(() => Node.array()).default([]),
});

/**
 * Component instance node type (references external components)
 */
export const ComponentInstanceNode = BaseNode.extend({
  type: z.literal("component"),
  componentKey: z.string(),
  props: z.record(z.any()).default({}),
});

/**
 * Union type for all possible node types
 */
export const Node: z.ZodType<any> = z.union([
  FrameNode,
  TextNode,
  ComponentInstanceNode,
]);

/**
 * Artboard definition
 */
export const Artboard = z.object({
  id: ULID,
  name: z.string(),
  frame: Rect,
  children: Node.array().default([]),
});

/**
 * Complete canvas document
 */
export const CanvasDocument = z.object({
  schemaVersion: z.literal("0.1.0"),
  id: ULID,
  name: z.string(),
  artboards: Artboard.array().min(1),
});

/**
 * TypeScript type exports for external use
 */
export type ULIDType = z.infer<typeof ULID>;
export type RectType = z.infer<typeof Rect>;
export type TextStyleType = z.infer<typeof TextStyle>;
export type StyleType = z.infer<typeof Style>;
export type BaseNodeType = z.infer<typeof BaseNode>;
export type TextNodeType = z.infer<typeof TextNode>;
export type FrameNodeType = z.infer<typeof FrameNode>;
export type ComponentInstanceNodeType = z.infer<typeof ComponentInstanceNode>;
export type NodeType = z.infer<typeof Node>;
export type ArtboardType = z.infer<typeof Artboard>;
export type CanvasDocumentType = z.infer<typeof CanvasDocument>;

/**
 * JSON Patch operation for document mutations
 */
export const Patch = z.object({
  path: z.array(z.union([z.string(), z.number()])),
  op: z.enum(["set", "insert", "remove"]),
  value: z.any().optional(),
});

export type PatchType = z.infer<typeof Patch>;

/**
 * Schema validation function
 * @param doc Document to validate
 * @returns Validation result with parsed document or errors
 */
export function validateDocument(doc: unknown): {
  success: boolean;
  data?: CanvasDocumentType;
  errors?: string[];
} {
  try {
    const result = CanvasDocument.parse(doc);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(
          (err) => `${err.path.join(".")}: ${err.message}`
        ),
      };
    }
    return { success: false, errors: ["Unknown validation error"] };
  }
}

/**
 * Alias for validateDocument for backwards compatibility
 */
export const validateCanvasDocument = validateDocument;

/**
 * Generate a new ULID for nodes
 * @returns A new ULID string
 */
export function generateULID(): string {
  return ulid();
}

/**
 * Canonical JSON serialization
 * @param obj Object to serialize
 * @returns Deterministic JSON string
 */
export function canonicalSerialize(obj: any): string {
  return JSON.stringify(obj, Object.keys(obj).sort(), 2);
}
