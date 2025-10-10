/**
 * @fileoverview Canvas Schema - TypeScript types and validation for Designer canvas documents
 * @author @darianrosebrook
 *
 * Core schema definitions for canvas documents, nodes, and validation.
 * Provides Zod schemas for type-safe document manipulation and Ajv validation.
 */

// Core primitive types
function stryNS_9fa48() {
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
import { ulid } from "ulid";
import { z } from "zod";

// Re-export ULID utilities
export { generateNodeId, generateNodeIds, isValidUlid, getUlidTimestamp, isUlidInTimeRange } from "./ulid.js";

/**
 * ULID validation - 26 character string with specific alphabet
 */
export const ULID = z.string().regex(stryMutAct_9fa48("36") ? /^[^0-9A-HJKMNP-TV-Z]{26}$/ : stryMutAct_9fa48("35") ? /^[0-9A-HJKMNP-TV-Z]$/ : stryMutAct_9fa48("34") ? /^[0-9A-HJKMNP-TV-Z]{26}/ : stryMutAct_9fa48("33") ? /[0-9A-HJKMNP-TV-Z]{26}$/ : (stryCov_9fa48("33", "34", "35", "36"), /^[0-9A-HJKMNP-TV-Z]{26}$/));

/**
 * Semantic key pattern for stable node identification
 * Uses dot notation for hierarchy (e.g., 'hero.title', 'nav.items[0]')
 */
export const SemanticKey = z.string().regex(stryMutAct_9fa48("46") ? /^[a-z][a-z0-9]*(\.[a-z0-9]+|\[[^0-9]+\])*$/ : stryMutAct_9fa48("45") ? /^[a-z][a-z0-9]*(\.[a-z0-9]+|\[[0-9]\])*$/ : stryMutAct_9fa48("44") ? /^[a-z][a-z0-9]*(\.[^a-z0-9]+|\[[0-9]+\])*$/ : stryMutAct_9fa48("43") ? /^[a-z][a-z0-9]*(\.[a-z0-9]|\[[0-9]+\])*$/ : stryMutAct_9fa48("42") ? /^[a-z][a-z0-9]*(\.[a-z0-9]+|\[[0-9]+\])$/ : stryMutAct_9fa48("41") ? /^[a-z][^a-z0-9]*(\.[a-z0-9]+|\[[0-9]+\])*$/ : stryMutAct_9fa48("40") ? /^[a-z][a-z0-9](\.[a-z0-9]+|\[[0-9]+\])*$/ : stryMutAct_9fa48("39") ? /^[^a-z][a-z0-9]*(\.[a-z0-9]+|\[[0-9]+\])*$/ : stryMutAct_9fa48("38") ? /^[a-z][a-z0-9]*(\.[a-z0-9]+|\[[0-9]+\])*/ : stryMutAct_9fa48("37") ? /[a-z][a-z0-9]*(\.[a-z0-9]+|\[[0-9]+\])*$/ : (stryCov_9fa48("37", "38", "39", "40", "41", "42", "43", "44", "45", "46"), /^[a-z][a-z0-9]*(\.[a-z0-9]+|\[[0-9]+\])*$/)).optional();

/**
 * Rectangle geometry type
 */
export const Rect = z.object(stryMutAct_9fa48("47") ? {} : (stryCov_9fa48("47"), {
  x: z.number(),
  y: z.number(),
  width: stryMutAct_9fa48("48") ? z.number().max(0) : (stryCov_9fa48("48"), z.number().min(0)),
  height: stryMutAct_9fa48("49") ? z.number().max(0) : (stryCov_9fa48("49"), z.number().min(0))
}));

/**
 * Text styling properties
 */
export const TextStyle = z.object(stryMutAct_9fa48("50") ? {} : (stryCov_9fa48("50"), {
  family: z.string().optional(),
  size: z.number().optional(),
  lineHeight: z.number().optional(),
  weight: z.string().optional(),
  letterSpacing: z.number().optional(),
  color: z.string().optional()
}));

/**
 * Style properties for visual elements
 */
export const Style = z.object(stryMutAct_9fa48("51") ? {} : (stryCov_9fa48("51"), {
  fills: z.array(z.any()).optional(),
  strokes: z.array(z.any()).optional(),
  radius: z.number().optional(),
  opacity: stryMutAct_9fa48("53") ? z.number().max(0).max(1).optional() : stryMutAct_9fa48("52") ? z.number().min(0).min(1).optional() : (stryCov_9fa48("52", "53"), z.number().min(0).max(1).optional()),
  shadow: z.any().optional()
}));

/**
 * Base node properties shared by all node types
 */
const BaseNode = z.object(stryMutAct_9fa48("54") ? {} : (stryCov_9fa48("54"), {
  id: ULID,
  type: z.string(),
  name: z.string(),
  visible: z.boolean().default(stryMutAct_9fa48("55") ? false : (stryCov_9fa48("55"), true)),
  frame: Rect,
  style: Style.optional(),
  data: z.record(z.any()).optional(),
  bind: z.any().optional()
}));

/**
 * Text node type
 */
export const TextNode = BaseNode.extend(stryMutAct_9fa48("56") ? {} : (stryCov_9fa48("56"), {
  type: z.literal(stryMutAct_9fa48("57") ? "" : (stryCov_9fa48("57"), "text")),
  text: z.string(),
  textStyle: TextStyle.optional()
}));

/**
 * Frame node type (container for other nodes)
 */
export const FrameNode = BaseNode.extend(stryMutAct_9fa48("58") ? {} : (stryCov_9fa48("58"), {
  type: z.literal(stryMutAct_9fa48("59") ? "" : (stryCov_9fa48("59"), "frame")),
  layout: z.record(z.any()).optional(),
  children: z.lazy(stryMutAct_9fa48("60") ? () => undefined : (stryCov_9fa48("60"), () => Node.array())).default(stryMutAct_9fa48("61") ? ["Stryker was here"] : (stryCov_9fa48("61"), []))
}));

/**
 * Component instance node type (references external components)
 */
export const ComponentInstanceNode = BaseNode.extend(stryMutAct_9fa48("62") ? {} : (stryCov_9fa48("62"), {
  type: z.literal(stryMutAct_9fa48("63") ? "" : (stryCov_9fa48("63"), "component")),
  componentKey: z.string(),
  props: z.record(z.any()).default({})
}));

/**
 * Union type for all possible node types
 */
export const Node: z.ZodType<any> = z.union(stryMutAct_9fa48("64") ? [] : (stryCov_9fa48("64"), [FrameNode, TextNode, ComponentInstanceNode]));

/**
 * Artboard definition
 */
export const Artboard = z.object(stryMutAct_9fa48("65") ? {} : (stryCov_9fa48("65"), {
  id: ULID,
  name: z.string(),
  frame: Rect,
  children: Node.array().default(stryMutAct_9fa48("66") ? ["Stryker was here"] : (stryCov_9fa48("66"), []))
}));

/**
 * Complete canvas document - current version
 */
export const CanvasDocument = z.object(stryMutAct_9fa48("67") ? {} : (stryCov_9fa48("67"), {
  schemaVersion: z.literal(stryMutAct_9fa48("68") ? "" : (stryCov_9fa48("68"), "0.1.0")),
  id: ULID,
  name: z.string(),
  artboards: stryMutAct_9fa48("69") ? Artboard.array().max(1) : (stryCov_9fa48("69"), Artboard.array().min(1))
}));

/**
 * Any canvas document (for migration purposes)
 */
export const AnyCanvasDocument = z.object(stryMutAct_9fa48("70") ? {} : (stryCov_9fa48("70"), {
  schemaVersion: z.string(),
  id: ULID,
  name: z.string(),
  artboards: stryMutAct_9fa48("71") ? z.any().array().max(1) : (stryCov_9fa48("71"), z.any().array().min(1))
}));

/**
 * Component definition for reusable visual components
 */
export const ComponentDefinition = z.object(stryMutAct_9fa48("72") ? {} : (stryCov_9fa48("72"), {
  id: ULID,
  name: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).default(stryMutAct_9fa48("73") ? ["Stryker was here"] : (stryCov_9fa48("73"), [])),
  version: z.string().default(stryMutAct_9fa48("74") ? "" : (stryCov_9fa48("74"), "1.0.0")),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  // The visual representation as a node subtree
  rootNode: Node,
  // Component properties that can be customized
  properties: z.record(z.object(stryMutAct_9fa48("75") ? {} : (stryCov_9fa48("75"), {
    type: z.string(),
    defaultValue: z.any(),
    description: z.string().optional(),
    required: z.boolean().default(stryMutAct_9fa48("76") ? true : (stryCov_9fa48("76"), false))
  }))).default({})
}));

/**
 * Component library - collection of reusable components
 */
export const ComponentLibrary = z.object(stryMutAct_9fa48("77") ? {} : (stryCov_9fa48("77"), {
  version: z.literal(stryMutAct_9fa48("78") ? "" : (stryCov_9fa48("78"), "1.0.0")),
  id: ULID,
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  components: ComponentDefinition.array().default(stryMutAct_9fa48("79") ? ["Stryker was here"] : (stryCov_9fa48("79"), []))
}));

/**
 * TypeScript type exports for external use
 */
export type ULIDType = z.infer<typeof ULID>;
export type SemanticKeyType = z.infer<typeof SemanticKey>;
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
export type AnyCanvasDocumentType = z.infer<typeof AnyCanvasDocument>;
export type ComponentDefinitionType = z.infer<typeof ComponentDefinition>;
export type ComponentLibraryType = z.infer<typeof ComponentLibrary>;

/**
 * JSON Patch operation for document mutations
 */
export const Patch = z.object(stryMutAct_9fa48("80") ? {} : (stryCov_9fa48("80"), {
  path: z.array(z.union(stryMutAct_9fa48("81") ? [] : (stryCov_9fa48("81"), [z.string(), z.number()]))),
  op: z.enum(stryMutAct_9fa48("82") ? [] : (stryCov_9fa48("82"), [stryMutAct_9fa48("83") ? "" : (stryCov_9fa48("83"), "set"), stryMutAct_9fa48("84") ? "" : (stryCov_9fa48("84"), "insert"), stryMutAct_9fa48("85") ? "" : (stryCov_9fa48("85"), "remove")])),
  value: z.any().optional()
}));
export type PatchType = z.infer<typeof Patch>;

/**
 * Schema validation function with migration support
 * @param doc Document to validate (may be outdated schema version)
 * @returns Validation result with parsed document or errors
 */
export function validateDocument(doc: unknown): {
  success: boolean;
  data?: CanvasDocumentType;
  errors?: string[];
  migrated?: boolean;
} {
  if (stryMutAct_9fa48("86")) {
    {}
  } else {
    stryCov_9fa48("86");
    try {
      if (stryMutAct_9fa48("87")) {
        {}
      } else {
        stryCov_9fa48("87");
        // First try to parse as current schema version
        const result = CanvasDocument.parse(doc);
        return stryMutAct_9fa48("88") ? {} : (stryCov_9fa48("88"), {
          success: stryMutAct_9fa48("89") ? false : (stryCov_9fa48("89"), true),
          data: result,
          migrated: stryMutAct_9fa48("90") ? true : (stryCov_9fa48("90"), false)
        });
      }
    } catch (currentVersionError) {
      if (stryMutAct_9fa48("91")) {
        {}
      } else {
        stryCov_9fa48("91");
        // If that fails, try to parse as any document for migration
        try {
          if (stryMutAct_9fa48("92")) {
            {}
          } else {
            stryCov_9fa48("92");
            const anyDoc = AnyCanvasDocument.parse(doc);

            // Check if migration is needed and available
            if (stryMutAct_9fa48("94") ? false : stryMutAct_9fa48("93") ? true : (stryCov_9fa48("93", "94"), needsMigration(anyDoc.schemaVersion))) {
              if (stryMutAct_9fa48("95")) {
                {}
              } else {
                stryCov_9fa48("95");
                try {
                  if (stryMutAct_9fa48("96")) {
                    {}
                  } else {
                    stryCov_9fa48("96");
                    const migratedDoc = migrateDocument(anyDoc);
                    return stryMutAct_9fa48("97") ? {} : (stryCov_9fa48("97"), {
                      success: stryMutAct_9fa48("98") ? false : (stryCov_9fa48("98"), true),
                      data: migratedDoc,
                      migrated: stryMutAct_9fa48("99") ? false : (stryCov_9fa48("99"), true)
                    });
                  }
                } catch (migrationError) {
                  if (stryMutAct_9fa48("100")) {
                    {}
                  } else {
                    stryCov_9fa48("100");
                    return stryMutAct_9fa48("101") ? {} : (stryCov_9fa48("101"), {
                      success: stryMutAct_9fa48("102") ? true : (stryCov_9fa48("102"), false),
                      errors: stryMutAct_9fa48("103") ? [] : (stryCov_9fa48("103"), [stryMutAct_9fa48("104") ? `` : (stryCov_9fa48("104"), `Migration failed: ${migrationError instanceof Error ? migrationError.message : stryMutAct_9fa48("105") ? "" : (stryCov_9fa48("105"), "Unknown migration error")}`)])
                    });
                  }
                }
              }
            } else {
              if (stryMutAct_9fa48("106")) {
                {}
              } else {
                stryCov_9fa48("106");
                // Document claims to be current version but failed validation
                // Try to repair it by adding missing required properties
                try {
                  if (stryMutAct_9fa48("107")) {
                    {}
                  } else {
                    stryCov_9fa48("107");
                    const repairedDoc = repairDocument(anyDoc);
                    return stryMutAct_9fa48("108") ? {} : (stryCov_9fa48("108"), {
                      success: stryMutAct_9fa48("109") ? false : (stryCov_9fa48("109"), true),
                      data: repairedDoc,
                      migrated: stryMutAct_9fa48("110") ? false : (stryCov_9fa48("110"), true)
                    });
                  }
                } catch (repairError) {
                  if (stryMutAct_9fa48("111")) {
                    {}
                  } else {
                    stryCov_9fa48("111");
                    // Repair failed, return original validation errors
                    if (stryMutAct_9fa48("113") ? false : stryMutAct_9fa48("112") ? true : (stryCov_9fa48("112", "113"), currentVersionError instanceof z.ZodError)) {
                      if (stryMutAct_9fa48("114")) {
                        {}
                      } else {
                        stryCov_9fa48("114");
                        return stryMutAct_9fa48("115") ? {} : (stryCov_9fa48("115"), {
                          success: stryMutAct_9fa48("116") ? true : (stryCov_9fa48("116"), false),
                          errors: currentVersionError.errors.map(stryMutAct_9fa48("117") ? () => undefined : (stryCov_9fa48("117"), err => stryMutAct_9fa48("118") ? `` : (stryCov_9fa48("118"), `${err.path.join(stryMutAct_9fa48("119") ? "" : (stryCov_9fa48("119"), "."))}: ${err.message}`)))
                        });
                      }
                    }
                    return stryMutAct_9fa48("120") ? {} : (stryCov_9fa48("120"), {
                      success: stryMutAct_9fa48("121") ? true : (stryCov_9fa48("121"), false),
                      errors: stryMutAct_9fa48("122") ? [] : (stryCov_9fa48("122"), [repairError instanceof Error ? repairError.message : stryMutAct_9fa48("123") ? "" : (stryCov_9fa48("123"), "Unknown repair error")])
                    });
                  }
                }
              }
            }
          }
        } catch (_parseError) {
          if (stryMutAct_9fa48("124")) {
            {}
          } else {
            stryCov_9fa48("124");
            // Document doesn't match any known schema structure
            if (stryMutAct_9fa48("126") ? false : stryMutAct_9fa48("125") ? true : (stryCov_9fa48("125", "126"), currentVersionError instanceof z.ZodError)) {
              if (stryMutAct_9fa48("127")) {
                {}
              } else {
                stryCov_9fa48("127");
                return stryMutAct_9fa48("128") ? {} : (stryCov_9fa48("128"), {
                  success: stryMutAct_9fa48("129") ? true : (stryCov_9fa48("129"), false),
                  errors: currentVersionError.errors.map(stryMutAct_9fa48("130") ? () => undefined : (stryCov_9fa48("130"), err => stryMutAct_9fa48("131") ? `` : (stryCov_9fa48("131"), `${err.path.join(stryMutAct_9fa48("132") ? "" : (stryCov_9fa48("132"), "."))}: ${err.message}`)))
                });
              }
            }
            return stryMutAct_9fa48("133") ? {} : (stryCov_9fa48("133"), {
              success: stryMutAct_9fa48("134") ? true : (stryCov_9fa48("134"), false),
              errors: stryMutAct_9fa48("135") ? [] : (stryCov_9fa48("135"), [stryMutAct_9fa48("136") ? "" : (stryCov_9fa48("136"), "Document structure is invalid")])
            });
          }
        }
      }
    }
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
  if (stryMutAct_9fa48("137")) {
    {}
  } else {
    stryCov_9fa48("137");
    return ulid();
  }
}

/**
 * Canonical JSON serialization with deterministic output
 * @param obj Object to serialize
 * @returns Deterministic JSON string with sorted keys, fixed spacing, and newline EOF
 */
export function canonicalizeDocument(obj: any): string {
  if (stryMutAct_9fa48("138")) {
    {}
  } else {
    stryCov_9fa48("138");
    return JSON.stringify(obj, stryMutAct_9fa48("139") ? Object.keys(obj) : (stryCov_9fa48("139"), Object.keys(obj).sort()), 2) + (stryMutAct_9fa48("140") ? "" : (stryCov_9fa48("140"), "\n"));
  }
}

/**
 * Legacy alias for backwards compatibility
 */
export const canonicalSerialize = canonicalizeDocument;

/**
 * Migration functions for different schema versions
 */
export const migrations = stryMutAct_9fa48("141") ? {} : (stryCov_9fa48("141"), {
  /**
   * Migrate from version 0.0.1 to 0.1.0
   * (Example migration - adjust based on actual schema changes)
   */
  "0.0.1": (doc: any): CanvasDocumentType => {
    if (stryMutAct_9fa48("142")) {
      {}
    } else {
      stryCov_9fa48("142");
      // Example migration logic - in real scenarios this would handle
      // structural changes between versions
      const artboards = (stryMutAct_9fa48("145") ? doc.artboards && [] : stryMutAct_9fa48("144") ? false : stryMutAct_9fa48("143") ? true : (stryCov_9fa48("143", "144", "145"), doc.artboards || (stryMutAct_9fa48("146") ? ["Stryker was here"] : (stryCov_9fa48("146"), [])))).map(stryMutAct_9fa48("147") ? () => undefined : (stryCov_9fa48("147"), (artboard: any) => stryMutAct_9fa48("148") ? {} : (stryCov_9fa48("148"), {
        id: stryMutAct_9fa48("151") ? artboard.id && generateULID() : stryMutAct_9fa48("150") ? false : stryMutAct_9fa48("149") ? true : (stryCov_9fa48("149", "150", "151"), artboard.id || generateULID()),
        name: stryMutAct_9fa48("154") ? artboard.name && "Artboard" : stryMutAct_9fa48("153") ? false : stryMutAct_9fa48("152") ? true : (stryCov_9fa48("152", "153", "154"), artboard.name || (stryMutAct_9fa48("155") ? "" : (stryCov_9fa48("155"), "Artboard"))),
        frame: stryMutAct_9fa48("158") ? artboard.frame && {
          x: 0,
          y: 0,
          width: 1440,
          height: 1024
        } : stryMutAct_9fa48("157") ? false : stryMutAct_9fa48("156") ? true : (stryCov_9fa48("156", "157", "158"), artboard.frame || (stryMutAct_9fa48("159") ? {} : (stryCov_9fa48("159"), {
          x: 0,
          y: 0,
          width: 1440,
          height: 1024
        }))),
        children: stryMutAct_9fa48("162") ? artboard.children && [] : stryMutAct_9fa48("161") ? false : stryMutAct_9fa48("160") ? true : (stryCov_9fa48("160", "161", "162"), artboard.children || (stryMutAct_9fa48("163") ? ["Stryker was here"] : (stryCov_9fa48("163"), [])))
      })));

      // If no artboards, create a default one
      if (stryMutAct_9fa48("166") ? artboards.length !== 0 : stryMutAct_9fa48("165") ? false : stryMutAct_9fa48("164") ? true : (stryCov_9fa48("164", "165", "166"), artboards.length === 0)) {
        if (stryMutAct_9fa48("167")) {
          {}
        } else {
          stryCov_9fa48("167");
          artboards.push(stryMutAct_9fa48("168") ? {} : (stryCov_9fa48("168"), {
            id: generateULID(),
            name: stryMutAct_9fa48("169") ? "" : (stryCov_9fa48("169"), "Artboard"),
            frame: stryMutAct_9fa48("170") ? {} : (stryCov_9fa48("170"), {
              x: 0,
              y: 0,
              width: 1440,
              height: 1024
            }),
            children: stryMutAct_9fa48("171") ? ["Stryker was here"] : (stryCov_9fa48("171"), [])
          }));
        }
      }
      return stryMutAct_9fa48("172") ? {} : (stryCov_9fa48("172"), {
        schemaVersion: stryMutAct_9fa48("173") ? "" : (stryCov_9fa48("173"), "0.1.0"),
        id: stryMutAct_9fa48("176") ? doc.id && generateULID() : stryMutAct_9fa48("175") ? false : stryMutAct_9fa48("174") ? true : (stryCov_9fa48("174", "175", "176"), doc.id || generateULID()),
        name: stryMutAct_9fa48("179") ? doc.name && "Untitled" : stryMutAct_9fa48("178") ? false : stryMutAct_9fa48("177") ? true : (stryCov_9fa48("177", "178", "179"), doc.name || (stryMutAct_9fa48("180") ? "" : (stryCov_9fa48("180"), "Untitled"))),
        artboards
      });
    }
  },
  /**
   * Migrate from version 0.1.0 to 0.2.0 (future version)
   * This would handle future schema changes
   */
  "0.2.0": (doc: CanvasDocumentType): CanvasDocumentType => {
    if (stryMutAct_9fa48("181")) {
      {}
    } else {
      stryCov_9fa48("181");
      // Future migration logic
      return doc;
    }
  }
});

/**
 * Get the latest schema version
 */
export const LATEST_SCHEMA_VERSION = stryMutAct_9fa48("182") ? "" : (stryCov_9fa48("182"), "0.1.0");

/**
 * Performance and memory budget constants
 */
export const PERFORMANCE_BUDGETS = {
  // Maximum nodes per document (performance threshold)
  MAX_NODES_PER_DOCUMENT: 10000,
  // Maximum artboards per document
  MAX_ARTBOARDS_PER_DOCUMENT: 100,
  // Maximum nesting depth for nodes
  MAX_NESTING_DEPTH: 50,
  // Memory budget in MB for canvas operations
  MEMORY_BUDGET_MB: 100,
  // Timeout for complex operations in milliseconds
  OPERATION_TIMEOUT_MS: 30000
} as const;

/**
 * Check if a schema version needs migration
 */
export function needsMigration(schemaVersion: string): boolean {
  if (stryMutAct_9fa48("183")) {
    {}
  } else {
    stryCov_9fa48("183");
    return stryMutAct_9fa48("186") ? schemaVersion === LATEST_SCHEMA_VERSION : stryMutAct_9fa48("185") ? false : stryMutAct_9fa48("184") ? true : (stryCov_9fa48("184", "185", "186"), schemaVersion !== LATEST_SCHEMA_VERSION);
  }
}

/**
 * Repair a document that has current schema version but missing required fields
 */
export function repairDocument(doc: any): CanvasDocumentType {
  if (stryMutAct_9fa48("187")) {
    {}
  } else {
    stryCov_9fa48("187");
    // Deep clone to avoid mutating the original
    const repaired = JSON.parse(JSON.stringify(doc));

    // Ensure all artboards have required frame property
    if (stryMutAct_9fa48("190") ? repaired.artboards || Array.isArray(repaired.artboards) : stryMutAct_9fa48("189") ? false : stryMutAct_9fa48("188") ? true : (stryCov_9fa48("188", "189", "190"), repaired.artboards && Array.isArray(repaired.artboards))) {
      if (stryMutAct_9fa48("191")) {
        {}
      } else {
        stryCov_9fa48("191");
        repaired.artboards = repaired.artboards.map((artboard: any) => {
          if (stryMutAct_9fa48("192")) {
            {}
          } else {
            stryCov_9fa48("192");
            if (stryMutAct_9fa48("195") ? false : stryMutAct_9fa48("194") ? true : stryMutAct_9fa48("193") ? artboard.frame : (stryCov_9fa48("193", "194", "195"), !artboard.frame)) {
              if (stryMutAct_9fa48("196")) {
                {}
              } else {
                stryCov_9fa48("196");
                artboard.frame = stryMutAct_9fa48("197") ? {} : (stryCov_9fa48("197"), {
                  x: 0,
                  y: 0,
                  width: 1440,
                  height: 1024
                });
              }
            }
            // Ensure frame has all required properties
            if (stryMutAct_9fa48("200") ? typeof artboard.frame.x === "number" : stryMutAct_9fa48("199") ? false : stryMutAct_9fa48("198") ? true : (stryCov_9fa48("198", "199", "200"), typeof artboard.frame.x !== (stryMutAct_9fa48("201") ? "" : (stryCov_9fa48("201"), "number")))) {
              if (stryMutAct_9fa48("202")) {
                {}
              } else {
                stryCov_9fa48("202");
                artboard.frame.x = 0;
              }
            }
            if (stryMutAct_9fa48("205") ? typeof artboard.frame.y === "number" : stryMutAct_9fa48("204") ? false : stryMutAct_9fa48("203") ? true : (stryCov_9fa48("203", "204", "205"), typeof artboard.frame.y !== (stryMutAct_9fa48("206") ? "" : (stryCov_9fa48("206"), "number")))) {
              if (stryMutAct_9fa48("207")) {
                {}
              } else {
                stryCov_9fa48("207");
                artboard.frame.y = 0;
              }
            }
            if (stryMutAct_9fa48("210") ? typeof artboard.frame.width === "number" : stryMutAct_9fa48("209") ? false : stryMutAct_9fa48("208") ? true : (stryCov_9fa48("208", "209", "210"), typeof artboard.frame.width !== (stryMutAct_9fa48("211") ? "" : (stryCov_9fa48("211"), "number")))) {
              if (stryMutAct_9fa48("212")) {
                {}
              } else {
                stryCov_9fa48("212");
                artboard.frame.width = 1440;
              }
            }
            if (stryMutAct_9fa48("215") ? typeof artboard.frame.height === "number" : stryMutAct_9fa48("214") ? false : stryMutAct_9fa48("213") ? true : (stryCov_9fa48("213", "214", "215"), typeof artboard.frame.height !== (stryMutAct_9fa48("216") ? "" : (stryCov_9fa48("216"), "number")))) {
              if (stryMutAct_9fa48("217")) {
                {}
              } else {
                stryCov_9fa48("217");
                artboard.frame.height = 1024;
              }
            }

            // Ensure children array exists
            if (stryMutAct_9fa48("220") ? false : stryMutAct_9fa48("219") ? true : stryMutAct_9fa48("218") ? artboard.children : (stryCov_9fa48("218", "219", "220"), !artboard.children)) {
              if (stryMutAct_9fa48("221")) {
                {}
              } else {
                stryCov_9fa48("221");
                artboard.children = stryMutAct_9fa48("222") ? ["Stryker was here"] : (stryCov_9fa48("222"), []);
              }
            }
            return artboard;
          }
        });
      }
    }

    // Ensure document has required properties
    if (stryMutAct_9fa48("225") ? false : stryMutAct_9fa48("224") ? true : stryMutAct_9fa48("223") ? repaired.id : (stryCov_9fa48("223", "224", "225"), !repaired.id)) {
      if (stryMutAct_9fa48("226")) {
        {}
      } else {
        stryCov_9fa48("226");
        repaired.id = generateULID();
      }
    }
    if (stryMutAct_9fa48("229") ? false : stryMutAct_9fa48("228") ? true : stryMutAct_9fa48("227") ? repaired.name : (stryCov_9fa48("227", "228", "229"), !repaired.name)) {
      if (stryMutAct_9fa48("230")) {
        {}
      } else {
        stryCov_9fa48("230");
        repaired.name = stryMutAct_9fa48("231") ? "" : (stryCov_9fa48("231"), "Untitled Document");
      }
    }

    // Validate the repaired document
    try {
      if (stryMutAct_9fa48("232")) {
        {}
      } else {
        stryCov_9fa48("232");
        const result = CanvasDocument.parse(repaired);
        return result;
      }
    } catch (error) {
      if (stryMutAct_9fa48("233")) {
        {}
      } else {
        stryCov_9fa48("233");
        throw new Error(stryMutAct_9fa48("234") ? `` : (stryCov_9fa48("234"), `Document repair failed: ${error instanceof z.ZodError ? error.errors.map(stryMutAct_9fa48("235") ? () => undefined : (stryCov_9fa48("235"), err => stryMutAct_9fa48("236") ? `` : (stryCov_9fa48("236"), `${err.path.join(stryMutAct_9fa48("237") ? "" : (stryCov_9fa48("237"), "."))}: ${err.message}`))).join(stryMutAct_9fa48("238") ? "" : (stryCov_9fa48("238"), ", ")) : stryMutAct_9fa48("239") ? "" : (stryCov_9fa48("239"), "Unknown validation error")}`));
      }
    }
  }
}

/**
 * Migrate a document to the latest schema version
 */
export function migrateDocument(doc: any): CanvasDocumentType {
  if (stryMutAct_9fa48("240")) {
    {}
  } else {
    stryCov_9fa48("240");
    let currentDoc = doc;

    // Apply migrations in order until we reach the latest version
    while (stryMutAct_9fa48("241") ? false : (stryCov_9fa48("241"), needsMigration(currentDoc.schemaVersion))) {
      if (stryMutAct_9fa48("242")) {
        {}
      } else {
        stryCov_9fa48("242");
        const migration = migrations[currentDoc.schemaVersion as keyof typeof migrations];
        if (stryMutAct_9fa48("245") ? false : stryMutAct_9fa48("244") ? true : stryMutAct_9fa48("243") ? migration : (stryCov_9fa48("243", "244", "245"), !migration)) {
          if (stryMutAct_9fa48("246")) {
            {}
          } else {
            stryCov_9fa48("246");
            throw new Error(stryMutAct_9fa48("247") ? `` : (stryCov_9fa48("247"), `No migration available for schema version ${currentDoc.schemaVersion}`));
          }
        }
        currentDoc = migration(currentDoc);
      }
    }

    // Validate the final result
    const validation = validateDocument(currentDoc);
    if (stryMutAct_9fa48("250") ? false : stryMutAct_9fa48("249") ? true : stryMutAct_9fa48("248") ? validation.success : (stryCov_9fa48("248", "249", "250"), !validation.success)) {
      if (stryMutAct_9fa48("251")) {
        {}
      } else {
        stryCov_9fa48("251");
        throw new Error(stryMutAct_9fa48("252") ? `` : (stryCov_9fa48("252"), `Migration failed validation: ${stryMutAct_9fa48("253") ? validation.errors.join(", ") : (stryCov_9fa48("253"), validation.errors?.join(stryMutAct_9fa48("254") ? "" : (stryCov_9fa48("254"), ", ")))}`));
      }
    }
    return currentDoc;
  }
}

/**
 * Create an empty canvas document with canonical skeleton
 * @param name Document name (used for both document name and initial artboard)
 * @returns Valid canvas document with one empty artboard
 */
export function createEmptyDocument(name: string): CanvasDocumentType {
  if (stryMutAct_9fa48("255")) {
    {}
  } else {
    stryCov_9fa48("255");
    const docId = generateULID();
    const artboardId = generateULID();
    return stryMutAct_9fa48("256") ? {} : (stryCov_9fa48("256"), {
      schemaVersion: LATEST_SCHEMA_VERSION,
      id: docId,
      name,
      artboards: stryMutAct_9fa48("257") ? [] : (stryCov_9fa48("257"), [stryMutAct_9fa48("258") ? {} : (stryCov_9fa48("258"), {
        id: artboardId,
        name: stryMutAct_9fa48("259") ? `` : (stryCov_9fa48("259"), `${name} Artboard`),
        frame: stryMutAct_9fa48("260") ? {} : (stryCov_9fa48("260"), {
          x: 0,
          y: 0,
          width: 1440,
          height: 1024
        }),
        children: stryMutAct_9fa48("261") ? ["Stryker was here"] : (stryCov_9fa48("261"), [])
      })])
    });
  }
}

/**
 * Create an empty component library
 * @param name Library name
 * @returns Empty component library
 */
export function createEmptyComponentLibrary(name: string): ComponentLibraryType {
  if (stryMutAct_9fa48("262")) {
    {}
  } else {
    stryCov_9fa48("262");
    const now = new Date().toISOString();
    return stryMutAct_9fa48("263") ? {} : (stryCov_9fa48("263"), {
      version: stryMutAct_9fa48("264") ? "" : (stryCov_9fa48("264"), "1.0.0"),
      id: generateULID(),
      name,
      description: stryMutAct_9fa48("265") ? `` : (stryCov_9fa48("265"), `Component library: ${name}`),
      createdAt: now,
      updatedAt: now,
      components: stryMutAct_9fa48("266") ? ["Stryker was here"] : (stryCov_9fa48("266"), [])
    });
  }
}

/**
 * Create a component definition from a canvas node
 * @param node Source node to create component from
 * @param name Component name
 * @param description Component description
 * @returns Component definition
 */
export function createComponentFromNode(node: NodeType, name: string, description?: string, category?: string, tags: string[] = stryMutAct_9fa48("267") ? ["Stryker was here"] : (stryCov_9fa48("267"), [])): ComponentDefinitionType {
  if (stryMutAct_9fa48("268")) {
    {}
  } else {
    stryCov_9fa48("268");
    const now = new Date().toISOString();
    const componentId = generateULID();

    // Create a copy of the node with a new ID for the component root
    const rootNode: NodeType = stryMutAct_9fa48("269") ? {} : (stryCov_9fa48("269"), {
      ...node,
      id: generateULID(),
      // New ID for the component instance
      name: stryMutAct_9fa48("270") ? `` : (stryCov_9fa48("270"), `${name} Instance`)
    });

    // Extract properties that can be customized
    const properties: Record<string, {
      type: string;
      defaultValue: any;
      description?: string;
      required: boolean;
    }> = {};

    // For text nodes, extract text as a customizable property
    if (stryMutAct_9fa48("273") ? node.type === "text" || "text" in node : stryMutAct_9fa48("272") ? false : stryMutAct_9fa48("271") ? true : (stryCov_9fa48("271", "272", "273"), (stryMutAct_9fa48("275") ? node.type !== "text" : stryMutAct_9fa48("274") ? true : (stryCov_9fa48("274", "275"), node.type === (stryMutAct_9fa48("276") ? "" : (stryCov_9fa48("276"), "text")))) && (stryMutAct_9fa48("277") ? "" : (stryCov_9fa48("277"), "text")) in node)) {
      if (stryMutAct_9fa48("278")) {
        {}
      } else {
        stryCov_9fa48("278");
        properties.text = stryMutAct_9fa48("279") ? {} : (stryCov_9fa48("279"), {
          type: stryMutAct_9fa48("280") ? "" : (stryCov_9fa48("280"), "string"),
          defaultValue: node.text,
          description: stryMutAct_9fa48("281") ? "" : (stryCov_9fa48("281"), "Text content"),
          required: stryMutAct_9fa48("282") ? false : (stryCov_9fa48("282"), true)
        });
      }
    }

    // For frame nodes, extract layout properties
    if (stryMutAct_9fa48("285") ? node.type === "frame" || "layout" in node : stryMutAct_9fa48("284") ? false : stryMutAct_9fa48("283") ? true : (stryCov_9fa48("283", "284", "285"), (stryMutAct_9fa48("287") ? node.type !== "frame" : stryMutAct_9fa48("286") ? true : (stryCov_9fa48("286", "287"), node.type === (stryMutAct_9fa48("288") ? "" : (stryCov_9fa48("288"), "frame")))) && (stryMutAct_9fa48("289") ? "" : (stryCov_9fa48("289"), "layout")) in node)) {
      if (stryMutAct_9fa48("290")) {
        {}
      } else {
        stryCov_9fa48("290");
        properties.layout = stryMutAct_9fa48("291") ? {} : (stryCov_9fa48("291"), {
          type: stryMutAct_9fa48("292") ? "" : (stryCov_9fa48("292"), "object"),
          defaultValue: stryMutAct_9fa48("295") ? node.layout && {} : stryMutAct_9fa48("294") ? false : stryMutAct_9fa48("293") ? true : (stryCov_9fa48("293", "294", "295"), node.layout || {}),
          description: stryMutAct_9fa48("296") ? "" : (stryCov_9fa48("296"), "Layout configuration"),
          required: stryMutAct_9fa48("297") ? true : (stryCov_9fa48("297"), false)
        });
      }
    }
    return stryMutAct_9fa48("298") ? {} : (stryCov_9fa48("298"), {
      id: componentId,
      name,
      description,
      category,
      tags,
      version: stryMutAct_9fa48("299") ? "" : (stryCov_9fa48("299"), "1.0.0"),
      createdAt: now,
      updatedAt: now,
      rootNode,
      properties
    });
  }
}

/**
 * Create a component instance node for use in canvas documents
 * @param componentDefinition Component to instantiate
 * @param position Position for the instance
 * @param overrides Property overrides
 * @returns Component instance node
 */
export function createComponentInstance(componentDefinition: ComponentDefinitionType, position: {
  x: number;
  y: number;
  width: number;
  height: number;
}, overrides: Record<string, any> = {}): ComponentInstanceNodeType {
  if (stryMutAct_9fa48("300")) {
    {}
  } else {
    stryCov_9fa48("300");
    const instanceId = generateULID();
    return stryMutAct_9fa48("301") ? {} : (stryCov_9fa48("301"), {
      id: instanceId,
      type: stryMutAct_9fa48("302") ? "" : (stryCov_9fa48("302"), "component"),
      name: stryMutAct_9fa48("303") ? `` : (stryCov_9fa48("303"), `${componentDefinition.name} Instance`),
      visible: stryMutAct_9fa48("304") ? false : (stryCov_9fa48("304"), true),
      frame: position,
      componentKey: componentDefinition.id,
      props: overrides
    });
  }
}

/**
 * Validate a component library
 */
export function validateComponentLibrary(library: unknown): {
  success: boolean;
  data?: ComponentLibraryType;
  errors?: string[];
} {
  if (stryMutAct_9fa48("305")) {
    {}
  } else {
    stryCov_9fa48("305");
    try {
      if (stryMutAct_9fa48("306")) {
        {}
      } else {
        stryCov_9fa48("306");
        const result = ComponentLibrary.parse(library);
        return stryMutAct_9fa48("307") ? {} : (stryCov_9fa48("307"), {
          success: stryMutAct_9fa48("308") ? false : (stryCov_9fa48("308"), true),
          data: result
        });
      }
    } catch (error) {
      if (stryMutAct_9fa48("309")) {
        {}
      } else {
        stryCov_9fa48("309");
        if (stryMutAct_9fa48("311") ? false : stryMutAct_9fa48("310") ? true : (stryCov_9fa48("310", "311"), error instanceof z.ZodError)) {
          if (stryMutAct_9fa48("312")) {
            {}
          } else {
            stryCov_9fa48("312");
            return stryMutAct_9fa48("313") ? {} : (stryCov_9fa48("313"), {
              success: stryMutAct_9fa48("314") ? true : (stryCov_9fa48("314"), false),
              errors: error.errors.map(stryMutAct_9fa48("315") ? () => undefined : (stryCov_9fa48("315"), err => stryMutAct_9fa48("316") ? `` : (stryCov_9fa48("316"), `${err.path.join(stryMutAct_9fa48("317") ? "" : (stryCov_9fa48("317"), "."))}: ${err.message}`)))
            });
          }
        }
        return stryMutAct_9fa48("318") ? {} : (stryCov_9fa48("318"), {
          success: stryMutAct_9fa48("319") ? true : (stryCov_9fa48("319"), false),
          errors: stryMutAct_9fa48("320") ? [] : (stryCov_9fa48("320"), [stryMutAct_9fa48("321") ? "" : (stryCov_9fa48("321"), "Unknown validation error")])
        });
      }
    }
  }
}

/**
 * Performance monitoring and memory budget utilities
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private startTimes = new Map<string, number>();
  private memoryUsage = new Map<string, number>();
  private operationCounts = new Map<string, number>();
  static getInstance(): PerformanceMonitor {
    if (stryMutAct_9fa48("322")) {
      {}
    } else {
      stryCov_9fa48("322");
      if (stryMutAct_9fa48("325") ? false : stryMutAct_9fa48("324") ? true : stryMutAct_9fa48("323") ? PerformanceMonitor.instance : (stryCov_9fa48("323", "324", "325"), !PerformanceMonitor.instance)) {
        if (stryMutAct_9fa48("326")) {
          {}
        } else {
          stryCov_9fa48("326");
          PerformanceMonitor.instance = new PerformanceMonitor();
        }
      }
      return PerformanceMonitor.instance;
    }
  }

  /**
   * Start timing an operation
   */
  startOperation(operationId: string): void {
    if (stryMutAct_9fa48("327")) {
      {}
    } else {
      stryCov_9fa48("327");
      this.startTimes.set(operationId, performance.now());
    }
  }

  /**
   * End timing an operation and record metrics
   */
  endOperation(operationId: string): number {
    if (stryMutAct_9fa48("328")) {
      {}
    } else {
      stryCov_9fa48("328");
      const startTime = this.startTimes.get(operationId);
      if (stryMutAct_9fa48("331") ? false : stryMutAct_9fa48("330") ? true : stryMutAct_9fa48("329") ? startTime : (stryCov_9fa48("329", "330", "331"), !startTime)) {
        if (stryMutAct_9fa48("332")) {
          {}
        } else {
          stryCov_9fa48("332");
          throw new Error(stryMutAct_9fa48("333") ? `` : (stryCov_9fa48("333"), `Operation ${operationId} was not started`));
        }
      }
      const duration = stryMutAct_9fa48("334") ? performance.now() + startTime : (stryCov_9fa48("334"), performance.now() - startTime);
      this.startTimes.delete(operationId);

      // Record metrics
      const count = stryMutAct_9fa48("337") ? this.operationCounts.get(operationId) && 0 : stryMutAct_9fa48("336") ? false : stryMutAct_9fa48("335") ? true : (stryCov_9fa48("335", "336", "337"), this.operationCounts.get(operationId) || 0);
      this.operationCounts.set(operationId, stryMutAct_9fa48("338") ? count - 1 : (stryCov_9fa48("338"), count + 1));
      return duration;
    }
  }

  /**
   * Record memory usage for an operation
   */
  recordMemoryUsage(operationId: string, bytes: number): void {
    if (stryMutAct_9fa48("339")) {
      {}
    } else {
      stryCov_9fa48("339");
      this.memoryUsage.set(operationId, bytes);
    }
  }

  /**
   * Check if operation exceeds memory budget
   */
  exceedsMemoryBudget(bytes: number): boolean {
    if (stryMutAct_9fa48("340")) {
      {}
    } else {
      stryCov_9fa48("340");
      return stryMutAct_9fa48("344") ? bytes <= PERFORMANCE_BUDGETS.MEMORY_BUDGET_MB * 1024 * 1024 : stryMutAct_9fa48("343") ? bytes >= PERFORMANCE_BUDGETS.MEMORY_BUDGET_MB * 1024 * 1024 : stryMutAct_9fa48("342") ? false : stryMutAct_9fa48("341") ? true : (stryCov_9fa48("341", "342", "343", "344"), bytes > (stryMutAct_9fa48("345") ? PERFORMANCE_BUDGETS.MEMORY_BUDGET_MB * 1024 / 1024 : (stryCov_9fa48("345"), (stryMutAct_9fa48("346") ? PERFORMANCE_BUDGETS.MEMORY_BUDGET_MB / 1024 : (stryCov_9fa48("346"), PERFORMANCE_BUDGETS.MEMORY_BUDGET_MB * 1024)) * 1024)));
    }
  }

  /**
   * Check if operation exceeds time budget
   */
  exceedsTimeBudget(milliseconds: number): boolean {
    if (stryMutAct_9fa48("347")) {
      {}
    } else {
      stryCov_9fa48("347");
      return stryMutAct_9fa48("351") ? milliseconds <= PERFORMANCE_BUDGETS.OPERATION_TIMEOUT_MS : stryMutAct_9fa48("350") ? milliseconds >= PERFORMANCE_BUDGETS.OPERATION_TIMEOUT_MS : stryMutAct_9fa48("349") ? false : stryMutAct_9fa48("348") ? true : (stryCov_9fa48("348", "349", "350", "351"), milliseconds > PERFORMANCE_BUDGETS.OPERATION_TIMEOUT_MS);
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(): {
    operationCounts: Record<string, number>;
    memoryUsage: Record<string, number>;
  } {
    if (stryMutAct_9fa48("352")) {
      {}
    } else {
      stryCov_9fa48("352");
      return stryMutAct_9fa48("353") ? {} : (stryCov_9fa48("353"), {
        operationCounts: Object.fromEntries(this.operationCounts),
        memoryUsage: Object.fromEntries(this.memoryUsage)
      });
    }
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    if (stryMutAct_9fa48("354")) {
      {}
    } else {
      stryCov_9fa48("354");
      this.startTimes.clear();
      this.memoryUsage.clear();
      this.operationCounts.clear();
    }
  }
}

/**
 * Check if a document exceeds performance budgets
 */
export function checkDocumentPerformance(document: CanvasDocumentType): {
  withinBudget: boolean;
  warnings: string[];
  metrics: {
    nodeCount: number;
    artboardCount: number;
    maxNestingDepth: number;
    estimatedMemoryMB: number;
  };
} {
  if (stryMutAct_9fa48("355")) {
    {}
  } else {
    stryCov_9fa48("355");
    const warnings: string[] = stryMutAct_9fa48("356") ? ["Stryker was here"] : (stryCov_9fa48("356"), []);
    let nodeCount = 0;
    let maxNestingDepth = 0;

    // Count nodes and check nesting depth
    const countNodes = (nodes: NodeType[], depth: number = 0): void => {
      if (stryMutAct_9fa48("357")) {
        {}
      } else {
        stryCov_9fa48("357");
        for (const node of nodes) {
          if (stryMutAct_9fa48("358")) {
            {}
          } else {
            stryCov_9fa48("358");
            stryMutAct_9fa48("359") ? nodeCount-- : (stryCov_9fa48("359"), nodeCount++);
            maxNestingDepth = stryMutAct_9fa48("360") ? Math.min(maxNestingDepth, depth) : (stryCov_9fa48("360"), Math.max(maxNestingDepth, depth));
            if (stryMutAct_9fa48("362") ? false : stryMutAct_9fa48("361") ? true : (stryCov_9fa48("361", "362"), node.children)) {
              if (stryMutAct_9fa48("363")) {
                {}
              } else {
                stryCov_9fa48("363");
                countNodes(node.children, stryMutAct_9fa48("364") ? depth - 1 : (stryCov_9fa48("364"), depth + 1));
              }
            }
          }
        }
      }
    };
    for (const artboard of document.artboards) {
      if (stryMutAct_9fa48("365")) {
        {}
      } else {
        stryCov_9fa48("365");
        if (stryMutAct_9fa48("367") ? false : stryMutAct_9fa48("366") ? true : (stryCov_9fa48("366", "367"), artboard.children)) {
          if (stryMutAct_9fa48("368")) {
            {}
          } else {
            stryCov_9fa48("368");
            countNodes(artboard.children);
          }
        }
      }
    }

    // Estimate memory usage (rough calculation)
    const estimatedMemoryBytes = stryMutAct_9fa48("369") ? nodeCount / 1024 : (stryCov_9fa48("369"), nodeCount * 1024); // Assume ~1KB per node
    const estimatedMemoryMB = stryMutAct_9fa48("370") ? estimatedMemoryBytes * (1024 * 1024) : (stryCov_9fa48("370"), estimatedMemoryBytes / (stryMutAct_9fa48("371") ? 1024 / 1024 : (stryCov_9fa48("371"), 1024 * 1024)));

    // Check against budgets
    if (stryMutAct_9fa48("375") ? nodeCount <= PERFORMANCE_BUDGETS.MAX_NODES_PER_DOCUMENT : stryMutAct_9fa48("374") ? nodeCount >= PERFORMANCE_BUDGETS.MAX_NODES_PER_DOCUMENT : stryMutAct_9fa48("373") ? false : stryMutAct_9fa48("372") ? true : (stryCov_9fa48("372", "373", "374", "375"), nodeCount > PERFORMANCE_BUDGETS.MAX_NODES_PER_DOCUMENT)) {
      if (stryMutAct_9fa48("376")) {
        {}
      } else {
        stryCov_9fa48("376");
        warnings.push(stryMutAct_9fa48("377") ? `` : (stryCov_9fa48("377"), `Document has ${nodeCount} nodes, exceeding recommended limit of ${PERFORMANCE_BUDGETS.MAX_NODES_PER_DOCUMENT}`));
      }
    }
    if (stryMutAct_9fa48("381") ? document.artboards.length <= PERFORMANCE_BUDGETS.MAX_ARTBOARDS_PER_DOCUMENT : stryMutAct_9fa48("380") ? document.artboards.length >= PERFORMANCE_BUDGETS.MAX_ARTBOARDS_PER_DOCUMENT : stryMutAct_9fa48("379") ? false : stryMutAct_9fa48("378") ? true : (stryCov_9fa48("378", "379", "380", "381"), document.artboards.length > PERFORMANCE_BUDGETS.MAX_ARTBOARDS_PER_DOCUMENT)) {
      if (stryMutAct_9fa48("382")) {
        {}
      } else {
        stryCov_9fa48("382");
        warnings.push(stryMutAct_9fa48("383") ? `` : (stryCov_9fa48("383"), `Document has ${document.artboards.length} artboards, exceeding recommended limit of ${PERFORMANCE_BUDGETS.MAX_ARTBOARDS_PER_DOCUMENT}`));
      }
    }
    if (stryMutAct_9fa48("387") ? maxNestingDepth <= PERFORMANCE_BUDGETS.MAX_NESTING_DEPTH : stryMutAct_9fa48("386") ? maxNestingDepth >= PERFORMANCE_BUDGETS.MAX_NESTING_DEPTH : stryMutAct_9fa48("385") ? false : stryMutAct_9fa48("384") ? true : (stryCov_9fa48("384", "385", "386", "387"), maxNestingDepth > PERFORMANCE_BUDGETS.MAX_NESTING_DEPTH)) {
      if (stryMutAct_9fa48("388")) {
        {}
      } else {
        stryCov_9fa48("388");
        warnings.push(stryMutAct_9fa48("389") ? `` : (stryCov_9fa48("389"), `Document has nesting depth of ${maxNestingDepth}, exceeding recommended limit of ${PERFORMANCE_BUDGETS.MAX_NESTING_DEPTH}`));
      }
    }
    if (stryMutAct_9fa48("393") ? estimatedMemoryMB <= PERFORMANCE_BUDGETS.MEMORY_BUDGET_MB : stryMutAct_9fa48("392") ? estimatedMemoryMB >= PERFORMANCE_BUDGETS.MEMORY_BUDGET_MB : stryMutAct_9fa48("391") ? false : stryMutAct_9fa48("390") ? true : (stryCov_9fa48("390", "391", "392", "393"), estimatedMemoryMB > PERFORMANCE_BUDGETS.MEMORY_BUDGET_MB)) {
      if (stryMutAct_9fa48("394")) {
        {}
      } else {
        stryCov_9fa48("394");
        warnings.push(stryMutAct_9fa48("395") ? `` : (stryCov_9fa48("395"), `Document may use ~${estimatedMemoryMB.toFixed(1)}MB of memory, exceeding budget of ${PERFORMANCE_BUDGETS.MEMORY_BUDGET_MB}MB`));
      }
    }
    return stryMutAct_9fa48("396") ? {} : (stryCov_9fa48("396"), {
      withinBudget: stryMutAct_9fa48("399") ? warnings.length !== 0 : stryMutAct_9fa48("398") ? false : stryMutAct_9fa48("397") ? true : (stryCov_9fa48("397", "398", "399"), warnings.length === 0),
      warnings,
      metrics: stryMutAct_9fa48("400") ? {} : (stryCov_9fa48("400"), {
        nodeCount,
        artboardCount: document.artboards.length,
        maxNestingDepth,
        estimatedMemoryMB
      })
    });
  }
}

/**
 * Validate document with performance budget checks
 */
export function validateDocumentWithPerformance(doc: unknown): {
  success: boolean;
  data?: CanvasDocumentType;
  errors?: string[];
  migrated?: boolean;
  performance?: {
    withinBudget: boolean;
    warnings: string[];
    metrics: {
      nodeCount: number;
      artboardCount: number;
      maxNestingDepth: number;
      estimatedMemoryMB: number;
    };
  };
} {
  if (stryMutAct_9fa48("401")) {
    {}
  } else {
    stryCov_9fa48("401");
    const validation = validateDocument(doc);
    if (stryMutAct_9fa48("404") ? false : stryMutAct_9fa48("403") ? true : stryMutAct_9fa48("402") ? validation.success : (stryCov_9fa48("402", "403", "404"), !validation.success)) {
      if (stryMutAct_9fa48("405")) {
        {}
      } else {
        stryCov_9fa48("405");
        return validation;
      }
    }
    const performance = checkDocumentPerformance(validation.data!);
    return stryMutAct_9fa48("406") ? {} : (stryCov_9fa48("406"), {
      ...validation,
      performance
    });
  }
}