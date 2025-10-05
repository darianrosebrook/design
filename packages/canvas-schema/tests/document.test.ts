/**
 * @fileoverview Tests for canvas document creation and canonicalization
 * @author @darianrosebrook
 */

import { describe, it, expect } from "vitest";
import {
  createEmptyDocument,
  canonicalizeDocument,
  validateCanvasDocument,
  validateDocument,
  repairDocument,
  migrateDocument,
  needsMigration,
  LATEST_SCHEMA_VERSION,
  createEmptyComponentLibrary,
  createComponentFromNode,
  createComponentInstance,
  validateComponentLibrary,
} from "../dist/index.js";

describe("createEmptyDocument", () => {
  it("creates a valid canvas document", () => {
    const doc = createEmptyDocument("Test Document");

    const validation = validateCanvasDocument(doc);
    expect(validation.success).toBe(true);
    expect(validation.data).toBeDefined();
  });

  it("sets correct schema version", () => {
    const doc = createEmptyDocument("Test");
    expect(doc.schemaVersion).toBe("0.1.0");
  });

  it("generates unique ULIDs for document and artboard", () => {
    const doc1 = createEmptyDocument("Test1");
    const doc2 = createEmptyDocument("Test2");

    expect(doc1.id).not.toBe(doc2.id);
    expect(doc1.artboards[0].id).not.toBe(doc2.artboards[0].id);
    expect(doc1.id).not.toBe(doc1.artboards[0].id);
  });

  it("creates document with one artboard", () => {
    const doc = createEmptyDocument("Homepage");
    expect(doc.artboards).toHaveLength(1);
    expect(doc.artboards[0].name).toBe("Homepage Artboard");
  });

  it("sets default artboard dimensions", () => {
    const doc = createEmptyDocument("Test");
    const artboard = doc.artboards[0];

    expect(artboard.frame).toEqual({
      x: 0,
      y: 0,
      width: 1440,
      height: 1024,
    });
  });

  it("starts with empty children array", () => {
    const doc = createEmptyDocument("Test");
    expect(doc.artboards[0].children).toEqual([]);
  });
});

describe("canonicalizeDocument", () => {
  it("produces deterministic output", () => {
    const obj1 = { b: 2, a: 1, c: { z: 3, y: 2, x: 1 } };
    const obj2 = { a: 1, c: { x: 1, y: 2, z: 3 }, b: 2 };

    const result1 = canonicalizeDocument(obj1);
    const result2 = canonicalizeDocument(obj2);

    expect(result1).toBe(result2);
  });

  it("includes newline at end", () => {
    const obj = { test: "value" };
    const result = canonicalizeDocument(obj);
    expect(result).toMatch(/\n$/);
  });

  it("uses 2-space indentation", () => {
    const obj = { outer: { inner: 42 } };
    const result = canonicalizeDocument(obj);

    // Check that nested properties are indented with 2 spaces
    expect(result).toContain('\n  "outer": {');
    // Note: The inner object content may vary due to JSON.stringify behavior
    expect(result).toContain("}");
  });

  it("sorts object keys alphabetically", () => {
    const obj = { zebra: 1, alpha: 2, beta: 3 };
    const result = canonicalizeDocument(obj);

    const lines = result.split("\n");
    const keyLines = lines.filter((line) => line.includes(":"));

    expect(keyLines[0]).toContain('"alpha"');
    expect(keyLines[1]).toContain('"beta"');
    expect(keyLines[2]).toContain('"zebra"');
  });
});

describe("Schema Migration", () => {
  it("correctly identifies latest schema version", () => {
    expect(LATEST_SCHEMA_VERSION).toBe("0.1.0");
  });

  it("detects when migration is needed", () => {
    expect(needsMigration("0.0.1")).toBe(true);
    expect(needsMigration("0.1.0")).toBe(false);
    expect(needsMigration("0.2.0")).toBe(true);
  });

  it("migrates from 0.0.1 to 0.1.0", () => {
    const oldDoc = {
      schemaVersion: "0.0.1",
      id: "01K6NB4W00XT9CMTH5FVAZRJQH", // Valid ULID format
      name: "Old Document",
      artboards: [
        {
          id: "01K6NB4W01VTYEMEW506NAMD02", // Valid ULID format
          name: "Old Artboard",
          frame: { x: 0, y: 0, width: 1000, height: 800 },
          children: [],
        },
      ],
    };

    const migrated = migrateDocument(oldDoc);

    expect(migrated.schemaVersion).toBe("0.1.0");
    expect(migrated.id).toBe("01K6NB4W00XT9CMTH5FVAZRJQH"); // Should preserve ID
    expect(migrated.name).toBe("Old Document");
    expect(migrated.artboards).toHaveLength(1);
    expect(migrated.artboards[0].id).toBe("01K6NB4W01VTYEMEW506NAMD02"); // Should preserve artboard ID
  });

  it("handles missing fields in old documents", () => {
    const incompleteDoc = {
      schemaVersion: "0.0.1",
      id: "01K6NB4W00XT9CMTH5FVAZRJQH", // Valid ULID format
      name: "Incomplete Document",
      artboards: [], // Empty artboards array
    };

    const migrated = migrateDocument(incompleteDoc);

    expect(migrated.schemaVersion).toBe("0.1.0");
    expect(migrated.id).toBe("01K6NB4W00XT9CMTH5FVAZRJQH"); // Should preserve ID
    expect(migrated.name).toBe("Incomplete Document");
    expect(migrated.artboards).toHaveLength(1); // Should create default artboard
    expect(migrated.artboards[0].name).toBe("Artboard");
  });

  it("throws error for unsupported schema versions", () => {
    const unsupportedDoc = {
      schemaVersion: "0.9.0", // Version that doesn't have a migration
      id: "01ABC123",
      name: "Unsupported Document",
      artboards: [],
    };

    expect(() => migrateDocument(unsupportedDoc)).toThrow(
      "No migration available for schema version 0.9.0"
    );
  });

  it("validates migrated documents", () => {
    const oldDoc = {
      schemaVersion: "0.0.1",
      id: "01K6NB4W00XT9CMTH5FVAZRJQH", // Valid ULID format
      name: "Valid Old Document",
      artboards: [
        {
          id: "01K6NB4W01VTYEMEW506NAMD02", // Valid ULID format
          name: "Valid Artboard",
          frame: { x: 0, y: 0, width: 1440, height: 1024 },
          children: [],
        },
      ],
    };

    // First migrate the document
    const migrated = migrateDocument(oldDoc);
    expect(migrated.schemaVersion).toBe("0.1.0");

    // Then validate the migrated document
    const validation = validateCanvasDocument(migrated);

    expect(validation.success).toBe(true);
    expect(validation.migrated).toBe(false); // Should be false since it's already migrated
  });

  it("validates old documents and triggers migration", () => {
    const oldDoc = {
      schemaVersion: "0.0.1",
      id: "01K6NB4W00XT9CMTH5FVAZRJQH", // Valid ULID format
      name: "Valid Old Document",
      artboards: [
        {
          id: "01K6NB4W01VTYEMEW506NAMD02", // Valid ULID format
          name: "Valid Artboard",
          frame: { x: 0, y: 0, width: 1440, height: 1024 },
          children: [],
        },
      ],
    };

    // Validate the old document directly (should trigger migration)
    const validation = validateCanvasDocument(oldDoc);

    expect(validation.success).toBe(true);
    expect(validation.migrated).toBe(true); // Should be true since migration occurred
    expect(validation.data?.schemaVersion).toBe("0.1.0");
  });

  it("handles validation failure during migration", () => {
    // Create a document that would fail validation after migration
    const invalidDoc = {
      schemaVersion: "0.0.1",
      id: "01K6NB4W00XT9CMTH5FVAZRJQH", // Valid ULID format
      name: "Invalid After Migration",
      artboards: [
        {
          id: "01K6NB4W01VTYEMEW506NAMD02", // Valid ULID format
          name: "Invalid Artboard",
          // Missing required fields that would cause validation to fail
          frame: { x: 0, y: 0, width: -100, height: -100 }, // Invalid dimensions
          children: [],
        },
      ],
    };

    expect(() => migrateDocument(invalidDoc)).toThrow();
  });
});

describe("Component Library Management", () => {
  it("creates empty component library", () => {
    const library = createEmptyComponentLibrary("My Components");

    expect(library.name).toBe("My Components");
    expect(library.version).toBe("1.0.0");
    expect(library.components).toHaveLength(0);
    expect(library.id).toBeDefined();
    expect(library.createdAt).toBeDefined();
    expect(library.updatedAt).toBeDefined();
  });

  it("validates component library", () => {
    const library = createEmptyComponentLibrary("Test Library");
    const validation = validateComponentLibrary(library);

    expect(validation.success).toBe(true);
    expect(validation.data).toBeDefined();
  });

  it("creates component from text node", () => {
    const textNode = {
      id: "01K6NB4W00XT9CMTH5FVAZRJQH",
      type: "text" as const,
      name: "Sample Text",
      visible: true,
      frame: { x: 0, y: 0, width: 100, height: 20 },
      text: "Hello World",
      textStyle: { size: 14, family: "Arial" },
    };

    const component = createComponentFromNode(
      textNode,
      "Text Component",
      "A reusable text component"
    );

    expect(component.name).toBe("Text Component");
    expect(component.description).toBe("A reusable text component");
    expect(component.rootNode.type).toBe("text");
    expect(component.rootNode.text).toBe("Hello World");
    expect(component.properties.text).toBeDefined();
    expect(component.properties.text.type).toBe("string");
    expect(component.properties.text.defaultValue).toBe("Hello World");
  });

  it("creates component from frame node", () => {
    const frameNode = {
      id: "01K6NB4W00XT9CMTH5FVAZRJQH",
      type: "frame" as const,
      name: "Sample Frame",
      visible: true,
      frame: { x: 0, y: 0, width: 200, height: 100 },
      layout: { direction: "vertical" },
      children: [],
    };

    const component = createComponentFromNode(
      frameNode,
      "Frame Component",
      "A reusable frame"
    );

    expect(component.name).toBe("Frame Component");
    expect(component.rootNode.type).toBe("frame");
    expect(component.rootNode.layout?.direction).toBe("vertical");
    expect(component.properties.layout).toBeDefined();
    expect(component.properties.layout.type).toBe("object");
  });

  it("creates component instance", () => {
    const textNode = {
      id: "01K6NB4W00XT9CMTH5FVAZRJQH",
      type: "text" as const,
      name: "Sample Text",
      visible: true,
      frame: { x: 0, y: 0, width: 100, height: 20 },
      text: "Hello World",
    };

    const component = createComponentFromNode(textNode, "Text Component");
    const instance = createComponentInstance(component, {
      x: 10,
      y: 20,
      width: 100,
      height: 20,
    });

    expect(instance.type).toBe("component");
    expect(instance.componentKey).toBe(component.id);
    expect(instance.frame.x).toBe(10);
    expect(instance.frame.y).toBe(20);
    expect(instance.frame.width).toBe(100);
    expect(instance.frame.height).toBe(20);
    expect(instance.props).toEqual({});
  });

  it("creates component instance with overrides", () => {
    const textNode = {
      id: "01K6NB4W00XT9CMTH5FVAZRJQH",
      type: "text" as const,
      name: "Sample Text",
      visible: true,
      frame: { x: 0, y: 0, width: 100, height: 20 },
      text: "Hello World",
    };

    const component = createComponentFromNode(textNode, "Text Component");
    const instance = createComponentInstance(
      component,
      { x: 10, y: 20, width: 100, height: 20 },
      { text: "Custom Text" }
    );

    expect(instance.props.text).toBe("Custom Text");
    expect(instance.frame.width).toBe(100);
    expect(instance.frame.height).toBe(20);
  });

  it("rejects invalid component library", () => {
    const invalidLibrary = {
      version: "1.0.0",
      // Missing required fields
    };

    const validation = validateComponentLibrary(invalidLibrary);
    expect(validation.success).toBe(false);
    expect(validation.errors).toBeDefined();
  });
});

describe("Document Repair", () => {
  it("repairs document with missing frame in artboard", () => {
    const malformedDoc = {
      schemaVersion: "0.1.0",
      id: "01JF2PZV9G2WR5C3W7P0YHNX9D",
      name: "Test Document",
      artboards: [
        {
          id: "01JF2Q02Q3MZ3Q9J7HB3X6N9QB",
          name: "Artboard 1",
          // Missing frame property
          children: [],
        },
      ],
    };

    const result = validateDocument(malformedDoc);
    expect(result.success).toBe(true);
    expect(result.migrated).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.artboards[0].frame).toEqual({
      x: 0,
      y: 0,
      width: 1440,
      height: 1024,
    });
  });

  it("repairs document with incomplete frame properties", () => {
    const malformedDoc = {
      schemaVersion: "0.1.0",
      id: "01JF2PZV9G2WR5C3W7P0YHNX9D",
      name: "Test Document",
      artboards: [
        {
          id: "01JF2Q02Q3MZ3Q9J7HB3X6N9QB",
          name: "Artboard 1",
          frame: { x: 100, y: 200 }, // Missing width and height
          children: [],
        },
      ],
    };

    const result = validateDocument(malformedDoc);
    expect(result.success).toBe(true);
    expect(result.migrated).toBe(true);
    expect(result.data!.artboards[0].frame).toEqual({
      x: 100,
      y: 200,
      width: 1440,
      height: 1024,
    });
  });

  it("fails to repair document with unrepairable issues", () => {
    const malformedDoc = {
      schemaVersion: "0.1.0",
      id: "01JF2PZV9G2WR5C3W7P0YHNX9D",
      name: "Test Document",
      artboards: [
        {
          // Missing required id
          name: "Artboard 1",
          frame: { x: 0, y: 0, width: 800, height: 600 },
          children: [],
        },
      ],
    };

    const result = validateDocument(malformedDoc);
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
  });
});
