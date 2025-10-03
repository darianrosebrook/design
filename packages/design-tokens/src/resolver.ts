/**
 * @fileoverview Token reference resolution
 * @author @darianrosebrook
 */

import type { DesignTokens } from "./tokens";
import { getToken } from "./utils";

/**
 * Options for token reference resolution
 */
export interface ResolveOptions {
  maxDepth?: number;
  strict?: boolean; // Throw on invalid refs vs warn
}

/**
 * Result of token validation
 */
export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    path: string;
    message: string;
  }>;
}

/**
 * Check if a value is a token reference
 * References are strings wrapped in curly braces: {color.brand.primary}
 */
export function isTokenReference(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.startsWith("{") &&
    value.endsWith("}") &&
    value.length > 2
  );
}

/**
 * Extract reference path from token reference string
 * Example: "{color.brand.primary}" → "color.brand.primary"
 */
export function extractReferencePath(reference: string): string {
  return reference.slice(1, -1);
}

/**
 * Get token value by dot-notation path
 * Alias for utils.getToken for consistency
 */
export function getTokenByPath(
  tokens: DesignTokens,
  path: string
): unknown {
  return getToken(tokens, path);
}

/**
 * Build dependency graph for token references
 * Returns Map of token path → Set of paths it depends on
 */
export function buildDependencyGraph(
  tokens: DesignTokens
): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();

  function walk(obj: any, path: string[] = []): void {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = [...path, key].join(".");

      if (isTokenReference(value)) {
        const refPath = extractReferencePath(value);
        if (!graph.has(currentPath)) {
          graph.set(currentPath, new Set());
        }
        graph.get(currentPath)!.add(refPath);
      } else if (typeof value === "object" && value !== null) {
        walk(value, [...path, key]);
      }
    }
  }

  walk(tokens);
  return graph;
}

/**
 * Detect circular references in token graph
 * Returns array of paths involved in circular reference, or null if none found
 */
export function detectCircularReferences(
  graph: Map<string, Set<string>>
): string[] | null {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  let circularPath: string[] = [];

  function hasCycle(node: string, path: string[] = []): boolean {
    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const dependencies = graph.get(node);
    if (dependencies) {
      for (const dep of dependencies) {
        if (!visited.has(dep)) {
          if (hasCycle(dep, [...path])) {
            return true;
          }
        } else if (recursionStack.has(dep)) {
          // Circular reference found
          circularPath = [...path, dep];
          return true;
        }
      }
    }

    recursionStack.delete(node);
    return false;
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      if (hasCycle(node)) {
        return circularPath;
      }
    }
  }

  return null;
}

/**
 * Validate all token references
 * Checks:
 * - All referenced tokens exist
 * - No circular references
 * - Reference depth within limits
 */
export function validateTokenReferences(
  tokens: DesignTokens,
  options: ResolveOptions = {}
): ValidationResult {
  const errors: Array<{ path: string; message: string }> = [];
  const maxDepth = options.maxDepth ?? 5;

  // Build dependency graph
  const graph = buildDependencyGraph(tokens);

  // Check for circular references
  const circularPath = detectCircularReferences(graph);
  if (circularPath) {
    errors.push({
      path: circularPath.join(" → "),
      message: "Circular reference detected",
    });
    return { valid: false, errors };
  }

  // Check all references exist and depth is valid
  function validatePath(path: string, depth = 0, visited = new Set<string>()): void {
    if (depth > maxDepth) {
      errors.push({
        path,
        message: `Max reference depth (${maxDepth}) exceeded`,
      });
      return;
    }

    if (visited.has(path)) {
      return; // Already validated
    }
    visited.add(path);

    const value = getTokenByPath(tokens, path);
    
    if (value === undefined) {
      errors.push({
        path,
        message: "Referenced token does not exist",
      });
      return;
    }

    if (isTokenReference(value)) {
      const refPath = extractReferencePath(value);
      validatePath(refPath, depth + 1, visited);
    }
  }

  // Validate all token references
  for (const [tokenPath, dependencies] of graph.entries()) {
    for (const dep of dependencies) {
      validatePath(dep);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Resolve token references in a token object
 * Replaces all {token.path} references with their actual values
 */
export function resolveTokenReferences(
  tokens: DesignTokens,
  options: ResolveOptions = {}
): DesignTokens {
  const maxDepth = options.maxDepth ?? 5;
  const strict = options.strict ?? true;

  // Validate first if in strict mode
  if (strict) {
    const validation = validateTokenReferences(tokens, options);
    if (!validation.valid) {
      throw new Error(
        `Token validation failed:\n${validation.errors
          .map((e) => `  - ${e.path}: ${e.message}`)
          .join("\n")}`
      );
    }
  }

  // Deep clone to avoid mutating original
  const resolved = JSON.parse(JSON.stringify(tokens)) as DesignTokens;

  // Resolve all references
  function resolveValue(value: any, depth = 0, visited = new Set<string>()): any {
    if (depth > maxDepth) {
      if (strict) {
        throw new Error(`Max reference depth (${maxDepth}) exceeded`);
      }
      return value; // Return as-is in non-strict mode
    }

    if (isTokenReference(value)) {
      const refPath = extractReferencePath(value);

      if (visited.has(refPath)) {
        if (strict) {
          throw new Error(`Circular reference detected at ${refPath}`);
        }
        return value; // Return as-is in non-strict mode
      }

      visited.add(refPath);
      const refValue = getTokenByPath(resolved, refPath);

      if (refValue === undefined) {
        if (strict) {
          throw new Error(`Token reference not found: ${refPath}`);
        }
        return value; // Return as-is in non-strict mode
      }

      // Recursively resolve if the referenced value is also a reference
      const resolvedValue = resolveValue(refValue, depth + 1, new Set(visited));
      visited.delete(refPath);
      return resolvedValue;
    }

    return value;
  }

  // Walk and resolve all values
  function walk(obj: any): any {
    if (typeof obj !== "object" || obj === null) {
      return resolveValue(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(walk);
    }

    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = walk(value);
    }
    return result;
  }

  return walk(resolved) as DesignTokens;
}

/**
 * Get all token paths that reference a given token
 * Useful for finding what breaks when a token is changed/deleted
 */
export function getTokenDependents(
  tokens: DesignTokens,
  targetPath: string
): string[] {
  const graph = buildDependencyGraph(tokens);
  const dependents: string[] = [];

  for (const [tokenPath, dependencies] of graph.entries()) {
    if (dependencies.has(targetPath)) {
      dependents.push(tokenPath);
    }
  }

  return dependents;
}

/**
 * Get all token paths that a given token depends on
 * Useful for understanding token dependencies
 */
export function getTokenDependencies(
  tokens: DesignTokens,
  sourcePath: string
): string[] {
  const graph = buildDependencyGraph(tokens);
  const dependencies = graph.get(sourcePath);
  
  if (!dependencies) {
    return [];
  }

  // Recursively get all dependencies
  const allDeps = new Set<string>();
  function collectDeps(path: string): void {
    const deps = graph.get(path);
    if (deps) {
      for (const dep of deps) {
        if (!allDeps.has(dep)) {
          allDeps.add(dep);
          collectDeps(dep);
        }
      }
    }
  }

  for (const dep of dependencies) {
    allDeps.add(dep);
    collectDeps(dep);
  }

  return Array.from(allDeps);
}

