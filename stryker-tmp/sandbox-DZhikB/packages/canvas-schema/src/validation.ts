/**
 * @fileoverview JSON Schema validation for canvas documents
 * @author @darianrosebrook
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
import Ajv from "ajv";
import addFormats from "ajv-formats";
import type { CanvasDocumentType, SemanticKeyType } from "./types.js";
import { CanvasDocument } from "./types.js";
import { validateCanvasDocument as ajvValidate } from "./validate.js";

/**
 * Semantic key uniqueness validation error
 */
export interface SemanticKeyValidationError {
  duplicateKey: SemanticKeyType;
  conflictingNodes: Array<{
    id: string;
    name: string;
    path: string;
  }>;
}

/**
 * Validation error details
 */
export interface ValidationError {
  instancePath: string;
  message: string;
  keyword: string;
  params: Record<string, any>;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  document?: CanvasDocumentType;
}

/**
 * Canvas document validator using Ajv and Zod
 */
export class CanvasValidator {
  private ajv: Ajv;
  constructor() {
    if (stryMutAct_9fa48("802")) {
      {}
    } else {
      stryCov_9fa48("802");
      this.ajv = new Ajv(stryMutAct_9fa48("803") ? {} : (stryCov_9fa48("803"), {
        allErrors: stryMutAct_9fa48("804") ? false : (stryCov_9fa48("804"), true),
        verbose: stryMutAct_9fa48("805") ? false : (stryCov_9fa48("805"), true),
        strict: stryMutAct_9fa48("806") ? true : (stryCov_9fa48("806"), false)
      }));

      // Add format validators (URI, etc.)
      addFormats(this.ajv);

      // Schema is now embedded in validate.ts for reliability
    }
  }

  /**
   * Validate a canvas document
   */
  validate(document: unknown): ValidationResult {
    if (stryMutAct_9fa48("807")) {
      {}
    } else {
      stryCov_9fa48("807");
      try {
        if (stryMutAct_9fa48("808")) {
          {}
        } else {
          stryCov_9fa48("808");
          // First, validate with Zod for type safety
          const zodResult = CanvasDocument.safeParse(document);
          if (stryMutAct_9fa48("811") ? false : stryMutAct_9fa48("810") ? true : stryMutAct_9fa48("809") ? zodResult.success : (stryCov_9fa48("809", "810", "811"), !zodResult.success)) {
            if (stryMutAct_9fa48("812")) {
              {}
            } else {
              stryCov_9fa48("812");
              return stryMutAct_9fa48("813") ? {} : (stryCov_9fa48("813"), {
                valid: stryMutAct_9fa48("814") ? true : (stryCov_9fa48("814"), false),
                errors: zodResult.error.errors.map(stryMutAct_9fa48("815") ? () => undefined : (stryCov_9fa48("815"), error => stryMutAct_9fa48("816") ? {} : (stryCov_9fa48("816"), {
                  instancePath: error.path.join(stryMutAct_9fa48("817") ? "" : (stryCov_9fa48("817"), ".")),
                  message: error.message,
                  keyword: stryMutAct_9fa48("818") ? "" : (stryCov_9fa48("818"), "zod"),
                  params: {}
                })))
              });
            }
          }
          const validDocument = zodResult.data;

          // Then, validate with Ajv against JSON schema for deeper validation
          const ajvResult = ajvValidate(document);
          if (stryMutAct_9fa48("821") ? false : stryMutAct_9fa48("820") ? true : stryMutAct_9fa48("819") ? ajvResult.valid : (stryCov_9fa48("819", "820", "821"), !ajvResult.valid)) {
            if (stryMutAct_9fa48("822")) {
              {}
            } else {
              stryCov_9fa48("822");
              return stryMutAct_9fa48("823") ? {} : (stryCov_9fa48("823"), {
                valid: stryMutAct_9fa48("824") ? true : (stryCov_9fa48("824"), false),
                errors: stryMutAct_9fa48("827") ? ajvResult.errors?.map(error => ({
                  instancePath: error.path || "",
                  message: error.message,
                  keyword: "json-schema",
                  params: {}
                })) && [] : stryMutAct_9fa48("826") ? false : stryMutAct_9fa48("825") ? true : (stryCov_9fa48("825", "826", "827"), (stryMutAct_9fa48("828") ? ajvResult.errors.map(error => ({
                  instancePath: error.path || "",
                  message: error.message,
                  keyword: "json-schema",
                  params: {}
                })) : (stryCov_9fa48("828"), ajvResult.errors?.map(stryMutAct_9fa48("829") ? () => undefined : (stryCov_9fa48("829"), error => stryMutAct_9fa48("830") ? {} : (stryCov_9fa48("830"), {
                  instancePath: stryMutAct_9fa48("833") ? error.path && "" : stryMutAct_9fa48("832") ? false : stryMutAct_9fa48("831") ? true : (stryCov_9fa48("831", "832", "833"), error.path || (stryMutAct_9fa48("834") ? "Stryker was here!" : (stryCov_9fa48("834"), ""))),
                  message: error.message,
                  keyword: stryMutAct_9fa48("835") ? "" : (stryCov_9fa48("835"), "json-schema"),
                  params: {}
                }))))) || (stryMutAct_9fa48("836") ? ["Stryker was here"] : (stryCov_9fa48("836"), [])))
              });
            }
          }

          // Additional semantic key validation
          const semanticKeyErrors = this.validateSemanticKeys(validDocument);
          if (stryMutAct_9fa48("840") ? semanticKeyErrors.length <= 0 : stryMutAct_9fa48("839") ? semanticKeyErrors.length >= 0 : stryMutAct_9fa48("838") ? false : stryMutAct_9fa48("837") ? true : (stryCov_9fa48("837", "838", "839", "840"), semanticKeyErrors.length > 0)) {
            if (stryMutAct_9fa48("841")) {
              {}
            } else {
              stryCov_9fa48("841");
              return stryMutAct_9fa48("842") ? {} : (stryCov_9fa48("842"), {
                valid: stryMutAct_9fa48("843") ? true : (stryCov_9fa48("843"), false),
                errors: semanticKeyErrors.map(stryMutAct_9fa48("844") ? () => undefined : (stryCov_9fa48("844"), error => stryMutAct_9fa48("845") ? {} : (stryCov_9fa48("845"), {
                  instancePath: error.conflictingNodes[0].path,
                  message: stryMutAct_9fa48("846") ? `` : (stryCov_9fa48("846"), `Semantic key "${error.duplicateKey}" is not unique. Found in multiple nodes: ${error.conflictingNodes.map(stryMutAct_9fa48("847") ? () => undefined : (stryCov_9fa48("847"), n => n.path)).join(stryMutAct_9fa48("848") ? "" : (stryCov_9fa48("848"), ", "))}`),
                  keyword: stryMutAct_9fa48("849") ? "" : (stryCov_9fa48("849"), "semantic-key-duplicate"),
                  params: stryMutAct_9fa48("850") ? {} : (stryCov_9fa48("850"), {
                    duplicateKey: error.duplicateKey,
                    conflictingNodes: error.conflictingNodes
                  })
                })))
              });
            }
          }
          return stryMutAct_9fa48("851") ? {} : (stryCov_9fa48("851"), {
            valid: stryMutAct_9fa48("852") ? false : (stryCov_9fa48("852"), true),
            errors: stryMutAct_9fa48("853") ? ["Stryker was here"] : (stryCov_9fa48("853"), []),
            document: validDocument
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("854")) {
          {}
        } else {
          stryCov_9fa48("854");
          return stryMutAct_9fa48("855") ? {} : (stryCov_9fa48("855"), {
            valid: stryMutAct_9fa48("856") ? true : (stryCov_9fa48("856"), false),
            errors: stryMutAct_9fa48("857") ? [] : (stryCov_9fa48("857"), [stryMutAct_9fa48("858") ? {} : (stryCov_9fa48("858"), {
              instancePath: stryMutAct_9fa48("859") ? "Stryker was here!" : (stryCov_9fa48("859"), ""),
              message: error instanceof Error ? error.message : stryMutAct_9fa48("860") ? "" : (stryCov_9fa48("860"), "Unknown validation error"),
              keyword: stryMutAct_9fa48("861") ? "" : (stryCov_9fa48("861"), "exception"),
              params: {}
            })])
          });
        }
      }
    }
  }

  /**
   * Validate a partial document (for incremental updates)
   */
  validatePartial(data: unknown): ValidationResult {
    if (stryMutAct_9fa48("862")) {
      {}
    } else {
      stryCov_9fa48("862");
      // For partial validation, we'll be less strict
      // This is useful for validating individual nodes or patches
      try {
        if (stryMutAct_9fa48("863")) {
          {}
        } else {
          stryCov_9fa48("863");
          // Basic structure validation
          if (stryMutAct_9fa48("866") ? typeof data !== "object" && data === null : stryMutAct_9fa48("865") ? false : stryMutAct_9fa48("864") ? true : (stryCov_9fa48("864", "865", "866"), (stryMutAct_9fa48("868") ? typeof data === "object" : stryMutAct_9fa48("867") ? false : (stryCov_9fa48("867", "868"), typeof data !== (stryMutAct_9fa48("869") ? "" : (stryCov_9fa48("869"), "object")))) || (stryMutAct_9fa48("871") ? data !== null : stryMutAct_9fa48("870") ? false : (stryCov_9fa48("870", "871"), data === null)))) {
            if (stryMutAct_9fa48("872")) {
              {}
            } else {
              stryCov_9fa48("872");
              return stryMutAct_9fa48("873") ? {} : (stryCov_9fa48("873"), {
                valid: stryMutAct_9fa48("874") ? true : (stryCov_9fa48("874"), false),
                errors: stryMutAct_9fa48("875") ? [] : (stryCov_9fa48("875"), [stryMutAct_9fa48("876") ? {} : (stryCov_9fa48("876"), {
                  instancePath: stryMutAct_9fa48("877") ? "Stryker was here!" : (stryCov_9fa48("877"), ""),
                  message: stryMutAct_9fa48("878") ? "" : (stryCov_9fa48("878"), "Document must be an object"),
                  keyword: stryMutAct_9fa48("879") ? "" : (stryCov_9fa48("879"), "type"),
                  params: {}
                })])
              });
            }
          }
          return stryMutAct_9fa48("880") ? {} : (stryCov_9fa48("880"), {
            valid: stryMutAct_9fa48("881") ? false : (stryCov_9fa48("881"), true),
            errors: stryMutAct_9fa48("882") ? ["Stryker was here"] : (stryCov_9fa48("882"), [])
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("883")) {
          {}
        } else {
          stryCov_9fa48("883");
          return stryMutAct_9fa48("884") ? {} : (stryCov_9fa48("884"), {
            valid: stryMutAct_9fa48("885") ? true : (stryCov_9fa48("885"), false),
            errors: stryMutAct_9fa48("886") ? [] : (stryCov_9fa48("886"), [stryMutAct_9fa48("887") ? {} : (stryCov_9fa48("887"), {
              instancePath: stryMutAct_9fa48("888") ? "Stryker was here!" : (stryCov_9fa48("888"), ""),
              message: error instanceof Error ? error.message : stryMutAct_9fa48("889") ? "" : (stryCov_9fa48("889"), "Validation error"),
              keyword: stryMutAct_9fa48("890") ? "" : (stryCov_9fa48("890"), "exception"),
              params: {}
            })])
          });
        }
      }
    }
  }

  /**
   * Validate semantic key uniqueness within artboard/component scopes
   */
  validateSemanticKeys(document: CanvasDocumentType): SemanticKeyValidationError[] {
    if (stryMutAct_9fa48("891")) {
      {}
    } else {
      stryCov_9fa48("891");
      const errors: SemanticKeyValidationError[] = stryMutAct_9fa48("892") ? ["Stryker was here"] : (stryCov_9fa48("892"), []);

      // Track semantic keys by scope (artboard level, component subtree level)
      const semanticKeyMap = new Map<string, Array<{
        id: string;
        name: string;
        path: string;
      }>>();

      // Walk through all artboards and collect semantic keys
      for (let artboardIndex = 0; stryMutAct_9fa48("895") ? artboardIndex >= document.artboards.length : stryMutAct_9fa48("894") ? artboardIndex <= document.artboards.length : stryMutAct_9fa48("893") ? false : (stryCov_9fa48("893", "894", "895"), artboardIndex < document.artboards.length); stryMutAct_9fa48("896") ? artboardIndex-- : (stryCov_9fa48("896"), artboardIndex++)) {
        if (stryMutAct_9fa48("897")) {
          {}
        } else {
          stryCov_9fa48("897");
          const artboard = document.artboards[artboardIndex];
          const artboardPrefix = stryMutAct_9fa48("898") ? `` : (stryCov_9fa48("898"), `artboards[${artboardIndex}]`);
          this.collectSemanticKeys(artboard.children, stryMutAct_9fa48("899") ? `` : (stryCov_9fa48("899"), `${artboardPrefix}.children`), semanticKeyMap, errors);
        }
      }
      return errors;
    }
  }

  /**
   * Recursively collect semantic keys and detect duplicates
   */
  private collectSemanticKeys(nodes: any[], currentPath: string, semanticKeyMap: Map<string, Array<{
    id: string;
    name: string;
    path: string;
  }>>, errors: SemanticKeyValidationError[]): void {
    if (stryMutAct_9fa48("900")) {
      {}
    } else {
      stryCov_9fa48("900");
      for (let nodeIndex = 0; stryMutAct_9fa48("903") ? nodeIndex >= nodes.length : stryMutAct_9fa48("902") ? nodeIndex <= nodes.length : stryMutAct_9fa48("901") ? false : (stryCov_9fa48("901", "902", "903"), nodeIndex < nodes.length); stryMutAct_9fa48("904") ? nodeIndex-- : (stryCov_9fa48("904"), nodeIndex++)) {
        if (stryMutAct_9fa48("905")) {
          {}
        } else {
          stryCov_9fa48("905");
          const node = nodes[nodeIndex];
          const nodePath = stryMutAct_9fa48("906") ? `` : (stryCov_9fa48("906"), `${currentPath}[${nodeIndex}]`);

          // Check if this node has a semantic key
          if (stryMutAct_9fa48("908") ? false : stryMutAct_9fa48("907") ? true : (stryCov_9fa48("907", "908"), node.semanticKey)) {
            if (stryMutAct_9fa48("909")) {
              {}
            } else {
              stryCov_9fa48("909");
              const key = node.semanticKey;
              if (stryMutAct_9fa48("912") ? false : stryMutAct_9fa48("911") ? true : stryMutAct_9fa48("910") ? semanticKeyMap.has(key) : (stryCov_9fa48("910", "911", "912"), !semanticKeyMap.has(key))) {
                if (stryMutAct_9fa48("913")) {
                  {}
                } else {
                  stryCov_9fa48("913");
                  semanticKeyMap.set(key, stryMutAct_9fa48("914") ? ["Stryker was here"] : (stryCov_9fa48("914"), []));
                }
              }
              const existingNodes = semanticKeyMap.get(key)!;
              existingNodes.push(stryMutAct_9fa48("915") ? {} : (stryCov_9fa48("915"), {
                id: node.id,
                name: node.name,
                path: nodePath
              }));

              // If we have more than one node with this key, it's a duplicate
              if (stryMutAct_9fa48("919") ? existingNodes.length <= 1 : stryMutAct_9fa48("918") ? existingNodes.length >= 1 : stryMutAct_9fa48("917") ? false : stryMutAct_9fa48("916") ? true : (stryCov_9fa48("916", "917", "918", "919"), existingNodes.length > 1)) {
                if (stryMutAct_9fa48("920")) {
                  {}
                } else {
                  stryCov_9fa48("920");
                  errors.push(stryMutAct_9fa48("921") ? {} : (stryCov_9fa48("921"), {
                    duplicateKey: key,
                    conflictingNodes: stryMutAct_9fa48("922") ? [] : (stryCov_9fa48("922"), [...existingNodes])
                  }));
                }
              }
            }
          }

          // Recurse into children if this node has them
          if (stryMutAct_9fa48("925") ? node.children || Array.isArray(node.children) : stryMutAct_9fa48("924") ? false : stryMutAct_9fa48("923") ? true : (stryCov_9fa48("923", "924", "925"), node.children && Array.isArray(node.children))) {
            if (stryMutAct_9fa48("926")) {
              {}
            } else {
              stryCov_9fa48("926");
              this.collectSemanticKeys(node.children, stryMutAct_9fa48("927") ? `` : (stryCov_9fa48("927"), `${nodePath}.children`), semanticKeyMap, errors);
            }
          }
        }
      }
    }
  }
}

/**
 * Global validator instance
 */
export const validator = new CanvasValidator();

/**
 * Convenience function for validating documents
 */
export function validateCanvasDocument(document: unknown): ValidationResult {
  if (stryMutAct_9fa48("928")) {
    {}
  } else {
    stryCov_9fa48("928");
    return validator.validate(document);
  }
}

/**
 * Convenience function for validating semantic key uniqueness
 */
export function validateSemanticKeys(document: CanvasDocumentType): SemanticKeyValidationError[] {
  if (stryMutAct_9fa48("929")) {
    {}
  } else {
    stryCov_9fa48("929");
    return validator.validateSemanticKeys(document);
  }
}