/**
 * @fileoverview Tests for React component generation
 * @author @darianrosebrook
 */

import { describe, it, expect } from "vitest";
import { generateReactComponents, createFixedClock } from "../src/index.js";

describe("React Component Generation", () => {
  const testDocument = {
    schemaVersion: "0.1.0",
    id: "01JF2PZV9G2WR5C3W7P0YHNX9D",
    name: "Test Document",
    artboards: [
      {
        id: "01JF2Q02Q3MZ3Q9J7HB3X6N9QB",
        name: "Artboard 1",
        frame: { x: 0, y: 0, width: 1440, height: 1024 },
        children: [
          {
            id: "01JF2Q06GTS16EJ3A3F0KK9K3T",
            type: "frame",
            name: "Hero",
            frame: { x: 0, y: 0, width: 1440, height: 480 },
            children: [
              {
                id: "01JF2Q09H0C3YV2TE8EH8X7MTA",
                type: "text",
                name: "Title",
                frame: { x: 32, y: 40, width: 600, height: 64 },
                text: "Build in your IDE",
                textStyle: { family: "Inter", size: 48, weight: "700" },
              },
            ],
          },
        ],
      },
    ],
  };

  describe("generateReactComponents", () => {
    it("generates React components from canvas document", () => {
      const result = generateReactComponents(testDocument);

      expect(result.files).toHaveLength(5); // 2 components + 2 CSS + 1 index
      expect(result.metadata.artboardCount).toBe(1);
      expect(result.metadata.nodeCount).toBeGreaterThan(0);
    });

    it("includes timestamp and component ID in metadata", () => {
      const result = generateReactComponents(testDocument);

      expect(result.metadata.timestamp).toBeTypeOf("number");
      expect(result.metadata.componentId).toHaveLength(26);
    });

    it("generates TSX files", () => {
      const result = generateReactComponents(testDocument);

      const tsxFiles = result.files.filter(
        (f) => f.type === "tsx" && f.path !== "index.ts"
      );
      expect(tsxFiles.length).toBeGreaterThan(0);

      // Check that generated TSX is valid TypeScript
      for (const file of tsxFiles) {
        // May be default export or named export (for extracted components)
        const hasExport =
          file.content.includes("export default function") ||
          file.content.includes("export function");
        expect(hasExport).toBe(true);
        expect(file.content).toContain("import s from");
      }
    });

    it("generates CSS files", () => {
      const result = generateReactComponents(testDocument);

      const cssFiles = result.files.filter((f) => f.type === "css");
      expect(cssFiles.length).toBeGreaterThan(0);

      // Check that generated CSS has proper structure
      for (const file of cssFiles) {
        expect(file.content).toContain(".frame");
        expect(file.content).toContain("position:");
      }
    });
  });

  describe("Determinism", () => {
    it("produces identical output with fixed clock", () => {
      const fixedTimestamp = 1234567890000;
      const fixedUuid = "01JF2PZV9G2WR5C3W7P0YHNX9D";

      const clock = createFixedClock(fixedTimestamp, fixedUuid);

      const result1 = generateReactComponents(testDocument, { clock });
      const result2 = generateReactComponents(testDocument, { clock });

      // Compare file contents
      expect(result1.files.length).toBe(result2.files.length);

      for (let i = 0; i < result1.files.length; i++) {
        expect(result1.files[i].content).toBe(result2.files[i].content);
      }
    });

    it("produces different output with different clocks", () => {
      const clock1 = createFixedClock(
        1234567890000,
        "01JF2PZV9G2WR5C3W7P0YHNX9D"
      );
      const clock2 = createFixedClock(
        9876543210000,
        "01JF2Q02Q3MZ3Q9J7HB3X6N9QB"
      );

      const result1 = generateReactComponents(testDocument, { clock: clock1 });
      const result2 = generateReactComponents(testDocument, { clock: clock2 });

      // Should be different due to different timestamps/UUIDs
      let different = false;
      for (let i = 0; i < result1.files.length; i++) {
        if (result1.files[i].content !== result2.files[i].content) {
          different = true;
          break;
        }
      }
      expect(different).toBe(true);
    });
  });

  describe("Component Structure", () => {
    it("generates correct component names", () => {
      const result = generateReactComponents(testDocument);

      const tsxFiles = result.files.filter((f) => f.type === "tsx");
      const componentNames = tsxFiles.map((f) => f.path.replace(".tsx", ""));

      // Should have Artboard1 and Hero components
      expect(componentNames).toContain("Artboard1");
      expect(componentNames).toContain("Hero");
    });

    it("includes proper React imports", () => {
      const result = generateReactComponents(testDocument);

      const tsxFiles = result.files.filter((f) => f.type === "tsx");
      const componentFiles = tsxFiles.filter((f) => f.path !== "index.ts");
      for (const file of componentFiles) {
        expect(file.content).toContain("import s from");
        // May be default export or named export (for extracted components)
        const hasExport =
          file.content.includes("export default function") ||
          file.content.includes("export function");
        expect(hasExport).toBe(true);
      }
    });

    it("generates semantic HTML components based on naming", () => {
      // Create a document with semantic naming
      const semanticDocument = {
        schemaVersion: "0.1.0",
        id: "01JF2PZV9G2WR5C3W7P0YHNX9D",
        name: "Semantic Test",
        artboards: [
          {
            id: "01JF2Q02Q3MZ3Q9J7HB3X6N9QB",
            name: "Page",
            frame: { x: 0, y: 0, width: 1440, height: 1024 },
            children: [
              {
                id: "01JF2Q06GTS16EJ3A3F0KK9K3T",
                type: "frame",
                name: "Button",
                frame: { x: 0, y: 0, width: 100, height: 40 },
                children: [
                  {
                    id: "01JF2Q09H0C3YV2TE8EH8X7MTA",
                    type: "text",
                    name: "Click Me",
                    frame: { x: 0, y: 0, width: 100, height: 40 },
                    text: "Click Me",
                  },
                ],
              },
              {
                id: "01JF2Q10H0C3YV2TE8EH8X7MTB",
                type: "frame",
                name: "Card",
                frame: { x: 0, y: 50, width: 300, height: 200 },
                children: [],
              },
            ],
          },
        ],
      };

      const result = generateReactComponents(semanticDocument);

      const componentFiles = result.files.filter(
        (f) => f.type === "tsx" && f.path !== "index.ts"
      );

      for (const file of componentFiles) {
        // Should infer semantic components based on naming
        expect(file.content).toMatch(
          /<button|<article|<nav|<main|<section|<header|<footer/
        );
      }
    });

    it("generates valid JSX structure with semantic components", () => {
      const result = generateReactComponents(testDocument);

      const componentFiles = result.files.filter(
        (f) => f.type === "tsx" && f.path !== "index.ts"
      );
      for (const file of componentFiles) {
        // Should have proper JSX structure with semantic components
        expect(file.content).toContain("return (");
        // May be default export or named export (for extracted components)
        const hasExport =
          file.content.includes("export default function") ||
          file.content.includes("export function");
        expect(hasExport).toBe(true);
        // Should contain semantic HTML elements based on naming
        expect(file.content).toMatch(
          /<(div|span|button|input|nav|main|section|article|header|footer)/
        );
      }
    });
  });

  describe("CSS Generation", () => {
    it("generates CSS modules with proper structure", () => {
      const result = generateReactComponents(testDocument);

      const cssFiles = result.files.filter((f) => f.type === "css");
      expect(cssFiles.length).toBeGreaterThan(0);

      for (const file of cssFiles) {
        // Should have CSS class definitions
        expect(file.content).toContain(".frame");
        expect(file.content).toContain("position: absolute");
        expect(file.content).toContain("left:");
        expect(file.content).toContain("top:");
      }
    });

    it("includes coordinate normalization", () => {
      const result = generateReactComponents(testDocument);

      const cssFiles = result.files.filter((f) => f.type === "css");
      for (const file of cssFiles) {
        // Should have normalized pixel values
        expect(file.content).toMatch(/left: \d+\.\d+px/);
        expect(file.content).toMatch(/top: \d+\.\d+px/);
      }
    });
  });

  describe("Error Handling", () => {
    it("handles invalid document gracefully", () => {
      const invalidDocument = {
        schemaVersion: "0.1.0",
        id: "test",
        name: "test",
        artboards: [], // Empty artboards array
      };

      // Should not throw, but may generate empty output
      expect(() => generateReactComponents(invalidDocument)).not.toThrow();
      const result = generateReactComponents(invalidDocument);
      expect(result.files.length).toBe(0); // No components to generate
    });

    it("handles empty document", () => {
      const emptyDocument = {
        schemaVersion: "0.1.0",
        id: "01JF2PZV9G2WR5C3W7P0YHNX9D",
        name: "Empty Document",
        artboards: [],
      };

      const result = generateReactComponents(emptyDocument);
      expect(result.files.length).toBe(0); // No components to generate
    });
  });
});
