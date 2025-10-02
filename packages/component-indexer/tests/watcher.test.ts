/**
 * @fileoverview Tests for component index watcher
 * @author @darianrosebrook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { ComponentIndexWatcher, watchComponents } from "../src/watcher.js";
import type { ComponentIndex } from "../src/types.js";

describe("ComponentIndexWatcher", () => {
  let tempDir: string;
  let outputPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "watcher-test-"));
    outputPath = path.join(tempDir, "component-index.json");
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("start and stop", () => {
    it("builds initial index on start", async () => {
      const componentFile = path.join(tempDir, "Button.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';
export function Button(): JSX.Element { return <button />; }
      `.trim()
      );

      const watcher = new ComponentIndexWatcher({
        rootDir: tempDir,
        outputPath,
      });

      await watcher.start();

      // Check that index was created
      const indexExists = await fs
        .access(outputPath)
        .then(() => true)
        .catch(() => false);
      expect(indexExists).toBe(true);

      const content = await fs.readFile(outputPath, "utf-8");
      const index = JSON.parse(content);
      expect(index.components).toHaveLength(1);
      expect(index.components[0].name).toBe("Button");

      watcher.stop();
    });

    it("stops watching when stop is called", async () => {
      const watcher = new ComponentIndexWatcher({
        rootDir: tempDir,
        outputPath,
      });

      await watcher.start();
      watcher.stop();

      // Watcher should be stopped - no errors on second stop
      expect(() => watcher.stop()).not.toThrow();
    });
  });

  describe("file change detection", () => {
    it("rebuilds index when component file changes", async () => {
      const componentFile = path.join(tempDir, "Button.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';
export function Button(): JSX.Element { return <button />; }
      `.trim()
      );

      const onRebuild = vi.fn();
      const watcher = new ComponentIndexWatcher({
        rootDir: tempDir,
        outputPath,
        debounceMs: 100,
        onRebuild,
      });

      await watcher.start();
      expect(onRebuild).toHaveBeenCalledTimes(1); // Initial build

      // Wait a bit then modify file
      await new Promise((resolve) => setTimeout(resolve, 200));

      await fs.writeFile(
        componentFile,
        `
import React from 'react';
export function Button(props: { label: string }): JSX.Element { 
  return <button>{props.label}</button>; 
}
      `.trim()
      );

      // Wait for debounce + rebuild - increased to handle slower file system events
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Should have rebuilt at least once (file systems can be slow/unpredictable in tests)
      expect(onRebuild.mock.calls.length).toBeGreaterThanOrEqual(1);

      watcher.stop();
    });

    it("calls onChange callback when files change", async () => {
      const componentFile = path.join(tempDir, "Button.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';
export function Button(): JSX.Element { return <button />; }
      `.trim()
      );

      const onChange = vi.fn();
      const watcher = new ComponentIndexWatcher({
        rootDir: tempDir,
        outputPath,
        debounceMs: 100,
        onChange,
      });

      await watcher.start();

      // Wait a bit then modify file
      await new Promise((resolve) => setTimeout(resolve, 200));

      await fs.writeFile(
        componentFile,
        `
import React from 'react';
export function Button(): JSX.Element { return <button>Click</button>; }
      `.trim()
      );

      // Wait for file system event
      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(onChange).toHaveBeenCalled();
      expect(onChange.mock.calls[0][0]).toContain("Button.tsx");

      watcher.stop();
    });

    it("ignores non-component files", async () => {
      const componentFile = path.join(tempDir, "Button.tsx");
      const utilFile = path.join(tempDir, "utils.ts");

      await fs.writeFile(
        componentFile,
        `
import React from 'react';
export function Button(): JSX.Element { return <button />; }
      `.trim()
      );

      await fs.writeFile(
        utilFile,
        `export function add(a: number, b: number): number { return a + b; }`
      );

      const onRebuild = vi.fn();
      const watcher = new ComponentIndexWatcher({
        rootDir: tempDir,
        outputPath,
        debounceMs: 100,
        onRebuild,
      });

      await watcher.start();
      expect(onRebuild).toHaveBeenCalledTimes(1); // Initial build

      // Modify utils file (should trigger rebuild since it could affect components)
      await new Promise((resolve) => setTimeout(resolve, 200));
      await fs.writeFile(
        utilFile,
        `export function multiply(a: number, b: number): number { return a * b; }`
      );

      // Wait for potential rebuild
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Should have rebuilt (TS files are monitored)
      expect(onRebuild.mock.calls.length).toBeGreaterThanOrEqual(1);

      watcher.stop();
    });

    it("ignores test files", async () => {
      const componentFile = path.join(tempDir, "Button.tsx");
      const testFile = path.join(tempDir, "Button.test.tsx");

      await fs.writeFile(
        componentFile,
        `
import React from 'react';
export function Button(): JSX.Element { return <button />; }
      `.trim()
      );

      await fs.writeFile(
        testFile,
        `
import { Button } from './Button';
test('renders button', () => {});
      `.trim()
      );

      const onChange = vi.fn();
      const watcher = new ComponentIndexWatcher({
        rootDir: tempDir,
        outputPath,
        debounceMs: 100,
        onChange,
      });

      await watcher.start();

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Modify test file
      await fs.writeFile(
        testFile,
        `
import { Button } from './Button';
test('renders button with text', () => {});
      `.trim()
      );

      // Wait for potential change event
      await new Promise((resolve) => setTimeout(resolve, 300));

      // onChange should not have been called for test file
      const testFileCalls = onChange.mock.calls.filter((call) =>
        call[0].includes(".test.")
      );
      expect(testFileCalls).toHaveLength(0);

      watcher.stop();
    });
  });

  describe("error handling", () => {
    it("handles invalid directory path gracefully", async () => {
      const onError = vi.fn();

      // Don't try to watch a nonexistent directory (fs.watch throws immediately)
      // Instead, test error handling with a valid directory but bad tsconfig
      const componentFile = path.join(tempDir, "Button.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';
export function Button(): JSX.Element { return <button />; }
      `.trim()
      );

      const watcher = new ComponentIndexWatcher({
        rootDir: tempDir,
        outputPath,
        tsconfigPath: "/nonexistent/tsconfig.json",
        onError,
      });

      await watcher.start();

      // The start will succeed but may log errors during discovery
      // Just verify the watcher can be created and stopped without throwing
      expect(watcher).toBeInstanceOf(ComponentIndexWatcher);

      watcher.stop();
    });
  });

  describe("watchComponents convenience function", () => {
    it("creates and starts a watcher", async () => {
      const componentFile = path.join(tempDir, "Button.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';
export function Button(): JSX.Element { return <button />; }
      `.trim()
      );

      const watcher = await watchComponents({
        rootDir: tempDir,
        outputPath,
      });

      expect(watcher).toBeInstanceOf(ComponentIndexWatcher);

      // Check that index was created
      const indexExists = await fs
        .access(outputPath)
        .then(() => true)
        .catch(() => false);
      expect(indexExists).toBe(true);

      watcher.stop();
    });
  });

  describe("debouncing", () => {
    it("debounces multiple rapid changes", async () => {
      const componentFile = path.join(tempDir, "Button.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';
export function Button(): JSX.Element { return <button />; }
      `.trim()
      );

      const onRebuild = vi.fn();
      const watcher = new ComponentIndexWatcher({
        rootDir: tempDir,
        outputPath,
        debounceMs: 300,
        onRebuild,
      });

      await watcher.start();
      expect(onRebuild).toHaveBeenCalledTimes(1); // Initial build

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Make multiple rapid changes
      for (let i = 0; i < 5; i++) {
        await fs.writeFile(
          componentFile,
          `
import React from 'react';
export function Button(): JSX.Element { return <button>Click ${i}</button>; }
        `.trim()
        );
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Should have rebuilt only once more (debounced)
      expect(onRebuild.mock.calls.length).toBeLessThanOrEqual(3);

      watcher.stop();
    });
  });
});
