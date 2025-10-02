/**
 * @fileoverview Tests for canonical JSON serialization
 * @author @darianrosebrook
 */

import { describe, it, expect } from "vitest";
import {
  serializeCanvasDocument,
  CanonicalSerializer,
} from "../src/canonical.js";

describe("Canonical Serialization", () => {
  const testDocument = {
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

  describe("serializeCanvasDocument", () => {
    it("produces valid JSON", () => {
      const result = serializeCanvasDocument(testDocument);
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it("produces deterministic output", () => {
      const result1 = serializeCanvasDocument(testDocument);
      const result2 = serializeCanvasDocument(testDocument);

      expect(result1).toBe(result2);
    });

    it("includes proper indentation", () => {
      const result = serializeCanvasDocument(testDocument);
      expect(result).toContain("  "); // Should have 2-space indentation
    });

    it("ends with newline", () => {
      const result = serializeCanvasDocument(testDocument);
      expect(result.endsWith("\n")).toBe(true);
    });
  });

  describe("CanonicalSerializer", () => {
    it("respects custom options", () => {
      const serializer = new CanonicalSerializer({
        indent: 4,
        sortKeys: true,
        addNewline: false,
      });

      const result = serializer.serialize(testDocument);
      expect(result).toContain("    "); // 4-space indentation
      expect(result.endsWith("\n")).toBe(false);
    });

    it("sorts object keys", () => {
      const unsortedDoc = {
        schemaVersion: "0.1.0",
        name: "Test",
        id: "01JF2PZV9G2WR5C3W7P0YHNX9D",
        artboards: [],
      };

      const result = serializeCanvasDocument(unsortedDoc);

      // Should be sorted: artboards, id, name, schemaVersion
      const parsed = JSON.parse(result);
      const keys = Object.keys(parsed);
      expect(keys).toEqual(["artboards", "id", "name", "schemaVersion"]);
    });
  });
});
