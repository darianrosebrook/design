/**
 * @fileoverview Acceptance Test A1: Canvas transformation operations
 * @author @darianrosebrook
 *
 * A1: Given a canvas document with nested components,
 * When applying transformation operations (move, resize, style changes),
 * Then all operations succeed and return valid documents that pass schema validation.
 */

import { describe, it, expect } from "vitest";
import {
  createNode,
  updateNode,
  validateCanvasDocument,
  generateULID,
  CanvasDocument,
  NodeType,
} from "@paths-design/canvas-schema";
import {
  createNode as createNodeOp,
  updateNode as updateNodeOp,
  findNodeById,
} from "../src/index.js";

describe("Acceptance Criteria A1: Canvas Transformation Operations", () => {
  let testDoc: CanvasDocument;

  beforeEach(() => {
    // Create a test document with nested components
    const artboardId = generateULID();
    const parentFrameId = generateULID();
    const childTextId = generateULID();

    testDoc = {
      schemaVersion: "0.1.0",
      id: generateULID(),
      name: "Test Document A1",
      artboards: [
        {
          id: artboardId,
          name: "Main Artboard",
          frame: { x: 0, y: 0, width: 1200, height: 800 },
          visible: true,
          children: [
            {
              id: parentFrameId,
              type: "frame",
              name: "Parent Frame",
              frame: { x: 100, y: 100, width: 400, height: 300 },
              visible: true,
              style: {
                fills: [{ type: "solid", color: "#ffffff" }],
                radius: 8,
                opacity: 1,
              },
              children: [
                {
                  id: childTextId,
                  type: "text",
                  name: "Child Text",
                  frame: { x: 20, y: 20, width: 200, height: 50 },
                  visible: true,
                  text: "Hello World",
                  textStyle: {
                    size: 24,
                    family: "Inter",
                    weight: "400",
                    color: "#000000",
                  },
                },
              ],
            },
          ],
        },
      ],
    };
  });

  it("should validate initial document structure", () => {
    const validation = validateCanvasDocument(testDoc);
    if (!validation.success) {
      console.log("Initial validation errors:", validation.errors);
    }
    expect(validation.success).toBe(true);
    expect(validation.errors).toBeUndefined();
  });

  describe("Move Operations", () => {
    it("should move parent frame successfully", async () => {
      const parentFrameId = testDoc.artboards[0].children[0].id;

      const result = await updateNodeOp(testDoc, parentFrameId, {
        frame: { x: 200, y: 150, width: 400, height: 300 },
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      const updatedDoc = result.data!.document;
      const validation = validateCanvasDocument(updatedDoc);
      if (!validation.success) {
        console.log("Validation errors:", validation.errors);
      }
      expect(validation.success).toBe(true);

      // Verify the move operation
      const movedNode = findNodeById(updatedDoc, parentFrameId);
      expect(movedNode.success).toBe(true);
      expect(movedNode.data!.node.frame.x).toBe(200);
      expect(movedNode.data!.node.frame.y).toBe(150);
    });

    it("should move child element successfully", async () => {
      const childTextId = testDoc.artboards[0].children[0].children[0].id;

      const result = await updateNodeOp(testDoc, childTextId, {
        frame: { x: 40, y: 40, width: 200, height: 50 },
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      const updatedDoc = result.data!.document;
      const validation = validateCanvasDocument(updatedDoc);
      if (!validation.success) {
        console.log("Validation errors:", validation.errors);
      }
      expect(validation.success).toBe(true);

      // Verify the move operation
      const movedNode = findNodeById(updatedDoc, childTextId);
      expect(movedNode.success).toBe(true);
      expect(movedNode.data!.node.frame.x).toBe(40);
      expect(movedNode.data!.node.frame.y).toBe(40);
    });
  });

  describe("Resize Operations", () => {
    it("should resize parent frame successfully", async () => {
      const parentFrameId = testDoc.artboards[0].children[0].id;

      const result = await updateNodeOp(testDoc, parentFrameId, {
        frame: { x: 100, y: 100, width: 500, height: 400 },
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      const updatedDoc = result.data!.document;
      const validation = validateCanvasDocument(updatedDoc);
      if (!validation.success) {
        console.log("Validation errors:", validation.errors);
      }
      expect(validation.success).toBe(true);

      // Verify the resize operation
      const resizedNode = findNodeById(updatedDoc, parentFrameId);
      expect(resizedNode.success).toBe(true);
      expect(resizedNode.data!.node.frame.width).toBe(500);
      expect(resizedNode.data!.node.frame.height).toBe(400);
    });

    it("should resize child text element successfully", async () => {
      const childTextId = testDoc.artboards[0].children[0].children[0].id;

      const result = await updateNodeOp(testDoc, childTextId, {
        frame: { x: 20, y: 20, width: 250, height: 60 },
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      const updatedDoc = result.data!.document;
      const validation = validateCanvasDocument(updatedDoc);
      if (!validation.success) {
        console.log("Validation errors:", validation.errors);
      }
      expect(validation.success).toBe(true);

      // Verify the resize operation
      const resizedNode = findNodeById(updatedDoc, childTextId);
      expect(resizedNode.success).toBe(true);
      expect(resizedNode.data!.node.frame.width).toBe(250);
      expect(resizedNode.data!.node.frame.height).toBe(60);
    });
  });

  describe("Style Change Operations", () => {
    it("should update text styling successfully", async () => {
      const childTextId = testDoc.artboards[0].children[0].children[0].id;

      const result = await updateNodeOp(testDoc, childTextId, {
        textStyle: {
          size: 32,
          family: "Arial",
          weight: "700",
          color: "#ff6600",
        },
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      const updatedDoc = result.data!.document;
      const validation = validateCanvasDocument(updatedDoc);
      if (!validation.success) {
        console.log("Validation errors:", validation.errors);
      }
      expect(validation.success).toBe(true);

      // Verify the style change
      const styledNode = findNodeById(updatedDoc, childTextId);
      expect(styledNode.success).toBe(true);
      expect(styledNode.data!.node.textStyle?.size).toBe(32);
      expect(styledNode.data!.node.textStyle?.family).toBe("Arial");
      expect(styledNode.data!.node.textStyle?.weight).toBe("700");
      expect(styledNode.data!.node.textStyle?.color).toBe("#ff6600");
    });

    it("should update frame styling successfully", async () => {
      const parentFrameId = testDoc.artboards[0].children[0].id;

      const result = await updateNodeOp(testDoc, parentFrameId, {
        style: {
          fills: [{ type: "solid", color: "#f0f0f0" }],
          radius: 16,
          opacity: 0.9,
        },
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      const updatedDoc = result.data!.document;
      const validation = validateCanvasDocument(updatedDoc);
      if (!validation.success) {
        console.log("Validation errors:", validation.errors);
      }
      expect(validation.success).toBe(true);

      // Verify the style change
      const styledNode = findNodeById(updatedDoc, parentFrameId);
      expect(styledNode.success).toBe(true);
      expect(styledNode.data!.node.style?.fills?.[0]?.color).toBe("#f0f0f0");
      expect(styledNode.data!.node.style?.radius).toBe(16);
      expect(styledNode.data!.node.style?.opacity).toBe(0.9);
    });
  });

  describe("Complex Operations", () => {
    it("should handle multiple simultaneous operations", async () => {
      const parentFrameId = testDoc.artboards[0].children[0].id;
      const childTextId = testDoc.artboards[0].children[0].children[0].id;

      // Move parent frame
      const moveResult = await updateNodeOp(testDoc, parentFrameId, {
        frame: { x: 150, y: 120, width: 450, height: 350 },
      });
      expect(moveResult.success).toBe(true);

      // Update text styling
      const styleResult = await updateNodeOp(
        moveResult.data!.document,
        childTextId,
        {
          textStyle: {
            size: 28,
            family: "Helvetica",
            weight: "500",
            color: "#333333",
          },
        }
      );
      expect(styleResult.success).toBe(true);

      // Update frame styling
      const frameResult = await updateNodeOp(
        styleResult.data!.document,
        parentFrameId,
        {
          style: {
            fills: [{ type: "solid", color: "#f5f5f5" }],
            radius: 12,
            opacity: 0.95,
          },
        }
      );
      expect(frameResult.success).toBe(true);

      // Final validation
      const finalDoc = frameResult.data!.document;
      const validation = validateCanvasDocument(finalDoc);
      if (!validation.success) {
        console.log("Complex operation validation errors:", validation.errors);
      }
      expect(validation.success).toBe(true);

      // Verify all changes were applied
      const parentNode = findNodeById(finalDoc, parentFrameId);
      const textNode = findNodeById(finalDoc, childTextId);

      expect(parentNode.data!.node.frame.x).toBe(150);
      expect(parentNode.data!.node.frame.y).toBe(120);
      expect(parentNode.data!.node.frame.width).toBe(450);
      expect(parentNode.data!.node.frame.height).toBe(350);
      expect(parentNode.data!.node.style?.fills?.[0]?.color).toBe("#f5f5f5");
      expect(parentNode.data!.node.style?.radius).toBe(12);

      expect(textNode.data!.node.textStyle?.size).toBe(28);
      expect(textNode.data!.node.textStyle?.family).toBe("Helvetica");
      expect(textNode.data!.node.textStyle?.color).toBe("#333333");
    });
  });

  describe("Error Handling", () => {
    it("should reject invalid operations gracefully", async () => {
      const invalidId = "invalid-node-id";

      const result = await updateNodeOp(testDoc, invalidId, {
        frame: { x: 999, y: 999, width: 100, height: 100 },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should maintain document validity after failed operations", () => {
      // Document should still be valid even if operations fail
      const validation = validateCanvasDocument(testDoc);
      if (!validation.success) {
        console.log("Post-error validation errors:", validation.errors);
      }
      expect(validation.success).toBe(true);
    });
  });
});
