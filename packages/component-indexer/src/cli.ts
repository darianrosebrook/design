#!/usr/bin/env node

/**
 * @fileoverview CLI for component indexer
 * @author @darianrosebrook
 */

import * as path from "node:path";
import { buildComponentIndex, watchComponents } from "./index.js";

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.info("Designer Component Indexer");
    console.info("");
    console.info("Usage:");
    console.info("  designer-index <root-dir> [options]");
    console.info("");
    console.info("Options:");
    console.info(
      "  --output, -o <path>      Output path (default: design/component-index.json)"
    );
    console.info("  --tsconfig <path>        Path to tsconfig.json");
    console.info("  --include <patterns>     Comma-separated include patterns");
    console.info("  --exclude <patterns>     Comma-separated exclude patterns");
    console.info(
      "  --watch, -w              Watch for changes and rebuild automatically"
    );
    console.info(
      "  --debounce <ms>          Debounce delay for watch mode (default: 500)"
    );
    console.info("  --help, -h               Show this help message");
    console.info("");
    console.info("Examples:");
    console.info("  designer-index src/components");
    console.info("  designer-index src --output dist/components.json");
    console.info("  designer-index src --include 'ui/**,forms/**'");
    console.info("  designer-index src --watch --debounce 1000");
    process.exit(0);
  }

  const rootDir = path.resolve(process.cwd(), args[0]);
  let outputPath = path.resolve(process.cwd(), "design/component-index.json");
  let tsconfigPath: string | undefined;
  let include: string[] | undefined;
  let exclude: string[] | undefined;
  let watch = false;
  let debounceMs = 500;

  // Parse options
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--output" || arg === "-o") {
      outputPath = path.resolve(process.cwd(), args[++i]);
    } else if (arg === "--tsconfig") {
      tsconfigPath = path.resolve(process.cwd(), args[++i]);
    } else if (arg === "--include") {
      include = args[++i].split(",").map((p) => p.trim());
    } else if (arg === "--exclude") {
      exclude = args[++i].split(",").map((p) => p.trim());
    } else if (arg === "--watch" || arg === "-w") {
      watch = true;
    } else if (arg === "--debounce") {
      debounceMs = parseInt(args[++i], 10);
    }
  }

  try {
    if (watch) {
      // Watch mode
      const watcher = await watchComponents({
        rootDir,
        outputPath,
        tsconfigPath,
        include,
        exclude,
        debounceMs,
        onChange: (filePath) => {
          console.info(`📝 Changed: ${path.relative(process.cwd(), filePath)}`);
        },
        onError: (error) => {
          console.error(`❌ Error: ${error.message}`);
        },
      });

      // Handle graceful shutdown
      process.on("SIGINT", () => {
        console.info("\n👋 Shutting down watcher...");
        watcher.stop();
        process.exit(0);
      });

      process.on("SIGTERM", () => {
        watcher.stop();
        process.exit(0);
      });

      // Keep process alive
      console.info("\n✅ Watch mode active. Press Ctrl+C to stop.");
    } else {
      // One-time build
      await buildComponentIndex(rootDir, outputPath, {
        tsconfigPath,
        include,
        exclude,
      });
      process.exit(0);
    }
  } catch (error) {
    console.error("❌ Failed to build component index:");
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
