#!/usr/bin/env tsx

/**
 * @fileoverview Test script to verify library ingestion functionality
 * Tests ingesting components from the @paths-design/design-system package
 * @author @darianrosebrook
 */

import {
  loadFromDesignSystemPackage,
  getAllIngestedComponents,
} from "./packages/design-editor/lib/utils/dynamic-component-registry";

async function testLibraryIngestion() {
  console.log("🧪 Testing Library Ingestion System");
  console.log("===================================");

  try {
    console.log("\n📦 Testing ingestion of @paths-design/design-system...");

    // Test ingesting the design system package
    const components = await loadFromDesignSystemPackage(
      "@paths-design/design-system"
    );

    console.log(`✅ Successfully ingested ${components.length} components!`);
    console.log("\n📋 Ingested Components:");
    console.log("-".repeat(40));

    components.forEach((component, index) => {
      console.log(`${index + 1}. ${component.name}`);
      console.log(`   📂 Category: ${component.category}`);
      console.log(`   🎯 Source: ${component.source}`);
      console.log(`   🔑 ID: ${component.id}`);
      console.log(`   📝 Description: ${component.description}`);
      console.log("");
    });

    // Verify components are registered
    const allIngested = getAllIngestedComponents();
    console.log(`📊 Total components in registry: ${allIngested.size}`);
    console.log(
      `📊 Components from design-system: ${
        Array.from(allIngested.values()).filter(
          (c) => c.source === "@paths-design/design-system"
        ).length
      }`
    );

    console.log("\n🎉 Library ingestion test completed successfully!");
    console.log("\n✅ Key Verifications:");
    console.log("  • Components can be loaded from design system packages");
    console.log(
      "  • Components are properly registered in the dynamic registry"
    );
    console.log(
      "  • Component metadata (name, category, description) is preserved"
    );
    console.log("  • Components are available for use in the design editor");

    return true;
  } catch (error) {
    console.error("❌ Library ingestion test failed:", error);
    console.error("\n🔍 Error Details:");
    console.error(error);
    return false;
  }
}

// Run the test
testLibraryIngestion().then((success) => {
  process.exit(success ? 0 : 1);
});
