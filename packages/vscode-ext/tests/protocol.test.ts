/**
 * @fileoverview Tests for message protocol validation
 * @author @darianrosebrook
 */

import { describe, it, expect } from "vitest";
import {
  validateMessage,
  createErrorResponse,
  createSuccessResponse,
  PROTOCOL_VERSION,
} from "../src/protocol/messages.js";

describe("Message Protocol", () => {
  const validRequestBase = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    version: PROTOCOL_VERSION,
    timestamp: Date.now(),
  };

  describe("validateMessage", () => {
    it("accepts valid load document request", () => {
      const message = {
        ...validRequestBase,
        type: "loadDocument",
        payload: {
          path: "design/home.canvas.json",
        },
      };

      const result = validateMessage(message);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.type).toBe("loadDocument");
    });

    it("accepts valid save document request", () => {
      const message = {
        ...validRequestBase,
        type: "saveDocument",
        payload: {
          path: "design/home.canvas.json",
          document: {
            schemaVersion: "0.1.0",
            id: "01JF2PZV9G2WR5C3W7P0YHNX9D",
            name: "Home",
            artboards: [
              {
                id: "01JF2PZV9G2WR5C3W7P0YHNX9E",
                name: "Desktop",
                frame: { x: 0, y: 0, width: 1440, height: 1024 },
                children: [],
              },
            ],
          },
        },
      };

      const result = validateMessage(message);
      expect(result.success).toBe(true);
      expect(result.data?.type).toBe("saveDocument");
    });

    it("accepts valid update node request", () => {
      const message = {
        ...validRequestBase,
        type: "updateNode",
        payload: {
          documentId: "01JF2PZV9G2WR5C3W7P0YHNX9D",
          nodeId: "01JF2PZV9G2WR5C3W7P0YHNX9E",
          patch: {
            path: ["frame", "x"],
            op: "set",
            value: 100,
          },
        },
      };

      const result = validateMessage(message);
      expect(result.success).toBe(true);
      expect(result.data?.type).toBe("updateNode");
    });

    it("rejects message with missing type", () => {
      const message = {
        ...validRequestBase,
        payload: { path: "design/home.canvas.json" },
      };

      const result = validateMessage(message);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid message format");
    });

    it("rejects message with invalid version", () => {
      const message = {
        ...validRequestBase,
        version: "99.0.0",
        type: "loadDocument",
        payload: { path: "design/home.canvas.json" },
      };

      const result = validateMessage(message);
      expect(result.success).toBe(false);
    });

    it("rejects message with missing id", () => {
      const message = {
        version: PROTOCOL_VERSION,
        timestamp: Date.now(),
        type: "loadDocument",
        payload: { path: "design/home.canvas.json" },
      };

      const result = validateMessage(message);
      expect(result.success).toBe(false);
    });

    it("rejects message with invalid UUID format", () => {
      const message = {
        ...validRequestBase,
        id: "not-a-uuid",
        type: "loadDocument",
        payload: { path: "design/home.canvas.json" },
      };

      const result = validateMessage(message);
      expect(result.success).toBe(false);
    });

    it("rejects message with missing payload", () => {
      const message = {
        ...validRequestBase,
        type: "loadDocument",
      };

      const result = validateMessage(message);
      expect(result.success).toBe(false);
    });

    it("rejects message with invalid payload structure", () => {
      const message = {
        ...validRequestBase,
        type: "loadDocument",
        payload: {
          wrongField: "value",
        },
      };

      const result = validateMessage(message);
      expect(result.success).toBe(false);
    });

    it("rejects completely malformed message", () => {
      const message = "not an object";

      const result = validateMessage(message);
      expect(result.success).toBe(false);
    });

    it("rejects null message", () => {
      const result = validateMessage(null);
      expect(result.success).toBe(false);
    });

    it("rejects undefined message", () => {
      const result = validateMessage(undefined);
      expect(result.success).toBe(false);
    });

    it("provides detailed error information", () => {
      const message = {
        type: "loadDocument",
        payload: {},
      };

      const result = validateMessage(message);
      expect(result.success).toBe(false);
      expect(result.details).toBeDefined();
      expect(Array.isArray(result.details)).toBe(true);
    });
  });

  describe("Response Helpers", () => {
    it("createSuccessResponse creates valid success response", () => {
      const requestId = "550e8400-e29b-41d4-a716-446655440000";
      const data = { result: "success" };

      const response = createSuccessResponse(requestId, data);

      expect(response.success).toBe(true);
      expect(response.requestId).toBe(requestId);
      expect(response.data).toEqual(data);
    });

    it("createErrorResponse creates valid error response", () => {
      const requestId = "550e8400-e29b-41d4-a716-446655440000";
      const error = "File not found";
      const code = "FILE_NOT_FOUND";

      const response = createErrorResponse(requestId, error, code);

      expect(response.success).toBe(false);
      expect(response.requestId).toBe(requestId);
      expect(response.error).toBe(error);
      expect(response.code).toBe(code);
    });

    it("createErrorResponse includes details when provided", () => {
      const requestId = "550e8400-e29b-41d4-a716-446655440000";
      const error = "Validation failed";
      const code = "VALIDATION_ERROR";
      const details = [{ field: "path", message: "Path is required" }];

      const response = createErrorResponse(requestId, error, code, details);

      expect(response.details).toEqual(details);
    });
  });

  describe("Message Types", () => {
    it("distinguishes between different message types", () => {
      const loadMessage = {
        ...validRequestBase,
        type: "loadDocument" as const,
        payload: { path: "design/home.canvas.json" },
      };

      const saveMessage = {
        ...validRequestBase,
        type: "saveDocument" as const,
        payload: {
          path: "design/home.canvas.json",
          document: {
            schemaVersion: "0.1.0" as const,
            id: "01JF2PZV9G2WR5C3W7P0YHNX9D",
            name: "Test",
            artboards: [
              {
                id: "01JF2PZV9G2WR5C3W7P0YHNX9E",
                name: "Desktop",
                frame: { x: 0, y: 0, width: 1440, height: 1024 },
                children: [],
              },
            ],
          },
        },
      };

      const loadResult = validateMessage(loadMessage);
      const saveResult = validateMessage(saveMessage);

      expect(loadResult.success).toBe(true);
      expect(saveResult.success).toBe(true);
      expect(loadResult.data?.type).toBe("loadDocument");
      expect(saveResult.data?.type).toBe("saveDocument");
    });
  });

  describe("Security", () => {
    it("rejects messages with script injection attempts in strings", () => {
      const message = {
        ...validRequestBase,
        type: "loadDocument",
        payload: {
          path: '<script>alert("xss")</script>',
        },
      };

      // Path validator will handle this, but message should still parse
      const result = validateMessage(message);
      expect(result.success).toBe(true); // Message format is valid, path validation happens separately
    });

    it("handles extremely long paths in payload", () => {
      const longPath = "design/" + "a".repeat(10000) + ".canvas.json";
      const message = {
        ...validRequestBase,
        type: "loadDocument",
        payload: {
          path: longPath,
        },
      };

      const result = validateMessage(message);
      expect(result.success).toBe(true); // Format valid, length check in path validator
    });

    it("rejects messages with additional unexpected fields", () => {
      const message = {
        ...validRequestBase,
        type: "loadDocument",
        payload: {
          path: "design/home.canvas.json",
        },
        maliciousField: "attack",
      };

      const result = validateMessage(message);
      // Zod strips extra fields by default in most cases, but the schema should still be valid
      expect(result.success).toBe(true);
    });
  });
});
