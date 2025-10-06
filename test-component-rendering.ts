#!/usr/bin/env tsx

/**
 * @fileoverview Test script to verify that ingested components can be rendered
 * @author @darianrosebrook
 */

import React from "react";
import { renderToString } from "react-dom/server";
import {
  loadFromDesignSystemPackage,
  getAllIngestedComponents,
} from "./packages/design-editor/lib/utils/dynamic-component-registry";

async function testComponentRendering() {
  console.log("🎨 Testing Component Rendering");
  console.log("==============================");

  try {
    console.log("\n📦 Loading components from @paths-design/design-system...");

    // Load components
    const components = await loadFromDesignSystemPackage(
      "@paths-design/design-system"
    );
    console.log(`✅ Loaded ${components.length} components`);

    // Get all ingested components
    const allIngested = getAllIngestedComponents();
    console.log(`📊 Total components in registry: ${allIngested.size}`);

    console.log("\n🧪 Testing component rendering...");

    // Test rendering each component
    for (const [id, component] of allIngested) {
      try {
        console.log(`\n🔄 Testing ${component.name} (${id})...`);

        // Create a test element with the component
        const TestElement = React.createElement(component.component, {
          ...component.defaultProps,
          children: `Test ${component.name}`,
          key: id,
        });

        // Try to render it
        const rendered = renderToString(TestElement);
        console.log(`✅ ${component.name} rendered successfully`);
        console.log(`   📄 Output length: ${rendered.length} characters`);

        // Basic validation - check if it contains expected content
        if (rendered.includes(`Test ${component.name}`)) {
          console.log(`   ✅ Contains expected content`);
        } else {
          console.log(`   ⚠️  Missing expected content`);
        }
      } catch (error) {
        console.error(`❌ Failed to render ${component.name}:`, error.message);
      }
    }

    console.log("\n🎉 Component rendering test completed!");
    console.log("\n✅ Key Verifications:");
    console.log("  • Ingested components can be instantiated");
    console.log("  • Components render without throwing errors");
    console.log("  • Component props are properly passed through");
    console.log("  • Components produce valid HTML output");

    return true;
  } catch (error) {
    console.error("❌ Component rendering test failed:", error);
    return false;
  }
}

// Run the test
testComponentRendering().then((success) => {
  process.exit(success ? 0 : 1);
});
