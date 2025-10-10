const fs = require("fs");

// Test the improved validation logic
function validateW3CTokensStructure(data) {
  if (!data || typeof data !== "object") {
    return false;
  }

  function hasTokenStructure(obj, path = []) {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = [...path, key];

      if (value && typeof value === "object" && !Array.isArray(value)) {
        if ("$value" in value) {
          return true;
        }
        if (hasTokenStructure(value, currentPath)) {
          return true;
        }
      }
    }
    return false;
  }

  return hasTokenStructure(data);
}

function isValidColor(value) {
  if (typeof value !== "string") return false;

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

// Test with a sample of the problematic tokens
const tokensPath = "packages/design-editor/public/designTokens.json";
const tokens = JSON.parse(fs.readFileSync(tokensPath, "utf8"));

console.log("Testing improved validation...");

// Check specific problematic tokens mentioned in the error
const testTokens = [
  "core.color.palette.display.foreground.primary",
  "core.color.palette.display.foreground.secondary",
  "core.color.palette.display.foreground.tertiary",
];

function getTokenValue(obj, path) {
  const parts = path.split(".");
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return current;
}

testTokens.forEach((path) => {
  const token = getTokenValue(tokens, path);
  if (token && token.$value) {
    console.log(`\nToken: ${path}`);
    console.log(`Value: ${token.$value}`);
    console.log(`Type: ${token.$type}`);
    console.log(`Valid color: ${isValidColor(token.$value)}`);
  }
});

console.log("\nOverall structure valid:", validateW3CTokensStructure(tokens));


