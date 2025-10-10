/**
 * @fileoverview Property section component
 * @author @darianrosebrook
 */

import React, { useState } from "react";
import { PropertyEditor } from "./PropertyEditor.js";
import type { PropertySectionProps, PropertyValue } from "./types.js";

/**
 * Property section component that groups related properties
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
  fonts,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(
    section.defaultCollapsed ?? false
  );

  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`property-section ${className}`}>
      <div className="section-header" onClick={toggleCollapsed}>
        <div className="section-title">
          {section.icon && <span className="section-icon">{section.icon}</span>}
          <h3 className="section-label">{section.label}</h3>
        </div>
        <button
          className={`section-toggle ${isCollapsed ? "collapsed" : "expanded"}`}
          aria-label={isCollapsed ? "Expand section" : "Collapse section"}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d={isCollapsed ? "M3 6l3-3 3 3" : "M6 3l3 3-3 3"}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {!isCollapsed && (
        <div className="section-content">
          {section.properties.map((property) => {
            const propertyValue = getPropertyValue
              ? getPropertyValue(property.key)
              : undefined;
            const isMixed = propertyValue === "mixed";

            return (
              <div
                key={property.key}
                className={`property-row ${
                  isMixed ? "property-row-mixed" : ""
                }`}
              >
                <PropertyEditor
                  definition={property}
                  value={propertyValue === "mixed" ? undefined : propertyValue}
                  disabled={selection.selectedNodeIds.length === 0}
                  className={isMixed ? "mixed-value" : undefined}
                  fonts={fonts}
                  tokens={(globalThis as any).designTokens}
                  onChange={(value) => {
                    if (selection.selectedNodeIds.length === 0) {
                      return;
                    }

                    const nodeId = selection.focusedNodeId
                      ? selection.focusedNodeId
                      : selection.selectedNodeIds[0];

                    const event = {
                      nodeId,
                      propertyKey: property.key,
                      oldValue:
                        propertyValue === "mixed" ? undefined : propertyValue,
                      newValue: value,
                      sectionId: section.id,
                    };
                    onPropertyChange(event);
                  }}
                />
                {isMixed && (
                  <span className="mixed-indicator" title="Multiple values">
                    —
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/**
 * CSS styles for property sections
 */
export const propertySectionStyles = `
.property-section {
  border-bottom: 1px solid #e1e5e9;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  background-color: #f8f9fa;
  transition: background-color 0.15s ease;
}

.section-header:hover {
  background-color: #e9ecef;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-icon {
  font-size: 14px;
  opacity: 0.8;
}

.section-label {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
}

.section-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  cursor: pointer;
  color: #6c757d;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.section-toggle:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #495057;
}

.section-toggle.collapsed svg {
  transform: rotate(-90deg);
}

.section-content {
  padding: 8px 0;
  background-color: #ffffff;
}
`;
