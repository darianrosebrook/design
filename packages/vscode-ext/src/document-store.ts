/**
 * @fileoverview Deterministic Document Mutation Pipeline
 * @author @darianrosebrook
 *
 * Manages all document mutations through canvas-engine operations
 * with schema validation, canonical serialization, and undo/redo support.
 */

import { applyPatch } from "@paths-design/canvas-engine";
import type { CanvasDocumentType, NodeType } from "@paths-design/canvas-schema";
import { validateCanvasDocument } from "@paths-design/canvas-schema";
import * as vscode from "vscode";

/**
 * Document mutation event for tracking changes
 */
export interface DocumentMutationEvent {
  id: string;
  type: "property_change" | "create_node" | "delete_node" | "move_node";
  nodeId: string;
  propertyKey?: string;
  oldValue?: unknown;
  newValue?: unknown;
  patch?: any;
  timestamp: number;
  documentHash: string; // Hash of document state before mutation
}

/**
 * Document snapshot for undo/redo
 */
export interface DocumentSnapshot {
  id: string;
  document: CanvasDocumentType;
  mutations: DocumentMutationEvent[];
  timestamp: number;
}

/**
 * Undo/Redo operation result
 */
export interface UndoRedoResult {
  success: boolean;
  document?: CanvasDocumentType;
  error?: string;
  snapshotId?: string;
}

/**
 * Simple observability for document mutations
 */
class DocumentStoreObservability {
  private logs: Array<{
    timestamp: number;
    level: string;
    message: string;
    context?: unknown;
  }> = [];

  private metrics: Map<string, number> = new Map();

  log(level: string, message: string, context?: unknown): void {
    this.logs.push({ timestamp: Date.now(), level, message, context });
    console.log(`[${level.toUpperCase()}] DocumentStore: ${message}`, context);
  }

  metric(name: string, value: number): void {
    this.metrics.set(name, value);
  }

  getLogs(): Array<{
    timestamp: number;
    level: string;
    message: string;
    context?: unknown;
  }> {
    return [...this.logs];
  }

  getMetrics(): Map<string, number> {
    return new Map(this.metrics);
  }
}

/**
 * Node lookup index for O(1) node access
 */
export interface NodeIndexEntry {
  node: NodeType;
  artboardId: string;
  parentId: string | null;
  depth: number;
}

/**
 * Deterministic Document Mutation Pipeline
 * Routes all mutations through canvas-engine with validation and canonical serialization
 */
export class DocumentStore {
  private currentDocument: CanvasDocumentType | null = null;
  private documentFilePath: vscode.Uri | null = null;
  private mutationHistory: DocumentMutationEvent[] = [];
  private undoStack: DocumentSnapshot[] = [];
  private redoStack: DocumentSnapshot[] = [];
  private observability = new DocumentStoreObservability();

  // Node index for O(1) lookups - rebuilt on document changes
  private nodeIndex = new Map<string, NodeIndexEntry>();

  private static instance: DocumentStore | null = null;

  static getInstance(): DocumentStore {
    if (!DocumentStore.instance) {
      DocumentStore.instance = new DocumentStore();
    }
    return DocumentStore.instance;
  }

  private constructor() {
    this.observability.log("info", "DocumentStore initialized");
  }

  /**
   * Set the current document and file path
   */
  setDocument(document: CanvasDocumentType, filePath?: vscode.Uri): void {
    this.currentDocument = document;
    this.documentFilePath = filePath || null;

    // Rebuild node index for O(1) lookups
    this.rebuildNodeIndex();

    // Create initial snapshot
    const snapshot = this.createSnapshot("initial_state");
    this.mutationHistory = snapshot.mutations;
    this.undoStack = [];
    this.redoStack = [];

    this.observability.log("info", "Document loaded", {
      documentId: document.id,
      nodeCount: this.countNodes(document),
      filePath: filePath?.fsPath,
    });
  }

  /**
   * Get the current document
   */
  getDocument(): CanvasDocumentType | null {
    return this.currentDocument;
  }

  /**
   * Apply a JSON patch to a document
   */
  applyPatch(
    documentId: string,
    patch: any
  ): { success: boolean; document?: CanvasDocumentType; error?: string } {
    try {
      if (!this.currentDocument || this.currentDocument.id !== documentId) {
        return { success: false, error: "Document not found or ID mismatch" };
      }

      const newDocument = applyPatch(this.currentDocument, patch);

      // Update the document and rebuild the index
      this.currentDocument = newDocument;
      this.rebuildNodeIndex();

      this.observability?.log(
        "info",
        `Applied patch to document ${documentId}`,
        { patch }
      );

      return { success: true, document: newDocument };
    } catch (error) {
      this.observability?.log(
        "error",
        `Failed to apply patch to document ${documentId}`,
        { patch, error }
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get a node by ID with O(1) lookup
   *
   * @param nodeId Node ID to find
   * @returns Node information or null if not found
   *
   * **Performance**: O(1) - uses pre-built index
   */
  getNodeById(nodeId: string): NodeIndexEntry | null {
    return this.nodeIndex.get(nodeId) ?? null;
  }

  /**
   * Build JSON Pointer path for a node ID
   *
   * @param nodeId Node ID to build path for
   * @returns JSON Pointer path or null if node not found
   */
  private buildNodePath(nodeId: string): string | null {
    const nodeEntry = this.getNodeById(nodeId);
    if (!nodeEntry) {
      return null;
    }

    const pathParts: string[] = [];

    // Walk up the hierarchy from the target node to build the full path
    let currentEntry = nodeEntry;

    while (currentEntry) {
      if (currentEntry.parentId) {
        // Find parent entry
        const parentEntry = this.getNodeById(currentEntry.parentId);
        if (!parentEntry) {
          return null;
        }

        // Find the index of current node in parent's children
        const parentNode = parentEntry.node;
        if (parentNode.type === "frame" && parentNode.children) {
          const childIndex = parentNode.children.findIndex(
            (child: NodeType) => child.id === currentEntry!.node.id
          );
          if (childIndex >= 0) {
            pathParts.unshift(childIndex.toString());
          }
        }

        currentEntry = parentEntry;
      } else {
        // This is an artboard (root level)
        const artboardIndex = this.currentDocument?.artboards.findIndex(
          (ab) => ab.id === currentEntry.node.id
        );
        if (artboardIndex !== undefined && artboardIndex >= 0) {
          pathParts.unshift(artboardIndex.toString());
        }
        break;
      }
    }

    return `/${pathParts.join("/")}`;
  }

  /**
   * Get multiple nodes by IDs with O(k) lookup where k = query size
   *
   * @param nodeIds Array of node IDs to find
   * @returns Map of nodeId -> NodeInfo (only found nodes)
   *
   * **Performance**: O(k) where k = number of requested nodes
   */
  getNodesByIds(nodeIds: string[]): Map<string, NodeIndexEntry> {
    const results = new Map<string, NodeIndexEntry>();
    for (const id of nodeIds) {
      const entry = this.nodeIndex.get(id);
      if (entry) {
        results.set(id, entry);
      }
    }
    return results;
  }

  /**
   * Rebuild the node index after document changes
   * Called automatically when document is set
   *
   * **Performance**: O(n) where n = total nodes - called once per document load
   */
  private rebuildNodeIndex(): void {
    this.nodeIndex.clear();

    if (!this.currentDocument) {
      return;
    }

    const startTime = performance.now();

    const traverse = (
      nodes: NodeType[],
      artboardId: string,
      parentId: string | null,
      depth: number
    ): void => {
      for (const node of nodes) {
        // Index this node
        this.nodeIndex.set(node.id, {
          node,
          artboardId,
          parentId,
          depth,
        });

        // Recurse into children
        if (node.type === "frame") {
          // Ensure node.children is an array, defaulting to empty array if undefined
          const nodeChildren = Array.isArray(node.children)
            ? node.children
            : [];
          if (nodeChildren.length > 0) {
            traverse(nodeChildren, artboardId, node.id, depth + 1);
          }
        }
      }
    };

    // Index all artboards and their children
    for (const artboard of this.currentDocument.artboards) {
      // Index artboard itself
      this.nodeIndex.set(artboard.id, {
        node: artboard,
        artboardId: artboard.id,
        parentId: null,
        depth: 0,
      });

      // Index artboard children
      // Ensure children is an array, defaulting to empty array if undefined
      const children = Array.isArray(artboard.children)
        ? artboard.children
        : [];
      if (children.length > 0) {
        traverse(children, artboard.id, artboard.id, 1);
      }
    }

    const duration = performance.now() - startTime;
    this.observability.log("info", "Node index rebuilt", {
      nodeCount: this.nodeIndex.size,
      duration: Math.round(duration * 100) / 100,
    });
  }

  /**
   * Get the document file path
   */
  getDocumentFilePath(): vscode.Uri | null {
    return this.documentFilePath;
  }

  /**
   * Apply a property change mutation through canvas-engine
   */
  async applyPropertyChange(
    nodeId: string,
    propertyKey: string,
    newValue: unknown,
    oldValue?: unknown
  ): Promise<{
    success: boolean;
    document?: CanvasDocumentType;
    error?: string;
  }> {
    if (!this.currentDocument) {
      const error = "No document loaded";
      this.observability.log("error", "apply_property_change_failed", {
        error,
      });
      return { success: false, error };
    }

    // Track mutation duration
    this.observability.metric("document_mutation_duration_ms", 0);

    try {
      // Build JSON Pointer path for the node
      const nodePath = this.buildNodePath(nodeId);
      if (!nodePath) {
        const error = `Node not found: ${nodeId}`;
        this.observability.log("error", "apply_property_change_failed", {
          error,
          nodeId,
          propertyKey,
        });
        return { success: false, error };
      }

      // Create patch for property change
      const patch = {
        path: `${nodePath}/${propertyKey}`,
        op: "replace" as const,
        value: newValue,
      };

      // Apply mutation through engine
      const startTime = Date.now();
      const newDocument = applyPatch(this.currentDocument, patch);
      const duration = Date.now() - startTime;

      // Validate resulting document
      const validation = validateCanvasDocument(newDocument);
      if (!validation.success) {
        this.observability.log("error", "document_validation_failed", {
          errors: validation.errors || ["Unknown validation error"],
          duration,
        });
        return {
          success: false,
          error: `Document validation failed: ${(
            validation.errors || ["Unknown error"]
          ).join(", ")}`,
        };
      }

      // Canonicalize the document
      const canonicalDocument = this.canonicalizeDocument(newDocument);

      // Create mutation record
      const mutation: DocumentMutationEvent = {
        id: this.generateMutationId(),
        type: "property_change",
        nodeId,
        propertyKey,
        oldValue,
        newValue,
        patch,
        timestamp: Date.now(),
        documentHash: this.hashDocument(this.currentDocument),
      };

      // Update current document and history
      this.currentDocument = canonicalDocument;
      this.addToHistory(mutation);

      this.observability.log("info", "property_change_applied", {
        nodeId,
        propertyKey,
        duration,
        mutationId: mutation.id,
      });

      return { success: true, document: canonicalDocument };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.observability.log("error", "property_change_failed", {
        nodeId,
        propertyKey,
        error: errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Apply multiple mutations in batch
   */
  async applyMutations(
    mutations: Array<{
      nodeId: string;
      propertyKey?: string;
      newValue?: unknown;
      oldValue?: unknown;
    }>
  ): Promise<{
    success: boolean;
    document?: CanvasDocumentType;
    error?: string;
  }> {
    if (!this.currentDocument) {
      return { success: false, error: "No document loaded" };
    }

    // Track mutation duration
    this.observability.metric("document_mutation_duration_ms", 0);

    try {
      let workingDocument = this.currentDocument;

      for (const mutation of mutations) {
        if (mutation.propertyKey) {
          // Build JSON Pointer path for the node
          const nodePath = this.buildNodePath(mutation.nodeId);
          if (!nodePath) {
            const error = `Node not found: ${mutation.nodeId}`;
            this.observability.log("error", "apply_mutations_failed", {
              error,
              nodeId: mutation.nodeId,
              propertyKey: mutation.propertyKey,
            });
            return { success: false, error };
          }
        } else {
          // Node-level mutation (no property key)
          const nodePath = this.buildNodePath(mutation.nodeId);
          if (!nodePath) {
            const error = `Node not found: ${mutation.nodeId}`;
            this.observability.log("error", "apply_mutations_failed", {
              error,
              nodeId: mutation.nodeId,
            });
            return { success: false, error };
          }

          workingDocument = applyPatch(workingDocument, {
            path: nodePath,
            op: "replace" as const,
            value: mutation.newValue,
          });

          // Validate after each mutation
          const validation = validateCanvasDocument(workingDocument);
          if (!validation.success) {
            const error = `Document validation failed after mutation: ${(
              validation.errors || ["Unknown error"]
            ).join(", ")}`;
            this.observability.log("error", "document_validation_failed", {
              error,
              nodeId: mutation.nodeId,
              propertyKey: mutation.propertyKey,
            });
            return { success: false, error };
          }
        }
      }

      // Canonicalize final document
      const canonicalDocument = this.canonicalizeDocument(workingDocument);

      this.currentDocument = canonicalDocument;

      this.observability.log("info", "batch_mutations_applied", {
        mutationCount: mutations.length,
      });

      return { success: true, document: canonicalDocument };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.observability.log("error", "batch_mutations_failed", {
        mutationCount: mutations.length,
        error: errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Undo the last mutation
   */
  async undo(): Promise<UndoRedoResult> {
    if (this.undoStack.length === 0) {
      return { success: false, error: "No mutations to undo" };
    }

    const snapshot = this.undoStack.pop()!;
    this.redoStack.push(this.createSnapshot("before_undo"));

    this.currentDocument = snapshot.document;
    this.mutationHistory = [...snapshot.mutations];

    this.observability.log("info", "mutation_undone", {
      snapshotId: snapshot.id,
      mutationsReverted: snapshot.mutations.length,
    });

    return {
      success: true,
      document: this.currentDocument,
      snapshotId: snapshot.id,
    };
  }

  /**
   * Redo the last undone mutation
   */
  async redo(): Promise<UndoRedoResult> {
    if (this.redoStack.length === 0) {
      return { success: false, error: "No mutations to redo" };
    }

    const snapshot = this.redoStack.pop()!;
    this.undoStack.push(this.createSnapshot("before_redo"));

    this.currentDocument = snapshot.document;
    this.mutationHistory = [...snapshot.mutations];

    this.observability.log("info", "mutation_redone", {
      snapshotId: snapshot.id,
      mutationsApplied: snapshot.mutations.length,
    });

    return {
      success: true,
      document: this.currentDocument,
      snapshotId: snapshot.id,
    };
  }

  /**
   * Save document to file with canonical serialization
   */
  async saveDocument(): Promise<{ success: boolean; error?: string }> {
    if (!this.currentDocument || !this.documentFilePath) {
      return { success: false, error: "No document or file path" };
    }

    try {
      const canonicalDocument = this.canonicalizeDocument(this.currentDocument);
      const content = JSON.stringify(canonicalDocument, null, 2) + "\n";

      await vscode.workspace.fs.writeFile(
        this.documentFilePath,
        Buffer.from(content, "utf-8")
      );

      this.observability.log("info", "document_saved", {
        path: this.documentFilePath.fsPath,
        nodeCount: this.countNodes(canonicalDocument),
      });

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.observability.log("error", "document_save_failed", {
        path: this.documentFilePath.fsPath,
        error: errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get mutation history
   */
  getHistory(): DocumentMutationEvent[] {
    return [...this.mutationHistory];
  }

  /**
   * Get undo stack depth
   */
  getUndoStackDepth(): number {
    return this.undoStack.length;
  }

  /**
   * Get redo stack depth
   */
  getRedoStackDepth(): number {
    return this.redoStack.length;
  }

  /**
   * Get observability data
   */
  getObservability() {
    return {
      logs: this.observability.getLogs(),
      metrics: this.observability.getMetrics(),
    };
  }

  /**
   * Create a document snapshot for undo/redo
   */
  private createSnapshot(_reason: string): DocumentSnapshot {
    if (!this.currentDocument) {
      throw new Error("No document to snapshot");
    }

    return {
      id: this.generateSnapshotId(),
      document: this.canonicalizeDocument(this.currentDocument),
      mutations: [...this.mutationHistory],
      timestamp: Date.now(),
    };
  }

  /**
   * Add mutation to history and maintain undo stack
   */
  private addToHistory(mutation: DocumentMutationEvent): void {
    this.mutationHistory.push(mutation);

    // Add current state to undo stack
    if (this.currentDocument) {
      const snapshot = this.createSnapshot("after_mutation");
      this.undoStack.push(snapshot);
      this.redoStack = []; // Clear redo stack on new mutation
    }
  }

  /**
   * Canonicalize document for deterministic serialization
   */
  private canonicalizeDocument(
    document: CanvasDocumentType
  ): CanvasDocumentType {
    // Deep clone and sort keys recursively
    const sorted = JSON.parse(JSON.stringify(document));

    const sortKeys = (obj: any): any => {
      if (obj && typeof obj === "object" && !Array.isArray(obj)) {
        const sortedObj: any = {};
        Object.keys(obj)
          .sort()
          .forEach((key) => {
            sortedObj[key] = sortKeys(obj[key]);
          });
        return sortedObj;
      }
      if (Array.isArray(obj)) {
        return obj.map(sortKeys);
      }
      return obj;
    };

    return sortKeys(sorted) as CanvasDocumentType;
  }

  /**
   * Count nodes in document for observability
   */
  private countNodes(document: CanvasDocumentType): number {
    let count = 0;
    const traverse = (nodes: any[]) => {
      nodes.forEach((node) => {
        count++;
        // Ensure node.children is an array, defaulting to empty array if undefined
        const nodeChildren = Array.isArray(node.children) ? node.children : [];
        if (nodeChildren.length > 0) {
          traverse(nodeChildren);
        }
      });
    };

    document.artboards.forEach((artboard) => {
      // Ensure children is an array, defaulting to empty array if undefined
      const children = Array.isArray(artboard.children)
        ? artboard.children
        : [];
      if (children.length > 0) {
        traverse(children);
      }
    });

    return count;
  }

  /**
   * Generate deterministic hash of document state
   */
  private hashDocument(document: CanvasDocumentType): string {
    const canonical = this.canonicalizeDocument(document);
    const content = JSON.stringify(canonical);
    return Buffer.from(content).toString("base64").substring(0, 16);
  }

  /**
   * Generate unique mutation ID
   */
  private generateMutationId(): string {
    return `mut-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique snapshot ID
   */
  private generateSnapshotId(): string {
    return `snap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
