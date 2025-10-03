import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @fileoverview Property section component
 * @author @darianrosebrook
 */
import { useState } from "react";
import { PropertyEditor } from "./PropertyEditor";
/**
 * Property section component that groups related properties
 */
export const PropertySectionComponent = ({ section, selection, onPropertyChange, getPropertyValue, className = "", }) => {
    const [isCollapsed, setIsCollapsed] = useState(section.defaultCollapsed ?? false);
    const toggleCollapsed = () => {
        setIsCollapsed(!isCollapsed);
    };
    return (_jsxs("div", { className: `property-section ${className}`, children: [_jsxs("div", { className: "section-header", onClick: toggleCollapsed, children: [_jsxs("div", { className: "section-title", children: [section.icon && _jsx("span", { className: "section-icon", children: section.icon }), _jsx("h3", { className: "section-label", children: section.label })] }), _jsx("button", { className: `section-toggle ${isCollapsed ? "collapsed" : "expanded"}`, "aria-label": isCollapsed ? "Expand section" : "Collapse section", children: _jsx("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", children: _jsx("path", { d: isCollapsed ? "M3 6l3-3 3 3" : "M6 3l3 3-3 3", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) }) })] }), !isCollapsed && (_jsx("div", { className: "section-content", children: section.properties.map((property) => (_jsx(PropertyEditor, { definition: property, value: getPropertyValue ? getPropertyValue(property.key) : undefined, onChange: (value) => {
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
                    } }, property.key))) }))] }));
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
