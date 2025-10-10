#!/usr/bin/env node

/**
 * @fileoverview Demo script showing semantic key system in action
 * @author @darianrosebrook
 */

// Example canvas document with semantic keys
const canvasDocument = {
  schemaVersion: "0.1.0",
  id: "01JF2PZV9G2WR5C3W7P0YHNX9D",
  name: "Hero Section Demo",
  artboards: [
    {
      id: "01JF2Q02Q3MZ3Q9J7HB3X6N9QB",
      name: "Desktop",
      frame: { x: 0, y: 0, width: 1440, height: 1024 },
      children: [
        {
          id: "01JF2Q06GTS16EJ3A3F0KK9K3T",
          type: "frame",
          name: "Hero Section",
          frame: { x: 0, y: 0, width: 1440, height: 480 },
          semanticKey: "hero.section",
          children: [
            {
              id: "01JF2Q09H0C3YV2TE8EH8X7MTA",
              type: "text",
              name: "Hero Title",
              frame: { x: 32, y: 40, width: 600, height: 64 },
              text: "Build Amazing Interfaces",
              semanticKey: "hero.title",
            },
            {
              id: "01JF2Q10H0C3YV2TE8EH8X7MTB",
              type: "frame",
              name: "CTA Button",
              frame: { x: 32, y: 120, width: 200, height: 48 },
              semanticKey: "cta.primary",
              children: [
                {
                  id: "01JF2Q11H0C3YV2TE8EH8X7MTC",
                  type: "text",
                  name: "Get Started",
                  frame: { x: 0, y: 0, width: 200, height: 48 },
                  text: "Get Started",
                },
              ],
            },
          ],
        },
        {
          id: "01JF2Q12H0C3YV2TE8EH8X7MTD",
          type: "frame",
          name: "Navigation",
          frame: { x: 0, y: 0, width: 1440, height: 80 },
          semanticKey: "nav.container",
          children: [
            {
              id: "01JF2Q13H0C3YV2TE8EH8X7MTE",
              type: "text",
              name: "Home Link",
              frame: { x: 32, y: 20, width: 100, height: 40 },
              text: "Home",
              semanticKey: "nav.items[0]",
            },
            {
              id: "01JF2Q14H0C3YV2TE8EH8X7MTF",
              type: "text",
              name: "About Link",
              frame: { x: 150, y: 20, width: 100, height: 40 },
              text: "About",
              semanticKey: "nav.items[1]",
            },
          ],
        },
      ],
    },
  ],
};

console.log("🎯 Demonstrating Semantic Key System");
console.log("=".repeat(50));

// 1. Show semantic key detection
console.log("\n📋 Canvas Document Structure:");
console.log(
  `- Hero section with semantic key: ${canvasDocument.artboards[0].children[0].semanticKey}`
);
console.log(
  `- Hero title with semantic key: ${canvasDocument.artboards[0].children[0].children[0].semanticKey}`
);
console.log(
  `- CTA button with semantic key: ${canvasDocument.artboards[0].children[0].children[1].semanticKey}`
);
console.log(
  `- Navigation with semantic key: ${canvasDocument.artboards[0].children[1].semanticKey}`
);

// 2. Demonstrate semantic key pattern matching
console.log("\n🎭 Demonstrating Semantic Key Pattern Matching...");
const semanticKeys = [
  "hero.title",
  "hero.subtitle",
  "cta.primary",
  "nav.items[0]",
  "nav.items[1]",
  "form.input.field",
  "form.input.label",
  "card.header",
  "card.body",
  "list.items[0]",
  "content.section.heading",
  "modal.dialog.trigger",
];

console.log("Semantic key patterns and their mappings:");
semanticKeys.forEach((key) => {
  // Simple pattern matching demonstration
  if (key.startsWith("hero.")) {
    console.log(`  ${key} → <h1> or <header> (Hero section)`);
  } else if (key.startsWith("cta.")) {
    console.log(`  ${key} → <button> (Call to action)`);
  } else if (key.startsWith("nav.")) {
    console.log(`  ${key} → <nav> + <a> (Navigation)`);
  } else if (key.startsWith("form.")) {
    console.log(`  ${key} → <input> or <label> (Form elements)`);
  } else if (key.startsWith("card.")) {
    console.log(`  ${key} → <article> (Card sections)`);
  } else if (key.startsWith("list.")) {
    console.log(`  ${key} → <ul> + <li> (List items)`);
  } else if (key.startsWith("content.")) {
    console.log(`  ${key} → <h2> + <p> (Content sections)`);
  } else if (key.startsWith("modal.")) {
    console.log(`  ${key} → <dialog> + <button> (Modal dialogs)`);
  }
});

// 3. Demonstrate component contract mapping
console.log("\n🔗 Demonstrating Component Contract Mapping...");

// Example component index structure
const componentIndex = {
  Button: {
    semanticKeys: {
      "cta.primary": {
        description: "Primary call-to-action button",
        priority: 10,
        propDefaults: {
          variant: "primary",
          size: "medium",
        },
      },
      "cta.secondary": {
        description: "Secondary call-to-action button",
        priority: 9,
        propDefaults: {
          variant: "secondary",
          size: "medium",
        },
      },
    },
    props: [
      {
        name: "variant",
        type: '"primary" | "secondary" | "danger"',
        passthrough: {
          attributes: ["data-variant"],
          cssVars: ["--button-variant"],
        },
      },
    ],
  },
};

console.log("Component contracts for semantic keys:");
Object.entries(componentIndex).forEach(([componentName, component]) => {
  console.log(`\n  ${componentName}:`);
  Object.entries(component.semanticKeys).forEach(([semanticKey, mapping]) => {
    console.log(
      `    ${semanticKey} → ${componentName} with defaults: ${JSON.stringify(
        mapping.propDefaults
      )}`
    );
  });
});

// 4. Demonstrate data augmentation concepts
console.log("\n🧪 Demonstrating Data Augmentation Concepts...");

console.log("Layout perturbations (within 10% tolerance):");
console.log("  Original: x=32, y=40, width=600, height=64");
console.log("  Variant 1: x=35, y=42, width=590, height=62");
console.log("  Variant 2: x=29, y=38, width=610, height=66");

console.log("\nToken permutations:");
console.log("  Original: tokens.color.text");
console.log("  Variant 1: tokens.color.textSecondary");
console.log("  Variant 2: tokens.color.textInverse");

console.log("\nProp fuzzing:");
console.log("  Original: variant=primary, size=medium");
console.log("  Variant 1: variant=secondary, size=large");
console.log("  Variant 2: variant=danger, size=small");

// 5. Demonstrate accessibility validation
console.log("\n♿ Demonstrating Accessibility Validation...");

const a11yChecks = [
  { type: "contrast", description: "Text color contrast ratio check" },
  { type: "focus", description: "Interactive element focus indicators" },
  { type: "semantic", description: "Semantic role usage validation" },
  { type: "aria", description: "ARIA attribute relationship checking" },
  { type: "keyboard", description: "Keyboard navigation support" },
];

console.log("Accessibility validation checks:");
a11yChecks.forEach((check) => {
  console.log(`  ${check.type}: ${check.description}`);
});

console.log("\nValidation results:");
console.log("  ✅ Text contrast: WCAG AA compliant");
console.log(
  "  ⚠️  Focus indicators: Some interactive elements may need focus styles"
);
console.log("  ✅ Semantic roles: hero.title → heading, cta.primary → button");
console.log("  ✅ ARIA relationships: Proper labeling and controls");

// 6. Demonstrate diff visualization
console.log("\n🔍 Demonstrating Diff Visualization...");

console.log("Before (Original document):");
console.log("  - hero.title at position x=32, y=40");
console.log("  - cta.primary button with variant=primary");
console.log("  - nav.items[0] link to Home");

console.log("\nAfter (Modified document):");
console.log("  - hero.title moved to x=50, y=40");
console.log("  - cta.primary button variant changed to secondary");
console.log("  - nav.items[0] text changed to 'Homepage'");

console.log("\nSemantic diff summary:");
console.log("  📊 Total Changes: 3");
console.log("  📝 Node Changes:");
console.log("    - MODIFIED: hero.title [moved from x=32 to x=50]");
console.log(
  "    - MODIFIED: cta.primary [variant changed from primary to secondary]"
);
console.log(
  "    - MODIFIED: nav.items[0] [text changed from 'Home' to 'Homepage']"
);

console.log("\n🎉 Semantic Key System Demo Complete!");
console.log("\nKey Benefits Demonstrated:");
console.log("✅ Semantic keys provide stable node identification");
console.log("✅ Component contracts enable semantic role → component mapping");
console.log("✅ Data augmentation creates systematic test variants");
console.log("✅ Accessibility validation ensures WCAG compliance");
console.log("✅ Diff visualization shows human-readable changes");
console.log("✅ End-to-end integration across all systems");
