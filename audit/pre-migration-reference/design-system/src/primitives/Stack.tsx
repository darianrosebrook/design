/**
 * @fileoverview Stack primitive component
 * @author @darianrosebrook
 */

import { defaultTokens as tokens } from "../tokens.js";
import React from "react";
import { Box } from "./Box";

export interface StackProps {
  children: React.ReactNode;
  direction?: "vertical" | "horizontal";
  spacing?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  wrap?: boolean;
  wrapChildren?: boolean;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Stack primitive - layout component for stacking items vertically or horizontally
 *
 * @example
 * ```tsx
 * <Stack direction="vertical" spacing="md" align="center">
 *   <Box>Item 1</Box>
 *   <Box>Item 2</Box>
 *   <Box>Item 3</Box>
 * </Stack>
 * ```
 */
export const Stack: React.FC<StackProps> = ({
  children,
  direction = "vertical",
  spacing = "md",
  align = "stretch",
  justify = "start",
  wrap = false,
  wrapChildren = false,
  as: Component = "div",
  className = "",
  style = {},
}) => {
  const spacingValues = {
    none: 0,
    xs: tokens.space.xs,
    sm: tokens.space.sm,
    md: tokens.space.md,
    lg: tokens.space.lg,
    xl: tokens.space.xl,
  };

  const isVertical = direction === "vertical";

  const containerStyles: React.CSSProperties = {
    display: "flex",
    flexDirection: isVertical ? "column" : "row",
    alignItems: align === "stretch" ? "stretch" : align,
    justifyContent: justify,
    flexWrap: wrap ? "wrap" : "nowrap",
    gap: spacingValues[spacing],
    ...style,
  };

  const childrenArray = React.Children.toArray(children);

  let finalChildren;
  if (wrapChildren) {
    finalChildren = childrenArray.map((child, index) => (
      <Box key={index} style={{ flexShrink: 0 }}>
        {child}
      </Box>
    ));
  } else {
    finalChildren = childrenArray;
  }

  return (
    <Component
      className={`stack ${direction} ${spacing} ${align} ${justify} ${
        wrap ? "wrap" : "nowrap"
      } ${className}`}
      style={containerStyles}
    >
      {finalChildren}
    </Component>
  );
};
