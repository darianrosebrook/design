/**
 * @fileoverview W3C Design Tokens validator
 * @author @darianrosebrook
 */

import { z } from "zod";

/**
 * W3C Design Token value schema
 * Supports different token types according to the W3C Design Tokens specification
 */
export const W3CTokenValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.record(z.string(), z.unknown()), // For composite tokens like typography
  z.array(z.unknown()), // For arrays like font stacks
]);

/**
 * W3C Design Token schema
 * Follows the W3C Design Tokens Format specification
 */
export const W3CTokenSchema = z
  .object({
    $value: W3CTokenValueSchema,
    $type: z.string().optional(),
    $description: z.string().optional(),
    $extensions: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough(); // Allow additional properties

/**
 * W3C Design Tokens collection schema
 * A collection of tokens organized in a hierarchical structure
 */
export const W3CDesignTokensSchema = z.record(z.string(), z.unknown()).refine(
  (data) => {
    // Validate that this looks like a W3C tokens collection
    return validateW3CTokensStructure(data);
  },
  {
    message: "Invalid W3C Design Tokens structure",
  }
);

/**
 * Validation result interface
 */
export interface TokenValidationResult {
  valid: boolean;
  errors: Array<{
    path: string;
    message: string;
    code: string;
  }>;
  warnings: Array<{
    path: string;
    message: string;
    code: string;
  }>;
}

/**
 * Supported token types in W3C Design Tokens spec
 */
export const SUPPORTED_TOKEN_TYPES = [
  "color",
  "dimension",
  "fontFamily",
  "fontWeight",
  "fontSize",
  "lineHeight",
  "letterSpacing",
  "typography",
  "shadow",
  "borderRadius",
  "borderWidth",
  "borderStyle",
  "spacing",
  "opacity",
  "duration",
  "cubicBezier",
  "gradient",
  "number",
  "boolean",
  "string",
] as const;

export type TokenType = (typeof SUPPORTED_TOKEN_TYPES)[number];

/**
 * Validate W3C Design Tokens structure
 */
export function validateW3CTokensStructure(data: any): boolean {
  if (!data || typeof data !== "object") {
    return false;
  }

  // Check if it has the basic structure of W3C tokens
  // Should be a nested object structure, not flat
  function hasTokenStructure(obj: any, path: string[] = []): boolean {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = [...path, key];

      if (value && typeof value === "object" && !Array.isArray(value)) {
        // Check if this is a token (has $value)
        if ("$value" in value) {
          return true; // Found at least one token
        }

        // Recursively check nested objects
        if (hasTokenStructure(value, currentPath)) {
          return true;
        }
      }
    }
    return false;
  }

  return hasTokenStructure(data);
}

/**
 * Validate a single token against W3C spec
 */
export function validateToken(token: any, path: string): TokenValidationResult {
  const errors: TokenValidationResult["errors"] = [];
  const warnings: TokenValidationResult["warnings"] = [];

  // Check if token has required $value
  if (!("$value" in token)) {
    errors.push({
      path,
      message: "Token must have a $value property",
      code: "MISSING_VALUE",
    });
    return { valid: false, errors, warnings };
  }

  // Validate $type if present
  if ("$type" in token) {
    const type = token.$type;
    if (typeof type !== "string") {
      errors.push({
        path: `${path}.$type`,
        message: "$type must be a string",
        code: "INVALID_TYPE",
      });
    } else if (!SUPPORTED_TOKEN_TYPES.includes(type as TokenType)) {
      warnings.push({
        path: `${path}.$type`,
        message: `Unknown token type '${type}'. Supported types: ${SUPPORTED_TOKEN_TYPES.join(
          ", "
        )}`,
        code: "UNKNOWN_TYPE",
      });
    }
  }

  // Validate $description if present
  if ("$description" in token && typeof token.$description !== "string") {
    warnings.push({
      path: `${path}.$description`,
      message: "$description should be a string",
      code: "INVALID_DESCRIPTION",
    });
  }

  // Type-specific validations
  if ("$type" in token) {
    const type = token.$type;
    const value = token.$value;

    switch (type) {
      case "color":
        if (typeof value !== "string" || !isValidColor(value)) {
          errors.push({
            path: `${path}.$value`,
            message: "Color token value must be a valid CSS color",
            code: "INVALID_COLOR",
          });
        }
        break;

      case "dimension":
      case "fontSize":
      case "lineHeight":
      case "letterSpacing":
      case "borderRadius":
      case "borderWidth":
      case "spacing":
        if (!isValidDimension(value)) {
          errors.push({
            path: `${path}.$value`,
            message: `${type} token value must be a valid CSS dimension (number with unit or unitless number)`,
            code: "INVALID_DIMENSION",
          });
        }
        break;

      case "fontWeight":
        if (!isValidFontWeight(value)) {
          errors.push({
            path: `${path}.$value`,
            message:
              "fontWeight token value must be a valid CSS font-weight value",
            code: "INVALID_FONT_WEIGHT",
          });
        }
        break;

      case "opacity":
        if (typeof value !== "number" || value < 0 || value > 1) {
          errors.push({
            path: `${path}.$value`,
            message: "opacity token value must be a number between 0 and 1",
            code: "INVALID_OPACITY",
          });
        }
        break;

      case "duration":
        if (!isValidDuration(value)) {
          errors.push({
            path: `${path}.$value`,
            message: "duration token value must be a valid CSS time value",
            code: "INVALID_DURATION",
          });
        }
        break;

      case "gradient":
        if (typeof value !== "string" || !isValidGradient(value)) {
          errors.push({
            path: `${path}.$value`,
            message: "gradient token value must be a valid CSS gradient",
            code: "INVALID_GRADIENT",
          });
        }
        break;

      case "borderStyle":
        if (typeof value !== "string" || !isValidBorderStyle(value)) {
          errors.push({
            path: `${path}.$value`,
            message: "borderStyle token value must be a valid CSS border style",
            code: "INVALID_BORDER_STYLE",
          });
        }
        break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate entire W3C Design Tokens collection
 */
export function validateW3CDesignTokens(data: any): TokenValidationResult {
  const errors: TokenValidationResult["errors"] = [];
  const warnings: TokenValidationResult["warnings"] = [];

  if (!validateW3CTokensStructure(data)) {
    errors.push({
      path: "",
      message: "Data does not appear to be valid W3C Design Tokens format",
      code: "INVALID_STRUCTURE",
    });
    return { valid: false, errors, warnings };
  }

  // Recursively validate all tokens
  function validateRecursive(obj: any, path: string[] = []): void {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = [...path, key];
      const pathString = currentPath.join(".");

      if (value && typeof value === "object" && !Array.isArray(value)) {
        // Check if this is a token (has $value)
        if ("$value" in value) {
          const tokenResult = validateToken(value, pathString);
          errors.push(...tokenResult.errors);
          warnings.push(...tokenResult.warnings);
        } else {
          // Recursively validate nested objects
          validateRecursive(value, currentPath);
        }
      }
    }
  }

  validateRecursive(data);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate CSS color value
 */
function isValidColor(value: any): boolean {
  if (typeof value !== "string") {
    return false;
  }

  // Skip validation for token references (they start with {)
  if (value.startsWith("{") && value.endsWith("}")) {
    return true;
  }

  // Basic validation for common color formats
  const colorRegex =
    /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})|rgb\(.*\)|rgba\(.*\)|hsl\(.*\)|hsla\(.*\)|oklch\(.*\)|color\(.*\)|hwb\(.*\)|lab\(.*\)|lch\(.*\)$/;
  return (
    colorRegex.test(value) ||
    value === "transparent" ||
    value === "currentColor" ||
    value === "inherit" ||
    value === "initial" ||
    value === "unset"
  );
}

/**
 * Validate CSS dimension value
 */
function isValidDimension(value: any): boolean {
  if (typeof value === "number") {
    return true; // Unitless numbers are valid
  }
  if (typeof value !== "string") {
    return false;
  }

  // Check for valid CSS dimension units
  const dimensionRegex =
    /^-?\d*\.?\d+(px|em|rem|vh|vw|vmin|vmax|%|ex|ch|cm|mm|in|pt|pc|deg|rad|grad|turn|s|ms|fr)?$/;
  return dimensionRegex.test(value);
}

/**
 * Validate CSS font weight value
 */
function isValidFontWeight(value: any): boolean {
  if (typeof value === "number") {
    return value >= 100 && value <= 900 && value % 100 === 0;
  }
  if (typeof value === "string") {
    const validWeights = ["normal", "bold", "lighter", "bolder"];
    return validWeights.includes(value) || /^\d00$/.test(value);
  }
  return false;
}

/**
 * Validate CSS duration value
 */
function isValidDuration(value: any): boolean {
  if (typeof value === "number") {
    return true; // Unitless numbers are valid (interpreted as ms)
  }
  if (typeof value !== "string") {
    return false;
  }

  const durationRegex = /^-?\d*\.?\d+(s|ms)?$/;
  return durationRegex.test(value);
}

/**
 * Validate CSS gradient value
 */
function isValidGradient(value: any): boolean {
  if (typeof value !== "string") {
    return false;
  }

  // Skip validation for token references
  if (value.startsWith("{") && value.endsWith("}")) {
    return true;
  }

  // Basic validation for CSS gradients
  const gradientRegex =
    /^(linear-gradient|radial-gradient|conic-gradient|repeating-linear-gradient|repeating-radial-gradient|repeating-conic-gradient)\(.*\)$/;
  return gradientRegex.test(value);
}

/**
 * Validate CSS border style value
 */
function isValidBorderStyle(value: any): boolean {
  if (typeof value !== "string") {
    return false;
  }

  // Skip validation for token references
  if (value.startsWith("{") && value.endsWith("}")) {
    return true;
  }

  const validBorderStyles = [
    "none",
    "hidden",
    "dotted",
    "dashed",
    "solid",
    "double",
    "groove",
    "ridge",
    "inset",
    "outset",
  ];
  return validBorderStyles.includes(value);
}

/**
 * Extract all token paths from a W3C tokens collection
 */
export function extractTokenPaths(data: any): string[] {
  const paths: string[] = [];

  function extractRecursive(obj: any, currentPath: string[] = []): void {
    for (const [key, value] of Object.entries(obj)) {
      const newPath = [...currentPath, key];

      if (value && typeof value === "object" && !Array.isArray(value)) {
        if ("$value" in value) {
          // This is a token
          paths.push(newPath.join("."));
        } else {
          // Continue recursing
          extractRecursive(value, newPath);
        }
      }
    }
  }

  extractRecursive(data);
  return paths;
}

/**
 * Get token value by path
 */
export function getTokenValue(data: any, path: string): any {
  const parts = path.split(".");
  let current = data;

  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }

  return current?.$value ?? current;
}

/**
 * Convert W3C tokens to a flattened object for easier consumption
 */
export function flattenW3CTokens(data: any): Record<string, any> {
  const flattened: Record<string, any> = {};

  function flattenRecursive(obj: any, currentPath: string[] = []): void {
    for (const [key, value] of Object.entries(obj)) {
      const newPath = [...currentPath, key];

      if (value && typeof value === "object" && !Array.isArray(value)) {
        if ("$value" in value) {
          // This is a token
          flattened[newPath.join(".")] = value.$value;
        } else {
          // Continue recursing
          flattenRecursive(value, newPath);
        }
      }
    }
  }

  flattenRecursive(data);
  return flattened;
}
