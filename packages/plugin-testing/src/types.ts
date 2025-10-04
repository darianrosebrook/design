/**
 * @fileoverview Types for plugin testing framework
 * @author @darianrosebrook
 */

// Using any types to avoid import issues during build
type CanvasDocumentType = any;
type NodeType = any;
type Plugin = any;

/**
 * Plugin test result status
 */
export type TestResultStatus = "passed" | "failed" | "skipped" | "error";

/**
 * Plugin test result
 */
export interface PluginTestResult {
  /** Test name */
  name: string;
  /** Test status */
  status: TestResultStatus;
  /** Test duration in milliseconds */
  duration: number;
  /** Error message if test failed */
  error?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Plugin test suite result
 */
export interface PluginTestSuiteResult {
  /** Plugin ID */
  pluginId: string;
  /** Suite name */
  suiteName: string;
  /** Test results */
  results: PluginTestResult[];
  /** Suite duration */
  duration: number;
  /** Number of passed tests */
  passed: number;
  /** Number of failed tests */
  failed: number;
  /** Number of skipped tests */
  skipped: number;
  /** Number of error tests */
  errors: number;
  /** Overall suite status */
  status: TestResultStatus;
}

/**
 * Plugin validation result
 */
export interface PluginValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Validation errors */
  errors: string[];
  /** Validation warnings */
  warnings: string[];
  /** Plugin metadata validation */
  metadataValid: boolean;
  /** Compatibility validation */
  compatibilityValid: boolean;
  /** Security validation */
  securityValid: boolean;
}

/**
 * Plugin performance metrics
 */
export interface PluginPerformanceMetrics {
  /** Plugin load time */
  loadTime: number;
  /** Memory usage */
  memoryUsage: number;
  /** Initialization time */
  initTime: number;
  /** Execution time for various operations */
  executionTimes: Record<string, number>;
}

/**
 * Plugin test context
 */
export interface PluginTestContext {
  /** Plugin being tested */
  plugin: Plugin;
  /** Test canvas document */
  document: CanvasDocumentType;
  /** Mock canvas engine */
  canvasEngine: any;
  /** Test utilities */
  utils: PluginTestUtils;
  /** Performance metrics collector */
  performance: PerformanceMetricsCollector;
}

/**
 * Plugin test utilities
 */
export interface PluginTestUtils {
  /** Create a mock canvas document */
  createMockDocument: (
    overrides?: Partial<CanvasDocumentType>
  ) => CanvasDocumentType;
  /** Create a mock node */
  createMockNode: (type: string, overrides?: Partial<NodeType>) => NodeType;
  /** Mock plugin hooks */
  mockHooks: (hooks: Record<string, any>) => void;
  /** Mock plugin tools */
  mockTools: (tools: Record<string, any>) => void;
  /** Assert plugin behavior */
  assert: PluginTestAssertions;
}

/**
 * Plugin test assertions
 */
export interface PluginTestAssertions {
  /** Assert that plugin has certain metadata */
  hasMetadata: (key: string, value: any) => void;
  /** Assert that plugin has certain hooks */
  hasHooks: (hookNames: string[]) => void;
  /** Assert that plugin has certain tools */
  hasTools: (toolNames: string[]) => void;
  /** Assert that plugin is compatible */
  isCompatible: () => void;
  /** Assert that plugin loads successfully */
  loadsSuccessfully: () => void;
  /** Assert performance metrics */
  meetsPerformanceCriteria: (
    metrics: Partial<PluginPerformanceMetrics>
  ) => void;
}

/**
 * Performance metrics collector
 */
export interface PerformanceMetricsCollector {
  /** Start measuring an operation */
  start: (operation: string) => void;
  /** End measuring an operation */
  end: (operation: string) => number;
  /** Get collected metrics */
  getMetrics: () => PluginPerformanceMetrics;
  /** Reset metrics */
  reset: () => void;
}

/**
 * Plugin test configuration
 */
export interface PluginTestConfig {
  /** Timeout for individual tests */
  timeout: number;
  /** Whether to run performance tests */
  runPerformanceTests: boolean;
  /** Whether to run compatibility tests */
  runCompatibilityTests: boolean;
  /** Whether to run security tests */
  runSecurityTests: boolean;
  /** Performance thresholds */
  performanceThresholds: {
    maxLoadTime: number;
    maxMemoryUsage: number;
    maxInitTime: number;
  };
  /** Test environment setup */
  setup?: (context: PluginTestContext) => Promise<void>;
  /** Test environment teardown */
  teardown?: (context: PluginTestContext) => Promise<void>;
}

/**
 * Plugin test runner
 */
export interface PluginTestRunner {
  /** Run tests for a plugin */
  runTests: (
    plugin: Plugin,
    config?: Partial<PluginTestConfig>
  ) => Promise<PluginTestSuiteResult>;
  /** Validate plugin metadata and structure */
  validatePlugin: (plugin: Plugin) => Promise<PluginValidationResult>;
  /** Run performance tests */
  runPerformanceTests: (plugin: Plugin) => Promise<PluginPerformanceMetrics>;
  /** Run compatibility tests */
  runCompatibilityTests: (plugin: Plugin) => Promise<boolean>;
  /** Run security tests */
  runSecurityTests: (plugin: Plugin) => Promise<boolean>;
}

/**
 * Plugin test suite
 */
export interface PluginTestSuite {
  /** Suite name */
  name: string;
  /** Suite description */
  description?: string;
  /** Test functions */
  tests: PluginTestFunction[];
  /** Suite setup */
  setup?: (context: PluginTestContext) => Promise<void>;
  /** Suite teardown */
  teardown?: (context: PluginTestContext) => Promise<void>;
}

/**
 * Plugin test function
 */
export interface PluginTestFunction {
  /** Test name */
  name: string;
  /** Test function */
  fn: (context: PluginTestContext) => Promise<void> | void;
  /** Test timeout */
  timeout?: number;
  /** Whether test is skipped */
  skip?: boolean;
}

/**
 * Plugin test reporter
 */
export interface PluginTestReporter {
  /** Report test suite start */
  onSuiteStart?: (suite: PluginTestSuite) => void;
  /** Report test start */
  onTestStart?: (test: PluginTestFunction) => void;
  /** Report test result */
  onTestResult?: (result: PluginTestResult) => void;
  /** Report test suite result */
  onSuiteResult?: (result: PluginTestSuiteResult) => void;
  /** Report validation result */
  onValidationResult?: (result: PluginValidationResult) => void;
}
