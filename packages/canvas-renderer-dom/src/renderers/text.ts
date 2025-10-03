/**
 * @fileoverview Text node renderer
 * @author @darianrosebrook
 *
 * Renders text nodes with typography styling.
 * Text nodes display string content with rich formatting options.
 */

import type { TextNodeType } from "@paths-design/canvas-schema";
import type { RendererOptions, RenderContext } from "../types.js";
import { RENDERER_CLASSES } from "../types.js";

/**
 * Render a text node to DOM
 *
 * Text nodes support:
 * - Font family, size, weight, style
 * - Text alignment (left, center, right, justify)
 * - Line height and letter spacing
 * - Text color and opacity
 * - Text decoration (underline, strikethrough)
 * - Text overflow behavior (ellipsis, clip)
 *
 * @param node - Text node to render
 * @param options - Renderer configuration options
 * @param context - Render context with document and parent info
 * @returns HTMLElement representing the text
 */
export function renderText(
  node: TextNodeType,
  options: RendererOptions,
  _context: RenderContext
): HTMLElement {
  const element = document.createElement("div");

  // Set CSS classes
  element.classList.add(`${options.classPrefix ?? ""}${RENDERER_CLASSES.TEXT}`);

  // Set text content
  element.textContent = node.text ?? "";

  // Apply visibility
  if (!node.visible) {
    element.style.display = "none";
  }

  // Apply base text styles
  element.style.boxSizing = "border-box";
  element.style.whiteSpace = "pre-wrap"; // Preserve whitespace and line breaks
  element.style.wordWrap = "break-word";

  // Apply typography from textStyle
  if (node.textStyle) {
    applyTypography(element, node.textStyle);
  }

  // Apply text color from textStyle or style fills
  const color = node.textStyle?.color;
  if (color) {
    element.style.color = color;
  } else if (node.style?.fills && node.style.fills.length > 0) {
    applyTextColor(element, node.style.fills);
  }

  // Apply opacity
  if (node.style?.opacity !== undefined && node.style.opacity !== 1) {
    element.style.opacity = node.style.opacity.toString();
  }

  return element;
}

/**
 * Apply typography styles (font, size, weight, alignment, etc.)
 */
function applyTypography(
  element: HTMLElement,
  textStyle: NonNullable<TextNodeType["textStyle"]>
): void {
  // Font family
  if (textStyle.family) {
    element.style.fontFamily = textStyle.family;
  }

  // Font size
  if (textStyle.size !== undefined) {
    element.style.fontSize = `${textStyle.size}px`;
  }

  // Font weight
  if (textStyle.weight !== undefined) {
    element.style.fontWeight = textStyle.weight;
  }

  // Line height
  if (textStyle.lineHeight !== undefined) {
    element.style.lineHeight = `${textStyle.lineHeight}px`;
  }

  // Letter spacing
  if (textStyle.letterSpacing !== undefined) {
    element.style.letterSpacing = `${textStyle.letterSpacing}px`;
  }

  // Color
  if (textStyle.color) {
    element.style.color = textStyle.color;
  }
}

/**
 * Apply text color from fills
 */
function applyTextColor(element: HTMLElement, fills: Array<{ type: string; color?: string; [key: string]: unknown }>): void {
  if (!fills || fills.length === 0) {return;}

  // Handle solid fills for text color
  const solidFills = fills.filter((f) => f.type === "solid");

  if (solidFills.length > 0) {
    const fill = solidFills[0];
    const color = fill.color ?? "#000000";
    const opacity = fill.opacity ?? 1;

    if (opacity !== 1 && color.startsWith("#")) {
      // Convert hex to rgba for opacity
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      element.style.color = `rgba(${r}, ${g}, ${b}, ${opacity})`;
    } else {
      element.style.color = color;
    }
  }

  // TODO: Handle gradient text (background-clip: text)
  const gradientFills = fills.filter((f) => f.type === "gradient");
  if (gradientFills.length > 0) {
    console.warn("Gradient text not yet implemented");
  }
}
