/**
 * @fileoverview Core types for Canvas Engine operations
 * @author @darianrosebrook
 */

import type {
  CanvasDocumentType,
  NodeType,
  ULIDType,
} from "@paths-design/canvas-schema";
import {
  CanvasDocument as _CanvasDocument,
  Node as _Node,
  Artboard as _Artboard,
  ArtboardType as _ArtboardType,
} from "@paths-design/canvas-schema";

/**
 * Path to a node in the document tree
 */
export type NodePath = (string | number)[];

/**
 * Operation result
 */
export interface OperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Node operation types
 */
export type NodeOperation =
  | "create"
  | "update"
  | "delete"
  | "move"
  | "duplicate";

/**
 * Hit test result
 */
export interface HitTestResult {
  nodeId: ULIDType;
  nodePath: NodePath;
  point: { x: number; y: number };
  node: NodeType;
}

/**
 * JSON Patch operation
 */
export interface JsonPatch {
  op: "add" | "remove" | "replace" | "move" | "copy" | "test";
  path: string;
  value?: unknown;
  from?: string;
}

/**
 * Document patch result
 */
export interface DocumentPatch {
  document: CanvasDocumentType;
  patches: JsonPatch[];
  reversePatches: JsonPatch[];
}

/**
 * Node finder options
 */
export interface NodeFinderOptions {
  includeInvisible?: boolean;
  maxDepth?: number;
  filter?: (node: NodeType) => boolean;
}

/**
 * Tree traversal options
 */
export interface TraversalOptions {
  maxDepth?: number;
  includeRoot?: boolean;
  filter?: (node: NodeType, path: NodePath) => boolean;
  artboardIndex?: number;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  operationTimeMs: number;
  nodesProcessed: number;
  memoryUsageMB?: number;
}
