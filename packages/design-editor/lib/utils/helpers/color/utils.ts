/**
 * Color utility functions
 *
 * This module provides miscellaneous color utility functions
 * including gamut clipping and specialized conversions.
 *
 * @author @darianrosebrook
 */

import { oklchToOklab, oklabToRgb } from "./spaces";
import type { RGB, LAB, OKLAB, OKLCH } from "./types";

/**
 * OKLCH gamut clipping (naive): reduce chroma until in-gamut in sRGB
 * Returns clamped RGB after reducing c if needed
 * @param L - Lightness (0-1)
 * @param c - Chroma (>= 0)
 * @param h - Hue angle (0-360)
 * @returns RGB color object within sRGB gamut
 */
export function oklchToRgbClipped(L: number, c: number, h: number): RGB {
  let low = 0;
  let high = c;
  let mid = c;
  for (let i = 0; i < 12; i++) {
    mid = (low + high) / 2;
    const { a, b } = oklchToOklab(L, mid, h);
    const rgb = oklabToRgb(L, a, b);
    const inGamut =
      rgb.r >= 0 &&
      rgb.r <= 255 &&
      rgb.g >= 0 &&
      rgb.g <= 255 &&
      rgb.b >= 0 &&
      rgb.b <= 255;
    if (inGamut) {low = mid;}
    else {high = mid;}
  }
  const { a, b } = oklchToOklab(L, low, h);
  return oklabToRgb(L, a, b);
}

/**
 * Placeholder for CIECAM02 implementation
 * CIECAM02 is a more advanced color appearance model
 * @param rgb - RGB color object
 * @returns Simplified JCh representation (placeholder)
 */
export function rgbToCam02JCh(rgb: RGB) {
  // This is a simplified placeholder
  // A full CIECAM02 implementation would be quite complex
  const { l, c, h } = rgbToLch(rgb);

  // Return a basic structure - in reality this would use CAM02
  return {
    J: l, // Lightness
    C: c, // Chroma
    h: h, // Hue
  };
}

/**
 * Converts RGB to LCH (simplified version for the CAM placeholder)
 * @param rgb - RGB color object
 * @returns LCH color object
 */
function rgbToLch(rgb: RGB) {
  // Simplified conversion through LAB
  const lab = rgbToLab(rgb);
  const { l, a, b } = lab;

  const c = Math.sqrt(a * a + b * b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) {h += 360;}

  return { l, c, h };
}

/**
 * Converts RGB to LAB (simplified version)
 * @param rgb - RGB color object
 * @returns LAB color object
 */
function rgbToLab(rgb: RGB): LAB {
  // This is a very simplified conversion
  // A proper implementation would use XYZ color space
  const { r, g, b } = rgb;

  // Normalize to 0-1
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  // Simplified LAB conversion (not accurate)
  const l = (rNorm * 0.299 + gNorm * 0.587 + bNorm * 0.114) * 100;
  const a = (rNorm * 0.5 - gNorm * 0.5) * 128;
  const b_lab = (rNorm * 0.5 - bNorm * 0.5) * 128;

  return { l, a, b: b_lab };
}

/**
 * Validates if an RGB color is within the sRGB gamut
 * @param rgb - RGB color object
 * @returns True if color is within sRGB gamut
 */
export function isInSrgbGamut(rgb: RGB): boolean {
  return (
    rgb.r >= 0 &&
    rgb.r <= 255 &&
    rgb.g >= 0 &&
    rgb.g <= 255 &&
    rgb.b >= 0 &&
    rgb.b <= 255
  );
}

/**
 * Clamps RGB values to the sRGB gamut
 * @param rgb - RGB color object
 * @returns Clamped RGB color object
 */
export function clampToSrgbGamut(rgb: RGB): RGB {
  return {
    r: Math.max(0, Math.min(255, Math.round(rgb.r))),
    g: Math.max(0, Math.min(255, Math.round(rgb.g))),
    b: Math.max(0, Math.min(255, Math.round(rgb.b))),
  };
}

/**
 * Calculates color temperature approximation (very simplified)
 * @param rgb - RGB color object
 * @returns Approximate color temperature in Kelvin
 */
export function approximateColorTemperature(rgb: RGB): number {
  // This is a very rough approximation
  // Real color temperature calculation is much more complex
  const { r, g, b } = rgb;

  // Simple heuristic based on RGB ratios
  const total = r + g + b;
  if (total === 0) {return 6500;} // Neutral gray

  const rRatio = r / total;
  const gRatio = g / total;
  const bRatio = b / total;

  // Rough temperature estimation
  if (bRatio > 0.4) {return 10000;} // Cool blue
  if (rRatio > 0.4) {return 2500;} // Warm red
  if (gRatio > 0.5) {return 5500;} // Neutral green

  return 6500; // Default daylight
}
