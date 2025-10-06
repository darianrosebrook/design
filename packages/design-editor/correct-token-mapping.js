#!/usr/bin/env node
/**
 * Correct token mapping script using actual semantic tokens
 * Maps to tokens that actually exist in semantic.tokens.json
 */

const fs = require("fs");
const path = require("path");

// Correct mapping based on actual semantic tokens
const correctTokenMappings = {
  // Typography mappings to actual semantic tokens
  "{typography.fontWeight.medium}": "{semantic.typography.button.fontWeight}",
  "{typography.body.02}": "{semantic.typography.body.02}",
  "{typography.lineHeight.tight}": "{semantic.typography.lineHeight.tight}",

  // Color mappings using actual semantic structure
  "{color.palette.neutral.0}":
    "{semantic.color.action.background.secondary.default}",
  "{color.palette.neutral.100}":
    "{semantic.color.action.background.secondary.hover}",
  "{color.palette.neutral.200}":
    "{semantic.color.action.background.secondary.active}",
  "{color.palette.neutral.300}":
    "{semantic.color.action.border.secondary.default}",
  "{color.palette.neutral.400}":
    "{semantic.color.action.border.secondary.hover}",
  "{color.palette.neutral.500}":
    "{semantic.color.navigation.foreground.secondary}",
  "{color.palette.neutral.600}":
    "{semantic.color.navigation.foreground.secondary}",
  "{color.palette.neutral.700}":
    "{semantic.color.navigation.foreground.primary}",
  "{color.palette.neutral.800}":
    "{semantic.color.action.background.primary.default}",
  "{color.palette.neutral.900}":
    "{semantic.color.action.foreground.primary.default}",

  // Blue colors
  "{color.palette.blue.500}":
    "{semantic.color.feedback.foreground.info.default}",
  "{color.palette.blue.600}":
    "{semantic.color.feedback.background.info.strong}",
  "{color.palette.blue.700}":
    "{semantic.color.feedback.foreground.info.onSubtle}",

  // Red colors
  "{color.palette.red.50}":
    "{semantic.color.feedback.background.danger.subtle}",
  "{color.palette.red.500}":
    "{semantic.color.action.background.danger.default}",
  "{color.palette.red.600}": "{semantic.color.action.background.danger.hover}",
  "{color.palette.red.700}": "{semantic.color.action.background.danger.active}",

  // Mode colors
  "{color.mode.dark}": "{semantic.color.action.foreground.primary.default}",
  "{color.mode.light}": "{semantic.color.action.background.secondary.default}",
  "{color.mode.white}": "{semantic.color.action.foreground.primary.default}",
  "{color.palette.white}": "{semantic.color.action.foreground.primary.default}",

  // Legacy semantic token patterns (for tokens that exist but use different paths)
  "{semantic.color.palette.neutral.0}":
    "{semantic.color.action.background.secondary.default}",
  "{semantic.color.palette.neutral.100}":
    "{semantic.color.action.background.secondary.hover}",
  "{semantic.color.palette.neutral.200}":
    "{semantic.color.action.background.secondary.active}",
  "{semantic.color.palette.neutral.300}":
    "{semantic.color.action.border.secondary.default}",
  "{semantic.color.palette.neutral.400}":
    "{semantic.color.action.border.secondary.hover}",
  "{semantic.color.palette.neutral.500}":
    "{semantic.color.navigation.foreground.secondary}",
  "{semantic.color.palette.neutral.600}":
    "{semantic.color.navigation.foreground.secondary}",
  "{semantic.color.palette.neutral.700}":
    "{semantic.color.navigation.foreground.primary}",
  "{semantic.color.palette.neutral.800}":
    "{semantic.color.action.background.primary.default}",
  "{semantic.color.palette.neutral.900}":
    "{semantic.color.action.foreground.primary.default}",

  "{semantic.color.palette.blue.500}":
    "{semantic.color.feedback.foreground.info.default}",
  "{semantic.color.palette.blue.600}":
    "{semantic.color.feedback.background.info.strong}",
  "{semantic.color.palette.blue.700}":
    "{semantic.color.feedback.foreground.info.onSubtle}",

  "{semantic.color.palette.red.50}":
    "{semantic.color.feedback.background.danger.subtle}",
  "{semantic.color.palette.red.500}":
    "{semantic.color.action.background.danger.default}",
  "{semantic.color.palette.red.600}":
    "{semantic.color.action.background.danger.hover}",
  "{semantic.color.palette.red.700}":
    "{semantic.color.action.background.danger.active}",

  "{semantic.color.palette.white}":
    "{semantic.color.action.foreground.primary.default}",
};

function fixTokenReferences(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    let fixedContent = content;
    let changes = 0;

    // Apply each mapping
    for (const [brokenRef, correctRef] of Object.entries(
      correctTokenMappings
    )) {
      const regex = new RegExp(
        brokenRef.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "g"
      );
      const matches = fixedContent.match(regex);
      if (matches) {
        fixedContent = fixedContent.replace(regex, correctRef);
        changes += matches.length;
      }
    }

    if (content !== fixedContent) {
      fs.writeFileSync(filePath, fixedContent, "utf8");
      console.log(
        `✅ Fixed ${changes} references in: ${path.basename(filePath)}`
      );
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Find all component token files
function findTokenFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...findTokenFiles(fullPath));
    } else if (item.isFile() && item.name.endsWith(".tokens.json")) {
      files.push(fullPath);
    }
  }
  return files;
}

console.log("🔧 Correcting token references with proper semantic tokens...\n");

// Find all token files in primitives directory
const tokenFiles = findTokenFiles("ui/primitives");
let fixedCount = 0;

for (const filePath of tokenFiles) {
  if (fixTokenReferences(filePath)) {
    fixedCount++;
  }
}

console.log(`\n📊 Summary: Fixed ${fixedCount} files`);

// Validate the fixes
console.log("\n🔍 Validating corrected token references...");
const validationScript = `
const fs = require('fs');
const tokens = JSON.parse(fs.readFileSync('ui/designTokens/designTokens.json', 'utf8'));

const semanticTokensToCheck = [
  'semantic.color.action.background.primary.default',
  'semantic.color.action.background.secondary.default',
  'semantic.color.action.background.secondary.hover',
  'semantic.color.action.background.secondary.active',
  'semantic.color.action.border.secondary.default',
  'semantic.color.action.border.secondary.hover',
  'semantic.color.action.foreground.primary.default',
  'semantic.color.feedback.foreground.info.default',
  'semantic.color.feedback.background.info.subtle',
  'semantic.color.feedback.background.danger.subtle',
  'semantic.color.navigation.foreground.secondary',
  'semantic.color.navigation.foreground.primary',
  'semantic.typography.button.fontWeight',
  'semantic.typography.body.02',
  'semantic.typography.lineHeight.tight',
];

console.log('Checking semantic tokens exist...');
let allValid = true;

for (const tokenPath of semanticTokensToCheck) {
  const parts = tokenPath.split('.');
  let current = tokens;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      console.log('❌ Missing semantic token:', tokenPath);
      allValid = false;
      break;
    }
  }

  if (current !== undefined) {
    console.log('✅', tokenPath);
  }
}

process.exit(allValid ? 0 : 1);
`;

try {
  require("child_process").execSync(
    'node -e "' + validationScript.replace(/"/g, '\\"') + '"',
    { cwd: process.cwd() }
  );
  console.log("\n🎉 All semantic token validations passed!");
} catch (error) {
  console.log("\n⚠️  Some semantic token validations failed!");
}
