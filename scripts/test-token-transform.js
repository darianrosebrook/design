const fs = require("fs");
const path = require("path");

// Import the design tokens schema and utilities
const {
  DesignTokensSchema,
} = require("./packages/design-tokens/dist/tokens.js");

// Load the design tokens JSON
const tokensPath = path.join(
  __dirname,
  "packages/design-editor/public/designTokens.json"
);
const loadedTokens = JSON.parse(fs.readFileSync(tokensPath, "utf8"));

// Simple transformation function (copy from canvas-context.tsx)
const transformTokensToSchema = (loadedTokens) => {
  const core = loadedTokens.core || {};

  // Extract color tokens - map from the nested structure
  const extractColorValue = (path) => {
    const parts = path.split(".");
    let current = core.color;
    for (const part of parts) {
      if (current && typeof current === "object" && part in current) {
        current = current[part];
        // Handle W3C token format with $value
        if (current && typeof current === "object" && "$value" in current) {
          current = current.$value;
        }
      } else {
        return "#000000"; // fallback
      }
    }
    return typeof current === "string" ? current : "#000000";
  };

  // Extract spacing tokens - map numbered keys to semantic names
  const extractSpacingValue = (key) => {
    const spacing = core.spacing?.size;
    if (!spacing || typeof spacing !== "object") return 0;

    // Map semantic keys to numbered keys
    const keyMap = {
      xs: "00",
      sm: "01",
      md: "02",
      lg: "03",
      xl: "04",
      "2xl": "05",
      "3xl": "06",
    };

    const numberedKey = keyMap[key] || key;
    if (numberedKey in spacing) {
      const value = spacing[numberedKey];
      if (value && typeof value === "object" && "$value" in value) {
        const rawValue = value.$value;
        if (typeof rawValue === "string") {
          // Parse CSS values like "1px" to numbers
          const match = rawValue.match(/^(\d+(?:\.\d+)?)px?$/);
          return match ? parseFloat(match[1]) : 0;
        }
        return typeof rawValue === "number" ? rawValue : 0;
      }
      return typeof value === "number" ? value : 0;
    }
    return 0;
  };

  return {
    color: {
      background: {
        primary: extractColorValue("mode.black"),
        secondary: extractColorValue("mode.light"),
        tertiary: extractColorValue("palette.neutral.200"),
        surface: extractColorValue("palette.neutral.100"),
        elevated: extractColorValue("palette.neutral.50"),
      },
      text: {
        primary: extractColorValue("mode.black"),
        secondary: extractColorValue("palette.neutral.600"),
        tertiary: extractColorValue("palette.neutral.400"),
        inverse: extractColorValue("mode.white"),
      },
      border: {
        subtle: extractColorValue("palette.neutral.300"),
        default: extractColorValue("palette.neutral.400"),
        strong: extractColorValue("palette.neutral.500"),
      },
      interactive: {
        primary: extractColorValue("palette.primary.500"),
        primaryHover: extractColorValue("palette.primary.600"),
        primaryPressed: extractColorValue("palette.primary.700"),
        secondary: extractColorValue("palette.neutral.500"),
        secondaryHover: extractColorValue("palette.neutral.600"),
        secondaryPressed: extractColorValue("palette.neutral.700"),
        destructive: extractColorValue("palette.error.500"),
        destructiveHover: extractColorValue("palette.error.600"),
        destructivePressed: extractColorValue("palette.error.700"),
      },
      semantic: {
        success: extractColorValue("palette.success.500"),
        warning: extractColorValue("palette.warning.500"),
        error: extractColorValue("palette.error.500"),
        info: extractColorValue("palette.info.500"),
      },
    },
    space: {
      xs: extractSpacingValue("xs"),
      sm: extractSpacingValue("sm"),
      md: extractSpacingValue("md"),
      lg: extractSpacingValue("lg"),
      xl: extractSpacingValue("xl"),
      "2xl": extractSpacingValue("2xl") || extractSpacingValue("xl") * 2,
      "3xl": extractSpacingValue("3xl") || extractSpacingValue("xl") * 3,
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
};

try {
  const transformedTokens = transformTokensToSchema(loadedTokens);
  console.log("✅ Transformation successful");

  // Validate with Zod schema
  const result = DesignTokensSchema.safeParse(transformedTokens);
  if (result.success) {
    console.log("✅ Schema validation successful");
    console.log("Sample transformed tokens:");
    console.log("- Color primary:", transformedTokens.color.background.primary);
    console.log("- Space md:", transformedTokens.space.md);
    console.log("- Type family sans:", transformedTokens.type.family.sans);
  } else {
    console.log("❌ Schema validation failed:");
    console.log(result.error.issues.slice(0, 5)); // Show first 5 errors
  }
} catch (error) {
  console.log("❌ Transformation failed:", error.message);
}
