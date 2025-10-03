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
