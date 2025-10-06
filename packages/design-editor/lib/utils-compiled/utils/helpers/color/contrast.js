/**
 * Color contrast and accessibility utilities
 *
 * This module provides functions for calculating color contrast ratios
 * and WCAG compliance checking.
 *
 * @author @darianrosebrook
 */
import { sRgbToLinearRgbChannel } from "./spaces";
/**
 * Calculates WCAG relative luminance (0-1) for an sRGB color
 * Reference: WCAG 2.1 §1.4.3
 * @param rgb - RGB color object
 * @returns Relative luminance value (0-1)
 */
export function relativeLuminance(rgb) {
    const r = sRgbToLinearRgbChannel(rgb.r);
    const g = sRgbToLinearRgbChannel(rgb.g);
    const b = sRgbToLinearRgbChannel(rgb.b);
    // WCAG coefficients
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
/**
 * Computes contrast ratio between two sRGB colors per WCAG (1-21)
 * @param foreground - Foreground RGB color
 * @param background - Background RGB color
 * @returns Contrast ratio (1-21)
 */
export function contrastRatio(foreground, background) {
    const L1 = relativeLuminance(foreground);
    const L2 = relativeLuminance(background);
    const lighter = Math.max(L1, L2);
    const darker = Math.min(L1, L2);
    return (lighter + 0.05) / (darker + 0.05);
}
/**
 * Convenience function: contrast ratio from hex inputs
 * @param fgHex - Foreground color as hex string
 * @param bgHex - Background color as hex string
 * @returns Contrast ratio or null if invalid hex
 */
export function contrastRatioHex(fgHex, bgHex) {
    const fg = hexToRgb(fgHex);
    const bg = hexToRgb(bgHex);
    if (!fg || !bg)
        return null;
    return contrastRatio(fg, bg);
}
/**
 * Checks if two colors meet WCAG AA contrast requirements (4.5:1)
 * @param foreground - Foreground RGB color
 * @param background - Background RGB color
 * @param level - WCAG level ('AA' or 'AAA')
 * @returns True if contrast meets requirements
 */
export function meetsContrastRequirement(foreground, background, level = "AA") {
    const ratio = contrastRatio(foreground, background);
    const required = level === "AAA" ? 7.0 : 4.5;
    return ratio >= required;
}
/**
 * Checks if a color pair meets WCAG contrast for normal text
 * @param foreground - Foreground RGB color
 * @param background - Background RGB color
 * @returns True if contrast >= 4.5:1
 */
export function meetsNormalTextContrast(foreground, background) {
    return meetsContrastRequirement(foreground, background, "AA");
}
/**
 * Checks if a color pair meets WCAG contrast for large text
 * @param foreground - Foreground RGB color
 * @param background - Background RGB color
 * @returns True if contrast >= 3.0:1
 */
export function meetsLargeTextContrast(foreground, background) {
    const ratio = contrastRatio(foreground, background);
    return ratio >= 3.0;
}
/**
 * Calculates the required luminance difference to achieve target contrast
 * @param backgroundLuminance - Background relative luminance (0-1)
 * @param targetRatio - Target contrast ratio
 * @returns Required foreground luminance (0-1)
 */
export function requiredLuminanceForContrast(backgroundLuminance, targetRatio) {
    // Using the WCAG formula: (L1 + 0.05) / (L2 + 0.05) = ratio
    // Solving for L1: L1 = ratio * (L2 + 0.05) - 0.05
    return targetRatio * (backgroundLuminance + 0.05) - 0.05;
}
// --- Legacy function for backward compatibility ---
/**
 * Legacy contrast calculation (deprecated - use relativeLuminance instead)
 * @param hexcolor - Hex color string
 * @returns Luminance value (0-1000)
 * @deprecated Use relativeLuminance with hexToRgb instead
 */
export const calculateContrast = (hexcolor) => {
    let r, g, b;
    if (hexcolor.startsWith("#"))
        hexcolor = hexcolor.slice(1);
    // Validate hex characters
    if (!/^[0-9a-fA-F]+$/.test(hexcolor)) {
        throw new Error("Invalid hex color: " + hexcolor);
    }
    if (hexcolor.length === 3) {
        r = parseInt(hexcolor[0] + hexcolor[0], 16);
        g = parseInt(hexcolor[1] + hexcolor[1], 16);
        b = parseInt(hexcolor[2] + hexcolor[2], 16);
    }
    else if (hexcolor.length === 6) {
        r = parseInt(hexcolor.slice(0, 2), 16);
        g = parseInt(hexcolor.slice(2, 4), 16);
        b = parseInt(hexcolor.slice(4, 6), 16);
    }
    else {
        throw new Error("Invalid hex color: " + hexcolor);
    }
    return (r * 299 + g * 587 + b * 114) / 1000;
};
/**
 * Converts a HEX color string to an RGB object
 * @param hex - The hex color string (e.g., "#ff0000", "f00")
 * @returns RGB color object or null if invalid
 */
export function hexToRgb(hex) {
    if (!hex || typeof hex !== "string") {
        return null;
    }
    // Remove leading '#' if present
    const sanitizedHex = hex.startsWith("#") ? hex.slice(1) : hex;
    // Check for 3-digit shorthand hex
    if (sanitizedHex.length === 3) {
        const r = parseInt(sanitizedHex[0] + sanitizedHex[0], 16);
        const g = parseInt(sanitizedHex[1] + sanitizedHex[1], 16);
        const b = parseInt(sanitizedHex[2] + sanitizedHex[2], 16);
        if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
            return { r, g, b };
        }
    }
    // Check for 6-digit hex
    if (sanitizedHex.length === 6) {
        const r = parseInt(sanitizedHex.substring(0, 2), 16);
        const g = parseInt(sanitizedHex.substring(2, 4), 16);
        const b = parseInt(sanitizedHex.substring(4, 6), 16);
        if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
            return { r, g, b };
        }
    }
    // Invalid format
    return null;
}
/**
 * Converts an RGB color object to a HEX color string
 * @param rgb - RGB color object (0-255)
 * @returns Hex color string (e.g., "#ff0000")
 */
export function rgbToHex({ r, g, b }) {
    // Helper to convert a single channel, clamp, round, and pad with zero if needed
    const toHex = (c) => {
        // Ensure value is within 0-255 range and an integer
        const clamped = Math.max(0, Math.min(255, Math.round(c)));
        const hex = clamped.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
