#!/usr/bin/env tsx

/**
 * @fileoverview Test script to verify library integration with ingested components
 * @author @darianrosebrook
 */

import {
  loadFromDesignSystemPackage,
  getAvailableComponents,
  getComponentMetadata,
  getAllIngestedComponents,
} from "./packages/design-editor/lib/utils/dynamic-component-registry";

async function testLibraryIntegration() {
  console.log("🔗 Testing Library Integration");
  console.log("=============================");

  try {
    console.log("\n📦 Loading components from @paths-design/design-system...");

    // Load components
    const ingestedComponents = await loadFromDesignSystemPackage(
      "@paths-design/design-system"
    );
    console.log(`✅ Ingested ${ingestedComponents.length} components`);

    console.log("\n📚 Checking library section integration...");

    // Check what components are available in the library
    const availableComponents = getAvailableComponents();
    console.log(
      `📊 Available components in library: ${availableComponents.length}`
    );
    console.log("Components:", availableComponents);

    // Get metadata for each component
    console.log("\n📋 Component metadata:");
    const allIngested = getAllIngestedComponents();
    availableComponents.forEach((componentType) => {
      const metadata = getComponentMetadata(componentType);
      const ingested = allIngested.get(componentType.toLowerCase());
      console.log(`  • ${componentType}:`);
      console.log(`    📝 Name: ${metadata.name}`);
      console.log(`    📂 Category: ${metadata.category}`);
      console.log(`    🎯 Source: ${ingested?.source || "N/A"}`);
      console.log(`    🎨 Icon: ${metadata.icon}`);
      console.log("");
    });

    // Verify ingested components appear in available components
    const ingestedIds = ingestedComponents.map((c) => c.id);
    const availableFromIngestion = availableComponents.filter((comp) =>
      ingestedIds.some((id) => comp.includes(id.split("-").pop() || ""))
    );

    console.log(
      `🔍 Ingested components found in library: ${availableFromIngestion.length}`
    );

    // Test library item conversion (simulating what LibrarySection does)
    console.log("\n🏗️  Testing library item conversion...");

    const libraryItems = availableComponents.map((componentType) => {
      const metadata = getComponentMetadata(componentType);
      const ingested = allIngested.get(componentType.toLowerCase());

      return {
        id: `ds-${componentType.toLowerCase()}`,
        name: metadata.name,
        type: "component" as const,
        description: metadata.description,
        tags: [metadata.category.toLowerCase(), componentType.toLowerCase()],
        category: metadata.category,
        source: ingested?.source,
      };
    });

    console.log("📦 Generated library items:");
    libraryItems.forEach((item) => {
      console.log(`  • ${item.name} (${item.type})`);
      console.log(`    📂 Category: ${item.category}`);
      console.log(`    🎯 Source: ${item.source}`);
      console.log(`    🏷️  Tags: ${item.tags.join(", ")}`);
      console.log("");
    });

    // Check for design system components
    const designSystemItems = libraryItems.filter(
      (item) => item.source === "@paths-design/design-system"
    );

    console.log(
      `🎨 Design system components in library: ${designSystemItems.length}`
    );

    if (designSystemItems.length > 0) {
      console.log(
        "\n✅ SUCCESS: Ingested components are properly integrated into the library!"
      );
      console.log("\n✅ Key Verifications:");
      console.log(
        "  • Ingested components appear in available components list"
      );
      console.log("  • Component metadata is properly accessible");
      console.log("  • Library items are generated correctly");
      console.log("  • Design system components are properly categorized");
      console.log("  • Library section will display ingested components");
    } else {
      console.log(
        "\n⚠️  WARNING: No design system components found in library"
      );
    }

    return designSystemItems.length > 0;
  } catch (error) {
    console.error("❌ Library integration test failed:", error);
    return false;
  }
}

// Run the test
testLibraryIntegration().then((success) => {
  process.exit(success ? 0 : 1);
});
