/**
 * @fileoverview Canvas Schema - TypeScript types and validation for Designer canvas documents
 * @author @darianrosebrook
 *
 * Core schema definitions for canvas documents, nodes, and validation.
 * Provides Zod schemas for type-safe document manipulation and Ajv validation.
 */
import { z } from "zod";
export { generateNodeId, generateNodeIds, isValidUlid, getUlidTimestamp, isUlidInTimeRange, } from "./ulid.js";
/**
 * ULID validation - 26 character string with specific alphabet
 */
export declare const ULID: z.ZodString;
/**
 * Semantic key pattern for stable node identification
 * Uses dot notation for hierarchy (e.g., 'hero.title', 'nav.items[0]')
 */
export declare const SemanticKey: z.ZodOptional<z.ZodString>;
/**
 * Rectangle geometry type
 */
export declare const Rect: z.ZodObject<{
    x: z.ZodNumber;
    y: z.ZodNumber;
    width: z.ZodNumber;
    height: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    x: number;
    y: number;
    width: number;
    height: number;
}, {
    x: number;
    y: number;
    width: number;
    height: number;
}>;
/**
 * Text styling properties
 */
export declare const TextStyle: z.ZodObject<{
    family: z.ZodOptional<z.ZodString>;
    size: z.ZodOptional<z.ZodNumber>;
    lineHeight: z.ZodOptional<z.ZodNumber>;
    weight: z.ZodOptional<z.ZodString>;
    letterSpacing: z.ZodOptional<z.ZodNumber>;
    color: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    size?: number | undefined;
    color?: string | undefined;
    family?: string | undefined;
    lineHeight?: number | undefined;
    weight?: string | undefined;
    letterSpacing?: number | undefined;
}, {
    size?: number | undefined;
    color?: string | undefined;
    family?: string | undefined;
    lineHeight?: number | undefined;
    weight?: string | undefined;
    letterSpacing?: number | undefined;
}>;
/**
 * Style properties for visual elements
 */
export declare const Style: z.ZodObject<{
    fills: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    strokes: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    radius: z.ZodOptional<z.ZodNumber>;
    opacity: z.ZodOptional<z.ZodNumber>;
    shadow: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    fills?: any[] | undefined;
    strokes?: any[] | undefined;
    radius?: number | undefined;
    opacity?: number | undefined;
    shadow?: any;
}, {
    fills?: any[] | undefined;
    strokes?: any[] | undefined;
    radius?: number | undefined;
    opacity?: number | undefined;
    shadow?: any;
}>;
/**
 * Base node properties shared by all node types
 */
declare const BaseNode: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodString;
    name: z.ZodString;
    visible: z.ZodDefault<z.ZodBoolean>;
    frame: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        width: number;
        height: number;
    }, {
        x: number;
        y: number;
        width: number;
        height: number;
    }>;
    style: z.ZodOptional<z.ZodObject<{
        fills: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        strokes: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        radius: z.ZodOptional<z.ZodNumber>;
        opacity: z.ZodOptional<z.ZodNumber>;
        shadow: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        fills?: any[] | undefined;
        strokes?: any[] | undefined;
        radius?: number | undefined;
        opacity?: number | undefined;
        shadow?: any;
    }, {
        fills?: any[] | undefined;
        strokes?: any[] | undefined;
        radius?: number | undefined;
        opacity?: number | undefined;
        shadow?: any;
    }>>;
    data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    bind: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    type: string;
    visible: boolean;
    id: string;
    name: string;
    frame: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    style?: {
        fills?: any[] | undefined;
        strokes?: any[] | undefined;
        radius?: number | undefined;
        opacity?: number | undefined;
        shadow?: any;
    } | undefined;
    data?: Record<string, any> | undefined;
    bind?: any;
}, {
    type: string;
    id: string;
    name: string;
    frame: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    style?: {
        fills?: any[] | undefined;
        strokes?: any[] | undefined;
        radius?: number | undefined;
        opacity?: number | undefined;
        shadow?: any;
    } | undefined;
    visible?: boolean | undefined;
    data?: Record<string, any> | undefined;
    bind?: any;
}>;
/**
 * Text node type
 */
export declare const TextNode: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    visible: z.ZodDefault<z.ZodBoolean>;
    frame: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        width: number;
        height: number;
    }, {
        x: number;
        y: number;
        width: number;
        height: number;
    }>;
    style: z.ZodOptional<z.ZodObject<{
        fills: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        strokes: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        radius: z.ZodOptional<z.ZodNumber>;
        opacity: z.ZodOptional<z.ZodNumber>;
        shadow: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        fills?: any[] | undefined;
        strokes?: any[] | undefined;
        radius?: number | undefined;
        opacity?: number | undefined;
        shadow?: any;
    }, {
        fills?: any[] | undefined;
        strokes?: any[] | undefined;
        radius?: number | undefined;
        opacity?: number | undefined;
        shadow?: any;
    }>>;
    data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    bind: z.ZodOptional<z.ZodAny>;
} & {
    type: z.ZodLiteral<"text">;
    text: z.ZodString;
    textStyle: z.ZodOptional<z.ZodObject<{
        family: z.ZodOptional<z.ZodString>;
        size: z.ZodOptional<z.ZodNumber>;
        lineHeight: z.ZodOptional<z.ZodNumber>;
        weight: z.ZodOptional<z.ZodString>;
        letterSpacing: z.ZodOptional<z.ZodNumber>;
        color: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        size?: number | undefined;
        color?: string | undefined;
        family?: string | undefined;
        lineHeight?: number | undefined;
        weight?: string | undefined;
        letterSpacing?: number | undefined;
    }, {
        size?: number | undefined;
        color?: string | undefined;
        family?: string | undefined;
        lineHeight?: number | undefined;
        weight?: string | undefined;
        letterSpacing?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    type: "text";
    text: string;
    visible: boolean;
    id: string;
    name: string;
    frame: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    style?: {
        fills?: any[] | undefined;
        strokes?: any[] | undefined;
        radius?: number | undefined;
        opacity?: number | undefined;
        shadow?: any;
    } | undefined;
    data?: Record<string, any> | undefined;
    bind?: any;
    textStyle?: {
        size?: number | undefined;
        color?: string | undefined;
        family?: string | undefined;
        lineHeight?: number | undefined;
        weight?: string | undefined;
        letterSpacing?: number | undefined;
    } | undefined;
}, {
    type: "text";
    text: string;
    id: string;
    name: string;
    frame: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    style?: {
        fills?: any[] | undefined;
        strokes?: any[] | undefined;
        radius?: number | undefined;
        opacity?: number | undefined;
        shadow?: any;
    } | undefined;
    visible?: boolean | undefined;
    data?: Record<string, any> | undefined;
    bind?: any;
    textStyle?: {
        size?: number | undefined;
        color?: string | undefined;
        family?: string | undefined;
        lineHeight?: number | undefined;
        weight?: string | undefined;
        letterSpacing?: number | undefined;
    } | undefined;
}>;
/**
 * Frame node type (container for other nodes)
 */
export declare const FrameNode: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    visible: z.ZodDefault<z.ZodBoolean>;
    frame: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        width: number;
        height: number;
    }, {
        x: number;
        y: number;
        width: number;
        height: number;
    }>;
    style: z.ZodOptional<z.ZodObject<{
        fills: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        strokes: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        radius: z.ZodOptional<z.ZodNumber>;
        opacity: z.ZodOptional<z.ZodNumber>;
        shadow: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        fills?: any[] | undefined;
        strokes?: any[] | undefined;
        radius?: number | undefined;
        opacity?: number | undefined;
        shadow?: any;
    }, {
        fills?: any[] | undefined;
        strokes?: any[] | undefined;
        radius?: number | undefined;
        opacity?: number | undefined;
        shadow?: any;
    }>>;
    data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    bind: z.ZodOptional<z.ZodAny>;
} & {
    type: z.ZodLiteral<"frame">;
    layout: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    children: z.ZodDefault<z.ZodLazy<z.ZodArray<z.ZodType<any, z.ZodTypeDef, any>, "many">>>;
}, "strip", z.ZodTypeAny, {
    children: any[];
    type: "frame";
    visible: boolean;
    id: string;
    name: string;
    frame: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    style?: {
        fills?: any[] | undefined;
        strokes?: any[] | undefined;
        radius?: number | undefined;
        opacity?: number | undefined;
        shadow?: any;
    } | undefined;
    data?: Record<string, any> | undefined;
    bind?: any;
    layout?: Record<string, any> | undefined;
}, {
    type: "frame";
    id: string;
    name: string;
    frame: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    children?: any[] | undefined;
    style?: {
        fills?: any[] | undefined;
        strokes?: any[] | undefined;
        radius?: number | undefined;
        opacity?: number | undefined;
        shadow?: any;
    } | undefined;
    visible?: boolean | undefined;
    data?: Record<string, any> | undefined;
    bind?: any;
    layout?: Record<string, any> | undefined;
}>;
/**
 * Component instance node type (references external components)
 */
export declare const ComponentInstanceNode: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    visible: z.ZodDefault<z.ZodBoolean>;
    frame: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        width: number;
        height: number;
    }, {
        x: number;
        y: number;
        width: number;
        height: number;
    }>;
    style: z.ZodOptional<z.ZodObject<{
        fills: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        strokes: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        radius: z.ZodOptional<z.ZodNumber>;
        opacity: z.ZodOptional<z.ZodNumber>;
        shadow: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        fills?: any[] | undefined;
        strokes?: any[] | undefined;
        radius?: number | undefined;
        opacity?: number | undefined;
        shadow?: any;
    }, {
        fills?: any[] | undefined;
        strokes?: any[] | undefined;
        radius?: number | undefined;
        opacity?: number | undefined;
        shadow?: any;
    }>>;
    data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    bind: z.ZodOptional<z.ZodAny>;
} & {
    type: z.ZodLiteral<"component">;
    componentKey: z.ZodString;
    props: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    type: "component";
    visible: boolean;
    id: string;
    name: string;
    frame: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    componentKey: string;
    props: Record<string, any>;
    style?: {
        fills?: any[] | undefined;
        strokes?: any[] | undefined;
        radius?: number | undefined;
        opacity?: number | undefined;
        shadow?: any;
    } | undefined;
    data?: Record<string, any> | undefined;
    bind?: any;
}, {
    type: "component";
    id: string;
    name: string;
    frame: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    componentKey: string;
    style?: {
        fills?: any[] | undefined;
        strokes?: any[] | undefined;
        radius?: number | undefined;
        opacity?: number | undefined;
        shadow?: any;
    } | undefined;
    visible?: boolean | undefined;
    data?: Record<string, any> | undefined;
    bind?: any;
    props?: Record<string, any> | undefined;
}>;
/**
 * Union type for all possible node types
 */
export declare const Node: z.ZodType<any>;
/**
 * Artboard definition
 */
export declare const Artboard: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    frame: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        width: number;
        height: number;
    }, {
        x: number;
        y: number;
        width: number;
        height: number;
    }>;
    children: z.ZodDefault<z.ZodArray<z.ZodType<any, z.ZodTypeDef, any>, "many">>;
}, "strip", z.ZodTypeAny, {
    children: any[];
    id: string;
    name: string;
    frame: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}, {
    id: string;
    name: string;
    frame: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    children?: any[] | undefined;
}>;
/**
 * Complete canvas document
 */
export declare const CanvasDocument: z.ZodObject<{
    schemaVersion: z.ZodLiteral<"0.1.0">;
    id: z.ZodString;
    name: z.ZodString;
    artboards: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        frame: z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
            width: z.ZodNumber;
            height: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            x: number;
            y: number;
            width: number;
            height: number;
        }, {
            x: number;
            y: number;
            width: number;
            height: number;
        }>;
        children: z.ZodDefault<z.ZodArray<z.ZodType<any, z.ZodTypeDef, any>, "many">>;
    }, "strip", z.ZodTypeAny, {
        children: any[];
        id: string;
        name: string;
        frame: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
    }, {
        id: string;
        name: string;
        frame: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
        children?: any[] | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    schemaVersion: "0.1.0";
    artboards: {
        children: any[];
        id: string;
        name: string;
        frame: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
    }[];
}, {
    id: string;
    name: string;
    schemaVersion: "0.1.0";
    artboards: {
        id: string;
        name: string;
        frame: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
        children?: any[] | undefined;
    }[];
}>;
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
/**
 * JSON Patch operation for document mutations
 */
export declare const Patch: z.ZodObject<{
    path: z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNumber]>, "many">;
    op: z.ZodEnum<["set", "insert", "remove"]>;
    value: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    path: (string | number)[];
    op: "set" | "insert" | "remove";
    value?: any;
}, {
    path: (string | number)[];
    op: "set" | "insert" | "remove";
    value?: any;
}>;
export type PatchType = z.infer<typeof Patch>;
/**
 * Schema validation function
 * @param doc Document to validate
 * @returns Validation result with parsed document or errors
 */
export declare function validateDocument(doc: unknown): {
    success: boolean;
    data?: CanvasDocumentType;
    errors?: string[];
};
/**
 * Alias for validateDocument for backwards compatibility
 */
export declare const validateCanvasDocument: typeof validateDocument;
/**
 * Generate a new ULID for nodes
 * @returns A new ULID string
 */
export declare function generateULID(): string;
/**
 * Canonical JSON serialization
 * @param obj Object to serialize
 * @returns Deterministic JSON string
 */
export declare function canonicalSerialize(obj: any): string;
//# sourceMappingURL=index.d.ts.map