/**
 * @fileoverview Tests for component scanner
 * @author @darianrosebrook
 */

import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ComponentScanner, discoverComponents } from "../dist/scanner.js";

describe("ComponentScanner", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "component-scanner-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("discover", () => {
    it("finds function components", async () => {
      const componentFile = path.join(tempDir, "Button.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function Button(props: ButtonProps): JSX.Element {
  return <button onClick={props.onClick} disabled={props.disabled}>
    {props.label}
  </button>;
}
      `.trim()
      );

      const scanner = new ComponentScanner();
      const result = await scanner.discover({ rootDir: tempDir });

      console.log("Test result:", JSON.stringify(result, null, 2));

      expect(result.components).toHaveLength(1);
      expect(result.components[0].name).toBe("Button");
      expect(result.components[0].props).toHaveLength(3);
      expect(result.errors).toHaveLength(0);
      expect(result.stats.filesScanned).toBe(1);
      expect(result.stats.componentsFound).toBe(1);
    });

    it("finds arrow function components", async () => {
      const componentFile = path.join(tempDir, "Card.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';

interface CardProps {
  title: string;
  children: React.ReactNode;
}

export const Card = (props: CardProps): JSX.Element => {
  return <div>
    <h2>{props.title}</h2>
    {props.children}
  </div>;
};
      `.trim()
      );

      // Debug: check what files are created
      const files = await fs.readdir(tempDir);
      console.log("Files in temp dir:", files);

      for (const file of files) {
        if (file.endsWith(".tsx")) {
          const content = await fs.readFile(path.join(tempDir, file), "utf8");
          console.log(`Content of ${file}:\n${content}`);
        }
      }

      const scanner = new ComponentScanner();
      const result = await scanner.discover({ rootDir: tempDir });

      console.log("Test result:", JSON.stringify(result, null, 2));

      expect(result.components).toHaveLength(1);
      expect(result.components[0].name).toBe("Card");
      expect(result.components[0].props).toHaveLength(2);
    });

    it("extracts required and optional props", async () => {
      const componentFile = path.join(tempDir, "Input.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';

interface InputProps {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

export function Input(props: InputProps): JSX.Element {
  return <input 
    value={props.value}
    placeholder={props.placeholder}
    onChange={(e) => props.onChange(e.target.value)}
  />;
}
      `.trim()
      );

      const scanner = new ComponentScanner();
      const result = await scanner.discover({ rootDir: tempDir });

      expect(result.components).toHaveLength(1);
      const component = result.components[0];

      const valueProp = component.props.find((p) => p.name === "value");
      expect(valueProp?.required).toBe(true);

      const placeholderProp = component.props.find(
        (p) => p.name === "placeholder"
      );
      expect(placeholderProp?.required).toBe(false);
    });

    it("handles multiple components in one file", async () => {
      const componentFile = path.join(tempDir, "Forms.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';

export function TextField(props: { value: string }): JSX.Element {
  return <input value={props.value} />;
}

export function TextArea(props: { value: string }): JSX.Element {
  return <textarea value={props.value} />;
}
      `.trim()
      );

      const scanner = new ComponentScanner();
      const result = await scanner.discover({ rootDir: tempDir });

      expect(result.components).toHaveLength(2);
      expect(result.components.map((c) => c.name).sort()).toEqual([
        "TextArea",
        "TextField",
      ]);
    });

    it("skips non-component functions", async () => {
      const componentFile = path.join(tempDir, "utils.tsx");
      await fs.writeFile(
        componentFile,
        `
export function formatDate(date: Date): string {
  return date.toISOString();
}

export function calculateTotal(items: number[]): number {
  return items.reduce((a, b) => a + b, 0);
}
      `.trim()
      );

      const scanner = new ComponentScanner();
      const result = await scanner.discover({ rootDir: tempDir });

      expect(result.components).toHaveLength(0);
    });

    it("handles nested directories", async () => {
      const uiDir = path.join(tempDir, "ui");
      const formsDir = path.join(tempDir, "forms");
      await fs.mkdir(uiDir);
      await fs.mkdir(formsDir);

      await fs.writeFile(
        path.join(uiDir, "Button.tsx"),
        `
import React from 'react';
export function Button(): JSX.Element { return <button />; }
      `.trim()
      );

      await fs.writeFile(
        path.join(formsDir, "Input.tsx"),
        `
import React from 'react';
export function Input(): JSX.Element { return <input />; }
      `.trim()
      );

      const scanner = new ComponentScanner();
      const result = await scanner.discover({ rootDir: tempDir });

      expect(result.components).toHaveLength(2);
      expect(result.components.map((c) => c.name).sort()).toEqual([
        "Button",
        "Input",
      ]);
    });

    it("respects include patterns", async () => {
      const uiDir = path.join(tempDir, "ui");
      const formsDir = path.join(tempDir, "forms");
      await fs.mkdir(uiDir);
      await fs.mkdir(formsDir);

      await fs.writeFile(
        path.join(uiDir, "Button.tsx"),
        `
import React from 'react';
export function Button(): JSX.Element { return <button />; }
      `.trim()
      );

      await fs.writeFile(
        path.join(formsDir, "Input.tsx"),
        `
import React from 'react';
export function Input(): JSX.Element { return <input />; }
      `.trim()
      );

      const scanner = new ComponentScanner();
      const result = await scanner.discover({
        rootDir: tempDir,
        include: ["ui"],
      });

      expect(result.components).toHaveLength(1);
      expect(result.components[0].name).toBe("Button");
    });

    it("respects exclude patterns", async () => {
      const uiDir = path.join(tempDir, "ui");
      const testDir = path.join(tempDir, "test");
      await fs.mkdir(uiDir);
      await fs.mkdir(testDir);

      await fs.writeFile(
        path.join(uiDir, "Button.tsx"),
        `
import React from 'react';
export function Button(): JSX.Element { return <button />; }
      `.trim()
      );

      await fs.writeFile(
        path.join(testDir, "Mock.tsx"),
        `
import React from 'react';
export function Mock(): JSX.Element { return <div />; }
      `.trim()
      );

      const scanner = new ComponentScanner();
      const result = await scanner.discover({
        rootDir: tempDir,
        exclude: ["test"],
      });

      expect(result.components).toHaveLength(1);
      expect(result.components[0].name).toBe("Button");
    });

    it("generates stable ULID-based IDs", async () => {
      const componentFile = path.join(tempDir, "Button.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';
export function Button(): JSX.Element { return <button />; }
      `.trim()
      );

      const scanner = new ComponentScanner();
      const result = await scanner.discover({ rootDir: tempDir });

      expect(result.components[0].id).toMatch(/^[a-z0-9\-]{10,}$/);
    });

    it("includes stats in discovery result", async () => {
      const componentFile = path.join(tempDir, "Button.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';
export function Button(): JSX.Element { return <button />; }
      `.trim()
      );

      const scanner = new ComponentScanner();
      const result = await scanner.discover({ rootDir: tempDir });

      expect(result.stats).toEqual({
        filesScanned: 1,
        componentsFound: 1,
        duration: expect.any(Number),
      });
      expect(result.stats.duration).toBeGreaterThan(0);
    });
  });

  describe("discoverComponents", () => {
    it("is a convenience wrapper for ComponentScanner", async () => {
      const componentFile = path.join(tempDir, "Button.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';
export function Button(): JSX.Element { return <button />; }
      `.trim()
      );

      const result = await discoverComponents({ rootDir: tempDir });

      expect(result.components).toHaveLength(1);
      expect(result.components[0].name).toBe("Button");
    });
  });
});
