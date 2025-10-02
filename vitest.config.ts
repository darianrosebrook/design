import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: [
      "packages/**/tests/**/*.{test,spec}.{js,ts}",
      "packages/**/*.{test,spec}.{js,ts}",
    ],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.{idea,git,cache,output,temp}/**",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "**/*.d.ts",
        "**/*.config.{js,ts}",
        "**/test/**",
        "examples/",
        "docs/",
      ],
    },
  },
});
