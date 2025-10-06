#!/usr/bin/env node

/**
 * Audit Helper - Compare pre-migration Tailwind components with current SCSS
 *
 * Usage: node audit-helper.js [component-name]
 */

const fs = require("fs");
const path = require("path");

// Component to audit (pass as argument or check all)
const targetComponent = process.argv[2];

const PRE_MIGRATION_DIR = path.join(__dirname, "ui-components");
const CURRENT_DIR = path.join(__dirname, "../../packages/design-editor/ui");

function findComponents(dir, componentName) {
  const results = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      results.push(...findComponents(fullPath, componentName));
    } else if (
      item.includes(componentName) &&
      (item.endsWith(".tsx") || item.endsWith(".ts"))
    ) {
      results.push(fullPath);
    }
  }

  return results;
}

function extractTailwindClasses(content) {
  // Extract className attributes with Tailwind classes
  const classMatches = content.match(/className=['"]([^'"]*?)['"]/g) || [];
  const classes = classMatches
    .map((match) => {
      const classContent = match.match(/className=['"]([^'"]*?)['"]/)[1];
      return classContent.split(" ").filter((cls) => cls.trim());
    })
    .flat();

  // Filter for likely Tailwind classes (contain numbers, hyphens, or specific prefixes)
  return classes.filter(
    (cls) =>
      /\d/.test(cls) || // contains numbers
      cls.includes("-") || // contains hyphens
      [
        "flex",
        "grid",
        "block",
        "inline",
        "hidden",
        "text",
        "bg-",
        "border",
        "p-",
        "m-",
        "w-",
        "h-",
        "rounded",
        "shadow",
      ].some((prefix) => cls.startsWith(prefix))
  );
}

function analyzeComponent(componentPath) {
  const content = fs.readFileSync(componentPath, "utf8");
  const tailwindClasses = extractTailwindClasses(content);

  return {
    path: componentPath,
    tailwindClasses: [...new Set(tailwindClasses)], // unique classes
    hasTailwind: tailwindClasses.length > 0,
  };
}

function compareComponents(oldComponent, newComponent) {
  console.log(`\n🔍 Comparing: ${path.basename(oldComponent.path)}`);
  console.log(`📁 Old: ${oldComponent.path.replace(__dirname, ".")}`);
  console.log(`📁 New: ${newComponent.path.replace(__dirname, ".")}`);

  console.log(
    `\n🎨 Original Tailwind classes (${oldComponent.tailwindClasses.length}):`
  );
  oldComponent.tailwindClasses.forEach((cls) => console.log(`  - ${cls}`));

  if (newComponent) {
    console.log(
      `\n🔄 Current SCSS implementation: ${
        newComponent.hasScss ? "Has SCSS module" : "No SCSS found"
      }`
    );
  }

  console.log("\n" + "=".repeat(60));
}

function main() {
  if (targetComponent) {
    console.log(`🔍 Auditing component: ${targetComponent}\n`);

    // Find old component
    const oldComponents = findComponents(PRE_MIGRATION_DIR, targetComponent);
    const newComponents = findComponents(CURRENT_DIR, targetComponent);

    if (oldComponents.length === 0) {
      console.log(
        `❌ No pre-migration component found for: ${targetComponent}`
      );
      return;
    }

    oldComponents.forEach((oldPath) => {
      const oldAnalysis = analyzeComponent(oldPath);

      // Try to find corresponding new component
      const componentName = path.basename(oldPath, path.extname(oldPath));
      const newPath = newComponents.find(
        (p) => path.basename(p, path.extname(p)) === componentName
      );

      compareComponents(
        oldAnalysis,
        newPath
          ? {
              path: newPath,
              hasScss: fs.existsSync(newPath.replace(".tsx", ".module.scss")),
            }
          : null
      );
    });
  } else {
    console.log("🔍 Analyzing all pre-migration components...\n");

    // Analyze all components
    const allOldComponents = [];
    const items = fs.readdirSync(PRE_MIGRATION_DIR);

    items.forEach((item) => {
      const componentFiles = findComponents(
        path.join(PRE_MIGRATION_DIR, item),
        ""
      );
      componentFiles.forEach((file) => {
        if (file.endsWith(".tsx")) {
          allOldComponents.push(analyzeComponent(file));
        }
      });
    });

    // Sort by number of Tailwind classes (most complex first)
    allOldComponents.sort(
      (a, b) => b.tailwindClasses.length - a.tailwindClasses.length
    );

    console.log(
      `📊 Found ${allOldComponents.length} components with Tailwind classes\n`
    );

    allOldComponents.slice(0, 10).forEach((comp) => {
      console.log(
        `${path.basename(comp.path)}: ${
          comp.tailwindClasses.length
        } Tailwind classes`
      );
      console.log(
        `  Sample classes: ${comp.tailwindClasses.slice(0, 5).join(", ")}`
      );
      console.log("");
    });

    console.log(
      `💡 Run: node audit-helper.js <component-name> for detailed analysis`
    );
  }
}

main();
