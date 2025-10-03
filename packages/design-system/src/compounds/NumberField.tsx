/**
 * @fileoverview NumberField compound component
 * @author @darianrosebrook
 */

import { defaultTokens as tokens } from "@paths-design/design-tokens";
import React from "react";
import { Input } from "../primitives/Input";
import { Label } from "../primitives/Label";

export interface NumberFieldProps {
  label?: string;
  value?: number;
  defaultValue?: number;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  disabled?: boolean;
  required?: boolean;
  helperText?: string;
  error?: string;
  onChange?: (value: number | undefined) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
  id?: string;
  name?: string;
  showValue?: boolean;
}

/**
 * NumberField compound - numeric input with label and validation
 *
 * @example
 * ```tsx
 * <NumberField
 *   label="Width"
 *   value={width}
 *   onChange={setWidth}
 *   min={0}
 *   max={1000}
 *   step={1}
 *   helperText="Enter width in pixels"
 * />
 * ```
 */
export const NumberField: React.FC<NumberFieldProps> = ({
  label,
  value,
  defaultValue,
  placeholder = "0",
  min,
  max,
  step = 1,
  precision,
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
  showValue = false,
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numericValue = inputValue === "" ? undefined : Number(inputValue);

    if (inputValue === "") {
      if (value === undefined) {
        setInternalValue("");
      }
      onChange?.(undefined);
      return;
    }

    if (isNaN(numericValue!)) {
      return; // Invalid input, don't update
    }

    // Apply constraints
    let constrainedValue = numericValue;
    if (constrainedValue !== undefined) {
      if (min !== undefined && constrainedValue < min) {
        constrainedValue = min;
      }
      if (max !== undefined && constrainedValue > max) {
        constrainedValue = max;
      }
    }

    if (value === undefined && constrainedValue !== undefined) {
      setInternalValue(constrainedValue);
    }
    if (constrainedValue !== undefined) {
      onChange?.(constrainedValue);
    }
  };

  const fieldId =
    id || `number-field-${Math.random().toString(36).substr(2, 9)}`;
  const helperId = `${fieldId}-helper`;
  const errorId = `${fieldId}-error`;

  const hasError = Boolean(error);
  const showHelper = Boolean(helperText);

  const displayValue = internalValue !== "" ? String(internalValue) : "";

  return (
    <div className={`number-field ${className}`}>
      {label && (
        <Label htmlFor={fieldId} required={required} disabled={disabled}>
          {label}
        </Label>
      )}

      <div style={{ position: "relative" }}>
        <Input
          id={fieldId}
          name={name}
          type="number"
          value={displayValue}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          min={min}
          max={max}
          step={step}
          onChange={handleChange}
          onFocus={onFocus}
          onBlur={onBlur}
          aria-describedby={
            [showHelper ? helperId : "", hasError ? errorId : ""]
              .filter(Boolean)
              .join(" ") || undefined
          }
          aria-invalid={hasError}
          style={{
            paddingRight: showValue ? "60px" : undefined,
          }}
        />

        {showValue && internalValue !== "" && (
          <div
            style={{
              position: "absolute",
              right: tokens.space.md,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: tokens.type.size.xs,
              color: tokens.color.text.secondary,
              pointerEvents: "none",
            }}
          >
            {precision !== undefined
              ? Number(internalValue).toFixed(precision)
              : internalValue}
          </div>
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
