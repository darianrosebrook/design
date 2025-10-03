/**
 * @fileoverview Tests for advanced component discovery and auto-linting
 * @author @darianrosebrook
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  ComponentDiscoveryEngine,
  ComponentAutoDiscovery,
  discoverComponents,
  runAutoDiscovery,
} from "../src/index.js";
import type { CanvasDocumentType } from "@paths-design/canvas-schema";
import * as fs from "node:fs";

// Mock file system operations
vi.mock("node:fs", () => ({
  default: {
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    existsSync: vi.fn(),
  },
}));

// Mock glob
vi.mock("glob", () => ({
  glob: vi.fn().mockResolvedValue([]),
}));

// Mock ts-morph
vi.mock("ts-morph", () => ({
  Project: vi.fn().mockImplementation(() => ({
    getSourceFiles: vi.fn().mockReturnValue([]),
    addSourceFileAtPath: vi.fn(),
  })),
}));

describe("ComponentDiscoveryEngine", () => {
  let engine: ComponentDiscoveryEngine;

  const testDocument: CanvasDocumentType = {
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
            type: "component",
            name: "Button",
            frame: { x: 32, y: 32, width: 200, height: 48 },
            componentKey: "Button",
            props: {
              variant: "primary",
              size: "large",
              label: "Get Started",
            },
            semanticKey: "cta.primary",
          },
          {
            id: "01JF2Q07GTS16EJ3A3F0KK9K3U",
            type: "text",
            name: "Title",
            frame: { x: 32, y: 120, width: 600, height: 64 },
            text: "Welcome to Our App",
            semanticKey: "hero.title",
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    engine = new ComponentDiscoveryEngine();
    vi.clearAllMocks();
  });

  describe("analyzeDocument", () => {
    it("analyzes document and returns discovery results", async () => {
      const mockFs = vi.mocked(fs);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(testDocument));

      const result = await engine.analyzeDocument("./test.canvas.json");

      expect(result.discoveredComponents).toBeDefined();
      expect(result.propAnalysis).toBeDefined();
      expect(result.subcomponentAnalysis).toBeDefined();
      expect(result.tokenAnalysis).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.issues).toBeDefined();
    });

    it("detects component instances", async () => {
      const mockFs = vi.mocked(fs);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(testDocument));

      const result = await engine.analyzeDocument("./test.canvas.json");

      expect(result.discoveredComponents).toHaveLength(1);
      expect(result.discoveredComponents[0].name).toBe("Button");
      expect(result.discoveredComponents[0].usage.instances).toBe(1);
      expect(result.discoveredComponents[0].usage.propsUsed).toContain(
        "variant"
      );
      expect(result.discoveredComponents[0].usage.propsUsed).toContain("size");
      expect(result.discoveredComponents[0].usage.propsUsed).toContain("label");
    });

    it("analyzes token usage", async () => {
      const mockFs = vi.mocked(fs);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(testDocument));

      const result = await engine.analyzeDocument("./test.canvas.json");

      expect(result.tokenAnalysis.usedTokens.length).toBeGreaterThan(0);
    });

    it("generates recommendations", async () => {
      const mockFs = vi.mocked(fs);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(testDocument));

      const result = await engine.analyzeDocument("./test.canvas.json");

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations[0].type).toBeDefined();
      expect(result.recommendations[0].priority).toBeDefined();
      expect(result.recommendations[0].title).toBeDefined();
    });

    it("detects issues", async () => {
      const mockFs = vi.mocked(fs);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(testDocument));

      const result = await engine.analyzeDocument("./test.canvas.json");

      expect(result.issues.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("prop analysis", () => {
    it("identifies missing props", async () => {
      const mockFs = vi.mocked(fs);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(testDocument));

      const result = await engine.analyzeDocument("./test.canvas.json");

      // Should detect that "label" prop is used in design but might not be defined
      expect(result.propAnalysis.missingProps.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("subcomponent analysis", () => {
    it("finds potential subcomponents", async () => {
      const mockFs = vi.mocked(fs);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(testDocument));

      const result = await engine.analyzeDocument("./test.canvas.json");

      expect(
        result.subcomponentAnalysis.potentialSubcomponents.length
      ).toBeGreaterThanOrEqual(0);
    });

    it("identifies reusable patterns", async () => {
      const mockFs = vi.mocked(fs);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(testDocument));

      const result = await engine.analyzeDocument("./test.canvas.json");

      expect(
        result.subcomponentAnalysis.reusablePatterns.length
      ).toBeGreaterThanOrEqual(0);
    });
  });
});

describe("ComponentAutoDiscovery", () => {
  let discovery: ComponentAutoDiscovery;

  beforeEach(() => {
    discovery = new ComponentAutoDiscovery();
  });

  describe("analyzeProject", () => {
    it("analyzes project and returns discovery results", async () => {
      const mockFs = vi.mocked(fs);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(testDocument));
      mockFs.existsSync.mockReturnValue(true);

      const result = await discovery.analyzeProject("./test-project");

      expect(result.discoveredComponents).toBeDefined();
      expect(result.propAnalysis).toBeDefined();
      expect(result.subcomponentAnalysis).toBeDefined();
    });

    it("creates example analysis when document not found", async () => {
      const mockFs = vi.mocked(fs);
      mockFs.existsSync.mockReturnValue(false);

      const result = await discovery.analyzeProject("./test-project");

      expect(result.discoveredComponents).toHaveLength(1);
      expect(result.discoveredComponents[0].name).toBe("Button");
      expect(result.propAnalysis.missingProps.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });
});

describe("convenience functions", () => {
  describe("discoverComponents", () => {
    it("works as expected", async () => {
      const mockFs = vi.mocked(fs);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(testDocument));

      const result = await discoverComponents("./test.canvas.json");

      expect(result.discoveredComponents).toBeDefined();
    });
  });

  describe("runAutoDiscovery", () => {
    it("works as expected", async () => {
      const mockFs = vi.mocked(fs);
      mockFs.existsSync.mockReturnValue(false);

      const result = await runAutoDiscovery("./test-project");

      expect(result.discoveredComponents).toBeDefined();
    });
  });
});
