/**
 * @fileoverview Tests for data augmentation system
 * @author @darianrosebrook
 */

import { describe, it, expect, beforeEach } from "vitest";
import { AugmentationEngine, CanvasGenerators } from "../src/index.js";
import * as fc from "fast-check";

describe("AugmentationEngine", () => {
  let engine: AugmentationEngine;
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
                textStyle: { family: "Inter", size: 48, weight: "700", color: "tokens.color.text" },
              },
            ],
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    engine = new AugmentationEngine({
      layoutPerturbation: { enabled: true, tolerance: 0.1 },
      tokenPermutation: { enabled: true },
      propFuzzing: { enabled: true },
      svgFuzzing: { enabled: true, windingRuleVariation: true, strokeWidthVariation: true },
      a11yValidation: { enabled: true, strict: false, contrastThreshold: "AA" },
    });
  });

  describe("generateAugmentedVariants", () => {
    it("generates multiple augmented variants", async () => {
      const variants = await engine.generateAugmentedVariants(testDocument, 3);

      expect(variants).toHaveLength(3);
      variants.forEach((variant) => {
        expect(variant.original).toEqual(testDocument);
        expect(variant.augmented).not.toEqual(testDocument);
        expect(variant.transformations.length).toBeGreaterThan(0);
      });
    });

    it("applies layout perturbations by default", async () => {
      const variants = await engine.generateAugmentedVariants(testDocument, 1);
      const variant = variants[0];

      // Should have layout transformations
      const layoutTransformations = variant.transformations.filter(t => t.type === "layout");
      expect(layoutTransformations.length).toBeGreaterThan(0);

      // Frame coordinates should be different
      const originalHero = testDocument.artboards[0].children[0];
      const augmentedHero = variant.augmented.artboards[0].children[0];
      expect(augmentedHero.frame).not.toEqual(originalHero.frame);
    });

    it("applies token permutations", async () => {
      const variants = await engine.generateAugmentedVariants(testDocument, 1);
      const variant = variants[0];

      // Should have token transformations
      const tokenTransformations = variant.transformations.filter(t => t.type === "token");
      expect(tokenTransformations.length).toBeGreaterThan(0);
    });

    it("tracks transformations correctly", async () => {
      const variants = await engine.generateAugmentedVariants(testDocument, 1);
      const variant = variants[0];

      variant.transformations.forEach((transformation) => {
        expect(transformation.type).toMatch(/^(layout|token|prop|svg)$/);
        expect(transformation.nodeId).toBeDefined();
        expect(transformation.nodePath).toBeDefined();
        expect(transformation.description).toBeDefined();
        expect(transformation.before).toBeDefined();
        expect(transformation.after).toBeDefined();
      });
    });
  });

  describe("augmentDocument", () => {
    it("returns augmented document with transformations", async () => {
      const result = await engine.augmentDocument(testDocument);

      expect(result.original).toEqual(testDocument);
      expect(result.augmented).not.toEqual(testDocument);
      expect(result.transformations.length).toBeGreaterThan(0);
    });

    it("preserves document structure", async () => {
      const result = await engine.augmentDocument(testDocument);

      // Should have same number of artboards
      expect(result.augmented.artboards).toHaveLength(testDocument.artboards.length);

      // Should preserve node types and IDs
      const originalHero = testDocument.artboards[0].children[0];
      const augmentedHero = result.augmented.artboards[0].children[0];
      expect(augmentedHero.id).toBe(originalHero.id);
      expect(augmentedHero.type).toBe(originalHero.type);
      expect(augmentedHero.name).toBe(originalHero.name);
    });
  });

  describe("configuration", () => {
    it("respects disabled augmentation types", async () => {
      const disabledEngine = new AugmentationEngine({
        layoutPerturbation: { enabled: false, tolerance: 0.1 },
        tokenPermutation: { enabled: false },
        propFuzzing: { enabled: false },
        svgFuzzing: { enabled: false, windingRuleVariation: true, strokeWidthVariation: true },
      });

      const result = await disabledEngine.augmentDocument(testDocument);

      // Should have no transformations when all are disabled
      expect(result.transformations.length).toBe(0);
      expect(result.augmented).toEqual(testDocument);
    });

    it("respects custom token map", async () => {
      const customEngine = new AugmentationEngine({
        tokenPermutation: {
          enabled: true,
          tokenMap: {
            "tokens.color.text": ["custom.color.primary"],
          },
        },
      });

      const result = await customEngine.augmentDocument(testDocument);
      expect(result.transformations.length).toBeGreaterThan(0);
    });

    it("includes accessibility validation results", async () => {
      const variants = await engine.generateAugmentedVariants(testDocument, 1);
      const variant = variants[0];

      expect(variant.a11yValidation).toBeDefined();
      expect(variant.a11yValidation!.passed).toBe(true);
      expect(variant.a11yValidation!.violations).toEqual([]);
      expect(variant.a11yValidation!.warnings.length).toBeGreaterThanOrEqual(0);
    });

    it("validates semantic role usage", async () => {
      const semanticDocument = {
        ...testDocument,
        artboards: [
          {
            ...testDocument.artboards[0],
            children: [
              {
                id: "01JF2Q06GTS16EJ3A3F0KK9K3T",
                type: "text",
                name: "Hero Text",
                frame: { x: 0, y: 0, width: 100, height: 50 },
                text: "Hero Title",
                semanticKey: "hero.title", // Hero key on text node (should warn)
              },
            ],
          },
        ],
      };

      const variants = await engine.generateAugmentedVariants(semanticDocument, 1);
      const variant = variants[0];

      expect(variant.a11yValidation!.warnings.length).toBeGreaterThan(0);
      const semanticWarnings = variant.a11yValidation!.warnings.filter(w => w.type === "semantic");
      expect(semanticWarnings.length).toBeGreaterThan(0);
    });

    it("respects strict accessibility validation", async () => {
      const strictEngine = new AugmentationEngine({
        a11yValidation: { enabled: true, strict: true, contrastThreshold: "AA" },
      });

      // This should not throw since our test document passes validation
      await expect(strictEngine.augmentDocument(testDocument)).resolves.toBeDefined();
    });
  });

  describe("accessibility validation", () => {
    it("detects potential accessibility issues", async () => {
      const problematicDocument = {
        schemaVersion: "0.1.0",
        id: "01JF2PZV9G2WR5C3W7P0YHNX9D",
        name: "Problematic Document",
        artboards: [
          {
            id: "01JF2Q02Q3MZ3Q9J7HB3X6N9QB",
            name: "Artboard 1",
            frame: { x: 0, y: 0, width: 1440, height: 1024 },
            children: [
              {
                id: "01JF2Q06GTS16EJ3A3F0KK9K3T",
                type: "component",
                name: "Input Field",
                frame: { x: 0, y: 0, width: 200, height: 40 },
                componentKey: "Input", // Input without label
              },
              {
                id: "01JF2Q07GTS16EJ3A3F0KK9K3U",
                type: "text",
                name: "Large Text",
                frame: { x: 0, y: 50, width: 300, height: 60 },
                text: "This might be a heading",
                textStyle: { size: 32 }, // Large text that might need heading semantics
              },
            ],
          },
        ],
      };

      const variants = await engine.generateAugmentedVariants(problematicDocument, 1);
      const variant = variants[0];

      expect(variant.a11yValidation!.warnings.length).toBeGreaterThan(0);

      // Should warn about input without label
      const inputWarnings = variant.a11yValidation!.warnings.filter(w =>
        w.type === "aria" && w.message.includes("Input component")
      );
      expect(inputWarnings.length).toBeGreaterThan(0);

      // Should warn about large text needing heading semantics
      const headingWarnings = variant.a11yValidation!.warnings.filter(w =>
        w.type === "aria" && w.message.includes("heading")
      );
      expect(headingWarnings.length).toBeGreaterThan(0);
    });
  });
});

describe("CanvasGenerators", () => {
  describe("property-based generators", () => {
    it("generates valid canvas documents", () => {
      fc.assert(
        fc.property(CanvasGenerators.canvasDocument(), (doc) => {
          // Should have required fields
          expect(doc.schemaVersion).toBe("0.1.0");
          expect(doc.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
          expect(doc.name).toBeDefined();
          expect(doc.artboards.length).toBeGreaterThan(0);

          // Each artboard should be valid
          doc.artboards.forEach((artboard) => {
            expect(artboard.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
            expect(artboard.name).toBeDefined();
            expect(artboard.frame).toBeDefined();
            expect(artboard.frame.width).toBeGreaterThan(0);
            expect(artboard.frame.height).toBeGreaterThan(0);
          });

          return true;
        }),
        { numRuns: 10 }
      );
    });

    it("generates valid frame nodes", () => {
      fc.assert(
        fc.property(CanvasGenerators.frameNode(), (node) => {
          expect(node.type).toBe("frame");
          expect(node.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
          expect(node.name).toBeDefined();
          expect(node.frame).toBeDefined();
          expect(node.frame.width).toBeGreaterThan(0);
          expect(node.frame.height).toBeGreaterThan(0);

          if (node.semanticKey) {
            expect(node.semanticKey).toMatch(/^[a-z][a-z0-9]*(\.[a-z0-9]+|\[[0-9]+\])*$/);
          }

          return true;
        }),
        { numRuns: 10 }
      );
    });

    it("generates valid text nodes", () => {
      fc.assert(
        fc.property(CanvasGenerators.textNode(), (node) => {
          expect(node.type).toBe("text");
          expect(node.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
          expect(node.name).toBeDefined();
          expect(node.text).toBeDefined();
          expect(node.frame).toBeDefined();

          if (node.semanticKey) {
            expect(node.semanticKey).toMatch(/^[a-z][a-z0-9]*(\.[a-z0-9]+|\[[0-9]+\])*$/);
          }

          return true;
        }),
        { numRuns: 10 }
      );
    });
  });
});
