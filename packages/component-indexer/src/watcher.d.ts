/**
 * @fileoverview File watcher for automatic component index updates
 * @author @darianrosebrook
 */
import type { ComponentIndex, DiscoveryOptions } from "./types.js";
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
export declare class ComponentIndexWatcher {
    private watcher;
    private rebuildTimer;
    private options;
    private isRebuilding;
    private changedFiles;
    constructor(options: WatcherOptions);
    /**
     * Start watching for file changes
     */
    start(): Promise<void>;
    /**
     * Stop watching
     */
    stop(): void;
    /**
     * Schedule a rebuild with debouncing
     */
    private scheduleRebuild;
    /**
     * Rebuild the component index
     */
    private rebuild;
    /**
     * Check if file should trigger a rebuild
     */
    private shouldProcessFile;
}
/**
 * Convenience function to start watching
 */
export declare function watchComponents(options: WatcherOptions): Promise<ComponentIndexWatcher>;
//# sourceMappingURL=watcher.d.ts.map