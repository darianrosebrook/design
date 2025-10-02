/**
 * @fileoverview Resource limits and quota management for VS Code extension
 * @author @darianrosebrook
 *
 * Enforces resource limits to prevent memory exhaustion and ensure
 * stable extension performance with large documents.
 */

import type { CanvasDocumentType, NodeType } from "@paths-design/designer/canvas-schema";
import * as fs from "node:fs/promises";

/**
 * Resource limit configuration
 */
export interface ResourceLimits {
  maxFileSizeBytes: number;
  maxNodeCount: number;
  warningNodeCount: number;
  maxMemoryMB: number;
}

/**
 * Default resource limits for Designer extension
 */
export const defaultLimits: ResourceLimits = {
  maxFileSizeBytes: 10 * 1024 * 1024, // 10MB
  maxNodeCount: 5000,
  warningNodeCount: 1000,
  maxMemoryMB: 500,
};

/**
 * Validation result with optional warning
 */
export interface ResourceValidationResult {
  valid: boolean;
  reason?: string;
  warning?: string;
  details?: {
    fileSize?: number;
    nodeCount?: number;
    memoryUsageMB?: number;
  };
}

/**
 * Resource manager for enforcing limits and quotas
 *
 * Prevents resource exhaustion by validating:
 * - File sizes before loading
 * - Node counts in documents
 * - Memory usage estimates
 */
export class ResourceManager {
  private limits: ResourceLimits;

  constructor(limits: ResourceLimits = defaultLimits) {
    this.limits = limits;
  }

  /**
   * Validate file size before loading
   *
   * @param filePath Path to file to check
   * @returns Validation result with file size details
   *
   * @example
   * ```typescript
   * const manager = new ResourceManager();
   * const result = await manager.validateFileSize('/path/to/file.json');
   * if (!result.valid) {
   *   console.error(result.reason);
   * }
   * ```
   */
  async validateFileSize(filePath: string): Promise<ResourceValidationResult> {
    try {
      const stats = await fs.stat(filePath);

      if (stats.size > this.limits.maxFileSizeBytes) {
        return {
          valid: false,
          reason: `File size ${this.formatBytes(stats.size)} exceeds limit of ${this.formatBytes(this.limits.maxFileSizeBytes)}`,
          details: {
            fileSize: stats.size,
          },
        };
      }

      return {
        valid: true,
        details: {
          fileSize: stats.size,
        },
      };
    } catch (error) {
      return {
        valid: false,
        reason: `Failed to check file size: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Validate document node count
   *
   * @param document Canvas document to validate
   * @returns Validation result with node count and warnings
   */
  validateNodeCount(document: CanvasDocumentType): ResourceValidationResult {
    const nodeCount = this.countNodes(document);

    if (nodeCount > this.limits.maxNodeCount) {
      return {
        valid: false,
        reason: `Document contains ${nodeCount} nodes, exceeding limit of ${this.limits.maxNodeCount}`,
        details: {
          nodeCount,
        },
      };
    }

    if (nodeCount > this.limits.warningNodeCount) {
      return {
        valid: true,
        warning: `Document contains ${nodeCount} nodes, which may impact performance. Consider splitting into multiple documents.`,
        details: {
          nodeCount,
        },
      };
    }

    return {
      valid: true,
      details: {
        nodeCount,
      },
    };
  }

  /**
   * Count total nodes in a document
   *
   * @param document Canvas document
   * @returns Total node count including all nested children
   */
  countNodes(document: CanvasDocumentType): number {
    let count = 0;

    for (const artboard of document.artboards) {
      count++; // Count the artboard itself
      count += this.countChildNodes(artboard.children);
    }

    return count;
  }

  /**
   * Recursively count child nodes
   */
  private countChildNodes(nodes: NodeType[]): number {
    let count = nodes.length;

    for (const node of nodes) {
      if (node.type === "frame" && node.children) {
        count += this.countChildNodes(node.children);
      }
    }

    return count;
  }

  /**
   * Estimate memory usage for a document
   *
   * @param document Canvas document
   * @returns Estimated memory usage in MB
   */
  estimateMemoryUsage(document: CanvasDocumentType): number {
    // Rough estimate: ~1KB per node on average
    const nodeCount = this.countNodes(document);
    const estimatedBytes = nodeCount * 1024;
    return estimatedBytes / (1024 * 1024); // Convert to MB
  }

  /**
   * Validate estimated memory usage
   *
   * @param document Canvas document
   * @returns Validation result with memory estimate
   */
  validateMemoryUsage(document: CanvasDocumentType): ResourceValidationResult {
    const estimatedMB = this.estimateMemoryUsage(document);

    if (estimatedMB > this.limits.maxMemoryMB) {
      return {
        valid: false,
        reason: `Estimated memory usage ${estimatedMB.toFixed(2)}MB exceeds limit of ${this.limits.maxMemoryMB}MB`,
        details: {
          memoryUsageMB: estimatedMB,
        },
      };
    }

    return {
      valid: true,
      details: {
        memoryUsageMB: estimatedMB,
      },
    };
  }

  /**
   * Validate all resource constraints for a document
   *
   * @param document Canvas document
   * @param filePath Optional file path for size validation
   * @returns Combined validation result
   */
  async validateAll(
    document: CanvasDocumentType,
    filePath?: string
  ): Promise<ResourceValidationResult> {
    const results: ResourceValidationResult[] = [];

    // Validate file size if path provided
    if (filePath) {
      results.push(await this.validateFileSize(filePath));
    }

    // Validate node count
    results.push(this.validateNodeCount(document));

    // Validate memory usage
    results.push(this.validateMemoryUsage(document));

    // Combine results
    const invalid = results.find((r) => !r.valid);
    if (invalid) {
      return invalid;
    }

    const warnings = results.filter((r) => r.warning).map((r) => r.warning!);
    const warning = warnings.length > 0 ? warnings.join(" ") : undefined;

    return {
      valid: true,
      warning,
      details: {
        fileSize: results[0]?.details?.fileSize,
        nodeCount: results[filePath ? 1 : 0]?.details?.nodeCount,
        memoryUsageMB: results[filePath ? 2 : 1]?.details?.memoryUsageMB,
      },
    };
  }

  /**
   * Get current resource limits
   */
  getLimits(): Readonly<ResourceLimits> {
    return { ...this.limits };
  }

  /**
   * Update resource limits
   *
   * @param limits Partial limits to update
   */
  updateLimits(limits: Partial<ResourceLimits>): void {
    this.limits = { ...this.limits, ...limits };
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }
}

/**
 * Create a resource manager with default limits
 *
 * @param limits Optional custom limits
 * @returns Configured resource manager
 */
export function createResourceManager(
  limits?: Partial<ResourceLimits>
): ResourceManager {
  return new ResourceManager(limits ? { ...defaultLimits, ...limits } : defaultLimits);
}

