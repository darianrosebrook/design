/**
 * @fileoverview Design tokens and theme utilities
 * @author @darianrosebrook
 */

// Export tokens and schema
export {
  DesignTokensSchema,
  defaultTokens,
  type DesignTokens,
} from "./tokens.js";

// Export utilities
export {
  flattenTokens,
  tokensToCSS,
  getToken,
  setToken,
  validateTokens,
  mergeTokens,
  tokensToTypes,
} from "./utils.js";

// Export resolver
export {
  resolveTokenReferences,
  validateTokenReferences,
  isTokenReference,
  extractReferencePath,
  getTokenByPath,
  buildDependencyGraph,
  detectCircularReferences,
  getTokenDependents,
  getTokenDependencies,
  type ResolveOptions,
  type ValidationResult,
} from "./resolver.js";

// Note: watcher functions are server-side only and not exported in client bundles
// Use dynamic imports if needed: import { watchTokens } from "./watcher.js";

// Export migrations
export {
  detectVersion,
  needsMigration,
  migrateTokens,
  autoMigrate,
  isSupportedVersion,
  getSupportedVersions,
  checkCompatibility,
  CURRENT_VERSION,
  SUPPORTED_VERSIONS,
  type TokenSchemaVersion,
  type MigrationResult,
  type CompatibilityReport,
} from "./migrations.js";

// Export validator
export {
  validateW3CDesignTokens,
  validateW3CTokensStructure,
  validateToken,
  extractTokenPaths,
  getTokenValue,
  flattenW3CTokens,
  W3CDesignTokensSchema,
  W3CTokenSchema,
  W3CTokenValueSchema,
  SUPPORTED_TOKEN_TYPES,
  type TokenValidationResult,
  type TokenType,
} from "./validator.js";

// Note: generate-css.js is a CLI script, not exported as library code
