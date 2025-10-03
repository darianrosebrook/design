/**
 * @fileoverview Tests for compound component detection
 * @author @darianrosebrook
 */

import { describe, it, expect, beforeEach } from "vitest";
import { ComponentScanner } from "../src/scanner.js";
import * as ts from "typescript";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

describe("Compound Component Detection", () => {
  let scanner: ComponentScanner;
  let tempDir: string;

  beforeEach(() => {
    scanner = new ComponentScanner();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "compound-test-"));
  });

  /**
   * Helper to create a test file and scan it
   */
  async function scanTestFile(content: string) {
    const filePath = path.join(tempDir, "TestComponent.tsx");
    fs.writeFileSync(filePath, content, "utf-8");

    // Create a minimal tsconfig.json
    const tsconfigPath = path.join(tempDir, "tsconfig.json");
    fs.writeFileSync(
      tsconfigPath,
      JSON.stringify({
        compilerOptions: {
          target: "ES2020",
          module: "ESNext",
          jsx: "react",
          strict: false,
          esModuleInterop: true,
          skipLibCheck: true,
        },
        include: ["**/*.tsx", "**/*.ts"],
      }),
      "utf-8"
    );

    const result = await scanner.discover({
      rootDir: tempDir,
      tsconfigPath: tsconfigPath,
      include: ["**/*.tsx"],
    });

    // Log errors for debugging
    if (result.errors.length > 0) {
      console.log("Scanner errors:", result.errors);
    }

    return result;
  }

  describe("Direct Assignment Pattern", () => {
    it("should detect compound component with direct arrow function assignment", async () => {
      const code = `
        import React from 'react';
        
        const Card = ({ children }: { children: React.ReactNode }) => (
          <div className="card">{children}</div>
        );
        
        Card.Header = ({ title }: { title: string }) => (
          <div className="card-header">{title}</div>
        );
        
        export default Card;
      `;

      const result = await scanTestFile(code);

      expect(result.components).toHaveLength(2); // Card + Card.Header

      const compound = result.components.find((c) => c.name === "Card.Header");
      expect(compound).toBeDefined();
      expect(compound?.parent).toBe("Card");
      expect(compound?.isCompound).toBe(true);
      expect(compound?.props).toHaveLength(1);
      expect(compound?.props[0].name).toBe("title");
    });

    it("should detect multiple compound components", async () => {
      const code = `
        import React from 'react';
        
        const Card = ({ children }: { children: React.ReactNode }) => (
          <div className="card">{children}</div>
        );
        
        Card.Header = ({ title }: { title: string }) => (
          <div className="card-header">{title}</div>
        );
        
        Card.Body = ({ content }: { content: string }) => (
          <div className="card-body">{content}</div>
        );
        
        Card.Footer = ({ actions }: { actions: React.ReactNode }) => (
          <div className="card-footer">{actions}</div>
        );
        
        export default Card;
      `;

      const result = await scanTestFile(code);

      expect(result.components).toHaveLength(4); // Card + 3 compounds

      const compounds = result.components.filter((c) => c.isCompound);
      expect(compounds).toHaveLength(3);
      expect(compounds.map((c) => c.name)).toEqual([
        "Card.Header",
        "Card.Body",
        "Card.Footer",
      ]);

      compounds.forEach((compound) => {
        expect(compound.parent).toBe("Card");
        expect(compound.isCompound).toBe(true);
      });
    });

    it("should extract props from compound components", async () => {
      const code = `
        import React from 'react';
        
        interface TabPanelProps {
          title: string;
          active?: boolean;
          children: React.ReactNode;
        }
        
        const Tabs = ({ children }: { children: React.ReactNode }) => (
          <div className="tabs">{children}</div>
        );
        
        Tabs.Panel = ({ title, active = false, children }: TabPanelProps) => (
          <div className={active ? "active" : ""}>{children}</div>
        );
        
        export default Tabs;
      `;

      const result = await scanTestFile(code);

      const compound = result.components.find((c) => c.name === "Tabs.Panel");
      expect(compound).toBeDefined();
      expect(compound?.props).toHaveLength(3);

      const props = compound!.props;
      expect(props.find((p) => p.name === "title")).toBeDefined();
      expect(props.find((p) => p.name === "active")).toBeDefined();
      expect(props.find((p) => p.name === "children")).toBeDefined();
    });
  });

  describe("Reference Assignment Pattern", () => {
    it("should detect compound component with reference assignment", async () => {
      const code = `
        import React from 'react';
        
        const MenuItem = ({ label }: { label: string }) => (
          <li>{label}</li>
        );
        
        const Menu = ({ children }: { children: React.ReactNode }) => (
          <ul>{children}</ul>
        );
        
        Menu.Item = MenuItem;
        
        export default Menu;
      `;

      const result = await scanTestFile(code);

      // Should detect Menu, MenuItem, and Menu.Item (compound reference)
      expect(result.components.length).toBeGreaterThanOrEqual(2);

      const compound = result.components.find((c) => c.name === "Menu.Item");
      expect(compound).toBeDefined();
      expect(compound?.parent).toBe("Menu");
      expect(compound?.isCompound).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should ignore non-component property assignments", async () => {
      const code = `
        import React from 'react';
        
        const Card = ({ children }: { children: React.ReactNode }) => (
          <div className="card">{children}</div>
        );
        
        Card.displayName = "Card";
        Card.defaultProps = { children: null };
        
        export default Card;
      `;

      const result = await scanTestFile(code);

      expect(result.components).toHaveLength(1); // Only Card, no compounds
      expect(result.components[0].name).toBe("Card");
    });

    it("should handle compound components with function expressions", async () => {
      const code = `
        import React from 'react';
        
        const Select = ({ children }: { children: React.ReactNode }) => (
          <select>{children}</select>
        );
        
        Select.Option = function Option({ value, label }: { value: string; label: string }) {
          return <option value={value}>{label}</option>;
        };
        
        export default Select;
      `;

      const result = await scanTestFile(code);

      const compound = result.components.find(
        (c) => c.name === "Select.Option"
      );
      expect(compound).toBeDefined();
      expect(compound?.parent).toBe("Select");
      expect(compound?.isCompound).toBe(true);
      expect(compound?.props).toHaveLength(2);
    });

    it("should handle compound components with no props", async () => {
      const code = `
        import React from 'react';
        
        const List = ({ children }: { children: React.ReactNode }) => (
          <ul>{children}</ul>
        );
        
        List.Divider = () => <hr />;
        
        export default List;
      `;

      const result = await scanTestFile(code);

      const compound = result.components.find((c) => c.name === "List.Divider");
      expect(compound).toBeDefined();
      expect(compound?.parent).toBe("List");
      expect(compound?.isCompound).toBe(true);
      expect(compound?.props).toHaveLength(0);
    });
  });

  describe("Real-World Patterns", () => {
    it("should detect compound components in MUI-style components", async () => {
      const code = `
        import React from 'react';
        
        interface AccordionProps {
          expanded?: boolean;
          children: React.ReactNode;
        }
        
        interface AccordionSummaryProps {
          children: React.ReactNode;
          expandIcon?: React.ReactNode;
        }
        
        interface AccordionDetailsProps {
          children: React.ReactNode;
        }
        
        const Accordion = ({ expanded = false, children }: AccordionProps) => (
          <div className={expanded ? "expanded" : ""}>{children}</div>
        );
        
        Accordion.Summary = ({ children, expandIcon }: AccordionSummaryProps) => (
          <div className="summary">{children}{expandIcon}</div>
        );
        
        Accordion.Details = ({ children }: AccordionDetailsProps) => (
          <div className="details">{children}</div>
        );
        
        export default Accordion;
      `;

      const result = await scanTestFile(code);

      expect(result.components).toHaveLength(3); // Accordion + 2 compounds

      const summary = result.components.find(
        (c) => c.name === "Accordion.Summary"
      );
      const details = result.components.find(
        (c) => c.name === "Accordion.Details"
      );

      expect(summary).toBeDefined();
      expect(summary?.parent).toBe("Accordion");
      expect(summary?.props).toHaveLength(2); // children, expandIcon

      expect(details).toBeDefined();
      expect(details?.parent).toBe("Accordion");
      expect(details?.props).toHaveLength(1); // children
    });

    it("should detect compound components in Chakra-style components", async () => {
      const code = `
        import React from 'react';
        
        const Modal = ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) => (
          isOpen ? <div className="modal">{children}</div> : null
        );
        
        Modal.Overlay = () => <div className="overlay" />;
        Modal.Content = ({ children }: { children: React.ReactNode }) => (
          <div className="content">{children}</div>
        );
        Modal.Header = ({ children }: { children: React.ReactNode }) => (
          <div className="header">{children}</div>
        );
        Modal.Body = ({ children }: { children: React.ReactNode }) => (
          <div className="body">{children}</div>
        );
        Modal.Footer = ({ children }: { children: React.ReactNode }) => (
          <div className="footer">{children}</div>
        );
        
        export default Modal;
      `;

      const result = await scanTestFile(code);

      expect(result.components).toHaveLength(6); // Modal + 5 compounds

      const compounds = result.components.filter((c) => c.isCompound);
      expect(compounds).toHaveLength(5);
      expect(compounds.map((c) => c.name)).toEqual([
        "Modal.Overlay",
        "Modal.Content",
        "Modal.Header",
        "Modal.Body",
        "Modal.Footer",
      ]);
    });
  });
});
