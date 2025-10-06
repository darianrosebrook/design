/**
 * @fileoverview Stryker mutation testing configuration for CAWS compliance
 * @author @darianrosebrook
 */

module.exports = {
  // Test runner configuration
  testRunner: "vitest",

  // Coverage analysis configuration
  coverageAnalysis: "perTest",

  // Mutation testing configuration
  mutator: "typescript",

  // File patterns to mutate
  mutate: [
    "packages/**/src/**/*.{js,ts,tsx}",
    "!packages/**/src/**/*.d.ts",
    "!packages/**/src/**/*.test.{js,ts,tsx}",
    "!packages/**/src/**/*.spec.{js,ts,tsx}",
  ],

  // Files to include in the test run
  files: [
    "packages/**/src/**/*.{js,ts,tsx}",
    "packages/**/tests/**/*.{js,ts,tsx}",
    "!packages/**/src/**/*.d.ts",
  ],

  // Files to exclude from mutation testing
  exclude: [
    "**/*.d.ts",
    "**/*.config.{js,ts}",
    "**/node_modules/**",
    "**/dist/**",
    "**/coverage/**",
    "**/__mocks__/**",
  ],

  // CAWS mutation score thresholds
  thresholds: {
    high: 80,
    low: 70,
    break: 60,
  },

  // Reporter configuration
  reporters: ["html", "json", "progress", "dashboard"],

  // HTML reporter configuration
  htmlReporter: {
    baseDir: "coverage/mutation",
  },

  // Dashboard reporter configuration
  dashboard: {
    baseUrl: "https://dashboard.stryker-mutator.io",
  },

  // JSON reporter for CI integration
  jsonReporter: {
    fileName: "coverage/mutation-report.json",
  },

  // Timeout configuration for slow tests
  timeoutMS: 30000,

  // Parallel execution for faster runs
  maxConcurrentTestRunners: 4,

  // Temporary files configuration
  tempDirName: "stryker-tmp",

  // Clean temporary files after run
  cleanTempDir: true,

  // Disable type checking during mutation testing for speed
  disableTypeChecks: false,

  // Enable experimental features
  experimentalFeatures: {
    // Enable optimized mutation testing
    optimizedMutations: true,
  },
};
