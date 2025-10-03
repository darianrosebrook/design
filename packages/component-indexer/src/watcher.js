/**
 * @fileoverview File watcher for automatic component index updates
 * @author @darianrosebrook
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { buildComponentIndex } from "./index.js";
export class ComponentIndexWatcher {
    watcher = null;
    rebuildTimer = null;
    options;
    isRebuilding = false;
    changedFiles = new Set();
    constructor(options) {
        this.options = {
            rootDir: options.rootDir,
            outputPath: options.outputPath,
            tsconfigPath: options.tsconfigPath,
            include: options.include,
            exclude: options.exclude,
            followSymlinks: options.followSymlinks ?? false,
            maxDepth: options.maxDepth ?? 10,
            debounceMs: options.debounceMs ?? 500,
            onRebuild: options.onRebuild ?? (() => { }),
            onError: options.onError ?? (() => { }),
            onChange: options.onChange ?? (() => { }),
        };
    }
    /**
     * Start watching for file changes
     */
    async start() {
        // Build initial index
        console.log(`🔍 Building initial component index...`);
        await this.rebuild();
        // Start watching
        console.log(`👀 Watching for changes in ${this.options.rootDir}...`);
        this.watcher = fs.watch(this.options.rootDir, { recursive: true }, (eventType, filename) => {
            if (filename && this.shouldProcessFile(filename)) {
                const fullPath = path.join(this.options.rootDir, filename);
                this.changedFiles.add(fullPath);
                this.options.onChange(fullPath);
                this.scheduleRebuild();
            }
        });
    }
    /**
     * Stop watching
     */
    stop() {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
        }
        if (this.rebuildTimer) {
            clearTimeout(this.rebuildTimer);
            this.rebuildTimer = null;
        }
        console.log(`🛑 Stopped watching`);
    }
    /**
     * Schedule a rebuild with debouncing
     */
    scheduleRebuild() {
        if (this.rebuildTimer) {
            clearTimeout(this.rebuildTimer);
        }
        this.rebuildTimer = setTimeout(() => {
            this.rebuild();
        }, this.options.debounceMs);
    }
    /**
     * Rebuild the component index
     */
    async rebuild() {
        if (this.isRebuilding) {
            return;
        }
        this.isRebuilding = true;
        const changedCount = this.changedFiles.size;
        try {
            if (changedCount > 0) {
                console.log(`\n🔄 Rebuilding index (${changedCount} files changed)...`);
            }
            const index = await buildComponentIndex(this.options.rootDir, this.options.outputPath, {
                tsconfigPath: this.options.tsconfigPath,
                include: this.options.include,
                exclude: this.options.exclude,
                followSymlinks: this.options.followSymlinks,
                maxDepth: this.options.maxDepth,
            });
            this.options.onRebuild(index);
            this.changedFiles.clear();
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error(`❌ Error rebuilding index: ${err.message}`);
            this.options.onError(err);
        }
        finally {
            this.isRebuilding = false;
        }
    }
    /**
     * Check if file should trigger a rebuild
     */
    shouldProcessFile(filename) {
        // Only process TypeScript/TSX files
        if (!(filename.endsWith(".ts") || filename.endsWith(".tsx"))) {
            return false;
        }
        // Skip declaration files
        if (filename.endsWith(".d.ts")) {
            return false;
        }
        // Skip node_modules
        if (filename.includes("node_modules")) {
            return false;
        }
        // Skip test files
        if (filename.includes(".test.") ||
            filename.includes(".spec.") ||
            filename.includes("__tests__")) {
            return false;
        }
        // Check exclude patterns
        if (this.options.exclude && this.options.exclude.length > 0) {
            const excluded = this.options.exclude.some((pattern) => filename.includes(pattern));
            if (excluded)
                return false;
        }
        return true;
    }
}
/**
 * Convenience function to start watching
 */
export async function watchComponents(options) {
    const watcher = new ComponentIndexWatcher(options);
    await watcher.start();
    return watcher;
}
