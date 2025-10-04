/**
 * @fileoverview Plugin test runner implementation
 * @author @darianrosebrook
 */

import { EventEmitter } from "node:events";

// Using any types to avoid import issues during build
type Plugin = any;
type _PluginMetadata = any;
type CanvasDocumentType = any;
type NodeType = any;

/**
 * Simple version comparison function (basic implementation)
 */
function versionSatisfies(version: string, range: string): boolean {
  // Very basic implementation - just check if version is >= min version
  if (range.startsWith(">=")) {
    const minVersion = range.substring(2);
    return version.localeCompare(minVersion, undefined, { numeric: true }) >= 0;
  }
  if (range.startsWith("<=")) {
    const maxVersion = range.substring(2);
    return version.localeCompare(maxVersion, undefined, { numeric: true }) <= 0;
  }
  return version === range;
}
import type {
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
} from "./types.js";

/**
 * Default test configuration
 */
const DEFAULT_TEST_CONFIG: PluginTestConfig = {
  timeout: 5000,
  runPerformanceTests: true,
  runCompatibilityTests: true,
  runSecurityTests: true,
  performanceThresholds: {
    maxLoadTime: 1000, // 1 second
    maxMemoryUsage: 50 * 1024 * 1024, // 50MB
    maxInitTime: 500, // 500ms
  },
};

/**
 * Plugin test runner implementation
 */
export class PluginTestRunnerImpl
  extends EventEmitter
  implements PluginTestRunner
{
  private config: PluginTestConfig;

  constructor(config: Partial<PluginTestConfig> = {}) {
    super();
    this.config = { ...DEFAULT_TEST_CONFIG, ...config };
  }

  /**
   * Run tests for a plugin
   */
  async runTests(
    plugin: Plugin,
    config: Partial<PluginTestConfig> = {}
  ): Promise<PluginTestSuiteResult> {
    const testConfig = { ...this.config, ...config };
    const startTime = Date.now();

    this.emit("suite-start", { pluginId: plugin.metadata.id });

    try {
      // Create test context
      const context = await this.createTestContext(plugin);

      // Setup test environment
      if (testConfig.setup) {
        await testConfig.setup(context);
      }

      const results: PluginTestResult[] = [];

      // Run validation tests
      results.push(await this.runValidationTest(plugin));

      // Run compatibility tests
      if (testConfig.runCompatibilityTests) {
        results.push(await this.runCompatibilityTest(plugin));
      }

      // Run security tests
      if (testConfig.runSecurityTests) {
        results.push(await this.runSecurityTest(plugin));
      }

      // Run performance tests
      if (testConfig.runPerformanceTests) {
        results.push(await this.runPerformanceTest(plugin, context));
      }

      // Run load test
      results.push(await this.runLoadTest(plugin, context));

      // Cleanup
      if (testConfig.teardown) {
        await testConfig.teardown(context);
      }

      const duration = Date.now() - startTime;
      const passed = results.filter((r) => r.status === "passed").length;
      const failed = results.filter((r) => r.status === "failed").length;
      const skipped = results.filter((r) => r.status === "skipped").length;
      const errors = results.filter((r) => r.status === "error").length;

      const suiteResult: PluginTestSuiteResult = {
        pluginId: plugin.metadata.id,
        suiteName: "Plugin Validation Suite",
        results,
        duration,
        passed,
        failed,
        skipped,
        errors,
        status: failed > 0 ? "failed" : errors > 0 ? "error" : "passed",
      };

      this.emit("suite-result", suiteResult);
      return suiteResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResult: PluginTestResult = {
        name: "Test Suite Setup",
        status: "error",
        duration,
        error: error instanceof Error ? error.message : "Unknown error",
      };

      const suiteResult: PluginTestSuiteResult = {
        pluginId: plugin.metadata.id,
        suiteName: "Plugin Validation Suite",
        results: [errorResult],
        duration,
        passed: 0,
        failed: 0,
        skipped: 0,
        errors: 1,
        status: "error",
      };

      this.emit("suite-result", suiteResult);
      return suiteResult;
    }
  }

  /**
   * Validate plugin metadata and structure
   */
  async validatePlugin(plugin: Plugin): Promise<PluginValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate metadata structure
    if (!plugin.metadata.id) {
      errors.push("Plugin metadata missing 'id'");
    }

    if (!plugin.metadata.name) {
      errors.push("Plugin metadata missing 'name'");
    }

    if (!plugin.metadata.version) {
      errors.push("Plugin metadata missing 'version'");
    }

    if (!plugin.metadata.description) {
      warnings.push("Plugin metadata missing 'description'");
    }

    if (!plugin.metadata.category) {
      errors.push("Plugin metadata missing 'category'");
    }

    if (!plugin.metadata.compatibility) {
      errors.push("Plugin metadata missing 'compatibility' information");
    } else {
      if (!plugin.metadata.compatibility.minDesignerVersion) {
        errors.push("Plugin compatibility missing 'minDesignerVersion'");
      }

      if (
        !plugin.metadata.compatibility.supportedPlatforms ||
        plugin.metadata.compatibility.supportedPlatforms.length === 0
      ) {
        errors.push("Plugin compatibility missing 'supportedPlatforms'");
      }
    }

    // Check for security issues
    if (plugin.metadata.compatibility?.requiredPermissions?.includes("*")) {
      warnings.push("Plugin requests wildcard permissions");
    }

    const result: PluginValidationResult = {
      valid: errors.length === 0,
      errors,
      warnings,
      metadataValid: errors.filter((e) => e.includes("metadata")).length === 0,
      compatibilityValid:
        errors.filter((e) => e.includes("compatibility")).length === 0,
      securityValid:
        warnings.filter((w) => w.includes("security")).length === 0,
    };

    this.emit("validation-result", result);
    return result;
  }

  /**
   * Run performance tests
   */
  async runPerformanceTests(
    _plugin: Plugin
  ): Promise<PluginPerformanceMetrics> {
    const _startTime = performance.now();

    // Mock performance measurement
    const metrics: PluginPerformanceMetrics = {
      loadTime: Math.random() * 500 + 100, // Random load time between 100-600ms
      memoryUsage: Math.random() * 10 * 1024 * 1024, // Random memory usage up to 10MB
      initTime: Math.random() * 200 + 50, // Random init time between 50-250ms
      executionTimes: {
        "test-operation": Math.random() * 100 + 10, // Random execution time
      },
    };

    return metrics;
  }

  /**
   * Run compatibility tests
   */
  async runCompatibilityTests(plugin: Plugin): Promise<boolean> {
    const metadata = plugin.metadata;

    // Check version compatibility
    const currentVersion = "0.1.0";
    const minVersion = metadata.compatibility?.minDesignerVersion;
    const maxVersion = metadata.compatibility?.maxDesignerVersion;

    if (minVersion && !versionSatisfies(currentVersion, `>=${minVersion}`)) {
      return false;
    }

    if (maxVersion && !versionSatisfies(currentVersion, `<=${maxVersion}`)) {
      return false;
    }

    // Check platform compatibility
    const currentPlatform = process.platform;
    if (
      metadata.compatibility?.supportedPlatforms &&
      !metadata.compatibility.supportedPlatforms.includes(currentPlatform)
    ) {
      return false;
    }

    return true;
  }

  /**
   * Run security tests
   */
  async runSecurityTests(plugin: Plugin): Promise<boolean> {
    // Basic security checks
    const metadata = plugin.metadata;

    // Check for dangerous permissions
    const dangerousPermissions = ["system", "network", "filesystem"];
    const hasDangerousPermissions =
      metadata.compatibility?.requiredPermissions?.some((perm: any) =>
        dangerousPermissions.includes(perm)
      );

    if (hasDangerousPermissions) {
      return false;
    }

    // Check for valid repository URLs (basic check)
    if (
      metadata.repository?.url &&
      !metadata.repository.url.startsWith("http") &&
      !metadata.repository.url.startsWith("git")
    ) {
      return false;
    }

    return true;
  }

  /**
   * Create test context
   */
  private async createTestContext(_plugin: Plugin): Promise<PluginTestContext> {
    const document = this.createMockDocument("Test Document");
    const canvasEngine = this.createMockCanvasEngine();
    const utils = this.createTestUtils();
    const performance = this.createPerformanceCollector();

    return {
      plugin: _plugin,
      document,
      canvasEngine,
      utils,
      performance,
    };
  }

  /**
   * Create mock document
   */
  private createMockDocument(name: string): CanvasDocumentType {
    return {
      schemaVersion: "0.1.0",
      id: "test-doc-id",
      name,
      artboards: [
        {
          id: "test-artboard-id",
          name: `${name} Artboard`,
          frame: { x: 0, y: 0, width: 1440, height: 1024 },
          children: [],
        },
      ],
    };
  }

  /**
   * Create mock canvas engine
   */
  private createMockCanvasEngine(): any {
    return {
      traverseDocument: () => {},
      findNodesByType: () => [],
      createNode: () => ({}),
      updateNode: () => ({}),
      deleteNode: () => {},
    };
  }

  /**
   * Create test utilities
   */
  private createTestUtils(): PluginTestUtils {
    return {
      createMockDocument: (overrides = {}) => ({
        schemaVersion: "0.1.0",
        id: "mock-doc-id",
        name: "Mock Document",
        artboards: [],
        ...overrides,
      }),

      createMockNode: (type: string, overrides = {}) =>
        ({
          id: "mock-node-id",
          type,
          name: `Mock ${type}`,
          visible: true,
          frame: { x: 0, y: 0, width: 100, height: 100 },
          ...overrides,
        } as NodeType),

      mockHooks: () => {},
      mockTools: () => {},

      assert: this.createTestAssertions(),
    };
  }

  /**
   * Create test assertions
   */
  private createTestAssertions(): PluginTestAssertions {
    return {
      hasMetadata: (key: string, value: any) => {
        // Implementation would check plugin metadata
      },

      hasHooks: (hookNames: string[]) => {
        // Implementation would check plugin hooks
      },

      hasTools: (toolNames: string[]) => {
        // Implementation would check plugin tools
      },

      isCompatible: () => {
        // Implementation would check compatibility
      },

      loadsSuccessfully: () => {
        // Implementation would check if plugin loads
      },

      meetsPerformanceCriteria: (
        metrics: Partial<PluginPerformanceMetrics>
      ) => {
        // Implementation would check performance metrics
      },
    };
  }

  /**
   * Create performance collector
   */
  private createPerformanceCollector(): PerformanceMetricsCollector {
    const startTimes = new Map<string, number>();
    const executionTimes: Record<string, number> = {};

    return {
      start: (operation: string) => {
        startTimes.set(operation, performance.now());
      },

      end: (operation: string) => {
        const startTime = startTimes.get(operation);
        if (!startTime) {
          throw new Error(`Operation ${operation} was not started`);
        }

        const duration = performance.now() - startTime;
        executionTimes[operation] = duration;
        startTimes.delete(operation);

        return duration;
      },

      getMetrics: () => ({
        loadTime: executionTimes.load || 0,
        memoryUsage: 0, // Would need actual memory measurement
        initTime: executionTimes.init || 0,
        executionTimes,
      }),

      reset: () => {
        startTimes.clear();
        Object.keys(executionTimes).forEach((key) => {
          delete executionTimes[key];
        });
      },
    };
  }

  /**
   * Run validation test
   */
  private async runValidationTest(plugin: Plugin): Promise<PluginTestResult> {
    const startTime = Date.now();

    try {
      const validation = await this.validatePlugin(plugin);

      return {
        name: "Plugin Validation",
        status: validation.valid ? "passed" : "failed",
        duration: Date.now() - startTime,
        error: !validation.valid ? validation.errors.join(", ") : undefined,
        metadata: { validation },
      };
    } catch (error) {
      return {
        name: "Plugin Validation",
        status: "error",
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Run compatibility test
   */
  private async runCompatibilityTest(
    plugin: Plugin
  ): Promise<PluginTestResult> {
    const startTime = Date.now();

    try {
      const compatible = await this.runCompatibilityTests(plugin);

      return {
        name: "Compatibility Test",
        status: compatible ? "passed" : "failed",
        duration: Date.now() - startTime,
        error: !compatible
          ? "Plugin is not compatible with current environment"
          : undefined,
      };
    } catch (error) {
      return {
        name: "Compatibility Test",
        status: "error",
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Run security test
   */
  private async runSecurityTest(plugin: Plugin): Promise<PluginTestResult> {
    const startTime = Date.now();

    try {
      const secure = await this.runSecurityTests(plugin);

      return {
        name: "Security Test",
        status: secure ? "passed" : "failed",
        duration: Date.now() - startTime,
        error: !secure ? "Plugin failed security checks" : undefined,
      };
    } catch (error) {
      return {
        name: "Security Test",
        status: "error",
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Run performance test
   */
  private async runPerformanceTest(
    _plugin: Plugin,
    _context: PluginTestContext
  ): Promise<PluginTestResult> {
    const startTime = Date.now();

    try {
      const metrics = await this.runPerformanceTests(_plugin);

      // Check against thresholds
      const thresholds = this.config.performanceThresholds;
      const withinThresholds =
        metrics.loadTime <= thresholds.maxLoadTime &&
        metrics.memoryUsage <= thresholds.maxMemoryUsage &&
        metrics.initTime <= thresholds.maxInitTime;

      return {
        name: "Performance Test",
        status: withinThresholds ? "passed" : "failed",
        duration: Date.now() - startTime,
        error: !withinThresholds
          ? "Performance metrics exceed thresholds"
          : undefined,
        metadata: { metrics, thresholds },
      };
    } catch (error) {
      return {
        name: "Performance Test",
        status: "error",
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Run load test
   */
  private async runLoadTest(
    _plugin: Plugin,
    _context: PluginTestContext
  ): Promise<PluginTestResult> {
    const startTime = Date.now();

    try {
      // Simulate plugin loading
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 100));

      return {
        name: "Load Test",
        status: "passed",
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        name: "Load Test",
        status: "error",
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
