/**
 * @fileoverview MCP server for Designer integration with Cursor
 * @author @darianrosebrook
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "node:fs";
import * as path from "node:path";
import type { CanvasDocumentType } from "@paths-design/canvas-schema";
import { generateReactComponents } from "@paths-design/codegen-react";
import { generateAugmentedVariants } from "@paths-design/augment";
import { compareCanvasDocuments } from "@paths-design/diff-visualizer";

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
        return await this.handleToolCall(request.params.name, request.params.arguments);
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
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
              description: "Optional path to component index for semantic key support",
            },
          },
          required: ["documentPath", "outputDir"],
        },
      },
      {
        name: "generate_augmented_variants",
        description: "Generate augmented variants of a canvas document for testing",
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
        description: "Validate a canvas document for semantic keys and accessibility",
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

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${toolName}`);
    }
  }

  /**
   * Load a canvas document from file
   */
  private async loadCanvasDocument(filePath: string): Promise<{ document: CanvasDocumentType }> {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const document = JSON.parse(content) as CanvasDocumentType;

      return { document };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to load canvas document: ${error instanceof Error ? error.message : 'Unknown error'}`
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
        `Failed to generate React components: ${error instanceof Error ? error.message : 'Unknown error'}`
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

      const variants = await generateAugmentedVariants(document, args.count || 5, {
        layoutPerturbation: { enabled: args.enableLayoutPerturbation ?? true, tolerance: 0.1 },
        tokenPermutation: { enabled: args.enableTokenPermutation ?? true },
        a11yValidation: { enabled: args.enableAccessibilityValidation ?? true, strict: false, contrastThreshold: "AA" },
      });

      const summary = `Generated ${variants.length} augmented variants with ${variants.reduce((sum, v) => sum + v.transformations.length, 0)} total transformations`;

      return { variants, summary };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to generate augmented variants: ${error instanceof Error ? error.message : 'Unknown error'}`
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
        `Failed to compare canvas documents: ${error instanceof Error ? error.message : 'Unknown error'}`
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
        a11yValidation: { enabled: true, strict: args.strict ?? false, contrastThreshold: "AA" },
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
        `Failed to validate canvas document: ${error instanceof Error ? error.message : 'Unknown error'}`
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

${diff.nodeDiffs.length > 0 ? `### Node Changes\n\n${diff.nodeDiffs.map((d: any) => `- **${d.type}**: ${d.description}`).join('\n')}` : ''}

${diff.propertyChanges.length > 0 ? `### Property Changes\n\n${diff.propertyChanges.map((c: any) => `- **${c.property}**: ${c.description}`).join('\n')}` : ''}`;
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log("Designer MCP server started");
  }

  /**
   * Stop the MCP server
   */
  async stop(): Promise<void> {
    await this.server.close();
    console.log("Designer MCP server stopped");
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
