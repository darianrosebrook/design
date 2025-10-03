/**
 * @fileoverview VS Code Extension for Designer
 * @author @darianrosebrook
 *
 * Main entry point for the Designer VS Code extension.
 * Provides secure message protocol, workspace file access, and UI components.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { CanvasDocumentType, NodeType } from "@paths-design/canvas-schema";
import type { ComponentIndex } from "@paths-design/component-indexer";
import type {
  SelectionState,
  PropertyChangeEvent,
} from "@paths-design/properties-panel";
import { PropertiesService } from "@paths-design/properties-panel";
import * as vscode from "vscode";
import { FontCatalogService } from "./api/font-catalog";
import { SelectionAPI } from "./api/selection-api";
import { CanvasWebviewProvider } from "./canvas-webview/canvas-webview-provider";
import { SelectionCoordinator } from "./canvas-webview/selection-coordinator";
import { registerSelectionCommands } from "./commands/selection-commands";
import { DocumentStore } from "./document-store";
import { PropertiesPanelWebviewProvider } from "./properties-panel-webview";
import { WelcomeViewProvider } from "./welcome-view";

export * from "./protocol/index.js";
export * from "./security/index.js";

/**
 * Simple achievement system for tracking milestones
 */
class AchievementSystem {
  trackMilestone(milestone: string, count: number = 1): void {
    // Simple implementation - could be expanded to track actual achievements
    console.log(`Achievement: ${milestone} (+${count})`);
  }
}

class DesignerExtension {
  private context: vscode.ExtensionContext;
  private canvasWebviewProvider: CanvasWebviewProvider;
  private propertiesPanelProvider: PropertiesPanelWebviewProvider;
  private welcomeViewProvider: WelcomeViewProvider;
  private propertiesService: PropertiesService;
  private documentStore: DocumentStore;
  private componentIndex: ComponentIndex | null = null;
  private currentDocument: CanvasDocumentType | null = null;
  private currentSelection: SelectionState = {
    selectedNodeIds: [],
    focusedNodeId: null,
  };
  private achievementSystem: AchievementSystem;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.propertiesService = PropertiesService.getInstance();
    this.documentStore = DocumentStore.getInstance();
    this.canvasWebviewProvider = new CanvasWebviewProvider(context, this);
    this.propertiesPanelProvider = new PropertiesPanelWebviewProvider(context);
    this.achievementSystem = new AchievementSystem();
    this.welcomeViewProvider = new WelcomeViewProvider(context);

    // Initialize SelectionAPI and connect to coordinator events
    const selectionAPI = SelectionAPI.getInstance();
    const apiDisposable = selectionAPI.initialize();
    context.subscriptions.push(apiDisposable);

    // Initialize FontCatalogService (accessed via commands)
    FontCatalogService.getInstance(context);

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
    } catch (_error) {
      console.warn("Failed to load component index:", _error);
    }

    // TODO: Implement startup guide functionality
    // this.showStartupGuide().catch(console.error);
  }

  /**
   * Register extension commands
   */
  private registerCommands(): void {
    // Command to create a new canvas document
    const createCanvasDocumentCommand = vscode.commands.registerCommand(
      "designer.createCanvasDocument",
      async (uri?: vscode.Uri) => {
        const workspaceFolder = uri
          ? vscode.workspace.getWorkspaceFolder(uri)
          : vscode.workspace.workspaceFolders?.[0];

        if (!workspaceFolder) {
          vscode.window.showErrorMessage("No workspace folder available");
          return;
        }

        // Prompt for filename with security validation and organization guidance
        const filename = await vscode.window.showInputBox({
          prompt:
            "Enter canvas document name (recommended: design/homepage.canvas.json)",
          placeHolder: "design/homepage.canvas.json",
          value: "design/home.canvas.json",
          validateInput: (value: string) => {
            // Basic extension check
            if (!value.endsWith(".canvas.json")) {
              return "Filename must end with .canvas.json";
            }

            // Validate and sanitize path for security
            const validation = this._validateAndSanitizePath(value);
            if (validation.error) {
              return validation.error;
            }

            // Check for reserved names
            const baseName =
              value.replace(".canvas.json", "").split("/").pop() || "";
            if (this._isReservedFilename(baseName)) {
              return "This filename is reserved";
            }

            // Organization guidance
            if (!value.includes("/") && !value.startsWith("design/")) {
              return "Consider organizing in design/ folder (e.g., design/homepage.canvas.json)";
            }

            return null;
          },
        });

        if (!filename) {
          return;
        }

        // Create the document
        const { createEmptyDocument, canonicalizeDocument } = await import(
          "@paths-design/canvas-schema"
        );
        const documentName = filename.replace(".canvas.json", "");
        const canvasDoc = createEmptyDocument(documentName);
        const jsonContent = canonicalizeDocument(canvasDoc);

        // Write to file with path validation and overwrite protection
        const fileUri = vscode.Uri.joinPath(workspaceFolder.uri, filename);

        // Additional security check: ensure path is within workspace
        if (!this._isPathWithinWorkspace(fileUri, workspaceFolder.uri)) {
          vscode.window.showErrorMessage(
            "Cannot create file outside workspace"
          );
          return;
        }

        // Check if file already exists and prompt for confirmation
        try {
          await vscode.workspace.fs.stat(fileUri);
          const confirmOverwrite = await vscode.window.showWarningMessage(
            `File "${filename}" already exists. Do you want to overwrite it?`,
            "Overwrite",
            "Cancel"
          );

          if (confirmOverwrite !== "Overwrite") {
            vscode.window.showInformationMessage(
              "Canvas document creation cancelled"
            );
            return;
          }
        } catch (_error) {
          // File doesn't exist, proceed with creation
        }

        // Write file with error handling and cleanup
        let fileCreated = false;
        try {
          await vscode.workspace.fs.writeFile(
            fileUri,
            Buffer.from(jsonContent, "utf8")
          );
          fileCreated = true;

          // Ask user how they want to open the new document
          const choice = await vscode.window.showInformationMessage(
            `Created canvas document: ${filename}`,
            "Open in Designer",
            "View JSON"
          );

          if (choice === "Open in Designer") {
            // Open in designer
            await this.canvasWebviewProvider.show(fileUri);
          } else {
            // Open as JSON (default if no choice made)
            const document = await vscode.workspace.openTextDocument(fileUri);
            await vscode.window.showTextDocument(document);
          }

          // Track milestone
          this.achievementSystem.trackMilestone("documents_created");
        } catch (_error) {
          // Clean up partial file if write failed
          if (fileCreated && _error instanceof Error) {
            try {
              // Check if file exists and is empty/truncated
              const stat = await vscode.workspace.fs.stat(fileUri);
              if (stat.size < jsonContent.length) {
                // File appears truncated, attempt cleanup
                try {
                  await vscode.workspace.fs.delete(fileUri);
                  vscode.window.showWarningMessage(
                    `File creation failed and partial file was cleaned up: ${filename}`
                  );
                } catch (_cleanupError) {
                  vscode.window.showWarningMessage(
                    `File creation failed. Please manually delete: ${filename}`
                  );
                }
              }
            } catch (_statError) {
              // File may not exist, continue with error message
            }
          }

          // Show appropriate error message based on error type
          const errorMessage =
            _error instanceof Error ? _error.message : "Unknown error";
          if (
            errorMessage.includes("EPERM") ||
            errorMessage.includes("EACCES")
          ) {
            vscode.window.showErrorMessage(
              `Permission denied creating ${filename}. Check file permissions.`
            );
          } else if (errorMessage.includes("ENOSPC")) {
            vscode.window.showErrorMessage(
              `Insufficient disk space to create ${filename}.`
            );
          } else {
            vscode.window.showErrorMessage(
              `Failed to create canvas document ${filename}: ${errorMessage}`
            );
          }
        }
      }
    );

    // Command to create component library
    const createComponentLibraryCommand = vscode.commands.registerCommand(
      "designer.createComponentLibrary",
      async () => {
        const libraryName = await vscode.window.showInputBox({
          prompt: "Enter component library name",
          placeHolder: "My Components",
          value: "components",
        });

        if (!libraryName) {
          return;
        }

        const { createEmptyComponentLibrary, canonicalizeDocument } =
          await import("@paths-design/canvas-schema");

        const library = createEmptyComponentLibrary(libraryName);
        const jsonContent = canonicalizeDocument(library);

        // Create in design directory
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
          vscode.window.showErrorMessage("No workspace folder available");
          return;
        }

        const designDir = vscode.Uri.joinPath(workspaceFolder.uri, "design");
        const libraryUri = vscode.Uri.joinPath(
          designDir,
          `${libraryName}.components.json`
        );

        // Ensure design directory exists
        try {
          await vscode.workspace.fs.createDirectory(designDir);
        } catch (_error) {
          // Directory might already exist, continue
        }

        await vscode.workspace.fs.writeFile(
          libraryUri,
          Buffer.from(jsonContent, "utf8")
        );

        vscode.window.showInformationMessage(
          `Created component library: ${libraryName}.components.json`
        );
      }
    );

    // Command to create component from selection
    const createComponentFromSelectionCommand = vscode.commands.registerCommand(
      "designer.createComponentFromSelection",
      async () => {
        // Get current selection from the canvas webview
        const selection = this.getCurrentSelection();
        if (selection.selectedNodeIds.length === 0) {
          vscode.window.showWarningMessage("No nodes selected");
          return;
        }

        if (!this.currentDocument) {
          vscode.window.showErrorMessage("No active document");
          return;
        }

        // Find the selected node
        const selectedNode = this._findNodeById(
          this.currentDocument,
          selection.selectedNodeIds[0]
        );
        if (!selectedNode) {
          vscode.window.showErrorMessage("Selected node not found");
          return;
        }

        // Prompt for component details
        const componentName = await vscode.window.showInputBox({
          prompt: "Enter component name",
          placeHolder: "Button",
          value: selectedNode.name || "Component",
        });

        if (!componentName) {
          return;
        }

        const componentDescription = await vscode.window.showInputBox({
          prompt: "Enter component description (optional)",
          placeHolder: "A reusable button component",
        });

        // Create the component
        const { createComponentFromNode } = await import(
          "@paths-design/canvas-schema"
        );
        const component = createComponentFromNode(
          selectedNode,
          componentName,
          componentDescription
        );

        vscode.window.showInformationMessage(
          `Created component "${componentName}" with ID: ${component.id}`
        );

        // Track milestone
        this.achievementSystem.trackMilestone("components_created");

        // TODO: Add to component library
        // For now, just show the component definition
        const componentJson = JSON.stringify(component, null, 2);
        const doc = await vscode.workspace.openTextDocument({
          content: componentJson,
          language: "json",
        });
        await vscode.window.showTextDocument(doc);
      }
    );

    // Command to show component library
    const showComponentLibraryCommand = vscode.commands.registerCommand(
      "designer.showComponentLibrary",
      async () => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
          vscode.window.showErrorMessage("No workspace folder available");
          return;
        }

        // Look for component library files
        const designDir = vscode.Uri.joinPath(workspaceFolder.uri, "design");
        const libraryPattern = new vscode.RelativePattern(
          designDir,
          "*.components.json"
        );

        try {
          const libraryFiles = await vscode.workspace.findFiles(libraryPattern);

          if (libraryFiles.length === 0) {
            vscode.window.showInformationMessage(
              "No component libraries found. Create one first."
            );
            return;
          }

          // Show quick pick of available libraries
          const selectedLibrary = await vscode.window.showQuickPick(
            libraryFiles.map((file) => ({
              label: `$(package) ${vscode.workspace.asRelativePath(file)}`,
              description: "Component Library",
              uri: file,
            })),
            {
              placeHolder: "Select a component library to open",
            }
          );

          if (selectedLibrary) {
            const document = await vscode.workspace.openTextDocument(
              selectedLibrary.uri
            );
            await vscode.window.showTextDocument(document);
          }
        } catch (_error) {
          vscode.window.showErrorMessage("Failed to find component libraries");
        }
      }
    );

    // Command to show keyboard shortcuts
    const showKeyboardShortcutsCommand = vscode.commands.registerCommand(
      "designer.showKeyboardShortcuts",
      async () => {
        const shortcuts = [
          {
            key: "Ctrl+Shift+C",
            description: "Create component from selection",
          },
          { key: "Ctrl+Shift+L", description: "Show component library" },
          { key: "Ctrl+Shift+S", description: "Toggle selection mode" },
          {
            key: "R",
            description: "Rectangle selection mode",
            context: "in canvas",
          },
          {
            key: "L",
            description: "Lasso selection mode",
            context: "in canvas",
          },
          {
            key: "V",
            description: "Single selection mode",
            context: "in canvas",
          },
          { key: "Ctrl+Shift+N", description: "Create new canvas document" },
          { key: "Ctrl+O", description: "Open canvas document" },
          { key: "Ctrl+Shift+P", description: "Show performance metrics" },
        ];

        const content = `## Designer Keyboard Shortcuts

${shortcuts
  .map(
    (s) =>
      `**${s.key}** - ${s.description}${s.context ? ` *(${s.context})*` : ""}`
  )
  .join("\n")}

*Tip: Use Cmd+K Cmd+S (macOS) or Ctrl+K Ctrl+S (Windows/Linux) to view all VS Code shortcuts*`;

        const doc = await vscode.workspace.openTextDocument({
          content,
          language: "markdown",
        });
        await vscode.window.showTextDocument(doc);
      }
    );

    // Command to show performance metrics
    const showPerformanceMetricsCommand = vscode.commands.registerCommand(
      "designer.showPerformanceMetrics",
      async () => {
        const { PerformanceMonitor } = await import(
          "@paths-design/canvas-schema"
        );
        const monitor = PerformanceMonitor.getInstance();
        const metrics = monitor.getMetrics();

        const content = `# Designer Performance Metrics

## Operation Counts
${Object.entries(metrics.operationCounts)
  .map(([op, count]) => `- **${op}**: ${count} operations`)
  .join("\n")}

## Memory Usage
${Object.entries(metrics.memoryUsage)
  .map(([op, bytes]) => `- **${op}**: ${(bytes / 1024 / 1024).toFixed(2)} MB`)
  .join("\n")}

## Configuration
- Memory Budget: ${vscode.workspace
          .getConfiguration("designer")
          .get("performance.memoryBudgetMB", 100)} MB
- Max Nodes: ${vscode.workspace
          .getConfiguration("designer")
          .get("performance.maxNodesPerDocument", 10000)}
- Budget Monitoring: ${
          vscode.workspace
            .getConfiguration("designer")
            .get("performance.enableBudgetMonitoring", true)
            ? "Enabled"
            : "Disabled"
        }

*Performance metrics reset on extension reload*`;

        const doc = await vscode.workspace.openTextDocument({
          content,
          language: "markdown",
        });
        await vscode.window.showTextDocument(doc);
      }
    );

    // Command to toggle performance budget monitoring
    const togglePerformanceBudgetCommand = vscode.commands.registerCommand(
      "designer.togglePerformanceBudget",
      async () => {
        const config = vscode.workspace.getConfiguration("designer");
        const currentValue = config.get(
          "performance.enableBudgetMonitoring",
          true
        );
        const newValue = !currentValue;

        await config.update(
          "performance.enableBudgetMonitoring",
          newValue,
          vscode.ConfigurationTarget.Global
        );

        vscode.window.showInformationMessage(
          `Performance budget monitoring ${newValue ? "enabled" : "disabled"}`
        );

        // Track milestone if enabled
        if (newValue) {
          this.achievementSystem.trackMilestone("performance_toggles");
        }
      }
    );

    // Command to open canvas designer
    const openCanvasCommand = vscode.commands.registerCommand(
      "designer.openCanvas",
      async (uri?: vscode.Uri) => {
        let documentUri = uri;

        if (!documentUri) {
          // First, look for existing canvas documents in the workspace
          const existingCanvasFiles = await this._findExistingCanvasFiles();

          if (existingCanvasFiles.length > 0) {
            // Show quick pick of existing files
            const selectedFile = await vscode.window.showQuickPick(
              existingCanvasFiles.map((file) => ({
                label: `$(file) ${file.relativePath}`,
                description: `Modified ${file.mtime}`,
                detail: file.uri.fsPath,
                uri: file.uri,
              })),
              {
                placeHolder: "Select a canvas document to open",
                matchOnDescription: true,
                matchOnDetail: true,
              }
            );

            if (selectedFile) {
              documentUri = selectedFile.uri;
            } else {
              return; // User cancelled
            }
          } else {
            // No existing files, fall back to file dialog
            const uris = await vscode.window.showOpenDialog({
              canSelectFiles: true,
              canSelectFolders: false,
              filters: {
                "Canvas Documents": ["canvas.json", "json"],
              },
              openLabel: "Open Canvas Document",
            });

            if (!uris || uris.length === 0) {
              return;
            }

            documentUri = uris[0];
          }
        }

        // Show quick-pick for canvas files
        if (documentUri.fsPath.endsWith(".canvas.json")) {
          const choice = await vscode.window.showQuickPick(
            [
              {
                label: "$(paintcan) Open in Canvas Designer",
                description: "Visual canvas editor",
                action: "designer",
              },
              {
                label: "$(json) View JSON",
                description: "Edit raw JSON source",
                action: "json",
              },
            ],
            {
              placeHolder: "How would you like to open this canvas document?",
              matchOnDescription: true,
            }
          );

          if (!choice) {
            return;
          }

          if (choice.action === "json") {
            // Open as JSON
            const document = await vscode.workspace.openTextDocument(
              documentUri
            );
            await vscode.window.showTextDocument(document);
            return;
          }
        }

        // Default: open in designer
        await this.canvasWebviewProvider.show(documentUri);
      }
    );

    // Command to view canvas source (JSON)
    const viewCanvasSourceCommand = vscode.commands.registerCommand(
      "designer.viewCanvasSource",
      async (uri?: vscode.Uri) => {
        let documentUri = uri;

        if (
          !documentUri &&
          vscode.window.activeTextEditor?.document.fileName.endsWith(
            ".canvas.json"
          )
        ) {
          documentUri = vscode.window.activeTextEditor.document.uri;
        }

        if (!documentUri) {
          vscode.window.showErrorMessage("No canvas document selected");
          return;
        }

        const document = await vscode.workspace.openTextDocument(documentUri);
        await vscode.window.showTextDocument(document);
      }
    );

    // Command to open properties panel
    const openPropertiesPanelCommand = vscode.commands.registerCommand(
      "designer.openPropertiesPanel",
      () => {
        vscode.commands.executeCommand("workbench.view.extension.designer");
      }
    );

    // Command to toggle selection mode
    const toggleSelectionModeCommand = vscode.commands.registerCommand(
      "designer.toggleSelectionMode",
      async () => {
        const selectionCoordinator = SelectionCoordinator.getInstance();
        await selectionCoordinator.toggleSelectionMode();

        const mode = selectionCoordinator.getCurrentMode();
        vscode.window.showInformationMessage(`Selection mode: ${mode}`);
      }
    );

    // Command to set selection mode to rectangle
    const setSelectionModeRectangleCommand = vscode.commands.registerCommand(
      "designer.setSelectionModeRectangle",
      async () => {
        const selectionCoordinator = SelectionCoordinator.getInstance();
        await selectionCoordinator.setSelectionMode("rectangle");

        vscode.window.showInformationMessage("Selection mode: rectangle");
      }
    );

    // Command to set selection mode to lasso
    const setSelectionModeLassoCommand = vscode.commands.registerCommand(
      "designer.setSelectionModeLasso",
      async () => {
        const selectionCoordinator = SelectionCoordinator.getInstance();
        await selectionCoordinator.setSelectionMode("lasso");

        vscode.window.showInformationMessage("Selection mode: lasso");
      }
    );

    // Command to set selection mode to single
    const setSelectionModeSingleCommand = vscode.commands.registerCommand(
      "designer.setSelectionModeSingle",
      async () => {
        const selectionCoordinator = SelectionCoordinator.getInstance();
        await selectionCoordinator.setSelectionMode("single");

        vscode.window.showInformationMessage("Selection mode: single");
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

    // Toolbar commands
    const zoomInCommand = vscode.commands.registerCommand(
      "designer.zoomIn",
      () => {
        this.canvasWebviewProvider.zoomIn();
      }
    );

    const zoomOutCommand = vscode.commands.registerCommand(
      "designer.zoomOut",
      () => {
        this.canvasWebviewProvider.zoomOut();
      }
    );

    const zoomFitCommand = vscode.commands.registerCommand(
      "designer.zoomFit",
      () => {
        this.canvasWebviewProvider.zoomFit();
      }
    );

    const toggleGridCommand = vscode.commands.registerCommand(
      "designer.toggleGrid",
      () => {
        this.canvasWebviewProvider.toggleGrid();
      }
    );

    const toggleSnapCommand = vscode.commands.registerCommand(
      "designer.toggleSnap",
      () => {
        this.canvasWebviewProvider.toggleSnap();
      }
    );

    const undoCommand = vscode.commands.registerCommand("designer.undo", () => {
      this.documentStore.undo();
      if (this.currentDocument) {
        this.updateDocument(this.currentDocument);
      }
    });

    const redoCommand = vscode.commands.registerCommand("designer.redo", () => {
      this.documentStore.redo();
      if (this.currentDocument) {
        this.updateDocument(this.currentDocument);
      }
    });

    const saveDocumentCommand = vscode.commands.registerCommand(
      "designer.saveDocument",
      async () => {
        const result = await this.documentStore.saveDocument();
        if (result.success) {
          vscode.window.showInformationMessage("Document saved successfully");
        } else {
          vscode.window.showErrorMessage(
            `Failed to save document: ${result.error}`
          );
        }
      }
    );

    const switchToCanvasViewCommand = vscode.commands.registerCommand(
      "designer.switchToCanvasView",
      () => {
        this.canvasWebviewProvider.setViewMode("canvas");
      }
    );

    const switchToCodeViewCommand = vscode.commands.registerCommand(
      "designer.switchToCodeView",
      () => {
        this.canvasWebviewProvider.setViewMode("code");
      }
    );

    const getFontsCommand = vscode.commands.registerCommand(
      "designer.getFonts",
      async () => {
        return await this.getFonts();
      }
    );

    // Register selection debugging commands
    registerSelectionCommands(this.context);

    this.context.subscriptions.push(
      createCanvasDocumentCommand,
      createComponentLibraryCommand,
      createComponentFromSelectionCommand,
      showComponentLibraryCommand,
      showKeyboardShortcutsCommand,
      showPerformanceMetricsCommand,
      togglePerformanceBudgetCommand,
      openCanvasCommand,
      viewCanvasSourceCommand,
      openPropertiesPanelCommand,
      toggleSelectionModeCommand,
      setSelectionModeRectangleCommand,
      setSelectionModeLassoCommand,
      setSelectionModeSingleCommand,
      loadDocumentCommand,
      refreshDocumentCommand,
      zoomInCommand,
      zoomOutCommand,
      zoomFitCommand,
      toggleGridCommand,
      toggleSnapCommand,
      undoCommand,
      redoCommand,
      saveDocumentCommand,
      switchToCanvasViewCommand,
      switchToCodeViewCommand,
      getFontsCommand
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

    // Welcome view
    this.context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        WelcomeViewProvider.viewType,
        this.welcomeViewProvider
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
      this.documentStore.setDocument(document, uri);
      this.updateDocument(document, uri);

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
  private updateDocument(
    document: CanvasDocumentType,
    filePath?: vscode.Uri
  ): void {
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

    // Update DocumentStore
    this.documentStore.setDocument(document, filePath);

    // Update properties panel with file path tracking
    this.propertiesPanelProvider.setDocument(document, filePath);

    // Update canvas webview
    this.canvasWebviewProvider.setDocument(document, filePath);

    // Update selection if it exists
    if (this.currentSelection.selectedNodeIds.length > 0) {
      this.propertiesPanelProvider.setSelection(this.currentSelection);
      this.canvasWebviewProvider.setSelection(this.currentSelection);
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

    try {
      // Create a JSON patch for the property change
      const artboard = this.currentDocument.artboards[0];
      const nodeIndex = artboard.children.findIndex(
        (node: any) => node.id === event.nodeId
      );

      if (nodeIndex === -1) {
        throw new Error(`Node with ID ${event.nodeId} not found`);
      }

      const patch = {
        op: "replace" as const,
        path: `/artboards/0/children/${nodeIndex}/${event.propertyKey}`,
        value: event.newValue,
      };

      // Apply the patch using DocumentStore
      const result = this.documentStore.applyPatch(
        this.currentDocument.id,
        patch
      );

      if (result.success && result.document) {
        // Update the current document
        this.currentDocument = result.document;

        // Broadcast the change to all webviews
        this.canvasWebviewProvider.updateDocument(result.document);
        this.propertiesPanelProvider.updateDocument(result.document);

        // Acknowledge the change back to the webview
        this.propertiesPanelProvider.acknowledgePropertyChange(event);

        console.info("Property change applied successfully:", event);
      } else {
        console.error("Failed to apply property change:", result.error);
        this.propertiesPanelProvider.showPropertyChangeError(
          event,
          result.error || "Unknown error"
        );
      }
    } catch (error) {
      console.error("Error handling property change:", error);
      this.propertiesPanelProvider.showPropertyChangeError(
        event,
        "Failed to apply property change"
      );
    }
  }

  /**
   * Get available fonts for the properties panel
   */
  async getFonts(): Promise<Array<{ label: string; value: string }>> {
    const fontCatalogService = FontCatalogService.getInstance(this.context);
    return await fontCatalogService.getFontOptions();
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

  /**
   * Sanitize filename for security - removes path components and unsafe characters
   */
  private _validateAndSanitizePath(path: string): {
    error?: string;
    sanitized?: string;
  } {
    // Check for path traversal attempts
    if (path.includes("..") || path.startsWith("/")) {
      return {
        error:
          "Path contains unsafe characters or attempts to access parent directories",
      };
    }

    // Split path into directory and filename parts
    const parts = path.split("/");
    const filename = parts.pop() || "";

    // Sanitize the filename part only
    const safeFilename = filename
      .replace(/\.\./g, "") // Remove path traversal attempts in filename
      .replace(/^\.+/, "") // Remove leading dots
      .replace(/[<>:*?"|]/g, ""); // Remove Windows reserved chars

    // Ensure it ends with .canvas.json
    const finalFilename = safeFilename.endsWith(".canvas.json")
      ? safeFilename
      : safeFilename + ".canvas.json";

    // Reconstruct the path
    const sanitizedPath =
      parts.length > 0 ? `${parts.join("/")}/${finalFilename}` : finalFilename;

    // If the path changed, it contained unsafe characters
    if (sanitizedPath !== path) {
      return { error: "Filename contains unsafe characters" };
    }

    return { sanitized: sanitizedPath };
  }

  private _sanitizeFilename(filename: string): string {
    // Remove any path components (/, \, ..)
    const safeFilename = filename
      .replace(/[\/\\]/g, "") // Remove path separators
      .replace(/\.\./g, "") // Remove path traversal attempts
      .replace(/^\.+/, "") // Remove leading dots
      .replace(/[<>:*?"|]/g, ""); // Remove Windows reserved chars

    // Ensure it still ends with .canvas.json
    if (!safeFilename.endsWith(".canvas.json")) {
      return safeFilename + ".canvas.json";
    }

    return safeFilename;
  }

  /**
   * Check if filename is reserved for security
   */
  private _isReservedFilename(basename: string): boolean {
    const reserved = [
      "con",
      "prn",
      "aux",
      "nul",
      "com1",
      "com2",
      "com3",
      "com4",
      "com5",
      "com6",
      "com7",
      "com8",
      "com9",
      "lpt1",
      "lpt2",
      "lpt3",
      "lpt4",
      "lpt5",
      "lpt6",
      "lpt7",
      "lpt8",
      "lpt9",
    ];
    return reserved.includes(basename.toLowerCase());
  }

  /**
   * Verify that a file path is within the workspace boundary
   */
  private _isPathWithinWorkspace(
    fileUri: vscode.Uri,
    workspaceUri: vscode.Uri
  ): boolean {
    const filePath = fileUri.fsPath;
    const workspacePath = workspaceUri.fsPath;

    // Ensure file path starts with workspace path
    if (!filePath.startsWith(workspacePath)) {
      return false;
    }

    // Additional check: ensure no parent directory traversal beyond workspace
    const relativePath = filePath.substring(workspacePath.length);
    if (relativePath.includes("../") || relativePath.startsWith("../")) {
      return false;
    }

    return true;
  }

  /**
   * Find a node by ID in a canvas document
   */
  private _findNodeById(
    document: CanvasDocumentType,
    nodeId: string
  ): NodeType | null {
    const findInNodes = (nodes: NodeType[]): NodeType | null => {
      for (const node of nodes) {
        if (node.id === nodeId) {
          return node;
        }

        if (node.children && node.children.length > 0) {
          const found = findInNodes(node.children);
          if (found) {
            return found;
          }
        }
      }
      return null;
    };

    for (const artboard of document.artboards) {
      if (artboard.children && artboard.children.length > 0) {
        const found = findInNodes(artboard.children);
        if (found) {
          return found;
        }
      }
    }

    return null;
  }

  /**
   * Find existing canvas files in the workspace
   */
  private async _findExistingCanvasFiles(): Promise<
    Array<{
      uri: vscode.Uri;
      relativePath: string;
      mtime: string;
    }>
  > {
    const canvasFiles: Array<{
      uri: vscode.Uri;
      relativePath: string;
      mtime: string;
    }> = [];

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      return canvasFiles;
    }

    // Search for canvas files in each workspace folder
    for (const folder of workspaceFolders) {
      try {
        const pattern = new vscode.RelativePattern(folder, "**/*.canvas.json");
        const files = await vscode.workspace.findFiles(
          pattern,
          "**/node_modules/**"
        );

        for (const file of files) {
          try {
            const stat = await vscode.workspace.fs.stat(file);
            const relativePath = vscode.workspace.asRelativePath(file);

            canvasFiles.push({
              uri: file,
              relativePath,
              mtime: new Date(stat.mtime).toLocaleDateString(),
            });
          } catch (_error) {
            // Skip files that can't be accessed
          }
        }
      } catch (_error) {
        // Skip folders that can't be searched
      }
    }

    // Sort by modification time (newest first)
    return canvasFiles.sort((a, b) => {
      // For simplicity, sort alphabetically for now
      // TODO: Implement proper mtime comparison
      return a.relativePath.localeCompare(b.relativePath);
    });
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
