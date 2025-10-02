/**
 * @fileoverview Tests for tree traversal algorithms
 * @author @darianrosebrook
 */

import { describe, it, expect } from "vitest";
import {
  traverseDocument,
  findNodesByType,
  findNodesByName,
  getAncestors,
  getDescendants,
  countNodes,
  getDocumentStats,
} from "../src/traversal.js";

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
              frame: { x: 40, y: 40, width: 400, height: 200 },
              style: { fills: [{ type: "solid", color: "#1E1E1E" }] },
              children: [
                {
                  id: "01JF2Q0EN4G7C6D7I2JL2B1QXE",
                  type: "text",
                  name: "Feature Title",
                  visible: true,
                  frame: { x: 20, y: 20, width: 360, height: 40 },
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

describe("Canvas Engine Traversal", () => {
  describe("traverseDocument", () => {
    it("should traverse all nodes in document", () => {
      const document = createTestDocument();
      const results: Array<{ id: string; type: string; depth: number }> = [];

      for (const result of traverseDocument(document)) {
        results.push({
          id: result.node.id,
          type: result.node.type,
          depth: result.depth,
        });
      }

      // Should traverse artboards, frames, and text nodes
      expect(results.length).toBeGreaterThan(0);

      // Check that we have the expected node types
      const nodeTypes = results.map((r) => r.type);
      expect(nodeTypes).toContain("frame");
      expect(nodeTypes).toContain("text");

      // Check depth progression
      const depths = results.map((r) => r.depth);
      expect(Math.min(...depths)).toBe(1); // Artboards are depth 0, but we start from children
      expect(Math.max(...depths)).toBeGreaterThan(1); // Should have nested nodes
    });

    it("should respect maxDepth option", () => {
      const document = createTestDocument();
      const results: Array<{ depth: number }> = [];

      for (const result of traverseDocument(document, { maxDepth: 2 })) {
        results.push({ depth: result.depth });
      }

      const depths = results.map((r) => r.depth);
      expect(Math.max(...depths)).toBeLessThanOrEqual(2);
    });

    it("should apply filter function", () => {
      const document = createTestDocument();
      const results: Array<{ type: string }> = [];

      for (const result of traverseDocument(document, {
        filter: (node) => node.type === "text",
      })) {
        results.push({ type: result.node.type });
      }

      // Should only include text nodes
      expect(results.every((r) => r.type === "text")).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("findNodesByType", () => {
    it("should find all nodes of specified type", () => {
      const document = createTestDocument();
      const textNodes = findNodesByType(document, "text");

      expect(textNodes.length).toBeGreaterThan(0);
      expect(textNodes.every((node) => node.node.type === "text")).toBe(true);
    });

    it("should return empty array for non-existent type", () => {
      const document = createTestDocument();
      const buttonNodes = findNodesByType(document, "button");

      expect(buttonNodes).toEqual([]);
    });
  });

  describe("findNodesByName", () => {
    it("should find nodes by name pattern", () => {
      const document = createTestDocument();
      const titleNodes = findNodesByName(document, /Title/);

      expect(titleNodes.length).toBeGreaterThan(0);
      expect(titleNodes.every((node) => /Title/.test(node.node.name))).toBe(
        true
      );
    });

    it("should support regex patterns", () => {
      const document = createTestDocument();
      const featureNodes = findNodesByName(document, /Feature/);

      expect(featureNodes.length).toBeGreaterThan(0);
      expect(featureNodes.every((node) => /Feature/.test(node.node.name))).toBe(
        true
      );
    });
  });

  describe("countNodes", () => {
    it("should count all nodes in document", () => {
      const document = createTestDocument();
      const nodeCount = countNodes(document);

      expect(nodeCount).toBeGreaterThan(0);

      // Count manually to verify
      let manualCount = 0;
      function countRecursive(node: any) {
        manualCount++;
        if ("children" in node && node.children) {
          for (const child of node.children) {
            countRecursive(child);
          }
        }
      }

      for (const artboard of document.artboards) {
        if (artboard.children) {
          for (const child of artboard.children) {
            countRecursive(child);
          }
        }
      }

      expect(nodeCount).toBe(manualCount);
    });
  });

  describe("getDocumentStats", () => {
    it("should return comprehensive document statistics", () => {
      const document = createTestDocument();
      const stats = getDocumentStats(document);

      expect(stats.totalNodes).toBeGreaterThan(0);
      expect(stats.artboardCount).toBe(1);
      expect(stats.maxDepth).toBeGreaterThan(0);
      expect(stats.nodesByType).toBeDefined();

      // Should have frame and text node types
      expect(stats.nodesByType.frame).toBeGreaterThan(0);
      expect(stats.nodesByType.text).toBeGreaterThan(0);
    });
  });

  describe("getAncestors", () => {
    it("should return all ancestors of a node", () => {
      const document = createTestDocument();

      // Find a deeply nested node (text node inside feature frame)
      const textNode = findNodesByType(document, "text")[1]; // Second text node
      const ancestors = getAncestors(document, textNode.path);

      expect(ancestors.length).toBeGreaterThan(0);

      // Should include the frame and artboard
      const ancestorTypes = ancestors.map((a) => a.node.type);
      expect(ancestorTypes).toContain("frame");
    });
  });

  describe("getDescendants", () => {
    it("should return all descendants of a node", () => {
      const document = createTestDocument();

      // Find the hero frame (has children)
      const heroFrame = findNodesByName(document, /Hero/)[0];
      const descendants = getDescendants(document, heroFrame.path);

      expect(descendants.length).toBeGreaterThan(0);

      // Should include the text nodes inside
      const descendantTypes = descendants.map((d) => d.node.type);
      expect(descendantTypes).toContain("text");
    });
  });
});
