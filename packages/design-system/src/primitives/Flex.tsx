/**
 * @fileoverview Flex primitive component
 * @author @darianrosebrook
 */

import React from "react";
import { defaultTokens as tokens } from "../../design-tokens/src/tokens";

export interface FlexProps {
  children: React.ReactNode;
  direction?: "row" | "row-reverse" | "column" | "column-reverse";
  wrap?: "nowrap" | "wrap" | "wrap-reverse";
  justify?: "start" | "end" | "center" | "between" | "around" | "evenly" | "stretch";
  align?: "start" | "end" | "center" | "stretch" | "baseline";
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Flex primitive - flexible layout container with advanced flexbox controls
 *
 * @example
 * ```tsx
 * <Flex justify="between" align="center" gap="md">
 *   <Box>Left</Box>
 *   <Box>Center</Box>
 *   <Box>Right</Box>
 * </Flex>
 * ```
 */
export const Flex: React.FC<FlexProps> = ({
  children,
  direction = "row",
  wrap = "nowrap",
  justify = "start",
  align = "stretch",
  gap = "none",
  as: Component = "div",
  className = "",
  style = {},
}) => {
  const gapValues = {
    none: 0,
    xs: tokens.space.xs,
    sm: tokens.space.sm,
    md: tokens.space.md,
    lg: tokens.space.lg,
    xl: tokens.space.xl,
  };

  const justifyContentMap = {
    start: "flex-start",
    end: "flex-end",
    center: "center",
    between: "space-between",
    around: "space-around",
    evenly: "space-evenly",
    stretch: "stretch",
  };

  const alignItemsMap = {
    start: "flex-start",
    end: "flex-end",
    center: "center",
    stretch: "stretch",
    baseline: "baseline",
  };

  const containerStyles: React.CSSProperties = {
    display: "flex",
    flexDirection: direction,
    flexWrap: wrap,
    justifyContent: justifyContentMap[justify],
    alignItems: alignItemsMap[align],
    gap: gapValues[gap],
    ...style,
  };

  return (
    <Component
      className={`flex ${direction} ${wrap} ${justify} ${align} ${gap} ${className}`}
      style={containerStyles}
    >
      {children}
    </Component>
  );
};
