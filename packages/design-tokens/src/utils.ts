/**
 * @fileoverview Design token utilities
 * @author @darianrosebrook
 */

import { DesignTokensSchema, type DesignTokens } from "./tokens";

/**
 * Flatten nested token objects into CSS custom property format
 */
export function flattenTokens(
  tokens: DesignTokens,
  prefix = ""
): Record<string, string | number> {
  const result: Record<string, string | number> = {};

  function walk(obj: any, path: string[] = []) {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = [...path, key];

      if (typeof value === "object" && value !== null) {
        walk(value, currentPath);
      } else {
        const cssVar = `--${prefix ? `${prefix}-` : ""}${currentPath.join(
          "-"
        )}`;
        result[cssVar] = value as string | number;
      }
    }
  }

  walk(tokens);
  return result;
}

/**
 * Generate CSS custom properties from tokens
 */
export function tokensToCSS(tokens: DesignTokens, selector = ":root"): string {
  const flattened = flattenTokens(tokens);

  const cssVars = Object.entries(flattened)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join("\n");

  return `${selector} {\n${cssVars}\n}`;
}

/**
 * Get a token value using dot notation path
 */
export function getToken(
  tokens: DesignTokens,
  path: string
): string | number | undefined {
  const parts = path.split(".");
  let current: any = tokens;

  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Set a token value using dot notation path
 */
export function setToken(
  tokens: DesignTokens,
  path: string,
  value: string | number
): DesignTokens {
  const parts = path.split(".");
  const newTokens = JSON.parse(JSON.stringify(tokens)) as DesignTokens;
  let current: any = newTokens;

  // Navigate to the parent object
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part] || typeof current[part] !== "object") {
      current[part] = {};
    }
    current = current[part];
  }

  // Set the final value
  current[parts[parts.length - 1]] = value;

  return newTokens;
}

/**
 * Validate tokens against schema
 */
export function validateTokens(tokens: any): {
  valid: boolean;
  errors: string[];
} {
  const result = DesignTokensSchema.safeParse(tokens);
  if (result.success) {
    return { valid: true, errors: [] };
  } else {
    return {
      valid: false,
      errors: (result.error as any).errors.map(
        (err: any) => `${err.path.join(".")}: ${err.message}`
      ),
    };
  }
}

/**
 * Merge two token objects
 */
export function mergeTokens(
  base: DesignTokens,
  override: Partial<DesignTokens>
): DesignTokens {
  const result = JSON.parse(JSON.stringify(base)) as DesignTokens;

  function deepMerge(target: any, source: any) {
    for (const key in source) {
      if (
        source[key] &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key])
      ) {
        if (!target[key]) target[key] = {};
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }

  deepMerge(result, override);
  return result;
}

/**
 * Generate TypeScript types from tokens
 */
export function tokensToTypes(tokens: DesignTokens): string {
  const types: string[] = [];

  function walk(obj: any, path: string[] = []) {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = [...path, key];

      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        walk(value, currentPath);
      } else {
        const typePath = currentPath.join(".");
        const type = typeof value === "string" ? "string" : "number";
        types.push(`  "${typePath}": ${type};`);
      }
    }
  }

  walk(tokens);

  return `interface DesignTokens {\n${types.join("\n")}\n}`;
}
