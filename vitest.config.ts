import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "node",
    include: [
      "packages/**/tests/**/*.{test,spec}.{js,ts,tsx}",
      "packages/**/*.{test,spec}.{js,ts,tsx}",
    ],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.{idea,git,cache,output,temp}/**",
    ],
    environmentMatchGlobs: [
      ["packages/design-system/**", "jsdom"],
      ["packages/design-editor/**", "jsdom"],
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      // CAWS Tier 2 thresholds
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
      // Exclude patterns for accurate coverage calculation
      exclude: [
        "node_modules/",
        "dist/",
        "**/*.d.ts",
        "**/*.config.{js,ts}",
        "**/test/**",
        "**/*.test.{js,ts}",
        "**/*.spec.{js,ts}",
        "examples/",
        "docs/",
        "audit/",
        "prototypes/",
        "**/coverage/**",
        "**/__mocks__/**",
        "**/vite.config.ts",
        "**/vitest.config.ts",
      ],
      // Include source files for comprehensive coverage
      include: [
        "packages/**/src/**/*.{js,ts,tsx}",
        "apps/**/src/**/*.{js,ts,tsx}",
      ],
      // Report configuration for better coverage analysis
      reportsDirectory: "./coverage",
      // Watermarks for coverage quality indication
      watermarks: {
        statements: [80, 95],
        branches: [80, 95],
        functions: [80, 95],
        lines: [80, 95],
      },
    },
    // Test timeout for CI/CD environments
    testTimeout: 10000,
    // Setup files for consistent test environment
    setupFiles: ["./scripts/test-setup.ts"],
    // Bail out after first test failure in CI
    bail: process.env.CI ? 1 : 0,
  },
  resolve: {
    alias: {
      "@": "/Users/darianrosebrook/Desktop/Projects/paths-design-suite/apps/designer/packages/design-editor",
      ws: "/Users/darianrosebrook/Desktop/Projects/paths-design-suite/apps/designer/packages/websocket-server/__mocks__/ws.js",
    },
  },
});
