/**
 * @fileoverview Tests for semantic diff engine
 * @author @darianrosebrook
 */

import { describe, it, expect } from "vitest";
import {
  SemanticDiffEngine,
  diffDocuments,
} from "../../../src/merge/diff/index.js";
import type { CanvasDocumentType } from "../../../src/merge/types.js";

const baseDoc: CanvasDocumentType = {
  schemaVersion: "0.1.0",
  id: "BASE_DOC",
  name: "Base Document",
  artboards: [
    {
      id: "ARTBOARD_1",
      name: "Main Artboard",
      frame: { x: 0, y: 0, width: 1440, height: 1024 },
      children: [
        {
          id: "FRAME_1",
          type: "frame",
          name: "Container",
          visible: true,
          frame: { x: 100, y: 100, width: 400, height: 300 },
          children: [
            {
              id: "TEXT_1",
              type: "text",
              name: "Title",
              visible: true,
              frame: { x: 20, y: 20, width: 200, height: 40 },
              text: "Hello World",
            },
          ],
        },
        {
          id: "FRAME_2",
          type: "frame",
          name: "Secondary",
          visible: true,
          frame: { x: 600, y: 100, width: 300, height: 200 },
          children: [],
        },
      ],
    },
  ],
};

describe("SemanticDiffEngine", () => {
  describe("diffDocuments", () => {
    it("returns empty operations for identical documents", async () => {
      const result = await diffDocuments(baseDoc, baseDoc);

      expect(result.operations).toHaveLength(0);
      expect(result.summary.total).toBe(0);
      expect(result.metadata.fromDocumentId).toBe(baseDoc.id);
      expect(result.metadata.toDocumentId).toBe(baseDoc.id);
      expect(result.metadata.duration).toBeGreaterThanOrEqual(0);
    });

    it("detects added nodes", async () => {
      const targetDoc: CanvasDocumentType = {
        ...baseDoc,
        artboards: [
          {
            ...baseDoc.artboards[0],
            children: [
              ...baseDoc.artboards[0].children,
              {
                id: "FRAME_3",
                type: "frame",
                name: "New Frame",
                visible: true,
                frame: { x: 200, y: 400, width: 250, height: 150 },
                children: [],
              },
            ],
          },
        ],
      };

      const result = await diffDocuments(baseDoc, targetDoc);

      expect(result.operations).toHaveLength(1);
      expect(result.operations[0]).toMatchObject({
        type: "add",
        nodeId: "FRAME_3",
        metadata: {
          description: expect.stringContaining('Added frame node "New Frame"'),
          severity: "info",
        },
      });
      expect(result.summary.added).toBe(1);
      expect(result.summary.total).toBe(1);
    });

    it("detects removed nodes", async () => {
      const targetDoc: CanvasDocumentType = {
        ...baseDoc,
        artboards: [
          {
            ...baseDoc.artboards[0],
            children: [baseDoc.artboards[0].children[1]], // Remove FRAME_1
          },
        ],
      };

      const result = await diffDocuments(baseDoc, targetDoc);

      // When FRAME_1 is removed, its child TEXT_1 is also removed, and FRAME_2 moves
      expect(result.operations).toHaveLength(3);
      expect(result.operations[0]).toMatchObject({
        type: "remove",
        nodeId: "FRAME_1",
        metadata: {
          description: expect.stringContaining(
            'Removed frame node "Container"'
          ),
          severity: "warning",
        },
      });
      expect(result.operations[1]).toMatchObject({
        type: "remove",
        nodeId: "TEXT_1",
      });
      expect(result.operations[2]).toMatchObject({
        type: "move",
        nodeId: "FRAME_2",
      });
      expect(result.summary.removed).toBe(2);
      expect(result.summary.moved).toBe(1);
      expect(result.summary.total).toBe(3);
    });

    it("detects moved nodes", async () => {
      const targetDoc: CanvasDocumentType = {
        ...baseDoc,
        artboards: [
          {
            ...baseDoc.artboards[0],
            children: [
              baseDoc.artboards[0].children[1], // FRAME_2 first
              baseDoc.artboards[0].children[0], // FRAME_1 second
            ],
          },
        ],
      };

      const result = await diffDocuments(baseDoc, targetDoc);

      // When FRAME_1 moves, its child TEXT_1 also moves
      expect(result.operations).toHaveLength(3); // FRAME_1 moved, FRAME_2 moved, TEXT_1 moved
      expect(result.summary.moved).toBe(3);
      expect(result.summary.total).toBe(3);
    });

    it("detects frame property changes", async () => {
      const targetDoc: CanvasDocumentType = {
        ...baseDoc,
        artboards: [
          {
            ...baseDoc.artboards[0],
            children: [
              {
                ...baseDoc.artboards[0].children[0],
                frame: { x: 150, y: 150, width: 450, height: 350 }, // Changed
              },
              baseDoc.artboards[0].children[1],
            ],
          },
        ],
      };

      const result = await diffDocuments(baseDoc, targetDoc);

      const frameOps = result.operations.filter(
        (op) => op.field && ["x", "y", "width", "height"].includes(op.field)
      );
      expect(frameOps).toHaveLength(4); // All 4 properties changed
      expect(result.summary.modified).toBe(4);
      expect(result.summary.total).toBe(4);
    });

    it("detects visibility changes", async () => {
      const targetDoc: CanvasDocumentType = {
        ...baseDoc,
        artboards: [
          {
            ...baseDoc.artboards[0],
            children: [
              {
                ...baseDoc.artboards[0].children[0],
                visible: false, // Changed from true
              },
              baseDoc.artboards[0].children[1],
            ],
          },
        ],
      };

      const result = await diffDocuments(baseDoc, targetDoc);

      expect(result.operations).toHaveLength(1);
      expect(result.operations[0]).toMatchObject({
        type: "modify",
        field: "visible",
        oldValue: true,
        newValue: false,
        metadata: {
          description: "Changed visibility from true to false",
          severity: "info",
        },
      });
      expect(result.summary.modified).toBe(1);
    });

    it("detects layout changes", async () => {
      const targetDoc: CanvasDocumentType = {
        ...baseDoc,
        artboards: [
          {
            ...baseDoc.artboards[0],
            children: [
              {
                ...baseDoc.artboards[0].children[0],
                layout: { gap: 16 }, // Added layout
              },
              baseDoc.artboards[0].children[1],
            ],
          },
        ],
      };

      const result = await diffDocuments(baseDoc, targetDoc);

      expect(result.operations).toHaveLength(1);
      expect(result.operations[0]).toMatchObject({
        type: "modify",
        field: "layout",
        oldValue: undefined,
        newValue: { gap: 16 },
        metadata: {
          description: "Changed layout properties",
          severity: "info",
        },
      });
      expect(result.summary.modified).toBe(1);
    });

    it("detects text content changes", async () => {
      const targetDoc: CanvasDocumentType = {
        ...baseDoc,
        artboards: [
          {
            ...baseDoc.artboards[0],
            children: [
              {
                ...baseDoc.artboards[0].children[0],
                children: [
                  {
                    ...baseDoc.artboards[0].children[0].children[0],
                    text: "Hello Universe", // Changed text
                  },
                ],
              },
              baseDoc.artboards[0].children[1],
            ],
          },
        ],
      };

      const result = await diffDocuments(baseDoc, targetDoc);

      expect(result.operations).toHaveLength(1);
      expect(result.operations[0]).toMatchObject({
        type: "modify",
        field: "text",
        oldValue: "Hello World",
        newValue: "Hello Universe",
        metadata: {
          description: 'Changed text from "Hello World" to "Hello Universe"',
          severity: "info",
        },
      });
      expect(result.summary.modified).toBe(1);
    });

    it("detects name changes", async () => {
      const targetDoc: CanvasDocumentType = {
        ...baseDoc,
        artboards: [
          {
            ...baseDoc.artboards[0],
            children: [
              {
                ...baseDoc.artboards[0].children[0],
                name: "Renamed Container", // Changed name
              },
              baseDoc.artboards[0].children[1],
            ],
          },
        ],
      };

      const result = await diffDocuments(baseDoc, targetDoc);

      expect(result.operations).toHaveLength(1);
      expect(result.operations[0]).toMatchObject({
        type: "modify",
        field: "name",
        oldValue: "Container",
        newValue: "Renamed Container",
        metadata: {
          description: 'Renamed from "Container" to "Renamed Container"',
          severity: "info",
        },
      });
      expect(result.summary.modified).toBe(1);
    });

    it("respects diff options", async () => {
      const targetDoc: CanvasDocumentType = {
        ...baseDoc,
        artboards: [
          {
            ...baseDoc.artboards[0],
            children: [
              {
                ...baseDoc.artboards[0].children[0],
                visible: false, // Property change
                name: "Renamed", // Metadata change
                children: [
                  {
                    ...baseDoc.artboards[0].children[0].children[0],
                    text: "New Text", // Content change
                  },
                ],
              },
              baseDoc.artboards[0].children[1],
            ],
          },
        ],
      };

      // Test with property changes disabled
      const resultNoProperty = await diffDocuments(baseDoc, targetDoc, {
        includeProperty: false,
        includeContent: true,
        includeMetadata: true,
      });

      expect(resultNoProperty.operations).toHaveLength(2); // Content + metadata only
      expect(
        resultNoProperty.operations.some((op) => op.field === "visible")
      ).toBe(false);
      expect(
        resultNoProperty.operations.some((op) => op.field === "text")
      ).toBe(true);
      expect(
        resultNoProperty.operations.some((op) => op.field === "name")
      ).toBe(true);

      // Test with all disabled
      const resultNone = await diffDocuments(baseDoc, targetDoc, {
        includeProperty: false,
        includeContent: false,
        includeMetadata: false,
      });

      expect(resultNone.operations).toHaveLength(0);
    });

    it("sorts operations deterministically", async () => {
      const targetDoc: CanvasDocumentType = {
        ...baseDoc,
        artboards: [
          {
            ...baseDoc.artboards[0],
            children: [
              // Remove FRAME_2, add FRAME_3, modify FRAME_1
              {
                ...baseDoc.artboards[0].children[0],
                visible: false,
              },
              {
                id: "FRAME_3",
                type: "frame",
                name: "New Frame",
                visible: true,
                frame: { x: 200, y: 400, width: 250, height: 150 },
                children: [],
              },
            ],
          },
        ],
      };

      const result = await diffDocuments(baseDoc, targetDoc);

      // Should be sorted: remove, add, modify
      expect(result.operations[0].type).toBe("remove");
      expect(result.operations[1].type).toBe("add");
      expect(result.operations[2].type).toBe("modify");
    });

    it("includes timing metadata", async () => {
      const result = await diffDocuments(baseDoc, baseDoc);

      expect(result.metadata.timestamp).toBeGreaterThan(0);
      expect(result.metadata.duration).toBeGreaterThanOrEqual(0);
      expect(result.metadata.fromDocumentId).toBe(baseDoc.id);
      expect(result.metadata.toDocumentId).toBe(baseDoc.id);
    });
  });

  describe("SemanticDiffEngine class", () => {
    it("can be instantiated with options", () => {
      const engine = new SemanticDiffEngine({
        includeStructural: true,
        maxOperations: 500,
      });

      expect(engine).toBeInstanceOf(SemanticDiffEngine);
    });

    it("uses default options when none provided", () => {
      const engine = new SemanticDiffEngine();
      expect(engine).toBeInstanceOf(SemanticDiffEngine);
    });
  });
});
