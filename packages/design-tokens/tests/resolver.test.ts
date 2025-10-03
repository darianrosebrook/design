/**
 * @fileoverview Tests for token reference resolution
 * @author @darianrosebrook
 */

import { describe, it, expect } from "vitest";
import {
  isTokenReference,
  extractReferencePath,
  buildDependencyGraph,
  detectCircularReferences,
  validateTokenReferences,
  resolveTokenReferences,
  getTokenDependents,
  getTokenDependencies,
} from "../src/resolver";
import type { DesignTokens } from "../src/tokens";

describe("Token Reference Resolution", () => {
  describe("isTokenReference", () => {
    it("should detect valid token references", () => {
      expect(isTokenReference("{color.brand.primary}")).toBe(true);
      expect(isTokenReference("{space.md}")).toBe(true);
    });

    it("should reject invalid references", () => {
      expect(isTokenReference("color.brand.primary")).toBe(false);
      expect(isTokenReference("{")).toBe(false);
      expect(isTokenReference("}")).toBe(false);
      expect(isTokenReference("{}")).toBe(false);
      expect(isTokenReference(123)).toBe(false);
      expect(isTokenReference(null)).toBe(false);
      expect(isTokenReference(undefined)).toBe(false);
    });
  });

  describe("extractReferencePath", () => {
    it("should extract path from reference", () => {
      expect(extractReferencePath("{color.brand.primary}")).toBe("color.brand.primary");
      expect(extractReferencePath("{space.md}")).toBe("space.md");
    });
  });

  describe("buildDependencyGraph", () => {
    it("should build dependency graph", () => {
      const tokens: any = {
        color: {
          brand: {
            primary: "#4F46E5",
            hover: "{color.brand.primary}",
          },
          semantic: {
            info: "{color.brand.primary}",
          },
        },
      };

      const graph = buildDependencyGraph(tokens);

      expect(graph.size).toBe(2);
      expect(graph.get("color.brand.hover")).toEqual(new Set(["color.brand.primary"]));
      expect(graph.get("color.semantic.info")).toEqual(new Set(["color.brand.primary"]));
    });

    it("should handle nested references", () => {
      const tokens: any = {
        color: {
          base: "#4F46E5",
          hover: "{color.base}",
          pressed: "{color.hover}",
        },
      };

      const graph = buildDependencyGraph(tokens);

      expect(graph.size).toBe(2);
      expect(graph.get("color.hover")).toEqual(new Set(["color.base"]));
      expect(graph.get("color.pressed")).toEqual(new Set(["color.hover"]));
    });
  });

  describe("detectCircularReferences", () => {
    it("should detect direct circular reference", () => {
      const graph = new Map([
        ["color.a", new Set(["color.b"])],
        ["color.b", new Set(["color.a"])],
      ]);

      const circularPath = detectCircularReferences(graph);

      expect(circularPath).not.toBeNull();
      expect(circularPath).toContain("color.a");
      expect(circularPath).toContain("color.b");
    });

    it("should detect indirect circular reference", () => {
      const graph = new Map([
        ["color.a", new Set(["color.b"])],
        ["color.b", new Set(["color.c"])],
        ["color.c", new Set(["color.a"])],
      ]);

      const circularPath = detectCircularReferences(graph);

      expect(circularPath).not.toBeNull();
      expect(circularPath!.length).toBeGreaterThan(2);
    });

    it("should return null for valid graph", () => {
      const graph = new Map([
        ["color.hover", new Set(["color.primary"])],
        ["color.pressed", new Set(["color.hover"])],
      ]);

      const circularPath = detectCircularReferences(graph);

      expect(circularPath).toBeNull();
    });
  });

  describe("validateTokenReferences", () => {
    it("should validate correct token references", () => {
      const tokens: any = {
        color: {
          brand: {
            primary: "#4F46E5",
            hover: "{color.brand.primary}",
          },
        },
      };

      const result = validateTokenReferences(tokens);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect missing token references", () => {
      const tokens: any = {
        color: {
          brand: {
            hover: "{color.brand.nonexistent}",
          },
        },
      };

      const result = validateTokenReferences(tokens);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain("does not exist");
    });

    it("should detect circular references", () => {
      const tokens: any = {
        color: {
          a: "{color.b}",
          b: "{color.a}",
        },
      };

      const result = validateTokenReferences(tokens);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes("Circular"))).toBe(true);
    });

    it("should detect max depth exceeded", () => {
      const tokens: any = {
        color: {
          a: "{color.b}",
          b: "{color.c}",
          c: "{color.d}",
          d: "{color.e}",
          e: "{color.f}",
          f: "#000000",
        },
      };

      const result = validateTokenReferences(tokens, { maxDepth: 3 });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes("Max reference depth"))).toBe(true);
    });
  });

  describe("resolveTokenReferences", () => {
    it("should resolve simple reference", () => {
      const tokens: any = {
        color: {
          brand: {
            primary: "#4F46E5",
            hover: "{color.brand.primary}",
          },
        },
      };

      const resolved = resolveTokenReferences(tokens);

      expect(resolved.color.brand.hover).toBe("#4F46E5");
      expect(resolved.color.brand.primary).toBe("#4F46E5");
    });

    it("should resolve nested references", () => {
      const tokens: any = {
        color: {
          base: "#4F46E5",
          hover: "{color.base}",
          pressed: "{color.hover}",
        },
      };

      const resolved = resolveTokenReferences(tokens);

      expect(resolved.color.base).toBe("#4F46E5");
      expect(resolved.color.hover).toBe("#4F46E5");
      expect(resolved.color.pressed).toBe("#4F46E5");
    });

    it("should resolve cross-category references", () => {
      const tokens: any = {
        color: {
          brand: {
            primary: "#4F46E5",
          },
        },
        semantic: {
          info: "{color.brand.primary}",
        },
      };

      const resolved = resolveTokenReferences(tokens);

      expect(resolved.semantic.info).toBe("#4F46E5");
    });

    it("should resolve numeric references", () => {
      const tokens: any = {
        space: {
          base: 8,
          md: "{space.base}",
          lg: 16,
        },
      };

      const resolved = resolveTokenReferences(tokens);

      expect(resolved.space.md).toBe(8);
      expect(resolved.space.base).toBe(8);
      expect(resolved.space.lg).toBe(16);
    });

    it("should throw on circular reference in strict mode", () => {
      const tokens: any = {
        color: {
          a: "{color.b}",
          b: "{color.a}",
        },
      };

      expect(() => resolveTokenReferences(tokens)).toThrow("validation failed");
    });

    it("should not throw on circular reference in non-strict mode", () => {
      const tokens: any = {
        color: {
          a: "{color.b}",
          b: "{color.a}",
        },
      };

      const resolved = resolveTokenReferences(tokens, { strict: false });

      // Should return original values when circular
      expect(resolved.color.a).toBe("{color.b}");
      expect(resolved.color.b).toBe("{color.a}");
    });

    it("should handle complex nested structures", () => {
      const tokens: any = {
        color: {
          brand: {
            primary: "#4F46E5",
            hover: "{color.brand.primary}",
            pressed: "{color.brand.hover}",
          },
          semantic: {
            info: "{color.brand.primary}",
            infoHover: "{color.brand.hover}",
          },
        },
        button: {
          primaryColor: "{color.brand.primary}",
          primaryHoverColor: "{color.brand.hover}",
        },
      };

      const resolved = resolveTokenReferences(tokens);

      expect(resolved.color.brand.primary).toBe("#4F46E5");
      expect(resolved.color.brand.hover).toBe("#4F46E5");
      expect(resolved.color.brand.pressed).toBe("#4F46E5");
      expect(resolved.color.semantic.info).toBe("#4F46E5");
      expect(resolved.color.semantic.infoHover).toBe("#4F46E5");
      expect(resolved.button.primaryColor).toBe("#4F46E5");
      expect(resolved.button.primaryHoverColor).toBe("#4F46E5");
    });
  });

  describe("getTokenDependents", () => {
    it("should find all tokens that depend on a token", () => {
      const tokens: any = {
        color: {
          base: "#4F46E5",
          hover: "{color.base}",
          pressed: "{color.base}",
        },
        semantic: {
          info: "{color.base}",
        },
      };

      const dependents = getTokenDependents(tokens, "color.base");

      expect(dependents).toHaveLength(3);
      expect(dependents).toContain("color.hover");
      expect(dependents).toContain("color.pressed");
      expect(dependents).toContain("semantic.info");
    });

    it("should return empty array for tokens with no dependents", () => {
      const tokens: any = {
        color: {
          base: "#4F46E5",
          hover: "{color.base}",
        },
      };

      const dependents = getTokenDependents(tokens, "color.hover");

      expect(dependents).toHaveLength(0);
    });
  });

  describe("getTokenDependencies", () => {
    it("should find all tokens a token depends on", () => {
      const tokens: any = {
        color: {
          base: "#4F46E5",
          hover: "{color.base}",
          pressed: "{color.hover}",
        },
      };

      const dependencies = getTokenDependencies(tokens, "color.pressed");

      expect(dependencies).toContain("color.hover");
      expect(dependencies).toContain("color.base");
    });

    it("should return empty array for tokens with no dependencies", () => {
      const tokens: any = {
        color: {
          base: "#4F46E5",
        },
      };

      const dependencies = getTokenDependencies(tokens, "color.base");

      expect(dependencies).toHaveLength(0);
    });
  });
});

