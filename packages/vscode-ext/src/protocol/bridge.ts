/**
 * @fileoverview Bridge API for DESIGNER-022 Canvas Webview Communication
 * @author @darianrosebrook
 *
 * Provides typed communication between webview and extension using
 * the bridge message contracts defined in bridge-types.ts
 */

import type {
  IncomingMessageType,
  OutgoingMessageType,
  createBridgeMessage,
  validateIncomingMessage,
  validateOutgoingMessage,
} from "./bridge-types.js";

/**
 * VS Code API interface for webview communication
 */
interface VSCodeAPI {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
}

/**
 * Bridge class for typed webview-extension communication
 */
export class CanvasBridge {
  private vscode: VSCodeAPI;
  private messageHandlers = new Map<
    string,
    (message: IncomingMessageType) => void
  >();

  constructor(vscode: VSCodeAPI) {
    this.vscode = vscode;
    this.setupMessageListener();
  }

  /**
   * Set up message listener for incoming messages from extension
   */
  private setupMessageListener(): void {
    window.addEventListener("message", (event: MessageEvent) => {
      const validation = validateIncomingMessage(event.data);

      if (!validation.success) {
        console.warn(
          "Invalid incoming message:",
          validation.error,
          validation.details
        );
        return;
      }

      const message = validation.data!;
      const handler = this.messageHandlers.get(message.type);

      if (handler) {
        try {
          handler(message);
        } catch (error) {
          console.error("Error handling message:", message.type, error);
        }
      } else {
        console.warn("No handler for message type:", message.type);
      }
    });
  }

  /**
   * Register a handler for incoming messages
   */
  onMessage<TType extends IncomingMessageType["type"]>(
    type: TType,
    handler: (message: Extract<IncomingMessageType, { type: TType }>) => void
  ): void {
    this.messageHandlers.set(
      type,
      handler as (message: IncomingMessageType) => void
    );
  }

  /**
   * Send a message to the extension
   */
  sendMessage<TType extends OutgoingMessageType["type"]>(
    type: TType,
    payload: Omit<
      Extract<OutgoingMessageType, { type: TType }>,
      "id" | "version" | "timestamp"
    >
  ): void {
    const message = createBridgeMessage(type, payload);

    // Validate outgoing message before sending
    const validation = validateOutgoingMessage(message);
    if (!validation.success) {
      console.error(
        "Invalid outgoing message:",
        validation.error,
        validation.details
      );
      return;
    }

    this.vscode.postMessage(message);
  }

  /**
   * Send ready notification to extension
   */
  sendReady(): void {
    this.sendMessage("ready", {});
  }

  /**
   * Send selection change to extension
   */
  sendSelectionChange(nodeIds: string[]): void {
    this.sendMessage("selectionChange", { nodeIds });
  }

  /**
   * Send selection mode change to extension
   */
  sendSelectionModeChange(
    mode: "single" | "rectangle" | "lasso",
    config?: { multiSelect?: boolean; preserveSelection?: boolean }
  ): void {
    this.sendMessage("selectionModeChange", { mode, config });
  }

  /**
   * Send mutation request to extension
   */
  sendMutationRequest(opId: string, op: any): void {
    this.sendMessage("requestMutation", { opId, op });
  }

  /**
   * Send property change to extension
   */
  sendPropertyChange(event: {
    nodeId: string;
    propertyKey: string;
    value: unknown;
    oldValue?: unknown;
    sectionId?: string;
  }): void {
    this.sendMessage("propertyChange", { event });
  }

  /**
   * Send save request to extension
   */
  sendSaveRequest(): void {
    this.sendMessage("requestSave", {});
  }

  /**
   * Send view mode change to extension
   */
  sendViewModeChange(mode: "canvas" | "code"): void {
    this.sendMessage("viewModeChange", { mode });
  }

  /**
   * Send panel visibility change to extension
   */
  sendPanelVisibility(visibility: {
    left: boolean;
    right: boolean;
    actionBar: boolean;
  }): void {
    this.sendMessage("panelVisibility", { visibility });
  }

  /**
   * Send panel resize to extension
   */
  sendPanelResize(panel: "left" | "right", widthPx: number): void {
    this.sendMessage("panelResize", { resize: { panel, widthPx } });
  }

  /**
   * Get VS Code API instance
   */
  getVSCodeAPI(): VSCodeAPI {
    return this.vscode;
  }
}

/**
 * Create a bridge instance for the webview
 */
export function createCanvasBridge(): CanvasBridge {
  // Get VS Code API from global
  const vscode = (window as any).acquireVsCodeApi();
  if (!vscode) {
    throw new Error("VS Code API not available");
  }

  return new CanvasBridge(vscode);
}

/**
 * Hook for using the bridge in React components
 */
export function useCanvasBridge(): CanvasBridge {
  // This would typically use React context or a singleton pattern
  // For now, we'll create a new instance each time
  return createCanvasBridge();
}
