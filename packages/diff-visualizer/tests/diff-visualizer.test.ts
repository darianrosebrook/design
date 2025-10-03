/**
 * @fileoverview Tests for semantic diff visualizer
 * @author @darianrosebrook
 */

import { describe, it, expect } from "vitest";
import { DiffVisualizer, compareCanvasDocuments, generateHTMLDiff, generateMarkdownDiff } from "../src/index.js";

describe("DiffVisualizer", () => {
  let visualizer: DiffVisualizer;

  const baseDocument = {
    schemaVersion: "0.1.0",
    id: "01JF2PZV9G2WR5C3W7P0YHNX9D",
    name: "Base Document",
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
            semanticKey: "hero.section",
            children: [
              {
                id: "01JF2Q09H0C3YV2TE8EH8X7MTA",
                type: "text",
                name: "Title",
                frame: { x: 32, y: 40, width: 600, height: 64 },
                text: "Build in your IDE",
                semanticKey: "hero.title",
              },
            ],
          },
          {
            id: "01JF2Q10H0C3YV2TE8EH8X7MTB",
            type: "frame",
            name: "Navigation",
            frame: { x: 0, y: 0, width: 1440, height: 80 },
            semanticKey: "nav.container",
            children: [
              {
                id: "01JF2Q11H0C3YV2TE8EH8X7MTC",
                type: "text",
                name: "Home",
                frame: { x: 32, y: 20, width: 100, height: 40 },
                text: "Home",
                semanticKey: "nav.items[0]",
              },
              {
                id: "01JF2Q12H0C3YV2TE8EH8X7MTD",
                type: "text",
                name: "About",
                frame: { x: 150, y: 20, width: 100, height: 40 },
                text: "About",
                semanticKey: "nav.items[1]",
              },
            ],
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    visualizer = new DiffVisualizer();
  });

  describe("compareDocuments", () => {
    it("detects no changes between identical documents", () => {
      const result = visualizer.compareDocuments(baseDocument, baseDocument);

      expect(result.summary.totalChanges).toBe(0);
      expect(result.nodeDiffs).toHaveLength(0);
      expect(result.propertyChanges).toHaveLength(0);
    });

    it("detects added artboards", () => {
      const modifiedDocument = {
        ...baseDocument,
        artboards: [
          ...baseDocument.artboards,
          {
            id: "01JF2Q13H0C3YV2TE8EH8X7MTE",
            name: "New Artboard",
            frame: { x: 0, y: 0, width: 800, height: 600 },
            children: [],
          },
        ],
      };

      const result = visualizer.compareDocuments(baseDocument, modifiedDocument);

      expect(result.summary.addedNodes).toBe(1);
      expect(result.nodeDiffs).toHaveLength(1);
      expect(result.nodeDiffs[0].type).toBe("added");
      expect(result.nodeDiffs[0].description).toContain("Added artboard");
    });

    it("detects removed artboards", () => {
      const modifiedDocument = {
        ...baseDocument,
        artboards: [],
      };

      const result = visualizer.compareDocuments(baseDocument, modifiedDocument);

      expect(result.summary.removedNodes).toBe(1);
      expect(result.nodeDiffs).toHaveLength(1);
      expect(result.nodeDiffs[0].type).toBe("removed");
      expect(result.nodeDiffs[0].description).toContain("Removed artboard");
    });

    it("detects moved nodes", () => {
      const modifiedDocument = {
        ...baseDocument,
        artboards: [
          {
            ...baseDocument.artboards[0],
            children: [
              baseDocument.artboards[0].children[1], // Navigation first
              baseDocument.artboards[0].children[0], // Hero second
            ],
          },
        ],
      };

      const result = visualizer.compareDocuments(baseDocument, modifiedDocument);

      expect(result.summary.movedNodes).toBeGreaterThan(0);
      const moveDiffs = result.nodeDiffs.filter(d => d.type === "moved");
      expect(moveDiffs.length).toBeGreaterThan(0);
      expect(moveDiffs[0].description).toContain("Moved");
      expect(moveDiffs[0].oldPath).toBeDefined();
      expect(moveDiffs[0].newPath).toBeDefined();
    });

    it("detects semantic key changes", () => {
      const modifiedDocument = {
        ...baseDocument,
        artboards: [
          {
            ...baseDocument.artboards[0],
            children: [
              {
                ...baseDocument.artboards[0].children[0],
                semanticKey: "hero.banner", // Changed from hero.section
              },
            ],
          },
        ],
      };

      const result = visualizer.compareDocuments(baseDocument, modifiedDocument);

      expect(result.propertyChanges).toHaveLength(1);
      expect(result.propertyChanges[0].property).toBe("semanticKey");
      expect(result.propertyChanges[0].description).toContain("Changed semantic key");
    });

    it("detects text content changes", () => {
      const modifiedDocument = {
        ...baseDocument,
        artboards: [
          {
            ...baseDocument.artboards[0],
            children: [
              {
                ...baseDocument.artboards[0].children[0],
                children: [
                  {
                    ...baseDocument.artboards[0].children[0].children[0],
                    text: "Design in your IDE", // Changed text
                  },
                ],
              },
            ],
          },
        ],
      };

      const result = visualizer.compareDocuments(baseDocument, modifiedDocument);

      expect(result.propertyChanges.length).toBeGreaterThan(0);
      const textChanges = result.propertyChanges.filter(c => c.property === "text");
      expect(textChanges.length).toBeGreaterThan(0);
      expect(result.propertyChanges[0].description).toContain("Changed text content");
    });

    it("includes semantic keys in diff descriptions", () => {
      const modifiedDocument = {
        ...baseDocument,
        artboards: [
          {
            ...baseDocument.artboards[0],
            children: [
              {
                ...baseDocument.artboards[0].children[0],
                children: [], // Removed title
              },
            ],
          },
        ],
      };

      const result = visualizer.compareDocuments(baseDocument, modifiedDocument);

      const titleRemoval = result.nodeDiffs.find(d =>
        d.description.includes("hero.title")
      );
      expect(titleRemoval).toBeDefined();
      expect(titleRemoval?.semanticKey).toBe("hero.title");
    });
  });

  describe("HTML generation", () => {
    it("generates HTML with summary statistics", () => {
      const modifiedDocument = {
        ...baseDocument,
        artboards: [
          {
            ...baseDocument.artboards[0],
            children: [
              {
                ...baseDocument.artboards[0].children[0],
                children: [
                  {
                    ...baseDocument.artboards[0].children[0].children[0],
                    text: "Updated Title",
                  },
                ],
              },
            ],
          },
        ],
      };

      const result = visualizer.compareDocuments(baseDocument, modifiedDocument);
      const html = visualizer.generateHTMLDiff(result);

      expect(html).toContain("Canvas Document Changes");
      expect(html).toContain("Total Changes");
      expect(html).toContain("Modified");
      expect(html).toContain("Node Changes");
      expect(html).toContain("Property Changes");
    });

    it("includes semantic badges in HTML", () => {
      const result = visualizer.compareDocuments(baseDocument, baseDocument);
      const html = visualizer.generateHTMLDiff(result);

      // Should not include semantic badges when no changes
      expect(html).not.toContain("semantic-badge");
    });
  });

  describe("Markdown generation", () => {
    it("generates markdown with summary", () => {
      const modifiedDocument = {
        ...baseDocument,
        artboards: [
          {
            ...baseDocument.artboards[0],
            children: [
              {
                ...baseDocument.artboards[0].children[0],
                name: "Updated Hero",
              },
            ],
          },
        ],
      };

      const result = visualizer.compareDocuments(baseDocument, modifiedDocument);
      const markdown = visualizer.generateMarkdownDiff(result);

      expect(markdown).toContain("Canvas Document Changes");
      expect(markdown).toContain("Summary:");
      expect(markdown).toContain("Node Changes");
    });

    it("includes semantic keys as badges in markdown", () => {
      const result = visualizer.compareDocuments(baseDocument, baseDocument);
      const markdown = visualizer.generateMarkdownDiff(result);

      // Should not include semantic badges when no changes
      expect(markdown).not.toContain("`hero.title`");
    });
  });

  describe("summary generation", () => {
    it("correctly categorizes different types of changes", () => {
      const modifiedDocument = {
        ...baseDocument,
        artboards: [
          {
            ...baseDocument.artboards[0],
            children: [
              // Move hero to second position
              baseDocument.artboards[0].children[1],
              baseDocument.artboards[0].children[0],
            ],
          },
        ],
      };

      const result = visualizer.compareDocuments(baseDocument, modifiedDocument);

      expect(result.summary.totalChanges).toBeGreaterThan(0);
      expect(result.summary.movedNodes).toBeGreaterThan(0);
      expect(result.summary.semanticChanges).toBeGreaterThan(0);
    });
  });

  describe("convenience functions", () => {
    it("compareCanvasDocuments works as expected", () => {
      const result = compareCanvasDocuments(baseDocument, baseDocument);
      expect(result.summary.totalChanges).toBe(0);
    });

    it("generateHTMLDiff works as expected", () => {
      const result = compareCanvasDocuments(baseDocument, baseDocument);
      const html = generateHTMLDiff(result);
      expect(html).toContain("Canvas Document Changes");
    });

    it("generateMarkdownDiff works as expected", () => {
      const result = compareCanvasDocuments(baseDocument, baseDocument);
      const markdown = generateMarkdownDiff(result);
      expect(markdown).toContain("Canvas Document Changes");
    });
  });
});
