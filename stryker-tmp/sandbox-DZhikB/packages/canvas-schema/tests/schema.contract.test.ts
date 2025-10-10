/**
 * @fileoverview Contract tests for Canvas Schema validation
 * @author @darianrosebrook
 *
 * Tests that validate the contract between TypeScript types and JSON schema
 * specifications for canvas documents.
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { CanvasDocument, generateULID } from "../src/index.js";
import { validateCanvasDocument } from "../src/validation.js";

// Load the JSON schema
const schemaPath = path.join(__dirname, "../schemas/canvas-0.1.json");
const canvasSchema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));

describe("Canvas Schema Contract Tests", () => {
  let ajv: Ajv;

  beforeAll(() => {
    ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false,
    });
    addFormats(ajv);
  });

  describe("Schema Consistency", () => {
    it("should load the JSON schema successfully", () => {
      expect(canvasSchema).toBeDefined();
      expect(canvasSchema.$id).toBe(
        "https://paths.design.dev/schemas/canvas-0.1.json"
      );
      expect(canvasSchema.title).toBe("CanvasDocument");
    });

    it("should validate against JSON schema structure", () => {
      const validate = ajv.compile(canvasSchema);
      expect(validate).toBeDefined();
      expect(typeof validate).toBe("function");
    });
  });

  describe("TypeScript vs JSON Schema Contract", () => {
    const testDocuments = [
      {
        name: "Minimal valid document",
        doc: {
          schemaVersion: "0.1.0",
          id: generateULID(),
          name: "Test Document",
          artboards: [
            {
              id: generateULID(),
              name: "Artboard 1",
              frame: { x: 0, y: 0, width: 800, height: 600 },
              children: [],
            },
          ],
        },
      },
      {
        name: "Document with frame node",
        doc: {
          schemaVersion: "0.1.0",
          id: generateULID(),
          name: "Frame Document",
          artboards: [
            {
              id: generateULID(),
              name: "Artboard 1",
              frame: { x: 0, y: 0, width: 800, height: 600 },
              children: [
                {
                  id: generateULID(),
                  type: "frame",
                  name: "Test Frame",
                  visible: true,
                  frame: { x: 100, y: 100, width: 200, height: 150 },
                  style: { fills: [{ type: "solid", color: "#ffffff" }] },
                  children: [],
                },
              ],
            },
          ],
        },
      },
      {
        name: "Document with text node",
        doc: {
          schemaVersion: "0.1.0",
          id: generateULID(),
          name: "Text Document",
          artboards: [
            {
              id: generateULID(),
              name: "Artboard 1",
              frame: { x: 0, y: 0, width: 800, height: 600 },
              children: [
                {
                  id: generateULID(),
                  type: "text",
                  name: "Test Text",
                  visible: true,
                  frame: { x: 50, y: 50, width: 300, height: 40 },
                  style: {},
                  text: "Hello World",
                  textStyle: {
                    family: "Inter",
                    size: 24,
                    weight: "400",
                    color: "#000000",
                  },
                },
              ],
            },
          ],
        },
      },
      {
        name: "Document with component instance",
        doc: {
          schemaVersion: "0.1.0",
          id: generateULID(),
          name: "Component Document",
          artboards: [
            {
              id: generateULID(),
              name: "Artboard 1",
              frame: { x: 0, y: 0, width: 800, height: 600 },
              children: [
                {
                  id: generateULID(),
                  type: "component",
                  name: "Button Component",
                  visible: true,
                  frame: { x: 200, y: 200, width: 120, height: 40 },
                  style: {},
                  componentKey: "button.primary",
                  props: { text: "Click me", variant: "primary" },
                },
              ],
            },
          ],
        },
      },
      {
        name: "Document with semantic keys",
        doc: {
          schemaVersion: "0.1.0",
          id: generateULID(),
          name: "Semantic Document",
          artboards: [
            {
              id: generateULID(),
              name: "Artboard 1",
              frame: { x: 0, y: 0, width: 800, height: 600 },
              children: [
                {
                  id: generateULID(),
                  type: "frame",
                  name: "Header",
                  visible: true,
                  frame: { x: 0, y: 0, width: 800, height: 100 },
                  style: { fills: [{ type: "solid", color: "#f8f9fa" }] },
                  semanticKey: "header",
                  children: [
                    {
                      id: generateULID(),
                      type: "text",
                      name: "Title",
                      visible: true,
                      frame: { x: 20, y: 30, width: 400, height: 40 },
                      style: {},
                      text: "Welcome",
                      textStyle: {
                        family: "Inter",
                        size: 32,
                        weight: "700",
                        color: "#1a1a1a",
                      },
                      semanticKey: "header.title",
                    },
                  ],
                },
                {
                  id: generateULID(),
                  type: "frame",
                  name: "Navigation",
                  visible: true,
                  frame: { x: 0, y: 100, width: 800, height: 50 },
                  style: { fills: [{ type: "solid", color: "#ffffff" }] },
                  semanticKey: "navigation",
                  children: [
                    {
                      id: generateULID(),
                      type: "text",
                      name: "Home Link",
                      visible: true,
                      frame: { x: 20, y: 15, width: 60, height: 20 },
                      style: {},
                      text: "Home",
                      textStyle: {
                        family: "Inter",
                        size: 16,
                        weight: "500",
                        color: "#0066cc",
                      },
                      semanticKey: "navigation.items[0]",
                    },
                    {
                      id: generateULID(),
                      type: "text",
                      name: "About Link",
                      visible: true,
                      frame: { x: 100, y: 15, width: 70, height: 20 },
                      style: {},
                      text: "About",
                      textStyle: {
                        family: "Inter",
                        size: 16,
                        weight: "500",
                        color: "#0066cc",
                      },
                      semanticKey: "navigation.items[1]",
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    ];

    testDocuments.forEach(({ name, doc }) => {
      describe(`${name}`, () => {
        it("should pass TypeScript type validation", () => {
          // This will fail at compile time if the document doesn't match the TypeScript types
          const typedDoc: CanvasDocument = doc;
          expect(typedDoc).toBeDefined();
          expect(typedDoc.schemaVersion).toBe("0.1.0");
        });

        it("should pass JSON schema validation", () => {
          const validate = ajv.compile(canvasSchema);
          const isValid = validate(doc);
          expect(isValid).toBe(true);
          if (!isValid) {
            console.error("JSON Schema validation errors:", validate.errors);
          }
        });

        it("should pass runtime validation", () => {
          const result = validateCanvasDocument(doc);
          expect(result.valid).toBe(true);
          if (!result.valid) {
            console.error(
              "Runtime validation errors:",
              result.errors.map(
                (e) => `${e.instancePath}: ${e.message} (${e.keyword})`
              )
            );
          }
        });

        it("should be serializable and deserializable", () => {
          const jsonString = JSON.stringify(doc);
          const parsed = JSON.parse(jsonString);

          // Validate the round-trip
          const result = validateCanvasDocument(parsed);
          expect(result.valid).toBe(true);
        });
      });
    });
  });

  describe("Schema Compliance Edge Cases", () => {
    it("should reject documents with invalid schema version", () => {
      const invalidDoc = {
        schemaVersion: "2.0.0", // Invalid version
        id: generateULID(),
        name: "Invalid Document",
        artboards: [],
      };

      const result = validateCanvasDocument(invalidDoc);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.keyword === "zod")).toBe(true);
    });

    it("should reject documents with invalid ULID format", () => {
      const invalidDoc = {
        schemaVersion: "0.1.0",
        id: "invalid-ulid", // Invalid ULID
        name: "Invalid Document",
        artboards: [],
      };

      const result = validateCanvasDocument(invalidDoc);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.keyword === "zod")).toBe(true);
    });

    it("should reject documents with negative dimensions", () => {
      const invalidDoc = {
        schemaVersion: "0.1.0",
        id: generateULID(),
        name: "Invalid Document",
        artboards: [
          {
            id: "artboard-1",
            name: "Artboard 1",
            frame: { x: 0, y: 0, width: -100, height: 600 }, // Negative width
            children: [],
          },
        ],
      };

      const result = validateCanvasDocument(invalidDoc);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.keyword === "zod")).toBe(true);
    });

    it("should reject nodes with invalid semantic keys", () => {
      const invalidDoc = {
        schemaVersion: "0.1.0",
        id: generateULID(),
        name: "Invalid Document",
        artboards: [
          {
            id: "artboard-1",
            name: "Artboard 1",
            frame: { x: 0, y: 0, width: 800, height: 600 },
            children: [
              {
                id: "invalid-node",
                type: "text",
                name: "Invalid Text",
                visible: true,
                frame: { x: 50, y: 50, width: 300, height: 40 },
                style: {},
                text: "Hello",
                textStyle: {
                  family: "Inter",
                  size: 24,
                  weight: "400",
                  color: "#000000",
                },
                semanticKey: "INVALID_KEY", // Invalid semantic key format (uppercase)
              },
            ],
          },
        ],
      };

      const result = validateCanvasDocument(invalidDoc);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.keyword === "zod")).toBe(true);
    });

    it("should reject documents with duplicate semantic keys", () => {
      const invalidDoc = {
        schemaVersion: "0.1.0",
        id: generateULID(),
        name: "Invalid Document",
        artboards: [
          {
            id: generateULID(),
            name: "Artboard 1",
            frame: { x: 0, y: 0, width: 800, height: 600 },
            children: [
              {
                id: generateULID(),
                type: "text",
                name: "Text 1",
                visible: true,
                frame: { x: 50, y: 50, width: 300, height: 40 },
                style: {},
                text: "First",
                textStyle: {
                  family: "Inter",
                  size: 24,
                  weight: "400",
                  color: "#000000",
                },
                semanticKey: "duplicate.key",
              },
              {
                id: generateULID(),
                type: "text",
                name: "Text 2",
                visible: true,
                frame: { x: 50, y: 100, width: 300, height: 40 },
                style: {},
                text: "Second",
                textStyle: {
                  family: "Inter",
                  size: 24,
                  weight: "400",
                  color: "#000000",
                },
                semanticKey: "duplicate.key", // Duplicate semantic key
              },
            ],
          },
        ],
      };

      const result = validateCanvasDocument(invalidDoc);
      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.keyword === "semantic-key-duplicate")
      ).toBe(true);
    });
  });

  describe("Schema Evolution Contract", () => {
    it("should maintain backward compatibility within major version", () => {
      // This test would validate that newer schema versions can still validate older documents
      // For now, we just ensure the current schema is stable
      const doc = {
        schemaVersion: "0.1.0",
        id: generateULID(),
        name: "Compatibility Test",
        artboards: [
          {
            id: generateULID(),
            name: "Artboard 1",
            frame: { x: 0, y: 0, width: 800, height: 600 },
            children: [],
          },
        ],
      };

      const result = validateCanvasDocument(doc);
      expect(result.valid).toBe(true);
    });

    it("should validate schema metadata correctly", () => {
      expect(canvasSchema.title).toBe("CanvasDocument");
      expect(canvasSchema.type).toBe("object");
      expect(canvasSchema.required).toEqual([
        "schemaVersion",
        "id",
        "name",
        "artboards",
      ]);

      const versionConst = canvasSchema.properties.schemaVersion.const;
      expect(versionConst).toBe("0.1.0");
    });
  });
});
