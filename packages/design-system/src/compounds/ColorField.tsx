/**
 * @fileoverview ColorField compound component
 * @author @darianrosebrook
 */

import { defaultTokens as tokens } from "../tokens.js";
import React from "react";
import { Input } from "../primitives/Input";
import { Label } from "../primitives/Label";

export interface ColorFieldProps {
  label?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  helperText?: string;
  error?: string;
  onChange?: (value: string | undefined) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
  id?: string;
  name?: string;
  showTextInput?: boolean;
}

/**
 * ColorField compound - color input with optional text input
 *
 * @example
 * ```tsx
 * <ColorField
 *   label="Background Color"
 *   value={backgroundColor}
 *   onChange={setBackgroundColor}
 *   helperText="Select a color for the background"
 * />
 * ```
 */
export const ColorField: React.FC<ColorFieldProps> = ({
  label,
  value,
  defaultValue,
  placeholder = "#000000",
  disabled = false,
  required = false,
  helperText,
  error,
  onChange,
  onFocus,
  onBlur,
  className = "",
  id,
  name,
  showTextInput = true,
}) => {
  const [internalValue, setInternalValue] = React.useState(
    value ?? defaultValue ?? ""
  );

  // Sync with controlled value prop
  React.useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  const fieldId =
    id || `color-field-${Math.random().toString(36).substr(2, 9)}`;
  const helperId = `${fieldId}-helper`;
  const errorId = `${fieldId}-error`;

  const hasError = Boolean(error);
  const showHelper = Boolean(helperText);

  return (
    <div className={`color-field ${className}`}>
      {label && (
        <Label htmlFor={fieldId} required={required} disabled={disabled}>
          {label}
        </Label>
      )}

      <div
        style={{
          display: "flex",
          gap: tokens.space.sm,
          alignItems: "center",
        }}
      >
        <input
          type="color"
          value={internalValue || "#000000"}
          disabled={disabled}
          onChange={handleColorChange}
          onFocus={onFocus}
          onBlur={onBlur}
          style={{
            width: "40px",
            height: "40px",
            border: `${tokens.borderWidth.sm}px solid ${
              hasError
                ? tokens.color.semantic.error
                : tokens.color.border.default
            }`,
            borderRadius: tokens.radius.md,
            cursor: disabled ? "not-allowed" : "pointer",
            backgroundColor: "transparent",
            padding: 0,
          }}
          aria-label={label ? `${label} color picker` : "Color picker"}
          aria-describedby={
            [showHelper ? helperId : "", hasError ? errorId : ""]
              .filter(Boolean)
              .join(" ") || undefined
          }
          aria-invalid={hasError}
        />

        {showTextInput && (
          <Input
            id={fieldId}
            name={name}
            type="text"
            value={internalValue}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            onChange={handleTextChange}
            onFocus={onFocus}
            onBlur={onBlur}
            aria-describedby={
              [showHelper ? helperId : "", hasError ? errorId : ""]
                .filter(Boolean)
                .join(" ") || undefined
            }
            aria-invalid={hasError}
            style={{
              flex: 1,
              fontFamily: tokens.type.family.mono,
            }}
          />
        )}
      </div>

      {showHelper && !hasError && (
        <div
          id={helperId}
          style={{
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
          role="alert"
          style={{
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
