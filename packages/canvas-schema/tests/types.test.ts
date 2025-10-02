/**
 * @fileoverview Tests for Canvas Schema types
 * @author @darianrosebrook
 */

import { describe, it, expect } from "vitest";
import {
  ULID,
  Rect,
  TextStyle,
  Style,
  BaseNode,
  FrameNode,
  TextNode,
  CanvasDocument,
} from "../src/types.js";

describe("Canvas Schema Types", () => {
  describe("ULID", () => {
    it("validates correct ULID format", () => {
      const validUlid = "01JF2PZV9G2WR5C3W7P0YHNX9D";
      expect(() => ULID.parse(validUlid)).not.toThrow();
    });

    it("rejects invalid ULID format", () => {
      const invalidUlids = [
        "invalid",
        "01JF2PZV9G2WR5C3W7P0YHNX9D1", // too long
        "01JF2PZV9G2WR5C3W7P0YHNX9", // too short
        "01JF2PZV9G2WR5C3W7P0YHNX9I", // invalid character 'I' not in base32
      ];

      for (const ulid of invalidUlids) {
        const result = ULID.safeParse(ulid);
        expect(result.success).toBe(false);
      }
    });
  });

  describe("Rect", () => {
    it("validates correct rectangle", () => {
      const rect = { x: 10, y: 20, width: 100, height: 50 };
      expect(() => Rect.parse(rect)).not.toThrow();
    });

    it("rejects negative dimensions", () => {
      const invalidRects = [
        { x: 0, y: 0, width: -10, height: 10 },
        { x: 0, y: 0, width: 10, height: -10 },
      ];

      for (const rect of invalidRects) {
        expect(() => Rect.parse(rect)).toThrow();
      }
    });
  });

  describe("TextStyle", () => {
    it("accepts optional properties", () => {
      const style = { family: "Inter", size: 16 };
      expect(() => TextStyle.parse(style)).not.toThrow();
    });
  });

  describe("CanvasDocument", () => {
    it("validates complete document", () => {
      const doc = {
        schemaVersion: "0.1.0",
        id: "01JF2PZV9G2WR5C3W7P0YHNX9D",
        name: "Test Document",
        artboards: [
          {
            id: "01JF2Q02Q3MZ3Q9J7HB3X6N9QB",
            name: "Artboard 1",
            frame: { x: 0, y: 0, width: 1440, height: 1024 },
            children: [],
          },
        ],
      };

      expect(() => CanvasDocument.parse(doc)).not.toThrow();
    });

    it("requires schemaVersion", () => {
      const doc = {
        id: "01JF2PZV9G2WR5C3W7P0YHNX9D",
        name: "Test Document",
        artboards: [],
      };

      expect(() => CanvasDocument.parse(doc)).toThrow();
    });
  });
});
