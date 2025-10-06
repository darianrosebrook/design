/**
 * Color utilities for the design editor
 * Simplified exports for color picker functionality
 * @author @darianrosebrook
 */

import { checkContrast } from "./utils/helpers/color/contrast";
import {
  rgbToHsl,
  hslToRgb,
  rgbToHsv,
  hsvToRgb,
  rgbToHex,
  hexToRgb,
} from "./utils/helpers/color/spaces";

export {
  rgbToHsl,
  hslToRgb,
  rgbToHsv,
  hsvToRgb,
  rgbToHex,
  hexToRgb,
  checkContrast,
};

export interface ContrastResult {
  ratio: number;
  level: "AA" | "AAA" | "Fail";
  largeText: boolean;
}

// Simple hex to rgb conversion if not available
export function hexToRgbSimple(
  hex: string
): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// Simple rgb to hex conversion
export function rgbToHexSimple(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

// Find nearest compliant color (simplified)
export function findNearestCompliantColor(
  color: string,
  _targetRatio: number
): string {
  // Simplified implementation - just return the original color
  return color;
}

// Extract colors from objects (placeholder)
export function extractColorsFromObjects(_objects: any[]): string[] {
  return ["#000000"];
}

// Type exports
export type { RGB, HSL, HSV } from "./utils/helpers/color/types";
