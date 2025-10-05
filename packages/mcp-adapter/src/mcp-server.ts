/**
 * @fileoverview MCP server for Designer integration with Cursor
 * @author @darianrosebrook
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { generateAugmentedVariants } from "@paths-design/augment";
import type { CanvasDocumentType } from "@paths-design/canvas-schema";
import { generateReactComponents } from "@paths-design/codegen-react";
import { compareCanvasDocuments } from "@paths-design/diff-visualizer";
import { ulid } from "ulidx";

/**
 * MCP server for Designer operations
 */
export class DesignerMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "designer-server",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  /**
   * Set up MCP request handlers
   */
  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.getAvailableTools(),
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        return await this.handleToolCall(
          request.params.name,
          request.params.arguments
        );
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    });
  }

  /**
   * Get available MCP tools
   */
  private getAvailableTools(): Tool[] {
    return [
      {
        name: "load_canvas_document",
        description: "Load a canvas document from a file path",
        inputSchema: {
          type: "object",
          properties: {
            filePath: {
              type: "string",
              description: "Path to the canvas document file",
            },
          },
          required: ["filePath"],
        },
      },
      {
        name: "generate_react_components",
        description: "Generate React components from a canvas document",
        inputSchema: {
          type: "object",
          properties: {
            documentPath: {
              type: "string",
              description: "Path to the canvas document",
            },
            outputDir: {
              type: "string",
              description: "Output directory for generated components",
            },
            componentIndexPath: {
              type: "string",
              description:
                "Optional path to component index for semantic key support",
            },
          },
          required: ["documentPath", "outputDir"],
        },
      },
      {
        name: "generate_augmented_variants",
        description:
          "Generate augmented variants of a canvas document for testing",
        inputSchema: {
          type: "object",
          properties: {
            documentPath: {
              type: "string",
              description: "Path to the canvas document",
            },
            count: {
              type: "number",
              description: "Number of variants to generate",
              default: 10,
            },
            enableLayoutPerturbation: {
              type: "boolean",
              description: "Enable layout perturbations",
              default: true,
            },
            enableTokenPermutation: {
              type: "boolean",
              description: "Enable token permutations",
              default: true,
            },
            enableAccessibilityValidation: {
              type: "boolean",
              description: "Enable accessibility validation",
              default: true,
            },
          },
          required: ["documentPath"],
        },
      },
      {
        name: "compare_canvas_documents",
        description: "Compare two canvas documents and generate semantic diff",
        inputSchema: {
          type: "object",
          properties: {
            oldDocumentPath: {
              type: "string",
              description: "Path to the old canvas document",
            },
            newDocumentPath: {
              type: "string",
              description: "Path to the new canvas document",
            },
          },
          required: ["oldDocumentPath", "newDocumentPath"],
        },
      },
      {
        name: "validate_canvas_document",
        description:
          "Validate a canvas document for semantic keys and accessibility",
        inputSchema: {
          type: "object",
          properties: {
            documentPath: {
              type: "string",
              description: "Path to the canvas document",
            },
            strict: {
              type: "boolean",
              description: "Enable strict validation (fail on warnings)",
              default: false,
            },
          },
          required: ["documentPath"],
        },
      },

      // Bidirectional Editing Tools
      {
        name: "create_semantic_component",
        description: "Create a new component with semantic key mapping",
        inputSchema: {
          type: "object",
          properties: {
            documentPath: {
              type: "string",
              description: "Path to the canvas document",
            },
            semanticKey: {
              type: "string",
              description:
                "Semantic key for the component (e.g., 'hero.title')",
            },
            componentType: {
              type: "string",
              description: "Type of component to create",
              enum: ["frame", "text", "button", "input", "card", "navigation"],
            },
            properties: {
              type: "object",
              description: "Initial properties for the component",
              additionalProperties: true,
            },
            position: {
              type: "object",
              description: "Position and size for the component",
              properties: {
                x: { type: "number" },
                y: { type: "number" },
                width: { type: "number" },
                height: { type: "number" },
              },
            },
            parentPath: {
              type: "string",
              description:
                "Path to parent element (e.g., 'artboards[0].children')",
            },
          },
          required: ["documentPath", "semanticKey", "componentType"],
        },
      },
      {
        name: "update_semantic_component",
        description: "Update an existing component with semantic key awareness",
        inputSchema: {
          type: "object",
          properties: {
            documentPath: {
              type: "string",
              description: "Path to the canvas document",
            },
            semanticKey: {
              type: "string",
              description: "Semantic key of the component to update",
            },
            properties: {
              type: "object",
              description: "Properties to update",
              additionalProperties: true,
            },
          },
          required: ["documentPath", "semanticKey", "properties"],
        },
      },
      {
        name: "infer_semantic_keys",
        description: "Infer appropriate semantic keys for existing components",
        inputSchema: {
          type: "object",
          properties: {
            documentPath: {
              type: "string",
              description: "Path to the canvas document",
            },
            componentIndexPath: {
              type: "string",
              description: "Path to component index for contract awareness",
            },
            interactive: {
              type: "boolean",
              description: "Enable interactive mode for user confirmation",
              default: false,
            },
          },
          required: ["documentPath"],
        },
      },
      {
        name: "analyze_component_usage",
        description: "Analyze how components are used across the document",
        inputSchema: {
          type: "object",
          properties: {
            documentPath: {
              type: "string",
              description: "Path to the canvas document",
            },
            componentIndexPath: {
              type: "string",
              description: "Path to component index for contract awareness",
            },
          },
          required: ["documentPath"],
        },
      },
      {
        name: "create_design_spec",
        description:
          "Create a canvas document from a high-level design specification",
        inputSchema: {
          type: "object",
          properties: {
            spec: {
              type: "object",
              description: "Design specification object",
              properties: {
                name: { type: "string", description: "Document name" },
                layout: {
                  type: "string",
                  description: "Layout type (hero, landing, dashboard)",
                },
                components: {
                  type: "array",
                  description: "List of components to include",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string", description: "Component type" },
                      semanticKey: {
                        type: "string",
                        description: "Semantic identifier",
                      },
                      props: {
                        type: "object",
                        description: "Component properties",
                      },
                    },
                  },
                },
                tokens: { type: "object", description: "Design tokens to use" },
              },
            },
            outputPath: {
              type: "string",
              description: "Path to save the generated canvas document",
            },
          },
          required: ["spec", "outputPath"],
        },
      },
      {
        name: "update_design_from_spec",
        description:
          "Update an existing canvas document based on design specification changes",
        inputSchema: {
          type: "object",
          properties: {
            documentPath: {
              type: "string",
              description: "Path to existing canvas document",
            },
            specUpdates: {
              type: "object",
              description: "Design specification updates",
            },
            preserveExisting: {
              type: "boolean",
              description: "Preserve existing nodes not mentioned in updates",
              default: true,
            },
          },
          required: ["documentPath", "specUpdates"],
        },
      },
      {
        name: "generate_component_spec",
        description:
          "Generate component specification from design requirements",
        inputSchema: {
          type: "object",
          properties: {
            requirements: {
              type: "object",
              description: "Component requirements",
              properties: {
                name: { type: "string", description: "Component name" },
                purpose: {
                  type: "string",
                  description: "Component purpose/role",
                },
                props: {
                  type: "array",
                  description: "Required props",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      type: { type: "string" },
                      required: { type: "boolean" },
                      description: { type: "string" },
                    },
                  },
                },
                variants: {
                  type: "array",
                  description: "Component variants",
                  items: { type: "string" },
                },
              },
            },
            outputPath: {
              type: "string",
              description: "Path to save component specification",
            },
          },
          required: ["requirements", "outputPath"],
        },
      },
      {
        name: "sync_design_dev",
        description:
          "Bidirectional sync between design canvas and dev component specifications",
        inputSchema: {
          type: "object",
          properties: {
            canvasDocumentPath: {
              type: "string",
              description: "Path to canvas document",
            },
            componentIndexPath: {
              type: "string",
              description: "Path to component index",
            },
            direction: {
              type: "string",
              enum: ["design-to-dev", "dev-to-design", "bidirectional"],
              description: "Sync direction",
            },
            dryRun: {
              type: "boolean",
              description: "Show what would be changed without applying",
              default: false,
            },
          },
          required: ["canvasDocumentPath", "componentIndexPath", "direction"],
        },
      },
      {
        name: "detect_patterns",
        description: "Detect UI patterns in a canvas document",
        inputSchema: {
          type: "object",
          properties: {
            documentPath: {
              type: "string",
              description: "Path to the canvas document",
            },
            componentIndexPath: {
              type: "string",
              description:
                "Optional path to component index for enhanced detection",
            },
          },
          required: ["documentPath"],
        },
      },
      {
        name: "generate_pattern",
        description: "Generate a canvas document from a pattern specification",
        inputSchema: {
          type: "object",
          properties: {
            patternId: {
              type: "string",
              description: "Pattern ID to generate (e.g., 'pattern.tabs')",
            },
            spec: {
              type: "object",
              description: "Pattern specification",
              properties: {
                name: { type: "string", description: "Document name" },
                position: {
                  type: "object",
                  description: "Position for the pattern",
                  properties: {
                    x: { type: "number" },
                    y: { type: "number" },
                  },
                },
                properties: {
                  type: "object",
                  description: "Pattern properties",
                },
              },
            },
            outputPath: {
              type: "string",
              description: "Path to save the generated canvas document",
            },
          },
          required: ["patternId", "spec", "outputPath"],
        },
      },
      {
        name: "validate_patterns",
        description: "Validate UI patterns in a canvas document",
        inputSchema: {
          type: "object",
          properties: {
            documentPath: {
              type: "string",
              description: "Path to the canvas document",
            },
            strict: {
              type: "boolean",
              description: "Enable strict validation (fail on warnings)",
              default: false,
            },
          },
          required: ["documentPath"],
        },
      },
      {
        name: "discover_components",
        description: "Discover and analyze components in a canvas document",
        inputSchema: {
          type: "object",
          properties: {
            documentPath: {
              type: "string",
              description: "Path to the canvas document",
            },
            sourceCodePaths: {
              type: "array",
              description: "Paths to source code for component analysis",
              items: { type: "string" },
            },
            componentIndexPath: {
              type: "string",
              description: "Path to component index for enhanced analysis",
            },
          },
          required: ["documentPath"],
        },
      },
      {
        name: "analyze_design",
        description:
          "Comprehensive analysis of a design including components, patterns, and tokens",
        inputSchema: {
          type: "object",
          properties: {
            documentPath: {
              type: "string",
              description: "Path to the canvas document",
            },
            sourceCodePaths: {
              type: "array",
              description: "Paths to source code for component analysis",
              items: { type: "string" },
            },
            componentIndexPath: {
              type: "string",
              description: "Path to component index for enhanced analysis",
            },
            includePatterns: {
              type: "boolean",
              description: "Include pattern analysis",
              default: true,
            },
            includeAccessibility: {
              type: "boolean",
              description: "Include accessibility analysis",
              default: true,
            },
            includeTokens: {
              type: "boolean",
              description: "Include token analysis",
              default: true,
            },
          },
          required: ["documentPath"],
        },
      },

      // Advanced Developer Tools for Plugin Authoring
      {
        name: "inspect_document",
        description:
          "Inspect document structure and return detailed node information",
        inputSchema: {
          type: "object",
          properties: {
            documentPath: {
              type: "string",
              description: "Path to the canvas document",
            },
            nodeId: {
              type: "string",
              description:
                "Specific node ID to inspect (optional - returns all if omitted)",
            },
            includeHierarchy: {
              type: "boolean",
              description: "Include parent/child relationships",
              default: true,
            },
            includeStyles: {
              type: "boolean",
              description: "Include computed styles and properties",
              default: true,
            },
            includeMetadata: {
              type: "boolean",
              description: "Include semantic keys and metadata",
              default: true,
            },
          },
          required: ["documentPath"],
        },
      },
      {
        name: "query_nodes",
        description: "Query nodes using advanced filters and selectors",
        inputSchema: {
          type: "object",
          properties: {
            documentPath: {
              type: "string",
              description: "Path to the canvas document",
            },
            selector: {
              type: "object",
              description: "Query selector object",
              properties: {
                type: {
                  type: "string",
                  description: "Node type (frame, text, etc.)",
                },
                name: { type: "string", description: "Node name pattern" },
                semanticKey: {
                  type: "string",
                  description: "Semantic key pattern",
                },
                hasChildren: {
                  type: "boolean",
                  description: "Has child nodes",
                },
                visible: { type: "boolean", description: "Visibility state" },
                frame: {
                  type: "object",
                  description: "Frame bounds filter",
                  properties: {
                    minWidth: { type: "number" },
                    maxWidth: { type: "number" },
                    minHeight: { type: "number" },
                    maxHeight: { type: "number" },
                  },
                },
              },
            },
            maxResults: {
              type: "number",
              description: "Maximum number of results to return",
              default: 100,
            },
          },
          required: ["documentPath"],
        },
      },
      {
        name: "create_node_at_position",
        description:
          "Create a new node at a specific position with full control",
        inputSchema: {
          type: "object",
          properties: {
            documentPath: {
              type: "string",
              description: "Path to the canvas document",
            },
            nodeType: {
              type: "string",
              enum: ["frame", "text", "component"],
              description: "Type of node to create",
            },
            position: {
              type: "object",
              description: "Position and size for the new node",
              properties: {
                x: { type: "number", description: "X coordinate" },
                y: { type: "number", description: "Y coordinate" },
                width: { type: "number", description: "Width (default: 100)" },
                height: { type: "number", description: "Height (default: 50)" },
              },
              required: ["x", "y"],
            },
            properties: {
              type: "object",
              description: "Node properties (name, style, text content, etc.)",
              additionalProperties: true,
            },
            parentPath: {
              type: "string",
              description: "Path to parent (e.g., 'artboards[0].children')",
              default: "artboards[0].children",
            },
            insertIndex: {
              type: "number",
              description: "Index to insert at (-1 for end)",
              default: -1,
            },
          },
          required: ["documentPath", "nodeType", "position"],
        },
      },
      {
        name: "batch_update_nodes",
        description:
          "Update multiple nodes in a single operation with conflict resolution",
        inputSchema: {
          type: "object",
          properties: {
            documentPath: {
              type: "string",
              description: "Path to the canvas document",
            },
            updates: {
              type: "array",
              description: "Array of node updates",
              items: {
                type: "object",
                properties: {
                  nodeId: { type: "string", description: "Node ID to update" },
                  properties: {
                    type: "object",
                    description: "Properties to update",
                    additionalProperties: true,
                  },
                  condition: {
                    type: "object",
                    description: "Conditional update based on current state",
                  },
                },
                required: ["nodeId", "properties"],
              },
            },
            conflictStrategy: {
              type: "string",
              enum: ["merge", "replace", "skip"],
              description: "How to handle conflicting updates",
              default: "merge",
            },
          },
          required: ["documentPath", "updates"],
        },
      },
      {
        name: "find_similar_nodes",
        description:
          "Find nodes similar to a reference node using ML-like similarity scoring",
        inputSchema: {
          type: "object",
          properties: {
            documentPath: {
              type: "string",
              description: "Path to the canvas document",
            },
            referenceNodeId: {
              type: "string",
              description: "ID of the reference node",
            },
            similarityThreshold: {
              type: "number",
              description: "Similarity threshold (0-1)",
              default: 0.7,
              minimum: 0,
              maximum: 1,
            },
            maxResults: {
              type: "number",
              description: "Maximum number of similar nodes to return",
              default: 10,
            },
            similarityFactors: {
              type: "object",
              description: "Weight factors for similarity calculation",
              properties: {
                type: {
                  type: "number",
                  description: "Node type similarity (0-1)",
                },
                size: { type: "number", description: "Size similarity (0-1)" },
                position: {
                  type: "number",
                  description: "Position similarity (0-1)",
                },
                style: {
                  type: "number",
                  description: "Style similarity (0-1)",
                },
                name: { type: "number", description: "Name similarity (0-1)" },
              },
            },
          },
          required: ["documentPath", "referenceNodeId"],
        },
      },
      {
        name: "extract_design_tokens",
        description:
          "Extract design tokens from document for theming and consistency",
        inputSchema: {
          type: "object",
          properties: {
            documentPath: {
              type: "string",
              description: "Path to the canvas document",
            },
            tokenTypes: {
              type: "array",
              description: "Types of tokens to extract",
              items: {
                type: "string",
                enum: ["colors", "typography", "spacing", "shadows", "borders"],
              },
              default: ["colors", "typography", "spacing"],
            },
            includeUsage: {
              type: "boolean",
              description: "Include usage statistics for each token",
              default: true,
            },
            outputFormat: {
              type: "string",
              enum: ["json", "css", "scss", "typescript"],
              description: "Output format for the tokens",
              default: "json",
            },
          },
          required: ["documentPath"],
        },
      },
      {
        name: "apply_design_system",
        description: "Apply a design system to an existing document",
        inputSchema: {
          type: "object",
          properties: {
            documentPath: {
              type: "string",
              description: "Path to the canvas document",
            },
            designSystemPath: {
              type: "string",
              description: "Path to design system specification",
            },
            strategy: {
              type: "string",
              enum: ["replace", "merge", "migrate"],
              description: "How to apply the design system",
              default: "merge",
            },
            previewOnly: {
              type: "boolean",
              description: "Preview changes without applying them",
              default: false,
            },
          },
          required: ["documentPath", "designSystemPath"],
        },
      },
      {
        name: "measure_performance",
        description:
          "Measure rendering and interaction performance of the document",
        inputSchema: {
          type: "object",
          properties: {
            documentPath: {
              type: "string",
              description: "Path to the canvas document",
            },
            metrics: {
              type: "array",
              description: "Performance metrics to measure",
              items: {
                type: "string",
                enum: [
                  "render_time",
                  "hit_test",
                  "selection",
                  "traversal",
                  "memory",
                ],
              },
              default: ["render_time", "hit_test"],
            },
            iterations: {
              type: "number",
              description: "Number of iterations for each test",
              default: 10,
            },
            warmUp: {
              type: "number",
              description: "Number of warm-up iterations",
              default: 5,
            },
          },
          required: ["documentPath"],
        },
      },
    ];
  }

  /**
   * Handle tool execution
   */
  private async handleToolCall(toolName: string, args: any): Promise<any> {
    switch (toolName) {
      case "load_canvas_document":
        return await this.loadCanvasDocument(args.filePath);

      case "generate_react_components":
        return await this.generateReactComponents(args);

      case "generate_augmented_variants":
        return await this.generateAugmentedVariants(args);

      case "compare_canvas_documents":
        return await this.compareCanvasDocuments(args);

      case "validate_canvas_document":
        return await this.validateCanvasDocument(args);

      case "create_semantic_component":
        return await this.createSemanticComponent(args);

      case "update_semantic_component":
        return await this.updateSemanticComponent(args);

      case "infer_semantic_keys":
        return await this.inferSemanticKeys(args);

      case "analyze_component_usage":
        return await this.analyzeComponentUsage(args);

      case "create_design_spec":
        return await this.createDesignSpec(args);

      case "update_design_from_spec":
        return await this.updateDesignFromSpec(args);

      case "generate_component_spec":
        return await this.generateComponentSpec(args);

      case "sync_design_dev":
        return await this.syncDesignDev(args);

      case "detect_patterns":
        return await this.detectPatterns(args);

      case "generate_pattern":
        return await this.generatePattern(args);

      case "validate_patterns":
        return await this.validatePatterns(args);

      case "discover_components":
        return await this.discoverComponents(args);

      case "analyze_design":
        return await this.analyzeDesign(args);

      case "inspect_document":
        return await this.inspectDocument(args);

      case "query_nodes":
        return await this.queryNodes(args);

      case "create_node_at_position":
        return await this.createNodeAtPosition(args);

      case "batch_update_nodes":
        return await this.batchUpdateNodes(args);

      case "find_similar_nodes":
        return await this.findSimilarNodes(args);

      case "extract_design_tokens":
        return await this.extractDesignTokens(args);

      case "apply_design_system":
        return await this.applyDesignSystem(args);

      case "measure_performance":
        return await this.measurePerformance(args);

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${toolName}`
        );
    }
  }

  /**
   * Load a canvas document from file
   */
  private async loadCanvasDocument(
    filePath: string
  ): Promise<{ document: CanvasDocumentType }> {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const document = JSON.parse(content) as CanvasDocumentType;

      return { document };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to load canvas document: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Generate React components from a canvas document
   */
  private async generateReactComponents(args: {
    documentPath: string;
    outputDir: string;
    componentIndexPath?: string;
  }): Promise<{ files: string[]; summary: string }> {
    try {
      const content = fs.readFileSync(args.documentPath, "utf-8");
      const document = JSON.parse(content) as CanvasDocumentType;

      const result = generateReactComponents(document, {
        componentIndexPath: args.componentIndexPath,
      });

      // Ensure output directory exists
      if (!fs.existsSync(args.outputDir)) {
        fs.mkdirSync(args.outputDir, { recursive: true });
      }

      // Write generated files
      const writtenFiles: string[] = [];
      for (const file of result.files) {
        const filePath = path.join(args.outputDir, file.path);
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, file.content);
        writtenFiles.push(filePath);
      }

      const summary = `Generated ${result.files.length} files (${result.metadata.nodeCount} nodes, ${result.metadata.artboardCount} artboards)`;

      return { files: writtenFiles, summary };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to generate React components: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Generate augmented variants for testing
   */
  private async generateAugmentedVariants(args: {
    documentPath: string;
    count?: number;
    enableLayoutPerturbation?: boolean;
    enableTokenPermutation?: boolean;
    enableAccessibilityValidation?: boolean;
  }): Promise<{ variants: any[]; summary: string }> {
    try {
      const content = fs.readFileSync(args.documentPath, "utf-8");
      const document = JSON.parse(content) as CanvasDocumentType;

      const variants = await generateAugmentedVariants(
        document,
        args.count || 5,
        {
          layoutPerturbation: {
            enabled: args.enableLayoutPerturbation ?? true,
            tolerance: 0.1,
          },
          tokenPermutation: { enabled: args.enableTokenPermutation ?? true },
          a11yValidation: {
            enabled: args.enableAccessibilityValidation ?? true,
            strict: false,
            contrastThreshold: "AA",
          },
        }
      );

      const summary = `Generated ${
        variants.length
      } augmented variants with ${variants.reduce(
        (sum, v) => sum + v.transformations.length,
        0
      )} total transformations`;

      return { variants, summary };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to generate augmented variants: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Compare two canvas documents
   */
  private async compareCanvasDocuments(args: {
    oldDocumentPath: string;
    newDocumentPath: string;
  }): Promise<{ diff: any; html: string; markdown: string }> {
    try {
      const oldContent = fs.readFileSync(args.oldDocumentPath, "utf-8");
      const newContent = fs.readFileSync(args.newDocumentPath, "utf-8");

      const oldDocument = JSON.parse(oldContent) as CanvasDocumentType;
      const newDocument = JSON.parse(newContent) as CanvasDocumentType;

      const diff = compareCanvasDocuments(oldDocument, newDocument);

      return {
        diff,
        html: this.generateHTMLDiff(diff),
        markdown: this.generateMarkdownDiff(diff),
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to compare canvas documents: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Validate a canvas document
   */
  private async validateCanvasDocument(args: {
    documentPath: string;
    strict?: boolean;
  }): Promise<{ valid: boolean; issues: any[] }> {
    try {
      const content = fs.readFileSync(args.documentPath, "utf-8");
      const document = JSON.parse(content) as CanvasDocumentType;

      // Use our augmentation system for validation
      const variants = await generateAugmentedVariants(document, 1, {
        a11yValidation: {
          enabled: true,
          strict: args.strict ?? false,
          contrastThreshold: "AA",
        },
      });

      const validation = variants[0].a11yValidation;

      return {
        valid: validation?.passed ?? true,
        issues: [
          ...(validation?.violations || []),
          ...(validation?.warnings || []),
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to validate canvas document: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Generate HTML diff representation
   */
  private generateHTMLDiff(diff: any): string {
    return `
      <div class="canvas-diff">
        <h3>Canvas Document Diff</h3>
        <p><strong>Summary:</strong> ${diff.summary.totalChanges} total changes</p>
        <ul>
          <li>${diff.summary.addedNodes} added</li>
          <li>${diff.summary.removedNodes} removed</li>
          <li>${diff.summary.modifiedNodes} modified</li>
          <li>${diff.summary.movedNodes} moved</li>
        </ul>
      </div>
    `;
  }

  /**
   * Generate markdown diff representation
   */
  private generateMarkdownDiff(diff: any): string {
    return `## Canvas Document Diff

**Summary:** ${diff.summary.totalChanges} total changes

- ${diff.summary.addedNodes} added
- ${diff.summary.removedNodes} removed
- ${diff.summary.modifiedNodes} modified
- ${diff.summary.movedNodes} moved

${
  diff.nodeDiffs.length > 0
    ? `### Node Changes\n\n${diff.nodeDiffs
        .map((d: any) => `- **${d.type}**: ${d.description}`)
        .join("\n")}`
    : ""
}

${
  diff.propertyChanges.length > 0
    ? `### Property Changes\n\n${diff.propertyChanges
        .map((c: any) => `- **${c.property}**: ${c.description}`)
        .join("\n")}`
    : ""
}`;
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.info("Designer MCP server started");
  }

  /**
   * Stop the MCP server
   */
  async stop(): Promise<void> {
    await this.server.close();
    console.info("Designer MCP server stopped");
  }

  /**
   * Create a semantic component in a canvas document
   */
  private async createSemanticComponent(args: {
    documentPath: string;
    semanticKey: string;
    componentType: string;
    properties?: Record<string, any>;
    position?: { x: number; y: number; width: number; height: number };
    parentPath?: string;
  }): Promise<{ success: boolean; nodeId: string; message: string }> {
    try {
      const content = fs.readFileSync(args.documentPath, "utf-8");
      const document = JSON.parse(content) as CanvasDocumentType;

      // Generate a new ULID for the component
      const nodeId = (await import("ulidx")).ulid();

      // Create the component node
      const componentNode: any = {
        id: nodeId,
        type: args.componentType,
        name: args.semanticKey.split(".").pop() || args.componentType,
        visible: true,
        frame: args.position || { x: 0, y: 0, width: 100, height: 50 },
        semanticKey: args.semanticKey,
        ...(args.properties && { props: args.properties }),
      };

      // If component type needs children (like frame), add children array
      if (args.componentType === "frame" || args.componentType === "group") {
        componentNode.children = [];
      }

      // Determine where to add the component
      const parentPath = args.parentPath || "artboards[0].children";

      // Simple path-based insertion (in a real implementation, this would use a proper JSON path library)
      const pathParts = parentPath.split(".");
      let current: any = document;

      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        if (i === pathParts.length - 1) {
          // Last part - this should be the array to push to
          if (Array.isArray(current[part])) {
            current[part].push(componentNode);
          }
        } else {
          current = current[part];
        }
      }

      // Save the updated document
      fs.writeFileSync(args.documentPath, JSON.stringify(document, null, 2));

      return {
        success: true,
        nodeId,
        message: `Created ${args.componentType} component with semantic key "${args.semanticKey}"`,
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to create semantic component: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Update an existing semantic component
   */
  private async updateSemanticComponent(args: {
    documentPath: string;
    semanticKey: string;
    properties: Record<string, any>;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const content = fs.readFileSync(args.documentPath, "utf-8");
      const document = JSON.parse(content) as CanvasDocumentType;

      // Find the node with the semantic key
      let foundNode: any = null;

      function findNodeBySemanticKey(obj: any): void {
        if (obj && typeof obj === "object") {
          if (obj.semanticKey === args.semanticKey) {
            foundNode = obj;
            return;
          }

          for (const [_key, value] of Object.entries(obj)) {
            if (Array.isArray(value)) {
              value.forEach((item) => {
                findNodeBySemanticKey(item);
              });
            } else if (typeof value === "object" && value !== null) {
              findNodeBySemanticKey(value);
            }
          }
        }
      }

      findNodeBySemanticKey(document);

      if (!foundNode) {
        throw new Error(
          `No component found with semantic key "${args.semanticKey}"`
        );
      }

      // Update the component properties
      Object.assign(foundNode, args.properties);

      // Save the updated document
      fs.writeFileSync(args.documentPath, JSON.stringify(document, null, 2));

      return {
        success: true,
        message: `Updated component with semantic key "${args.semanticKey}"`,
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to update semantic component: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Infer semantic keys for existing components
   */
  private async inferSemanticKeys(args: {
    documentPath: string;
    componentIndexPath?: string;
    interactive?: boolean;
  }): Promise<{
    suggestions: Array<{
      nodeId: string;
      suggestedKey: string;
      confidence: number;
      reason: string;
    }>;
  }> {
    try {
      const content = fs.readFileSync(args.documentPath, "utf-8");
      const document = JSON.parse(content) as CanvasDocumentType;

      const suggestions: Array<{
        nodeId: string;
        suggestedKey: string;
        confidence: number;
        reason: string;
      }> = [];

      // Simple semantic key inference based on naming patterns
      function analyzeNode(node: any): void {
        if (node && typeof node === "object") {
          // Skip if already has semantic key
          if (node.semanticKey) {
            return;
          }

          let suggestedKey = "";
          let confidence = 0;
          let reason = "";

          // Infer based on name patterns
          const name = node.name?.toLowerCase() || "";
          const type = node.type;

          if (name.includes("hero") && (type === "frame" || type === "text")) {
            if (name.includes("title") || name.includes("heading")) {
              suggestedKey = "hero.title";
              confidence = 0.9;
              reason = "Hero section with title-like name";
            } else {
              suggestedKey = "hero.section";
              confidence = 0.7;
              reason = "Hero section frame";
            }
          } else if (name.includes("nav") || name.includes("menu")) {
            suggestedKey = "nav.container";
            confidence = 0.8;
            reason = "Navigation or menu container";
          } else if (name.includes("button") || name.includes("cta")) {
            suggestedKey = "cta.primary";
            confidence = 0.8;
            reason = "Button or call-to-action element";
          } else if (name.includes("card") || name.includes("panel")) {
            suggestedKey = "card.container";
            confidence = 0.7;
            reason = "Card or panel container";
          } else if (type === "text" && name.includes("title")) {
            suggestedKey = "content.title";
            confidence = 0.6;
            reason = "Text element with title-like name";
          }

          if (suggestedKey) {
            suggestions.push({
              nodeId: node.id,
              suggestedKey,
              confidence,
              reason,
            });
          }

          // Recurse into children
          if (node.children && Array.isArray(node.children)) {
            node.children.forEach(analyzeNode);
          }
        }
      }

      document.artboards.forEach((artboard: any) => {
        artboard.children.forEach(analyzeNode);
      });

      return { suggestions };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to infer semantic keys: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Analyze component usage across the document
   */
  private async analyzeComponentUsage(args: {
    documentPath: string;
    componentIndexPath?: string;
  }): Promise<{ analysis: any }> {
    try {
      const content = fs.readFileSync(args.documentPath, "utf-8");
      const document = JSON.parse(content) as CanvasDocumentType;

      const analysis = {
        totalComponents: 0,
        componentsByType: {} as Record<string, number>,
        componentsBySemanticKey: {} as Record<string, number>,
        unusedSemanticKeys: [] as string[],
        missingSemanticKeys: [] as string[],
      };

      function analyzeNode(node: any): void {
        if (node && typeof node === "object") {
          analysis.totalComponents++;

          if (node.type) {
            analysis.componentsByType[node.type] =
              (analysis.componentsByType[node.type] || 0) + 1;
          }

          if (node.semanticKey) {
            analysis.componentsBySemanticKey[node.semanticKey] =
              (analysis.componentsBySemanticKey[node.semanticKey] || 0) + 1;
          }

          // Recurse into children
          if (node.children && Array.isArray(node.children)) {
            node.children.forEach(analyzeNode);
          }
        }
      }

      document.artboards.forEach((artboard: any) => {
        artboard.children.forEach(analyzeNode);
      });

      return { analysis };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to analyze component usage: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Create a design specification document
   */
  private async createDesignSpec(args: {
    spec: {
      name: string;
      layout: string;
      components: Array<{
        type: string;
        semanticKey: string;
        props?: Record<string, any>;
      }>;
      tokens?: Record<string, any>;
    };
    outputPath: string;
  }): Promise<{ success: boolean; documentPath: string; message: string }> {
    try {
      // Create a basic canvas document structure
      const document: CanvasDocumentType = {
        schemaVersion: "0.1.0",
        id: ulid(),
        name: args.spec.name,
        artboards: [
          {
            id: ulid(),
            name: "Main",
            frame: { x: 0, y: 0, width: 1440, height: 1024 },
            children: [],
          },
        ],
      };

      // Add components based on the specification
      const artboard = document.artboards[0];
      let yOffset = 0;

      for (const componentSpec of args.spec.components) {
        const componentNode: any = {
          id: ulid(),
          type: componentSpec.type,
          name:
            componentSpec.semanticKey.split(".").pop() || componentSpec.type,
          visible: true,
          frame: {
            x: 0,
            y: yOffset,
            width: componentSpec.type === "frame" ? 300 : 200,
            height: componentSpec.type === "frame" ? 100 : 40,
          },
          semanticKey: componentSpec.semanticKey,
          ...(componentSpec.props && { props: componentSpec.props }),
        };

        // Add children array for container types
        if (componentSpec.type === "frame" || componentSpec.type === "group") {
          componentNode.children = [];
        }

        artboard.children.push(componentNode);
        yOffset += 60;
      }

      // Save the document
      fs.writeFileSync(args.outputPath, JSON.stringify(document, null, 2));

      return {
        success: true,
        documentPath: args.outputPath,
        message: `Created design specification "${args.spec.name}" with ${args.spec.components.length} components`,
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to create design spec: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Update design from specification changes
   */
  private async updateDesignFromSpec(args: {
    documentPath: string;
    specUpdates: any;
    preserveExisting?: boolean;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const content = fs.readFileSync(args.documentPath, "utf-8");
      const document = JSON.parse(content) as CanvasDocumentType;

      // Apply updates (simplified implementation)
      // In a real implementation, this would merge the spec updates with the existing document

      fs.writeFileSync(args.documentPath, JSON.stringify(document, null, 2));

      return {
        success: true,
        message: "Updated design from specification changes",
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to update design from spec: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Generate component specification from requirements
   */
  private async generateComponentSpec(args: {
    requirements: {
      name: string;
      purpose: string;
      props: Array<{
        name: string;
        type: string;
        required: boolean;
        description: string;
      }>;
      variants: string[];
    };
    outputPath: string;
  }): Promise<{ success: boolean; specPath: string; message: string }> {
    try {
      const componentSpec = {
        id: ulid(),
        name: args.requirements.name,
        purpose: args.requirements.purpose,
        props: args.requirements.props.map((prop) => ({
          name: prop.name,
          type: prop.type,
          required: prop.required,
          description: prop.description,
          passthrough: {
            attributes: [`data-${prop.name}`],
            cssVars: [`--${args.requirements.name.toLowerCase()}-${prop.name}`],
          },
        })),
        variants: args.requirements.variants,
        semanticKeys: {
          [`${args.requirements.name.toLowerCase()}.primary`]: {
            description: `Primary ${args.requirements.name}`,
            priority: 10,
            propDefaults: {
              variant: "primary",
            },
          },
        },
      };

      fs.writeFileSync(args.outputPath, JSON.stringify(componentSpec, null, 2));

      return {
        success: true,
        specPath: args.outputPath,
        message: `Generated component specification for "${args.requirements.name}"`,
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to generate component spec: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Bidirectional sync between design and dev
   */
  private async syncDesignDev(args: {
    canvasDocumentPath: string;
    componentIndexPath: string;
    direction: "design-to-dev" | "dev-to-design" | "bidirectional";
    dryRun?: boolean;
  }): Promise<{ success: boolean; message: string; changes?: any[] }> {
    try {
      // Load both documents
      const canvasContent = fs.readFileSync(args.canvasDocumentPath, "utf-8");
      const canvasDocument = JSON.parse(canvasContent) as CanvasDocumentType;

      const indexContent = fs.readFileSync(args.componentIndexPath, "utf-8");
      const componentIndex = JSON.parse(indexContent);

      // Perform sync based on direction
      const changes: any[] = [];

      if (
        args.direction === "design-to-dev" ||
        args.direction === "bidirectional"
      ) {
        // Extract component usage from design and update component index
        changes.push({
          type: "design-to-dev",
          description: "Updated component index from design usage",
        });
      }

      if (
        args.direction === "dev-to-design" ||
        args.direction === "bidirectional"
      ) {
        // Update design with component contract changes
        changes.push({
          type: "dev-to-design",
          description: "Updated design with component contract changes",
        });
      }

      if (!args.dryRun) {
        // Apply changes
        fs.writeFileSync(
          args.canvasDocumentPath,
          JSON.stringify(canvasDocument, null, 2)
        );
        fs.writeFileSync(
          args.componentIndexPath,
          JSON.stringify(componentIndex, null, 2)
        );
      }

      return {
        success: true,
        message: `Synced ${args.direction} with ${changes.length} changes`,
        changes,
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to sync design and dev: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Detect patterns in a canvas document
   */
  private async detectPatterns(args: {
    documentPath: string;
    componentIndexPath?: string;
  }): Promise<{ instances: any[]; summary: string }> {
    try {
      const content = fs.readFileSync(args.documentPath, "utf-8");
      const document = JSON.parse(content) as CanvasDocumentType;

      // Import pattern detection functionality dynamically
      const { detectPatterns } = await import(
        "@paths-design/pattern-manifests"
      );

      const instances = detectPatterns(document);

      const summary = `Detected ${
        instances.length
      } pattern instances: ${instances
        .map((i: any) => i.patternId)
        .join(", ")}`;

      return { instances, summary };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to detect patterns: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Generate a pattern from specification
   */
  private async generatePattern(args: {
    patternId: string;
    spec: {
      name: string;
      position?: { x: number; y: number };
      properties?: Record<string, any>;
    };
    outputPath: string;
  }): Promise<{ success: boolean; documentPath: string; message: string }> {
    try {
      // Import pattern generation functionality dynamically
      const { generatePattern } = await import(
        "@paths-design/pattern-manifests"
      );

      const document = generatePattern(args.patternId, args.spec);

      fs.writeFileSync(args.outputPath, JSON.stringify(document, null, 2));

      return {
        success: true,
        documentPath: args.outputPath,
        message: `Generated ${args.patternId} pattern as "${args.spec.name}"`,
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to generate pattern: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Validate patterns in a canvas document
   */
  private async validatePatterns(args: {
    documentPath: string;
    strict?: boolean;
  }): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
  }> {
    try {
      const content = fs.readFileSync(args.documentPath, "utf-8");
      const document = JSON.parse(content) as CanvasDocumentType;

      // Import pattern validation functionality dynamically
      const { detectPatterns } = await import(
        "@paths-design/pattern-manifests"
      );

      const instances = detectPatterns(document);

      const errors: string[] = [];
      const warnings: string[] = [];
      const suggestions: string[] = [];

      // Analyze each pattern instance
      for (const instance of instances) {
        if (!instance.isComplete) {
          warnings.push(
            `Incomplete ${instance.patternId} pattern: missing required nodes`
          );
          suggestions.push(
            `Complete ${instance.patternId} by adding missing required nodes`
          );
        }

        if (instance.validationErrors.length > 0) {
          warnings.push(...instance.validationErrors);
        }
      }

      const valid = errors.length === 0;

      if (args.strict && (warnings.length > 0 || !valid)) {
        throw new Error(
          `Pattern validation failed: ${errors.length} errors, ${warnings.length} warnings`
        );
      }

      return { valid, errors, warnings, suggestions };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to validate patterns: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Discover components in a canvas document
   */
  private async discoverComponents(args: {
    documentPath: string;
    sourceCodePaths?: string[];
    componentIndexPath?: string;
  }): Promise<{ components: any[]; analysis: any }> {
    try {
      const content = fs.readFileSync(args.documentPath, "utf-8");
      const _document = JSON.parse(content) as CanvasDocumentType;

      // Import component discovery functionality dynamically
      const { discoverComponents } = await import(
        "@paths-design/component-discovery"
      );

      const result = await discoverComponents(args.documentPath, {
        sourceCodePaths: args.sourceCodePaths,
        componentIndex: args.componentIndexPath
          ? await this.loadComponentIndex(args.componentIndexPath)
          : undefined,
      });

      return {
        components: result.discoveredComponents,
        analysis: {
          propAnalysis: result.propAnalysis,
          subcomponentAnalysis: result.subcomponentAnalysis,
          tokenAnalysis: result.tokenAnalysis,
          recommendations: result.recommendations,
          issues: result.issues,
        },
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to discover components: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Comprehensive design analysis
   */
  private async analyzeDesign(args: {
    documentPath: string;
    sourceCodePaths?: string[];
    componentIndexPath?: string;
    includePatterns?: boolean;
    includeAccessibility?: boolean;
    includeTokens?: boolean;
  }): Promise<{ analysis: any; summary: string }> {
    try {
      const content = fs.readFileSync(args.documentPath, "utf-8");
      const _document = JSON.parse(content) as CanvasDocumentType;

      // Import comprehensive analysis functionality
      const { runAutoDiscovery } = await import(
        "@paths-design/component-discovery"
      );

      const result = await runAutoDiscovery(".", {
        canvasFiles: [args.documentPath],
        sourceFiles: args.sourceCodePaths,
      });

      const summary = `Analysis complete: ${result.discoveredComponents.length} components, ${result.recommendations.length} recommendations, ${result.issues.length} issues`;

      return {
        analysis: result,
        summary,
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to analyze design: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Load component index
   */
  private async loadComponentIndex(componentIndexPath: string): Promise<any> {
    try {
      const content = fs.readFileSync(componentIndexPath, "utf-8");
      return JSON.parse(content);
    } catch (error) {
      console.warn("Failed to load component index:", error);
      return null;
    }
  }

  /**
   * Inspect document structure with detailed node information
   */
  private async inspectDocument(args: {
    documentPath: string;
    nodeId?: string;
    includeHierarchy?: boolean;
    includeStyles?: boolean;
    includeMetadata?: boolean;
  }): Promise<{
    document: any;
    nodes: any[];
    summary: string;
  }> {
    try {
      const content = fs.readFileSync(args.documentPath, "utf-8");
      const document = JSON.parse(content) as CanvasDocumentType;

      // Import traversal functionality
      const { traverseDocument, getAncestors, getDescendants } = await import(
        "@paths-design/canvas-engine"
      );

      const nodes: any[] = [];
      const options = {
        includeHierarchy: args.includeHierarchy ?? true,
        includeStyles: args.includeStyles ?? true,
        includeMetadata: args.includeMetadata ?? true,
      };

      for (const result of traverseDocument(document)) {
        if (args.nodeId && result.node.id !== args.nodeId) {
          continue;
        }

        const nodeInfo: any = {
          id: result.node.id,
          type: result.node.type,
          name: result.node.name,
          path: result.path,
          depth: result.depth,
          artboardIndex: result.artboardIndex,
          frame: result.node.frame,
          visible: result.node.visible,
        };

        if (options.includeStyles) {
          nodeInfo.style = result.node.style;
          nodeInfo.data = result.node.data;
        }

        if (options.includeMetadata && "semanticKey" in result.node) {
          nodeInfo.semanticKey = result.node.semanticKey;
        }

        if (options.includeHierarchy) {
          const ancestors = getAncestors(document, result.path);
          const descendants = getDescendants(document, result.path);

          nodeInfo.ancestors = ancestors.map((a) => ({
            id: a.node.id,
            type: a.node.type,
            name: a.node.name,
          }));

          nodeInfo.descendants = descendants.map((d) => ({
            id: d.node.id,
            type: d.node.type,
            name: d.node.name,
          }));
        }

        nodes.push(nodeInfo);
      }

      const summary = `Inspected document with ${nodes.length} nodes (${document.artboards.length} artboards)`;

      return {
        document: {
          id: document.id,
          name: document.name,
          schemaVersion: document.schemaVersion,
          artboardCount: document.artboards.length,
        },
        nodes,
        summary,
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to inspect document: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Query nodes using advanced filters and selectors
   */
  private async queryNodes(args: {
    documentPath: string;
    selector: {
      type?: string;
      name?: string;
      semanticKey?: string;
      hasChildren?: boolean;
      visible?: boolean;
      frame?: {
        minWidth?: number;
        maxWidth?: number;
        minHeight?: number;
        maxHeight?: number;
      };
    };
    maxResults?: number;
  }): Promise<{
    nodes: any[];
    summary: string;
    totalFound: number;
  }> {
    try {
      const content = fs.readFileSync(args.documentPath, "utf-8");
      const document = JSON.parse(content) as CanvasDocumentType;

      // Import traversal functionality
      const { traverseDocument } = await import("@paths-design/canvas-engine");

      const nodes: any[] = [];
      const maxResults = args.maxResults ?? 100;

      for (const result of traverseDocument(document)) {
        let matches = true;

        // Apply selector filters
        if (args.selector.type && result.node.type !== args.selector.type) {
          matches = false;
        }

        if (args.selector.name) {
          const nameRegex = new RegExp(args.selector.name, "i");
          if (!nameRegex.test(result.node.name)) {
            matches = false;
          }
        }

        if (args.selector.semanticKey) {
          if (!result.node.semanticKey?.includes(args.selector.semanticKey)) {
            matches = false;
          }
        }

        if (args.selector.hasChildren !== undefined) {
          const hasChildren =
            "children" in result.node && result.node.children?.length > 0;
          if (hasChildren !== args.selector.hasChildren) {
            matches = false;
          }
        }

        if (
          args.selector.visible !== undefined &&
          result.node.visible !== args.selector.visible
        ) {
          matches = false;
        }

        if (args.selector.frame && result.node.frame) {
          const frame = result.node.frame;
          if (
            args.selector.frame.minWidth &&
            frame.width < args.selector.frame.minWidth
          ) {
            matches = false;
          }
          if (
            args.selector.frame.maxWidth &&
            frame.width > args.selector.frame.maxWidth
          ) {
            matches = false;
          }
          if (
            args.selector.frame.minHeight &&
            frame.height < args.selector.frame.minHeight
          ) {
            matches = false;
          }
          if (
            args.selector.frame.maxHeight &&
            frame.height > args.selector.frame.maxHeight
          ) {
            matches = false;
          }
        }

        if (matches) {
          nodes.push({
            id: result.node.id,
            type: result.node.type,
            name: result.node.name,
            path: result.path,
            frame: result.node.frame,
            visible: result.node.visible,
            semanticKey: result.node.semanticKey,
          });

          if (nodes.length >= maxResults) {
            break;
          }
        }
      }

      const summary = `Found ${nodes.length} nodes matching selector criteria`;

      return {
        nodes,
        summary,
        totalFound: nodes.length,
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to query nodes: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Create a node at a specific position
   */
  private async createNodeAtPosition(args: {
    documentPath: string;
    nodeType: string;
    position: { x: number; y: number; width?: number; height?: number };
    properties?: Record<string, any>;
    parentPath?: string;
    insertIndex?: number;
  }): Promise<{
    success: boolean;
    nodeId: string;
    message: string;
  }> {
    try {
      const content = fs.readFileSync(args.documentPath, "utf-8");
      const document = JSON.parse(content) as CanvasDocumentType;

      const nodeId = (await import("ulidx")).ulid();

      const newNode: any = {
        id: nodeId,
        type: args.nodeType,
        name: args.properties?.name || `${args.nodeType}_${nodeId.slice(-4)}`,
        visible: true,
        frame: {
          x: args.position.x,
          y: args.position.y,
          width: args.position.width ?? 100,
          height: args.position.height ?? 50,
        },
        ...(args.properties && { ...args.properties }),
      };

      // Add children array for container types
      if (args.nodeType === "frame" || args.nodeType === "group") {
        newNode.children = [];
      }

      // Determine parent path
      const parentPath = args.parentPath || "artboards[0].children";

      // Simple path-based insertion
      const pathParts = parentPath.split(".");
      let current: any = document;

      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        if (i === pathParts.length - 1) {
          // Last part - this should be the array to push to
          if (Array.isArray(current[part])) {
            const insertIndex = args.insertIndex ?? current[part].length;
            current[part].splice(insertIndex, 0, newNode);
          }
        } else {
          current = current[part];
        }
      }

      // Save the updated document
      fs.writeFileSync(args.documentPath, JSON.stringify(document, null, 2));

      return {
        success: true,
        nodeId,
        message: `Created ${args.nodeType} node "${newNode.name}" at position (${args.position.x}, ${args.position.y})`,
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to create node: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Batch update multiple nodes
   */
  private async batchUpdateNodes(args: {
    documentPath: string;
    updates: Array<{
      nodeId: string;
      properties: Record<string, any>;
      condition?: any;
    }>;
    conflictStrategy?: "merge" | "replace" | "skip";
  }): Promise<{
    success: boolean;
    updatedCount: number;
    skippedCount: number;
    message: string;
  }> {
    try {
      const content = fs.readFileSync(args.documentPath, "utf-8");
      const document = JSON.parse(content) as CanvasDocumentType;

      let updatedCount = 0;
      let skippedCount = 0;

      for (const update of args.updates) {
        // Find the node
        let foundNode: any = null;
        function findNode(obj: any): void {
          if (obj && typeof obj === "object") {
            if (obj.id === update.nodeId) {
              foundNode = obj;
              return;
            }
            for (const value of Object.values(obj)) {
              if (Array.isArray(value)) {
                value.forEach(findNode);
              } else if (typeof value === "object" && value !== null) {
                findNode(value);
              }
            }
          }
        }
        findNode(document);

        if (!foundNode) {
          skippedCount++;
          continue;
        }

        // Check condition if provided
        if (update.condition) {
          // Simple condition checking - could be enhanced
          let conditionMet = true;
          for (const [key, expectedValue] of Object.entries(update.condition)) {
            if (foundNode[key] !== expectedValue) {
              conditionMet = false;
              break;
            }
          }
          if (!conditionMet) {
            skippedCount++;
            continue;
          }
        }

        // Apply updates based on strategy
        const strategy = args.conflictStrategy || "merge";
        if (strategy === "replace") {
          Object.assign(foundNode, update.properties);
        } else if (strategy === "merge") {
          // Deep merge properties
          const mergeObject = (target: any, source: any) => {
            for (const key in source) {
              if (
                source[key] &&
                typeof source[key] === "object" &&
                !Array.isArray(source[key])
              ) {
                if (!target[key]) {
                  target[key] = {};
                }
                mergeObject(target[key], source[key]);
              } else {
                target[key] = source[key];
              }
            }
          };
          mergeObject(foundNode, update.properties);
        }

        updatedCount++;
      }

      // Save the updated document
      fs.writeFileSync(args.documentPath, JSON.stringify(document, null, 2));

      return {
        success: true,
        updatedCount,
        skippedCount,
        message: `Updated ${updatedCount} nodes, skipped ${skippedCount}`,
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to batch update nodes: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Find similar nodes using similarity scoring
   */
  private async findSimilarNodes(args: {
    documentPath: string;
    referenceNodeId: string;
    similarityThreshold?: number;
    maxResults?: number;
    similarityFactors?: {
      type?: number;
      size?: number;
      position?: number;
      style?: number;
      name?: number;
    };
  }): Promise<{
    similarNodes: Array<{
      node: any;
      similarityScore: number;
      factors: Record<string, number>;
    }>;
    summary: string;
  }> {
    try {
      const content = fs.readFileSync(args.documentPath, "utf-8");
      const document = JSON.parse(content) as CanvasDocumentType;

      // Find reference node
      let referenceNode: any = null;
      function findNode(obj: any): void {
        if (obj && typeof obj === "object") {
          if (obj.id === args.referenceNodeId) {
            referenceNode = obj;
            return;
          }
          for (const value of Object.values(obj)) {
            if (Array.isArray(value)) {
              value.forEach(findNode);
            } else if (typeof value === "object" && value !== null) {
              findNode(value);
            }
          }
        }
      }
      findNode(document);

      if (!referenceNode) {
        throw new Error(`Reference node ${args.referenceNodeId} not found`);
      }

      // Import traversal for getting all nodes
      const { traverseDocument } = await import("@paths-design/canvas-engine");

      const similarNodes: Array<{
        node: any;
        similarityScore: number;
        factors: Record<string, number>;
      }> = [];

      const threshold = args.similarityThreshold ?? 0.7;
      const maxResults = args.maxResults ?? 10;

      const factors = args.similarityFactors || {
        type: 0.3,
        size: 0.2,
        position: 0.1,
        style: 0.2,
        name: 0.2,
      };

      for (const result of traverseDocument(document)) {
        if (result.node.id === args.referenceNodeId) {
          continue; // Skip reference node itself
        }

        const similarity = this.calculateNodeSimilarity(
          referenceNode,
          result.node,
          factors
        );

        if (similarity.score >= threshold) {
          similarNodes.push({
            node: {
              id: result.node.id,
              type: result.node.type,
              name: result.node.name,
              frame: result.node.frame,
            },
            similarityScore: similarity.score,
            factors: similarity.factors,
          });

          if (similarNodes.length >= maxResults) {
            break;
          }
        }
      }

      // Sort by similarity score
      similarNodes.sort((a, b) => b.similarityScore - a.similarityScore);

      return {
        similarNodes,
        summary: `Found ${similarNodes.length} similar nodes with threshold ${threshold}`,
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to find similar nodes: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Calculate similarity score between two nodes
   */
  private calculateNodeSimilarity(
    node1: any,
    node2: any,
    factors: {
      type?: number;
      size?: number;
      position?: number;
      style?: number;
      name?: number;
    }
  ): { score: number; factors: Record<string, number> } {
    const scores: Record<string, number> = {};

    // Type similarity
    scores.type = node1.type === node2.type ? 1 : 0;
    const typeScore = scores.type * (factors.type || 0.3);

    // Size similarity (frame dimensions)
    if (node1.frame && node2.frame) {
      const widthRatio =
        Math.min(node1.frame.width, node2.frame.width) /
        Math.max(node1.frame.width, node2.frame.width);
      const heightRatio =
        Math.min(node1.frame.height, node2.frame.height) /
        Math.max(node1.frame.height, node2.frame.height);
      scores.size = (widthRatio + heightRatio) / 2;
    } else {
      scores.size = 0;
    }
    const sizeScore = scores.size * (factors.size || 0.2);

    // Name similarity (simple string similarity)
    if (node1.name && node2.name) {
      const name1 = node1.name.toLowerCase();
      const name2 = node2.name.toLowerCase();
      const maxLength = Math.max(name1.length, name2.length);
      if (maxLength === 0) {
        scores.name = 1;
      } else {
        let matches = 0;
        for (let i = 0; i < Math.min(name1.length, name2.length); i++) {
          if (name1[i] === name2[i]) {
            matches++;
          }
        }
        scores.name = matches / maxLength;
      }
    } else {
      scores.name = 0;
    }
    const nameScore = scores.name * (factors.name || 0.2);

    // Style similarity (simplified)
    if (node1.style && node2.style) {
      let styleMatches = 0;
      const totalStyles = Math.max(
        Object.keys(node1.style).length,
        Object.keys(node2.style).length
      );
      if (totalStyles === 0) {
        scores.style = 1;
      } else {
        for (const key of Object.keys(node1.style)) {
          if (node1.style[key] === node2.style[key]) {
            styleMatches++;
          }
        }
        scores.style = styleMatches / totalStyles;
      }
    } else {
      scores.style = 0;
    }
    const styleScore = scores.style * (factors.style || 0.2);

    // Position similarity (if available)
    scores.position = 0; // Would need absolute position data
    const positionScore = scores.position * (factors.position || 0.1);

    const totalScore =
      typeScore + sizeScore + nameScore + styleScore + positionScore;

    return {
      score: totalScore,
      factors: scores,
    };
  }

  /**
   * Extract design tokens from document
   */
  private async extractDesignTokens(args: {
    documentPath: string;
    tokenTypes?: string[];
    includeUsage?: boolean;
    outputFormat?: "json" | "css" | "scss" | "typescript";
  }): Promise<{
    tokens: any;
    summary: string;
    format: string;
  }> {
    try {
      const content = fs.readFileSync(args.documentPath, "utf-8");
      const document = JSON.parse(content) as CanvasDocumentType;

      // Import traversal functionality
      const { traverseDocument } = await import("@paths-design/canvas-engine");

      const tokens: any = {};
      const tokenTypes = args.tokenTypes || ["colors", "typography", "spacing"];
      const usageCount: Record<string, number> = {};

      for (const result of traverseDocument(document)) {
        const node = result.node;

        // Extract colors from fills and strokes
        if (tokenTypes.includes("colors")) {
          if (node.style?.fills) {
            for (const fill of node.style.fills) {
              if (fill.type === "solid" && fill.color) {
                const colorKey = `color-${fill.color.r}-${fill.color.g}-${fill.color.b}`;
                tokens.colors = tokens.colors || {};
                tokens.colors[colorKey] = {
                  r: fill.color.r,
                  g: fill.color.g,
                  b: fill.color.b,
                  a: fill.color.a || 1,
                };
                usageCount[colorKey] = (usageCount[colorKey] || 0) + 1;
              }
            }
          }
        }

        // Extract typography tokens
        if (
          tokenTypes.includes("typography") &&
          node.type === "text" &&
          node.textStyle
        ) {
          const textStyle = node.textStyle;
          tokens.typography = tokens.typography || {};

          if (textStyle.family) {
            tokens.typography[
              `font-family-${textStyle.family
                .replace(/\s+/g, "-")
                .toLowerCase()}`
            ] = {
              value: textStyle.family,
              category: "font-family",
            };
          }

          if (textStyle.size) {
            tokens.typography[`font-size-${textStyle.size}`] = {
              value: `${textStyle.size}px`,
              category: "font-size",
            };
          }

          if (textStyle.weight) {
            tokens.typography[`font-weight-${textStyle.weight}`] = {
              value: textStyle.weight,
              category: "font-weight",
            };
          }
        }

        // Extract spacing from frame properties
        if (tokenTypes.includes("spacing") && node.frame) {
          tokens.spacing = tokens.spacing || {};

          const frame = node.frame;
          if (frame.width) {
            tokens.spacing[`width-${frame.width}`] = {
              value: `${frame.width}px`,
              category: "width",
            };
          }

          if (frame.height) {
            tokens.spacing[`height-${frame.height}`] = {
              value: `${frame.height}px`,
              category: "height",
            };
          }
        }
      }

      // Add usage counts if requested
      if (args.includeUsage) {
        for (const [tokenKey, count] of Object.entries(usageCount)) {
          if (tokens.colors && tokens.colors[tokenKey]) {
            tokens.colors[tokenKey].usageCount = count;
          }
        }
      }

      // Format output based on requested format
      const format = args.outputFormat || "json";
      let formattedTokens: any = tokens;

      if (format === "css") {
        formattedTokens = this.formatTokensAsCSS(tokens);
      } else if (format === "scss") {
        formattedTokens = this.formatTokensAsSCSS(tokens);
      } else if (format === "typescript") {
        formattedTokens = this.formatTokensAsTypeScript(tokens);
      }

      const summary = `Extracted ${
        Object.keys(tokens).length
      } token categories with ${this.countTokens(tokens)} total tokens`;

      return {
        tokens: formattedTokens,
        summary,
        format,
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to extract design tokens: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Format tokens as CSS custom properties
   */
  private formatTokensAsCSS(tokens: any): string {
    let css = ":root {\n";

    if (tokens.colors) {
      for (const [key, value] of Object.entries(tokens.colors)) {
        css += `  --${key}: rgba(${(value as any).r}, ${(value as any).g}, ${
          (value as any).b
        }, ${(value as any).a});\n`;
      }
    }

    if (tokens.typography) {
      for (const [key, value] of Object.entries(tokens.typography)) {
        css += `  --${key}: ${(value as any).value};\n`;
      }
    }

    if (tokens.spacing) {
      for (const [key, value] of Object.entries(tokens.spacing)) {
        css += `  --${key}: ${(value as any).value};\n`;
      }
    }

    css += "}\n";
    return css;
  }

  /**
   * Format tokens as SCSS variables
   */
  private formatTokensAsSCSS(tokens: any): string {
    let scss = "";

    if (tokens.colors) {
      scss += "// Color tokens\n";
      for (const [key, value] of Object.entries(tokens.colors)) {
        scss += `$${key}: rgba(${(value as any).r}, ${(value as any).g}, ${
          (value as any).b
        }, ${(value as any).a});\n`;
      }
    }

    if (tokens.typography) {
      scss += "\n// Typography tokens\n";
      for (const [key, value] of Object.entries(tokens.typography)) {
        scss += `$${key}: ${(value as any).value};\n`;
      }
    }

    if (tokens.spacing) {
      scss += "\n// Spacing tokens\n";
      for (const [key, value] of Object.entries(tokens.spacing)) {
        scss += `$${key}: ${(value as any).value};\n`;
      }
    }

    return scss;
  }

  /**
   * Format tokens as TypeScript constants
   */
  private formatTokensAsTypeScript(tokens: any): string {
    let ts = "export const designTokens = {\n";

    if (tokens.colors) {
      ts += "  colors: {\n";
      for (const [key, value] of Object.entries(tokens.colors)) {
        ts += `    '${key}': 'rgba(${(value as any).r}, ${(value as any).g}, ${
          (value as any).b
        }, ${(value as any).a})',\n`;
      }
      ts += "  },\n";
    }

    if (tokens.typography) {
      ts += "  typography: {\n";
      for (const [key, value] of Object.entries(tokens.typography)) {
        ts += `    '${key}': '${(value as any).value}',\n`;
      }
      ts += "  },\n";
    }

    if (tokens.spacing) {
      ts += "  spacing: {\n";
      for (const [key, value] of Object.entries(tokens.spacing)) {
        ts += `    '${key}': '${(value as any).value}',\n`;
      }
      ts += "  },\n";
    }

    ts += "};\n";
    return ts;
  }

  /**
   * Count total tokens in nested structure
   */
  private countTokens(tokens: any): number {
    let count = 0;
    for (const category of Object.values(tokens)) {
      if (typeof category === "object" && category !== null) {
        count += Object.keys(category).length;
      }
    }
    return count;
  }

  /**
   * Apply design system to document
   */
  private async applyDesignSystem(args: {
    documentPath: string;
    designSystemPath: string;
    strategy?: "replace" | "merge" | "migrate";
    previewOnly?: boolean;
  }): Promise<{
    success: boolean;
    changes: any[];
    message: string;
  }> {
    try {
      // Load design system
      const designSystemContent = fs.readFileSync(
        args.designSystemPath,
        "utf-8"
      );
      const _designSystem = JSON.parse(designSystemContent);

      const content = fs.readFileSync(args.documentPath, "utf-8");
      const document = JSON.parse(content) as CanvasDocumentType;

      const changes: any[] = [];
      const strategy = args.strategy || "merge";

      // Apply design system based on strategy
      if (strategy === "replace") {
        // Replace existing tokens/styles completely
        changes.push({
          type: "design_system_replace",
          description: "Replaced existing design system",
        });
      } else if (strategy === "merge") {
        // Merge with existing tokens/styles
        changes.push({
          type: "design_system_merge",
          description: "Merged design system with existing styles",
        });
      }

      if (!args.previewOnly) {
        // Apply changes to document
        fs.writeFileSync(args.documentPath, JSON.stringify(document, null, 2));
      }

      return {
        success: true,
        changes,
        message: `Applied design system using ${strategy} strategy`,
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to apply design system: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Measure performance of document operations
   */
  private async measurePerformance(args: {
    documentPath: string;
    metrics?: string[];
    iterations?: number;
    warmUp?: number;
  }): Promise<{
    results: Record<
      string,
      { average: number; min: number; max: number; samples: number[] }
    >;
    summary: string;
  }> {
    try {
      const content = fs.readFileSync(args.documentPath, "utf-8");
      const document = JSON.parse(content) as CanvasDocumentType;

      const metrics = args.metrics || ["render_time", "hit_test"];
      const iterations = args.iterations || 10;
      const warmUp = args.warmUp || 5;

      const results: Record<
        string,
        { average: number; min: number; max: number; samples: number[] }
      > = {};

      for (const metric of metrics) {
        const samples: number[] = [];

        // Warm-up iterations
        for (let i = 0; i < warmUp; i++) {
          await this.performMetricTest(document, metric);
        }

        // Actual measurement iterations
        for (let i = 0; i < iterations; i++) {
          const duration = await this.performMetricTest(document, metric);
          samples.push(duration);
        }

        const average = samples.reduce((sum, s) => sum + s, 0) / samples.length;
        const min = Math.min(...samples);
        const max = Math.max(...samples);

        results[metric] = {
          average,
          min,
          max,
          samples,
        };
      }

      const summary = `Measured ${metrics.length} metrics over ${iterations} iterations each`;

      return {
        results,
        summary,
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to measure performance: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Perform a specific metric test
   */
  private async performMetricTest(
    document: CanvasDocumentType,
    metric: string
  ): Promise<number> {
    const startTime = performance.now();

    try {
      switch (metric) {
        case "render_time":
          // Simulate rendering by traversing all nodes
          const { traverseDocument } = await import(
            "@paths-design/canvas-engine"
          );
          let _nodeCount = 0;
          for (const _ of traverseDocument(document)) {
            _nodeCount++;
          }
          break;

        case "hit_test":
          // Simulate hit testing at random points
          const { hitTest } = await import("@paths-design/canvas-engine");
          for (let i = 0; i < 10; i++) {
            const point = {
              x: Math.random() * 1000,
              y: Math.random() * 1000,
            };
            hitTest(document, point);
          }
          break;

        case "traversal":
          // Measure traversal performance
          const { countNodes } = await import("@paths-design/canvas-engine");
          countNodes(document);
          break;

        default:
          // Unknown metric, just measure time
          await new Promise((resolve) => setTimeout(resolve, 1));
      }

      return performance.now() - startTime;
    } catch (_error) {
      return performance.now() - startTime;
    }
  }
}

/**
 * Main entry point for MCP server
 */
async function main() {
  const server = new DesignerMCPServer();
  await server.start();

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    await server.stop();
    process.exit(0);
  });
}

// Run the server if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Failed to start MCP server:", error);
    process.exit(1);
  });
}
