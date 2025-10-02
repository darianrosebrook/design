#!/usr/bin/env node

/**
 * @fileoverview CLI interface for React code generation
 * @author @darianrosebrook
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { generateReactComponents, createFixedClock } from "./index.js";

/**
 * CLI options interface
 */
interface CLIOptions {
  input: string;
  output: string;
  format: "tsx" | "jsx";
  indent: number;
  verbose: boolean;
  fixedTimestamp?: number;
  fixedUuid?: string;
}

/**
 * Parse command line arguments
 */
function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    input: "",
    output: "",
    format: "tsx",
    indent: 2,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--input":
      case "-i":
        options.input = args[++i];
        break;
      case "--output":
      case "-o":
        options.output = args[++i];
        break;
      case "--format":
      case "-f":
        const format = args[++i];
        if (format === "jsx" || format === "tsx") {
          options.format = format;
        } else {
          console.error("Invalid format. Use 'tsx' or 'jsx'");
          process.exit(1);
        }
        break;
      case "--indent":
      case "-d":
        options.indent = parseInt(args[++i], 10);
        if (isNaN(options.indent) || options.indent < 0) {
          console.error("Invalid indent value");
          process.exit(1);
        }
        break;
      case "--verbose":
      case "-v":
        options.verbose = true;
        break;
      case "--fixed-timestamp":
        options.fixedTimestamp = parseInt(args[++i], 10);
        if (isNaN(options.fixedTimestamp)) {
          console.error("Invalid timestamp value");
          process.exit(1);
        }
        break;
      case "--fixed-uuid":
        options.fixedUuid = args[++i];
        if (!options.fixedUuid || options.fixedUuid.length !== 26) {
          console.error("Invalid UUID (must be 26 characters)");
          process.exit(1);
        }
        break;
      case "--help":
      case "-h":
        showHelp();
        process.exit(0);
      default:
        if (arg.startsWith("-")) {
          console.error(`Unknown option: ${arg}`);
          showHelp();
          process.exit(1);
        }
        // Positional arguments
        if (!options.input) {
          options.input = arg;
        } else if (!options.output) {
          options.output = arg;
        } else {
          console.error("Too many arguments");
          showHelp();
          process.exit(1);
        }
    }
  }

  // Validate required arguments
  if (!options.input) {
    console.error("Input file is required");
    showHelp();
    process.exit(1);
  }

  if (!options.output) {
    console.error("Output directory is required");
    showHelp();
    process.exit(1);
  }

  return options;
}

/**
 * Show help information
 */
function showHelp(): void {
  console.log(`
Designer React Code Generator

Usage:
  pencil-generate <input-file> <output-dir> [options]

Options:
  -i, --input <file>           Input canvas JSON file
  -o, --output <dir>           Output directory for generated files
  -f, --format <format>        Output format: tsx or jsx (default: tsx)
  -d, --indent <number>        Indentation spaces (default: 2)
  -v, --verbose                Verbose output
  --fixed-timestamp <number>   Fixed timestamp for deterministic output
  --fixed-uuid <string>        Fixed UUID for deterministic output
  -h, --help                   Show this help

Examples:
  pencil-generate design/home.canvas.json src/ui
  pencil-generate -i design/home.canvas.json -o src/ui -f tsx
  pencil-generate --fixed-timestamp 1234567890000 --fixed-uuid 01JF2PZV9G2WR5C3W7P0YHNX9D
`);
}

/**
 * Main CLI execution
 */
async function main(): Promise<void> {
  try {
    const options = parseArgs();

    if (options.verbose) {
      console.log("Generating React components...");
      console.log(`Input: ${options.input}`);
      console.log(`Output: ${options.output}`);
      console.log(`Format: ${options.format}`);
    }

    // Read input file
    let inputContent: string;
    try {
      inputContent = readFileSync(options.input, "utf8");
    } catch (_error) {
      console.error(`Failed to read input file: ${options.input}`);
      process.exit(1);
    }

    // Parse JSON
    let document: Record<string, unknown>;
    try {
      document = JSON.parse(inputContent);
    } catch (_error) {
      console.error(`Failed to parse JSON: ${_error}`);
      process.exit(1);
    }

    // Set up deterministic clock if requested
    let clock = undefined;
    if (
      options.fixedTimestamp !== undefined &&
      options.fixedUuid !== undefined
    ) {
      clock = createFixedClock(options.fixedTimestamp, options.fixedUuid);
      if (options.verbose) {
        console.log(
          `Using fixed clock: timestamp=${options.fixedTimestamp}, uuid=${options.fixedUuid}`
        );
      }
    }

    // Generate components
    const result = generateReactComponents(document as any, {
      clock,
      format: options.format,
      indent: options.indent,
    });

    // Ensure output directory exists
    try {
      mkdirSync(options.output, { recursive: true });
    } catch (_error) {
      console.error(`Failed to create output directory: ${options.output}`);
      process.exit(1);
    }

    // Write generated files
    let filesWritten = 0;
    for (const file of result.files) {
      const outputPath = join(options.output, file.path);
      try {
        writeFileSync(outputPath, file.content, "utf8");
        if (options.verbose) {
          console.log(`Generated: ${outputPath}`);
        }
        filesWritten++;
      } catch (_error) {
        console.error(`Failed to write file: ${outputPath}`);
        process.exit(1);
      }
    }

    // Success message
    console.log(`✅ Generated ${filesWritten} files in ${options.output}`);
    console.log(
      `📊 Processed ${result.metadata.artboardCount} artboards, ${result.metadata.nodeCount} nodes`
    );
  } catch (error) {
    console.error("Generation failed:", error);
    process.exit(1);
  }
}

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("CLI error:", error);
    process.exit(1);
  });
}
