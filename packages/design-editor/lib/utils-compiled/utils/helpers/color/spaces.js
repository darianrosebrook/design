/**
 * Color space conversion functions
 *
 * This module provides functions for converting between different color spaces
 * including RGB, HSL, LAB, LCH, XYZ, HSV, OKLAB, and OKLCH.
 *
 * @author @darianrosebrook
 */
import { D65_WHITE_POINT, KAPPA, EPSILON } from "./types";
// --- Core Conversion Helpers (Internal) ---
/**
 * Converts an sRGB color channel value to linear RGB
 * @param channel - sRGB channel value (0-255)
 * @returns Linear RGB value (0-1)
 */
export function sRgbToLinearRgbChannel(channel) {
    const v = channel / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}
/**
 * Converts a linear RGB color channel value to sRGB
 * @param channel - Linear RGB channel value (0-1)
 * @returns sRGB value (0-255)
 */
export function linearRgbToSRgbChannel(channel) {
    const v = channel <= 0.0031308
        ? 12.92 * channel
        : 1.055 * Math.pow(channel, 1 / 2.4) - 0.055;
    const clamped = Math.max(0, Math.min(1, v));
    return Math.round(clamped * 255);
}
// --- RGB/XYZ/LAB Conversions ---
/**
 * Converts sRGB values to CIE XYZ color space (D65 illuminant)
 * @param rgb - RGB color object
 * @returns XYZ color object
 */
export function rgbToXyz({ r, g, b }) {
    // Convert sRGB to linear RGB
    const R_linear = sRgbToLinearRgbChannel(r);
    const G_linear = sRgbToLinearRgbChannel(g);
    const B_linear = sRgbToLinearRgbChannel(b);
    // Apply the standard sRGB to XYZ transformation matrix (D65)
    const x = R_linear * 0.4124564 + G_linear * 0.3575761 + B_linear * 0.1804375;
    const y = R_linear * 0.2126729 + G_linear * 0.7151522 + B_linear * 0.072175;
    const z = R_linear * 0.0193339 + G_linear * 0.119192 + B_linear * 0.9503041;
    return { x, y, z };
}
/**
 * Converts CIE XYZ color space values to CIE L*a*b* color space
 * @param xyz - XYZ color object
 * @returns LAB color object with precise values
 */
export function xyzToLab({ x, y, z }) {
    // Normalize XYZ values relative to the D65 white point
    const x_n = x / D65_WHITE_POINT.x;
    const y_n = y / D65_WHITE_POINT.y;
    const z_n = z / D65_WHITE_POINT.z;
    // Apply the non-linear transformation function f
    const f = (t) => t > EPSILON ? Math.cbrt(t) : (KAPPA * t + 16) / 116;
    const fx = f(x_n);
    const fy = f(y_n);
    const fz = f(z_n);
    // Calculate L*, a*, b*
    const l = 116 * fy - 16;
    const a = 500 * (fx - fy);
    const b_lab = 200 * (fy - fz); // Use b_lab to avoid conflict with RGB 'b'
    return { l, a, b: b_lab };
}
/**
 * Converts CIE L*a*b* color space values to CIE XYZ color space (D65)
 * @param lab - LAB color object
 * @returns XYZ color object
 */
export function labToXyz({ l, a, b }) {
    // Calculate intermediate values fx, fy, fz from L*, a*, b*
    const fy = (l + 16) / 116;
    const fx = a / 500 + fy;
    const fz = fy - b / 200;
    // Apply the inverse non-linear transformation function f^-1
    const f_inv = (t) => Math.pow(t, 3) > EPSILON ? Math.pow(t, 3) : (116 * t - 16) / KAPPA;
    const x_n = f_inv(fx);
    const y_n = l > KAPPA * EPSILON ? Math.pow(fy, 3) : l / KAPPA; // Simpler inverse for y
    const z_n = f_inv(fz);
    // Denormalize to get XYZ values
    const x = x_n * D65_WHITE_POINT.x;
    const y = y_n * D65_WHITE_POINT.y;
    const z = z_n * D65_WHITE_POINT.z;
    return { x, y, z };
}
/**
 * Converts CIE XYZ color space values (D65) to sRGB values (0-255)
 * @param xyz - XYZ color object
 * @returns RGB color object (0-255), rounded
 */
export function xyzToRgb({ x, y, z }) {
    // Apply the standard XYZ to sRGB transformation matrix (D65)
    const R_linear = 3.2404542 * x - 1.5371385 * y - 0.4985314 * z;
    const G_linear = -0.969266 * x + 1.8760108 * y + 0.041556 * z;
    const B_linear = 0.0556434 * x - 0.2040259 * y + 1.707614701 * z;
    // Convert linear RGB to sRGB (0-255)
    const r = linearRgbToSRgbChannel(R_linear);
    const g = linearRgbToSRgbChannel(G_linear);
    const b = linearRgbToSRgbChannel(B_linear);
    return { r, g, b };
}
// --- RGB/HSL Conversions ---
/**
 * Converts an RGB color object to an HSL object
 * @param rgb - RGB color object (0-255)
 * @returns HSL color object { h (0-360), s (0-100), l (0-100) }, rounded
 */
export function rgbToHsl({ r, g, b }) {
    // Normalize RGB values to the range [0, 1]
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0; // Default hue
    let s = 0; // Default saturation
    const l = (max + min) / 2; // Lightness
    if (max !== min) {
        // Calculate saturation and hue only if not achromatic
        const delta = max - min;
        s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
        switch (max) {
            case r:
                h = (g - b) / delta + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / delta + 2;
                break;
            case b:
                h = (r - g) / delta + 4;
                break;
        }
        h /= 6; // Normalize hue to [0, 1]
    }
    return {
        h: Math.round(h * 360), // Scale hue to 0-360 degrees
        s: Math.round(s * 100), // Scale saturation to 0-100%
        l: Math.round(l * 100), // Scale lightness to 0-100%
    };
}
/**
 * Converts an HSL color object to an RGB object
 * @param hsl - HSL color object { h (0-360), s (0-100), l (0-100) }
 * @returns RGB color object { r, g, b } (0-255), rounded
 */
export function hslToRgb({ h, s, l }) {
    // Normalize HSL values
    h = (((h % 360) + 360) % 360) / 360; // Ensure h is in [0, 1)
    s /= 100;
    l /= 100;
    let r, g, b;
    if (s === 0) {
        r = g = b = l; // Achromatic case (gray)
    }
    else {
        // Helper function to convert hue to RGB channel
        const hue2rgb = (p, q, t) => {
            if (t < 0)
                t += 1;
            if (t > 1)
                t -= 1;
            if (t < 1 / 6)
                return p + (q - p) * 6 * t;
            if (t < 1 / 2)
                return q;
            if (t < 2 / 3)
                return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        // Calculate temporary variables p and q
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        // Calculate RGB channels using the hue2rgb helper
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    // Scale RGB channels to [0, 255] and round
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255),
    };
}
// --- RGB/LAB/LCH Conversions ---
/**
 * Converts an RGB color object to a CIE L*a*b* object (D65 illuminant)
 * @param rgb - RGB color object (0-255)
 * @returns LAB color object { l, a, b } with precise (unrounded) values
 */
export function rgbToLab(rgb) {
    const xyz = rgbToXyz(rgb);
    const lab = xyzToLab(xyz);
    return lab;
}
/**
 * Converts a CIE L*a*b* object (D65 illuminant) to an RGB object
 * @param lab - LAB color object { l, a, b }
 * @returns RGB color object { r, g, b } (0-255), rounded and clamped
 */
export function labToRgb(lab) {
    const xyz = labToXyz(lab);
    const rgb = xyzToRgb(xyz);
    return rgb;
}
/**
 * Converts an RGB color object to a CIE LCH object (D65 illuminant)
 * LCH is the cylindrical representation of L*a*b*
 * @param rgb - RGB color object (0-255)
 * @returns LCH color object { l, c, h } with precise values except hue (normalized to [0, 360))
 */
export function rgbToLch(rgb) {
    // Calculate precise LAB values first
    const preciseLab = xyzToLab(rgbToXyz(rgb));
    const { l, a, b } = preciseLab;
    // Calculate Chroma (C*)
    const c = Math.sqrt(a * a + b * b);
    // Calculate Hue (h_ab) in degrees
    let h = Math.atan2(b, a) * (180 / Math.PI);
    // Normalize hue angle to be within [0, 360)
    if (h < 0) {
        h += 360;
    }
    return { l, c, h };
}
/**
 * Converts a CIE LCH object (D65 illuminant) to an RGB object
 * @param lch - LCH color object { l, c, h }
 * @returns RGB color object { r, g, b } (0-255), rounded and clamped
 */
export function lchToRgb({ l, c, h }) {
    // Convert LCH back to LAB
    const rad = (h * Math.PI) / 180; // Convert hue angle to radians
    const a = c * Math.cos(rad);
    const b = c * Math.sin(rad);
    const lab = { l, a, b };
    // Reuse the labToRgb conversion
    return labToRgb(lab);
}
/**
 * Converts CIE L*a*b* color space to LCH color space
 * @param lab - LAB color object
 * @returns LCH color object
 */
export function labToLch({ l, a, b }) {
    // Calculate Chroma (C*)
    const c = Math.sqrt(a * a + b * b);
    // Calculate Hue (h_ab) in degrees
    let h = Math.atan2(b, a) * (180 / Math.PI);
    // Normalize hue angle to be within [0, 360)
    if (h < 0) {
        h += 360;
    }
    return { l, c, h };
}
// --- HSV Conversions ---
/**
 * Converts RGB values to HSV color space
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns HSV color object
 */
export function rgbToHsv(r, g, b) {
    // 1) normalize to [0,1]
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const v = max;
    if (d !== 0) {
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h *= 60;
    }
    return { h, s: s * 100, v: v * 100 };
}
/**
 * Converts HSV values to RGB color space
 * @param h - Hue angle (0-360)
 * @param s - Saturation (0-100)
 * @param v - Value (0-100)
 * @returns RGB color object
 */
export function hsvToRgb(h, s, v) {
    h = ((h % 360) + 360) / 360; // wrap
    s = Math.max(0, Math.min(1, s / 100));
    v = Math.max(0, Math.min(1, v / 100));
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    let r = 0, g = 0, b = 0;
    switch (i % 6) {
        case 0:
            r = v;
            g = t;
            b = p;
            break;
        case 1:
            r = q;
            g = v;
            b = p;
            break;
        case 2:
            r = p;
            g = v;
            b = t;
            break;
        case 3:
            r = p;
            g = q;
            b = v;
            break;
        case 4:
            r = t;
            g = p;
            b = v;
            break;
        case 5:
            r = v;
            g = p;
            b = q;
            break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255),
    };
}
// --- OKLAB/OKLCH Conversions ---
/**
 * Converts RGB values to OKLAB color space
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns OKLAB color object
 */
export function rgbToOklab(r, g, b) {
    // normalize
    let R = r / 255, G = g / 255, B = b / 255;
    // linearize gamma
    [R, G, B] = [R, G, B].map((v) => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    // LMS
    const L_ = 0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B;
    const M_ = 0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B;
    const S_ = 0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B;
    // non-linear
    const l = Math.cbrt(L_);
    const m = Math.cbrt(M_);
    const s = Math.cbrt(S_);
    // OKLab coords
    return {
        L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
        a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
        b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
    };
}
/**
 * Converts OKLAB values to RGB color space
 * @param L - Lightness (0-1)
 * @param a - Green-Red axis
 * @param b - Blue-Yellow axis
 * @returns RGB color object
 */
export function oklabToRgb(L, a, b) {
    // matrix from OKLab → LMSʹ
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.291485548 * b;
    // inv-nonlinear
    const Lp = l_ ** 3;
    const Mp = m_ ** 3;
    const Sp = s_ ** 3;
    // back to linear RGB
    const R = +4.0767416621 * Lp - 3.3077115913 * Mp + 0.2309699292 * Sp;
    const G = -1.2684380046 * Lp + 2.6097574011 * Mp - 0.3413193965 * Sp;
    const B = -0.0041960863 * Lp - 0.7034186147 * Mp + 1.707614701 * Sp;
    // gamma encode + clamp
    const to255 = (v) => {
        v = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
        return Math.round(Math.max(0, Math.min(1, v)) * 255);
    };
    return { r: to255(R), g: to255(G), b: to255(B) };
}
/**
 * Converts OKLAB values to OKLCH color space
 * @param L - Lightness (0-1)
 * @param a - Green-Red axis
 * @param b - Blue-Yellow axis
 * @returns OKLCH color object
 */
export function oklabToOklch(L, a, b) {
    const c = Math.hypot(a, b);
    let h = (Math.atan2(b, a) * 180) / Math.PI;
    if (h < 0)
        h += 360;
    return { L, c, h };
}
/**
 * Converts OKLCH values to OKLAB color space
 * @param L - Lightness (0-1)
 * @param c - Chroma (>= 0)
 * @param h - Hue angle (0-360)
 * @returns OKLAB color object
 */
export function oklchToOklab(L, c, h) {
    const rad = (h * Math.PI) / 180;
    return {
        L,
        a: c * Math.cos(rad),
        b: c * Math.sin(rad),
    };
}
/**
 * Converts OKLCH values to RGB color space
 * @param L - Lightness (0-1)
 * @param c - Chroma (>= 0)
 * @param h - Hue angle (0-360)
 * @returns RGB color object
 */
export function oklchToRgb(L, c, h) {
    const { a, b } = oklchToOklab(L, c, h);
    return oklabToRgb(L, a, b);
}
/**
 * Converts RGB values to OKLCH color space
 * @param rgb - RGB color object
 * @returns OKLCH color object
 */
export function rgbToOklch(rgb) {
    const { L, a, b } = rgbToOklab(rgb.r, rgb.g, rgb.b);
    return oklabToOklch(L, a, b);
}
