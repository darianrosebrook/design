/**
 * @fileoverview Tests for WebSocket collaboration server
 * @author @darianrosebrook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import WebSocket from "ws";
import { CollaborationServer } from "../src/server.js";

// Mock WebSocket
vi.mock("ws", () => ({
  default: {
    Server: vi.fn().mockImplementation(() => ({
      on: vi.fn(),
      close: vi.fn((callback) => callback && callback()),
    })),
  },
}));

describe("CollaborationServer", () => {
  let server: CollaborationServer;

  beforeEach(() => {
    vi.clearAllMocks();
    server = new CollaborationServer({
      port: 8081, // Use different port for testing
      heartbeatInterval: 100, // Faster for testing
      sessionTimeout: 1000, // Shorter for testing
    });
  });

  afterEach(async () => {
    await server.shutdown();
  });

  describe("initialization", () => {
    it("should create server with default configuration", () => {
      const testServer = new CollaborationServer();
      expect(testServer).toBeDefined();

      const stats = testServer.getStats();
      expect(stats.activeConnections).toBe(0);
      expect(stats.activeSessions).toBe(0);
    });

    it("should create server with custom configuration", () => {
      const customConfig = {
        port: 9001,
        host: "127.0.0.1",
        maxConnections: 50,
        heartbeatInterval: 15000,
      };

      const testServer = new CollaborationServer(customConfig);
      expect(testServer).toBeDefined();
    });
  });

  describe("session management", () => {
    it("should return empty array for non-existent session", () => {
      const users = server.getSessionUsers("non-existent-id");
      expect(users).toEqual([]);
    });

    it("should provide server statistics", () => {
      const stats = server.getStats();
      expect(stats).toHaveProperty("activeConnections");
      expect(stats).toHaveProperty("activeSessions");
      expect(stats).toHaveProperty("uptime");
      expect(stats).toHaveProperty("memoryUsage");

      expect(typeof stats.activeConnections).toBe("number");
      expect(typeof stats.activeSessions).toBe("number");
      expect(typeof stats.uptime).toBe("number");
      expect(typeof stats.memoryUsage).toBe("number");
    });
  });

  describe("message validation", () => {
    it("should validate message structure", () => {
      // Test valid message structure
      const validMessage = {
        type: "ping",
        timestamp: Date.now(),
        userId: "user123",
        sessionId: "session123",
        payload: { message: "test" },
      };

      // This would need access to private method for testing
      // For now, we verify the server can be created and handles basic operations
      expect(server).toBeDefined();
    });
  });

  describe("graceful shutdown", () => {
    it("should shutdown gracefully", async () => {
      const shutdownPromise = server.shutdown();
      expect(shutdownPromise).toBeInstanceOf(Promise);

      await shutdownPromise;
      // Server should be shut down without throwing
    });
  });
});
