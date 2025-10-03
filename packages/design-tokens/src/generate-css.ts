/**
 * @fileoverview Generate CSS custom properties from design tokens
 * @author @darianrosebrook
 */

import * as fs from "fs";
import type { DesignTokens } from "./tokens";

/**
 * Flatten nested token objects into CSS custom property format
 */
function flattenTokens(
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
 * Generate CSS file from tokens
 */
export function generateCSSFile(
  tokensPath: string = "design/tokens.json",
  outPath: string = "src/ui/tokens.css"
): void {
  try {
    const tokensContent = fs.readFileSync(tokensPath, "utf8");
    const tokens = JSON.parse(tokensContent) as DesignTokens;

    const css = tokensToCSS(tokens);
    fs.writeFileSync(outPath, css);

    console.info(`✅ Generated CSS tokens at ${outPath}`);
  } catch (error) {
    console.error(
      "❌ Failed to generate CSS tokens:",
      (error as Error).message
    );
    throw error;
  }
}
