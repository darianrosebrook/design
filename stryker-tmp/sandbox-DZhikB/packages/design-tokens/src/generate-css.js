/**
 * @fileoverview Generate CSS custom properties from design tokens
 * @author @darianrosebrook
 */

import fs from "fs";
// import path from "path"; // TODO: Remove if not needed

function flattenTokens(tokens, prefix = "") {
  const result = {};

  function walk(obj, path = []) {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = [...path, key];

      if (typeof value === "object" && value !== null) {
        walk(value, currentPath);
      } else {
        const cssVar = `--${prefix ? `${prefix}-` : ""}${currentPath.join(
          "-"
        )}`;
        result[cssVar] = value;
      }
    }
  }

  walk(tokens);
  return result;
}

function tokensToCSS(tokens, selector = ":root") {
  const flattened = flattenTokens(tokens);

  const cssVars = Object.entries(flattened)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join("\n");

  return `${selector} {\n${cssVars}\n}`;
}

function main() {
  const [, , tokensPath = "design/tokens.json", outPath = "src/ui/tokens.css"] =
    process.argv;

  try {
    const tokensContent = fs.readFileSync(tokensPath, "utf8");
    const tokens = JSON.parse(tokensContent);

    const css = tokensToCSS(tokens);
    fs.writeFileSync(outPath, css);

    console.log(`✅ Generated CSS tokens at ${outPath}`);
  } catch (error) {
    console.error("❌ Failed to generate CSS tokens:", error.message);
    process.exit(1);
  }
}

main();
