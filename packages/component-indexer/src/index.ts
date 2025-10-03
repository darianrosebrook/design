/**
 * @fileoverview Component indexer for Designer
 * @author @darianrosebrook
 */

import * as fs from "node:fs/promises";
// import * as path from "node:path"; // TODO: Remove if not needed
import { discoverComponents } from "./scanner.js";
import type {
  ComponentIndex,
  ComponentSource,
  DiscoveryOptions,
  DiscoveryResult,
} from "./types.js";
import { ComponentIndexSchema } from "./types.js";

export * from "./types.js";
export * from "./scanner.js";
export * from "./watcher.js";

/**
 * Generate component index from discovery results
 */
export async function generateIndex(
  discoveryResult: DiscoveryResult,
  source: ComponentSource
): Promise<ComponentIndex> {
  const index: ComponentIndex = {
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    source,
    components: discoveryResult.components,
  };

  // Validate against schema
  const validated = ComponentIndexSchema.parse(index);
  return validated;
}

/**
 * Save component index to file
 */
export async function saveIndex(
  index: ComponentIndex,
  outputPath: string
): Promise<void> {
  const json = JSON.stringify(index, null, 2);
  await fs.writeFile(outputPath, json, "utf-8");
}

/**
 * Load component index from file
 */
export async function loadIndex(inputPath: string): Promise<ComponentIndex> {
  const content = await fs.readFile(inputPath, "utf-8");
  const data = JSON.parse(content);
  return ComponentIndexSchema.parse(data);
}

/**
 * Build complete component index from source directory
 */
export async function buildComponentIndex(
  rootDir: string,
  outputPath: string,
  options?: Partial<DiscoveryOptions>
): Promise<ComponentIndex> {
  // Discover components
  const discoveryResult = await discoverComponents({
    rootDir,
    tsconfigPath: options?.tsconfigPath,
    include: options?.include,
    exclude: options?.exclude,
    followSymlinks: options?.followSymlinks ?? false,
    maxDepth: options?.maxDepth ?? 10,
  });

  // Report errors
  if (discoveryResult.errors.length > 0) {
    console.warn(
      `⚠️ ${discoveryResult.errors.length} errors during component discovery:`
    );
    for (const error of discoveryResult.errors) {
      console.warn(`  - ${error.file}: ${error.error}`);
    }
  }

  // Generate index
  const source: ComponentSource = {
    root: rootDir,
    resolver: options?.tsconfigPath ? "tsconfig" : "custom",
    include: options?.include,
    exclude: options?.exclude,
  };

  const index = await generateIndex(discoveryResult, source);

  // Save index
  await saveIndex(index, outputPath);

  console.info(`✅ Generated component index: ${outputPath}`);
  console.info(`   Found ${discoveryResult.stats.componentsFound} components`);
  console.info(`   Scanned ${discoveryResult.stats.filesScanned} files`);
  console.info(`   Duration: ${discoveryResult.stats.duration}ms`);

  return index;
}
