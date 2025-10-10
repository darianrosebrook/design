#!/usr/bin/env node

/**
 * @fileoverview CLI entry point for WebSocket collaboration server
 * @author @darianrosebrook
 */

import { createCollaborationServer } from "./index.js";

async function main() {
  const port = parseInt(process.env.PORT || "8080");
  const host = process.env.HOST || "localhost";

  console.log("🎨 Starting Designer WebSocket Collaboration Server");
  console.log("=================================================");
  console.log(`Host: ${host}`);
  console.log(`Port: ${port}`);
  console.log("");

  try {
    const server = await createCollaborationServer({
      port,
      host,
      maxConnections: parseInt(process.env.MAX_CONNECTIONS || "100"),
      heartbeatInterval: parseInt(process.env.HEARTBEAT_INTERVAL || "30000"),
      sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || "300000"),
      enableCompression: process.env.ENABLE_COMPRESSION !== "false",
    });

    console.log("✅ Server started successfully");
    console.log("Press Ctrl+C to stop");

    // Keep the process alive
    process.on("SIGINT", () => {
      console.log("\n🛑 Received SIGINT, shutting down gracefully...");
      server
        .shutdown()
        .then(() => {
          console.log("✅ Server shut down successfully");
          process.exit(0);
        })
        .catch((error) => {
          console.error("❌ Error during shutdown:", error);
          process.exit(1);
        });
    });

    process.on("SIGTERM", () => {
      console.log("\n🛑 Received SIGTERM, shutting down gracefully...");
      server
        .shutdown()
        .then(() => {
          console.log("✅ Server shut down successfully");
          process.exit(0);
        })
        .catch((error) => {
          console.error("❌ Error during shutdown:", error);
          process.exit(1);
        });
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("❌ Unhandled error:", error);
    process.exit(1);
  });
}
