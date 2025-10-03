/**
 * @fileoverview Core TypeScript types for Designer canvas documents
 * @author @darianrosebrook
 *
 * These types are generated from the JSON Schema and provide runtime validation
 * and type safety for canvas document operations.
 */

import { z } from "zod";

/**
 * ULID (Universally Unique Lexicographically Sortable Identifier)
 * 26-character string that is lexicographically sortable and collision-resistant
 */
export const ULID = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/);

/**
 * Semantic key pattern for stable node identification
 * Uses dot notation for hierarchy (e.g., 'hero.title', 'nav.items[0]')
 */
export const SemanticKey = z
  .string()
  .regex(/^[a-z][a-z0-9]*(\.[a-z0-9]+|\[[0-9]+\])*$/)
  .optional();

/**
 * Rectangle coordinates for positioning nodes
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
 * Visual styling properties for nodes
 */
export const Style = z.object({
  fills: z.array(z.any()).optional(),
  strokes: z.array(z.any()).optional(),
  radius: z.number().optional(),
  opacity: z.number().min(0).max(1).optional(),
  shadow: z.any().optional(),
});

/**
 * Base properties shared by all node types
 */
export const BaseNode = z.object({
  id: ULID,
  type: z.string(),
  name: z.string(),
  visible: z.boolean().default(true),
  frame: Rect,
  style: Style.optional(),
  data: z.record(z.any()).optional(),
  bind: z.any().optional(),
  semanticKey: SemanticKey,
});

/**
 * Frame node - container for other nodes with layout
 */
export const FrameNode = BaseNode.extend({
  type: z.literal("frame"),
  layout: z.record(z.any()).optional(),
  children: z.lazy(() => Node.array()).default([]),
});

/**
 * Group node - logical grouping of nodes
 */
export const GroupNode = BaseNode.extend({
  type: z.literal("group"),
  children: z.lazy(() => Node.array()).default([]),
});

/**
 * Vector node - SVG path-based graphics
 */
export const VectorNode = BaseNode.extend({
  type: z.literal("vector"),
  path: z.string(),
  windingRule: z.enum(["nonzero", "evenodd"]).default("nonzero"),
});

/**
 * Text node - text content with styling
 */
export const TextNode = BaseNode.extend({
  type: z.literal("text"),
  text: z.string(),
  textStyle: TextStyle.optional(),
});

/**
 * Image node - bitmap or vector images
 */
export const ImageNode = BaseNode.extend({
  type: z.literal("image"),
  src: z.string(),
  mode: z.enum(["cover", "contain", "fill", "none"]).default("cover"),
});

/**
 * Component instance node - references to React components
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
  GroupNode,
  VectorNode,
  TextNode,
  ImageNode,
  ComponentInstanceNode,
]);

/**
 * Artboard - a canvas page with its own viewport
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
 * TypeScript types inferred from Zod schemas
 */
export type ULIDType = z.infer<typeof ULID>;
export type SemanticKeyType = z.infer<typeof SemanticKey>;
export type RectType = z.infer<typeof Rect>;
export type TextStyleType = z.infer<typeof TextStyle>;
export type StyleType = z.infer<typeof Style>;
export type BaseNodeType = z.infer<typeof BaseNode>;
export type FrameNodeType = z.infer<typeof FrameNode>;
export type GroupNodeType = z.infer<typeof GroupNode>;
export type VectorNodeType = z.infer<typeof VectorNode>;
export type TextNodeType = z.infer<typeof TextNode>;
export type ImageNodeType = z.infer<typeof ImageNode>;
export type ComponentInstanceNodeType = z.infer<typeof ComponentInstanceNode>;
export type NodeType = z.infer<typeof Node>;
export type ArtboardType = z.infer<typeof Artboard>;
export type CanvasDocumentType = z.infer<typeof CanvasDocument>;
