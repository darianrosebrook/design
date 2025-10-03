/**
 * @fileoverview WebSocket server for real-time collaboration
 * @author @darianrosebrook
 */

import { ulid } from "ulid";
import type {
  WebSocketMessage,
  WebSocketMessageType,
  WebSocketServerConfig,
  ClientConnection,
  DocumentSession,
  ActiveUser,
  CollaborationResult,
} from "./types.js";

// WebSocket will be dynamically imported to avoid type issues in build
let WebSocket: any;

/**
 * WebSocket server for real-time collaboration
 */
export class CollaborationServer {
  private wss: WebSocket.Server;
  private config: WebSocketServerConfig;
  private connections = new Map<string, ClientConnection>();
  private sessions = new Map<string, DocumentSession>();
  private heartbeatTimer?: NodeJS.Timeout;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<WebSocketServerConfig> = {}) {
    this.config = {
      port: 8080,
      host: "localhost",
      maxConnections: 100,
      heartbeatInterval: 30000, // 30 seconds
      sessionTimeout: 300000, // 5 minutes
      enableCompression: true,
      ...config,
    };

    // Initialize WebSocket server after dynamic import
    this.initializeWebSocketServer();
  }

  private wss?: any;

  private async initializeWebSocketServer(): Promise<void> {
    try {
      const wsModule = await import("ws");
      const WSClass = wsModule.default;

      this.wss = new WSClass.Server({
        port: this.config.port,
        host: this.config.host,
        perMessageDeflate: this.config.enableCompression,
        maxPayload: 1024 * 1024, // 1MB max message size
      });

      this.setupEventHandlers();
      this.startHeartbeat();
      this.startCleanup();
    } catch (error) {
      console.error("Failed to initialize WebSocket server:", error);
      throw error;
    }
  }

  /**
   * Set up WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.wss) return;

    this.wss.on("connection", (ws: any, request: any) => {
      this.handleConnection(ws, request);
    });

    this.wss.on("error", (error: Error) => {
      console.error("WebSocket server error:", error);
    });

    this.wss.on("listening", () => {
      console.info(`Collaboration server listening on ${this.config.host}:${this.config.port}`);
    });
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: any, request: any): void {
    if (this.connections.size >= this.config.maxConnections) {
      ws.close(1013, "Server at capacity");
      return;
    }

    const connectionId = ulid();
    const userId = this.extractUserId(request) || `user_${connectionId.slice(-8)}`;

    const connection: ClientConnection = {
      id: connectionId,
      userId,
      ws,
      connectedAt: Date.now(),
      lastHeartbeat: Date.now(),
    };

    this.connections.set(connectionId, connection);

    console.info(`Client connected: ${connectionId} (${userId})`);

    ws.on("message", (data: any) => {
      this.handleMessage(connection, data);
    });

    ws.on("close", (code: number, reason: Buffer) => {
      this.handleDisconnection(connection, code, reason);
    });

    ws.on("error", (error: Error) => {
      console.error(`Connection error for ${connectionId}:`, error);
      this.handleDisconnection(connection, 1006, Buffer.from("Connection error"));
    });

    // Send welcome message
    this.sendMessage(ws, {
      type: "user_join",
      timestamp: Date.now(),
      userId,
      sessionId: connectionId,
      payload: {
        connectionId,
        serverInfo: {
          maxConnections: this.config.maxConnections,
          activeConnections: this.connections.size,
        },
      },
    });
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(connection: ClientConnection, data: any): void {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString());

      // Update heartbeat
      connection.lastHeartbeat = Date.now();

      // Validate message structure
      if (!this.validateMessage(message)) {
        this.sendError(connection.ws, "Invalid message format");
        return;
      }

      // Route message to appropriate handler
      switch (message.type) {
        case "document_load":
          this.handleDocumentLoad(connection, message);
          break;
        case "document_update":
          this.handleDocumentUpdate(connection, message);
          break;
        case "selection_change":
          this.handleSelectionChange(connection, message);
          break;
        case "cursor_move":
          this.handleCursorMove(connection, message);
          break;
        case "node_create":
        case "node_update":
        case "node_delete":
          this.handleNodeOperation(connection, message);
          break;
        case "user_join":
          this.handleUserJoin(connection, message);
          break;
        case "ping":
          this.sendMessage(connection.ws, {
            type: "pong",
            timestamp: Date.now(),
            userId: connection.userId,
            sessionId: connection.id,
            payload: { message: "pong" },
          });
          break;
        default:
          console.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error("Failed to parse message:", error);
      this.sendError(connection.ws, "Invalid message format");
    }
  }

  /**
   * Handle document load request
   */
  private handleDocumentLoad(connection: ClientConnection, message: WebSocketMessage): void {
    const { documentId } = message.payload;

    if (!documentId) {
      this.sendError(connection.ws, "Document ID required");
      return;
    }

    // Join or create document session
    let session = this.sessions.get(documentId);
    if (!session) {
      session = {
        documentId,
        users: new Map(),
        lastActivity: Date.now(),
      };
      this.sessions.set(documentId, session);
    }

    // Add user to session
    const user: ActiveUser = {
      id: connection.userId,
      name: connection.userId,
      color: this.generateUserColor(connection.userId),
      lastSeen: Date.now(),
      connectionId: connection.id,
    };

    session.users.set(connection.userId, user);
    connection.documentId = documentId;

    // Broadcast user join to other users in session
    this.broadcastToSession(session, {
      type: "user_join",
      timestamp: Date.now(),
      userId: connection.userId,
      sessionId: connection.id,
      payload: {
        documentId,
        user,
      },
    }, connection.userId);

    // Send current session state to new user
    this.sendMessage(connection.ws, {
      type: "user_join",
      timestamp: Date.now(),
      userId: connection.userId,
      sessionId: connection.id,
      payload: {
        documentId,
        activeUsers: Array.from(session.users.values()),
      },
    });

    console.info(`User ${connection.userId} joined document session ${documentId}`);
  }

  /**
   * Handle document update
   */
  private handleDocumentUpdate(connection: ClientConnection, message: WebSocketMessage): void {
    const { documentId, patches, operationId } = message.payload;

    if (!connection.documentId || connection.documentId !== documentId) {
      this.sendError(connection.ws, "Not in document session");
      return;
    }

    const session = this.sessions.get(documentId);
    if (!session) {
      this.sendError(connection.ws, "Document session not found");
      return;
    }

    // Update session activity
    session.lastActivity = Date.now();

    // Validate and apply patches (simplified - in real implementation would use canvas-engine)
    const result: CollaborationResult = {
      success: true,
      operationId: operationId || ulid(),
      timestamp: Date.now(),
      appliedPatches: patches,
    };

    // Broadcast update to other users in session
    this.broadcastToSession(session, {
      type: "document_update",
      timestamp: Date.now(),
      userId: connection.userId,
      sessionId: connection.id,
      payload: {
        documentId,
        patches,
        operationId: result.operationId,
        userId: connection.userId,
      },
    }, connection.userId);

    // Send confirmation to sender
    this.sendMessage(connection.ws, {
      type: "document_update",
      timestamp: Date.now(),
      userId: connection.userId,
      sessionId: connection.id,
      payload: {
        documentId,
        operationId: result.operationId,
        success: result.success,
      },
    });
  }

  /**
   * Handle selection change
   */
  private handleSelectionChange(connection: ClientConnection, message: WebSocketMessage): void {
    const { documentId, selection, mode } = message.payload;

    if (!connection.documentId || connection.documentId !== documentId) {
      return; // Ignore if not in session
    }

    const session = this.sessions.get(documentId);
    if (!session) {
      return;
    }

    // Update user cursor/activity
    const user = session.users.get(connection.userId);
    if (user) {
      user.lastSeen = Date.now();
    }

    // Broadcast selection change to other users
    this.broadcastToSession(session, {
      type: "selection_change",
      timestamp: Date.now(),
      userId: connection.userId,
      sessionId: connection.id,
      payload: {
        documentId,
        selection,
        mode,
        userId: connection.userId,
      },
    }, connection.userId);
  }

  /**
   * Handle cursor movement
   */
  private handleCursorMove(connection: ClientConnection, message: WebSocketMessage): void {
    const { documentId, position, viewport } = message.payload;

    if (!connection.documentId || connection.documentId !== documentId) {
      return;
    }

    const session = this.sessions.get(documentId);
    if (!session) {
      return;
    }

    // Update user cursor position
    const user = session.users.get(connection.userId);
    if (user) {
      user.cursor = position;
      user.lastSeen = Date.now();
    }

    // Broadcast cursor movement to other users
    this.broadcastToSession(session, {
      type: "cursor_move",
      timestamp: Date.now(),
      userId: connection.userId,
      sessionId: connection.id,
      payload: {
        documentId,
        position,
        viewport,
        userId: connection.userId,
      },
    }, connection.userId);
  }

  /**
   * Handle node operations
   */
  private handleNodeOperation(connection: ClientConnection, message: WebSocketMessage): void {
    const { documentId, nodeId, operationId, data } = message.payload;

    if (!connection.documentId || connection.documentId !== documentId) {
      this.sendError(connection.ws, "Not in document session");
      return;
    }

    const session = this.sessions.get(documentId);
    if (!session) {
      this.sendError(connection.ws, "Document session not found");
      return;
    }

    // Broadcast node operation to other users
    this.broadcastToSession(session, {
      type: message.type,
      timestamp: Date.now(),
      userId: connection.userId,
      sessionId: connection.id,
      payload: {
        documentId,
        nodeId,
        operationId,
        data,
        userId: connection.userId,
      },
    }, connection.userId);
  }

  /**
   * Handle user join
   */
  private handleUserJoin(connection: ClientConnection, message: WebSocketMessage): void {
    const { documentId, user } = message.payload;

    if (!connection.documentId || connection.documentId !== documentId) {
      return;
    }

    const session = this.sessions.get(documentId);
    if (!session) {
      return;
    }

    // Update user information
    const activeUser = session.users.get(connection.userId);
    if (activeUser && user) {
      activeUser.name = user.name || activeUser.name;
      activeUser.color = user.color || activeUser.color;
    }

    // Broadcast updated user info
    this.broadcastToSession(session, {
      type: "user_join",
      timestamp: Date.now(),
      userId: connection.userId,
      sessionId: connection.id,
      payload: {
        documentId,
        user: activeUser,
      },
    }, connection.userId);
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnection(
    connection: ClientConnection,
    code: number,
    reason: Buffer
  ): void {
    console.info(`Client disconnected: ${connection.id} (${connection.userId})`);

    // Remove from connections
    this.connections.delete(connection.id);

    // Remove from document session if applicable
    if (connection.documentId) {
      const session = this.sessions.get(connection.documentId);
      if (session) {
        session.users.delete(connection.userId);

        // Broadcast user leave to remaining users
        this.broadcastToSession(session, {
          type: "user_leave",
          timestamp: Date.now(),
          userId: connection.userId,
          sessionId: connection.id,
          payload: {
            documentId: connection.documentId,
            user: {
              id: connection.userId,
              name: connection.userId,
              color: "",
            },
          },
        });

        // Clean up empty sessions
        if (session.users.size === 0) {
          this.sessions.delete(connection.documentId);
          console.info(`Cleaned up empty session for document ${connection.documentId}`);
        }
      }
    }
  }

  /**
   * Validate incoming message
   */
  private validateMessage(message: any): message is WebSocketMessage {
    return (
      message &&
      typeof message.type === "string" &&
      typeof message.timestamp === "number" &&
      typeof message.userId === "string" &&
      typeof message.sessionId === "string" &&
      message.payload !== undefined
    );
  }

  /**
   * Send message to WebSocket connection
   */
  private sendMessage(ws: WebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Send error message to client
   */
  private sendError(ws: WebSocket, error: string): void {
    this.sendMessage(ws, {
      type: "error",
      timestamp: Date.now(),
      userId: "",
      sessionId: "",
      payload: { error },
    });
  }

  /**
   * Broadcast message to all users in a document session except sender
   */
  private broadcastToSession(
    session: DocumentSession,
    message: WebSocketMessage,
    excludeUserId?: string
  ): void {
    for (const [userId, user] of session.users) {
      if (excludeUserId && userId === excludeUserId) {
        continue;
      }

      const connection = this.connections.get(user.connectionId);
      if (connection && connection.ws.readyState === WebSocket.OPEN) {
        this.sendMessage(connection.ws, message);
      }
    }
  }

  /**
   * Extract user ID from request (simplified)
   */
  private extractUserId(request: any): string | null {
    // In a real implementation, this would parse authentication tokens
    // For now, return null to use generated ID
    return null;
  }

  /**
   * Generate consistent color for user
   */
  private generateUserColor(userId: string): string {
    const colors = [
      "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
      "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9"
    ];

    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  }

  /**
   * Start heartbeat mechanism
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();

      for (const [connectionId, connection] of this.connections) {
        // Check if client missed heartbeat
        if (now - connection.lastHeartbeat > this.config.heartbeatInterval * 2) {
          console.warn(`Terminating inactive connection: ${connectionId}`);
          connection.ws.terminate();
          continue;
        }

        // Send ping to active connections
        if (connection.ws.readyState === WebSocket.OPEN) {
          this.sendMessage(connection.ws, {
            type: "ping",
            timestamp: now,
            userId: connection.userId,
            sessionId: connection.id,
            payload: { message: "ping" },
          });
        }
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Start cleanup mechanism for inactive sessions
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();

      for (const [documentId, session] of this.sessions) {
        if (now - session.lastActivity > this.config.sessionTimeout) {
          console.info(`Cleaning up inactive session: ${documentId}`);
          this.sessions.delete(documentId);
        }
      }
    }, this.config.sessionTimeout / 4); // Check 4 times per timeout period
  }

  /**
   * Get server statistics
   */
  getStats(): {
    activeConnections: number;
    activeSessions: number;
    uptime: number;
    memoryUsage: number;
  } {
    return {
      activeConnections: this.connections.size,
      activeSessions: this.sessions.size,
      uptime: Date.now() - (this as any).startTime || 0,
      memoryUsage: process.memoryUsage().heapUsed,
    };
  }

  /**
   * Get active users in a document session
   */
  getSessionUsers(documentId: string): ActiveUser[] {
    const session = this.sessions.get(documentId);
    return session ? Array.from(session.users.values()) : [];
  }

  /**
   * Gracefully shutdown server
   */
  async shutdown(): Promise<void> {
    console.info("Shutting down collaboration server...");

    // Clear timers
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    // Close all connections
    for (const connection of this.connections.values()) {
      connection.ws.close(1000, "Server shutting down");
    }

    // Close WebSocket server
    await new Promise<void>((resolve) => {
      this.wss.close(() => {
        console.info("Collaboration server shut down");
        resolve();
      });
    });
  }
}
