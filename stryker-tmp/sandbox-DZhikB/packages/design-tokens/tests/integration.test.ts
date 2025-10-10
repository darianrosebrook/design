/**
 * @fileoverview Integration tests for token system
 * @author @darianrosebrook
 */

import { describe, it, expect } from "vitest";
import {
  resolveTokenReferences,
  validateTokenReferences,
  type DesignTokens,
  tokensToCSS,
  flattenTokens,
} from "../src/index";

describe("Token System Integration", () => {
  describe("Schema Validation with References", () => {
    it("should validate tokens with references", () => {
      const tokens: any = {
        color: {
          background: {
            primary: "#0B0B0B",
            secondary: "{color.background.primary}",
            tertiary: "#1A1D23",
            surface: "#1E2329",
            elevated: "#252B33",
          },
          text: {
            primary: "#E6E6E6",
            secondary: "#A3A3A3",
            tertiary: "#6B7280",
            inverse: "{color.background.primary}",
          },
          border: {
            subtle: "#374151",
            default: "#4B5563",
            strong: "#6B7280",
          },
          interactive: {
            primary: "#4F46E5",
            primaryHover: "{color.interactive.primary}",
            primaryPressed: "{color.interactive.primaryHover}",
            secondary: "#6B7280",
            secondaryHover: "#4B5563",
            secondaryPressed: "#374151",
            destructive: "#EF4444",
            destructiveHover: "#DC2626",
            destructivePressed: "#B91C1C",
          },
          semantic: {
            success: "#10B981",
            warning: "#F59E0B",
            error: "#EF4444",
            info: "{color.interactive.primary}",
          },
        },
        space: {
          xs: 4,
          sm: 8,
          md: 12,
          lg: 16,
          xl: 24,
          "2xl": 32,
          "3xl": 48,
        },
        type: {
          family: {
            sans: "Inter, sans-serif",
            mono: "Monaco, monospace",
          },
          size: {
            xs: 12,
            sm: 14,
            md: 16,
            lg: 18,
            xl: 20,
            "2xl": 24,
            "3xl": 30,
          },
          weight: {
            normal: "400",
            medium: "500",
            semibold: "600",
            bold: "700",
          },
          lineHeight: {
            tight: 1.25,
            normal: 1.5,
            loose: 1.75,
          },
        },
        radius: {
          none: 0,
          sm: 4,
          md: 6,
          lg: 8,
          xl: 12,
          full: 9999,
        },
        shadow: {
          sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
          md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        },
        borderWidth: {
          none: 0,
          sm: 1,
          md: 2,
          lg: 4,
        },
        zIndex: {
          dropdown: 1000,
          sticky: 1020,
          fixed: 1030,
          modal: 1040,
          popover: 1050,
          tooltip: 1060,
        },
      };

      const validation = validateTokenReferences(tokens);
      expect(validation.valid).toBe(true);
    });
  });

  describe("End-to-End Token Pipeline", () => {
    it("should resolve references and generate CSS", () => {
      const tokens: any = {
        color: {
          background: {
            primary: "#0B0B0B",
            secondary: "{color.background.primary}",
            tertiary: "#1A1D23",
            surface: "#1E2329",
            elevated: "#252B33",
          },
          text: {
            primary: "#E6E6E6",
            secondary: "#A3A3A3",
            tertiary: "#6B7280",
            inverse: "{color.background.primary}",
          },
          border: {
            subtle: "#374151",
            default: "#4B5563",
            strong: "#6B7280",
          },
          interactive: {
            primary: "#4F46E5",
            primaryHover: "{color.interactive.primary}",
            primaryPressed: "{color.interactive.primaryHover}",
            secondary: "#6B7280",
            secondaryHover: "#4B5563",
            secondaryPressed: "#374151",
            destructive: "#EF4444",
            destructiveHover: "#DC2626",
            destructivePressed: "#B91C1C",
          },
          semantic: {
            success: "#10B981",
            warning: "#F59E0B",
            error: "#EF4444",
            info: "{color.interactive.primary}",
          },
        },
        space: {
          xs: 4,
          sm: 8,
          md: "{space.sm}",
          lg: 16,
          xl: 24,
          "2xl": 32,
          "3xl": 48,
        },
        type: {
          family: {
            sans: "Inter, sans-serif",
            mono: "Monaco, monospace",
          },
          size: {
            xs: 12,
            sm: 14,
            md: 16,
            lg: 18,
            xl: 20,
            "2xl": 24,
            "3xl": 30,
          },
          weight: {
            normal: "400",
            medium: "500",
            semibold: "600",
            bold: "700",
          },
          lineHeight: {
            tight: 1.25,
            normal: 1.5,
            loose: 1.75,
          },
        },
        radius: {
          none: 0,
          sm: 4,
          md: 6,
          lg: 8,
          xl: 12,
          full: 9999,
        },
        shadow: {
          sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
          md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        },
        borderWidth: {
          none: 0,
          sm: 1,
          md: 2,
          lg: 4,
        },
        zIndex: {
          dropdown: 1000,
          sticky: 1020,
          fixed: 1030,
          modal: 1040,
          popover: 1050,
          tooltip: 1060,
        },
      };

      const css = tokensToCSS(tokens);

      // Check that references are resolved in CSS output
      expect(css).toContain("--color-background-secondary: #0B0B0B");
      expect(css).toContain("--color-text-inverse: #0B0B0B");
      expect(css).toContain("--color-interactive-primaryHover: #4F46E5");
      expect(css).toContain("--color-interactive-primaryPressed: #4F46E5");
      expect(css).toContain("--color-semantic-info: #4F46E5");
      expect(css).toContain("--space-md: 8px"); // Numeric reference

      // Check that original values are preserved
      expect(css).toContain("--color-background-primary: #0B0B0B");
      expect(css).toContain("--color-interactive-primary: #4F46E5");
      expect(css).toContain("--space-sm: 8px");
    });

    it("should flatten tokens with resolved references", () => {
      const tokens: any = {
        color: {
          background: {
            primary: "#0B0B0B",
            secondary: "{color.background.primary}",
            tertiary: "#1A1D23",
            surface: "#1E2329",
            elevated: "#252B33",
          },
          text: {
            primary: "#E6E6E6",
            secondary: "#A3A3A3",
            tertiary: "#6B7280",
            inverse: "{color.background.primary}",
          },
          border: {
            subtle: "#374151",
            default: "#4B5563",
            strong: "#6B7280",
          },
          interactive: {
            primary: "#4F46E5",
            primaryHover: "{color.interactive.primary}",
            primaryPressed: "{color.interactive.primary}",
            secondary: "#6B7280",
            secondaryHover: "#4B5563",
            secondaryPressed: "#374151",
            destructive: "#EF4444",
            destructiveHover: "#DC2626",
            destructivePressed: "#B91C1C",
          },
          semantic: {
            success: "#10B981",
            warning: "#F59E0B",
            error: "#EF4444",
            info: "#3B82F6",
          },
        },
        space: {
          xs: 4,
          sm: 8,
          md: 12,
          lg: 16,
          xl: 24,
          "2xl": 32,
          "3xl": 48,
        },
        type: {
          family: {
            sans: "Inter, sans-serif",
            mono: "Monaco, monospace",
          },
          size: {
            xs: 12,
            sm: 14,
            md: 16,
            lg: 18,
            xl: 20,
            "2xl": 24,
            "3xl": 30,
          },
          weight: {
            normal: "400",
            medium: "500",
            semibold: "600",
            bold: "700",
          },
          lineHeight: {
            tight: 1.25,
            normal: 1.5,
            loose: 1.75,
          },
        },
        radius: {
          none: 0,
          sm: 4,
          md: 6,
          lg: 8,
          xl: 12,
          full: 9999,
        },
        shadow: {
          sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
          md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        },
        borderWidth: {
          none: 0,
          sm: 1,
          md: 2,
          lg: 4,
        },
        zIndex: {
          dropdown: 1000,
          sticky: 1020,
          fixed: 1030,
          modal: 1040,
          popover: 1050,
          tooltip: 1060,
        },
      };

      const flattened = flattenTokens(tokens);

      expect(flattened["--color-background-secondary"]).toBe("#0B0B0B");
      expect(flattened["--color-text-inverse"]).toBe("#0B0B0B");
      expect(flattened["--color-interactive-primaryHover"]).toBe("#4F46E5");
      expect(flattened["--color-interactive-primaryPressed"]).toBe("#4F46E5");
    });
  });

  describe("Real-World Token File", () => {
    it("should handle complex design system with references", () => {
      const designSystem: any = {
        color: {
          background: {
            primary: "#0B0B0B",
            secondary: "{color.background.primary}",
            tertiary: "#1A1D23",
            surface: "#1E2329",
            elevated: "#252B33",
          },
          text: {
            primary: "#E6E6E6",
            secondary: "#A3A3A3",
            tertiary: "#6B7280",
            inverse: "#0B0B0B",
          },
          border: {
            subtle: "#374151",
            default: "#4B5563",
            strong: "#6B7280",
          },
          interactive: {
            primary: "#4F46E5",
            primaryHover: "#4338CA",
            primaryPressed: "#3730A3",
            secondary: "#6B7280",
            secondaryHover: "#4B5563",
            secondaryPressed: "#374151",
            destructive: "#EF4444",
            destructiveHover: "#DC2626",
            destructivePressed: "#B91C1C",
          },
          semantic: {
            success: "#10B981",
            warning: "#F59E0B",
            error: "#EF4444",
            info: "#3B82F6",
          },
        },
        space: {
          xs: 4,
          sm: 8,
          md: 12,
          lg: 16,
          xl: 24,
          "2xl": 32,
          "3xl": 48,
        },
        type: {
          family: {
            sans: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            mono: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace",
          },
          size: {
            xs: 12,
            sm: 14,
            md: 16,
            lg: 18,
            xl: 20,
            "2xl": 24,
            "3xl": 30,
          },
          weight: {
            normal: "400",
            medium: "500",
            semibold: "600",
            bold: "700",
          },
          lineHeight: {
            tight: 1.25,
            normal: 1.5,
            loose: 1.75,
          },
        },
        radius: {
          none: 0,
          sm: 4,
          md: 6,
          lg: 8,
          xl: 12,
          full: 9999,
        },
        shadow: {
          sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
          md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        },
        borderWidth: {
          none: 0,
          sm: 1,
          md: 2,
          lg: 4,
        },
        zIndex: {
          dropdown: 1000,
          sticky: 1020,
          fixed: 1030,
          modal: 1040,
          popover: 1050,
          tooltip: 1060,
        },
      };

      const resolved = resolveTokenReferences(designSystem);

      expect(resolved.color.background.secondary).toBe("#0B0B0B");

      const validation = validateTokenReferences(designSystem);
      expect(validation.valid).toBe(true);

      const css = tokensToCSS(designSystem);
      expect(css).toContain(":root {");
      expect(css).toContain("}");
      expect(css.split("\n").length).toBeGreaterThan(60); // Lots of CSS vars
    });
  });
});
