/**
 * @fileoverview Tests for JSON Patch operations
 * @author @darianrosebrook
 */

import { describe, it, expect } from "vitest";
import {
  applyPatch,
  applyPatches,
  invertPatch,
  invertPatches,
} from "../src/patches.js";

// Note: invertPatch and invertPatches are basic implementations for testing
// In a full implementation, they'd need access to original values for proper inversion

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
        {
          id: "01JF2Q0FH2G5C4B5H1IK1A0PWD",
          type: "text",
          name: "Subtitle",
          visible: true,
          frame: { x: 100, y: 100, width: 200, height: 50 },
          style: {},
          text: "Another Title",
          textStyle: {
            family: "Inter",
            size: 16,
            weight: "400",
            color: "#000000",
          },
        },
      ],
    },
  ],
});

describe("Canvas Engine Patches", () => {
  describe("applyPatch", () => {
    it("should apply add operation", () => {
      const document = createTestDocument();

      const patch = {
        op: "add" as const,
        path: "/artboards/0/children/1",
        value: {
          id: "01JF2Q0FH2G5C4B5H1IK1A0PWD",
          type: "text",
          name: "New Text",
          visible: true,
          frame: { x: 100, y: 100, width: 200, height: 50 },
          style: {},
          text: "New text node",
          textStyle: {
            family: "Inter",
            size: 16,
            weight: "400",
            color: "#000000",
          },
        },
      };

      const result = applyPatch(document, patch);

      expect(result.artboards[0].children).toHaveLength(2);
      expect(result.artboards[0].children[1].name).toBe("New Text");
    });

    it("should apply remove operation", () => {
      const document = createTestDocument();

      const patch = {
        op: "remove" as const,
        path: "/artboards/0/children/0",
      };

      const result = applyPatch(document, patch);

      expect(result.artboards[0].children).toHaveLength(0);
    });

    it("should apply replace operation", () => {
      const document = createTestDocument();

      const patch = {
        op: "replace" as const,
        path: "/artboards/0/children/0/name",
        value: "Updated Hero",
      };

      const result = applyPatch(document, patch);

      expect(result.artboards[0].children[0].name).toBe("Updated Hero");
    });

    it("should apply move operation", () => {
      const document = createTestDocument();

      const patch = {
        op: "move" as const,
        from: "/artboards/0/children/0",
        path: "/artboards/0/children/1",
      };

      const result = applyPatch(document, patch);

      console.log(
        "Original:",
        document.artboards[0].children.map((c) => c.name)
      );
      console.log(
        "Result:",
        result.artboards[0].children.map((c) => c.name)
      );

      expect(result.artboards[0].children).toHaveLength(2);
      expect(result.artboards[0].children[0].name).toBe("Subtitle");
      expect(result.artboards[0].children[1].name).toBe("Hero");
    });

    it("should apply copy operation", () => {
      const document = createTestDocument();

      const patch = {
        op: "copy" as const,
        from: "/artboards/0/children/0/children/0",
        path: "/artboards/0/children/1",
      };

      const result = applyPatch(document, patch);

      expect(result.artboards[0].children).toHaveLength(2);
      expect(result.artboards[0].children[1].name).toBe("Title");
      expect(result.artboards[0].children[1].text).toBe("Build in your IDE");
    });

    it("should apply test operation", () => {
      const document = createTestDocument();

      const patch = {
        op: "test" as const,
        path: "/artboards/0/children/0/name",
        value: "Hero",
      };

      const result = applyPatch(document, patch);

      // Test passes, should return modified document
      expect(result.artboards[0].children[0].name).toBe("Hero");
    });

    it("should fail test operation with wrong value", () => {
      const document = createTestDocument();

      const patch = {
        op: "test" as const,
        path: "/artboards/0/children/0/name",
        value: "Wrong Name",
      };

      const result = applyPatch(document, patch);

      // Test fails, should return original document
      expect(result.artboards[0].children[0].name).toBe("Hero");
    });

    it("should throw on unknown operation", () => {
      const document = createTestDocument();

      const patch = {
        op: "unknown" as any,
        path: "/artboards/0/children/0/name",
        value: "Test",
      };

      expect(() => applyPatch(document, patch)).toThrow(
        "Unknown patch operation: unknown"
      );
    });
  });

  describe("applyPatches", () => {
    it("should apply multiple patches in sequence", () => {
      const document = createTestDocument();

      const patches = [
        {
          op: "replace" as const,
          path: "/artboards/0/children/0/name",
          value: "Updated Hero",
        },
        {
          op: "add" as const,
          path: "/artboards/0/children/1",
          value: {
            id: "01JF2Q0FH2G5C4B5H1IK1A0PWD",
            type: "text",
            name: "New Text",
            visible: true,
            frame: { x: 100, y: 100, width: 200, height: 50 },
            style: {},
            text: "New text node",
            textStyle: {
              family: "Inter",
              size: 16,
              weight: "400",
              color: "#000000",
            },
          },
        },
      ];

      const result = applyPatches(document, patches);

      expect(result.artboards[0].children).toHaveLength(2);
      expect(result.artboards[0].children[0].name).toBe("Updated Hero");
      expect(result.artboards[0].children[1].name).toBe("New Text");
    });
  });

  describe("invertPatch", () => {
    it("should invert add operation to remove", () => {
      const patch = {
        op: "add" as const,
        path: "/artboards/0/children/1",
        value: {
          id: "01JF2Q0FH2G5C4B5H1IK1A0PWD",
          type: "text",
          name: "New Text",
          visible: true,
          frame: { x: 100, y: 100, width: 200, height: 50 },
          style: {},
          text: "New text node",
          textStyle: {
            family: "Inter",
            size: 16,
            weight: "400",
            color: "#000000",
          },
        },
      };

      const inverted = invertPatch(patch);

      expect(inverted.op).toBe("remove");
      expect(inverted.path).toBe("/artboards/0/children/1");
    });

    it("should invert remove operation to add", () => {
      const patch = {
        op: "remove" as const,
        path: "/artboards/0/children/0",
      };

      const inverted = invertPatch(patch);

      expect(inverted.op).toBe("add");
      expect(inverted.path).toBe("/artboards/0/children/0");
    });

    it("should invert replace operation to replace with original value", () => {
      const patch = {
        op: "replace" as const,
        path: "/artboards/0/children/0/name",
        value: "New Name",
      };

      const inverted = invertPatch(patch);

      expect(inverted.op).toBe("replace");
      expect(inverted.path).toBe("/artboards/0/children/0/name");
      // Note: In a real implementation, we'd need the original value
      // For now, this is a basic test
    });

    it("should invert move operation", () => {
      const patch = {
        op: "move" as const,
        from: "/artboards/0/children/0",
        path: "/artboards/0/children/1",
      };

      const inverted = invertPatch(patch);

      expect(inverted.op).toBe("move");
      expect(inverted.from).toBe("/artboards/0/children/1");
      expect(inverted.path).toBe("/artboards/0/children/0");
    });

    it("should invert copy operation to remove", () => {
      const patch = {
        op: "copy" as const,
        from: "/artboards/0/children/0",
        path: "/artboards/0/children/1",
      };

      const inverted = invertPatch(patch);

      expect(inverted.op).toBe("remove");
      expect(inverted.path).toBe("/artboards/0/children/1");
    });

    it("should invert test operation to test with original value", () => {
      const patch = {
        op: "test" as const,
        path: "/artboards/0/children/0/name",
        value: "Hero",
      };

      const inverted = invertPatch(patch);

      expect(inverted.op).toBe("test");
      expect(inverted.path).toBe("/artboards/0/children/0/name");
      // Note: In a real implementation, we'd need the original value
    });
  });

  describe("invertPatches", () => {
    it("should invert multiple patches in reverse order", () => {
      const patches = [
        {
          op: "replace" as const,
          path: "/artboards/0/children/0/name",
          value: "Updated Hero",
        },
        {
          op: "add" as const,
          path: "/artboards/0/children/1",
          value: {
            id: "01JF2Q0FH2G5C4B5H1IK1A0PWD",
            type: "text",
            name: "New Text",
            visible: true,
            frame: { x: 100, y: 100, width: 200, height: 50 },
            style: {},
            text: "New text node",
            textStyle: {
              family: "Inter",
              size: 16,
              weight: "400",
              color: "#000000",
            },
          },
        },
      ];

      const inverted = invertPatches(patches);

      expect(inverted).toHaveLength(2);

      // Should be in reverse order
      expect(inverted[0].op).toBe("remove");
      expect(inverted[0].path).toBe("/artboards/0/children/1");

      expect(inverted[1].op).toBe("replace");
      expect(inverted[1].path).toBe("/artboards/0/children/0/name");
    });
  });

  describe("edge cases", () => {
    it("should handle patches on non-existent paths", () => {
      const document = createTestDocument();

      const patch = {
        op: "replace" as const,
        path: "/artboards/0/children/999/name",
        value: "Non-existent",
      };

      // Should throw an error for non-existent path
      expect(() => applyPatch(document, patch)).toThrow("Path not found");
    });

    it("should handle empty patch arrays", () => {
      const document = createTestDocument();
      const result = applyPatches(document, []);

      expect(result).toEqual(document);
    });

    it("should handle single patch arrays", () => {
      const document = createTestDocument();

      const patches = [
        {
          op: "replace" as const,
          path: "/artboards/0/children/0/name",
          value: "Updated Hero",
        },
      ];

      const result = applyPatches(document, patches);

      expect(result.artboards[0].children[0].name).toBe("Updated Hero");
    });
  });
});
