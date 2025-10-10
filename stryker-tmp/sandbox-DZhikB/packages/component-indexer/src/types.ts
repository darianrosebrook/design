/**
 * @fileoverview Component index types for Designer
 * @author @darianrosebrook
 */

import { z } from "zod";

/**
 * Component property definition
 */
export const ComponentPropSchema = z.object({
  name: z.string(),
  type: z.string(),
  required: z.boolean(),
  defaultValue: z
    .union([
      z.string(),
      z.number(),
      z.boolean(),
      z.record(z.unknown()),
      z.null(),
    ])
    .optional(),
  description: z.string().optional(),
  design: z
    .object({
      control: z
        .enum(["text", "select", "color", "number", "boolean"])
        .optional(),
      options: z.array(z.string()).optional(),
    })
    .optional(),
  passthrough: z
    .object({
      attributes: z.array(z.string()).optional(),
      cssVars: z.array(z.string()).optional(),
      events: z.array(z.string()).optional(),
      children: z.boolean().optional(),
      ariaLabel: z.boolean().optional(),
    })
    .optional(),
});

export type ComponentProp = z.infer<typeof ComponentPropSchema>;

/**
 * Semantic key mapping for component contracts
 */
export const SemanticKeyMappingSchema = z.object({
  description: z.string().optional(),
  priority: z.number().min(0).max(10).optional(),
  propDefaults: z.record(z.unknown()).optional(),
});

/**
 * Component metadata entry
 */
export const ComponentEntrySchema = z.object({
  id: z.string().regex(/^[a-z0-9\-]{10,}$/),
  name: z.string(),
  modulePath: z.string(),
  export: z.string(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  semanticKeys: z.record(SemanticKeyMappingSchema).optional(),
  props: z.array(ComponentPropSchema),
  variants: z.array(z.record(z.unknown())).optional(),
  examples: z.array(z.string()).optional(),
  // Compound component support
  parent: z.string().optional(), // Parent component name (e.g., "Card" for "Card.Header")
  isCompound: z.boolean().optional(), // True if this is a compound component
  compoundChildren: z.array(z.string()).optional(), // IDs of child compounds
});

export type ComponentEntry = z.infer<typeof ComponentEntrySchema>;

/**
 * Source configuration for component discovery
 */
export const ComponentSourceSchema = z.object({
  root: z.string(),
  resolver: z.enum(["tsconfig", "custom", "manual"]),
  include: z.array(z.string()).optional(),
  exclude: z.array(z.string()).optional(),
});

export type ComponentSource = z.infer<typeof ComponentSourceSchema>;

/**
 * Complete component index document
 */
export const ComponentIndexSchema = z.object({
  version: z.literal("1.0.0"),
  generatedAt: z.string().datetime(),
  source: ComponentSourceSchema,
  components: z.array(ComponentEntrySchema),
});

export type ComponentIndex = z.infer<typeof ComponentIndexSchema>;

/**
 * Discovery options for component scanning
 */
export interface DiscoveryOptions {
  rootDir: string;
  tsconfigPath?: string;
  include?: string[];
  exclude?: string[];
  followSymlinks?: boolean;
  maxDepth?: number;
}

/**
 * Component discovery result
 */
export interface DiscoveryResult {
  components: ComponentEntry[];
  errors: Array<{ file: string; error: string }>;
  stats: {
    filesScanned: number;
    componentsFound: number;
    duration: number;
  };
}

/**
 * Raw component metadata extracted from TypeScript
 */
export interface RawComponentMetadata {
  name: string;
  filePath: string;
  exportName: string;
  props: Array<{
    name: string;
    type: string;
    required: boolean;
    defaultValue?: unknown;
    description?: string;
    designTags?: Record<string, string>;
  }>;
  jsDocTags?: Record<string, string>;
}
