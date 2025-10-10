/**
 * @fileoverview Core TypeScript types for Designer canvas documents
 * @author @darianrosebrook
 *
 * These types are generated from the JSON Schema and provide runtime validation
 * and type safety for canvas document operations.
 */function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import { z } from "zod";

/**
 * ULID (Universally Unique Lexicographically Sortable Identifier)
 * 26-character string that is lexicographically sortable and collision-resistant
 */
export const ULID = z.string().regex(stryMutAct_9fa48("410") ? /^[^0-9A-HJKMNP-TV-Z]{26}$/ : stryMutAct_9fa48("409") ? /^[0-9A-HJKMNP-TV-Z]$/ : stryMutAct_9fa48("408") ? /^[0-9A-HJKMNP-TV-Z]{26}/ : stryMutAct_9fa48("407") ? /[0-9A-HJKMNP-TV-Z]{26}$/ : (stryCov_9fa48("407", "408", "409", "410"), /^[0-9A-HJKMNP-TV-Z]{26}$/));

/**
 * Semantic key pattern for stable node identification
 * Uses dot notation for hierarchy (e.g., 'hero.title', 'nav.items[0]')
 */
export const SemanticKey = z.string().regex(stryMutAct_9fa48("420") ? /^[a-z][a-z0-9]*(\.[a-z0-9]+|\[[^0-9]+\])*$/ : stryMutAct_9fa48("419") ? /^[a-z][a-z0-9]*(\.[a-z0-9]+|\[[0-9]\])*$/ : stryMutAct_9fa48("418") ? /^[a-z][a-z0-9]*(\.[^a-z0-9]+|\[[0-9]+\])*$/ : stryMutAct_9fa48("417") ? /^[a-z][a-z0-9]*(\.[a-z0-9]|\[[0-9]+\])*$/ : stryMutAct_9fa48("416") ? /^[a-z][a-z0-9]*(\.[a-z0-9]+|\[[0-9]+\])$/ : stryMutAct_9fa48("415") ? /^[a-z][^a-z0-9]*(\.[a-z0-9]+|\[[0-9]+\])*$/ : stryMutAct_9fa48("414") ? /^[a-z][a-z0-9](\.[a-z0-9]+|\[[0-9]+\])*$/ : stryMutAct_9fa48("413") ? /^[^a-z][a-z0-9]*(\.[a-z0-9]+|\[[0-9]+\])*$/ : stryMutAct_9fa48("412") ? /^[a-z][a-z0-9]*(\.[a-z0-9]+|\[[0-9]+\])*/ : stryMutAct_9fa48("411") ? /[a-z][a-z0-9]*(\.[a-z0-9]+|\[[0-9]+\])*$/ : (stryCov_9fa48("411", "412", "413", "414", "415", "416", "417", "418", "419", "420"), /^[a-z][a-z0-9]*(\.[a-z0-9]+|\[[0-9]+\])*$/)).optional();

/**
 * Rectangle coordinates for positioning nodes
 */
export const Rect = z.object(stryMutAct_9fa48("421") ? {} : (stryCov_9fa48("421"), {
  x: z.number(),
  y: z.number(),
  width: stryMutAct_9fa48("422") ? z.number().max(0) : (stryCov_9fa48("422"), z.number().min(0)),
  height: stryMutAct_9fa48("423") ? z.number().max(0) : (stryCov_9fa48("423"), z.number().min(0))
}));

/**
 * Text styling properties
 */
export const TextStyle = z.object(stryMutAct_9fa48("424") ? {} : (stryCov_9fa48("424"), {
  family: z.string().optional(),
  size: z.number().optional(),
  lineHeight: z.number().optional(),
  weight: z.string().optional(),
  letterSpacing: z.number().optional(),
  color: z.string().optional()
}));

/**
 * Visual styling properties for nodes
 */
export const Style = z.object(stryMutAct_9fa48("425") ? {} : (stryCov_9fa48("425"), {
  fills: z.array(z.any()).optional(),
  strokes: z.array(z.any()).optional(),
  radius: z.number().optional(),
  opacity: stryMutAct_9fa48("427") ? z.number().max(0).max(1).optional() : stryMutAct_9fa48("426") ? z.number().min(0).min(1).optional() : (stryCov_9fa48("426", "427"), z.number().min(0).max(1).optional()),
  shadow: z.any().optional()
}));

/**
 * Base properties shared by all node types
 */
export const BaseNode = z.object(stryMutAct_9fa48("428") ? {} : (stryCov_9fa48("428"), {
  id: ULID,
  type: z.string(),
  name: z.string(),
  visible: z.boolean().default(stryMutAct_9fa48("429") ? false : (stryCov_9fa48("429"), true)),
  frame: Rect,
  style: Style.optional(),
  data: z.record(z.any()).optional(),
  bind: z.any().optional(),
  semanticKey: SemanticKey
}));

/**
 * Frame node - container for other nodes with layout
 */
export const FrameNode = BaseNode.extend(stryMutAct_9fa48("430") ? {} : (stryCov_9fa48("430"), {
  type: z.literal(stryMutAct_9fa48("431") ? "" : (stryCov_9fa48("431"), "frame")),
  layout: z.record(z.any()).optional(),
  children: z.lazy(stryMutAct_9fa48("432") ? () => undefined : (stryCov_9fa48("432"), () => Node.array())).default(stryMutAct_9fa48("433") ? ["Stryker was here"] : (stryCov_9fa48("433"), []))
}));

/**
 * Group node - logical grouping of nodes
 */
export const GroupNode = BaseNode.extend(stryMutAct_9fa48("434") ? {} : (stryCov_9fa48("434"), {
  type: z.literal(stryMutAct_9fa48("435") ? "" : (stryCov_9fa48("435"), "group")),
  children: z.lazy(stryMutAct_9fa48("436") ? () => undefined : (stryCov_9fa48("436"), () => Node.array())).default(stryMutAct_9fa48("437") ? ["Stryker was here"] : (stryCov_9fa48("437"), []))
}));

/**
 * Vector node - SVG path-based graphics
 */
export const VectorNode = BaseNode.extend(stryMutAct_9fa48("438") ? {} : (stryCov_9fa48("438"), {
  type: z.literal(stryMutAct_9fa48("439") ? "" : (stryCov_9fa48("439"), "vector")),
  path: z.string(),
  windingRule: z.enum(stryMutAct_9fa48("440") ? [] : (stryCov_9fa48("440"), [stryMutAct_9fa48("441") ? "" : (stryCov_9fa48("441"), "nonzero"), stryMutAct_9fa48("442") ? "" : (stryCov_9fa48("442"), "evenodd")])).default(stryMutAct_9fa48("443") ? "" : (stryCov_9fa48("443"), "nonzero"))
}));

/**
 * Text node - text content with styling
 */
export const TextNode = BaseNode.extend(stryMutAct_9fa48("444") ? {} : (stryCov_9fa48("444"), {
  type: z.literal(stryMutAct_9fa48("445") ? "" : (stryCov_9fa48("445"), "text")),
  text: z.string(),
  textStyle: TextStyle.optional()
}));

/**
 * Image node - bitmap or vector images
 */
export const ImageNode = BaseNode.extend(stryMutAct_9fa48("446") ? {} : (stryCov_9fa48("446"), {
  type: z.literal(stryMutAct_9fa48("447") ? "" : (stryCov_9fa48("447"), "image")),
  src: z.string(),
  mode: z.enum(stryMutAct_9fa48("448") ? [] : (stryCov_9fa48("448"), [stryMutAct_9fa48("449") ? "" : (stryCov_9fa48("449"), "cover"), stryMutAct_9fa48("450") ? "" : (stryCov_9fa48("450"), "contain"), stryMutAct_9fa48("451") ? "" : (stryCov_9fa48("451"), "fill"), stryMutAct_9fa48("452") ? "" : (stryCov_9fa48("452"), "none")])).default(stryMutAct_9fa48("453") ? "" : (stryCov_9fa48("453"), "cover"))
}));

/**
 * Component instance node - references to React components
 */
export const ComponentInstanceNode = BaseNode.extend(stryMutAct_9fa48("454") ? {} : (stryCov_9fa48("454"), {
  type: z.literal(stryMutAct_9fa48("455") ? "" : (stryCov_9fa48("455"), "component")),
  componentKey: z.string(),
  props: z.record(z.any()).default({})
}));

/**
 * Union type for all possible node types
 */
export const Node: z.ZodType<any> = z.union(stryMutAct_9fa48("456") ? [] : (stryCov_9fa48("456"), [FrameNode, GroupNode, VectorNode, TextNode, ImageNode, ComponentInstanceNode]));

/**
 * Artboard - a canvas page with its own viewport
 */
export const Artboard = z.object(stryMutAct_9fa48("457") ? {} : (stryCov_9fa48("457"), {
  id: ULID,
  name: z.string(),
  frame: Rect,
  children: Node.array().default(stryMutAct_9fa48("458") ? ["Stryker was here"] : (stryCov_9fa48("458"), []))
}));

/**
 * Complete canvas document
 */
export const CanvasDocument = z.object(stryMutAct_9fa48("459") ? {} : (stryCov_9fa48("459"), {
  schemaVersion: z.literal(stryMutAct_9fa48("460") ? "" : (stryCov_9fa48("460"), "0.1.0")),
  id: ULID,
  name: z.string(),
  artboards: stryMutAct_9fa48("461") ? Artboard.array().max(1) : (stryCov_9fa48("461"), Artboard.array().min(1))
}));

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