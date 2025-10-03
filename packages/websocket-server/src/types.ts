/**
 * @fileoverview TypeScript types for WebSocket collaboration server
 * @author @darianrosebrook
 */

// Note: CanvasDocumentType would be imported from canvas-schema when available
// For now, we'll define a minimal interface for the WebSocket server
export interface CanvasDocumentType {
  schemaVersion: string;
  id: string;
  name: string;
  artboards: any[];
}

/**
 * WebSocket message types for real-time collaboration
 */
export type WebSocketMessageType =
  | "document_load"
  | "document_update"
  | "selection_change"
  | "cursor_move"
  | "node_create"
  | "node_update"
  | "node_delete"
  | "user_join"
  | "user_leave"
  | "ping"
  | "pong"
  | "error";

/**
 * Base WebSocket message structure
 */
export interface WebSocketMessage {
  type: WebSocketMessageType;
  timestamp: number;
  userId: string;
  sessionId: string;
  payload: any;
}

/**
 * Document load message
 */
export interface DocumentLoadMessage extends WebSocketMessage {
  type: "document_load";
  payload: {
    documentId: string;
    document: CanvasDocumentType;
  };
}

/**
 * Document update message
 */
export interface DocumentUpdateMessage extends WebSocketMessage {
  type: "document_update";
  payload: {
    documentId: string;
    patches: any[];
    operationId: string;
  };
}

/**
 * Selection change message
 */
export interface SelectionChangeMessage extends WebSocketMessage {
  type: "selection_change";
  payload: {
    documentId: string;
    selection: {
      selectedNodeIds: string[];
      focusedNodeId: string | null;
    };
    mode?: string;
  };
}

/**
 * Cursor movement message
 */
export interface CursorMoveMessage extends WebSocketMessage {
  type: "cursor_move";
  payload: {
    documentId: string;
    position: {
      x: number;
      y: number;
    };
    viewport?: {
      zoom: number;
      panX: number;
      panY: number;
    };
  };
}

/**
 * Node operation messages
 */
export interface NodeOperationMessage extends WebSocketMessage {
  type: "node_create" | "node_update" | "node_delete";
  payload: {
    documentId: string;
    nodeId: string;
    operationId: string;
    data?: any;
  };
}

/**
 * User presence messages
 */
export interface UserPresenceMessage extends WebSocketMessage {
  type: "user_join" | "user_leave";
  payload: {
    documentId: string;
    user: {
      id: string;
      name: string;
      color: string;
      cursor?: {
        x: number;
        y: number;
      };
    };
  };
}

/**
 * System messages
 */
export interface SystemMessage extends WebSocketMessage {
  type: "ping" | "pong" | "error";
  payload: {
    message?: string;
    error?: string;
  };
}

/**
 * Active user in a document session
 */
export interface ActiveUser {
  id: string;
  name: string;
  color: string;
  cursor?: {
    x: number;
    y: number;
  };
  lastSeen: number;
  connectionId: string;
}

/**
 * Document session state
 */
export interface DocumentSession {
  documentId: string;
  users: Map<string, ActiveUser>;
  lastActivity: number;
  document?: CanvasDocumentType;
}

/**
 * Server configuration
 */
export interface WebSocketServerConfig {
  port: number;
  host: string;
  maxConnections: number;
  heartbeatInterval: number;
  sessionTimeout: number;
  enableCompression: boolean;
  corsOrigins?: string[];
}

/**
 * Client connection information
 */
export interface ClientConnection {
  id: string;
  userId: string;
  documentId?: string;
  ws: any; // WebSocket connection
  connectedAt: number;
  lastHeartbeat: number;
}

/**
 * Operation result for collaborative operations
 */
export interface CollaborationResult {
  success: boolean;
  operationId: string;
  timestamp: number;
  conflicts?: Array<{
    operationId: string;
    userId: string;
    description: string;
  }>;
  appliedPatches?: any[];
}
