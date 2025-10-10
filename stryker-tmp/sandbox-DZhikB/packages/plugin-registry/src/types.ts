/**
 * @fileoverview TypeScript types for plugin registry and management
 * @author @darianrosebrook
 */

import type { CanvasDocumentType } from "@paths-design/canvas-schema";
import { z } from "zod";

/**
 * Plugin category enumeration
 */
export type PluginCategory =
  | "design"
  | "development"
  | "analysis"
  | "automation"
  | "productivity"
  | "integration"
  | "visualization"
  | "utility";

/**
 * Plugin compatibility information
 */
export interface PluginCompatibility {
  minDesignerVersion: string;
  maxDesignerVersion?: string;
  supportedPlatforms: string[];
  requiredPermissions: string[];
}

/**
 * Plugin author information
 */
export interface PluginAuthor {
  name: string;
  email?: string;
  website?: string;
  organization?: string;
}

/**
 * Plugin repository information
 */
export interface PluginRepository {
  type: "git" | "npm" | "local";
  url?: string;
  branch?: string;
  tag?: string;
  packageName?: string;
  localPath?: string;
}

/**
 * Plugin metadata schema
 */
export const PluginMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  description: z.string(),
  category: z.enum([
    "design",
    "development",
    "analysis",
    "automation",
    "productivity",
    "integration",
    "visualization",
    "utility",
  ]),
  author: z.object({
    name: z.string(),
    email: z.string().email().optional(),
    website: z.string().url().optional(),
    organization: z.string().optional(),
  }),
  repository: z.object({
    type: z.enum(["git", "npm", "local"]),
    url: z.string().url().optional(),
    branch: z.string().optional(),
    tag: z.string().optional(),
    packageName: z.string().optional(),
    localPath: z.string().optional(),
  }).optional(),
  compatibility: z.object({
    minDesignerVersion: z.string(),
    maxDesignerVersion: z.string().optional(),
    supportedPlatforms: z.array(z.string()),
    requiredPermissions: z.array(z.string()),
  }),
  keywords: z.array(z.string()).optional(),
  homepage: z.string().url().optional(),
  bugs: z.string().url().optional(),
  license: z.string().optional(),
  engines: z.record(z.string()).optional(),
  main: z.string().optional(),
  scripts: z.record(z.string()).optional(),
  dependencies: z.record(z.string()).optional(),
  devDependencies: z.record(z.string()).optional(),
  peerDependencies: z.record(z.string()).optional(),
});

export type PluginMetadata = z.infer<typeof PluginMetadataSchema>;

/**
 * Plugin lifecycle hooks
 */
export interface PluginHooks {
  onLoad?: () => void | Promise<void>;
  onUnload?: () => void | Promise<void>;
  onDocumentLoad?: (document: CanvasDocumentType) => void | Promise<void>;
  onDocumentSave?: (document: CanvasDocumentType) => void | Promise<void>;
  onSelectionChange?: (selection: string[]) => void | Promise<void>;
  onNodeCreate?: (node: any, parentPath: string) => void | Promise<void>;
  onNodeUpdate?: (node: any, changes: any) => void | Promise<void>;
  onNodeDelete?: (node: any) => void | Promise<void>;
  beforeOperation?: (operation: string, args: any) => boolean | Promise<boolean>;
  afterOperation?: (operation: string, result: any) => void | Promise<void>;
  onError?: (error: Error) => void | Promise<void>;
}

/**
 * Plugin tool definition
 */
export interface PluginTool {
  name: string;
  description: string;
  inputSchema: any;
  handler: (args: any) => Promise<any>;
}

/**
 * Plugin command definition
 */
export interface PluginCommand {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  shortcut?: string;
  handler: () => void | Promise<void>;
}

/**
 * Plugin definition
 */
export interface Plugin {
  metadata: PluginMetadata;
  hooks?: PluginHooks;
  tools?: PluginTool[];
  commands?: PluginCommand[];
  isEnabled: boolean;
  isLoaded: boolean;
  installedPath?: string;
  lastUsed?: Date;
  usageCount: number;
}

/**
 * Plugin installation status
 */
export type PluginInstallStatus =
  | "not-installed"
  | "installing"
  | "installed"
  | "updating"
  | "uninstalling"
  | "error";

/**
 * Plugin installation information
 */
export interface PluginInstallation {
  pluginId: string;
  status: PluginInstallStatus;
  version: string;
  installedAt: Date;
  installedPath?: string;
  error?: string;
  progress?: number;
}

/**
 * Plugin search filters
 */
export interface PluginSearchFilters {
  query?: string;
  category?: PluginCategory;
  author?: string;
  minRating?: number;
  hasTools?: boolean;
  hasCommands?: boolean;
  compatible?: boolean;
  installed?: boolean;
}

/**
 * Plugin search result
 */
export interface PluginSearchResult {
  plugins: Plugin[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Plugin review
 */
export interface PluginReview {
  id: string;
  pluginId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  title: string;
  content: string;
  createdAt: Date;
  helpful: number;
  version: string;
}

/**
 * Plugin analytics
 */
export interface PluginAnalytics {
  pluginId: string;
  totalInstalls: number;
  activeInstalls: number;
  averageRating: number;
  totalRatings: number;
  weeklyDownloads: number;
  monthlyDownloads: number;
  lastUpdated: Date;
}

/**
 * Plugin registry configuration
 */
export interface PluginRegistryConfig {
  registryUrl?: string;
  localStoragePath?: string;
  cacheTimeout: number;
  maxCacheSize: number;
  enableAutoUpdate: boolean;
  trustedSources: string[];
  requireApproval: boolean;
}

/**
 * Plugin registry events
 */
export type PluginRegistryEvent =
  | "plugin:installed"
  | "plugin:uninstalled"
  | "plugin:updated"
  | "plugin:enabled"
  | "plugin:disabled"
  | "plugin:error"
  | "registry:sync";

/**
 * Plugin registry event data
 */
export interface PluginRegistryEventData {
  pluginId: string;
  version?: string;
  error?: string;
  metadata?: any;
}

/**
 * Plugin dependency graph node
 */
export interface PluginDependencyNode {
  pluginId: string;
  version: string;
  dependencies: string[];
  dependents: string[];
}

/**
 * Plugin compatibility check result
 */
export interface PluginCompatibilityResult {
  compatible: boolean;
  issues: string[];
  warnings: string[];
  requiredUpdates?: string[];
}

/**
 * Plugin security scan result
 */
export interface PluginSecurityScan {
  pluginId: string;
  scanDate: Date;
  riskLevel: "low" | "medium" | "high" | "critical";
  vulnerabilities: Array<{
    id: string;
    severity: string;
    description: string;
    fix?: string;
  }>;
  permissions: string[];
  recommendations: string[];
}


