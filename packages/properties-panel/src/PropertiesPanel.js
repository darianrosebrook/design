import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @fileoverview Main properties panel component
 * @author @darianrosebrook
 */
import React, { useMemo } from "react";
import { PropertyRegistry } from "./property-registry";
import { PropertySectionComponent } from "./PropertySection";
import { useProperties } from "./use-properties";
/**
 * Main properties panel component
 */
export const PropertiesPanel = ({
  selection: externalSelection,
  onPropertyChange,
  onSelectionChange,
  className = "",
  style = {},
}) => {
  // Use the properties hook for state management
  const {
    selection,
    updateSelection,
    handlePropertyChange,
    getCurrentPropertyValue,
  } = useProperties();
  // Use external selection if provided, otherwise use internal state
  const currentSelection = externalSelection || selection;
  // Get applicable sections for the current selection
  const sections = useMemo(() => {
    if (currentSelection.selectedNodeIds.length === 0) {
      return [];
    }
    // For now, return all sections since we don't have access to the actual nodes
    // In a real implementation, we'd get the node types and filter accordingly
    return PropertyRegistry.getSections();
  }, [currentSelection.selectedNodeIds]);
  // Handle selection changes
  React.useEffect(() => {
    if (externalSelection !== undefined && onSelectionChange !== undefined) {
      updateSelection(externalSelection);
    }
  }, [externalSelection, updateSelection, onSelectionChange]);
  if (currentSelection.selectedNodeIds.length === 0) {
    return _jsx("div", {
      className: `properties-panel ${className}`,
      style: {
        width: 280,
        height: "100%",
        backgroundColor: "#f8f9fa",
        borderLeft: "1px solid #e1e5e9",
        padding: "16px",
        overflowY: "auto",
        ...style,
      },
      children: _jsx("div", {
        className: "properties-panel-empty",
        children: _jsxs("div", {
          className: "empty-state",
          children: [
            _jsx("div", { className: "empty-icon", children: "\uD83C\uDFAF" }),
            _jsx("h3", { children: "No Selection" }),
            _jsx("p", { children: "Select an element to edit its properties" }),
          ],
        }),
      }),
    });
  }
  return _jsxs("div", {
    className: `properties-panel ${className}`,
    style: {
      width: 280,
      height: "100%",
      backgroundColor: "#ffffff",
      borderLeft: "1px solid #e1e5e9",
      overflowY: "auto",
      ...style,
    },
    children: [
      _jsxs("div", {
        className: "properties-panel-header",
        children: [
          _jsx("h2", { className: "panel-title", children: "Properties" }),
          _jsxs("div", {
            className: "selection-info",
            children: [
              currentSelection.selectedNodeIds.length,
              " element",
              currentSelection.selectedNodeIds.length !== 1 ? "s" : "",
              " selected",
            ],
          }),
        ],
      }),
      _jsx("div", {
        className: "properties-panel-content",
        children: sections.map((section) =>
          _jsx(
            PropertySectionComponent,
            {
              section: section,
              selection: currentSelection,
              onPropertyChange: (event) => {
                handlePropertyChange(event);
                onPropertyChange?.(event);
              },
              getPropertyValue: getCurrentPropertyValue,
            },
            section.id
          )
        ),
      }),
    ],
  });
};
/**
 * CSS styles for the properties panel
 */
export const propertiesPanelStyles = `
.properties-panel {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  line-height: 1.4;
  color: #333333;
}

.properties-panel-header {
  padding: 16px;
  border-bottom: 1px solid #e1e5e9;
  background-color: #f8f9fa;
}

.panel-title {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

.selection-info {
  font-size: 12px;
  color: #6c757d;
  margin: 0;
}

.properties-panel-content {
  padding: 0;
}

.properties-panel-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  text-align: center;
}

.empty-state {
  padding: 24px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.empty-state p {
  margin: 0;
  font-size: 13px;
  color: #6c757d;
  line-height: 1.4;
}

/* Responsive design */
@media (max-width: 768px) {
  .properties-panel {
    width: 100% !important;
    border-left: none;
    border-top: 1px solid #e1e5e9;
  }
}
`;
