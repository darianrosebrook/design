/**
 * @fileoverview JSON Schema validation for canvas documents
 * @author @darianrosebrook
 */

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
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false,
    });

    // Add format validators (URI, etc.)
    addFormats(this.ajv);

    // Schema is now embedded in validate.ts for reliability
  }

  /**
   * Validate a canvas document
   */
  validate(document: unknown): ValidationResult {
    try {
      // First, validate with Zod for type safety
      const zodResult = CanvasDocument.safeParse(document);

      if (!zodResult.success) {
        return {
          valid: false,
          errors: zodResult.error.errors.map((error) => ({
            instancePath: error.path.join("."),
            message: error.message,
            keyword: "zod",
            params: {},
          })),
        };
      }

      const validDocument = zodResult.data;

      // Then, validate with Ajv against JSON schema for deeper validation
      const ajvResult = ajvValidate(document);

      if (!ajvResult.valid) {
        return {
          valid: false,
          errors:
            ajvResult.errors?.map((error) => ({
              instancePath: error.path || "",
              message: error.message,
              keyword: "json-schema",
              params: {},
            })) || [],
        };
      }

      // Additional semantic key validation
      const semanticKeyErrors = this.validateSemanticKeys(validDocument);

      if (semanticKeyErrors.length > 0) {
        return {
          valid: false,
          errors: semanticKeyErrors.map((error) => ({
            instancePath: error.conflictingNodes[0].path,
            message: `Semantic key "${
              error.duplicateKey
            }" is not unique. Found in multiple nodes: ${error.conflictingNodes
              .map((n) => n.path)
              .join(", ")}`,
            keyword: "semantic-key-duplicate",
            params: {
              duplicateKey: error.duplicateKey,
              conflictingNodes: error.conflictingNodes,
            },
          })),
        };
      }

      return {
        valid: true,
        errors: [],
        document: validDocument,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [
          {
            instancePath: "",
            message:
              error instanceof Error
                ? error.message
                : "Unknown validation error",
            keyword: "exception",
            params: {},
          },
        ],
      };
    }
  }

  /**
   * Validate a partial document (for incremental updates)
   */
  validatePartial(data: unknown): ValidationResult {
    // For partial validation, we'll be less strict
    // This is useful for validating individual nodes or patches
    try {
      // Basic structure validation
      if (typeof data !== "object" || data === null) {
        return {
          valid: false,
          errors: [
            {
              instancePath: "",
              message: "Document must be an object",
              keyword: "type",
              params: {},
            },
          ],
        };
      }

      return {
        valid: true,
        errors: [],
      };
    } catch (error) {
      return {
        valid: false,
        errors: [
          {
            instancePath: "",
            message:
              error instanceof Error ? error.message : "Validation error",
            keyword: "exception",
            params: {},
          },
        ],
      };
    }
  }

  /**
   * Validate semantic key uniqueness within artboard/component scopes
   */
  validateSemanticKeys(
    document: CanvasDocumentType
  ): SemanticKeyValidationError[] {
    const errors: SemanticKeyValidationError[] = [];

    // Track semantic keys by scope (artboard level, component subtree level)
    const semanticKeyMap = new Map<
      string,
      Array<{
        id: string;
        name: string;
        path: string;
      }>
    >();

    // Walk through all artboards and collect semantic keys
    for (
      let artboardIndex = 0;
      artboardIndex < document.artboards.length;
      artboardIndex++
    ) {
      const artboard = document.artboards[artboardIndex];
      const artboardPrefix = `artboards[${artboardIndex}]`;

      this.collectSemanticKeys(
        artboard.children,
        `${artboardPrefix}.children`,
        semanticKeyMap,
        errors
      );
    }

    return errors;
  }

  /**
   * Recursively collect semantic keys and detect duplicates
   */
  private collectSemanticKeys(
    nodes: any[],
    currentPath: string,
    semanticKeyMap: Map<
      string,
      Array<{
        id: string;
        name: string;
        path: string;
      }>
    >,
    errors: SemanticKeyValidationError[]
  ): void {
    for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex++) {
      const node = nodes[nodeIndex];
      const nodePath = `${currentPath}[${nodeIndex}]`;

      // Check if this node has a semantic key
      if (node.semanticKey) {
        const key = node.semanticKey;

        if (!semanticKeyMap.has(key)) {
          semanticKeyMap.set(key, []);
        }

        const existingNodes = semanticKeyMap.get(key)!;
        existingNodes.push({
          id: node.id,
          name: node.name,
          path: nodePath,
        });

        // If we have more than one node with this key, it's a duplicate
        if (existingNodes.length > 1) {
          errors.push({
            duplicateKey: key,
            conflictingNodes: [...existingNodes],
          });
        }
      }

      // Recurse into children if this node has them
      if (node.children && Array.isArray(node.children)) {
        this.collectSemanticKeys(
          node.children,
          `${nodePath}.children`,
          semanticKeyMap,
          errors
        );
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
  return validator.validate(document);
}

/**
 * Convenience function for validating semantic key uniqueness
 */
export function validateSemanticKeys(
  document: CanvasDocumentType
): SemanticKeyValidationError[] {
  return validator.validateSemanticKeys(document);
}
