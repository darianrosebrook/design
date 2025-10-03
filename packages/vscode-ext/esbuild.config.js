/**
 * @fileoverview ESBuild configuration for webview bundles
 * @author @darianrosebrook
 *
 * Bundles canvas-renderer-dom and properties-panel into a single
 * deterministic, CSP-compliant webview bundle for VS Code.
 */

import * as esbuild from "esbuild";
import { createHash } from "crypto";
import { writeFileSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isProduction = process.env.NODE_ENV === "production";
const isWatch = process.argv.includes("--watch");

/**
 * Build configuration for the canvas webview bundle
 */
const canvasWebviewConfig = {
  entryPoints: ["./webviews/canvas/index.tsx"],
  bundle: true,
  outfile: "./dist/webviews/canvas.js",
  platform: "browser",
  target: "es2020",
  format: "iife",
  sourcemap: !isProduction,
  minify: isProduction,
  define: {
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV || "development"
    ),
  },
  external: [],
  loader: {
    ".css": "text",
    ".svg": "text",
  },
  logLevel: "info",
};

/**
 * Generate deterministic hash for bundle integrity
 */
function generateBundleHash(filepath) {
  const content = readFileSync(filepath);
  const hash = createHash("sha256").update(content).digest("hex");
  console.info(`✅ Generated bundle hash: ${hash.substring(0, 16)}...`);

  // Write hash to manifest file
  const manifestPath = path.join(__dirname, "dist/webviews/manifest.json");
  const manifest = {
    canvas: {
      file: "canvas.js",
      hash,
      // Use build hash for deterministic builds (no timestamp)
      buildHash: process.env.BUILD_HASH || "unknown",
      generatedAt: new Date().toISOString(), // For debugging only, not used in hash
    },
  };
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  return hash;
}

/**
 * Build the canvas webview
 */
async function buildCanvasWebview() {
  try {
    console.info("🚀 Building canvas webview bundle...");

    const result = await esbuild.build(canvasWebviewConfig);

    // Generate hash for production builds
    if (isProduction && !isWatch) {
      const bundlePath = path.join(__dirname, "dist/webviews/canvas.js");
      generateBundleHash(bundlePath);
    }

    console.info("✅ Canvas webview bundle built successfully");

    return result;
  } catch (error) {
    console.error("❌ Canvas webview build failed:", error);
    throw error;
  }
}

/**
 * Watch mode for development
 */
async function watchMode() {
  console.info("👀 Starting watch mode...");

  const context = await esbuild.context({
    ...canvasWebviewConfig,
    plugins: [
      {
        name: "rebuild-notify",
        setup(build) {
          build.onEnd((result) => {
            if (result.errors.length === 0) {
              console.info("✅ Canvas webview rebuilt");
            } else {
              console.error("❌ Canvas webview rebuild failed");
            }
          });
        },
      },
    ],
  });

  await context.watch();
  console.info("👀 Watching for changes...");
}

// Main execution
if (isWatch) {
  watchMode().catch((error) => {
    console.error("Watch mode error:", error);
    process.exit(1);
  });
} else {
  buildCanvasWebview().catch((error) => {
    console.error("Build error:", error);
    process.exit(1);
  });
}
