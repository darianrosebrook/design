const fs = require("fs");

// Simple test for W3C tokens validation logic
function validateW3CTokensStructure(data) {
  if (!data || typeof data !== "object") {
    return false;
  }

  // Check if it has the basic structure of W3C tokens
  function hasTokenStructure(obj, path = []) {
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

const tokensPath = "packages/design-editor/public/designTokens.json";
const tokens = JSON.parse(fs.readFileSync(tokensPath, "utf8"));

console.log("Testing W3C Design Tokens structure validation...");
const isValidStructure = validateW3CTokensStructure(tokens);

console.log("Valid structure:", isValidStructure);

// Check if we can find some tokens
let tokenCount = 0;
function countTokens(obj, path = []) {
  for (const [key, value] of Object.entries(obj)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      "$value" in value
    ) {
      tokenCount++;
      if (tokenCount <= 5) {
        console.log(`Token found: ${[...path, key].join(".")}`);
      }
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      countTokens(value, [...path, key]);
    }
  }
}

countTokens(tokens);
console.log(`Total tokens found: ${tokenCount}`);


