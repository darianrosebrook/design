/**
 * @fileoverview JSON Schema validation for canvas documents
 * @author @darianrosebrook
 */

import Ajv from "ajv";
import addFormats from "ajv-formats";
import type { CanvasDocumentType } from "./types.js";
import { CanvasDocument } from "./types.js";

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
 * Canvas document validator using Ajv
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

    // TODO: Load schema from file once package structure is set up
    // For now, we'll use a basic validation
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

      // TODO: Add Ajv validation against JSON schema
      // For now, just return success if Zod validation passes

      return {
        valid: true,
        errors: [],
        document: zodResult.data,
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
