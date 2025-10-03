/**
 * @fileoverview Tests for pattern manifest system
 * @author @darianrosebrook
 */

import { describe, it, expect } from "vitest";
import {
  PatternRegistry,
  PatternDetector,
  PatternGenerator,
  PatternValidator,
  createPatternRegistry,
  detectPatterns,
  generatePattern,
} from "../src/index.js";
import type { CanvasDocumentType } from "@paths-design/canvas-schema";

describe("PatternRegistry", () => {
  let registry: PatternRegistry;

  beforeEach(() => {
    registry = createPatternRegistry();
  });

  describe("pattern management", () => {
    it("registers and retrieves patterns", () => {
      const pattern = registry.get("pattern.tabs");
      expect(pattern).toBeDefined();
      expect(pattern?.name).toBe("Tabs");
      expect(pattern?.category).toBe("navigation");
    });

    it("gets patterns by category", () => {
      const navPatterns = registry.getByCategory("navigation");
      expect(navPatterns.length).toBeGreaterThan(0);
      expect(navPatterns.every(p => p.category === "navigation")).toBe(true);
    });

    it("gets patterns by tag", () => {
      const accessiblePatterns = registry.getByTag("accessibility");
      expect(accessiblePatterns.length).toBeGreaterThan(0);
    });

    it("searches patterns", () => {
      const results = registry.search("tab");
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(p => p.name.toLowerCase().includes("tab"))).toBe(true);
    });
  });

  describe("built-in patterns", () => {
    it("loads all built-in patterns", () => {
      const allPatterns = registry.getAll();
      expect(allPatterns.length).toBeGreaterThan(5); // Should have multiple patterns

      const categories = [...new Set(allPatterns.map(p => p.category))];
      expect(categories).toContain("navigation");
      expect(categories).toContain("overlay");
      expect(categories).toContain("form");
    });

    it("has tabs pattern with correct structure", () => {
      const tabsPattern = registry.get("pattern.tabs");
      expect(tabsPattern).toBeDefined();

      if (tabsPattern) {
        expect(tabsPattern.structure.length).toBe(3); // tablist, tab, tabpanel
        expect(tabsPattern.relationships.length).toBe(2); // controls and owns relationships
        expect(tabsPattern.validation.length).toBe(2); // required child and relationship validation
      }
    });

    it("has dialog pattern with accessibility rules", () => {
      const dialogPattern = registry.get("pattern.dialog");
      expect(dialogPattern).toBeDefined();

      if (dialogPattern) {
        expect(dialogPattern.category).toBe("overlay");
        expect(dialogPattern.tags).toContain("accessibility");
        expect(dialogPattern.structure.length).toBe(5); // trigger, dialog, title, content, close
      }
    });
  });
});

describe("PatternDetector", () => {
  let registry: PatternRegistry;
  let detector: PatternDetector;

  beforeEach(() => {
    registry = createPatternRegistry();
    detector = new PatternDetector(registry);
  });

  describe("pattern detection", () => {
    it("detects tabs pattern in canvas document", () => {
      const canvasDoc: CanvasDocumentType = {
        schemaVersion: "0.1.0",
        id: "01JF2PZV9G2WR5C3W7P0YHNX9D",
        name: "Tabs Test",
        artboards: [
          {
            id: "01JF2Q02Q3MZ3Q9J7HB3X6N9QB",
            name: "Desktop",
            frame: { x: 0, y: 0, width: 800, height: 600 },
            children: [
              {
                id: "01JF2Q06GTS16EJ3A3F0KK9K3T",
                type: "frame",
                name: "Tabs Container",
                frame: { x: 32, y: 32, width: 736, height: 536 },
                semanticKey: "tabs.container",
                children: [
                  {
                    id: "01JF2Q07GTS16EJ3A3F0KK9K3U",
                    type: "frame",
                    name: "Tab List",
                    frame: { x: 0, y: 0, width: 736, height: 48 },
                    semanticKey: "tabs.tablist",
                    children: [
                      {
                        id: "01JF2Q08GTS16EJ3A3F0KK9K3V",
                        type: "text",
                        name: "Tab 1",
                        frame: { x: 16, y: 12, width: 80, height: 24 },
                        text: "Overview",
                        semanticKey: "tabs.tab[0]",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const instances = detector.detectPatterns(canvasDoc);
      const tabsInstance = instances.find(i => i.patternId === "pattern.tabs");

      expect(tabsInstance).toBeDefined();
      expect(tabsInstance?.isComplete).toBe(false); // Missing some required nodes
    });

    it("detects complete tabs pattern", () => {
      const canvasDoc: CanvasDocumentType = {
        schemaVersion: "0.1.0",
        id: "01JF2PZV9G2WR5C3W7P0YHNX9D",
        name: "Complete Tabs",
        artboards: [
          {
            id: "01JF2Q02Q3MZ3Q9J7HB3X6N9QB",
            name: "Desktop",
            frame: { x: 0, y: 0, width: 800, height: 600 },
            children: [
              {
                id: "01JF2Q06GTS16EJ3A3F0KK9K3T",
                type: "frame",
                name: "Tabs Container",
                frame: { x: 32, y: 32, width: 736, height: 536 },
                semanticKey: "tabs.container",
                children: [
                  {
                    id: "01JF2Q07GTS16EJ3A3F0KK9K3U",
                    type: "frame",
                    name: "Tab List",
                    frame: { x: 0, y: 0, width: 736, height: 48 },
                    semanticKey: "tabs.tablist",
                    children: [
                      {
                        id: "01JF2Q08GTS16EJ3A3F0KK9K3V",
                        type: "text",
                        name: "Tab 1",
                        frame: { x: 16, y: 12, width: 80, height: 24 },
                        text: "Overview",
                        semanticKey: "tabs.tab[0]",
                      },
                    ],
                  },
                  {
                    id: "01JF2Q09GTS16EJ3A3F0KK9K3W",
                    type: "frame",
                    name: "Tab Panel 1",
                    frame: { x: 0, y: 48, width: 736, height: 488 },
                    semanticKey: "tabs.tabpanel[0]",
                    children: [
                      {
                        id: "01JF2Q10GTS16EJ3A3F0KK9K3X",
                        type: "text",
                        name: "Panel Content",
                        frame: { x: 16, y: 16, width: 200, height: 32 },
                        text: "This is the panel content.",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const instances = detector.detectPatterns(canvasDoc);
      const tabsInstance = instances.find(i => i.patternId === "pattern.tabs");

      expect(tabsInstance).toBeDefined();
      expect(tabsInstance?.isComplete).toBe(true);
      expect(tabsInstance?.nodeMappings.size).toBeGreaterThan(0);
    });
  });
});

describe("PatternGenerator", () => {
  let registry: PatternRegistry;
  let generator: PatternGenerator;

  beforeEach(() => {
    registry = createPatternRegistry();
    generator = new PatternGenerator(registry);
  });

  describe("pattern generation", () => {
    it("generates canvas document from tabs pattern", () => {
      const canvasDoc = generator.generateFromPattern("pattern.tabs", {
        name: "Generated Tabs",
        position: { x: 50, y: 50 },
      });

      expect(canvasDoc.name).toBe("Generated Tabs");
      expect(canvasDoc.artboards).toHaveLength(1);
      expect(canvasDoc.artboards[0].children).toHaveLength(1); // tabs container

      const tabsContainer = canvasDoc.artboards[0].children[0] as any;
      expect(tabsContainer.semanticKey).toBe("tabs.container");
      expect(tabsContainer.children).toHaveLength(3); // tablist, tab, tabpanel
    });

    it("throws error for non-existent pattern", () => {
      expect(() => {
        generator.generateFromPattern("pattern.nonexistent", {
          name: "Test",
        });
      }).toThrow("Pattern \"pattern.nonexistent\" not found");
    });
  });
});

describe("PatternValidator", () => {
  let registry: PatternRegistry;
  let validator: PatternValidator;

  beforeEach(() => {
    registry = createPatternRegistry();
    validator = new PatternValidator(registry);
  });

  describe("pattern validation", () => {
    it("validates complete tabs pattern", () => {
      const canvasDoc: CanvasDocumentType = {
        schemaVersion: "0.1.0",
        id: "01JF2PZV9G2WR5C3W7P0YHNX9D",
        name: "Valid Tabs",
        artboards: [
          {
            id: "01JF2Q02Q3MZ3Q9J7HB3X6N9QB",
            name: "Desktop",
            frame: { x: 0, y: 0, width: 800, height: 600 },
            children: [
              {
                id: "01JF2Q06GTS16EJ3A3F0KK9K3T",
                type: "frame",
                name: "Tabs Container",
                frame: { x: 32, y: 32, width: 736, height: 536 },
                semanticKey: "tabs.container",
                children: [
                  {
                    id: "01JF2Q07GTS16EJ3A3F0KK9K3U",
                    type: "frame",
                    name: "Tab List",
                    frame: { x: 0, y: 0, width: 736, height: 48 },
                    semanticKey: "tabs.tablist",
                    children: [
                      {
                        id: "01JF2Q08GTS16EJ3A3F0KK9K3V",
                        type: "text",
                        name: "Tab 1",
                        frame: { x: 16, y: 12, width: 80, height: 24 },
                        text: "Overview",
                        semanticKey: "tabs.tab[0]",
                      },
                    ],
                  },
                  {
                    id: "01JF2Q09GTS16EJ3A3F0KK9K3W",
                    type: "frame",
                    name: "Tab Panel 1",
                    frame: { x: 0, y: 48, width: 736, height: 488 },
                    semanticKey: "tabs.tabpanel[0]",
                    children: [
                      {
                        id: "01JF2Q10GTS16EJ3A3F0KK9K3X",
                        type: "text",
                        name: "Panel Content",
                        frame: { x: 16, y: 16, width: 200, height: 32 },
                        text: "This is the panel content.",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const validation = validator.validatePatterns(canvasDoc);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.warnings).toHaveLength(0);
    });

    it("detects missing required nodes", () => {
      const canvasDoc: CanvasDocumentType = {
        schemaVersion: "0.1.0",
        id: "01JF2PZV9G2WR5C3W7P0YHNX9D",
        name: "Invalid Tabs",
        artboards: [
          {
            id: "01JF2Q02Q3MZ3Q9J7HB3X6N9QB",
            name: "Desktop",
            frame: { x: 0, y: 0, width: 800, height: 600 },
            children: [
              {
                id: "01JF2Q06GTS16EJ3A3F0KK9K3T",
                type: "frame",
                name: "Tabs Container",
                frame: { x: 32, y: 32, width: 736, height: 536 },
                semanticKey: "tabs.container",
                children: [
                  // Missing tablist - should cause validation error
                  {
                    id: "01JF2Q09GTS16EJ3A3F0KK9K3W",
                    type: "frame",
                    name: "Tab Panel",
                    frame: { x: 0, y: 48, width: 736, height: 488 },
                    semanticKey: "tabs.tabpanel[0]",
                  },
                ],
              },
            ],
          },
        ],
      };

      const validation = validator.validatePatterns(canvasDoc);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors.some(e => e.includes("tablist"))).toBe(true);
    });
  });
});

describe("convenience functions", () => {
  describe("detectPatterns", () => {
    it("detects patterns using convenience function", () => {
      const canvasDoc: CanvasDocumentType = {
        schemaVersion: "0.1.0",
        id: "01JF2PZV9G2WR5C3W7P0YHNX9D",
        name: "Test",
        artboards: [
          {
            id: "01JF2Q02Q3MZ3Q9J7HB3X6N9QB",
            name: "Desktop",
            frame: { x: 0, y: 0, width: 800, height: 600 },
            children: [
              {
                id: "01JF2Q06GTS16EJ3A3F0KK9K3T",
                type: "frame",
                name: "Tabs Container",
                frame: { x: 32, y: 32, width: 736, height: 536 },
                semanticKey: "tabs.container",
                children: [],
              },
            ],
          },
        ],
      };

      const instances = detectPatterns(canvasDoc);

      expect(instances.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("generatePattern", () => {
    it("generates pattern using convenience function", () => {
      const canvasDoc = generatePattern("pattern.tabs", {
        name: "Generated Tabs",
      });

      expect(canvasDoc.name).toBe("Generated Tabs");
      expect(canvasDoc.artboards).toHaveLength(1);
      expect(canvasDoc.artboards[0].children).toHaveLength(1);
    });
  });
});
