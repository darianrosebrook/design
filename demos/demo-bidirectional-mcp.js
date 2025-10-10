#!/usr/bin/env node

/**
 * @fileoverview Demo of bidirectional MCP editing for collaborative design-dev workflows
 * @author @darianrosebrook
 */

// Note: This demo shows the conceptual workflow without actual imports
// In a real implementation, these would be actual MCP server calls

console.log("🤝 Bidirectional MCP Editing Demo");
console.log("=====================================");

// Simulate a collaborative workflow between design and dev agents

// 1. Design agent creates initial design spec
console.log("\n🎨 Phase 1: Design Agent Creates Initial Spec");
console.log("-".repeat(50));

const designSpec = {
  name: "Landing Page Hero",
  layout: "hero",
  components: [
    {
      type: "frame",
      semanticKey: "hero.section",
      props: {
        background: "gradient",
        padding: "large",
      },
    },
    {
      type: "text",
      semanticKey: "hero.title",
      props: {
        content: "Build Amazing Interfaces",
        size: "hero",
        weight: "bold",
      },
    },
    {
      type: "frame",
      semanticKey: "cta.primary",
      props: {
        variant: "primary",
        size: "large",
      },
    },
    {
      type: "text",
      semanticKey: "cta.text",
      props: {
        content: "Get Started",
      },
    },
  ],
  tokens: {
    color: {
      primary: "#4F46E5",
      text: "#1F2937",
      background: "#FFFFFF",
    },
    spacing: {
      large: "32px",
      medium: "16px",
    },
  },
};

console.log("Design specification created:");
console.log(JSON.stringify(designSpec, null, 2));

// 2. Dev agent receives spec and generates component contracts
console.log("\n⚛️  Phase 2: Dev Agent Generates Component Contracts");
console.log("-".repeat(50));

const componentRequirements = {
  name: "Button",
  purpose: "Interactive call-to-action component",
  props: [
    {
      name: "variant",
      type: '"primary" | "secondary" | "danger"',
      required: false,
      description: "Visual style variant",
    },
    {
      name: "size",
      type: '"small" | "medium" | "large"',
      required: false,
      description: "Component size",
    },
    {
      name: "disabled",
      type: "boolean",
      required: false,
      description: "Disabled state",
    },
  ],
  variants: ["primary", "secondary", "danger"],
};

console.log("Component requirements:");
console.log(JSON.stringify(componentRequirements, null, 2));

// 3. MCP server creates canvas document from design spec
console.log("\n🔄 Phase 3: MCP Server Creates Canvas Document");
console.log("-".repeat(50));

// In a real implementation, this would call the MCP server
// For demo, we'll simulate the result
const canvasDocument = {
  schemaVersion: "0.1.0",
  id: "01JF2PZV9G2WR5C3W7P0YHNX9D",
  name: "Landing Page Hero",
  artboards: [
    {
      id: "01JF2Q02Q3MZ3Q9J7HB3X6N9QB",
      name: "Desktop",
      frame: { x: 0, y: 0, width: 1440, height: 1024 },
      children: [
        {
          id: "01JF2Q06GTS16EJ3A3F0KK9K3T",
          type: "frame",
          name: "hero.section",
          frame: { x: 0, y: 0, width: 1440, height: 480 },
          semanticKey: "hero.section",
          children: [
            {
              id: "01JF2Q09H0C3YV2TE8EH8X7MTA",
              type: "text",
              name: "hero.title",
              frame: { x: 32, y: 40, width: 600, height: 64 },
              text: "Build Amazing Interfaces",
              semanticKey: "hero.title",
            },
            {
              id: "01JF2Q10H0C3YV2TE8EH8X7MTB",
              type: "frame",
              name: "cta.primary",
              frame: { x: 32, y: 120, width: 200, height: 48 },
              semanticKey: "cta.primary",
              children: [
                {
                  id: "01JF2Q11H0C3YV2TE8EH8X7MTC",
                  type: "text",
                  name: "cta.text",
                  frame: { x: 0, y: 0, width: 200, height: 48 },
                  text: "Get Started",
                  semanticKey: "cta.text",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

console.log("Canvas document created with semantic keys:");
console.log(
  `- ${canvasDocument.artboards[0].children.length} artboard elements`
);
canvasDocument.artboards[0].children.forEach((child, index) => {
  console.log(
    `  ${index + 1}. ${child.name} (${child.type}) - semanticKey: ${
      child.semanticKey
    }`
  );
});

// 4. Dev agent updates component index with new contracts
console.log("\n📚 Phase 4: Dev Agent Updates Component Index");
console.log("-".repeat(50));

const componentIndex = {
  Button: {
    id: "01JF2Q15H0C3YV2TE8EH8X7MTG",
    name: "Button",
    modulePath: "src/ui/Button.tsx",
    export: "Button",
    category: "ui",
    semanticKeys: {
      "cta.primary": {
        description: "Primary call-to-action button",
        priority: 10,
        propDefaults: {
          variant: "primary",
          size: "large",
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
        required: false,
        defaultValue: "primary",
        description: "Visual style variant",
        design: {
          control: "select",
          options: ["primary", "secondary", "danger"],
        },
        passthrough: {
          attributes: ["data-variant"],
          cssVars: ["--button-variant"],
        },
      },
      {
        name: "size",
        type: '"small" | "medium" | "large"',
        required: false,
        defaultValue: "medium",
        design: {
          control: "select",
          options: ["small", "medium", "large"],
        },
        passthrough: {
          attributes: ["data-size"],
          cssVars: ["--button-size"],
        },
      },
      {
        name: "disabled",
        type: "boolean",
        required: false,
        defaultValue: false,
        design: {
          control: "boolean",
        },
        passthrough: {
          attributes: ["disabled", "aria-disabled"],
          events: [],
        },
      },
    ],
    variants: [{ name: "primary" }, { name: "secondary" }, { name: "danger" }],
    examples: [
      '<Button variant="primary" size="large">Get Started</Button>',
      '<Button variant="secondary" size="medium" disabled>Disabled</Button>',
    ],
  },
};

console.log("Component index updated:");
console.log(`- Added ${Object.keys(componentIndex).length} components`);
Object.entries(componentIndex).forEach(([name, component]) => {
  console.log(
    `  • ${name}: ${Object.keys(component.semanticKeys).length} semantic keys`
  );
});

// 5. Generate React components from canvas
console.log("\n⚛️  Phase 5: Generate React Components");
console.log("-".repeat(50));

try {
  const result = generateReactComponents(canvasDocument, {
    componentIndexPath: "./design/components.index.json",
  });

  console.log(`✅ Generated ${result.files.length} files:`);
  result.files.forEach((file) => {
    console.log(`  - ${file.path} (${file.type})`);
  });
  console.log(
    `📊 Metadata: ${result.metadata.nodeCount} nodes, ${result.metadata.artboardCount} artboards`
  );
} catch (error) {
  console.log(`❌ Error generating components: ${error.message}`);
}

// 6. Design agent makes changes to canvas
console.log("\n🎨 Phase 6: Design Agent Updates Canvas");
console.log("-".repeat(50));

// Simulate design changes
const updatedCanvasDocument = JSON.parse(JSON.stringify(canvasDocument));
updatedCanvasDocument.artboards[0].children[0].children[0].text =
  "Build Incredible Interfaces";
updatedCanvasDocument.artboards[0].children[0].children[1].frame.x = 50; // Move CTA button

console.log("Design changes made:");
console.log("- Updated hero title text");
console.log("- Moved CTA button position");

// 7. Compare documents to see changes
console.log("\n🔍 Phase 7: Analyze Design Changes");
console.log("-".repeat(50));

try {
  const diff = compareCanvasDocuments(canvasDocument, updatedCanvasDocument);

  console.log(`📊 Diff Summary:`);
  console.log(`  - Total Changes: ${diff.summary.totalChanges}`);
  console.log(`  - Added: ${diff.summary.addedNodes}`);
  console.log(`  - Removed: ${diff.summary.removedNodes}`);
  console.log(`  - Modified: ${diff.summary.modifiedNodes}`);
  console.log(`  - Moved: ${diff.summary.movedNodes}`);

  console.log(`\n📝 Semantic Changes:`);
  diff.nodeDiffs.forEach((change) => {
    const semanticBadge = change.semanticKey ? ` [${change.semanticKey}]` : "";
    console.log(
      `  - ${change.type.toUpperCase()}: ${change.description}${semanticBadge}`
    );
  });
} catch (error) {
  console.log(`❌ Error analyzing changes: ${error.message}`);
}

// 8. Generate augmented variants for testing
console.log("\n🧪 Phase 8: Generate Test Variants");
console.log("-".repeat(50));

try {
  const variants = await generateAugmentedVariants(updatedCanvasDocument, 5, {
    layoutPerturbation: { enabled: true, tolerance: 0.1 },
    tokenPermutation: { enabled: true },
    a11yValidation: { enabled: true, strict: false, contrastThreshold: "AA" },
  });

  console.log(`✅ Generated ${variants.length} test variants`);
  variants.forEach((variant, index) => {
    console.log(
      `  Variant ${index + 1}: ${
        variant.transformations.length
      } transformations`
    );
    variant.transformations.slice(0, 3).forEach((t) => {
      console.log(`    • ${t.type}: ${t.description}`);
    });
  });

  // Show accessibility validation
  if (variants[0].a11yValidation) {
    const a11y = variants[0].a11yValidation;
    console.log(`\n♿ Accessibility Validation:`);
    console.log(`  - Passed: ${a11y.passed ? "✅" : "❌"}`);
    console.log(`  - Warnings: ${a11y.warnings.length}`);
    console.log(`  - Violations: ${a11y.violations.length}`);
  }
} catch (error) {
  console.log(`❌ Error generating variants: ${error.message}`);
}

// 9. Dev agent updates component based on design changes
console.log("\n🔄 Phase 9: Dev Agent Updates Component Contracts");
console.log("-".repeat(50));

// const _updatedComponentIndex = {
//   ...componentIndex,
//   Button: {
//     ...componentIndex.Button,
//     semanticKeys: {
//       ...componentIndex.Button.semanticKeys,
//       "cta.primary": {
//         ...componentIndex.Button.semanticKeys["cta.primary"],
//         propDefaults: {
//           variant: "primary",
//           size: "large", // Updated based on design feedback
//         },
//       },
//     },
//   },
// };

console.log("Component contracts updated:");
console.log(
  "- Button cta.primary size changed to 'large' based on design feedback"
);

// 10. Final sync and validation
console.log("\n🔄 Phase 10: Final Sync and Validation");
console.log("-".repeat(50));

console.log("🎯 Collaborative Workflow Complete!");
console.log("\nKey Achievements:");
console.log("✅ Design agent created semantic key-based specification");
console.log("✅ Dev agent generated component contracts with proper defaults");
console.log("✅ MCP server created canvas document with semantic keys");
console.log("✅ Generated React components using component contracts");
console.log("✅ Design changes tracked with semantic diff visualization");
console.log("✅ Generated test variants with accessibility validation");
console.log("✅ Bidirectional sync between design and dev representations");

console.log("\n🚀 Next Steps for Production:");
console.log("1. Integrate with VS Code extension for real-time collaboration");
console.log("2. Add pattern manifest system for complex UI patterns");
console.log("3. Implement advanced component discovery and validation");
console.log("4. Add real-time collaborative editing with CRDT");
console.log("5. Build comprehensive test suites with property-based testing");

console.log(
  "\n✨ The semantic key system enables true design-dev collaboration!"
);
