/**
 * @fileoverview Tests for canvas document validation
 * @author @darianrosebrook
 */

import { describe, it, expect } from "vitest";
import { validateCanvasDocument } from "../src/validation.js";

describe("Canvas Document Validation", () => {
  const validDocument = {
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

  it("validates correct document", () => {
    const result = validateCanvasDocument(validDocument);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.document).toBeDefined();
  });

  it("rejects document missing schemaVersion", () => {
    const invalidDoc = { ...validDocument };
    delete (invalidDoc as any).schemaVersion;

    const result = validateCanvasDocument(invalidDoc);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("rejects document with invalid ULID", () => {
    const invalidDoc = {
      ...validDocument,
      id: "invalid-ulid",
    };

    const result = validateCanvasDocument(invalidDoc);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("rejects document with negative dimensions", () => {
    const invalidDoc = {
      ...validDocument,
      artboards: [
        {
          ...validDocument.artboards[0],
          frame: { x: 0, y: 0, width: -100, height: 100 },
        },
      ],
    };

    const result = validateCanvasDocument(invalidDoc);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
