"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { IncomingMessageType, OutgoingMessageType } from "./bridge-types";

/**
 * VS Code API interface for webview communication
 */
interface VSCodeAPI {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
}

/**
 * Bridge context interface
 */
interface CanvasBridgeContextType {
  bridge: {
    sendMessage: (message: OutgoingMessageType) => void;
    onMessage: (
      type: IncomingMessageType["type"],
      handler: (message: IncomingMessageType) => void
    ) => () => void;
  };
  isReady: boolean;
}

const CanvasBridgeContext = createContext<CanvasBridgeContextType | null>(null);

// Global variable to store VSCode API (can only be acquired once)
let vscodeApi: VSCodeAPI | null = null;

export function CanvasBridgeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isReady, setIsReady] = useState(false);
  const [messageHandlers] = useState(
    new Map<string, ((message: IncomingMessageType) => void)[]>()
  );

  // Get VSCode API (only once)
  const vscode = React.useMemo(() => {
    if (vscodeApi) {
      return vscodeApi;
    }
    if (typeof window !== "undefined" && (window as any).acquireVsCodeApi) {
      vscodeApi = (window as any).acquireVsCodeApi() as VSCodeAPI;
      return vscodeApi;
    }
    return null;
  }, []);

  // Set up message listener
  useEffect(() => {
    if (!vscode) return;

    const handleMessage = (event: MessageEvent) => {
      const message = event.data as IncomingMessageType;
      const handlers = messageHandlers.get(message.type);
      if (handlers) {
        handlers.forEach((handler) => handler(message));
      }
    };

    window.addEventListener("message", handleMessage);

    // Send ready message
    vscode.postMessage({
      id: crypto.randomUUID(),
      version: "0.1.0",
      timestamp: Date.now(),
      type: "ready",
    });

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [vscode, messageHandlers]);

  const onMessage = React.useCallback(
    (
      type: IncomingMessageType["type"],
      handler: (message: IncomingMessageType) => void
    ) => {
      if (!messageHandlers.has(type)) {
        messageHandlers.set(type, []);
      }
      const handlers = messageHandlers.get(type)!;
      handlers.push(handler);

      return () => {
        const handlers = messageHandlers.get(type);
        if (handlers) {
          const index = handlers.indexOf(handler);
          if (index > -1) {
            handlers.splice(index, 1);
          }
        }
      };
    },
    [messageHandlers]
  );

  // Listen for ready confirmation and handle errors
  useEffect(() => {
    if (!vscode) return;

    const unsubscribers = [
      onMessage("ready", () => {
        setIsReady(true);
      }),
      onMessage("showError", (message: IncomingMessageType) => {
        if (message.type === "showError") {
          console.error("[bridge] Extension error:", message.message);
          // TODO: Show user-friendly error notification
        }
      }),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [vscode, onMessage]);

  const bridge = React.useMemo(() => {
    if (!vscode) {
      // Fallback for development/testing
      return {
        sendMessage: (message: OutgoingMessageType) => {
          console.log("[bridge] Sending message:", message);
        },
        onMessage,
      };
    }

    return {
      sendMessage: (message: OutgoingMessageType) => {
        vscode.postMessage(message);
      },
      onMessage,
    };
  }, [vscode, onMessage]);

  const contextValue: CanvasBridgeContextType = {
    bridge,
    isReady,
  };

  return (
    <CanvasBridgeContext.Provider value={contextValue}>
      {children}
    </CanvasBridgeContext.Provider>
  );
}

export function useCanvasBridge() {
  const context = useContext(CanvasBridgeContext);
  if (!context) {
    throw new Error("useCanvasBridge must be used within CanvasBridgeProvider");
  }
  return context;
}
