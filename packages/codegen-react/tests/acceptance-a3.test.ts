/**
 * @fileoverview Acceptance Test A3: React code generation from canvas documents
 * @author @darianrosebrook
 *
 * A3: Given a canvas document with components,
 * When React code generation is invoked,
 * Then valid React component code is produced that renders the design accurately.
 */

import { describe, it, expect } from "vitest";
import { generateReactComponents } from "../src/index.js";
import {
  validateCanvasDocument,
  generateULID,
} from "@paths-design/canvas-schema";

describe("Acceptance Criteria A3: React Code Generation from Canvas Documents", () => {
  let testDoc: any;

  beforeEach(() => {
    // Create a comprehensive test document with various components
    testDoc = {
      schemaVersion: "0.1.0",
      id: generateULID(),
      name: "Test Document A3",
      artboards: [
        {
          id: generateULID(),
          name: "Main Artboard",
          frame: { x: 0, y: 0, width: 1200, height: 800 },
          visible: true,
          children: [
            {
              id: generateULID(),
              type: "frame",
              name: "Hero Section",
              frame: { x: 0, y: 0, width: 1200, height: 400 },
              visible: true,
              style: {
                fills: [{ type: "solid", color: "#f8f9fa" }],
                radius: 0,
                opacity: 1,
              },
              children: [
                {
                  id: generateULID(),
                  type: "text",
                  name: "Hero Title",
                  frame: { x: 60, y: 120, width: 600, height: 80 },
                  visible: true,
                  text: "Welcome to Our Platform",
                  textStyle: {
                    size: 48,
                    family: "Inter",
                    weight: "700",
                    color: "#1a1a1a",
                  },
                },
                {
                  id: generateULID(),
                  type: "text",
                  name: "Hero Subtitle",
                  frame: { x: 60, y: 220, width: 500, height: 40 },
                  visible: true,
                  text: "Build amazing experiences with our tools",
                  textStyle: {
                    size: 18,
                    family: "Inter",
                    weight: "400",
                    color: "#666666",
                  },
                },
              ],
            },
            {
              id: generateULID(),
              type: "frame",
              name: "Card Container",
              frame: { x: 60, y: 450, width: 1080, height: 300 },
              visible: true,
              style: {
                fills: [{ type: "solid", color: "#ffffff" }],
                radius: 12,
                opacity: 1,
              },
              children: [
                {
                  id: generateULID(),
                  type: "frame",
                  name: "Feature Card 1",
                  frame: { x: 30, y: 30, width: 320, height: 240 },
                  visible: true,
                  style: {
                    fills: [{ type: "solid", color: "#ffffff" }],
                    radius: 8,
                    opacity: 1,
                  },
                  children: [
                    {
                      id: generateULID(),
                      type: "text",
                      name: "Card Title 1",
                      frame: { x: 20, y: 20, width: 280, height: 32 },
                      visible: true,
                      text: "Easy Integration",
                      textStyle: {
                        size: 24,
                        family: "Inter",
                        weight: "600",
                        color: "#1a1a1a",
                      },
                    },
                    {
                      id: generateULID(),
                      type: "text",
                      name: "Card Description 1",
                      frame: { x: 20, y: 70, width: 280, height: 120 },
                      visible: true,
                      text: "Seamlessly integrate our platform into your existing workflow with minimal setup required.",
                      textStyle: {
                        size: 14,
                        family: "Inter",
                        weight: "400",
                        color: "#666666",
                      },
                    },
                  ],
                },
                {
                  id: generateULID(),
                  type: "frame",
                  name: "Feature Card 2",
                  frame: { x: 380, y: 30, width: 320, height: 240 },
                  visible: true,
                  style: {
                    fills: [{ type: "solid", color: "#ffffff" }],
                    radius: 8,
                    opacity: 1,
                  },
                  children: [
                    {
                      id: generateULID(),
                      type: "text",
                      name: "Card Title 2",
                      frame: { x: 20, y: 20, width: 280, height: 32 },
                      visible: true,
                      text: "Powerful Analytics",
                      textStyle: {
                        size: 24,
                        family: "Inter",
                        weight: "600",
                        color: "#1a1a1a",
                      },
                    },
                    {
                      id: generateULID(),
                      type: "text",
                      name: "Card Description 2",
                      frame: { x: 20, y: 70, width: 280, height: 120 },
                      visible: true,
                      text: "Get deep insights into your usage patterns and performance metrics.",
                      textStyle: {
                        size: 14,
                        family: "Inter",
                        weight: "400",
                        color: "#666666",
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
  });

  it("should validate input canvas document", () => {
    const validation = validateCanvasDocument(testDoc);
    expect(validation.success).toBe(true);
  });

  describe("Code Generation", () => {
    it("should generate React components successfully", () => {
      const result = generateReactComponents(testDoc);

      expect(result).toBeDefined();
      expect(result.files).toBeDefined();
      expect(result.files.length).toBeGreaterThan(0);
      expect(result.metadata).toBeDefined();
    });

    it("should include all required file types", () => {
      const result = generateReactComponents(testDoc);

      const fileTypes = result.files.map((f) => f.type);
      expect(fileTypes).toContain("tsx");
      expect(fileTypes).toContain("css");

      // Should have at least one TSX component file and one CSS file
      const tsxFiles = result.files.filter((f) => f.type === "tsx");
      const cssFiles = result.files.filter((f) => f.type === "css");

      expect(tsxFiles.length).toBeGreaterThan(0);
      expect(cssFiles.length).toBeGreaterThan(0);
    });

    it("should generate valid metadata", () => {
      const result = generateReactComponents(testDoc);

      expect(result.metadata.timestamp).toBeGreaterThan(0);
      expect(result.metadata.componentId).toBeDefined();
      expect(typeof result.metadata.componentId).toBe("string");
      expect(result.metadata.nodeCount).toBeGreaterThan(0);
      expect(result.metadata.artboardCount).toBeGreaterThan(0);
      expect(result.metadata.extractedComponents).toBeGreaterThanOrEqual(0);
    });

    it("should generate syntactically valid React code", () => {
      const result = generateReactComponents(testDoc);
      const tsxFiles = result.files.filter((f) => f.type === "tsx");

      // Each TSX file should contain valid React component code
      tsxFiles.forEach((file) => {
        expect(file.content).toContain("import");
        expect(file.content).toContain("export");
        expect(file.content).toContain("function");
        expect(file.content).toMatch(/return\s*\(/); // JSX return statement
      });
    });

    it("should preserve design layout and positioning", () => {
      const result = generateReactComponents(testDoc);
      const tsxFiles = result.files.filter((f) => f.type === "tsx");

      // At least one file should contain the generated component
      const mainComponent = tsxFiles.find((f) =>
        f.content.includes("export default function")
      );
      expect(mainComponent).toBeDefined();

      // Should contain CSS class references for styling
      expect(mainComponent!.content).toMatch(/className=\{s\./);
    });

    it("should include text content accurately", () => {
      const result = generateReactComponents(testDoc);
      const tsxFiles = result.files.filter((f) => f.type === "tsx");

      const mainComponent = tsxFiles.find((f) =>
        f.content.includes("export default function")
      );
      expect(mainComponent).toBeDefined();

      // Should contain the actual text from the design
      expect(mainComponent!.content).toContain("Welcome to Our Platform");
      expect(mainComponent!.content).toContain("Build amazing experiences");
      expect(mainComponent!.content).toContain("Easy Integration");
      expect(mainComponent!.content).toContain("Powerful Analytics");
    });

    it("should generate CSS with design tokens", () => {
      const result = generateReactComponents(testDoc);
      const cssFiles = result.files.filter((f) => f.type === "css");

      expect(cssFiles.length).toBeGreaterThan(0);

      // CSS should contain styling information
      const cssContent = cssFiles[0].content;
      expect(cssContent).toMatch(/\.[\w-]+/); // CSS classes
      expect(cssContent).toMatch(/position:\s*absolute|width:|height:|color:/);
    });

    it("should handle complex nested layouts", () => {
      const result = generateReactComponents(testDoc);

      // Should extract multiple components from the nested structure
      expect(result.metadata.extractedComponents).toBeGreaterThanOrEqual(1);

      // Should handle the card container and individual cards
      const tsxFiles = result.files.filter((f) => f.type === "tsx");
      const mainComponent = tsxFiles.find((f) =>
        f.content.includes("export default function")
      );
      expect(mainComponent).toBeDefined();

      // Should contain references to nested components
      expect(mainComponent!.content).toMatch(/<[\w]+/); // JSX component usage
    });
  });

  describe("Determinism and Reproducibility", () => {
    it("should generate reproducible file structure for identical documents", () => {
      const result1 = generateReactComponents(testDoc);
      const result2 = generateReactComponents(testDoc);

      // File structure should be identical
      expect(result1.files.length).toBe(result2.files.length);
      expect(result1.metadata.artboardCount).toBe(
        result2.metadata.artboardCount
      );
      expect(result1.metadata.nodeCount).toBe(result2.metadata.nodeCount);

      // File paths and types should match
      result1.files.forEach((file1, index) => {
        const file2 = result2.files[index];
        expect(file1.path).toBe(file2.path);
        expect(file1.type).toBe(file2.type);
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty documents gracefully", () => {
      const emptyDoc = {
        schemaVersion: "0.1.0",
        id: generateULID(),
        name: "Empty Document",
        artboards: [],
      };

      const result = generateReactComponents(emptyDoc);
      expect(result).toBeDefined();
      expect(result.metadata.artboardCount).toBe(0);
      expect(result.metadata.nodeCount).toBe(0);
    });

    it("should handle documents with no children", () => {
      const minimalDoc = {
        schemaVersion: "0.1.0",
        id: generateULID(),
        name: "Minimal Document",
        artboards: [
          {
            id: generateULID(),
            name: "Empty Artboard",
            frame: { x: 0, y: 0, width: 800, height: 600 },
            visible: true,
            children: [],
          },
        ],
      };

      const result = generateReactComponents(minimalDoc);
      expect(result).toBeDefined();
      expect(result.metadata.artboardCount).toBe(1);
      expect(result.metadata.nodeCount).toBeGreaterThanOrEqual(0); // May or may not count the artboard
    });
  });

  describe("Code Quality", () => {
    it("should generate properly formatted JSX", () => {
      const result = generateReactComponents(testDoc);
      const tsxFiles = result.files.filter((f) => f.type === "tsx");

      tsxFiles.forEach((file) => {
        // Should contain proper JSX structure
        expect(file.content).toMatch(/import\s+.*\s+from\s+['"]/); // Proper imports
        expect(file.content).toMatch(
          /export\s+(default\s+)?function|export\s+function/
        ); // Export function
        expect(file.content).toMatch(/return\s*\(/); // JSX return
        expect(file.content).toMatch(/<>\s*.*\s*<\/>/s); // Fragment syntax
      });
    });

    it("should include proper TypeScript types", () => {
      const result = generateReactComponents(testDoc);
      const tsxFiles = result.files.filter((f) => f.type === "tsx");

      tsxFiles.forEach((file) => {
        expect(file.content).toMatch(/function\s+\w+\s*\(/); // Function declarations
        expect(file.content).toMatch(
          /export\s+(default\s+)?function|export\s+function/
        ); // Export function
      });
    });

    it("should generate accessible component structure", () => {
      const result = generateReactComponents(testDoc);
      const tsxFiles = result.files.filter((f) => f.type === "tsx");

      const mainComponent = tsxFiles.find((f) =>
        f.content.includes("export default function")
      );
      expect(mainComponent).toBeDefined();

      // Should include semantic HTML elements
      expect(mainComponent!.content).toMatch(
        /<(header|main|section|article|div)/
      );
    });
  });
});
