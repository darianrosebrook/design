/**
 * @fileoverview Core TypeScript types for Designer canvas documents
 * @author @darianrosebrook
 *
 * These types are generated from the JSON Schema and provide runtime validation
 * and type safety for canvas document operations.
 */
import { z } from "zod";
/**
 * ULID (Universally Unique Lexicographically Sortable Identifier)
 * 26-character string that is lexicographically sortable and collision-resistant
 */
export declare const ULID: z.ZodString;
/**
 * Semantic key pattern for stable node identification
 * Uses dot notation for hierarchy (e.g., 'hero.title', 'nav.items[0]')
 */
export declare const SemanticKey: z.ZodOptional<z.ZodString>;
/**
 * Rectangle coordinates for positioning nodes
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
 * Visual styling properties for nodes
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
 * Base properties shared by all node types
 */
export declare const BaseNode: z.ZodObject<{
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
    semanticKey: z.ZodOptional<z.ZodString>;
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
    semanticKey?: string | undefined;
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
    semanticKey?: string | undefined;
}>;
/**
 * Frame node - container for other nodes with layout
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
    semanticKey: z.ZodOptional<z.ZodString>;
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
    semanticKey?: string | undefined;
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
    semanticKey?: string | undefined;
    layout?: Record<string, any> | undefined;
}>;
/**
 * Group node - logical grouping of nodes
 */
export declare const GroupNode: z.ZodObject<{
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
    semanticKey: z.ZodOptional<z.ZodString>;
} & {
    type: z.ZodLiteral<"group">;
    children: z.ZodDefault<z.ZodLazy<z.ZodArray<z.ZodType<any, z.ZodTypeDef, any>, "many">>>;
}, "strip", z.ZodTypeAny, {
    children: any[];
    type: "group";
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
    semanticKey?: string | undefined;
}, {
    type: "group";
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
    semanticKey?: string | undefined;
}>;
/**
 * Vector node - SVG path-based graphics
 */
export declare const VectorNode: z.ZodObject<{
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
    semanticKey: z.ZodOptional<z.ZodString>;
} & {
    type: z.ZodLiteral<"vector">;
    path: z.ZodString;
    windingRule: z.ZodDefault<z.ZodEnum<["nonzero", "evenodd"]>>;
}, "strip", z.ZodTypeAny, {
    type: "vector";
    visible: boolean;
    id: string;
    name: string;
    path: string;
    frame: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    windingRule: "nonzero" | "evenodd";
    style?: {
        fills?: any[] | undefined;
        strokes?: any[] | undefined;
        radius?: number | undefined;
        opacity?: number | undefined;
        shadow?: any;
    } | undefined;
    data?: Record<string, any> | undefined;
    bind?: any;
    semanticKey?: string | undefined;
}, {
    type: "vector";
    id: string;
    name: string;
    path: string;
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
    semanticKey?: string | undefined;
    windingRule?: "nonzero" | "evenodd" | undefined;
}>;
/**
 * Text node - text content with styling
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
    semanticKey: z.ZodOptional<z.ZodString>;
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
    semanticKey?: string | undefined;
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
    semanticKey?: string | undefined;
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
 * Image node - bitmap or vector images
 */
export declare const ImageNode: z.ZodObject<{
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
    semanticKey: z.ZodOptional<z.ZodString>;
} & {
    type: z.ZodLiteral<"image">;
    src: z.ZodString;
    mode: z.ZodDefault<z.ZodEnum<["cover", "contain", "fill", "none"]>>;
}, "strip", z.ZodTypeAny, {
    type: "image";
    visible: boolean;
    id: string;
    name: string;
    frame: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    src: string;
    mode: "none" | "fill" | "cover" | "contain";
    style?: {
        fills?: any[] | undefined;
        strokes?: any[] | undefined;
        radius?: number | undefined;
        opacity?: number | undefined;
        shadow?: any;
    } | undefined;
    data?: Record<string, any> | undefined;
    bind?: any;
    semanticKey?: string | undefined;
}, {
    type: "image";
    id: string;
    name: string;
    frame: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    src: string;
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
    semanticKey?: string | undefined;
    mode?: "none" | "fill" | "cover" | "contain" | undefined;
}>;
/**
 * Component instance node - references to React components
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
    semanticKey: z.ZodOptional<z.ZodString>;
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
    semanticKey?: string | undefined;
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
    semanticKey?: string | undefined;
    props?: Record<string, any> | undefined;
}>;
/**
 * Union type for all possible node types
 */
export declare const Node: z.ZodType<any>;
/**
 * Artboard - a canvas page with its own viewport
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
 * TypeScript types inferred from Zod schemas
 */
export type ULIDType = z.infer<typeof ULID>;
export type SemanticKeyType = z.infer<typeof SemanticKey>;
export type RectType = z.infer<typeof Rect>;
export type TextStyleType = z.infer<typeof TextStyle>;
export type StyleType = z.infer<typeof Style>;
export type BaseNodeType = z.infer<typeof BaseNode>;
export type FrameNodeType = z.infer<typeof FrameNode>;
export type GroupNodeType = z.infer<typeof GroupNode>;
export type VectorNodeType = z.infer<typeof VectorNode>;
export type TextNodeType = z.infer<typeof TextNode>;
export type ImageNodeType = z.infer<typeof ImageNode>;
export type ComponentInstanceNodeType = z.infer<typeof ComponentInstanceNode>;
export type NodeType = z.infer<typeof Node>;
export type ArtboardType = z.infer<typeof Artboard>;
export type CanvasDocumentType = z.infer<typeof CanvasDocument>;
//# sourceMappingURL=types.d.ts.map