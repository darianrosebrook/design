#!/usr/bin/env node
/**
 * Generate component-scoped CSS custom properties from component token JSON files
 *
 * This script reads component token JSON files and generates SCSS mixins containing
 * CSS custom properties scoped to each component. Token references are converted
 * to CSS var() calls using the standard naming convention.
 *
 * Usage: node utils/designTokens/generateCSSTokens.mjs
 *
 * @author @darianrosebrook
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// @ts-ignore - CommonJS compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");

const COMPONENTS_DIR = PROJECT_ROOT;
const SYSTEM_TOKENS_PATH = path.join(
  PROJECT_ROOT,
  "ui",
  "designTokens",
  "designTokens.json"
);

/**
 * Flattened token structure for processing
 */
interface FlattenedTokens {
  groups: Record<string, { tokens: Record<string, unknown>; path: string[] }>;
  flat: Record<string, unknown>;
}

/**
 * Component token file structure
 */
interface ComponentTokenFile {
  prefix: string;
  tokens: Record<string, unknown>;
}

/**
 * Convert a token reference string like "{semantic.color.background.primary}"
 * into a CSS variable reference using the same naming convention as the global generator
 */
function refToCssVar(value: unknown): string {
  if (typeof value !== "string") {
    return String(value);
  }
  const refMatch = value.match(/^\{([^}]+)\}$/);
  if (!refMatch) {
    return value;
  } // literal value (number/dimension/string)
  const tokenPath = refMatch[1];

  // Use the same CSS variable naming convention as the global generator
  const cssVarName =
    "--" +
    tokenPath
      .replace(/\./g, "-") // Convert dots to hyphens first
      .replace(/[A-Z]/g, (m) => "-" + m.toLowerCase()) // Convert camelCase
      .replace(/[\s_]/g, "-") // Convert spaces and underscores
      .replace(/[^a-z0-9-]/g, "") // Remove any remaining invalid characters
      .replace(/-+/g, "-"); // Collapse multiple hyphens into one

  return `var(${cssVarName})`;
}

/**
 * Walk a nested token object producing a grouped structure with flat tokens
 * Only extracts 'value' properties from token objects, ignores 'description' and other metadata
 *
 * @param obj - The token object to flatten
 * @param prefixSegments - Current path segments
 * @returns Flattened token structure with groups and flat tokens
 */
function flattenTokens(
  obj: Record<string, unknown>,
  prefixSegments: string[]
): FlattenedTokens {
  const groups: Record<
    string,
    { tokens: Record<string, unknown>; path: string[] }
  > = {};
  const flat: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(obj)) {
    const nextPath = [...prefixSegments, key];

    if (val && typeof val === "object" && !Array.isArray(val)) {
      const valObj = val as Record<string, unknown>;

      // Check if this is a token object with a 'value' property
      if ("value" in valObj) {
        // This is a leaf token - extract only the value
        const tokenName = nextPath.join("-");
        flat[tokenName] = valObj.value;
      } else {
        // This is a group - recurse and collect its tokens
        const result = flattenTokens(valObj, nextPath);

        // If this is a top-level group (depth 1), create a group entry
        if (prefixSegments.length === 0) {
          const groupTokens: Record<string, unknown> = {};
          Object.entries(result.flat).forEach(([tokenName, tokenValue]) => {
            groupTokens[tokenName] = tokenValue;
            flat[tokenName] = tokenValue;
          });

          groups[key] = {
            tokens: groupTokens,
            path: nextPath,
          };
        } else {
          // Nested object - merge into parent
          Object.assign(flat, result.flat);
          Object.assign(groups, result.groups);
        }
      }
    } else {
      // Primitive leaf value (fallback for tokens without description)
      const tokenName = nextPath.join("-");
      flat[tokenName] = val;
    }
  }

  return { groups, flat };
}

/**
 * Generate SCSS content with component-scoped variables grouped by category
 *
 * @param config - Configuration object with CSS variable prefix and token data
 * @returns SCSS mixin string with CSS custom properties
 */
function buildScssForComponent(config: {
  cssVarPrefix: string;
  tokenData: FlattenedTokens;
}): string {
  const { cssVarPrefix, tokenData } = config;
  const { groups, flat } = tokenData;
  const lines: string[] = [];

  // If we have groups, organize by groups with documentation
  if (Object.keys(groups).length > 0) {
    Object.entries(groups).forEach(([groupName, groupData]) => {
      // Add group documentation header
      const groupTitle = groupName.charAt(0).toUpperCase() + groupName.slice(1);
      lines.push(`  /* === ${groupTitle} Tokens === */`);

      // Add tokens for this group
      Object.entries(groupData.tokens).forEach(([name, raw]) => {
        lines.push(`  --${cssVarPrefix}-${name}: ${refToCssVar(raw)};`);
      });

      // Add spacing between groups
      lines.push("");
    });

    // Remove the last empty line
    if (lines[lines.length - 1] === "") {
      lines.pop();
    }
  } else {
    // Fallback to flat structure if no groups detected
    Object.entries(flat).forEach(([name, raw]) => {
      lines.push(`  --${cssVarPrefix}-${name}: ${refToCssVar(raw)};`);
    });
  }

  return `@mixin vars {\n${lines.join("\n")}\n}`;
}

/**
 * Infer the component className from the token file content or filename
 * We prefer the JSON `prefix` field; falls back to folder name in kebab/camel to match SCSS class convention used locally.
 *
 * @param prefix - Prefix from token file (if available)
 * @param folderName - Folder name as fallback
 * @returns Component class name
 */
function inferClassName(
  prefix: string | undefined,
  folderName: string
): string {
  if (prefix) {
    return String(prefix);
  }
  return folderName;
}

/**
 * Recursively find all .tokens.json files in a directory
 *
 * @param dir - Directory to search
 * @returns Array of file paths
 */
function findTokenJsonFiles(dir: string): string[] {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  const results: string[] = [];
  for (const entry of items) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findTokenJsonFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".tokens.json")) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Main execution function
 * Generates CSS custom properties for all component token files
 */
function run(): void {
  // Validate system tokens exist (not strictly required for ref mode)
  if (!fs.existsSync(SYSTEM_TOKENS_PATH)) {
    console.warn(
      "[tokens] Warning: ui/designTokens/designTokens.json not found. Proceeding with reference output."
    );
  }

  const tokenFiles = findTokenJsonFiles(COMPONENTS_DIR);
  if (tokenFiles.length === 0) {
    console.log("[tokens] No component token files found.");
    return;
  }

  let generatedCount = 0;
  for (const filePath of tokenFiles) {
    try {
      const folder = path.dirname(filePath);
      const folderName = path.basename(folder);
      const raw = fs.readFileSync(filePath, "utf8");
      const json: ComponentTokenFile = JSON.parse(raw);
      const prefix = json.prefix;
      const tokens = json.tokens || {};

      if (!prefix || !tokens || typeof tokens !== "object") {
        console.warn(
          `[tokens] Skipping ${path.relative(
            PROJECT_ROOT,
            filePath
          )} — missing prefix or tokens.`
        );
        continue;
      }

      const tokenData = flattenTokens(tokens as Record<string, unknown>, []);
      const scss = buildScssForComponent({
        cssVarPrefix: prefix,
        tokenData: tokenData,
      });

      const outPath = path.join(
        folder,
        `${capitalize(prefix)}.tokens.generated.scss`
      );
      const banner = `/* AUTO-GENERATED: Do not edit directly.\n * Source: ${path.relative(
        PROJECT_ROOT,
        filePath
      )}\n */\n`;
      fs.writeFileSync(outPath, banner + scss + "\n", "utf8");
      generatedCount += 1;
      console.log(`[tokens] Generated ${path.relative(PROJECT_ROOT, outPath)}`);
    } catch (err) {
      console.error(`[tokens] Failed processing ${filePath}:`, err);
    }
  }

  console.log(`[tokens] Completed. Generated ${generatedCount} file(s).`);
}

/**
 * Capitalize the first letter of a string
 *
 * @param str - String to capitalize
 * @returns Capitalized string
 */
function capitalize(str: string): string {
  if (!str) {
    return str;
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

run();
