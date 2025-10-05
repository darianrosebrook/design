/**
 * @fileoverview Icon primitive component
 * @author @darianrosebrook
 */

import { defaultTokens as tokens } from "../tokens.js";
import React from "react";

export interface IconProps {
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  color?:
    | "primary"
    | "secondary"
    | "tertiary"
    | "inverse"
    | "error"
    | "success"
    | "warning"
    | "info";
  decorative?: boolean;
  className?: string;
  "aria-label"?: string;
  "aria-hidden"?: boolean;
}

/**
 * Icon primitive - icon display component
 *
 * @example
 * ```tsx
 * <Icon name="star" size="md" aria-label="Favorite" />
 * <Icon name="check" size="sm" decorative />
 * ```
 */
export const Icon: React.FC<IconProps> = ({
  name,
  size = "md",
  color = "secondary",
  decorative = false,
  className = "",
  "aria-label": ariaLabel,
  "aria-hidden": ariaHidden,
}) => {
  const sizeStyles = {
    xs: { width: 12, height: 12 },
    sm: { width: 16, height: 16 },
    md: { width: 20, height: 20 },
    lg: { width: 24, height: 24 },
    xl: { width: 32, height: 32 },
    "2xl": { width: 40, height: 40 },
  };

  const colorStyles = {
    primary: tokens.color.text.primary,
    secondary: tokens.color.text.secondary,
    tertiary: tokens.color.text.tertiary,
    inverse: tokens.color.text.inverse,
    error: tokens.color.semantic.error,
    success: tokens.color.semantic.success,
    warning: tokens.color.semantic.warning,
    info: tokens.color.interactive.primary,
  };

  const baseStyles = {
    display: "inline-block",
    width: sizeStyles[size].width,
    height: sizeStyles[size].height,
    color: colorStyles[color],
    flexShrink: 0,
    transition: "color 0.15s ease-in-out",
  };

  // For now, we'll use emoji or text as icon placeholders
  // In a real implementation, this would use an icon library like Heroicons, Lucide, etc.
  const getIconContent = (iconName: string): string => {
    const iconMap: Record<string, string> = {
      // Layout icons
      layout: "📐",
      grid: "⊞",
      columns: "⫿",
      rows: "⫿",

      // Text icons
      text: "📝",
      font: "𝔄",
      type: "Aa",
      "align-left": "⬅",
      "align-center": "⬌",
      "align-right": "➡",

      // Interactive icons
      button: "🔘",
      input: "▭",
      checkbox: "☑",
      radio: "🔘",
      select: "▼",
      toggle: "⏻",

      // Navigation icons
      "arrow-left": "←",
      "arrow-right": "→",
      "arrow-up": "↑",
      "arrow-down": "↓",
      "chevron-left": "‹",
      "chevron-right": "›",
      "chevron-up": "˄",
      "chevron-down": "˅",
      menu: "☰",
      close: "✕",
      expand: "⊕",
      collapse: "⊖",

      // Status icons
      check: "✓",
      cross: "✗",
      warning: "⚠",
      error: "✗",
      info: "ℹ",
      success: "✓",
      loading: "⟲",

      // Object icons
      frame: "▭",
      rectangle: "▭",
      circle: "○",
      image: "🖼",
      vector: "△",

      // Action icons
      edit: "✏",
      delete: "🗑",
      copy: "📋",
      paste: "📋",
      undo: "↺",
      redo: "↻",
      save: "💾",
      download: "⬇",
      upload: "⬆",

      // UI icons
      settings: "⚙",
      search: "🔍",
      filter: "🔽",
      sort: "🔀",
      eye: "👁",
      "eye-off": "🙈",
      lock: "🔒",
      unlock: "🔓",
      star: "⭐",
      heart: "❤️",
      bookmark: "🔖",
      link: "🔗",
      share: "📤",
    };

    return iconMap[iconName] || iconName;
  };

  return (
    <span
      className={`icon ${name} ${size} ${color} ${
        decorative ? "decorative" : ""
      } ${className}`}
      style={baseStyles}
      aria-label={decorative ? undefined : ariaLabel}
      aria-hidden={ariaHidden ?? decorative}
      role={decorative ? "presentation" : undefined}
    >
      {getIconContent(name)}
    </span>
  );
};
