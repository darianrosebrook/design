/**
 * @fileoverview Slider primitive component
 * @author @darianrosebrook
 */

import React from "react";
import { defaultTokens as tokens } from "@paths-design/design-tokens";

export interface SliderProps {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  orientation?: "horizontal" | "vertical";
  onChange?: (value: number) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  className?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-valuetext"?: string;
  id?: string;
  name?: string;
  showValue?: boolean;
  formatValue?: (value: number) => string;
}

/**
 * Slider primitive - range input with visual feedback
 *
 * @example
 * ```tsx
 * <Slider
 *   min={0}
 *   max={100}
 *   value={opacity}
 *   onChange={setOpacity}
 *   showValue
 *   formatValue={(v) => `${Math.round(v * 100)}%`}
 *   aria-label="Opacity"
 * />
 * ```
 */
export const Slider: React.FC<SliderProps> = ({
  value,
  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  orientation = "horizontal",
  onChange,
  onFocus,
  onBlur,
  className = "",
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  "aria-valuetext": ariaValueText,
  id,
  name,
  showValue = false,
  formatValue = (v) => String(v),
}) => {
  const [internalValue, setInternalValue] = React.useState(
    value ?? defaultValue ?? min
  );

  // Sync with controlled value prop
  React.useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) {
      return;
    }

    const newValue = Number(e.target.value);
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  const percentage = ((internalValue - min) / (max - min)) * 100;

  const containerStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: tokens.space.md,
    width: "100%",
  };

  const sliderContainerStyles: React.CSSProperties = {
    position: "relative",
    flex: 1,
    height: orientation === "horizontal" ? "20px" : "100px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const trackStyles: React.CSSProperties = {
    position: "absolute",
    backgroundColor: tokens.color.background.secondary,
    borderRadius: tokens.radius.full,
    ...(orientation === "horizontal"
      ? {
          width: "100%",
          height: "4px",
        }
      : {
          height: "100%",
          width: "4px",
        }),
  };

  const progressStyles: React.CSSProperties = {
    position: "absolute",
    backgroundColor: tokens.color.interactive.primary,
    borderRadius: tokens.radius.full,
    transition: "all 0.15s ease-in-out",
    ...(orientation === "horizontal"
      ? {
          width: `${percentage}%`,
          height: "4px",
        }
      : {
          height: `${percentage}%`,
          width: "4px",
        }),
  };

  const thumbStyles: React.CSSProperties = {
    position: "absolute",
    width: "16px",
    height: "16px",
    backgroundColor: tokens.color.background.primary,
    border: `${tokens.borderWidth.md}px solid ${tokens.color.interactive.primary}`,
    borderRadius: tokens.radius.full,
    cursor: disabled ? "not-allowed" : "pointer",
    boxShadow: tokens.shadow.sm,
    transition: "all 0.15s ease-in-out",
    ...(orientation === "horizontal"
      ? {
          left: `${percentage}%`,
          transform: "translateX(-50%)",
        }
      : {
          top: `${percentage}%`,
          transform: "translateY(-50%)",
        }),
  };

  const valueDisplayStyles: React.CSSProperties = {
    fontSize: tokens.type.size.sm,
    color: tokens.color.text.secondary,
    fontWeight: tokens.type.weight.medium,
    minWidth: "40px",
    textAlign: "right",
  };

  return (
    <div
      className={`slider ${orientation} ${
        disabled ? "disabled" : ""
      } ${className}`}
      style={containerStyles}
    >
      <div style={sliderContainerStyles}>
        <div style={trackStyles}>
          <div style={progressStyles} />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={internalValue}
          disabled={disabled}
          onChange={handleChange}
          onFocus={onFocus}
          onBlur={onBlur}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          aria-valuetext={ariaValueText}
          id={id}
          name={name}
          style={{
            position: "absolute",
            width: orientation === "horizontal" ? "100%" : "4px",
            height: orientation === "horizontal" ? "4px" : "100%",
            background: "transparent",
            outline: "none",
            opacity: 0,
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        />
        <div style={thumbStyles} />
      </div>

      {showValue && (
        <div style={valueDisplayStyles}>{formatValue(internalValue)}</div>
      )}
    </div>
  );
};
