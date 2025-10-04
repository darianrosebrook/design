/**
 * @fileoverview Main entry point for plugin testing framework
 * @author @darianrosebrook
 */

import { PluginTestRunnerImpl } from "./test-runner.js";
// PluginTestRunner is exported from types
export type {
  PluginTestRunner,
  PluginTestConfig,
  PluginTestContext,
  PluginTestSuiteResult,
  PluginTestResult,
  PluginValidationResult,
  PluginPerformanceMetrics,
  PluginTestUtils,
  PluginTestAssertions,
  PerformanceMetricsCollector,
  TestResultStatus,
  PluginTestSuite,
  PluginTestFunction,
  PluginTestReporter,
} from "./types.js";

/**
 * Create a new plugin test runner
 */
export function createPluginTestRunner(
  config?: Partial<import("./types.js").PluginTestConfig>
) {
  return new PluginTestRunnerImpl(config);
}

/**
 * Utility function to run plugin tests
 */
export async function runPluginTests(
  plugin: any, // Using any to avoid import issues
  config?: Partial<import("./types.js").PluginTestConfig>
) {
  const runner = createPluginTestRunner(config);
  return await runner.runTests(plugin);
}

/**
 * Utility function to validate plugin
 */
export async function validatePlugin(
  plugin: any // Using any to avoid import issues
) {
  const runner = createPluginTestRunner();
  return await runner.validatePlugin(plugin);
}
