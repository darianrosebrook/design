/**
 * @fileoverview Canvas webview provider for VS Code
 * @author @darianrosebrook
 *
 * Manages the lifecycle of the canvas webview, handling document loading,
 * selection updates, and property changes with proper validation.
 */

import { createHash } from "crypto";
import type { CanvasDocumentType } from "@paths-design/canvas-schema";
import type {
  SelectionState,
  PropertyChangeEvent,
} from "@paths-design/properties-panel";
import * as vscode from "vscode";
import { DocumentStore } from "../document-store";
import { validateMessage } from "../protocol/messages";
import { SelectionCoordinator } from "./selection-coordinator";

/**
 * Simple observability implementation for CAWS compliance
 */
class Observability {
  private logs: Array<{
    timestamp: number;
    level: string;
    message: string;
    context?: unknown;
  }> = [];
  private metrics: Map<string, number> = new Map();
  private traces: Array<{
    id: string;
    start: number;
    end?: number;
    name: string;
  }> = [];

  log(level: string, message: string, context?: unknown): void {
    this.logs.push({ timestamp: Date.now(), level, message, context });
    console.log(`[${level.toUpperCase()}] ${message}`, context);
  }

  metric(name: string, value: number): void {
    this.metrics.set(name, value);
  }

  startTrace(name: string): string {
    const id = `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.traces.push({ id, start: Date.now(), name });
    return id;
  }

  endTrace(id: string): void {
    const trace = this.traces.find((t) => t.id === id);
    if (trace) {
      trace.end = Date.now();
    }
  }

  getLogs(): Array<{
    timestamp: number;
    level: string;
    message: string;
    context?: unknown;
  }> {
    return [...this.logs];
  }

  getMetrics(): Map<string, number> {
    return new Map(this.metrics);
  }

  getTraces(): Array<{
    id: string;
    start: number;
    end?: number;
    name: string;
  }> {
    return [...this.traces];
  }
}

/**
 * Canvas webview provider
 * Hosts the bundled canvas renderer and properties panel
 */
export class CanvasWebviewProvider {
  public static readonly viewType = "designer.canvas";

  private _panel: vscode.WebviewPanel | undefined;
  private _document: CanvasDocumentType | undefined;
  private _documentFilePath: vscode.Uri | undefined;
  private _selection: SelectionState = {
    selectedNodeIds: [],
    focusedNodeId: null,
  };
  private _isReady = false;
  private _observability: Observability;
  private _documentStore: DocumentStore;
  private _selectionCoordinator: SelectionCoordinator;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly extensionInstance: unknown
  ) {
    this._observability = new Observability();
    this._documentStore = DocumentStore.getInstance();
    this._selectionCoordinator = SelectionCoordinator.getInstance();
  }

  /**
   * Check if canvas webview is enabled via feature flag
   */
  private _isWebviewEnabled(): boolean {
    // Check environment variable for feature flag
    return process.env.DESIGNER_WEBVIEW_ENABLED !== "false";
  }

  /**
   * Show or reveal the canvas webview
   */
  public async show(documentUri?: vscode.Uri): Promise<void> {
    console.log(
      "[CanvasWebviewProvider] Show called with URI:",
      documentUri?.fsPath
    ); // Check feature flag for rollback capability
    if (!this._isWebviewEnabled()) {
      this._observability.log("warn", "canvas_webview.disabled", {
        reason: "Feature flag designer.webview.enabled is false",
      });
      vscode.window.showWarningMessage(
        "Canvas Designer is currently disabled. Enable via DESIGNER_WEBVIEW_ENABLED=true"
      );
      return;
    }

    const traceId = this._observability.startTrace("canvas_webview.lifecycle");
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, reveal it
    if (this._panel) {
      this._observability.log("info", "canvas_webview.open", {
        documentId: this._document?.id,
        nodeCount: this._document ? this._countNodes(this._document) : 0,
      });
      this._panel.reveal(column);

      // Load new document if provided
      if (documentUri) {
        await this.loadDocument(documentUri);
      }
      this._observability.endTrace(traceId);
      return;
    }

    // Create new webview panel
    this._panel = vscode.window.createWebviewPanel(
      CanvasWebviewProvider.viewType,
      "Canvas Designer",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(this.context.extensionUri, "dist", "webviews"),
        ],
        retainContextWhenHidden: true,
      }
    );

    // Set the webview's HTML
    this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);

    // Register with selection coordinator
    this._selectionCoordinator.registerWebviewPanel(this._panel);

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        await this._handleMessage(message);
      },
      null,
      this.context.subscriptions
    );

    // Handle panel disposal
    this._panel.onDidDispose(
      () => {
        this._panel = undefined;
        this._isReady = false;
      },
      null,
      this.context.subscriptions
    );

    // Load document if provided
    if (documentUri) {
      await this.loadDocument(documentUri);
    }
  }

  /**
   * Count nodes in a document for observability
   */
  private _countNodes(document: CanvasDocumentType): number {
    let count = 0;
    const traverse = (nodes: any[]) => {
      nodes.forEach((node) => {
        count++;
        // Ensure node.children is an array, defaulting to empty array if undefined
        const nodeChildren = Array.isArray(node.children) ? node.children : [];
        if (nodeChildren.length > 0) {
          traverse(nodeChildren);
        }
      });
    };

    document.artboards.forEach((artboard) => {
      // Ensure children is an array, defaulting to empty array if undefined
      const children = Array.isArray(artboard.children)
        ? artboard.children
        : [];
      if (children.length > 0) {
        traverse(children);
      }
    });

    return count;
  }

  /**
   * Load a canvas document from file
   */
  public async loadDocument(uri: vscode.Uri): Promise<void> {
    const traceId = this._observability.startTrace(
      "canvas_webview.loadDocument"
    );
    try {
      const content = await vscode.workspace.fs.readFile(uri);
      let document: CanvasDocumentType;

      console.log(
        `[CanvasWebviewProvider] Starting document load for: ${uri.fsPath}`
      );
      try {
        document = JSON.parse(content.toString()) as CanvasDocumentType;
      } catch (parseError) {
        // If parsing fails and auto-initialization is enabled, create empty document
        if (this._shouldAutoInitialize()) {
          document = await this._createEmptyDocument(uri);
          this._observability.log(
            "info",
            "canvas_webview.auto_initialized_parse_error",
            {
              path: uri.fsPath,
              reason: "JSON parse error",
            }
          );
        } else {
          throw parseError;
        }
      }

      // Validate the document (with migration support and performance monitoring)
      const { validateDocumentWithPerformance, PerformanceMonitor } =
        await import("@paths-design/canvas-schema");
      const validation = validateDocumentWithPerformance(document);

      // Check if performance budget monitoring is enabled
      const enableBudgetMonitoring = vscode.workspace
        .getConfiguration("designer")
        .get("performance.enableBudgetMonitoring", true);

      if (
        enableBudgetMonitoring &&
        validation.performance &&
        !validation.performance.withinBudget
      ) {
        // Show performance warnings
        validation.performance.warnings.forEach((warning) => {
          vscode.window.showWarningMessage(`Performance Warning: ${warning}`);
        });

        this._observability.log(
          "warn",
          "canvas_webview.performance_budget_exceeded",
          {
            warnings: validation.performance.warnings,
            metrics: validation.performance.metrics,
          }
        );
      }

      // Start performance monitoring for document load
      const monitor = PerformanceMonitor.getInstance();
      const operationId = `load_document_${document.id}`;
      monitor.startOperation(operationId);

      let duration: number | undefined;
      let finalDocument: CanvasDocumentType | null = null;
      let operationEnded = false;

      try {
        if (!validation.success) {
          // If validation fails and auto-initialization is enabled, create empty document
          if (this._shouldAutoInitialize()) {
            document = await this._createEmptyDocument(uri);
            this._observability.log(
              "info",
              "canvas_webview.auto_initialized_validation_error",
              {
                path: uri.fsPath,
                errors: validation.errors,
              }
            );
          } else {
            throw new Error(
              `Invalid canvas document: ${validation.errors?.join(", ")}`
            );
          }
        } else if (validation.migrated) {
          // Document was migrated - save the migrated version
          this._observability.log("info", "canvas_webview.document_migrated", {
            path: uri.fsPath,
            fromVersion: document.schemaVersion,
            toVersion: validation.data!.schemaVersion,
          });

          // Save the migrated document back to disk
          try {
            const { canonicalizeDocument } = await import(
              "@paths-design/canvas-schema"
            );
            const jsonContent = canonicalizeDocument(validation.data!);
            await vscode.workspace.fs.writeFile(
              uri,
              Buffer.from(jsonContent, "utf8")
            );

            // Show migration notification
            vscode.window.showInformationMessage(
              `Document migrated from schema version ${
                document.schemaVersion
              } to ${validation.data!.schemaVersion}`
            );
          } catch (saveError) {
            this._observability.log(
              "warn",
              "canvas_webview.migration_save_failed",
              {
                path: uri.fsPath,
                error:
                  saveError instanceof Error
                    ? saveError.message
                    : "Unknown error",
              }
            );
          }
        }

        finalDocument = validation.migrated ? validation.data! : document;
        this._document = finalDocument;
        this._documentFilePath = uri;
        this._documentStore.setDocument(finalDocument, uri);

        const nodeCount = this._countNodes(finalDocument);
        this._observability.log("info", "canvas_webview.document_loaded", {
          documentId: finalDocument.id,
          nodeCount,
          path: uri.fsPath,
        });

        // End performance monitoring for document load
        duration = monitor.endOperation(operationId);
        operationEnded = true;

        // Record memory usage estimate
        if (validation.performance) {
          monitor.recordMemoryUsage(
            operationId,
            validation.performance.metrics.estimatedMemoryMB * 1024 * 1024
          );
        }

        // Check if operation exceeded time budget
        if (duration && monitor.exceedsTimeBudget(duration)) {
          vscode.window.showWarningMessage(
            `Document load took ${duration.toFixed(
              2
            )}ms, exceeding recommended limit of 30000ms`
          );
        }

        // Send to webview if ready
        if (this._panel && this._isReady) {
          await this._panel.webview.postMessage({
            command: "setDocument",
            document: finalDocument,
          });
        }
      } finally {
        // Ensure operation is always ended, even on exceptions
        if (!operationEnded) {
          try {
            monitor.endOperation(operationId);
          } catch (endError) {
            // If ending operation fails, log but don't throw
            this._observability.log(
              "warn",
              "canvas_webview.end_operation_failed",
              {
                operationId,
                error:
                  endError instanceof Error
                    ? endError.message
                    : "Unknown error",
              }
            );
          }
        }
      }

      this._observability.metric("canvas_webview_bundle_size_bytes", 0); // TODO: Get actual size
      this._observability.endTrace(traceId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this._observability.log("error", "canvas_webview.load_failed", {
        path: uri.fsPath,
        error: errorMessage,
      });

      vscode.window.showErrorMessage(
        `Failed to load canvas document: ${errorMessage}`
      );
      this._observability.endTrace(traceId);
    }
  }

  /**
   * Check if auto-initialization is enabled
   */
  private _shouldAutoInitialize(): boolean {
    return vscode.workspace
      .getConfiguration("designer")
      .get("webview.autoInitialize", true);
  }

  /**
   * Create an empty document and save it to disk
   */
  private async _createEmptyDocument(
    uri: vscode.Uri
  ): Promise<CanvasDocumentType> {
    const { createEmptyDocument, canonicalizeDocument } = await import(
      "@paths-design/canvas-schema"
    );

    // Extract name from filename
    const filename = uri.fsPath.split("/").pop() || "canvas";
    const documentName = filename.replace(".canvas.json", "");

    const document = createEmptyDocument(documentName);
    const jsonContent = canonicalizeDocument(document);

    // Save to disk
    await vscode.workspace.fs.writeFile(uri, Buffer.from(jsonContent, "utf8"));

    // Show toast notification
    vscode.window.showInformationMessage(
      `Initialized empty canvas for "${documentName}"`
    );

    return document;
  }

  /**
   * Update selection
   */
  public setSelection(selection: SelectionState): void {
    this._selection = selection;

    this._observability.log("info", "canvas_webview.selection_change", {
      selectionSize: selection.selectedNodeIds.length,
      focusedNodeId: selection.focusedNodeId,
    });

    if (this._panel && this._isReady) {
      this._panel.webview.postMessage({
        command: "setSelection",
        selection,
      });
    }
  }

  /**
   * Get the current document
   */
  public getDocument(): CanvasDocumentType | undefined {
    return this._document;
  }

  /**
   * Set the current canvas document
   */
  setDocument(document: CanvasDocumentType, filePath?: vscode.Uri): void {
    this._document = document;
    this._documentFilePath = filePath;
    this._documentStore.setDocument(document, filePath);

    if (this._panel && this._isReady) {
      this._panel.webview.postMessage({
        command: "setDocument",
        document,
      });
    }
  }

  /**
   * Get the current selection
   */
  public getSelection(): SelectionState {
    return this._selection;
  }

  /**
   * Zoom in on the canvas
   */
  public zoomIn(): void {
    if (this._panel && this._isReady) {
      this._panel.webview.postMessage({
        command: "zoomIn",
      });
    }
  }

  /**
   * Zoom out on the canvas
   */
  public zoomOut(): void {
    if (this._panel && this._isReady) {
      this._panel.webview.postMessage({
        command: "zoomOut",
      });
    }
  }

  /**
   * Fit canvas to screen
   */
  public zoomFit(): void {
    if (this._panel && this._isReady) {
      this._panel.webview.postMessage({
        command: "zoomFit",
      });
    }
  }

  /**
   * Toggle grid visibility
   */
  public toggleGrid(): void {
    if (this._panel && this._isReady) {
      this._panel.webview.postMessage({
        command: "toggleGrid",
      });
    }
  }

  /**
   * Toggle snap to grid
   */
  public toggleSnap(): void {
    if (this._panel && this._isReady) {
      this._panel.webview.postMessage({
        command: "toggleSnap",
      });
    }
  }

  /**
   * Set the view mode (canvas or code)
   */
  public setViewMode(mode: "canvas" | "code"): void {
    if (this._panel && this._isReady) {
      this._panel.webview.postMessage({
        command: "viewModeChange",
        mode: mode,
      });
    }
  }

  /**
   * Handle messages from the webview with protocol validation
   */
  private async _handleMessage(rawMessage: unknown): Promise<void> {
    // Validate message against protocol schema
    const validation = validateMessage(rawMessage);
    if (!validation.success) {
      console.error(
        "Invalid message received:",
        validation.error,
        validation.details,
        "Raw message:",
        rawMessage
      );
      throw new Error(`Invalid message: ${validation.error}`);
    }

    const message = validation.data as any;
    switch (message.type) {
      case "ready":
        this._isReady = true;
        console.info("Canvas webview ready");

        this._applySelectionModeSettings();

        // Send current document and selection first
        if (this._document && this._panel) {
          await this._panel.webview.postMessage({
            command: "setDocument",
            document: this._document,
          });
          console.info("Sent document to webview");

          if (this._selection) {
            await this._panel.webview.postMessage({
              command: "setSelection",
              selection: this._selection,
            });
            console.info("Sent selection to webview");
          }
        }

        // Set default view mode to canvas after document is sent
        this.setViewMode("canvas");
        console.info("Set initial view mode to canvas");
        break;

      case "selectionChange":
        const selectionMsg = message as any; // Type assertion for discriminated union
        const nodeIds = selectionMsg.payload.nodeIds;
        const newSelection = {
          selectedNodeIds: nodeIds,
          focusedNodeId: nodeIds[0] || null,
        };

        // Update selection through coordinator
        await this._selectionCoordinator.updateSelection(
          newSelection,
          this._panel
        );

        // Keep local reference in sync
        this._selection = newSelection;
        break;

      case "propertyChange":
        await this._handlePropertyChange(message.payload.event);
        break;

      case "loadDocument":
        const loadMsg = message as any; // Type assertion for discriminated union
        await this.loadDocument(vscode.Uri.file(loadMsg.payload.path));
        break;

      case "saveDocument":
        const saveMsg = message as any; // Type assertion for discriminated union
        try {
          const result = await this._documentStore.saveDocument();
          if (result.success) {
            this._observability.log("info", "document_saved_via_webview", {
              path: saveMsg.payload.path,
            });
          } else {
            this._observability.log(
              "error",
              "document_save_failed_via_webview",
              {
                path: saveMsg.payload.path,
                error: result.error,
              }
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          this._observability.log("error", "document_save_exception", {
            path: saveMsg.payload.path,
            error: errorMessage,
          });
        }
        break;

      case "selectionModeChange":
        if (!this._panel) {
          break;
        }

        await this._selectionCoordinator.setSelectionMode(
          message.payload.mode,
          message.payload.config,
          this._panel
        );
        break;

      case "selectionOperation":
        if (!this._panel) {
          break;
        }

        await this._selectionCoordinator.handleSelectionOperation(
          message.payload.result,
          message.payload.mode,
          this._panel
        );
        break;

      case "zoom":
        // Handle zoom level from toolbar
        console.info("Zoom level set:", message.level);
        break;

      case "zoomFit":
        // Handle zoom fit
        console.info("Zoom fit requested");
        break;

      case "toggleGrid":
        // Handle grid toggle
        console.info("Grid toggle requested");
        break;

      case "toggleSnap":
        // Handle snap toggle
        console.info("Snap toggle requested");
        break;

      case "undo":
        // Handle undo
        console.info("Undo requested");
        break;

      case "redo":
        // Handle redo
        console.info("Redo requested");
        break;

      case "save":
        // Handle save
        console.info("Save requested");
        break;

      case "viewModeChange":
        // Handle view mode change request from webview
        console.info("View mode change requested:", message.payload.mode);

        // Respond by setting the requested view mode
        if (this._panel && this._isReady) {
          this._panel.webview.postMessage({
            command: "viewModeChange",
            mode: message.payload.mode,
          });
          console.info(
            "Sent view mode change command to webview:",
            message.payload.mode
          );
        }
        break;

      case "canvasClick":
        console.info("Canvas clicked:", message.payload);
        // TODO: Handle canvas click for selection
        break;

      case "createNode":
        console.info("Creating node:", message.payload);

        if (this._document && this._documentFilePath) {
          try {
            // Add the new node to the document
            const newNode = {
              id: message.payload.id,
              type: message.payload.type,
              x: message.payload.x,
              y: message.payload.y,
              width: message.payload.width,
              height: message.payload.height,
              properties: message.payload.properties,
              children: [],
            };

            // Add to the first artboard's children (assuming single artboard for now)
            if (
              this._document.artboards &&
              this._document.artboards.length > 0
            ) {
              const artboard = this._document.artboards[0];
              if (!artboard.children) {
                artboard.children = [];
              }
              artboard.children.push(newNode);

              // Save the updated document
              await this._documentStore.saveDocument();

              console.info("Node created and document saved:", newNode.id);

              // Update the selection to the new node
              const newSelection = {
                selectedNodeIds: [newNode.id],
                focusedNodeId: newNode.id,
              };
              this.setSelection(newSelection);
            }
          } catch (error) {
            console.error("Failed to create node:", error);
          }
        }
        break;

      case "wrapModeChange":
        console.info("Wrap mode change:", message.payload.mode);
        // Handle wrap mode change - could trigger node creation
        break;

      case "typeModeChange":
        console.info("Type mode change:", message.payload.mode);
        // Handle type mode change - could trigger text node creation
        break;

      case "imageModeChange":
        console.info("Image mode change:", message.payload.mode);
        // Handle image mode change - could trigger image node creation
        break;

      case "shapeModeChange":
        console.info("Shape mode change:", message.payload.mode);
        // Handle shape mode change - could trigger shape node creation
        break;
      case "validateDocument":
        // TODO: Implement validation
        console.info("Document validation requested");
        break;

      default:
        console.warn(
          "Unknown message type:",
          (message as { type: string }).type
        );
    }
  }

  /**
   * Apply feature flag and default selection mode settings.
   */
  private _applySelectionModeSettings(): void {
    const config = vscode.workspace.getConfiguration("designer.selectionModes");
    const selectionModesEnabled = config.get<boolean>("enabled", true);
    const defaultMode = config.get<"single" | "rectangle" | "lasso">(
      "default",
      "single"
    );

    if (!selectionModesEnabled) {
      void this._selectionCoordinator.setSelectionMode("single");
      if (this._panel) {
        this._panel.webview.postMessage({
          command: "setSelectionMode",
          mode: "single",
          config: {
            mode: "single",
            multiSelect: false,
            preserveSelection: false,
          },
        });
      }
      return;
    }

    void this._selectionCoordinator.setSelectionMode(defaultMode);
    if (this._panel) {
      this._panel.webview.postMessage({
        command: "setSelectionMode",
        mode: defaultMode,
        config: {
          mode: defaultMode,
          multiSelect: false,
          preserveSelection: false,
        },
      });
    }
  }

  /**
   * Handle property change from webview
   */
  private async _handlePropertyChange(
    event: PropertyChangeEvent
  ): Promise<void> {
    const traceId = this._observability.startTrace(
      "canvas_webview.property_change"
    );
    try {
      if (!this._document || !this._documentFilePath) {
        throw new Error("No document loaded");
      }

      this._observability.log("info", "canvas_webview.property_change", {
        nodeId: event.nodeId,
        propertyKey: event.propertyKey,
        oldValue: event.oldValue,
        newValue: event.newValue,
      });

      // Apply property change through DocumentStore (canvas-engine)
      const result = await this._documentStore.applyPropertyChange(
        event.nodeId,
        event.propertyKey,
        event.newValue,
        event.oldValue
      );

      if (!result.success) {
        this._observability.log("error", "property_change_engine_failed", {
          nodeId: event.nodeId,
          propertyKey: event.propertyKey,
          error: result.error,
        });

        if (this._panel) {
          await this._panel.webview.postMessage({
            command: "showError",
            error: `Failed to apply property change: ${result.error}`,
          });
        }
        return;
      }

      // Update local document reference
      if (result.document) {
        this._document = result.document;
      }

      // Acknowledge the change
      if (this._panel) {
        await this._panel.webview.postMessage({
          command: "propertyChangeAcknowledged",
          event,
        });
      }

      this._observability.endTrace(traceId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this._observability.log(
        "error",
        "canvas_webview.property_change_failed",
        {
          nodeId: event.nodeId,
          propertyKey: event.propertyKey,
          error: errorMessage,
        }
      );

      if (this._panel) {
        await this._panel.webview.postMessage({
          command: "showError",
          error: `Failed to apply property change: ${errorMessage}`,
        });
      }
      this._observability.endTrace(traceId);
    }
  }

  /**
   * Get HTML for the webview
   */
  private _getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "dist",
        "webviews",
        "canvas.js"
      )
    );

    const nonce = this._getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'none';
    script-src ${webview.cspSource} 'nonce-${nonce}';
    style-src ${webview.cspSource} 'unsafe-inline';
    img-src ${webview.cspSource} data:;
    font-src ${webview.cspSource};
  ">
  <title>Canvas Designer</title>
</head>
<body>
  <div id="root">
    <!-- Placeholder content for debugging -->
    <div class="canvas-webview">
      <div class="canvas-layout">
        <div class="top-navigation">Loading...</div>
        <div class="main-content" data-debug="main-content-canvas">Loading...</div>
      </div>
    </div>
  </div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  /**
   * Generate a deterministic nonce for CSP
   * Uses build hash + timestamp for deterministic but unique nonces
   */
  private _getNonce(): string {
    // Use build hash + current timestamp for deterministic nonce generation
    const buildHash = process.env.BUILD_HASH || "unknown";
    const timestamp = Date.now().toString();

    const hash = createHash("sha256")
      .update(`${buildHash}-${timestamp}`)
      .digest("hex");

    // Return first 32 characters for CSP nonce
    return hash.substring(0, 32);
  }

  /**
   * Update the document in the canvas webview
   */
  updateDocument(document: CanvasDocumentType): void {
    this._document = document;

    if (this._panel) {
      this._panel.webview.postMessage({
        command: "setDocument",
        document,
      });
    }
  }

  /**
   * Notify the canvas renderer about a property change
   */
  notifyPropertyChange(event: PropertyChangeEvent): void {
    if (this._panel) {
      this._panel.webview.postMessage({
        command: "propertyChangedFromExtension",
        event,
      });
    }
  }
}
