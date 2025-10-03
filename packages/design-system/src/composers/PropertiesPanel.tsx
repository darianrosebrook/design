/**
 * @fileoverview PropertiesPanel composer component
 * @author @darianrosebrook
 */

import React, { useMemo } from "react";
import { PropertyRegistry } from "../../../properties-panel/src/property-registry";
import type {
  PropertiesPanelProps,
  PropertySectionProps,
  // PropertySection, // TODO: Remove if not needed
  PropertyValue,
} from "../../../properties-panel/src/types";
import { defaultTokens as tokens } from "../../design-tokens/src/tokens";
// import { TextField } from "../compounds/TextField"; // TODO: Remove if not needed
import { Button } from "../primitives/Button";

/**
 * PropertiesPanel composer - orchestrates property editing for design elements
 *
 * This is a composer component that:
 * - Manages property sections and their state
 * - Handles property value synchronization
 * - Provides the main interface for design property editing
 *
 * @example
 * ```tsx
 * <PropertiesPanel
 *   selection={{ selectedNodeIds: ['frame-1'], focusedNodeId: 'frame-1' }}
 *   onPropertyChange={(event) => {
 *     // Handle property changes
 *     console.log('Property changed:', event);
 *   }}
 * />
 * ```
 */
export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  _documentId,
  selection,
  onPropertyChange,
  _onSelectionChange,
  className = "",
  style = {},
}) => {
  // Get applicable sections for the current selection
  const sections = useMemo(() => {
    if (selection.selectedNodeIds.length === 0) {
      return [];
    }

    // For now, return all sections since we don't have access to the actual nodes
    // In a real implementation, we'd get the node types and filter accordingly
    return PropertyRegistry.getSections();
  }, [selection.selectedNodeIds]);

  if (selection.selectedNodeIds.length === 0) {
    return (
      <div
        className={`properties-panel ${className}`}
        style={{
          width: 280,
          height: "100%",
          backgroundColor: tokens.color.background.primary,
          borderLeft: `${tokens.borderWidth.sm}px solid ${tokens.color.border.subtle}`,
          padding: tokens.space.lg,
          overflowY: "auto",
          ...style,
        }}
      >
        <div
          className="properties-panel-empty"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: 200,
            textAlign: "center",
          }}
        >
          <div
            className="empty-icon"
            style={{
              fontSize: 48,
              marginBottom: tokens.space.lg,
              opacity: 0.5,
            }}
          >
            🎯
          </div>
          <h3
            style={{
              margin: `0 0 ${tokens.space.sm}px 0`,
              fontSize: tokens.type.size.lg,
              fontWeight: tokens.type.weight.semibold,
              color: tokens.color.text.primary,
            }}
          >
            No Selection
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: tokens.type.size.sm,
              color: tokens.color.text.secondary,
              lineHeight: tokens.type.lineHeight.normal,
            }}
          >
            Select an element to edit its properties
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`properties-panel ${className}`}
      style={{
        width: 280,
        height: "100%",
        backgroundColor: tokens.color.background.primary,
        borderLeft: `${tokens.borderWidth.sm}px solid ${tokens.color.border.subtle}`,
        overflowY: "auto",
        ...style,
      }}
    >
      <div
        className="properties-panel-header"
        style={{
          padding: tokens.space.lg,
          borderBottom: `${tokens.borderWidth.sm}px solid ${tokens.color.border.subtle}`,
          backgroundColor: tokens.color.background.secondary,
        }}
      >
        <h2
          className="panel-title"
          style={{
            margin: `0 0 ${tokens.space.xs}px 0`,
            fontSize: tokens.type.size.md,
            fontWeight: tokens.type.weight.semibold,
            color: tokens.color.text.primary,
          }}
        >
          Properties
        </h2>
        <div
          className="selection-info"
          style={{
            fontSize: tokens.type.size.xs,
            color: tokens.color.text.secondary,
            margin: 0,
          }}
        >
          {selection.selectedNodeIds.length} element
          {selection.selectedNodeIds.length !== 1 ? "s" : ""} selected
        </div>
      </div>

      <div className="properties-panel-content">
        {sections.map((section) => (
          <PropertySectionComponent
            key={section.id}
            section={section}
            selection={selection}
            onPropertyChange={(event) => {
              onPropertyChange?.(event);
            }}
            getPropertyValue={(_propertyKey) => {
              // TODO: Get actual value from nodes
              return undefined;
            }}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * PropertySection component that groups related properties
 */
export const PropertySectionComponent: React.FC<
  PropertySectionProps & {
    getPropertyValue?: (propertyKey: string) => PropertyValue | "mixed";
  }
> = ({
  section,
  selection,
  onPropertyChange,
  getPropertyValue,
  className = "",
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(
    section.defaultCollapsed ?? false
  );

  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div
      className={`property-section ${className}`}
      style={{
        borderBottom: `${tokens.borderWidth.sm}px solid ${tokens.color.border.subtle}`,
      }}
    >
      <div
        className="section-header"
        onClick={toggleCollapsed}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `${tokens.space.md}px ${tokens.space.lg}px`,
          cursor: "pointer",
          backgroundColor: tokens.color.background.secondary,
          transition: `background-color ${tokens.transition || "0.15s ease"}`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor =
            tokens.color.background.tertiary;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor =
            tokens.color.background.secondary;
        }}
      >
        <div
          className="section-title"
          style={{
            display: "flex",
            alignItems: "center",
            gap: tokens.space.sm,
          }}
        >
          {section.icon && (
            <span
              className="section-icon"
              style={{
                fontSize: tokens.type.size.md,
                opacity: 0.8,
              }}
            >
              {section.icon}
            </span>
          )}
          <h3
            className="section-label"
            style={{
              margin: 0,
              fontSize: tokens.type.size.sm,
              fontWeight: tokens.type.weight.semibold,
              color: tokens.color.text.primary,
            }}
          >
            {section.label}
          </h3>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className={`section-toggle ${isCollapsed ? "collapsed" : "expanded"}`}
          aria-label={isCollapsed ? "Expand section" : "Collapse section"}
          onClick={(e) => {
            e.stopPropagation();
            toggleCollapsed();
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            style={{
              transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
              transition: "transform 0.15s ease",
            }}
          >
            <path
              d="M6 3l3 3-3 3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Button>
      </div>

      {!isCollapsed && (
        <div
          className="section-content"
          style={{
            padding: `${tokens.space.sm}px 0`,
            backgroundColor: tokens.color.background.primary,
          }}
        >
          {section.properties.map((property) => (
            <PropertyEditor
              key={property.key}
              definition={property}
              value={
                getPropertyValue ? getPropertyValue(property.key) : undefined
              }
              onChange={(value) => {
                // Create a property change event for the first selected node
                if (selection.selectedNodeIds.length > 0) {
                  const event = {
                    nodeId: selection.selectedNodeIds[0],
                    propertyKey: property.key,
                    oldValue: getPropertyValue
                      ? getPropertyValue(property.key)
                      : undefined,
                    newValue: value,
                    sectionId: section.id,
                  };
                  onPropertyChange(event);
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Individual property editor component
 */
export const PropertyEditor: React.FC<{
  definition: any;
  value: PropertyValue | "mixed" | undefined;
  onChange: (value: PropertyValue) => void;
  disabled?: boolean;
  className?: string;
}> = ({ definition, value, onChange, disabled = false, className = "" }) => {
  const [inputValue, setInputValue] = React.useState(value);
  const [error, setError] = React.useState<string | null>(null);

  // Update local state when prop value changes
  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleChange = React.useCallback(
    (newValue: any) => {
      setInputValue(newValue);
      setError(null);

      // Basic validation
      if (definition.type === "number") {
        const num =
          typeof newValue === "number" ? newValue : parseFloat(newValue);
        if (isNaN(num)) {
          setError("Must be a valid number");
          return;
        }

        if (definition.min !== undefined && num < definition.min) {
          setError(`Must be at least ${definition.min}`);
          return;
        }

        if (definition.max !== undefined && num > definition.max) {
          setError(`Must be at most ${definition.max}`);
          return;
        }
      }

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
          <textarea
            value={(inputValue as string) || ""}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={definition.placeholder}
            disabled={disabled}
            style={{
              width: "100%",
              padding: `${tokens.space.sm}px ${tokens.space.md}px`,
              border: `${tokens.borderWidth.sm}px solid ${
                error
                  ? tokens.color.semantic.error
                  : tokens.color.border.default
              }`,
              borderRadius: tokens.radius.md,
              fontSize: tokens.type.size.sm,
              fontFamily: tokens.type.family.sans,
              backgroundColor: tokens.color.background.primary,
              color: tokens.color.text.primary,
              resize: definition.multiline ? "vertical" : "none",
              minHeight: definition.multiline ? "60px" : "36px",
              transition: "border-color 0.15s ease",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = tokens.color.interactive.primary;
              e.target.style.outline = `2px solid ${tokens.color.interactive.primary}40`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = error
                ? tokens.color.semantic.error
                : tokens.color.border.default;
              e.target.style.outline = "none";
            }}
          />
        );

      case "number":
        return (
          <div style={{ position: "relative", width: "100%" }}>
            <input
              type="number"
              value={(inputValue as number) || ""}
              onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
              min={definition.min}
              max={definition.max}
              step={definition.step || 1}
              disabled={disabled}
              style={{
                width: "100%",
                padding: `${tokens.space.sm}px ${tokens.space.md}px`,
                paddingRight:
                  definition.category === "typography" &&
                  definition.key.includes("size")
                    ? "24px"
                    : `${tokens.space.md}px`,
                border: `${tokens.borderWidth.sm}px solid ${
                  error
                    ? tokens.color.semantic.error
                    : tokens.color.border.default
                }`,
                borderRadius: tokens.radius.md,
                fontSize: tokens.type.size.sm,
                fontFamily: tokens.type.family.sans,
                backgroundColor: tokens.color.background.primary,
                color: tokens.color.text.primary,
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = tokens.color.interactive.primary;
                e.target.style.outline = `2px solid ${tokens.color.interactive.primary}40`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = error
                  ? tokens.color.semantic.error
                  : tokens.color.border.default;
                e.target.style.outline = "none";
              }}
            />
            {definition.category === "typography" &&
              definition.key.includes("size") && (
                <span
                  style={{
                    position: "absolute",
                    right: tokens.space.md,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: tokens.type.size.xs,
                    color: tokens.color.text.tertiary,
                    pointerEvents: "none",
                  }}
                >
                  px
                </span>
              )}
          </div>
        );

      case "boolean":
        return (
          <input
            type="checkbox"
            checked={(inputValue as boolean) || false}
            onChange={(e) => handleChange(e.target.checked)}
            disabled={disabled}
            style={{
              width: "16px",
              height: "16px",
              cursor: disabled ? "not-allowed" : "pointer",
            }}
          />
        );

      case "select":
        return (
          <select
            value={(inputValue as string) || ""}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            style={{
              width: "100%",
              padding: `${tokens.space.sm}px ${tokens.space.md}px`,
              border: `${tokens.borderWidth.sm}px solid ${
                error
                  ? tokens.color.semantic.error
                  : tokens.color.border.default
              }`,
              borderRadius: tokens.radius.md,
              fontSize: tokens.type.size.sm,
              fontFamily: tokens.type.family.sans,
              backgroundColor: tokens.color.background.primary,
              color: tokens.color.text.primary,
              cursor: disabled ? "not-allowed" : "pointer",
              transition: "border-color 0.15s ease",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = tokens.color.interactive.primary;
              e.target.style.outline = `2px solid ${tokens.color.interactive.primary}40`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = error
                ? tokens.color.semantic.error
                : tokens.color.border.default;
              e.target.style.outline = "none";
            }}
          >
            <option value="">{definition.placeholder || "Select..."}</option>
            {definition.options?.map((option: any) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case "color":
        return (
          <div style={{ display: "flex", gap: tokens.space.sm, width: "100%" }}>
            <input
              type="color"
              value={typeof inputValue === "string" ? inputValue : "#000000"}
              onChange={(e) => handleChange(e.target.value)}
              disabled={disabled}
              style={{
                width: "32px",
                height: "32px",
                padding: 0,
                border: `${tokens.borderWidth.sm}px solid ${
                  error
                    ? tokens.color.semantic.error
                    : tokens.color.border.default
                }`,
                borderRadius: tokens.radius.md,
                cursor: disabled ? "not-allowed" : "pointer",
                backgroundColor: "transparent",
              }}
            />
            <input
              type="text"
              value={displayValue}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="#000000"
              disabled={disabled}
              style={{
                flex: 1,
                padding: `${tokens.space.sm}px ${tokens.space.md}px`,
                border: `${tokens.borderWidth.sm}px solid ${
                  error
                    ? tokens.color.semantic.error
                    : tokens.color.border.default
                }`,
                borderRadius: tokens.radius.md,
                fontSize: tokens.type.size.sm,
                fontFamily: tokens.type.family.mono,
                backgroundColor: tokens.color.background.primary,
                color: tokens.color.text.primary,
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = tokens.color.interactive.primary;
                e.target.style.outline = `2px solid ${tokens.color.interactive.primary}40`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = error
                  ? tokens.color.semantic.error
                  : tokens.color.border.default;
                e.target.style.outline = "none";
              }}
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
            style={{
              width: "100%",
              padding: `${tokens.space.sm}px ${tokens.space.md}px`,
              border: `${tokens.borderWidth.sm}px solid ${
                error
                  ? tokens.color.semantic.error
                  : tokens.color.border.default
              }`,
              borderRadius: tokens.radius.md,
              fontSize: tokens.type.size.sm,
              fontFamily: tokens.type.family.sans,
              backgroundColor: tokens.color.background.primary,
              color: tokens.color.text.primary,
              transition: "border-color 0.15s ease",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = tokens.color.interactive.primary;
              e.target.style.outline = `2px solid ${tokens.color.interactive.primary}40`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = error
                ? tokens.color.semantic.error
                : tokens.color.border.default;
              e.target.style.outline = "none";
            }}
          />
        );
    }
  };

  return (
    <div
      className={`property-editor ${className}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: tokens.space.md,
        padding: `${tokens.space.sm}px ${tokens.space.lg}px`,
        minHeight: "36px",
      }}
    >
      <div
        className="property-label"
        style={{
          flex: "0 0 80px",
          fontSize: tokens.type.size.xs,
          color: tokens.color.text.secondary,
          textAlign: "right",
          fontWeight: tokens.type.weight.medium,
        }}
      >
        <label title={definition.description}>{definition.label}</label>
      </div>
      <div
        className="property-input-container"
        style={{
          flex: 1,
          position: "relative",
          display: "flex",
          alignItems: "center",
        }}
      >
        {renderInput()}
        {error && (
          <div
            className="property-error"
            title={error}
            style={{
              position: "absolute",
              right: tokens.space.sm,
              top: "50%",
              transform: "translateY(-50%)",
              color: tokens.color.semantic.error,
              fontSize: tokens.type.size.md,
              cursor: "help",
            }}
          >
            ⚠️
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Format a property value for display
 */
function formatPropertyValue(value: PropertyValue, definition: any): string {
  if (value == null) {return "";}

  switch (definition.type) {
    case "number":
      const num =
        typeof value === "number" ? value : parseFloat(value as string);
      if (definition.precision !== undefined) {
        return num.toFixed(definition.precision);
      }
      return num.toString();

    case "color":
      if (typeof value === "string") {
        return value;
      }
      if (typeof value === "object" && value !== null) {
        const color = value as { r: number; g: number; b: number; a?: number };
        if (color.a !== undefined) {
          return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
        }
        return `rgb(${color.r}, ${color.g}, ${color.b})`;
      }
      return "";

    case "boolean":
      return value ? "Yes" : "No";

    default:
      return String(value);
  }
}
