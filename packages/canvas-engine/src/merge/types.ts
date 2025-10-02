/**
 * @fileoverview Merge conflict detection types for Designer canvas engine
 * @author @darianrosebrook
 */

import type {
  CanvasDocumentType,
  NodeType,
  FrameNodeType,
} from "@paths-design/canvas-schema";

/**
 * Conflict categories aligned with taxonomy
 */
export type ConflictCategory =
  | "structural"
  | "property"
  | "content"
  | "metadata";

/**
 * Conflict severity indicates resolution urgency
 */
export type ConflictSeverity = "error" | "warning" | "info";

/**
 * Resolution strategy hints for downstream tools
 */
export type ResolutionStrategy =
  | "auto-resolve"
  | "manual"
  | "prefer-local"
  | "prefer-remote"
  | "average";

/**
 * Conflict taxonomy codes
 * Examples: S-DEL-MOD, P-GEOMETRY, C-TEXT, M-NAME
 */
export type ConflictCode = string;

export interface Conflict {
  id: string; // ULID of affected node
  type: ConflictCategory;
  code: ConflictCode;
  severity: ConflictSeverity;
  path: string[]; // location within document
  autoResolvable: boolean;
  resolutionStrategy?: ResolutionStrategy;
  baseValue?: unknown;
  localValue?: unknown;
  remoteValue?: unknown;
  message: string;
}

export interface ConflictDetectionResult {
  conflicts: Conflict[];
  warnings: string[];
}

/**
 * Snapshot representation of a node for merge analysis
 */
export interface NodeSnapshot {
  node: NodeType;
  parentId?: string;
  index: number;
  path: string[];
}

export interface NodeIndex {
  byId: Map<string, NodeSnapshot>;
  byParent: Map<string | undefined, NodeSnapshot[]>;
}

export interface ConflictDetectionOptions {
  enableStructural?: boolean;
  enableProperty?: boolean;
  enableContent?: boolean;
  enableMetadata?: boolean;
}

export interface MergeDocuments {
  base: CanvasDocumentType;
  local: CanvasDocumentType;
  remote: CanvasDocumentType;
}

export interface ConflictDetector {
  detect(options?: ConflictDetectionOptions): ConflictDetectionResult;
}

export type NodeComparator<T = unknown> = (
  base: T | undefined,
  local: T | undefined,
  remote: T | undefined,
  context: {
    path: string[];
    nodeId: string;
  }
) => Conflict[];

export type SnapshotBuilder = (doc: CanvasDocumentType) => NodeIndex;

export type PathFormatter = (path: string[]) => string;

export type ConflictSorter = (conflicts: Conflict[]) => Conflict[];

export { CanvasDocumentType, NodeType, FrameNodeType };

