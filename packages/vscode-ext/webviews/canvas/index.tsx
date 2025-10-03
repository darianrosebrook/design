/**
 * @fileoverview Canvas webview entry point
 * @author @darianrosebrook
 *
 * Main entry point for the bundled canvas webview that combines
 * canvas-renderer-dom with the properties panel in a single view.
 */

import React, { useEffect, useState, useCallback, useRef } from "react";
import { createRoot } from "react-dom/client";
import { createCanvasRenderer } from "@paths-design/canvas-renderer-dom";
import type {
  SelectionMode,
  SelectionModeConfig,
  SelectionResult,
} from "@paths-design/canvas-renderer-dom";
import { createMessage } from "../../src/protocol/messages";
import {
  PropertiesPanel,
  PropertiesService,
} from "@paths-design/properties-panel";
import type { CanvasDocumentType } from "@paths-design/canvas-schema";
import type { SelectionState } from "@paths-design/properties-panel";
import { CanvasToolbar } from "./toolbar";
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
  | {
      command: "setSelectionMode";
      payload: {
        mode: SelectionMode;
        config?: Partial<SelectionModeConfig>;
        requestId?: string;
      };
    }
  | { command: "zoomIn" }
  | { command: "zoomOut" }
  | { command: "zoomFit" }
  | { command: "toggleGrid" }
  | { command: "toggleSnap" }
  | { command: "setViewMode"; mode: "canvas" | "code" }
  | { command: "propertyChangeAcknowledged"; event: unknown }
  | { command: "showError"; error: string };

/**
 * Message types from webview to extension
 */
type WebviewSelectionChangeMessage = ReturnType<
  typeof createMessage<"selectionChange">
>;
type WebviewSelectionModeChangeMessage = ReturnType<
  typeof createMessage<"selectionModeChange">
>;
type WebviewSelectionOperationMessage = ReturnType<
  typeof createMessage<"selectionOperation">
>;
type WebviewPropertyChangeMessage = ReturnType<
  typeof createMessage<"propertyChange">
>;
type WebviewViewModeChangeMessage = ReturnType<
  typeof createMessage<"setViewMode">
>;
type WebviewReadyMessage = ReturnType<typeof createMessage<"ready">>;
type OutgoingWebviewMessage =
  | WebviewReadyMessage
  | WebviewSelectionChangeMessage
  | WebviewSelectionModeChangeMessage
  | WebviewSelectionOperationMessage
  | WebviewPropertyChangeMessage
  | WebviewViewModeChangeMessage;

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
  const selectionModeRef = useRef<SelectionMode>("single");
  const selectionConfigRef = useRef<SelectionModeConfig>({
    mode: "single",
    multiSelect: false,
    preserveSelection: false,
  });
  const [canvasContainer, setCanvasContainer] = useState<HTMLDivElement | null>(
    null
  );
  const [renderer, setRenderer] = useState<ReturnType<
    typeof createCanvasRenderer
  > | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"canvas" | "code">("canvas");
  const [propertiesService] = useState(() => PropertiesService.getInstance());
  const rendererRef = useRef<ReturnType<typeof createCanvasRenderer> | null>(
    null
  );

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
        vscode.postMessage(
          createMessage("selectionChange", {
            nodeIds,
          }) as OutgoingWebviewMessage
        );
      },
      onNodeUpdate: (nodeId, updates) => {
        console.info("Node updated:", nodeId, updates);
      },
      onSelectionModeChange: (mode) => {
        selectionModeRef.current = mode;
        vscode.postMessage(
          createMessage("selectionModeChange", {
            mode,
            config: selectionConfigRef.current,
          }) as OutgoingWebviewMessage
        );
      },
      onSelectionOperation: ({ mode, result, config }) => {
        selectionModeRef.current = mode;
        selectionConfigRef.current = config;
        setSelection({
          selectedNodeIds: result.selectedNodeIds,
          focusedNodeId: result.selectedNodeIds[0] || null,
        });

        vscode.postMessage(
          createMessage("selectionOperation", {
            mode,
            result,
            config,
          }) as OutgoingWebviewMessage
        );
      },
    });

    setRenderer(newRenderer);
    rendererRef.current = newRenderer;

    return () => {
      if (newRenderer) {
        newRenderer.destroy();
      }
      rendererRef.current = null;
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
          rendererRef.current?.setSelection(message.selection.selectedNodeIds);
          break;

        case "setSelectionMode":
          console.info("Received selection mode from extension", {
            mode: message.payload.mode,
            config: message.payload.config,
          });
          selectionModeRef.current = message.payload.mode;
          selectionConfigRef.current = {
            ...selectionConfigRef.current,
            ...message.payload.config,
            mode: message.payload.mode,
          };

          rendererRef.current?.setSelectionMode(message.payload.mode);

          break;

        case "zoomIn":
          rendererRef.current?.zoomIn?.();
          break;

        case "zoomOut":
          rendererRef.current?.zoomOut?.();
          break;

        case "zoomFit":
          rendererRef.current?.zoomFit?.();
          break;

        case "toggleGrid":
          rendererRef.current?.toggleGrid?.();
          break;

        case "toggleSnap":
          rendererRef.current?.toggleSnap?.();
          break;

        case "setViewMode":
          console.info("Setting view mode:", message.mode);
          setViewMode(message.mode);
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
    vscode.postMessage(createMessage("ready", {}) as OutgoingWebviewMessage);

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
      vscode.postMessage(
        createMessage("propertyChange", {
          event,
        }) as OutgoingWebviewMessage
      );
    },
    [vscode]
  );

  /**
   * Handle view mode changes from toolbar
   */
  const handleViewModeChange = useCallback(
    (mode: "canvas" | "code") => {
      setViewMode(mode);
      vscode.postMessage(
        createMessage("setViewMode", { mode }) as OutgoingWebviewMessage
      );
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

      {/* Toolbar */}
      <CanvasToolbar onViewModeChange={handleViewModeChange} />

      <div className="canvas-layout">
        {viewMode === "canvas" ? (
          <>
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
          </>
        ) : (
          <div className="code-view">
            <div className="code-editor">
              <pre className="json-content">
                {document
                  ? JSON.stringify(document, null, 2)
                  : "No document loaded"}
              </pre>
            </div>
          </div>
        )}
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
