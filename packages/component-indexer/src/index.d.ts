/**
 * @fileoverview Component indexer for Designer
 * @author @darianrosebrook
 */
import type { ComponentIndex, ComponentSource, DiscoveryOptions, DiscoveryResult } from "./types.js";
export * from "./types.js";
export * from "./scanner.js";
export * from "./watcher.js";
/**
 * Generate component index from discovery results
 */
export declare function generateIndex(discoveryResult: DiscoveryResult, source: ComponentSource): Promise<ComponentIndex>;
/**
 * Save component index to file
 */
export declare function saveIndex(index: ComponentIndex, outputPath: string): Promise<void>;
/**
 * Load component index from file
 */
export declare function loadIndex(inputPath: string): Promise<ComponentIndex>;
/**
 * Build complete component index from source directory
 */
export declare function buildComponentIndex(rootDir: string, outputPath: string, options?: Partial<DiscoveryOptions>): Promise<ComponentIndex>;
//# sourceMappingURL=index.d.ts.map