// Local bridge types for webview - minimal version
export interface BaseMessage {
  id: string;
  version: string;
  timestamp: number;
}

export interface DocumentNode {
  id: string;
  type: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  children?: DocumentNode[];
  [key: string]: any;
}

export interface DocumentArtboard {
  id: string;
  name: string;
  children?: DocumentNode[];
}

export interface Document {
  artboards: DocumentArtboard[];
}

export type IncomingMessageType =
  | (BaseMessage & { type: "ready" })
  | (BaseMessage & { type: "setDocument"; document: Document })
  | (BaseMessage & { type: "setSelection"; nodeIds: string[] })
  | (BaseMessage & { type: "setSelectionMode"; mode: string })
  | (BaseMessage & { type: "viewModeChange"; mode: string })
  | (BaseMessage & { type: "showError"; message: string })
  | (BaseMessage & {
      type: "applyMutationResult";
      success: boolean;
      error?: string;
    });

export interface PropertyChangeEvent {
  nodeId: string;
  propertyKey: string;
  value: any;
  oldValue: any;
}

export type OutgoingMessageType =
  | (BaseMessage & { type: "ready" })
  | (BaseMessage & {
      type: "propertyChange";
      nodeId: string;
      changes: Record<string, any>;
      event?: PropertyChangeEvent;
    })
  | (BaseMessage & { type: "selectionChange"; nodeIds: string[] })
  | (BaseMessage & { type: "selectionModeChange"; mode: string; config?: any })
  | (BaseMessage & { type: "viewModeChange"; mode: string });
