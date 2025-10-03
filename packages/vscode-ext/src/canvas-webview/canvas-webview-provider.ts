/**
 * @fileoverview Canvas webview provider for VS Code
 * @author @darianrosebrook
 *
 * Manages the lifecycle of the canvas webview, handling document loading,
 * selection updates, and property changes with proper validation.
 */

import type { CanvasDocumentType } from "@paths-design/canvas-schema";
import type {
  SelectionState,
  PropertyChangeEvent,
} from "@paths-design/properties-panel";
import { createHash } from "crypto";
import { validateMessage } from "../protocol/messages";
import { DocumentStore } from "../document-store";
import * as vscode from "vscode";

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

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly extensionInstance: unknown
  ) {
    this._observability = new Observability();
    this._documentStore = DocumentStore.getInstance();
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
    // Check feature flag for rollback capability
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
        if (node.children) {
          traverse(node.children);
        }
      });
    };

    document.artboards.forEach((artboard) => {
      if (artboard.children) {
        traverse(artboard.children);
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
      const document = JSON.parse(content.toString()) as CanvasDocumentType;

      this._document = document;
      this._documentFilePath = uri;
      this._documentStore.setDocument(document, uri);

      const nodeCount = this._countNodes(document);
      this._observability.log("info", "canvas_webview.document_loaded", {
        documentId: document.id,
        nodeCount,
        path: uri.fsPath,
      });

      // Send to webview if ready
      if (this._panel && this._isReady) {
        await this._panel.webview.postMessage({
          command: "setDocument",
          document,
        });
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
   * Handle messages from the webview with protocol validation
   */
  private async _handleMessage(rawMessage: unknown): Promise<void> {
    // Validate message against protocol schema
    const validation = validateMessage(rawMessage);
    if (!validation.success) {
      console.error(
        "Invalid message received:",
        validation.error,
        validation.details
      );
      throw new Error(`Invalid message: ${validation.error}`);
    }

    const message = validation.data as any;
    switch (message.type) {
      case "ready":
        this._isReady = true;
        console.info("Canvas webview ready");

        // Send current document and selection
        if (this._document && this._panel) {
          await this._panel.webview.postMessage({
            command: "setDocument",
            document: this._document,
          });

          await this._panel.webview.postMessage({
            command: "setSelection",
            selection: this._selection,
          });
        }
        break;

      case "selectionChange":
        const selectionMsg = message as any; // Type assertion for discriminated union
        const nodeIds = selectionMsg.payload.nodeIds;
        this._selection = {
          selectedNodeIds: nodeIds,
          focusedNodeId: nodeIds[0] || null,
        };

        // Notify extension instance
        console.info("Selection changed:", this._selection);
        break;

      case "propertyChange":
        const propMsg = message as any; // Type assertion for discriminated union
        await this._handlePropertyChange(propMsg.payload.event);
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
  <div id="root"></div>
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
}
