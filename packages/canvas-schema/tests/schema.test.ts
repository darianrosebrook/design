/**
 * @fileoverview Canvas Schema Tests
 * @author @darianrosebrook
 *
 * Tests for canvas schema validation and type safety.
 */

import { describe, it, expect } from "vitest";
import { validateCanvasDocument, validateWithDetails } from "../src/validate";
import { CanvasDocument, generateULID, canonicalSerialize } from "../src/index";

describe("Canvas Schema Validation", () => {
  it("should validate a valid canvas document", () => {
    const validDoc = {
      schemaVersion: "0.1.0",
      id: "01JF2PZV9G2WR5C3W7P0YHNX9D",
      name: "Test Document",
      artboards: [
        {
          id: "01JF2Q02Q3MZ3Q9J7HB3X6N9QB",
          name: "Desktop",
          frame: { x: 0, y: 0, width: 1440, height: 1024 },
          children: [
            {
              id: "01JF2Q06GTS16EJ3A3F0KK9K3T",
              type: "frame",
              name: "Hero",
              visible: true,
              frame: { x: 0, y: 0, width: 1440, height: 480 },
              style: { fills: [{ type: "solid", color: "#111317" }] },
              layout: { mode: "flex", direction: "row", gap: 24, padding: 32 },
              children: [
                {
                  id: "01JF2Q09H0C3YV2TE8EH8X7MTA",
                  type: "text",
                  name: "Title",
                  visible: true,
                  frame: { x: 32, y: 40, width: 600, height: 64 },
                  style: {},
                  text: "Build in your IDE",
                  textStyle: {
                    family: "Inter",
                    size: 48,
                    weight: "700",
                    color: "#E6E6E6",
                  },
                },
              ],
            },
          ],
        },
      ],
    };

    const result = validateCanvasDocument(validDoc);
    expect(result.valid).toBe(true);
    expect(result.data).toBeDefined();
  });

  it("should reject invalid documents", () => {
    const invalidDoc = {
      schemaVersion: "0.1.0",
      id: "invalid-ulid", // Invalid ULID format
      name: "Test Document",
      artboards: [],
    };

    const result = validateCanvasDocument(invalidDoc);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
  });

  it("should generate valid ULIDs", () => {
    const ulid1 = generateULID();
    const ulid2 = generateULID();

    expect(ulid1).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    expect(ulid2).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    expect(ulid1).not.toBe(ulid2); // Should be unique
  });

  it("should produce deterministic serialization", () => {
    const doc1 = {
      schemaVersion: "0.1.0",
      id: "01JF2PZV9G2WR5C3W7P0YHNX9D",
      name: "Test Document",
      artboards: [],
    };

    const doc2 = { ...doc1 }; // Identical content

    const serialized1 = canonicalSerialize(doc1);
    const serialized2 = canonicalSerialize(doc2);

    expect(serialized1).toBe(serialized2);
  });
});

describe("Performance Tests", () => {
  it("should validate large documents quickly", () => {
    // Create a document with 1000 nodes
    const largeDoc = {
      schemaVersion: "0.1.0",
      id: "01JF2PZV9G2WR5C3W7P0YHNX9D",
      name: "Large Document",
      artboards: [
        {
          id: "01JF2Q02Q3MZ3Q9J7HB3X6N9QB",
          name: "Desktop",
          frame: { x: 0, y: 0, width: 1440, height: 1024 },
          children: Array.from({ length: 1000 }, (_, i) => ({
            id: `node${i.toString().padStart(3, "0")}`,
            type: "frame",
            name: `Node ${i}`,
            visible: true,
            frame: { x: i * 10, y: i * 10, width: 100, height: 100 },
            style: {},
            children: [],
          })),
        },
      ],
    };

    const start = performance.now();
    const result = validateCanvasDocument(largeDoc);
    const end = performance.now();

    expect(result.valid).toBe(true);
    expect(end - start).toBeLessThan(100); // Should validate in <100ms
  });
});
