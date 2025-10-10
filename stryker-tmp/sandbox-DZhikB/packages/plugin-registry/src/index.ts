/**
 * @fileoverview Main entry point for plugin registry
 * @author @darianrosebrook
 */

import { PluginRegistry } from "./registry.js";
export { PluginRegistry } from "./registry.js";
export type {
  Plugin,
  PluginMetadata,
  PluginHooks,
  PluginTool,
  PluginCommand,
  PluginCategory,
  PluginCompatibility,
  PluginAuthor,
  PluginRepository,
  PluginRegistryConfig,
  PluginSearchFilters,
  PluginSearchResult,
  PluginInstallation,
  PluginRegistryEvent,
  PluginRegistryEventData,
  PluginReview,
  PluginAnalytics,
  PluginCompatibilityResult,
  PluginSecurityScan,
} from "./types.js";

/**
 * Create a new plugin registry instance
 */
export function createPluginRegistry(
  config?: Partial<import("./types.js").PluginRegistryConfig>
): PluginRegistry {
  return new PluginRegistry(config);
}
