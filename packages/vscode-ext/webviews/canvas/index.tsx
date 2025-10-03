/**
 * @fileoverview Canvas webview entry point
 * @author @darianrosebrook
 *
 * Main entry point for the bundled canvas webview that combines
 * canvas-renderer-dom with the properties panel in a single view.
 */

import React, { useEffect, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { createCanvasRenderer } from "@paths-design/canvas-renderer-dom";
import {
  PropertiesPanel,
  PropertiesService,
} from "@paths-design/properties-panel";
import type { CanvasDocumentType } from "@paths-design/canvas-schema";
import type { SelectionState } from "@paths-design/properties-panel";
import styles from "./styles.css";

// VS Code API type
interface VSCodeAPI {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
}

declare global {
  interface Window {
    acquireVsCodeApi(): VSCodeAPI;
  }
}

/**
 * Message types from extension to webview
 */
type ExtensionMessage =
  | { command: "setDocument"; document: CanvasDocumentType }
  | { command: "setSelection"; selection: SelectionState }
  | { command: "propertyChangeAcknowledged"; event: unknown }
  | { command: "showError"; error: string };

/**
 * Message types from webview to extension
 */
type WebviewMessage =
  | { command: "ready" }
  | { command: "selectionChange"; nodeIds: string[] }
  | { command: "propertyChange"; event: unknown };

/**
 * Main Canvas Webview App component
 */
const CanvasWebviewApp: React.FC = () => {
  const [vscode] = useState(() => window.acquireVsCodeApi());
  const [document, setDocument] = useState<CanvasDocumentType | null>(null);
  const [selection, setSelection] = useState<SelectionState>({
    selectedNodeIds: [],
    focusedNodeId: null,
  });
  const [canvasContainer, setCanvasContainer] = useState<HTMLDivElement | null>(
    null
  );
  const [renderer, setRenderer] = useState<ReturnType<
    typeof createCanvasRenderer
  > | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [propertiesService] = useState(() => PropertiesService.getInstance());

  /**
   * Initialize canvas renderer when container is ready
   */
  useEffect(() => {
    if (!canvasContainer || renderer) {
      return;
    }

    console.info("Initializing canvas renderer...");

    const newRenderer = createCanvasRenderer({
      interactive: true,
      onSelectionChange: (nodeIds) => {
        const newSelection: SelectionState = {
          selectedNodeIds: nodeIds,
          focusedNodeId: nodeIds[0] || null,
        };
        setSelection(newSelection);

        // Notify extension of selection change
        vscode.postMessage({
          command: "selectionChange",
          nodeIds,
        } as WebviewMessage);
      },
      onNodeUpdate: (nodeId, updates) => {
        console.info("Node updated:", nodeId, updates);
      },
    });

    setRenderer(newRenderer);

    return () => {
      if (newRenderer) {
        newRenderer.destroy();
      }
    };
  }, [canvasContainer, renderer, vscode]);

  /**
   * Render document when it changes
   */
  useEffect(() => {
    if (!document || !canvasContainer || !renderer) {
      return;
    }

    console.info("Rendering canvas document:", document.id);

    try {
      renderer.render(document, canvasContainer);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Failed to render canvas:", err);
      setError(`Failed to render canvas: ${errorMessage}`);
    }
  }, [document, canvasContainer, renderer]);

  /**
   * Update selection when it changes
   */
  useEffect(() => {
    if (!renderer || selection.selectedNodeIds.length === 0) {
      return;
    }

    renderer.setSelection(selection.selectedNodeIds);
  }, [selection, renderer]);

  /**
   * Handle messages from extension
   */
  useEffect(() => {
    const handleMessage = (event: MessageEvent<ExtensionMessage>) => {
      const message = event.data;

      switch (message.command) {
        case "setDocument":
          console.info("Received document from extension");
          setDocument(message.document);

          // Initialize PropertiesService with document nodes
          if (message.document) {
            const allNodes: any[] = [];
            message.document.artboards.forEach((artboard: any) => {
              if (artboard.children) {
                allNodes.push(...artboard.children);

                // Recursively collect all child nodes
                const collectNodes = (nodes: any[]) => {
                  nodes.forEach((node: any) => {
                    if (node.children) {
                      allNodes.push(...node.children);
                      collectNodes(node.children);
                    }
                  });
                };
                collectNodes(artboard.children);
              }
            });

            propertiesService.setNodes(allNodes);
          }
          break;

        case "setSelection":
          console.info("Received selection from extension");
          setSelection(message.selection);
          propertiesService.setSelection(message.selection);
          break;

        case "propertyChangeAcknowledged":
          console.info("Property change acknowledged");
          break;

        case "showError":
          console.error("Extension error:", message.error);
          setError(message.error);
          break;

        default:
          console.warn(
            "Unknown message command:",
            (message as { command: string }).command
          );
      }
    };

    window.addEventListener("message", handleMessage);

    // Notify extension that webview is ready
    vscode.postMessage({ command: "ready" } as WebviewMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [vscode]);

  /**
   * Handle property changes from properties panel
   */
  const handlePropertyChange = useCallback(
    (event: unknown) => {
      console.info("Property change:", event);
      vscode.postMessage({
        command: "propertyChange",
        event,
      } as WebviewMessage);
    },
    [vscode]
  );

  return (
    <div className="canvas-webview">
      {error && (
        <div className="error-banner" role="alert">
          ⚠️ {error}
        </div>
      )}

      <div className="canvas-layout">
        <div className="canvas-area">
          <div
            ref={setCanvasContainer}
            className="canvas-container"
            role="application"
            aria-label="Canvas design surface"
          />
          {!document && (
            <div className="empty-state">
              <h2>No Document Loaded</h2>
              <p>Open a .canvas.json file to start editing</p>
            </div>
          )}
        </div>

        <div className="properties-area">
          {document && (
            <PropertiesPanel
              documentId={document.id}
              selection={selection}
              onPropertyChange={handlePropertyChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Inject styles into DOM
const styleTag = document.createElement("style");
styleTag.textContent = styles;
document.head.appendChild(styleTag);

// Initialize React app
const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<CanvasWebviewApp />);
} else {
  console.error("Failed to find root element");
}
