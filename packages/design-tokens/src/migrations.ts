/**
 * @fileoverview Token schema migrations and versioning
 * @author @darianrosebrook
 */

import { z } from "zod";
import type { DesignTokens } from "./tokens";

/**
 * Supported token schema versions
 */
export const SUPPORTED_VERSIONS = ["0.1.0", "1.0.0"] as const;
export type TokenSchemaVersion = (typeof SUPPORTED_VERSIONS)[number];

/**
 * Current/latest schema version
 */
export const CURRENT_VERSION: TokenSchemaVersion = "1.0.0";

/**
 * Migration result
 */
export interface MigrationResult {
  /**
   * Whether migration was successful
   */
  success: boolean;

  /**
   * Migrated tokens (if successful)
   */
  tokens?: DesignTokens;

  /**
   * Source version
   */
  fromVersion?: string;

  /**
   * Target version
   */
  toVersion: string;

  /**
   * Warnings during migration
   */
  warnings?: string[];

  /**
   * Error message (if failed)
   */
  error?: string;
}

/**
 * Migration function signature
 */
type MigrationFn = (tokens: any) => any;

/**
 * Migration registry
 * Maps "fromVersion->toVersion" to migration function
 */
const MIGRATIONS = new Map<string, MigrationFn>();

/**
 * Register a migration
 */
function registerMigration(
  from: string,
  to: string,
  fn: MigrationFn
): void {
  MIGRATIONS.set(`${from}->${to}`, fn);
}

/**
 * Migration: 0.1.0 -> 1.0.0
 * 
 * Changes:
 * - Add $schema field
 * - Rename schemaVersion to version
 * - No structural changes to tokens
 */
registerMigration("0.1.0", "1.0.0", (tokens: any) => {
  const migrated = { ...tokens };

  // Add $schema if missing
  if (!migrated.$schema) {
    migrated.$schema =
      "https://paths.design/schemas/design-tokens/1.0.0.json";
  }

  // Rename schemaVersion to version
  if (migrated.schemaVersion) {
    migrated.version = migrated.schemaVersion;
    delete migrated.schemaVersion;
  }

  return migrated;
});

/**
 * Detect token schema version from tokens object
 * 
 * @param tokens - Tokens to check
 * @returns Detected version or undefined
 */
export function detectVersion(tokens: any): string | undefined {
  // Check explicit version fields
  if (tokens.version) return tokens.version;
  if (tokens.schemaVersion) return tokens.schemaVersion;

  // Try to infer from structure
  // 0.1.0 had schemaVersion, no $schema
  if (tokens.color && !tokens.version && !tokens.$schema) {
    return "0.1.0";
  }

  return undefined;
}

/**
 * Check if tokens need migration
 * 
 * @param tokens - Tokens to check
 * @returns true if migration is needed
 */
export function needsMigration(tokens: any): boolean {
  const version = detectVersion(tokens);
  return version !== CURRENT_VERSION;
}

/**
 * Get migration path from source version to target version
 * 
 * @param fromVersion - Source version
 * @param toVersion - Target version
 * @returns Array of migration steps, or null if no path exists
 * 
 * @example
 * ```ts
 * getMigrationPath("0.1.0", "1.0.0") // ["0.1.0->1.0.0"]
 * getMigrationPath("0.1.0", "2.0.0") // ["0.1.0->1.0.0", "1.0.0->2.0.0"]
 * ```
 */
export function getMigrationPath(
  fromVersion: string,
  toVersion: string
): string[] | null {
  // Direct migration exists
  const direct = `${fromVersion}->${toVersion}`;
  if (MIGRATIONS.has(direct)) {
    return [direct];
  }

  // For now, only support direct migrations
  // In the future, could implement multi-step migrations via graph traversal
  return null;
}

/**
 * Migrate tokens to a specific version
 * 
 * @param tokens - Tokens to migrate
 * @param targetVersion - Target schema version (defaults to latest)
 * @returns Migration result
 * 
 * @example
 * ```ts
 * const result = migrateTokens(oldTokens, "1.0.0");
 * if (result.success) {
 *   console.log("Migrated:", result.tokens);
 * } else {
 *   console.error("Migration failed:", result.error);
 * }
 * ```
 */
export function migrateTokens(
  tokens: any,
  targetVersion: TokenSchemaVersion = CURRENT_VERSION
): MigrationResult {
  const fromVersion = detectVersion(tokens);

  // No version detected
  if (!fromVersion) {
    return {
      success: false,
      toVersion: targetVersion,
      error: "Unable to detect token schema version",
    };
  }

  // Already at target version
  if (fromVersion === targetVersion) {
    return {
      success: true,
      tokens: tokens as DesignTokens,
      fromVersion,
      toVersion: targetVersion,
      warnings: ["Tokens already at target version, no migration needed"],
    };
  }

  // Find migration path
  const migrationPath = getMigrationPath(fromVersion, targetVersion);
  if (!migrationPath) {
    return {
      success: false,
      fromVersion,
      toVersion: targetVersion,
      error: `No migration path from ${fromVersion} to ${targetVersion}`,
    };
  }

  // Apply migrations
  try {
    let migrated = tokens;
    const warnings: string[] = [];

    for (const step of migrationPath) {
      const migrationFn = MIGRATIONS.get(step);
      if (!migrationFn) {
        throw new Error(`Migration ${step} not found`);
      }

      migrated = migrationFn(migrated);
      warnings.push(`Applied migration: ${step}`);
    }

    return {
      success: true,
      tokens: migrated as DesignTokens,
      fromVersion,
      toVersion: targetVersion,
      warnings,
    };
  } catch (error) {
    return {
      success: false,
      fromVersion,
      toVersion: targetVersion,
      error:
        error instanceof Error ? error.message : "Unknown migration error",
    };
  }
}

/**
 * Auto-migrate tokens to latest version
 * Convenience wrapper around migrateTokens()
 * 
 * @param tokens - Tokens to migrate
 * @returns Migration result
 */
export function autoMigrate(tokens: any): MigrationResult {
  return migrateTokens(tokens, CURRENT_VERSION);
}

/**
 * Check if a version is supported
 * 
 * @param version - Version to check
 * @returns true if supported
 */
export function isSupportedVersion(version: string): boolean {
  return SUPPORTED_VERSIONS.includes(version as TokenSchemaVersion);
}

/**
 * Get all supported versions
 * 
 * @returns Array of supported versions
 */
export function getSupportedVersions(): readonly TokenSchemaVersion[] {
  return SUPPORTED_VERSIONS;
}

/**
 * Create a version compatibility report
 * 
 * @param tokens - Tokens to check
 * @returns Compatibility report
 */
export interface CompatibilityReport {
  version: string | undefined;
  isSupported: boolean;
  isCurrent: boolean;
  needsMigration: boolean;
  canMigrate: boolean;
  migrationPath?: string[];
  warnings: string[];
}

export function checkCompatibility(tokens: any): CompatibilityReport {
  const version = detectVersion(tokens);
  const warnings: string[] = [];

  if (!version) {
    warnings.push("Unable to detect schema version");
    return {
      version,
      isSupported: false,
      isCurrent: false,
      needsMigration: true,
      canMigrate: false,
      warnings,
    };
  }

  const isSupported = isSupportedVersion(version);
  const isCurrent = version === CURRENT_VERSION;
  const _needsMigration = !isCurrent;
  const migrationPath = _needsMigration
    ? getMigrationPath(version, CURRENT_VERSION)
    : undefined;
  const canMigrate = _needsMigration && migrationPath !== null;

  if (!isSupported) {
    warnings.push(`Version ${version} is not supported`);
  }

  if (_needsMigration && !canMigrate) {
    warnings.push(`No migration path available from ${version} to ${CURRENT_VERSION}`);
  }

  return {
    version,
    isSupported,
    isCurrent,
    needsMigration: _needsMigration,
    canMigrate,
    migrationPath: migrationPath ?? undefined,
    warnings,
  };
}

