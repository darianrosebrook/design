/**
 * @fileoverview File watcher for design tokens auto-regeneration
 * @author @darianrosebrook
 */

import fs from "fs";
import path from "path";
import { resolveTokenReferences, validateTokenReferences } from "./resolver";
import { tokensToCSS } from "./utils";
import { DesignTokensSchema, type DesignTokens } from "./tokens";

export interface WatcherOptions {
  /**
   * Path to the tokens.json file to watch
   */
  tokensPath: string;

  /**
   * Path to output CSS file
   */
  outputPath: string;

  /**
   * Debounce delay in milliseconds (default: 300ms)
   */
  debounceMs?: number;

  /**
   * Callback when tokens are successfully regenerated
   */
  onRegenerate?: (css: string) => void;

  /**
   * Callback when an error occurs
   */
  onError?: (error: Error) => void;

  /**
   * Enable verbose logging
   */
  verbose?: boolean;
}

export interface WatcherInstance {
  /**
   * Stop watching the file
   */
  stop: () => void;

  /**
   * Manually trigger a regeneration
   */
  regenerate: () => Promise<void>;
}

/**
 * Watch tokens file and auto-regenerate CSS on changes
 * 
 * @param options - Watcher configuration
 * @returns Watcher instance with stop() and regenerate() methods
 * 
 * @example
 * ```ts
 * const watcher = watchTokens({
 *   tokensPath: "design/tokens.json",
 *   outputPath: "src/ui/tokens.css",
 *   onRegenerate: (css) => console.log("✅ Regenerated CSS"),
 *   onError: (err) => console.error("❌ Error:", err),
 * });
 * 
 * // Later, stop watching
 * watcher.stop();
 * ```
 */
export function watchTokens(options: WatcherOptions): WatcherInstance {
  const {
    tokensPath,
    outputPath,
    debounceMs = 300,
    onRegenerate,
    onError,
    verbose = false,
  } = options;

  let debounceTimer: NodeJS.Timeout | null = null;
  let isRegenerating = false;

  /**
   * Log message if verbose mode is enabled
   */
  function log(message: string): void {
    if (verbose) {
      console.log(`[TokenWatcher] ${message}`);
    }
  }

  /**
   * Regenerate CSS from tokens
   */
  async function regenerate(): Promise<void> {
    // Prevent concurrent regenerations
    if (isRegenerating) {
      log("Regeneration already in progress, skipping");
      return;
    }

    isRegenerating = true;

    try {
      log(`Reading tokens from ${tokensPath}`);
      
      // Read and parse tokens file
      const tokensContent = fs.readFileSync(tokensPath, "utf8");
      const tokensJson = JSON.parse(tokensContent);

      // Validate schema
      const parseResult = DesignTokensSchema.safeParse(tokensJson);
      if (!parseResult.success) {
        throw new Error(
          `Invalid tokens schema: ${parseResult.error.issues
            .map((e: any) => `${e.path.join(".")}: ${e.message}`)
            .join(", ")}`
        );
      }

      const tokens = parseResult.data;

      // Validate token references
      const validation = validateTokenReferences(tokens);
      if (!validation.valid) {
        throw new Error(
          `Invalid token references: ${validation.errors.join(", ")}`
        );
      }

      log("Resolving token references");
      
      // Resolve references and generate CSS
      const css = tokensToCSS(tokens, ":root", { resolveReferences: true });

      log(`Writing CSS to ${outputPath}`);
      
      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Write CSS file
      fs.writeFileSync(outputPath, css, "utf8");

      log("✅ Successfully regenerated CSS");
      onRegenerate?.(css);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      log(`❌ Error during regeneration: ${err.message}`);
      onError?.(err);
    } finally {
      isRegenerating = false;
    }
  }

  /**
   * Handle file change with debouncing
   */
  function handleChange(eventType: string, filename: string | null): void {
    if (eventType !== "change" && eventType !== "rename") {
      return;
    }

    log(`File change detected: ${eventType} - ${filename ?? "unknown"}`);

    // Clear existing debounce timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Schedule regeneration after debounce period
    debounceTimer = setTimeout(() => {
      regenerate().catch((err) => {
        log(`❌ Regeneration failed: ${err.message}`);
        onError?.(err instanceof Error ? err : new Error(String(err)));
      });
    }, debounceMs);
  }

  // Verify tokens file exists
  if (!fs.existsSync(tokensPath)) {
    throw new Error(`Tokens file not found: ${tokensPath}`);
  }

  // Perform initial regeneration
  log(`Starting watcher for ${tokensPath}`);
  regenerate().catch((err) => {
    log(`❌ Initial regeneration failed: ${err.message}`);
    onError?.(err instanceof Error ? err : new Error(String(err)));
  });

  // Start watching the file
  const watcher = fs.watch(tokensPath, handleChange);

  // Return watcher instance
  return {
    stop: () => {
      log("Stopping watcher");
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      watcher.close();
    },
    regenerate,
  };
}

/**
 * Watch tokens file and auto-regenerate CSS (simpler API without callbacks)
 * 
 * @param tokensPath - Path to tokens.json
 * @param outputPath - Path to output CSS file
 * @param options - Optional configuration
 * @returns Watcher instance
 * 
 * @example
 * ```ts
 * const watcher = watchTokensSimple(
 *   "design/tokens.json",
 *   "src/ui/tokens.css",
 *   { verbose: true }
 * );
 * ```
 */
export function watchTokensSimple(
  tokensPath: string,
  outputPath: string,
  options?: { debounceMs?: number; verbose?: boolean }
): WatcherInstance {
  return watchTokens({
    tokensPath,
    outputPath,
    debounceMs: options?.debounceMs,
    verbose: options?.verbose,
    onRegenerate: (css) => {
      console.log(`✅ Regenerated ${outputPath} (${css.length} bytes)`);
    },
    onError: (error) => {
      console.error(`❌ Error: ${error.message}`);
    },
  });
}

