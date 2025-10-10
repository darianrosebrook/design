/**
 * @fileoverview Tests for component index generation
 * @author @darianrosebrook
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import {
  generateIndex,
  saveIndex,
  loadIndex,
  buildComponentIndex,
} from "../src/index.js";
import type { ComponentSource, DiscoveryResult } from "../src/types.js";

describe("Component Index", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "component-index-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("generateIndex", () => {
    it("generates valid component index", async () => {
      const discoveryResult: DiscoveryResult = {
        components: [
          {
            id: "01h2x3y4z5",
            name: "Button",
            modulePath: "/src/Button.tsx",
            export: "Button",
            props: [
              { name: "label", type: "string", required: true },
              { name: "onClick", type: "() => void", required: true },
            ],
          },
        ],
        errors: [],
        stats: { filesScanned: 1, componentsFound: 1, duration: 100 },
      };

      const source: ComponentSource = {
        root: "/src",
        resolver: "tsconfig",
      };

      const index = await generateIndex(discoveryResult, source);

      expect(index.version).toBe("1.0.0");
      expect(index.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(index.source).toEqual(source);
      expect(index.components).toHaveLength(1);
      expect(index.components[0].name).toBe("Button");
    });

    it("validates against schema", async () => {
      const discoveryResult: DiscoveryResult = {
        components: [
          {
            id: "invalid id with spaces",
            name: "Button",
            modulePath: "/src/Button.tsx",
            export: "Button",
            props: [],
          },
        ],
        errors: [],
        stats: { filesScanned: 1, componentsFound: 1, duration: 100 },
      };

      const source: ComponentSource = {
        root: "/src",
        resolver: "tsconfig",
      };

      await expect(generateIndex(discoveryResult, source)).rejects.toThrow();
    });
  });

  describe("saveIndex and loadIndex", () => {
    it("saves and loads component index", async () => {
      const index = {
        version: "1.0.0" as const,
        generatedAt: new Date().toISOString(),
        source: { root: "/src", resolver: "tsconfig" as const },
        components: [
          {
            id: "01h2x3y4z5",
            name: "Button",
            modulePath: "/src/Button.tsx",
            export: "Button",
            props: [{ name: "label", type: "string", required: true }],
          },
        ],
      };

      const outputPath = path.join(tempDir, "component-index.json");
      await saveIndex(index, outputPath);

      const loaded = await loadIndex(outputPath);
      expect(loaded).toEqual(index);
    });

    it("validates on load", async () => {
      const outputPath = path.join(tempDir, "invalid.json");
      await fs.writeFile(
        outputPath,
        JSON.stringify({ invalid: "data" }),
        "utf-8"
      );

      await expect(loadIndex(outputPath)).rejects.toThrow();
    });
  });

  describe("buildComponentIndex", () => {
    it("builds complete index from source directory", async () => {
      const componentFile = path.join(tempDir, "Button.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
}

export function Button(props: ButtonProps): JSX.Element {
  return <button onClick={props.onClick}>{props.label}</button>;
}
      `.trim()
      );

      const outputPath = path.join(tempDir, "component-index.json");
      const index = await buildComponentIndex(tempDir, outputPath);

      expect(index.version).toBe("1.0.0");
      expect(index.components).toHaveLength(1);
      expect(index.components[0].name).toBe("Button");
      expect(index.components[0].props).toHaveLength(2);

      const fileExists = await fs
        .access(outputPath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);
    });

    it("handles discovery errors gracefully", async () => {
      const invalidFile = path.join(tempDir, "Invalid.tsx");
      await fs.writeFile(invalidFile, "this is not valid typescript");

      const outputPath = path.join(tempDir, "component-index.json");

      await expect(
        buildComponentIndex(tempDir, outputPath)
      ).resolves.toBeDefined();
    });

    it("respects discovery options", async () => {
      const uiDir = path.join(tempDir, "ui");
      await fs.mkdir(uiDir);

      await fs.writeFile(
        path.join(uiDir, "Button.tsx"),
        `
import React from 'react';
export function Button(): JSX.Element { return <button />; }
      `.trim()
      );

      const outputPath = path.join(tempDir, "component-index.json");
      const index = await buildComponentIndex(tempDir, outputPath, {
        include: ["ui"],
      });

      expect(index.components).toHaveLength(1);
      expect(index.source.include).toEqual(["ui"]);
    });
  });
});
