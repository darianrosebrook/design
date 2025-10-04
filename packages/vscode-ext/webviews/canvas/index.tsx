/**
 * @fileoverview Canvas webview entry point
 * @author @darianrosebrook
 *
 * Main entry point for the bundled canvas webview that combines
 * canvas-renderer-dom with the properties panel in a single view.
 */

// Use global React object provided by react-bundle.js
const React = (window as any).React as typeof import("react");
const { createRoot } = (window as any).ReactDOM;
const { useEffect, useState, useCallback, useRef } = React;
// React types for JSX
type ReactFC<P = Record<string, never>> = React.FunctionComponent<P>;
import { createCanvasRenderer } from "@paths-design/canvas-renderer-dom";
// Local type definitions for selection modes
type SelectionMode = "rectangle" | "lasso" | "single";
type SelectionModeConfig = {
  mode: SelectionMode;
  multiSelect: boolean;
  preserveSelection: boolean;
};
import type { CanvasDocumentType } from "@paths-design/canvas-schema";
import {
  PropertiesPanel,
  PropertiesService,
} from "@paths-design/properties-panel";
import type {
  SelectionState,
  FontMetadata,
  PropertyChangeEvent,
} from "@paths-design/properties-panel";
import { createMessage } from "../../src/protocol/messages";
import { ActionBar } from "./components/ActionBar";
import { TopNavigation } from "./components/TopNavigation";
// VS Code API type
interface VSCodeAPI {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
}

// Read CSS file for injection
const styles = `
/**
 * Canvas Webview Styles
 * @author @darianrosebrook
 */

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: var(--vscode-editor-background);
  color: var(--vscode-editor-foreground);
}

.canvas-webview {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.error-banner {
  background-color: var(--vscode-inputValidation-errorBackground);
  color: var(--vscode-inputValidation-errorForeground);
  border-bottom: 1px solid var(--vscode-inputValidation-errorBorder);
  padding: 8px 16px;
  font-size: 13px;
  line-height: 1.4;
}

/* Top Navigation Bar Styles */
.top-navigation {
  width: 100%;
  height: 48px;
  background-color: var(--vscode-titleBar-activeBackground, var(--vscode-editor-background));
  border-bottom: 1px solid var(--vscode-panel-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  flex-shrink: 0;
  z-index: 100;
}

.nav-content {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.document-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--vscode-foreground);
  margin: 0;
  line-height: 1.2;
}

.file-path {
  font-size: 11px;
  color: var(--vscode-descriptionForeground);
  opacity: 0.7;
  line-height: 1;
}

.nav-spacer {
  flex: 1;
}

/* Dropdown Menu Styles for Progressive Disclosure */
.dropdown-container {
  position: relative;
}

.dropdown-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: var(--vscode-dropdown-background, var(--vscode-editor-background));
  border: 1px solid var(--vscode-dropdown-border, var(--vscode-panel-border));
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 160px;
  z-index: 1000;
  margin-top: 2px;
  animation: dropdown-fade-in 0.1s ease-out;
}

@keyframes dropdown-fade-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  background: none;
  border: none;
  color: var(--vscode-dropdown-foreground, var(--vscode-foreground));
  font-size: 12px;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.1s ease;
}

.dropdown-item:hover {
  background-color: var(--vscode-list-hoverBackground, rgba(255, 255, 255, 0.05));
}

.dropdown-item:first-child {
  border-radius: 3px 3px 0 0;
}

.dropdown-item:last-child {
  border-radius: 0 0 3px 3px;
}

.dropdown-item:only-child {
  border-radius: 3px;
}

.shortcut {
  margin-left: auto;
  opacity: 0.6;
  font-size: 11px;
}
/* 
canvas layout contains:
- canvas area (background full bleed container)
- navigation bar (full width top bar with file info, global actions (edit, export, undo/redo, stuff that is not going to live in the action bar), and view mode toggle)
- empty state (center of canvas area)
- file panel (resizable, collapsible,floating left sidebar with file, layer, and design system details panel)
- properties panel (resizable, collapsible, floating right sidebar with properties panel)
- action bar (floating bottom bar with action buttons)

┌───────────────────────Full Bleed Canvas─────────────────────────┐
│[Navigation Bar] [File and Edit actions] [global actions] [view mode toggle]  │
│[File panel] [canvas area] [properties panel]  │
│[canvas area] [action bar] [canvas area]  │
└──────────────────────────────────────────────┘
*/
.canvas-layout {
  position: relative;
  flex: 1;
  display: flex;
  overflow: hidden;
}

.canvas-area {
  flex: 1;
  position: relative;
  overflow: hidden;
  background-color: var(--vscode-editor-background);
}

.canvas-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: var(--vscode-descriptionForeground);
}

.empty-state h2 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--vscode-foreground);
}

.empty-state p {
  font-size: 13px;
  opacity: 0.8;
}

.properties-area {
  width: 300px;
  min-width: 280px;
  max-width: 500px;
  border-left: 1px solid var(--vscode-panel-border);
  background-color: var(--vscode-sideBar-background);
  overflow-y: auto;
  flex-shrink: 0;
  border-radius: 8px 0 0 8px;
  position: relative;
  resize: horizontal;
  overflow: hidden;
  transition: width 0.2s ease;
}

.properties-area.collapsed {
  width: 48px;
  min-width: 48px;
  max-width: 48px;
  border-radius: 8px 0 0 8px;
}

/* Resizer handle for panels */
.panel-resizer {
  position: absolute;
  left: -2px;
  top: 0;
  width: 4px;
  height: 100%;
  cursor: col-resize;
  background: transparent;
  z-index: 10;
}

.panel-resizer:hover,
.panel-resizer:active {
  background-color: var(--vscode-focusBorder);
}

/* Scrollbar styling for VS Code theme compatibility */
.properties-area::-webkit-scrollbar {
  width: 10px;
}

.properties-area::-webkit-scrollbar-track {
  background: var(--vscode-scrollbarSlider-background);
}

.properties-area::-webkit-scrollbar-thumb {
  background: var(--vscode-scrollbarSlider-hoverBackground);
  border-radius: 5px;
}

.properties-area::-webkit-scrollbar-thumb:hover {
  background: var(--vscode-scrollbarSlider-activeBackground);
}

/* Code View Styles */
.code-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--vscode-editor-background);
  overflow: hidden;
}

.code-editor {
  flex: 1;
  overflow: auto;
  padding: 16px;
  background-color: var(--vscode-editor-background);
}

.json-content {
  font-family: var(--vscode-editor-font-family, 'Courier New', monospace);
  font-size: var(--vscode-editor-font-size, 14px);
  line-height: 1.5;
  color: var(--vscode-editor-foreground);
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  border: none;
  background: transparent;
  width: 100%;
  height: 100%;
  overflow: visible;
}

/* Ensure crisp rendering on high-DPI displays */
.canvas-container {
  image-rendering: crisp-edges;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Focus states for accessibility */
.canvas-container:focus {
  outline: 2px solid var(--vscode-focusBorder);
  outline-offset: -2px;
}

/* Action Bar Styles */
.action-bar {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  background-color: var(--vscode-toolbar-background, var(--vscode-editor-background));
  border: 1px solid var(--vscode-panel-border);
  border-radius: 8px;
  gap: 12px;
  min-height: 40px;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  transition: left 0.2s ease;
}

.action-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--vscode-panel-border);
  background-color: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.1s ease;
}

.action-button:hover {
  background-color: var(--vscode-button-hoverBackground);
  border-color: var(--vscode-focusBorder);
}

.action-button:active {
  transform: scale(0.95);
}

.action-button.active {
  background-color: var(--vscode-actionBar-toggledBackground);
  border-color: var(--vscode-focusBorder);
  color: var(--vscode-actionBar-toggledForeground);
}

.action-separator {
  width: 1px;
  height: 20px;
  background-color: var(--vscode-panel-border);
  margin: 0 4px;
}

.zoom-display {
  min-width: 40px;
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  color: var(--vscode-foreground);
  padding: 0 4px;
}

/* Properties Panel Component Styles */
.properties-panel {
  width: 320px;
  background-color: var(--vscode-sideBar-background);
  border-left: 1px solid var(--vscode-panel-border);
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease;
}

.properties-panel.collapsed {
  width: 40px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: var(--vscode-sideBarSectionHeader-background, var(--vscode-sideBar-background));
  border-bottom: 1px solid var(--vscode-panel-border);
  min-height: 48px;
}

.properties-panel.collapsed .panel-header {
  padding: 12px 8px;
  justify-content: center;
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--vscode-sideBarTitle-foreground);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.properties-panel.collapsed .panel-title {
  display: none;
}

.panel-toggle {
  background: none;
  border: none;
  color: var(--vscode-sideBarTitle-foreground);
  cursor: pointer;
  padding: 4px;
  border-radius: 3px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.1s ease;
}

.panel-toggle:hover {
  background-color: var(--vscode-toolbar-hoverBackground);
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.panel-placeholder {
  padding: 20px;
  text-align: center;
  color: var(--vscode-descriptionForeground);
  font-style: italic;
}
`;

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
      mode: SelectionMode;
      config: { multiSelect?: boolean; preserveSelection?: boolean };
    }
  | { command: "zoomIn" }
  | { command: "zoomOut" }
  | { command: "zoomFit" }
  | { command: "toggleGrid" }
  | { command: "toggleSnap" }
  | { command: "viewModeChange"; mode: "canvas" | "code" }
  | { command: "propertyChangeAcknowledged"; event: unknown }
  | { command: "propertyChangeError"; event: unknown; error: string }
  | { command: "showError"; error: string }
  | { command: "setFonts"; fonts?: Array<{ label: string; value: string }> };

/**
 * Message types from webview to extension
 */
type _WebviewSelectionChangeMessage = ReturnType<
  typeof createMessage<"selectionChange">
>;
type _WebviewSelectionModeChangeMessage = ReturnType<
  typeof createMessage<"selectionModeChange">
>;
type _WebviewSelectionOperationMessage = ReturnType<
  typeof createMessage<"selectionOperation">
>;
type _WebviewPropertyChangeMessage = ReturnType<
  typeof createMessage<"propertyChange">
>;
type _WebviewViewModeChangeMessage = ReturnType<
  typeof createMessage<"viewModeChange">
>;
type _WebviewReadyMessage = ReturnType<typeof createMessage<"ready">>;

/**
 * Main Canvas Webview App component
 */
const CanvasWebviewApp: ReactFC = () => {
  const [vscode] = useState(() => window.acquireVsCodeApi());
  const [document, setDocument] = useState<CanvasDocumentType | null>(null);
  const [selection, setSelection] = useState<SelectionState>({
    selectedNodeIds: [],
    focusedNodeId: null,
  });
  const [fonts, setFonts] = useState<FontMetadata[]>([]);
  const [propertyError, setPropertyError] = useState<{
    propertyKey: string;
    error: string;
  } | null>(null);
  const selectionModeRef = useRef<SelectionMode>("single" as SelectionMode);
  const selectionConfigRef = useRef<SelectionModeConfig>({
    mode: "single" as SelectionMode,
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
  const [isPropertiesPanelCollapsed, setIsPropertiesPanelCollapsed] =
    useState(false);
  const [propertiesService] = useState(() => PropertiesService.getInstance());
  const rendererRef = useRef<ReturnType<typeof createCanvasRenderer> | null>(
    null
  );
  const actionBarRef = useRef<HTMLDivElement | null>(null);

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
          })
        );
      },
      onNodeUpdate: (nodeId, updates) => {
        console.info("Node updated:", nodeId, updates);
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
   * Request fonts from extension on mount
   */
  useEffect(() => {
    vscode.postMessage({
      id: crypto.randomUUID(),
      version: "0.1.0",
      timestamp: Date.now(),
      type: "ready",
    });

    // Explicitly request canvas mode from extension
    setTimeout(() => {
      vscode.postMessage({
        id: crypto.randomUUID(),
        version: "0.1.0",
        timestamp: Date.now(),
        type: "viewModeChange",
        payload: { mode: "canvas" },
      });
      console.info("Requested canvas mode from extension");
    }, 100);
  }, [vscode]);

  /**
   * Handle messages from extension
   */
  useEffect(() => {
    const handleMessage = (event: MessageEvent<ExtensionMessage>) => {
      const message: ExtensionMessage = event.data;

      switch (message.command) {
        case "setDocument":
          console.info("Received document from extension");
          setDocument(message.document);

          // Initialize PropertiesService with document nodes
          if (message.document) {
            const allNodes: any[] = [];
            message.document.artboards.forEach((artboard: any) => {
              // Ensure children is an array, defaulting to empty array if undefined
              const children = Array.isArray(artboard.children)
                ? artboard.children
                : [];
              allNodes.push(...children);

              // Recursively collect all child nodes
              const collectNodes = (nodes: any[]) => {
                nodes.forEach((node: any) => {
                  // Ensure node.children is an array, defaulting to empty array if undefined
                  const nodeChildren = Array.isArray(node.children)
                    ? node.children
                    : [];
                  if (nodeChildren.length > 0) {
                    allNodes.push(...nodeChildren);
                    collectNodes(nodeChildren);
                  }
                });
              };
              collectNodes(children);
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
            mode: message.mode,
            config: message.config,
          });
          selectionModeRef.current = message.mode;
          selectionConfigRef.current = {
            ...selectionConfigRef.current,
            ...message.config,
            mode: message.mode,
          };

          // TODO: Implement setSelectionMode when renderer supports it
          console.info("Selection mode changed:", message.mode);

          break;

        case "zoomIn":
          // TODO: Implement zoom functionality when renderer supports it
          console.info("Zoom in requested");
          break;

        case "zoomOut":
          // TODO: Implement zoom functionality when renderer supports it
          console.info("Zoom out requested");
          break;

        case "zoomFit":
          // TODO: Implement zoom functionality when renderer supports it
          console.info("Zoom fit requested");
          break;

        case "toggleGrid":
          // TODO: Implement toggleGrid when renderer supports it
          console.info("Toggle grid requested");
          break;

        case "toggleSnap":
          // TODO: Implement toggleSnap when renderer supports it
          console.info("Toggle snap requested");
          break;

        case "viewModeChange":
          console.info("Setting view mode:", message.mode);
          setViewMode(message.mode);
          // Note: viewModeChange is handled locally, no need to send back to extension
          break;

        case "propertyChangeAcknowledged":
          console.info("Property change acknowledged");
          break;

        case "propertyChangeError":
          console.error("Property change error:", message.error, message.event);
          const errorEvent = message.event as PropertyChangeEvent;
          setPropertyError({
            propertyKey: errorEvent.propertyKey,
            error: message.error,
          });
          break;

        case "setFonts":
          console.info("Received fonts from extension");
          // Transform simple font format to FontMetadata format
          const transformedFonts = (message.fonts || []).map(
            (font: { label: string; value: string }) => ({
              family: font.label,
              variants: [{ weight: 400, style: "normal" as const }],
              source: "local" as const,
              category: "sans-serif",
            })
          );
          setFonts(transformedFonts);
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
    vscode.postMessage({
      id: crypto.randomUUID(),
      version: "0.1.0",
      timestamp: Date.now(),
      type: "ready",
    });

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [vscode]);

  /**
   * Handle property changes from properties panel
   */
  const handlePropertyChange = useCallback(
    (event: PropertyChangeEvent) => {
      console.info("Property change:", event);
      vscode.postMessage(
        createMessage("propertyChange", {
          event,
        })
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
      vscode.postMessage({
        id: crypto.randomUUID(),
        version: "0.1.0",
        timestamp: Date.now(),
        type: "viewModeChange",
        payload: { mode },
      });
    },
    [vscode]
  );

  /**
   * Toggle properties panel collapse state
   */
  const _togglePropertiesPanel = useCallback(() => {
    setIsPropertiesPanelCollapsed((prev: boolean) => !prev);
  }, []);

  /**
   * Update action bar position based on panel state
   */
  useEffect(() => {
    if (!document || !actionBarRef.current) {
      return;
    }

    const updateActionBarPosition = () => {
      const canvasLayout = window.document.querySelector(".canvas-layout");
      if (canvasLayout) {
        const propertiesArea = canvasLayout.querySelector(
          ".properties-area"
        ) as HTMLElement;
        if (propertiesArea) {
          const panelWidth = propertiesArea.offsetWidth;
          const collapsed = isPropertiesPanelCollapsed;

          if (collapsed) {
            // When collapsed, position at center with 24px inset
            actionBarRef.current!.style.left = "calc(50% - 24px)";
          } else {
            // When expanded, account for panel width
            actionBarRef.current!.style.left = `calc(50% - ${
              panelWidth / 2
            }px)`;
          }
        }
      }
    };

    // Use setTimeout to ensure DOM is ready
    const timeoutId = setTimeout(updateActionBarPosition, 0);

    // Also set up a MutationObserver to handle dynamic DOM changes
    const canvasLayout = window.document.querySelector(".canvas-layout");
    let observer: MutationObserver | null = null;
    if (canvasLayout) {
      observer = new MutationObserver(updateActionBarPosition);
      observer.observe(canvasLayout, {
        childList: true,
        subtree: true,
        attributes: true,
      });
    }

    return () => {
      clearTimeout(timeoutId);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [isPropertiesPanelCollapsed]);

  return (
    <div className="canvas-webview">
      {error && (
        <div className="error-banner" role="alert">
          ⚠️ {error}
        </div>
      )}

      <div className="canvas-layout">
        {document && (
          <TopNavigation
            canvasDocument={document}
            fileName="Canvas Document"
            onSave={() => console.log("Save not implemented")}
            onExport={() => console.log("Export not implemented")}
            onShare={() => console.log("Share not implemented")}
            onSettings={() => console.log("Settings not implemented")}
          />
        )}

        {viewMode === "canvas" ? (
          <React.Fragment key="canvas-mode">
            <div key="canvas-area" className="canvas-area">
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

            <div
              key="properties-area"
              className={`properties-area ${
                isPropertiesPanelCollapsed ? "collapsed" : ""
              }`}
            >
              <div className="panel-resizer" />
              {document && (
                <PropertiesPanel
                  documentId={document.id}
                  selection={selection}
                  onPropertyChange={handlePropertyChange}
                  onSelectionChange={setSelection}
                  fonts={fonts}
                  propertyError={propertyError}
                  onDismissError={() => setPropertyError(null)}
                />
              )}
            </div>

            <ActionBar
              key="action-bar"
              ref={actionBarRef}
              onViewModeChange={handleViewModeChange}
              vscode={vscode}
            />
          </React.Fragment>
        ) : (
          <div key="code-view" className="code-view">
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
