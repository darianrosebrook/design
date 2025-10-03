/**
 * @fileoverview VS Code Extension for Designer
 * @author @darianrosebrook
 *
 * Main entry point for the Designer VS Code extension.
 * Provides secure message protocol, workspace file access, and UI components.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as vscode from "vscode";
import type { CanvasDocumentType } from "../../canvas-schema/src/index.js";
import type { ComponentIndex } from "../../component-indexer/src/index.js";
import type {
  SelectionState,
  PropertyChangeEvent,
} from "../../properties-panel/src/index.js";
import { PropertiesService } from "../../properties-panel/src/index.js";
import { PropertiesPanelWebviewProvider } from "./properties-panel-webview";

export * from "./protocol/index.js";
export * from "./security/index.js";

/**
 * Main extension class managing the Designer VS Code extension
 */
class DesignerExtension {
  private context: vscode.ExtensionContext;
  private propertiesPanelProvider: PropertiesPanelWebviewProvider;
  private propertiesService: PropertiesService;
  private componentIndex: ComponentIndex | null = null;
  private currentDocument: CanvasDocumentType | null = null;
  private currentSelection: SelectionState = {
    selectedNodeIds: [],
    focusedNodeId: null,
  };

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.propertiesService = PropertiesService.getInstance();
    this.propertiesPanelProvider = new PropertiesPanelWebviewProvider(context);

    // Load component index if it exists
    this.loadComponentIndex();

    this.registerCommands();
    this.registerWebviewProviders();
    this.setupFileAssociations();
  }

  /**
   * Load component index for semantic key and contract support
   */
  private async loadComponentIndex(): Promise<void> {
    try {
      // Look for component index in the design directory
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        return;
      }

      const designDir = path.join(workspaceFolders[0].uri.fsPath, "design");
      const componentIndexPath = path.join(designDir, "components.index.json");

      if (fs.existsSync(componentIndexPath)) {
        const componentIndexContent = fs.readFileSync(
          componentIndexPath,
          "utf-8"
        );
        const componentIndex = JSON.parse(
          componentIndexContent
        ) as ComponentIndex;

        this.componentIndex = componentIndex;
        this.propertiesService.setComponentIndex(componentIndex);

        console.info(
          `Loaded component index with ${
            Object.keys(componentIndex.components).length
          } components`
        );
      } else {
        console.info("No component index found, using basic properties only");
      }
    } catch (error) {
      console.warn("Failed to load component index:", error);
    }
  }

  /**
   * Register extension commands
   */
  private registerCommands(): void {
    // Command to open properties panel
    const openPropertiesPanelCommand = vscode.commands.registerCommand(
      "designer.openPropertiesPanel",
      () => {
        vscode.commands.executeCommand("workbench.view.extension.designer");
      }
    );

    // Command to load a canvas document
    const loadDocumentCommand = vscode.commands.registerCommand(
      "designer.loadDocument",
      async (uri?: vscode.Uri) => {
        let documentUri = uri;

        if (!documentUri) {
          // Ask user to select a file
          const uris = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            filters: {
              "Canvas Documents": ["canvas.json", "json"],
            },
            openLabel: "Load Canvas Document",
          });

          if (!uris || uris.length === 0) {
            return;
          }

          documentUri = uris[0];
        }

        await this.loadDocument(documentUri);
      }
    );

    // Command to refresh the current document
    const refreshDocumentCommand = vscode.commands.registerCommand(
      "designer.refreshDocument",
      () => {
        if (this.currentDocument) {
          this.updateDocument(this.currentDocument);
        }
      }
    );

    this.context.subscriptions.push(
      openPropertiesPanelCommand,
      loadDocumentCommand,
      refreshDocumentCommand
    );
  }

  /**
   * Register webview providers
   */
  private registerWebviewProviders(): void {
    // Properties panel webview
    this.context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        PropertiesPanelWebviewProvider.viewType,
        this.propertiesPanelProvider
      )
    );
  }

  /**
   * Set up file associations for canvas documents
   */
  private setupFileAssociations(): void {
    // Register .canvas.json files to open with our extension
    vscode.workspace.onDidOpenTextDocument((document) => {
      if (document.fileName.endsWith(".canvas.json")) {
        this.loadDocument(vscode.Uri.file(document.fileName));
      }
    });

    // Watch for file changes
    const fileWatcher =
      vscode.workspace.createFileSystemWatcher("**/*.canvas.json");

    fileWatcher.onDidChange((uri) => {
      if (
        this.currentDocument &&
        uri.fsPath === vscode.workspace.asRelativePath(this.currentDocument.id)
      ) {
        this.loadDocument(uri);
      }
    });

    this.context.subscriptions.push(fileWatcher);
  }

  /**
   * Load a canvas document from file
   */
  private async loadDocument(uri: vscode.Uri): Promise<void> {
    try {
      const content = await vscode.workspace.fs.readFile(uri);
      const document = JSON.parse(content.toString()) as CanvasDocumentType;

      this.currentDocument = document;
      this.updateDocument(document);

      vscode.window.showInformationMessage(
        `Loaded canvas document: ${document.name}`
      );
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to load canvas document: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Update the current document and notify all views
   */
  private updateDocument(document: CanvasDocumentType): void {
    this.currentDocument = document;

    // Set nodes in properties service for semantic key and contract support
    if (document.artboards.length > 0) {
      // Flatten all nodes from all artboards
      const allNodes: NodeType[] = [];
      document.artboards.forEach((artboard) => {
        allNodes.push(...artboard.children);

        // Recursively collect all child nodes
        const collectNodes = (nodes: NodeType[]) => {
          nodes.forEach((node) => {
            if (node.children) {
              allNodes.push(...node.children);
              collectNodes(node.children);
            }
          });
        };
        collectNodes(artboard.children);
      });

      this.propertiesService.setNodes(allNodes);
    }

    // Update properties panel
    this.propertiesPanelProvider.setDocument(document);

    // Update selection if it exists
    if (this.currentSelection.selectedNodeIds.length > 0) {
      this.propertiesPanelProvider.setSelection(this.currentSelection);
    }
  }

  /**
   * Update the current selection
   */
  updateSelection(selection: SelectionState): void {
    this.currentSelection = selection;
    this.propertiesPanelProvider.setSelection(selection);
  }

  /**
   * Handle property changes from the properties panel
   */
  handlePropertyChange(event: PropertyChangeEvent): void {
    if (!this.currentDocument) {
      console.warn("No current document to apply property change to");
      return;
    }

    // Delegate to properties panel provider for full handling
    // This includes applying the change, saving, and notifying other views
    console.info("Property change received in extension:", event);
  }

  /**
   * Update the current document (called by properties panel provider after changes)
   * @internal
   */
  _updateDocument(document: CanvasDocumentType): void {
    this.updateDocument(document);
  }

  /**
   * Get the current document
   */
  getCurrentDocument(): CanvasDocumentType | null {
    return this.currentDocument;
  }

  /**
   * Get the current selection
   */
  getCurrentSelection(): SelectionState {
    return this.currentSelection;
  }
}

// Global extension instance
let extensionInstance: DesignerExtension | null = null;

/**
 * Main extension activation function
 */
export function activate(context: vscode.ExtensionContext): void {
  console.info("Designer extension is now active!");

  // Create the main extension instance
  extensionInstance = new DesignerExtension(context);

  // Export the extension instance for use by other parts of the extension
  (globalThis as Record<string, unknown>).designerExtension = extensionInstance;

  console.info("Designer extension fully initialized");
}

/**
 * Extension deactivation function
 */
export function deactivate(): void {
  console.info("Designer extension is now deactivated");

  if (extensionInstance) {
    extensionInstance = null;
    (globalThis as Record<string, unknown>).designerExtension = null;
  }
}

/**
 * Get the current extension instance (for testing and integration)
 */
export function getExtensionInstance(): DesignerExtension | null {
  return extensionInstance;
}
