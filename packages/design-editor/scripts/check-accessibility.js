#!/usr/bin/env node

/**
 * Design Token Accessibility Checker
 *
 * This script validates design tokens for WCAG 2.1 accessibility compliance.
 * Run with: npm run accessibility
 */

const fs = require("fs");
const path = require("path");

// Simple hex to RGB converter
function hexToRgb(hex) {
  if (!hex || typeof hex !== "string") return null;
  const sanitizedHex = hex.startsWith("#") ? hex.slice(1) : hex;
  if (sanitizedHex.length === 3) {
    const r = parseInt(sanitizedHex[0] + sanitizedHex[0], 16);
    const g = parseInt(sanitizedHex[1] + sanitizedHex[1], 16);
    const b = parseInt(sanitizedHex[2] + sanitizedHex[2], 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) return { r, g, b };
  }
  if (sanitizedHex.length === 6) {
    const r = parseInt(sanitizedHex.substring(0, 2), 16);
    const g = parseInt(sanitizedHex.substring(2, 4), 16);
    const b = parseInt(sanitizedHex.substring(4, 6), 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) return { r, g, b };
  }
  return null;
}

// WCAG relative luminance calculation
function relativeLuminance(rgb) {
  const { r, g, b } = rgb;
  const toLinear = (c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

// Contrast ratio calculation
function contrastRatio(foreground, background) {
  const L1 = relativeLuminance(foreground);
  const L2 = relativeLuminance(background);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

function contrastRatioHex(fgHex, bgHex) {
  const fg = hexToRgb(fgHex);
  const bg = hexToRgb(bgHex);
  if (!fg || !bg) return null;
  return contrastRatio(fg, bg);
}

// Function to resolve token references
function resolveTokenReference(tokenRef, tokens) {
  if (!tokenRef.startsWith("{") || !tokenRef.endsWith("}")) {
    return tokenRef;
  }

  const path = tokenRef.slice(1, -1);
  const parts = path.split(".");

  let current = tokens;
  for (const part of parts) {
    if (current && typeof current === "object") {
      current = current[part];
    } else {
      return null;
    }
  }

  if (current && typeof current === "object" && current.$value) {
    return resolveTokenReference(current.$value, tokens);
  }

  return current;
}

// Validate a single color pair
function validateColorPair(pair) {
  const contrastRatio = contrastRatioHex(pair.foreground, pair.background);
  const requiredRatio = pair.requiredLevel === "AA_NORMAL" ? 4.5 : 3.0;

  if (contrastRatio === null) {
    return {
      isValid: false,
      contrastRatio: 0,
      requiredRatio,
      level: pair.requiredLevel,
      context: pair.context,
      foreground: pair.foreground,
      background: pair.background,
      suggestion: `Invalid color format. Check: ${pair.foreground} / ${pair.background}`,
    };
  }

  const isValid = contrastRatio >= requiredRatio;

  return {
    isValid,
    contrastRatio,
    requiredRatio,
    level: pair.requiredLevel,
    context: pair.context,
    foreground: pair.foreground,
    background: pair.background,
    suggestion: isValid
      ? undefined
      : `Contrast ratio ${contrastRatio.toFixed(
          2
        )} is below required ${requiredRatio}.`,
  };
}

// Main accessibility check function
function checkAccessibility() {
  const tokensPath = path.join(
    __dirname,
    "..",
    "ui",
    "designTokens",
    "designTokens.json"
  );

  console.log("🎨 DESIGN TOKEN ACCESSIBILITY CHECK\n");
  console.log(`🔍 Validating: ${tokensPath}\n`);

  if (!fs.existsSync(tokensPath)) {
    console.error(`❌ Tokens file not found: ${tokensPath}`);
    console.log('💡 Run "npm run tokens:build" first to generate tokens.');
    process.exit(1);
  }

  try {
    const tokens = JSON.parse(fs.readFileSync(tokensPath, "utf8"));

    // Resolve semantic colors
    function resolveSemanticColors(semanticColors) {
      const result = {};

      function resolveObject(obj, currentResult = {}) {
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === "object" && value !== null) {
            if (value.$value) {
              // This is a token - resolve it
              const resolvedValue = resolveTokenReference(value.$value, tokens);
              if (
                resolvedValue &&
                typeof resolvedValue === "string" &&
                /^#[0-9A-Fa-f]{6}$/i.test(resolvedValue)
              ) {
                currentResult[key] = resolvedValue;
              }
            } else {
              // Nested object - recurse
              currentResult[key] = {};
              resolveObject(value, currentResult[key]);
            }
          }
        }
        return currentResult;
      }

      return resolveObject(semanticColors);
    }

    const resolvedColors = resolveSemanticColors(tokens.semantic?.color || {});

    // Test accessibility pairs
    const testPairs = [];

    // Get all available backgrounds and foregrounds
    const backgrounds = resolvedColors.background || {};
    const foregrounds = resolvedColors.foreground || {};
    const borders = resolvedColors.border || {};

    console.log(`📊 Testing comprehensive accessibility coverage:`);
    console.log(`   Backgrounds: ${Object.keys(backgrounds).length}`);
    console.log(`   Foregrounds: ${Object.keys(foregrounds).length}`);
    console.log(`   Borders: ${Object.keys(borders).length}`);

    // 1. Test ALL foreground colors on ALL background colors
    Object.entries(foregrounds).forEach(([fgKey, fgValue]) => {
      if (typeof fgValue === "string" && /^#[0-9A-Fa-f]{6}$/i.test(fgValue)) {
        Object.entries(backgrounds).forEach(([bgKey, bgValue]) => {
          if (
            typeof bgValue === "string" &&
            /^#[0-9A-Fa-f]{6}$/i.test(bgValue)
          ) {
            // Skip problematic combinations:
            // - inverse text on light backgrounds (doesn't make sense)
            // - dark text on inverse background (inherently poor contrast)
            // - inverse text on inverse background (would be redundant)
            const skipCombination =
              (fgKey === "inverse" &&
                ["primary", "secondary", "tertiary", "disabled"].includes(
                  bgKey
                )) ||
              (["primary", "secondary", "tertiary"].includes(fgKey) &&
                bgKey === "inverse") ||
              (fgKey === "inverse" && bgKey === "inverse");

            if (!skipCombination) {
              const isDisabledText = fgKey === "disabled";
              testPairs.push({
                foreground: fgValue,
                background: bgValue,
                context: `${
                  fgKey.charAt(0).toUpperCase() + fgKey.slice(1)
                } text on ${bgKey} background${
                  isDisabledText ? " (exempt from AA)" : ""
                }`,
                requiredLevel: isDisabledText ? "AA_LARGE" : "AA_NORMAL",
              });
            }
          }
        });
      }
    });

    // 2. Test ALL border colors on ALL background colors
    Object.entries(borders).forEach(([borderKey, borderValue]) => {
      if (
        typeof borderValue === "string" &&
        /^#[0-9A-Fa-f]{6}$/i.test(borderValue)
      ) {
        Object.entries(backgrounds).forEach(([bgKey, bgValue]) => {
          if (
            typeof bgValue === "string" &&
            /^#[0-9A-Fa-f]{6}$/i.test(bgValue)
          ) {
            const isDisabledBorder = borderKey === "disabled";
            testPairs.push({
              foreground: borderValue,
              background: bgValue,
              context: `${
                borderKey.charAt(0).toUpperCase() + borderKey.slice(1)
              } border on ${bgKey} background${
                isDisabledBorder ? " (subtle by design)" : ""
              }`,
              requiredLevel: isDisabledBorder ? "AA_NORMAL" : "AA_LARGE", // Disabled borders are intentionally subtle
            });
          }
        });
      }
    });

    // 3. Test feedback colors on backgrounds
    const feedbackForegrounds = resolvedColors.feedback?.foreground || {};
    Object.entries(feedbackForegrounds).forEach(
      ([feedbackKey, feedbackValue]) => {
        if (
          typeof feedbackValue === "string" &&
          /^#[0-9A-Fa-f]{6}$/i.test(feedbackValue)
        ) {
          // Test on primary and secondary backgrounds
          ["primary", "secondary"].forEach((bgKey) => {
            const bgValue = backgrounds[bgKey];
            if (bgValue) {
              testPairs.push({
                foreground: feedbackValue,
                background: bgValue,
                context: `${
                  feedbackKey.charAt(0).toUpperCase() + feedbackKey.slice(1)
                } feedback text on ${bgKey} background`,
                requiredLevel: "AA_NORMAL",
              });
            }
          });
        }
      }
    );

    // 4. Test navigation colors on backgrounds
    const navigationForegrounds = resolvedColors.navigation?.foreground || {};
    Object.entries(navigationForegrounds).forEach(([navKey, navValue]) => {
      if (typeof navValue === "string" && /^#[0-9A-Fa-f]{6}$/i.test(navValue)) {
        // Test on primary background
        const bgValue = backgrounds.primary;
        if (bgValue) {
          testPairs.push({
            foreground: navValue,
            background: bgValue,
            context: `${
              navKey.charAt(0).toUpperCase() + navKey.slice(1)
            } navigation text on primary background`,
            requiredLevel: "AA_NORMAL",
          });
        }
      }
    });

    // 5. Test action colors (keep existing logic for completeness)
    const primaryFg = resolvedColors.action?.foreground?.primary?.default;
    const primaryBg = resolvedColors.action?.background?.primary?.default;
    const secondaryFg = resolvedColors.action?.foreground?.secondary?.default;

    if (primaryFg && primaryBg) {
      // Remove duplicate if already added above
      const alreadyExists = testPairs.some(
        (p) => p.foreground === primaryFg && p.background === primaryBg
      );
      if (!alreadyExists) {
        testPairs.push({
          foreground: primaryFg,
          background: primaryBg,
          context: "Primary action text on primary action background",
          requiredLevel: "AA_NORMAL",
        });
      }
    }

    if (secondaryFg && primaryBg) {
      const alreadyExists = testPairs.some(
        (p) => p.foreground === secondaryFg && p.background === primaryBg
      );
      if (!alreadyExists) {
        testPairs.push({
          foreground: secondaryFg,
          background: primaryBg,
          context: "Secondary action text on primary action background",
          requiredLevel: "AA_NORMAL",
        });
      }
    }

    console.log(`🧪 Testing ${testPairs.length} accessibility pairs:\n`);

    let passCount = 0;
    let failCount = 0;
    let exemptCount = 0;

    testPairs.forEach((pair, index) => {
      const result = validateColorPair(pair);
      let status;
      let isExempt =
        pair.context.includes("exempt from AA") ||
        pair.context.includes("subtle by design");

      if (isExempt) {
        status = result.isValid ? "✅ PASS" : "⚠️  LOW (but exempt)";
        if (!result.isValid) {
          exemptCount++;
        } else {
          passCount++;
        }
      } else {
        status = result.isValid ? "✅ PASS" : "❌ FAIL";
        if (!result.isValid) {
          failCount++;
        } else {
          passCount++;
        }
      }

      console.log(`${index + 1}. ${pair.context}`);
      console.log(`   ${pair.foreground} → ${pair.background}`);
      console.log(
        `   Ratio: ${result.contrastRatio.toFixed(2)} (required: ${
          result.requiredRatio
        }) - ${status}`
      );

      if (!result.isValid && !isExempt) {
        console.log(`   💡 ${result.suggestion}`);
      }
      console.log("");
    });

    console.log("📈 SUMMARY:");
    console.log(`   ✅ Passing: ${passCount}`);
    console.log(`   ⚠️  Low contrast (exempt): ${exemptCount}`);
    console.log(`   ❌ Failing: ${failCount}`);

    if (failCount > 0) {
      console.log(`\n❌ ${failCount} accessibility issue(s) found!`);
      console.log(
        "💡 Fix color combinations to meet WCAG AA standards (4.5:1 contrast ratio)."
      );
      process.exit(1);
    } else {
      console.log(
        "\n✅ All required color pairs pass accessibility requirements!"
      );
      if (exemptCount > 0) {
        console.log(
          `⚠️  ${exemptCount} pair(s) have low contrast but are exempt (disabled states).`
        );
      }
      console.log("🎉 WCAG AA compliant ✓");
    }
  } catch (error) {
    console.error("❌ Error running accessibility check:", error.message);
    process.exit(1);
  }
}

// Run the check
checkAccessibility();
