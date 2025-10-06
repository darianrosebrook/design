/**
 * @fileoverview Select primitive component
 * @author @darianrosebrook
 */

import React from "react";
import { defaultTokens as tokens } from "../tokens.js";

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  multiple?: boolean;
  size?: "sm" | "md" | "lg";
  onChange?: (value: string | string[]) => void;
  onFocus?: (event: React.FocusEvent<HTMLSelectElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLSelectElement>) => void;
  className?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  id?: string;
  name?: string;
}

/**
 * Select primitive - dropdown selection component
 *
 * @example
 * ```tsx
 * <Select
 *   options={[
 *     { label: "Small", value: "sm" },
 *     { label: "Medium", value: "md" },
 *     { label: "Large", value: "lg" }
 *   ]}
 *   value={size}
 *   onChange={setSize}
 *   placeholder="Select size"
 * />
 * ```
 */
export const Select: React.FC<SelectProps> = ({
  options,
  value,
  placeholder = "Select...",
  disabled = false,
  required = false,
  multiple = false,
  size = "md",
  onChange,
  onFocus,
  onBlur,
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
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.15s ease-in-out",
    outline: "none",
    boxSizing: "border-box" as const,
    minHeight: size === "sm" ? "28px" : size === "md" ? "36px" : "44px",
    padding: `${tokens.space.sm}px ${tokens.space.lg}px ${tokens.space.sm}px ${tokens.space.md}px`,
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

  return (
    <select
      value={value}
      disabled={disabled}
      required={required}
      multiple={multiple}
      onChange={(e) => {
        if (multiple) {
          const selectedOptions = Array.from(
            e.target.selectedOptions,
            (option) => option.value
          );
          onChange?.(selectedOptions);
        } else {
          onChange?.(e.target.value);
        }
      }}
      onFocus={(e) => {
        if (!disabled) {
          Object.assign(e.currentTarget.style, focusStyles);
        }
        onFocus?.(e);
      }}
      onBlur={(e) => {
        if (!disabled) {
          // Reset to base border color
          e.currentTarget.style.borderColor = ariaInvalid
            ? tokens.color.semantic.error
            : tokens.color.border.default;
          e.currentTarget.style.boxShadow = "none";
        }
        onBlur?.(e);
      }}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid}
      id={id}
      name={name}
      className={`select ${size} ${disabled ? "disabled" : ""} ${
        ariaInvalid ? "invalid" : ""
      } ${className}`}
      style={{
        ...baseStyles,
        ...(disabled ? disabledStyles : {}),
        ...(ariaInvalid ? invalidStyles : {}),
      }}
    >
      {placeholder && !multiple && (
        <option value="" disabled={!required}>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          disabled={option.disabled}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
};
