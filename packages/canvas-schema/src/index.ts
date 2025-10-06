/**
 * @fileoverview Canvas Schema - TypeScript types and validation for Designer canvas documents
 * @author @darianrosebrook
 *
 * Core schema definitions for canvas documents, nodes, and validation.
 * Provides Zod schemas for type-safe document manipulation and Ajv validation.
 */

// Core primitive types
import { ulid } from "ulid";
import { z } from "zod";

// Re-export ULID utilities
export {
  generateNodeId,
  generateNodeIds,
  isValidUlid,
  getUlidTimestamp,
  isUlidInTimeRange,
} from "./ulid.js";

/**
 * ULID validation - 26 character string with specific alphabet
 */
export const ULID = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/);

/**
 * Semantic key pattern for stable node identification
 * Uses dot notation for hierarchy (e.g., 'hero.title', 'nav.items[0]')
 */
export const SemanticKey = z
  .string()
  .regex(/^[a-z][a-z0-9]*(\.[a-z0-9]+|\[[0-9]+\])*$/)
  .optional();

/**
 * Rectangle geometry type
 */
export const Rect = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().min(0),
  height: z.number().min(0),
});

/**
 * Text styling properties
 */
export const TextStyle = z.object({
  family: z.string().optional(),
  size: z.number().optional(),
  lineHeight: z.number().optional(),
  weight: z.string().optional(),
  letterSpacing: z.number().optional(),
  color: z.string().optional(),
});

/**
 * Style properties for visual elements
 */
export const Style = z.object({
  fills: z.array(z.any()).optional(),
  strokes: z.array(z.any()).optional(),
  radius: z.number().optional(),
  opacity: z.number().min(0).max(1).optional(),
  shadow: z.any().optional(),
});

/**
 * Base node properties shared by all node types
 */
const BaseNode = z.object({
  id: ULID,
  type: z.string(),
  name: z.string(),
  visible: z.boolean().default(true),
  frame: Rect,
  style: Style.optional(),
  data: z.record(z.any()).optional(),
  bind: z.any().optional(),
});

/**
 * Text node type
 */
export const TextNode = BaseNode.extend({
  type: z.literal("text"),
  text: z.string(),
  textStyle: TextStyle.optional(),
});

/**
 * Frame node type (container for other nodes)
 */
export const FrameNode = BaseNode.extend({
  type: z.literal("frame"),
  layout: z.record(z.any()).optional(),
  children: z.lazy(() => Node.array()).default([]),
});

/**
 * Component instance node type (references external components)
 */
export const ComponentInstanceNode = BaseNode.extend({
  type: z.literal("component"),
  componentKey: z.string(),
  props: z.record(z.any()).default({}),
});

/**
 * Union type for all possible node types
 */
export const Node: z.ZodType<any> = z.union([
  FrameNode,
  TextNode,
  ComponentInstanceNode,
]);

/**
 * Artboard definition
 */
export const Artboard = z.object({
  id: ULID,
  name: z.string(),
  frame: Rect,
  children: Node.array().default([]),
});

/**
 * Complete canvas document - current version
 */
export const CanvasDocument = z.object({
  schemaVersion: z.literal("0.1.0"),
  id: ULID,
  name: z.string(),
  artboards: Artboard.array().min(1),
});

/**
 * Any canvas document (for migration purposes)
 */
export const AnyCanvasDocument = z.object({
  schemaVersion: z.string(),
  id: ULID,
  name: z.string(),
  artboards: z.any().array().min(1),
});

/**
 * Component definition for reusable visual components
 */
export const ComponentDefinition = z.object({
  id: ULID,
  name: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  version: z.string().default("1.0.0"),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  // The visual representation as a node subtree
  rootNode: Node,
  // Component properties that can be customized
  properties: z
    .record(
      z.object({
        type: z.string(),
        defaultValue: z.any(),
        description: z.string().optional(),
        required: z.boolean().default(false),
      })
    )
    .default({}),
});

/**
 * Component library - collection of reusable components
 */
export const ComponentLibrary = z.object({
  version: z.literal("1.0.0"),
  id: ULID,
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  components: ComponentDefinition.array().default([]),
});

/**
 * TypeScript type exports for external use
 */
export type ULIDType = z.infer<typeof ULID>;
export type SemanticKeyType = z.infer<typeof SemanticKey>;
export type RectType = z.infer<typeof Rect>;
export type TextStyleType = z.infer<typeof TextStyle>;
export type StyleType = z.infer<typeof Style>;
export type BaseNodeType = z.infer<typeof BaseNode>;
export type TextNodeType = z.infer<typeof TextNode>;
export type FrameNodeType = z.infer<typeof FrameNode>;
export type ComponentInstanceNodeType = z.infer<typeof ComponentInstanceNode>;
export type NodeType = z.infer<typeof Node>;
export type ArtboardType = z.infer<typeof Artboard>;
export type CanvasDocumentType = z.infer<typeof CanvasDocument>;
export type AnyCanvasDocumentType = z.infer<typeof AnyCanvasDocument>;
export type ComponentDefinitionType = z.infer<typeof ComponentDefinition>;
export type ComponentLibraryType = z.infer<typeof ComponentLibrary>;

/**
 * JSON Patch operation for document mutations
 */
export const Patch = z.object({
  path: z.array(z.union([z.string(), z.number()])),
  op: z.enum(["set", "insert", "remove"]),
  value: z.any().optional(),
});

export type PatchType = z.infer<typeof Patch>;

/**
 * Schema validation function with migration support
 * @param doc Document to validate (may be outdated schema version)
 * @returns Validation result with parsed document or errors
 */
export function validateDocument(doc: unknown): {
  success: boolean;
  data?: CanvasDocumentType;
  errors?: string[];
  migrated?: boolean;
} {
  try {
    // First try to parse as current schema version
    const result = CanvasDocument.parse(doc);
    return { success: true, data: result, migrated: false };
  } catch (currentVersionError) {
    // If that fails, try to parse as any document for migration
    try {
      const anyDoc = AnyCanvasDocument.parse(doc);

      // Check if migration is needed and available
      if (needsMigration(anyDoc.schemaVersion)) {
        try {
          const migratedDoc = migrateDocument(anyDoc);
          return { success: true, data: migratedDoc, migrated: true };
        } catch (migrationError) {
          return {
            success: false,
            errors: [
              `Migration failed: ${
                migrationError instanceof Error
                  ? migrationError.message
                  : "Unknown migration error"
              }`,
            ],
          };
        }
      } else {
        // Document claims to be current version but failed validation
        // Try to repair it by adding missing required properties
        try {
          const repairedDoc = repairDocument(anyDoc);
          return { success: true, data: repairedDoc, migrated: true };
        } catch (repairError) {
          // Repair failed, return original validation errors
          if (currentVersionError instanceof z.ZodError) {
            return {
              success: false,
              errors: currentVersionError.errors.map(
                (err) => `${err.path.join(".")}: ${err.message}`
              ),
            };
          }
          return {
            success: false,
            errors: [
              repairError instanceof Error
                ? repairError.message
                : "Unknown repair error",
            ],
          };
        }
      }
    } catch (_parseError) {
      // Document doesn't match any known schema structure
      if (currentVersionError instanceof z.ZodError) {
        return {
          success: false,
          errors: currentVersionError.errors.map(
            (err) => `${err.path.join(".")}: ${err.message}`
          ),
        };
      }
      return { success: false, errors: ["Document structure is invalid"] };
    }
  }
}

/**
 * Alias for validateDocument for backwards compatibility
 */
export const validateCanvasDocument = validateDocument;

/**
 * Generate a new ULID for nodes
 * @returns A new ULID string
 */
export function generateULID(): string {
  return ulid();
}

/**
 * Canonical JSON serialization with deterministic output
 * @param obj Object to serialize
 * @returns Deterministic JSON string with sorted keys, fixed spacing, and newline EOF
 */
export function canonicalizeDocument(obj: any): string {
  return JSON.stringify(obj, Object.keys(obj).sort(), 2) + "\n";
}

/**
 * Legacy alias for backwards compatibility
 */
export const canonicalSerialize = canonicalizeDocument;

/**
 * Migration functions for different schema versions
 */
export const migrations = {
  /**
   * Migrate from version 0.0.1 to 0.1.0
   * (Example migration - adjust based on actual schema changes)
   */
  "0.0.1": (doc: any): CanvasDocumentType => {
    // Example migration logic - in real scenarios this would handle
    // structural changes between versions
    const artboards = (doc.artboards || []).map((artboard: any) => ({
      id: artboard.id || generateULID(),
      name: artboard.name || "Artboard",
      frame: artboard.frame || { x: 0, y: 0, width: 1440, height: 1024 },
      children: artboard.children || [],
    }));

    // If no artboards, create a default one
    if (artboards.length === 0) {
      artboards.push({
        id: generateULID(),
        name: "Artboard",
        frame: { x: 0, y: 0, width: 1440, height: 1024 },
        children: [],
      });
    }

    return {
      schemaVersion: "0.1.0",
      id: doc.id || generateULID(),
      name: doc.name || "Untitled",
      artboards,
    };
  },

  /**
   * Migrate from version 0.1.0 to 0.2.0 (future version)
   * This would handle future schema changes
   */
  "0.2.0": (doc: CanvasDocumentType): CanvasDocumentType => {
    // Future migration logic
    return doc;
  },
};

/**
 * Get the latest schema version
 */
export const LATEST_SCHEMA_VERSION = "0.1.0";

/**
 * Performance and memory budget constants
 */
export const PERFORMANCE_BUDGETS = {
  // Maximum nodes per document (performance threshold)
  MAX_NODES_PER_DOCUMENT: 10000,
  // Maximum artboards per document
  MAX_ARTBOARDS_PER_DOCUMENT: 100,
  // Maximum nesting depth for nodes
  MAX_NESTING_DEPTH: 50,
  // Memory budget in MB for canvas operations
  MEMORY_BUDGET_MB: 100,
  // Timeout for complex operations in milliseconds
  OPERATION_TIMEOUT_MS: 30000,
} as const;

/**
 * Check if a schema version needs migration
 */
export function needsMigration(schemaVersion: string): boolean {
  return schemaVersion !== LATEST_SCHEMA_VERSION;
}

/**
 * Repair a document that has current schema version but missing required fields
 */
export function repairDocument(doc: any): CanvasDocumentType {
  // Deep clone to avoid mutating the original
  const repaired = JSON.parse(JSON.stringify(doc));

  // Ensure all artboards have required frame property
  if (repaired.artboards && Array.isArray(repaired.artboards)) {
    repaired.artboards = repaired.artboards.map((artboard: any) => {
      if (!artboard.frame) {
        artboard.frame = { x: 0, y: 0, width: 1440, height: 1024 };
      }
      // Ensure frame has all required properties
      if (typeof artboard.frame.x !== "number") {artboard.frame.x = 0;}
      if (typeof artboard.frame.y !== "number") {artboard.frame.y = 0;}
      if (typeof artboard.frame.width !== "number") {artboard.frame.width = 1440;}
      if (typeof artboard.frame.height !== "number")
        {artboard.frame.height = 1024;}

      // Ensure children array exists
      if (!artboard.children) {
        artboard.children = [];
      }

      return artboard;
    });
  }

  // Ensure document has required properties
  if (!repaired.id) {
    repaired.id = generateULID();
  }
  if (!repaired.name) {
    repaired.name = "Untitled Document";
  }

  // Validate the repaired document
  try {
    const result = CanvasDocument.parse(repaired);
    return result;
  } catch (error) {
    throw new Error(
      `Document repair failed: ${
        error instanceof z.ZodError
          ? error.errors
              .map((err) => `${err.path.join(".")}: ${err.message}`)
              .join(", ")
          : "Unknown validation error"
      }`
    );
  }
}

/**
 * Migrate a document to the latest schema version
 */
export function migrateDocument(doc: any): CanvasDocumentType {
  let currentDoc = doc;

  // Apply migrations in order until we reach the latest version
  while (needsMigration(currentDoc.schemaVersion)) {
    const migration =
      migrations[currentDoc.schemaVersion as keyof typeof migrations];
    if (!migration) {
      throw new Error(
        `No migration available for schema version ${currentDoc.schemaVersion}`
      );
    }

    currentDoc = migration(currentDoc);
  }

  // Validate the final result
  const validation = validateDocument(currentDoc);
  if (!validation.success) {
    throw new Error(
      `Migration failed validation: ${validation.errors?.join(", ")}`
    );
  }

  return currentDoc;
}

/**
 * Create an empty canvas document with canonical skeleton
 * @param name Document name (used for both document name and initial artboard)
 * @returns Valid canvas document with one empty artboard
 */
export function createEmptyDocument(name: string): CanvasDocumentType {
  const docId = generateULID();
  const artboardId = generateULID();

  return {
    schemaVersion: LATEST_SCHEMA_VERSION,
    id: docId,
    name,
    artboards: [
      {
        id: artboardId,
        name: `${name} Artboard`,
        frame: {
          x: 0,
          y: 0,
          width: 1440,
          height: 1024,
        },
        children: [],
      },
    ],
  };
}

/**
 * Create an empty component library
 * @param name Library name
 * @returns Empty component library
 */
export function createEmptyComponentLibrary(
  name: string
): ComponentLibraryType {
  const now = new Date().toISOString();

  return {
    version: "1.0.0",
    id: generateULID(),
    name,
    description: `Component library: ${name}`,
    createdAt: now,
    updatedAt: now,
    components: [],
  };
}

/**
 * Create a component definition from a canvas node
 * @param node Source node to create component from
 * @param name Component name
 * @param description Component description
 * @returns Component definition
 */
export function createComponentFromNode(
  node: NodeType,
  name: string,
  description?: string,
  category?: string,
  tags: string[] = []
): ComponentDefinitionType {
  const now = new Date().toISOString();
  const componentId = generateULID();

  // Create a copy of the node with a new ID for the component root
  const rootNode: NodeType = {
    ...node,
    id: generateULID(), // New ID for the component instance
    name: `${name} Instance`,
  };

  // Extract properties that can be customized
  const properties: Record<
    string,
    { type: string; defaultValue: any; description?: string; required: boolean }
  > = {};

  // For text nodes, extract text as a customizable property
  if (node.type === "text" && "text" in node) {
    properties.text = {
      type: "string",
      defaultValue: node.text,
      description: "Text content",
      required: true,
    };
  }

  // For frame nodes, extract layout properties
  if (node.type === "frame" && "layout" in node) {
    properties.layout = {
      type: "object",
      defaultValue: node.layout || {},
      description: "Layout configuration",
      required: false,
    };
  }

  return {
    id: componentId,
    name,
    description,
    category,
    tags,
    version: "1.0.0",
    createdAt: now,
    updatedAt: now,
    rootNode,
    properties,
  };
}

/**
 * Create a component instance node for use in canvas documents
 * @param componentDefinition Component to instantiate
 * @param position Position for the instance
 * @param overrides Property overrides
 * @returns Component instance node
 */
export function createComponentInstance(
  componentDefinition: ComponentDefinitionType,
  position: { x: number; y: number; width: number; height: number },
  overrides: Record<string, any> = {}
): ComponentInstanceNodeType {
  const instanceId = generateULID();

  return {
    id: instanceId,
    type: "component",
    name: `${componentDefinition.name} Instance`,
    visible: true,
    frame: position,
    componentKey: componentDefinition.id,
    props: overrides,
  };
}

/**
 * Validate a component library
 */
export function validateComponentLibrary(library: unknown): {
  success: boolean;
  data?: ComponentLibraryType;
  errors?: string[];
} {
  try {
    const result = ComponentLibrary.parse(library);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(
          (err) => `${err.path.join(".")}: ${err.message}`
        ),
      };
    }
    return { success: false, errors: ["Unknown validation error"] };
  }
}

/**
 * Performance monitoring and memory budget utilities
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private startTimes = new Map<string, number>();
  private memoryUsage = new Map<string, number>();
  private operationCounts = new Map<string, number>();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start timing an operation
   */
  startOperation(operationId: string): void {
    this.startTimes.set(operationId, performance.now());
  }

  /**
   * End timing an operation and record metrics
   */
  endOperation(operationId: string): number {
    const startTime = this.startTimes.get(operationId);
    if (!startTime) {
      throw new Error(`Operation ${operationId} was not started`);
    }

    const duration = performance.now() - startTime;
    this.startTimes.delete(operationId);

    // Record metrics
    const count = this.operationCounts.get(operationId) || 0;
    this.operationCounts.set(operationId, count + 1);

    return duration;
  }

  /**
   * Record memory usage for an operation
   */
  recordMemoryUsage(operationId: string, bytes: number): void {
    this.memoryUsage.set(operationId, bytes);
  }

  /**
   * Check if operation exceeds memory budget
   */
  exceedsMemoryBudget(bytes: number): boolean {
    return bytes > PERFORMANCE_BUDGETS.MEMORY_BUDGET_MB * 1024 * 1024;
  }

  /**
   * Check if operation exceeds time budget
   */
  exceedsTimeBudget(milliseconds: number): boolean {
    return milliseconds > PERFORMANCE_BUDGETS.OPERATION_TIMEOUT_MS;
  }

  /**
   * Get performance metrics
   */
  getMetrics(): {
    operationCounts: Record<string, number>;
    memoryUsage: Record<string, number>;
  } {
    return {
      operationCounts: Object.fromEntries(this.operationCounts),
      memoryUsage: Object.fromEntries(this.memoryUsage),
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.startTimes.clear();
    this.memoryUsage.clear();
    this.operationCounts.clear();
  }
}

/**
 * Check if a document exceeds performance budgets
 */
export function checkDocumentPerformance(document: CanvasDocumentType): {
  withinBudget: boolean;
  warnings: string[];
  metrics: {
    nodeCount: number;
    artboardCount: number;
    maxNestingDepth: number;
    estimatedMemoryMB: number;
  };
} {
  const warnings: string[] = [];
  let nodeCount = 0;
  let maxNestingDepth = 0;

  // Count nodes and check nesting depth
  const countNodes = (nodes: NodeType[], depth: number = 0): void => {
    for (const node of nodes) {
      nodeCount++;
      maxNestingDepth = Math.max(maxNestingDepth, depth);

      if (node.children) {
        countNodes(node.children, depth + 1);
      }
    }
  };

  for (const artboard of document.artboards) {
    if (artboard.children) {
      countNodes(artboard.children);
    }
  }

  // Estimate memory usage (rough calculation)
  const estimatedMemoryBytes = nodeCount * 1024; // Assume ~1KB per node
  const estimatedMemoryMB = estimatedMemoryBytes / (1024 * 1024);

  // Check against budgets
  if (nodeCount > PERFORMANCE_BUDGETS.MAX_NODES_PER_DOCUMENT) {
    warnings.push(
      `Document has ${nodeCount} nodes, exceeding recommended limit of ${PERFORMANCE_BUDGETS.MAX_NODES_PER_DOCUMENT}`
    );
  }

  if (
    document.artboards.length > PERFORMANCE_BUDGETS.MAX_ARTBOARDS_PER_DOCUMENT
  ) {
    warnings.push(
      `Document has ${document.artboards.length} artboards, exceeding recommended limit of ${PERFORMANCE_BUDGETS.MAX_ARTBOARDS_PER_DOCUMENT}`
    );
  }

  if (maxNestingDepth > PERFORMANCE_BUDGETS.MAX_NESTING_DEPTH) {
    warnings.push(
      `Document has nesting depth of ${maxNestingDepth}, exceeding recommended limit of ${PERFORMANCE_BUDGETS.MAX_NESTING_DEPTH}`
    );
  }

  if (estimatedMemoryMB > PERFORMANCE_BUDGETS.MEMORY_BUDGET_MB) {
    warnings.push(
      `Document may use ~${estimatedMemoryMB.toFixed(
        1
      )}MB of memory, exceeding budget of ${
        PERFORMANCE_BUDGETS.MEMORY_BUDGET_MB
      }MB`
    );
  }

  return {
    withinBudget: warnings.length === 0,
    warnings,
    metrics: {
      nodeCount,
      artboardCount: document.artboards.length,
      maxNestingDepth,
      estimatedMemoryMB,
    },
  };
}

/**
 * Validate document with performance budget checks
 */
export function validateDocumentWithPerformance(doc: unknown): {
  success: boolean;
  data?: CanvasDocumentType;
  errors?: string[];
  migrated?: boolean;
  performance?: {
    withinBudget: boolean;
    warnings: string[];
    metrics: {
      nodeCount: number;
      artboardCount: number;
      maxNestingDepth: number;
      estimatedMemoryMB: number;
    };
  };
} {
  const validation = validateDocument(doc);

  if (!validation.success) {
    return validation;
  }

  const performance = checkDocumentPerformance(validation.data!);

  return {
    ...validation,
    performance,
  };
}
