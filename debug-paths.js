const path = require("path");
const fs = require("fs");

// Simulate what the token script does
const __filename =
  typeof require !== "undefined" && require.main
    ? require.main.filename
    : "simulated";
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

console.log("__filename:", __filename);
console.log("__dirname:", __dirname);
console.log("PROJECT_ROOT:", PROJECT_ROOT);

const coreTokensPath = path.join(
  PROJECT_ROOT,
  "ui",
  "designTokens",
  "core.tokens.json"
);
console.log("coreTokensPath:", coreTokensPath);
console.log("coreTokens exists:", fs.existsSync(coreTokensPath));

// Check if we're in the right directory
const cwd = process.cwd();
console.log("CWD:", cwd);
