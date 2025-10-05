// src/webviews/vscode/bridge.ts
import React from "react";

type VSCodeAPI = {
  postMessage(data: any): void;
  getState(): any;
  setState(state: any): void;
};
function useVSCodeApi(): VSCodeAPI {
  return (window as any).acquireVsCodeApi();
}

export type SelectionState = {
  selectedNodeIds: string[];
  focusedNodeId: string | null;
};

export function useVSCodeBridge() {
  const vscode = useVSCodeApi();
  const [doc, setDoc] = React.useState<any>(null);
  const [selection, setSelection] = React.useState<SelectionState>({
    selectedNodeIds: [],
    focusedNodeId: null,
  });

  React.useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const msg = e.data;
      switch (msg.command) {
        case "setDocument":
          setDoc(msg.document);
          break;
        case "setSelection":
          setSelection(msg.selection);
          break;
        default:
          break;
      }
    };
    window.addEventListener("message", onMessage);
    // announce ready
    vscode.postMessage({
      type: "ready",
      id: crypto.randomUUID(),
      ts: Date.now(),
    });
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const send = {
    selectionChange: (ids: string[]) =>
      vscode.postMessage({
        type: "selectionChange",
        payload: { nodeIds: ids },
      }),
    createNode: (node: any) =>
      vscode.postMessage({ type: "createNode", payload: node }),
    requestSave: () => vscode.postMessage({ type: "saveDocument" }),
    viewMode: (mode: "canvas" | "code") =>
      vscode.postMessage({ type: "viewModeChange", payload: { mode } }),
  } as const;

  return { doc, selection, send } as const;
}
