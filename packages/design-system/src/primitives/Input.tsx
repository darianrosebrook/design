/**
 * @fileoverview Input primitive component
 * @author @darianrosebrook
 */

import React from "react";
import { defaultTokens as tokens } from "../../design-tokens/src/tokens";

export interface InputProps {
  type?: "text" | "number" | "email" | "password" | "tel" | "url" | "search";
  value?: string | number;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  id?: string;
  name?: string;
}

/**
 * Input primitive - foundation for all text input elements
 *
 * @example
 * ```tsx
 * <Input
 *   type="number"
 *   placeholder="Enter a value"
 *   onChange={(e) => setValue(Number(e.target.value))}
 *   aria-label="Input value"
 * />
 * ```
 */
export const Input: React.FC<InputProps> = ({
  type = "text",
  value,
  placeholder,
  disabled = false,
  readOnly = false,
  required = false,
  min,
  max,
  step,
  pattern,
  autoComplete,
  autoFocus,
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  className = "",
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  id,
  name,
}) => {
  const baseStyles = {
    fontFamily: tokens.type.family.sans,
    fontSize: tokens.type.size.sm,
    fontWeight: tokens.type.weight.normal,
    lineHeight: tokens.type.lineHeight.normal,
    color: tokens.color.text.primary,
    backgroundColor: tokens.color.background.primary,
    border: `${tokens.borderWidth.sm}px solid ${tokens.color.border.default}`,
    borderRadius: tokens.radius.md,
    padding: `${tokens.space.sm}px ${tokens.space.md}px`,
    minHeight: "36px",
    width: "100%",
    transition: "all 0.15s ease-in-out",
    outline: "none",
    boxSizing: "border-box" as const,
  };

  const focusStyles = {
    borderColor: tokens.color.interactive.primary,
    boxShadow: `0 0 0 2px ${tokens.color.interactive.primary}40`,
  };

  const disabledStyles = {
    backgroundColor: tokens.color.background.secondary,
    color: tokens.color.text.tertiary,
    cursor: "not-allowed",
    opacity: 0.6,
  };

  const invalidStyles = {
    borderColor: tokens.color.semantic.error,
    boxShadow: `0 0 0 2px ${tokens.color.semantic.error}40`,
  };

  const readOnlyStyles = {
    backgroundColor: tokens.color.background.secondary,
    cursor: "default",
  };

  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      min={min}
      max={max}
      step={step}
      pattern={pattern}
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      onChange={disabled || readOnly ? undefined : onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid}
      id={id}
      name={name}
      className={`input ${disabled ? "disabled" : ""} ${
        readOnly ? "readonly" : ""
      } ${ariaInvalid ? "invalid" : ""} ${className}`}
      style={{
        ...baseStyles,
        ...(disabled ? disabledStyles : {}),
        ...(readOnly ? readOnlyStyles : {}),
        ...(ariaInvalid ? invalidStyles : {}),
      }}
      onFocus={(e) => {
        if (!disabled && !readOnly) {
          Object.assign(e.currentTarget.style, focusStyles);
        }
        onFocus?.(e);
      }}
      onBlur={(e) => {
        if (!disabled && !readOnly) {
          // Reset to base border color
          e.currentTarget.style.borderColor = tokens.color.border.default;
          e.currentTarget.style.boxShadow = "none";
        }
        onBlur?.(e);
      }}
    />
  );
};
