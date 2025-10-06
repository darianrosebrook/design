/**
 * Color space type definitions and constants
 *
 * This module contains all TypeScript interfaces and constants used
 * throughout the color utility modules.
 *
 * @author @darianrosebrook
 */

// Color space interfaces
export interface RGB {
  r: number; // Red component (0-255)
  g: number; // Green component (0-255)
  b: number; // Blue component (0-255)
}

export interface HSL {
  h: number; // Hue angle (0-360)
  s: number; // Saturation (0-100)
  l: number; // Lightness (0-100)
}

export interface LAB {
  l: number; // Lightness (0-100)
  a: number; // Green-Red axis (-128 to 127)
  b: number; // Blue-Yellow axis (-128 to 127)
}

export interface LCH {
  l: number; // Lightness (0-100)
  c: number; // Chroma (>= 0)
  h: number; // Hue angle (0-360)
}

export interface XYZ {
  x: number; // X component (D65 reference white: 0.95047)
  y: number; // Y component (D65 reference white: 1.00000)
  z: number; // Z component (D65 reference white: 1.08883)
}

export interface HSV {
  h: number; // Hue angle (0-360)
  s: number; // Saturation (0-100)
  v: number; // Value (0-100)
}

export interface OKLAB {
  L: number; // Lightness (0-1)
  a: number; // Green-Red axis
  b: number; // Blue-Yellow axis
}

export interface OKLCH {
  L: number; // Lightness (0-1)
  c: number; // Chroma (>= 0)
  h: number; // Hue angle (0-360)
}

/**
 * D65 reference white point in XYZ color space
 */
export const D65_WHITE_POINT: XYZ = {
  x: 0.95047,
  y: 1.0,
  z: 1.08883,
};

/**
 * CIE standard constants
 */
export const KAPPA = 24389 / 27; // (29/3)^3
export const EPSILON = 216 / 24389; // (6/29)^3 = ~0.008856
