/**
 * @fileoverview Design tokens and theme utilities
 * @author @darianrosebrook
 */

import { z } from "zod";

/**
 * Token reference validator
 * Checks for {token.path} syntax
 */
const tokenReference = z.string().regex(/^\{[a-zA-Z0-9.]+\}$/);

/**
 * Color token value - either a color string or a reference
 */
const colorValue = z.union([
  z.string(), // Color hex, rgb, or reference
  tokenReference,
]);

/**
 * Numeric token value - either a number or a reference to a number
 */
const numericValue = z.union([z.number(), tokenReference]);

// Design tokens schema with reference support
export const DesignTokensSchema = z.object({
  $schema: z.string().optional(),
  schemaVersion: z.string().optional(),
  color: z.object({
    background: z.object({
      primary: colorValue,
      secondary: colorValue,
      tertiary: colorValue,
      surface: colorValue,
      elevated: colorValue,
    }),
    text: z.object({
      primary: colorValue,
      secondary: colorValue,
      tertiary: colorValue,
      inverse: colorValue,
    }),
    border: z.object({
      subtle: colorValue,
      default: colorValue,
      strong: colorValue,
    }),
    interactive: z.object({
      primary: colorValue,
      primaryHover: colorValue,
      primaryPressed: colorValue,
      secondary: colorValue,
      secondaryHover: colorValue,
      secondaryPressed: colorValue,
      destructive: colorValue,
      destructiveHover: colorValue,
      destructivePressed: colorValue,
    }),
    semantic: z.object({
      success: colorValue,
      warning: colorValue,
      error: colorValue,
      info: colorValue,
    }),
  }),
  space: z.object({
    xs: numericValue,
    sm: numericValue,
    md: numericValue,
    lg: numericValue,
    xl: numericValue,
    "2xl": numericValue,
    "3xl": numericValue,
  }),
  type: z.object({
    family: z.object({
      sans: z.union([z.string(), tokenReference]),
      mono: z.union([z.string(), tokenReference]),
    }),
    size: z.object({
      xs: numericValue,
      sm: numericValue,
      md: numericValue,
      lg: numericValue,
      xl: numericValue,
      "2xl": numericValue,
      "3xl": numericValue,
    }),
    weight: z.object({
      normal: z.union([z.string(), z.number(), tokenReference]),
      medium: z.union([z.string(), z.number(), tokenReference]),
      semibold: z.union([z.string(), z.number(), tokenReference]),
      bold: z.union([z.string(), z.number(), tokenReference]),
    }),
    lineHeight: z.object({
      tight: numericValue,
      normal: numericValue,
      loose: numericValue,
    }),
  }),
  radius: z.object({
    none: numericValue,
    sm: numericValue,
    md: numericValue,
    lg: numericValue,
    xl: numericValue,
    full: numericValue,
  }),
  shadow: z.object({
    sm: z.union([z.string(), tokenReference]),
    md: z.union([z.string(), tokenReference]),
    lg: z.union([z.string(), tokenReference]),
    xl: z.union([z.string(), tokenReference]),
  }),
  borderWidth: z.object({
    none: numericValue,
    sm: numericValue,
    md: numericValue,
    lg: numericValue,
  }),
  zIndex: z.object({
    dropdown: numericValue,
    sticky: numericValue,
    fixed: numericValue,
    modal: numericValue,
    popover: numericValue,
    tooltip: numericValue,
  }),
});

export type DesignTokens = z.infer<typeof DesignTokensSchema>;

/**
 * Default design tokens (from design/tokens.json)
 */
export const defaultTokens: DesignTokens = {
  color: {
    background: {
      primary: "#0B0B0B",
      secondary: "#111317",
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
