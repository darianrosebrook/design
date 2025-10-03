/**
 * @fileoverview Button primitive component
 * @author @darianrosebrook
 */

import { defaultTokens as tokens } from "@paths-design/design-tokens";
import React from "react";

export interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "destructive";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit" | "reset";
  className?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
}

/**
 * Button primitive - the foundation for all interactive elements
 *
 * @example
 * ```tsx
 * <Button onClick={handleClick} variant="primary">
 *   Save Changes
 * </Button>
 * ```
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  onClick,
  type = "button",
  className = "",
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
}) => {
  const baseStyles = {
    fontFamily: tokens.type.family.sans,
    fontSize: tokens.type.size.sm,
    fontWeight: tokens.type.weight.medium,
    lineHeight: tokens.type.lineHeight.normal,
    borderRadius: tokens.radius.md,
    border: `${tokens.borderWidth.sm}px solid transparent`,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.15s ease-in-out",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.space.sm,
    textDecoration: "none",
    outline: "none",
    position: "relative" as const,
  };

  const sizeStyles = {
    sm: {
      padding: `${tokens.space.xs}px ${tokens.space.sm}px`,
      minHeight: "28px",
      fontSize: tokens.type.size.xs,
    },
    md: {
      padding: `${tokens.space.sm}px ${tokens.space.md}px`,
      minHeight: "36px",
      fontSize: tokens.type.size.sm,
    },
    lg: {
      padding: `${tokens.space.md}px ${tokens.space.lg}px`,
      minHeight: "44px",
      fontSize: tokens.type.size.md,
    },
  };

  const variantStyles = {
    primary: {
      backgroundColor: tokens.color.interactive.primary,
      color: tokens.color.text.inverse,
      borderColor: tokens.color.interactive.primary,
    },
    primaryHover: {
      backgroundColor: tokens.color.interactive.primaryHover,
      borderColor: tokens.color.interactive.primaryHover,
    },
    primaryPressed: {
      backgroundColor: tokens.color.interactive.primaryPressed,
      borderColor: tokens.color.interactive.primaryPressed,
    },
    secondary: {
      backgroundColor: "transparent",
      color: tokens.color.text.primary,
      borderColor: tokens.color.border.default,
    },
    secondaryHover: {
      backgroundColor: tokens.color.background.secondary,
      borderColor: tokens.color.border.strong,
    },
    secondaryPressed: {
      backgroundColor: tokens.color.background.tertiary,
      borderColor: tokens.color.border.strong,
    },
    destructive: {
      backgroundColor: tokens.color.interactive.destructive,
      color: tokens.color.text.inverse,
      borderColor: tokens.color.interactive.destructive,
    },
    destructiveHover: {
      backgroundColor: tokens.color.interactive.destructiveHover,
      borderColor: tokens.color.interactive.destructiveHover,
    },
    destructivePressed: {
      backgroundColor: tokens.color.interactive.destructivePressed,
      borderColor: tokens.color.interactive.destructivePressed,
    },
  };

  const disabledStyles = {
    opacity: 0.6,
    cursor: "not-allowed",
    pointerEvents: "none" as const,
  };

  const currentVariant = variantStyles[variant];
  const currentSize = sizeStyles[size];

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      className={`button ${variant} ${size} ${
        disabled ? "disabled" : ""
      } ${className}`}
      style={{
        ...baseStyles,
        ...currentSize,
        ...currentVariant,
        ...(disabled ? disabledStyles : {}),
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          const hoverVariant = `${variant}Hover` as keyof typeof variantStyles;
          if (variantStyles[hoverVariant]) {
            Object.assign(e.currentTarget.style, variantStyles[hoverVariant]);
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          Object.assign(e.currentTarget.style, currentVariant);
        }
      }}
      onMouseDown={(e) => {
        if (!disabled) {
          const pressedVariant =
            `${variant}Pressed` as keyof typeof variantStyles;
          if (variantStyles[pressedVariant]) {
            Object.assign(e.currentTarget.style, variantStyles[pressedVariant]);
          }
        }
      }}
      onMouseUp={(e) => {
        if (!disabled) {
          Object.assign(e.currentTarget.style, currentVariant);
        }
      }}
      onFocus={(e) => {
        if (!disabled) {
          // Add focus ring
          e.currentTarget.style.boxShadow = `0 0 0 2px ${tokens.color.interactive.primary}40`;
        }
      }}
      onBlur={(e) => {
        if (!disabled) {
          // Remove focus ring
          e.currentTarget.style.boxShadow = "none";
        }
      }}
    >
      {children}
    </button>
  );
};
