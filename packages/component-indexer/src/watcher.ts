/**
 * @fileoverview File watcher for automatic component index updates
 * @author @darianrosebrook
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { ComponentIndex, DiscoveryOptions } from "./types.js";
import { buildComponentIndex } from "./index.js";

/**
 * Watcher configuration options
 */
export interface WatcherOptions extends Partial<DiscoveryOptions> {
  /** Root directory to watch */
  rootDir: string;
  /** Output path for the component index */
  outputPath: string;
  /** Debounce delay in milliseconds (default: 500) */
  debounceMs?: number;
  /** Callback when index is rebuilt */
  onRebuild?: (index: ComponentIndex) => void;
  /** Callback when errors occur */
  onError?: (error: Error) => void;
  /** Callback when file changes are detected */
  onChange?: (filePath: string) => void;
}

/**
 * Component index watcher
 * Watches TypeScript files and rebuilds the component index on changes
 */
/**
 * Internal watcher options with required callbacks
 */
interface ResolvedWatcherOptions {
  rootDir: string;
  outputPath: string;
  tsconfigPath: string | undefined;
  include: string[] | undefined;
  exclude: string[] | undefined;
  followSymlinks: boolean;
  maxDepth: number;
  debounceMs: number;
  onRebuild: (index: ComponentIndex) => void;
  onError: (error: Error) => void;
  onChange: (filePath: string) => void;
}

export class ComponentIndexWatcher {
  private watcher: fs.FSWatcher | null = null;
  private rebuildTimer: NodeJS.Timeout | null = null;
  private options: ResolvedWatcherOptions;
  private isRebuilding = false;
  private changedFiles = new Set<string>();

  constructor(options: WatcherOptions) {
    this.options = {
      rootDir: options.rootDir,
      outputPath: options.outputPath,
      tsconfigPath: options.tsconfigPath,
      include: options.include,
      exclude: options.exclude,
      followSymlinks: options.followSymlinks ?? false,
      maxDepth: options.maxDepth ?? 10,
      debounceMs: options.debounceMs ?? 500,
      onRebuild: options.onRebuild ?? (() => {}),
      onError: options.onError ?? (() => {}),
      onChange: options.onChange ?? (() => {}),
    };
  }

  /**
   * Start watching for file changes
   */
  async start(): Promise<void> {
    // Build initial index
    console.info(`🔍 Building initial component index...`);
    await this.rebuild();

    // Start watching
    console.info(`👀 Watching for changes in ${this.options.rootDir}...`);
    this.watcher = fs.watch(
      this.options.rootDir,
      { recursive: true },
      (eventType, filename) => {
        if (filename && this.shouldProcessFile(filename)) {
          const fullPath = path.join(this.options.rootDir, filename);
          this.changedFiles.add(fullPath);
          this.options.onChange(fullPath);
          this.scheduleRebuild();
        }
      }
    );
  }

  /**
   * Stop watching
   */
  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    if (this.rebuildTimer) {
      clearTimeout(this.rebuildTimer);
      this.rebuildTimer = null;
    }

    console.info(`🛑 Stopped watching`);
  }

  /**
   * Schedule a rebuild with debouncing
   */
  private scheduleRebuild(): void {
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
  private async rebuild(): Promise<void> {
    if (this.isRebuilding) {
      return;
    }

    this.isRebuilding = true;
    const changedCount = this.changedFiles.size;

    try {
      if (changedCount > 0) {
        console.log(`\n🔄 Rebuilding index (${changedCount} files changed)...`);
      }

      const index = await buildComponentIndex(
        this.options.rootDir,
        this.options.outputPath,
        {
          tsconfigPath: this.options.tsconfigPath,
          include: this.options.include,
          exclude: this.options.exclude,
          followSymlinks: this.options.followSymlinks,
          maxDepth: this.options.maxDepth,
        }
      );

      this.options.onRebuild(index);
      this.changedFiles.clear();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(`❌ Error rebuilding index: ${err.message}`);
      this.options.onError(err);
    } finally {
      this.isRebuilding = false;
    }
  }

  /**
   * Check if file should trigger a rebuild
   */
  private shouldProcessFile(filename: string): boolean {
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
    if (
      filename.includes(".test.") ||
      filename.includes(".spec.") ||
      filename.includes("__tests__")
    ) {
      return false;
    }

    // Check exclude patterns
    if (this.options.exclude && this.options.exclude.length > 0) {
      const excluded = this.options.exclude.some((pattern) =>
        filename.includes(pattern)
      );
      if (excluded) {
        return false;
      }
    }

    return true;
  }
}

/**
 * Convenience function to start watching
 */
export async function watchComponents(
  options: WatcherOptions
): Promise<ComponentIndexWatcher> {
  const watcher = new ComponentIndexWatcher(options);
  await watcher.start();
  return watcher;
}
