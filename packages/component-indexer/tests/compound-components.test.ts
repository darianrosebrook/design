/**
 * @fileoverview Tests for compound component detection
 * @author @darianrosebrook
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { ComponentScanner } from "../src/scanner.js";

describe("Compound Component Detection", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "compound-test-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("Basic functionality", () => {
    it("detects components that could be used in compound patterns", async () => {
      const componentFile = path.join(tempDir, "Card.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';

export function Card(props: { children: React.ReactNode }): JSX.Element {
  return <div className="card">{props.children}</div>;
}

export function Header(): JSX.Element {
  return <header className="card-header" />;
}

export function Body(): JSX.Element {
  return <div className="card-body" />;
}
      `.trim()
      );

      const scanner = new ComponentScanner();
      const result = await scanner.discover({ rootDir: tempDir });

      expect(result.components).toHaveLength(3);

      const cardComponent = result.components.find(c => c.name === "Card");
      expect(cardComponent).toBeDefined();

      const headerComponent = result.components.find(c => c.name === "Header");
      expect(headerComponent).toBeDefined();

      const bodyComponent = result.components.find(c => c.name === "Body");
      expect(bodyComponent).toBeDefined();
    });

    it("works with arrow function components", async () => {
      const componentFile = path.join(tempDir, "Arrow.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';

export const Card = (props: { children: React.ReactNode }): JSX.Element => (
  <div className="card">{props.children}</div>
);

export const Header = (): JSX.Element => (
  <header className="card-header" />
);
      `.trim()
      );

      const scanner = new ComponentScanner();
      const result = await scanner.discover({ rootDir: tempDir });

      expect(result.components).toHaveLength(2);

      const cardComponent = result.components.find(c => c.name === "Card");
      expect(cardComponent).toBeDefined();

      const headerComponent = result.components.find(c => c.name === "Header");
      expect(headerComponent).toBeDefined();
    });

    it("works with JSDoc metadata", async () => {
      const componentFile = path.join(tempDir, "Card.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';

/**
 * A card component
 * @category layout
 */
export function Card(props: { children: React.ReactNode }): JSX.Element {
  return <div className="card">{props.children}</div>;
}

/**
 * Card header
 * @category layout
 * @tags header
 */
export function Header(): JSX.Element {
  return <header className="card-header" />;
}
      `.trim()
      );

      const scanner = new ComponentScanner();
      const result = await scanner.discover({ rootDir: tempDir });

      expect(result.components).toHaveLength(2);

      const cardComponent = result.components.find(c => c.name === "Card");
      expect(cardComponent?.category).toBe("layout");

      const headerComponent = result.components.find(c => c.name === "Header");
      expect(headerComponent?.category).toBe("layout");
      expect(headerComponent?.tags).toEqual(["header"]);
    });
  });

  describe("Future compound component support", () => {
    it("can be extended to detect compound patterns", async () => {
      // This test documents the intended compound component pattern
      // The implementation will be added in a future enhancement

      const componentFile = path.join(tempDir, "Card.tsx");
      await fs.writeFile(
        componentFile,
        `
import React from 'react';

export function Card(props: { children: React.ReactNode }): JSX.Element {
  return <div className="card">{props.children}</div>;
}

export function CardHeader(): JSX.Element {
  return <header className="card-header" />;
}

export function CardBody(): JSX.Element {
  return <div className="card-body" />;
}

// Future: Detect Card.Header = CardHeader pattern
// Card.Header = CardHeader;
// Card.Body = CardBody;
      `.trim()
      );

      const scanner = new ComponentScanner();
      const result = await scanner.discover({ rootDir: tempDir });

      // Currently detects the individual components
      expect(result.components).toHaveLength(3);
      expect(result.components.map(c => c.name)).toEqual(
        expect.arrayContaining(["Card", "CardHeader", "CardBody"])
      );
    });
  });
});

