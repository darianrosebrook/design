/**
 * @fileoverview Tests for plugin registry functionality
 * @author @darianrosebrook
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { PluginRegistry } from "../src/registry.js";
import * as fs from "node:fs";
import * as path from "node:path";

// Mock file system operations
vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return {
    ...actual,
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    promises: {
      ...actual.promises,
      readdir: vi.fn(),
      copyFile: vi.fn(),
      rm: vi.fn(),
      mkdir: vi.fn(),
    },
  };
});

vi.mock("node:path", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:path")>();
  return {
    ...actual,
    join: vi.fn((...args) => args.join("/")),
  };
});

describe("PluginRegistry", () => {
  let registry: PluginRegistry;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock fs operations
    const mockFs = vi.mocked(fs);
    mockFs.existsSync.mockReturnValue(true);
    mockFs.mkdirSync.mockImplementation(() => undefined);
    mockFs.readFileSync.mockReturnValue("{}");
    mockFs.writeFileSync.mockImplementation(() => undefined);

    registry = new PluginRegistry({
      localStoragePath: "/tmp/test-plugins",
      cacheTimeout: 1000,
      enableAutoUpdate: false,
      trustedSources: ["https://registry.designer.tools"],
    });
  });

  describe("initialization", () => {
    it("should create registry with default configuration", () => {
      const testRegistry = new PluginRegistry();
      expect(testRegistry).toBeDefined();
    });

    it("should create registry with custom configuration", () => {
      const customConfig = {
        registryUrl: "https://custom.registry.com",
        localStoragePath: "/custom/path",
        maxCacheSize: 500,
        enableAutoUpdate: true,
      };

      const testRegistry = new PluginRegistry(customConfig);
      expect(testRegistry).toBeDefined();
    });
  });

  describe("plugin management", () => {
    it("should register a plugin", async () => {
      const pluginData = {
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
            supportedPlatforms: ["web"],
            requiredPermissions: [],
          },
        },
      };

      const plugin = await registry.registerPlugin(pluginData);
      expect(plugin).toBeDefined();
      expect(plugin.metadata.id).toBe("test-plugin");
      expect(plugin.isEnabled).toBe(true);
    });

    it("should get plugin by ID", () => {
      const plugin = registry.getPlugin("test-plugin");
      expect(plugin).toBeUndefined(); // Not registered yet

      // Register first
      registry.registerPlugin({
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
            supportedPlatforms: ["web"],
            requiredPermissions: [],
          },
        },
      });

      const retrievedPlugin = registry.getPlugin("test-plugin");
      expect(retrievedPlugin).toBeDefined();
      expect(retrievedPlugin!.metadata.id).toBe("test-plugin");
    });

    it("should get all plugins", () => {
      const allPlugins = registry.getAllPlugins();
      expect(Array.isArray(allPlugins)).toBe(true);
    });

    it("should provide registry statistics", () => {
      const stats = registry.getStats();
      expect(stats).toHaveProperty("totalPlugins");
      expect(stats).toHaveProperty("installedPlugins");
      expect(stats).toHaveProperty("enabledPlugins");
      expect(stats).toHaveProperty("loadedPlugins");
      expect(stats).toHaveProperty("categories");

      expect(typeof stats.totalPlugins).toBe("number");
      expect(typeof stats.installedPlugins).toBe("number");
      expect(typeof stats.enabledPlugins).toBe("number");
      expect(typeof stats.loadedPlugins).toBe("number");
      expect(typeof stats.categories).toBe("object");
    });
  });

  describe("plugin search", () => {
    beforeEach(() => {
      // Register some test plugins
      registry.registerPlugin({
        metadata: {
          id: "design-plugin",
          name: "Design Plugin",
          version: "1.0.0",
          description: "A design plugin",
          category: "design" as const,
          author: {
            name: "Design Author",
          },
          compatibility: {
            minDesignerVersion: "0.1.0",
            supportedPlatforms: ["web"],
            requiredPermissions: [],
          },
        },
      });

      registry.registerPlugin({
        metadata: {
          id: "dev-plugin",
          name: "Dev Plugin",
          version: "1.0.0",
          description: "A development plugin",
          category: "development" as const,
          author: {
            name: "Dev Author",
          },
          compatibility: {
            minDesignerVersion: "0.1.0",
            supportedPlatforms: ["web"],
            requiredPermissions: [],
          },
        },
      });
    });

    it("should search plugins by query", async () => {
      const results = await registry.searchPlugins({
        query: "design",
      });

      expect(results.plugins.length).toBeGreaterThan(0);
      expect(results.plugins.some(p => p.metadata.id === "design-plugin")).toBe(true);
    });

    it("should search plugins by category", async () => {
      const results = await registry.searchPlugins({
        category: "design",
      });

      expect(results.plugins.length).toBe(1);
      expect(results.plugins[0].metadata.category).toBe("design");
    });

    it("should paginate search results", async () => {
      const results = await registry.searchPlugins(
        {},
        { page: 1, pageSize: 1 }
      );

      expect(results.page).toBe(1);
      expect(results.pageSize).toBe(1);
      expect(results.hasMore).toBe(true);
    });
  });

  describe("plugin lifecycle", () => {
    it("should enable and disable plugins", async () => {
      // Register a plugin
      const plugin = await registry.registerPlugin({
        metadata: {
          id: "lifecycle-plugin",
          name: "Lifecycle Plugin",
          version: "1.0.0",
          description: "A lifecycle test plugin",
          category: "utility" as const,
          author: {
            name: "Test Author",
          },
          compatibility: {
            minDesignerVersion: "0.1.0",
            supportedPlatforms: ["web"],
            requiredPermissions: [],
          },
        },
      });

      // Enable plugin
      await registry.setPluginEnabled("lifecycle-plugin", true);
      expect(registry.getPlugin("lifecycle-plugin")?.isEnabled).toBe(true);

      // Disable plugin
      await registry.setPluginEnabled("lifecycle-plugin", false);
      expect(registry.getPlugin("lifecycle-plugin")?.isEnabled).toBe(false);
    });
  });

  describe("error handling", () => {
    it("should handle invalid plugin registration", async () => {
      await expect(
        registry.registerPlugin({
          metadata: {
            id: "",
            name: "",
            version: "",
            description: "",
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
        })
      ).rejects.toThrow();
    });

    it("should handle non-existent plugin operations", async () => {
      await expect(registry.setPluginEnabled("non-existent", true)).rejects.toThrow();
      await expect(registry.unloadPlugin("non-existent")).rejects.toThrow();
    });
  });
});
