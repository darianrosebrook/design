/**
 * @fileoverview Property editor component for individual properties
 * @author @darianrosebrook
 */

import React, { useState, useCallback } from "react";
import { formatPropertyValue, validatePropertyValue } from "./property-utils";
import type { PropertyEditorProps, PropertyValue } from "./types";

/**
 * Type guard to safely convert unknown to PropertyValue
 */
function isPropertyValue(value: unknown): value is PropertyValue {
  if (value === null || value === undefined) {
    return true;
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.every((item) => typeof item === "string");
  }
  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    // Check for Rect type
    if (
      typeof obj.x === "number" &&
      typeof obj.y === "number" &&
      typeof obj.width === "number" &&
      typeof obj.height === "number"
    ) {
      return true;
    }
    // Check for Color type
    if (
      typeof obj.r === "number" &&
      typeof obj.g === "number" &&
      typeof obj.b === "number" &&
      (obj.a === undefined || typeof obj.a === "number")
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Property editor component that handles different input types
 */
export const PropertyEditor: React.FC<PropertyEditorProps> = ({
  definition,
  value,
  onChange,
  disabled = false,
  className = "",
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [error, setError] = useState<string | null>(null);

  // Update local state when prop value changes
  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleChange = useCallback(
    (newValue: unknown) => {
      if (!isPropertyValue(newValue)) {
        setError("Invalid property value type");
        return;
      }

      setInputValue(newValue);
      setError(null);

      // Validate the value
      const validation = validatePropertyValue(newValue, definition);
      if (!validation.valid && validation.error) {
        setError(validation.error);
        return;
      }

      // Call the onChange callback
      onChange(newValue);
    },
    [definition, onChange]
  );

  const displayValue =
    inputValue != null ? formatPropertyValue(inputValue, definition) : "";

  const renderInput = () => {
    switch (definition.type) {
      case "string":
        return (
          <input
            type="text"
            value={(inputValue as string) || ""}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={definition.placeholder}
            disabled={disabled}
            className={`property-input ${
              definition.multiline ? "multiline" : ""
            }`}
            style={
              definition.multiline
                ? { minHeight: "60px", resize: "vertical" }
                : undefined
            }
          />
        );

      case "number":
        return (
          <div className="number-input-container">
            <input
              type="number"
              value={(inputValue as number) || ""}
              onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
              min={definition.min}
              max={definition.max}
              step={definition.step || 1}
              disabled={disabled}
              className="property-input number-input"
            />
            {definition.category === "typography" &&
              definition.key.includes("size") && (
                <span className="unit-label">px</span>
              )}
          </div>
        );

      case "boolean":
        return (
          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={(inputValue as boolean) || false}
              onChange={(e) => handleChange(e.target.checked)}
              disabled={disabled}
            />
            <span className="checkmark"></span>
          </label>
        );

      case "select":
        return (
          <select
            value={(inputValue as string) || ""}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            className="property-select"
          >
            <option value="">{definition.placeholder || "Select..."}</option>
            {definition.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case "color":
        return (
          <div className="color-input-container">
            <input
              type="color"
              value={typeof inputValue === "string" ? inputValue : "#000000"}
              onChange={(e) => handleChange(e.target.value)}
              disabled={disabled}
              className="color-input"
            />
            <input
              type="text"
              value={displayValue}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="#000000"
              disabled={disabled}
              className="color-text-input"
            />
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={displayValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={definition.placeholder}
            disabled={disabled}
            className="property-input"
          />
        );
    }
  };

  return (
    <div className={`property-editor ${className}`}>
      <div className="property-label">
        <label title={definition.description}>{definition.label}</label>
      </div>
      <div className="property-input-container">
        {renderInput()}
        {error && (
          <div className="property-error" title={error}>
            ⚠️
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * CSS styles for property editors
 */
export const propertyEditorStyles = `
.property-editor {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  min-height: 36px;
}

.property-label {
  flex: 0 0 80px;
  font-size: 12px;
  color: #495057;
  text-align: right;
}

.property-label label {
  cursor: default;
  font-weight: 500;
}

.property-input-container {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.property-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 12px;
  background-color: #ffffff;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.property-input:focus {
  outline: none;
  border-color: #007acc;
  box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
}

.property-input:disabled {
  background-color: #e9ecef;
  color: #6c757d;
  cursor: not-allowed;
}

.property-input.multiline {
  resize: vertical;
  min-height: 60px;
}

.number-input-container {
  position: relative;
  width: 100%;
}

.number-input {
  padding-right: 24px;
}

.unit-label {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  color: #6c757d;
  pointer-events: none;
}

.checkbox-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 12px;
}

.checkbox-container input[type="checkbox"] {
  margin: 0;
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.checkmark {
  position: relative;
  margin-left: 4px;
}

.property-select {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 12px;
  background-color: #ffffff;
  cursor: pointer;
}

.property-select:focus {
  outline: none;
  border-color: #007acc;
  box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
}

.property-select:disabled {
  background-color: #e9ecef;
  color: #6c757d;
  cursor: not-allowed;
}

.color-input-container {
  display: flex;
  gap: 8px;
  width: 100%;
}

.color-input {
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid #ced4da;
  border-radius: 4px;
  cursor: pointer;
}

.color-input::-webkit-color-swatch-wrapper {
  padding: 0;
  border-radius: 3px;
}

.color-input::-webkit-color-swatch {
  border: none;
  border-radius: 3px;
}

.color-text-input {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 12px;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
}

.property-error {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: #dc3545;
  font-size: 14px;
  cursor: help;
}

/* Responsive design */
@media (max-width: 768px) {
  .property-editor {
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
    padding: 12px 16px;
  }

  .property-label {
    flex: none;
    text-align: left;
    font-weight: 600;
  }

  .property-input-container {
    width: 100%;
  }
}
`;
