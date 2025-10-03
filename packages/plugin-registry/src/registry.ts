/**
 * @fileoverview Plugin registry implementation for Designer
 * @author @darianrosebrook
 */

import { EventEmitter } from "node:events";
import * as fs from "node:fs";
import * as path from "node:path";
import semver from "semver";
import { z } from "zod";
import {
  PluginMetadataSchema,
} from "./types.js";
import type {
  Plugin,
  PluginMetadata,
  PluginRegistryConfig,
  PluginSearchFilters,
  PluginSearchResult,
  PluginInstallation,
  PluginRegistryEvent,
  PluginRegistryEventData,
  PluginCompatibilityResult,
  PluginSecurityScan,
  PluginReview,
  PluginAnalytics,
} from "./types.js";

/**
 * Plugin registry for managing plugin discovery, installation, and lifecycle
 */
export class PluginRegistry extends EventEmitter {
  private config: PluginRegistryConfig;
  private plugins = new Map<string, Plugin>();
  private installations = new Map<string, PluginInstallation>();
  private cache = new Map<string, any>();
  private cacheExpiry = new Map<string, number>();

  constructor(config: Partial<PluginRegistryConfig> = {}) {
    super();

    this.config = {
      registryUrl: "https://registry.designer.tools",
      localStoragePath: path.join(process.cwd(), ".designer", "plugins"),
      cacheTimeout: 300000, // 5 minutes
      maxCacheSize: 1000,
      enableAutoUpdate: false,
      trustedSources: ["https://registry.designer.tools"],
      requireApproval: false,
      ...config,
    };

    this.ensureStorageDirectory();
  }

  /**
   * Ensure plugin storage directory exists
   */
  private ensureStorageDirectory(): void {
    try {
      if (!fs.existsSync(this.config.localStoragePath!)) {
        fs.mkdirSync(this.config.localStoragePath!, { recursive: true });
      }
    } catch (error) {
      console.error("Failed to create plugin storage directory:", error);
    }
  }

  /**
   * Register a plugin in the registry
   */
  async registerPlugin(pluginData: Partial<Plugin>): Promise<Plugin> {
    try {
      // Validate metadata
      const metadata = PluginMetadataSchema.parse(pluginData.metadata);

      const plugin: Plugin = {
        metadata,
        hooks: pluginData.hooks,
        tools: pluginData.tools || [],
        commands: pluginData.commands || [],
        isEnabled: pluginData.isEnabled ?? true,
        isLoaded: pluginData.isLoaded ?? false,
        installedPath: pluginData.installedPath,
        lastUsed: pluginData.lastUsed,
        usageCount: pluginData.usageCount || 0,
      };

      this.plugins.set(plugin.metadata.id, plugin);

      // Emit event
      this.emit("plugin:installed", {
        pluginId: plugin.metadata.id,
        version: plugin.metadata.version,
        metadata: plugin.metadata,
      } as PluginRegistryEventData);

      return plugin;
    } catch (error) {
      throw new Error(`Failed to register plugin: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Install a plugin from various sources
   */
  async installPlugin(
    source: string,
    options: {
      version?: string;
      force?: boolean;
      skipDependencies?: boolean;
    } = {}
  ): Promise<Plugin> {
    try {
      let pluginMetadata: PluginMetadata;

      // Determine source type and fetch metadata
      if (source.startsWith("http://") || source.startsWith("https://")) {
        pluginMetadata = await this.fetchPluginFromUrl(source);
      } else if (source.includes("@")) {
        pluginMetadata = await this.fetchPluginFromNpm(source);
      } else {
        pluginMetadata = await this.fetchPluginFromLocal(source);
      }

      // Check compatibility
      const compatibility = await this.checkCompatibility(pluginMetadata);
      if (!compatibility.compatible) {
        throw new Error(`Plugin incompatible: ${compatibility.issues.join(", ")}`);
      }

      // Check if already installed
      const existingPlugin = this.plugins.get(pluginMetadata.id);
      if (existingPlugin && !options.force) {
        throw new Error(`Plugin ${pluginMetadata.id} is already installed. Use force=true to reinstall.`);
      }

      // Download and extract plugin
      const installPath = path.join(this.config.localStoragePath!, pluginMetadata.id);
      await this.downloadPlugin(pluginMetadata, installPath);

      // Install dependencies if needed
      if (!options.skipDependencies) {
        await this.installPluginDependencies(installPath, pluginMetadata);
      }

      // Register plugin
      const plugin = await this.registerPlugin({
        metadata: pluginMetadata,
        isEnabled: true,
        isLoaded: false,
        installedPath: installPath,
      });

      // Update installation record
      this.installations.set(pluginMetadata.id, {
        pluginId: pluginMetadata.id,
        status: "installed",
        version: pluginMetadata.version,
        installedAt: new Date(),
        installedPath: installPath,
      });

      return plugin;
    } catch (error) {
      // Update installation record with error
      if (pluginMetadata) {
        this.installations.set(pluginMetadata.id, {
          pluginId: pluginMetadata.id,
          status: "error",
          version: pluginMetadata.version,
          installedAt: new Date(),
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      throw error;
    }
  }

  /**
   * Uninstall a plugin
   */
  async uninstallPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} is not installed`);
    }

    try {
      // Unload plugin if loaded
      if (plugin.isLoaded) {
        await this.unloadPlugin(pluginId);
      }

      // Remove from registry
      this.plugins.delete(pluginId);

      // Remove installation record
      this.installations.delete(pluginId);

      // Remove files if installed locally
      if (plugin.installedPath) {
        await this.removePluginFiles(plugin.installedPath);
      }

      // Emit event
      this.emit("plugin:uninstalled", {
        pluginId,
        version: plugin.metadata.version,
      } as PluginRegistryEventData);
    } catch (error) {
      throw new Error(`Failed to uninstall plugin ${pluginId}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Load a plugin into memory
   */
  async loadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} is not registered`);
    }

    if (plugin.isLoaded) {
      return; // Already loaded
    }

    try {
      // Load plugin code
      if (plugin.installedPath) {
        await this.loadPluginCode(plugin);
      }

      // Execute onLoad hook
      if (plugin.hooks?.onLoad) {
        await plugin.hooks.onLoad();
      }

      plugin.isLoaded = true;
      plugin.lastUsed = new Date();

      // Emit event
      this.emit("plugin:enabled", {
        pluginId,
        version: plugin.metadata.version,
      } as PluginRegistryEventData);
    } catch (error) {
      throw new Error(`Failed to load plugin ${pluginId}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Unload a plugin from memory
   */
  async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin || !plugin.isLoaded) {
      return;
    }

    try {
      // Execute onUnload hook
      if (plugin.hooks?.onUnload) {
        await plugin.hooks.onUnload();
      }

      plugin.isLoaded = false;

      // Emit event
      this.emit("plugin:disabled", {
        pluginId,
        version: plugin.metadata.version,
      } as PluginRegistryEventData);
    } catch (error) {
      throw new Error(`Failed to unload plugin ${pluginId}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Search for plugins
   */
  async searchPlugins(
    filters: PluginSearchFilters,
    options: {
      page?: number;
      pageSize?: number;
      sortBy?: "name" | "downloads" | "rating" | "updated";
      sortOrder?: "asc" | "desc";
    } = {}
  ): Promise<PluginSearchResult> {
    const page = options.page || 1;
    const pageSize = options.pageSize || 20;
    const sortBy = options.sortBy || "name";
    const sortOrder = options.sortOrder || "asc";

    // Filter plugins
    let filteredPlugins = Array.from(this.plugins.values());

    if (filters.query) {
      const query = filters.query.toLowerCase();
      filteredPlugins = filteredPlugins.filter(
        (plugin) =>
          plugin.metadata.name.toLowerCase().includes(query) ||
          plugin.metadata.description.toLowerCase().includes(query) ||
          plugin.metadata.keywords?.some((keyword) => keyword.toLowerCase().includes(query))
      );
    }

    if (filters.category) {
      filteredPlugins = filteredPlugins.filter(
        (plugin) => plugin.metadata.category === filters.category
      );
    }

    if (filters.author) {
      filteredPlugins = filteredPlugins.filter(
        (plugin) => plugin.metadata.author.name.toLowerCase().includes(filters.author!.toLowerCase())
      );
    }

    if (filters.installed !== undefined) {
      filteredPlugins = filteredPlugins.filter(
        (plugin) => plugin.installedPath !== undefined === filters.installed
      );
    }

    if (filters.hasTools !== undefined) {
      filteredPlugins = filteredPlugins.filter(
        (plugin) => (plugin.tools?.length || 0) > 0 === filters.hasTools
      );
    }

    if (filters.hasCommands !== undefined) {
      filteredPlugins = filteredPlugins.filter(
        (plugin) => (plugin.commands?.length || 0) > 0 === filters.hasCommands
      );
    }

    // Sort plugins
    filteredPlugins.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.metadata.name.localeCompare(b.metadata.name);
          break;
        case "downloads":
          comparison = (b.metadata as any).downloads || 0 - ((a.metadata as any).downloads || 0);
          break;
        case "rating":
          comparison = (b.metadata as any).rating || 0 - ((a.metadata as any).rating || 0);
          break;
        case "updated":
          comparison = new Date(b.metadata as any).getTime() - new Date(a.metadata as any).getTime();
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    // Paginate
    const total = filteredPlugins.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedPlugins = filteredPlugins.slice(startIndex, endIndex);

    return {
      plugins: paginatedPlugins,
      total,
      page,
      pageSize,
      hasMore: endIndex < total,
    };
  }

  /**
   * Get plugin by ID
   */
  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Get all plugins
   */
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get installed plugins
   */
  getInstalledPlugins(): Plugin[] {
    return Array.from(this.plugins.values()).filter((plugin) => plugin.installedPath !== undefined);
  }

  /**
   * Get enabled plugins
   */
  getEnabledPlugins(): Plugin[] {
    return Array.from(this.plugins.values()).filter((plugin) => plugin.isEnabled);
  }

  /**
   * Get loaded plugins
   */
  getLoadedPlugins(): Plugin[] {
    return Array.from(this.plugins.values()).filter((plugin) => plugin.isLoaded);
  }

  /**
   * Enable/disable plugin
   */
  async setPluginEnabled(pluginId: string, enabled: boolean): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (enabled && !plugin.isLoaded) {
      await this.loadPlugin(pluginId);
    } else if (!enabled && plugin.isLoaded) {
      await this.unloadPlugin(pluginId);
    }

    plugin.isEnabled = enabled;

    // Emit event
    this.emit(enabled ? "plugin:enabled" : "plugin:disabled", {
      pluginId,
      version: plugin.metadata.version,
    } as PluginRegistryEventData);
  }

  /**
   * Fetch plugin metadata from URL
   */
  private async fetchPluginFromUrl(url: string): Promise<PluginMetadata> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return PluginMetadataSchema.parse(data);
    } catch (error) {
      throw new Error(`Failed to fetch plugin from ${url}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Fetch plugin metadata from NPM
   */
  private async fetchPluginFromNpm(packageSpec: string): Promise<PluginMetadata> {
    try {
      const [packageName, version] = packageSpec.split("@");
      const response = await fetch(`https://registry.npmjs.org/${packageName}`);

      if (!response.ok) {
        throw new Error(`Package ${packageName} not found on NPM`);
      }

      const packageData = await response.json();
      const targetVersion = version || packageData["dist-tags"].latest;

      if (!packageData.versions[targetVersion]) {
        throw new Error(`Version ${targetVersion} not found for package ${packageName}`);
      }

      const versionData = packageData.versions[targetVersion];

      // Convert NPM package.json to plugin metadata format
      const metadata: PluginMetadata = {
        id: packageData.name,
        name: packageData.name,
        version: targetVersion,
        description: versionData.description || "",
        category: this.inferCategoryFromKeywords(versionData.keywords) || "utility",
        author: {
          name: versionData.author?.name || "Unknown",
          email: versionData.author?.email,
          website: versionData.author?.url,
        },
        repository: versionData.repository ? {
          type: "git",
          url: versionData.repository.url,
        } : undefined,
        compatibility: {
          minDesignerVersion: versionData.engines?.designer || "0.1.0",
          supportedPlatforms: ["web", "desktop"],
          requiredPermissions: [],
        },
        keywords: versionData.keywords,
        homepage: versionData.homepage,
        bugs: versionData.bugs?.url,
        license: versionData.license,
      };

      return PluginMetadataSchema.parse(metadata);
    } catch (error) {
      throw new Error(`Failed to fetch plugin from NPM: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Fetch plugin metadata from local path
   */
  private async fetchPluginFromLocal(localPath: string): Promise<PluginMetadata> {
    try {
      const packageJsonPath = path.join(localPath, "package.json");
      if (!fs.existsSync(packageJsonPath)) {
        throw new Error(`package.json not found in ${localPath}`);
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

      // Convert package.json to plugin metadata format
      const metadata: PluginMetadata = {
        id: packageJson.name,
        name: packageJson.name,
        version: packageJson.version,
        description: packageJson.description || "",
        category: this.inferCategoryFromKeywords(packageJson.keywords) || "utility",
        author: {
          name: packageJson.author?.name || "Unknown",
          email: packageJson.author?.email,
          website: packageJson.author?.url,
        },
        repository: packageJson.repository ? {
          type: "local",
          localPath,
        } : undefined,
        compatibility: {
          minDesignerVersion: packageJson.engines?.designer || "0.1.0",
          supportedPlatforms: ["web", "desktop"],
          requiredPermissions: [],
        },
        keywords: packageJson.keywords,
        homepage: packageJson.homepage,
        bugs: packageJson.bugs?.url,
        license: packageJson.license,
      };

      return PluginMetadataSchema.parse(metadata);
    } catch (error) {
      throw new Error(`Failed to load plugin from ${localPath}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Infer plugin category from keywords
   */
  private inferCategoryFromKeywords(keywords: string[] = []): string | undefined {
    const categoryKeywords: Record<string, string[]> = {
      design: ["design", "ui", "ux", "interface"],
      development: ["dev", "development", "coding", "programming"],
      analysis: ["analysis", "analytics", "metrics", "reporting"],
      automation: ["automation", "workflow", "process"],
      productivity: ["productivity", "efficiency", "tools"],
      integration: ["integration", "api", "webhook", "external"],
      visualization: ["visualization", "charts", "graphs", "diagrams"],
      utility: ["utility", "helper", "misc", "general"],
    };

    for (const [category, categoryWords] of Object.entries(categoryKeywords)) {
      if (keywords.some((keyword) =>
        categoryWords.some((word) => keyword.toLowerCase().includes(word))
      )) {
        return category;
      }
    }

    return undefined;
  }

  /**
   * Check plugin compatibility
   */
  private async checkCompatibility(metadata: PluginMetadata): Promise<PluginCompatibilityResult> {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Check version compatibility
    const currentVersion = "0.1.0"; // This would come from the actual Designer version
    const minVersion = metadata.compatibility.minDesignerVersion;
    const maxVersion = metadata.compatibility.maxDesignerVersion;

    if (!semver.satisfies(currentVersion, `>=${minVersion}`)) {
      issues.push(`Requires Designer version >=${minVersion}, but current version is ${currentVersion}`);
    }

    if (maxVersion && !semver.satisfies(currentVersion, `<=${maxVersion}`)) {
      issues.push(`Requires Designer version <=${maxVersion}, but current version is ${currentVersion}`);
    }

    // Check platform compatibility
    const currentPlatform = process.platform;
    if (!metadata.compatibility.supportedPlatforms.includes(currentPlatform)) {
      warnings.push(`Plugin may not be compatible with platform ${currentPlatform}`);
    }

    return {
      compatible: issues.length === 0,
      issues,
      warnings,
    };
  }

  /**
   * Download plugin to local storage
   */
  private async downloadPlugin(metadata: PluginMetadata, installPath: string): Promise<void> {
    // For local plugins, just copy the directory
    if (metadata.repository?.localPath) {
      await this.copyDirectory(metadata.repository.localPath, installPath);
      return;
    }

    // For NPM packages, would need to implement npm install
    // For remote packages, would need to implement download and extraction
    throw new Error("Remote plugin installation not yet implemented");
  }

  /**
   * Install plugin dependencies
   */
  private async installPluginDependencies(installPath: string, metadata: PluginMetadata): Promise<void> {
    // Would implement npm install or similar dependency management
    // For now, just a placeholder
  }

  /**
   * Remove plugin files
   */
  private async removePluginFiles(installPath: string): Promise<void> {
    try {
      await fs.promises.rm(installPath, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Failed to remove plugin files at ${installPath}:`, error);
    }
  }

  /**
   * Copy directory recursively
   */
  private async copyDirectory(src: string, dest: string): Promise<void> {
    await fs.promises.mkdir(dest, { recursive: true });

    const entries = await fs.promises.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.promises.copyFile(srcPath, destPath);
      }
    }
  }

  /**
   * Load plugin code (simplified implementation)
   */
  private async loadPluginCode(plugin: Plugin): Promise<void> {
    if (!plugin.installedPath) {
      throw new Error("Plugin has no installed path");
    }

    // In a real implementation, this would:
    // 1. Load the plugin's main file
    // 2. Execute it in a sandboxed environment
    // 3. Extract hooks, tools, and commands
    // 4. Validate the plugin structure

    // For now, just mark as loaded
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    totalPlugins: number;
    installedPlugins: number;
    enabledPlugins: number;
    loadedPlugins: number;
    categories: Record<string, number>;
  } {
    const plugins = Array.from(this.plugins.values());
    const categories: Record<string, number> = {};

    for (const plugin of plugins) {
      const category = plugin.metadata.category;
      categories[category] = (categories[category] || 0) + 1;
    }

    return {
      totalPlugins: plugins.length,
      installedPlugins: plugins.filter((p) => p.installedPath).length,
      enabledPlugins: plugins.filter((p) => p.isEnabled).length,
      loadedPlugins: plugins.filter((p) => p.isLoaded).length,
      categories,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Get cached data
   */
  private getCached<T>(key: string): T | null {
    const expiry = this.cacheExpiry.get(key);
    if (expiry && Date.now() > expiry) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
      return null;
    }

    return this.cache.get(key) || null;
  }

  /**
   * Set cached data
   */
  private setCached<T>(key: string, data: T, ttl: number = this.config.cacheTimeout): void {
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + ttl);
  }
}
