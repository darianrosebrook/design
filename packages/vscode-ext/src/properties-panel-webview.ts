/**
 * @fileoverview Properties panel webview provider
 * @author @darianrosebrook
 */

import type { CanvasDocumentType, NodeType } from "@paths-design/canvas-schema";
import type {
  SelectionState,
  PropertyChangeEvent,
} from "@paths-design/properties-panel";
import * as vscode from "vscode";

/**
 * Properties panel webview provider
 */
export class PropertiesPanelWebviewProvider
  implements vscode.WebviewViewProvider
{
  public static readonly viewType = "designer.propertiesPanel";

  private _view?: vscode.WebviewView;
  private _document?: CanvasDocumentType;
  private _selection: SelectionState = {
    selectedNodeIds: [],
    focusedNodeId: null,
  };
  private _isReady = false;
  private _extensionInstance?: Record<string, unknown>;
  private _propertyValues: Map<string, Map<string, unknown>> = new Map(); // nodeId -> propertyKey -> value
  private _documentFilePath?: vscode.Uri; // Track the original file path
  private _fonts: Array<{ label: string; value: string }> = []; // Available fonts for typography

  constructor(private context: vscode.ExtensionContext) {
    // Get reference to the extension instance for communication
    this._extensionInstance = (globalThis as Record<string, unknown>)
      .designerExtension as any;
  }

  /**
   * Set the current canvas document
   */
  setDocument(document: CanvasDocumentType, filePath?: vscode.Uri): void {
    this._document = document;
    this._documentFilePath = filePath;
    this._cachePropertyValues(document);

    if (this._view) {
      this._view.webview.postMessage({
        command: "setDocument",
        document,
      });
    }
  }

  /**
   * Update the current selection
   */
  setSelection(selection: SelectionState): void {
    this._selection = selection;

    if (this._view) {
      this._view.webview.postMessage({
        command: "setSelection",
        selection,
      });
    }
  }

  /**
   * Notify the properties panel of a property change from the canvas
   * This allows bidirectional communication
   */
  notifyPropertyChanged(event: PropertyChangeEvent): void {
    if (this._view) {
      this._view.webview.postMessage({
        command: "propertyChangedFromCanvas",
        event,
      });
    }
  }

  /**
   * Update the document in the properties panel
   */
  updateDocument(document: CanvasDocumentType): void {
    this._document = document;
    this._cachePropertyValues(document);

    if (this._view) {
      this._view.webview.postMessage({
        command: "setDocument",
        document,
      });
    }
  }

  /**
   * Acknowledge a successful property change
   */
  acknowledgePropertyChange(event: PropertyChangeEvent): void {
    if (this._view) {
      this._view.webview.postMessage({
        command: "propertyChangeAcknowledged",
        event,
      });
    }
  }

  /**
   * Show an error for a property change
   */
  showPropertyChangeError(event: PropertyChangeEvent, error: string): void {
    if (this._view) {
      this._view.webview.postMessage({
        command: "propertyChangeError",
        event,
        error,
      });
    }
  }

  /**
   * Get the current view instance (for testing/integration)
   */
  getView(): vscode.WebviewView | undefined {
    return this._view;
  }

  /**
   * Apply a property change to the document
   */
  private async _applyPropertyChangeToDocument(
    document: CanvasDocumentType,
    event: PropertyChangeEvent
  ): Promise<CanvasDocumentType> {
    // Create a deep copy of the document
    const updatedDocument = JSON.parse(
      JSON.stringify(document)
    ) as CanvasDocumentType;

    // Find the node to update
    const nodeToUpdate = this._findNodeById(updatedDocument, event.nodeId);
    if (!nodeToUpdate) {
      throw new Error(`Node with ID ${event.nodeId} not found`);
    }

    // Apply the property change based on the property key
    this._applyPropertyToNode(nodeToUpdate, event.propertyKey, event.newValue);

    return updatedDocument;
  }

  /**
   * Find a node by ID in the document
   */
  private _findNodeById(
    document: CanvasDocumentType,
    nodeId: string
  ): NodeType | null {
    for (const artboard of document.artboards) {
      const node = this._findNodeInChildren(artboard.children, nodeId);
      if (node) {
        return node;
      }
    }
    return null;
  }

  /**
   * Recursively find a node in children
   */
  private _findNodeInChildren(
    nodes: NodeType[],
    nodeId: string
  ): NodeType | null {
    for (const node of nodes) {
      if (node.id === nodeId) {
        return node;
      }

      if (node.children && node.children.length > 0) {
        const found = this._findNodeInChildren(node.children, nodeId);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  /**
   * Apply a property value to a node
   */
  private _applyPropertyToNode(
    node: any,
    propertyKey: string,
    value: any
  ): void {
    const parts = propertyKey.split(".");

    if (parts.length === 1) {
      // Direct property
      node[propertyKey] = value;
    } else if (parts.length === 2) {
      const [parent, child] = parts;

      if (!node[parent]) {
        node[parent] = {};
      }

      node[parent][child] = value;
    } else {
      // Handle deeper nesting if needed
      let current = node;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = {};
        }
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
    }
  }

  /**
   * Save the document to file
   */
  private async _saveDocument(document: CanvasDocumentType): Promise<void> {
    try {
      if (!this._documentFilePath) {
        throw new Error("No file path tracked for this document");
      }

      const content = JSON.stringify(document, null, 2);
      await vscode.workspace.fs.writeFile(
        this._documentFilePath,
        Buffer.from(content, "utf-8")
      );

      console.info(`Document saved to ${this._documentFilePath.fsPath}`);
    } catch (error) {
      console.error("Failed to save document:", error);
      throw error;
    }
  }

  /**
   * Cache property values from document for old value tracking
   */
  private _cachePropertyValues(document: CanvasDocumentType): void {
    this._propertyValues.clear();

    const cacheNodeProperties = (node: any) => {
      if (!node || !node.id) {
        return;
      }

      const nodeValues = new Map<string, any>();

      // Cache common properties
      if (node.frame) {
        nodeValues.set("frame.x", node.frame.x);
        nodeValues.set("frame.y", node.frame.y);
        nodeValues.set("frame.width", node.frame.width);
        nodeValues.set("frame.height", node.frame.height);
      }
      if (node.style) {
        nodeValues.set("opacity", node.style.opacity);
        if (node.style.fills) {
          nodeValues.set(
            "style.fills",
            JSON.parse(JSON.stringify(node.style.fills))
          );
        }
        if (node.style.strokes) {
          nodeValues.set(
            "style.strokes",
            JSON.parse(JSON.stringify(node.style.strokes))
          );
        }
      }
      if (node.visible !== undefined) {
        nodeValues.set("visible", node.visible);
      }
      if (node.name !== undefined) {
        nodeValues.set("name", node.name);
      }

      this._propertyValues.set(node.id, nodeValues);

      // Recursively cache children
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(cacheNodeProperties);
      }
    };

    // Cache all nodes in all artboards
    document.artboards.forEach((artboard) => {
      cacheNodeProperties(artboard);
      if (artboard.children) {
        artboard.children.forEach(cacheNodeProperties);
      }
    });
  }

  /**
   * Get the old value of a property for undo/redo tracking
   */
  private _getOldValue(nodeId: string, propertyKey: string): any {
    const nodeValues = this._propertyValues.get(nodeId);
    return nodeValues?.get(propertyKey) ?? null;
  }

  /**
   * Notify the canvas renderer about the change
   */
  private _notifyCanvasRenderer(event: PropertyChangeEvent): void {
    // Send property change notification to canvas renderer webview
    // This enables bidirectional sync between properties panel and canvas
    if (this._view) {
      this._view.webview.postMessage({
        command: "propertyChangedFromExtension",
        event,
      });
    }

    console.info("Notifying canvas renderer of property change:", event);
  }

  /**
   * Handle property changes from the webview
   */
  private async handlePropertyChange(
    event: PropertyChangeEvent
  ): Promise<void> {
    console.info("Property change received, forwarding to extension:", event);

    // Forward property change to extension for DocumentStore-based handling
    if (
      this._extensionInstance &&
      (this._extensionInstance as any).handlePropertyChange
    ) {
      await (this._extensionInstance as any).handlePropertyChange(event);
    } else {
      console.error(
        "Extension instance not available for property change handling"
      );
      this.showPropertyChangeError(event, "Extension not available");
    }
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };

    // Set up error handling for the webview
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible && this._isReady) {
        // Webview became visible, ensure it has current state
        this._sendCurrentState();
      }
    });

    // Send available fonts to the webview
    this._sendFontsToWebview();

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview with enhanced error handling
    webviewView.webview.onDidReceiveMessage(async (message) => {
      try {
        switch (message.command) {
          case "ready":
            this._isReady = true;
            this._sendCurrentState();
            await this._sendFontsToWebview();
            break;

          case "propertyChange":
            await this.handlePropertyChange(message.event);
            break;

          case "getDocument":
            if (this._document) {
              webviewView.webview.postMessage({
                command: "setDocument",
                document: this._document,
              });
            }
            break;

          case "getSelection":
            webviewView.webview.postMessage({
              command: "setSelection",
              selection: this._selection,
            });
            break;

          case "setFonts":
            this._fonts = message.fonts || [];
            // Send fonts to the webview
            webviewView.webview.postMessage({
              command: "setFonts",
              fonts: this._fonts,
            });
            break;

          default:
            console.warn("Unknown message command:", message.command);
        }
      } catch (error) {
        console.error("Error handling webview message:", error);

        // Send error back to webview
        webviewView.webview.postMessage({
          command: "showError",
          error: "Failed to process request: " + (error as Error).message,
        });
      }
    });

    // Handle webview disposal
    webviewView.onDidDispose(() => {
      this._view = undefined;
      this._isReady = false;
    });
  }

  /**
   * Send current state to the webview
   */
  private _sendCurrentState(): void {
    if (!this._view || !this._isReady) {
      return;
    }

    try {
      // Send current document if available
      if (this._document) {
        this._view.webview.postMessage({
          command: "setDocument",
          document: this._document,
        });
      }

      // Send current selection
      this._view.webview.postMessage({
        command: "setSelection",
        selection: this._selection,
      });

      // Send available fonts
      this._view.webview.postMessage({
        command: "setFonts",
        fonts: this._fonts,
      });
    } catch (error) {
      console.error("Error sending current state:", error);
    }
  }

  private async _sendFontsToWebview(): Promise<void> {
    if (!this._view || !this._isReady) {
      return;
    }

    try {
      // Get fonts from the extension host
      const fonts = await vscode.commands.executeCommand("designer.getFonts");
      this._view.webview.postMessage({
        command: "setFonts",
        fonts: fonts as Array<{ label: string; value: string }>,
      });
    } catch (error) {
      console.error("Failed to send fonts to properties panel:", error);
    }
  }

  private _getHtmlForWebview(_webview: vscode.Webview): string {
    // In a production setup, this would use a proper bundler to build the React app
    // For now, we'll create a template that can load the properties panel

    const nonce = this._getNonce();

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline';">
        <title>Designer Properties Panel</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #ffffff;
            color: #333333;
          }

          #properties-panel-container {
            height: 100%;
            width: 100%;
            display: flex;
            flex-direction: column;
          }

          .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 200px;
            font-size: 14px;
            color: #666666;
          }

          .error {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 200px;
            font-size: 14px;
            color: #dc3545;
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            margin: 16px;
            padding: 16px;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div id="properties-panel-container">
          <div class="loading" id="loading-indicator">
            <div>Initializing Properties Panel...</div>
          </div>
          <div class="error" id="error-indicator" style="display: none;">
            <div>Failed to load Properties Panel</div>
          </div>
        </div>

        <script nonce="${nonce}">
          const vscode = acquireVsCodeApi();
          let propertiesPanel = null;

          // Initialize the properties panel when DOM is ready
          document.addEventListener('DOMContentLoaded', () => {
            initializePropertiesPanel();
          });

          // Notify the extension that the webview is ready
          vscode.postMessage({
            command: 'ready'
          });

          // Handle messages from the extension
          window.addEventListener('message', (event) => {
            const message = event.data;

            switch (message.command) {
              case 'setDocument':
                handleSetDocument(message.document);
                break;

              case 'setSelection':
                handleSetSelection(message.selection);
                break;

              case 'propertyChangeAcknowledged':
                handlePropertyChangeAcknowledged(message.event);
                break;

              case 'showError':
                showError(message.error);
                break;

              case 'propertyChangedFromCanvas':
                handlePropertyChangedFromCanvas(message.event);
                break;
            }
          });

          function initializePropertiesPanel() {
            try {
              // In a production setup, this would load the built React bundle
              // For now, we'll create a simple properties panel placeholder

              const container = document.getElementById('properties-panel-container');
              const loading = document.getElementById('loading-indicator');

              // Create a basic properties panel structure
              const panelHTML = createPropertiesPanelHTML();
              container.innerHTML = panelHTML;

              // Initialize basic functionality
              initializePanelInteractions();

              // Hide loading indicator
              if (loading) {
                loading.style.display = 'none';
              }

              console.info('Properties panel initialized successfully');
            } catch (error) {
              console.error('Failed to initialize properties panel:', error);
              showError('Failed to initialize properties panel: ' + error.message);
            }
          }

          function createPropertiesPanelHTML() {
            return \`
              <div class="properties-panel">
                <div class="properties-panel-header">
                  <h2 class="panel-title">Properties</h2>
                  <div class="selection-info" id="selection-info">
                    No selection
                  </div>
                </div>
                <div class="properties-panel-content" id="properties-content">
                  <div class="empty-state">
                    <div class="empty-icon">🎯</div>
                    <h3>Select an Element</h3>
                    <p>Choose an element in the canvas to edit its properties</p>
                  </div>
                </div>
              </div>
            \`;
          }

          function initializePanelInteractions() {
            // Add CSS for the properties panel
            const style = document.createElement('style');
            style.textContent = \`
              .properties-panel {
                height: 100%;
                display: flex;
                flex-direction: column;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 13px;
                line-height: 1.4;
                color: #333333;
              }

              .properties-panel-header {
                padding: 16px;
                border-bottom: 1px solid #e1e5e9;
                background-color: #f8f9fa;
                flex-shrink: 0;
              }

              .panel-title {
                margin: 0 0 4px 0;
                font-size: 14px;
                font-weight: 600;
                color: #1a1a1a;
              }

              .selection-info {
                font-size: 12px;
                color: #6c757d;
                margin: 0;
              }

              .properties-panel-content {
                flex: 1;
                overflow-y: auto;
                padding: 0;
              }

              .empty-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 200px;
                text-align: center;
                padding: 24px;
              }

              .empty-icon {
                font-size: 48px;
                margin-bottom: 16px;
                opacity: 0.5;
              }

              .empty-state h3 {
                margin: 0 0 8px 0;
                font-size: 16px;
                font-weight: 600;
                color: #1a1a1a;
              }

              .empty-state p {
                margin: 0;
                font-size: 13px;
                color: #6c757d;
                line-height: 1.4;
              }

              .property-section {
                border-bottom: 1px solid #e1e5e9;
              }

              .section-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 16px;
                cursor: pointer;
                background-color: #f8f9fa;
                transition: background-color 0.15s ease;
              }

              .section-header:hover {
                background-color: #e9ecef;
              }

              .section-title {
                display: flex;
                align-items: center;
                gap: 8px;
              }

              .section-label {
                margin: 0;
                font-size: 13px;
                font-weight: 600;
                color: #1a1a1a;
              }

              .section-toggle {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 24px;
                border: none;
                background: none;
                cursor: pointer;
                color: #6c757d;
                border-radius: 4px;
              }

              .section-content {
                padding: 8px 0;
                background-color: #ffffff;
              }

              .property-editor {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 8px 16px;
                min-height: 36px;
              }

              .property-label {
                flex: 0 0 80px;
                font-size: 12px;
                color: #495057;
                text-align: right;
                font-weight: 500;
              }

              .property-input-container {
                flex: 1;
                position: relative;
                display: flex;
                align-items: center;
              }

              .property-input {
                width: 100%;
                padding: 6px 8px;
                border: 1px solid #ced4da;
                border-radius: 4px;
                font-size: 12px;
                background-color: #ffffff;
              }

              .property-input:focus {
                outline: none;
                border-color: #007acc;
                box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
              }
            \`;
            document.head.appendChild(style);
          }

          // Store current document and selection for property editing
          let currentDocument = null;
          let currentSelection = null;

          function handleSetDocument(document) {
            console.log('Document updated:', document);
            currentDocument = document;
            
            // Re-render properties if we have a selection
            if (currentSelection && currentSelection.selectedNodeIds && currentSelection.selectedNodeIds.length > 0) {
              handleSetSelection(currentSelection);
            }
          }

          function handleSetSelection(selection) {
            console.log('Selection updated:', selection);
            currentSelection = selection;

            const selectionInfo = document.getElementById('selection-info');
            const content = document.getElementById('properties-content');

            if (selection && selection.selectedNodeIds && selection.selectedNodeIds.length > 0) {
              const count = selection.selectedNodeIds.length;
              selectionInfo.textContent = \`\${count} element\${count !== 1 ? 's' : ''} selected\`;

              // Find the selected node in the document to get current values
              const selectedNodeId = selection.focusedNodeId || selection.selectedNodeIds[0];
              const selectedNode = currentDocument ? findNodeById(currentDocument, selectedNodeId) : null;

              // Create property editors with current values from the node
              content.innerHTML = createPropertyEditors(selection, selectedNode);
            } else {
              selectionInfo.textContent = 'No selection';
              content.innerHTML = \`
                <div class="empty-state">
                  <div class="empty-icon">🎯</div>
                  <h3>Select an Element</h3>
                  <p>Choose an element in the canvas to edit its properties</p>
                </div>
              \`;
            }
          }

          function findNodeById(document, nodeId) {
            const search = (nodes) => {
              for (const node of nodes) {
                if (node.id === nodeId) return node;
                if (node.children) {
                  const found = search(node.children);
                  if (found) return found;
                }
              }
              return null;
            };

            for (const artboard of document.artboards) {
              if (artboard.id === nodeId) return artboard;
              const found = search(artboard.children || []);
              if (found) return found;
            }
            return null;
          }

          function createPropertyEditors(selection, node) {
            // Create property editors based on the actual node
            const frame = node?.frame || { x: 0, y: 0, width: 100, height: 100 };
            const opacity = node?.style?.opacity ?? 1.0;
            const visible = node?.visible ?? true;
            const name = node?.name || 'Unnamed';

            return \`
              <div class="property-section">
                <div class="section-header">
                  <div class="section-title">
                    <h3 class="section-label">Node</h3>
                  </div>
                </div>
                <div class="section-content">
                  <div class="property-editor">
                    <div class="property-label">Name</div>
                    <div class="property-input-container">
                      <input class="property-input" type="text" value="\${name}" data-property="name" onchange="handlePropertyChange('name', this.value)">
                    </div>
                  </div>
                  <div class="property-editor">
                    <div class="property-label">Visible</div>
                    <div class="property-input-container">
                      <input class="property-input" type="checkbox" \${visible ? 'checked' : ''} data-property="visible" onchange="handlePropertyChange('visible', this.checked)">
                    </div>
                  </div>
                </div>
              </div>
              <div class="property-section">
                <div class="section-header">
                  <div class="section-title">
                    <h3 class="section-label">Layout</h3>
                  </div>
                </div>
                <div class="section-content">
                  <div class="property-editor">
                    <div class="property-label">X Position</div>
                    <div class="property-input-container">
                      <input class="property-input" type="number" value="\${frame.x}" data-property="frame.x" onchange="handlePropertyChange('frame.x', parseFloat(this.value))">
                    </div>
                  </div>
                  <div class="property-editor">
                    <div class="property-label">Y Position</div>
                    <div class="property-input-container">
                      <input class="property-input" type="number" value="\${frame.y}" data-property="frame.y" onchange="handlePropertyChange('frame.y', parseFloat(this.value))">
                    </div>
                  </div>
                  <div class="property-editor">
                    <div class="property-label">Width</div>
                    <div class="property-input-container">
                      <input class="property-input" type="number" value="\${frame.width}" data-property="frame.width" onchange="handlePropertyChange('frame.width', parseFloat(this.value))">
                    </div>
                  </div>
                  <div class="property-editor">
                    <div class="property-label">Height</div>
                    <div class="property-input-container">
                      <input class="property-input" type="number" value="\${frame.height}" data-property="frame.height" onchange="handlePropertyChange('frame.height', parseFloat(this.value))">
                    </div>
                  </div>
                </div>
              </div>
              <div class="property-section">
                <div class="section-header">
                  <div class="section-title">
                    <h3 class="section-label">Appearance</h3>
                  </div>
                </div>
                <div class="section-content">
                  <div class="property-editor">
                    <div class="property-label">Opacity</div>
                    <div class="property-input-container">
                      <input class="property-input" type="number" min="0" max="1" step="0.1" value="\${opacity}" data-property="style.opacity" onchange="handlePropertyChange('style.opacity', parseFloat(this.value))">
                    </div>
                  </div>
                </div>
              </div>
            \`;
          }

          function handlePropertyChange(propertyKey, value) {
            if (!currentSelection || !currentSelection.selectedNodeIds || currentSelection.selectedNodeIds.length === 0) {
              console.warn('No selection, cannot change property');
              return;
            }

            // Get the actual selected node ID
            const nodeId = currentSelection.focusedNodeId || currentSelection.selectedNodeIds[0];
            
            // Get the current node to track old value
            const node = currentDocument ? findNodeById(currentDocument, nodeId) : null;
            const oldValue = node ? getPropertyValue(node, propertyKey) : null;

            // Send property change to extension
            vscode.postMessage({
              command: 'propertyChange',
              event: {
                nodeId: nodeId,
                propertyKey: propertyKey,
                oldValue: oldValue,
                newValue: value,
                sectionId: getSectionIdForProperty(propertyKey)
              }
            });
          }

          function getPropertyValue(node, propertyKey) {
            const parts = propertyKey.split('.');
            let current = node;
            for (const part of parts) {
              if (current && typeof current === 'object' && part in current) {
                current = current[part];
              } else {
                return null;
              }
            }
            return current;
          }

          function getSectionIdForProperty(propertyKey) {
            if (propertyKey.startsWith('frame.')) return 'layout';
            if (propertyKey === 'opacity') return 'appearance';
            return 'layout';
          }

          function handlePropertyChangeAcknowledged(event) {
            console.log('Property change acknowledged:', event);
            
            // Show brief success feedback
            const input = document.querySelector(\`[data-property="\${event.propertyKey}"]\`);
            if (input) {
              input.style.borderColor = '#28a745';
              setTimeout(() => {
                input.style.borderColor = '';
              }, 500);
            }

            // Update the property editor to show the new value
            if (input && input.value !== undefined && input.value !== event.newValue) {
              if (input.type === 'checkbox') {
                input.checked = event.newValue;
              } else {
                input.value = event.newValue;
              }
            }
          }

          function handlePropertyChangedFromCanvas(event) {
            console.log('Property changed from canvas:', event);
            
            // Update property editor to reflect the new value from canvas
            // This enables bidirectional sync between canvas and panel
            const input = document.querySelector(\`[data-property="\${event.propertyKey}"]\`);
            if (input) {
              if (input.type === 'checkbox') {
                input.checked = event.newValue;
              } else {
                input.value = event.newValue;
              }

              // Brief highlight to show the value changed
              input.style.backgroundColor = '#ffeaa7';
              setTimeout(() => {
                input.style.backgroundColor = '';
              }, 500);
            }
          }

          function showError(error) {
            const loading = document.getElementById('loading-indicator');
            const errorDiv = document.getElementById('error-indicator');

            if (loading) loading.style.display = 'none';
            if (errorDiv) {
              errorDiv.textContent = error;
              errorDiv.style.display = 'block';
            }
          }

          // Global function for property changes from HTML
          window.handlePropertyChange = handlePropertyChange;

          console.log('Properties panel webview initialized');
        </script>
      </body>
      </html>
    `;
  }

  private _getNonce(): string {
    let text = "";
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
