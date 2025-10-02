/**
 * @fileoverview Tests for default value extraction from component implementations
 * @author @darianrosebrook
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { ComponentScanner } from "../src/scanner.js";

describe("Default Value Extraction", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "defaults-test-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("Destructuring defaults in function body", () => {
    it("extracts defaults from object destructuring", async () => {
      const componentFile = path.join(tempDir, "Button.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';

interface ButtonProps {
  variant?: string;
  size?: string;
  disabled?: boolean;
}

export function Button(props: ButtonProps): JSX.Element {
  const {
    variant = "primary",
    size = "medium",
    disabled = false,
  } = props;

  return <button disabled={disabled} className={\`\${variant} \${size}\`} />;
}
      `.trim()
      );

      const scanner = new ComponentScanner();
      const result = await scanner.discover({ rootDir: tempDir });

      expect(result.components).toHaveLength(1);
      const props = result.components[0].props;

      const variantProp = props.find((p) => p.name === "variant");
      expect(variantProp?.defaultValue).toBe("primary");

      const sizeProp = props.find((p) => p.name === "size");
      expect(sizeProp?.defaultValue).toBe("medium");

      const disabledProp = props.find((p) => p.name === "disabled");
      expect(disabledProp?.defaultValue).toBe(false);
    });

    it("extracts defaults from arrow function destructuring", async () => {
      const componentFile = path.join(tempDir, "Input.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';

interface InputProps {
  type?: string;
  placeholder?: string;
}

const Input = (props: InputProps) => {
  const { type = "text", placeholder = "Enter value..." } = props;
  return <input type={type} placeholder={placeholder} />;
};

export default Input;
      `.trim()
      );

      const scanner = new ComponentScanner();
      const result = await scanner.discover({ rootDir: tempDir });

      expect(result.components).toHaveLength(1);
      const props = result.components[0].props;

      const typeProp = props.find((p) => p.name === "type");
      expect(typeProp?.defaultValue).toBe("text");

      const placeholderProp = props.find((p) => p.name === "placeholder");
      expect(placeholderProp?.defaultValue).toBe("Enter value...");
    });

    it("extracts complex default values", async () => {
      const componentFile = path.join(tempDir, "Complex.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';

interface ComplexProps {
  config?: object;
  items?: string[];
  settings?: object;
}

export function Complex(props: ComplexProps): JSX.Element {
  const {
    config = { theme: "light", debug: true },
    items = ["item1", "item2"],
    settings = {},
  } = props;

  return <div>{JSON.stringify({ config, items, settings })}</div>;
}
      `.trim()
      );

      const scanner = new ComponentScanner();
      const result = await scanner.discover({ rootDir: tempDir });

      expect(result.components).toHaveLength(1);
      const props = result.components[0].props;

      const configProp = props.find((p) => p.name === "config");
      expect(configProp?.defaultValue).toEqual({
        theme: "light",
        debug: true,
      });

      const itemsProp = props.find((p) => p.name === "items");
      expect(itemsProp?.defaultValue).toEqual(["item1", "item2"]);

      const settingsProp = props.find((p) => p.name === "settings");
      expect(settingsProp?.defaultValue).toEqual({});
    });
  });

  describe("defaultProps assignments", () => {
    it("extracts defaults from defaultProps object", async () => {
      const componentFile = path.join(tempDir, "Button.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';

interface ButtonProps {
  variant?: string;
  size?: string;
}

export function Button(props: ButtonProps): JSX.Element {
  return <button />;
}

Button.defaultProps = {
  variant: "secondary",
  size: "large",
};
      `.trim()
      );

      const scanner = new ComponentScanner();
      const result = await scanner.discover({ rootDir: tempDir });

      expect(result.components).toHaveLength(1);
      const props = result.components[0].props;

      const variantProp = props.find((p) => p.name === "variant");
      expect(variantProp?.defaultValue).toBe("secondary");

      const sizeProp = props.find((p) => p.name === "size");
      expect(sizeProp?.defaultValue).toBe("large");
    });

    it("extracts defaults from class component defaultProps", async () => {
      const componentFile = path.join(tempDir, "ClassButton.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';

interface ButtonProps {
  variant?: string;
  count?: number;
}

export class Button extends React.Component<ButtonProps> {
  render() {
    return <button />;
  }
}

Button.defaultProps = {
  variant: "primary",
  count: 0,
};
      `.trim()
      );

      const scanner = new ComponentScanner();
      const result = await scanner.discover({ rootDir: tempDir });

      expect(result.components).toHaveLength(1);
      const props = result.components[0].props;

      const variantProp = props.find((p) => p.name === "variant");
      expect(variantProp?.defaultValue).toBe("primary");

      const countProp = props.find((p) => p.name === "count");
      expect(countProp?.defaultValue).toBe(0);
    });
  });

  describe("Precedence and merging", () => {
    it("prioritizes destructuring defaults over defaultProps", async () => {
      const componentFile = path.join(tempDir, "Button.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';

interface ButtonProps {
  variant?: string;
  size?: string;
}

export function Button(props: ButtonProps): JSX.Element {
  const { variant = "destructuring", size = "destructuring" } = props;
  return <button />;
}

Button.defaultProps = {
  variant: "defaultProps",
  size: "defaultProps",
};
      `.trim()
      );

      const scanner = new ComponentScanner();
      const result = await scanner.discover({ rootDir: tempDir });

      expect(result.components).toHaveLength(1);
      const props = result.components[0].props;

      // Should get destructuring defaults (higher precedence)
      const variantProp = props.find((p) => p.name === "variant");
      expect(variantProp?.defaultValue).toBe("destructuring");

      const sizeProp = props.find((p) => p.name === "size");
      expect(sizeProp?.defaultValue).toBe("destructuring");
    });

    it("merges defaults from different sources", async () => {
      const componentFile = path.join(tempDir, "Button.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';

interface ButtonProps {
  variant?: string;
  size?: string;
  color?: string;
}

export function Button(props: ButtonProps): JSX.Element {
  const { variant = "destructuring", color = "blue" } = props;
  return <button />;
}

Button.defaultProps = {
  variant: "defaultProps",
  size: "defaultProps",
};
      `.trim()
      );

      const scanner = new ComponentScanner();
      const result = await scanner.discover({ rootDir: tempDir });

      expect(result.components).toHaveLength(1);
      const props = result.components[0].props;

      // variant should come from destructuring (higher precedence)
      const variantProp = props.find((p) => p.name === "variant");
      expect(variantProp?.defaultValue).toBe("destructuring");

      // size should come from defaultProps
      const sizeProp = props.find((p) => p.name === "size");
      expect(sizeProp?.defaultValue).toBe("defaultProps");

      // color should come from destructuring
      const colorProp = props.find((p) => p.name === "color");
      expect(colorProp?.defaultValue).toBe("blue");
    });
  });

  describe("Unsupported default value patterns", () => {
    it("ignores complex expressions as defaults", async () => {
      const componentFile = path.join(tempDir, "Button.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';

interface ButtonProps {
  variant?: string;
  count?: number;
}

export function Button(props: ButtonProps): JSX.Element {
  const {
    variant = process.env.NODE_ENV === 'development' ? 'debug' : 'primary',
    count = Math.random(),
  } = props;

  return <button />;
}
      `.trim()
      );

      const scanner = new ComponentScanner();
      const result = await scanner.discover({ rootDir: tempDir });

      expect(result.components).toHaveLength(1);
      const props = result.components[0].props;

      // Complex expressions should be ignored (undefined)
      const variantProp = props.find((p) => p.name === "variant");
      expect(variantProp?.defaultValue).toBeUndefined();

      const countProp = props.find((p) => p.name === "count");
      expect(countProp?.defaultValue).toBeUndefined();
    });

    it("ignores function call defaults", async () => {
      const componentFile = path.join(tempDir, "Button.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';

interface ButtonProps {
  callback?: () => void;
  config?: object;
}

export function Button(props: ButtonProps): JSX.Element {
  const {
    callback = () => console.log('default'),
    config = getDefaultConfig(),
  } = props;

  return <button />;
}

function getDefaultConfig() {
  return { theme: 'light' };
}
      `.trim()
      );

      const scanner = new ComponentScanner();
      const result = await scanner.discover({ rootDir: tempDir });

      expect(result.components).toHaveLength(1);
      const props = result.components[0].props;

      // Function calls should be ignored
      const callbackProp = props.find((p) => p.name === "callback");
      expect(callbackProp?.defaultValue).toBeUndefined();

      const configProp = props.find((p) => p.name === "config");
      expect(configProp?.defaultValue).toBeUndefined();
    });
  });

  describe("Complete examples", () => {
    it("extracts all default value patterns", async () => {
      const componentFile = path.join(tempDir, "Complete.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';

/**
 * A comprehensive component with multiple default value patterns
 * @category demo
 */
interface CompleteProps {
  // From destructuring
  variant?: string;
  size?: string;
  
  // From defaultProps
  theme?: string;
  disabled?: boolean;
  
  // No defaults
  label?: string;
}

export function Complete(props: CompleteProps): JSX.Element {
  const {
    variant = "primary",
    size = "medium",
    theme,
    disabled,
    label = "Default Label",
  } = props;

  return (
    <div className={\`\${variant} \${size} \${theme}\`}>
      <button disabled={disabled}>{label}</button>
    </div>
  );
}

Complete.defaultProps = {
  theme: "light",
  disabled: false,
};
      `.trim()
      );

      const scanner = new ComponentScanner();
      const result = await scanner.discover({ rootDir: tempDir });

      expect(result.components).toHaveLength(1);
      const component = result.components[0];
      expect(component.category).toBe("demo");

      const props = component.props;

      // Destructuring defaults
      const variantProp = props.find((p) => p.name === "variant");
      expect(variantProp?.defaultValue).toBe("primary");

      const sizeProp = props.find((p) => p.name === "size");
      expect(sizeProp?.defaultValue).toBe("medium");

      const labelProp = props.find((p) => p.name === "label");
      expect(labelProp?.defaultValue).toBe("Default Label");

      // defaultProps defaults
      const themeProp = props.find((p) => p.name === "theme");
      expect(themeProp?.defaultValue).toBe("light");

      const disabledProp = props.find((p) => p.name === "disabled");
      expect(disabledProp?.defaultValue).toBe(false);
    });

    it("handles arrow function with complex destructuring", async () => {
      const componentFile = path.join(tempDir, "Arrow.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';

interface ArrowProps {
  title?: string;
  count?: number;
  active?: boolean;
  items?: string[];
}

const ArrowComponent = ({
  title = "Default Title",
  count = 42,
  active = true,
  items = ["a", "b", "c"],
}: ArrowProps) => {
  return <div>{title} ({count}) {active ? 'active' : 'inactive'}</div>;
};

export default ArrowComponent;
      `.trim()
      );

      const scanner = new ComponentScanner();
      const result = await scanner.discover({ rootDir: tempDir });

      expect(result.components).toHaveLength(1);
      const props = result.components[0].props;

      const titleProp = props.find((p) => p.name === "title");
      expect(titleProp?.defaultValue).toBe("Default Title");

      const countProp = props.find((p) => p.name === "count");
      expect(countProp?.defaultValue).toBe(42);

      const activeProp = props.find((p) => p.name === "active");
      expect(activeProp?.defaultValue).toBe(true);

      const itemsProp = props.find((p) => p.name === "items");
      expect(itemsProp?.defaultValue).toEqual(["a", "b", "c"]);
    });
  });
});
