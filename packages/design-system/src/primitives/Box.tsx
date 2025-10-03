/**
 * @fileoverview Box primitive component
 * @author @darianrosebrook
 */

import React from "react";
import { defaultTokens as tokens } from "@paths-design/design-tokens";

export interface BoxProps {
  children?: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
  padding?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  margin?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  backgroundColor?:
    | "primary"
    | "secondary"
    | "tertiary"
    | "surface"
    | "elevated"
    | "transparent";
  borderRadius?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  border?: "none" | "subtle" | "default" | "strong";
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
  width?: string | number;
  height?: string | number;
  minWidth?: string | number;
  minHeight?: string | number;
  maxWidth?: string | number;
  maxHeight?: string | number;
  display?:
    | "block"
    | "inline-block"
    | "flex"
    | "inline-flex"
    | "grid"
    | "inline-grid";
  position?: "static" | "relative" | "absolute" | "fixed" | "sticky";
  className?: string;
  style?: React.CSSProperties;
  onClick?: (event: React.MouseEvent) => void;
  onMouseEnter?: (event: React.MouseEvent) => void;
  onMouseLeave?: (event: React.MouseEvent) => void;
  role?: string;
  "aria-label"?: string;
}

/**
 * Box primitive - foundational layout container
 *
 * @example
 * ```tsx
 * <Box padding="md" backgroundColor="surface" borderRadius="md">
 *   <Text>Content</Text>
 * </Box>
 * ```
 */
export const Box: React.FC<BoxProps> = ({
  children,
  as: Component = "div",
  padding = "none",
  margin = "none",
  backgroundColor = "transparent",
  borderRadius = "none",
  border = "none",
  shadow = "none",
  width,
  height,
  minWidth,
  minHeight,
  maxWidth,
  maxHeight,
  display,
  position,
  className = "",
  style = {},
  onClick,
  onMouseEnter,
  onMouseLeave,
  role,
  "aria-label": ariaLabel,
}) => {
  const paddingValues = {
    none: 0,
    xs: tokens.space.xs,
    sm: tokens.space.sm,
    md: tokens.space.md,
    lg: tokens.space.lg,
    xl: tokens.space.xl,
  };

  const marginValues = {
    none: 0,
    xs: tokens.space.xs,
    sm: tokens.space.sm,
    md: tokens.space.md,
    lg: tokens.space.lg,
    xl: tokens.space.xl,
  };

  const backgroundColorValues = {
    primary: tokens.color.background.primary,
    secondary: tokens.color.background.secondary,
    tertiary: tokens.color.background.tertiary,
    surface: tokens.color.background.surface,
    elevated: tokens.color.background.elevated,
    transparent: "transparent",
  };

  const borderRadiusValues = {
    none: tokens.radius.none,
    sm: tokens.radius.sm,
    md: tokens.radius.md,
    lg: tokens.radius.lg,
    xl: tokens.radius.xl,
    full: tokens.radius.full,
  };

  const borderValues = {
    none: "none",
    subtle: `${tokens.borderWidth.sm}px solid ${tokens.color.border.subtle}`,
    default: `${tokens.borderWidth.sm}px solid ${tokens.color.border.default}`,
    strong: `${tokens.borderWidth.md}px solid ${tokens.color.border.strong}`,
  };

  const shadowValues = {
    none: "none",
    sm: tokens.shadow.sm,
    md: tokens.shadow.md,
    lg: tokens.shadow.lg,
    xl: tokens.shadow.xl,
  };

  const baseStyles: React.CSSProperties = {
    padding: paddingValues[padding],
    margin: marginValues[margin],
    backgroundColor: backgroundColorValues[backgroundColor],
    borderRadius: borderRadiusValues[borderRadius],
    border: borderValues[border],
    boxShadow: shadowValues[shadow],
    width,
    height,
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
    display,
    position,
    transition: "all 0.15s ease-in-out",
    ...style,
  };

  return (
    <Component
      className={`box ${className}`}
      style={baseStyles}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role={role}
      aria-label={ariaLabel}
    >
      {children}
    </Component>
  );
};
