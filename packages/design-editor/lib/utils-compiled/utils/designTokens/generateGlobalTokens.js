#!/usr/bin/env ts-node
/**
 * Global token generator
 * - Reads components/designTokens.json (W3C-like structure with $value and $extensions)
 * - Emits app/designTokens.scss containing:
 *   :root { ... }  // base tokens (light by default)
 *   .light { ... } // explicit light overrides
 *   .dark { ... }  // explicit dark overrides
 *   @media (prefers-color-scheme: dark) { :root { ... } .light { ... } }
 *
 * Component token SCSS already generated via utils/designTokens/generators/generateCSSTokens.mjs
 * This complements it with system-level globals used by components.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// @ts-ignore - CommonJS compatibility for import.meta.url
const __filename = typeof require !== 'undefined' && require.main
    ? require.main.filename
    : fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const TOKENS_PATH = path.join(PROJECT_ROOT, 'components', 'designTokens.json');
const OUTPUT_PATH = path.join(PROJECT_ROOT, 'app', 'designTokens.scss');
// Converts a dot path into a CSS custom property name
function tokenPathToCSSVar(pathStr) {
    return `--${pathStr.replace(/\./g, '-')}`;
}
// Resolve a token node considering $value, $extensions with design.paths.{theme} and viewport scaling
function resolveNode(node, pathStr, opts, tokens, stack = []) {
    // Prevent cycles
    if (stack.includes(pathStr))
        return `var(${tokenPathToCSSVar(pathStr)})`;
    stack.push(pathStr);
    // Extract value or object
    let raw = node;
    if (raw &&
        typeof raw === 'object' &&
        '$value' in raw) {
        raw = raw.$value;
    }
    // Apply $extensions based on theme
    if (typeof node === 'object' && node) {
        const ext = node['$extensions'];
        const themeKey = `design.paths.${opts.theme}`;
        if (ext && typeof ext === 'object' && themeKey in ext) {
            const themed = ext[themeKey];
            if (typeof themed === 'string') {
                raw = themed;
            }
        }
        // Check for viewport scaling extensions (design.paths.scale.heading)
        if (ext && typeof ext === 'object' && 'design.paths.scale.heading' in ext) {
            const scaleConfig = ext['design.paths.scale.heading'];
            if (scaleConfig && typeof scaleConfig === 'object') {
                const vw = scaleConfig.vw;
                const vh = scaleConfig.vh;
                if (vw && vh && '$value' in vw && '$value' in vh) {
                    const vwValue = vw.$value;
                    const vhValue = vh.$value;
                    // Convert the base value to a CSS variable reference if it's a token reference
                    let baseValue = raw;
                    if (typeof baseValue === 'string') {
                        const refPattern = /\{([^}]+)\}/g;
                        baseValue = baseValue.replace(refPattern, (_, refPath) => `var(${tokenPathToCSSVar(refPath)})`);
                    }
                    // Create calc() expression with viewport scaling
                    return `calc(${baseValue} + ${vwValue} + ${vhValue})`;
                }
            }
        }
    }
    // Strings can be references like {semantic.color.background.primary}
    if (typeof raw === 'string') {
        const refPattern = /\{([^}]+)\}/g;
        // If the value contains any references, rewrite them to proper token references
        return raw.replace(refPattern, (_, refPath) => `var(--component-test-path)`);
    }
    // Primitive values
    if (typeof raw === 'number' || typeof raw === 'boolean') {
        return String(raw);
    }
    // Fallback: emit a var reference so components can override later
    return `var(${tokenPathToCSSVar(pathStr)})`;
}
// Walk tokens and produce a flat map of css-var-name -> value for a theme
function buildCssVarMap(tokens, currentPath, opts, out) {
    for (const [key, val] of Object.entries(tokens)) {
        const nextPath = [...currentPath, key];
        const pathStr = nextPath.join('.');
        if (val && typeof val === 'object' && !Array.isArray(val)) {
            const hasValue = '$value' in val;
            const hasChildren = Object.keys(val).some((k) => k !== '$value' &&
                k !== '$type' &&
                k !== '$description' &&
                k !== '$extensions' &&
                k !== '$alias');
            if (hasValue || !hasChildren) {
                const cssVar = tokenPathToCSSVar(pathStr);
                out[cssVar] = resolveNode(val, pathStr, opts, tokens);
            }
            // Recurse regardless to catch nested
            buildCssVarMap(val, nextPath, opts, out);
        }
        else {
            const cssVar = tokenPathToCSSVar(pathStr);
            out[cssVar] = resolveNode(val, pathStr, opts, tokens);
        }
    }
}
function formatBlock(selector, map) {
    const lines = Object.entries(map)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, value]) => `  ${name}: ${value};`)
        .join('\n');
    return `${selector} {\n${lines}\n}`;
}
function generate() {
    const raw = fs.readFileSync(TOKENS_PATH, 'utf8');
    const tokensObj = JSON.parse(raw);
    // Build maps
    const lightMap = {};
    const darkMap = {};
    buildCssVarMap(tokensObj, [], { theme: 'light' }, lightMap);
    buildCssVarMap(tokensObj, [], { theme: 'dark' }, darkMap);
    // Compose output SCSS
    const banner = `/* AUTO-GENERATED: Do not edit directly.\n * Source: components/designTokens.json\n */`;
    const rootBlock = formatBlock(':root', lightMap);
    const lightBlock = formatBlock('.light', lightMap);
    const darkBlock = formatBlock('.dark', darkMap);
    const prefersBlock = `@media (prefers-color-scheme: dark) {\n${formatBlock('  :root', darkMap)}\n${formatBlock('  .light', lightMap)}\n}`;
    const content = [
        banner,
        rootBlock,
        lightBlock,
        darkBlock,
        prefersBlock,
        '',
    ].join('\n\n');
    fs.writeFileSync(OUTPUT_PATH, content, 'utf8');
    console.log(`[tokens] Wrote ${path.relative(PROJECT_ROOT, OUTPUT_PATH)}`);
}
generate();
