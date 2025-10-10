/**
 * @fileoverview Tests for Canvas Engine operations
 * @author @darianrosebrook
 */

import { describe, it, expect } from "vitest";
import {
  findNodeById,
  createNode,
  updateNode,
  deleteNode,
} from "../src/operations.js";
import { validateCanvasDocument } from "@paths-design/canvas-schema";

describe("Canvas Engine Operations", () => {
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
            style: {
              fills: [{ type: "solid", color: "tokens.color.surface" }],
            },
            layout: { mode: "flex", direction: "row", gap: 24, padding: 32 },
            children: [
              {
                id: "01JF2Q09H0C3YV2TE8EH8X7MTA",
                type: "text",
                name: "Title",
                frame: { x: 32, y: 40, width: 600, height: 64 },
                style: {},
                text: "Build in your IDE",
                textStyle: {
                  family: "Inter",
                  size: 48,
                  weight: "700",
                  color: "tokens.color.text",
                },
              },
            ],
          },
        ],
      },
    ],
  };

  describe("findNodeById", () => {
    it("finds a node by ID", () => {
      const result = findNodeById(testDocument, "01JF2Q09H0C3YV2TE8EH8X7MTA");

      expect(result.success).toBe(true);
      expect(result.data?.node.name).toBe("Title");
      expect(result.data?.node.type).toBe("text");
    });

    it("returns error for non-existent node", () => {
      const result = findNodeById(testDocument, "non-existent-id");

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });
  });

  describe("createNode", () => {
    it("creates a new node", () => {
      const newNode = {
        type: "text" as const,
        name: "New Text",
        frame: { x: 0, y: 0, width: 100, height: 20 },
        text: "New text content",
      };

      const result = createNode(
        testDocument,
        [0, "children", 0, "children"],
        newNode
      );

      console.log("Create result:", result);
      expect(result.success).toBe(true);
      if (result.data) {
        expect(
          result.data.document.artboards[0].children[0].children.length
        ).toBe(2);
      }
    });
  });

  describe("updateNode", () => {
    it("updates an existing node", () => {
      const updates = {
        name: "Updated Title",
        frame: { x: 32, y: 40, width: 800, height: 64 },
      };

      const result = updateNode(
        testDocument,
        "01JF2Q09H0C3YV2TE8EH8X7MTA",
        updates
      );

      console.log("Update result:", result);
      expect(result.success).toBe(true);
      if (result.data) {
        expect(
          result.data.document.artboards[0].children[0].children[0].name
        ).toBe("Updated Title");
      }
    });
  });

  describe("deleteNode", () => {
    it("deletes an existing node", () => {
      const result = deleteNode(testDocument, "01JF2Q09H0C3YV2TE8EH8X7MTA");

      console.log("Delete result:", result);
      expect(result.success).toBe(true);
      if (result.data) {
        expect(
          result.data.document.artboards[0].children[0].children.length
        ).toBe(0);
      }
    });
  });

  describe("Operation Immutability", () => {
    it("operations do not mutate the original document", () => {
      const originalDoc = JSON.stringify(testDocument);

      // Perform operations
      createNode(testDocument, [0, "children"], {
        type: "text",
        name: "Test",
        frame: { x: 0, y: 0, width: 100, height: 20 },
        text: "test",
      });

      // Original document should be unchanged
      expect(JSON.stringify(testDocument)).toBe(originalDoc);
    });
  });
});
