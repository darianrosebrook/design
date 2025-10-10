/**
 * @fileoverview Tests for JSDoc metadata extraction
 * @author @darianrosebrook
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
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
    it("extracts prop descriptions", async () => {
      const componentFile = path.join(tempDir, "Button.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';

interface ButtonProps {
  /** The text label for the button */
  label: string;
  /** Click handler function */
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

      const labelProp = props.find((p) => p.name === "label");
      expect(labelProp?.description).toBe("The text label for the button");

      const onClickProp = props.find((p) => p.name === "onClick");
      expect(onClickProp?.description).toBe("Click handler function");
    });

    it("extracts @designControl tag", async () => {
      const componentFile = path.join(tempDir, "Button.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';

interface ButtonProps {
  /**
   * Visual style variant
   * @designControl select
   */
  variant: "primary" | "secondary";
  
  /**
   * Button background color
   * @designControl color
   */
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
      expect(variantProp?.design?.control).toBe("select");

      const bgColorProp = props.find((p) => p.name === "backgroundColor");
      expect(bgColorProp?.design?.control).toBe("color");
    });

    it("extracts @designOptions tag", async () => {
      const componentFile = path.join(tempDir, "Button.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';

interface ButtonProps {
  /**
   * Visual style variant
   * @designControl select
   * @designOptions primary, secondary, danger, ghost
   */
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
      expect(variantProp?.design?.control).toBe("select");
      expect(variantProp?.design?.options).toEqual([
        "primary",
        "secondary",
        "danger",
        "ghost",
      ]);
    });

    it("combines description with design metadata", async () => {
      const componentFile = path.join(tempDir, "Input.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';

interface InputProps {
  /**
   * The type of input field
   * @designControl select
   * @designOptions text, email, password, number
   */
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
      expect(typeProp?.description).toBe("The type of input field");
      expect(typeProp?.design?.control).toBe("select");
      expect(typeProp?.design?.options).toEqual([
        "text",
        "email",
        "password",
        "number",
      ]);
    });
  });

  describe("Inline type literals", () => {
    it("extracts JSDoc from inline prop types", async () => {
      const componentFile = path.join(tempDir, "Card.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';

export function Card(props: {
  /** Card title text */
  title: string;
  /** Card content */
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
      expect(titleProp?.description).toBe("Card title text");

      const childrenProp = props.find((p) => p.name === "children");
      expect(childrenProp?.description).toBe("Card content");
    });

    it("extracts design metadata from inline types", async () => {
      const componentFile = path.join(tempDir, "Card.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';

export function Card(props: {
  /**
   * Card size
   * @designControl select
   * @designOptions small, medium, large
   */
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
      expect(sizeProp?.description).toBe("Card size");
      expect(sizeProp?.design?.control).toBe("select");
      expect(sizeProp?.design?.options).toEqual(["small", "medium", "large"]);
    });
  });

  describe("Complete example", () => {
    it("extracts all metadata from fully documented component", async () => {
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

      // Component-level metadata
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

      // Prop-level metadata
      const variantProp = component.props.find((p) => p.name === "variant");
      expect(variantProp?.description).toBe("Visual style variant");
      expect(variantProp?.design?.control).toBe("select");
      expect(variantProp?.design?.options).toEqual([
        "primary",
        "secondary",
        "danger",
      ]);

      const sizeProp = component.props.find((p) => p.name === "size");
      expect(sizeProp?.description).toBe("Button size");
      expect(sizeProp?.design?.control).toBe("select");
      expect(sizeProp?.design?.options).toEqual(["small", "medium", "large"]);

      const childrenProp = component.props.find((p) => p.name === "children");
      expect(childrenProp?.description).toBe("Button text");

      const onClickProp = component.props.find((p) => p.name === "onClick");
      expect(onClickProp?.description).toBe("Click handler");
    });
  });
});
