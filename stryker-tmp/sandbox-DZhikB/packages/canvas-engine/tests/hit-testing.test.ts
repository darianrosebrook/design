/**
 * @fileoverview Tests for hit testing functionality
 * @author @darianrosebrook
 */

import { describe, it, expect } from "vitest";
import { hitTest } from "../src/hit-testing.js";

const createTestDocument = () => ({
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
            {
              id: "01JF2Q0BH1D4Z3A4F9GI9Y8NUB",
              type: "text",
              name: "Subtitle",
              visible: true,
              frame: { x: 32, y: 120, width: 800, height: 32 },
              style: {},
              text: "Deterministic code generation from visual designs",
              textStyle: {
                family: "Inter",
                size: 18,
                weight: "400",
                color: "#A3A3A3",
              },
            },
          ],
        },
        {
          id: "01JF2Q0CK2E5A4B5G0HJ0Z9OVC",
          type: "frame",
          name: "Features",
          visible: true,
          frame: { x: 0, y: 520, width: 1440, height: 504 },
          style: {},
          layout: { mode: "flex", direction: "row", gap: 32, padding: 40 },
          children: [
            {
              id: "01JF2Q0DM3F6B5C6H1IK1A0PWD",
              type: "frame",
              name: "Feature 1",
              visible: true,
              frame: { x: 40, y: 560, width: 400, height: 200 },
              style: { fills: [{ type: "solid", color: "#1E1E1E" }] },
              children: [
                {
                  id: "01JF2Q0EN4G7C6D7I2JL2B1QXE",
                  type: "text",
                  name: "Feature Title",
                  visible: true,
                  frame: { x: 60, y: 580, width: 360, height: 40 },
                  style: {},
                  text: "Local-First Design",
                  textStyle: {
                    family: "Inter",
                    size: 24,
                    weight: "600",
                    color: "#FFFFFF",
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
});

describe("Canvas Engine Hit Testing", () => {
  describe("hitTest", () => {
    it("should return null for points outside all nodes", () => {
      const document = createTestDocument();
      const result = hitTest(document, { x: -10, y: -10 });

      expect(result).toBeNull();
    });

    it("should hit the title text node at its position (topmost)", () => {
      const document = createTestDocument();
      const result = hitTest(document, { x: 100, y: 100 });

      expect(result).not.toBeNull();
      expect(result?.node.id).toBe("01JF2Q09H0C3YV2TE8EH8X7MTA");
      expect(result?.node.name).toBe("Title");
    });

    it("should hit the hero frame when clicking outside text areas", () => {
      const document = createTestDocument();
      const result = hitTest(document, { x: 1400, y: 400 }); // Bottom right of hero frame

      expect(result).not.toBeNull();
      expect(result?.node.id).toBe("01JF2Q06GTS16EJ3A3F0KK9K3T");
      expect(result?.node.name).toBe("Hero");
    });

    it("should hit the title text node at its position", () => {
      const document = createTestDocument();
      const result = hitTest(document, { x: 50, y: 60 });

      expect(result).not.toBeNull();
      expect(result?.node.id).toBe("01JF2Q09H0C3YV2TE8EH8X7MTA");
      expect(result?.node.name).toBe("Title");
    });

    it("should hit the subtitle text node at its position", () => {
      const document = createTestDocument();
      const result = hitTest(document, { x: 50, y: 140 });

      expect(result).not.toBeNull();
      expect(result?.node.id).toBe("01JF2Q0BH1D4Z3A4F9GI9Y8NUB");
      expect(result?.node.name).toBe("Subtitle");
    });

    it("should hit the feature title text node at its position (topmost)", () => {
      const document = createTestDocument();
      const result = hitTest(document, { x: 100, y: 600 });

      expect(result).not.toBeNull();
      expect(result?.node.id).toBe("01JF2Q0EN4G7C6D7I2JL2B1QXE");
      expect(result?.node.name).toBe("Feature Title");
    });

    it("should hit the feature title text node at its position", () => {
      const document = createTestDocument();
      const result = hitTest(document, { x: 60, y: 620 });

      expect(result).not.toBeNull();
      expect(result?.node.id).toBe("01JF2Q0EN4G7C6D7I2JL2B1QXE");
      expect(result?.node.name).toBe("Feature Title");
    });

    it("should respect artboard filtering", () => {
      const document = createTestDocument();
      // This should hit the title text node since it's on artboard 0 and topmost
      const result = hitTest(
        document,
        { x: 100, y: 100 },
        { artboardIndex: 0 }
      );

      expect(result).not.toBeNull();
      expect(result?.node.id).toBe("01JF2Q09H0C3YV2TE8EH8X7MTA");
    });

    it("should not hit invisible nodes", () => {
      const document = createTestDocument();

      // Create a copy with invisible node
      const modifiedDocument = JSON.parse(JSON.stringify(document));
      modifiedDocument.artboards[0].children[0].visible = false;

      const result = hitTest(modifiedDocument, { x: 100, y: 100 });

      // Should return null since no visible node contains this point
      expect(result).toBeNull();
    });

    it("should return null when no nodes contain the point", () => {
      const document = createTestDocument();

      // At position (100, 500) - this is between hero (ends at y=480) and features (starts at y=520)
      const result = hitTest(document, { x: 100, y: 500 });

      // Should return null since no node contains this point
      expect(result).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("should handle empty documents", () => {
      const emptyDocument = {
        schemaVersion: "0.1.0",
        id: "01JF2PZV9G2WR5C3W7P0YHNX9D",
        name: "Empty Document",
        artboards: [],
      };

      const result = hitTest(emptyDocument, { x: 100, y: 100 });
      expect(result).toBeNull();
    });

    it("should handle documents with no children", () => {
      const noChildrenDocument = {
        schemaVersion: "0.1.0",
        id: "01JF2PZV9G2WR5C3W7P0YHNX9D",
        name: "No Children Document",
        artboards: [
          {
            id: "01JF2Q02Q3MZ3Q9J7HB3X6N9QB",
            name: "Desktop",
            frame: { x: 0, y: 0, width: 1440, height: 1024 },
            children: [],
          },
        ],
      };

      const result = hitTest(noChildrenDocument, { x: 100, y: 100 });
      expect(result).toBeNull();
    });

    it("should handle points on exact boundaries", () => {
      const document = createTestDocument();
      // Hit the exact corner of the hero frame
      const result = hitTest(document, { x: 0, y: 0 });

      expect(result).not.toBeNull();
      expect(result?.node.id).toBe("01JF2Q06GTS16EJ3A3F0KK9K3T");
    });
  });
});
