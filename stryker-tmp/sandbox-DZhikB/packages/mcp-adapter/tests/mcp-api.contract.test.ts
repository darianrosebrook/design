/**
 * @fileoverview Contract tests for MCP API using Pact
 * @author @darianrosebrook
 */

import { describe, it, beforeAll, afterAll, beforeEach } from "vitest";
import { PactV4, MatchersV3 } from "@pact-foundation/pact";
import axios from "axios";
import { McpServer } from "../src/server.js";

const { like, eachLike, term } = MatchersV3;

// Contract test configuration
const provider = new PactV4({
  consumer: "DesignerCanvas",
  provider: "McpAdapter",
  spec: 2,
});

const BASE_URL = "http://localhost:3000";
const MOCK_SERVER_PORT = 3001;

// Mock server for testing
let mockServer: McpServer;

describe("MCP API Contract Tests", () => {
  beforeAll(async () => {
    // Start mock MCP server
    mockServer = new McpServer({
      port: MOCK_SERVER_PORT,
      mockMode: true,
    });
    await mockServer.start();

    return provider.setup();
  });

  afterAll(async () => {
    await provider.finalize();
    await mockServer.stop();
  });

  beforeEach(() => {
    return provider.addInteraction();
  });

  describe("Canvas Operations API", () => {
    it("should handle canvas document creation", async () => {
      const expectedRequest = {
        method: "POST",
        path: "/canvas/documents",
        headers: {
          "Content-Type": "application/json",
        },
        body: like({
          schemaVersion: "0.1.0",
          id: term({
            generate: "canvas-doc-123",
            matcher: "^canvas-doc-[a-z0-9-]+$",
          }),
          name: like("New Canvas Document"),
          artboards: eachLike({
            id: term({
              generate: "artboard-456",
              matcher: "^artboard-[a-z0-9-]+$",
            }),
            name: like("Artboard 1"),
            frame: {
              x: 0,
              y: 0,
              width: 1440,
              height: 1024,
            },
            children: [],
          }),
        }),
      };

      const expectedResponse = {
        status: 201,
        headers: {
          "Content-Type": "application/json",
        },
        body: like({
          success: true,
          data: {
            document: like({
              schemaVersion: "0.1.0",
              id: term({
                generate: "canvas-doc-123",
                matcher: "^canvas-doc-[a-z0-9-]+$",
              }),
              name: like("New Canvas Document"),
              artboards: eachLike({
                id: term({
                  generate: "artboard-456",
                  matcher: "^artboard-[a-z0-9-]+$",
                }),
                name: like("Artboard 1"),
                frame: {
                  x: 0,
                  y: 0,
                  width: 1440,
                  height: 1024,
                },
                children: [],
              }),
            }),
          },
        }),
      };

      await provider
        .given("A valid canvas document creation request")
        .uponReceiving("A request to create a canvas document")
        .with(expectedRequest)
        .willRespondWith(expectedResponse);

      // Execute the request
      const response = await axios.post(`${BASE_URL}/canvas/documents`, {
        schemaVersion: "0.1.0",
        id: "canvas-doc-123",
        name: "New Canvas Document",
        artboards: [
          {
            id: "artboard-456",
            name: "Artboard 1",
            frame: { x: 0, y: 0, width: 1440, height: 1024 },
            children: [],
          },
        ],
      });

      // Verify response matches contract
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data.document).toBeDefined();
    });

    it("should handle canvas node operations", async () => {
      const nodeId = "node-789";
      const documentId = "canvas-doc-123";

      const expectedRequest = {
        method: "POST",
        path: `/canvas/documents/${documentId}/nodes/${nodeId}`,
        headers: {
          "Content-Type": "application/json",
        },
        body: like({
          operation: "create",
          node: {
            type: "text",
            name: "New Text Node",
            frame: { x: 100, y: 100, width: 200, height: 50 },
            text: "Hello World",
          },
        }),
      };

      const expectedResponse = {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: like({
          success: true,
          data: {
            document: like({
              schemaVersion: "0.1.0",
              id: documentId,
              name: like("Updated Document"),
              artboards: eachLike({
                children: eachLike({
                  id: nodeId,
                  type: "text",
                  name: "New Text Node",
                  frame: { x: 100, y: 100, width: 200, height: 50 },
                  text: "Hello World",
                }),
              }),
            }),
          },
        }),
      };

      await provider
        .given("A canvas document exists")
        .uponReceiving("A request to create a node")
        .with(expectedRequest)
        .willRespondWith(expectedResponse);

      // Execute the request
      const response = await axios.post(
        `${BASE_URL}/canvas/documents/${documentId}/nodes/${nodeId}`,
        {
          operation: "create",
          node: {
            type: "text",
            name: "New Text Node",
            frame: { x: 100, y: 100, width: 200, height: 50 },
            text: "Hello World",
          },
        }
      );

      // Verify response matches contract
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.document).toBeDefined();
    });

    it("should handle error cases", async () => {
      const invalidDocumentId = "invalid-doc-id";

      const expectedRequest = {
        method: "GET",
        path: `/canvas/documents/${invalidDocumentId}`,
      };

      const expectedResponse = {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
        body: like({
          success: false,
          error: like("Document not found"),
        }),
      };

      await provider
        .given("No canvas document exists with the given ID")
        .uponReceiving("A request for a non-existent document")
        .with(expectedRequest)
        .willRespondWith(expectedResponse);

      // Execute the request and verify error handling
      try {
        await axios.get(`${BASE_URL}/canvas/documents/${invalidDocumentId}`);
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.response.status).toBe(404);
        expect(error.response.data.success).toBe(false);
        expect(error.response.data.error).toBeDefined();
      }
    });
  });

  describe("WebSocket Operations API", () => {
    it("should handle real-time canvas updates", async () => {
      const sessionId = "session-123";

      const expectedRequest = {
        method: "POST",
        path: `/websocket/sessions/${sessionId}/subscribe`,
        headers: {
          "Content-Type": "application/json",
        },
        body: like({
          clientId: term({
            generate: "client-456",
            matcher: "^client-[a-z0-9-]+$",
          }),
          subscriptions: eachLike("canvas-updates"),
        }),
      };

      const expectedResponse = {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: like({
          success: true,
          data: {
            sessionId: sessionId,
            connectionStatus: "connected",
            subscribedTopics: eachLike("canvas-updates"),
          },
        }),
      };

      await provider
        .given("A WebSocket session exists")
        .uponReceiving("A subscription request")
        .with(expectedRequest)
        .willRespondWith(expectedResponse);

      // Execute the request
      const response = await axios.post(
        `${BASE_URL}/websocket/sessions/${sessionId}/subscribe`,
        {
          clientId: "client-456",
          subscriptions: ["canvas-updates"],
        }
      );

      // Verify response matches contract
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.sessionId).toBe(sessionId);
    });
  });
});
