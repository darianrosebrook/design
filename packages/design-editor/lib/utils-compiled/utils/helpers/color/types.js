/**
 * Color space type definitions and constants
 *
 * This module contains all TypeScript interfaces and constants used
 * throughout the color utility modules.
 *
 * @author @darianrosebrook
 */
/**
 * D65 reference white point in XYZ color space
 */
export const D65_WHITE_POINT = {
    x: 0.95047,
    y: 1.0,
    z: 1.08883,
};
/**
 * CIE standard constants
 */
export const KAPPA = 24389 / 27; // (29/3)^3
export const EPSILON = 216 / 24389; // (6/29)^3 = ~0.008856
