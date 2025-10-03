/**
 * @fileoverview Label primitive component
 * @author @darianrosebrook
 */

import { defaultTokens as tokens } from "@paths-design/design-tokens";
import React from "react";

export interface LabelProps {
  children: React.ReactNode;
  htmlFor?: string;
  size?: "xs" | "sm" | "md" | "lg";
  weight?: "normal" | "medium" | "semibold" | "bold";
  color?:
    | "primary"
    | "secondary"
    | "tertiary"
    | "inverse"
    | "error"
    | "success"
    | "warning";
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}

/**
 * Label primitive - text label component
 *
 * @example
 * ```tsx
 * <Label htmlFor="email-input" required>
 *   Email Address
 * </Label>
 * <Input id="email-input" type="email" />
 * ```
 */
export const Label: React.FC<LabelProps> = ({
  children,
  htmlFor,
  size = "sm",
  weight = "medium",
  color = "primary",
  required = false,
  disabled = false,
  className = "",
  id,
}) => {
  const sizeStyles = {
    xs: {
      fontSize: tokens.type.size.xs,
      lineHeight: tokens.type.lineHeight.tight,
    },
    sm: {
      fontSize: tokens.type.size.sm,
      lineHeight: tokens.type.lineHeight.normal,
    },
    md: {
      fontSize: tokens.type.size.md,
      lineHeight: tokens.type.lineHeight.normal,
    },
    lg: {
      fontSize: tokens.type.size.lg,
      lineHeight: tokens.type.lineHeight.normal,
    },
  };

  const weightStyles = {
    normal: tokens.type.weight.normal,
    medium: tokens.type.weight.medium,
    semibold: tokens.type.weight.semibold,
    bold: tokens.type.weight.bold,
  };

  const colorStyles = {
    primary: tokens.color.text.primary,
    secondary: tokens.color.text.secondary,
    tertiary: tokens.color.text.tertiary,
    inverse: tokens.color.text.inverse,
    error: tokens.color.semantic.error,
    success: tokens.color.semantic.success,
    warning: tokens.color.semantic.warning,
  };

  const baseStyles = {
    fontFamily: tokens.type.family.sans,
    fontSize: sizeStyles[size].fontSize,
    fontWeight: weightStyles[weight],
    lineHeight: sizeStyles[size].lineHeight,
    color: colorStyles[color],
    margin: 0,
    display: "block",
    cursor: disabled ? "not-allowed" : htmlFor ? "pointer" : "default",
    opacity: disabled ? 0.6 : 1,
    transition: "opacity 0.15s ease-in-out",
  };

  return (
    <label
      htmlFor={htmlFor}
      className={`label ${size} ${weight} ${color} ${
        disabled ? "disabled" : ""
      } ${className}`}
      style={baseStyles}
      id={id}
    >
      {children}
      {required && (
        <span
          style={{
            color: tokens.color.semantic.error,
            marginLeft: tokens.space.xs,
            fontSize: "0.8em",
          }}
        >
          *
        </span>
      )}
    </label>
  );
};
