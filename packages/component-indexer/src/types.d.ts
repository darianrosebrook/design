/**
 * @fileoverview Component index types for Designer
 * @author @darianrosebrook
 */
import { z } from "zod";
/**
 * Component property definition
 */
export declare const ComponentPropSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodString;
    required: z.ZodBoolean;
    defaultValue: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodNull]>>;
    description: z.ZodOptional<z.ZodString>;
    design: z.ZodOptional<z.ZodObject<{
        control: z.ZodOptional<z.ZodEnum<["text", "select", "color", "number", "boolean"]>>;
        options: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        options?: string[] | undefined;
        control?: "number" | "boolean" | "color" | "text" | "select" | undefined;
    }, {
        options?: string[] | undefined;
        control?: "number" | "boolean" | "color" | "text" | "select" | undefined;
    }>>;
    passthrough: z.ZodOptional<z.ZodObject<{
        attributes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        cssVars: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        events: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        children: z.ZodOptional<z.ZodBoolean>;
        ariaLabel: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        children?: boolean | undefined;
        attributes?: string[] | undefined;
        cssVars?: string[] | undefined;
        events?: string[] | undefined;
        ariaLabel?: boolean | undefined;
    }, {
        children?: boolean | undefined;
        attributes?: string[] | undefined;
        cssVars?: string[] | undefined;
        events?: string[] | undefined;
        ariaLabel?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    type: string;
    name: string;
    required: boolean;
    passthrough?: {
        children?: boolean | undefined;
        attributes?: string[] | undefined;
        cssVars?: string[] | undefined;
        events?: string[] | undefined;
        ariaLabel?: boolean | undefined;
    } | undefined;
    defaultValue?: string | number | boolean | Record<string, unknown> | null | undefined;
    description?: string | undefined;
    design?: {
        options?: string[] | undefined;
        control?: "number" | "boolean" | "color" | "text" | "select" | undefined;
    } | undefined;
}, {
    type: string;
    name: string;
    required: boolean;
    passthrough?: {
        children?: boolean | undefined;
        attributes?: string[] | undefined;
        cssVars?: string[] | undefined;
        events?: string[] | undefined;
        ariaLabel?: boolean | undefined;
    } | undefined;
    defaultValue?: string | number | boolean | Record<string, unknown> | null | undefined;
    description?: string | undefined;
    design?: {
        options?: string[] | undefined;
        control?: "number" | "boolean" | "color" | "text" | "select" | undefined;
    } | undefined;
}>;
export type ComponentProp = z.infer<typeof ComponentPropSchema>;
/**
 * Semantic key mapping for component contracts
 */
export declare const SemanticKeyMappingSchema: z.ZodObject<{
    description: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodNumber>;
    propDefaults: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    description?: string | undefined;
    priority?: number | undefined;
    propDefaults?: Record<string, unknown> | undefined;
}, {
    description?: string | undefined;
    priority?: number | undefined;
    propDefaults?: Record<string, unknown> | undefined;
}>;
/**
 * Component metadata entry
 */
export declare const ComponentEntrySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    modulePath: z.ZodString;
    export: z.ZodString;
    category: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    semanticKeys: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        description: z.ZodOptional<z.ZodString>;
        priority: z.ZodOptional<z.ZodNumber>;
        propDefaults: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        description?: string | undefined;
        priority?: number | undefined;
        propDefaults?: Record<string, unknown> | undefined;
    }, {
        description?: string | undefined;
        priority?: number | undefined;
        propDefaults?: Record<string, unknown> | undefined;
    }>>>;
    props: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodString;
        required: z.ZodBoolean;
        defaultValue: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodNull]>>;
        description: z.ZodOptional<z.ZodString>;
        design: z.ZodOptional<z.ZodObject<{
            control: z.ZodOptional<z.ZodEnum<["text", "select", "color", "number", "boolean"]>>;
            options: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            options?: string[] | undefined;
            control?: "number" | "boolean" | "color" | "text" | "select" | undefined;
        }, {
            options?: string[] | undefined;
            control?: "number" | "boolean" | "color" | "text" | "select" | undefined;
        }>>;
        passthrough: z.ZodOptional<z.ZodObject<{
            attributes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            cssVars: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            events: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            children: z.ZodOptional<z.ZodBoolean>;
            ariaLabel: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            children?: boolean | undefined;
            attributes?: string[] | undefined;
            cssVars?: string[] | undefined;
            events?: string[] | undefined;
            ariaLabel?: boolean | undefined;
        }, {
            children?: boolean | undefined;
            attributes?: string[] | undefined;
            cssVars?: string[] | undefined;
            events?: string[] | undefined;
            ariaLabel?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        name: string;
        required: boolean;
        passthrough?: {
            children?: boolean | undefined;
            attributes?: string[] | undefined;
            cssVars?: string[] | undefined;
            events?: string[] | undefined;
            ariaLabel?: boolean | undefined;
        } | undefined;
        defaultValue?: string | number | boolean | Record<string, unknown> | null | undefined;
        description?: string | undefined;
        design?: {
            options?: string[] | undefined;
            control?: "number" | "boolean" | "color" | "text" | "select" | undefined;
        } | undefined;
    }, {
        type: string;
        name: string;
        required: boolean;
        passthrough?: {
            children?: boolean | undefined;
            attributes?: string[] | undefined;
            cssVars?: string[] | undefined;
            events?: string[] | undefined;
            ariaLabel?: boolean | undefined;
        } | undefined;
        defaultValue?: string | number | boolean | Record<string, unknown> | null | undefined;
        description?: string | undefined;
        design?: {
            options?: string[] | undefined;
            control?: "number" | "boolean" | "color" | "text" | "select" | undefined;
        } | undefined;
    }>, "many">;
    variants: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>, "many">>;
    examples: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    props: {
        type: string;
        name: string;
        required: boolean;
        passthrough?: {
            children?: boolean | undefined;
            attributes?: string[] | undefined;
            cssVars?: string[] | undefined;
            events?: string[] | undefined;
            ariaLabel?: boolean | undefined;
        } | undefined;
        defaultValue?: string | number | boolean | Record<string, unknown> | null | undefined;
        description?: string | undefined;
        design?: {
            options?: string[] | undefined;
            control?: "number" | "boolean" | "color" | "text" | "select" | undefined;
        } | undefined;
    }[];
    modulePath: string;
    export: string;
    category?: string | undefined;
    tags?: string[] | undefined;
    semanticKeys?: Record<string, {
        description?: string | undefined;
        priority?: number | undefined;
        propDefaults?: Record<string, unknown> | undefined;
    }> | undefined;
    variants?: Record<string, unknown>[] | undefined;
    examples?: string[] | undefined;
}, {
    id: string;
    name: string;
    props: {
        type: string;
        name: string;
        required: boolean;
        passthrough?: {
            children?: boolean | undefined;
            attributes?: string[] | undefined;
            cssVars?: string[] | undefined;
            events?: string[] | undefined;
            ariaLabel?: boolean | undefined;
        } | undefined;
        defaultValue?: string | number | boolean | Record<string, unknown> | null | undefined;
        description?: string | undefined;
        design?: {
            options?: string[] | undefined;
            control?: "number" | "boolean" | "color" | "text" | "select" | undefined;
        } | undefined;
    }[];
    modulePath: string;
    export: string;
    category?: string | undefined;
    tags?: string[] | undefined;
    semanticKeys?: Record<string, {
        description?: string | undefined;
        priority?: number | undefined;
        propDefaults?: Record<string, unknown> | undefined;
    }> | undefined;
    variants?: Record<string, unknown>[] | undefined;
    examples?: string[] | undefined;
}>;
export type ComponentEntry = z.infer<typeof ComponentEntrySchema>;
/**
 * Source configuration for component discovery
 */
export declare const ComponentSourceSchema: z.ZodObject<{
    root: z.ZodString;
    resolver: z.ZodEnum<["tsconfig", "custom", "manual"]>;
    include: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    exclude: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    root: string;
    resolver: "custom" | "tsconfig" | "manual";
    include?: string[] | undefined;
    exclude?: string[] | undefined;
}, {
    root: string;
    resolver: "custom" | "tsconfig" | "manual";
    include?: string[] | undefined;
    exclude?: string[] | undefined;
}>;
export type ComponentSource = z.infer<typeof ComponentSourceSchema>;
/**
 * Complete component index document
 */
export declare const ComponentIndexSchema: z.ZodObject<{
    version: z.ZodLiteral<"1.0.0">;
    generatedAt: z.ZodString;
    source: z.ZodObject<{
        root: z.ZodString;
        resolver: z.ZodEnum<["tsconfig", "custom", "manual"]>;
        include: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        exclude: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        root: string;
        resolver: "custom" | "tsconfig" | "manual";
        include?: string[] | undefined;
        exclude?: string[] | undefined;
    }, {
        root: string;
        resolver: "custom" | "tsconfig" | "manual";
        include?: string[] | undefined;
        exclude?: string[] | undefined;
    }>;
    components: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        modulePath: z.ZodString;
        export: z.ZodString;
        category: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        semanticKeys: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
            description: z.ZodOptional<z.ZodString>;
            priority: z.ZodOptional<z.ZodNumber>;
            propDefaults: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        }, "strip", z.ZodTypeAny, {
            description?: string | undefined;
            priority?: number | undefined;
            propDefaults?: Record<string, unknown> | undefined;
        }, {
            description?: string | undefined;
            priority?: number | undefined;
            propDefaults?: Record<string, unknown> | undefined;
        }>>>;
        props: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            type: z.ZodString;
            required: z.ZodBoolean;
            defaultValue: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodNull]>>;
            description: z.ZodOptional<z.ZodString>;
            design: z.ZodOptional<z.ZodObject<{
                control: z.ZodOptional<z.ZodEnum<["text", "select", "color", "number", "boolean"]>>;
                options: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                options?: string[] | undefined;
                control?: "number" | "boolean" | "color" | "text" | "select" | undefined;
            }, {
                options?: string[] | undefined;
                control?: "number" | "boolean" | "color" | "text" | "select" | undefined;
            }>>;
            passthrough: z.ZodOptional<z.ZodObject<{
                attributes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                cssVars: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                events: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                children: z.ZodOptional<z.ZodBoolean>;
                ariaLabel: z.ZodOptional<z.ZodBoolean>;
            }, "strip", z.ZodTypeAny, {
                children?: boolean | undefined;
                attributes?: string[] | undefined;
                cssVars?: string[] | undefined;
                events?: string[] | undefined;
                ariaLabel?: boolean | undefined;
            }, {
                children?: boolean | undefined;
                attributes?: string[] | undefined;
                cssVars?: string[] | undefined;
                events?: string[] | undefined;
                ariaLabel?: boolean | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            name: string;
            required: boolean;
            passthrough?: {
                children?: boolean | undefined;
                attributes?: string[] | undefined;
                cssVars?: string[] | undefined;
                events?: string[] | undefined;
                ariaLabel?: boolean | undefined;
            } | undefined;
            defaultValue?: string | number | boolean | Record<string, unknown> | null | undefined;
            description?: string | undefined;
            design?: {
                options?: string[] | undefined;
                control?: "number" | "boolean" | "color" | "text" | "select" | undefined;
            } | undefined;
        }, {
            type: string;
            name: string;
            required: boolean;
            passthrough?: {
                children?: boolean | undefined;
                attributes?: string[] | undefined;
                cssVars?: string[] | undefined;
                events?: string[] | undefined;
                ariaLabel?: boolean | undefined;
            } | undefined;
            defaultValue?: string | number | boolean | Record<string, unknown> | null | undefined;
            description?: string | undefined;
            design?: {
                options?: string[] | undefined;
                control?: "number" | "boolean" | "color" | "text" | "select" | undefined;
            } | undefined;
        }>, "many">;
        variants: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>, "many">>;
        examples: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        props: {
            type: string;
            name: string;
            required: boolean;
            passthrough?: {
                children?: boolean | undefined;
                attributes?: string[] | undefined;
                cssVars?: string[] | undefined;
                events?: string[] | undefined;
                ariaLabel?: boolean | undefined;
            } | undefined;
            defaultValue?: string | number | boolean | Record<string, unknown> | null | undefined;
            description?: string | undefined;
            design?: {
                options?: string[] | undefined;
                control?: "number" | "boolean" | "color" | "text" | "select" | undefined;
            } | undefined;
        }[];
        modulePath: string;
        export: string;
        category?: string | undefined;
        tags?: string[] | undefined;
        semanticKeys?: Record<string, {
            description?: string | undefined;
            priority?: number | undefined;
            propDefaults?: Record<string, unknown> | undefined;
        }> | undefined;
        variants?: Record<string, unknown>[] | undefined;
        examples?: string[] | undefined;
    }, {
        id: string;
        name: string;
        props: {
            type: string;
            name: string;
            required: boolean;
            passthrough?: {
                children?: boolean | undefined;
                attributes?: string[] | undefined;
                cssVars?: string[] | undefined;
                events?: string[] | undefined;
                ariaLabel?: boolean | undefined;
            } | undefined;
            defaultValue?: string | number | boolean | Record<string, unknown> | null | undefined;
            description?: string | undefined;
            design?: {
                options?: string[] | undefined;
                control?: "number" | "boolean" | "color" | "text" | "select" | undefined;
            } | undefined;
        }[];
        modulePath: string;
        export: string;
        category?: string | undefined;
        tags?: string[] | undefined;
        semanticKeys?: Record<string, {
            description?: string | undefined;
            priority?: number | undefined;
            propDefaults?: Record<string, unknown> | undefined;
        }> | undefined;
        variants?: Record<string, unknown>[] | undefined;
        examples?: string[] | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    version: "1.0.0";
    generatedAt: string;
    source: {
        root: string;
        resolver: "custom" | "tsconfig" | "manual";
        include?: string[] | undefined;
        exclude?: string[] | undefined;
    };
    components: {
        id: string;
        name: string;
        props: {
            type: string;
            name: string;
            required: boolean;
            passthrough?: {
                children?: boolean | undefined;
                attributes?: string[] | undefined;
                cssVars?: string[] | undefined;
                events?: string[] | undefined;
                ariaLabel?: boolean | undefined;
            } | undefined;
            defaultValue?: string | number | boolean | Record<string, unknown> | null | undefined;
            description?: string | undefined;
            design?: {
                options?: string[] | undefined;
                control?: "number" | "boolean" | "color" | "text" | "select" | undefined;
            } | undefined;
        }[];
        modulePath: string;
        export: string;
        category?: string | undefined;
        tags?: string[] | undefined;
        semanticKeys?: Record<string, {
            description?: string | undefined;
            priority?: number | undefined;
            propDefaults?: Record<string, unknown> | undefined;
        }> | undefined;
        variants?: Record<string, unknown>[] | undefined;
        examples?: string[] | undefined;
    }[];
}, {
    version: "1.0.0";
    generatedAt: string;
    source: {
        root: string;
        resolver: "custom" | "tsconfig" | "manual";
        include?: string[] | undefined;
        exclude?: string[] | undefined;
    };
    components: {
        id: string;
        name: string;
        props: {
            type: string;
            name: string;
            required: boolean;
            passthrough?: {
                children?: boolean | undefined;
                attributes?: string[] | undefined;
                cssVars?: string[] | undefined;
                events?: string[] | undefined;
                ariaLabel?: boolean | undefined;
            } | undefined;
            defaultValue?: string | number | boolean | Record<string, unknown> | null | undefined;
            description?: string | undefined;
            design?: {
                options?: string[] | undefined;
                control?: "number" | "boolean" | "color" | "text" | "select" | undefined;
            } | undefined;
        }[];
        modulePath: string;
        export: string;
        category?: string | undefined;
        tags?: string[] | undefined;
        semanticKeys?: Record<string, {
            description?: string | undefined;
            priority?: number | undefined;
            propDefaults?: Record<string, unknown> | undefined;
        }> | undefined;
        variants?: Record<string, unknown>[] | undefined;
        examples?: string[] | undefined;
    }[];
}>;
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
    errors: Array<{
        file: string;
        error: string;
    }>;
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
//# sourceMappingURL=types.d.ts.map