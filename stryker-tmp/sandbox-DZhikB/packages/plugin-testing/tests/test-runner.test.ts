/**
 * @fileoverview Tests for plugin test runner
 * @author @darianrosebrook
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { PluginTestRunnerImpl } from "../src/test-runner.js";

// Mock performance API
Object.defineProperty(global, "performance", {
  writable: true,
  value: {
    now: vi.fn(() => Date.now()),
  },
});

// Mock process.platform
Object.defineProperty(process, "platform", {
  writable: true,
  value: "darwin",
});

describe("PluginTestRunner", () => {
  let runner: PluginTestRunnerImpl;

  beforeEach(() => {
    vi.clearAllMocks();
    runner = new PluginTestRunnerImpl();
  });

  describe("initialization", () => {
    it("should create test runner with default config", () => {
      expect(runner).toBeDefined();
    });

    it("should create test runner with custom config", () => {
      const customRunner = new PluginTestRunnerImpl({
        timeout: 10000,
        runPerformanceTests: false,
      });
      expect(customRunner).toBeDefined();
    });
  });

  describe("plugin validation", () => {
    it("should validate a valid plugin", async () => {
      const validPlugin = {
        metadata: {
          id: "test-plugin",
          name: "Test Plugin",
          version: "1.0.0",
          description: "A test plugin",
          category: "utility" as const,
          author: {
            name: "Test Author",
          },
          compatibility: {
            minDesignerVersion: "0.1.0",
            supportedPlatforms: ["darwin"],
            requiredPermissions: [],
          },
        },
        isEnabled: true,
        isLoaded: false,
      };

      const result = await runner.validatePlugin(validPlugin);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject invalid plugin metadata", async () => {
      const invalidPlugin = {
        metadata: {
          id: "", // Invalid: empty id
          name: "", // Invalid: empty name
          version: "", // Invalid: empty version
          category: "invalid" as any, // Invalid: wrong category
          author: {
            name: "",
          },
          compatibility: {
            minDesignerVersion: "",
            supportedPlatforms: [],
            requiredPermissions: [],
          },
        },
        isEnabled: true,
        isLoaded: false,
      };

      const result = await runner.validatePlugin(invalidPlugin);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("compatibility tests", () => {
    it("should pass compatibility test for compatible plugin", async () => {
      const compatiblePlugin = {
        metadata: {
          id: "compatible-plugin",
          name: "Compatible Plugin",
          version: "1.0.0",
          description: "A compatible plugin",
          category: "utility" as const,
          author: {
            name: "Test Author",
          },
          compatibility: {
            minDesignerVersion: "0.1.0",
            supportedPlatforms: ["darwin"],
            requiredPermissions: [],
          },
        },
        isEnabled: true,
        isLoaded: false,
      };

      const result = await runner.runCompatibilityTests(compatiblePlugin);
      expect(result).toBe(true);
    });

    it("should fail compatibility test for incompatible platform", async () => {
      const incompatiblePlugin = {
        metadata: {
          id: "incompatible-plugin",
          name: "Incompatible Plugin",
          version: "1.0.0",
          description: "An incompatible plugin",
          category: "utility" as const,
          author: {
            name: "Test Author",
          },
          compatibility: {
            minDesignerVersion: "0.1.0",
            supportedPlatforms: ["windows"], // Not darwin
            requiredPermissions: [],
          },
        },
        isEnabled: true,
        isLoaded: false,
      };

      const result = await runner.runCompatibilityTests(incompatiblePlugin);
      expect(result).toBe(false);
    });
  });

  describe("security tests", () => {
    it("should pass security test for safe plugin", async () => {
      const safePlugin = {
        metadata: {
          id: "safe-plugin",
          name: "Safe Plugin",
          version: "1.0.0",
          description: "A safe plugin",
          category: "utility" as const,
          author: {
            name: "Test Author",
          },
          compatibility: {
            minDesignerVersion: "0.1.0",
            supportedPlatforms: ["darwin"],
            requiredPermissions: ["read"],
          },
          repository: {
            type: "git" as const,
            url: "https://github.com/test/plugin",
          },
        },
        isEnabled: true,
        isLoaded: false,
      };

      const result = await runner.runSecurityTests(safePlugin);
      expect(result).toBe(true);
    });

    it("should fail security test for dangerous permissions", async () => {
      const dangerousPlugin = {
        metadata: {
          id: "dangerous-plugin",
          name: "Dangerous Plugin",
          version: "1.0.0",
          description: "A dangerous plugin",
          category: "utility" as const,
          author: {
            name: "Test Author",
          },
          compatibility: {
            minDesignerVersion: "0.1.0",
            supportedPlatforms: ["darwin"],
            requiredPermissions: ["system"], // Dangerous permission
          },
        },
        isEnabled: true,
        isLoaded: false,
      };

      const result = await runner.runSecurityTests(dangerousPlugin);
      expect(result).toBe(false);
    });
  });

  describe("performance tests", () => {
    it("should run performance tests", async () => {
      const plugin = {
        metadata: {
          id: "perf-plugin",
          name: "Performance Plugin",
          version: "1.0.0",
          description: "A performance test plugin",
          category: "utility" as const,
          author: {
            name: "Test Author",
          },
          compatibility: {
            minDesignerVersion: "0.1.0",
            supportedPlatforms: ["darwin"],
            requiredPermissions: [],
          },
        },
        isEnabled: true,
        isLoaded: false,
      };

      const metrics = await runner.runPerformanceTests(plugin);
      expect(metrics).toHaveProperty("loadTime");
      expect(metrics).toHaveProperty("memoryUsage");
      expect(metrics).toHaveProperty("initTime");
      expect(metrics).toHaveProperty("executionTimes");
    });
  });

  describe("full test suite", () => {
    it("should run complete test suite for valid plugin", async () => {
      const validPlugin = {
        metadata: {
          id: "complete-test-plugin",
          name: "Complete Test Plugin",
          version: "1.0.0",
          description: "A complete test plugin",
          category: "utility" as const,
          author: {
            name: "Test Author",
          },
          compatibility: {
            minDesignerVersion: "0.1.0",
            supportedPlatforms: ["darwin"],
            requiredPermissions: [],
          },
        },
        isEnabled: true,
        isLoaded: false,
      };

      const result = await runner.runTests(validPlugin);

      expect(result).toHaveProperty("pluginId", "complete-test-plugin");
      expect(result).toHaveProperty("results");
      expect(result.results.length).toBeGreaterThan(0);
      expect(result).toHaveProperty("passed");
      expect(result).toHaveProperty("failed");
      expect(result).toHaveProperty("status");

      // Should have validation, compatibility, security, performance, and load tests
      const testNames = result.results.map((r) => r.name);
      expect(testNames).toContain("Plugin Validation");
      expect(testNames).toContain("Compatibility Test");
      expect(testNames).toContain("Security Test");
      expect(testNames).toContain("Performance Test");
      expect(testNames).toContain("Load Test");
    });

    it("should handle plugin test failures", async () => {
      const invalidPlugin = {
        metadata: {
          id: "", // Invalid
          name: "",
          version: "",
          category: "utility" as const,
          author: {
            name: "",
          },
          compatibility: {
            minDesignerVersion: "",
            supportedPlatforms: [],
            requiredPermissions: [],
          },
        },
        isEnabled: true,
        isLoaded: false,
      };

      const result = await runner.runTests(invalidPlugin);

      expect(result.status).toBe("failed");
      expect(result.failed).toBeGreaterThan(0);
    });
  });
});

