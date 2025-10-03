import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@paths-design/canvas-schema": path.resolve(
        __dirname,
        "../canvas-schema/src/index.ts"
      ),
      "@paths-design/canvas-engine": path.resolve(
        __dirname,
        "../canvas-engine/src/index.ts"
      ),
      "@paths-design/component-indexer": path.resolve(
        __dirname,
        "../component-indexer/src/index.ts"
      ),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
      exclude: ["dist/**", "tests/**", "**/*.d.ts", "**/*.config.ts"],
    },
  },
});

