/**
 * @fileoverview Component indexer for Designer
 * @author @darianrosebrook
 */
import * as fs from "node:fs/promises";
import { ComponentIndexSchema } from "./types.js";
import { discoverComponents } from "./scanner.js";
export * from "./types.js";
export * from "./scanner.js";
export * from "./watcher.js";
/**
 * Generate component index from discovery results
 */
export async function generateIndex(discoveryResult, source) {
    const index = {
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
export async function saveIndex(index, outputPath) {
    const json = JSON.stringify(index, null, 2);
    await fs.writeFile(outputPath, json, "utf-8");
}
/**
 * Load component index from file
 */
export async function loadIndex(inputPath) {
    const content = await fs.readFile(inputPath, "utf-8");
    const data = JSON.parse(content);
    return ComponentIndexSchema.parse(data);
}
/**
 * Build complete component index from source directory
 */
export async function buildComponentIndex(rootDir, outputPath, options) {
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
        console.warn(`⚠️ ${discoveryResult.errors.length} errors during component discovery:`);
        for (const error of discoveryResult.errors) {
            console.warn(`  - ${error.file}: ${error.error}`);
        }
    }
    // Generate index
    const source = {
        root: rootDir,
        resolver: options?.tsconfigPath ? "tsconfig" : "custom",
        include: options?.include,
        exclude: options?.exclude,
    };
    const index = await generateIndex(discoveryResult, source);
    // Save index
    await saveIndex(index, outputPath);
    console.log(`✅ Generated component index: ${outputPath}`);
    console.log(`   Found ${discoveryResult.stats.componentsFound} components`);
    console.log(`   Scanned ${discoveryResult.stats.filesScanned} files`);
    console.log(`   Duration: ${discoveryResult.stats.duration}ms`);
    return index;
}
