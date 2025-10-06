/**
 * @fileoverview Checkbox primitive component
 * @author @darianrosebrook
 */

import React from "react";
import { defaultTokens as tokens } from "../tokens.js";

export interface CheckboxProps {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  required?: boolean;
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  className?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  id?: string;
  name?: string;
  value?: string;
}

/**
 * Checkbox primitive - boolean input component
 *
 * @example
 * ```tsx
 * <Checkbox
 *   checked={isEnabled}
 *   onChange={setIsEnabled}
 *   aria-label="Enable feature"
 * />
 * ```
 */
export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  defaultChecked,
  disabled = false,
  required = false,
  indeterminate = false,
  onChange,
  onFocus,
  onBlur,
  className = "",
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  id,
  name,
  value,
}) => {
  const [internalChecked, setInternalChecked] = React.useState(
    defaultChecked ?? checked ?? false
  );

  // Sync with controlled checked prop
  React.useEffect(() => {
    if (checked !== undefined) {
      setInternalChecked(checked);
    }
  }, [checked]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) {
      return;
    }

    const newChecked = e.target.checked;
    if (checked === undefined) {
      setInternalChecked(newChecked);
    }
    onChange?.(newChecked);
  };

  const checkboxRef = React.useRef<HTMLInputElement>(null);

  // Handle indeterminate state
  React.useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const baseStyles = {
    width: "16px",
    height: "16px",
    border: `${tokens.borderWidth.sm}px solid ${tokens.color.border.default}`,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.color.background.primary,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.15s ease-in-out",
    appearance: "none" as const,
    position: "relative" as const,
  };

  const checkedStyles = {
    backgroundColor: tokens.color.interactive.primary,
    borderColor: tokens.color.interactive.primary,
  };

  const disabledStyles = {
    backgroundColor: tokens.color.background.secondary,
    borderColor: tokens.color.border.subtle,
    cursor: "not-allowed",
    opacity: 0.6,
  };

  const invalidStyles = {
    borderColor: tokens.color.semantic.error,
    boxShadow: `0 0 0 2px ${tokens.color.semantic.error}40`,
  };

  const focusStyles = {
    boxShadow: `0 0 0 2px ${tokens.color.interactive.primary}40`,
  };

  return (
    <input
      ref={checkboxRef}
      type="checkbox"
      checked={checked !== undefined ? checked : internalChecked}
      disabled={disabled}
      required={required}
      onChange={handleChange}
      onFocus={(e) => {
        if (!disabled) {
          Object.assign(e.currentTarget.style, focusStyles);
        }
        onFocus?.(e);
      }}
      onBlur={(e) => {
        if (!disabled) {
          // Reset focus styles
          e.currentTarget.style.boxShadow = ariaInvalid
            ? `0 0 0 2px ${tokens.color.semantic.error}40`
            : "none";
        }
        onBlur?.(e);
      }}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid}
      id={id}
      name={name}
      value={value}
      className={`checkbox ${disabled ? "disabled" : ""} ${
        ariaInvalid ? "invalid" : ""
      } ${className}`}
      style={{
        ...baseStyles,
        ...((checked !== undefined ? checked : internalChecked)
          ? checkedStyles
          : {}),
        ...(disabled ? disabledStyles : {}),
        ...(ariaInvalid ? invalidStyles : {}),
      }}
      // Custom checkbox appearance
      onMouseEnter={(e) => {
        if (!disabled && !(checked !== undefined ? checked : internalChecked)) {
          e.currentTarget.style.borderColor = tokens.color.border.strong;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !(checked !== undefined ? checked : internalChecked)) {
          e.currentTarget.style.borderColor = tokens.color.border.default;
        }
      }}
    />
  );
};
