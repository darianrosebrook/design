/**
 * @fileoverview Path validation utilities for secure file access
 * @author @darianrosebrook
 *
 * Prevents directory traversal attacks and ensures all file access
 * remains within the workspace boundary.
 */

import * as path from 'node:path';
import * as fs from 'node:fs/promises';

/**
 * Validation result for path checks
 */
export interface ValidationResult {
  valid: boolean;
  resolvedPath?: string;
  reason?: string;
}

/**
 * Configuration for path validation
 */
export interface PathValidatorConfig {
  workspaceRoot: string;
  allowedPatterns: RegExp[];
  allowedExtensions: string[];
  maxPathLength: number;
}

/**
 * Default configuration for Designer workspace
 */
export const defaultConfig: Omit<PathValidatorConfig, 'workspaceRoot'> = {
  allowedPatterns: [
    /^design\/.*\.canvas\.json$/,
    /^design\/tokens\.json$/,
    /^design\/mappings\..*\.json$/,
    /^design\/components\.index\.json$/,
  ],
  allowedExtensions: ['.json', '.canvas.json'],
  maxPathLength: 260, // Windows MAX_PATH limit
};

/**
 * Path validator for workspace file access
 *
 * Ensures all file paths are:
 * - Within workspace root
 * - Not using directory traversal (..)
 * - Not absolute paths
 * - Matching allowed patterns
 * - Within reasonable length limits
 */
export class PathValidator {
  private config: PathValidatorConfig;
  private workspaceRootNormalized: string;

  constructor(config: PathValidatorConfig) {
    this.config = config;
    // Normalize and resolve workspace root once
    this.workspaceRootNormalized = path.resolve(path.normalize(config.workspaceRoot));
  }

  /**
   * Validate that a path is safe to access
   *
   * @param filePath Path to validate (relative to workspace root)
   * @returns Validation result with resolved path or error reason
   *
   * @example
   * ```typescript
   * const validator = new PathValidator({ workspaceRoot: '/workspace', ...defaultConfig });
   * const result = validator.validate('design/home.canvas.json');
   * if (result.valid) {
   *   // Safe to access result.resolvedPath
   * }
   * ```
   */
  validate(filePath: string): ValidationResult {
    // 1. Check path length
    if (filePath.length > this.config.maxPathLength) {
      return {
        valid: false,
        reason: `Path exceeds maximum length of ${this.config.maxPathLength} characters`,
      };
    }

    // 2. Normalize path (resolves . and removes redundant separators)
    const normalized = path.normalize(filePath);

    // 3. Reject absolute paths
    if (path.isAbsolute(normalized)) {
      return {
        valid: false,
        reason: 'Absolute paths are not allowed for security',
      };
    }

    // 4. Check for directory traversal attempts
    if (normalized.includes('..')) {
      return {
        valid: false,
        reason: 'Directory traversal (..) is not allowed for security',
      };
    }

    // 5. Check for null bytes (path poisoning)
    if (normalized.includes('\0')) {
      return {
        valid: false,
        reason: 'Null bytes in path are not allowed',
      };
    }

    // 6. Resolve to absolute path and verify it's within workspace
    const resolved = path.resolve(this.workspaceRootNormalized, normalized);
    
    if (!resolved.startsWith(this.workspaceRootNormalized + path.sep) && 
        resolved !== this.workspaceRootNormalized) {
      return {
        valid: false,
        reason: 'Path resolves outside workspace root',
      };
    }

    // 7. Check file extension
    const ext = path.extname(normalized);
    const hasAllowedExtension = this.config.allowedExtensions.some(allowed => 
      normalized.endsWith(allowed)
    );

    if (!hasAllowedExtension) {
      return {
        valid: false,
        reason: `File extension must be one of: ${this.config.allowedExtensions.join(', ')}`,
      };
    }

    // 8. Check against allowed patterns
    const matchesPattern = this.config.allowedPatterns.some(pattern => 
      pattern.test(normalized)
    );

    if (!matchesPattern) {
      return {
        valid: false,
        reason: 'Path does not match any allowed pattern',
      };
    }

    // All checks passed
    return {
      valid: true,
      resolvedPath: resolved,
    };
  }

  /**
   * Validate and check if file exists
   *
   * @param filePath Path to validate and check
   * @returns Validation result with existence check
   */
  async validateAndCheckExists(filePath: string): Promise<ValidationResult & { exists?: boolean }> {
    const validation = this.validate(filePath);
    
    if (!validation.valid) {
      return validation;
    }

    try {
      await fs.access(validation.resolvedPath!, fs.constants.F_OK);
      return {
        ...validation,
        exists: true,
      };
    } catch {
      return {
        ...validation,
        exists: false,
      };
    }
  }

  /**
   * Validate multiple paths at once
   *
   * @param filePaths Array of paths to validate
   * @returns Array of validation results
   */
  validateBatch(filePaths: string[]): ValidationResult[] {
    return filePaths.map(path => this.validate(path));
  }

  /**
   * Get workspace root
   */
  getWorkspaceRoot(): string {
    return this.workspaceRootNormalized;
  }

  /**
   * Check if a path would be within workspace without full validation
   * Useful for quick checks before expensive operations
   */
  isWithinWorkspace(filePath: string): boolean {
    try {
      const normalized = path.normalize(filePath);
      if (path.isAbsolute(normalized) || normalized.includes('..')) {
        return false;
      }
      const resolved = path.resolve(this.workspaceRootNormalized, normalized);
      return resolved.startsWith(this.workspaceRootNormalized + path.sep);
    } catch {
      return false;
    }
  }
}

/**
 * Create a path validator with default configuration
 *
 * @param workspaceRoot Workspace root directory
 * @returns Configured path validator
 */
export function createPathValidator(workspaceRoot: string): PathValidator {
  return new PathValidator({
    workspaceRoot,
    ...defaultConfig,
  });
}

