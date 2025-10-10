/**
 * @fileoverview Main entry point for WebSocket collaboration server
 * @author @darianrosebrook
 */

import { CollaborationServer } from "./server.js";

export { CollaborationServer };

export type {
  WebSocketMessage,
  WebSocketMessageType,
  WebSocketServerConfig,
  ClientConnection,
  DocumentSession,
  ActiveUser,
  CollaborationResult,
  DocumentLoadMessage,
  DocumentUpdateMessage,
  SelectionChangeMessage,
  CursorMoveMessage,
  NodeOperationMessage,
  UserPresenceMessage,
  SystemMessage,
} from "./types.js";

/**
 * Create and start a collaboration server
 */

export async function createCollaborationServer(
  config?: Partial<import("./types.js").WebSocketServerConfig>
): Promise<CollaborationServer> {
  const server = new CollaborationServer(config);

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    console.info("Received SIGINT, shutting down...");
    await server.shutdown();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.info("Received SIGTERM, shutting down...");
    await server.shutdown();
    process.exit(0);
  });

  return server;
}
