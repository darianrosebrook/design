#!/usr/bin/env node

/**
 * @fileoverview CLI for component indexer
 * @author @darianrosebrook
 */

import * as path from "node:path";
import { buildComponentIndex } from "./index.js";

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log("Designer Component Indexer");
    console.log("");
    console.log("Usage:");
    console.log("  designer-index <root-dir> [options]");
    console.log("");
    console.log("Options:");
    console.log(
      "  --output, -o <path>      Output path (default: design/component-index.json)"
    );
    console.log("  --tsconfig <path>        Path to tsconfig.json");
    console.log("  --include <patterns>     Comma-separated include patterns");
    console.log("  --exclude <patterns>     Comma-separated exclude patterns");
    console.log("  --help, -h               Show this help message");
    console.log("");
    console.log("Examples:");
    console.log("  designer-index src/components");
    console.log("  designer-index src --output dist/components.json");
    console.log("  designer-index src --include 'ui/**,forms/**'");
    process.exit(0);
  }

  const rootDir = path.resolve(process.cwd(), args[0]);
  let outputPath = path.resolve(process.cwd(), "design/component-index.json");
  let tsconfigPath: string | undefined;
  let include: string[] | undefined;
  let exclude: string[] | undefined;

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
    }
  }

  try {
    await buildComponentIndex(rootDir, outputPath, {
      tsconfigPath,
      include,
      exclude,
    });
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to build component index:");
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
