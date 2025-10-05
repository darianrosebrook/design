/**
 * @fileoverview TextField compound component
 * @author @darianrosebrook
 */

import { defaultTokens as tokens } from "../tokens.js";
import React from "react";
import { Input } from "../primitives/Input";

export interface TextFieldProps {
  label?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  value?: string | number;
  placeholder?: string;
  type?: "text" | "number" | "email" | "password" | "tel" | "url" | "search";
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  onChange?: (value: string | number) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
  id?: string;
  name?: string;
}

/**
 * TextField compound - input with label and error messaging
 *
 * @example
 * ```tsx
 * <TextField
 *   label="Email Address"
 *   type="email"
 *   value={email}
 *   onChange={setEmail}
 *   helperText="We'll never share your email"
 *   required
 * />
 * ```
 */
export const TextField: React.FC<TextFieldProps> = ({
  label,
  helperText,
  error,
  required = false,
  disabled = false,
  readOnly = false,
  value,
  placeholder,
  type = "text",
  min,
  max,
  step,
  pattern,
  autoComplete,
  autoFocus,
  onChange,
  onFocus,
  onBlur,
  className = "",
  id,
  name,
}) => {
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;
  const helperId = `${fieldId}-helper`;
  const errorId = `${fieldId}-error`;

  const hasError = Boolean(error);
  const showHelper = Boolean(helperText);

  return (
    <div className={`text-field ${className}`}>
      {label && (
        <label
          htmlFor={fieldId}
          className="field-label"
          style={{
            fontFamily: tokens.type.family.sans,
            fontSize: tokens.type.size.sm,
            fontWeight: tokens.type.weight.medium,
            color: tokens.color.text.primary,
            marginBottom: tokens.space.xs,
            display: "block",
          }}
        >
          {label}
          {required && (
            <span
              style={{
                color: tokens.color.semantic.error,
                marginLeft: tokens.space.xs,
              }}
            >
              *
            </span>
          )}
        </label>
      )}

      <Input
        id={fieldId}
        name={name}
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
        onChange={(e) => {
          const newValue =
            type === "number" ? Number(e.target.value) : e.target.value;
          onChange?.(newValue);
        }}
        onFocus={onFocus}
        onBlur={onBlur}
        aria-describedby={
          [showHelper ? helperId : "", hasError ? errorId : ""]
            .filter(Boolean)
            .join(" ") || undefined
        }
        aria-invalid={hasError}
        className="field-input"
      />

      {showHelper && !hasError && (
        <div
          id={helperId}
          className="field-helper"
          style={{
            fontFamily: tokens.type.family.sans,
            fontSize: tokens.type.size.xs,
            color: tokens.color.text.secondary,
            marginTop: tokens.space.xs,
          }}
        >
          {helperText}
        </div>
      )}

      {hasError && (
        <div
          id={errorId}
          className="field-error"
          role="alert"
          style={{
            fontFamily: tokens.type.family.sans,
            fontSize: tokens.type.size.xs,
            color: tokens.color.semantic.error,
            marginTop: tokens.space.xs,
            display: "flex",
            alignItems: "center",
            gap: tokens.space.xs,
          }}
        >
          <span>⚠️</span>
          {error}
        </div>
      )}
    </div>
  );
};
