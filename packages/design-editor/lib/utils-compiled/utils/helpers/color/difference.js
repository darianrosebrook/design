/**
 * Color difference calculation utilities
 *
 * This module provides functions for calculating perceptual color differences
 * using CIE standards (ΔE76, ΔE2000).
 *
 * @author @darianrosebrook
 */
/**
 * CIE76 color difference (ΔE*ab 1976) between two LAB colors
 * This is the simplest and fastest color difference formula
 * @param lab1 - First LAB color
 * @param lab2 - Second LAB color
 * @returns Color difference value (ΔE)
 */
export function deltaE76(lab1, lab2) {
    const dl = lab1.l - lab2.l;
    const da = lab1.a - lab2.a;
    const db = lab1.b - lab2.b;
    return Math.sqrt(dl * dl + da * da + db * db);
}
/**
 * CIEDE2000 color difference (ΔE00) between two LAB colors
 * This is the most accurate perceptual color difference formula
 * Implementation follows Sharma et al. (2005)
 * @param lab1 - First LAB color
 * @param lab2 - Second LAB color
 * @returns Color difference value (ΔE00)
 */
export function deltaE2000(lab1, lab2) {
    const { l: L1, a: a1, b: b1 } = lab1;
    const { l: L2, a: a2, b: b2 } = lab2;
    const kL = 1, kC = 1, kH = 1;
    const C1 = Math.hypot(a1, b1);
    const C2 = Math.hypot(a2, b2);
    const Cbar = (C1 + C2) / 2;
    const G = 0.5 *
        (1 - Math.sqrt(Math.pow(Cbar, 7) / (Math.pow(Cbar, 7) + Math.pow(25, 7))));
    const a1p = (1 + G) * a1;
    const a2p = (1 + G) * a2;
    const C1p = Math.hypot(a1p, b1);
    const C2p = Math.hypot(a2p, b2);
    const h1p = (Math.atan2(b1, a1p) * 180) / Math.PI + (Math.atan2(b1, a1p) < 0 ? 360 : 0);
    const h2p = (Math.atan2(b2, a2p) * 180) / Math.PI + (Math.atan2(b2, a2p) < 0 ? 360 : 0);
    const dLp = L2 - L1;
    const dCp = C2p - C1p;
    let dhp = 0;
    if (C1p * C2p !== 0) {
        if (Math.abs(h2p - h1p) <= 180)
            dhp = h2p - h1p;
        else
            dhp = h2p <= h1p ? h2p - h1p + 360 : h2p - h1p - 360;
    }
    const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp * Math.PI) / 180 / 2);
    const Lbarp = (L1 + L2) / 2;
    const Cbarp = (C1p + C2p) / 2;
    let hbarp = 0;
    if (C1p * C2p === 0)
        hbarp = h1p + h2p;
    else if (Math.abs(h1p - h2p) <= 180)
        hbarp = (h1p + h2p) / 2;
    else
        hbarp =
            ((h1p + h2p + 360) / 2) * (h1p + h2p < 360 ? 1 : 0) +
                ((h1p + h2p - 360) / 2) * (h1p + h2p >= 360 ? 1 : 0);
    const T = 1 -
        0.17 * Math.cos(((hbarp - 30) * Math.PI) / 180) +
        0.24 * Math.cos((2 * hbarp * Math.PI) / 180) +
        0.32 * Math.cos(((3 * hbarp + 6) * Math.PI) / 180) -
        0.2 * Math.cos(((4 * hbarp - 63) * Math.PI) / 180);
    const Sl = 1 +
        (0.015 * (Lbarp - 50) * (Lbarp - 50)) /
            Math.sqrt(20 + (Lbarp - 50) * (Lbarp - 50));
    const Sc = 1 + 0.045 * Cbarp;
    const Sh = 1 + 0.015 * Cbarp * T;
    const deltaTheta = 30 * Math.exp(-((hbarp - 275) / 25) * ((hbarp - 275) / 25));
    const Rc = 2 * Math.sqrt(Math.pow(Cbarp, 7) / (Math.pow(Cbarp, 7) + Math.pow(25, 7)));
    const Rt = -Rc * Math.sin((2 * deltaTheta * Math.PI) / 180);
    const dE = Math.sqrt(Math.pow(dLp / (kL * Sl), 2) +
        Math.pow(dCp / (kC * Sc), 2) +
        Math.pow(dHp / (kH * Sh), 2) +
        Rt * (dCp / (kC * Sc)) * (dHp / (kH * Sh)));
    return dE;
}
/**
 * Determines if two colors are perceptually similar within a threshold
 * @param lab1 - First LAB color
 * @param lab2 - Second LAB color
 * @param threshold - Maximum acceptable difference (default: 1.0)
 * @param method - Color difference method ('76' or '2000')
 * @returns True if colors are within threshold
 */
export function colorsAreSimilar(lab1, lab2, threshold = 1.0, method = "2000") {
    const difference = method === "76" ? deltaE76(lab1, lab2) : deltaE2000(lab1, lab2);
    return difference <= threshold;
}
/**
 * Gets a qualitative description of color difference
 * @param difference - Color difference value (ΔE)
 * @param method - Method used ('76' or '2000')
 * @returns Qualitative description
 */
export function describeColorDifference(difference, method = "2000") {
    if (method === "76") {
        // CIE76 thresholds
        if (difference < 1)
            return "Not perceptible by human eyes";
        if (difference < 2)
            return "Perceptible through close observation";
        if (difference < 3.5)
            return "Perceptible at a glance";
        if (difference < 5)
            return "More similar than opposite";
        if (difference < 7)
            return "Noticeably different";
        return "Colors are different";
    }
    else {
        // CIEDE2000 thresholds (generally more forgiving)
        if (difference < 0.8)
            return "Not perceptible by human eyes";
        if (difference < 1.5)
            return "Perceptible through close observation";
        if (difference < 3)
            return "Perceptible at a glance";
        if (difference < 6)
            return "More similar than opposite";
        if (difference < 12)
            return "Noticeably different";
        return "Colors are different";
    }
}
