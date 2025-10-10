/**
 * @fileoverview Semantic diff types for Designer canvas documents
 * @author @darianrosebrook
 */

import type { CanvasDocumentType, NodeType } from "../types.js";

/**
 * Types of diff operations that can be performed on canvas documents
 */
export type DiffOperationType = "add" | "remove" | "modify" | "move";

/**
 * A single diff operation representing a change between documents
 */
export interface DiffOperation {
  type: DiffOperationType;
  nodeId: string;
  path: string[];
  field?: string; // for property-level changes
  oldValue?: unknown;
  newValue?: unknown;
  metadata?: {
    index?: number;
    parentId?: string;
    description?: string;
    severity?: "info" | "warning" | "error";
  };
}

/**
 * Result of comparing two documents
 */
export interface DiffResult {
  operations: DiffOperation[];
  summary: {
    added: number;
    removed: number;
    modified: number;
    moved: number;
    total: number;
  };
  metadata: {
    fromDocumentId?: string;
    toDocumentId?: string;
    timestamp: number;
    duration: number;
  };
}

/**
 * Options for controlling diff behavior
 */
export interface DiffOptions {
  includeStructural?: boolean;
  includeProperty?: boolean;
  includeContent?: boolean;
  includeMetadata?: boolean;
  maxOperations?: number;
  ignoreNodeTypes?: string[];
  includeDescriptions?: boolean;
}

/**
 * Default diff options
 */
export const DEFAULT_DIFF_OPTIONS: Required<DiffOptions> = {
  includeStructural: true,
  includeProperty: true,
  includeContent: true,
  includeMetadata: true,
  maxOperations: 1000,
  ignoreNodeTypes: [],
  includeDescriptions: true,
};

/**
 * Node change tracking during diff computation
 */
export interface NodeChange {
  nodeId: string;
  type: "added" | "removed" | "modified" | "moved";
  oldNode?: NodeType;
  newNode?: NodeType;
  oldPath?: string[];
  newPath?: string[];
}

/**
 * Property diff result
 */
export interface PropertyDiff {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  path: string[];
}

/**
 * Utility types for diff computation
 */
export interface DocumentPair {
  base: CanvasDocumentType;
  target: CanvasDocumentType;
}

export interface NodePair {
  base?: NodeType;
  target?: NodeType;
  path: string[];
}

export type DiffComparator<T = unknown> = (
  oldValue: T | undefined,
  newValue: T | undefined,
  context: {
    nodeId: string;
    path: string[];
    field?: string;
  }
) => DiffOperation[];

export type NodeFilter = (node: NodeType, path: string[]) => boolean;
