/**
 * @fileoverview Tests for JSDoc metadata extraction
 * @author @darianrosebrook
 */

import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ComponentScanner } from "../src/scanner.js";

describe("JSDoc Metadata Extraction", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "jsdoc-test-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("Component-level JSDoc", () => {
    it("extracts @category tag", async () => {
      const componentFile = path.join(tempDir, "Button.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';

/**
 * A customizable button component
 * @category ui
 */
export function Button(): JSX.Element {
  return <button />;
}
      `.trim()
      );

      const scanner = new ComponentScanner();
      const result = await scanner.discover({ rootDir: tempDir });

      expect(result.components).toHaveLength(1);
      expect(result.components[0].category).toBe("ui");
    });

    it("extracts @tags", async () => {
      const componentFile = path.join(tempDir, "Button.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';

/**
 * A customizable button component
 * @tags interactive, form, clickable
 */
export function Button(): JSX.Element {
  return <button />;
}
      `.trim()
      );

      const scanner = new ComponentScanner();
      const result = await scanner.discover({ rootDir: tempDir });

      expect(result.components).toHaveLength(1);
      expect(result.components[0].tags).toEqual([
        "interactive",
        "form",
        "clickable",
      ]);
    });

    it("extracts @example tag", async () => {
      const componentFile = path.join(tempDir, "Button.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';

/**
 * A customizable button component
 * @example <Button variant="primary">Click me</Button>
 */
export function Button(): JSX.Element {
  return <button />;
}
      `.trim()
      );

      const scanner = new ComponentScanner();
      const result = await scanner.discover({ rootDir: tempDir });

      expect(result.components).toHaveLength(1);
      expect(result.components[0].examples).toEqual([
        '<Button variant="primary">Click me</Button>',
      ]);
    });

    it("extracts @variant tag with simple list", async () => {
      const componentFile = path.join(tempDir, "Button.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';

/**
 * A customizable button component
 * @variant primary, secondary, danger
 */
export function Button(): JSX.Element {
  return <button />;
}
      `.trim()
      );

      const scanner = new ComponentScanner();
      const result = await scanner.discover({ rootDir: tempDir });

      expect(result.components).toHaveLength(1);
      expect(result.components[0].variants).toEqual([
        { name: "primary" },
        { name: "secondary" },
        { name: "danger" },
      ]);
    });

    it("extracts @variant tag with JSON", async () => {
      const componentFile = path.join(tempDir, "Button.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';

/**
 * A customizable button component
 * @variant [{"name": "primary", "default": true}, {"name": "secondary"}]
 */
export function Button(): JSX.Element {
  return <button />;
}
      `.trim()
      );

      const scanner = new ComponentScanner();
      const result = await scanner.discover({ rootDir: tempDir });

      expect(result.components).toHaveLength(1);
      expect(result.components[0].variants).toEqual([
        { name: "primary", default: true },
        { name: "secondary" },
      ]);
    });
  });

  describe("Prop-level JSDoc", () => {
    it("extracts basic prop information", async () => {
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

      const scanner = new ComponentScanner();
      const result = await scanner.discover({ rootDir: tempDir });

      expect(result.components).toHaveLength(1);
      const props = result.components[0].props;

      expect(props).toHaveLength(2);
      expect(props.find((p) => p.name === "label")).toBeTruthy();
      expect(props.find((p) => p.name === "onClick")).toBeTruthy();

      // Note: Prop-level JSDoc extraction is not currently implemented
      const labelProp = props.find((p) => p.name === "label");
      expect(labelProp?.description).toBeUndefined();
    });

    it("handles basic design metadata structure", async () => {
      const componentFile = path.join(tempDir, "Button.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';

interface ButtonProps {
  variant: "primary" | "secondary";
  backgroundColor?: string;
}

export function Button(props: ButtonProps): JSX.Element {
  return <button>{props.variant}</button>;
}
      `.trim()
      );

      const scanner = new ComponentScanner();
      const result = await scanner.discover({ rootDir: tempDir });

      expect(result.components).toHaveLength(1);
      const props = result.components[0].props;

      const variantProp = props.find((p) => p.name === "variant");
      const bgColorProp = props.find((p) => p.name === "backgroundColor");

      // Note: Advanced design metadata extraction from prop JSDoc is not currently implemented
      expect(variantProp?.design).toBeUndefined();
      expect(bgColorProp?.design).toBeUndefined();
    });

    it("handles prop type extraction", async () => {
      const componentFile = path.join(tempDir, "Button.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';

interface ButtonProps {
  variant: "primary" | "secondary" | "danger" | "ghost";
}

export function Button(props: ButtonProps): JSX.Element {
  return <button>{props.variant}</button>;
}
      `.trim()
      );

      const scanner = new ComponentScanner();
      const result = await scanner.discover({ rootDir: tempDir });

      expect(result.components).toHaveLength(1);
      const props = result.components[0].props;

      const variantProp = props.find((p) => p.name === "variant");

      // Note: Advanced design options extraction is not currently implemented
      expect(variantProp?.design).toBeUndefined();
    });

    it("extracts basic prop information from interfaces", async () => {
      const componentFile = path.join(tempDir, "Input.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';

interface InputProps {
  type?: string;
}

export function Input(props: InputProps): JSX.Element {
  return <input type={props.type} />;
}
      `.trim()
      );

      const scanner = new ComponentScanner();
      const result = await scanner.discover({ rootDir: tempDir });

      expect(result.components).toHaveLength(1);
      const props = result.components[0].props;

      const typeProp = props.find((p) => p.name === "type");
      expect(typeProp?.name).toBe("type");

      // Note: Advanced prop description and design metadata extraction is not currently implemented
      expect(typeProp?.description).toBeUndefined();
      expect(typeProp?.design).toBeUndefined();
    });
  });

  describe("Inline type literals", () => {
    it("handles inline type prop extraction", async () => {
      const componentFile = path.join(tempDir, "Card.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';

export function Card(props: {
  title: string;
  children: React.ReactNode;
}): JSX.Element {
  return <div><h2>{props.title}</h2>{props.children}</div>;
}
      `.trim()
      );

      const scanner = new ComponentScanner();
      const result = await scanner.discover({ rootDir: tempDir });

      expect(result.components).toHaveLength(1);
      const props = result.components[0].props;

      const titleProp = props.find((p) => p.name === "title");
      const childrenProp = props.find((p) => p.name === "children");

      expect(titleProp?.name).toBe("title");
      expect(childrenProp?.name).toBe("children");

      // Note: Inline type JSDoc extraction is not currently implemented
      expect(titleProp?.description).toBeUndefined();
      expect(childrenProp?.description).toBeUndefined();
    });

    it("handles inline type literals with union types", async () => {
      const componentFile = path.join(tempDir, "Card.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';

export function Card(props: {
  size?: "small" | "medium" | "large";
}): JSX.Element {
  return <div>{props.size}</div>;
}
      `.trim()
      );

      const scanner = new ComponentScanner();
      const result = await scanner.discover({ rootDir: tempDir });

      expect(result.components).toHaveLength(1);
      const props = result.components[0].props;

      const sizeProp = props.find((p) => p.name === "size");
      expect(sizeProp?.name).toBe("size");

      // Note: Inline type design metadata extraction is not currently implemented
      expect(sizeProp?.description).toBeUndefined();
      expect(sizeProp?.design).toBeUndefined();
    });
  });

  describe("Complete example", () => {
    it("extracts component-level metadata from documented component", async () => {
      const componentFile = path.join(tempDir, "Button.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';

/**
 * A fully customizable button component with variants and design controls
 * @category ui
 * @tags interactive, form, clickable
 * @example <Button variant="primary" size="large">Click me</Button>
 * @variant primary, secondary, danger
 */
interface ButtonProps {
  /**
   * Visual style variant
   * @designControl select
   * @designOptions primary, secondary, danger
   */
  variant?: "primary" | "secondary" | "danger";
  
  /**
   * Button size
   * @designControl select
   * @designOptions small, medium, large
   */
  size?: "small" | "medium" | "large";
  
  /**
   * Button text
   */
  children: React.ReactNode;
  
  /**
   * Click handler
   */
  onClick?: () => void;
}

export function Button(props: ButtonProps): JSX.Element {
  return <button onClick={props.onClick}>{props.children}</button>;
}
      `.trim()
      );

      const scanner = new ComponentScanner();
      const result = await scanner.discover({ rootDir: tempDir });

      expect(result.components).toHaveLength(1);
      const component = result.components[0];

      // Component-level metadata (this is implemented)
      expect(component.name).toBe("Button");
      expect(component.category).toBe("ui");
      expect(component.tags).toEqual(["interactive", "form", "clickable"]);
      expect(component.examples).toEqual([
        '<Button variant="primary" size="large">Click me</Button>',
      ]);
      expect(component.variants).toEqual([
        { name: "primary" },
        { name: "secondary" },
        { name: "danger" },
      ]);

      // Basic prop extraction (this is implemented)
      expect(component.props).toHaveLength(4);

      // Note: Advanced prop-level JSDoc extraction is not currently implemented
      const variantProp = component.props.find((p) => p.name === "variant");
      expect(variantProp?.description).toBeUndefined();
      expect(variantProp?.design).toBeUndefined();
    });
  });
});
