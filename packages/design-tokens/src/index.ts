/**
 * @fileoverview Design tokens and theme utilities
 * @author @darianrosebrook
 */

// Export tokens and schema
export { DesignTokensSchema, defaultTokens, type DesignTokens } from "./tokens";

// Export utilities
export {
  flattenTokens,
  tokensToCSS,
  getToken,
  setToken,
  validateTokens,
  mergeTokens,
  tokensToTypes,
} from "./utils";

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
} from "./resolver";

// Export watcher
export {
  watchTokens,
  watchTokensSimple,
  type WatcherOptions,
  type WatcherInstance,
} from "./watcher";

// Note: generate-css.js is a CLI script, not exported as library code
